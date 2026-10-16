using System.Net;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Novar.Web.Models;
using Novar.Web.Services;

namespace Novar.Web.Tests;

public sealed class ProductBannerQualityTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();
    private string[] Slugs
    {
        get
        {
            var content = factory.Services.GetRequiredService<SiteContent>();
            return content.ProgressiveProducts.Keys.Concat(content.MonofocalProducts.Keys)
                .Concat(content.BifocalOccupationalProducts.Keys).Concat(content.PremiumProducts.Keys)
                .Append("first").ToArray();
        }
    }

    [Theory]
    [InlineData("es")]
    [InlineData("en")]
    [InlineData("pt-BR")]
    public async Task AllEighteenProductHeroesUseAnExplicitHighResolutionExport(string culture)
    {
        Assert.Equal(18, Slugs.Length);
        foreach (var slug in Slugs)
        {
            var banner = ProductBannerAsset.ForSlug(slug);
            using var request = new HttpRequestMessage(HttpMethod.Get, $"/lentes/{slug}");
            request.Headers.AcceptLanguage.ParseAdd(culture);
            var response = await client.SendAsync(request);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var html = await response.Content.ReadAsStringAsync();
            var hero = Regex.Match(html, "<section class=\"(?:prg|mono|bop|premium)-hero\"[\\s\\S]*?</section>").Value;
            Assert.NotEmpty(hero);
            var photo = Assert.Single(Regex.Matches(hero, "<img [^>]*data-product-banner[^>]*>"));
            Assert.Contains($"src=\"/media/products/banners/{banner.File}\"", photo.Value);
            Assert.Contains($"width=\"{banner.Width}\" height=\"{banner.Height}\"", photo.Value);
            Assert.Contains("fetchpriority=\"high\"", photo.Value);
            Assert.DoesNotContain("loading=\"lazy\"", photo.Value);
            Assert.DoesNotContain("hero-underlay", hero);
            Assert.True(banner.Width >= 1920);
            Assert.Single(Regex.Matches(hero, "<h1(?: |>)"));
            // These exports must never silently replace gallery/catalog images.
            Assert.DoesNotContain("/media/products/banners/", html[(html.IndexOf(hero, StringComparison.Ordinal) + hero.Length)..]);
        }
        Assert.DoesNotContain("/media/products/banners/", await client.GetStringAsync("/lentes"));
    }

    [Fact]
    public async Task ServedWebpFilesMatchTheVerifiedOpaqueTwoTimesExports()
    {
        var environment = factory.Services.GetRequiredService<IWebHostEnvironment>();
        var root = new DirectoryInfo(environment.ContentRootPath).Parent!.Parent!.FullName;
        using var manifest = JsonDocument.Parse(File.ReadAllText(Path.Combine(root, "docs", "product-banner-assets.json")));
        var assets = manifest.RootElement.GetProperty("assets").EnumerateArray().ToArray();
        Assert.Equal(16, assets.Length); // Short variants reuse the same photographs.
        Assert.Equal(assets.Select(a => a.GetProperty("url").GetString()).Order(),
            Slugs.Select(ProductBannerAsset.ForSlug).Select(a => $"/media/products/banners/{a.File}").Distinct().Order());
        foreach (var asset in assets)
        {
            var banner = ProductBannerAsset.ForSlug(asset.GetProperty("slug").GetString()!);
            Assert.Equal(2, asset.GetProperty("exportScale").GetInt32());
            Assert.True(asset.GetProperty("opaque").GetBoolean());
            Assert.Equal(banner.Width, asset.GetProperty("width").GetInt32());
            Assert.Equal(banner.Height, asset.GetProperty("height").GetInt32());
            using var response = await client.GetAsync(asset.GetProperty("url").GetString());
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Equal("image/webp", response.Content.Headers.ContentType?.MediaType);
            var bytes = await response.Content.ReadAsByteArrayAsync();
            Assert.Equal(asset.GetProperty("bytes").GetInt32(), bytes.Length);
            Assert.Equal(asset.GetProperty("sha256").GetString(), Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant());
        }
    }

    [Fact]
    public async Task MobileCompleteExportsDoNotKeepTheOldTransparentCanvasStretch()
    {
        var css = await client.GetStringAsync("/css/product-presentation.css");
        var rule = Regex.Match(css, @"#main :is\(\.monofocal-product--outdoor, \.monofocal-product--indoor, \.bop-product--office\) \[data-product-banner\]\s*\{[^}]+\}").Value;
        Assert.Contains("width: auto", rule);
        Assert.Contains("height: 440px", rule);
        Assert.Contains("object-fit: cover", rule);
    }
}
