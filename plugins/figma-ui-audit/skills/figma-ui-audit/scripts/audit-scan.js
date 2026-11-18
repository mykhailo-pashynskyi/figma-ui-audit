const PAGE_ID = "__PAGE_ID__";
const TARGET_IDS = [];
const PROFILE = {
  platform: "ios",
  baseSizes: [[402, 874], [390, 844], [440, 956], [420, 912], [375, 667], [360, 780], [466, 678], [678, 466], [951, 669], [669, 951]],
  safeInsets: {
    "402x874": [62, 34, 0, 0],
    "390x844": [47, 34, 0, 0],
    "440x956": [62, 34, 0, 0],
    "420x912": [68, 34, 0, 0],
    "375x667": [20, 0, 0, 0],
    "360x780": [50, 34, 0, 0],
    "466x678": [0, 34, 0, 84],
    "951x669": [0, 34, 0, 84],
    "669x951": [82, 34, 0, 0]
  },
  minTarget: 44,
  minFontSize: 11,
  spaceStep: 4,
  spaceExtra: [1, 2],
  strokeScale: [0.5, 1, 1.5, 2, 3],
  motionMs: [150, 250, 400],
  requiredStates: ["default", "pressed", "disabled"],
  coreScreenStates: ["default", "loading", "empty", "error"]
};
const SAMPLE = 25;
const MAX_INSTANCE_LOOKUPS = 300;

const page = await figma.getNodeByIdAsync(PAGE_ID);
await figma.setCurrentPageAsync(page);

const findings = {};
function add(rule, node, path, actual, expected) {
  if (!findings[rule]) findings[rule] = { count: 0, samples: [] };
  const f = findings[rule];
  f.count++;
  if (f.samples.length < SAMPLE) {
    const s = { id: node.id, name: node.name, path };
    if (actual !== undefined) s.actual = actual;
    if (expected !== undefined) s.expected = expected;
    f.samples.push(s);
  }
}

const DEFAULT_NAME = /^(frame|group|rectangle|ellipse|line|vector|polygon|star|union|subtract|intersect|exclude|image|component|instance|section|slice|arrow|boolean)\s*\d*(\s+copy(\s+\d+)?)?$/i;
const VERSION_WORD = /(^|[\s_\-\/(])(final|v\d+|new|copy|old|test|wip|backup|draft|tmp|temp)($|[\s_\-\/)])/i;
const EXEMPT = /intentional|decor|illustration|artwork|waiver:/i;
const INTERACTIVE = /button|btn|link|tab(?!le)|toggle|switch|checkbox|radio|chip|close|back|menu|cta|segment|stepper|slider|fab|icon ?button|action/i;
const COMPONENTISH = /^(button|btn|input|text ?field|card|row|cell|list ?item|tab ?bar|nav ?bar|navbar|header|badge|avatar|switch|toggle|toast|snackbar|modal|sheet|dialog|chip|tag|checkbox|radio|segmented|search ?bar|toolbar)\b/i;
const PLACEHOLDER = /lorem|ipsum|^(text|title|label|button|placeholder|heading|subtitle|caption|body|text here|your text here|subtext)$/i;
const INPUTISH = /input|text ?field|textfield|search|textarea|field|form|password|email/i;
const CHROME_OK = /status ?bar|dynamic ?island|island|home ?indicator|system|navigation ?bar|nav ?bar|tab ?bar|toolbar|keyboard|background|backdrop|^bg|hero|map|camera|scrim|overlay|rail|sidebar|gesture/i;
const STATE_WORDS = {
  default: /^default$|^filled$|^normal$/i,
  loading: /^loading$|^skeleton$/i,
  empty: /^empty$/i,
  error: /^error$|^failed$|^failure$/i,
  success: /^success$|^done$|^confirmation$/i,
  keyboard: /^keyboard( open)?$/i,
  long: /^long( content)?$|^stress$/i,
  scrolled: /^scrolled$|^scroll$/i,
  offline: /^offline$|^no connection$/i,
  dark: /^dark$/i,
  largetext: /^large text$|^ax\d$|^accessibility$/i
};

