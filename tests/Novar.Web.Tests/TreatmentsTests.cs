using System.Net;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Novar.Web.Services;

namespace Novar.Web.Tests;

public sealed class TreatmentsTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Theory]
    [InlineData("es")]
    [InlineData("en")]
    [InlineData("pt-BR")]
    public async Task TreatmentTabsHaveNoObsoleteAvailabilityNotice(string culture)
    {
        using var localizedClient = factory.CreateClient();
        localizedClient.DefaultRequestHeaders.AcceptLanguage.ParseAdd(culture);
        var html = await localizedClient.GetStringAsync("/tratamientos");
        var tabs = Regex.Match(html, "<nav class=\"treatments-tabs\"[\\s\\S]*?</nav>").Value;
        Assert.NotEmpty(tabs);
        Assert.DoesNotContain("treatments-availability", html);
        Assert.Equal(7, Regex.Matches(tabs, "data-treatment-link=").Count);
    }

    [Fact]
    public async Task TreatmentsRendersSevenStatesWithinTheSharedSourcePage()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/tratamientos"));
        var content = factory.Services.GetRequiredService<SiteContent>().Treatments;
        Assert.Equal("961:9641", content.SourceNode);
        Assert.Contains("data-treatments-revision=\"treatments-performance-v1\"", html);
        Assert.Contains("data-figma-node=\"961:9641\"", html);
        Assert.DoesNotContain("después de aprobar la muestra visual", html);
        Assert.Single(Regex.Matches(html, "<h1(?: |>)"));
        Assert.Equal(7, content.Details.Length);
        Assert.Equal("uv", content.Details[0].Id);
        Assert.Equal(7, Regex.Matches(html, "data-treatment-detail=").Count);
        Assert.Contains("id=\"uv\"", html);
        Assert.Contains(content.Details[0].Description, html);
        Assert.All(content.Details[0].Benefits, benefit => Assert.Contains(benefit, html));
        Assert.Contains("<strong>potenciar tus lentes?</strong>", html);
        Assert.Contains("<strong>tecnologías avanzadas</strong>", html);
        Assert.DoesNotContain("<input", html.WithoutLanguagePreferenceForm());
        Assert.DoesNotContain("type=\"range\"", html);
        Assert.Contains("/js/treatments.js", html);
    }

    [Fact]
    public async Task SevenNativeFragmentsAreAvailableWithoutSeparateRoutes()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/tratamientos"));
        var tabs = Regex.Match(html, "<nav class=\"treatments-tabs\"[\\s\\S]*?</nav>").Value;
        var content = factory.Services.GetRequiredService<SiteContent>().Treatments;
        Assert.Equal(7, content.Tabs.Length);
        Assert.Equal(new[] { "uv", "blue-tech", "antirraya", "polarizado", "hidrofobico", "fotosensible", "ilux" }, content.Tabs.Where(tab => tab.Available).Select(tab => tab.Id));
        Assert.DoesNotContain("<button", tabs);
        Assert.Contains("href=\"#uv\" data-treatment-link=\"uv\"", tabs);
        Assert.Contains("href=\"#blue-tech\" data-treatment-link=\"blue-tech\"", tabs);
        Assert.Contains("href=\"#antirraya\" data-treatment-link=\"antirraya\"", tabs);
        Assert.DoesNotContain("aria-current", tabs); // Script derives a single current tab from the fragment.
        Assert.DoesNotContain("próximamente", tabs, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("treatments-availability", tabs);
        Assert.DoesNotContain("También podés ver Antirreflejo iLUX.", tabs);
        foreach (var tab in content.Tabs)
        {
            Assert.Contains($"href=\"#{tab.Id}\" data-treatment-link=\"{tab.Id}\"", tabs);
            Assert.DoesNotContain($"href=\"/tratamientos/{tab.Id}\"", html);
        }
    }

    [Theory]
    [InlineData("/tratamientos/uv")]
    [InlineData("/tratamientos/blue-tech")]
    [InlineData("/tratamientos/antirraya")]
    [InlineData("/tratamientos/polarizado")]
    [InlineData("/tratamientos/hidrofobico")]
    [InlineData("/tratamientos/fotosensible")]
    [InlineData("/tratamientos/ilux")]
    public async Task TreatmentStatesDoNotCreateSeparateRoutes(string path)
    {
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync(path)).StatusCode);
    }

    [Fact]
    public async Task ComparisonPreservesAllSevenSourceRowsWithoutChangingClaims()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/tratamientos"));
        var comparison = Regex.Match(html, "<table class=\"treatments-table\"[\\s\\S]*?</table>").Value;
        var rows = factory.Services.GetRequiredService<SiteContent>().Treatments.Comparison;
        Assert.Equal(7, rows.Length);
        Assert.Equal(7, Regex.Matches(comparison, "<th scope=\"row\"").Count);
        Assert.Equal(14, Regex.Matches(comparison, "<li>").Count);
        Assert.Contains("<caption class=\"visually-hidden\">", comparison);
        foreach (var row in rows)
        {
            Assert.Contains(row.Name, comparison);
            Assert.Contains(row.Description, comparison);
            Assert.All(row.Benefits, benefit => Assert.Contains(benefit, comparison));
        }
        Assert.Equal(new[] { "Transición automática", "Protección UV incluida" }, rows[3].Benefits);
        Assert.Equal(new[] { "Más claridad", "12 capas" }, rows[6].Benefits);
        Assert.DoesNotContain("<button", comparison);
    }

    [Fact]
    public async Task ComparisonHighlightUsesTheSelectedTreatmentsStableRowKey()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/tratamientos"));
        var comparison = Regex.Match(html, "<table class=\"treatments-table\"[\\s\\S]*?</table>").Value;
        var rowKeys = Regex.Matches(comparison, "<tr data-treatment-row=\"([^\"]+)\"")
            .Cast<Match>()
            .Select(match => match.Groups[1].Value)
            .ToArray();
        var expected = new[] { "uv", "blue-tech", "antirraya", "polarizado", "hidrofobico", "fotosensible", "ilux" };

        Assert.Equal(expected, rowKeys);

        var css = await client.GetStringAsync("/css/treatments.css");
        Assert.DoesNotContain(".treatments-table tr:first-child", css, StringComparison.Ordinal);
        foreach (var key in expected)
            Assert.Contains($".treatments-content[data-active-treatment=\"{key}\"] .treatments-table tr[data-treatment-row=\"{key}\"]", css, StringComparison.Ordinal);
    }

    [Fact]
    public async Task UvPhotoBandAndImagePlaneUseResponsiveFigmaScale()
    {
        var css = await client.GetStringAsync("/css/treatments.css");

        Assert.Contains("height: min(680px, 47.2222vw)", css, StringComparison.Ordinal);
        Assert.Contains("width: 116.9444%", css, StringComparison.Ordinal);
        Assert.Contains("aspect-ratio: 1684 / 937.695", css, StringComparison.Ordinal);
        Assert.DoesNotContain("width: 760px; height: 424.9px", css, StringComparison.Ordinal);
    }

    [Fact]
    public async Task TreatmentPresentationDoesNotLeakIntoOtherPages()
    {
        var html = await client.GetStringAsync("/tratamientos");
        Assert.Contains("<body class=\"treatments-page\">", html);
        Assert.Contains("href=\"/tratamientos\" aria-current=\"page\"", html);
        Assert.Contains("/css/treatments.css", html);
        Assert.DoesNotContain("/css/games.css", html);
        Assert.DoesNotContain("/css/about.css", html);
        Assert.DoesNotContain("Ver muestra: Novar First", html);
        foreach (var path in new[] { "/", "/lentes/first", "/sobre-nosotros", "/juegos" })
        {
            var other = await client.GetStringAsync(path);
            Assert.DoesNotContain("/css/treatments.css", other);
            Assert.DoesNotContain("treatments-footer", other);
            Assert.DoesNotContain("treatments-uv-v1", other);
            Assert.DoesNotContain("treatments-blue-tech-v1", other);
            Assert.DoesNotContain("treatments-antirraya-v1", other);
            Assert.DoesNotContain("treatments-polarizado-v1", other);
            Assert.DoesNotContain("treatments-hidrofobico-v1", other);
            Assert.DoesNotContain("treatments-fotosensible-v1", other);
            Assert.DoesNotContain("treatments-performance-v1", other);
            Assert.DoesNotContain("/js/treatments.js", other);
        }
    }

    [Fact]
    public async Task TreatmentUsesOriginalLocalAssetsAndIntrinsicSvgRoots()
    {
        var html = await client.GetStringAsync("/tratamientos");
        var sizes = new Dictionary<string, (string Width, string Height)>
        {
            ["b9b6a.svg"] = ("56.401", "30.6381"),
            ["7bc95.svg"] = ("10.2128", "10.2128"),
            ["4e27d.svg"] = ("1089.22", "0.748092"),
            ["cfa16.svg"] = ("135.405", "3.74046"),
            ["ef8cd.svg"] = ("13.9265", "13.9265"),
            ["4fa2a.svg"] = ("22.3059", "18.2378"),
            ["f87fc.svg"] = ("22.923", "18.4942"),
            ["97fd8.svg"] = ("22.0033", "18.7179"),
            ["dabcc.svg"] = ("21.9854", "18.5251"),
            ["e27ca.svg"] = ("18.2751", "18.2783"),
            ["c8445.svg"] = ("17.1763", "17.1763"),
            ["fa384.svg"] = ("17.1704", "17.1746"),
            ["b21e2.svg"] = ("17.1743", "17.1758"),
            ["9daba.svg"] = ("17.1763", "17.1763"),
            ["e3672.svg"] = ("24.4617", "17.1758"),
            ["ba1ea.svg"] = ("12.0696", "12.0696"),
            ["4d514.svg"] = ("91", "15.1665"),
            ["8e61b.svg"] = ("91", "15.1665"),
            ["843a7.svg"] = ("91", "15.1667"),
            ["279a2.svg"] = ("91", "15.1667")
        };
        foreach (var (file, size) in sizes)
        {
            Assert.Contains($"/media/figma/{file}", html);
            var root = XDocument.Parse(await client.GetStringAsync($"/media/figma/{file}")).Root!;
            Assert.Equal(size.Width, root.Attribute("width")?.Value);
            Assert.Equal(size.Height, root.Attribute("height")?.Value);
        }
        foreach (var (file, width, height) in new[] { ("16fed.png", 2752, 1536), ("74f40.png", 1437, 553), ("f0cf4.png", 1448, 1086), ("3dd09.png", 2752, 1536), ("8af8d.png", 2752, 1536), ("dd2a0.png", 2752, 1536), ("23aae.png", 2752, 1536), ("b6e78.png", 2752, 1536) })
        {
            var poster = file switch
            {
                "16fed.png" => "uv", "f0cf4.png" => "blue-tech", "3dd09.png" => "antirraya",
                "8af8d.png" => "polarizado", "dd2a0.png" => "hidrofobico", "23aae.png" => "fotosensible",
                "b6e78.png" => "ilux", _ => null
            };
            Assert.Contains(poster is null ? $"/media/figma/{file}" : $"/media/treatments/optimized/{poster}-poster-1280.webp", html);
            var image = await client.GetByteArrayAsync($"/media/figma/{file}");
            Assert.True(image.Length > 1000);
            Assert.Equal((width, height), ReadRasterDimensions(image));
        }
        Assert.Equal(21, Regex.Matches(html, "src=\"/media/figma/7bc95.svg\"").Count);
        var css = await client.GetStringAsync("/css/treatments.css");
        Assert.Contains("Poppins-Thin.ttf", css);
        Assert.Contains("font-weight: 100", css);
        Assert.DoesNotContain("figma.com/api", html + css);
        Assert.True((await client.GetByteArrayAsync("/fonts/poppins/Poppins-Thin.ttf")).Length > 100000);
        var assets = Regex.Matches(html, "(?:src|href)=\"(?<path>/(?:media|fonts|vendor|css|js)/[^\"]+)\"")
            .Select(match => match.Groups["path"].Value).Distinct();
        foreach (var asset in assets)
        {
            var response = await client.GetAsync(asset);
            Assert.True(response.IsSuccessStatusCode, $"Missing asset: {asset}");
            Assert.NotEmpty(await response.Content.ReadAsByteArrayAsync());
        }
    }

    [Fact]
    public async Task SophiaAndSourceSocialsRemainExplicitlyPendingWithoutSubmission()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/tratamientos"));
        Assert.Contains("type=\"button\" data-pending=\"Sophia\"", html);
        Assert.Contains("Hablar con Sophia: pendiente de integración", html);
        Assert.Contains("no se envían ni almacenan datos y no se generan resultados", html);
        Assert.DoesNotContain("<form", html.WithoutLanguagePreferenceForm());
        var social = Regex.Match(html, "<div class=\"treatments-footer-socials\"[\\s\\S]*?</div>").Value;
        Assert.Equal(new[] { "Instagram", "LinkedIn", "Facebook", "YouTube" },
            Regex.Matches(social, "data-pending=\"([^\"]+)\"").Select(match => match.Groups[1].Value));
        Assert.Equal(HttpStatusCode.MethodNotAllowed,
            (await client.PostAsync("/tratamientos", new StringContent(""))).StatusCode);
    }

    private static (int Width, int Height) ReadRasterDimensions(byte[] image)
    {
        // Figma's 16fed.png URL serves original JPEG bytes; detect metadata, not the extension.
        if (image.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }))
            return (System.Buffers.Binary.BinaryPrimitives.ReadInt32BigEndian(image.AsSpan(16, 4)),
                System.Buffers.Binary.BinaryPrimitives.ReadInt32BigEndian(image.AsSpan(20, 4)));

        Assert.Equal(0xff, image[0]);
        Assert.Equal(0xd8, image[1]);
        var offset = 2;
        while (offset + 8 < image.Length)
        {
            Assert.Equal(0xff, image[offset++]);
            while (image[offset] == 0xff) offset++;
            var marker = image[offset++];
            var length = System.Buffers.Binary.BinaryPrimitives.ReadUInt16BigEndian(image.AsSpan(offset, 2));
            if (marker is 0xc0 or 0xc1 or 0xc2 or 0xc3 or 0xc5 or 0xc6 or 0xc7 or 0xc9 or 0xca or 0xcb or 0xcd or 0xce or 0xcf)
                return (System.Buffers.Binary.BinaryPrimitives.ReadUInt16BigEndian(image.AsSpan(offset + 5, 2)),
                    System.Buffers.Binary.BinaryPrimitives.ReadUInt16BigEndian(image.AsSpan(offset + 3, 2)));
            Assert.True(length >= 2, "Invalid JPEG segment length");
            offset += length;
        }
        throw new InvalidDataException("Original raster dimensions were not found.");
    }
}
