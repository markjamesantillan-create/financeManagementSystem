// Renders the real MonthlyFinancialOverview from src/components to confirm it draws the card the
// Dashboard expects, on the code paths the Dashboard actually takes.
//
// WHY THIS EXISTS
// `npx vite build` succeeds even when a component reads an identifier that was never declared,
// because an unresolved name is legal JavaScript -- it only throws when the code runs, and then
// React unmounts that subtree and the Dashboard card renders as nothing. The panel is its own
// file, so it is not covered by verify_undefined_identifiers.cjs, which scans App.jsx alone.
// Here the component is compiled with the same esbuild the bundler uses, its imports are
// replaced by stubs, and it is CALLED.
//
// WHAT THIS VERSION ADDS
// The card was rebuilt to the reference image: a pinned ₱0.0M-₱2.4M grid, X labels read from
// real dates ("Jan 1, 2026"), three smooth unmarked ribbons with very light gradient fills and
// horizontal-only rules. Every one of those is a rendering detail that a green build cannot
// check, so each is asserted through the props the chart receives -- the axis domain and ticks,
// the tick formatter against a real API date, the grid flags, the stroke/fill pairing, and the
// per-key tooltip labels.
//
// The panel fetches its series in useEffect, which the stub never runs, so the state values are
// injected instead -- that is what lets the chart branch be rendered at all rather than only the
// loading screen. The injected order is the order of the useState calls in the component:
// financialData, ytdGrowth, periodLabel, loading, error.

const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "src", "components", "MonthlyFinancialOverview.jsx");
const source = fs.readFileSync(SRC, "utf8");

let pass = 0;
let fail = 0;
const check = (name, cond, extra = "") => {
  if (cond) { pass++; console.log("PASS  " + name + (extra ? "  -> " + extra : "")); }
  else { fail++; console.log("FAIL  " + name + (extra ? "  -> " + extra : "")); }
};

// The imports are dropped and the stubs below stand in for them. `import.meta.env` is replaced
// with an empty object because esbuild's cjs output has no import.meta, and reading a key off it
// would throw before the component ever rendered.
const stripped = source
  .replace(/^import[\s\S]*?;$/gm, "")
  .replace(/import\.meta\.env/g, "({})")
  .replace("export default function", "function");

const PRELUDE = `
const React = { createElement: (t, p, ...c) => ({ t, p: p || {}, c }) };
const createElement = React.createElement;
let stateQueue = [];
globalThis.__queue = (q) => { stateQueue = q || []; };
// A queue rather than a fixed value, so the same component can be rendered as "loading", as
// "loaded", as "the server sent no growth figure" and as "the request failed" without editing
// the source.
const useState = (initial) => {
  const next = stateQueue.length ? stateQueue.shift() : (typeof initial === "function" ? initial() : initial);
  return [next, () => {}];
};
const useEffect = () => {};
// JSX tags only have to exist; as strings they render as named nodes the harness can find.
const ResponsiveContainer = "ResponsiveContainer";
const AreaChart = "AreaChart";
const Area = "Area";
const XAxis = "XAxis";
const YAxis = "YAxis";
const CartesianGrid = "CartesianGrid";
const Tooltip = "Tooltip";
`;

const code = `${PRELUDE}\n${stripped}\nmodule.exports = { MonthlyFinancialOverview };`;
const js = esbuild.transformSync(code, { loader: "jsx", format: "cjs" }).code;
const module_ = { exports: {} };
// eslint-disable-next-line no-new-func
new Function("module", "exports", js)(module_, module_.exports);
const { MonthlyFinancialOverview } = module_.exports;

// Walks the element tree the stub produced. Strings are collected as text so the harness can
// assert on what a user would read.
function walk(node, out) {
  if (node === null || node === undefined || typeof node === "boolean") return;
  if (Array.isArray(node)) { node.forEach((n) => walk(n, out)); return; }
  if (typeof node !== "object") { out.push({ t: "#text", text: String(node) }); return; }
  out.push(node);
  walk(node.c, out);
}

const textOf = (node) => (Array.isArray(node.c) ? node.c.filter((c) => typeof c === "string").join("") : "");
const byType = (nodes, type) => nodes.filter((n) => n.t === type);

