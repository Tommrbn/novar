using System.Globalization;
using System.Net;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Novar.Web.Services;

namespace Novar.Web.Tests;

public sealed class ProductPatternTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();
    private SiteContent Content => factory.Services.GetRequiredService<SiteContent>();

    [Fact]
    public async Task AllEighteenProductRoutesUseTheSharedLensFinderNavigation()
    {
        var routes = Content.PremiumProducts.Keys.Concat(Content.ProgressiveProducts.Keys)
            .Concat(Content.MonofocalProducts.Keys).Concat(Content.BifocalOccupationalProducts.Keys).Append(Content.First.Slug)
            .Select(slug => $"/lentes/{slug}").ToArray();
        Assert.Equal(18, routes.Length);

        foreach (var route in routes)
        {
            var html = await client.GetStringAsync(route);
            Assert.Contains("href=\"/lentes\" aria-current=\"page\">Encontrá tu lente</a>", WebUtility.HtmlDecode(html));
        }

        var root = FindRoot();
        foreach (var (file, pageClass) in new[]
        {
            ("progressive-products.css", "progresivos-page"),
            ("monofocal-products.css", "monofocales-page"),
            ("bifocal-occupational-products.css", "bifocal-occupational-page"),
            ("premium.css", "premium-page")
        })
        {
            var css = File.ReadAllText(Path.Combine(root, "src", "Novar.Web", "wwwroot", "css", file));
            Assert.Contains($".{pageClass} .navbar .nav-link {{", css);
            Assert.Contains("font-family: Poppins, sans-serif; font-weight: 400", css);
            Assert.Contains($".{pageClass} .navbar .nav-link[aria-current=\"page\"]", css);
            var activeRule = Regex.Escape($".{pageClass} .navbar .nav-link[aria-current=\"page\"]") + @"[^{}]*\{[^}]*font-weight:\s*600";
            Assert.Matches(activeRule, css);
        }
    }

    [Theory]
    [InlineData("es", "Encontrá tu lente", "Personalizá tu lente")]
    [InlineData("en", "Find your lens", "Customize your lenses")]
    [InlineData("pt-BR", "Encontre suas lentes", "Personalize suas lentes")]
    public async Task ExistingCustomizationLinksKeepLocalizedLabelsAndRoute(string culture, string finderLabel, string personalizeLabel)
    {
        var routes = Content.ProgressiveProducts.Keys.Concat(Content.MonofocalProducts.Keys)
            .Concat(Content.BifocalOccupationalProducts.Keys).Append(Content.First.Slug).Select(slug => $"/lentes/{slug}");

        foreach (var route in routes)
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, route);
            if (culture != "es") request.Headers.AcceptLanguage.ParseAdd(culture);
            var response = await client.SendAsync(request);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var html = WebUtility.HtmlDecode(await response.Content.ReadAsStringAsync());
            Assert.Contains($"href=\"/lentes\" aria-current=\"page\">{finderLabel}</a>", html);
            Assert.Contains($"href=\"/tratamientos\">{personalizeLabel}</a>", html);
        }
    }

    [Theory]
    [InlineData("es")]
    [InlineData("en")]
    [InlineData("pt-BR")]
    public async Task OtherProductFamiliesKeepLocalizedSiblingProducts(string culture)
    {
        var localized = Content.ForCulture(CultureInfo.GetCultureInfo(culture));
        var cases = new List<(string CurrentSlug, string SectionClass, (string Slug, string Name, string Hero)[] Expected)>();
        // Progressive family banners are covered by ProgressiveRelatedTests.
        cases.AddRange(localized.MonofocalProducts.Values.Select(current =>
            (current.Slug, "mono-related", localized.MonofocalProducts.Values.Where(sibling => sibling.Slug != "geo")
                .Select(sibling => (sibling.Slug, sibling.Name, sibling.Slug switch
                {
                    "outdoor" => "07444.png", "single-vision" => "0b636.png", "slim" => "a62fc.png", "indoor" => "590b1.png",
                    _ => throw new InvalidOperationException("Unknown monofocal portrait")
                })).ToArray())));
        cases.AddRange(localized.BifocalOccupationalProducts.Values.Select(current =>
            (current.Slug, "bop-related", current.Slug == "office"
                ? new[] { (localized.PremiumProducts["aiwork"].Slug, localized.PremiumProducts["aiwork"].Name, localized.PremiumProducts["aiwork"].Hero.File) }
                : localized.BifocalOccupationalProducts.Values.Where(sibling => sibling.Slug != "office")
                    .Select(sibling => (sibling.Slug, sibling.Name,
                        sibling.Slug == "ultex-blended" ? "961e1.png" : sibling.Slug == "kriptok-blended" ? "2c53f.png" : "28518.png")).ToArray())));

        Assert.Equal(9, cases.Count);
        foreach (var (currentSlug, sectionClass, expected) in cases)
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, $"/lentes/{currentSlug}");
            if (culture != "es") request.Headers.AcceptLanguage.ParseAdd(culture);
            var html = WebUtility.HtmlDecode(await (await client.SendAsync(request)).Content.ReadAsStringAsync());
            var section = Regex.Match(html, $"<section class=\"{sectionClass}[^\"]*\"[\\s\\S]*?</section>").Value;
            var cards = Regex.Matches(section, "<a href=\"/lentes/(?<slug>[^\"]+)\"[^>]*><img src=\"/media/figma/(?<hero>[^\"]+)\" alt=\"\" loading=\"lazy\" /><span[^>]*>(?<name>[^<]+)</span></a>")
                .Select(card => (Slug: card.Groups["slug"].Value, Name: card.Groups["name"].Value, Hero: card.Groups["hero"].Value))
                .OrderBy(card => card.Slug).ToArray();
            Assert.Equal(expected.Length, cards.Length);
            // Monofocal and bifocal Figma frames repeat their complete family portrait strips.
            if (currentSlug == "office") Assert.DoesNotContain(currentSlug, cards.Select(card => card.Slug));
            Assert.Equal(expected.Select(card => (card.Slug, card.Name, card.Hero)).OrderBy(card => card.Slug), cards);
        }
    }

    [Fact]
    public void FirstAndPrecisaFaqsRemainExactInSpanishAndCoveredByEveryLocale()
    {
        var spanish = Content.ForCulture(CultureInfo.GetCultureInfo("es"));
        var expectedFirst = new[]
        {
            ("¿Qué es Novar First?", "Es un lente progresivo pensado para personas que comienzan a usar multifocales y buscan una adaptación cómoda."),
            ("¿Para quién está recomendado?", "Para usuarios que empiezan a notar dificultad para ver de cerca y necesitan una solución progresiva para todas las distancias."),
            ("¿Qué lo diferencia?", "Su diseño prioriza una experiencia simple, natural y fácil de incorporar al uso diario.")
        };
        var expectedPrecisa = new[]
        {
            ("¿Qué es Novar Precisa?", "Es un lente progresivo equilibrado, pensado para quienes necesitan comodidad visual en distintas actividades."),
            ("¿Para quién está recomendado?", "Para personas que buscan una solución versátil para leer, trabajar, moverse y ver de lejos."),
            ("¿Qué lo diferencia?", "Su balance entre distancias y su zona de lectura más confortable.")
        };

        Assert.Equal(expectedFirst, spanish.First.Questions.Select(question => (question.Question, question.Answer!)));
        Assert.Equal(expectedPrecisa, spanish.ProgressiveProducts["precisa"].Questions.Select(question => (question.Question, question.Answer!)));

        foreach (var culture in new[] { "en", "pt-BR" })
        {
            var localized = Content.ForCulture(CultureInfo.GetCultureInfo(culture));
            Assert.Equal(3, localized.First.Questions.Length);
            Assert.All(localized.First.Questions, question =>
            {
                Assert.False(string.IsNullOrWhiteSpace(question.Question));
                Assert.False(string.IsNullOrWhiteSpace(question.Answer));
            });
            Assert.Equal(3, localized.ProgressiveProducts["precisa"].Questions.Length);
            Assert.All(localized.ProgressiveProducts["precisa"].Questions, question =>
            {
                Assert.False(string.IsNullOrWhiteSpace(question.Question));
                Assert.False(string.IsNullOrWhiteSpace(question.Answer));
            });
        }
    }

    [Fact]
    public void FirstBannerUsesTheSelectedFigmaAssetAndItsOwnSourceGeometry()
    {
        var root = FindRoot();
        var view = File.ReadAllText(Path.Combine(root, "src", "Novar.Web", "Views", "Home", "First.cshtml"));
        var css = File.ReadAllText(Path.Combine(root, "src", "Novar.Web", "wwwroot", "css", "progressive-first.css"));
        Assert.Contains("ProductBannerAsset.ForSlug(\"first\")", view);
        Assert.Contains("~/media/products/banners/@banner.File", view);
        Assert.Contains("data-figma-node=\"689:4834\"", view);
        Assert.Contains("--prg-frame-height: 761; --prg-banner-width: 1500; --prg-banner-height: 826; --prg-banner-x: -60; --prg-banner-y: -65", css);
        Assert.Contains("object-position: center bottom", css);
        Assert.DoesNotContain("min(100%, 1920px)", css);
    }

    [Fact]
    public void BifocalRelatedCarouselKeepsEachMobileImageAndNameVisible()
    {
        var css = File.ReadAllText(Path.Combine(FindRoot(), "src", "Novar.Web", "wwwroot", "css", "bifocal-occupational-products.css"));
        Assert.Contains(".bop-related-images { left: auto; transform: none; width: 100%; height: auto; min-height: 240px; display: flex; align-items: stretch; overflow-x: auto; scroll-snap-type: x proximity; }", css);
        Assert.Contains(".bop-related-images > a { flex: 0 0 240px; height: 240px; scroll-snap-align: start; }", css);
        Assert.Contains(".bop-related-images img { height: calc(100% - 32px); }", css);
    }

    private static string FindRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "Novar.sln"))) directory = directory.Parent;
        return directory?.FullName ?? throw new DirectoryNotFoundException("Could not locate Novar.sln.");
    }
}
