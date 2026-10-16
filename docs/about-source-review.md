# Sobre nosotros: source and verification map

Only `/sobre-nosotros` is implemented by this work unit. Figma frame [961:6952](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=961-6952) is the authoritative 1440 x 2098 reference. Fresh high-fidelity design context and its screenshot were inspected before implementation. The screenshot is a comparison target, not an implementation asset.

## Content and presentation

- `Content/about.json` preserves the institutional copy, three pillars and four values verbatim; `SiteContent.About` supplies typed records to `Views/Home/About.cshtml`.
- `wwwroot/css/about.css` loads only when `AboutPage` is true. The shared layout selects original About header assets, active navigation and `_AboutFooter`; other routes retain their old markup branch and stylesheet.
- `Index.cshtml`, `First.cshtml`, `_Footer.cshtml` and `site.css` remain byte-identical to the delegated baseline, including accepted Home newsletter/social fixes.
- Header, footer destinations and the existing Bootstrap pending modal are real keyboard-operable controls. No new form, integration, tracking or remote runtime asset is introduced. The About footer correctly labels the source order Instagram, LinkedIn, Facebook, YouTube without modifying the pre-existing shared social partial.

## Desktop typography and geometry

All type uses the existing local Poppins faces, without synthetic replacement fonts.

| Slot | Source metrics | Implementation |
|---|---|---|
| Main title | 38px / 32.394px; Medium500 `Novar`, Light300 remainder | Center offset -32.25px, source gradient enclosure |
| Conocenos | Regular40018px / 70.678px, -.54px tracking | Original overlaid title-group spacing |
| Institutional label | Medium50020px / 52.063px | Left column x130 at1440 |
| Tagline / pillars | Light30013px / 14.751px | Source three-column pillar arrangement |
| Institutional statement | Light30024px / 35.47px, -.72px; Regular400 emphasis | Right copy x631, width563.648 maximum |
| History paragraphs | Regular40014px / 22.75px, width456 | Source paragraph spacing and text |
| Values eyebrow | SemiBold60012px / 16px,1.2px tracking |24px row |
| Values title | Medium50030px / 36px,-.6px tracking |8px top padding |
| Value cards | SemiBold60018px / 28px; Regular40014px / 22.75px |476px cards at1440,32px padding,16px radius,24px gap |
| Sections | Intro1035px; values595px; footer468px | Source boundaries preserved at1440 when the local font is loaded |

The header collapses below1200px to keep full labels and44px mobile targets. Below768px the story, pillars and values stack without scaling text or SVGs. Footer columns become two, then one below400px. Desktop social controls use32.4443px targets (the wider YouTube target is39.7297px), preserving the source15.268px space between intrinsic icons while exceeding the24px WCAG2.2 minimum. Mobile controls are44px with12px gaps. Mobile/tablet layout is an implementation proposal requiring owner review.

## Original asset slots and layers

Four missing files were downloaded directly from the URLs returned by design context; ten exact existing exports were reused. No source SVG path or raster pixels were modified. Temporary download URLs are not persisted in code or this document. SHA-256 provenance is in `asset-provenance.json`.

| Local asset (under `wwwroot/media/figma/`) | Source node / slot | Intrinsic size and placement |
|---|---|---|
| `c9741.png` |961:6939 globe |1672 x941; source crop95.89% x92.42% inside1677.549 x979.609 stage, opacity.2 |
| `08a92.svg` |961:6937 mask |685.505 x685.505; CSS mask685.504 square at458.852 /81.6 inside stage; stage x431.1455,y417.4 at1440 |
| `65002.svg` |961:6950 divider |276 x5, rotated90deg; effective5 x276 atx595,y440 |
| `1bce4.svg` |961:8561 header logo |90.9964 x15.1677; intrinsic SVG geometry |
| `5497d.svg` |961:8555 language icon |12.0696 square; original local export |
| `4fa2a.svg` |961:7233 footer n |22.3059 x18.2378 at0 /3.0432 in240 x32 slot |
| `f87fc.svg` |961:7234 footer v |22.923 x18.4942 at49.296 /3.4816 |
| `97fd8.svg` |961:7235 footer a |22.0033 x18.7179 at71.136 /3 |
| `dabcc.svg` |961:7236 footer o |21.9854 x18.5251 at24.816 /3.0816 |
| `e27ca.svg` |961:7237 footer r |18.2751 x18.2783 at95.592 /3 |
| `c8445.svg` |961:7275 Instagram |17.1763 square |
| `fa384.svg` |961:7279 LinkedIn |17.1704 x17.1746 |
| `9daba.svg` |961:7284 Facebook |17.1763 square |
| `e3672.svg` |961:7286 YouTube |24.4617 x17.1758 |

The globe is decorative and hidden from assistive technology. The SVG mask is a CSS asset, not a visible replacement globe. Footer glyph pieces retain the source composition. SVG image elements rely on their root dimensions rather than invalid fractional HTML width attributes or blanket100% sizing.

## Verification

Observed writer checks,2026-09-23:

- `dotnet build Novar.sln -c Release --artifacts-path artifacts/about`: PASS,0 warnings/errors.
- `dotnet test Novar.sln -c Release --no-build --artifacts-path artifacts/about`: PASS,27/27,0 skipped. Includes source text, route200/404/405 semantics, all visible local assets, mask availability/root geometry, About-only stylesheet/header/footer isolation and correct pending social brands.
- `dotnet publish src/Novar.Web/Novar.Web.csproj -c Release --no-build --artifacts-path artifacts/about -o artifacts/about-publish`: PASS. All four JSON content files present; published About CSS hash equals source.
- `node --check tools/check-ui.cjs`: PASS (syntax only; no browser launched). All84 provenance records exist/nonempty and SHA-256 match, including the82 Figma asset records.
- Browser execution is parent-owned; the writer did not launch a browser or operate any preview server. Runtime comparison must first confirm `data-about-revision="about-v1"`. The offline checks above do not prove live geometry or owner approval.
- Protected file hashes were compared with the baseline and match. Full provenance hash and publish evidence are recorded in the feature task document.

Parent runtime checklist: inspect1440,1024,768,390 and320 widths; loaded Poppins; globe image/mask composition, divider and all logo/social root geometry; no horizontal overflow; values stacking; active nav; keyboard menu and pending modal with focus return. Record browser/network errors and unavailable checks honestly. No original About media is missing; mobile adaptation and live visual approval remain review items.
