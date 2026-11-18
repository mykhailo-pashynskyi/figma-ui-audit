# Device: iPhone Duo (foldable)

iPhone Duo has two displays: a compact **outer** display and a large **inner** display that opens like a book. iOS 27.1 adds hinge APIs. **[Apple]** marks guidance from Apple's tech talks "Design for iPhone Duo" and "Strike a pose with adaptive layouts on iPhone Duo"; **[3p]** marks third-party measurements (simulator or Figma kits). Apple did not publish point sizes in the sources read; the sizes below are third-party and consistent across several sources.

## Screens

| Display | Frame (pt) | Pixels | Scale | Size class | Safe-area insets | Source |
|---|---|---|---|---|---|---|
| Outer, portrait | 466 × 678 | 1398 × 2034 | 3x | compact width, regular height | top 0, bottom 34, left 0, right 84 | [3p] |
| Outer, rotated | 678 × 466 | — | 3x | compact width, compact height | verify in simulator | [3p] |
| Inner, as opened (flat) | 951 × 669 | 2007 × 2853 (rendered) | 3x | regular width, regular height | bottom 34, right 84 | [3p] |
| Inner, upright | 669 × 951 | — | 3x | regular / regular | top 82, bottom 34 | [3p] |

Conflict to report if it matters: one source derives 626 × 890 pt for the inner display from the physical panel (1878 × 2670 px ÷ 3) and rejects it; App Store screenshot size (2007 × 2853) and the simulator give 669 × 951. Use 669 × 951 / 951 × 669.

The outer display has a camera occlusion in the top-right area and system controls on the trailing edge; the inner display has a FaceTime camera occlusion that is active only while the camera is on. **[Apple]**

## Postures **[Apple]**

Apple describes these situations rather than a fixed list: closed (outer display); partially folded like a book; seated on a table like a laptop with the inner display facing the user; standing on its own resting on its edges; fully open flat. The hinge reports `closed`, `partiallyOpen`, `fullyOpen` and an angle. **[3p: UIHingeInteraction, iOS 27.1]**

## Design rules

1. **Two size classes, not per-pose layouts.** Design for compact width on the outer display and regular width on the inner display. Avoid fixed widths, breakpoints or metrics tied to one screen. **[Apple]** → `PLAT-06` P1 when a layout uses fixed device-specific widths.
2. **Same hierarchy inside and out.** The information architecture and navigation do not change between displays; do not limit functionality to one pose. Opening and closing must feel predictable and keep the user's place (same item, same scroll position, same draft). **[Apple]** → `PLAT-06` P1 when a flow exists on one display only.
3. **Outer display controls move to the trailing edge.** Tab bar, toolbars and the back button sit in a vertical rail on the right edge; the status bar is redesigned; the Dynamic Island grows vertically with Live Activities. Overflow items collapse into a menu; wide controls (text buttons, segmented controls) stay in the navigation bar. **[Apple]**
4. **Offset content from the rail.** Most content is laid out beside the controls; full-width centering only for non-scrolling immersive UI. **[Apple]** Figma kit values: rail 96 pt (24 + 48 + 24); content width 370 pt beside the rail on the outer display; status bar 48 × 86; toolbar 48 × 106/168/222; tab bar 48 × 110/160/210. **[3p]**
5. **Inner display uses the space.** Use split views to show several hierarchy levels; turn stacked layouts into two columns; show the tab bar as a sidebar for information-dense apps. Portrait keeps horizontal bars; landscape moves controls to the side. **[Apple]** Figma kit: 6-column grid inside, 4 columns outside, 16 pt gutters and margins, 262 pt sidebar. **[3p]**
6. **Keep interactive elements away from the fold.** When partially folded, system components nudge controls away from the center and interactive elements move to the bottom half in portrait. Scrollable content may cross the fold; buttons, fields and sliders should not. **[Apple]** Apple gives no fold width; Figma kits draw a band centered at 475.5 pt on the 951-wide frame. **[3p]** → `PLAT-06` P1 for a control centered on the fold.
7. **Sheets and the camera.** Sheets with vertical controls stop just short of the front camera. **[Apple]**
8. **Search and keyboard.** A focused search field sits above the keyboard and adapts its width and position as the device folds. **[Apple]**
9. **Split View.** Two apps side by side split the inner display 50/50, so the app also has to work at roughly 475 pt wide. **[Apple]** → `PLAT-08`
10. **Resizable app.** Design the app to be freely resizable; a non-resizable app looks letterboxed on the inner display. **[Apple]** (Projects that set `UIRequiresFullScreen` should expect black bars on the inner display. **[3p]**)

## Frames to deliver for iPhone Duo

| Frame | Required | Name example |
|---|---|---|
| Outer 466 × 678 | yes, every screen | `Home / Default / Duo Outer` |
| Inner 951 × 669 | yes, every screen | `Home / Default / Duo Inner` |
| Inner 669 × 951 (upright) | if the app supports portrait on the inner display | `Home / Default / Duo Inner Upright` |
| Outer 678 × 466 (rotated) | if the app supports rotation | `Home / Default / Duo Outer Rotated` |
| Inner, partially folded | for screens with controls near the center | `Home / Default / Duo Folded` with the fold band drawn |
| Inner Split View ~475 wide | for apps that support multitasking | `Home / Default / Duo Split` |

## Checks (all under `PLAT-06` unless noted)

| Check | Sev |
|---|---|
| Outer and inner frames exist for every key screen | P1 |
| Outer display: navigation, toolbar and back sit in the trailing rail, content offset from it | P1 |
| Inner display: layout uses regular width (sidebar, split, two columns), not a stretched phone layout | P1 |
| No interactive element inside the fold band on folded frames | P1 |
| Same navigation hierarchy and functionality on both displays | P1 |
| No fixed widths; containers use Fill and layout margins | P2 (`LAY-04`) |
| Continuity noted in the Interaction Matrix: what is preserved when opening/closing | P2 (`HAND-01`) |
| Camera occlusions respected on both displays | P2 (`PLAT-03`) |

## Sources

- Apple, Design for iPhone Duo: https://developer.apple.com/videos/play/tech-talks/111466/
- Apple, Strike a pose with adaptive layouts on iPhone Duo: https://developer.apple.com/videos/play/tech-talks/111463/
- Simulator measurements: https://individuation.dev/guides/iphone-duo-screen-sizes/
- Figma frames, rail and grid: https://www.appetiteui.com/blog/design-for-iphone-duo-in-figma
- Safe areas: https://safearea.info/iphone-duo
