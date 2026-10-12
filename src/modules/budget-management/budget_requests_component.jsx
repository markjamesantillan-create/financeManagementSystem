import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, Plus, Search, X } from "lucide-react";
import RevealableAmount from "../../components/RevealableAmount";

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
const DEPARTMENTS = ["Administration", "Finance", "Human Resources", "Sales", "Operations", "Information Technology"];
const STATUSES = ["Draft", "Pending", "For Review", "For Approval", "Returned for Revision", "Approved", "Allocated", "Rejected", "Cancelled"];
const STATUS_CLASS = { Draft: "draft", Pending: "pending", "For Review": "for-review", "For Approval": "for-approval", "Returned for Revision": "returned", Approved: "approved", Allocated: "allocated", Rejected: "rejected", Cancelled: "cancelled" };
const money = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const show = (value) => value === null || value === undefined || value === "" ? "—" : value;

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Budget request failed.");
  return payload;
}
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file);
});

export default function BudgetRequestsPage({ onAudit = () => {} }) {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const formRef = useRef(null);
  const [detail, setDetail] = useState(null);
  const [items, setItems] = useState([{ description: "", quantity: 1, unit_cost: "" }]);
  const [files, setFiles] = useState([]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const result = await request("/api/budget/requests"); setRows(result.data || []); setSummary(result.summary || {}); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const form = formRef.current;
    if (!showForm || !editing || !form) return;
    for (const key of ["department", "requester", "department_head", "fiscal_year", "budget_period", "budget_category", "priority", "required_date", "purpose", "remarks"]) {
      if (form.elements.namedItem(key)) form.elements.namedItem(key).value = key === "required_date" && editing[key] ? String(editing[key]).slice(0, 10) : editing[key] ?? "";
    }
  }, [showForm, editing]);

  const filtered = useMemo(() => rows.filter((row) => {
    if (statusFilter !== "All Statuses" && row.status !== statusFilter) return false;
    const phrase = query.trim().toLowerCase();
    return !phrase || [row.request_reference, row.department, row.budget_category, row.purpose, row.requester].some((value) => String(value || "").toLowerCase().includes(phrase));
  }), [rows, statusFilter, query]);
  const itemTotal = items.reduce((total, item) => total + (Number(item.quantity) || 0) * (Number(item.unit_cost) || 0), 0);

  const openDetail = async (row) => {
    try { const result = await request(`/api/budget/requests/${row.id}`); setDetail(result.data); }
    catch (err) { setError(err.message); }
  };
  const editRequest = async (row) => {
    try {
      const result = await request(`/api/budget/requests/${row.id}`);
      setEditing(result.data);
      setItems(result.data.items?.length ? result.data.items.map((item) => ({ description: item.description, quantity: item.quantity, unit_cost: item.unit_cost })) : [{ description: "", quantity: 1, unit_cost: "" }]);
      setFiles([]); setShowForm(true);
    } catch (err) { setError(err.message); }
  };
  const act = async (row, action, body = {}) => {
    setBusy(true); setError("");
    try { const result = await request(`/api/budget/requests/${row.id}/${action}`, { method: "POST", body: JSON.stringify(body) }); onAudit?.(result.message); await load(); if (detail?.id === row.id) await openDetail(row); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const review = async (row) => {
    const outcome = window.prompt("Review decision: For Approval, Returned for Revision, or Reject", "For Approval");
    if (!outcome) return;
    const normalized = outcome.toLowerCase();
    const reviewer = window.prompt("Reviewer name:", "Budget Officer") || "Budget Officer";
    const remarks = window.prompt("Review remarks:", "") || "";
    if (normalized.includes("approval")) {
      const recommended = window.prompt("Recommended amount:", String(row.requested_amount));
      if (recommended === null) return;
      await act(row, "review", { outcome: "For Approval", recommended_amount: Number(recommended), reviewer, remarks });
    } else if (normalized.includes("return")) await act(row, "return", { reviewer, remarks });
    else if (normalized.includes("reject")) await act(row, "reject", { reviewer, remarks });
    else window.alert("Choose For Approval, Returned for Revision, or Reject.");
  };
  const approve = async (row) => {
    const approved = window.prompt("Approved amount:", String(row.recommended_amount || row.requested_amount));
    if (approved === null) return;
    const approver = window.prompt("Approver name:", "Management") || "Management";
    await act(row, "approve", { approved_amount: Number(approved), approver });
  };

  const submitForm = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const docs = await Promise.all(files.map(async (file) => ({ file_name: file.name, file_type: file.type, file_data: await fileToDataUrl(file) })));
      form.fiscal_year = Number(form.fiscal_year);
      form.items = items.filter((item) => item.description.trim()).map((item) => ({ ...item, quantity: Number(item.quantity), unit_cost: Number(item.unit_cost) }));
      form.requested_amount = itemTotal; form.documents = docs; form.submit = event.nativeEvent.submitter?.value === "submit";
      const result = await request(editing ? `/api/budget/requests/${editing.id}` : "/api/budget/requests", { method: editing ? "PUT" : "POST", body: JSON.stringify(form) });
      onAudit?.(result.message); setShowForm(false); setEditing(null); setItems([{ description: "", quantity: 1, unit_cost: "" }]); setFiles([]); await load();
    }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const cards = [
    ["Total Requests", Number(summary.total_requests || 0).toLocaleString()],
    ["Pending", Number(summary.pending || 0).toLocaleString()],
    ["For Review", Number(summary.for_review || 0).toLocaleString()],
    ["For Approval", Number(summary.for_approval || 0).toLocaleString()],
    ["Approved", Number(summary.approved || 0).toLocaleString()],
    ["Rejected", Number(summary.rejected || 0).toLocaleString()],
    ["Total Requested Amount", <RevealableAmount value={money(summary.total_requested_amount)} />],
    ["Total Approved Amount", <RevealableAmount value={money(summary.total_approved_amount)} />],
  ];

  return <div className="module-page budget-requests-page">
    <div className="page-header"><div><h2>Budget Requests</h2><p>Submit department funding requests, review them and route approved amounts to Department Budget Allocation.</p></div><div className="page-actions"><button type="button" className="light-button" onClick={load}>Refresh</button><button type="button" className="primary-button" onClick={() => { setEditing(null); setItems([{ description: "", quantity: 1, unit_cost: "" }]); setFiles([]); setShowForm(true); }}><Plus size={14} /> New Budget Request</button></div></div>
    {error && <p className="error-message">{error}</p>}
    <div className="vendor-summary-grid br-summary">{cards.map(([title, value]) => <div className="vendor-summary-card" key={title}><span className="vendor-summary-label">{title}</span><strong className="vendor-summary-value">{value}</strong></div>)}</div>
    <div className="br-flow"><span>Department Request</span><i>›</i><span>Budget Officer Review</span><i>›</i><span>Management Approval</span><i>›</i><span>Department Allocation</span></div>
    <div className="dba-toolbar"><label><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search request, department, purpose..." /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All Statuses</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></div>
    <div className="table-wrap"><table className="data-table br-table">
      <thead><tr><th>Request ID</th><th>Department</th><th>Budget Category</th><th>Purpose</th><th>Requested</th><th>Approved</th><th>Priority</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
      <tbody>{loading ? <tr><td colSpan="10" className="cm-empty-cell">Loading budget requests…</td></tr> : filtered.length ? filtered.map((row) => <tr key={row.id}>
        <td><b>{row.request_reference}</b><small>{row.fiscal_year} · {row.budget_period}</small></td><td>{row.department}</td><td>{row.budget_category}</td><td className="br-purpose">{row.purpose}</td><td><RevealableAmount value={money(row.requested_amount)} /></td><td>{row.approved_amount == null ? "—" : <RevealableAmount value={money(row.approved_amount)} />}</td><td>{row.priority}</td><td><span className={`br-status ${STATUS_CLASS[row.status] || ""}`}>{row.status}</span></td><td>{row.created_at ? new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</td>
        <td><div className="dba-actions"><button type="button" className="pa-icon-btn" title="View request" onClick={() => openDetail(row)}><Eye size={14} /></button>
          {["Draft", "Returned for Revision"].includes(row.status) && <><button type="button" className="dba-action" disabled={busy} onClick={() => editRequest(row)}>Edit</button><button type="button" className="dba-action" disabled={busy} onClick={() => act(row, "submit")}>{row.status === "Draft" ? "Submit" : "Resubmit"}</button></>}
          {["Pending", "For Review"].includes(row.status) && <button type="button" className="dba-action" disabled={busy} onClick={() => review(row)}>Review</button>}
          {row.status === "For Approval" && <><button type="button" className="dba-action" disabled={busy} onClick={() => approve(row)}>Approve</button><button type="button" className="dba-action" disabled={busy} onClick={() => act(row, "return", { reviewer: "Management", remarks: window.prompt("Reason for return:", "") || "Returned for revision" })}>Return</button><button type="button" className="dba-action" disabled={busy} onClick={() => act(row, "reject", { reviewer: "Management", remarks: window.prompt("Reason for rejection:", "") || "Rejected" })}>Reject</button></>}
        </div></td></tr>) : <tr><td colSpan="10" className="cm-empty-cell">No budget requests match the current filters.</td></tr>}</tbody>
    </table></div>

    {showForm && <div className="dba-backdrop"><section className="dba-modal br-modal" role="dialog" aria-modal="true" aria-labelledby="br-new-title"><header><h3 id="br-new-title">{editing ? `Edit ${editing.request_reference}` : "New Budget Request"}</h3><button type="button" onClick={() => { setShowForm(false); setEditing(null); }} aria-label="Close"><X size={18} /></button></header><form ref={formRef} onSubmit={submitForm}><div className="dba-form-grid"><label>Department<select name="department" required>{DEPARTMENTS.map((department) => <option key={department}>{department}</option>)}</select></label><label>Requesting Employee<input name="requester" required /></label><label>Department Head<input name="department_head" /></label><label>Fiscal Year<input name="fiscal_year" type="number" defaultValue={new Date().getFullYear()} required /></label><label>Budget Period<input name="budget_period" placeholder="Annual / Q1 / Jan–Mar" required /></label><label>Budget Category<input name="budget_category" required /></label><label>Priority<select name="priority"><option>Medium</option><option>Low</option><option>High</option><option>Critical</option></select></label><label>Required Date<input name="required_date" type="date" /></label><label className="full">Purpose / Justification<textarea name="purpose" rows="3" required /></label><label className="full">Remarks<textarea name="remarks" rows="2" /></label></div>
      <section className="br-items"><div><h4>Request Breakdown</h4><button type="button" className="dba-action" onClick={() => setItems((current) => [...current, { description: "", quantity: 1, unit_cost: "" }])}><Plus size={12} /> Add Item</button></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Item / Description</th><th>Quantity</th><th>Unit Cost</th><th>Total</th><th></th></tr></thead><tbody>{items.map((item, index) => <tr key={index}><td><input value={item.description} onChange={(event) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, description: event.target.value } : entry))} placeholder="Item or service" /></td><td><input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, quantity: event.target.value } : entry))} /></td><td><input type="number" min="0" step="0.01" value={item.unit_cost} onChange={(event) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, unit_cost: event.target.value } : entry))} /></td><td><RevealableAmount value={money((Number(item.quantity) || 0) * (Number(item.unit_cost) || 0))} /></td><td><button type="button" className="br-remove" onClick={() => setItems((current) => current.length > 1 ? current.filter((_, i) => i !== index) : current)}>×</button></td></tr>)}</tbody></table></div><strong>Total Requested: <RevealableAmount value={money(itemTotal)} /></strong></section>
      <label className="br-upload">Supporting Documents<input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={(event) => setFiles(Array.from(event.target.files || []))} /><small>{files.length ? files.map((file) => file.name).join(", ") : "Add proposals, quotations, purchase requests or supporting documents."}</small></label>
      <footer><button type="button" className="light-button" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" name="intent" value="draft" className="light-button" disabled={busy}>Save Draft</button><button type="submit" name="intent" value="submit" className="primary-button" disabled={busy}>Submit Request</button></footer></form></section></div>}

    {detail && <div className="dba-backdrop"><section className="dba-modal dba-detail" role="dialog" aria-modal="true" aria-labelledby="br-detail-title"><header><div><h3 id="br-detail-title">{detail.request_reference}</h3><span className={`br-status ${STATUS_CLASS[detail.status] || ""}`}>{detail.status}</span></div><button type="button" onClick={() => setDetail(null)} aria-label="Close"><X size={18} /></button></header><div className="dba-detail-grid">{[["Department", detail.department], ["Requesting Employee", detail.requester], ["Department Head", detail.department_head], ["Fiscal Year", detail.fiscal_year], ["Budget Period", detail.budget_period], ["Category", detail.budget_category], ["Priority", detail.priority], ["Requested Amount", <RevealableAmount value={money(detail.requested_amount)} />], ["Recommended Amount", detail.recommended_amount == null ? "—" : <RevealableAmount value={money(detail.recommended_amount)} />], ["Approved Amount", detail.approved_amount == null ? "—" : <RevealableAmount value={money(detail.approved_amount)} />], ["Required Date", detail.required_date], ["Status", detail.status], ["Reviewed By", detail.reviewed_by], ["Review Date", detail.reviewed_at], ["Approved By", detail.approved_by], ["Approval Date", detail.approved_at], ["Purpose", detail.purpose], ["Review Remarks", detail.review_remarks], ["Remarks", detail.remarks]].map(([key, value]) => <div key={key}><small>{key}</small><b>{show(value)}</b></div>)}</div><section className="br-detail-items"><h4>Request Breakdown</h4><div className="table-wrap"><table className="data-table"><thead><tr><th>Description</th><th>Qty</th><th>Unit Cost</th><th>Total</th></tr></thead><tbody>{(detail.items || []).map((item) => <tr key={item.id}><td>{item.description}</td><td>{item.quantity}</td><td><RevealableAmount value={money(item.unit_cost)} /></td><td><RevealableAmount value={money(item.total_amount)} /></td></tr>)}</tbody></table></div><h4>Supporting Documents</h4>{detail.documents?.length ? detail.documents.map((doc) => <a className="br-document" key={doc.id} href={doc.file_data} download={doc.file_name}>{doc.file_name}</a>) : <p>No supporting documents attached.</p>}</section></section></div>}
  </div>;
}
