# Stack: React (CSS custom properties, CSS Modules or CSS-in-JS)

## Tokens

- `codeSyntax.WEB`, rule `css-var`: `color/bg/surface` → `var(--color-bg-surface)`, `space/16` → `var(--space-16)`, `radius/md` → `var(--radius-md)`, `motion/normal` → `var(--motion-normal)` (250ms).
- Color modes → `:root` (Light) and `[data-theme="dark"]` or `@media (prefers-color-scheme: dark)` (Dark).
- Text Styles → CSS classes or a typography component (`<Text variant="body">`); sizes in rem.
- Effect styles → `--shadow-sm`, `--shadow-md`.

## Structure mapping

| Figma | CSS |
|---|---|
| Auto layout vertical, gap g | `display:flex; flex-direction:column; gap:g` |
| Auto layout horizontal | `display:flex; flex-direction:row; gap:` |
| Wrap | `flex-wrap: wrap; row-gap:` (`counterAxisSpacing`) |
| Grid layout | `display:grid` |
| Padding | `padding` |
| Fill container | `flex:1` on the main axis, `align-self:stretch` / `width:100%` on the cross axis |
| Hug | `width: fit-content` / default |
| Min/Max width | `min-width` / `max-width` |
| Space between | `justify-content: space-between` |
| Absolute child | `position:absolute` inside `position:relative` |
| Clip content | `overflow:hidden` |
| Component + variants | component with props; variant properties → string union props (`size: 'sm' \| 'md' \| 'lg'`) |
| Boolean / Text / Instance swap | `boolean` prop / `string` prop / `ReactNode` slot |

## Traps (`CODE-04`)

- Missing hover, focus and active variants mean the developer invents them (`A11Y-09`, `COMP-05`).
- Fixed pixel widths on containers break responsive layouts; use Fill plus max-width.
- Line height in percent vs px: Figma percent line height maps to unitless `line-height`; Auto line height has no exact CSS equivalent.
- Absolute children inside scroll containers scroll with content unless `position: sticky/fixed` is intended; annotate.
