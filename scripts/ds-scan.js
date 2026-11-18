const PAGE_ID = "__PAGE_ID__";
const TARGET_IDS = [];
const INCLUDE_HIDDEN = true;
const ALLOWED_COLLECTION_KEYS = [];
const REQUIRED_BINDINGS = [];
const CHECK_TEAM_LIBRARY = true;
const MAX_NODES = 20000;
const MAX_RESOLVE_PAIRS = 4000;
const MAX_CHAIN_DEPTH = 30;
const MAX_LOOKUPS = 400;
const SAMPLE = 5;

const page = await figma.getNodeByIdAsync(PAGE_ID);
await figma.setCurrentPageAsync(page);

const limits = [];
const PRIMITIVE = /(^|\/)(palette|primitive|primitives|core|ref|base)(\/|$)|primitive|palette|reference/i;
const STATE_AXES = /^(state|status|interaction)$/i;

const usages = [];
const counters = { roots: 0, variantComponents: 0, nodesScanned: 0, hiddenNodesScanned: 0, textSegments: 0, instances: 0 };
const nodeInfo = new Map();
const styleStats = { checked: 0, remote: 0, local: 0, unreadable: 0, samples: [] };
const componentStats = { checked: 0, remote: 0, local: 0, missing: 0, samples: [] };

function isHidden(n) {
  for (let p = n; p && p.type !== "PAGE"; p = p.parent) if (p.visible === false) return true;
  return false;
}
function alias(v) {
  if (!v) return null;
  if (Array.isArray(v)) return v.length ? v[0] : null;
  return v.type === "VARIABLE_ALIAS" ? v : null;
}
function record(node, path, prop, where, a, extra) {
  if (!a || !a.id) return;
  const hidden = isHidden(node);
  usages.push({ nodeId: node.id, nodeName: node.name, path, prop, where: where || null, varId: a.id, hidden, nodeType: node.type, current: extra === undefined ? null : extra });
}
function fmtPaint(p) {
  if (!p) return null;
  if (p.type !== "SOLID") return p.type;
  const h = x => Math.round(x * 255).toString(16).padStart(2, "0");
  return "#" + h(p.color.r) + h(p.color.g) + h(p.color.b);
}

const PLAIN_SKIP = new Set(["fills", "strokes", "effects", "layoutGrids", "componentProperties", "textRangeFills"]);
const TEXT_FIELDS = new Set(["fontFamily", "fontSize", "fontStyle", "fontWeight", "letterSpacing", "lineHeight", "paragraphSpacing", "paragraphIndent"]);

