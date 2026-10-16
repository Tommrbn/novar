# Review the five Monofocales product pages

Geo, Single Vision, Outdoor, Indoor and Slim are implemented as isolated MVC content and presentation. The source of truth is the five exact Figma frames below, not the general Monofocales overview. Browser fidelity and owner acceptance are still pending; offline checks do not approve the design.

## Review path

1. Inspect `Content/monofocal-products.json` against the retained high-fidelity contexts in `artifacts/monofocales/design/`.
2. Review the isolated model, `Views/Home/MonofocalProduct.cshtml`, `wwwroot/css/monofocal-products.css` and `_MonofocalFooter.cshtml` under `src/Novar.Web/`.
3. Review only the additive controller/content/layout hooks and catalog-partition changes in the three existing test files. `LensFinderTests` changes only its generic deferred fixture from Geo to still-deferred Freeline, with explicit parent authorization and every comparison retained. No predecessor page/content/style is changed.
4. Use `docs/asset-provenance.json` → `monofocalAssetVerification` for all original hashes, signatures, intrinsic dimensions, source layers, callsites, crops and transforms.
5. After the user updates their preview, compare all five pages with the Figma screenshots at 1440, 1024, 768, 390 and 320 pixels. Confirm `data-monofocales-revision="monofocales-v1"` first.

## Source identity

Figma file: [WEB VISION NOVAR](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR).

| Route | Source frame | Original wordmark group | Intrinsic SVG root |
|---|---|---|---|
| `/lentes/geo` | `964:1916` | `964:2247` | 415 × 107 |
| `/lentes/single-vision` | `992:1254` | `992:1285` | 415 × 223 |
| `/lentes/outdoor` | `992:1540` | `992:1571` | 415 × 107 |
| `/lentes/indoor` | `992:1826` | `992:1857` | 415 × 107 |
| `/lentes/slim` | `992:2112` | `992:2143` | 415 × 107 |

All source frames are 1440 × 5716. Node `953:695` is context only, not a sixth product. The exported outlined wordmarks preserve the missing Author font appearance, internal Novar/registered marks and original clipping. No SVG paths are reconstructed and no SVG root dimensions are overridden. Narrow layouts use proportional transforms rather than distorted width/height overrides.

## Composition and reuse

- Normal section flow follows hero → strip → intro → four portraits → treatments → details → technologies → benefits → three FAQs → contact → four related tiles → footer. Local art layers preserve source crops without making the whole page a fixed-position canvas.
- Outdoor and Indoor retain both source hero layers. Geo, Single Vision and Slim intro scenes are horizontally reflected as in their source. Indoor's details scene and caption keep the source reflection.
- Slim exposes all three technology cards, including Blending, in a keyboard-focusable horizontal scrolling region. Other products have two cards.
- The existing local Poppins faces, Bootstrap collapse, `_Faq` and shared pending modal are reused unchanged. A small encoded `_MonofocalText` partial preserves inline emphasis without inserting whitespace before source punctuation; the predecessor helper remains untouched.
- Geo uses original `aab12.svg` / `9f628.svg` for its header/LinkedIn variants. The other four use `86d3e.svg` / `68b8d.svg`; all use `5497d.svg` for the header globe. Each version is recorded separately, not treated as an interchangeable redraw.
- Related tiles preserve the four source images and their order. Their links target the corresponding implemented Outdoor, Single Vision, Slim and Geo routes. The source repeats these four tiles on all five pages, including self-links on four of them; no fifth tile or replacement image was invented.

## Editorial items retained for owner review

| Source item | Implementation |
|---|---|
| Outdoor intro says “Novar Sport” | Preserved at `/lentes/outdoor`; not renamed editorially. |
| Indoor intro says “Novar Relax” | Preserved at `/lentes/indoor`. |
| Single Vision says “calidad digita.” | Preserved exactly, including the apparent typo. |
| Geo FAQ contains “Novar Geo ?” | Preserved source spacing. |
| First two FAQ answers are absent | Typed `null`; existing honest editorial-pending fallback. |
| Third FAQ answer is supplied and expanded | Exact answer retained; initial Bootstrap panel 2 is open. |
| Source optical/medical claims and mixed technology wording | Transcribed, not medically validated or silently revised. |

Personalization, warranty and social integrations remain pending-modal buttons. Navigation to the catalog, treatments and Home contact section is real. No submissions, database, account, recommendation filter, fabricated result or external integration is added.

## Asset and preservation evidence