// Renders the component with the given state values and returns the flat node list.
function render(queue) {
  globalThis.__queue(queue);
  const nodes = [];
  walk(MonthlyFinancialOverview(), nodes);
  return nodes;
}

// The payload the endpoint now returns: `month` is the first of the month as a date, which is
// what the X axis formats.
const months = [
  { month: "2026-01-01", month_start: "2026-01-01", revenue: 1550000, expenses: 1120000, profit: 430000 },
  { month: "2026-02-01", month_start: "2026-02-01", revenue: 1650000, expenses: 1180000, profit: 470000 },
  { month: "2026-03-01", month_start: "2026-03-01", revenue: 1720000, expenses: 1210000, profit: 510000 },
  { month: "2026-04-01", month_start: "2026-04-01", revenue: 1640000, expenses: 1190000, profit: 450000 },
  { month: "2026-05-01", month_start: "2026-05-01", revenue: 2100000, expenses: 1350000, profit: 750000 },
  { month: "2026-06-01", month_start: "2026-06-01", revenue: 2050000, expenses: 1340000, profit: 710000 },
];

// --- 1. the initial render: the loading branch the Dashboard shows first ---
let threw = null;
let nodes = [];
try {
  nodes = render(null);
} catch (e) { threw = e; }
check("renders on first pass without throwing", threw === null,
  threw ? `${threw.name}: ${threw.message}` : `${nodes.length} nodes`);

const card = byType(nodes, "div").filter((n) => n.p.className === "monthly-financial-overview");
check("the card is a div.monthly-financial-overview",
  card.length === 1, `${card.length} matching nodes`);

const headings = byType(nodes, "h2");
check("the heading is rendered",
  headings.length === 1 && textOf(headings[0]) === "Monthly Financial Overview",
  headings.map(textOf).join(" | "));

const subtitle = byType(nodes, "p")[0];
check("the subtitle names the three series",
  textOf(subtitle).startsWith("Revenue, Expenses & Profit"), textOf(subtitle));
check("the subtitle falls back to the reference half-year when the API sends no period",
  textOf(subtitle).includes("Jan–Jun 2026"), textOf(subtitle));

check("the loading state is shown before the data arrives",
  nodes.some((n) => n.t === "#text" && n.text.includes("Loading financial data")));

// Nothing has been loaded, so nothing has been computed: a badge here would be a figure with no
// data behind it.
const earlyBadge = nodes.filter((n) => String(n.p?.className || "").includes("ytd-growth"));
check("no growth badge is drawn before a figure exists", earlyBadge.length === 0,
  earlyBadge.map(textOf).join(" | "));

// A literal "undefined"/"NaN" on screen is how a missing prop or a broken sum presents itself.
const screenText = nodes.filter((n) => n.t === "#text").map((n) => n.text).join(" ");
check("nothing on screen says undefined or NaN",
  !/undefined|NaN/.test(screenText), screenText.trim());

// --- 2. the loaded render: the chart the reference describes ---
let loaded = [];
threw = null;
try {
  loaded = render([months, 8.3, "Jan–Jun 2026", false, null]);
} catch (e) { threw = e; }
check("renders the chart branch without throwing", threw === null,
  threw ? `${threw.name}: ${threw.message}` : `${loaded.length} nodes`);

// The series the chart is handed has to carry the API's date through to the axis unchanged:
// everything below this line is asserted on props, and a `month` that was rewritten here (to a
// month number, say) would leave the formatter with nothing to parse.
const chart = byType(loaded, "AreaChart")[0];
check("the chart is handed the API rows, dates included",
  Array.isArray(chart.p.data) && chart.p.data.length === 6 &&
  chart.p.data[0].month === "2026-01-01",
  `${chart.p.data.length} rows, first month ${chart.p.data[0].month}`);
check("each row carries a profit that is the gap between the other two",
  chart.p.data.every((row) => Math.abs(row.profit - (row.revenue - row.expenses)) < 1e-9));

const areas = byType(loaded, "Area");
check("three areas are drawn", areas.length === 3, `${areas.length} areas`);
check("the areas plot revenue, expenses and profit in that order",
  areas.map((a) => a.p.dataKey).join(",") === "revenue,expenses,profit",
  areas.map((a) => a.p.dataKey).join(","));
