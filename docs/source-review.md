# Source fidelity and pending content

The approval sample follows Figma file `BsmryGBLAW0gkLgs4Fw1X8`, Home `889:1324` and Novar First `689:4828`. Desktop is the design source; tablet and mobile are implementation proposals, not additional approved Figma screens.

## Source-backed assets

- Local assets under `src/Novar.Web/wwwroot/media/figma` are exact exported image/vector bytes, not generated replacement art. The manifest records their stable Figma node, local file and SHA-256. Temporary download URLs are not runtime dependencies.
- Header/product logos and UI glyphs use genuine exported SVGs. CSS handles layout, simple controls, backgrounds and typography, not hand-drawn brand/icon geometry.
- Poppins Light/Regular/Medium/SemiBold/Bold come from the Google Fonts Poppins repository and retain the SIL OFL license locally. Bootstrap 5.3.8 CSS and bundled JS retain the upstream MIT license locally.
- Source PNGs are intentionally preserved for the approval sample. Image delivery optimization can be performed after visual approval without replacing the originals or changing the artwork.

## Missing video deliverables

| Home element | Node | Implemented fallback |
|---|---|---|
| Hero | `889:1402` | Authentic isolated 1440×999 PNG poster |
| Lens finder sunglasses | `889:1439` | Authentic isolated 604×455 PNG poster |
| World presence (superseded) | `1021:603` | Removed from Home at the user's request; original poster retained but unreferenced |

All three source elements are VIDEO fills. The available exporter rejects MP4 and only allows still-image/document formats. The retained hero/finder posters preserve actual source frames; there is no fabricated animation or entire-page screenshot implementation. Original hero/finder video playback remains **unverified and pending**, and blocks approval of those motion elements. Home node `1017:594` has no visible image fill.

## Accepted Home corrections

- The user's 18 annotations override the prior Home sample: only the AI·Lens card portrait is mirrored with CSS, treatment badges use their original SVG exports, and the side portraits overlap behind the main portrait.
- World references `889:1357` and `1072:238` contain a gradient and a plain gray rounded rectangle, respectively. The Home now uses their geometric strip context from `889:1324`, not a map or invented photographs. The removed extra standalone testimonial is not restored inside that strip.
- Newsletter copy sits above a separate warranty activation panel. There is no newsletter email field or submitting form. Activation still opens the honest pending-integration notice.
- `src/Novar.Web/wwwroot/media/novar-footer.svg` is the user's exact supplied SVG geometry, retaining its 240×32 root and internal padding. It is used only on Home; First's footer is unchanged. The marked Home footer preview link was removed, while the distinct featured First preview link remains.
- These changes still require browser geometry verification against the rebuilt app and the user's visual approval; passing .NET content checks alone is insufficient.

## Editorial review

- Home provides an answer only for its first FAQ; Novar First supplies only the final FAQ answer. Other answers explicitly display an editorial-pending message. No new medical explanations were authored.
- MyoFix is a Home highlighted card but has no supplied detail frame. Its CTA discloses this instead of inventing a page or linking it to First.
- First's rendered cards show **Psicoptix Technology™** and **CDT Technology™**. The extra Adaptative Focus Technology text appears in generated source context but not in the visible card pair; it is not added as a third technology card.
- Figma copy and claims (age suitability, optical benefits, AI, counters, testimonials and warranty duration) are retained for review, not independently validated facts or legal/medical approval.
- Home testimonial navigation is a pending-state notice, not an invented set of reviews. Only supplied content is shown.
- Later designs still require owner review: Outdoor description says Novar Sport; Indoor says Novar Relax; Office says Kriptok Blended; eLIFE FAQ says Novar Geo; Fotosensible says “El agua no de adhiere”. No correction was made in this sample.

## Human acceptance gate

Approve Home and First in desktop/mobile before N04/N05. Functional checks do not grant visual, medical, editorial, deployment or user approval. Other routes are honest placeholders for the next approved implementation stage.

## Second Home correction round: typography and source compositions

User confirmed annotation13 refers to the contact form, although supplied node961:4434 is FAQ. The actual contact group964:980 was retrieved with fresh high-fidelity context/screenshot; FAQ remains unchanged. The newly requested quote belongs inside purple card1072:242, using text siblings1072:244/245, not as a separate paragraph under testimonials. Its content is exposed to assistive technology; only the decorative opening mark is hidden.

