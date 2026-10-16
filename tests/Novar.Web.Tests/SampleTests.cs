using System.Net;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Novar.Web.Services;

namespace Novar.Web.Tests;

public sealed class SampleTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> factory;
    private readonly HttpClient client;

    public SampleTests(WebApplicationFactory<Program> factory)
    {
        this.factory = factory;
        client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
    }

    [Theory]
    [InlineData("/", "La visión", "889:1324")]
    [InlineData("/lentes/first", "Tu primera experiencia progresiva", "689:4828")]
    [InlineData("/sobre-nosotros", "en el mundo", "961:6952")]
    [InlineData("/juegos", "Elegí una tarjeta y descubrí", "961:7324")]
    public async Task SampleRoutesRenderSourceContent(string path, string copy, string node)
    {
        var response = await client.GetAsync(path);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var html = WebUtility.HtmlDecode(await response.Content.ReadAsStringAsync());
        Assert.Contains("<html lang=\"es\">", html);
        Assert.Contains(copy, html);
        Assert.Contains(node, html);
        Assert.Single(Regex.Matches(html, "<h1(?: |>)"));
        Assert.DoesNotContain("react", html, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("tailwind", html, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData("/lentes")]
    public async Task LensFinderBaseReplacesOnlyTheCatalogPlaceholder(string path)
    {
        var response = await client.GetAsync(path);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var html = WebUtility.HtmlDecode(await response.Content.ReadAsStringAsync());
        Assert.Contains("data-lens-finder-revision=\"lens-finder-routing-v1\"", html);
        Assert.DoesNotContain("después de aprobar la muestra visual", html);
        Assert.Contains("/lentes/first", html);
    }

    [Fact]
    public async Task PlannedCatalogHasExactlyEighteenDistinctProducts()
    {
        var content = factory.Services.GetRequiredService<SiteContent>();
        Assert.Empty(content.PlannedProducts);
        Assert.Equal(3, content.PremiumProducts.Count);
        Assert.Equal(18, content.PlannedProducts.Concat(content.PremiumProducts.Keys).Concat(content.ProgressiveProducts.Keys).Concat(content.MonofocalProducts.Keys).Concat(content.BifocalOccupationalProducts.Keys).Append(content.First.Slug).Distinct().Count());
        Assert.DoesNotContain(content.PremiumProducts.Keys, content.PlannedProducts.Contains);
        Assert.DoesNotContain("first", content.PlannedProducts);
        Assert.DoesNotContain("myofix", content.PlannedProducts);
        Assert.Equal("first", content.First.Slug);
        Assert.Equal(3, content.First.Benefits.Length);
        Assert.Equal(new[] { "Alta", "Media", "Media" }, content.First.Benefits.Select(x => x.Level));
        foreach (var slug in content.PlannedProducts)
        {
            var response = await client.GetAsync($"/lentes/{slug}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Contains("después de aprobar la muestra visual", WebUtility.HtmlDecode(await response.Content.ReadAsStringAsync()));
        }
    }

    [Theory]
    [InlineData("/lentes/no-existe")]
    [InlineData("/lentes/myofix")]
    [InlineData("/pagina-inexistente")]
    public async Task UnknownRoutesReturnReal404(string path)
    {
        var response = await client.GetAsync(path);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Contains("Página no encontrada", WebUtility.HtmlDecode(await response.Content.ReadAsStringAsync()));
    }

    [Theory]
    [InlineData("/")]
    [InlineData("/lentes/first")]
    [InlineData("/sobre-nosotros")]
    [InlineData("/juegos")]
    public async Task EveryReferencedLocalAssetExists(string path)
    {
        var html = await client.GetStringAsync(path);
        var assets = Regex.Matches(html, "(?:src|href)=\"(?<path>/(?:media|fonts|vendor|css|js)/[^\"]+)\"")
            .Select(x => x.Groups["path"].Value).Distinct().ToArray();
        Assert.True(assets.Length > 10);
        foreach (var asset in assets)
        {
            var response = await client.GetAsync(asset);
            Assert.True(response.IsSuccessStatusCode, $"Missing asset: {asset}");
            Assert.NotEmpty(await response.Content.ReadAsByteArrayAsync());
        }
    }

    [Fact]
    public async Task DemoFormsBlockImplicitSubmissionAndHaveNoNamedPayload()
    {
        var html = await client.GetStringAsync("/");
        var forms = Regex.Matches(html, "<form[\\s\\S]*?</form>")
            .Where(form => !form.Value.Contains("language-form", StringComparison.Ordinal)).ToArray();
        Assert.Single(forms);
        foreach (Match form in forms)
        {
            Assert.Contains("onsubmit=\"return false\"", form.Value);
            Assert.Contains("data-demo-form", form.Value);
            Assert.Contains("type=\"submit\" disabled hidden", form.Value);
            Assert.Single(Regex.Matches(form.Value, "type=\"submit\""));
            Assert.DoesNotContain("name=", form.Value);
            Assert.DoesNotContain("method=\"post\"", form.Value, StringComparison.OrdinalIgnoreCase);
        }
        Assert.Contains("no se envían ni almacenan datos", WebUtility.HtmlDecode(html));
    }

    [Fact]
    public async Task PostIsNotAFormIntegrationEndpoint()
    {
        var response = await client.PostAsync("/", new FormUrlEncodedContent(new Dictionary<string, string> { ["email"] = "test@example.invalid" }));
        Assert.Equal(HttpStatusCode.MethodNotAllowed, response.StatusCode);
    }

    [Fact]
    public async Task HomeAnnotationChangesPreserveWorldPreviewAndTestimonialsWhileRemovingOnlyReviewLink()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/"));
        Assert.DoesNotContain("world-poster.png", html);
        Assert.DoesNotContain("long-testimonial", html);
        Assert.DoesNotContain("nunca había usado con inteligencia artificial", html);
        Assert.DoesNotContain("newsletter-email", html);
        Assert.DoesNotContain("Ver muestra: Novar First", html);
        Assert.DoesNotContain("Muestra para revisión: conocé Novar First", html);
        Assert.DoesNotContain("featured-sample", html);
        Assert.Contains("Hernán Darío", html);
        Assert.Contains("Marcos G.", html);
        Assert.Contains("Valentina R.", html);
        Assert.Contains("world-shape-strip", html);
        Assert.Contains("data-figma-node=\"1072:238\"", html);
        Assert.Equal(4, Regex.Matches(html, "class=\"world-shape-tall\"").Count);
    }

    [Fact]
    public async Task HomeUsesOriginalBadgeAssetsAndOnlyMirrorsAiPortrait()
    {
        var html = await client.GetStringAsync("/");
        Assert.Single(Regex.Matches(html, "lens-card-image-mirrored"));
        Assert.Matches("lens-card-image-mirrored[^>]+src=\"/media/figma/2c335.png\"", html);
        var expected = new Dictionary<string, (string Asset, int Width, int Height)>
        {
            ["tag-comfort"] = ("e52ae.svg", 15, 10),
            ["tag-drive"] = ("8dc9d.svg", 24, 24),
            ["tag-screen"] = ("d2700.svg", 24, 24),
            ["tag-outdoor"] = ("e8b67.svg", 24, 24)
        };
        foreach (var (tag, asset) in expected)
        {
            Assert.Matches($"class=\"collage-tag {tag}\"[\\s\\S]*?src=\"/media/figma/{asset.Asset}\"", html);
            var svg = System.Xml.Linq.XDocument.Parse(await client.GetStringAsync($"/media/figma/{asset.Asset}"));
            Assert.Equal(asset.Width.ToString(), svg.Root!.Attribute("width")?.Value);
            Assert.Equal(asset.Height.ToString(), svg.Root.Attribute("height")?.Value);
        }
    }

    [Fact]
    public async Task NewsletterAndWarrantyHaveSeparateAccurateNonSubmittingContent()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/"));
        var section = Regex.Match(html, "<section class=\"newsletter-section\"[\\s\\S]*?</section>").Value;
        Assert.Contains("Suscríbete al newsletter de Novar", section);
        Assert.Contains("Recibí novedades, lanzamientos y avances tecnológicos directamente en tu mail.", section);
        Assert.Contains("Suscripción pendiente de integración.", section);
        Assert.Contains("Activá la extensión de tu garantía", section);
        Assert.Contains("Cobertura de 6 meses extensible a 12 meses.", section);
        Assert.DoesNotContain("<input", section);
        Assert.DoesNotContain("<form", section);
        Assert.DoesNotContain("Enviar", section);
        Assert.Single(Regex.Matches(section, "<button"));
        Assert.Contains("type=\"button\" data-pending=\"Activación de garantía\">Activar</button>", section);
    }

    [Fact]
    public async Task SuppliedFooterLogoAndLinkChangeAreHomeOnly()
    {
        var home = await client.GetStringAsync("/");
        Assert.Contains("class=\"home-footer-logo\" src=\"/media/novar-footer.svg\" alt=\"Novar\" width=\"240\" height=\"32\"", home);
        var svg = System.Xml.Linq.XDocument.Parse(await client.GetStringAsync("/media/novar-footer.svg"));
        Assert.Equal("240", svg.Root!.Attribute("width")?.Value);
        Assert.Equal("32", svg.Root.Attribute("height")?.Value);
        Assert.Equal("0 0 240 32", svg.Root.Attribute("viewBox")?.Value);
        Assert.Equal(5, svg.Root.Elements().Count());
        Assert.All(svg.Root.Elements(), path => Assert.Equal("#1F023C", path.Attribute("fill")?.Value));
        var first = WebUtility.HtmlDecode(await client.GetStringAsync("/lentes/first"));
        Assert.DoesNotContain("novar-footer.svg", first);
        Assert.DoesNotContain("Ver muestra: Novar First", first);
        Assert.Contains("class=\"prg-footer\"", first);
    }

    [Fact]
    public async Task WorldGlassesReplaceTheQuoteWithoutChangingTestimonials()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/"));
        Assert.Contains("data-home-revision=\"home-fidelity-v2\"", html);
        var world = Regex.Match(html, "<section class=\"world-section\"[\\s\\S]*?</section>").Value;
        Assert.Contains("data-figma-node=\"1072:242\"", world);
        Assert.Contains("src=\"/media/home/optimized/world-spectra-glasses.webp\" alt=\"\"", world);
        Assert.DoesNotContain("Los mejores lentes progresivos que probé", world);
        Assert.DoesNotContain("world-quote", world);
        Assert.DoesNotContain("class=\"world-visual\" aria-hidden=\"true\"", html);
        Assert.DoesNotContain("long-testimonial", html);
    }

    [Fact]
    public async Task TreatmentBenefitsPreserveSourceRootGeometryAndArrow()
    {
        var html = await client.GetStringAsync("/");
        var benefits = Regex.Match(html, "<ul class=\"comfort-benefits\"[\\s\\S]*?</ul>").Value;
        foreach (var asset in new[] { "bf6dd.svg", "38049.svg", "37216.svg" })
        {
            Assert.Contains($"src=\"/media/figma/{asset}\" alt=\"\" width=\"68.2077\" height=\"68.2077\"", benefits);
        }
        Assert.Contains("width=\"35.5037\" height=\"30.5816\"", benefits);
        Assert.Matches("class=\"btn btn-novar treatment-cta\"[\\s\\S]*?<img src=\"/media/figma/e3b22.svg\" alt=\"\" width=\"15\" height=\"15\"", html);
        var font = await client.GetAsync("/fonts/poppins/Poppins-ExtraLight.ttf");
        Assert.Equal(HttpStatusCode.OK, font.StatusCode);
        Assert.True((await font.Content.ReadAsByteArrayAsync()).Length > 100000);
    }

    [Fact]
    public async Task ContactUsesSourceBrandsOrderAndRealTwoColumnForm()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/"));
        var section = Regex.Match(html, "<section class=\"contact-section\"[\\s\\S]*?</section>").Value;
        var socials = Regex.Match(section, "<div class=\"social-links contact-socials\"[\\s\\S]*?</div>").Value;
        Assert.Equal(new[] { "Instagram", "LinkedIn", "Facebook", "YouTube" }, Regex.Matches(socials, "data-pending=\"([^\"]+)\"").Select(match => match.Groups[1].Value));
        foreach (var asset in new[] { "b0b3b.svg", "af7e5.svg", "de04b.svg", "121ca.svg", "fa725.svg", "d97eb.svg", "d8886.svg", "6e7af.svg" })
            Assert.Contains(asset, socials);
        Assert.Contains("data-figma-node=\"964:980\"", section);
        Assert.Contains("class=\"contact-details\"", section);
        Assert.Contains("class=\"contact-message\"", section);
        Assert.Contains("class=\"contact-submit\"", section);
        Assert.Equal(4, Regex.Matches(section, "<label for=\"contact-").Count);
        Assert.Equal(3, Regex.Matches(section, "<input ").Count);
        Assert.Single(Regex.Matches(section, "<textarea "));
    }

    [Fact]
    public void HomeFaqAnswersAreCompleteWithoutChangingOtherFaqAnswers()
    {
        var content = factory.Services.GetRequiredService<SiteContent>();
        Assert.Equal(0, content.Home.Questions.Count(x => x.Answer is null));
        Assert.Equal(0, content.First.Questions.Count(x => x.Answer is null));
    }
}
