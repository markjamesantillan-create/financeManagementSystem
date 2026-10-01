import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Printer,
  RotateCcw,
  Clock3,
  AlertTriangle,
  Eye,
  CheckCircle2,
  XCircle,
  X,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

// Collection Scheduling (Collection Management) talks to the same Node backend
// (Backend/server.js) as the other Account Receivable / Collection pages.
// VITE_API_URL is the deployed-backend variable; when it is unset the empty
// fallback keeps local dev on the Vite proxy (/api -> http://127.0.0.1:3001),
// exactly like its sibling pages.
const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

// Collection statuses, in the order the backend supports them.
const COLLECTION_STATUS_ORDER = [
  "Scheduled",
  "In Progress",
  "Due Today",
  "Overdue",
  "Rescheduled",
  "Collected",
  "Cancelled",
];

// Statuses a user can pick in the dialog. "Due Today" and "Overdue" are derived
// from the scheduled collection date by the backend, so they are never offered.
const SETTABLE_STATUSES = [
  "Scheduled",
  "In Progress",
  "Rescheduled",
  "Cancelled",
];

// Statuses that still need collection work (the "open" cards).
const OPEN_STATUSES = [
  "Scheduled",
  "In Progress",
  "Due Today",
  "Overdue",
  "Rescheduled",
];

// Used only while the backend option lists are unavailable.
const FALLBACK_METHODS = ["Bank Transfer", "Cash", "Check", "Online Payment", "GCash"];
const FALLBACK_PRIORITIES = ["High", "Medium", "Low"];

const money = (value) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// "Due Today" -> "due-today", "In Progress" -> "in-progress" (the .status-badge
// classes index.css defines).
const statusSlug = (status) =>
  String(status || "unknown").toLowerCase().trim().replace(/\s+/g, "-");

// "High" -> "high" (the .priority-badge classes index.css defines).
const prioritySlug = (priority) => String(priority || "Medium").toLowerCase().trim();

// Keeps optional fields readable instead of printing "null"/"undefined".
const display = (value) =>
  value === null || value === undefined || value === "" ? "—" : value;

// Local "YYYY-MM-DD" (never via toISOString, which would shift the day).
const todayYmd = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

// Shift a "YYYY-MM-DD" date by whole days, matching the backend's helper.
const addDaysYmd = (ymd, days) => {
  const base = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(base.getTime())) return "";
  base.setDate(base.getDate() + days);
  const month = String(base.getMonth() + 1).padStart(2, "0");
  const day = String(base.getDate()).padStart(2, "0");
  return `${base.getFullYear()}-${month}-${day}`;
};

// Every peso figure is hidden as "*" until its own cell is clicked — each amount
// has a separate reveal key, so clicking one never reveals the rest.
const MaskedAmount = ({ id, value, revealed, onToggle, className = "" }) => {
  const isOpen = Boolean(revealed[id]);
  return (
    <span
      className={`masked-amount ${className}`.trim()}
      role="button"
      tabIndex={0}
      title={isOpen ? "Click to hide amount" : "Click to reveal amount"}
      onClick={(event) => {
        event.stopPropagation();
        onToggle(id);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle(id);
        }
      }}
    >
      {isOpen ? money(value) : "*"}
    </span>
  );
};

const Breadcrumb = ({ parent, current }) => (
  <div className="breadcrumb">
    <span>{parent}</span>
    <span> / </span>
    <strong>{current}</strong>
  </div>
);

// Why a request failed, kept so the page reports the real cause instead of
// always blaming the connection:
//   "unreachable" -> the API never answered (backend down, wrong port)
//   "server"      -> the API answered with an error status, message kept
//   "shape"       -> the API answered 2xx but not with the documented shape
const requestJson = async (path) => {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    console.error(`Failed to reach ${path}:`, error);
    return { ok: false, reason: "unreachable", status: 0, message: null };
  }

  // A missing/non-JSON body must not be reported as a parse crash: in local dev
  // the Vite proxy answers with a bare, bodyless 500 when the backend is down.
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      ok: false,
      reason: "server",
      status: response.status,
      message: payload?.message || null,
    };
  }

  return { ok: true, reason: null, status: response.status, payload };
};

// A failure is described from what actually happened, never assumed to be a
// connection problem. When the backend sent its own message (e.g. a database
// error) that message is shown, because it is the only real explanation.
const failureMessage = (path, result) => {
  if (result.reason === "unreachable") {
    return `The backend did not answer ${path}. Start it with "npm start" in the Backend folder, then use Refresh to try again.`;
  }
  if (result.message) {
    return `The backend rejected ${path} (HTTP ${result.status}): ${result.message}`;
  }
  return `The backend answered ${path} with an error (HTTP ${result.status}) and no message, which is what the local dev proxy returns when the backend is not running. Start it with "npm start" in the Backend folder, then use Refresh to try again.`;
};

// Returns { value, error }: value is the array, error the reason it is missing.
// An empty array is a real value, not a failure.
const fetchList = async (path) => {
  const result = await requestJson(path);
  if (!result.ok) return { value: null, error: failureMessage(path, result) };

  const payload = result.payload;
  if (Array.isArray(payload)) return { value: payload, error: null };
  if (Array.isArray(payload?.data)) return { value: payload.data, error: null };
  return {
    value: null,
    error: `The backend answered ${path} with an unexpected response shape.`,
  };
};

