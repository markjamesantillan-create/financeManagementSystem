import React, { useEffect, useMemo, useState } from "react";
import {
  Printer,
  RotateCcw,
  Clock3,
  AlertTriangle,
  Eye,
  FileText,
  PhilippinePeso,
  Bell,
  HandCoins,
  History,
  MoreHorizontal,
  X,
} from "lucide-react";

// Aging of Receivables talks to the same Node backend (Backend/server.js) as
// the other Accounts Receivable pages. VITE_API_URL is the deployed-backend
// variable (see frontend/Dockerfile); when unset, the empty fallback keeps
// local dev on the Vite proxy (/api -> http://127.0.0.1:3001) like siblings.
const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

const money = (value) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// Every peso figure is hidden as "*" until its own cell is clicked — each
// amount has a separate reveal key, so clicking one never reveals the rest.
const MaskedAmount = ({ id, value, revealed, onToggle, className = "" }) => {
  const isOpen = Boolean(revealed[id]);
  return (
    <span
      className={`masked-amount ${className}`.trim()}
      role="button"
      tabIndex={0}
      title={isOpen ? "Click to hide amount" : "Click to reveal amount"}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(id);
        }
      }}
    >
      {isOpen ? money(value) : "*"}
    </span>
  );
};

const Breadcrumb = ({ parent, current }) => (
  <div className="breadcrumb">
    <span>{parent}</span>
    <span> / </span>
    <strong>{current}</strong>
  </div>
);

// Five backend-calculated buckets, earliest first.
const AGING_CATEGORIES = [
  "Current",
  "1-30 Days",
  "31-60 Days",
  "61-90 Days",
  "90+ Days",
];

// Status is plain text, exactly as the backend returns it.
const STATUS_ORDER = ["Paid", "Current", "Due Soon", "Overdue"];

// "1-30 Days" -> "aging-1-30" (matches the .status-badge aging classes).
const AGING_CLASS_MAP = {
  Current: "aging-current",
  "1-30 Days": "aging-1-30",
  "31-60 Days": "aging-31-60",
  "61-90 Days": "aging-61-90",
  "90+ Days": "aging-90-plus",
};

const agingClass = (category) => AGING_CLASS_MAP[category] || "unknown";

const statusSlug = (status) =>
  String(status || "unknown").toLowerCase().trim().replace(/\s+/g, "-");

// Why a request failed, kept so the page reports the real cause instead of
// always blaming the connection:
//   "unreachable" -> the API never answered (backend down, wrong port)
//   "server"      -> the API answered with an error status, message kept
//   "shape"       -> the API answered 2xx but not with the documented shape
const requestJson = async (path) => {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    console.error(`Failed to reach ${path}:`, error);
    return { ok: false, reason: "unreachable", status: 0, message: null };
  }

  // A missing/non-JSON body must not be reported as a parse crash: in local dev
  // the Vite proxy answers with a bare, bodyless 500 when the backend is down.
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      ok: false,
      reason: "server",
      status: response.status,
      message: payload?.message || null,
    };
  }

  return { ok: true, reason: null, status: response.status, payload };
};

// A failure is described from what actually happened, never assumed to be a
// connection problem. When the backend sent its own message (e.g. a database
// error) that message is shown, because it is the only real explanation.
const failureMessage = (path, result) => {
  if (result.reason === "unreachable") {
    return `The backend did not answer ${path}. Start it with "npm start" in the Backend folder, then use Refresh to try again.`;
  }
  if (result.message) {
    return `The backend rejected ${path} (HTTP ${result.status}): ${result.message}`;
  }
  return `The backend answered ${path} with an error (HTTP ${result.status}) and no message, which is what the local dev proxy returns when the backend is not running. Start it with "npm start" in the Backend folder, then use Refresh to try again.`;
};

// Returns { value, error }: value is the array, error the reason it is missing.
// An empty array is a real value, not a failure.
const fetchList = async (path) => {
  const result = await requestJson(path);
  if (!result.ok) return { value: null, error: failureMessage(path, result) };

  const payload = result.payload;
  if (Array.isArray(payload)) return { value: payload, error: null };
  if (Array.isArray(payload?.data)) return { value: payload.data, error: null };
  if (Array.isArray(payload?.balances)) return { value: payload.balances, error: null };
  return {
    value: null,
    error: `The backend answered ${path} with an unexpected response shape.`,
  };
};

