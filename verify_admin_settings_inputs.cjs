// Drives AdminSettingsPage from the real App.jsx through page switches and asserts it never
// hands React an input that flips between controlled and uncontrolled.
//
// WHY THIS EXISTS
// The browser logged "A component is changing an uncontrolled input to be controlled" with
// AdminSettingsPage at the head of the component stack. React raises that warning when an
// input's `value` prop is `undefined` on one render and a real value on the next. That is
// precisely what rebuilding the form state inside a useEffect does: when `page` changes, the
// new page's fields render against the *previous* page's state, so their keys are missing
// and their values are `undefined` for one commit. The effect then fills them in and React
// reports the transition. A `?? field.value ?? ""` fallback hides the crash but not the
// cause -- the input would then be showing a value that the form state does not hold.
//
// HOW IT WORKS
// No DOM (jsdom) is installed, and renderToString cannot run effects, so this emulates a
// react-test-renderer style mount: hooks are stubbed, the component is invoked directly, and
// its returned element tree is walked. State updates are applied and the component re-rendered
// until it settles, effects run on mount and whenever their dependencies change, and a
// setState issued *during* render discards that pass and re-renders -- which is what React
// does with a render-phase update. The component body is extracted from App.jsx and compiled
// with esbuild (the same transform the bundler applies) so the real source is exercised.

const esbuild = require("esbuild");
const React = require("react");
const fs = require("fs");
const path = require("path");

// Usage: node verify_admin_settings_inputs.cjs [path/to/App.jsx]
// The optional path exists so the harness can be pointed at a deliberately regressed copy
// of the source to confirm it actually fails on the bug it is guarding against.
const APP = process.argv[2] || path.join(__dirname, "src", "App.jsx");

let pass = 0;
let fail = 0;
const check = (name, cond) => {
  if (cond) { pass++; console.log("PASS  " + name); }
  else { fail++; console.log("FAIL  " + name); }
};

// --- module loading -----------------------------------------------------------

// The compiled component closes over `useState`/`useEffect`/`useRef` as free variables, so
// they are supplied as module parameters. Each one forwards to whichever instance the harness
// is currently rendering, which is what React's dispatcher does. `descriptions` and
// `Breadcrumb` live in App.jsx outside the extracted range and the lucide icons are
// imported, so they are stubbed too -- they render as empty elements.
let currentHooks = null;
const unbound = (name) => { throw new Error(name + " was called with no instance bound"); };

const scope = {
  useState: (initial) => (currentHooks ? currentHooks.useState(initial) : unbound("useState")),
  useEffect: (fn, deps) => (currentHooks ? currentHooks.useEffect(fn, deps) : unbound("useEffect")),
  useRef: (v) => (currentHooks ? currentHooks.useRef(v) : unbound("useRef")),
  Breadcrumb: () => null,
  descriptions: new Proxy({}, { get: () => "description" }),
  RotateCcw: () => null,
  CheckCircle2: () => null,
};

// `adminSettingFields` and `AdminSettingsPage` are adjacent in App.jsx, so everything from
// the first to the start of the next top-level function is the unit under test.
async function loadAdminSettings() {
  const source = fs.readFileSync(APP, "utf8");
  const start = source.indexOf("const adminSettingFields");
  const end = source.indexOf("function AnalyticsContent");
  if (start < 0 || end < 0 || end <= start) {
    throw new Error("Could not locate the admin settings section in App.jsx");
  }
  const body = source.slice(start, end).replace(/^import .*$/gm, "");
  const out = await esbuild.transform(body, { loader: "jsx", format: "cjs" });
  const code = out.code +
    "\nmodule.exports.AdminSettingsPage = AdminSettingsPage;" +
    "\nmodule.exports.adminSettingFields = adminSettingFields;";

  const names = Object.keys(scope);
  const mod = { exports: {} };
  const factory = new Function(
    "require", "module", "exports", "Component", "React", ...names, code
  );
  factory((n) => (n === "react" ? React : require(n)), mod, mod.exports, React.Component, React,
    ...names.map((n) => scope[n]));
  return mod.exports;
}


