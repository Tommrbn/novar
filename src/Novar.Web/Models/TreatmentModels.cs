namespace Novar.Web.Models;

public sealed record TreatmentText(string Text, bool Emphasis = false);
public sealed record TreatmentTab(string Id, string Label, bool Available);
public sealed record TreatmentDetail(
    string Id, string SourceNode, string Name, string Description, string Image, string[] Benefits);
public sealed record TreatmentComparison(string Number, string Name, string Description, string[] Benefits);
public sealed record TreatmentsContent(
    string SourceNode, string TitleLead, string TitleStrong, TreatmentText[] Intro,
    string HeroImage, TreatmentTab[] Tabs, TreatmentDetail[] Details,
    string ComparisonLabel, string ComparisonTitle, TreatmentComparison[] Comparison,
    string SophiaTitle, string SophiaDescription, string SophiaAction);
