using System.Net;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Novar.Web.Services;

namespace Novar.Web.Tests;

public sealed class MonofocalProductTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();
    private SiteContent Content => factory.Services.GetRequiredService<SiteContent>();

    [Theory]
    [InlineData("geo", "964:1916", "964:2247", "107")]
    [InlineData("single-vision", "992:1254", "992:1285", "223")]
    [InlineData("outdoor", "992:1540", "992:1571", "107")]
    [InlineData("indoor", "992:1826", "992:1857", "107")]
    [InlineData("slim", "992:2112", "992:2143", "107")]
    public async Task FiveRoutesUseTheirExactSourceAndOriginalOutlinedWordmarks(string slug, string node, string wordmarkNode, string height)
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync($"/lentes/{slug}"));
        Assert.Contains($"data-figma-node=\"{node}\"", html);
        Assert.Contains($"data-figma-node=\"{wordmarkNode}\"", html);
        Assert.Contains("data-monofocales-revision=\"monofocales-v1\"", html);
        Assert.Contains("<body class=\"monofocales-page\">", html);
        Assert.Contains("/css/monofocal-products.css", html);
        Assert.Contains("class=\"mono-footer\"", html);
        Assert.Contains("href=\"/lentes\" aria-current=\"page\"", html);
        Assert.Single(Regex.Matches(html, "<h1(?: |>)"));
        Assert.DoesNotContain("Ficha en preparación", html);
        Assert.DoesNotContain("data-progresivos-revision", html);
        Assert.DoesNotContain("data-premium-revision", html);
        var tag = Regex.Match(html, "<img class=\"mono-wordmark\"[^>]*>").Value;
        Assert.DoesNotContain("width=", tag);
        Assert.DoesNotContain("height=", tag);
        var svg = XDocument.Parse(await client.GetStringAsync($"/media/figma/{slug}-wordmark.svg"));
        Assert.Equal("415", svg.Root!.Attribute("width")!.Value);
        Assert.Equal(height, svg.Root.Attribute("height")!.Value);
        Assert.Contains(svg.Descendants(), x => x.Name.LocalName == "path");
        Assert.DoesNotContain(svg.Descendants(), x => x.Name.LocalName == "text");
        Assert.Equal(HttpStatusCode.MethodNotAllowed, (await client.PostAsync($"/lentes/{slug}", new StringContent(""))).StatusCode);
    }

    [Fact]
    public void CatalogRetainsEighteenDisjointIdentitiesAndNoDeferredProducts()
    {
        Assert.Equal(new[] { "geo", "indoor", "outdoor", "single-vision", "slim" }, Content.MonofocalProducts.Keys.Order());
        Assert.Empty(Content.PlannedProducts);
        Assert.Equal(3, Content.PremiumProducts.Count);
        Assert.Equal(5, Content.ProgressiveProducts.Count);
        var identities = Content.PlannedProducts.Concat(Content.MonofocalProducts.Keys).Concat(Content.BifocalOccupationalProducts.Keys)
            .Concat(Content.PremiumProducts.Keys).Concat(Content.ProgressiveProducts.Keys).Append(Content.First.Slug).ToArray();
        Assert.Equal(18, identities.Length);
        Assert.Equal(18, identities.Distinct().Count());
        Assert.DoesNotContain("myofix", identities);
    }

    [Fact]
    public async Task SourceCopyVariantsAndHonestFaqStateAreNotInventedOrCorrected()
    {
        Assert.Contains("Novar Sport", Content.MonofocalProducts["outdoor"].Intro);
        Assert.Contains("Novar Relax", Content.MonofocalProducts["indoor"].Intro);
        Assert.EndsWith("calidad digita.", Content.MonofocalProducts["single-vision"].Intro);
        Assert.Equal("¿Para quién está recomendado Novar Geo ?", Content.MonofocalProducts["geo"].Questions[1].Question);
        Assert.Equal("Blending Technology™", Content.MonofocalProducts["slim"].Technologies[2].Name);
        Assert.Contains("RoTech / WearFit", Content.MonofocalProducts["outdoor"].TechnologySpec);
        Assert.Equal("a3b80.png", Content.MonofocalProducts["outdoor"].HeroUnderlay);
        Assert.Equal("a3b80.png", Content.MonofocalProducts["indoor"].HeroUnderlay);
        Assert.Equal(new[] { "Alta según receta", "Según uso", "Según receta" }, Content.MonofocalProducts["single-vision"].Benefits.Select(x => x.Level));
        Assert.Equal(new[] { "Alta", "Media", "Según receta" }, Content.MonofocalProducts["outdoor"].Benefits.Select(x => x.Level));
        Assert.Equal(new[] { "Alta según receta", "Media", "Alta" }, Content.MonofocalProducts["indoor"].Benefits.Select(x => x.Level));

        foreach (var product in Content.MonofocalProducts.Values)
        {
            Assert.Equal(3, product.Questions.Length);
            Assert.Null(product.Questions[0].Answer);
            Assert.Null(product.Questions[1].Answer);
            Assert.NotNull(product.Questions[2].Answer);
            Assert.Equal(product.Slug == "slim" ? 3 : 2, product.Technologies.Length);
            Assert.Equal(4, product.Gallery.Length);
            Assert.Equal(3, product.Icons.Length);
            var html = WebUtility.HtmlDecode(await client.GetStringAsync($"/lentes/{product.Slug}"));
            var faq = Regex.Match(html, "<section class=\"mono-faq\"[\\s\\S]*?</section>").Value;
            Assert.Equal(3, Regex.Matches(faq, "class=\"accordion-button ").Count);
            Assert.Equal(2, Regex.Matches(faq, "Respuesta pendiente de revisión editorial").Count);
            Assert.Single(Regex.Matches(faq, "aria-expanded=\"true\""));
            Assert.Contains($"id=\"mono-{product.Slug}-faq-2\" class=\"accordion-collapse collapse show\"", faq);
            Assert.Contains(product.Questions[2].Answer!, faq);
            Assert.Equal(3, Regex.Matches(faq, "data-bs-parent=").Count);
            var withoutInlineEmphasis = Regex.Replace(html, "</?strong>", "");
            var text = Regex.Replace(Regex.Replace(withoutInlineEmphasis, "<[^>]+>", " "), "\\s+", " ");
            foreach (var copy in new[] { product.Subtitle, product.Description, product.Intro, product.Details, product.Design, product.IdealFor, product.TechnologySpec })
                Assert.Contains(copy, text);
            foreach (var technology in product.Technologies)
            {
                Assert.Contains(technology.Name, text);
                Assert.Contains(technology.Description, text);
            }
            Assert.Equal(product.Technologies.Length, Regex.Matches(html, "class=\"mono-technology-card\"").Count);
        }
    }

    [Fact]
    public async Task SupportedNavigationWorksWhileUnavailableActionsRemainPending()
    {
        foreach (var product in Content.MonofocalProducts.Values)
        {
            var html = WebUtility.HtmlDecode(await client.GetStringAsync($"/lentes/{product.Slug}"));
            Assert.Contains($"data-pending=\"Personalización de Novar {product.Name}\"", html);
            foreach (var action in new[] { "Garantía", "Instagram", "LinkedIn", "Facebook", "YouTube" })
                Assert.Contains($"data-pending=\"{action}\"", html);
            Assert.Contains("id=\"pending-modal\"", html);
            Assert.Contains("no se envían ni almacenan datos y no se generan resultados", html);
            Assert.DoesNotContain("<form", html);
            Assert.DoesNotContain("target=\"_blank\"", html);
            Assert.DoesNotContain("figma.com/api", html);
            Assert.Contains("href=\"/tratamientos\"", html);
            Assert.Contains("href=\"/#contacto\"", html);
            var related = Regex.Match(html, "<section class=\"mono-related\"[\\s\\S]*?</section>").Value;
            Assert.Equal(4, Regex.Matches(related, "<a ").Count);
            foreach (var slug in new[] { "outdoor", "single-vision", "slim", "geo" })
            {
                Assert.Contains($"href=\"/lentes/{slug}\"", related);
                Assert.Equal(HttpStatusCode.OK, (await client.GetAsync($"/lentes/{slug}")).StatusCode);
            }
        }
        foreach (var slug in Content.PlannedProducts)
            Assert.Contains("Ficha en preparación", WebUtility.HtmlDecode(await client.GetStringAsync($"/lentes/{slug}")));
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/lentes/monofocal-inventado")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/lentes/myofix")).StatusCode);
    }

    [Fact]
    public async Task EveryVisibleAssetHasOriginalBytesAndSourceSlotProvenance()
    {
        using var manifest = JsonDocument.Parse(File.ReadAllText(Path.Combine(FindRoot(), "docs", "asset-provenance.json")));
        var verified = manifest.RootElement.GetProperty("monofocalAssetVerification");
        var assets = verified.GetProperty("assets").EnumerateArray().ToDictionary(x => x.GetProperty("file").GetString()!);
        var slots = verified.GetProperty("slots").EnumerateArray().ToArray();
        Assert.Equal(73, assets.Count);
        Assert.Equal(167, slots.Length);
        foreach (var product in Content.MonofocalProducts.Values)
        {
            var html = await client.GetStringAsync($"/lentes/{product.Slug}");
            var files = Regex.Matches(html, "src=\"/media/figma/(?<file>[^\"]+)\"").Select(m => m.Groups["file"].Value).Distinct().ToArray();
            foreach (var file in files)
            {
                Assert.True(assets.ContainsKey(file), file);
                var response = await client.GetAsync($"/media/figma/{file}");
                Assert.Equal(HttpStatusCode.OK, response.StatusCode);
                var bytes = await response.Content.ReadAsByteArrayAsync();
                Assert.NotEmpty(bytes);
                Assert.Equal(assets[file].GetProperty("bytes").GetInt32(), bytes.Length);
                Assert.Equal(assets[file].GetProperty("sha256").GetString(), Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant());
                var signature = assets[file].GetProperty("signature").GetString();
                if (signature == "svg")
                {
                    var svg = XDocument.Parse(System.Text.Encoding.UTF8.GetString(bytes));
                    var geometry = assets[file].GetProperty("rootGeometry");
                    Assert.Equal(geometry.GetProperty("width").GetString(), svg.Root!.Attribute("width")!.Value);
                    Assert.Equal(geometry.GetProperty("height").GetString(), svg.Root.Attribute("height")!.Value);
                    Assert.Equal(geometry.GetProperty("viewBox").GetString(), svg.Root.Attribute("viewBox")!.Value);
                }
                else if (signature == "png")
                    Assert.Equal(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }, bytes.Take(8));
                else
                {
                    Assert.Equal("jpeg", signature);
                    Assert.Equal(new byte[] { 255, 216, 255 }, bytes.Take(3));
                }
                Assert.Contains(slots, slot => slot.GetProperty("slug").GetString() == product.Slug && slot.GetProperty("file").GetString() == file);
            }
            foreach (var slot in slots.Where(s => s.GetProperty("slug").GetString() == product.Slug))
            {
                Assert.Contains(slot.GetProperty("file").GetString(), files);
                Assert.NotEmpty(slot.GetProperty("sourceNode").GetString()!);
                Assert.NotEmpty(slot.GetProperty("callsite").GetString()!);
                Assert.NotEmpty(slot.GetProperty("sourceGeometry").GetString()!);
                Assert.NotEmpty(slot.GetProperty("sourceCrop").GetString()!);
            }
            foreach (var path in Regex.Matches(html, "(?:src|href)=\"(?<path>/(?:fonts|vendor|css|js)/[^\"]+)\"").Select(m => m.Groups["path"].Value).Distinct())
                Assert.True((await client.GetAsync(path)).IsSuccessStatusCode, path);
        }
    }

    [Theory]
    [InlineData("/")]
    [InlineData("/lentes")]
    [InlineData("/lentes/first")]
    [InlineData("/lentes/ai-lens")]
    [InlineData("/lentes/myolens")]
    [InlineData("/lentes/aiwork")]
    [InlineData("/lentes/precisa")]
    [InlineData("/lentes/precisa-short")]
    [InlineData("/lentes/evolution")]
    [InlineData("/lentes/evolution-short")]
    [InlineData("/lentes/elife")]
    [InlineData("/sobre-nosotros")]
    [InlineData("/juegos")]
    [InlineData("/tratamientos")]
    public async Task PresentationDoesNotLeakToProtectedPages(string route)
    {
        var html = await client.GetStringAsync(route);
        Assert.DoesNotContain("/css/monofocal-products.css", html);
        Assert.DoesNotContain("monofocales-page", html);
        Assert.DoesNotContain("monofocales-v1", html);
        Assert.DoesNotContain("mono-footer", html);
    }

    [Fact]
    public async Task GeometryUsesScopedResponsiveRulesWithoutSvgDimensionOverrides()
    {
        var css = await client.GetStringAsync("/css/monofocal-products.css");
        foreach (var width in new[] { "1199px", "1023px", "767px", "359px" })
            Assert.Contains(width, css);
        Assert.Contains(".mono-wordmark { display: block; max-width: none; }", css);
        Assert.DoesNotMatch("\\.mono-wordmark\\s*\\{[^}]*?(?:width|height):\\s*100%", css);
        Assert.Contains("transform: scale(.64)", css);
        Assert.Contains(".monofocal-product--single-vision", css);
        Assert.Contains(".monofocal-product--outdoor", css);
        Assert.Contains(".monofocal-product--indoor", css);
        Assert.Contains(".monofocal-product--slim", css);
        Assert.Contains("overflow-x: auto", css);
        Assert.DoesNotContain("@import", css);
        Assert.DoesNotContain("position: fixed", css);
        Assert.DoesNotContain("figma.com", css);
    }

    private static string FindRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "Novar.sln")))
            directory = directory.Parent;
        return directory?.FullName ?? throw new DirectoryNotFoundException("Novar.sln was not found.");
    }
}
