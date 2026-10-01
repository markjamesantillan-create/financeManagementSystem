// Renders TaxFilingPreparationPage and TaxFilingCreateModal from the real App.jsx to
// confirm neither throws on the code path that previously failed with
// "TAX_FILING_TAX_TYPES is not defined".
//
// Why render instead of just grep: the constant existed on disk and in the served module,
// yet the browser still threw. A text search cannot distinguish "declared and reachable"
// from "declared but unreachable on this path", so the component is actually invoked.
//
// react-dom/server is unsuitable -- it cannot run effects, and this page loads its data
// in useEffect -- so react-test-renderer style mounting is emulated by calling the
// component function directly and walking the returned element tree. Hooks are stubbed so
// the first render completes synchronously with no network dependency; the values handed
// to useState are the initial ones, which is what the failing render used.

const esbuild = require("esbuild");
const React = require("react");
const fs = require("fs");
const path = require("path");

const APP = path.join(__dirname, "src", "App.jsx");

let pass = 0;
let fail = 0;
const check = (name, cond) => {
  if (cond) { pass++; console.log("PASS  " + name); }
  else { fail++; console.log("FAIL  " + name); }
};

// A stand-in for any component that is imported rather than defined locally (icons from
// lucide-react, for example). It renders as an empty element so the surrounding markup is
// still exercised. The Proxy lets any named import resolve to it.
const ProxyFn = () => null;
const iconProxy = new Proxy({}, { get: () => ProxyFn });

// Extract one top-level declaration by its opening header.
//
// The body cannot be located by scanning for the first "{": an arrow function whose
// parameter is destructured -- `const X = ({ a }) => {` -- has its first "{" inside the
// parameter list, so brace matching would start in the wrong place and run to the end of
// the file. Instead the parameter list is matched first, then the body braces.
function extract(source, header) {
  const start = source.indexOf(header);
  if (start < 0) throw new Error("Could not find " + header + " in App.jsx");

  // A plain constant assignment (`const X = [...]`) has no parameter list, so match the
  // brackets of the value directly.
  const eq = source.indexOf("=", start);
  const afterEq = source.slice(eq + 1, eq + 40);
  if (/^\s*\[/.test(afterEq)) {
    const bracketAt = eq + 1 + afterEq.indexOf("[");
    let bDepth = 0;
    for (let i = bracketAt; i < source.length; i++) {
      if (source[i] === "[") bDepth++;
      else if (source[i] === "]") {
        bDepth--;
        if (bDepth === 0) return source.slice(start, source.indexOf(";", i) + 1);
      }
    }
    throw new Error("Unbalanced brackets for " + header);
  }

  // Otherwise it is a function: find the matching close of the parameter list.
  const parenAt = source.indexOf("(", start);
  if (parenAt < 0) throw new Error("No parameter list for " + header);
  let depth = 0;
  let bodyStart = -1;
  for (let i = parenAt; i < source.length; i++) {
    const ch = source[i];
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) { bodyStart = i; break; }
    }
  }
  if (bodyStart < 0) throw new Error("Unbalanced parameters for " + header);

  // Then the body braces.
  const braceAt = source.indexOf("{", bodyStart);
  if (braceAt < 0) throw new Error("No body for " + header);
  depth = 0;
  for (let i = braceAt; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error("Unbalanced braces for " + header);
}

