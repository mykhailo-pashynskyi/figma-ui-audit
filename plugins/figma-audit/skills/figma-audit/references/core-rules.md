# Core Rules (house standard)

These rules apply on every platform. They come from the team's design-delivery requirements, with gaps closed (marked **[added]**). Platform files add or override values; they never relax a core rule.

Each rule names the checklist IDs that verify it in [audit-checklist.md](audit-checklist.md).

## 1. Vocabulary

| Term | Meaning |
|---|---|
| Variable | A named value stored in Figma (color, number, string, boolean). Example: `color/bg/surface` = `#FFFFFF`. Lives in Local variables. |
| Style vs Variable | Styles are the older feature. Variables are required for colors, spacing, radii and stroke widths, because the export tools read Variables. Text Styles are fine for typography; their values should be bound to variables where possible. Shadows live in Effect Styles. |
| Mode | One column of values in a collection. Colors use `Light` and `Dark` when dark mode is in scope. Same variable name, different value per mode. |
| Auto Layout | A frame that arranges its children by direction, gap and padding, and grows or shrinks with content. Required everywhere content lives. |
| Component / Instance | A master element and its reused copies. Instances update when the master changes. |
| Variant | One version of a component, controlled by named properties, e.g. `size=sm/md/lg`, `state=default/pressed/disabled`. |
| Screen state | A version of a screen for a situation: Default, Loading, Empty, Error, Success, Keyboard open, Long content, Scrolled, Offline. |
| Interaction Matrix | A table of every tap, swipe and gesture, what it does and how it animates. The audit checks whether one exists (`HAND-01`). |
| Safe area | Screen regions not covered by system UI (status bar, Dynamic Island, home indicator, Android system bars, foldable camera and hinge). Content stays inside. |

## 2. File structure **[added — the source document had no §2]**

- Pages, in this order: `Design System` · `Components` · `Screens` · `Prototypes` · `Archive`. Extra pages are allowed after `Archive` only with a clear purpose name. → `FILE-01`, `FILE-02`
- Work in progress, explorations and old versions live in `Archive`, never on `Screens`. → `FILE-03`
- Each screen is a top-level frame on `Screens` (sections may group a flow). No loose layers on the canvas. → `FILE-04`
- A cover or a "Read me" frame on `Design System` states: platform, devices, dark mode in scope (yes/no), fonts, owner. → `FILE-05`

## 3. Variables: color, spacing, radius, stroke, motion

Every color, spacing value, corner radius and border width in the file comes from a Variable. No raw hex in fills or strokes. No arbitrary pixel values in gap or padding. → `VAR-01`…`VAR-12`

### Collections

| Collection | Contents | Example names |
|---|---|---|
| `color` | backgrounds, surfaces, text, borders, primary, secondary, semantic (success, warning, error, info) | `color/bg/surface`, `color/text/primary`, `color/border/subtle`, `color/primary/default`, `color/semantic/error` |
| `space` | spacing scale on a 4 pt base | `space/0`, `space/2`, `space/4`, `space/8`, `space/12`, `space/16`, `space/20`, `space/24`, `space/32`, `space/40`, `space/48`, `space/64` |
| `radius` | corner radii | `radius/none`, `radius/sm`, `radius/md`, `radius/lg`, `radius/full` |
| `stroke` **[added]** | border widths | `stroke/hairline` = 0.5 or 1, `stroke/default` = 1, `stroke/strong` = 2 |
| `motion` | durations in ms and the easing note | `motion/fast` = 150, `motion/normal` = 250, `motion/slow` = 400, `motion/easing` (string) = `ease-out` |
| `size` **[added]** | icon sizes, icon stroke, fixed control heights | `size/icon/sm` = 16, `size/icon/md` = 20, `size/icon/lg` = 24, `size/icon/stroke` = 1.5, `size/control/md` = 44 |
| `opacity`, `blur` **[added, if used]** | named opacity and blur values | `opacity/disabled` = 0.4, `blur/overlay` = 20 |
| `type` **[added, optional]** | font family, size, line height values that Text Styles bind to | `type/size/body` = 17 |

Spacing scale clarification **[added]**: the scale is built on 4. Allowed values are multiples of 4, plus `2` for hairline gaps. `12` and `20` are on the scale; `10`, `14`, `15`, `18`, `22` are not. A project may define a stricter 8 pt scale in the cover frame; the audit then reads it from the `space` collection.

### Primitives and semantic tier **[added]**

When the file has a primitive palette (`palette/blue/500`), UI nodes bind to the semantic tier (`color/primary/default`), which aliases the primitive. Binding UI directly to a primitive is a defect (`VAR-06`), because dark mode and rebranding then require touching every screen.

### Dark mode

Dark mode is a second mode on the `color` collection. Never separate `dark/...` variables, never duplicate styles. → `VAR-07`, `VAR-08`

### Effects

Shadows as Effect Styles: `shadow/sm`, `shadow/md`, `shadow/lg`. Their colors bind to `color` variables. → `VAR-10`

