# Social card v6: provenance and QA

## Purpose

A purpose-built 1200×630 Open Graph and Twitter/X card for Joshua Nwachinemere’s AI Engineer portfolio. It replaces the stale cropped-homepage card and communicates one primary message at feed size: reliable Python systems for applied AI.

## Files

- Editable source: `design/social-card-v6.html`
- Production export: `public/og-card-v6.png`
- Renderer: Playwright Chromium through `scripts/build-social-card.js`
- Rebuild command: `npm run build:assets`

## Visual system

- Canvas: 1200×630
- Background: `#f3f3f0`
- Primary ink: `#15171a`
- Supporting ink: `#383c40` and `#565b60`
- Safe area: all meaningful elements remain at least 80 pixels from the horizontal canvas edges and at least 72 pixels from the vertical canvas edges
- Dominant message: “Reliable Python systems for applied AI.”
- Supporting proof: five inspectable projects and eight merged upstream contributions

## Typography and rights

The card and website self-host these Google Fonts releases:

- Manrope
- DM Mono
- Newsreader

They are distributed under the SIL Open Font License. License texts are stored in `public/fonts/licenses/`.

## QA record

- Exported at exactly 1200×630 with no document overflow.
- Measured system-map bounds: x=740 to x=1120, preserving an 80-pixel right safe margin.
- Measured headline bounds: x=80 to x=700.
- Inspected exported pixels after two revisions for clipping, feed-size hierarchy, contrast, diagram readability, and brand consistency.
- Final visual review: no blocker or high-severity findings.
- SHA-256 is recorded by the release diff/evidence packet rather than frozen here, because rebuilding the asset intentionally changes the digest when source changes.

## Alt text

Joshua Nwachinemere, AI Engineer building reliable Python systems for applied AI, with five inspectable projects and eight merged upstream contributions.
