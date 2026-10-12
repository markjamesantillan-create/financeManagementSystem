import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowLeftRight, Banknote, ChartNoAxesCombined, CircleDollarSign, Landmark, Plus, RefreshCw, Wallet, X } from "lucide-react";
import RevealableAmount from "../../components/RevealableAmount";
import RevealableText from "../../components/RevealableText";
import "../../styles/cash-management/cash_flow_monitoring.css";

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
const PERIODS = ["daily", "weekly", "monthly", "quarterly", "yearly"];
const FLOW_TYPES = ["Cash Inflow", "Cash Outflow", "Transfer", "Adjustment"];
const FLOW_STATUSES = ["Completed", "Recorded", "Pending", "For Approval", "Rejected", "Cancelled"];
const CASH_SUMMARY_ICONS = [Landmark, CircleDollarSign, Banknote, ChartNoAxesCombined, ArrowLeftRight, Wallet];
const money = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const formatDate = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString() : "—";
const INITIAL_TRANSACTION = () => ({
  transaction_date: today(),
  reference_number: "",
  description: "",
  transaction_type: "Cash Inflow",
  direction: "Inflow",
  category: "",
  source_payee: "",
  account_name: "",
  destination_account: "",
  amount: "",
  status: "Recorded",
  recorded_by: "",
});
const INITIAL_ACCOUNT = () => ({
  account_name: "",
  account_type: "Bank",
  opening_balance: "",
  opening_date: today(),
  minimum_cash_level: "0",
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
    throw new Error(payload.message || `Cash flow request failed (${response.status}).`);
  }
  return payload;
}

function statusClass(status) {
  return String(status || "").toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
}

