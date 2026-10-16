using System.Net;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Novar.Web.Tests;

public sealed class ProductWatermarkTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    public static TheoryData<string, string, string, string> Products()
    {
        var result = new TheoryData<string, string, string, string>();
        var products = new (string Slug, string Family, string Text)[]
        {
            ("first", "prg", "first"), ("precisa", "prg", "precisa"),
            ("precisa-short", "prg", "precisa\nshort"), ("evolution", "prg", "evolution"),
            ("evolution-short", "prg", "evolution\nshort"), ("elife", "prg", "eLIFE"),
            ("geo", "mono", "geo"), ("single-vision", "mono", "single\nvision"),
            ("outdoor", "mono", "outdoor"), ("indoor", "mono", "indoor"), ("slim", "mono", "slim"),
            ("kriptok-blended", "bop", "kriprok\nblended"), ("ultex-blended", "bop", "ultex\nblended"),
            ("freeline", "bop", "freeline"), ("office", "bop", "Office")
        };
        foreach (var p in products)
        foreach (var culture in new[] { "es", "en", "pt-BR" })
            result.Add(p.Slug, p.Family, p.Text, culture);
        return result;
    }

    [Theory]
    [MemberData(nameof(Products))]
    public async Task DecorativeNamesKeepFigmaCaseAndLinesWithoutEnteringTheAccessibilityTree(
        string slug, string family, string text, string culture)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/lentes/{slug}");
        request.Headers.AcceptLanguage.ParseAdd(culture);
        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var html = WebUtility.HtmlDecode(await response.Content.ReadAsStringAsync()).Replace("\r\n", "\n");
        Assert.Contains($"<span class=\"{family}-watermark\" aria-hidden=\"true\">{text}</span>", html);
        Assert.Contains("/css/product-presentation.css?v=", html);
    }

    [Fact]
    public async Task LetteringUsesOneCrispFivePercentGradientAndPerProductFigmaGeometry()
    {
        var css = await client.GetStringAsync("/css/product-presentation.css");
        var shared = Regex.Match(css, @":is\(\.prg-watermark, \.mono-watermark, \.bop-watermark\)\s*\{[^}]+\}").Value;
        Assert.Contains("font-family: Poppins, sans-serif", shared);
        Assert.Contains("font-weight: 400", shared);
        Assert.Contains("letter-spacing: -.03em", shared);
        Assert.Contains("rgb(31 2 60 / 5%), rgb(123 123 128 / 5%)", shared);
        Assert.Contains("left: calc(50% - 720px + var(--watermark-x))", shared);
        Assert.Contains("padding-block: .5em", shared);
        Assert.Contains("pointer-events: none", shared);
        Assert.Contains("white-space: pre", shared);
        Assert.DoesNotContain("filter:", shared);
        Assert.Equal(15, Regex.Matches(css, @"--watermark-x:\s*[\d.]+px;").Count);
        Assert.Contains("--watermark-size: 220px", css); // Single Vision is not 280px.
        Assert.Contains("--watermark-line: 235px", css); // Precisa Short differs from Evolution Short.
        Assert.Contains("--watermark-line: 246px", css);
        Assert.Contains("--watermark-line: 261px", css);
        Assert.Equal(4, Regex.Matches(css, "--watermark-size: 200px").Count);
        Assert.Contains("font-size: clamp(64px, 19vw, 140px)", css);
        Assert.Contains("@media (forced-colors: active)", css);
        foreach (var file in new[] { "progressive-products", "monofocal-products", "bifocal-occupational-products" })
            Assert.DoesNotContain("-watermark", await client.GetStringAsync($"/css/{file}.css"));
    }

    [Fact]
    public async Task ExistingLocalRegularFontIsAvailableAndHomeDoesNotLoadProductLettering()
    {
        var font = await client.GetByteArrayAsync("/fonts/poppins/Poppins-Regular.ttf");
        Assert.True(font.Length > 10000);
        var home = await client.GetStringAsync("/");
        Assert.DoesNotContain("/css/product-presentation.css", home);
    }
}
