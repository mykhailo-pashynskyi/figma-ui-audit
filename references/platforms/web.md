# Platform profile: Web

Load with [../devices/web.md](../devices/web.md). **[WCAG]** marks WCAG 2.2 success criteria; **[practice]** marks common defaults.

## Units and grid

- Design in CSS px at 1x; type maps to `rem` (16 px = 1 rem). **[practice]**
- 4 px spacing base, 8 px rhythm. **[practice]**
- A max content width per breakpoint (for example 1200–1280 px for app layouts, 680–760 px for reading text). **[practice]**

## Breakpoints

Design at least one frame per breakpoint the product supports; the house minimum is mobile, tablet and desktop. Common breakpoint sets:

| Name | Tailwind default | Typical frame |
|---|---|---|
| mobile | < 640 | 375 or 390 wide |
| sm | ≥ 640 | — |
| md | ≥ 768 | 768 wide |
| lg | ≥ 1024 | 1024 wide |
| xl | ≥ 1280 | 1280 wide |
| 2xl | ≥ 1536 | 1440–1536 wide |

Frames are named `ScreenName / State / Breakpoint` (`Pricing / Default / Desktop`). → `NAME-02`, `PLAT-02`

## Accessibility (WCAG 2.2 AA)

| Check | Value | Criterion |
|---|---|---|
| Text contrast | 4.5:1; 3:1 for large text (≥ 24 px regular or ≥ 18.66 px bold) | 1.4.3 **[WCAG]** |
| Non-text contrast | 3:1 for UI component boundaries, focus indicators, meaningful icons | 1.4.11 **[WCAG]** |
| Target size | ≥ 24 × 24 CSS px (AA), 44 × 44 recommended (AAA 2.5.5) | 2.5.8 **[WCAG]** |
| Focus visible | every interactive element has a visible focus state | 2.4.7 **[WCAG]** |
| Focus not obscured | sticky headers and footers never hide the focused element | 2.4.11 **[WCAG]** |
| Reflow | content works at 320 CSS px width without horizontal scrolling | 1.4.10 **[WCAG]** |
| Resize text | readable at 200% zoom | 1.4.4 **[WCAG]** |
| Use of color | state not by color alone | 1.4.1 **[WCAG]** |

Audit mapping: `A11Y-01` uses 24 px as the failure threshold and 44 px as a P3 recommendation; `A11Y-02` uses the large-text threshold above (web differs from iOS points); `A11Y-09` requires a `focus` variant.

## Components and states

- Interactive components carry `default`, `hover`, `focus`, `active` (pressed), `disabled`; inputs add `error`, `filled`, `read-only`; async actions add `loading`. → `COMP-05`
- Links look like links (underline or another non-color cue). → `A11Y-04`
- Forms show labels above or beside fields (placeholder is not a label), helper text, error text with the cause and fix.

## Layout

- Every breakpoint frame uses auto layout so that stretch between breakpoints is visible. → `LAY-01`, `LAY-09`
- Use layout grids per breakpoint (for example 4 / 8 / 12 columns) and bind gutters and margins to `space` variables. → `VAR-04`
- Sticky header, footer and sidebars annotated: what sticks, at which breakpoint. → `HAND-04`

## Motion

- Hover and focus transitions ≤ `motion/fast`; page-level transitions use `motion/normal`.
- `prefers-reduced-motion`: replace parallax, auto-playing carousels and large movement with fades. → `A11Y-07`

## Platform-specific states to check

| State | Why on web |
|---|---|
| Hover / Focus on every interactive component | pointer and keyboard users |
| 320 px reflow | WCAG 1.4.10 |
| Long content and very wide screens | max-width and line length |
| Cookie / consent banner over content | covers CTAs and focus |
| No-JS or slow-network skeleton | perceived performance |

## Sources

- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Tailwind CSS breakpoints: https://tailwindcss.com/docs/responsive-design
