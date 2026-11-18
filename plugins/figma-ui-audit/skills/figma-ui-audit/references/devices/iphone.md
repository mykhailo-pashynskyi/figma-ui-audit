# Devices: iPhone (slab)

For the foldable see [iphone-duo.md](iphone-duo.md). Sizes in points (Figma frame size), portrait. Status: November 2026, iOS 27.

| Device id | Models | Frame (pt) | Scale | Top inset | Bottom inset | Top cutout |
|---|---|---|---|---|---|---|
| `iphone-18-pro-max`, `iphone-17-pro-max` | iPhone 18 Pro Max, 17 Pro Max | 440 × 956 | 3x | 62 | 34 | Dynamic Island |
| `iphone-18-pro`, `iphone-17-pro`, `iphone-17` | iPhone 18 Pro, 17 Pro, 17 | 402 × 874 | 3x | 62 | 34 | Dynamic Island |
| `iphone-air` | iPhone Air | 420 × 912 | 3x | 68 | 34 | Dynamic Island |
| `iphone-17e`, `iphone-16e` | iPhone 17e, 16e | 390 × 844 | 3x | 47 | 34 | Notch |
| `iphone-se` | iPhone SE (2nd/3rd gen) | 375 × 667 | 2x | 20 | 0 | none (Home button) |
| `iphone-mini` | iPhone 13 mini, 12 mini | 360 × 780 | 3x | 50 | 34 | Notch |

Sources and confidence: frame sizes from Appetite UI's iOS 27 Figma size guide; insets for 18 Pro Max, 18 Pro, 17, Air, 17e from safearea.info (portrait). Insets for 17 Pro and 17 Pro Max are assumed equal to 18 Pro and 18 Pro Max (same panel). SE and mini insets are long-standing iOS values. Treat insets as verify-against-the-kit values: Apple's kit may round the top inset to 59 or 62 depending on version.

## Which frames to deliver

| Purpose | Frame |
|---|---|
| House base size (from the requirements) | 390 × 844 |
| Recommended base size for current flagships | 402 × 874 |
| Large check for content-heavy screens | 440 × 956 |
| Small check for content-heavy screens | 375 × 667 |

The house standard says 390 × 844 with extras at 430 × 932 or 375 × 667. 430 × 932 is the previous Pro Max generation; current Pro Max is 440 × 956. Report this once as info (not a defect) and recommend 402 × 874 as base plus 440 × 956 and 375 × 667 as checks, unless the project confirms 390 × 844.

## Device-specific checks (`PLAT-06`)

- 375 × 667 (SE): no Dynamic Island and no home indicator; a bottom-anchored button sits 16 pt above the bottom edge instead of above the home indicator. Tab bar is shorter. Content density: check the Long content state at this size.
- 390 × 844 (17e/16e): notch, not Dynamic Island; Live Activity designs that rely on the Island do not apply.
- Air (420 × 912): taller top inset (68 pt); check sticky headers.
- Landscape: only when the app supports it; then insets move to the left and right (Dynamic Island side) and bottom keeps the home indicator.

## Sources

- https://www.appetiteui.com/blog/iphone-screen-sizes-figma
- https://safearea.info/iphone-18-pro-max (and the per-model pages on the same site)
- https://www.apple.com/iphone-18-pro/specs/
