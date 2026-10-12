import React, { useCallback, useEffect, useMemo, useState } from "react";
import RevealableAmount from "../../components/RevealableAmount";
import RevealableText from "../../components/RevealableText";
import {
  AlertTriangle,
  Clock3,
  Eye,
  History,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

// Status colors are text tints on a pale chip — no emoji, no status glyphs.
// Green Approved, Blue Allocated, Yellow Pending, Orange For Review,
// Red Rejected, Purple Released.
const STATUS_ORDER = [
  "Pending",
  "For Review",
  "Approved",
  "Allocated",
  "Released",
  "Rejected",
];

const STATUS_SLUGS = {
  Pending: "pending",
  "For Review": "for-review",
  Approved: "approved",
  Allocated: "allocated",
  Released: "released",
  Rejected: "rejected",
};

const money = (value) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const pct = (value) => `${Number(value || 0).toFixed(Number(value || 0) % 1 ? 2 : 0)}%`;

const display = (value) =>
  value === null || value === undefined || value === "" ? "—" : value;

const dateLabel = (value) => {
  if (!value) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const statusSlug = (status) =>
  STATUS_SLUGS[status] || String(status || "unknown").toLowerCase().replace(/\s+/g, "-");

const escapeHtml = (value) =>
  String(value ?? "—")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "The payroll allocation request failed.");
  }
  return payload;
}

const StatusBadge = ({ status }) => (
  <span className={`pa-status ${statusSlug(status)}`}>{display(status)}</span>
);

const UtilizationBar = ({ value = 0, compact = false }) => {
  const width = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className={`pa-util ${compact ? "compact" : ""}`}>
      <div className="pa-util-track" aria-hidden="true">
        <span style={{ width: `${width}%` }} />
      </div>
      <b>{pct(width)}</b>
    </div>
  );
};


