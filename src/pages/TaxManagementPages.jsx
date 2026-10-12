import React, { useMemo, useState, useEffect } from "react";
import {
  FileText,
  ReceiptText,
  ShieldCheck,
  Search,
  Printer,
  FileDown,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Eye,
  Calendar,
  Edit3,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import RevealableAmount from "../components/RevealableAmount";
import RevealableText from "../components/RevealableText";

const API_BASE = import.meta.env.VITE_API_URL || "";
// Tax Calculation reads its records from the same Node backend as the other modules
// (GET /api/tax/calculations). Nothing here is typed in: the cards, the table and
// the detail panel all derive from what the API returns.
//
// The money is derived server-side. The React page only reads taxable_amount,
// tax_amount, withholding_tax and total_tax, so the browser can never be the place
// where a tax figure was worked out. A record's colour comes from the status the
// API returned, through taxStatusClass.

const TAX_TYPES = ['VAT', 'Withholding Tax', 'Tax-Exempt', 'Zero-Rated'];
const TAX_STATUSES = ['Pending Review', 'Calculated', 'Verified', 'Rejected', 'Cancelled'];
const TAX_TRANSACTION_TYPES = [
  'Service Invoice', 'Client Payment', 'Supplier Payment',
  'Utility Bill', 'Office Expense', 'Vendor Invoice',
];
const TAX_ADJUSTMENT_REASONS = [
  'Tax-exempt amount',
  'Zero-rated amount',
  'Taxable adjustment',
  'Withholding tax',
  'Discount affecting taxable amount',
  'Tax credit',
  'Previous tax adjustment',
  'Other approved adjustment',
];

const taxMoney = (value) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const taxDate = (ymd) => {
  if (!ymd) return "—";
  const date = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const taxDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const taxBlank = (v) => (v === null || v === undefined || v === "" || v === "—" ? "—" : v);

const taxTodayYmd = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const taxSlug = (s) => String(s ?? "").trim().toLowerCase().replace(/\s+/g, "-");

// Keyed on the status the API returned. An unknown status falls back to the neutral
// class rather than silently borrowing another status's colour.
const TAX_STATUS_CLASS = {
  "pending-review": "tx-pending", calculated: "tx-calculated",
  verified: "tx-verified", rejected: "tx-rejected", cancelled: "tx-cancelled",
};
const taxStatusClass = (status) => `contract-status tx-status ${TAX_STATUS_CLASS[taxSlug(status)] || "tx-neutral"}`;

const TAX_TYPE_CLASS = {
  vat: "tx-vat", "withholding-tax": "tx-wht", "tax-exempt": "tx-exempt", "zero-rated": "tx-zero",
};
const taxTypeClass = (type) => `tx-type ${TAX_TYPE_CLASS[taxSlug(type)] || "tx-neutral"}`;

const taxFailure = (error, context) => {
  if (error && error.kind === "network") {
    return `The backend did not answer while loading ${context}. Start it with "npm start" in the Backend folder, then try again.`;
  }
  if (error && error.kind === "http") {
    return `The backend rejected the request for ${context} (HTTP ${error.status})${error.detail ? `: ${error.detail}` : "."}`;
  }
  return `${context} could not be loaded: ${(error && error.message) || "unknown error"}.`;
};

const taxRequest = async (url, options = {}) => {
  let response;
  try {
    response = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  } catch (cause) {
    const error = new Error("The backend could not be reached.");
    error.kind = "network";
    error.cause = cause;
    throw error;
  }
  const text = await response.text();
  let payload = null;
  if (text) { try { payload = JSON.parse(text); } catch { payload = null; } }
  if (!response.ok) {
    const error = new Error(payload?.message || response.statusText || "Request failed");
    error.kind = "http";
    error.status = response.status;
    error.detail = payload?.message || null;
    // The API can return several validation findings; they are surfaced together
    // rather than showing only the first.
    error.findings = payload?.errors || null;
    throw error;
  }
  return payload;
};

// A card's peso total stays hidden as "*" until that card is clicked, matching the
// other payable modules. Each card has its own reveal key.
//
// `forceOpen` lets a page-wide "Show amounts" switch override the individual state
// without altering it, so turning the switch off restores whatever the user had
// revealed before rather than resetting everything.
const TaxCardAmount = ({ id, value, revealed, onToggle, tone, forceOpen = false }) => {
  const isOpen = forceOpen || Boolean(revealed[id]);
  return (
    <strong
      className={`vendor-summary-amount payable-card-amount ${isOpen ? "is-open" : ""} ${tone}`}
      role="button"
      tabIndex={0}
      aria-label={isOpen ? `Hide total, currently ${taxMoney(value)}` : "Reveal total"}
      title={isOpen ? "Click to hide amount" : "Click to reveal amount"}
      onClick={event => { event.stopPropagation(); onToggle(id); }}
      onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onToggle(id); } }}
    >
      {isOpen ? taxMoney(value) : "*"}
    </strong>
  );
};

const TaxMasked = ({ rowId, value, revealed, onToggle, forceOpen = false }) => {
  const key = `${rowId}-amount`;
  const isOpen = forceOpen || Boolean(revealed[key]);
  return (
    <span
      className="masked-amount"
      role="button"
      tabIndex={0}
      aria-label={isOpen ? `Hide amount, currently ${taxMoney(value)}` : "Reveal amount"}
      title={isOpen ? "Click to hide amount" : "Click to reveal amount"}
      onClick={event => { event.stopPropagation(); onToggle(key); }}
      onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onToggle(key); } }}
    >
      {isOpen ? taxMoney(value) : "*"}
    </span>
  );
};

// ============================================================
// Tax Records page
// ============================================================
//
// The permanent filed history, downstream of Tax Calculation. It reuses the tax
// module's helpers (taxRequest, taxMoney, taxDate, taxFailure, the masked-amount
// widgets) so the two tax pages look and behave identically.
//
// Every figure below is read from the API. The page never computes a total of its own
// beyond the arithmetic the user can see on screen, and it never derives a status: the
// badge class comes from whatever status the backend returned, so a record the API
// reports as Filed always renders as Filed.

// New Tax Record. A record is normally PROMOTED from a reviewed calculation rather than
// typed, because the figures then come from the working paper and cannot disagree with
// it. The eligible list is what the API says may still be filed; anything already
// recorded, or not yet reviewed, is not offered.
const TaxRecordIntakeModal = ({ eligible, saving, onClose, onSubmit }) => {
  const [choice, setChoice] = useState(eligible[0] ? String(eligible[0].id) : "");
  const selected = eligible.find(c => String(c.id) === choice) || null;
  return <div className="modal-overlay" onClick={() => !saving && onClose()}>
    <div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <div>
          <h2>New Tax Record</h2>
          <p>Created from a calculation that has already been reviewed.</p>
        </div>
        <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
      </div>
      <div className="form-grid">
        {eligible.length === 0
          ? <p className="full">No reviewed calculation is waiting to be filed. Open Tax Calculation and verify a calculation first.</p>
          : <>
            <label className="full">Reviewed Calculation
              <select value={choice} onChange={e => setChoice(e.target.value)}>
                {eligible.map(c => <option key={c.id} value={c.id}>{c.tax_calculation_id} — {c.transaction_type} — {taxBlank(c.reference_number)}</option>)}
              </select>
            </label>
            {selected && <>
              <label>Client / Supplier<input readOnly value={taxBlank(selected.client_supplier)} /></label>
              <label>Tax Type<input readOnly value={`${selected.tax_type} @ ${selected.tax_rate}%`} /></label>
              <label>Taxable Amount<input readOnly value={taxMoney(selected.taxable_amount)} /></label>
              <label>Tax Amount<input readOnly value={taxMoney(selected.tax_amount)} /></label>
              <label>Withholding Tax<input readOnly value={taxMoney(selected.withholding_tax)} /></label>
              <label>Final Tax Amount<input readOnly value={taxMoney(selected.final_tax_amount)} /></label>
            </>}
          </>}
      </div>
      <div className="modal-footer">
        <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="button" className="primary" disabled={saving || !selected}
          onClick={() => onSubmit({ source_calculation_id: Number(choice) })}>
          {saving ? "Creating..." : "Create Record"}
        </button>
      </div>
    </div>
  </div>;
};


// Edit. A Filed or Cancelled record is closed to editing by the API, and the form says
// so rather than letting the user fill in fields that will be refused on save.
const TaxRecordEditModal = ({ record, saving, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    transaction_type: record.transaction_type || "",
    reference_number: record.reference_number || "",
    client_supplier: record.client_supplier || "",
    tax_type: record.tax_type || "VAT",
    tax_rate: String(record.tax_rate ?? 12),
    taxable_amount: String(record.taxable_amount ?? 0),
    tax_amount: String(record.tax_amount ?? 0),
    withholding_tax: String(record.withholding_tax ?? 0),
    tax_adjustment: String(record.tax_adjustment ?? 0),
    remarks: record.remarks || "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const locked = record.record_status === "Filed" || record.record_status === "Cancelled";
  // Preview of the identity the API enforces, so the arithmetic is visible before saving
  // rather than reported as a 422 afterwards.
  const preview = Math.round(((Number(form.tax_amount) || 0) - (Number(form.withholding_tax) || 0) + (Number(form.tax_adjustment) || 0)) * 100) / 100;

  return <div className="modal-overlay" onClick={() => !saving && onClose()}>
    <form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => {
      e.preventDefault();
      onSubmit({
        transaction_type: form.transaction_type,
        reference_number: form.reference_number,
        client_supplier: form.client_supplier,
        tax_type: form.tax_type,
        tax_rate: Number(form.tax_rate),
        taxable_amount: Number(form.taxable_amount),
        tax_amount: Number(form.tax_amount),
        withholding_tax: Number(form.withholding_tax),
        tax_adjustment: Number(form.tax_adjustment),
        remarks: form.remarks,
      });
    }}>
      <div className="modal-header">
        <div>
          <h2>Edit {record.tax_record_id}</h2>
          <p>
            {locked
              ? `${record.tax_record_id} is ${record.record_status.toLowerCase()} and can no longer be edited.`
              : record.record_status === "Verified"
                ? "Already verified — the amounts cannot be changed."
                : <>Currently <RevealableAmount value={taxMoney(record.final_tax_amount)} /> final tax.</>}
          </p>
        </div>
        <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
      </div>
      <div className="form-grid">
        <label>Transaction Type<input value={form.transaction_type} disabled={locked || saving} onChange={e => set("transaction_type", e.target.value)} /></label>
        <label>Reference Number<input value={form.reference_number} disabled={locked || saving} onChange={e => set("reference_number", e.target.value)} /></label>
        <label className="full">Client / Supplier<input value={form.client_supplier} disabled={locked || saving} onChange={e => set("client_supplier", e.target.value)} /></label>
        <label>Tax Type
          <select value={form.tax_type} disabled={locked || saving} onChange={e => set("tax_type", e.target.value)}>
            {TAX_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label>Tax Rate (%)<input type="number" min="0" max="100" step="0.01" value={form.tax_rate} disabled={locked || saving} onChange={e => set("tax_rate", e.target.value)} /></label>
        <label>Taxable Amount<input type="number" min="0" step="0.01" value={form.taxable_amount} disabled={locked || saving} onChange={e => set("taxable_amount", e.target.value)} /></label>
        <label>Tax Amount<input type="number" min="0" step="0.01" value={form.tax_amount} disabled={locked || saving} onChange={e => set("tax_amount", e.target.value)} /></label>
        <label>Withholding Tax<input type="number" min="0" step="0.01" value={form.withholding_tax} disabled={locked || saving} onChange={e => set("withholding_tax", e.target.value)} /></label>
        <label>Tax Adjustment<input type="number" step="0.01" value={form.tax_adjustment} disabled={locked || saving} onChange={e => set("tax_adjustment", e.target.value)} /></label>
        <label className="full">Remarks<textarea rows="2" value={form.remarks} disabled={locked || saving} onChange={e => set("remarks", e.target.value)} /></label>
        <p className="full">Tax less withholding, plus adjustment: <strong><RevealableAmount value={taxMoney(preview)} /></strong> (stored: <RevealableAmount value={taxMoney(record.final_tax_amount)} />)</p>
      </div>
      <div className="modal-footer">
        <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="primary" disabled={saving || locked}>{saving ? "Saving..." : "Save Changes"}</button>
      </div>
    </form>
  </div>;
};


// Record a remittance. The amount is capped at what is still outstanding, because paying
// more than was filed would overstate what was remitted to the authority.
const TaxRecordRemitModal = ({ record, saving, onClose, onSubmit }) => {
  const remaining = Number(record.tax_remaining) || 0;
  const [amount, setAmount] = useState(String(remaining));
  const value = Number(amount) || 0;
  const invalid = value <= 0 || value > remaining;
  return <div className="modal-overlay" onClick={() => !saving && onClose()}>
    <form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); onSubmit(value); }}>
      <div className="modal-header">
        <div><h2>Record Remittance</h2><p><RevealableText value={record.tax_record_id} /> — <RevealableAmount value={taxMoney(remaining)} /> outstanding</p></div>
        <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
      </div>
      <div className="form-grid">
        <label>Final Tax Amount<input readOnly value={taxMoney(record.final_tax_amount)} /></label>
        <label>Already Paid<input readOnly value={taxMoney(record.tax_paid)} /></label>
        <label className="full">Amount Remitted<input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /></label>
        {value > remaining && <p className="full">That is more than the <RevealableAmount value={taxMoney(remaining)} /> still outstanding.</p>}
        {value <= 0 && <p className="full">Enter an amount greater than zero.</p>}
      </div>
      <div className="modal-footer">
        <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="primary" disabled={saving || invalid}>{saving ? "Recording..." : "Record Remittance"}</button>
      </div>
    </form>
  </div>;
};

