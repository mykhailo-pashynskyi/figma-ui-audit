# Stack: React Native (incl. Expo)

Use with `platform=cross` (or `ios`/`android` when the app targets one store).

## Tokens

- No CSS variables. Tokens live in a theme object. `codeSyntax.WEB`, rule `dot-theme`: `color/bg/surface` → `theme.colors.bgSurface`, `space/16` → `theme.space[16]` or `theme.space.s16`, `radius/md` → `theme.radius.md`.
- Color modes → two theme objects selected by `useColorScheme()`.
- Text Styles → a `Text` component with variants; `allowFontScaling` stays on; set `maxFontSizeMultiplier` only with a stated reason.
- Units: density-independent pixels (same numbers as pt/dp in the design).

## Structure mapping

| Figma | React Native |
|---|---|
| Auto layout vertical | `<View style={{flexDirection:'column', gap}}>` (default direction is column) |
| Auto layout horizontal | `flexDirection:'row'` |
| Fill | `flex:1` / `alignSelf:'stretch'` |
| Hug | default |
| Absolute child | `position:'absolute'` |
| Scroll | `ScrollView` / `FlatList`; pinned header via `stickyHeaderIndices` or outside the list |
| Safe areas | `react-native-safe-area-context` insets |
| Shadow | iOS `shadow*` props vs Android `elevation`; design both or note |

## Traps (`CODE-04`)

- Shadows and blur differ by platform; colored shadows have no Android equivalent.
- Percent line height has no direct RN equivalent; Text Styles need numeric line heights (`TYPE-04`).
- Platform components (switch, date picker, alerts) look native by default; a custom design must say "custom on both" (`PLAT-04`, see [../platforms/cross.md](../platforms/cross.md)).
- Keyboard: `KeyboardAvoidingView` behavior differs; the Keyboard open state must show the intended result on both platforms.