- 73 distinct visible original files: **52 new and 21 reused** after byte-for-byte comparison with freshly fetched source exports. Five new wordmarks match the parent's original SVG files exactly.
- 167 source-layer slots and 162 page/file associations cover the visible hero layers, wordmarks, strip, portraits, scene, icons, header, footer, specification bullets, detail photo, CTA arrow and related tiles.
- Figma serves some original JPEG images with `.png` filenames. Validation recognizes the actual PNG/JPEG signature and dimensions; bytes, names and hashes remain unchanged. A first PNG-only diagnostic failed and was corrected to inspect actual format, not to transcode the artwork.
- A 370-file protected baseline and shared-file originals were captured under ignored `artifacts/monofocales/` before source edits because the checkout has no Git HEAD. Hash evidence is not a fabricated baseline commit.
- Final comparison: **360 unchanged, 10 explicitly permitted changes, zero unexpected changes**. All 185 predecessor asset records, previous source associations, user-supplied assets and font metadata are preserved. The exact file list/hashes and narrow textual diffs are in `artifacts/monofocales/preservation-report.json` and `shared-hooks.diff`.
- Catalog composition is First (1) + Premium (3) + Progresivos (5) + Monofocales (5) + deferred (4) = 18 disjoint identities. Only the five authorized deferred slugs were removed.

## Verification status

Strict TDD is off by the existing explicit project choice (`README.md:22`, `odd/tasks/novar-web-navegable.md:19`). Ordinary .NET 10/xUnit/WebApplicationFactory checks cover all five routes, revision/node identities, source copy, variants, FAQ fallback/open state, supported and pending actions, local asset bytes/signatures/roots/provenance, unknown-route 404s and presentation isolation.

Required foreground commands (isolated output, serial completion):

```powershell
dotnet build Novar.sln -c Release --artifacts-path artifacts/monofocales
dotnet test Novar.sln -c Release --no-build --artifacts-path artifacts/monofocales
dotnet publish src/Novar.Web/Novar.Web.csproj -c Release --no-build --artifacts-path artifacts/monofocales -o artifacts/monofocales/publish
```

| Check | Observed result |
|---|---|
| Final build | Exit 0; 0 warnings, 0 errors. |
| Final full .NET suite | Exit 0; **207 passed, 0 failed, 0 skipped**. Includes all predecessor regressions. |
| Publish | Exit 0; completed in the isolated output directory. |
| Source/published comparison | 76 JSON/CSS/asset files matched SHA-256; 0 mismatches. All five app wordmarks also match the original source exports. |
| Protected-file/provenance comparison | Exit 0; zero unexpected changes; all predecessor manifest metadata preserved. |
| Browser/runtime/visual acceptance | Not run by this writer; user-managed preview was reported unavailable by the parent. MN06 remains pending. |

Earlier results are retained, not hidden:

- Initial build succeeded with one xUnit2030 analyzer warning; replacing a collection-existence assertion with `Assert.Contains` removed it. Subsequent builds had zero warnings/errors.
- First full suite: **205 passed, 2 failed**. The catalog generic-layout fixture still targeted newly implemented Geo; the parent authorized only changing that fixture to deferred Freeline. The source-copy test also inserted artificial whitespace around inline emphasis.
- Second full suite: **206 passed, 1 failed** after correcting the test extractor. It exposed actual Razor partial whitespace before Slim's comma. A group-local encoded text partial fixed the source rendering without touching the protected predecessor helper or source copy.
- The third full suite passed all 207 tests. Publish and the 76-file comparison ran only afterward.
- Preparatory helper diagnostics included an unavailable `python` app-execution alias (used the already-installed bundled interpreter instead), a PowerShell path-list syntax error, a Windows console encoding error (used `-X utf8`), PNG-only signature rejection of genuine JPEG exports, a wrong source tag node before content output, and a guarded layout replacement mismatch. These were corrected locally; no missing tool was installed, original artwork converted, or protected source restored wholesale.

Existing `npm run test:ui` covers Home/First and is not claimed as Monofocales evidence.

## Remaining acceptance

- [ ] Parent repeats the exact .NET test command as an independent spot check.
- [ ] User-managed preview serves the current five revision markers.
- [ ] Desktop/tablet/mobile image geometry, crops, Poppins, page composition, keyboard menu/FAQ/modal behavior, focus return, scrolling, overflow and console/network health are observed.
- [ ] Preserved pages are spot-checked in the current preview.
- [ ] Parent records the applicable native review state and any missing candidate authority, separately from owner visual acceptance.
- [ ] Owner reviews the five pages and retained editorial issues.

The writer did not run a browser, control a preview process, stage/commit/push, open a PR, deploy, clean files or run native review. Recovery is `odd/tasks/novar-monofocales.md` and full Engram mirror `odd/novar-monofocales/tasks` (#934). Rollback is limited to this group's isolated files and exact additive hooks; deleting a shared asset requires proving it has no remaining consumers. No rollback is authorized here.
