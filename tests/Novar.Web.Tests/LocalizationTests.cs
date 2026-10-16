using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Localization;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Novar.Web.Services;

namespace Novar.Web.Tests;

public sealed class LocalizationTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task SpanishIsDefaultWhenNoCulturePreferenceExists()
    {
        var client = factory.CreateClient();
        var html = await client.GetStringAsync("/");
        Assert.Contains("<html lang=\"es\">", html);
    }

    [Theory]
    [InlineData("pt", "pt-BR")]
    [InlineData("pt-PT", "pt-BR")]
    [InlineData("en-US", "en")]
    [InlineData("es-AR", "es")]
    public async Task FirstVisitMapsSupportedBrowserLanguageFamilies(string browserLanguage, string expectedCulture)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.AcceptLanguage.ParseAdd(browserLanguage);
        var html = await client.GetStringAsync("/");
        Assert.Contains($"<html lang=\"{expectedCulture}\">", html);
    }

    [Fact]
    public async Task UnsupportedBrowserLanguageFallsBackToSpanish()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.AcceptLanguage.ParseAdd("fr-CA, de;q=0.8");
        var html = await client.GetStringAsync("/");
        Assert.Contains("<html lang=\"es\">", html);
    }

    [Fact]
    public async Task ExplicitCultureCookieWinsOverBrowserLanguage()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.AcceptLanguage.ParseAdd("en-US");
        client.DefaultRequestHeaders.Add("Cookie", "" + CookieRequestCultureProvider.DefaultCookieName + "=c=pt-BR%7Cuic=pt-BR");
        var html = await client.GetStringAsync("/");
        Assert.Contains("<html lang=\"pt-BR\">", html);
    }

    [Fact]
    public async Task UnsupportedCultureCookieDoesNotChangeSpanishFallback()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Cookie", "" + CookieRequestCultureProvider.DefaultCookieName + "=c=fr%7Cuic=fr");
        var html = await client.GetStringAsync("/");
        Assert.Contains("<html lang=\"es\">", html);
    }

    [Fact]
    public void LanguagePickerControlsKeepAccessibleTouchTargetsAndInheritSiteFont()
    {
        var contentRoot = factory.Services.GetRequiredService<IWebHostEnvironment>().ContentRootPath;
        var css = File.ReadAllText(Path.Combine(contentRoot, "wwwroot", "css", "site.css"));
        var formRule = Regex.Match(css, @"\.language-form\s*\{([^}]*)\}");
        var selectRule = Regex.Match(css, @"\.language-form select\s*\{([^}]*)\}");
        var codeRule = Regex.Match(css, @"\.language-code\s*\{([^}]*)\}");
        var focusRule = Regex.Match(css, @"\.language-form:focus-within\s*\{([^}]*)\}");
        var inkColor = Regex.Match(css, @"--ink:\s*(#[0-9a-fA-F]{6})").Groups[1].Value;
        var navbarColor = Regex.Match(css, @"\.navbar\s*\{[^}]*background:\s*(#[0-9a-fA-F]{6})", RegexOptions.Singleline).Groups[1].Value;

        Assert.True(formRule.Success, "The compact language-picker pill should remain explicit.");
        Assert.True(selectRule.Success, "The native language select should remain explicit.");
        Assert.True(codeRule.Success, "The current locale code should remain visible in the compact badge.");
        Assert.True(focusRule.Success, "The compact picker needs a visible focus indicator.");
        Assert.Matches(@"min-height:\s*44px", formRule.Groups[1].Value);
        Assert.Matches(@"min-width:\s*44px", selectRule.Groups[1].Value);
        Assert.Matches(@"font:\s*inherit", selectRule.Groups[1].Value);
        Assert.Contains("Poppins", codeRule.Groups[1].Value, StringComparison.Ordinal);
        Assert.Matches(@"outline:\s*2px solid var\(--ink\)", focusRule.Groups[1].Value);
        Assert.Matches(@"outline-offset:\s*2px", focusRule.Groups[1].Value);
        Assert.True(ContrastRatio(inkColor, navbarColor) >= 3.0,
            "The picker focus outline color must have at least 3:1 contrast against the navbar background.");
    }

    [Theory]
    [InlineData("es", "ES")]
    [InlineData("en", "EN")]
    [InlineData("pt-BR", "PT")]
    public async Task CompactLanguagePickerShowsCurrentCodeAndAllNativeLanguageNames(string culture, string code)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.AcceptLanguage.ParseAdd(culture);
        var html = await client.GetStringAsync("/");

        Assert.Contains($"<span class=\"language-code\" aria-hidden=\"true\">{code}</span>", html);
        Assert.Matches("<select[^>]*id=\"site-language\"[^>]*name=\"culture\"[^>]*data-language-picker", html);
        Assert.Contains("lang=\"es\">Español</option>", html);
        Assert.Contains("lang=\"en\">English</option>", html);
        Assert.Contains("lang=\"pt-BR\">Português</option>", html);
        Assert.Contains("/media/figma/ba1ea.svg", html);
        Assert.DoesNotContain("language-submit", html);
        Assert.DoesNotContain(">Aplicar</button>", html);
    }

    [Theory]
    [InlineData("es")]
    [InlineData("en")]
    [InlineData("pt-BR")]
    public async Task LanguagePostPersistsAnySupportedChoiceAndReturnsToSafeLocalPage(string culture)
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        var html = await client.GetStringAsync("/lentes/first?from=language");
        var token = Regex.Match(html, "name=\"__RequestVerificationToken\" type=\"hidden\" value=\"([^\"]+)\"").Groups[1].Value;
        Assert.False(string.IsNullOrEmpty(token));

        var response = await client.PostAsync("/language", new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["__RequestVerificationToken"] = WebUtility.HtmlDecode(token),
            ["culture"] = culture,
            ["returnUrl"] = "/lentes/first?from=language#faq"
        }));

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.Equal("/lentes/first?from=language#faq", response.Headers.Location?.OriginalString);
        Assert.Contains(response.Headers.GetValues("Set-Cookie"), value => value.StartsWith(CookieRequestCultureProvider.DefaultCookieName + "=", StringComparison.Ordinal));
    }

    [Fact]
    public void LanguagePickerAutomaticallyPostsOnNativeSelectChangeAndKeepsHashOnSubmit()
    {
        var contentRoot = factory.Services.GetRequiredService<IWebHostEnvironment>().ContentRootPath;
        var script = File.ReadAllText(Path.Combine(contentRoot, "wwwroot", "js", "site.js"));

        Assert.Contains("languageSelect?.addEventListener('change'", script, StringComparison.Ordinal);
        Assert.Contains("languageForm.requestSubmit()", script, StringComparison.Ordinal);
        Assert.Contains("languageForm?.addEventListener('submit', preserveLanguageReturnHash)", script, StringComparison.Ordinal);
        Assert.Contains("preserveLanguageReturnHash();", script, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("//outside.invalid/")]
    [InlineData("/\\outside.invalid/")]
    [InlineData("https://outside.invalid/")]
    public async Task LanguagePostFallsBackToHomeForUnsafeReturnUrl(string unsafeReturnUrl)
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        var html = await client.GetStringAsync("/");
        var token = Regex.Match(html, "name=\"__RequestVerificationToken\" type=\"hidden\" value=\"([^\"]+)\"").Groups[1].Value;
        var response = await client.PostAsync("/language", new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["__RequestVerificationToken"] = WebUtility.HtmlDecode(token),
            ["culture"] = "en",
            ["returnUrl"] = unsafeReturnUrl
        }));

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.Equal("/", response.Headers.Location?.OriginalString);
    }

    [Theory]
    [InlineData("//outside.invalid/", "/")]
    [InlineData("/\\outside.invalid/", "/")]
    [InlineData("https://outside.invalid/", "/")]
    [InlineData("/sobre-nosotros?tab=historia", "/sobre-nosotros?tab=historia")]
    public void SafeLocalReturnUrlPolicyRejectsExternalAndPreservesLocal(string returnUrl, string expected)
    {
        var isSafe = returnUrl.StartsWith("/", StringComparison.Ordinal)
            && !returnUrl.StartsWith("//", StringComparison.Ordinal)
            && !returnUrl.StartsWith("/\\", StringComparison.Ordinal)
            && Uri.TryCreate(returnUrl, UriKind.Relative, out _);

        Assert.Equal(expected != "/", isSafe);
    }

    [Fact]
    public async Task ParallelRequestsKeepTheirOwnRequestCulture()
    {
        var clients = new[] { factory.CreateClient(), factory.CreateClient(), factory.CreateClient() };
        clients[0].DefaultRequestHeaders.AcceptLanguage.ParseAdd("en");
        clients[1].DefaultRequestHeaders.AcceptLanguage.ParseAdd("pt");
        clients[2].DefaultRequestHeaders.AcceptLanguage.ParseAdd("fr");

        var responses = await Task.WhenAll(clients.Select(client => client.GetStringAsync("/")));
        Assert.Contains("<html lang=\"en\">", responses[0]);
        Assert.Contains("<html lang=\"pt-BR\">", responses[1]);
        Assert.Contains("<html lang=\"es\">", responses[2]);
    }

    [Fact]
    public async Task EveryKnownLocalRouteFamilyRendersUnderEachSupportedCulture()
    {
        var plannedSlugs = factory.Services.GetRequiredService<SiteContent>().PlannedProducts;
        var routes = new[]
        {
            "/", "/lentes", "/sobre-nosotros", "/tratamientos", "/juegos",
            "/lentes/first", "/lentes/ai-lens", "/lentes/myolens", "/lentes/aiwork",
            "/lentes/precisa", "/lentes/precisa-short", "/lentes/evolution", "/lentes/evolution-short", "/lentes/elife",
            "/lentes/geo", "/lentes/single-vision", "/lentes/outdoor", "/lentes/indoor", "/lentes/slim",
            "/lentes/kriptok-blended", "/lentes/ultex-blended", "/lentes/freeline", "/lentes/office",
            "/lentes/not-a-product", "/estado/503", "/error"
        }.Concat(plannedSlugs.Select(slug => $"/lentes/{slug}")).ToArray();

        foreach (var (acceptLanguage, expectedCulture) in new[] { ("es", "es"), ("en", "en"), ("pt-BR", "pt-BR") })
        {
            var client = factory.CreateClient();
            client.DefaultRequestHeaders.AcceptLanguage.ParseAdd(acceptLanguage);
            foreach (var route in routes)
            {
                using var response = await client.GetAsync(route);
                var html = await response.Content.ReadAsStringAsync();
                Assert.Contains($"<html lang=\"{expectedCulture}\">", html);
                Assert.Contains("<main", html);
            }
        }
    }

    [Theory]
    [InlineData("en", "/", "Find your lens")]
    [InlineData("pt-BR", "/", "Encontre suas lentes")]
    [InlineData("en", "/sobre-nosotros", "around the world")]
    [InlineData("pt-BR", "/sobre-nosotros", "no mundo")]
    [InlineData("en", "/lentes/first", "A progressive lens for people starting")]
    [InlineData("pt-BR", "/lentes/first", "Lente progressiva ideal")]
    [InlineData("en", "/lentes/ai-lens", "Real innovation. Beyond the known.")]
    [InlineData("pt-BR", "/lentes/ai-lens", "Inovação de verdade. Além do que conhecemos.")]
    [InlineData("en", "/lentes/precisa", "A comfortable, versatile progressive-lens experience.")]
    [InlineData("pt-BR", "/lentes/precisa", "Uma experiência progressiva confortável e versátil.")]
    [InlineData("en", "/lentes/geo", "GEO’s aspheric geometry")]
    [InlineData("pt-BR", "/lentes/geo", "A geometria asférica da GEO")]
    [InlineData("en", "/lentes/kriptok-blended", "A bifocal design")]
    [InlineData("pt-BR", "/lentes/kriptok-blended", "Design bifocal")]
    [InlineData("en", "/tratamientos", "Did you know you can")]
    [InlineData("pt-BR", "/tratamientos", "Você sabia que pode")]
    [InlineData("en", "/juegos", "Choose a card and find out")]
    [InlineData("pt-BR", "/juegos", "Escolha um cartão e descubra")]
    public async Task RepresentativeRenderedPagesContainTheirSelectedLocaleContent(string culture, string route, string marker)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.AcceptLanguage.ParseAdd(culture);

        var html = await client.GetStringAsync(route);
        var decodedHtml = WebUtility.HtmlDecode(html);

        Assert.Contains($"<html lang=\"{culture}\">", decodedHtml);
        Assert.Contains(marker, decodedHtml, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void EveryRazorAndJavascriptMessageHasExplicitEnglishAndPortugueseCopy()
    {
        var contentRoot = factory.Services.GetRequiredService<IWebHostEnvironment>().ContentRootPath;
        var views = Path.Combine(contentRoot, "Views");
        var razorText = string.Join("\n", Directory.GetFiles(views, "*.cshtml", SearchOption.AllDirectories)
            .Select(File.ReadAllText));
        var razorKeys = Regex.Matches(razorText, "T\\[\"([^\"]*)\"\\]")
            .Select(match => match.Groups[1].Value)
            .Distinct(StringComparer.Ordinal)
            .ToArray();
        var javascript = string.Join("\n", Directory.GetFiles(Path.Combine(contentRoot, "wwwroot", "js"), "*.js")
            .Select(File.ReadAllText));
        var javascriptKeys = Regex.Matches(javascript, "['\"]((?:game|finder|home|testimonials|gallery|treatments)\\.[A-Za-z]+)['\"]")
            .Select(match => "js:" + match.Groups[1].Value)
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        var unchangedEnglish = new HashSet<string>(StringComparer.Ordinal)
        {
            "Novar", "AI-DRIVEN VISION", "24/7/365 Assistance", "Home", "Premium", "Stay", "Connected", "Email",
            "Novar eLIFE", "Novar Evolution", "Novar Newsletter", "Novar Precisa", "visual"
        };
        var unchangedPortuguese = new HashSet<string>(StringComparer.Ordinal)
        {
            "Aplicar", "Características", "Código Visual", "Enviar", "Ideal para:", "Monofocal", "Países",
            "Pausar", "Premium", "Ver Novar", "visual", "Novar eLIFE", "Novar Evolution", "Novar Precisa",
            "Características de "
        };

        foreach (var culture in new[] { "en", "pt-BR" })
        {
            var translations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                File.ReadAllText(Path.Combine(contentRoot, "Content", "Translations", culture + ".json")))!;
            var missing = razorKeys.Concat(javascriptKeys).Where(key => !translations.ContainsKey(key)).ToArray();
            Assert.True(missing.Length == 0, $"{culture} is missing explicit messages: {string.Join(", ", missing)}");

            var unchangedAllowlist = culture == "en" ? unchangedEnglish : unchangedPortuguese;
            var untranslated = razorKeys.Where(key => string.Equals(translations[key], key, StringComparison.Ordinal)
                && !unchangedAllowlist.Contains(key)).ToArray();
            Assert.True(untranslated.Length == 0,
                $"{culture} has untranslated Razor source text outside the exact allowlist: {string.Join(" | ", untranslated)}");
        }
    }

    [Fact]
    public void LocalizedTypedCatalogsPreserveStructureAndOnlyKeepExplicitlyApprovedExactCopy()
    {
        var contentRoot = factory.Services.GetRequiredService<IWebHostEnvironment>().ContentRootPath;
        var sourceDirectory = Path.Combine(contentRoot, "Content");
        var approvedSameCopy = new HashSet<string>(StringComparer.Ordinal)
        {
            "First", "Geo", "Single Vision", "Outdoor", "Indoor", "Slim", "Precisa", "Precisa Short", "Precisa short", "Evolution",
            "Novar", "Evolution Short", "eLIFE", "AI Lens", "MyoLens", "AIWork", "MyoFix", "AI·Lens", "Kriptok Blended",
            "Ultex Blended", "Freeline", "Office", "CDT Technology™", "Psicoptix Technology™ / CDT Technology™",
            "Psicoptix Technology™ / CDT Technology™ / RoTech / WearFit",
            "Psicoptix Technology™ / CDT Technology™ / Blending Technology™",
            "Psicoptix Technology™ / CDT Technology™ / Smart Molding Process.",
            "Psicoptix Technology™ / CDT Technology™ / Adaptive Focus Technology.",
            "Psicoptix Technology™ / AI-GET Technology™.", "AI-GET Technology™.", "Blending Technology™",
            "Smart Fit Technology", "Adaptative Focus Technology", "CÓDIGO VISUAL", "INTRUSO CROMÁTICO", "Intruso Cromático", "TRIVIA",
            "Trivia", "Blue Tech", "Polarizado", "Hidrofóbico", "visual", " visual", "Alta", "Formato compacto",
            "Formato compacto.", "Segmento redondo", "Lente monofocal", "10%", "30%", "50%"
        };

        foreach (var sourcePath in Directory.GetFiles(sourceDirectory, "*.json", SearchOption.TopDirectoryOnly))
        {
            var name = Path.GetFileName(sourcePath);
            var source = JsonNode.Parse(File.ReadAllText(sourcePath));
            foreach (var culture in new[] { "en", "pt-BR" })
            {
                var localizedPath = Path.Combine(sourceDirectory, "Locales", culture, name);
                Assert.True(File.Exists(localizedPath), $"{culture} catalog is missing {name}");
                var localized = JsonNode.Parse(File.ReadAllText(localizedPath));
                AssertCatalogParity(source, localized, "$", culture, approvedSameCopy);
            }
        }
    }

    private static void AssertCatalogParity(JsonNode? source, JsonNode? localized, string path, string culture,
        HashSet<string> approvedSameCopy)
    {
        if (source is null || localized is null)
        {
            Assert.Null(source);
            Assert.Null(localized);
            return;
        }
        if (source is JsonObject sourceObject)
        {
            var localizedObject = Assert.IsType<JsonObject>(localized);
            Assert.Equal(sourceObject.Select(pair => pair.Key).Order(), localizedObject.Select(pair => pair.Key).Order());
            foreach (var pair in sourceObject)
                AssertCatalogParity(pair.Value, localizedObject[pair.Key], path + "." + pair.Key, culture, approvedSameCopy);
            return;
        }
        if (source is JsonArray sourceArray)
        {
            var localizedArray = Assert.IsType<JsonArray>(localized);
            Assert.Equal(sourceArray.Count, localizedArray.Count);
            for (var index = 0; index < sourceArray.Count; index++)
                AssertCatalogParity(sourceArray[index], localizedArray[index], $"{path}[{index}]", culture, approvedSameCopy);
            return;
        }

        if (source is JsonValue sourceValue && localized is JsonValue localizedValue
            && sourceValue.TryGetValue<string>(out var sourceText)
            && localizedValue.TryGetValue<string>(out var localizedText)
            && !string.IsNullOrWhiteSpace(sourceText)
            && string.Equals(sourceText, localizedText, StringComparison.Ordinal))
        {
            var property = path[(path.LastIndexOf('.') + 1)..];
            var isStructuralOrAsset = new[] { "id", "slug", "need", "from", "to", "number", "correctIndex", "sourceNode", "wordmarkNode", "iconNode", "file", "image", "hero", "scene", "detail", "wordmark", "galleryRegistered", "heroUnderlay", "heroImage", "source", "watermark" }
                .Contains(property, StringComparer.Ordinal)
                || Regex.IsMatch(sourceText, "^(?:[A-Za-z0-9_-]+\\.(?:png|svg|webp|jpg|jpeg|mp4)|\\d+(?:[:;]\\d+)+|\\d+%|[a-z0-9]+(?:-[a-z0-9]+)*)$");
            Assert.True(isStructuralOrAsset || approvedSameCopy.Contains(sourceText),
                $"{culture} has exact Spanish copy outside the brand/term allowlist at {path}: {sourceText}");
        }
    }

    private static double ContrastRatio(string firstHex, string secondHex)
    {
        static double RelativeLuminance(string hex)
        {
            var channels = Enumerable.Range(0, 3)
                .Select(index => Convert.ToInt32(hex.Substring(1 + index * 2, 2), 16) / 255d)
                .Select(channel => channel <= 0.04045 ? channel / 12.92 : Math.Pow((channel + 0.055) / 1.055, 2))
                .ToArray();
            return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
        }

        var first = RelativeLuminance(firstHex);
        var second = RelativeLuminance(secondHex);
        return (Math.Max(first, second) + 0.05) / (Math.Min(first, second) + 0.05);
    }
}
