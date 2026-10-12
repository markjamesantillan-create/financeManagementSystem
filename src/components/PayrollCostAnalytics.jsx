// Payroll Cost Analytics — fully database-driven.
//
// Every figure comes from GET /api/analytics/payroll-cost via the shared
// fetchAnalytics helper. Nothing is hard-coded: the summary cards, charts,
// tables and insights are derived from live payroll release records and
// approved department budget allocations. Released vs pending is taken from
// each unique release_id, so no payroll payment is counted twice. The page
// re-fetches whenever the date filters change.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download } from "lucide-react";
import { fetchAnalytics } from "./analytics_api";
import { DashCard, DashFilters, DashPanel, DashState, RefreshButton, money, percent } from "./analytics_ui";
import RevealableAmount from "./RevealableAmount";
import RevealableText from "./RevealableText";
import "./analytics_dashboard.css";

const PIE_COLORS = ["#2878c7", "#1e8e5a", "#e6a23c", "#9b59b6", "#e05252", "#16a2b8", "#7f8c8d", "#d81b60"];

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

export default function PayrollCostAnalyticsPage() {
  const defaults = useMemo(yearToDateDefaults, []);
  const [dates, setDates] = useState(defaults);
  const [applied, setApplied] = useState(defaults);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAnalytics("/api/analytics/payroll-cost", {
        start_date: applied.from,
        end_date: applied.to,
      });
      setAnalytics(data);
    } catch (loadError) {
      setError(loadError.message || "Could not load payroll cost analytics.");
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => { load(); }, [load]);

  const summary = analytics?.summary || {};
  const byDepartment = analytics?.by_department || [];
  const monthlyTrend = analytics?.monthly_trend || [];

  const totalCost = Number(summary.total_payroll_cost || 0);
  const released = Number(summary.released_payroll || 0);
  const pending = Number(summary.pending_payroll || 0);
  const budget = Number(summary.approved_budget || 0);
  const variance = Number(summary.budget_variance || 0);
  const utilization = Number(summary.budget_utilization || 0);

  const departmentChart = useMemo(
    () => byDepartment.slice(0, 8).map((row) => ({ name: row.department, cost: Number(row.total_payroll_cost || 0), budget: Number(row.payroll_budget || 0) })),
    [byDepartment],
  );
  const distributionChart = useMemo(
    () => byDepartment.slice(0, 8).map((row) => ({ name: row.department, value: Number(row.total_payroll_cost || 0) })),
    [byDepartment],
  );
  const trendChart = useMemo(
    () => monthlyTrend.map((row) => ({ month: row.label, released: Number(row.released_payroll || 0), pending: Number(row.pending_payroll || 0) })),
    [monthlyTrend],
  );

  const insights = useMemo(() => {
    const list = [];
    const top = [...byDepartment].sort((a, b) => Number(b.total_payroll_cost || 0) - Number(a.total_payroll_cost || 0))[0];
    if (top) list.push(`${top.department} has the highest payroll cost at ${money(top.total_payroll_cost)} (${Number(top.employee_count || 0)} employees).`);
    const over = byDepartment.filter((row) => row.over_budget);
    if (over.length) {
      const worst = over.sort((a, b) => Number(b.budget_variance || 0) - Number(a.budget_variance || 0))[0];
      list.push(`${over.length} department(s) exceed their approved payroll budget. Largest overrun: ${worst.department} at ${money(Math.abs(Number(worst.budget_variance || 0)))} over — review the payroll allocation.`);
    }
    if (pending > 0) list.push(`${money(pending)} of payroll is still pending release and has not yet been disbursed.`);
    if (budget > 0) list.push(`Payroll consumes ${percent(utilization)} of the approved ₱${budget.toLocaleString("en-PH")} payroll budget.`);
    const growth = Number(summary.payroll_growth || 0);
    if (Number(summary.previous_period_payroll) > 0) {
      list.push(`Payroll ${growth >= 0 ? "increased" : "decreased"} ${percent(Math.abs(growth))} versus the previous comparable period.`);
    }
    if (!list.length) list.push("No payroll released for the selected period.");
    return list;
  }, [byDepartment, summary, pending, budget, utilization]);

  const exportCsv = () => {
    if (!analytics) return;
    const headers = ["Department", "Employees", "Payroll Cost", "Released", "Pending", "Approved Budget", "Variance", "Utilization %"];
    const rows = byDepartment.map((row) => [
      row.department, row.employee_count, row.total_payroll_cost, row.released_payroll, row.pending_payroll,
      row.payroll_budget, row.budget_variance, row.budget_utilization,
    ]);
    const blob = new Blob(["﻿", [headers, ...rows].map((r) => r.map(safeCsv).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `payroll-cost-analytics-${applied.from}-to-${applied.to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const submitFilters = (event) => { event.preventDefault(); setApplied(dates); };


  return (
    <div className="analytics-dash-page">
      <div className="analytics-dash-heading">
        <div>
          <span className="analytics-dash-eyebrow">LIVE DATABASE · PAYROLL RELEASES</span>
          <h3>Payroll Cost Analytics</h3>
          <p>Payroll spending, release status and budget utilisation by department, computed from live payroll releases and approved department budgets. Each release is counted once by its unique release ID.</p>
        </div>
        <div className="analytics-dash-actions">
          <RefreshButton onClick={load} loading={loading} />
          <button type="button" className="primary-button" onClick={exportCsv} disabled={!analytics}><Download size={15} /> Export Excel</button>
        </div>
      </div>

      <DashFilters onSubmit={submitFilters}>
        <label>From<input type="date" value={dates.from} max={dates.to} onChange={(e) => setDates({ ...dates, from: e.target.value })} required /></label>
        <label>To<input type="date" value={dates.to} min={dates.from} onChange={(e) => setDates({ ...dates, to: e.target.value })} required /></label>
        <button type="submit" className="primary-button" disabled={loading}>Apply</button>
      </DashFilters>

      <DashState loading={loading && !analytics} error={error} empty={!loading && !error && !byDepartment.length} />

      {summary.over_budget ? (
        <div className="analytics-dash-alert" role="alert">
          Payroll is ₱{Math.abs(variance).toLocaleString("en-PH")} over the approved budget ({percent(utilization)} utilisation).
        </div>
      ) : null}


      {analytics ? (
        <>
          <div className="analytics-dash-cards">
            <DashCard label="Total Payroll Cost" value={totalCost} note={`${Number(summary.release_count || 0)} releases`} />
            <DashCard label="Released Payroll" value={released} tone="good" note="Disbursed" />
            <DashCard label="Pending Payroll" value={pending} tone={pending > 0 ? "danger" : "good"} note="Awaiting release" />
            <DashCard label="Approved Budget" value={budget} note={`${percent(utilization)} utilised`} tone={summary.over_budget ? "danger" : "good"} />
          </div>

          <div className="analytics-dash-grid">
            <DashPanel title="Payroll Cost by Department">
              <div className="analytics-dash-chart">
                <ResponsiveContainer>
                  <BarChart data={departmentChart} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={48} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => <RevealableAmount value={money(v)} />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="cost" name="Actual Cost" fill="#2878c7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="budget" name="Budget" fill="#e6a23c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </DashPanel>

            <DashPanel title="Monthly Payroll Trend">
              <div className="analytics-dash-chart">
                <ResponsiveContainer>
                  <LineChart data={trendChart} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => <RevealableAmount value={money(v)} />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="released" name="Released" stroke="#1e8e5a" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="pending" name="Pending" stroke="#e6a23c" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </DashPanel>

            <DashPanel title="Payroll Distribution">
              <div className="analytics-dash-chart">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={distributionChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                      {distributionChart.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => <RevealableAmount value={money(v)} />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </DashPanel>
          </div>

          <DashPanel title="Insights">
            <ul className="analytics-dash-insights">
              {insights.map((line, index) => <li key={index}>{line}</li>)}
            </ul>
          </DashPanel>

          <DashPanel title="Payroll Cost by Department">
            <div className="analytics-dash-table-wrap">
              <table className="analytics-dash-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th className="num">Employees</th>
                    <th className="num">Payroll Cost</th>
                    <th className="num">Released</th>
                    <th className="num">Pending</th>
                    <th className="num">Budget</th>
                    <th className="num">Variance</th>
                    <th className="num">Utilisation</th>
                  </tr>
                </thead>
                <tbody>
                  {byDepartment.map((row, index) => (
                    <tr key={`${row.department}-${index}`}>
                      <td><RevealableText value={row.department} /></td>
                      <td className="num">{Number(row.employee_count || 0)}</td>
                      <td className="num"><RevealableAmount value={money(row.total_payroll_cost)} /></td>
                      <td className="num"><RevealableAmount value={money(row.released_payroll)} /></td>
                      <td className="num"><RevealableAmount value={money(row.pending_payroll)} /></td>
                      <td className="num"><RevealableAmount value={money(row.payroll_budget)} /></td>
                      <td className="num"><RevealableAmount value={money(row.budget_variance)} /></td>
                      <td className="num">
                        <span className={`analytics-dash-chip ${row.over_budget ? "over" : "up"}`}>{percent(row.budget_utilization)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashPanel>
        </>
      ) : null}
    </div>
  );
}
