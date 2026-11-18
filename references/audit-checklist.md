# Audit Checklist

Run every check that applies to the profile. Record Pass, Fail (with evidence), Waived or Not verified for each. Script keys refer to the `findings` object returned by [audit-scan.js](../scripts/audit-scan.js) or the fields of [file-scan.js](../scripts/file-scan.js).

**Method:** `auto` = script result · `visual` = screenshot judgment · `profile` = compare against platform/device/stack values · `manual` = needs the designer; goes to Not verified.
**Fix:** `rename` = the skill can rename layers, screen frames or pages after you approve a dry-run list (see [rename-playbook.md](rename-playbook.md)) · `designer` = report only; this plugin never changes anything else in the file.

## Severity

| Severity | Meaning |
|---|---|
| **P0** | Blocks handoff or code generation, or breaks the system. Must fix. |
| **P1** | Produces wrong or messy code, or violates a house rule in a way users will see. |
| **P2** | Hurts maintainability or deviates from platform guidance. |
| **P3** | Polish. |

Count thresholds: when a check says `P1 (≥5) / P2 (1–4)`, use the first severity when the count reaches the threshold.

Script key suffixes: `LAY-01-root` is `LAY-01` on a screen root (P0); `VAR-02-offsystem` / `VAR-03-offsystem` are raw colors that match no variable (the P0 branch of VAR-02 at ≥ 5, otherwise P1). The script also reports colors bound to primitives under `VAR-06`.

## Scoring

Per category, take the worst failed severity:

| Worst failure | Category score |
|---|---|
| none | 100 |
| P3 only | 75 |
| P2 | 60 |
| P1 | 40 |
| one P0 | 15 |
| two or more P0 | 0 |

Overall = Σ(category score × weight), rounded. Checks marked Not verified or N/A are excluded; a category with all checks excluded is excluded and the weights are renormalized.

| Verdict | Rule |
|---|---|
| **Ready** | score ≥ 85 and no P0, no P1 |
| **Needs work** | score 50–84, or any P1, and no P0 |
| **Not ready** | any P0, or score < 50 |

| Category | Weight |
|---|---|
| FILE — File structure | 4 |
| VAR — Variables and tokens | 15 |
| TYPE — Typography | 10 |
| COMP — Components and variants | 12 |
| LAY — Auto Layout and structure | 15 |
| NAME — Naming | 8 |
| STATE — Screens and states | 12 |
| PLAT — Platform and device fit | 10 |
| A11Y — Accessibility | 8 |
| CODE — Stack readiness | 4 (0 when `stack=none`; renormalize) |
| HAND — Handoff completeness | 2 |

## FILE — File structure

| ID | Check | Sev | Method | Fix |
|---|---|---|---|---|
| FILE-01 | Pages `Design System`, `Components`, `Screens`, `Prototypes`, `Archive` exist | P2 | auto `file.pages` | rename (near-match pages) |
| FILE-02 | Pages in that order; extra pages only after `Archive` | P3 | auto `file.pages` | designer |
| FILE-03 | No explorations or old versions on `Screens` (names with `old`, `v2`, `wip`, `test`, `copy`, `backup`) | P2 | auto `findings.NAME-05` on Screens page | designer |
| FILE-04 | No loose layers at page root other than frames, sections and components | P3 | auto `pageRoot.loose` | designer |
| FILE-05 | Cover or Read me frame states platform, devices, dark-mode scope, fonts | P3 | visual | designer |

## VAR — Variables and tokens

