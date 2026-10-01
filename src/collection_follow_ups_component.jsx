import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  HandCoins,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

const FOLLOW_UP_METHODS = ["Phone Call", "Email", "SMS", "In Person"];
const FOLLOW_UP_RESULTS = [
  "Contacted",
  "Promise to Pay",
  "Pending Response",
  "No Response",
  "Rescheduled",
];
const FOLLOW_UP_STATUSES = [
  "Pending",
  "Contacted",
  "Promise to Pay",
  "Rescheduled",
  "Completed",
  "Overdue",
];

const EMPTY_SUMMARY = {
  as_of: "",
  total: 0,
  pending: 0,
  contacted: 0,
  promise_to_pay: 0,
  overdue: 0,
  completed: 0,
  outstanding_balance: 0,
};

const money = (value) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const display = (value) =>
  value === null || value === undefined || value === "" ? "—" : value;

const slug = (value) =>
  String(value || "unknown").toLowerCase().trim().replace(/\s+/g, "-");

const todayYmd = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
};

const addDaysYmd = (ymd, days) => {
  const date = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
};

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
    const message =
      payload.message || "The collection follow-up request failed.";
    const error = new Error(message);
    error.details = payload.errors;
    error.status = response.status;
    throw error;
  }
  return payload;
}

const emptyForm = () => ({
  id: null,
  follow_up_id: "",
  invoice_no: "",
  last_contact: "",
  next_follow_up: addDaysYmd(todayYmd(), 7),
  follow_up_method: "Phone Call",
  result: "Pending Response",
  assigned_collector: "",
  status: "Pending",
  remarks: "",
});

const Breadcrumb = () => (
  <div className="breadcrumb">
    <span>Collection Management</span>
    <span> / </span>
    <strong>Collection Follow-ups</strong>
  </div>
);

const ResultBadge = ({ value }) => (
  <span className={`cfu-badge result ${slug(value)}`}>{display(value)}</span>
);

const StatusBadge = ({ value }) => (
  <span className={`cfu-badge status ${slug(value)}`}>{display(value)}</span>
);

function MaskedAmount({ id, value, revealed, onToggle }) {
  const open = Boolean(revealed[id]);
  return (
    <button
      type="button"
      className={`cfu-amount ${open ? "is-open" : "is-hidden"}`}
      onClick={(event) => {
        event.stopPropagation();
        onToggle(id);
      }}
      aria-label={`${open ? "Hide" : "Reveal"} balance ${money(value)}`}
      aria-pressed={open}
      title={open ? "Click to hide balance" : "Click to reveal balance"}
    >
      {open ? money(value) : "*"}
    </button>
  );
}
const FILTER_FALLBACK = {
  clients: [],
  collectors: [],
  methods: FOLLOW_UP_METHODS,
  results: FOLLOW_UP_RESULTS,
  statuses: FOLLOW_UP_STATUSES,
};