// File the return. This is the terminal step: the API locks the record afterwards, so
// the modal says so before the user commits rather than after.
const TaxRecordFileModal = ({ record, saving, onClose, onSubmit }) => {
  const [returnNumber, setReturnNumber] = useState(record.return_number || "");
  return <div className="modal-overlay" onClick={() => !saving && onClose()}>
    <form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); onSubmit(returnNumber.trim()); }}>
      <div className="modal-header">
        <div>
          <h2>File Return</h2>
          <p>{record.tax_record_id} — final tax <RevealableAmount value={taxMoney(record.final_tax_amount)} /></p>
        </div>
        <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
      </div>
      <div className="form-grid">
        <p className="full">Filing submits this return and closes the record. A filed record can no longer be edited — only cancelled and replaced — so check the figures first.</p>
        <label className="full">Return Number<input value={returnNumber} placeholder="e.g. BIR-2550-Q3" onChange={e => setReturnNumber(e.target.value)} /></label>
      </div>
      <div className="modal-footer">
        <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="primary" disabled={saving || !returnNumber.trim()}>{saving ? "Filing..." : "File Return"}</button>
      </div>
    </form>
  </div>;
};

// Cancel. A reason is required by the API, and the field is mandatory here for the same
// reason: a cancelled filing drops out of the totals and has to stay explainable.
const TaxRecordCancelModal = ({ record, saving, onClose, onSubmit }) => {
  const [reason, setReason] = useState("");
  return <div className="modal-overlay" onClick={() => !saving && onClose()}>
    <form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); onSubmit(reason.trim()); }}>
      <div className="modal-header">
        <div><h2>Cancel {record.tax_record_id}</h2><p>Final tax <RevealableAmount value={taxMoney(record.final_tax_amount)} /></p></div>
        <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
      </div>
      <div className="form-grid">
        <p className="full">This record will be marked Cancelled and drop out of the filing totals. It stays in the ledger with its full history.</p>
        <label className="full">Cancellation Reason<textarea rows="3" value={reason} onChange={e => setReason(e.target.value)} /></label>
      </div>
      <div className="modal-footer">
        <button type="button" onClick={onClose} disabled={saving}>Keep Record</button>
        <button type="submit" className="primary" disabled={saving || !reason.trim()}>{saving ? "Cancelling..." : "Cancel Record"}</button>
      </div>
    </form>
  </div>;
};


// Row overflow menu. Each action is disabled with a stated reason rather than hidden,
// so an unavailable step is explained instead of silently missing.
const TaxRecordMenu = ({ record, saving, onClose, onEdit, onRemit, onFile, onCancel }) => {
  const closed = record.record_status === "Filed";
  const cancelled = record.record_status === "Cancelled";
  const settled = record.payment_status === "Paid";
  return <div className="vendor-action-menu" onClick={e => e.stopPropagation()}>
    <button disabled={saving || closed || cancelled} title={closed ? `${record.tax_record_id} is filed and can no longer be edited.` : cancelled ? `${record.tax_record_id} is cancelled.` : "Edit this record"} onClick={onEdit}>✏ Edit Record</button>
    <button disabled={saving || cancelled || settled || record.final_tax_amount <= 0}
      title={cancelled ? `${record.tax_record_id} is cancelled.` : settled ? `${record.tax_record_id} is paid in full — nothing left to remit.` : record.final_tax_amount <= 0 ? `${record.tax_record_id} has no final tax amount to remit.` : "Record a remittance to the authority"}
      onClick={onRemit}>₳ Record Remittance</button>
    <button disabled={saving || record.record_status !== "Verified"}
      title={record.record_status !== "Verified" ? `${record.tax_record_id} must be verified before it can be filed.` : "Submit the return and lock the record"}
      onClick={onFile}>🖹 File Return</button>
    <button disabled={saving || closed || cancelled}
      title={closed ? `${record.tax_record_id} is already filed.` : cancelled ? `${record.tax_record_id} is already cancelled.` : "Cancel this record"}
      onClick={onCancel}>✕ Cancel Record</button>
    <button disabled={saving} onClick={onClose}>Close</button>
  </div>;
};

const TaxRecordDetail = ({ record, tab, setTab, revealed, toggle, saving, onVerify, onForFiling, onPrint }) => {
  const money = (field, key) => <TaxMasked rowId={`${record.id}-${key}`} value={record[field]} revealed={revealed} onToggle={toggle} />;
  const trail = Array.isArray(record.history) ? record.history : [];
  const tabs = ["Record", "Computation", "Filing", "History"];
  return <div className="vendor-detail-panel">
    <div className="vendor-detail-header">
      <div>
        <strong>{record.tax_record_id}</strong>
        <span className="vendor-detail-kicker">{taxBlank(record.client_supplier)} &middot; {taxBlank(record.reference_number)}</span>
      </div>
      <div className="vendor-detail-block">
        <span className={taxRecordBadge(record.record_status, TAX_RECORD_STATUS_CLASS)}>{record.record_status}</span>
        <span className={taxRecordBadge(record.filing_status, TAX_FILING_STATUS_CLASS)}>{record.filing_status}</span>
        <span className={taxRecordBadge(record.payment_status, TAX_PAYMENT_STATUS_CLASS)}>{record.payment_status}</span>
      </div>
      <div className="vendor-detail-actions">
        {record.record_status === "Draft" && <button className="light-button" disabled={saving} onClick={onVerify}>✓ Verify</button>}
        {record.record_status === "Verified" && <button className="light-button" disabled={saving} onClick={onForFiling}>🖹 For Filing</button>}
        <button className="light-button" onClick={onPrint}>🖨 Print</button>
      </div>
    </div>

    <div className="vendor-detail-tabs">
      {tabs.map(t => <button key={t} className={tab === t ? "is-active" : ""} onClick={() => setTab(t)}>{t}</button>)}
    </div>

    {tab === "Record" && <div className="vendor-detail-grid">
      <div className="vendor-detail-list">
        <h4>Transaction</h4>
        <div><span>Tax Record ID</span><b>{record.tax_record_id}</b></div>
        <div><span>Tax Period</span><b>{taxBlank(record.tax_period)}</b></div>
        <div><span>Transaction Date</span><b>{taxDate(record.transaction_date)}</b></div>
        <div><span>Transaction Type</span><b>{taxBlank(record.transaction_type)}</b></div>
        <div><span>Reference Number</span><b><RevealableText value={taxBlank(record.reference_number)} /></b></div>
        <div><span>Client / Supplier</span><b><RevealableText value={taxBlank(record.client_supplier)} /></b></div>
        <div><span>Source Calculation</span><b>{taxBlank(record.source_reference)}</b></div>
      </div>
      <div className="vendor-detail-list">
        <h4>Signatories</h4>
        <div><span>Calculated By</span><b><RevealableText value={taxBlank(record.calculated_by)} /></b></div>
        <div><span>Verified By</span><b><RevealableText value={taxBlank(record.verified_by)} /></b></div>
        <div><span>Verified On</span><b>{taxDate(record.verified_on)}</b></div>
        <div><span>Filed By</span><b><RevealableText value={taxBlank(record.filed_by)} /></b></div>
        <div><span>Filed On</span><b>{taxDate(record.filed_on)}</b></div>
        <div><span>Created Date</span><b>{taxDate(record.created_date)}</b></div>
      </div>
      {record.remarks && <div className="vendor-detail-list"><h4>Remarks</h4><p className="vendor-detail-note"><RevealableText value={record.remarks} /></p></div>}
    </div>}

    {tab === "Computation" && <div className="vendor-detail-grid">
      <div className="vendor-detail-list">
        <h4>Tax Computation</h4>
        <div><span>Tax Type</span><b><span className={taxTypeClass(record.tax_type)}>{record.tax_type}</span></b></div>
        <div><span>Taxable Amount</span><b className="money-cell">{money("taxable_amount", "d-taxable")}</b></div>
        <div><span>Tax Rate</span><b>{record.tax_rate}%</b></div>
        <div><span>Tax Amount</span><b className="money-cell">{money("tax_amount", "d-tax")}</b></div>
        <div><span>Less: Withholding Tax</span><b className="money-cell">{money("withholding_tax", "d-wht")}</b></div>
        <div><span>Tax Adjustment</span><b className="money-cell">{money("tax_adjustment", "d-adj")}</b></div>
      </div>
      <div className="vendor-detail-list">
        <h4>Final Position</h4>
        <div><span>Final Tax Amount</span><b className="money-cell">{money("final_tax_amount", "d-final")}</b></div>
        <div><span>Tax Paid</span><b className="money-cell">{money("tax_paid", "d-paid")}</b></div>
        <div><span>Outstanding</span><b className="money-cell">{money("tax_remaining", "d-rem")}</b></div>
        <div><span>Record Status</span><b>{record.record_status}</b></div>
        <div><span>Payment Status</span><b>{record.payment_status}</b></div>
      </div>
    </div>}

    {tab === "Filing" && <div className="vendor-detail-grid">
      <div className="vendor-detail-list">
        <h4>Filing</h4>
        <div><span>Record Status</span><b>{record.record_status}</b></div>
        <div><span>Filing Status</span><b>{record.filing_status}</b></div>
        <div><span>Return Number</span><b>{taxBlank(record.return_number)}</b></div>
        <div><span>Filed On</span><b>{taxDate(record.filed_on)}</b></div>
        <div><span>Filed By</span><b>{taxBlank(record.filed_by)}</b></div>
      </div>
      <div className="vendor-detail-list">
        <h4>Remittance</h4>
        <div><span>Payment Status</span><b>{record.payment_status}</b></div>
        <div><span>Final Tax Amount</span><b className="money-cell">{money("final_tax_amount", "f-final")}</b></div>
        <div><span>Tax Paid</span><b className="money-cell">{money("tax_paid", "f-paid")}</b></div>
        <div><span>Outstanding</span><b className="money-cell">{money("tax_remaining", "f-rem")}</b></div>
      </div>
    </div>}

    {tab === "History" && <div className="vendor-timeline">
      {trail.length === 0 ? <p className="vendor-detail-note">No history recorded yet.</p>
        : trail.map((h, i) => <div className="vendor-timeline-item" key={h.id || i}>
          <span className="vendor-timeline-dot" />
          <div>
            <strong>{h.action}</strong>
            <span className="vendor-timeline-meta">{taxDateTime(h.created_at)} &middot; {taxBlank(h.actor)}</span>
            {h.remarks && <p>{h.remarks}</p>}
          </div>
        </div>)}
    </div>}
  </div>;
};

const TAX_RECORD_STATUSES_LOCAL = ["Draft", "Verified", "Filed", "Cancelled"];

const TAX_RECORD_FILING_STATUSES = ["Not Filed", "For Filing", "Filed"];
const TAX_RECORD_PAYMENT_STATUSES = ["Unpaid", "Partially Paid", "Paid"];

// Three separate axes, each with its own colour. Filing and record status are NOT the
// same thing: a record can be Verified (reviewed) while still Not Filed (not submitted),
// and it can be Filed (submitted) while Partially Paid (money still outstanding).
const TAX_RECORD_STATUS_CLASS = {
  draft: "tx-pending", verified: "tx-verified", filed: "tx-approved", cancelled: "tx-cancelled",
};
const TAX_FILING_STATUS_CLASS = {
  "not-filed": "tx-neutral", "for-filing": "tx-calculated", filed: "tx-approved",
};
const TAX_PAYMENT_STATUS_CLASS = {
  unpaid: "tx-neutral", "partially-paid": "tx-pending", paid: "tx-verified",
};

const taxRecordBadge = (status, map, prefix) =>
  `contract-status tx-status ${map[taxSlug(status)] || "tx-neutral"} ${prefix || ""}`;

// ============================================================
// Tax Filing Preparation page
// ============================================================
//
// Nothing on this page is typed in. The return's figures are assembled by the API from
// the live transaction tables (billings, payments, supplier_payments, utility_payments,
// office_expenses, vendor_payments) and re-derived on every read, so a new invoice or
// expense anywhere in PrimePower moves these totals. The page only displays what the API
// returns and sends workflow actions back.
//
// It reuses the tax module's helpers (taxRequest, taxMoney, taxDate, taxFailure,
// TaxCardAmount, TaxMasked) so all three tax pages look and behave identically.

// Row overflow menu. A blocked action states why in its title and stays dimmed rather
// than disappearing, so the workflow is always legible.
const TaxFilingMenu = ({ filing, saving, onClose, onEdit, onProfile, onDelete }) => {
  const filed = filing.filing_status === 'Filed';
  return <div className="vendor-action-menu" onClick={e => e.stopPropagation()}>
    <button disabled={saving || filed} title={filed ? `${filing.filing_id} has been filed and is closed.` : 'Edit the filing period and details'} onClick={onEdit}>✏ Edit Preparation</button>
    <button disabled={saving} title="Edit the company name, TIN and taxpayer details used on every return" onClick={onProfile}>🏢 Taxpayer Information</button>
    <button disabled={saving || filed} title={filed ? `${filing.filing_id} has been filed and cannot be deleted.` : 'Delete this preparation'} onClick={onDelete}>🗑 Delete</button>
    <button disabled={saving} onClick={onClose}>Close</button>
  </div>;
};

