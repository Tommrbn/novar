using System.Net;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Novar.Web.Services;

namespace Novar.Web.Tests;

public sealed class PolarizadoTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task PolarizadoPreservesCopyAndOuterGeometryWithInitiallyMutedVideo()
    {
        var detail = Assert.Single(factory.Services.GetRequiredService<SiteContent>().Treatments.Details,
            item => item.Id == "polarizado");
        Assert.Equal("967:9925", detail.SourceNode);
        Assert.Equal("Polarizado", detail.Name);
        Assert.Equal("ADVENTRA es una tecnología anti deslumbrante que atenúa los reflejos originados en las superficies. Ideal para mejorar el contraste y evitar el deslumbramiento en actividades al aire libre.", detail.Description);
        Assert.Equal(new[] { "Máxima claridad", "Filtra la luz reflejada", "Visión más cómoda en exteriores" }, detail.Benefits);
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/tratamientos"));
        var panel = Regex.Match(html, "<section id=\"polarizado\"[\\s\\S]*?</section>").Value;
        Assert.Contains("data-figma-node=\"967:9919\"", panel);
        Assert.Contains("data-figma-node=\"I967:9921;1:2038\"", panel);
        Assert.Contains(detail.Description, panel);
        Assert.All(detail.Benefits, benefit => Assert.Contains(benefit, panel));
        Assert.Equal(3, Regex.Matches(panel, "src=\"/media/figma/7bc95.svg\"").Count);
        var video = Regex.Match(panel, "<video[^>]*>").Value;
        Assert.NotEmpty(video);
        foreach (var attribute in new[] { "muted", "playsinline", "preload=\"none\"", "data-treatment-video" })
            Assert.Contains(attribute, video);
        Assert.DoesNotContain(" autoplay", video);
        Assert.DoesNotContain(" controls", video);
        Assert.Contains(" loop", video);
        Assert.Contains("data-treatment-desktop=\"/media/treatments/optimized/polarizado-desktop.mp4\"", panel);
        Assert.Contains("/js/treatments-media.js", html);
        foreach (var absent in new[] { "3dd09.png", "16fed.png", "b9b6a.svg", "<button", "<input", "type=\"range\"" })
            Assert.DoesNotContain(absent, panel);
        var css = await client.GetStringAsync("/css/treatments.css");
        Assert.Contains(".treatment-polarizado-photo { height: 680px; margin-top: -43px; overflow: hidden; }", css);
        Assert.Contains(".treatment-polarizado-image-plane { width: 100%; height: 100%; }", css);
        Assert.Contains(".treatment-polarizado-video { display: block; width: 100%; height: 100%; object-fit: cover; }", css);
        Assert.Contains(".treatment-polarizado-photo { height: 580px; }", css);
        Assert.Contains(".treatment-polarizado-photo { height: 380px; margin-top: -24px; }", css);
        Assert.Contains("flex-basis: 300px", css);
    }

    [Fact]
    public async Task UserVideoRetainsExactBytesAndStaticMimeType()
    {
        var response = await client.GetAsync("/media/treatments/polarizado.mp4");
        response.EnsureSuccessStatusCode();
        Assert.Equal("video/mp4", response.Content.Headers.ContentType?.MediaType);
        var bytes = await response.Content.ReadAsByteArrayAsync();
        Assert.Equal(13344514, bytes.Length);
        Assert.Equal("2CDEE14B3F3A1105DABDAADB29A7E89F1FB9C853F011B3E564B1D51234A7CD1F", Convert.ToHexString(SHA256.HashData(bytes)));
    }

    [Fact]
    public async Task FourthPanelAndPriorPanelsRemainReachableWithoutJavascript()
    {
        var html = await client.GetStringAsync("/tratamientos");
        foreach (var id in new[] { "uv", "blue-tech", "antirraya", "polarizado" })
        {
            Assert.Contains($"href=\"#{id}\" data-treatment-link=\"{id}\"", html);
            var opening = Regex.Match(html, $"<section id=\"{id}\"[^>]*>").Value;
            Assert.NotEmpty(opening);
            Assert.Contains($"aria-labelledby=\"treatment-{id}-title\"", opening);
            Assert.DoesNotContain(" hidden", opening);
            Assert.DoesNotContain("aria-hidden", opening);
        }
        Assert.Equal("08E6C116A0D2BE8B54F28FE173633514604A5A1E0B4F85CCA3D04E6FFF8D5EA5",
            Convert.ToHexString(SHA256.HashData(await client.GetByteArrayAsync("/js/treatments.js"))));
    }

    [Fact]
    public async Task ThreeNewOriginalsAndDefaultLogosRetainExactBytes()
    {
        var hashes = new Dictionary<string, string>
        {
            ["8af8d.png"] = "51DE590DFDF62D324EBA9FD9A7253D80ECC8AAC318B6E7A990319C2ED0042877",
            ["843a7.svg"] = "CCB52DEF2718FEEC2F1CC3BA4EBF96ED97CE0F41A2F11B85DBCDA1ADB2A85463",
            ["279a2.svg"] = "D1FC9B52DB77E8415A8CE2EA8617E3C0E6671F70818FE894F62F2CFD4AB7212F",
            ["4d514.svg"] = "61110BBDE764C5759DB14D2B77ACC7C9FB695AC517D2E5E78036BE7E2D970E0F",
            ["8e61b.svg"] = "F03CBA859597FBC03869711EC07C50353989DC74AE7F5124840A016DE370BCA0"
        };
        foreach (var (file, expected) in hashes)
            Assert.Equal(expected, Convert.ToHexString(SHA256.HashData(await client.GetByteArrayAsync($"/media/figma/{file}"))));
        var image = await client.GetByteArrayAsync("/media/figma/8af8d.png");
        Assert.Equal(2809349, image.Length);
        Assert.Equal(0xff, image[0]);
        Assert.Equal(0xd8, image[1]);
    }

    [Fact]
    public async Task AlternateLogosAreHiddenByDefaultAndSelectedOnlyForPolarizado()
    {
        var html = await client.GetStringAsync("/tratamientos");
        var header = Regex.Match(html, "<header class=\"site-header\"[\\s\\S]*?</header>").Value;
        var facts = Regex.Match(html, "<div class=\"treatments-hero-facts\"[\\s\\S]*?</div>").Value;
        Assert.Contains("aria-label=\"Novar, inicio\"", header);
        Assert.Contains("/media/figma/4d514.svg", header);
        Assert.Contains("class=\"treatments-header-logo-polarizado\" src=\"/media/figma/843a7.svg\" alt=\"Novar\"", header);
        Assert.Contains("/media/figma/8e61b.svg", facts);
        Assert.Contains("class=\"treatments-hero-logo-polarizado\" src=\"/media/figma/279a2.svg\" alt=\"Novar\"", facts);
        var css = await client.GetStringAsync("/css/treatments.css");
        Assert.Contains(".treatments-page .treatments-header-logo-polarizado,\n.treatments-content .treatments-hero-logo-polarizado { display: none; }", css);
        Assert.Contains(".treatments-content[data-active-treatment=\"polarizado\"] .treatments-hero-logo-polarizado { display: block; }", css);
        Assert.Contains(".treatments-content[data-active-treatment=\"polarizado\"] .treatments-hero-facts p:nth-child(2) > img:not(.treatments-hero-logo-polarizado) { display: none; }", css);
        Assert.Contains(".treatments-page[data-active-treatment=\"polarizado\"] .navbar-brand > img:not(.treatments-header-logo-polarizado),", css);
        Assert.Contains(".treatments-page[data-active-treatment=\"polarizado\"] .treatments-linkedin-blue-tech { display: block; }", css);
        Assert.Contains(".treatments-content[data-active-treatment=\"polarizado\"] .treatments-tabs a[aria-selected=\"true\"] { font-weight: 700; }", css);
    }

    [Theory]
    [InlineData("/")]
    [InlineData("/lentes/first")]
    [InlineData("/sobre-nosotros")]
    [InlineData("/juegos")]
    public async Task OtherPagesNeverAcquirePolarizadoLogoAlternates(string path)
    {
        var html = await client.GetStringAsync(path);
        Assert.DoesNotContain("treatments-header-logo-polarizado", html);
        Assert.DoesNotContain("treatments-hero-logo-polarizado", html);
        Assert.DoesNotContain("/media/figma/843a7.svg", html);
        Assert.DoesNotContain("/media/figma/279a2.svg", html);
        if (path == "/juegos") Assert.Contains("/media/figma/4d514.svg", html);
    }
}
