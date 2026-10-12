import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowLeftRight, ArrowRight, CalendarDays, ChartNoAxesCombined, Download, Eye, FileText, Filter, HandCoins, Landmark, Percent, Printer, ReceiptText, RefreshCw, TrendingDown, TrendingUp, Wallet, X } from "lucide-react";
import RevealableAmount from "../../components/RevealableAmount";
import "../../styles/cash-management/cash_inflow_monitoring.css";

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
const PERIODS = ["daily", "weekly", "monthly", "quarterly", "yearly"];
const ALL_SOURCES = "All Sources";
const ALL_CATEGORIES = "All Categories";
const ALL_STATUSES = "All Statuses";
const money = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const localToday = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const formatDate = (value) => value
  ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString()
  : "—";
const statusClass = (value) => String(value || "").toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
const metricIcons = [Wallet, Landmark, FileText, ChartNoAxesCombined, HandCoins, Percent];
const metricStyles = ["green", "blue", "purple", "cyan", "orange", "red"];
const categoryIcons = [Landmark, ReceiptText, HandCoins, FileText];

function previousAnchor(anchor, periodType) {
  const date = new Date(`${anchor}T00:00:00.000Z`);
  if (periodType === "daily") date.setUTCDate(date.getUTCDate() - 1);
  if (periodType === "weekly") date.setUTCDate(date.getUTCDate() - 7);
  if (periodType === "monthly") date.setUTCMonth(date.getUTCMonth() - 1, 1);
  if (periodType === "quarterly") date.setUTCMonth(date.getUTCMonth() - 3, 1);
  if (periodType === "yearly") date.setUTCFullYear(date.getUTCFullYear() - 1, 0, 1);
  return date.toISOString().slice(0, 10);
}

function percentChange(current, previous) {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);
  if (previousValue === 0) return currentValue === 0 ? 0 : null;
  return ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
}

