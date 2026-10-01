import React, { useEffect, useMemo, useState } from "react";
import { Printer, RotateCcw, Clock3 } from "lucide-react";

// Outstanding Balance Tracking reads GET /api/receivables/outstanding from the
// Node backend. Empty API_BASE uses the Vite proxy in local dev; set
// VITE_API_URL / VITE_API_BASE_URL for deployed builds.
const API_BASE =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";

const money = (value) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const Breadcrumb = ({ parent, current }) => (
  <div className="breadcrumb">
    <span>{parent}</span>
    <span> / </span>
    <strong>{current}</strong>
  </div>
);

// Canonical display order for the six backend-calculated statuses.
const STATUS_ORDER = [
  "Paid",
  "Current",
  "Partially Paid",
  "Due Soon",
  "Overdue",
  "Escalated",
];

// "Partially Paid" -> partially-paid (matches the .status-badge CSS classes).
const statusSlug = (status) =>
  String(status || "unknown").toLowerCase().trim().replace(/\s+/g, "-");

const fetchOutstandingBalances = async () => {
  try {
    const response = await fetch(
      `${API_BASE}/api/receivables/outstanding`,
      { headers: { Accept: "application/json" } }
    );
    if (!response.ok) return null;
    const payload = await response.json();
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.balances)) return payload.balances;
    return null;
  } catch (error) {
    console.error("Failed to fetch outstanding balances from API:", error);
    return null;
  }
};

function OutstandingBalancePage({ onAudit, navigate }) {
  // All rows come from GET /api/receivables/outstanding — no hard-coded data.
  const [outstandingBalances, setOutstandingBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [revealedSummary, setRevealedSummary] = useState({});

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const data = await fetchOutstandingBalances();
      if (cancelled) return;

      if (data !== null) {
        setOutstandingBalances(data);
      } else {
        console.warn("Could not load outstanding balances from /api/receivables/outstanding.");
        setOutstandingBalances([]);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    const data = await fetchOutstandingBalances();
    if (data !== null) {
      setOutstandingBalances(data);
    } else {
      console.warn("Could not load outstanding balances from /api/receivables/outstanding.");
      setOutstandingBalances([]);
    }
    setLoading(false);
    onAudit?.("Refreshed outstanding balances", "GET /api/receivables/outstanding");
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return outstandingBalances.filter((item) => {
      if (filterStatus !== "All Status" && item.status !== filterStatus) {
        return false;
      }
      if (!query) return true;
      return [item.invoice_number, item.client_name, item.aging].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );
    });
  }, [outstandingBalances, search, filterStatus]);

  const totals = useMemo(() => {
    let totalOutstanding = 0;
    let overdueTotal = 0;
    let overdueCount = 0;

    for (const item of outstandingBalances) {
      const balance = Number(item.outstanding_balance || 0);
      totalOutstanding += balance;
      if (Number(item.days_overdue || 0) > 0) {
        overdueTotal += balance;
        overdueCount += 1;
      }
    }

    return { totalOutstanding, overdueTotal, overdueCount };
  }, [outstandingBalances]);

  const toggleSummaryAmount = (key) =>
    setRevealedSummary((prev) => ({ ...prev, [key]: !prev[key] }));

  if (loading) {
    return (
      <section className="management-page outstanding-balance-page">
        <div className="contract-alert contract-alert--info">
          <Clock3 size={17} />
          <span>Loading outstanding balances…</span>
        </div>
      </section>
    );
  }

  return (
    <section className="management-page outstanding-balance-page">
      <Breadcrumb
        current="Outstanding Balance Tracking"
        parent="Accounts Receivable"
      />

      <div className="management-header">
        <div>
          <h2>Outstanding Balance Tracking</h2>
          <p>
            Track outstanding client balances and due amounts — every figure is
            derived from live invoice and payment records.
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
            title="Reload outstanding balances"
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

      <div className="vendor-summary-grid">
        <div
          className="vendor-summary-card"
          role="button"
          tabIndex={0}
          title="Click to show / hide amount"
          onClick={() => toggleSummaryAmount("outstanding")}
          onKeyDown={(e) => {
            if (e.key === "Enter") toggleSummaryAmount("outstanding");
          }}
        >
          <span className="vendor-summary-label">Total Outstanding</span>
          <strong
            className={`vendor-summary-amount ${
              revealedSummary.outstanding ? "overdue-amount" : ""
            }`}
          >
            {revealedSummary.outstanding ? money(totals.totalOutstanding) : "*"}
          </strong>
        </div>

        <div
          className="vendor-summary-card"
          role="button"
          tabIndex={0}
          title="Click to show / hide amount"
          onClick={() => toggleSummaryAmount("overdue")}
          onKeyDown={(e) => {
            if (e.key === "Enter") toggleSummaryAmount("overdue");
          }}
        >
          <span className="vendor-summary-label">Overdue Balance</span>
          <strong
            className={`vendor-summary-amount ${
              revealedSummary.overdue ? "overdue-amount" : ""
            }`}
          >
            {revealedSummary.overdue ? money(totals.overdueTotal) : "*"}
          </strong>
        </div>

        <div className="vendor-summary-card">
          <span className="vendor-summary-label">Overdue Invoices</span>
          <strong className="vendor-summary-amount overdue-amount">
            {totals.overdueCount}
          </strong>
        </div>

        <div className="vendor-summary-card">
          <span className="vendor-summary-label">Invoices Tracked</span>
          <strong className="vendor-summary-amount total-payable-amount">
            {outstandingBalances.length}
          </strong>
        </div>
      </div>

      <div className="status-legend">
        {STATUS_ORDER.map((status) => {
          const count = outstandingBalances.filter(
            (item) => item.status === status
          ).length;
          return (
            <span key={status} className={`status-badge ${statusSlug(status)}`}>
              {status} <b>{count}</b>
            </span>
          );
        })}
      </div>

      <div className="vendor-toolbar">
        <div className="search-box vendor-search">
          <span>⌕</span>
          <input
            placeholder="Search invoice number or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="vendor-toolbar-controls">
          <select
            className="vendor-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option>All Status</option>
            {STATUS_ORDER.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <section className="vendor-record-panel">
        <div className="vendor-record-heading">
          <h3>Outstanding Balances ({filtered.length})</h3>
        </div>

        <div className="table-card vendor-table-card">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Invoice Date</th>
                <th>Due Date</th>
                <th>Invoice Amount</th>
                <th>Amount Paid</th>
                <th>Outstanding Balance</th>
                <th>Days Overdue</th>
                <th>Aging</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((item) => (
                  <tr key={item.id ?? item.invoice_number}>
                    <td className="link-cell">{item.invoice_number}</td>
                    <td className="strong-cell">{item.client_name}</td>
                    <td>{item.invoice_date || "—"}</td>
                    <td>{item.due_date || "—"}</td>
                    <td className="money-cell">{money(item.invoice_amount)}</td>
                    <td className="money-cell">{money(item.amount_paid)}</td>
                    <td className="money-cell">
                      {money(item.outstanding_balance)}
                    </td>
                    <td
                      className={
                        Number(item.days_overdue || 0) > 0 ? "red-text" : ""
                      }
                    >
                      {Number(item.days_overdue || 0)}
                    </td>
                    <td>{item.aging || "—"}</td>
                    <td>
                      <span className={`status-badge ${statusSlug(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="empty">
                    No outstanding balances found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

export default OutstandingBalancePage;

