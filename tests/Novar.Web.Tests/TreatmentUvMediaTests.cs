using System.Net;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Novar.Web.Tests;

public sealed class TreatmentUvMediaTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task UvHasSilentInlineAutoplayAndPosterFallback()
    {
        var html = WebUtility.HtmlDecode(await factory.CreateClient().GetStringAsync("/tratamientos"));
        var uv = Regex.Match(html, "<section id=\"uv\"[\\s\\S]*?</section>").Value;
        Assert.Contains("<video", uv);
        Assert.Contains("muted playsinline preload=\"none\"", uv);
        Assert.Contains("/media/treatments/optimized/uv-poster-1280.webp", uv);
        Assert.Contains("data-treatment-desktop=\"/media/treatments/optimized/uv-desktop.mp4\"", uv);
        Assert.DoesNotContain(" autoplay", uv);
        Assert.DoesNotContain(" controls", uv);
        Assert.DoesNotContain("data-uv-play", uv);
        Assert.DoesNotContain("data-uv-sound", uv);
        Assert.DoesNotContain("Reproducir video", uv);
        Assert.DoesNotContain("Activar sonido", uv);
        Assert.Contains("data-treatment-fallback", uv);
        Assert.Contains("treatment-uv-source-arrows", uv);
        Assert.DoesNotContain("/js/treatment-uv-media.js", html);
        Assert.Contains("/js/treatments-media.js", html);
    }
}
