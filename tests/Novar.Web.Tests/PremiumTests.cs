using System.Net;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Novar.Web.Services;

namespace Novar.Web.Tests;

public sealed class PremiumTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Theory]
    [InlineData("ai-lens", "894:233", "40da9.png", "68e81.png", "fcfe9.png", 3, 2)]
    [InlineData("myolens", "977:11066", "c2edd.png", "c69be.png", "459f9.png", 4, 3)]
    [InlineData("aiwork", "988:11447", "66c80.png", "3f12a.png", "b7de4.png", 4, 3)]
    public async Task PagesRenderTheirOwnSourceAssetsAndAccessibleInitialFaq(
        string slug, string node, string hero, string feature, string gallery, int questionCount, int openIndex)
    {
        var response = await client.GetAsync($"/lentes/{slug}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var html = WebUtility.HtmlDecode(await response.Content.ReadAsStringAsync());
        Assert.Contains($"data-figma-node=\"{node}\"", html);
        Assert.Contains("data-premium-revision=\"premium-v1\"", html);
        Assert.Contains($"<body class=\"premium-page premium-page--{slug}\">", html);
        Assert.Contains("/css/premium.css", html);
        Assert.Contains("href=\"/lentes\" aria-current=\"page\"", html);
        Assert.Single(Regex.Matches(html, "<h1(?: |>)"));
        Assert.Contains("class=\"premium-footer\"", html);
        Assert.DoesNotContain("Ver muestra: Novar First", html);
        Assert.DoesNotContain("después de aprobar la muestra visual", html);
        Assert.DoesNotContain("react", html, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("tailwind", html, StringComparison.OrdinalIgnoreCase);
        foreach (var asset in new[] { hero, feature, gallery })
            Assert.Single(Regex.Matches(html, Regex.Escape($"src=\"/media/figma/{asset}\"")));

        var faq = Regex.Match(html, "<section class=\"premium-faq\"[\\s\\S]*?</section>").Value;
        Assert.Contains("Preguntas<br /> frecuentes", faq);
        Assert.Equal(questionCount, Regex.Matches(faq, "class=\"accordion-button ").Count);
        Assert.Single(Regex.Matches(faq, "aria-expanded=\"true\""));
        Assert.Contains($"data-bs-target=\"#premium-{slug}-faq-{openIndex}\" aria-expanded=\"true\"", faq);
        Assert.Contains($"id=\"premium-{slug}-faq-{openIndex}\" class=\"accordion-collapse collapse show\"", faq);
        Assert.Equal(questionCount - 1, Regex.Matches(faq, "Respuesta pendiente de revisión editorial").Count);
        Assert.Equal(questionCount, Regex.Matches(faq, "data-bs-parent=").Count);
        Assert.Contains("¿Tenés otra duda? Contactanos →", faq);
        Assert.DoesNotContain("<form", html);
        Assert.Contains("no se envían ni almacenan datos y no se generan resultados", html);
        Assert.Equal(HttpStatusCode.MethodNotAllowed,
            (await client.PostAsync($"/lentes/{slug}", new StringContent(""))).StatusCode);
    }

    [Fact]
    public void CatalogPartitionAndOnlySourceSuppliedAnswersAreRetained()
    {
        var content = factory.Services.GetRequiredService<SiteContent>();
        Assert.Equal(new[] { "ai-lens", "aiwork", "myolens" }, content.PremiumProducts.Keys.Order());
        Assert.Empty(content.PlannedProducts);
        Assert.Equal(18, content.PremiumProducts.Keys.Concat(content.ProgressiveProducts.Keys).Concat(content.MonofocalProducts.Keys).Concat(content.BifocalOccupationalProducts.Keys).Concat(content.PlannedProducts).Append(content.First.Slug).Distinct().Count());
        Assert.All(content.PremiumProducts.Values, product =>
        {
            Assert.Equal(4, product.Benefits.Length);
            Assert.Single(product.Questions, question => question.Answer is not null);
            Assert.Equal(product.Questions.Length - 1, product.OpenQuestion);
            Assert.False(content.PlannedProducts.Contains(product.Slug));
        });
        Assert.Contains("cualquier otra desarrolladas por humanos", content.PremiumProducts["ai-lens"].TechnologyDescription);
        Assert.Contains(content.PremiumProducts["ai-lens"].Callouts, c => c.Text == "Primer lente diseñada con");
        Assert.DoesNotContain(content.PremiumProducts["myolens"].Callouts, c => c.Slot == "bottom-left");
        Assert.Equal("No. MyoFix está orientado al manejo de miopía progresiva en niños y adolescentes. MyoLens está pensado para brindar mayor confort visual en pacientes miopes.",
            content.PremiumProducts["myolens"].Questions[3].Answer);
        Assert.Equal("Su personalización por distancias de trabajo y su optimización mediante inteligencia artificial.",
            content.PremiumProducts["aiwork"].Questions[3].Answer);
        Assert.Equal("La combinación de Psicoptix y AI-GET, que permite optimizar el diseño y mejorar la experiencia visual en todas las distancias.",
            content.PremiumProducts["ai-lens"].Questions[2].Answer);
    }

    [Theory]
    [InlineData("/")]
    [InlineData("/lentes")]
    [InlineData("/lentes/first")]
    [InlineData("/lentes/precisa")]
    [InlineData("/sobre-nosotros")]
    [InlineData("/juegos")]
    [InlineData("/tratamientos")]
    public async Task PremiumPresentationDoesNotLeakToOtherPages(string route)
    {
        var html = await client.GetStringAsync(route);
        Assert.DoesNotContain("/css/premium.css", html);
        Assert.DoesNotContain("premium-v1", html);
        Assert.DoesNotContain("class=\"premium-footer\"", html);
        Assert.DoesNotContain("Poppins-Black", html);
    }

    [Theory]
    [InlineData("/lentes/myofix")]
    [InlineData("/lentes/no-existe")]
    public async Task UnknownProductsRemainReal404(string route) =>
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync(route)).StatusCode);

    [Theory]
    [InlineData("ai-lens")]
    [InlineData("myolens")]
    [InlineData("aiwork")]
    public async Task AllReferencesAreLocalNonemptyAndNoAdditionalProductionScriptIsNeeded(string slug)
    {
        var html = await client.GetStringAsync($"/lentes/{slug}");
        var paths = Regex.Matches(html, "(?:src|href)=\"(?<path>/(?:media|fonts|vendor|css|js)/[^\"]+)\"")
            .Select(match => match.Groups["path"].Value).Distinct().ToArray();
        Assert.True(paths.Length > 15);
        foreach (var path in paths)
        {
            var response = await client.GetAsync(path);
            Assert.True(response.IsSuccessStatusCode, path);
            Assert.NotEmpty(await response.Content.ReadAsByteArrayAsync());
        }
        Assert.DoesNotContain("figma.com/api", html);
        Assert.DoesNotContain("/js/premium", html);
        Assert.Contains("/vendor/bootstrap/bootstrap.bundle.min.js", html);
        Assert.Contains("/js/site.js", html);
    }

    [Theory]
    [InlineData("40da9.png", "52e6ad33018b287e07fc8278f41f28f004993c0f57d290775a96e1f3d344a3c9")]
    [InlineData("68e81.png", "e295a56efe8b9497e637b04708a54aa0fc649002faec1db61d0fc73b7f9faaff")]
    [InlineData("fcfe9.png", "b5e7159e26cb1ccb729e1377654d51ab88f8a12da3c442cdfd8fa67be603721d")]
    [InlineData("6a724.png", "86cd635d9812febe10d9facdd811d88834db1062307f5c9bb0b7f4b8bfb36f1c")]
    [InlineData("4a1dc.png", "8340300f7083071b4561424d3ec572ae5f7e5f305b4874628c0e3a2d666c8ba4")]
    [InlineData("b3e5b.svg", "3f923923393c43092fd3ca5400b7339e2f032f9a5c251eca3b8dd118e4abff96")]
    [InlineData("da3e9.svg", "6c02371bc671ba55da62aa51df522c6cce75e45dd199ce6d0a6f013d2672fdae")]
    [InlineData("eb2eb.svg", "c6c975ac9f54b79a0f7ac9641a82dfda6091c4bb8d28682eddeb1856d36ea713")]
    [InlineData("1b8c9.svg", "878181a289d7f84e184ce9ad0d65415c4f04898b744a4629654e1d077dee3c07")]
    [InlineData("ad6f0.svg", "5dc65741301cd45567493df6235b33a908f26300c79468629b23b665770da49f")]
    [InlineData("8c8de.svg", "ca2ea3ae2769f872b7d5e3851912c2609383e6b3391f79b607bc3e37852bc749")]
    [InlineData("71321.svg", "fbf8d6c2bbf8c28c8da36c3489fe9ca199326d434759c0f06140733e330ef9ec")]
    [InlineData("60515.svg", "74965df2fe007422184e46ed1174260e1a70aa0c25bcd776d0c5c5496cc5818a")]
    [InlineData("757b0.svg", "c2d8707243fce61c3332c1e4e390b6b237eebfab9422a54a3671c8c73a993917")]
    [InlineData("c2edd.png", "efbca640195dda1aaad04a2f68908b0cd696d262a0fe16e783a5f69bc2d25838")]
    [InlineData("c69be.png", "ceece0c71311d8f3d03c781bdbc83dc281ba94ad23b7b8f1a47939284ccc05c9")]
    [InlineData("459f9.png", "66144c9a2a880c8877c88594df9690dc35cfe6d3260b2416d991ad9f9d9ecee6")]
    [InlineData("ce2fb.svg", "258460afe1ee039e5e3345152e7580a1647fae7c2a6848a2b6712fecbb4e3a40")]
    [InlineData("0a8a2.svg", "63ac260a848250909c8ef64f36a5b5e7cc0060379ea57f04fdda171a3336feff")]
    [InlineData("66c80.png", "36547496ea4db995d968a5aeebc3f3fb3097e634412d34e22c060e4bf48d9b9d")]
    [InlineData("3f12a.png", "23c86c1dd27037a3a9088b4684260344df51868644e2a441a5395bf59a83e919")]
    [InlineData("b7de4.png", "7709e711aa458498d27d40a325edeccf1e1fde27fa16c0e43ba4c917d67c7288")]
    [InlineData("91079.png", "01aff407116f20777323f791b36282f47cb51862c002b235957c38bb475a56dc")]
    public async Task OriginalPremiumAssetBytesArePreserved(string file, string expectedHash)
    {
        var bytes = await client.GetByteArrayAsync($"/media/figma/{file}");
        Assert.NotEmpty(bytes);
        Assert.Equal(expectedHash, Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant());
        var pages = await Task.WhenAll(new[] { "ai-lens", "myolens", "aiwork" }
            .Select(slug => client.GetStringAsync($"/lentes/{slug}")));
        Assert.Contains(pages, html => html.Contains($"/media/figma/{file}"));
    }

    [Theory]
    [InlineData("b3e5b.svg", "19.3751", "18.9986")]
    [InlineData("da3e9.svg", "3.83465", "18.9985")]
    [InlineData("eb2eb.svg", "61.0208", "19.2612")]
    [InlineData("1b8c9.svg", "4.29309", "4.28442")]
    [InlineData("ad6f0.svg", "6.34111", "6.33712")]
    [InlineData("8c8de.svg", "52.7561", "42.6719")]
    [InlineData("71321.svg", "43.9561", "46.1205")]
    [InlineData("60515.svg", "32.0878", "39.0283")]
    [InlineData("757b0.svg", "42.9492", "30.3681")]
    [InlineData("ce2fb.svg", "29.8037", "4.22676")]
    [InlineData("0a8a2.svg", "98.9981", "21.0002")]
    public async Task SvgRootsRetainTheirOriginalGeometry(string file, string width, string height)
    {
        var root = XDocument.Parse(await client.GetStringAsync($"/media/figma/{file}")).Root!;
        Assert.Equal(width, root.Attribute("width")?.Value);
        Assert.Equal(height, root.Attribute("height")?.Value);
        var css = await client.GetStringAsync("/css/premium.css");
        Assert.DoesNotContain(".premium-brand img { width:", css);
        Assert.DoesNotContain(".premium-benefit-icon img { width:", css);
    }

    [Fact]
    public async Task GalleryUsesOriginalBlack900RatherThanSyntheticBold()
    {
        var bytes = await client.GetByteArrayAsync("/fonts/poppins/Poppins-Black.ttf");
        Assert.Equal(153440, bytes.Length);
        Assert.Equal("d82aaaf98a9283f9a8edd24e51173337d8eaf09e25cd3d98831f8ec8461748a1",
            Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant());
        var css = await client.GetStringAsync("/css/premium.css");
        Assert.Contains("Poppins-Black.ttf", css);
        Assert.Contains("font-weight: 900", css);
        Assert.Contains("height: auto; min-height: 796.5px; object-fit: cover; object-position: center top", css);
        Assert.Contains(".premium-product--aiwork", css);
        Assert.Contains(".premium-product--myolens", css);
        var tableCount = bytes[4] * 256 + bytes[5];
        var found = false;
        for (var i = 0; i < tableCount; i++)
        {
            var offset = 12 + i * 16;
            if (System.Text.Encoding.ASCII.GetString(bytes, offset, 4) != "OS/2") continue;
            var table = (bytes[offset + 8] << 24) | (bytes[offset + 9] << 16) | (bytes[offset + 10] << 8) | bytes[offset + 11];
            Assert.Equal(900, bytes[table + 4] * 256 + bytes[table + 5]);
            found = true;
        }
        Assert.True(found);
    }
}
