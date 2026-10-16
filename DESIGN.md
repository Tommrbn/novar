---
name: WEB-VISION-NOVAR
description: Extraction of the current NOVAR desktop Figma system, with implementation comparisons.
colors:
  button-ink: "#1F023C"
  violet-accent: "#3D1A7A"
  body-dark: "#1A1228"
  muted-text: "#7B7B80"
  lavender-text: "#6B5A8A"
  paper: "#F6F5F7"
  near-white: "#FBFBFD"
  white: "#FFFFFF"
  black: "#000000"
  alternate-dark: "#1D023B"
  supporting-text: "#6D6874"
typography:
  home-display:
    fontFamily: "Poppins"
    fontSize: "80px"
    fontWeight: 700
    lineHeight: "83px"
    letterSpacing: "0px"
  section-heading:
    fontFamily: "Poppins"
    fontSize: "40px"
    fontWeight: 300
    lineHeight: "48px"
    letterSpacing: "0px"
  product-intro:
    fontFamily: "Poppins"
    fontSize: "36px"
    fontWeight: 400
    lineHeight: "41px"
    letterSpacing: "-0.03em"
  navigation-default:
    fontFamily: "Poppins"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  faq-question:
    fontFamily: "Poppins"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "20px"
  faq-answer:
    fontFamily: "Poppins"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "20px"
  footer-label:
    fontFamily: "Poppins"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "16px"
    letterSpacing: "1.2px"
rounded:
  navigation-pill: "999px"
  faq-panel: "16px"
  product-benefit: "22px"
spacing:
  common-cta-padding: "14px 28px"
  common-cta-gap: "12px"
  benefit-padding: "28px"
components:
  common-cta:
    backgroundColor: "{colors.button-ink}"
    textColor: "{colors.white}"
    typography: "{typography.navigation-default}"
    padding: "{spacing.common-cta-padding}"
    height: "48px"
    width: "173px"
  product-contact-cta:
    backgroundColor: "{colors.violet-accent}"
    textColor: "{colors.white}"
    rounded: "{rounded.navigation-pill}"
    padding: "16px 28px"
    height: "52px"
    width: "177px"
---

# Design System: WEB-VISION-NOVAR

## Overview

Use the selected current Figma page as visual authority. This is extraction, not redesign or proof that every designed screen is implemented. Frontmatter records observed values with contextual role names, not application CSS variables or universal scales.

**Creative North Star:** unresolved; no user-approved creative metaphor was supplied.

**Evidence labels:** **Figma-verified** means fresh source inspection or the eight inspected screenshots; **implementation-only** means current repository evidence without a matching source contract; **unresolved** means insufficient evidence. Static source does not specify interaction behavior.

**Key Characteristics:**
- Floating light capsule navigation recurs across desktop compositions.
- Pale image-led surfaces coexist with distinctly dark Premium pages.
- Poppins spans light editorial headings and bold product/hero emphasis.
- Purple actions, text, translucent washes and rounded containers recur without making every purple interchangeable.

### Authority and provenance

- **Figma-verified:** supplied [target 953:695](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=953-695) is Rectangle 245 (42624 × 36446), not a screen, on [684:2367 — WEB NOVAR - EDITAR ESTE](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=684-2367).
- Its 36 desktop frames are the current inventory. Visible content resolves misleading layer names.
- Excluded archive/context pages: `1` (0:1); `WEB NOVAR-AJUSTE DE COLOR (nuevo)` (405:1206, 18 top-level 1920-wide frames); `Web Novar Vision (NUEVO)` (85:805, 34); `Page 3` (109:222, 7). Names do not prove chronology.
- Zero variable collections/variables and zero text/effect styles were found. Six local paint styles and one local grid exist; semantic names here are extraction labels, not authored Figma variables.
- Eight whole-frame screenshots inspected at 0.25 scale: Home, About, Games, AI LENS, UV, First, Finder IA, Warranty. Other frames have inventory/source evidence, not equivalent screenshot coverage.
- **Unresolved:** qualitative brand intent, complete historical precedence, mobile composition and responsive source behavior.

