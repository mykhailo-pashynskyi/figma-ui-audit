# Platform profile: iOS (iPhone)

Load with a device file from [../devices/](../devices/). Values marked **[Apple]** come from Apple's Human Interface Guidelines or Apple developer videos; **[kit]** from Apple's iOS design resources as reported by third parties; **[practice]** are common industry defaults the audit treats as guidance (P2/P3), not as house rules.

## Units and grid

- Design in points (pt) at 1x. Frame sizes in the device file are in points.
- Spacing on a 4 pt base; 8 pt rhythm for larger gaps. **[practice]**
- Horizontal layout margins: 16 pt on compact-width iPhones, 20 pt on the largest ones. Content aligns to the layout margins, not the screen edge. **[practice]** On iPhone Duo use layout margins and horizontal safe-area insets, never fixed widths. **[Apple]**

## Safe areas and system chrome

- Every screen frame shows the status bar, the Dynamic Island (or notch on 17e/16e/SE-class), and the home indicator. Use the components from the Apple iOS design kit, not hand-drawn shapes. → `PLAT-03`
- Content and interactive elements stay inside the safe area. Backgrounds, images and scroll content may extend under the bars (edge-to-edge). → `PLAT-03`
- Insets per device are in the device file. Bottom inset on Face ID iPhones is 34 pt.
- iOS 26 and later use Liquid Glass for system bars and controls: tab bars and toolbars float above content as translucent material, and content scrolls underneath. Do not paint opaque custom backgrounds behind standard bars; show content passing under them in the Scrolled state. **[Apple, iOS 26]**
- Keyboard open: use the system keyboard component from the kit at the correct height for the device; show the focused field above the keyboard and how the bottom action moves (above the keyboard, or hidden). → `STATE-03`

## Touch targets

| Platform | Default | Minimum |
|---|---|---|
| iOS, iPadOS | 44 × 44 pt | 28 × 28 pt |

**[Apple]** Use 44 × 44 as the audit threshold (`A11Y-01`); a control between 28 and 44 is P2 only when the visual is small but the hit area is padded and the annotation says so.

Spacing between controls: about 12 pt of padding around bezeled controls, about 24 pt around unbezeled controls' visible edges. **[Apple]** → `A11Y-08`

## Typography (Dynamic Type)

Default body size 17 pt, minimum 11 pt. **[Apple]** → `TYPE-06`

Text styles at the default **Large** size, SF Pro **[Apple]**:

| Style | Weight | Size | Leading | Emphasized |
|---|---|---|---|---|
| Large Title | Regular | 34 | 41 | Bold |
| Title 1 | Regular | 28 | 34 | Bold |
| Title 2 | Regular | 22 | 28 | Bold |
| Title 3 | Regular | 20 | 25 | Semibold |
| Headline | Semibold | 17 | 22 | Semibold |
| Body | Regular | 17 | 22 | Semibold |
| Callout | Regular | 16 | 21 | Semibold |
| Subhead | Regular | 15 | 20 | Semibold |
| Footnote | Regular | 13 | 18 | Semibold |
| Caption 1 | Regular | 12 | 16 | Semibold |
| Caption 2 | Regular | 11 | 13 | Semibold |

Largest accessibility size AX5 is far larger; at AX1 Body is 28/34 and Large Title 44/52. **[Apple]**

Audit rules:
- `TYPE-08`: the project's Text Styles should map to these roles (custom families are fine). Recommend naming styles after them (`Title 1`, `Body`, `Caption 1`) so the code mapping to `Font.TextStyle` is direct.
- Custom fonts must scale with Dynamic Type (`relativeTo:` a text style in code); the spec says which system style each custom style follows.
- Avoid Ultralight, Thin and Light weights for UI text. **[Apple]** P3.
- Do not embed SF Pro in the app; reference it as the system font. Using SF Pro in Figma is fine. **[Apple]**
- Support enlarging text to at least 200%. **[Apple]** Provide one key screen at AX sizes or a note on how it reflows (stacked layout, fewer columns, no truncation in scroll areas). → `A11Y-05`
- Tracking: the system adjusts tracking per size (for example 17 pt = −0.43 pt, 11 pt = +0.06 pt). Text Styles using SF Pro should carry those values. **[Apple]**

## Color and contrast

- Contrast minimums used by Accessibility Inspector (WCAG AA) **[Apple]**: text up to 17 pt needs 4.5:1; text 18 pt and larger, and bold text, needs 3:1. Check both Light and Dark. → `A11Y-02`
- When the default palette cannot meet contrast, provide an Increase Contrast variant (a third color mode or documented values). **[Apple]** P3.
- Prefer system semantic colors where the brand allows (label, secondaryLabel, systemBackground, separator); custom colors need Light and Dark values. → `VAR-07`
- Never convey state by color alone. → `A11Y-04`

## Navigation and components **[Apple / practice]**

- Top-level sections in a tab bar (2–5 items). No hamburger menu as primary navigation on iPhone. → `PLAT-04`
- Hierarchical content uses a navigation bar with a back button; the edge back-swipe is never overridden.
- Large titles on top-level screens; inline titles on detail screens.
- Sheets for scoped tasks, alerts only for critical information, action sheets / menus for choices.
- Components carry iOS states: `default`, `pressed` (highlighted), `disabled`, plus `selected` for toggles and segments, `loading` for async actions, `error` for inputs. No hover state except for iPad pointer. → `COMP-05`
- Icons: SF Symbols where possible, matched to the adjacent text weight; custom icons on a 16/20/24 pt grid with a consistent stroke (house default 1.5). → `VAR-12`
- Corner radii of nested elements are concentric (inner radius = outer radius − padding) so shapes sit naturally inside rounded containers and device corners. **[practice, aligned with iOS 26 design]** P3.

## Motion

- State change and navigation transitions use `motion` durations; default spring-like ease-out feel. **[practice]**
- Reduce Motion: replace zoom, slide-in-depth, parallax and auto-playing animation with cross-fades; avoid animating along the z-axis. **[Apple]** → `A11Y-07`

## Platform-specific states to check

| State | Why on iOS |
|---|---|
| Keyboard open | keyboard covers the bottom ~40% of the screen |
| Scrolled | Liquid Glass bars and large-title collapse change while scrolling |
| Large Text (AX) | Dynamic Type at accessibility sizes |
| Dark | system-wide appearance |
| Permission prompt / denied | camera, location, notifications, photos flows |

## Sources

- Apple HIG Typography (Dynamic Type sizes, tracking, minimum sizes): https://developer.apple.com/design/human-interface-guidelines/typography
- Apple HIG Accessibility (44×44 pt / 28×28 pt targets, contrast, spacing, Reduce Motion): https://developer.apple.com/design/human-interface-guidelines/accessibility
- Apple HIG Layout: https://developer.apple.com/design/human-interface-guidelines/layout
