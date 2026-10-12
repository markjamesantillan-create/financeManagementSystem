import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, CircleAlert, Download, Eye, Landmark, Pencil, Plus, Printer, RefreshCw, Repeat2, Search, ShieldAlert, Wallet, X } from "lucide-react";
import RevealableAmount from "../../components/RevealableAmount";
import RevealableText from "../../components/RevealableText";
import "../../styles/cash-management/bank_account_management.css";

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const monthStart = (date = today()) => `${date.slice(0, 7)}-01`;
const money = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString() : "—";
const statusClass = (status) => String(status || "").toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
const accountTypes = ["Bank", "Cash Account", "Checking Account", "Savings Account", "Payroll Account", "Operating Account", "Petty Cash / Cash Account", "Investment Account", "Restricted Account"];
const BANK_SUMMARY_ICONS = [Landmark, Wallet, Banknote, CircleAlert, ShieldAlert];
const initialAccount = () => ({
  account_name: "", bank_name: "", account_number: "", account_type: "Checking Account",
  branch: "", currency: "PHP", purpose: "", opening_balance: "0", opening_date: today(),
  minimum_cash_level: "0", account_status: "Active",
});

async function api(path, options = {}) {
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
    throw new Error(payload.message || `Bank account request failed (${response.status}).`);
  }
  return payload;
}

function accountNumber(value) {
  if (!value) return "Not provided";
  return `**** **** ${String(value).slice(-4)}`;
}

