# Report Format

Write the report in the user's language. Rule IDs, layer names, variable and style names stay as they are. Save to `reports/<file-name>-<YYYY-MM-DD-HHMM>.md`; offer a JSON export with the same data.

## Template

```markdown
# Figma UI Audit — <file name> · <scope>

**Profile:** platform ios · device iphone-17 (402×874) · stack swiftui · dark mode in scope: yes   (inferred: device)
**Scope:** page `Screens`, 24 screens (6 audited in detail) · audited 2026-11-18 14:30
**Verdict:** Needs work · **Score:** 64/100 · **Findings:** P0 1 · P1 9 · P2 14 · P3 6 · **Waived:** 2 · **Not verified:** 5

## Category breakdown
| Category | Weight | Score | Worst | Findings |
|---|---|---|---|---|
| VAR — Variables and tokens | 15 | 40 | P1 | 4 |
| LAY — Auto Layout | 15 | 15 | P0 | 3 |
| … | | | | |

## Top fixes (do these first)
1. **[P0] LAY-01-root** Screen roots without auto layout: `Home final v3`, `Profile` (2) → wrap content in a vertical auto layout `ScreenRoot`, gap `space/16`.
2. **[P1] VAR-02** 37 raw fills; 31 match an existing variable, 6 are off-system.
3. …

## Findings

### P0
#### LAY-01-root — Screen root has no auto layout
- **Where:** `Home final v3` (12:345) · Screens
- **Actual:** 7 children positioned absolutely · **Expected:** vertical auto layout, children Fill width
- **Why:** this screen converts to absolute positions in code; it will not adapt to other iPhones or Dynamic Type.
- **Fix:** designer

### P1
#### VAR-02 — Raw fills (31 nodes)
| Node | Path | Actual | Bind to |
|---|---|---|---|
| `Rectangle 12` (12:401) | Home final v3 › Group 847 | #FFFFFF | `color/bg/surface` |
| … | | | |

## State matrix
| Screen | Frames | Present | Missing |
|---|---|---|---|
| Home | 3 | default, loading, empty | error |
| Profile / Edit | 1 | default | loading, error, keyboard |

## Platform and device notes
- House base size 390×844 vs current iPhone 402×874 — info, not a defect.
- iPhone Duo: no inner-display frames (PLAT-06, P1).

## Waived
- `HeroArtwork` absolute position — annotated "intentional: decor".

## Not verified (needs the designer)
- HAND-03 Font license for "Gilroy" (custom font, app embedding).
- LAY-09 / LAY-10 Stretch and long-text tests were not run (read-only audit). Run them manually on a duplicate frame.
- A11Y-18 Text over images and gradients (contrast is reported for visual review, not scored).
- VAR-16 Binding and alias-chain integrity (run mode `ds` to verify).

## What next
- `ds`: design system audit of bindings, alias chains, modes and library provenance (offered once when the file uses variables or libraries).
- `rename`: N layer, frame and page renames are ready as a dry-run list; nothing else in the file is changed by this plugin.
```

## Writing rules

- Lead with the verdict and the top fixes; most readers stop there.
- Group repeated findings into one entry with a count and a table of examples (max 10 rows; full list in the JSON).
- Every finding has Where (name, ID, path), Actual, Expected (with the token or style name), Why, Fix (auto / assist / designer).
- Severity by the checklist, not by gut. If you deviate, say why in one sentence.
- Separate house rules from platform guidance in wording: "House rule:" vs "Apple HIG:" / "Material 3:" / "WCAG 2.2:".
- Do not pad: no generic advice that is not tied to a node or a missing artifact.
- Include positive findings only as one line ("Components: all buttons are instances with full state sets").

## Critic brief

Spawn a fresh-context subagent for the judgment pass on screens. Give it the screenshots, the profile, and the script summary (counts only, not the findings list), and this brief:

> You are a senior product designer reviewing mobile/web screens before developer handoff. Platform: <platform>, device: <device>. You have not seen how these screens were made. For each screen, report only concrete problems a developer or user would hit, each with: severity (P0 blocks use or handoff · P1 clearly wrong · P2 should fix · P3 polish), the element, what is wrong, why it matters, and a one-sentence fix. Look for: unclear primary action; hierarchy (one focal point, clear reading order); content that will break (long names, big numbers, translations ~30% longer, empty values); missing or unrealistic states (Loading that does not match Default, Empty without a next step, Error without recovery); platform fit (native navigation pattern, system chrome, safe areas, keyboard, thumb reach); accessibility (contrast that looks low, tiny targets, color-only meaning, text inside images); visual consistency (spacing rhythm, radius, alignment, icon style). Do not comment on taste choices that are consistent and intentional. End with a "Not verified" list of what you could not judge from images.

Merge its findings: drop duplicates of mechanical findings, map each remaining one to the closest checklist ID (or `CRIT-<n>` when none fits), and keep its severity unless the checklist defines one.
