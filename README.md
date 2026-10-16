# NOVAR

Sitio web de NOVAR desarrollado con ASP.NET Core MVC / .NET 10, Razor, Bootstrap local y JavaScript. Incluye Home, Sobre nosotros, catálogo y fichas de lentes, Tratamientos y Juegos.

El contenido está disponible en español, inglés y portugués de Brasil. Los textos, imágenes y videos del proyecto se conservan en archivos locales; no se necesitan enlaces temporales de Figma para ejecutar el sitio.

## Requisitos

- .NET SDK 10, según `global.json`.
- Git y Git LFS, necesarios para descargar los videos originales y optimizados.
- Node.js y npm solamente para las pruebas de JavaScript y las herramientas de revisión visual.

## Descargar y ejecutar

```powershell
git lfs install
git clone https://github.com/Tommrbn/novar.git
cd novar
git lfs pull
dotnet restore Novar.sln
dotnet run --project src/Novar.Web --urls http://localhost:5080
```

Abrí `http://localhost:5080/`. También podés abrir `Novar.sln` en Visual Studio con la carga de trabajo de ASP.NET.

Si el puerto 5080 está ocupado, usá otro puerto libre; no hace falta detener otros procesos. Al descargar un ZIP desde GitHub, verificá que los videos sean archivos reales y no punteros de Git LFS. Para obtener una copia completa se recomienda clonar el repositorio y ejecutar `git lfs pull`.

### Rutas principales

| Ruta | Contenido |
|---|---|
| `/` | Home |
| `/sobre-nosotros` | Información institucional |
| `/lentes` | Catálogo y buscador de lentes |
| `/lentes/{slug}` | Fichas de productos, por ejemplo `first`, `precisa` y `ai-lens` |
| `/tratamientos` | Los siete tratamientos, seleccionables mediante solapas |
| `/juegos` | Juegos visuales |

## Verificar

```powershell
dotnet test Novar.sln -c Release
npm ci
node --test tests/js/*.test.cjs
```

Para las herramientas de revisión visual, con el servidor local ya iniciado:

```powershell
npx playwright install chromium
npm run test:ui
```

`NOVAR_BASE_URL` permite apuntar las herramientas a otra dirección local. Las evidencias y resultados temporales se guardan en `artifacts/`, que no se versiona. Las pruebas automáticas no sustituyen la revisión visual ni la aceptación del diseño.

## Estructura

- `src/Novar.Web/`: aplicación MVC, vistas, estilos y scripts.
- `src/Novar.Web/Content/`: contenido base en español y traducciones en `Locales/` y `Translations/`.
- `src/Novar.Web/wwwroot/media/`: imágenes y videos originales y optimizados.
- `src/Novar.Web/wwwroot/lib/`: dependencias del navegador incluidas localmente, con sus licencias.
- `tests/Novar.Web.Tests/`: pruebas de integración de .NET.
- `tests/js/`: pruebas de JavaScript.
- `tools/`: herramientas de medios y revisión visual.
- `docs/`: procedencia de recursos y notas de implementación; algunas notas reflejan etapas anteriores del proyecto.
- `DESIGN.md` y `.impeccable/design.json`: referencias del sistema visual.

## Medios, configuración y alcance

Los archivos `*.mp4` y `*.webm` se versionan con Git LFS. Conservá los originales; las variantes optimizadas permiten reducir el costo de carga y reproducción del sitio.

No se versionan dependencias de desarrollo descargadas, compilaciones, cachés, logs, credenciales ni configuración local. Los archivos `appsettings.json` incluidos contienen únicamente configuración general de logging y hosts.

Subir el código a GitHub no publica el sitio ni configura alojamiento, base de datos, correo o integraciones externas. Algunas acciones del sitio todavía muestran avisos de integración pendiente. El despliegue y las integraciones requieren una configuración y validación separadas.