check("the three lines are smooth with no point markers",
  areas.every((a) => a.p.type === "monotone" && a.p.dot === false));
check("the ribbons overlap from the baseline instead of stacking",
  areas.every((a) => a.p.stackId === undefined));
check("blue revenue, red expenses, green profit",
  areas.map((a) => a.p.stroke).join(",") === "#3985d8,#e56464,#21a875",
  areas.map((a) => a.p.stroke).join(","));
check("every line has its own fill",
  new Set(areas.map((a) => a.p.fill)).size === 3,
  areas.map((a) => a.p.fill).join(" | "));
check("the fills come from gradients defined in the same chart",
  areas.every((a) => {
    const id = String(a.p.fill).replace("url(#", "").replace(")", "");
    return loaded.some((n) => n.t === "linearGradient" && n.p.id === id);
  }));

// "Very light filled areas underneath" is the reference's most easily-lost detail, and the
// gradients are the only place it lives.
const stops = byType(loaded, "stop");
const topStops = stops.filter((n) => n.p.offset === "0%").map((n) => Number(n.p.stopOpacity));
const bottomStops = stops.filter((n) => n.p.offset === "100%").map((n) => Number(n.p.stopOpacity));
check("every fill fades from a light top to almost nothing",
  topStops.length === 3 && bottomStops.length === 3 &&
  topStops.every((v) => v <= 0.15) && bottomStops.every((v) => v <= 0.02),
  `tops ${topStops.join(",")} / bottoms ${bottomStops.join(",")}`);

const yAxis = byType(loaded, "YAxis")[0];
check("the axis is the pinned reference grid",
  yAxis.p.domain[0] === 0 && yAxis.p.domain[1] === 2400000,
  JSON.stringify(yAxis.p.domain));
check("five gridlines, from zero to ₱2.4M",
  yAxis.p.ticks.length === 5 && yAxis.p.ticks[0] === 0 && yAxis.p.ticks[4] === 2400000,
  yAxis.p.ticks.join(" "));
check("the gridlines sit at ₱0.6M intervals",
  yAxis.p.ticks[1] - yAxis.p.ticks[0] === 600000 &&
  yAxis.p.ticks[4] - yAxis.p.ticks[3] === 600000,
  yAxis.p.ticks.join(" "));
check("the axis labels are formatted in millions",
  yAxis.p.tickFormatter(0) === "₱0.0M" &&
  yAxis.p.tickFormatter(1200000) === "₱1.2M" &&
  yAxis.p.tickFormatter(2400000) === "₱2.4M",
  `${yAxis.p.tickFormatter(0)} / ${yAxis.p.tickFormatter(1200000)} / ${yAxis.p.tickFormatter(2400000)}`);
check("the axis draws no line and no tick marks of its own",
  yAxis.p.axisLine === false && yAxis.p.tickLine === false && yAxis.p.width === 43);

const xAxis = byType(loaded, "XAxis")[0];
check("the x axis is keyed by the month field", xAxis.p.dataKey === "month");
check("all six month labels are drawn, none skipped", xAxis.p.interval === 0);
check("the labels are real dates, not bare month names",
  xAxis.p.tickFormatter("2026-01-01") === "Jan 1, 2026" &&
  xAxis.p.tickFormatter("2026-06-01") === "Jun 1, 2026",
  `${xAxis.p.tickFormatter("2026-01-01")} / ${xAxis.p.tickFormatter("2026-06-01")}`);
check("a value that is not a date is handed back, not printed as Invalid Date or 1970",
  xAxis.p.tickFormatter("Jun") === "Jun" && xAxis.p.tickFormatter(2026) === 2026,
  `${xAxis.p.tickFormatter("Jun")} / ${xAxis.p.tickFormatter(2026)}`);
check("the label row is reserved space with no axis line",
  xAxis.p.height === 30 && xAxis.p.axisLine === false && xAxis.p.tickLine === false);

const grid = byType(loaded, "CartesianGrid")[0];
check("the grid draws horizontal rules only",
  grid.p.horizontal === true && grid.p.vertical === false);
