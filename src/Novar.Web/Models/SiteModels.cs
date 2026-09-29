namespace Novar.Web.Models;

public sealed record Faq(string Question, string? Answer);
public sealed record Benefit(string Label, string Level, int Percent);
public sealed record Highlight(string Name, string Slug, string Image, string Description, Benefit[] Benefits);
public sealed record HomeContent(Highlight[] Highlights, Faq[] Questions);
public sealed record Technology(string Name, string Description);
public sealed record ProductContent(
    string Name, string Slug, string SourceNode, string Subtitle, string Description,
    string Intro, string Details, string IdealFor, Benefit[] Benefits,
    Technology[] Technologies, Faq[] Questions);
public sealed record PendingPage(string Title);
public sealed record FaqSection(string Id, Faq[] Questions, int? OpenIndex = null);
public sealed record AboutItem(string Title, string Description);
public sealed record AboutContent(
    string SourceNode, string Eyebrow, string TitleLead, string TitleRest,
    string SectionTitle, string Tagline, string IntroLead, string IntroRest,
    string[] Paragraphs, AboutItem[] Pillars, string ValuesEyebrow,
    string ValuesTitle, AboutItem[] Values);
