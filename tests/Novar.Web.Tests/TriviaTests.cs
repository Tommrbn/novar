using System.Net;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Novar.Web.Services;

namespace Novar.Web.Tests;

public sealed class TriviaTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public void TriviaBankPreservesTheTenSuppliedQuestionsOptionsAndKey()
    {
        var trivia = factory.Services.GetRequiredService<SiteContent>().Games.Trivia;
        var expected = new (string Question, string[] Options, int Correct)[]
        {
            ("¿Cuántas veces parpadeamos aproximadamente por minuto?", ["2–5 veces", "10–20 veces", "30–40 veces", "Más de 60 veces"], 1),
            ("Cuando mirás una pantalla durante mucho tiempo, ¿qué suele pasar con tu parpadeo?", ["Aumenta muchísimo", "Disminuye", "No cambia", "Dejamos de parpadear por completo"], 1),
            ("¿Qué parte del ojo determina principalmente su color?", ["La retina", "La córnea", "El iris", "La pupila"], 2),
            ("¿La pupila es realmente una parte negra del ojo?", ["Sí, es un tejido negro", "No, es una abertura por donde entra la luz", "Es un músculo", "Es parte de la retina"], 1),
            ("¿Qué color de ojos suele ser más sensible al deslumbramiento?", ["Los ojos claros", "Los ojos oscuros", "Los verdes exclusivamente", "El color no influye en absoluto"], 0),
            ("¿Qué hábito está asociado con un menor riesgo de desarrollar/progresar miopía durante la infancia?", ["Leer con poca luz", "Pasar más tiempo al aire libre", "Usar el celular con brillo bajo", "Usar anteojos de sol dentro de casa"], 1),
            ("¿Qué hace tu pupila cuando entrás a un lugar oscuro?", ["Se hace más pequeña", "Se dilata", "Cambia de color", "No cambia"], 1),
            ("¿Cuál de estas cosas puede contribuir a la fatiga visual frente a una pantalla?", ["Mirar de cerca durante mucho tiempo", "Parpadear menos", "No hacer pausas visuales", "Todas las anteriores"], 3),
            ("Si ves perfecto de lejos, ¿significa que tu visión está 100% perfecta?", ["Sí", "No necesariamente", "Solo si tenés menos de 40 años", "Sí, siempre que no uses anteojos"], 1),
            ("BONUS: ¿Qué porcentaje de la información que recibimos del entorno suele decirse que llega a través de la visión?", ["10%", "30%", "50%", "Esta pregunta es una trampa: no existe un porcentaje universal científicamente establecido"], 3)
        };
        Assert.Equal(expected.Length, trivia.Questions.Length);
        for (var index = 0; index < expected.Length; index++)
        {
            Assert.Equal(expected[index].Question, trivia.Questions[index].Question);
            Assert.Equal(expected[index].Options, trivia.Questions[index].Options);
            Assert.Equal(expected[index].Correct, trivia.Questions[index].CorrectIndex);
        }
    }

    [Fact]
    public async Task TriviaMarkupHasLabeledNativeOptionsAndSafeDefaultState()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/juegos"));
        var trivia = factory.Services.GetRequiredService<SiteContent>().Games.Trivia;
        Assert.Contains("data-trivia-revision=\"trivia-v1\"", html);
        Assert.Contains("id=\"trivia-panel\" hidden", html);
        Assert.Contains("data-games-revision=\"games-v1\"", html);
        var groups = Regex.Matches(html, "<fieldset class=\"trivia-question\"[\\s\\S]*?</fieldset>");
        Assert.Equal(10, groups.Count);
        for (var index = 0; index < groups.Count; index++)
        {
            var group = groups[index].Value;
            Assert.Contains($"data-correct-index=\"{trivia.Questions[index].CorrectIndex}\" hidden", group);
            Assert.Contains($"<legend tabindex=\"-1\">{trivia.Questions[index].Question}</legend>", group);
            Assert.Equal(4, Regex.Matches(group, "type=\"radio\"").Count);
            Assert.Equal(4, Regex.Matches(group, $"name=\"trivia-question-{index}\"").Count);
            for (var option = 0; option < 4; option++)
            {
                Assert.Contains($"for=\"trivia-{index}-{option}\"", group);
                Assert.Contains($"id=\"trivia-{index}-{option}\"", group);
                Assert.Contains(trivia.Questions[index].Options[option], group);
            }
        }
        Assert.Contains("role=\"status\" aria-live=\"polite\" aria-atomic=\"true\"", html);
        Assert.Contains("id=\"trivia-check\" type=\"button\" class=\"btn btn-novar\" disabled", html);
        Assert.Matches("data-trivia-start[^>]*disabled", html);
        Assert.Contains("Activá JavaScript para responder la Trivia", html);
        Assert.DoesNotContain("<form", html);
        Assert.Contains("no evalúan tu visión ni reemplazan una consulta profesional", html);
    }

    [Fact]
    public async Task TriviaScriptsAreLocalPageScopedAndUseNoTransportOrStorage()
    {
        var games = await client.GetStringAsync("/juegos");
        Assert.Contains("/js/trivia-state.js", games);
        Assert.True(games.IndexOf("/js/trivia-state.js", StringComparison.Ordinal) < games.IndexOf("/js/games.js", StringComparison.Ordinal));
        var state = await client.GetStringAsync("/js/trivia-state.js");
        var ui = await client.GetStringAsync("/js/games.js");
        foreach (var forbidden in new[] { "fetch(", "XMLHttpRequest", "localStorage", "sessionStorage", "document.cookie", "innerHTML", "setInterval", "Math.random" })
            Assert.DoesNotContain(forbidden, ui + state);
        Assert.Contains("textContent", ui);
        Assert.Contains("triviaPanel.hidden = true", ui);
        Assert.Contains("intruso.hidden = true", ui);
        Assert.Contains("if (!game.check()) return", ui);
        Assert.Contains("if (!game.next()) return", ui);
        foreach (var route in new[] { "/", "/lentes/first", "/sobre-nosotros", "/tratamientos" })
        {
            var html = await client.GetStringAsync(route);
            Assert.DoesNotContain("/js/trivia-state.js", html);
            Assert.DoesNotContain("trivia-panel", html);
        }
    }
}
