using System.Buffers.Binary;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace Novar.Web.Tests;

public sealed class HomePerformanceTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task DeliveryManifestMatchesOriginalAndDerivativeBytesAndPreservesMediaFacts()
    {
        var environment = factory.Services.GetRequiredService<IWebHostEnvironment>();
        var root = Path.GetFullPath(Path.Combine(environment.ContentRootPath, "..", ".."));
        using var manifest = JsonDocument.Parse(await File.ReadAllTextAsync(Path.Combine(root, "docs", "home-world-optimized-media.json")));
        var assets = manifest.RootElement.GetProperty("assets").EnumerateArray().ToArray();
        Assert.Equal(17, assets.Length);
        Assert.Equal(9, assets.Count(asset => asset.GetProperty("kind").GetString() == "video"));
        long sourceBytes = 0, deliveryBytes = 0;
        foreach (var asset in assets)
        {
            var source = Path.Combine(environment.WebRootPath, asset.GetProperty("source_url").GetString()!.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
            var url = asset.GetProperty("delivery_url").GetString()!;
            Assert.StartsWith("/media/home/optimized/", url);
            var derivative = Path.Combine(environment.WebRootPath, url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
            foreach (var (path, prefix) in new[] { (source, "source"), (derivative, "delivery") })
            {
                await using var stream = File.OpenRead(path);
                Assert.Equal(asset.GetProperty(prefix + "_bytes").GetInt64(), stream.Length);
                Assert.Equal(asset.GetProperty(prefix + "_sha256").GetString(), Convert.ToHexString(await SHA256.HashDataAsync(stream)).ToLowerInvariant());
            }
            sourceBytes += asset.GetProperty("source_bytes").GetInt64();
            deliveryBytes += asset.GetProperty("delivery_bytes").GetInt64();
            if (asset.GetProperty("kind").GetString() != "video") continue;
            var video = asset.GetProperty("video");
            var original = asset.GetProperty("source_video");
            Assert.Equal("h264", video.GetProperty("codec_name").GetString());
            Assert.Equal("yuv420p", video.GetProperty("pix_fmt").GetString());
            Assert.Equal(original.GetProperty("nb_frames").GetString(), video.GetProperty("nb_frames").GetString());
            Assert.Equal(original.GetProperty("avg_frame_rate").GetString(), video.GetProperty("avg_frame_rate").GetString());
            Assert.Equal(original.GetProperty("duration").GetString(), video.GetProperty("duration").GetString());
            Assert.Equal(asset.GetProperty("width").GetInt32(), video.GetProperty("width").GetInt32());
            Assert.Equal(asset.GetProperty("height").GetInt32(), video.GetProperty("height").GetInt32());
            var audio = asset.GetProperty("audio").EnumerateArray().ToArray();
            var originalAudio = asset.GetProperty("source_audio").EnumerateArray().ToArray();
            Assert.Equal(originalAudio.Length, audio.Length);
            Assert.Equal(asset.GetProperty("source_audio_packets").GetRawText(), asset.GetProperty("audio_packets").GetRawText());
            var bytes = await File.ReadAllBytesAsync(derivative);
            var ascii = Encoding.Latin1.GetString(bytes);
            Assert.Contains("avc1", ascii); // Independent AVC sample-entry presence, not only manifest metadata.
            Assert.Equal(audio.Length > 0, ascii.Contains("mp4a", StringComparison.Ordinal));
            var boxes = TopLevelBoxes(bytes).ToArray();
            Assert.Equal("ftyp", boxes[0]);
            Assert.True(Array.IndexOf(boxes, "moov") < Array.IndexOf(boxes, "mdat"), "faststart must precede payload");
        }
        Assert.True(deliveryBytes < 30_000_000, "Bound delivery bytes, not variable Lighthouse scores");
        Assert.True(deliveryBytes < sourceBytes / 5);
    }

    [Fact]
    public async Task OptimizedPostersAndVideosAreServedWithTypesRangesAndSharedFallbackUrls()
    {
        var environment = factory.Services.GetRequiredService<IWebHostEnvironment>();
        var root = Path.GetFullPath(Path.Combine(environment.ContentRootPath, "..", ".."));
        using var manifest = JsonDocument.Parse(await File.ReadAllTextAsync(Path.Combine(root, "docs", "home-world-optimized-media.json")));
        var client = factory.CreateClient();
        foreach (var asset in manifest.RootElement.GetProperty("assets").EnumerateArray())
        {
            var url = asset.GetProperty("delivery_url").GetString()!;
            var video = asset.GetProperty("kind").GetString() == "video";
            using var head = new HttpRequestMessage(HttpMethod.Head, url);
            using var response = await client.SendAsync(head);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Equal(asset.GetProperty("delivery_bytes").GetInt64(), response.Content.Headers.ContentLength);
            Assert.Equal(video ? "video/mp4" : "image/webp", response.Content.Headers.ContentType?.MediaType);
            if (!video) continue;
            using var range = new HttpRequestMessage(HttpMethod.Get, url);
            range.Headers.Range = new RangeHeaderValue(0, 0);
            using var partial = await client.SendAsync(range);
            Assert.Equal(HttpStatusCode.PartialContent, partial.StatusCode);
            Assert.Equal(asset.GetProperty("delivery_bytes").GetInt64(), partial.Content.Headers.ContentRange?.Length);
            Assert.Single(await partial.Content.ReadAsByteArrayAsync());
        }
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/"));
        Assert.Equal(10, Regex.Matches(html, "<video\\b").Count);
        var world = Regex.Match(html, "<section class=\"world-section\"[\\s\\S]*?</section>").Value;
        Assert.Equal(8, Regex.Matches(world, "data-home-media-controls=\"world\"").Count);
        Assert.DoesNotContain(".png", world);
        foreach (Match player in Regex.Matches(html, "<img[^>]*src=\"([^\"]+)\"[^>]*>\\s*<video[^>]*poster=\"([^\"]+)\"[^>]*>"))
            Assert.Equal(player.Groups[1].Value, player.Groups[2].Value);
        Assert.Equal(10, Regex.Matches(html, " muted loop playsinline preload=\"none\"").Count);
    }

    private static IEnumerable<string> TopLevelBoxes(byte[] bytes)
    {
        for (var offset = 0; offset + 8 <= bytes.Length;)
        {
            var size = BinaryPrimitives.ReadUInt32BigEndian(bytes.AsSpan(offset, 4));
            Assert.InRange(size, 8u, (uint)(bytes.Length - offset));
            yield return Encoding.ASCII.GetString(bytes, offset + 4, 4);
            offset += checked((int)size);
        }
    }
}