async function api(path) {
  const response = await fetch(`${API_BASE}${path}`, { headers: { Accept: "application/json" } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Cash inflow request failed (${response.status}).`);
  }
  return payload;
}

function toCsv(rows) {
  const columns = [
    ["Inflow Reference", "inflow_reference"],
    ["Transaction Date", "transaction_date"],
    ["Source", "source_type"],
    ["Client / Payer", "client_payer"],
    ["Category", "category"],
    ["Related Document", "related_document"],
    ["Bank / Cash Account", "account_name"],
    ["Expected Amount", "expected_amount"],
    ["Actual Amount", "actual_amount"],
    ["Variance", "variance"],
    ["Payment Method", "payment_method"],
    ["Status", "status"],
    ["Received By", "received_by"],
  ];
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [
    columns.map(([label]) => escape(label)).join(","),
    ...rows.map((row) => columns.map(([, key]) => escape(row[key])).join(",")),
  ].join("\r\n");
}

export default function CashInflowMonitoringPage({ onAudit = () => {} }) {
  const [periodType, setPeriodType] = useState("monthly");
  const [anchor, setAnchor] = useState(localToday);
  const [period, setPeriod] = useState(null);
  const [filterApplyVersion, setFilterApplyVersion] = useState(0);
  const [filters, setFilters] = useState({ account: "All Accounts", source: ALL_SOURCES, category: ALL_CATEGORIES, status: ALL_STATUSES, search: "" });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [inflows, setInflows] = useState([]);
  const [summary, setSummary] = useState({});
  const [previousSummary, setPreviousSummary] = useState({});
  const [cashSummary, setCashSummary] = useState({});
  const [previousCashSummary, setPreviousCashSummary] = useState({});
  const [forecast, setForecast] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [trend, setTrend] = useState([]);
  const [revealedAxisValues, setRevealedAxisValues] = useState({});
  const [accounts, setAccounts] = useState([]);
  const [sources, setSources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const toggleAxisValue = (fraction) => setRevealedAxisValues((current) => ({
    ...current,
    [fraction]: !current[fraction],
  }));
  const requestIdRef = useRef(0);

  const query = useMemo(() => {
    const params = new URLSearchParams({ period: periodType, anchor });
    if (appliedFilters.account !== "All Accounts") params.set("account", appliedFilters.account);
    if (appliedFilters.source !== ALL_SOURCES) params.set("source", appliedFilters.source);
    if (appliedFilters.category !== ALL_CATEGORIES) params.set("category", appliedFilters.category);
    if (appliedFilters.status !== ALL_STATUSES) params.set("status", appliedFilters.status);
    if (appliedFilters.search.trim()) params.set("search", appliedFilters.search.trim());
    return params.toString();
  }, [periodType, anchor, appliedFilters]);

  const previousQuery = useMemo(() => {
    const params = new URLSearchParams(query);
    params.set("anchor", previousAnchor(anchor, periodType));
    return params.toString();
  }, [query, anchor, periodType]);

  const accountsQuery = useMemo(
    () => new URLSearchParams({ period: periodType, anchor }).toString(),
    [periodType, anchor],
  );

  const cashSummaryQuery = useMemo(() => {
    const params = new URLSearchParams({ period: periodType, anchor });
    if (appliedFilters.account !== "All Accounts") params.set("account_name", appliedFilters.account);
    return params.toString();
  }, [periodType, anchor, appliedFilters.account]);

  const previousCashSummaryQuery = useMemo(() => {
    const params = new URLSearchParams(cashSummaryQuery);
    params.set("anchor", previousAnchor(anchor, periodType));
    return params.toString();
  }, [cashSummaryQuery, anchor, periodType]);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    try {
      const [inflowResult, summaryResult, previousSummaryResult, cashSummaryResult, previousCashSummaryResult, forecastResult, alertResult, trendResult, accountResult] = await Promise.all([
        api(`/api/cash-flow/inflows?${query}`),
        api(`/api/cash-flow/inflows/summary?${query}`),
        api(`/api/cash-flow/inflows/summary?${previousQuery}`),
        api(`/api/cash-flow/summary?${cashSummaryQuery}`),
        api(`/api/cash-flow/summary?${previousCashSummaryQuery}`),
        api(`/api/cash-flow/inflows/forecast?${query}`),
        api(`/api/cash-flow/inflows/alerts?${query}`),
        api(`/api/cash-flow/inflows/trend?${query}`),
        api(`/api/cash-flow/accounts?${accountsQuery}`),
      ]);
      if (requestId !== requestIdRef.current) return;
      setInflows(inflowResult.data || []);
      setSummary(summaryResult.data || {});
      setPreviousSummary(previousSummaryResult.data || {});
      setCashSummary(cashSummaryResult.data || {});
      setPreviousCashSummary(previousCashSummaryResult.data || {});
      setForecast(forecastResult.data || {});
      setAlerts(alertResult.data || []);
      setTrend(trendResult.data || []);
      setAccounts(accountResult.data || []);
      setSources(inflowResult.filters?.sources?.filter((value) => value !== ALL_SOURCES) || []);
      setCategories(inflowResult.filters?.categories?.filter((value) => value !== ALL_CATEGORIES) || []);
      setStatuses(inflowResult.filters?.statuses?.filter((value) => value !== ALL_STATUSES) || []);
      setPeriod(inflowResult.period);
    } catch (loadError) {
      if (requestId === requestIdRef.current) {
        setError(loadError.message || "Cash inflow information could not be loaded.");
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [query, previousQuery, cashSummaryQuery, previousCashSummaryQuery, accountsQuery]);

  useEffect(() => { load(); }, [load, filterApplyVersion]);

  const movePeriod = (step) => {
    const date = new Date(`${anchor}T00:00:00.000Z`);
    if (periodType === "daily") date.setUTCDate(date.getUTCDate() + step);
    if (periodType === "weekly") date.setUTCDate(date.getUTCDate() + step * 7);
    if (periodType === "monthly") date.setUTCMonth(date.getUTCMonth() + step, 1);
    if (periodType === "quarterly") date.setUTCMonth(date.getUTCMonth() + step * 3, 1);
    if (periodType === "yearly") date.setUTCFullYear(date.getUTCFullYear() + step, 0, 1);
    setAnchor(date.toISOString().slice(0, 10));
  };

  const handleApplyFilters = (event) => {
    event.preventDefault();
    const nextFilters = { ...filters, search: filters.search.trim() };
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setFilterApplyVersion((version) => version + 1);
  };

  const hasUnappliedFilters = Object.keys(filters).some((key) => filters[key] !== appliedFilters[key]);

  const exportRows = () => {
    const blob = new Blob([toCsv(inflows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cash-inflows-${anchor}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    onAudit?.("Exported cash inflow report", `${inflows.length} records`);
  };

  const openDetails = async (row) => {
    try {
      const params = new URLSearchParams({
        period: periodType,
        anchor,
        ...(appliedFilters.account !== "All Accounts" ? { account: appliedFilters.account } : {}),
        ...(appliedFilters.source !== ALL_SOURCES ? { source: appliedFilters.source } : {}),
        ...(appliedFilters.category !== ALL_CATEGORIES ? { category: appliedFilters.category } : {}),
        ...(appliedFilters.status !== ALL_STATUSES ? { status: appliedFilters.status } : {}),
        ...(appliedFilters.search.trim() ? { search: appliedFilters.search.trim() } : {}),
      });
      const result = await api(`/api/cash-flow/inflows/${encodeURIComponent(row.id)}?${params}`);
      setSelected(result.data);
    } catch (loadError) {
      setError(loadError.message || "Inflow details could not be loaded.");
    }
  };

  const summaryCards = [
    ["Total Cash Inflow", cashSummary.total_cash_inflow, previousCashSummary.total_cash_inflow],
    ["Opening Cash Balance", summary.opening_cash_balance, previousSummary.opening_cash_balance],
    ["Total Expected Inflow", summary.expected_inflow, previousSummary.expected_inflow],
    ["Total Actual Inflow", summary.actual_inflow, previousSummary.actual_inflow],
    ["Pending Inflow", summary.pending_inflow, previousSummary.pending_inflow],
    ["Collection Rate", Number(summary.collection_rate || 0), Number(previousSummary.collection_rate || 0), true],
  ];
  const maxTrendAmount = Math.max(1, ...trend.flatMap((item) => [Number(item.expected_inflow || 0), Number(item.actual_inflow || 0)]));
  const trendWidth = Math.max(720, trend.length * 58);
  const chartHeight = 220;
  const chartPadding = { top: 18, right: 20, bottom: 32, left: 68 };
  const chartPlotWidth = trendWidth - chartPadding.left - chartPadding.right;
  const chartPlotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const chartX = (index) => chartPadding.left + (trend.length > 1 ? index * chartPlotWidth / (trend.length - 1) : chartPlotWidth / 2);
  const chartY = (value) => chartPadding.top + chartPlotHeight - Number(value || 0) / maxTrendAmount * chartPlotHeight;
  const actualLine = trend.map((item, index) => `${index ? "L" : "M"} ${chartX(index)} ${chartY(item.actual_inflow)}`).join(" ");
  const expectedLine = trend.map((item, index) => `${index ? "L" : "M"} ${chartX(index)} ${chartY(item.expected_inflow)}`).join(" ");
  const inflowGroups = Array.from(inflows.reduce((groups, row) => {
    const label = row.source_type || row.source_group || "Other";
    const item = groups.get(label) || { label, amount: 0 };
    item.amount += Number(row.actual_amount || 0);
    groups.set(label, item);
    return groups;
  }, new Map()).values()).sort((left, right) => right.amount - left.amount);
  const groupTotal = inflowGroups.reduce((total, item) => total + item.amount, 0);
  const comparisonMetrics = [
    ["Expected Inflow", forecast.expected_inflow, 100, "expected"],
    ["Actual Inflow", forecast.actual_inflow, Number(forecast.expected_inflow) > 0 ? Number(forecast.actual_inflow) / Number(forecast.expected_inflow) * 100 : 0, "actual"],
    ["Pending Inflow", forecast.pending_inflow, Number(forecast.expected_inflow) > 0 ? Number(forecast.pending_inflow) / Number(forecast.expected_inflow) * 100 : 0, "pending"],
    ["Variance", forecast.variance, Number(forecast.expected_inflow) > 0 ? Number(forecast.variance) / Number(forecast.expected_inflow) * 100 : 0, "variance"],
  ];
  const scrollToTransactions = () => document.getElementById("ci-transactions")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <section className="cash-inflow-page">
      <div className="page-header">
        <div>
          <h2><ChartNoAxesCombined size={25} /> Cash Inflow Monitoring</h2>
          <p>Monitor actual client receipts, invoice collections, and other income without duplicating entries from related modules.</p>
        </div>
      </div>

      {error && <p className="error-message" role="alert">{error}</p>}

      <div className="ci-toolbar">
        <div className="ci-toolbar-actions">
          <button type="button" className="primary-button" onClick={load} disabled={loading}><RefreshCw size={14} /> Refresh</button>
          <button type="button" className="light-button" onClick={exportRows} disabled={loading}><Download size={14} /> Export</button>
          <button type="button" className="light-button" onClick={() => window.print()}><Printer size={14} /> Print</button>
        </div>
        <form className="ci-filter-bar" onSubmit={handleApplyFilters} aria-busy={loading}>
          <label>Period <span className="ci-date-input"><CalendarDays size={14} /><input type="date" value={anchor} onChange={(event) => setAnchor(event.target.value)} /></span></label>
          <label>Account
            <select value={filters.account} onChange={(event) => setFilters({ ...filters, account: event.target.value })}>
              <option>All Accounts</option>
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
          <label className="ci-search-filter">Search
            <input type="search" value={filters.search} placeholder="Reference, client, document…" onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
          </label>
          <button
            type="submit"
            className="apply-filter-button ci-apply-button"
          >
            <Filter size={15} />
            Apply Filters
          </button>
        </form>
        <p className="ci-filter-feedback" role="status" aria-live="polite">
          {loading
            ? "Loading inflows for the selected filters…"
            : `${inflows.length} inflow ${inflows.length === 1 ? "record" : "records"} match the applied filters.`}
          {hasUnappliedFilters && !loading ? " Filter changes are not applied yet." : ""}
        </p>
      </div>

      <div className="ci-period-tabs" role="group" aria-label="Monitoring period">
          {PERIODS.map((item) => (
            <button type="button" key={item} className={periodType === item ? "active" : ""} aria-pressed={periodType === item} onClick={() => setPeriodType(item)}>
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
      </div>

      <section className="ci-summary-grid" aria-label="Cash inflow summary">
        {summaryCards.map(([label, value, previousValue, percentage], index) => {
          const Icon = metricIcons[index];
          const change = percentChange(value, previousValue);
          return (
          <article className={`ci-summary-card ci-card-${metricStyles[index]}`} key={label}>
            <div className="ci-card-icon"><Icon size={19} /></div>
            <div className="ci-card-content">
              <span>{label} <Eye size={11} /></span>
              {loading ? <strong>Loading…</strong> : <strong><RevealableAmount value={percentage ? `${Number(value || 0).toFixed(1)}%` : money(value)} /></strong>}
              <small className={change === null ? "ci-change-neutral" : change >= 0 ? "ci-change-up" : "ci-change-down"}>
                {change === null ? "—" : change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {change === null ? "No previous period data" : `${Math.abs(change).toFixed(1)}%`}
                <span>vs. previous {periodType === "daily" ? "day" : periodType === "weekly" ? "week" : periodType === "monthly" ? "month" : periodType === "quarterly" ? "quarter" : "year"}</span>
              </small>
            </div>
          </article>
        );})}
      </section>

      <div className="ci-overview-grid">
        <section className="ci-panel ci-trend-panel">
          <div className="ci-panel-heading">
            <div><h3><ChartNoAxesCombined size={16} /> Cash Inflow Trend</h3><p>Expected collections compared with actual receipts for the selected period.</p></div>
            <div className="ci-legend"><span className="ci-legend-in">Actual Inflow</span><span className="ci-legend-expected">Expected Inflow</span></div>
          </div>
          {loading ? <p className="ci-empty">Loading trend…</p> : trend.length ? (
            <div className="ci-trend-scroll">
              <svg className="ci-trend-svg" viewBox={`0 0 ${trendWidth} ${chartHeight}`} role="img" aria-label="Actual and expected cash inflow trend">
                {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
                  const y = chartPadding.top + chartPlotHeight * fraction;
                  const amount = maxTrendAmount * (1 - fraction);
                  return <g key={fraction}><line x1={chartPadding.left} x2={trendWidth - chartPadding.right} y1={y} y2={y} className="ci-chart-gridline" /><text x={chartPadding.left - 8} y={y + 4} textAnchor="end" className="ci-chart-axis-label" role="button" tabIndex="0" aria-label={revealedAxisValues[fraction] ? "Hide chart amount" : "Reveal chart amount"} onClick={() => toggleAxisValue(fraction)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleAxisValue(fraction); } }} style={{ cursor: "pointer" }}>{revealedAxisValues[fraction] ? money(amount).replace(".00", "") : "*"}</text></g>;
                })}
                {trend.map((item, index) => {
                  const x = chartX(index);
                  const barWidth = Math.min(27, chartPlotWidth / Math.max(1, trend.length) * 0.28);
                  const baseY = chartPadding.top + chartPlotHeight;
                  const actualY = chartY(item.actual_inflow);
                  const expectedY = chartY(item.expected_inflow);
                  const showLabel = trend.length <= 8 || index % Math.ceil(trend.length / 8) === 0 || index === trend.length - 1;
                  return <g key={item.date}>
                    <rect x={x - barWidth - 2} y={actualY} width={barWidth} height={Math.max(0, baseY - actualY)} rx="2" className="ci-chart-actual-bar"><title>{item.label}: actual inflow</title></rect>
                    <rect x={x + 2} y={expectedY} width={barWidth} height={Math.max(0, baseY - expectedY)} rx="2" className="ci-chart-expected-bar"><title>{item.label}: expected inflow</title></rect>
                    {showLabel && <text x={x} y={chartHeight - 8} textAnchor="middle" className="ci-chart-axis-label">{item.label}</text>}
                  </g>;
                })}
                {trend.length > 1 && <><path d={actualLine} className="ci-chart-line ci-chart-actual-line" /><path d={expectedLine} className="ci-chart-line ci-chart-expected-line" />{trend.map((item, index) => <g key={`point-${item.date}`}><circle cx={chartX(index)} cy={chartY(item.actual_inflow)} r="3" className="ci-chart-actual-point" /><circle cx={chartX(index)} cy={chartY(item.expected_inflow)} r="3" className="ci-chart-expected-point" /></g>)}</>}
              </svg>
            </div>
          ) : <p className="ci-empty">No inflow activity in the selected period.</p>}
        </section>

        <section className="ci-panel ci-inflow-summary">
          <div className="ci-panel-heading"><div><h3><Wallet size={16} /> Inflow Summary</h3><p>Actual receipts by source for {period?.label || "the selected period"}.</p></div></div>
          {loading ? <p className="ci-empty">Loading summary…</p> : inflowGroups.length ? (
            <div className="ci-source-list">{inflowGroups.slice(0, 5).map((item, index) => {
              const Icon = categoryIcons[index % categoryIcons.length];
              const percent = groupTotal > 0 ? item.amount / groupTotal * 100 : 0;
              return <div className={`ci-source-row ci-source-${index % 4}`} key={item.label}>
                <span className="ci-source-icon"><Icon size={15} /></span>
                <span className="ci-source-name">{item.label}</span>
                <strong><RevealableAmount value={money(item.amount)} /></strong>
                <small>{percent.toFixed(1)}%</small>
                <span className="ci-source-track"><i style={{ width: `${percent}%` }} /></span>
              </div>;
            })}</div>
          ) : <p className="ci-empty">No inflows in the selected period.</p>}
        </section>
      </div>

      <section className="ci-panel ci-forecast-panel">
        <div className="ci-panel-heading">
          <div><h3><ReceiptText size={16} /> Expected vs Actual Inflow</h3><p>Collection forecast for {period?.label || "the selected period"}.</p></div>
          <div className="ci-forecast-actions">
            <span className={`ci-forecast-status ci-forecast-${statusClass(forecast.status)}`}>{loading ? "Loading…" : forecast.status || "—"}</span>
            <button type="button" className="ci-view-details" onClick={scrollToTransactions}><Eye size={13} /> View Details</button>
          </div>
        </div>
        <div className="ci-forecast-grid">
          {comparisonMetrics.map(([label, amount, rate, style]) => (
            <div className={`ci-forecast-card ci-forecast-card-${style}`} key={label}>
              <span className="ci-forecast-icon">{style === "expected" ? <Eye size={16} /> : style === "actual" ? <ChartNoAxesCombined size={16} /> : style === "pending" ? <HandCoins size={16} /> : <ArrowLeftRight size={16} />}</span>
              <div><span>{label}</span>{loading ? <strong>Loading…</strong> : <strong><RevealableAmount value={money(amount)} /></strong>}
                <small>{Number(rate || 0).toFixed(1)}% of forecast</small>
                <i style={{ width: `${Math.max(0, Math.min(100, Number(rate || 0)))}%` }} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="ci-panel ci-transactions-panel" id="ci-transactions">
        <div className="ci-panel-heading"><div><h3>Cash Inflow Transactions</h3><p>Invoices and received payments from the billing and receivables records, plus recorded other income.</p></div></div>
        <div className="table-wrap">
          <table className="data-table ci-inflow-table">
            <thead><tr><th>Inflow Reference</th><th>Transaction Date</th><th>Source</th><th>Client / Payer</th><th>Category</th><th>Related Document</th><th>Bank / Cash Account</th><th>Expected Amount</th><th>Actual Amount</th><th>Variance</th><th>Payment Method</th><th>Status</th><th>Received By</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="14" className="cm-empty-cell">Loading cash inflows…</td></tr>
                : inflows.length ? inflows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.inflow_reference}</td><td>{formatDate(row.transaction_date)}</td><td>{row.source_type}</td>
                    <td>{row.client_payer}</td><td>{row.category}</td><td>{row.related_document || "—"}</td>
                    <td>{row.account_name || "Unassigned"}</td><td><RevealableAmount value={money(row.expected_amount)} /></td>
                    <td><RevealableAmount value={money(row.actual_amount)} /></td>
                    <td><RevealableAmount value={money(row.variance)} /></td><td>{row.payment_method}</td>
                    <td><span className={`ci-status ci-status-${statusClass(row.status)}`}>{row.status}</span></td>
                    <td>{row.received_by || "—"}</td>
                    <td><button type="button" className="ci-icon-button" title="View inflow details" aria-label={`View ${row.inflow_reference}`} onClick={() => openDetails(row)}><Eye size={15} /></button></td>
                  </tr>
                )) : <tr><td colSpan="14" className="cm-empty-cell">No inflows match the selected period and filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <div className="ci-lower-grid">
        <section className="ci-panel">
          <div className="ci-panel-heading"><div><h3>Inflow by Account</h3><p>Expected collections and actual receipts for the applied filters.</p></div></div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Account</th><th>Expected</th><th>Actual</th><th>Variance</th></tr></thead>
              <tbody>{summary.accounts?.length ? summary.accounts.map((item) => (
                <tr key={item.account_name}><td>{item.account_name}</td><td><RevealableAmount value={money(item.expected_amount)} /></td>
                  <td><RevealableAmount value={money(item.actual_amount)} /></td><td><RevealableAmount value={money(item.variance)} /></td></tr>
              )) : <tr><td colSpan="4" className="cm-empty-cell">No account activity in this period.</td></tr>}</tbody>
            </table>
          </div>
        </section>

        <section className="ci-panel">
          <div className="ci-panel-heading"><div><h3>Inflow Alerts</h3><p>Pending collections, short receipts, and unusually large receipts.</p></div></div>
          {loading ? <p className="ci-empty">Loading alerts…</p> : alerts.length ? (
            <ul className="ci-alert-list">
              {alerts.map((alert, index) => (
                <li className={`ci-alert ci-alert-${statusClass(alert.type)}`} key={`${alert.type}-${alert.id}-${index}`}>
                  <b>{alert.type}</b><span>{alert.client_payer} · {alert.inflow_reference}</span>
                  {alert.pending_amount !== undefined
                    ? <span>Unverified amount <RevealableAmount value={money(alert.pending_amount)} /> · Status {alert.payment_status}</span>
                    : <span>Expected <RevealableAmount value={money(alert.expected_amount)} /> · Received <RevealableAmount value={money(alert.actual_amount)} /> · Variance <RevealableAmount value={money(alert.variance)} /></span>}
                </li>
              ))}
            </ul>
          ) : <p className="ci-empty">No inflow exceptions for this period.</p>}
        </section>
      </div>

      {selected && (
        <div className="dba-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <section className="dba-modal ci-detail" role="dialog" aria-modal="true" aria-labelledby="ci-detail-title">
            <header><div><h3 id="ci-detail-title">{selected.inflow_reference}</h3><span className={`ci-status ci-status-${statusClass(selected.status)}`}>{selected.status}</span></div><button type="button" onClick={() => setSelected(null)} aria-label="Close"><X size={18} /></button></header>
            <div className="dba-detail-grid">
              {[
                ["Transaction Date", formatDate(selected.transaction_date)],
                ["Source", selected.source_type],
                ["Client / Payer", selected.client_payer],
                ["Category", selected.category],
                ["Related Document", selected.related_document],
                ["Bank / Cash Account", selected.account_name],
                ["Expected Amount", <RevealableAmount value={money(selected.expected_amount)} />],
                ["Actual Amount", <RevealableAmount value={money(selected.actual_amount)} />],
                ["Variance", <RevealableAmount value={money(selected.variance)} />],
                ["Payment Method", selected.payment_method],
                ["Received By", selected.received_by],
                ["Reference Number", selected.reference_number],
              ].map(([label, value]) => <div key={label}><small>{label}</small><b>{value || "—"}</b></div>)}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
