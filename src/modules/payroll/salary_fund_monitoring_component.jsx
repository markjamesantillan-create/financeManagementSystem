import React, { useCallback, useEffect, useMemo, useState } from "react";
import RevealableAmount from "../../components/RevealableAmount";
import RevealableText from "../../components/RevealableText";
import {
  AlertTriangle,
  Bell,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  HandCoins,
  Printer,
  RotateCcw,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";

const resolveApiBase = () => {
  const configured =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "";

  if (configured) return configured.replace(/\/$/, "");

  if (typeof window === "undefined") return "";

  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0") {
    return "http://127.0.0.1:3001";
  }

  return "";
};

const API_BASE = resolveApiBase();

// The six documented pay-period statuses. The chip counts beside them are
// server-supplied, so this list only decides the ORDER and the caption — it
// never decides how many of anything there are.
const PERIOD_STATUS_ORDER = [
  "Funded",
  "Allocated",
  "Pending",
  "For Review",
  "Released",
  "Insufficient",
];

const money = (value) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const pct = (value) => {
  const number = Number(value || 0);
  return `${number.toFixed(number % 1 ? 2 : 0)}%`;
};

const display = (value) =>
  value === null || value === undefined || value === "" ? "—" : value;

const dateLabel = (value) => {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

const statusSlug = (status) =>
  String(status || "unknown").toLowerCase().replace(/\s+/g, "-");

// Variance is signed so an overrun and a saving never read the same way.
const signedMoney = (value) => {
  const number = Number(value || 0);
  return `${number > 0 ? "+" : number < 0 ? "−" : ""}${money(Math.abs(number))}`;
};

const escapeHtml = (value) =>
  String(value ?? "—")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

async function request(path, options = {}) {
  const urls = [];
  const baseUrl = API_BASE || "";
  if (baseUrl) urls.push(`${baseUrl}${path}`);
  if (!urls.includes(path)) urls.push(path);
  if (baseUrl && !urls.includes(`http://127.0.0.1:3001${path}`)) {
    urls.push(`http://127.0.0.1:3001${path}`);
  }

  let lastError;
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Accept: "application/json",
          ...(options.headers || {}),
        },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || "The salary fund monitoring request failed.");
      }
      return payload;
    } catch (error) {
      lastError = error;
      if (url === urls[urls.length - 1]) break;
    }
  }

  const message = lastError?.message === "Failed to fetch"
    ? "Unable to reach the salary fund monitoring API. Start the backend or verify the API URL."
    : lastError?.message || "The salary fund monitoring request failed.";
  throw new Error(message);
}

const StatusBadge = ({ status, prefix = "sfm-status" }) => (
  <span className={`${prefix} ${statusSlug(status)}`}>{display(status)}</span>
);

const UtilizationBar = ({ value = 0, compact = false }) => {
  const width = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className={`sfm-util ${compact ? "compact" : ""}`}>
      <div className="sfm-util-track" aria-hidden="true">
        <span style={{ width: `${width}%` }} />
      </div>
      <b>{pct(width)}</b>
    </div>
  );
};

const Breadcrumb = () => (
  <div className="breadcrumb">
    <span>Dashboard</span><b>›</b><span>Fund &amp; Budget Management</span><b>›</b>
    <span>Payroll Fund Management</span><b>›</b>
    <strong>Salary Fund Monitoring</strong>
  </div>
);