// Returns { value, error }: payload.data (object) or null.
const fetchObject = async (path) => {
  const result = await requestJson(path);
  if (!result.ok) return { value: null, error: failureMessage(path, result) };

  const payload = result.payload;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return {
      value: payload.data !== undefined && payload.data !== null ? payload.data : payload,
      error: null,
    };
  }
  return {
    value: null,
    error: `The backend answered ${path} with an unexpected response shape.`,
  };
};

const fetchAgingData = async () => {
  const [rows, summaryPayload] = await Promise.all([
    fetchList("/api/receivables/aging"),
    fetchObject("/api/receivables/aging/summary"),
  ]);
  return { rows, summaryPayload };
};

function AgingReceivablesPage({ onAudit, navigate }) {
  // All rows come from GET /api/receivables/aging — no hard-coded data.
  const [receivables, setReceivables] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [notice, setNotice] = useState(null);
  const [detail, setDetail] = useState(null);

  // Per-cell amount masking: each amount stays "*" until its own cell is
  // clicked, and revealing one never reveals the others.
  const [revealedAmounts, setRevealedAmounts] = useState({});
  const toggleAmount = (id) =>
    setRevealedAmounts((prev) => ({ ...prev, [id]: !prev[id] }));
  const maskable = (id, value) => (
    <MaskedAmount
      id={id}
      value={value}
      revealed={revealedAmounts}
      onToggle={toggleAmount}
    />
  );

  const applyData = ({ rows, summaryPayload }) => {
    if (rows.value !== null) {
      setReceivables(rows.value);
      setSummary(
        summaryPayload.value && Array.isArray(summaryPayload.value.categories)
          ? summaryPayload.value
          : null
      );
      setLoadError(null);
    } else {
      setReceivables([]);
      setSummary(null);
      // The reported reason is the real one, not a guess that blames the
      // user's connection.
      setLoadError(rows.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchAgingData();
      if (!cancelled) applyData(data);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close the row action menu when clicking anywhere outside it.
  useEffect(() => {
    if (openMenuId === null) return undefined;
    const close = () => setOpenMenuId(null);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openMenuId]);

  const handleRefresh = async () => {
    setLoading(true);
    applyData(await fetchAgingData());
    onAudit?.("Refreshed aging receivables", "GET /api/receivables/aging");
  };

  // Six summary cards from GET /api/receivables/aging/summary; when that
  // endpoint is unavailable the values are derived from the fetched rows —
  // still API-driven, never hard-coded.
  const summaryView = useMemo(() => {
    const base = { categories: [], total_count: 0, total_outstanding: 0 };

    if (summary && Array.isArray(summary.categories)) {
      base.categories = AGING_CATEGORIES.map((label) => {
        const found = summary.categories.find(
          (cat) => cat.aging_category === label
        );
        return {
          aging_category: label,
          invoice_count: Number(found?.invoice_count || 0),
          outstanding_amount: Number(found?.outstanding_amount || 0),
        };
      });
      base.total_count = Number(summary.total_count ?? 0);
      base.total_outstanding = Number(summary.total_outstanding ?? 0);
      return base;
    }

    const buckets = {};
    AGING_CATEGORIES.forEach((label) => {
      buckets[label] = {
        aging_category: label,
        invoice_count: 0,
        outstanding_amount: 0,
      };
    });
    receivables.forEach((row) => {
      const bucket = buckets[row.aging_category];
      if (!bucket) return;
      bucket.invoice_count += 1;
      bucket.outstanding_amount += Number(row.outstanding_balance || 0);
    });
    base.categories = AGING_CATEGORIES.map((label) => buckets[label]);
    base.total_count = receivables.length;
    base.total_outstanding = receivables.reduce(
      (sum, row) => sum + Number(row.outstanding_balance || 0),
      0
    );
    return base;
  }, [summary, receivables]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return receivables.filter((item) => {
      if (
        filterCategory !== "All Categories" &&
        item.aging_category !== filterCategory
      ) {
        return false;
      }
      if (filterStatus !== "All Status" && item.status !== filterStatus) {
        return false;
      }
      if (!query) return true;
      return [
        item.invoice_number,
        item.client_name,
        item.aging_category,
        item.status,
      ].some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [receivables, search, filterCategory, filterStatus]);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 4000);
  };

  // View Details / View Invoice / View Payment History all open this dialog,
  // which loads GET /api/receivables/{id} (invoice + payment history).
  const openDetail = async (item, focus = "details") => {
    setDetail({
      loading: true,
      invoice: null,
      payments: [],
      focus,
      row: item,
      error: null,
    });
    const { value: payload, error } = await fetchObject(`/api/receivables/${item.id}`);
    if (!payload || !payload.invoice) {
      setDetail({
        loading: false,
        invoice: null,
        payments: [],
        focus,
        row: item,
        error: error || "The backend returned no details for this receivable.",
      });
      return;
    }
    setDetail({
      loading: false,
      invoice: payload.invoice,
      payments: Array.isArray(payload.payments) ? payload.payments : [],
      focus,
      row: item,
      error: null,
    });
  };

  const closeDetail = () => setDetail(null);

  const handleRecordPayment = (item) => {
    onAudit?.(
      "Opened payment recording",
      `${item.invoice_number} — ${item.client_name}`
    );
    navigate?.("Payment Recording");
  };

  const handleSendReminder = (item) => {
    onAudit?.(
      "Sent payment reminder",
      `${item.invoice_number} — ${item.client_name}`
    );
    showNotice(
      `Payment reminder sent for ${item.invoice_number} (${item.client_name}).`
    );
  };

  const handleCollectionFollowUp = (item) => {
    onAudit?.(
      "Logged collection follow-up",
      `${item.invoice_number} — ${item.client_name}`
    );
    showNotice(`Collection follow-up logged for ${item.invoice_number}.`);
  };

  if (loading) {
    return (
      <section className="management-page aging-receivables-page">
        <div className="contract-alert">
          <Clock3 size={17} />
          <span>Loading aging receivables…</span>
        </div>
      </section>
    );
  }

  return (
    <section className="management-page aging-receivables-page">
      <Breadcrumb
        current="Aging of Receivables"
        parent="Accounts Receivable"
      />

      {loadError && (
        <div className="contract-alert">
          <AlertTriangle size={17} />
          <span>{loadError}</span>
        </div>
      )}

      {notice && (
        <div className="contract-alert">
          <Clock3 size={17} />
          <span>{notice}</span>
        </div>
      )}

      <div className="management-header">
        <div>
          <h2>Aging of Receivables</h2>
          <p>
            See how long each unpaid receivable has been outstanding — every
            bucket, count and amount is calculated by the backend from invoice
            due dates and Verified payments.
          </p>
        </div>

        <div className="management-actions">
          <button
            className="light-button"
            onClick={() => window.print()}
            title="Print this page"
          >
            <Printer size={15} /> Print
          </button>

          <button
            className="light-button"
            onClick={handleRefresh}
            title="Reload the latest aging data"
          >
            <RotateCcw size={15} /> Refresh
          </button>

          <button
            className="primary-button"
            onClick={() => navigate?.("Payment Recording")}
          >
            ＋ Record Payment
          </button>
        </div>
      </div>

      {/* 1. Summary cards — Total Receivables + the five aging buckets */}
      <div className="vendor-summary-grid aging-summary-grid">
        <div className="vendor-summary-card">
          <span className="vendor-summary-label">Total Receivables</span>
          <strong className="vendor-summary-amount total-payable-amount">
            {maskable("card-total", summaryView.total_outstanding)}
          </strong>
          <small className="aging-card-count">
            {summaryView.total_count} unpaid invoice
            {summaryView.total_count === 1 ? "" : "s"}
          </small>
        </div>

        {summaryView.categories.map((cat) => (
          <div className="vendor-summary-card" key={cat.aging_category}>
            <span className="vendor-summary-label">{cat.aging_category}</span>
            <strong
              className={`vendor-summary-amount ${agingClass(
                cat.aging_category
              ).replace("aging-", "aging-amount-")}`}
            >
              {maskable(`card-${cat.aging_category}`, cat.outstanding_amount)}
            </strong>
            <small className="aging-card-count">
              {cat.invoice_count} invoice{cat.invoice_count === 1 ? "" : "s"}
            </small>
          </div>
        ))}
      </div>

      {/* Aging categories, calculated — never entered by hand */}
      <div className="status-legend">
        {summaryView.categories.map((cat) => (
          <span
            key={cat.aging_category}
            className={`status-badge ${agingClass(cat.aging_category)}`}
          >
            {cat.aging_category} <b>{cat.invoice_count}</b>
          </span>
        ))}
      </div>

      {/* 2. Aging Summary table — category / count / outstanding + Total */}
      <section className="vendor-record-panel aging-summary-panel">
        <div className="vendor-record-heading">
          <h3>Aging Summary</h3>
        </div>

        <div className="table-card">
          <table className="aging-summary-table">
            <thead>
              <tr>
                <th>Aging Category</th>
                <th>Number of Invoices</th>
                <th>Outstanding Amount</th>
              </tr>
            </thead>
            <tbody>
              {summaryView.categories.map((cat) => (
                <tr key={cat.aging_category}>
                  <td>
                    <span
                      className={`status-badge ${agingClass(cat.aging_category)}`}
                    >
                      {cat.aging_category}
                    </span>
                  </td>
                  <td>{cat.invoice_count}</td>
                  <td className="money-cell">
                    {maskable(
                      `summary-${cat.aging_category}`,
                      cat.outstanding_amount
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="strong-cell">Total</td>
                <td className="strong-cell">{summaryView.total_count}</td>
                <td className="money-cell">
                  {maskable("summary-total", summaryView.total_outstanding)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* 3. Toolbar — search + aging category + status filters */}
      <div className="vendor-toolbar">
        <div className="search-box vendor-search">
          <span>⌕</span>
          <input
            placeholder="Search invoice number or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="vendor-toolbar-controls">
          <select
            className="vendor-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            title="Filter by aging category"
          >
            <option>All Categories</option>
            {AGING_CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>

          <select
            className="vendor-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            title="Filter by status"
          >
            <option>All Status</option>
            {STATUS_ORDER.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Aging Receivables table — one row per unpaid invoice */}
      <section className="vendor-record-panel">
        <div className="vendor-record-heading">
          <h3>Aging Receivables ({filtered.length})</h3>
        </div>

        <div className="table-card vendor-table-card">
          <table>
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>Client</th>
                <th>Due Date</th>
                <th>Invoice Amount</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Days Overdue</th>
                <th>Aging Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((item) => (
                  <tr key={item.id ?? item.invoice_number}>
                    <td className="link-cell">{item.invoice_number}</td>
                    <td className="strong-cell">{item.client_name}</td>
                    <td>{item.due_date || "—"}</td>
                    <td className="money-cell">
                      {maskable(
                        `row-${item.id ?? item.invoice_number}-invoice`,
                        item.invoice_amount
                      )}
                    </td>
                    <td className="money-cell">
                      {maskable(
                        `row-${item.id ?? item.invoice_number}-paid`,
                        item.amount_paid
                      )}
                    </td>
                    <td className="money-cell">
                      {maskable(
                        `row-${item.id ?? item.invoice_number}-balance`,
                        item.outstanding_balance
                      )}
                    </td>
                    <td
                      className={
                        Number(item.days_overdue || 0) > 0 ? "red-text" : ""
                      }
                    >
                      {Number(item.days_overdue || 0)}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${agingClass(
                          item.aging_category
                        )}`}
                      >
                        {item.aging_category || "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${statusSlug(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions aging-row-actions">
                        <button
                          type="button"
                          className="aging-menu-toggle"
                          title="Actions"
                          aria-label={`Actions for ${item.invoice_number}`}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(
                              openMenuId === item.id ? null : item.id
                            );
                          }}
                        >
                          <MoreHorizontal size={15} />
                        </button>

                        {openMenuId === item.id && (
                          <div
                            className="aging-action-menu"
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                openDetail(item, "details");
                              }}
                            >
                              <Eye size={13} /> View Details
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                openDetail(item, "invoice");
                              }}
                            >
                              <FileText size={13} /> View Invoice
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                handleRecordPayment(item);
                              }}
                            >
                              <PhilippinePeso size={13} /> Record Payment
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                handleSendReminder(item);
                              }}
                            >
                              <Bell size={13} /> Send Reminder
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                handleCollectionFollowUp(item);
                              }}
                            >
                              <HandCoins size={13} /> Collection Follow-up
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                openDetail(item, "payments");
                              }}
                            >
                              <History size={13} /> View Payment History
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="empty">
                    {loadError
                      ? "No aging data to display."
                      : "No aging receivables found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Receivable detail dialog — GET /api/receivables/{id} */}
      {detail && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>
                  Receivable Details — {detail.row?.invoice_number || ""}
                </h2>
                <p>{detail.row?.client_name}</p>
              </div>
              <button type="button" onClick={closeDetail} aria-label="Close">
                <X size={15} />
              </button>
            </div>

            <div className="aging-detail-body">
              {detail.loading && (
                <p className="aging-detail-loading">
                  Loading receivable and payment history…
                </p>
              )}

              {!detail.loading && detail.error && (
                <div className="contract-alert">
                  <AlertTriangle size={17} />
                  <span>{detail.error}</span>
                </div>
              )}

              {!detail.loading && detail.invoice && (
                <>
                  <div
                    className={`aging-detail-section ${
                      detail.focus === "invoice" ? "focused" : ""
                    }`}
                  >
                    <h4>Invoice</h4>
                    <dl className="aging-detail-grid">
                      <div>
                        <dt>Invoice No.</dt>
                        <dd>{detail.invoice.invoice_number}</dd>
                      </div>
                      <div>
                        <dt>Client</dt>
                        <dd>{detail.invoice.client_name}</dd>
                      </div>
                      <div>
                        <dt>Invoice Date</dt>
                        <dd>{detail.invoice.invoice_date || "—"}</dd>
                      </div>
                      <div>
                        <dt>Due Date</dt>
                        <dd>{detail.invoice.due_date || "—"}</dd>
                      </div>
                      <div>
                        <dt>Invoice Amount</dt>
                        <dd>
                          {maskable(
                            `detail-${detail.row?.id}-invoice-amount`,
                            detail.invoice.invoice_amount
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>Amount Paid</dt>
                        <dd>
                          {maskable(
                            `detail-${detail.row?.id}-amount-paid`,
                            detail.invoice.amount_paid
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>Outstanding Balance</dt>
                        <dd>
                          {maskable(
                            `detail-${detail.row?.id}-outstanding`,
                            detail.invoice.outstanding_balance
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>Days Overdue</dt>
                        <dd>{Number(detail.invoice.days_overdue || 0)}</dd>
                      </div>
                      <div>
                        <dt>Aging Category</dt>
                        <dd>
                          <span
                            className={`status-badge ${agingClass(
                              detail.invoice.aging_category
                            )}`}
                          >
                            {detail.invoice.aging_category}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt>Status</dt>
                        <dd>
                          <span
                            className={`status-badge ${statusSlug(
                              detail.invoice.status
                            )}`}
                          >
                            {detail.invoice.status}
                          </span>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div
                    className={`aging-detail-section ${
                      detail.focus === "payments" ? "focused" : ""
                    }`}
                  >
                    <h4>Payment History ({detail.payments.length})</h4>
                    {detail.payments.length ? (
                      <div className="table-card modal-table-card">
                        <table>
                          <thead>
                            <tr>
                              <th>Payment ID</th>
                              <th>Date</th>
                              <th>Method</th>
                              <th>Reference</th>
                              <th>Amount Paid</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.payments.map((payment) => (
                              <tr key={payment.id ?? payment.payment_id}>
                                <td className="link-cell">
                                  {payment.payment_id}
                                </td>
                                <td>{payment.payment_date || "—"}</td>
                                <td>{payment.payment_method || "—"}</td>
                                <td>{payment.reference_number || "—"}</td>
                                <td className="money-cell">
                                  {maskable(
                                    `detail-${detail.row?.id}-payment-${
                                      payment.id ?? payment.payment_id
                                    }`,
                                    payment.amount_paid
                                  )}
                                </td>
                                <td>{payment.status || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="aging-detail-empty">
                        No payments recorded for this invoice yet.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="light-button"
                onClick={closeDetail}
              >
                Close
              </button>
              {detail.row && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    const row = detail.row;
                    closeDetail();
                    handleRecordPayment(row);
                  }}
                >
                  <PhilippinePeso size={14} /> Record Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AgingReceivablesPage;