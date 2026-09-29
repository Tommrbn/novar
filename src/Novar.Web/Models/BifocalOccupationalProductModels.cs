namespace Novar.Web.Models;

public sealed record BifocalOccupationalIcon(string File, string Label);
public sealed record BifocalOccupationalBenefit(string Label, string Level);

public sealed record BifocalOccupationalProduct(
    string Name, string Slug, string SourceNode, string Category,
    string Wordmark, string WordmarkNode, string Hero, string? HeroUnderlay, string? HeroEyebrow,
    string Subtitle, string Description, string Tagline,
    string IntroHeading, string IntroEyebrow, string Intro, string Scene,
    BifocalOccupationalIcon[] Icons, string[] Gallery, string GalleryName,
    string Details, string Design, string IdealFor, string TechnologySpec,
    string Detail, string Tag, string Watermark,
    Technology[] Technologies, BifocalOccupationalBenefit[] Benefits, Faq[] Questions);
