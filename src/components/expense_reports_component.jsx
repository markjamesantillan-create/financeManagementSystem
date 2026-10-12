import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Filter,
  Printer,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import "./expense_reports.css";
import RevealableAmount from "./RevealableAmount";
import RevealableText from "./RevealableText";

const API_BASE = import.meta.env.VITE_API_URL || "";
const PAGE_SIZE = 15;

const CATEGORIES = [
  ["", "All Categories"],
  ["payroll", "Payroll Expenses"],
  ["office", "Office Expenses"],
  ["utilities", "Utility Expenses"],
  ["supplier_vendor", "Supplier & Vendor Expenses"],
  ["administrative", "Administrative Expenses"],
  ["transportation", "Transportation & Maintenance"],
  ["other", "Other Expenses"],
];
const DEPARTMENTS = [
  "All Departments",
  "Administration",
  "Finance",
  "Human Resources",
  "Sales",
  "Operations",
  "Information Technology",
  "Engineering",
  "Field Operations",
  "Technical",
  "Services",
];

const formatMoney = (value) => new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
}).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
};

function safeCsv(value) {
  const text = String(value ?? "");
  const protectedText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${protectedText.replace(/"/g, '""')}"`;
}

function StatusBadge({ value, type = "approval" }) {
  const normalized = String(value || "Pending").toLowerCase().replace(/[^a-z]+/g, "-");
  return <span className={`expense-status expense-status-${type} expense-status-${normalized}`}>{value || "Pending"}</span>;
}

function SummaryCard({ title, value, caption, icon: Icon, tone }) {
  return (
    <article className={`expense-summary-card expense-tone-${tone}`}>
      <div className="expense-summary-icon"><Icon size={19} /></div>
      <div className="expense-summary-label">{title}</div>
      <strong className="expense-summary-value"><RevealableAmount value={formatMoney(value)} /></strong>
      <div className="expense-summary-caption">{caption}</div>
    </article>
  );
}

function BarList({ items, valueKey = "amount", labelKey = "label", currency = true }) {
  const max = Math.max(1, ...items.map((item) => Number(item[valueKey] || 0)));
  if (!items.length) return <div className="expense-empty-chart">No data for this period.</div>;
  return (
    <div className="expense-bar-list">
      {items.map((item) => {
        const value = Number(item[valueKey] || 0);
        const percent = Math.max(0, Math.min(100, (value / max) * 100));
        return (
          <div className="expense-bar-item" key={item.key || item[labelKey]}>
            <div className="expense-bar-meta">
              <span title={item[labelKey]}>{item[labelKey]}</span>
              <strong>{currency ? <RevealableAmount value={formatMoney(value)} /> : `${value.toFixed(1)}%`}</strong>
            </div>
            <div className="expense-bar-track"><span style={{ width: `${percent}%` }} /></div>
          </div>
        );
      })}
    </div>
  );
}

export default function ExpenseReportsPage() {
  const [filters, setFilters] = useState({
    period: "monthly",
    from: "",
    to: "",
    category: "",
    department: "All Departments",
    status: "",
    payment_status: "",
    search: "",
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const requestNumber = useRef(0);

  const loadReport = async (nextFilters = filters) => {
    const currentRequest = ++requestNumber.current;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      Object.entries(nextFilters).forEach(([key, value]) => {
        if (value && value !== "All Departments") params.set(key, value);
      });
      const response = await fetch(`${API_BASE}/api/reports/expenses?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      const responseText = await response.text();
      let payload;
      try {
        payload = responseText ? JSON.parse(responseText) : null;
      } catch {
        throw new Error(
          `Expense report service returned an invalid response (HTTP ${response.status}). Check that the backend is running, then retry.`,
        );
      }
      if (!payload) {
        throw new Error(
          `Expense report service returned an empty response (HTTP ${response.status}). Check that the backend is running, then retry.`,
        );
      }
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || `Expense report request failed (${response.status}).`);
      }
      if (currentRequest === requestNumber.current) {
        setReport(payload);
        setSelected(null);
        setPageNumber(1);
      }
    } catch (requestError) {
      if (currentRequest === requestNumber.current) {
        setError(requestError.message || "Could not load expense report data.");
      }
    } finally {
      if (currentRequest === requestNumber.current) setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(filters);
    return () => { requestNumber.current += 1; };
  }, []);

  const summary = report?.summary || {};
  const transactions = report?.transactions || [];
  const pageCount = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const visibleTransactions = useMemo(() => {
    const start = (pageNumber - 1) * PAGE_SIZE;
    return transactions.slice(start, start + PAGE_SIZE);
  }, [transactions, pageNumber]);
  const previousTotal = Number(report?.previous_summary?.total_expenses || 0);
  const currentTotal = Number(summary.total_expenses || 0);
  const periodChange = previousTotal ? ((currentTotal - previousTotal) / previousTotal) * 100 : null;

  const setFilter = (key) => (event) => {
    const value = event.target.value;
    setFilters((current) => {
      if (key === "period") return { ...current, period: value, from: "", to: "" };
      if (key === "from" || key === "to") {
        const from = key === "from" ? value : current.from;
        const to = key === "to" ? value : current.to;
        return { ...current, [key]: value, period: from || to ? "custom" : "monthly" };
      }
      return { ...current, [key]: value };
    });
  };

  const generateReport = (event) => {
    event.preventDefault();
    loadReport(filters);
  };

  const exportExcel = () => {
    if (!report) return;
    const headers = [
      "Reference No.", "Description", "Category", "Department", "Expense Amount",
      "Paid Amount", "Transaction Date", "Payment Date", "Payment Method",
      "Recorded By", "Approval Status", "Payment Status", "Supporting Document",
    ];
    const rows = transactions.map((row) => [
      row.reference, row.description, row.category, row.department, row.amount,
      row.paid_amount, row.transaction_date, row.payment_date, row.payment_method,
      row.recorded_by, row.status, row.payment_status, row.document,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(safeCsv).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `expense-report-${report.period.from}-to-${report.period.to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const openDocument = (documentPath) => {
    if (/^(https?:\/\/|data:|blob:)/i.test(documentPath)) {
      window.open(documentPath, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="expense-report-page expense-report-print">
      <div className="expense-report-intro">
        <div>
          <span className="expense-eyebrow"><BarChart3 size={14} /> DATABASE-DRIVEN REPORT</span>
          <h3>Expense overview</h3>
          <p>Review recorded expense commitments and actual payments separately. Payment records are not counted again as new expenses.</p>
        </div>
        <div className="expense-report-toolbar">
          <button type="button" className="light-button" onClick={() => loadReport(filters)} disabled={loading}>
            <RefreshCw size={15} className={loading ? "expense-spin" : ""} /> Refresh Data
          </button>
          <button type="button" className="light-button" onClick={() => window.print()} disabled={!report}>
            <Printer size={15} /> Print / PDF
          </button>
          <button type="button" className="primary-button" onClick={exportExcel} disabled={!report}>
            <Download size={15} /> Export Excel
          </button>
        </div>
      </div>

      <form className="expense-filter-panel" onSubmit={generateReport}>
        <div className="expense-filter-title"><Filter size={16} /><strong>Report filters</strong></div>
        <div className="expense-filter-grid">
          <label>Date From<input type="date" value={filters.from} onChange={setFilter("from")} /></label>
          <label>Date To<input type="date" value={filters.to} onChange={setFilter("to")} /></label>
          <label>Period
            <select value={filters.period} onChange={setFilter("period")}>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
              <option value="custom">Custom dates</option>
            </select>
          </label>
          <label>Expense Category
            <select value={filters.category} onChange={setFilter("category")}>
              {CATEGORIES.map(([value, label]) => <option value={value} key={value || "all"}>{label}</option>)}
            </select>
          </label>
          <label>Department
            <select value={filters.department} onChange={setFilter("department")}>
              {DEPARTMENTS.map((department) => <option key={department}>{department}</option>)}
            </select>
          </label>
          <label>Approval Status
            <select value={filters.status} onChange={setFilter("status")}>
              <option value="">All statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected / Cancelled</option>
            </select>
          </label>
          <label>Payment Status
            <select value={filters.payment_status} onChange={setFilter("payment_status")}>
              <option value="">All payment statuses</option>
              <option value="paid">Paid</option>
              <option value="partial">Partially Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="failed">Failed</option>
            </select>
          </label>
          <label className="expense-search-filter">Search reference / description
            <span className="expense-search-input"><Search size={15} /><input value={filters.search} onChange={setFilter("search")} placeholder="e.g. EXP-2026-004" /></span>
          </label>
          <button className="primary-button expense-generate-button" type="submit" disabled={loading}>
            <CalendarDays size={15} /> {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </form>

      {error && <div className="expense-report-error"><AlertCircle size={17} /><span>{error}</span><button type="button" onClick={() => loadReport(filters)}>Try again</button></div>}
      {loading && !report && <div className="expense-report-loading"><RefreshCw size={18} className="expense-spin" /> Loading expense records from the database...</div>}
      {report && (
        <>
          <div className="expense-report-period">
            <span><CalendarDays size={15} /> {formatDate(report.period.from)} – {formatDate(report.period.to)}</span>
            <span>{Number(report.meta?.total_count || 0).toLocaleString()} matching transactions</span>
            {periodChange !== null && (
              <span className={periodChange > 0 ? "expense-change-up" : "expense-change-down"}>
                {periodChange > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(periodChange).toFixed(1)}% vs previous period
              </span>
            )}
          </div>

          <div className="expense-summary-grid">
            <SummaryCard title="Total Expenses" value={summary.total_expenses} caption="Approved expense recognition; payments are separate" icon={Wallet} tone="blue" />
            <SummaryCard title="Approved Expenses" value={summary.approved_expenses} caption="Approved expense records" icon={CheckCircle2} tone="green" />
            <SummaryCard title="Pending Expenses" value={summary.pending_expenses} caption="Awaiting review or approval" icon={CalendarDays} tone="orange" />
            <SummaryCard title="Rejected Expenses" value={summary.rejected_expenses} caption="Rejected, cancelled, or failed" icon={X} tone="red" />
            <SummaryCard title="Month to Date" value={summary.month_to_date} caption="Current month through today" icon={BarChart3} tone="purple" />
            <SummaryCard title="Year to Date" value={summary.year_to_date} caption="Current year through today" icon={TrendingUp} tone="cyan" />
          </div>

          <div className="expense-analysis-grid">
            <section className="expense-report-card expense-trend-card">
              <div className="expense-card-heading"><div><span className="expense-card-kicker">13-MONTH VIEW</span><h4>Monthly expense trend</h4></div><BarChart3 size={18} /></div>
              <div className="expense-trend-chart">
                {(report.monthly_trend?.items || []).map((item) => {
                  const max = Math.max(1, ...(report.monthly_trend?.items || []).map((value) => Number(value.amount || 0)));
                  const height = Math.max(4, (Number(item.amount || 0) / max) * 100);
                  return (
                    <div className="expense-trend-column" key={item.monthKey} title={item.label}>
                      <span><RevealableAmount value={formatMoney(item.amount)} /></span>
                      <div className="expense-trend-bar-area"><i style={{ height: `${height}%` }} /></div>
                      <small>{item.label}</small>
                    </div>
                  );
                })}
              </div>
              <div className="expense-period-compare">
                <span>Selected period <strong><RevealableAmount value={formatMoney(currentTotal)} /></strong></span>
                <span>Previous period <strong><RevealableAmount value={formatMoney(previousTotal)} /></strong></span>
              </div>
            </section>

            <section className="expense-report-card">
              <div className="expense-card-heading"><div><span className="expense-card-kicker">SPENDING MIX</span><h4>Expenses by category</h4></div><FileText size={18} /></div>
              <BarList items={report.category_breakdown?.items || []} />
            </section>

            <section className="expense-report-card">
              <div className="expense-card-heading"><div><span className="expense-card-kicker">COST CENTERS</span><h4>Department spending</h4></div><Wallet size={18} /></div>
              <BarList items={report.department_comparison?.items || []} labelKey="department" />
            </section>
          </div>

          <section className="expense-report-card expense-budget-card">
            <div className="expense-card-heading"><div><span className="expense-card-kicker">FISCAL YEAR {report.budget_vs_actual?.budget_year}</span><h4>Budget vs. actual expenses</h4></div></div>
            <div className="expense-budget-table-wrap">
              <table className="expense-budget-table">
                <thead><tr><th>Category</th><th>Allocated Budget</th><th>Actual</th><th>Remaining</th><th>Utilization</th></tr></thead>
                <tbody>
                  {(report.budget_vs_actual?.items || [])
                    .filter((item) => !filters.category || item.key === filters.category)
                    .map((item) => (
                    <tr key={item.key}>
                      <td>{item.label}</td><td><RevealableAmount value={formatMoney(item.budget)} /></td><td><RevealableAmount value={formatMoney(item.actual)} /></td>
                      <td className={item.variance < 0 ? "expense-over-budget" : ""}><RevealableAmount value={formatMoney(item.variance)} /></td>
                      <td><div className="expense-utilization"><span><i style={{ width: `${Math.max(0, Math.min(Number(item.utilization || 0), 100))}%` }} /></span><b>{Number(item.utilization || 0).toFixed(0)}%</b></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="expense-report-card expense-transactions-card">
            <div className="expense-card-heading">
              <div><span className="expense-card-kicker">SOURCE RECORDS</span><h4>Expense transaction details</h4><p>Expense amount and paid amount are separate to distinguish recognition from cash settlement.</p></div>
              <span className="expense-record-count">{Number(report.meta?.total_count || 0).toLocaleString()} records</span>
            </div>
            <div className="expense-table-wrap">
              <table className="expense-transaction-table">
                <thead><tr>
                  <th>Reference / Description</th><th>Category</th><th>Department</th><th>Expense Amount</th>
                  <th>Paid Amount</th><th>Transaction Date</th><th>Payment Method</th>
                  <th>Approval</th><th>Payment</th><th>Recorded By</th><th>Receipt</th><th>Details</th>
                </tr></thead>
                <tbody>
                  {visibleTransactions.map((row, index) => (
                    <tr key={`${row.source}-${row.reference}-${index}`}>
                      <td><strong><RevealableText value={row.reference || "—"} /></strong><small><RevealableText value={row.description || "—"} /></small></td>
                      <td>{row.category}</td><td>{row.department}</td>
                      <td className="expense-table-money"><RevealableAmount value={formatMoney(row.amount)} /></td>
                      <td className="expense-table-paid"><RevealableAmount value={formatMoney(row.paid_amount)} /></td>
                      <td>{formatDate(row.transaction_date)}</td><td>{row.payment_method}</td>
                      <td><StatusBadge value={row.status} /></td>
                      <td><StatusBadge value={row.payment_status} type="payment" /></td>
                      <td><RevealableText value={row.recorded_by || "—"} /></td>
                      <td>{row.document ? (
                        /^(https?:\/\/|data:|blob:)/i.test(row.document)
                          ? <button className="expense-link-button" type="button" onClick={() => openDocument(row.document)}>View</button>
                          : <span className="expense-document-name" title={row.document}>{row.document}</span>
                      ) : "—"}</td>
                      <td><button className="expense-link-button" type="button" onClick={() => setSelected(row)}>View</button></td>
                    </tr>
                  ))}
                  {!visibleTransactions.length && <tr><td colSpan="12" className="expense-table-empty">{loading ? "Updating report..." : "No expense records match these filters."}</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="expense-pagination">
              <span>Showing {transactions.length ? (pageNumber - 1) * PAGE_SIZE + 1 : 0}–{Math.min(pageNumber * PAGE_SIZE, transactions.length)} of {transactions.length}</span>
              <div>
                <button type="button" onClick={() => setPageNumber((value) => Math.max(1, value - 1))} disabled={pageNumber <= 1}><ChevronLeft size={15} /> Previous</button>
                <b>{pageNumber} / {pageCount}</b>
                <button type="button" onClick={() => setPageNumber((value) => Math.min(pageCount, value + 1))} disabled={pageNumber >= pageCount}>Next <ChevronRight size={15} /></button>
              </div>
            </div>
          </section>

          <div className="expense-accounting-note"><AlertCircle size={15} /><span>{report.accounting_basis}</span></div>

          {selected && (
            <div className="expense-detail-backdrop" role="presentation" onClick={() => setSelected(null)}>
              <section className="expense-detail-modal" role="dialog" aria-modal="true" aria-label="Expense transaction details" onClick={(event) => event.stopPropagation()}>
                <div className="expense-detail-heading"><div><span className="expense-card-kicker">{selected.source}</span><h4><RevealableText value={selected.reference || "—"} /></h4></div><button type="button" onClick={() => setSelected(null)} aria-label="Close details"><X size={18} /></button></div>
                <p className="expense-detail-description"><RevealableText value={selected.description || "—"} /></p>
                <dl className="expense-detail-grid">
                  <div><dt>Category</dt><dd>{selected.category}</dd></div>
                  <div><dt>Department / Cost Center</dt><dd>{selected.department}</dd></div>
                  <div><dt>Expense amount</dt><dd><RevealableAmount value={formatMoney(selected.amount)} /></dd></div>
                  <div><dt>Paid amount</dt><dd><RevealableAmount value={formatMoney(selected.paid_amount)} /></dd></div>
                  <div><dt>Transaction date</dt><dd>{formatDate(selected.transaction_date)}</dd></div>
                  <div><dt>Payment date</dt><dd>{formatDate(selected.payment_date)}</dd></div>
                  <div><dt>Payment method</dt><dd>{selected.payment_method}</dd></div>
                  <div><dt>Recorded by</dt><dd><RevealableText value={selected.recorded_by || "—"} /></dd></div>
                  <div><dt>Approval status</dt><dd><StatusBadge value={selected.status} /></dd></div>
                  <div><dt>Payment status</dt><dd><StatusBadge value={selected.payment_status} type="payment" /></dd></div>
                  <div className="expense-detail-document"><dt>Supporting receipt / document</dt><dd><RevealableText value={selected.document || "No supporting document recorded."} /></dd></div>
                </dl>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
