using System.Net;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Novar.Web.Services;

namespace Novar.Web.Tests;

public sealed class HidrofobicoTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task HidrofobicoPreservesExactSourceCopyIncludingEditorialTypo()
    {
        var content = factory.Services.GetRequiredService<SiteContent>().Treatments;
        var detail = Assert.Single(content.Details, item => item.Id == "hidrofobico");
        Assert.Equal("961:8801", detail.SourceNode);
        Assert.Equal("Hidrofóbico", detail.Name);
        Assert.Equal("El tratamiento hidrofóbico es una tecnología avanzada que se aplica a las lentes para repeler el agua y evitar que se adhiera a la superficie. Este tratamiento crea una capa protectora que reduce la acumulación de gotas de agua, facilitando una visión clara incluso en condiciones de lluvia o humedad. Además, ayuda a mantener las lentes limpias por más tiempo al evitar que el polvo y la suciedad se adhieran fácilmente.", detail.Description);
        Assert.Equal(new[] { "Siempre limpio", "El agua no de adhiere", "Mantiene la claridad" }, detail.Benefits);
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/tratamientos"));
        var panel = Regex.Match(html, "<section id=\"hidrofobico\"[\\s\\S]*?</section>").Value;
        Assert.Contains("data-figma-node=\"961:8795\"", panel);
        Assert.Contains("data-figma-node=\"I961:8797;1:2038\"", panel);
        Assert.Contains(detail.Description, panel);
        Assert.All(detail.Benefits, benefit => Assert.Contains(benefit, panel));
        Assert.DoesNotContain("El agua no se adhiere", panel);
        Assert.Equal("Repele el agua.", content.Comparison[4].Description);
        Assert.Equal(new[] { "Fácil limpieza", "Menos marcas" }, content.Comparison[4].Benefits);
        Assert.DoesNotContain("Polarizado e Hidrofóbico.", html);
    }

    [Fact]
    public async Task FifthPanelAndAllPreviousStatesRemainReachableWithoutJavascript()
    {
        var html = await client.GetStringAsync("/tratamientos");
        foreach (var id in new[] { "uv", "blue-tech", "antirraya", "polarizado", "hidrofobico" })
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
    public async Task HidrofobicoUsesMutedNativeVideoWithOriginalPosterAndCheckAssets()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/tratamientos"));
        var panel = Regex.Match(html, "<section id=\"hidrofobico\"[\\s\\S]*?</section>").Value;
        var video = Regex.Match(panel, "<video\\b[^>]*>").Value;
        Assert.NotEmpty(video);
        Assert.Contains("data-treatment-desktop=\"/media/treatments/optimized/hidrofobico-desktop.mp4\"", video);
        Assert.Contains("/media/treatments/optimized/hidrofobico-poster-1280.webp", panel);
        Assert.Contains("aria-label=\"Hidrofóbico\"", video);
        Assert.Contains(" muted", video);
        Assert.DoesNotContain(" autoplay", video);
        Assert.Contains(" playsinline", video);
        Assert.Contains("preload=\"none\"", video);
        Assert.Contains(" loop", video);
        foreach (var absent in new[] { " controls", "data-uv-video", "data-home-media", "onmouseenter", "aria-hidden", "tabindex=\"-1\"" })
            Assert.DoesNotContain(absent, video, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(3, Regex.Matches(panel, "src=\"/media/figma/7bc95.svg\"").Count);
        foreach (var absent in new[] { "16fed.png", "8af8d.png", "b9b6a.svg", "<button", "<input", "type=\"range\"" })
            Assert.DoesNotContain(absent, panel);
        var original = await client.GetByteArrayAsync("/media/figma/dd2a0.png");
        Assert.Equal(2902369, original.Length);
        Assert.Equal(0xff, original[0]);
        Assert.Equal(0xd8, original[1]);
        Assert.Equal("5D1DA0DA850A4AE4F9A10E206BB10BA8170276E686305FF7D9D07B82CFFCF008",
            Convert.ToHexString(SHA256.HashData(original)));
    }

    [Fact]
    public async Task HidrofobicoKeepsSourceGeometryTypeAndExistingLogoAlternativesScoped()
    {
        var css = await client.GetStringAsync("/css/treatments.css");
        Assert.Contains(".treatment-hidrofobico-photo { height: 680px; margin-top: -43px; overflow: hidden; }", css);
        Assert.Contains(".treatment-hidrofobico-image-plane { width: 100%; height: 100%; margin-left: 0; }", css);
        Assert.Equal(1, Regex.Matches(css, @"\.treatment-hidrofobico-image-plane\s*\{").Count);
        Assert.Contains(".treatment-hidrofobico-photo { height: 580px; }", css);
        Assert.Contains(".treatment-hidrofobico-photo { height: 380px; margin-top: -24px; }", css);
        Assert.Contains(".treatment-hidrofobico-image { display: block; width: 100%; height: 100%; max-width: none; object-fit: cover; }", css);
        Assert.Contains(".treatments-content[data-active-treatment=\"hidrofobico\"] .treatments-tabs-active { left: 622.792px; top: 51px; }", css);
        Assert.Contains(".treatments-content[data-active-treatment=\"hidrofobico\"] .treatments-tabs a[aria-selected=\"true\"] { font-weight: 700; }", css);
        Assert.Contains(".treatments-page[data-active-treatment=\"hidrofobico\"] .navbar-brand > img:not(.treatments-header-logo-polarizado),", css);
        Assert.Contains(".treatments-content[data-active-treatment=\"hidrofobico\"] .treatments-hero-logo-polarizado { display: block; }", css);
        Assert.Contains(".treatments-page[data-active-treatment=\"hidrofobico\"] .treatments-linkedin-blue-tech { display: block; }", css);
        Assert.Contains(".treatment-hidrofobico-description { margin-top: 0; font-size: 14px; line-height: 21px; }", css);
        Assert.Contains(".treatment-hidrofobico-benefits li:nth-child(3) > span:last-child { width: calc(100% - 40px); margin-left: 40px; }", css);
    }

    [Fact]
    public async Task HidrofobicoOriginalVideoSupportsHeadRangeAndExactHash()
    {
        const string path = "/media/treatments/hidrofobico.mp4";
        const long expectedLength = 39_089_249;
        using var head = new HttpRequestMessage(HttpMethod.Head, path);
        using var headResponse = await client.SendAsync(head);
        Assert.Equal(HttpStatusCode.OK, headResponse.StatusCode);
        Assert.Equal(expectedLength, headResponse.Content.Headers.ContentLength);
        Assert.Equal("video/mp4", headResponse.Content.Headers.ContentType?.MediaType);
        using var range = new HttpRequestMessage(HttpMethod.Get, path);
        range.Headers.Range = new RangeHeaderValue(0, 0);
        using var rangeResponse = await client.SendAsync(range);
        Assert.Equal(HttpStatusCode.PartialContent, rangeResponse.StatusCode);
        Assert.Equal(expectedLength, rangeResponse.Content.Headers.ContentRange?.Length);
        Assert.Equal(new byte[] { 0 }, await rangeResponse.Content.ReadAsByteArrayAsync());
        Assert.Equal("E27BB5F937248ADFDCD3A6B7C0B24CBBAE4765532E5D5F5A6160B3FAE6C07C1E",
            Convert.ToHexString(SHA256.HashData(await client.GetByteArrayAsync(path))));
    }

    [Theory]
    [InlineData("/")]
    [InlineData("/lentes/first")]
    [InlineData("/sobre-nosotros")]
    [InlineData("/juegos")]
    public async Task HidrofobicoDoesNotLeakIntoOtherPageMarkup(string path)
    {
        var html = await client.GetStringAsync(path);
        Assert.DoesNotContain("treatment-detail-hidrofobico", html);
        Assert.DoesNotContain("treatments-hidrofobico-v1", html);
        Assert.DoesNotContain("/media/figma/dd2a0.png", html);
    }
}
