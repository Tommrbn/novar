using System.Net;
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
        Assert.Contains("Polarizado e Hidrofóbico.", html);
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
        Assert.Equal("07AABB40D63527D68CF71C894F967241109CF9BD5362C7BAF3FB9398FCC0883E",
            Convert.ToHexString(SHA256.HashData(await client.GetByteArrayAsync("/js/treatments.js"))));
    }

    [Fact]
    public async Task HidrofobicoUsesTheOriginalStaticPhotographAndCheckAssets()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/tratamientos"));
        var panel = Regex.Match(html, "<section id=\"hidrofobico\"[\\s\\S]*?</section>").Value;
        Assert.Contains("src=\"/media/figma/dd2a0.png\"", panel);
        Assert.Contains("width=\"2752\" height=\"1536\"", panel);
        Assert.Contains("alt=\"Mujer con gafas mojadas:", panel);
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
        Assert.Contains(".treatment-hidrofobico-image-plane { width: 1684px; height: 937.696px; margin-left: calc(50% - 743px); }", css);
        Assert.Contains(".treatment-hidrofobico-image { display: block; width: 100%; height: 100%; max-width: none; object-fit: cover; }", css);
        Assert.Contains(".treatments-content[data-active-treatment=\"hidrofobico\"] .treatments-tabs-active { left: 622.792px; top: 51px; }", css);
        Assert.Contains(".treatments-content[data-active-treatment=\"hidrofobico\"] .treatments-tabs a[aria-selected=\"true\"] { font-weight: 700; }", css);
        Assert.Contains(".treatments-page[data-active-treatment=\"hidrofobico\"] .navbar-brand > img:not(.treatments-header-logo-polarizado),", css);
        Assert.Contains(".treatments-content[data-active-treatment=\"hidrofobico\"] .treatments-hero-logo-polarizado { display: block; }", css);
        Assert.Contains(".treatments-page[data-active-treatment=\"hidrofobico\"] .treatments-linkedin-blue-tech { display: block; }", css);
        Assert.Contains(".treatment-hidrofobico-description { margin-top: 0; font-size: 14px; line-height: 21px; }", css);
        Assert.Contains(".treatment-hidrofobico-benefits li:nth-child(3) > span:last-child { width: calc(100% - 40px); margin-left: 40px; }", css);
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
