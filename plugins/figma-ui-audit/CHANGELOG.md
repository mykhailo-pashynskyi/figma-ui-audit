# Changelog

## 1.0.0

First release.

- Modes: `audit`, `a11y`, `states`, `rename`.
- Checklist with rule IDs and P0–P3 severities across 11 categories, deterministic scoring and verdict.
- Accessibility audit: contrast per color mode, interactive state coverage, state tokens, focus rings, target sizes.
- Platform profiles: iOS, Android (Material 3), Web (WCAG 2.2), cross-platform.
- Device profiles: iPhone, iPhone Duo, Android window size classes and foldables, web viewports.
- Stack profiles: SwiftUI, UIKit, Jetpack Compose, Android Views, React, Tailwind v4, React Native, Flutter.
- Read-only scripts for `use_figma`: `file-scan`, `audit-scan`, `a11y-scan`; guarded `rename-apply` with dry run and undo log.
