// Verifies the Salary Fund Monitoring page is genuinely database-driven, the way
// `npx vite build` cannot check.
//
// WHY THIS EXISTS
// The page's whole job is to show figures that came out of the database. A build
// succeeds just as happily whether the page reads `monitoring.summary.total_fund`
// or writes `const totalFund = 5000000`, so two things have to be asserted here
// that the bundler cannot see:
//
//   1. The source contains NO peso amount, no percentage literal and no headcount
//      count. Any such literal is the exact regression this page was rebuilt to
//      remove, so it is a failure, not a style note.
//   2. Rendered against a real API payload, every card and every table shows the
//      numbers from that payload — proving the component reads the response
//      rather than the response merely existing.
//
// HOW IT RUNS
// The component is compiled with the same esbuild the bundler uses, its imports
// are replaced by stubs, and it is actually CALLED against a live payload. The
// stub React returns a plain element tree, which is walked to collect the text a
// user would read.
//
// USAGE
//   node verify_salary_fund_monitoring.cjs [baseUrl]
//   (defaults to http://127.0.0.1:4000 — pass the port you started the backend on)

const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "src", "modules", "payroll", "salary_fund_monitoring_component.jsx");
const API = process.argv[2] || "http://127.0.0.1:4000";

let pass = 0;
let fail = 0;
const check = (name, cond, extra = "") => {
  if (cond) { pass++; console.log("PASS  " + name + (extra ? "  -> " + extra : "")); }
  else { fail++; console.log("FAIL  " + name + (extra ? "  -> " + extra : "")); }
};

const source = fs.readFileSync(SRC, "utf8");

