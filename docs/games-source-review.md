# Juegos: source fidelity and verification boundary

## Trivia activation addendum — 2026-09-25
The user supplied ten questions and explicitly authorized answering them and viewing aciertos. Only Trivia now has local interactive behavior; Código Visual stays pending and Intruso remains its unchanged default static preview. Historical presentation-only notes below describe the original delivery, not the newly authorized Trivia boundary. Recovery record: `odd/tasks/novar-games-trivia.md`, mirror #849.

Trivia keeps the supplied question/option order and key1B/2B/3C/4B/5A/6B/7B/8D/9B/10D in typed `games.json`. Razor renders escaped legends/labels and numeric key attributes; no raw HTML or duplicated JavaScript question bank is used. One question at a time uses native radios, explicit Comprobar, polite feedback, Siguiente/Ver resultado, Aciertos X/10 and Reintentar. The deterministic state module rejects invalid indices, skips and repeat scoring. Choices survive panel switching only in memory; page reload/retry resets them. No timer, storage, transport or clinical assessment exists. The educational disclaimer and Intruso-specific demo notice distinguish both scopes.

The original `games-v1` marker remains; `data-trivia-revision="trivia-v1"` identifies the extension. Parent browser inspection found nullable Razor data-* values had emitted empty attributes, causing Intruso to open an unintended blank pending modal. Explicit button branches now omit `data-pending` entirely on Intruso/Trivia; only Código carries it. The unchanged card body moved to `_GameCardContent.cshtml` without visual changes. Shared site.js, header/footer, assets and other pages remain untouched.

Native Node tests exercise all-correct/incorrect/mixed scores, invalid selection, guarded advance/check, immutable state and restart. .NET checks preserve exact supplied text/key and verify labeled controls, safe default state, local script isolation and pending-attribute absence. The scoped browser harness retains original layout checks and adds keyboard Trivia, switching, score/retry, long bonus option wrapping and no-false-modal checks. Parent runtime proof remains separate from offline tests; exact outcomes live in the focused tracker.

`/juegos` implements the supplied presentation and Intruso initial visual state, not a game engine. Figma reference: [961:7324](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR?node-id=961-7324). Fresh high-fidelity context and screenshot were read before edits. Source revision: `games-v1`.

## Review path
1. Compare the 1440×2730 desktop reference with the new page.
2. Check the three cards, instructional section and Intruso preview in order.
3. Confirm the visible demo notice and pending actions: round1/5 and score0 never change.
4. Inspect responsive proposals at1024,768,390 and320; no original mobile reference was supplied.

## Source metrics
| Area | Desktop source |
|---|---|
| Header | x208/y29, width1024; original91×15.1665 logo; navigation14/20 Regular, active Juegos600 |
| Hero | container y190; heading Light30052/57.2, two lines; subtitle Light30016/24 |
| Cards | y485; outer grid1114.12, gap22.2824; side art356.518×259.961; featured367.214×269.673, raised17.464 |
| Card numbers | Thin10022/29.71 (featured30.601); original ordering02/,01/,03/ |
| Card titles | Medium50016/25.996, tracking.3342; featured17/26.776, tracking.3443 |
| Card descriptions | Light30012.998/18.569; featured13/19.126 |
| How badge | y1059,164×38; ExtraLight20016/62.267, tracking-.48 |
| How title | y1122; Light30033/50.135 |
| Three steps | 44.565 circles; Medium50014/22.282 titles; Light30012.998/21.122 descriptions |
| Arena | x232/y1535,976×548; padding48; title Bold70020/28; meta Regular40012/16; instruction14/20 |
| Color grid | 320×320, three columns,8gap; circles#3019e1, top-middle#5342d7 |
| Footer | begins y2318; inner1134 with24padding; four240columns,48gap; copyright12/16 |

## Original asset map
All SVG roots remain intrinsic, without width/height attributes at callsites or broad100% sizing. Original bytes are preserved. Downloaded source exports were hashed against the existing reused files before provenance was updated.

| Original file | Root size | Slot/layer |
|---|---|---|
| c5011.svg | 31.7764×29.7082 | Trivia dot grid row3/col1, in25×24 slot; left-3.3882/top-4, above black art |
| 6231f.svg | 984.302×556.302 | Arena backdrop below content; wrapper976×548, left-4.151/top3 |
| 4d514.svg | 91×15.1665 | Games header logo, not the subtly different About glyph export |
| ba1ea.svg | 12.0696×12.0696 | Header Spanish language indicator |
| 4fa2a.svg | 22.3059×18.2378 | Footer n, left0/top3.0432 |
| f87fc.svg | 22.923×18.4942 | Footer v, left49.296/top3.4816 |
| 97fd8.svg | 22.0033×18.7179 | Footer a, left71.136/top3 |
| dabcc.svg | 21.9854×18.5251 | Footer o, left24.816/top3.0816 |
| e27ca.svg | 18.2751×18.2783 | Footer r, left95.592/top3 |
| c8445.svg | 17.1763×17.1763 | Footer Instagram |
| fa384.svg | 17.1704×17.1746 | Footer LinkedIn |
| 9daba.svg | 17.1763×17.1763 | Footer Facebook |
| e3672.svg | 24.4617×17.1758 | Footer YouTube |

