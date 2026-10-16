using System.Net;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Novar.Web.Services;

namespace Novar.Web.Tests;

public sealed class GamesTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task GamesSelectionKeepsAccessibleStaticDefaultAndLoadsControllerFirst()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/juegos"));
        Assert.Contains("data-featured-label=\"Destacado\"", html);
        Assert.Single(Regex.Matches(html, "class=\"game-card game-card-featured\""));
        Assert.Matches("data-game-card=\"intruso\"[^>]*aria-pressed=\"true\"[^>]*disabled", html);
        Assert.Equal(2, Regex.Matches(html, "data-game-card=\"(?:codigo|trivia)\"[^>]*aria-pressed=\"false\"[^>]*disabled").Count);
        Assert.True(html.IndexOf("/js/games-selection.js", StringComparison.Ordinal) < html.IndexOf("/js/games.js", StringComparison.Ordinal));
        Assert.Contains("<noscript>", html);
        var css = await client.GetStringAsync("/css/games.css");
        Assert.Contains(".game-art-intruso .game-dot { background: #a78bca; }", css);
        Assert.DoesNotContain(".game-card-featured .game-dot {", css);
        var selection = await client.GetStringAsync("/js/games-selection.js");
        Assert.Contains("grid.append(entry.card)", selection);
        Assert.Contains("preventScroll: true", selection);
        foreach (var forbidden in new[] { "innerHTML", "cloneNode", "scrollIntoView", "fetch(", "localStorage", "sessionStorage" })
            Assert.DoesNotContain(forbidden, selection);
    }

    [Fact]
    public async Task GamesRendersAllOriginalCardsAndInstructionalCopy()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/juegos"));
        var content = factory.Services.GetRequiredService<SiteContent>().Games;
        Assert.Equal("961:7324", content.SourceNode);
        Assert.Contains("data-games-revision=\"games-v1\"", html);
        Assert.Equal(new[] { "codigo", "intruso", "trivia" }, content.Cards.Select(card => card.Id));
        Assert.Equal(new[] { "02/", "01/", "03/" }, content.Cards.Select(card => card.Number));
        Assert.Single(content.Cards, card => card.Featured);
        foreach (var card in content.Cards)
        {
            Assert.Contains(card.Title, html);
            Assert.Contains(card.Description, html);
            Assert.Contains(card.Badge, html);
        }
        Assert.Equal(3, content.Steps.Length);
        foreach (var step in content.Steps)
        {
            Assert.Contains(step.Title, html);
            Assert.Contains(step.Description, html);
        }
        Assert.Equal(3, Regex.Matches(html, "data-game-card=").Count);
        Assert.DoesNotContain("después de aprobar la muestra visual", html);
    }

    [Fact]
    public async Task IntrusoAndCodigoAreAccessibleLocalGamesAndTriviaKeepsItsOwnBoundary()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/juegos"));
        Assert.Contains("data-visual-games-revision=\"visual-games-v1\"", html);
        Assert.Contains("<a class=\"nav-link\" href=\"/#warranty-title\">Garantía</a>", html);
        Assert.Contains("Ronda 1 de 5", html);
        Assert.Contains("Puntaje: 0", html);
        Assert.Equal(9, Regex.Matches(html, "data-intruso-choice").Count);
        Assert.Equal(42, Regex.Matches(html, "data-codigo-dot").Count);
        Assert.Contains("aria-controls=\"codigo-panel\"", html);
        Assert.Contains("aria-controls=\"intruso-preview\"", html);
        Assert.Contains("type=\"text\" inputmode=\"numeric\" pattern=\"[0-9]\"", html);
        Assert.Contains("Desafío recreativo. El puntaje no evalúa tu visión.", html);
        Assert.DoesNotContain("data-answer=", html);
        Assert.DoesNotContain("correctIndex=", html);
        Assert.Single(Regex.Matches(html, "data-visual-game-start=\"intruso\"[^>]*disabled"));
        Assert.Single(Regex.Matches(html, "data-visual-game-start=\"codigo\"[^>]*disabled"));
        Assert.Equal(9, Regex.Matches(html, "data-intruso-choice[^>]*disabled").Count);
        Assert.Matches("id=\"codigo-answer\"[^>]*disabled", html);
        Assert.Contains("data-visual-game-panel=\"codigo\"", html);
        Assert.Matches("id=\"codigo-panel\"[^>]*hidden", html);
        Assert.DoesNotContain("data-pending=\"\"", html);
        Assert.DoesNotContain("juego pendiente de implementación", html, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("en el tiempo indicado", html);
        Assert.DoesNotContain("un análisis de tu percepción", html);
        foreach (var card in new[] { "intruso", "codigo", "trivia" })
        {
            var button = Regex.Match(html, $"<button[^>]*data-game-card=\"{card}\"[^>]*>").Value;
            Assert.NotEmpty(button);
            Assert.DoesNotContain("data-pending", button);
        }
        Assert.DoesNotContain("<form", html.WithoutLanguagePreferenceForm());
        var js = await client.GetStringAsync("/js/games.js");
        Assert.Contains("function selectPanel(id)", js);
        Assert.Contains("if (!active('codigo')", js);
        Assert.Contains("prefers-reduced-motion", js);
        foreach (var forbidden in new[] { "fetch(", "localStorage", "sessionStorage", "Math.random", "setInterval", "innerHTML" })
            Assert.DoesNotContain(forbidden, js);
        var state = await client.GetStringAsync("/js/visual-games-state.js");
        Assert.Contains("ROUND_COUNT = 5", state);
        Assert.Contains("createIntruso", state);
        Assert.Contains("createCodigo", state);
        var css = await client.GetStringAsync("/css/games.css");
        Assert.Contains("grid-template-columns: repeat(7, 20.426px)", css);
        Assert.Contains("grid-template-rows: repeat(6, 20.426px)", css);
        Assert.Contains("background: #83abe9", css);
        Assert.Contains("background: #0065ff", css);
        Assert.Contains("[data-visual-game-panel=\"intruso\"] [data-visual-feedback] { text-align: center; }", css);
        Assert.Contains("[data-visual-game-panel=\"intruso\"] [data-visual-next] { display: block; width: fit-content; margin: 4px auto 0; }", css);
        Assert.Equal(HttpStatusCode.MethodNotAllowed, (await client.PostAsync("/juegos", new StringContent(""))).StatusCode);
    }

    [Fact]
    public async Task GamesPresentationAndThinFontArePageScoped()
    {
        var html = await client.GetStringAsync("/juegos");
        Assert.Contains("<body class=\"games-page\">", html);
        Assert.Contains("/css/games.css", html);
        Assert.Contains("/js/games.js", html);
        Assert.Contains("href=\"/juegos\" aria-current=\"page\"", html);
        Assert.Contains("/media/figma/4d514.svg", html);
        Assert.DoesNotContain("about-footer", html);
        Assert.DoesNotContain("Ver muestra: Novar First", html);
        var css = await client.GetStringAsync("/css/games.css");
        Assert.Contains("Poppins-Thin.ttf", css);
        Assert.Contains("font-weight: 100", css);
        Assert.Contains("font-size: 52px", css);
        Assert.Contains("line-height: 57.2px", css);
        Assert.True((await client.GetByteArrayAsync("/fonts/poppins/Poppins-Thin.ttf")).Length > 100000);
        foreach (var path in new[] { "/", "/lentes/first", "/sobre-nosotros" })
        {
            var other = await client.GetStringAsync(path);
            Assert.DoesNotContain("/css/games.css", other);
            Assert.DoesNotContain("/js/games.js", other);
            Assert.DoesNotContain("games-footer", other);
            Assert.DoesNotContain("/media/figma/4d514.svg", other);
        }
    }

    [Fact]
    public async Task GamesUsesAllOriginalSvgAssetsWithoutRootDimensionOverrides()
    {
        var dimensions = new Dictionary<string, (string Width, string Height)>
        {
            ["c5011.svg"] = ("31.7764", "29.7082"),
            ["6231f.svg"] = ("984.302", "556.302"),
            ["4d514.svg"] = ("91", "15.1665"),
            ["4fa2a.svg"] = ("22.3059", "18.2378"),
            ["f87fc.svg"] = ("22.923", "18.4942"),
            ["97fd8.svg"] = ("22.0033", "18.7179"),
            ["dabcc.svg"] = ("21.9854", "18.5251"),
            ["e27ca.svg"] = ("18.2751", "18.2783"),
            ["c8445.svg"] = ("17.1763", "17.1763"),
            ["fa384.svg"] = ("17.1704", "17.1746"),
            ["9daba.svg"] = ("17.1763", "17.1763"),
            ["e3672.svg"] = ("24.4617", "17.1758"),
            ["ba1ea.svg"] = ("12.0696", "12.0696")
        };
        var html = await client.GetStringAsync("/juegos");
        foreach (var (asset, size) in dimensions)
        {
            var tag = Regex.Match(html, $"<img[^>]*src=\"/media/figma/{Regex.Escape(asset)}\"[^>]*>").Value;
            Assert.NotEmpty(tag);
            Assert.DoesNotContain("width=", tag);
            Assert.DoesNotContain("height=", tag);
            var root = XDocument.Parse(await client.GetStringAsync($"/media/figma/{asset}")).Root!;
            Assert.Equal(size.Width, root.Attribute("width")?.Value);
            Assert.Equal(size.Height, root.Attribute("height")?.Value);
        }
        Assert.Equal(125, Regex.Matches(html, "class=\"game-dot(?: |\")").Count);
        Assert.Single(Regex.Matches(html, "class=\"game-star\""));
        Assert.Equal(9, Regex.Matches(html, "data-intruso-choice").Count);
        Assert.Equal(42, Regex.Matches(html, "data-codigo-dot").Count);
        Assert.DoesNotContain("figma.com/api", html + await client.GetStringAsync("/css/games.css"));
    }
}
