# Platform profile: Cross-platform (React Native, Flutter, Kotlin Multiplatform)

One design ships to iOS and Android. Load [ios.md](ios.md) and [android.md](android.md) both, plus one device file per platform. Report a finding once and tag it `[iOS]`, `[Android]` or `[both]`.

## Rules

- Frames: at least one iOS frame (402 × 874) and one Android frame (412 × 915 or 360 × 800) for each key screen, so both system chromes and safe areas are visible. → `PLAT-01`, `PLAT-03`
- Touch targets: use the stricter value, 48 × 48. → `A11Y-01`
- Minimum text: 12 for body copy on both. → `TYPE-06`
- Typography: one role set that maps to both (`Title 1` ≈ `Headline Small`, `Body` ≈ `Body Large`, `Caption 1` ≈ `Body Small`). Record the mapping in the spec. → `TYPE-08`
- Components that differ by platform are designed twice or marked "native": switches, date and time pickers, alerts and dialogs, action sheets vs bottom sheets, back navigation, tab bar vs navigation bar, pull-to-refresh, haptics. List each in the spec with the decision (`native` or `custom, same on both`). → `PLAT-04`
- Shadows: iOS renders shadow color, offset and blur; Android renders elevation. A design that depends on a colored or offset shadow needs an Android fallback noted. → `VAR-10`, `HAND-04`
- Fonts: a custom font needs files and an embedding license for both app stores. System font fallback must be stated (SF Pro on iOS, Roboto on Android). → `HAND-03`
- Keyboard: iOS and Android keyboards differ in height and in the return-key action; show the iOS keyboard on the iOS frame and the Android keyboard on the Android frame. → `STATE-03`
- Edge-to-edge applies on both: content under status bars, interactive elements above the home indicator / gesture area. → `PLAT-03`
