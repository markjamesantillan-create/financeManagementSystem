import React, { useEffect, useState } from "react";
import {
  Printer,
  FileText,
  Eye,
  CheckCircle2,
  X,
  ArrowRight,
} from "lucide-react";

// Same convention as the other Accounts Receivable pages: reach the Node
// backend (Backend/server.js) through VITE_API_URL when it is deployed, and fall
// back to the Vite proxy (/api -> http://127.0.0.1:3001) in local dev.
const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

const paymentStatusOrder = [
  "Recorded",
  "Pending Verification",
  "Verified",
  "Cancelled",
];

const paymentStatusStyle = (status) => {
  switch (status) {
    case "Verified":
      return {
        background: "#DCFCE7",
        color: "#166534",
      };
    case "Pending Verification":
      return {
        background: "#FEF3C7",
        color: "#92400E",
      };
    case "Cancelled":
      return {
        background: "#FEE2E2",
        color: "#991B1B",
      };
    case "Recorded":
    default:
      return {
        background: "#DBEAFE",
        color: "#1D4ED8",
      };
  }
};

const money = (value) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const Breadcrumb = ({ current, parent }) => (
  <div className="breadcrumb">
    <span>{parent}</span>
    <span> / </span>
    <strong>{current}</strong>
  </div>
);

const fetchPaymentsFromApi = async () => {
  try {
    // Same documented feed the Client Payment History page reads, so both
    // pages always show the same payments-table records.
    const response = await fetch(`${API_BASE}/api/payments/history`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const payload = await response.json();
    if (Array.isArray(payload)) return payload;
    return payload.success ? payload.data : null;
  } catch (error) {
    console.error("Failed to fetch payments from API:", error);
    return null;
  }
};

const fetchPaymentSummaryFromApi = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/payments/summary`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.success ? payload.data : null;
  } catch (error) {
    console.error("Failed to fetch payment summary from API:", error);
    return null;
  }
};

const fetchPaymentAvailableContracts = async () => {
  try {
    const response = await fetch(
      `${API_BASE}/api/payments/available-contracts`,
      {
        headers: { Accept: "application/json" },
      }
    );
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.success ? payload.data : null;
  } catch (error) {
    console.error("Failed to fetch available contracts from API:", error);
    return null;
  }
};

const createPaymentViaApi = async (payload) => {
  try {
    const response = await fetch(`${API_BASE}/api/payments`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return response.ok && data.success ? data.data : null;
  } catch (error) {
    console.error("Failed to create payment via API:", error);
    return null;
  }
};

const verifyPaymentViaApi = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/api/payments/${id}/verify`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    return response.ok && data.success ? data.data : null;
  } catch (error) {
    console.error("Failed to verify payment via API:", error);
    return null;
  }
};

