using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Novar.Web.Tests;

public sealed class MonofocalGalleryRefinementTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Theory]
    [InlineData("es")]
    [InlineData("en")]
    [InlineData("pt-BR")]
    public async Task EveryMonofocalUsesItsSourceGalleryAndTheFourSourceRelatedPortraits(string culture)
    {
        using var manifest = JsonDocument.Parse(File.ReadAllText(Path.Combine(FindRoot(), "docs", "asset-provenance.json")));
        var slots = manifest.RootElement.GetProperty("monofocalAssetVerification").GetProperty("slots").EnumerateArray().ToArray();
        foreach (var slug in new[] { "geo", "single-vision", "outdoor", "indoor", "slim" })
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, $"/lentes/{slug}");
            request.Headers.AcceptLanguage.ParseAdd(culture);
            var response = await client.SendAsync(request);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var rawHtml = await response.Content.ReadAsStringAsync();
            var html = WebUtility.HtmlDecode(rawHtml);
            var gallery = Regex.Match(html, "<section class=\"mono-gallery\"[\\s\\S]*?</section>").Value;
            var expectedGallery = slots.Where(slot => slot.GetProperty("slug").GetString() == slug && slot.GetProperty("slot").GetString() == "portrait gallery")
                .Select(slot => slot.GetProperty("file").GetString()).ToArray();
            Assert.Equal(expectedGallery, Regex.Matches(gallery, "data-gallery-image=\"([^\"]+)\"").Select(match => match.Groups[1].Value));
            Assert.Contains("data-product-gallery", gallery);
            Assert.Contains("data-gallery-pause", gallery);
            Assert.Single(Regex.Matches(html, "/js/progressive-gallery\\.js"));
            var related = Regex.Match(html, "<section class=\"mono-related\"[\\s\\S]*?</section>").Value;
            Assert.Contains("data-monofocal-related=\"portraits-v2\"", related);
            var cards = Regex.Matches(related, "<a href=\"/lentes/([^\"]+)\"[^>]*data-figma-node=\"([^\"]+)\"[^>]*data-related-cta=\"([^\"]+)\"[^>]*><img src=\"/media/figma/([^\"]+)\"[^>]*><span[^>]*>([^<]+)</span></a>");
            Assert.Equal(new[] { "outdoor", "single-vision", "slim", "indoor" }, cards.Select(card => card.Groups[1].Value));
            Assert.Equal(new[] { "07444.png", "0b636.png", "a62fc.png", "590b1.png" }, cards.Select(card => card.Groups[4].Value));
            foreach (Match card in cards)
            {
                Assert.Contains(slots, slot => slot.GetProperty("slug").GetString() == slug && slot.GetProperty("slot").GetString() == "related tile"
                    && slot.GetProperty("sourceNode").GetString() == card.Groups[2].Value && slot.GetProperty("file").GetString() == card.Groups[4].Value);
                Assert.NotEmpty(card.Groups[3].Value); // Localized hover CTA.
                Assert.NotEmpty(card.Groups[5].Value); // Accessible link name even when the overlay is hidden.
            }
            var evidence = Environment.GetEnvironmentVariable("NOVAR_MONOFOCAL_EVIDENCE_DIR");
            if (!string.IsNullOrEmpty(evidence))
            {
                Directory.CreateDirectory(evidence);
                await File.WriteAllTextAsync(Path.Combine(evidence, $"{slug}-{culture}.html"), rawHtml);
            }
        }
    }

    [Fact]
    public async Task CenteringAndSourceCropsAreSharedWithoutOverridingTheHoverEffect()
    {
        var css = await client.GetStringAsync("/css/monofocal-products.css");
        Assert.Contains("margin: -33.754px 0 0", css);
        Assert.DoesNotContain("margin: -33.754px auto", css);
        Assert.Matches(@"\.mono-related-images \{ width: 100%; display: grid;", css);
        Assert.Contains("aspect-ratio: 370 / 286", css);
        Assert.Contains("[data-related-product=\"outdoor\"] img", css);
        Assert.Contains("[data-related-product=\"single-vision\"] img", css);
        Assert.Contains("[data-gallery-image=\"bef02.png\"] img", css);
        Assert.Contains("[data-gallery-image=\"1bc17.png\"] img", css);
        Assert.DoesNotContain("div:last-child img", css);
        var shared = await client.GetStringAsync("/css/product-presentation.css");
        Assert.Contains("[data-related-cta]:is(:hover, :focus-visible)", shared);
        Assert.Contains("@media (hover: none), (pointer: coarse)", shared);
        Assert.Contains("@media (prefers-reduced-motion: reduce)", shared);
        Assert.DoesNotContain(".monofocal-product:not(.monofocal-product--geo)", shared);
    }

    private static string FindRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "Novar.sln"))) directory = directory.Parent;
        return directory?.FullName ?? throw new DirectoryNotFoundException("Novar.sln was not found.");
    }
}
