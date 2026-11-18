# Stack: Jetpack Compose

## Tokens

- `codeSyntax.ANDROID`, rule `camel-drop-type`: `color/bg/surface` → `surface` in `MaterialTheme.colorScheme` when it maps to an M3 role, otherwise a custom `AppColors.bgSurface` via `CompositionLocal`. `space/16` → `Spacing.s16` (`16.dp`). `radius/md` → `MaterialTheme.shapes.medium` when on the M3 scale.
- Color modes → `lightColorScheme()` / `darkColorScheme()`.
- Text Styles named after M3 roles map to `MaterialTheme.typography.bodyMedium` etc. Other names need a mapping table in the spec.
- Units: dp for size and spacing, sp for text.

## Structure mapping

| Figma | Compose |
|---|---|
| Auto layout vertical, gap g | `Column(verticalArrangement = Arrangement.spacedBy(g.dp))` |
| Auto layout horizontal | `Row(horizontalArrangement = Arrangement.spacedBy(...))` |
| Wrap | `FlowRow` / `FlowColumn` |
| Padding | `Modifier.padding(...)` |
| Fill container | `Modifier.fillMaxWidth()` or `Modifier.weight(1f)` in a Row/Column |
| Hug contents | `wrapContentSize()` (default) |
| Space between | `Arrangement.SpaceBetween` |
| Absolute child | `Box` with `Modifier.align` / `offset` |
| Scroll container | `LazyColumn` / `verticalScroll`; pinned bars via `Scaffold` |
| Component + variants | `@Composable` with parameters; variants → enum or sealed class |
| Boolean / Instance swap | `Boolean` param / composable slot lambda |

## Traps (`CODE-04`)

- Edge-to-edge: screens must show content under system bars and apply `WindowInsets` padding; designs that leave a colored strip behind the status bar contradict Android 15 behavior.
- Elevation instead of shadows: arbitrary shadow color, blur and offset are not native; tonal elevation is preferred in M3.
- State layers: pressed/hover/focus come from ripple and state-layer opacity; variants that change size or layout on press are not native.
- Text in fixed-height containers breaks at large font scale.
