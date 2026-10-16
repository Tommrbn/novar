# Current user video override (2026-10-05)

The user supplied RAYAS.mp4 and selected automatic loop, initially muted. This explicitly supersedes the static photograph presentation only; the historical Figma photograph map below is not a claim that Figma supplied this video. The JPEG 3dd09.png remains unchanged as poster, HTML fallback and decode-error fallback. Copy, summary, badges, navigation and band heights/overlaps remain unchanged.

## Current media behavior and boundary
- Local original /media/treatments/antirraya-rayas.mp4: 27,472,046 bytes, SHA256 DDBB90DA92419DA922CD1F4140175920A5E6F37FC1B4F3EB099C34000A8C0F10; byte-for-byte copy, no encoding or faststart rewrite.
- Container metadata: avc1 H264 High 5.1, 3840x2160, 30fps, 190 frames, 6.333s; mp4a stereo 44100Hz audio retained (6.385s). End-of-file moov can delay startup. Container metadata alone is not browser decode proof.
- Video-specific full-band cover layout replaces the oversized photograph crop plane. Band heights remain 719/580/380px and overlaps -82/-24px. Enhanced 44px minimum Pause/Play and sound buttons sit 40px above the band bottom, above overlapping badges. Native controls remain the no-JS/incomplete-enhancement fallback.
- Scoped controller pauses inactive/offscreen/document-hidden media; automatic resumption requires muted audio, no manual pause, no reduced-motion preference and no rejected-autoplay state. User Play may override reduced motion or rejected autoplay; sound choice is never silently reset after initialization. Browser-owned autoplay is disabled only once enhancement takes ownership of markup autoplay.
- Functional test results and current pending browser/native evidence belong to odd/tasks/novar-treatment-antirraya-video.md. This section does not grant visual/user approval or native review completion. No server restart, deployment or commit is authorized.

## Historical static-image implementation evidence (superseded media presentation)

# Antirraya source and verification boundary

Antirraya is the third available state of `/tratamientos#antirraya`, alongside unchanged UV and Blue Tech. It is not another route or an interactive lens comparator. Source fidelity does not medically validate supplied copy, and offline checks do not establish browser fidelity.

## Source evidence
- High-fidelity context and inline screenshots: Figma file `BsmryGBLAW0gkLgs4Fw1X8`, full frame961:9368 (1440x3257), detail961:9374, photograph961:9917, benefits961:9502; retrieved2026-09-23 before source edits.
- Downloaded18 unique visible originals from returned Figma export prefix. Seventeen match existing local bytes; the one new original is `3dd09.png`. Screenshot responses are reference targets only.
- Despite its filename, `3dd09.png` serves original JPEG/JFIF bytes,2752x1536,2975203bytes. SHA-256 `766449505e79bb4a85aabc30f3c44404131166abe559a7768637ea6cbd96a0cf`. Preserve this original, not a converted PNG.
- The source node's name is a captured-screen label, but its image-fill export is the legitimate static photograph. The earlier Scanner instance is fully occluded by this later photo; no visible handle or specified interaction authorizes a slider.
- Exact Spanish description and three benefits remain in `treatments.json`. Do not strengthen, correct or medically endorse claims about chemical exposure.

## Source-to-code map
| Source | Desktop target at1440px | Implementation |
|---|---|---|
| Detail961:9374 | Card x129,y758,w1181.583,h178,r33.845 | `_TreatmentAntirraya.cshtml`, scoped grid and higher layer above photo |
| Title961:9377 | Poppins40030.085/45.127,tracking-.9025 | Local genuine Regular font |
| Description961:9376 | x598.324,y803.064,w668.636;40015.042/18.803,tracking-.4513 | Exact JSON copy, scoped card column and-3.01px offset |
| Photo961:9917 | Frame x-11,y854,w1461,h756; imageheight107.86%,top-7.83%; lower opaque region starts1573 | Original JPEG in source-sized plane;719px visible viewport,82px card overlap; border overlay does not reduce the source image width |
| Benefits961:9502 | x353,y1550;191/248/212wide,46high,39/36gaps | Scoped three badges;30014.748/20.969; original checks inside18.569circles |
| Active strip961:9391/9395 | Underline x462,y705; selected text70016.458 | Existing original SVG moves only in Antirraya state; selected type is700, not Blue Tech600 |
| LinkedIn961:9586 | Original1db5c.svg17.1743x17.1758 | Existing b21e2.svg is byte-identical; state CSS exposes the existing exact asset, with no footer markup changes |