All following typography uses Poppins, normal style. Measurements are CSS pixels from source text styles; mobile retains a scoped responsive proposal rather than changing First or global type defaults.

| Element/source | Previous sample | Corrected desktop source |
|---|---|---|
| Treatment eyebrow889:2156 | 500, 12/19.8, +1 tracking, uppercase | ExtraLight200, 16.6044/62.2665, -.4981 tracking, original case; line centered in37.496-high pill |
| Treatment heading889:1722 | Light300, 37/44.4, -1.1 tracking | Light300, 36.869/41.293, 0 tracking per native text ranges |
| Treatment copy889:2152 | Regular400, 14/23 | Regular400, 16.5229/20.2781, -.4957 tracking, original Bold700 emphasis |
| Benefit labels889:1732–34 | Regular400, 11/15.4 | Regular400, 13.8259/18.4345 |
| CTA889:1764/65 | Medium500, 13/19.5, no arrow | Regular400, 14/20;173×48 source composition with15×15 arrow |
| Contact intro964:981 | Medium500, 12/19.8 | Regular400,26/36,-.78 tracking |
| Contact title964:981 | Light300 italic,30/36,-1.2 tracking | SemiBold600 normal,26/36,-.78 tracking |
| Contact labels964:982/84/86/88 | Regular400,10/15 | Regular400,16/24,-.48 tracking |
| Send964:999 | Medium500,13/19.5 | SemiBold600,16.6259,normal line-height |
| Purple quote1072:245 | Missing | Regular400,12/18.75,-.36 tracking; opening mark96px |