export default function BankAccountManagementPage({ onAudit = () => {} }) {
  const [accounts, setAccounts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "All Statuses", type: "All Types" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [accountModal, setAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountForm, setAccountForm] = useState(initialAccount);
  const [reconcileModal, setReconcileModal] = useState(false);
  const [reconcileForm, setReconcileForm] = useState({ statement_start: monthStart(), statement_end: today(), statement_ending_balance: "", prepared_by: "", reviewed_by: "" });
  const [transferModal, setTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({ transaction_date: today(), account_name: "", destination_account: "", amount: "", transfer_fee: "0", reference_number: "", description: "", recorded_by: "" });
  const [searchVisible, setSearchVisible] = useState(false);

  const periodQuery = useMemo(
    () => new URLSearchParams({ period: "monthly", anchor: today() }).toString(),
    [],
  );
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api(`/api/cash-flow/accounts?${periodQuery}`);
      const registered = (result.data || []).filter((account) => account.registered);
      setAccounts(registered);
      setSelectedId((current) => registered.some((account) => account.id === current)
        ? current : registered[0]?.id || null);
    } catch (loadError) {
      setError(loadError.message || "Bank account data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [periodQuery]);

  useEffect(() => { load(); }, [load]);

  const selected = accounts.find((account) => account.id === selectedId) || null;
  const visibleAccounts = useMemo(() => accounts.filter((account) => {
    const term = filters.search.trim().toLowerCase();
    if (filters.status !== "All Statuses" && account.account_status !== filters.status) return false;
    if (filters.type !== "All Types" && account.account_type !== filters.type) return false;
    return !term || [account.account_name, account.bank_name, account.account_type, account.branch]
      .some((value) => String(value || "").toLowerCase().includes(term));
  }), [accounts, filters]);

  const loadSelected = useCallback(async () => {
    if (!selectedId) {
      setTransactions([]);
      setReconciliations([]);
      return;
    }
    try {
      const [transactionResult, reconciliationResult] = await Promise.all([
        api(`/api/cash-flow/accounts/${selectedId}/transactions?${periodQuery}`),
        api(`/api/cash-flow/accounts/${selectedId}/reconciliations`),
      ]);
      setTransactions(transactionResult.data || []);
      setReconciliations(reconciliationResult.data || []);
    } catch (loadError) {
      setError(loadError.message || "Account activity could not be loaded.");
    }
  }, [selectedId, periodQuery]);
  useEffect(() => { loadSelected(); }, [loadSelected]);

  const alerts = useMemo(() => {
    const items = [];
    for (const account of accounts) {
      if (Number(account.minimum_cash_level) > 0 && Number(account.current_balance) < Number(account.minimum_cash_level)) {
        items.push({ type: "Low Balance", account, current_balance: account.current_balance, minimum_cash_level: account.minimum_cash_level });
      }
      if (["Restricted", "Suspended"].includes(account.account_status)) {
        items.push({ type: `${account.account_status} Account`, account, details: "Transactions should be reviewed before processing." });
      }
      if (account.reconciliation_status === "Difference Found" && Number(account.latest_statement_difference) !== 0) {
        items.push({
          type: "Reconciliation Difference",
          account,
          difference: account.latest_statement_difference,
          statement_date: account.last_reconciled,
        });
      }
    }
    for (const transaction of transactions) {
      if (Number(transaction.amount) >= 1000000) {
        items.push({
          type: "Large Transaction",
          account: selected,
          reference_number: transaction.reference_number || transaction.transaction_id,
          amount: transaction.amount,
          description: transaction.description,
        });
      }
    }
    return items;
  }, [accounts, reconciliations, transactions, selected]);

  const totals = useMemo(() => ({
    count: accounts.length,
    active: accounts.filter((account) => ["Active", "Verified"].includes(account.account_status)).length,
    balance: accounts
      .filter((account) => ["Active", "Verified"].includes(account.account_status))
      .reduce((sum, account) => sum + Number(account.current_balance || 0), 0),
    pending: accounts.filter((account) => account.reconciliation_status !== "Reconciled").length,
    restricted: accounts.filter((account) => ["Restricted", "Suspended"].includes(account.account_status)).length,
  }), [accounts]);

  const openAdd = () => {
    setEditingAccount(null);
    setAccountForm(initialAccount());
    setAccountModal(true);
  };
  const openEdit = (account) => {
    setEditingAccount(account);
    setAccountForm({
      ...initialAccount(),
      ...account,
      account_number: "",
      opening_balance: String(account.registered_opening_balance ?? account.opening_balance ?? 0),
      opening_date: account.opening_date ? String(account.opening_date).slice(0, 10) : today(),
      minimum_cash_level: String(account.minimum_cash_level || 0),
    });
    setAccountModal(true);
  };

  const saveAccount = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const editing = Boolean(editingAccount);
      const payload = {
        ...accountForm,
        opening_balance: Number(accountForm.opening_balance),
        minimum_cash_level: Number(accountForm.minimum_cash_level),
      };
      if (editing) {
        await api(`/api/cash-flow/accounts/${editingAccount.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/api/cash-flow/accounts", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onAudit?.(editing ? "Updated bank account" : "Added bank account", accountForm.account_name);
      setAccountModal(false);
      await load();
    } catch (saveError) {
      setError(saveError.message || "Bank account could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const saveReconciliation = async (event) => {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const result = await api(`/api/cash-flow/accounts/${selected.id}/reconcile`, {
        method: "POST",
        body: JSON.stringify({ ...reconcileForm, statement_ending_balance: Number(reconcileForm.statement_ending_balance) }),
      });
      onAudit?.(result.message, selected.account_name);
      setReconcileModal(false);
      await loadSelected();
    } catch (saveError) {
      setError(saveError.message || "Bank reconciliation could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const saveTransfer = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api("/api/cash-flow/transactions", {
        method: "POST",
        body: JSON.stringify({
          ...transferForm,
          transaction_type: "Transfer",
          direction: "Outflow",
          category: "Bank Transfer",
          source_payee: transferForm.destination_account,
          amount: Number(transferForm.amount),
          transfer_fee: Number(transferForm.transfer_fee || 0),
          status: "Completed",
        }),
      });
      onAudit?.(result.message, `${transferForm.account_name} → ${transferForm.destination_account}`);
      setTransferModal(false);
      setTransferForm({ transaction_date: today(), account_name: "", destination_account: "", amount: "", transfer_fee: "0", reference_number: "", description: "", recorded_by: "" });
      await load();
      await loadSelected();
    } catch (saveError) {
      setError(saveError.message || "Bank transfer could not be recorded.");
    } finally {
      setBusy(false);
    }
  };

  const exportAccounts = () => {
    const fields = ["account_name", "bank_name", "account_type", "currency", "opening_balance", "current_balance", "minimum_cash_level", "account_status", "last_reconciled"];
    const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [fields.join(","), ...visibleAccounts.map((account) => fields.map((key) => escape(account[key])).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "bank-accounts.csv";
    link.click();
    URL.revokeObjectURL(url);
    onAudit?.("Exported bank account list", `${visibleAccounts.length} records`);
  };

  return (
    <section className="bank-management-page">
      <div className="page-header">
        <div><h2><Landmark size={25} /> Bank Account Management</h2><p>Manage registered bank and cash accounts, calculated balances, transaction histories, transfers, and statement reconciliation.</p></div>
        <div className="page-actions">
          <button type="button" className="light-button" onClick={load} disabled={loading}><RefreshCw size={14} /> Refresh</button>
          <button type="button" className="light-button" onClick={exportAccounts} disabled={loading}><Download size={14} /> Export</button>
          <button type="button" className="light-button" onClick={() => window.print()}><Printer size={14} /> Print</button>
          <button type="button" className="primary-button" onClick={openAdd}><Plus size={14} /> Add Bank Account</button>
        </div>
      </div>
      {error && <p className="error-message" role="alert">{error}</p>}

      <section className="ba-summary-grid" aria-label="Bank account summary">
        {[
          ["Total Bank Accounts", totals.count],
          ["Active Accounts", totals.active],
          ["Total Bank Balance", money(totals.balance)],
          ["Pending Reconciliation", totals.pending],
          ["Restricted Accounts", totals.restricted],
        ].map(([label, value], index) => {
          const Icon = BANK_SUMMARY_ICONS[index];
          return <article className={`ba-summary-card ba-summary-${index}`} key={label}>
            <span className="ba-summary-icon"><Icon size={18} /></span>
            <div className="ba-summary-content"><span>{label}</span>
              {loading ? <strong>Loading…</strong> : <strong>{typeof value === "string" ? <RevealableAmount value={value} /> : value}</strong>}
              <small>{["Registered accounts", "Ready for transactions", "Calculated account balances", "Require statement matching", "Restricted from normal use"][index]}</small>
            </div>
          </article>;
        })}
      </section>

      <section className="ba-panel">
        <div className="ba-panel-heading">
          <div><h3><Wallet size={16} /> Bank Accounts</h3><p>Balances are calculated from registered opening balances and posted transactions.</p></div>
          <div className="ba-account-tools">
            {searchVisible && <label className="ba-search"><Search size={14} /><input value={filters.search} placeholder="Search accounts" onChange={(event) => setFilters({ ...filters, search: event.target.value })} /></label>}
            <button type="button" className="ba-tool-button" aria-label="Search accounts" onClick={() => setSearchVisible(!searchVisible)}><Search size={15} /></button>
            <select aria-label="Filter by status" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option>All Statuses</option>{["Active", "Verified", "Pending Verification", "Restricted", "Suspended", "Closed"].map((status) => <option key={status}>{status}</option>)}
            </select>
            <select aria-label="Filter by account type" value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
              <option>All Types</option>{[...new Set(accounts.map((account) => account.account_type))].map((type) => <option key={type}>{type}</option>)}
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table ba-accounts-table">
            <thead><tr><th>Account ID</th><th>Bank Name</th><th>Account Name</th><th>Account Type</th><th>Currency</th><th>Current Balance</th><th>Available Balance</th><th>Status</th><th>Last Reconciled</th><th>Actions</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan="10" className="cm-empty-cell">Loading accounts…</td></tr>
              : visibleAccounts.length ? visibleAccounts.map((account) => (
                <tr key={account.id} className={selectedId === account.id ? "ba-selected-row" : ""} onClick={() => setSelectedId(account.id)}>
                  <td><RevealableText value={`BA-${String(account.id).padStart(4, "0")}`} /></td><td><RevealableText value={account.bank_name || "—"} /></td><td><RevealableText value={account.account_name} /></td>
                  <td>{account.account_type}</td><td>{account.currency || "PHP"}</td>
                  <td><RevealableAmount value={money(account.current_balance)} /></td><td><RevealableAmount value={money(account.current_balance)} /></td>
                  <td><span className={`ba-status ba-status-${statusClass(account.account_status)}`}>{account.account_status}</span></td>
                  <td>{formatDate(account.last_reconciled)}</td>
                  <td className="ba-row-actions">
                    <button type="button" title="View account" aria-label={`View ${account.account_name}`} onClick={(event) => { event.stopPropagation(); setSelectedId(account.id); }}><Eye size={14} /></button>
                    <button type="button" title="Edit account" aria-label={`Edit ${account.account_name}`} onClick={(event) => { event.stopPropagation(); openEdit(account); }}><Pencil size={14} /></button>
                  </td>
                </tr>
              )) : <tr><td colSpan="10" className="cm-empty-cell">No registered accounts match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <>
          <section className="ba-panel">
            <div className="ba-panel-heading">
              <div><h3><Banknote size={16} /> Selected Account: <RevealableText value={selected.account_name} /></h3><p><RevealableText value={selected.bank_name || "Bank details not entered"} /> · {selected.account_type}</p></div>
              <div className="ba-actions">
                <button type="button" className="light-button" onClick={() => openEdit(selected)}><Pencil size={14} /> Edit</button>
                <button type="button" className="light-button" onClick={() => { setReconcileForm({ statement_start: monthStart(), statement_end: today(), statement_ending_balance: "", prepared_by: "", reviewed_by: "" }); setReconcileModal(true); }}><ShieldAlert size={14} /> Reconcile</button>
                <button type="button" className="light-button" onClick={() => { setTransferForm({ ...transferForm, account_name: selected.account_name, destination_account: "" }); setTransferModal(true); }}><Repeat2 size={14} /> Transfer</button>
              </div>
            </div>
            <div className="ba-detail-grid">
              {[
                ["Bank Name", <RevealableText value={selected.bank_name} />], ["Account Name", <RevealableText value={selected.account_name} />],
                ["Account Number", <RevealableText value={accountNumber(selected.account_number_last4)} />], ["Account Type", selected.account_type],
                ["Branch", selected.branch], ["Currency", selected.currency || "PHP"],
                ["Account Purpose", selected.purpose], ["Opening Balance", <RevealableAmount value={money(selected.registered_opening_balance)} />],
                ["Current Balance", <RevealableAmount value={money(selected.current_balance)} />],
                ["Available Balance", <RevealableAmount value={money(selected.current_balance)} />],
                ["Minimum Balance", <RevealableAmount value={money(selected.minimum_cash_level)} />],
                ["Status", selected.account_status], ["Date Opened", formatDate(selected.opening_date)],
                ["Last Reconciled", formatDate(selected.last_reconciled)],
              ].map(([label, value]) => <div key={label}><small>{label}</small><b>{value || "—"}</b></div>)}
            </div>
          </section>

          <section className="ba-panel">
            <div className="ba-panel-heading"><div><h3>Transaction History</h3><p>Account activity for the current reporting month; transfer debit includes any bank fee.</p></div></div>
            <div className="table-wrap">
              <table className="data-table ba-transactions-table">
                <thead><tr><th>Transaction ID</th><th>Date</th><th>Reference</th><th>Description</th><th>Type</th><th>Source</th><th>Debit</th><th>Credit</th><th>Balance After</th><th>Status</th><th>Reconciliation</th></tr></thead>
                <tbody>{transactions.length ? transactions.map((item) => (
                  <tr key={item.transaction_id}><td>{item.transaction_id}</td><td>{formatDate(item.transaction_date)}</td>
                    <td><RevealableText value={item.reference_number || "—"} /></td><td><RevealableText value={item.description} /></td><td>{item.transaction_type}</td>
                    <td><RevealableText value={item.source_payee || item.category} /></td><td><RevealableAmount value={money(item.debit)} /></td>
                    <td><RevealableAmount value={money(item.credit)} /></td><td><RevealableAmount value={money(item.balance_after)} /></td>
                    <td>{item.status}</td><td>{item.reconciled ? "Reconciled" : "Pending"}</td></tr>
                )) : <tr><td colSpan="11" className="cm-empty-cell">No account transactions in the selected month.</td></tr>}</tbody>
              </table>
            </div>
          </section>

          <section className="ba-panel">
            <div className="ba-panel-heading"><div><h3>Bank Reconciliation</h3><p>Compare a bank statement ending balance with the calculated system balance.</p></div></div>
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Reconciliation ID</th><th>Statement Period</th><th>Statement Balance</th><th>System Balance</th><th>Difference</th><th>Prepared By</th><th>Reviewed By</th><th>Status</th></tr></thead>
                <tbody>{reconciliations.length ? reconciliations.map((item) => (
                  <tr key={item.id}><td>REC-{String(item.id).padStart(5, "0")}</td>
                    <td>{formatDate(item.statement_start)} – {formatDate(item.statement_end)}</td>
                    <td><RevealableAmount value={money(item.statement_ending_balance)} /></td>
                    <td><RevealableAmount value={money(item.system_ending_balance)} /></td>
                    <td><RevealableAmount value={money(item.difference)} /></td>
                    <td><RevealableText value={item.prepared_by || "—"} /></td><td><RevealableText value={item.reviewed_by || "—"} /></td>
                    <td><span className={`ba-status ba-status-${item.status === "Reconciled" ? "active" : "restricted"}`}>{item.status}</span></td></tr>
                )) : <tr><td colSpan="8" className="cm-empty-cell">No statement reconciliation has been recorded for this account.</td></tr>}</tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <section className="ba-panel">
        <div className="ba-panel-heading"><div><h3>Bank Account Alerts</h3><p>Low balances, restricted accounts, differences, and large account transactions.</p></div></div>
        {alerts.length ? <ul className="ba-alert-list">{alerts.map((item, index) => (
          <li key={`${item.type}-${item.account?.id}-${index}`} className={`ba-alert ba-alert-${statusClass(item.type)}`}>
            <b>{item.type}</b><span><RevealableText value={item.account?.account_name || selected?.account_name || "Bank account"} /> · {item.type === "Low Balance"
              ? <>Available <RevealableAmount value={money(item.current_balance)} /> · Minimum <RevealableAmount value={money(item.minimum_cash_level)} /></>
              : item.type === "Reconciliation Difference"
                ? <>Difference <RevealableAmount value={money(item.difference)} /> · Statement {formatDate(item.statement_date)}</>
                : item.type === "Large Transaction"
                  ? <><RevealableText value={item.reference_number} /> · <RevealableAmount value={money(item.amount)} /> · <RevealableText value={item.description} /></>
                  : item.details}</span>
          </li>
        ))}</ul> : <p className="ba-empty">No account alerts detected.</p>}
      </section>

      {accountModal && (
        <div className="dba-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAccountModal(false); }}>
          <section className="dba-modal ba-modal" role="dialog" aria-modal="true" aria-labelledby="ba-account-modal-title">
            <header><h3 id="ba-account-modal-title">{editingAccount ? "Edit Bank Account" : "Add Bank Account"}</h3><button type="button" onClick={() => setAccountModal(false)} aria-label="Close"><X size={18} /></button></header>
            <form onSubmit={saveAccount}>
              <div className="dba-form-grid">
                <label>Account Name<input required maxLength="160" disabled={Boolean(editingAccount)} value={accountForm.account_name} onChange={(event) => setAccountForm({ ...accountForm, account_name: event.target.value })} /></label>
                <label>Bank Name<input maxLength="160" value={accountForm.bank_name || ""} onChange={(event) => setAccountForm({ ...accountForm, bank_name: event.target.value })} /></label>
                <label>Account Number<input maxLength="80" autoComplete="off" placeholder={editingAccount ? "Leave blank to keep current number" : ""} value={accountForm.account_number || ""} onChange={(event) => setAccountForm({ ...accountForm, account_number: event.target.value })} /></label>
                <label>Account Type<select value={accountForm.account_type} onChange={(event) => setAccountForm({ ...accountForm, account_type: event.target.value })}>{accountTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
                <label>Branch<input maxLength="160" value={accountForm.branch || ""} onChange={(event) => setAccountForm({ ...accountForm, branch: event.target.value })} /></label>
                <label>Currency<input required maxLength="3" pattern="[A-Za-z]{3}" value={accountForm.currency || "PHP"} onChange={(event) => setAccountForm({ ...accountForm, currency: event.target.value.toUpperCase() })} /></label>
                <label>Opening Balance<input type="number" min="0" step="0.01" required disabled={Boolean(editingAccount)} value={accountForm.opening_balance} onChange={(event) => setAccountForm({ ...accountForm, opening_balance: event.target.value })} /></label>
                <label>Date Opened<input type="date" required disabled={Boolean(editingAccount)} value={accountForm.opening_date} onChange={(event) => setAccountForm({ ...accountForm, opening_date: event.target.value })} /></label>
                <label>Minimum Balance<input type="number" min="0" step="0.01" required value={accountForm.minimum_cash_level} onChange={(event) => setAccountForm({ ...accountForm, minimum_cash_level: event.target.value })} /></label>
                <label>Status<select value={accountForm.account_status || "Active"} onChange={(event) => setAccountForm({ ...accountForm, account_status: event.target.value })}>{["Active", "Verified", "Pending Verification", "Restricted", "Suspended", "Closed"].map((status) => <option key={status}>{status}</option>)}</select></label>
                <label className="full">Account Purpose<textarea maxLength="1000" value={accountForm.purpose || ""} onChange={(event) => setAccountForm({ ...accountForm, purpose: event.target.value })} /></label>
              </div>
              <footer><button type="button" className="light-button" onClick={() => setAccountModal(false)}>Cancel</button><button type="submit" className="primary-button" disabled={busy}>{busy ? "Saving…" : "Save Account"}</button></footer>
            </form>
          </section>
        </div>
      )}

      {reconcileModal && selected && (
        <div className="dba-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setReconcileModal(false); }}>
          <section className="dba-modal ba-modal" role="dialog" aria-modal="true" aria-labelledby="ba-reconcile-title">
            <header><h3 id="ba-reconcile-title">Reconcile {selected.account_name}</h3><button type="button" onClick={() => setReconcileModal(false)} aria-label="Close"><X size={18} /></button></header>
            <form onSubmit={saveReconciliation}><div className="dba-form-grid">
              <label>Statement Start<input type="date" required value={reconcileForm.statement_start} onChange={(event) => setReconcileForm({ ...reconcileForm, statement_start: event.target.value })} /></label>
              <label>Statement End<input type="date" required value={reconcileForm.statement_end} onChange={(event) => setReconcileForm({ ...reconcileForm, statement_end: event.target.value })} /></label>
              <label>Statement Ending Balance<input type="number" step="0.01" required value={reconcileForm.statement_ending_balance} onChange={(event) => setReconcileForm({ ...reconcileForm, statement_ending_balance: event.target.value })} /></label>
              <label>Prepared By<input required maxLength="120" value={reconcileForm.prepared_by} onChange={(event) => setReconcileForm({ ...reconcileForm, prepared_by: event.target.value })} /></label>
              <label>Reviewed By<input maxLength="120" value={reconcileForm.reviewed_by} onChange={(event) => setReconcileForm({ ...reconcileForm, reviewed_by: event.target.value })} /></label>
            </div><footer><button type="button" className="light-button" onClick={() => setReconcileModal(false)}>Cancel</button><button type="submit" className="primary-button" disabled={busy}>{busy ? "Saving…" : "Compare & Save"}</button></footer></form>
          </section>
        </div>
      )}

      {transferModal && (
        <div className="dba-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setTransferModal(false); }}>
          <section className="dba-modal ba-modal" role="dialog" aria-modal="true" aria-labelledby="ba-transfer-title">
            <header><h3 id="ba-transfer-title">Bank Transfer</h3><button type="button" onClick={() => setTransferModal(false)} aria-label="Close"><X size={18} /></button></header>
            <form onSubmit={saveTransfer}><div className="dba-form-grid">
              <label>Transfer Date<input type="date" required value={transferForm.transaction_date} onChange={(event) => setTransferForm({ ...transferForm, transaction_date: event.target.value })} /></label>
              <label>From Account<select required value={transferForm.account_name} onChange={(event) => setTransferForm({ ...transferForm, account_name: event.target.value })}><option value="">Choose account</option>{accounts.filter((account) => account.account_status === "Active" || account.account_status === "Verified").map((account) => <option key={account.id}>{account.account_name}</option>)}</select></label>
              <label>To Account<select required value={transferForm.destination_account} onChange={(event) => setTransferForm({ ...transferForm, destination_account: event.target.value })}><option value="">Choose account</option>{accounts.filter((account) => account.account_name !== transferForm.account_name && ["Active", "Verified"].includes(account.account_status)).map((account) => <option key={account.id}>{account.account_name}</option>)}</select></label>
              <label>Transfer Amount<input type="number" min="0.01" step="0.01" required value={transferForm.amount} onChange={(event) => setTransferForm({ ...transferForm, amount: event.target.value })} /></label>
              <label>Transfer Fee<input type="number" min="0" step="0.01" value={transferForm.transfer_fee} onChange={(event) => setTransferForm({ ...transferForm, transfer_fee: event.target.value })} /></label>
              <label>Reference Number<input maxLength="160" value={transferForm.reference_number} onChange={(event) => setTransferForm({ ...transferForm, reference_number: event.target.value })} /></label>
              <label>Description<input required maxLength="500" value={transferForm.description} onChange={(event) => setTransferForm({ ...transferForm, description: event.target.value })} /></label>
              <label>Processed By<input maxLength="120" value={transferForm.recorded_by} onChange={(event) => setTransferForm({ ...transferForm, recorded_by: event.target.value })} /></label>
            </div><footer><button type="button" className="light-button" onClick={() => setTransferModal(false)}>Cancel</button><button type="submit" className="primary-button" disabled={busy}>{busy ? "Processing…" : "Record Transfer"}</button></footer></form>
          </section>
        </div>
      )}
    </section>
  );
}
