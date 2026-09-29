namespace Novar.Web.Models;

public sealed record MonofocalIcon(string File, string Label);
public sealed record MonofocalBenefit(string Label, string Level);
public sealed record MonofocalText(string Text, string[] Emphasis);
public sealed record MonofocalProduct(
    string Name, string Slug, string SourceNode, string Wordmark, string WordmarkNode,
    string Hero, string? HeroUnderlay, string Subtitle, string Description, string Tagline,
    string IntroHeading, string IntroEyebrow, string Intro, string Scene,
    MonofocalIcon[] Icons, string[] Gallery, string GalleryRegistered,
    string DetailHeading, string Details, string Design, string IdealFor,
    string TechnologySpec, string Detail, string[] Tags,
    Technology[] Technologies, MonofocalBenefit[] Benefits, Faq[] Questions,
    string[] IntroEmphasis, string[] DetailEmphasis);
