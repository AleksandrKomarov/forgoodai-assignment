# Frontend Design Spec: Shared Styles & Utilities

Visual appearance, layout primitives, delta color rules, and the widget state machine
used across every view.

---

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#f5f6fa` | Page background |
| `--surface` | `#fff` | Card / panel background |
| `--border` | `#e2e5ec` | Borders and dividers |
| `--text` | `#1a1d23` | Primary text |
| `--text2` | `#5f6577` | Secondary / muted text |
| `--accent` | `#4361ee` | Interactive elements, charts |
| `--accent-light` | `#eef1ff` | Hover highlights |
| `--green` | `#22c55e` | Positive / success |
| `--red` | `#ef4444` | Negative / error |
| `--orange` | `#f59e0b` | Warning |
| `--sidebar-w` | `220px` | Sidebar width |
| `--header-h` | `56px` | Header height |

Additional hardcoded colors used in specific charts:

| Color | Hex | Usage |
|-------|-----|-------|
| Purple | `#8b5cf6` | Donut chart — Egress segment |
| Gray | `#94a3b8` | Donut chart — Other segment |

---

## Typography

System font stack (system-ui, Segoe UI, Roboto, sans-serif). Base size 14px,
primary text color on a light gray page background.

---

## Layout Primitives

### Date Range Selector

Horizontal row of controls (select + date inputs) with small gaps. Inputs and selects have a
light border, 6px rounded corners, 13px text, and a gray background.

When the "Custom range" preset is selected, two `<input type="date">` fields appear inline
next to the dropdown for start and end date selection. Both inputs allow free selection within
the absolute bounds (earliest: 2 years ago, latest: today). Inline validation errors appear
when the range is invalid:
- "Both dates are required" — if either date is empty
- "End date must be after start date" — if end < start
- "Range cannot exceed 365 days" — if span > 365 days (backend limit)

Invalid ranges are not propagated to the context — widgets continue showing the last valid range
until the user corrects the selection.

Some widgets (latency KPIs, concurrency chart, run heatmap) are limited to 90-day ranges.
When the selected range exceeds this, those widgets show an inline warning while other widgets
continue to display data normally.

### Content Area

Main content is offset to the right of the sidebar and below the header, with 24px padding
on all sides.

### KPI Row (4-column)

Four equal-width columns in a grid with 16px gap.

### 2:1 Grid

Two-thirds / one-third column split with 16px gap.

### 1:1 Grid

Two equal columns with 16px gap.

---

## Component Styles

### Card

White surface with a light border, 10px border-radius, and 20px padding. The card title is
small (13px), bold, uppercase, secondary-colored text with slight letter-spacing.

### KPI Card

Same surface and border treatment as Card with 10px radius. Contains three elements stacked
vertically: a small (12px) uppercase secondary-color label, a large bold (28px) value, and a
small (12px) delta indicator colored green for good changes or red for bad changes.

### Table

Full-width table with 13px text. Header row: left-aligned, uppercase, secondary color, bold
(2px) bottom border. Data cells: light (1px) bottom border, no border on the last row.
Rows highlight with accent-light background on hover.

### Inline Bar

Horizontal container with an 8px-tall rounded bar in accent color. Used for
proportional value display within table rows.

### Tag (delta badge)

Small inline badge — 11px bold text with 4px border-radius. Three color variants:
green (light green background, dark green text) for positive,
red (light red background, dark red text) for negative,
gray (light slate background, slate text) for neutral.

### Gauge (SVG Arc)

120x120px centered SVG arc rotated to start from the top. A centered label overlays
the arc with a large bold (24px) value and a small (11px) secondary-color subtitle.

### Sparkline

Row of thin vertical bars, 40px total height. Bars are accent-colored at 70% opacity
with rounded top corners, bottom-aligned so taller bars grow upward.

### Filter Bar

Horizontal wrapping row of select dropdowns with 10px gaps. Selects have a white
background, light border, and 6px rounded corners. Small (12px) secondary-color labels
sit beside them.

### Progress Bar

10px-tall rounded track with a border-colored background. The fill bar inside animates
its width on change.

### Large Value Card

Used by Forecast and Burn Rate cards. Features a prominent 32px bold value, a 13px
secondary-color subtitle, and optional 12px secondary-color context text.

### Donut Container

Centered flex row with generous (32px) spacing between the donut chart and its legend,
padded inside the card.

### Chart Legend

Centered horizontal row of small (11px) secondary-color legend items with 16px spacing.
Each item has a 12x12px colored square indicator beside its label.

### Avatar

32x32px circle with accent background. White centered bold (13px) text showing user
initials.

### Sidebar Footer

Padded area at the bottom of the sidebar, separated by a dark top border. Small (12px)
muted text for version or status info.

---

## Chart Color Palette

Series colors assigned by index for stacked/grouped charts:

| Index | Color | CSS variable |
|-------|-------|-------------|
| 0 | `#4361ee` | `var(--accent)` |
| 1 | `#22c55e` | `var(--green)` |
| 2 | `#f59e0b` | `var(--orange)` |
| 3 | `#8b5cf6` | — (purple) |
| 4 | `#94a3b8` | — (gray) |

Cost driver color mapping (donut chart):

| Driver | Color |
|--------|-------|
| `tokens` | `#4361ee` (accent) |
| `compute` | `#22c55e` (green) |
| `storage` | `#f59e0b` (orange) |
| `egress` | `#8b5cf6` (purple) |
| `other` | `#94a3b8` (gray) |

---

## Delta Color Rules

| Metric type | Positive delta | Negative delta |
|-------------|---------------|----------------|
| Cost / spend | red (up = bad) | green (down = good) |
| Success rate | green (up = good) | red (down = bad) |
| Run count | green (up = good) | red (down = bad) |
| Latency | red (up = bad) | green (down = good) |
| Over budget | red (bad) | green (good) |

CSS classes: `.kpi-delta.up` = green (good), `.kpi-delta.down` = red (bad).

**Important:** "up"/"down" refer to good/bad, NOT numeric direction. A cost increase is
numerically positive but semantically bad, so it gets `.kpi-delta.down` (red).

For formatting utilities and `getDeltaClass` implementation, see
[frontend-spec.md — Formatting Utilities](frontend-spec.md#formatting-utilities).

---

## Widget State Machine

Every widget maps TanStack Query flags to the same visual states:

| State | TanStack Query condition | Display |
|-------|--------------------------|---------|
| **Loading** | `isLoading` (no cached data) | Skeleton placeholder matching widget dimensions |
| **Refreshing** | `isRefetching` (has cached data) | Show stale data, no spinner |
| **Success** | `data` present | Rendered chart, table, or KPI card |
| **Error** | `isError` | Inline error message with retry button |
| **Empty** | `data` present but zero/empty | "No data for selected period" |

### Loading

Skeleton placeholder matching the widget's dimensions:
- KPI cards: gray pulsing rectangles for value and delta lines
- Charts: gray pulsing rectangle matching chart height
- Tables: gray pulsing rows

### Error

Centered column showing a "Failed to load data" message and a bordered retry button.
The retry button calls the query's `refetch()`. Other widgets continue independently.

### Refreshing

Background re-fetch while stale data exists. Show stale data as-is — no spinner. The UI
updates seamlessly when fresh data arrives.
