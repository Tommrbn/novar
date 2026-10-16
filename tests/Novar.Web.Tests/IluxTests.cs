using System.Net;
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Hosting;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Novar.Web.Services;

namespace Novar.Web.Tests;

public sealed class IluxTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task IluxPreservesLiteralSourceCopyAndOnlyEmphasizesTheBrand()
    {
        var content = factory.Services.GetRequiredService<SiteContent>().Treatments;
        var detail = Assert.Single(content.Details, item => item.Id == "ilux");
        Assert.Equal("961:8420", detail.SourceNode);
        Assert.Equal("Antirreflejo iLUX", detail.Name);
        Assert.Equal("El tratamiento antirreflejo elimina los reflejos molestos que se producen en la superficie de las lentes, mejorando la claridad visual y la estética. Este tratamiento es ideal para quienes trabajan frente a pantallas, conducen de noche o desean una visión más nítida en cualquier condición de iluminación. Además, reduce el deslumbramiento y mejora la transmisión de luz, lo que resulta en una experiencia visual más cómoda y relajada.", detail.Description);
        Assert.Equal(new[] { "Mayor durabilidad", "Superficie más resistente", "Mantiene la claridad" }, detail.Benefits);
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/tratamientos"));
        var panel = Regex.Match(html, "<section id=\"ilux\"[\\s\\S]*?</section>").Value;
        Assert.Contains("data-figma-node=\"961:8330\"", panel);
        Assert.Contains("data-figma-node=\"I961:8419;1:2038\"", panel);
        Assert.Contains("Antirreflejo <strong>iLUX</strong>", panel);
        Assert.Single(Regex.Matches(panel, "<strong>"));
        Assert.Contains(detail.Description, panel);
        Assert.All(detail.Benefits, benefit => Assert.Contains(benefit, panel));
        Assert.Equal(new[] { "Más claridad", "12 capas" }, content.Comparison[6].Benefits);
    }

    [Fact]
    public async Task AllSevenNativeFragmentsAreReachableWithoutJavascript()
    {
        var html = await client.GetStringAsync("/tratamientos");
        foreach (var id in new[] { "uv", "blue-tech", "antirraya", "polarizado", "hidrofobico", "fotosensible", "ilux" })
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
    public async Task IluxUsesSilentAutoplayVideoWithoutInventedComparisonControls()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/tratamientos"));
        var panel = Regex.Match(html, "<section id=\"ilux\"[\\s\\S]*?</section>").Value;
        var video = Assert.Single(Regex.Matches(panel, "<video\\b[^>]*>").Cast<Match>()).Value;
        foreach (var attribute in new[] { " muted", " playsinline", "preload=\"none\"", "aria-labelledby=\"treatment-ilux-title\"" })
            Assert.Contains(attribute, video);
        Assert.DoesNotContain(" autoplay", video);
        Assert.DoesNotContain(" controls", video);
        Assert.Contains(" loop", video);
        Assert.Contains("data-treatment-desktop=\"/media/treatments/optimized/ilux-desktop.mp4\"", panel);
        Assert.DoesNotContain("treatment-ilux-image", panel);
        Assert.DoesNotContain("/js/treatment-ilux.js", html);
        Assert.Contains("/media/treatments/optimized/ilux-poster-1280.webp", panel);
        Assert.Contains("data-treatment-fallback", panel);
        Assert.Equal(3, Regex.Matches(panel, "src=\"/media/figma/7bc95.svg\"").Count);
        foreach (var absent in new[] { "16fed.png", "23aae.png", "b9b6a.svg", "<button", "<input", "type=\"range\"", "role=\"slider\"" })
            Assert.DoesNotContain(absent, panel);
        var original = await client.GetByteArrayAsync("/media/figma/b6e78.png");
        Assert.Equal(3178272, original.Length);
        Assert.Equal(0xff, original[0]);
        Assert.Equal(0xd8, original[1]);
        Assert.Equal("34EB8F20BE5733377004832E67B0344C789BB4469F201BF4C9A525C08D61CEA8",
            Convert.ToHexString(SHA256.HashData(original)));
    }

    [Fact]
    public async Task SuppliedIluxVideoRetainsExactBytesAndSupportsHeadAndRange()
    {
        const long length = 27169344;
        var environment = factory.Services.GetRequiredService<IWebHostEnvironment>();
        var file = Path.Combine(environment.WebRootPath, "media", "treatments", "ilux-antirreflejo.mp4");
        Assert.True(File.Exists(file));
        await using (var stream = File.OpenRead(file))
        {
            Assert.Equal(length, stream.Length);
            Assert.Equal("CD26BF7D9F0EAB9697DB56D7334C16B2A3D917B0F2C9D00A2A90AF42DBBDA97F",
                Convert.ToHexString(await SHA256.HashDataAsync(stream)));
        }
        const string path = "/media/treatments/ilux-antirreflejo.mp4";
        using var head = new HttpRequestMessage(HttpMethod.Head, path);
        using var response = await client.SendAsync(head);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(length, response.Content.Headers.ContentLength);
        Assert.Equal("video/mp4", response.Content.Headers.ContentType?.MediaType);
        using var range = new HttpRequestMessage(HttpMethod.Get, path);
        range.Headers.Range = new RangeHeaderValue(0, 0);
        using var partial = await client.SendAsync(range);
        Assert.Equal(HttpStatusCode.PartialContent, partial.StatusCode);
        Assert.Equal(length, partial.Content.Headers.ContentRange?.Length);
        Assert.Equal("video/mp4", partial.Content.Headers.ContentType?.MediaType);
        Assert.Single(await partial.Content.ReadAsByteArrayAsync());
    }

    [Fact]
    public async Task IluxPreservesItsResponsiveBoxAndScopedOriginalBranding()
    {
        var css = await client.GetStringAsync("/css/treatments.css");
        Assert.Contains(".treatment-ilux-photo { height: 680px; margin-top: -43px; overflow: hidden; }", css);
        Assert.Contains(".treatment-ilux-video { display: block; width: 100%; height: 100%; object-fit: cover; }", css);
        Assert.Contains(".treatment-ilux-photo { height: 580px; }", css);
        Assert.Contains(".treatment-ilux-photo { height: 380px; margin-top: -24px; }", css);
        Assert.Contains("margin: -23px auto 0", css);
        Assert.DoesNotContain(".treatment-ilux-image-plane", css);
        Assert.DoesNotContain(".treatment-ilux-image {", css);
        Assert.Contains(".treatment-ilux-summary h2 strong { font-weight: 600; }", css);
        Assert.Contains(".treatments-content[data-active-treatment=\"ilux\"] .treatments-tabs-active { left: 939.792px; top: 51px; }", css);
        Assert.Contains(".treatments-content[data-active-treatment=\"ilux\"] .treatments-tabs a[aria-selected=\"true\"] { font-weight: 600; }", css);
        Assert.Contains(".treatments-page[data-active-treatment=\"ilux\"] .treatments-linkedin-blue-tech { display: block; }", css);
        Assert.DoesNotContain(".treatments-page[data-active-treatment=\"ilux\"] .treatments-header-logo-polarizado", css);
        Assert.DoesNotContain(".treatments-content[data-active-treatment=\"ilux\"] .treatments-hero-logo-polarizado", css);
        Assert.Contains(".treatment-ilux-description { margin-top: 0; font-size: 14px; line-height: 21px; }", css);
        Assert.Contains(".treatment-ilux-benefits li:nth-child(3) > span:last-child { width: calc(100% - 40px); margin-left: 40px; }", css);
    }

    [Theory]
    [InlineData("/")]
    [InlineData("/lentes/first")]
    [InlineData("/sobre-nosotros")]
    [InlineData("/juegos")]
    public async Task IluxDoesNotLeakIntoOtherPageMarkup(string path)
    {
        var html = await client.GetStringAsync(path);
        Assert.DoesNotContain("treatment-detail-ilux", html);
        Assert.DoesNotContain("treatments-ilux-v1", html);
        Assert.DoesNotContain("/media/figma/b6e78.png", html);
        Assert.DoesNotContain("/media/treatments/ilux-antirreflejo.mp4", html);
        Assert.DoesNotContain("/js/treatment-ilux.js", html);
    }
}
