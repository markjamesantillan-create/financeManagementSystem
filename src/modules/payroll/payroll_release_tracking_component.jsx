import React, { useCallback, useEffect, useMemo, useState } from "react";
import RevealableAmount from "../../components/RevealableAmount";
import RevealableText from "../../components/RevealableText";
import {
  AlertTriangle,
  Banknote,
  Eye,
  FileText,
  History,
  Pencil,
  Plus,
  Printer,
  ReceiptText,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

// Status colors are text tints on a pale chip — no emoji, no status glyphs.
// Yellow Pending Release, Blue For Approval, Purple Approved, Orange
// Processing, Green Released, Teal Payment Confirmed, Sky Partially Released,
// Red Failed, Rose Cancelled, Slate Reconciled.
const STATUS_ORDER = [
  "Pending Release",
  "For Approval",
  "Approved",
  "Processing",
  "Released",
  "Partially Released",
  "Payment Confirmed",
  "Reconciled",
  "Failed",
  "Cancelled",
];

const STATUS_SLUGS = {
  "Pending Release": "pending-release",
  "For Approval": "for-approval",
  Approved: "approved",
  Processing: "processing",
  Released: "released",
  "Partially Released": "partially-released",
  "Payment Confirmed": "payment-confirmed",
  Reconciled: "reconciled",
  Failed: "failed",
  Cancelled: "cancelled",
};

const TERMINAL_STATUSES = ["Reconciled", "Failed", "Cancelled"];

const money = (value) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const display = (value) =>
  value === null || value === undefined || value === "" ? "—" : value;

const dateLabel = (value) => {
  if (!value) return "—";
  const date = new Date(`${String(value)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const todayYmd = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
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
    throw new Error(payload.message || "The payroll release request failed.");
  }
  return payload;
}

const StatusBadge = ({ status }) => (
  <span className={`prt-status ${statusSlug(status)}`}>{display(status)}</span>
);

const ReleaseProgress = ({ released = 0, net = 0 }) => {
  const width = net > 0 ? Math.max(0, Math.min(100, (Number(released) / Number(net)) * 100)) : 0;
  return (
    <div className="prt-progress" title={`${width.toFixed(width % 1 ? 1 : 0)}% released`}>
      <div className="prt-progress-track" aria-hidden="true">
        <span style={{ width: `${width}%` }} />
      </div>
      <b>{`${width.toFixed(width % 1 ? 1 : 0)}%`}</b>
    </div>
  );
};

export default function PayrollReleaseTrackingPage({ onAudit = () => {}, navigate }) {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ statuses: [], departments: [], funding_sources: [], payment_methods: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [fundFilter, setFundFilter] = useState("All Funds");
  const [methodFilter, setMethodFilter] = useState("All Methods");

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [releaseModal, setReleaseModal] = useState(null);
  const [releaseAmount, setReleaseAmount] = useState("");
  const [releaseReference, setReleaseReference] = useState("");
  const [verifyModal, setVerifyModal] = useState(null);
  const [verifyForm, setVerifyForm] = useState({ verified_by: "", verification_date: todayYmd(), supporting_document: "" });
  const [stopModal, setStopModal] = useState(null);
  const [stopAction, setStopAction] = useState("fail");
  const [stopReason, setStopReason] = useState("");
  const [receipt, setReceipt] = useState(null);
  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const payload = await request("/api/payroll/releases");
      setRows(Array.isArray(payload.data) ? payload.data : []);
      setSummary(payload.summary || null);
      const filterPayload = await request("/api/payroll/releases/filters");
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
      if (fundFilter !== "All Funds" && row.funding_source !== fundFilter) return false;
      if (methodFilter !== "All Methods" && row.payment_method !== methodFilter) return false;
      if (!query) return true;
      return [
        row.release_id, row.payroll_period, row.department, row.funding_source,
        row.payment_method, row.reference_no, row.released_by, row.verified_by,
        row.status, row.remarks,
      ].some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [rows, search, statusFilter, departmentFilter, fundFilter, methodFilter]);

  // Any mutation re-reads afterwards, otherwise the cards keep the pre-action
  // figures while the table row has already changed.
  const runAction = async (action) => {
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
    setDetail({ record: row, history: [], fund: null });
    try {
      const payload = await request(`/api/payroll/releases/${row.id}`);
      setDetail({ record: payload.data, history: payload.history || [], fund: payload.fund || null });
      onAudit?.("Viewed payroll release", row.release_id);
    } catch (detailError) {
      setError(detailError.message);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // The contextual button follows next_action from the server, so the UI never
  // offers a transition the API would refuse.
  const advanceRecord = async (row) => {
    if (!row.next_action) return;
    const { action, label } = row.next_action;
    if (action === "release") {
      setReleaseModal(row);
      setReleaseAmount(String(row.unreleased_amount ?? row.net_payroll ?? ""));
      setReleaseReference(row.reference_no && row.reference_no !== "—" ? row.reference_no : "");
      return;
    }
    if (action === "verify") {
      setVerifyModal(row);
      setVerifyForm({ verified_by: "", verification_date: todayYmd(), supporting_document: "" });
      return;
    }
    const needsName =
      action === "approve" ? "Approved by" :
      action === "confirm" ? "Confirmed by" :
      action === "reconcile" ? "Reconciled by" : "Recorded by";
    const actor = window.prompt(`${label} — ${row.release_id}\n\n${needsName} (blank = Admin User):`, "");
    if (actor === null) return;
    const result = await runAction(() =>
      request(`/api/payroll/releases/${row.id}/${action}`, {
        method: "PUT",
        body: JSON.stringify({ actor: actor.trim() || "Admin User" }),
      })
    );
    if (result?.data && detail?.record?.id === row.id) openDetail(result.data);
  };
  const submitRelease = async () => {
    if (!releaseModal) return;
    const amount = Number(releaseAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert("The released amount must be greater than zero.");
      return;
    }
    const result = await runAction(() =>
      request(`/api/payroll/releases/${releaseModal.id}/release`, {
        method: "PUT",
        body: JSON.stringify({
          actor: "Admin User",
          released_amount: amount,
          reference_no: releaseReference.trim() || undefined,
        }),
      })
    );
    if (result) {
      setReleaseModal(null);
      if (detail?.record?.id === releaseModal.id) openDetail(result.data || releaseModal);
    }
  };

  const submitVerify = async () => {
    if (!verifyModal) return;
    if (!verifyForm.verified_by.trim()) {
      window.alert("Verified by is required to confirm the payment.");
      return;
    }
    const result = await runAction(() =>
      request(`/api/payroll/releases/${verifyModal.id}/verify`, {
        method: "PUT",
        body: JSON.stringify({
          actor: verifyForm.verified_by.trim(),
          verified_by: verifyForm.verified_by.trim(),
          verification_date: verifyForm.verification_date || undefined,
          supporting_document: verifyForm.supporting_document.trim() || undefined,
        }),
      })
    );
    if (result) {
      setVerifyModal(null);
      if (detail?.record?.id === verifyModal.id) openDetail(result.data || verifyModal);
    }
  };

  const submitStop = async () => {
    if (!stopModal) return;
    const reason = stopReason.trim();
    if (!reason) {
      window.alert("A reason is required — it is recorded in the release history.");
      return;
    }
    const result = await runAction(() =>
      request(`/api/payroll/releases/${stopModal.id}/${stopAction}`, {
        method: "PUT",
        body: JSON.stringify({ actor: "Admin User", remarks: reason }),
      })
    );
    if (result) {
      setStopModal(null);
      setStopReason("");
      setDetail(null);
    }
  };

  const saveRelease = async (form) => {
    const result = await runAction(() =>
      request(`/api/payroll/releases${editing?.id ? `/${editing.id}` : ""}`, {
        method: editing?.id ? "PUT" : "POST",
        body: JSON.stringify(form),
      })
    );
    if (result) {
      setEditing(null);
      if (result.data && detail?.record?.id === result.data.id) openDetail(result.data);
    }
  };
  const openPrint = (row) => {
    const popup = window.open("", "_blank");
    if (!popup) {
      setError("The print window was blocked. Allow pop-ups and try again.");
      return;
    }
    const lines = [
      ["Release ID", row.release_id],
      ["Payroll Period", row.payroll_period],
      ["Department", row.department],
      ["Employee Count", String(row.employee_count ?? 0)],
      ["Gross Payroll", money(row.gross_payroll)],
      ["Total Deductions", money(row.total_deductions)],
      ["Net Payroll", money(row.net_payroll)],
      ["Released Amount", money(row.released_amount)],
      ["Unreleased Amount", money(row.unreleased_amount)],
      ["Funding Source", row.funding_source],
      ["Release Date", dateLabel(row.release_date)],
      ["Payment Method", row.payment_method],
      ["Bank / Account", row.bank_account],
      ["Reference No.", row.reference_no],
      ["Prepared By", row.prepared_by],
      ["Approved By", row.approved_by],
      ["Released By", row.released_by],
      ["Verified By", row.verified_by],
      ["Verification Date", dateLabel(row.verification_date)],
      ["Reconciliation", row.reconciliation_status],
      ["Status", row.status],
      ["Remarks", row.remarks || "—"],
    ];
    popup.document.write(
      `<!doctype html><html><head><title>${escapeHtml(row.release_id)}</title><style>
      body{font-family:Arial,sans-serif;padding:28px;color:#1f2937}
      h1{font-size:18px;margin:0 0 4px}p{color:#64748b;margin:0 0 18px;font-size:12px}
      table{width:100%;border-collapse:collapse;font-size:13px}
      td{padding:7px 10px;border-bottom:1px solid #e5e7eb}
      td:first-child{color:#64748b;width:42%}td:last-child{text-align:right;font-weight:600}
      </style></head><body>
      <h1>Payroll Release — ${escapeHtml(row.release_id)}</h1>
      <p>Payroll Release Tracking · generated ${escapeHtml(todayYmd())}</p>
      <table>${lines.map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join("")}</table>
      <script>window.onload=()=>window.print()</script>
      </body></html>`
    );
    popup.document.close();
    onAudit?.("Printed payroll release", row.release_id);
  };

  const openReceipt = async (row) => {
    try {
      const payload = await request(`/api/payroll/releases/${row.id}`);
      setReceipt({ record: payload.data, fund: payload.fund || null });
      onAudit?.("Generated payroll release receipt", row.release_id);
    } catch (receiptError) {
      setError(receiptError.message);
    }
  };
  if (loading) {
    return (
      <div className="module-page">
        <div className="page-header">
          <div>
            <h2>Payroll Release Tracking</h2>
            <p>Track payroll from approved payroll to fund release, employee payment and reconciliation.</p>
          </div>
        </div>
        <p className="cm-empty-note">Loading payroll releases…</p>
      </div>
    );
  }

  const cardData = [
    ["Total Payroll Releases", Number(summary?.total_releases ?? 0).toLocaleString("en-PH"), `${summary?.total_employees ?? 0} employees`],
    ["Pending Release Amount", money(summary?.pending_amount ?? summary?.pending_releases), `${summary?.pending_count ?? 0} awaiting release`, true],
    ["Released Amount", money(summary?.released_amount ?? summary?.released_this_period), `${summary?.released_count ?? 0} releases paid out`, true],
    ["For Verification", money(summary?.verification_amount), `${summary?.verification_count ?? 0} awaiting finance verification`, true],
    ["Failed / Returned Amount", money(summary?.failed_amount), `${summary?.failed_count ?? 0} failed releases`, true],
    ["Reconciled Amount", money(summary?.reconciled_amount), `${summary?.reconciled_count ?? 0} reconciled`, true],
  ];

  const processSteps = [
    "Payroll Prepared", "Payroll Reviewed", "Payroll Approved",
    "Funds Allocated", "Release Processing", "Payment Released",
    "Employee/Bank Confirmation", "Finance Verification", "Reconciled",
  ];

  return (
    <div className="module-page">
      <div className="page-header">
        <div>
          <h2>Payroll Release Tracking</h2>
          <p>Track payroll from approved payroll to fund release, employee payment and reconciliation.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="light-button" onClick={() => load(true)} disabled={refreshing}>
            Refresh{refreshing ? "…" : ""}
          </button>
          <button type="button" className="primary-button" onClick={() => setEditing({})}>
            <Plus size={14} /> New Release
          </button>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="vendor-summary-grid prt-summary-grid">
        {cardData.map(([label, value, note, isAmount]) => (
          <div className="vendor-summary-card" key={label}>
            <span className="vendor-summary-label">{label}</span>
            {isAmount ? (
              <RevealableAmount value={value} className="vendor-summary-value prt-summary-amount" />
            ) : <strong className="vendor-summary-value">{value}</strong>}
            <span className="vendor-summary-count">{note}</span>
          </div>
        ))}
      </div>

      <section className="prt-flow" aria-label="Payroll release process">
        {processSteps.map((step, index) => (
          <React.Fragment key={step}>
            <div className="prt-flow-step">
              <span className="prt-flow-index">{index + 1}</span>
              <span>{step}</span>
            </div>
            {index < processSteps.length - 1 && <span className="prt-flow-arrow" aria-hidden="true">→</span>}
          </React.Fragment>
        ))}
      </section>
      <section className="pa-legend" aria-label="Release status filters">
        {STATUS_ORDER.map((status) => (
          <button
            type="button"
            key={status}
            className={`pa-legend-chip prt-legend-chip ${statusSlug(status)} ${statusFilter === status ? "selected" : ""}`}
            onClick={() => setStatusFilter((current) => (current === status ? "All Statuses" : status))}
            aria-pressed={statusFilter === status}
          >
            <span>{status}</span>
            <b>{summary?.status_counts?.[status] ?? 0}</b>
          </button>
        ))}
        {statusFilter !== "All Statuses" && (
          <button type="button" className="pa-clear-filter" onClick={() => setStatusFilter("All Statuses")}>
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
            placeholder="Search release ID, period, department, reference…"
          />
        </label>
        <label>
          <span>Department</span>
          <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
            <option>All Departments</option>
            {(filters.departments || []).map((dept) => <option key={dept}>{dept}</option>)}
          </select>
        </label>
        <label>
          <span>Funding Source</span>
          <select value={fundFilter} onChange={(event) => setFundFilter(event.target.value)}>
            <option>All Funds</option>
            {(filters.funding_sources || []).map((fund) => <option key={fund}>{fund}</option>)}
          </select>
        </label>
        <label>
          <span>Payment Method</span>
          <select value={methodFilter} onChange={(event) => setMethodFilter(event.target.value)}>
            <option>All Methods</option>
            {(filters.payment_methods || []).map((method) => <option key={method}>{method}</option>)}
          </select>
        </label>
      </div>
      <section className="cm-record-panel">
        <div className="cm-section-heading">
          <div>
            <h3>Release Register ({visibleRows.length})</h3>
            <p>Every figure below is recalculated from the live database on refresh.</p>
          </div>
        </div>
        <div className="table-card cm-table-card prt-table-card">
          <table>
            <thead>
              <tr>
                <th>Release ID</th>
                <th>Payroll Period</th>
                <th>Department</th>
                <th>Employees</th>
                <th>Gross Payroll</th>
                <th>Deductions</th>
                <th>Net Payroll</th>
                <th>Funding Source</th>
                <th>Release Date</th>
                <th>Reference No.</th>
                <th>Released By / Verified By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length ? (
                visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td className="link-cell">
                      {row.release_id}
                      <small>{row.payment_method}</small>
                    </td>
                    <td>{row.payroll_period}</td>
                    <td>{row.department}</td>
                    <td className="prt-number-cell">{Number(row.employee_count || 0).toLocaleString("en-PH")}</td>
                    <td className="money-cell"><RevealableAmount value={money(row.gross_payroll)} /></td>
                    <td className="money-cell"><RevealableAmount value={money(row.total_deductions)} /></td>
                    <td className="money-cell">
                      <RevealableAmount value={money(row.net_payroll)} />
                      <ReleaseProgress released={row.released_amount} net={row.net_payroll} />
                    </td>
                    <td>{row.funding_source}</td>
                    <td>{dateLabel(row.release_date)}</td>
                    <td>{display(row.reference_no)}</td>
                    <td>
                      <RevealableText value={display(row.released_by)} />
                      <small>{row.verified_by && row.verified_by !== "—" ? <>Verified: <RevealableText value={row.verified_by} /></> : "Not verified"}</small>
                    </td>
                    <td><StatusBadge status={row.status} /></td>
                    <td>
                      <div className="pa-row-actions">
                        <button type="button" className="pa-icon-btn" title="View release details" onClick={() => openDetail(row)} disabled={detailLoading}>
                          <Eye size={14} />
                        </button>
                        {!row.terminal && (
                          <button type="button" className="pa-icon-btn" title="Edit release" onClick={() => setEditing({ ...row })} disabled={saving}>
                            <Pencil size={14} />
                          </button>
                        )}
                        {row.next_action && (
                          <button
                            type="button"
                            className={`pa-workflow-btn prt-workflow-btn ${statusSlug(row.status)}`}
                            onClick={() => advanceRecord(row)}
                            disabled={saving}
                          >
                            {row.next_action.label}
                          </button>
                        )}
                        {row.can_fail && (
                          <button
                            type="button"
                            className="pa-reject-btn"
                            title="Mark the release failed"
                            onClick={() => { setStopModal(row); setStopAction("fail"); setStopReason(""); }}
                            disabled={saving}
                          >
                            Fail
                          </button>
                        )}
                        {row.can_cancel && (
                          <button
                            type="button"
                            className="light-button prt-cancel-btn"
                            title="Cancel the release"
                            onClick={() => { setStopModal(row); setStopAction("cancel"); setStopReason(""); }}
                            disabled={saving}
                          >
                            Cancel
                          </button>
                        )}
                        <button type="button" className="pa-icon-btn" title="Payroll release receipt" onClick={() => openReceipt(row)}>
                          <ReceiptText size={14} />
                        </button>
                        <button type="button" className="pa-icon-btn" title="Print release" onClick={() => openPrint(row)}>
                          <Printer size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={13} className="cm-empty-cell">No payroll releases match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {detail && (
        <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) setDetail(null); }}>
          <div className="modal pa-detail-modal prt-detail-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <h2>{detail.record.release_id} — {detail.record.department}</h2>
                <p>{detail.record.payroll_period} · Net <RevealableAmount value={money(detail.record.net_payroll)} /> · {detail.record.funding_source}</p>
              </div>
              <button type="button" className="tax-icon-btn" onClick={() => setDetail(null)} aria-label="Close">
                <X size={15} />
              </button>
            </div>
            <div className="modal-body">
              <div className={`cm-detail-hero ${statusSlug(detail.record.status)}`}>
                <div>
                  <span>Status</span>
                  <strong><StatusBadge status={detail.record.status} /></strong>
                </div>
                <div>
                  <span>Net Payroll</span>
                  <strong><RevealableAmount value={money(detail.record.net_payroll)} /></strong>
                </div>
                <div>
                  <span>Released</span>
                  <strong><RevealableAmount value={money(detail.record.released_amount)} /></strong>
                </div>
                <div>
                  <span>Unreleased</span>
                  <strong><RevealableAmount value={money(detail.record.unreleased_amount)} /></strong>
                </div>
                <div>
                  <span>Reconciliation</span>
                  <strong>{detail.record.reconciliation_status}</strong>
                </div>
              </div>

              <section className="cm-detail-section">
                <h3>Payroll Information</h3>
                <dl className="cm-detail-grid">
                  <div><dt>Payroll Period</dt><dd>{detail.record.payroll_period}</dd></div>
                  <div><dt>Period Start</dt><dd>{dateLabel(detail.record.period_start)}</dd></div>
                  <div><dt>Period End</dt><dd>{dateLabel(detail.record.period_end)}</dd></div>
                  <div><dt>Department</dt><dd>{detail.record.department}</dd></div>
                  <div><dt>Employee Count</dt><dd>{Number(detail.record.employee_count || 0).toLocaleString("en-PH")}</dd></div>
                  <div><dt>Gross Payroll</dt><dd><RevealableAmount value={money(detail.record.gross_payroll)} /></dd></div>
                  <div><dt>Total Deductions</dt><dd><RevealableAmount value={money(detail.record.total_deductions)} /></dd></div>
                  <div><dt>Net Payroll</dt><dd><RevealableAmount value={money(detail.record.net_payroll)} /></dd></div>
                </dl>
              </section>

              <section className="cm-detail-section">
                <h3>Fund Information</h3>
                <dl className="cm-detail-grid">
                  <div><dt>Fund Source</dt><dd>{detail.record.funding_source}</dd></div>
                  <div><dt>Available Fund Balance</dt><dd><RevealableAmount value={detail.fund ? money(detail.fund.fund_balance) : money(0)} /></dd></div>
                  <div><dt>Allocated Amount</dt><dd><RevealableAmount value={detail.fund ? money(detail.fund.allocated_amount) : money(0)} /></dd></div>
                  <div><dt>Remaining Balance</dt><dd><RevealableAmount value={detail.fund ? money(detail.fund.remaining_balance) : money(0)} /></dd></div>
                  <div><dt>Released Amount</dt><dd><RevealableAmount value={money(detail.record.released_amount)} /></dd></div>
                  <div><dt>Unreleased Amount</dt><dd><RevealableAmount value={money(detail.record.unreleased_amount)} /></dd></div>
                </dl>
                {!detail.fund && detailLoading && <p className="cm-empty-note">Loading fund context…</p>}
              </section>

              <section className="cm-detail-section">
                <h3>Release Information</h3>
                <dl className="cm-detail-grid">
                  <div><dt>Release Date</dt><dd>{dateLabel(detail.record.release_date)}</dd></div>
                  <div><dt>Payment Method</dt><dd>{detail.record.payment_method}</dd></div>
                  <div><dt>Bank / Account</dt><dd>{detail.record.bank_account}</dd></div>
                  <div><dt>Transaction Reference</dt><dd>{detail.record.reference_no}</dd></div>
                  <div><dt>Released By</dt><dd>{detail.record.released_by}</dd></div>
                  <div><dt>Approved By</dt><dd>{detail.record.approved_by}</dd></div>
                  <div><dt>Prepared By</dt><dd>{detail.record.prepared_by}</dd></div>
                  <div><dt>Last Updated</dt><dd>{dateLabel(detail.record.updated_at)}</dd></div>
                  <div className="full"><dt>Remarks</dt><dd>{detail.record.remarks || "—"}</dd></div>
                </dl>
              </section>

              <section className="cm-detail-section">
                <h3>Verification</h3>
                <dl className="cm-detail-grid">
                  <div><dt>Payment Confirmation</dt><dd>{detail.record.payment_confirmation}</dd></div>
                  <div><dt>Supporting Document</dt><dd>{detail.record.supporting_document}</dd></div>
                  <div><dt>Verification Date</dt><dd>{dateLabel(detail.record.verification_date)}</dd></div>
                  <div><dt>Verified By</dt><dd>{detail.record.verified_by}</dd></div>
                  <div><dt>Reconciliation Status</dt><dd>{detail.record.reconciliation_status}</dd></div>
                </dl>
              </section>
              <section className="cm-detail-section">
                <h3>Release Timeline</h3>
                <ol className="prt-timeline">
                  {(detail.record.timeline || []).map((entry) => (
                    <li key={entry.step} className={`prt-timeline-item ${entry.state}`}>
                      <span className="prt-timeline-dot" aria-hidden="true" />
                      <div>
                        <strong>{entry.step}</strong>
                        <small>
                          {entry.state === "done" ? "Completed" :
                           entry.state === "current" ? "Current step" :
                           entry.state === "failed" ? "Stopped — failed" :
                           entry.state === "cancelled" ? "Stopped — cancelled" : "Upcoming"}
                        </small>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="cm-detail-section">
                <h3>Release History ({detail.history.length})</h3>
                {detail.history.length ? (
                  <ul className="pa-history-list">
                    {detail.history.map((entry, index) => (
                      <li key={`${entry.action}-${index}`}>
                        <strong>{entry.action}</strong>
                        <span>
                          {entry.old_status ? `${entry.old_status} → ${entry.new_status}` : `Created as ${entry.new_status}`}
                          {" · "}{entry.actor}
                          {" · "}{dateLabel(entry.created_at)}
                        </span>
                        {entry.remarks && <small>{entry.remarks}</small>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="cm-empty-note">
                    {detailLoading ? "Loading history…" : "No workflow events recorded yet. Events appear as the release moves through approval, release, verification and reconciliation."}
                  </p>
                )}
              </section>
            </div>
            <div className="modal-footer">
              {detail.record.next_action && (
                <button
                  type="button"
                  className={`pa-workflow-btn prt-workflow-btn ${statusSlug(detail.record.status)}`}
                  onClick={() => advanceRecord(detail.record)}
                  disabled={saving}
                >
                  {detail.record.next_action.label}
                </button>
              )}
              <button type="button" className="light-button" onClick={() => openReceipt(detail.record)}>
                <ReceiptText size={14} /> Receipt
              </button>
              <button type="button" className="primary-button" onClick={() => openPrint(detail.record)}>
                <Printer size={14} /> Print
              </button>
            </div>
          </div>
        </div>
      )}
      {releaseModal && (
        <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) setReleaseModal(null); }}>
          <div className="modal pa-reject-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <h2>Release Payroll</h2>
                <p>{releaseModal.release_id} · Net <RevealableAmount value={money(releaseModal.net_payroll)} /> · Unreleased <RevealableAmount value={money(releaseModal.unreleased_amount)} /></p>
              </div>
              <button type="button" className="tax-icon-btn" onClick={() => setReleaseModal(null)} aria-label="Close">
                <X size={15} />
              </button>
            </div>
            <div className="pa-reject-body">
              <p>Record the amount that left the fund. A smaller amount keeps the release Partially Released.</p>
              <label>
                <span>Released amount *</span>
                <input type="number" min="0.01" step="0.01" value={releaseAmount} onChange={(event) => setReleaseAmount(event.target.value)} />
              </label>
              <label>
                <span>Transaction reference</span>
                <input type="text" value={releaseReference} onChange={(event) => setReleaseReference(event.target.value)} placeholder="Bank or transaction reference" />
              </label>
            </div>
            <div className="modal-footer">
              <button type="button" className="light-button" onClick={() => setReleaseModal(null)}>Cancel</button>
              <button type="button" className="primary-button" onClick={submitRelease} disabled={saving}>
                <Banknote size={14} /> {saving ? "Releasing…" : "Record Release"}
              </button>
            </div>
          </div>
        </div>
      )}

      {verifyModal && (
        <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) setVerifyModal(null); }}>
          <div className="modal pa-reject-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <h2>Verify Payment</h2>
                <p>{verifyModal.release_id} · <RevealableAmount value={money(verifyModal.released_amount)} /> released</p>
              </div>
              <button type="button" className="tax-icon-btn" onClick={() => setVerifyModal(null)} aria-label="Close">
                <X size={15} />
              </button>
            </div>
            <div className="pa-reject-body">
              <p>Verification confirms the employee/bank payment against its supporting document.</p>
              <label>
                <span>Verified by *</span>
                <input type="text" value={verifyForm.verified_by} onChange={(event) => setVerifyForm((current) => ({ ...current, verified_by: event.target.value }))} />
              </label>
              <label>
                <span>Verification date</span>
                <input type="date" value={verifyForm.verification_date} onChange={(event) => setVerifyForm((current) => ({ ...current, verification_date: event.target.value }))} />
              </label>
              <label>
                <span>Supporting document</span>
                <input type="text" value={verifyForm.supporting_document} onChange={(event) => setVerifyForm((current) => ({ ...current, supporting_document: event.target.value }))} placeholder="Bank advice, payslip batch, confirmation slip…" />
              </label>
            </div>
            <div className="modal-footer">
              <button type="button" className="light-button" onClick={() => setVerifyModal(null)}>Cancel</button>
              <button type="button" className="primary-button" onClick={submitVerify} disabled={saving}>
                <ShieldCheck size={14} /> {saving ? "Verifying…" : "Verify Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {stopModal && (
        <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) { setStopModal(null); setStopReason(""); } }}>
          <div className="modal pa-reject-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <h2>{stopAction === "fail" ? "Mark Release Failed" : "Cancel Release"}</h2>
                <p>{stopModal.release_id} · {stopModal.department}</p>
              </div>
              <button type="button" className="tax-icon-btn" onClick={() => { setStopModal(null); setStopReason(""); }} aria-label="Close">
                <X size={15} />
              </button>
            </div>
            <div className="pa-reject-body">
              <p>A reason is required — it is recorded in the release history.</p>
              <label>
                <span>Reason *</span>
                <textarea rows={3} value={stopReason} onChange={(event) => setStopReason(event.target.value)} placeholder={stopAction === "fail" ? "Bank rejection, returned transfer…" : "Why is this release being cancelled?"} />
              </label>
            </div>
            <div className="modal-footer">
              <button type="button" className="light-button" onClick={() => { setStopModal(null); setStopReason(""); }}>Back</button>
              <button type="button" className="pa-reject-btn" onClick={submitStop} disabled={saving}>
                {saving ? "Saving…" : stopAction === "fail" ? "Mark Failed" : "Cancel Release"}
              </button>
            </div>
          </div>
        </div>
      )}
      {receipt && (
        <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) setReceipt(null); }}>
          <div className="modal pa-detail-modal prt-receipt-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <h2>Payroll Release Receipt</h2>
                <p>{receipt.record.release_id} · {receipt.record.payroll_period}</p>
              </div>
              <button type="button" className="tax-icon-btn" onClick={() => setReceipt(null)} aria-label="Close">
                <X size={15} />
              </button>
            </div>
            <div className="modal-body">
              <div className="prt-receipt">
                <div className="prt-receipt-head">
                  <FileText size={18} />
                  <div>
                    <strong>PAYROLL RELEASE RECEIPT</strong>
                    <span>{receipt.record.release_id} · {dateLabel(receipt.record.release_date)}</span>
                  </div>
                  <StatusBadge status={receipt.record.status} />
                </div>
                <dl className="prt-receipt-grid">
                  <div><dt>Payroll Period</dt><dd>{receipt.record.payroll_period}</dd></div>
                  <div><dt>Department</dt><dd>{receipt.record.department}</dd></div>
                  <div><dt>Employees</dt><dd>{Number(receipt.record.employee_count || 0).toLocaleString("en-PH")}</dd></div>
                  <div><dt>Funding Source</dt><dd>{receipt.record.funding_source}</dd></div>
                  <div><dt>Gross Payroll</dt><dd><RevealableAmount value={money(receipt.record.gross_payroll)} /></dd></div>
                  <div><dt>Total Deductions</dt><dd><RevealableAmount value={money(receipt.record.total_deductions)} /></dd></div>
                  <div className="prt-receipt-total"><dt>Net Payroll</dt><dd><RevealableAmount value={money(receipt.record.net_payroll)} /></dd></div>
                  <div className="prt-receipt-total"><dt>Amount Released</dt><dd><RevealableAmount value={money(receipt.record.released_amount)} /></dd></div>
                  <div><dt>Payment Method</dt><dd>{receipt.record.payment_method}</dd></div>
                  <div><dt>Bank / Account</dt><dd>{receipt.record.bank_account}</dd></div>
                  <div><dt>Reference No.</dt><dd>{receipt.record.reference_no}</dd></div>
                  <div><dt>Release Date</dt><dd>{dateLabel(receipt.record.release_date)}</dd></div>
                  <div><dt>Released By</dt><dd>{receipt.record.released_by}</dd></div>
                  <div><dt>Approved By</dt><dd>{receipt.record.approved_by}</dd></div>
                  <div><dt>Verified By</dt><dd>{receipt.record.verified_by}</dd></div>
                  <div><dt>Reconciliation</dt><dd>{receipt.record.reconciliation_status}</dd></div>
                </dl>
                <div className="prt-receipt-sign">
                  <div><span>Released by</span><b>{receipt.record.released_by}</b></div>
                  <div><span>Verified by</span><b>{receipt.record.verified_by}</b></div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="light-button" onClick={() => setReceipt(null)}>Close</button>
              <button type="button" className="primary-button" onClick={() => openPrint(receipt.record)}>
                <Printer size={14} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <ReleaseFormModal
          initial={editing}
          filters={filters}
          saving={saving}
          onClose={() => setEditing(null)}
          onSubmit={saveRelease}
        />
      )}
    </div>
  );
}
function ReleaseFormModal({ initial, filters, saving, onClose, onSubmit }) {
  const [form, setFormState] = useState(() => ({
    payroll_period: initial.payroll_period && initial.payroll_period !== "—" ? initial.payroll_period : "",
    period_start: initial.period_start || "",
    period_end: initial.period_end || "",
    department: initial.department && initial.department !== "—" ? initial.department : "",
    employee_count: initial.employee_count ?? "",
    gross_payroll: initial.gross_payroll ?? "",
    total_deductions: initial.total_deductions ?? "",
    funding_source: initial.funding_source && initial.funding_source !== "—" ? initial.funding_source : "Payroll Fund",
    release_date: initial.release_date || "",
    payment_method: initial.payment_method && initial.payment_method !== "—" ? initial.payment_method : "",
    bank_account: initial.bank_account && initial.bank_account !== "—" ? initial.bank_account : "",
    reference_no: initial.reference_no && initial.reference_no !== "—" ? initial.reference_no : "",
    released_by: initial.released_by && initial.released_by !== "—" ? initial.released_by : "",
    approved_by: initial.approved_by && initial.approved_by !== "—" ? initial.approved_by : "",
    prepared_by: initial.prepared_by && initial.prepared_by !== "—" ? initial.prepared_by : "",
    remarks: initial.remarks || "",
  }));

  const set = (key, value) => setFormState((current) => ({ ...current, [key]: value }));

  const gross = Number(form.gross_payroll || 0);
  const deductions = Number(form.total_deductions || 0);
  const net = Math.max(gross - deductions, 0);
  const overDeducted = deductions > gross;

  return (
    <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form
        className="modal pa-form-modal"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <div className="modal-header">
          <div>
            <h2>{initial.id ? `Update ${initial.release_id}` : "New Payroll Release"}</h2>
            <p>
              {initial.id
                ? "Reconciled, failed and cancelled releases can no longer be edited."
                : "New releases always start as Pending Release and enter the approval workflow."}
            </p>
          </div>
          <button type="button" className="tax-icon-btn" onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>
        <div className="pa-form-body">
          <div className="pa-form-grid">
            <label>
              <span>Payroll period *</span>
              <input type="text" required value={form.payroll_period} onChange={(event) => set("payroll_period", event.target.value)} placeholder="September 16–30, 2026" />
            </label>
            <label>
              <span>Period start</span>
              <input type="date" value={form.period_start} onChange={(event) => set("period_start", event.target.value)} />
            </label>
            <label>
              <span>Period end</span>
              <input type="date" value={form.period_end} onChange={(event) => set("period_end", event.target.value)} />
            </label>
            <label>
              <span>Department *</span>
              <select required value={form.department} onChange={(event) => set("department", event.target.value)}>
                <option value="">Select department…</option>
                {(filters.departments || []).map((dept) => <option key={dept}>{dept}</option>)}
              </select>
            </label>
            <label>
              <span>Employee count *</span>
              <input type="number" required min="0" step="1" value={form.employee_count} onChange={(event) => set("employee_count", event.target.value)} />
            </label>
            <label>
              <span>Gross payroll *</span>
              <input type="number" required min="0" step="0.01" value={form.gross_payroll} onChange={(event) => set("gross_payroll", event.target.value)} />
            </label>
            <label>
              <span>Total deductions</span>
              <input type="number" min="0" step="0.01" value={form.total_deductions} onChange={(event) => set("total_deductions", event.target.value)} />
            </label>
            <label>
              <span>Funding source *</span>
              <select required value={form.funding_source} onChange={(event) => set("funding_source", event.target.value)}>
                <option value="">Select fund source…</option>
                {(filters.funding_sources || []).map((fund) => <option key={fund}>{fund}</option>)}
              </select>
            </label>
            <label>
              <span>Release date</span>
              <input type="date" value={form.release_date} onChange={(event) => set("release_date", event.target.value)} />
            </label>
            <label>
              <span>Payment method</span>
              <select value={form.payment_method} onChange={(event) => set("payment_method", event.target.value)}>
                <option value="">Select method…</option>
                {(filters.payment_methods || []).map((method) => <option key={method}>{method}</option>)}
              </select>
            </label>
            <label>
              <span>Bank / account</span>
              <input type="text" value={form.bank_account} onChange={(event) => set("bank_account", event.target.value)} />
            </label>
            <label>
              <span>Reference no.</span>
              <input type="text" value={form.reference_no} onChange={(event) => set("reference_no", event.target.value)} />
            </label>
            <label>
              <span>Released by</span>
              <input type="text" value={form.released_by} onChange={(event) => set("released_by", event.target.value)} />
            </label>
            <label>
              <span>Approved by</span>
              <input type="text" value={form.approved_by} onChange={(event) => set("approved_by", event.target.value)} />
            </label>
            <label>
              <span>Prepared by</span>
              <input type="text" value={form.prepared_by} onChange={(event) => set("prepared_by", event.target.value)} />
            </label>
          </div>

          <div className="pa-cost-preview" aria-live="polite">
            <div><span>Gross Payroll</span><b><RevealableAmount value={money(gross)} /></b></div>
            <div><span>Total Deductions</span><b><RevealableAmount value={money(deductions)} /></b></div>
            <div><span>Net Payroll</span><b><RevealableAmount value={money(net)} /></b></div>
            <div><span>Employees</span><b>{Number(form.employee_count || 0).toLocaleString("en-PH")}</b></div>
          </div>
          {overDeducted && (
            <p className="pa-over-budget">
              Total deductions exceed gross payroll. The release can be saved for
              review, but the server rejects it until deductions fit inside gross.
            </p>
          )}

          <label className="pa-form-remarks">
            <span>Remarks</span>
            <textarea rows={3} value={form.remarks} onChange={(event) => set("remarks", event.target.value)} />
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="light-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? "Saving…" : initial.id ? "Save Changes" : "Create Release"}
          </button>
        </div>
      </form>
    </div>
  );
}
/*__C13__*/











