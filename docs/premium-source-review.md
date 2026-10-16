# Premium pages: source implementation and verification boundary

AI Lens, MyoLens and AIWork now have isolated source implementations. Browser geometry, keyboard behavior, native review and owner visual approval remain separate pending evidence. The user-managed preview was unavailable during the parent's initial check; this writer did not start, stop, restart or browse the application.

## Review path

1. Review `Content/premium-products.json` against the three Figma frames.
2. Review `Premium.cshtml` and `premium.css`, especially explicit product variants.
3. Review the narrow route/service/layout and old-expectation test changes.
4. Read the current outcomes in `odd/tasks/novar-premium.md`; do not infer visual approval from offline tests.

## Source identity

| Product | Frame | Route | Revision |
| --- | --- | --- | --- |
| AI Lens | [894:233](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/?node-id=894-233) | `/lentes/ai-lens` | `premium-v1` |
| MyoLens | [977:11066](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/?node-id=977-11066) | `/lentes/myolens` | `premium-v1` |
| AIWork | [988:11447](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/?node-id=988-11447) | `/lentes/aiwork` | `premium-v1` |

All three desktop frames are 1440 x 4586. Initial root contexts were full, not sparse, and included screenshots. Additional original brand and FAQ contexts were inspected. Node953:695 is contextual artwork, not a fourth product. Mobile/tablet styling is an implementation adaptation awaiting visual review; no separate mobile Figma was supplied.

## Architecture and retained behavior

- Separate `PremiumProduct` records, local JSON, one Razor template, scoped stylesheet and footer.
- Source-specific hero crop/weight, technology title spacing, callouts, brand pieces, caption, watermark and FAQ state.
- Catalog identity is First + three Premium products + fourteen deferred products. Unknown slugs and MyoFix still return404.
- Catalog base, First, Home, About, Games and Treatments remain outside the source changes.
- Header changes are Premium-gated; First/Catalog keep their original header/footer behavior. Premium highlights Encontrá tu lente.
- Existing Bootstrap FAQ, menu and shared pending modal are reused. No new production script, form endpoint, real recommendation or third-party integration.
- The Premium footer has no legacy preview/sample notice. Social and warranty actions disclose pending integration.

## Typography and source caveats

Poppins300/400/500/600/700 reuse local originals. The gallery's900 face uses the genuine Google Fonts [Poppins Black file](https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Black.ttf), identified by the family's [metadata](https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/METADATA.pb). Its153440 bytes have SHA-256 `d82aaaf98a9283f9a8edd24e51173337d8eaf09e25cd3d98831f8ec8461748a1`; native OS/2 weight is900. The existing Poppins OFL is retained. Its font-face is loaded only by Premium CSS.

- AI Lens hero uses its4:3 original at full width:1440px produces1080px image height, clipped by the796.5px visual slot. At narrower widths a minimum cover height prevents distortion; mobile has a separate responsive crop.
- AI Lens feature watermark is baked into the untouched `68e81.png`; do not duplicate it as HTML.
- MyoLens feature is a tall original poster; desktop center-cover reproduces the design face crop and clips the original embedded poster labels rather than editing the asset.
- MyoLens brand group's child named MYOFIX is a stale layer label. Fresh screenshot977:11249 shows MyoLens with its Miopía Confort tagline.
- AIWork's root thumbnail appeared to omit FAQ introduction text. Fresh high-fidelity child988:11585 and its screenshot visibly show FAQ/title/description/contact. Implementation retains that stronger child evidence; full-page runtime/owner review is still pending.
- Preserve supplied claims and the source phrase `Primer lente diseñada con Inteligencia Artificial`; no editorial or medical correction was authorized.
- Only the final answer exists in each source. Other answers remain null and use the existing editorial-pending disclosure; no invented answers.
- Literal whitespace around the FAQ title's line break prevents concatenation when the mobile layout hides the break.

## Source asset inventory

All files below are original downloaded Figma assets under `src/Novar.Web/wwwroot/media/figma/`. Raster dimensions are native pixel dimensions; SVG dimensions are original root attributes. SVG roots and bytes were not edited, and their CSS callsites do not override root sizes. Some filenames end in `.png` while their original encoded bytes are JPEG; originals are preserved without re-encoding.

