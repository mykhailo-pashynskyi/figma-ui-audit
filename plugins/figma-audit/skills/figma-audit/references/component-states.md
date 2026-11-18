# Interactive Component States

Which variants each interactive component must have, which state tokens must exist in Variables, and how the audit recognizes them. Used by `COMP-05`, `VAR-15`, `A11Y-09`…`A11Y-14`, and by [a11y-scan.js](../scripts/a11y-scan.js).

## 1. Recognizing components and states

Component type by name (first match wins):

| Type | Name pattern |
|---|---|
| `button` | button, btn, cta, fab |
| `icon-button` | icon button, iconbutton, `Button/Icon` |
| `input` | input, text field, textfield, textarea, search, field, select, dropdown, combobox |
| `switch` | switch, toggle |
| `checkbox` | checkbox, check box |
| `radio` | radio |
| `tab` | tab (not table), segmented, segment |
| `chip` | chip, tag (interactive), filter |
| `link` | link |
| `slider` | slider, stepper |
| `list-row` | row, cell, list item, menu item (only when it has a pressed variant or prototype reaction) |

State values are normalized from the variant property named `state`, `status` or `interaction` (any case):

| Normalized | Accepted values |
|---|---|
| `default` | default, enabled, rest, normal, idle |
| `hover` | hover, hovered |
| `pressed` | pressed, active, down, highlighted, tap |
| `focus` | focus, focused, focus-visible, keyboard-focus |
| `disabled` | disabled, inactive |
| `loading` | loading, busy, progress |
| `error` | error, invalid, danger |
| `filled` | filled, typed, has-value |
| `read-only` | read-only, readonly |

Selection is a separate property: `selected`, `checked`, `on`, `value`, `active` (boolean-like values `true/false`, `on/off`, `yes/no`, `checked/unchecked`, `indeterminate`). Focus and pressed must exist for each selection value (a checked checkbox also needs a focused look).

## 2. Required states

`●` required (missing = P1), `○` required when the platform condition holds (missing = P2), `–` not applicable.

| Type | default | pressed | hover | focus | disabled | loading | error | filled | selected values |
|---|---|---|---|---|---|---|---|---|---|
| button | ● | ● | web ● | see §3 | ● | ○ async actions | – | – | – |
| icon-button | ● | ● | web ● | see §3 | ● | – | – | – | toggled ○ |
| input | ● | – | web ○ | ● (focused field = editing) | ● | ○ async validation | ● | ● | – |
| switch | ● | ● | web ○ | see §3 | ● | – | – | – | on / off ● |
| checkbox | ● | ● | web ○ | see §3 | ● | – | ○ forms | – | checked / unchecked ●, indeterminate ○ |
| radio | ● | ● | web ○ | see §3 | ● | – | ○ forms | – | selected / unselected ● |
| tab | ● | ● | web ○ | see §3 | ○ | – | – | – | selected / unselected ● |
| chip | ● | ● | web ○ | see §3 | ● | – | – | – | selected / unselected ○ |
| link | ● | ● | web ● | see §3 | – | – | – | – | visited ○ (web) |
| slider | ● | ● (dragging) | web ○ | see §3 | ● | – | – | – | – |
| list-row | ● | ● | web ○ | see §3 | ○ | – | – | – | selected ○ |

Input focus is special: on every platform the focused (editing) input is a visible state (cursor, highlighted border), so `focus` is always required for inputs.

## 3. Focus requirement by platform

| Platform | Focus variant for non-input components |
|---|---|
| web | required (P1) |
| android | required (P1) when tablets, ChromeOS, keyboards or TV are in scope; otherwise P2 |
| ios | P2 for iPad / keyboard-centric apps; otherwise P3 (system draws a ring for Full Keyboard Access) |
| cross | stricter of iOS and Android |

When focus variants are missing, the report lists the components and the severity for the platform; adding them is the designer's job.

## 4. State tokens in Variables (`VAR-15`)

Every state that changes color uses a variable, and states share a naming scheme so code can map them:

| Token group | Expected variables (names may vary; matching is by the state word) |
|---|---|
| Action fills | `color/action/primary/default`, `…/hover`, `…/pressed`, `…/disabled` (same for secondary, tertiary, destructive) |
| Action content | `color/action/on-primary/default`, `…/disabled` |
| Borders | `color/border/default`, `color/border/hover`, `color/border/focus`, `color/border/error`, `color/border/disabled` |
| Text | `color/text/disabled`, `color/text/placeholder`, `color/text/error`, `color/text/link`, `color/text/link-visited` (web) |
| Selection | `color/selection/selected`, `color/selection/unselected` (or `color/control/checked`, `…/unchecked`) |
| Focus | `color/focus/ring`, `color/focus/ring-offset`, `stroke/focus`, `space/focus-offset`, effect style `focus/ring` |
| Disabled | `opacity/disabled` when disabled is done with opacity |
| Overlays (M3 state layers) | `opacity/state/hover` = 0.08, `opacity/state/focus` = 0.10, `opacity/state/pressed` = 0.10, `opacity/state/dragged` = 0.16 (Android) |

Checks:
- `VAR-15a` each state word used by component variants (hover, pressed, focus, disabled, error, selected) has at least one variable whose path contains it. Missing → P2.
- `VAR-15b` a non-default variant's changed fill or stroke is bound to a variable whose name contains that state (pressed variant → `…/pressed`). A pressed variant bound to `color/primary/default` with an opacity tweak is P3; a raw hex is `VAR-02`.
- `VAR-15c` state tokens exist in every color mode (Dark too). → `VAR-07`

## 5. Contrast per state

| State | What must pass |
|---|---|
| default, hover, pressed, focus, selected | label vs container 4.5:1 (3:1 large); icon vs container 3:1; container or border vs page 3:1 when the shape identifies the control |
| focus | ring vs page background 3:1 and ring vs container 3:1 (or a ring-offset gap) |
| disabled | exempt; report < 3:1 label contrast as P3 so the label stays legible |
| error | error text 4.5:1; error border 3:1 against the background |
| selected vs unselected | the indicator (fill, mark, underline) differs by 3:1 or by shape/icon |
