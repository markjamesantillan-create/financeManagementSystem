import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  Eye,
  FileDown,
  Printer,
  ReceiptText,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

const STATUS_ORDER = [
  "Issued",
  "Verified",
  "Pending",
  "Reissued",
  "Cancelled",
  "Voided",
];

const STATUS_DESCRIPTIONS = {
  Issued: "Official receipt has been generated.",
  Verified: "Payment is verified and ready for receipt generation.",
  Pending: "Payment still needs verification.",
  Reissued: "Replacement receipt was generated.",
  Cancelled: "Receipt has been cancelled.",
  Voided: "Receipt is no longer valid.",
};

const money = (value) =>
  `\u20B1${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const display = (value) =>
  value === null || value === undefined || value === "" ? "-" : value;

const statusSlug = (status) =>
  String(status || "unknown").toLowerCase().replace(/\s+/g, "-");

const dateLabel = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

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
    throw new Error(payload.message || "The official receipt request failed.");
  }
  return payload;
}

const StatusBadge = ({ status }) => (
  <span
    className={`or-status ${statusSlug(status)}`}
    title={STATUS_DESCRIPTIONS[status] || "Receipt status"}
  >
    {display(status)}
  </span>
);

const ReceiptAmount = ({ receipt, revealed, onToggle }) => {
  const id = receipt.id ?? receipt.receipt_id ?? receipt.receipt_number;
  const isRevealed = Boolean(revealed[id]);
  return (
    <button
      type="button"
      className={`or-received-amount-toggle ${isRevealed ? "is-revealed" : "is-hidden"}`}
      onClick={(event) => {
        event.stopPropagation();
        onToggle(id);
      }}
      aria-label={`${isRevealed ? "Hide" : "Reveal"} amount received for ${display(receipt.receipt_number)}`}
      aria-pressed={isRevealed}
      title={isRevealed ? "Click to hide amount" : "Click to reveal amount"}
    >
      {isRevealed ? money(receipt.amount_received) : "*"}
    </button>
  );
};

const StatusLegend = () => (
  <section className="or-status-legend" aria-labelledby="or-status-legend-title">
    <h3 id="or-status-legend-title">Official Receipt Status</h3>
    <ol>
      {STATUS_ORDER.map((status) => (
        <li key={status} className={`or-status-legend-item ${statusSlug(status)}`}>
          <StatusBadge status={status} />
          <span className="or-status-description">
            — {STATUS_DESCRIPTIONS[status]}
          </span>
        </li>
      ))}
    </ol>
  </section>
);

const Breadcrumb = () => (
  <div className="breadcrumb">
    <span>Collection Management</span>
    <span> / </span>
    <strong>Official Receipt Generation</strong>
  </div>
);

function OfficialReceiptGenerationPage({ onAudit, navigate }) {
  const [receipts, setReceipts] = useState([]);
  const [availablePayments, setAvailablePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [issuedAmountRevealed, setIssuedAmountRevealed] = useState(false);
  const [revealedReceiptAmounts, setRevealedReceiptAmounts] = useState({});
  const [detail, setDetail] = useState(null);
  const [generatePayment, setGeneratePayment] = useState(null);
  const [voidReceipt, setVoidReceipt] = useState(null);
  const [voidReason, setVoidReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);
    try {
      const [receiptPayload, availablePayload] = await Promise.all([
        request("/api/official-receipts"),
        request("/api/official-receipts/available-payments"),
      ]);
      const availableData = Array.isArray(availablePayload.data) ? availablePayload.data : [];
      const currentReceipts = Array.isArray(receiptPayload.data) ? receiptPayload.data : [];
      const activePaymentIds = new Set(
        currentReceipts
          .filter((receipt) => ["Issued", "Reissued"].includes(receipt.status))
          .map((receipt) => String(receipt.payment_db_id))
      );
      setReceipts(currentReceipts);
      setAvailablePayments(
        availableData.filter((payment) => !activePaymentIds.has(String(payment.payment_db_id)))
      );
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredReceipts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return receipts.filter((receipt) => {
      if (statusFilter !== "All Statuses" && receipt.status !== statusFilter) {
        return false;
      }
      if (!query) return true;
      return [
        receipt.receipt_id,
        receipt.receipt_number,
        receipt.payment_id,
        receipt.client_id,
        receipt.client_name,
        receipt.invoice_no,
        receipt.contract_no,
        receipt.reference_number,
        receipt.prepared_by,
        receipt.verified_by,
      ].some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [receipts, search, statusFilter]);

  const summary = useMemo(() => {
    const byStatus = Object.fromEntries(
      STATUS_ORDER.map((status) => [
        status,
        receipts.filter((receipt) => receipt.status === status).length,
      ])
    );
    return {
      ...byStatus,
      total: receipts.length,
      available: availablePayments.length,
      issued_amount: receipts
        .filter((receipt) => ["Issued", "Reissued"].includes(receipt.status))
        .reduce((sum, receipt) => sum + Number(receipt.amount_received || 0), 0),
    };
  }, [receipts, availablePayments]);

  const showNotice = (message, tone = "success") =>
    setNotice(message ? { message, tone } : null);

  const toggleReceiptAmount = (id) =>
    setRevealedReceiptAmounts((current) => ({ ...current, [id]: !current[id] }));

  const openGenerate = (payment) => {
    showNotice(null);
    setGeneratePayment(payment);
  };

  const handleGenerate = async () => {
    if (!generatePayment) return;
    setSaving(true);
    try {
      const payload = await request("/api/official-receipts", {
        method: "POST",
        body: JSON.stringify({ payment_id: generatePayment.payment_id }),
      });
      setGeneratePayment(null);
      await loadData(true);
      setDetail(payload.data);
      showNotice(payload.message || "Official receipt generated.");
      onAudit?.("Generated official receipt", payload.data?.receipt_number);
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleVoid = async (event) => {
    event.preventDefault();
    const reason = voidReason.trim();
    if (!voidReceipt || !reason) {
      showNotice("Enter a reason before voiding the receipt.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = await request(`/api/official-receipts/${voidReceipt.id}/void`, {
        method: "PUT",
        body: JSON.stringify({ reason }),
      });
      setVoidReceipt(null);
      setVoidReason("");
      setDetail(null);
      await loadData(true);
      showNotice(payload.message || "Official receipt voided.");
      onAudit?.("Voided official receipt", payload.data?.receipt_number);
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = (receipt) => {
    const printWindow = window.open(
      `${API_BASE}/api/official-receipts/${receipt.id}/print`,
      "_blank",
      "noopener,noreferrer"
    );
    if (!printWindow) {
      showNotice("Please allow pop-ups to print the receipt.", "error");
      return;
    }
    onAudit?.("Printed official receipt", receipt.receipt_number);
  };

  const handleDownload = async (receipt) => {
    setDownloadingId(receipt.id);
    try {
      const response = await fetch(`${API_BASE}/api/official-receipts/${receipt.id}/pdf`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Could not download the PDF.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `official-receipt-${receipt.receipt_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showNotice(`${receipt.receipt_number} downloaded.`);
      onAudit?.("Downloaded official receipt PDF", receipt.receipt_number);
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <section className="management-page official-receipt-page">
        <div className="contract-alert">
          <Clock3 size={17} /> Loading official receipts...
        </div>
      </section>
    );
  }

  return (
    <section className="management-page official-receipt-page">
      <Breadcrumb />
      <div className="management-header">
        <div>
          <h2>Official Receipt Generation</h2>
          <p>
            Generate official receipts only from verified client payments. Every
            receipt is saved with its payment, invoice, contract and client details.
          </p>
        </div>
        <div className="management-actions">
          <button
            type="button"
            className="light-button"
            onClick={() => loadData(true)}
            disabled={refreshing}
          >
            <RotateCcw size={15} /> {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            className="light-button"
            onClick={() => navigate?.("Payment Recording")}
          >
            <ReceiptText size={15} /> Payment Recording
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => openGenerate(availablePayments[0])}
            disabled={!availablePayments.length}
            title={
              availablePayments.length
                ? "Generate from a verified payment"
                : "Verify a payment before generating an official receipt"
            }
          >
            <ShieldCheck size={15} /> Generate OR
          </button>
        </div>
      </div>

      {loadError && (
        <div className="contract-alert">
          <AlertTriangle size={17} />
          <span>{loadError}</span>
          <button type="button" className="light-button" onClick={() => loadData(true)}>
            Retry
          </button>
        </div>
      )}
      {notice && (
        <div className={`contract-alert or-notice ${notice.tone}`}>
          {notice.tone === "error" ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
          <span>{notice.message}</span>
        </div>
      )}

      <div className="or-summary-grid">
        <div className="or-summary-card total">
          <span className="or-summary-label">Total Receipts</span>
          <strong className="or-summary-value">{summary.total}</strong>
          <small className="or-summary-note">Database records</small>
        </div>
        <div className="or-summary-card issued">
          <span className="or-summary-label">Issued</span>
          <strong className="or-summary-value">{summary.Issued}</strong>
          <small className="or-summary-note">Active official receipts</small>
        </div>
        <div className="or-summary-card verified">
          <span className="or-summary-label">Verified &amp; Ready</span>
          <strong className="or-summary-value">{summary.available}</strong>
          <small className="or-summary-note">Available for OR generation</small>
        </div>
        <div className="or-summary-card issued-amount">
          <span className="or-summary-label">Issued Amount</span>
          <button
            type="button"
            className={`or-summary-value or-issued-amount-toggle ${issuedAmountRevealed ? "is-revealed" : "is-hidden"}`}
            onClick={() => setIssuedAmountRevealed((current) => !current)}
            aria-label={issuedAmountRevealed ? "Hide issued amount" : "Reveal issued amount"}
            aria-pressed={issuedAmountRevealed}
            title={issuedAmountRevealed ? "Click to hide issued amount" : "Click to reveal issued amount"}
          >
            <span aria-hidden="true">
              {issuedAmountRevealed ? money(summary.issued_amount) : "*"}
            </span>
          </button>
          <small className="or-summary-note">
            Issued + Reissued · {issuedAmountRevealed ? "Click amount to hide" : "Click * to reveal"}
          </small>
        </div>
      </div>

      <StatusLegend />

      <section className="or-available-panel">
        <div className="or-section-heading">
          <div>
            <h3>Verified Payments Ready for OR ({availablePayments.length})</h3>
            <p>Only verified payments without an active receipt appear here.</p>
          </div>
        </div>
        <div className="table-card or-table-card">
          <table>
            <thead><tr><th>Payment ID</th><th>Client</th><th>Invoice / Contract</th><th>Payment Date</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {availablePayments.length ? availablePayments.map((payment) => (
                <tr key={`available-${payment.id}`}>
                  <td className="link-cell">{display(payment.payment_id)}</td>
                  <td className="strong-cell">{display(payment.client_name)}<small>{display(payment.client_id)}</small></td>
                  <td>{display(payment.invoice_no)}<small>{display(payment.contract_no)}</small></td>
                  <td>{dateLabel(payment.receipt_date)}</td>
                  <td className="money-cell">{money(payment.amount_received)}</td>
                  <td><StatusBadge status="Verified" /></td>
                  <td><button type="button" className="or-generate-button" onClick={() => openGenerate(payment)}><ShieldCheck size={13} /> Generate OR</button></td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="empty">No verified payments are waiting for receipt generation.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="vendor-record-panel or-record-panel">
        <div className="or-section-heading">
          <div><h3>Official Receipt Records ({filteredReceipts.length})</h3><p>View, print, download or void persisted official receipts.</p></div>
        </div>
        <div className="or-toolbar">
          <label className="or-search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search receipt, payment, client, invoice..." /></label>
          <label><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All Statuses</option>{STATUS_ORDER.map((status) => <option key={status}>{status}</option>)}</select></label>
        </div>
        <div className="table-card or-table-card">
          <table>
            <thead><tr><th>Receipt No.</th><th>Receipt ID</th><th>Payment / Client</th><th>Invoice / Contract</th><th>Date Issued</th><th>Amount Received</th><th>OR Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredReceipts.length ? filteredReceipts.map((receipt) => (
                <tr key={receipt.id}>
                  <td className="link-cell">{display(receipt.receipt_number)}</td>
                  <td>{display(receipt.receipt_id)}</td>
                  <td className="strong-cell">{display(receipt.payment_id)}<small>{display(receipt.client_name)}</small></td>
                  <td>{display(receipt.invoice_no)}<small>{display(receipt.contract_no)}</small></td>
                  <td>{dateLabel(receipt.date_issued)}</td>
                  <td className="money-cell">
                    <ReceiptAmount
                      receipt={receipt}
                      revealed={revealedReceiptAmounts}
                      onToggle={toggleReceiptAmount}
                    />
                  </td>
                  <td><StatusBadge status={receipt.status} /></td>
                  <td>
                    <div className="or-row-actions">
                      <button type="button" title="View Receipt" aria-label={`View ${receipt.receipt_number}`} onClick={() => setDetail(receipt)}><Eye size={14} /></button>
                      <button type="button" title="Print" aria-label={`Print ${receipt.receipt_number}`} onClick={() => handlePrint(receipt)}><Printer size={14} /></button>
                      <button type="button" title="Download PDF" aria-label={`Download ${receipt.receipt_number} PDF`} onClick={() => handleDownload(receipt)} disabled={downloadingId === receipt.id}><FileDown size={14} /></button>
                      <button type="button" className="danger" title="Void" aria-label={`Void ${receipt.receipt_number}`} onClick={() => { setVoidReceipt(receipt); setVoidReason(""); }} disabled={!receipt.can_void}><Ban size={14} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={8} className="empty">No official receipts match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {generatePayment && (
        <div className="modal-overlay" onClick={() => !saving && setGeneratePayment(null)}>
          <div className="modal official-receipt-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div><h2>Generate Official Receipt</h2><p>Only a verified payment can be issued.</p></div>
              <button type="button" onClick={() => setGeneratePayment(null)} aria-label="Close"><X size={15} /></button>
            </div>
            <div className="official-receipt-modal-body">
              <div className="or-payment-preview">
                <StatusBadge status="Verified" />
                <div><strong>{display(generatePayment.client_name)}</strong><span>{display(generatePayment.payment_id)} · {display(generatePayment.invoice_no)}</span></div>
                <b>{money(generatePayment.amount_received)}</b>
              </div>
              <dl className="aging-detail-grid">
                <div><dt>Payment Date</dt><dd>{dateLabel(generatePayment.receipt_date)}</dd></div>
                <div><dt>Payment Method</dt><dd>{display(generatePayment.payment_method)}</dd></div>
                <div><dt>Reference No.</dt><dd>{display(generatePayment.reference_number)}</dd></div>
                <div><dt>Verified By</dt><dd>{display(generatePayment.verified_by)}</dd></div>
                <div><dt>Payment For</dt><dd>{display(generatePayment.payment_for)}</dd></div>
                <div><dt>Amount in Words</dt><dd>{display(generatePayment.amount_in_words)}</dd></div>
              </dl>
            </div>
            <div className="modal-footer">
              <button type="button" className="light-button" onClick={() => setGeneratePayment(null)} disabled={saving}>Cancel</button>
              <button type="button" className="primary-button" onClick={handleGenerate} disabled={saving}><ShieldCheck size={14} /> {saving ? "Generating…" : "Confirm & Generate OR"}</button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal official-receipt-modal official-receipt-detail" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div><h2>Official Receipt</h2><p>{display(detail.receipt_number)} · {display(detail.receipt_id)}</p></div>
              <button type="button" onClick={() => setDetail(null)} aria-label="Close"><X size={15} /></button>
            </div>
            <div className="official-receipt-modal-body">
              <div className="or-detail-hero">
                <div><span>Client</span><strong>{display(detail.client_name)}</strong><small>{display(detail.client_id)}</small></div>
                <div><span>Amount Received</span><strong>{money(detail.amount_received)}</strong><StatusBadge status={detail.status} /></div>
              </div>
              <dl className="aging-detail-grid">
                <div><dt>Receipt ID</dt><dd>{display(detail.receipt_id)}</dd></div>
                <div><dt>Receipt No.</dt><dd>{display(detail.receipt_number)}</dd></div>
                <div><dt>Payment ID</dt><dd>{display(detail.payment_id)}</dd></div>
                <div><dt>Payment Date</dt><dd>{dateLabel(detail.receipt_date)}</dd></div>
                <div><dt>Billing Address</dt><dd>{display(detail.billing_address)}</dd></div>
                <div><dt>Invoice No.</dt><dd>{display(detail.invoice_no)}</dd></div>
                <div><dt>Contract No.</dt><dd>{display(detail.contract_no)}</dd></div>
                <div><dt>Payment Method</dt><dd>{display(detail.payment_method)}</dd></div>
                <div><dt>Bank Account</dt><dd>{display(detail.bank_account)}</dd></div>
                <div><dt>Reference No.</dt><dd>{display(detail.reference_number)}</dd></div>
                <div className="full"><dt>Amount in Words</dt><dd>{display(detail.amount_in_words)}</dd></div>
                <div className="full"><dt>Payment For</dt><dd>{display(detail.payment_for)}</dd></div>
                <div><dt>Prepared By</dt><dd>{display(detail.prepared_by)}</dd></div>
                <div><dt>Verified By</dt><dd>{display(detail.verified_by)}</dd></div>
                <div><dt>OR Status</dt><dd><StatusBadge status={detail.status} /></dd></div>
                <div><dt>Date Issued</dt><dd>{dateLabel(detail.date_issued)}</dd></div>
                {detail.status === "Voided" && <div className="full"><dt>Void Reason</dt><dd>{display(detail.void_reason)}</dd></div>}
              </dl>
            </div>
            <div className="modal-footer">
              <button type="button" className="light-button" onClick={() => handlePrint(detail)}><Printer size={14} /> Print</button>
              <button type="button" className="light-button" onClick={() => handleDownload(detail)} disabled={downloadingId === detail.id}><FileDown size={14} /> Download PDF</button>
              {detail.can_void && (
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => {
                    setVoidReceipt(detail);
                    setVoidReason("");
                  }}
                >
                  <Ban size={14} /> Void
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {voidReceipt && (
        <div className="modal-overlay" onClick={() => !saving && setVoidReceipt(null)}>
          <form className="modal official-receipt-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()} onSubmit={handleVoid}>
            <div className="modal-header">
              <div><h2>Void Official Receipt</h2><p>{display(voidReceipt.receipt_number)}</p></div>
              <button type="button" onClick={() => setVoidReceipt(null)} aria-label="Close"><X size={15} /></button>
            </div>
            <div className="official-receipt-modal-body">
              <div className="contract-alert"><AlertTriangle size={17} /><span>Voiding permanently invalidates this receipt. A verified payment may then be reissued with a new receipt number.</span></div>
              <label className="or-void-field">Void Reason *<textarea rows="4" value={voidReason} onChange={(event) => setVoidReason(event.target.value)} placeholder="State the reason this receipt is being voided…" required autoFocus /></label>
            </div>
            <div className="modal-footer">
              <button type="button" className="light-button" onClick={() => setVoidReceipt(null)} disabled={saving}>Cancel</button>
              <button type="submit" className="danger-button" disabled={saving}>{saving ? "Voiding…" : "Confirm Void"}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export default OfficialReceiptGenerationPage;
