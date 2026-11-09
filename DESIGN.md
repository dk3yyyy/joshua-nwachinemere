# DESIGN.md — portfolio visual system

Status: current for the 2026 yellow editorial rebuild. Source of truth for tokens
is `src/styles.css`; this file records the decisions behind them.

## World

An off-white ground with near-black type and one yellow signal. The page is
centred, editorial and deliberately held to a single light surface. There is no
glass, no dark theme toggle and no generated texture. The work leads; the
typography frames it.

## Colour

| Token | Value | Use |
|---|---|---|
| `--bg` | `#fafafa` | page ground |
| `--surface` | `#ffffff` | cards, panels, assistant |
| `--ink` | `#111110` | primary text, borders on dark controls |
| `--muted` | `#64645d` | secondary copy, metadata |
| `--border` | `#e7e4dd` | default rules |
| `--border-strong` | `#d8d4cb` | card edges, controls |
| `--accent` | `#f2c200` | highlight, filled primary action, logo tile |
| `--accent-deep` | `#d5a900` | accent borders, progress fill |
| `--field` | `#f4f2ec` | dotted preview fields, quiet panels |

Yellow is a highlighter, not a surface. It appears on the word `checked.`, the
primary action, the logo tile and small evidence marks. Everything else is ink,
paper or a hairline rule.

## Type

- Display: **Cal Sans**, 400, self-hosted.
- Body and labels: **Archivo** variable, 100–900, self-hosted.
- Data and file paths: `ui-monospace` with Archivo fallback.
- Display ceiling `70px`; body measure roughly `60ch`; labels do not go below
  `10px`.

## Space and shape

Page `min(1280px, 100vw - 64px)`, 16px gutters on phones. Section rhythm 88px
desktop, 66px tablet, 55px phone. Cards use 18px outer radii and 10–12px inner
radii. Borders are `1px` solid; depth is a low shadow, never a glossy layer.

## Components

- **Masthead**: sticky 64px bar, yellow JN tile, quiet nav, black contact pill.
- **Hero**: centred status line, two-line display, yellow highlight, three
  project links, one primary and one secondary action, compact proof line.
- **Project cards**: dotted preview field, yellow category tag, numbered title,
  short description, footer with stack and plain-text links.
- **Additional work**: two ruled rows under the three featured cards.
- **Evidence**: three cards with small, inspectable mock panels and a results
  link for the evaluation.
- **Open-source ledger**: two-pane sheet with a large `13`, a two-column list
  and a profile link.
- **Writing and background**: essay list on the left, compact background card on
  the right.
- **Closing**: centred invitation to email, CV, LinkedIn and GitHub.
- **Assistant**: white popup with yellow seal tile, restrained message bubbles
  and an explicit busy state.

## Motion

Content is static by default. The only transitions are short hover lifts on
cards and links, and the assistant's open/close state. `prefers-reduced-motion`
removes those transitions. There are no ambient or scroll-driven loops.

## States

Hover: 1–3px lift, border darkens, link underlines. Focus: 2px ink ring with 3px
offset. Disabled: reduced opacity and wait cursor on the assistant submit.
Assistant busy: visible `Checking…` label plus `aria-busy="true"`. Images load
lazily with intrinsic dimensions reserved.

## Truth constraints

All figures are the existing verified claims: five projects, thirteen merged
upstream PRs, five essays, the 30-case retrieval evaluation and the 1,140-match
forecasting evaluation. No invented metrics, customers or outcomes.
