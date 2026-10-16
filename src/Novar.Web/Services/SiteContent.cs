using System.Text.Json;
using System.Globalization;
using Novar.Web.Models;

namespace Novar.Web.Services;

public sealed class SiteContent
{
    public HomeContent Home { get; private set; } = null!;
    public ProductContent First { get; private set; } = null!;
    public AboutContent About { get; private set; } = null!;
    public GamesContent Games { get; private set; } = null!;
    public TreatmentsContent Treatments { get; private set; } = null!;
    public IReadOnlyDictionary<string, PremiumProduct> PremiumProducts { get; private set; } = null!;
    public IReadOnlyDictionary<string, ProgressiveProduct> ProgressiveProducts { get; private set; } = null!;
    public IReadOnlyDictionary<string, MonofocalProduct> MonofocalProducts { get; private set; } = null!;
    public IReadOnlyDictionary<string, BifocalOccupationalProduct> BifocalOccupationalProducts { get; private set; } = null!;
    public IReadOnlySet<string> PlannedProducts { get; private set; } = null!;
    public LensFinderPage LensFinder { get; private set; } = null!;

    private SiteContent? _english;
    private SiteContent? _portuguese;

    public SiteContent(IWebHostEnvironment environment)
        : this(Path.Combine(environment.ContentRootPath, "Content"), loadLocales: true)
    {
    }

    private SiteContent(string directory, bool loadLocales = false)
    {
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

        if (loadLocales && (First.Slug != "first" || PlannedProducts.Count != 0 || PlannedProducts.Contains(First.Slug)
            || !PremiumProducts.Keys.ToHashSet(StringComparer.Ordinal).SetEquals(["ai-lens", "myolens", "aiwork"])
            || PremiumProducts.Keys.Any(PlannedProducts.Contains)
            || !ProgressiveProducts.Keys.ToHashSet(StringComparer.Ordinal).SetEquals(["precisa", "precisa-short", "evolution", "evolution-short", "elife"])
            || ProgressiveProducts.Keys.Any(slug => slug == First.Slug || PremiumProducts.ContainsKey(slug) || PlannedProducts.Contains(slug))
            || !MonofocalProducts.Keys.ToHashSet(StringComparer.Ordinal).SetEquals(["geo", "single-vision", "outdoor", "indoor", "slim"])
            || MonofocalProducts.Keys.Any(slug => slug == First.Slug || PremiumProducts.ContainsKey(slug) || ProgressiveProducts.ContainsKey(slug) || PlannedProducts.Contains(slug))
            || !BifocalOccupationalProducts.Keys.ToHashSet(StringComparer.Ordinal).SetEquals(["kriptok-blended", "ultex-blended", "freeline", "office"])
            || BifocalOccupationalProducts.Keys.Any(slug => slug == First.Slug || PremiumProducts.ContainsKey(slug) || ProgressiveProducts.ContainsKey(slug) || MonofocalProducts.ContainsKey(slug) || PlannedProducts.Contains(slug))
            || BifocalOccupationalProducts.Values.Any(product => product.Category != (product.Slug == "office" ? "Ocupacionales" : "Bifocales"))))
        {
            throw new InvalidDataException("The catalog must declare 18 disjoint implemented product identities across First, Premium, Progresivos, Monofocales, Bifocales and Ocupacionales, with no deferred products.");
        }

        var productNames = PremiumProducts.Values.Select(p => (p.Slug, p.Name))
            .Concat(ProgressiveProducts.Values.Select(p => (p.Slug, p.Name)))
            .Concat(MonofocalProducts.Values.Select(p => (p.Slug, p.Name)))
            .Concat(BifocalOccupationalProducts.Values.Select(p => (p.Slug, p.Name)))
            .Append((First.Slug, First.Name)).ToDictionary(p => p.Slug, p => p.Name, StringComparer.Ordinal);
        LensFinder = Read<LensFinderConfig>(directory, "lens-finder.json").Project(productNames);

        if (loadLocales)
        {
            _english = new SiteContent(Path.Combine(directory, "Locales", "en"));
            _portuguese = new SiteContent(Path.Combine(directory, "Locales", "pt-BR"));
        }
    }

    public SiteContent ForCulture(CultureInfo culture) => culture.Name switch
    {
        "en" => _english ?? this,
        "pt-BR" => _portuguese ?? this,
        _ => this
    };

    private static T Read<T>(string directory, string name) =>
        JsonSerializer.Deserialize<T>(File.ReadAllText(Path.Combine(directory, name)),
            new JsonSerializerOptions(JsonSerializerDefaults.Web))
        ?? throw new InvalidDataException($"Invalid content file: {name}");
}
