// Financial KPI Monitoring — fully database-driven.
//
// Every figure comes from GET /api/analytics/financial-kpi via the shared
// fetchAnalytics helper. Nothing is hard-coded: the performance and cash-flow
// KPIs, target-vs-actual comparisons, monthly trends, warnings and
// recommendations are derived from live billing, payment, expense, payroll
// and vendor-payment records. Lower-is-better KPIs are judged against a
// maximum allowable target rather than treated as "higher is better". The
// page re-fetches whenever the date filters change.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Printer } from "lucide-react";
import { fetchAnalytics } from "./analytics_api";
import { DashCard, DashFilters, DashPanel, DashState, RefreshButton, money, percent } from "./analytics_ui";
import RevealableAmount from "./RevealableAmount";
import RevealableText from "./RevealableText";
import "./analytics_dashboard.css";

const STATUS_TONE = {
  Met: "up",
  "Near Target": "warn",
  "Below Target": "down",
  "Near Limit": "warn",
  "Exceeded Limit": "down",
  "No Target Set": "flat",
};

function yearToDateDefaults() {
  const today = new Date();
  return {
    from: `${today.getFullYear()}-01-01`,
    to: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
  };
}

const safeCsv = (value) => {
  const text = String(value ?? "");
  return `"${(/^[=+\-@]/.test(text) ? `'${text}` : text).replace(/"/g, '""')}"`;
};