// --- render harness ------------------------------------------------------------

const sameDeps = (a, b) => a === b || (Array.isArray(a) && Array.isArray(b)
  && a.length === b.length && a.every((v, i) => Object.is(v, b[i])));

// Every <input>/<select> in a committed tree, with the props React uses to decide
// controlled-ness.
function collectInputs(node, out = [], depth = 0) {
  if (!node || typeof node !== "object" || depth > 80) return out;
  if (Array.isArray(node)) { node.forEach((n) => collectInputs(n, out, depth + 1)); return out; }
  if (node.props) {
    if (node.type === "input" || node.type === "select") {
      out.push({
        tag: node.type,
        key: String(node.props.id || "").replace(/^setting-/, ""),
        inputType: node.props.type,
        value: node.props.value,
        hasOnChange: typeof node.props.onChange === "function",
        readOnly: !!node.props.readOnly,
      });
    }
    collectInputs(node.props.children, out, depth + 1);
  }
  return out;
}

// Mounts the component and replays a sequence of `page` prop values, recording every render
// React would actually commit.
function mount(Component, page) {
  const ctx = {
    Component,
    props: { page },
    slots: [],          // hook state, indexed like a real hook list
    pending: [],         // queued setState calls
    cursor: 0,           // hook cursor for the pass in progress
    rendering: false,    // true while the component function is running
    renderPhaseUpdate: false, // a setState was raised during the pass in progress
    collected: [],       // effects collected by the pass in progress
    effectState: [],     // deps of the last committed run of each effect
    renders: [],         // committed renders only
  };

  ctx.useState = (initial) => {
    const i = ctx.cursor++;
    if (!(i in ctx.slots)) {
      ctx.slots[i] = typeof initial === "function" ? initial() : initial;
    }
    // A setState raised while the component function is running is a render-phase update:
    // React discards that pass and re-renders rather than committing it.
    const setState = (next) => {
      ctx.pending.push({ i, next });
      if (ctx.rendering) ctx.renderPhaseUpdate = true;
    };
    return [ctx.slots[i], setState];
  };
  ctx.useEffect = (fn, deps) => { ctx.collected.push({ fn, deps }); };
  ctx.useRef = (v) => ({ current: v });

  const applyPending = () => {
    if (!ctx.pending.length) return false;
    const queued = ctx.pending.slice();
    ctx.pending.length = 0;
    queued.forEach(({ i, next }) => {
      ctx.slots[i] = typeof next === "function" ? next(ctx.slots[i]) : next;
    });
    return true;
  };

  // Invokes the component the way React does, with the hook dispatcher bound to this instance.
  const renderPass = () => {
    currentHooks = ctx;
    ctx.rendering = true;
    try {
      return ctx.Component(ctx.props);
    } finally {
      ctx.rendering = false;
      currentHooks = null;
    }
  };

  const commit = () => {
    for (let guard = 0; guard < 50; guard++) {
      ctx.cursor = 0;
      ctx.renderPhaseUpdate = false;
      ctx.pending.length = 0;
      ctx.collected = [];
      const tree = renderPass();

      // A render-phase update means React throws this output away and re-renders, so the
      // pass is neither recorded nor committed.
      if (ctx.renderPhaseUpdate) { applyPending(); continue; }

      ctx.renders.push({ page: ctx.props.page, inputs: collectInputs(tree), state: ctx.slots[0] });

      ctx.collected.forEach((eff, slot) => {
        const prev = ctx.effectState[slot];
        if (prev && sameDeps(prev.deps, eff.deps)) return;
        if (prev && typeof prev.cleanup === "function") prev.cleanup();
        eff.fn();
        ctx.effectState[slot] = { deps: eff.deps, cleanup: null };
      });

      if (!applyPending()) return;
    }
    throw new Error("render loop did not settle");
  };

  commit();
  return {
    renders: ctx.renders,
    navigate: (nextPage) => { ctx.props = { page: nextPage }; commit(); },
  };
}

