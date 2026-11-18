# Devices: Android

Android has no single device size. Design by window size class (see [../platforms/android.md](../platforms/android.md)) and check on representative frames.

| Device id | Window | Typical Figma frame (dp) | Notes |
|---|---|---|---|
| `android-compact` | compact width | 360 × 800 and 412 × 915 | the two most common phone viewports; verify against the target device list |
| `android-medium` | medium width | 600–840 wide, e.g. 700 × 840 | small tablets, foldables unfolded in portrait, large phones in landscape |
| `android-expanded` | expanded width | 840–1200 wide, e.g. 1280 × 800 | tablets landscape, foldables unfolded in landscape |
| `android-foldable` | compact outer + medium/expanded inner | outer phone-width (360–412); inner medium width in portrait and expanded in landscape; take exact sizes from the target device | book posture and tabletop posture |

Phone frame sizes are common practice values, not an official list; the Material 3 Design Kit frames are the reference when the project uses them.

## Device-specific checks (`PLAT-06`)

- **Compact:** one pane; navigation bar at the bottom; FAB above the navigation bar and the gesture inset.
- **Medium:** list-detail may show two panes; navigation rail replaces the bottom bar.
- **Expanded:** two or more panes; max content width on single-pane screens; inputs and buttons not stretched.
- **Foldables:**
  - Book posture (vertical hinge): do not place controls or important content across the hinge; use the two halves as list and detail.
  - Tabletop posture (horizontal hinge, half open): content on the top half, controls on the bottom half.
  - Continuity: folding or unfolding keeps the user's place and state.
- **Edge-to-edge:** status bar and navigation area drawn on every frame; content inset by the system bar insets; nothing interactive under the gesture inset.
- **Display cutouts:** punch-hole camera shown on the frame; no content under it.

## Frames to deliver

| Frame | Required |
|---|---|
| Compact phone (360 × 800 or the project's base) | every screen |
| Second phone size (412 × 915) | 2–3 content-heavy screens |
| Medium or expanded | every screen when tablets or foldables are in scope; otherwise 2–3 key screens |
| Foldable posture frames | screens with media, maps, or controls near the center when foldables are in scope |
