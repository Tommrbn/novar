using System.Net;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Novar.Web.Tests;

public sealed class HomeRefinementTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task TestimonialsPreserveThreeOriginalCardsAndOnlySuppliedQuoteAndStars()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/"));
        var section = Regex.Match(html, "<section class=\"testimonials[\\s\\S]*?</section>").Value;
        var cards = Regex.Matches(section, "<blockquote[^>]*>[\\s\\S]*?</blockquote>");
        Assert.Equal(3, cards.Count);
        Assert.Contains("Marcos G.</p><footer>Progresivo · Evolution</footer>", cards[0].Value);
        Assert.Contains("Hernán Darío</p><footer>Monofocal · Novar</footer>", cards[1].Value);
        Assert.Contains("Valentina R.</p><footer>Progresivo · eLIFE</footer>", cards[2].Value);
        Assert.Single(Regex.Matches(section, "<q>"));
        Assert.Contains("<q>Son los mejores, por eso no los cambio por nada.</q>", cards[1].Value);
        Assert.Equal(3, Regex.Matches(cards[1].Value, "/media/figma/1e0d2.svg").Count);
        Assert.DoesNotContain("quote-stars", cards[0].Value + cards[2].Value);
        Assert.DoesNotContain("data-pending", section);
        Assert.Contains("data-home-refinements-revision=\"home-refinements-v1\"", section);
        Assert.Contains("data-home-motion-revision=\"home-motion-v1\"", html);
        Assert.Contains("data-home-annotations-revision=\"home-annotations-v1\"", html);
        Assert.Contains("data-home-revision=\"home-fidelity-v2\"", html);
    }

    [Fact]
    public async Task TestimonialsHaveAccessibleProgressiveEnhancementControls()
    {
        var html = await client.GetStringAsync("/");
        Assert.Contains("class=\"testimonial-controls\" hidden", html);
        Assert.Contains("data-testimonial-previous aria-controls=\"testimonial-list\" aria-label=\"Experiencia anterior\"", html);
        Assert.Contains("data-testimonial-next aria-controls=\"testimonial-list\" aria-label=\"Experiencia siguiente\"", html);
        Assert.Contains("aria-pressed=\"false\">Pausar experiencias</button>", html);
        Assert.Contains("data-testimonial-status aria-live=\"polite\" aria-atomic=\"true\"", html);
        var list = Regex.Match(html, "<div class=\"testimonial-grid\"[\\s\\S]*?</blockquote>\\s*</div>").Value;
        Assert.NotEmpty(list);
        Assert.DoesNotContain("<blockquote hidden", list);
        Assert.DoesNotContain("<blockquote aria-hidden", list);
    }

    [Theory]
    [InlineData("/", true)]
    [InlineData("/lentes/first", false)]
    [InlineData("/lentes", false)]
    [InlineData("/sobre-nosotros", false)]
    [InlineData("/juegos", false)]
    [InlineData("/tratamientos", false)]
    public async Task DedicatedTestimonialScriptIsServedOnlyOnHome(string path, bool expected)
    {
        var html = await client.GetStringAsync(path);
        Assert.Equal(expected, html.Contains("/js/testimonials.js?v="));
        if (expected)
        {
            Assert.Matches("<script src=\"/js/testimonials.js\\?v=[^\"]+\" defer></script>", html);
            Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/js/testimonials.js")).StatusCode);
        }
    }

    [Fact]
    public async Task WorldCtaFollowsStatisticsAndUsesOriginalNativeArrow()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/"));
        Assert.Matches("<dl class=\"world-stats\">[\\s\\S]*?</dl>\\s*<a class=\"world-cta\" href=\"/sobre-nosotros\" data-figma-node=\"1126:232\">Conocé más<img src=\"/media/figma/e3b22.svg\" alt=\"\" width=\"15\" height=\"15\" /></a>", html);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/sobre-nosotros")).StatusCode);
        var bytes = await client.GetByteArrayAsync("/media/figma/e3b22.svg");
        Assert.Equal(457, bytes.Length);
        Assert.Equal("326D18CC868437CF1120336FA4B0FE71D6C81E5E71681966B495DC0B98D2EE25", Convert.ToHexString(SHA256.HashData(bytes)));
    }

    [Fact]
    public async Task ScopedStylesKeepExactCtaAndLayeredGradientWithoutClippingCollage()
    {
        var css = await client.GetStringAsync("/css/site.css");
        var cta = Regex.Match(css, @"\.world-cta \{[^}]+\}").Value;
        Assert.Contains("width: 173px; height: 48px", cta);
        Assert.Contains("padding: 14px 28px", cta);
        Assert.Contains("gap: 12px", cta);
        Assert.Contains("background: #1f023c; color: #fff", cta);
        Assert.Contains("font: 400 14px/20px Poppins", cta);
        Assert.Contains("linear-gradient(180deg, #CACACA 0%, #F9F8FB 100%)", css);
        Assert.Contains("height: 65.1%; transform: rotate(180deg)", css);
        Assert.DoesNotContain("border-radius:", Regex.Match(css, @"\.home-treatments::before \{[^}]+\}").Value);
        Assert.Contains("top: calc(65.1% - 2px); bottom: 0", css);
        foreach (Match rule in Regex.Matches(css, @"\.home-treatments[^{}]*\{[^}]+\}"))
        {
            Assert.DoesNotContain("overflow:", rule.Value);
            Assert.DoesNotContain("box-shadow:", rule.Value);
            Assert.DoesNotContain("url(", rule.Value);
        }
        Assert.DoesNotContain(".testimonial-side { display: none; }", css);
        Assert.DoesNotContain(".testimonial-side:last-child { display: none; }", css);
        Assert.Contains(".testimonial-controls[hidden]", css);
    }

    [Fact]
    public async Task HomeAnnotationLinksAndWorldEyebrowKeepTheirAuthorizedDestinationsAndSemantics()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/"));
        Assert.Contains("data-home-annotations-revision=\"home-annotations-v1\"", html);
        Assert.Contains("<a class=\"hero-next\" href=\"#encontra\" aria-label=\"Descubrir los lentes\"><img src=\"/media/figma/9e5ee.svg\" alt=\"\" width=\"36\" height=\"18\" /></a>", html);
        Assert.Contains("<a class=\"card-cta myofix-card-link\" href=\"https://www.novarmyofix.com/\" aria-label=\"Descubrí más sobre MyoFix\">", html);
        Assert.Single(Regex.Matches(html, "https://www\\.novarmyofix\\.com/"));
        Assert.DoesNotContain("Muestra para revisión: conocé Novar First", html);

        var world = Regex.Match(html, "<section class=\"world-section\"[\\s\\S]*?</section>").Value;
        Assert.Contains("<p class=\"world-about eyebrow\" data-figma-node=\"889:1697\">Conocenos</p>", world);
        Assert.DoesNotContain("<a class=\"world-about\"", world);
        var eyebrowIndex = world.IndexOf("<p class=\"world-about eyebrow\"", StringComparison.Ordinal);
        var headingIndex = world.IndexOf("<h2 id=\"world-title\"", StringComparison.Ordinal);
        Assert.True(eyebrowIndex >= 0 && headingIndex > eyebrowIndex, "The non-link World eyebrow must precede its heading.");
        Assert.Matches("<dl class=\"world-stats\">[\\s\\S]*?</dl>\\s*<a class=\"world-cta\" href=\"/sobre-nosotros\"", world);

        var css = await client.GetStringAsync("/css/site.css");
        Assert.Contains(".myofix-card-link::before { content: \"\"; position: absolute; inset: 0; }", css);
        var eyebrow = Regex.Match(css, @"\.world-section\s+\.world-about\s*\{[^}]+\}").Value;
        Assert.NotEmpty(eyebrow);
        Assert.Contains("font-size: 18.847px", eyebrow);
        Assert.Contains("font-weight: 400", eyebrow);
        Assert.Contains("line-height: 28px", eyebrow);
        Assert.Contains("letter-spacing: normal", eyebrow);
        Assert.Contains("text-transform: none", eyebrow);
        Assert.DoesNotContain("border:", eyebrow);
        Assert.DoesNotContain("background:", eyebrow);
        Assert.DoesNotContain("min-height:", eyebrow);
    }

    [Fact]
    public async Task HomeFaqUsesExactSuppliedAnswersAndPremiumQuestionTypographyDoesNotCollapse()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/"));
        var expected = new[]
        {
            ("¿Por qué me cuesta ver de cerca con el paso del tiempo?", "Con los años, enfocar de cerca puede volverse más difícil. Es un proceso natural llamado presbicia y existen lentes diseñados para recuperar comodidad y nitidez."),
            ("¿Por qué veo peor de noche o me molestan las luces?", "Con poca luz, algunas dificultades visuales pueden hacerse más evidentes. Un lente adecuado puede ayudar a mejorar la claridad, el contraste y el confort visual."),
            ("¿Los lentes pueden hacer algo más que corregir la visión?", "Sí. Hoy existen lentes diseñados para distintas necesidades: mejorar el confort, optimizar la visión a diferentes distancias o acompañar necesidades visuales específicas."),
            ("¿Qué pasa si uso lentes sin receta o mal graduados?", "Una graduación incorrecta puede generar visión borrosa, cansancio o incomodidad. Por eso es importante contar con una receta actualizada y el asesoramiento de un profesional."),
            ("¿Es normal que los chicos necesiten lentes?", "Sí. Algunas dificultades visuales pueden aparecer durante la infancia. Detectarlas a tiempo permite encontrar la solución adecuada y acompañar su desarrollo visual.")
        };
        foreach (var (question, answer) in expected)
        {
            Assert.Contains(question, html);
            Assert.Contains(answer, html);
        }

        var premiumCss = await client.GetStringAsync("/css/premium.css");
        var expanded = Regex.Match(premiumCss, @"\.premium-faq \.accordion-button:not\(\.collapsed\)\s*\{[^}]+\}").Value;
        Assert.Contains("min-height: 68px", expanded);
        Assert.Contains("padding: 18px 24px", expanded);
        Assert.Contains("font-size: 16px", expanded);
        Assert.Contains("font-weight: 400", expanded);
        Assert.Contains("line-height: 2.1", expanded);

        var siteCss = await client.GetStringAsync("/css/site.css");
        Assert.Contains(".treatment-copy { text-align: center; padding: clamp(", siteCss);
        Assert.Contains("@supports (backdrop-filter: blur(12px))", siteCss);
        Assert.Contains(".treatment-copy { padding: clamp(24px, 3vw, 36px)", siteCss);
        Assert.Contains(".treatment-copy { padding: 24px 18px; }", siteCss);
        Assert.Contains(".sophia-selection-marker img { display: block; width: 22px; height: auto", siteCss);
        Assert.Contains(".sophia-questions.is-enhanced li.sophia-glint::after", siteCss);
        Assert.Contains("transition: transform 480ms", siteCss);
        Assert.Contains("@keyframes sophia-selection-glint", siteCss);
    }
}
