namespace Novar.Web.Models;

public sealed record ProgressiveIcon(string File, string Label);
public sealed record ProgressiveBenefit(string Label, string Level);
public sealed record ProgressiveText(string Text, string[] Emphasis);
public sealed record ProgressiveProduct(
    string Name, string Slug, string SourceNode, string Wordmark, string WordmarkNode,
    string Hero, string? HeroUnderlay, string Subtitle, string Description, string Tagline,
    string IntroHeading, string IntroEyebrow, string Intro, string Scene,
    ProgressiveIcon[] Icons, string[] Gallery, string GalleryName,
    string DetailHeading, string Details, string Design, string IdealFor,
    string TechnologySpec, string Detail, string[] Tags,
    Technology[] Technologies, ProgressiveBenefit[] Benefits, Faq[] Questions,
    string[] IntroEmphasis, string[] DetailEmphasis);
