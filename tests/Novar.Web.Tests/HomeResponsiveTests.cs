using System.Net;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Novar.Web.Tests;

public sealed class HomeResponsiveTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Theory]
    [InlineData("es", "es")]
    [InlineData("en", "en")]
    [InlineData("pt", "pt-BR")]
    public async Task HomeHasIsolatedStyleAndLocalizedReachableWorldRegion(string language, string culture)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.AcceptLanguage.ParseAdd(language);
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/"));
        Assert.Contains($"<html lang=\"{culture}\">", html);
        Assert.Contains("<body class=\"home-page\">", html);
        Assert.Matches("href=\"/css/home-responsive.css(?:\\?[^\"]*)?\"", html);
        Assert.Contains("navbar navbar-expand-xl", html);
        Assert.Contains("class=\"world-visual\" role=\"region\" aria-labelledby=\"world-title\" aria-describedby=\"world-mobile-hint\" tabindex=\"0\"", html);
        Assert.Matches("<h2 id=\"world-title\"><strong>[^<]+</strong> [^<]+</h2>", html);
        Assert.Equal(8, Regex.Matches(html, "data-home-media-controls=\"world\"").Count);
        Assert.Equal(10, Regex.Matches(html, "<video\\b").Count);
        Assert.Equal(10, Regex.Matches(html, "muted loop playsinline preload=\"none\"").Count);
        Assert.Contains("data-treatment-collage", html);
        Assert.Contains("data-testimonial-carousel", html);
        foreach (var media in new[] { "hero-banner", "world-path", "world-portrait-1", "world-portrait-2",
                     "world-spectra-glasses", "world-portrait-3", "world-sunset-glasses", "world-earth", "world-boy-glasses" })
            Assert.Contains($"/media/home/optimized/{media}.mp4", html);
        Assert.Contains("/media/home/lens-finder.mp4", html);
        Assert.Contains("mkt@novar-tech.com", html);
        Assert.Contains("/media/novar-footer.svg", html);
        Assert.Contains("Hernán Darío", html);
        Assert.Contains("+41M", html);
        Assert.Contains("+290", html);
    }

    [Theory]
    [InlineData("/sobre-nosotros")]
    [InlineData("/lentes")]
    [InlineData("/tratamientos")]
    [InlineData("/juegos")]
    [InlineData("/lentes/first")]
    public async Task OtherRoutesDoNotLoadHomeAdaptation(string route)
    {
        var html = await factory.CreateClient().GetStringAsync(route);
        Assert.DoesNotContain("home-responsive.css", html);
        Assert.DoesNotContain("<body class=\"home-page\">", html);
    }

    [Fact]
    public async Task ResponsiveRulesAreNarrowAndDoNotReplaceMediaGeometryOrMotion()
    {
        var css = await factory.CreateClient().GetStringAsync("/css/home-responsive.css");
        Assert.Contains("@media (max-width: 1199px)", css);
        Assert.Contains("@media (max-width: 767px)", css);
        Assert.DoesNotContain("@media (min-width:", css);
        Assert.DoesNotContain("100vw", css);
        Assert.DoesNotContain("animation:", css);
        Assert.DoesNotContain("--crop-", css);
        Assert.DoesNotContain("object-fit:", css);
        Assert.DoesNotMatch("testimonial[^{}]*\\{[^{}]*(?:width:|transform:)", css);
        Assert.Contains("overflow-x: auto", css);
        Assert.Contains("grid-template-rows: repeat(2, var(--world-half))", css);
        Assert.Contains("left: 12px;", css);
        foreach (Match rule in Regex.Matches(css, @"([^{}]+world-media-actions[^{}]*)\{([^{}]*)\}"))
            if (rule.Groups[2].Value.Contains("opacity:") || rule.Groups[2].Value.Contains("pointer-events:"))
                Assert.Contains(".world-visual.is-touch-enhanced", rule.Groups[1].Value);
        Assert.Contains("max-height: calc(100svh - 100px)", css);
        // Every declaration selector is explicitly Home-scoped, including comma groups.
        var withoutComments = Regex.Replace(css, @"/\*[\s\S]*?\*/", "");
        foreach (Match rule in Regex.Matches(withoutComments, @"([^{}]+)\{([^{}]*)\}"))
            foreach (var selector in rule.Groups[1].Value.Split(','))
                Assert.StartsWith(".home-page", selector.Trim());
    }
}
