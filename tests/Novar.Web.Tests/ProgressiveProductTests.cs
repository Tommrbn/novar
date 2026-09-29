using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Novar.Web.Services;

namespace Novar.Web.Tests;

public sealed class ProgressiveProductTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Theory]
    [InlineData("precisa", "974:621", "415", "107")]
    [InlineData("precisa-short", "982:221", "308", "188")]
    [InlineData("evolution", "964:2655", "415", "107")]
    [InlineData("evolution-short", "1002:246", "411", "204")]
    [InlineData("elife", "974:266", "415", "107")]
    public async Task ProductUsesItsOwnSourceAndOriginalOutlinedWordmark(string slug, string node, string width, string height)
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync($"/lentes/{slug}"));
        Assert.Contains($"data-figma-node=\"{node}\"", html);
        Assert.Contains("data-progresivos-revision=\"progresivos-v1\"", html);
        Assert.Contains("/css/progressive-products.css", html);
        Assert.Contains("class=\"prg-footer\"", html);
        Assert.Contains("href=\"/lentes\" aria-current=\"page\"", html);
        Assert.Single(Regex.Matches(html, "<h1(?: |>)"));
        Assert.DoesNotContain("Ficha en preparación", html);
        Assert.DoesNotContain("Ver muestra: Novar First", html);
        Assert.Contains($"data-pending=\"Personalización de Novar {factory.Services.GetRequiredService<SiteContent>().ProgressiveProducts[slug].Name}\"", html);
        Assert.Contains("no se envían ni almacenan datos y no se generan resultados", html);
        Assert.DoesNotContain("<form", html);
        var svg = XDocument.Parse(await client.GetStringAsync($"/media/figma/{slug}-wordmark.svg"));
        Assert.Equal(width, svg.Root!.Attribute("width")!.Value);
        Assert.Equal(height, svg.Root.Attribute("height")!.Value);
        Assert.Equal(10, svg.Descendants().Count(x => x.Name.LocalName == "path"));
        Assert.DoesNotContain(svg.Descendants(), x => x.Name.LocalName == "text");
        Assert.Equal(HttpStatusCode.MethodNotAllowed, (await client.PostAsync($"/lentes/{slug}", new StringContent(""))).StatusCode);
    }

    [Fact]
    public async Task AllImplementedProgressivesRetainLocalAssetsAndHonestFaqBehavior()
    {
        var content = factory.Services.GetRequiredService<SiteContent>();
        Assert.Equal(new[] { "elife", "evolution", "evolution-short", "precisa", "precisa-short" }, content.ProgressiveProducts.Keys.Order());
        Assert.Equal(18, content.PremiumProducts.Keys.Concat(content.ProgressiveProducts.Keys).Concat(content.MonofocalProducts.Keys).Concat(content.BifocalOccupationalProducts.Keys).Concat(content.PlannedProducts).Append(content.First.Slug).Distinct().Count());
        foreach (var product in content.ProgressiveProducts.Values)
        {
            Assert.False(content.PlannedProducts.Contains(product.Slug));
            Assert.False(content.PremiumProducts.ContainsKey(product.Slug));
            Assert.Equal(3, product.Questions.Length);
            Assert.Single(product.Questions, x => x.Answer is not null);
            var html = WebUtility.HtmlDecode(await client.GetStringAsync($"/lentes/{product.Slug}"));
            var faq = Regex.Match(html, "<section class=\"prg-faq\"[\\s\\S]*?</section>").Value;
            Assert.Equal(3, Regex.Matches(faq, "class=\"accordion-button ").Count);
            Assert.Equal(2, Regex.Matches(faq, "Respuesta pendiente de revisión editorial").Count);
            Assert.Single(Regex.Matches(faq, "aria-expanded=\"true\""));
            Assert.Contains($"id=\"prg-{product.Slug}-faq-2\" class=\"accordion-collapse collapse show\"", faq);
            Assert.Equal(3, Regex.Matches(faq, "data-bs-parent=").Count);
            Assert.Contains("Preguntas<br /> frecuentes", faq);
            Assert.Equal(product.Technologies.Length, Regex.Matches(html, "class=\"prg-technology-card\"").Count);
            Assert.Equal(4, product.Gallery.Length);
            foreach (var path in Regex.Matches(html, "(?:src|href)=\"(?<path>/(?:media|fonts|vendor|css|js)/[^\"]+)\"").Select(m => m.Groups["path"].Value).Distinct())
            {
                var response = await client.GetAsync(path);
                Assert.True(response.IsSuccessStatusCode, path);
                Assert.NotEmpty(await response.Content.ReadAsByteArrayAsync());
            }
            Assert.DoesNotContain("figma.com/api", html);
            Assert.Single(Regex.Matches(html, "/js/progressive-gallery\\.js"));
        }
    }

    [Fact]
    public void PrecisaShortSourceIdentityIsPreservedNotSilentlyRewritten()
    {
        var products = factory.Services.GetRequiredService<SiteContent>().ProgressiveProducts;
        Assert.Equal("Precisa Short", products["precisa-short"].Name);
        Assert.Contains("armazones de menor tamaño", products["precisa-short"].Description);
        Assert.Equal("¿Qué es Novar Precisa?", products["precisa-short"].Questions[0].Question);
        Assert.Contains("Novar Precisa acompaña", products["precisa-short"].Intro);
        Assert.Equal(new[] { "Media / Alta", "Media / Alta", "Alta" }, products["precisa"].Benefits.Select(x => x.Level));
        Assert.Equal(2, products["precisa"].Technologies.Length);
        Assert.Equal(2, products["precisa-short"].Technologies.Length);
    }

    [Fact]
    public void EvolutionVariantsPreserveTheirSourceDifferences()
    {
        var products = factory.Services.GetRequiredService<SiteContent>().ProgressiveProducts;
        var evolution = products["evolution"];
        var compact = products["evolution-short"];
        Assert.Contains("Novar Geo", evolution.Details);
        Assert.Contains("opción monofocal", evolution.Details);
        Assert.Contains("Smart Molding Process", evolution.TechnologySpec);
        Assert.Equal("Smart Fit Technology", evolution.Technologies[2].Name);
        Assert.Equal("Usuariosexigentes que usan armazones pequeños.", compact.IdealFor);
        Assert.Equal(3, evolution.Technologies.Length);
        Assert.Equal(2, compact.Technologies.Length);
        Assert.Equal(new[] { "Alta", "Alta", "Alta" }, evolution.Benefits.Select(x => x.Level));
        Assert.Equal(new[] { "Media / Alta", "Media / Alta", "Alta" }, compact.Benefits.Select(x => x.Level));
        Assert.Equal("65030.png", compact.HeroUnderlay);
    }

    [Fact]
    public void ElifeKeepsFreshFaqIdentityAndSourceTechnologySpellings()
    {
        var product = factory.Services.GetRequiredService<SiteContent>().ProgressiveProducts["elife"];
        Assert.Equal("¿Qué es Novar eLife?", product.Questions[0].Question);
        Assert.Equal("¿Para quién está recomendado Novar eLife?", product.Questions[1].Question);
        Assert.DoesNotContain("Geo", string.Join(" ", product.Questions.Select(x => x.Question)));
        Assert.Contains("Adaptive Focus Technology", product.TechnologySpec);
        Assert.Equal("Adaptative Focus Technology", product.Technologies[2].Name);
        Assert.Equal(new[] { "Media", "Alta", "Alta" }, product.Benefits.Select(x => x.Level));
    }

    [Fact]
    public async Task FirstKeepsItsModelContentAndInteractionWhileUsingCorrectedSourceGeometry()
    {
        var first = factory.Services.GetRequiredService<SiteContent>().First;
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/lentes/first"));
        Assert.Equal("689:4828", first.SourceNode);
        Assert.Equal(3, first.Questions.Length);
        Assert.Equal(0, first.Questions.Count(x => x.Answer is null));
        Assert.Equal(2, first.Technologies.Length);
        Assert.Equal(new[] { "Alta", "Media", "Media" }, first.Benefits.Select(x => x.Level));
        Assert.Contains("data-progresivos-revision=\"progresivos-v1\"", html);
        Assert.Contains("/css/progressive-first.css", html);
        Assert.Contains("href=\"/lentes\" aria-current=\"page\"", html);
        Assert.Contains("/media/figma/4fa80.png", html);
        Assert.DoesNotContain("/media/figma/1fce9.png", html);
        Assert.Contains("data-pending=\"Personalización de Novar First\"", html);
        Assert.Contains("id=\"first-faq-2\" class=\"accordion-collapse collapse show\"", html);
        Assert.Contains(first.Questions[2].Answer!, html);
        Assert.Contains("href=\"/tratamientos\"", html);
        Assert.Contains("href=\"/#contacto\"", html);
        Assert.Single(Regex.Matches(html, "<h1(?: |>)"));
        foreach (var asset in new[] { "720fe.svg", "bcfcf.svg", "4cd56.svg", "201ad.svg", "10f0c.svg" })
        {
            var tag = Regex.Match(html, $"<img[^>]+{Regex.Escape(asset)}[^>]*>").Value;
            Assert.NotEmpty(tag);
            Assert.DoesNotContain("width=", tag);
            Assert.DoesNotContain("height=", tag);
        }
    }

    [Fact]
    public async Task FirstFaqMatchesExactlyTheThreeUserSuppliedPairsAndLastOpenPanel()
    {
        var first = factory.Services.GetRequiredService<SiteContent>().First;
        var expected = new (string Question, string? Answer)[]
        {
            ("¿Qué es Novar First?", "Es un lente progresivo pensado para personas que comienzan a usar multifocales y buscan una adaptación cómoda."),
            ("¿Para quién está recomendado?", "Para usuarios que empiezan a notar dificultad para ver de cerca y necesitan una solución progresiva para todas las distancias."),
            ("¿Qué lo diferencia?", "Su diseño prioriza una experiencia simple, natural y fácil de incorporar al uso diario.")
        };
        Assert.Equal(expected, first.Questions.Select(x => (x.Question, x.Answer)));
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/lentes/first"));
        var faq = Regex.Match(html, "<section class=\"prg-faq\"[\\s\\S]*?</section>").Value;
        Assert.Equal(3, Regex.Matches(faq, "class=\"accordion-button ").Count);
        Assert.Single(Regex.Matches(faq, "aria-expanded=\"true\""));
        Assert.Contains("id=\"first-faq-2\" class=\"accordion-collapse collapse show\"", faq);
        Assert.DoesNotContain("first-faq-3", faq);
        Assert.DoesNotContain("Respuesta pendiente", faq);
        Assert.DoesNotContain("¿Cómo elijo armazón y tratamiento?", faq);
        for (var i = 0; i < expected.Length; i++)
        {
            Assert.Single(Regex.Matches(faq, Regex.Escape(expected[i].Item1)));
            Assert.Single(Regex.Matches(faq, Regex.Escape(expected[i].Answer!)));
            Assert.Contains($"aria-controls=\"first-faq-{i}\"", faq);
            Assert.Contains($"id=\"first-faq-{i}\"", faq);
            if (i > 0) Assert.True(faq.IndexOf(expected[i].Item1, StringComparison.Ordinal) > faq.IndexOf(expected[i - 1].Item1, StringComparison.Ordinal));
        }
    }

    [Theory]
    [InlineData("first")]
    [InlineData("precisa")]
    [InlineData("precisa-short")]
    [InlineData("evolution")]
    [InlineData("evolution-short")]
    [InlineData("elife")]
    public async Task SixGalleriesUseOneScopedScriptAndOriginalStaticFallback(string slug)
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync($"/lentes/{slug}"));
        var gallery = Regex.Match(html, "<section class=\"prg-gallery\"[\\s\\S]*?</section>").Value;
        var trackId = slug == "first" ? "first-gallery-images" : $"prg-{slug}-gallery-images";
        var expected = slug == "first"
            ? new[] { "32288.png", "1319b.png", "46906.png", "2131c.png" }
            : factory.Services.GetRequiredService<SiteContent>().ProgressiveProducts[slug].Gallery;
        Assert.Contains("data-gallery-revision=\"progresivos-gallery-v2\"", gallery);
        Assert.Contains("data-progressive-gallery", gallery);
        Assert.Contains("aria-roledescription=\"carrusel\"", gallery);
        Assert.Contains($"id=\"{trackId}\"", gallery);
        Assert.Equal(expected, Regex.Matches(gallery, "data-gallery-image=\"([^\"]+)\"").Select(x => x.Groups[1].Value));
        Assert.Equal(3, Regex.Matches(gallery, $"aria-controls=\"{trackId}\"").Count);
        Assert.Equal(3, Regex.Matches(gallery, "<button type=\"button\"").Count);
        Assert.Contains("data-gallery-controls hidden", gallery);
        Assert.Contains("data-gallery-pause", gallery);
        Assert.Contains("aria-pressed=\"false\"", gallery);
        Assert.Contains("aria-live=\"polite\"", gallery);
        Assert.DoesNotContain("is-enhanced", gallery);
        Assert.DoesNotContain("style=", gallery);
        foreach (var file in expected)
        {
            Assert.Single(Regex.Matches(gallery, $"src=\"/media/figma/{Regex.Escape(file)}\""));
        }
        Assert.Single(Regex.Matches(html, "<script[^>]+/js/progressive-gallery\\.js"));
        var script = await client.GetAsync("/js/progressive-gallery.js");
        Assert.Equal(HttpStatusCode.OK, script.StatusCode);
        Assert.Contains("const INTERVAL = 5000", await script.Content.ReadAsStringAsync());
    }

    [Theory]
    [InlineData("/")]
    [InlineData("/lentes")]
    [InlineData("/lentes/ai-lens")]
    [InlineData("/lentes/myolens")]
    [InlineData("/lentes/aiwork")]
    [InlineData("/sobre-nosotros")]
    [InlineData("/juegos")]
    [InlineData("/tratamientos")]
    [InlineData("/lentes/geo")]
    [InlineData("/lentes/single-vision")]
    [InlineData("/lentes/outdoor")]
    [InlineData("/lentes/indoor")]
    [InlineData("/lentes/slim")]
    [InlineData("/lentes/freeline")]
    public async Task PresentationIsIsolatedFromUnrelatedPages(string route)
    {
        var html = await client.GetStringAsync(route);
        Assert.DoesNotContain("/css/progressive-products.css", html);
        Assert.DoesNotContain("progresivos-v1", html);
        Assert.DoesNotContain("class=\"prg-footer\"", html);
        Assert.DoesNotContain("/css/progressive-first.css", html);
        Assert.DoesNotContain("/js/progressive-gallery.js", html);
        Assert.DoesNotContain("data-progressive-gallery", html);
    }

    [Theory]
    [InlineData("/lentes/myofix")]
    [InlineData("/lentes/unknown")]
    public async Task UnknownIdentitiesStillReturn404(string route) =>
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync(route)).StatusCode);

    [Fact]
    public async Task RelatedLinksRemainCatalogOnlyAndNoInventedTaglineSwitchExists()
    {
        var html = await client.GetStringAsync("/lentes/precisa");
        var related = Regex.Match(html, "<section class=\"prg-related\"[\\s\\S]*?</section>").Value;
        Assert.Equal(4, Regex.Matches(related, "href=\"/lentes\"").Count);
        Assert.DoesNotContain("Visión sin esfuerzo", html);
        Assert.Contains("Visión equilibrada", WebUtility.HtmlDecode(html));
    }
}
