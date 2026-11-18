# Devices: Web viewports

| Device id | Frame | Breakpoint covered |
|---|---|---|
| `web-mobile` | 375 × 812 or 390 × 844 | < 640 |
| `web-tablet` | 768 × 1024 | md |
| `web-desktop` | 1280 × 800 and 1440 × 900 | lg / xl / 2xl |
| `web-reflow` | 320 wide | WCAG reflow check |

## Device-specific checks (`PLAT-06`)

- Every key screen exists at mobile, tablet and desktop, or the spec states which breakpoints are out of scope.
- Desktop: max content width set; line length of body text 45–90 characters; no single-column mobile layout stretched across 1440 px.
- Mobile web: no device chrome drawn inside the page frame (browser UI is not part of the design), but bottom-fixed elements leave room for the browser toolbar and the iOS home indicator (`env(safe-area-inset-bottom)` in code).
- Hover-only interactions have a tap and keyboard equivalent.
- 320 px: content reflows, nothing is cut, no horizontal scroll except data tables and code.
