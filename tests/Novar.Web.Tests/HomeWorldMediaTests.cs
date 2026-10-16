using System.Net;
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Novar.Web.Tests;

public sealed class HomeWorldMediaTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private static readonly (string Node, string Asset, string Hash)[] Sources =
    [
        ("235", "path", "A84A5FA03793E5BA9568B22859E33E7E234D1E2E45CEF04727E36FEE512BBCF9"),
        ("236", "navy", "8FE03600AD9C1E7B465DBCB146ADE580DC32B84AB0BBED41AB3D3725C83B6083"),
        ("237", "navy", "8FE03600AD9C1E7B465DBCB146ADE580DC32B84AB0BBED41AB3D3725C83B6083"),
        ("240", "turquoise", "15D1C4E8453B620117CDC4B606C8FE7BE336BF362B21A3070A35645CD5E08BC6"),
        ("242", "spectra-glasses", "E44147A621590809BC9751AC832CB53C60E516FF2D6633D81724FD67441DB506"),
        ("238", "navy", "8FE03600AD9C1E7B465DBCB146ADE580DC32B84AB0BBED41AB3D3725C83B6083"),
        ("239", "sunset-glasses", "E992EAEB97D8829C148C82CAD41132D17769068D2866F9B658E8EAAE0A0D2D5C"),
        ("243", "earth", "7D3248D22507B9A53D3447CFF4D2AB0A99798EBC053EAC0B8E91B66387D4A364"),
        ("241", "boy-glasses", "1759CD8885F34D48A448F36A3B5D86615473EBC6160B5768F5A1BC935537F0A5")
    ];

    [Theory]
    [InlineData("es", "es")]
    [InlineData("en", "en")]
    [InlineData("pt", "pt-BR")]
    public async Task NineAuthenticDecorativePostersReplaceOnlyWorldPlaceholders(string language, string culture)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.AcceptLanguage.ParseAdd(language);
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/"));
        var section = Regex.Match(html, "<section class=\"world-section\"[\\s\\S]*?</section>").Value;
        Assert.Contains($"<html lang=\"{culture}\">", html);
        Assert.Equal(9, Regex.Matches(section, "data-figma-node=\"1072:").Count);
        Assert.Equal(9, Regex.Matches(section, "<img ").Count - 1); // The unchanged CTA arrow is separate.
        foreach (var (node, asset, _) in Sources)
            Assert.Matches($"data-figma-node=\"1072:{node}\"[^>]*>(?:<div class=\"world-media-clip\">)?<img src=\"/media/home/optimized/world-{asset}.webp\" alt=\"\"", section);
        Assert.DoesNotContain("world-quote", section);
        Assert.DoesNotContain("<blockquote", section);
        Assert.DoesNotContain("6b2a4.svg", section);
        Assert.DoesNotContain("<span class=\"world-shape", section);
        Assert.Contains("+41M", section);
        Assert.Contains("+60", section);
        Assert.Contains("+290", section);
        Assert.Equal(10, Regex.Matches(html, "<video\\b").Count);
        Assert.Contains("/media/home/optimized/hero-banner.mp4", html);
        Assert.Contains("/media/home/lens-finder.mp4", html);
        Assert.Contains("Hernán Darío", html);
        Assert.Contains("Marcos G.", html);
        Assert.Contains("Valentina R.", html);
        Assert.Contains("language-form", html);
    }

    [Fact]
    public async Task PortraitSlotsMapOriginalClipsAndKeepPosterCropSeparateFromVideo()
    {
        var client = factory.CreateClient();
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/"));
        var css = await client.GetStringAsync("/css/site.css");
        foreach (var (node, number, left) in new[] { ("236", 1, "161"), ("237", 2, "378.1015625"), ("238", 3, "844") })
        {
            var root = Regex.Match(html, $"<div class=\"world-shape-tall\" data-figma-node=\"1072:{node}\"[\\s\\S]*?</video></div><div class=\"world-media-actions\">[\\s\\S]*?</div></div>").Value;
            Assert.NotEmpty(root);
            Assert.Contains($"data-home-media-player=\"world-portrait-{number}\"", root);
            Assert.Contains($"data-home-media-source=\"/media/home/optimized/world-portrait-{number}.mp4\"", root);
            Assert.Contains($"id=\"home-world-portrait-{number}-video\" width=\"432\" height=\"768\"", root);
            Assert.Contains("poster=\"/media/home/optimized/world-navy.webp\"", root);
            Assert.Equal(2, Regex.Matches(root, $"aria-controls=\"home-world-portrait-{number}-video\"").Count);
            Assert.Contains($".world-shape-tall[data-home-media-player=\"world-portrait-{number}\"] {{ --world-left: {left}px; }}", css);
        }
        Assert.Contains("[data-home-media-player^=\"world-portrait-\"] > .world-media-clip > img { width: calc(100% / var(--crop-width));", css);
        Assert.DoesNotMatch(@"world-portrait-[^{}]*> video[^{}]*\{[^{}]*(?:transform:|object-fit: fill)", css);
    }

    [Fact]
    public async Task SpectraGlassesSlotUsesOriginalVideoAndSharedCropWithoutReplacingHero()
    {
        var client = factory.CreateClient();
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/"));
        var css = await client.GetStringAsync("/css/site.css");
        var root = Regex.Match(html, "<div class=\"world-poster world-poster-crop world-media-player\" data-figma-node=\"1072:242\"[\\s\\S]*?</video></div><div class=\"world-media-actions\">[\\s\\S]*?</div></div>").Value;
        Assert.NotEmpty(root);
        Assert.Contains("data-home-media-player=\"world-spectra-glasses\"", root);
        Assert.Contains("data-home-media-source=\"/media/home/optimized/world-spectra-glasses.mp4\"", root);
        Assert.Contains("id=\"home-world-spectra-glasses-video\" width=\"986\" height=\"720\"", root);
        Assert.Contains("poster=\"/media/home/optimized/world-spectra-glasses.webp\"", root);
        Assert.Equal(2, Regex.Matches(root, "aria-controls=\"home-world-spectra-glasses-video\"").Count);
        Assert.Contains(".world-poster[data-home-media-player=\"world-spectra-glasses\"] { --world-left: 596px; --world-actions-width: 92px; }", css);
        Assert.Contains(".world-poster-crop > .world-media-clip > img, .world-poster-crop > .world-media-clip > video { width: calc(100% / var(--crop-width)); height: calc(100% / var(--crop-height)); object-fit: fill; transform: translate(calc(-100% * var(--crop-x)), calc(-100% * var(--crop-y))); }", css);
        Assert.Contains("data-home-media-source=\"/media/home/optimized/hero-banner.mp4\"", html);
        Assert.Contains("data-figma-node=\"1072:240\"><img", html);
    }

    [Fact]
    public async Task LocalPostersAreNonemptyUnmodifiedFullResolutionSourceBytes()
    {
        var client = factory.CreateClient();
        foreach (var (_, asset, hash) in Sources.DistinctBy(source => source.Asset))
        {
            var bytes = await client.GetByteArrayAsync($"/media/home/world-{asset}.png");
            Assert.NotEmpty(bytes);
            Assert.Equal(hash, Convert.ToHexString(SHA256.HashData(bytes)));
        }
    }

    [Fact]
    public async Task SlotGeometryUsesFigmaCropTransformsWithoutInventedFilters()
    {
        var css = await factory.CreateClient().GetStringAsync("/css/site.css");
        var rules = Regex.Matches(css, @"\.world-(?:shape|poster)[^}]*\}").Select(match => match.Value).ToArray();
        var joined = string.Join("\n", rules);
        Assert.Contains("border-radius: 14.25px", joined);
        Assert.Contains("border-radius: 75px", joined);
        Assert.Contains("border-radius: 50%", joined);
        Assert.Contains("object-fit: cover", joined);
        Assert.Contains("width: calc(100% / var(--crop-width))", joined);
        Assert.Contains("height: calc(100% / var(--crop-height))", joined);
        Assert.Contains("translate(calc(-100% * var(--crop-x)), calc(-100% * var(--crop-y)))", joined);
        foreach (var (node, crop) in new[]
        {
            ("235", "--crop-width: 0.2916281819343567; --crop-height: 0.5241206288337708; --crop-x: 0.6954026222229004; --crop-y: 0.21565431356430054"),
            ("236", "--crop-width: 0.31430232524871826; --crop-height: 0.9094647169113159; --crop-x: 0.3241884112358093; --crop-y: 0.04526764154434204"),
            ("237", "--crop-width: 0.30776965618133545; --crop-height: 0.8677734136581421; --crop-x: 0; --crop-y: 0.06611329317092896"),
            ("238", "--crop-width: 0.3103468120098114; --crop-height: 0.8750399947166443; --crop-x: 0.6896531581878662; --crop-y: 0.062480006366968155"),
            ("242", "--crop-width: 0.7144367098808289; --crop-height: 0.6388798952102661; --crop-x: 0.14278165996074677; --crop-y: 0.18056005239486694")
        })
            Assert.Contains(crop, Assert.Single(rules, rule => rule.Contains($"data-figma-node=\"1072:{node}\"")));
        Assert.DoesNotContain("filter:", joined);
        Assert.DoesNotContain("background:", joined);
        Assert.Contains(".world-section [data-home-media-controls=\"world\"] { overflow: visible; --world-actions-width: 44px; }", css);
        Assert.Contains(".world-media-clip { position: absolute; inset: 0; overflow: hidden; border-radius: inherit; }", css);
        Assert.Contains("width: 44px; min-width: 44px; height: 44px", css);
        Assert.Contains("left: clamp(calc((1440px - 100vw) / 2 - var(--world-left) + 8px)", css);
        Assert.Contains("button:focus-visible", css);
        Assert.DoesNotContain("world-quote", css);
        Assert.Contains("width: 1440px", joined);
        foreach (var (node, geometry) in new[]
        {
            ("235", "left: -181px; top: 7.645px; width: 328.5px; height: 328.5px"),
            ("236", "left: 161px; top: 7.645px; width: 201.703125px"),
            ("237", "left: 378.1015625px; top: 7.645px"),
            ("240", "left: 596px; top: 0; width: 238.5px; height: 156px"),
            ("242", "left: 596px; top: 173.25px; width: 237.75px; height: 155.25px"),
            ("238", "left: 844px; top: 2.645px"),
            ("239", "left: 1062.625px; top: 2.645px"),
            ("243", "left: 1281.625px; top: 2.645px; width: 237.75px; height: 155.25px"),
            ("241", "left: 1283.125px; top: 171.395px; width: 238.5px; height: 156px")
        })
            Assert.Contains(geometry, Assert.Single(rules, rule => rule.Contains($"data-figma-node=\"1072:{node}\"] {{")));
    }

    [Fact]
    public async Task WorldActionsHideOnlyForFineHoverPointersAndRevealPerPlayer()
    {
        var css = await factory.CreateClient().GetStringAsync("/css/site.css");
        var hover = Regex.Match(css, @"@media \(hover: hover\) and \(pointer: fine\)\s*\{\s*(?<hide>[^{}]+\{[^{}]+\})\s*(?<reveal>[^{}]+\{[^{}]+\})\s*\}");
        Assert.True(hover.Success, "World hover visibility must be confined to hover-capable fine pointers.");
        var hide = hover.Groups["hide"].Value.Trim();
        var reveal = hover.Groups["reveal"].Value.Trim();
        Assert.StartsWith(".world-section [data-home-media-controls=\"world\"] > .world-media-actions {", hide);
        Assert.Contains("opacity: 0", hide);
        Assert.Contains("pointer-events: none", hide);
        Assert.StartsWith(".world-section [data-home-media-controls=\"world\"]:hover > .world-media-actions,", reveal);
        Assert.Contains(".world-section [data-home-media-controls=\"world\"]:focus-within > .world-media-actions {", reveal);
        Assert.Contains("opacity: 1", reveal);
        Assert.Contains("pointer-events: auto", reveal);
        Assert.DoesNotContain("display:", hover.Value);
        Assert.DoesNotContain("visibility:", hover.Value);
        Assert.DoesNotContain("transition:", hover.Value);
        Assert.DoesNotContain("hero", hover.Value);
        Assert.DoesNotContain("finder", hover.Value);
        Assert.DoesNotContain(".world-section:hover", hover.Value);
        var outsideHover = css.Remove(hover.Index, hover.Length);
        Assert.DoesNotMatch(@"\.world-media-actions[^{}]*\{[^{}]*(?:opacity:\s*0|pointer-events:\s*none)", outsideHover);
        Assert.Contains(".world-media-actions { position: absolute;", outsideHover);
        Assert.Contains("width: 44px; min-width: 44px; height: 44px", outsideHover);
    }

    [Fact]
    public async Task WorldActionButtonsRetainKeyboardTargetsWithoutHoverOnlyMarkup()
    {
        var html = await factory.CreateClient().GetStringAsync("/");
        var section = Regex.Match(html, "<section class=\"world-section\"[\\s\\S]*?</section>").Value;
        var buttons = Regex.Matches(section, "<button\\b[^>]*>");
        Assert.Equal(14, buttons.Count);
        foreach (Match button in buttons)
        {
            Assert.DoesNotContain("tabindex=\"-1\"", button.Value);
            Assert.DoesNotContain(" disabled", button.Value);
            Assert.Contains("aria-controls=\"home-world-", button.Value);
        }
    }

    [Theory]
    [InlineData("es", "Reproducir video", "Pausar video", "Activar sonido", "Silenciar video")]
    [InlineData("en", "Play video", "Pause video", "Enable sound", "Mute video")]
    [InlineData("pt", "Reproduzir vídeo", "Pausar vídeo", "Ativar som", "Silenciar vídeo")]
    public async Task EightWorldPlayersHaveTranslatedNativeControlsAndOnlySixSoundActions(string language, string play, string pause, string sound, string mute)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.AcceptLanguage.ParseAdd(language);
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/"));
        var section = Regex.Match(html, "<section class=\"world-section\"[\\s\\S]*?</section>").Value;
        Assert.Equal(8, Regex.Matches(section, "data-home-media-controls=\"world\"").Count);
        Assert.Equal(8, Regex.Matches(section, "data-home-media-toggle").Count);
        Assert.Equal(6, Regex.Matches(section, "data-home-media-sound(?: |>)").Count);
        foreach (var asset in new[] { "path", "sunset-glasses", "earth", "boy-glasses", "portrait-1", "portrait-2", "portrait-3", "spectra-glasses" })
        {
            Assert.Contains($"data-home-media-source=\"/media/home/optimized/world-{asset}.mp4\"", section);
            Assert.Contains($"aria-controls=\"home-world-{asset}-video\"", section);
            Assert.Single(Regex.Matches(section, $"id=\"home-world-{asset}-video\""));
        }
        foreach (Match video in Regex.Matches(section, "<video\\b[^>]*>"))
        {
            Assert.Contains(" muted loop playsinline preload=\"none\"", video.Value);
            Assert.Contains(" hidden", video.Value);
            Assert.Contains("poster=\"/media/home/optimized/world-", video.Value);
            Assert.DoesNotContain(" src=", video.Value);
        }
        foreach (var (key, label) in new[] { ("play", play), ("pause", pause), ("sound", sound), ("mute", mute) })
            Assert.Contains($"data-home-media-{key}-label=\"{label}\"", section);
        Assert.Equal(8, Regex.Matches(section, $"aria-label=\"{play}\"").Count);
        Assert.Equal(6, Regex.Matches(section, $"aria-label=\"{sound}\"").Count);
    }

    [Theory]
    [InlineData("path", 4462207L, "CF9F413CB6EC2981328E4B69491EE846F324C02F439398589B3EE3C5F3042174")]
    [InlineData("boy-glasses", 2397237L, "2B65FF4843D640FE0BA496AB9DB9920A33F3A5CD1CB671EC8321C73713E9685B")]
    [InlineData("sunset-glasses", 1018469L, "DD5E17118FD12461066B18DBBADA7F1B3FF8090353C70449F3E2ADCA48112CA2")]
    [InlineData("earth", 281030656L, "85F0A86055749FB44C66F7A26EF75B8AE8D09BA1DB8E3121DA2338D83D851850")]
    [InlineData("portrait-1", 26516674L, "EE0D3E4EE1DCA4E02B8FAC4AA792F26F2BEDF6BA4B282A8FA24A342BAB18DF3B")]
    [InlineData("portrait-2", 27193455L, "C88CF5182F4964825725FAC5D36CDABDFDEA2D3E277AF570B19D9EA6C2297692")]
    [InlineData("portrait-3", 27136672L, "E8BBF9E784E3D15E5A93BB9C9F396F456F7D018E2B71DBBC36F7D0D149CAD7C3")]
    [InlineData("spectra-glasses", 3193315L, "061F3E848675FD60E3E7332EFFBD6155B1EFCCBBBF2000A07ED1CA75A612F6FF")]
    public async Task OriginalWorldVideoBytesSupportHeadAndOneByteRange(string asset, long length, string hash)
    {
        var environment = factory.Services.GetRequiredService<IWebHostEnvironment>();
        var file = Path.Combine(environment.WebRootPath, "media", "home", $"world-{asset}.mp4");
        Assert.True(File.Exists(file));
        await using (var stream = File.OpenRead(file))
        {
            Assert.Equal(length, stream.Length);
            Assert.Equal(hash, Convert.ToHexString(await SHA256.HashDataAsync(stream)));
        }
        var client = factory.CreateClient();
        var path = $"/media/home/world-{asset}.mp4";
        using var head = new HttpRequestMessage(HttpMethod.Head, path);
        using var response = await client.SendAsync(head);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(length, response.Content.Headers.ContentLength);
        Assert.Equal("video/mp4", response.Content.Headers.ContentType?.MediaType);
        using var range = new HttpRequestMessage(HttpMethod.Get, path);
        range.Headers.Range = new RangeHeaderValue(0, 0);
        using var partial = await client.SendAsync(range);
        Assert.Equal(HttpStatusCode.PartialContent, partial.StatusCode);
        Assert.Equal(length, partial.Content.Headers.ContentRange?.Length);
        Assert.Equal("video/mp4", partial.Content.Headers.ContentType?.MediaType);
        Assert.Single(await partial.Content.ReadAsByteArrayAsync());
    }
}
