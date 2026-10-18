using System.Net;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Novar.Web.Services;

namespace Novar.Web.Tests;

public sealed class ProductPresentationTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();
    private SiteContent Content => factory.Services.GetRequiredService<SiteContent>();

    [Theory]
    [InlineData("es")]
    [InlineData("en")]
    [InlineData("pt-BR")]
    public async Task AllFifteenPortraitGalleriesUseSharedMotionWithoutVisibleNavigation(string culture)
    {
        var slugs = Content.ProgressiveProducts.Keys.Concat(Content.MonofocalProducts.Keys)
            .Concat(Content.BifocalOccupationalProducts.Keys).Append("first").ToArray();
        Assert.Equal(15, slugs.Length);
        foreach (var slug in slugs)
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, $"/lentes/{slug}");
            request.Headers.AcceptLanguage.ParseAdd(culture);
            var response = await client.SendAsync(request);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var html = await response.Content.ReadAsStringAsync();
            Assert.Contains("/css/product-presentation.css", html);
            Assert.Single(Regex.Matches(html, "/js/progressive-gallery\\.js"));
            Assert.Single(Regex.Matches(html, "data-product-tagline"));
            Assert.Equal(4, Regex.Matches(html, "data-gallery-image=").Count);
            Assert.Contains("gallery-motion-control visually-hidden-focusable", html);
            Assert.Contains("data-gallery-pause aria-pressed=\"false\"", html);
            Assert.DoesNotContain("data-gallery-previous", html);
            Assert.DoesNotContain("data-gallery-next", html);
            Assert.DoesNotContain("data-gallery-autoplay-interval", html);
            Assert.DoesNotContain("data-gallery-pause-control", html);
            if (Content.MonofocalProducts.ContainsKey(slug) || Content.BifocalOccupationalProducts.ContainsKey(slug))
            {
                var cards = Regex.Matches(html, "<a href=\"(?<href>/lentes/[^\"]+)\"[^>]*data-related-cta=\"(?<cta>[^\"]+)\"[^>]*><img[^>]+/><span[^>]*>(?<name>[^<]+)</span></a>");
                Assert.NotEmpty(cards);
                foreach (Match card in cards)
                {
                    Assert.NotEmpty(card.Groups["cta"].Value);
                    Assert.NotEmpty(card.Groups["name"].Value);
                    Assert.Equal(HttpStatusCode.OK, (await client.GetAsync(card.Groups["href"].Value)).StatusCode);
                }
            }
        }
        Assert.Contains("const INTERVAL = 2000", await client.GetStringAsync("/js/progressive-gallery.js"));
    }

    [Fact]
    public async Task TechnologyCardsFrostTheirBackdropWithoutBlurringTheirOwnContent()
    {
        var css = await client.GetStringAsync("/css/product-presentation.css");
        var glass = css[..css.IndexOf("/* Decorative product lettering")];
        Assert.Contains(":is(.prg-technology-card, .mono-technology-card, .bop-technology-card)", glass);
        Assert.Contains("background: #f3f2f5", glass);
        Assert.Contains("@supports ((backdrop-filter:", glass);
        Assert.Contains("background: rgb(246 245 247 / 90%)", glass);
        Assert.Contains("-webkit-backdrop-filter: blur(28px)", glass);
        Assert.Contains("backdrop-filter: blur(28px)", glass);
        Assert.DoesNotMatch(@"(?<!backdrop-)filter:\s*blur", glass);

        var slugs = Content.ProgressiveProducts.Keys.Concat(Content.MonofocalProducts.Keys)
            .Concat(Content.BifocalOccupationalProducts.Keys).Append("first");
        foreach (var slug in slugs)
        {
            var html = await client.GetStringAsync($"/lentes/{slug}");
            Assert.Matches("class=\"(?:prg|mono|bop)-technology-card\"", html);
            Assert.Contains("/css/product-presentation.css", html);
        }
    }

    [Fact]
    public async Task RelatedPortraitsKeepTheirColorsAndBlurOnlyForHoverOrKeyboardFocus()
    {
        var css = await client.GetStringAsync("/css/product-presentation.css");
        var related = css[css.IndexOf("/* Existing portrait links")..];
        Assert.DoesNotContain("::before", related);
        Assert.DoesNotContain("rgb(31 2 60 / 66%)", related);
        Assert.Contains("@media (hover: hover) and (pointer: fine)", related);
        Assert.Contains(":hover > img { filter: blur(2.5px); }", related);
        Assert.Contains(":focus-visible > img { filter: blur(2.5px); }", related);
        Assert.Contains("background: #1f023c", related); // Only the CTA, not a photo veil.
        var touch = related[related.IndexOf("@media (hover: none)")..related.IndexOf("@media (prefers-reduced-motion")];
        Assert.DoesNotContain("filter:", touch);
        Assert.Contains("opacity: 1", touch); // Direct touch links remain discoverable.
    }

    [Fact]
    public async Task MobileHeroReservesTheFullPortraitHeightBeforeTheLogotype()
    {
        var css = await client.GetStringAsync("/css/product-presentation.css");
        Assert.Matches(@"@media \(max-width: 767px\)\s*\{\s*/\*[^*]*\*/\s*:is\(\.progresivos-page, \.monofocales-page, \.bifocal-occupational-page\) #main :is\(\.prg-hero, \.mono-hero, \.bop-hero\) \{ padding-top: 420px; \}", css);
    }

    [Fact]
    public async Task SharedPresentationDoesNotAddInventedSectionsOrLeakIntoHome()
    {
        foreach (var slug in Content.PremiumProducts.Keys)
        {
            var html = await client.GetStringAsync($"/lentes/{slug}");
            Assert.Contains("/css/product-presentation.css", html);
            Assert.DoesNotContain("data-product-tagline", html);
            Assert.DoesNotContain("data-product-gallery", html); // These have one editorial image, not four portraits.
        }
        foreach (var route in new[] { "/", "/lentes", "/sobre-nosotros", "/juegos", "/tratamientos" })
            Assert.DoesNotContain("/css/product-presentation.css", await client.GetStringAsync(route));
    }
}
