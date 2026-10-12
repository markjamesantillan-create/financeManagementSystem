import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Eye, Filter, Printer, RefreshCw, Search } from "lucide-react";
import RevealableAmount from "./RevealableAmount";
import RevealableText from "./RevealableText";
import "./revenue_profit_reports.css";

const API_BASE = import.meta.env.VITE_API_URL || "";
const money = (value) => new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
}).format(Number(value || 0));
const dateText = (value) => {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
};
const safeCsv = (value) => {
  const text = String(value ?? "");
  return `"${(/^[=+\-@]/.test(text) ? `'${text}` : text).replace(/"/g, '""')}"`;
};

function ReportCard({ label, value, note }) {
  return (
    <article className="finance-report-card">
      <span>{label}</span>
      <strong><RevealableAmount value={money(value)} /></strong>
      {note && <small>{note}</small>}
    </article>
  );
}

function ReportError({ message, onRetry }) {
  if (!message) return null;
  return <div className="finance-report-error" role="alert">{message}<button type="button" onClick={onRetry}>Retry</button></div>;
}

function dateDefaults() {
  const today = new Date();
  return {
    from: `${today.getFullYear()}-01-01`,
    to: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
  };
}

function GrowthTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="finance-chart-tooltip">
      <strong>{label}</strong>
      <div>Revenue: <RevealableAmount value={money(row.revenue)} /></div>
      <div>Growth: <RevealableText value={`${Number(row.growth || 0).toFixed(1)}%`} /></div>
    </div>
  );
}

function groupTrend(items, grouping) {
  const groups = new Map();
  items.forEach((item) => {
    const [year, month] = item.month_key.split("-").map(Number);
    const quarter = Math.ceil(month / 3);
    const key = grouping === "annual"
      ? String(year)
      : grouping === "quarterly"
        ? `${year}-Q${quarter}`
        : item.month_key;
    const label = grouping === "annual"
      ? String(year)
      : grouping === "quarterly"
        ? `Q${quarter} ${year}`
        : item.label;
    groups.set(key, { key, label, revenue: (groups.get(key)?.revenue || 0) + Number(item.revenue || 0) });
  });
  const rows = [...groups.values()];
  return rows.map((row, index) => ({
    ...row,
    growth: index > 0 && rows[index - 1].revenue
      ? ((row.revenue - rows[index - 1].revenue) / rows[index - 1].revenue) * 100
      : 0,
  }));
}