const colls = await figma.variables.getLocalVariableCollectionsAsync();
const collById = new Map(colls.map(c => [c.id, c]));
const localVars = await figma.variables.getLocalVariablesAsync();
const varById = new Map(localVars.map(v => [v.id, v]));
const varCache = new Map();
async function getVar(id) {
  if (varById.has(id)) return varById.get(id);
  if (varCache.has(id)) return varCache.get(id);
  const v = await figma.variables.getVariableByIdAsync(id);
  varCache.set(id, v);
  return v;
}
async function getColl(id) {
  if (collById.has(id)) return collById.get(id);
  const c = await figma.variables.getVariableCollectionByIdAsync(id);
  if (c) collById.set(id, c);
  return c;
}
async function resolveValue(v, depth) {
  const c = await getColl(v.variableCollectionId);
  const modeId = c ? c.defaultModeId : Object.keys(v.valuesByMode)[0];
  const val = v.valuesByMode[modeId];
  if (val && typeof val === "object" && val.type === "VARIABLE_ALIAS" && depth < 10) {
    const t = await getVar(val.id);
    return t ? resolveValue(t, depth + 1) : undefined;
  }
  return val;
}
function hex2(n) { return Math.round(n * 255).toString(16).padStart(2, "0"); }
function colorKey(c, a) { return "#" + hex2(c.r) + hex2(c.g) + hex2(c.b) + (a < 0.999 ? "@" + a.toFixed(2) : ""); }
function isPrimitive(v, c) {
  return /^(palette|primitive|primitives|core|ref|base)\//i.test(v.name) || (c && /primitive|palette|core|global|reference/i.test(c.name));
}

const colorIndex = new Map();
const floatIndex = { space: new Map(), radius: new Map(), stroke: new Map(), size: new Map() };
for (const v of localVars) {
  const c = collById.get(v.variableCollectionId);
  const val = await resolveValue(v, 0);
  if (val === undefined) continue;
  if (v.resolvedType === "COLOR") {
    const k = colorKey(val, val.a === undefined ? 1 : val.a);
    if (!colorIndex.has(k)) colorIndex.set(k, []);
    colorIndex.get(k).push({ name: v.name, primitive: isPrimitive(v, c) });
  } else if (v.resolvedType === "FLOAT") {
    const scope = ((c ? c.name : "") + "/" + v.name).toLowerCase();
    const cat = /space|spacing|gap|padding/.test(scope) ? "space" : /radius|corner|round/.test(scope) ? "radius" : /stroke|border/.test(scope) ? "stroke" : /size|icon/.test(scope) ? "size" : null;
    if (!cat) continue;
    if (!floatIndex[cat].has(val)) floatIndex[cat].set(val, []);
    floatIndex[cat].get(val).push(v.name);
  }
}
function suggestColor(k) {
  const list = colorIndex.get(k);
  if (!list) return null;
  const sem = list.filter(x => !x.primitive);
  return (sem.length ? sem : list).map(x => x.name).slice(0, 3);
}
function suggestFloat(cat, val) {
  const list = floatIndex[cat].get(val);
  return list ? list.slice(0, 3) : null;
}

const styleCache = new Map();
async function styleBound(id) {
  if (styleCache.has(id)) return styleCache.get(id);
  const s = await figma.getStyleByIdAsync(id);
  let bound = false;
  if (s && s.type === "PAINT") bound = s.paints.some(p => p.boundVariables && p.boundVariables.color);
  styleCache.set(id, bound);
  return bound;
}

function onSpaceScale(v) { return v % PROFILE.spaceStep === 0 || PROFILE.spaceExtra.includes(v); }
function exempt(node) {
  if (EXEMPT.test(node.name)) return true;
  if ("annotations" in node && node.annotations && node.annotations.some(a => EXEMPT.test((a.label || "") + (a.labelMarkdown || "")))) return true;
  return false;
}
function box(n) { return n.absoluteBoundingBox; }
function lum(c) {
  const f = x => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}
function solidOf(node) {
  if (!("fills" in node) || node.fills === figma.mixed) return null;
  const vis = node.fills.filter(p => p.visible !== false);
  if (vis.length !== 1 || vis[0].type !== "SOLID") return null;
  if ((vis[0].opacity === undefined ? 1 : vis[0].opacity) < 0.99) return null;
  return vis[0].color;
}
function bgFor(node) {
  let p = node.parent;
  while (p && p.type !== "PAGE") {
    const c = solidOf(p);
    if (c && ("opacity" in p ? p.opacity : 1) >= 0.99) return c;
    p = p.parent;
  }
  return null;
}

