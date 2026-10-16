# Lens-finder routing: descriptive navigation, not clinical selection

`/lentes` has a client-only, form-free selector and links to the existing 18 product pages. The user approved the orientative proposal with "dale" and later requested that filters refresh automatically. Need, preference and compact changes update local results; age updates only contextual text/validation. Home and all product pages/content remain outside this change. No script navigates, transmits answers or stores them.

## Source and presentation boundary

- Preserve the initial heading and description from the historical source-backed base: Figma file `BsmryGBLAW0gkLgs4Fw1X8`, group `889:1406`, heading `889:1409`, controls `889:1410`. This source phase did not fetch new Figma content or claim source-specified expanded states.
- Keep genuine existing Poppins weights, 560px content column, 40px/48px heading, 14px/22px description, source colors and original 14x14 `f3d35.svg` chevrons and 15x15 `e3b22.svg` CTA arrow. Exact original bytes are unchanged. Three native disclosure controls replace the old pending buttons; explanatory controls/cards are deliberately simple source-consistent additions.
- Expanded layout and validation/results are approved behavior, not pixel-identical evidence of a supplied expanded Figma screen. Runtime geometry and owner acceptance remain pending.

## Description evidence behind the approved rules

All locators below are repository-relative local source; the existing product text is unchanged. The central routing configuration is `src/Novar.Web/Content/lens-finder.json`.

| Source content | Evidence used for navigation |
| --- | --- |
| `Content/first.json:5-9` | First progressive experience; 40-45 is contextual description only |
| `Content/premium-products.json:10,43-44,64,76-77,98` | AI Lens is progressive with AI; MyoLens is monofocal myopia comfort, not MyoFix; AIWork is occupational with work-distance/AI personalization |
| `Content/progressive-products.json:98-99,186-191,283-288,399-401` | Precisa/Short balanced daily use; Evolution/Short amplitude and compact frames; eLIFE digital routine |
| `Content/monofocal-products.json:11-17,102-108,190-196,276-282,363-371` | Geo personalization/visual quality and thickness; Single Vision one distance; Outdoor sports/enveloping frames; Indoor near support/screens; Slim high known powers/thickness |
| `Content/bifocal-occupational-products.json:82,109-111,250,278-281` | Kriptok digital Freeform/discreet segment; Ultex round segment; Freeline reduced segment visibility; Office near/intermediate desk work |

