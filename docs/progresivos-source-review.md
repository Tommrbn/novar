# Progresivos: preserved source and review boundaries

Five new product routes and the source-verified First corrections use the six supplied desktop frames. The implementation preserves source copy even when editorially inconsistent. Offline tests are not visual, medical, editorial, deployment or native-review approval.

## Source identity

Figma file: [WEB-VISION-NOVAR](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/WEB-VISION-NOVAR).

| Route | Frame | Original outlined wordmark | Hero / scene / detail |
|---|---|---|---|
| /lentes/first | 689:4828 | Existing bcfcf, 4cd56, 720fe SVGs | 4fa80 / 4fd70 / 316aa |
| /lentes/precisa | 974:621 | 974:653, 415 × 107 | 17cde / 9e69b / b08fa |
| /lentes/precisa-short | 982:221 | 982:253, 308 × 188 | 17cde over aee00 / 074f6 / d9782 |
| /lentes/evolution | 964:2655 | 964:2780, 415 × 107 | 05e7f / b12ec / e2ed7 |
| /lentes/evolution-short | 1002:246 | 1002:277, 411 × 204 | 05e7f over 65030 / a3a80 / 14e3b |
| /lentes/elife | 974:266 | 974:313, 415 × 107 | 48fbb / 5df35 / a06b4 |

All photos above are original PNG exports. The five complete wordmark groups were exported individually from cached Figma geometry with SVG text outlines; Author is missing locally and in Figma, but the resulting original exports contain 10 paths and zero text elements each. No font substitution, font installation, redrawing or screenshot-as-code asset was used. The Precisa balance icon is the original 974:906 SVG export.

The full six high-fidelity contexts and screenshots were inspected. Desktop source is 1440 × 5841 for First and 1440 × 5849 for the other five. Smaller layouts are accessible responsive interpretations, not approved mobile Figma frames. Source SVG roots are not overwritten by width/height attributes; responsive wordmarks use proportional transforms.

## Editorial decisions still needing the owner

| Source | Preserved discrepancy |
|---|---|
| Precisa Short, 982:228 and 982:288/294 | Intro and FAQ still identify “Novar Precisa”, despite the “Precisa Short” hero. |
| Evolution, 964:2951 | Detail body says “Novar Geo”, “reducir aberraciones y mejorar la calidad visual”, and “opción monofocal”. This is not silently changed into progressive-product advice. |
| Evolution Short, 1002:453 | Literal “Usuariosexigentes que usan armazones pequeños.” is retained. |
| Evolution, 964:2959 / 989:684 | Specification says “Smart Molding Process.”; third technology card says “Smart Fit Technology”. |
| eLIFE, 974:492 / 982:218 | Specification says “Adaptive Focus Technology.”; card says “Adaptative Focus Technology”. |
| eLIFE, 974:348/354 | Fresh FAQ says “Novar eLife”; older repository notes claiming a Geo FAQ are stale. The older global document is not rewritten. |
| Missing FAQ bodies | Only the last question has an authored answer. Unauthored answers use the existing explicit editorial-pending notice. |

All other Spanish copy remains from the corresponding source, including punctuation/case distinctions and “Mayor nítidez”. This document does not validate product efficacy or add medical claims.

## Interaction limits

- Customization reuses the existing pending modal, honest no-data/no-results notice, keyboard dismissal and focus restoration. No customizer or backend is implied.
- FAQ uses the existing Bootstrap accordion and last-authored-answer initial state: index 3 for First, index 2 otherwise.
- Treatments and contact retain existing working route/anchor targets.
- Related cards retain the existing catalog destination `/lentes`. Source hover variants 1:1977, 1:1986 and 1:1995 provide 300 ms ease-out blur/label/original-pill presentation, not a confirmed product navigation reaction. Keyboard focus exposes the same content; reduced motion disables the transition.
- The shared tagline hover points every product to 443:1240, whose “Visión sin esfuerzo” conflicts with non-First default text. Text switching is deferred pending owner confirmation; source-backed default taglines remain. No autoplay, filters or recommendations are invented.
- Only source-visible technology cards are rendered: two on First/Precisa/Precisa Short/Evolution Short; three on Evolution/eLIFE, with horizontal keyboard-scrollable overflow rather than silently dropping the partially visible third card.

## Isolation and review

Only authorized product routes load progressive-products.css. First additionally loads progressive-first.css; its existing ProductContent, content.First and first.json values remain unchanged. Existing Premium source and unrelated pages are protected. PremiumTests has exactly two parent-authorized catalog-partition assertion updates; every Premium behavior assertion remains intact.

Asset manifests are additive. Download lists preserve exact returned Figma asset URLs under artifacts/progresivos-evidence; their URLs are evidence, not runtime dependencies. Original bytes, intrinsic roots, local decodes, callsites and source/publish equality are checked separately. Runtime render/crop geometry, viewport overflow and interactive accessibility still require parent browser verification against the inspected source screenshots.

No preview process, Visual Studio, port, remote host, commit or deployment is controlled by this writer.

## User-authorized gallery and First FAQ correction — 2026-09-25

This additive section supersedes only the earlier no-autoplay statement for the six progressive portrait galleries and the original First FAQ contract. All prior source/wordmark/editorial evidence and other product questions remain valid history.

The gallery track combined auto horizontal margins with left50%/translateX(-50%), producing an extra207.5px offset at parent-measured1920px viewport/page1905. It now uses zero horizontal margins and one stationary centering transform. Four original image nodes retain their filenames, original bytes and identity-specific crop selectors; visual positions rotate independently. First image2/4, Evolution image2 and eLIFE image1/3 no longer inherit crop from a changing visual slot.

One page-scoped native controller is loaded only by First and ProgressiveProduct via their Scripts sections. No shared layout/site.js or other product group changed. The new gallery revision is `progresivos-gallery-v2`; the overall `progresivos-v1` marker remains. Native buttons provide previous, persistent pause/resume and next. Autoplay has independent user, hover, focus, hidden, offscreen, reduced-motion and lifecycle blockers; manual changes do not steal focus or silently clear user pause. Only manual navigation is announced. Missing JavaScript retains the centered static grid; missing observer support leaves manual controls. bfcache suspends active observers/listeners/timers and reconnects once without losing index/user pause. Page exit destroys timers/observers/listeners. Reduced motion prevents autoplay and makes manual changes instant.

**Motion provenance:** recursive First motion evidence returned no nodes. The5000ms cadence and650ms ease-in-out transition are implementation defaults authorized for the user's new automatic-carousel request, not authored Figma timing. Source-backed static composition/crops are retained; no carousel or medical recommendation engine is invented.

**First copy override:** the user explicitly supplied these three complete pairs, replacing the previous four-item array. Only `first.json` questions changed; last-open panel is index2. All other First fields and the other five progressive FAQ arrays remain unchanged.

1. ¿Qué es Novar First? — Es un lente progresivo pensado para personas que comienzan a usar multifocales y buscan una adaptación cómoda.
2. ¿Para quién está recomendado? — Para usuarios que empiezan a notar dificultad para ver de cerca y necesitan una solución progresiva para todas las distancias.
3. ¿Qué lo diferencia? — Su diseño prioriza una experiencia simple, natural y fácil de incorporar al uso diario.

PRG06 initial offline evidence: Release build0warnings/0errors, full.NET218/218 and Node13/13. Final correction commands/audit are recorded in `odd/tasks/novar-progresivos-pages.md`. These checks are not runtime or visual/medical/editorial/native approval. Parent handles user-restarted compiled Razor, six-route true-width review and remaining PRG05 decisions; writer did not operate the server or browser.