const cancelPaymentViaApi = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/api/payments/${id}/cancel`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    return response.ok && data.success ? data.data : null;
  } catch (error) {
    console.error("Failed to cancel payment via API:", error);
    return null;
  }
};

// Maps one payments-table record (GET /api/payments/history) onto the field
// names this page renders. Every value — Payment ID, client, invoice, amounts,
// status — comes from the database; nothing is invented in the browser.
// `id` is the human-readable Payment ID (payments.payment_no, e.g. PAY-AR-003)
// because that is what the page shows and what the audit trail records, while
// `dbId` is the numeric primary key the API uses for verify/cancel.
const mapApiPayment = (payment) => ({
  ...payment,
  id: payment.payment_id ?? payment.paymentId ?? payment.id,
  dbId: payment.id,
  client: payment.client_name ?? payment.clientName ?? "—",
  contract: payment.contract_id ?? payment.contractNo ?? "—",
  invoice: payment.invoice_number ?? payment.invoiceNo ?? "—",
  paymentDate: payment.payment_date
    ? new Date(payment.payment_date).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : payment.paymentDate || "—",
  amountDue: Number(
    payment.amount_due ?? payment.amountDue ?? payment.total_amount ?? 0
  ),
  amountPaid: Number(payment.amount_paid ?? payment.amountPaid ?? 0),
  balance: Number(
    payment.remaining_balance ??
      payment.balance ??
      Number(payment.amount_due ?? payment.amountDue ?? 0) -
        Number(payment.amount_paid ?? payment.amountPaid ?? 0)
  ),
  paymentMethod: payment.payment_method ?? payment.paymentMethod ?? "—",
  bankAccount: payment.bank_account ?? payment.bankAccount ?? "—",
  referenceNo: payment.reference_number ?? payment.referenceNo ?? "",
  status: payment.status ?? "Recorded",
  notes: payment.remarks ?? payment.notes ?? "—",
  document: payment.supporting_document ?? payment.document ?? "—",
  preparedBy: payment.prepared_by ?? payment.preparedBy ?? "Finance Staff",
  verifiedBy: payment.verified_by ?? payment.verifiedBy ?? "",
});

function PaymentRecordingPage({ onAudit, navigate }) {
  // No `records` prop and no seed array: every row comes from the payments table
  // through GET /api/payments/history, so React keeps no copy of the data.
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [availableContracts, setAvailableContracts] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [search, setSearch] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [revealedSummaryAmounts, setRevealedSummaryAmounts] = useState({});
  const [revealedAmounts, setRevealedAmounts] = useState({});
  const [revealedReferences, setRevealedReferences] = useState({});
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    client: "",
    contract: "",
    invoice: "",
    amountDue: 0,
    amountPaid: 0,
    paymentMethod: "Bank Transfer",
    bankAccount: "",
    referenceNo: "",
    notes: "",
    document: null,
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [data, summaryData, contractsData] = await Promise.all([
        fetchPaymentsFromApi(),
        fetchPaymentSummaryFromApi(),
        fetchPaymentAvailableContracts(),
      ]);

      if (cancelled) return;

      if (Array.isArray(data)) {
        // Rows are the payments table's own records (GET /api/payments/history).
        const mapped = data.map(mapApiPayment);

        setPayments(mapped);
        setSelectedPayment(mapped[0] || null);
        // The table renders its own "No payment records found." row when the
        // payments table is empty, so only a failed request warns here.
        setLoadError(null);
      } else {
        setLoadError(
          "Could not load the payment records from the backend. Use Refresh to try again."
        );
      }

      if (summaryData) setSummary(summaryData);
      if (Array.isArray(contractsData)) {
        setAvailableContracts(contractsData);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Re-reads the payments table (GET /api/payments/history) after a write, so the
  // page shows the stored record — including the Payment ID and Official Receipt
  // No. the backend assigns — instead of a value invented in the browser.
  const refreshPayments = async (selectId) => {
    const [data, summaryData] = await Promise.all([
      fetchPaymentsFromApi(),
      fetchPaymentSummaryFromApi(),
    ]);

    if (Array.isArray(data)) {
      const mapped = data.map(mapApiPayment);

      setPayments(mapped);
      setSelectedPayment((prev) => {
        const wanted = selectId ?? prev?.id;

        return (
          mapped.find((payment) => payment.id === wanted) || mapped[0] || null
        );
      });
    }

    if (summaryData) setSummary(summaryData);
  };

  const toggleAmount = (id) => {
    setRevealedAmounts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleSummaryAmount = (id) => {
    setRevealedSummaryAmounts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleReference = (id) => {
    setRevealedReferences((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const maskReference = (reference) => {
    const value = String(reference || "");
    const separatorIndex = value.indexOf("-");

    return separatorIndex > -1
      ? `${value.slice(0, separatorIndex + 1)}${"*".repeat(value.length - separatorIndex - 1)}`
      : "*".repeat(value.length);
  };

  const filtered = payments.filter((p) => {
    const matchStatus =
      filterStatus === "All Status" || p.status === filterStatus;

    const searchText = [
      p.id,
      p.client,
      p.invoice,
      p.referenceNo,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchSearch =
      !search || searchText.includes(search.toLowerCase());

    return matchStatus && matchSearch;
  });

  const totalReceived =
    summary?.total_payments ??
    payments.reduce(
      (sum, p) => sum + Number(p.amountPaid || 0),
      0
    );

  const totalThisMonth =
    summary?.payments_this_month ??
    payments
      .filter((p) => {
        const d = new Date(p.paymentDate);
        const now = new Date();

        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce(
        (sum, p) => sum + Number(p.amountPaid || 0),
        0
      );

  const pendingVerification =
    summary?.pending_verification ??
    payments
      .filter((p) => p.status === "Pending Verification")
      .reduce(
        (sum, p) => sum + Number(p.amountPaid || 0),
        0
      );

  const sb = (status) => {
    const s = paymentStatusStyle(status);

    return (
      <span
        style={{
          background: s.background,
          color: s.color,
          padding: "3px 8px",
          borderRadius: "4px",
          fontSize: "11px",
          fontWeight: 600,
          display: "inline-block",
        }}
      >
        {status}
      </span>
    );
  };

  const handleSave = async () => {
    const errors = {};

    if (!form.client) errors.client = "Client required.";
    if (!form.invoice) errors.invoice = "Invoice required.";

    if (!form.amountDue || form.amountDue <= 0) {
      errors.amountDue = "Valid amount due required.";
    }

    if (!form.amountPaid || form.amountPaid <= 0) {
      errors.amountPaid = "Valid amount paid required.";
    }

    if (Number(form.amountPaid) > Number(form.amountDue)) {
      errors.amountPaid = "Cannot exceed amount due.";
    }

    if (!form.referenceNo) {
      errors.referenceNo = "Reference number required.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    // The Payment ID (PAY-AR-###) is assigned by the backend from the payments
    // table, so it is never built in the browser.

    const createdPayment = await createPaymentViaApi({
      client_id: form.client,
      contract_id: form.contract,
      invoice_id: form.invoice,
      payment_date: new Date().toISOString().slice(0, 10),
      amount_due: Number(form.amountDue),
      amount_paid: Number(form.amountPaid),
      remaining_balance:
        Number(form.amountDue) - Number(form.amountPaid),
      payment_method: form.paymentMethod,
      bank_account: form.bankAccount,
      reference_number: form.referenceNo,
      status: "Recorded",
      notes: form.notes,
      supporting_document: form.document
        ? form.document.name
        : null,
      prepared_by: "Finance Staff",
    });

    if (!createdPayment) {
      alert("Failed to save payment to the backend.");
      return;
    }

    setShowForm(false);

    setForm({
      client: "",
      contract: "",
      invoice: "",
      amountDue: 0,
      amountPaid: 0,
      paymentMethod: "Bank Transfer",
      bankAccount: "",
      referenceNo: "",
      notes: "",
      document: null,
    });

    // Re-read the payments table so the new row shows the stored record (and the
    // Payment ID the backend assigned) instead of a locally assembled object.
    await refreshPayments(createdPayment.payment_id);

    onAudit?.(
      `Recorded payment ${createdPayment.payment_id}`,
      createdPayment.payment_id
    );
  };

  const handleVerify = async (p) => {
    if (!window.confirm(`Verify ${p.id}?`)) return;

    // The API takes the numeric key; the row's display id is the Payment ID.
    const verified = await verifyPaymentViaApi(p.dbId ?? p.id);

    if (!verified) {
      alert("Failed to verify payment on the backend.");
      return;
    }

    // Re-read the table so the row shows the stored Verified status. Official
    // Receipt Generation is a separate step and assigns the receipt number.
    await refreshPayments(verified.payment_id ?? p.id);

    onAudit?.(`Verified ${p.id}`);
  };

  const handleCancel = async (p) => {
    if (!window.confirm(`Cancel ${p.id}?`)) return;

    const cancelled = await cancelPaymentViaApi(p.dbId ?? p.id);

    if (!cancelled) {
      alert("Failed to cancel the payment on the backend.");
      return;
    }

    await refreshPayments(cancelled.payment_id ?? p.id);

    onAudit?.(`Cancelled ${p.id}`);
  };

  const handleUpdateBalance = (p) => {
    if (navigate) {
      navigate("Client Account Monitoring");
    }

    onAudit?.(`Balance updated for ${p.client}`, p.id);
  };

  const handlePrint = (p) => {
    if (!p) return;

    const w = window.open("", "_blank");

    if (!w) {
      alert("Please allow pop-ups to print the payment receipt.");
      return;
    }

    w.document.write(`
      <html>
        <head>
          <title>${p.id}</title>
        </head>
        <body style="font-family:Arial;padding:40px">
          <h1>PRIMEPOWER - Payment Receipt</h1>
          <hr/>
          <p><b>Payment ID:</b> ${p.id}</p>
          <p><b>Client:</b> ${p.client}</p>
          <p><b>Contract:</b> ${p.contract}</p>
          <p><b>Invoice:</b> ${p.invoice}</p>
          <p><b>Payment Date:</b> ${p.paymentDate}</p>
          <p><b>Amount Due:</b> ${money(p.amountDue)}</p>
          <p><b>Amount Paid:</b> ${money(p.amountPaid)}</p>
          <p><b>Balance:</b> ${money(p.balance)}</p>
          <p><b>Payment Method:</b> ${p.paymentMethod}</p>
          <p><b>Bank Account:</b> ${p.bankAccount}</p>
          <p><b>Reference No.:</b> ${p.referenceNo}</p>
          <p><b>Status:</b> ${p.status}</p>
          <p><b>Notes:</b> ${p.notes}</p>
          <script>
            window.print();
          </script>
        </body>
      </html>
    `);

    w.document.close();
  };

  if (loading) {
    return (
      <section className="management-page payment-recording-page">
        <div className="data-warning">
          Loading payment records...
        </div>
      </section>
    );
  }

  return (
    <section className="management-page payment-recording-page">
      <Breadcrumb
        current="Payment Recording"
        parent="Accounts Receivable"
      />

      {loadError && (
        <div className="data-warning">{loadError}</div>
      )}

      <div className="management-header">
        <div>
          <h2>Payment Recording</h2>
          <p>
            Record and track payments received from clients.
          </p>
        </div>

        <div className="management-actions">
          <button
            className="light-button"
            onClick={() => window.print()}
          >
            <Printer size={15} /> Print
          </button>

          <button
            className="primary-button"
            onClick={() => setShowForm(true)}
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
          title="Click to show or hide amount"
          onClick={() => toggleSummaryAmount("totalReceived")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggleSummaryAmount("totalReceived");
            }
          }}
        >
          <span className="vendor-summary-label">
            Total Payments Received
          </span>
          <strong className="vendor-summary-amount">
            {revealedSummaryAmounts.totalReceived ? money(totalReceived) : "*"}
          </strong>
        </div>

        <div
          className="vendor-summary-card"
          role="button"
          tabIndex={0}
          title="Click to show or hide amount"
          onClick={() => toggleSummaryAmount("thisMonth")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggleSummaryAmount("thisMonth");
            }
          }}
        >
          <span className="vendor-summary-label">
            Payments This Month
          </span>
          <strong className="vendor-summary-amount">
            {revealedSummaryAmounts.thisMonth ? money(totalThisMonth) : "*"}
          </strong>
        </div>

        <div
          className="vendor-summary-card"
          role="button"
          tabIndex={0}
          title="Click to show or hide amount"
          onClick={() => toggleSummaryAmount("pendingVerification")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggleSummaryAmount("pendingVerification");
            }
          }}
        >
          <span className="vendor-summary-label">
            Pending Verification
          </span>
          <strong
            className="vendor-summary-amount"
            style={{ color: "#92400E" }}
          >
            {revealedSummaryAmounts.pendingVerification
              ? money(pendingVerification)
              : "*"}
          </strong>
        </div>

        <div className="vendor-summary-card">
          <span className="vendor-summary-label">
            Total Recorded Payments
          </span>
          <strong className="vendor-summary-amount">
            {payments.length}
          </strong>
        </div>
      </div>

      <div className="contract-toolbar">
        <div className="search-box contract-search">
          <span>🔍</span>
          <input
            placeholder="Search payment ID, client, invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="contract-toolbar-controls">
          <select
            className="contract-select"
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value)
            }
          >
            <option value="All Status">All Status</option>

            {paymentStatusOrder.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Client</th>
              <th>Invoice</th>
              <th>Payment Date</th>
              <th>Amount Due</th>
              <th>Amount Paid</th>
              <th>Balance</th>
              <th>Method</th>
              <th>Reference No.</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length ? (
              filtered.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelectedPayment(p)}
                  className={
                    selectedPayment?.id === p.id
                      ? "selectedrow"
                      : ""
                  }
                >
                  <td className="link-cell">{p.id}</td>

                  <td className="strong-cell">
                    {p.client}
                  </td>

                  <td>{p.invoice}</td>

                  <td>{p.paymentDate}</td>

                  <td
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAmount(p.id);
                    }}
                    title={
                      revealedAmounts[p.id]
                        ? "Click to hide"
                        : "Click to reveal"
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {revealedAmounts[p.id]
                      ? money(p.amountDue)
                      : "*"}
                  </td>

                  <td
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAmount(p.id);
                    }}
                    title={
                      revealedAmounts[p.id]
                        ? "Click to hide"
                        : "Click to reveal"
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {revealedAmounts[p.id]
                      ? money(p.amountPaid)
                      : "*"}
                  </td>

                  <td
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAmount(p.id);
                    }}
                    title={
                      revealedAmounts[p.id]
                        ? "Click to hide"
                        : "Click to reveal"
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {revealedAmounts[p.id]
                      ? money(p.balance)
                      : "*"}
                  </td>

                  <td>{p.paymentMethod}</td>

                  <td>{p.referenceNo}</td>

                  <td>{sb(p.status)}</td>

                  <td>
                    <div className="row-actions">
                      <button
                        className="row-action-btn"
                        title="View"
                        aria-label={`View ${p.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPayment(p);
                        }}
                      >
                        <Eye size={14} aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        className="row-action-btn"
                        title="Verify"
                        aria-label={`Verify ${p.id}`}
                        disabled={false}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVerify(p);
                        }}
                      >
                        <CheckCircle2 size={14} aria-hidden="true" />
                      </button>

                      <button
                        className="row-action-btn"
                        title="Print"
                        aria-label={`Print ${p.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrint(p);
                        }}
                      >
                        <Printer size={14} aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        className="row-action-btn"
                        title="Cancel"
                        aria-label={`Cancel ${p.id}`}
                        disabled={false}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel(p);
                        }}
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} className="empty">
                  No payment records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedPayment && (
        <section className="vendor-detail-panel">
          <div className="vendor-detail-header">
            <div>
              <span className="vendor-detail-kicker">
                Payment Details
              </span>
              <h3>{selectedPayment.id}</h3>
            </div>

            <button
              className="light-button"
              onClick={() => setSelectedPayment(null)}
            >
              <X size={15} /> Close
            </button>
          </div>

          <div className="vendor-detail-grid">
            <div className="vendor-detail-block">
              <h4>Payment Information</h4>

              <div className="vendor-detail-list">
                <div>
                  <span>Payment ID</span>
                  <b>{selectedPayment.id}</b>
                </div>

                <div>
                  <span>Client</span>
                  <b>{selectedPayment.client}</b>
                </div>

                <div>
                  <span>Contract</span>
                  <b>{selectedPayment.contract}</b>
                </div>

                <div>
                  <span>Invoice</span>
                  <b>{selectedPayment.invoice}</b>
                </div>

                <div>
                  <span>Payment Date</span>
                  <b>{selectedPayment.paymentDate}</b>
                </div>
              </div>
            </div>

            <div className="vendor-detail-block">
              <h4>Amount Summary</h4>

              <div className="vendor-detail-list">
                <div>
                  <span>Amount Due</span>
                  <b
                    className="detail-masked-amount"
                    onClick={() => toggleAmount(`${selectedPayment.id}-due`)}
                    title={
                      revealedAmounts[`${selectedPayment.id}-due`]
                        ? "Click to hide amount"
                        : "Click to reveal amount"
                    }
                  >
                    {revealedAmounts[`${selectedPayment.id}-due`]
                      ? money(selectedPayment.amountDue)
                      : "*"}
                  </b>
                </div>

                <div>
                  <span>Amount Paid</span>
                  <b
                    className="detail-masked-amount"
                    onClick={() => toggleAmount(`${selectedPayment.id}-paid`)}
                    title={
                      revealedAmounts[`${selectedPayment.id}-paid`]
                        ? "Click to hide amount"
                        : "Click to reveal amount"
                    }
                  >
                    {revealedAmounts[`${selectedPayment.id}-paid`]
                      ? money(selectedPayment.amountPaid)
                      : "*"}
                  </b>
                </div>

                <div>
                  <span>Remaining Balance</span>
                  <b
                    className="detail-masked-amount"
                    style={{
                      color:
                        Number(selectedPayment.balance) > 0
                          ? "#DC2626"
                          : "#16A34A",
                    }}
                    onClick={() =>
                      toggleAmount(`${selectedPayment.id}-balance`)
                    }
                    title={
                      revealedAmounts[`${selectedPayment.id}-balance`]
                        ? "Click to hide amount"
                        : "Click to reveal amount"
                    }
                  >
                    {revealedAmounts[`${selectedPayment.id}-balance`]
                      ? money(selectedPayment.balance)
                      : "*"}
                  </b>
                </div>
              </div>
            </div>

            <div className="vendor-detail-block">
              <h4>Payment Method</h4>

              <div className="vendor-detail-list">
                <div>
                  <span>Method</span>
                  <b>{selectedPayment.paymentMethod}</b>
                </div>

                <div>
                  <span>Bank Account</span>
                  <b>{selectedPayment.bankAccount}</b>
                </div>

                <div>
                  <span>Reference No.</span>
                  <b
                    className="detail-masked-amount"
                    onClick={() => toggleReference(selectedPayment.id)}
                    title={
                      revealedReferences[selectedPayment.id]
                        ? "Click to hide reference number"
                        : "Click to reveal reference number"
                    }
                  >
                    {revealedReferences[selectedPayment.id]
                      ? selectedPayment.referenceNo
                      : maskReference(selectedPayment.referenceNo)}
                  </b>
                </div>

                <div>
                  <span>Status</span>
                  {sb(selectedPayment.status)}
                </div>
              </div>
            </div>

            <div className="vendor-detail-block">
              <h4>Additional Info</h4>

              <div className="vendor-detail-list">
                <div>
                  <span>Notes</span>
                  <b>{selectedPayment.notes}</b>
                </div>

                <div>
                  <span>Supporting Document</span>
                  <b>{selectedPayment.document}</b>
                </div>

                <div>
                  <span>Prepared By</span>
                  <b>{selectedPayment.preparedBy}</b>
                </div>

                {selectedPayment.verifiedBy && (
                  <div>
                    <span>Verified By</span>
                    <b>{selectedPayment.verifiedBy}</b>
                  </div>
                )}
              </div>
            </div>

            <div className="vendor-detail-block">
              <h4>Actions</h4>

              <div className="invoice-detail-actions">
                <button
                  className="light-button"
                  onClick={() =>
                    navigate?.("Client Contract Management")
                  }
                >
                  <FileText size={15} />
                  View Contract
                </button>

                {(selectedPayment.status === "Recorded" ||
                  selectedPayment.status ===
                    "Pending Verification") && (
                  <>
                    <button
                      className="light-button"
                      onClick={() =>
                        handleVerify(selectedPayment)
                      }
                    >
                      <CheckCircle2 size={15} />
                      Verify
                    </button>

                    <button
                      className="light-button"
                      onClick={() =>
                        handleUpdateBalance(selectedPayment)
                      }
                    >
                      <ArrowRight size={15} />
                      Update Balance
                    </button>
                  </>
                )}

                <button
                  className="light-button"
                  onClick={() =>
                    handlePrint(selectedPayment)
                  }
                >
                  <Printer size={15} />
                  Print
                </button>

                <button
                  className="light-button"
                  onClick={() =>
                    handleCancel(selectedPayment)
                  }
                >
                  <X size={15} />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <span className="vendor-detail-kicker">
                  Accounts Receivable
                </span>
                <h3>Record Payment</h3>
              </div>

              <button
                className="light-button"
                onClick={() => setShowForm(false)}
              >
                <X size={15} />
              </button>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Client *</label>

                <input
                  value={form.client}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      client: e.target.value,
                    })
                  }
                  placeholder="Enter client"
                />

                {formErrors.client && (
                  <small className="form-error">
                    {formErrors.client}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Contract</label>

                <select
                  value={form.contract}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      contract: e.target.value,
                    })
                  }
                >
                  <option value="">
                    Select contract
                  </option>

                  {availableContracts.map((contract) => (
                    <option
                      key={contract.id}
                      value={contract.id}
                    >
                      {contract.id} - {contract.client}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Invoice *</label>

                <input
                  value={form.invoice}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      invoice: e.target.value,
                    })
                  }
                  placeholder="INV-001"
                />

                {formErrors.invoice && (
                  <small className="form-error">
                    {formErrors.invoice}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Amount Due *</label>

                <input
                  type="number"
                  value={form.amountDue}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      amountDue: Number(e.target.value),
                    })
                  }
                />

                {formErrors.amountDue && (
                  <small className="form-error">
                    {formErrors.amountDue}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Amount Paid *</label>

                <input
                  type="number"
                  value={form.amountPaid}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      amountPaid: Number(e.target.value),
                    })
                  }
                />

                {formErrors.amountPaid && (
                  <small className="form-error">
                    {formErrors.amountPaid}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Payment Method</label>

                <select
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      paymentMethod: e.target.value,
                    })
                  }
                >
                  <option>Bank Transfer</option>
                  <option>Check</option>
                  <option>Cash</option>
                  <option>Bank Deposit</option>
                </select>
              </div>

              <div className="form-group">
                <label>Bank Account</label>

                <input
                  value={form.bankAccount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bankAccount: e.target.value,
                    })
                  }
                  placeholder="BDO / BPI / Other"
                />
              </div>

              <div className="form-group">
                <label>Reference Number *</label>

                <input
                  value={form.referenceNo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      referenceNo: e.target.value,
                    })
                  }
                  placeholder="Reference number"
                />

                {formErrors.referenceNo && (
                  <small className="form-error">
                    {formErrors.referenceNo}
                  </small>
                )}
              </div>

              <div className="form-group full-width">
                <label>Notes</label>

                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Additional notes"
                  rows={3}
                />
              </div>

              <div className="form-group full-width">
                <label>Supporting Document</label>

                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      document:
                        e.target.files?.[0] || null,
                    })
                  }
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="light-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={handleSave}
              >
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default PaymentRecordingPage;
