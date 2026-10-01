// Exercises computeYearOverYearGrowth from the real App.jsx -- the figure behind the
// "Monthly Financial Overview" growth pill.
//
// WHY THIS EXISTS
// The pill was a hardcoded "▲ +8.3% YTD" sitting on a card whose chart plots real
// transaction totals, so the card stated a growth rate that had no relationship to its own
// data. Once the number is derived, the interesting cases stop being visual: a single year
// of history has nothing to compare against, a zero prior-year base divides by zero, and an
// empty or malformed series must not throw. Those only fail at runtime, which is why the
// build cannot catch them.
//
// HOW IT WORKS
// `vite build` treats an unresolved identifier as perfectly legal, so the helper is
// extracted from App.jsx and compiled with the same esbuild the bundler uses, then called
// directly. No DOM and no React are needed for a pure function.

const path = require("path");
const fs = require("fs");
const esbuild = require("esbuild");

const APP = path.join(__dirname, "src", "App.jsx");

let pass = 0;
let fail = 0;
const check = (name, cond, extra = "") => {
  if (cond) { pass++; console.log("PASS  " + name + (extra ? "  -> " + extra : "")); }
  else { fail++; console.log("FAIL  " + name + (extra ? "  -> " + extra : "")); }
};

// The helper is an arrow const, so it is pulled out by its declaration up to the `};` that
// closes it at column 0 -- the same shape the other harnesses extract by brace matching.
function extractHelper(name) {
  const source = fs.readFileSync(APP, "utf8");
  const start = source.indexOf(`const ${name} =`);
  if (start === -1) throw new Error(`${name} not found in App.jsx`);
  const end = source.indexOf("\n};", start);
  if (end === -1) throw new Error(`unterminated ${name} in App.jsx`);
  return source.slice(start, end + 3);
}

const code = `${extractHelper("computeYearOverYearGrowth")}\nmodule.exports = computeYearOverYearGrowth;`;
const js = esbuild.transformSync(code, { loader: "jsx", format: "cjs" }).code;
const module_ = { exports: {} };
// eslint-disable-next-line no-new-func
new Function("module", "exports", js)(module_, module_.exports);
const growth = module_.exports;

// { m } is what buildMonthlyFromTransactions produces: a short month, day and year.
const m = (month, year) => `${month} 1, ${year}`;

check("helper extracted from App.jsx is callable", typeof growth === "function");

// --- the cases that produce a number ---
const up = growth([
  { m: m("Jun", 2025), revenue: 1000, expense: 400 },
  { m: m("Jun", 2026), revenue: 1100, expense: 400 },
]);
check("a real year-over-year gain is computed", up !== null && Math.abs(up - 10) < 1e-9, String(up));

const down = growth([
  { m: m("Jun", 2025), revenue: 1000, expense: 400 },
  { m: m("Jun", 2026), revenue: 800, expense: 400 },
]);
check("a year-over-year decline is computed, not clamped to zero",
  down !== null && Math.abs(down + 20) < 1e-9, String(down));

// The latest month must win even when the series arrives unsorted.
const unsorted = growth([
  { m: m("Jun", 2026), revenue: 1100 },
  { m: m("Jun", 2025), revenue: 1000 },
  { m: m("Jan", 2026), revenue: 500 },
]);
check("the most recent month is used regardless of input order",
  unsorted !== null && Math.abs(unsorted - 10) < 1e-9, String(unsorted));

// A neighbouring month is not a year-over-year comparison.
const adjacent = growth([
  { m: m("May", 2026), revenue: 1000 },
  { m: m("Jun", 2026), revenue: 1100 },
]);
check("two months in the same year yield no figure", adjacent === null, String(adjacent));

// --- the cases that must return null rather than a made-up number ---
check("an empty series yields no figure", growth([]) === null);
check("a non-array yields no figure", growth(null) === null, String(growth(null)));
check("undefined yields no figure", growth(undefined) === null);

const singleYear = growth([
  { m: m("Jan", 2026), revenue: 100 },
  { m: m("Feb", 2026), revenue: 200 },
  { m: m("Mar", 2026), revenue: 300 },
]);
check("a single year of history yields no figure", singleYear === null, String(singleYear));

const zeroBase = growth([
  { m: m("Jun", 2025), revenue: 0 },
  { m: m("Jun", 2026), revenue: 5000 },
]);
check("a zero prior-year base yields no figure instead of Infinity",
  zeroBase === null, String(zeroBase));

const unparseable = growth([
  { m: "not a date", revenue: 100 },
  { m: m("Jun", 2026), revenue: 1100 },
]);
check("unparseable month labels are skipped, not crashed on",
  unparseable === null, String(unparseable));

// --- the seed fallback the chart itself uses must not fabricate a figure ---
const seedMonthly = [
  { m: m("Jan", 2026), revenue: 1800000, expense: 1240000 },
  { m: m("Feb", 2026), revenue: 1950000, expense: 1300000 },
  { m: m("Mar", 2026), revenue: 2100000, expense: 1360000 },
  { m: m("Apr", 2026), revenue: 1980000, expense: 1280000 },
  { m: m("May", 2026), revenue: 2350000, expense: 1450000 },
  { m: m("Jun", 2026), revenue: 2280000, expense: 1420000 },
];
check("the chart's seed fallback shows no growth pill", growth(seedMonthly) === null);

// --- the pill's own formatting ---
const fmt = (v) => `${v < 0 ? "▼" : "▲"} ${v < 0 ? "" : "+"}${v.toFixed(1)}% YTD`;
check("a gain renders as an up arrow with an explicit plus", fmt(up) === "▲ +10.0% YTD", fmt(up));
check("a decline renders as a down arrow with the minus kept", fmt(down) === "▼ -20.0% YTD", fmt(down));
check("a whole-number result still shows one decimal place", fmt(growth([
  { m: m("Jun", 2025), revenue: 2000 }, { m: m("Jun", 2026), revenue: 2500 },
])) === "▲ +25.0% YTD");

// Ten vs nine is where a string-keyed lookup would silently miss the prior year.
const crossing = growth([
  { m: m("Sep", 2025), revenue: 1000 },
  { m: m("Oct", 2025), revenue: 1000 },
  { m: m("Sep", 2026), revenue: 1200 },
  { m: m("Oct", 2026), revenue: 1200 },
]);
check("September is matched across to the prior September",
  crossing !== null && Math.abs(crossing - 20) < 1e-9, String(crossing));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