Current comparisons use repository-relative paths for portability. They do not authorize fixes. No live browser, mobile-device, accessibility, performance or functional verification was performed for this extraction.

## Colors

Pale neutrals support purple text/actions, with local photographic, ribbon and game accents. Frontmatter values apply only to the observed roles below.

### Primary

| Token | Figma-verified context |
| --- | --- |
| `button-ink` | Common action fill [1126:232](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=1126-232); Premium body also uses this dark purple. |
| `violet-accent` | Newsletter emphasis [889:1652](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=889-1652) and product contact action [964:1676](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=964-1676). |

### Neutral and supporting text

| Token | Figma-verified context |
| --- | --- |
| `paper` | Home frame [889:1324](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=889-1324) and light Premium footer [977:10987](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=977-10987). |
| `near-white` | Home hero text [889:1405](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=889-1405) and actual AI headline text runs [894:256](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=894-256). |
| `white` | Common action text [1126:233](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=1126-233) and white containers. |
| `black` | NEGRO local style and selected headings; not a universal dark-text replacement. |
| `body-dark` | Home text [889:1418](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=889-1418) and Games heading runs. |
| `muted-text` | Home copy [889:1732](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=889-1732), footer description [961:4507](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=961-4507) and inactive treatment tabs. |
| `lavender-text` | Home text [889:1462](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=889-1462), footer links and newsletter subtitle. |
| `alternate-dark` | Distinct fill [961:4438](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=961-4438); do not merge with button ink. |
| `supporting-text` | Product contact support [964:1675](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=964-1675). |