async function collectNode(node, path) {
  counters.nodesScanned++;
  if (isHidden(node)) counters.hiddenNodesScanned++;
  const bv = node.boundVariables || {};
  const isText = node.type === "TEXT";
  for (const k of Object.keys(bv)) {
    if (PLAIN_SKIP.has(k)) continue;
    if (isText && TEXT_FIELDS.has(k)) continue;
    const a = alias(bv[k]);
    if (a) record(node, path, k, null, a, typeof node[k] === "number" || typeof node[k] === "boolean" || typeof node[k] === "string" ? node[k] : null);
  }
  for (const prop of ["fills", "strokes"]) {
    if (!(prop in node) || node[prop] === figma.mixed) continue;
    node[prop].forEach((p, i) => {
      const a = p.boundVariables && alias(p.boundVariables.color);
      if (a) record(node, path, prop + "[" + i + "].color", { index: i }, a, fmtPaint(p));
    });
  }
  if ("effects" in node) node.effects.forEach((e, i) => {
    const b = e.boundVariables || {};
    for (const k of Object.keys(b)) { const a = alias(b[k]); if (a) record(node, path, "effects[" + i + "]." + k, { index: i }, a, null); }
  });
  if ("layoutGrids" in node && Array.isArray(node.layoutGrids)) node.layoutGrids.forEach((g, i) => {
    const b = g.boundVariables || {};
    for (const k of Object.keys(b)) { const a = alias(b[k]); if (a) record(node, path, "layoutGrids[" + i + "]." + k, { index: i }, a, null); }
  });
  if (bv.componentProperties) for (const name of Object.keys(bv.componentProperties)) record(node, path, "componentProperties." + name, null, alias(bv.componentProperties[name]), null);
  if (isText) {
    let segs = [];
    try { segs = node.getStyledTextSegments(["boundVariables", "fills", "textStyleId"]); } catch (e) { limits.push("text segments unreadable on " + node.id + ": " + e.message); }
    counters.textSegments += segs.length;
    for (const s of segs) {
      const range = { start: s.start, end: s.end };
      const b = s.boundVariables || {};
      for (const k of Object.keys(b)) { const a = alias(b[k]); if (a) record(node, path, "text." + k, range, a, null); }
      (s.fills || []).forEach((p, i) => {
        const a = p.boundVariables && alias(p.boundVariables.color);
        if (a) record(node, path, "text.fills[" + i + "].color", range, a, fmtPaint(p));
      });
    }
  }
  if (node.type === "INSTANCE" && componentStats.checked < MAX_LOOKUPS) {
    counters.instances++;
    componentStats.checked++;
    try {
      const mc = await node.getMainComponentAsync();
      if (!mc) { componentStats.missing++; if (componentStats.samples.length < SAMPLE) componentStats.samples.push({ id: node.id, name: node.name, note: "main component not readable" }); }
      else if (mc.remote) { componentStats.remote++; if (componentStats.samples.length < SAMPLE) componentStats.samples.push({ id: node.id, name: node.name, component: mc.name, remote: true }); }
      else componentStats.local++;
    } catch (e) { componentStats.missing++; }
  }
  for (const f of ["fillStyleId", "strokeStyleId", "textStyleId", "effectStyleId"]) {
    const id = node[f];
    if (typeof id === "string" && id !== "" && styleStats.checked < MAX_LOOKUPS) {
      styleStats.checked++;
      try {
        const st = await figma.getStyleByIdAsync(id);
        if (!st) styleStats.unreadable++;
        else if (st.remote) { styleStats.remote++; if (styleStats.samples.length < SAMPLE) styleStats.samples.push({ node: node.id, style: st.name, kind: f }); }
        else styleStats.local++;
      } catch (e) { styleStats.unreadable++; }
    }
  }
}

let roots = [];
if (TARGET_IDS.length) { for (const id of TARGET_IDS) { const n = await figma.getNodeByIdAsync(id); if (n) roots.push(n); } }
else roots = page.children.slice();
counters.roots = roots.length;

const variantMap = new Map();
const stack = roots.map(n => ({ node: n, path: n.name, setId: null, rel: "" }));
while (stack.length) {
  const { node, path, setId, rel } = stack.pop();
  if (counters.nodesScanned >= MAX_NODES) { limits.push("node limit " + MAX_NODES + " reached; scan incomplete"); break; }
  if (!INCLUDE_HIDDEN && node.visible === false) continue;
  nodeInfo.set(node.id, { path, setId, rel });
  await collectNode(node, path);
  if (node.type === "COMPONENT" && node.parent && node.parent.type === "COMPONENT_SET") counters.variantComponents++;
  if ("children" in node && node.type !== "INSTANCE") {
    const isSet = node.type === "COMPONENT_SET";
    const nextSet = isSet ? node.id : (node.type === "COMPONENT" && node.parent && node.parent.type === "COMPONENT_SET" ? setId : setId);
    for (const c of node.children) {
      const childSet = isSet ? node.id : nextSet;
      const crel = c.parent && c.parent.type === "COMPONENT_SET" ? "" : rel + "/" + c.name;
      stack.push({ node: c, path: path + " › " + c.name, setId: childSet, rel: crel });
    }
  }
}

const uniqueVarIds = [...new Set(usages.map(u => u.varId))];
const vars = new Map();
const colls = new Map();
async function getVar(id) {
  if (vars.has(id)) return vars.get(id);
  let rec;
  try {
    const v = await figma.variables.getVariableByIdAsync(id);
    rec = v ? { status: "found", v } : { status: "notfound" };
  } catch (e) { rec = { status: "error", error: String(e && e.message || e) }; }
  vars.set(id, rec);
  return rec;
}
async function getColl(id) {
  if (colls.has(id)) return colls.get(id);
  let rec;
  try {
    const c = await figma.variables.getVariableCollectionByIdAsync(id);
    rec = c ? { status: "found", c } : { status: "notfound" };
  } catch (e) { rec = { status: "error", error: String(e && e.message || e) }; }
  colls.set(id, rec);
  return rec;
}

