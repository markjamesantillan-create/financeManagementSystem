// The Cash Flow Trend plot: monthly expenses as bars, net cash flow as a line, drawn by hand.
//
// WHY NOT THE CHART LIBRARY
// This panel used to be a recharts ComposedChart inside a ResponsiveContainer. That couples
// the drawing to a measurement: the plot only learns its own size after the browser has laid
// the column out, so a refresh that swapped the series while the column still measured zero
// left the bars sized against a box that no longer existed, and the card collapsed without an
// error. The Dashboard's other chart had the same failure and was rebuilt this way instead --
// a viewBox the browser scales, and arithmetic that cannot disagree with the space it is
// drawn into.
//
// Everything here is derived inside the component from the props it is given: no module-level
// data, no measured size, no second library to keep in step. Either it draws or it throws.
//
// `series` is `data.cash_flow_trend` from GET /api/dashboard/live -- six buckets, oldest
// first, of { month, month_start, cash_in, expenses, net_cash_flow }.
// `now` decides which bucket is "this month" (the emphasised one); it defaults to the clock.
// `refreshKey` changes whenever new figures land, which remounts the animated group and lets
// the bars and the line replay their entry motion on each poll rather than only on first load.
export default function CashFlowGraph({ series, now, refreshKey = "" }) {
  // The box the drawing lives in. The plot stands on plotBottom; the strip below it belongs
  // to the month labels, so nothing drawn from a value may enter it.
  const chartWidth = 360;
  const chartHeight = 150;
  const plotTop = 25;
  const plotBottom = 125;
  const labelY = 143;
  const sidePad = 8;
  const maxBuckets = 6;

  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  // Trimmed to the six most recent buckets and normalised field by field. The endpoint always
  // sends six well-formed buckets, but a longer series or a bucket with a missing figure has
  // to draw the same as a good one: a NaN handed to <rect> or <path> makes SVG drop the
  // shape silently, which looks like a missing month rather than a broken chart.
  const buckets = (Array.isArray(series) ? series : []).slice(-maxBuckets).map((item) => ({
    label: typeof item?.month === "string" && item.month ? item.month.slice(0, 3) : "--",
    monthStart: typeof item?.month_start === "string" ? item.month_start : "",
    expenses: Math.max(0, toNumber(item?.expenses)),
    net: toNumber(item?.net_cash_flow),
  }));

  const count = buckets.length;

  // One scale for both series. Expenses cannot go below zero but net can, so the floor of
  // the domain follows the worst month: a loss-making month then draws BELOW the zero line
  // instead of being pinned onto the baseline, where it would read as a break-even month.
  // The ceiling falls back to 1 when there is nothing to measure, so the division below can
  // never produce Infinity.
  const high = Math.max(0, ...buckets.map((bucket) => Math.max(bucket.expenses, bucket.net))) || 1;
  const low = Math.min(0, ...buckets.map((bucket) => bucket.net));
  const span = high - low || 1;

  // Both ends of the domain map onto the plot, so no value needs clamping -- it cannot leave
  // it. When one bucket is the whole of the data, `high` is that bucket's own value and the
  // bar fills the plot the way a single-month chart should.
  const yFor = (value) => plotBottom - ((value - low) / span) * (plotBottom - plotTop);
  const zeroY = yFor(0);

  // Slot geometry follows how many buckets are actually on screen, so one to six months all
  // fill the card. One centre serves the bar, its label and the line marker together, so the
  // three of them cannot drift out of alignment with each other.
  const slot = count ? (chartWidth - sidePad * 2) / count : chartWidth - sidePad * 2;
  const barWidth = Math.min(20, slot * 0.3);
  const centerOf = (index) => sidePad + slot * index + slot / 2;

  // The current month is the one the header's LIVE badge is about. month_start is a
  // 'YYYY-MM-01' string, so its year and month are read off the text rather than parsed as a
  // Date -- a timezone offset would otherwise quietly move the month boundary by a day.
  const stamp = now instanceof Date && !Number.isNaN(now.getTime()) ? now : new Date();
  let found = -1;
  buckets.forEach((bucket, index) => {
    const [year, month] = bucket.monthStart.slice(0, 7).split("-").map(Number);
    if (year === stamp.getFullYear() && month === stamp.getMonth() + 1) found = index;
  });
  // No bucket matches the clock (a series that has not caught up with the month yet): the
  // most recent one stands in, so the emphasis always lands on something that exists.
  const activeIndex = found >= 0 ? found : count - 1;

  const netPoints = buckets.map((bucket, index) => ({ x: centerOf(index), y: yFor(bucket.net) }));
  const netPath = netPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const gridLines = [0, 1, 2, 3].map((step) => plotTop + ((plotBottom - plotTop) / 3) * step);

  const compact = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const short = (value) => compact.format(value);
  const activePoint = netPoints[activeIndex];

  return (
    <div className="cash-flow-graph">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label="Cash flow trend: monthly expenses as bars, net cash flow as a line"
      >
        {/* Remounting on a new refreshKey is what makes the motion live rather than a one-off
            entrance: the CSS animations restart together with the fresh figures. */}
        <g key={`${refreshKey}|${count}`}>
          {gridLines.map((y) => (
            <line key={y} x1="0" y1={y} x2={chartWidth} y2={y} className="cf-grid-line" />
          ))}

          {/* Only worth drawing once the net dips under it; otherwise it is the baseline. */}
          {low < 0 && (
            <line x1="0" y1={zeroY} x2={chartWidth} y2={zeroY} className="cf-zero-line" />
          )}

          {buckets.map((bucket, index) => {
            const barTop = yFor(bucket.expenses);
            // Measured from the zero line rather than the floor of the plot, so the bars still
            // stand on the right level when a negative month has pushed that line upward.
            const barHeight = Math.max(0, zeroY - barTop);
            return (
              <g key={`${bucket.monthStart}|${bucket.label}|${index}`}>
                <rect
                  x={centerOf(index) - barWidth / 2}
                  y={barTop}
                  width={barWidth}
                  height={barHeight}
                  rx="3"
                  className={`cf-bar ${index === activeIndex ? "active" : ""}`.trim()}
                  // The rise is a scaleY around the zero line, so the transform origin has to
                  // be that line's y in user space -- a stylesheet cannot know where it fell.
                  style={{
                    transformOrigin: `0px ${zeroY}px`,
                    animationDelay: `${index * 80}ms`,
                  }}
                >
                  <title>{`${bucket.label}  expenses ${short(bucket.expenses)}`}</title>
                </rect>
                <text x={centerOf(index)} y={labelY} textAnchor="middle" className="cf-label">
                  {bucket.label}
                </text>
              </g>
            );
          })}

          {/* pathLength="1" normalises the path, so the dash values that draw the line in and
              run the highlight along it do not depend on how long the path happens to be. */}
          <path d={netPath} className="cf-line" pathLength="1" />
          {count > 1 && <path d={netPath} className="cf-sweep" pathLength="1" />}

          {/* Behind the markers: this ring is a halo for the live month, not a data point. */}
          {activePoint && (
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="4"
              className="cf-pulse"
              style={{ transformOrigin: `${activePoint.x}px ${activePoint.y}px` }}
            />
          )}

          {netPoints.map((point, index) => (
            <circle
              key={`${buckets[index].monthStart}|point|${index}`}
              cx={point.x}
              cy={point.y}
              r={index === activeIndex ? 4 : 2.5}
              className={`cf-point ${index === activeIndex ? "active" : ""}`.trim()}
            >
              <title>{`${buckets[index].label}  net ${short(buckets[index].net)}`}</title>
            </circle>
          ))}
        </g>
      </svg>
    </div>
  );
}