const screens = [];
const fonts = {};
const counters = { nodes: 0, instances: 0, autoLayoutFrames: 0, frames: 0, textLayers: 0, annotated: 0, reactions: 0 };
const transitionMs = {};
let instanceLookups = 0;

function deviceMatch(w, h) {
  const W = Math.round(w), H = Math.round(h);
  for (const [bw, bh] of PROFILE.baseSizes) if (bw === W && bh === H) return { key: bw + "x" + bh, exact: true };
  for (const [bw, bh] of PROFILE.baseSizes) if (bw === W && H > bh) return { key: bw + "x" + bh, exact: false, tall: true };
  return null;
}
function parseScreenName(name) {
  const parts = name.split("/").map(s => s.trim()).filter(Boolean);
  const states = [];
  const rest = [];
  for (const p of parts) {
    let hit = null;
    for (const k in STATE_WORDS) if (STATE_WORDS[k].test(p)) hit = k;
    if (hit) states.push(hit); else rest.push(p);
  }
  return { base: rest.join(" / ") || name, states, wellFormed: parts.length >= 2 };
}

async function walk(root, screenInfo) {
  const stack = [{ node: root, depth: 0, path: root.name, inComponent: root.type === "COMPONENT" || root.type === "COMPONENT_SET" }];
  while (stack.length) {
    const { node, depth, path, inComponent } = stack.pop();
    counters.nodes++;
    const isRoot = node === root;

    if (DEFAULT_NAME.test(node.name.trim()) && node.type !== "TEXT") add("NAME-01", node, path, node.name);
    if (VERSION_WORD.test(node.name)) add("NAME-05", node, path, node.name);
    if (!isRoot && ["FRAME", "GROUP", "RECTANGLE", "ELLIPSE"].includes(node.type) && !DEFAULT_NAME.test(node.name.trim()) && !/^[A-Z][A-Za-z0-9]*$/.test(node.name) && !node.name.includes("=")) add("NAME-03", node, path, node.name, "PascalCase role name");
    if ("annotations" in node && node.annotations && node.annotations.length) counters.annotated++;
    if (node.visible === false && !inComponent) add("LAY-12", node, path);
    if (depth > 8) add("LAY-06", node, path, "depth " + depth);

    if ("reactions" in node && node.reactions && node.reactions.length) {
      counters.reactions += node.reactions.length;
      for (const r of node.reactions) for (const a of (r.actions || (r.action ? [r.action] : []))) {
        if (a && a.transition && a.transition.duration !== undefined) {
          const ms = Math.round(a.transition.duration * 1000);
          const key = ms + "ms " + (a.transition.easing ? a.transition.easing.type : "");
          transitionMs[key] = (transitionMs[key] || 0) + 1;
          if (!PROFILE.motionMs.includes(ms)) add("HAND-02", node, path, key, PROFILE.motionMs.join("/") + "ms");
        }
      }
    }

    if (node.type === "INSTANCE") {
      counters.instances++;
      const w = node.width, h = node.height;
      if ((INTERACTIVE.test(node.name) || (node.reactions && node.reactions.length)) && (w < PROFILE.minTarget - 0.5 || h < PROFILE.minTarget - 0.5)) add("A11Y-01", node, path, Math.round(w) + "×" + Math.round(h), "≥ " + PROFILE.minTarget + "×" + PROFILE.minTarget);
      if (INTERACTIVE.test(node.name) && !node.findOne(n => n.type === "TEXT" && n.visible !== false) && !(node.annotations && node.annotations.length)) add("A11Y-06", node, path, "icon-only, no label note");
      if (instanceLookups < MAX_INSTANCE_LOOKUPS) {
        instanceLookups++;
        const mc = await node.getMainComponentAsync();
        if (!mc) add("COMP-03", node, path, "main component missing");
      }
      if (screenInfo && INPUTISH.test(node.name)) screenInfo.hasInput = true;
      continue;
    }

    if (node.type === "FRAME" && node.detachedInfo) add("COMP-02", node, path, "detached from " + (node.detachedInfo.type === "local" ? "local component" : "library component"));
    if (node.type === "FRAME" && !inComponent && !isRoot && COMPONENTISH.test(node.name)) add("COMP-01", node, path, "frame named like a component");

    if (node.type === "COMPONENT_SET" || (node.type === "COMPONENT" && (!node.parent || node.parent.type !== "COMPONENT_SET"))) checkComponent(node, path);

    if (node.type === "TEXT") {
      counters.textLayers++;
      if (node.textAutoResize === "NONE") add("LAY-08", node, path, "fixed text box", "Auto height");
      if (node.textStyleId === "") add("TYPE-01", node, path, describeText(node));
      else if (node.textStyleId === figma.mixed) {
        const segs = node.getStyledTextSegments(["textStyleId"]);
        if (segs.some(s => s.textStyleId === "")) add("TYPE-01", node, path, "partially unstyled");
        else add("TYPE-02", node, path, segs.length + " styles in one layer");
      }
      const fn = node.fontName === figma.mixed ? node.getStyledTextSegments(["fontName"]).map(s => s.fontName) : [node.fontName];
      for (const f of fn) { fonts[f.family] = fonts[f.family] || {}; fonts[f.family][f.style] = (fonts[f.family][f.style] || 0) + 1; }
      const sizes = node.fontSize === figma.mixed ? node.getStyledTextSegments(["fontSize"]).map(s => s.fontSize) : [node.fontSize];
      const minSize = Math.min(...sizes);
      if (minSize < PROFILE.minFontSize) add("TYPE-06", node, path, minSize, "≥ " + PROFILE.minFontSize);
      const fg = solidOf(node);
      const bg = bgFor(node);
      if (fg && bg && node.fontSize !== figma.mixed && node.fontName !== figma.mixed) {
        const l1 = lum(fg), l2 = lum(bg);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        const bold = /bold|semibold|heavy|black/i.test(node.fontName.style);
        const need = node.fontSize >= 18 || (bold && node.fontSize >= 14) ? 3 : 4.5;
        if (ratio < need) add("A11Y-02", node, path, ratio.toFixed(2) + ":1 " + colorKey(fg, 1) + " on " + colorKey(bg, 1), need + ":1");
      }
    }

    if ((node.type === "VECTOR" || node.type === "BOOLEAN_OPERATION") && !inComponent) {
      const textish = /\s/.test(node.name.trim()) && /[a-z]{3,}/i.test(node.name) && !/icon|logo|illustration|art|shape|decor|bg|background|wave|blob|chart|graph|map|line|divider/i.test(node.name);
      const parentTextish = node.parent && /title|label|text|heading|caption|headline/i.test(node.parent.name);
      if (textish || parentTextish) add("TYPE-07", node, path, "vector where text is expected");
      else if (node.width > 120 && node.height > 40 && !/icon|logo|illustration|art|decor|bg|background|wave|blob|chart|graph|map|pattern|shape/i.test(node.name)) add("LAY-07", node, path, Math.round(node.width) + "×" + Math.round(node.height) + " vector");
    }

    if (node.type === "GROUP" && !inComponent && node.children.length >= 2 && node.findOne(n => n.type === "TEXT" || n.type === "INSTANCE")) add("LAY-02", node, path, node.children.length + " children");

    await checkPaints(node, path);
    checkGeometry(node, path, isRoot);

    if ("layoutMode" in node && (node.type === "FRAME" || node.type === "COMPONENT")) {
      counters.frames++;
      const kids = node.children.filter(c => c.visible !== false);
      if (node.layoutMode === "NONE") {
        if (kids.length >= 2 && !exempt(node)) add(isRoot ? "LAY-01-root" : "LAY-01", node, path, kids.length + " children, no auto layout");
      } else {
        counters.autoLayoutFrames++;
        checkSpacing(node, path);
        if (node.primaryAxisAlignItems === "SPACE_BETWEEN" && kids.length === 1) add("CODE-04", node, path, "SPACE_BETWEEN with one child");
        if (node.itemSpacing < 0) add("CODE-04", node, path, "negative gap " + node.itemSpacing);
        const inter = kids.filter(c => INTERACTIVE.test(c.name));
        if (inter.length >= 2 && node.itemSpacing < 8 && node.primaryAxisAlignItems !== "SPACE_BETWEEN") add("A11Y-08", node, path, "gap " + node.itemSpacing + " between targets", "≥ 8");
        for (const c of kids) {
          if ("layoutPositioning" in c && c.layoutPositioning === "ABSOLUTE" && !exempt(c)) add("LAY-03", c, path + " › " + c.name, "absolute in auto layout");
          if (node.layoutMode === "VERTICAL" && c.type === "TEXT" && c.layoutSizingHorizontal === "FIXED") add("LAY-04", c, path + " › " + c.name, "fixed width text in vertical stack", "Fill container");
        }
      }
      if (node.overflowDirection && node.overflowDirection !== "NONE" && kids.some(c => c.layoutPositioning === "ABSOLUTE")) add("CODE-04", node, path, "absolute child in scroll container");
    }

    if (!isRoot && node.parent && box(node) && box(node.parent) && node.parent !== root && node.parent.type !== "PAGE" && node.parent.type !== "SECTION" && !("layoutPositioning" in node && node.layoutPositioning === "ABSOLUTE")) {
      const a = box(node), b = box(node.parent);
      if (a.x < b.x - 1 || a.y < b.y - 1 || a.x + a.width > b.x + b.width + 1 || a.y + a.height > b.y + b.height + 1) add("LAY-05", node, path, "overflows " + node.parent.name + (node.parent.clipsContent ? " (clipped)" : ""));
    }

    if ("exportSettings" in node && "fills" in node && node.fills !== figma.mixed && node.fills.some(p => p.type === "IMAGE") && node.exportSettings.length === 0) add("HAND-05", node, path, "image without export settings");

    if ("children" in node) {
      const childInComponent = inComponent || node.type === "COMPONENT" || node.type === "COMPONENT_SET";
      const nameCount = {};
      for (const c of node.children) if (c.type !== "INSTANCE") nameCount[c.name] = (nameCount[c.name] || 0) + 1;
      for (const n in nameCount) if (nameCount[n] > 1 && !DEFAULT_NAME.test(n) && node.type !== "COMPONENT_SET") add("NAME-04", node, path, nameCount[n] + "× '" + n + "'");
      for (let i = node.children.length - 1; i >= 0; i--) {
        const c = node.children[i];
        stack.push({ node: c, depth: depth + 1, path: path + " › " + c.name, inComponent: childInComponent });
      }
    }
  }
}