const sorted = (arr) => [...arr].sort();
const sameSet = (a, b) => a.length === b.length && sorted(a).every((v, i) => sorted(b)[i] === v);

(async () => {
  const M = await loadAdminSettings();
  const { AdminSettingsPage, adminSettingFields } = M;

  check("AdminSettingsPage compiles from the real App.jsx source", typeof AdminSettingsPage === "function");
  if (typeof AdminSettingsPage !== "function") process.exit(1);

  const pages = Object.keys(adminSettingFields);
  console.log("Pages under test: " + pages.length + "\n" + pages.join("\n  ") + "\n");

  const undefinedValue = [];   // the literal React warning condition
  const driftedState = [];     // state does not describe the page being rendered
  const unbackedValue = [];    // input shows something the state does not hold
  const badFileInput = [];     // file input given a value, or left with no onChange

  pages.forEach((from) => pages.forEach((to) => {
    const run = mount(AdminSettingsPage, from);
    if (from !== to) run.navigate(to);

    const expectedKeys = adminSettingFields[to].map((f) => f.key);
    run.renders.forEach((render, index) => {
      if (render.page !== to) return;
      const where = from + " -> " + to + " (committed render " + (index + 1) + ")";

      // The page rendered must be the page the form state describes.
      const stateKeys = Object.keys(render.state || {});
      if (!sameSet(stateKeys, expectedKeys)) {
        driftedState.push(where + " | state holds {" + stateKeys.join(",")
          + "} but the page's fields are {" + expectedKeys.join(",") + "}");
      }

      render.inputs.forEach((input) => {
        const at = where + " [" + input.key + "]";
        // A file input can never be given a value; every other one must be controlled on
        // every single render, which is what React's warning is about.
        if (input.inputType === "file") {
          if (input.value !== undefined) {
            badFileInput.push(at + " | file input was given value=" + JSON.stringify(input.value));
          }
          if (!input.hasOnChange) badFileInput.push(at + " | file input has no onChange");
          return;
        }
        if (input.value === undefined) {
          undefinedValue.push(at + " | value prop is undefined, so this render is uncontrolled");
          return;
        }
        if (input.readOnly) return;
        const held = (render.state || {})[input.key];
        if (held === undefined) {
          unbackedValue.push(at + " | rendered " + JSON.stringify(input.value)
            + " but the state holds no value for that key");
        } else if (input.value !== held) {
          unbackedValue.push(at + " | rendered " + JSON.stringify(input.value)
            + " but the state holds " + JSON.stringify(held));
        }
      });
    });
  }));

  const report = (list) => {
    if (!list.length) return;
    console.log("      " + list.length + " occurrence(s). First: " + list[0]);
    list.slice(1, 4).forEach((l) => console.log("      also: " + l));
  };

  check("no input is ever rendered with an undefined value", undefinedValue.length === 0);
  report(undefinedValue);
  check("form state always describes the page being rendered", driftedState.length === 0);
  report(driftedState);
  check("every displayed value is backed by form state", unbackedValue.length === 0);
  report(unbackedValue);
  check("file input stays uncontrolled and still has an onChange", badFileInput.length === 0);
  report(badFileInput);

  // Sanity check on the harness: navigating must genuinely change what is rendered, or the
  // assertions above would pass vacuously.
  const run = mount(AdminSettingsPage, "System Preferences");
  const before = run.renders[run.renders.length - 1].inputs.map((i) => i.key).join(",");
  run.navigate("Security");
  const after = run.renders[run.renders.length - 1].inputs.map((i) => i.key).join(",");
  check("harness really re-renders on navigation (checks are not vacuous)",
    before === "agency,dateFormat,timezone,fiscalYear" && after === "passwordLength,timeout,attempts");

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch((err) => {
  console.error("HARNESS ERROR: " + (err && err.message));
  process.exit(1);
});

