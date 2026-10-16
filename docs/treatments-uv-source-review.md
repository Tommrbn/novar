# UV within the shared Treatments page

This slice implements **only UV at `/tratamientos#uv`**, using the original desktop source. It does not create seven routes or fabricate the other six detail panels. Source/offline verification and browser/owner approval are separate outcomes.

## Source and scope

- Figma file: `BsmryGBLAW0gkLgs4Fw1X8`.
- User-selected `961:9642` is a background rectangle inside full **Protección UV `961:9641`**, 1440 × 3257.
- The writer retrieved a fresh full high-fidelity `get_design_context` response and screenshot before source edits. The response was not sparse; the screenshot is a comparison target, never an application asset.
- Included: shared hero/header, treatment strip, UV summary and outdoor photograph, three UV badges, seven-row source comparison, pending Sophia action, source footer.
- Excluded: other treatment detail states, game changes, real recommendation/integration, comparison slider behavior, new claims, deployment and server management.
- Marker: `data-treatments-revision="treatments-uv-v1"`. A preview without this marker cannot establish current runtime proof.

## Content and extension point

`Content/treatments.json` separates shared hero/comparison/Sophia copy from `Tabs` and `Details`. `Models/TreatmentModels.cs` contains only treatment types. `Views/Home/Treatments.cshtml` composes the shared page; `_TreatmentUv.cshtml` owns UV-specific markup. `treatments.css` is loaded only when `ViewData["TreatmentsPage"]` is true.

The six unavailable items retain their source labels as disabled native buttons, with accessible `próximamente` labels and a visible availability notice. The only live detail link is `#uv`. This is semantic navigation, not a misleading ARIA tab widget with nonexistent panels. Future authorized slices can add real detail data/partials and selection behavior within the same route; adding data alone does not authorize or automatically activate a new panel.

The comparison is a semantic table with caption, column headings and row headings, adapted to stacked rows on mobile. All seven rows preserve the original text. In particular, the Polarizado row's `Transición automática` and `Protección UV incluida` badges are source copy, not newly inferred claims; leave any editorial correction to the owner. The original Fotosensible inconsistency recorded elsewhere is outside this UV detail scope.

Sophia, warranty and social controls reuse the existing pending modal and do not generate results. No new treatment JavaScript, slider, form, backend endpoint or integration was needed. A native fragment link supplies the only treatment-selection behavior in this slice.

## Desktop geometry and typography targets

Coordinates below are relative to the 1440px source frame and are **targets**, not claimed live measurements.

| Element | Source target | Typography |
|---|---|---|
| Header | x208, y29, width1024 | Poppins400 14/20; active Treatments600 |
| Hero | 1440 × 689, bottom radius37.405 | Original cover image |
| Hero heading | x101, y232, width498.977 | 400/600, 38/44.885, tracking-1.14 |
| Hero intro | x101, y338.98, width530.397 | 400/700, 15/20.198, tracking-.45 |
| Treatment strip | y654, width1175.252, height69.573 | 16/24, active700, others400 |
| UV summary | x129, y758, 1181.583 × 178 | Eyebrow/body400 15/18.803; title400 30/45.127 |
| UV photo viewport | y893 through1573, height680 | Original image plane1684 × 937.707 at x-124 |
| Benefit group | x329, y1550; widths215/248/212, gaps39/36 | 300 15/20.969 |
| Comparison pill | y1709.25, 148.402 × 37.496 | 200 16/62.267, tracking-.48 |
| Comparison heading | y1771.985 | 300 33/50.135 |
| Comparison table | y1874.112, width1114.12 | Labels500 12.998/18.569; descriptions300; numbers100 11/14.855; chips400 11/14.855 |
| Sophia section | y2370, vertical padding74.275 | Heading300 33/36.766; copy300 15/22.282; button500 12.998/18.569 |
| Footer | y2823; page end3257 | Source 12–14px Poppins, original glyphs/socials |

The local Poppins Thin100 added by Games is reused unchanged, alongside existing200–700 weights. The source's legacy font metadata is preserved; no synthetic weight or duplicate download was introduced.

## Asset slots and intrinsic geometry

All nineteen unique source files were downloaded from the fresh context URLs. Eleven existing exports matched byte-for-byte; eight new exports were added. Every SVG retains its root dimensions without broad `100% × 100%` overrides. Footer/header source compositions reuse exact assets, not approximated iconography.

| File | Original dimensions | Callsite and intended treatment |
|---|---|---|
| `74f40.png` | PNG1437 × 553 | `.treatments-hero-image`:1440 × 689, centered cover crop, rounded bottom |
| `16fed.png` | JPEG2752 × 1536 | `.treatment-uv-image`:1684 × 937.707 contain plane, clipped to680px viewport; source bytes unchanged despite `.png` URL suffix |
| `b9b6a.svg` | 56.401 × 30.6381 | `.treatment-uv-source-arrows`: source decoration at plane x47.198/y192.723, entirely outside the visible desktop crop; not interactive |
| `7bc95.svg` | 10.2128 × 10.2128 | Three benefit checks centered in18.569px source circles |
| `4e27d.svg` | 1089.22 × .748092 | Treatment strip baseline, x174.64/y704.496 |
| `cfa16.svg` | 135.405 × 3.74046 | Active UV strip marker, x165/y703.13 |
| `ef8cd.svg` | 13.9265 × 13.9265 | Sophia button arrow |
| `4d514.svg` | 91 × 15.1665 | Header Novar logo |
| `8e61b.svg` | 91 × 15.1665 | Hero's gray Novar technology logo |
| `ba1ea.svg` | 12.0696 × 12.0696 | Header language globe |
| `4fa2a.svg` | 22.3059 × 18.2378 | Footer logo n at0/3.0432 |
| `f87fc.svg` | 22.923 × 18.4942 | Footer logo v at49.296/3.4816 |
| `97fd8.svg` | 22.0033 × 18.7179 | Footer logo a at71.136/3 |
| `dabcc.svg` | 21.9854 × 18.5251 | Footer logo o at24.816/3.0816 |
| `e27ca.svg` | 18.2751 × 18.2783 | Footer logo r at95.592/3 |
| `c8445.svg` | 17.1763 × 17.1763 | Instagram, first footer social |
| `fa384.svg` | 17.1704 × 17.1746 | LinkedIn, second footer social |
| `9daba.svg` | 17.1763 × 17.1763 | Facebook, third footer social |
| `e3672.svg` | 24.4617 × 17.1758 | YouTube, fourth footer social |