function describeText(n) {
  const fam = n.fontName === figma.mixed ? "mixed" : n.fontName.family + " " + n.fontName.style;
  const size = n.fontSize === figma.mixed ? "mixed" : n.fontSize;
  const lh = n.lineHeight === figma.mixed ? "mixed" : (n.lineHeight.unit === "AUTO" ? "auto" : n.lineHeight.value + (n.lineHeight.unit === "PERCENT" ? "%" : ""));
  return fam + " " + size + "/" + lh;
}

async function checkPaints(node, path) {
  for (const prop of ["fills", "strokes"]) {
    if (!(prop in node) || node[prop] === figma.mixed) continue;
    const styleId = prop === "fills" ? node.fillStyleId : node.strokeStyleId;
    if (typeof styleId === "string" && styleId !== "") {
      if (!(await styleBound(styleId))) add("VAR-14", node, path, prop + " use a paint style without variables");
      continue;
    }
    if (styleId === figma.mixed) continue;
    for (const p of node[prop]) {
      if (p.visible === false || p.type !== "SOLID") continue;
      if (p.boundVariables && p.boundVariables.color) {
        const v = await getVar(p.boundVariables.color.id);
        if (v) {
          const c = await getColl(v.variableCollectionId);
          if (isPrimitive(v, c)) add("VAR-06", node, path, prop + " → " + v.name, "semantic token");
        }
        continue;
      }
      const k = colorKey(p.color, p.opacity === undefined ? 1 : p.opacity);
      const sug = suggestColor(k);
      const rule = prop === "fills" ? "VAR-02" : "VAR-03";
      add(sug ? rule : rule + "-offsystem", node, path, prop + " " + k, sug ? sug.join(" | ") : "no matching variable");
    }
  }
  if ("strokes" in node && node.strokes !== figma.mixed && node.strokes.some(p => p.visible !== false) && "strokeWeight" in node) {
    const bv = node.boundVariables || {};
    const bound = bv.strokeWeight || bv.strokeTopWeight || bv.strokeLeftWeight;
    if (node.strokeWeight !== figma.mixed && node.strokeWeight > 0 && !bound) {
      const sug = suggestFloat("stroke", node.strokeWeight);
      add("VAR-12", node, path, "stroke " + node.strokeWeight + (PROFILE.strokeScale.includes(node.strokeWeight) ? "" : " (off scale)"), sug ? sug.join(" | ") : "stroke/*");
    }
  }
  if ("effects" in node && node.effects.length && node.effects.some(e => e.visible !== false) && !node.effectStyleId) add("VAR-10", node, path, node.effects.map(e => e.type).join(","), "shadow/* effect style");
}

