import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Plus, RefreshCw, Search, X } from "lucide-react";
import RevealableAmount from "../../components/RevealableAmount";

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
const DEPARTMENTS = ["Administration", "Finance", "Human Resources", "Sales", "Operations", "Information Technology"];
const STATUSES = ["Draft", "Pending", "For Review", "Approved", "Allocated", "Adjusted", "Rejected", "Closed"];
const STATUS_CLASS = { Draft: "draft", Pending: "pending", "For Review": "for-review", Approved: "approved", Allocated: "allocated", Adjusted: "adjusted", Rejected: "rejected", Closed: "closed" };
const PROCESS = ["Budget Preparation", "Department Request", "Budget Review", "Approval", "Allocation", "Department Utilization", "Monitoring", "Adjustment / Closure"];
const money = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const label = (value) => value === null || value === undefined || value === "" ? "—" : value;

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Department budget request failed.");
  return payload;
}

export default function DepartmentBudgetAllocationPage({ onAudit = () => {} }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [annualInput, setAnnualInput] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const result = await api(`/api/budget/department-allocations?fiscal_year=${year}`);
      setRows(result.data || []); setSummary(result.summary || {});
      setAnnualInput(String(result.summary?.total_annual_budget || ""));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [year]);
  useEffect(() => { load(); }, [load]);

  const openDetail = async (row) => {
    try {
      const result = await api(`/api/budget/department-allocations/${row.id}`);
      setDetail({ ...result.data, transactions: result.transactions || [] });
    } catch (err) { setError(err.message); }
  };

  const filtered = useMemo(() => rows.filter((row) => {
    if (statusFilter !== "All Statuses" && row.status !== statusFilter) return false;
    const q = query.trim().toLowerCase();
    return !q || [row.allocation_reference, row.department, row.budget_category, row.department_code, row.requested_by].some((value) => String(value || "").toLowerCase().includes(q));
  }), [rows, query, statusFilter]);
  const categoryTotals = useMemo(() => Object.values(rows.reduce((groups, row) => {
    const category = row.budget_category || "Uncategorized";
    const group = groups[category] || (groups[category] = { category, allocated: 0, used: 0, remaining: 0 });
    group.allocated += Number(row.allocated_amount || 0);
    group.used += Number(row.committed_amount || 0) + Number(row.actual_expense || 0) + Number(row.transaction_actual_expense || 0);
      group.remaining += Number(row.remaining_amount || 0);
    return groups;
  }, {})), [rows]);

  const saveAnnualBudget = async (event) => {
    event.preventDefault(); setBusy(true);
    try {
      await api("/api/budget/department-allocations/annual-budget", { method: "PUT", body: JSON.stringify({ fiscal_year: year, annual_budget: Number(annualInput || 0) }) });
      onAudit?.("Updated annual department budget", String(year)); await load();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const submitForm = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    form.fiscal_year = Number(form.fiscal_year); form.requested_amount = Number(form.requested_amount || 0); form.submit = event.nativeEvent.submitter?.value === "submit";
    try {
      const result = await api("/api/budget/department-allocations", { method: "POST", body: JSON.stringify(form) });
      onAudit?.(result.message); setShowForm(false); await load();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const act = async (row, action) => {
    const body = {};
    if (["review", "approve", "allocate", "adjust", "reject", "close"].includes(action)) body.actor = window.prompt(`${action[0].toUpperCase() + action.slice(1)} ${row.allocation_reference}. Enter your name:`, "") || "Budget Officer";
    if (["allocate", "adjust"].includes(action)) {
      const amount = window.prompt("Enter the allocated amount:", String(row.allocated_amount || row.approved_amount || row.requested_amount || 0));
      if (amount === null) return;
      body.allocated_amount = Number(amount);
    }
    if (action === "adjust") {
      const committed = window.prompt("Enter committed amount:", String(row.committed_amount || 0));
      if (committed === null) return;
      body.committed_amount = Number(committed);
    }
    if (action === "approve") {
      const amount = window.prompt("Enter the approved amount:", String(row.requested_amount || 0));
      if (amount === null) return;
      body.approved_amount = Number(amount);
    }
    setBusy(true); setError("");
    try { const result = await api(`/api/budget/department-allocations/${row.id}/${action}`, { method: "PUT", body: JSON.stringify(body) }); onAudit?.(result.message); await load(); if (detail?.id === row.id) setDetail({ ...result.data, transactions: detail.transactions || [] }); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const cards = [
    ["Total Annual Budget", <RevealableAmount value={money(summary.total_annual_budget)} />], ["Total Allocated Budget", <RevealableAmount value={money(summary.total_allocated_budget)} />],
    ["Total Used / Committed", <RevealableAmount value={money(summary.total_used_committed)} />], ["Remaining Budget", <RevealableAmount value={money(summary.remaining_budget)} />],
    ["Pending Allocation", <RevealableAmount value={money(summary.pending_allocation)} />], ["Utilization Rate", `${Number(summary.utilization_rate || 0).toLocaleString("en-PH", { maximumFractionDigits: 2 })}%`],
  ];

  return <div className="module-page department-budget-page">
      <div className="page-header">
      <div><h2>Department Budget Allocation</h2><p>Review department requests, approve funding, allocate budgets and monitor balances.</p></div>
      <div className="page-actions"><label className="dba-year">Fiscal year <select value={year} onChange={(event) => setYear(Number(event.target.value))}>{[year - 1, year, year + 1].map((item) => <option key={item}>{item}</option>)}</select></label><button type="button" className="light-button" onClick={load}><RefreshCw size={14} /> Refresh</button><button type="button" className="primary-button" onClick={() => setShowForm(true)}><Plus size={14} /> New Department Allocation</button></div>
    </div>
    {error && <p className="error-message">{error}</p>}
    <form className="dba-envelope" onSubmit={saveAnnualBudget}><div><b>Approved annual budget envelope</b><small>Set the approved limit for {year}; allocation figures are calculated from database records.</small></div><label>₱ <input type="number" min="0" step="0.01" value={annualInput} onChange={(event) => setAnnualInput(event.target.value)} placeholder="0.00" /></label><button className="light-button" disabled={busy}>Save Budget</button></form>
    <div className="vendor-summary-grid dba-summary">{cards.map(([title, value]) => <div className="vendor-summary-card" key={title}><span className="vendor-summary-label">{title}</span><strong className="vendor-summary-value">{value}</strong></div>)}</div>
    <section className="dba-category"><h3>Budget Allocation by Category</h3>{categoryTotals.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Category</th><th>Allocated</th><th>Used / Committed</th><th>Remaining</th></tr></thead><tbody>{categoryTotals.map((item) => <tr key={item.category}><td>{item.category}</td><td><RevealableAmount value={money(item.allocated)} /></td><td><RevealableAmount value={money(item.used)} /></td><td><RevealableAmount value={money(item.remaining)} /></td></tr>)}</tbody></table></div> : <p>No category allocations recorded for this fiscal year.</p>}</section>
    <section className="dba-process" aria-label="Department budget allocation process">{PROCESS.map((step, index) => <React.Fragment key={step}><span><b>{index + 1}</b>{step}</span>{index < PROCESS.length - 1 && <i aria-hidden="true">›</i>}</React.Fragment>)}</section>
    <div className="dba-toolbar"><label><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search allocation, department, category..." /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All Statuses</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></div>
    <div className="table-wrap"><table className="data-table dba-table"><thead><tr><th>Allocation ID</th><th>Department</th><th>Budget Category</th><th>Requested</th><th>Allocated</th><th>Used / Committed</th><th>Remaining</th><th>Utilization</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {loading ? <tr><td colSpan="10" className="cm-empty-cell">Loading allocations…</td></tr> : filtered.length ? filtered.map((row) => <tr key={row.id}><td><b>{row.allocation_reference}</b><small>{row.fiscal_year} · {row.budget_period}</small></td><td>{row.department}<small>{label(row.department_code)}</small></td><td>{row.budget_category}</td><td><RevealableAmount value={money(row.requested_amount)} /></td><td><RevealableAmount value={money(row.allocated_amount)} /></td><td><RevealableAmount value={money(Number(row.committed_amount || 0) + Number(row.actual_expense || 0) + Number(row.transaction_actual_expense || 0))} /></td><td><RevealableAmount value={money(row.remaining_amount)} /></td><td>{Number(row.utilization_rate || 0).toFixed(2)}%</td><td><span className={`dba-status ${STATUS_CLASS[row.status] || ""}`}>{row.status}</span></td><td><div className="dba-actions"><button type="button" className="pa-icon-btn" title="View allocation" onClick={() => openDetail(row)}><Eye size={14} /></button>{row.status === "Draft" && <button type="button" className="dba-action" disabled={busy} onClick={() => act(row, "submit")}>Submit</button>}{row.status === "Pending" && <button type="button" className="dba-action" disabled={busy} onClick={() => act(row, "review")}>Review</button>}{["Pending", "For Review"].includes(row.status) && <><button type="button" className="dba-action" disabled={busy} onClick={() => act(row, "approve")}>Approve</button><button type="button" className="dba-action" disabled={busy} onClick={() => act(row, "reject")}>Reject</button></>}{row.status === "Approved" && <button type="button" className="dba-action" disabled={busy} onClick={() => act(row, "allocate")}>Allocate</button>}{["Allocated", "Adjusted"].includes(row.status) && <><button type="button" className="dba-action" disabled={busy} onClick={() => act(row, "adjust")}>Adjust</button><button type="button" className="dba-action" disabled={busy} onClick={() => act(row, "close")}>Close</button></>}</div></td></tr>) : <tr><td colSpan="10" className="cm-empty-cell">No department allocations for {year}.</td></tr>}
    </tbody></table></div>

    {showForm && <div className="dba-backdrop" role="presentation"><section className="dba-modal" role="dialog" aria-modal="true" aria-labelledby="dba-new-title"><header><h3 id="dba-new-title">New Department Allocation</h3><button type="button" onClick={() => setShowForm(false)} aria-label="Close"><X size={18} /></button></header><form onSubmit={submitForm}>
      <div className="dba-form-grid"><label>Department<select name="department" required>{DEPARTMENTS.map((item) => <option key={item}>{item}</option>)}</select></label><label>Department Code<input name="department_code" /></label><label>Department Head<input name="department_head" /></label><label>Fiscal Year<input name="fiscal_year" type="number" min="2000" defaultValue={year} required /></label><label>Budget Period<input name="budget_period" placeholder="Annual / Q1 / Jan–Mar" required /></label><label>Budget Category<input name="budget_category" placeholder="Payroll, Operations, Equipment..." required /></label><label>Requested Amount<input name="requested_amount" type="number" min="0" step="0.01" defaultValue="0" required /></label><label>Funding Source<input name="funding_source" /></label><label>Priority<select name="priority"><option>Normal</option><option>Low</option><option>High</option><option>Urgent</option></select></label><label>Requested By<input name="requested_by" /></label><label className="full">Justification<textarea name="justification" rows="3" /></label><label>Supporting Document<input name="supporting_document" /></label><label className="full">Remarks<textarea name="remarks" rows="2" /></label></div><footer><button type="button" className="light-button" onClick={() => setShowForm(false)}>Cancel</button><button name="intent" value="draft" className="light-button" disabled={busy}>Save Draft</button><button name="intent" value="submit" className="primary-button" disabled={busy}>Submit for Review</button></footer>
    </form></section></div>}

    {detail && <div className="dba-backdrop" role="presentation"><section className="dba-modal dba-detail" role="dialog" aria-modal="true" aria-labelledby="dba-detail-title"><header><div><h3 id="dba-detail-title">{detail.allocation_reference}</h3><span className={`dba-status ${STATUS_CLASS[detail.status] || ""}`}>{detail.status}</span></div><button type="button" onClick={() => setDetail(null)} aria-label="Close"><X size={18} /></button></header><div className="dba-detail-grid">{[["Department", detail.department], ["Department Code", detail.department_code], ["Department Head", detail.department_head], ["Fiscal Year", detail.fiscal_year], ["Budget Period", detail.budget_period], ["Budget Category", detail.budget_category], ["Requested Amount", <RevealableAmount value={money(detail.requested_amount)} />], ["Approved Amount", <RevealableAmount value={money(detail.approved_amount)} />], ["Allocated Amount", <RevealableAmount value={money(detail.allocated_amount)} />], ["Committed Amount", <RevealableAmount value={money(detail.committed_amount)} />], ["Actual Expenses", <RevealableAmount value={money(Number(detail.actual_expense || 0) + Number(detail.transaction_actual_expense || 0))} />], ["Remaining Balance", <RevealableAmount value={money(detail.remaining_amount)} />], ["Utilization", `${Number(detail.utilization_rate || 0).toFixed(2)}%`], ["Funding Source", detail.funding_source], ["Requested By", detail.requested_by], ["Reviewed By", detail.reviewed_by], ["Approved By", detail.approved_by], ["Request Date", detail.requested_at], ["Approval Date", detail.approval_date], ["Allocation Date", detail.allocation_date], ["Remarks", detail.remarks]].map(([key, value]) => <div key={key}><small>{key}</small><b>{label(value)}</b></div>)}</div><section className="dba-transactions"><h4>Budget Transactions</h4>{detail.transactions?.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Reference</th><th>Type</th><th>Date</th><th>Description</th><th>Amount</th></tr></thead><tbody>{detail.transactions.map((transaction) => <tr key={transaction.transaction_reference}><td>{transaction.transaction_reference}</td><td>{transaction.transaction_type}</td><td>{transaction.transaction_date}</td><td>{transaction.description || "—"}</td><td><RevealableAmount value={money(transaction.amount)} /></td></tr>)}</tbody></table></div> : <p>No transactions linked to this allocation yet.</p>}</section></section></div>}
  </div>;
}
