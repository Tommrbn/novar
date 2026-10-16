using System.Net;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace Novar.Web.Tests;

public sealed class TreatmentPerformanceTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Theory]
    [InlineData("uv")]
    [InlineData("blue-tech")]
    [InlineData("antirraya")]
    [InlineData("polarizado")]
    [InlineData("hidrofobico")]
    [InlineData("ilux")]
    [InlineData("fotosensible")]
    public async Task VideoMarkupCannotEagerlyFetchOriginalsOrStartNativePlayback(string id)
    {
        var html = WebUtility.HtmlDecode(await factory.CreateClient().GetStringAsync("/tratamientos"));
        var panel = Regex.Match(html, $"<section id=\"{id}\"[\\s\\S]*?</section>").Value;
        var video = Assert.Single(Regex.Matches(panel, "<video\\b[^>]*>").Cast<Match>()).Value;
        foreach (var attribute in new[] { " muted", " playsinline", " hidden", "preload=\"none\"", "data-treatment-video" })
            Assert.Contains(attribute, video);
        Assert.DoesNotContain(" src=", video);
        Assert.DoesNotContain(" autoplay", video);
        Assert.DoesNotContain(" controls", video);
        Assert.DoesNotContain(" poster=", video);
        Assert.DoesNotContain("<source", panel);
        Assert.Contains($"data-treatment-desktop=\"/media/treatments/optimized/{id}-desktop.mp4\"", video);
        Assert.Contains($"data-treatment-mobile=\"/media/treatments/optimized/{id}-mobile.mp4\"", video);
        Assert.Contains(" loop", video);
    }

    [Fact]
    public async Task SevenResponsiveAuthenticPostersRemainVisibleWithoutJavascript()
    {
        var html = WebUtility.HtmlDecode(await factory.CreateClient().GetStringAsync("/tratamientos"));
        foreach (var id in new[] { "uv", "blue-tech", "antirraya", "polarizado", "hidrofobico", "fotosensible", "ilux" })
        {
            var panel = Regex.Match(html, $"<section id=\"{id}\"[\\s\\S]*?</section>").Value;
            if (id == "blue-tech")
            {
                Assert.Contains("<img data-treatment-fallback hidden", panel);
                panel = Regex.Match(panel, "<noscript>[\\s\\S]*?</noscript>").Value;
            }
            var image = Regex.Match(panel, "<img[^>]*src=\"/media/treatments/optimized/[^>]*>").Value;
            Assert.NotEmpty(image);
            Assert.Contains("srcset=", image);
            Assert.Contains("loading=\"lazy\"", image);
            Assert.Contains("decoding=\"async\"", image);
            Assert.DoesNotContain(" hidden", image);
            Assert.Contains($"/{id}-poster-640.webp", image);
            Assert.Contains($"/{id}-poster-1920.webp", image);
            Assert.DoesNotContain("src=\"/media/figma/16fed.png\"", panel);
            if (id != "blue-tech") Assert.Contains("<video", panel);
        }
    }

    [Fact]
    public void ManifestMatchesOriginalAndDerivativeBytesAndVerifiedMetadata()
    {
        var environment = factory.Services.GetRequiredService<IWebHostEnvironment>();
        var root = Path.GetFullPath(Path.Combine(environment.ContentRootPath, "../.."));
        using var manifest = JsonDocument.Parse(File.ReadAllText(Path.Combine(root, "docs/treatments-optimized-media.json")));
        var assets = manifest.RootElement.GetProperty("assets").EnumerateArray().ToArray();
        Assert.Equal(35, assets.Length);
        Assert.Equal(14, assets.Count(asset => asset.GetProperty("kind").GetString() == "video"));
        foreach (var asset in assets)
        {
            foreach (var kind in new[] { "source", "delivery" })
            {
                var path = Path.Combine(environment.WebRootPath, asset.GetProperty($"{kind}_url").GetString()!.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                Assert.Equal(asset.GetProperty($"{kind}_bytes").GetInt64(), new FileInfo(path).Length);
                using var stream = File.OpenRead(path);
                Assert.Equal(asset.GetProperty($"{kind}_sha256").GetString(), Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant());
            }
            if (asset.GetProperty("kind").GetString() != "video") continue;
            Assert.True(asset.GetProperty("faststart").GetBoolean());
            var original = asset.GetProperty("source_video");
            var video = asset.GetProperty("video");
            Assert.Equal(original.GetProperty("nb_frames").GetString(), video.GetProperty("nb_frames").GetString());
            Assert.Equal(original.GetProperty("avg_frame_rate").GetString(), video.GetProperty("avg_frame_rate").GetString());
            Assert.Equal("h264", video.GetProperty("codec_name").GetString());
            Assert.Equal("yuv420p", video.GetProperty("pix_fmt").GetString());
            Assert.Equal(asset.GetProperty("source_audio_packets").GetRawText(), asset.GetProperty("audio_packets").GetRawText());
        }
    }

    [Fact]
    public async Task OptimizedVideoSupportsByteRanges()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/media/treatments/optimized/uv-mobile.mp4");
        request.Headers.Range = new(0, 31);
        using var response = await factory.CreateClient().SendAsync(request);
        Assert.Equal(HttpStatusCode.PartialContent, response.StatusCode);
        Assert.Equal("video/mp4", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(32, (await response.Content.ReadAsByteArrayAsync()).Length);
    }
}