function checkGeometry(node, path, isRoot) {
  if (!("cornerRadius" in node)) return;
  const bv = node.boundVariables || {};
  const corners = node.cornerRadius === figma.mixed
    ? [["topLeftRadius", node.topLeftRadius], ["topRightRadius", node.topRightRadius], ["bottomLeftRadius", node.bottomLeftRadius], ["bottomRightRadius", node.bottomRightRadius]]
    : [["topLeftRadius", node.cornerRadius]];
  for (const [field, val] of corners) {
    if (val > 0 && !bv[field] && !bv.cornerRadius && !(node.type === "INSTANCE")) {
      const sug = suggestFloat("radius", val);
      add("VAR-05", node, path, "radius " + val, sug ? sug.join(" | ") : "radius/*");
      break;
    }
  }
  if (!isRoot && ["FRAME", "INSTANCE", "COMPONENT"].includes(node.type)) {
    const frac = v => Math.abs(v - Math.round(v)) > 0.01;
    if (frac(node.width) || frac(node.height)) add("LAY-11", node, path, node.width.toFixed(2) + "×" + node.height.toFixed(2));
  }
}

function checkSpacing(node, path) {
  const bv = node.boundVariables || {};
  const fields = ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"];
  if (node.primaryAxisAlignItems !== "SPACE_BETWEEN") fields.push("itemSpacing");
  if (node.layoutWrap === "WRAP" && node.counterAxisSpacing !== null) fields.push("counterAxisSpacing");
  for (const f of fields) {
    const v = node[f];
    if (typeof v !== "number" || v === 0 || bv[f]) continue;
    const sug = suggestFloat("space", v);
    add("VAR-04", node, path, f + " " + v, sug ? sug.join(" | ") : "space/*");
    if (!onSpaceScale(v)) add("VAR-13", node, path, f + " " + v, "multiple of " + PROFILE.spaceStep);
  }
}