check("the rules are thin dashes",
  grid.p.strokeDasharray === "2 3" && grid.p.strokeWidth === 0.7 &&
  grid.p.stroke === "#e6edf2");

// --- 3. the hover readout names each series rather than printing raw keys ---
const tooltip = byType(loaded, "Tooltip")[0].p;
const [revenueValue, revenueLabel] = tooltip.formatter(1550000, "revenue");
check("the readout prints a whole-peso figure",
  String(revenueValue).includes("1,550,000") && !String(revenueValue).includes(".00"),
  String(revenueValue));
check("the readout spells the series out",
  revenueLabel === "Revenue" &&
  tooltip.formatter(0, "expenses")[1] === "Expenses" &&
  tooltip.formatter(0, "profit")[1] === "Net Profit",
  [revenueLabel, tooltip.formatter(0, "expenses")[1], tooltip.formatter(0, "profit")[1]].join(" / "));
check("an unrecognised key is passed through rather than blanked",
  tooltip.formatter(0, "something-else")[1] === "something-else");
check("the readout is titled with the month being hovered",
  tooltip.labelFormatter("2026-06-01") === "Jun 1, 2026", tooltip.labelFormatter("2026-06-01"));
check("the readout is styled as a light card",
  String(tooltip.contentStyle.background) === "#ffffff" &&
  String(tooltip.contentStyle.borderRadius) === "6px");
check("the hover cursor is a thin line rather than a shaded band",
  tooltip.cursor.strokeWidth === 1 && tooltip.cursor.fill === undefined);

// --- 4. the badge: shown only for a figure the server actually computed ---
// The arrow is its own span, so textOf on the badge returns the figure alone.
const arrowOf = (badge) =>
  textOf((badge.c || []).find((c) =>
    c && typeof c === "object" && String(c.p?.className || "").includes("growth-arrow")) || {});

const badges = loaded.filter((n) => String(n.p?.className || "").includes("ytd-growth"));
check("the growth badge is shown as an up arrow for a gain",
  badges.length === 1 && arrowOf(badges[0]) === "▲" &&
  textOf(badges[0]).includes("8.3% YTD"),
  `${arrowOf(badges[0])} ${textOf(badges[0])}`);
check("the badge carries the positive tone",
  badges.length === 1 && String(badges[0].p.className).includes("growth-positive"));

const decline = render([months, -12.5, "Jan–Jun 2026", false, null]);
const declineBadge = decline.filter((n) => String(n.p?.className || "").includes("ytd-growth"))[0];
check("a decline renders a down arrow with the negative tone",
  arrowOf(declineBadge) === "▼" && textOf(declineBadge).includes("12.5% YTD") &&
  String(declineBadge.p.className).includes("growth-negative"),
  `${arrowOf(declineBadge)} ${textOf(declineBadge)}`);

// The endpoint returns null, not 0, when there is no prior-year revenue to divide by. A card
// that coerced that to zero would print a confident "▲ 0.0% YTD" over a figure nobody computed.
const unknownGrowth = render([months, null, "Jan–Jun 2026", false, null]);
check("no badge is shown when there is no prior-year figure",
  unknownGrowth.filter((n) => String(n.p?.className || "").includes("ytd-growth")).length === 0);

// --- 5. the caption and the two states that replace the plot ---
const rolling = render([months, -12.5, "Apr–Sep 2026", false, null]);
check("the caption follows the window the server names",
  textOf(byType(rolling, "p")[0]).includes("Apr–Sep 2026"),
  textOf(byType(rolling, "p")[0]));

const empty = render([[], null, "", false, null]);
check("an empty series explains itself instead of drawing a blank plot",
  empty.some((n) => n.t === "#text" && n.text.includes("No financial data available")));

const failed = render([[], null, "", false, "Could not load financial data. Please try again."]);
const alerts = failed.filter((n) => n.p?.role === "alert");
check("a failed load is reported on screen",
  alerts.length === 1 && textOf(alerts[0]).includes("Could not load"),
  alerts.map(textOf).join(""));
check("a failed load does not claim the books are empty",
  !failed.some((n) => n.t === "#text" && n.text.includes("No financial data available")));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);


