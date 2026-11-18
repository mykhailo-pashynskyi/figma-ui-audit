const PAGE_ID = "__PAGE_ID__";
const TARGET_IDS = [];
const PLATFORM = "ios";
const MIN_TARGET = 44;
const SCAN_SCREEN_TEXT = true;
const MAX_SCREEN_TEXT = 1500;
const MAX_VARIANTS_PER_SET = 80;
const SAMPLE = 25;

const page = await figma.getNodeByIdAsync(PAGE_ID);
await figma.setCurrentPageAsync(page);

const findings = {};
function add(rule, node, where, actual, expected) {
  if (!findings[rule]) findings[rule] = { count: 0, samples: [] };
  const f = findings[rule];
  f.count++;
  if (f.samples.length < SAMPLE) {
    const s = { id: node.id, name: node.name, where };
    if (actual !== undefined) s.actual = actual;
    if (expected !== undefined) s.expected = expected;
    f.samples.push(s);
  }
}

const TYPES = [
  ["icon-button", /icon ?button|iconbutton|button\/icon/i],
  ["button", /button|btn|cta|\bfab\b/i],
  ["input", /input|text ?field|textfield|textarea|search|\bfield\b|select|dropdown|combobox/i],
  ["switch", /switch|toggle/i],
  ["checkbox", /check ?box/i],
  ["radio", /radio/i],
  ["tab", /\btabs?\b(?!le)|segmented|segment/i],
  ["chip", /chip|\btag\b|filter/i],
  ["link", /\blink\b/i],
  ["slider", /slider|stepper/i],
  ["list-row", /\brow\b|\bcell\b|list ?item|menu ?item/i]
];
const STATE_SYN = {
  default: ["default", "enabled", "rest", "normal", "idle"],
  hover: ["hover", "hovered"],
  pressed: ["pressed", "active", "down", "highlighted", "tap"],
  focus: ["focus", "focused", "focus-visible", "keyboard-focus"],
  disabled: ["disabled", "inactive"],
  loading: ["loading", "busy", "progress"],
  error: ["error", "invalid", "danger"],
  filled: ["filled", "typed", "has-value"],
  "read-only": ["read-only", "readonly"]
};
const STATE_PROP = /^(state|status|interaction)$/i;
const SELECT_PROP = /^(selected|checked|on|value|active|toggled|is ?selected|is ?checked|selection)$/i;
const web = PLATFORM === "web";
const REQUIRED = {
  "button": ["default", "pressed", "disabled"].concat(web ? ["hover", "focus"] : ["focus"]),
  "icon-button": ["default", "pressed", "disabled"].concat(web ? ["hover", "focus"] : ["focus"]),
  "input": ["default", "focus", "disabled", "error", "filled"],
  "switch": ["default", "pressed", "disabled", "focus"],
  "checkbox": ["default", "pressed", "disabled", "focus"],
  "radio": ["default", "pressed", "disabled", "focus"],
  "tab": ["default", "pressed", "focus"],
  "chip": ["default", "pressed", "disabled", "focus"],
  "link": ["default", "pressed", "focus"].concat(web ? ["hover"] : []),
  "slider": ["default", "pressed", "disabled", "focus"],
  "list-row": ["default", "pressed", "focus"]
};
const NEEDS_SELECTION = ["switch", "checkbox", "radio", "tab"];

function normState(v) {
  const s = String(v).toLowerCase().trim();
  for (const k in STATE_SYN) if (STATE_SYN[k].includes(s)) return k;
  return s;
}
function classify(name) {
  for (const [t, re] of TYPES) if (re.test(name)) return t;
  return null;
}

const colls = await figma.variables.getLocalVariableCollectionsAsync();
const collById = new Map(colls.map(c => [c.id, c]));
const localVars = await figma.variables.getLocalVariablesAsync();
const varById = new Map(localVars.map(v => [v.id, v]));
async function getVar(id) {
  if (varById.has(id)) return varById.get(id);
  const v = await figma.variables.getVariableByIdAsync(id);
  varById.set(id, v);
  return v;
}
async function getColl(id) {
  if (collById.has(id)) return collById.get(id);
  const c = await figma.variables.getVariableCollectionByIdAsync(id);
  collById.set(id, c);
  return c;
}
async function resolveVar(v, pick, depth) {
  if (!v || depth > 10) return null;
  const c = await getColl(v.variableCollectionId);
  const modeId = c ? pick(c) : Object.keys(v.valuesByMode)[0];
  let val = v.valuesByMode[modeId];
  if (val === undefined && c) val = v.valuesByMode[c.defaultModeId];
  if (val && typeof val === "object" && val.type === "VARIABLE_ALIAS") return resolveVar(await getVar(val.id), pick, depth + 1);
  return val;
}
function byModeName(name) {
  return c => { const m = c.modes.find(x => x.name === name); return m ? m.modeId : c.defaultModeId; };
}
function byNode(node) {
  const rm = node.resolvedVariableModes || {};
  return c => rm[c.id] || c.defaultModeId;
}

