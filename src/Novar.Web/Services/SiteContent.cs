using System.Text.Json;
using Novar.Web.Models;

namespace Novar.Web.Services;

public sealed class SiteContent
{
    public HomeContent Home { get; }
    public ProductContent First { get; }
    public AboutContent About { get; }
    public GamesContent Games { get; }
    public TreatmentsContent Treatments { get; }
    public IReadOnlyDictionary<string, PremiumProduct> PremiumProducts { get; }
    public IReadOnlyDictionary<string, ProgressiveProduct> ProgressiveProducts { get; }
    public IReadOnlyDictionary<string, MonofocalProduct> MonofocalProducts { get; }
    public IReadOnlyDictionary<string, BifocalOccupationalProduct> BifocalOccupationalProducts { get; }
    public IReadOnlySet<string> PlannedProducts { get; }
    public LensFinderPage LensFinder { get; }

    public SiteContent(IWebHostEnvironment environment)
    {
        var directory = Path.Combine(environment.ContentRootPath, "Content");
        Home = Read<HomeContent>(directory, "home.json");
        First = Read<ProductContent>(directory, "first.json");
        About = Read<AboutContent>(directory, "about.json");
        Games = Read<GamesContent>(directory, "games.json");
        Treatments = Read<TreatmentsContent>(directory, "treatments.json");
        PremiumProducts = Read<PremiumProduct[]>(directory, "premium-products.json")
            .ToDictionary(product => product.Slug, StringComparer.Ordinal);
        ProgressiveProducts = Read<ProgressiveProduct[]>(directory, "progressive-products.json")
            .ToDictionary(product => product.Slug, StringComparer.Ordinal);
        MonofocalProducts = Read<MonofocalProduct[]>(directory, "monofocal-products.json")
            .ToDictionary(product => product.Slug, StringComparer.Ordinal);
        BifocalOccupationalProducts = Read<BifocalOccupationalProduct[]>(directory, "bifocal-occupational-products.json")
            .ToDictionary(product => product.Slug, StringComparer.Ordinal);
        PlannedProducts = Read<string[]>(directory, "planned-products.json").ToHashSet(StringComparer.Ordinal);

        if (First.Slug != "first" || PlannedProducts.Count != 0 || PlannedProducts.Contains(First.Slug)
            || !PremiumProducts.Keys.ToHashSet(StringComparer.Ordinal).SetEquals(["ai-lens", "myolens", "aiwork"])
            || PremiumProducts.Keys.Any(PlannedProducts.Contains)
            || !ProgressiveProducts.Keys.ToHashSet(StringComparer.Ordinal).SetEquals(["precisa", "precisa-short", "evolution", "evolution-short", "elife"])
            || ProgressiveProducts.Keys.Any(slug => slug == First.Slug || PremiumProducts.ContainsKey(slug) || PlannedProducts.Contains(slug))
            || !MonofocalProducts.Keys.ToHashSet(StringComparer.Ordinal).SetEquals(["geo", "single-vision", "outdoor", "indoor", "slim"])
            || MonofocalProducts.Keys.Any(slug => slug == First.Slug || PremiumProducts.ContainsKey(slug) || ProgressiveProducts.ContainsKey(slug) || PlannedProducts.Contains(slug))
            || !BifocalOccupationalProducts.Keys.ToHashSet(StringComparer.Ordinal).SetEquals(["kriptok-blended", "ultex-blended", "freeline", "office"])
            || BifocalOccupationalProducts.Keys.Any(slug => slug == First.Slug || PremiumProducts.ContainsKey(slug) || ProgressiveProducts.ContainsKey(slug) || MonofocalProducts.ContainsKey(slug) || PlannedProducts.Contains(slug))
            || BifocalOccupationalProducts.Values.Any(product => product.Category != (product.Slug == "office" ? "Ocupacionales" : "Bifocales")))
        {
            throw new InvalidDataException("The catalog must declare 18 disjoint implemented product identities across First, Premium, Progresivos, Monofocales, Bifocales and Ocupacionales, with no deferred products.");
        }

        var productNames = PremiumProducts.Values.Select(p => (p.Slug, p.Name))
            .Concat(ProgressiveProducts.Values.Select(p => (p.Slug, p.Name)))
            .Concat(MonofocalProducts.Values.Select(p => (p.Slug, p.Name)))
            .Concat(BifocalOccupationalProducts.Values.Select(p => (p.Slug, p.Name)))
            .Append((First.Slug, First.Name)).ToDictionary(p => p.Slug, p => p.Name, StringComparer.Ordinal);
        LensFinder = Read<LensFinderConfig>(directory, "lens-finder.json").Project(productNames);
    }

    private static T Read<T>(string directory, string name) =>
        JsonSerializer.Deserialize<T>(File.ReadAllText(Path.Combine(directory, name)),
            new JsonSerializerOptions(JsonSerializerDefaults.Web))
        ?? throw new InvalidDataException($"Invalid content file: {name}");
}