export function RevenueReportsPage() {
  const [dates, setDates] = useState(dateDefaults);
  const [filters, setFilters] = useState({ client: "", category: "", search: "" });
  const [grouping, setGrouping] = useState("monthly");
  const [report, setReport] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState(0);

  const loadReport = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ ...dates, ...filters });
      const response = await fetch(`${API_BASE}/api/reports/revenue?${params}`, {
        headers: { Accept: "application/json" },
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || `Revenue report request failed (${response.status}).`);
      }
      setReport(payload);
      setSelected(null);
    } catch (loadError) {
      setError(loadError.message || "Could not load revenue report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReport(); }, [requestId]);

  const transactions = report?.transactions || [];
  const trend = useMemo(() => groupTrend(report?.monthly_trend || [], grouping), [report, grouping]);
  const summary = report?.summary || {};
  const change = Number(summary.previous_period_revenue)
    ? ((Number(summary.total_revenue || 0) - Number(summary.previous_period_revenue)) / Number(summary.previous_period_revenue)) * 100
    : null;

  const submitFilters = (event) => {
    event.preventDefault();
    setRequestId((value) => value + 1);
  };
  const exportCsv = () => {
    if (!report) return;
    const headers = ["Invoice Number", "Client", "Contract", "Category", "Invoice Date", "Payment Date", "Invoice Amount", "Revenue", "Payments Received", "Remaining Balance", "Payment Status", "Reference / Receipt"];
    const rows = transactions.map((row) => [
      row.invoice_number, row.client_name, row.contract_no, row.revenue_category,
      row.invoice_date, row.payment_date, row.invoice_amount, row.revenue_amount,
      row.amount_collected, row.remaining_balance, row.payment_status, row.receipt_reference,
    ]);
    const blob = new Blob(["\uFEFF", [headers, ...rows].map((row) => row.map(safeCsv).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `revenue-report-${report.period.from}-to-${report.period.to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const printReport = () => window.print();

  return (
    <div className="finance-report-page">
      <div className="finance-report-heading">
        <div>
          <span className="finance-report-eyebrow">ACCRUAL BASIS · LIVE DATABASE REPORT</span>
          <h3>Revenue Reports</h3>
          <p>Valid issued billings are recognized as revenue; client collections are reported separately and are not added again.</p>
        </div>
        <div className="finance-report-actions">
          <button type="button" className="light-button" onClick={() => setRequestId((value) => value + 1)} disabled={loading}><RefreshCw size={15} /> Refresh</button>
          <button type="button" className="light-button" onClick={printReport} disabled={!report}><Printer size={15} /> Print / PDF</button>
          <button type="button" className="primary-button" onClick={exportCsv} disabled={!report}><Download size={15} /> Export Excel</button>
        </div>
      </div>

      <form className="finance-report-filters" onSubmit={submitFilters}>
        <div className="finance-filter-title"><Filter size={16} /><strong>Report filters</strong></div>
        <label>Invoice date from<input type="date" value={dates.from} onChange={(event) => setDates({ ...dates, from: event.target.value })} required /></label>
        <label>Invoice date to<input type="date" value={dates.to} onChange={(event) => setDates({ ...dates, to: event.target.value })} required /></label>
        <label>Client<input value={filters.client} onChange={(event) => setFilters({ ...filters, client: event.target.value })} placeholder="All clients" /></label>
        <label>Revenue category<input value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })} placeholder="All categories" /></label>
        <label className="finance-filter-search">Search invoices<span><Search size={15} /><input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Invoice, contract, client..." /></span></label>
        <button type="submit" className="primary-button" disabled={loading}>{loading ? "Loading..." : "Apply Filters"}</button>
      </form>

      <ReportError message={error} onRetry={() => setRequestId((value) => value + 1)} />
      {loading && !report && <div className="finance-report-loading">Loading issued invoices and verified collections...</div>}
      {report && (
        <>
          <div className="finance-report-meta">
            <span>{dateText(report.period.from)} – {dateText(report.period.to)}</span>
            <span>{Number(summary.invoice_count || 0).toLocaleString()} issued invoices</span>
            <span>{change === null ? "No previous-period baseline" : <><RevealableText value={`${change >= 0 ? "+" : ""}${change.toFixed(1)}%`} /> vs previous period</>}</span>
          </div>
          <div className="finance-report-cards">
            <ReportCard label="Total Revenue" value={summary.total_revenue} note="Issued service amount, net of discounts" />
            <ReportCard label="Revenue This Month" value={summary.revenue_this_month} />
            <ReportCard label="Revenue This Year" value={summary.revenue_this_year} />
            <ReportCard label="Outstanding Revenue" value={summary.outstanding_revenue} note="Uncollected invoice balance in selected period" />
            <ReportCard label="Overdue Revenue" value={summary.overdue_revenue} note="Outstanding invoices past due" />
            <ReportCard label="Collections" value={summary.collections} note="Verified receipts; shown separately from revenue" />
          </div>

          <section className="finance-report-panel">
            <div className="finance-panel-heading">
              <div><h4>Revenue trends</h4><p>Recognized invoice revenue and change from the previous period.</p></div>
              <select aria-label="Trend period" value={grouping} onChange={(event) => setGrouping(event.target.value)}>
                <option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option>
              </select>
            </div>
            {trend.length ? (
              <div className="finance-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trend} margin={{ top: 12, right: 12, bottom: 2, left: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" />
                    <YAxis yAxisId="revenue" tickFormatter={() => "₱***"} />
                    <YAxis yAxisId="growth" orientation="right" tickFormatter={(value) => `${Number(value).toFixed(0)}%`} />
                    <Tooltip content={<GrowthTooltip />} />
                    <Legend />
                    <Bar yAxisId="revenue" dataKey="revenue" name="Revenue" fill="#2878c7" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="growth" dataKey="growth" name="Growth %" stroke="#1b9b75" strokeWidth={2} dot />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : <div className="finance-report-empty">No issued invoices in the trend period.</div>}
          </section>

          <section className="finance-report-panel">
            <div className="finance-panel-heading"><div><h4>Revenue by client and contract</h4><p>Invoice amounts, receipts, and receivable balances are distinct measures.</p></div></div>
            <div className="finance-report-table-wrap">
              <table className="finance-report-table">
                <thead><tr><th>Client</th><th>Contract No.</th><th>Contract Amount</th><th>Invoice Amount</th><th>Payments Received</th><th>Remaining Balance</th></tr></thead>
                <tbody>{(report.clients || []).length ? report.clients.map((row) => (
                  <tr key={`${row.client_name}-${row.contract_no}`}>
                    <td><RevealableText value={row.client_name} /></td><td><RevealableText value={row.contract_no} /></td>
                    <td><RevealableAmount value={money(row.contract_amount)} /></td><td><RevealableAmount value={money(row.invoice_amount)} /></td>
                    <td><RevealableAmount value={money(row.payments_received)} /></td><td><RevealableAmount value={money(row.remaining_balance)} /></td>
                  </tr>
                )) : <tr><td colSpan="6" className="finance-report-empty">No revenue by client for this period.</td></tr>}</tbody>
              </table>
            </div>
          </section>

          <section className="finance-report-panel">
            <div className="finance-panel-heading"><div><h4>Revenue transaction details</h4><p>Up to 500 issued invoices matching the filters.</p></div></div>
            <div className="finance-report-table-wrap">
              <table className="finance-report-table">
                <thead><tr><th>Invoice</th><th>Client</th><th>Category</th><th>Invoice Date</th><th>Payment Date</th><th>Revenue</th><th>Collected</th><th>Status</th><th>Details</th></tr></thead>
                <tbody>{transactions.length ? transactions.map((row) => (
                  <tr key={row.invoice_number}>
                    <td><RevealableText value={row.invoice_number} /></td><td><RevealableText value={row.client_name} /></td>
                    <td><RevealableText value={row.revenue_category} /></td><td>{dateText(row.invoice_date)}</td><td>{dateText(row.payment_date)}</td>
                    <td><RevealableAmount value={money(row.revenue_amount)} /></td><td><RevealableAmount value={money(row.amount_collected)} /></td>
                    <td>{row.payment_status}</td><td><button type="button" className="finance-icon-button" onClick={() => setSelected(row)} aria-label={`View ${row.invoice_number} details`}><Eye size={16} /></button></td>
                  </tr>
                )) : <tr><td colSpan="9" className="finance-report-empty">No issued invoices match these filters.</td></tr>}</tbody>
              </table>
            </div>
          </section>
        </>
      )}
      {selected && (
        <div className="finance-report-modal-backdrop" role="presentation" onClick={() => setSelected(null)}>
          <section className="finance-report-modal" role="dialog" aria-modal="true" aria-labelledby="revenue-invoice-details" onClick={(event) => event.stopPropagation()}>
            <div className="finance-panel-heading"><h4 id="revenue-invoice-details">Invoice details</h4><button type="button" onClick={() => setSelected(null)} aria-label="Close details">×</button></div>
            <dl>
              <dt>Invoice</dt><dd><RevealableText value={selected.invoice_number} /></dd>
              <dt>Client</dt><dd><RevealableText value={selected.client_name} /></dd>
              <dt>Contract</dt><dd><RevealableText value={selected.contract_no} /></dd>
              <dt>Invoice amount</dt><dd><RevealableAmount value={money(selected.invoice_amount)} /></dd>
              <dt>Accrual revenue</dt><dd><RevealableAmount value={money(selected.revenue_amount)} /></dd>
              <dt>Collected</dt><dd><RevealableAmount value={money(selected.amount_collected)} /></dd>
              <dt>Balance</dt><dd><RevealableAmount value={money(selected.remaining_balance)} /></dd>
              <dt>Receipt / Reference</dt><dd><RevealableText value={selected.receipt_reference || "—"} /></dd>
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}

function ProfitTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="finance-chart-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => <div key={item.dataKey}>{item.name}: <RevealableAmount value={money(item.value)} /></div>)}
    </div>
  );
}

export function ProfitAnalysisPage() {
  const [filters, setFilters] = useState({ period: "monthly", from: "", to: "", department: "" });
  const [report, setReport] = useState(null);
  const [revenueReport, setRevenueReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState(0);

  const loadReport = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ period: filters.period });
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      if (filters.department) params.set("department", filters.department);
      const response = await fetch(`${API_BASE}/api/reports/income-statement?${params}`, {
        headers: { Accept: "application/json" },
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || `Profit report request failed (${response.status}).`);
      }
      const revenueParams = new URLSearchParams({ from: payload.period.from, to: payload.period.to });
      const revenueResponse = await fetch(`${API_BASE}/api/reports/revenue?${revenueParams}`, {
        headers: { Accept: "application/json" },
      });
      const revenuePayload = await revenueResponse.json();
      if (!revenueResponse.ok || !revenuePayload.success) {
        throw new Error(revenuePayload.message || `Profit transaction request failed (${revenueResponse.status}).`);
      }
      setReport(payload);
      setRevenueReport(revenuePayload);
    } catch (loadError) {
      setError(loadError.message || "Could not load profit analysis.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadReport(); }, [requestId]);

  const summary = report?.summary || {};
  const previous = report?.previous_summary || {};
  const trend = report ? [
    { name: "Previous period", revenue: Number(previous.total_revenue || 0), expenses: Number(previous.total_expenses || 0), profit: Number(previous.net_income || 0) },
    { name: "Selected period", revenue: Number(summary.total_revenue || 0), expenses: Number(summary.total_expenses || 0), profit: Number(summary.net_income || 0) },
  ] : [];
  const expenseItems = [
    ...(report?.sections?.cost_of_services?.items || []),
    ...(report?.sections?.operating_expenses?.items || []),
    ...(report?.sections?.other_income_expenses?.items || []).filter((item) => Number(item.amount || 0) < 0).map((item) => ({ ...item, amount: Math.abs(Number(item.amount)) })),
    ...(report?.sections?.tax_expense?.items || []),
  ];
  const marginChange = Number(previous.net_profit_margin)
    ? Number(summary.net_profit_margin || 0) - Number(previous.net_profit_margin)
    : null;
  const budget = report?.budget_analysis || null;
  const budgetCategories = budget?.categories || [];
  const budgetRecommendations = budget?.recommendations || [];
  const submitFilters = (event) => {
    event.preventDefault();
    setRequestId((value) => value + 1);
  };
  const printReport = () => window.print();
  const exportCsv = () => {
    if (!report || !revenueReport) return;
    const rows = [
      ["Profit Analysis", "Amount"],
      ["Revenue", summary.total_revenue],
      ["Total Expenses", summary.total_expenses],
      ["Gross Profit", summary.gross_profit],
      ["Operating Profit", summary.operating_income],
      ["Net Profit", summary.net_income],
      ["Net Profit Margin (%)", summary.net_profit_margin],
      [],
      ["Expense Category", "Current Period", "Previous Period"],
      ...expenseItems.map((item) => [item.label, item.amount, item.prev_amount]),
      [],
      ["Invoice Number", "Client", "Category", "Invoice Date", "Revenue", "Payments Received", "Status", "Reference"],
      ...(revenueReport.transactions || []).map((row) => [
        row.invoice_number, row.client_name, row.revenue_category, row.invoice_date,
        row.revenue_amount, row.amount_collected, row.payment_status, row.receipt_reference,
      ]),
      [],
      ["Expense / Receipt Source", "Reference", "Payee / Client", "Category", "Date", "Amount", "Status"],
      ...(report.details || []).map((row) => [row.source, row.reference, row.entity, row.category, row.date, row.amount, row.status]),
      [],
      ["Budget Analysis", budget?.available ? `Fiscal Year ${budget.fiscal_year}` : "No budget allocations found"],
      ["Budget Target", budget?.budget_target ?? 0],
      ["Budget Actual", budget?.budget_actual ?? 0],
      ["Variance", budget?.variance ?? 0],
      ["Overrun", budget?.overrun ?? 0],
      ["Utilization (%)", budget?.utilization ?? 0],
      [],
      ["Budget Category", "Allocated", "Actual", "Variance", "Utilization (%)"],
      ...budgetCategories.map((row) => [row.category, row.budget, row.actual, row.variance, row.utilization]),
      [],
      ["Recommendations"],
      ...budgetRecommendations.map((note) => [note]),
    ];
    const blob = new Blob(["\uFEFF", rows.map((row) => row.map(safeCsv).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `profit-analysis-${report.period.from}-to-${report.period.to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="finance-report-page">
      <div className="finance-report-heading">
        <div><span className="finance-report-eyebrow">DATABASE-DRIVEN · ACCRUAL REVENUE</span><h3>Profit Analysis</h3><p>Revenue is recognized from valid issued invoices, not from payments received. Expenses use categorized records included in the income statement.</p></div>
        <div className="finance-report-actions">
          <button type="button" className="light-button" onClick={() => setRequestId((value) => value + 1)} disabled={loading}><RefreshCw size={15} /> Refresh</button>
          <button type="button" className="light-button" onClick={printReport} disabled={!report || !revenueReport}><Printer size={15} /> Print / PDF</button>
          <button type="button" className="primary-button" onClick={exportCsv} disabled={!report || !revenueReport}><Download size={15} /> Export Excel</button>
        </div>
      </div>
      <form className="finance-report-filters" onSubmit={submitFilters}>
        <div className="finance-filter-title"><Filter size={16} /><strong>Analysis filters</strong></div>
        <label>Period<select value={filters.period} onChange={(event) => setFilters({ ...filters, period: event.target.value, from: "", to: "" })}><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option><option value="custom">Custom dates</option></select></label>
        <label>Date from<input type="date" value={filters.from} required={filters.period === "custom"} onChange={(event) => setFilters({ ...filters, from: event.target.value, period: "custom" })} /></label>
        <label>Date to<input type="date" value={filters.to} required={filters.period === "custom"} onChange={(event) => setFilters({ ...filters, to: event.target.value, period: "custom" })} /></label>
        <label>Department<input value={filters.department} onChange={(event) => setFilters({ ...filters, department: event.target.value })} placeholder="All departments" /></label>
        <button type="submit" className="primary-button" disabled={loading}>{loading ? "Loading..." : "Apply Filters"}</button>
      </form>
      <ReportError message={error} onRetry={() => setRequestId((value) => value + 1)} />
      {loading && !report && <div className="finance-report-loading">Calculating profit from recorded revenue and expenses...</div>}
      {report && (
        <>
          <div className="finance-report-meta"><span>{dateText(report.period.from)} – {dateText(report.period.to)}</span><span>Comparison: {dateText(report.comparison_period?.from)} – {dateText(report.comparison_period?.to)}</span>{marginChange !== null && <span><RevealableText value={`${marginChange >= 0 ? "+" : ""}${marginChange.toFixed(1)} percentage points`} /> net margin change</span>}</div>
          <div className="finance-report-cards">
            <ReportCard label="Total Revenue" value={summary.total_revenue} note="Accrual basis: issued billings" />
            <ReportCard label="Total Expenses" value={summary.total_expenses} note="Cost of services, operations, other costs, and tax" />
            <ReportCard label="Gross Profit" value={summary.gross_profit} note="Revenue less cost of services" />
            <ReportCard label="Operating Profit" value={summary.operating_income} />
            <ReportCard label="Net Profit" value={summary.net_income} note={Number(summary.net_income) < 0 ? "Negative-profit period" : "After recorded tax expense"} />
            <article className="finance-report-card"><span>Net Profit Margin</span><strong><RevealableText value={`${Number(summary.net_profit_margin || 0).toFixed(2)}%`} /></strong><small>Net profit ÷ revenue</small></article>
          </div>
          <section className="finance-report-panel">
            <div className="finance-panel-heading"><div><h4>Profitability comparison</h4><p>Selected period against the matching previous period.</p></div></div>
            <div className="finance-chart">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trend} margin={{ top: 12, right: 12, bottom: 2, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" />
                  <YAxis tickFormatter={() => "₱***"} /><Tooltip content={<ProfitTooltip />} /><Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#2878c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#e9963d" radius={[4, 4, 0, 0]} />
                  <Line dataKey="profit" name="Net Profit" stroke="#1b9b75" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="finance-report-panel">
            <div className="finance-panel-heading"><div><h4>Expense breakdown</h4><p>Categories returned by the income statement calculations.</p></div></div>
            <div className="finance-report-table-wrap"><table className="finance-report-table">
              <thead><tr><th>Category</th><th>Current Period</th><th>Previous Period</th><th>Change</th></tr></thead>
              <tbody>{expenseItems.length ? expenseItems.map((item) => {
                const current = Number(item.amount || 0);
                const before = Number(item.prev_amount || 0);
                return <tr key={item.key}><td>{item.label}</td><td><RevealableAmount value={money(current)} /></td><td><RevealableAmount value={money(before)} /></td><td><RevealableText value={before ? `${(((current - before) / before) * 100).toFixed(1)}%` : "—"} /></td></tr>;
              }) : <tr><td colSpan="4" className="finance-report-empty">No expense breakdown is available for this period.</td></tr>}</tbody>
            </table></div>
          </section>
          <section className="finance-report-panel">
            <div className="finance-panel-heading"><div><h4>Revenue transactions</h4><p>Issued invoice revenue is shown separately from receipts.</p></div></div>
            <div className="finance-report-table-wrap"><table className="finance-report-table">
              <thead><tr><th>Invoice</th><th>Client</th><th>Category</th><th>Invoice Date</th><th>Revenue</th><th>Collected</th><th>Status</th><th>Reference</th></tr></thead>
              <tbody>{(revenueReport?.transactions || []).length ? revenueReport.transactions.map((row) => (
                <tr key={row.invoice_number}><td><RevealableText value={row.invoice_number} /></td><td><RevealableText value={row.client_name} /></td><td><RevealableText value={row.revenue_category} /></td><td>{dateText(row.invoice_date)}</td><td><RevealableAmount value={money(row.revenue_amount)} /></td><td><RevealableAmount value={money(row.amount_collected)} /></td><td>{row.payment_status}</td><td><RevealableText value={row.receipt_reference || "—"} /></td></tr>
              )) : <tr><td colSpan="8" className="finance-report-empty">No issued revenue transactions for this period.</td></tr>}</tbody>
            </table></div>
          </section>
          <section className="finance-report-panel">
            <div className="finance-panel-heading"><div><h4>Expense and receipt transactions</h4><p>Detail rows returned by the income statement, up to 100 records.</p></div></div>
            <div className="finance-report-table-wrap"><table className="finance-report-table">
              <thead><tr><th>Source</th><th>Reference</th><th>Payee / Client</th><th>Category</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>{(report.details || []).length ? report.details.map((row, index) => (
                <tr key={`${row.source}-${row.reference || index}`}><td>{row.source}</td><td><RevealableText value={row.reference || "—"} /></td><td><RevealableText value={row.entity || "—"} /></td><td><RevealableText value={row.category || "—"} /></td><td>{dateText(row.date)}</td><td><RevealableAmount value={money(row.amount)} /></td><td>{row.status}</td></tr>
              )) : <tr><td colSpan="7" className="finance-report-empty">No expense or receipt transaction details for this period.</td></tr>}</tbody>
            </table></div>
          </section>
          <section className="finance-report-panel">
            <div className="finance-panel-heading"><div><h4>Budget analysis</h4><p>Department budget targets versus actual spend{budget?.available ? ` for fiscal year ${budget.fiscal_year}` : " (no allocations found)"}.</p></div></div>
            {budget?.available ? (
              <>
                <div className="finance-report-stat-row">
                  <div className="finance-report-stat"><span>Budget Target</span><strong><RevealableAmount value={money(budget.budget_target)} /></strong></div>
                  <div className="finance-report-stat"><span>Actual Spend</span><strong><RevealableAmount value={money(budget.budget_actual)} /></strong></div>
                  <div className="finance-report-stat"><span>Variance</span><strong><RevealableAmount value={money(budget.variance)} /></strong></div>
                  <div className="finance-report-stat"><span>Utilization</span><strong>{budget.utilization}%</strong></div>
                </div>
                {budget.overrun > 0 && (
                  <p className="finance-report-alert" role="alert">Over budget by <RevealableAmount value={money(budget.overrun)} />.</p>
                )}
                {budgetCategories.length ? (
                  <div className="finance-report-table-wrap"><table className="finance-report-table">
                    <thead><tr><th>Category</th><th>Allocated</th><th>Actual</th><th>Variance</th><th>Utilization</th></tr></thead>
                    <tbody>{budgetCategories.map((row) => (
                      <tr key={row.category}><td><RevealableText value={row.category} /></td><td><RevealableAmount value={money(row.budget)} /></td><td><RevealableAmount value={money(row.actual)} /></td><td><RevealableAmount value={money(row.variance)} /></td><td>{row.utilization}%</td></tr>
                    ))}</tbody>
                  </table></div>
                ) : (
                  <p className="finance-report-empty">No budget categories found for this period.</p>
                )}
              </>
            ) : (
              <p className="finance-report-empty">No department budget allocations were found for {budget?.fiscal_year || "this fiscal year"}. Set budget targets in Fund &amp; Budget Management to enable overrun tracking.</p>
            )}
          </section>
          <section className="finance-report-panel">
            <div className="finance-panel-heading"><div><h4>Recommendations</h4><p>Automated guidance derived from this period's figures.</p></div></div>
            {budgetRecommendations.length ? (
              <ul className="finance-report-recommendations">
                {budgetRecommendations.map((note, index) => <li key={index}>{note}</li>)}
              </ul>
            ) : (
              <p className="finance-report-empty">No recommendations available.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
