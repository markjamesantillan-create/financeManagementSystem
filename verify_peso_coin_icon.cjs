// Renders the real PesoCoinIcon from src/components and checks the markup it produces, plus the
// wiring in App.jsx that puts it on the OUTSTANDING RECEIVABLES card.
//
// WHY THIS EXISTS
// `npx vite build` cannot judge an icon: the JSX compiles, the SVG is valid, and it can still be
// the wrong drawing. An icon that renders as an empty box, or as a plain "P" with the crossing
// bars dropped, or with the pale ring missing, builds cleanly and fails silently. So the component
// is compiled with the same esbuild the bundler uses and rendered through react-dom/server, and
// the assertions are made on the markup that actually comes out.
//
// The geometry assertions are the point of the file. They pin the details that make the drawing a
// peso coin rather than a circle:
//   * three concentric circles, so the thin pale ring survives (delete it and the shape flattens);
//   * the bars overhang the stem on BOTH sides, which is what makes it a PESO sign;
//   * the stem runs below the lower bar, so the P keeps its tail;
//   * every filled shape stays inside the rim, so nothing is clipped by the 32-unit viewBox.
// `vite build` passes with any of those details wrong.
//
// It also checks the call contract with App.jsx: Stat renders `<Icon size={20} strokeWidth={2.5} />`,
// so the icon must accept props it does not use without breaking.

const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const ICON = path.join(__dirname, "src", "components", "PesoCoinIcon.jsx");
const APP = path.join(__dirname, "src", "App.jsx");

let pass = 0;
let fail = 0;
const check = (name, cond, extra = "") => {
  if (cond) { pass++; console.log("PASS  " + name + (extra ? "  -> " + extra : "")); }
  else { fail++; console.log("FAIL  " + name + (extra ? "  -> " + extra : "")); }
};
// --- 1. compile the component the way the bundler does, then require it for real ---
const source = fs.readFileSync(ICON, "utf8");
const js = esbuild.transformSync(source, { loader: "jsx", format: "cjs", jsx: "automatic" }).code;
const module_ = { exports: {} };
// `require` is handed in so the compiled module resolves react and react/jsx-runtime from the
// frontend's own node_modules -- the same copies the app bundles.
new Function("module", "exports", "require", js)(module_, module_.exports, require);
const Icon = module_.exports.default;
check("the module has a default export", typeof Icon === "function", typeof Icon);

// --- 2. render the way Stat does ---
// size={20} strokeWidth={2.5} is copied from the Stat component in App.jsx (asserted below), so a
// change there that this icon cannot survive shows up here as a failure.
let html = "";
let threw = null;
try {
  html = renderToStaticMarkup(React.createElement(Icon, { size: 20, strokeWidth: 2.5 }));
} catch (e) { threw = e; }
check("it renders with the props Stat passes", threw === null,
  threw ? `${threw.name}: ${threw.message}` : "");
check("the props it does not use do not leak into the markup",
  !html.includes("undefined") && !html.includes("NaN"), html.slice(0, 80));
check("the extra strokeWidth does not outline anything", !/\sstroke=/.test(html));

// --- 3. it is an svg sized by `size`, not a fixed box ---
check("it renders exactly one svg", (html.match(/<svg/g) || []).length === 1 &&
  (html.match(/<\/svg>/g) || []).length === 1);
check("the svg is square at the size it was given", html.includes('width="20"') &&
  html.includes('height="20"'));
check("it scales with a different size",
  renderToStaticMarkup(React.createElement(Icon, { size: 42 })).includes('width="42"'));
check("it draws in its own coordinate system", html.includes('viewBox="0 0 32 32"'));
check("the size prop defaults when omitted",
  renderToStaticMarkup(React.createElement(Icon, {})).includes('width="20"'));
check("it is hidden from assistive technology, since the card title carries the meaning",
  html.includes('aria-hidden="true"') && html.includes('focusable="false"'));