function checkComponent(node, path) {
  if (node.description === "" || node.description === undefined) add("COMP-09", node, path, "no description");
  if (!node.name.includes("/")) add("COMP-06", node, path, node.name, "Category/Name/Detail");
  let defs;
  try { defs = node.componentPropertyDefinitions; } catch (e) { return; }
  const keys = Object.keys(defs);
  let nonVariant = 0;
  let stateValues = [];
  for (const k of keys) {
    const d = defs[k];
    const clean = k.split("#")[0];
    if (d.type !== "VARIANT") { nonVariant++; continue; }
    if (/^property\s*\d+$/i.test(clean)) add("COMP-04", node, path, "property '" + clean + "'");
    else if (clean !== clean.toLowerCase() || /\s/.test(clean)) add("COMP-07", node, path, "property '" + clean + "'", clean.toLowerCase().replace(/\s+/g, "-"));
    for (const val of d.variantOptions || []) {
      if (/^variant\s*\d+$/i.test(val)) add("COMP-04", node, path, clean + "=" + val);
      else if (val !== val.toLowerCase() || /\s/.test(val)) add("COMP-07", node, path, clean + "=" + val, val.toLowerCase().replace(/\s+/g, "-"));
    }
    if (/^(state|status|interaction)$/i.test(clean)) stateValues = (d.variantOptions || []).map(v => v.toLowerCase());
  }
  if (node.type === "COMPONENT_SET") {
    const n = node.children.length;
    if (n > 48 || (n > 12 && nonVariant === 0)) add("COMP-08", node, path, n + " variants, " + nonVariant + " non-variant properties");
  }
  if (INTERACTIVE.test(node.name)) {
    const missing = PROFILE.requiredStates.filter(s => !stateValues.includes(s));
    if (missing.length) add("COMP-05", node, path, "states: " + (stateValues.join(",") || "none"), "missing " + missing.join(","));
  }
}

let roots = [];
if (TARGET_IDS.length) {
  for (const id of TARGET_IDS) { const n = await figma.getNodeByIdAsync(id); if (n) roots.push(n); }
} else roots = page.children.slice();

const loose = page.children.filter(n => !["FRAME", "SECTION", "COMPONENT", "COMPONENT_SET"].includes(n.type)).map(n => ({ id: n.id, name: n.name, type: n.type }));

