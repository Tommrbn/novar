using System.Net;
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Novar.Web.Tests;

public sealed class HomeMediaTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task HomeVideoPlayersAreMutedLazyAndKeepAccessiblePosterFallbacks()
    {
        var html = await client.GetStringAsync("/");
        Assert.Contains("data-home-media-revision=\"home-media-v1\"", html);
        Assert.Contains("data-home-media-source=\"/media/home/hero-banner.mp4\"", html);
        Assert.Contains("data-home-media-source=\"/media/home/lens-finder.mp4\"", html);

        var videos = System.Text.RegularExpressions.Regex.Matches(html, "<video\\b[^>]*>");
        Assert.Equal(2, videos.Count);
        foreach (System.Text.RegularExpressions.Match video in videos)
        {
            Assert.Contains(" muted", video.Value);
            Assert.Contains(" loop", video.Value);
            Assert.Contains(" playsinline", video.Value);
            Assert.Contains("preload=\"none\"", video.Value);
            Assert.Contains("aria-hidden=\"true\"", video.Value);
            Assert.Contains("tabindex=\"-1\"", video.Value);
            Assert.Contains(" hidden", video.Value);
            Assert.DoesNotContain("autoplay", video.Value, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain(" src=", video.Value, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("poster=\"/media/figma/", video.Value);
        }

        var toggles = System.Text.RegularExpressions.Regex.Matches(html, "<button class=\"home-video-toggle[^>]*>");
        Assert.Equal(2, toggles.Count);
        foreach (System.Text.RegularExpressions.Match toggle in toggles)
        {
            Assert.Contains("aria-controls=\"", toggle.Value);
            Assert.Contains("aria-label=\"Reproducir video", toggle.Value);
            Assert.Contains("data-play-label=\"Reproducir video", toggle.Value);
            Assert.Contains("data-pause-label=\"Pausar video", toggle.Value);
            Assert.Contains(" hidden", toggle.Value);
        }

        Assert.Contains("/js/home-media.js?v=", html);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/js/home-media.js")).StatusCode);
        var otherPage = await client.GetStringAsync("/lentes");
        Assert.DoesNotContain("/js/home-media.js?v=", otherPage);
    }

    [Theory]
    [InlineData("/media/home/hero-banner.mp4", 54_200_678)]
    [InlineData("/media/home/lens-finder.mp4", 4_538_941)]
    public async Task HomeVideosSupportHeadAndOneByteRangeWithoutFullDownload(string path, long expectedLength)
    {
        using var head = new HttpRequestMessage(HttpMethod.Head, path);
        using var headResponse = await client.SendAsync(head);
        Assert.Equal(HttpStatusCode.OK, headResponse.StatusCode);
        Assert.Equal(expectedLength, headResponse.Content.Headers.ContentLength);

        using var range = new HttpRequestMessage(HttpMethod.Get, path);
        range.Headers.Range = new RangeHeaderValue(0, 0);
        using var rangeResponse = await client.SendAsync(range);
        Assert.Equal(HttpStatusCode.PartialContent, rangeResponse.StatusCode);
        Assert.Equal(expectedLength, rangeResponse.Content.Headers.ContentRange?.Length);
        Assert.Equal(new byte[] { 0 }, await rangeResponse.Content.ReadAsByteArrayAsync());
    }
}
