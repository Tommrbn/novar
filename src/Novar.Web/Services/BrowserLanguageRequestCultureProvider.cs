using Microsoft.AspNetCore.Localization;
using Microsoft.Net.Http.Headers;

namespace Novar.Web.Services;

/// <summary>
/// Uses the first supported browser language only when no explicit culture cookie exists.
/// Portuguese variants map to Brazilian Portuguese; English variants map to English.
/// </summary>
public sealed class BrowserLanguageRequestCultureProvider : RequestCultureProvider
{
    public override Task<ProviderCultureResult?> DetermineProviderCultureResult(HttpContext httpContext)
    {
        ArgumentNullException.ThrowIfNull(httpContext);

        var languages = httpContext.Request.GetTypedHeaders().AcceptLanguage;
        if (languages is null || languages.Count == 0)
        {
            return NullResult();
        }

        foreach (var language in languages
                     .Where(item => item.Quality is null or > 0)
                     .OrderByDescending(item => item.Quality ?? 1))
        {
            var value = language.Value.Value;
            if (string.IsNullOrWhiteSpace(value) || value == "*")
            {
                continue;
            }

            var culture = value.StartsWith("pt", StringComparison.OrdinalIgnoreCase) ? "pt-BR"
                : value.StartsWith("en", StringComparison.OrdinalIgnoreCase) ? "en"
                : value.StartsWith("es", StringComparison.OrdinalIgnoreCase) ? "es"
                : null;

            if (culture is not null)
            {
                return Task.FromResult<ProviderCultureResult?>(new ProviderCultureResult(culture));
            }
        }

        return NullResult();
    }

    private static Task<ProviderCultureResult?> NullResult() => Task.FromResult<ProviderCultureResult?>(null);
}
