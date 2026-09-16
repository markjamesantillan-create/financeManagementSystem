import React, { useMemo, useState, useEffect } from "react";
import "./index.css";
import logo from "./assets/logo.jpg";
import {
  FileText,
  CircleDollarSign,
  HandCoins,
  CreditCard,
  Wallet,
  ClipboardList,
  Landmark,
  ReceiptText,
  ChartNoAxesCombined,
  Calculator,
  PhilippinePeso,
  TrendingUp,
  TrendingDown,
  Archive,
  ArchiveRestore,
  Bell,
  History,
  ShieldCheck,
  Search,
  Upload,
  Printer,
  FileDown,
  RotateCcw,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Lock,
} from "lucide-react";

const money = (value) => new Intl.NumberFormat("en-PH", {

  style: "currency", currency: "PHP", maximumFractionDigits: 0,

}).format(Number(value || 0));

const sections = [
  {
    title: "Transaction Management",
    locked: true,
    items: [
      { name: "Client Billing Management", icon: FileText, children: ["Client Contract Management", "Billing Generation", "Service Invoice Management", "Billing Schedule Monitoring", "Client Account Monitoring"] },
      { name: "Accounts Receivable", icon: CircleDollarSign, children: ["Payment Recording", "Outstanding Balance Tracking", "Aging of Receivables", "Client Payment History"] },
      { name: "Collection Management", icon: HandCoins, children: ["Collection Scheduling", "Collection Follow-ups", "Official Receipt Generation", "Collection Monitoring"] },
      { name: "Accounts Payable", icon: CreditCard, children: ["Supplier Payment Management", "Utility Payment Management", "Office Expense Management", "Vendor Payment Tracking"] },
    ],
  },

  {
    title: "Fund & Budget Management",
    locked: true,
    items: [
      { name: "Payroll Fund Management", icon: Wallet, children: ["Employee Payroll Allocation", "Salary Fund Monitoring", "Payroll Release Tracking"] },
      { name: "Budget Management", icon: ClipboardList, children: ["Department Budget Allocation", "Budget Requests", "Budget Monitoring", "Budget Adjustments"] },
      { name: "Cash Management", icon: Landmark, children: ["Cash Inflow Monitoring", "Cash Outflow Monitoring", "Bank Account Management", "Cash Flow Tracking"] },
    ],
  },

  {
    title: "Financial Reporting & Compliance",
    locked: true,
    items: [
      { name: "Financial Reporting", icon: ReceiptText, children: ["Income Statement", "Expense Reports", "Revenue Reports", "Profit Analysis"] },
      { name: "Analytics Dashboard", icon: ChartNoAxesCombined, children: ["Client Revenue Analytics", "Payroll Cost Analytics", "Budget Utilization Analytics", "Financial KPI Monitoring"] },
      { name: "Tax Management", icon: Calculator, children: ["Tax Calculation", "Tax Records", "Tax Filing Preparation", "Compliance Monitoring"] },
    ],
  },

  {
    title: "System Management",
    locked: true,
    items: [
      { name: "Archive Management", icon: Archive, children: ["Archived Records", "Archive History"] },
      { name: "System Monitoring", icon: History, children: ["Audit Trail", "Notification History"] },
      { name: "User Management", icon: ShieldCheck, children: ["User Permissions"] },
      { name: "Admin Settings", icon: Calculator, children: ["Admin Profile", "User Accounts", "Roles & Permissions", "Security", "Notifications", "Financial Configuration", "Bank Accounts", "Archive Settings", "Audit Settings", "Backup & Restore", "System Preferences"] },
    ],
  },
];

const contracts = [
  { id: "CON-001", client: "Acme Corp", value: 2400000, start: "Jan 1, 2026", end: "Dec 31, 2026", status: "Active" },
  { id: "CON-002", client: "GlobalTech Ltd", value: 1800000, start: "Mar 1, 2026", end: "Feb 28, 2027", status: "Active" },
  { id: "CON-003", client: "Prime Solutions", value: 960000, start: "Jul 1, 2026", end: "Jun 30, 2027", status: "Active" },
  { id: "CON-004", client: "Horizon Corp", value: 3200000, start: "Jan 1, 2026", end: "Dec 31, 2026", status: "Expiring" },
  { id: "CON-005", client: "Delta Ventures", value: 540000, start: "Sep 1, 2025", end: "Aug 31, 2026", status: "Expired" },

];
const transactions = [
  { id: 1, date: "Aug 15, 2026", description: "Client Payment - Acme Corp", category: "Client Billing", type: "Income", amount: 420000, account: "BDO Business", status: "Completed" },
  { id: 2, date: "Aug 14, 2026", description: "Employee Salaries", category: "Payroll", type: "Expense", amount: 68000, account: "BDO Business", status: "Completed" },
  { id: 3, date: "Aug 13, 2026", description: "Office Supplies", category: "Office Expense", type: "Expense", amount: 8500, account: "Cash", status: "Completed" },
  { id: 4, date: "Aug 12, 2026", description: "Service Invoice Payment", category: "Revenue", type: "Income", amount: 315000, account: "BPI Corporate", status: "Completed" },
  { id: 5, date: "Aug 11, 2026", description: "Internet and Utilities", category: "Utilities", type: "Expense", amount: 12500, account: "Cash", status: "Pending" },

];

const vendorPaymentRecords = [
  { id: "VP-001", vendor: "ABC Co.", invoice: "INV-101", po: "PO-4031", dueDate: "Sep 15, 2026", amount: 85000, status: "Paid", paymentMethod: "Bank Transfer", datePaid: "Sep 14, 2026", paymentReference: "BT-90256", preparedBy: "Finance Staff", verifiedBy: "Admin User", approvedBy: "Admin User" },
  { id: "VP-002", vendor: "XYZ Inc.", invoice: "INV-102", po: "PO-4032", dueDate: "Sep 20, 2026", amount: 42000, status: "Pending", paymentMethod: "Cash", datePaid: "—", paymentReference: "—", preparedBy: "Finance Staff", verifiedBy: "Admin User", approvedBy: "—" },
  { id: "VP-003", vendor: "Office Depot", invoice: "INV-103", po: "PO-4033", dueDate: "Sep 10, 2026", amount: 18500, status: "Overdue", paymentMethod: "Check", datePaid: "—", paymentReference: "CHK-19012", preparedBy: "Finance Staff", verifiedBy: "Admin User", approvedBy: "—" },
  { id: "VP-004", vendor: "Utility Services", invoice: "INV-104", po: "PO-4034", dueDate: "Sep 25, 2026", amount: 27000, status: "Scheduled", paymentMethod: "Bank Transfer", datePaid: "—", paymentReference: "BT-90260", preparedBy: "Finance Staff", verifiedBy: "Finance Staff", approvedBy: "Admin User" },
];

const supplyPaymentRecords = [
  { id: "SP-001", supplier: "ABC Supplies", po: "PO-101", invoice: "INV-001", amount: 25000, date: "Sep 5, 2026", status: "Paid" },
  { id: "SP-002", supplier: "XYZ Office", po: "PO-102", invoice: "INV-045", amount: 18500, date: "Sep 8, 2026", status: "Pending" },
  { id: "SP-003", supplier: "Prime Supply", po: "PO-103", invoice: "INV-1003", amount: 42000, date: "Sep 12, 2026", status: "For Approval" },
];

const cashPaymentRecords = [
  { id: "CP-001", supplier: "Cash Office", po: "PO-301", invoice: "INV-301", amount: 12500, date: "Sep 7, 2026", status: "Paid" },
  { id: "CP-002", supplier: "Petty Cash", po: "PO-302", invoice: "INV-302", amount: 8600, date: "Sep 11, 2026", status: "Pending" },
  { id: "CP-003", supplier: "Logistics Cash", po: "PO-303", invoice: "INV-303", amount: 15200, date: "Sep 17, 2026", status: "Scheduled" },
];

const checkPaymentRecords = [
  { id: "CK-001", supplier: "Office Depot", po: "PO-401", invoice: "INV-401", amount: 22100, date: "Sep 9, 2026", status: "For Approval" },
  { id: "CK-002", supplier: "Ink & Paper", po: "PO-402", invoice: "INV-402", amount: 6100, date: "Sep 14, 2026", status: "Paid" },
  { id: "CK-003", supplier: "General Services", po: "PO-403", invoice: "INV-403", amount: 17800, date: "Sep 21, 2026", status: "Overdue" },
];

const bankPaymentRecords = [
  { id: "BK-001", supplier: "Metro Supply", po: "PO-501", invoice: "INV-501", amount: 48000, date: "Sep 13, 2026", status: "Scheduled" },
  { id: "BK-002", supplier: "Prime Utility", po: "PO-502", invoice: "INV-502", amount: 33500, date: "Sep 18, 2026", status: "Paid" },
  { id: "BK-003", supplier: "Regional Freight", po: "PO-503", invoice: "INV-503", amount: 29000, date: "Sep 24, 2026", status: "Pending" },
];
const monthly = [
  { m: "Jan 1, 2026", revenue: 1800000, expense: 1240000 }, { m: "Feb 1, 2026", revenue: 1950000, expense: 1300000 },
  { m: "Mar 1, 2026", revenue: 2100000, expense: 1360000 }, { m: "Apr 1, 2026", revenue: 1980000, expense: 1280000 },
  { m: "May 1, 2026", revenue: 2350000, expense: 1450000 }, { m: "Jun 1, 2026", revenue: 2280000, expense: 1420000 },
];