const reachable = new Set();
const reachFrom = new Map();
const edges = new Map();
const chainIssues = [];
let chainTruncated = false;
async function walk(rootId) {
  const q = [{ id: rootId, depth: 0, via: [rootId] }];
  const seen = new Set();
  while (q.length) {
    const { id, depth, via } = q.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    reachable.add(id);
    reachFrom.set(rootId, seen);
    if (depth > MAX_CHAIN_DEPTH) { chainTruncated = true; chainIssues.push({ status: "INCOMPLETE_CHECK", rootVar: rootId, at: id, via, note: "alias depth limit " + MAX_CHAIN_DEPTH }); continue; }
    const r = await getVar(id);
    if (r.status !== "found") {
      if (id !== rootId) chainIssues.push({ status: r.status === "notfound" ? "BROKEN_ALIAS_CHAIN" : "INCOMPLETE_CHECK", rootVar: rootId, at: id, via, note: r.status === "notfound" ? "next variable in the chain was not found" : r.error });
      continue;
    }
    const v = r.v;
    const cr = await getColl(v.variableCollectionId);
    if (cr.status !== "found") chainIssues.push({ status: cr.status === "notfound" ? "UNRESOLVED_COLLECTION" : "INCOMPLETE_CHECK", rootVar: rootId, at: id, via, note: cr.status === "notfound" ? "collection not readable" : cr.error });
    const modeIds = cr.status === "found" ? cr.c.modes.map(m => m.modeId) : Object.keys(v.valuesByMode);
    if (cr.status === "found") for (const m of cr.c.modes) if (v.valuesByMode[m.modeId] === undefined) chainIssues.push({ status: "MODE_PROBLEM", rootVar: rootId, at: id, via, note: "no value recorded for mode '" + m.name + "'" });
    for (const mid of modeIds) {
      const val = v.valuesByMode[mid];
      if (val && typeof val === "object" && val.type === "VARIABLE_ALIAS") {
        if (!edges.has(id)) edges.set(id, new Set());
        edges.get(id).add(val.id);
        const t = await getVar(val.id);
        if (t.status === "found" && t.v.resolvedType !== v.resolvedType) chainIssues.push({ status: "TYPE_MISMATCH", rootVar: rootId, at: id, via, note: v.resolvedType + " aliases " + t.v.resolvedType + " (" + t.v.name + ")" });
        q.push({ id: val.id, depth: depth + 1, via: via.concat(val.id) });
      }
    }
  }
}
for (const id of uniqueVarIds) await walk(id);

const cycleVars = new Set();
{
  const color = new Map();
  const dfs = (id, pathSet) => {
    color.set(id, 1);
    for (const nx of edges.get(id) || []) {
      if (color.get(nx) === 1) { cycleVars.add(nx); pathSet.forEach(x => cycleVars.add(x)); }
      else if (!color.has(nx)) dfs(nx, pathSet.concat(nx));
    }
    color.set(id, 2);
  };
  for (const id of edges.keys()) if (!color.has(id)) dfs(id, [id]);
}

const EXPECT_TYPE = (prop) => /color/.test(prop) ? "COLOR" : /fontFamily|fontStyle/.test(prop) ? "STRING" : /^visible$/.test(prop) ? "BOOLEAN" : /^characters$/.test(prop) ? "STRING" : "FLOAT";
const pairKey = (u) => u.nodeId + "|" + u.varId;
const resolvedPairs = new Map();
const modeHistogram = {};
const resolveFailures = [];
let resolveSkipped = 0;
let resolveOk = 0;
const nodeCache = new Map();
for (const u of usages) {
  const k = pairKey(u);
  if (resolvedPairs.has(k)) continue;
  const vr = await getVar(u.varId);
  if (vr.status !== "found") { resolvedPairs.set(k, { skipped: "variable unreadable" }); continue; }
  if (resolvedPairs.size >= MAX_RESOLVE_PAIRS) { resolveSkipped++; continue; }
  let node = nodeCache.get(u.nodeId);
  if (!node) { node = await figma.getNodeByIdAsync(u.nodeId); nodeCache.set(u.nodeId, node); }
  const cr = await getColl(vr.v.variableCollectionId);
  const effModeId = node && node.resolvedVariableModes && cr.status === "found" ? (node.resolvedVariableModes[cr.c.id] || cr.c.defaultModeId) : null;
  const explicit = !!(node && node.explicitVariableModes && cr.status === "found" && node.explicitVariableModes[cr.c.id]);
  const effMode = cr.status === "found" && effModeId ? (cr.c.modes.find(m => m.modeId === effModeId) || { name: "unknown" }).name : "unknown";
  const hk = (cr.status === "found" ? cr.c.name : "?") + " → " + effMode + (explicit ? " (explicit)" : " (inherited/default)");
  modeHistogram[hk] = (modeHistogram[hk] || 0) + 1;
  try {
    const out = vr.v.resolveForConsumer(node);
    const want = EXPECT_TYPE(u.prop);
    const mismatch = out.resolvedType !== want && !(want === "FLOAT" && out.resolvedType === "FLOAT");
    resolvedPairs.set(k, { ok: true, value: out.value, type: out.resolvedType, mismatch: mismatch ? "bound " + out.resolvedType + " to a " + want + " property (" + u.prop + ")" : null, mode: effMode });
    resolveOk++;
  } catch (e) {
    resolvedPairs.set(k, { ok: false, error: String(e && e.message || e), mode: effMode });
    resolveFailures.push(k);
  }
}
if (resolveSkipped) limits.push("effective-value resolution capped at " + MAX_RESOLVE_PAIRS + " object+variable pairs; " + resolveSkipped + " not evaluated");

