using System.Net;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Novar.Web.Tests;

public sealed class KriptokRefinementTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Theory]
    [InlineData("es")]
    [InlineData("en")]
    [InlineData("pt-BR")]
    public async Task KriptokPreservesSourceImagesAndUsesTheProgressiveCarouselInEveryLocale(string culture)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/lentes/kriptok-blended");
        request.Headers.AcceptLanguage.ParseAdd(culture);
        var html = WebUtility.HtmlDecode(await (await client.SendAsync(request)).Content.ReadAsStringAsync());
        var gallery = Section(html, "bop-gallery");
        Assert.Contains("data-product-gallery", gallery);
        Assert.Contains("data-gallery-track", gallery);
        Assert.Contains("gallery-motion-control visually-hidden-focusable", gallery);
        Assert.DoesNotContain("data-gallery-previous", gallery);
        Assert.DoesNotContain("data-gallery-next", gallery);
        Assert.Contains("data-gallery-pause", gallery);
        Assert.Contains("aria-pressed=\"false\"", gallery);
        Assert.Equal(new[] { "6e749.png", "ed808.png", "0127c.png", "1305e.png" },
            Regex.Matches(gallery, "data-gallery-image=\"(?<file>[^\"]+)\"").Select(match => match.Groups["file"].Value));
        Assert.Single(Regex.Matches(html, "/js/progressive-gallery\\.js"));
        Assert.DoesNotContain("/css/progressive-products.css", html);
        Assert.DoesNotContain("data-progressive-gallery", html);

        var hero = Section(html, "bop-hero");
        Assert.Contains("/media/products/banners/kriptok-blended-2x.webp", hero);
        Assert.DoesNotContain("/media/figma/a2798.png", hero);
        Assert.Contains("fetchpriority=\"high\"", hero);

        var related = Section(html, "bop-related");
        var cards = Regex.Matches(related, "<a href=\"(?<href>[^\"]+)\"[^>]* data-figma-node=\"(?<node>[^\"]+)\"[^>]*><img src=\"/media/figma/(?<file>[^\"]+)\" alt=\"\" loading=\"lazy\" /><span class=\"product-related-label\">(?<name>[^<]+)</span></a>");
        Assert.Equal(new[] { "1145:1940", "1145:1943", "1145:1947" }, cards.Select(card => card.Groups["node"].Value));
        Assert.Equal(new[] { "961e1.png", "2c53f.png", "28518.png" }, cards.Select(card => card.Groups["file"].Value));
        Assert.Equal(new[] { "/lentes/ultex-blended", "/lentes/kriptok-blended", "/lentes/freeline" }, cards.Select(card => card.Groups["href"].Value));
        foreach (Match card in cards)
        {
            Assert.NotEmpty(card.Groups["name"].Value);
            Assert.Equal(HttpStatusCode.OK, (await client.GetAsync(card.Groups["href"].Value)).StatusCode);
            Assert.NotEmpty(await client.GetByteArrayAsync($"/media/figma/{card.Groups["file"].Value}"));
        }
    }

    [Theory]
    [InlineData("ultex-blended")]
    [InlineData("freeline")]
    [InlineData("office")]
    public async Task OtherFamilyPagesShareMotionAndKeepTheirOriginalHero(string slug)
    {
        var html = await client.GetStringAsync($"/lentes/{slug}");
        Assert.Contains("data-product-gallery", html);
        Assert.DoesNotContain("data-gallery-controls", html);
        Assert.Contains("/js/progressive-gallery.js", html);
        Assert.DoesNotContain("kriptok-blended-2x.webp", html);
        Assert.DoesNotContain("1145:1940", html);
    }

    [Fact]
    public async Task CropsWideHeroAndEnhancedTrackRemainScopedToKriptok()
    {
        var css = await client.GetStringAsync("/css/bifocal-occupational-products.css");
        Assert.Contains(".bop-product--kriptok-blended .bop-hero { height: 52.847222vw; }", css);
        Assert.Contains(".bop-product--kriptok-blended .bop-hero-art > img { left: 0; top: auto; bottom: 0; width: 100%; height: auto; }", css);
        Assert.Contains(".bop-product--kriptok-blended .bop-gallery.is-enhanced .bop-gallery-images { display: block; height: 460.412px; }", css);
        Assert.Contains(".bop-product--kriptok-blended .bop-gallery.is-enhanced .bop-gallery-images { height: 265px; }", css);
        Assert.Contains("grid-template-columns: 475fr 486fr 485fr", css);
        Assert.Contains("height: 166.08%; left: 0; top: -14.28%", css);
        Assert.Contains("height: 226.19%; left: .07%; top: -37.42%", css);
        Assert.Contains("height: 169.58%; left: .1%; top: -7.14%", css);
        Assert.NotEmpty(await client.GetByteArrayAsync("/media/products/banners/kriptok-blended-2x.webp"));
    }

    private static string Section(string html, string name) =>
        Regex.Match(html, $"<section class=\"{name}(?: |\")[\\s\\S]*?</section>").Value;
}
