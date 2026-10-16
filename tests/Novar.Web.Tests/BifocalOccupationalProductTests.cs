using System.Buffers.Binary;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Novar.Web.Services;

namespace Novar.Web.Tests;

public sealed class BifocalOccupationalProductTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();
    private SiteContent Content => factory.Services.GetRequiredService<SiteContent>();

    [Theory]
    [InlineData("kriptok-blended", "989:712", "989:744", "Bifocales")]
    [InlineData("ultex-blended", "992:2398", "992:2430", "Bifocales")]
    [InlineData("freeline", "992:2680", "992:2712", "Bifocales")]
    [InlineData("office", "992:2962", "992:2994", "Ocupacionales")]
    public async Task FourRoutesUseExactSourceIdentityAndScopedPresentation(string slug, string node, string wordmarkNode, string category)
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync($"/lentes/{slug}"));
        Assert.Equal(category, Content.BifocalOccupationalProducts[slug].Category);
        Assert.Contains($"data-figma-node=\"{node}\"", html);
        Assert.Contains($"data-figma-node=\"{wordmarkNode}\"", html);
        Assert.Contains($"data-product-category=\"{category}\"", html);
        Assert.Contains("data-bifocal-occupational-revision=\"bifocal-occupational-v1\"", html);
        Assert.Contains("<body class=\"bifocal-occupational-page\">", html);
        Assert.Contains("/css/bifocal-occupational-products.css", html);
        Assert.Contains("class=\"bop-footer\"", html);
        Assert.Contains("href=\"/lentes\" aria-current=\"page\"", html);
        Assert.Single(Regex.Matches(html, "<h1(?: |>)"));
        Assert.Contains($"<span class=\"visually-hidden\">Novar {Content.BifocalOccupationalProducts[slug].Name}</span>", html);
        foreach (var marker in new[] { "Ficha en preparación", "data-progresivos-revision", "data-premium-revision", "data-monofocales-revision" })
            Assert.DoesNotContain(marker, html);
        Assert.Equal(HttpStatusCode.MethodNotAllowed, (await client.PostAsync($"/lentes/{slug}", new StringContent(""))).StatusCode);
    }

    [Fact]
    public void CatalogHasEighteenDisjointImplementedIdentitiesAndExplicitCategories()
    {
        Assert.Equal(new[] { "freeline", "kriptok-blended", "office", "ultex-blended" }, Content.BifocalOccupationalProducts.Keys.Order());
        Assert.Empty(Content.PlannedProducts);
        Assert.Equal("first", Content.First.Slug);
        Assert.Equal(new[] { "ai-lens", "aiwork", "myolens" }, Content.PremiumProducts.Keys.Order());
        Assert.Equal(new[] { "elife", "evolution", "evolution-short", "precisa", "precisa-short" }, Content.ProgressiveProducts.Keys.Order());
        Assert.Equal(new[] { "geo", "indoor", "outdoor", "single-vision", "slim" }, Content.MonofocalProducts.Keys.Order());
        var identities = Content.PremiumProducts.Keys.Concat(Content.ProgressiveProducts.Keys)
            .Concat(Content.MonofocalProducts.Keys).Concat(Content.BifocalOccupationalProducts.Keys).Append(Content.First.Slug).ToArray();
        Assert.Equal(18, identities.Length);
        Assert.Equal(18, identities.Distinct(StringComparer.Ordinal).Count());
        Assert.DoesNotContain("myofix", identities);
        Assert.False(Content.BifocalOccupationalProducts.ContainsKey("Office"));
        Assert.Equal(3, Content.BifocalOccupationalProducts.Values.Count(x => x.Category == "Bifocales"));
        Assert.Single(Content.BifocalOccupationalProducts.Values, x => x.Category == "Ocupacionales");
    }

    [Fact]
    public async Task SourceCopyAndAuthorizedFaqAnswersAreRendered()
    {
        Assert.Equal("kriprok\nblended", Content.BifocalOccupationalProducts["kriptok-blended"].Watermark);
        var office = Content.BifocalOccupationalProducts["office"];
        Assert.Equal("MONOFOCALES", office.HeroEyebrow);
        Assert.Equal("Kriptok Blended", office.GalleryName);
        Assert.StartsWith("Novar Office acompaña", office.Intro);
        Assert.Equal(new[] { "Segmento más discreto", "Visión lejos y cerca", "Estética mejorada." }, office.Icons.Select(x => x.Label));
        Assert.Equal(new[] { "Baja / Media", "Alta", "Alta" }, office.Benefits.Select(x => x.Level));
        Assert.Equal("Su comodidad en distancias de trabajo y su adaptación a distintas necesidades de oficina.", office.Questions[2].Answer);

        foreach (var product in Content.BifocalOccupationalProducts.Values)
        {
            Assert.Equal(3, product.Questions.Length);
            Assert.All(product.Questions, question => Assert.NotNull(question.Answer));
            Assert.Equal(2, product.Technologies.Length);
            Assert.Equal(4, product.Gallery.Length);
            Assert.Equal(3, product.Icons.Length);
            var html = WebUtility.HtmlDecode(await client.GetStringAsync($"/lentes/{product.Slug}"));
            var faq = Section(html, "bop-faq");
            Assert.Equal(3, Regex.Matches(faq, "class=\"accordion-button ").Count);
            Assert.DoesNotContain("Respuesta pendiente de revisión editorial", faq);
            Assert.Single(Regex.Matches(faq, "aria-expanded=\"true\""));
            Assert.Contains($"id=\"bop-{product.Slug}-faq-2\" class=\"accordion-collapse collapse show\"", faq);
            foreach (var question in product.Questions)
            {
                Assert.Contains(question.Question, faq);
                Assert.Contains(question.Answer!, faq);
            }
            Assert.Equal(3, Regex.Matches(faq, "data-bs-parent=").Count);
            var text = Normalize(Regex.Replace(html, "<[^>]+>", " "));
            foreach (var copy in new[] { product.Subtitle, product.Description, product.Tagline, product.IntroHeading, product.IntroEyebrow,
                product.Intro, product.Details, product.Design, product.IdealFor, product.TechnologySpec, product.Tag })
                Assert.Contains(Normalize(copy), text);
            foreach (var technology in product.Technologies)
            {
                Assert.Contains(Normalize(technology.Name), text);
                Assert.Contains(Normalize(technology.Description), text);
            }
            Assert.Equal(2, Regex.Matches(html, "class=\"bop-technology-card\"").Count);
            Assert.Contains(product.Slug == "office" ? "Explorar otros lentes en el catálogo" : "Otros lentes bifocales", html);
        }
    }

    [Fact]
    public async Task NavigationUsesExistingDestinationsAndUnsupportedActionsRemainHonest()
    {
        foreach (var product in Content.BifocalOccupationalProducts.Values)
        {
            var html = WebUtility.HtmlDecode(await client.GetStringAsync($"/lentes/{product.Slug}"));
            Assert.Contains("<a class=\"btn btn-novar bop-button\" href=\"/tratamientos\">Personalizá tu lente</a>", html);
            foreach (var action in new[] { "Garantía", "Instagram", "LinkedIn", "Facebook", "YouTube" })
                Assert.Contains($"data-pending=\"{action}\"", html);
            Assert.Contains("id=\"pending-modal\"", html);
            Assert.Contains("no se envían ni almacenan datos y no se generan resultados", html);
            Assert.DoesNotContain("<form", html.WithoutLanguagePreferenceForm());
            Assert.DoesNotContain("target=\"_blank\"", html);
            Assert.DoesNotContain("figma.com/api", html);
            Assert.DoesNotContain("data-progressive-gallery", html);
            Assert.Contains("href=\"/tratamientos\"", html);
            Assert.Contains("href=\"/#contacto\"", html);
            var related = Section(html, "bop-related");
            var expected = product.Slug == "office"
                ? new[] { Content.PremiumProducts["aiwork"] }
                    .Select(item => (item.Slug, item.Name, Hero: item.Hero.File))
                : Content.BifocalOccupationalProducts.Values.Where(item => item.Category == "Bifocales")
                    .Select(item => (item.Slug, item.Name, Hero: item.Slug == "ultex-blended" ? "961e1.png" : item.Slug == "kriptok-blended" ? "2c53f.png" : "28518.png"));
            var cards = Regex.Matches(related, "<a href=\"/lentes/(?<slug>[^\"]+)\"[^>]*><img src=\"/media/figma/(?<hero>[^\"]+)\" alt=\"\" loading=\"lazy\" /><span[^>]*>(?<name>[^<]+)</span></a>")
                .Select(item => (Slug: item.Groups["slug"].Value, Name: item.Groups["name"].Value, Hero: item.Groups["hero"].Value)).OrderBy(item => item.Slug);
            Assert.Equal(expected.OrderBy(item => item.Slug), cards);
            Assert.Equal(product.Slug == "office" ? 1 : 3, cards.Count());
            if (product.Slug == "office") Assert.DoesNotContain(product.Slug, cards.Select(item => item.Slug));
            Assert.DoesNotContain("class=\"bop-hero-underlay\"", html);
            Assert.Equal(4, Regex.Matches(Section(html, "bop-gallery"), "loading=\"lazy\"").Count);
        }
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/lentes")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/lentes/bifocal-inventado")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/lentes/myofix")).StatusCode);
    }

    [Fact]
    public async Task AllOriginalAssetBytesAndSourceSlotsAreRecordedAndAvailable()
    {
        using var manifest = JsonDocument.Parse(File.ReadAllText(Path.Combine(FindRoot(), "docs", "asset-provenance.json")));
        var verified = manifest.RootElement.GetProperty("bifocalOccupationalAssetVerification");
        var assets = verified.GetProperty("assets").EnumerateArray().ToDictionary(x => x.GetProperty("file").GetString()!);
        var slots = verified.GetProperty("slots").EnumerateArray().ToArray();
        Assert.Equal(64, assets.Count);
        Assert.Equal(138, slots.Length);
        foreach (var (file, asset) in assets)
        {
            var response = await client.GetAsync($"/media/figma/{file}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var bytes = await response.Content.ReadAsByteArrayAsync();
            Assert.Equal(asset.GetProperty("bytes").GetInt32(), bytes.Length);
            Assert.Equal(asset.GetProperty("sha256").GetString(), Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant());
            var geometry = asset.GetProperty("rootGeometry");
            switch (asset.GetProperty("signature").GetString())
            {
                case "svg":
                    var svg = XDocument.Parse(Encoding.UTF8.GetString(bytes));
                    foreach (var attribute in new[] { "width", "height", "viewBox" })
                        Assert.Equal(geometry.GetProperty(attribute).GetString(), svg.Root!.Attribute(attribute)!.Value);
                    break;
                case "png":
                    Assert.Equal(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }, bytes.Take(8));
                    Assert.Equal(geometry.GetProperty("width").GetString(), BinaryPrimitives.ReadUInt32BigEndian(bytes.AsSpan(16, 4)).ToString());
                    Assert.Equal(geometry.GetProperty("height").GetString(), BinaryPrimitives.ReadUInt32BigEndian(bytes.AsSpan(20, 4)).ToString());
                    break;
                case "jpeg":
                    Assert.Equal(new byte[] { 255, 216, 255 }, bytes.Take(3));
                    var dimensions = JpegDimensions(bytes);
                    Assert.Equal(geometry.GetProperty("width").GetString(), dimensions.Width.ToString());
                    Assert.Equal(geometry.GetProperty("height").GetString(), dimensions.Height.ToString());
                    break;
                default:
                    Assert.Fail($"Unrecognized source signature: {file}");
                    break;
            }
        }
        foreach (var product in Content.BifocalOccupationalProducts.Values)
        {
            var html = await client.GetStringAsync($"/lentes/{product.Slug}");
            var related = Section(html, "bop-related");
            var relatedCards = Regex.Matches(related, "<a href=\"/lentes/(?<slug>[^\"]+)\"[^>]*><img src=\"/media/figma/(?<file>[^\"]+)\"")
                .Select(match => (Slug: match.Groups["slug"].Value, File: match.Groups["file"].Value)).ToArray();
            var expectedRelated = product.Slug == "office"
                ? new[] { (Slug: "aiwork", File: Content.PremiumProducts["aiwork"].Hero.File) }
                : Content.BifocalOccupationalProducts.Values.Where(item => item.Category == "Bifocales")
                    .Select(item => (Slug: item.Slug, File: item.Slug == "ultex-blended" ? "961e1.png" : item.Slug == "kriptok-blended" ? "2c53f.png" : "28518.png")).ToArray();
            Assert.Equal(expectedRelated.OrderBy(item => item.Slug), relatedCards.OrderBy(item => item.Slug));
            foreach (var card in relatedCards)
            {
                var response = await client.GetAsync($"/media/figma/{card.File}");
                Assert.Equal(HttpStatusCode.OK, response.StatusCode);
                Assert.NotEmpty(await response.Content.ReadAsByteArrayAsync());
            }
            var files = Regex.Matches(html, "src=\"/media/figma/(?<file>[^\"]+)\"").Select(m => m.Groups["file"].Value)
                .Except(relatedCards.Select(card => card.File).Where(file => !slots.Any(slot => slot.GetProperty("slug").GetString() == product.Slug && slot.GetProperty("file").GetString() == file)), StringComparer.Ordinal)
                .Distinct().ToArray();
            foreach (var file in files)
            {
                Assert.True(assets.ContainsKey(file), file);
                Assert.Contains(slots, slot => slot.GetProperty("slug").GetString() == product.Slug && slot.GetProperty("file").GetString() == file);
            }
            // Provenance retains the original Figma hover asset, superseded by
            // the shared scroll reveal. It is no longer a rendered image slot.
            foreach (var slot in slots.Where(s => s.GetProperty("slug").GetString() == product.Slug &&
                s.GetProperty("callsite").GetString() is not ".bop-related-images img" and not ".bop-tagline-hover img"))
            {
                // Original hero provenance remains archived; new opaque exports are checked by ProductBannerQualityTests.
                if (slot.GetProperty("callsite").GetString() != ".bop-hero-art img")
                    Assert.Contains(slot.GetProperty("file").GetString(), files);
                Assert.Equal(product.SourceNode, slot.GetProperty("page").GetString());
                foreach (var key in new[] { "sourceNode", "callsite", "sourceGeometry", "sourceCrop" })
                    Assert.NotEmpty(slot.GetProperty(key).GetString()!);
            }
            foreach (var path in Regex.Matches(html, "(?:src|href)=\"(?<path>/(?:fonts|vendor|css|js)/[^\"]+)\"").Select(m => m.Groups["path"].Value).Distinct())
                Assert.True((await client.GetAsync(path)).IsSuccessStatusCode, path);
        }
    }

    [Fact]
    public async Task PresentationDoesNotLeakToFourteenPredecessorsOrOtherRoutes()
    {
        var routes = Content.PremiumProducts.Keys.Concat(Content.ProgressiveProducts.Keys).Concat(Content.MonofocalProducts.Keys)
            .Append(Content.First.Slug).Select(slug => $"/lentes/{slug}")
            .Concat(new[] { "/", "/lentes", "/sobre-nosotros", "/juegos", "/tratamientos" });
        foreach (var route in routes)
        {
            var html = await client.GetStringAsync(route);
            foreach (var marker in new[] { "/css/bifocal-occupational-products.css", "bifocal-occupational-page", "bifocal-occupational-v1", "bop-footer" })
                Assert.DoesNotContain(marker, html);
        }
    }

    [Fact]
    public async Task GeometryRemainsScopedResponsiveWithTheSharedScrollReveal()
    {
        var css = await client.GetStringAsync("/css/bifocal-occupational-products.css");
        foreach (var width in new[] { "1441px", "1199px", "1023px", "767px", "359px" })
            Assert.Contains(width, css);
        Assert.Contains("margin: -33.754px 0 0", css);
        Assert.Contains("transform: scaleX(-1)", css);
        Assert.Contains("overflow-x: auto", css);
        Assert.DoesNotContain("@keyframes", css);
        Assert.DoesNotContain("@import", css);
        Assert.DoesNotContain("position: fixed", css);
        Assert.DoesNotContain("figma.com", css);
        foreach (var product in Content.BifocalOccupationalProducts.Values)
        {
            var html = await client.GetStringAsync($"/lentes/{product.Slug}");
            Assert.Contains("class=\"bop-tagline\" data-product-tagline", html);
            Assert.DoesNotContain("data-hover-source", html);
            Assert.Contains("/js/product-tagline.js", html);
            Assert.DoesNotContain("autoplay", html, StringComparison.OrdinalIgnoreCase);
            Assert.Equal(6, Regex.Matches(html, "<script ").Count);
        }
    }

    private static string Section(string html, string className) =>
        Regex.Match(html, $"<section class=\"{className}(?: |\")[\\s\\S]*?</section>").Value;

    private static string Normalize(string value) => Regex.Replace(value, "\\s+", " ").Trim();

    private static (int Width, int Height) JpegDimensions(byte[] bytes)
    {
        var position = 2;
        while (position + 9 < bytes.Length)
        {
            if (bytes[position++] != 255) continue;
            var marker = bytes[position++];
            if (marker is 216 or 217) continue;
            var length = BinaryPrimitives.ReadUInt16BigEndian(bytes.AsSpan(position, 2));
            if (marker is 192 or 193 or 194 or 195 or 197 or 198 or 199 or 201 or 202 or 203 or 205 or 206 or 207)
                return (BinaryPrimitives.ReadUInt16BigEndian(bytes.AsSpan(position + 5, 2)), BinaryPrimitives.ReadUInt16BigEndian(bytes.AsSpan(position + 3, 2)));
            position += length;
        }
        throw new InvalidDataException("No JPEG SOF dimensions found.");
    }

    private static string FindRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "Novar.sln")))
            directory = directory.Parent;
        return directory?.FullName ?? throw new DirectoryNotFoundException("Novar.sln was not found.");
    }
}