const TaxFilingDetail = ({ filing, tab, setTab, revealed, toggle, saving, onPrint, onDoc, onProfile, onSubmit, onApprove, onAdvance }) => {
  const s = filing.summary;
  const v = s.validation;
  const money = (field, key) => <TaxMasked rowId={`${filing.id}-${key}`} value={field} revealed={revealed} onToggle={toggle} />;
  const tabs = ['Summary', 'Transactions', 'Withholding', 'Documents', 'Validation'];

  return <div className="vendor-detail-panel">
    <div className="vendor-detail-header">
      <div>
        <strong>{filing.filing_id}</strong>
        <span className="vendor-detail-kicker">{filing.tax_type} &middot; {filing.period_label}</span>
      </div>
      <div className="vendor-detail-block">
        <span className={filingBadge(filing.filing_status, FILING_STATUS_CLASS)}>{filing.filing_status}</span>
        <span className={`tf-readiness ${filing.readiness === 100 ? "is-full" : ""}`}>{filing.readiness}% ready</span>
      </div>
      <div className="vendor-detail-actions">
        {filing.can_submit && <button className="light-button" disabled={saving} onClick={onSubmit}>Submit for Review</button>}
        {filing.can_mark_ready && <button className="light-button" disabled={saving} onClick={onApprove}>✓ Approve</button>}
        {filing.can_file && <button className="primary-button" disabled={saving} onClick={() => onAdvance("Filed")}>🖹 File Return</button>}
        {!filing.can_mark_ready && !filing.can_file && v.errors > 0 && <button className="light-button" disabled title={filing.blocking_reasons.join(' · ')}>Mark Ready</button>}
        <button className="light-button" disabled={saving} onClick={onProfile}>🏢</button>
        <button className="light-button" onClick={onPrint}>🖨</button>
      </div>
    </div>

    <div className="vendor-detail-tabs">
      {tabs.map(t => <button key={t} className={tab === t ? "is-active" : ""} onClick={() => setTab(t)}>{t}</button>)}
    </div>

    {tab === "Summary" && <div className="vendor-detail-grid">
      <div className="vendor-detail-list">
        <h4>Taxable Sales</h4>
        <div><span>Gross Sales</span><b className="money-cell">{money(s.sales.gross, "s-gross")}</b></div>
        <div><span>VATable Sales</span><b className="money-cell">{money(s.sales.taxable, "s-taxable")}</b></div>
        <div><span>Zero-Rated Sales</span><b className="money-cell">{money(s.sales.zero_rated, "s-zero")}</b></div>
        <div><span>Exempt Sales</span><b className="money-cell">{money(s.sales.exempt, "s-exempt")}</b></div>
        <div><span>Output Tax ({s.sales.rate}%)</span><b className="money-cell">{money(s.computation.output_tax, "s-out")}</b></div>
      </div>
      <div className="vendor-detail-list">
        <h4>Purchases / Expenses</h4>
        <div><span>Total Purchases</span><b className="money-cell">{money(s.purchases.gross, "p-gross")}</b></div>
        <div><span>VATable Purchases</span><b className="money-cell">{money(s.purchases.taxable, "p-taxable")}</b></div>
        <div><span>Exempt Purchases</span><b className="money-cell">{money(s.purchases.exempt, "p-exempt")}</b></div>
        <div><span>Input Tax ({s.purchases.rate}%)</span><b className="money-cell">{money(s.computation.input_tax, "p-in")}</b></div>
        <div><span>Client Payments Received</span><b className="money-cell">{money(s.receipts.gross, "p-receipts")}</b></div>
      </div>
      <div className="vendor-detail-list">
        <h4>Tax Computation</h4>
        {/* The waterfall is shown in full rather than collapsed into one figure. "Tax
            Payable" and "Credit" are different outcomes, and a reader cannot tell which
            applies without seeing that the prior credit was applied first. */}
        <div><span>Output Tax</span><b className="money-cell">{money(s.computation.output_tax, "c-out")}</b></div>
        <div><span>Less: Input Tax</span><b className="money-cell">{money(s.computation.input_tax, "c-in")}</b></div>
        <div className="tf-computation-sub">
          <span>This period&rsquo;s result</span>
          <b className="money-cell">{money(Math.abs(Number(s.computation.period_net || 0)), "c-period")}</b>
        </div>
        {Number(s.computation.prior_credit || 0) > 0 && <div className="tf-computation-sub">
          <span>Less: credit from earlier returns</span>
          <b className="money-cell">{money(s.computation.prior_credit, "c-prior")}</b>
        </div>}
        <div className="tf-computation-total">
          <span>Tax Payable</span>
          <b className="money-cell">{money(s.computation.payable, "c-payable")}</b>
        </div>
        <div className={Number(s.computation.credit || 0) > 0 ? "tf-computation-credit" : "tf-computation-sub"}>
          <span>Credit carried forward</span>
          <b className="money-cell">{money(s.computation.credit, "c-credit")}</b>
        </div>
        <div><span>Withholding Credited</span><b className="money-cell">{money(s.withholding.total, "c-wht")}</b></div>
        {Array.isArray(filing.credit_chain) && filing.credit_chain.length > 0 && <>
          <h4 className="tf-chain-title">Credit carried in from</h4>
          <ul className="tf-chain-list">
            {filing.credit_chain.map((c, i) => <li key={i}>
              <span className="mono">{c.filing_id}</span>
              <span>
                {c.credit_earned > 0
                  ? <>earned <RevealableAmount value={taxMoney(c.credit_earned)} /> credit</>
                  : <>used <RevealableAmount value={taxMoney(c.credit_used)} /> of credit</>}
                {c.balance_after > 0 && <> &middot; balance <RevealableAmount value={taxMoney(c.balance_after)} /></>}
              </span>
            </li>)}
          </ul>
        </>}
      </div>
      <div className="vendor-detail-list">
        <h4>Filing Period</h4>
        <div><span>Tax Type</span><b>{filing.tax_type}</b></div>
        <div><span>Filing Period</span><b>{filing.filing_period}</b></div>
        <div><span>Period Start</span><b>{taxDate(filing.period_start)}</b></div>
        <div><span>Period End</span><b>{taxDate(filing.period_end)}</b></div>
        <div><span>Filing Deadline</span><b>{taxDate(filing.filing_deadline)}</b></div>
        <div><span>Prepared By</span><b><RevealableText value={taxBlank(filing.prepared_by)} /></b></div>
        <div><span>Reviewed By</span><b><RevealableText value={taxBlank(filing.reviewed_by)} /></b></div>
        <div><span>Return Number</span><b><RevealableText value={taxBlank(filing.reference_number)} /></b></div>
      </div>
    </div>}

    {tab === "Transactions" && <div className="tf-tx-tab">
      <div className="tf-tx-group">
        <h4>Sales <span>{s.sales.count} transaction(s) &middot; <RevealableAmount value={taxMoney(s.sales.gross)} /></span></h4>
        {s.sales.transactions.length === 0 ? <p className="vendor-detail-note">No sales fell within this period.</p>
          : <table className="tf-tx-table"><thead><tr>
            <th>Reference</th><th>Client</th><th>Date</th><th>Amount</th><th>Classification</th><th>Tax</th><th>Status</th>
          </tr></thead><tbody>
            {s.sales.transactions.map((t, i) => <tr key={`${t.source_table}-${t.reference_number}-${i}`}>
              <td className="mono"><RevealableText value={t.reference_number} /></td><td><RevealableText value={taxBlank(t.party)} /></td><td>{taxDate(t.transaction_date)}</td>
              <td className="money-cell"><RevealableAmount value={taxMoney(t.amount)} /></td>
              <td><span className={`tx-status ${t.classification === "Taxable" ? "tx-verified" : t.classification === "Exempt" ? "tx-neutral" : "tx-calculated"}`}>{t.classification}</span></td>
              <td className="money-cell"><RevealableAmount value={taxMoney(t.tax)} /></td>
              <td>
                {/* The source module's own state, not a re-derivation. An invoice still
                    in dispute keeps its tax in the total above but is flagged here. */}
                <span className={filingBadge(t.verified ? "Verified" : "Pending Review", FILING_DOC_STATUS_CLASS)}>
                  {t.verified ? "✓ Verified" : "⚠ Review"}
                </span>
                <span className="tf-doc-reason">{taxBlank(t.status)}</span>
              </td>
            </tr>)}
          </tbody></table>}
      </div>
      <div className="tf-tx-group">
        <h4>Purchases &amp; Expenses <span>{s.purchases.count} transaction(s) &middot; <RevealableAmount value={taxMoney(s.purchases.gross)} /></span></h4>
        {s.purchases.transactions.length === 0 ? <p className="vendor-detail-note">No purchases fell within this period.</p>
          : <table className="tf-tx-table"><thead><tr>
            <th>Reference</th><th>Supplier</th><th>Source</th><th>Date</th><th>Amount</th><th>Classification</th><th>Input Tax</th><th>Status</th>
          </tr></thead><tbody>
            {s.purchases.transactions.map((t, i) => <tr key={`${t.source_table}-${t.reference_number}-${i}`}>
              <td className="mono"><RevealableText value={t.reference_number} /></td><td><RevealableText value={taxBlank(t.party)} /></td><td>{t.source_group}</td>
              <td>{taxDate(t.transaction_date)}</td>
              <td className="money-cell"><RevealableAmount value={taxMoney(t.amount)} /></td>
              <td><span className={`tx-status ${t.classification === "Taxable" ? "tx-verified" : t.classification === "Exempt" ? "tx-neutral" : "tx-calculated"}`}>{t.classification}</span></td>
              <td className="money-cell"><RevealableAmount value={taxMoney(t.tax)} /></td>
              <td>
                <span className={filingBadge(t.verified ? "Verified" : "Pending Review", FILING_DOC_STATUS_CLASS)}>
                  {t.verified ? "✓ Verified" : "⚠ Review"}
                </span>
                <span className="tf-doc-reason">{taxBlank(t.status)}</span>
              </td>
            </tr>)}
          </tbody></table>}
      </div>
    </div>}

    {tab === "Withholding" && <div className="tf-tx-group">
      <h4>Withholding Tax Schedule <span>{s.withholding.count} certificate(s) &middot; <RevealableAmount value={taxMoney(s.withholding.total)} /> credited</span></h4>
      {s.withholding.count === 0 ? <p className="vendor-detail-note">No withholding was recorded in this period.</p>
        : <table className="tf-tx-table"><thead><tr>
          <th>Supplier</th><th>Reference</th><th>Date</th><th>Gross Amount</th><th>Withholding</th><th>ATC</th><th>Status</th>
        </tr></thead><tbody>
          {s.withholding.items.map((w) => <tr key={w.tax_calculation_id}>
            <td><RevealableText value={taxBlank(w.supplier)} /></td>
            <td className="mono"><RevealableText value={taxBlank(w.reference_number)} /></td>
            <td>{taxDate(w.transaction_date)}</td>
            <td className="money-cell"><RevealableAmount value={taxMoney(w.gross_amount)} /></td>
            <td className="money-cell"><RevealableAmount value={taxMoney(w.withholding_tax)} /></td>
            <td className="mono">{taxBlank(w.atc)}</td>
            <td>
              <span className={filingBadge(w.status, FILING_DOC_STATUS_CLASS)}>{w.status}</span>
              {w.status_reason && <span className="tf-doc-reason">{w.status_reason}</span>}
            </td>
          </tr>)}
        </tbody></table>}
      <p className="vendor-detail-note">
        Withholding is credited from verified tax calculations rather than recomputed here, so the
        return cannot disagree with a certificate that was already reviewed.
      </p>
    </div>}

    {tab === "Documents" && <div className="tf-doc-list">
      <div className="tf-doc-head">
        <h4>Supporting Documents</h4>
        <span>{filing.can_edit_documents ? "Click a document to attach or verify it." : `${filing.filing_id} has been filed; its documents are closed.`}</span>
      </div>
      {filing.documents.map((d) => <div className="tf-doc-row" key={d.id}>
        <div>
          <strong>{d.document_type}</strong>
          <span className="tf-doc-meta">
            {d.required ? "Required" : "Optional"}
            {d.file_name ? ` · ${d.file_name}` : ""}
            {d.uploaded_by ? ` · ${d.uploaded_by}` : ""}
            {d.verified_by ? ` · verified by ${d.verified_by}` : ""}
          </span>
        </div>
        <div className="tf-doc-actions">
          <span className={filingBadge(d.document_status, FILING_DOC_STATUS_CLASS)}>{d.document_status}</span>
          {filing.can_edit_documents && <button className="light-button" onClick={() => onDoc(d)}>{d.file_name ? "Update" : "Attach"}</button>}
        </div>
      </div>)}
    </div>}

    {tab === "Validation" && <div className="tf-validation">
      <div className="tf-readiness-bar" role="img" aria-label={`Filing readiness ${filing.readiness} percent`}>
        <div className="tf-readiness-fill" style={{ width: `${filing.readiness}%` }} />
        <span>{filing.readiness}%</span>
      </div>
      <p className="vendor-detail-note">
        {v.errors > 0
          ? `${v.errors} check(s) must pass before this return can be marked Ready for Filing.`
          : v.warnings > 0
            ? `All required checks pass. ${v.warnings} advisory warning(s) to review.`
            : "Every check passes. This return can be marked Ready for Filing."}
      </p>
      <ul className="tf-check-list">
        {v.checks.map((c) => <li key={c.key} className={`tf-check is-${c.status}`}>
          <span className="tf-check-icon">{c.status === "pass" ? "✓" : c.status === "warning" ? "!" : "✕"}</span>
          <div>
            <strong>{c.label}</strong>
            {c.detail && <span>{c.detail}</span>}
          </div>
        </li>)}
      </ul>
    </div>}
  </div>;
};

// Fallback option lists, used only until the API's `meta` arrives. The API is
// authoritative -- it returns these same lists from the backend constants -- so these
// exist to stop the dropdowns rendering empty on the very first paint, not to define
// what a valid tax type or filing status is. The backend rejects anything else.
//
// TAX_FILING_TAX_TYPES was previously referenced by the create modal and the filter bar
// but never declared, so the page threw "TAX_FILING_TAX_TYPES is not defined" on render
// and the ErrorBoundary replaced the whole module. It is declared here beside
// TAX_FILING_STATUSES_LOCAL, which is its twin and was already present.
const TAX_FILING_TAX_TYPES = ['VAT', 'Percentage Tax', 'Withholding Tax', 'Income Tax'];
const TAX_FILING_STATUSES_LOCAL = ['Draft', 'For Review', 'Ready for Filing', 'Filed', 'With Issues'];

