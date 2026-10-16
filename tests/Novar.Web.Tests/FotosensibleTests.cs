using System.Net;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Novar.Web.Services;

namespace Novar.Web.Tests;

public sealed class FotosensibleTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task FotosensiblePreservesSourceCopyAndReportsNoInventedEditorialCorrection()
    {
        var content = factory.Services.GetRequiredService<SiteContent>().Treatments;
        var detail = Assert.Single(content.Details, item => item.Id == "fotosensible");
        Assert.Equal("967:10198", detail.SourceNode);
        Assert.Equal("Fotosensible", detail.Name);
        Assert.Equal("Tecnología adicional para que sus lentes se adapten instantáneamente a los distintos ambientes por cambios de luz. Claras y transparentes para ambientes internos y oscuras ante la exposición al sol.", detail.Description);
        Assert.Equal(new[] { "Siempre limpio", "El agua no de adhiere", "Mantiene la claridad" }, detail.Benefits);
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/tratamientos"));
        var panel = Regex.Match(html, "<section id=\"fotosensible\"[\\s\\S]*?</section>").Value;
        Assert.Contains("data-figma-node=\"967:10192\"", panel);
        Assert.Contains("data-figma-node=\"I967:10194;1:2038\"", panel);
        Assert.Contains(detail.Description, panel);
        Assert.All(detail.Benefits, benefit => Assert.Contains(benefit, panel));
        Assert.DoesNotContain("El agua no se adhiere", panel);
        Assert.Equal("Se adapta a la luz.", content.Comparison[5].Description);
        Assert.Equal(new[] { "Oscurece afuera", "Aclara adentro" }, content.Comparison[5].Benefits);
        Assert.DoesNotContain("También podés ver Fotosensible.", html);
    }

    [Fact]
    public async Task SixNativeFragmentsRemainReachableWithoutJavascriptOrNewRoutes()
    {
        var html = await client.GetStringAsync("/tratamientos");
        foreach (var id in new[] { "uv", "blue-tech", "antirraya", "polarizado", "hidrofobico", "fotosensible" })
        {
            Assert.Contains($"href=\"#{id}\" data-treatment-link=\"{id}\"", html);
            var opening = Regex.Match(html, $"<section id=\"{id}\"[^>]*>").Value;
            Assert.NotEmpty(opening);
            Assert.Contains($"aria-labelledby=\"treatment-{id}-title\"", opening);
            Assert.DoesNotContain(" hidden", opening);
            Assert.DoesNotContain("aria-hidden", opening);
        }
        Assert.Contains("<section id=\"ilux\"", html);
        Assert.Equal("08E6C116A0D2BE8B54F28FE173633514604A5A1E0B4F85CCA3D04E6FFF8D5EA5",
            Convert.ToHexString(SHA256.HashData(await client.GetByteArrayAsync("/js/treatments.js"))));
    }

    [Fact]
    public async Task FotosensibleUsesAuthenticPreviewAndLazySilentVideoWithoutScannerControls()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/tratamientos"));
        var panel = Regex.Match(html, "<section id=\"fotosensible\"[\\s\\S]*?</section>").Value;
        Assert.Contains("src=\"/media/treatments/optimized/fotosensible-poster-1280.webp\"", panel);
        var video = Assert.Single(Regex.Matches(panel, "<video\\b[^>]*>").Cast<Match>()).Value;
        Assert.Contains("data-treatment-video", video);
        Assert.Contains("preload=\"none\"", video);
        Assert.Contains("data-treatment-desktop=\"/media/treatments/optimized/fotosensible-desktop.mp4\"", video);
        Assert.Contains("data-treatment-mobile=\"/media/treatments/optimized/fotosensible-mobile.mp4\"", video);
        Assert.Contains(" loop", video);
        foreach (var absent in new[] { " src=", " autoplay", " controls" }) Assert.DoesNotContain(absent, video);
        Assert.Contains("data-treatment-fallback", panel);

        Assert.Contains("width=\"2752\" height=\"1536\"", panel);
        Assert.Contains("alt=\"Mujer con gafas oscuras", panel);
        Assert.Equal(3, Regex.Matches(panel, "src=\"/media/figma/7bc95.svg\"").Count);
        foreach (var absent in new[] { "16fed.png", "dd2a0.png", "b9b6a.svg", "<button", "<input", "type=\"range\"", "role=\"slider\"" })
            Assert.DoesNotContain(absent, panel);
        var original = await client.GetByteArrayAsync("/media/figma/23aae.png");
        Assert.Equal(2600250, original.Length);
        Assert.Equal(0xff, original[0]);
        Assert.Equal(0xd8, original[1]);
        Assert.Equal("4A804FE7BE6980C75C91EB8285BC260A3831A9BF9C8B461ABE5B538DCC8CB076",
            Convert.ToHexString(SHA256.HashData(original)));
    }

    [Fact]
    public async Task FotosensiblePreservesDistinctSourceCropTypographyAndScopedLogoReuse()
    {
        var css = await client.GetStringAsync("/css/treatments.css");
        Assert.Contains(".treatment-fotosensible-photo { height: 680px; margin-top: -89px; overflow: hidden; }", css);
        Assert.Contains(".treatment-fotosensible-image-plane { position: relative; width: 116.944444%; aspect-ratio: 1684 / 937.696; margin-left: -10.138889%; overflow: hidden; }", css);
        Assert.Contains(".treatment-fotosensible-image { position: absolute; top: -12.48%; left: -16%; display: block; width: 124.65%; height: 124.95%; max-width: none; }", css);
        Assert.Contains(".treatments-content[data-active-treatment=\"fotosensible\"] .treatments-tabs-active { left: 786.792px; top: 51px; }", css);
        Assert.Contains(".treatments-content[data-active-treatment=\"fotosensible\"] .treatments-tabs a[aria-selected=\"true\"] { font-weight: 700; }", css);
        Assert.Contains(".treatments-page[data-active-treatment=\"fotosensible\"] .navbar-brand > img:not(.treatments-header-logo-polarizado),", css);
        Assert.Contains(".treatments-content[data-active-treatment=\"fotosensible\"] .treatments-hero-logo-polarizado { display: block; }", css);
        Assert.Contains(".treatments-page[data-active-treatment=\"fotosensible\"] .treatments-linkedin-blue-tech { display: block; }", css);
        Assert.Contains(".treatment-fotosensible-description { margin-top: 0; font-size: 14px; line-height: 21px; }", css);
        Assert.Contains(".treatment-fotosensible-benefits li:nth-child(3) > span:last-child { width: calc(100% - 40px); margin-left: 40px; }", css);
        Assert.Equal(await client.GetByteArrayAsync("/media/figma/1db5c.svg"), await client.GetByteArrayAsync("/media/figma/b21e2.svg"));
    }

    [Fact]
    public async Task FotosensibleBandMatchesMajorityHeightWhilePreservingOriginalPreviewCrop()
    {
        var css = await client.GetStringAsync("/css/treatments.css");
        Assert.Contains(".treatment-fotosensible-photo { height: 680px; margin-top: -89px; overflow: hidden; }", css);
        Assert.Contains(".treatment-fotosensible-image-plane { position: relative; width: 116.944444%; aspect-ratio: 1684 / 937.696; margin-left: -10.138889%; overflow: hidden; }", css);
        Assert.Contains(".treatment-fotosensible-photo { margin-top: -24px; }", css);
        var planes = Regex.Matches(css, @"\.treatment-fotosensible-image-plane\s*\{[^}]*\}");
        Assert.Single(planes.Cast<Match>());
        Assert.Contains("[data-treatment-media]:not(.treatment-uv-photo) { height: clamp(220px, 56.25vw, 580px); }", css);
        Assert.DoesNotContain(":not(.treatment-fotosensible-photo)", css);
        foreach (var name in new[] { "blue-tech", "polarizado", "hidrofobico", "ilux" })
            Assert.Contains($".treatment-{name}-photo {{ height: 680px;", css);
    }

    [Fact]
    public async Task FotosensibleStillPlaneFillsMinimumPhoneBandWithoutChangingSourceCrop()
    {
        var css = await client.GetStringAsync("/css/treatments.css");
        Assert.Contains(".treatment-detail-fotosensible [data-treatment-media] > div { z-index: 2; pointer-events: none; min-height: 100%; }", css);
        Assert.Contains("aspect-ratio: 1684 / 937.696; margin-left: -10.138889%;", css);
        Assert.Contains("top: -12.48%; left: -16%;", css);
    }

    [Theory]
    [InlineData("/")]
    [InlineData("/lentes/first")]
    [InlineData("/sobre-nosotros")]
    [InlineData("/juegos")]
    public async Task FotosensibleDoesNotLeakIntoOtherPageMarkup(string path)
    {
        var html = await client.GetStringAsync(path);
        Assert.DoesNotContain("treatment-detail-fotosensible", html);
        Assert.DoesNotContain("treatments-fotosensible-v1", html);
        Assert.DoesNotContain("/media/figma/23aae.png", html);
    }

    [Fact]
    public async Task HumanMappedFotosensibleOriginalRetainsBytesAndByteRanges()
    {
        const long size = 29829038;
        const string path = "/media/treatments/fotosensible.mp4";
        var original = await client.GetByteArrayAsync(path);
        Assert.Equal(size, original.LongLength);
        Assert.Equal("EE041FC569EBB06B16198B3C0473FFF459A864005A119FA8319D9BC46040BAAF",
            Convert.ToHexString(SHA256.HashData(original)));
        using var request = new HttpRequestMessage(HttpMethod.Get, path);
        request.Headers.Range = new(0, 31);
        using var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.PartialContent, response.StatusCode);
        Assert.Equal("video/mp4", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(32, (await response.Content.ReadAsByteArrayAsync()).Length);
    }
}