const findings = new Map();
function addFinding(status, rootKey, base, usage) {
  const key = status + "|" + rootKey;
  let f = findings.get(key);
  if (!f) { f = Object.assign({ status, rootKey, nodes: new Set(), props: new Set(), usageCount: 0, hiddenUsages: 0, visibleUsages: 0, samples: [] }, base); findings.set(key, f); }
  if (usage) {
    f.nodes.add(usage.nodeId);
    f.props.add(usage.nodeId + "|" + usage.prop);
    f.usageCount++;
    if (usage.hidden) f.hiddenUsages++; else f.visibleUsages++;
    if (f.samples.length < SAMPLE) f.samples.push({ nodeId: usage.nodeId, name: usage.nodeName, path: usage.path, property: usage.prop, range: usage.where, currentValue: usage.current, hidden: usage.hidden });
  }
  return f;
}
const usagesByVar = new Map();
for (const u of usages) { if (!usagesByVar.has(u.varId)) usagesByVar.set(u.varId, []); usagesByVar.get(u.varId).push(u); }

for (const [id, list] of usagesByVar) {
  const r = await getVar(id);
  if (r.status === "notfound") for (const u of list) addFinding("UNRESOLVED_VARIABLE", id, { varId: id, confidence: "medium", observed: "getVariableByIdAsync returned null for a bound variable", conclusion: "variable not readable in this file; its library may be disconnected or the variable deleted — not proven deleted", nextAction: "check that the owning library is enabled for this file, then rerun" }, u);
  else if (r.status === "error") for (const u of list) addFinding("INCOMPLETE_CHECK", "read:" + id, { varId: id, confidence: "low", observed: "read error: " + r.error, conclusion: "variable could not be read", nextAction: "retry" }, u);
}

function dependentsOf(ids) {
  const set = new Set(ids);
  const out = [];
  for (const [root, seen] of reachFrom) {
    let hit = false;
    for (const x of set) if (seen.has(x)) { hit = true; break; }
    if (hit) for (const u of usagesByVar.get(root) || []) out.push(u);
  }
  return out;
}
const grouped = new Map();
for (const ci of chainIssues) {
  const key = ci.status + "|" + ci.at + "|" + ci.note;
  if (!grouped.has(key)) grouped.set(key, Object.assign({ roots: new Set() }, ci));
  grouped.get(key).roots.add(ci.rootVar);
}
for (const ci of grouped.values()) {
  const vr = await getVar(ci.at);
  const base = { varId: ci.at, chainExample: ci.via, confidence: ci.status === "INCOMPLETE_CHECK" ? "low" : "high", observed: ci.note, conclusion: ci.status === "BROKEN_ALIAS_CHAIN" ? "a token in the chain points to a variable that cannot be read" : ci.status === "MODE_PROBLEM" ? "a mode of this variable has no value" : ci.note, nextAction: ci.status === "MODE_PROBLEM" ? "add a value for the missing mode" : "restore the owning library or repoint the alias" };
  if (vr.status === "found") base.varName = vr.v.name;
  const deps = dependentsOf([ci.at]);
  const rk = ci.status + ":" + ci.at + ":" + ci.note;
  if (!deps.length) addFinding(ci.status, rk, base, null);
  for (const u of deps) addFinding(ci.status, rk, base, u);
}