// Create or edit a preparation. The period dates are resolved by the API from the period
// type, so the form only asks for the type and an anchor month — it never lets someone
// declare a "Monthly" return that spans three months. There is deliberately no amount
// field: the figures come from the ledger.
const TaxFilingCreateModal = ({ initial, saving, onClose, onSubmit }) => {
  const editing = Boolean(initial.editing);
  const [form, setForm] = useState({
    tax_type: initial.tax_type || 'VAT',
    filing_period: initial.filing_period || 'Monthly',
    anchor_date: `${(initial.as_of || '').slice(0, 8)}01`,
    period_start: initial.period_start || '',
    period_end: initial.period_end || '',
    prepared_by: initial.prepared_by || 'Admin User',
    remarks: initial.remarks || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return <div className="modal-overlay" onClick={() => !saving && onClose()}>
    <form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => {
      e.preventDefault();
      onSubmit({
        tax_type: form.tax_type,
        filing_period: form.filing_period,
        ...(editing ? {} : { anchor_date: form.anchor_date }),
        ...(editing ? { period_start: form.period_start, period_end: form.period_end } : {}),
        prepared_by: form.prepared_by,
        remarks: form.remarks,
      });
    }}>
      <div className="modal-header">
        <div>
          <h2>{editing ? `Edit ${initial.filing_id}` : "Create Tax Filing Preparation"}</h2>
          <p>{editing ? initial.period_label : "The period is derived from the filing period and the month below."}</p>
        </div>
        <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
      </div>
      <div className="form-grid">
        <label>Tax Type
          <select value={form.tax_type} onChange={e => set("tax_type", e.target.value)}>
            {TAX_FILING_TAX_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label>Filing Period
          <select value={form.filing_period} onChange={e => set("filing_period", e.target.value)} disabled={editing}>
            {TAX_FILING_PERIODS.map(p => <option key={p}>{p}</option>)}
          </select>
        </label>
        {editing ? <>
          <label>Period Start<input type="date" value={form.period_start} onChange={e => set("period_start", e.target.value)} /></label>
          <label>Period End<input type="date" value={form.period_end} onChange={e => set("period_end", e.target.value)} /></label>
        </> : <label className="full">Period Month<input type="date" value={form.anchor_date} onChange={e => set("anchor_date", e.target.value)} /></label>}
        <label className="full">Prepared By<input value={form.prepared_by} onChange={e => set("prepared_by", e.target.value)} /></label>
        <label className="full">Remarks<textarea rows="2" value={form.remarks} onChange={e => set("remarks", e.target.value)} /></label>
        <p className="full">The sales, purchase and tax figures are calculated from the transactions recorded in that period. They are not entered here.</p>
      </div>
      <div className="modal-footer">
        <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="primary" disabled={saving}>{saving ? "Saving..." : editing ? "Save Changes" : "Create Preparation"}</button>
      </div>
    </form>
  </div>;
};

// The taxpayer identity. This is the one place the return's company details are edited,
// and the TIN is checked against the same rule the readiness gate applies.
const TaxFilingProfileModal = ({ profile, saving, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    company_name: profile.company_name || '',
    tin: profile.tin || '',
    registered_address: profile.registered_address || '',
    rdo_code: profile.rdo_code || '',
    taxpayer_type: profile.taxpayer_type || '',
    contact_person: profile.contact_person || '',
    contact_number: profile.contact_number || '',
    email: profile.email || '',
    authorized_representative: profile.authorized_representative || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const digits = form.tin.replace(/[^0-9]/g, "");
  const tinOk = digits.length === 9 || (digits.length >= 12 && digits.length <= 14);
  return <div className="modal-overlay" onClick={() => !saving && onClose()}>
    <form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
      <div className="modal-header">
        <div><h2>Taxpayer Information</h2><p>Printed on every return this company files.</p></div>
        <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
      </div>
      <div className="form-grid">
        <label className="full">Company Name<input value={form.company_name} onChange={e => set("company_name", e.target.value)} /></label>
        <label>TIN<input value={form.tin} onChange={e => set("tin", e.target.value)} /></label>
        <label>RDO Code<input value={form.rdo_code} onChange={e => set("rdo_code", e.target.value)} /></label>
        <label className="full">Registered Address<textarea rows="2" value={form.registered_address} onChange={e => set("registered_address", e.target.value)} /></label>
        <label className="full">Taxpayer Type<input value={form.taxpayer_type} onChange={e => set("taxpayer_type", e.target.value)} /></label>
        <label>Contact Person<input value={form.contact_person} onChange={e => set("contact_person", e.target.value)} /></label>
        <label>Contact Number<input value={form.contact_number} onChange={e => set("contact_number", e.target.value)} /></label>
        <label className="full">Email<input value={form.email} onChange={e => set("email", e.target.value)} /></label>
        <label className="full">Authorized Representative<input value={form.authorized_representative} onChange={e => set("authorized_representative", e.target.value)} /></label>
        {form.tin && !tinOk && <p className="full">A TIN is 9 digits, or 9 plus a 3-5 digit branch code. This one has {digits.length}.</p>}
      </div>
      <div className="modal-footer">
        <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="primary" disabled={saving || !tinOk}>{saving ? "Saving..." : "Save Taxpayer Information"}</button>
      </div>
    </form>
  </div>;
};

// A workflow step. When validation is blocking the step, the reasons are listed here
// rather than leaving a disabled button with no explanation.
const TaxFilingStatusModal = ({ filing, target, saving, onClose, onSubmit }) => {
  const [returnNumber, setReturnNumber] = useState(filing.reference_number || '');
  const [remarks, setRemarks] = useState('');
  const blocked = ['Ready for Filing', 'Filed'].includes(target) && !filing.validation_passed;
  const needsRef = target === 'Filed' && !returnNumber.trim();
  return <div className="modal-overlay" onClick={() => !saving && onClose()}>
    <form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => {
      e.preventDefault();
      onSubmit({ filing_status: target, reference_number: returnNumber.trim(), remarks, actor: 'Tax Commissioner' });
    }}>
      <div className="modal-header">
        <div>
          <h2>{target}</h2>
          <p>{filing.filing_id} &middot; {filing.tax_type} &middot; {filing.period_label}</p>
        </div>
        <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
      </div>
      <div className="form-grid">
        {blocked && <div className="full">
          <p className="tf-modal-blocked">
            {filing.validation_errors} validation check(s) must pass first. Readiness is {filing.readiness}%.
          </p>
          <ul className="tf-block-list">
            {filing.blocking_reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>}
        {target === 'Filed' && <label className="full">Return Number<input value={returnNumber} placeholder="e.g. BIR-2550-M09" onChange={e => setReturnNumber(e.target.value)} /></label>}
        <label className="full">Remarks<textarea rows="2" value={remarks} onChange={e => setRemarks(e.target.value)} /></label>
        <p className="full">
          {filing.is_credit
            ? <>This period carries a credit of <RevealableAmount value={taxMoney(filing.tax_credit)} />; there is nothing payable.</>
            : <>Tax payable for this period is <RevealableAmount value={taxMoney(filing.tax_payable)} />.</>}
        </p>
      </div>
      <div className="modal-footer">
        <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="primary" disabled={saving || blocked || needsRef}>
          {saving ? "Saving..." : target}
        </button>
      </div>
    </form>
  </div>;
};

// Attach or verify a supporting document. Only the file name and status are recorded:
// there is no multipart dependency in this project, so no binary is uploaded. The
// backend refuses to mark a document Verified without a file behind it.
const TaxFilingDocModal = ({ filing, document, saving, onClose, onSubmit }) => {
  const [fileName, setFileName] = useState(document.file_name || '');
  const [status, setStatus] = useState(document.document_status === 'Missing' ? 'Attached' : document.document_status);
  const [notes, setNotes] = useState('');
  const invalid = status === 'Verified' && !fileName.trim();
  return <div className="modal-overlay" onClick={() => !saving && onClose()}>
    <form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => {
      e.preventDefault();
      onSubmit({ document_status: status, file_name: fileName.trim(), notes, uploaded_by: "Admin User" });
    }}>
      <div className="modal-header">
        <div>
          <h2>{document.document_type}</h2>
          <p>{filing.filing_id} &middot; {document.required ? "Required document" : "Optional document"}</p>
        </div>
        <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
      </div>
      <div className="form-grid">
        <label className="full">File Name<input value={fileName} placeholder="e.g. sales-invoices.pdf" onChange={e => setFileName(e.target.value)} /></label>
        <label className="full">Status
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option>Attached</option><option>Verified</option><option>Pending Review</option><option>Missing</option>
          </select>
        </label>
        <label className="full">Notes<textarea rows="2" value={notes} onChange={e => setNotes(e.target.value)} /></label>
        {invalid && <p className="full">A document cannot be marked Verified without a file attached to it.</p>}
      </div>
      <div className="modal-footer">
        <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="primary" disabled={saving || invalid}>{saving ? "Saving..." : "Save Document"}</button>
      </div>
    </form>
  </div>;
};

const TaxFilingDeleteModal = ({ filing, saving, onClose, onSubmit }) => <div className="modal-overlay" onClick={() => !saving && onClose()}>
  <form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); onSubmit(); }}>
    <div className="modal-header">
      <div><h2>Delete {filing.filing_id}</h2><p>{filing.tax_type} &middot; {filing.period_label}</p></div>
      <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
    </div>
    <div className="form-grid">
      <p className="full">
        This removes the preparation and its document checklist. The underlying sales,
        purchases and expenses are not touched — they belong to their own modules.
      </p>
    </div>
    <div className="modal-footer">
      <button type="button" onClick={onClose} disabled={saving}>Keep Preparation</button>
      <button type="submit" className="primary" disabled={saving}>{saving ? "Deleting..." : "Delete Preparation"}</button>
    </div>
  </form>
</div>;

const TAX_FILING_PERIODS = ['Monthly', 'Quarterly', 'Annual'];

const FILING_STATUS_CLASS = {
  draft: 'tx-pending',
  'for-review': 'tx-calculated',
  'ready-for-filing': 'tx-verified',
  filed: 'tx-approved',
  'with-issues': 'tx-rejected',
};
const FILING_DOC_STATUS_CLASS = {
  verified: 'tx-verified', attached: 'tx-calculated',
  'pending-review': 'tx-pending', missing: 'tx-rejected',
};

const filingBadge = (status, map) =>
  `contract-status tx-status ${map[taxSlug(status)] || 'tx-neutral'}`;

