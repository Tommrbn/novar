using System.Net;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Novar.Web.Services;

namespace Novar.Web.Tests;

public sealed class ProductTaglineTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Theory]
    [InlineData("es")]
    [InlineData("en")]
    [InlineData("pt-BR")]
    public async Task EveryExistingProductBandHasOneSharedRevealAndKeepsItsOriginalArtwork(string culture)
    {
        var content = factory.Services.GetRequiredService<SiteContent>();
        var slugs = content.ProgressiveProducts.Keys.Concat(content.MonofocalProducts.Keys)
            .Concat(content.BifocalOccupationalProducts.Keys).Append(content.First.Slug);
        foreach (var slug in slugs)
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, $"/lentes/{slug}");
            request.Headers.AcceptLanguage.ParseAdd(culture);
            var response = await client.SendAsync(request);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var html = WebUtility.HtmlDecode(await response.Content.ReadAsStringAsync());
            Assert.Single(Regex.Matches(html, "data-product-tagline"));
            var hero = Regex.Match(html, "<section class=\"(?:prg|mono|bop)-hero\"[\\s\\S]*?</section>");
            Assert.True(hero.Success, $"{slug} must expose its banner before the shared reveal.");
            var afterHero = html[(hero.Index + hero.Length)..].TrimStart();
            Assert.Matches("^<div class=\"(?:prg|mono|bop)-tagline\" data-product-tagline", afterHero);
            Assert.Single(Regex.Matches(html, "/js/product-tagline.js"));
            var bootstrap = Regex.Match(html, "<script[^>]+src=\"/js/product-tagline.js[^\"]*\"[^>]*>").Value;
            Assert.NotEmpty(bootstrap);
            Assert.DoesNotContain("defer", bootstrap); // Opt in before rendering, not after a cold script request.
            Assert.DoesNotContain("async", bootstrap);
            Assert.Single(Regex.Matches(html, "/css/product-tagline.css"));
            Assert.Contains("/media/figma/33850.png", html);
            Assert.Contains("/media/figma/5cebf.svg", html);
            Assert.DoesNotContain("data-tagline-state=\"covered\"", html); // No-JS fallback remains visible.
            Assert.DoesNotContain("bop-tagline-hover", html); // Scrolling, not pointer hover, owns the reveal.
        }
    }

    [Theory]
    [InlineData("/")]
    [InlineData("/lentes")]
    [InlineData("/sobre-nosotros")]
    [InlineData("/tratamientos")]
    [InlineData("/juegos")]
    [InlineData("/lentes/ai-lens")]
    [InlineData("/lentes/myolens")]
    [InlineData("/lentes/aiwork")]
    public async Task OtherSurfacesDoNotLoadTheReveal(string route)
    {
        var html = await client.GetStringAsync(route);
        Assert.DoesNotContain("data-product-tagline", html);
        Assert.DoesNotContain("/js/product-tagline.js", html);
        Assert.DoesNotContain("/css/product-tagline.css", html);
    }
}