const screenRoots = [];
for (const r of roots) {
  if (r.type === "SECTION") { for (const c of r.children) if (c.type === "FRAME") screenRoots.push(c); }
  else screenRoots.push(r);
}

for (const r of screenRoots) {
  let info = null;
  if (r.type === "FRAME") {
    const dm = deviceMatch(r.width, r.height);
    const parsed = parseScreenName(r.name);
    info = {
      id: r.id, name: r.name, size: Math.round(r.width) + "×" + Math.round(r.height),
      device: dm ? dm.key : null, exactSize: dm ? dm.exact : false, tall: dm ? !!dm.tall : false,
      base: parsed.base, states: parsed.states, hasInput: false,
      chrome: {
        statusBar: !!r.findOne(n => /status ?bar/i.test(n.name)),
        island: !!r.findOne(n => /dynamic ?island|island|notch|camera/i.test(n.name)),
        homeIndicator: !!r.findOne(n => /home ?indicator|gesture ?bar|navigation ?handle/i.test(n.name)),
        systemNav: !!r.findOne(n => /system ?nav|navigation ?bar|nav ?bar/i.test(n.name))
      },
      annotations: r.annotations ? r.annotations.length : 0
    };
    if (dm && !parsed.wellFormed) add("NAME-02", r, r.name, r.name, "ScreenName / State");
    if (dm) {
      const ins = PROFILE.safeInsets[dm.key];
      if (ins) {
        const rb = box(r);
        const H = dm.exact ? rb.height : Number(dm.key.split("x")[1]);
        const kids = r.findAll(n => (n.type === "TEXT" || n.type === "INSTANCE") && n.visible !== false && !CHROME_OK.test(n.name) && !(n.parent && CHROME_OK.test(n.parent.name)));
        for (const k of kids.slice(0, 400)) {
          const b = box(k);
          if (!b) continue;
          const top = b.y - rb.y, bottom = b.y + b.height - rb.y, left = b.x - rb.x, right = b.x + b.width - rb.x;
          if ((ins[0] && top < ins[0] && bottom > 0) || (ins[1] && bottom > H - ins[1] && top < H) || (ins[2] && left < ins[2]) || (ins[3] && right > rb.width - ins[3])) {
            add("PLAT-03", k, r.name + " › " + k.name, "inside unsafe zone", "insets T" + ins[0] + " B" + ins[1] + " L" + ins[2] + " R" + ins[3]);
          }
        }
      }
    }
    if (dm || TARGET_IDS.length) {
      for (const t of r.findAllWithCriteria({ types: ["TEXT"] })) {
        if (t.visible !== false && PLACEHOLDER.test(t.characters.trim())) add("STATE-07", t, r.name + " › " + t.name, t.characters.slice(0, 40));
      }
    }
    screens.push(info);
  }
  await walk(r, info);
}

const groups = {};
for (const s of screens) {
  if (!s.device) continue;
  const key = s.base;
  if (!groups[key]) groups[key] = { screens: 0, states: new Set(), hasInput: false, tall: false, devices: new Set() };
  const g = groups[key];
  g.screens++;
  s.states.forEach(x => g.states.add(x));
  if (!s.states.length) g.states.add("default?");
  if (s.hasInput) g.hasInput = true;
  if (s.tall) g.tall = true;
  g.devices.add(s.device);
}
const stateMatrix = Object.entries(groups).map(([base, g]) => {
  const present = [...g.states];
  const missing = PROFILE.coreScreenStates.filter(x => !present.includes(x) && !(x === "default" && present.includes("default?")));
  if (g.hasInput && !present.includes("keyboard")) missing.push("keyboard");
  if (g.tall && !present.includes("scrolled")) missing.push("scrolled");
  return { screen: base, frames: g.screens, present, missing, devices: [...g.devices] };
});

return {
  page: { id: page.id, name: page.name },
  profile: { platform: PROFILE.platform, minTarget: PROFILE.minTarget, spaceStep: PROFILE.spaceStep },
  counters,
  pageRoot: { loose },
  screens: screens.map(s => ({ id: s.id, name: s.name, size: s.size, device: s.device, exactSize: s.exactSize, tall: s.tall, states: s.states, hasInput: s.hasInput, chrome: s.chrome, annotations: s.annotations })),
  stateMatrix,
  fonts,
  transitions: transitionMs,
  findings
};
