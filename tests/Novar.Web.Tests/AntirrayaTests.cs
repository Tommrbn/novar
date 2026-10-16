using System.Net;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Novar.Web.Services;

namespace Novar.Web.Tests;

public sealed class AntirrayaTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task AntirrayaPreservesExactSourceCopyAndBenefits()
    {
        var detail = Assert.Single(factory.Services.GetRequiredService<SiteContent>().Treatments.Details,
            item => item.Id == "antirraya");
        Assert.Equal("961:9374", detail.SourceNode);
        Assert.Equal("Antirraya", detail.Name);
        Assert.Equal("Es una nueva y exclusiva tecnología nanocapa de última generación para proteger la superficie de lentes oftálmicas ante rayas, abrasiones y exposición a productos químicos domésticos e industriales comunes como alcohol, solventes, etc que pueden degradar seriamente las superficies de las lentes en sus gafas.", detail.Description);
        Assert.Equal(new[] { "Mayor durabilidad", "Superficie más resistente", "Mantiene la claridad" }, detail.Benefits);
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/tratamientos"));
        var panel = Regex.Match(html, "<section id=\"antirraya\"[\\s\\S]*?</section>").Value;
        Assert.Contains("data-figma-node=\"961:9368\"", panel);
        Assert.Contains("data-figma-node=\"961:9917\"", panel);
        Assert.Contains(detail.Description, panel);
        Assert.All(detail.Benefits, benefit => Assert.Contains(benefit, panel));
        Assert.Equal(3, Regex.Matches(panel, "src=\"/media/figma/7bc95.svg\"").Count);
    }

    [Fact]
    public async Task UserVideoLoopsMutedAndRetainsOriginalJpegFallback()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/tratamientos"));
        var panel = Regex.Match(html, "<section id=\"antirraya\"[\\s\\S]*?</section>").Value;
        Assert.Contains("/media/treatments/optimized/antirraya-poster-1280.webp", panel);
        Assert.Contains("/media/treatments/optimized/antirraya-poster-1280.webp", panel);
        var video = Regex.Match(panel, "<video[^>]*>").Value;
        foreach (var attribute in new[] { "loop", "muted", "playsinline", "preload=\"none\"", "aria-label=\"Antirraya\"" })
            Assert.Contains(attribute, video);
        Assert.Contains("data-treatment-desktop=\"/media/treatments/optimized/antirraya-desktop.mp4\"", panel);
        Assert.DoesNotContain("data-antirraya-play", panel);
        Assert.DoesNotContain(" controls", video);
        Assert.DoesNotContain("data-antirraya-sound", panel);
        Assert.DoesNotContain("/js/treatment-antirraya.js", html);
        Assert.Contains("la lente de la izquierda presenta rayas", panel);
        foreach (var absent in new[] { "f0cf4.png", "16fed.png", "d517c.svg", "b9b6a.svg", "<input", "type=\"range\"" })
            Assert.DoesNotContain(absent, panel);
        var image = await client.GetByteArrayAsync("/media/figma/3dd09.png");
        Assert.Equal(2975203, image.Length);
        Assert.Equal(0xff, image[0]);
        Assert.Equal(0xd8, image[1]);
        Assert.Equal("766449505E79BB4A85AABC30F3C44404131166ABE559A7768637EA6CBD96A0CF", Convert.ToHexString(SHA256.HashData(image)));
    }

    [Fact]
    public async Task ThirdStateRetainsSemanticNoJavascriptReachabilityAndGenericSelector()
    {
        var html = await client.GetStringAsync("/tratamientos");
        Assert.Contains("href=\"#antirraya\" data-treatment-link=\"antirraya\"", html);
        foreach (var id in new[] { "uv", "blue-tech", "antirraya" })
        {
            var opening = Regex.Match(html, $"<section id=\"{id}\"[^>]*>").Value;
            Assert.NotEmpty(opening);
            Assert.Contains($"aria-labelledby=\"treatment-{id}-title\"", opening);
            Assert.DoesNotContain(" hidden", opening);
            Assert.DoesNotContain("aria-hidden", opening);
        }
        var script = await client.GetByteArrayAsync("/js/treatments.js");
        Assert.Equal("08E6C116A0D2BE8B54F28FE173633514604A5A1E0B4F85CCA3D04E6FFF8D5EA5", Convert.ToHexString(SHA256.HashData(script)));
    }

    [Fact]
    public async Task AntirrayaVideoFillsBandWithoutChangingSummaryOrBenefits()
    {
        var css = await client.GetStringAsync("/css/treatments.css");
        var video = Assert.Single(CssRules(css, ".treatment-antirraya-video"));
        foreach (var declaration in new[] { "width: 100%", "height: 100%", "object-fit: cover" })
            Assert.Contains(declaration, video);

        var bands = CssRules(css, ".treatment-antirraya-photo");
        Assert.Equal(3, bands.Length);
        Assert.Contains("height: 719px", bands[0]);
        Assert.Contains("margin-top: -82px", bands[0]);
        Assert.Contains("overflow: hidden", bands[0]);
        Assert.Contains("height: 580px", bands[1]);
        Assert.Contains("height: 380px", bands[2]);
        Assert.Contains("margin-top: -24px", bands[2]);
        Assert.Contains("border: 1px solid #000", Assert.Single(CssRules(css, ".treatment-antirraya-video-plane::after")));
    }

    [Fact]
    public async Task UserVideoServesOriginalBytesAndByteRanges()
    {
        var response = await client.GetAsync("/media/treatments/antirraya-rayas.mp4");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("video/mp4", response.Content.Headers.ContentType?.MediaType);
        var bytes = await response.Content.ReadAsByteArrayAsync();
        Assert.Equal(27472046, bytes.Length);
        Assert.Equal("DDBB90DA92419DA922CD1F4140175920A5E6F37FC1B4F3EB099C34000A8C0F10", Convert.ToHexString(SHA256.HashData(bytes)));
        using var request = new HttpRequestMessage(HttpMethod.Get, "/media/treatments/antirraya-rayas.mp4");
        request.Headers.Range = new System.Net.Http.Headers.RangeHeaderValue(0, 127);
        var range = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.PartialContent, range.StatusCode);
        Assert.Equal("bytes 0-127/27472046", range.Content.Headers.ContentRange?.ToString());
        Assert.Equal(bytes.Take(128), await range.Content.ReadAsByteArrayAsync());
    }

    private static string[] CssRules(string css, string selector) =>
        Regex.Matches(css, $@"(?m)^\s*{Regex.Escape(selector)}\s*\{{([^}}]*)\}}")
            .Select(match => match.Groups[1].Value)
            .ToArray();

    [Fact]
    public async Task AntirrayaStylesAndExactFooterAssetReuseStayStateScoped()
    {
        var css = await client.GetStringAsync("/css/treatments.css");
        Assert.Contains(".treatment-antirraya-photo { height: 719px; margin-top: -82px; overflow: hidden; }", css);
        Assert.Contains("object-fit: cover", CssRules(css, ".treatment-antirraya-video")[0]);
        Assert.Contains(".treatments-content[data-active-treatment=\"antirraya\"] .treatments-tabs a[aria-selected=\"true\"] { font-weight: 700; }", css);
        Assert.Contains(".treatments-page[data-active-treatment=\"antirraya\"] .treatments-linkedin-blue-tech { display: block; }", css);
        var sourceIcon = await client.GetByteArrayAsync("/media/figma/1db5c.svg");
        var reusedIcon = await client.GetByteArrayAsync("/media/figma/b21e2.svg");
        Assert.Equal(sourceIcon, reusedIcon);
        var html = await client.GetStringAsync("/tratamientos");
        var linkedin = Regex.Match(html, "<button[^>]*data-pending=\"LinkedIn\"[\\s\\S]*?</button>").Value;
        Assert.Equal(2, Regex.Matches(linkedin, "alt=\"\"").Count);
    }
}