function TaxFilingPreparationPage({ onAudit }) {
  const [filings, setFilings] = useState([]);
  const [meta, setMeta] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState("");

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterTax, setFilterTax] = useState('All Taxes');
  const [selectedId, setSelectedId] = useState(null);
  const [detailTab, setDetailTab] = useState('Summary');

  const [creating, setCreating] = useState(null);
  const [filingAction, setFilingAction] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [docTarget, setDocTarget] = useState(null);
  const [revealed, setRevealed] = useState({});
  // Credit left unused after the whole filing chain has run. Reported by the API rather
  // than summed here, because a credit already consumed by a later filing must not be
  // counted a second time.
  const [openCredit, setOpenCredit] = useState(0);

  const toggle = (key) => setRevealed(prev => ({ ...prev, [key]: !prev[key] }));

  const isRevealed = (key) => Boolean(revealed[key]);

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const payload = await taxRequest(`${API_BASE}/api/tax-filing-preparations`);
      setFilings(Array.isArray(payload?.data) ? payload.data : []);
      setMeta(payload?.meta || null);
      setOpenCredit(Number(payload?.open_credit || 0));
    } catch (error) {
      setFilings([]);
      setMeta(null);
      setLoadError(taxFailure(error, 'tax filing preparations'));
    } finally {
      setLoading(false);
    }
  };

  // The list endpoint already carries every figure each row needs, so the summary is
  // computed from that same payload rather than refetching each filing.
  useEffect(() => { load(); }, []);

  const overview = useMemo(() => {
    const sum = (f) => filings.reduce((t, r) => t + Number(r[f] || 0), 0);
    return {
      total: filings.length,
      // Payable and credit are reported separately and never netted against each other.
      // A credit is NOT a negative payable: it is an amount the company may carry forward,
      // so adding the two together would understate a real liability.
      payable: sum('tax_payable'),
      credit: sum('tax_credit'),
      // Credit still unused after the whole chain has run. This is what a future filing
      // can actually claim; summing the per-filing credits would double-count any credit
      // a later filing has already consumed.
      openCredit: Number(openCredit || 0),
      output: sum('output_tax'),
      input: sum('input_tax'),
      sales: sum('gross_sales'),
      purchases: sum('total_purchases'),
      ready: filings.filter((f) => f.can_mark_ready).length,
      filed: filings.filter((f) => f.filing_status === 'Filed').length,
      // The verification split is summed from each filing's own transaction counts, so
      // the card and the Transactions tab cannot disagree about how many are verified.
      salesTx: filings.reduce((t, f) => ({
        count: t.count + f.summary.sales.count,
        verified_count: t.verified_count + f.summary.sales.verified_count,
      }), { count: 0, verified_count: 0 }),
      purchTx: filings.reduce((t, f) => ({
        count: t.count + f.summary.purchases.count,
        verified_count: t.verified_count + f.summary.purchases.verified_count,
      }), { count: 0, verified_count: 0 }),
    };
  }, [filings, openCredit]);

  const filtered = useMemo(() => {
    const phrase = search.trim().toLowerCase();
    return filings.filter(f => {
      if (filterStatus !== 'All Status' && f.filing_status !== filterStatus) return false;
      if (filterTax !== 'All Taxes' && f.tax_type !== filterTax) return false;
      if (!phrase) return true;
      return [f.filing_id, f.tax_type, f.period_label, f.prepared_by, f.reference_number, f.taxpayer_company]
        .some(v => String(v || '').toLowerCase().includes(phrase));
    });
  }, [filings, search, filterStatus, filterTax]);

  const selected = useMemo(
    () => filings.find(f => f.id === selectedId) || filtered[0] || null,
    [filings, filtered, selectedId]
  );

  const run = async (label, fn) => {
    setSaving(true);
    setFlash("");
    try {
      const result = await fn();
      setFlash(result);
      await load();
      if (onAudit) onAudit(label);
      return result;
    } catch (error) {
      const detail = error && error.findings ? error.findings.join(" ") : null;
      setFlash(detail || taxFailure(error, "that action"));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const printFiling = (f) => {
    if (!f) return;
    const s = f.summary;
    const w = window.open("", "_blank");
    if (!w) return;
    const line = (label, value) => `<tr><th>${label}</th><td>${value}</td></tr>`;
    w.document.write(`<!DOCTYPE html><html><head><title>${f.filing_id}</title><style>
      body{font-family:Segoe UI,Arial,sans-serif;padding:40px;color:#1c1c1c}
      h1{font-size:18px;letter-spacing:2px;margin:0 0 4px}
      h2{font-size:15px;margin:22px 0 10px;padding-bottom:6px;border-bottom:2px solid #1c1c1c}
      .sub{color:#555;font-size:12px;margin:0 0 20px}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th{text-align:left;padding:7px 10px;background:#f2f2f2;border:1px solid #ddd;width:250px;font-weight:600}
      td{padding:7px 10px;border:1px solid #ddd}
      .total{background:#f7f9fb;font-weight:700}
      .sign{margin-top:46px;display:flex;gap:40px}
      .sign div{flex:1;border-top:1px solid #1c1c1c;padding-top:6px;font-size:12px;text-align:center}
      @media print{body{padding:0}}
    </style></head><body>
      <h1>PRIMEPOWER</h1>
      <p class="sub">FINANCIAL MANAGEMENT SYSTEM &nbsp;&middot;&nbsp; ${f.tax_type} RETURN</p>
      <h2>${f.filing_id} &mdash; ${f.period_label}</h2>
      <table>
        ${line("Company", taxBlank(s.profile.company_name))}
        ${line("TIN", taxBlank(s.profile.tin))}
        ${line("Registered Address", taxBlank(s.profile.registered_address))}
        ${line("RDO Code", taxBlank(s.profile.rdo_code))}
        ${line("Taxpayer Type", taxBlank(s.profile.taxpayer_type))}
        ${line("Filing Period", `${f.filing_period} (${f.period_start} to ${f.period_end})`)}
        ${line("Filing Deadline", f.filing_deadline || "—")}
      </table>
      <h2>Taxable Sales</h2>
      <table>
        ${line("Gross Sales", taxMoney(s.sales.gross))}
        ${line("VATable Sales", taxMoney(s.sales.taxable))}
        ${line("Zero-Rated Sales", taxMoney(s.sales.zero_rated))}
        ${line("Exempt Sales", taxMoney(s.sales.exempt))}
        ${line(`Output Tax (${s.sales.rate}%)`, taxMoney(s.computation.output_tax))}
      </table>
      <h2>Purchases / Expenses</h2>
      <table>
        ${line("Total Purchases", taxMoney(s.purchases.gross))}
        ${line("VATable Purchases", taxMoney(s.purchases.taxable))}
        ${line(`Input Tax (${s.purchases.rate}%)`, taxMoney(s.computation.input_tax))}
        ${line("Exempt Purchases", taxMoney(s.purchases.exempt))}
        ${line("Withholding Tax Credited", taxMoney(s.withholding.total))}
      </table>
      <h2>Tax Computation</h2>
      <table>
        ${line("Output Tax", taxMoney(s.computation.output_tax))}
        ${line("Less: Input Tax", taxMoney(s.computation.input_tax))}
        <tr class="total">${line(s.computation.is_credit ? "Credit Carried Forward" : "Tax Payable",
          taxMoney(s.computation.is_credit ? s.computation.credit : s.computation.payable))}</tr>
      </table>
      <h2>Certification</h2>
      <table>
        ${line("Prepared By", taxBlank(f.prepared_by))}
        ${line("Reviewed By", taxBlank(f.reviewed_by))}
        ${line("Filing Status", f.filing_status)}
        ${line("Return Number", taxBlank(f.reference_number))}
        ${line("Readiness", `${f.readiness}% (${f.validation_errors} error(s), ${f.validation_warnings} warning(s))`)}
      </table>
      <div class="sign"><div>Prepared By</div><div>Reviewed By</div><div>Filed By</div></div>
    </body></html>`);
    w.document.close();
    w.print();
  };

  // The per-invoice verification split the specification asks for. Counts are summed
  // from the same rows the totals were built from, so they cannot contradict them.
  const sideCounts = (s) => `${s.verified_count} of ${s.count} verified`;

  return <section className="management-page vendor-payment-page">
    <Breadcrumb current="Tax Filing Preparation" parent="Tax Management" />
    <div className="management-header">
      <div><h2>TAX FILING PREPARATION</h2><p>Assemble a {meta ? meta.vat_rate : 12}% return from transactions recorded across billing, payments, payables, utilities and expenses.</p></div>
      <div className="management-actions">
        <button className="light-button" onClick={() => window.print()} disabled={saving}><Printer size={15}/> Print / Save PDF</button>
        <button className="light-button" disabled={loading || saving} onClick={load} title="Re-read every source table and recompute the return">⟳ Refresh Data</button>
        <button className="primary-button" onClick={() => setCreating({ tax_type: 'VAT', filing_period: 'Monthly' })} disabled={saving}><Plus size={15}/> Create Preparation</button>
      </div>
    </div>

    <div className="vendor-toolbar">
      <div className="search-box vendor-search"><span>⌕</span><input placeholder="Search filing, tax, period, return number..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="vendor-toolbar-controls">
        <select className="vendor-select" value={filterTax} onChange={e => setFilterTax(e.target.value)} aria-label="Tax type">
          <option>All Taxes</option>
          {(meta ? meta.tax_types : TAX_FILING_TAX_TYPES).map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="vendor-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} aria-label="Filing status">
          <option>All Status</option>
          {(meta ? meta.statuses : TAX_FILING_STATUSES_LOCAL).map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
    </div>

    {loadError && <div className="cfu-error" role="alert">{loadError}</div>}
    {flash && <div className="cfu-error" role="status">{flash}</div>}

    <div className="vendor-summary-grid">
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Taxable Sales</span>
        <TaxCardAmount id="tf-sales" value={overview.sales} revealed={revealed} onToggle={toggle} tone="total-supplies-amount" />
        <span className="vendor-summary-count">{sideCounts(overview.salesTx)}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Total Purchases</span>
        <TaxCardAmount id="tf-purchases" value={overview.purchases} revealed={revealed} onToggle={toggle} tone="pending-amount" />
        <span className="vendor-summary-count">{sideCounts(overview.purchTx)}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Tax Payable</span>
        <TaxCardAmount id="tf-payable" value={overview.payable} revealed={revealed} onToggle={toggle} tone="calculated-amount" />
        <span className="vendor-summary-count">
          {overview.total} return{overview.total === 1 ? '' : 's'} · {overview.ready} ready
        </span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Credit Carried Forward</span>
        <TaxCardAmount id="tf-credit" value={overview.openCredit} revealed={revealed} onToggle={toggle} tone="overdue-amount" />
        <span className="vendor-summary-count">
          {overview.openCredit > 0 ? 'available to a future return' : 'fully used'}
        </span>
      </div>
    </div>

    <div className="vendor-table-card">
      <table className="vendor-table">
        <thead><tr>
          <th>Filing ID</th><th>Tax Type</th><th>Period</th><th>Deadline</th>
          <th>Taxable Sales</th><th>Purchases</th><th>Output Tax</th><th>Input Tax</th>
          <th>Tax Payable</th><th>Credit</th><th>Readiness</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {loading ? <tr><td colSpan="13">Loading tax filing preparations...</td></tr>
            : filtered.length === 0 ? <tr><td colSpan="13">No tax filing preparations match the current filters.</td></tr>
            : filtered.map(f => <tr key={f.id} className={selected && selected.id === f.id ? "is-selected" : ""} onClick={() => { setSelectedId(f.id); setDetailTab("Summary"); }}>
              <td className="mono">{f.filing_id}</td>
              <td><span className={taxTypeClass(f.tax_type)}>{f.tax_type}</span></td>
              <td>{f.period_label}</td>
              <td>{f.filing_deadline ? <span className="tf-deadline-cell">
                <span className="tf-deadline-date">{taxDate(f.filing_deadline)}</span>
                {f.deadline_overdue && <span
                  className="tf-overdue-flag"
                  title={`The ${f.period_label} ${f.tax_type} return was due on ${taxDate(f.filing_deadline)} and is still ${String(f.filing_status).toLowerCase()} - ${Math.abs(f.days_to_deadline)} day(s) past the deadline.`}
                >{Math.abs(f.days_to_deadline)}d overdue</span>}
              </span> : "—"}</td>
              <td className="money-cell"><TaxMasked rowId={`${f.id}-sales`} value={f.gross_sales} revealed={revealed} onToggle={toggle} /></td>
              <td className="money-cell"><TaxMasked rowId={`${f.id}-purch`} value={f.total_purchases} revealed={revealed} onToggle={toggle} /></td>
              <td className="money-cell"><TaxMasked rowId={`${f.id}-out`} value={f.output_tax} revealed={revealed} onToggle={toggle} /></td>
              <td className="money-cell"><TaxMasked rowId={`${f.id}-in`} value={f.input_tax} revealed={revealed} onToggle={toggle} /></td>
              <td className="money-cell">
                {/* Payable and credit occupy SEPARATE columns. Showing a credit in a column
                    headed "Payable" implied a negative liability, which is a different thing:
                    one is money owed, the other is credit to apply against a future return. */}
                <TaxMasked rowId={`${f.id}-pay`} value={f.tax_payable} revealed={revealed} onToggle={toggle} />
              </td>
              <td className="money-cell">
                {f.tax_credit > 0
                  ? <span className="tf-credit" title="Input tax exceeded output tax"><RevealableAmount value={`credit ${taxMoney(f.tax_credit)}`} /></span>
                  : <span className="tf-muted">—</span>}
              </td>
              <td>
                {/* The percentage alone gave no way to tell a genuinely ready return from
                    one blocked on a missing document, and made filings with different
                    problems look identical. The completed-check count sits beside it and
                    the tooltip names what is outstanding. */}
                <span
                  className={`tf-readiness ${f.readiness === 100 ? "is-full" : ""}`}
                  title={f.blocking_reasons && f.blocking_reasons.length
                    ? f.blocking_reasons.join(" · ")
                    : "All validation checks pass"}
                >
                  {f.readiness}%
                  <small className="tf-readiness-detail">
                    {f.validation_completed ?? 0}/{f.validation_total ?? 0} checks
                  </small>
                </span>
              </td>
              <td><span className={filingBadge(f.filing_status, FILING_STATUS_CLASS)}>{f.filing_status}</span></td>
              <td onClick={e => e.stopPropagation()}>
                <div className="vendor-row-actions">
                  {/* Icon-only, matching Tax Records and Tax Calculation. The meaning is
                      carried by the lucide glyph plus the title/aria-label tooltip rather
                      than a text label, which is what left these three controls looking
                      different from one page to the next. */}
                  {/* Receipt opens the filing receipt / return record. The printer glyph
                      beside it is Print, so the two read as Receipt then Print. */}
                  <button className="tax-icon-btn" title="Open the tax filing receipt / record" aria-label="Open the tax filing receipt" onClick={() => { setSelectedId(f.id); setDetailTab("Summary"); }}><ReceiptText size={16}/></button>
                  <button className="tax-icon-btn" title="Print the filing / report" aria-label="Print the filing report" onClick={() => printFiling(f)}><Printer size={16}/></button>
                  <button className="tax-icon-btn" title="More actions: edit, company profile, delete" aria-label="More actions" onClick={() => setFilingAction(filingAction && filingAction.id === f.id ? null : f)}><MoreHorizontal size={16}/></button>
                  {filingAction && filingAction.id === f.id && <TaxFilingMenu filing={f} saving={saving} onClose={() => setFilingAction(null)}
                    onEdit={() => { setFilingAction(null); setCreating({ ...f, editing: true }); }}
                    onProfile={() => { setFilingAction(null); setEditingProfile(true); }}
                    onDelete={() => { setFilingAction(null); setDocTarget({ filing: f, mode: "delete" }); }} />}
                </div>
              </td>
            </tr>)}
        </tbody>
      </table>
    </div>

    {selected && <TaxFilingDetail filing={selected} tab={detailTab} setTab={setDetailTab} revealed={revealed} toggle={toggle} saving={saving}
      onPrint={() => printFiling(selected)}
      onDoc={d => setDocTarget({ filing: selected, document: d })}
      onProfile={() => setEditingProfile(true)}
      onSubmit={() => setFilingAction({ ...selected, advance: "For Review", verb: "submit" })}
      onApprove={() => setFilingAction({ ...selected, advance: "Ready for Filing", verb: "approve" })}
      onAdvance={next => setFilingAction({ ...selected, advance: next })} />}

    {creating && <TaxFilingCreateModal initial={creating} saving={saving} onClose={() => setCreating(null)}
      onSubmit={async payload => {
        const r = await run(creating.editing ? "Updated tax filing preparation" : "Created tax filing preparation",
          async () => (await taxRequest(`${API_BASE}/api/tax-filing-preparations${creating.editing ? `/${creating.id}` : ""}`, {
            method: creating.editing ? "PUT" : "POST", body: JSON.stringify(payload),
          })).message);
        if (r) setCreating(null);
        return r;
      }} />}

    {editingProfile && <TaxFilingProfileModal profile={(selected && selected.summary.profile) || {}} saving={saving} onClose={() => setEditingProfile(false)}
      onSubmit={async payload => { const r = await run("Saved taxpayer information", async () => (await taxRequest(`${API_BASE}/api/tax-filing-preparations/profile`, { method: "PUT", body: JSON.stringify(payload) })).message); if (r) setEditingProfile(false); return r; }} />}

    {filingAction && filingAction.advance && <TaxFilingStatusModal filing={filingAction} target={filingAction.advance} saving={saving} onClose={() => setFilingAction(null)}
      onSubmit={async payload => { const r = await run(`Set ${filingAction.filing_id} to ${filingAction.advance}`, async () => (await taxRequest(`${API_BASE}/api/tax-filing-preparations/${filingAction.id}/status`, { method: "POST", body: JSON.stringify(payload) })).message); if (r) setFilingAction(null); return r; }} />}

    {docTarget && docTarget.document && <TaxFilingDocModal filing={docTarget.filing} document={docTarget.document} saving={saving} onClose={() => setDocTarget(null)}
      onSubmit={async payload => { const r = await run(`Updated ${docTarget.document.document_type}`, async () => (await taxRequest(`${API_BASE}/api/tax-filing-preparations/${docTarget.filing.id}/documents/${docTarget.document.id}`, { method: "PUT", body: JSON.stringify(payload) })).message); if (r) setDocTarget(null); return r; }} />}

    {docTarget && docTarget.mode === "delete" && <TaxFilingDeleteModal filing={docTarget.filing} saving={saving} onClose={() => setDocTarget(null)}
      onSubmit={async () => { const r = await run("Deleted tax filing preparation", async () => (await taxRequest(`${API_BASE}/api/tax-filing-preparations/${docTarget.filing.id}`, { method: "DELETE" })).message); if (r) { setDocTarget(null); setSelectedId(null); } return r; }} />}
  </section>;
}

function TaxRecordsPage({ onAudit }) {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [eligible, setEligible] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState("");

  const [search, setSearch] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("All Periods");
  const [filterType, setFilterType] = useState("All Types");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [filterFiling, setFilterFiling] = useState("All Filing");
  const [filterPayment, setFilterPayment] = useState("All Payment");
  const [selectedId, setSelectedId] = useState(null);
  const [detailTab, setDetailTab] = useState("Record");

  const [intake, setIntake] = useState(null);
  const [editing, setEditing] = useState(null);
  const [remitting, setRemitting] = useState(null);
  const [filing, setFiling] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [menuFor, setMenuFor] = useState(null);
  const [revealed, setRevealed] = useState({});

  const toggle = (key) => setRevealed(prev => ({ ...prev, [key]: !prev[key] }));

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const payload = await taxRequest(`${API_BASE}/api/tax/records`);
      setRecords(Array.isArray(payload?.data) ? payload.data : []);
      setSummary(payload?.summary || null);
    } catch (error) {
      setRecords([]);
      setSummary(null);
      setLoadError(taxFailure(error, "tax records"));
    } finally {
      setLoading(false);
    }
  };

  // The calculations that can still be promoted into a record. Only reviewed work
  // appears here, so the intake form cannot file something that was never checked.
  const loadEligible = async () => {
    try {
      const payload = await taxRequest(`${API_BASE}/api/tax/records/calculations`);
      setEligible(Array.isArray(payload?.data) ? payload.data : []);
    } catch {
      setEligible([]);
    }
  };

  useEffect(() => { load(); loadEligible(); }, []);

  const filteredRecords = useMemo(() => {
    const phrase = search.trim().toLowerCase();
    return records.filter(row => {
      if (filterPeriod !== "All Periods" && row.tax_period !== filterPeriod) return false;
      if (filterType !== "All Types" && row.tax_type !== filterType) return false;
      if (filterStatus !== "All Status" && row.record_status !== filterStatus) return false;
      if (filterFiling !== "All Filing" && row.filing_status !== filterFiling) return false;
      if (filterPayment !== "All Payment" && row.payment_status !== filterPayment) return false;
      if (!phrase) return true;
      return [row.tax_record_id, row.reference_number, row.client_supplier, row.transaction_type, row.tax_type, row.return_number]
        .some(v => String(v || "").toLowerCase().includes(phrase));
    });
  }, [records, search, filterPeriod, filterType, filterStatus, filterFiling, filterPayment]);

  const selected = useMemo(
    () => records.find(r => r.id === selectedId) || filteredRecords[0] || null,
    [records, filteredRecords, selectedId]
  );

  const periods = useMemo(
    () => [...new Set(records.map(r => r.tax_period).filter(Boolean))].sort().reverse(),
    [records]
  );

  const s = summary;

  const run = async (label, fn) => {
    setSaving(true);
    setFlash("");
    try {
      const result = await fn();
      setFlash(result);
      await load();
      await loadEligible();
      if (onAudit) onAudit(label);
      return result;
    } catch (error) {
      const detail = error && error.findings ? error.findings.join(" ") : null;
      setFlash(detail || taxFailure(error, "that action").replace(/^The backend /, "The backend "));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const printRecord = (r) => {
    if (!r) return;
    const w = window.open("", "_blank");
    if (!w) return;
    const line = (label, value) => `<tr><th>${label}</th><td>${value}</td></tr>`;
    w.document.write(`<!DOCTYPE html><html><head><title>${r.tax_record_id}</title><style>
      body{font-family:Segoe UI,Arial,sans-serif;padding:40px;color:#1c1c1c}
      h1{font-size:18px;letter-spacing:2px;margin:0 0 4px}
      h2{font-size:15px;margin:22px 0 10px;padding-bottom:6px;border-bottom:2px solid #1c1c1c}
      .sub{color:#555;font-size:12px;margin:0 0 20px}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th{text-align:left;padding:7px 10px;background:#f2f2f2;border:1px solid #ddd;width:230px;font-weight:600}
      td{padding:7px 10px;border:1px solid #ddd}
      .sign{margin-top:46px;display:flex;gap:40px}
      .sign div{flex:1;border-top:1px solid #1c1c1c;padding-top:6px;font-size:12px;text-align:center}
      @media print{body{padding:0}}
    </style></head><body>
      <h1>PRIMEPOWER</h1>
      <p class="sub">FINANCIAL MANAGEMENT SYSTEM &nbsp;&middot;&nbsp; TAX RECORD</p>
      <h2>${r.tax_record_id} &mdash; ${r.tax_type}</h2>
      <table>
        ${line("Tax Period", taxBlank(r.tax_period))}
        ${line("Transaction Date", taxDate(r.transaction_date))}
        ${line("Transaction Type", taxBlank(r.transaction_type))}
        ${line("Reference Number", taxBlank(r.reference_number))}
        ${line("Client / Supplier", taxBlank(r.client_supplier))}
      </table>
      <h2>Tax Computation</h2>
      <table>
        ${line("Taxable Amount", taxMoney(r.taxable_amount))}
        ${line("Tax Rate", `${r.tax_rate}%`)}
        ${line("Tax Amount", taxMoney(r.tax_amount))}
        ${line("Less: Withholding Tax", taxMoney(r.withholding_tax))}
        ${line("Tax Adjustment", taxMoney(r.tax_adjustment))}
        ${line("Final Tax Amount", taxMoney(r.final_tax_amount))}
        ${line("Tax Paid", taxMoney(r.tax_paid))}
        ${line("Outstanding", taxMoney(r.tax_remaining))}
      </table>
      <h2>Status</h2>
      <table>
        ${line("Record Status", r.record_status)}
        ${line("Filing Status", r.filing_status)}
        ${line("Payment Status", r.payment_status)}
        ${line("Return Number", taxBlank(r.return_number))}
        ${line("Source Calculation", taxBlank(r.source_reference))}
      </table>
      <h2>Signatories</h2>
      <table>
        ${line("Calculated By", taxBlank(r.calculated_by))}
        ${line("Verified By", taxBlank(r.verified_by))}
        ${line("Verified On", taxDate(r.verified_on))}
        ${line("Filed By", taxBlank(r.filed_by))}
        ${line("Filed On", taxDate(r.filed_on))}
      </table>
      ${r.remarks ? `<h2>Remarks</h2><p style="font-size:13px">${r.remarks}</p>` : ""}
      <div class="sign"><div>Prepared By</div><div>Verified By</div><div>Filed By</div></div>
    </body></html>`);
    w.document.close();
    w.print();
  };

  return <section className="management-page vendor-payment-page">
    <Breadcrumb current="Tax Records" parent="Tax Management" />
    <div className="management-header">
      <div><h2>TAX RECORDS</h2><p>The permanent filed record of tax computed from reviewed calculations, with its full filing and payment history.</p></div>
      <div className="management-actions">
        <button className="light-button" onClick={() => window.print()} disabled={saving}><Printer size={15}/> Print / Save PDF</button>
        <button className="primary-button" onClick={() => setIntake({})} disabled={saving}>＋ New Tax Record</button>
      </div>
    </div>

    <div className="vendor-toolbar">
      <div className="search-box vendor-search"><span>⌕</span><input placeholder="Search reference, client, return number..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="vendor-toolbar-controls">
        <select className="vendor-select" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} aria-label="Tax period">
          <option>All Periods</option>
          {periods.map(p => <option key={p}>{p}</option>)}
        </select>
        <select className="vendor-select" value={filterType} onChange={e => setFilterType(e.target.value)} aria-label="Tax type">
          <option>All Types</option>
          {TAX_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="vendor-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} aria-label="Record status">
          <option>All Status</option>
          {TAX_RECORD_STATUSES_LOCAL.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="vendor-select" value={filterFiling} onChange={e => setFilterFiling(e.target.value)} aria-label="Filing status">
          <option>All Filing</option>
          {TAX_RECORD_FILING_STATUSES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="vendor-select" value={filterPayment} onChange={e => setFilterPayment(e.target.value)} aria-label="Payment status">
          <option>All Payment</option>
          {TAX_RECORD_PAYMENT_STATUSES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
    </div>

    {loadError && <div className="cfu-error" role="alert">{loadError}</div>}
    {flash && <div className="cfu-error" role="status">{flash}</div>}

    <div className="vendor-summary-grid">
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Total Taxable Amount</span>
        <TaxCardAmount id="tr-total-taxable" value={s ? s.total_taxable : 0} revealed={revealed} onToggle={toggle} tone="total-supplies-amount" />
        <span className="vendor-summary-count">{s ? s.total : 0} record{(s ? s.total : 0) === 1 ? "" : "s"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Total Tax Calculated</span>
        <TaxCardAmount id="tr-calculated" value={s ? s.total_tax_calculated : 0} revealed={revealed} onToggle={toggle} tone="calculated-amount" />
        <span className="vendor-summary-count">final payable {s ? <RevealableAmount value={taxMoney(s.total_final_tax)} /> : "—"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">For Filing</span>
        <TaxCardAmount id="tr-for-filing" value={s ? s.for_filing_amount : 0} revealed={revealed} onToggle={toggle} tone="pending-amount" />
        <span className="vendor-summary-count">{s ? s.for_filing : 0} queued</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Outstanding</span>
        <TaxCardAmount id="tr-outstanding" value={s ? s.total_outstanding : 0} revealed={revealed} onToggle={toggle} tone="overdue-amount" />
        <span className="vendor-summary-count">{s ? s.unpaid : 0} not fully paid</span>
      </div>
    </div>

    <div className="vendor-table-card">
      <table className="vendor-table">
        <thead><tr>
          <th>ID</th><th>Reference</th><th>Client / Supplier</th><th>Tax Type</th>
          <th>Taxable</th><th>Tax</th><th>Final</th><th>Record</th><th>Filing</th><th>Payment</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {loading ? <tr><td colSpan="11">Loading tax records...</td></tr>
            : filteredRecords.length === 0 ? <tr><td colSpan="11">No tax records match the current filters.</td></tr>
            : filteredRecords.map(r => <tr key={r.id} className={selected && selected.id === r.id ? "is-selected" : ""} onClick={() => { setSelectedId(r.id); setDetailTab("Record"); }}>
              <td className="mono"><RevealableText value={r.tax_record_id} /></td>
              <td><RevealableText value={taxBlank(r.reference_number)} /></td>
              <td><RevealableText value={taxBlank(r.client_supplier)} /></td>
              <td><span className={taxTypeClass(r.tax_type)}>{r.tax_type}</span></td>
              <td className="money-cell"><TaxMasked rowId={`${r.id}-taxable`} value={r.taxable_amount} revealed={revealed} onToggle={toggle} /></td>
              <td className="money-cell"><TaxMasked rowId={`${r.id}-tax`} value={r.tax_amount} revealed={revealed} onToggle={toggle} /></td>
              <td className="money-cell"><TaxMasked rowId={`${r.id}-final`} value={r.final_tax_amount} revealed={revealed} onToggle={toggle} /></td>
              <td><span className={taxRecordBadge(r.record_status, TAX_RECORD_STATUS_CLASS)}>{r.record_status}</span></td>
              <td><span className={taxRecordBadge(r.filing_status, TAX_FILING_STATUS_CLASS)}>{r.filing_status}</span></td>
              <td><span className={taxRecordBadge(r.payment_status, TAX_PAYMENT_STATUS_CLASS)}>{r.payment_status}</span></td>
              <td onClick={e => e.stopPropagation()}>
                <div className="vendor-row-actions">
                  <button className="tax-icon-btn" type="button" title="Open the tax filing record / receipt" aria-label={`Open the receipt for ${r.tax_record_id}`} onClick={() => { setSelectedId(r.id); setDetailTab("Record"); }}><ReceiptText size={16}/></button>
                  <button className="tax-icon-btn" type="button" title="Print the tax record / report" aria-label={`Print ${r.tax_record_id}`} onClick={() => printRecord(r)}><Printer size={16}/></button>
                  <button className="tax-icon-btn" type="button" title="More actions" aria-label={`More actions for ${r.tax_record_id}`} onClick={() => setMenuFor(menuFor === r.id ? null : r.id)}><MoreHorizontal size={16}/></button>
                  {menuFor === r.id && <TaxRecordMenu record={r} saving={saving} onClose={() => setMenuFor(null)}
                    onEdit={() => { setMenuFor(null); setEditing(r); }}
                    onRemit={() => { setMenuFor(null); setRemitting(r); }}
                    onFile={() => { setMenuFor(null); setFiling(r); }}
                    onCancel={() => { setMenuFor(null); setCancelling(r); }} />}
                </div>
              </td>
            </tr>)}
        </tbody>
      </table>
    </div>

    {selected && <TaxRecordDetail record={selected} tab={detailTab} setTab={setDetailTab} revealed={revealed} toggle={toggle} saving={saving}
      onVerify={() => run("Verified tax record", async () => (await taxRequest(`${API_BASE}/api/tax/records/${selected.id}/verify`, { method: "POST", body: JSON.stringify({ verified_by: "Tax Commissioner" }) })).message)}
      onForFiling={() => run("Queued tax record for filing", async () => (await taxRequest(`${API_BASE}/api/tax/records/${selected.id}/for-filing`, { method: "POST", body: JSON.stringify({}) })).message)}
      onPrint={() => printRecord(selected)} />}

    {intake && <TaxRecordIntakeModal eligible={eligible} saving={saving} onClose={() => setIntake(null)}
      onSubmit={async payload => { const r = await run("Created tax record", async () => (await taxRequest(`${API_BASE}/api/tax/records`, { method: "POST", body: JSON.stringify(payload) })).message); if (r) setIntake(null); return r; }} />}

    {editing && <TaxRecordEditModal record={editing} saving={saving} onClose={() => setEditing(null)}
      onSubmit={async payload => { const r = await run("Updated tax record", async () => (await taxRequest(`${API_BASE}/api/tax/records/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) })).message); if (r) setEditing(null); return r; }} />}

    {remitting && <TaxRecordRemitModal record={remitting} saving={saving} onClose={() => setRemitting(null)}
      onSubmit={async amount => { const r = await run("Recorded tax remittance", async () => (await taxRequest(`${API_BASE}/api/tax/records/${remitting.id}/payment`, { method: "POST", body: JSON.stringify({ amount, verified_by: "Treasury Officer" }) })).message); if (r) setRemitting(null); return r; }} />}

    {filing && <TaxRecordFileModal record={filing} saving={saving} onClose={() => setFiling(null)}
      onSubmit={async returnNumber => { const r = await run("Filed tax record", async () => (await taxRequest(`${API_BASE}/api/tax/records/${filing.id}/file`, { method: "POST", body: JSON.stringify({ return_number: returnNumber, verified_by: "Tax Commissioner" }) })).message); if (r) setFiling(null); return r; }} />}

    {cancelling && <TaxRecordCancelModal record={cancelling} saving={saving} onClose={() => setCancelling(null)}
      onSubmit={async reason => { const r = await run("Cancelled tax record", async () => (await taxRequest(`${API_BASE}/api/tax/records/${cancelling.id}/cancel`, { method: "POST", body: JSON.stringify({ reason }) })).message); if (r) setCancelling(null); return r; }} />}
  </section>;
}

function TaxCalculationPage({ onAudit }) {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("All Periods");
  const [filterType, setFilterType] = useState("All Types");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [selectedId, setSelectedId] = useState(null);
  const [detailTab, setDetailTab] = useState("Source");

  const [intake, setIntake] = useState(null);
  const [adjusting, setAdjusting] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [menuFor, setMenuFor] = useState(null);
  const [revealed, setRevealed] = useState({});

  const toggle = (key) => setRevealed(prev => ({ ...prev, [key]: !prev[key] }));

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const payload = await taxRequest(`${API_BASE}/api/tax/calculations`);
      setRecords(Array.isArray(payload?.data) ? payload.data : []);
      // The cards read the backend's own summary of the same rows.
      setSummary(payload?.summary || null);
    } catch (error) {
      setRecords([]);
      setSummary(null);
      setLoadError(taxFailure(error, "tax calculations"));
    } finally {
      setLoading(false);
    }
  };

  // The real transactions the intake form can be built from, read live from the
  // other modules' tables.
  const loadSources = async () => {
    try {
      const payload = await taxRequest(`${API_BASE}/api/tax/calculations/sources`);
      setSources(Array.isArray(payload?.data) ? payload.data : []);
    } catch {
      setSources([]);
    }
  };

  useEffect(() => { load(); loadSources(); }, []);

  const filteredRecords = useMemo(() => {
    const phrase = search.trim().toLowerCase();
    return records.filter(row => {
      if (filterPeriod !== "All Periods" && row.tax_period !== filterPeriod) return false;
      if (filterType !== "All Types" && row.tax_type !== filterType) return false;
      if (filterStatus !== "All Status" && row.status !== filterStatus) return false;
      if (!phrase) return true;
      return [row.tax_calculation_id, row.reference_number, row.client_supplier, row.transaction_type, row.tax_type]
        .some(v => String(v || "").toLowerCase().includes(phrase));
    });
  }, [records, search, filterPeriod, filterType, filterStatus]);

  const selected = useMemo(
    () => records.find(r => r.id === selectedId) || filteredRecords[0] || null,
    [records, filteredRecords, selectedId]
  );

  const periods = useMemo(
    () => [...new Set(records.map(r => r.tax_period).filter(Boolean))].sort().reverse(),
    [records]
  );

  // Any mutation re-reads afterwards, otherwise the cards would keep showing the
  // pre-edit figures while the table row had already changed.
  const runAction = async (label, action) => {
    setSaving(true);
    try {
      const result = await action();
      setLoadError("");
      if (result?.message) onAudit?.(result.message);
      await load();
      return result;
    } catch (error) {
      setLoadError(taxFailure(error, label));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const call = (row, endpoint, payload) =>
    taxRequest(`${API_BASE}/api/tax/calculations/${row.id}/${endpoint}`, {
      method: "PUT",
      body: JSON.stringify(payload || {}),
    });

  const doVerify = async (row) => {
    if (!row.can_verify) {
      window.alert(row.status === "Verified"
        ? `${row.tax_calculation_id} is already verified.`
        : `${row.tax_calculation_id} was cancelled and cannot be verified.`);
      return;
    }
    // Outstanding findings are shown before the click, so the user knows why the
    // backend will refuse rather than discovering it from an error banner.
    if (row.findings.length) {
      window.alert(`${row.tax_calculation_id} cannot be verified:\n\n- ${row.findings.join("\n- ")}`);
      return;
    }
    const result = await runAction(`verifying ${row.tax_calculation_id}`, () =>
      call(row, "verify", { verified_by: "Tax Commissioner" })
    );
    if (result) window.alert(result.message);
  };

  const doRecalculate = async (row) => {
    const result = await runAction(`recalculating ${row.tax_calculation_id}`, () =>
      call(row, "recalculate", { calculated_by: "Tax Officer" })
    );
    if (result) window.alert(result.message);
  };

  const doDelete = async (row) => {
    if (!window.confirm(`Delete ${row.tax_calculation_id}? Its adjustments and review trail will also be removed.`)) return;
    const result = await runAction(`deleting ${row.tax_calculation_id}`, () =>
      taxRequest(`${API_BASE}/api/tax/calculations/${row.id}`, { method: "DELETE" })
    );
    if (result) { setSelectedId(null); window.alert(result.message); }
  };

  // The printed record shows the real amounts: masking a filed tax record would
  // defeat the purpose of printing it.
  const printRecord = (row) => {
    const w = window.open("", "_blank");
    if (!w) { window.alert("The print window was blocked. Allow pop-ups for this site and try again."); return; }
    const line = (a, b) => `<tr><td style="padding:4px"><b>${a}:</b></td><td>${b}</td></tr>`;
    w.document.write(`<html><head><title>${row.tax_calculation_id}</title></head><body style="font-family:Arial;padding:40px">
      <h2 style="text-align:center">PRIMEPOWER</h2>
      <h3 style="text-align:center">TAX CALCULATION RECORD</h3><hr/>
      <table style="width:100%;border-collapse:collapse">
        ${line("Tax Calculation ID", taxBlank(row.tax_calculation_id))}
        ${line("Tax Period", taxBlank(row.tax_period))}
        ${line("Transaction Type", taxBlank(row.transaction_type))}
        ${line("Reference No.", taxBlank(row.reference_number))}
        ${line("Client / Supplier", taxBlank(row.client_supplier))}
        ${line("Transaction Date", taxDate(row.transaction_date))}
        ${line("Tax Type", taxBlank(row.tax_type))}
        ${line("Taxable Status", taxBlank(row.taxable_status))}
        ${line("Gross Amount", taxMoney(row.gross_amount))}
        ${line("Less: Discount", taxMoney(row.discount))}
        ${line("Tax-exempt Amount", taxMoney(row.exempt_amount))}
        ${line("Zero-rated Amount", taxMoney(row.zero_rated_amount))}
        ${line("Taxable Amount", `<b>${taxMoney(row.taxable_amount)}</b>`)}
        ${line("Tax Rate", `${row.tax_rate}%`)}
        ${line("Tax Amount", `<b>${taxMoney(row.tax_amount)}</b>`)}
        ${line("Less: Withholding Tax", taxMoney(row.withholding_tax))}
        ${line("Total Tax Payable", `<b>${taxMoney(row.total_tax)}</b>`)}
        ${line("Calculated By", taxBlank(row.calculated_by))}
        ${line("Verified By", taxBlank(row.verified_by))}
        ${line("Status", `<b>${taxBlank(row.status).toUpperCase()}</b>`)}
      </table>
      <div style="margin-top:60px;display:flex;justify-content:space-between">
        <div style="width:30%;border-top:1px solid #000;padding-top:6px">Calculated By</div>
        <div style="width:30%;border-top:1px solid #000;padding-top:6px">Reviewed By</div>
        <div style="width:30%;border-top:1px solid #000;padding-top:6px">Approved By</div>
      </div>
      <script>window.print()</script></body></html>`);
    w.document.close();
  };

  const s = summary;

  return <section className="management-page vendor-payment-page">
    <Breadcrumb current="Tax Calculation" parent="Tax Management" />
    <div className="management-header">
      <div><h2>TAX CALCULATION</h2><p>Calculate, review and verify tax on transactions recorded across billing, payments, payables and expenses.</p></div>
      <div className="management-actions">
        <button className="light-button" onClick={() => window.print()} disabled={saving}><Printer size={15}/> Print / Save PDF</button>
        <button className="primary-button" onClick={() => setIntake({})} disabled={saving}>＋ New Tax Calculation</button>
      </div>
    </div>

    <div className="vendor-toolbar">
      <div className="search-box vendor-search"><span>⌕</span><input placeholder="Search reference, client, transaction type..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="vendor-toolbar-controls">
        <select className="vendor-select" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} aria-label="Tax period">
          <option>All Periods</option>
          {periods.map(p => <option key={p}>{p}</option>)}
        </select>
        <select className="vendor-select" value={filterType} onChange={e => setFilterType(e.target.value)} aria-label="Tax type">
          <option>All Types</option>
          {TAX_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="vendor-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} aria-label="Status">
          <option>All Status</option>
          {TAX_STATUSES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
    </div>

    {loadError && <div className="cfu-error" role="alert">{loadError}</div>}

    <div className="vendor-summary-grid">
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Total Taxable Amount</span>
        <TaxCardAmount id="tx-taxable" value={s ? s.total_taxable : 0} revealed={revealed} onToggle={toggle} tone="total-supplies-amount" />
        <span className="vendor-summary-count">{s ? s.total : 0} record{(s ? s.total : 0) === 1 ? "" : "s"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Total Tax Calculated</span>
        <TaxCardAmount id="tx-calculated" value={s ? s.total_tax_calculated : 0} revealed={revealed} onToggle={toggle} tone="calculated-amount" />
        <span className="vendor-summary-count">net payable {s ? <RevealableAmount value={taxMoney(s.total_tax_payable)} /> : "—"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Pending Review</span>
        <TaxCardAmount id="tx-pending" value={s ? s.pending_review_amount : 0} revealed={revealed} onToggle={toggle} tone="pending-amount" />
        <span className="vendor-summary-count">{s ? s.pending_review : 0} awaiting sign-off</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Verified Tax</span>
        <TaxCardAmount id="tx-verified" value={s ? s.verified_amount : 0} revealed={revealed} onToggle={toggle} tone="verified-amount" />
        <span className="vendor-summary-count">{s ? s.verified : 0} verified</span>
      </div>
    </div>

    {/* The by-type summary the document calls for, straight from the backend. */}
    {s && s.by_tax_type.some(t => t.count > 0) && (
      <section className="vendor-record-panel">
        <div className="vendor-record-heading"><h3>Summary by Tax Type</h3></div>
        <div className="table-card vendor-table-card">
          <table>
            <thead>
              <tr>
                <th>Tax Type</th>
                <th className="money-cell">Taxable Amount</th>
                <th className="money-cell">Tax Calculated</th>
                <th className="money-cell">Net Payable</th>
                <th>Records</th>
              </tr>
            </thead>
            <tbody>
              {s.by_tax_type.filter(t => t.count > 0).map(t => (
                <tr key={t.tax_type}>
                  <td><span className={taxTypeClass(t.tax_type)}>{t.tax_type}</span></td>
                  <td className="money-cell"><RevealableAmount value={taxMoney(t.taxable_amount)} /></td>
                  <td className="money-cell"><RevealableAmount value={taxMoney(t.tax_amount)} /></td>
                  <td className="money-cell"><RevealableAmount value={taxMoney(t.total_tax)} /></td>
                  <td>{t.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    )}

    <section className="vendor-record-panel">
      <div className="vendor-record-heading">
        <h3>Tax Calculations</h3>
        <span className="vendor-summary-count">{filteredRecords.length} of {records.length} shown</span>
      </div>
      <div className="table-card vendor-table-card">
        <table>
          <thead>
            <tr>
              <th>Tax Calculation ID</th>
              <th>Reference</th>
              <th>Client / Supplier</th>
              <th>Tax Type</th>
              <th className="money-cell">Taxable Amount</th>
              <th className="money-cell">Rate</th>
              <th className="money-cell">Tax Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="9" className="empty">Loading tax calculations...</td></tr>}
            {!loading && filteredRecords.length === 0 && (
              <tr><td colSpan="9" className="empty">No tax calculations match the current search and filters.</td></tr>
            )}
            {!loading && filteredRecords.map(r => <tr key={r.id} onClick={() => setSelectedId(r.id)} className={selected?.id === r.id ? "selected-row" : ""}>
              <td className="link-cell"><RevealableText value={r.tax_calculation_id} /></td>
              <td><RevealableText value={taxBlank(r.reference_number)} /></td>
              <td className="strong-cell"><RevealableText value={taxBlank(r.client_supplier)} /></td>
              <td><span className={taxTypeClass(r.tax_type)}>{r.tax_type}</span></td>
              <td className="money-cell"><TaxMasked rowId={r.id} value={r.taxable_amount} revealed={revealed} onToggle={toggle} /></td>
              <td className="money-cell">{r.tax_rate}%</td>
              <td className="money-cell"><RevealableAmount value={taxMoney(r.tax_amount)} /></td>
              {/* The badge colour comes from the status the API returned. */}
              <td><span className={taxStatusClass(r.status)}>{r.status}</span></td>
              <td onClick={e => e.stopPropagation()}>
                <div className="row-actions">
                  <button className="tax-icon-btn" type="button" title="View details" aria-label={`View ${r.tax_calculation_id}`} onClick={() => { setSelectedId(r.id); setDetailTab("Source"); }}><Eye size={16}/></button>
                  <button
                    className={r.can_verify && !r.findings.length ? "tax-icon-btn" : "tax-icon-btn sp-blocked"}
                    type="button"
                    title={r.can_verify
                      ? `Verify ${r.tax_calculation_id}`
                      : r.status === "Verified"
                        ? `${r.tax_calculation_id} is already verified`
                        : r.findings.length
                          ? `Blocked: ${r.findings[0]}`
                          : `${r.tax_calculation_id} is ${String(r.status).toLowerCase()}`}
                    aria-label={`Verify ${r.tax_calculation_id}`}
                    disabled={saving}
                    onClick={() => doVerify(r)}
                  ><ShieldCheck size={16}/></button>
                  <button className="tax-icon-btn" type="button" title="Print record" aria-label={`Print ${r.tax_calculation_id}`} onClick={() => printRecord(r)}><Printer size={16}/></button>
                  <div className="row-menu">
                    <button className="tax-icon-btn" type="button" title="More actions" aria-label={`More actions for ${r.tax_calculation_id}`} onClick={() => setMenuFor(menuFor === r.id ? null : r.id)}><MoreHorizontal size={16}/></button>
                    {menuFor === r.id && (
                      <div className="row-menu-popover">
                        <button type="button" disabled={saving} onClick={() => { setMenuFor(null); setAdjusting({ ...r }); }}>Add adjustment</button>
                        <button type="button" disabled={saving} onClick={() => { setMenuFor(null); doRecalculate(r); }}>Recalculate from source</button>
                        <button type="button" disabled={saving} onClick={() => { setMenuFor(null); setRejecting({ ...r }); }}>Reject</button>
                        <button type="button" className="danger" disabled={saving} onClick={() => { setMenuFor(null); doDelete(r); }}>Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </section>

    {selected && (
      <section className="vendor-detail-panel">
        <div className="vendor-detail-header">
          <div>
            <span className="vendor-detail-kicker">Tax Calculation</span>
            <h3><RevealableText value={selected.tax_calculation_id} /> — <RevealableText value={taxBlank(selected.client_supplier)} /></h3>
            <p className="vp-detail-sub"><RevealableText value={taxBlank(selected.reference_number)} /> &middot; {taxBlank(selected.transaction_type)}</p>
          </div>
          <div className="sp-detail-actions">
            <span className={taxTypeClass(selected.tax_type)}>{selected.tax_type}</span>
            <span className={taxStatusClass(selected.status)}>{selected.status}</span>
            <button type="button" className="light-button" onClick={() => printRecord(selected)}><Printer size={14}/> Record</button>
          </div>
        </div>

        {selected.findings.length > 0 && (
          <div className="cfu-error" role="alert">
            <b>This calculation cannot be verified yet:</b>
            {selected.findings.map((f, i) => <div key={i}>{f}</div>)}
          </div>
        )}

        <div className="vp-tabs">
          {["Source", "Calculation", "Adjustments", "Review"].map(tab => (
            <button key={tab} type="button" className={`vp-tab ${detailTab === tab ? "active" : ""}`} onClick={() => setDetailTab(tab)}>
              {tab}
              {tab === "Adjustments" && selected.adjustments.length > 0 && <span className="vp-tab-count">{selected.adjustments.length}</span>}
              {tab === "Review" && selected.activities.length > 0 && <span className="vp-tab-count">{selected.activities.length}</span>}
            </button>
          ))}
        </div>

        <div className="vendor-detail-grid">
          {detailTab === "Source" && (
            <div className="vendor-detail-block">
              <h4>Source Transaction</h4>
              <div className="vendor-detail-list">
                <div><span>Transaction Type</span><b>{taxBlank(selected.transaction_type)}</b></div>
                <div><span>Reference No.</span><b><RevealableText value={taxBlank(selected.reference_number)} /></b></div>
                <div><span>Client / Supplier</span><b><RevealableText value={taxBlank(selected.client_supplier)} /></b></div>
                <div><span>Transaction Date</span><b>{taxDate(selected.transaction_date)}</b></div>
                <div><span>Source Table</span><b>{taxBlank(selected.source_table)}</b></div>
                <div><span>Tax Period</span><b>{taxBlank(selected.tax_period)}</b></div>
                <div><span>Gross Amount</span><b><RevealableAmount value={taxMoney(selected.gross_amount)} /></b></div>
                <div><span>Taxable Status</span><b>{taxBlank(selected.taxable_status)}</b></div>
              </div>
            </div>
          )}

          {detailTab === "Calculation" && (
            <div className="vendor-detail-block">
              <h4>Tax Calculation</h4>
              <div className="vendor-detail-list">
                <div><span>Gross Amount</span><b><RevealableAmount value={taxMoney(selected.gross_amount)} /></b></div>
                <div><span>Less: Discount</span><b><RevealableAmount value={taxMoney(selected.discount)} /></b></div>
                <div><span>Less: Tax-exempt</span><b><RevealableAmount value={taxMoney(selected.exempt_amount)} /></b></div>
                <div><span>Less: Zero-rated</span><b><RevealableAmount value={taxMoney(selected.zero_rated_amount)} /></b></div>
                <div><span>Taxable Amount</span><b><RevealableAmount value={taxMoney(selected.taxable_amount)} /></b></div>
                <div><span>Tax Rate</span><b>{selected.tax_rate}% ({taxBlank(selected.tax_type)})</b></div>
                <div><span>Tax Amount</span><b><RevealableAmount value={taxMoney(selected.tax_amount)} /></b></div>
                <div><span>Less: Withholding Tax</span><b><RevealableAmount value={taxMoney(selected.withholding_tax)} /></b></div>
                <div><span>Less: Tax Credit</span><b><RevealableAmount value={taxMoney(selected.tax_credit)} /></b></div>
                <div><span>Total Tax Payable</span><b><RevealableAmount value={taxMoney(selected.total_tax)} /></b></div>
                <div><span>Total Amount</span><b><RevealableAmount value={taxMoney(selected.total_amount)} /></b></div>
              </div>
            </div>
          )}

          {detailTab === "Adjustments" && (
            <div className="vendor-detail-block">
              <h4>Tax Adjustments</h4>
              {selected.adjustments.length === 0 ? (
                <div className="vendor-detail-list"><div><span>Adjustments</span><b>None recorded</b></div></div>
              ) : (
                <div className="vendor-detail-list">
                  {selected.adjustments.map(a => (
                    <div key={a.id}>
                      <span>{taxBlank(a.reason)}</span>
                      <b><RevealableAmount value={taxMoney(a.amount)} /> &middot; {a.affects_taxable ? "reduces the taxable base" : "reduces the tax payable"}</b>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {detailTab === "Review" && (
            <div className="vendor-detail-block vp-timeline-block">
              <h4>Review Trail</h4>
              <div className="vendor-detail-list">
                <div><span>Calculated By</span><b>{taxBlank(selected.calculated_by)}</b></div>
                <div><span>Calculation Date</span><b>{taxDate(selected.calculated_at)}</b></div>
                <div><span>Verified By</span><b>{taxBlank(selected.verified_by)}</b></div>
                <div><span>Verification Date</span><b>{taxDate(selected.verified_at)}</b></div>
                <div><span>Rejection Reason</span><b>{selected.status === "Rejected" ? taxBlank(selected.rejection_reason) : "—"}</b></div>
                <div><span>Remarks</span><b>{taxBlank(selected.remarks)}</b></div>
              </div>
              <div className="vp-timeline" style={{ marginTop: 12 }}>
                {selected.activities.length === 0 && <p className="empty">No activity recorded yet.</p>}
                {selected.activities.map(entry => (
                  <div className="vp-timeline-item" key={entry.id}>
                    <span className="vp-timeline-dot" />
                    <div>
                      <strong>{taxBlank(entry.action)}</strong>
                      <p>{taxBlank(entry.remarks)}</p>
                      <small>{taxDateTime(entry.created_at)} &middot; {taxBlank(entry.actor)}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    )}

    {/* Add Adjustment dialog — POST /api/tax/calculations/:id/adjustments. The tax
        figures are recomputed by the backend on the next read. */}
    {adjusting && (
      <div className="modal-overlay" onClick={() => !saving && setAdjusting(null)}>
        <form
          className="modal"
          onClick={e => e.stopPropagation()}
          onSubmit={async e => {
            e.preventDefault();
            const f = e.target;
            const result = await runAction(`recording an adjustment on ${adjusting.tax_calculation_id}`, () =>
              taxRequest(`${API_BASE}/api/tax/calculations/${adjusting.id}/adjustments`, {
                method: "POST",
                body: JSON.stringify({
                  reason: f.reason.value,
                  amount: Number(f.amount.value),
                  affects_taxable: f.affects_taxable.value === "yes",
                  notes: f.notes.value,
                  created_by: "Tax Officer",
                }),
              })
            );
            if (result) { setAdjusting(null); window.alert(result.message); }
          }}
        >
          <div className="modal-header">
            <div>
              <h2>Add Adjustment — {adjusting.tax_calculation_id}</h2>
              <p>Current taxable amount: <RevealableAmount value={taxMoney(adjusting.taxable_amount)} /></p>
            </div>
            <button type="button" onClick={() => setAdjusting(null)} disabled={saving}><X size={20}/></button>
          </div>
          <div className="form-grid">
            <label>Reason
              <select name="reason" defaultValue="Withholding tax">
                {TAX_ADJUSTMENT_REASONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </label>
            <label>Amount<input name="amount" type="number" min="0" step="0.01" required /></label>
            <label className="full">Affects
              <select name="affects_taxable" defaultValue="no">
                <option value="no">The tax payable</option>
                <option value="yes">The taxable base</option>
              </select>
            </label>
            <label className="full">Notes<textarea name="notes" rows="2" /></label>
          </div>
          <div className="modal-footer">
            <button type="button" className="light-button" onClick={() => setAdjusting(null)} disabled={saving}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : "Record Adjustment"}</button>
          </div>
        </form>
      </div>
    )}

    {/* Reject dialog — a reason is required so the record says what to correct. */}
    {rejecting && (
      <div className="modal-overlay" onClick={() => !saving && setRejecting(null)}>
        <form
          className="modal"
          onClick={e => e.stopPropagation()}
          onSubmit={async e => {
            e.preventDefault();
            const result = await runAction(`rejecting ${rejecting.tax_calculation_id}`, () =>
              call(rejecting, "reject", {
                rejection_reason: e.target.rejection_reason.value,
                rejected_by: "Tax Commissioner",
              })
            );
            if (result) { setRejecting(null); window.alert(result.message); }
          }}
        >
          <div className="modal-header">
            <div>
              <h2>Reject — {rejecting.tax_calculation_id}</h2>
              <p><RevealableAmount value={taxMoney(rejecting.total_tax)} /> total tax payable</p>
            </div>
            <button type="button" onClick={() => setRejecting(null)} disabled={saving}><X size={20}/></button>
          </div>
          <div className="form-grid">
            <label className="full">Reason for rejection
              <textarea name="rejection_reason" rows="3" placeholder="Explain what must be corrected..." required />
            </label>
          </div>
          <div className="modal-footer">
            <button type="button" className="light-button" onClick={() => setRejecting(null)} disabled={saving}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : "Reject Calculation"}</button>
          </div>
        </form>
      </div>
    )}

    {intake && (
      <TaxIntakeForm
        sources={sources}
        saving={saving}
        onClose={() => setIntake(null)}
        onSubmit={async (payload) => {
          const result = await runAction("creating a tax calculation", () =>
            taxRequest(`${API_BASE}/api/tax/calculations`, { method: "POST", body: JSON.stringify(payload) })
          );
          if (result) { setIntake(null); window.alert(result.message); }
        }}
      />
    )}
  </section>;
}

// The intake. The transaction is chosen from the real records the API returns and
// the amount is READ by the backend, so nothing here can be typed to disagree with
// the transaction it claims to come from.
function TaxIntakeForm({ sources, saving, onClose, onSubmit }) {
  const [table, setTable] = useState(sources[0] ? sources[0].table : "");
  const [reference, setReference] = useState("");
  const [taxType, setTaxType] = useState("VAT");
  const [taxableStatus, setTaxableStatus] = useState("Taxable");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");

  const group = sources.find(g => g.table === table);
  const picked = group ? group.items.find(i => i.reference_number === reference) : null;

  // The rate is read from the tax type rather than typed, so a VAT record cannot be
  // filed at the withholding rate by accident. The preview is only a preview; the
  // backend computes the real figure.
  const RATE = { VAT: 12, "Withholding Tax": 2, "Tax-Exempt": 0, "Zero-Rated": 0 };
  const rate = RATE[taxType] ?? 12;
  const previewTax = picked && taxableStatus === "Taxable"
    ? Number(((picked.source_amount * rate) / 100).toFixed(2))
    : 0;

  const submit = e => {
    e.preventDefault();
    if (!table || !reference) { setError("Choose the transaction this calculation is for."); return; }
    if (!picked) { setError("That transaction is no longer available. Pick another."); return; }
    onSubmit({
      source_table: table,
      reference_number: reference,
      tax_type: taxType,
      taxable_status: taxableStatus,
      tax_period_start: periodStart || null,
      tax_period_end: periodEnd || null,
      calculated_by: "Tax Officer",
      remarks,
    });
  };

  return (
    <div className="modal-overlay" onClick={() => !saving && onClose()}>
      <form className="modal vp-intake" onClick={e => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-header">
          <div><h2>New Tax Calculation</h2><p>Pick the transaction to calculate tax on</p></div>
          <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
        </div>
        {error && <div className="cfu-error" role="alert">{error}</div>}
        <div className="form-grid">
          <label>Transaction Type
            <select value={table} onChange={e => { setTable(e.target.value); setReference(""); }}>
              {sources.map(g => <option key={g.table} value={g.table}>{g.transaction_type} ({g.items.length})</option>)}
            </select>
          </label>
          <label>Reference No.
            <select value={reference} onChange={e => setReference(e.target.value)} required>
              <option value="">Select transaction...</option>
              {(group ? group.items : []).map(item => (
                <option key={item.reference_number} value={item.reference_number}>
                  {taxBlank(item.reference_number)} — {taxBlank(item.client_supplier)}
                </option>
              ))}
            </select>
          </label>
          <label>Tax Type
            <select value={taxType} onChange={e => setTaxType(e.target.value)}>
              {TAX_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label>Taxable Status
            <select value={taxableStatus} onChange={e => setTaxableStatus(e.target.value)}>
              <option>Taxable</option>
              <option>Exempt</option>
              <option>Zero-Rated</option>
            </select>
          </label>
          <label>Tax Period Start<input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} /></label>
          <label>Tax Period End<input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} /></label>
          <label className="full">Remarks<textarea rows="2" value={remarks} onChange={e => setRemarks(e.target.value)} /></label>
          <label className="full">
            Source Amount: <b>{picked ? <RevealableAmount value={taxMoney(picked.source_amount)} /> : "—"}</b>
            {"  "}&middot; Rate <b>{rate}%</b>
            {"  "}&middot; Tax <b><RevealableAmount value={taxMoney(previewTax)} /></b>
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="light-button" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="primary-button" disabled={saving}>{saving ? "Creating..." : "Create Calculation"}</button>
        </div>
      </form>
    </div>
  );
}

export { TaxCalculationPage, TaxRecordsPage, TaxFilingPreparationPage };
