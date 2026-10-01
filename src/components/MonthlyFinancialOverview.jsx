import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import "./MonthlyFinancialOverview.css";

const API_BASE = import.meta.env.VITE_API_URL || "";

/*
 * The Dashboard's "Monthly Financial Overview" card.
 *
 * This is the reference card: a fixed ₱0.0M / ₱0.6M / ₱1.2M / ₱1.8M / ₱2.4M grid, X labels read
 * from real dates ("Jan 1, 2026" … "Jun 1, 2026"), three smooth ribbons -- blue revenue on top,
 * red expenses through the middle, green net profit low -- with very light fills beneath them,
 * thin horizontal rules only, and no point markers on the lines.
 *
 * An earlier revision of this panel fitted the axis to the data. The spec for this card is the
 * reference grid, so the axis is pinned; see the note on YAxis below for what that costs when
 * the books are smaller than the grid.
 *
 * FOUR DELIBERATE DEPARTURES from the reference markup, each marked where it happens:
 *   1. `period_label` from the API captions the card when the server sends one, falling back to
 *      the literal "Jan–Jun 2026". App.jsx documents this panel as reading that field, and it
 *      keeps the caption honest if the window is ever something other than the half-year.
 *   2. The YTD badge is hidden when the endpoint reports no comparable figure (null) instead of
 *      printing a made-up "0.0% YTD": the server returns null precisely so the card can stay
 *      quiet rather than announce a percentage with no base behind it.
 *   3. A failed request says so on screen, with role="alert", rather than dressing a server
 *      error up as "No financial data available".
 *   4. A date-only month value is parsed as local midnight, so "2026-01-01" reads "Jan 1, 2026"
 *      in every timezone instead of slipping to Dec 31 west of Greenwich.
 */

