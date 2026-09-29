using System.Net;
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
        Assert.Equal("07AABB40D63527D68CF71C894F967241109CF9BD5362C7BAF3FB9398FCC0883E",
            Convert.ToHexString(SHA256.HashData(await client.GetByteArrayAsync("/js/treatments.js"))));
    }

    [Fact]
    public async Task IluxUsesTheAuthenticStaticPhotoWithoutInventedComparisonControls()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/tratamientos"));
        var panel = Regex.Match(html, "<section id=\"ilux\"[\\s\\S]*?</section>").Value;
        Assert.Contains("src=\"/media/figma/b6e78.png\"", panel);
        Assert.Contains("width=\"2752\" height=\"1536\"", panel);
        Assert.Contains("alt=\"Hombre con gafas:", panel);
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
    public async Task IluxPreservesItsDistinctCropWeightsAndScopedOriginalBranding()
    {
        var css = await client.GetStringAsync("/css/treatments.css");
        Assert.Contains(".treatment-ilux-photo { height: 680px; margin-top: -43px; overflow: hidden; }", css);
        Assert.Contains(".treatment-ilux-image-plane { position: relative; width: 1684px; height: 937.696px; margin-left: calc(50% - 844px); overflow: hidden; }", css);
        Assert.Contains(".treatment-ilux-image { position: absolute; top: -18.69%; left: -10.79%; display: block; width: 121.63%; height: 121.92%; max-width: none; }", css);
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
    }
}
