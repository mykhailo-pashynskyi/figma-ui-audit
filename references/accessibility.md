# Accessibility Guide

The accessibility part of the audit. It combines WCAG 2.2 (the legal and industry baseline on every platform), Apple HIG accessibility, and Android accessibility guidance. The audit always runs these checks; mode `a11y` runs only these plus the state coverage from [component-states.md](component-states.md).

Target level: **WCAG 2.2 AA**. AAA criteria are reported as P3 recommendations. Platform rules can be stricter than WCAG (iOS 44 pt targets, Android 48 dp); the stricter value is the failure threshold for that platform.

## 1. What a Figma file can and cannot prove

| Can verify in the file | Needs the designer or code (Not verified) |
|---|---|
| contrast of text, icons, borders, focus rings, per color mode | screen-reader reading order in the built app |
| presence of focus, disabled, error, selected variants | real keyboard behavior |
| target sizes and spacing | Dynamic Type / font-scale behavior beyond the frames delivered |
| state not shown by color alone (icon, text, shape change present) | motion sensitivity of the real animation |
| labels present in annotations or component descriptions | localization length in all languages |

## 2. Contrast (WCAG 1.4.3, 1.4.6, 1.4.11)

| Element | Minimum (AA) | AAA | Check ID |
|---|---|---|---|
| Body text, labels, button labels | 4.5:1 | 7:1 | `A11Y-02` |
| Large text (web: ≥ 24 px regular or ≥ 18.66 px bold; iOS: ≥ 18 pt or bold; Android: ≥ 18 sp or ≥ 14 sp bold) | 3:1 | 4.5:1 | `A11Y-02` |
| Placeholder text that carries information, helper text, error text | 4.5:1 | — | `A11Y-02` |
| Input borders and other boundaries needed to identify a control | 3:1 against the adjacent background | — | `A11Y-11` |
| Icons that carry meaning (icon-only buttons, status icons) | 3:1 against their background | — | `A11Y-03` |
| State indicators: switch track on vs off, checkbox mark, selected tab indicator, radio dot | 3:1 against adjacent colors | — | `A11Y-12` |
| Focus indicator | 3:1 against the colors next to it | ≥ 2 px perimeter and 3:1 change (2.4.13) | `A11Y-13` |
| Button container against the page | not required when the label identifies the button; 3:1 recommended for filled buttons and required when the shape is the only cue (icon-only) | — | `A11Y-14` (P3 / P2) |
| Disabled controls | exempt (WCAG) — still keep the label readable enough to know what is disabled; report < 3:1 as P3 | — | `A11Y-02` note |
| Logos, decorative images | exempt | — | — |

Rules for computing contrast:
- Resolve every color through its variable **in each mode** of the color collection (Light, Dark, High Contrast). A pair that passes in Light and fails in Dark is a failure.
- Composite transparency before measuring: a text fill at 60% opacity over a surface is measured as the blended color. Layer opacity counts too (disabled variants often use 40% opacity).
- Measure against the nearest solid background behind the element. Over images or gradients, measure against the worst area visible in the frame or require a scrim; report "over image" findings as visual checks.
- iOS: when the default palette cannot pass, an Increase Contrast mode is acceptable (Apple). Android and web: the default must pass.

## 3. Focus (WCAG 2.4.7, 2.4.11, 2.4.13)

Focus is the state a control has when reached by keyboard, switch control, D-pad, or other non-touch input.

| Platform | Is a designed focus state required? | Severity when missing |
|---|---|---|
| Web | yes, on every interactive component (2.4.7 AA) | P1 |
| Android | yes when the app supports keyboard, D-pad, ChromeOS, tablets with keyboards, or TV; M3 defines a focused state for every interactive component | P1 if tablets/ChromeOS/TV are in scope, else P2 |
| iOS / iPadOS | the system draws a focus ring for Full Keyboard Access; custom controls and iPad keyboard support benefit from a designed focus state | P2 for iPad or keyboard-heavy apps, else P3 |
| Cross-platform | the stricter of the targets | per platform |

What a good focus indicator looks like (house rule, aligned with 2.4.13):
- A ring around the whole control, at least **2 px** thick, offset **2 px** from the control so it reads on any fill.
- Ring color has **≥ 3:1** against the background behind it and against the control's own fill (when the offset gap is not there).
- The focused state never changes layout size (no reflow when focus moves).
- Sticky headers, footers and sheets never cover the focused element (2.4.11).
- The ring uses tokens: `color/focus/ring`, `color/focus/ring-offset`, `stroke/focus`, `space/focus-offset`, and the effect style `focus/ring`. They are reported as missing by `VAR-15c`; creating them is left to the designer.

