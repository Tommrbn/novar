using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Novar.Web.Tests;

public sealed class BifocalRelatedTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task ContentFocusDoesNotOutlineThePageAndRelatedLinksKeepKeyboardFocus()
    {
        var css = await client.GetStringAsync("/css/bifocal-occupational-products.css");
        Assert.Contains(".bifocal-occupational-page #main:has(> :is(.bop-product--office, .bop-product--kriptok-blended, .bop-product--freeline)):focus-visible { outline: 0 !important; }", css);
        Assert.Contains(".bop-related-images a:focus-visible { outline: 3px solid #6b5a8a; outline-offset: 3px; }", css);
        var siteCss = await client.GetStringAsync("/css/site.css");
        Assert.Contains(":focus-visible { outline: 3px solid #9564d1 !important;", siteCss);

        foreach (var slug in new[] { "office", "kriptok-blended", "freeline" })
        {
            var html = await client.GetStringAsync($"/lentes/{slug}");
            Assert.Contains("<main id=\"main\" tabindex=\"-1\">", html);
            Assert.Contains("href=\"#main\"", html);
            var related = Regex.Match(html, "<section class=\"bop-related[^\"]*\"[\\s\\S]*?</section>").Value;
            Assert.NotEmpty(related);
            Assert.Contains("data-related-cta=", related);
            Assert.DoesNotContain("tabindex=\"-1\"", related);
        }
    }

    [Theory]
    [InlineData("es")]
    [InlineData("en")]
    [InlineData("pt-BR")]
    public async Task EveryBifocalUsesTheThreeSourcePortraitsInOrder(string culture)
    {
        foreach (var slug in new[] { "ultex-blended", "kriptok-blended", "freeline" })
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, $"/lentes/{slug}");
            request.Headers.AcceptLanguage.ParseAdd(culture);
            var html = await (await client.SendAsync(request)).Content.ReadAsStringAsync();
            var section = Regex.Match(html, "<section class=\"bop-related bop-related--bifocal\"[\\s\\S]*?</section>").Value;
            Assert.NotEmpty(section);
            var cards = Regex.Matches(section, "<a href=\"/lentes/(?<slug>[^\"]+)\"(?<attrs>[^>]*)><img src=\"/media/figma/(?<file>[^\"]+)\"");
            Assert.Equal(new[] { "ultex-blended", "kriptok-blended", "freeline" }, cards.Select(card => card.Groups["slug"].Value));
            Assert.Equal(new[] { "961e1.png", "2c53f.png", "28518.png" }, cards.Select(card => card.Groups["file"].Value));
            var nodes = slug == "kriptok-blended" ? new[] { "1145:1940", "1145:1943", "1145:1947" } : new[] { "1145:1955", "1145:1957", "1145:1958" };
            Assert.Equal(nodes, Regex.Matches(section, "data-figma-node=\"([^\"]+)\"").Select(match => match.Groups[1].Value));
            Assert.Equal(slug, Assert.Single(cards, card => card.Groups["attrs"].Value.Contains("aria-current=\"page\"")).Groups["slug"].Value);
            Assert.Equal(3, Regex.Matches(section, "data-related-cta=\"[^\"]+\"").Count);
            foreach (Match card in cards)
                Assert.NotEmpty(await client.GetByteArrayAsync($"/media/figma/{card.Groups["file"].Value}"));
        }
    }

    [Fact]
    public async Task SourceCropsAreSharedOnlyByBifocalsAndCannotBeFlattenedByTheCtaStyle()
    {
        var css = await client.GetStringAsync("/css/bifocal-occupational-products.css");
        Assert.Contains(".bop-related--bifocal .bop-related-images { width: max(100%, 1446px); height: auto; grid-template-columns: 475fr 486fr 485fr; }", css);
        Assert.Contains(".bop-related--bifocal .bop-related-images img { position: absolute; max-width: none; width: 100%; height: 166.08%; left: 0; top: -14.28%; object-fit: fill; }", css);
        Assert.Contains(".bop-related--bifocal .bop-related-images > a:nth-child(2) img { height: 226.19%; left: .07%; top: -37.42%; }", css);
        Assert.Contains(".bop-related--bifocal .bop-related-images > a:nth-child(3) img { height: 169.58%; left: .1%; top: -7.14%; }", css);
        Assert.Contains(".bop-related--bifocal .bop-related-images > a { flex-basis: min(85vw, 475px); }", css);
        var sharedCss = await client.GetStringAsync("/css/product-presentation.css");
        Assert.DoesNotContain(".bop-product:not(.bop-product--kriptok-blended)", sharedCss);
        Assert.Contains("#main .bop-related--office .bop-related-images > a[data-related-cta] > img { height: 100%; }", sharedCss);
        var office = await client.GetStringAsync("/lentes/office");
        Assert.DoesNotContain("bop-related--bifocal", office);
        Assert.Contains("bop-related--office", office);
    }
}
