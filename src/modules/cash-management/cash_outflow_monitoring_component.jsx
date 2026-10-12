import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Banknote, ChartNoAxesCombined, CircleAlert, Download, Eye, FileText, HandCoins, Landmark, Percent, Printer, ReceiptText, RefreshCw, X } from "lucide-react";
import RevealableAmount from "../../components/RevealableAmount";
import "../../styles/cash-management/cash_outflow_monitoring.css";

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
const PERIODS = ["daily", "weekly", "monthly", "quarterly", "yearly"];
const money = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const formatDate = (value) => value
  ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString()
  : "—";
const statusClass = (value) => String(value || "").toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
const ALL_ACCOUNTS = "All Accounts";
const ALL_SOURCES = "All Sources";
const ALL_CATEGORIES = "All Categories";
const ALL_STATUSES = "All Statuses";
const OUTFLOW_ICONS = [Landmark, FileText, Banknote, HandCoins, CircleAlert, Percent];
const OUTFLOW_TONES = ["blue", "purple", "red", "orange", "amber", "cyan"];

async function api(path) {
  const response = await fetch(`${API_BASE}${path}`, { headers: { Accept: "application/json" } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Cash outflow request failed (${response.status}).`);
  }
  return payload;
}

function downloadCsv(rows, anchor) {
  const columns = [
    ["Reference", "outflow_reference"], ["Date", "transaction_date"], ["Source", "source_type"],
    ["Payee", "payee"], ["Category", "category"], ["Account", "account_name"],
    ["Expected Amount", "expected_amount"], ["Actual Amount", "actual_amount"],
    ["Variance", "variance"], ["Payment Method", "payment_method"], ["Status", "status"],
    ["Approved By", "approved_by"], ["Released By", "released_by"],
  ];
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const content = [
    columns.map(([label]) => escape(label)).join(","),
    ...rows.map((row) => columns.map(([, key]) => escape(row[key])).join(",")),
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `cash-outflows-${anchor}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function CashOutflowMonitoringPage({ onAudit = () => {} }) {
  const [periodType, setPeriodType] = useState("monthly");
  const [anchor, setAnchor] = useState(today);
  const [period, setPeriod] = useState(null);
  const [filterApplyVersion, setFilterApplyVersion] = useState(0);
  const [filters, setFilters] = useState({
    account: ALL_ACCOUNTS, source: ALL_SOURCES, category: ALL_CATEGORIES, status: ALL_STATUSES, search: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [forecast, setForecast] = useState({});
  const [trend, setTrend] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [sources, setSources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const requestIdRef = useRef(0);

  const accountsQuery = useMemo(
    () => new URLSearchParams({ period: periodType, anchor }).toString(),
    [periodType, anchor],
  );
  const query = useMemo(() => {
    const params = new URLSearchParams({ period: periodType, anchor });
    if (appliedFilters.account !== ALL_ACCOUNTS) params.set("account", appliedFilters.account);
    if (appliedFilters.source !== ALL_SOURCES) params.set("source", appliedFilters.source);
    if (appliedFilters.category !== ALL_CATEGORIES) params.set("category", appliedFilters.category);
    if (appliedFilters.status !== ALL_STATUSES) params.set("status", appliedFilters.status);
    if (appliedFilters.search.trim()) params.set("search", appliedFilters.search.trim());
    return params.toString();
  }, [periodType, anchor, appliedFilters]);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    try {
      const [list, summaryResult, forecastResult, trendResult, alertsResult, accountsResult] = await Promise.all([
        api(`/api/cash-flow/outflows?${query}`),
        api(`/api/cash-flow/outflows/summary?${query}`),
        api(`/api/cash-flow/outflows/forecast?${query}`),
        api(`/api/cash-flow/outflows/trend?${query}`),
        api(`/api/cash-flow/outflows/alerts?${query}`),
        api(`/api/cash-flow/accounts?${accountsQuery}`),
      ]);
      if (requestId !== requestIdRef.current) return;
      setRows(list.data || []);
      setSummary(summaryResult.data || {});
      setForecast(forecastResult.data || {});
      setTrend(trendResult.data || []);
      setAlerts(alertsResult.data || []);
      setAccounts(accountsResult.data || []);
      setSources(list.filters?.sources || []);
      setCategories(list.filters?.categories || []);
      setStatuses(list.filters?.statuses || []);
      setPeriod(list.period);
    } catch (loadError) {
      if (requestId === requestIdRef.current) {
        setError(loadError.message || "Cash outflow information could not be loaded.");
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [query, accountsQuery]);

  useEffect(() => { load(); }, [load, filterApplyVersion]);

  const applyFilters = (event) => {
    event.preventDefault();
    const nextFilters = { ...filters, search: filters.search.trim() };
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setFilterApplyVersion((version) => version + 1);
  };

  const hasUnappliedFilters = Object.keys(filters).some((key) => filters[key] !== appliedFilters[key]);

  const movePeriod = (step) => {
    const date = new Date(`${anchor}T00:00:00.000Z`);
    if (periodType === "daily") date.setUTCDate(date.getUTCDate() + step);
    if (periodType === "weekly") date.setUTCDate(date.getUTCDate() + step * 7);
    if (periodType === "monthly") date.setUTCMonth(date.getUTCMonth() + step, 1);
    if (periodType === "quarterly") date.setUTCMonth(date.getUTCMonth() + step * 3, 1);
    if (periodType === "yearly") date.setUTCFullYear(date.getUTCFullYear() + step, 0, 1);
    setAnchor(date.toISOString().slice(0, 10));
  };

  const openDetails = async (row) => {
    try {
      const result = await api(`/api/cash-flow/outflows/${encodeURIComponent(row.id)}?${query}`);
      setSelected(result.data);
    } catch (loadError) {
      setError(loadError.message || "Outflow details could not be loaded.");
    }
  };

  const summaryCards = [
    ["Opening Cash Balance", summary.opening_cash_balance, "balance"],
    ["Expected Outflow", summary.expected_outflow, "expected"],
    ["Actual Outflow", summary.actual_outflow, "actual"],
    ["Pending Outflow", summary.pending_outflow, "pending"],
    ["Variance", summary.variance, "variance"],
    ["Outflow Rate", `${Number(summary.outflow_rate || 0).toFixed(2)}%`, "rate"],
  ];
  const maxTrendAmount = Math.max(1, ...trend.flatMap((item) => [
    Number(item.expected_outflow || 0), Number(item.actual_outflow || 0),
  ]));

  return (
    <section className="cash-outflow-page">
      <div className="page-header">
        <div>
          <h2><ChartNoAxesCombined size={25} /> Cash Outflow Monitoring</h2>
          <p>Monitor payable obligations and actual disbursements from supplier, utility, office expense, payroll, tax, and cash records.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="light-button" onClick={load} disabled={loading}><RefreshCw size={14} /> Refresh</button>
          <button type="button" className="light-button" onClick={() => { downloadCsv(rows, anchor); onAudit?.("Exported cash outflow report", `${rows.length} records`); }} disabled={loading}><Download size={14} /> Export</button>
          <button type="button" className="light-button" onClick={() => window.print()}><Printer size={14} /> Print</button>
        </div>
      </div>

      {error && <p className="error-message" role="alert">{error}</p>}

      <form className="co-filter-bar" onSubmit={applyFilters} aria-busy={loading}>
        <div className="co-period-tabs" role="group" aria-label="Monitoring period">
          {PERIODS.map((item) => (
            <button type="button" key={item} className={periodType === item ? "active" : ""} aria-pressed={periodType === item} onClick={() => setPeriodType(item)}>
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
        <label>Period <input type="date" value={anchor} onChange={(event) => setAnchor(event.target.value)} /></label>
        <div className="co-period-stepper">
          <button type="button" aria-label="Previous period" onClick={() => movePeriod(-1)}><ArrowLeft size={14} /></button>
          <span>{period?.label || "Selected period"}</span>
          <button type="button" aria-label="Next period" onClick={() => movePeriod(1)}><ArrowRight size={14} /></button>
        </div>
        <label>Account
          <select value={filters.account} onChange={(event) => setFilters({ ...filters, account: event.target.value })}>
            <option>{ALL_ACCOUNTS}</option>
            {accounts.map((item) => <option key={item.account_name}>{item.account_name}</option>)}
          </select>
        </label>
        <label>Source
          <select value={filters.source} onChange={(event) => setFilters({ ...filters, source: event.target.value })}>
            <option>{ALL_SOURCES}</option>
            {sources.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>Category
          <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
            <option>{ALL_CATEGORIES}</option>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>Status
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option>{ALL_STATUSES}</option>
            {statuses.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="co-search-filter">Search
          <input type="search" value={filters.search} placeholder="Reference, payee, category…" onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        </label>
        <button type="submit" className="primary-button co-apply-button">Apply Filters</button>
        <p className="co-filter-feedback" role="status" aria-live="polite">
          {loading
            ? "Loading outflows for the selected filters…"
            : `${rows.length} outflow ${rows.length === 1 ? "record" : "records"} match the applied filters.`}
          {hasUnappliedFilters && !loading ? " Filter changes are not applied yet." : ""}
        </p>
      </form>

      <section className="co-summary-grid" aria-label="Cash outflow summary">
        {summaryCards.map(([label, value, kind], index) => {
          const Icon = OUTFLOW_ICONS[index];
          return <article className={`co-summary-card co-summary-${OUTFLOW_TONES[index]}`} key={label}>
            <span className="co-summary-icon"><Icon size={18} /></span>
            <div className="co-summary-content"><span>{label}</span>
              {loading ? <strong>Loading…</strong> : <strong><RevealableAmount value={typeof value === "string" ? value : money(value)} /></strong>}
              <small>{kind === "variance" ? "Actual minus expected" : kind === "rate" ? "Actual vs. expected" : kind === "pending" ? "Awaiting payment" : kind === "actual" ? "Settled disbursements" : kind === "expected" ? "Scheduled obligations" : "Cash at period start"}</small>
            </div>
          </article>;
        })}
      </section>

      <section className="co-panel">
        <div className="co-panel-heading">
          <div><h3><ChartNoAxesCombined size={16} /> Cash Outflow Trend</h3><p>Expected obligations compared with actual disbursements for {period?.label || "the selected period"}.</p></div>
          <div className="co-legend"><span className="co-legend-actual">Actual Outflow</span><span className="co-legend-expected">Expected Outflow</span></div>
        </div>
        <div className={`co-trend-chart co-trend-${periodType}`} role="img" aria-label="Expected cash outflow compared with actual cash outflow">
          {loading ? <p className="co-empty">Loading trend…</p> : trend.map((item) => (
            <div className="co-trend-column" key={item.date} title={item.label}>
              <div className="co-trend-bars">
                <span className="co-trend-bar co-trend-actual" style={{ height: `${Math.max(2, Number(item.actual_outflow || 0) / maxTrendAmount * 100)}%` }} />
                <span className="co-trend-bar co-trend-expected" style={{ height: `${Math.max(2, Number(item.expected_outflow || 0) / maxTrendAmount * 100)}%` }} />
              </div>
              <small>{item.label}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="co-panel">
        <div className="co-panel-heading">
          <div><h3><ReceiptText size={16} /> Expected vs Actual Outflow</h3><p>Actual disbursements compared with obligations due for {period?.label || "the selected period"}.</p></div>
          <span className={`co-forecast-status co-forecast-${statusClass(forecast.status)}`}>{loading ? "Loading…" : forecast.status || "—"}</span>
        </div>
        <div className="co-forecast-grid">
          <div><span>Expected Outflow</span>{loading ? <strong>Loading…</strong> : <strong><RevealableAmount value={money(forecast.expected_outflow)} /></strong>}</div>
          <div><span>Actual Outflow</span>{loading ? <strong>Loading…</strong> : <strong><RevealableAmount value={money(forecast.actual_outflow)} /></strong>}</div>
          <div><span>Pending Outflow</span>{loading ? <strong>Loading…</strong> : <strong><RevealableAmount value={money(forecast.pending_outflow)} /></strong>}</div>
          <div><span>Variance</span>{loading ? <strong>Loading…</strong> : <strong><RevealableAmount value={money(forecast.variance)} /></strong>}</div>
        </div>
      </section>

      <section className="co-panel">
        <div className="co-panel-heading"><div><h3><Banknote size={16} /> Cash Outflow Transactions</h3><p>Payable obligations and payments are retrieved from existing finance records.</p></div></div>
        <div className="table-wrap">
          <table className="data-table co-outflow-table">
            <thead><tr><th>Reference</th><th>Transaction Date</th><th>Source</th><th>Payee</th><th>Category</th><th>Account</th><th>Expected Amount</th><th>Actual Amount</th><th>Variance</th><th>Payment Method</th><th>Status</th><th>Approved By</th><th>Released By</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="14" className="cm-empty-cell">Loading cash outflows…</td></tr>
                : rows.length ? rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.outflow_reference || row.id}</td><td>{formatDate(row.transaction_date)}</td><td>{row.source_type}</td>
                    <td>{row.payee || "—"}</td><td>{row.category}</td><td>{row.account_name || "Unassigned"}</td>
                    <td><RevealableAmount value={money(row.expected_amount)} /></td><td><RevealableAmount value={money(row.actual_amount)} /></td>
                    <td><RevealableAmount value={money(row.variance)} /></td><td>{row.payment_method || "—"}</td>
                    <td><span className={`co-status co-status-${statusClass(row.status)}`}>{row.status}</span></td>
                    <td>{row.approved_by || "—"}</td><td>{row.released_by || "—"}</td>
                    <td><button type="button" className="co-icon-button" title="View outflow details" aria-label={`View ${row.outflow_reference || row.id}`} onClick={() => openDetails(row)}><Eye size={15} /></button></td>
                  </tr>
                )) : <tr><td colSpan="14" className="cm-empty-cell">No outflows match the selected period and filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <div className="co-lower-grid">
        <section className="co-panel">
          <div className="co-panel-heading"><div><h3>Outflow by Category</h3><p>Expected obligations and paid amounts by category.</p></div></div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Category</th><th>Expected</th><th>Actual</th><th>Variance</th></tr></thead>
              <tbody>{summary.categories?.length ? summary.categories.map((item) => (
                <tr key={item.category}><td>{item.category}</td><td><RevealableAmount value={money(item.expected_amount)} /></td>
                  <td><RevealableAmount value={money(item.actual_amount)} /></td><td><RevealableAmount value={money(item.variance)} /></td></tr>
              )) : <tr><td colSpan="4" className="cm-empty-cell">No category activity in this period.</td></tr>}</tbody>
            </table>
          </div>
        </section>
        <section className="co-panel">
          <div className="co-panel-heading"><div><h3>Outflow Alerts</h3><p>Pending and partial payments, upcoming releases, and over-expenditure.</p></div></div>
          {loading ? <p className="co-empty">Loading alerts…</p> : alerts.length ? (
            <ul className="co-alert-list">
              {alerts.map((alert, index) => (
                <li className={`co-alert co-alert-${statusClass(alert.type)}`} key={`${alert.type}-${alert.id}-${index}`}>
                  <b>{alert.type}</b><span>{alert.payee} · {alert.outflow_reference || alert.id}</span>
                  <span>Expected <RevealableAmount value={money(alert.expected_amount)} /> · Paid <RevealableAmount value={money(alert.actual_amount)} /> · Variance <RevealableAmount value={money(alert.variance)} /></span>
                  <span>Status {alert.status}{alert.due_date ? ` · Due ${formatDate(alert.due_date)}` : ""}</span>
                </li>
              ))}
            </ul>
          ) : <p className="co-empty">No outflow exceptions for this period.</p>}
        </section>
      </div>

      {selected && (
        <div className="dba-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <section className="dba-modal co-detail" role="dialog" aria-modal="true" aria-labelledby="co-detail-title">
            <header><div><h3 id="co-detail-title">{selected.outflow_reference || selected.id}</h3><span className={`co-status co-status-${statusClass(selected.status)}`}>{selected.status}</span></div><button type="button" onClick={() => setSelected(null)} aria-label="Close"><X size={18} /></button></header>
            <div className="dba-detail-grid">
              {[
                ["Transaction Date", formatDate(selected.transaction_date)], ["Due Date", formatDate(selected.due_date)],
                ["Source", selected.source_type], ["Payee", selected.payee], ["Category", selected.category],
                ["Account", selected.account_name], ["Description", selected.description],
                ["Expected Amount", <RevealableAmount value={money(selected.expected_amount)} />],
                ["Actual Amount", <RevealableAmount value={money(selected.actual_amount)} />],
                ["Variance", <RevealableAmount value={money(selected.variance)} />],
                ["Payment Method", selected.payment_method], ["Approved By", selected.approved_by],
                ["Released By", selected.released_by],
              ].map(([label, value]) => <div key={label}><small>{label}</small><b>{value || "—"}</b></div>)}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
