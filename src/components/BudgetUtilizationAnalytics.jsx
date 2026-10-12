// Budget Utilization Analytics — fully database-driven.
//
// Every figure comes from GET /api/analytics/budget-utilization via the
// shared fetchAnalytics helper. Nothing is hard-coded: the overview cards,
// department table, monthly budget-vs-actual chart, progress bars, ranking,
// alerts and CSV export are derived from live department budget allocations
// and posted expenses. The page re-fetches whenever the date, fiscal year or
// department filters change.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
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
  "Within Limit": "up",
  "Approaching Limit": "flat",
  "Over Budget": "down",
  "No Budget Set": "flat",
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

export default function BudgetUtilizationAnalyticsPage() {
  const defaults = useMemo(yearToDateDefaults, []);
  const [dates, setDates] = useState(defaults);
  const [applied, setApplied] = useState(defaults);
  const [fiscalYear, setFiscalYear] = useState(String(new Date().getFullYear()));
  const [department, setDepartment] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAnalytics("/api/analytics/budget-utilization", {
        start_date: applied.from,
        end_date: applied.to,
        fiscal_year: fiscalYear,
        department,
      });
      setAnalytics(data);
    } catch (loadError) {
      setError(loadError.message || "Could not load budget utilization analytics.");
    } finally {
      setLoading(false);
    }
  }, [applied, fiscalYear, department]);

  useEffect(() => { load(); }, [load]);

  const summary = analytics?.summary || {};
  const departments = analytics?.departments || [];
  const monthlyTrend = analytics?.monthly_trend || [];
  const alerts = analytics?.alerts || [];
  const spendingRanking = analytics?.spending_ranking || [];
  const availableDepartments = analytics?.available_departments || [];

  const totalApproved = Number(summary.total_approved_budget || 0);
  const totalUsed = Number(summary.total_budget_used || 0);
  const remaining = Number(summary.remaining_budget || 0);
  const utilization = Number(summary.overall_utilization || 0);
  const overBudget = Number(summary.total_over_budget || 0);

  const departmentChart = useMemo(
    () => departments.slice(0, 8).map((row) => ({
      name: row.department,
      budget: Number(row.approved_budget || 0),
      actual: Number(row.actual_expenses || 0),
    })),
    [departments],
  );
  const trendChart = useMemo(
    () => monthlyTrend.map((row) => ({
      month: row.label,
      budget: Number(row.budget || 0),
      actual: Number(row.actual || 0),
    })),
    [monthlyTrend],
  );
  const insights = useMemo(() => {
    const lines = [];
    if (!departments.length) return lines;
    if (Number(summary.departments_over_limit || 0) > 0) {
      lines.push(`${summary.departments_over_limit} department(s) exceed their approved budget, totalling ₱${overBudget.toLocaleString("en-PH", { minimumFractionDigits: 2 })} overspent.`);
    }
    if (Number(summary.departments_approaching_limit || 0) > 0) {
      lines.push(`${summary.departments_approaching_limit} department(s) have used 85% or more of their budget — review before they breach their limits.`);
    }
    if (spendingRanking.length) {
      lines.push(`Highest spender: ${spendingRanking[0].department} at ₱${Number(spendingRanking[0].actual_expenses || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })} (${spendingRanking[0].utilization}% of budget).`);
    }
    if (utilization < 50 && totalApproved > 0) {
      lines.push(`Overall utilization is only ${utilization}% — a large portion of the approved budget remains unused.`);
    } else if (utilization >= 85 && totalApproved > 0) {
      lines.push(`Overall utilization is ${utilization}% — the company is close to exhausting its approved budget.`);
    } else if (totalApproved > 0) {
      lines.push(`Overall utilization is ${utilization}% — spending is within a healthy range against the approved budget.`);
    }
    if (remaining < 0) {
      lines.push(`The company has overspent its total approved budget by ₱${Math.abs(remaining).toLocaleString("en-PH", { minimumFractionDigits: 2 })}.`);
    }
    return lines;
  }, [departments, summary, spendingRanking, utilization, totalApproved, overBudget, remaining]);

  const exportCsv = () => {
    const rows = [
      ["Department", "Approved Budget", "Actual Expenses", "Remaining", "Utilization (%)", "Status"],
      ...departments.map((row) => [
        row.department,
        Number(row.approved_budget || 0).toFixed(2),
        Number(row.actual_expenses || 0).toFixed(2),
        Number(row.remaining_budget || 0).toFixed(2),
        Number(row.utilization || 0).toFixed(2),
        row.status,
      ]),
      ["Total", totalApproved.toFixed(2), totalUsed.toFixed(2), remaining.toFixed(2), utilization.toFixed(2), ""],
    ];
    const csv = rows.map((row) => row.map(safeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `budget-utilization-${applied.from}-to-${applied.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="analytics-dash-page">
      <div className="analytics-dash-heading">
        <div>
          <span className="analytics-dash-eyebrow">LIVE DATABASE</span>
          <h3>Budget Utilization Analytics</h3>
          <p>Approved budget vs. actual spending per department — live from budget allocations and posted expenses. Utilization = Actual Expenses ÷ Approved Budget × 100.</p>
        </div>
        <div className="analytics-dash-actions">
          <RefreshButton onClick={load} loading={loading} />
          <button type="button" className="light-button" onClick={() => window.print()}><Printer size={15} /> Print</button>
          <button type="button" className="light-button" onClick={exportCsv} disabled={!departments.length}><Download size={15} /> Export CSV</button>
        </div>
      </div>

      <DashFilters onSubmit={(event) => { event.preventDefault(); setApplied(dates); }}>
        <label>
          From
          <input type="date" value={dates.from} onChange={(event) => setDates((prev) => ({ ...prev, from: event.target.value }))} />
        </label>
        <label>
          To
          <input type="date" value={dates.to} onChange={(event) => setDates((prev) => ({ ...prev, to: event.target.value }))} />
        </label>
        <label>
          Fiscal Year
          <select value={fiscalYear} onChange={(event) => setFiscalYear(event.target.value)}>
            {[0, 1, 2].map((offset) => {
              const year = String(new Date().getFullYear() - offset);
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
        </label>
        <label>
          Department
          <select value={department} onChange={(event) => setDepartment(event.target.value)}>
            <option value="">All Departments</option>
            {availableDepartments.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <button type="submit" className="primary-button" disabled={loading}>Apply Filters</button>
      </DashFilters>

      <DashState loading={loading} error={error} empty={!loading && !error && analytics && !departments.length} />

      {!loading && !error && analytics ? (
        <>
          <div className="analytics-dash-cards">
            <DashCard label="Total Approved Budget" value={totalApproved} note={`${departments.length} department(s) · FY ${analytics.fiscal_year}`} />
            <DashCard label="Total Budget Used" value={totalUsed} note="Actual expenses posted" />
            <DashCard label="Remaining Budget" value={remaining} tone={remaining < 0 ? "danger" : undefined} note={remaining < 0 ? "Overspent" : "Available to spend"} />
            <article className="analytics-dash-card">
              <span>Overall Utilization</span>
              <strong>{percent(utilization)}</strong>
              <small>Actual ÷ Approved × 100</small>
            </article>
            <DashCard label="Total Over-Budget Amount" value={overBudget} tone={overBudget > 0 ? "danger" : undefined} note={`${Number(summary.departments_over_limit || 0)} department(s) over limit`} />
          </div>

          {alerts.length > 0 && (
            <DashPanel title={`Budget Alerts (${alerts.length})`}>
              <ul className="analytics-dash-insights">
                {alerts.map((alert, index) => (
                  <li key={index}>
                    <span className={`analytics-dash-chip ${STATUS_TONE[alert.status] || "flat"}`}>{alert.status}</span> {alert.message}
                  </li>
                ))}
              </ul>
            </DashPanel>
          )}
          <div className="analytics-dash-grid">
            <DashPanel title="Budget vs. Actual Spending (Monthly)">
              <div className="analytics-dash-chart">
                <ResponsiveContainer>
                  <ComposedChart data={trendChart}>
                    <CartesianGrid stroke="#eef2f6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => <RevealableAmount value={money(v)} />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="actual" name="Actual Expenses" fill="#2878c7" barSize={22} />
                    <Line type="monotone" dataKey="budget" name="Monthly Budget" stroke="#e6a23c" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </DashPanel>

            <DashPanel title="Department Budget Utilization">
              <div className="analytics-dash-chart">
                <ResponsiveContainer>
                  <BarChart data={departmentChart}>
                    <CartesianGrid stroke="#eef2f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => <RevealableAmount value={money(v)} />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="budget" name="Approved Budget" fill="#9b59b6" barSize={16} />
                    <Bar dataKey="actual" name="Actual Expenses" fill="#2878c7" barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </DashPanel>
          </div>

          <DashPanel title="Insights">
            <ul className="analytics-dash-insights">
              {insights.map((line, index) => <li key={index}>{line}</li>)}
            </ul>
          </DashPanel>

          <DashPanel title="Highest-Spending Departments">
            <ol className="analytics-dash-insights">
              {spendingRanking.map((row) => (
                <li key={row.department}>
                  #{row.rank} <RevealableText value={row.department} /> — <RevealableAmount value={money(row.actual_expenses)} /> ({row.utilization}% of budget)
                </li>
              ))}
            </ol>
          </DashPanel>
          <DashPanel title="Department Budget Utilization">
            <div className="analytics-dash-table-wrap">
              <table className="analytics-dash-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th className="num">Approved Budget</th>
                    <th className="num">Actual Expenses</th>
                    <th className="num">Remaining</th>
                    <th className="num">Utilization</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((row) => (
                    <tr key={row.department}>
                      <td><RevealableText value={row.department} /></td>
                      <td className="num"><RevealableAmount value={money(row.approved_budget)} /></td>
                      <td className="num"><RevealableAmount value={money(row.actual_expenses)} /></td>
                      <td className="num"><RevealableAmount value={money(row.remaining_budget)} /></td>
                      <td className="num">
                        <div className="analytics-dash-progress">
                          <span className="analytics-dash-progress-track">
                            <span
                              className={`analytics-dash-progress-bar ${row.over_budget ? "over" : row.utilization >= 85 ? "warn" : ""}`}
                              style={{ width: `${Math.min(Number(row.utilization || 0), 100)}%` }}
                            />
                          </span>
                          <em>{row.approved_budget > 0 ? percent(row.utilization) : "—"}</em>
                        </div>
                      </td>
                      <td><span className={`analytics-dash-chip ${STATUS_TONE[row.status] || "flat"}`}>{row.status}</span></td>
                    </tr>
                  ))}
                  <tr>
                    <td><strong>Total</strong></td>
                    <td className="num"><strong><RevealableAmount value={money(totalApproved)} /></strong></td>
                    <td className="num"><strong><RevealableAmount value={money(totalUsed)} /></strong></td>
                    <td className="num"><strong><RevealableAmount value={money(remaining)} /></strong></td>
                    <td className="num"><strong>{percent(utilization)}</strong></td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </DashPanel>
        </>
      ) : null}
    </div>
  );
}