export default function FinancialKpiMonitoringPage() {
  const defaults = useMemo(yearToDateDefaults, []);
  const [dates, setDates] = useState(defaults);
  const [applied, setApplied] = useState(defaults);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [drillOpen, setDrillOpen] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAnalytics("/api/analytics/financial-kpi", {
        start_date: applied.from,
        end_date: applied.to,
      });
      setAnalytics(data);
    } catch (loadError) {
      setError(loadError.message || "Could not load financial KPI monitoring data.");
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => { load(); }, [load]);

  const performance = analytics?.performance || {};
  const cashFlow = analytics?.cash_flow || {};
  const kpiPerformance = analytics?.kpi_performance || [];
  const monthlyTrend = analytics?.monthly_trend || [];
  const warnings = analytics?.warnings || [];
  const insights = analytics?.insights || [];

  const revenue = Number(performance.total_revenue || 0);
  const totalExpenses = Number(performance.total_expenses || 0);
  const netProfit = Number(performance.net_profit || 0);
  const collected = Number(cashFlow.collections || 0);
  const outstanding = Number(cashFlow.outstanding_receivables || 0);
  const accountsPayable = Number(cashFlow.accounts_payable || 0);

  // Derived KPI groupings for the three tables (all from live backend data).
  const performanceKpis = useMemo(() => [
    { label: "Total Revenue", value: revenue, display: money(revenue) },
    { label: "Total Expenses", value: totalExpenses, display: money(totalExpenses) },
    { label: "Net Profit / (Loss)", value: netProfit, display: money(netProfit) },
    { label: "Net Profit Margin", value: Number(performance.net_profit_margin || 0), display: percent(performance.net_profit_margin) },
    { label: "Operating Expense Ratio", value: Number(performance.operating_expense_ratio || 0), display: percent(performance.operating_expense_ratio) },
    { label: "Revenue Growth Rate", value: Number(performance.revenue_growth || 0), display: percent(performance.revenue_growth) },
  ], [revenue, totalExpenses, netProfit, performance]);

  const cashflowKpis = useMemo(() => [
    { label: "Net Cash Flow", value: Number(cashFlow.net_cash_flow || 0), display: money(cashFlow.net_cash_flow) },
    { label: "Collection Rate", value: Number(cashFlow.collection_rate || 0), display: percent(cashFlow.collection_rate) },
    { label: "Outstanding Receivables", value: outstanding, display: money(outstanding) },
    { label: "Accounts Payable", value: accountsPayable, display: money(accountsPayable) },
    { label: "Cash Flow Coverage", value: Number(cashFlow.cash_flow_coverage || 0), display: percent(cashFlow.cash_flow_coverage) },
    { label: "Overdue Receivables %", value: Number(cashFlow.overdue_receivables_pct || 0), display: percent(cashFlow.overdue_receivables_pct) },
  ], [cashFlow, outstanding, accountsPayable]);

  // Target vs Actual rows — the backend already evaluates direction and
  // achievement; we only add display strings for money/percent rendering.
  const targetPerformance = useMemo(
    () => kpiPerformance.map((row) => ({
      ...row,
      value: Number(row.actual || 0),
      actual_display: percent(row.actual),
      target_display: percent(row.target),
    })),
    [kpiPerformance],
  );

  // Flattened summary for the KPI stat cards — merges the two backend
  // sections so every card reads from one place.
  const summary = useMemo(() => ({
    invoice_count: Number(performance.invoice_count || 0),
    net_profit_margin: Number(performance.net_profit_margin || 0),
    revenue_growth: Number(performance.revenue_growth || 0),
    operating_expense_ratio: Number(performance.operating_expense_ratio || 0),
    net_cash_flow: Number(cashFlow.net_cash_flow || 0),
    collection_rate: Number(cashFlow.collection_rate || 0),
    overdue_receivables_pct: Number(cashFlow.overdue_receivables_pct || 0),
    cash_flow_coverage: Number(cashFlow.cash_flow_coverage || 0),
  }), [performance, cashFlow]);

  const trendChart = useMemo(
    () => monthlyTrend.map((row) => ({
      month: row.label,
      revenue: Number(row.revenue || 0),
      expenses: Number(row.expenses || 0),
      collected: Number(row.collected || 0),
      profit: Number(row.revenue || 0) - Number(row.expenses || 0),
    })),
    [monthlyTrend],
  );

  const exportCsv = () => {
    if (!analytics) return;
    const headers = ["Section", "KPI", "Actual", "Target", "Achievement %", "Status"];
    const rows = [];
    performanceKpis.forEach((k) => rows.push(["Performance", k.label, k.value, "", "", ""]));
    cashflowKpis.forEach((k) => rows.push(["Cash Flow & Collection", k.label, k.value, "", "", ""]));
    targetPerformance.forEach((k) => rows.push(["Target vs Actual", k.label, k.value, k.target, k.achievement, k.status]));
    const csv = [headers, ...rows].map((r) => r.map(safeCsv).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `financial-kpi-${applied.from}-to-${applied.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openDrill = (kpi) => setDrillOpen(kpi);
  return (
    <div className="analytics-dash-page">
      <div className="analytics-dash-heading">
        <div>
          <span className="analytics-dash-eyebrow">TARGET BASED · LIVE DATABASE</span>
          <h3>Financial KPI Monitoring</h3>
          <p>Whether PrimePower is hitting its financial targets — net profit, margin, growth, collection rate, cash flow and payables, each measured against its target. All figures computed from live billing, payment, expense, payroll and vendor records.</p>
        </div>
        <div className="analytics-dash-actions">
          <RefreshButton onClick={load} loading={loading} />
          <button type="button" className="light-button" onClick={() => window.print()}><Printer size={15} /> Print</button>
          <button type="button" className="primary-button" onClick={exportCsv} disabled={!analytics}><Download size={15} /> Export Excel</button>
        </div>
      </div>

      <DashFilters onSubmit={(e) => { e.preventDefault(); setApplied(dates); }}>
        <label>From<input type="date" value={dates.from} max={dates.to} onChange={(e) => setDates({ ...dates, from: e.target.value })} required /></label>
        <label>To<input type="date" value={dates.to} min={dates.from} onChange={(e) => setDates({ ...dates, to: e.target.value })} required /></label>
        <button type="submit" className="primary-button" disabled={loading}>Apply</button>
      </DashFilters>

      <DashState loading={loading && !analytics} error={error} empty={!loading && !error && !analytics} />

      {analytics ? (
        <>
          <div className="analytics-dash-cards">
            <DashCard label="Total Revenue" value={revenue} note={`${Number(summary.invoice_count || 0)} invoices`} />
            <DashCard label="Total Expenses" value={totalExpenses} tone={totalExpenses > revenue ? "danger" : undefined} note="Operating + payroll" />
            <DashCard label="Net Profit / (Loss)" value={netProfit} tone={netProfit >= 0 ? "good" : "danger"} note={`Margin ${percent(summary.net_profit_margin)}`} />
            <DashCard label="Net Cash Flow" value={summary.net_cash_flow} tone={summary.net_cash_flow >= 0 ? "good" : "danger"} note="Collected − expenses" />
          </div>
          <div className="analytics-dash-cards">
            <DashCard label="Collection Rate" display={percent(summary.collection_rate)} note="Collected ÷ revenue due" />
            <DashCard label="Revenue Growth" display={percent(summary.revenue_growth)} note="vs previous period" />
            <DashCard label="Outstanding Receivables" value={outstanding} tone={outstanding > 0 ? "danger" : "good"} note={`${percent(summary.overdue_receivables_pct)} overdue`} />
            <DashCard label="Accounts Payable" value={accountsPayable} note="Unpaid vendor invoices" />
            <DashCard label="Operating Expense Ratio" display={percent(summary.operating_expense_ratio)} note="Expenses ÷ revenue" />
            <DashCard label="Cash Flow Coverage" display={percent(summary.cash_flow_coverage)} note="Net cash flow ÷ expenses" />
          </div>

          {warnings.length ? (
            <div className="analytics-dash-alert" role="alert">
              <strong>{warnings.length} KPI warning{warnings.length > 1 ? "s" : ""}:</strong>
              <ul className="analytics-dash-insights">
                {warnings.map((w, i) => <li key={i}>{w.message || String(w)}</li>)}
              </ul>
            </div>
          ) : null}
          <div className="analytics-dash-grid">
            <DashPanel title="Financial Performance KPIs">
              <div className="analytics-dash-table-wrap">
                <table className="analytics-dash-table">
                  <thead><tr><th>KPI</th><th className="num">Value</th></tr></thead>
                  <tbody>
                    {performanceKpis.map((k, i) => (
                      <tr key={i}>
                        <td>{k.label}</td>
                        <td className="num"><RevealableAmount value={k.display ?? k.value} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DashPanel>

            <DashPanel title="Cash Flow & Collection KPIs">
              <div className="analytics-dash-table-wrap">
                <table className="analytics-dash-table">
                  <thead><tr><th>KPI</th><th className="num">Value</th></tr></thead>
                  <tbody>
                    {cashflowKpis.map((k, i) => (
                      <tr key={i}>
                        <td>{k.label}</td>
                        <td className="num"><RevealableAmount value={k.display ?? k.value} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DashPanel>
          </div>

          <DashPanel title="Target vs Actual KPI Performance">
            <div className="analytics-dash-table-wrap">
              <table className="analytics-dash-table">
                <thead>
                  <tr>
                    <th>KPI</th>
                    <th className="num">Actual</th>
                    <th className="num">Target</th>
                    <th className="num">Achievement</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {targetPerformance.map((row, i) => (
                    <tr key={i}>
                      <td><RevealableText value={row.label} /></td>
                      <td className="num"><RevealableAmount value={row.actual_display} /></td>
                      <td className="num"><RevealableAmount value={row.target_display} /></td>
                      <td className="num">{row.achievement !== null ? percent(row.achievement) : "—"}</td>
                      <td><span className={`analytics-dash-chip ${STATUS_TONE[row.status] || "flat"}`}>{row.status}</span></td>
                      <td><button type="button" className="light-button" onClick={() => openDrill(row)}>Drill down</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashPanel>
          <div className="analytics-dash-grid">
            <DashPanel title="Monthly KPI Trend">
              <div className="analytics-dash-chart">
                <ResponsiveContainer>
                  <LineChart data={trendChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => <RevealableAmount value={money(v)} />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#2878c7" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#e05252" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="collected" name="Collected" stroke="#1e8e5a" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#9b59b6" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </DashPanel>

            <DashPanel title="Revenue vs Expenses">
              <div className="analytics-dash-chart">
                <ResponsiveContainer>
                  <BarChart data={trendChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => <RevealableAmount value={money(v)} />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="revenue" name="Revenue" fill="#2878c7" />
                    <Bar dataKey="expenses" name="Expenses" fill="#e05252" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </DashPanel>
          </div>

          <DashPanel title="Recommendations">
            <ul className="analytics-dash-insights">
              {insights.length ? insights.map((line, i) => <li key={i}>{typeof line === "string" ? line : (line.message || String(line))}</li>) : <li>No recommendations for the selected period.</li>}
            </ul>
          </DashPanel>

          {drillOpen ? (
            <div className="modal-overlay" onClick={() => setDrillOpen(null)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div>
                    <h2>{drillOpen.label} — drill down</h2>
                    <p>Underlying records for the selected period ({applied.from} to {applied.to}).</p>
                  </div>
                  <button type="button" onClick={() => setDrillOpen(null)}>✕</button>
                </div>
                <div className="analytics-dash-drill">
                  <p>This KPI is computed live from the billing, payment, expense, payroll and vendor-payment records for the period above. Use the Revenue Reports, Income Statement, Cash Flow Monitoring and Payment Recording pages to inspect individual transactions.</p>
                  <ul className="analytics-dash-insights">
                    <li>Actual: <RevealableAmount value={drillOpen.actual_display} /></li>
                    {drillOpen.target !== null && drillOpen.target !== undefined ? <li>Target: <RevealableAmount value={drillOpen.target_display} /></li> : null}
                    {drillOpen.achievement !== null && drillOpen.achievement !== undefined ? <li>Achievement: {percent(drillOpen.achievement)}</li> : null}
                    <li>Status: {drillOpen.status}</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

