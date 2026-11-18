# Design System Audit: variable bindings, tokens and libraries

Mode `ds`. A read-only audit of how a scope of a Figma file is wired to variables, token chains, modes and libraries. It answers: are bindings readable, are alias chains intact, do modes and types hold, which external libraries does the design depend on, which properties lack bindings, and which bindings look semantically wrong.

Never change the design, variables, modes, libraries or components. Do not import or create variables as a diagnostic. Do not switch the mode of any object to test it. Everything goes through [../scripts/ds-scan.js](../scripts/ds-scan.js).

Main principle: do not conclude "it works because it looks right", and do not conclude "it is broken because the library is external". Check the binding, the source identity, the chain, the mode and the result, and keep proven facts separate from assumptions.

## 1. Core rules

### Keep these situations apart

They are not equivalent:

1. A library is not in the agent's context.
2. A library is not connected to the current document.
3. An object uses an external variable.
4. The variable is readable and returns a value.
5. The original source is available for viewing and updates.
6. The binding is actually broken.

A library missing from the agent's context does not prove a broken dependency. An external origin is not an error by itself. A readable value does not prove that the original library is still reachable or that updates work.

### Do not infer the source from a name

`tailwind`, `Material`, `Brand`, `Legacy` and similar names are not evidence of origin. Check the variable ID and key, the collection ID and key, the `remote` flag, and the library metadata that is available. Equal names do not mean equal tokens; equal numbers do not mean equal purpose.

### Separate fact from assumption

Every finding carries: the observed fact, the expected rule (if one is known), the conclusion, a confidence level, and the limits of the check. Never call a variable deleted when all you know is that it could not be read. Never invent the name or source of an unreadable variable; keep its ID and the unreadable status.

## 2. Scope

