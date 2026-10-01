import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Clock3,
  Eye,
  HandCoins,
  Printer,
  ReceiptText,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

const STATUS_ORDER = [
  "Collected",
  "Partially Collected",
  "Pending",
  "Overdue",
  "Cancelled",
];

const STATUS_DESCRIPTIONS = {
  Collected: "Full amount received.",
  "Partially Collected": "Some payment received; balance remains.",
  Pending: "Collection has not yet been received.",
  Overdue: "Due date has passed and a balance remains.",
  Cancelled: "Collection was cancelled.",
};

const money = (value) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

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
    headers: { Accept: "application/json", ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "The collection monitoring request failed.");
  }
  return payload;
}

const StatusBadge = ({ status }) => (
  <span className={`cm-status ${statusSlug(status)}`}>
    {display(status)}
  </span>
);

const CollectionProgress = ({ value = 0, compact = false }) => {
  const progress = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className={`cm-progress ${compact ? "compact" : ""}`}>
      <div className="cm-progress-track" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <b>{Number(progress).toFixed(progress % 1 ? 2 : 0)}%</b>
    </div>
  );
};

const MonitoringAmount = ({ id, value, label, revealed, onToggle, className = "" }) => {
  const isRevealed = Boolean(revealed[id]);
  return (
    <button
      type="button"
      className={`cm-table-amount ${className}`.trim()}
      onClick={(event) => {
        event.stopPropagation();
        onToggle(id);
      }}
      aria-label={`${isRevealed ? "Hide" : "Reveal"} ${label}`}
      aria-pressed={isRevealed}
      title={isRevealed ? "Click to hide amount" : "Click to reveal amount"}
    >
      {isRevealed ? money(value) : "*"}
    </button>
  );
};

const Breadcrumb = () => (
  <div className="breadcrumb">
    <span>Collection Management</span>
    <span> / </span>
    <strong>Collection Monitoring</strong>
  </div>
);