const openDocumentDB = () => new Promise((resolve, reject) => {
  const request = indexedDB.open("PrimePowerFinanceDB", 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains("pdfs")) {
      db.createObjectStore("pdfs", { keyPath: "id" });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const savePDFToDB = (db, pdf) => new Promise((resolve, reject) => {
  const tx = db.transaction("pdfs", "readwrite");
  tx.objectStore("pdfs").put(pdf);
  tx.oncomplete = () => resolve();
  tx.onerror = () => reject(tx.error);
});

const openSavedPDF = async (documentId) => {
  try {
    const db = await openDocumentDB();
    const pdf = await new Promise((resolve, reject) => {
      const tx = db.transaction("pdfs", "readonly");
      const request = tx.objectStore("pdfs").get(documentId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (!pdf?.dataUrl) {
      window.alert("Saved PDF data was not found.");
      return;
    }
    const win = window.open();
    if (win) win.location.href = pdf.dataUrl;
  } catch (error) {
    console.error(error);
    window.alert("Unable to open the saved PDF.");
  }
};

const defaultFinanceState = {
  contractRecords: contracts,
  archivedRecords: [],
  archiveHistory: [],
  auditTrail: [],
  notifications: [],
  permissions: [
    { user: "Admin User", role: "Administrator", billing: true, payments: true, reports: true, archive: true },
    { user: "Finance Staff", role: "Staff", billing: true, payments: true, reports: true, archive: false },
    { user: "Viewer", role: "Viewer", billing: false, payments: false, reports: true, archive: false },
  ],
};

const loadFinanceData = async () => {
  const fallback = defaultFinanceState;

  try {
    const response = await fetch("/api/state", { headers: { Accept: "application/json" } });
    if (!response.ok) {
      return fallback;
    }

    const data = await response.json();
    if (!data || !data.data) {
      return fallback;
    }

    return {
      contractRecords: data.data.contractRecords ?? fallback.contractRecords,
      archivedRecords: data.data.archivedRecords ?? fallback.archivedRecords,
      archiveHistory: data.data.archiveHistory ?? fallback.archiveHistory,
      auditTrail: data.data.auditTrail ?? fallback.auditTrail,
      notifications: data.data.notifications ?? fallback.notifications,
      permissions: data.data.permissions ?? fallback.permissions,
    };
  } catch (error) {
    console.error("Failed to load finance data from backend:", error);
    return fallback;
  }
};

const persistFinanceData = async (payload) => {
  try {
    await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Failed to persist finance data to backend:", error);
  }
};

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [openMenus, setOpenMenus] = useState({"Client Billing Management": true});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("New Record");
  const [aiBudget, setAiBudget] = useState(null);
  const [contractRecords, setContractRecords] = useState(() => JSON.parse(localStorage.getItem("pp_contracts") || "null") || contracts);
  const [archivedRecords, setArchivedRecords] = useState(() => JSON.parse(localStorage.getItem("pp_archived") || "[]"));
  const [archiveHistory, setArchiveHistory] = useState(() => JSON.parse(localStorage.getItem("pp_archive_history") || "[]"));
  const [auditTrail, setAuditTrail] = useState(() => JSON.parse(localStorage.getItem("pp_audit") || "[]"));
  const [notifications, setNotifications] = useState(() => JSON.parse(localStorage.getItem("pp_notifications") || "[]"));
  const [permissions, setPermissions] = useState(() => JSON.parse(localStorage.getItem("pp_permissions") || "null") || [
    { user: "Admin User", role: "Administrator", billing: true, payments: true, reports: true, archive: true },
    { user: "Finance Staff", role: "Staff", billing: true, payments: true, reports: true, archive: false },
    { user: "Viewer", role: "Viewer", billing: false, payments: false, reports: true, archive: false },
  ]);

  useEffect(() => {
    let active = true;

    loadFinanceData().then((data) => {
      if (!active) return;
      setContractRecords(data.contractRecords);
      setArchivedRecords(data.archivedRecords);
      setArchiveHistory(data.archiveHistory);
      setAuditTrail(data.auditTrail);
      setNotifications(data.notifications);
      setPermissions(data.permissions);
    });

    fetch("/api/ai-budget", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        month: 8,
        revenue: 5200000,
        payroll: 1400000,
        supplies: 430000,
        utilities: 270000,
        operations: 930000,
        currentBudget: 4200000,
      }),
    })
      .then((response) => response.json())
      .then((payload) => {
        if (active && payload?.success) {
          setAiBudget(payload.data);
        }
      })
      .catch((error) => {
        console.error("Failed to load AI budget forecast:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  const totalRevenue = transactions.filter(x => x.type === "Income").reduce((a, x) => a + x.amount, 0);
  const totalExpenses = transactions.filter(x => x.type === "Expense").reduce((a, x) => a + x.amount, 0);
  const netCash = totalRevenue - totalExpenses;
  const filtered = useMemo(
    () => transactions.filter(x => `${x.description} ${x.category} ${x.account}`.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  useEffect(() => localStorage.setItem("pp_contracts", JSON.stringify(contractRecords)), [contractRecords]);
  useEffect(() => localStorage.setItem("pp_archived", JSON.stringify(archivedRecords)), [archivedRecords]);
  useEffect(() => localStorage.setItem("pp_archive_history", JSON.stringify(archiveHistory)), [archiveHistory]);
  useEffect(() => localStorage.setItem("pp_audit", JSON.stringify(auditTrail)), [auditTrail]);
  useEffect(() => localStorage.setItem("pp_notifications", JSON.stringify(notifications)), [notifications]);
  useEffect(() => localStorage.setItem("pp_permissions", JSON.stringify(permissions)), [permissions]);

  useEffect(() => {
    persistFinanceData({
      contractRecords,
      archivedRecords,
      archiveHistory,
      auditTrail,
      notifications,
      permissions,
    });
  }, [contractRecords, archivedRecords, archiveHistory, auditTrail, notifications, permissions]);

  // Automatic 3-month contract trigger.
  useEffect(() => {
    const today = new Date();
    const threeMonths = new Date(today);
    threeMonths.setMonth(threeMonths.getMonth() + 3);
    const nextNotifications = [];
    contractRecords.forEach(c => {
      const end = new Date(c.end);
      const shouldNotify = end >= today && end <= threeMonths;
      if (shouldNotify && c.status !== "Expired" && c.status !== "Archived") {
        nextNotifications.push({
          id: `N-${c.id}`,
          type: "Contract Expiration",
          message: `${c.client} contract expires on ${c.end}.`,
          contractId: c.id,
          date: new Date().toLocaleDateString(),
          unread: true,
        });
      }
    });
    if (nextNotifications.length) {
      setNotifications(prev => {
        const existing = new Set(prev.map(n => n.id));
        return [...prev, ...nextNotifications.filter(n => !existing.has(n.id))];
      });
    }
  }, [contractRecords]);

  const navigate = (page) => {
    setActivePage(page);
    setSidebarOpen(false);

    // Automatically open the sidebar parent that contains the selected page.
    const parent = sections
      .flatMap(section => section.items)
      .find(item => item.children.includes(page));

    if (parent) {
      setOpenMenus({ [parent.name]: true });
    }
  };
 const toggle = (name) => { setOpenMenus(prev => ({[name]: !prev[name]}));};
  const openNew = (title) => { setModalTitle(title); setShowModal(true); };
  const logout = () => {
    localStorage.removeItem("primepower-session");
    window.location.reload();
  };

  const addAudit = (action, record = "") => {
    setAuditTrail(prev => [{
      id: Date.now(),
      action,
      record,
      user: "Admin User",
      date: new Date().toLocaleString(),
    }, ...prev].slice(0, 200));
  };

  const archiveContract = (contract) => {
    if (!window.confirm(`Archive contract ${contract.id} for ${contract.client}?`)) return;
    const archived = { ...contract, status: "Archived", archivedAt: new Date().toLocaleString(), archivedBy: "Admin User" };
    setContractRecords(prev => prev.filter(c => c.id !== contract.id));
    setArchivedRecords(prev => [archived, ...prev]);
    setArchiveHistory(prev => [{ id: Date.now(), action: "Archived", record: contract.id, client: contract.client, user: "Admin User", date: new Date().toLocaleString() }, ...prev]);
    addAudit("Archived contract", contract.id);
  };

  const restoreContract = (record) => {
    if (!window.confirm(`Restore archived record ${record.id}?`)) return;
    const restored = { ...record, status: "Active" };
    delete restored.archivedAt;
    delete restored.archivedBy;
    setArchivedRecords(prev => prev.filter(x => x.id !== record.id));
    setContractRecords(prev => [restored, ...prev]);
    setArchiveHistory(prev => [{ id: Date.now(), action: "Restored", record: record.id, client: record.client, user: "Admin User", date: new Date().toLocaleString() }, ...prev]);
    addAudit("Restored contract", record.id);
  };

  const saveDocument = async (contractId, file) => {
    if (!file || file.type !== "application/pdf") {
      window.alert("Please upload a PDF supporting document.");
      return;
    }

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const documentId = `${contractId}-${Date.now()}`;
      const uploadedAt = new Date().toLocaleString();
      const db = await openDocumentDB();
      await savePDFToDB(db, {
        id: documentId,
        contractId,
        name: file.name,
        size: file.size,
        uploadedAt,
        dataUrl,
      });

      const item = {
        id: documentId,
        name: file.name,
        size: file.size,
        uploadedAt,
      };

      setContractRecords(prev => prev.map(c =>
        c.id === contractId
          ? { ...c, documents: [...(c.documents || []), item] }
          : c
      ));
      addAudit("Uploaded and saved supporting PDF", `${contractId} / ${file.name}`);
    } catch (error) {
      console.error(error);
      window.alert("The PDF could not be saved. Please try again.");
    }
  };

  return (
    <div className="app">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <img src={logo} alt="PRIMEPOWER Logo" className="brand-image" />
          <div><h2>PRIMEPOWER</h2><span>Finance Management</span></div>
        </div>
        <nav className="sidebar-scroll">
          <button className={`menu ${activePage === "Dashboard" ? "active" : ""}`} onClick={() => navigate("Dashboard")}>
            <span className="menu-icon">▦</span><span>Dashboard</span>
          </button>
          {sections.map(section => (
            <div className="menu-section" key={section.title}>
              <div className="menu-title">
                <span className="menu-title-text">{section.title}</span>
                <span className="section-lock" title="Permission locked"><Lock size={13} strokeWidth={2} /></span>
              </div>
              {section.items.map(item => {
                const open = !!openMenus[item.name];
                const childActive = item.children.includes(activePage);
                return <div className="menu-group" key={item.name}>
                  <button className={`menu menu-parent ${childActive ? "parent-active" : ""}`} onClick={() => toggle(item.name)}>
                    <span className="menu-icon"><item.icon size={18} strokeWidth={2} /></span><span className="menu-label">{item.name}</span><span className={`arrow ${open ? "rotated" : ""}`}>›</span>
                  </button>
                  {open && <div className="submenu">
                    {item.children.map(child => <button key={child} className={`submenu-item ${activePage === child ? "active" : ""}`} onClick={() => navigate(child)}>{child}</button>)}
                  </div>}
                </div>;
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile">
            <div className="avatar">N</div>
            <div><strong>Admin User</strong><span>admin@fintrack.com</span></div>
            <button
              type="button"
              className="dots"
              onClick={() => setAccountMenuOpen(previous => !previous)}
              aria-label="Open account menu"
              aria-expanded={accountMenuOpen}
            >•••</button>
            {accountMenuOpen && <div className="account-menu"><button type="button" onClick={logout}>Log out</button></div>}
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div className="header-left"><button className="mobile-menu" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button><h1>{activePage}</h1></div>
          <div className="header-actions">
            <div className="search-box"><span>⌕</span><input placeholder="Quick search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <button className="notification-button" title="Notifications" onClick={() => navigate("Notification History")}><Bell size={19} /><span>{notifications.filter(n => n.unread).length}</span></button>
          </div>
        </header>
        {activePage === "Dashboard" ? <Dashboard totalRevenue={totalRevenue} totalExpenses={totalExpenses} netCash={netCash} navigate={navigate} aiBudget={aiBudget} /> :
          activePage === "Client Contract Management" ? <ContractPage contracts={contractRecords} onNew={() => openNew("New Contract")} onArchive={archiveContract} onUpload={saveDocument} /> :
          activePage === "Archived Records" ? <ArchivedPage records={archivedRecords} onRestore={restoreContract} search={search} /> :
          activePage === "Archive History" ? <HistoryPage title="Archive History" rows={archiveHistory} /> :
          activePage === "Audit Trail" ? <HistoryPage title="Audit Trail" rows={auditTrail} /> :
          activePage === "Notification History" ? <NotificationHistory notifications={notifications} setNotifications={setNotifications} /> :
          activePage === "User Permissions" ? <PermissionsPage permissions={permissions} setPermissions={setPermissions} /> :
          adminSettingsPages.includes(activePage) ? <AdminSettingsPage page={activePage} /> :
          activePage === "Supplier Payment Management" ? <SupplyPaymentManagementPage onNew={() => openNew("New Supply Payment")} /> :
          activePage === "Vendor Payment Tracking" ? <VendorPaymentTrackingPage onNew={() => openNew("New Vendor Payment")} /> :
          <ModulePage page={activePage} onNew={() => openNew(`New ${activePage}`)} transactions={filtered} />}
      </main>

      {showModal && <Modal title={modalTitle} onClose={() => setShowModal(false)} onAudit={addAudit} />}
    </div>
  );
}

function Dashboard({ totalRevenue, totalExpenses, netCash, navigate, aiBudget }) {
  const [hoveredAllocationForDashboard, setHoveredAllocationForDashboard] = useState(null);
  const [liveNow, setLiveNow] = useState(new Date());
  const [showAiAmounts, setShowAiAmounts] = useState({
    predictedExpenses: false,
    recommendedBudget: false,
  });
  const [showLiveAmounts, setShowLiveAmounts] = useState(false);
  const [showAmounts, setShowAmounts] = useState({
    revenue: false,
    receivables: false,
    expenses: false,
    cashFlow: false,
  });

  const toggleAmount = (key) => {
    setShowAmounts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const timer = window.setInterval(() => setLiveNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <section className="dashboard-page">
    <div className="stats four">
     <Stat title="TOTAL REVENUE (MTD)" value={showAmounts.revenue ? "₱2,280,000" : "*****"} note="Aug 1–15, 2026" change="↗ 8.3% vs last month" tone="blue" icon={PhilippinePeso} onClick={() => toggleAmount("revenue")} />
     <Stat title="OUTSTANDING RECEIVABLES" value={showAmounts.receivables ? "₱2,380,000" : "*****"} note="4 clients with balance" change="↘ 12.1% vs last month" tone="orange" icon={CircleDollarSign} onClick={() => toggleAmount("receivables")} />
     <Stat title="MONTHLY EXPENSES" value={showAmounts.expenses ? "₱1,420,000" : "*****"} note="Payroll + operations" change="↗ 4.7% vs last month" tone="green" icon={Wallet} onClick={() => toggleAmount("expenses")} />
     <Stat title="NET CASH FLOW" value={showAmounts.cashFlow ? "₱860,000" : "*****"} note="Inflow minus outflow" change="↗ 5.2% vs last month" tone="purple" icon={TrendingUp} onClick={() => toggleAmount("cashFlow")} />
    </div>
    <div className="mini-grid">
      <SummaryCard title="BILLING STATUS"><div className="three-values"><Metric value="12" label="Invoiced" blue /><Metric value="8" label="Collected" green /><Metric value="4" label="Overdue" red /></div></SummaryCard>
      <SummaryCard title="BUDGET UTILIZATION"><div className="three-values"><Metric value="74%" label="Used" purple /><Metric value="26%" label="Remaining" /><Metric value="2" label="Requests" orange /></div></SummaryCard>
      <SummaryCard title="TAX COMPLIANCE"><div className="three-values"><Metric value="5" label="Filed" green /><Metric value="2" label="Pending" orange /><Metric value="0" label="Overdue" red /></div></SummaryCard>
      {aiBudget ? (
        <div className="card summary-card ai-budget-card">
          <div className="ai-budget-main">
            <h3>AI BUDGETING</h3>
            <div className="report-lines">
              <div>
                <span>Predicted Expenses</span>
                <button
                  type="button"
                  className="ai-amount-toggle"
                  onClick={() => setShowAiAmounts(prev => ({ ...prev, predictedExpenses: !prev.predictedExpenses }))}
                  aria-label="Toggle predicted expenses visibility"
                >
                  {showAiAmounts.predictedExpenses ? money(aiBudget.predicted_expenses) : "*****"}
                </button>
              </div>
              <div>
                <span>Recommended Budget</span>
                <button
                  type="button"
                  className="ai-amount-toggle"
                  onClick={() => setShowAiAmounts(prev => ({ ...prev, recommendedBudget: !prev.recommendedBudget }))}
                  aria-label="Toggle recommended budget visibility"
                >
                  {showAiAmounts.recommendedBudget ? money(aiBudget.recommended_budget) : "*****"}
                </button>
              </div>
              <div><span>Budget Utilization</span><b>{aiBudget.budget_utilization.toFixed(1)}%</b></div>
              <div><span>Largest Cost</span><b>{aiBudget.largest_category}</b></div>
            </div>
            <ul className="ai-suggestions">
              {aiBudget.suggestions.slice(0, 3).map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
          <aside className="ai-live-panel">
            <div className="ai-live-heading">
              <span className="live-dot" />
              <h3>LIVE DASHBOARD</h3>
            </div>
            <strong className="ai-live-time">{liveNow.toLocaleTimeString()}</strong>
            <span className="ai-live-date">{liveNow.toLocaleDateString()}</span>
            <div className="ai-live-metrics">
              <div><span>System Status</span><b className="live-online">Online</b></div>
              <div>
                <span>Net Cash Flow</span>
                <button
                  type="button"
                  className="live-amount-toggle"
                  onClick={() => setShowLiveAmounts(prev => !prev)}
                  aria-label="Toggle net cash flow visibility"
                >
                  {showLiveAmounts ? money(netCash) : "*****"}
                </button>
              </div>
              <div><span>Expense Ratio</span><b>{aiBudget.expense_ratio.toFixed(1)}%</b></div>
              <div><span>Last AI Refresh</span><b>Just now</b></div>
            </div>
          </aside>
          <div className="live-flow-panel">
            <LiveFlowGraph liveNow={liveNow} />
          </div>
        </div>
      ) : null}
    </div>
    <div className="dashboard-grid-new">
      <div className="card chart-card"><div className="card-heading"><div><h3>Monthly Financial Overview</h3><p>Revenue, Expenses &amp; Profit · Jan–Jun 2026</p></div><span className="growth-pill">▲ +8.3% YTD</span></div><FinancialChart /></div>
      <div className="card allocation-card"><div className="card-heading"><div><h3>Budget Allocation</h3><p>By department · Aug 2026</p></div></div><Donut navigate={navigate} /><div className="allocation-list">{budgetAllocations.map((item, index) => <RowDot key={item.label} item={item} active={hoveredAllocationForDashboard === index} onHover={() => setHoveredAllocationForDashboard(index)} onLeave={() => setHoveredAllocationForDashboard(null)} onClick={() => navigate(item.page)} />)}</div></div>
    </div>
    <div className="card recent-card"><div className="card-heading"><div><h3>Recent Financial Activity</h3><p>Latest transactions across the system</p></div></div><TransactionTable /></div>
  </section>;
}

function LiveFlowGraph({ liveNow }) {
  const chartWidth = 360;
  const chartHeight = 150;
  const maxValue = 2400000;
  const activeIndex = liveNow.getSeconds() % monthly.length;
  const getY = value => 125 - (value / maxValue) * 100;
  const profitPoints = monthly.map((item, index) => ({
    x: 22 + index * 63,
    y: getY(item.revenue - item.expense),
  }));
  const profitPath = profitPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <div className="live-flow-graph">
      <div className="live-flow-heading">
        <span>Cash Flow Trend</span>
        <small>LIVE</small>
      </div>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Real-time cash flow bar and line graph">
        {[25, 58, 91, 124].map(y => <line key={y} x1="20" y1={y} x2="350" y2={y} className="live-grid-line" />)}
        {monthly.map((item, index) => {
          const barHeight = (item.expense / maxValue) * 100;
          const x = 14 + index * 63;
          return (
            <g key={item.m}>
              <rect x={x} y={125 - barHeight} width="17" height={barHeight} rx="2" className={`flow-bar ${activeIndex === index ? "active" : ""}`} />
              <text x={x + 8.5} y="143" textAnchor="middle" className="flow-label">{item.m.slice(0, 3)}</text>
            </g>
          );
        })}
        <path d={profitPath} className="flow-line" />
        {profitPoints.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r={activeIndex === index ? 4 : 2.5} className={`flow-point ${activeIndex === index ? "active" : ""}`} />
        ))}
      </svg>
      <div className="live-flow-legend"><span><i className="bar-key" />Expenses</span><span><i className="line-key" />Net Flow</span></div>
    </div>
  );
}

function Stat({ title, value, note, change, tone, icon: Icon, onClick }) {
  return (
    <div className="stat-card-new">
      <div className="stat-label">
        {title}
        <span className={`stat-icon ${tone}`}>
          <Icon size={20} strokeWidth={2.5} />
        </span>
      </div>
      <button type="button" className="stat-amount" onClick={onClick} aria-label="Toggle dashboard amount visibility">
        {value}
      </button>
      <small>{note}</small>

      <em className={change.includes("↘") ? "negative" : "positive"}>
        {change}
      </em>
    </div>
  );
}
function SummaryCard({ title, children }) {
  return (
    <div className="card summary-card">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
function Metric({ value, label, blue, green, red, purple, orange }) {
  return (
    <div>
      <strong className={`${blue ? "blue" : green ? "green" : red ? "red" : purple ? "purple" : orange ? "orange" : ""}`}>
        {value}
      </strong>
      <span>{label}</span>
    </div>
  );
}
const budgetAllocations = [
  { label: "Operations", value: 38, color: "#2868dc", page: "Department Budget Allocation" },
  { label: "Payroll", value: 32, color: "#f5a000", page: "Employee Payroll Allocation" },
  { label: "Marketing", value: 15, color: "#12a66b", page: "Department Budget Allocation" },
  { label: "Admin", value: 10, color: "#8a68d8", page: "Department Budget Allocation" },
  { label: "Other", value: 5, color: "#aab7bf", page: "Department Budget Allocation" },
];

function RowDot({ item, active, onHover, onLeave, onClick }) {
  return (
    <button
      type="button"
      className={`allocation-row ${active ? "is-hovered" : ""}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      title={`Open ${item.page}`}
    >
      <span>
        <i style={{ background: item.color }}></i>
        {item.label}
      </span>
      <b>{item.value}%</b>
    </button>
  );
}

function Donut({ navigate }) {
  const [hovered, setHovered] = useState(null);
  const totalBudget = 4200000;
  const size = 170;
  const center = size / 2;
  const radius = 58;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  const formatBudget = (value) =>
    `₱${(value / 1000000).toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}M`;

  return (
    <div className="donut-wrapper">
      <div className="donut-visual">
        <svg
          className="donut-svg"
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label="Budget allocation by department"
          onMouseLeave={() => setHovered(null)}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#e9eff3"
            strokeWidth={strokeWidth}
          />
          {budgetAllocations.map((item, index) => {
            const segmentLength = circumference * (item.value / 100);
            const offset = -circumference * (accumulated / 100);
            accumulated += item.value;
            return (
              <circle
                key={item.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={hovered === index ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${center} ${center})`}
                className="donut-segment"
                onMouseEnter={() => setHovered(index)}
                onClick={() => navigate(item.page)}
              />
            );
          })}
        </svg>

        <div className="donut-center">
          <strong>₱4.2M</strong>
          <span>Total Budget</span>
        </div>

        {hovered !== null && (
          <div className="donut-tooltip">
            <strong>{budgetAllocations[hovered].label}</strong>
            <b>{budgetAllocations[hovered].value}%</b>
            <span>{formatBudget(totalBudget * budgetAllocations[hovered].value / 100)} allocated</span>
          </div>
        )}
      </div>
    </div>
  );
}

function FinancialChart() {
  const max = 2400000;
  const [hovered, setHovered] = useState(null);
  const chartWidth = 600;
  const chartHeight = 220;
  const bottom = 210;
  const top = 25;
  const getY = (value) =>
    bottom - (value / max) * (bottom - top);
  const revenuePoints = monthly.map((item, index) => ({
    x: index * 120,
    y: getY(item.revenue),
    value: item.revenue,
    percentage: (item.revenue / max) * 100,
  }));

  const expensePoints = monthly.map((item, index) => ({
    x: index * 120,
    y: getY(item.expense),
    value: item.expense,
    percentage: (item.expense / max) * 100,
  }));

  const profitPoints = monthly.map((item, index) => {
    const profit = item.revenue - item.expense;
    return {
      x: index * 120,
      y: getY(profit),
      value: profit,
      percentage: (profit / max) * 100,
    };
  });

  const smoothPath = (points) => {
    if (!points.length) return "";
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = (current.x + next.x) / 2;
      path += ` C ${controlX} ${current.y},
        ${controlX} ${next.y},
        ${next.x} ${next.y}`;
    }

    return path;
  };
  const revenuePath = smoothPath(revenuePoints);
  const expensePath = smoothPath(expensePoints);
  const profitPath = smoothPath(profitPoints);
  const handleMouseMove = (event) => {

    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX =
      ((event.clientX - rect.left) / rect.width) * chartWidth;
    const index = Math.round(mouseX / 120);
    if (index >= 0 && index < monthly.length) {
      setHovered(index);
    }
  };
  const handleMouseLeave = () => {
    setHovered(null);
  };
  const currentMonth =
    hovered !== null ? monthly[hovered] : null;
  const currentProfit =
    currentMonth
      ? currentMonth.revenue - currentMonth.expense
      : 0;
  return (
    <div className="financial-chart">

      <div className="y-labels">
        <span>₱2.4M</span>
        <span>₱1.8M</span>
        <span>₱1.2M</span>
        <span>₱0.6M</span>
        <span>₱0.0M</span>
      </div>
      <div className="plot">
        <div className="grid-bg">
          {[1, 2, 3, 4].map((i) => (
            <span key={i}></span>
          ))}
        </div>
        <svg
          viewBox="0 0 600 220"
          preserveAspectRatio="none"
          className="chart-svg"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Revenue area */}
          <path
            d={`${revenuePath} L 600 210 L 0 210 Z`}
            fill="url(#revenueGradient)"
          />
          {/* Expense area */}
          <path
            d={`${expensePath} L 600 210 L 0 210 Z`}
            fill="url(#expenseGradient)"
          />
          {/* Profit area */}
          <path
            d={`${profitPath} L 600 210 L 0 210 Z`}
            fill="url(#profitGradient)"
          />
          {/* Revenue line */}
          <path
            d={revenuePath}
            fill="none"
            className="line revenue-line"
          />
          {/* Expense line */}
          <path
            d={expensePath}
            fill="none"
            className="line expense-line"
          />
          {/* Profit line */}
          <path
            d={profitPath}
            fill="none"
            className="line profit-line"
          />
          {/* Hover guide */}
          {hovered !== null && (
            <>
              <line
                x1={hovered * 120}
                y1="20"
                x2={hovered * 120}
                y2="210"
                className="hover-line"
              />
              <circle
                cx={hovered * 120}
                cy={revenuePoints[hovered].y}
                r="5"
                className="hover-dot revenue-dot"
              />
              <circle
                cx={hovered * 120}
                cy={expensePoints[hovered].y}
                r="5"
                className="hover-dot expense-dot"
              />
              <circle
                cx={hovered * 120}
                cy={profitPoints[hovered].y}
                r="5"
                className="hover-dot profit-dot"
              />
            </>
          )}

          <defs>
            <linearGradient
              id="revenueGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#2f6df6"
                stopOpacity="0.12"
              />
              <stop
                offset="100%"
                stopColor="#2f6df6"
                stopOpacity="0"
              />
            </linearGradient>

            <linearGradient
              id="expenseGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#ef4b4b"
                stopOpacity="0.08"
              />
              <stop
                offset="100%"
                stopColor="#ef4b4b"
                stopOpacity="0"
              />
            </linearGradient>

            <linearGradient
              id="profitGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#10b981"
                stopOpacity="0.08"
              />
              <stop
                offset="100%"
                stopColor="#10b981"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>
        </svg>

        {/* Clean hover tooltip */}
        {hovered !== null && currentMonth && (
          <div
            className="financial-tooltip"
            style={{
              left: `${(hovered / (monthly.length - 1)) * 100}%`,
            }}
          >
            <div className="tooltip-title">
              {currentMonth.m}
            </div>

            <div className="tooltip-row revenue">
              <span>
                <i></i>
                Revenue
              </span>
              <strong>
                {money(currentMonth.revenue)}
              </strong>
              <small>
                {((currentMonth.revenue / max) * 100).toFixed(1)}%
              </small>
            </div>

            <div className="tooltip-row expense">
              <span>
                <i></i>
                Expenses
              </span>
              <strong>
                {money(currentMonth.expense)}
              </strong>
              <small>
                {((currentMonth.expense / max) * 100).toFixed(1)}%
              </small>
            </div>

            <div className="tooltip-row profit">
              <span>
                <i></i>
                Profit
              </span>
              <strong>
                {money(currentProfit)}
              </strong>
              <small>
                {((currentProfit / max) * 100).toFixed(1)}%
              </small>
            </div>
          </div>
        )}

        <div className="x-labels">
          {monthly.map((x) => (
            <span key={x.m}>{x.m}</span>
          ))}
        </div>

      </div>
    </div>
  );
}

function ContractPage({ contracts: rows, onNew, onArchive, onUpload }) {
  const today = new Date();
  const getExpirationState = (endDate, originalStatus) => {
    const end = new Date(endDate);
    const diff = Math.ceil((end - today) / 86400000);
    if (diff < 0) return "Expired";
    if (diff <= 92) return "Expiring Soon";
    return originalStatus || "Active";
  };

  const printContract = (c) => {
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>${c.id}</title></head><body style="font-family:Arial;padding:40px"><h1>PRIMEPOWER - Client Contract</h1><hr/><p><b>Contract ID:</b> ${c.id}</p><p><b>Client:</b> ${c.client}</p><p><b>Contract Value:</b> ${money(c.value)}</p><p><b>Start Date:</b> ${c.start}</p><p><b>End Date:</b> ${c.end}</p><p><b>Status:</b> ${getExpirationState(c.end, c.status)}</p><h3>Supporting Documents</h3><p>${(c.documents || []).map(d => d.name).join(", ") || "None"}</p><script>window.print()</script></body></html>`);
    w.document.close();
  };

  return <section className="management-page">
    <Breadcrumb current="Client Contract Management" parent="Client Billing Management" />
    <div className="management-header">
      <div><h2>Client Contract Management</h2><p>Track contracts, automatic 3-month expiration alerts, documents, and archive status.</p></div>
      <div className="management-actions"><button className="light-button"><FileDown size={15}/> Export</button><button className="primary-button" onClick={onNew}>＋ New Contract</button></div>
    </div>
    <div className="alert-strip"><AlertTriangle size={17}/><span><b>Automatic trigger:</b> contracts ending within 3 months are marked <b>Expiring Soon</b> and added to Notification History.</span></div>
    <div className="table-card contract-card"><table><thead><tr><th>Contract ID</th><th>Client</th><th>Contract Value</th><th>Start Date</th><th>End Date</th><th>Status</th><th>Documents</th><th>Actions</th></tr></thead><tbody>
      {rows.map(c => {
        const status = getExpirationState(c.end, c.status);
        return <tr key={c.id}>
          <td className="link-cell">{c.id}</td><td className="strong-cell">{c.client}</td><td className="money-cell">{money(c.value)}</td><td>{c.start}</td><td>{c.end}</td>
          <td><span className={`contract-status ${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span></td>
          <td>
  <label className="upload-label"><Upload size={14}/> PDF<input type="file" accept="application/pdf" hidden onChange={e => onUpload(c.id, e.target.files?.[0])}/></label>
  {c.documents?.length ? (
    <div className="saved-documents">
      <small>{c.documents.length} saved</small>
      {c.documents.map(d => (
        <button key={d.id || d.name} type="button" className="document-link" onClick={() => openSavedPDF(d.id)}>
          <FileText size={13}/> Open
        </button>
      ))}
    </div>
  ) : null}
</td>
          <td><div className="row-actions"><button title="Print / Save PDF" onClick={() => printContract(c)}><Printer size={15}/></button><button title="Archive" onClick={() => onArchive(c)}><Archive size={15}/></button></div></td>
        </tr>;
      })}
    </tbody></table></div>
  </section>;
}

function Breadcrumb({ parent, current }) { return <div className="breadcrumb"><span>Dashboard</span><b>›</b><span>{parent}</span><b>›</b><strong>{current}</strong></div>; }
const descriptions = {
  "Billing Generation": "Generate and monitor client billing documents.", "Service Invoice Management": "Create, track, and manage service invoices.", "Billing Schedule Monitoring": "Monitor upcoming and completed billing schedules.", "Client Account Monitoring": "Monitor client balances, billing activity, and account status.",
  "Payment Recording": "Record payments received from clients.", "Outstanding Balance Tracking": "Track outstanding client balances and due amounts.", "Aging of Receivables": "Analyze receivables by aging period.", "Client Payment History": "Review client payment records and history.",
  "Collection Scheduling": "Schedule collection activities and due dates.", "Collection Follow-ups": "Manage collection reminders and follow-ups.", "Official Receipt Generation": "Prepare official receipts for collected payments.", "Collection Monitoring": "Monitor collection performance and overdue accounts.",
  "Supplier Payment Management": "Manage payments to suppliers and service providers.", "Utility Payment Management": "Track utility bills and payment schedules.", "Office Expense Management": "Record and monitor office operating expenses.", "Vendor Payment Tracking": "Track vendor obligations and payment status.",
  "Employee Payroll Allocation": "Allocate available funds for employee payroll.", "Salary Fund Monitoring": "Monitor the salary fund against payroll requirements.", "Payroll Release Tracking": "Track payroll releases and remaining funds.",
  "Department Budget Allocation": "Allocate budgets across company departments.", "Budget Requests": "Review and process department budget requests.", "Budget Monitoring": "Monitor budget utilization and remaining allocations.", "Budget Adjustments": "Record approved budget adjustments.",
  "Cash Inflow Monitoring": "Monitor incoming cash from clients and other sources.", "Cash Outflow Monitoring": "Monitor outgoing cash for expenses and obligations.", "Bank Account Management": "Manage company bank accounts and balances.", "Cash Flow Tracking": "Track cash movement and projected cash flow.",
  "Income Statement": "View revenue, expenses, and net income for a selected period.", "Expense Reports": "Generate detailed reports of company expenses.", "Revenue Reports": "Generate revenue reports by client and period.", "Profit Analysis": "Analyze profitability and financial performance.",
  "Client Revenue Analytics": "Analyze revenue contribution by client.", "Payroll Cost Analytics": "Analyze payroll costs and trends.", "Budget Utilization Analytics": "Analyze department budget utilization.", "Financial KPI Monitoring": "Monitor key financial performance indicators.",
  "Tax Calculation": "Calculate estimated tax obligations from financial records.", "Tax Records": "Maintain organized tax records and supporting data.", "Tax Filing Preparation": "Prepare data required for tax filing.", "Compliance Monitoring": "Monitor tax and financial compliance activities.",
  "Archived Records": "Search, filter, restore, and manage archived financial records.",
  "Archive History": "Review every archive and restore action performed in the system.",
  "Audit Trail": "Review important system actions and record changes.",
  "Notification History": "Review contract expiration and system notifications.",
  "User Permissions": "Manage user roles and access permissions.",
  "Admin Profile": "Manage the administrator name, contact email, profile picture, and password.",
  "User Accounts": "Add, edit, deactivate, and manage system users.",
  "Roles & Permissions": "Control what each user can view, create, edit, delete, and approve.",
  "Security": "Configure password policy, session timeout, login attempts, and two-factor authentication.",
  "Notifications": "Configure contract, payment, budget, and system alerts.",
  "Financial Configuration": "Configure currency, tax, invoice, official receipt, and payment methods.",
  "Bank Accounts": "Manage registered company or agency bank accounts.",
  "Archive Settings": "Configure archive rules, restore permissions, and retention periods.",
  "Audit Settings": "Configure administrator and user activity monitoring.",
  "Backup & Restore": "Create backups and restore system data.",
  "System Preferences": "Manage agency information, logo, date format, time zone, and fiscal year.",
};

const adminSettingsPages = [
  "Admin Profile", "User Accounts", "Roles & Permissions", "Security", "Notifications",
  "Financial Configuration", "Bank Accounts", "Archive Settings", "Audit Settings",
  "Backup & Restore", "System Preferences",
];

function VendorPaymentTrackingPage({ onNew }) {
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [filterDate, setFilterDate] = useState("All Dates");
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(vendorPaymentRecords[0]);
  const [showAmount, setShowAmount] = useState({ total: false, pending: false, paid: false, overdue: false });

  const payableTotal = vendorPaymentRecords.reduce((sum, r) => sum + r.amount, 0);
  const paidTotal = vendorPaymentRecords.filter(r => r.status === "Paid").reduce((sum, r) => sum + r.amount, 0);
  const pendingTotal = vendorPaymentRecords.filter(r => r.status === "Pending").reduce((sum, r) => sum + r.amount, 0);
  const overdueTotal = vendorPaymentRecords.filter(r => r.status === "Overdue").reduce((sum, r) => sum + r.amount, 0);

  const dateInThisMonth = (dateText) => {
    const date = new Date(dateText);
    if (Number.isNaN(date.getTime())) return false;
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  const dateInNextMonth = (dateText) => {
    const date = new Date(dateText);
    if (Number.isNaN(date.getTime())) return false;
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return date.getMonth() === nextMonth.getMonth() && date.getFullYear() === nextMonth.getFullYear();
  };

  const filteredRecords = vendorPaymentRecords.filter(r => {
    const matchesStatus = filterStatus === "All Status" || r.status === filterStatus;
    let matchesDate = true;
    if (filterDate === "This Month") matchesDate = dateInThisMonth(r.dueDate);
    if (filterDate === "Next Month") matchesDate = dateInNextMonth(r.dueDate);

    const phrase = `${r.vendor} ${r.invoice} ${r.id} ${r.paymentReference} ${r.po}`.toLowerCase();
    const matchesSearch = phrase.includes(search.toLowerCase());
    return matchesStatus && matchesDate && matchesSearch;
  });

  return <section className="management-page vendor-payment-page">
    <Breadcrumb current="Vendor Payment Tracking" parent="Accounts Payable" />
    <div className="management-header">
      <div><h2>VENDOR PAYMENT TRACKING</h2><p>Manage vendor information, invoice details, approval workflow, payment tracking, and supporting documentation.</p></div>
      <div className="management-actions">
        <button className="primary-button" onClick={onNew}>＋ New Vendor Payment</button>
      </div>
    </div>

    <div className="vendor-toolbar">
      <div className="search-box vendor-search"><span>⌕</span><input placeholder="Search Vendor / Invoice..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="vendor-toolbar-controls">
        <select className="vendor-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option>All Status</option>
          <option>Paid</option>
          <option>Pending</option>
          <option>Scheduled</option>
          <option>For Approval</option>
          <option>Overdue</option>
          <option>Cancelled</option>
        </select>
        <select className="vendor-select" value={filterDate} onChange={e => setFilterDate(e.target.value)}>
          <option>All Dates</option>
          <option>This Month</option>
          <option>Next Month</option>
        </select>
      </div>
    </div>

    <div className="vendor-summary-grid">
      <div className={`vendor-summary-card ${filterStatus === "All Status" ? "selected" : ""}`} onClick={() => {
        setFilterStatus("All Status");
        setShowAmount(prev => ({ ...prev, total: !prev.total }));
      }} role="button" tabIndex="0" onKeyDown={e => { if (e.key === "Enter") { setFilterStatus("All Status"); setShowAmount(prev => ({ ...prev, total: !prev.total })); } }}>
        <span className="vendor-summary-label">Total Payable</span>
        <strong className={`vendor-summary-amount ${showAmount.total ? "total-payable-amount" : ""}`}>{showAmount.total ? money(payableTotal) : "*****"}</strong>
      </div>
      <div className={`vendor-summary-card ${filterStatus === "Pending" ? "selected" : ""}`} onClick={() => {
        setFilterStatus("Pending");
        setShowAmount(prev => ({ ...prev, pending: !prev.pending }));
      }} role="button" tabIndex="0" onKeyDown={e => { if (e.key === "Enter") { setFilterStatus("Pending"); setShowAmount(prev => ({ ...prev, pending: !prev.pending })); } }}>
        <span className="vendor-summary-label">Pending</span>
        <strong className={`vendor-summary-amount ${showAmount.pending ? "pending-amount" : ""}`}>{showAmount.pending ? money(pendingTotal) : "*****"}</strong>
      </div>
      <div className={`vendor-summary-card ${filterStatus === "Paid" ? "selected" : ""}`} onClick={() => {
        setFilterStatus("Paid");
        setShowAmount(prev => ({ ...prev, paid: !prev.paid }));
      }} role="button" tabIndex="0" onKeyDown={e => { if (e.key === "Enter") { setFilterStatus("Paid"); setShowAmount(prev => ({ ...prev, paid: !prev.paid })); } }}>
        <span className="vendor-summary-label">Paid</span>
        <strong className={`vendor-summary-amount ${showAmount.paid ? "paid-amount" : ""}`}>{showAmount.paid ? money(paidTotal) : "*****"}</strong>
      </div>
      <div className={`vendor-summary-card ${filterStatus === "Overdue" ? "selected" : ""}`} onClick={() => {
        setFilterStatus("Overdue");
        setShowAmount(prev => ({ ...prev, overdue: !prev.overdue }));
      }} role="button" tabIndex="0" onKeyDown={e => { if (e.key === "Enter") { setFilterStatus("Overdue"); setShowAmount(prev => ({ ...prev, overdue: !prev.overdue })); } }}>
        <span className="vendor-summary-label">Overdue</span>
        <strong className={`vendor-summary-amount ${showAmount.overdue ? "overdue-amount" : ""}`}>{showAmount.overdue ? money(overdueTotal) : "*****"}</strong>
      </div>
    </div>

    <section className="vendor-record-panel">
      <div className="vendor-record-heading">
        <h3>Payment Records</h3>
      </div>
      <div className="table-card vendor-table-card">
        <table>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Vendor</th>
              <th>Invoice</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length ? filteredRecords.map(r => <tr key={r.id} onClick={() => setSelectedRecord(r)} className={selectedRecord.id === r.id ? "selected-row" : ""}>
              <td className="link-cell">{r.id}</td>
              <td className="strong-cell">{r.vendor}</td>
              <td>{r.invoice}</td>
              <td>{r.dueDate}</td>
              <td className="money-cell">{money(r.amount)}</td>
              <td><span className={`contract-status ${r.status.toLowerCase().replaceAll(" ", "-")}`}>{r.status}</span></td>
              <td><div className="row-actions"><button title="View">⌕</button><button title="Edit">✎</button><button title="Record Payment">✓</button><button title="Print"><Printer size={15}/></button></div></td>
            </tr>) : <tr><td colSpan="7" className="empty">No payment records found.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>

    <section className="vendor-detail-panel">
      <div className="vendor-detail-header">
        <div>
          <span className="vendor-detail-kicker">Payment ID / Reference Number</span>
          <h3>{selectedRecord.id}</h3>
        </div>
        <span className={`contract-status ${selectedRecord.status.toLowerCase().replaceAll(" ", "-")}`}>{selectedRecord.status}</span>
      </div>
      <div className="vendor-detail-grid">
        <div className="vendor-detail-block">
          <h4>Vendor Information</h4>
          <div className="vendor-detail-list">
            <div><span>Vendor/Supplier Name</span><b>{selectedRecord.vendor}</b></div>
            <div><span>Vendor ID</span><b>VEN-{selectedRecord.id.replace("VP-", "")}</b></div>
            <div><span>Contact Person</span><b>Admin Contact</b></div>
            <div><span>Contact Number / Email</span><b>+63 912 345 6789 / vendor@example.com</b></div>
            <div><span>Address</span><b>PrimePower Business Plaza</b></div>
            <div><span>Bank / Payment Details</span><b>{selectedRecord.paymentMethod}</b></div>
          </div>
        </div>
        <div className="vendor-detail-block">
          <h4>Payment Information</h4>
          <div className="vendor-detail-list">
            <div><span>Invoice Number</span><b>{selectedRecord.invoice}</b></div>
            <div><span>Purchase Order (PO)</span><b>{selectedRecord.po}</b></div>
            <div><span>Payment Date</span><b>{selectedRecord.datePaid || "—"}</b></div>
            <div><span>Due Date</span><b>{selectedRecord.dueDate}</b></div>
            <div><span>Payment Method</span><b>{selectedRecord.paymentMethod}</b></div>
            <div><span>Payment Amount</span><b>{money(selectedRecord.amount)}</b></div>
          </div>
        </div>
        <div className="vendor-detail-block">
          <h4>Invoice Details</h4>
          <div className="vendor-detail-list">
            <div><span>Invoice Date</span><b>{selectedRecord.dueDate}</b></div>
            <div><span>Invoice Amount</span><b>{money(selectedRecord.amount)}</b></div>
            <div><span>Description</span><b>Goods / Services</b></div>
            <div><span>Tax / VAT Amount</span><b>{money(selectedRecord.amount * 0.12)}</b></div>
            <div><span>Discount</span><b>{money(0)}</b></div>
            <div><span>Total Amount Due</span><b>{money(selectedRecord.amount)}</b></div>
          </div>
        </div>
        <div className="vendor-detail-block">
          <h4>Payment Tracking</h4>
          <div className="vendor-detail-list">
            <div><span>Amount Paid</span><b>{selectedRecord.status === "Paid" ? money(selectedRecord.amount) : money(0)}</b></div>
            <div><span>Remaining Balance</span><b>{selectedRecord.status === "Paid" ? money(0) : money(selectedRecord.amount)}</b></div>
            <div><span>Partial Payment History</span><b>None</b></div>
            <div><span>Payment Reference</span><b>{selectedRecord.paymentReference || "—"}</b></div>
            <div><span>Date Paid</span><b>{selectedRecord.datePaid || "—"}</b></div>
            <div><span>Processed By</span><b>{selectedRecord.preparedBy}</b></div>
          </div>
        </div>
        <div className="vendor-detail-block">
          <h4>Approval & Verification</h4>
          <div className="vendor-detail-list">
            <div><span>Prepared By</span><b>{selectedRecord.preparedBy}</b></div>
            <div><span>Verified By</span><b>{selectedRecord.verifiedBy}</b></div>
            <div><span>Approved By</span><b>{selectedRecord.approvedBy || "Pending"}</b></div>
            <div><span>Approval Date</span><b>{selectedRecord.datePaid || "—"}</b></div>
            <div><span>Remarks</span><b>Awaiting review</b></div>
            <div><span>Approval Status</span><b>{selectedRecord.status}</b></div>
          </div>
        </div>
      </div>
    </section>
  </section>;
}

function SupplyPaymentManagementPage({ onNew }) {
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [filterDate, setFilterDate] = useState("All Dates");
  const [search, setSearch] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("Supply Payment");
  const [records, setRecords] = useState(supplyPaymentRecords);
  const [selectedRecord, setSelectedRecord] = useState(supplyPaymentRecords[0]);
  const [showAmount, setShowAmount] = useState({ total: false, pending: false, paid: false, overdue: false });

  const paymentMethodRows = ["Supply Payment", "Cash Payment", "Check Payment", "Bank Payment"];
  const methodDetailTitle = {
    "Supply Payment": "Supply Payment / Record",
    "Cash Payment": "Cash Payment / Record",
    "Check Payment": "Check Payment / Record",
    "Bank Payment": "Bank Payment / Record",
  };

  const recordMap = {
    "Supply Payment": supplyPaymentRecords,
    "Cash Payment": cashPaymentRecords,
    "Check Payment": checkPaymentRecords,
    "Bank Payment": bankPaymentRecords,
  };

  const currentRecords = recordMap[selectedMethod];

  const total = currentRecords.reduce((sum, r) => sum + r.amount, 0);
  const pending = currentRecords.filter(r => r.status === "Pending").reduce((sum, r) => sum + r.amount, 0);
  const paid = currentRecords.filter(r => r.status === "Paid").reduce((sum, r) => sum + r.amount, 0);

  const saveSupplyPDF = async (record, file) => {
    if (!file || file.type !== "application/pdf") {
      window.alert("Please upload a PDF supporting document.");
      return;
    }

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const documentId = `${record.id}-${Date.now()}`;
      const uploadedAt = new Date().toLocaleString();
      const db = await openDocumentDB();
      await savePDFToDB(db, {
        id: documentId,
        paymentId: record.id,
        paymentMethod: selectedMethod,
        name: file.name,
        size: file.size,
        uploadedAt,
        dataUrl,
      });

      const doc = {
        id: documentId,
        name: file.name,
        size: file.size,
        uploadedAt,
      };

      setRecords(prev => prev.map(item => item.id === record.id ? { ...item, documents: [...(item.documents || []), doc] } : item));
      setSelectedRecord({ ...record, documents: [...(record.documents || []), doc] });
      window.alert("PDF saved successfully.");
    } catch (error) {
      console.error(error);
      window.alert("The PDF could not be saved. Please try again.");
    }
  };

  const printSupplyRecord = (record) => {
    const docLines = (record.documents || []).length
      ? `<ul>${(record.documents || []).map(d => `<li>${d.name} (${d.uploadedAt})</li>`).join("")}</ul>`
      : "<p>No supporting document uploaded.</p>";

    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>${record.id}</title></head><body style="font-family:Arial;padding:40px">
      <h1>PRIMEPOWER - Supply Payment</h1><hr/>
      <p><b>Payment ID:</b> ${record.id}</p>
      <p><b>Supplier:</b> ${record.supplier}</p>
      <p><b>PO No.:</b> ${record.po}</p>
      <p><b>Invoice:</b> ${record.invoice}</p>
      <p><b>Amount:</b> ${money(record.amount)}</p>
      <p><b>Date:</b> ${record.date}</p>
      <p><b>Status:</b> ${record.status}</p>
      <p><b>Payment Method:</b> ${selectedMethod}</p>
      <h3>Supporting Documents</h3>${docLines}
      <script>window.print()</script></body></html>`);
    w.document.close();
  };

  const dateInThisMonth = (dateText) => {
    const date = new Date(dateText);
    if (Number.isNaN(date.getTime())) return false;
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  const dateInNextMonth = (dateText) => {
    const date = new Date(dateText);
    if (Number.isNaN(date.getTime())) return false;
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return date.getMonth() === nextMonth.getMonth() && date.getFullYear() === nextMonth.getFullYear();
  };

  const filteredRecords = records.filter(r => {
    const matchesStatus = filterStatus === "All Status" || r.status === filterStatus;
    let matchesDate = true;
    if (filterDate === "This Month") matchesDate = dateInThisMonth(r.date);
    if (filterDate === "Next Month") matchesDate = dateInNextMonth(r.date);

    const phrase = `${r.supplier} ${r.po} ${r.invoice} ${r.id}`.toLowerCase();
    const matchesSearch = phrase.includes(search.toLowerCase());
    return matchesStatus && matchesDate && matchesSearch;
  });

  return <section className="management-page vendor-payment-page">
    <Breadcrumb current="Supplier Payment Management" parent="Accounts Payable" />
    <div className="management-header">
      <div><h2>SUPPLY PAYMENT MANAGEMENT</h2><p>Monitor purchase orders, invoices, approval workflow, payment amounts, and payment history for supply purchases.</p></div>
      <div className="management-actions">
        <button className="primary-button" onClick={onNew}>＋ New Supply Payment</button>
      </div>
    </div>

    <div className="payment-methods">
      <span className="payment-method-label">Payment Method</span>
      {paymentMethodRows.map(method => (
        <button key={method} className={`payment-method ${selectedMethod === method ? "selected" : ""}`} onClick={() => {
          setSelectedMethod(method);
          setSelectedRecord(recordMap[method][0]);
        }}>{method}</button>
      ))}
    </div>

    <div className="vendor-toolbar">
      <div className="search-box vendor-search"><span>⌕</span><input placeholder="Search supplier, PO, invoice..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="vendor-toolbar-controls">
        <select className="vendor-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option>All Status</option>
          <option>Paid</option>
          <option>Pending</option>
          <option>Scheduled</option>
          <option>For Approval</option>
          <option>Overdue</option>
          <option>Cancelled</option>
        </select>
        <select className="vendor-select" value={filterDate} onChange={e => setFilterDate(e.target.value)}>
          <option>All Dates</option>
          <option>This Month</option>
          <option>Next Month</option>
        </select>
      </div>
    </div>

    <div className="vendor-summary-grid">
      <div className="vendor-summary-card" onClick={() => setShowAmount(prev => ({ ...prev, total: !prev.total }))} role="button" tabIndex="0" onKeyDown={e => { if (e.key === "Enter") setShowAmount(prev => ({ ...prev, total: !prev.total })); }}>
        <span className="vendor-summary-label">Total Supplies</span>
        <strong className={`vendor-summary-amount ${showAmount.total ? "total-supplies-amount" : ""}`}>{showAmount.total ? money(total) : "*****"}</strong>
      </div>
      <div className="vendor-summary-card" onClick={() => setShowAmount(prev => ({ ...prev, pending: !prev.pending }))} role="button" tabIndex="0" onKeyDown={e => { if (e.key === "Enter") setShowAmount(prev => ({ ...prev, pending: !prev.pending })); }}>
        <span className="vendor-summary-label">Pending</span>
        <strong className={`vendor-summary-amount ${showAmount.pending ? "pending-amount" : ""}`}>{showAmount.pending ? money(pending) : "*****"}</strong>
      </div>
      <div className="vendor-summary-card" onClick={() => setShowAmount(prev => ({ ...prev, paid: !prev.paid }))} role="button" tabIndex="0" onKeyDown={e => { if (e.key === "Enter") setShowAmount(prev => ({ ...prev, paid: !prev.paid })); }}>
        <span className="vendor-summary-label">Paid</span>
        <strong className={`vendor-summary-amount ${showAmount.paid ? "paid-amount" : ""}`}>{showAmount.paid ? money(paid) : "*****"}</strong>
      </div>
      <div className="vendor-summary-card" onClick={() => setShowAmount(prev => ({ ...prev, overdue: !prev.overdue }))} role="button" tabIndex="0" onKeyDown={e => { if (e.key === "Enter") setShowAmount(prev => ({ ...prev, overdue: !prev.overdue })); }}>
        <span className="vendor-summary-label">Overdue</span>
        <strong className={`vendor-summary-amount ${showAmount.overdue ? "overdue-amount" : ""}`}>{showAmount.overdue ? money(0) : "*****"}</strong>
      </div>
    </div>

    <section className="vendor-record-panel">
      <div className="vendor-record-heading">
        <h3>Supply Payments</h3>
      </div>
      <div className="table-card vendor-table-card">
        <table>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Supplier</th>
              <th>PO No.</th>
              <th>Invoice</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length ? filteredRecords.map(r => <tr key={r.id} onClick={() => setSelectedRecord(r)} className={selectedRecord.id === r.id ? "selected-row" : ""}>
              <td className="link-cell">{r.id}</td>
              <td className="strong-cell">{r.supplier}</td>
              <td>{r.po}</td>
              <td>{r.invoice}</td>
              <td className="money-cell">{money(r.amount)}</td>
              <td>{r.date}</td>
              <td><span className={`contract-status ${r.status.toLowerCase().replaceAll(" ", "-")}`}>{r.status}</span></td>
              <td>
                <div className="row-actions">
                  <button title="View">⌕</button>
                  <button title="Edit">✎</button>
                  <button title="Approve">✓</button>
                  <label className="upload-label" title="Upload PDF">
                    <Upload size={14} />
                    <input type="file" accept="application/pdf" hidden onChange={e => saveSupplyPDF(r, e.target.files?.[0])} />
                  </label>
                  {(r.documents || []).length > 0 && <button className="document-link" title="Open PDF" onClick={() => openSavedPDF(r.documents[0].id)}><FileText size={15}/></button>}
                  <button title="Print" onClick={() => printSupplyRecord(r)}><Printer size={15}/></button>
                </div>
              </td>
            </tr>) : <tr><td colSpan="8" className="empty">No supply payments found.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>

    <section className="vendor-detail-panel">
      <div className="vendor-detail-header">
        <div>
          <span className="vendor-detail-kicker">{methodDetailTitle[selectedMethod]}</span>
          <h3>{selectedRecord.id}</h3>
        </div>
        <span className={`contract-status ${selectedRecord.status.toLowerCase().replaceAll(" ", "-")}`}>{selectedRecord.status}</span>
      </div>
      <div className="vendor-detail-grid">
        <div className="vendor-detail-block">
          <h4>Supply Information</h4>
          <div className="vendor-detail-list">
            <div><span>Supplier</span><b>{selectedRecord.supplier}</b></div>
            <div><span>PO Number</span><b>{selectedRecord.po}</b></div>
            <div><span>Invoice</span><b>{selectedRecord.invoice}</b></div>
            <div><span>Amount</span><b>{money(selectedRecord.amount)}</b></div>
            <div><span>Date</span><b>{selectedRecord.date}</b></div>
            <div><span>Status</span><b>{selectedRecord.status}</b></div>
          </div>
        </div>
        <div className="vendor-detail-block">
          <h4>Payment Method</h4>
          <div className="vendor-detail-list">
            <div><span>Method</span><b>{selectedMethod}</b></div>
            <div><span>Approval Stage</span><b>{selectedRecord.status}</b></div>
            <div><span>Account</span><b>Accounts Payable</b></div>
            <div><span>Supporting Document</span><b>{(selectedRecord.documents || []).length ? selectedRecord.documents.map(d => d.name).join(", ") : "PO / Invoice"}</b></div>
            <div><span>Action</span><b>Record {selectedMethod}</b></div>
            <div><span>Owner</span><b>Finance Staff</b></div>
          </div>
        </div>
      </div>
    </section>
  </section>;
}

function ModulePage({ page, onNew, transactions }) {
  const isReport = ["Income Statement", "Expense Reports", "Revenue Reports", "Profit Analysis"].includes(page);
  const isAnalytics = page.includes("Analytics") || page === "Financial KPI Monitoring";
  const paymentPage = ["Supplier Payment Management", "Utility Payment Management", "Office Expense Management", "Vendor Payment Tracking"].includes(page);

  const printReport = () => {
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>${page}</title></head><body style="font-family:Arial;padding:40px"><h1>PRIMEPOWER Finance Management</h1><h2>${page}</h2><p>Generated: ${new Date().toLocaleString()}</p><hr/><p>Revenue: ${money(2280000)}</p><p>Expenses: ${money(1420000)}</p><p>Net Profit: ${money(860000)}</p><script>window.print()</script></body></html>`);
    w.document.close();
  };

  return <section className="management-page">
    <Breadcrumb current={page} parent={findParent(page)} />
    <div className="management-header">
      <div><h2>{page}</h2><p>{descriptions[page] || "Manage and monitor this financial management activity."}</p></div>
      <div className="management-actions">
        {(isReport || page === "Budget Requests" || paymentPage) && <button className="light-button" onClick={printReport}><Printer size={15}/> Print / Save PDF</button>}
        <button className="primary-button" onClick={onNew}>＋ New Record</button>
      </div>
    </div>
    {paymentPage && <div className="payment-methods"><span className="payment-method-label">Payment Method</span><button className="payment-method">Supply Payment</button><button className="payment-method">Cash Payment</button><button className="payment-method">Check Payment</button><button className="payment-method">Bank Payment</button></div>}
    {isReport ? <ReportContent page={page} onPrint={printReport} /> : isAnalytics ? <AnalyticsContent page={page} /> : <GenericContent page={page} transactions={transactions} />}
  </section>;
}

function findParent(page) { for (const s of sections) for (const i of s.items) if (i.children.includes(page)) return i.name; return "Financial Management"; }

function GenericContent({ page, transactions }) {
  const rows = page === "Payment Recording" ? transactions.filter(x=>x.type==="Income") : page.includes("Expense") || page.includes("Payable") || page.includes("Outflow") ? transactions.filter(x=>x.type==="Expense") : transactions;
  const headers = page === "Aging of Receivables" ? ["Client", "Current", "1–30 Days", "31–60 Days", "61+ Days", "Total Due", "Status"] : page === "Bank Account Management" ? ["Account", "Account Type", "Account No.", "Available Balance", "Status", "Actions"] : ["Reference", "Description", "Category", "Amount", "Date", "Status", "Actions"];
  return <div className="table-card"><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{page === "Aging of Receivables" ? ["Acme Corp","GlobalTech Ltd","Prime Solutions","Horizon Corp"].map((x,i)=><tr key={x}><td className="strong-cell">{x}</td><td>{money(350000-i*30000)}</td><td>{money(120000-i*15000)}</td><td>{money(i*18000)}</td><td>{money(i*5000)}</td><td className="money-cell">{money(470000-i*22000)}</td><td><span className={`contract-status ${i>1?"expiring":"active"}`}>{i>1?"Attention":"Current"}</span></td></tr>) : rows.length ? rows.map((r,i)=><tr key={r.id}><td className="link-cell">REF-{String(i+1).padStart(3,"0")}</td><td className="strong-cell">{r.description}</td><td>{r.category}</td><td className={`money-cell ${r.type === "Expense" ? "red-text" : "green-text"}`}>{r.type === "Expense" ? "-" : "+"}{money(r.amount)}</td><td>{r.date}</td><td><span className={`contract-status ${r.status.toLowerCase()}`}>{r.status}</span></td><td><div className="row-actions"><button>⊙</button><button>⌕</button><button>♧</button></div></td></tr>) : <tr><td colSpan={7} className="empty">No records found.</td></tr>}</tbody></table></div>;
}

function ReportContent({ page, onPrint }) {
  return <div className="report-grid">
    <div className="card report-main">
      <div className="report-heading"><div><h3>{page}</h3><p>Financial report for the current reporting period.</p></div><button className="primary-button" onClick={onPrint}><FileDown size={15}/> Print / Save PDF</button></div>
      <div className="report-lines"><div><span>Revenue</span><b>{money(2280000)}</b></div><div><span>Operating Expenses</span><b>{money(1420000)}</b></div><div><span>Payroll Costs</span><b>{money(720000)}</b></div><div className="total"><span>Net Profit</span><b>{money(860000)}</b></div></div>
    </div>
    <div className="card"><h3>Financial Summary</h3><div className="kpi-list"><div><span>Profit Margin</span><strong>37.7%</strong></div><div><span>Collection Rate</span><strong>82.4%</strong></div><div><span>Budget Utilization</span><strong>74%</strong></div><div><span>Cash Coverage</span><strong>3.2 mo.</strong></div></div></div>
  </div>;
}

function ArchivedPage({ records, onRestore, search }) {
  const filtered = records.filter(r => `${r.id} ${r.client} ${r.status}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="management-page">
    <Breadcrumb current="Archived Records" parent="Archive Management" />
    <div className="management-header"><div><h2>Archived Records</h2><p>Search and restore archived contracts and financial records.</p></div><div className="management-actions"><button className="light-button" onClick={() => window.location.reload()}><RotateCcw size={15}/> Refresh</button></div></div>
    <div className="table-card"><table><thead><tr><th>Record ID</th><th>Client</th><th>Value</th><th>Original End Date</th><th>Archived By</th><th>Archived At</th><th>Action</th></tr></thead><tbody>
      {filtered.length ? filtered.map(r => <tr key={r.id}><td className="link-cell">{r.id}</td><td className="strong-cell">{r.client}</td><td className="money-cell">{money(r.value)}</td><td>{r.end}</td><td>{r.archivedBy || "Admin User"}</td><td>{r.archivedAt || "—"}</td><td><button className="restore-button" onClick={() => onRestore(r)}><ArchiveRestore size={15}/> Restore</button></td></tr>) : <tr><td colSpan="7" className="empty">No archived records found.</td></tr>}
    </tbody></table></div>
  </section>;
}

function HistoryPage({ title, rows }) {
  return <section className="management-page"><Breadcrumb current={title} parent="System Management" /><div className="management-header"><div><h2>{title}</h2><p>{descriptions[title]}</p></div></div><div className="table-card"><table><thead><tr><th>Date</th><th>Action</th><th>Record</th><th>Client / Details</th><th>User</th></tr></thead><tbody>{rows.length ? rows.map(r => <tr key={r.id}><td>{r.date}</td><td><span className="contract-status active">{r.action}</span></td><td className="link-cell">{r.record}</td><td>{r.client || "—"}</td><td>{r.user}</td></tr>) : <tr><td colSpan="5" className="empty">No history records found.</td></tr>}</tbody></table></div></section>;
}

function NotificationHistory({ notifications, setNotifications }) {
  return <section className="management-page"><Breadcrumb current="Notification History" parent="System Monitoring" /><div className="management-header"><div><h2>Notification History</h2><p>Contract expiration alerts and system notifications.</p></div><button className="light-button" onClick={() => setNotifications(prev => prev.map(n => ({ ...n, unread: false })))}><CheckCircle2 size={15}/> Mark all read</button></div><div className="notification-list">{notifications.length ? notifications.map(n => <div className={`notification-item ${n.unread ? "unread" : ""}`} key={n.id}><Bell size={18}/><div><strong>{n.type}</strong><p>{n.message}</p><small>{n.date}</small></div></div>) : <div className="card empty">No notifications found.</div>}</div></section>;
}

function PermissionsPage({ permissions, setPermissions }) {
  const togglePermission = (index, key) => setPermissions(prev => prev.map((u, i) => i === index ? { ...u, [key]: !u[key] } : u));
  return <section className="management-page"><Breadcrumb current="User Permissions" parent="User Management" /><div className="management-header"><div><h2>User Permissions</h2><p>Control access to billing, payments, reports, and archive functions.</p></div></div><div className="table-card"><table><thead><tr><th>User</th><th>Role</th><th>Billing</th><th>Payments</th><th>Reports</th><th>Archive</th></tr></thead><tbody>{permissions.map((u, i) => <tr key={u.user}><td className="strong-cell">{u.user}</td><td>{u.role}</td>{["billing","payments","reports","archive"].map(k => <td key={k}><input type="checkbox" checked={!!u[k]} onChange={() => togglePermission(i, k)} /></td>)}</tr>)}</tbody></table></div></section>;
}

const adminSettingFields = {
  "Admin Profile": [
    { label: "Admin Name", key: "adminName", value: "Admin User" },
    { label: "Email Address", key: "email", value: "admin@primepower.com", type: "email" },
    { label: "Profile Picture", key: "profilePicture", value: "", type: "file" },
    { label: "New Password", key: "password", value: "", type: "password" },
  ],
  "User Accounts": [
    { label: "Default User Role", key: "role", value: "Finance Staff", options: ["Administrator", "Finance Staff", "Viewer"] },
    { label: "Account Status", key: "status", value: "Active", options: ["Active", "Inactive", "Pending"] },
    { label: "Require approval for new users", key: "approval", value: true, type: "toggle" },
  ],
  "Roles & Permissions": [
    { label: "Selected Role", key: "role", value: "Finance Staff", options: ["Administrator", "Finance Staff", "Viewer"] },
    { label: "Can create and edit records", key: "edit", value: true, type: "toggle" },
    { label: "Can delete records", key: "delete", value: false, type: "toggle" },
    { label: "Can approve payments", key: "approve", value: true, type: "toggle" },
  ],
  "Security": [
    { label: "Minimum password length", key: "passwordLength", value: "8", type: "number" },
    { label: "Session timeout (minutes)", key: "timeout", value: "30", type: "number" },
    { label: "Maximum login attempts", key: "attempts", value: "5", type: "number" },
    { label: "Two-factor authentication", key: "twoFactor", value: true, type: "toggle" },
  ],
  "Notifications": [
    { label: "Contract expiration alerts", key: "contracts", value: true, type: "toggle" },
    { label: "Payment alerts", key: "payments", value: true, type: "toggle" },
    { label: "Budget alerts", key: "budgets", value: true, type: "toggle" },
    { label: "System alerts", key: "system", value: true, type: "toggle" },
  ],
  "Financial Configuration": [
    { label: "Currency", key: "currency", value: "PHP - Philippine Peso", options: ["PHP - Philippine Peso", "USD - US Dollar", "EUR - Euro"] },
    { label: "Default tax rate (%)", key: "tax", value: "12", type: "number" },
    { label: "Invoice prefix", key: "invoicePrefix", value: "INV-" },
    { label: "Official receipt prefix", key: "receiptPrefix", value: "OR-" },
    { label: "Payment methods", key: "methods", value: "Cash, Check, Bank Transfer" },
  ],
  "Bank Accounts": [
    { label: "Bank name", key: "bank", value: "BDO Business" },
    { label: "Account name", key: "accountName", value: "PrimePower Corporation" },
    { label: "Account number", key: "accountNumber", value: "•••• •••• 4021" },
    { label: "Account status", key: "status", value: "Active", options: ["Active", "Inactive"] },
  ],
  "Archive Settings": [
    { label: "Archive records after (days)", key: "archiveAfter", value: "365", type: "number" },
    { label: "Allow restore for administrators", key: "restoreAdmin", value: true, type: "toggle" },
    { label: "Retention period (years)", key: "retention", value: "7", type: "number" },
  ],
  "Audit Settings": [
    { label: "Track administrator activities", key: "adminTracking", value: true, type: "toggle" },
    { label: "Track user activities", key: "userTracking", value: true, type: "toggle" },
    { label: "Keep audit records (years)", key: "auditRetention", value: "7", type: "number" },
  ],
  "Backup & Restore": [
    { label: "Backup frequency", key: "frequency", value: "Daily", options: ["Hourly", "Daily", "Weekly"] },
    { label: "Include uploaded documents", key: "documents", value: true, type: "toggle" },
    { label: "Last backup", key: "lastBackup", value: "Not available", type: "readonly" },
  ],
  "System Preferences": [
    { label: "Agency name", key: "agency", value: "PrimePower Corporation" },
    { label: "Date format", key: "dateFormat", value: "MMM D, YYYY", options: ["MMM D, YYYY", "YYYY-MM-DD", "DD/MM/YYYY"] },
    { label: "Time zone", key: "timezone", value: "Asia/Manila", options: ["Asia/Manila", "UTC", "America/New_York"] },
    { label: "Fiscal year starts", key: "fiscalYear", value: "January", options: ["January", "April", "July"] },
  ],
};

function AdminSettingsPage({ page }) {
  const fields = adminSettingFields[page] || [];
  const initialValues = Object.fromEntries(fields.map(field => [field.key, field.value]));
  const [values, setValues] = useState(initialValues);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValues(Object.fromEntries((adminSettingFields[page] || []).map(field => [field.key, field.value])));
    setSaved(false);
  }, [page]);

  const updateValue = (key, value) => {
    setSaved(false);
    setValues(previous => ({ ...previous, [key]: value }));
  };

  return <section className="management-page admin-settings-page">
    <Breadcrumb current={page} parent="Admin Settings" />
    <div className="management-header">
      <div><h2>{page}</h2><p>{descriptions[page]}</p></div>
      <div className="management-actions">
        {page === "Backup & Restore" && <button className="light-button" type="button" onClick={() => setSaved(true)}><RotateCcw size={15}/> Restore Data</button>}
        <button className="primary-button" type="button" onClick={() => setSaved(true)}><CheckCircle2 size={15}/> Save Settings</button>
      </div>
    </div>
    <div className="admin-settings-grid">
      {fields.map(field => <div className="admin-setting-field" key={field.key}>
        <label htmlFor={`setting-${field.key}`}>{field.label}</label>
        {field.type === "toggle" ? (
          <button id={`setting-${field.key}`} type="button" className={`setting-toggle ${values[field.key] ? "enabled" : ""}`} onClick={() => updateValue(field.key, !values[field.key])} aria-pressed={!!values[field.key]}>{values[field.key] ? "Enabled" : "Disabled"}</button>
        ) : field.options ? (
          <select id={`setting-${field.key}`} value={values[field.key]} onChange={event => updateValue(field.key, event.target.value)}>{field.options.map(option => <option key={option}>{option}</option>)}</select>
        ) : (
          <input id={`setting-${field.key}`} type={field.type === "readonly" ? "text" : (field.type || "text")} value={values[field.key]} readOnly={field.type === "readonly"} onChange={event => updateValue(field.key, event.target.value)} />
        )}
      </div>)}
    </div>
    {saved && <div className="settings-saved"><CheckCircle2 size={16}/> Settings saved successfully.</div>}
  </section>;
}

function AnalyticsContent({ page }) {
  return (
    <div className="analytics-grid">
      <Stat title="PRIMARY KPI" value={page === "Client Revenue Analytics" ? "₱2.28M" : "74%"} note="Current period" change="↗ 8.3% vs last period" tone="blue" icon={TrendingUp} />
      <Stat title="TREND" value="12.4%" note="Average monthly change" change="↗ Positive trend" tone="green" icon={TrendingUp} />
      <div className="card analytics-wide">
        <h3>{page}</h3>
        <p>{descriptions[page]}</p>
        <div className="analytics-bars">
          {[58,72,64,81,74,88].map((v,i)=>(
            <div key={i}>
              <span style={{height:`${v}%`}}></span>
              <small>{["Jan","Feb","Mar","Apr","May","Jun"][i]}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TransactionTable() { return <div className="table-wrapper"><table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Account</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead><tbody>{transactions.map(t=><tr key={t.id}><td>{t.date}</td><td className="strong-cell">{t.description}</td><td>{t.category}</td><td>{t.account}</td><td><span className={`badge ${t.type.toLowerCase()}`}>{t.type}</span></td><td className={`money-cell ${t.type === "Income" ? "green-text" : "red-text"}`}>{t.type === "Income" ? "+" : "-"}{money(t.amount)}</td><td><span className={`contract-status ${t.status.toLowerCase()}`}>{t.status}</span></td></tr>)}</tbody></table></div>; }

function Modal({ title, onClose, onAudit }) {
  const [file, setFile] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash Payment");
  const isContract = title.includes("Contract");
  const isPayment = /Payment|Invoice|Receipt|Expense|Revenue|Budget Request/i.test(title);

  return <div className="modal-overlay"><div className="modal">
    <div className="modal-header"><div><h2>{title}</h2><p>Enter the information below to create a new record.</p></div><button onClick={onClose}><X size={20}/></button></div>
    <form onSubmit={e => { e.preventDefault(); onAudit?.(`Created ${title}`); onClose(); }}>
      <div className="form-grid">
        <label>Reference<input placeholder="Auto-generated" /></label>
        <label>Client / Payee<input placeholder="Enter name" /></label>
        <label>Amount<input type="number" placeholder="₱0.00" /></label>
        <label>Date<input type="date" /></label>
        {isContract && <><label>Start Date<input type="date" /></label><label>Expiration Date<input type="date" /></label></>}
        {isPayment && <label>Payment Method<select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}><option>Supply Payment</option><option>Cash Payment</option><option>Check Payment</option><option>Bank Payment</option></select></label>}
        <label className="full">Description<input placeholder="Enter description" /></label>
        <label>Status<select><option>Active</option><option>Pending</option><option>Completed</option></select></label>
        <label>Supporting Document (PDF)<input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} /></label>
        {file && <div className="file-preview full"><FileText size={16}/> {file.name} <span>{Math.round(file.size / 1024)} KB</span></div>}
      </div>
      <div className="modal-footer"><button type="button" className="cancel-button" onClick={onClose}>Cancel</button><button className="save-button">Save Record</button></div>
    </form>
  </div></div>;
}

export default App;