const cycleGroups = [];
{
  const left = new Set(cycleVars);
  while (left.size) {
    const first = left.values().next().value;
    const comp = new Set([first]);
    const q = [first];
    while (q.length) {
      const cur = q.shift();
      for (const nx of edges.get(cur) || []) if (left.has(nx) && !comp.has(nx)) { comp.add(nx); q.push(nx); }
      for (const [from, tos] of edges) if (tos.has(cur) && left.has(from) && !comp.has(from)) { comp.add(from); q.push(from); }
    }
    for (const x of comp) left.delete(x);
    cycleGroups.push([...comp]);
  }
}
for (const group of cycleGroups) {
  const deps = dependentsOf(group);
  let confirmed = false;
  for (const u of deps) { const p = resolvedPairs.get(pairKey(u)); if (p && p.ok === false) confirmed = true; }
  const status = confirmed ? "CONFIRMED_CYCLE" : "POTENTIAL_CYCLE";
  const names = [];
  for (const id of group) { const r = await getVar(id); if (r.status === "found") names.push(r.v.name); }
  const base = { varId: group[0], cycleMembers: names, confidence: confirmed ? "high" : "medium", observed: "alias graph (all modes merged) contains a cycle: " + names.join(" ↔ "), conclusion: confirmed ? "resolving a variable of the cycle for a real consumer failed" : "cycle exists only when all modes are merged; it may not occur in any single mode scenario", nextAction: "inspect aliases per mode" };
  const rk = "cycle:" + group.slice().sort().join(",");
  if (!deps.length) addFinding(status, rk, base, null);
  for (const u of deps) addFinding(status, rk, base, u);
}

for (const u of usages) {
  const p = resolvedPairs.get(pairKey(u));
  if (!p || p.skipped) continue;
  if (p.ok === false) addFinding("RESOLUTION_FAILED", u.varId + ":" + p.error, { varId: u.varId, confidence: "high", observed: p.error, conclusion: "the value could not be computed for the object's context", nextAction: "check the chain and the mode used by the object" }, u);
  else if (p.mismatch) addFinding("TYPE_MISMATCH", u.varId + ":" + u.prop.replace(/\[\d+\]/g, ""), { varId: u.varId, confidence: "high", observed: p.mismatch, conclusion: "binding type does not fit the property", nextAction: "rebind to a variable of the right type" }, u);
}

const provenance = new Map();
const hiddenExternal = new Map();
for (const id of reachable) {
  const r = await getVar(id);
  if (r.status !== "found") continue;
  const v = r.v;
  const cr = await getColl(v.variableCollectionId);
  const ckey = cr.status === "found" ? cr.c.key : "unreadable:" + v.variableCollectionId;
  if (!provenance.has(ckey)) provenance.set(ckey, { collectionKey: cr.status === "found" ? cr.c.key : null, collectionId: v.variableCollectionId, collectionName: cr.status === "found" ? cr.c.name : null, remote: cr.status === "found" ? cr.c.remote : null, variableRemote: v.remote, variables: 0, direct: 0, modes: cr.status === "found" ? cr.c.modes.map(m => m.name) : [], defaultMode: cr.status === "found" ? (cr.c.modes.find(m => m.modeId === cr.c.defaultModeId) || {}).name : null });
  const pv = provenance.get(ckey);
  pv.variables++;
  if (usagesByVar.has(id)) pv.direct++;
}
for (const [id, list] of usagesByVar) {
  const r = await getVar(id);
  if (r.status !== "found") continue;
  if (r.v.remote) {
    const cr = await getColl(r.v.variableCollectionId);
    for (const u of list) addFinding("EXTERNAL_DEPENDENCY", "var:" + (cr.status === "found" ? cr.c.key : r.v.variableCollectionId), { collectionName: cr.status === "found" ? cr.c.name : null, collectionKey: cr.status === "found" ? cr.c.key : null, confidence: "high", observed: "variable is remote (comes from a library)", conclusion: "informational: an external dependency is not an error by itself", nextAction: "none unless the library is not on the approved list" }, u);
  } else {
    const via = [];
    const q = [id], seen = new Set();
    while (q.length) {
      const cur = q.shift();
      if (seen.has(cur)) continue;
      seen.add(cur);
      for (const nx of edges.get(cur) || []) {
        const t = await getVar(nx);
        if (t.status === "found" && t.v.remote) via.push(t.v.name);
        q.push(nx);
      }
    }
    if (via.length) for (const u of list) addFinding("EXTERNAL_DEPENDENCY", "indirect:" + id, { varId: id, confidence: "high", observed: "local token reaches remote variable(s): " + [...new Set(via)].slice(0, 3).join(", "), conclusion: "a local token hides an external dependency further down the chain", nextAction: "none unless the library is not on the approved list" }, u);
  }
}