### Naming

Lowercase, groups separated by `/`, no spaces, no emoji, no punctuation other than `-` inside a segment. Numbers allowed. → `VAR-09`

| Correct | Incorrect |
|---|---|
| `color/bg/surface` | `Blue 2` |
| `color/text/primary` | `Final color!!` |
| `space/16` | `padding (big)` |
| `radius/md` | `Corner — New v3` |

Regex for a valid variable name: `^[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*$`

### Scopes and code syntax **[added]**

- Each variable has explicit scopes, not `ALL_SCOPES`: color backgrounds `FRAME_FILL`, `SHAPE_FILL`; text colors `TEXT_FILL`; borders `STROKE_COLOR`; spacing `GAP`; radius `CORNER_RADIUS`; stroke `STROKE_FLOAT`; opacity `OPACITY`. → `VAR-11`
- When a stack is set, each variable has `codeSyntax` for that platform (`WEB`, `ANDROID`, `iOS`) in the stack's naming convention. → `CODE-01`

**Check yourself:** click any filled shape. The Fill row shows a variable pill, not hex. Click any gap or padding: same rule. Any raw value is a defect.

## 4. Typography

Every text layer uses a named Text Style. No detached text with hand-set size or weight. → `TYPE-01`…`TYPE-08`

Names describe the role, not the font:

| Correct | Incorrect |
|---|---|
| `Display`, `Title 1`, `Title 2`, `Body`, `Caption`, `Label` | `Roboto Bold Big`, `text style 4`, `Heading final` |

Platform files give the native role set (iOS Dynamic Type names, Material 3 type roles). Using the native names is recommended so the mapping to code is one-to-one.

Each style defines family, size, weight, line height and letter spacing. Line height is a fixed value or percent, not `Auto`, so code gets a number. **[added]**

Fonts:
- List every family and weight used. → `TYPE-05`
- Provide `.ttf`/`.otf` files or confirm the font is on Google Fonts. → `HAND-03` (manual)
- Confirm the license allows embedding in a mobile app (or web-font use for web). A font that cannot be shipped blocks the project. → `HAND-03` (manual)
- System fonts (SF Pro on iOS, Roboto / Google Sans on Android) do not need files; never embed SF in an app.

**Check yourself:** click any text. The right panel shows a style name, not editable raw values.

## 5. Components and Variants

Anything that appears more than once is a Component, and each appearance is an Instance: buttons, inputs, cards, list rows, tab bars, headers, badges, avatars, switches, toasts, modals. → `COMP-01`…`COMP-09`

Each component has a variant for every state it can be in: Default, Pressed, Disabled, Loading, Error, Selected (plus Focus and Hover on web). → `COMP-05`

Property names are clean and lowercase:

| Correct | Incorrect |
|---|---|
| `size=sm / md / lg` | `Property 1=Variant 2` |
| `state=default / pressed / disabled` | `Type=Final`, `New=Yes` |

Component names follow `Category/Name/Detail`: `Button/Primary/Large`, `Input/Text/Error`, `Card/Workout/Default`. → `COMP-06`

Prefer component properties over variant explosion **[added]**: a text label is a TEXT property; an optional icon is a BOOLEAN plus INSTANCE_SWAP; only real anatomy or state changes are variants. → `COMP-08`

**Check yourself:** click any button or card on a screen. The layers panel shows the instance icon (◆). A plain frame that looks like the component is a copy that will drift. Never detach to make a quick local change; add a variant.

## 6. Auto Layout (the most important rule)

Every frame with content uses Auto Layout. Elements are never placed by dragging to a pixel position inside a plain frame. → `LAY-01`…`LAY-10`

Why: real screens are stacks that grow, shrink and reflow with content and screen size. Auto Layout is Figma's version of that, and it decides whether the design converts to code correctly.

How: select elements → Shift + A. Set direction, gap and padding from `space` variables. Set each child to Fill container or Hug contents deliberately.

Two tests every screen passes:
1. **Stretch test.** Make the screen frame wider and taller. Content reflows sensibly; nothing overlaps; nothing stays glued to a corner without reason.
2. **Long-text test.** Triple the length of a title. The card grows; text does not spill over other elements.

```
✓ CORRECT                                  ✗ INCORRECT
Home / Default                             Home final v3
└─ ScreenRoot (auto layout ↓, gap 16)      └─ Group 847
   ├─ Header (auto layout →)                  ├─ Rectangle 12
   │  ├─ AvatarImage                          ├─ Rectangle 13
   │  └─ GreetingText                         ├─ ellipse 4 copy
   ├─ StatsRow (auto layout →, gap 12)        ├─ Frame 1268
   │  ├─ ◆ Card/Stat  (instance)              ├─ Group 5 Copy 2
   │  └─ ◆ Card/Stat  (instance)              └─ image 7
   └─ WorkoutList (auto layout ↓, gap 8)
      ├─ ◆ Row/Workout (instance)
      └─ ◆ Row/Workout (instance)
```

