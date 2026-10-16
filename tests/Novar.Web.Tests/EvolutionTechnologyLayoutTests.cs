using System.Globalization;
using System.Net;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Novar.Web.Services;

namespace Novar.Web.Tests;

public sealed class EvolutionTechnologyLayoutTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Theory]
    [InlineData("es")]
    [InlineData("en")]
    [InlineData("pt-BR")]
    public async Task CenteredEvolutionGroupKeepsAllThreeOriginalTechnologiesAndWatermark(string culture)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/lentes/evolution");
        request.Headers.AcceptLanguage.ParseAdd(culture);
        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var html = WebUtility.HtmlDecode(await response.Content.ReadAsStringAsync());
        Assert.Contains("progressive-product--evolution", html);
        var section = Regex.Match(html, "<section class=\"prg-technologies\"[\\s\\S]*?</section>").Value;
        Assert.Equal(3, Regex.Matches(section, "class=\"prg-technology-card\"").Count);
        Assert.Contains("class=\"prg-watermark\" aria-hidden=\"true\">evolution</span>", section);
        var content = factory.Services.GetRequiredService<SiteContent>().ForCulture(CultureInfo.GetCultureInfo(culture));
        foreach (var technology in content.ProgressiveProducts["evolution"].Technologies)
        {
            Assert.Contains(technology.Name, section);
            Assert.Contains(technology.Description, section);
        }
    }

    [Fact]
    public async Task GridAndStackAreScopedToEvolutionWithoutChangingTheDefaultRail()
    {
        var css = await client.GetStringAsync("/css/progressive-products.css");
        var grid = Regex.Match(css, @"\.progressive-product--evolution \.prg-technology-scroll\s*\{[^}]+\}").Value;
        Assert.Contains("display: grid", grid);
        Assert.Contains("grid-template-columns: repeat(3, minmax(0, 1fr))", grid);
        Assert.Contains("width: min(1264px, calc(100% - 48px))", grid);
        Assert.Contains("margin-inline: auto", grid);
        Assert.Contains("overflow: visible", grid);
        Assert.Contains("scroll-snap-type: none", grid);
        Assert.Matches(@"@media \(max-width: 999px\)\s*\{\s*\.progressive-product--evolution \.prg-technology-scroll\s*\{\s*grid-template-columns: minmax\(0, 1fr\);", css);
        var defaultRail = Regex.Match(css, @"(?m)^\.prg-technology-scroll\s*\{[^}]+\}").Value;
        Assert.Contains("display: flex", defaultRail);
        Assert.Contains("overflow-x: auto", defaultRail);
        Assert.DoesNotContain("display: grid", defaultRail);
        Assert.DoesNotMatch(@"\.progressive-product--evolution-short \.prg-technology-scroll\s*\{[^}]*display: grid", css);
    }
}