let teamLibrary = { checked: false };
if (CHECK_TEAM_LIBRARY && figma.teamLibrary) {
  try {
    const libs = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
    teamLibrary = { checked: true, availableCollections: libs.length, keys: libs.map(l => l.key) };
  } catch (e) { teamLibrary = { checked: false, error: String(e && e.message || e) }; limits.push("team library list unavailable: " + String(e && e.message || e)); }
}
for (const pv of provenance.values()) {
  if (!pv.remote) continue;
  const approved = ALLOWED_COLLECTION_KEYS.length > 0;
  if (approved && !ALLOWED_COLLECTION_KEYS.includes(pv.collectionKey)) {
    addFinding("WRONG_LIBRARY", "coll:" + pv.collectionKey, { collectionName: pv.collectionName, collectionKey: pv.collectionKey, confidence: "high", observed: "remote collection key is not on the approved list", conclusion: "source contradicts the approved list the user provided", nextAction: "repoint to an approved collection or extend the list" }, null);
  }
  if (teamLibrary.checked) {
    if (!teamLibrary.keys.includes(pv.collectionKey)) addFinding("SOURCE_UNVERIFIED", "coll:" + pv.collectionKey, { collectionName: pv.collectionName, collectionKey: pv.collectionKey, confidence: "medium", observed: "collection is not in the team library list this plugin context can see", conclusion: "the original source is not confirmed (library may be disabled, unpublished, or outside this account's access); not proven removed", nextAction: "open Assets → Libraries and confirm the library is enabled" }, null);
  } else addFinding("SOURCE_UNVERIFIED", "coll:" + pv.collectionKey, { collectionName: pv.collectionName, collectionKey: pv.collectionKey, confidence: "low", observed: "team library listing was not available", conclusion: "source availability was not verified", nextAction: "confirm manually in Assets → Libraries" }, null);
}

