import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Plus, X, Paperclip } from "lucide-react";
import RevealableAmount from "../../components/RevealableAmount";

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
const money = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const statusClass = { Pending: "pending", "For Review": "for-review", "For Approval": "for-approval", Approved: "approved", Applied: "applied", Rejected: "rejected", "Returned for Revision": "returned", Cancelled: "cancelled" };
const typeClass = { Increase: "increase", Decrease: "decrease", Reallocation: "reallocation", "Supplementary Budget": "supplementary", Correction: "correction" };

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Budget adjustment request failed.");
  return payload;
}
const adjustmentValue = (form, selected) => {
  const amount = Number(form.adjustment_amount || 0);
  if (form.adjustment_type === "Reallocation" || form.adjustment_type === "Decrease") return Number(selected?.allocated_amount || 0) - amount;
  return Number(selected?.allocated_amount || 0) + amount;
};
const statusFor = (spent, budget) => {
  const rate = budget > 0 ? spent / budget * 100 : 0;
  return rate > 100 ? "Over Budget" : rate >= 81 ? "At Risk" : rate >= 61 ? "Monitoring" : "On Track";
};
const readFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader(); reader.onload = () => resolve({ name: file.name, type: file.type || "application/octet-stream", data: reader.result });
  reader.onerror = reject; reader.readAsDataURL(file);
});

