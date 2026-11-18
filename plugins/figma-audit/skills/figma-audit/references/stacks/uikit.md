# Stack: UIKit

## Tokens

- `codeSyntax.iOS`, rule `camel-drop-type` on typed extensions: `UIColor.bgSurface` (asset catalog with appearances), `Spacing.s16` (`CGFloat`), `Radius.md`.
- Text Styles map to `UIFont.TextStyle`; custom fonts via `UIFontMetrics(forTextStyle:).scaledFont(for:)` with `adjustsFontForContentSizeCategory = true`.

## Structure mapping

| Figma | UIKit |
|---|---|
| Auto layout | `UIStackView` (axis, spacing, alignment, distribution) or Auto Layout constraints |
| Padding | `directionalLayoutMargins` + `isLayoutMarginsRelativeArrangement` |
| Fill | `distribution = .fill`, content hugging and compression resistance priorities |
| Hug | intrinsic content size, high hugging priority |
| Space between | `distribution = .equalSpacing` |
| Absolute child | constraints to the parent's edges; outside stack views |
| List of rows | `UICollectionView` compositional layout / list configuration |
| Component + variants | `UIView` subclass or `UIButton.Configuration`; variants → enum |

## Traps (`CODE-04`)

- Text in fixed-size containers truncates at large content sizes.
- Overlapping elements inside a stack view cannot be expressed; they need a container view.
- Shadow spread and inner shadows need custom layers; note them.