// Returns { value, error }: payload.data (object, or array for the invoice list).
const fetchObject = async (path) => {
  const result = await requestJson(path);
  if (!result.ok) return { value: null, error: failureMessage(path, result) };

  const payload = result.payload;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return {
      value: payload.data !== undefined && payload.data !== null ? payload.data : payload,
      error: null,
    };
  }
  return {
    value: null,
    error: `The backend answered ${path} with an unexpected response shape.`,
  };
};

/**
 * POST / PUT / DELETE helper. Returns { ok, payload } so the page can show the
 * backend's own message (e.g. "Invoice BILL-002 is already fully settled")
 * instead of a generic failure.
 */
const sendRequest = async (path, method, body) => {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    return { ok: response.ok && payload.success !== false, payload };
  } catch (error) {
    console.error(`Failed to ${method} ${path} on API:`, error);
    return { ok: false, payload: { message: "Could not reach the server. Please try again." } };
  }
};

/**
 * The whole page state in one round trip: the schedule feed, its card summary,
 * the toolbar option lists and the invoices a collection can be planned for.
 */
const fetchCollectionSchedulingData = async () => {
  const [rows, summaryPayload, filterPayload, invoicePayload] = await Promise.all([
    // collection_schedules table -> API -> React: the working list always comes
    // from the documented GET /api/collection-schedules feed, never from an
    // array kept in this file.
    fetchList("/api/collection-schedules"),
    fetchObject("/api/collection-schedules/summary"),
    fetchObject("/api/collection-schedules/filters"),
    // This endpoint answers { success, data: [...] }, so fetchObject hands back
    // the invoice array itself.
    fetchObject("/api/collection-schedules/outstanding-invoices"),
  ]);

  return {
    rows: rows.value ?? [],
    summaryPayload: summaryPayload.value,
    filterPayload: filterPayload.value,
    invoices: Array.isArray(invoicePayload.value) ? invoicePayload.value : [],
    // The schedule feed is the page, so only its own failure is reported. A
    // missing summary or option list only degrades the cards and the toolbar.
    error: rows.error,
  };
};

// Distinct, sorted option values — used only when the backend option list is
// unavailable, so the toolbar never renders empty selects.
const uniqueValues = (values) =>
  Array.from(new Set(values.filter((value) => value && value !== "—" && value !== "Unassigned"))).sort();

