using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Localization;
using Novar.Web.Models;
using Novar.Web.Services;
using System.Globalization;

namespace Novar.Web.Controllers;

public sealed class HomeController(SiteContent content, SiteText text) : Controller
{
    [HttpGet("/")]
    public IActionResult Index() => View(content.ForCulture(CultureInfo.CurrentUICulture).Home);

    [HttpGet("/lentes/{slug}")]
    public IActionResult Product(string slug)
    {
        var localized = content.ForCulture(CultureInfo.CurrentUICulture);
        if (slug == localized.First.Slug)
        {
            return View("First", localized.First);
        }

        if (localized.PremiumProducts.TryGetValue(slug, out var premium))
        {
            return View("Premium", premium);
        }

        if (localized.ProgressiveProducts.TryGetValue(slug, out var progressive))
        {
            return View("ProgressiveProduct", progressive);
        }

        if (localized.MonofocalProducts.TryGetValue(slug, out var monofocal))
        {
            return View("MonofocalProduct", monofocal);
        }

        if (localized.BifocalOccupationalProducts.TryGetValue(slug, out var bifocalOccupational))
        {
            return View("BifocalOccupationalProduct", bifocalOccupational);
        }

        return localized.PlannedProducts.Contains(slug)
            ? View("Pending", new PendingPage(text["Ficha en preparación"]))
            : NotFound();
    }

    [HttpGet("/lentes")]
    public IActionResult Catalog() => View(content.ForCulture(CultureInfo.CurrentUICulture).LensFinder);

    [HttpGet("/sobre-nosotros")]
    public IActionResult About() => View(content.ForCulture(CultureInfo.CurrentUICulture).About);

    [HttpGet("/tratamientos")]
    public IActionResult Treatments() => View(content.ForCulture(CultureInfo.CurrentUICulture).Treatments);

    [HttpGet("/juegos")]
    public IActionResult Games() => View(content.ForCulture(CultureInfo.CurrentUICulture).Games);

    [HttpPost("/language")]
    [ValidateAntiForgeryToken]
    public IActionResult ChangeLanguage([FromForm] string? culture, [FromForm] string? returnUrl)
    {
        var selected = SiteText.NormalizeCulture(culture) ?? "es";
        Response.Cookies.Append(
            CookieRequestCultureProvider.DefaultCookieName,
            CookieRequestCultureProvider.MakeCookieValue(new RequestCulture(selected)),
            new CookieOptions
            {
                Path = "/",
                HttpOnly = true,
                IsEssential = true,
                SameSite = SameSiteMode.Lax,
                Secure = Request.IsHttps,
                Expires = DateTimeOffset.UtcNow.AddYears(1)
            });

        return LocalRedirect(IsSafeLocalReturnUrl(returnUrl) ? returnUrl! : "/");
    }

    private bool IsSafeLocalReturnUrl(string? returnUrl) =>
        !string.IsNullOrWhiteSpace(returnUrl)
        && returnUrl.StartsWith("/", StringComparison.Ordinal)
        && !returnUrl.StartsWith("//", StringComparison.Ordinal)
        && !returnUrl.StartsWith("/\\", StringComparison.Ordinal)
        && Url.IsLocalUrl(returnUrl);

    [Route("/estado/{code:int}")]
    public IActionResult Status(int code)
    {
        Response.StatusCode = code;
        return View("Status", code);
    }

    [Route("/error")]
    public IActionResult Error()
    {
        Response.StatusCode = 500;
        return View("Status", 500);
    }
}
