namespace Novar.Web.Models;

// Main banners only. Catalog cards and galleries keep their original image references.
// Dimensions and Figma export provenance: docs/product-banner-assets.json.
public sealed record ProductBannerAsset(string File, string SourceNode, int Width, int Height)
{
    public static ProductBannerAsset ForSlug(string slug) => slug switch
    {
        "first" => new("first-2x.webp", "689:4834", 2880, 1522),
        "precisa" => new("precisa-2x.webp", "974:904", 2880, 1525),
        "precisa-short" => new("precisa-2x.webp", "982:222", 2880, 1525),
        "evolution" => new("evolution-2x.webp", "964:3015", 2880, 1533),
        "evolution-short" => new("evolution-2x.webp", "1092:235", 2880, 1533),
        "elife" => new("elife-2x.webp", "974:547", 2880, 1526),
        "geo" => new("geo-2x.webp", "964:2244", 2880, 1522),
        "single-vision" => new("single-vision-2x.webp", "992:1255", 2880, 1522),
        "outdoor" => new("outdoor-2x.webp", "995:11749", 2880, 1530),
        "indoor" => new("indoor-2x.webp", "995:11751", 2879, 1610),
        "slim" => new("slim-2x.webp", "992:2113", 2880, 1522),
        "kriptok-blended" => new("kriptok-blended-2x.webp", "989:713", 2879, 1522),
        "ultex-blended" => new("ultex-blended-2x.webp", "992:2399", 2880, 1522),
        "freeline" => new("freeline-2x.webp", "992:2681", 2880, 1522),
        "office" => new("office-2x.webp", "1103:237", 2880, 1530),
        "ai-lens" => new("ai-lens-2x.webp", "977:10921", 2880, 1593),
        "myolens" => new("myolens-2x.webp", "977:11243", 2880, 1593),
        "aiwork" => new("aiwork-2x.webp", "988:11448", 2880, 1593),
        _ => throw new ArgumentOutOfRangeException(nameof(slug), slug, "Unknown product banner")
    };
}
