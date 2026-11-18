# figma-ui-audit

A Claude skill (for Claude Code and other agents that read `SKILL.md`) that audits Figma files for **code-handoff readiness**. It is read-only: it reports what is wrong and where, and with your approval it can rename default-named layers. It changes nothing else.

It checks one house standard (Variables, Text Styles, Components, Auto Layout, naming, screen states) together with the guidelines of your target **platform**, **device** and **code stack**, plus a full **accessibility** pass (WCAG 2.2, contrast in every color mode, interactive states, focus states).

By [Mykhailo Pashynskyi](https://github.com/mykhailo-pashynskyi) · MIT

## Modes

| Mode | What happens | Writes to Figma |
|---|---|---|
| `audit` (default) | Runs the full checklist, scores the file, writes a report with a rule ID, severity, node location and expected value for every finding | No |
| `a11y` | Accessibility only: contrast of text, buttons, icons, input borders and focus rings in every color mode; state coverage; state tokens; target sizes | No |
| `states` | Which screens miss Loading, Empty, Error, Keyboard, Long content, Offline… | No |
| `rename` | Renames default layers (`Frame 1268`, `Group 5 Copy 2`), screen frames (`ScreenName / State`) and near-match pages from a dry-run list you approve | Names only, after approval |

It never creates, deletes, restyles, rebinds or restructures anything, and never touches component, variant or variable names. A rename list is approved in the chat first, dry-run first, and keeps an undo log (`{id, from, to}`).

## What it checks

- **Variables:** every color, space, radius, stroke and motion value comes from a Variable; semantic tier over primitives; Light/Dark as modes; clean names; scopes; code syntax.
- **Typography:** every text layer has a Text Style named by role; platform type scale (iOS Dynamic Type, Material 3).
- **Components:** repeated UI is instances; no detached copies; variant property naming; full state sets per component type.
- **Auto Layout:** frames use it; Fill/Hug intent; no groups holding UI; stretch and long-text tests flagged for manual check.
- **Naming:** no `Frame 1268` / `Group 5 Copy 2`; `ScreenName / State` frames; standard pages.
- **Screens and states:** Default, Loading, Empty, Error, Success, Keyboard open, Long content, Scrolled, Offline, with a state matrix per screen.
- **Platform and device fit:** frame sizes, safe areas, system chrome, navigation patterns.
- **Accessibility:** text 4.5:1 / large text 3:1; icons, input borders, selection indicators and focus rings 3:1, in every color mode with opacity composited; touch targets (iOS 44 pt, Android 48 dp, web 24 px); meaning not by color alone; focus, pressed, disabled, error and selected states for buttons, inputs, switches, checkboxes, radios, tabs, chips, links and sliders.
- **Stack readiness:** `codeSyntax` and naming for your stack, plus layout traps that translate badly to code.

## Profiles

Set the target when you call the skill, or let it infer from your frame sizes.

| Axis | Values |
|---|---|
| `platform` | `ios`, `android`, `web`, `cross` (React Native / Flutter) |
| `device` | iPhone (17e, 17 / 17 Pro / 18 Pro, Air, Pro Max, SE), **iPhone Duo** (outer and inner display, hinge, rail), Android compact / medium / expanded / foldable, web mobile / tablet / desktop |
| `stack` | SwiftUI, UIKit, Jetpack Compose, Android Views, React, Tailwind v4, React Native, Flutter |

## Install

It is a plain skill, no plugin or marketplace needed. Pick one:

**With the skills CLI** (works for Claude Code and other agents):

```bash
npx skills add mykhailo-pashynskyi/figma-ui-audit
```

**Manually for Claude Code** (all your projects):

```bash
git clone https://github.com/mykhailo-pashynskyi/figma-ui-audit.git ~/.claude/skills/figma-ui-audit
```

**Manually for one project:**

```bash
git clone https://github.com/mykhailo-pashynskyi/figma-ui-audit.git .claude/skills/figma-ui-audit
```

Start a new session (or reload skills); the skill is then available as `/figma-ui-audit`. Update with `git pull` inside the folder.

## Requirements

- The official **Figma MCP server** connected and authorized (use `/mcp`). The audit reads your file through `use_figma` and `get_metadata`; a screenshot-only review cannot verify bindings, auto layout or naming.
- Edit access to the Figma file only for the `rename` mode.
- The official Figma skill `figma-use` (shipped with the Figma plugin: `claude plugin install figma@claude-plugins-official`). This skill loads it before any `use_figma` call.

## Usage

```
/figma-ui-audit <figma-url> [audit|a11y|states|rename] [platform=ios] [device=iphone-duo] [stack=swiftui] [dark=on]
```

Or in plain words:

- "Audit this Figma file for iOS and SwiftUI: https://www.figma.com/design/…"
- "Check the accessibility of the Components page, contrast in Dark too."
- "Which screens are missing states?"
- "Rename the default layers on this screen."

Reports are written to `reports/` in your working directory.

## How scoring works

Each category takes the score of its worst failed severity (P0 blocks handoff, P1 wrong, P2 should fix, P3 polish); the overall score is the weighted sum. The verdict is **Ready**, **Needs work** or **Not ready**. Checks that cannot be verified from a file (font license, real screen-reader order) are listed under **Not verified**, never counted as passed.

## Layout

```
figma-ui-audit/
├── SKILL.md                workflow, modes, profile resolution
├── references/             core rules, checklist, accessibility, states, platforms, devices, stacks, rename playbook
├── scripts/                read-only scanners and the guarded rename script, run through use_figma
├── README.md
├── CHANGELOG.md
└── LICENSE
```

## Known limits

- iPhone Duo point sizes (466 × 678 outer, 951 × 669 inner) come from third-party measurements and simulator data; Apple's tech talks give the design rules but no point sizes. Verify against the simulator or Apple's design resources.
- Contrast is computed from solid fills and variable values per mode. Text over images and gradients is reported for visual review, not scored.
- Stretch and long-text tests need a canvas change, so a read-only audit marks them as not verified.
- Third-party device values (iPhone safe-area insets) can lag behind Apple's kit; treat them as values to confirm.
- The scripts were tested against a mocked Figma API and have not been run on a large production file; report problems as issues.

## Credits

Built on public guidance: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/), [Material 3](https://m3.material.io) and [Android developer docs](https://developer.android.com/design). Audit structure was informed by [figma-design-lint](https://github.com/tc9011/my-skills), [figma-suite](https://github.com/robukh/figma-suite), [design-system-ops](https://github.com/murphytrueman/design-system-ops) and [figma-console-mcp-skills](https://github.com/southleft/figma-console-mcp-skills). No code was copied from them.

## License

[MIT](LICENSE) © 2026 Mykhailo Pashynskyi