export default function BudgetAdjustmentsPage({ onAudit = () => {} }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState([]); const [summary, setSummary] = useState({}); const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false); const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ allocation_id: "", target_allocation_id: "", adjustment_type: "Increase", adjustment_amount: "", reason: "", effective_date: "", requested_by: "", remarks: "", files: [] });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [adjustments, allocationResult] = await Promise.all([request(`/api/budget/adjustments?fiscal_year=${year}`), request(`/api/budget/department-allocations?fiscal_year=${year}`)]);
      setRows(adjustments.data || []); setSummary(adjustments.summary || {}); setAllocations(allocationResult.data || []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [year]);
  useEffect(() => { load(); }, [load]);

  const selected = allocations.find((item) => item.id === Number(form.allocation_id));
  const target = allocations.find((item) => item.id === Number(form.target_allocation_id));
  const activeAllocations = allocations.filter((item) => ["Allocated", "Adjusted"].includes(item.status));
  const afterSource = adjustmentValue(form, selected);
  const afterTarget = Number(target?.allocated_amount || 0) + Number(form.adjustment_amount || 0);
  const docs = useMemo(() => form.files || [], [form.files]);
  const detailSourceAmount = Number(detail?.data.original_amount ?? detail?.data.current_allocated ?? 0);
  const detailSourceUsed = Number(detail?.data.current_used || 0);
  const detailTargetAmount = Number(detail?.data.target_original_amount ?? detail?.data.target_current_allocated ?? 0);

  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const supporting_documents = await Promise.all(docs.map(readFile));
      const result = await request("/api/budget/adjustments", { method: "POST", body: JSON.stringify({ ...form, files: undefined, fiscal_year: year, allocation_id: Number(form.allocation_id), target_allocation_id: form.target_allocation_id ? Number(form.target_allocation_id) : null, adjustment_amount: Number(form.adjustment_amount), supporting_documents }) });
      onAudit?.(result.message); setFormOpen(false); setForm({ allocation_id: "", target_allocation_id: "", adjustment_type: "Increase", adjustment_amount: "", reason: "", effective_date: "", requested_by: "", remarks: "", files: [] }); await load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const act = async (item, action) => {
    const actor = window.prompt(`${action[0].toUpperCase() + action.slice(1)} ${item.adjustment_reference}. Name:`, action === "approve" ? "Management" : "Budget Officer");
    if (actor === null) return;
    const remarks = ["reject", "return", "review", "recommend", "approve"].includes(action) ? window.prompt("Remarks:", "") || "" : "";
    setBusy(true); setError("");
    try {
      const result = await request(`/api/budget/adjustments/${item.id}/${action}`, { method: "POST", body: JSON.stringify({ reviewer: actor, approver: actor, actor, remarks }) });
      onAudit?.(result.message); await load();
    }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const openDetail = async (item) => {
    try { const result = await request(`/api/budget/adjustments/${item.id}`); setDetail(result); }
    catch (e) { setError(e.message); }
  };

  const cards = [["Total Adjustments", summary.total_adjustments || 0], ["Pending Review", summary.pending_review || 0], ["For Approval", summary.for_approval || 0], ["Approved", summary.approved || 0], ["Rejected", summary.rejected || 0], ["Total Increase", <RevealableAmount value={money(summary.total_increase)} />], ["Total Reallocated", <RevealableAmount value={money(summary.total_reallocated)} />]];
  return <div className="module-page budget-adjustments-page">
    <div className="page-header"><div><h2>Budget Adjustments</h2><p>Request, review, approve, and apply changes to department budget allocations.</p></div><div className="page-actions"><label className="dba-year">Fiscal year <select value={year} onChange={(e) => setYear(Number(e.target.value))}>{[year - 1, year, year + 1].map((item) => <option key={item}>{item}</option>)}</select></label><button type="button" className="light-button" onClick={load}>Refresh</button><button type="button" className="primary-button" onClick={() => setFormOpen(true)}><Plus size={14}/> New Adjustment</button></div></div>
    {error && <p className="error-message" role="alert">{error}</p>}
    <div className="vendor-summary-grid ba-summary">{cards.map(([label, value]) => <div className="vendor-summary-card" key={label}><span className="vendor-summary-label">{label}</span><strong className="vendor-summary-value">{value}</strong></div>)}</div>
    <section className="bm-section"><h3>Adjustment Requests</h3><div className="table-wrap"><table className="data-table"><thead><tr><th>Adjustment ID</th><th>Department</th><th>Type</th><th>Original Budget</th><th>Adjustment</th><th>New Budget</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {loading ? <tr><td colSpan="9" className="cm-empty-cell">Loading adjustments…</td></tr> : rows.length ? rows.map((item) => {
        const delta = item.adjustment_type === "Decrease" || item.adjustment_type === "Reallocation" ? -Number(item.adjustment_amount || 0) : Number(item.adjustment_amount || 0);
        return <tr key={item.id}><td>{item.adjustment_reference}</td><td>{item.department}{item.target_department && <small>to {item.target_department}</small>}</td><td><span className={`ba-type ${typeClass[item.adjustment_type] || ""}`}>{item.adjustment_type}</span></td><td><RevealableAmount value={money(item.original_amount ?? item.current_allocated)} /></td><td className={delta < 0 ? "ba-negative" : "ba-positive"}><RevealableAmount value={`${delta < 0 ? "−" : "+"}${money(Math.abs(delta))}`} /></td><td><RevealableAmount value={money(item.requested_allocated_amount)} />{item.target_department && <small>{item.target_department}: <RevealableAmount value={money(item.target_original_amount ?? item.target_current_allocated)} /> → <RevealableAmount value={money(Number(item.target_original_amount ?? item.target_current_allocated ?? 0) + Number(item.adjustment_amount || 0))} /></small>}</td><td>{item.reason}</td><td><span className={`ba-status ${statusClass[item.status] || ""}`}>{item.status}</span></td><td><div className="dba-actions"><button className="pa-icon-btn" type="button" title="View details" onClick={() => openDetail(item)}><Eye size={14}/></button>{item.status === "Pending" && <button className="dba-action" disabled={busy} onClick={() => act(item,"review")}>Review</button>}{item.status === "For Review" && <button className="dba-action" disabled={busy} onClick={() => act(item,"recommend")}>For Approval</button>}{item.status === "For Approval" && <button className="dba-action" disabled={busy} onClick={() => act(item,"approve")}>Approve & Apply</button>}{item.status === "Approved" && <button className="dba-action" disabled={busy} onClick={() => act(item,"apply")}>Apply</button>}{["Pending","For Review","For Approval"].includes(item.status) && <><button className="dba-action" disabled={busy} onClick={() => act(item,"return")}>Return</button><button className="dba-action" disabled={busy} onClick={() => act(item,"reject")}>Reject</button></>}</div></td></tr>;
      }) : <tr><td colSpan="9" className="cm-empty-cell">No budget adjustments found for {year}.</td></tr>}
    </tbody></table></div></section>

    {formOpen && <div className="dba-backdrop"><section className="dba-modal ba-modal" role="dialog" aria-modal="true" aria-labelledby="ba-new-title"><header><div><h3 id="ba-new-title">New Budget Adjustment</h3><small>Reference will be generated when this request is saved.</small></div><button type="button" onClick={() => setFormOpen(false)} aria-label="Close"><X size={18}/></button></header><form onSubmit={submit}><div className="dba-form-grid">
      <label>Fiscal Year<input readOnly value={year}/></label><label>Adjustment Type<select value={form.adjustment_type} onChange={(e) => setForm((v) => ({ ...v, adjustment_type: e.target.value, target_allocation_id: "" }))}>{["Increase","Decrease","Reallocation","Supplementary Budget","Correction"].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="full">Department Allocation<select required value={form.allocation_id} onChange={(e) => setForm((v) => ({ ...v, allocation_id: e.target.value, target_allocation_id: "" }))}><option value="">Choose an active allocation</option>{activeAllocations.map((item) => <option key={item.id} value={item.id}>{item.department} · {item.budget_category} · {item.allocation_reference}</option>)}</select></label>
      {form.adjustment_type === "Reallocation" && <label className="full">Target Department Allocation<select required value={form.target_allocation_id} onChange={(e) => setForm((v) => ({ ...v, target_allocation_id: e.target.value }))}><option value="">Choose target allocation</option>{activeAllocations.filter((item) => item.id !== Number(form.allocation_id) && Number(item.fiscal_year) === year).map((item) => <option key={item.id} value={item.id}>{item.department} · {item.budget_category} · {item.allocation_reference}</option>)}</select></label>}
      {selected && <div className="ba-preview full"><div><small>Current Allocation</small><b><RevealableAmount value={money(selected.allocated_amount)} /></b><small>Available Balance: <RevealableAmount value={money(selected.remaining_amount)} /></small></div>{form.adjustment_type === "Reallocation" ? <><span>→</span><div><small>Target Current Allocation</small><b><RevealableAmount value={money(target?.allocated_amount)} /></b><small>{target?.department || "Choose target"}</small></div></> : null}<div><small>{form.adjustment_type === "Decrease" || form.adjustment_type === "Reallocation" ? "Adjustment" : "Requested Adjustment"}</small><b><RevealableAmount value={`${form.adjustment_type === "Decrease" || form.adjustment_type === "Reallocation" ? "−" : "+"}${money(form.adjustment_amount)}`} /></b></div><div><small>Proposed New Allocation</small><b><RevealableAmount value={money(afterSource)} /></b></div>{form.adjustment_type === "Reallocation" && target && <div><small>Target New Allocation</small><b><RevealableAmount value={money(afterTarget)} /></b></div>}</div>}
      <label>Requested Adjustment<input type="number" min="0.01" step="0.01" required value={form.adjustment_amount} onChange={(e) => setForm((v) => ({ ...v, adjustment_amount: e.target.value }))}/></label><label>Effective Date<input type="date" value={form.effective_date} onChange={(e) => setForm((v) => ({ ...v, effective_date: e.target.value }))}/></label>
      <label className="full">Reason / Justification<textarea required rows="3" value={form.reason} onChange={(e) => setForm((v) => ({ ...v, reason: e.target.value }))}/></label><label>Requested By<input required value={form.requested_by} onChange={(e) => setForm((v) => ({ ...v, requested_by: e.target.value }))}/></label><label>Budget Period<input readOnly value={selected?.budget_period || "Select an allocation"}/></label>
      <label className="full">Supporting Documents (PDF or other documents, max 5 MB each)<input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={(e) => setForm((v) => ({ ...v, files: Array.from(e.target.files || []) }))}/>{form.files.length > 0 && <small>{form.files.map((f) => f.name).join(", ")}</small>}</label><label className="full">Remarks<textarea rows="2" value={form.remarks} onChange={(e) => setForm((v) => ({ ...v, remarks: e.target.value }))}/></label>
    </div><footer><button type="button" className="light-button" onClick={() => setFormOpen(false)} disabled={busy}>Cancel</button><button className="primary-button" disabled={busy || !selected}>{busy ? "Submitting…" : "Submit Adjustment"}</button></footer></form></section></div>}

    {detail && <div className="dba-backdrop"><section className="dba-modal ba-modal" role="dialog" aria-modal="true" aria-labelledby="ba-detail-title"><header><div><h3 id="ba-detail-title">{detail.data.adjustment_reference}</h3><span className={`ba-status ${statusClass[detail.data.status] || ""}`}>{detail.data.status}</span></div><button type="button" onClick={() => setDetail(null)} aria-label="Close"><X size={18}/></button></header><div className="dba-detail-grid">{[["Department", detail.data.department], ["Department Head", detail.data.department_head], ["Fiscal Year", detail.data.fiscal_year], ["Budget Period", detail.data.budget_period], ["Category", detail.data.budget_category], ["Adjustment Type", detail.data.adjustment_type], ["Original Allocation", <RevealableAmount value={money(detail.data.original_amount ?? detail.data.current_allocated)} />], ["Actual Spending", <RevealableAmount value={money(detail.data.current_used)} />], ["Remaining", <RevealableAmount value={money(detail.data.available_balance)} />], ["Requested Adjustment", <RevealableAmount value={money(detail.data.adjustment_amount)} />], ["Proposed Allocation", <RevealableAmount value={money(detail.data.requested_allocated_amount)} />], ["Effective Date", detail.data.effective_date || "—"], ["Requested By", detail.data.requested_by || "—"], ["Reviewed By", detail.data.reviewed_by || "—"], ["Approved By", detail.data.approved_by || "—"], ["Request Date", detail.data.created_at ? new Date(detail.data.created_at).toLocaleDateString() : "—"], ["Review Date", detail.data.reviewed_at || "—"], ["Approval Date", detail.data.approved_at || "—"]].map(([label,value]) => <div key={label}><small>{label}</small><b>{value}</b></div>)}</div><div className="ba-detail-copy"><b>Reason</b><p>{detail.data.reason}</p><b>Review Remarks</b><p>{detail.data.review_remarks || "—"}</p><b>Approval Remarks</b><p>{detail.data.approval_remarks || "—"}</p><b>Supporting Documents</b>{detail.documents?.length ? detail.documents.map((doc) => <p key={doc.id}><a href={`${API_BASE}/api/budget/adjustment-documents/${doc.id}`} target="_blank" rel="noreferrer"><Paperclip size={13}/> {doc.file_name}</a></p>) : <p>None attached</p>}<b>Adjustment History</b>{detail.history?.length ? detail.history.map((entry,index) => <p key={`${entry.action}-${index}`}><strong>{entry.action}</strong> · {entry.old_status ? `${entry.old_status} → ${entry.new_status}` : entry.status} · {entry.actor || "System"} · {new Date(entry.created_at).toLocaleString()}{entry.old_amount !== null && entry.old_amount !== undefined ? <> · <RevealableAmount value={money(entry.old_amount)} /> → <RevealableAmount value={money(entry.new_amount)} /></> : null}{entry.remarks ? ` · ${entry.remarks}` : ""}</p>) : <p>No history recorded.</p>}</div>
      {["For Approval", "Approved", "Applied"].includes(detail.data.status) && (
        <div className="ba-preview ba-before-after">
          <div>
            <small>{detail.data.department} · Original Allocation</small>
            <b><RevealableAmount value={money(detailSourceAmount)} /></b>
            <small>Actual Spending: <RevealableAmount value={money(detailSourceUsed)} /></small>
            <small>Remaining: <RevealableAmount value={money(detailSourceAmount - detailSourceUsed)} /></small>
            <small>Utilization: {detailSourceAmount > 0 ? (detailSourceUsed / detailSourceAmount * 100).toFixed(2) : "0.00"}% · {statusFor(detailSourceUsed, detailSourceAmount)}</small>
          </div>
          <span>→</span>
          <div>
            <small>{detail.data.department} · After Applying</small>
            <b><RevealableAmount value={money(detail.data.requested_allocated_amount)} /></b>
            <small>Actual Spending: <RevealableAmount value={money(detailSourceUsed)} /></small>
            <small>Remaining: <RevealableAmount value={money(Number(detail.data.requested_allocated_amount) - detailSourceUsed)} /></small>
            <small>Utilization: {detail.data.requested_allocated_amount > 0 ? (detailSourceUsed / detail.data.requested_allocated_amount * 100).toFixed(2) : "0.00"}% · {statusFor(detailSourceUsed, Number(detail.data.requested_allocated_amount))}</small>
          </div>
          {detail.data.adjustment_type === "Reallocation" && (
            <>
              <span>→</span>
              <div>
                <small>{detail.data.target_department} · Original Allocation</small>
                <b><RevealableAmount value={money(detailTargetAmount)} /></b>
              </div>
              <span>→</span>
              <div>
                <small>{detail.data.target_department} · After Applying</small>
                <b><RevealableAmount value={money(detailTargetAmount + Number(detail.data.adjustment_amount || 0))} /></b>
              </div>
            </>
          )}
        </div>
      )}
      <footer><button className="light-button" type="button" onClick={() => setDetail(null)}>Close</button>{["For Approval", "Approved"].includes(detail.data.status) && <button className="primary-button" type="button" disabled={busy} onClick={() => { setDetail(null); act(detail.data,detail.data.status === "For Approval" ? "approve" : "apply"); }}>{detail.data.status === "For Approval" ? "Approve & Apply" : "Apply Adjustment"}</button>}</footer></section></div>}
  </div>;
}
