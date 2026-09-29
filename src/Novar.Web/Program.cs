using Novar.Web.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllersWithViews();
builder.Services.AddSingleton<SiteContent>();

var app = builder.Build();
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
