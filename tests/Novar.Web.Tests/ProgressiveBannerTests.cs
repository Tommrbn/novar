using System.Net;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Novar.Web.Tests;

public sealed class ProgressiveBannerTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Theory]
    [InlineData("first", "689:4834", "first-2x.webp", 1522)]
    [InlineData("precisa", "974:904", "precisa-2x.webp", 1525)]
    [InlineData("precisa-short", "982:222", "precisa-2x.webp", 1525)]
    [InlineData("evolution", "964:3015", "evolution-2x.webp", 1533)]
    [InlineData("evolution-short", "1092:235", "evolution-2x.webp", 1533)]
    [InlineData("elife", "974:547", "elife-2x.webp", 1526)]
    public async Task EveryLocaleUsesTheSelectedOpaqueBannerWithoutAnUnrelatedUnderlay(string slug, string node, string asset, int height)
    {
        foreach (var culture in new[] { "es", "en", "pt-BR" })
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, $"/lentes/{slug}");
            request.Headers.AcceptLanguage.ParseAdd(culture);
            var response = await client.SendAsync(request);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var html = await response.Content.ReadAsStringAsync();
            var hero = Regex.Match(html, "<section class=\"prg-hero\"[\\s\\S]*?</section>").Value;
            var art = Regex.Match(hero, "<div class=\"prg-hero-art\"[\\s\\S]*?</div>").Value;
            Assert.Contains($"data-figma-node=\"{node}\"", art);
            Assert.Contains($"/media/products/banners/{asset}", art);
            Assert.Contains($"width=\"2880\" height=\"{height}\" data-product-banner fetchpriority=\"high\"", art);
            Assert.Single(Regex.Matches(art, "<img "));
            Assert.DoesNotContain("hero-underlay", art);
            Assert.Single(Regex.Matches(hero, "<h1(?: |>)"));
            Assert.Contains("href=\"/tratamientos\"", hero);
            // The change must not replace unrelated gallery or related-product images.
            Assert.DoesNotContain(asset, html[(html.IndexOf(hero, StringComparison.Ordinal) + hero.Length)..]);
        }
        Assert.NotEmpty(await client.GetByteArrayAsync($"/media/products/banners/{asset}"));
    }
}