## 4. Target size and spacing (WCAG 2.5.8, 2.5.5; Apple; Android)

| Platform | Minimum target | Recommended | Spacing |
|---|---|---|---|
| iOS | 44 × 44 pt (Apple default; 28 × 28 absolute minimum) | 44 × 44 | ~12 pt around bezeled, ~24 pt around unbezeled controls |
| Android | 48 × 48 dp | 48 × 48 | ≥ 8 dp between targets |
| Web | 24 × 24 px (AA) | 44 × 44 (AAA) | 24 px spacing circle rule for undersized targets |

The visible shape may be smaller when the hit area is padded; the component must then show the hit area (a transparent frame of the full size) or say so in its description. → `A11Y-01`, `A11Y-08`

## 5. Meaning not by color alone (WCAG 1.4.1)

- Error inputs: red border **plus** an icon or error text. → `A11Y-04`
- Selected tabs and chips: color **plus** an indicator, weight change, or checkmark.
- Links inside text: underline or another non-color cue.
- Charts: patterns, labels or direct values in addition to color.
- Toggles: position of the thumb plus color; avoid color-only on/off.

## 6. Text and scaling (WCAG 1.4.4, 1.4.10, 1.4.12; Apple Dynamic Type; Android font scale)

- iOS: Text Styles follow Dynamic Type; support enlarging to at least 200%; show one key screen at an accessibility size (AX) or annotate how it reflows. → `A11Y-05`
- Android: layouts survive 200% font scale; no fixed-height text containers. → `A11Y-05`, `LAY-08`
- Web: no loss at 200% zoom; reflow at 320 CSS px; tolerate letter-spacing 0.12em, word spacing 0.16em, line height 1.5. → `A11Y-05`
- Minimum sizes per platform: see `TYPE-06`.

## 7. Names, roles, labels (WCAG 1.3.1, 2.4.6, 3.3.2, 4.1.2; VoiceOver; TalkBack)

- Every input has a visible label (placeholder is not a label). → `A11Y-15`
- Icon-only buttons have an accessible name in an annotation or the component description ("Close", "Add to favorites"). → `A11Y-06`
- Components declare their role in the description when not obvious (button vs link, switch vs checkbox).
- Headings on screens use heading Text Styles so developers can mark them as headers.
- Grouped content (a card that is one tap target) is annotated as one element.
- Focus / reading order annotated on complex screens (forms, dashboards, iPhone Duo two-pane layouts). → `A11Y-16`

## 8. Errors and forms (WCAG 3.3.1, 3.3.3)

- Error state says what went wrong and how to fix it, next to the field. → `STATE-09`
- Required fields marked in text, not only with color or an asterisk without a legend.

## 9. Motion and transparency

- Reduce Motion alternatives for large movement, parallax, auto-play (WCAG 2.3.3 AAA, Apple, Android "Remove animations"). → `A11Y-07`
- iOS Liquid Glass and blurred materials: text on glass must still pass contrast over the busiest plausible content; Reduce Transparency makes materials opaque — check that the opaque fallback still has the intended hierarchy. → `A11Y-17` (P2, visual)
- Nothing flashes more than 3 times per second (WCAG 2.3.1). → visual

## 10. Platform settings to respect

| Setting | iOS | Android | Web |
|---|---|---|---|
| Larger text | Dynamic Type, AX1–AX5 | Font size / display size | browser zoom |
| Bold text | Bold Text | Bold text | — |
| Higher contrast | Increase Contrast | High contrast text | `prefers-contrast` |
| Less motion | Reduce Motion | Remove animations | `prefers-reduced-motion` |
| Less transparency | Reduce Transparency | — | `prefers-reduced-transparency` |
| Screen reader | VoiceOver | TalkBack | NVDA, JAWS, VoiceOver |
| Non-touch input | Full Keyboard Access, Switch Control | keyboard, D-pad, Switch Access | keyboard |

## Sources

- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Apple HIG Accessibility: https://developer.apple.com/design/human-interface-guidelines/accessibility
- Android accessibility: https://developer.android.com/guide/topics/ui/accessibility
- Material 3 states (focus, pressed, hover, disabled): https://m3.material.io/foundations/interaction/states
