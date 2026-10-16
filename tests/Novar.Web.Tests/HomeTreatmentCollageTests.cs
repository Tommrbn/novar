using System.Net;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Novar.Web.Tests;

public sealed class HomeTreatmentCollageTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task CollagePreservesThreeImagesInReadingOrderAndFixedPills()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/"));
        var collage = Regex.Match(html, "<div class=\"treatment-collage\"[\\s\\S]*?</div>").Value;
        var photos = Regex.Matches(collage, "<img class=\"collage-(main|child|sport)\"[^>]*>");
        Assert.Equal(3, photos.Count);
        Assert.Contains("/media/figma/2cc9c.png", photos[0].Value);
        Assert.Contains("/media/figma/65071.png", photos[1].Value);
        Assert.Contains("/media/figma/b3aff.png", photos[2].Value);
        Assert.Contains("width=\"367\" height=\"586\" loading=\"lazy\"", photos[0].Value);
        Assert.Contains("width=\"249\" height=\"208\" loading=\"lazy\"", photos[1].Value);
        Assert.Contains("width=\"249\" height=\"260\" loading=\"lazy\"", photos[2].Value);
        foreach (var text in new[] { "Confort Visual", "Conducción", "Protección para pantallas", "Para Exterior" })
            Assert.Contains(text, collage);
        Assert.DoesNotContain("aria-live", collage);
        Assert.DoesNotContain("aria-hidden=\"true\" loading", collage);
        Assert.Matches("<button class=\"collage-motion-toggle\" type=\"button\" aria-controls=\"home-treatment-collage\" hidden>", collage);
        Assert.Contains("href=\"/tratamientos\" data-figma-node=\"889:1764\"", html);
    }

    [Theory]
    [InlineData("es", "Pausar imágenes", "Reanudar imágenes")]
    [InlineData("en", "Pause images", "Resume images")]
    [InlineData("pt-BR", "Pausar imagens", "Retomar imagens")]
    public async Task ControlLabelsFollowRequestCulture(string culture, string pause, string resume)
    {
        using var localized = factory.CreateClient();
        localized.DefaultRequestHeaders.AcceptLanguage.ParseAdd(culture);
        var html = WebUtility.HtmlDecode(await localized.GetStringAsync("/"));
        Assert.Contains($"data-pause-label=\"{pause}\" data-resume-label=\"{resume}\"", html);
        Assert.Contains($"aria-controls=\"home-treatment-collage\" hidden>{pause}</button>", html);
    }

    [Theory]
    [InlineData("/", true)]
    [InlineData("/tratamientos", false)]
    [InlineData("/lentes/first", false)]
    public async Task ScriptIsHomeOnlyWithCacheVersionAndDefer(string route, bool included)
    {
        var html = await client.GetStringAsync(route);
        Assert.Equal(included, html.Contains("/js/home-treatment-collage.js?v="));
        if (included)
        {
            Assert.Matches("<script src=\"/js/home-treatment-collage.js\\?v=[^\"]+\" defer></script>", html);
            Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/js/home-treatment-collage.js")).StatusCode);
        }
    }

    [Fact]
    public async Task StaticGeometryCropsRadiiAndAccessibleControlRemainScoped()
    {
        var css = await client.GetStringAsync("/css/site.css");
        Assert.Contains(".collage-main { left: 12.832%; width: 54.13%; top: 0; height: 100%; z-index: 2; }", css);
        Assert.Contains("top: 7.679%; z-index: 1; object-position: center top;", css);
        Assert.Contains("height: 44.369%; top: 46.758%; z-index: 1;", css);
        Assert.Contains("object-fit: cover; border-radius: 38px", css);
        Assert.Contains(".treatment-collage > img { border-radius: 25px; }", css);
        Assert.Contains("min-width: 44px; min-height: 44px;", css);
        Assert.Contains(".collage-motion-toggle:focus-visible", css);
        Assert.Contains(".collage-motion-toggle[hidden] { display: none; }", css);
    }
}
