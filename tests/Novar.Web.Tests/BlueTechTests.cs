using System.Net;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Novar.Web.Services;

namespace Novar.Web.Tests;

public sealed class BlueTechTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task BlueTechPreservesSourceCopyAndItsDistinctOriginalImage()
    {
        var detail = Assert.Single(factory.Services.GetRequiredService<SiteContent>().Treatments.Details,
            item => item.Id == "blue-tech");
        Assert.Equal("961:9088", detail.SourceNode);
        Assert.Equal("Blue Tech", detail.Name);
        Assert.Equal("NOVAR BLUE TECH combina en una misma lente la tecnología de protección por reflexión y a su vez la tecnología de protección por absorción en masa para mejorar las prestaciones del lente e inhibir la nociva luz azul-violeta que puede provocar DME y daño prolongado a\nla retina.", detail.Description);
        Assert.Equal(new[] { "Mejor descanso", "Menos fatiga visual", "Ideal para pantallas" }, detail.Benefits);
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/tratamientos"));
        var panel = Regex.Match(html, "<section id=\"blue-tech\"[\\s\\S]*?</section>").Value;
        Assert.Contains("data-figma-node=\"961:9082\"", panel);
        Assert.Contains(detail.Description, panel);
        Assert.All(detail.Benefits, benefit => Assert.Contains(benefit, panel));
        Assert.Contains("/media/figma/f0cf4.png", panel);
        Assert.DoesNotContain("16fed.png", panel);
        Assert.DoesNotContain("<button", panel);
        Assert.DoesNotContain("type=\"range\"", panel);
    }

    [Fact]
    public async Task FragmentLinksAndUnhiddenSemanticSectionsRemainReachableWithoutJavascript()
    {
        var html = WebUtility.HtmlDecode(await client.GetStringAsync("/tratamientos"));
        foreach (var id in new[] { "uv", "blue-tech" })
        {
            Assert.Contains($"href=\"#{id}\" data-treatment-link=\"{id}\"", html);
            var opening = Regex.Match(html, $"<section id=\"{id}\"[^>]*>").Value;
            Assert.NotEmpty(opening);
            Assert.Contains($"aria-labelledby=\"treatment-{id}-title\"", opening);
            Assert.DoesNotContain(" hidden", opening);
            Assert.DoesNotContain("aria-hidden", opening);
        }
        var script = await client.GetStringAsync("/js/treatments.js");
        Assert.Contains("'tablist'", script);
        Assert.Contains("'tabpanel'", script);
        Assert.Contains("'hashchange'", script);
        Assert.Contains("'popstate'", script);
        Assert.Contains("history.pushState", script);
        Assert.DoesNotContain("fetch(", script);
        Assert.DoesNotContain("localStorage", script);
    }

    [Fact]
    public async Task BlueTechAssetsRetainOriginalHashesAndScopedIntrinsicGeometry()
    {
        var hashes = new Dictionary<string, string>
        {
            ["f0cf4.png"] = "D2EF9BCE153FABD72CA8B291070F79CB9C16B8B9CD66DD9563EACF0C6A0C0828",
            ["b21e2.svg"] = "4EDD93F45EFF4224FDC672E56A6B8C1046899EB40788EA8842241290B8C6A61A",
            ["fa384.svg"] = "0306DA73749F27E280A184A3EA17B6A3160E8F832EBE3DE451F8B47BC0B0412C"
        };
        foreach (var (file, expected) in hashes)
            Assert.Equal(expected, Convert.ToHexString(SHA256.HashData(await client.GetByteArrayAsync($"/media/figma/{file}"))));
        var css = await client.GetStringAsync("/css/treatments.css");
        Assert.Contains("font-size: 30.085px", css);
        Assert.Contains("font-size: 15.042px", css);
        Assert.Contains("font-size: 14.748px", css);
        Assert.Contains(".treatment-detail[hidden] { display: none; }", css);
        Assert.Contains(".treatments-footer-socials .treatments-linkedin-blue-tech { display: none; }", css);
        Assert.Contains(".treatments-page[data-active-treatment=\"blue-tech\"] .treatments-linkedin-default { display: none; }", css);
        var html = await client.GetStringAsync("/tratamientos");
        var linkedin = Regex.Match(html, "<button[^>]*data-pending=\"LinkedIn\"[\\s\\S]*?</button>").Value;
        Assert.Equal(2, Regex.Matches(linkedin, "alt=\"\"").Count); // One button label, no duplicate accessible image names.
    }
}