function CollectionSchedulingPage({ onAudit, navigate }) {
  // Every row comes from GET /api/collection-schedules (the collection_schedules
  // table) — the working list is never hard-coded in this component.
  const [schedules, setSchedules] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filterOptions, setFilterOptions] = useState(null);
  const [outstandingInvoices, setOutstandingInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [detail, setDetail] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  // New / edit schedule dialog, the status-change dialog and their errors.
  const [form, setForm] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [statusDialog, setStatusDialog] = useState(null);

  // Search + filters (status, client, collector, priority, method, date range).
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [filterClient, setFilterClient] = useState("All Clients");
  const [filterCollector, setFilterCollector] = useState("All Collectors");
  const [filterPriority, setFilterPriority] = useState("All Priorities");
  const [filterMethod, setFilterMethod] = useState("All Methods");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Per-cell amount masking: each amount stays "*" until its own cell is clicked.
  const [revealedAmounts, setRevealedAmounts] = useState({});
  const toggleAmount = (id) =>
    setRevealedAmounts((prev) => ({ ...prev, [id]: !prev[id] }));
  const maskable = (id, value) => (
    <MaskedAmount
      id={id}
      value={value}
      revealed={revealedAmounts}
      onToggle={toggleAmount}
    />
  );

  const showNotice = (message) => setNotice(message);

  const applyData = ({ rows, summaryPayload, filterPayload, invoices, error }) => {
    setSchedules(rows);
    setSummary(summaryPayload || null);
    setFilterOptions(filterPayload || null);
    setOutstandingInvoices(invoices);

    // An empty schedule list from a working API is not a failure — the table
    // renders its own "nothing scheduled yet" state. Only a real, explained
    // failure is reported, and it names what actually went wrong instead of
    // always telling the user to check their connection.
    setLoadError(error || null);
  };

  useEffect(() => {
    let active = true;

    (async () => {
      const data = await fetchCollectionSchedulingData();
      if (!active) return;
      applyData(data);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    setNotice(null);
    applyData(await fetchCollectionSchedulingData());
    setLoading(false);
    onAudit?.("Refreshed collection schedule", "Collection Scheduling");
  };

  // Card values: the backend summary when it is available, otherwise the same
  // totals derived from the rows on screen, so the cards are never blank.
  const summaryView = useMemo(() => {
    const today = todayYmd();
    const weekEnd = addDaysYmd(today, 6);
    const sum = (list) =>
      list.reduce((total, row) => total + Number(row.outstanding_amount || 0), 0);

    if (summary) {
      return {
        as_of: summary.as_of || today,
        week_end: summary.week_end || weekEnd,
        total_count: Number(summary.total_count || 0),
        total_scheduled_count: Number(summary.total_scheduled_count || 0),
        total_scheduled_amount: Number(summary.total_scheduled_amount || 0),
        due_today_count: Number(summary.due_today_count || 0),
        due_today_amount: Number(summary.due_today_amount || 0),
        overdue_count: Number(summary.overdue_count || 0),
        overdue_amount: Number(summary.overdue_amount || 0),
        this_week_count: Number(summary.this_week_count || 0),
        this_week_amount: Number(summary.this_week_amount || 0),
        collected_count: Number(summary.collected_count || 0),
        collected_amount: Number(summary.collected_amount || 0),
      };
    }

    const open = schedules.filter((row) => OPEN_STATUSES.includes(row.status));
    const dueToday = schedules.filter((row) => row.status === "Due Today");
    const overdue = schedules.filter((row) => row.status === "Overdue");
    const collected = schedules.filter((row) => row.status === "Collected");
    // "This week" = open collections planned between today and the next 7 days.
    const thisWeek = open.filter(
      (row) =>
        row.scheduled_collection_date &&
        row.scheduled_collection_date >= today &&
        row.scheduled_collection_date <= weekEnd
    );

    return {
      as_of: today,
      week_end: weekEnd,
      total_count: schedules.length,
      total_scheduled_count: open.length,
      total_scheduled_amount: sum(open),
      due_today_count: dueToday.length,
      due_today_amount: sum(dueToday),
      overdue_count: overdue.length,
      overdue_amount: sum(overdue),
      this_week_count: thisWeek.length,
      this_week_amount: sum(thisWeek),
      collected_count: collected.length,
      collected_amount: sum(collected),
    };
  }, [summary, schedules]);

  const clientOptions = useMemo(() => {
    if (filterOptions?.clients?.length) return filterOptions.clients;
    return uniqueValues(schedules.map((row) => row.client_name));
  }, [filterOptions, schedules]);

  const collectorOptions = useMemo(() => {
    if (filterOptions?.collectors?.length) return filterOptions.collectors;
    return uniqueValues(schedules.map((row) => row.assigned_collector));
  }, [filterOptions, schedules]);

  const methodOptions = useMemo(() => {
    if (filterOptions?.methods?.length) return filterOptions.methods;
    const used = uniqueValues(schedules.map((row) => row.collection_method));
    return used.length ? used : FALLBACK_METHODS;
  }, [filterOptions, schedules]);

  const priorityOptions = filterOptions?.priorities?.length
    ? filterOptions.priorities
    : FALLBACK_PRIORITIES;

  const statusOptions = filterOptions?.statuses?.length
    ? filterOptions.statuses
    : COLLECTION_STATUS_ORDER;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return schedules.filter((schedule) => {
      if (filterStatus !== "All Status" && schedule.status !== filterStatus) return false;
      if (filterClient !== "All Clients" && schedule.client_name !== filterClient) return false;
      if (filterCollector !== "All Collectors" && schedule.assigned_collector !== filterCollector) return false;
      if (filterPriority !== "All Priorities" && schedule.priority !== filterPriority) return false;
      if (filterMethod !== "All Methods" && schedule.collection_method !== filterMethod) return false;
      if (dateFrom && String(schedule.scheduled_collection_date || "") < dateFrom) return false;
      if (dateTo && String(schedule.scheduled_collection_date || "") > dateTo) return false;
      if (!query) return true;

      // Search by schedule ID, client, contract, invoice or collector.
      return [
        schedule.schedule_id,
        schedule.client_name,
        schedule.contract_id,
        schedule.invoice_no,
        schedule.assigned_collector,
        schedule.collection_method,
      ].some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [
    schedules,
    search,
    filterStatus,
    filterClient,
    filterCollector,
    filterPriority,
    filterMethod,
    dateFrom,
    dateTo,
  ]);

  const resetFilters = () => {
    setSearch("");
    setFilterStatus("All Status");
    setFilterClient("All Clients");
    setFilterCollector("All Collectors");
    setFilterPriority("All Priorities");
    setFilterMethod("All Methods");
    setDateFrom("");
    setDateTo("");
  };

  // New Collection Schedule — the invoice is picked from the outstanding invoices
  // the backend returns, so a plan is never built on typed-in values.
  const openNewSchedule = () => {
    setFormErrors({});
    setNotice(null);
    setForm({
      id: null,
      invoice_id: "",
      scheduled_collection_date: "",
      follow_up_date: "",
      collection_method: "Bank Transfer",
      assigned_collector: "",
      priority: "Medium",
      status: "Scheduled",
      notes: "",
    });
  };

  const openEditSchedule = (schedule) => {
    setOpenMenuId(null);
    setFormErrors({});
    setNotice(null);
    setForm({
      id: schedule.id,
      invoice_id: schedule.invoice_id ? String(schedule.invoice_id) : "",
      scheduled_collection_date: schedule.scheduled_collection_date || "",
      follow_up_date:
        schedule.follow_up_date && schedule.follow_up_date !== "—"
          ? schedule.follow_up_date
          : "",
      collection_method:
        schedule.collection_method !== "—" ? schedule.collection_method : "Bank Transfer",
      assigned_collector:
        schedule.assigned_collector !== "Unassigned" ? schedule.assigned_collector : "",
      priority: schedule.priority || "Medium",
      status: schedule.status || "Scheduled",
      notes: schedule.notes !== "—" ? schedule.notes : "",
    });
  };

  // Choosing an invoice pre-fills the plan the backend suggests for it (due date
  // or tomorrow, its urgency as priority and the day before as follow-up).
  const handleInvoiceChange = (invoiceReference) => {
    const invoice = outstandingInvoices.find(
      (row) => String(row.id) === String(invoiceReference)
    );

    setForm((prev) => ({
      ...prev,
      invoice_id: invoiceReference,
      scheduled_collection_date:
        invoice?.suggested_collection_date || prev.scheduled_collection_date,
      priority: invoice?.suggested_priority || prev.priority,
      follow_up_date: invoice?.suggested_collection_date
        ? addDaysYmd(invoice.suggested_collection_date, -1)
        : prev.follow_up_date,
    }));
  };

  const openDetail = async (schedule) => {
    setDetail({ loading: true, schedule, invoice: null, error: null });
    const { value: payload, error } = await fetchObject(
      `/api/collection-schedules/${schedule.id}`
    );

    if (!payload || !payload.schedule) {
      setDetail({
        loading: false,
        schedule,
        invoice: null,
        error: error || "The backend returned no details for this schedule.",
      });
      return;
    }

    setDetail({
      loading: false,
      schedule: payload.schedule,
      invoice: payload.invoice || null,
      error: null,
    });
  };

  const closeDetail = () => setDetail(null);

  const validateForm = () => {
    const errors = {};
    if (!form.id && !form.invoice_id) {
      errors.invoice_id = "Select the invoice to collect.";
    }
    if (!form.scheduled_collection_date) {
      errors.scheduled_collection_date = "Scheduled collection date is required.";
    }
    if (
      form.scheduled_collection_date &&
      form.follow_up_date &&
      form.follow_up_date > form.scheduled_collection_date
    ) {
      errors.follow_up_date = "The follow-up date cannot be after the collection date.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create (POST) or edit (PUT) a schedule. The client, contract, invoice and
  // outstanding amount are always taken from the invoice on the server side, so
  // the form only ever posts the plan itself.
  const handleSaveSchedule = async () => {
    if (!validateForm()) return;

    setSaving(true);
    const editing = Boolean(form.id);
    const payload = {
      invoice_id: form.invoice_id,
      scheduled_collection_date: form.scheduled_collection_date,
      follow_up_date: form.follow_up_date,
      collection_method: form.collection_method,
      assigned_collector: form.assigned_collector,
      priority: form.priority,
      ...(SETTABLE_STATUSES.includes(form.status) ? { status: form.status } : {}),
      notes: form.notes,
    };

    const { ok, payload: response } = editing
      ? await sendRequest(`/api/collection-schedules/${form.id}`, "PUT", payload)
      : await sendRequest("/api/collection-schedules", "POST", payload);

    setSaving(false);
    if (!ok) {
      showNotice(
        response?.message || "Could not save the collection schedule. Please try again."
      );
      return;
    }

    setForm(null);
    await handleRefresh();
    showNotice(response?.message || "Collection schedule saved.");
    onAudit?.(
      editing ? "Updated collection schedule" : "Created collection schedule",
      response?.data?.schedule_id || "Collection Scheduling"
    );
  };

  // Status dialog — Start Collection, Reschedule and Cancel. Rescheduling also
  // takes the new collection date, which the backend requires before a schedule
  // may be called Rescheduled. Collected is never a client-entered transition.
  const openStatusDialog = (schedule, status) => {
    setOpenMenuId(null);
    setNotice(null);
    setStatusDialog({
      schedule,
      status,
      scheduled_collection_date: schedule.scheduled_collection_date || todayYmd(),
      follow_up_date:
        schedule.follow_up_date && schedule.follow_up_date !== "—"
          ? schedule.follow_up_date
          : "",
      assigned_collector:
        schedule.assigned_collector !== "Unassigned" ? schedule.assigned_collector : "",
      notes: "",
      saving: false,
    });
  };

  const closeStatusDialog = () => setStatusDialog(null);

  const handleStatusSave = async () => {
    const dialog = statusDialog;
    if (!dialog) return;

    if (!dialog.scheduled_collection_date) {
      showNotice("A scheduled collection date is required.");
      return;
    }

    setStatusDialog({ ...dialog, saving: true });
    const { ok, payload } = await sendRequest(
      `/api/collection-schedules/${dialog.schedule.id}/status`,
      "PUT",
      {
        status: dialog.status,
        scheduled_collection_date: dialog.scheduled_collection_date,
        follow_up_date: dialog.follow_up_date,
        assigned_collector: dialog.assigned_collector,
        notes: dialog.notes,
      }
    );

    if (!ok) {
      setStatusDialog({ ...dialog, saving: false });
      showNotice(payload?.message || "Could not update the collection status. Please try again.");
      return;
    }

    setStatusDialog(null);
    await handleRefresh();
    showNotice(payload?.message || `${dialog.schedule.schedule_id} is now ${dialog.status}.`);
    onAudit?.(`Collection schedule ${dialog.status}`, dialog.schedule.schedule_id);
  };

  // Deleting removes the plan; cancelling (status dialog) keeps the record as an
  // audit trail, so the confirm text explains the difference.
  const handleDelete = async (schedule) => {
    setOpenMenuId(null);
    if (
      !window.confirm(
        `Remove ${schedule.schedule_id}? The collection plan for ${schedule.client_name} (${schedule.invoice_no}) is deleted and its invoice can be scheduled again. Use Cancel instead to keep the record.`
      )
    ) {
      return;
    }

    const { ok, payload } = await sendRequest(
      `/api/collection-schedules/${schedule.id}`,
      "DELETE"
    );

    if (!ok) {
      showNotice(payload?.message || `Could not remove ${schedule.schedule_id}. Please try again.`);
      return;
    }

    await handleRefresh();
    showNotice(payload?.message || `${schedule.schedule_id} was removed from the collection plan.`);
    onAudit?.("Removed collection schedule", schedule.schedule_id);
  };

  // Printable collection slip (same pop-up convention as Payment Recording and
  // Client Payment History).
  const handlePrint = (schedule) => {
    if (!schedule) return;

    const w = window.open("", "_blank");
    if (!w) {
      alert("Please allow pop-ups to print the collection schedule.");
      return;
    }

    w.document.write(`
      <html>
        <head><title>${schedule.schedule_id}</title></head>
        <body style="font-family:Arial;padding:40px">
          <h1>PRIMEPOWER - Collection Schedule</h1>
          <hr/>
          <p><b>Schedule ID:</b> ${display(schedule.schedule_id)}</p>
          <p><b>Client:</b> ${display(schedule.client_name)}</p>
          <p><b>Contract:</b> ${display(schedule.contract_id)}</p>
          <p><b>Invoice:</b> ${display(schedule.invoice_no)}</p>
          <p><b>Outstanding Amount:</b> ${money(schedule.outstanding_amount)}</p>
          <p><b>Invoice Due Date:</b> ${display(schedule.due_date)}</p>
          <p><b>Scheduled Collection Date:</b> ${display(schedule.scheduled_collection_date)}</p>
          <p><b>Follow-up Date:</b> ${display(schedule.follow_up_date)}</p>
          <p><b>Collection Method:</b> ${display(schedule.collection_method)}</p>
          <p><b>Assigned Collector:</b> ${display(schedule.assigned_collector)}</p>
          <p><b>Priority:</b> ${display(schedule.priority)}</p>
          <p><b>Status:</b> ${display(schedule.status)}</p>
          <p><b>Notes:</b> ${display(schedule.notes)}</p>
          <script>window.print();</script>
        </body>
      </html>
    `);

    w.document.close();
    onAudit?.("Printed collection schedule", schedule.schedule_id);
  };

  if (loading) {
    return (
      <section className="management-page collection-scheduling-page">
        <div className="contract-alert">
          <Clock3 size={17} />
          <span>Loading collection schedule…</span>
        </div>
      </section>
    );
  }

  return (
    <section className="management-page collection-scheduling-page">
      <Breadcrumb current="Collection Scheduling" parent="Collection Management" />

      {loadError && (
        <div className="contract-alert">
          <AlertTriangle size={17} />
          <span>{loadError}</span>
        </div>
      )}

      {notice && (
        <div className="contract-alert">
          <Clock3 size={17} />
          <span>{notice}</span>
        </div>
      )}

      <div className="management-header">
        <div>
          <h2>Collection Scheduling</h2>
          <p>
            Every collection plan in one working list — which client is being
            collected from, against which invoice and for how much, when the
            collection is planned, how it will be collected and who owns it. Due
            Today and Overdue follow the planned collection date automatically.
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
            title="Reload the latest collection schedule"
          >
            <RotateCcw size={15} /> Refresh
          </button>

          <button
            className="light-button"
            onClick={() => navigate?.("Payment Recording")}
            title="Record the money collected so the invoice balance is updated"
          >
            <CheckCircle2 size={15} /> Record Payment
          </button>

          <button
            className="primary-button"
            onClick={openNewSchedule}
            title="Plan a collection for an outstanding invoice"
          >
            <Plus size={15} /> New Collection Schedule
          </button>
        </div>
      </div>

      {/* 1. Summary cards — totals from GET /api/collection-schedules/summary */}
      <div className="vendor-summary-grid collection-summary-grid">
        <div className="vendor-summary-card">
          <span className="vendor-summary-label">Total Scheduled</span>
          <strong className="vendor-summary-amount total-payable-amount">
            {maskable("card-total", summaryView.total_scheduled_amount)}
          </strong>
          <small className="aging-card-count">
            {summaryView.total_scheduled_count} open of {summaryView.total_count} planned
          </small>
        </div>

        <div className="vendor-summary-card">
          <span className="vendor-summary-label">Due Today</span>
          <strong className="vendor-summary-amount pending-amount">
            {maskable("card-due-today", summaryView.due_today_amount)}
          </strong>
          <small className="aging-card-count">
            {summaryView.due_today_count} planned for {summaryView.as_of}
          </small>
        </div>

        <div className="vendor-summary-card">
          <span className="vendor-summary-label">Overdue</span>
          <strong className="vendor-summary-amount overdue-amount">
            {maskable("card-overdue", summaryView.overdue_amount)}
          </strong>
          <small className="aging-card-count">
            {summaryView.overdue_count} past the planned date
          </small>
        </div>

        <div className="vendor-summary-card">
          <span className="vendor-summary-label">This Week</span>
          <strong className="vendor-summary-amount collection-amount-this-week">
            {maskable("card-this-week", summaryView.this_week_amount)}
          </strong>
          <small className="aging-card-count">
            {summaryView.this_week_count} planned up to {summaryView.week_end}
          </small>
        </div>

        <div className="vendor-summary-card">
          <span className="vendor-summary-label">Collected</span>
          <strong className="vendor-summary-amount paid-amount">
            {maskable("card-collected", summaryView.collected_amount)}
          </strong>
          <small className="aging-card-count">
            {summaryView.collected_count} schedule
            {summaryView.collected_count === 1 ? "" : "s"} marked Collected
          </small>
        </div>
      </div>

      {/* 2. Toolbar — search by schedule ID / client / contract / invoice */}
      <div className="vendor-toolbar">
        <div className="search-box vendor-search">
          <span>⌕</span>
          <input
            placeholder="Search schedule ID, client, contract, invoice or collector..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="vendor-toolbar-controls">
          <select
            className="vendor-select"
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
            title="Filter by collection status"
          >
            <option>All Status</option>
            {statusOptions.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>

          <select
            className="vendor-select"
            value={filterPriority}
            onChange={(event) => setFilterPriority(event.target.value)}
            title="Filter by priority"
          >
            <option>All Priorities</option>
            {priorityOptions.map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </select>

          <select
            className="vendor-select"
            value={filterClient}
            onChange={(event) => setFilterClient(event.target.value)}
            title="Filter by client"
          >
            <option>All Clients</option>
            {clientOptions.map((client) => (
              <option key={client}>{client}</option>
            ))}
          </select>

          <select
            className="vendor-select"
            value={filterCollector}
            onChange={(event) => setFilterCollector(event.target.value)}
            title="Filter by assigned collector"
          >
            <option>All Collectors</option>
            {collectorOptions.map((collector) => (
              <option key={collector}>{collector}</option>
            ))}
          </select>

          <select
            className="vendor-select"
            value={filterMethod}
            onChange={(event) => setFilterMethod(event.target.value)}
            title="Filter by collection method"
          >
            <option>All Methods</option>
            {methodOptions.map((method) => (
              <option key={method}>{method}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Planned collection date range + reset */}
      <div className="vendor-toolbar collection-date-bar">
        <label>
          <span>Collection date from</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
        </label>

        <label>
          <span>to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </label>

        <button type="button" className="light-button" onClick={resetFilters}>
          <RotateCcw size={14} /> Reset Filters
        </button>
      </div>

      {/* 4. Collection schedule — one row per collection plan */}
      <section className="vendor-record-panel">
        <div className="vendor-record-heading">
          <h3>Collection Schedule ({filtered.length})</h3>
        </div>

        <div className="table-card vendor-table-card">
          <table>
            <thead>
              <tr>
                <th>Schedule ID</th>
                <th>Client</th>
                <th>Contract ID</th>
                <th>Invoice No.</th>
                <th>Outstanding Amount</th>
                <th>Invoice Due Date</th>
                <th>Scheduled Collection</th>
                <th>Collection Method</th>
                <th>Assigned Collector</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((schedule) => {
                  const key = schedule.id ?? schedule.schedule_id;
                  const isClosed =
                    schedule.status === "Collected" || schedule.status === "Cancelled";

                  return (
                    <tr key={key} onClick={() => openDetail(schedule)}>
                      <td className="link-cell">{schedule.schedule_id}</td>
                      <td className="strong-cell">{display(schedule.client_name)}</td>
                      <td>{display(schedule.contract_id)}</td>
                      <td>{display(schedule.invoice_no)}</td>
                      <td className="money-cell">
                        {maskable(`row-${key}-outstanding`, schedule.outstanding_amount)}
                      </td>
                      <td>{display(schedule.due_date)}</td>
                      <td>{display(schedule.scheduled_collection_date)}</td>
                      <td>{display(schedule.collection_method)}</td>
                      <td>{display(schedule.assigned_collector)}</td>
                      <td>
                        <span className={`priority-badge ${prioritySlug(schedule.priority)}`}>
                          {display(schedule.priority)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${statusSlug(schedule.status)}`}>
                          {schedule.status}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions aging-row-actions">
                          <button
                            type="button"
                            className="aging-menu-toggle"
                            title="Actions"
                            aria-label={`Actions for ${schedule.schedule_id}`}
                            onMouseDown={(event) => event.stopPropagation()}
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenMenuId(openMenuId === schedule.id ? null : schedule.id);
                            }}
                          >
                            <MoreHorizontal size={15} />
                          </button>

                          {openMenuId === schedule.id && (
                            <div
                              className="aging-action-menu"
                              onMouseDown={(event) => event.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  openDetail(schedule);
                                }}
                              >
                                <Eye size={13} /> View Details
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditSchedule(schedule)}
                              >
                                <Pencil size={13} /> Edit Schedule
                              </button>

                              {schedule.status !== "In Progress" && !isClosed && (
                                <button
                                  type="button"
                                  onClick={() => openStatusDialog(schedule, "In Progress")}
                                >
                                  <CalendarClock size={13} /> Start Collection
                                </button>
                              )}

                              {!isClosed && (
                                <button
                                  type="button"
                                  onClick={() => openStatusDialog(schedule, "Rescheduled")}
                                >
                                  <CalendarClock size={13} /> Reschedule
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handlePrint(schedule);
                                }}
                              >
                                <Printer size={13} /> Print Schedule
                              </button>

                              {!isClosed && (
                                <button
                                  type="button"
                                  onClick={() => openStatusDialog(schedule, "Cancelled")}
                                >
                                  <XCircle size={13} /> Cancel Schedule
                                </button>
                              )}

                              <button type="button" onClick={() => handleDelete(schedule)}>
                                <Trash2 size={13} /> Delete Schedule
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={12} className="empty">
                    {loadError
                      ? "No collection schedule to display."
                      : "No collection schedule matches the current search and filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. New / Edit collection schedule dialog */}
      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div
            className="modal collection-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>
                  {form.id ? "Edit Collection Schedule" : "New Collection Schedule"}
                </h2>
                <p>Collection Management • the invoice decides the client, contract and amount</p>
              </div>
              <button type="button" onClick={() => setForm(null)} aria-label="Close">
                <X size={15} />
              </button>
            </div>

            <div className="collection-form-body">
              <div className="form-grid">
                <div className="form-group full">
                  <label>Invoice *</label>

                  <select
                    value={form.invoice_id}
                    onChange={(event) => handleInvoiceChange(event.target.value)}
                    disabled={Boolean(form.id)}
                    title={
                      form.id
                        ? "The invoice of an existing schedule cannot be moved — add a new schedule instead"
                        : "Outstanding invoices read from the backend"
                    }
                  >
                    <option value="">Select an outstanding invoice</option>

                    {outstandingInvoices.map((invoice) => (
                      <option
                        key={invoice.id}
                        value={String(invoice.id)}
                        disabled={Boolean(invoice.open_schedule_id)}
                      >
                        {invoice.invoice_no} · {invoice.client_name} ·{" "}
                        {money(invoice.outstanding_amount)}
                        {invoice.open_schedule_id
                          ? ` (already scheduled: ${invoice.open_schedule_id})`
                          : ""}
                      </option>
                    ))}

                    {/* The edited schedule's own invoice may no longer be outstanding
                        (e.g. already paid), so it stays selectable on its own row. */}
                    {form.id &&
                      form.invoice_id &&
                      !outstandingInvoices.some(
                        (invoice) => String(invoice.id) === String(form.invoice_id)
                      ) && (
                        <option value={String(form.invoice_id)}>
                          {schedules.find(
                            (row) => String(row.invoice_id) === String(form.invoice_id)
                          )?.invoice_no || `Invoice #${form.invoice_id}`}{" "}
                          (current invoice)
                        </option>
                      )}
                  </select>

                  {formErrors.invoice_id && (
                    <small className="collection-form-error">{formErrors.invoice_id}</small>
                  )}
                </div>

                <div className="form-group">
                  <label>Scheduled Collection Date *</label>
                  <input
                    type="date"
                    value={form.scheduled_collection_date}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        scheduled_collection_date: event.target.value,
                        follow_up_date:
                          previous.follow_up_date &&
                          previous.follow_up_date > event.target.value
                            ? ""
                            : previous.follow_up_date,
                      }))
                    }
                  />
                  {formErrors.scheduled_collection_date && (
                    <small className="collection-form-error">
                      {formErrors.scheduled_collection_date}
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Follow-up Date</label>
                  <input
                    type="date"
                    value={form.follow_up_date}
                    max={form.scheduled_collection_date || undefined}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        follow_up_date: event.target.value,
                      }))
                    }
                  />
                  {formErrors.follow_up_date && (
                    <small className="collection-form-error">
                      {formErrors.follow_up_date}
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Collection Method</label>
                  <select
                    value={form.collection_method}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        collection_method: event.target.value,
                      }))
                    }
                  >
                    {methodOptions.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Assigned Collector</label>
                  <input
                    type="text"
                    value={form.assigned_collector}
                    placeholder="Leave blank for Unassigned"
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        assigned_collector: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        priority: event.target.value,
                      }))
                    }
                  >
                    {priorityOptions.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        status: event.target.value,
                      }))
                    }
                  >
                    {form.status &&
                      !SETTABLE_STATUSES.includes(form.status) && (
                        <option value={form.status} disabled>
                          {form.status} (server-derived)
                        </option>
                      )}
                    {SETTABLE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <small className="collection-form-help">
                    Due Today and Overdue are calculated by the API from the planned date.
                  </small>
                </div>

                <div className="form-group full">
                  <label>Notes</label>
                  <textarea
                    className="collection-notes"
                    rows="3"
                    value={form.notes}
                    placeholder="Add a follow-up note or collection instruction"
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        notes: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="light-button"
                onClick={() => setForm(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleSaveSchedule}
                disabled={saving}
              >
                {saving ? "Saving..." : form.id ? "Save Changes" : "Save Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule detail dialog — GET /api/collection-schedules/:id */}
      {detail && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Collection Schedule — {detail.schedule?.schedule_id || ""}</h2>
                <p>{display(detail.schedule?.client_name)}</p>
              </div>
              <button type="button" onClick={closeDetail} aria-label="Close">
                <X size={15} />
              </button>
            </div>

            <div className="aging-detail-body">
              {detail.loading && (
                <p className="aging-detail-loading">Loading schedule details…</p>
              )}

              {!detail.loading && detail.error && (
                <div className="contract-alert">
                  <AlertTriangle size={17} />
                  <span>{detail.error}</span>
                </div>
              )}

              {!detail.loading && detail.schedule && !detail.error && (
                <>
                  <div className="aging-detail-section">
                    <h4>Collection Plan</h4>
                    <dl className="aging-detail-grid">
                      <div>
                        <dt>Schedule ID</dt>
                        <dd>{display(detail.schedule.schedule_id)}</dd>
                      </div>
                      <div>
                        <dt>Status</dt>
                        <dd>
                          <span className={`status-badge ${statusSlug(detail.schedule.status)}`}>
                            {display(detail.schedule.status)}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt>Client</dt>
                        <dd>{display(detail.schedule.client_name)}</dd>
                      </div>
                      <div>
                        <dt>Contract</dt>
                        <dd>{display(detail.schedule.contract_id)}</dd>
                      </div>
                      <div>
                        <dt>Scheduled Collection</dt>
                        <dd>{display(detail.schedule.scheduled_collection_date)}</dd>
                      </div>
                      <div>
                        <dt>Follow-up Date</dt>
                        <dd>{display(detail.schedule.follow_up_date)}</dd>
                      </div>
                      <div>
                        <dt>Collection Method</dt>
                        <dd>{display(detail.schedule.collection_method)}</dd>
                      </div>
                      <div>
                        <dt>Assigned Collector</dt>
                        <dd>{display(detail.schedule.assigned_collector)}</dd>
                      </div>
                      <div>
                        <dt>Priority</dt>
                        <dd>{display(detail.schedule.priority)}</dd>
                      </div>
                      <div>
                        <dt>Invoice Due Date</dt>
                        <dd>{display(detail.schedule.due_date)}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="aging-detail-section">
                    <h4>Invoice</h4>
                    {detail.invoice ? (
                      <dl className="aging-detail-grid">
                        <div>
                          <dt>Invoice No.</dt>
                          <dd>{display(detail.invoice.invoice_number)}</dd>
                        </div>
                        <div>
                          <dt>Invoice Amount</dt>
                          <dd>
                            {maskable(
                              `detail-${detail.schedule.id}-invoice-amount`,
                              detail.invoice.total_amount
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt>Amount Paid</dt>
                          <dd>
                            {maskable(
                              `detail-${detail.schedule.id}-amount-paid`,
                              detail.invoice.amount_paid
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt>Outstanding Balance</dt>
                          <dd>
                            {maskable(
                              `detail-${detail.schedule.id}-outstanding`,
                              detail.invoice.outstanding_amount
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt>Due Date</dt>
                          <dd>{display(detail.invoice.due_date)}</dd>
                        </div>
                        <div>
                          <dt>Payment Status</dt>
                          <dd>{display(detail.invoice.payment_status)}</dd>
                        </div>
                      </dl>
                    ) : (
                      <p className="aging-detail-empty">
                        The invoice linked to this schedule is no longer available.
                      </p>
                    )}
                  </div>

                  <div className="aging-detail-section">
                    <h4>Notes</h4>
                    <p className="aging-detail-empty">{display(detail.schedule.notes)}</p>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="light-button" onClick={closeDetail}>
                Close
              </button>
              {detail.schedule && (
                <button
                  type="button"
                  className="light-button"
                  onClick={() => handlePrint(detail.schedule)}
                >
                  <Printer size={14} /> Print
                </button>
              )}
              {detail.invoice && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    closeDetail();
                    navigate?.("Payment Recording");
                  }}
                >
                  <CheckCircle2 size={14} /> Record Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status/action dialog — PUT /api/collection-schedules/:id/status */}
      {statusDialog && (
        <div className="modal-overlay" onClick={closeStatusDialog}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>
                  {statusDialog.status === "In Progress"
                    ? "Start Collection"
                    : statusDialog.status === "Rescheduled"
                      ? "Reschedule Collection"
                      : "Cancel Collection Schedule"}
                </h2>
                <p>
                  {statusDialog.schedule.schedule_id} • {display(statusDialog.schedule.client_name)}
                </p>
              </div>
              <button type="button" onClick={closeStatusDialog} aria-label="Close">
                <X size={15} />
              </button>
            </div>

            <div className="aging-detail-body">
              <div className="contract-alert">
                <AlertTriangle size={17} />
                <span>The API will validate and store this status change.</span>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Scheduled Collection Date *</label>
                  <input
                    type="date"
                    value={statusDialog.scheduled_collection_date}
                    onChange={(event) =>
                      setStatusDialog((previous) => ({
                        ...previous,
                        scheduled_collection_date: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Follow-up Date</label>
                  <input
                    type="date"
                    value={statusDialog.follow_up_date}
                    max={statusDialog.scheduled_collection_date || undefined}
                    onChange={(event) =>
                      setStatusDialog((previous) => ({
                        ...previous,
                        follow_up_date: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group full">
                  <label>Assigned Collector</label>
                  <input
                    type="text"
                    value={statusDialog.assigned_collector}
                    placeholder="Leave blank for Unassigned"
                    onChange={(event) =>
                      setStatusDialog((previous) => ({
                        ...previous,
                        assigned_collector: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group full">
                  <label>Notes</label>
                  <textarea
                    className="collection-notes"
                    rows="3"
                    value={statusDialog.notes}
                    placeholder="Add an optional status-change note"
                    onChange={(event) =>
                      setStatusDialog((previous) => ({
                        ...previous,
                        notes: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="light-button"
                onClick={closeStatusDialog}
                disabled={statusDialog.saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleStatusSave}
                disabled={statusDialog.saving}
              >
                {statusDialog.saving ? "Saving..." : "Save Status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default CollectionSchedulingPage;