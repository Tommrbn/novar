using System.Text.Json;
using System.Net;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Novar.Web.Models;
using Novar.Web.Services;

namespace Novar.Web.Tests;

public sealed class LensFinderRoutingTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private LensFinderConfig Config => JsonSerializer.Deserialize<LensFinderConfig>(File.ReadAllText(Path.Combine(
        factory.Services.GetRequiredService<IWebHostEnvironment>().ContentRootPath, "Content", "lens-finder.json")),
        new JsonSerializerOptions(JsonSerializerDefaults.Web))!;
    private SiteContent Content => factory.Services.GetRequiredService<SiteContent>();
    private Dictionary<string, string> Names => Content.PremiumProducts.Values.Select(p => (p.Slug, p.Name))
        .Concat(Content.ProgressiveProducts.Values.Select(p => (p.Slug, p.Name)))
        .Concat(Content.MonofocalProducts.Values.Select(p => (p.Slug, p.Name)))
        .Concat(Content.BifocalOccupationalProducts.Values.Select(p => (p.Slug, p.Name)))
        .Append((Content.First.Slug, Content.First.Name)).ToDictionary(p => p.Slug, p => p.Name);

    [Fact]
    public async Task FinderProjectsAllExistingNamesAndOnlyImplementedDestinations()
    {
        var page = Config.Project(Names);
        Assert.Equal(18, page.Products.Length);
        Assert.Empty(Content.PlannedProducts);
        using var client = factory.CreateClient();
        foreach (var product in page.Products)
        {
            Assert.Equal(Names[product.Slug], product.Name);
            Assert.Equal($"/lentes/{product.Slug}", product.Href);
            Assert.False(string.IsNullOrWhiteSpace(product.Reason));
            Assert.True((await client.GetAsync(product.Href)).IsSuccessStatusCode);
            var productHtml = await client.GetStringAsync(product.Href);
            Assert.DoesNotContain("/js/lens-finder", productHtml);
            Assert.DoesNotContain("lens-finder-routing-v1", productHtml);
        }
        Assert.Equal(new[] { 3, 6, 2, 7 }, page.Products.GroupBy(p => p.Need).OrderBy(g => g.Key).Select(g => g.Count()));
    }

    [Fact]
    public async Task RenderedControlsEmbeddedDataAndNoScriptLinksShareTheSameModel()
    {
        using var client = factory.CreateClient();
        var html = await client.GetStringAsync("/lentes");
        var json = Regex.Match(html, "<script id=\"lens-finder-data\" type=\"application/json\">([\\s\\S]*?)</script>").Groups[1].Value;
        var page = JsonSerializer.Deserialize<LensFinderPage>(json, new JsonSerializerOptions(JsonSerializerDefaults.Web))!;
        Assert.Equal(Content.LensFinder.Products, page.Products);
        Assert.Equal(Content.LensFinder.Preferences, page.Preferences, new PreferenceComparer());
        Assert.Equal(Content.LensFinder.Notice, page.Notice);
        var section = WebUtility.HtmlDecode(Regex.Match(html, "<section class=\"lens-finder-base [\\s\\S]*?</section>").Value);
        foreach (var need in page.Needs)
            Assert.Contains($"value=\"{need.Id}\" data-need required", section);
        foreach (var preference in page.Preferences)
            Assert.Contains($"value=\"{preference.Id}\" data-preference=\"{preference.Need}\"", section);
        var catalog = section[section.IndexOf("id=\"lens-finder-all\"", StringComparison.Ordinal)..];
        foreach (var product in page.Products)
            Assert.Contains($"<a href=\"{product.Href}\">{product.Name}</a>", catalog);
        Assert.Equal(18, Regex.Matches(catalog, "<a href=").Count);
        Assert.DoesNotContain("<form", section);
        Assert.Matches("id=\"lens-finder-age\"[^>]+disabled", section);
        Assert.Matches("id=\"lens-finder-reset\"[^>]+type=\"button\"[^>]+disabled", section);
        Assert.DoesNotContain("lens-finder-submit", section);
        Assert.DoesNotContain("Ver opciones", section);
        Assert.DoesNotContain("class=\"lens-finder-notice\"", section);
        Assert.Contains("role=\"status\" aria-live=\"polite\"", section);
        foreach (var file in new[] { "lens-finder-rules.js", "lens-finder.js" })
        {
            var source = await client.GetStringAsync($"/js/{file}");
            foreach (var forbidden in new[] { "fetch(", "XMLHttpRequest", "localStorage", "sessionStorage", "document.cookie", "location.", "innerHTML", ".submit(" })
                Assert.DoesNotContain(forbidden, source);
        }
    }

    private sealed class PreferenceComparer : IEqualityComparer<LensFinderPreference>
    {
        public bool Equals(LensFinderPreference? x, LensFinderPreference? y) => x is not null && y is not null
            && x.Id == y.Id && x.Need == y.Need && x.Label == y.Label && x.Slugs.SequenceEqual(y.Slugs);
        public int GetHashCode(LensFinderPreference obj) => obj.Id.GetHashCode(StringComparison.Ordinal);
    }

    [Fact]
    public void InvalidOrIncompleteConfigurationCannotAlterTheCatalog()
    {
        var config = Config;
        var invalid = new[] {
            config with { Products = config.Products.Skip(1).ToArray() },
            config with { Products = [.. config.Products, config.Products[0]] },
            config with { Products = [config.Products[0] with { Slug = "../unknown" }, .. config.Products.Skip(1)] },
            config with { Products = [config.Products[0] with { Need = "unsure" }, .. config.Products.Skip(1)] },
            config with { Needs = [.. config.Needs, config.Needs[0]] },
            config with { Preferences = [config.Preferences[0] with { Slugs = ["office"] }, .. config.Preferences.Skip(1)] },
            config with { Preferences = [.. config.Preferences, config.Preferences[0]] },
            config with { Compact = config.Compact with { Replacements = [new("precisa", "office")] } }
        };
        foreach (var candidate in invalid) Assert.Throws<InvalidDataException>(() => candidate.Project(Names));
    }

    [Fact]
    public void RazorJsonHelperEscapesMarkupWithoutLosingSourceText()
    {
        const string hostile = "</script><img src=x onerror=alert(1)> & \"texto\"";
        var page = Config.Project(Names) with { Notice = hostile };
        using var scope = factory.Services.CreateScope();
        var helper = scope.ServiceProvider.GetRequiredService<IJsonHelper>();
        using var writer = new StringWriter();
        helper.Serialize(page).WriteTo(writer, System.Text.Encodings.Web.HtmlEncoder.Default);
        var json = writer.ToString();
        Assert.DoesNotContain("</script>", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("<img", json, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(hostile, JsonDocument.Parse(json).RootElement.GetProperty("notice").GetString());
    }
}
