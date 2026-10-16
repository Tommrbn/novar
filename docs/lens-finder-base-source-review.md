# Initial lens-finder base: source and proof boundary

Only `/lentes` receives the supplied initial heading, description, three closed rows and CTA. Filters, full catalog results and AI LENS/MYOLENS/AI WORK product details are not implemented by this slice. Home and the shared header/footer retain their existing designs.

## Source inspected

- Figma file `BsmryGBLAW0gkLgs4Fw1X8`, [matching group 889:1406](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/?node-id=889-1406), [heading 889:1409](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/?node-id=889-1409), [controls 889:1410](https://www.figma.com/design/BsmryGBLAW0gkLgs4Fw1X8/?node-id=889-1410).
- Fresh high-fidelity design context and screenshot were inspected before source edits. The user crop selects the right-hand content only; glasses/video and the red editor guide are intentionally excluded.
- Source column is 560px, heading is 40px/48px (Light 300 then Regular 400), paragraph is 14px/22px (Light 300 with Medium 500 emphasis). Paragraph follows heading by 8px. Three rows use 14px/20px Medium 500, 16px vertical padding and 1px separators; filter group has 24px vertical margins. CTA is approximately 247x48 with 14px/20px Regular 400, 12px gap and 14px/28px padding.
- Poppins faces are existing local originals. Global tokens provide `#1F023C`, `#1A1228` and `#F6F5F7`; page-only styling supplies `#090E17`, `#6B5A8A` and the source separator opacity.

The screenshot is magnified; dimensions were not multiplied to match the image's pixel size. No separate whole-page or mobile Figma scaffold was supplied. Existing `.container-novar` alignment and prior page-shell vertical spacing are reused; the column shrinks with the viewport. Runtime geometry and owner acceptance remain separate from source implementation.

## Local asset reuse

| Asset | Exact slot and intrinsic root | Existing manifest SHA-256 |
| --- | --- | --- |
| `f3d35.svg` | One 14x14 downward chevron at the right of each of three rows | `9540e2e631c2c32c69135a57d2416cf29e52595723453a4d52ef4a9d0361c114` |
| `e3b22.svg` | One 15x15 white arrow after the CTA label | `326d18cc868437cf1120336fa4b0fe71d6c81e5e71681966b495dc0b98d2ee25` |

Both original SVG files and `docs/asset-provenance.json` are unchanged. Existing manifest entries already associate the originals with Home `889:1324`; the child callsites are recorded above. No download, re-encoding, inline/redrawn SVG or temporary asset URL is used. Nonempty files, hashes, roots and all four callsites are covered by offline checks; effective rendered size/layers are parent runtime checks.

## Honest actions and accessibility

All four controls are native keyboard-operable buttons with pending-integration accessible names and `aria-haspopup="dialog"`. Existing `site.js` opens the shared pending modal and restores focus. There are no fake expansion attributes, nonexistent panels, options, form payloads, stored data or generated recommendations. The CTA does not link back to its own route or promise an implemented catalog. With JavaScript disabled, the existing shared notice explains that JavaScript is needed for pending notices.

## Verification and remaining work

The scoped root marker is `data-lens-finder-revision="lens-finder-base-v1"`. xUnit checks cover exact source copy, three rows/four pending actions, route and shared-shell isolation, local originals/fonts, asset delivery and rejected POST. Existing tests retain First, all 17 planned product placeholders and unknown-product 404 coverage.

`tools/check-lens-finder.cjs` is a repeatable runtime harness, but this writer only syntax-checks it. Current parent live inspection uses CUA; the writer does not connect Playwright or operate the user-owned preview. The harness records screenshots, geometry and keyboard/pending-focus behavior at 1440/1024/768/390/320 if separately authorized later.

Exact command results, preservation evidence and remaining LF03 runtime/native/visual work are recorded in `odd/tasks/novar-lens-finder-base.md` and its full Engram mirror 869. Neither source tests nor published artifacts imply that Visual Studio's current process serves the new Razor or that the user has accepted its appearance.
