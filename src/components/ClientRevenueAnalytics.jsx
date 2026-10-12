// Client Revenue Analytics — fully database-driven.
//
// Every figure on this page comes from GET /api/analytics/client-revenue via
// the shared fetchAnalytics helper. There are no hard-coded amounts: the
// summary cards, charts, tables and insights are all derived from live
// billing, payment and receivable records. The page re-fetches whenever the
// date filters change, so it refreshes as billing/payment transactions change.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, RefreshCw } from "lucide-react";
import { fetchAnalytics } from "./analytics_api";
import { DashCard, DashFilters, DashPanel, DashState, RefreshButton, TrendChip, money, percent } from "./analytics_ui";
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

export default function ClientRevenueAnalyticsPage() {
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
      const data = await fetchAnalytics("/api/analytics/client-revenue", {
        start_date: applied.from,
        end_date: applied.to,
      });
      setAnalytics(data);
    } catch (loadError) {
      setError(loadError.message || "Could not load client revenue analytics.");
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => { load(); }, [load]);

  const summary = analytics?.summary || {};
  const byClient = analytics?.by_client || [];
  const byContract = analytics?.by_contract || [];
  const monthlyTrend = analytics?.monthly_trend || [];

  const totalBilled = Number(summary.total_billed || 0);
  const totalCollected = Number(summary.total_collected || 0);
  const outstanding = Number(summary.outstanding_balance || 0);
  const previousBilled = Number(summary.previous_period_billed || 0);
  const revenueGrowth = Number(summary.revenue_growth || 0);

  // Top 8 clients / contracts keep the charts legible; the tables show them all.
  const clientChart = useMemo(
    () => byClient.slice(0, 8).map((row) => ({ name: row.client, billed: Number(row.total_billed || 0), collected: Number(row.total_collected || 0) })),
    [byClient],
  );
  const contractChart = useMemo(
    () => byContract.slice(0, 8).map((row) => ({ name: row.contract, value: Number(row.total_billed || 0) })),
    [byContract],
  );
  const trendChart = useMemo(
    () => monthlyTrend.map((row) => ({ month: row.label, billed: Number(row.billed || 0), collected: Number(row.collected || 0) })),
    [monthlyTrend],
  );

  const insights = useMemo(() => {
    const list = [];
    const top = byClient[0];
    if (top) list.push(`Top client: ${top.client} contributes ${percent(top.revenue_contribution)} of billed revenue (${money(top.total_billed)}).`);
    const declining = byClient.filter((row) => row.revenue_trend === "declining");
    if (declining.length) list.push(`${declining.length} client(s) collected less than they were billed — review their collections.`);
    const highOutstanding = [...byClient].sort((a, b) => Number(b.outstanding_balance || 0) - Number(a.outstanding_balance || 0))[0];
    if (highOutstanding && Number(highOutstanding.outstanding_balance || 0) > 0) {
      list.push(`${highOutstanding.client} carries the largest outstanding balance of ${money(highOutstanding.outstanding_balance)} — follow up on overdue invoices.`);
    }
    const growth = Number(summary.revenue_growth || 0);
    if (Number(summary.previous_period_billed) > 0) {
      list.push(`Revenue ${growth >= 0 ? "grew" : "declined"} ${percent(Math.abs(growth))} versus the previous comparable period.`);
    }
    if (totalBilled > 0 && totalCollected < totalBilled) {
      list.push(`Collection gap: ${money(totalBilled - totalCollected)} billed but not yet verified as collected.`);
    }
    if (!list.length) list.push("No client revenue recorded for the selected period.");
    return list;
  }, [byClient, summary, totalBilled, totalCollected]);

  const exportCsv = () => {
    if (!analytics) return;
    const headers = ["Client", "Total Billed", "Total Collected", "Outstanding Balance", "Revenue Contribution %", "Revenue Trend"];
    const rows = byClient.map((row) => [
      row.client, row.total_billed, row.total_collected, row.outstanding_balance, row.revenue_contribution, row.revenue_trend,
    ]);
    const blob = new Blob(["﻿", [headers, ...rows].map((r) => r.map(safeCsv).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `client-revenue-analytics-${applied.from}-to-${applied.to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const submitFilters = (event) => { event.preventDefault(); setApplied(dates); };

  return (
    <div className="analytics-dash-page">
      <div className="analytics-dash-heading">
        <div>
          <span className="analytics-dash-eyebrow">ACCRUAL BASIS · LIVE DATABASE</span>
          <h3>Client Revenue Analytics</h3>
          <p>Revenue, collections and outstanding balances per client and contract, computed from live billing and receivable records. Invoices count as collected only once their payments are verified.</p>
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

      <DashState loading={loading && !analytics} error={error} empty={!loading && !error && !byClient.length} />

      {outstanding > 0 ? (
        <div className="analytics-dash-alert" role="alert">
          {money(outstanding)} of billed revenue remains outstanding (billed but not verified as collected).
        </div>
      ) : null}

      {analytics ? (
        <>
          <div className="analytics-dash-cards">
            <DashCard label="Total Billed" value={totalBilled} note={`${Number(summary.invoice_count || 0)} invoices`} />
            <DashCard label="Total Collected" value={totalCollected} tone="good" note="Verified payments" />
            <DashCard label="Outstanding Balance" value={outstanding} tone={outstanding > 0 ? "danger" : "good"} note="Billed − collected" />
            <DashCard label="Previous Period Billed" value={previousBilled} note={previousBilled > 0 ? "Comparable prior period" : "No prior period data"} />
          </div>
          <div className="analytics-dash-cards">
            <div className="analytics-dash-chip-row">
              <TrendChip value={revenueGrowth} suffix="vs previous period" />
            </div>
          </div>

          <div className="analytics-dash-grid">
            <DashPanel title="Revenue by Client">
              <div className="analytics-dash-chart">
                <ResponsiveContainer>
                  <BarChart data={clientChart} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={48} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => <RevealableAmount value={money(v)} />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="billed" name="Billed" fill="#2878c7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="collected" name="Collected" fill="#1e8e5a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </DashPanel>

            <DashPanel title="Monthly Revenue Trend">
              <div className="analytics-dash-chart">
                <ResponsiveContainer>
                  <LineChart data={trendChart} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => <RevealableAmount value={money(v)} />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="billed" name="Billed" stroke="#2878c7" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="collected" name="Collected" stroke="#1e8e5a" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </DashPanel>

            <DashPanel title="Revenue by Contract">
              <div className="analytics-dash-chart">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={contractChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                      {contractChart.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => <RevealableAmount value={money(v)} />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </DashPanel>

            <DashPanel title="Billed vs Collected Revenue">
              <div className="analytics-dash-chart">
                <ResponsiveContainer>
                  <BarChart data={[{ name: "Period", billed: totalBilled, collected: totalCollected }]} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => <RevealableAmount value={money(v)} />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="billed" name="Billed" fill="#2878c7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="collected" name="Collected" fill="#1e8e5a" radius={[4, 4, 0, 0]} />
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

          <DashPanel title="Client Revenue">
            <div className="analytics-dash-table-wrap">
              <table className="analytics-dash-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th className="num">Total Billed</th>
                    <th className="num">Total Collected</th>
                    <th className="num">Outstanding Balance</th>
                    <th className="num">Contribution</th>
                    <th>Revenue Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {byClient.map((row, index) => (
                    <tr key={`${row.client}-${index}`}>
                      <td><RevealableText value={row.client} /></td>
                      <td className="num"><RevealableAmount value={money(row.total_billed)} /></td>
                      <td className="num"><RevealableAmount value={money(row.total_collected)} /></td>
                      <td className="num"><RevealableAmount value={money(row.outstanding_balance)} /></td>
                      <td className="num">{percent(row.revenue_contribution)}</td>
                      <td>
                        <span className={`analytics-dash-chip ${row.revenue_trend === "increasing" ? "up" : row.revenue_trend === "declining" ? "down" : "flat"}`}>
                          {row.revenue_trend}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashPanel>

          <DashPanel title="Revenue by Contract">
            <div className="analytics-dash-table-wrap">
              <table className="analytics-dash-table">
                <thead>
                  <tr>
                    <th>Contract</th>
                    <th>Service</th>
                    <th className="num">Total Billed</th>
                    <th className="num">Total Collected</th>
                    <th className="num">Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {byContract.map((row, index) => (
                    <tr key={`${row.contract}-${index}`}>
                      <td><RevealableText value={row.contract} /></td>
                      <td><RevealableText value={row.service} /></td>
                      <td className="num"><RevealableAmount value={money(row.total_billed)} /></td>
                      <td className="num"><RevealableAmount value={money(row.total_collected)} /></td>
                      <td className="num">{percent(row.revenue_contribution)}</td>
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