export default function CashFlowMonitoringPage({
  onAudit = () => {},
  title = "Cash Flow Monitoring",
  flowFilter = null,
}) {
  const [periodType, setPeriodType] = useState("monthly");
  const [anchor, setAnchor] = useState(today);
  const [period, setPeriod] = useState(null);
  const [summary, setSummary] = useState({});
  const [forecast, setForecast] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [trend, setTrend] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [accountFilter, setAccountFilter] = useState("All Accounts");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [transactionForm, setTransactionForm] = useState(false);
  const [accountForm, setAccountForm] = useState(false);
  const [transaction, setTransaction] = useState(INITIAL_TRANSACTION);
  const [account, setAccount] = useState(INITIAL_ACCOUNT);

  const query = useMemo(
    () => `period=${encodeURIComponent(periodType)}&anchor=${encodeURIComponent(anchor)}`,
    [periodType, anchor]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const accountQuery = accountFilter === "All Accounts" ? "" : `&account_name=${encodeURIComponent(accountFilter)}`;
      const [transactionsResult, summaryResult, forecastResult, accountsResult, alertsResult, trendResult] = await Promise.all([
        api(`/api/cash-flow/transactions?${query}`),
        api(`/api/cash-flow/summary?${query}`),
        api(`/api/cash-flow/forecast?${query}`),
        api(`/api/cash-flow/accounts?${query}`),
        api(`/api/cash-flow/alerts?${query}`),
        api(`/api/cash-flow/trend?${query}${accountQuery}`),
      ]);
      setTransactions(transactionsResult.data || []);
      setTrend(trendResult.data || []);
      setSummary(summaryResult.data || {});
      setForecast(forecastResult.data || {});
      setAccounts(accountsResult.data || []);
      setAlerts(alertsResult.data || []);
      setPeriod(summaryResult.period || transactionsResult.period);
    } catch (err) {
      setError(err.message || "Cash flow information could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [query, accountFilter]);

  useEffect(() => { load(); }, [load]);

  const movePeriod = (amount) => {
    const date = new Date(`${anchor}T00:00:00.000Z`);
    if (periodType === "daily") date.setUTCDate(date.getUTCDate() + amount);
    if (periodType === "weekly") date.setUTCDate(date.getUTCDate() + amount * 7);
    if (periodType === "monthly") date.setUTCMonth(date.getUTCMonth() + amount, 1);
    if (periodType === "quarterly") date.setUTCMonth(date.getUTCMonth() + amount * 3, 1);
    if (periodType === "yearly") date.setUTCFullYear(date.getUTCFullYear() + amount, 0, 1);
    setAnchor(date.toISOString().slice(0, 10));
  };

  const submitTransaction = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = {
        ...transaction,
        amount: Number(transaction.amount),
        reference_number: transaction.reference_number.trim(),
        account_name: transaction.account_name.trim(),
        destination_account: transaction.destination_account.trim(),
      };
      const result = await api("/api/cash-flow/transactions", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onAudit?.(result.message);
      setTransactionForm(false);
      setTransaction(INITIAL_TRANSACTION());
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitAccount = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api("/api/cash-flow/accounts", {
        method: "POST",
        body: JSON.stringify({
          ...account,
          opening_balance: Number(account.opening_balance),
          minimum_cash_level: Number(account.minimum_cash_level || 0),
        }),
      });
      onAudit?.(result.message);
      setAccountForm(false);
      setAccount(INITIAL_ACCOUNT());
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const reconcile = async (item) => {
    const reconciledBy = window.prompt(`Name of the person reconciling ${item.transaction_id}:`, "Cash Manager");
    if (!reconciledBy?.trim()) return;
    setBusy(true);
    setError("");
    try {
      const result = await api("/api/cash-flow/reconcile", {
        method: "POST",
        body: JSON.stringify({ source_key: item.transaction_id, reconciled_by: reconciledBy.trim() }),
      });
      onAudit?.(result.message);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const selectedAccount = accountFilter === "All Accounts"
    ? null
    : accounts.find((item) => item.account_name === accountFilter) || null;
  const displayedAccounts = selectedAccount ? [selectedAccount] : accounts;
  const displayedSummary = selectedAccount
    ? {
        opening_cash_balance: selectedAccount.period_opening,
        total_cash_inflow: selectedAccount.cash_in,
        total_cash_outflow: selectedAccount.cash_out,
        net_cash_flow: selectedAccount.cash_in - selectedAccount.cash_out,
        closing_cash_balance: selectedAccount.period_opening + selectedAccount.cash_in - selectedAccount.cash_out,
        available_cash: selectedAccount.current_balance,
      }
    : summary;
  const summaryCards = [
    ["Opening Cash Balance", displayedSummary.opening_cash_balance],
    ["Total Cash Inflow", displayedSummary.total_cash_inflow],
    ["Total Cash Outflow", displayedSummary.total_cash_outflow],
    ["Net Cash Flow", displayedSummary.net_cash_flow],
    ["Closing Cash Balance", displayedSummary.closing_cash_balance],
    ["Available Cash", displayedSummary.available_cash],
  ];
  const visibleTransactions = useMemo(() => transactions.filter((item) => {
    if (accountFilter !== "All Accounts" &&
        item.account_name !== accountFilter && item.destination_account !== accountFilter) return false;
    if (flowFilter === "inflow") {
      return item.transaction_type === "Cash Inflow" ||
        (item.transaction_type === "Adjustment" && item.direction === "Inflow");
    }
    if (flowFilter === "outflow") {
      return item.transaction_type === "Cash Outflow" ||
        (item.transaction_type === "Adjustment" && item.direction === "Outflow");
    }
    return true;
  }), [transactions, flowFilter, accountFilter]);
  const maxTrendAmount = Math.max(1, ...trend.flatMap((item) => [Number(item.cash_inflow || 0), Number(item.cash_outflow || 0)]));
  const pageDescription = title === "Bank Account Management"
    ? "Manage registered bank and cash accounts, opening balances, available cash, and reconciliation status."
    : flowFilter === "inflow"
      ? "Monitor receipts from verified client payments, collections, and other incoming cash."
      : flowFilter === "outflow"
        ? "Monitor actual disbursements from payroll, suppliers, utilities, expenses, and taxes."
        : "Monitor actual cash movements from payments, collections, payroll, expenses, and registered accounts.";

  return (
    <section className="cash-flow-page">
      <div className="page-header">
        <div>
        <h2><ChartNoAxesCombined size={25} /> {title}</h2>
          <p>{pageDescription}</p>
        </div>
        <div className="page-actions">
          <button type="button" className="light-button" onClick={load} disabled={loading}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button type="button" className="light-button" onClick={() => setAccountForm(true)}>
            <Plus size={14} /> Add Account
          </button>
          <button type="button" className="primary-button" onClick={() => setTransactionForm(true)}>
            <Plus size={14} /> Record Cash Flow
          </button>
        </div>
      </div>

      {error && <p className="error-message" role="alert">{error}</p>}

      <section className="cf-period-bar" aria-label="Cash flow reporting period">
        <div className="cf-period-options" role="group" aria-label="Period type">
          {PERIODS.map((option) => (
            <button
              type="button"
              key={option}
              className={periodType === option ? "active" : ""}
              aria-pressed={periodType === option}
              onClick={() => setPeriodType(option)}
            >
              {option[0].toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
        <div className="cf-period-date">
          <label className="cf-account-filter">
            <span>Account</span>
            <select value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)}>
              <option>All Accounts</option>
              {accounts.map((item) => <option key={item.account_name}>{item.account_name}</option>)}
            </select>
          </label>
          <button type="button" aria-label="Previous period" onClick={() => movePeriod(-1)}><ArrowLeft size={15} /></button>
          <label>
            <span>Period{period?.label ? `: ${period.label}` : ""}</span>
            <input type="date" value={anchor} onChange={(event) => setAnchor(event.target.value)} />
          </label>
          <button type="button" aria-label="Next period" onClick={() => movePeriod(1)}><ArrowRight size={15} /></button>
        </div>
      </section>

      <section className="cf-summary-grid" aria-label="Cash flow summary">
        {summaryCards.map(([title, value], index) => {
          const Icon = CASH_SUMMARY_ICONS[index];
          return <article className={`cf-summary-card cf-summary-${index}`} key={title}>
            <span className="cf-summary-icon"><Icon size={18} /></span>
            <div className="cf-summary-content"><span>{title}</span>
              {loading ? <strong>Loading…</strong> : <strong><RevealableAmount value={money(value)} /></strong>}
            </div>
          </article>;
        })}
      </section>

      <section className="cf-panel">
        <div className="cf-panel-heading">
          <div><h3><ChartNoAxesCombined size={16} /> Cash Flow Trend</h3><p>{accountFilter === "All Accounts" ? "Actual cash inflow and outflow" : `Actual cash movements for ${accountFilter}`} across {period?.label || "the selected period"}.</p></div>
          <div className="cf-trend-legend"><span className="cf-legend-in">Cash Inflow</span><span className="cf-legend-out">Cash Outflow</span></div>
        </div>
        <div className={`cf-trend-chart cf-trend-${periodType}`} role="img" aria-label="Bar chart comparing cash inflow and outflow">
          {loading ? <p className="cf-empty">Loading trend…</p> : trend.map((item) => (
            <div className="cf-trend-column" key={item.date} title={item.label}>
              <div className="cf-trend-bars">
                <span className="cf-trend-bar cf-trend-in" style={{ height: `${Math.max(2, Number(item.cash_inflow || 0) / maxTrendAmount * 100)}%` }} />
                <span className="cf-trend-bar cf-trend-out" style={{ height: `${Math.max(2, Number(item.cash_outflow || 0) / maxTrendAmount * 100)}%` }} />
              </div>
              <small>{item.label}</small>
            </div>
          ))}
        </div>
      </section>

      <div className="cf-overview-grid">
        <section className="cf-panel">
          <div className="cf-panel-heading">
            <div><h3><ArrowLeftRight size={16} /> Cash Flow Forecast</h3><p>Actual movements compared with invoices, approved obligations, and planned cash entries. Forecast is company-wide.</p></div>
            <span className={`cf-forecast-status ${statusClass(forecast.status)}`}>{loading ? "Loading" : forecast.status || "—"}</span>
          </div>
          <div className="cf-forecast-table">
            <div className="cf-forecast-row cf-forecast-header"><span>Flow</span><span>Expected</span><span>Actual</span><span>Variance</span></div>
            <div className="cf-forecast-row">
              <b>Cash Inflow</b>
              <RevealableAmount value={money(forecast.expected_inflow)} />
              <RevealableAmount value={money(forecast.actual_inflow)} />
              <RevealableAmount value={money(forecast.inflow_variance)} />
            </div>
            <div className="cf-forecast-row">
              <b>Cash Outflow</b>
              <RevealableAmount value={money(forecast.expected_outflow)} />
              <RevealableAmount value={money(forecast.actual_outflow)} />
              <RevealableAmount value={money(forecast.outflow_variance)} />
            </div>
          </div>
          <p className="cf-forecast-reason">{forecast.reason || "Forecast is calculated from records due in the selected period."}</p>
        </section>

        <section className="cf-panel cf-alert-panel">
          <div className="cf-panel-heading"><div><h3><Wallet size={16} /> Alerts and Exceptions</h3><p>Company-wide cash warnings and completed movements awaiting reconciliation.</p></div></div>
          {loading ? <p className="cf-empty">Loading alerts…</p> : alerts.length ? (
            <ul className="cf-alert-list">
              {alerts.map((alert, index) => (
                <li className={`cf-alert cf-alert-${statusClass(alert.type)}`} key={`${alert.type}-${alert.transaction_id || index}`}>
                  <b>{alert.type}</b>
                  {alert.type === "Low Cash Warning" && <span>Available <RevealableAmount value={money(alert.available_cash)} /> · Minimum <RevealableAmount value={money(alert.minimum_cash_level)}></RevealableAmount></span>}
                  {alert.type === "Negative Cash Flow" && <span>In <RevealableAmount value={money(alert.cash_inflow)} /> · Out <RevealableAmount value={money(alert.cash_outflow)} /> · Net <RevealableAmount value={money(alert.net_cash_flow)} /></span>}
                  {alert.type === "Unreconciled Transaction" && <span><RevealableText value={alert.reference_number || alert.transaction_id} /> · <RevealableAmount value={money(alert.amount)} /> · {alert.status}</span>}
                </li>
              ))}
            </ul>
          ) : <p className="cf-empty">No cash flow exceptions for this period.</p>}
        </section>
      </div>

      <section className="cf-panel">
        <div className="cf-panel-heading"><div><h3>{flowFilter === "inflow" ? "Cash Inflow Transactions" : flowFilter === "outflow" ? "Cash Outflow Transactions" : "Cash Flow Transactions"}</h3><p>Actual settled activity is sourced from the connected payment and payroll modules. Cash-only records are stored in the cash flow ledger.</p></div></div>
        <div className="table-wrap">
          <table className="data-table cf-transactions-table">
            <thead><tr><th>Transaction ID</th><th>Transaction Date</th><th>Reference Number</th><th>Description</th><th>Cash Flow Type</th><th>Category</th><th>Source / Payee</th><th>Bank / Cash Account</th><th>Amount</th><th>Status</th><th>Recorded By</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="12" className="cm-empty-cell">Loading cash flow records…</td></tr>
                : visibleTransactions.length ? visibleTransactions.map((item) => (
                  <tr key={item.transaction_id}>
                    <td>{item.transaction_id}</td><td>{formatDate(item.transaction_date)}</td>
                    <td><RevealableText value={item.reference_number || "—"} /></td><td><RevealableText value={item.description} /></td>
                    <td><span className={`cf-flow-type cf-type-${statusClass(item.transaction_type)}`}>{item.transaction_type}</span></td>
                    <td>{item.category}</td><td><RevealableText value={item.source_payee || "—"} /></td><td><RevealableText value={`${item.account_name || "Unassigned"}${item.destination_account ? ` → ${item.destination_account}` : ""}`} /></td>
                    <td><RevealableAmount value={money(item.amount)} /></td>
                    <td><span className={`cf-status cf-status-${statusClass(item.status)}`}>{item.status}</span></td>
                    <td><RevealableText value={item.recorded_by || "—"} /></td>
                    <td>{item.status === "Completed" && !item.reconciled
                      ? <button type="button" className="cf-action" disabled={busy} onClick={() => reconcile(item)}>Reconcile</button>
                      : item.reconciled ? <span className="cf-status cf-status-reconciled">Reconciled</span> : "—"}</td>
                  </tr>
                )) : <tr><td colSpan="12" className="cm-empty-cell">No cash movements recorded for this period.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <div className="cf-overview-grid">
        <section className="cf-panel">
          <div className="cf-panel-heading"><div><h3>Bank / Cash Accounts</h3><p>Balances are derived from registered opening balances and recorded cash movements.</p></div></div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Account Name</th><th>Account Type</th><th>Opening Balance</th><th>Cash In</th><th>Cash Out</th><th>Current Balance</th><th>Last Reconciled</th><th>Reconciliation Status</th></tr></thead>
              <tbody>{loading ? <tr><td colSpan="8" className="cm-empty-cell">Loading accounts…</td></tr>
                : displayedAccounts.length ? displayedAccounts.map((item) => (
                  <tr key={item.account_name}><td>{item.account_name}</td><td>{item.registered ? item.account_type : `${item.account_type} account`}</td>
                    <td><RevealableAmount value={money(item.opening_balance)} /></td><td><RevealableAmount value={money(item.cash_in)} /></td>
                    <td><RevealableAmount value={money(item.cash_out)} /></td><td><RevealableAmount value={money(item.current_balance)} /></td>
                    <td>{formatDate(item.last_reconciled)}</td>
                    <td><span className={`cf-status cf-status-${statusClass(item.reconciliation_status)}`}>{item.reconciliation_status}</span></td>
                  </tr>
                )) : <tr><td colSpan="8" className="cm-empty-cell">Register an account to set its opening and minimum cash balances.</td></tr>}</tbody>
            </table>
          </div>
        </section>
        <section className="cf-panel">
          <div className="cf-panel-heading"><div><h3>Budget vs Actual Cash Flow</h3><p>Company-wide: approved annual category allocations are prorated to the selected period.</p></div></div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Category</th><th>Period Budget</th><th>Actual Outflow</th><th>Variance</th></tr></thead>
              <tbody>{loading ? <tr><td colSpan="4" className="cm-empty-cell">Loading budget comparison…</td></tr>
                : summary.budget_vs_actual?.length ? summary.budget_vs_actual.map((item) => (
                  <tr key={item.category}><td>{item.category}</td><td><RevealableAmount value={money(item.budget)} /></td>
                    <td><RevealableAmount value={money(item.actual)} /></td><td><RevealableAmount value={money(item.variance)} /></td></tr>
                )) : <tr><td colSpan="4" className="cm-empty-cell">No approved budget allocations or cash outflows are recorded for this period.</td></tr>}</tbody>
            </table>
          </div>
        </section>
      </div>

      {transactionForm && (
        <div className="dba-backdrop" role="presentation">
          <section className="dba-modal cf-modal" role="dialog" aria-modal="true" aria-labelledby="cf-transaction-title">
            <header><h3 id="cf-transaction-title">Record Cash Flow</h3><button type="button" onClick={() => setTransactionForm(false)} aria-label="Close"><X size={18} /></button></header>
            <form onSubmit={submitTransaction}>
              <div className="dba-form-grid">
                <label>Transaction Date<input type="date" value={transaction.transaction_date} onChange={(event) => setTransaction({ ...transaction, transaction_date: event.target.value })} required /></label>
                <label>Reference Number<input value={transaction.reference_number} onChange={(event) => setTransaction({ ...transaction, reference_number: event.target.value })} /></label>
                <label className="full">Description<input value={transaction.description} onChange={(event) => setTransaction({ ...transaction, description: event.target.value })} required maxLength="500" /></label>
                <label>Cash Flow Type<select value={transaction.transaction_type} onChange={(event) => { const type = event.target.value; setTransaction({ ...transaction, transaction_type: type, direction: type === "Cash Outflow" ? "Outflow" : "Inflow" }); }}>{FLOW_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
                {transaction.transaction_type === "Adjustment" && <label>Adjustment Direction<select value={transaction.direction} onChange={(event) => setTransaction({ ...transaction, direction: event.target.value })}><option>Inflow</option><option>Outflow</option></select></label>}
                <label>Category<input value={transaction.category} onChange={(event) => setTransaction({ ...transaction, category: event.target.value })} required maxLength="120" placeholder="Other Income, Refund, Deposit..." /></label>
                <label>Source / Payee<input value={transaction.source_payee} onChange={(event) => setTransaction({ ...transaction, source_payee: event.target.value })} /></label>
                <label>Bank / Cash Account<input list="cf-account-list" value={transaction.account_name} onChange={(event) => setTransaction({ ...transaction, account_name: event.target.value })} /><datalist id="cf-account-list">{accounts.map((item) => <option key={item.account_name} value={item.account_name} />)}</datalist></label>
                {transaction.transaction_type === "Transfer" && <label>Destination Account<input list="cf-account-list" value={transaction.destination_account} onChange={(event) => setTransaction({ ...transaction, destination_account: event.target.value })} required /></label>}
                <label>Amount<input type="number" min="0.01" max="9999999999999.99" step="0.01" value={transaction.amount} onChange={(event) => setTransaction({ ...transaction, amount: event.target.value })} required /></label>
                <label>Status<select value={transaction.status} onChange={(event) => setTransaction({ ...transaction, status: event.target.value })}>{FLOW_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
                <label>Recorded By<input value={transaction.recorded_by} onChange={(event) => setTransaction({ ...transaction, recorded_by: event.target.value })} /></label>
              </div>
              <footer><button type="button" className="light-button" onClick={() => setTransactionForm(false)}>Cancel</button><button type="submit" className="primary-button" disabled={busy}>{busy ? "Saving…" : "Save Transaction"}</button></footer>
            </form>
          </section>
        </div>
      )}

      {accountForm && (
        <div className="dba-backdrop" role="presentation">
          <section className="dba-modal cf-modal" role="dialog" aria-modal="true" aria-labelledby="cf-account-title">
            <header><h3 id="cf-account-title">Add Bank / Cash Account</h3><button type="button" onClick={() => setAccountForm(false)} aria-label="Close"><X size={18} /></button></header>
            <form onSubmit={submitAccount}>
              <div className="dba-form-grid">
                <label>Account Name<input value={account.account_name} onChange={(event) => setAccount({ ...account, account_name: event.target.value })} required maxLength="160" /></label>
                <label>Account Type<select value={account.account_type} onChange={(event) => setAccount({ ...account, account_type: event.target.value })}><option>Bank</option><option>Cash</option><option>E-wallet</option><option>Other</option></select></label>
                <label>Opening Balance<input type="number" min="0" max="9999999999999.99" step="0.01" value={account.opening_balance} onChange={(event) => setAccount({ ...account, opening_balance: event.target.value })} required /></label>
                <label>Opening Date<input type="date" value={account.opening_date} onChange={(event) => setAccount({ ...account, opening_date: event.target.value })} required /></label>
                <label>Minimum Cash Level<input type="number" min="0" max="9999999999999.99" step="0.01" value={account.minimum_cash_level} onChange={(event) => setAccount({ ...account, minimum_cash_level: event.target.value })} /></label>
              </div>
              <footer><button type="button" className="light-button" onClick={() => setAccountForm(false)}>Cancel</button><button type="submit" className="primary-button" disabled={busy}>{busy ? "Saving…" : "Save Account"}</button></footer>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