Local style names: NEGRO, BARRA DE TAREA, FONDOS, duplicate FONDOS (approximately #CACACA), BOTONES, TEXTOS OSCUROS. Duplicate names do not imply identical values.

### Contextual gradients and accents

- **Figma-verified:** newsletter 889:1634 uses #F9F8FB → #EDE8F8, overlay 889:1635 and orb 889:1636 (#A78BD8, 0.15 alpha). CSS orientation had separately been confirmed as 180deg; this is not every gradient's direction.
- Premium band 920:695 uses #140569 at 0/0.2067308, #3D007A at 0.5528846 and button ink at 1. Preserve its source transform; no generic CSS equivalent is established here.
- Treatment CTA 961:9794 uses paper → #EDE8F8 at 0.6 → paper; First CTA 974:238 has #F9F8FB outer stops. Warranty 971:10646 fades #F9F8FB → white.
- First ribbon 689:4868 uses #0E7EE2 / #7F0C12, distinct from brand violet.
- Games accents remain local: blue #83ABE9 / #0065FF, lavender #A78BCA / #8F5BD0, teal #72C4CC / #4EAAB5. Panels #0D0D0D; puzzle #3019E1; target #5342D7.
- No authored tonal ramp was found; do not fabricate ramps or promote local accents to global CTA colors.

**The Distinct Darks Rule.** Preserve separate dark fills and styled text runs; visual similarity does not authorize token merging.

**Implementation-only:** `src/Novar.Web/wwwroot/css/site.css:8–17` defines several matching ink/violet/body/muted/paper values and `--line: rgba(123,94,167,.18)`. The line color remains code evidence, not a new Figma token.

## Typography

**Figma-verified:** Poppins supplies the observed hierarchy. Frontmatter samples are contextual, not a complete responsive scale. No second face or unobserved fallback stack is specified.

| Role | Source and application |
| --- | --- |
| `home-display` | Home hero [889:1405](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=889-1405), Bold. |
| `section-heading` | Home [889:1454](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=889-1454) and product [964:1020](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=964-1020), Light. |
| `product-intro` | First [689:4843](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=689-4843) / Geo [964:1928](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=964-1928), Regular introductory text. |
| `navigation-default` | About navigation [961:6983](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=961-6983) and common CTA [1126:233](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=1126-233). |
| `faq-question` / `faq-answer` | [961:5932](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=961-5932) / [961:5937](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=961-5937), distinct weights/sizes. |
| `footer-label` | Product [964:1836](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=964-1836), uppercase; Home labels instead use 14px/16px. |

### Contextual exceptions

- Statement 964:1448: Light (30px, line height 132%).
- AI headline 894:256: Bold (30px/30px, tracking-3%). Node fill is black but actual segments are near-white; screenshot confirms the text runs.
- Games heading 961:7329: Light (52px/57.2px), mixed dark runs; secondary 961:7703: Light (33px/50.1354px).
- First tagline 689:4871 / 443:1249: Light (32px,122%): “Visión sin esfuerzo.”
- Warranty labels 971:10501/10509/10517: Bold (24px/32px).
- Product contact 964:1674: Light 38px/automatic line height; support 964:1675: Regular 16px/automatic; action 964:1677: SemiBold 13px.
- Newsletter “Stay” / “Connected”: mixed dark/violet runs, Light 40px/48px; subtitle Medium 12px/16px; support Light 13px/20px.
- Home selected navigation is SemiBold; selected product navigation 964:1750 is Bold. Do not flatten active weights globally.

**The Text Runs Rule.** Inspect styled segments before assigning color/weight from a parent text node.

### Implementation differences

- **Implementation-only:** local faces 200–700 appear in `site.css:1–6`; extra Thin/ExtraLight/Black provenance in `docs/asset-provenance.json:2646–2680`. Two native OS/2 weights differ from explicit CSS labels; preserve authentic bytes.
- `site.css:22–36` body 14px, paragraph 1.65, h2 tracking-1.2px differ from zero source heading tracking.
- Home h1 `site.css:61` uses clamp(54px,5.56vw,88px), weight 600 instead of source Bold 700.
- Base navigation `site.css:43–51` is 12px; family overrides commonly 14px/20px with active 600 rather than source product 700.
- FAQ `site.css:249–257` uses 12px trigger/11px answer, unlike source roles. Current CSS does not overwrite Figma authority.

## Layout

### Desktop spatial model

- **Figma-verified:** all current frames are 1440px wide. Canvas heights are source measurements, not viewport requirements.
- GRILLA style `S:cdf2aed333d9cebe4a73a68aec1212b01d85a8af`:24 stretch columns/24px gutter/80px offset; one stretch row/20px gutter/8px offset. Both invisible; universal assignment is unestablished.
- Header 961:7030:1024 ×61 at x 208/y 29; product 964:1741 repeats size. Preserve the floating centered relationship, not an invented global grid.
- Footer wrapper 961:4578:1920 ×322 at x-240; inner 961:4501:1134 ×322 at x 393,24px horizontal padding. Wide children are source evidence, not universal overflow rules.
- Newsletter 889:1634:1515 ×459 at x-37/y 7351.5; orb approximately 347.77px square. Home-specific measurements.
- Product contact 964:1672:1440 ×210,72px vertical/88px horizontal padding,0.20-alpha lavender wash.

### Current screen inventory

All rows are **Figma-verified** inventory on page 684:2367. Use each target frame, not a neighboring product, as authority.

| Visible identity | Family | Canvas | Source node |
| --- | --- | --- | --- |
| HOME3 | Home | 1440 ×8370 | [889:1324](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=889-1324) |
| First | Product | 1440 ×5841 | [689:4828](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=689-4828) |
| Geo | Monofocal | 1440 ×5716 | [964:1916](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=964-1916) |
| SingleVision | Monofocal | 1440 ×5716 | [992:1254](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=992-1254) |
| Outdoor | Monofocal | 1440 ×5716 | [992:1540](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=992-1540) |
| Indoor | Monofocal | 1440 ×5716 | [992:1826](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=992-1826) |
| Monovision | Product | 1440 ×5716 | [1262:2266](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=1262-2266) |
| Drive | Product | 1440 ×5716 | [1262:2538](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=1262-2538) |
| Slim | Monofocal | 1440 ×5716 | [992:2112](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=992-2112) |
| Relax | Product | 1440 ×5716 | [1262:1703](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=1262-1703) |
| Sport | Product | 1440 ×5716 | [1262:1984](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=1262-1984) |
| KriptokBlended | Bifocal/occupational | 1440 ×5716 | [989:712](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=989-712) |
| Office | Bifocal/occupational | 1440 ×5716 | [992:2962](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=992-2962) |
| UltexBlended | Bifocal/occupational | 1440 ×5716 | [992:2398](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=992-2398) |
| Freeline | Bifocal/occupational | 1440 ×5716 | [992:2680](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=992-2680) |
| Evolution | Progressive | 1440 ×5849 | [964:2655](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=964-2655) |
| EvolutionShort | Progressive | 1440 ×5849 | [1002:246](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=1002-246) |
| eLIFE | Progressive | 1440 ×5849 | [974:266](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=974-266) |
| Precisa | Progressive | 1440 ×5849 | [974:621](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=974-621) |
| PrecisaShort | Progressive | 1440 ×5849 | [982:221](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=982-221) |
| ENCONTRÁ TU LENTE-IA | Finder | 1440 ×4338 | [690:6605](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=690-6605) |
| AI LENS | Premium | 1440 ×4586 | [894:233](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=894-233) |
| MYOLENS | Premium | 1440 ×4586 | [977:11066](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=977-11066) |
| AI WORK | Premium | 1440 ×4586 | [988:11447](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=988-11447) |
| ENCONTRÁ TU LENTE-MYOFIX | Finder | 1440 ×4338 | [690:6760](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=690-6760) |
| MYOFIX LENTE | Product | 1440 ×8695 | [885:883](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=885-883) |
| SOBRE NOSOTROS | About | 1440 ×2098 | [961:6952](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=961-6952) |
| JUEGOS | Games | 1440 ×2730 | [961:7324](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=961-7324) |
| Antirreflejo iLUX | Treatment | 1440 ×3257 | [961:8330](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=961-8330) |
| Polarizado | Treatment | 1440 ×3257 | [967:9919](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=967-9919) |
| Hidrofóbico | Treatment | 1440 ×3257 | [961:8795](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=961-8795) |
| Fotosensible | Treatment | 1440 ×3257 | [967:10192](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=967-10192) |
| Protección UV | Treatment | 1440 ×3257 | [961:9641](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=961-9641) |
| BlueTech | Treatment | 1440 ×3257 | [961:9082](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=961-9082) |
| Antirraya | Treatment | 1440 ×3257 | [961:9368](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=961-9368) |
| GARANTIA | Warranty | 1440 ×2794 | [971:10483](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=971-10483) |

### Responsive and implementation boundaries

- **Unresolved:** no mobile/iPhone/Android-named frames were found across five pages; name search is not exhaustive absence proof. A narrow 24px frame is only an icon. Desktop source does not establish mobile stacking/breakpoints.
- **Implementation-only:** `site.css:35` container min(1264px,100% -112px); product CSS line 13 min(1264px,100% -176px); `games.css:20` min(1114.12px,100% -80px). These are not universal source rules.
- `site.css:401,424,486` thresholds 1199/991/575px and family thresholds approximately 1200/768/400 remain implementation-only; omitted from normative sidecar.
- `Views/Shared/_Layout.cshtml:3–57` selects family styles/body classes and Bootstrap expansion thresholds, not source-device proof.
- `Controllers/HomeController.cs:11–58` and `Content/lens-finder.json:36–53` identify routes/slugs, pending fallbacks and 404 behavior. Inventory does not assert implementation of all 36 frames.

## Elevation & Depth

**Figma-verified:** depth varies: header shadows, benefit lift, translucent washes and product GLASS. No global flat/lifted philosophy was confirmed.

| Context | Source effect |
| --- | --- |
| Header 961:7030 /964:1741 | Black x 0/y 1/blur 0,alpha 0.04; black x 0/y 8/blur 32,alpha 0.10. |
| Benefit 964:2470 | x 0/y 12/blur 36,button ink at 0.0941 alpha. |
| Product 1030:607 | Black x 0/y 3.0005/blur 3.0005,alpha 0.25; Figma GLASS radius 75.0124/depth 15.0025/refraction 0.8. |

Sidecar shadows record inspectable source effects. GLASS has no established CSS equivalent; an invented backdrop-filter recipe would not be faithful extraction.

**Implementation-only:** `site.css:43–51` header 0 8px 16px #0000001a differs from source; `site.css:86–100` hover/focus-within card 0 12px 32px rgba(99,52,158,.22) and Games diffuse shadow (`games.css:22–24`) do not redefine source elevation.

## Shapes

- **Figma-verified:** navigation uses frontmatter pill radius; FAQ uses `faq-panel`; benefits use `product-benefit`.
- Common CTA 1126:232 literal radius 16777200 is a source pill sentinel, not a meaningful universal CSS scale step.
- FAQ 961:5929 is 720 ×136 vertical; benefit 964:2470 is approximately 402.6667 ×150 with observed benefit padding.
- UV benefit pills 961:9776/9782/9788:46px high,widths 215/248/219,Light 15px/20.9693px labels. Local tags 961:9690/9692:height 22.4275px,#7B5EA7 at 0.08 alpha,Regular 11px/14.8549px labels.
- **Implementation-only:** cards 24px corners/32px padding (`site.css:86–100`), hero bottom 30px (`site.css:58`), treatment 37.405px (`treatments.css:14`), collage 38px (`site.css:161`) are contextual CSS, not a Figma radius ramp.
- **Unresolved:** complete cross-family border/corner vocabulary. Do not apply one radius everywhere.

## Components

### Navigation and actions

- **Figma-verified:** floating capsule header, regular defaults, family-specific selected weights and filled CTA. Frontmatter dimensions describe observed variants, not all buttons.
- Product contact has violet fill,52px height,pill corners and SemiBold 13px label, unlike common CTA typography.
- **Implementation-only:** `site.css:39–42` minimum height 44px, padding 12px 26px, radius 99px, label 13px/500; product CSS line 14 commonly 14px 28px, label 16px/600/24px. Static source does not establish click/hover outcomes.
- Treatment order: UV / BlueTech / Antirraya / Polarizado / Hidrofóbico / Fotosensible / Antirreflejo. Inactive Regular/muted; active ink/Bold except Antirreflejo SemiBold. UV row 961:9665 is 992.5725 ×24 with 16px text; others approximately 1010 ×25 with 16.4580px text. Antirreflejo inactive UV 961:8431 is black, a retained anomaly.

### Family compositions

| Family | Figma-verified composition and reuse boundary |
| --- | --- |
| Home | Image/video hero; finder/Premium cards; Sophia; treatment collage; World; testimonials; FAQ; contact; lavender newsletter; light footer. Not a product-page template. |
| First/light products | Pale photo hero, category ribbon, tagline band, rounded two-column intro, gallery, CTA wash, paired technology cards, three benefits, split FAQ, contact strip, related ribbon, footer. Retain each product's imagery/copy. |
| Progressive | Related desktop product family with individual titles, wordmarks and editorial inconsistencies; do not rewrite to generic copy. |
| Monofocal/bifocal/occupational | Related pale family with outlined wordmarks and distinct lens images; do not recreate outlined logos with an assumed missing font. |
| Premium | AI LENS screenshot: photo hero/black bottom fade, light capsule header, saturated tech gradient, image-led dark-purple body, light FAQ/footer. MYOLENS/AI WORK inventory does not prove identical every-section composition. |
| Finder | IA uses AI imagery but LIGHT body, legacy translucent header, placeholder testimonial/gallery, related ribbon and older compact footer; not Premium. Myofix finder needs its own source. |
| About | Light centered World heading, asymmetric company/map, three principles, white “Lo que nos define” 2×2 cards, footer. |
| Games | Centered two-line heading, three dark dot-art cards, three-step strip, bordered active-game panel, footer. Local game accents. |
| Treatments | UV: pale photo hero, overlapping white tab capsule, rounded explanation, wide demo/benefit pills, comparison table, lavender CTA, footer. Other treatments retain own content. |
| Warranty | Pale card-in-hand hero, three white coverage cards, quality/coverage split, white FAQ, light footer. |
| Myofix lens | Long canvas inventoried; detailed reusable composition unresolved without equivalent screenshot inspection. |

### FAQ, variants and behavior boundaries

- **Figma-verified:** FAQ question/answer hierarchy is distinct; missing answers and interaction outcomes are not supplied by a static frame.
- Current sets 690:6989/690:7000:Slide16:9-1/2 Default/Variant4 do not imply an interaction contract.
- Archive 0:1 sets Contacto (4), Reseñas (3), FILTROS (4), Filtro de lentes (13), age/need/activity are not universal current APIs.
- **Implementation-only:** Bootstrap accordion, collapse menu, skip link, focus 3px #9564d1 (`site.css:30`) and pending-integration dialogs exist. Reduced motion `site.css:608–611` disables glint/smooth-scroll/transitions, not a Figma motion token.
- Finder matching/results are implementation-only (`docs/lens-finder-routing-source-review.md:5–9`), not supplied expanded-Figma screens.

### Home World, newsletter and assets

- **Figma-verified:** World has circular/tall/capsule geometry; static source does not establish audio/play controls.
- **Implementation-only:** `Views/Home/Index.cshtml:112–120` muted/loop/playsinline videos, preload none; fine-pointer hover/focus-within controls (`site.css:205–217`); Boy/Earth no sound button. Older provenance does not prove complete current video coverage.
- Newsletter lower white strip is warranty copy, not an established email input: “Activá la extensión de tu garantía”, “Cobertura de 6 meses extensible a 12 meses.”, “Activar” (889:1652/1654/1656).
- **Implementation-only provenance:** `docs/asset-provenance.json:1–14` records nodes/URLs/SHA256/capture metadata. 239 primary entries: 236 Figma exports, 3 isolated video posters. Five separate user-supplied entries 2575–2645: four treatment MP4s and novar-footer.svg; do not call these Figma exports.
- Preserve bytes/crops/copy. Some genuine JPEG bytes use .png extensions (`docs/monofocales-source-review.md:54`); filenames do not prove encoding.

### Editorial discrepancies and reading priority

- **Figma-verified:** Office display 992:3006 says Office; heading 992:2985 says “Kriptok Blended es para vos”. No correction authorized.
- **Implementation-only documented source observations:** `docs/progresivos-source-review.md:24–33` records PrecisaShort mentioning Precisa; Evolution “Novar Geo”/“opción monofocal”; EvolutionShort “Usuariosexigentes que usan armazones pequeños.”; eLife Adaptive/Adaptative; only last FAQ answer authored. Verify exact target before using as fresh copy authority.
- Historical source-review documents may be stale; fresh code/source outrank claims about disabled games, missing videos or old World gray rectangles.
- Comparison companions: `docs/premium-source-review.md:14–20`, `docs/monofocales-source-review.md:13–29`, `docs/bifocal-occupational-source-review.md:14–23`, `docs/about-source-review.md:3,29`, `docs/games-source-review.md:12–18`, `docs/treatments-uv-source-review.md:7–10`.

## Do's and Don'ts

### Do

- **Do** start from the selected current-page frame and visible content, then compare its family implementation.
- **Do** preserve mixed runs, distinct dark colors, authentic assets, Spanish copy and contextual composition.
- **Do** label code-only behavior and unresolved decisions explicitly.
- **Do** use contextual tokens without inventing universal type/spacing/radius scales.
- **Do** retain source inconsistencies until correction is authorized.
- **Do** treat mobile layout and interactive states as separate requirements needing evidence.

### Don't

- **Don't** promote archives, similar names or current CSS into current-page authority.
- **Don't** invent FAQ answers, routes, testimonials, email fields or interaction semantics from static variants.
- **Don't** normalize every family into Home, Premium or a generic template.
- **Don't** fabricate ramps, metaphors, variables, GLASS-to-CSS equivalents or motion.
- **Don't** claim browser/mobile/accessibility/functional validation from structural document checks.
- **Don't** treat extraction as permission to edit code, Figma, assets, configuration or publish anything.