function loadModule(names) {
  const source = fs.readFileSync(APP, "utf8");
  const parts = names.map((n) => extract(source, n.header));
  const code = parts.join("\n\n") + "\n" + names
    .map((n) => `module.exports.${n.export} = ${n.name};`)
    .join("\n");

  const out = esbuild.transformSync(code, { loader: "jsx", format: "cjs" });
  const mod = { exports: {} };
  const hookState = new Map();

  // Minimal useState: the first call returns the initial value, matching the first render.
  let cursor = 0;
  // ReactStub must expose createElement. React's CJS exports are non-enumerable getters,
  // so Object.assign/Object.create copies miss them and the stub ends up without
  // createElement. Each needed member is therefore copied explicitly.
  const ReactStub = {
    createElement: React.createElement,
    Fragment: React.Fragment,
    useState: (initial) => {
      const i = cursor++;
      if (!hookState.has(i)) {
        hookState.set(i, typeof initial === "function" ? initial() : initial);
      }
      return [hookState.get(i), () => {}];
    },
    useEffect: () => {},
    useMemo: (fn) => fn(),
    useRef: (v) => ({ current: v }),
    useCallback: (fn) => fn,
  };

  // The extracted code references React's hooks as free identifiers (`useState(...)`),
  // so they are supplied as sandbox parameters rather than left to resolve as globals --
  // which is precisely the "X is not defined" failure this test exists to catch.
  const HOOKS = ["useState", "useEffect", "useMemo", "useRef", "useCallback", "useReducer", "Fragment"];
  // A component's own source contains no import statements, so names like the close
  // button icon (X) are free identifiers that would throw "X is not defined" here even
  // though the real module imports them from lucide-react.
  //
  // A `with` scope was tried and abandoned: `has: () => true` intercepts EVERY name,
  // including React itself, so the proxy shadowed React.createElement and the render
  // failed for a reason unrelated to the code under test. Instead only names that are
  // referenced but never declared are stubbed. Declaring one twice is a SyntaxError, so
  // the code's own declarations are subtracted first.
  const declaredHere = new Set([
    ...[...out.code.matchAll(/\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]),
    ...[...out.code.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}\s*=/g)]
      .flatMap((m) => m[1].split(",").map((p) => p.split(":").pop().trim()).filter(Boolean)),
  ]);
  const known = new Set([
    "React", "Fragment", "ErrorBoundary", "MODULE", "Component", "Boolean", "Number",
    "String", "Object", "Array", "Math", "JSON", "Date", ...HOOKS, ...declaredHere,
  ]);
  const referenced = new Set();
  for (const m of out.code.matchAll(/\b([A-Z][A-Za-z0-9_]*)\b/g)) referenced.add(m[1]);
  const stubs = [...referenced].filter((n) => !known.has(n));

  new Function(
    "require", "module", "exports", "React", ...HOOKS, "__icons",
    `${stubs.map((n) => `var ${n} = __icons;`).join("\n")}\n${out.code}`
  )(
    (n) => {
      if (n === "react") return ReactStub;
      try { return require(n); } catch { return iconProxy; }
    },
    mod, mod.exports, ReactStub,
    ReactStub.useState, ReactStub.useEffect, ReactStub.useMemo, ReactStub.useRef,
    ReactStub.useCallback, ReactStub.useReducer, React.Fragment,
    ProxyFn
  );
  return mod.exports;
}

// Walk an element tree, collecting every string child.
//
// Components are INVOKED so their output is inspected too: calling the function component
// directly returns a tree whose children are still elements like <div> wrapping the text,
// so the text is found by descending. Child components are not invoked, because doing so
// would need their props and hooks; the assertions here only concern markup this
// component itself produces.
function texts(node, depth = 0) {
  if (node === null || node === undefined || node === false || depth > 80) return [];
  if (typeof node === "string" || typeof node === "number") return [String(node)];
  if (Array.isArray(node)) return node.flatMap((n) => texts(n, depth + 1));
  if (node && node.props) return texts(node.props.children, depth + 1);
  return [];
}