function CollectionMonitoringPage({ onAudit, navigate }) {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [revealedAmounts, setRevealedAmounts] = useState({});
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const payload = await request("/api/collection-monitoring");
      setRecords(Array.isArray(payload.data) ? payload.data : []);
      setSummary(payload.summary || null);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      if (statusFilter !== "All Statuses" && record.status !== statusFilter) {
        return false;
      }
      if (!query) return true;
      return [
        record.collection_id,
        record.client_name,
        record.invoice_no,
        record.contract_no,
        record.collector,
        record.collection_method,
        record.follow_up_status,
        record.remarks,
      ].some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [records, search, statusFilter]);

  const statusCount = (status) =>
    records.filter((record) => record.status === status).length;

  const toggleAmount = (id) =>
    setRevealedAmounts((current) => ({ ...current, [id]: !current[id] }));

  const rowAmount = (record, field, value, label, className = "") => (
    <MonitoringAmount
      id={`${record.collection_id}-${field}`}
      value={value}
      label={`${label} for ${record.collection_id}`}
      revealed={revealedAmounts}
      onToggle={toggleAmount}
      className={className}
    />
  );

  const openDetail = async (record) => {
    setDetailLoading(true);
    setDetail({ collection: record, payments: [] });
    try {
      const payload = await request(`/api/collection-monitoring/${record.id}`);
      setDetail(payload.data);
      onAudit?.("Viewed collection monitoring record", record.collection_id);
    } catch (detailError) {
      setError(detailError.message);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const printRecord = (record) => {
    const popup = window.open("", "_blank");
    if (!popup) {
      setError("The print window was blocked. Allow pop-ups and try again.");
      return;
    }
    const fields = [
      ["Collection ID", record.collection_id],
      ["Client", record.client_name],
      ["Invoice No.", record.invoice_no],
      ["Contract No.", record.contract_no],
      ["Amount Due", money(record.amount_due)],
      ["Amount Collected", money(record.amount_collected)],
      ["Remaining Balance", money(record.remaining_balance)],
      ["Due Date", dateLabel(record.due_date)],
      ["Collection Date", dateLabel(record.collection_date)],
      ["Collector", record.collector],
      ["Collection Method", record.collection_method],
      ["Follow-up Status", record.follow_up_status],
      ["Last Follow-up", dateLabel(record.last_follow_up)],
      ["Next Follow-up", dateLabel(record.next_follow_up)],
      ["Collection Status", record.status],
      ["Collection Rate", `${record.progress_percent}%`],
      ["Remarks", record.remarks],
    ];
    const rows = fields.map(([label, value]) =>
      `<tr><th style="text-align:left;padding:8px;border:1px solid #ccdde8">${escapeHtml(label)}</th>` +
      `<td style="padding:8px;border:1px solid #ccdde8">${escapeHtml(value)}</td></tr>`
    ).join("");
    popup.document.write(`<!doctype html><html><head><title>${escapeHtml(record.collection_id)}</title></head>
      <body style="font-family:Arial,sans-serif;padding:36px;color:#203b4d">
      <h1 style="color:#0b6f99">PRIMEPOWER</h1><h2>Collection Monitoring</h2>
      <p>Generated: ${new Date().toLocaleString()}</p><hr />
      <table style="width:100%;border-collapse:collapse">${rows}</table>
      <script>window.print();</script></body></html>`);
    popup.document.close();
    onAudit?.("Printed collection monitoring record", record.collection_id);
  };

  if (loading) {
    return (
      <section className="management-page collection-monitoring-page">
        <div className="contract-alert">
          <Clock3 size={17} /> Loading collection monitoring…
        </div>
      </section>
    );
  }

  return (
    <section className="management-page collection-monitoring-page">
      <Breadcrumb />
      <div className="management-header">
        <div>
          <h2>Collection Monitoring</h2>
          <p>
            Live collection progress from service invoices, verified payments,
            collection schedules, client assignments, follow-up dates and official
            receipts. Only verified payments reduce an invoice balance.
          </p>
        </div>
        <div className="management-actions">
          <button type="button" className="light-button" onClick={() => window.print()}>
            <Printer size={15} /> Print
          </button>
          <button type="button" className="light-button" onClick={() => loadData(true)} disabled={refreshing}>
            <RotateCcw size={15} /> {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <button type="button" className="light-button" onClick={() => navigate?.("Collection Scheduling")}>
            <HandCoins size={15} /> Collection Scheduling
          </button>
          <button type="button" className="primary-button" onClick={() => navigate?.("Payment Recording")}>
            <ReceiptText size={15} /> Record Payment
          </button>
        </div>
      </div>

      {error && (
        <div className="contract-alert cm-error" role="alert">
          <AlertTriangle size={17} /><span>{error}</span>
          <button type="button" className="light-button" onClick={() => loadData(true)}>Retry</button>
        </div>
      )}

      <div className="cm-summary-grid">
        <div className="cm-summary-card total">
          <span>Total Collections</span>
          <button
            type="button"
            className={`cm-summary-value cm-amount-reveal ${revealedAmounts.total ? "is-revealed" : "is-hidden"}`}
            onClick={() => setRevealedAmounts((current) => ({ ...current, total: !current.total }))}
            aria-label={revealedAmounts.total ? "Hide total collections amount" : "Reveal total collections amount"}
            aria-pressed={Boolean(revealedAmounts.total)}
            title={revealedAmounts.total ? "Click to hide amount" : "Click to reveal amount"}
          >
            <span aria-hidden="true">{revealedAmounts.total ? money(summary?.total_collections) : "*"}</span>
          </button>
          <small>{summary?.total_count || 0} database invoice records</small>
        </div>
        <div className="cm-summary-card collected">
          <span>Collected</span>
          <button
            type="button"
            className={`cm-summary-value cm-amount-reveal ${revealedAmounts.collected ? "is-revealed" : "is-hidden"}`}
            onClick={() => setRevealedAmounts((current) => ({ ...current, collected: !current.collected }))}
            aria-label={revealedAmounts.collected ? "Hide collected amount" : "Reveal collected amount"}
            aria-pressed={Boolean(revealedAmounts.collected)}
            title={revealedAmounts.collected ? "Click to hide amount" : "Click to reveal amount"}
          >
            <span aria-hidden="true">{revealedAmounts.collected ? money(summary?.collected_amount) : "*"}</span>
          </button>
          <small>Verified payments received</small>
        </div>
        <div className="cm-summary-card pending">
          <span>Pending</span>
          <button
            type="button"
            className={`cm-summary-value cm-amount-reveal ${revealedAmounts.pending ? "is-revealed" : "is-hidden"}`}
            onClick={() => setRevealedAmounts((current) => ({ ...current, pending: !current.pending }))}
            aria-label={revealedAmounts.pending ? "Hide pending amount" : "Reveal pending amount"}
            aria-pressed={Boolean(revealedAmounts.pending)}
            title={revealedAmounts.pending ? "Click to hide amount" : "Click to reveal amount"}
          >
            <span aria-hidden="true">{revealedAmounts.pending ? money(summary?.pending_amount) : "*"}</span>
          </button>
          <small>Outstanding, not yet due</small>
        </div>
        <div className="cm-summary-card overdue">
          <span>Overdue</span>
          <button
            type="button"
            className={`cm-summary-value cm-amount-reveal ${revealedAmounts.overdue ? "is-revealed" : "is-hidden"}`}
            onClick={() => setRevealedAmounts((current) => ({ ...current, overdue: !current.overdue }))}
            aria-label={revealedAmounts.overdue ? "Hide overdue amount" : "Reveal overdue amount"}
            aria-pressed={Boolean(revealedAmounts.overdue)}
            title={revealedAmounts.overdue ? "Click to hide amount" : "Click to reveal amount"}
          >
            <span aria-hidden="true">{revealedAmounts.overdue ? money(summary?.overdue_amount) : "*"}</span>
          </button>
          <small>Outstanding past due date</small>
        </div>
        <div className="cm-summary-card rate">
          <span>Collection Rate</span>
          <strong>{Number(summary?.collection_rate || 0).toFixed(2)}%</strong>
          <small>Amounts hidden until clicked</small>
        </div>
      </div>

      <div className="cm-overview">
        <div className="cm-overview-heading">
          <div><h3>Overall Collection Progress</h3><p>As of {dateLabel(summary?.as_of)}</p></div>
          <strong>{Number(summary?.collection_rate || 0).toFixed(2)}%</strong>
        </div>
        <CollectionProgress value={summary?.collection_rate} />
      </div>

      <section className="cm-status-legend" aria-label="Collection status filters">
        {STATUS_ORDER.map((status) => (
          <button
            type="button"
            key={status}
            className={`cm-status-filter ${statusSlug(status)} ${statusFilter === status ? "selected" : ""}`}
            onClick={() => setStatusFilter((current) => current === status ? "All Statuses" : status)}
            title={STATUS_DESCRIPTIONS[status]}
          >
            <span>{status}</span><b>{statusCount(status)}</b>
          </button>
        ))}
        {statusFilter !== "All Statuses" && (
          <button type="button" className="cm-clear-filter" onClick={() => setStatusFilter("All Statuses")}>Clear filter</button>
        )}
      </section>

      <div className="cm-toolbar">
        <label className="cm-search">
          <Search size={14} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search collection, client, invoice, collector..." />
        </label>
        <label>
          <span>Collection Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>All Statuses</option>
            {STATUS_ORDER.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
      </div>
      <section className="cm-record-panel">
        <div className="cm-section-heading">
          <div>
            <h3>Collection Records ({filteredRecords.length})</h3>
            <p>Amounts and statuses are recalculated from the live database.</p>
          </div>
        </div>
        <div className="table-card cm-table-card">
          <table>
            <thead>
              <tr>
                <th>Collection ID</th><th>Client / Invoice</th><th>Amount Due</th>
                <th>Collected / Progress</th><th>Remaining Balance</th>
                <th>Due / Collection Date</th><th>Collector / Method</th>
                <th>Follow-up</th><th>Collection Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length ? filteredRecords.map((record) => (
                <tr key={record.collection_id}>
                  <td className="link-cell">{record.collection_id}</td>
                  <td className="strong-cell">
                    {record.client_name}<small>{record.invoice_no} · {record.contract_no}</small>
                  </td>
                  <td className="money-cell">
                    {rowAmount(record, "amount-due", record.amount_due, "amount due", "cm-amount-due")}
                  </td>
                  <td>
                    {rowAmount(record, "amount-collected", record.amount_collected, "amount collected", "cm-amount-collected")}
                    <CollectionProgress value={record.progress_percent} compact />
                  </td>
                  <td className="money-cell">
                    {rowAmount(record, "remaining-balance", record.remaining_balance, "remaining balance", "cm-remaining")}
                  </td>
                  <td>
                    Due: {dateLabel(record.due_date)}
                    <small>Collected: {dateLabel(record.collection_date)}</small>
                  </td>
                  <td>{record.collector}<small>{record.collection_method}</small></td>
                  <td>
                    {record.follow_up_status}
                    <small>Last: {dateLabel(record.last_follow_up)} · Next: {dateLabel(record.next_follow_up)}</small>
                  </td>
                  <td><StatusBadge status={record.status} /></td>
                  <td>
                    <button
                      type="button"
                      className="cm-view-button"
                      onClick={() => openDetail(record)}
                      disabled={detailLoading}
                      title="View collection details"
                    >
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={10} className="empty">No collection records match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {detail && (
        <div className="modal-overlay" onClick={() => !detailLoading && setDetail(null)}>
          <div className="modal cm-detail-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div><h2>Collection Monitoring Details</h2><p>{detail.collection.collection_id}</p></div>
              <button type="button" onClick={() => setDetail(null)} aria-label="Close"><X size={15} /></button>
            </div>
            <div className="cm-detail-body">
              <div className={`cm-detail-hero ${statusSlug(detail.collection.status)}`}>
                <div><span>Client</span><strong>{detail.collection.client_name}</strong><small>{detail.collection.invoice_no}</small></div>
                <div><span>Collection Status</span><StatusBadge status={detail.collection.status} /><small>{detail.collection.status_description}</small></div>
                <div><span>Amount Due</span><strong>{money(detail.collection.amount_due)}</strong></div>
                <div><span>Amount Collected</span><strong>{money(detail.collection.amount_collected)}</strong></div>
                <div><span>Remaining Balance</span><strong>{money(detail.collection.remaining_balance)}</strong></div>
                <div>
                  <span>Collection Progress</span><strong>{detail.collection.progress_percent}%</strong>
                  <CollectionProgress value={detail.collection.progress_percent} compact />
                </div>
              </div>
              <section className="cm-detail-section">
                <h3>Collection Information</h3>
                <dl className="cm-detail-grid">
                  <div><dt>Collection ID</dt><dd>{detail.collection.collection_id}</dd></div>
                  <div><dt>Client ID</dt><dd>{detail.collection.client_id}</dd></div>
                  <div><dt>Invoice No.</dt><dd>{detail.collection.invoice_no}</dd></div>
                  <div><dt>Contract No.</dt><dd>{detail.collection.contract_no}</dd></div>
                  <div><dt>Due Date</dt><dd>{dateLabel(detail.collection.due_date)}</dd></div>
                  <div><dt>Collection Date</dt><dd>{dateLabel(detail.collection.collection_date)}</dd></div>
                  <div><dt>Collector</dt><dd>{detail.collection.collector}</dd></div>
                  <div><dt>Collection Method</dt><dd>{detail.collection.collection_method}</dd></div>
                  <div><dt>Follow-up Status</dt><dd>{detail.collection.follow_up_status}</dd></div>
                  <div><dt>Last Follow-up</dt><dd>{dateLabel(detail.collection.last_follow_up)}</dd></div>
                  <div><dt>Next Follow-up</dt><dd>{dateLabel(detail.collection.next_follow_up)}</dd></div>
                  <div><dt>Official Receipt</dt><dd>{detail.collection.receipt?.receipt_number || "Not generated"}</dd></div>
                  <div className="full"><dt>Remarks</dt><dd>{detail.collection.remarks}</dd></div>
                </dl>
              </section>
              <section className="cm-detail-section">
                <h3>Related Payments ({detail.payments.length})</h3>
                {detail.payments.length ? (
                  <div className="table-card cm-payment-table">
                    <table>
                      <thead><tr><th>Payment ID</th><th>Date</th><th>Amount</th><th>Method</th><th>Status</th><th>Receipt</th></tr></thead>
                      <tbody>
                        {detail.payments.map((payment) => (
                          <tr key={payment.id}>
                            <td className="link-cell">{payment.payment_id}</td>
                            <td>{dateLabel(payment.payment_date)}</td>
                            <td className="money-cell">{money(payment.amount_paid)}</td>
                            <td>{payment.payment_method}</td><td>{payment.status}</td>
                            <td>{payment.official_receipt_number}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="cm-empty-note">No payment has been recorded for this invoice.</p>}
              </section>
            </div>
            <div className="modal-footer">
              <button type="button" className="light-button" onClick={() => navigate?.("Official Receipt Generation")}><ReceiptText size={14} /> Official Receipt</button>
              <button type="button" className="primary-button" onClick={() => printRecord(detail.collection)}><Printer size={14} /> Print</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default CollectionMonitoringPage;
