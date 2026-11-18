# Stack: SwiftUI

## Tokens

- `codeSyntax.iOS`, rule `camel-drop-type` inside a typed namespace: `color/bg/surface` → `Color.bgSurface` (asset catalog color set `bg/surface` with Any/Dark appearances), `space/16` → `Spacing.s16`, `radius/md` → `Radius.md`, `motion/normal` → `Motion.normal` (0.25 s).
- Color modes map to asset-catalog appearances: `Light` → Any, `Dark` → Dark, optional `High Contrast` → High Contrast appearances. A mode with any other name needs a mapping note.
- Text Styles map to `Font.TextStyle`; custom fonts use `.custom(name, size:, relativeTo:)` so they scale with Dynamic Type. The spec lists the `relativeTo` style for each Text Style.

## Structure mapping

| Figma | SwiftUI |
|---|---|
| Auto layout vertical, gap g | `VStack(alignment:, spacing: g)` |
| Auto layout horizontal | `HStack(spacing:)` |
| Wrap | custom `Layout` (flow) |
| Padding | `.padding(EdgeInsets(...))` |
| Fill container (width) | `.frame(maxWidth: .infinity)` |
| Hug contents | default sizing |
| Fixed size | `.frame(width:height:)` (flag on text containers) |
| Space between | `Spacer()` between children |
| Absolute child | `.overlay` / `ZStack` with alignment, or `.offset` |
| Component + variants | `View` struct + `enum` for variant properties |
| Boolean property | `Bool` parameter; Instance swap → `@ViewBuilder` slot |
| Scroll container | `ScrollView` + `.safeAreaInset` for pinned bars |

## Traps (`CODE-04`)

- Fixed heights on text containers break Dynamic Type; require Hug height.
- Absolute children inside scroll content become `ZStack` layers that do not scroll as expected.
- `SPACE_BETWEEN` with one child has no meaning; `Spacer()` collapses.
- Shadows with spread are not native (`.shadow` has no spread); a spread shadow needs a note.
- Blur backgrounds: use system materials (`.ultraThinMaterial` …) or Liquid Glass; custom blur values need a note.
- Variable fonts and SF Pro tracking: system font tracks automatically; do not hard-code tracking from Figma for SF Pro in code.
