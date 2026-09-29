using System.Diagnostics.CodeAnalysis;
using System.Text.RegularExpressions;

namespace Novar.Web.Models;

public sealed record LensFinderNeed(string Id, string Label);
public sealed record LensFinderPreference(string Id, string Need, string Label, string[] Slugs);
public sealed record LensFinderProduct(string Slug, string Need, string Reason);
public sealed record LensFinderReplacement(string From, string To);
public sealed record LensFinderCompact(string Label, LensFinderReplacement[] Replacements);
public sealed record LensFinderCard(string Slug, string Need, string Reason, string Name, string Href);
public sealed record LensFinderPage(string Notice, LensFinderNeed[] Needs,
    LensFinderPreference[] Preferences, LensFinderCompact Compact, LensFinderCard[] Products);

public sealed record LensFinderConfig(string Notice, LensFinderNeed[] Needs,
    LensFinderPreference[] Preferences, LensFinderCompact Compact, LensFinderProduct[] Products)
{
    public LensFinderPage Project(IReadOnlyDictionary<string, string> names)
    {
        static bool Id(string? value) => value is not null && Regex.IsMatch(value, "^[a-z][a-z0-9-]*$");
        static bool Text(string? value) => !string.IsNullOrWhiteSpace(value);
        static void Require([DoesNotReturnIf(false)] bool valid)
        {
            if (!valid) throw new InvalidDataException("Invalid lens finder configuration or catalog references.");
        }

        Require(Text(Notice) && Needs is { Length: > 0 } && Preferences is not null
            && Products is { Length: > 0 } && Compact?.Replacements is { Length: > 0 });
        Require(Needs!.All(n => n is not null && Id(n.Id) && Text(n.Label)));
        var needs = Needs.Select(n => n.Id).ToHashSet(StringComparer.Ordinal);
        Require(needs.Count == Needs.Length && needs.Contains("unsure"));
        Require(Products!.All(p => p is not null && Id(p.Slug) && needs.Contains(p.Need)
            && p.Need != "unsure" && Text(p.Reason)));
        var slugs = Products.Select(p => p.Slug).ToHashSet(StringComparer.Ordinal);
        Require(slugs.Count == Products.Length && slugs.SetEquals(names.Keys));
        Require(needs.Where(n => n != "unsure").All(n => Products.Any(p => p.Need == n)));
        var bySlug = Products.ToDictionary(p => p.Slug, StringComparer.Ordinal);
        Require(Preferences!.All(p => p is not null && Id(p.Id) && Text(p.Label)
            && needs.Contains(p.Need) && p.Need != "unsure" && p.Slugs is { Length: > 0 }
            && p.Slugs.Distinct(StringComparer.Ordinal).Count() == p.Slugs.Length
            && p.Slugs.All(s => slugs.Contains(s) && bySlug[s].Need == p.Need)));
        Require(Preferences.Select(p => p.Id).Distinct(StringComparer.Ordinal).Count() == Preferences.Length);
        Require(Text(Compact!.Label) && Compact.Replacements.All(r => r is not null
            && r.From != r.To && slugs.Contains(r.From) && slugs.Contains(r.To)
            && bySlug[r.From].Need == bySlug[r.To].Need
            && Preferences.Any(p => p.Slugs.Contains(r.From, StringComparer.Ordinal))));
        Require(Compact.Replacements.Select(r => r.From).Distinct(StringComparer.Ordinal).Count() == Compact.Replacements.Length
            && Compact.Replacements.Select(r => r.To).Distinct(StringComparer.Ordinal).Count() == Compact.Replacements.Length
            && !Compact.Replacements.Any(r => Compact.Replacements.Any(other => other.From == r.To)));
        Require(names.Values.All(Text));
        return new(Notice, Needs, Preferences, Compact,
            Products.Select(p => new LensFinderCard(p.Slug, p.Need, p.Reason,
                names[p.Slug], $"/lentes/{p.Slug}")).ToArray());
    }
}