Responsive1024/768/390/320 adaptations are Antirraya-scoped: stacked mobile card, clipped proportional photo, readable stacked badges. They await actual rendered proof. The chip screenshot shows a shadow not numerically exposed by returned child code; no precise unsupported shadow metric is claimed. Existing shared-shell mismatches are out of scope, not silently repaired.

## Every visible original asset
SVGs retain their intrinsic roots; wrappers provide layout, not broad100%x100% stretching. All reused assets were compared byte-for-byte with fresh Figma exports. Inactive footer alternatives remain decorative under one named button.

| Source file | Intrinsic dimensions | Visible slot/callsite |
|---|---|---|
|3dd09.png|JPEG2752x1536|Antirraya photo, `_TreatmentAntirraya`|
|74f40.png|PNG1437x553|Shared hero, `Treatments`|
|7bc95.svg|10.2128x10.2128|Three Antirraya check icons|
|4e27d.svg|1089.22x.748092|Shared strip baseline|
|cfa16.svg|135.405x3.74046|Selected strip underline|
|ef8cd.svg|13.9265x13.9265|Pending Sophia CTA arrow|
|4fa2a.svg|22.3059x18.2378|Footer n glyph|
|f87fc.svg|22.923x18.4942|Footer v glyph|
|97fd8.svg|22.0033x18.7179|Footer a glyph|
|dabcc.svg|21.9854x18.5251|Footer o glyph|
|e27ca.svg|18.2751x18.2783|Footer r glyph|
|c8445.svg|17.1763x17.1763|Footer Instagram|
|1db5c.svg / identical b21e2.svg|17.1743x17.1758|Footer LinkedIn, existing alternate image reused|
|9daba.svg|17.1763x17.1763|Footer Facebook|
|e3672.svg|24.4617x17.1758|Footer YouTube|
|ba1ea.svg|12.0696x12.0696|Header language icon|
|4d514.svg|91x15.1665|Header logo|
|8e61b.svg|91x15.1665|Hero optical-technology logo|

Fresh original metadata/hashes reside in ignored `artifacts/treatments-antirraya-source/assets.json`; the durable merged record is `docs/asset-provenance.json`. All earlier asset mappings remain preserved.

## Behavior and accessibility
The existing production `treatments.js` is unchanged: it discovers the third real fragment link and semantic panel automatically. With JavaScript, a single selected tab/panel is exposed with keyboard navigation, Home/End, Enter/Space, history synchronization and safe focus. Without JavaScript, all three semantic sections remain visible and fragment-reachable; default footer icon behavior is preserved. Four remaining treatment controls are honestly disabled. No additional routes, network calls, storage, forms, slider mechanics or real integrations are introduced.

## Verification separation and rollback
Ordinary verification, strict TDD OFF. Updated common tests retain previous states and add third-state expectations; dedicated Antirraya tests cover exact content, source JPEG/hash, semantic no-JS markup, unchanged selector bytes and state-scoped footer reuse. Node tests exercise actual production JS with an offline DOM fixture, not a real browser.

The prepared browser harness retains UV/Blue Tech checks and adds1440/1024/768/390/320 Antirraya type, geometry, original assets, overflow, keyboard/history/deep-link/no-JS and pending-action checks. The writer does not execute it. Parent owns runtime proof, test spot-check and native review/consent; connection-refused preview requires user-managed startup. AT03 and visual/native approval remain pending until observed.

Rollback removes only this slice's Antirraya data/detail/newphoto/scopedstyles and exact shared-view/test/harness/provenance deltas, not entire shared files or prior states. No deletion or commit is authorized by this description. UV/Blue Tech partials, productionJS, footer partial, model/controller/service/layout, all prior original assets/fonts and other pages are protected.

## Observed offline results
2026-09-23: isolated Release build passed with0warnings/errors; .NET tests passed47/47 with0failed/skipped; publish completed with all6 JSON content files. Three Node syntax checks passed and the offline production-script contract passed10/10. All18 fresh originals matched their intended local bytes; all96 current Figma asset records/hash values and95 prior mappings are preserved.221 protected existing project files remain unchanged. Five source/published hashes (content,CSS,unchangedJS,newphoto,reusedLinkedIn) match exactly. Commands and full evidence are in `odd/tasks/novar-treatment-antirraya.md` and its full Engram mirror763.

No source/build/test failure occurred. One task-document patch failed its exact-context validation before mutation; readback confirmed unchanged state and one corrected full-line patch succeeded. This is not a functional test failure or TDD RED. Browser harness, actual rendered checks, owner acceptance and native review remain unperformed by this worker, not silently passed.