export default function PayrollAllocationPage({ onAudit = () => {}, navigate }) {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [distribution, setDistribution] = useState({ departments: [], funds: [] });
  const [filters, setFilters] = useState({ statuses: [], departments: [], fund_sources: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [fundFilter, setFundFilter] = useState("All Funds");

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const payload = await request("/api/payroll/allocations");
      setRows(Array.isArray(payload.data) ? payload.data : []);
      setSummary(payload.summary || null);
      setDistribution(payload.distribution || { departments: [], funds: [] });
      const filterPayload = await request("/api/payroll/allocations/filters");
      setFilters(filterPayload.data || {});
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

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "All Statuses" && row.status !== statusFilter) return false;
      if (departmentFilter !== "All Departments" && row.department !== departmentFilter) return false;
      if (fundFilter !== "All Funds" && row.fund_source !== fundFilter) return false;
      if (!query) return true;
      return [
        row.allocation_id,
        row.employee_id,
        row.employee_name,
        row.position,
        row.department,
        row.fund_source,
        row.budget_code,
        row.pay_period,
        row.status,
        row.remarks,
      ].some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [rows, search, statusFilter, departmentFilter, fundFilter]);

  // Any mutation re-reads afterwards, otherwise the cards would keep showing the
  // pre-action figures while the table row had already changed.
  const runAction = async (label, action) => {
    setSaving(true);
    try {
      const result = await action();
      setError("");
      if (result?.message) onAudit?.(result.message);
      await load(true);
      return result;
    } catch (actionError) {
      setError(actionError.message);
      return null;
    } finally {
      setSaving(false);
    }
  };


  const openDetail = async (row) => {
    setDetailLoading(true);
    setDetail({ record: row, history: [] });
    try {
      const payload = await request(`/api/payroll/allocations/${row.id}`);
      setDetail({ record: payload.data, history: payload.history || [] });
      onAudit?.("Viewed payroll allocation", row.allocation_id);
    } catch (detailError) {
      setError(detailError.message);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // The contextual button (Submit for Review / Approve / Allocate / Release)
  // follows next_action from the server, so the UI never offers a transition
  // the API would refuse.
  const advanceRecord = async (row) => {
    if (!row.next_action) return;
    const { action, label } = row.next_action;
    if (action === "release") {
      const ok = window.confirm(
        `${row.allocation_id} will RELEASE ${money(row.total_cost)} to ${row.employee_name}.\n\n` +
          `Allocated budget: ${money(row.allocated_budget)}\n` +
          `Remaining after release: ${money(Math.max(row.allocated_budget - row.total_cost, 0))}\n\n` +
          `Release the payroll fund?`
      );
      if (!ok) return;
    }
    await runAction(`${action} ${row.allocation_id}`, () =>
      request(`/api/payroll/allocations/${row.id}/${action}`, {
        method: "POST",
        body: JSON.stringify({ actor: "Admin User" }),
      })
    );
  };

  const rejectRecord = async () => {
    const reason = rejectReason.trim();
    if (!reason) {
      window.alert("A reason is required to reject an allocation.");
      return;
    }
    const result = await runAction(`reject ${rejecting.allocation_id}`, () =>
      request(`/api/payroll/allocations/${rejecting.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ actor: "Admin User", remarks: reason }),
      })
    );
    if (result) {
      setRejecting(null);
      setRejectReason("");
      setDetail(null);
    }
  };

  const saveAllocation = async (form) => {
    await runAction(editing?.id ? "update allocation" : "create allocation", () =>
      request(`/api/payroll/allocations${editing?.id ? `/${editing.id}` : ""}`, {
        method: editing?.id ? "PUT" : "POST",
        body: JSON.stringify(form),
      })
    );
    setEditing(null);
  };

  const printRecord = (row) => {
    const popup = window.open("", "_blank");
    if (!popup) {
      setError("The print window was blocked. Allow pop-ups and try again.");
      return;
    }
    const lines = [
      ["Allocation ID", row.allocation_id],
      ["Employee", `${row.employee_name} (${row.employee_id})`],
      ["Position", row.position],
      ["Department", row.department],
      ["Fund Source", row.fund_source],
      ["Budget Code", row.budget_code],
      ["Pay Period", row.pay_period],
      ["Basic Salary", money(row.basic_salary)],
      ["Allowances", money(row.allowances)],
      ["Overtime", money(row.overtime)],
      ["Gross Pay", money(row.gross_pay)],
      ["Employer Contributions (SSS/PhilHealth/Pag-IBIG)", money(row.employer_contributions)],
      ["Total Payroll Cost", money(row.total_cost)],
      ["Allocated Budget", money(row.allocated_budget)],
      ["Fund Used", money(row.used_amount)],
      ["Remaining Fund", money(row.remaining_fund)],
      ["Utilization", pct(row.utilization)],
      ["Status", row.status],
      ["Prepared By", row.prepared_by],
      ["Approved By", row.approved_by],
      ["Released By", row.released_by],
      ["Remarks", row.remarks || "—"],
    ];
    popup.document.write(
      `<!doctype html><html><head><title>${escapeHtml(row.allocation_id)}</title><style>
      body{font-family:Arial,sans-serif;padding:28px;color:#1f2937}
      h1{font-size:18px;margin:0 0 4px}p{color:#64748b;margin:0 0 18px;font-size:12px}
      table{width:100%;border-collapse:collapse;font-size:13px}
      td{padding:7px 10px;border-bottom:1px solid #e5e7eb}
      td:first-child{color:#64748b;width:45%}td:last-child{text-align:right;font-weight:600}
      </style></head><body>
      <h1>Employee Payroll Allocation — ${escapeHtml(row.allocation_id)}</h1>
      <p>PrimePower Manpower · Generated ${new Date().toLocaleString()}</p>
      <table>${lines
        .map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`)
        .join("")}</table>
      <script>window.print();</script></body></html>`
    );
    popup.document.close();
    onAudit?.("Printed payroll allocation", row.allocation_id);
  };


  if (loading) {
    return (
      <section className="management-page payroll-allocation-page">
        <div className="contract-alert">
          <Clock3 size={17} /> Loading payroll allocations…
        </div>
      </section>
    );
  }

  const cardData = [
    ["Allocated Budget", <RevealableAmount value={money(summary?.total_allocated)} />, "Fund reserved across active allocations"],
    ["Fund Used", <RevealableAmount value={money(summary?.total_used)} />, "Released payroll cost drawn from the fund"],
    ["Remaining Fund", <RevealableAmount value={money(summary?.remaining_fund)} />, "Allocated budget minus fund used"],
    ["Utilization", pct(summary?.utilization), "Used divided by allocated budget"],
    ["Employees", summary?.total_employees || 0, `${summary?.total || 0} allocation records`],
    ["Awaiting Approval", summary?.awaiting_approval || 0, "Pending plus for-review rows"],
    ["Approved", summary?.approved || 0, "Approved and allocated rows"],
    ["Released", summary?.released || 0, "Payroll funds disbursed"],
  ];

  return (
    <section className="management-page payroll-allocation-page">
      <div className="breadcrumb">
        <span>Dashboard</span><b>›</b><span>Fund &amp; Budget Management</span><b>›</b>
        <strong>Employee Payroll Allocation</strong>
      </div>

      <div className="management-header">
        <div>
          <h2>Employee Payroll Allocation</h2>
          <p>
            Allocate payroll fund per employee and pay period, then drive each row
            from review through approval, allocation and release. Remaining Fund and
            Utilization are calculated on the server from these same records.
          </p>
        </div>
        <div className="management-actions">
          <button
            type="button"
            className="light-button"
            onClick={() => navigate?.("Salary Fund Monitoring")}
          >
            Salary Fund Monitoring
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
          <button
            type="button"
            className="primary-button"
            onClick={() => setEditing({})}
          >
            <Plus size={15} /> New Allocation
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

      <div className="vendor-summary-grid pa-summary-grid">
        {cardData.map(([label, value, note]) => (
          <div className="vendor-summary-card" key={label}>
            <span className="vendor-summary-label">{label}</span>
            <strong className="vendor-summary-value">{value}</strong>
            <span className="vendor-summary-count">{note}</span>
          </div>
        ))}
      </div>

      <section className="pa-legend" aria-label="Allocation status filters">
        {STATUS_ORDER.map((status) => (
          <button
            type="button"
            key={status}
            className={`pa-legend-chip ${statusSlug(status)} ${statusFilter === status ? "selected" : ""}`}
            onClick={() =>
              setStatusFilter((current) => (current === status ? "All Statuses" : status))
            }
            aria-pressed={statusFilter === status}
          >
            <span>{status}</span>
            <b>{summary?.status_counts?.[status] ?? 0}</b>
          </button>
        ))}
        {statusFilter !== "All Statuses" && (
          <button
            type="button"
            className="pa-clear-filter"
            onClick={() => setStatusFilter("All Statuses")}
          >
            Clear filter
          </button>
        )}
      </section>

      <div className="cm-toolbar pa-toolbar">
        <label className="cm-search">
          <Search size={14} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search allocation ID, employee, fund, budget code..."
          />
        </label>
        <label>
          <span>Department</span>
          <select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
          >
            <option>All Departments</option>
            {(filters.departments || []).map((dept) => <option key={dept}>{dept}</option>)}
          </select>
        </label>
        <label>
          <span>Fund Source</span>
          <select value={fundFilter} onChange={(event) => setFundFilter(event.target.value)}>
            <option>All Funds</option>
            {(filters.fund_sources || []).map((fund) => <option key={fund}>{fund}</option>)}
          </select>
        </label>
      </div>

      <section className="cm-record-panel">
        <div className="cm-section-heading">
          <div>
            <h3>Allocation Register ({visibleRows.length})</h3>
            <p>Every figure below is recalculated from the live database on refresh.</p>
          </div>
        </div>
        <div className="table-card cm-table-card">
          <table>
            <thead>
              <tr>
                <th>Allocation</th>
                <th>Employee</th>
                <th>Department / Fund</th>
                <th>Payroll Cost</th>
                <th>Allocated / Used</th>
                <th>Remaining / Utilization</th>
                <th>Period</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length ? (
                visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td className="link-cell">
                      {row.allocation_id}
                      <small>{row.budget_code}</small>
                    </td>
                    <td className="strong-cell">
                      <RevealableText value={row.employee_name} />
                      <small><RevealableText value={row.employee_id} /> · {row.position}</small>
                    </td>
                    <td>
                      {row.department}
                      <small>{row.fund_source}</small>
                    </td>
                    <td className="money-cell">
                      <RevealableAmount value={money(row.total_cost)} />
                      <small>Gross <RevealableAmount value={money(row.gross_pay)} /> + contributions <RevealableAmount value={money(row.employer_contributions)} /></small>
                    </td>
                    <td className="money-cell">
                      <RevealableAmount value={money(row.allocated_budget)} />
                      <small>Used <RevealableAmount value={money(row.used_amount)} /></small>
                    </td>
                    <td className="money-cell">
                      <RevealableAmount value={money(row.remaining_fund)} />
                      <UtilizationBar value={row.utilization} compact />
                    </td>
                    <td>{row.pay_period}</td>
                    <td><StatusBadge status={row.status} /></td>
                    <td>
                      <div className="pa-row-actions">
                        <button
                          type="button"
                          className="pa-icon-btn"
                          title="View allocation details"
                          onClick={() => openDetail(row)}
                          disabled={detailLoading}
                        >
                          <Eye size={14} />
                        </button>
                        {row.status !== "Released" && row.status !== "Rejected" && (
                          <button
                            type="button"
                            className="pa-icon-btn"
                            title="Edit allocation"
                            onClick={() => setEditing({ ...row })}
                            disabled={saving}
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {row.next_action && (
                          <button
                            type="button"
                            className={`pa-workflow-btn ${statusSlug(row.status)}`}
                            onClick={() => advanceRecord(row)}
                            disabled={saving}
                          >
                            {row.next_action.label}
                          </button>
                        )}
                        {row.can_reject && (
                          <button
                            type="button"
                            className="pa-reject-btn"
                            onClick={() => {
                              setRejecting(row);
                              setRejectReason("");
                            }}
                            disabled={saving}
                          >
                            Reject
                          </button>
                        )}
                        <button
                          type="button"
                          className="pa-icon-btn"
                          title="Print allocation"
                          onClick={() => printRecord(row)}
                        >
                          <Printer size={14} />
                        </button>
                        <button
                          type="button"
                          className="pa-icon-btn"
                          title="View status history"
                          onClick={() => openDetail(row)}
                        >
                          <History size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="empty">
                    No payroll allocations match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="pa-distribution-grid">
        <section className="cm-record-panel">
          <div className="cm-section-heading">
            <div>
              <h3>Department Distribution</h3>
              <p>Allocated budget and fund usage grouped by department.</p>
            </div>
          </div>
          <div className="table-card cm-table-card">
            <table>
              <thead>
                <tr>
                  <th>Department</th><th>Employees</th><th>Allocations</th>
                  <th>Allocated</th><th>Used</th><th>Remaining</th><th>Utilization</th>
                </tr>
              </thead>
              <tbody>
                {distribution.departments.length ? (
                  distribution.departments.map((dept) => (
                    <tr key={dept.name}>
                      <td className="strong-cell">{dept.name}</td>
                      <td>{dept.employees}</td>
                      <td>{dept.allocations}</td>
                      <td className="money-cell"><RevealableAmount value={money(dept.allocated_budget)} /></td>
                      <td className="money-cell"><RevealableAmount value={money(dept.used_amount)} /></td>
                      <td className="money-cell"><RevealableAmount value={money(dept.remaining_fund)} /></td>
                      <td><UtilizationBar value={dept.utilization} compact /></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={7} className="empty">No allocation data yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="cm-record-panel">
          <div className="cm-section-heading">
            <div>
              <h3>Fund Source Distribution</h3>
              <p>How each payroll fund is split between used and remaining.</p>
            </div>
          </div>
          <div className="table-card cm-table-card">
            <table>
              <thead>
                <tr>
                  <th>Fund Source</th><th>Employees</th><th>Allocations</th>
                  <th>Allocated</th><th>Used</th><th>Remaining</th><th>Utilization</th>
                </tr>
              </thead>
              <tbody>
                {distribution.funds.length ? (
                  distribution.funds.map((fund) => (
                    <tr key={fund.name}>
                      <td className="strong-cell">{fund.name}</td>
                      <td>{fund.employees}</td>
                      <td>{fund.allocations}</td>
                      <td className="money-cell"><RevealableAmount value={money(fund.allocated_budget)} /></td>
                      <td className="money-cell"><RevealableAmount value={money(fund.used_amount)} /></td>
                      <td className="money-cell"><RevealableAmount value={money(fund.remaining_fund)} /></td>
                      <td><UtilizationBar value={fund.utilization} compact /></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={7} className="empty">No allocation data yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>


      {detail && (
        <div className="modal-overlay" onClick={() => !detailLoading && setDetail(null)}>
          <div
            className="modal cm-detail-modal pa-detail-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Payroll Allocation Details</h2>
                <p>{detail.record.allocation_id}</p>
              </div>
              <button
                type="button"
                className="tax-icon-btn"
                onClick={() => setDetail(null)}
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>
            <div className="cm-detail-body">
              <div className={`cm-detail-hero ${statusSlug(detail.record.status)}`}>
                <div>
                  <span>Employee</span>
                  <strong><RevealableText value={detail.record.employee_name} /></strong>
                  <small><RevealableText value={detail.record.employee_id} /> · {detail.record.position}</small>
                </div>
                <div>
                  <span>Status</span>
                  <StatusBadge status={detail.record.status} />
                  <small>{detail.record.department}</small>
                </div>
                <div>
                  <span>Allocated Budget</span>
                  <strong><RevealableAmount value={money(detail.record.allocated_budget)} /></strong>
                  <small>{detail.record.fund_source}</small>
                </div>
                <div>
                  <span>Fund Used</span>
                  <strong><RevealableAmount value={money(detail.record.used_amount)} /></strong>
                  <small>{detail.record.status === "Released" ? "Drawn on release" : "No release yet"}</small>
                </div>
                <div>
                  <span>Remaining Fund</span>
                  <strong><RevealableAmount value={money(detail.record.remaining_fund)} /></strong>
                  <small>Allocated budget minus used</small>
                </div>
                <div>
                  <span>Utilization</span>
                  <strong>{pct(detail.record.utilization)}</strong>
                  <UtilizationBar value={detail.record.utilization} compact />
                </div>
              </div>

              <section className="cm-detail-section">
                <h3>Payroll Cost Breakdown</h3>
                <dl className="cm-detail-grid">
                  <div><dt>Basic Salary</dt><dd><RevealableAmount value={money(detail.record.basic_salary)} /></dd></div>
                  <div><dt>Allowances</dt><dd><RevealableAmount value={money(detail.record.allowances)} /></dd></div>
                  <div><dt>Overtime</dt><dd><RevealableAmount value={money(detail.record.overtime)} /></dd></div>
                  <div><dt>Gross Pay</dt><dd><RevealableAmount value={money(detail.record.gross_pay)} /></dd></div>
                  <div><dt>SSS (Employer Share)</dt><dd><RevealableAmount value={money(detail.record.sss_employer)} /></dd></div>
                  <div><dt>PhilHealth (Employer Share)</dt><dd><RevealableAmount value={money(detail.record.philhealth_employer)} /></dd></div>
                  <div><dt>Pag-IBIG (Employer Share)</dt><dd><RevealableAmount value={money(detail.record.pagibig_employer)} /></dd></div>
                  <div><dt>Employer Contributions</dt><dd><RevealableAmount value={money(detail.record.employer_contributions)} /></dd></div>
                  <div>
                    <dt className="pa-total-cell">Total Payroll Cost</dt>
                    <dd className="pa-total-cell"><RevealableAmount value={money(detail.record.total_cost)} /></dd>
                  </div>
                  {detail.record.over_budget && (
                    <div className="full">
                      <dt>Budget Check</dt>
                      <dd className="pa-over-budget">
                        Total cost exceeds the allocated budget by{" "}
                        <RevealableAmount value={money(detail.record.total_cost - detail.record.allocated_budget)} />.
                        Resize the allocation before release.
                      </dd>
                    </div>
                  )}
                </dl>
              </section>

              <section className="cm-detail-section">
                <h3>Fund Information</h3>
                <dl className="cm-detail-grid">
                  <div><dt>Fund Source</dt><dd>{detail.record.fund_source}</dd></div>
                  <div><dt>Budget Code</dt><dd>{detail.record.budget_code}</dd></div>
                  <div><dt>Pay Period</dt><dd>{detail.record.pay_period}</dd></div>
                  <div><dt>Department</dt><dd>{detail.record.department}</dd></div>
                  <div><dt>Allocated Budget</dt><dd><RevealableAmount value={money(detail.record.allocated_budget)} /></dd></div>
                  <div><dt>Fund Used</dt><dd><RevealableAmount value={money(detail.record.used_amount)} /></dd></div>
                  <div><dt>Remaining Fund</dt><dd><RevealableAmount value={money(detail.record.remaining_fund)} /></dd></div>
                  <div><dt>Utilization</dt><dd>{pct(detail.record.utilization)}</dd></div>
                  <div><dt>Prepared By</dt><dd>{detail.record.prepared_by}</dd></div>
                  <div><dt>Approved By</dt><dd>{detail.record.approved_by}</dd></div>
                  <div><dt>Released By</dt><dd>{detail.record.released_by}</dd></div>
                  <div><dt>Last Updated</dt><dd>{dateLabel(detail.record.updated_at)}</dd></div>
                  <div className="full"><dt>Remarks</dt><dd>{detail.record.remarks || "—"}</dd></div>
                </dl>
              </section>



              <section className="cm-detail-section">
                <h3>Status History ({detail.history.length})</h3>
                {detail.history.length ? (
                  <ul className="pa-history-list">
                    {detail.history.map((entry, index) => (
                      <li key={`${entry.action}-${index}`}>
                        <strong>{entry.action}</strong>
                        <span>
                          {entry.old_status
                            ? `${entry.old_status} → ${entry.new_status}`
                            : `Created as ${entry.new_status}`}
                          {" · "}{entry.actor}
                          {" · "}{dateLabel(entry.created_at)}
                        </span>
                        {entry.remarks && <small>{entry.remarks}</small>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="cm-empty-note">
                    No workflow events recorded yet. Events appear as the allocation
                    moves through review, approval, allocation and release.
                  </p>
                )}
              </section>
            </div>
            <div className="modal-footer">
              {detail.record.can_reject && (
                <button
                  type="button"
                  className="light-button"
                  onClick={() => {
                    setRejecting(detail.record);
                    setRejectReason("");
                  }}
                  disabled={saving}
                >
                  Reject
                </button>
              )}
              {detail.record.next_action && (
                <button
                  type="button"
                  className={`pa-workflow-btn ${statusSlug(detail.record.status)}`}
                  onClick={() => advanceRecord(detail.record)}
                  disabled={saving}
                >
                  {detail.record.next_action.label}
                </button>
              )}
              <button
                type="button"
                className="primary-button"
                onClick={() => printRecord(detail.record)}
              >
                <Printer size={14} /> Print
              </button>
            </div>
          </div>
        </div>
      )}


      {rejecting && (
        <div
          className="modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setRejecting(null);
              setRejectReason("");
            }
          }}
        >
          <div className="modal pa-reject-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <h2>Reject Allocation</h2>
                <p>{rejecting.allocation_id} · {rejecting.employee_name}</p>
              </div>
              <button
                type="button"
                className="tax-icon-btn"
                onClick={() => {
                  setRejecting(null);
                  setRejectReason("");
                }}
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>
            <div className="pa-reject-body">
              <p>
                Rejection requires a reason — it is recorded in the allocation's
                status history and cannot be omitted.
              </p>
              <label>
                <span>Reason for rejection</span>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  placeholder="e.g. Budget code belongs to the wrong cost center."
                />
              </label>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="light-button"
                onClick={() => {
                  setRejecting(null);
                  setRejectReason("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={rejectRecord}
                disabled={saving || !rejectReason.trim()}
              >
                {saving ? "Rejecting…" : "Reject Allocation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <AllocationForm
          initial={editing}
          filters={filters}
          saving={saving}
          onClose={() => setEditing(null)}
          onSubmit={saveAllocation}
        />
      )}
    </section>
  );
}

const allocationBlank = {
  employee_id: "",
  employee_name: "",
  position: "",
  department: "",
  fund_source: "",
  budget_code: "",
  pay_period: "",
  basic_salary: "",
  allowances: "",
  overtime: "",
  sss_employer: "",
  philhealth_employer: "",
  pagibig_employer: "",
  allocated_budget: "",
  prepared_by: "Finance Staff",
  remarks: "",
};

function AllocationForm({ initial, filters, saving, onClose, onSubmit }) {
  const [form, setForm] = useState({ ...allocationBlank, ...initial });
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // Server-computed as you type; the API recomputes the authoritative figures.
  const numeric = (key) => Number(form[key] || 0);
  const gross = numeric("basic_salary") + numeric("allowances") + numeric("overtime");
  const contributions =
    numeric("sss_employer") + numeric("philhealth_employer") + numeric("pagibig_employer");
  const totalCost = gross + contributions;
  const allocated = numeric("allocated_budget");
  const remaining = Math.max(allocated - totalCost, 0);
  const overBudget = allocated > 0 && totalCost > allocated;

  const fields = [
    ["employee_id", "Employee ID", "text", true],
    ["employee_name", "Employee name", "text", true],
    ["position", "Position", "text", false],
    ["budget_code", "Budget code", "text", false],
    ["pay_period", "Pay period (e.g. 2026-09)", "text", false],
    ["basic_salary", "Basic salary", "number", false],
    ["allowances", "Allowances", "number", false],
    ["overtime", "Overtime", "number", false],
    ["sss_employer", "SSS employer share", "number", false],
    ["philhealth_employer", "PhilHealth employer share", "number", false],
    ["pagibig_employer", "Pag-IBIG employer share", "number", false],
    ["allocated_budget", "Allocated budget", "number", true],
  ];

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        className="modal pa-form-modal"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <div className="modal-header">
          <div>
            <h2>{initial.id ? `Update ${initial.allocation_id}` : "New Payroll Allocation"}</h2>
            <p>
              {initial.id
                ? "Released and rejected allocations can no longer be edited."
                : "New allocations always start as Pending and enter the review workflow."}
            </p>
          </div>
          <button type="button" className="tax-icon-btn" onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>
        <div className="pa-form-body">
          <div className="pa-form-grid">
            {fields.map(([key, label, type, required]) => (
              <label key={key}>
                <span>{label}{required ? " *" : ""}</span>
                <input
                  type={type}
                  min={type === "number" ? "0" : undefined}
                  step={type === "number" ? "0.01" : undefined}
                  required={required}
                  value={form[key] ?? ""}
                  onChange={(event) => set(key, event.target.value)}
                />
              </label>
            ))}
            <label>
              <span>Department *</span>
              <select
                required
                value={form.department}
                onChange={(event) => set("department", event.target.value)}
              >
                <option value="">Select department…</option>
                {(filters.departments || []).map((dept) => (
                  <option key={dept}>{dept}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Fund source *</span>
              <select
                required
                value={form.fund_source}
                onChange={(event) => set("fund_source", event.target.value)}
              >
                <option value="">Select fund source…</option>
                {(filters.fund_sources || []).map((fund) => (
                  <option key={fund}>{fund}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Prepared by</span>
              <input
                type="text"
                value={form.prepared_by ?? ""}
                onChange={(event) => set("prepared_by", event.target.value)}
              />
            </label>
          </div>

          <div className="pa-cost-preview" aria-live="polite">
            <div><span>Gross Pay</span><b><RevealableAmount value={money(gross)} /></b></div>
            <div><span>Employer Contributions</span><b><RevealableAmount value={money(contributions)} /></b></div>
            <div><span>Total Payroll Cost</span><b><RevealableAmount value={money(totalCost)} /></b></div>
            <div><span>Remaining vs Budget</span><b><RevealableAmount value={money(remaining)} /></b></div>
          </div>
          {overBudget && (
            <p className="pa-over-budget">
              Total payroll cost exceeds the allocated budget by{" "}
              <RevealableAmount value={money(totalCost - allocated)} />. The allocation can be saved for review,
              but release is blocked until the budget covers the cost.
            </p>
          )}

          <label className="pa-form-remarks">
            <span>Remarks</span>
            <textarea
              rows={3}
              value={form.remarks ?? ""}
              onChange={(event) => set("remarks", event.target.value)}
            />
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="light-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? "Saving…" : initial.id ? "Save Changes" : "Create Allocation"}
          </button>
        </div>
      </form>
    </div>
  );
}
