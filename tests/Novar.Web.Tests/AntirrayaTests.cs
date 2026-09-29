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
    public async Task StaticSourceImageIsOriginalJpegWithoutInventedComparator()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/tratamientos"));
        var panel = Regex.Match(html, "<section id=\"antirraya\"[\\s\\S]*?</section>").Value;
        Assert.Contains("/media/figma/3dd09.png", panel);
        Assert.Contains("width=\"2752\" height=\"1536\"", panel);
        Assert.Contains("la lente de la izquierda presenta rayas", panel);
        foreach (var absent in new[] { "f0cf4.png", "16fed.png", "d517c.svg", "b9b6a.svg", "<button", "<input", "type=\"range\"" })
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
        Assert.Equal("07AABB40D63527D68CF71C894F967241109CF9BD5362C7BAF3FB9398FCC0883E", Convert.ToHexString(SHA256.HashData(script)));
    }

    [Fact]
    public async Task AntirrayaStylesAndExactFooterAssetReuseStayStateScoped()
    {
        var css = await client.GetStringAsync("/css/treatments.css");
        Assert.Contains(".treatment-antirraya-photo { height: 719px; margin-top: -82px; overflow: hidden; }", css);
        Assert.Contains("top: -7.83%", css);
        Assert.Contains("height: 107.86%", css);
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