1. Establish the current document and page.
2. Take the selection (or the `node-id` in the URL, or the page's top-level frames) as the starting scope.
3. If a component set is selected, include every variant.
4. Include nested frames, text, icons, component instances and **hidden objects**. Hidden objects are not excluded automatically: they can appear after a state, component property or mode change.
5. Do not widen the audit to the whole file without need. Follow external dependencies only as far as needed to explain bindings in the scope.

The script reports starting counters: root objects, variants, scanned objects, hidden objects scanned, text ranges, instances, and anything unreachable (`limits`).

## 3. Source of truth

To call something "wrongly bound" you first need a rule. Use, in order:

1. The user's explicit requirements.
2. Approved design-system documentation.
3. A confirmed list of allowed libraries, collections and tokens (pass collection keys in `ALLOWED_COLLECTION_KEYS`; required bindings in `REQUIRED_BINDINGS`).
4. Reference components and agreed variants.
5. Repeating patterns in the design, as indirect evidence only.

When no allowed source is defined: build a dependency inventory, mark deviations as suspicions, and never call a library wrong merely because it is external or unfamiliar. Never invent an expected token from the current value.

Ask the user once, before the scan, whether an approved library list or rule set exists; proceed without it if not.

## 4. Collect all bindings

Do not stop at numbers visible in the UI. For every object collect the bindings that are available.

| Group | Properties |
|---|---|
| Geometry and auto layout | width, height, min/max width and height, padding on all sides, item spacing, counter-axis spacing, corner radii |
| Appearance | fills, strokes, stroke widths, opacity, effect parameters, layout grid parameters |
| Text | font family, style/weight, size, line height, letter spacing, paragraph spacing, text color; **per styled range**, because one text node can mix tokens or have partially missing bindings |
| Other | visibility, supported component properties, nested structures that hold variable references |

For each usage keep: object ID, tree path, property, fill/stroke/effect index or text range, variable ID, current property value, visibility.

Mixed values are handled separately; a mixed value does not mean "no binding".

**Do not duplicate one issue.** The same binding can show up in an object's general binding list and inside a fill or text range. The script normalizes to the actual place of use and counts separately: unique variables, unique objects, unique bound properties, usage records. A technical record count is never presented as a problem count.

## 5. Check every found variable

For each unique ID:

1. Try to get the variable.
2. Distinguish: found / not found / read error.
3. If found, keep ID, key, name, type, `remote`, collection, values per mode.
4. Check the collection is accessible; keep its modes and default mode.
5. Cache by ID; read each variable once.

"Not found" is reported as `UNRESOLVED_VARIABLE` with medium confidence and the note that the library may be disconnected: it is not proven deleted. A read error is `INCOMPLETE_CHECK`.

## 6. Dependency graph

A direct binding can be fine while the next link is not:

```
button property → semantic token → theme token → base token → value
```

For each variable read every value recorded per mode, find references to other variables (including nested value structures), check each next variable, continue to a final value or an established problem. Detect: a missing next variable (`BROKEN_ALIAS_CHAIN`), an unreadable collection (`UNRESOLVED_COLLECTION`), incompatible types (`TYPE_MISMATCH`), cycles, and exceeding the depth guard (`INCOMPLETE_CHECK`, never "chain is fine").

**Cycles and modes.** Modes are part of the context. A repeated ID in a graph merged from all modes does not prove a real cycle in one scenario. The script reports `POTENTIAL_CYCLE` for a cycle in the merged graph and upgrades it to `CONFIRMED_CYCLE` only when resolving a variable of the cycle for a real object actually fails.

## 7. Evaluate values in the object's context

Keep three things apart: the recorded binding, the token value after the chain, and the object's current property value.

For each unique object + variable pair the script determines the effective collection mode (explicit mode of the object, inheritance from ancestors, collection default) and computes the value with `variable.resolveForConsumer(node)`. An empty explicit mode list is not an error; the mode may be inherited. Record: success, missing result, computation error, unexpected type.

Do not compare mechanically. Before comparing a property value with a resolved value, account for units, percent vs absolute, rounding, auto layout, min/max sizes and property specifics. A numeric difference alone is not proof of a defect.

**Inactive modes.** Everything can work in the current mode and fail in another theme. The script verifies that every recorded mode has a value and that every referenced variable exists, but it computes only the current effective context. Say so in the report: existence of all references is not the same as evaluating every mode combination. Do not switch modes on the original design to test.

## 8. Library provenance

For external dependencies establish, as far as available: the external collection (key, name), whether the file has access (via the team library listing), whether it matches the approved source, and what exactly could be verified.

Assess three origins separately: token origin, nested component origin, applied style origin. A component from one library can correctly use tokens from another; a local component can depend on external tokens; a local token can hide an external dependency further down its chain (`EXTERNAL_DEPENDENCY` via a local token). Never conclude about a whole object from one source. If the source cannot be confirmed use `SOURCE_UNVERIFIED`, not "library removed".

## 9. Properties without bindings

A missing binding does not prove it was unbound later. Possible reasons: the value was manual from the start, the binding was removed, it is an allowed exception, or a style or another mechanism drives it.

For each candidate: check there is no direct binding; check for an applied style; compare with the reference and sibling variants; establish whether an explicit rule requires a token. Classify as:

- confirmed rule violation (`MISSING_REQUIRED_BINDING`, only with a provided rule);
- probably missed binding (`SUSPECTED_MISSING_BINDING`: some sibling variants bind the property and this one does not);
- allowed manual value;
- not enough data.

Never write "was unbound before" without history or other evidence.

## 10. Wrong but working bindings

A token can resolve successfully and still be semantically wrong. Check: does the source match the approved library, does the token fit the property's purpose, is it consistent with the component's state and variant, is a token of another component used by accident, is a semantic token replaced by a primitive against the rules, is it an allowed exception.

Compare related variants under the same conditions: size, state, type, style, theme, icon presence. A difference between `default` and `hover`, or between text and icon-only buttons, is not automatically an error. Equal current values of two tokens do not make them interchangeable; they can diverge in another mode or later. Without a confirmed rule the finding is a semantic suspicion (`SUSPECTED_WRONG_TOKEN`, low confidence). The script compares variants that differ in exactly one non-state property.

## 11. Statuses

Confirmed technical problems:

| Status | Meaning |
|---|---|
| `UNRESOLVED_VARIABLE` | reference exists, variable not found (library may be disconnected) |
| `UNRESOLVED_COLLECTION` | collection not accessible |
| `BROKEN_ALIAS_CHAIN` | next link in the chain could not be resolved |
| `RESOLUTION_FAILED` | computation ended with an error |
| `TYPE_MISMATCH` | confirmed incompatibility of types (bound type vs property, or alias to another type) |
| `MODE_PROBLEM` | a mode has no recorded value, or mode selection is broken |
| `CONFIRMED_CYCLE` | cycle confirmed in a concrete context |

Violations of agreed rules (only with a rule from the user or the documentation):

| Status | Meaning |
|---|---|
| `WRONG_LIBRARY` | source contradicts the approved list |
| `WRONG_TOKEN` | token contradicts a confirmed rule |
| `MISSING_REQUIRED_BINDING` | a required binding is missing |

Risks and suspicions:

| Status | Meaning |
|---|---|
| `EXTERNAL_DEPENDENCY` | healthy external dependency (informational, not an error) |
| `SOURCE_UNVERIFIED` | state of the original source not confirmed |
| `SUSPECTED_MISSING_BINDING` | probably a missed binding |
| `SUSPECTED_WRONG_TOKEN` | semantically suspicious token |
| `POTENTIAL_CYCLE` | cycle only in the merged graph |
| `INCOMPLETE_CHECK` | the check was not completed (limits, read errors) |

Priority comes from impact and scale, not from the status name. The script labels P1 for broken reads and cycles, P2 for type, mode and rule violations, P3 for suspicions and incomplete checks, P4 for low-confidence token suspicions, P5 for informational dependencies.

## 12. Group by root cause

Do not create hundreds of identical messages for one unreadable token. For each root cause give: the problematic variable or source, the chain to the problem, the number of dependent objects, the number of properties, a few example usages, whether the problem is in the active mode, and whether it touches hidden content.

One variable used in width and height on 200 objects is one dependency, 200 dependent objects and 400 usages. Never mix these numbers; the report states all three.

## 13. Finding record

Per finding: status, priority, confidence, object and exact ID, property or text range, current property value, variable ID/key/name, collection and local/external origin, effective mode, chain, computed value or exact error, expected rule and its source, number of dependent objects, recommended next action, limits of the check. Do not invent a name or source for a variable that could not be read; keep the known ID and the unreadable status.

## 14. Report

Structure:

1. **Scope.** What was scanned; objects and variants covered.
2. **Confirmed problems.** Only findings with sufficient evidence.
3. **Suspicions and risks.** Separate from confirmed errors.
4. **External dependencies.** Which sources are used and what is known about their availability.
5. **Scale.** Unique direct tokens; all reachable tokens; problem root causes; dependent objects; usage records.
6. **Limits.** Sources, modes or parts of the design that could not be checked.
7. **Recommendations.** What needs rule confirmation, access to a source, manual verification, or a separately approved fix.

Save it as `reports/<file>-design-system-<YYYY-MM-DD-HHMM>.md`.

## 15. Done when

- The agreed scope was walked completely.
- Direct bindings were collected; reachable chains were explored.
- Values were evaluated in the current contexts; coverage of other modes is stated explicitly.
- External dependencies are separated from breakages.
- A missing binding was not presented as proven unbinding.
- A wrong token was not decided from a name or a value alone.
- Duplicates are grouped by root cause.
- Limits are documented.
- The design stayed unchanged.

## Script

[ds-scan.js](../scripts/ds-scan.js) (read-only, via `use_figma`). Constants: `PAGE_ID`, `TARGET_IDS` (subset of frames), `INCLUDE_HIDDEN` (default `true`), `ALLOWED_COLLECTION_KEYS` (approved library collection keys, empty = none provided), `REQUIRED_BINDINGS` (list of `{ nodeName: "regex", property: "itemSpacing" }`, empty = none), `CHECK_TEAM_LIBRARY` (default `true`), and the safety limits `MAX_NODES`, `MAX_RESOLVE_PAIRS`, `MAX_CHAIN_DEPTH`. When a limit trips, the output lists it under `limits` and the report states "check not completed" for that part. For large files run it per page or with `TARGET_IDS`; for several pages send one call per page in a single message.

It returns: `scope`, `scale` (the five numbers from §12), `resolution`, `modeCoverage`, `provenance` (collections with key, remote flag and modes; remote components and styles), `statusCounts`, and findings grouped by root cause under `confirmedProblems`, `suspicionsAndRisks` and `externalDependencies`.
