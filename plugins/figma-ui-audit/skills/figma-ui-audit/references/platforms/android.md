# Platform profile: Android (Material 3)

Load with [../devices/android.md](../devices/android.md). Values marked **[Android]** come from developer.android.com; **[M3]** from the Material 3 tokens as shipped in Jetpack Compose (`androidx.compose.material3.tokens`); **[practice]** are common defaults treated as guidance.

## Units and grid

- Design in dp; type in sp (1 sp = 1 dp at the default font scale).
- 4 dp baseline grid; spacing tokens on multiples of 4 (8 for larger gaps). **[practice, M3]**
- Horizontal margins: 16 dp at compact width, 24 dp at medium and expanded. **[practice, M3 layout]** Set a max content width so inputs and buttons do not stretch on wide windows. **[Android]**

## Window size classes **[Android]**

Width classes (measured on the app window, not the device):

| Class | Width |
|---|---|
| Compact | < 600 dp |
| Medium | 600 ≤ w < 840 dp |
| Expanded | 840 ≤ w < 1200 dp |
| Large | 1200 ≤ w < 1600 dp (opt-in) |
| Extra-large | ≥ 1600 dp (opt-in) |

Height classes: compact < 480 dp, medium 480–900 dp, expanded ≥ 900 dp.

Layout rules **[Android]**: compact uses one pane; medium one or two panes; large and extra-large can use multiple panes. Do not lock the app to portrait; that letterboxes it when resized. → `PLAT-02`, `PLAT-06`

## System bars and edge-to-edge **[Android]**

- Edge-to-edge is enforced from Android 15: the status bar is transparent and the app draws behind it. Every screen frame shows the status bar and the navigation area, with content inset correctly. → `PLAT-03`
- Gesture navigation: no interactive elements or touch targets under the gesture-navigation inset; keep the gesture bar transparent.
- 3-button navigation: the system adds a translucent scrim; a transparent 3-button bar only when a bottom app bar or bottom navigation sits under it.
- Show display cutouts on the device frame and keep content clear of them.

## Touch targets

- Minimum 48 × 48 dp for every interactive element (the visual may be smaller, the touch area is padded). **[Android accessibility guidance]** → `A11Y-01`
- At least 8 dp between targets. **[practice]** → `A11Y-08`

## Typography (M3 type scale) **[M3]**

| Role | Size (sp) | Line height | Weight |
|---|---|---|---|
| Display Large | 57 | 64 | Regular 400 |
| Display Medium | 45 | 52 | Regular |
| Display Small | 36 | 44 | Regular |
| Headline Large | 32 | 40 | Regular |
| Headline Medium | 28 | 36 | Regular |
| Headline Small | 24 | 32 | Regular |
| Title Large | 22 | 28 | Regular |
| Title Medium | 16 | 24 | Medium 500 |
| Title Small | 14 | 20 | Medium |
| Body Large | 16 | 24 | Regular |
| Body Medium | 14 | 20 | Regular |
| Body Small | 12 | 16 | Regular |
| Label Large | 14 | 20 | Medium |
| Label Medium | 12 | 16 | Medium |
| Label Small | 11 | 16 | Medium |

M3 also defines an emphasized set of the same 15 roles. Audit rules:
- `TYPE-08`: Text Styles map to these roles; recommended names `Display/Large`, `Body/Medium`, `Label/Small`, which map one-to-one to `MaterialTheme.typography.bodyMedium`.
- `TYPE-06`: body copy ≥ 12 sp; 11 sp only for Label Small.
- Text must reflow at 200% font scale; show one key screen at large font scale or annotate the reflow. → `A11Y-05`

## Shape (corner radius) scale **[M3]**

| Token | dp |
|---|---|
| None | 0 |
| Extra Small | 4 |
| Small | 8 |
| Medium | 12 |
| Large | 16 |
| Large Increased | 20 |
| Extra Large | 28 |
| Extra Large Increased | 32 |
| Extra Extra Large | 48 |
| Full | pill / circle |

The `radius` collection should use these values (names may be the project's own). Off-scale radii are `VAR-05` with a P2 note.

## Color

- Use M3 color roles (primary, onPrimary, primaryContainer, onPrimaryContainer, secondary…, tertiary…, error…, surface, onSurface, surfaceVariant / surfaceContainer levels, outline, outlineVariant). The semantic tier of the `color` collection should map to these roles. → `VAR-06`, `TYPE-08`-like mapping for color
- Light and Dark schemes as modes; dynamic color (Material You) is a code decision, but the design must work with the baseline scheme.
- Contrast: 4.5:1 for text, 3:1 for large text and meaningful non-text elements. → `A11Y-02`, `A11Y-03`

## Components and states **[M3 / practice]**

- States: `enabled`, `hovered`, `focused`, `pressed`, `dragged`, `disabled`, plus `selected`/`activated` and `error` where relevant. Interaction states are state layers over the container: hover 8%, focus 10%, pressed 10%, dragged 16% of the content color; disabled content 38% opacity, disabled container 12%. → `COMP-05`
- For Android the audit requires `default`, `pressed`, `disabled`; `focused` is required when the app supports keyboard / D-pad (tablets, ChromeOS, TV).
- Navigation: navigation bar (3–5 destinations) at compact width; navigation rail at medium; navigation drawer or rail at expanded. → `PLAT-04`
- Back: support predictive back; never place critical actions only behind a custom back gesture.
- Icons: Material Symbols, 24 dp default, optical size matched.

## Sources

- Window size classes: https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes
- Adapt layouts: https://developer.android.com/design/ui/mobile/guides/layout-and-content/adapt-layout
- System bars and edge-to-edge: https://developer.android.com/design/ui/mobile/guides/foundations/system-bars
- M3 type and shape tokens (Compose source): https://github.com/androidx/androidx/tree/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens
- Material 3: https://m3.material.io
