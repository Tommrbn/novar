using System.Globalization;
using System.Net;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Novar.Web.Services;

namespace Novar.Web.Tests;

public sealed class ProgressiveRelatedTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Theory]
    [InlineData("es", "Ver más")]
    [InlineData("en", "See more")]
    [InlineData("pt-BR", "Ver mais")]
    public async Task FourFigmaPhotosGroupTheVariantsOnEveryProgressivePage(string culture, string action)
    {
        var catalog = factory.Services.GetRequiredService<SiteContent>().ForCulture(CultureInfo.GetCultureInfo(culture));
        var destinations = new[] { "ai-lens", "precisa", "precisa-short", "evolution", "evolution-short", "elife" };
        foreach (var current in new[] { "first", "precisa", "precisa-short", "evolution", "evolution-short", "elife" })
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, $"/lentes/{current}");
            request.Headers.AcceptLanguage.ParseAdd(culture);
            var html = WebUtility.HtmlDecode(await (await client.SendAsync(request)).Content.ReadAsStringAsync());
            var section = Regex.Match(html, "<section class=\"prg-related[^\"]*\"[\\s\\S]*?</section>").Value;
            var cards = Regex.Matches(section, "<details[^>]*>[\\s\\S]*?</details>").Select(match => match.Value).ToArray();
            Assert.Equal(4, cards.Length);
            Assert.Equal(new[] { 1, 2, 2, 1 }, cards.Select(card => Regex.Matches(card, "<a ").Count));
            Assert.Equal(destinations, Regex.Matches(section, "href=\"/lentes/([^\"]+)\"").Select(match => match.Groups[1].Value));
            Assert.Equal(new[] { "689:4996", "689:4995", "689:4993", "689:4994" },
                Regex.Matches(section, "data-figma-node=\"([^\"]+)\"").Select(match => match.Groups[1].Value));
            foreach (var (card, photo) in cards.Zip(new[] { "ca299.png", "1f46b.png", "ef547.png", "43874.png" }))
            {
                Assert.Contains("<summary", card); // Native touch/keyboard disclosure, also usable without JS.
                Assert.Contains("/media/figma/f9381.png", card);
                Assert.Contains($"/media/figma/{photo}", card);
                Assert.Contains(action, card);
                Assert.DoesNotContain(" open", card.Split('>')[0]);
            }
            foreach (var slug in destinations)
                Assert.Contains(slug == "ai-lens" ? catalog.PremiumProducts[slug].Name : catalog.ProgressiveProducts[slug].Name, section);
            Assert.Equal(current == "first" ? 0 : 1, Regex.Matches(section, "aria-current=\"page\"").Count);
            Assert.Single(Regex.Matches(html, "/js/progressive-related.js"));
        }
        foreach (var slug in destinations)
            Assert.Equal(HttpStatusCode.OK, (await client.GetAsync($"/lentes/{slug}")).StatusCode);
    }

    [Fact]
    public async Task HoverMotionRevealsTheVeilWithoutMovingOrResizingTheOriginalPhotos()
    {
        var css = await client.GetStringAsync("/css/progressive-products.css");
        Assert.Contains("prg-related-aperture 420ms cubic-bezier(.16, 1, .3, 1)", css);
        Assert.Contains("from { clip-path: inset(50% 0); opacity: 0; }", css);
        Assert.Contains("prg-related-focus 240ms ease-out 80ms", css);
        Assert.Contains("animation-delay: 120ms", css);
        Assert.Contains("transition: filter 180ms ease-out", css);
        Assert.Contains("filter: blur(2.5px)", css);
        Assert.Contains("background: rgb(31 2 60 / 66%)", css);
        var related = css[css.IndexOf(".prg-related {")..css.IndexOf(".prg-footer {")];
        Assert.DoesNotContain("transform:", related);
        Assert.DoesNotContain("transition: all", related);
        Assert.DoesNotContain("will-change", related);
        Assert.Contains("width: 134.26%; height: 204.56%; left: -14.4%; top: -40.54%", related);
        Assert.Contains(".prg-related-card--evolution .prg-related-media { right: -3.91%; }", related);
        var reduced = css[css.IndexOf("@media (prefers-reduced-motion: reduce)")..];
        Assert.Contains(".prg-related-card[open] .prg-related-option { animation: none; }", reduced);
        Assert.Contains(".prg-related-card[open] .prg-related-media { transition-duration: 0s; }", reduced);
        Assert.DoesNotContain(".prg-related-card[open] > .prg-related-options", await client.GetStringAsync("/css/product-presentation.css"));
    }

    [Fact]
    public async Task EverySourceLayerAndCtaIsServedLocally()
    {
        foreach (var asset in new[] { "f9381.png", "ca299.png", "1f46b.png", "ef547.png", "43874.png", "dd7d5.svg" })
        {
            var response = await client.GetAsync($"/media/figma/{asset}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.NotEmpty(await response.Content.ReadAsByteArrayAsync());
        }
        foreach (var route in new[] { "/", "/lentes", "/lentes/ai-lens", "/lentes/geo", "/lentes/office" })
            Assert.DoesNotContain("/js/progressive-related.js", await client.GetStringAsync(route));
    }
}
