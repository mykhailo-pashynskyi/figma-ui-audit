# Changelog

## 1.1.0

- New mode `ds`: read-only design system audit of variable bindings, alias chains (per mode), type and mode problems, cycles (potential vs confirmed), library and component provenance, missing and suspicious bindings, grouped by root cause with confidence and limits. Script `ds-scan.js`, reference `design-system-audit.md`.
- The skill offers `ds` once after `audit`, `a11y` or `rename` when the file uses variables or libraries.
- New checklist row `VAR-16` (Not verified unless `ds` is run).

## 1.0.1

- Distributed as a plain skill (no plugin or marketplace): the skill sits at the repository root and installs with `npx skills add` or a `git clone` into `~/.claude/skills`.

## 1.0.0

First release.

- Modes: `audit`, `a11y`, `states`, `rename`.
- Checklist with rule IDs and P0–P3 severities across 11 categories, deterministic scoring and verdict.
- Accessibility audit: contrast per color mode, interactive state coverage, state tokens, focus rings, target sizes.
- Platform profiles: iOS, Android (Material 3), Web (WCAG 2.2), cross-platform.
- Device profiles: iPhone, iPhone Duo, Android window size classes and foldables, web viewports.
- Stack profiles: SwiftUI, UIKit, Jetpack Compose, Android Views, React, Tailwind v4, React Native, Flutter.
- Read-only scripts for `use_figma`: `file-scan`, `audit-scan`, `a11y-scan`; guarded `rename-apply` with dry run and undo log.