// --- 4. the three concentric circles: rim, pale ring, face ---
const circles = [...html.matchAll(/<circle([^>]*?)\/?>/g)].map((m) => {
  const attr = (name) => m[1].match(new RegExp(name + '="([\\d.]+)"'));
  const fill = m[1].match(/fill="([^"]+)"/);
  return {
    cx: Number(attr("cx")[1]), cy: Number(attr("cy")[1]), r: Number(attr("r")[1]),
    fill: fill ? fill[1] : null,
  };
});
check("it is built from three concentric circles",
  circles.length === 3, circles.map((c) => c.r).join(" > "));
check("they share one centre", circles.every((c) => c.cx === 16 && c.cy === 16));
const [rim, ring, face] = circles;
check("they nest, rim outside face",
  rim.r > ring.r && ring.r > face.r, `${rim.r} > ${ring.r} > ${face.r}`);
check("the pale ring is thick enough to actually be drawn",
  rim.r - ring.r >= 1.5 && ring.r - face.r >= 1,
  `${(rim.r - ring.r).toFixed(1)} / ${(ring.r - face.r).toFixed(1)}`);
check("the rim and the face are gold",
  /^#E[0-9A-F]{5}$/i.test(rim.fill || "") && /^#E[0-9A-F]{5}$/i.test(face.fill || ""),
  `${rim.fill} / ${face.fill}`);
check("the rim and the face are not the same flat gold, so the coin reads as raised",
  rim.fill.toUpperCase() !== face.fill.toUpperCase(), `${rim.fill} vs ${face.fill}`);