const colorCollections = colls.filter(c => localVars.some(v => v.variableCollectionId === c.id && v.resolvedType === "COLOR"));
const modeNames = [...new Set(colorCollections.flatMap(c => c.modes.map(m => m.name)))];
if (!modeNames.length) modeNames.push("Default");

async function paintRGBA(p, pick) {
  if (p.boundVariables && p.boundVariables.color) {
    const val = await resolveVar(await getVar(p.boundVariables.color.id), pick, 0);
    if (val && typeof val === "object" && "r" in val) return { r: val.r, g: val.g, b: val.b, a: (val.a === undefined ? 1 : val.a) * (p.opacity === undefined ? 1 : p.opacity), token: (await getVar(p.boundVariables.color.id)).name };
  }
  return { r: p.color.r, g: p.color.g, b: p.color.b, a: p.opacity === undefined ? 1 : p.opacity, token: null };
}
function over(fg, bg) {
  return { r: fg.a * fg.r + (1 - fg.a) * bg.r, g: fg.a * fg.g + (1 - fg.a) * bg.g, b: fg.a * fg.b + (1 - fg.a) * bg.b, a: 1 };
}
async function fillOf(node, pick, under) {
  if (!("fills" in node) || node.fills === figma.mixed) return null;
  const vis = node.fills.filter(p => p.visible !== false);
  if (!vis.length) return null;
  if (vis.some(p => p.type !== "SOLID")) return { unknown: true };
  let acc = under || null;
  let token = null;
  for (const p of vis) {
    const c = await paintRGBA(p, pick);
    token = c.token || token;
    acc = acc ? over(c, acc) : (c.a >= 0.99 ? { r: c.r, g: c.g, b: c.b, a: 1 } : { r: c.r, g: c.g, b: c.b, a: c.a });
  }
  if (acc) acc.token = token;
  return acc;
}
async function strokeOf(node, pick) {
  if (!("strokes" in node) || node.strokes === figma.mixed) return null;
  const vis = node.strokes.filter(p => p.visible !== false && p.type === "SOLID");
  if (!vis.length) return null;
  const c = await paintRGBA(vis[vis.length - 1], pick);
  return { color: c, weight: node.strokeWeight === figma.mixed ? null : node.strokeWeight, align: node.strokeAlign };
}
function effOpacity(node, stop) {
  let o = 1, n = node;
  while (n && n !== stop && n.type !== "PAGE") { if ("opacity" in n) o *= n.opacity; n = n.parent; }
  if (stop && "opacity" in stop) o *= stop.opacity;
  return o;
}
async function backgroundOf(node, pick, stop, fallback) {
  const chain = [];
  let n = node.parent;
  while (n && n.type !== "PAGE") {
    chain.push(n);
    if (n === stop) break;
    n = n.parent;
  }
  let base = null;
  let startIndex = -1;
  for (let i = 0; i < chain.length; i++) {
    const f = await fillOf(chain[i], pick, null);
    if (f && f.unknown) return { unknown: true };
    if (f && f.a >= 0.99) { base = f; startIndex = i; break; }
  }
  if (!base) { if (!fallback) return null; base = fallback; startIndex = chain.length; }
  for (let i = startIndex - 1; i >= 0; i--) {
    const f = await fillOf(chain[i], pick, base);
    if (f && !f.unknown) base = f;
  }
  return base;
}
function lum(c) {
  const f = x => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}
function ratio(a, b) {
  const l1 = lum(a), l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
function hex(c) { return "#" + [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, "0")).join(""); }
function largeText(t) {
  if (t.fontSize === figma.mixed || t.fontName === figma.mixed) return false;
  const bold = /bold|semibold|heavy|black/i.test(t.fontName.style);
  if (web) return t.fontSize >= 24 || (bold && t.fontSize >= 18.66);
  return t.fontSize >= 18 || (bold && t.fontSize >= 14);
}

