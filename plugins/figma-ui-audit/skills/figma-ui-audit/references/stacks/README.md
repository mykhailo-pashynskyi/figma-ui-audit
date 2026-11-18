# Stack profiles

Load exactly one file. Each file gives: the `codeSyntax` slot and naming rule (`CODE-01`), how Figma structure maps to code (used to explain findings and for `CODE-05`), and stack-specific traps (`CODE-04`).

| `stack` | File | codeSyntax slot |
|---|---|---|
| `swiftui` | [swiftui.md](swiftui.md) | `iOS` |
| `uikit` | [uikit.md](uikit.md) | `iOS` |
| `compose` | [compose.md](compose.md) | `ANDROID` |
| `android-views` | [android-views.md](android-views.md) | `ANDROID` |
| `react` | [react.md](react.md) | `WEB` |
| `tailwind` | [tailwind.md](tailwind.md) | `WEB` |
| `react-native` | [react-native.md](react-native.md) | `WEB` |
| `flutter` | [flutter.md](flutter.md) | none (see file) |

Figma variables have three code-syntax slots only: `WEB`, `ANDROID`, `iOS`. Generate the value from the variable path with the rule in the stack file, e.g. `color/bg/surface`:

| Rule | Result |
|---|---|
| css-var | `var(--color-bg-surface)` |
| camel | `colorBgSurface` |
| camel-drop-type | `bgSurface` |
| snake | `color_bg_surface` |
| dot-theme | `theme.colors.bgSurface` |
