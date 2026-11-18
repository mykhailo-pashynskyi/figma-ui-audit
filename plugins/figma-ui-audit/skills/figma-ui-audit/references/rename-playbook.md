# Rename Playbook

The only thing this plugin writes to a Figma file is **names**: layers, screen frames and pages. Renames never change how a design looks or behaves. They run only from a dry-run list the user approved in the current chat, and only for the items on that list.

## What can be renamed

| Target | Rule IDs | Allowed |
|---|---|---|
| Layers (frames, groups, rectangles, text, vectors, images) with default or version-word names | `NAME-01`, `NAME-03`, `NAME-04`, `NAME-05`, `NAME-06` | yes |
| Screen frames to `ScreenName / State[ / Device]` | `NAME-02` | yes |
| Pages that are near-matches of the standard names (`components` → `Components`, `Screens v2` → only with approval) | `FILE-01` | yes |
| Instance layers | `NAME-01` | only when the user asks; an instance named after its component is correct |
| Component, variant, property, variable, style names | — | no (changes the API that code and libraries depend on); reported only |
| Anything not a name (fills, bindings, layout, text, variants) | — | no |

Never delete, move, regroup, detach or restyle anything.

## Protocol

1. **Plan.** From the audit findings build a table: node ID, current name, proposed name, rule, reason (type, content, parent). Show counts per rule and up to 15 examples; save the full list to `reports/<file>-rename-plan-<timestamp>.json`.
2. **Approve.** Ask once with `AskUserQuestion`: apply all, apply only a rule group (for example screens only), or cancel. Items marked `?` (unclear state or role) are asked about individually or left out.
3. **Dry run.** Run [../scripts/rename-apply.js](../scripts/rename-apply.js) with `DRY_RUN = true`; it reports `applied` and `skipped` (node gone, name changed since the audit, instance) without writing.
4. **Apply.** Same script with `DRY_RUN = false`, batches of up to 200 nodes, one `use_figma` write at a time. Every item carries `from`, so a node renamed by someone else since the audit is skipped, not overwritten.
5. **Verify.** Rerun `audit-scan.js` on the touched frames and report before/after counts for `NAME-*`. Return every mutated node ID.
6. **Undo path.** The list of `{id, from, to}` is the undo log: to revert, run the script again with `from` and `to` swapped.

## Naming rules

Names are PascalCase roles a developer could use as an identifier. Read the node's type, content, parent and siblings (from `get_metadata` and a screenshot), then pick a name:

| Node | Name pattern | Examples |
|---|---|---|
| Screen root's main content stack | `ScreenRoot`, `Content` | |
| Top bar region | `Header`, `NavBar`, `TopBar` | |
| Bottom actions region | `Footer`, `BottomBar`, `ActionBar` | |
| Vertical stack of repeated instances | `<Item>List` | `WorkoutList`, `MessageList` |
| Horizontal stack of peers | `<Purpose>Row` | `StatsRow`, `ActionsRow` |
| Container with fill, radius and content | `<Purpose>Card` / `<Purpose>Container` | `SummaryCard`, `CardContainer` |
| Text | `<Purpose>Label` / `<Purpose>Text` from what it says | `PriceLabel`, `GreetingText`, `TitleLabel`, `ErrorMessage` |
| Number or metric | `<Metric>Value` | `CaloriesValue` |
| Image fill (rectangle or frame) | `<Purpose>Image` | `HeroImage`, `CoverImage` |
| Circle with image | `AvatarImage` | |
| Icon frame or vector 12–32 pt | `<Meaning>Icon` | `ChevronIcon`, `CloseIcon` |
| Thin line (≤ 1 pt tall or wide) | `Divider` | |
| Empty frame used as spacing | `Spacer` | |
| Background rectangle | `Background` | |

Rules:
- Use English role words even when the UI copy is in another language (`ЗберегтиКнопка` → `SaveButton`).
- Siblings with the same role get a qualifier, not a number: `PrimaryAction`, `SecondaryAction` rather than `Button1`, `Button2`. Repeated list items may share a name.
- Remove version words (`final`, `v2`, `new`, `copy`, `old`, `test`, `wip`) from the name; if that leaves the name ambiguous, ask.
- Screen frames: `ScreenName / State[ / Device]`. ScreenName from the navigation title or the main heading; State from the content: skeletons or spinners → `Loading`, an empty illustration with a call to action → `Empty`, an error message or banner → `Error`, a visible keyboard → `Keyboard`, otherwise `Default`. When unsure, put `?` in the plan and ask.
- Device suffix for device variants: `Home / Default / iPhone Duo Inner`.

## Script

[rename-apply.js](../scripts/rename-apply.js): set `PAGE_ID`, fill `RENAMES` with `{ id, from, to }` (add `allowInstance: true` only for approved instance renames), run with `DRY_RUN = true`, show the result, then run with `DRY_RUN = false` after approval.
