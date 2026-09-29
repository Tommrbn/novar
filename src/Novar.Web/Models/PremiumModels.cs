namespace Novar.Web.Models;

public sealed record PremiumImage(string File, string SourceNode, string Alt, int Width, int Height);
public sealed record PremiumBenefit(string Label, string Icon, string SourceNode);
public sealed record PremiumCallout(string Slot, string Text, string SourceNode, string? SecondaryText = null);
public sealed record PremiumProduct(
    string Name, string Slug, string SourceNode, string HeroCopy,
    PremiumImage Hero, PremiumImage Feature, PremiumImage Gallery,
    string TechnologyTitle, string TechnologyDescription, PremiumBenefit[] Benefits,
    PremiumCallout[] Callouts, string TechnologyName, string TechnologySummary,
    string GalleryCaption, string Watermark, Faq[] Questions, int OpenQuestion);