| File | Native width x height | SHA-256 |
| --- | --- | --- |
| `40da9.png` | 2528 x 1896 | `52e6ad33018b287e07fc8278f41f28f004993c0f57d290775a96e1f3d344a3c9` |
| `68e81.png` | 2752 x 1536 | `e295a56efe8b9497e637b04708a54aa0fc649002faec1db61d0fc73b7f9faaff` |
| `fcfe9.png` | 1549 x 1015 | `b5e7159e26cb1ccb729e1377654d51ab88f8a12da3c442cdfd8fa67be603721d` |
| `6a724.png` | 263 x 263 | `86cd635d9812febe10d9facdd811d88834db1062307f5c9bb0b7f4b8bfb36f1c` |
| `4a1dc.png` | 123 x 122 | `8340300f7083071b4561424d3ec572ae5f7e5f305b4874628c0e3a2d666c8ba4` |
| `b3e5b.svg` | 19.3751 x 18.9986 | `3f923923393c43092fd3ca5400b7339e2f032f9a5c251eca3b8dd118e4abff96` |
| `da3e9.svg` | 3.83465 x 18.9985 | `6c02371bc671ba55da62aa51df522c6cce75e45dd199ce6d0a6f013d2672fdae` |
| `eb2eb.svg` | 61.0208 x 19.2612 | `c6c975ac9f54b79a0f7ac9641a82dfda6091c4bb8d28682eddeb1856d36ea713` |
| `1b8c9.svg` | 4.29309 x 4.28442 | `878181a289d7f84e184ce9ad0d65415c4f04898b744a4629654e1d077dee3c07` |
| `ad6f0.svg` | 6.34111 x 6.33712 | `5dc65741301cd45567493df6235b33a908f26300c79468629b23b665770da49f` |
| `8c8de.svg` | 52.7561 x 42.6719 | `ca2ea3ae2769f872b7d5e3851912c2609383e6b3391f79b607bc3e37852bc749` |
| `71321.svg` | 43.9561 x 46.1205 | `fbf8d6c2bbf8c28c8da36c3489fe9ca199326d434759c0f06140733e330ef9ec` |
| `60515.svg` | 32.0878 x 39.0283 | `74965df2fe007422184e46ed1174260e1a70aa0c25bcd776d0c5c5496cc5818a` |
| `757b0.svg` | 42.9492 x 30.3681 | `c2d8707243fce61c3332c1e4e390b6b237eebfab9422a54a3671c8c73a993917` |
| `c2edd.png` | 2752 x 1536 | `efbca640195dda1aaad04a2f68908b0cd696d262a0fe16e783a5f69bc2d25838` |
| `c69be.png` | 3277 x 4096 | `ceece0c71311d8f3d03c781bdbc83dc281ba94ad23b7b8f1a47939284ccc05c9` |
| `459f9.png` | 2752 x 1536 | `66144c9a2a880c8877c88594df9690dc35cfe6d3260b2416d991ad9f9d9ecee6` |
| `ce2fb.svg` | 29.8037 x 4.22676 | `258460afe1ee039e5e3345152e7580a1647fae7c2a6848a2b6712fecbb4e3a40` |
| `0a8a2.svg` | 98.9981 x 21.0002 | `63ac260a848250909c8ef64f36a5b5e7cc0060379ea57f04fdda171a3336feff` |
| `66c80.png` | 2752 x 1536 | `36547496ea4db995d968a5aeebc3f3fb3097e634412d34e22c060e4bf48d9b9d` |
| `3f12a.png` | 2752 x 1536 | `23c86c1dd27037a3a9088b4684260344df51868644e2a441a5395bf59a83e919` |
| `b7de4.png` | 2752 x 1536 | `7709e711aa458498d27d40a325edeccf1e1fde27fa16c0e43ba4c917d67c7288` |
| `91079.png` | 146 x 53 | `01aff407116f20777323f791b36282f47cb51862c002b235957c38bb475a56dc` |

Shared header/footer assets already present are reused unchanged: `4d514.svg`, `ba1ea.svg`, `4fa2a.svg`, `f87fc.svg`, `97fd8.svg`, `dabcc.svg`, `e27ca.svg`, `c8445.svg`, `fa384.svg`, `9daba.svg`, `e3672.svg`. Their source-node provenance was extended additively.

## Slot map and desktop measurement targets

| Slots | AI Lens | MyoLens | AIWork |
| --- | --- | --- | --- |
| Hero | 40da9 /977:10921 | c2edd /977:11243 | 66c80 /988:11448 |
| Feature | 68e81 /894:241 | c69be /977:11072 | 3f12a /988:11481 |
| Gallery | fcfe9 /894:329 | 459f9 /977:11097 | b7de4 /988:11496 |
| Brand | Seven pieces in894:332 | Two pieces in977:11249 | 91079 /988:11649 |
| FAQ open | Item3 of3 | Item4 of4 | Item4 of4 |

Desktop layout targets: hero798px total; technology522.75px; feature774px; explanation371.25px; gallery1271.25x705.75 at x85/y2466. FAQ begins3231px AI Lens,3230px others. Footer background begins3897px AI Lens,3894px others. Exact asset geometry and typography must still be measured in the rendered user preview, not inferred from these CSS targets.

## Checking

TDD is OFF from README22 and the main tracker19. Run ordinary foreground checks with isolated outputs:

```powershell
dotnet build Novar.sln -c Release --artifacts-path artifacts/premium
dotnet test Novar.sln -c Release --no-build --artifacts-path artifacts/premium
dotnet publish src/Novar.Web/Novar.Web.csproj -c Release --no-build --artifacts-path artifacts/premium -o artifacts/premium/publish
node --check tools/check-premium.cjs
```

`PremiumTests` checks source identities, one h1, FAQ count/default/null fallback, local assets, exact23asset hashes, SVG roots, genuine Black900, fourteen deferred products, real404/405 behavior and page isolation. Existing regressions remain in the full suite.

`tools/check-premium.cjs` is authored for future separately authorized browser execution only. It never controls the server. It checks the15 product/viewport combinations at1440/1024/768/390/320px, source freshness, overflow, images, FAQ keyboard expansion, pending-modal focus return and mobile menu; captures screenshots/geometry under ignored `artifacts/premium/browser/`. Automated passing does not replace visual comparison of every asset slot or owner acceptance.

The writer only syntax-checks that harness; parent currently uses CUA for browser proof. Initial parent preview request failed `net::ERR_CONNECTION_REFUSED`. A later user statement that they will start the preview is not evidence of a current build or successful browser test.

## Preservation and rollback

Baseline inventory: `artifacts/premium/preservation-before.json`,272 files. Narrow shared hooks have read-only original copies in the same ignored directory. Preserve concurrent Home changes separately, never reset shared files wholesale. Provenance comparison must retain all original entries/fields and permit only added Premium source nodes/new assets/font metadata.

Rollback would remove only Premium-specific files and additive hooks/identities, after checking for later dependents; it would not revert whole shared files or unrelated assets. No commit, remote, deploy or release was performed. Current command outcomes and any remaining blocked proof are recorded in the focused task tracker.

