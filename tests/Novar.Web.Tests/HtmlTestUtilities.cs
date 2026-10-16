using System.Text.RegularExpressions;

namespace Novar.Web.Tests;

internal static class HtmlTestUtilities
{
    private static readonly Regex LanguagePreferenceForm = new(
        "<form class=\\\"language language-form\\\"[\\s\\S]*?</form>", RegexOptions.Compiled);

    public static string WithoutLanguagePreferenceForm(this string html) =>
        LanguagePreferenceForm.Replace(html, string.Empty);
}