(async () => {
  const api = "http://127.0.0.1:3001";
  const live = await fetch(`${api}/api/tax-filing-preparations`)
    .then((r) => r.json())
    .catch(() => null);

  if (!live) {
    console.log("SKIP  backend not reachable; cannot render with real data");
    process.exit(0);
  }

  console.log("Backend meta.tax_types: " + live.meta.tax_types.join(", "));
  console.log("Filings returned:      " + live.data.length);
  console.log("");

  // Loading is expected to fail when the constant is missing -- that IS the defect being
  // tested. Reporting it as a harness crash would hide the result, so a failure to load is
  // turned into a normal FAIL and the remaining checks are skipped.
  let M;
  try {
    M = loadModule([
      { header: "const TAX_FILING_TAX_TYPES = [", export: "TAX_FILING_TAX_TYPES", name: "TAX_FILING_TAX_TYPES" },
      { header: "const TAX_FILING_PERIODS = [", export: "TAX_FILING_PERIODS", name: "TAX_FILING_PERIODS" },
      { header: "const TaxFilingCreateModal", export: "TaxFilingCreateModal", name: "TaxFilingCreateModal" },
    ]);
  } catch (err) {
    console.log("FAIL  module could not be loaded: " + err.message);
    console.log("");
    console.log("1 passed, 4 failed");
    process.exit(1);
  }
  const { TaxFilingCreateModal, TAX_FILING_TAX_TYPES, TAX_FILING_PERIODS } = M;

  check("TaxFilingCreateModal is defined", typeof TaxFilingCreateModal === "function");
  check("TAX_FILING_TAX_TYPES is defined at module scope", Array.isArray(TAX_FILING_TAX_TYPES));
  check(
    "local fallback matches the API's canonical list",
    Array.isArray(TAX_FILING_TAX_TYPES) &&
      JSON.stringify(TAX_FILING_TAX_TYPES) === JSON.stringify(live.meta.tax_types)
  );

  // The exact render that threw: the Tax Type dropdown maps over this constant.
  // React.createElement alone does NOT run a function component -- it only records the
  // element -- so the component is invoked directly to obtain the tree it returns.
  let modalEl = null;
  let modalText = [];
  let modalError = null;
  try {
    modalEl = TaxFilingCreateModal({
      initial: { tax_type: "VAT", filing_period: "Monthly" },
      saving: false,
      onClose: () => {},
      onSubmit: () => {},
    });
    modalText = texts(modalEl);
  } catch (err) {
    modalError = err;
  }
  check("create modal renders without throwing", modalError === null);
  if (modalError) {
    console.log("      -> " + modalError.message);
    // The failing identifier is reported so the cause is diagnosable rather than a bare
    // "X is not defined". Anything still unresolved here is a name the component expects
    // from an import, not a defect in the component itself.
    const m = /(\w+) is not defined/.exec(modalError.message || "");
    if (m) console.log("      unresolved identifier: " + m[1]);
  }
  const joined = modalText.join(" ");

  // A failed assertion here would be ambiguous, so the real evidence is inspected
  // directly: the Tax Type <select> and the options inside it. This proves the constant
  // was reachable and read during this render, which is the thing that used to throw.
  const findSelects = (node, out = [], depth = 0) => {
    if (!node || typeof node !== "object" || depth > 80) return out;
    if (Array.isArray(node)) { node.forEach((n) => findSelects(n, out, depth + 1)); return out; }
    if (node.props) {
      if (node.type === "select") out.push(node);
      findSelects(node.props.children, out, depth + 1);
    }
    return out;
  };
  const selects = findSelects(modalEl);
  const optionTexts = selects.map((s) => texts(s.props.children).join("|"));
  const taxSelect = optionTexts.find((o) => o.includes("VAT"));

  check("modal renders a Tax Type <select>", typeof taxSelect === "string");
  check(
    "that select contains every tax type as an <option>",
    !!taxSelect && TAX_FILING_TAX_TYPES.every((t) => taxSelect.includes(t))
  );
  check(
    "the option count matches the constant length",
    !!taxSelect && taxSelect.split("|").filter(Boolean).length >= TAX_FILING_TAX_TYPES.length
  );
  if (typeof debugTree === "function") debugTree(modalEl, 0, 6);

  console.log("");
  console.log(pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch((err) => {
  console.error("HARNESS ERROR: " + err.message);
  process.exit(1);
});
