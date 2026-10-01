// Detects references to identifiers that are never declared anywhere in a source file.
//
// WHY THIS EXISTS
// An unresolved identifier is legal JavaScript: it parses as a global reference and only
// throws when that code path actually runs. `vite build` is therefore useless for
// catching this, and the failure only appears in the browser as
// "ReferenceError: X is not defined".
//
// Three separate bugs of exactly this shape reached the browser in this project (a chart
// reading `monthly`, this page reading `TAX_FILING_TAX_TYPES`, and a page reading
// `TAX_FILING_STATUSES`), so this check exists to find the whole class rather than one
// name at a time.
//
// HOW IT WORKS
// The file is parsed with the same Babel parser the React plugin uses, then every binding
// is collected by walking the whole tree: imports, function/class declarations, and all
// forms of variable declaration. A reference is reported only when its name is absent
// from BOTH the collected bindings and the list of standard globals/JSX intrinsics.
//
// Scoping is deliberately coarse. A name declared inside a function counts as declared
// file-wide, so this cannot produce false positives -- it may miss a reference that is out
// of scope, but it never flags a correct one. Precision is the wrong trade here: a
// checker that cries wolf gets ignored.

const path = require("path");
const fs = require("fs");
const parser = require("@babel/parser");

const APP = path.join(__dirname, "src", "App.jsx");

// Names the runtime provides. Anything outside this list that is referenced but never
// bound is a genuine mistake.
const GLOBALS = new Set([
  "Array", "ArrayBuffer", "BigInt", "Boolean", "console", "crypto", "Date", "decodeURI",
  "decodeURIComponent", "document", "encodeURI", "encodeURIComponent", "Error", "escape",
  "eval", "Event", "fetch", "File", "FileReader", "FormData", "Function", "Headers",
  "Infinity", "Intl", "isFinite", "isNaN", "JSON", "Map", "Math", "NaN", "Number",
  "Object", "parseFloat", "parseInt", "Promise", "Proxy", "RegExp", "Request", "Response",
  "Set", "String", "Symbol", "TextDecoder", "TextEncoder", "this", "true", "false",
  "null", "undefined", "URL", "URLSearchParams", "WeakMap", "WeakSet", "window",
  "globalThis", "clearTimeout", "setTimeout", "clearInterval", "setInterval",
  "queueMicrotask", "structuredClone", "AbortController", "localStorage", "sessionStorage",
  "performance", "navigator", "location", "history", "alert", "confirm", "prompt",
  "indexedDB", "IDBKeyRange", "DOMParser", "IntersectionObserver", "ResizeObserver",
  "MutationObserver", "requestAnimationFrame", "cancelAnimationFrame", "getComputedStyle",
  "import", "require", "super", "arguments", "Float32Array", "Float64Array", "Uint8Array",
  "Int8Array", "Uint8ClampedArray", "Int16Array", "Uint16Array", "Int32Array", "Uint32Array",
  "BigInt64Array", "BigUint64Array",
  // React JSX runtime identifiers used across the file.
  "React", "Fragment", "createElement", "jsx", "jsxs", "jsxDEV", "_jsx", "_jsxs",
]);

// Lowercase HTML/SVG tags appear as JSX element names and are not variables.
const isIntrinsicTag = (name) => /^[a-z][a-z0-9-]*$/.test(name);

// SVG element names are written in camelCase (<linearGradient>, <clipPath>, <feGaussianBlur>)
// and so are indistinguishable from component names by shape alone. Recharts charts embed
// these, so the known set is listed rather than guessing.
const SVG_TAGS = new Set([
  "linearGradient", "radialGradient", "clipPath", "textPath", "foreignObject",
  "feGaussianBlur", "feOffset", "feBlend", "feColorMatrix", "feComponentTransfer",
  "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap",
  "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG",
  "feFuncR", "feImage", "feMerge", "feMergeNode", "feMorphology", "fePointLight",
  "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence", "animateMotion",
  "animateTransform", "mpath", "textPath", "altGlyph", "altGlyphDef", "altGlyphItem",
  "glyphRef", "view", "symbol", "marker", "mask", "pattern", "filter",
]);

const SKIP_KEYS = new Set([
  "loc", "start", "end", "leadingComments", "trailingComments", "innerComments", "extra",
]);

