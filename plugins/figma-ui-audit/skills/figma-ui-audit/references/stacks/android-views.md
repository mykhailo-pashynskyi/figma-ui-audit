# Stack: Android Views (XML)

## Tokens

- `codeSyntax.ANDROID`, rule `snake`: `color/bg/surface` → `@color/color_bg_surface` or a theme attribute `?attr/colorSurface` when it maps to an M3 role. `space/16` → `@dimen/space_16`. Text Styles → `TextAppearance.App.BodyMedium` extending `TextAppearance.Material3.BodyMedium`.
- Color modes → `values/` and `values-night/` resources.

## Structure mapping

| Figma | Views |
|---|---|
| Auto layout | `LinearLayout` (orientation, `android:layout_marginTop`/spacing via dividers) or `ConstraintLayout` chains |
| Fill | `match_parent` / `0dp` with weight or constraints |
| Hug | `wrap_content` |
| Space between | `ConstraintLayout` spread chain |
| Absolute child | `FrameLayout` / constraints with margins |
| Lists | `RecyclerView` with a row layout per component |

## Traps (`CODE-04`)

- Gap is not native in `LinearLayout`; spacing is margins or dividers. Consistent `space` tokens keep that manageable.
- Negative spacing and overlapping auto layout children need `ConstraintLayout`.
- Edge-to-edge insets as in Compose.
