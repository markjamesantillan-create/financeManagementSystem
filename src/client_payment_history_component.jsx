import React, { useEffect, useMemo, useState } from "react";
import {
  Printer,
  RotateCcw,
  Clock3,
  AlertTriangle,
  Eye,
  CheckCircle2,
  XCircle,
  X,
  MoreHorizontal,
} from "lucide-react";

// Client Payment History talks to the same Node backend (Backend/server.js) as
// the other Accounts Receivable pages. VITE_API_URL is the deployed-backend
// variable; when it is unset the empty fallback keeps local dev on the Vite
// proxy (/api -> http://127.0.0.1:3001), exactly like its sibling pages.
const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

// Payment statuses, in the order the backend supports them.
const PAYMENT_STATUS_ORDER = [
  "Recorded",
  "Pending Verification",
  "Verified",
  "Cancelled",
];

// Used only while the backend option list is unavailable.
const FALLBACK_METHODS = [
  "Cash",
  "Bank Transfer",
  "Check",
  "Online Payment",
  "GCash",
];

const money = (value) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// "Pending Verification" -> "pending-verification" (matches .status-badge classes).
const statusSlug = (status) =>
  String(status || "unknown").toLowerCase().trim().replace(/\s+/g, "-");

// Keeps optional payment fields readable instead of printing "null"/"undefined".
const display = (value) =>
  value === null || value === undefined || value === "" ? "—" : value;

// Every peso figure is hidden as "*" until its own cell is clicked — each amount
// has a separate reveal key, so clicking one never reveals the rest.
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

const sendPut = async (path) => {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "PUT",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const payload = await response.json();
    return response.ok && payload.success ? payload.data : null;
  } catch (error) {
    console.error(`Failed to update ${path} on API:`, error);
    return null;
  }
};

const verifyPaymentViaApi = (id) => sendPut(`/api/payments/${id}/verify`);
const cancelPaymentViaApi = (id) => sendPut(`/api/payments/${id}/cancel`);

const fetchPaymentHistory = async () => {
  const [historyRows, summaryPayload, filterPayload] = await Promise.all([
    // Payments table -> API -> React: rows always come from the documented
    // GET /api/payments/history feed, never from an array kept in this file.
    fetchList("/api/payments/history"),
    fetchObject("/api/payments/summary"),
    fetchObject("/api/payments/filters"),
  ]);

  // Same records, same table: fall back to the filtered list endpoint only if
  // the history feed itself is unavailable, so the page degrades instead of
  // showing an empty history.
  const fallback =
    historyRows.value === null ? await fetchList("/api/payments") : null;
  const rows = historyRows.value === null ? fallback.value : historyRows.value;

  return {
    rows,
    // Report the history feed's own failure; the fallback only ever helps when
    // it succeeds, so its error is what gets surfaced when both are missing.
    error: rows === null ? (historyRows.error || fallback?.error) : null,
    summaryPayload,
    filterPayload,
  };
};

// Distinct, sorted option values — used only when the backend option list is
// unavailable, so the toolbar never renders empty selects.
const uniqueValues = (values) =>
  Array.from(new Set(values.filter((value) => value && value !== "—"))).sort();

