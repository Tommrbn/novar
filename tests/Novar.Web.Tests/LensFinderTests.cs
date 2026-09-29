using System.Net;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Novar.Web.Tests;

public sealed class LensFinderTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task InteractiveFinderPreservesSourceCopyAndThreeNativeSections()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/lentes"));
        var section = BaseSection(html);
        Assert.Contains("data-lens-finder-revision=\"lens-finder-routing-v1\"", section);
        Assert.Contains("data-figma-node=\"889:1406\"", section);
        Assert.Contains("data-figma-node=\"889:1409\"", section);
        Assert.Contains("data-figma-node=\"889:1410\"", section);
        Assert.Single(Regex.Matches(html, "<h1(?: |>)"));
        Assert.Contains("Encontrá <span>tu lente ideal</span></h1>", section);
        Assert.Contains("Utilizá los filtros para elegir según tu <strong>edad</strong>, tus <strong>necesidades visuales</strong> o tus <strong>actividades diarias</strong>.", section);

        var filters = Regex.Matches(section, "<summary class=\"lens-finder-filter\"[\\s\\S]*?</summary>");
        Assert.Equal(3, filters.Count);
        Assert.Equal(new[] { "Por edad", "Por necesidad", "Por actividades y preferencias" },
            filters.Select(filter => Regex.Match(filter.Value, "<span>([^<]+)</span>").Groups[1].Value));
        Assert.DoesNotContain("aria-expanded", section);
        Assert.DoesNotContain("aria-controls", section);
        Assert.Equal(3, Regex.Matches(section, "<details(?: |>)").Count);
        Assert.Equal(5, Regex.Matches(section, "data-need").Count);
        Assert.Contains("Tu edad (opcional)", section);
        Assert.Contains("No sé: quiero conocer las opciones", section);
        Assert.DoesNotContain("<form", section);
        Assert.Equal(19, Regex.Matches(section, "<a ").Count);
        Assert.DoesNotContain("lens-finder-poster", section);
        Assert.Equal(4, Regex.Matches(section, "<img ").Count);
    }

    [Fact]
    public async Task FinderActionsAreExplicitClientOnlyAndCatalogWorksWithoutEnhancement()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/lentes"));
        var buttons = Regex.Matches(BaseSection(html), "<button[^>]+>");
        Assert.Single(buttons);
        Assert.Contains("id=\"lens-finder-reset\"", buttons[0].Value);
        Assert.Contains("type=\"button\"", buttons[0].Value);
        Assert.Contains("disabled", buttons[0].Value);
        Assert.DoesNotContain("data-pending", BaseSection(html));
        Assert.Contains("href=\"#lens-finder-all\"", html);
        Assert.DoesNotContain("class=\"lens-finder-notice\"", BaseSection(html));
        Assert.DoesNotContain("Ver opciones", BaseSection(html));
        Assert.Contains("<span>Explorá todos los lentes</span>", html);
        Assert.Single(Regex.Matches(html, "id=\"pending-modal\""));
        Assert.Contains("no se envían ni almacenan datos y no se generan resultados", html);
        Assert.Contains("/js/site.js", html);
        Assert.Contains("/js/lens-finder-rules.js", html);
        Assert.Contains("/js/lens-finder.js", html);
        Assert.Equal(HttpStatusCode.MethodNotAllowed,
            (await client.PostAsync("/lentes", new StringContent(""))).StatusCode);
    }

    [Fact]
    public async Task PresentationAndActiveNavigationAreScopedToLensFinder()
    {
        var html = await client.GetStringAsync("/lentes");
        Assert.Contains("<body class=\"lens-finder-page\">", html);
        Assert.Contains("/css/lens-finder.css", html);
        Assert.Contains("href=\"/lentes\" aria-current=\"page\"", html);
        foreach (var route in new[] { "/", "/lentes/first", "/lentes/ai-lens", "/sobre-nosotros", "/juegos", "/tratamientos" })
        {
            var other = await client.GetStringAsync(route);
            Assert.DoesNotContain("/css/lens-finder.css", other);
            Assert.DoesNotContain("lens-finder-routing-v1", other);
            Assert.DoesNotContain("/js/lens-finder", other);
            if (route is "/lentes/ai-lens" or "/lentes/first")
                Assert.Contains("href=\"/lentes\" aria-current=\"page\"", other);
            else
                Assert.DoesNotContain("href=\"/lentes\" aria-current=\"page\"", other);
        }

        var genericResponse = await client.GetAsync("/lentes/unknown-layout-fixture");
        Assert.Equal(HttpStatusCode.NotFound, genericResponse.StatusCode);
        var generic = await genericResponse.Content.ReadAsStringAsync();
        var header = Regex.Match(html, "<header class=\"site-header\">[\\s\\S]*?</header>").Value;
        Assert.Equal(Regex.Match(generic, "<header class=\"site-header\">[\\s\\S]*?</header>").Value,
            header.Replace("href=\"/lentes\" aria-current=\"page\"", "href=\"/lentes\""));
        Assert.Equal(Regex.Match(generic, "<footer class=\"site-footer\">[\\s\\S]*?</footer>").Value,
            Regex.Match(html, "<footer class=\"site-footer\">[\\s\\S]*?</footer>").Value);
    }

    [Theory]
    [InlineData("f3d35.svg", "14", 3, "9540e2e631c2c32c69135a57d2416cf29e52595723453a4d52ef4a9d0361c114")]
    [InlineData("e3b22.svg", "15", 1, "326d18cc868437cf1120336fa4b0fe71d6c81e5e71681966b495dc0b98d2ee25")]
    public async Task EveryIconUsesOriginalBytesAndIntrinsicRootDimensions(string file, string size, int count, string hash)
    {
        var section = BaseSection(await client.GetStringAsync("/lentes"));
        var callsite = $"src=\"/media/figma/{file}\" alt=\"\" width=\"{size}\" height=\"{size}\"";
        Assert.Equal(count, Regex.Matches(section, Regex.Escape(callsite)).Count);
        var bytes = await client.GetByteArrayAsync($"/media/figma/{file}");
        Assert.NotEmpty(bytes);
        Assert.Equal(hash, Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant());
        var svg = XDocument.Parse(System.Text.Encoding.UTF8.GetString(bytes)).Root!;
        Assert.Equal(size, svg.Attribute("width")?.Value);
        Assert.Equal(size, svg.Attribute("height")?.Value);
        Assert.Equal($"0 0 {size} {size}", svg.Attribute("viewBox")?.Value);
    }

    [Fact]
    public async Task ReferencedAssetsAndGenuinePoppinsWeightsAreAvailableLocally()
    {
        var html = await client.GetStringAsync("/lentes");
        var paths = Regex.Matches(html, "(?:src|href)=\"(?<path>/(?:media|fonts|vendor|css|js)/[^\"]+)\"")
            .Select(match => match.Groups["path"].Value)
            .Concat(new[] { "/fonts/poppins/Poppins-Light.ttf", "/fonts/poppins/Poppins-Medium.ttf" }).Distinct();
        foreach (var path in paths)
        {
            var response = await client.GetAsync(path);
            Assert.True(response.IsSuccessStatusCode, $"Missing asset: {path}");
            Assert.NotEmpty(await response.Content.ReadAsByteArrayAsync());
        }
        var css = await client.GetStringAsync("/css/lens-finder.css");
        Assert.DoesNotContain("figma.com/api", html + css);
        Assert.DoesNotContain("@font-face", css);
        Assert.Contains("width: 560px", css);
        Assert.Contains("font-weight: 300", css);
        Assert.Contains("font-weight: 400", css);
        Assert.Contains("font-weight: 500", css);
    }

    private static string BaseSection(string html) =>
        Regex.Match(html, "<section class=\"lens-finder-base [\\s\\S]*?</section>").Value;
}
