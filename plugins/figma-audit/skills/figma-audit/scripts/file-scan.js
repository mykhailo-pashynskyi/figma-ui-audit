const DARK_IN_SCOPE = "__DARK_IN_SCOPE__" === "true";
const CODE_PLATFORM = "__CODE_PLATFORM__";
const SAMPLE = 25;

const EXPECTED_PAGES = ["Design System", "Components", "Screens", "Prototypes", "Archive"];
const VAR_NAME = /^[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*$/;
const DARK_DUP = /(^|\/)dark(\/|-|$)|-dark$|\bdark\b/i;
const BAD_TEXT_STYLE = /\b(\d+\s?(px|pt|sp)|style\s?\d+|text style|final|new|copy|v\d+|big|small text|heading final)\b|roboto|\binter\b|sf pro|helvetica|arial|montserrat|poppins|open sans|\blato\b/i;

function cap(list) { return { count: list.length, samples: list.slice(0, SAMPLE) }; }

const pages = figma.root.children.map((p, i) => ({ index: i, id: p.id, name: p.name }));
const pageNames = pages.map(p => p.name.trim());
const missingPages = EXPECTED_PAGES.filter(n => !pageNames.some(p => p.toLowerCase() === n.toLowerCase()));
const order = EXPECTED_PAGES.map(n => pageNames.findIndex(p => p.toLowerCase() === n.toLowerCase())).filter(i => i >= 0);
const pagesInOrder = order.every((v, i) => i === 0 || v > order[i - 1]);

const colls = await figma.variables.getLocalVariableCollectionsAsync();
const vars = await figma.variables.getLocalVariablesAsync();
const byColl = {};
for (const v of vars) (byColl[v.variableCollectionId] = byColl[v.variableCollectionId] || []).push(v);

const collections = colls.map(c => {
  const list = byColl[c.id] || [];
  const missing = [];
  for (const v of list) for (const m of c.modes) if (v.valuesByMode[m.modeId] === undefined) missing.push(v.name + " @ " + m.name);
  const types = {};
  for (const v of list) types[v.resolvedType] = (types[v.resolvedType] || 0) + 1;
  return { id: c.id, name: c.name, modes: c.modes.map(m => m.name), variables: list.length, types, missingModeValues: cap(missing), hiddenFromPublishing: c.hiddenFromPublishing };
});

const colorColl = colls.find(c => /^colou?rs?$/i.test(c.name)) || colls.find(c => (byColl[c.id] || []).some(v => v.resolvedType === "COLOR"));
const darkMode = colorColl ? colorColl.modes.some(m => /dark/i.test(m.name)) : false;

const badNames = [], allScopes = [], darkDuplicates = [], codeSyntaxMissing = [];
for (const v of vars) {
  if (!VAR_NAME.test(v.name)) badNames.push(v.name);
  if (!v.scopes || v.scopes.includes("ALL_SCOPES")) allScopes.push(v.name);
  if (DARK_DUP.test(v.name)) darkDuplicates.push(v.name);
  if (CODE_PLATFORM !== "__CODE_PLATFORM__" && CODE_PLATFORM !== "none" && !(v.codeSyntax && v.codeSyntax[CODE_PLATFORM])) codeSyntaxMissing.push(v.name);
}

const textStyles = await figma.getLocalTextStylesAsync();
const ts = textStyles.map(s => ({
  id: s.id, name: s.name,
  font: s.fontName.family + " " + s.fontName.style,
  size: s.fontSize,
  lineHeight: s.lineHeight.unit === "AUTO" ? "auto" : s.lineHeight.value + (s.lineHeight.unit === "PERCENT" ? "%" : ""),
  letterSpacing: s.letterSpacing.value + (s.letterSpacing.unit === "PERCENT" ? "%" : ""),
  boundVariables: Object.keys(s.boundVariables || {})
}));
const families = [...new Set(textStyles.map(s => s.fontName.family))];

const effectStyles = (await figma.getLocalEffectStylesAsync()).map(s => ({ id: s.id, name: s.name, effects: s.effects.map(e => e.type) }));
const paintStyles = (await figma.getLocalPaintStylesAsync()).map(s => ({ id: s.id, name: s.name, bound: s.paints.some(p => p.boundVariables && p.boundVariables.color) }));

return {
  file: { name: figma.root.name },
  pages: { list: pages, missing: missingPages, inOrder: pagesInOrder },
  collections,
  darkMode: { inScope: DARK_IN_SCOPE, colorCollection: colorColl ? colorColl.name : null, hasDarkMode: darkMode },
  variables: {
    total: vars.length,
    badNames: cap(badNames),
    allScopes: cap(allScopes),
    darkDuplicates: cap(darkDuplicates),
    codeSyntaxMissing: CODE_PLATFORM === "__CODE_PLATFORM__" || CODE_PLATFORM === "none" ? null : cap(codeSyntaxMissing)
  },
  textStyles: {
    total: ts.length,
    list: ts.slice(0, 60),
    families,
    badNames: cap(ts.filter(s => BAD_TEXT_STYLE.test(s.name)).map(s => s.name)),
    autoLineHeight: cap(ts.filter(s => s.lineHeight === "auto").map(s => s.name))
  },
  effectStyles: { total: effectStyles.length, list: effectStyles.slice(0, 40), badNames: cap(effectStyles.filter(s => !/^(shadow|blur|elevation)\//i.test(s.name)).map(s => s.name)) },
  paintStyles: { total: paintStyles.length, unbound: cap(paintStyles.filter(s => !s.bound).map(s => s.name)) }
};