Allowed exception: overlapping decorative artwork (an illustration behind text). Use absolute position there only, and mark it with a note or annotation saying it is intentional (`intentional: decor`). → `LAY-03`

Also required: never flatten groups that contain UI structure; never outline text. → `LAY-07`, `TYPE-07`

Text boxes **[added]**: text that can grow uses `Auto height` (fixed width, growing height) or `Auto width`; never a fixed box that clips. Truncation is allowed only when set deliberately (`Truncate text`) and noted. → `LAY-08`

## 7. Layer and frame naming

Rename layers while working (double-click, or Cmd/Ctrl + R to batch-rename). → `NAME-01`…`NAME-06`

| Correct | Incorrect |
|---|---|
| `CardContainer`, `PriceLabel`, `AvatarImage` | `Frame 1268`, `Group 5 Copy 2`, `Rectangle 12` |

- Layer names are PascalCase role names (`PriceLabel`, `HeaderBar`), usable as code identifiers. **[added: casing]**
- Screen frames follow `ScreenName / State`: `Home / Default`, `Home / Loading`, `Home / Empty`, `Profile / Edit / Error`.
- Device variants of a screen add the device after the state: `Home / Default / iPhone Duo Inner`. **[added]**
- No version words in names: `final`, `v2`, `new`, `copy`, `old`, `test`. **[added]** → `NAME-05`

**Check yourself:** open the layers panel on any screen. Default names (`Frame 1268`) are renamed before delivery.

## 8. Screens and states

- Screen frames at the project's base size (house default 390 × 844 for iPhone; the device file lists current sizes). For the 2–3 most content-heavy screens, add one extra frame at a larger and a smaller size showing how the layout adapts (iOS: 440 × 956 or 430 × 932, and 375 × 667). → `STATE-01`, `PLAT-02`
- Every screen that shows data has every applicable state, each as its own frame: → `STATE-02`…`STATE-06`

| State | What it shows |
|---|---|
| Default | Normal screen with realistic content |
| Loading | What the user sees while data loads; say skeleton or spinner |
| Empty | No data yet, with real, helpful words (never Lorem ipsum) |
| Error | Something failed: message plus what the user can do |
| Success | Confirmation, where relevant |
| Keyboard open | Every screen with text input: what the keyboard covers and how the screen adjusts |
| Long content | Stress version: long titles, big numbers, maximum data |
| Scrolled | Screens that overflow: mid-scroll, what stays pinned, what moves |
| Offline | Where it matters: what the user sees with no connection |

- Show the system chrome on every screen (status bar, Dynamic Island, home indicator, or the platform equivalent) and keep content out of those zones. → `PLAT-03`
- If it is not obvious what stretches, stays fixed or scrolls when the screen gets taller or content grows, add a short note (annotation) on the frame. → `HAND-04`
- No placeholder text: `Lorem ipsum`, `Text`, `Title`, `Label`, `Button` as visible copy. **[added]** → `STATE-07`

**Check yourself:** pick any screen with data and count its frames. One frame means incomplete.

## 9. Accessibility and interactive states **[added]**

Full guide: [accessibility.md](accessibility.md); state matrix: [component-states.md](component-states.md).

- Target: WCAG 2.2 AA on every platform, plus the platform's stricter rules (iOS 44 × 44 pt, Android 48 × 48 dp).
- Contrast passes in **every** color mode: text 4.5:1 (large text 3:1); icons, input borders, selection indicators and focus rings 3:1. → `A11Y-02`, `A11Y-03`, `A11Y-11`…`A11Y-13`
- Every interactive component (buttons, inputs, switches, checkboxes, radios, tabs, chips, links, sliders, tappable rows) has variants for all its states: default, pressed, disabled, focus, plus hover on web, error/filled for inputs, selected values for toggles. Each non-default state looks visibly different. → `COMP-05`, `COMP-10`, `A11Y-09`
- State colors are Variables named for the state (`color/border/focus`, `color/action/primary/pressed`, `color/text/disabled`). → `VAR-15a`, `VAR-15b`
- Focus ring is a token-based system: `color/focus/ring`, `color/focus/ring-offset`, `stroke/focus` (2), `space/focus-offset` (2), Effect Style `focus/ring`. Missing pieces are reported by `VAR-15c`.
- Meaning never by color alone; inputs have visible labels; icon-only buttons have a label in the description or an annotation. → `A11Y-04`, `A11Y-06`, `A11Y-15`

## 10. Motion and interaction **[added: links the Interaction Matrix to the checks]**

- Every prototype transition and every animated state change uses a `motion` duration (150/250/400) and the declared easing. → `HAND-02`
- Every gesture in the app appears in the Interaction Matrix with trigger, result, animation, duration and easing. → `HAND-01`
- Reduce Motion behavior is stated for any animation longer than `motion/normal` or any parallax, zoom or auto-play. → `A11Y-07`