const boundByNodeProp = new Map();
for (const u of usages) boundByNodeProp.set(u.nodeId + "|" + u.prop, u);
const SET_PROPS = [["itemSpacing", "gap"], ["paddingTop", "padding"], ["paddingRight", "padding"], ["paddingBottom", "padding"], ["paddingLeft", "padding"], ["topLeftRadius", "radius"], ["cornerRadius", "radius"], ["strokeWeight", "stroke"]];
function nodeAtRel(variant, rel) {
  if (!rel) return variant;
  const names = rel.split("/").filter(Boolean);
  let cur = variant;
  for (const n of names) { cur = (cur.children || []).find(c => c.name === n); if (!cur) return null; }
  return cur;
}
function vprops(c) {
  const o = {};
  for (const part of c.name.split(",")) { const i = part.indexOf("="); if (i > 0) o[part.slice(0, i).trim()] = part.slice(i + 1).trim(); }
  return o;
}
const sets = [];
for (const r of roots) {
  if (r.type === "COMPONENT_SET") sets.push(r);
  if ("findAllWithCriteria" in r) sets.push(...r.findAllWithCriteria({ types: ["COMPONENT_SET"] }));
}
const seenSets = new Set();
for (const set of sets) {
  if (seenSets.has(set.id)) continue;
  seenSets.add(set.id);
  const variants = set.children.filter(c => c.type === "COMPONENT");
  if (variants.length < 2 || variants.length > 60) continue;
  const rels = new Set();
  for (const v of variants) { rels.add(""); for (const d of (v.findAll ? v.findAll(() => true) : [])) rels.add(nodeInfo.has(d.id) ? nodeInfo.get(d.id).rel : ""); }
  for (const rel of rels) {
    const per = variants.map(v => ({ v, n: nodeAtRel(v, rel) })).filter(x => x.n);
    if (per.length < 2) continue;
    for (const [prop, kind] of SET_PROPS) {
      const rows = per.filter(x => prop in x.n && typeof x.n[prop] === "number" && x.n[prop] !== 0).map(x => ({ x, bound: boundByNodeProp.get(x.n.id + "|" + prop) }));
      const boundRows = rows.filter(r2 => r2.bound), unboundRows = rows.filter(r2 => !r2.bound);
      if (boundRows.length && unboundRows.length) for (const ur of unboundRows) {
        const ex = boundRows[0];
        addFinding("SUSPECTED_MISSING_BINDING", set.id + ":" + rel + ":" + prop, { setName: set.name, relativePath: rel || "(variant root)", property: prop, confidence: "medium", observed: boundRows.length + " sibling variant(s) bind " + prop + " to a variable, " + unboundRows.length + " do not", conclusion: "likely a missed binding; could also be an intentional manual value", nextAction: "confirm with the designer or the design-system rule" }, { nodeId: ur.x.n.id, nodeName: ur.x.n.name, path: set.name + " › " + ur.x.v.name + (rel ? " ›" + rel.replace(/\//g, " › ") : ""), prop, where: null, hidden: isHidden(ur.x.n), current: ur.x.n[prop] });
      }
    }
    const paintRows = per.map(x => ({ x, solid: "fills" in x.n && x.n.fills !== figma.mixed ? x.n.fills.findIndex(p => p.visible !== false && p.type === "SOLID") : -1 })).filter(r2 => r2.solid >= 0);
    const bnd = paintRows.filter(r2 => boundByNodeProp.get(r2.x.n.id + "|fills[" + r2.solid + "].color"));
    const unb = paintRows.filter(r2 => !boundByNodeProp.get(r2.x.n.id + "|fills[" + r2.solid + "].color") && !(typeof r2.x.n.fillStyleId === "string" && r2.x.n.fillStyleId));
    if (bnd.length && unb.length) for (const ur of unb) addFinding("SUSPECTED_MISSING_BINDING", set.id + ":" + rel + ":fill", { setName: set.name, relativePath: rel || "(variant root)", property: "fills", confidence: "medium", observed: bnd.length + " sibling variant(s) bind the fill to a variable, " + unb.length + " do not (no style applied)", conclusion: "likely a missed binding; could also be an intentional manual value", nextAction: "confirm with the designer or the design-system rule" }, { nodeId: ur.x.n.id, nodeName: ur.x.n.name, path: set.name + " › " + ur.x.v.name, prop: "fills[" + ur.solid + "].color", where: null, hidden: isHidden(ur.x.n), current: fmtPaint(ur.x.n.fills[ur.solid]) });
    for (let i = 0; i < per.length; i++) for (let j = i + 1; j < per.length; j++) {
      const a = vprops(per[i].v), b = vprops(per[j].v);
      const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
      const diff = keys.filter(k => a[k] !== b[k]);
      if (diff.length !== 1 || STATE_AXES.test(diff[0]) || /^(type|variant|style|selected|checked|on|value)$/i.test(diff[0])) continue;
      const ua = boundByNodeProp.get(per[i].n.id + "|fills[0].color"), ub = boundByNodeProp.get(per[j].n.id + "|fills[0].color");
      if (ua && ub && ua.varId !== ub.varId) {
        const va = await getVar(ua.varId), vb = await getVar(ub.varId);
        if (va.status === "found" && vb.status === "found") addFinding("SUSPECTED_WRONG_TOKEN", set.id + ":" + rel + ":" + diff[0] + ":" + [ua.varId, ub.varId].sort().join(","), { setName: set.name, relativePath: rel || "(variant root)", property: "fills[0]", confidence: "low", observed: "variants that differ only by '" + diff[0] + "' bind the fill to different variables: " + va.v.name + " vs " + vb.v.name, conclusion: "semantic suspicion only; colors usually do not vary with " + diff[0], nextAction: "confirm the intended token with the design-system rule" }, ua);
      }
    }
  }
}

if (REQUIRED_BINDINGS.length) for (const rule of REQUIRED_BINDINGS) {
  const re = new RegExp(rule.nodeName, "i");
  for (const r of roots) {
    const nodes = ("findAll" in r ? r.findAll(n => re.test(n.name)) : []).concat(re.test(r.name) ? [r] : []);
    for (const n of nodes) if (!boundByNodeProp.get(n.id + "|" + rule.property)) addFinding("MISSING_REQUIRED_BINDING", rule.nodeName + ":" + rule.property, { rule: rule, source: "user-provided REQUIRED_BINDINGS", confidence: "high", observed: "property '" + rule.property + "' has no variable binding", conclusion: "violates the provided rule", nextAction: "bind to the required token" }, { nodeId: n.id, nodeName: n.name, path: (nodeInfo.get(n.id) || {}).path || n.name, prop: rule.property, where: null, hidden: isHidden(n), current: typeof n[rule.property] === "number" ? n[rule.property] : null });
  }
}

const PRIORITY = { UNRESOLVED_VARIABLE: 1, UNRESOLVED_COLLECTION: 1, BROKEN_ALIAS_CHAIN: 1, RESOLUTION_FAILED: 1, CONFIRMED_CYCLE: 1, TYPE_MISMATCH: 2, MODE_PROBLEM: 2, WRONG_LIBRARY: 2, WRONG_TOKEN: 2, MISSING_REQUIRED_BINDING: 2, POTENTIAL_CYCLE: 3, SUSPECTED_MISSING_BINDING: 3, SUSPECTED_WRONG_TOKEN: 4, SOURCE_UNVERIFIED: 3, INCOMPLETE_CHECK: 3, EXTERNAL_DEPENDENCY: 5 };
const GROUP = { confirmed: ["UNRESOLVED_VARIABLE", "UNRESOLVED_COLLECTION", "BROKEN_ALIAS_CHAIN", "RESOLUTION_FAILED", "TYPE_MISMATCH", "MODE_PROBLEM", "CONFIRMED_CYCLE", "WRONG_LIBRARY", "WRONG_TOKEN", "MISSING_REQUIRED_BINDING"], suspicions: ["POTENTIAL_CYCLE", "SUSPECTED_MISSING_BINDING", "SUSPECTED_WRONG_TOKEN", "SOURCE_UNVERIFIED", "INCOMPLETE_CHECK"], info: ["EXTERNAL_DEPENDENCY"] };
const out = { confirmed: [], suspicions: [], externalDependencies: [] };
const statusCounts = {};
for (const f of findings.values()) {
  statusCounts[f.status] = (statusCounts[f.status] || 0) + 1;
  const item = Object.assign({}, f, { priority: "P" + (PRIORITY[f.status] || 3), uniqueNodes: f.nodes.size, uniqueProperties: f.props.size, usages: f.usageCount });
  delete item.nodes; delete item.props; delete item.usageCount; delete item.rootKey;
  if (GROUP.confirmed.includes(f.status)) out.confirmed.push(item);
  else if (GROUP.info.includes(f.status)) out.externalDependencies.push(item);
  else out.suspicions.push(item);
}
const byPrio = (a, b) => (a.priority < b.priority ? -1 : a.priority > b.priority ? 1 : b.uniqueNodes - a.uniqueNodes);
out.confirmed.sort(byPrio); out.suspicions.sort(byPrio);

const allUsageNodes = new Set(usages.map(u => u.nodeId));
const allUsageProps = new Set(usages.map(u => u.nodeId + "|" + u.prop));
const modeCoverage = {
  verifiedExistenceInAllRecordedModes: true,
  evaluatedForEffectiveModes: modeHistogram,
  note: "Values were computed with resolveForConsumer for each object's current effective mode. Other mode combinations were not evaluated, and no object's mode was changed."
};

return {
  page: { id: page.id, name: page.name },
  readOnly: true,
  scope: Object.assign({}, counters, { includeHidden: INCLUDE_HIDDEN, targetIds: TARGET_IDS }),
  scale: { uniqueDirectVariables: uniqueVarIds.length, allReachableVariables: reachable.size, uniqueObjectsWithBindings: allUsageNodes.size, uniquePropertiesWithBindings: allUsageProps.size, bindingUsages: usages.length, rootCauseFindings: findings.size },
  resolution: { pairsEvaluated: resolvedPairs.size, ok: resolveOk, failed: resolveFailures.length, skipped: resolveSkipped },
  modeCoverage,
  provenance: { collections: [...provenance.values()], teamLibrary: teamLibrary.checked ? { checked: true, availableCollections: teamLibrary.availableCollections } : teamLibrary, components: componentStats, styles: styleStats, allowedCollectionKeysProvided: ALLOWED_COLLECTION_KEYS.length > 0 },
  statusCounts,
  confirmedProblems: out.confirmed.slice(0, 40),
  suspicionsAndRisks: out.suspicions.slice(0, 40),
  externalDependencies: out.externalDependencies.slice(0, 20),
  truncatedChain: chainTruncated,
  limits
};