export default function SalaryFundMonitoringPage({ onAudit = () => {}, navigate }) {
  // `monitoring` is the whole page, and it comes from one request. Nothing in
  // this file declares a peso amount, a percentage or a headcount: every figure
  // rendered below is read out of this object, which the API derives from the
  // salary fund, payroll allocation and fund release tables.
  const [monitoring, setMonitoring] = useState(null);
  const [filters, setFilters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reportKey, setReportKey] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [payload, filterPayload] = await Promise.all([
        request("/api/salary-fund-monitoring"),
        request("/api/salary-fund-monitoring/filters"),
      ]);
      setMonitoring(payload);
      setFilters(filterPayload.data || null);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = monitoring?.summary || null;

  // The period list arrives already filtered server-side; the toolbar search and
  // the chips narrow it further in the browser so typing does not re-query. The
  // summary cards are deliberately NOT filtered — they always describe the whole
  // fund, exactly as the allocation register does.
  const periods = useMemo(() => {
    const rows = monitoring?.payroll_periods || [];
    const query = search.trim().toLowerCase();
    return rows.filter((period) => {
      if (statusFilter !== "All Statuses" && period.status !== statusFilter) return false;
      if (!query) return true;
      return [
        period.pay_period,
        period.fund_id,
        period.fund_reference,
        period.fund_name,
        period.status,
        ...(period.fund_sources || []),
      ].some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [monitoring, search, statusFilter]);

  const periodDepartments = useMemo(() => {
    const rows = monitoring?.period_departments || [];
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (departmentFilter !== "All Departments" && row.department !== departmentFilter) return false;
      if (statusFilter !== "All Statuses" && row.period_status !== statusFilter) return false;
      if (!query) return true;
      return [row.pay_period, row.department, row.fund_id, row.status]
        .some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [monitoring, search, statusFilter, departmentFilter]);

  const departments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (monitoring?.departments || []).filter((row) =>
      departmentFilter !== "All Departments"
        ? row.department === departmentFilter
        : !query || row.department.toLowerCase().includes(query));
  }, [monitoring, search, departmentFilter]);

  const employees = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (monitoring?.employees || []).filter((row) => {
      if (departmentFilter !== "All Departments" && row.department !== departmentFilter) return false;
      if (!query) return true;
      return [
        row.allocation_id,
        row.employee_id,
        row.employee_name,
        row.department,
        row.position,
        row.pay_period,
      ].some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [monitoring, search, departmentFilter]);

  const releases = monitoring?.fund_releases || [];
  const reconciliation = monitoring?.reconciliation || [];
  const reports = monitoring?.reports || [];
  const alerts = monitoring?.alerts || { items: [], total: 0, critical: 0, warning: 0, info: 0 };
  const variancePeriods = monitoring?.variance?.periods || [];
  const activeReport = reports.find((entry) => entry.key === reportKey) || null;

  const openDetail = async (release) => {
    setDetailLoading(true);
    setDetail({ release, period: null, allocations: [], alerts: [] });
    try {
      const payload = await request(
        `/api/salary-fund-monitoring/releases/${encodeURIComponent(release.release_reference)}`
      );
      setDetail(payload.data);
      onAudit("Viewed salary fund release", release.release_reference);
    } catch (detailError) {
      setError(detailError.message);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // Reports print from the rows the API already built, so a printed report and
  // the tables above it are quoting the same numbers rather than two renderings
  // of the same idea.
  const printReport = (entry) => {
    const popup = window.open("", "_blank");
    if (!popup) {
      setError("The print window was blocked. Allow pop-ups and try again.");
      return;
    }
    const head = `<tr>${entry.columns
      .map((column) => `<th style="text-align:left;padding:8px;border:1px solid #ccdde8">${escapeHtml(column)}</th>`)
      .join("")}</tr>`;
    const body = entry.rows.length
      ? entry.rows.map((row) => `<tr>${row
        .map((cell) => `<td style="padding:8px;border:1px solid #ccdde8">${escapeHtml(cell)}</td>`)
        .join("")}</tr>`).join("")
      : `<tr><td colspan="${entry.columns.length}" style="padding:8px;border:1px solid #ccdde8">No rows for the current data set.</td></tr>`;
    popup.document.write(`<!doctype html><html><head><title>${escapeHtml(entry.title)}</title></head>
      <body style="font-family:Arial,sans-serif;padding:36px;color:#203b4d">
      <h1 style="color:#0b6f99">PRIMEPOWER</h1><h2>${escapeHtml(entry.title)}</h2>
      <p>${escapeHtml(entry.description)}</p>
      <p>Generated: ${new Date().toLocaleString()} · Fund position as of ${escapeHtml(monitoring?.as_of || "—")}</p><hr />
      <table style="width:100%;border-collapse:collapse;font-size:13px">${head}${body}</table>
      <script>window.print();</script></body></html>`);
    popup.document.close();
    onAudit("Printed salary fund report", entry.title);
  };

  if (loading) {
    return (
      <section className="management-page salary-fund-monitoring-page">
        <div className="contract-alert">
          <Clock3 size={17} /> Loading salary fund monitoring…
        </div>
      </section>
    );
  }

  if (error && !monitoring) {
    return (
      <section className="management-page salary-fund-monitoring-page">
        <div className="contract-alert cm-error" role="alert">
          <AlertTriangle size={17} />
          <span>{error}</span>
          <button type="button" className="light-button" onClick={() => load()}>Retry</button>
        </div>
      </section>
    );
  }

  // Every figure on the page. All of them come from the payload.
  const cards = [
    ["Total Salary Fund", <RevealableAmount value={money(summary?.total_fund)} />, `${summary?.approved_funds ?? 0} of ${summary?.funds ?? 0} funds approved`],
    ["Allocated Fund", <RevealableAmount value={money(summary?.allocated_fund)} />, `${summary?.employees ?? 0} employees · ${summary?.departments ?? 0} departments`],
    ["Released Fund", <RevealableAmount value={money(summary?.released_fund)} />, `${summary?.releases ?? 0} release transactions`],
    ["Actual Payroll Used", <RevealableAmount value={money(summary?.used_fund)} />, "Payroll cost drawn from the fund"],
    ["Remaining Fund", <RevealableAmount value={money(summary?.remaining_fund)} />, summary?.pending_fund ? <><RevealableAmount value={money(summary.pending_fund)} /> still awaiting approval</> : "Total fund less used"],
    ["Utilization", pct(summary?.utilization_rate), `${pct(summary?.committed_rate)} of the fund committed`],
  ];
return (
    <section className="management-page salary-fund-monitoring-page">
      <Breadcrumb />

      <div className="management-header">
        <div>
          <h2>Salary Fund Monitoring</h2>
          <p>
            Whether the payroll fund still covers employee salaries, deductions,
            benefits and employer contributions. Every amount below is calculated by
            the API from the salary fund, payroll allocation and fund release
            records as of {display(monitoring?.as_of)}.
          </p>
        </div>
        <div className="management-actions">
          <button
            type="button"
            className="light-button"
            onClick={() => navigate?.("Employee Payroll Allocation")}
          >
            <Wallet size={15} /> Employee Payroll Allocation
          </button>
          <button type="button" className="light-button" onClick={() => window.print()}>
            <Printer size={15} /> Print
          </button>
          <button
            type="button"
            className="light-button"
            onClick={() => load(true)}
            disabled={refreshing}
          >
            <RotateCcw size={15} /> {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="contract-alert cm-error" role="alert">
          <AlertTriangle size={17} />
          <span>{error}</span>
          <button type="button" className="light-button" onClick={() => load(true)}>Retry</button>
        </div>
      )}

      {/* 1. Fund Overview */}
      <section className="sfm-section" aria-labelledby="sfm-overview">
        <div className="sfm-section-heading">
          <div>
            <h3 id="sfm-overview">Fund Overview</h3>
            <p>Approved salary funds against what has been allocated, released and used.</p>
          </div>
          <UtilizationBar value={summary?.utilization_rate} />
        </div>
        <div className="vendor-summary-grid sfm-summary-grid">
          {cards.map(([label, value, note]) => (
            <div className="vendor-summary-card" key={label}>
              <span className="vendor-summary-label">{label}</span>
              <strong className="vendor-summary-value">{value}</strong>
              <span className="vendor-summary-count">{note}</span>
            </div>
          ))}
        </div>
        <div className="sfm-flow">
          <span>Total <RevealableAmount value={money(summary?.total_fund)} /></span>
          <i>→</i>
          <span>Allocated <RevealableAmount value={money(summary?.allocated_fund)} /></span>
          <i>→</i>
          <span>Released <RevealableAmount value={money(summary?.released_fund)} /></span>
          <i>→</i>
          <span>Used <RevealableAmount value={money(summary?.used_fund)} /></span>
          <i>→</i>
          <span className="sfm-flow-remaining">Remaining <RevealableAmount value={money(summary?.remaining_fund)} /></span>
        </div>
      </section>

      {/* 2. Fund Alerts */}
      <section className="sfm-section" aria-labelledby="sfm-alerts">
        <div className="sfm-section-heading">
          <div>
            <h3 id="sfm-alerts">Fund Alerts</h3>
            <p>
              Detected from the same records: low fund, overspending, insufficient
              cover, unreleased money, unusual cost movement, pending approvals and
              duplicate allocations.
            </p>
          </div>
          <span className="sfm-alert-tally">
            <b>{alerts.critical}</b> critical · <b>{alerts.warning}</b> warning · <b>{alerts.info}</b> info
          </span>
        </div>
        {alerts.items.length ? (
          <div className="sfm-alert-grid">
            {alerts.items.map((alert) => (
              <article key={alert.id} className={`sfm-alert ${statusSlug(alert.severity)}`}>
                <header>
                  {alert.severity === "Critical"
                    ? <AlertTriangle size={15} />
                    : alert.severity === "Warning"
                      ? <Bell size={15} />
                      : <CheckCircle2 size={15} />}
                  <strong>{alert.title}</strong>
                </header>
                <p>{alert.detail}</p>
                {alert.reference && <small>References: {alert.reference}</small>}
              </article>
            ))}
          </div>
        ) : (
          <div className="sfm-empty-note">
            <CheckCircle2 size={16} /> No salary fund alerts are open.
          </div>
        )}
      </section>

      <div className="cm-toolbar sfm-toolbar">
        <label className="cm-search">
          <Search size={14} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search fund, period, department, employee..."
          />
        </label>
        <label>
          <span>Pay Period Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>All Statuses</option>
            {PERIOD_STATUS_ORDER.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <label>
          <span>Department</span>
          <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
            <option>All Departments</option>
            {(filters?.departments || []).map((department) => (
              <option key={department}>{department}</option>
            ))}
          </select>
        </label>
      </div>

      {/* 3. Payroll Fund Monitoring — period x department */}
      <section className="cm-record-panel sfm-section">
        <div className="cm-section-heading">
          <div>
            <h3>Payroll Fund Monitoring ({periodDepartments.length})</h3>
            <p>Where each department's slice of the salary fund has gone, per pay period.</p>
          </div>
        </div>
        <div className="table-card cm-table-card">
          <table>
            <thead>
              <tr>
                <th>Payroll Period</th><th>Department</th><th>Employees</th>
                <th>Allocated</th><th>Actual Cost</th><th>Remaining</th>
                <th>Utilization</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {periodDepartments.length ? periodDepartments.map((row) => (
                <tr key={`${row.pay_period}-${row.department}`}>
                  <td className="link-cell">
                    {row.pay_period}
                    <small>{row.fund_id}</small>
                  </td>
                  <td className="strong-cell">{row.department}</td>
                  <td>{row.employees}<small>{row.allocations} allocations</small></td>
                  <td className="money-cell"><RevealableAmount value={money(row.allocated_amount)} /></td>
                  <td className="money-cell"><RevealableAmount value={money(row.used_amount)} /></td>
                  <td className="money-cell"><RevealableAmount value={money(row.remaining_amount)} /></td>
                  <td>
                    <UtilizationBar value={row.utilization} compact />
                  </td>
                  <td>
                    <StatusBadge status={row.status} />
                    <small>{row.period_status}</small>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={8} className="empty">No department payroll matches the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Salary Fund Allocation — the period monitor */}
      <section className="cm-record-panel sfm-section">
        <div className="cm-section-heading">
          <div>
            <h3>Payroll Period Monitoring ({periods.length})</h3>
            <p>Each salary fund cycle, from the envelope through to what payroll consumed.</p>
          </div>
        </div>
        <div className="sfm-legend" aria-label="Pay period status filters">
          {PERIOD_STATUS_ORDER.map((status) => (
            <button
              type="button"
              key={status}
              className={`sfm-legend-chip ${statusSlug(status)} ${statusFilter === status ? "selected" : ""}`}
              onClick={() => setStatusFilter((current) => (current === status ? "All Statuses" : status))}
              aria-pressed={statusFilter === status}
            >
              <span>{status}</span>
              <b>{monitoring?.status_counts?.[status] ?? 0}</b>
            </button>
          ))}
          {statusFilter !== "All Statuses" && (
            <button type="button" className="pa-clear-filter" onClick={() => setStatusFilter("All Statuses")}>
              Clear filter
            </button>
          )}
        </div>
        <div className="table-card cm-table-card">
          <table>
            <thead>
              <tr>
                <th>Pay Period / Fund</th><th>Employees</th><th>Payroll Cost</th>
                <th>Allocated</th><th>Released</th><th>Remaining</th>
                <th>Variance</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {periods.length ? periods.map((period) => (
                <tr key={period.fund_id || period.pay_period}>
                  <td className="strong-cell">
                    {period.pay_period}
                    <small>{period.fund_id || "No fund envelope"} · {period.fund_status}</small>
                  </td>
                  <td>{period.employees}<small>{period.allocations} allocations</small></td>
                  <td className="money-cell"><RevealableAmount value={money(period.payroll_cost)} /></td>
                  <td className="money-cell"><RevealableAmount value={money(period.allocated_fund)} /></td>
                  <td className="money-cell"><RevealableAmount value={money(period.released_fund)} /></td>
                  <td className="money-cell"><RevealableAmount value={money(period.remaining_allocation)} /></td>
                  <td className={`money-cell ${period.variance > 0 ? "sfm-over" : "sfm-under"}`}>
                    <RevealableAmount value={signedMoney(period.variance)} />
                    <small>{pct(period.variance_rate)} · {period.variance_basis}</small>
                  </td>
                  <td><StatusBadge status={period.status} /></td>
                </tr>
              )) : (
                <tr><td colSpan={8} className="empty">No salary fund period matches the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Department Salary Monitoring */}
      <section className="cm-record-panel sfm-section">
        <div className="cm-section-heading">
          <div>
            <h3>Department Salary Monitoring ({departments.length})</h3>
            <p>Allocated, used and remaining salary fund for each department.</p>
          </div>
        </div>
        <div className="table-card cm-table-card">
          <table>
            <thead>
              <tr>
                <th>Department</th><th>Employees</th><th>Allocated</th><th>Used</th>
                <th>Remaining</th><th>Payroll Cost</th><th>Utilization</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {departments.length ? departments.map((row) => (
                <tr key={row.department}>
                  <td className="strong-cell">{row.department}<small>{row.periods} pay periods</small></td>
                  <td>{row.employees}<small>{row.allocations} allocations</small></td>
                  <td className="money-cell"><RevealableAmount value={money(row.allocated_fund)} /></td>
                  <td className="money-cell"><RevealableAmount value={money(row.used_fund)} /></td>
                  <td className="money-cell"><RevealableAmount value={money(row.remaining_fund)} /></td>
                  <td className="money-cell"><RevealableAmount value={money(row.payroll_cost)} /></td>
                  <td><UtilizationBar value={row.utilization} compact /></td>
                  <td>
                    <StatusBadge status={row.status} />
                    {row.overspent > 0 && <small className="sfm-over">Overspent <RevealableAmount value={money(row.overspent)} /></small>}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={8} className="empty">No department matches the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Employee Payroll Cost Monitoring */}
      <section className="cm-record-panel sfm-section">
        <div className="cm-section-heading">
          <div>
            <h3>Employee Payroll Cost Monitoring ({employees.length})</h3>
            <p>
              Gross salary, deductions and net pay per employee, with the employer
              contribution the fund actually carries.
            </p>
          </div>
        </div>
        <div className="table-card cm-table-card">
          <table>
            <thead>
              <tr>
                <th>Employee</th><th>Department / Position</th><th>Period</th>
                <th>Basic</th><th>Overtime</th><th>Allowances</th><th>Gross</th>
                <th>Gov't Contrib.</th><th>Other Deductions</th><th>Net Salary</th>
                <th>Employer Cost</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.length ? employees.map((row) => (
                <tr key={row.allocation_id}>
                  <td className="strong-cell">
                    <RevealableText value={row.employee_name} />
                    <small><RevealableText value={row.employee_id} /> · {row.allocation_id}</small>
                  </td>
                  <td>{row.department}<small>{row.position}</small></td>
                  <td>{row.pay_period}</td>
                  <td className="money-cell"><RevealableAmount value={money(row.basic_salary)} /></td>
                  <td className="money-cell"><RevealableAmount value={money(row.overtime_pay)} /></td>
                  <td className="money-cell"><RevealableAmount value={money(row.allowances)} /></td>
                  <td className="money-cell"><RevealableAmount value={money(row.gross_salary)} /></td>
                  <td className="money-cell"><RevealableAmount value={money(row.government_contributions)} /></td>
                  <td className="money-cell"><RevealableAmount value={money(row.other_deductions)} /></td>
                  <td className="money-cell"><strong><RevealableAmount value={money(row.net_salary)} /></strong></td>
                  <td className="money-cell"><RevealableAmount value={money(row.employer_cost)} /></td>
                  <td><StatusBadge status={row.payroll_status} /></td>
                </tr>
              )) : (
                <tr><td colSpan={12} className="empty">No employee payroll matches the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. Fund Release Monitoring */}
      <section className="cm-record-panel sfm-section">
        <div className="cm-section-heading">
          <div>
            <h3>Fund Release Monitoring ({releases.length})</h3>
            <p>
              Fund request → review → approval → allocation → release → payroll
              processing → payment → reconciliation.
            </p>
          </div>
          <button
            type="button"
            className="light-button"
            onClick={() => navigate?.("Employee Payroll Allocation")}
          >
            <HandCoins size={14} /> Manage Allocations
          </button>
        </div>
        <div className="table-card cm-table-card">
          <table>
            <thead>
              <tr>
                <th>Reference</th><th>Fund / Period</th><th>Requested</th>
                <th>Approved</th><th>Released</th><th>Date</th>
                <th>Released By</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {releases.length ? releases.map((release) => (
                <tr key={release.release_id}>
                  <td className="link-cell">
                    {release.release_reference}
                    <small>{release.release_id}</small>
                  </td>
                  <td>{release.fund_id}<small>{release.pay_period}</small></td>
                  <td className="money-cell"><RevealableAmount value={money(release.requested_amount)} /></td>
                  <td className="money-cell"><RevealableAmount value={money(release.approved_amount)} /></td>
                  <td className="money-cell"><RevealableAmount value={money(release.released_amount)} /></td>
                  <td>
                    {dateLabel(release.release_date)}
                    <small>Requested {dateLabel(release.request_date)}</small>
                  </td>
                  <td>{release.released_by}<small>{release.supporting_document}</small></td>
                  <td>
                    <StatusBadge status={release.status} prefix="sfm-step" />
                    <small>{release.next_step ? `Next: ${release.next_step}` : "Complete"}</small>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="cm-view-button"
                      onClick={() => openDetail(release)}
                      disabled={detailLoading}
                      title="View release movement"
                    >
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={9} className="empty">No salary fund release has been recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 8. Fund Variance Monitoring */}
      <section className="cm-record-panel sfm-section">
        <div className="cm-section-heading">
          <div>
            <h3>Fund Variance Monitoring</h3>
            <p>Planned salary fund against actual payroll cost, worst overrun first.</p>
          </div>
        </div>
        <div className="sfm-variance-head">
          <div>
            <span>Planned Salary Fund</span>
            <strong><RevealableAmount value={money(monitoring?.variance?.planned_salary_fund)} /></strong>
          </div>
          <div>
            <span>Actual Payroll Cost</span>
            <strong><RevealableAmount value={money(monitoring?.variance?.actual_payroll_cost)} /></strong>
          </div>
          <div className={monitoring?.variance?.variance > 0 ? "sfm-over" : "sfm-under"}>
            <span>Variance</span>
            <strong><RevealableAmount value={signedMoney(monitoring?.variance?.variance)} /></strong>
          </div>
          <div className={monitoring?.variance?.variance > 0 ? "sfm-over" : "sfm-under"}>
            <span>Variance Rate</span>
            <strong>
              {monitoring?.variance?.variance > 0 ? "+" : ""}
              {pct(monitoring?.variance?.variance_rate)}
            </strong>
          </div>
          <div>
            <span>Position</span>
            <strong className="sfm-direction">
              {monitoring?.variance?.variance > 0
                ? <TrendingUp size={16} />
                : <TrendingDown size={16} />}
              {display(monitoring?.variance?.direction)}
            </strong>
          </div>
        </div>
        <div className="table-card cm-table-card">
          <table>
            <thead>
              <tr>
                <th>Payroll Period</th><th>Planned Fund</th><th>Actual Payroll Cost</th>
                <th>Variance</th><th>Variance Rate</th><th>Measured Against</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {variancePeriods.length ? variancePeriods.map((row) => (
                <tr key={row.fund_id || row.pay_period}>
                  <td className="strong-cell">{row.pay_period}<small>{row.fund_id || "No fund"}</small></td>
                  <td className="money-cell"><RevealableAmount value={money(row.planned_fund)} /></td>
                  <td className="money-cell"><RevealableAmount value={money(row.payroll_cost)} /></td>
                  <td className={`money-cell ${row.variance > 0 ? "sfm-over" : "sfm-under"}`}>
                    <RevealableAmount value={signedMoney(row.variance)} />
                  </td>
                  <td className={row.variance > 0 ? "sfm-over" : "sfm-under"}>
                    {row.variance > 0 ? "+" : ""}{pct(row.variance_rate)}
                  </td>
                  <td><small>{row.variance_basis}</small></td>
                  <td><StatusBadge status={row.status} /></td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="empty">No variance to report yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 9. Reconciliation */}
      <section className="cm-record-panel sfm-section">
        <div className="cm-section-heading">
          <div>
            <h3>Reconciliation ({reconciliation.length})</h3>
            <p>What each release disbursed against the payroll cost that actually absorbed it.</p>
          </div>
        </div>
        <div className="table-card cm-table-card">
          <table>
            <thead>
              <tr>
                <th>Release</th><th>Fund / Period</th><th>Released</th>
                <th>Payroll Cost Absorbed</th><th>Unreconciled</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reconciliation.length ? reconciliation.map((row) => (
                <tr key={row.release_reference}>
                  <td className="link-cell">{row.release_reference}</td>
                  <td>{row.fund_id}<small>{row.pay_period}</small></td>
                  <td className="money-cell"><RevealableAmount value={money(row.released_amount)} /></td>
                  <td className="money-cell"><RevealableAmount value={money(row.absorbed_payroll_cost)} /></td>
                  <td className={`money-cell ${row.unreconciled_amount > 0 ? "sfm-over" : "sfm-under"}`}>
                    <RevealableAmount value={money(row.unreconciled_amount)} />
                  </td>
                  <td>
                    <StatusBadge status={row.unreconciled_amount > 0 ? "For Review" : row.status} />
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="empty">Nothing to reconcile yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 10. Reports */}
      <section className="cm-record-panel sfm-section">
        <div className="cm-section-heading">
          <div>
            <h3>Reports ({reports.length})</h3>
            <p>
              Each report is assembled by the API from the records above, so a printed
              report cannot quote different numbers from the screen.
            </p>
          </div>
        </div>
        <div className="sfm-report-grid">
          {reports.map((entry) => (
            <button
              type="button"
              key={entry.key}
              className={`sfm-report ${reportKey === entry.key ? "selected" : ""}`}
              onClick={() => setReportKey((current) => (current === entry.key ? null : entry.key))}
              aria-pressed={reportKey === entry.key}
            >
              <FileText size={15} />
              <strong>{entry.title}</strong>
              <small>{entry.rows.length} rows</small>
            </button>
          ))}
        </div>
        {activeReport && (
          <div className="table-card cm-table-card sfm-report-preview">
            <div className="cm-section-heading">
              <div>
                <h4>{activeReport.title}</h4>
                <p>{activeReport.description}</p>
              </div>
              <button type="button" className="light-button" onClick={() => printReport(activeReport)}>
                <Printer size={14} /> Print Report
              </button>
            </div>
            <table>
              <thead>
                <tr>{activeReport.columns.map((column) => <th key={column}>{column}</th>)}</tr>
              </thead>
              <tbody>
                {activeReport.rows.length ? activeReport.rows.map((row, index) => (
                  <tr key={`${activeReport.key}-${index}`}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${activeReport.key}-${index}-${cellIndex}`} className={cellIndex ? "money-cell" : "strong-cell"}>
                        {cellIndex ? <RevealableAmount value={display(cell)} /> : display(cell)}
                      </td>
                    ))}
                  </tr>
                )) : (
                  <tr><td colSpan={activeReport.columns.length} className="empty">No rows for this report yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Release drill-down */}
      {detail && (
        <div className="modal-overlay" onClick={() => !detailLoading && setDetail(null)}>
          <div className="modal sfm-detail-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Salary Fund Release</h2>
                <p>{detail.release.release_reference} · {detail.release.fund_id}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} aria-label="Close"><X size={15} /></button>
            </div>
            <div className="sfm-detail-body">
              <div className={`sfm-detail-hero ${statusSlug(detail.release.status)}`}>
                <div><span>Payroll Period</span><strong>{display(detail.release.pay_period)}</strong></div>
                <div><span>Requested</span><strong><RevealableAmount value={money(detail.release.requested_amount)} /></strong></div>
                <div><span>Approved</span><strong><RevealableAmount value={money(detail.release.approved_amount)} /></strong></div>
                <div><span>Released</span><strong><RevealableAmount value={money(detail.release.released_amount)} /></strong></div>
                <div><span>Status</span><StatusBadge status={detail.release.status} prefix="sfm-step" /></div>
              </div>

              <section className="sfm-detail-section">
                <h3>Fund Movement</h3>
                <ol className="sfm-timeline">
                  {(detail.release.timeline || []).map((step) => (
                    <li key={step.step} className={step.state}>
                      <span className="sfm-timeline-dot" aria-hidden="true" />
                      <span className="sfm-timeline-label">{step.step}</span>
                      <span className="sfm-timeline-state">{step.state}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="sfm-detail-section">
                <h3>Release Information</h3>
                <dl className="cm-detail-grid">
                  <div><dt>Release Reference</dt><dd>{detail.release.release_reference}</dd></div>
                  <div><dt>Release ID</dt><dd>{detail.release.release_id}</dd></div>
                  <div><dt>Salary Fund</dt><dd>{display(detail.release.fund_name)}</dd></div>
                  <div><dt>Pay Period</dt><dd>{detail.release.pay_period}</dd></div>
                  <div><dt>Request Date</dt><dd>{dateLabel(detail.release.request_date)}</dd></div>
                  <div><dt>Release Date</dt><dd>{dateLabel(detail.release.release_date)}</dd></div>
                  <div><dt>Requested By</dt><dd>{detail.release.requested_by}</dd></div>
                  <div><dt>Approved By</dt><dd>{detail.release.approved_by}</dd></div>
                  <div><dt>Released By</dt><dd>{detail.release.released_by}</dd></div>
                  <div><dt>Supporting Document</dt><dd>{detail.release.supporting_document}</dd></div>
                  <div><dt>Unreleased Amount</dt><dd><RevealableAmount value={money(detail.release.unreleased_amount)} /></dd></div>
                  <div><dt>Absorbed Payroll Cost</dt><dd><RevealableAmount value={money(detail.release.absorbed_payroll_cost)} /></dd></div>
                  <div><dt>Unreconciled Amount</dt><dd><RevealableAmount value={money(detail.release.unreconciled_amount)} /></dd></div>
                  <div className="full"><dt>Remarks</dt><dd>{display(detail.release.remarks)}</dd></div>
                </dl>
              </section>

              {detail.allocations.length > 0 && (
                <section className="sfm-detail-section">
                  <h3>Payroll Cost in This Period ({detail.allocations.length})</h3>
                  <div className="table-card cm-payment-table">
                    <table>
                      <thead>
                        <tr><th>Employee</th><th>Department</th><th>Gross</th><th>Net</th><th>Employer Cost</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {detail.allocations.map((row) => (
                          <tr key={row.allocation_id}>
                            <td className="strong-cell"><RevealableText value={row.employee_name} /><small>{row.allocation_id}</small></td>
                            <td>{row.department}</td>
                            <td className="money-cell"><RevealableAmount value={money(row.gross_salary)} /></td>
                            <td className="money-cell"><RevealableAmount value={money(row.net_salary)} /></td>
                            <td className="money-cell"><RevealableAmount value={money(row.employer_cost)} /></td>
                            <td><StatusBadge status={row.payroll_status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="light-button"
                onClick={() => navigate?.("Employee Payroll Allocation")}
              >
                <Users size={14} /> Employee Payroll Allocation
              </button>
              <button type="button" className="light-button" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