// Walk every node, collecting bindings and identifier/JSX references.
function analyse(ast) {
  const bindings = new Set();
  const refs = [];

  const addPattern = (node) => {
    if (!node) return;
    switch (node.type) {
      case "Identifier": bindings.add(node.name); return;
      case "ObjectPattern": node.properties.forEach(addPattern); return;
      case "ArrayPattern": node.elements.forEach(addPattern); return;
      case "AssignmentPattern": addPattern(node.left); return;
      case "RestElement": addPattern(node.argument); return;
      // A destructured parameter such as ({ tax_type }) => ... is an ObjectProperty,
      // not an Identifier, so it must be followed to reach the bound name.
      case "ObjectProperty":
      case "Property": addPattern(node.value); return;
      default: return;
    }
  };

  // A function's parameter destructuring introduces real bindings: ({ tax_type }) => ...
  const addParams = (node) => {
    (node.params || []).forEach(addPattern);
  };

  // `catch (cause)` binds a name, exactly like a function parameter does.
  const addCatchParam = (node) => {
    if (node && node.param) addPattern(node.param);
  };

  // A class body introduces method names AND their parameter bindings. A method such as
  // `constructor(props)` binds `props` and `componentDidCatch(error, info)` binds `info`.
  const addClassBody = (node) => {
    (node.body || []).forEach((member) => {
      const key = member && member.key;
      if (key && key.name) bindings.add(key.name);
      if (member && member.params) addParams(member);
    });
  };

  const declare = (node) => {
    if (!node) return;
    switch (node.type) {
      case "VariableDeclarator": addPattern(node.id); return;
      case "FunctionDeclaration":
      case "FunctionExpression":
        if (node.id) bindings.add(node.id.name);
        addParams(node);
        return;
      case "ArrowFunctionExpression":
        addParams(node);
        return;
      case "ClassDeclaration":
      case "ClassExpression":
        if (node.id) bindings.add(node.id.name);
        return;
      default: return;
    }
  };

  // Pass 1: collect every binding declared anywhere in the file.
  (function collect(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(collect); return; }
    const t = node.type;
    if (t === "ImportDeclaration") {
      node.specifiers.forEach((s) => bindings.add(s.local.name));
      return;
    }
    if (t === "VariableDeclaration") node.declarations.forEach(declare);
    if (t === "CatchClause") { addCatchParam(node); collect(node.body); return; }
    if (t === "FunctionDeclaration" || t === "FunctionExpression"
      || t === "ArrowFunctionExpression" || t === "ClassDeclaration"
      || t === "ClassExpression") declare(node);
    if (t === "ClassBody") { addClassBody(node); return; }
    // A non-computed property key is a NAME, not a reference, so it is not descended
    // into -- otherwise `{ type: "x" }` looks like a read of an undefined `type`.
    if (t === "Property" || t === "ObjectProperty") {
      // Shorthand `{ message }` does read the variable, so its value is followed.
      if (node.computed || node.shorthand) collect(node.value);
      return;
    }
    if (t === "ObjectMethod" || t === "ClassMethod" || t === "ClassProperty") return;
    if (t === "OptionalMemberExpression") { collect(node.object); return; }
    if (t === "ThisExpression") return;
    if (t === "MemberExpression") {
      if (node.computed) collect(node.property);
      collect(node.object);
      return;
    }
    if (t === "JSXAttribute") { collect(node.value); return; }
    for (const key of Object.keys(node)) {
      if (SKIP_KEYS.has(key)) continue;
      collect(node[key]);
    }
  })(ast.program);

  // Pass 2: collect references.
  (function gather(node, parent) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach((n) => gather(n, parent)); return; }
    const t = node.type;
    if (t === "Identifier") {
      // Keys of non-computed properties, computed member keys, and JSX attribute
      // names are all names rather than reads, so none of them are references.
      if (parent === "PropKey" || parent === "MemberComputed" || parent === "JSXAttrName") return;
      refs.push({ name: node.name, line: node.loc ? node.loc.start.line : 0 });
      return;
    }
    if (t === "JSXIdentifier") {
      if (isIntrinsicTag(node.name) || SVG_TAGS.has(node.name)) return;
      if (parent === "JSXAttrName" || parent === "JSXNamespacedName") return;
      refs.push({ name: node.name, line: node.loc ? node.loc.start.line : 0 });
      return;
    }
    // <linearGradient> and <clipPath> are real SVG tags written with capitals, and
    // Babel wraps them in a JSXMemberExpression. Neither half is a variable reference.
    if (t === "JSXMemberExpression") return;
    // `summary?.total_accounts` reads a property, it does not read a variable named
    // total_accounts. Only the OBJECT of the member is a reference.
    if (t === "OptionalMemberExpression") {
      gather(node.object, "OptMemberObject");
      return;
    }
    if (t === "ThisExpression") {
      // `this.props` / `this.state` are properties of the instance.
      return;
    }
    if (t === "Property" || t === "ObjectProperty") {
      if (node.computed) gather(node.key, "PropKey");
      // Shorthand `{ message }` is a real read of the variable.
      if (node.computed || node.shorthand) gather(node.value, "PropValue");
      return;
    }
    if (t === "MemberExpression") {
      if (node.computed) gather(node.property, "MemberComputed");
      gather(node.object, "MemberObject");
      return;
    }
    if (t === "JSXAttribute") { gather(node.name, "JSXAttrName"); gather(node.value, "JSXAttrValue"); return; }
    for (const key of Object.keys(node)) {
      if (SKIP_KEYS.has(key)) continue;
      gather(node[key], t);
    }
  })(ast.program, null);

  return { bindings, refs };
}

const source = fs.readFileSync(APP, "utf8");
let ast;
try {
  ast = parser.parse(source, {
    sourceType: "module",
    allowReturnOutsideFunction: true,
    plugins: ["jsx"],
    errorRecovery: true,
  });
} catch (err) {
  console.error("Could not parse " + path.basename(APP) + ": " + err.message);
  process.exit(1);
}

const { bindings, refs } = analyse(ast);

const unknown = new Map();
for (const ref of refs) {
  if (!ref.name) continue;
  if (bindings.has(ref.name) || GLOBALS.has(ref.name)) continue;
  if (!unknown.has(ref.name)) unknown.set(ref.name, []);
  unknown.get(ref.name).push(ref.line);
}

console.log("Scanned:       " + path.basename(APP));
console.log("Bindings:      " + bindings.size);
console.log("References:    " + refs.length);
console.log("");

if (unknown.size === 0) {
  console.log("PASS  no unresolved identifiers");
  process.exit(0);
}

console.log("FAIL  " + unknown.size + " unresolved identifier(s):");
for (const [name, lines] of [...unknown.entries()].sort()) {
  console.log("  " + name + "  (lines " + [...new Set(lines)].slice(0, 10).join(", ") + ")");
}
process.exit(1);
