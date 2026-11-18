const PAGE_ID = "__PAGE_ID__";
const RENAMES = [];
const DRY_RUN = true;

const page = await figma.getNodeByIdAsync(PAGE_ID);
await figma.setCurrentPageAsync(page);

const applied = [], skipped = [];
for (const r of RENAMES) {
  const node = await figma.getNodeByIdAsync(r.id);
  if (!node) { skipped.push({ id: r.id, reason: "not found" }); continue; }
  if (r.from !== undefined && node.name !== r.from) { skipped.push({ id: r.id, reason: "name changed since audit", now: node.name, expected: r.from }); continue; }
  if (node.type === "INSTANCE" && r.allowInstance !== true) { skipped.push({ id: r.id, reason: "instance name follows its component" }); continue; }
  if (node.removed) { skipped.push({ id: r.id, reason: "removed" }); continue; }
  if (!DRY_RUN) node.name = r.to;
  applied.push({ id: r.id, from: r.from === undefined ? null : r.from, to: r.to });
}

return { dryRun: DRY_RUN, mutatedNodeIds: DRY_RUN ? [] : applied.map(a => a.id), applied, skipped };
