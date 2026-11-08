# Portfolio redesign — Cobalt Signal

## Why

The current page is competent but shares Volyx Lens's warm bone ground and forest
green. The portfolio reads as an extension of the product instead of Joshua's own
work. The first viewport also spends its strongest area on an index that repeats
the navigation and an abstract system map; the actual product evidence starts
below the fold.

The project images confirm the drift:

- Volyx Lens is still the old Context Aperture landing-page capture. The live site
  now uses the app-chrome hero.
- Local Review Intelligence uses an older dashboard capture. The current source
  capture is `local_AI_agent/docs/assets/review-intelligence-dashboard.jpg`.
- Football Forecasting matches the current source capture, so it stays.

## Direction

**Cobalt Signal.** A cool, instrument-like portfolio rather than a second Volyx
Lens page.

- Ground: cool porcelain and blue-grey, not warm paper.
- Ink: near-black navy.
- Signal: cobalt `#2447ff` for the primary action, index marks and focus.
- Secondary: burnt coral for live status and one small contrast moment.
- Glass remains only where something passes underneath: masthead, assistant panel
  and launcher. Project evidence stays opaque.
- Type: keep Archivo and Azeret Mono. Make the existing pairing do more through
  scale, rules and tighter alignment, not a new font.
- Shape: reduce the large soft-card language. Use 16–20px evidence plates, 10px
  controls where appropriate, and one cobalt rule that runs through the page.
- Surface: a faint blue grid and a single cool light wash. No aurora orbs, no
  gradient text, no decorative green.

## Page changes

1. **Hero** — replace the `Inside` navigation card with a live Volyx Lens proof
   plate. The first screen shows the headline, the ask, and a current product
   image. Remove the duplicate index from the hero.
2. **Selected work** — keep the three primary cases, but make the media the entry
   point. Each case gets a current capture, a tighter case bar, and a less rounded
   evidence frame.
3. **System map** — retain as the bridge into how the work is built, but move it
   out of the first viewport.
4. **Open source and writing** — keep the information; replace card backgrounds
   with rules, cobalt numerals and tighter row spacing.
5. **Closing** — deep navy-cobalt block, white type, one clear email action.
6. **Assistant** — preserve behaviour and accessibility; restyle launcher and
   panel to the cobalt system.

## Image plan

- Capture the current Volyx Lens production hero at 2× and trim the next-section
  bleed.
- Use the current Local Review Intelligence source capture; rename the asset by
  content hash so browsers do not keep the old image.
- Keep Football Forecasting; verify its hash against
  `football_predictor/docs/assets/dashboard-overview.jpg`.
- Regenerate 480/800/1200 WebP variants from the same source files.
- Update alt text and captions to describe the current screens, not the old
  landing page.
- Update the image contract tests to the new filenames, dimensions and alt text.

## Execution gates

- Desktop 1440, tablet 1024/768, phone 390/320: no overflow, no clipped labels,
  no missing media.
- Light and dark themes: contrast and focus states checked.
- Existing assistant, navigation, theme, reduced-motion and axe tests remain green.
- Build and preview before production. One PR against `main`; verify the
  Cloudflare preview, then the production root and changed images after merge.

## Implemented

- **Palette.** Cool porcelain ground `#e9eef6`, near-black navy ink
  `#0a1020`, cobalt signal `#2447ff`, burnt coral status accents. The warm bone
  and forest tokens are gone from the page, 404, favicon, manifest, theme-color
  and social card. The Volyx Lens screenshot keeps its own product palette; it
  is evidence, not the site chrome.
- **Hero.** The duplicate `Inside` index is replaced by a live Volyx Lens proof
  plate. Desktop and tablet keep two columns; phones stack, crop the proof to
  16:9 and keep the hero under the existing height budgets. The chat launcher is
  a 52px icon-only control on phones so it does less damage to the proof caption.
- **Work.** The Volyx Lens card now uses the current production landing capture.
  Local Review Intelligence uses the current dashboard source. Football
  Forecasting was already current. Every image has 480/800/1200 WebP variants,
  current alt text and a visible caption.
- **Surfaces.** Project cards and the system map are opaque; glass is reserved for
  the masthead, assistant panel and launcher. Contribution and writing rows are
  rules rather than cards. The closing block is deep navy-cobalt.
- **Identity surfaces.** `og-card-v9.png`, the favicon set, Apple touch icon,
  manifest colours, 404 and CSP hash all follow the new palette.
- **Verification.** `node --test tests/*.test.js` 278 pass; Playwright 26 pass at
  320/359/390/744/768/1024/1366/1440; axe clean in light and dark. The CV test
  script cannot run on this host because python-docx and pypdf are not installed.
