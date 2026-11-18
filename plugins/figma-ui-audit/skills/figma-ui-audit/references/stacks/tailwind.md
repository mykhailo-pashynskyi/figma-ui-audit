# Stack: Tailwind CSS (v4)

## Tokens

- Tailwind v4 defines the theme in CSS with `@theme`. Each token namespace produces utilities:

| Figma variable | `@theme` variable | Utility |
|---|---|---|
| `color/surface/default` | `--color-surface: …` | `bg-surface`, `text-surface`, `border-surface` |
| `space/*` (4 px base) | `--spacing: 0.25rem` | `p-4` = 16 px, `gap-3` = 12 px |
| `radius/md` | `--radius-md: …` | `rounded-md` |
| Text style `Body` | `--text-body: 1rem; --text-body--line-height: 1.5rem` | `text-body` |
| `shadow/md` | `--shadow-md: …` | `shadow-md` |
| `motion/normal` | `--duration-normal: 250ms` (custom) | `duration-normal` via `@utility` or arbitrary `duration-250` |
| breakpoints | `--breakpoint-md: 48rem` | `md:` |

- `codeSyntax.WEB`: store the utility-friendly CSS variable, rule `css-var`, with the namespace Tailwind expects: `--color-*`, `--radius-*`, `--text-*`, `--shadow-*`.
- Naming advice for `CODE-01`: avoid a redundant `bg` segment inside color names (`color/bg/surface` becomes `bg-bg-surface`). Prefer role names (`color/surface/default` → `bg-surface`). Report as P3 with the rename suggestion; do not rename without approval.
- Spacing on the 4 px scale maps to integer utilities (`space/12` → `3`). Off-scale values become arbitrary values like `p-[13px]`; each one is a `VAR-13` finding.
- Dark mode: `dark:` variant with the `color` collection's Dark mode values in a `.dark` or `[data-theme=dark]` scope.

## Structure mapping

Same as [react.md](react.md), as utilities: `flex flex-col gap-4 p-4`, Fill → `flex-1` / `w-full` / `self-stretch`, Hug → `w-fit`, Space between → `justify-between`, Absolute → `absolute` inside `relative`, Wrap → `flex-wrap gap-x-* gap-y-*`.

## Traps (`CODE-04`)

- Arbitrary values (`text-[15px]`, `rounded-[10px]`) are the code symptom of off-scale design values.
- Gap vs margins: use `gap-*` from auto layout; `space-x-*` breaks with wrapped or conditional children.
- Responsive frames must line up with the breakpoints in `@theme`; a 1100 px frame with no matching breakpoint is ambiguous (`PLAT-02`).
