# Stack: Flutter

Use with `platform=cross`, `ios`, `android` or `web`.

## Tokens

- Figma has no Flutter code-syntax slot. Either put the Dart identifier in the `WEB` slot by team convention (`AppColors.bgSurface`), or mark `CODE-01` as N/A and rely on a token export. Say which in the report.
- Colors → `ColorScheme` roles where they map to M3 roles, plus a `ThemeExtension<AppColors>` for custom tokens. Modes → `ThemeData.light()` / `ThemeData.dark()` themes.
- Text Styles → `TextTheme` roles (`bodyMedium`, `titleLarge`) when named after M3 roles; custom styles in a `ThemeExtension`.
- Spacing → `const` doubles (`Spacing.s16`); radius → `BorderRadius` constants.
- Units: logical pixels (same numbers as pt/dp).

## Structure mapping

| Figma | Flutter |
|---|---|
| Auto layout vertical, gap g | `Column(spacing: g, children: …)` |
| Auto layout horizontal | `Row(spacing: …)` |
| Wrap | `Wrap(spacing:, runSpacing:)` |
| Padding | `Padding` / `EdgeInsets` |
| Fill (main axis) | `Expanded` / `Flexible` |
| Fill (cross axis) | `crossAxisAlignment: CrossAxisAlignment.stretch` |
| Hug | `mainAxisSize: MainAxisSize.min` |
| Space between | `MainAxisAlignment.spaceBetween` |
| Absolute child | `Stack` + `Positioned` |
| Scroll | `ListView` / `CustomScrollView` with slivers for pinned headers |
| Safe areas | `SafeArea` / `MediaQuery.paddingOf` |
| Component + variants | `StatelessWidget` with an enum per variant property |

## Traps (`CODE-04`)

- `Expanded` inside a scrollable axis is an error; a Fill child inside a scroll container needs a different structure.
- Text scaling: `MediaQuery.textScaler`; fixed-height text containers overflow at large scales.
- Platform-adaptive widgets (`Switch.adaptive`, Cupertino vs Material) must match the design decision per platform.
