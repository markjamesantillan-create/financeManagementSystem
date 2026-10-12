import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Plus, X } from "lucide-react";
import RevealableAmount from "../../components/RevealableAmount";

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
const money = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const STATUS_CLASS = { "On Track": "on-track", Allocated: "allocated", Monitoring: "monitoring", "At Risk": "at-risk", Critical: "critical", "Over Budget": "over-budget", "Adjustment Required": "adjustment-required", Closed: "closed" };
async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Budget monitoring request failed.");
  return payload;
}

export default function BudgetMonitoringPage({ onAudit = () => {} }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState({ summary: {}, departments: [], categories: [], monthly: [], transactions: [], alerts: [] });
  const [allocations, setAllocations] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);
  const [adjustmentForm, setAdjustmentForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [adjustment, setAdjustment] = useState({ allocation_id: "", requested_allocated_amount: "", reason: "", requested_by: "" });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [monitor, allocationResult, adjustmentResult] = await Promise.all([
        api(`/api/budget/monitoring?fiscal_year=${year}`),
        api(`/api/budget/department-allocations?fiscal_year=${year}`),
        api(`/api/budget/adjustments?fiscal_year=${year}`),
      ]);
      setData(monitor.data || {}); setAllocations(allocationResult.data || []); setAdjustments(adjustmentResult.data || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [year]);
  useEffect(() => { load(); }, [load]);

  const cards = [
    ["Total Budget", <RevealableAmount value={money(data.summary.total_budget)} />], ["Total Allocated", <RevealableAmount value={money(data.summary.total_allocated)} />],
    ["Total Committed", <RevealableAmount value={money(data.summary.total_committed)} />], ["Total Spent", <RevealableAmount value={money(data.summary.total_spent)} />],
    ["Remaining Budget", <RevealableAmount value={money(data.summary.remaining_budget)} />], ["Utilization Rate", `${Number(data.summary.utilization_rate || 0).toFixed(2)}%`],
    ["Over Budget", <RevealableAmount value={money(data.summary.over_budget)} />], ["Pending Monitoring", Number(data.summary.pending_monitoring || 0).toLocaleString()],
  ];
  const departmentTransactions = useMemo(() => detail ? data.transactions.filter((item) => item.department === detail.department) : [], [data.transactions, detail]);
  const eligibleAllocations = allocations.filter((row) => row.department === adjustment.department && ["Allocated", "Adjusted"].includes(row.status));

  const openDetail = (department) => setDetail(department);
  const sendAdjustment = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const currentAllocation = allocations.find((row) => row.id === Number(adjustment.allocation_id));
      const proposed = Number(adjustment.requested_allocated_amount);
      const change = proposed - Number(currentAllocation?.allocated_amount || 0);
      if (!change) throw new Error("Enter a proposed amount that changes the current allocation.");
      const result = await api("/api/budget/adjustments", { method: "POST", body: JSON.stringify({ allocation_id: Number(adjustment.allocation_id), adjustment_type: change > 0 ? "Increase" : "Decrease", adjustment_amount: Math.abs(change), reason: adjustment.reason, requested_by: adjustment.requested_by }) });
      onAudit?.(result.message); setAdjustmentForm(false); setAdjustment({ allocation_id: "", requested_allocated_amount: "", reason: "", requested_by: "" }); await load();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const adjustmentAction = async (item, action) => {
    const actor = window.prompt(`${action[0].toUpperCase() + action.slice(1)} ${item.adjustment_reference}. Name:`, action === "approve" ? "Management" : "Budget Officer");
    if (actor === null) return;
    const remarks = action === "reject" ? window.prompt("Reason:", "") || "Rejected" : "";
    setBusy(true);
    try { const result = await api(`/api/budget/adjustments/${item.id}/${action}`, { method: "POST", body: JSON.stringify({ reviewer: actor, approver: actor, remarks }) }); onAudit?.(result.message); await load(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return <div className="module-page budget-monitoring-page">
    <div className="page-header"><div><h2>Budget Monitoring</h2><p>Monitor approved allocations against commitments and recorded department expenses.</p></div><div className="page-actions"><label className="dba-year">Fiscal year <select value={year} onChange={(event) => setYear(Number(event.target.value))}>{[year - 1, year, year + 1].map((item) => <option key={item}>{item}</option>)}</select></label><button type="button" className="light-button" onClick={load}>Refresh</button><button type="button" className="primary-button" onClick={() => setAdjustmentForm(true)}><Plus size={14} /> Request Adjustment</button></div></div>
    {error && <p className="error-message">{error}</p>}
    <div className="vendor-summary-grid bm-summary">{cards.map(([title, value]) => <div className="vendor-summary-card" key={title}><span className="vendor-summary-label">{title}</span><strong className="vendor-summary-value">{value}</strong></div>)}</div>
    {data.alerts?.length > 0 && <section className="bm-alerts"><h3>Monitoring Alerts</h3>{data.alerts.map((alert, index) => <p key={`${alert.type}-${index}`} className={`bm-alert ${STATUS_CLASS[alert.type] || ""}`}><b>{alert.type}</b> {alert.message}{alert.amount != null && <> <RevealableAmount value={money(alert.amount)} />{alert.suffix}</>}</p>)}</section>}
    <section className="bm-section"><h3>Department Budget Monitoring</h3><div className="table-wrap"><table className="data-table bm-table"><thead><tr><th>Department</th><th>Approved Budget</th><th>Allocated</th><th>Committed</th><th>Actual Spent</th><th>Remaining</th><th>Utilization</th><th>Status</th><th>Action</th></tr></thead><tbody>{loading ? <tr><td colSpan="9" className="cm-empty-cell">Loading monitoring data…</td></tr> : data.departments?.length ? data.departments.map((item) => <tr key={item.department}><td>{item.department}<small>{item.department_head || "Department Head —"}</small></td><td><RevealableAmount value={money(item.approved_budget)} /></td><td><RevealableAmount value={money(item.allocated)} /></td><td><RevealableAmount value={money(item.committed)} /></td><td><RevealableAmount value={money(item.actual_spent)} /></td><td className={Number(item.remaining) < 0 ? "bm-negative" : ""}><RevealableAmount value={money(item.remaining)} /></td><td>{Number(item.utilization || 0).toFixed(2)}%</td><td><span className={`bm-status ${STATUS_CLASS[item.status] || ""}`}>{item.status}</span></td><td><button className="pa-icon-btn" type="button" title="View transactions" onClick={() => openDetail(item)}><Eye size={14} /></button></td></tr>) : <tr><td colSpan="9" className="cm-empty-cell">No approved department allocations for {year}.</td></tr>}</tbody></table></div></section>
    <div className="bm-grid"><section className="bm-section"><h3>Budget Category Monitoring</h3><div className="table-wrap"><table className="data-table"><thead><tr><th>Category</th><th>Allocated</th><th>Committed</th><th>Spent</th><th>Remaining</th><th>Utilization</th></tr></thead><tbody>{data.categories?.length ? data.categories.map((item) => <tr key={item.category}><td>{item.category}</td><td><RevealableAmount value={money(item.allocated)} /></td><td><RevealableAmount value={money(item.committed)} /></td><td><RevealableAmount value={money(item.spent)} /></td><td><RevealableAmount value={money(item.remaining)} /></td><td>{Number(item.utilization || 0).toFixed(2)}%</td></tr>) : <tr><td colSpan="6" className="cm-empty-cell">No category allocations for this year.</td></tr>}</tbody></table></div></section>
    <section className="bm-section"><h3>Monthly Budget vs Actual</h3><p className="bm-note">Monthly budget is the allocated annual amount divided evenly across 12 months.</p><div className="table-wrap"><table className="data-table"><thead><tr><th>Month</th><th>Budget</th><th>Actual</th><th>Variance</th><th>Utilization</th></tr></thead><tbody>{data.monthly?.map((item) => <tr key={item.month}><td>{item.month_name}</td><td><RevealableAmount value={money(item.budget)} /></td><td><RevealableAmount value={money(item.actual)} /></td><td className={Number(item.variance) < 0 ? "bm-negative" : ""}><RevealableAmount value={money(item.variance)} /></td><td>{Number(item.utilization || 0).toFixed(2)}%</td></tr>)}</tbody></table></div></section></div>
    {adjustments.length > 0 && <section className="bm-section"><h3>Budget Adjustment Requests</h3><div className="table-wrap"><table className="data-table"><thead><tr><th>Reference</th><th>Department / Allocation</th><th>Current</th><th>Proposed</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead><tbody>{adjustments.map((item) => <tr key={item.id}><td>{item.adjustment_reference}</td><td>{item.department}<small>{item.allocation_reference}</small></td><td><RevealableAmount value={money(item.current_allocated)} /></td><td><RevealableAmount value={money(item.requested_allocated_amount)} /></td><td>{item.reason}</td><td><span className={`bm-status ${item.status === "Approved" || item.status === "Applied" ? "on-track" : item.status === "Rejected" ? "over-budget" : "monitoring"}`}>{item.status}</span></td><td><div className="dba-actions">{item.status === "Pending" && <button className="dba-action" disabled={busy} onClick={() => adjustmentAction(item, "review")}>Review</button>}{item.status === "For Review" && <button className="dba-action" disabled={busy} onClick={() => adjustmentAction(item, "recommend")}>For Approval</button>}{item.status === "For Approval" && <button className="dba-action" disabled={busy} onClick={() => adjustmentAction(item, "approve")}>Approve</button>}{item.status === "Approved" && <button className="dba-action" disabled={busy} onClick={() => adjustmentAction(item, "apply")}>Apply</button>}</div></td></tr>)}</tbody></table></div></section>}

    {adjustmentForm && <div className="dba-backdrop"><section className="dba-modal" role="dialog" aria-modal="true" aria-labelledby="bm-adjust-title"><header><h3 id="bm-adjust-title">Request Budget Adjustment</h3><button type="button" onClick={() => setAdjustmentForm(false)} aria-label="Close"><X size={18} /></button></header><form onSubmit={sendAdjustment}><div className="dba-form-grid"><label>Department<select required value={adjustment.department || ""} onChange={(event) => setAdjustment((value) => ({ ...value, department: event.target.value, allocation_id: "", requested_allocated_amount: "" }))}><option value="">Select department</option>{data.departments?.map((item) => <option key={item.department}>{item.department}</option>)}</select></label><label>Allocation<select required value={adjustment.allocation_id} onChange={(event) => { const row = allocations.find((allocation) => allocation.id === Number(event.target.value)); setAdjustment((value) => ({ ...value, allocation_id: event.target.value, requested_allocated_amount: row?.allocated_amount || "" })); }}><option value="">Select allocation</option>{eligibleAllocations.map((item) => <option key={item.id} value={item.id}>{item.allocation_reference} · {item.budget_category}</option>)}</select></label><label>Proposed Allocated Amount<input type="number" min="0" step="0.01" required value={adjustment.requested_allocated_amount} onChange={(event) => setAdjustment((value) => ({ ...value, requested_allocated_amount: event.target.value }))} /></label><label>Requested By<input required value={adjustment.requested_by} onChange={(event) => setAdjustment((value) => ({ ...value, requested_by: event.target.value }))} /></label><label className="full">Reason<textarea required rows="3" value={adjustment.reason} onChange={(event) => setAdjustment((value) => ({ ...value, reason: event.target.value }))} /></label></div><footer><button type="button" className="light-button" onClick={() => setAdjustmentForm(false)}>Cancel</button><button className="primary-button" disabled={busy}>Submit for Review</button></footer></form></section></div>}
    {detail && <div className="dba-backdrop"><section className="dba-modal dba-detail" role="dialog" aria-modal="true" aria-labelledby="bm-detail-title"><header><div><h3 id="bm-detail-title">{detail.department} · {year}</h3><span className={`bm-status ${STATUS_CLASS[detail.status] || ""}`}>{detail.status}</span></div><button type="button" onClick={() => setDetail(null)} aria-label="Close"><X size={18} /></button></header><div className="dba-detail-grid">{[["Department Head", detail.department_head], ["Fiscal Year", year], ["Budget Period", detail.budget_period], ["Approved Budget", <RevealableAmount value={money(detail.approved_budget)} />], ["Allocated Budget", <RevealableAmount value={money(detail.allocated)} />], ["Committed Amount", <RevealableAmount value={money(detail.committed)} />], ["Actual Expenses", <RevealableAmount value={money(detail.actual_spent)} />], ["Remaining Balance", <RevealableAmount value={money(detail.remaining)} />], ["Utilization", `${Number(detail.utilization || 0).toFixed(2)}%`], ["Variance", <RevealableAmount value={money(detail.allocated - detail.actual_spent)} />]].map(([key, value]) => <div key={key}><small>{key}</small><b>{value || "—"}</b></div>)}</div><section className="dba-transactions"><h4>Transactions</h4>{departmentTransactions.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Reference</th><th>Type</th><th>Description</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead><tbody>{departmentTransactions.map((transaction) => <tr key={transaction.reference}><td>{transaction.reference}</td><td>{transaction.type}</td><td>{transaction.description}</td><td><RevealableAmount value={money(transaction.amount)} /></td><td>{new Date(transaction.date).toLocaleDateString()}</td><td>{transaction.status}</td></tr>)}</tbody></table></div> : <p>No actual transactions are linked to this department.</p>}</section></section></div>}
  </div>;
}
