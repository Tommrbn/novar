using Microsoft.AspNetCore.Mvc;
using Novar.Web.Models;
using Novar.Web.Services;

namespace Novar.Web.Controllers;

public sealed class HomeController(SiteContent content) : Controller
{
    [HttpGet("/")]
    public IActionResult Index() => View(content.Home);

    [HttpGet("/lentes/{slug}")]
    public IActionResult Product(string slug)
    {
        if (slug == content.First.Slug)
        {
            return View("First", content.First);
        }

        if (content.PremiumProducts.TryGetValue(slug, out var premium))
        {
            return View("Premium", premium);
        }

        if (content.ProgressiveProducts.TryGetValue(slug, out var progressive))
        {
            return View("ProgressiveProduct", progressive);
        }

        if (content.MonofocalProducts.TryGetValue(slug, out var monofocal))
        {
            return View("MonofocalProduct", monofocal);
        }

        if (content.BifocalOccupationalProducts.TryGetValue(slug, out var bifocalOccupational))
        {
            return View("BifocalOccupationalProduct", bifocalOccupational);
        }

        return content.PlannedProducts.Contains(slug)
            ? View("Pending", new PendingPage("Ficha en preparación"))
            : NotFound();
    }

    [HttpGet("/lentes")]
    public IActionResult Catalog() => View(content.LensFinder);

    [HttpGet("/sobre-nosotros")]
    public IActionResult About() => View(content.About);

    [HttpGet("/tratamientos")]
    public IActionResult Treatments() => View(content.Treatments);

    [HttpGet("/juegos")]
    public IActionResult Games() => View(content.Games);

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