The `Content/` paths above are beneath `src/Novar.Web/`. None establishes clinical suitability, superiority, age-based eligibility or a prescription. Most suitability FAQ answers remain null. Source editorial conflicts (Evolution's Geo paragraph, Outdoor's Sport reference and Indoor's Relax reference) were not used to invent destinations or change product records.

## Matching and privacy contract

- Need describes what the visitor wants to explore. Premium is not treated as one optical family. The optical browsing groups contain 7 progressive, 6 monofocal, 2 occupational and 3 bifocal identities.
- Need alone returns family alternatives. Explicit preferences select their approved described sets; multiple preferences intersect. No arbitrary winner or score. Thickness returns Geo and Slim; discreet bifocal returns Kriptok and Freeline. Order is the neutral configured catalog order.
- Compact-frame preference appears only with balanced-daily-use or amplitude preferences. It replaces Precisa/Evolution with their Short versions; it never creates a nonexistent Short product or uses face size.
- Empty browsing and `No sé` retain all 18 destinations. Conflicting/incompatible selections show no exact match with the full catalog still accessible. Invalid need on explicit matching produces an accessible message, not an inferred prescription.
- Age is optional and never enters the matching engine's selection or ordering. Empty or nonnegative whole values are accepted. First's 40-45 text can appear only after First is already in the results; it cannot add, remove or rank a product.
- The prior visible orientation notice and its result-trigger button are removed from the finder block per the user's later direction. `Limpiar filtros` is the only button; `Explorá todos los lentes` and all product links remain ordinary links.
- There is no form or backend filter action, answer URL, cookie, analytics, storage, fetch, AJAX or automatic navigation. Normal anchors alone lead to existing product routes. The all-products anchor contains no answers.
- Existing global pending-modal/no-script copy belongs to the protected shell; this page adds its own accurate notice and independent all-product links without modifying other pages.

## Progressive enhancement and accessibility

Native `details`/`summary`, labeled radio/checkbox controls and fieldsets expose the three groups. Filters and age start disabled and become available only after configuration validation/listener initialization; reset is the only action button. No JavaScript, malformed embedded data or failed script loading leaves the server-rendered catalog links usable. Form-free markup prevents accidental Enter-key submissions regardless of enhancement state.

Need, preference and compact changes automatically refresh the results. Optional age edits refresh only contextual text and validation; invalid age clears stale results and announces the error without moving focus or scrolling. Empty initial/reset state remains quiet, with no missing-need prompt; reset clears all controls and results. These updates never navigate. The native controls and links remain keyboard-operable; live assistive-technology/visual proof is parent-owned.

Razor uses the framework's safely escaped `Json.Serialize` for embedded `application/json`. The configured notice value remains available to the existing client validation contract but is not rendered as visible finder copy. Cards use `textContent`, and destinations are restricted to validated canonical slugs. Existing product names/URLs are projected from the authoritative content dictionaries; the configuration owns rule metadata without another hard-coded JS/Razor product list.

## Verification status and delivery boundary

Source marker: `data-lens-finder-revision="lens-finder-routing-v1"`. Tests exercise the actual production pure engine and DOM controller with offline fixtures, plus ASP.NET WebApplicationFactory rendering/routing. They are not browser or clinical proof. TDD is OFF; ordinary verification, no claimed RED/GREEN.

The exact command results and preservation audit are recorded in `odd/tasks/novar-lens-finder-routing.md` and full Engram mirror 1052. During LFR01, cache-only restore passed, initial build passed with one flow-analysis warning, the annotated throwing guard removed that warning, clean rebuild passed, focused .NET passed 10/10 and Node rules passed 24/24. During LFR02, clean build and focused .NET passed 11/11; offline DOM passed 11/11. Final full-suite/publish/preservation proof is recorded only after observed in the tracker; do not infer completion from this intermediate paragraph.

`tools/check-lens-finder.cjs` is intended for parent-only runtime proof: original typography/icon slots, native keyboard controls, all approved branches, compact/overlap/conflict/reset/age behavior, no answer requests, all18links and no-JS/script-load-failure fallback. The writer syntax-checks it only, never executes it.

Final offline proof passed: clean Release build, 233/233 .NET, 24/24 rules, 11/11 DOM, 13/13 gallery and 57/57 prior JS regressions; publish and all three syntax checks passed. Preservation observed 484 unchanged protected files from a 492-file baseline, exactly eight allowed existing changes and eight additions, three exact shared transformations, 379 identical source/publish files and identical tested/published DLL. Full evidence is in `artifacts/lens-finder-routing-evidence/` and the tracker. The only rejected command was a read-only PowerShell inspection syntax error corrected before its execution; no functional check failed. After the pending publish result was collected, Node/syntax checks were repeated serially to make the final foreground evidence order explicit.

Parent's one preview navigation returned `net::ERR_CONNECTION_REFUSED`; no server operation was performed. Runtime/visual/owner acceptance remains pending, not a source-test failure. The user explicitly resolved the mid-run commit policy with **"Dejar este cambio sin commits por ahora"** (decision 1060). This candidate is left uncommitted by request; no branch, staging, baseline/work-unit commit or PR-chain decision is authorized. The exception does not imply native review or runtime/owner approval. No Git mutation, remote action or native review was performed by this writer.

Rollback is limited to this feature's named new files and exact authorized Catalog/style/service/controller/test/harness changes against its fresh baseline. This description authorizes no deletion, reset or cleanup of unrelated work.

## User-approved interaction correction (2026-09-28)

The later user request supersedes only the click-to-show and visible-notice behavior described in earlier history: no orientation notice or "Ver opciones" button appears in the finder; only "Limpiar filtros" remains as a button. Need/preference/compact changes refresh results automatically. Age changes refresh its contextual text or accessible validation only; invalid input clears stale results and does not move focus or scroll. Initial and reset-empty states are quiet, and reset clears inputs/results. The 18 server-rendered fallback links, "Explorá todos" anchor, matching/ranking/age rules, and product destinations remain unchanged. There is no separate submit/init dependency or dead submit handler. This correction was checked offline only; no browser/runtime acceptance is claimed here.
