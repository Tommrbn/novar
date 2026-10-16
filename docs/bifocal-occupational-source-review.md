# Bifocales and Ocupacionales source review

The four previously deferred product routes now use one isolated, explicit-category
BifocalOccupational family. This is a source candidate, not visual or owner approval.
The fourteen predecessor products, lens finder, global scripts and shared FAQ remain
outside the family implementation.

## Review path

1. Compare the four source frames and the exact Spanish content JSON.
2. Inspect the scoped Razor view/CSS and the new provenance section.
3. Read the offline evidence and the task tracker before browser/native review.

| Product and route suffix | Figma page node | Wordmark group | Category |
| --- | --- | --- | --- |
| Kriptok Blended / `kriptok-blended` | `989:712` | `989:744` | Bifocales |
| Ultex Blended / `ultex-blended` | `992:2398` | `992:2430` | Bifocales |
| Freeline / `freeline` | `992:2680` | `992:2712` | Bifocales |
| Office / `office` | `992:2962` | `992:2994` | Ocupacionales |

All routes are under `/lentes/`. Source file:
[Novar Figma](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/?node-id=989-712).
All four source frames measure 1440 × 5716. Full design contexts and screenshots were
retrieved and inspected before implementation; sparse descendants and the hover
variant were inspected separately. No page screenshot is used as implementation art.

## Fidelity decisions and source contradictions

| Source evidence | Implementation |
| --- | --- |
| Ultex and Freeline have stale layer names mentioning Geo | Visible product copy, not stale layer names, supplies identity. |
| Kriptok decorative watermark reads `kriprok` / `blended` | Preserved, not editorially corrected. Accessible product name remains Kriptok Blended. |
| Office hero eyebrow says `MONOFOCALES` | Preserved visibly. Domain/category label remains Ocupacionales. |
| Office gallery says `Kriptok Blended® es para vos` | Preserved, not renamed to Office. |
| Office intro icons retain `Segmento más discreto`, `Visión lejos y cerca`, `Estética mejorada.` | Preserved exactly; no new clinical interpretation. |
| Office recommendation heading says `Otros lentes progresivos` | Preserved. Other three pages say `Otros lentes bifocales`. |
| Current Office intro starts `Novar Office acompaña` | Current visible text wins over the older Kriptok description. |
| First two FAQ answers are absent; third is open | Null answers use the unchanged shared editorial-pending text; only source answer three is supplied. |
| Office answer three starts with a nonbreaking space and has no final period | Retained in JSON. |
| Recommendation images have no product href mapping in source | All cards link to the existing `/lentes` catalog; no product identity inferred from a photograph. |

The source's optical/clinical wording is transcribed, not independently clinically
validated. Correcting these inconsistencies is a separate editorial decision.

## Assets and geometry

`docs/asset-provenance.json` adds only `bifocalOccupationalAssetVerification`.
Its 63 asset records include original URLs, SHA-256, byte count, actual signature,
raster dimensions or SVG root attributes, page/node associations, and 138 source
slots with crop/transform/callsite metadata. Prior manifest sections are retained.

- 38 new files: 34 context assets and four default wordmark PNG exports.
- 25 existing assets reused only after comparing the downloaded original bytes.
- Actual signatures: 19 JPEG, 22 PNG, 22 SVG. Some `.png` names contain JPEG bytes;
  these were not transcoded or renamed.
- Default wordmark PNGs are 343×196, 340×196, 343×106, and 340×117 respectively.
  They retain Author typography without substituting an unavailable font. No format
  or scale override was requested. CSS uses fractional source group dimensions;
  high-DPI sharpness is an explicit remaining owner-review limitation.
- Original SVG root width/height/viewBox stay untouched. The banner orb is scaled as
  an element, not by rewriting its SVG root.
- Office preserves both hero layers and both image layers in each of four related
  cards. Ultex/Office intro reflections and each gallery crop remain variant-specific.

### Desktop geometry checkpoints (1440px viewport)

| Section | Source geometry |
| --- | --- |
| Header | x208, y30.83, 1024×61 |
| Hero / tagline | y0–761 / y761–878 |
| Intro panel | x145.77, y919.78, 1150.84×460.576 |
| Intro photo | x216.38, y954.48, 434.23×387.705; radius36 |
| Gallery outer cards | x−25 / 1159.38, y1539.01, 305.364×345.136; blur1.5, opacity0.5 |
| Gallery inner cards | x343.73 / 751.55, y1610.46, 344.462×388.952 |
| Treatments / details | y2126.78 / y2465.91 |
| Detail photo | x680, 672×430; y2593.99 K/U, y2582.99 Freeline, y2615.99 Office |
| Technology cards | x91.84 / 731.53, y3277.38, 616.63×218.399 |
| Benefits / FAQ / contact | y3549.63 / 4032.63 / 4536.63 |
| Related photo band | approximately y4839, 286px high; Office y4837.90, 286.547px high |
| Footer content | y5250.90; full frame ends about y5715.70 |

Responsive rules preserve ordinary flow below desktop; the source supplies no
separate mobile frame. The gallery remains a static composition, centered at wider
viewports without an auto-margin plus translation offset. Mobile related cards and
technology cards can be scrolled manually. Browser measurements are still pending;
the provenance does not claim rendered geometry matches merely because CSS exists.

## Interactions and accessibility

- Shared Bootstrap FAQ: keyboard controls, one-open behavior, third initially open.
- Shared pending modal: personalization, guarantee and social actions do not submit
  or store data. Treatments/contact/catalog navigation uses existing destinations.
- Source banner hover variant `443:1240`: 600ms linear opacity transition to
  `Visión sin esfuerzo`, with a keyboard focus counterpart and no transition under
  `prefers-reduced-motion: reduce`. Its original ellipse and opaque mask are retained.
- No timer, autoplay, carousel controls, new script or invented interaction.
- One text-accessible H1 per page accompanies the decorative original wordmark.
  Scoped CSS/footer/markers are absent from every predecessor route.

## Verification and remaining acceptance

The ordinary-check runner is .NET/xUnit; TDD is OFF (README line22 and the original
ODD tracker line19). Exact commands and observed results belong in
[`odd/tasks/novar-bifocales-ocupacionales.md`](../odd/tasks/novar-bifocales-ocupacionales.md).
The focused suite checks route identity, content/FAQ state, all original asset bytes
and natural/root dimensions, provenance coverage, layer counts, navigation and
fourteen-page isolation. It does not replace browser accessibility or visual proof.

Evidence is under `artifacts/bifocales-ocupacionales-evidence/`: `baseline.json`,
`originals/`, `original-exports/`, `source-slots.json`, `asset-verification.json`,
and verification/preservation reports. The baseline covers 447 existing files,
excluding `.git`, `.vs`, artifacts, dependency/build directories. A locked `.vs`
index interrupted the first baseline attempt before source writes; no process was
stopped or tooling state changed.

Parent acceptance remains responsible for desktop/mobile/wide measurements, every
visible image slot, FAQ/menu/modal keyboard use, reduced-motion/hover checks, an
independent .NET test repeat, applicable native review and owner acceptance. No
server, browser, Visual Studio or port was operated by this writer.

Rollback is the coherent family unit: restore the ten narrowly integrated existing
files from the recorded originals, remove only the new family-owned files/assets
identified by the preservation report, and retain unrelated work. No rollback,
commit or repository cleanup has been executed.