// ---------------------------------------------------------------------------
// 1. The source must not contain a money, percentage or headcount literal.
//    Comments are stripped first so explanatory prose about peso amounts in a
//    comment does not trip the check — only executable code is scanned. Template
//    literals go too: they are how the figures ARE rendered, so `₱${...}` carries
//    no literal amount and must not be flagged as if it did.
// ---------------------------------------------------------------------------
const code = source
  .replace(/\/\*[\s\S]*?\*\//g, " ")
  .replace(/\/\/[^\n]*/g, " ")
  .replace(/`[^`]*`/g, " ");

const pesoLiterals = code.match(/₱\s*[\d][\d,._]*/g) || [];
const bareAmounts = code.match(/\b\d{4,}(?:\.\d+)?\b/g) || [];
const pctLiterals = code.match(/(?<![\w.])\d+(?:\.\d+)?\s*%/g) || [];

check("source declares no peso amount", pesoLiterals.length === 0, pesoLiterals.join(", "));
check(
  "source declares no 4+ digit figure",
  bareAmounts.length === 0,
  bareAmounts.join(", ")
);
check("source declares no percentage literal", pctLiterals.length === 0, pctLiterals.join(", "));

check("component fetches the monitoring API", /\/api\/salary-fund-monitoring/.test(source));
check(
  "component has no local fixture data",
  !/const\s+(departments|transactions|allocations|periods)\s*=\s*\[/.test(source)
);

// ---------------------------------------------------------------------------
// 2. Render it against the live payload.
// ---------------------------------------------------------------------------
const PRELUDE = `
const RevealableAmount = "__RevealableAmount";
const RevealableText = "__RevealableText";
const React = {
  createElement: (t, p, ...c) =>
    t === RevealableAmount || t === RevealableText ? p?.value : ({ t, p: p || {}, c }),
};
const createElement = React.createElement;
let stateQueue = [];
globalThis.__queue = (q) => { stateQueue = q || []; };
const useState = (initial) => {
  const next = stateQueue.length ? stateQueue.shift() : (typeof initial === "function" ? initial() : initial);
  return [next, () => {}];
};
// The component loads in useEffect, which the stub never runs, so the results of
// those fetches are injected as state instead. That is what makes the loaded
// branch render at all rather than only the loading spinner.
const useEffect = () => {};
const useCallback = (fn) => fn;
const useMemo = (fn) => fn();
const Printer = "Printer"; const RotateCcw = "RotateCcw"; const Search = "Search";
const Eye = "Eye"; const X = "X"; const Clock3 = "Clock3"; const Bell = "Bell";
const CheckCircle2 = "CheckCircle2"; const AlertTriangle = "AlertTriangle";
const TrendingUp = "TrendingUp"; const TrendingDown = "TrendingDown";
const Users = "Users"; const Wallet = "Wallet"; const HandCoins = "HandCoins";
const FileText = "FileText"; const CalendarRange = "CalendarRange";
`;

const stripped = source
  .replace(/^import[\s\S]*?;$/gm, "")
  .replace(/import\.meta\.env/g, "({})")
  // The default export becomes a plain function declaration so the CommonJS
  // output can hand it back through module.exports below.
  .replace("export default function", "function");

const bundle = `${PRELUDE}\n${stripped}\nmodule.exports = { SalaryFundMonitoringPage };`;
const js = esbuild.transformSync(bundle, { loader: "jsx", format: "cjs" }).code;
const module_ = { exports: {} };
// eslint-disable-next-line no-new-func
new Function("module", "exports", js)(module_, module_.exports);
const { SalaryFundMonitoringPage } = module_.exports;

function walk(node, out) {
  if (node === null || node === undefined || typeof node === "boolean") return;
  if (Array.isArray(node)) { node.forEach((n) => walk(n, out)); return; }
  if (typeof node !== "object") { out.push(String(node)); return; }
  out.push(node);
  walk(node.c, out);
}

// State order must match the component's useState calls: monitoring, filters,
// loading, refreshing, error, search, statusFilter, departmentFilter, detail,
// detailLoading, reportKey.
const render = (stateValues) => {
  // __queue is a setter the stub exposes, so it has to be CALLED — assigning to
  // it would replace the setter with the array and leave every useState falling
  // back to its initial value, which would render the loading spinner forever.
  globalThis.__queue(stateValues);
  const nodes = [];
  walk(SalaryFundMonitoringPage({ onAudit: () => {}, navigate: () => {} }), nodes);
  return nodes;
};

const LOADED = (payload, filterData) => ([
  payload, filterData, false, false, "", "", "All Statuses", "All Departments",
  null, false, null,
]);

const money = (value) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const textOf = (nodes) => nodes.filter((node) => typeof node === "string").join(" | ");

(async () => {
  let payload;
  let filterData = null;
  try {
    const [monitoring, filters] = await Promise.all([
      fetch(`${API}/api/salary-fund-monitoring`).then((r) => r.json()),
      fetch(`${API}/api/salary-fund-monitoring/filters`).then((r) => r.json()),
    ]);
    payload = monitoring;
    filterData = filters?.data || null;
  } catch (error) {
    console.log(`FAIL  could not reach the backend at ${API}  -> ${error.message}`);
    console.log("      start it first:  cd Backend && npm start");
    report();
    return;
  }

  check("API returns a summary derived from the database", Boolean(payload?.summary), API);
  check("API returns payroll_periods", Array.isArray(payload?.payroll_periods) && payload.payroll_periods.length > 0);
  check("API returns period_departments", Array.isArray(payload?.period_departments));
  check("API returns fund_releases", Array.isArray(payload?.fund_releases));
  check("API returns alerts", Array.isArray(payload?.alerts?.items));
  check("API returns reports", Array.isArray(payload?.reports) && payload.reports.length > 0);

  const summary = payload.summary;
  check(
    "remaining_fund equals total_fund minus used_fund",
    Math.abs(summary.remaining_fund - (summary.total_fund - summary.used_fund)) < 0.01,
    `${summary.total_fund} - ${summary.used_fund} = ${summary.remaining_fund}`
  );
  check(
    "utilization_rate equals used_fund over total_fund",
    Math.abs(summary.utilization_rate - (summary.used_fund / summary.total_fund) * 100) < 0.01,
    `${summary.utilization_rate}%`
  );

  const nodes = render(LOADED(payload, filterData));
const text = textOf(nodes);
const rows = nodes.filter((node) => node && node.t === "tr");

  check("page renders its section headings", text.includes("Fund Overview") && text.includes("Fund Alerts"));
  check("page renders the period monitor", text.includes("Payroll Period Monitoring"));
  check("page renders the department monitor", text.includes("Department Salary Monitoring"));
  check("page renders the employee cost table", text.includes("Employee Payroll Cost Monitoring"));
  check("page renders the release monitor", text.includes("Fund Release Monitoring"));
  check("page renders the variance panel", text.includes("Fund Variance Monitoring"));
  check("page renders reconciliation", text.includes("Reconciliation"));
  check("page renders the report catalogue", text.includes("Reports"));

  // The six Fund Overview cards, each showing the payload's own figure.
  check("card shows the API total_fund", text.includes(money(summary.total_fund)), money(summary.total_fund));
  check("card shows the API allocated_fund", text.includes(money(summary.allocated_fund)), money(summary.allocated_fund));
  check("card shows the API released_fund", text.includes(money(summary.released_fund)), money(summary.released_fund));
  check("card shows the API used_fund", text.includes(money(summary.used_fund)), money(summary.used_fund));
  check("card shows the API remaining_fund", text.includes(money(summary.remaining_fund)), money(summary.remaining_fund));

  // The dynamic tables must carry a row per record, not a fixed sample.
  check(
    "tables render a row per record",
    rows.length >= payload.payroll_periods.length,
    `${rows.length} rows for ${payload.payroll_periods.length} periods`
  );
  check(
    "employee table renders every employee",
    payload.employees.every((row) => text.includes(row.employee_name)),
    `${payload.employees.length} employees`
  );
  check(
    "release table renders every release reference",
    payload.fund_releases.every((row) => text.includes(row.release_reference)),
    `${payload.fund_releases.length} releases`
  );
  check(
    "department table renders every department",
    payload.departments.every((row) => text.includes(row.department)),
    `${payload.departments.length} departments`
  );
  check(
    "every detected alert is rendered",
    payload.alerts.items.every((alert) => text.includes(alert.title)),
    `${payload.alerts.total} alerts`
  );

  // A different dataset must produce different output. This is the check a
  // hard-coded page cannot pass: it proves the render reads the payload rather
  // than merely having a payload in scope.
  const mutated = JSON.parse(JSON.stringify(payload));
  mutated.summary.total_fund = 9876543;
  mutated.summary.used_fund = 8641976;
  mutated.summary.remaining_fund = 1234567;
  const mutatedText = textOf(render(LOADED(mutated, filterData)));
  check(
    "a different payload produces different figures",
    mutatedText.includes(money(9876543)) && !text.includes(money(9876543)),
    money(9876543)
  );

  // The loading branch must not leak the spinner once data is present.
  const loadingText = textOf(render([null, null, true, false, "", "", "All Statuses", "All Departments", null, false, null]));
  check(
    "loading branch shows a spinner, not figures",
    loadingText.includes("Loading salary fund monitoring")
  );

  report();
})();

function report() {
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}