export default function MonthlyFinancialOverview() {
  // Order matters: verify_monthly_overview_render.cjs injects these state values by position --
  // financialData, ytdGrowth, periodLabel, loading, error.
  const [financialData, setFinancialData] = useState([]);
  const [ytdGrowth, setYtdGrowth] = useState(null);
  const [periodLabel, setPeriodLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFinancialData = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/dashboard/monthly-financial-overview`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}`
        );
      }

      const result = await response.json();

      setFinancialData(result.data || []);

      // (2) `null` is the server saying "no prior-year revenue to divide by". Coercing it with
      // `|| 0` would print a confident "▲ 0.0% YTD" over a figure nobody computed.
      setYtdGrowth(
        result.ytd_growth === null || result.ytd_growth === undefined
          ? null
          : Number(result.ytd_growth)
      );

      // (1) The caption describes the window the figures came from, when the server names it.
      setPeriodLabel(String(result.period_label || ""));

      setError(null);
    } catch (requestError) {
      console.error(
        "Failed to load monthly financial overview:",
        requestError
      );

      setFinancialData([]);
      // (3) An unreachable or failing endpoint is not the same thing as an empty book, and the
      // card should not say "No financial data available" for the first one.
      setError("Could not load financial data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();

    const refreshInterval = setInterval(() => {
      loadFinancialData();
    }, 30000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  /*
   * Format Y-axis values exactly like:
   * ₱0.0M
   * ₱0.6M
   * ₱1.2M
   * ₱1.8M
   * ₱2.4M
   */
  const formatMillion = (value) => {
    return `₱${(Number(value) / 1000000).toFixed(1)}M`;
  };

  /*
   * Tooltip formatting
   */
  const formatPeso = (value) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value));
  };

  /*
   * Convert backend date/month values to:
   *
   * Jan 1, 2026
   * Feb 1, 2026
   * ...
   */
  const formatMonthLabel = (value) => {
    // (4) "2026-01-01" is a date-only string, which JavaScript parses as UTC midnight -- in any
    // timezone west of Greenwich that is the 31st of the previous month, so the January bucket
    // would print "Dec 31, 2025". Appending a time makes the parse local, so the label is always
    // the month the bucket came from.
    const text =
      typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? `${value}T00:00:00`
        : value;

    // Only strings are parsed from here. `new Date(2026)` would be read as a millisecond
    // timestamp and print "Jan 1, 1970" on the axis, and a value that is not a date at all
    // ("Jun", an empty string) reads "Invalid Date" -- both are better handed back untouched.
    if (typeof text !== "string") {
      return value;
    }

    const date = new Date(text);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  /*
   * Make sure every row has the correct structure.
   */
  const chartData = financialData.map((item) => ({
    month: item.month,
    revenue: Number(item.revenue || 0),
    expenses: Number(item.expenses || 0),
    profit: Number(
      item.profit ??
        Number(item.revenue || 0) -
          Number(item.expenses || 0)
    ),
  }));

  // (1) The reference caption is the fallback, not the rule: the server names the window it
  // aggregated, and the two only differ if the window is ever moved off the half-year.
  const period = periodLabel || "Jan–Jun 2026";

  return (
    <div className="monthly-financial-overview">

      {/* =========================================
          HEADER
      ========================================= */}

      <div className="monthly-overview-header">

        <div className="monthly-overview-heading">

          <h2>
            Monthly Financial Overview
          </h2>

          <p>
            Revenue, Expenses &amp; Profit · {period}
          </p>

        </div>

        {/* (2) Rendered only when the server could compute a comparable figure; see the
            `ytd_growth` handling in loadFinancialData. */}
        {ytdGrowth !== null && (
          <div
            className={`ytd-growth ${
              ytdGrowth >= 0
                ? "growth-positive"
                : "growth-negative"
            }`}
          >
            <span className="growth-arrow">
              {ytdGrowth >= 0 ? "▲" : "▼"}
            </span>

            {Math.abs(ytdGrowth).toFixed(1)}% YTD
          </div>
        )}

      </div>

      {/* =========================================
          GRAPH
      ========================================= */}

      <div className="monthly-overview-chart">

        {loading ? (
          <div className="chart-message">
            Loading financial data...
          </div>
        ) : error ? (
          /* (3) A request that failed is reported as such, rather than as an empty book. */
          <div className="chart-message" role="alert">
            {error}
          </div>
        ) : chartData.length === 0 ? (
          <div className="chart-message">
            No financial data available.
          </div>
        ) : (

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <AreaChart
              data={chartData}

              margin={{
                top: 3,
                right: 8,
                left: 0,
                bottom: 2,
              }}
            >

              {/* =================================
                  GRADIENTS
              ================================= */}

              <defs>

                {/* Blue Revenue */}
                <linearGradient
                  id="revenueFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#3985d8"
                    stopOpacity={0.14}
                  />

                  <stop
                    offset="100%"
                    stopColor="#3985d8"
                    stopOpacity={0.015}
                  />
                </linearGradient>

                {/* Red Expenses */}
                <linearGradient
                  id="expenseFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#e56464"
                    stopOpacity={0.08}
                  />

                  <stop
                    offset="100%"
                    stopColor="#e56464"
                    stopOpacity={0.01}
                  />
                </linearGradient>

                {/* Green Profit */}
                <linearGradient
                  id="profitFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#21a875"
                    stopOpacity={0.08}
                  />

                  <stop
                    offset="100%"
                    stopColor="#21a875"
                    stopOpacity={0.01}
                  />
                </linearGradient>

              </defs>

              {/* =================================
                  GRID
              ================================= */}

              <CartesianGrid
                horizontal={true}
                vertical={false}
                stroke="#e6edf2"
                strokeWidth={0.7}
                strokeDasharray="2 3"
              />

              {/* =================================
                  X AXIS
              ================================= */}

              <XAxis
                dataKey="month"

                axisLine={false}
                tickLine={false}

                tick={{
                  fill: "#82939e",
                  fontSize: 8,
                  fontWeight: 400,
                }}

                tickFormatter={formatMonthLabel}

                interval={0}

                angle={-12}

                textAnchor="end"

                height={30}

                padding={{
                  left: 4,
                  right: 4,
                }}
              />

              {/* =================================
                  Y AXIS
              ================================= */}

              {/* The reference grid, pinned as specified: ₱0.0M on the baseline and ₱2.4M at the
                  top in four ₱0.6M bands, rather than an axis fitted to the six months being
                  drawn.

                  What the pin does and does not hold, measured from the rendered SVG: the ceiling
                  stays glued to the top of the plot (₱2.4M at y=3, ₱0.0M at y=161 across a 158px
                  plot) while every month is a gain. Recharts refuses to hide data that falls
                  outside a pinned domain -- allowDataOverflow defaults to false -- so the first
                  month in the red pulls the scale apart instead: ₱2.4M stays at y=3, and the
                  ₱0.0M gridline lifts off the floor to make room for the loss beneath it (a
                  -₱171,369 month moves it to y=150.5). The dip is therefore visible, and the five
                  labels keep their text, but the bands stop being an even ₱0.6M apart. Pass
                  allowDataOverflow={true} to hold the bands rigid and clip a loss at the
                  baseline instead. */}
              <YAxis
                domain={[
                  0,
                  2400000,
                ]}

                ticks={[
                  0,
                  600000,
                  1200000,
                  1800000,
                  2400000,
                ]}

                axisLine={false}
                tickLine={false}

                width={43}

                tick={{
                  fill: "#82939e",
                  fontSize: 8,
                  fontWeight: 400,
                }}

                tickFormatter={formatMillion}
              />

              {/* =================================
                  TOOLTIP
              ================================= */}

              <Tooltip
                cursor={{
                  stroke: "#d6e0e6",
                  strokeWidth: 1,
                }}

                formatter={(value, name) => {

                  let label = name;

                  if (name === "revenue") {
                    label = "Revenue";
                  }

                  if (name === "expenses") {
                    label = "Expenses";
                  }

                  if (name === "profit") {
                    label = "Net Profit";
                  }

                  return [
                    formatPeso(value),
                    label,
                  ];
                }}

                labelFormatter={(label) => {
                  return formatMonthLabel(label);
                }}

                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #dce6ec",
                  borderRadius: "6px",
                  fontSize: "10px",
                  padding: "7px 9px",
                  boxShadow:
                    "0 3px 12px rgba(40,70,90,0.08)",
                }}
              />

              {/* =================================
                  BLUE — REVENUE
              ================================= */}

              <Area
                type="monotone"

                dataKey="revenue"

                stroke="#3985d8"

                strokeWidth={2.1}

                fill="url(#revenueFill)"

                connectNulls={true}

                dot={false}

                activeDot={{
                  r: 3,
                  strokeWidth: 1.5,
                  fill: "#3985d8",
                }}

                isAnimationActive={true}

                animationDuration={700}

                animationEasing="ease-out"
              />

              {/* =================================
                  RED — EXPENSES
              ================================= */}

              <Area
                type="monotone"

                dataKey="expenses"

                stroke="#e56464"

                strokeWidth={2}

                fill="url(#expenseFill)"

                connectNulls={true}

                dot={false}

                activeDot={{
                  r: 3,
                  strokeWidth: 1.5,
                  fill: "#e56464",
                }}

                isAnimationActive={true}

                animationDuration={700}

                animationEasing="ease-out"
              />

              {/* =================================
                  GREEN — PROFIT
              ================================= */}

              <Area
                type="monotone"

                dataKey="profit"

                stroke="#21a875"

                strokeWidth={2}

                fill="url(#profitFill)"

                connectNulls={true}

                dot={false}

                activeDot={{
                  r: 3,
                  strokeWidth: 1.5,
                  fill: "#21a875",
                }}

                isAnimationActive={true}

                animationDuration={700}

                animationEasing="ease-out"
              />

            </AreaChart>

          </ResponsiveContainer>

        )}

      </div>

    </div>
  );
}