Poppins ExtraLight is served locally, not synthesized. The [official Google Fonts catalog](https://github.com/google/fonts/blob/main/ofl/poppins/METADATA.pb) maps `Poppins-ExtraLight.ttf` to200. Its original TTF typographic names are Poppins/ExtraLight, while its legacy OS/2 weight field is275; the CSS explicitly binds200 and the original bytes are unchanged. Existing SIL OFL covers this added face. Font and checksum are recorded separately in the asset manifest.

### Exact asset slots
- First benefit: background `bf6dd.svg`68.2077×68.2077 plus `6c179.svg`35.5037×30.5816, not a reduced standalone glyph. Other benefits `38049.svg` and `37216.svg` retain68.2077px roots. Dividers use the original `6acd9.svg` rotated as a whole; arrow is `e3b22.svg`15×15.
- Contact Instagram: `b0b3b.svg`26.2845×28.0087, `af7e5.svg`13.456×14.3392 and `de04b.svg`3.34564×3.62228 at original relative positions.
- Contact LinkedIn: `121ca.svg`5.11091×18.9252, `fa725.svg`5.84104×6.05608 and `d97eb.svg`17.5231×18.9252, with original placement. It is second, not Facebook.
- Contact Facebook: `d8886.svg`26.2847×27.2524, third. YouTube: `6e7af.svg`34.3139×24.9805, fourth. Accessible pending-action labels match the visual brand. Shared footer social markup is unchanged.
- Contact form preserves four associated labels, no input names, disabled implicit submitter and pending-only action. Desktop has details left/message right; mobile stacks the same fields. No real email integration is introduced.

The `data-home-revision="home-fidelity-v2"` marker identifies this Razor revision for browser verification. CSS refresh alone does not prove updated markup was served.

## Hidrofóbico state — Figma961:8795

- Implemented only `/tratamientos#hidrofobico` as the fifth state, preserving the existing four states, route, comparison claims and all unrelated pages. Source summary961:8801 and benefits961:8929 provide exact Spanish content; the source typo **El agua no de adhiere** at961:8938 is intentionally preserved pending owner review.
- Fresh high-fidelity context plus source screenshot establish the static water-on-glasses original `dd2a0.png`: JPEG2752x1536,2,902,369bytes,SHA-256 `5d1da0da850a4ae4f9a10e206bb10ba8170276e686305ff7d9d07b82cffcf008`. Scanner961:8797 starts x-23,y893,width1684 (not the previous state x-124); the1399/779 image plane is masked at y1573. No defined interaction is replaced with a fictional slider.
- All18 source originals compared;17 byte-identical local originals reused. Existing header843a7/technology279a2/LinkedInb21e2 alternatives selected via Hidrofóbico-only CSS, with no layout/footer/production-JS change. RootSVG dimensions retained. Summary title Poppins40030.085/45.127, paragraph40015.042/18.803, chips30014.748/20.969 and active tab70016.458. Responsive reflow is scoped to this state.
- Original files/hashes/provenance remain source evidence, not live visual approval. Parent preview attempt at `http://localhost:5080/tratamientos` returned `ERR_CONNECTION_REFUSED`; actual asset geometry, typography, responsive and visual proof remain pending. No server operations, real integration, commits or deployment performed. See `odd/tasks/novar-treatment-hidrofobico.md` and full Engram789 for observed offline results and remaining HY03.

## Fotosensible: sixth Treatments state (967:10192)

The shared `/tratamientos#fotosensible` state now includes the exact original description and static photograph from frame967:10192, with card967:10198, photo967:10194 and benefits967:10326. The photo is `23aae.png` (authentic JPEG2752x1536 despite its suffix;2,600,250bytes;SHA-256 `4A804FE7BE6980C75C91EB8285BC260A3831A9BF9C8B461ABE5B538DCC8CB076`). Source crop is a1684x937.696 plane atx-146,y847 with image width124.65%,height124.95%,left-16%,top-12.48%; later opaque background clips at y1573. Preserve the card overlap and chips at1550.

Source chips intentionally remain `Siempre limpio`, `El agua no de adhiere`, `Mantiene la claridad`. These repeat Hidrofobico-like benefits and include a source typo; owner editorial review remains required. Shared comparison copy `Se adapta a la luz.`, `Oscurece afuera`, `Aclara adentro` is unchanged. Hidden scanner line/arrows in source metadata do not authorize a slider or comparison interaction.

All18 fresh exports were compared against local files;17 originals reused exactly and only the photo added. Source LinkedIn `1db5c.svg` is byte-identical to existing `b21e2.svg`, including root17.1743x17.1758. The existing alternate is used only for this state; source mapping is retained for both records. Header/technology alternatives `843a7.svg`/`279a2.svg` are selected by scoped CSS. Existing SVG roots and production JS/model/controller/service/layout/footer remain unchanged.

Recovery: `odd/tasks/novar-treatment-fotosensible.md`, full Engram799. Original metadata/hashes, baseline and audit are in ignored `artifacts/treatments-fotosensible-evidence/`. Source marker `treatments-fotosensible-v1` identifies this candidate. Functional checks must be recorded in the tracker after observed execution; this note alone is not PASS. Live geometry, loaded typography, responsive/keyboard screenshots and owner acceptance remain parent-owned/pending; no server or browser was started by the writer. Sophia and other real integrations remain pending; iLUX remains unavailable.
## Antirreflejo iLUX seventh state (2026-09-23)

The separately authorized iLUX state extends `/tratamientos#ilux`, not a new route. Source: [frame961:8330](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=961-8330&m=dev), summary961:8420, scanner961:8419 and benefits961:8495. The shared six earlier states, comparison copy and integration boundaries remain unchanged.

- Exact description and source chips are retained: `Mayor durabilidad`, `Superficie más resistente`, `Mantiene la claridad`. These chips repeat Antirraya; owner editorial review is pending, not permission to substitute inferred antireflective claims.
- The summary uses authentic Poppins Regular30.085/45.127px with-.9025px tracking and only the `iLUX` segment SemiBold600. Body is Regular15.042/18.803px, tracking-.4513px,#7B7B80. Chips use Light300,14.748/20.969px; the selected tab is600, not700.
- Scanner `b6e78.png` is an unchanged original **JPEG2752x1536**,3,178,272bytes,SHA-256 `34EB8F20BE5733377004832E67B0344C789BB4469F201BF4C9A525C08D61CEA8`. Source plane1684x937.696 atx-124,y893 uses image121.63%/121.92% at-10.79%/-18.69%, masked at1573; the summary is layered above. The static photograph itself depicts one reflected and one clear lens. No slider, drag handle or simulated comparison was invented.
- All18 fresh exports match the local originals;17 were reused byte-for-byte. This state uses default header4d514.svg/hero8e61b.svg plus LinkedInb21e2.svg, not the Polarizado header/hero variants. Every SVG retains its intrinsic root dimensions. The source screenshot is reference only, not an asset.
- Seven native fragment links remain usable without JavaScript; the unchanged production enhancement adds keyboard/focus/history behavior. Sophia and social actions remain explicit pending integrations. No backend, process or server operation was added.

Runtime geometry, loaded font faces, screenshots, responsive overflow and owner visual acceptance remain pending under the parent's user-managed preview. Source/offline checks do not establish browser fidelity; the parent last observed connection refused.
