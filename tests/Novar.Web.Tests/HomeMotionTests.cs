using System.Net;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Novar.Web.Tests;

public sealed class HomeMotionTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task HomeHasExactReadableSophiaQuestionsAndOnlyFourthInitiallySelected()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/"));
        var list = Regex.Match(html, "<ul class=\"sophia-question-list\"[\\s\\S]*?</ul>").Value;
        var items = Regex.Matches(list, "<li[^>]*>(.*?)</li>");
        var expected = new[] {
            "¿Qué hacer si tengo molestias?",
            "¿Qué test visuales puedo realizar como orientación?",
            "¿Cómo leer mi receta?",
            "¿Qué lentes necesito?",
            "¿Cómo controlar la miopía?",
            "¿Cómo adaptarme a mis lentes?",
            "¿Cómo conocer el estado de un pedido?"
        };
        Assert.Equal(expected, items.Select(item => item.Groups[1].Value));
        Assert.Single(Regex.Matches(list, "class=\"selected\""));
        Assert.Contains("class=\"selected\" data-figma-node=\"889:1446\"", items[3].Value);
        Assert.DoesNotContain("aria-hidden", list);
        Assert.DoesNotContain("Pregunta IV", html);
        Assert.Contains("data-home-motion-revision=\"home-motion-v1\"", html);
        Assert.Contains("data-home-revision=\"home-fidelity-v2\"", html);
        Assert.Contains("data-pending=\"Sophia\"", html);
        Assert.DoesNotContain("aria-live=\"assertive\"", html);
    }

    [Fact]
    public async Task HomeKeepsAHiddenDefaultPauseControlAndOneOriginalMarker()
    {
        var html = await client.GetStringAsync("/");
        Assert.Matches("<button class=\"sophia-motion-toggle\"[^>]+type=\"button\"[^>]+aria-controls=\"sophia-question-list\"[^>]+hidden", html);
        Assert.Contains("Pausar preguntas</button>", html);
        Assert.Single(Regex.Matches(html, "/media/figma/539c7.svg"));
        Assert.Contains("width=\"34.1358\" height=\"29.5625\"", html);
        var marker = await client.GetAsync("/media/figma/539c7.svg");
        Assert.Equal(HttpStatusCode.OK, marker.StatusCode);
        Assert.Contains("width=\"34.1358\" height=\"29.5625\"", await marker.Content.ReadAsStringAsync());
    }

    [Theory]
    [InlineData("/", true)]
    [InlineData("/lentes/first", false)]
    [InlineData("/lentes", false)]
    [InlineData("/sobre-nosotros", false)]
    [InlineData("/juegos", false)]
    [InlineData("/tratamientos", false)]
    public async Task MotionScriptIsLocalAndExclusiveToHome(string path, bool expected)
    {
        var html = await client.GetStringAsync(path);
        Assert.Equal(expected, html.Contains("/js/home.js?v="));
        if (expected)
        {
            Assert.Matches("<script src=\"/js/home.js\\?v=[^\"]+\" defer></script>", html);
            Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/js/home.js")).StatusCode);
        }
    }
}
