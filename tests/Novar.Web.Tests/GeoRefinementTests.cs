using System.Net;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Novar.Web.Tests;

public sealed class GeoRefinementTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Theory]
    [InlineData("es")]
    [InlineData("en")]
    [InlineData("pt-BR")]
    public async Task GeoUsesSourcePortraitsInSourceOrderWithAccessibleSiblingLinks(string culture)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/lentes/geo");
        request.Headers.AcceptLanguage.ParseAdd(culture);
        var rawHtml = await (await client.SendAsync(request)).Content.ReadAsStringAsync();
        var html = WebUtility.HtmlDecode(rawHtml);
        var related = Regex.Match(html, "<section class=\"mono-related\"[\\s\\S]*?</section>").Value;
        var cards = Regex.Matches(related, "<a href=\"/lentes/(?<slug>[^\"]+)\"[^>]* data-figma-node=\"(?<node>[^\"]+)\"[^>]*><img src=\"/media/figma/(?<file>[^\"]+)\" alt=\"\" loading=\"lazy\" /><span class=\"product-related-label\">(?<name>[^<]+)</span></a>");
        Assert.Equal(new[] { "outdoor", "single-vision", "slim", "indoor" }, cards.Select(card => card.Groups["slug"].Value));
        Assert.Equal(new[] { "1145:1836", "1145:1825", "1145:1838", "1145:1841" }, cards.Select(card => card.Groups["node"].Value));
        Assert.Equal(new[] { "07444.png", "0b636.png", "a62fc.png", "590b1.png" }, cards.Select(card => card.Groups["file"].Value));
        Assert.Equal(new[] { "Outdoor", "Single Vision", "Slim", "Indoor" }, cards.Select(card => card.Groups["name"].Value));
        foreach (Match card in cards)
        {
            Assert.Equal(HttpStatusCode.OK, (await client.GetAsync($"/lentes/{card.Groups["slug"].Value}")).StatusCode);
            Assert.NotEmpty(await client.GetByteArrayAsync($"/media/figma/{card.Groups["file"].Value}"));
        }

        // Optional browser fixture: real compiled Razor, without starting or changing the user's server.
        var evidenceDirectory = Environment.GetEnvironmentVariable("NOVAR_GEO_EVIDENCE_DIR");
        if (!string.IsNullOrEmpty(evidenceDirectory))
        {
            Directory.CreateDirectory(evidenceDirectory);
            await File.WriteAllTextAsync(Path.Combine(evidenceDirectory, $"geo-{culture}.html"), rawHtml);
        }
    }

    [Fact]
    public async Task GeoReusesTheCarouselWithoutProgressivePresentationOrNewImageIdentities()
    {
        var html = await client.GetStringAsync("/lentes/geo");
        var gallery = Regex.Match(html, "<section class=\"mono-gallery\"[\\s\\S]*?</section>").Value;
        Assert.Contains("data-product-gallery", gallery);
        Assert.Contains("data-gallery-track", gallery);
        Assert.Contains("data-gallery-revision=\"geo-gallery-v2\"", gallery);
        Assert.Contains("gallery-motion-control visually-hidden-focusable", gallery);
        Assert.DoesNotContain("data-gallery-previous", gallery);
        Assert.DoesNotContain("data-gallery-next", gallery);
        Assert.Contains("data-gallery-pause", gallery);
        Assert.Contains("aria-pressed=\"false\"", gallery);
        Assert.Equal(new[] { "cfae7.svg", "294d0.png", "82c00.png", "0195f.png", "86295.png" },
            Regex.Matches(gallery, "src=\"/media/figma/(?<file>[^\"]+)\"").Select(match => match.Groups["file"].Value));
        Assert.Single(Regex.Matches(html, "/js/progressive-gallery\\.js"));
        Assert.DoesNotContain("/css/progressive-products.css", html);
        Assert.DoesNotContain("data-progressive-gallery", html);
    }

    [Theory]
    [InlineData("single-vision")]
    [InlineData("outdoor")]
    [InlineData("indoor")]
    [InlineData("slim")]
    public async Task OtherMonofocalPagesNowShareTheCarousel(string slug)
    {
        var html = await client.GetStringAsync($"/lentes/{slug}");
        Assert.Contains("data-product-gallery", html);
        Assert.DoesNotContain("data-gallery-controls", html);
        Assert.Contains("/js/progressive-gallery.js", html);
    }
}
