# Blue Tech source and verification boundary

Blue Tech is an additional state of `/tratamientos#blue-tech`, not a separate page. Original UV remains the default. Source and offline checks do not establish browser fidelity or clinical validation of the supplied text.

## Source evidence
- Figma file `BsmryGBLAW0gkLgs4Fw1X8`, full high-fidelity frame `961:9082`, screenshot1440x3257 retrieved by the writer on2026-09-23 before source edits.
- Original exports downloaded from the returned asset prefix. Eighteen unique files: two new originals (`f0cf4.png`, `b21e2.svg`) and sixteen byte-identical reused exports. No screenshot is an implementation asset.
- Exact supplied copy remains in treatments.json, including nonbreaking space after `NOVAR BLUE TECH`, explicit final line break before `la retina.`, and the source's DME/retina claim. No claim was added, corrected or medically validated.
- The shared hero, comparison, Sophia and footer geometry are reused, not redesigned. Existing shared/UV visual mismatches are outside this slice and remain subject to parent verification.

## Source-to-code geometry
| Source | Target at1440px | Implementation |
|---|---|---|
| Card961:9088–9092 | x129.2085,y758,w1181.583,h178,r33.845 | `_TreatmentBlueTech.cshtml`; scoped grid card, same overlapping layer above image |
| Eyebrow/title | Poppins400;15.042/18.803,-.4513;30.085/45.127,-.9025 | Authentic local Regular font; no synthetic weight |
| Description961:9090 | x598.32,y803.06,w668.636; Poppins40015.042/18.803,-.4513 | JSON exact text, pre-line whitespace, card grid and-3.01px offset |
| Scanner961:9084 | x-124,y893,w1684; aspect1399/779; lower crop at1573 | Original PNG1448x1086 covers1684x937.707plane inside680px clipped viewport; do not confuse bitmap size with design-plane ratio |
| Benefits961:9216 | groupx353,y1550;191/248/212width,46height;39/36gaps | Distinct Blue Tech badges; Poppins30014.748/20.969; original checks inside18.569circles |
| Active strip961:9105/9108 | underline x322,y703.13,w135.405,h3.74046; textPoppins60016.458 | Original SVG moved by selected-state selector without changing root size |
| Shared comparison/footer | Existing UV shell positions | Preserve original content and layout; no duplicate comparison |
| LinkedIn961:9300 | Original b21e2.svg17.1743x17.1758 | Parent-authorized dual original images in shared footer; only Blue Tech variant visible in that state; UV/no-JS keeps fa384.svg |

Responsive1024/768/390/320 adaptations are scoped to Blue Tech. Mobile card stacks, photo retains source ratio/crop, benefits become readable stacked badges. These adaptations await rendered verification.

## Every visible static asset
All SVGs keep their intrinsic roots; wrappers position assets, never stretch them. Hidden alternative footer icons remain decorative with empty alt text under a single labeled button.

| Original file | Intrinsic dimensions | Visible slot/callsite |
|---|---|---|
| f0cf4.png | PNG1448x1086 | Blue Tech scanner photo; `_TreatmentBlueTech` |
| 74f40.png | PNG1437x553 | Shared hero; `Treatments` |
| 7bc95.svg |10.2128x10.2128| Three Blue Tech benefit checks; `_TreatmentBlueTech` |
| 4e27d.svg |1089.22x.748092| Strip baseline; `Treatments` |
| cfa16.svg |135.405x3.74046| Selected strip underline; `Treatments` |
| ef8cd.svg |13.9265x13.9265| Pending Sophia CTA arrow; `Treatments` |
| 4fa2a.svg |22.3059x18.2378| Footer n glyph; `_TreatmentsFooter` |
| f87fc.svg |22.923x18.4942| Footer v glyph; `_TreatmentsFooter` |
| 97fd8.svg |22.0033x18.7179| Footer a glyph; `_TreatmentsFooter` |
| dabcc.svg |21.9854x18.5251| Footer o glyph; `_TreatmentsFooter` |
| e27ca.svg |18.2751x18.2783| Footer r glyph; `_TreatmentsFooter` |
| c8445.svg |17.1763x17.1763| Footer Instagram; `_TreatmentsFooter` |
| b21e2.svg |17.1743x17.1758| Blue Tech-only footer LinkedIn; `_TreatmentsFooter` |
| 9daba.svg |17.1763x17.1763| Footer Facebook; `_TreatmentsFooter` |
| e3672.svg |24.4617x17.1758| Footer YouTube; `_TreatmentsFooter` |
| ba1ea.svg |12.0696x12.0696| Shared header language; `_Layout` unchanged |
| 4d514.svg |91x15.1665| Shared header logo; `_Layout` unchanged |
| 8e61b.svg |91x15.1665| Hero optical-technology logo; `Treatments` |

Local/source SHA-256 records are in `docs/asset-provenance.json`, preserving all earlier mappings. Full downloaded-original inventory is retained under ignored `artifacts/treatments-blue-tech-source/blue-tech-assets.json`. New PNG SHA-256: `d2ef9bce153fabd72ca8b291070f79cb9c16b8b9cd66dd9563eacf0c6a0c0828`; new SVG: `4edd93f45eff4224fdc672e56a6b8c1046899eb40788ea8842241290b8c6a61a`.

## Interaction and accessibility
The HTML has two real fragment links and two initially visible semantic sections. Without JavaScript, both details remain reachable. The page-scoped script progressively creates a tablist and corresponding tabpanels, hiding only inactive content. Five unavailable native buttons remain disabled; no fabricated panels or routes exist.

Default/unknown/unavailable hash selects UV without rewriting unknown URLs. Valid hashes select their panel. Arrow keys wrap only through available tabs; Home/End select endpoints, Enter/Space activate. There is one selected/current link and one tab stop. Browser Back/Forward and hash edits synchronize state. Focus is moved from a panel about to hide to its new tab, avoiding invisible focus. Modified clicks retain native link behavior. No storage, fetch, slider, service or medical assessment is introduced.

## Verification separation
- Ordinary verification, strict TDD OFF. .NET tests cover exact source content, two-state/no-JS markup, original hashes/metadata, absence of invented routes/services and prior page regressions.
- `node --test tools/test-treatment-selection.cjs` executes production JS against a small offline DOM-contract fixture. This validates state/history/focus branches, not an actual browser or assistive-technology experience.
- `tools/check-treatments.cjs` prepares actual1440/1024/768/390/320 source geometry, every visible original asset, Poppins loading, UV preservation, Blue Tech selection/keyboard/history/deep-link/no-JS and pending-action checks. Writer does not execute this browser harness or operate the server.
- Parent owns the browser, spot check, native review and owner visual acceptance. BT03 remains pending until observed.

## Rollback and preserved work
Only Blue Tech data/view/style/script/assets and its exact shared selection/footer hooks belong to this work unit. `_TreatmentUv.cshtml`, other pages, existing images/fonts, controller/model/service and `_Layout` remain unchanged. The common historical tracker574+723 is not rewritten. Protected inventory was captured before source edits; its footer entry has the parent's explicit narrow exception, not a silently replaced baseline.