function CollectionFollowUpsPage({ onAudit, navigate }) {
  const [followUps, setFollowUps] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [filterOptions, setFilterOptions] = useState(FILTER_FALLBACK);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    client: "",
    status: "",
    result: "",
    from: "",
    to: "",
  });
  const [revealed, setRevealed] = useState({});
  const [form, setForm] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const queryString = useMemo(() => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    return query.toString();
  }, [filters]);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError("");
    try {
      const [listPayload, filterPayload, invoicePayload] = await Promise.all([
        request(`/api/collection-follow-ups${queryString ? `?${queryString}` : ""}`),
        request("/api/collection-follow-ups/filters"),
        request("/api/collection-follow-ups/invoices"),
      ]);
      setFollowUps(Array.isArray(listPayload.data) ? listPayload.data : []);
      setSummary({
        ...EMPTY_SUMMARY,
        ...(listPayload.filtered_summary || listPayload.summary || {}),
      });
      setFilterOptions({ ...FILTER_FALLBACK, ...(filterPayload.data || {}) });
      setInvoices(Array.isArray(invoicePayload.data) ? invoicePayload.data : []);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [queryString]);

  const updateFilter = (field, value) =>
    setFilters((current) => ({ ...current, [field]: value }));
  const cardFilters = {
    total: { status: "", result: "" },
    pending: { status: "Pending", result: "" },
    contacted: { status: "", result: "Contacted" },
    promise_to_pay: { status: "", result: "Promise to Pay" },
    overdue: { status: "Overdue", result: "" },
  };

  const applySummaryFilter = (key) => {
    const next = cardFilters[key] || cardFilters.total;
    setFilters((current) => ({ ...current, ...next }));
  };



  const clearFilters = () => {
    setFilters({ search: "", client: "", status: "", result: "", from: "", to: "" });
    setNotice("Filters cleared.");
  };

  const toggleAmount = (id) =>
    setRevealed((current) => ({ ...current, [id]: !current[id] }));

  const selectedInvoice = invoices.find(
    (invoice) => String(invoice.invoice_no) === String(form?.invoice_no)
  );

  const openNew = () => {
    setFormErrors({});
    setNotice("");
    setForm(emptyForm());
  };



  const openEdit = async (record) => {
    setNotice("");
    setFormErrors({});
    setDetailLoading(true);
    try {
      const payload = await request(`/api/collection-follow-ups/${record.id}`);
      const item = payload.data;
      setForm({
        ...emptyForm(),
        ...item,
        last_contact: item.last_contact || "",
        next_follow_up: item.next_follow_up || "",
        remarks: item.remarks || "",
      });
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!form.invoice_no) errors.invoice_no = "Select a database invoice.";
    if (!form.assigned_collector.trim()) {
      errors.assigned_collector = "Assigned collector is required.";
    }
    if (form.last_contact && !/^\d{4}-\d{2}-\d{2}$/.test(form.last_contact)) {
      errors.last_contact = "Enter a valid last-contact date.";
    }
    if (form.next_follow_up && !/^\d{4}-\d{2}-\d{2}$/.test(form.next_follow_up)) {
      errors.next_follow_up = "Enter a valid next follow-up date.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const saveForm = async (event) => {
    event.preventDefault();
    if (!form || !validateForm()) return;
    setSaving(true);
    setLoadError("");
    try {
      const payload = {
        invoice_no: form.invoice_no,
        last_contact: form.last_contact || null,
        next_follow_up: form.next_follow_up || null,
        follow_up_method: form.follow_up_method,
        result: form.result,
        assigned_collector: form.assigned_collector.trim(),
        status: form.status,
        remarks: form.remarks.trim(),
      };
      const response = await request(
        form.id ? `/api/collection-follow-ups/${form.id}` : "/api/collection-follow-ups",
        { method: form.id ? "PUT" : "POST", body: JSON.stringify(payload) }
      );
      onAudit?.(
        form.id ? "Updated collection follow-up" : "Created collection follow-up",
        response.data.follow_up_id
      );
      setForm(null);
      setNotice(response.message);
      await loadData(true);
    } catch (error) {
      if (error.details && typeof error.details === "object" && !Array.isArray(error.details)) {
        setFormErrors(error.details);
      }
      setLoadError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (record) => {
    setNotice("");
    setDetailLoading(true);
    setDetail({ loading: true, followUp: record });
    try {
      const payload = await request(`/api/collection-follow-ups/${record.id}`);
      setDetail({ loading: false, followUp: payload.data });
      onAudit?.("Viewed collection follow-up", record.follow_up_id);
    } catch (error) {
      setLoadError(error.message);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };
  const printRecord = (record) => {
    const popup = window.open("", "_blank");
    if (!popup) {
      setLoadError("The print window was blocked. Allow pop-ups and try again.");
      return;
    }
    const fields = [
      ["Follow-up ID", record.follow_up_id],
      ["Client", record.client],
      ["Invoice No.", record.invoice_no],
      ["Outstanding Balance", money(record.outstanding_balance)],
      ["Last Contact", dateLabel(record.last_contact)],
      ["Next Follow-up", dateLabel(record.next_follow_up)],
      ["Follow-up Method", record.follow_up_method],
      ["Result", record.result],
      ["Assigned Collector", record.assigned_collector],
      ["Status", record.status],
      ["Remarks", record.remarks || "—"],
    ];
    const rows = fields
      .map(
        ([label, value]) =>
          `<tr><th style="text-align:left;padding:8px;border:1px solid #ccdde8">${escapeHtml(label)}</th><td style="padding:8px;border:1px solid #ccdde8">${escapeHtml(value)}</td></tr>`
      )
      .join("");
    popup.document.write(`<!doctype html><html><head><title>${escapeHtml(record.follow_up_id)}</title></head><body style="font-family:Arial,sans-serif;padding:36px;color:#203b4d">
      <h1 style="color:#0b6f99">PRIMEPOWER</h1><h2>Collection Follow-up</h2>
      <p>Generated: ${escapeHtml(new Date().toLocaleString())}</p><hr />
      <table style="width:100%;border-collapse:collapse">${rows}</table>
      <script>window.print();</script></body></html>`);
    popup.document.close();
    onAudit?.("Printed collection follow-up", record.follow_up_id);
  };

  const deleteRecord = async (record) => {
    if (!window.confirm(`Delete ${record.follow_up_id}? This cannot be undone.`)) return;
    setDeleting(true);
    setLoadError("");
    try {
      const response = await request(`/api/collection-follow-ups/${record.id}`, {
        method: "DELETE",
      });
      setDetail(null);
      setNotice(response.message);
      onAudit?.("Deleted collection follow-up", record.follow_up_id);
      await loadData(true);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setDeleting(false);
    }
  };




  return (
    <section className="management-page collection-follow-ups-page">
      <Breadcrumb />
      <div className="management-header">
        <div>
          <h2>Collection Follow-ups</h2>
          <p>
            Live follow-up records read from the database. Balances are recalculated
            from invoices and Verified payments on every refresh.
          </p>
        </div>
        <div className="management-actions">
          <button type="button" className="light-button" onClick={() => window.print()}>
            <Printer size={15} /> Print List
          </button>
          <button type="button" className="light-button" onClick={() => loadData(true)} disabled={refreshing}>
            <RotateCcw size={15} /> {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <button type="button" className="light-button" onClick={() => navigate?.("Collection Scheduling")}>
            <HandCoins size={15} /> Collection Scheduling
          </button>
          <button type="button" className="primary-button" onClick={openNew}>
            <Plus size={15} /> New Follow-up
          </button>
        </div>
      </div>

      {loadError && (
        <div className="contract-alert cfu-error" role="alert">
          <AlertTriangle size={17} /><span>{loadError}</span>
          <button type="button" className="light-button" onClick={() => loadData(true)}>Retry</button>
        </div>
      )}
      {notice && !loadError && (
        <div className="contract-alert cfu-notice" role="status">
          <CheckCircle2 size={17} /><span>{notice}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setNotice("")}><X size={14} /></button>
        </div>
      )}

      <div className="cfu-summary-grid">
        {[
          ["total", "Total Follow-ups", "Database records", ""],
          ["pending", "Pending", "Awaiting action", "pending"],
          ["contacted", "Contacted", "Contacted results", "contacted"],
          ["promise_to_pay", "Promise to Pay", "Promised payments", "promise"],
          ["overdue", "Overdue", "Past follow-up date", "overdue"],
        ].map(([key, label, note, tone]) => (
          <button
            type="button"
            className={`cfu-summary-card ${tone}`}
            key={key}
            title={`Filter by ${label}`}
            onClick={() => applySummaryFilter(key)}
          >
            <span>{label}</span><strong>{Number(summary[key] || 0)}</strong><small>{note}</small>
          </button>
        ))}
      </div>

      <div className="cfu-toolbar">
        <div className="cfu-search">
          <Search size={14} />
          <input value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Search ID, client, invoice, collector or remarks..." />
        </div>
        <select value={filters.client} onChange={(event) => updateFilter("client", event.target.value)} aria-label="Filter by client">
          <option value="">All Clients</option>
          {filterOptions.clients.map((client) => <option key={client}>{client}</option>)}
        </select>
        <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)} aria-label="Filter by status">
          <option value="">All Statuses</option>
          {filterOptions.statuses.map((status) => <option key={status}>{status}</option>)}
        </select>
        <select value={filters.result} onChange={(event) => updateFilter("result", event.target.value)} aria-label="Filter by result">
          <option value="">All Results</option>
          {filterOptions.results.map((result) => <option key={result}>{result}</option>)}
        </select>
        <label><span>From</span><input type="date" value={filters.from} onChange={(event) => updateFilter("from", event.target.value)} /></label>
        <label><span>To</span><input type="date" value={filters.to} onChange={(event) => updateFilter("to", event.target.value)} /></label>
        <button type="button" className="light-button" onClick={clearFilters}><RotateCcw size={14} /> Clear</button>
      </div>


      <section className="cfu-record-panel">
        <div className="cfu-section-heading">
          <div>
            <h3>Follow-up Records ({followUps.length})</h3>
            <p>{summary.total} total database record{summary.total === 1 ? "" : "s"}</p>
          </div>
          {refreshing && <span><Clock3 size={13} /> Refreshing database…</span>}
        </div>
        <div className="table-card cfu-table-card">
          <table>
            <thead>
              <tr>
                <th>Follow-up ID</th><th>Client</th><th>Invoice No.</th>
                <th>Outstanding Balance</th><th>Last Contact</th>
                <th>Next Follow-up</th><th>Method</th><th>Result</th>
                <th>Assigned Collector</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="cfu-empty"><Clock3 size={17} /> Loading collection follow-ups…</td></tr>
              ) : followUps.length === 0 ? (
                <tr><td colSpan={11} className="cfu-empty"><Search size={18} /> No collection follow-ups match the current filters.</td></tr>
              ) : followUps.map((record) => (
                <tr key={record.id} onClick={() => openDetail(record)}>
                  <td className="link-cell">{record.follow_up_id}</td>
                  <td className="strong-cell">{display(record.client)}</td>
                  <td>{display(record.invoice_no)}</td>
                  <td className="money-cell">
                    <MaskedAmount id={`row-${record.id}`} value={record.outstanding_balance} revealed={revealed} onToggle={toggleAmount} />
                  </td>
                  <td>{dateLabel(record.last_contact)}</td>
                  <td><span className={record.is_overdue ? "cfu-overdue-date" : ""}>{dateLabel(record.next_follow_up)}</span></td>
                  <td>{display(record.follow_up_method)}</td>
                  <td><ResultBadge value={record.result} /></td>
                  <td>{display(record.assigned_collector)}</td>
                  <td><StatusBadge value={record.status} /></td>
                  <td onClick={(event) => event.stopPropagation()}>
                    <div className="cfu-row-actions">
                      <button type="button" onClick={() => openDetail(record)} title="View" aria-label={`View ${record.follow_up_id}`}><Eye size={14} /></button>
                      <button type="button" onClick={() => openEdit(record)} title="Edit" aria-label={`Edit ${record.follow_up_id}`} disabled={detailLoading}><Pencil size={14} /></button>
                      <button type="button" onClick={() => printRecord(record)} title="Print" aria-label={`Print ${record.follow_up_id}`}><Printer size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>


      {form && (
        <div className="modal-overlay" onClick={() => !saving && setForm(null)}>
          <div className="modal cfu-dialog" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{form.id ? "Edit Collection Follow-up" : "New Collection Follow-up"}</h2>
                <p>Invoice, client and balance are resolved from the database.</p>
              </div>
              <button type="button" onClick={() => setForm(null)} disabled={saving} aria-label="Close"><X size={15} /></button>
            </div>
            <form onSubmit={saveForm}>
              <div className="cfu-form-body">
                <div className="form-grid">
                  <div className="form-group full">
                    <label>Database Invoice *</label>
                    <select value={form.invoice_no} onChange={(event) => setForm((previous) => ({ ...previous, invoice_no: event.target.value }))} required>
                      <option value="">Select an invoice</option>
                      {invoices.map((invoice) => (
                        <option key={invoice.id} value={invoice.invoice_no}>
                          {invoice.invoice_no} · {invoice.client_name} · {money(invoice.outstanding_balance)}
                        </option>
                      ))}
                    </select>
                    {formErrors.invoice_no && <small className="collection-form-error">{formErrors.invoice_no}</small>}
                  </div>
                  {selectedInvoice && (
                    <div className="cfu-selected-invoice full">
                      <div><span>Client</span><strong>{selectedInvoice.client_name}</strong></div>
                      <div><span>Current Balance</span><strong>{money(selectedInvoice.outstanding_balance)}</strong></div>
                      <div><span>Invoice Due Date</span><strong>{dateLabel(selectedInvoice.due_date)}</strong></div>
                    </div>
                  )}
                  <div className="form-group"><label>Last Contact</label><input type="date" value={form.last_contact} onChange={(event) => setForm((previous) => ({ ...previous, last_contact: event.target.value }))} /></div>
                  <div className="form-group"><label>Next Follow-up</label><input type="date" value={form.next_follow_up} onChange={(event) => setForm((previous) => ({ ...previous, next_follow_up: event.target.value }))} /></div>
                  <div className="form-group"><label>Follow-up Method *</label><select value={form.follow_up_method} onChange={(event) => setForm((previous) => ({ ...previous, follow_up_method: event.target.value }))}>{FOLLOW_UP_METHODS.map((value) => <option key={value}>{value}</option>)}</select></div>
                  <div className="form-group"><label>Result *</label><select value={form.result} onChange={(event) => setForm((previous) => ({ ...previous, result: event.target.value }))}>{FOLLOW_UP_RESULTS.map((value) => <option key={value}>{value}</option>)}</select></div>
                  <div className="form-group"><label>Assigned Collector *</label><input type="text" list="cfu-collectors" value={form.assigned_collector} onChange={(event) => setForm((previous) => ({ ...previous, assigned_collector: event.target.value }))} placeholder="Select or type a collector" required /><datalist id="cfu-collectors">{filterOptions.collectors.map((value) => <option key={value} value={value} />)}</datalist>{formErrors.assigned_collector && <small className="collection-form-error">{formErrors.assigned_collector}</small>}</div>
                  <div className="form-group"><label>Status *</label><select value={form.status} onChange={(event) => setForm((previous) => ({ ...previous, status: event.target.value }))}>{FOLLOW_UP_STATUSES.map((value) => <option key={value}>{value}</option>)}</select></div>
                  <div className="form-group full"><label>Remarks</label><textarea className="collection-notes" rows={3} value={form.remarks} onChange={(event) => setForm((previous) => ({ ...previous, remarks: event.target.value }))} placeholder="Add notes about the client response or next action" /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="light-button" onClick={() => setForm(null)} disabled={saving}>Cancel</button>
                <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving…" : form.id ? "Save Changes" : "Create Follow-up"}</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {detail && (
        <div className="modal-overlay" onClick={() => !detailLoading && setDetail(null)}>
          <div className="modal cfu-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Collection Follow-up Details</h2>
                <p>{detail.followUp.follow_up_id}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} aria-label="Close"><X size={15} /></button>
            </div>
            <div className="cfu-detail-body">
              {detail.loading ? (
                <p className="aging-detail-loading"><Clock3 size={15} /> Loading follow-up details…</p>
              ) : (
                <>
                  <div className="cfu-detail-hero">
                    <div><span>Client</span><strong>{display(detail.followUp.client)}</strong><small>{display(detail.followUp.invoice_no)}</small></div>
                    <div><span>Outstanding Balance</span><MaskedAmount id={`detail-${detail.followUp.id}`} value={detail.followUp.outstanding_balance} revealed={revealed} onToggle={toggleAmount} /><small>Live from invoice and payments</small></div>
                    <div><span>Status</span><StatusBadge value={detail.followUp.status} /><small>Next: {dateLabel(detail.followUp.next_follow_up)}</small></div>
                  </div>
                  <div className="aging-detail-section">
                    <h4>Follow-up Information</h4>
                    <dl className="aging-detail-grid">
                      <div><dt>Follow-up ID</dt><dd>{display(detail.followUp.follow_up_id)}</dd></div>
                      <div><dt>Invoice No.</dt><dd>{display(detail.followUp.invoice_no)}</dd></div>
                      <div><dt>Last Contact</dt><dd>{dateLabel(detail.followUp.last_contact)}</dd></div>
                      <div><dt>Next Follow-up</dt><dd>{dateLabel(detail.followUp.next_follow_up)}</dd></div>
                      <div><dt>Follow-up Method</dt><dd>{display(detail.followUp.follow_up_method)}</dd></div>
                      <div><dt>Result</dt><dd><ResultBadge value={detail.followUp.result} /></dd></div>
                      <div><dt>Assigned Collector</dt><dd>{display(detail.followUp.assigned_collector)}</dd></div>
                      <div><dt>Status</dt><dd><StatusBadge value={detail.followUp.status} /></dd></div>
                      <div className="full"><dt>Remarks</dt><dd>{display(detail.followUp.remarks)}</dd></div>
                    </dl>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer cfu-detail-actions">
              <button type="button" className="light-button danger" onClick={() => deleteRecord(detail.followUp)} disabled={deleting || detail.loading}><Trash2 size={14} /> Delete</button>
              <button type="button" className="light-button" onClick={() => setDetail(null)}>Close</button>
              <button type="button" className="light-button" onClick={() => printRecord(detail.followUp)} disabled={detail.loading}><Printer size={14} /> Print</button>
              <button type="button" className="primary-button" onClick={() => { setDetail(null); openEdit(detail.followUp); }} disabled={detail.loading}><Pencil size={14} /> Edit</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default CollectionFollowUpsPage;


