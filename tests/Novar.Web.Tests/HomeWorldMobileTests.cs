using System.Net;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Novar.Web.Tests;

public sealed class HomeWorldMobileTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Theory]
    [InlineData("es", "Deslizá para explorar. Tocá una imagen para ver los controles.")]
    [InlineData("en", "Swipe to explore. Tap an image to show controls.")]
    [InlineData("pt", "Deslize para explorar. Toque em uma imagem para mostrar os controles.")]
    public async Task EditorialPanelsPreserveAllOriginalMediaAndLocalizedDiscovery(string language, string hint)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.AcceptLanguage.ParseAdd(language);
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/"));
        var section = Regex.Match(html, "<section class=\"world-section\"[\\s\\S]*?</section>").Value;
        Assert.Contains($"id=\"world-mobile-hint\" hidden>{hint}</p>", section);
        Assert.Contains("aria-describedby=\"world-mobile-hint\"", section);
        var nodes = Regex.Matches(section, "data-figma-node=\"1072:([0-9]+)\"")
            .Select(match => match.Groups[1].Value).ToArray();
        Assert.Equal(new[] { "235", "236", "237", "240", "242", "238", "239", "243", "241" }, nodes);
        Assert.Equal(8, Regex.Matches(section, "<video\\b").Count);
        Assert.Equal(8, Regex.Matches(section, "data-home-media-controls=\"world\"").Count);
        Assert.Equal(6, Regex.Matches(section, "data-home-media-sound(?=\\s|>)").Count);
        Assert.Equal(8, Regex.Matches(section, "muted loop playsinline preload=\"none\"").Count);
        Assert.DoesNotContain("role=\"button\"", section);
        Assert.True(html.IndexOf("/js/home-world-mobile.js", StringComparison.Ordinal) >
                    html.IndexOf("/js/home-media.js", StringComparison.Ordinal));
    }

    [Theory]
    [InlineData("/sobre-nosotros")]
    [InlineData("/lentes/first")]
    public async Task EnhancementIsHomeOnly(string path)
    {
        var html = await factory.CreateClient().GetStringAsync(path);
        Assert.DoesNotContain("home-world-mobile.js", html);
        Assert.DoesNotContain("world-mobile-hint", html);
    }

    [Fact]
    public async Task PhonePanelsAreProportionalAndVisibilityRequiresTouchEnhancement()
    {
        var client = factory.CreateClient();
        var css = await client.GetStringAsync("/css/home-responsive.css");
        Assert.Contains("--world-panel: 85cqw", css);
        Assert.Contains(".home-page .world-mobile-hint { display: block !important", css);
        Assert.Contains("--world-half: calc((var(--world-panel) - 16px) / 2)", css);
        Assert.Contains("scroll-snap-type: x proximity", css);
        Assert.Contains("grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px", css);
        Assert.Contains("(max-width: 767px) and (any-pointer: coarse)", css);
        Assert.Contains(".world-visual.is-touch-enhanced", css);
        Assert.Contains("prefers-reduced-motion: reduce", css);
        Assert.Contains("transition: none", css);
        var js = await client.GetStringAsync("/js/home-world-mobile.js");
        Assert.Contains("video.paused === false && video.hidden === false", js);
        Assert.DoesNotContain("video.play(", js);
        Assert.DoesNotContain("video.pause(", js);
        Assert.DoesNotContain("setPointerCapture", js);
        Assert.DoesNotContain("IntersectionObserver", js);
    }
}