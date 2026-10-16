using Novar.Web.Services;
using Microsoft.AspNetCore.Localization;
using System.Globalization;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllersWithViews();
builder.Services.AddSingleton<SiteText>();
builder.Services.AddSingleton<SiteContent>();

var supportedCultures = new[] { "es", "en", "pt-BR" }
    .Select(CultureInfo.GetCultureInfo)
    .ToArray();
builder.Services.Configure<RequestLocalizationOptions>(options =>
{
    options.DefaultRequestCulture = new RequestCulture("es");
    options.SupportedCultures = supportedCultures;
    options.SupportedUICultures = supportedCultures;
    options.RequestCultureProviders =
    [
        new CookieRequestCultureProvider(),
        new BrowserLanguageRequestCultureProvider()
    ];
});

var app = builder.Build();
app.UseRequestLocalization();
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/error");
}

app.UseStatusCodePagesWithReExecute("/estado/{0}");
app.UseStaticFiles();
app.UseRouting();
app.MapControllers();
app.Run();

public partial class Program;
