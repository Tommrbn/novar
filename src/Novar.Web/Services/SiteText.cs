using System.Globalization;
using System.Text.Json;

namespace Novar.Web.Services;

/// <summary>Immutable, local UI translations selected by the current request culture.</summary>
public sealed class SiteText
{
    private readonly IReadOnlyDictionary<string, string> _english;
    private readonly IReadOnlyDictionary<string, string> _portuguese;

    public SiteText(IWebHostEnvironment environment)
    {
        var directory = Path.Combine(environment.ContentRootPath, "Content", "Translations");
        _english = Read(Path.Combine(directory, "en.json"));
        _portuguese = Read(Path.Combine(directory, "pt-BR.json"));
    }

    public string this[string spanishSource] => Get(spanishSource);

    public IReadOnlyDictionary<string, string> JavaScriptMessages => CurrentTranslations()
        .Where(item => item.Key.StartsWith("js:", StringComparison.Ordinal))
        .ToDictionary(item => item.Key[3..], item => item.Value, StringComparer.Ordinal);

    public string Get(string spanishSource)
    {
        var translations = CurrentTranslations();

        return translations is not null && translations.TryGetValue(spanishSource, out var translated)
            ? translated
            : spanishSource;
    }

    public static string? NormalizeCulture(string? value) => value?.Trim().ToLowerInvariant() switch
    {
        "es" => "es",
        "en" => "en",
        "pt" or "pt-br" => "pt-BR",
        _ => null
    };

    private IReadOnlyDictionary<string, string> CurrentTranslations() => CultureInfo.CurrentUICulture.Name switch
    {
        "en" => _english,
        "pt-BR" => _portuguese,
        _ => EmptyTranslations
    };

    private static IReadOnlyDictionary<string, string> EmptyTranslations { get; } =
        new System.Collections.ObjectModel.ReadOnlyDictionary<string, string>(new Dictionary<string, string>());

    private static IReadOnlyDictionary<string, string> Read(string path)
    {
        var dictionary = JsonSerializer.Deserialize<Dictionary<string, string>>(File.ReadAllText(path))
            ?? throw new InvalidDataException($"Invalid translation catalog: {Path.GetFileName(path)}");

        return new System.Collections.ObjectModel.ReadOnlyDictionary<string, string>(dictionary);
    }
}