const BG_NAME = /(^|\/)(bg|background|backgrounds|surface|surfaces|canvas|base|page)(\/|-|$)/i;
const PRIMITIVE = /^(palette|primitive|primitives|core|ref)\//i;
const bgVars = localVars.filter(v => v.resolvedType === "COLOR" && BG_NAME.test(v.name) && !PRIMITIVE.test(v.name) && !/overlay|scrim|inverse|disabled|hover|pressed/i.test(v.name));
const pageBgs = {};
for (const m of modeNames) {
  pageBgs[m] = [];
  for (const v of bgVars) {
    const val = await resolveVar(v, byModeName(m), 0);
    if (val && typeof val === "object" && "r" in val && (val.a === undefined || val.a >= 0.99)) pageBgs[m].push({ name: v.name, c: { r: val.r, g: val.g, b: val.b, a: 1 } });
  }
}
function worstAgainstPage(c, mode) {
  const list = pageBgs[mode] || [];
  if (!list.length) return null;
  let worst = null;
  for (const b of list) { const r = ratio(c, b.c); if (!worst || r < worst.r) worst = { r, bg: b.name }; }
  return worst;
}

function containerOf(variant) {
  if ("fills" in variant && variant.fills !== figma.mixed && variant.fills.some(p => p.visible !== false)) return variant;
  const area = variant.width * variant.height;
  for (const c of variant.children || []) {
    if (c.visible === false) continue;
    if ("fills" in c && c.fills !== figma.mixed && c.fills.some(p => p.visible !== false && p.type === "SOLID") && c.width * c.height >= 0.6 * area) return c;
  }
  return null;
}
function ringOf(variant) {
  const eff = ("effects" in variant ? variant.effects : []).filter(e => e.visible !== false && (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") && (e.spread || 0) > 0);
  if (eff.length) {
    const outer = eff.reduce((a, b) => ((b.spread || 0) > (a.spread || 0) ? b : a));
    const inner = eff.length > 1 ? eff.reduce((a, b) => ((b.spread || 0) < (a.spread || 0) ? b : a)) : null;
    return { kind: "effect", effect: outer, width: inner ? outer.spread - inner.spread : outer.spread, offset: inner ? inner.spread : 0 };
  }
  return null;
}
async function effectRGBA(e, pick) {
  if (e.boundVariables && e.boundVariables.color) {
    const val = await resolveVar(await getVar(e.boundVariables.color.id), pick, 0);
    if (val && typeof val === "object" && "r" in val) return { r: val.r, g: val.g, b: val.b, a: val.a === undefined ? 1 : val.a, token: (await getVar(e.boundVariables.color.id)).name };
  }
  return { r: e.color.r, g: e.color.g, b: e.color.b, a: e.color.a, token: null };
}
function signature(props, skip) {
  return Object.keys(props || {}).filter(k => !skip.includes(k)).sort().map(k => k + "=" + props[k]).join(",");
}
async function visualKey(n, pick) {
  const parts = [];
  const nodes = [n, ...(n.findAll ? n.findAll(x => x.visible !== false).slice(0, 40) : [])];
  for (const x of nodes) {
    const f = await fillOf(x, pick, null);
    const s = await strokeOf(x, pick);
    parts.push((f && !f.unknown ? hex(f) + (f.a < 1 ? f.a.toFixed(2) : "") : "-") + "|" + (s ? hex(s.color) + s.weight : "-") + "|" + ("effects" in x ? x.effects.filter(e => e.visible !== false).length : 0) + "|" + ("opacity" in x ? x.opacity.toFixed(2) : ""));
  }
  return parts.join(";");
}

let roots = [];
if (TARGET_IDS.length) { for (const id of TARGET_IDS) { const n = await figma.getNodeByIdAsync(id); if (n) roots.push(n); } }
else roots = page.children.slice();

const sets = [];
for (const r of roots) {
  const found = r.type === "COMPONENT_SET" || r.type === "COMPONENT" ? [r] : [];
  if ("findAllWithCriteria" in r) found.push(...r.findAllWithCriteria({ types: ["COMPONENT_SET", "COMPONENT"] }));
  for (const n of found) if (n.type === "COMPONENT_SET" || !n.parent || n.parent.type !== "COMPONENT_SET") sets.push(n);
}

const components = [];
const statesUsed = new Set();
for (const set of sets) {
  const type = classify(set.name);
  if (!type) continue;
  const variants = set.type === "COMPONENT_SET" ? set.children.filter(c => c.type === "COMPONENT").slice(0, MAX_VARIANTS_PER_SET) : [set];
  let stateKey = null, selKey = null;
  const first = variants[0] && variants[0].variantProperties ? variants[0].variantProperties : {};
  for (const k of Object.keys(first)) { if (STATE_PROP.test(k)) stateKey = k; else if (SELECT_PROP.test(k)) selKey = k; }
  const present = new Set();
  const selValues = new Set();
  for (const v of variants) {
    const vp = v.variantProperties || {};
    present.add(stateKey ? normState(vp[stateKey]) : "default");
    if (selKey) selValues.add(String(vp[selKey]).toLowerCase());
  }
  present.forEach(s => statesUsed.add(s));
  const missing = (REQUIRED[type] || []).filter(s => !present.has(s));
  if (NEEDS_SELECTION.includes(type) && selValues.size < 2) missing.push("selected/unselected values");
  const info = { id: set.id, name: set.name, type, variants: variants.length, stateProperty: stateKey, selectionProperty: selKey, states: [...present], selectionValues: [...selValues], missing };
  components.push(info);
  if (missing.includes("focus")) add("A11Y-09", set, set.name, "no focus variant", "state=focus");
  const other = missing.filter(s => s !== "focus");
  if (other.length) add("COMP-05", set, set.name, "states: " + [...present].join(","), "missing " + other.join(","));

  const byState = {};
  for (const v of variants) {
    const vp = v.variantProperties || {};
    const st = stateKey ? normState(vp[stateKey]) : "default";
    const skip = stateKey ? [stateKey] : [];
    (byState[st] = byState[st] || {})[signature(vp, skip)] = v;
  }

  for (const v of variants) {
    const vp = v.variantProperties || {};
    const st = stateKey ? normState(vp[stateKey]) : "default";
    const label = set.name + (Object.keys(vp).length ? " [" + Object.entries(vp).map(([k, x]) => k + "=" + x).join(", ") + "]" : "");
    if (type !== "link" && (v.width < MIN_TARGET - 0.5 || v.height < MIN_TARGET - 0.5)) add("A11Y-01", v, label, Math.round(v.width) + "×" + Math.round(v.height), "≥ " + MIN_TARGET + "×" + MIN_TARGET);
    const container = containerOf(v);
    for (const mode of modeNames) {
      const pick = byModeName(mode);
      const fallback = pageBgs[mode] && pageBgs[mode][0] ? pageBgs[mode][0].c : null;
      const cont = container ? await fillOf(container, pick, fallback) : null;
      const texts = v.findAll(n => n.type === "TEXT" && n.visible !== false).slice(0, 4);
      for (const t of texts) {
        const fg = await fillOf(t, pick, null);
        if (!fg || fg.unknown) continue;
        const bg = await backgroundOf(t, pick, v, fallback);
        if (!bg || bg.unknown) continue;
        const op = effOpacity(t, v);
        const c = over({ r: fg.r, g: fg.g, b: fg.b, a: fg.a * op }, bg);
        const r = ratio(c, bg);
        const need = largeText(t) ? 3 : 4.5;
        if (r < need) {
          if (st === "disabled") { if (r < 3) add("A11Y-02-disabled", t, label + " · " + mode, r.toFixed(2) + ":1 " + hex(c) + " on " + hex(bg), "≥ 3:1 (P3, disabled is exempt)"); }
          else add("A11Y-02", t, label + " · " + mode, r.toFixed(2) + ":1 " + hex(c) + " on " + hex(bg) + (fg.token ? " (" + fg.token + ")" : ""), need + ":1");
        }
      }
      const icons = v.findAll(n => (n.type === "VECTOR" || n.type === "BOOLEAN_OPERATION") && n.visible !== false).slice(0, 3);
      for (const ic of icons) {
        const f = await fillOf(ic, pick, null);
        const s = await strokeOf(ic, pick);
        const col = f && !f.unknown ? f : s ? s.color : null;
        if (!col) continue;
        const bg = await backgroundOf(ic, pick, v, fallback);
        if (!bg || bg.unknown) continue;
        const c = over({ r: col.r, g: col.g, b: col.b, a: (col.a === undefined ? 1 : col.a) * effOpacity(ic, v) }, bg);
        const r = ratio(c, bg);
        if (r < 3 && st !== "disabled") add("A11Y-03", ic, label + " · " + mode, r.toFixed(2) + ":1 icon " + hex(c) + " on " + hex(bg), "3:1");
      }
      if (st !== "disabled" && ["input", "checkbox", "radio"].includes(type)) {
        const s = await strokeOf(container || v, pick);
        const contVsPage = cont && !cont.unknown ? worstAgainstPage(cont, mode) : null;
        const strokeVsPage = s ? worstAgainstPage(s.color.a < 1 ? over(s.color, fallback || { r: 1, g: 1, b: 1 }) : s.color, mode) : null;
        const ok = (contVsPage && contVsPage.r >= 3) || (strokeVsPage && strokeVsPage.r >= 3);
        if (!ok && (contVsPage || strokeVsPage)) add("A11Y-11", v, label + " · " + mode, "boundary " + (strokeVsPage ? strokeVsPage.r.toFixed(2) : "-") + ":1 border / " + (contVsPage ? contVsPage.r.toFixed(2) : "-") + ":1 fill vs " + (strokeVsPage || contVsPage).bg, "3:1");
      }
      if (st !== "disabled" && ["button", "icon-button", "chip"].includes(type) && cont && !cont.unknown) {
        const w = worstAgainstPage(cont, mode);
        const hasBorder = !!(await strokeOf(container || v, pick));
        if (w && w.r < 3 && !hasBorder && cont.a >= 0.99) add("A11Y-14", v, label + " · " + mode, w.r.toFixed(2) + ":1 container " + hex(cont) + " vs " + w.bg, type === "icon-button" ? "3:1 (required, shape is the only cue)" : "3:1 recommended");
      }
      if (st === "focus") {
        const ring = ringOf(v);
        const s = await strokeOf(v, pick);
        if (ring) {
          const rc = await effectRGBA(ring.effect, pick);
          const w = worstAgainstPage(rc, mode);
          if (w && w.r < 3) add("A11Y-13", v, label + " · " + mode, "ring " + hex(rc) + " " + w.r.toFixed(2) + ":1 vs " + w.bg, "3:1");
          if (ring.width < 2) add("A11Y-13", v, label + " · " + mode, "ring width " + ring.width, "≥ 2");
        } else if (s) {
          const w = worstAgainstPage(s.color, mode);
          if (w && w.r < 3) add("A11Y-13", v, label + " · " + mode, "focus stroke " + hex(s.color) + " " + w.r.toFixed(2) + ":1 vs " + w.bg, "3:1");
          if (s.weight !== null && s.weight < 2) add("A11Y-13", v, label + " · " + mode, "focus stroke " + s.weight + " px", "≥ 2");
        } else if (mode === modeNames[0]) add("A11Y-13", v, label, "focus variant has no ring or stroke", "ring ≥ 2 px, 3:1");
      }
    }
    if (st !== "default") {
      const skip = stateKey ? [stateKey] : [];
      const def = byState.default ? byState.default[signature(vp, skip)] : null;
      if (def) {
        const pick = byModeName(modeNames[0]);
        if ((await visualKey(v, pick)) === (await visualKey(def, pick))) add("COMP-10", v, label, "looks identical to default", "visible change for " + st);
        if (st === "error") {
          const extra = v.findAll(n => n.visible !== false && (n.type === "TEXT" || n.type === "VECTOR" || n.type === "INSTANCE")).length - def.findAll(n => n.visible !== false && (n.type === "TEXT" || n.type === "VECTOR" || n.type === "INSTANCE")).length;
          if (extra <= 0) add("A11Y-04", v, label, "error shown by color only", "icon or message");
        }
        if (container) {
          const pickM = byModeName(modeNames[0]);
          const cv = await fillOf(container, pickM, null);
          const dc = containerOf(def);
          const cd = dc ? await fillOf(dc, pickM, null) : null;
          const syn = STATE_SYN[st] || [st];
          if (cv && !cv.unknown && cv.token && cd && !cd.unknown && cv.token !== cd.token && !syn.some(w => cv.token.toLowerCase().includes(w))) add("VAR-15b", v, label, "fill " + cv.token, "a token named for '" + st + "'");
        }
      }
    }
  }

  if (selKey && NEEDS_SELECTION.includes(type) && byState.default) {
    const defaults = Object.values(byState.default);
    const vals = {};
    for (const d of defaults) vals[String(d.variantProperties[selKey]).toLowerCase()] = d;
    const keys = Object.keys(vals);
    if (keys.length >= 2) {
      const a = vals[keys[0]], b = vals[keys[1]];
      const pick = byModeName(modeNames[0]);
      const ca = containerOf(a), cb = containerOf(b);
      const fa = ca ? await fillOf(ca, pick, null) : null, fb = cb ? await fillOf(cb, pick, null) : null;
      const structural = a.findAll(n => n.visible !== false).length !== b.findAll(n => n.visible !== false).length;
      if (fa && fb && !fa.unknown && !fb.unknown && ratio(fa, fb) < 3 && !structural) add("A11Y-12", set, set.name, keys[0] + " vs " + keys[1] + " " + ratio(fa, fb).toFixed(2) + ":1, no shape change", "3:1 or a mark/icon/position change");
    }
  }
}

const stateTokens = {};
const varNames = localVars.map(v => v.name.toLowerCase());
for (const s of [...statesUsed, "focus", "disabled", "pressed", "error"]) {
  if (s === "default" || stateTokens[s]) continue;
  const syn = STATE_SYN[s] || [s];
  const hits = localVars.filter(v => syn.some(w => new RegExp("(^|[\\/-])" + w.replace("-", "\\-") + "($|[\\/-])", "i").test(v.name))).map(v => v.name);
  stateTokens[s] = { count: hits.length, samples: hits.slice(0, 8) };
  if (!hits.length) {
    if (!findings["VAR-15a"]) findings["VAR-15a"] = { count: 0, samples: [] };
    findings["VAR-15a"].count++;
    findings["VAR-15a"].samples.push({ state: s, expected: "variables named with '" + s + "' (e.g. color/border/" + s + ")" });
  }
}
const focusTokens = {
  ring: localVars.filter(v => v.resolvedType === "COLOR" && /focus/.test(v.name.toLowerCase()) && /ring|outline|border/.test(v.name.toLowerCase()) && !/offset/.test(v.name.toLowerCase())).map(v => v.name),
  ringOffset: localVars.filter(v => v.resolvedType === "COLOR" && /focus/.test(v.name.toLowerCase()) && /offset|gap/.test(v.name.toLowerCase())).map(v => v.name),
  width: localVars.filter(v => v.resolvedType === "FLOAT" && /focus/.test(v.name.toLowerCase())).map(v => v.name),
  effectStyles: (await figma.getLocalEffectStylesAsync()).filter(s => /focus/i.test(s.name)).map(s => s.name)
};

const screenText = { checked: 0 };
if (SCAN_SCREEN_TEXT) {
  for (const r of roots) {
    if (r.type !== "FRAME" && r.type !== "SECTION") continue;
    const texts = r.findAllWithCriteria({ types: ["TEXT"] }).filter(t => t.visible !== false);
    for (const t of texts) {
      if (screenText.checked >= MAX_SCREEN_TEXT) break;
      let inComp = false;
      for (let p = t.parent; p && p !== r; p = p.parent) if (p.type === "COMPONENT" || p.type === "COMPONENT_SET") { inComp = true; break; }
      if (inComp) continue;
      const pick = byNode(t);
      const fg = await fillOf(t, pick, null);
      if (!fg || fg.unknown) continue;
      const bg = await backgroundOf(t, pick, null, null);
      if (!bg) continue;
      if (bg.unknown) { add("A11Y-02-image", t, r.name + " › " + t.name, "text over image or gradient", "check visually or add a scrim"); continue; }
      screenText.checked++;
      const c = over({ r: fg.r, g: fg.g, b: fg.b, a: fg.a * effOpacity(t, null) }, bg);
      const ra = ratio(c, bg);
      const need = largeText(t) ? 3 : 4.5;
      const modeLabel = colorCollections.map(cc => { const id = (t.resolvedVariableModes || {})[cc.id]; const m = cc.modes.find(x => x.modeId === id); return m ? m.name : null; }).filter(Boolean)[0] || modeNames[0];
      if (ra < need) add("A11Y-02", t, r.name + " › " + t.name + " · " + modeLabel, ra.toFixed(2) + ":1 " + hex(c) + " on " + hex(bg) + (fg.token ? " (" + fg.token + ")" : ""), need + ":1");
    }
  }
}

return {
  page: { id: page.id, name: page.name },
  platform: PLATFORM,
  modes: modeNames,
  pageBackgrounds: Object.fromEntries(Object.entries(pageBgs).map(([m, l]) => [m, l.map(b => b.name + " " + hex(b.c))])),
  components,
  stateTokens,
  focusTokens,
  screenText,
  findings
};
