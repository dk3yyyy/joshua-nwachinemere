# DESIGN.md — portfolio visual system

Status: current for the 2026 liquid-glass redesign. Source of truth for tokens
is `src/styles.css`; this file records the decisions behind them.

## World

A lit room behind glass. Three slow colour fields (blue, rose, mint) drift on a
pale daylight ground; every surface is a translucent sheet with a blurred
backdrop, a saturated lift, and a bright inner edge. Ink stays dark so the page
reads as an engineer's portfolio, not a concept demo.

## Color

| Token | Light | Dark | Use |
|---|---|---|---|
| `--sheet` / html ground | `#eaf1f7` | `#070b12` | page ground |
| `--glass` | `rgba(255,255,255,.34)` | `rgba(14,20,32,.52)` | panels |
| `--glass-raised` | `rgba(255,255,255,.52)` | `rgba(20,28,44,.68)` | bars, figures, assistant |
| `--glass-soft` | `rgba(255,255,255,.22)` | `rgba(14,20,32,.34)` | rows, chips |
| `--ink` | `#0b1620` | `#f1f6fd` | primary text |
| `--ink-soft` | `#24313d` | `#d5dfea` | body copy |
| `--muted` | `#465462` | `#e0e8f2` | labels, captions |
| `--accent` | `#0a64e8` | `#66b0ff` | fills, gradients, state |
| `--accent-ink` | `#084a9e` | `#a9d2ff` | small accent text |
| `--accent-2` | `#6f4cff` | `#a795ff` | second gradient stop |
| `--accent-3` | `#0f9f90` | `#4fe0cd` | success, bench marks |

Small accent text uses `--accent-ink`, not the fill accent: `#0a64e8` is 3.1:1 on
the blue light field, `#084a9e` is 5:1. Ink on every glass field is above 10:1.

## Type

- Display and body: **Archivo** variable, 100–900, self-hosted latin subset.
- Data, labels, numerals: **Azeret Mono**, 400/500.
- Display ceiling 4.7rem; body measure 46–62ch; labels not below 9px.

## Space and shape

Page `min(1240px, 100vw - 48px)`, 16px gutters on phones. Sections 72px desktop,
54px tablet, 40px phone. Radii: 30px sheets, 20px rows, 999px controls. Borders
are 1px translucent white; depth comes from shadow plus the inner edge, never a
hard offset.

## Components

- **Masthead**: floating glass pill, sticky, 60px, with a gradient contact pill.
- **Hero**: glass sheet with a three-line display, gradient phrase, readout
  pills, two actions, availability with a mint status dot.
- **Index**: glass panel on the right, five rows, sheet metadata footer.
- **System rail**: translucent strip, four stations, plotted line and pulse.
- **Project plates**: glass sheet, pill case bar, rounded figure with a glass
  figure chip, text column split into overview, rows, stack, and links.
- **Bench**: dark glass panel with mint controls and marks.
- **Assistant**: glass launcher and panel, gradient seal and submit.
- **Closing**: deep blue-violet gradient block with a glass sheen overlay.

## Motion

Opt-in via `.js-motion`:

1. Three light fields drift on 26–36s cycles.
2. The rail plots once, then a pulse travels the stations every 7.5s.
3. Plates and rows rise 16px on entry, staggered up to five siblings.
4. Figures drift up to 14px against scroll.
5. A 3px gradient line plots reading progress.

`prefers-reduced-motion: reduce` removes all of it and leaves content visible.
No JavaScript means no `.js-motion`, so every element is visible and static.

## States

Hover: lift on plates and rows, brighter glass on nav, accent-ink on links.
Focus: 2px blue ring with 3px offset, 3px in forced colors. Disabled: 0.6
opacity and wait cursor on the assistant submit. Empty: bench shows a dashed
panel line.

## Truth constraints

All figures are the existing verified claims: five projects, nine merged PRs,
five essays, the 30-case evaluation, the 1,140-match evaluation. No invented
metrics, customers, or outcomes.