Cards use CSS circles/gradients for original Figma primitives; the star and arena are original SVGs, not redrawn approximations. The new Thin font is the original licensed `Poppins-Thin.ttf`; official Google Fonts `METADATA.pb` maps it to100. Its legacy OS/2 weight field says250, just as the existing ExtraLight font has a legacy275 field; preserve original bytes and use the official100 CSS mapping. Existing200–700 assets remain unchanged. SHA-256 provenance is in `asset-provenance.json`.

## Responsive and interaction adaptations
- Below1200 the shared Bootstrap menu collapses; Games-scoped styles preserve other page behavior.
- At mobile widths cards and steps stack in source order. The preview grid shrinks uniformly but remains above44px per button. Typography remains readable rather than scaling a screenshot.
- The narrow arena keeps the original SVG intrinsic size centered and clipped behind a responsive rounded card. This deliberately adapts the desktop-only decoration, without rewriting or stretching SVG geometry.
- Intruso card moves keyboard focus to the supplied preview. Código Visual, Trivia, preview colors, warranty and socials open the existing accessible pending modal. Bootstrap manages modal focus/Escape; existing site.js restores trigger focus.
- Visible demo disclosure is an intentional addition required by the agreed no-fake-results boundary. Original headings are retained but do not imply implemented tests. No vision assessment, score calculation, timer, game persistence or question bank exists.
- Reduced motion is respected. No POST payload, external request or storage is added.

## Verification
Tests cover exact copy, card/dot counts, three steps, static demo/pending semantics, page-scoped CSS/JS, local asset roots and font presence; existing Home/First/About tests remain applicable. `tools/check-games.cjs` checks fresh revision, all13 asset slots, font loading, desktop landmarks, responsive overflow, keyboard/menu/modal focus and unchanged demo state at five widths. The writer does not run browser checks or operate the preview server; parent runtime evidence is required.

The protected file hashes, exact build/test/publish outcomes and pending runtime checks are recorded in `odd/tasks/novar-web-navegable.md`. No native-review approval or human visual acceptance is inferred from build/tests.

## Rollback
Remove Games-only content/model/view/footer/CSS/JS, tests/harness and new asset records; reverse only Games-specific route/service/layout hooks. Preserve Home, First, About, original reused assets and unrelated future treatments. No commit, deployment or remote mutation is part of this unit.

## Intruso Cromático and Código Visual activation addendum — 2026-09-28

The user authorized both existing cards as local, recreational five-round games. Historical notes above reflect the presentation/Trivia boundaries when originally written; this dated addendum supersedes only current activation status, not prior source-fidelity, Trivia, or offline-proof evidence.

- Both games are untimed: one accepted decision per round, one point per correct response, explicit feedback and Siguiente, a final score out of five, and retry. Each uses a deterministic local seed; attempts and scores live only in page memory.
- Intruso presents nine native buttons with exactly one hue variation. The differing visual is necessarily observable; source provides no clinical-grade hiding or cheat-proof guarantee. It emits no correctness attribute/text/ARIA or position before the choice.
- Código presents a new locally generated 5×7 dotted digit glyph, not a reproduced diagnostic plate. A labeled numeric text field accepts exactly one ASCII digit 0–9; blank, non-digit, signed, decimal, whitespace, and multi-digit inputs are rejected without consuming a round. It reveals answer/correctness only after checking.
- Scores are recreation feedback only, never a measure/diagnosis of visual function. There is no timer, request, storage or clinical interpretation. Switching panels preserves in-memory round/progress and Código's unchecked draft; inactive controls are disabled and ignore events.
- `games-v1` and Trivia's exact `trivia-v1` bank/key/flow remain. `visual-games-v1` marks the new scope. Source and offline proof locator: `odd/tasks/novar-visual-games.md`, Engram mirror `odd/novar-visual-games/tasks`.
- The writer runs offline checks only. Parent owns the browser/runtime gate against the user-managed preview; after explicit user intent to start Visual Studio, a fresh hidden CUA navigation still returned `net::ERR_CONNECTION_REFUSED`. No server/runtime or visual acceptance is inferred from build/tests.