| ID | Check | Sev | Method | Fix |
|---|---|---|---|---|
| VAR-01 | Collections `color`, `space`, `radius` exist (plus `stroke`, `motion`, `size` when used) | P1 | auto `file.collections` | designer |
| VAR-02 | Solid fills bound to color variables, not raw hex | P0 (≥5 off-system colors) / P1 (raw but matches a variable value) / P2 (1–4) | auto `VAR-02` | designer |
| VAR-03 | Strokes bound to color variables | P1 (≥5) / P2 | auto `VAR-03` | designer |
| VAR-04 | Gap and padding bound to `space` variables | P1 (≥5) / P2 | auto `VAR-04` | designer |
| VAR-05 | Corner radius bound to `radius` variables | P1 (≥5) / P2 | auto `VAR-05` | designer |
| VAR-06 | UI nodes bind to the semantic tier, not to primitives (`palette/...`) | P2 | auto `VAR-06` | designer |
| VAR-07 | If dark mode is in scope: `color` has a `Dark` mode and every color variable has a value in it | P1 | auto `file.collections[].modes`, `missingModeValues` | designer |
| VAR-08 | No duplicated dark variables or dark styles (`dark/...`, `... Dark`) | P2 | auto `file.variables.darkDuplicates` | designer |
| VAR-09 | Variable names match `^[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*$` | P2 | auto `file.variables.badNames` | designer |
| VAR-10 | Shadows via Effect Styles named `shadow/*`, not raw effects | P2 | auto `VAR-10` | designer |
| VAR-11 | Variables have explicit scopes (not `ALL_SCOPES`) | P3 | auto `file.variables.allScopes` | designer |
| VAR-12 | Stroke widths bound to `stroke` variables; values on the platform stroke set | P2 | auto `VAR-12` | designer |
| VAR-13 | Spacing values on the 4 pt scale (or the project's declared scale) | P1 (≥5) / P2 | auto `VAR-13` | designer |
| VAR-14 | Paint styles used instead of variables for color | P3 | auto `VAR-14` | designer |
| VAR-15a | State tokens exist for every state the components use (hover, pressed, focus, disabled, error, selected) | P2 | auto `a11y-scan stateTokens`, `VAR-15a` | designer |
| VAR-15b | Non-default variants bind to state-named tokens (`…/pressed`), not to the default token with tweaks | P3 | auto `a11y-scan VAR-15b` | designer |
| VAR-15c | Focus tokens present: `color/focus/ring`, `color/focus/ring-offset`, `stroke/focus`, `space/focus-offset`, effect style `focus/ring` | P2 | auto `a11y-scan focusTokens` | designer |
| VAR-16 | Bindings resolve and alias chains are intact; no unresolved variables or collections, type mismatches, mode gaps or cycles; external dependencies identified (full method in [design-system-audit.md](design-system-audit.md)) | P1 | not covered by `audit`; run mode `ds` (`ds-scan.js`), otherwise Not verified | designer |

## TYPE — Typography

| ID | Check | Sev | Method | Fix |
|---|---|---|---|---|
| TYPE-01 | Every text layer uses a Text Style | P1 (≥5) / P2 | auto `TYPE-01` | designer |
| TYPE-02 | No mixed styles inside one text layer unless intentional (inline bold link) | P3 | auto `TYPE-02` | designer |
| TYPE-03 | Text Style names are roles, not font descriptions | P2 | auto `file.textStyles.badNames` | designer |
| TYPE-04 | Text Styles define a numeric line height (not Auto) | P3 | auto `file.textStyles.autoLineHeight` | designer |
| TYPE-05 | Font families and weights listed; count ≤ 2 families | P2 when > 2 families | auto `fonts` | designer |
| TYPE-06 | Font size ≥ platform minimum (iOS 11 pt, Android 12 sp for body copy, web 12 px; Label Small 11 sp allowed) | P1 | auto `TYPE-06` + profile | designer |
| TYPE-07 | No outlined text (vectors shaped like words; vector layers named like copy) | P0 | auto `TYPE-07` + visual | designer |
| TYPE-08 | Text style set maps to the platform role set (see platform file) | P3 | profile | designer |

## COMP — Components and variants

| ID | Check | Sev | Method | Fix |
|---|---|---|---|---|
| COMP-01 | Repeated UI on screens is instances, not frames that look like components | P1 | auto `COMP-01` (name heuristics + repeated structure) + visual | designer |
| COMP-02 | No detached instances (`detachedInfo` set) | P1 | auto `COMP-02` | designer |
| COMP-03 | Instances on screens point to local or library components that still exist | P1 | auto `COMP-03` | designer |
| COMP-04 | Variant property names are not default (`Property 1`) and values not `Variant 2` | P2 | auto `COMP-04` | designer |
| COMP-05 | Interactive components have the state set for the platform (iOS/Android: default, pressed, disabled, loading where async, error for inputs, selected for toggles; web adds hover, focus) | P1 | auto `COMP-05` | designer |
| COMP-06 | Component names follow `Category/Name/Detail` | P3 | auto `COMP-06` | designer |
| COMP-07 | Variant property names lowercase; values lowercase, no spaces (`state=pressed`) | P3 | auto `COMP-04` details | designer |
| COMP-08 | No variant explosion: TEXT, BOOLEAN, INSTANCE_SWAP properties used for content; variant count ≤ 48 per set | P2 | auto `COMP-08` | designer |
| COMP-09 | Components have a description (purpose, usage) | P3 | auto `COMP-09` | designer |
| COMP-10 | Every non-default state looks different from default (pressed, hover, focus, selected, error give visible feedback) | P1 | auto `a11y-scan COMP-10` | designer |
| COMP-11 | Interactive components have the full state set per type and platform from [component-states.md](component-states.md) (inputs: focus, filled, error, disabled; toggles: on/off × pressed/disabled/focus) | P1 per missing required state, P2 per conditional | auto `a11y-scan COMP-05` | designer |

## LAY — Auto Layout and structure

| ID | Check | Sev | Method | Fix |
|---|---|---|---|---|
| LAY-01 | Frames with ≥ 2 children use Auto Layout | P0 (≥10 or the screen root) / P1 | auto `LAY-01` | designer |
| LAY-02 | No GROUP holding UI structure inside screens; groups only for vector artwork | P1 (≥5) / P2 | auto `LAY-02` | designer |
| LAY-03 | Absolute-positioned children only with an `intentional` note | P2 | auto `LAY-03` | designer |
| LAY-04 | Children use deliberate sizing; text and content containers in vertical stacks use Fill width | P3 | auto `LAY-04` | designer |
| LAY-05 | No child overflows its parent bounds (unless clip is intended) | P1 | auto `LAY-05` | designer |
| LAY-06 | Nesting depth ≤ 8 inside a screen | P3 | auto `LAY-06` | designer |
| LAY-07 | No flattened UI (vector nodes standing in for structure) | P0 | auto `LAY-07` + visual | designer |
| LAY-08 | Text boxes that can grow are not fixed-size (`textAutoResize = NONE`) | P2 | auto `LAY-08` | designer |
| LAY-09 | Stretch test passes: resize screen +100 pt width and +200 pt height, no overlap or corner-glued content | P1 | visual (needs a canvas change, so a read-only audit marks it Not verified; the designer runs it) | designer |
| LAY-10 | Long-text test passes: triple a title, card grows, no overflow | P1 | visual (duplicate) | designer |
| LAY-11 | No sub-pixel sizes or positions on structural frames | P3 | auto `LAY-11` | designer |
| LAY-12 | Hidden layers that are leftovers (not variant toggles) | P3 | auto `LAY-12` | designer |

## NAME — Naming

| ID | Check | Sev | Method | Fix |
|---|---|---|---|---|
| NAME-01 | No default names (`Frame 1268`, `Group 5`, `Rectangle 12`, `Vector`, `image 7`, `Ellipse 4 copy`) | P1 (≥5) / P2 | auto `NAME-01` | rename |
| NAME-02 | Screen frames named `ScreenName / State` | P1 | auto `NAME-02` | rename |
| NAME-03 | Layer names are PascalCase role names | P3 | auto `NAME-03` | rename |
| NAME-04 | No duplicate sibling names that hide meaning (`Card`, `Card`, `Card` in a list is fine; `Frame`, `Frame` is not) | P3 | auto `NAME-04` | rename |
| NAME-05 | No version words (`final`, `v2`, `new`, `copy`, `old`, `test`, `wip`) | P2 | auto `NAME-05` | rename |
| NAME-06 | Image layers named for content (`AvatarImage`, `HeroImage`) | P3 | auto `NAME-01` subset | rename |

## STATE — Screens and states

| ID | Check | Sev | Method | Fix |
|---|---|---|---|---|
| STATE-01 | Screen frames at the device base size | P1 | auto `screens[].size` + profile | designer |
| STATE-02 | Each data screen has Default, Loading, Empty, Error | P1 per missing state | auto `stateMatrix` + visual (is it a data screen?) | designer |
| STATE-03 | Screens with text input have Keyboard open | P1 | auto `stateMatrix` + `hasInput` | designer |
| STATE-04 | Long content state for screens with dynamic text or numbers | P2 | auto `stateMatrix` | designer |
| STATE-05 | Scrolled state for screens taller than the device height | P2 | auto `screens[].tall` + `stateMatrix` | designer |
| STATE-06 | Offline and Success where the product needs them | P3 | manual | designer |
| STATE-07 | No placeholder copy (`Lorem`, `Text`, `Title`, `Label`, `Button`, `Placeholder`) visible on screens | P2 | auto `STATE-07` | designer |
| STATE-08 | Loading state says skeleton or spinner and matches the Default layout | P3 | visual | designer |
| STATE-09 | Empty and Error states contain real copy and a next action | P2 | visual | designer |

## PLAT — Platform and device fit

Expected values come from the platform and device files.

| ID | Check | Sev | Method | Fix |
|---|---|---|---|---|
| PLAT-01 | Frame sizes match the declared platform | P2 | auto `screens[].size` + profile | designer |
| PLAT-02 | Adaptive frames: 2–3 heaviest screens shown at a larger and smaller device | P2 | auto `screens` grouping | designer |
| PLAT-03 | System chrome shown (status bar, Dynamic Island / camera, home indicator, Android system bars) and content kept out of unsafe zones | P1 | auto `PLAT-03` + visual | designer |
| PLAT-04 | Navigation pattern native to the platform (iOS tab bar / nav bar, Android navigation bar / rail, web nav by breakpoint) | P2 | visual + profile | designer |
| PLAT-05 | Primary actions within thumb reach on phones; bottom actions above the home indicator / gesture area | P3 | visual | designer |
| PLAT-06 | Device-specific rules (iPhone Duo hinge and rail, Android foldable posture, web breakpoints) | per device file | profile | designer |
| PLAT-07 | Dark mode screens exist for key screens when dark mode is in scope | P2 | auto `screens` naming + modes | designer |
| PLAT-08 | Landscape or rotated frames where the device or app requires it (iPhone Duo outer rotated, inner upright) | P2 | profile | designer |

## A11Y — Accessibility

| ID | Check | Sev | Method | Fix |
|---|---|---|---|---|
| A11Y-01 | Touch targets ≥ platform minimum (iOS 44×44 pt, Android 48×48 dp, web 24×24 px AA, 44 recommended) | P1 | auto `A11Y-01` | designer |
| A11Y-02 | Text contrast ≥ 4.5:1 (≥ 3:1 for large text: iOS/Android ≥ 18 regular or ≥ 14 bold; web ≥ 24 px or ≥ 18.66 px bold) in every color mode, on screens and inside component variants | P1 (body text, button labels) / P2 (secondary) | auto `a11y-scan A11Y-02` (supersedes `audit-scan` A11Y-02) | designer |
| A11Y-03 | Non-text contrast ≥ 3:1 for control borders, icons that carry meaning, focus rings | P2 | visual + auto where solid | designer |
| A11Y-04 | State not shown by color alone (error has icon or text) | P2 | visual | designer |
| A11Y-05 | Large-text layout: one key screen shown at the largest accessibility size (iOS AX5 / Android 200%) or a note on how it reflows | P2 | auto `stateMatrix` (`Large Text` state) + manual | designer |
| A11Y-06 | Icon-only buttons have an accessibility label noted (annotation or component description) | P3 | auto `A11Y-06` | designer |
| A11Y-07 | Reduce Motion behavior stated for long or large animations | P3 | manual | designer |
| A11Y-08 | Spacing between adjacent targets (iOS ~12 pt around bezeled controls) | P3 | auto `A11Y-08` | designer |
| A11Y-09 | Interactive components have a `focus` variant (severity by platform: web P1; Android P1 with tablets/ChromeOS/TV else P2; iOS P2 iPad/keyboard else P3; inputs P1 everywhere) | per platform | auto `a11y-scan A11Y-09` | designer |
| A11Y-10 | Text contrast checked in every color mode (Light, Dark, High Contrast), with opacity composited | P1 | auto `a11y-scan A11Y-02` | designer |
| A11Y-11 | Input, checkbox and radio boundaries ≥ 3:1 against the page background (border or fill) | P1 | auto `a11y-scan A11Y-11` | designer |
| A11Y-12 | Selected vs unselected (switch, checkbox, radio, tab) differ by ≥ 3:1 or by shape, mark or position | P1 | auto `a11y-scan A11Y-12` | designer |
| A11Y-13 | Focus ring ≥ 2 px and ≥ 3:1 against the background in every mode | P1 | auto `a11y-scan A11Y-13` | designer |
| A11Y-14 | Button container vs page: icon-only buttons ≥ 3:1 (P2); text buttons 3:1 recommended (P3) | P2 / P3 | auto `a11y-scan A11Y-14` | designer |
| A11Y-15 | Inputs have a visible label (not placeholder only) | P1 | visual | designer |
| A11Y-16 | Focus / reading order annotated on forms and multi-pane layouts | P3 | auto `annotations` + visual | designer |
| A11Y-17 | Text on blurred or glass materials passes over busy content; Reduce Transparency fallback keeps hierarchy | P2 | visual | designer |
| A11Y-18 | Text over images or gradients has a scrim or passes on the worst area | P2 | auto `a11y-scan A11Y-02-image` + visual | designer |

Disabled variants are exempt from contrast (WCAG); `A11Y-02-disabled` findings are P3 notes.

## CODE — Stack readiness (only when `stack` is set)

| ID | Check | Sev | Method | Fix |
|---|---|---|---|---|
| CODE-01 | Variables have `codeSyntax` for the stack's platform (`WEB`, `iOS`, `ANDROID`) in its naming convention | P2 | auto `file.variables.codeSyntaxMissing` | designer |
| CODE-02 | Component property names map to code props (camelCase-compatible, booleans as `is*`/`has*` or plain adjectives) | P3 | auto `COMP-04` details + stack file | designer |
| CODE-03 | Layer names usable as identifiers in the stack (no leading digits, no symbols) | P3 | auto `NAME-03` | designer |
| CODE-04 | Stack-specific layout traps (see stack file), e.g. negative gap, `SPACE_BETWEEN` with one child, absolute children in scroll containers | P2 | auto `CODE-04` + stack file | designer |
| CODE-05 | `get_design_context` output for one screen uses flex/stack layout, not absolute positions | P1 | auto when the tool succeeds; else Not verified | designer |

## HAND — Handoff completeness

| ID | Check | Sev | Method | Fix |
|---|---|---|---|---|
| HAND-01 | Interaction Matrix exists and covers prototype links and gestures | P2 | manual + auto (prototype reactions count) | designer |
| HAND-02 | Prototype transitions use `motion` durations and declared easing | P3 | auto `HAND-02` | designer |
| HAND-03 | Fonts listed with source and license confirmed for the target (app embedding or web) | P0 if unconfirmed for a custom font at delivery time / P3 for system fonts | manual | designer |
| HAND-04 | Notes on non-obvious stretch, pin and scroll behavior | P3 | auto `annotations` count + visual | designer |
| HAND-05 | Assets that ship as images have export settings (PNG @2x/@3x or SVG/PDF for icons; WebP for web) | P3 | auto `HAND-05` | designer |
