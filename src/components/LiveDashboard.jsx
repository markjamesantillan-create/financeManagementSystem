import { useEffect, useMemo, useState } from "react";
import CashFlowGraph from "./CashFlowGraph";
import "./LiveDashboard.css";

// Matches the fallback chain the sibling pages use: VITE_API_URL first, then the
// alternative name, then empty so local dev rides the Vite proxy.
const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

const money = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

// The panel the Dashboard already had kept its figures behind a click-to-reveal toggle, so
// a screenshot of the dashboard does not leak the month's numbers. That is preserved here:
// `masked` hides the cash figure behind an asterisk until it is clicked.
export default function LiveDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const [masked, setMasked] = useState(true);

  // The clock ticks locally; only the figures come from the server.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/dashboard/live`, {
          headers: { Accept: "application/json" },
        });
        // Parsed defensively: a proxy error page is not JSON, and response.json() would
        // then reject with a parse error that hides the real status code.
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || `Service returned ${response.status}.`);
        }
        if (!active) return;
        setData(payload.data);
        setError(null);
        setLastRefresh(new Date());
      } catch (err) {
        // Previously a failure here left the panel rendering nothing at all, which took the
        // graph with it and left no explanation on screen. The error is now shown in place.
        if (!active) return;
        setError(err.message || "Live figures are unavailable right now.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const clock = useMemo(
    () =>
      now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
    [now]
  );
  const today = useMemo(
    () =>
      now.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      }),
    [now]
  );

  const trend = data?.cash_flow_trend || [];

  // A fragment, not a wrapper element: `.ai-budget-card` is already a three-column grid
  // (AI BUDGETING | LIVE DASHBOARD | Cash Flow Trend). Wrapping these two in an element of
  // their own made them a single grid item, so the card rendered as two columns with the
  // summary and the chart nested side by side inside the second one.
  return (
    <>
      <article className="live-status-card">
        <div className="live-dashboard-title">
          <span className="live-dot" />
          <span>LIVE DASHBOARD</span>
        </div>

        <div className="live-clock">{clock}</div>
        <div className="live-date">{today}</div>

        <div className="dashboard-details">
          <div className="dashboard-row">
            <span className="dashboard-label">System Status</span>
            <span
              className={`dashboard-value status-value ${
                error ? "offline" : data?.system_status === "Online" ? "online" : "offline"
              }`}
            >
              {loading ? "Checking..." : error ? "Offline" : data?.system_status || "Offline"}
            </span>
          </div>

          <div className="dashboard-row">
            <span className="dashboard-label">Net Cash Flow</span>
            <button
              type="button"
              className="dashboard-value live-amount-toggle"
              onClick={() => setMasked((v) => !v)}
              aria-label="Toggle net cash flow visibility"
              title={masked ? "Click to reveal" : "Click to hide"}
            >
              {loading ? "Loading..." : masked ? "*" : money(data?.net_cash_flow)}
            </button>
          </div>

          <div className="dashboard-row">
            <span className="dashboard-label">Expense Ratio</span>
            <span className="dashboard-value">
              {loading ? "Loading..." : `${Number(data?.expense_ratio || 0).toFixed(1)}%`}
            </span>
          </div>

          <div className="dashboard-row">
            <span className="dashboard-label">Last Refresh</span>
            <span className="dashboard-value refresh-value">
              {lastRefresh
                ? lastRefresh.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "Waiting..."}
            </span>
          </div>
        </div>
      </article>

      <article className="cash-flow-card">
        <div className="cash-flow-header">
          <div className="cash-flow-title">Cash Flow Trend</div>
          <div className="cash-flow-live">
            <span className="small-live-dot" />
            LIVE
          </div>
        </div>

        <div className="cash-flow-chart">
          {loading ? (
            <div className="chart-loading">Loading cash flow data...</div>
          ) : error ? (
            <div className="chart-empty" role="alert">{error}</div>
          ) : trend.length === 0 ? (
            <div className="chart-empty">No cash flow data available.</div>
          ) : (
            /* Hand-built SVG rather than a chart library -- see CashFlowGraph.jsx for why.
               Same six buckets the summary rows above read from, and `refreshKey` is the
               payload's own timestamp, so the plot replays its entry motion each time the
               30s poll lands new figures instead of animating only once on first load.
               Hover detail moved from the library tooltip to a <title> on each bar and
               marker, which needs no measurement to position itself. */
            <CashFlowGraph
              series={trend}
              now={now}
              refreshKey={data?.updated_at || lastRefresh?.toISOString() || ""}
            />
          )}
        </div>

        <div className="cash-flow-legend">
          <div className="legend-item">
            <span className="legend-square expenses" />
            <span>Expenses</span>
          </div>
          <div className="legend-item">
            <span className="legend-line" />
            <span>Net Cash Flow</span>
          </div>
        </div>
      </article>
    </>
  );
}
