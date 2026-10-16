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

    [Theory]
    [InlineData("accordion-button", "16px")]
    [InlineData("accordion-body", "13px")]
    public async Task HomeFaqTypeMatchesLensSizeWithoutShrinkingMobile(string elementClass, string size)
    {
        var siteCss = await client.GetStringAsync("/css/site.css");
        var homeRule = Regex.Match(siteCss, $@"\.home-page \.novar-faq \.{elementClass}\s*\{{[^}}]+\}}").Value;
        Assert.Contains($"font-size: {size}", homeRule);

        var responsiveCss = await client.GetStringAsync("/css/home-responsive.css");
        var mobileRule = Regex.Match(responsiveCss, $@"\.home-page \.novar-faq \.{elementClass}\s*\{{[^}}]+\}}").Value;
        Assert.Contains("font-size: 16px", mobileRule);
    }

    [Theory]
    [InlineData("button:hover")]
    [InlineData("[role=\"button\"]:hover")]
    [InlineData(".btn:hover")]
    [InlineData(".world-cta:hover")]
    [InlineData(".card-cta:hover")]
    public async Task ButtonHoverStylesDoNotUnderlineLabels(string selector)
    {
        var css = await client.GetStringAsync("/css/site.css");
        var rules = Regex.Matches(css, @"(?<selectors>[^{}]+)\{(?<body>[^{}]+)\}");
        Assert.Contains(rules.Cast<Match>(), rule =>
            rule.Groups["selectors"].Value.Split(',').Any(item => item.Trim() == selector)
            && Regex.IsMatch(rule.Groups["body"].Value, @"text-decoration:\s*none\s*;"));
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
        Assert.Contains("<a class=\"hero-next\" href=\"#encontra\" aria-label=\"Descubrir los lentes\"><img src=\"/media/figma/9e5ee.svg\" alt=\"\" width=\"52.6\" height=\"44.6\" /></a>", html);
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
        var button = Regex.Match(premiumCss, @"\.premium-faq \.accordion-button\s*\{[^}]+\}").Value;
        Assert.Contains("min-height: 68px", button);
        Assert.Contains("padding: 18px 24px", button);
        Assert.Contains("font-size: 16px", button);
        Assert.Contains("font-weight: 400", button);
        Assert.Contains("line-height: 2.1", button);

        var siteCss = await client.GetStringAsync("/css/site.css");
        Assert.Contains(".hero-next { position: absolute; right: 7%; bottom: 32px; display: grid; place-items: center; width: 44px; height: 44px;", siteCss);
        Assert.Contains(".hero-next img { display: block; width: 52.6px; height: 44.6px; max-width: none; }", siteCss);
        var sophiaPill = Regex.Match(siteCss, @"\.sophia-label\s*\{[^}]+\}").Value;
        Assert.Contains("width: min(479.417px, 100%)", sophiaPill);
        Assert.Contains("font-size: clamp(10px, 1.528vw, 22px); font-weight: 200", sophiaPill);
        Assert.Contains("border: 1.833px solid transparent", sophiaPill);
        Assert.Contains("position: relative; isolation: isolate", sophiaPill);
        Assert.Contains("background: #d9d9d933", sophiaPill);
        Assert.DoesNotContain("background: linear-gradient", sophiaPill);
        Assert.Contains(".sophia-actions .btn-outline-novar { --bs-btn-hover-color: var(--ink); --bs-btn-hover-bg: #fff", siteCss);
        Assert.Contains(".treatment-copy { text-align: center; padding: clamp(", siteCss);
        var treatmentCopy = Regex.Match(siteCss, @"\.treatment-copy\s*\{[^}]+\}").Value;
        Assert.DoesNotContain("border:", treatmentCopy);
        Assert.DoesNotContain("background:", treatmentCopy);
        Assert.DoesNotContain("box-shadow:", treatmentCopy);
        Assert.DoesNotContain("backdrop-filter:", treatmentCopy);
        Assert.Contains(".treatment-copy { padding: clamp(24px, 3vw, 36px)", siteCss);
        Assert.Contains(".treatment-copy { padding: 24px 18px; }", siteCss);
        var treatmentBadge = Regex.Match(siteCss, @"\.treatment-copy \.eyebrow\s*\{[^}]+\}").Value;
        Assert.Contains("width: 148.402px; height: 37.496px", treatmentBadge);
        Assert.Contains("border: 2.076px solid transparent", treatmentBadge);
        Assert.Contains("font-weight: 200", treatmentBadge);
        Assert.Contains("background: #d9d9d933", treatmentBadge);
        Assert.DoesNotContain("linear-gradient", treatmentBadge);
        var pillBorder = Regex.Match(siteCss, @"\.sophia-label::before, \.treatment-copy \.eyebrow::before\s*\{[^}]+\}").Value;
        Assert.NotEmpty(pillBorder);
        Assert.Contains("z-index: -1", pillBorder);
        Assert.Contains("padding: 1.833px", pillBorder);
        Assert.Contains("#1f023c 100%", pillBorder);
        Assert.Contains("mask-composite: exclude", pillBorder);
        Assert.Contains("-webkit-mask-composite: xor", pillBorder);
        Assert.Contains("pointer-events: none", pillBorder);
        Assert.Contains(".treatment-copy .eyebrow::before { padding: 2.076px; }", siteCss);
        Assert.Contains(".sophia-selection-marker img { display: block; width: 22px; height: auto", siteCss);
        Assert.Contains(".sophia-questions.is-enhanced li.sophia-glint::after", siteCss);
        Assert.Contains("transition: transform 480ms", siteCss);
        Assert.Contains("@keyframes sophia-selection-glint", siteCss);
    }
}