check("the ring between them is the pale one", /^#F[0-9A-F]{5}$/i.test(ring.fill || ""), ring.fill);
check("the coin leaves a margin, so the rim is not clipped by the viewBox",
  16 - rim.r >= 1 && 16 + rim.r <= 31, `${(16 - rim.r).toFixed(1)} .. ${(16 + rim.r).toFixed(1)}`);
// --- 5. the peso sign itself ---
const pathEl = html.match(/<path([^>]*?)\/?>/);
const d = pathEl ? (pathEl[1].match(/d="([^"]+)"/) || [])[1] : null;
check("the sign is drawn as a path", Boolean(d), d || "no path found");
check("the sign is white on the gold face",
  Boolean(pathEl) && pathEl[1].includes('fill="#FFFFFF"'));
const bars = [...html.matchAll(/<rect([^>]*?)\/?>/g)].map((m) => ({
  x: Number(m[1].match(/x="([\d.]+)"/)[1]),
  y: Number(m[1].match(/y="([\d.]+)"/)[1]),
  w: Number(m[1].match(/width="([\d.]+)"/)[1]),
  h: Number(m[1].match(/height="([\d.]+)"/)[1]),
  fill: (m[1].match(/fill="([^"]+)"/) || [])[1],
}));
check("the two crossed bars of the peso sign are there, and white",
  bars.length === 2 && bars.every((b) => b.fill === "#FFFFFF" && b.w > b.h));
// The stem runs from x 12.8 to the bowl's right edge at 20.6; both are in the path data above,
// which is checked against these same numbers below. A bar that started at or right of 12.8, or
// ended at or left of 20.6, would be a bar that stops at the letter instead of crossing it -- a P
// rather than a peso sign.
check("both bars overhang the stem on the left",
  bars.every((b) => b.x < 12.8), bars.map((b) => b.x).join(", "));
check("both bars reach past the bowl on the right",
  bars.every((b) => b.x + b.w > 20.6), bars.map((b) => (b.x + b.w).toFixed(1)).join(", "));
check("the stem really ends at 12.8 and the bowl at 20.6, as those bounds assume",
  Boolean(d) && d.startsWith("M12.8") && d.includes("20.6"));
check("the bars are stacked, upper above lower",
  bars.length === 2 && bars[0].y + bars[0].h <= bars[1].y, `${bars[0]?.y} vs ${bars[1]?.y}`);
check("the bars are the same length and start at the same place, so the sign is not lopsided",
  bars.length === 2 && bars[0].w === bars[1].w && bars[0].x === bars[1].x);
check("every filled shape stays inside the gold face",
  bars.every((b) => b.x >= 16 - face.r && b.x + b.w <= 16 + face.r) &&
  bars.every((b) => b.y >= 16 - face.r && b.y + b.h <= 16 + face.r));
const glyphNumbers = (d || "").match(/\d+(\.\d+)?/g)?.map(Number) || [];
check("the letter itself stays inside the gold face",
  glyphNumbers.length > 0 &&
  Math.min(...glyphNumbers) >= 16 - face.r && Math.max(...glyphNumbers) <= 16 + face.r,
  `${Math.min(...glyphNumbers)} .. ${Math.max(...glyphNumbers)}`);
// Losing this vertical run past the lower bar is exactly what would turn the sign into a letter P.
check("the stem falls below the lower bar, keeping the tail of the P",
  glyphNumbers.length > 0 && bars.length === 2 &&
  Math.max(...glyphNumbers) > bars[1].y + bars[1].h,
  `${Math.max(...glyphNumbers)} vs ${(bars[1]?.y + bars[1]?.h).toFixed(1)}`);
check("the letter is centred vertically on the coin, not riding high or low",
  glyphNumbers.length > 0 &&
  Math.abs((Math.min(...glyphNumbers) + Math.max(...glyphNumbers)) / 2 - 16) <= 1,
  ((Math.min(...glyphNumbers) + Math.max(...glyphNumbers)) / 2).toFixed(2));
// --- 6. nothing extra invented, and two on one page must not fight over definitions ---
check("the drawing is exactly the three circles, the letter and its two bars",
  circles.length + bars.length + (pathEl ? 1 : 0) === 6,
  circles.length + " circles, " + bars.length + " bars, " + (pathEl ? 1 : 0) + " path");
check("it carries no <defs> ids that could collide if it ever rendered twice",
  !html.includes("<defs") && !html.includes('id="'));
check("it is deterministic, so two instances render identically",
  html === renderToStaticMarkup(React.createElement(Icon, { size: 20, strokeWidth: 2.5 })));

// --- 7. the wiring in App.jsx ---
const app = fs.readFileSync(APP, "utf8");
check("App.jsx imports the component",
  app.includes('import PesoCoinIcon from "./components/PesoCoinIcon";'));
const statLine = app.split(/\r?\n/).find((l) => l.includes('title="OUTSTANDING RECEIVABLES"'));
check("the OUTSTANDING RECEIVABLES card uses it", Boolean(statLine) &&
  statLine.includes("icon={PesoCoinIcon}"), statLine ? statLine.trim().slice(0, 60) : "line not found");
check("the OUTSTANDING RECEIVABLES card no longer uses the dollar-sign icon",
  Boolean(statLine) && !statLine.includes("CircleDollarSign"));
check("the card keeps its orange tone, which is the cream chip the coin sits on",
  Boolean(statLine) && statLine.includes('tone="orange"'));
check("the dollar-sign icon is still imported, because the sidebar still uses it",
  app.includes("  CircleDollarSign,") && app.includes("icon: CircleDollarSign"));
// If Stat stops sending size, the icon still falls back to 20 on its own -- but a change here means
// the contract this icon was written against has moved, which is worth failing loudly over.
check("Stat still renders its icon as <Icon size={20} strokeWidth={2.5} />, the contract this icon keeps",
  app.includes("<Icon size={20} strokeWidth={2.5} />"));
// The tile of the reference artwork is deliberately absent: the chip behind the icon is already a
// cream rounded square at the same size, so a tile inside the svg would frame the coin twice. That
// is asserted through the fills rather than by shape count: a backdrop tile would have to bring a
// cream fill with it, and this icon may only ever use the four colours of the coin.
const fills = [...html.matchAll(/fill="([^"]+)"/g)].map((m) => m[1].toUpperCase());
const PALETTE = ["#EFA41B", "#F8E0A0", "#E9A200", "#FFFFFF"];
check("every fill is rim gold, the pale ring, the face gold or the white sign, and nothing else",
  fills.length === 6 && fills.every((f) => PALETTE.includes(f)), fills.join(", "));
check("no backdrop colour is drawn, because .stat-icon.orange already is that backdrop",
  fills.filter((f) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(f.slice(i, i + 2), 16));
    return r >= 250 && g >= 235 && b >= 200 && b <= 245;
  }).length === 0 && !html.includes("<image"));



console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);




