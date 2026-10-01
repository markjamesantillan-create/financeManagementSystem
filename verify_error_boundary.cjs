// Verifies the ErrorBoundary added to App.jsx behaves correctly.
//
// The component is extracted from App.jsx and compiled with esbuild (the same
// transform the bundler applies), so the real source is exercised rather than a
// reimplementation of it.
//
// NOTE ON METHOD: this drives the error-boundary protocol directly --
// getDerivedStateFromError, then render -- instead of using a DOM renderer.
// renderToStaticMarkup cannot be used here because React does not support error
// boundaries during server rendering, and no DOM (jsdom) is installed. The
// protocol being exercised is exactly what react-dom invokes at runtime.

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

async function loadBoundary() {
  const source = fs.readFileSync(APP, "utf8");
  const start = source.indexOf("class ErrorBoundary");
  const end = source.indexOf("function App()");
  if (start < 0 || end < 0 || end <= start) {
    throw new Error("Could not locate the ErrorBoundary class in App.jsx");
  }
  const body = source.slice(start, end).replace(/^import .*$/gm, "");
  const out = await esbuild.transform(body, { loader: "jsx", format: "cjs" });
  const code = out.code + "\nmodule.exports.ErrorBoundary = ErrorBoundary;";
  const mod = { exports: {} };
  new Function("require", "module", "exports", "Component", "React", code)(
    (n) => (n === "react" ? React : require(n)),
    mod, mod.exports, React.Component, React
  );
  if (typeof mod.exports.ErrorBoundary !== "function") {
    throw new Error("ErrorBoundary did not compile to a component");
  }
  return mod.exports.ErrorBoundary;
}

// Text content of whatever the boundary chose to render.
const textOf = (node) => {
  const out = [];
  (function walk(n) {
    if (n === null || n === undefined || n === false) return;
    if (typeof n === "string" || typeof n === "number") { out.push(String(n)); return; }
    if (Array.isArray(n)) { n.forEach(walk); return; }
    if (n.props) walk(n.props.children);
  })(node);
  // Whitespace is normalised: an element like <h3>{label} could not be displayed</h3>
  // has separate children, which join with an extra space when flattened.
  return out.join(" ").replace(/\s+/g, " ").trim();
};

// Mounting a boundary outside React leaves setState as a no-op, so the test drives
// the same state transition React performs: apply the updater to the current state.
const mount = (Boundary, props) => {
  const inst = new Boundary(props);
  inst.setState = (updater) => {
    const patch = typeof updater === "function" ? updater(inst.state) : updater;
    inst.state = Object.assign({}, inst.state, patch);
  };
  return inst;
};

(async () => {
  const ErrorBoundary = await loadBoundary();
  check("ErrorBoundary compiles from the real App.jsx source", typeof ErrorBoundary === "function");
  check("exposes the React error-boundary lifecycle", typeof ErrorBoundary.getDerivedStateFromError === "function");

  const boom = new Error("monthly is not defined");
  const child = React.createElement("span", null, "chart drew fine");

  // --- happy path: no error, children render untouched ---
  const instance = mount(ErrorBoundary, { label: "Cash flow chart", children: child });
  const healthy = instance.render();
  const healthyText = textOf(healthy.props ? healthy.props.children : healthy);
  check("healthy render passes children straight through", healthyText.includes("chart drew fine"));
  check("healthy render shows no fallback UI", !healthyText.includes("could not be displayed"));
  check("healthy render offers no retry button", !healthyText.includes("Try again"));
  check("children are not discarded on the happy path", healthy.props && healthy.props.children === child);

  // --- error path: the exact failure that blanked the Dashboard ---
  const state = ErrorBoundary.getDerivedStateFromError(boom);
  check("getDerivedStateFromError captures the error", state && state.error === boom);

  const failed = mount(ErrorBoundary, { label: "Cash flow chart", children: child });
  failed.state = Object.assign({}, failed.state, state);
  const fallbackText = textOf(failed.render());
  check("fallback names the section that failed", /Cash flow chart could not be displayed/.test(fallbackText));
  check("fallback surfaces the real error message", fallbackText.includes("monthly is not defined"));
  check("fallback offers a retry", fallbackText.includes("Try again"));
  check("fallback is marked up as an alert for screen readers", failed.render().props.role === "alert");
  check("children are replaced, not rendered alongside the error", !fallbackText.includes("chart drew fine"));

  // --- retry: the button must actually clear the error and remount ---
  check("initial state has no error", new ErrorBoundary({}).state.error === null);
  const keyBefore = failed.state.key;
  failed.retry();
  check("retry clears the error", failed.state.error === null);
  check("retry changes the key so the subtree remounts", failed.state.key === keyBefore + 1);
  const afterRetry = failed.render();
  const afterText = textOf(afterRetry.props ? afterRetry.props.children : afterRetry);
  check("retry returns the component to normal rendering", !afterText.includes("could not be displayed"));
  check("retry restores the children", afterText.includes("chart drew fine"));

  // --- a boundary with no label must not render the literal word "undefined" ---
  const unnamed = mount(ErrorBoundary, { children: child });
  unnamed.state = Object.assign({}, unnamed.state, ErrorBoundary.getDerivedStateFromError(new Error("x")));
  check("missing label degrades gracefully, no 'undefined'", !textOf(unnamed.render()).includes("undefined"));
  check("missing label still shows a generic heading", /could not be displayed/.test(textOf(unnamed.render())));

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch((err) => {
  console.error("HARNESS ERROR: " + err.message);
  process.exit(1);
});