function ClientPaymentHistoryPage({ onAudit, navigate }) {
  // Every row comes from GET /api/payments/history (the payments table) — the
  // history is never hard-coded in this component.
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filterOptions, setFilterOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [detail, setDetail] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Search + filters (date range, client, contract, payment method, status).
  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState("All Clients");
  const [filterContract, setFilterContract] = useState("All Contracts");
  const [filterMethod, setFilterMethod] = useState("All Methods");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Per-cell amount masking: each amount stays "*" until its own cell is clicked.
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

  const applyData = ({ rows, summaryPayload, filterPayload, error }) => {
    if (rows !== null) {
      setPayments(rows);
      setSummary(summaryPayload.value || null);
      setFilterOptions(filterPayload.value || null);
      setLoadError(null);
    } else {
      setPayments([]);
      setSummary(null);
      // The reported reason is the real one, not a guess that blames the
      // user's connection.
      setLoadError(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchPaymentHistory();
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
    applyData(await fetchPaymentHistory());
    onAudit?.("Refreshed client payment history", "Client Payment History");
  };

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 4000);
  };

  // Summary cards from GET /api/payments/summary; if that endpoint is
  // unavailable the same totals are derived from the fetched rows instead.
  const summaryView = useMemo(() => {
    const base = {
      total_payments: 0,
      verified_payments: 0,
      pending_verification: 0,
      total_outstanding: 0,
      total_count: 0,
      verified_count: 0,
      pending_count: 0,
    };

    if (summary) {
      base.total_payments = Number(summary.total_payments || 0);
      base.verified_payments = Number(summary.verified_payments || 0);
      base.pending_verification = Number(summary.pending_verification || 0);
      base.total_outstanding = Number(summary.total_outstanding || 0);
      base.total_count = Number(summary.total_payment_count || 0);
      base.verified_count = Number(summary.verified_count || 0);
      base.pending_count = Number(summary.pending_count || 0);
      return base;
    }

    const active = payments.filter((payment) => payment.status !== "Cancelled");
    const verified = payments.filter((payment) => payment.status === "Verified");
    const pending = payments.filter(
      (payment) => payment.status === "Pending Verification"
    );

    base.total_payments = active.reduce(
      (sum, payment) => sum + Number(payment.amount_paid || 0),
      0
    );
    base.verified_payments = verified.reduce(
      (sum, payment) => sum + Number(payment.amount_paid || 0),
      0
    );
    base.pending_verification = pending.reduce(
      (sum, payment) => sum + Number(payment.amount_paid || 0),
      0
    );
    base.total_outstanding = active.reduce(
      (sum, payment) => sum + Number(payment.remaining_balance || 0),
      0
    );
    base.total_count = payments.length;
    base.verified_count = verified.length;
    base.pending_count = pending.length;
    return base;
  }, [summary, payments]);

  const clientOptions = useMemo(() => {
    if (filterOptions?.clients?.length) return filterOptions.clients;
    return uniqueValues(payments.map((payment) => payment.client_name));
  }, [filterOptions, payments]);

  const contractOptions = useMemo(() => {
    if (filterOptions?.contracts?.length) return filterOptions.contracts;
    return uniqueValues(payments.map((payment) => payment.contract_id));
  }, [filterOptions, payments]);

  const methodOptions = useMemo(() => {
    if (filterOptions?.methods?.length) return filterOptions.methods;
    const used = uniqueValues(payments.map((payment) => payment.payment_method));
    return used.length ? used : FALLBACK_METHODS;
  }, [filterOptions, payments]);

  const statusOptions = filterOptions?.statuses?.length
    ? filterOptions.statuses
    : PAYMENT_STATUS_ORDER;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      if (filterClient !== "All Clients" && payment.client_name !== filterClient) {
        return false;
      }
      if (
        filterContract !== "All Contracts" &&
        payment.contract_id !== filterContract
      ) {
        return false;
      }
      if (
        filterMethod !== "All Methods" &&
        payment.payment_method !== filterMethod
      ) {
        return false;
      }
      if (filterStatus !== "All Status" && payment.status !== filterStatus) {
        return false;
      }
      if (dateFrom && String(payment.payment_date || "") < dateFrom) return false;
      if (dateTo && String(payment.payment_date || "") > dateTo) return false;
      if (!query) return true;

      // Search by client, payment ID, invoice number or reference number.
      return [
        payment.payment_id,
        payment.client_name,
        payment.invoice_number,
        payment.reference_number,
        payment.official_receipt_number,
        payment.contract_id,
      ].some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [
    payments,
    search,
    filterClient,
    filterContract,
    filterMethod,
    filterStatus,
    dateFrom,
    dateTo,
  ]);

  const resetFilters = () => {
    setSearch("");
    setFilterClient("All Clients");
    setFilterContract("All Contracts");
    setFilterMethod("All Methods");
    setFilterStatus("All Status");
    setDateFrom("");
    setDateTo("");
  };

  // View Payment Details — loads GET /api/payments/{id} (payment + its invoice).
  const openDetail = async (payment) => {
    setDetail({ loading: true, payment, invoice: null, error: null });
    const { value: payload, error } = await fetchObject(`/api/payments/${payment.id}`);

    if (!payload || !payload.payment) {
      setDetail({
        loading: false,
        payment,
        invoice: null,
        error: error || "The backend returned no details for this payment.",
      });
      return;
    }

    setDetail({
      loading: false,
      payment: payload.payment,
      invoice: payload.invoice || null,
      error: null,
    });
  };

  const closeDetail = () => setDetail(null);

  // Verifying only marks the payment as verified and makes it available from
  // Official Receipt Generation. The receipt itself is issued by POST
  // /api/official-receipts, after the verified payment is selected there.
  const handleVerify = async (payment) => {
    if (
      !window.confirm(
        `Verify ${payment.payment_id}? The invoice balance will update and the payment will become available for Official Receipt Generation.`
      )
    ) {
      return;
    }

    setDetail(null);
    const verified = await verifyPaymentViaApi(payment.id);

    if (!verified) {
      showNotice(`Could not verify ${payment.payment_id}. Please try again.`);
      return;
    }

    await handleRefresh();
    showNotice(
      `${verified.payment_id} is now Verified and available for Official Receipt Generation.`
    );
    onAudit?.("Verified payment", verified.payment_id);
  };

  const handleCancel = async (payment) => {
    if (
      !window.confirm(
        `Cancel ${payment.payment_id}? A cancelled payment no longer counts towards the invoice balance.`
      )
    ) {
      return;
    }

    setDetail(null);
    const cancelled = await cancelPaymentViaApi(payment.id);

    if (!cancelled) {
      showNotice(`Could not cancel ${payment.payment_id}. Please try again.`);
      return;
    }

    await handleRefresh();
    showNotice(`${cancelled.payment_id} has been cancelled.`);
    onAudit?.("Cancelled payment", cancelled.payment_id);
  };

  // Printable payment receipt (same pop-up convention as Payment Recording).
  const handlePrint = (payment) => {
    if (!payment) return;

    const w = window.open("", "_blank");
    if (!w) {
      alert("Please allow pop-ups to print the payment receipt.");
      return;
    }

    w.document.write(`
      <html>
        <head><title>${payment.payment_id}</title></head>
        <body style="font-family:Arial;padding:40px">
          <h1>PRIMEPOWER - Payment Receipt</h1>
          <hr/>
          <p><b>Payment ID:</b> ${display(payment.payment_id)}</p>
          <p><b>Client:</b> ${display(payment.client_name)}</p>
          <p><b>Contract:</b> ${display(payment.contract_id)}</p>
          <p><b>Invoice:</b> ${display(payment.invoice_number)}</p>
          <p><b>Payment Date:</b> ${display(payment.payment_date)}</p>
          <p><b>Due Amount:</b> ${money(payment.amount_due)}</p>
          <p><b>Amount Paid:</b> ${money(payment.amount_paid)}</p>
          <p><b>Remaining Balance:</b> ${money(payment.remaining_balance)}</p>
          <p><b>Payment Method:</b> ${display(payment.payment_method)}</p>
          <p><b>Bank Account:</b> ${display(payment.bank_account)}</p>
          <p><b>Reference No.:</b> ${display(payment.reference_number)}</p>
          <p><b>Status:</b> ${display(payment.status)}</p>
          <p><b>Official Receipt No.:</b> ${display(payment.official_receipt_number)}</p>
          <p><b>Prepared By:</b> ${display(payment.prepared_by)}</p>
          <p><b>Verified By:</b> ${display(payment.verified_by)}</p>
          <p><b>Verification Date:</b> ${display(payment.verification_date)}</p>
          <p><b>Supporting Document:</b> ${display(payment.supporting_document)}</p>
          <p><b>Remarks:</b> ${display(payment.remarks)}</p>
          <script>window.print();</script>
        </body>
      </html>
    `);

    w.document.close();
  };

  if (loading) {
    return (
      <section className="management-page payment-history-page">
        <div className="contract-alert">
          <Clock3 size={17} />
          <span>Loading client payment history…</span>
        </div>
      </section>
    );
  }

  return (
    <section className="management-page payment-history-page">
      <Breadcrumb
        current="Client Payment History"
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
          <h2>Client Payment History</h2>
          <p>
            Complete historical record of every payment received from clients —
            each entry keeps its contract, invoice, official receipt and
            verification details, and every balance is recalculated from the
            verified payments.
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
            title="Reload the latest payment history"
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

      {/* 1. Summary cards — totals from GET /api/payments/summary */}
      <div className="vendor-summary-grid">
        <div className="vendor-summary-card">
          <span className="vendor-summary-label">Total Payments Received</span>
          <strong className="vendor-summary-amount total-payable-amount">
            {maskable("card-total", summaryView.total_payments)}
          </strong>
          <small className="aging-card-count">
            {summaryView.total_count} payment
            {summaryView.total_count === 1 ? "" : "s"} recorded
          </small>
        </div>

        <div className="vendor-summary-card">
          <span className="vendor-summary-label">Verified Payments</span>
          <strong className="vendor-summary-amount paid-amount">
            {maskable("card-verified", summaryView.verified_payments)}
          </strong>
          <small className="aging-card-count">
            {summaryView.verified_count} verified
          </small>
        </div>

        <div className="vendor-summary-card">
          <span className="vendor-summary-label">Pending Verification</span>
          <strong className="vendor-summary-amount pending-amount">
            {maskable("card-pending", summaryView.pending_verification)}
          </strong>
          <small className="aging-card-count">
            {summaryView.pending_count} awaiting verification
          </small>
        </div>

        <div className="vendor-summary-card">
          <span className="vendor-summary-label">Total Outstanding</span>
          <strong className="vendor-summary-amount overdue-amount">
            {maskable("card-outstanding", summaryView.total_outstanding)}
          </strong>
          <small className="aging-card-count">
            Still unpaid after recorded payments
          </small>
        </div>
      </div>

      {/* 2. Toolbar — search by client / payment ID / invoice / reference */}
      <div className="vendor-toolbar">
        <div className="search-box vendor-search">
          <span>⌕</span>
          <input
            placeholder="Search client, payment ID, invoice or reference..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="vendor-toolbar-controls">
          <select
            className="vendor-select"
            value={filterClient}
            onChange={(event) => setFilterClient(event.target.value)}
            title="Filter by client"
          >
            <option>All Clients</option>
            {clientOptions.map((client) => (
              <option key={client}>{client}</option>
            ))}
          </select>

          <select
            className="vendor-select"
            value={filterContract}
            onChange={(event) => setFilterContract(event.target.value)}
            title="Filter by contract"
          >
            <option>All Contracts</option>
            {contractOptions.map((contract) => (
              <option key={contract}>{contract}</option>
            ))}
          </select>

          <select
            className="vendor-select"
            value={filterMethod}
            onChange={(event) => setFilterMethod(event.target.value)}
            title="Filter by payment method"
          >
            <option>All Methods</option>
            {methodOptions.map((method) => (
              <option key={method}>{method}</option>
            ))}
          </select>

          <select
            className="vendor-select"
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
            title="Filter by payment status"
          >
            <option>All Status</option>
            {statusOptions.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Payment date range + reset */}
      <div className="vendor-toolbar payment-history-date-bar">
        <label>
          <span>Payment date from</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
        </label>

        <label>
          <span>to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </label>

        <button type="button" className="light-button" onClick={resetFilters}>
          <RotateCcw size={14} /> Reset Filters
        </button>
      </div>

      {/* 4. Payment history — one row per payment received */}
      <section className="vendor-record-panel">
        <div className="vendor-record-heading">
          <h3>Payment History ({filtered.length})</h3>
        </div>

        <div className="table-card vendor-table-card">
          <table>
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Client</th>
                <th>Contract ID</th>
                <th>Invoice No.</th>
                <th>Payment Date</th>
                <th>Due Amount</th>
                <th>Amount Paid</th>
                <th>Balance</th>
                <th>Method</th>
                <th>Reference No.</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((payment) => {
                  const key = payment.id ?? payment.payment_id;
                  return (
                    <tr key={key} onClick={() => openDetail(payment)}>
                      <td className="link-cell">{payment.payment_id}</td>
                      <td className="strong-cell">
                        {display(payment.client_name)}
                      </td>
                      <td>{display(payment.contract_id)}</td>
                      <td>{display(payment.invoice_number)}</td>
                      <td>{display(payment.payment_date)}</td>
                      <td className="money-cell">
                        {maskable(`row-${key}-due`, payment.amount_due)}
                      </td>
                      <td className="money-cell">
                        {maskable(`row-${key}-paid`, payment.amount_paid)}
                      </td>
                      <td className="money-cell">
                        {maskable(
                          `row-${key}-balance`,
                          payment.remaining_balance
                        )}
                      </td>
                      <td>{display(payment.payment_method)}</td>
                      <td>{display(payment.reference_number)}</td>
                      <td>
                        <span
                          className={`status-badge ${statusSlug(payment.status)}`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions aging-row-actions">
                          <button
                            type="button"
                            className="aging-menu-toggle"
                            title="Actions"
                            aria-label={`Actions for ${payment.payment_id}`}
                            onMouseDown={(event) => event.stopPropagation()}
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenMenuId(
                                openMenuId === payment.id ? null : payment.id
                              );
                            }}
                          >
                            <MoreHorizontal size={15} />
                          </button>

                          {openMenuId === payment.id && (
                            <div
                              className="aging-action-menu"
                              onMouseDown={(event) => event.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  openDetail(payment);
                                }}
                              >
                                <Eye size={13} /> View Details
                              </button>

                              {payment.status !== "Verified" &&
                                payment.status !== "Cancelled" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      handleVerify(payment);
                                    }}
                                  >
                                    <CheckCircle2 size={13} /> Verify Payment
                                  </button>
                                )}

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handlePrint(payment);
                                }}
                              >
                                <Printer size={13} /> Print Receipt
                              </button>

                              {payment.status !== "Cancelled" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleCancel(payment);
                                  }}
                                >
                                  <XCircle size={13} /> Cancel Payment
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={12} className="empty">
                    {loadError
                      ? "No payment records to display."
                      : "No payments match the current search and filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Payment details dialog — GET /api/payments/{id} */}
      {detail && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Payment Details — {detail.payment?.payment_id || ""}</h2>
                <p>
                  {display(detail.payment?.client_name)}
                  {detail.payment?.invoice_number
                    ? ` • ${detail.payment.invoice_number}`
                    : ""}
                </p>
              </div>
              <button type="button" onClick={closeDetail} aria-label="Close">
                <X size={15} />
              </button>
            </div>

            <div className="aging-detail-body">
              {detail.loading && (
                <p className="aging-detail-loading">Loading payment details…</p>
              )}

              {!detail.loading && detail.error && (
                <div className="contract-alert">
                  <AlertTriangle size={17} />
                  <span>{detail.error}</span>
                </div>
              )}

              {!detail.loading && detail.payment && (
                <>
                  <div className="aging-detail-section">
                    <h4>Payment</h4>
                    <dl className="aging-detail-grid">
                      <div>
                        <dt>Payment ID</dt>
                        <dd>{detail.payment.payment_id}</dd>
                      </div>
                      <div>
                        <dt>Client</dt>
                        <dd>{display(detail.payment.client_name)}</dd>
                      </div>
                      <div>
                        <dt>Contract</dt>
                        <dd>{display(detail.payment.contract_id)}</dd>
                      </div>
                      <div>
                        <dt>Invoice</dt>
                        <dd>{display(detail.payment.invoice_number)}</dd>
                      </div>
                      <div>
                        <dt>Payment Date</dt>
                        <dd>{display(detail.payment.payment_date)}</dd>
                      </div>
                      <div>
                        <dt>Invoice Due Date</dt>
                        <dd>{display(detail.payment.due_date)}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="aging-detail-section">
                    <h4>Amounts</h4>
                    <dl className="aging-detail-grid">
                      <div>
                        <dt>Due Amount</dt>
                        <dd>
                          {maskable(
                            `detail-${detail.payment.id}-due`,
                            detail.payment.amount_due
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>Amount Paid</dt>
                        <dd>
                          {maskable(
                            `detail-${detail.payment.id}-paid`,
                            detail.payment.amount_paid
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>Remaining Balance</dt>
                        <dd>
                          {maskable(
                            `detail-${detail.payment.id}-balance`,
                            detail.payment.remaining_balance
                          )}
                        </dd>
                      </div>
                      {detail.invoice && (
                        <div>
                          <dt>Invoice Outstanding</dt>
                          <dd>
                            {maskable(
                              `detail-${detail.payment.id}-invoice-balance`,
                              detail.invoice.outstanding_balance
                            )}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div className="aging-detail-section">
                    <h4>Payment Method &amp; Reference</h4>
                    <dl className="aging-detail-grid">
                      <div>
                        <dt>Payment Method</dt>
                        <dd>{display(detail.payment.payment_method)}</dd>
                      </div>
                      <div>
                        <dt>Bank Account</dt>
                        <dd>{display(detail.payment.bank_account)}</dd>
                      </div>
                      <div>
                        <dt>Reference No.</dt>
                        <dd>{display(detail.payment.reference_number)}</dd>
                      </div>
                      <div>
                        <dt>Supporting Document</dt>
                        <dd>{display(detail.payment.supporting_document)}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="aging-detail-section">
                    <h4>Status &amp; Verification</h4>
                    <dl className="aging-detail-grid">
                      <div>
                        <dt>Status</dt>
                        <dd>
                          <span
                            className={`status-badge ${statusSlug(
                              detail.payment.status
                            )}`}
                          >
                            {detail.payment.status}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt>Official Receipt No.</dt>
                        <dd>{display(detail.payment.official_receipt_number)}</dd>
                      </div>
                      <div>
                        <dt>Prepared By</dt>
                        <dd>{display(detail.payment.prepared_by)}</dd>
                      </div>
                      <div>
                        <dt>Verified By</dt>
                        <dd>{display(detail.payment.verified_by)}</dd>
                      </div>
                      <div>
                        <dt>Verification Date</dt>
                        <dd>{display(detail.payment.verification_date)}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="aging-detail-section">
                    <h4>Remarks</h4>
                    <p className="aging-detail-empty">
                      {display(detail.payment.remarks)}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="light-button" onClick={closeDetail}>
                Close
              </button>

              {detail.payment && (
                <>
                  <button
                    type="button"
                    className="light-button"
                    onClick={() => handlePrint(detail.payment)}
                  >
                    <Printer size={14} /> Print Receipt
                  </button>

                  {detail.payment.status !== "Verified" &&
                    detail.payment.status !== "Cancelled" && (
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => handleVerify(detail.payment)}
                      >
                        <CheckCircle2 size={14} /> Verify Payment
                      </button>
                    )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ClientPaymentHistoryPage;