The source's stray check at page origin is completely covered by the later hero layer; it is not an extra visible badge. The offscreen scanner arrow is retained within the clipped photo composition. No extra visible control is invented from either decoration.

## Responsive and accessibility adaptations

At1024/768px the treatment navigation wraps with an explicit availability notice; intrinsic decorative rules are clipped instead of stretched. The photograph keeps its source crop. At390/320px the hero copy precedes the photo, the UV summary and benefits stack, comparison rows become one-column groups, and the footer reflows. There is no supplied mobile Figma frame, so these adaptations need owner review.

Native disabled treatment controls cannot activate missing panels. Shared focus styles and skip navigation remain intact. Live buttons/links keep semantic behavior; narrow-screen footer controls expand to44px hit areas. Reduced motion disables smooth scrolling on this page. Modal keyboard/focus behavior is inherited, but still requires parent runtime proof.

## Verification boundary

Ordinary functional verification, strict TDD OFF. `TreatmentsTests` covers source content, single UV state, six unavailable items, no extra routes, shared comparison copy, page isolation, local assets/dimensions and no-submit/pending behavior. `tools/check-treatments.cjs` is prepared for the parent's already-running preview:1440/1024/768/390/320, exact source landmarks, all asset instances/root geometry/crop, font loading, no overflow, keyboard/menu/pending focus. The writer does **not** execute the browser harness.

First offline suite:38/39 passed. The only failure assumed PNG metadata for the `.png`-named original JPEG; the test reader now detects encoding by signature. No image was recoded. Final build/test/publish results belong in the feature task's evidence section.

No live geometry, screenshot comparison, browser check, full visual acceptance or native-review approval is claimed here. The parent owns N05i and must use the fresh source marker. Only the user starts/restarts their preview.

## Source hashes

SHA-256 values below were checked against fresh downloaded source bytes; complete provenance is merged in `docs/asset-provenance.json`.

| File | SHA-256 |
|---|---|
| 16fed.png | 5b44beaf50247a40c4e8839b2ef6a6fd34787444f8c7d382febaad448f931dd0 |
| 74f40.png | 892d96f626c11c97d16839a58776f719e43437ae6072359472629dbff22c62b3 |
| b9b6a.svg | e8d2b06d18fa622d0f7bd08512ef33e69315764a46c7e9a5f5d66ebc0d4cf9c3 |
| 7bc95.svg | 22e1032afef9906e8d583d3571875a52ef483afafd1b7fba82e535b39b0e840e |
| 4e27d.svg | 97fb4ab8a82512df2d6c2f1fe0ee5ca51af754ebe3f48b83c694d41655789f66 |
| cfa16.svg | 1bc0f7625609f5f15c6b861f56ea16fb29e1328e87b6e992ca349bf272196cf6 |
| ef8cd.svg | 7bb939a77cc5848e02ed2e62a5ae3a2c461a2b9dbe38f1619e724c431bf7838b |
| 4fa2a.svg | 8c9672c22fda7c0d1e98d754fa776e0b42ad9b199ae1c1adcf528f232af2730a |
| f87fc.svg | e76250e92ebfd6b2ed15a22e1ca3694935da1a004576ca7c2f1a215259fb2c26 |
| 97fd8.svg | 975ec6f73e214af0a6a7a093a3b3a41b3073d6d0b6befb5ee12d16ce37628328 |
| dabcc.svg | 8fd0dc1e9d664754e658e3efb8de1fd31c97e16855deb500a04ab45163b5a8aa |
| e27ca.svg | a6846892b6cbdcdca6b798dbc7c1924de3a22f663e54eec57721d78dc881a44a |
| c8445.svg | 375b32f116b3ba6cf4b6ebac9adab02b50ac465597efadd2abc1288200ff95dc |
| fa384.svg | 0306da73749f27e280a184a3ea17b6a3160e8f832ebe3de451f8b47bc0b0412c |
| 9daba.svg | 434e6b8caab36b3d08604bfa6c10f199815df5bf7d4fb934ccf4b8fc0f956b6d |
| e3672.svg | 13aeaea6b551c2726d70e84d192e6e5ebd8858076f3efd1992a70b17f7319716 |
| ba1ea.svg | 98448781472c9749bfd7297b8d9ad8be262d1c779695f201c2cbfb77c5365c6c |
| 4d514.svg | 61110bbde764c5759db14d2b77acc7c9fb695ac517d2e5e78036be7e2d970e0f |
| 8e61b.svg | f03cba859597fbc03869711ec07c50353989dc74ae7f5124840a016de370bca0 |
