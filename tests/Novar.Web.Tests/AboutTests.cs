using System.Net;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Novar.Web.Services;

namespace Novar.Web.Tests;

public sealed class AboutTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task AboutRendersOriginalInstitutionalCopyAndAllValues()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/sobre-nosotros"));
        var content = factory.Services.GetRequiredService<SiteContent>().About;
        Assert.Equal("961:6952", content.SourceNode);
        Assert.Contains("data-about-revision=\"about-v1\"", html);
        Assert.DoesNotContain("después de aprobar la muestra visual", html);
        Assert.Equal(2, content.Paragraphs.Length);
        Assert.Equal(3, content.Pillars.Length);
        Assert.Equal(4, content.Values.Length);
        Assert.All(content.Paragraphs, paragraph => Assert.Contains(paragraph, html));
        foreach (var item in content.Pillars.Concat(content.Values))
        {
            Assert.Contains(item.Title, html);
            Assert.Contains(item.Description, html);
        }
        Assert.Equal(4, Regex.Matches(html, "<article class=\"about-value-card\"").Count);
        Assert.Contains("Psicoptix Technology™ y CDT Technology™", html);
        Assert.Contains("class=\"about-globe\" aria-hidden=\"true\"", html);
        Assert.Contains("aria-labelledby=\"about-values-title\"", html);
    }

    [Fact]
    public async Task AboutPresentationIsNotLoadedByHomeOrFirst()
    {
        var about = await client.GetStringAsync("/sobre-nosotros");
        Assert.Contains("<body class=\"about-page\">", about);
        Assert.Contains("/css/about.css", about);
        Assert.Contains("href=\"/sobre-nosotros\" aria-current=\"page\"", about);
        Assert.Contains("/media/figma/1bce4.svg", about);
        Assert.DoesNotContain("Ver muestra: Novar First", about);
        foreach (var path in new[] { "/", "/lentes/first" })
        {
            var html = await client.GetStringAsync(path);
            Assert.DoesNotContain("/css/about.css", html);
            Assert.DoesNotContain("about-footer", html);
            Assert.DoesNotContain("/media/figma/1bce4.svg", html);
            Assert.DoesNotContain("href=\"/sobre-nosotros\" aria-current=\"page\"", html);
            Assert.Contains(path == "/lentes/first" ? "class=\"navbar navbar-expand-xl\"" : "class=\"navbar navbar-expand-lg\"", html);
            Assert.Contains("/media/figma/e7f22.svg", html);
        }
    }

    [Fact]
    public async Task AboutUsesOriginalMaskDividerLogoAndSocialAssetDimensions()
    {
        var dimensions = new Dictionary<string, (string Width, string Height)>
        {
            ["08a92.svg"] = ("685.505", "685.505"),
            ["65002.svg"] = ("276", "5"),
            ["1bce4.svg"] = ("90.9964", "15.1677"),
            ["4fa2a.svg"] = ("22.3059", "18.2378"),
            ["f87fc.svg"] = ("22.923", "18.4942"),
            ["97fd8.svg"] = ("22.0033", "18.7179"),
            ["dabcc.svg"] = ("21.9854", "18.5251"),
            ["e27ca.svg"] = ("18.2751", "18.2783"),
            ["c8445.svg"] = ("17.1763", "17.1763"),
            ["fa384.svg"] = ("17.1704", "17.1746"),
            ["9daba.svg"] = ("17.1763", "17.1763"),
            ["e3672.svg"] = ("24.4617", "17.1758"),
            ["5497d.svg"] = ("12.0696", "12.0696")
        };
        var html = await client.GetStringAsync("/sobre-nosotros");
        var css = await client.GetStringAsync("/css/about.css");
        foreach (var (asset, size) in dimensions)
        {
            Assert.Contains(asset, html + css);
            var root = XDocument.Parse(await client.GetStringAsync($"/media/figma/{asset}")).Root!;
            Assert.Equal(size.Width, root.Attribute("width")?.Value);
            Assert.Equal(size.Height, root.Attribute("height")?.Value);
        }
        Assert.Contains("mask-image: url('../media/figma/08a92.svg')", css);
        Assert.Contains("mask-position: 458.852px 81.6px", css);
        Assert.Contains("mask-size: 685.504px 685.504px", css);
        Assert.Contains("opacity: .2", css);
        var png = await client.GetByteArrayAsync("/media/figma/c9741.png");
        Assert.True(png.Length > 1000);
        Assert.Equal(1672, System.Buffers.Binary.BinaryPrimitives.ReadInt32BigEndian(png.AsSpan(16, 4)));
        Assert.Equal(941, System.Buffers.Binary.BinaryPrimitives.ReadInt32BigEndian(png.AsSpan(20, 4)));
        Assert.DoesNotContain("figma.com/api", html + css);
    }

    [Fact]
    public async Task AboutSocialLabelsMatchSourceBrandsAndRemainPending()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/sobre-nosotros"));
        var social = Regex.Match(html, "<div class=\"about-footer-socials\"[\\s\\S]*?</div>").Value;
        Assert.Equal(new[] { "Instagram", "LinkedIn", "Facebook", "YouTube" },
            Regex.Matches(social, "data-pending=\"([^\"]+)\"").Select(x => x.Groups[1].Value));
        Assert.Matches("data-pending=\"LinkedIn\"[^>]*><img src=\"/media/figma/fa384.svg\"", social);
        Assert.Matches("data-pending=\"Facebook\"[^>]*><img src=\"/media/figma/9daba.svg\"", social);
        Assert.Equal(4, Regex.Matches(social, "type=\"button\"").Count);
        var css = await client.GetStringAsync("/css/about.css");
        Assert.Contains("flex: 0 0 32.4443px", css);
        Assert.Contains("margin-left: -7.634px", css);
        Assert.Contains("flex-basis: 39.7297px", css);
        Assert.Contains("flex-basis: 44px; width: 44px; height: 44px", css);
        Assert.Contains("Función pendiente de integración", html);
        Assert.DoesNotContain("<form", html);
        var response = await client.PostAsync("/sobre-nosotros", new StringContent(""));
        Assert.Equal(HttpStatusCode.MethodNotAllowed, response.StatusCode);
    }
}
