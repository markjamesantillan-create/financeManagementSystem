import CollectionFollowUpsPage from "./collection_follow_ups_component";
import TaxCompliancePage from "./tax_compliance_component";

import React, { useMemo, useState, useEffect, Component } from "react";
import "./index.css";
import logo from "./assets/logo.jpg";
import PaymentRecordingPage from "./payment_component";
import OutstandingBalancePage from "./outstanding_balance_component";
import AgingReceivablesPage from "./aging_receivables_component";
import ClientPaymentHistoryPage from "./client_payment_history_component";
import CollectionSchedulingPage from "./collection_scheduling_component";
import CollectionMonitoringPage from "./collection_monitoring_component";
import OfficialReceiptGenerationPage from "./official_receipt_generation_component";
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
  Eye,
  EyeOff,
  ArrowRight,
  ExternalLink,
  Calendar,
  Edit3,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import LiveDashboard from "./components/LiveDashboard";
import PesoCoinIcon from "./components/PesoCoinIcon";

const API_BASE = import.meta.env.VITE_API_URL || "";

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
      { name: "Accounts Payable", icon: PhilippinePeso, children: ["Supplier Payment Management", "Utility Payment Management", "Office Expense Management", "Vendor Payment Tracking"] },
      { name: "Tax Management", icon: Calculator, children: ["Tax Calculation", "Tax Records", "Tax Filing Preparation", "Compliance Monitoring"] },
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
  {
    id: "CON-001",
    client: "Acme Corporation",
    company: "Acme Industrial Holdings",
    contactPerson: "Sarah Jenkins",
    contactEmail: "s.jenkins@acmecorp.ph",
    contactPhone: "+63 917 555 0101",
    value: 2400000,
    start: "Jan 1, 2026",
    end: "Dec 31, 2026",
    billingCycle: "Monthly",
    billingAmount: 200000,
    paymentTerms: "Net 30 Days",
    contractType: "Facility Maintenance Service",
    status: "Active",
    renewals: [],
  },
  {
    id: "CON-002",
    client: "GlobalTech",
    company: "GlobalTech Solutions Ltd",
    contactPerson: "Michael Tan",
    contactEmail: "mtan@globaltech.com",
    contactPhone: "+63 918 555 0188",
    value: 1800000,
    start: "Mar 1, 2026",
    end: "Feb 28, 2027",
    billingCycle: "Monthly",
    billingAmount: 150000,
    paymentTerms: "Net 30 Days",
    contractType: "IT & Network Management",
    status: "Active",
    renewals: [],
  },
  {
    id: "CON-003",
    client: "Prime Solutions",
    company: "Prime Solutions Logistics",
    contactPerson: "Elena Rostova",
    contactEmail: "elena@primesolutions.com",
    contactPhone: "+63 920 555 0244",
    value: 960000,
    start: "Jul 1, 2026",
    end: "Jun 30, 2027",
    billingCycle: "Quarterly",
    billingAmount: 240000,
    paymentTerms: "Net 15 Days",
    contractType: "Logistics Management",
    status: "Active",
    renewals: [],
  },
  {
    id: "CON-004",
    client: "Horizon",
    company: "Horizon Development Corp",
    contactPerson: "David Lim",
    contactEmail: "david.lim@horizoncorp.com",
    contactPhone: "+63 919 555 0312",
    value: 3200000,
    start: "Jan 1, 2026",
    end: "Dec 31, 2026",
    billingCycle: "Quarterly",
    billingAmount: 800000,
    paymentTerms: "Net 30 Days",
    contractType: "Energy Infrastructure Service",
    status: "Expiring Soon",
    renewals: [],
  },
  {
    id: "CON-005",
    client: "Delta",
    company: "Delta Commercial Ventures",
    contactPerson: "Grace Santos",
    contactEmail: "grace@deltaventures.ph",
    contactPhone: "+63 917 555 0490",
    value: 540000,
    start: "Sep 1, 2025",
    end: "Aug 31, 2026",
    billingCycle: "Monthly",
    billingAmount: 45000,
    paymentTerms: "Due on Receipt",
    contractType: "General Consulting",
    status: "Expired",
    renewals: [],
  },
];
const seedBillings = [
  {
    id: "BILL-001",
    contractNo: "CON-001",
    client: "Acme Corporation",
    billingPeriod: "September 2026",
    billingDate: "Sep 1, 2026",
    dueDate: "Sep 30, 2026",
    serviceDescription: "Facility Maintenance Service",
    billingCycle: "Monthly",
    contractAmount: 2400000,
    billingAmount: 200000,
    tax: 24000,
    discount: 0,
    totalAmount: 224000,
    status: "Generated",
    invoiceStatus: "Pending",
    paymentStatus: "Unpaid",
  },
  {
    id: "BILL-002",
    contractNo: "CON-002",
    client: "GlobalTech",
    billingPeriod: "September 2026",
    billingDate: "Sep 1, 2026",
    dueDate: "Sep 30, 2026",
    serviceDescription: "IT & Network Management",
    billingCycle: "Monthly",
    contractAmount: 1800000,
    billingAmount: 150000,
    tax: 18000,
    discount: 0,
    totalAmount: 168000,
    status: "Generated",
    invoiceStatus: "Pending",
    paymentStatus: "Unpaid",
  },
  {
    id: "BILL-003",
    contractNo: "CON-003",
    client: "Prime Solutions",
    billingPeriod: "September 2026",
    billingDate: "Sep 1, 2026",
    dueDate: "Sep 30, 2026",
    serviceDescription: "Logistics Management",
    billingCycle: "Quarterly",
    contractAmount: 960000,
    billingAmount: 80000,
    tax: 9600,
    discount: 0,
    totalAmount: 89600,
    status: "Generated",
    invoiceStatus: "Pending",
    paymentStatus: "Unpaid",
  },
  {
    id: "BILL-004",
    contractNo: "CON-004",
    client: "Horizon",
    billingPeriod: "July–September 2026",
    billingDate: "Jul 1, 2026",
    dueDate: "Sep 30, 2026",
    serviceDescription: "Energy Infrastructure Service",
    billingCycle: "Quarterly",
    contractAmount: 3200000,
    billingAmount: 800000,
    tax: 96000,
    discount: 0,
    totalAmount: 896000,
    status: "Generated",
    invoiceStatus: "Pending",
    paymentStatus: "Unpaid",
  },
  {
    id: "BILL-005",
    contractNo: "CON-005",
    client: "Delta",
    billingPeriod: "August 2026",
    billingDate: "Aug 1, 2026",
    dueDate: "Aug 31, 2026",
    serviceDescription: "General Consulting",
    billingCycle: "Monthly",
    contractAmount: 540000,
    billingAmount: 45000,
    tax: 5400,
    discount: 0,
    totalAmount: 50400,
    status: "Overdue",
    invoiceStatus: "Invoiced",
    paymentStatus: "Unpaid",
  },
];

const seedTransactions = [
  { id: 1, date: "Aug 15, 2026", description: "Client Payment - Acme Corp", category: "Client Billing", type: "Income", amount: 420000, account: "BDO Business", status: "Completed" },
  { id: 2, date: "Aug 14, 2026", description: "Employee Salaries", category: "Payroll", type: "Expense", amount: 68000, account: "BDO Business", status: "Completed" },
  { id: 3, date: "Aug 13, 2026", description: "Office Supplies", category: "Office Expense", type: "Expense", amount: 8500, account: "Cash", status: "Completed" },
  { id: 4, date: "Aug 12, 2026", description: "Service Invoice Payment", category: "Revenue", type: "Income", amount: 315000, account: "BPI Corporate", status: "Completed" },
  { id: 5, date: "Aug 11, 2026", description: "Internet and Utilities", category: "Utilities", type: "Expense", amount: 12500, account: "Cash", status: "Pending" },

];

const seedVendorPaymentRecords = [
  { id: "VP-001", vendor: "ABC Co.", invoice: "INV-101", po: "PO-4031", dueDate: "Sep 15, 2026", amount: 85000, status: "Paid", paymentMethod: "Bank Transfer", datePaid: "Sep 14, 2026", paymentReference: "BT-90256", preparedBy: "Finance Staff", verifiedBy: "Admin User", approvedBy: "Admin User" },
  { id: "VP-002", vendor: "XYZ Inc.", invoice: "INV-102", po: "PO-4032", dueDate: "Sep 20, 2026", amount: 42000, status: "Pending", paymentMethod: "Cash", datePaid: "—", paymentReference: "—", preparedBy: "Finance Staff", verifiedBy: "Admin User", approvedBy: "—" },
  { id: "VP-003", vendor: "Office Depot", invoice: "INV-103", po: "PO-4033", dueDate: "Sep 10, 2026", amount: 18500, status: "Overdue", paymentMethod: "Check", datePaid: "—", paymentReference: "CHK-19012", preparedBy: "Finance Staff", verifiedBy: "Admin User", approvedBy: "—" },
  { id: "VP-004", vendor: "Utility Services", invoice: "INV-104", po: "PO-4034", dueDate: "Sep 25, 2026", amount: 27000, status: "Scheduled", paymentMethod: "Bank Transfer", datePaid: "—", paymentReference: "BT-90260", preparedBy: "Finance Staff", verifiedBy: "Finance Staff", approvedBy: "Admin User" },
];

// The former seedSupplyPaymentRecords / seedCashPaymentRecords /
// seedCheckPaymentRecords / seedBankPaymentRecords arrays lived here. Their data
// is now seeded into the supplier_payments table by Backend/server.js
// (seedSupplierPayments) and served by GET /api/supplier-payments, so the page
// no longer ships hard-coded peso figures.


/* ---------- Client Payment Recording (Accounts Receivable) ---------- */

const paymentStatusColors = {
  "Recorded": { background: "#DCFCE7", color: "#166534" },
  "Pending Verification": { background: "#FEF3C7", color: "#92400E" },
  "Verified": { background: "#DBEAFE", color: "#1E40AF" },
  "Rejected": { background: "#FEE2E2", color: "#991B1B" },
  "Cancelled": { background: "#F3F4F6", color: "#374151" },
};
const paymentStatusOrder = ["Recorded", "Pending Verification", "Verified", "Rejected", "Cancelled"];
const paymentStatusStyle = (s) => paymentStatusColors[s] || paymentStatusColors["Recorded"];

// Client payments are never hard-coded. Payment Recording and Client Payment
// History both read the payments table through the API (GET /api/payments/history),
// so this component keeps no copy of the records.

const clientPaymentMethods = ["Cash", "Bank Transfer", "Check", "Online Payment", "Other"];

/* ---------- Service Invoice Management ---------- */

// Consistent invoice status palette (badge background + text/dot color).
const invoiceStatusColors = {
  Paid: {
    background: "#DCFCE7",
    color: "#16A34A",
  },
  Sent: {
    background: "#DBEAFE",
    color: "#2563EB",
  },
  "Partially Paid": {
    background: "#FEF3C7",
    color: "#D97706",
  },
  Overdue: {
    background: "#FEE2E2",
    color: "#DC2626",
  },
  Draft: {
    background: "#F3F4F6",
    color: "#6B7280",
  },
  Cancelled: {
    background: "#FFEDD5",
    color: "#EA580C",
  },
};

const invoiceStatusOrder = ["Paid", "Sent", "Partially Paid", "Overdue", "Draft", "Cancelled"];

// Fallback keeps unknown statuses readable instead of rendering an unstyled badge.
const invoiceStatusStyle = (status) => invoiceStatusColors[status] || invoiceStatusColors.Draft;

// Hard-coded frontend sample data. Balance is derived as total - paid.
const seedServiceInvoices = [
  { id: "INV-2026-0001", client: "Acme Corporation", contract: "CON-001", service: "Security Services", billingPeriod: "Sep 1–30, 2026", invoiceDate: "Sep 1, 2026", dueDate: "Oct 1, 2026", total: 2713000, paid: 2713000, status: "Paid", paymentTerms: "Net 30 Days", paymentReference: "BT-20261001-0001", preparedBy: "Finance Staff" },
  { id: "INV-2026-0002", client: "GlobalTech Inc.", contract: "CON-002", service: "Manpower Services", billingPeriod: "Sep 1–30, 2026", invoiceDate: "Sep 1, 2026", dueDate: "Oct 1, 2026", total: 1800000, paid: 900000, status: "Partially Paid", paymentTerms: "Net 30 Days", paymentReference: "BT-20260928-0114", preparedBy: "Finance Staff" },
  { id: "INV-2026-0003", client: "Prime Solutions", contract: "CON-003", service: "Facility Services", billingPeriod: "Sep 1–30, 2026", invoiceDate: "Sep 1, 2026", dueDate: "Oct 1, 2026", total: 960000, paid: 0, status: "Sent", paymentTerms: "Net 30 Days", paymentReference: "—", preparedBy: "Finance Staff" },
  { id: "INV-2026-0004", client: "Horizon Services", contract: "CON-004", service: "Security Services", billingPeriod: "Aug 1–31, 2026", invoiceDate: "Aug 1, 2026", dueDate: "Sep 1, 2026", total: 3200000, paid: 0, status: "Overdue", paymentTerms: "Net 30 Days", paymentReference: "—", preparedBy: "Finance Staff" },
  { id: "INV-2026-0005", client: "Delta Corporation", contract: "CON-005", service: "Maintenance Services", billingPeriod: "Aug 1–31, 2026", invoiceDate: "Aug 1, 2026", dueDate: "Sep 1, 2026", total: 540000, paid: 540000, status: "Paid", paymentTerms: "Net 30 Days", paymentReference: "CHK-20260830-0072", preparedBy: "Finance Staff" },
  { id: "INV-2026-0006", client: "Acme Corporation", contract: "CON-001", service: "Security Services", billingPeriod: "Oct 1–31, 2026", invoiceDate: "Sep 15, 2026", dueDate: "Nov 1, 2026", total: 2400000, paid: 0, status: "Draft", paymentTerms: "Net 30 Days", paymentReference: "—", preparedBy: "Finance Staff" },
  { id: "INV-2026-0007", client: "GlobalTech Inc.", contract: "CON-002", service: "Manpower Services", billingPeriod: "Aug 1–31, 2026", invoiceDate: "Aug 1, 2026", dueDate: "Sep 1, 2026", total: 1800000, paid: 0, status: "Cancelled", paymentTerms: "Net 30 Days", paymentReference: "—", preparedBy: "Finance Staff" },
];

/* ---------- Billing Schedule Monitoring ---------- */

// Consistent billing schedule status palette (badge background + text/dot color).
const billingScheduleStatus = {
  Completed: {
    background: "#DCFCE7",
    color: "#16A34A",
  },
  Upcoming: {
    background: "#DBEAFE",
    color: "#2563EB",
  },
  "Due Today": {
    background: "#FEF3C7",
    color: "#D97706",
  },
  Overdue: {
    background: "#FEE2E2",
    color: "#DC2626",
  },
  Missed: {
    background: "#FFEDD5",
    color: "#EA580C",
  },
  Skipped: {
    background: "#F3F4F6",
    color: "#6B7280",
  },
  Rescheduled: {
    background: "#EDE9FE",
    color: "#7C3AED",
  },
};

const billingScheduleStatusOrder = ["Completed", "Upcoming", "Due Today", "Overdue", "Missed", "Skipped", "Rescheduled"];

// Fallback keeps unknown statuses readable instead of rendering an unstyled badge.
const billingScheduleStyle = (status) => billingScheduleStatus[status] || billingScheduleStatus.Skipped;

const seedClientAccounts = [
  { id: "ACC-0001", accountId: "ACC-0001", clientId: "CLI-0001", client: "Acme Corporation", contract: "CON-001", contractStatus: "Active", contractStart: "Jan 1, 2026", contractEnd: "Dec 31, 2026", billingCycle: "Monthly", contractAmount: 2400000, totalBilled: 1800000, totalPaid: 1380000, overdueAmount: 120000, currentAmountDue: 300000, lastInvoice: "INV-2026-0085", lastInvoiceDate: "Sep 1, 2026", lastPayment: "PAY-2026-0072", lastPaymentDate: "Sep 15, 2026", paymentStatus: "Partially Paid", accountStatus: "With Balance", creditStatus: "Good", collectionStatus: "Follow-up Required", assignedOfficer: "Juan Dela Cruz", lastReviewDate: "Sep 20, 2026", remarks: "P120,000 overdue for 15 days." },
  { id: "ACC-0002", accountId: "ACC-0002", clientId: "CLI-0002", client: "GlobalTech Solutions", contract: "CON-002", contractStatus: "Active", contractStart: "Mar 1, 2026", contractEnd: "Feb 28, 2027", billingCycle: "Monthly", contractAmount: 1800000, totalBilled: 1050000, totalPaid: 1050000, overdueAmount: 0, currentAmountDue: 0, lastInvoice: "INV-2026-0079", lastInvoiceDate: "Sep 1, 2026", lastPayment: "PAY-2026-0068", lastPaymentDate: "Sep 18, 2026", paymentStatus: "Paid", accountStatus: "Fully Paid", creditStatus: "Excellent", collectionStatus: "No Action Required", assignedOfficer: "Maria Reyes", lastReviewDate: "Sep 19, 2026", remarks: "Account fully settled." },
  { id: "ACC-0003", accountId: "ACC-0003", clientId: "CLI-0003", client: "Prime Solutions Inc.", contract: "CON-003", contractStatus: "Active", contractStart: "Jul 1, 2026", contractEnd: "Jun 30, 2027", billingCycle: "Quarterly", contractAmount: 960000, totalBilled: 480000, totalPaid: 360000, overdueAmount: 0, currentAmountDue: 120000, lastInvoice: "INV-2026-0071", lastInvoiceDate: "Aug 5, 2026", lastPayment: "PAY-2026-0059", lastPaymentDate: "Sep 10, 2026", paymentStatus: "Partially Paid", accountStatus: "Current", creditStatus: "Good", collectionStatus: "Monitor", assignedOfficer: "Jose Ramos", lastReviewDate: "Sep 18, 2026", remarks: "Current balance within payment terms." },
  { id: "ACC-0004", accountId: "ACC-0004", clientId: "CLI-0004", client: "Horizon Services", contract: "CON-004", contractStatus: "Active", contractStart: "Jan 1, 2026", contractEnd: "Dec 31, 2026", billingCycle: "Quarterly", contractAmount: 3200000, totalBilled: 2400000, totalPaid: 1900000, overdueAmount: 250000, currentAmountDue: 250000, lastInvoice: "INV-2026-0081", lastInvoiceDate: "Aug 1, 2026", lastPayment: "PAY-2026-0060", lastPaymentDate: "Aug 28, 2026", paymentStatus: "Partially Paid", accountStatus: "Overdue", creditStatus: "Watchlist", collectionStatus: "Urgent Follow-up", assignedOfficer: "Ana Santos", lastReviewDate: "Sep 20, 2026", remarks: "P250,000 overdue for 30 days." },
  { id: "ACC-0005", accountId: "ACC-0005", clientId: "CLI-0005", client: "Delta Enterprises", contract: "CON-005", contractStatus: "Expired", contractStart: "Sep 1, 2025", contractEnd: "Aug 31, 2026", billingCycle: "Monthly", contractAmount: 540000, totalBilled: 540000, totalPaid: 400000, overdueAmount: 140000, currentAmountDue: 0, lastInvoice: "INV-2026-0062", lastInvoiceDate: "Aug 1, 2026", lastPayment: "PAY-2026-0051", lastPaymentDate: "Aug 20, 2026", paymentStatus: "Partially Paid", accountStatus: "Delinquent", creditStatus: "Poor", collectionStatus: "Escalated to Legal", assignedOfficer: "Juan Dela Cruz", lastReviewDate: "Sep 15, 2026", remarks: "P140,000 delinquent for 45 days." },
];

// Outstanding balance is always derived: total_billed - total_paid.
const clientAccountBalance = (account) => Number(account?.totalBilled || 0) - Number(account?.totalPaid || 0);

// Collection rate is always derived: (total_paid / total_billed) × 100.
const clientAccountCollectionRate = (account) => {
  const billed = Number(account?.totalBilled || 0);
  if (!billed) return 0;
  return Math.round((Number(account?.totalPaid || 0) / billed) * 10000) / 100;
};

const clientAccountStyle = (status) => clientAccountStatus[status] || clientAccountStatus["With Balance"];

const seedBillingSchedules = [
  { id: "BS-2026-001", client: "Acme Corporation", contract: "CON-001", service: "Security Services", frequency: "Monthly", billingDay: "1st", billingPeriod: "September 2026", scheduledDate: "Sep 1, 2026", invoiceNo: "INV-2026-0001", invoiceDate: "Sep 1, 2026", amount: 2400000, paymentTerms: "Net 30 Days", dueDate: "Oct 1, 2026", lastBillingDate: "Aug 1, 2026", nextBillingDate: "Oct 1, 2026", status: "Completed", remarks: "Invoice generated and fully paid", createdBy: "Admin User" },
  { id: "BS-2026-002", client: "GlobalTech Inc.", contract: "CON-002", service: "Manpower Services", frequency: "Monthly", billingDay: "1st", billingPeriod: "September 2026", scheduledDate: "Sep 1, 2026", invoiceNo: "INV-2026-0002", invoiceDate: "Sep 1, 2026", amount: 1800000, paymentTerms: "Net 30 Days", dueDate: "Oct 1, 2026", lastBillingDate: "Aug 1, 2026", nextBillingDate: "Oct 1, 2026", status: "Completed", remarks: "Invoice generated — partially paid", createdBy: "Admin User" },
  { id: "BS-2026-003", client: "Prime Solutions", contract: "CON-003", service: "Facility Services", frequency: "Monthly", billingDay: "5th", billingPeriod: "September 2026", scheduledDate: "Sep 5, 2026", invoiceNo: "INV-2026-0003", invoiceDate: "Sep 5, 2026", amount: 960000, paymentTerms: "Net 30 Days", dueDate: "Oct 5, 2026", lastBillingDate: "Aug 5, 2026", nextBillingDate: "Oct 5, 2026", status: "Completed", remarks: "Invoice generated and issued to client", createdBy: "Admin User" },
  { id: "BS-2026-004", client: "Horizon Services", contract: "CON-004", service: "Security Services", frequency: "Monthly", billingDay: "1st", billingPeriod: "September 2026", scheduledDate: "Sep 1, 2026", invoiceNo: "INV-2026-0004", invoiceDate: "Sep 1, 2026", amount: 3200000, paymentTerms: "Net 30 Days", dueDate: "Oct 1, 2026", lastBillingDate: "Aug 1, 2026", nextBillingDate: "Oct 1, 2026", status: "Overdue", remarks: "Invoice unpaid past the due date — for collection follow-up", createdBy: "Admin User" },
  { id: "BS-2026-005", client: "Delta Corporation", contract: "CON-005", service: "Maintenance Services", frequency: "Monthly", billingDay: "1st", billingPeriod: "September 2026", scheduledDate: "Sep 1, 2026", invoiceNo: "—", invoiceDate: "—", amount: 540000, paymentTerms: "Net 30 Days", dueDate: "Oct 1, 2026", lastBillingDate: "Aug 1, 2026", nextBillingDate: "Oct 1, 2026", status: "Missed", remarks: "Billing date passed without an invoice — needs manual generation", createdBy: "Admin User" },
  { id: "BS-2026-006", client: "Acme Corporation", contract: "CON-001", service: "Security Services", frequency: "Monthly", billingDay: "1st", billingPeriod: "October 2026", scheduledDate: "Oct 1, 2026", invoiceNo: "—", invoiceDate: "—", amount: 2400000, paymentTerms: "Net 30 Days", dueDate: "Nov 1, 2026", lastBillingDate: "Sep 1, 2026", nextBillingDate: "Oct 1, 2026", status: "Upcoming", remarks: "Awaiting billing date", createdBy: "Admin User" },
  { id: "BS-2026-007", client: "GlobalTech Inc.", contract: "CON-002", service: "Manpower Services", frequency: "Monthly", billingDay: "1st", billingPeriod: "October 2026", scheduledDate: "Oct 1, 2026", invoiceNo: "—", invoiceDate: "—", amount: 1800000, paymentTerms: "Net 30 Days", dueDate: "Nov 1, 2026", lastBillingDate: "Sep 1, 2026", nextBillingDate: "Oct 1, 2026", status: "Upcoming", remarks: "Awaiting billing date", createdBy: "Admin User" },
  { id: "BS-2026-008", client: "Prime Solutions", contract: "CON-003", service: "Facility Services", frequency: "Monthly", billingDay: "5th", billingPeriod: "October 2026", scheduledDate: "Oct 5, 2026", invoiceNo: "—", invoiceDate: "—", amount: 960000, paymentTerms: "Net 30 Days", dueDate: "Nov 5, 2026", lastBillingDate: "Sep 5, 2026", nextBillingDate: "Oct 5, 2026", status: "Upcoming", remarks: "Awaiting billing date", createdBy: "Admin User" },
  { id: "BS-2026-009", client: "Horizon Services", contract: "CON-004", service: "Security Services", frequency: "Monthly", billingDay: "1st", billingPeriod: "October 2026", scheduledDate: "Oct 1, 2026", invoiceNo: "—", invoiceDate: "—", amount: 3200000, paymentTerms: "Net 30 Days", dueDate: "Nov 1, 2026", lastBillingDate: "Sep 1, 2026", nextBillingDate: "Oct 1, 2026", status: "Upcoming", remarks: "Awaiting billing date", createdBy: "Admin User" },
  { id: "BS-2026-010", client: "Delta Corporation", contract: "CON-005", service: "Maintenance Services", frequency: "Monthly", billingDay: "1st", billingPeriod: "October 2026", scheduledDate: "Oct 1, 2026", invoiceNo: "—", invoiceDate: "—", amount: 540000, paymentTerms: "Net 30 Days", dueDate: "Nov 1, 2026", lastBillingDate: "Sep 1, 2026", nextBillingDate: "Oct 1, 2026", status: "Skipped", remarks: "Billing skipped for this cycle upon client request", createdBy: "Admin User" },
  { id: "BS-2026-011", client: "Acme Corporation", contract: "CON-001", service: "Security Services", frequency: "Monthly", billingDay: "1st", billingPeriod: "August 2026", scheduledDate: "Aug 1, 2026", invoiceNo: "INV-2026-0005", invoiceDate: "Aug 1, 2026", amount: 2400000, paymentTerms: "Net 30 Days", dueDate: "Sep 1, 2026", lastBillingDate: "Jul 1, 2026", nextBillingDate: "Sep 1, 2026", status: "Completed", remarks: "Invoice generated and fully paid", createdBy: "Admin User" },
  { id: "BS-2026-012", client: "GlobalTech Inc.", contract: "CON-002", service: "Manpower Services", frequency: "Monthly", billingDay: "1st", billingPeriod: "August 2026", scheduledDate: "Aug 1, 2026", invoiceNo: "INV-2026-0006", invoiceDate: "Aug 1, 2026", amount: 1800000, paymentTerms: "Net 30 Days", dueDate: "Sep 1, 2026", lastBillingDate: "Jul 1, 2026", nextBillingDate: "Sep 1, 2026", status: "Rescheduled", remarks: "Rescheduled from Jul 1, 2026 to Aug 1, 2026", createdBy: "Admin User" },
];

const seedMonthly = [
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
    const response = await fetch(`${API_BASE}/api/state`, { headers: { Accept: "application/json" } });
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
    await fetch(`${API_BASE}/api/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Failed to persist finance data to backend:", error);
  }
};

// ============================================================
// Contract Management API Helpers
// ============================================================

const fetchContractsFromApi = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/contracts`, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.success ? payload.data : null;
  } catch (error) {
    console.error("Failed to fetch contracts from API:", error);
    return null;
  }
};

const fetchArchivedContractsFromApi = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/contracts?status=archived`, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.success ? payload.data : null;
  } catch (error) {
    console.error("Failed to fetch archived contracts from API:", error);
    return null;
  }
};

const createContractViaApi = async (contract) => {
  try {
    const response = await fetch(`${API_BASE}/api/contracts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contract),
    });
    const payload = await response.json();
    return payload.success ? payload.data : null;
  } catch (error) {
    console.error("Failed to create contract via API:", error);
    return null;
  }
};

const updateContractViaApi = async (id, updates) => {
  try {
    const response = await fetch(`${API_BASE}/api/contracts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const payload = await response.json();
    return payload.success ? payload.data : null;
  } catch (error) {
    console.error("Failed to update contract via API:", error);
    return null;
  }
};

const archiveContractViaApi = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/api/contracts/${id}/archive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const payload = await response.json();
    return payload.success ? payload.data : null;
  } catch (error) {
    console.error("Failed to archive contract via API:", error);
    return null;
  }
};

const restoreContractViaApi = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/api/contracts/${id}/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const payload = await response.json();
    return payload.success ? payload.data : null;
  } catch (error) {
    console.error("Failed to restore contract via API:", error);
    return null;
  }
};

const renewContractViaApi = async (id, renewalData) => {
  try {
    const response = await fetch(`${API_BASE}/api/contracts/${id}/renew`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        new_end_date: renewalData.newEnd,
        renewed_value: renewalData.renewedValue,
        notes: renewalData.notes,
      }),
    });
    const payload = await response.json();
    return payload.success ? payload.data : null;
  } catch (error) {
    console.error("Failed to renew contract via API:", error);
    return null;
  }
};

const uploadContractDocumentViaApi = async (id, document) => {
  try {
    const response = await fetch(`${API_BASE}/api/contracts/${id}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(document),
    });
    const payload = await response.json();
    return payload.success ? payload.data : null;
  } catch (error) {
    console.error("Failed to upload contract document via API:", error);
    return null;
  }
};

// ============================================================
// Billing Generation API Helpers
// ============================================================

const fetchBillingsFromApi = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/billings`, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.success ? payload.data : null;
  } catch (error) {
    console.error("Failed to fetch billings from API:", error);
    return null;
  }
};

const generateBillingsViaApi = async (params = {}) => {
  try {
    const response = await fetch(`${API_BASE}/api/billings/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const payload = await response.json();
    return payload;
  } catch (error) {
    console.error("Failed to generate billings via API:", error);
    return { success: false, message: error.message, data: [] };
  }
};

const fetchAvailableContractsForBilling = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/billings/available-contracts`, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.success ? payload.data : null;
  } catch (error) {
    console.error("Failed to fetch available contracts for billing:", error);
    return null;
  }
};

// ============================================================
// Client Account + Billing Schedule Monitoring API Helpers
// Backend: GET /api/client-accounts (+ /summary) and
//          GET/PUT /api/billing-schedules (same shape as seedBillingSchedules)
// ============================================================

const fetchClientAccountsFromApi = async (params = {}) => {
  try {
    const query = new URLSearchParams();
    if (params.status && params.status !== "All Status") query.set("status", params.status);
    if (params.search) query.set("search", params.search);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const response = await fetch(`${API_BASE}/api/client-accounts${suffix}`, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.success ? payload.data : null;
  } catch (error) {
    console.error("Failed to fetch client accounts from API:", error);
    return null;
  }
};

const fetchClientAccountSummaryFromApi = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/client-accounts/summary`, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.success ? payload.data : null;
  } catch (error) {
    console.error("Failed to fetch client account summary from API:", error);
    return null;
  }
};

// Status text colors for Client Account Monitoring.
// Map covers every status value in the color rules table so the frontend
// automatically reflects DB changes (e.g. Current -> Overdue turns red).
const clientAccountStatusColor = {
  "Active": "#16a34a",
  "Expiring Soon": "#d97706",
  "Expired": "#dc2626",
  "Archived": "#6b7280",
  "Fully Paid": "#16a34a",
  "Paid": "#16a34a",
  "Current": "#2563eb",
  "Partially Paid": "#d97706",
  "Unpaid": "#dc2626",
  "With Balance": "#d97706",
  "Follow-up Required": "#d97706",
  "Monitor": "#d97706",
  "Overdue": "#dc2626",
  "Urgent Follow-up": "#dc2626",
  "Delinquent": "#991b1b",
  "Escalated to Legal": "#991b1b",
  "Suspended": "#dc2626",
  "Good": "#16a34a",
  "Excellent": "#16a34a",
  "Watchlist": "#d97706",
  "Watch": "#d97706",
  "Poor": "#dc2626",
  "Review Required": "#d97706",
  "No Action Required": "#16a34a",
};

// Status palettes + offline sample data for Client Account Monitoring.
const clientAccountStatus = {
  "Fully Paid": { background: "#e7f7ee", color: "#0f7a3d" },
  "Current": { background: "#e8f1ff", color: "#1d4ed8" },
  "With Balance": { background: "#fff6e0", color: "#9a6b00" },
  "Overdue": { background: "#fdeaea", color: "#c81e1e" },
  "Delinquent": { background: "#f3e8ff", color: "#7e22ce" },
};

// Plain-text status color derived from the status value itself.
// If the API/DB changes a status, the displayed color follows automatically.
const clientAccountStatusTextColor = (status) => clientAccountStatusColor[status] || "#111827";

const fetchBillingSchedulesFromApi = async () => {
  // Returns { ok: true, data } or { ok: false, reason } so callers never mistake
  // an HTTP error / bad payload for an unreachable backend, and never hang
  // forever on a stalled server (10s abort timeout).
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`${API_BASE}/api/billing-schedules`, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (!response.ok) {
        const reason = `GET /api/billing-schedules answered HTTP ${response.status}`;
        console.error("Failed to fetch billing schedules from API:", reason);
        return { ok: false, reason };
      }
      const payload = await response.json();
      if (!payload?.success || !Array.isArray(payload.data)) {
        const reason = "GET /api/billing-schedules returned an unexpected payload";
        console.error("Failed to fetch billing schedules from API:", reason);
        return { ok: false, reason };
      }
      return { ok: true, data: payload.data };
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    const reason =
      error?.name === "AbortError"
        ? "GET /api/billing-schedules timed out after 10s"
        : `GET /api/billing-schedules is unreachable (${error?.message || "network error"})`;
    console.error("Failed to fetch billing schedules from API:", error);
    return { ok: false, reason };
  }
};

const updateBillingScheduleViaApi = async (id, updates) => {
  try {
    const response = await fetch(`${API_BASE}/api/billing-schedules/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const payload = await response.json();
    return payload.success ? payload.data : null;
  } catch (error) {
    console.error("Failed to update billing schedule via API:", error);
    return null;
  }
};

const readLocalArray = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
};

const buildMonthlyFromTransactions = (items) => {
  const months = {};
  items.forEach(item => {
    const d = new Date(item.date);
    if (Number.isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!months[key]) months[key] = { m: new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), revenue: 0, expense: 0 };
    if (item.type === "Income") months[key].revenue += Number(item.amount || 0);
    if (item.type === "Expense") months[key].expense += Number(item.amount || 0);
  });
  const result = Object.values(months).sort((a,b) => new Date(a.m) - new Date(b.m));
  return result.length ? result : seedMonthly;
};

// Year-over-year growth for the "Monthly Financial Overview" pill.
//
// The pill used to read a fixed "▲ +8.3% YTD" while the chart beside it plotted real
// numbers, so the card asserted a growth rate that had no relationship to its own data.
// Returns null when the series cannot support a figure: a single year of history has no
// prior-year month to compare against, and inventing a percentage there is worse than
// showing nothing.
const computeYearOverYearGrowth = (series) => {
  if (!Array.isArray(series) || !series.length) return null;

  // Months are keyed as year*12 + monthIndex so the twelve-month look-back is an exact
  // arithmetic match rather than a string comparison that breaks on "2026-9" vs "2026-10".
  const points = [];
  series.forEach(item => {
    const date = new Date(item.m);
    if (Number.isNaN(date.getTime())) return;
    points.push({
      key: date.getFullYear() * 12 + date.getMonth(),
      revenue: Number(item.revenue || 0),
    });
  });
  if (!points.length) return null;

  points.sort((a, b) => a.key - b.key);
  const latest = points[points.length - 1];
  const priorYear = points.find(point => point.key === latest.key - 12);

  // A zero prior-year base has no meaningful percentage, and a missing prior-year month
  // means there is nothing to compare against at all.
  if (!priorYear || priorYear.revenue <= 0) return null;

  return ((latest.revenue - priorYear.revenue) / priorYear.revenue) * 100;
};

// Contains a render failure to the section that caused it.
//
// Without this, a single bad component takes down the whole page: React unmounts the
// entire tree below the nearest boundary, so one broken dashboard chart rendered as a
// blank screen with no indication of which part failed. Each boundary below reports the
// failing component and offers a retry, and the rest of the app stays usable.
//
// A retry is only useful if the cause is transient, so the reset clears the error and
// remounts the subtree; a genuine bug simply fails again on the next attempt, which is
// more useful than a permanent white screen.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, key: 0 };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Kept in the console so the real stack is still available for diagnosis; the
    // boundary is a safety net, not a way of hiding the cause.
    console.error(`${this.props.label || "Component"} failed to render:`, error, info);
  }

  retry = () => {
    this.setState(prev => ({ error: null, key: prev.key + 1 }));
  };

  render() {
    const { error } = this.state;
    if (!error) {
      // Remounting on key change is what makes Retry actually re-run the child rather
      // than re-rendering the same broken tree.
      return <React.Fragment key={this.state.key}>{this.props.children}</React.Fragment>;
    }
    return (
      <div className="error-boundary" role="alert">
        <h3>{this.props.label || "This section"} could not be displayed</h3>
        <p>{String(error && error.message ? error.message : error)}</p>
        <button type="button" className="primary-button" onClick={this.retry}>Try again</button>
      </div>
    );
  }
}

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [openMenus, setOpenMenus] = useState({"Client Billing Management": true});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("New Record");
  const [aiBudget, setAiBudget] = useState(null);
  // The forecast is produced by a Python child process on the server, so it can fail for
  // reasons the browser cannot fix: pandas/scikit-learn missing from the deployment, a spawn
  // error, or a reply that is not JSON. That failure used to reach only the console, leaving
  // `aiBudget` null -- and because the whole panel below is gated on it, the AI budget card
  // and the cash flow graph inside it disappeared with no explanation on screen.
  const [aiBudgetError, setAiBudgetError] = useState(null);
  const [transactions, setTransactions] = useState(() => readLocalArray("pp_transactions", seedTransactions));
  const [vendorPayments, setVendorPayments] = useState(() => readLocalArray("pp_vendor_payments", seedVendorPaymentRecords));
  // Supplier/cash/check/bank payments are no longer local state. They live in the
  // supplier_payments table and are read by SupplyPaymentManagementPage through
  // GET /api/supplier-payments, so the page and the ledger cannot drift apart.
  // Payment records live in the payments table only (see PaymentRecordingPage).
  const [budgets, setBudgets] = useState(() => readLocalArray("pp_budgets", []));
  const [billingRecords, setBillingRecords] = useState(() => readLocalArray("pp_billings", seedBillings));
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

    // Fetch contracts from the dedicated contracts API
    fetchContractsFromApi().then((apiContracts) => {
      if (!active || !apiContracts) return;
      setContractRecords(apiContracts);
    });

    fetchArchivedContractsFromApi().then((apiArchived) => {
      if (!active || !apiArchived) return;
      setArchivedRecords(apiArchived);
    });

    // Fetch billings from the dedicated billings API
    fetchBillingsFromApi().then((apiBillings) => {
      if (!active || !apiBillings) return;
      setBillingRecords(apiBillings);
    });

    fetch(`${API_BASE}/api/ai-budget`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        month: new Date().getMonth() + 1,
        revenue: transactions.filter(x => x.type === "Income" && x.status !== "Pending").reduce((a,x)=>a+Number(x.amount||0),0),
        payroll: transactions.filter(x => x.type === "Expense" && /payroll|salary/i.test(x.category + " " + x.description)).reduce((a,x)=>a+Number(x.amount||0),0),
        supplies: transactions.filter(x => x.type === "Expense" && /supply/i.test(x.category + " " + x.description)).reduce((a,x)=>a+Number(x.amount||0),0),
        utilities: transactions.filter(x => x.type === "Expense" && /utilit/i.test(x.category + " " + x.description)).reduce((a,x)=>a+Number(x.amount||0),0),
        operations: transactions.filter(x => x.type === "Expense" && !/payroll|salary|supply|utilit/i.test(x.category + " " + x.description)).reduce((a,x)=>a+Number(x.amount||0),0),
        currentBudget: budgets.reduce((a,x)=>a+Number(x.amount||0),0) || transactions.filter(x => x.type === "Expense" && x.status !== "Pending").reduce((a,x)=>a+Number(x.amount||0),0),
      }),
    })
      .then(async (response) => {
        // Parsed defensively: a proxy or a crashed route can answer with HTML, and
        // response.json() would then reject with a parse error that hides the real status.
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || `Forecast service returned ${response.status}.`);
        }
        if (active) {
          setAiBudget(payload.data);
          setAiBudgetError(null);
        }
      })
      .catch((error) => {
        console.error("Failed to load AI budget forecast:", error);
        if (active) {
          setAiBudget(null);
          setAiBudgetError(error.message || "The AI budget forecast is unavailable right now.");
        }
      });

    return () => {
      active = false;
    };
  }, [transactions, budgets]);

  const totalRevenue = useMemo(() => transactions.filter(x => x.type === "Income" && x.status !== "Pending").reduce((a, x) => a + Number(x.amount || 0), 0), [transactions]);
  const totalExpenses = useMemo(() => transactions.filter(x => x.type === "Expense" && x.status !== "Pending").reduce((a, x) => a + Number(x.amount || 0), 0), [transactions]);
  const netCash = totalRevenue - totalExpenses;
  const outstandingReceivables = useMemo(() => Math.max(0, transactions.filter(x => x.type === "Income").reduce((a,x) => a + Number(x.amount || 0), 0) - transactions.filter(x => x.type === "Income" && x.status === "Completed").reduce((a,x) => a + Number(x.amount || 0), 0)), [transactions]);
  const monthly = useMemo(() => buildMonthlyFromTransactions(transactions), [transactions]);
  const filtered = useMemo(() => transactions.filter(x => `${x.description} ${x.category} ${x.account} ${x.client || ""}`.toLowerCase().includes(search.toLowerCase())), [transactions, search]);

  useEffect(() => localStorage.setItem("pp_contracts", JSON.stringify(contractRecords)), [contractRecords]);
  useEffect(() => localStorage.setItem("pp_archived", JSON.stringify(archivedRecords)), [archivedRecords]);
  useEffect(() => localStorage.setItem("pp_archive_history", JSON.stringify(archiveHistory)), [archiveHistory]);
  useEffect(() => localStorage.setItem("pp_audit", JSON.stringify(auditTrail)), [auditTrail]);
  useEffect(() => localStorage.setItem("pp_notifications", JSON.stringify(notifications)), [notifications]);
  useEffect(() => localStorage.setItem("pp_permissions", JSON.stringify(permissions)), [permissions]);
  useEffect(() => localStorage.setItem("pp_transactions", JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem("pp_vendor_payments", JSON.stringify(vendorPayments)), [vendorPayments]);
  useEffect(() => localStorage.setItem("pp_budgets", JSON.stringify(budgets)), [budgets]);
  useEffect(() => localStorage.setItem("pp_billings", JSON.stringify(billingRecords)), [billingRecords]);

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

  const updateContract = (updated) => {
    setContractRecords(prev => prev.map(c => c.id === updated.id ? updated : c));
    addAudit("Updated contract", `${updated.id} - ${updated.client}`);
    // Persist to API
    updateContractViaApi(updated.id, {
      contract_no: updated.id,
      client_name: updated.client,
      company: updated.company,
      contact_person: updated.contactPerson,
      contact_email: updated.contactEmail,
      contact_phone: updated.contactPhone,
      contract_amount: updated.value,
      start_date: updated.start,
      end_date: updated.end,
      billing_cycle: updated.billingCycle,
      billing_amount: updated.billingAmount,
      payment_terms: updated.paymentTerms,
      contract_type: updated.contractType,
    });
  };

  const renewContract = (contractId, renewalData) => {
    setContractRecords(prev => prev.map(c => {
      if (c.id !== contractId) return c;
      const prevEnd = c.end;
      const historyItem = {
        id: `REN-${Date.now()}`,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        previousEnd: prevEnd,
        newEnd: renewalData.newEnd,
        renewedValue: Number(renewalData.renewedValue || c.value),
        notes: renewalData.notes || "Contract term extended",
      };
      return {
        ...c,
        end: renewalData.newEnd,
        value: Number(renewalData.renewedValue || c.value),
        status: "Active",
        renewals: [historyItem, ...(c.renewals || [])],
      };
    }));
    addAudit("Renewed contract", `${contractId} extended to ${renewalData.newEnd}`);
    // Persist to API
    renewContractViaApi(contractId, renewalData);
  };

  const archiveContract = (contract) => {
    if (!window.confirm(`Archive contract ${contract.id} for ${contract.client}?`)) return;
    const archived = { ...contract, status: "Archived", archivedAt: new Date().toLocaleString(), archivedBy: "Admin User" };
    setContractRecords(prev => prev.filter(c => c.id !== contract.id));
    setArchivedRecords(prev => [archived, ...prev]);
    setArchiveHistory(prev => [{ id: Date.now(), action: "Archived", record: contract.id, client: contract.client, user: "Admin User", date: new Date().toLocaleString() }, ...prev]);
    addAudit("Archived contract", contract.id);
    // Persist to API
    archiveContractViaApi(contract.id);
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
    // Persist to API
    restoreContractViaApi(record.id);
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
            >*</button>
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
        {/* One boundary around the routed page. Without it a render error in any module
            unmounts the whole shell — navigation, header and all — instead of the one
            section that failed. */}
        <ErrorBoundary label={activePage}>
        {activePage === "Dashboard" ? <Dashboard totalRevenue={totalRevenue} totalExpenses={totalExpenses} outstandingReceivables={outstandingReceivables} netCash={netCash} navigate={navigate} aiBudget={aiBudget} aiBudgetError={aiBudgetError} monthly={monthly} transactions={transactions} /> :
          activePage === "Client Contract Management" ? <ContractPage contracts={contractRecords} archivedContracts={archivedRecords} onNew={() => openNew("New Contract")} onArchive={archiveContract} onRestore={restoreContract} onUpload={saveDocument} onUpdateContract={updateContract} onRenewContract={renewContract} navigate={navigate} /> :
          activePage === "Archived Records" ? <ArchivedPage records={archivedRecords} onRestore={restoreContract} search={search} /> :
          activePage === "Archive History" ? <HistoryPage title="Archive History" rows={archiveHistory} /> :
          activePage === "Audit Trail" ? <HistoryPage title="Audit Trail" rows={auditTrail} /> :
          activePage === "Notification History" ? <NotificationHistory notifications={notifications} setNotifications={setNotifications} /> :
          activePage === "User Permissions" ? <PermissionsPage permissions={permissions} setPermissions={setPermissions} /> :
          adminSettingsPages.includes(activePage) ? <AdminSettingsPage page={activePage} /> :
          activePage === "Supplier Payment Management" ? <SupplyPaymentManagementPage onNew={() => openNew("New Supply Payment")} onAudit={addAudit} /> :
          activePage === "Utility Payment Management" ? <UtilityPaymentManagementPage onNew={() => openNew("New Utility Payment")} onAudit={addAudit} /> :
          activePage === "Office Expense Management" ? <OfficeExpenseManagementPage onNew={() => openNew("New Office Expense")} onAudit={addAudit} /> :
          activePage === "Vendor Payment Tracking" ? <VendorPaymentTrackingPage onAudit={addAudit} /> :
          activePage === "Tax Filing Preparation" ? <TaxFilingPreparationPage onAudit={addAudit} /> :
          activePage === "Tax Records" ? <TaxRecordsPage onAudit={addAudit} /> :
          activePage === "Compliance Monitoring" ? <TaxCompliancePage onAudit={addAudit} /> :
          activePage === "Tax Calculation" ? <TaxCalculationPage onAudit={addAudit} /> :
          activePage === "Billing Generation" ? <BillingGenerationPage billings={billingRecords} setBillings={setBillingRecords} contracts={contractRecords} onGenerate={generateBillingsViaApi} onAudit={addAudit} /> :
          activePage === "Service Invoice Management" ? <ServiceInvoiceManagementPage onNew={() => openNew("New Service Invoice")} onAudit={addAudit} navigate={navigate} /> :
          activePage === "Billing Schedule Monitoring" ? <BillingScheduleMonitoringPage onAudit={addAudit} navigate={navigate} /> :
          activePage === "Client Account Monitoring" ? <ClientAccountMonitoringPage onAudit={addAudit} navigate={navigate} /> :
          activePage === "Payment Recording" ? <PaymentRecordingPage onAudit={addAudit} navigate={navigate} /> :
          activePage === "Outstanding Balance Tracking" ? <OutstandingBalancePage onAudit={addAudit} navigate={navigate} /> :
          activePage === "Aging of Receivables" ? <AgingReceivablesPage onAudit={addAudit} navigate={navigate} /> :
          activePage === "Client Payment History" ? <ClientPaymentHistoryPage onAudit={addAudit} navigate={navigate} /> :
          activePage === "Collection Scheduling" ? <CollectionSchedulingPage onAudit={addAudit} navigate={navigate} /> :
          activePage === "Collection Monitoring" ? <CollectionMonitoringPage onAudit={addAudit} navigate={navigate} /> :
          activePage === "Official Receipt Generation" ? <OfficialReceiptGenerationPage onAudit={addAudit} navigate={navigate} /> :
          activePage === "Collection Follow-ups" ? <CollectionFollowUpsPage onAudit={addAudit} navigate={navigate} /> :
          <ModulePage
            page={activePage}
            onNew={() => openNew(`New ${activePage}`)}
            transactions={filtered}
            onUpdateRecord={(record) => setTransactions(prev => prev.map(item => item.id === record.id ? record : item))}
            onAudit={addAudit}
          />}
        </ErrorBoundary>
      </main>

      {showModal && <Modal title={modalTitle} onClose={() => setShowModal(false)} onAudit={addAudit} onSave={(record) => setTransactions(prev => [record, ...prev])} onSaveContract={(record) => setContractRecords(prev => [record, ...prev])} />}
    </div>
  );
}

function Dashboard({ totalRevenue, totalExpenses, outstandingReceivables, netCash, navigate, aiBudget, aiBudgetError, monthly, transactions }) {
  const [hoveredAllocationForDashboard, setHoveredAllocationForDashboard] = useState(null);

  // The Monthly Financial Overview caption ("· Jan–Jun 2026") and its growth pill are literals
  // in the markup below, because that card plots the six months the FinancialChart component
  // carries -- not the `monthly` series computed here from the localStorage transaction seed,
  // which is why this component receives `monthly` and the card does not read it.
  //
  // computeYearOverYearGrowth is deliberately kept defined below. It is extracted and driven
  // directly by frontend/verify_dashboard_growth.cjs as the tested definition of that figure,
  // it is what the endpoint's SQL reproduces, and it is what the pill should be switched to
  // the moment the card is fed a series with a prior year to compare against.
  const [showAiAmounts, setShowAiAmounts] = useState({
    predictedExpenses: false,
    recommendedBudget: false,
  });
  const [showAmounts, setShowAmounts] = useState({
    revenue: false,
    receivables: false,
    expenses: false,
    cashFlow: false,
  });

  const toggleAmount = (key) => {
    setShowAmounts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return <section className="dashboard-page">
    <div className="stats four">
     <Stat title="TOTAL REVENUE (MTD)" value={showAmounts.revenue ? money(totalRevenue) : "*"} note="Aug 1–15, 2026" change="↗ 8.3% vs last month" tone="blue" icon={PhilippinePeso} onClick={() => toggleAmount("revenue")} />
     {/* PesoCoinIcon instead of the nearest lucide match (CircleDollarSign, a dollar sign):
         the card is about pesos owed to the firm. The chip behind it is `.stat-icon.orange`,
         whose cream rounded square already supplies the backdrop of the reference artwork. */}
     <Stat title="OUTSTANDING RECEIVABLES" value={showAmounts.receivables ? money(outstandingReceivables) : "*"} note="4 clients with balance" change="↘ 12.1% vs last month" tone="orange" icon={PesoCoinIcon} onClick={() => toggleAmount("receivables")} />
     <Stat title="MONTHLY EXPENSES" value={showAmounts.expenses ? money(totalExpenses) : "*"} note="Payroll + operations" change="↗ 4.7% vs last month" tone="green" icon={Wallet} onClick={() => toggleAmount("expenses")} />
     <Stat title="NET CASH FLOW" value={showAmounts.cashFlow ? money(netCash) : "*"} note="Inflow minus outflow" change="↗ 5.2% vs last month" tone="purple" icon={TrendingUp} onClick={() => toggleAmount("cashFlow")} />
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
                  {showAiAmounts.predictedExpenses ? money(aiBudget.predicted_expenses) : "*"}
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
                  {showAiAmounts.recommendedBudget ? money(aiBudget.recommended_budget) : "*"}
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
          {/* The live figures and the cash-flow graph now come from GET /api/dashboard/live,
              which aggregates the settlement tables in Postgres. They used to be rendered
              here from the client-side transaction list, which is seeded in localStorage and
              never leaves the browser -- so "System Status" and "Expense Ratio" were
              describing seed data rather than the books. The chart is kept inside the
              boundary so a failure inside it cannot blank the whole Dashboard. It replaces
              the old `.live-flow-panel` wrapper, whose min-height: 260px stretched the chart
              and left a band of empty space under the legend. */}
          <ErrorBoundary label="Live dashboard figures">
            <LiveDashboard />
          </ErrorBoundary>
        </div>
      ) : aiBudgetError ? (
        /* The forecast could not be produced. Showing this in place of the panel keeps the
           cash flow graph area accounted for instead of leaving a silent hole in the
           Dashboard, and says plainly why nothing is drawn. */
        <div className="card summary-card ai-budget-card">
          <div className="ai-budget-main">
            <h3>AI BUDGETING</h3>
            <div className="cfu-error" role="alert">{aiBudgetError}</div>
          </div>
        </div>
      ) : null}
    </div>
    <div className="dashboard-grid-new">
      {/* The Monthly Financial Overview card: heading, the year-to-date pill, and the
          hand-built SVG chart defined further down this file.

          The pill is the literal it has always been -- it is not derived from the six months
          the chart draws. Two things are in place for when that should change:
          computeYearOverYearGrowth() near the top of this file plus the .growth-pill.down
          tone in index.css, and MonthlyFinancialOverview.jsx under src/components -- the
          API-connected version of this entire card, which takes its caption and its
          percentage from GET /api/dashboard/monthly-financial-overview. It is unused right
          now, and one import away from being rendered here again. */}
      <div className="card chart-card"><div className="card-heading"><div><h3>Monthly Financial Overview</h3><p>Revenue, Expenses &amp; Profit · Jan–Jun 2026</p></div><span className="growth-pill">▲ +8.3% YTD</span></div><FinancialChart /></div>
      <div className="card allocation-card"><div className="card-heading"><div><h3>Budget Allocation</h3><p>By department · Aug 2026</p></div></div><Donut navigate={navigate} /><div className="allocation-list">{budgetAllocations.map((item, index) => <RowDot key={item.label} item={item} active={hoveredAllocationForDashboard === index} onHover={() => setHoveredAllocationForDashboard(index)} onLeave={() => setHoveredAllocationForDashboard(null)} onClick={() => navigate(item.page)} />)}</div></div>
    </div>
    <div className="card recent-card"><div className="card-heading"><div><h3>Recent Financial Activity</h3><p>Latest transactions across the system</p></div></div><TransactionTable transactions={transactions} /></div>
  </section>;
}

// `monthly` is passed in from Dashboard, which builds it from the real transaction
// list via buildMonthlyFromTransactions(). It was previously read here without ever
// being declared or received, which threw "monthly is not defined" on every render of
// the Dashboard and blanked the whole page. The default keeps the chart drawable if it
// is ever rendered without the prop.
function LiveFlowGraph({ liveNow, monthly = seedMonthly }) {
  const chartWidth = 360;
  const chartHeight = 150;
  // The plot box inside the viewBox. The bars stand on plotBottom and the gridlines span
  // the full plot height, so the 25px strip below it is reserved for the month labels.
  const plotTop = 25;
  const plotBottom = 125;
  const plotHeight = plotBottom - plotTop;
  // Scaled to the data rather than a fixed 2,400,000. A hard-coded ceiling silently
  // clipped the bars once real transaction totals exceeded it, because a value above
  // max produced a negative y and drew outside the plot area.
  const sourceSeries = Array.isArray(monthly) && monthly.length ? monthly : seedMonthly;
  const series = sourceSeries.slice(-6);
  const maxValue = Math.max(1, ...series.flatMap(item => [item.revenue, item.expense]));
  const currentMonthIndex = series.findIndex((item) => {
    const date = new Date(item.m);
    return date.getMonth() === liveNow.getMonth() && date.getFullYear() === liveNow.getFullYear();
  });
  const activeIndex = currentMonthIndex >= 0 ? currentMonthIndex : series.length - 1;

  // Slot geometry is derived from how many bars are actually on screen rather than a
  // fixed 63-unit stride. A two-month series squeezed both bars against the left edge
  // and left four fifths of the plot empty; now any count from 1 to 6 spreads evenly and
  // fills the card the way the six-month view does. One center value is shared by the
  // bar, its label and the line marker so the three cannot drift apart.
  const sidePad = 8;
  const slot = (chartWidth - sidePad * 2) / series.length;
  const barWidth = Math.min(20, slot * 0.3);
  const centerOf = index => sidePad + slot * index + slot / 2;

  // Clamped so an outlier — a refund that makes the net exceed max, or a negative
  // expense — still lands inside the plot instead of drawing over the labels.
  // Clamp order matters: max(lo, min(hi, v)). Reversed, every point pins to plotTop.
  const getY = value => Math.max(plotTop, Math.min(plotBottom, plotBottom - (value / maxValue) * plotHeight));
  const profitPoints = series.map((item, index) => ({
    x: centerOf(index),
    y: getY(item.revenue - item.expense),
  }));
  const profitPath = profitPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const gridLines = [0, 1, 2, 3].map(step => plotTop + (plotHeight / 3) * step);

  return (
    <div className="live-flow-graph">
      <div className="live-flow-heading">
        <span>Cash Flow Trend</span>
        <small>LIVE</small>
      </div>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Real-time cash flow bar and line graph">
        {gridLines.map(y => (
          <line key={y} x1="0" y1={y} x2={chartWidth} y2={y} className="live-grid-line" />
        ))}
        {series.map((item, index) => {
          // Clamped at 0 as well as the top: a negative expense (a refund) would
          // otherwise hand <rect> a negative height, which SVG refuses to draw.
          const barHeight = Math.max(0, (item.expense / maxValue) * plotHeight);
          return (
            <g key={item.m}>
              <rect
                x={centerOf(index) - barWidth / 2}
                y={plotBottom - barHeight}
                width={barWidth}
                height={barHeight}
                rx="3"
                className={`flow-bar ${activeIndex === index ? "active" : ""}`}
              />
              <text x={centerOf(index)} y="143" textAnchor="middle" className="flow-label">{item.m.slice(0, 3)}</text>
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

// The six months the card is specified around -- the figures the reference layout was
// drawn with. The graph is the hand-built SVG (no chart library), plotted against the
// fixed ₱2.4M axis below.
//
// `monthly` is module-level, as it was in the original file. Dashboard also receives a
// `monthly` prop -- the series App.jsx derives from the localStorage transaction list --
// and that parameter shadows this name inside Dashboard only; this component reads the
// array below, which is what the Dashboard's <FinancialChart /> renders.
//
// To drive this from the API instead, replace the array and nothing else. GET
// /api/dashboard/monthly-financial-overview answers with { month, revenue, expenses,
// profit } rows, so it needs a rename to { m, revenue, expense } first -- and the two
// assumptions below have to go with it: the axis is pinned to ₱2.4M and the points sit on
// a 120-unit stride, both of which only hold for exactly six months, and the Postgres
// window currently answers with one month that has a figure in it.
const monthly = [
  { m: "Jan 1, 2026", revenue: 1800000, expense: 1240000 }, { m: "Feb 1, 2026", revenue: 1950000, expense: 1300000 },
  { m: "Mar 1, 2026", revenue: 2100000, expense: 1360000 }, { m: "Apr 1, 2026", revenue: 1980000, expense: 1280000 },
  { m: "May 1, 2026", revenue: 2350000, expense: 1450000 }, { m: "Jun 1, 2026", revenue: 2280000, expense: 1420000 },
];

function FinancialChart() {
  // The reference axis: ₱0.0M on the baseline, ₱2.4M at the top, four ₱0.6M bands.
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
  }));

  const expensePoints = monthly.map((item, index) => ({
    x: index * 120,
    y: getY(item.expense),
    value: item.expense,
  }));

  const profitPoints = monthly.map((item, index) => {
    const profit = item.revenue - item.expense;

    return {
      x: index * 120,
      y: getY(profit),
      value: profit,
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
    // One month per 120 units of the 600-wide viewBox, the same stride the points use.
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
          {/* Filled areas. The fill colour and its opacity live in index.css
              (.revenue-area and friends), so the three tints can be tuned without
              coming back here. */}
          <path
            d={`${revenuePath} L ${chartWidth} ${bottom} L 0 ${bottom} Z`}
            className="revenue-area"
          />
          <path
            d={`${expensePath} L ${chartWidth} ${bottom} L 0 ${bottom} Z`}
            className="expense-area"
          />
          <path
            d={`${profitPath} L ${chartWidth} ${bottom} L 0 ${bottom} Z`}
            className="profit-area"
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

        </svg>

        {/* Hover readout: the month across the top, then one line per series carrying
            its dot, its name and the peso figure. Styled by .financial-tooltip in
            index.css. `left` is the hovered month's share of the plot, so the box tracks
            the same 120-unit stride the guide line and the dots use. */}
        {hovered !== null && currentMonth && (
          <div
            className="financial-tooltip"
            style={{
              left: `${(hovered / (monthly.length - 1)) * 100}%`,
            }}
          >
            <strong>{currentMonth.m}</strong>

            <div>
              <i className="tooltip-blue"></i>
              Revenue
              <b>{money(currentMonth.revenue)}</b>
            </div>

            <div>
              <i className="tooltip-red"></i>
              Expenses
              <b>{money(currentMonth.expense)}</b>
            </div>

            <div>
              <i className="tooltip-green"></i>
              Profit
              <b>{money(currentProfit)}</b>
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

function ContractPage({
  contracts: rows,
  archivedContracts = [],
  onNew,
  onArchive,
  onRestore,
  onUpload,
  onUpdateContract,
  onRenewContract,
  navigate,
}) {
  const [revealedValues, setRevealedValues] = useState({});
  const [showAllValues, setShowAllValues] = useState(false);
  const [revealedCycles, setRevealedCycles] = useState({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [filterExpiration, setFilterExpiration] = useState("All Dates");
  const [selectedContract, setSelectedContract] = useState(null);
  const [detailTab, setDetailTab] = useState("details"); // "details" | "billing" | "renewal"
  const [renewalForm, setRenewalForm] = useState({ newEnd: "", renewedValue: "", notes: "" });

  const today = new Date();

  const getExpirationState = (endDate, originalStatus) => {
    if (originalStatus === "Archived") {
      return { status: "Archived", days: null, label: "Archived" };
    }
    const end = new Date(endDate);
    if (Number.isNaN(end.getTime())) {
      return { status: originalStatus || "Active", days: null, label: originalStatus || "Active" };
    }
    const diffDays = Math.ceil((end - today) / 86400000);
    if (diffDays < 0) {
      return { status: "Expired", days: diffDays, label: `Expired (${Math.abs(diffDays)}d ago)` };
    }
    if (diffDays <= 92) {
      return { status: "Expiring Soon", days: diffDays, label: `Expiring Soon (${diffDays}d left)` };
    }
    return { status: "Active", days: diffDays, label: `Active (${diffDays}d left)` };
  };

  // Counts for the 4 monitoring cards
  const activeCount = rows.filter(c => getExpirationState(c.end, c.status).status === "Active").length;
  const expiringCount = rows.filter(c => getExpirationState(c.end, c.status).status === "Expiring Soon").length;
  const expiredCount = rows.filter(c => getExpirationState(c.end, c.status).status === "Expired").length;
  const archivedCount = (archivedContracts || []).length;

  const isArchivedView = filterStatus === "Archived";
  const sourceList = isArchivedView ? (archivedContracts || []).map(a => ({ ...a, status: "Archived" })) : rows;

  const filteredContracts = sourceList.filter(c => {
    const { status, days } = getExpirationState(c.end, c.status);

    if (filterStatus !== "All Status" && status !== filterStatus) {
      return false;
    }

    if (filterExpiration === "Expiring within 30 Days" && (days === null || days < 0 || days > 30)) {
      return false;
    }
    if (filterExpiration === "Expiring within 90 Days" && (days === null || days < 0 || days > 92)) {
      return false;
    }
    if (filterExpiration === "Expired" && (days === null || days >= 0)) {
      return false;
    }
    if (filterExpiration === "More than 3 Months" && (days === null || days <= 92)) {
      return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const phrase = `${c.id || ""} ${c.client || ""} ${c.company || ""} ${c.contactPerson || ""} ${c.contractType || ""}`.toLowerCase();
      if (!phrase.includes(q)) return false;
    }

    return true;
  });

  const toggleValue = (id) => {
    setRevealedValues(prev => ({
      ...prev,
      [id]: !(prev[id] ?? showAllValues)
    }));
  };

  const toggleAllValues = () => {
    const nextState = !showAllValues;
    setShowAllValues(nextState);
    const updated = {};
    rows.forEach(c => {
      updated[c.id] = nextState;
    });
    setRevealedValues(updated);
  };

  const toggleCycleAmount = (id) => {
    setRevealedCycles(prev => ({
      ...prev,
      [id]: !(prev[id] ?? showAllValues)
    }));
  };

  const openDetailModal = (contract, defaultTab = "details") => {
    setSelectedContract(contract);
    setDetailTab(defaultTab);
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setRenewalForm({
      newEnd: nextYear.toISOString().slice(0, 10),
      renewedValue: contract.value,
      notes: "Annual renewal with existing terms",
    });
  };

  const handleApplyRenewal = (e) => {
    e.preventDefault();
    if (!selectedContract || !renewalForm.newEnd) {
      window.alert("Please provide a valid new expiration date.");
      return;
    }
    onRenewContract?.(selectedContract.id, renewalForm);
    setSelectedContract(prev => prev ? {
      ...prev,
      end: renewalForm.newEnd,
      value: Number(renewalForm.renewedValue || prev.value),
      status: "Active",
      renewals: [
        {
          id: `REN-${Date.now()}`,
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          previousEnd: prev.end,
          newEnd: renewalForm.newEnd,
          renewedValue: Number(renewalForm.renewedValue || prev.value),
          notes: renewalForm.notes || "Contract renewed",
        },
        ...(prev.renewals || [])
      ]
    } : null);
    window.alert(`Contract ${selectedContract.id} has been renewed until ${renewalForm.newEnd}!`);
  };

  const printContract = (c) => {
    const exp = getExpirationState(c.end, c.status);
    const docLines = (c.documents || []).length
      ? `<ul>${(c.documents || []).map(d => `<li>${d.name} (${d.uploadedAt || ""})</li>`).join("")}</ul>`
      : "<p>No supporting documents uploaded.</p>";
    const renewalLines = (c.renewals || []).length
      ? `<ul>${c.renewals.map(r => `<li><b>${r.date}:</b> Extended to ${r.newEnd} (${money(r.renewedValue)}) - ${r.notes}</li>`).join("")}</ul>`
      : "<p>Original contract term; no renewals recorded.</p>";

    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>Contract ${c.id}</title></head><body style="font-family:Arial,sans-serif;padding:40px;color:#203b4e">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #159bd3;padding-bottom:12px">
        <h2>PRIMEPOWER — Client Contract Summary</h2>
        <span style="font-size:12px;color:#666">Generated: ${new Date().toLocaleString()}</span>
      </div>
      <div style="margin-top:20px;line-height:1.7">
        <p><b>Contract ID:</b> ${c.id}</p>
        <p><b>Client / Payee:</b> ${c.client} ${c.company ? `(${c.company})` : ""}</p>
        <p><b>Contact Person:</b> ${c.contactPerson || "—"} | ${c.contactPhone || "—"} | ${c.contactEmail || "—"}</p>
        <p><b>Contract Type:</b> ${c.contractType || "Service Agreement"}</p>
        <p><b>Contract Value:</b> ${money(c.value)}</p>
        <p><b>Billing Cycle:</b> ${c.billingCycle || "Monthly"} (${money(c.billingAmount || Math.round(c.value / 12))} / cycle)</p>
        <p><b>Payment Terms:</b> ${c.paymentTerms || "Net 30 Days"}</p>
        <p><b>Period:</b> ${c.start} to ${c.end}</p>
        <p><b>Status:</b> ${exp.status} ${exp.days !== null ? `(${exp.days} days)` : ""}</p>
      </div>
      <hr style="margin:20px 0;border:0;border-top:1px solid #e0e0e0"/>
      <h3>Supporting Documents</h3>${docLines}
      <h3>Renewal History</h3>${renewalLines}
      <script>window.print()</script>
    </body></html>`);
    w.document.close();
  };

  const printAllContracts = () => {
    const w = window.open("", "_blank");
    const rowsHtml = filteredContracts.map(c => {
      const exp = getExpirationState(c.end, c.status);
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0">${c.id}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0"><b>${c.client}</b><br/><small style="color:#64748b">${c.company || ""}</small></td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0">${money(c.value)}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0">${c.start}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0">${c.end}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0">${c.billingCycle || "Monthly"}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0">${exp.status}</td>
      </tr>`;
    }).join("");

    w.document.write(`<html><head><title>Contracts Report</title></head><body style="font-family:Arial,sans-serif;padding:30px;color:#203b4e">
      <h2>PRIMEPOWER — Client Contract Management Report</h2>
      <p style="color:#64748b">Filter: ${filterStatus} | Total records: ${filteredContracts.length} | Generated: ${new Date().toLocaleString()}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:15px;font-size:11px">
        <thead>
          <tr style="background:#f1f5f9;text-align:left">
            <th style="padding:8px">Contract ID</th>
            <th style="padding:8px">Client</th>
            <th style="padding:8px">Contract Value</th>
            <th style="padding:8px">Start Date</th>
            <th style="padding:8px">End Date</th>
            <th style="padding:8px">Billing Cycle</th>
            <th style="padding:8px">Status</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <script>window.print()</script>
    </body></html>`);
    w.document.close();
  };

  const exportContracts = () => {
    const headers = ["Contract ID", "Client", "Company", "Contact Person", "Contract Value", "Start Date", "End Date", "Billing Cycle", "Payment Terms", "Status"];
    const rowsCsv = filteredContracts.map(c => [
      `"${c.id}"`,
      `"${c.client || ""}"`,
      `"${c.company || ""}"`,
      `"${c.contactPerson || ""}"`,
      `"${c.value}"`,
      `"${c.start || ""}"`,
      `"${c.end || ""}"`,
      `"${c.billingCycle || "Monthly"}"`,
      `"${c.paymentTerms || "Net 30 Days"}"`,
      `"${getExpirationState(c.end, c.status).status}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rowsCsv.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PrimePower_Contracts_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return <section className="management-page client-contract-page">
    <Breadcrumb current="Client Contract Management" parent="Client Billing Management" />
    
    <div className="management-header">
      <div>
        <h2>Client Contract Management</h2>
        <p>Manage client contracts, automatic 3-month expiration tracking, renewal schedules, and connected billing workflows.</p>
      </div>
      <div className="management-actions">
        <button className="light-button" onClick={exportContracts} title="Export to CSV"><FileDown size={15}/> Export</button>
        <button className="light-button" onClick={printAllContracts} title="Print summary"><Printer size={15}/> Print</button>
        <button className="primary-button" onClick={onNew}>＋ New Contract</button>
      </div>
    </div>

    {/* 4 Contract Expiration Monitoring Cards */}
    <div className="contract-expiration-grid">
      <div
        className={`contract-exp-card active ${filterStatus === "Active" ? "selected" : ""}`}
        onClick={() => setFilterStatus(prev => prev === "Active" ? "All Status" : "Active")}
        role="button"
        tabIndex="0"
        onKeyDown={e => { if (e.key === "Enter") setFilterStatus(prev => prev === "Active" ? "All Status" : "Active"); }}
      >
        <div className="contract-exp-header">
          <div className="contract-exp-icon active">
            <CheckCircle2 size={16} />
          </div>
          <span className="contract-exp-badge active">🟢 ACTIVE</span>
        </div>
        <strong className="contract-exp-count">{activeCount}</strong>
        <span className="contract-exp-title">Contracts currently valid</span>
        <small className="contract-exp-sub">More than 3 months remaining</small>
      </div>

      <div
        className={`contract-exp-card expiring ${filterStatus === "Expiring Soon" ? "selected" : ""}`}
        onClick={() => setFilterStatus(prev => prev === "Expiring Soon" ? "All Status" : "Expiring Soon")}
        role="button"
        tabIndex="0"
        onKeyDown={e => { if (e.key === "Enter") setFilterStatus(prev => prev === "Expiring Soon" ? "All Status" : "Expiring Soon"); }}
      >
        <div className="contract-exp-header">
          <div className="contract-exp-icon expiring">
            <AlertTriangle size={16} />
          </div>
          <span className="contract-exp-badge expiring">🟡 EXPIRING SOON</span>
        </div>
        <strong className="contract-exp-count">{expiringCount}</strong>
        <span className="contract-exp-title">Expiring within 3 months</span>
        <small className="contract-exp-sub">Action / renewal required</small>
      </div>

      <div
        className={`contract-exp-card expired ${filterStatus === "Expired" ? "selected" : ""}`}
        onClick={() => setFilterStatus(prev => prev === "Expired" ? "All Status" : "Expired")}
        role="button"
        tabIndex="0"
        onKeyDown={e => { if (e.key === "Enter") setFilterStatus(prev => prev === "Expired" ? "All Status" : "Expired"); }}
      >
        <div className="contract-exp-header">
          <div className="contract-exp-icon expired">
            <Clock3 size={16} />
          </div>
          <span className="contract-exp-badge expired">🔴 EXPIRED</span>
        </div>
        <strong className="contract-exp-count">{expiredCount}</strong>
        <span className="contract-exp-title">Past expiration date</span>
        <small className="contract-exp-sub">Needs renewal or archive</small>
      </div>

      <div
        className={`contract-exp-card archived ${filterStatus === "Archived" ? "selected" : ""}`}
        onClick={() => setFilterStatus(prev => prev === "Archived" ? "All Status" : "Archived")}
        role="button"
        tabIndex="0"
        onKeyDown={e => { if (e.key === "Enter") setFilterStatus(prev => prev === "Archived" ? "All Status" : "Archived"); }}
      >
        <div className="contract-exp-header">
          <div className="contract-exp-icon archived">
            <Archive size={16} />
          </div>
          <span className="contract-exp-badge archived">⚪ ARCHIVED</span>
        </div>
        <strong className="contract-exp-count">{archivedCount}</strong>
        <span className="contract-exp-title">Archived contracts</span>
        <small className="contract-exp-sub">Completed or terminated</small>
      </div>
    </div>

    {/* Automatic 3-Month Alert Banner */}
    <div className="alert-strip">
      <AlertTriangle size={17} />
      <span>
        <b>Automatic 3-Month Rule:</b> Contracts with 3 months or less remaining are flagged <b>Expiring Soon</b> and alerted for renewal.
      </span>
    </div>

    {/* Toolbar / Search & Filters */}
    <div className="contract-toolbar">
      <div className="search-box contract-search">
        <span>⌕</span>
        <input
          placeholder="Search contract no., client, company, contact..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="contract-toolbar-controls">
        <select
          className="contract-select"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option>All Status</option>
          <option>Active</option>
          <option>Expiring Soon</option>
          <option>Expired</option>
          <option>Archived</option>
        </select>
        <select
          className="contract-select"
          value={filterExpiration}
          onChange={e => setFilterExpiration(e.target.value)}
        >
          <option>All Dates</option>
          <option>Expiring within 30 Days</option>
          <option>Expiring within 90 Days</option>
          <option>Expired</option>
          <option>More than 3 Months</option>
        </select>
      </div>
    </div>

    {/* Contract Table */}
    <div className="table-card contract-card">
      <table>
        <thead>
          <tr>
            <th>Contract No.</th>
            <th>Client</th>
            <th>
              <div className="th-with-action">
                <span>Contract Value</span>
                <button
                  type="button"
                  className="header-visibility-toggle"
                  onClick={toggleAllValues}
                  title={showAllValues ? "Hide all contract values" : "Show all contract values"}
                  aria-label={showAllValues ? "Hide all contract values" : "Show all contract values"}
                >
                  {showAllValues ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Billing Cycle</th>
            <th>Status</th>
            <th>Documents</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredContracts.length ? filteredContracts.map(c => {
            const exp = getExpirationState(c.end, c.status);
            const isRevealed = revealedValues[c.id] ?? showAllValues;
            const isCycleRevealed = revealedCycles[c.id] ?? showAllValues;
            const statusKey = exp.status.toLowerCase().replaceAll(" ", "-");
            const isArchived = exp.status === "Archived";

            return <tr key={c.id}>
              <td className="link-cell">
                <button
                  type="button"
                  className="contract-id-link"
                  onClick={() => openDetailModal(c, "details")}
                  title="View Contract Details"
                >
                  {c.id}
                </button>
              </td>
              <td className="strong-cell">
                <div className="client-cell">
                  <strong>{c.client}</strong>
                  {c.company && <span className="client-company">{c.company}</span>}
                </div>
              </td>
              <td className="money-cell">
                <button
                  type="button"
                  className={`contract-value-button ${isRevealed ? "revealed" : "masked"}`}
                  onClick={() => toggleValue(c.id)}
                  title={isRevealed ? "Click to hide contract value" : "Click to view contract value"}
                >
                  <span>{isRevealed ? money(c.value) : "*"}</span>
                  <span className="contract-value-icon">
                    {isRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                  </span>
                </button>
              </td>
              <td>{c.start}</td>
              <td>
                <div className="end-date-cell">
                  <span>{c.end}</span>
                  {exp.days !== null && (
                    <small className={`days-badge ${statusKey}`}>
                      {exp.days < 0 ? `${Math.abs(exp.days)}d ago` : `${exp.days}d left`}
                    </small>
                  )}
                </div>
              </td>
              <td>
                <div className="billing-cycle-cell">
                  <span className="billing-cycle-name">{c.billingCycle || "Monthly"}</span>
                  <small className="billing-amount-hint">
                    <button
                      type="button"
                      className={`billing-amount-toggle ${isCycleRevealed ? "revealed" : "masked"}`}
                      onClick={() => toggleCycleAmount(c.id)}
                      title={isCycleRevealed ? "Click to hide billing amount" : "Click to view billing amount"}
                      aria-label={isCycleRevealed ? "Hide billing amount" : "Show billing amount"}
                    >
                      <span>{isCycleRevealed ? money(c.billingAmount || Math.round(c.value / 12)) : "*"}</span>
                      <span className="billing-amount-icon">
                        {isCycleRevealed ? <EyeOff size={9} /> : <Eye size={9} />}
                      </span>
                    </button>
                    <span className="billing-amount-unit">/cycle</span>
                  </small>
                </div>
              </td>
              <td>
                <span className={`contract-status-badge ${statusKey}`}>
                  <span className="status-indicator-dot"></span>
                  {exp.status}
                </span>
              </td>
              <td>
                <label className="upload-label">
                  <Upload size={14}/> PDF
                  <input type="file" accept="application/pdf" hidden onChange={e => onUpload(c.id, e.target.files?.[0])}/>
                </label>
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
              <td>
                <div className="row-actions">
                  <button title="View Contract Details" onClick={() => openDetailModal(c, "details")}>
                    <FileText size={15}/>
                  </button>
                  {!isArchived && (
                    <button title="Renew Contract" onClick={() => openDetailModal(c, "renewal")}>
                      <RotateCcw size={15}/>
                    </button>
                  )}
                  <button title="Print Contract" onClick={() => printContract(c)}>
                    <Printer size={15}/>
                  </button>
                  {isArchived ? (
                    <button title="Restore Contract" onClick={() => onRestore?.(c)}>
                      <ArchiveRestore size={15}/>
                    </button>
                  ) : (
                    <button title="Archive Contract" onClick={() => onArchive(c)}>
                      <Archive size={15}/>
                    </button>
                  )}
                </div>
              </td>
            </tr>;
          }) : (
            <tr>
              <td colSpan="9" className="empty">
                No contracts matching the selected filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* Detail / Renewal / Connected Flow Modal */}
    {selectedContract && (
      <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
        <div className="modal contract-detail-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <div className="modal-header-top">
                <h2>{selectedContract.client}</h2>
                <span className={`contract-status-badge ${getExpirationState(selectedContract.end, selectedContract.status).status.toLowerCase().replaceAll(" ", "-")}`}>
                  <span className="status-indicator-dot"></span>
                  {getExpirationState(selectedContract.end, selectedContract.status).status}
                </span>
              </div>
              <p>Contract Number: <b>{selectedContract.id}</b> | Total Value: <b>{money(selectedContract.value)}</b></p>
            </div>
            <button type="button" onClick={() => setSelectedContract(null)} aria-label="Close modal">
              <X size={20}/>
            </button>
          </div>

          <div className="contract-modal-tabs">
            <button
              type="button"
              className={`contract-tab-btn ${detailTab === "details" ? "active" : ""}`}
              onClick={() => setDetailTab("details")}
            >
              1. Contract & Client Details
            </button>
            <button
              type="button"
              className={`contract-tab-btn ${detailTab === "billing" ? "active" : ""}`}
              onClick={() => setDetailTab("billing")}
            >
              2. Connected Client Billing Flow
            </button>
            <button
              type="button"
              className={`contract-tab-btn ${detailTab === "renewal" ? "active" : ""}`}
              onClick={() => setDetailTab("renewal")}
            >
              3. Renewal & History
            </button>
          </div>

          <div className="contract-modal-body">
            {detailTab === "details" && (
              <div className="contract-tab-content">
                <div className="contract-details-grid">
                  <div className="contract-section-card">
                    <h4>Client Information</h4>
                    <div className="detail-list">
                      <div><span>Client / Payee:</span><b>{selectedContract.client}</b></div>
                      <div><span>Company / Group:</span><b>{selectedContract.company || selectedContract.client}</b></div>
                      <div><span>Contact Person:</span><b>{selectedContract.contactPerson || "Sarah Jenkins"}</b></div>
                      <div><span>Contact Phone:</span><b>{selectedContract.contactPhone || "+63 917 555 0101"}</b></div>
                      <div><span>Contact Email:</span><b>{selectedContract.contactEmail || "billing@client.com"}</b></div>
                    </div>
                  </div>

                  <div className="contract-section-card">
                    <h4>Contract & Billing Terms</h4>
                    <div className="detail-list">
                      <div><span>Contract Type:</span><b>{selectedContract.contractType || "Service Agreement"}</b></div>
                      <div><span>Total Contract Value:</span><b className="highlight-amount">{money(selectedContract.value)}</b></div>
                      <div><span>Billing Frequency:</span><b>{selectedContract.billingCycle || "Monthly"}</b></div>
                      <div><span>Billing per Cycle:</span><b>{money(selectedContract.billingAmount || Math.round(selectedContract.value / 12))}</b></div>
                      <div><span>Payment Terms:</span><b>{selectedContract.paymentTerms || "Net 30 Days"}</b></div>
                    </div>
                  </div>

                  <div className="contract-section-card full">
                    <h4>Expiration Tracking (Automatic 3-Month Rule)</h4>
                    <div className="expiration-tracking-box">
                      <div className="exp-metric">
                        <span>Start Date</span>
                        <strong>{selectedContract.start}</strong>
                      </div>
                      <div className="exp-arrow">→</div>
                      <div className="exp-metric">
                        <span>Expiration Date</span>
                        <strong>{selectedContract.end}</strong>
                      </div>
                      <div className="exp-arrow">→</div>
                      <div className="exp-metric">
                        <span>Countdown</span>
                        <strong className={`status-color-${getExpirationState(selectedContract.end, selectedContract.status).status.toLowerCase().replaceAll(" ", "-")}`}>
                          {getExpirationState(selectedContract.end, selectedContract.status).label}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="contract-section-card full">
                    <h4>Contract Documents</h4>
                    <div className="modal-doc-actions">
                      <label className="upload-label">
                        <Upload size={14}/> Upload Supporting PDF
                        <input type="file" accept="application/pdf" hidden onChange={e => {
                          onUpload(selectedContract.id, e.target.files?.[0]);
                          window.alert("Document uploaded successfully.");
                        }}/>
                      </label>
                    </div>
                    {selectedContract.documents?.length ? (
                      <div className="modal-doc-list">
                        {selectedContract.documents.map(d => (
                          <div key={d.id || d.name} className="modal-doc-item">
                            <FileText size={16} />
                            <span>{d.name}</span>
                            <button type="button" className="document-link" onClick={() => openSavedPDF(d.id)}>
                              View PDF
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-docs-text">No uploaded documents attached to this contract yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {detailTab === "billing" && (
              <div className="contract-tab-content">
                <div className="flow-explanation-card">
                  <h4>Connected Client Billing Flow</h4>
                  <p>
                    This contract directly drives downstream billing schedules, invoice generation, receivables, and payment reconciliation.
                  </p>
                </div>

                <div className="billing-pipeline-grid">
                  <div className="pipeline-step current">
                    <span className="step-num">1</span>
                    <strong>Contract Setup</strong>
                    <p>{selectedContract.id} ({money(selectedContract.value)})</p>
                    <small>Client Contract Management</small>
                  </div>
                  <div className="pipeline-arrow">→</div>

                  <div className="pipeline-step">
                    <span className="step-num">2</span>
                    <strong>Billing Schedule</strong>
                    <p>{selectedContract.billingCycle || "Monthly"} @ {money(selectedContract.billingAmount || Math.round(selectedContract.value / 12))}</p>
                    <small>Billing Schedule Monitoring</small>
                  </div>
                  <div className="pipeline-arrow">→</div>

                  <div className="pipeline-step">
                    <span className="step-num">3</span>
                    <strong>Billing Generation</strong>
                    <p>Automated Cycle Billing</p>
                    <small>Billing Generation</small>
                  </div>
                  <div className="pipeline-arrow">→</div>

                  <div className="pipeline-step">
                    <span className="step-num">4</span>
                    <strong>Service Invoice</strong>
                    <p>Issues Official Invoice</p>
                    <small>Service Invoice Management</small>
                  </div>
                  <div className="pipeline-arrow">→</div>

                  <div className="pipeline-step">
                    <span className="step-num">5</span>
                    <strong>Receivable Tracking</strong>
                    <p>Monitors Balances</p>
                    <small>Accounts Receivable</small>
                  </div>
                  <div className="pipeline-arrow">→</div>

                  <div className="pipeline-step">
                    <span className="step-num">6</span>
                    <strong>Payment Recording</strong>
                    <p>Official Receipt</p>
                    <small>Payment Recording</small>
                  </div>
                </div>

                <div className="pipeline-actions-row">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      setSelectedContract(null);
                      navigate?.("Billing Schedule Monitoring");
                    }}
                  >
                    Go to Billing Schedule Monitoring <ArrowRight size={14}/>
                  </button>
                  <button
                    type="button"
                    className="light-button"
                    onClick={() => {
                      setSelectedContract(null);
                      navigate?.("Billing Generation");
                    }}
                  >
                    Go to Billing Generation <ExternalLink size={14}/>
                  </button>
                </div>
              </div>
            )}

            {detailTab === "renewal" && (
              <div className="contract-tab-content">
                <form onSubmit={handleApplyRenewal} className="renewal-form-box">
                  <h4>Record Contract Renewal / Amendment</h4>
                  <p className="form-subtext">
                    Extending this contract updates its expiration date, records an audit log, and recalculates its status to Active.
                  </p>

                  <div className="renewal-inputs-grid">
                    <label>
                      New Expiration Date
                      <input
                        type="date"
                        required
                        value={renewalForm.newEnd}
                        onChange={e => setRenewalForm(prev => ({ ...prev, newEnd: e.target.value }))}
                      />
                    </label>

                    <label>
                      Renewed Contract Value (PHP)
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        required
                        value={renewalForm.renewedValue}
                        onChange={e => setRenewalForm(prev => ({ ...prev, renewedValue: e.target.value }))}
                      />
                    </label>

                    <label className="full">
                      Renewal Terms / Amendment Notes
                      <input
                        placeholder="e.g. 1-year service extension with 5% rate adjustment"
                        value={renewalForm.notes}
                        onChange={e => setRenewalForm(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </label>
                  </div>

                  <div className="renewal-actions">
                    <button type="submit" className="primary-button">
                      <RotateCcw size={14}/> Confirm & Record Renewal
                    </button>
                  </div>
                </form>

                <div className="renewal-history-section">
                  <h4>Renewal History & Amendments</h4>
                  {selectedContract.renewals?.length ? (
                    <div className="table-card modal-table-card">
                      <table>
                        <thead>
                          <tr>
                            <th>Date Recorded</th>
                            <th>Previous End</th>
                            <th>New Expiration</th>
                            <th>Renewed Value</th>
                            <th>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedContract.renewals.map(r => (
                            <tr key={r.id || r.date}>
                              <td>{r.date}</td>
                              <td>{r.previousEnd}</td>
                              <td className="strong-cell">{r.newEnd}</td>
                              <td>{money(r.renewedValue)}</td>
                              <td>{r.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="no-docs-text">This is the original contract term. No previous renewals on file.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="light-button" onClick={() => printContract(selectedContract)}>
              <Printer size={15}/> Print Contract
            </button>
            <button type="button" className="cancel-button" onClick={() => setSelectedContract(null)}>
              Close
            </button>
          </div>
        </div>
      </div>
    )}
  </section>;
}

function BillingGenerationPage({ billings, setBillings, contracts, onGenerate, onAudit }) {
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [search, setSearch] = useState("");
  const [selectedBilling, setSelectedBilling] = useState(billings[0] || null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    billing_period: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    billing_date: new Date().toISOString().slice(0, 10),
    contract_no: "",
  });
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState(null);
  const [revealedAmounts, setRevealedAmounts] = useState({});
  const [showAllAmounts, setShowAllAmounts] = useState(false);
  const [revealedSummary, setRevealedSummary] = useState({ totalBilling: false, totalTax: false, totalAmount: false });
  const [revealedDetail, setRevealedDetail] = useState({});

  const toggleDetail = (key) => {
    setRevealedDetail(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const DetailAmount = ({ amountKey, value }) => {
    const revealed = !!revealedDetail[amountKey];
    return (
      <button
        type="button"
        className={`contract-value-button ${revealed ? "revealed" : "masked"}`}
        onClick={() => toggleDetail(amountKey)}
        title={revealed ? "Click to hide amount" : "Click to view amount"}
      >
        <span>{revealed ? money(value) : "*"}</span>
        <span className="contract-value-icon">
          {revealed ? <EyeOff size={11} /> : <Eye size={11} />}
        </span>
      </button>
    );
  };

  const activeContracts = contracts.filter(c => c.status !== "Expired" && c.status !== "Archived");

  const totalBillingAmount = billings.reduce((sum, b) => sum + Number(b.billingAmount || 0), 0);
  const totalTax = billings.reduce((sum, b) => sum + Number(b.tax || 0), 0);
  const totalAmount = billings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
  const generatedCount = billings.filter(b => b.status === "Generated").length;
  const overdueCount = billings.filter(b => b.status === "Overdue").length;
  const paidCount = billings.filter(b => b.status === "Paid").length;

  const toggleAmount = (id) => {
    setRevealedAmounts(prev => ({
      ...prev,
      [id]: !(prev[id] ?? showAllAmounts)
    }));
  };

  const toggleAllAmounts = () => {
    const nextState = !showAllAmounts;
    setShowAllAmounts(nextState);
    const updated = {};
    billings.forEach(b => {
      updated[b.id] = nextState;
    });
    setRevealedAmounts(updated);
  };

  const toggleSummaryAmount = (key) => {
    setRevealedSummary(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredBillings = billings.filter(b => {
    const matchesStatus = filterStatus === "All Status" || b.status === filterStatus;
    const phrase = `${b.id} ${b.contractNo} ${b.client} ${b.billingPeriod}`.toLowerCase();
    const matchesSearch = phrase.includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setGenerateResult(null);

    const result = await onGenerate({
      billing_period: generateForm.billing_period,
      billing_date: generateForm.billing_date,
      contract_no: generateForm.contract_no || undefined,
    });

    setGenerating(false);
    setGenerateResult(result);

    if (result?.success && result.data?.length) {
      setBillings(prev => {
        const existingIds = new Set(prev.map(b => b.id));
        const newBillings = result.data.filter(b => !existingIds.has(b.id));
        return [...newBillings, ...prev];
      });
      onAudit?.("Generated billing records", `${result.data.length} billing(s) for ${generateForm.billing_period}`);
    }
  };

  const printBilling = (b) => {
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>${b.id}</title></head><body style="font-family:Arial,sans-serif;padding:40px;color:#203b4e">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #159bd3;padding-bottom:12px">
        <h2>PRIMEPOWER — Billing Statement</h2>
        <span style="font-size:12px;color:#666">Generated: ${new Date().toLocaleString()}</span>
      </div>
      <div style="margin-top:20px;line-height:1.7">
        <p><b>Billing No.:</b> ${b.id}</p>
        <p><b>Contract No.:</b> ${b.contractNo}</p>
        <p><b>Client:</b> ${b.client}</p>
        <p><b>Billing Period:</b> ${b.billingPeriod}</p>
        <p><b>Billing Date:</b> ${b.billingDate}</p>
        <p><b>Due Date:</b> ${b.dueDate}</p>
        <p><b>Service Description:</b> ${b.serviceDescription}</p>
        <p><b>Billing Cycle:</b> ${b.billingCycle}</p>
        <p><b>Contract Amount:</b> ${money(b.contractAmount)}</p>
        <p><b>Billing Amount:</b> ${money(b.billingAmount)}</p>
        <p><b>Tax (12%):</b> ${money(b.tax)}</p>
        <p><b>Discount:</b> ${money(b.discount)}</p>
        <p><b>Total Amount:</b> ${money(b.totalAmount)}</p>
        <p><b>Status:</b> ${b.status}</p>
        <p><b>Invoice Status:</b> ${b.invoiceStatus}</p>
        <p><b>Payment Status:</b> ${b.paymentStatus}</p>
      </div>
      <script>window.print()</script>
    </body></html>`);
    w.document.close();
  };

  const exportBillings = () => {
    const headers = ["Billing No.", "Contract No.", "Client", "Billing Period", "Billing Date", "Due Date", "Billing Amount", "Tax", "Total Amount", "Status", "Invoice Status", "Payment Status"];
    const rowsCsv = filteredBillings.map(b => [
      `"${b.id}"`,
      `"${b.contractNo}"`,
      `"${b.client}"`,
      `"${b.billingPeriod}"`,
      `"${b.billingDate}"`,
      `"${b.dueDate}"`,
      `"${b.billingAmount}"`,
      `"${b.tax}"`,
      `"${b.totalAmount}"`,
      `"${b.status}"`,
      `"${b.invoiceStatus}"`,
      `"${b.paymentStatus}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rowsCsv.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PrimePower_Billings_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return <section className="management-page billing-generation-page">
    <Breadcrumb current="Billing Generation" parent="Client Billing Management" />

    <div className="management-header">
      <div>
        <h2>Billing Generation</h2>
        <p>Automatically generate billing records from active client contracts and their billing schedules.</p>
      </div>
      <div className="management-actions">
        <button className="light-button" onClick={exportBillings} title="Export to CSV"><FileDown size={15}/> Export</button>
        <button className="primary-button" onClick={() => setShowGenerateModal(true)}><RotateCcw size={15}/> Generate Billings</button>
      </div>
    </div>

    {/* Billing Summary Cards */}
    <div className="vendor-summary-grid">
      <div className="vendor-summary-card" onClick={() => toggleSummaryAmount("totalBilling")} role="button" tabIndex="0" onKeyDown={e => { if (e.key === "Enter") toggleSummaryAmount("totalBilling"); }}>
        <span className="vendor-summary-label">Total Billing Amount</span>
        <strong className="vendor-summary-amount total-payable-amount">{revealedSummary.totalBilling ? money(totalBillingAmount) : "*"}</strong>
      </div>
      <div className="vendor-summary-card" onClick={() => toggleSummaryAmount("totalTax")} role="button" tabIndex="0" onKeyDown={e => { if (e.key === "Enter") toggleSummaryAmount("totalTax"); }}>
        <span className="vendor-summary-label">Total Tax (12%)</span>
        <strong className="vendor-summary-amount pending-amount">{revealedSummary.totalTax ? money(totalTax) : "*"}</strong>
      </div>
      <div className="vendor-summary-card" onClick={() => toggleSummaryAmount("totalAmount")} role="button" tabIndex="0" onKeyDown={e => { if (e.key === "Enter") toggleSummaryAmount("totalAmount"); }}>
        <span className="vendor-summary-label">Total Amount Due</span>
        <strong className="vendor-summary-amount paid-amount">{revealedSummary.totalAmount ? money(totalAmount) : "*"}</strong>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Generated / Overdue / Paid</span>
        <strong className="vendor-summary-amount">{generatedCount} / {overdueCount} / {paidCount}</strong>
      </div>
    </div>

    {/* Data Flow Explanation */}
    <div className="flow-explanation-card">
      <h4>How Billing Data Flows</h4>
      <p>
        <b>Client Contract</b> (CON-001, <DetailAmount amountKey="flow-contractValue" value={2400000} />, Monthly) → <b>Billing Schedule</b> (<DetailAmount amountKey="flow-scheduleAmount" value={200000} />/month) → <b>Billing Generation</b> (BILL-001, <DetailAmount amountKey="flow-billingAmount" value={200000} />) → <b>Service Invoice</b> (INV-001) → <b>Accounts Receivable</b> (<DetailAmount amountKey="flow-receivable" value={200000} /> Outstanding) → <b>Payment Recording</b> → <b>Paid</b>
      </p>
    </div>

    {/* Toolbar */}
    <div className="vendor-toolbar">
      <div className="search-box vendor-search"><span>⌕</span><input placeholder="Search billing no., contract, client, period..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="vendor-toolbar-controls">
        <select className="vendor-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option>All Status</option>
          <option>Draft</option>
          <option>Generated</option>
          <option>Invoiced</option>
          <option>Paid</option>
          <option>Partially Paid</option>
          <option>Overdue</option>
          <option>Cancelled</option>
        </select>
      </div>
    </div>

    {/* Billing Records Table */}
    <section className="vendor-record-panel">
      <div className="vendor-record-heading">
        <h3>Billing Records</h3>
      </div>
      <div className="table-card vendor-table-card">
        <table>
          <thead>
            <tr>
              <th>Billing No.</th>
              <th>Contract No.</th>
              <th>Client</th>
              <th>Billing Period</th>
              <th>Billing Date</th>
              <th>Due Date</th>
              <th>
                <div className="th-with-action">
                  <span>Amount</span>
                  <button
                    type="button"
                    className="header-visibility-toggle"
                    onClick={toggleAllAmounts}
                    title={showAllAmounts ? "Hide all billing amounts" : "Show all billing amounts"}
                    aria-label={showAllAmounts ? "Hide all billing amounts" : "Show all billing amounts"}
                  >
                    {showAllAmounts ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBillings.length ? filteredBillings.map(b => (
              <tr key={b.id} onClick={() => setSelectedBilling(b)} className={selectedBilling?.id === b.id ? "selected-row" : ""}>
                <td className="link-cell">{b.id}</td>
                <td>{b.contractNo}</td>
                <td className="strong-cell">{b.client}</td>
                <td>{b.billingPeriod}</td>
                <td>{b.billingDate}</td>
                <td>{b.dueDate}</td>
                <td className="money-cell">
                  <button
                    type="button"
                    className={`contract-value-button ${(revealedAmounts[b.id] ?? showAllAmounts) ? "revealed" : "masked"}`}
                    onClick={(e) => { e.stopPropagation(); toggleAmount(b.id); }}
                    title={(revealedAmounts[b.id] ?? showAllAmounts) ? "Click to hide amount" : "Click to view amount"}
                  >
                    <span>{(revealedAmounts[b.id] ?? showAllAmounts) ? money(b.billingAmount) : "*"}</span>
                    <span className="contract-value-icon">
                      {(revealedAmounts[b.id] ?? showAllAmounts) ? <EyeOff size={12} /> : <Eye size={12} />}
                    </span>
                  </button>
                </td>
                <td><span className={`contract-status ${b.status.toLowerCase().replaceAll(" ", "-")}`}>{b.status}</span></td>
                <td>
                  <div className="row-actions">
                    <button title="View Details" onClick={() => setSelectedBilling(b)}><FileText size={15}/></button>
                    <button title="Print" onClick={() => printBilling(b)}><Printer size={15}/></button>
                  </div>
                </td>
              </tr>
            )) : <tr><td colSpan="9" className="empty">No billing records found.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>

    {/* Billing Detail Panel */}
    {selectedBilling && (
      <section className="vendor-detail-panel">
        <div className="vendor-detail-header">
          <div>
            <span className="vendor-detail-kicker">Billing Record</span>
            <h3>{selectedBilling.id}</h3>
          </div>
          <span className={`contract-status ${selectedBilling.status.toLowerCase().replaceAll(" ", "-")}`}>{selectedBilling.status}</span>
        </div>
        <div className="vendor-detail-grid">
          <div className="vendor-detail-block">
            <h4>Billing Information</h4>
            <div className="vendor-detail-list">
              <div><span>Billing No.</span><b>{selectedBilling.id}</b></div>
              <div><span>Contract No.</span><b>{selectedBilling.contractNo}</b></div>
              <div><span>Client</span><b>{selectedBilling.client}</b></div>
              <div><span>Billing Period</span><b>{selectedBilling.billingPeriod}</b></div>
              <div><span>Billing Date</span><b>{selectedBilling.billingDate}</b></div>
              <div><span>Due Date</span><b>{selectedBilling.dueDate}</b></div>
            </div>
          </div>
          <div className="vendor-detail-block">
            <h4>Service & Billing Details</h4>
            <div className="vendor-detail-list">
              <div><span>Service Description</span><b>{selectedBilling.serviceDescription}</b></div>
              <div><span>Billing Cycle</span><b>{selectedBilling.billingCycle}</b></div>
              <div><span>Contract Amount</span><b><DetailAmount amountKey={`${selectedBilling.id}-contractAmount`} value={selectedBilling.contractAmount} /></b></div>
              <div><span>Billing Amount</span><b><DetailAmount amountKey={`${selectedBilling.id}-billingAmount`} value={selectedBilling.billingAmount} /></b></div>
              <div><span>Tax (12%)</span><b><DetailAmount amountKey={`${selectedBilling.id}-tax`} value={selectedBilling.tax} /></b></div>
              <div><span>Discount</span><b><DetailAmount amountKey={`${selectedBilling.id}-discount`} value={selectedBilling.discount} /></b></div>
            </div>
          </div>
          <div className="vendor-detail-block">
            <h4>Amount Summary</h4>
            <div className="vendor-detail-list">
              <div><span>Total Amount</span><b><DetailAmount amountKey={`${selectedBilling.id}-totalAmount`} value={selectedBilling.totalAmount} /></b></div>
              <div><span>Status</span><b>{selectedBilling.status}</b></div>
              <div><span>Invoice Status</span><b>{selectedBilling.invoiceStatus}</b></div>
              <div><span>Payment Status</span><b>{selectedBilling.paymentStatus}</b></div>
            </div>
          </div>
          <div className="vendor-detail-block">
            <h4>Source Contract</h4>
            <div className="vendor-detail-list">
              {(() => {
                const contract = contracts.find(c => c.id === selectedBilling.contractNo);
                return contract ? (
                  <>
                    <div><span>Contract</span><b>{contract.id}</b></div>
                    <div><span>Client</span><b>{contract.client}</b></div>
                    <div><span>Contract Value</span><b><DetailAmount amountKey={`${selectedBilling.id}-srcValue`} value={contract.value} /></b></div>
                    <div><span>Billing Cycle</span><b>{contract.billingCycle}</b></div>
                    <div><span>Billing Amount</span><b><DetailAmount amountKey={`${selectedBilling.id}-srcBillingAmount`} value={contract.billingAmount} /></b></div>
                    <div><span>Payment Terms</span><b>{contract.paymentTerms}</b></div>
                  </>
                ) : (
                  <div><span>Source</span><b>Contract not found</b></div>
                );
              })()}
            </div>
          </div>
        </div>
      </section>
    )}

    {/* Generate Billing Modal */}
    {showGenerateModal && (
      <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2>Generate Billings</h2>
              <p>Automatically create billing records from active contracts and their billing schedules.</p>
            </div>
            <button onClick={() => setShowGenerateModal(false)}><X size={20}/></button>
          </div>
          <form onSubmit={handleGenerate} style={{ padding: "18px" }}>
            <div className="form-grid">
              <label>
                Billing Period
                <input
                  value={generateForm.billing_period}
                  onChange={e => setGenerateForm(prev => ({ ...prev, billing_period: e.target.value }))}
                  placeholder="e.g. September 2026"
                  required
                />
              </label>
              <label>
                Billing Date
                <input
                  type="date"
                  value={generateForm.billing_date}
                  onChange={e => setGenerateForm(prev => ({ ...prev, billing_date: e.target.value }))}
                  required
                />
              </label>
              <label className="full">
                Contract (Optional — leave blank for all active contracts)
                <select
                  value={generateForm.contract_no}
                  onChange={e => setGenerateForm(prev => ({ ...prev, contract_no: e.target.value }))}
                >
                  <option value="">All Active Contracts ({activeContracts.length})</option>
                  {activeContracts.map(c => (
                    <option key={c.id} value={c.id}>{c.id} — {c.client} ({money(c.billingAmount)}/cycle)</option>
                  ))}
                </select>
              </label>
            </div>

            {generateResult && (
              <div className={`settings-saved ${generateResult.success ? "" : "error"}`} style={{ marginTop: "12px" }}>
                {generateResult.success ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>}
                {generateResult.message}
                {generateResult.skipped?.length > 0 && (
                  <small style={{ display: "block", marginTop: "6px" }}>
                    Skipped: {generateResult.skipped.map(s => `${s.contract_no} (${s.reason})`).join(", ")}
                  </small>
                )}
              </div>
            )}

            <div className="modal-footer">
              <button type="button" className="cancel-button" onClick={() => setShowGenerateModal(false)}>Cancel</button>
              <button type="submit" className="save-button" disabled={generating}>
                {generating ? "Generating..." : "Generate Billings"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
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

function ServiceInvoiceManagementPage({ onNew, onAudit, navigate, records = seedServiceInvoices }) {
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(records[0] || null);
  const [revealedAmounts, setRevealedAmounts] = useState({});
  const [showAllAmounts, setShowAllAmounts] = useState(false);
  const [revealedSummary, setRevealedSummary] = useState({ invoiced: false, collected: false, outstanding: false });
  const [revealedDetail, setRevealedDetail] = useState({});

  // Balance is always derived from the invoice total minus payments already received.
  const balanceOf = (invoice) => Number(invoice?.total || 0) - Number(invoice?.paid || 0);

  const totalInvoiced = records.reduce((sum, r) => sum + Number(r.total || 0), 0);
  const totalCollected = records.reduce((sum, r) => sum + Number(r.paid || 0), 0);
  const totalOutstanding = totalInvoiced - totalCollected;
  const collectionRate = totalInvoiced ? Math.round((totalCollected / totalInvoiced) * 100) : 0;
  const countByStatus = (status) => records.filter(r => r.status === status).length;
  const paidCount = countByStatus("Paid");
  const overdueCount = countByStatus("Overdue");
  const openCount = records.filter(r => r.status !== "Paid" && r.status !== "Cancelled").length;

  const daysUntilDue = (dueDate) => {
    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) return null;
    return Math.ceil((due - new Date()) / 86400000);
  };

  const collectionState = (invoice) => {
    if (balanceOf(invoice) <= 0 && Number(invoice.total || 0) > 0) return "Fully collected";
    if (Number(invoice.paid || 0) > 0) return "Partially collected";
    const days = daysUntilDue(invoice.dueDate);
    if (days !== null && days < 0) return "Awaiting payment (overdue)";
    return "Awaiting payment";
  };

  const toggleAmount = (id) => {
    setRevealedAmounts(prev => ({ ...prev, [id]: !(prev[id] ?? showAllAmounts) }));
  };

  const toggleAllAmounts = () => {
    const nextState = !showAllAmounts;
    setShowAllAmounts(nextState);
    const updated = {};
    records.forEach(r => { updated[r.id] = nextState; });
    setRevealedAmounts(updated);
  };

  const toggleSummaryAmount = (key) => setRevealedSummary(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleDetail = (key) => setRevealedDetail(prev => ({ ...prev, [key]: !prev[key] }));

  const DetailAmount = ({ amountKey, value }) => {
    const revealed = !!revealedDetail[amountKey];
    return (
      <button
        type="button"
        className={`contract-value-button ${revealed ? "revealed" : "masked"}`}
        onClick={() => toggleDetail(amountKey)}
        title={revealed ? "Click to hide amount" : "Click to view amount"}
      >
        <span>{revealed ? money(value) : "*"}</span>
        <span className="contract-value-icon">
          {revealed ? <EyeOff size={11} /> : <Eye size={11} />}
        </span>
      </button>
    );
  };

  // Row-level masked amount: one click reveals Total, Paid and Balance for that invoice.
  const AmountButton = ({ invoice, value, className = "" }) => {
    const revealed = revealedAmounts[invoice.id] ?? showAllAmounts;
    return (
      <button
        type="button"
        className={`contract-value-button ${revealed ? "revealed" : "masked"} ${className}`}
        onClick={(e) => { e.stopPropagation(); toggleAmount(invoice.id); }}
        title={revealed ? "Click to hide this invoice's amounts" : "Click to view this invoice's amounts"}
      >
        <span>{revealed ? money(value) : "*"}</span>
        <span className="contract-value-icon">
          {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
        </span>
      </button>
    );
  };

  // Status badge driven by the shared invoiceStatusColors palette.
  const StatusBadge = ({ status }) => {
    const palette = invoiceStatusStyle(status);
    return (
      <span className="invoice-status-badge" style={{ background: palette.background, color: palette.color }}>
        <span className="invoice-status-dot" style={{ background: palette.color }}></span>
        {status}
      </span>
    );
  };

  const filteredInvoices = records.filter(inv => {
    const matchesStatus = filterStatus === "All Status" || inv.status === filterStatus;
    const phrase = `${inv.id} ${inv.client} ${inv.contract} ${inv.service} ${inv.billingPeriod}`.toLowerCase();
    return matchesStatus && phrase.includes(search.toLowerCase());
  });

  const printInvoice = (invoice) => {
    if (!invoice) return;
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>${invoice.id}</title></head><body style="font-family:Arial,sans-serif;padding:40px;color:#203b4e">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #159bd3;padding-bottom:12px">
        <h2>PRIMEPOWER — Service Invoice</h2>
        <span style="font-size:12px;color:#666">Generated: ${new Date().toLocaleString()}</span>
      </div>
      <div style="margin-top:20px;line-height:1.7">
        <p><b>Invoice No.:</b> ${invoice.id}</p>
        <p><b>Client:</b> ${invoice.client}</p>
        <p><b>Contract:</b> ${invoice.contract}</p>
        <p><b>Service:</b> ${invoice.service}</p>
        <p><b>Billing Period:</b> ${invoice.billingPeriod}</p>
        <p><b>Invoice Date:</b> ${invoice.invoiceDate}</p>
        <p><b>Due Date:</b> ${invoice.dueDate}</p>
        <p><b>Payment Terms:</b> ${invoice.paymentTerms}</p>
        <hr/>
        <p><b>Total:</b> ${money(invoice.total)}</p>
        <p><b>Paid:</b> ${money(invoice.paid)}</p>
        <p><b>Balance:</b> ${money(balanceOf(invoice))}</p>
        <p><b>Status:</b> ${invoice.status}</p>
        <p><b>Payment Reference:</b> ${invoice.paymentReference || "—"}</p>
        <p><b>Prepared By:</b> ${invoice.preparedBy}</p>
      </div>
      <script>window.print()</script>
    </body></html>`);
    w.document.close();
    onAudit?.("Printed service invoice", invoice.id);
  };

  const exportInvoices = () => {
    const headers = ["Invoice No.", "Client", "Contract", "Service", "Billing Period", "Invoice Date", "Due Date", "Total", "Paid", "Balance", "Status"];
    const rowsCsv = filteredInvoices.map(inv => [
      `"${inv.id}"`,
      `"${inv.client}"`,
      `"${inv.contract}"`,
      `"${inv.service}"`,
      `"${inv.billingPeriod}"`,
      `"${inv.invoiceDate}"`,
      `"${inv.dueDate}"`,
      `"${inv.total}"`,
      `"${inv.paid}"`,
      `"${balanceOf(inv)}"`,
      `"${inv.status}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rowsCsv.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PrimePower_ServiceInvoices_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onAudit?.("Exported service invoices", `${filteredInvoices.length} invoice(s)`);
  };

  return <section className="management-page billing-generation-page service-invoice-page">
    <Breadcrumb current="Service Invoice Management" parent="Client Billing Management" />

    <div className="management-header">
      <div>
        <h2>Service Invoice Management</h2>
        <p>Create, track, and manage the service invoices issued to clients after billing generation.</p>
      </div>
      <div className="management-actions">
        <button className="light-button" onClick={exportInvoices} title="Export to CSV"><FileDown size={15}/> Export</button>
        <button className="light-button" onClick={() => printInvoice(selectedInvoice)} title="Print the selected invoice"><Printer size={15}/> Print Invoice</button>
        <button className="primary-button" onClick={onNew}>＋ New Invoice</button>
      </div>
    </div>

    {/* Invoice summary cards */}
    <div className="vendor-summary-grid">
      <div className="vendor-summary-card" onClick={() => toggleSummaryAmount("invoiced")} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") toggleSummaryAmount("invoiced"); }}>
        <span className="vendor-summary-label">Total Invoiced</span>
        <strong className={`vendor-summary-amount ${revealedSummary.invoiced ? "total-payable-amount" : ""}`}>{revealedSummary.invoiced ? money(totalInvoiced) : "*"}</strong>
      </div>
      <div className="vendor-summary-card" onClick={() => toggleSummaryAmount("collected")} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") toggleSummaryAmount("collected"); }}>
        <span className="vendor-summary-label">Total Collected</span>
        <strong className={`vendor-summary-amount ${revealedSummary.collected ? "paid-amount" : ""}`}>{revealedSummary.collected ? money(totalCollected) : "*"}</strong>
      </div>
      <div className="vendor-summary-card" onClick={() => toggleSummaryAmount("outstanding")} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") toggleSummaryAmount("outstanding"); }}>
        <span className="vendor-summary-label">Outstanding Balance</span>
        <strong className={`vendor-summary-amount ${revealedSummary.outstanding ? "overdue-amount" : ""}`}>{revealedSummary.outstanding ? money(totalOutstanding) : "*"}</strong>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Collected / Overdue / Open</span>
        <strong className="vendor-summary-amount">{paidCount} / {overdueCount} / {openCount}</strong>
        <span className="invoice-summary-note">Collection rate: {collectionRate}%</span>
      </div>
    </div>

    {/* Invoice status legend — consistent colors, doubles as a quick status filter */}
    <div className="invoice-status-legend">
      {invoiceStatusOrder.map(status => {
        const palette = invoiceStatusStyle(status);
        const active = filterStatus === status;
        return <button
          key={status}
          type="button"
          className={`invoice-status-chip ${active ? "selected" : ""}`}
          style={{ background: palette.background, color: palette.color, borderColor: active ? palette.color : "transparent" }}
          onClick={() => setFilterStatus(active ? "All Status" : status)}
          title={active ? "Show every status" : `Show only ${status} invoices`}
        >
          <span className="invoice-status-dot" style={{ background: palette.color }}></span>
          {status}
          <b>{countByStatus(status)}</b>
        </button>;
      })}
      {filterStatus !== "All Status" && (
        <button type="button" className="invoice-status-clear" onClick={() => setFilterStatus("All Status")}>Clear filter</button>
      )}
    </div>

    <div className="vendor-toolbar">
      <div className="search-box vendor-search"><span>⌕</span><input placeholder="Search Invoice No. / Client / Contract / Service..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="vendor-toolbar-controls">
        <select className="vendor-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option>All Status</option>
          {invoiceStatusOrder.map(status => <option key={status}>{status}</option>)}
        </select>
      </div>
    </div>

    <section className="vendor-record-panel">
      <div className="vendor-record-heading">
        <h3>Service Invoices ({filteredInvoices.length})</h3>
      </div>
      <div className="table-card vendor-table-card">
        <table>
          <thead>
            <tr>
              <th>Invoice No.</th>
              <th>Client</th>
              <th>Contract</th>
              <th>Service</th>
              <th>Billing Period</th>
              <th>Invoice Date</th>
              <th>Due Date</th>
              <th>
                <div className="th-with-action">
                  <span>Total</span>
                  <button
                    type="button"
                    className="header-visibility-toggle"
                    onClick={toggleAllAmounts}
                    title={showAllAmounts ? "Hide all invoice amounts" : "Show all invoice amounts"}
                    aria-label={showAllAmounts ? "Hide all invoice amounts" : "Show all invoice amounts"}
                  >
                    {showAllAmounts ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length ? filteredInvoices.map(inv => {
              const balance = balanceOf(inv);
              const days = daysUntilDue(inv.dueDate);
              const dueBadge = days < 0 ? "expired" : days <= 30 ? "expiring-soon" : "active";

              return <tr key={inv.id} onClick={() => setSelectedInvoice(inv)} className={selectedInvoice?.id === inv.id ? "selected-row" : ""}>
                <td className="link-cell">{inv.id}</td>
                <td className="strong-cell">{inv.client}</td>
                <td>{inv.contract}</td>
                <td>{inv.service}</td>
                <td>{inv.billingPeriod}</td>
                <td>{inv.invoiceDate}</td>
                <td>
                  <div className="end-date-cell">
                    <span>{inv.dueDate}</span>
                    {days !== null && balance > 0 && inv.status !== "Draft" && inv.status !== "Cancelled" && (
                      <small className={`days-badge ${dueBadge}`}>
                        {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                      </small>
                    )}
                  </div>
                </td>
                <td className="money-cell"><AmountButton invoice={inv} value={inv.total} /></td>
                <td className="money-cell"><AmountButton invoice={inv} value={inv.paid} /></td>
                <td className={`money-cell ${balance > 0 ? "red-text" : "green-text"}`}><AmountButton invoice={inv} value={balance} /></td>
                <td>
                  <StatusBadge status={inv.status} />
                </td>
                <td>
                  <div className="row-actions">
                    <button title="View Invoice" onClick={(e) => { e.stopPropagation(); setSelectedInvoice(inv); }}><FileText size={15}/></button>
                    <button title="Print Invoice" onClick={(e) => { e.stopPropagation(); printInvoice(inv); }}><Printer size={15}/></button>
                    <button title="Record Payment" onClick={(e) => { e.stopPropagation(); navigate?.("Payment Recording"); }}><PhilippinePeso size={15}/></button>
                  </div>
                </td>
              </tr>;
            }) : <tr><td colSpan="12" className="empty">No service invoices found for the selected filter.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>

    {/* Selected invoice detail panel */}
    {selectedInvoice && (
      <section className="vendor-detail-panel">
        <div className="vendor-detail-header">
          <div>
            <span className="vendor-detail-kicker">Service Invoice</span>
            <h3>{selectedInvoice.id}</h3>
          </div>
          <StatusBadge status={selectedInvoice.status} />
        </div>
        <div className="vendor-detail-grid">
          <div className="vendor-detail-block">
            <h4>Invoice Information</h4>
            <div className="vendor-detail-list">
              <div><span>Invoice No.</span><b>{selectedInvoice.id}</b></div>
              <div><span>Client</span><b>{selectedInvoice.client}</b></div>
              <div><span>Contract</span><b>{selectedInvoice.contract}</b></div>
              <div><span>Service</span><b>{selectedInvoice.service}</b></div>
              <div><span>Billing Period</span><b>{selectedInvoice.billingPeriod}</b></div>
              <div><span>Invoice Date</span><b>{selectedInvoice.invoiceDate}</b></div>
              <div><span>Due Date</span><b>{selectedInvoice.dueDate}</b></div>
              <div><span>Payment Terms</span><b>{selectedInvoice.paymentTerms}</b></div>
            </div>
          </div>
          <div className="vendor-detail-block">
            <h4>Amount Summary</h4>
            <div className="vendor-detail-list">
              <div><span>Total</span><b><DetailAmount amountKey={`${selectedInvoice.id}-total`} value={selectedInvoice.total} /></b></div>
              <div><span>Paid</span><b><DetailAmount amountKey={`${selectedInvoice.id}-paid`} value={selectedInvoice.paid} /></b></div>
              <div><span>Balance</span><b><DetailAmount amountKey={`${selectedInvoice.id}-balance`} value={balanceOf(selectedInvoice)} /></b></div>
              <div><span>Payment Progress</span><b>{Number(selectedInvoice.total) ? Math.round((Number(selectedInvoice.paid || 0) / Number(selectedInvoice.total)) * 100) : 0}%</b></div>
              <div><span>Status</span><b>{selectedInvoice.status}</b></div>
            </div>
          </div>
          <div className="vendor-detail-block">
            <h4>Payment & Collection</h4>
            <div className="vendor-detail-list">
              <div><span>Amount Received</span><b><DetailAmount amountKey={`${selectedInvoice.id}-received`} value={selectedInvoice.paid} /></b></div>
              <div><span>Remaining Balance</span><b><DetailAmount amountKey={`${selectedInvoice.id}-remaining`} value={balanceOf(selectedInvoice)} /></b></div>
              <div><span>Payment Reference</span><b>{selectedInvoice.paymentReference || "—"}</b></div>
              <div><span>Collection Status</span><b>{collectionState(selectedInvoice)}</b></div>
              <div><span>Due Status</span><b>{(() => {
                const days = daysUntilDue(selectedInvoice.dueDate);
                if (days === null) return "—";
                if (days < 0) return `${Math.abs(days)} day(s) overdue`;
                return `${days} day(s) remaining`;
              })()}</b></div>
              <div><span>Aging Category</span><b>{(() => {
                const days = daysUntilDue(selectedInvoice.dueDate);
                if (balanceOf(selectedInvoice) <= 0) return "Settled";
                if (days === null) return "Current";
                if (days >= 0) return "Current";
                const overdue = Math.abs(days);
                if (overdue <= 30) return "1–30 Days";
                if (overdue <= 60) return "31–60 Days";
                return "61+ Days";
              })()}</b></div>
            </div>
          </div>
          <div className="vendor-detail-block">
            <h4>Related Records</h4>
            <div className="vendor-detail-list">
              <div><span>Client Contract</span><b>{selectedInvoice.contract}</b></div>
              <div><span>Billing Period</span><b>{selectedInvoice.billingPeriod}</b></div>
              <div><span>Prepared By</span><b>{selectedInvoice.preparedBy}</b></div>
              <div><span>Invoice Status</span><b>{selectedInvoice.status}</b></div>
            </div>
            <div className="invoice-detail-actions">
              <button type="button" className="light-button" onClick={() => printInvoice(selectedInvoice)}><Printer size={15}/> Print Invoice</button>
              <button type="button" className="light-button" onClick={() => navigate?.("Client Contract Management")}><FileText size={15}/> View Contract</button>
              <button type="button" className="light-button" onClick={() => navigate?.("Payment Recording")}><PhilippinePeso size={15}/> Record Payment</button>
            </div>
          </div>
        </div>
      </section>
    )}
  </section>;
}

function BillingScheduleMonitoringPage({ onAudit, navigate, records = seedBillingSchedules }) {
  const [schedules, setSchedules] = useState(records);
  const [loading, setLoading] = useState(true);

  // Load live data from GET /api/billing-schedules (falls back to seed data offline).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await fetchBillingSchedulesFromApi();
      if (cancelled) return;
      if (result.ok && result.data.length > 0) {
        setSchedules(result.data);
        const maxSeq = result.data.reduce((max, r) => {
          const m = String(r.invoiceNo || "").match(/INV-2026-(\d+)/);
          return m ? Math.max(max, Number(m[1])) : max;
        }, 7);
        setNextInvoiceSeq(maxSeq + 1);
      } else if (!result.ok) {
        // The precise cause (HTTP status / timeout / network) is already logged
        // by fetchBillingSchedulesFromApi. Keep the UI quiet and fall back to
        // the built-in sample data instead of surfacing an error banner.
        console.warn("Billing schedules load failed:", result.reason);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [filterPeriod, setFilterPeriod] = useState("All Periods");
  const [search, setSearch] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [revealedAmounts, setRevealedAmounts] = useState({});
  const [showAllAmounts, setShowAllAmounts] = useState(false);
  const [revealedSummary, setRevealedSummary] = useState({ total: false });
  const [revealedDetail, setRevealedDetail] = useState({});
  const [nextInvoiceSeq, setNextInvoiceSeq] = useState(8); // INV-2026-0001..0007 already exist
  const [notice, setNotice] = useState(null);

  const today = new Date();
  const todayText = today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const hasInvoice = (record) => !!record.invoiceNo && record.invoiceNo !== "—";
  const amountOf = (record) => Number(record?.amount || 0);

  const totalScheduledAmount = schedules.reduce((sum, r) => sum + amountOf(r), 0);
  const countByStatus = (status) => schedules.filter(r => r.status === status).length;
  const completedCount = countByStatus("Completed");
  const upcomingCount = countByStatus("Upcoming");
  const overdueCount = countByStatus("Overdue");
  const missedCount = countByStatus("Missed");
  const skippedCount = countByStatus("Skipped");
  const rescheduledCount = countByStatus("Rescheduled");

  // Distinct billing periods ordered by their earliest scheduled date.
  const periodOptions = (() => {
    const firstDate = new Map();
    schedules.forEach(r => {
      const time = new Date(r.scheduledDate).getTime();
      if (!firstDate.has(r.billingPeriod) || time < firstDate.get(r.billingPeriod)) {
        firstDate.set(r.billingPeriod, time);
      }
    });
    return [...firstDate.entries()].sort((a, b) => a[1] - b[1]).map(([period]) => period);
  })();

  const daysUntilScheduled = (scheduledDate) => {
    const date = new Date(scheduledDate);
    if (Number.isNaN(date.getTime())) return null;
    return Math.ceil((date - today) / 86400000);
  };

  const documentState = (record) => {
    if (hasInvoice(record)) return "Invoice generated";
    if (record.status === "Skipped") return "Billing skipped";
    const days = daysUntilScheduled(record.scheduledDate);
    if (days !== null && days > 0) return `Billing in ${days} day(s)`;
    return "Invoice not yet generated";
  };

  const formatShortDate = (date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  // New invoices continue the existing INV-2026-0001..0007 series.
  const buildInvoiceNumber = (sequence) => `INV-2026-${String(sequence).padStart(4, "0")}`;

  const toggleAmount = (id) => {
    setRevealedAmounts(prev => ({ ...prev, [id]: !(prev[id] ?? showAllAmounts) }));
  };

  const toggleAllAmounts = () => {
    const nextState = !showAllAmounts;
    setShowAllAmounts(nextState);
    const updated = {};
    schedules.forEach(r => { updated[r.id] = nextState; });
    setRevealedAmounts(updated);
  };

  const toggleSummaryAmount = () => setRevealedSummary(prev => ({ total: !prev.total }));
  const toggleDetail = (key) => setRevealedDetail(prev => ({ ...prev, [key]: !prev[key] }));

  const DetailAmount = ({ amountKey, value }) => {
    const revealed = !!revealedDetail[amountKey];
    return (
      <button
        type="button"
        className={`contract-value-button ${revealed ? "revealed" : "masked"}`}
        onClick={() => toggleDetail(amountKey)}
        title={revealed ? "Click to hide amount" : "Click to view amount"}
      >
        <span>{revealed ? money(value) : "*"}</span>
        <span className="contract-value-icon">
          {revealed ? <EyeOff size={11} /> : <Eye size={11} />}
        </span>
      </button>
    );
  };

  const applyInvoice = (record, invoiceNo, dueDateText) => {
    setSchedules(prev => prev.map(item => item.id === record.id
      ? {
        ...item,
        invoiceNo,
        invoiceDate: todayText,
        dueDate: dueDateText,
        status: "Completed",
        remarks: `Invoice ${invoiceNo} generated on ${todayText}`,
      }
      : item));
  };

  const thirtyDaysLater = () => {
    const due = new Date(today);
    due.setDate(due.getDate() + 30);
    return formatShortDate(due);
  };

  const generateInvoice = async (record) => {
    const invoiceNo = buildInvoiceNumber(nextInvoiceSeq);
    setNextInvoiceSeq(nextInvoiceSeq + 1);
    applyInvoice(record, invoiceNo, thirtyDaysLater());
    onAudit?.("Generated invoice from billing schedule", `${record.id} / ${invoiceNo}`);
    setNotice({ ok: true, message: `${invoiceNo} generated for ${record.id} — ${record.client} (${record.service}).` });

    // Persist to backend (PUT /api/billing-schedules/:id) so the DB stays in sync.
    const saved = await updateBillingScheduleViaApi(record.id, {
      invoice_no: invoiceNo,
      status: "Completed",
      remarks: `Invoice ${invoiceNo} generated on ${todayText}`,
    });
    if (saved) {
      setSchedules(prev => prev.map(item => item.id === record.id ? saved : item));
    }
  };

  // Schedules whose billing date has arrived and still have no invoice.
  const dueSchedules = schedules.filter(r => !hasInvoice(r) && r.status !== "Skipped" && (daysUntilScheduled(r.scheduledDate) ?? 1) <= 0);

  const generateDueInvoices = async () => {
    if (!dueSchedules.length) {
      setNotice({ ok: false, message: "No billing schedules are due for invoice generation today." });
      return;
    }

    const dueDateText = thirtyDaysLater();
    const created = [];
    dueSchedules.forEach((record, index) => {
      const invoiceNo = buildInvoiceNumber(nextInvoiceSeq + index);
      applyInvoice(record, invoiceNo, dueDateText);
      created.push(`${record.id} → ${invoiceNo}`);
    });
    setNextInvoiceSeq(nextInvoiceSeq + dueSchedules.length);
    onAudit?.("Generated due schedule invoices", `${created.length} invoice(s)`);
    setNotice({ ok: true, message: `${created.length} invoice(s) generated from due schedules.`, detail: created.join(" · ") });

    // Persist each generated invoice to the backend.
    for (let index = 0; index < dueSchedules.length; index += 1) {
      const record = dueSchedules[index];
      const invoiceNo = buildInvoiceNumber(nextInvoiceSeq + index);
      const saved = await updateBillingScheduleViaApi(record.id, {
        invoice_no: invoiceNo,
        status: "Completed",
        remarks: `Invoice ${invoiceNo} generated on ${todayText}`,
      });
      if (saved) {
        setSchedules(prev => prev.map(item => item.id === record.id ? saved : item));
      }
    }
  };

  const filteredSchedules = schedules.filter(record => {
    const matchesStatus = filterStatus === "All Status" || record.status === filterStatus;
    const matchesPeriod = filterPeriod === "All Periods" || record.billingPeriod === filterPeriod;
    const phrase = `${record.id} ${record.client} ${record.contract} ${record.service} ${record.billingPeriod} ${record.invoiceNo}`.toLowerCase();
    return matchesStatus && matchesPeriod && phrase.includes(search.toLowerCase());
  });

  const printSchedule = (record) => {
    if (!record) return;
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>${record.id}</title></head><body style="font-family:Arial,sans-serif;padding:40px;color:#203b4e">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #159bd3;padding-bottom:12px">
        <h2>PRIMEPOWER — Billing Schedule</h2>
        <span style="font-size:12px;color:#666">Generated: ${new Date().toLocaleString()}</span>
      </div>
      <div style="margin-top:20px;line-height:1.7">
        <p><b>Schedule ID:</b> ${record.id}</p>
        <p><b>Client:</b> ${record.client}</p>
        <p><b>Contract Number:</b> ${record.contract}</p>
        <p><b>Service Type:</b> ${record.service}</p>
        <p><b>Billing Frequency:</b> ${record.frequency} (${record.billingDay})</p>
        <p><b>Billing Period:</b> ${record.billingPeriod}</p>
        <p><b>Scheduled Date:</b> ${record.scheduledDate}</p>
        <p><b>Invoice Number:</b> ${hasInvoice(record) ? record.invoiceNo : "Not yet generated"}</p>
        <p><b>Invoice Date:</b> ${record.invoiceDate}</p>
        <p><b>Amount:</b> ${money(amountOf(record))}</p>
        <p><b>Payment Terms:</b> ${record.paymentTerms}</p>
        <p><b>Due Date:</b> ${record.dueDate}</p>
        <p><b>Last Billing Date:</b> ${record.lastBillingDate}</p>
        <p><b>Next Billing Date:</b> ${record.nextBillingDate}</p>
        <p><b>Status:</b> ${record.status}</p>
        <p><b>Remarks:</b> ${record.remarks}</p>
        <p><b>Created By:</b> ${record.createdBy}</p>
      </div>
      <script>window.print()</script>
    </body></html>`);
    w.document.close();
    onAudit?.("Printed billing schedule", record.id);
  };

  const exportSchedules = () => {
    const headers = ["Schedule ID", "Client", "Contract No.", "Service", "Frequency", "Billing Day", "Billing Period", "Scheduled Date", "Amount", "Invoice No.", "Invoice Date", "Payment Terms", "Due Date", "Last Billing Date", "Next Billing Date", "Status", "Remarks", "Created By"];
    const rowsCsv = filteredSchedules.map(r => [
      `"${r.id}"`,
      `"${r.client}"`,
      `"${r.contract}"`,
      `"${r.service}"`,
      `"${r.frequency}"`,
      `"${r.billingDay}"`,
      `"${r.billingPeriod}"`,
      `"${r.scheduledDate}"`,
      `"${amountOf(r)}"`,
      `"${r.invoiceNo}"`,
      `"${r.invoiceDate}"`,
      `"${r.paymentTerms}"`,
      `"${r.dueDate}"`,
      `"${r.lastBillingDate}"`,
      `"${r.nextBillingDate}"`,
      `"${r.status}"`,
      `"${r.remarks}"`,
      `"${r.createdBy}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rowsCsv.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PrimePower_BillingSchedules_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onAudit?.("Exported billing schedules", `${filteredSchedules.length} schedule(s)`);
  };

  return <section className="management-page billing-generation-page schedule-monitoring-page">
    <Breadcrumb current="Billing Schedule Monitoring" parent="Client Billing Management" />

    <div className="management-header">
      <div>
        <h2>Billing Schedule Monitoring</h2>
        <p>Monitor upcoming, completed, and overdue client billing schedules and generate their invoices.</p>
      </div>
      <div className="management-actions">
        <button className="light-button" onClick={exportSchedules} title="Export to CSV"><FileDown size={15}/> Export</button>
        <button className="light-button" onClick={() => printSchedule(selectedSchedule)} title="Print the selected schedule"><Printer size={15}/> Print Schedule</button>
        <button className="primary-button" onClick={generateDueInvoices} title="Generate invoices for every schedule whose billing date has arrived"><RotateCcw size={15}/> Generate Due Invoices</button>
      </div>
    </div>

    {notice && (
      <div className={`settings-saved ${notice.ok ? "" : "error"}`}>
        {notice.ok ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>}
        <span>
          {notice.message}
          {notice.detail && <small>{notice.detail}</small>}
        </span>
      </div>
    )}

    {loading && (
      <div className="contract-alert contract-alert--info">
        <Clock3 size={17}/>
        <span>Loading billing schedules…</span>
      </div>
    )}

    {/* Schedule summary cards */}
    <div className="schedule-summary-grid">
      <div className={`vendor-summary-card ${filterStatus === "All Status" ? "selected" : ""}`} onClick={() => setFilterStatus("All Status")} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") setFilterStatus("All Status"); }}>
        <span className="vendor-summary-label">Total Billing Schedules</span>
        <strong className="vendor-summary-amount total-payable-amount">{schedules.length}</strong>
      </div>
      <div className={`vendor-summary-card ${filterStatus === "Completed" ? "selected" : ""}`} onClick={() => setFilterStatus("Completed")} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") setFilterStatus("Completed"); }}>
        <span className="vendor-summary-label">Completed</span>
        <strong className="vendor-summary-amount paid-amount">{completedCount}</strong>
      </div>
      <div className={`vendor-summary-card ${filterStatus === "Upcoming" ? "selected" : ""}`} onClick={() => setFilterStatus("Upcoming")} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") setFilterStatus("Upcoming"); }}>
        <span className="vendor-summary-label">Upcoming</span>
        <strong className="vendor-summary-amount">{upcomingCount}</strong>
      </div>
      <div className={`vendor-summary-card ${filterStatus === "Overdue" ? "selected" : ""}`} onClick={() => setFilterStatus("Overdue")} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") setFilterStatus("Overdue"); }}>
        <span className="vendor-summary-label">Overdue</span>
        <strong className="vendor-summary-amount overdue-amount">{overdueCount}</strong>
      </div>
      <div className={`vendor-summary-card ${filterStatus === "Missed" ? "selected" : ""}`} onClick={() => setFilterStatus("Missed")} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") setFilterStatus("Missed"); }}>
        <span className="vendor-summary-label">Missed</span>
        <strong className="vendor-summary-amount pending-amount">{missedCount}</strong>
      </div>
      <div className={`vendor-summary-card ${filterStatus === "Rescheduled" ? "selected" : ""}`} onClick={() => setFilterStatus("Rescheduled")} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") setFilterStatus("Rescheduled"); }}>
        <span className="vendor-summary-label">Rescheduled</span>
        <strong className="vendor-summary-amount">{rescheduledCount}</strong>
      </div>
      <div className={`vendor-summary-card ${filterStatus === "Skipped" ? "selected" : ""}`} onClick={() => setFilterStatus("Skipped")} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") setFilterStatus("Skipped"); }}>
        <span className="vendor-summary-label">Skipped</span>
        <strong className="vendor-summary-amount">{skippedCount}</strong>
      </div>
      <div className="vendor-summary-card" onClick={toggleSummaryAmount} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") toggleSummaryAmount(); }}>
        <span className="vendor-summary-label">Total Scheduled Amount</span>
        <strong className={`vendor-summary-amount ${revealedSummary.total ? "total-payable-amount" : ""}`}>{revealedSummary.total ? money(totalScheduledAmount) : "*"}</strong>
      </div>
    </div>

    {/* Status legend — consistent colors, doubles as a quick status filter */}
    <div className="status-legend">
      {billingScheduleStatusOrder.map(status => {
        const palette = billingScheduleStyle(status);
        const active = filterStatus === status;
        return <button
          key={status}
          type="button"
          className={`status-chip ${active ? "selected" : ""}`}
          style={{ background: palette.background, color: palette.color, borderColor: active ? palette.color : "transparent" }}
          onClick={() => setFilterStatus(active ? "All Status" : status)}
          title={active ? "Show every status" : `Show only ${status} schedules`}
        >
          <span className="status-pill-dot" style={{ background: palette.color }}></span>
          {status}
          <b>{countByStatus(status)}</b>
        </button>;
      })}
      {(filterStatus !== "All Status" || filterPeriod !== "All Periods") && (
        <button
          type="button"
          className="status-clear"
          onClick={() => { setFilterStatus("All Status"); setFilterPeriod("All Periods"); }}
        >
          Clear filters
        </button>
      )}
    </div>

    <div className="vendor-toolbar">
      <div className="search-box vendor-search"><span>⌕</span><input placeholder="Search Schedule ID / Client / Contract / Service / Invoice No..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="vendor-toolbar-controls">
        <select className="vendor-select" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}>
          <option>All Periods</option>
          {periodOptions.map(period => <option key={period}>{period}</option>)}
        </select>
        <select className="vendor-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option>All Status</option>
          {billingScheduleStatusOrder.map(status => <option key={status}>{status}</option>)}
        </select>
      </div>
    </div>

    <section className="vendor-record-panel">
      <div className="vendor-record-heading">
        <h3>Billing Schedules ({filteredSchedules.length})</h3>
      </div>
      <div className="table-card vendor-table-card">
        <table>
          <thead>
            <tr>
              <th>Schedule ID</th>
              <th>Client</th>
              <th>Contract No.</th>
              <th>Service</th>
              <th>Frequency</th>
              <th>Billing Period</th>
              <th>Scheduled Date</th>
              <th>
                <div className="th-with-action">
                  <span>Amount</span>
                  <button
                    type="button"
                    className="header-visibility-toggle"
                    onClick={toggleAllAmounts}
                    title={showAllAmounts ? "Hide all scheduled amounts" : "Show all scheduled amounts"}
                    aria-label={showAllAmounts ? "Hide all scheduled amounts" : "Show all scheduled amounts"}
                  >
                    {showAllAmounts ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </th>
              <th>Invoice No.</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchedules.length ? filteredSchedules.map(record => {
              const isRevealed = revealedAmounts[record.id] ?? showAllAmounts;
              const palette = billingScheduleStyle(record.status);
              const invoiced = hasInvoice(record);

              return <tr key={record.id} onClick={() => setSelectedSchedule(record)} className={selectedSchedule?.id === record.id ? "selected-row" : ""}>
                <td className="link-cell">{record.id}</td>
                <td className="strong-cell">{record.client}</td>
                <td>{record.contract}</td>
                <td>{record.service}</td>
                <td>{record.frequency}</td>
                <td>{record.billingPeriod}</td>
                <td>{record.scheduledDate}</td>
                <td className="money-cell">
                  <button
                    type="button"
                    className={`contract-value-button ${isRevealed ? "revealed" : "masked"}`}
                    onClick={(e) => { e.stopPropagation(); toggleAmount(record.id); }}
                    title={isRevealed ? "Click to hide scheduled amount" : "Click to view scheduled amount"}
                  >
                    <span>{isRevealed ? money(amountOf(record)) : "*"}</span>
                    <span className="contract-value-icon">
                      {isRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                    </span>
                  </button>
                </td>
                <td>
                  <div className="schedule-invoice-cell">
                    {invoiced
                      ? <span className="schedule-invoice-no">{record.invoiceNo}</span>
                      : <span className="schedule-invoice-none">Not yet generated</span>}
                    {invoiced && record.invoiceDate !== "—" && <small>{record.invoiceDate}</small>}
                  </div>
                </td>
                <td>
                  <span className="status-pill" style={{ background: palette.background, color: palette.color }}>
                    <span className="status-pill-dot" style={{ background: palette.color }}></span>
                    {record.status}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button title="View Schedule Details" onClick={(e) => { e.stopPropagation(); setSelectedSchedule(record); }}><FileText size={15}/></button>
                    <button title="Print Schedule" onClick={(e) => { e.stopPropagation(); printSchedule(record); }}><Printer size={15}/></button>
                    {!invoiced && (
                      <button title="Generate Invoice" onClick={(e) => { e.stopPropagation(); generateInvoice(record); }}><RotateCcw size={15}/></button>
                    )}
                    {invoiced && (
                      <button title="Open Service Invoices" onClick={(e) => { e.stopPropagation(); navigate?.("Service Invoice Management"); }}><ExternalLink size={15}/></button>
                    )}
                  </div>
                </td>
              </tr>;
            }) : <tr><td colSpan="11" className="empty">No billing schedules matching the selected filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>

    {/* Schedule details modal */}
    {selectedSchedule && (
      <div className="modal-overlay" onClick={() => setSelectedSchedule(null)}>
        <div className="modal schedule-detail-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <div className="modal-header-top">
                <h2>{selectedSchedule.id}</h2>
                <span className="status-pill" style={{ background: billingScheduleStyle(selectedSchedule.status).background, color: billingScheduleStyle(selectedSchedule.status).color }}>
                  <span className="status-pill-dot" style={{ background: billingScheduleStyle(selectedSchedule.status).color }}></span>
                  {selectedSchedule.status}
                </span>
              </div>
              <p>{selectedSchedule.client} · {selectedSchedule.contract} · {selectedSchedule.service}</p>
            </div>
            <button onClick={() => setSelectedSchedule(null)}><X size={20}/></button>
          </div>

          <div className="schedule-detail-body">
            <div className="vendor-detail-grid">
              <div className="vendor-detail-block">
                <h4>Schedule Information</h4>
                <div className="vendor-detail-list">
                  <div><span>Schedule ID</span><b>{selectedSchedule.id}</b></div>
                  <div><span>Client</span><b>{selectedSchedule.client}</b></div>
                  <div><span>Contract Number</span><b>{selectedSchedule.contract}</b></div>
                  <div><span>Service Type</span><b>{selectedSchedule.service}</b></div>
                  <div><span>Billing Frequency</span><b>{selectedSchedule.frequency}</b></div>
                  <div><span>Billing Day</span><b>{selectedSchedule.billingDay}</b></div>
                  <div><span>Billing Period</span><b>{selectedSchedule.billingPeriod}</b></div>
                  <div><span>Scheduled Date</span><b>{selectedSchedule.scheduledDate}</b></div>
                </div>
              </div>
              <div className="vendor-detail-block">
                <h4>Invoice &amp; Amount</h4>
                <div className="vendor-detail-list">
                  <div><span>Invoice Number</span><b>{hasInvoice(selectedSchedule) ? selectedSchedule.invoiceNo : "Not yet generated"}</b></div>
                  <div><span>Invoice Date</span><b>{selectedSchedule.invoiceDate}</b></div>
                  <div><span>Amount</span><b><DetailAmount amountKey={`${selectedSchedule.id}-amount`} value={amountOf(selectedSchedule)} /></b></div>
                  <div><span>Payment Terms</span><b>{selectedSchedule.paymentTerms}</b></div>
                  <div><span>Due Date</span><b>{selectedSchedule.dueDate}</b></div>
                  <div><span>Document Status</span><b>{documentState(selectedSchedule)}</b></div>
                </div>
              </div>
              <div className="vendor-detail-block">
                <h4>Billing Cycle</h4>
                <div className="vendor-detail-list">
                  <div><span>Frequency / Day</span><b>{selectedSchedule.frequency} · {selectedSchedule.billingDay}</b></div>
                  <div><span>Last Billing Date</span><b>{selectedSchedule.lastBillingDate}</b></div>
                  <div><span>Next Billing Date</span><b>{selectedSchedule.nextBillingDate}</b></div>
                  <div><span>Days To Scheduled Date</span><b>{(() => {
                    const days = daysUntilScheduled(selectedSchedule.scheduledDate);
                    if (days === null) return "—";
                    if (days === 0) return "Billing date is today";
                    if (days > 0) return `${days} day(s) from today`;
                    return `${Math.abs(days)} day(s) past the billing date`;
                  })()}</b></div>
                </div>
              </div>
              <div className="vendor-detail-block">
                <h4>Status &amp; Audit</h4>
                <div className="vendor-detail-list">
                  <div><span>Status</span><b>{selectedSchedule.status}</b></div>
                  <div><span>Remarks</span><b>{selectedSchedule.remarks}</b></div>
                  <div><span>Created By</span><b>{selectedSchedule.createdBy}</b></div>
                  <div><span>Client</span><b>{selectedSchedule.client}</b></div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="light-button" type="button" onClick={() => setSelectedSchedule(null)}>Close</button>
            <button className="light-button" type="button" onClick={() => printSchedule(selectedSchedule)}><Printer size={15}/> Print Schedule</button>
            {!hasInvoice(selectedSchedule) && (
              <button className="primary-button" type="button" onClick={() => generateInvoice(selectedSchedule)}><RotateCcw size={15}/> Generate Invoice</button>
            )}
            {hasInvoice(selectedSchedule) && (
              <button className="primary-button" type="button" onClick={() => navigate?.("Service Invoice Management")}><ExternalLink size={15}/> Open Service Invoices</button>
            )}
          </div>
        </div>
      </div>
    )}
  </section>;
}

function ClientAccountMonitoringPage({ onAudit, navigate, records = seedClientAccounts }) {
  const [accounts, setAccounts] = useState(records);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(records[0] || null);
  const [showAllAmounts, setShowAllAmounts] = useState(false);
  const [revealed, setRevealed] = useState({});
  const [revealedDetailAmounts, setRevealedDetailAmounts] = useState({});
  const [summaryRevealed, setSummaryRevealed] = useState({ receivables: false, overdue: false });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [data, summaryData] = await Promise.all([fetchClientAccountsFromApi(), fetchClientAccountSummaryFromApi()]);
      if (cancelled) return;
      if (Array.isArray(data) && data.length > 0) { setAccounts(data); setSelected(data[0]); }
      else console.warn("Client accounts: backend returned no data — showing built-in sample data.");
      if (summaryData) setSummary(summaryData);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);
  const balanceOf = (a) => clientAccountBalance(a);
  const totalAccounts = summary?.total_accounts ?? accounts.length;
  const activeAccounts = summary?.active_accounts ?? accounts.filter(a => a.contractStatus === "Active").length;
  const withBalance = summary?.accounts_with_balance ?? accounts.filter(a => balanceOf(a) > 0).length;
  const overdueAccounts = summary?.overdue_accounts ?? accounts.filter(a => Number(a.overdueAmount || 0) > 0).length;
  const totalReceivables = summary?.total_receivables ?? accounts.reduce((s, a) => s + balanceOf(a), 0);
  const totalOverdue = summary?.total_overdue ?? accounts.reduce((s, a) => s + Number(a.overdueAmount || 0), 0);
  const billedAll = accounts.reduce((s, a) => s + Number(a.totalBilled || 0), 0);
  const paidAll = accounts.reduce((s, a) => s + Number(a.totalPaid || 0), 0);
  const collectionRate = summary?.collection_rate ?? (billedAll ? Math.round((paidAll / billedAll) * 10000) / 100 : 0);
  const filtered = accounts.filter(a => {
    const okStatus = filterStatus === "All Status" || a.accountStatus === filterStatus;
    const phrase = `${a.accountId} ${a.clientId} ${a.client} ${a.contract}`.toLowerCase();
    return okStatus && phrase.includes(search.toLowerCase());
  });
  const shown = (id) => revealed[id] ?? showAllAmounts;
  const toggleAmount = (id) => setRevealed(prev => ({ ...prev, [id]: !(prev[id] ?? showAllAmounts) }));
  const toggleDetailAmount = (key) => setRevealedDetailAmounts(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleAllAmounts = () => { const n = !showAllAmounts; setShowAllAmounts(n); const u = {}; accounts.forEach(a => { u[a.id] = n; }); setRevealed(u); };
  const exportCsv = () => {
    const headers = ["Account ID", "Client ID", "Client", "Contract", "Billed", "Paid", "Balance", "Overdue", "Account Status"];
    const lines = filtered.map(a => [a.accountId, a.clientId, a.client, a.contract, a.totalBilled, a.totalPaid, balanceOf(a), a.overdueAmount, a.accountStatus].map(v => `"${v}"`).join(","));
    const uri = encodeURI("data:text/csv;charset=utf-8," + [headers.join(","), ...lines].join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", uri);
    link.setAttribute("download", `PrimePower_ClientAccounts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    onAudit?.("Exported client accounts", `${filtered.length} account(s)`);
  };
  const printAccount = (a) => {
    if (!a) return;
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>${a.accountId}</title></head><body style="font-family:Arial;padding:40px"><h1>PRIMEPOWER Finance Management</h1><h2>Client Account ${a.accountId} — ${a.client}</h2><p>Generated: ${new Date().toLocaleString()}</p><hr/><p>Contract: ${a.contract} (${a.contractStatus})</p><p>Total Billed: ${money(a.totalBilled)}</p><p>Total Paid: ${money(a.totalPaid)}</p><p>Outstanding Balance: ${money(balanceOf(a))}</p><p>Overdue: ${money(a.overdueAmount)}</p><p>Collection Rate: ${clientAccountCollectionRate(a)}%</p><p>Remarks: ${a.remarks || "—"}</p><script>window.print()</script></body></html>`);
    w.document.close();
    onAudit?.("Printed client account", a.accountId);
  };
  const accountStyle = (status) => clientAccountStatus[status] || clientAccountStatus["With Balance"];
  const statusOptions = ["Fully Paid", "Current", "With Balance", "Overdue", "Delinquent"];
  return <section className="management-page vendor-payment-page">
    <Breadcrumb current="Client Account Monitoring" parent="Client Billing Management" />
    <div className="management-header">
      <div><h2>CLIENT ACCOUNT MONITORING</h2><p>Overall financial account view per client — balances and collection rates are calculated automatically from current billing and payment data.</p></div>
      <div className="management-actions">
        <button className="light-button" onClick={exportCsv} title="Export to CSV"><FileDown size={15}/> Export</button>
        <button className="light-button" onClick={() => selected && printAccount(selected)} title="Print the selected account"><Printer size={15}/> Print</button>
      </div>
    </div>

    {loading && <div className="contract-alert contract-alert--info"><Clock3 size={17}/><span>Loading client accounts…</span></div>}
    <div className="vendor-summary-grid">
      <div className={`vendor-summary-card ${filterStatus === "All Status" ? "selected" : ""}`} onClick={() => setFilterStatus("All Status")} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") setFilterStatus("All Status"); }}>
        <span className="vendor-summary-label">Total Client Accounts</span>
        <strong className="vendor-summary-amount total-payable-amount">{totalAccounts}</strong>
      </div>
      <div className="vendor-summary-card"><span className="vendor-summary-label">Active Accounts</span><strong className="vendor-summary-amount paid-amount">{activeAccounts}</strong></div>
      <div className={`vendor-summary-card ${filterStatus === "With Balance" ? "selected" : ""}`} onClick={() => setFilterStatus(filterStatus === "With Balance" ? "All Status" : "With Balance")} role="button" tabIndex={0}>
        <span className="vendor-summary-label">Accounts With Balance</span>
        <strong className="vendor-summary-amount pending-amount">{withBalance}</strong>
      </div>
      <div className={`vendor-summary-card ${filterStatus === "Overdue" ? "selected" : ""}`} onClick={() => setFilterStatus(filterStatus === "Overdue" ? "All Status" : "Overdue")} role="button" tabIndex={0}>
        <span className="vendor-summary-label">Overdue Accounts</span>
        <strong className="vendor-summary-amount overdue-amount">{overdueAccounts}</strong>
      </div>
      <div className="vendor-summary-card" onClick={() => setSummaryRevealed(p => ({ ...p, receivables: !p.receivables }))} role="button" tabIndex={0} title="Click to show / hide">
        <span className="vendor-summary-label">Total Receivables</span>
        <strong className={`vendor-summary-amount ${summaryRevealed.receivables ? "total-payable-amount" : ""}`}>{summaryRevealed.receivables ? money(totalReceivables) : "*"}</strong>
      </div>
      <div className="vendor-summary-card" onClick={() => setSummaryRevealed(p => ({ ...p, overdue: !p.overdue }))} role="button" tabIndex={0} title="Click to show / hide">
        <span className="vendor-summary-label">Total Overdue</span>
        <strong className={`vendor-summary-amount ${summaryRevealed.overdue ? "overdue-amount" : ""}`}>{summaryRevealed.overdue ? money(totalOverdue) : "*"}</strong>
      </div>
      <div className="vendor-summary-card"><span className="vendor-summary-label">Collection Rate</span><strong className="vendor-summary-amount paid-amount">{collectionRate}%</strong></div>
    </div>
    <div className="status-legend">
      {statusOptions.map(status => {
        const palette = accountStyle(status);
        const active = filterStatus === status;
        const count = accounts.filter(a => a.accountStatus === status).length;
        return <button key={status} type="button" className={`status-chip ${active ? "selected" : ""}`}
          style={{ background: palette.background, color: palette.color, borderColor: active ? palette.color : "transparent" }}
          onClick={() => setFilterStatus(active ? "All Status" : status)} title={active ? "Show every status" : `Show only ${status} accounts`}>
          <span className="status-pill-dot" style={{ background: palette.color }}></span>{status}<b>{count}</b>
        </button>;
      })}
      {filterStatus !== "All Status" && <button type="button" className="status-clear" onClick={() => setFilterStatus("All Status")}>Clear filter</button>}
    </div>
    <div className="vendor-toolbar">
      <div className="search-box vendor-search"><span>⌕</span><input placeholder="Search Account / Client ID / Client / Contract..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="vendor-toolbar-controls">
        <select className="vendor-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option>All Status</option>
          {statusOptions.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
    </div>
    <section className="vendor-record-panel">
      <div className="vendor-record-heading"><h3>Client Accounts ({filtered.length})</h3></div>
      <div className="table-card vendor-table-card"><table><thead><tr>
        <th>Account ID</th><th>Client</th><th>Contract</th>
        <th><div className="th-with-action"><span>Billed</span><button type="button" className="header-visibility-toggle" onClick={toggleAllAmounts} title={showAllAmounts ? "Hide all amounts" : "Show all amounts"}>{showAllAmounts ? <EyeOff size={13}/> : <Eye size={13}/>}</button></div></th>
        <th>Paid</th><th>Balance</th><th>Overdue</th><th>Account Status</th><th>Actions</th>
      </tr></thead><tbody>
        {filtered.length ? filtered.map(a => {
          const palette = accountStyle(a.accountStatus);
          return <tr key={a.id} onClick={() => { setSelected(a); onAudit?.("Viewed client account", `${a.accountId} — ${a.client}`); }} className={selected?.id === a.id ? "selected-row" : ""}>
            <td className="link-cell">{a.accountId}</td>
            <td className="strong-cell">{a.client}<small className="row-sub">{a.clientId}</small></td>
            <td>{a.contract}</td>
            <td className="money-cell">{shown(a.id) ? money(a.totalBilled) : "*"}</td>
            <td className="money-cell">{shown(a.id) ? money(a.totalPaid) : "*"}</td>
            <td className="money-cell">{shown(a.id) ? money(balanceOf(a)) : "*"}</td>
            <td className="money-cell">{shown(a.id) ? money(a.overdueAmount) : "*"}</td>
            <td><span className="status-chip" style={{ background: palette.background, color: palette.color }}>{a.accountStatus}</span></td>
            <td><div className="row-actions">
              <button title={shown(a.id) ? "Hide amounts" : "Show amounts"} onClick={(e) => { e.stopPropagation(); toggleAmount(a.id); }}>{shown(a.id) ? <EyeOff size={14}/> : <Eye size={14}/>}</button>
              <button title="Print" onClick={(e) => { e.stopPropagation(); printAccount(a); }}><Printer size={14}/></button>
            </div></td>
          </tr>;
        }) : <tr><td colSpan="9" className="empty">No client accounts found.</td></tr>}
      </tbody></table></div>
    </section>
    {selected && (
      <section className="vendor-detail-panel">
        <div className="vendor-detail-header">
          <div><span className="vendor-detail-kicker">Account ID / Client</span><h3>{selected.accountId} — {selected.client}</h3></div>
          <span className="status-chip" style={{ background: accountStyle(selected.accountStatus).background, color: accountStyle(selected.accountStatus).color }}>{selected.accountStatus}</span>
        </div>
        <div className="vendor-detail-grid">
          <div className="vendor-detail-block"><h4>Client Account Summary</h4><div className="vendor-detail-list">
            <div><span>Account ID</span><b>{selected.accountId}</b></div>
            <div><span>Client ID</span><b>{selected.clientId}</b></div>
            <div><span>Client Name</span><b>{selected.client}</b></div>
            <div><span>Assigned Account Officer</span><b>{selected.assignedOfficer || "—"}</b></div>
            <div><span>Last Account Review</span><b>{selected.lastReviewDate || "—"}</b></div>
            <div><span>Remarks</span><b>{selected.remarks || "—"}</b></div>
          </div></div>
          <div className="vendor-detail-block"><h4>Contract Information</h4><div className="vendor-detail-list">
            <div><span>Contract No.</span><b>{selected.contract}</b></div>
            <div><span>Contract Status</span><b>{selected.contractStatus || "—"}</b></div>
            <div><span>Contract Start</span><b>{selected.contractStart || "—"}</b></div>
            <div><span>Contract End</span><b>{selected.contractEnd || "—"}</b></div>
            <div><span>Billing Cycle</span><b>{selected.billingCycle || "—"}</b></div>
            <div><span>Contract Amount</span><b className="detail-masked-amount" onClick={() => toggleDetailAmount(`${selected.id}-contract-amount`)} title="Click to show / hide amount">{revealedDetailAmounts[`${selected.id}-contract-amount`] ? money(selected.contractAmount) : "*"}</b></div>
          </div></div>
          <div className="vendor-detail-block"><h4>Billing &amp; Balances (auto-calculated)</h4><div className="vendor-detail-list">
            <div><span>Total Billed</span><b className="detail-masked-amount" onClick={() => toggleDetailAmount(`${selected.id}-billed`)} title="Click to show / hide amount">{revealedDetailAmounts[`${selected.id}-billed`] ? money(selected.totalBilled) : "*"}</b></div>
            <div><span>Total Paid</span><b className="detail-masked-amount" onClick={() => toggleDetailAmount(`${selected.id}-paid`)} title="Click to show / hide amount">{revealedDetailAmounts[`${selected.id}-paid`] ? money(selected.totalPaid) : "*"}</b></div>
            <div><span>Outstanding Balance</span><b className="detail-masked-amount" onClick={() => toggleDetailAmount(`${selected.id}-balance`)} title="Click to show / hide amount">{revealedDetailAmounts[`${selected.id}-balance`] ? money(balanceOf(selected)) : "*"}</b></div>
            <div><span>Overdue Amount</span><b className="detail-masked-amount" onClick={() => toggleDetailAmount(`${selected.id}-overdue`)} title="Click to show / hide amount">{revealedDetailAmounts[`${selected.id}-overdue`] ? money(selected.overdueAmount) : "*"}</b></div>
            <div><span>Current Amount Due</span><b className="detail-masked-amount" onClick={() => toggleDetailAmount(`${selected.id}-current-due`)} title="Click to show / hide amount">{revealedDetailAmounts[`${selected.id}-current-due`] ? money(selected.currentAmountDue) : "*"}</b></div>
            <div><span>Collection Rate</span><b>{clientAccountCollectionRate(selected)}%</b></div>
          </div></div>
          <div className="vendor-detail-block"><h4>Invoices, Payments &amp; Status</h4><div className="vendor-detail-list">
            <div><span>Last Invoice</span><b>{selected.lastInvoice || "—"}</b></div>
            <div><span>Last Invoice Date</span><b>{selected.lastInvoiceDate || "—"}</b></div>
            <div><span>Last Payment</span><b>{selected.lastPayment || "—"}</b></div>
            <div><span>Last Payment Date</span><b>{selected.lastPaymentDate || "—"}</b></div>
            <div><span>Payment Status</span><b>{selected.paymentStatus || "—"}</b></div>
            <div><span>Credit Status</span><b>{selected.creditStatus || "—"}</b></div>
            <div><span>Collection Status</span><b>{selected.collectionStatus || "—"}</b></div>
          </div></div>
        </div>
        <div className="modal-footer">
          <button className="light-button" type="button" onClick={() => printAccount(selected)}><Printer size={15}/> Print Account</button>
          <button className="primary-button" type="button" onClick={() => navigate?.("Service Invoice Management")}>Open Service Invoices</button>
        </div>
      </section>
    )}
  </section>;
}


// Vendor Payment Tracking reads its invoices from the same Node backend as the
// other modules (GET /api/vendor-payments). Nothing here is typed in: the cards,
// table, detail tabs and timeline all derive from the records the API returns.
//
// The colour of every badge comes from the status the API returned, through
// vpStatusClass. Overdue and the aging buckets are derived server-side from the due
// date and the remaining balance, so a status that changes in the database
// recolours the table with no edit here.

const VP_METHODS = ['Bank Transfer', 'Check', 'Cash', 'Online Transfer', 'Other'];
const VP_APPROVALS = ['Pending', 'Approved', 'Rejected', 'On Hold'];
const VP_AGES = [
  'Due Today',
  'Due in 10 Days',
  'Due Later',
  '1-30 Days Overdue',
  '31-60 Days Overdue',
  '61+ Days Overdue',
];
const VP_DOC_TYPES = [
  'Invoice PDF',
  'Purchase Order',
  'Delivery Receipt',
  'Billing Statement',
  'Contract',
  'Other',
];

const vpMoney = (value) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const vpDate = (ymd) => {
  if (!ymd) return "—";
  const date = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const vpDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const vpBlank = (value) => (value === null || value === undefined || value === "" || value === "—" ? "—" : value);

const vpTodayYmd = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const vpSlug = (status) => String(status ?? "").trim().toLowerCase().replace(/\s+/g, "-");

const VP_STATUS_CLASS = {
  paid: "vp-paid", verified: "vp-verified", scheduled: "vp-scheduled",
  processing: "vp-processing", pending: "vp-pending", overdue: "vp-overdue",
  failed: "vp-failed", cancelled: "vp-cancelled",
  approved: "vp-approved", "on-hold": "vp-on-hold", rejected: "vp-rejected",
};

const vpStatusClass = (status) => `contract-status vp-status ${VP_STATUS_CLASS[vpSlug(status)] || "vp-neutral"}`;

const VP_AGE_CLASS = {
  "due-today": "vp-age-due", "due-in-10-days": "vp-age-soon",
  "due-later": "vp-age-later", "1-30-days-overdue": "vp-age-od1",
  "31-60-days-overdue": "vp-age-od2", "61-days-overdue": "vp-age-od3",
  "no-due-date": "vp-age-later",
};

const vpAgeClass = (bucket) => `vp-age ${VP_AGE_CLASS[vpSlug(bucket)] || "vp-age-later"}`;

const vpFailure = (error, context) => {
  if (error && error.kind === "network") {
    return `The backend did not answer while loading ${context}. Start it with "npm start" in the Backend folder, then try again.`;
  }
  if (error && error.kind === "http") {
    return `The backend rejected the request for ${context} (HTTP ${error.status})${error.detail ? `: ${error.detail}` : "."}`;
  }
  return `${context} could not be loaded: ${(error && error.message) || "unknown error"}.`;
};

const vpRequest = async (url, options = {}) => {
  let response;
  try {
    response = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  } catch (cause) {
    const error = new Error("The backend could not be reached.");
    error.kind = "network";
    error.cause = cause;
    throw error;
  }
  const text = await response.text();
  let payload = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = null; }
  }
  if (!response.ok) {
    const error = new Error(payload?.message || response.statusText || "Request failed");
    error.kind = "http";
    error.status = response.status;
    error.detail = payload?.message || null;
    throw error;
  }
  return payload;
};

// A card's peso total stays hidden as "*" until that card is clicked, matching the
// other payable modules. Each card has its own reveal key.
const VpCardAmount = ({ id, value, revealed, onToggle, tone }) => {
  const isOpen = Boolean(revealed[id]);
  return (
    <strong
      className={`vendor-summary-amount payable-card-amount ${isOpen ? "is-open" : ""} ${tone}`}
      role="button"
      tabIndex={0}
      aria-label={isOpen ? `Hide total, currently ${vpMoney(value)}` : "Reveal total"}
      title={isOpen ? "Click to hide amount" : "Click to reveal amount"}
      onClick={event => { event.stopPropagation(); onToggle(id); }}
      onKeyDown={event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onToggle(id); }
      }}
    >
      {isOpen ? vpMoney(value) : "*"}
    </strong>
  );
};

const VpMasked = ({ rowId, value, revealed, onToggle }) => {
  const key = `${rowId}-amount`;
  const isOpen = Boolean(revealed[key]);
  return (
    <span
      className="masked-amount"
      role="button"
      tabIndex={0}
      aria-label={isOpen ? `Hide amount, currently ${vpMoney(value)}` : "Reveal amount"}
      title={isOpen ? "Click to hide amount" : "Click to reveal amount"}
      onClick={event => { event.stopPropagation(); onToggle(key); }}
      onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onToggle(key); } }}
    >
      {isOpen ? vpMoney(value) : "*"}
    </span>
  );
};

function VendorPaymentTrackingPage({ onNew, onAudit }) {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [filterApproval, setFilterApproval] = useState("All Approvals");
  const [filterVendor, setFilterVendor] = useState("All Vendors");
  const [filterMethod, setFilterMethod] = useState("All Methods");
  const [filterAge, setFilterAge] = useState("All Due Status");
  const [selectedId, setSelectedId] = useState(null);
  const [detailTab, setDetailTab] = useState("Overview");

  const [editing, setEditing] = useState(null);
  const [action, setAction] = useState(null); // { kind, row }
  const [intake, setIntake] = useState(null);
  const [menuFor, setMenuFor] = useState(null);
  const [revealed, setRevealed] = useState({});

  const toggle = (key) => setRevealed(prev => ({ ...prev, [key]: !prev[key] }));

  // The full set is fetched once; the narrower filters are applied here so a search
  // never silently changes what the cards claim.
  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const payload = await vpRequest(`${API_BASE}/api/vendor-payments`);
      setRecords(Array.isArray(payload?.data) ? payload.data : []);
      // The cards read the backend's own summary of the same rows.
      setSummary(payload?.summary || null);
    } catch (error) {
      setRecords([]);
      setSummary(null);
      setLoadError(vpFailure(error, "vendor payments"));
    } finally {
      setLoading(false);
    }
  };

  // The vendor master list feeds the intake form's picker, so a vendor is chosen
  // from real records instead of retyped.
  const loadVendors = async () => {
    try {
      const payload = await vpRequest(`${API_BASE}/api/vendors`);
      setVendors(Array.isArray(payload?.data) ? payload.data : []);
    } catch {
      // A missing vendor list only affects the intake picker; the table still works.
      setVendors([]);
    }
  };

  useEffect(() => { load(); loadVendors(); }, []);

  const filteredRecords = useMemo(() => {
    const phrase = search.trim().toLowerCase();
    return records.filter(row => {
      if (filterStatus !== "All Status" && row.status !== filterStatus) return false;
      if (filterApproval !== "All Approvals" && row.approval_status !== filterApproval) return false;
      if (filterVendor !== "All Vendors" && row.vendor !== filterVendor) return false;
      if (filterMethod !== "All Methods" && row.payment_method !== filterMethod) return false;
      if (filterAge !== "All Due Status" && row.aging_bucket !== filterAge) return false;
      if (!phrase) return true;
      return [row.payment_id, row.vendor, row.invoice_number, row.purchase_order, row.reference_number, row.description]
        .some(v => String(v || "").toLowerCase().includes(phrase));
    });
  }, [records, search, filterStatus, filterApproval, filterVendor, filterMethod, filterAge]);

  const selected = useMemo(
    () => records.find(r => r.id === selectedId) || filteredRecords[0] || null,
    [records, filteredRecords, selectedId]
  );

  // Any mutation re-reads afterwards, otherwise the cards would keep showing the
  // pre-edit figures while the table row had already changed.
  const runAction = async (label, action_) => {
    setSaving(true);
    try {
      const result = await action_();
      setLoadError("");
      if (result?.message) onAudit?.(result.message);
      await load();
      return result;
    } catch (error) {
      setLoadError(vpFailure(error, label));
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Each flow step posts to its own endpoint. The backend owns every guard, so the
  // button state here is only a convenience.
  const call = (row, endpoint, payload) =>
    vpRequest(`${API_BASE}/api/vendor-payments/${row.id}/${endpoint}`, {
      method: "PUT",
      body: JSON.stringify(payload || {}),
    });

  const doApprove = async (row) => {
    const result = await runAction(`approving ${row.payment_id}`, () => call(row, "approve", { approved_by: "Finance Manager" }));
    if (result) window.alert(result.message);
  };
  const doSchedule = async (row) => {
    const result = await runAction(`scheduling ${row.payment_id}`, () => call(row, "schedule", { scheduled_date: vpTodayYmd() }));
    if (result) window.alert(result.message);
  };
  const doVerify = async (row) => {
    const result = await runAction(`verifying ${row.payment_id}`, () => call(row, "verify", { verified_by: "Finance Officer" }));
    if (result) window.alert(result.message);
  };
  const doDelete = async (row) => {
    if (!window.confirm(`Delete ${row.payment_id}? Its documents and history will also be removed.`)) return;
    const result = await runAction(`deleting ${row.payment_id}`, () =>
      vpRequest(`${API_BASE}/api/vendor-payments/${row.id}`, { method: "DELETE" })
    );
    if (result) { setSelectedId(null); window.alert(result.message); }
  };

  // The printed voucher shows the real amounts: masking a payment voucher would
  // defeat the purpose of printing it.
  const printVoucher = (row) => {
    const w = window.open("", "_blank");
    if (!w) { window.alert("The print window was blocked. Allow pop-ups for this site and try again."); return; }
    const line = (a, b, c, d) =>
      `<tr><td style="padding:4px"><b>${a}:</b></td><td>${b}</td><td style="padding:4px"><b>${c}:</b></td><td>${d}</td></tr>`;
    w.document.write(`<html><head><title>${row.payment_id}</title></head><body style="font-family:Arial;padding:40px">
      <h2 style="text-align:center">PRIMEPOWER</h2>
      <h3 style="text-align:center">FINANCIAL MANAGEMENT SYSTEM</h3>
      <h3 style="text-align:center">VENDOR PAYMENT VOUCHER</h3><hr/>
      <table style="width:100%;border-collapse:collapse">
        ${line("Payment ID", vpBlank(row.payment_id), "Vendor", vpBlank(row.vendor))}
        ${line("Invoice", vpBlank(row.invoice_number), "PO Number", vpBlank(row.purchase_order))}
        ${line("Invoice Amount", vpMoney(row.amount), "Tax", vpMoney(row.tax_amount))}
        ${line("Discount", vpMoney(row.discount_amount), "Net Payable", `<b>${vpMoney(row.net_payable)}</b>`)}
        ${line("Payment Date", vpDate(row.payment_date), "Due Date", vpDate(row.due_date))}
        ${line("Payment Method", vpBlank(row.payment_method), "Reference No.", vpBlank(row.reference_number))}
        ${line("Prepared By", vpBlank(row.prepared_by), "Approved By", vpBlank(row.approved_by))}
        ${line("Verified By", vpBlank(row.verified_by), "Status", `<b>${vpBlank(row.status).toUpperCase()}</b>`)}
      </table>
      <div style="margin-top:60px;display:flex;justify-content:space-between">
        <div style="width:30%;border-top:1px solid #000;padding-top:6px">Prepared Signature</div>
        <div style="width:30%;border-top:1px solid #000;padding-top:6px">Approved Signature</div>
        <div style="width:30%;border-top:1px solid #000;padding-top:6px">Verified Signature</div>
      </div>
      <script>window.print()</script></body></html>`);
    w.document.close();
  };

  const s = summary;
  const vendorNames = useMemo(() => [...new Set(records.map(r => r.vendor))].sort(), [records]);

  return <section className="management-page vendor-payment-page">
    <Breadcrumb current="Vendor Payment Tracking" parent="Accounts Payable" />
    <div className="management-header">
      <div><h2>VENDOR PAYMENT TRACKING</h2><p>Manage vendor invoices, approvals, payment processing and documentation.</p></div>
      <div className="management-actions">
        <button className="light-button" onClick={() => window.print()} disabled={saving}><Printer size={15}/> Print / Save PDF</button>
        <button className="primary-button" onClick={() => setIntake({ step: 1 })} disabled={saving}>＋ New Vendor Payment</button>
      </div>
    </div>

    <div className="vendor-toolbar">
      <div className="search-box vendor-search"><span>⌕</span><input placeholder="Search Vendor / Invoice / PO / Reference..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="vendor-toolbar-controls">
        <select className="vendor-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} aria-label="Status">
          <option>All Status</option>
          {["Pending", "Scheduled", "Processing", "Paid", "Verified", "Failed", "Overdue"].map(o => <option key={o}>{o}</option>)}
        </select>
        <select className="vendor-select" value={filterApproval} onChange={e => setFilterApproval(e.target.value)} aria-label="Approval status">
          <option>All Approvals</option>
          {VP_APPROVALS.map(o => <option key={o}>{o}</option>)}
        </select>
        <select className="vendor-select" value={filterVendor} onChange={e => setFilterVendor(e.target.value)} aria-label="Vendor">
          <option>All Vendors</option>
          {vendorNames.map(o => <option key={o}>{o}</option>)}
        </select>
        <select className="vendor-select" value={filterMethod} onChange={e => setFilterMethod(e.target.value)} aria-label="Payment method">
          <option>All Methods</option>
          {VP_METHODS.map(o => <option key={o}>{o}</option>)}
        </select>
        <select className="vendor-select" value={filterAge} onChange={e => setFilterAge(e.target.value)} aria-label="Due status">
          <option>All Due Status</option>
          {VP_AGES.map(o => <option key={o}>{o}</option>)}
        </select>
      </div>
    </div>

    {loadError && <div className="cfu-error" role="alert">{loadError}</div>}

    <div className="vendor-summary-grid">
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Total Payables</span>
        <VpCardAmount id="vp-total" value={s ? s.total_payable : 0} revealed={revealed} onToggle={toggle} tone="total-supplies-amount" />
        <span className="vendor-summary-count">{s ? s.total_payable_count : 0} invoice{(s ? s.total_payable_count : 0) === 1 ? "" : "s"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Pending Approval</span>
        <VpCardAmount id="vp-pending" value={s ? s.pending_approval_amount : 0} revealed={revealed} onToggle={toggle} tone="pending-amount" />
        <span className="vendor-summary-count">{s ? s.pending_approval : 0} payment{(s ? s.pending_approval : 0) === 1 ? "" : "s"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Scheduled</span>
        <VpCardAmount id="vp-scheduled" value={s ? s.scheduled_amount : 0} revealed={revealed} onToggle={toggle} tone="scheduled-amount" />
        <span className="vendor-summary-count">{s ? s.scheduled : 0} payment{(s ? s.scheduled : 0) === 1 ? "" : "s"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Paid This Month</span>
        <VpCardAmount id="vp-paid" value={s ? s.paid_this_month_amount : 0} revealed={revealed} onToggle={toggle} tone="paid-amount" />
        <span className="vendor-summary-count">{s ? s.paid_this_month : 0} payment{(s ? s.paid_this_month : 0) === 1 ? "" : "s"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Overdue</span>
        <VpCardAmount id="vp-overdue" value={s ? s.overdue_amount : 0} revealed={revealed} onToggle={toggle} tone="overdue-amount" />
        <span className="vendor-summary-count">{s ? s.overdue : 0} invoice{(s ? s.overdue : 0) === 1 ? "" : "s"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">On Hold</span>
        <VpCardAmount id="vp-hold" value={s ? s.on_hold_amount : 0} revealed={revealed} onToggle={toggle} tone="hold-amount" />
        <span className="vendor-summary-count">{s ? s.on_hold : 0} payment{(s ? s.on_hold : 0) === 1 ? "" : "s"}</span>
      </div>
    </div>

    <section className="vendor-record-panel">
      <div className="vendor-record-heading">
        <h3>Payment Records</h3>
        <span className="vendor-summary-count">{filteredRecords.length} of {records.length} shown</span>
      </div>
      <div className="table-card vendor-table-card">
        <table>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Vendor</th>
              <th>Invoice</th>
              <th>PO Number</th>
              <th>Due Date</th>
              <th className="money-cell">Amount</th>
              <th>Method</th>
              <th>Approval</th>
              <th>Status</th>
              <th>Due Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="11" className="empty">Loading vendor payments...</td></tr>}
            {!loading && filteredRecords.length === 0 && (
              <tr><td colSpan="11" className="empty">No payment records match the current search and filters.</td></tr>
            )}
            {!loading && filteredRecords.map(r => <tr key={r.id} onClick={() => setSelectedId(r.id)} className={selected?.id === r.id ? "selected-row" : ""}>
              <td className="link-cell">{r.payment_id}</td>
              <td className="strong-cell">{vpBlank(r.vendor)}</td>
              <td>{vpBlank(r.invoice_number)}</td>
              <td>{vpBlank(r.purchase_order)}</td>
              <td>{vpDate(r.due_date)}</td>
              <td className="money-cell"><VpMasked rowId={r.id} value={r.net_payable} revealed={revealed} onToggle={toggle} /></td>
              <td>{vpBlank(r.payment_method)}</td>
              {/* Every badge takes its class from the status the API returned, so a
                  change in the database recolours the table with no edit here. */}
              <td><span className={vpStatusClass(r.approval_status)}>{r.approval_status}</span></td>
              <td><span className={vpStatusClass(r.status)}>{r.status}</span></td>
              <td><span className={vpAgeClass(r.aging_bucket)}>{r.aging_bucket}</span></td>
              <td onClick={e => e.stopPropagation()}>
                <div className="row-actions">
                  <button type="button" title="View details" aria-label={`View ${r.payment_id}`} onClick={() => { setSelectedId(r.id); setDetailTab("Overview"); }}><Eye size={15}/></button>
                  <button
                    type="button"
                    title={r.can_edit ? `Edit ${r.payment_id}` : `${r.payment_id} is ${String(r.status).toLowerCase()} and can no longer be edited`}
                    aria-label={`Edit ${r.payment_id}`}
                    className={r.can_edit ? "" : "sp-blocked"}
                    onClick={() => r.can_edit ? setEditing({ ...r }) : window.alert(`${r.payment_id} is ${String(r.status).toLowerCase()} and can no longer be edited.`)}
                  ><Edit3 size={15}/></button>
                  <button
                    type="button"
                    title={r.can_approve ? `Approve ${r.payment_id}` : `${r.payment_id} is ${String(r.approval_status).toLowerCase()} — not awaiting approval`}
                    aria-label={`Approve ${r.payment_id}`}
                    className={r.can_approve ? "" : "sp-blocked"}
                    disabled={saving}
                    onClick={() => r.can_approve ? doApprove(r) : window.alert(`${r.payment_id} is ${String(r.approval_status).toLowerCase()}; there is nothing to approve.`)}
                  ><CheckCircle2 size={15}/></button>
                  <button
                    type="button"
                    title={r.can_pay ? `Process payment for ${r.payment_id}` : `${r.payment_id} is ${String(r.status).toLowerCase()} — not ready to be paid`}
                    aria-label={`Process payment for ${r.payment_id}`}
                    className={r.can_pay ? "" : "sp-blocked"}
                    disabled={saving}
                    onClick={() => setAction({ kind: "process", row: r })}
                  ><PhilippinePeso size={15}/></button>
                  <button type="button" title="Print voucher" aria-label={`Print voucher for ${r.payment_id}`} onClick={() => printVoucher(r)}><Printer size={15}/></button>
                  <div className="row-menu">
                    <button type="button" title="More actions" aria-label={`More actions for ${r.payment_id}`} onClick={() => setMenuFor(menuFor === r.id ? null : r.id)}><MoreHorizontal size={15}/></button>
                    {menuFor === r.id && (
                      <div className="row-menu-popover">
                        {r.can_schedule && <button type="button" disabled={saving} onClick={() => { setMenuFor(null); doSchedule(r); }}>Schedule payment</button>}
                        {r.can_verify && <button type="button" disabled={saving} onClick={() => { setMenuFor(null); doVerify(r); }}>Verify payment</button>}
                        <button type="button" disabled={saving} onClick={() => { setMenuFor(null); setAction({ kind: "reject", row: r }); }}>Reject</button>
                        <button type="button" disabled={saving} onClick={() => { setMenuFor(null); setAction({ kind: "hold", row: r }); }}>Put on hold</button>
                        <button type="button" disabled={saving} onClick={() => { setMenuFor(null); setAction({ kind: "document", row: r }); }}>Attach document</button>
                        <button type="button" className="danger" disabled={saving} onClick={() => { setMenuFor(null); doDelete(r); }}>Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </section>

    {selected && (
      <section className="vendor-detail-panel">
        <div className="vendor-detail-header">
          <div>
            <span className="vendor-detail-kicker">Vendor Payment</span>
            <h3>{selected.payment_id} — {vpBlank(selected.vendor)}</h3>
            <p className="vp-detail-sub">{vpBlank(selected.invoice_number)} &middot; {vpBlank(selected.purchase_order)}</p>
          </div>
          <div className="sp-detail-actions">
            <span className={vpStatusClass(selected.status)}>{selected.status}</span>
            <span className={vpAgeClass(selected.aging_bucket)}>{selected.aging_bucket}</span>
            <button type="button" className="light-button" onClick={() => printVoucher(selected)}><Printer size={14}/> Voucher</button>
          </div>
        </div>

        <div className="vp-tabs">
          {["Overview", "Invoice", "Approval", "Payment", "Documents", "Activity"].map(tab => (
            <button
              key={tab}
              type="button"
              className={`vp-tab ${detailTab === tab ? "active" : ""}`}
              onClick={() => setDetailTab(tab)}
            >
              {tab}
              {tab === "Documents" && selected.documents.length > 0 && <span className="vp-tab-count">{selected.documents.length}</span>}
              {tab === "Activity" && selected.activities.length > 0 && <span className="vp-tab-count">{selected.activities.length}</span>}
            </button>
          ))}
        </div>

        <div className="vendor-detail-grid">
          {detailTab === "Overview" && (<>
            <div className="vendor-detail-block">
              <h4>Vendor Information</h4>
              <div className="vendor-detail-list">
                <div><span>Vendor Name</span><b>{vpBlank(selected.vendor)}</b></div>
                <div><span>Vendor ID</span><b>{vpBlank(selected.vendor_code)}</b></div>
                <div><span>Contact Person</span><b>{vpBlank(selected.contact_person)}</b></div>
                <div><span>Contact Number</span><b>{vpBlank(selected.contact_number)}</b></div>
                <div><span>Email</span><b>{vpBlank(selected.email)}</b></div>
                <div><span>Address</span><b>{vpBlank(selected.address)}</b></div>
                <div><span>Bank</span><b>{vpBlank(selected.bank_name)}</b></div>
                <div><span>Bank Account</span><b>{vpBlank(selected.bank_account)}</b></div>
                <div><span>Payment Terms</span><b>{vpBlank(selected.payment_terms)}</b></div>
              </div>
            </div>
            <div className="vendor-detail-block">
              <h4>Payment Summary</h4>
              <div className="vendor-detail-list">
                <div><span>Invoice Amount</span><b>{vpMoney(selected.amount)}</b></div>
                <div><span>Tax</span><b>{vpMoney(selected.tax_amount)}</b></div>
                <div><span>Discount</span><b>{vpMoney(selected.discount_amount)}</b></div>
                <div><span>Net Payable</span><b>{vpMoney(selected.net_payable)}</b></div>
                <div><span>Amount Paid</span><b>{vpMoney(selected.paid_amount)}</b></div>
                <div><span>Remaining Balance</span><b>{vpMoney(selected.remaining_balance)}</b></div>
                <div><span>Due Date</span><b>{vpDate(selected.due_date)}</b></div>
                <div><span>Days Overdue</span><b>{selected.days_overdue > 0 ? `${selected.days_overdue} day(s)` : "—"}</b></div>
                <div><span>Due Status</span><b>{selected.aging_bucket}</b></div>
              </div>
            </div>
          </>)}

          {detailTab === "Invoice" && (
            <div className="vendor-detail-block">
              <h4>Invoice Information</h4>
              <div className="vendor-detail-list">
                <div><span>Invoice Number</span><b>{vpBlank(selected.invoice_number)}</b></div>
                <div><span>Purchase Order</span><b>{vpBlank(selected.purchase_order)}</b></div>
                <div><span>Description</span><b>{vpBlank(selected.description)}</b></div>
                <div><span>Invoice Date</span><b>{vpDate(selected.invoice_date)}</b></div>
                <div><span>Due Date</span><b>{vpDate(selected.due_date)}</b></div>
                <div><span>Invoice Amount</span><b>{vpMoney(selected.amount)}</b></div>
                <div><span>Tax / VAT</span><b>{vpMoney(selected.tax_amount)}</b></div>
                <div><span>Discount</span><b>{vpMoney(selected.discount_amount)}</b></div>
                <div><span>Net Payable</span><b>{vpMoney(selected.net_payable)}</b></div>
              </div>
            </div>
          )}

          {detailTab === "Approval" && (
            <div className="vendor-detail-block">
              <h4>Approval Workflow</h4>
              <div className="vendor-detail-list">
                <div><span>Approval Status</span><b>{selected.approval_status}</b></div>
                <div><span>Prepared By</span><b>{vpBlank(selected.prepared_by)}</b></div>
                <div><span>Reviewed By</span><b>{vpBlank(selected.reviewed_by)}</b></div>
                <div><span>Approved By</span><b>{vpBlank(selected.approved_by)}</b></div>
                <div><span>Approval Date</span><b>{vpDate(selected.approved_on)}</b></div>
                <div><span>Rejection Reason</span><b>{selected.approval_status === "Rejected" ? vpBlank(selected.rejection_reason) : "—"}</b></div>
                <div><span>Hold Reason</span><b>{selected.approval_status === "On Hold" ? vpBlank(selected.hold_reason) : "—"}</b></div>
              </div>
            </div>
          )}

          {detailTab === "Payment" && (
            <div className="vendor-detail-block">
              <h4>Payment Information</h4>
              <div className="vendor-detail-list">
                <div><span>Payment Status</span><b>{selected.status}</b></div>
                <div><span>Payment Method</span><b>{vpBlank(selected.payment_method)}</b></div>
                <div><span>Payment Account</span><b>{vpBlank(selected.payment_account)}</b></div>
                <div><span>Scheduled Date</span><b>{vpDate(selected.scheduled_date)}</b></div>
                <div><span>Payment Date</span><b>{vpDate(selected.payment_date)}</b></div>
                <div><span>Reference Number</span><b>{vpBlank(selected.reference_number)}</b></div>
                <div><span>Amount Paid</span><b>{vpMoney(selected.paid_amount)}</b></div>
                <div><span>Remaining Balance</span><b>{vpMoney(selected.remaining_balance)}</b></div>
                <div><span>Verified By</span><b>{vpBlank(selected.verified_by)}</b></div>
                <div><span>Verified On</span><b>{vpDate(selected.verified_on)}</b></div>
                <div><span>Remarks</span><b>{vpBlank(selected.remarks)}</b></div>
              </div>
            </div>
          )}

          {detailTab === "Documents" && (
            <div className="vendor-detail-block">
              <h4>Supporting Documents</h4>
              {selected.documents.length === 0 ? (
                <div className="vendor-detail-list"><div><span>Documents</span><b>None attached yet</b></div></div>
              ) : (
                <div className="vendor-detail-list">
                  {selected.documents.map(doc => (
                    <div key={doc.id}>
                      <span>{vpBlank(doc.document_type)}</span>
                      <b>{vpBlank(doc.file_name)} ✓ Uploaded by {vpBlank(doc.uploaded_by)}</b>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {detailTab === "Activity" && (
            <div className="vendor-detail-block vp-timeline-block">
              <h4>Payment Activity</h4>
              <div className="vp-timeline">
                {selected.activities.length === 0 && <p className="empty">No activity recorded yet.</p>}
                {selected.activities.map(entry => (
                  <div className="vp-timeline-item" key={entry.id}>
                    <span className="vp-timeline-dot" />
                    <div>
                      <strong>{vpBlank(entry.action)}</strong>
                      <p>{vpBlank(entry.remarks)}</p>
                      <small>{vpDateTime(entry.created_at)} &middot; {vpBlank(entry.actor)}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    )}

    {/* One dialog drives the flow actions. Each posts to its own endpoint, and the
        backend re-checks the guard, so a stale button state cannot corrupt a record. */}
    {action && (
      <div className="modal-overlay" onClick={() => !saving && setAction(null)}>
        <form
          className="modal"
          onClick={e => e.stopPropagation()}
          onSubmit={async e => {
            e.preventDefault();
            const f = e.target;
            const row = action.row;
            const payload = {
              payment_date: f.payment_date?.value || undefined,
              payment_method: f.payment_method?.value || undefined,
              payment_account: f.payment_account?.value || undefined,
              reference_number: f.reference_number?.value || undefined,
              paid_amount: f.paid_amount?.value ? Number(f.paid_amount.value) : undefined,
              payment_failed: f.payment_failed ? f.payment_failed.value === "yes" : undefined,
              rejection_reason: f.reason?.value || undefined,
              hold_reason: f.reason?.value || undefined,
            };
            const result = await runAction(`${action.kind} on ${row.payment_id}`, () =>
              action.kind === "document"
                ? vpRequest(`${API_BASE}/api/vendor-payments/${row.id}/documents`, {
                    method: "POST",
                    body: JSON.stringify({
                      document_type: f.document_type.value,
                      file_name: f.file_name.value,
                      uploaded_by: "Admin User",
                    }),
                  })
                : call(row, action.kind, payload)
            );
            if (result) { setAction(null); window.alert(result.message); }
          }}
        >
          <div className="modal-header">
            <div>
              <h2>
                {action.kind === "process" ? "Process Payment" :
                 action.kind === "reject" ? "Reject" :
                 action.kind === "hold" ? "Put On Hold" : "Attach Document"}
                {" — "}{action.row.payment_id}
              </h2>
              <p>
                {action.kind === "process"
                  ? `Outstanding: ${vpMoney(action.row.remaining_balance)} of ${vpMoney(action.row.net_payable)} net payable`
                  : action.kind === "document" ? "Record a supporting document against this invoice"
                  : action.kind === "reject" ? "A reason is required so the vendor knows what to fix"
                  : "A reason is required so the block is visible to everyone"}
              </p>
            </div>
            <button type="button" onClick={() => setAction(null)} disabled={saving}><X size={20}/></button>
          </div>
          <div className="form-grid">
            {action.kind === "process" && (<>
              <label>Payment Outcome
                <select name="payment_failed" defaultValue="no">
                  <option value="no">Paid successfully</option>
                  <option value="yes">Payment failed</option>
                </select>
              </label>
              <label>Amount Paid
                <input name="paid_amount" type="number" min="0.01" max={action.row.remaining_balance} step="0.01" defaultValue={action.row.remaining_balance} />
              </label>
              <label>Payment Date<input name="payment_date" type="date" defaultValue={vpTodayYmd()} required /></label>
              <label>Payment Method
                <select name="payment_method" defaultValue={action.row.payment_method === "—" ? "Bank Transfer" : action.row.payment_method}>
                  {VP_METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </label>
              <label>Payment Account<input name="payment_account" type="text" defaultValue={action.row.payment_account === "—" ? "BDO Operating Account" : action.row.payment_account} /></label>
              <label>Reference Number<input name="reference_number" type="text" defaultValue={action.row.reference_number === "—" ? "" : action.row.reference_number} placeholder="e.g. BTR-20260914-001" /></label>
            </>)}

            {(action.kind === "reject" || action.kind === "hold") && (
              <label className="full">{action.kind === "reject" ? "Rejection reason" : "Reason for the hold"}
                <textarea name="reason" rows="3" required />
              </label>
            )}

            {action.kind === "document" && (<>
              <label>Document Type
                <select name="document_type" defaultValue="Invoice PDF">
                  {VP_DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label>File Name<input name="file_name" type="text" placeholder="e.g. INV-105.pdf" required /></label>
            </>)}
          </div>
          <div className="modal-footer">
            <button type="button" className="light-button" onClick={() => setAction(null)} disabled={saving}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : "Confirm"}</button>
          </div>
        </form>
      </div>
    )}

    {editing && (
      <VendorPaymentForm
        record={editing}
        saving={saving}
        onClose={() => setEditing(null)}
        onSubmit={async (payload) => {
          const result = await runAction(`updating ${editing.payment_id}`, () =>
            vpRequest(`${API_BASE}/api/vendor-payments/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) })
          );
          if (result) { setEditing(null); window.alert(result.message); }
        }}
      />
    )}

    {intake && (
      <VendorPaymentIntake
        vendors={vendors}
        step={intake.step}
        onStep={step => setIntake(prev => ({ ...prev, step }))}
        saving={saving}
        onClose={() => setIntake(null)}
        onSubmit={async (payload) => {
          const result = await runAction("creating a vendor payment", () =>
            vpRequest(`${API_BASE}/api/vendor-payments`, { method: "POST", body: JSON.stringify(payload) })
          );
          if (result) { setIntake(null); window.alert(result.message); }
        }}
      />
    )}
  </section>;
}

// Edit form for an existing invoice. The status columns, paid amount, payment date
// and verification are absent on purpose: they are events, and each is only
// reachable through its own endpoint. An editable "Paid" would let the form
// contradict the ledger.
function VendorPaymentForm({ record, saving, onClose, onSubmit }) {
  const blank = (v) => (v === "—" || v === null || v === undefined ? "" : v);
  const [form, setForm] = useState({
    vendor: blank(record.vendor),
    invoice_number: blank(record.invoice_number),
    purchase_order: blank(record.purchase_order),
    description: blank(record.description),
    invoice_date: record.invoice_date || "",
    due_date: record.due_date || "",
    amount: String(record.amount ?? 0),
    tax_amount: String(record.tax_amount ?? 0),
    discount_amount: String(record.discount_amount ?? 0),
    payment_method: record.payment_method === "—" ? "Bank Transfer" : record.payment_method,
    payment_account: blank(record.payment_account),
    remarks: record.remarks || "",
  });
  const set = (key) => e => setForm(prev => ({ ...prev, [key]: e.target.value }));

  // Net payable is previewed from the same arithmetic the backend uses, so the user
  // sees the figure that will actually be stored rather than a typed-in total.
  const net = Math.max(
    Number(form.amount || 0) + Number(form.tax_amount || 0) - Number(form.discount_amount || 0), 0
  );

  return (
    <div className="modal-overlay" onClick={() => !saving && onClose()}>
      <form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => {
        e.preventDefault();
        onSubmit({
          ...form,
          amount: Number(form.amount || 0),
          tax_amount: Number(form.tax_amount || 0),
          discount_amount: Number(form.discount_amount || 0),
        });
      }}>
        <div className="modal-header">
          <div>
            <h2>Edit Payment — {record.payment_id}</h2>
            <p>Status: {record.approval_status} &middot; {record.status}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
        </div>
        <div className="form-grid">
          <label>Vendor<input value={form.vendor} onChange={set("vendor")} required /></label>
          <label>Invoice Number<input value={form.invoice_number} onChange={set("invoice_number")} required /></label>
          <label>Purchase Order<input value={form.purchase_order} onChange={set("purchase_order")} /></label>
          <label>Payment Method
            <select value={form.payment_method} onChange={set("payment_method")}>
              {VP_METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
          </label>
          <label>Invoice Date<input type="date" value={form.invoice_date} onChange={set("invoice_date")} required /></label>
          <label>Due Date<input type="date" value={form.due_date} onChange={set("due_date")} required /></label>
          <label>Invoice Amount<input type="number" min="0" step="0.01" value={form.amount} onChange={set("amount")} required /></label>
          <label>Tax Amount<input type="number" min="0" step="0.01" value={form.tax_amount} onChange={set("tax_amount")} /></label>
          <label>Discount<input type="number" min="0" step="0.01" value={form.discount_amount} onChange={set("discount_amount")} /></label>
          <label>Payment Account<input value={form.payment_account} onChange={set("payment_account")} /></label>
          <label className="full">Description<input value={form.description} onChange={set("description")} /></label>
          <label className="full">Net Payable: <b>{vpMoney(net)}</b></label>
          <label className="full">Remarks<textarea rows="2" value={form.remarks} onChange={set("remarks")} /></label>
        </div>
        <div className="modal-footer">
          <button type="button" className="light-button" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </form>
    </div>
  );
}

// The documented 5-step vendor intake. The vendor is chosen from /api/vendors so
// its contact and bank details are carried over rather than retyped, and the net
// payable is calculated as the user types rather than entered by hand.
const VP_STEPS = ["Vendor Information", "Invoice Information", "Supporting Documents", "Payment Information", "Approval Workflow"];

function VendorPaymentIntake({ vendors, step, onStep, saving, onClose, onSubmit }) {
  const [form, setForm] = useState({
    vendor_id: "", vendor: "", invoice_number: "", purchase_order: "", description: "",
    invoice_date: vpTodayYmd(), due_date: "", amount: "", tax_amount: "", discount_amount: "",
    payment_method: "Bank Transfer", payment_account: "BDO Operating Account",
    payment_date: "", reference_number: "", prepared_by: "Admin User", remarks: "",
  });
  const [docs, setDocs] = useState([{ document_type: "Invoice PDF", file_name: "" }]);
  const [errors, setErrors] = useState([]);
  const set = (key) => e => setForm(prev => ({ ...prev, [key]: e.target.value }));

  // Picking a vendor fills its details from the master record, so the same bank
  // account is not retyped (and misspelled) on every invoice.
  const pickVendor = e => {
    const vendor = vendors.find(v => String(v.id) === e.target.value);
    setForm(prev => ({
      ...prev,
      vendor_id: e.target.value,
      vendor: vendor ? vendor.vendor_name : "",
      payment_account: vendor && vendor.bank_name ? `${vendor.bank_name} Operating Account` : prev.payment_account,
    }));
  };

  const net = Math.max(Number(form.amount || 0) + Number(form.tax_amount || 0) - Number(form.discount_amount || 0), 0);
  const chosen = vendors.find(v => String(v.id) === String(form.vendor_id));

  // Validation runs per step so the user is told what is missing before advancing,
  // rather than after a round trip to the server.
  const validateStep = n => {
    const e = [];
    if (n === 1) {
      if (!form.vendor) e.push("A vendor is required.");
      if (!vendors.length) e.push("No vendors are available. Add a vendor to the vendors table first.");
    }
    if (n === 2) {
      if (!form.invoice_number) e.push("Invoice number is required.");
      if (!form.invoice_date) e.push("Invoice date is required.");
      if (!form.due_date) e.push("Due date is required.");
      if (form.due_date && form.invoice_date && form.due_date < form.invoice_date) e.push("Due date cannot be earlier than the invoice date.");
      if (!(Number(form.amount) > 0)) e.push("Invoice amount must be greater than zero.");
      if (Number(form.discount_amount) > Number(form.amount)) e.push("Discount cannot be greater than the invoice amount.");
    }
    return e;
  };

  const next = () => {
    const found = validateStep(step);
    if (found.length) { setErrors(found); return; }
    setErrors([]);
    onStep(Math.min(step + 1, VP_STEPS.length));
  };

  const submit = e => {
    e.preventDefault();
    const found = validateStep(2);
    if (found.length) { setErrors(found); onStep(2); return; }
    onSubmit({
      ...form,
      amount: Number(form.amount || 0),
      tax_amount: Number(form.tax_amount || 0),
      discount_amount: Number(form.discount_amount || 0),
    });
  };

  return (
    <div className="modal-overlay" onClick={() => !saving && onClose()}>
      <form className="modal vp-intake" onClick={e => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-header">
          <div><h2>New Vendor Payment</h2><p>Step {step} of {VP_STEPS.length} — {VP_STEPS[step - 1]}</p></div>
          <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
        </div>
        <ol className="vp-steps">
          {VP_STEPS.map((label, i) => (
            <li key={label} className={i + 1 === step ? "active" : i + 1 < step ? "done" : ""}>
              <span>{i + 1 < step ? "✓" : i + 1}</span>{label}
            </li>
          ))}
        </ol>
        {errors.length > 0 && <div className="cfu-error" role="alert">{errors.map((e, i) => <div key={i}>{e}</div>)}</div>}

        <div className="form-grid">
          {step === 1 && (<>
            <label>Vendor / Supplier *
              <select value={form.vendor_id} onChange={pickVendor} required>
                <option value="">Select vendor...</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.vendor_name} ({v.vendor_code})</option>)}
              </select>
            </label>
            <label>Vendor Name<input value={form.vendor} onChange={set("vendor")} required readOnly /></label>
            {chosen && (<>
              <label>Contact Person<input value={chosen.contact_person || ""} readOnly /></label>
              <label>Contact Number<input value={chosen.contact_number || ""} readOnly /></label>
              <label>Email<input value={chosen.email || ""} readOnly /></label>
              <label>Bank<input value={chosen.bank_name || ""} readOnly /></label>
              <label>Bank Account<input value={chosen.bank_account || ""} readOnly /></label>
              <label>Payment Terms<input value={chosen.payment_terms || ""} readOnly /></label>
              <label className="full">Address<input value={chosen.address || ""} readOnly /></label>
            </>)}
          </>)}

          {step === 2 && (<>
            <label>Invoice Number *<input value={form.invoice_number} onChange={set("invoice_number")} required /></label>
            <label>Purchase Order<input value={form.purchase_order} onChange={set("purchase_order")} /></label>
            <label>Invoice Date *<input type="date" value={form.invoice_date} onChange={set("invoice_date")} required /></label>
            <label>Due Date *<input type="date" value={form.due_date} onChange={set("due_date")} required /></label>
            <label>Invoice Amount *<input type="number" min="0" step="0.01" value={form.amount} onChange={set("amount")} required /></label>
            <label>Tax Amount<input type="number" min="0" step="0.01" value={form.tax_amount} onChange={set("tax_amount")} /></label>
            <label>Discount<input type="number" min="0" step="0.01" value={form.discount_amount} onChange={set("discount_amount")} /></label>
            <label>Net Payable<input value={vpMoney(net)} readOnly /></label>
            <label className="full">Description<input value={form.description} onChange={set("description")} /></label>
          </>)}

          {step === 3 && (<>
            <div className="full">
              <p className="vp-hint">Documents are attached to the invoice once it is created. List the file names now.</p>
              {docs.map((doc, i) => (
                <div className="vp-doc-row" key={i}>
                  <select value={doc.document_type} onChange={e => setDocs(prev => prev.map((d, j) => j === i ? { ...d, document_type: e.target.value } : d))}>
                    {VP_DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <input type="text" placeholder="e.g. INV-105.pdf" value={doc.file_name}
                    onChange={e => setDocs(prev => prev.map((d, j) => j === i ? { ...d, file_name: e.target.value } : d))} />
                  <button type="button" className="light-button" onClick={() => setDocs(prev => prev.filter((_, j) => j !== i))}>Remove</button>
                </div>
              ))}
              <button type="button" className="light-button" onClick={() => setDocs(prev => [...prev, { document_type: "Other", file_name: "" }])}>＋ Add Document</button>
            </div>
          </>)}

          {step === 4 && (<>
            <label>Payment Method
              <select value={form.payment_method} onChange={set("payment_method")}>
                {VP_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </label>
            <label>Payment Account<input value={form.payment_account} onChange={set("payment_account")} /></label>
            <label>Payment Date<input type="date" value={form.payment_date} onChange={set("payment_date")} /></label>
            <label>Payment Reference<input value={form.reference_number} onChange={set("reference_number")} /></label>
            <label>Prepared By<input value={form.prepared_by} onChange={set("prepared_by")} /></label>
            <label className="full">Remarks<textarea rows="2" value={form.remarks} onChange={set("remarks")} /></label>
          </>)}

          {step === 5 && (<>
            <div className="full">
              <div className="vendor-detail-list">
                <div><span>Vendor</span><b>{form.vendor || "—"}</b></div>
                <div><span>Invoice</span><b>{form.invoice_number || "—"}</b></div>
                <div><span>Purchase Order</span><b>{form.purchase_order || "—"}</b></div>
                <div><span>Invoice Amount</span><b>{vpMoney(form.amount)}</b></div>
                <div><span>Tax</span><b>{vpMoney(form.tax_amount)}</b></div>
                <div><span>Discount</span><b>{vpMoney(form.discount_amount)}</b></div>
                <div><span>Net Payable</span><b>{vpMoney(net)}</b></div>
                <div><span>Documents</span><b>{docs.filter(d => d.file_name).length} listed</b></div>
                <div><span>Prepared By</span><b>{form.prepared_by || "—"}</b></div>
              </div>
              <p className="vp-hint">The invoice is created as Pending. It moves to Approved, Scheduled, Processed, Paid and Verified through the action buttons on the payment record.</p>
            </div>
          </>)}
        </div>

        <div className="modal-footer">
          <button type="button" className="light-button" onClick={step === 1 ? onClose : () => { setErrors([]); onStep(step - 1); }} disabled={saving}>
            {step === 1 ? "Cancel" : "Back"}
          </button>
          {step < VP_STEPS.length
            ? <button type="button" className="primary-button" onClick={next} disabled={saving}>Next</button>
            : <button type="submit" className="primary-button" disabled={saving}>{saving ? "Creating..." : "Create Vendor Payment"}</button>}
        </div>
      </form>
    </div>
  );
}
const spTodayYmd = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

// Two decimals, because a peso total on a payable page is reconciled to the
// cent against the supplier's invoice.
const spMoney = (value) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// "Sep 5, 2026" for the table; "—" for a date that was never set.
const spDate = (ymd) => {
  if (!ymd) return "—";
  const date = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const spStatusSlug = (status) =>
  String(status || "unknown").toLowerCase().trim().replace(/\s+/g, "-");

const spBlank = (value) => (value === null || value === undefined || value === "" ? "—" : value);

// A peso figure stays hidden as "*" until its own cell is clicked. Each amount
// has a separate reveal key, so revealing the invoice Amount never exposes Paid
// Amount or Remaining Balance as a side effect.
//
// The record ID is part of every key on purpose. Without it, switching rows
// would carry the previous record's revealed state onto the new one and expose
// a figure the user never chose to reveal.
const SpMaskedAmount = ({ id, value, revealed, onToggle }) => {
  const isOpen = Boolean(revealed[id]);
  return (
    <span
      className="masked-amount"
      role="button"
      tabIndex={0}
      aria-label={isOpen ? `Hide amount, currently ${spMoney(value)}` : "Reveal amount"}
      title={isOpen ? "Click to hide amount" : "Click to reveal amount"}
      onClick={event => {
        event.stopPropagation();
        onToggle(id);
      }}
      onKeyDown={event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle(id);
        }
      }}
    >
      {isOpen ? spMoney(value) : "*"}
    </span>
  );
};

const SP_STATUS_OPTIONS = ["All Status", "Pending", "For Approval", "Approved", "Scheduled", "Paid", "Overdue", "Cancelled"];
const SP_METHODS = ["Supply Payment", "Cash Payment", "Check Payment", "Bank Payment"];

// A failed request has to say what actually failed. The old page collapsed every
// error into "no records", which is how a stopped backend looked identical to a
// genuinely empty ledger.
const spFailureMessage = (error, context) => {
  if (error && error.kind === "network") {
    return `The backend did not answer while loading ${context}. Start it with "npm start" in the Backend folder, then try again.`;
  }
  if (error && error.kind === "http") {
    return `The backend rejected the request for ${context} (HTTP ${error.status})${error.detail ? `: ${error.detail}` : "."}`;
  }
  return `${context} could not be loaded: ${(error && error.message) || "unknown error"}.`;
};

const spRequest = async (url, options = {}) => {
  let response;
  try {
    response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (cause) {
    const error = new Error("The backend could not be reached.");
    error.kind = "network";
    error.cause = cause;
    throw error;
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = new Error(payload?.message || response.statusText || "Request failed");
    error.kind = "http";
    error.status = response.status;
    error.detail = payload?.message || null;
    throw error;
  }
  return payload;
};

function SupplyPaymentManagementPage({ onNew, onAudit }) {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const [selectedMethod, setSelectedMethod] = useState("Supply Payment");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [filterDate, setFilterDate] = useState("All Dates");
  const [selectedId, setSelectedId] = useState(null);

  const [editing, setEditing] = useState(null);
  const [paying, setPaying] = useState(null);
  const [menuFor, setMenuFor] = useState(null);
  // Which peso figures the user has chosen to reveal, keyed per record+field.
  const [revealedAmounts, setRevealedAmounts] = useState({});

  const toggleAmount = (key) =>
    setRevealedAmounts(prev => ({ ...prev, [key]: !prev[key] }));

  // The whole tab is fetched in one request and the narrower filters are applied
  // here. The cards describe the full tab while the table shows a subset, so a
  // search never silently changes what the summary cards claim.
  const load = async (method) => {
    setLoading(true);
    setLoadError("");
    try {
      const query = method ? `?method=${encodeURIComponent(method)}` : "";
      const payload = await spRequest(`${API_BASE}/api/supplier-payments${query}`);
      setRecords(Array.isArray(payload?.data) ? payload.data : []);
      setSummary(payload?.filtered_summary || payload?.summary || null);
    } catch (error) {
      // An empty table is only correct when the API actually said "no records".
      // On a failure the list is cleared so no stale rows stay on screen being
      // presented as current.
      setRecords([]);
      setSummary(null);
      setLoadError(spFailureMessage(error, "supplier payments"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(selectedMethod); }, [selectedMethod]);

  const methodRecords = useMemo(
    () => records.filter((row) => row.payment_method === selectedMethod),
    [records, selectedMethod]
  );

  // Cards are recomputed from the rows actually on screen. The backend sends a
  // summary too, but deriving here keeps the cards honest if a filter is active.
  const cardTotals = useMemo(() => {
    const sum = (list) => list.reduce((total, row) => total + Number(row.amount || 0), 0);
    const pendingApproval = methodRecords.filter((row) => ["Pending", "For Approval"].includes(row.status));
    const paid = methodRecords.filter((row) => row.status === "Paid");
    const overdue = methodRecords.filter((row) => row.status === "Overdue");
    return {
      total: { amount: sum(methodRecords), count: methodRecords.length },
      pending: { amount: sum(pendingApproval), count: pendingApproval.length },
      paid: { amount: sum(paid), count: paid.length },
      overdue: { amount: sum(overdue), count: overdue.length },
    };
  }, [methodRecords]);

  const filteredRecords = useMemo(() => {
    const today = spTodayYmd();
    const phrase = search.trim().toLowerCase();
    return methodRecords.filter((row) => {
      if (filterStatus !== "All Status" && row.status !== filterStatus) return false;
      if (filterDate === "This Month") {
        const due = row.due_date || "";
        if (!due.startsWith(today.slice(0, 7))) return false;
      }
      if (filterDate === "Overdue Only" && row.status !== "Overdue") return false;
      if (!phrase) return true;
      return [row.payment_id, row.supplier, row.supplier_id, row.po_number, row.invoice_number, row.reference_number]
        .some((value) => String(value || "").toLowerCase().includes(phrase));
    });
  }, [methodRecords, search, filterStatus, filterDate]);

  const selectedRecord = useMemo(
    () => methodRecords.find((row) => row.id === selectedId) || filteredRecords[0] || null,
    [methodRecords, filteredRecords, selectedId]
  );

  // Any mutation re-reads afterwards. Without this the cards would keep showing
  // the pre-edit figures while the table row had already changed.
  const runAction = async (label, action) => {
    setSaving(true);
    try {
      const result = await action();
      setLoadError("");
      if (result?.message) onAudit?.(result.message);
      await load(selectedMethod);
      return result;
    } catch (error) {
      setLoadError(spFailureMessage(error, label));
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Buttons 3 and 4 are only meaningful on a record that still owes money. A
  // Paid or Cancelled row has nothing left to approve or pay, so instead of a
  // dead greyed button that looks broken, these explain the reason on click.
  // Returns true when the action actually ran.
  const explainBlocked = (row, action) => {
    if (action === "approve") {
      window.alert(
        row.status === "Paid"
          ? `${row.payment_id} is already paid in full. There is nothing left to approve.`
          : `${row.payment_id} was cancelled. Approve is not available on a cancelled record.`
      );
      return true;
    }
    window.alert(
      Number(row.remaining_balance) <= 0
        ? `${row.payment_id} has no remaining balance to pay.`
        : `${row.payment_id} is ${row.status.toLowerCase()}. Only an open record can take a payment.`
    );
    return true;
  };

  const approveRecord = async (row) => {
    if (["Paid", "Cancelled"].includes(row.status)) return explainBlocked(row, "approve");
    const result = await runAction(`approving ${row.payment_id}`, () =>
      spRequest(`${API_BASE}/api/supplier-payments/${row.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "Approved", approved_by: "Admin User" }),
      })
    );
    if (result) {
      // Overdue is derived from the due date, so an approved-but-past-due record
      // still reads "Overdue". Saying so prevents "I clicked Approve and nothing
      // changed" even though the write succeeded.
      window.alert(
        row.is_overdue
          ? `${row.payment_id} was approved. It still shows as Overdue because its due date has passed and ${spMoney(row.remaining_balance)} remains outstanding.`
          : `${row.payment_id} moved to Approved.`
      );
    }
  };

  const openPaymentDialog = (row) => {
    if (!row.can_record_payment) return explainBlocked(row, "pay");
    setPaying({ ...row, paid_amount: row.remaining_balance, payment_date: spTodayYmd() });
  };

  const cancelRecord = async (row) => {
    const result = await runAction(`cancelling ${row.payment_id}`, () =>
      spRequest(`${API_BASE}/api/supplier-payments/${row.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "Cancelled" }),
      })
    );
    if (result) window.alert(`${row.payment_id} was cancelled.`);
  };

  const deleteRecord = async (row) => {
    if (!window.confirm(`Delete ${row.payment_id}? This cannot be undone.`)) return;
    const result = await runAction(`deleting ${row.payment_id}`, () =>
      spRequest(`${API_BASE}/api/supplier-payments/${row.id}`, { method: "DELETE" })
    );
    if (result) {
      setSelectedId(null);
      window.alert(`${row.payment_id} deleted.`);
    }
  };

  const printRecord = (row) => {
    const w = window.open("", "_blank");
    if (!w) {
      window.alert("The print window was blocked. Allow pop-ups for this site and try again.");
      return;
    }
    w.document.write(`<html><head><title>${row.payment_id}</title></head><body style="font-family:Arial;padding:40px">
      <h1>PRIMEPOWER - Supplier Payment</h1><hr/>
      <p><b>Payment ID:</b> ${row.payment_id}</p>
      <p><b>Supplier:</b> ${spBlank(row.supplier)}</p>
      <p><b>PO No.:</b> ${spBlank(row.po_number)}</p>
      <p><b>Invoice:</b> ${spBlank(row.invoice_number)}</p>
      <p><b>Description:</b> ${spBlank(row.supply_description)}</p>
      <p><b>Amount:</b> ${spMoney(row.amount)}</p>
      <p><b>Paid:</b> ${spMoney(row.paid_amount)}</p>
      <p><b>Remaining:</b> ${spMoney(row.remaining_balance)}</p>
      <p><b>Due Date:</b> ${spDate(row.due_date)}</p>
      <p><b>Payment Date:</b> ${spDate(row.payment_date)}</p>
      <p><b>Status:</b> ${row.status}</p>
      <p><b>Method:</b> ${row.payment_method}</p>
      <p><b>Reference:</b> ${spBlank(row.reference_number)}</p>
      <p><b>Prepared By:</b> ${spBlank(row.prepared_by)}</p>
      <p><b>Approved By:</b> ${spBlank(row.approved_by)}</p>
      <script>window.print()</script></body></html>`);
    w.document.close();
  };

  return <section className="management-page vendor-payment-page">
    <Breadcrumb current="Supplier Payment Management" parent="Accounts Payable" />
    <div className="management-header">
      <div><h2>SUPPLY PAYMENT MANAGEMENT</h2><p>Monitor purchase orders, invoices, approval workflow, payment amounts, and payment history for supply purchases.</p></div>
      <div className="management-actions">
        <button className="primary-button" onClick={onNew} disabled={saving}>＋ New Supply Payment</button>
      </div>
    </div>

    <div className="payment-methods">
      <span className="payment-method-label">Payment Method</span>
      {SP_METHODS.map(method => (
        <button
          key={method}
          className={`payment-method ${selectedMethod === method ? "selected" : ""}`}
          onClick={() => { setSelectedMethod(method); setSelectedId(null); }}
        >{method}</button>
      ))}
    </div>

    <div className="vendor-toolbar">
      <div className="search-box vendor-search"><span>⌕</span><input placeholder="Search supplier, PO, invoice..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="vendor-toolbar-controls">
        <select className="vendor-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          {SP_STATUS_OPTIONS.map(option => <option key={option}>{option}</option>)}
        </select>
        <select className="vendor-select" value={filterDate} onChange={e => setFilterDate(e.target.value)}>
          <option>All Dates</option>
          <option>This Month</option>
          <option>Overdue Only</option>
        </select>
      </div>
    </div>

    {/* Real failure text, not a guess. The old page showed "no records" for a
        stopped backend, which is indistinguishable from an empty ledger. */}
    {loadError && <div className="cfu-error" role="alert">{loadError}</div>}

    <div className="vendor-summary-grid">
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Total Supplies</span>
        <SpCardAmount id="sp-card-total" value={cardTotals.total.amount} revealed={revealedAmounts} onToggle={toggleAmount} className="total-supplies-amount" />
        <span className="vendor-summary-count">{cardTotals.total.count} record{cardTotals.total.count === 1 ? "" : "s"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Pending</span>
        <SpCardAmount id="sp-card-pending" value={cardTotals.pending.amount} revealed={revealedAmounts} onToggle={toggleAmount} className="pending-amount" />
        <span className="vendor-summary-count">{cardTotals.pending.count} record{cardTotals.pending.count === 1 ? "" : "s"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Paid</span>
        <SpCardAmount id="sp-card-paid" value={cardTotals.paid.amount} revealed={revealedAmounts} onToggle={toggleAmount} className="paid-amount" />
        <span className="vendor-summary-count">{cardTotals.paid.count} record{cardTotals.paid.count === 1 ? "" : "s"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Overdue</span>
        <SpCardAmount id="sp-card-overdue" value={cardTotals.overdue.amount} revealed={revealedAmounts} onToggle={toggleAmount} className="overdue-amount" />
        <span className="vendor-summary-count">{cardTotals.overdue.count} record{cardTotals.overdue.count === 1 ? "" : "s"}</span>
      </div>
    </div>

    <section className="vendor-record-panel">
      <div className="vendor-record-heading">
        <h3>Supply Payments</h3>
        <span className="vendor-summary-count">{filteredRecords.length} of {methodRecords.length} shown</span>
      </div>
      <div className="table-card vendor-table-card">
        <table>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Supplier</th>
              <th>PO No.</th>
              <th>Invoice</th>
              <th className="money-cell">Amount</th>
              <th>Due Date</th>
              <th>Payment Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="9" className="empty">Loading supplier payments...</td></tr>}
            {!loading && filteredRecords.length === 0 && (
              <tr>
                <td colSpan="9" className="empty">
                  {methodRecords.length === 0
                    ? `No ${selectedMethod.toLowerCase()} records yet. Click "New Supply Payment" to add one.`
                    : "No records match the current search and filters."}
                </td>
              </tr>
            )}
            {!loading && filteredRecords.map(r => <tr key={r.id} onClick={() => setSelectedId(r.id)} className={selectedRecord?.id === r.id ? "selected-row" : ""}>
              <td className="link-cell">{r.payment_id}</td>
              <td className="strong-cell">{spBlank(r.supplier)}</td>
              <td>{spBlank(r.po_number)}</td>
              <td>{spBlank(r.invoice_number)}</td>
              <PayableAmountCell rowId={`${r.id}-row`} value={r.amount} revealed={revealedAmounts} onToggle={toggleAmount} format={spMoney} />
              <td>{spDate(r.due_date)}</td>
              <td>{r.payment_date ? spDate(r.payment_date) : "—"}</td>
              <td><span className={`contract-status ${spStatusSlug(r.status)}`}>{r.status}</span></td>
              <td onClick={e => e.stopPropagation()}>
                <div className="row-actions">
                  <button type="button" title="View details" aria-label={`View ${r.payment_id}`} onClick={() => setSelectedId(r.id)}><Eye size={15}/></button>
                  <button type="button" title="Edit" aria-label={`Edit ${r.payment_id}`} onClick={() => setEditing({ ...r })}><Edit3 size={15}/></button>
                  <button
                    type="button"
                    title={["Paid", "Cancelled"].includes(r.status)
                      ? `${r.payment_id} is ${r.status.toLowerCase()} — nothing to approve`
                      : "Approve"}
                    aria-label={`Approve ${r.payment_id}`}
                    className={["Paid", "Cancelled"].includes(r.status) ? "sp-blocked" : ""}
                    disabled={saving}
                    onClick={() => approveRecord(r)}
                  ><CheckCircle2 size={15}/></button>
                  <button
                    type="button"
                    title={r.can_record_payment ? "Record Payment" : "Nothing left to pay"}
                    aria-label={`Record payment for ${r.payment_id}`}
                    className={!r.can_record_payment ? "sp-blocked" : ""}
                    disabled={saving}
                    onClick={() => openPaymentDialog(r)}
                  ><HandCoins size={15}/></button>
                  <button type="button" title="Print" aria-label={`Print ${r.payment_id}`} onClick={() => printRecord(r)}><Printer size={15}/></button>
                  <div className="sp-more">
                    <button
                      type="button"
                      title="More actions"
                      aria-label={`More actions for ${r.payment_id}`}
                      aria-expanded={menuFor === r.id}
                      onClick={() => setMenuFor(menuFor === r.id ? null : r.id)}
                    ><MoreHorizontal size={15}/></button>
                    {menuFor === r.id && (
                      <div className="sp-more-menu">
                        <button type="button" onClick={() => { setMenuFor(null); setEditing({ ...r }); }}>Edit</button>
                        <button type="button" disabled={saving || ["Paid", "Cancelled"].includes(r.status)} onClick={() => { setMenuFor(null); cancelRecord(r); }}>Cancel</button>
                        <button type="button" className="danger" disabled={saving} onClick={() => { setMenuFor(null); deleteRecord(r); }}>Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </section>

    {selectedRecord && (
      <section className="vendor-detail-panel">
        <div className="vendor-detail-header">
          <div>
            <span className="vendor-detail-kicker">{selectedMethod} / Record</span>
            <h3>{selectedRecord.payment_id}</h3>
          </div>
          {/* The status badge and the Reveal button are grouped so `space-between`
              keeps the badge next to the button instead of stranding it mid-row. */}
          <div className="sp-detail-actions">
            <span className={`contract-status ${spStatusSlug(selectedRecord.status)}`}>{selectedRecord.status}</span>
            {/* Checking a payment against its invoice would otherwise take three
                separate clicks; this toggles all three at once. */}
            <button
              type="button"
              className="light-button sp-reveal-all"
              onClick={() => {
                const keys = ["amount", "paid", "remaining"].map(f => `${selectedRecord.id}-${f}`);
                const allOpen = keys.every(k => revealedAmounts[k]);
                setRevealedAmounts(prev => {
                  const next = { ...prev };
                  keys.forEach(k => { next[k] = !allOpen; });
                  return next;
                });
              }}
            >
              {["amount", "paid", "remaining"].every(f => revealedAmounts[`${selectedRecord.id}-${f}`])
                ? "Hide Amounts"
                : "Reveal Amounts"}
            </button>
          </div>
        </div>
        <div className="vendor-detail-grid">
          <div className="vendor-detail-block">
            <h4>Supply Information</h4>
            <div className="vendor-detail-list">
              <div><span>Payment ID</span><b>{selectedRecord.payment_id}</b></div>
              <div><span>Supplier</span><b>{spBlank(selectedRecord.supplier)}</b></div>
              <div><span>Supplier ID</span><b>{spBlank(selectedRecord.supplier_id)}</b></div>
              <div><span>PO Number</span><b>{spBlank(selectedRecord.po_number)}</b></div>
              <div><span>Invoice</span><b>{spBlank(selectedRecord.invoice_number)}</b></div>
              <div><span>Description</span><b>{spBlank(selectedRecord.supply_description)}</b></div>
              <div><span>Invoice Date</span><b>{spDate(selectedRecord.invoice_date)}</b></div>
              <div><span>Due Date</span><b>{spDate(selectedRecord.due_date)}</b></div>
              <div><span>Amount</span><b><SpMaskedAmount id={`${selectedRecord.id}-amount`} value={selectedRecord.amount} revealed={revealedAmounts} onToggle={toggleAmount} /></b></div>
              <div><span>Paid Amount</span><b><SpMaskedAmount id={`${selectedRecord.id}-paid`} value={selectedRecord.paid_amount} revealed={revealedAmounts} onToggle={toggleAmount} /></b></div>
              <div><span>Remaining Balance</span><b><SpMaskedAmount id={`${selectedRecord.id}-remaining`} value={selectedRecord.remaining_balance} revealed={revealedAmounts} onToggle={toggleAmount} /></b></div>
            </div>
          </div>
          <div className="vendor-detail-block">
            <h4>Payment Method</h4>
            <div className="vendor-detail-list">
              <div><span>Method</span><b>{selectedRecord.payment_method}</b></div>
              <div><span>Approval Stage</span><b>{selectedRecord.status}</b></div>
              <div><span>Payment Date</span><b>{selectedRecord.payment_date ? spDate(selectedRecord.payment_date) : "—"}</b></div>
              <div><span>AP Account</span><b>{spBlank(selectedRecord.ap_account)}</b></div>
              <div><span>Bank / Cash Account</span><b>{spBlank(selectedRecord.bank_account)}</b></div>
              <div><span>Reference Number</span><b>{spBlank(selectedRecord.reference_number)}</b></div>
              <div><span>Prepared By</span><b>{spBlank(selectedRecord.prepared_by)}</b></div>
              <div><span>Approved By</span><b>{spBlank(selectedRecord.approved_by)}</b></div>
              <div><span>Payment Remarks</span><b>{spBlank(selectedRecord.payment_remarks)}</b></div>
            </div>
          </div>
        </div>
      </section>
    )}

    {/* Edit dialog — PUT /api/supplier-payments/:id */}
    {editing && (
      <SupplierPaymentForm
        record={editing}
        saving={saving}
        onClose={() => setEditing(null)}
        onSubmit={async (payload) => {
          const result = await runAction(`updating ${editing.payment_id}`, () =>
            spRequest(`${API_BASE}/api/supplier-payments/${editing.id}`, {
              method: "PUT",
              body: JSON.stringify(payload),
            })
          );
          if (result) { setEditing(null); window.alert(result.message); }
        }}
      />
    )}

    {/* Record Payment dialog — PUT /api/supplier-payments/:id/payment. The
        backend recomputes the status; this form only states how much was paid
        and when, so the Paid/Overdue cards cannot be edited by hand. */}
    {paying && (
      <div className="modal-overlay" onClick={() => !saving && setPaying(null)}>
        <form
          className="modal"
          onClick={e => e.stopPropagation()}
          onSubmit={async e => {
            e.preventDefault();
            const result = await runAction(`recording a payment for ${paying.payment_id}`, () =>
              spRequest(`${API_BASE}/api/supplier-payments/${paying.id}/payment`, {
                method: "PUT",
                body: JSON.stringify({
                  paid_amount: Number(e.target.paid_amount.value),
                  payment_date: e.target.payment_date.value,
                  bank_account: e.target.bank_account.value,
                  reference_number: e.target.reference_number.value,
                  payment_remarks: e.target.payment_remarks.value,
                }),
              })
            );
            if (result) { setPaying(null); window.alert(result.message); }
          }}
        >
          <div className="modal-header">
            <div>
              <h2>Record Payment — {paying.payment_id}</h2>
              <p>Outstanding balance: {spMoney(paying.remaining_balance)} of {spMoney(paying.amount)}</p>
            </div>
            <button type="button" onClick={() => setPaying(null)} disabled={saving}><X size={20}/></button>
          </div>
          <div className="form-grid">
            <label>Amount Paid
              <input
                name="paid_amount"
                type="number"
                min="0.01"
                max={paying.remaining_balance}
                step="0.01"
                defaultValue={paying.remaining_balance}
                required
              />
            </label>
            <label>Payment Date
              <input name="payment_date" type="date" defaultValue={paying.payment_date} required />
            </label>
            <label>Bank / Cash Account
              <input name="bank_account" type="text" defaultValue={paying.bank_account === "—" ? "" : paying.bank_account} placeholder="e.g. BDO-88230" />
            </label>
            <label>Reference Number
              <input name="reference_number" type="text" defaultValue={paying.reference_number === "—" ? "" : paying.reference_number} placeholder="e.g. CHK-20441" />
            </label>
            <label className="full">Payment Remarks
              <textarea name="payment_remarks" rows="2" defaultValue={paying.payment_remarks} />
            </label>
          </div>
          <div className="modal-footer">
            <button type="button" className="light-button" onClick={() => setPaying(null)} disabled={saving}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : "Record Payment"}</button>
          </div>
        </form>
      </div>
    )}
  </section>;
}

// A card's peso total stays hidden as "*" until that card is clicked. Each card
// has its own reveal key, so revealing Total Supplies never exposes Paid or
// Overdue as a side effect.
//
// Mirrors UpCardAmount (Utility Payment) so both payable modules behave the same.
const SpCardAmount = ({ id, value, revealed, onToggle, className = "" }) => {
  const isOpen = Boolean(revealed[id]);
  return (
    <strong
      className={`vendor-summary-amount payable-card-amount ${isOpen ? "is-open" : ""} ${className}`.trim()}
      role="button"
      tabIndex={0}
      aria-label={isOpen ? `Hide total, currently ${spMoney(value)}` : "Reveal total"}
      title={isOpen ? "Click to hide amount" : "Click to reveal amount"}
      onClick={event => {
        event.stopPropagation();
        onToggle(id);
      }}
      onKeyDown={event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle(id);
        }
      }}
    >
      {isOpen ? spMoney(value) : "*"}
    </strong>
  );
};

// A peso figure in the table's Amount column starts as "*" and reveals when its
// own cell is clicked. The row id is part of the key, so revealing one row's
// amount never exposes the amounts in any other row.
//
// Reuses the .money-cell.masked-amount styling that already exists in index.css
// for the other payable tables, so the alignment matches the plain money cells.
const PayableAmountCell = ({ rowId, value, revealed, onToggle, format }) => {
  const isOpen = Boolean(revealed[rowId]);
  return (
    <td
      className={`money-cell masked-amount${isOpen ? " is-open" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={isOpen ? `Hide amount, currently ${format(value)}` : "Reveal amount"}
      title={isOpen ? "Click to hide amount" : "Click to reveal amount"}
      onClick={event => {
        // The row itself is clickable (it selects the record), so the reveal
        // click must not also trigger selection.
        event.stopPropagation();
        onToggle(rowId);
      }}
      onKeyDown={event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          onToggle(rowId);
        }
      }}
    >
      {isOpen ? format(value) : "*"}
    </td>
  );
};

// Edit form for an existing supplier payment. Kept as its own component so the
// page body stays readable; it holds no state beyond the field values because
// every field is server-validated on save.
// Utility Payment Management (Accounts Payable) reads recurring utility bills from
// the same Node backend as the other modules (GET /api/utility-payments). Nothing
// here is typed in: the cards, table and detail panel all derive from the records
// the API returns, so a card can never disagree with a row.

const upTodayYmd = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const upMoney = (value) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const upDate = (ymd) => {
  if (!ymd) return "—";
  const date = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const upStatusSlug = (status) =>
  String(status || "unknown").toLowerCase().trim().replace(/\s+/g, "-");

const upBlank = (value) => (value === null || value === undefined || value === "" ? "—" : value);

const UP_STATUS_OPTIONS = ["All Status", "Pending", "For Approval", "Approved", "Scheduled", "Paid", "Overdue", "Cancelled"];
const UP_TYPES = ["All", "Electricity", "Water", "Internet", "Other"];

// A card's peso total stays hidden as "*" until that card is clicked. Each card
// has its own reveal key, so revealing Total Utilities never exposes Paid or
// Overdue as a side effect.
const UpCardAmount = ({ id, value, revealed, onToggle, className = "" }) => {
  const isOpen = Boolean(revealed[id]);
  return (
    <strong
      className={`vendor-summary-amount payable-card-amount ${isOpen ? "is-open" : ""} ${className}`.trim()}
      role="button"
      tabIndex={0}
      aria-label={isOpen ? `Hide total, currently ${upMoney(value)}` : "Reveal total"}
      title={isOpen ? "Click to hide amount" : "Click to reveal amount"}
      onClick={event => {
        event.stopPropagation();
        onToggle(id);
      }}
      onKeyDown={event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle(id);
        }
      }}
    >
      {isOpen ? upMoney(value) : "*"}
    </strong>
  );
};

// A failed request has to say what actually failed, rather than showing an empty
// table that is indistinguishable from "no bills yet".
const upFailureMessage = (error, context) => {
  if (error && error.kind === "network") {
    return `The backend did not answer while loading ${context}. Start it with "npm start" in the Backend folder, then try again.`;
  }
  if (error && error.kind === "http") {
    return `The backend rejected the request for ${context} (HTTP ${error.status})${error.detail ? `: ${error.detail}` : "."}`;
  }
  return `${context} could not be loaded: ${(error && error.message) || "unknown error"}.`;
};

const upRequest = async (url, options = {}) => {
  let response;
  try {
    response = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  } catch (cause) {
    const error = new Error("The backend could not be reached.");
    error.kind = "network";
    error.cause = cause;
    throw error;
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = new Error(payload?.message || response.statusText || "Request failed");
    error.kind = "http";
    error.status = response.status;
    error.detail = payload?.message || null;
    throw error;
  }
  return payload;
};

function UtilityPaymentManagementPage({ onNew, onAudit }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const [selectedType, setSelectedType] = useState("All");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const [editing, setEditing] = useState(null);
  const [paying, setPaying] = useState(null);
  const [menuFor, setMenuFor] = useState(null);
  const [revealedAmounts, setRevealedAmounts] = useState({});

  const toggleAmount = (key) =>
    setRevealedAmounts(prev => ({ ...prev, [key]: !prev[key] }));

  // The full set is fetched once and the narrower filters are applied here, so a
  // search never silently changes what the summary cards claim.
  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const payload = await spRequest(`${API_BASE}/api/utility-payments`);
      setRecords(Array.isArray(payload?.data) ? payload.data : []);
    } catch (error) {
      setRecords([]);
      setLoadError(upFailureMessage(error, "utility payments"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const typeRecords = useMemo(
    () => (selectedType === "All" ? records : records.filter(r => r.utility_type === selectedType)),
    [records, selectedType]
  );

  // Cards are computed from the rows actually on screen, so a card can never
  // contradict the table above the user's filters.
  const cardTotals = useMemo(() => {
    const sum = (list) => list.reduce((total, row) => total + Number(row.amount || 0), 0);
    const pending = typeRecords.filter(r => ["Pending", "For Approval"].includes(r.status));
    const paid = typeRecords.filter(r => r.status === "Paid");
    const overdue = typeRecords.filter(r => r.status === "Overdue");
    return {
      total: { amount: sum(typeRecords), count: typeRecords.length },
      pending: { amount: sum(pending), count: pending.length },
      paid: { amount: sum(paid), count: paid.length },
      overdue: { amount: sum(overdue), count: overdue.length },
    };
  }, [typeRecords]);

  const filteredRecords = useMemo(() => {
    const phrase = search.trim().toLowerCase();
    return typeRecords.filter(row => {
      if (filterStatus !== "All Status" && row.status !== filterStatus) return false;
      // The date range spans due_date -> payment_date, so a payment made inside
      // the range on a bill due outside it is still found.
      const dates = [row.due_date, row.payment_date, row.invoice_date].filter(Boolean);
      if (dateFrom && !dates.some(d => d >= dateFrom)) return false;
      if (dateTo && !dates.some(d => d <= dateTo)) return false;
      if (!phrase) return true;
      return [row.payment_id, row.provider, row.provider_id, row.account_number, row.meter_number, row.invoice_number, row.reference_number, row.description]
        .some(v => String(v || "").toLowerCase().includes(phrase));
    });
  }, [typeRecords, search, filterStatus, dateFrom, dateTo]);

  const selectedRecord = useMemo(
    () => typeRecords.find(r => r.id === selectedId) || filteredRecords[0] || null,
    [typeRecords, filteredRecords, selectedId]
  );

  // A blocked action explains itself rather than being a dead greyed button, which
  // is indistinguishable from a broken one.
  const explainBlocked = (row, action) => {
    if (action === "approve") {
      window.alert(
        row.status === "Paid"
          ? `${row.payment_id} is already paid in full. There is nothing left to approve.`
          : `${row.payment_id} was cancelled. Approve is not available on a cancelled record.`
      );
      return;
    }
    window.alert(
      Number(row.remaining_balance) <= 0
        ? `${row.payment_id} has no remaining balance to pay.`
        : `${row.payment_id} is ${row.status.toLowerCase()}. Only an open bill can take a payment.`
    );
  };

  // Any mutation re-reads afterwards, otherwise the cards would keep showing the
  // pre-edit figures while the table row had already changed.
  const runAction = async (label, action) => {
    setSaving(true);
    try {
      const result = await action();
      setLoadError("");
      if (result?.message) onAudit?.(result.message);
      await load();
      return result;
    } catch (error) {
      setLoadError(upFailureMessage(error, label));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const approveRecord = async (row) => {
    if (["Paid", "Cancelled"].includes(row.status)) return explainBlocked(row, "approve");
    const result = await runAction(`approving ${row.payment_id}`, () =>
      spRequest(`${API_BASE}/api/utility-payments/${row.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "Approved", approved_by: "Admin User" }),
      })
    );
    if (result) {
      // Overdue is derived from the due date, so an approved-but-past-due bill
      // still reads "Overdue". Saying so prevents "I clicked Approve and nothing
      // changed" even though the write succeeded.
      window.alert(
        row.is_overdue
          ? `${row.payment_id} was approved. It still shows as Overdue because its due date has passed and ${upMoney(row.remaining_balance)} remains outstanding.`
          : `${row.payment_id} moved to Approved.`
      );
    }
  };

  const cancelRecord = async (row) => {
    const result = await runAction(`cancelling ${row.payment_id}`, () =>
      spRequest(`${API_BASE}/api/utility-payments/${row.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "Cancelled" }),
      })
    );
    if (result) window.alert(`${row.payment_id} was cancelled.`);
  };

  const deleteRecord = async (row) => {
    if (!window.confirm(`Delete ${row.payment_id}? This cannot be undone.`)) return;
    const result = await runAction(`deleting ${row.payment_id}`, () =>
      spRequest(`${API_BASE}/api/utility-payments/${row.id}`, { method: "DELETE" })
    );
    if (result) {
      setSelectedId(null);
      window.alert(`${row.payment_id} deleted.`);
    }
  };

  const openPaymentDialog = (row) => {
    if (!row.can_record_payment) return explainBlocked(row, "pay");
    setPaying({ ...row, paid_amount: row.remaining_balance, payment_date: upTodayYmd() });
  };

  const printRecord = (row) => {
    const w = window.open("", "_blank");
    if (!w) {
      window.alert("The print window was blocked. Allow pop-ups for this site and try again.");
      return;
    }
    w.document.write(`<html><head><title>${row.payment_id}</title></head><body style="font-family:Arial;padding:40px">
      <h1>PRIMEPOWER - Utility Payment</h1><hr/>
      <p><b>Payment ID:</b> ${row.payment_id}</p>
      <p><b>Provider:</b> ${upBlank(row.provider)}</p>
      <p><b>Utility Type:</b> ${upBlank(row.utility_type)}</p>
      <p><b>Account Number:</b> ${upBlank(row.account_number)}</p>
      <p><b>Meter Number:</b> ${upBlank(row.meter_number)}</p>
      <p><b>Description:</b> ${upBlank(row.description)}</p>
      <p><b>Billing Period:</b> ${upBlank(row.billing_period)}</p>
      <p><b>Invoice:</b> ${upBlank(row.invoice_number)}</p>
      <p><b>Amount:</b> ${upMoney(row.amount)}</p>
      <p><b>Paid:</b> ${upMoney(row.paid_amount)}</p>
      <p><b>Remaining:</b> ${upMoney(row.remaining_balance)}</p>
      <p><b>Due Date:</b> ${upDate(row.due_date)}</p>
      <p><b>Payment Date:</b> ${upDate(row.payment_date)}</p>
      <p><b>Status:</b> ${row.status}</p>
      <p><b>Bank Account:</b> ${upBlank(row.bank_account)}</p>
      <p><b>Reference:</b> ${upBlank(row.reference_number)}</p>
      <p><b>Prepared By:</b> ${upBlank(row.prepared_by)}</p>
      <p><b>Approved By:</b> ${upBlank(row.approved_by)}</p>
      <p><b>Remarks:</b> ${upBlank(row.payment_remarks)}</p>
      <script>window.print()</script></body></html>`);
    w.document.close();
  };

  return <section className="management-page vendor-payment-page">
    <Breadcrumb current="Utility Payment Management" parent="Accounts Payable" />
    <div className="management-header">
      <div><h2>UTILITY PAYMENT MANAGEMENT</h2><p>Track electricity, water, internet and other utility bills from provider statement through approval to payment.</p></div>
      <div className="management-actions">
        <button className="light-button" onClick={() => window.print()} disabled={saving}><Printer size={15}/> Print / Save PDF</button>
        <button className="primary-button" onClick={onNew} disabled={saving}>＋ New Utility Payment</button>
      </div>
    </div>

    <div className="payment-methods">
      <span className="payment-method-label">Payment Type</span>
      {UP_TYPES.map(type => (
        <button
          key={type}
          className={`payment-method ${selectedType === type ? "selected" : ""}`}
          onClick={() => { setSelectedType(type); setSelectedId(null); }}
        >{type}</button>
      ))}
    </div>

    <div className="vendor-toolbar">
      <div className="search-box vendor-search"><span>⌕</span><input placeholder="Search provider, account, reference, invoice..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="vendor-toolbar-controls">
        <select className="vendor-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          {UP_STATUS_OPTIONS.map(option => <option key={option}>{option}</option>)}
        </select>
        <input className="vendor-select up-date" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} aria-label="Date range from" title="From date" />
        <input className="vendor-select up-date" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} aria-label="Date range to" title="To date" />
        {(dateFrom || dateTo) && <button className="light-button" onClick={() => { setDateFrom(""); setDateTo(""); }}>Clear</button>}
      </div>
    </div>

    {/* Real failure text, not a guess. An empty table is only correct when the
        API actually said "no records". */}
    {loadError && <div className="cfu-error" role="alert">{loadError}</div>}

    <div className="vendor-summary-grid">
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Total Utilities</span>
        <UpCardAmount id="card-total" value={cardTotals.total.amount} revealed={revealedAmounts} onToggle={toggleAmount} className="total-supplies-amount" />
        <span className="vendor-summary-count">{cardTotals.total.count} record{cardTotals.total.count === 1 ? "" : "s"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Pending</span>
        <UpCardAmount id="card-pending" value={cardTotals.pending.amount} revealed={revealedAmounts} onToggle={toggleAmount} className="pending-amount" />
        <span className="vendor-summary-count">{cardTotals.pending.count} record{cardTotals.pending.count === 1 ? "" : "s"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Paid</span>
        <UpCardAmount id="card-paid" value={cardTotals.paid.amount} revealed={revealedAmounts} onToggle={toggleAmount} className="paid-amount" />
        <span className="vendor-summary-count">{cardTotals.paid.count} record{cardTotals.paid.count === 1 ? "" : "s"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Overdue</span>
        <UpCardAmount id="card-overdue" value={cardTotals.overdue.amount} revealed={revealedAmounts} onToggle={toggleAmount} className="overdue-amount" />
        <span className="vendor-summary-count">{cardTotals.overdue.count} record{cardTotals.overdue.count === 1 ? "" : "s"}</span>
      </div>
    </div>

    <section className="vendor-record-panel">
      <div className="vendor-record-heading">
        <h3>Utility Payments</h3>
        <span className="vendor-summary-count">{filteredRecords.length} of {typeRecords.length} shown</span>
      </div>
      <div className="table-card vendor-table-card">
        <table>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Provider</th>
              <th>Utility Type</th>
              <th>Account Number</th>
              <th className="money-cell">Amount</th>
              <th>Due Date</th>
              <th>Payment Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="9" className="empty">Loading utility payments...</td></tr>}
            {!loading && filteredRecords.length === 0 && (
              <tr>
                <td colSpan="9" className="empty">
                  {typeRecords.length === 0
                    ? `No ${selectedType === "All" ? "" : selectedType.toLowerCase() + " "}utility records yet. Click "New Utility Payment" to add one.`
                    : "No records match the current search and filters."}
                </td>
              </tr>
            )}
            {!loading && filteredRecords.map(r => <tr key={r.id} onClick={() => setSelectedId(r.id)} className={selectedRecord?.id === r.id ? "selected-row" : ""}>
              <td className="link-cell">{r.payment_id}</td>
              <td className="strong-cell">{upBlank(r.provider)}</td>
              <td>{upBlank(r.utility_type)}</td>
              <td>{upBlank(r.account_number)}</td>
              <PayableAmountCell rowId={`${r.id}-row`} value={r.amount} revealed={revealedAmounts} onToggle={toggleAmount} format={upMoney} />
              <td>{upDate(r.due_date)}</td>
              <td>{r.payment_date ? upDate(r.payment_date) : "—"}</td>
              <td><span className={`contract-status ${upStatusSlug(r.status)}`}>{r.status}</span></td>
              <td onClick={e => e.stopPropagation()}>
                <div className="row-actions">
                  <button type="button" title="View details" aria-label={`View ${r.payment_id}`} onClick={() => setSelectedId(r.id)}><Eye size={15}/></button>
                  <button type="button" title="Edit" aria-label={`Edit ${r.payment_id}`} onClick={() => setEditing({ ...r })}><Edit3 size={15}/></button>
                  <button
                    type="button"
                    title={["Paid", "Cancelled"].includes(r.status) ? `${r.payment_id} is ${r.status.toLowerCase()} — nothing to approve` : "Approve"}
                    aria-label={`Approve ${r.payment_id}`}
                    className={["Paid", "Cancelled"].includes(r.status) ? "sp-blocked" : ""}
                    disabled={saving}
                    onClick={() => approveRecord(r)}
                  ><CheckCircle2 size={15}/></button>
                  <button
                    type="button"
                    title={r.can_record_payment ? "Record Payment" : "Nothing left to pay"}
                    aria-label={`Record payment for ${r.payment_id}`}
                    className={!r.can_record_payment ? "sp-blocked" : ""}
                    disabled={saving}
                    onClick={() => openPaymentDialog(r)}
                  ><HandCoins size={15}/></button>
                  <button type="button" title="Print" aria-label={`Print ${r.payment_id}`} onClick={() => printRecord(r)}><Printer size={15}/></button>
                  <div className="sp-more">
                    <button
                      type="button"
                      title="More actions"
                      aria-label={`More actions for ${r.payment_id}`}
                      aria-expanded={menuFor === r.id}
                      onClick={() => setMenuFor(menuFor === r.id ? null : r.id)}
                    ><MoreHorizontal size={15}/></button>
                    {menuFor === r.id && (
                      <div className="sp-more-menu">
                        <button type="button" onClick={() => { setMenuFor(null); setEditing({ ...r }); }}>Edit Payment</button>
                        <button type="button" disabled={saving || ["Paid", "Cancelled"].includes(r.status)} onClick={() => { setMenuFor(null); cancelRecord(r); }}>Cancel</button>
                        <button type="button" className="danger" disabled={saving} onClick={() => { setMenuFor(null); deleteRecord(r); }}>Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </section>

    {selectedRecord && (
      <section className="vendor-detail-panel">
        <div className="vendor-detail-header">
          <div>
            <span className="vendor-detail-kicker">Utility Payment / Record</span>
            <h3>{selectedRecord.payment_id}</h3>
          </div>
          <div className="sp-detail-actions">
            <span className={`contract-status ${upStatusSlug(selectedRecord.status)}`}>{selectedRecord.status}</span>
            <button
              type="button"
              className="light-button sp-reveal-all"
              onClick={() => {
                const keys = ["amount", "paid", "remaining"].map(f => `${selectedRecord.id}-${f}`);
                const allOpen = keys.every(k => revealedAmounts[k]);
                setRevealedAmounts(prev => {
                  const next = { ...prev };
                  keys.forEach(k => { next[k] = !allOpen; });
                  return next;
                });
              }}
            >
              {["amount", "paid", "remaining"].every(f => revealedAmounts[`${selectedRecord.id}-${f}`])
                ? "Hide Amounts"
                : "Reveal Amounts"}
            </button>
          </div>
        </div>
        <div className="vendor-detail-grid">
          <div className="vendor-detail-block">
            <h4>Payment Information</h4>
            <div className="vendor-detail-list">
              <div><span>Payment ID</span><b>{selectedRecord.payment_id}</b></div>
              <div><span>Utility Type</span><b>{upBlank(selectedRecord.utility_type)}</b></div>
              <div><span>Account Number</span><b>{upBlank(selectedRecord.account_number)}</b></div>
              <div><span>Meter Number</span><b>{upBlank(selectedRecord.meter_number)}</b></div>
              <div><span>Description</span><b>{upBlank(selectedRecord.description)}</b></div>
              <div><span>Billing Period</span><b>{upBlank(selectedRecord.billing_period)}</b></div>
              <div><span>Invoice</span><b>{upBlank(selectedRecord.invoice_number)}</b></div>
              <div><span>Invoice Date</span><b>{upDate(selectedRecord.invoice_date)}</b></div>
              <div><span>Due Date</span><b>{upDate(selectedRecord.due_date)}</b></div>
              <div><span>Amount</span><b><SpMaskedAmount id={`${selectedRecord.id}-amount`} value={selectedRecord.amount} revealed={revealedAmounts} onToggle={toggleAmount} /></b></div>
              <div><span>Paid Amount</span><b><SpMaskedAmount id={`${selectedRecord.id}-paid`} value={selectedRecord.paid_amount} revealed={revealedAmounts} onToggle={toggleAmount} /></b></div>
              <div><span>Remaining Balance</span><b><SpMaskedAmount id={`${selectedRecord.id}-remaining`} value={selectedRecord.remaining_balance} revealed={revealedAmounts} onToggle={toggleAmount} /></b></div>
            </div>
          </div>
          <div className="vendor-detail-block">
            <h4>Supplier Information</h4>
            <div className="vendor-detail-list">
              <div><span>Provider</span><b>{upBlank(selectedRecord.provider)}</b></div>
              <div><span>Provider ID</span><b>{upBlank(selectedRecord.provider_id)}</b></div>
              <div><span>AP Account</span><b>{upBlank(selectedRecord.ap_account)}</b></div>
              <div><span>Bank / Cash Account</span><b>{upBlank(selectedRecord.bank_account)}</b></div>
              <div><span>Reference Number</span><b>{upBlank(selectedRecord.reference_number)}</b></div>
            </div>
          </div>
          <div className="vendor-detail-block">
            <h4>Schedule &amp; History</h4>
            <div className="vendor-detail-list">
              <div><span>Approval Stage</span><b>{selectedRecord.status}</b></div>
              <div><span>Payment Date</span><b>{selectedRecord.payment_date ? upDate(selectedRecord.payment_date) : "—"}</b></div>
              <div><span>Days Overdue</span><b>{selectedRecord.days_overdue > 0 ? `${selectedRecord.days_overdue} day(s)` : "—"}</b></div>
              <div><span>Prepared By</span><b>{upBlank(selectedRecord.prepared_by)}</b></div>
              <div><span>Approved By</span><b>{upBlank(selectedRecord.approved_by)}</b></div>
              <div><span>Approved On</span><b>{selectedRecord.approved_at ? upDate(selectedRecord.approved_at) : "—"}</b></div>
              <div><span>Created</span><b>{selectedRecord.created_at ? upDate(String(selectedRecord.created_at).slice(0, 10)) : "—"}</b></div>
              <div><span>Last Updated</span><b>{selectedRecord.updated_at ? upDate(String(selectedRecord.updated_at).slice(0, 10)) : "—"}</b></div>
              <div><span>Remarks</span><b>{upBlank(selectedRecord.payment_remarks)}</b></div>
            </div>
          </div>
          <div className="vendor-detail-block">
            <h4>Documents</h4>
            <div className="vendor-detail-list">
              <div><span>Provider Statement</span><b>{upBlank(selectedRecord.supporting_document)}</b></div>
              <div><span>Invoice Number</span><b>{upBlank(selectedRecord.invoice_number)}</b></div>
              <div><span>Official Receipt</span><b>{selectedRecord.status === "Paid" ? upBlank(selectedRecord.reference_number) : "Not yet issued"}</b></div>
              <div><span>Print Record</span><b><button className="document-link" onClick={() => printRecord(selectedRecord)}>Open printable copy</button></b></div>
            </div>
          </div>
        </div>
      </section>
    )}

    {/* Record Payment dialog — PUT /api/utility-payments/:id/payment. The backend
        recomputes the status; this form only states how much was paid and when,
        so the Paid/Overdue cards cannot be edited by hand. */}
    {paying && (
      <div className="modal-overlay" onClick={() => !saving && setPaying(null)}>
        <form
          className="modal"
          onClick={e => e.stopPropagation()}
          onSubmit={async e => {
            e.preventDefault();
            const result = await runAction(`recording a payment for ${paying.payment_id}`, () =>
              spRequest(`${API_BASE}/api/utility-payments/${paying.id}/payment`, {
                method: "PUT",
                body: JSON.stringify({
                  paid_amount: Number(e.target.paid_amount.value),
                  payment_date: e.target.payment_date.value,
                  bank_account: e.target.bank_account.value,
                  reference_number: e.target.reference_number.value,
                  payment_remarks: e.target.payment_remarks.value,
                }),
              })
            );
            if (result) { setPaying(null); window.alert(result.message); }
          }}
        >
          <div className="modal-header">
            <div>
              <h2>Record Payment — {paying.payment_id}</h2>
              <p>{paying.provider} — outstanding {upMoney(paying.remaining_balance)} of {upMoney(paying.amount)}</p>
            </div>
            <button type="button" onClick={() => setPaying(null)} disabled={saving}><X size={20}/></button>
          </div>
          <div className="form-grid">
            <label>Amount Paid
              <input name="paid_amount" type="number" min="0.01" max={paying.remaining_balance} step="0.01" defaultValue={paying.remaining_balance} required />
            </label>
            <label>Payment Date
              <input name="payment_date" type="date" defaultValue={paying.payment_date} required />
            </label>
            <label>Bank / Cash Account
              <input name="bank_account" type="text" defaultValue={paying.bank_account === "—" ? "" : paying.bank_account} placeholder="e.g. BDO-91002" />
            </label>
            <label>Reference Number
              <input name="reference_number" type="text" defaultValue={paying.reference_number === "—" ? "" : paying.reference_number} placeholder="e.g. OR-61220" />
            </label>
            <label className="full">Payment Remarks
              <textarea name="payment_remarks" rows="2" defaultValue={paying.payment_remarks} />
            </label>
          </div>
          <div className="modal-footer">
            <button type="button" className="light-button" onClick={() => setPaying(null)} disabled={saving}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : "Record Payment"}</button>
          </div>
        </form>
      </div>
    )}

    {/* Edit dialog — PUT /api/utility-payments/:id */}
    {editing && (
      <UtilityPaymentForm
        record={editing}
        saving={saving}
        onClose={() => setEditing(null)}
        onSubmit={async (payload) => {
          const result = await runAction(`updating ${editing.payment_id}`, () =>
            spRequest(`${API_BASE}/api/utility-payments/${editing.id}`, {
              method: "PUT",
              body: JSON.stringify(payload),
            })
          );
          if (result) { setEditing(null); window.alert(result.message); }
        }}
      />
    )}
  </section>;
}

// Edit form for an existing utility bill. Paid is not offered here: money only
// moves through the Record Payment endpoint, so the two paths cannot disagree
// about what "settled" means.
function UtilityPaymentForm({ record, saving, onClose, onSubmit }) {
  const blank = (v) => (v === "—" ? "" : v || "");
  const [form, setForm] = useState({
    provider: blank(record.provider),
    provider_id: blank(record.provider_id),
    utility_type: record.utility_type || "Other",
    account_number: blank(record.account_number),
    meter_number: blank(record.meter_number),
    description: blank(record.description),
    billing_period: blank(record.billing_period),
    invoice_number: blank(record.invoice_number),
    invoice_date: record.invoice_date || "",
    due_date: record.due_date || "",
    amount: String(record.amount ?? 0),
    paid_amount: String(record.paid_amount ?? 0),
    status: record.stored_status || record.status,
    bank_account: blank(record.bank_account),
    reference_number: blank(record.reference_number),
    payment_remarks: record.payment_remarks || "",
  });

  const set = (key) => e => setForm(prev => ({ ...prev, [key]: e.target.value }));
  const statuses = ["Pending", "For Approval", "Approved", "Scheduled", "Cancelled"];

  return (
    <div className="modal-overlay" onClick={() => !saving && onClose()}>
      <form
        className="modal"
        onClick={e => e.stopPropagation()}
        onSubmit={e => {
          e.preventDefault();
          onSubmit({ ...form, amount: Number(form.amount), paid_amount: Number(form.paid_amount) });
        }}
      >
        <div className="modal-header">
          <div>
            <h2>Edit Utility Payment — {record.payment_id}</h2>
            <p>Update the bill. Changes are saved to the database.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
        </div>
        <div className="form-grid">
          <label>Provider<input name="provider" value={form.provider} onChange={set("provider")} required /></label>
          <label>Provider ID<input value={form.provider_id} onChange={set("provider_id")} /></label>
          <label>Utility Type
            <select value={form.utility_type} onChange={set("utility_type")}>
              {["Electricity", "Water", "Internet", "Other"].map(o => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label>Account Number<input value={form.account_number} onChange={set("account_number")} /></label>
          <label>Meter Number<input value={form.meter_number} onChange={set("meter_number")} /></label>
          <label>Billing Period<input value={form.billing_period} onChange={set("billing_period")} /></label>
          <label className="full">Description<input value={form.description} onChange={set("description")} /></label>
          <label>Invoice Number<input value={form.invoice_number} onChange={set("invoice_number")} /></label>
          <label>Invoice Date<input type="date" value={form.invoice_date} onChange={set("invoice_date")} /></label>
          <label>Due Date<input type="date" value={form.due_date} onChange={set("due_date")} required /></label>
          <label>Status
            <select value={form.status} onChange={set("status")}>
              {statuses.map(o => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label>Amount<input type="number" min="0" step="0.01" value={form.amount} onChange={set("amount")} required /></label>
          <label>Paid Amount<input type="number" min="0" step="0.01" value={form.paid_amount} onChange={set("paid_amount")} required /></label>
          <label>Bank / Cash Account<input value={form.bank_account} onChange={set("bank_account")} /></label>
          <label>Reference Number<input value={form.reference_number} onChange={set("reference_number")} /></label>
          <label className="full">Payment Remarks<textarea rows="2" value={form.payment_remarks} onChange={set("payment_remarks")} /></label>
        </div>
        <div className="modal-footer">
          <button type="button" className="light-button" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </form>
    </div>
  );
}
function SupplierPaymentForm({ record, saving, onClose, onSubmit }) {
  const [form, setForm] = useState({
    supplier: record.supplier === "—" ? "" : record.supplier,
    supplier_id: record.supplier_id === "—" ? "" : record.supplier_id,
    po_number: record.po_number === "—" ? "" : record.po_number,
    invoice_number: record.invoice_number === "—" ? "" : record.invoice_number,
    supply_description: record.supply_description === "—" ? "" : record.supply_description,
    invoice_date: record.invoice_date || "",
    due_date: record.due_date || "",
    amount: String(record.amount ?? 0),
    paid_amount: String(record.paid_amount ?? 0),
    status: record.stored_status || record.status,
    bank_account: record.bank_account === "—" ? "" : record.bank_account,
    reference_number: record.reference_number === "—" ? "" : record.reference_number,
    payment_remarks: record.payment_remarks || "",
  });

  const set = (key) => e => setForm(prev => ({ ...prev, [key]: e.target.value }));

  // Paid is not offered here: money only moves through the Record Payment
  // endpoint, so the two paths cannot disagree about what "settled" means.
  const statuses = ["Pending", "For Approval", "Approved", "Scheduled", "Cancelled"];

  return (
    <div className="modal-overlay" onClick={() => !saving && onClose()}>
      <form
        className="modal"
        onClick={e => e.stopPropagation()}
        onSubmit={e => {
          e.preventDefault();
          onSubmit({
            ...form,
            amount: Number(form.amount),
            paid_amount: Number(form.paid_amount),
          });
        }}
      >
        <div className="modal-header">
          <div>
            <h2>Edit Supplier Payment — {record.payment_id}</h2>
            <p>Update the payable. Changes are saved to the database.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
        </div>
        <div className="form-grid">
          <label>Supplier<input name="supplier" value={form.supplier} onChange={set("supplier")} required /></label>
          <label>Supplier ID<input value={form.supplier_id} onChange={set("supplier_id")} /></label>
          <label>PO Number<input value={form.po_number} onChange={set("po_number")} /></label>
          <label>Invoice Number<input value={form.invoice_number} onChange={set("invoice_number")} /></label>
          <label className="full">Supply Description<input value={form.supply_description} onChange={set("supply_description")} /></label>
          <label>Invoice Date<input type="date" value={form.invoice_date} onChange={set("invoice_date")} /></label>
          <label>Due Date<input type="date" value={form.due_date} onChange={set("due_date")} /></label>
          <label>Amount<input type="number" min="0" step="0.01" value={form.amount} onChange={set("amount")} required /></label>
          <label>Paid Amount<input type="number" min="0" step="0.01" value={form.paid_amount} onChange={set("paid_amount")} required /></label>
          <label>Status
            <select value={form.status} onChange={set("status")}>
              {statuses.map(option => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>Bank / Cash Account<input value={form.bank_account} onChange={set("bank_account")} /></label>
          <label>Reference Number<input value={form.reference_number} onChange={set("reference_number")} /></label>
          <label className="full">Payment Remarks<textarea rows="2" value={form.payment_remarks} onChange={set("payment_remarks")} /></label>
        </div>
        <div className="modal-footer">
          <button type="button" className="light-button" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </form>
    </div>
  );
}
// Office Expense Management (Accounts Payable) reads its claims from the same Node
// backend as the other modules (GET /api/office-expenses). Nothing here is typed
// in: the cards, the table and the detail panel all derive from the records the API
// returns, so a card can never disagree with a row.
//
// The four status columns the API returns are used AS-IS. budget_status,
// payment_status and verification_status are computed by the backend on read, and
// the colour of each badge comes from that returned value through oeStatusClass —
// so a status that changes in the database changes colour on screen with no code
// edit, which is the whole point of not hard-coding a colour per record.

const OE_CATEGORIES = [
  'All',
  'Office Supplies',
  'Utilities',
  'Repairs & Maintenance',
  'Equipment',
  'Travel & Meals',
  'Professional Services',
];

const OE_DEPARTMENTS = [
  'Administration',
  'Finance',
  'Human Resources',
  'Sales',
  'Operations',
  'Information Technology',
];

const OE_APPROVAL_STATUSES = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Cancelled'];
const OE_PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];
const OE_PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Check', 'Credit Card'];

const oeMoney = (value) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const oeDate = (ymd) => {
  if (!ymd) return "—";
  const date = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const oeBlank = (value) => (value === null || value === undefined || value === "" ? "—" : value);

// "Under Review" -> "under-review". The em-dash the API uses for a status that does
// not apply yet becomes "none" so it can be styled as a quiet placeholder rather
// than inheriting the colour of some unrelated status.
const oeStatusSlug = (status) => {
  const text = String(status ?? "").trim();
  if (!text || text === "—") return "none";
  return text.toLowerCase().replace(/\s+/g, "-");
};

// Keyed on the status the API returned. An unknown status falls back to the neutral
// class rather than silently borrowing another status's colour.
const OE_STATUS_CLASS = {
  // Budget status
  "within-budget": "oe-within-budget",
  "near-budget-limit": "oe-near-budget",
  "over-budget": "oe-over-budget",
  // Approval status
  "draft": "oe-draft",
  "submitted": "oe-submitted",
  "under-review": "oe-under-review",
  "approved": "oe-approved",
  "rejected": "oe-rejected",
  "cancelled": "oe-cancelled",
  // Payment status
  "for-payment": "oe-for-payment",
  "paid": "oe-paid",
  "payment-failed": "oe-payment-failed",
  // Verification status
  "pending-verification": "oe-pending-verification",
  "verified": "oe-verified",
  none: "oe-none",
};

const oeStatusClass = (status) =>
  `contract-status oe-status ${OE_STATUS_CLASS[oeStatusSlug(status)] || "oe-none"}`;

const oeTodayYmd = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

// The hover reason for a button that is currently unavailable. A disabled button
// gives no feedback at all, which is indistinguishable from a broken one, so the
// buttons stay clickable and explain themselves instead.
const explainTitle = (row, action) => {
  if (action === "verify") {
    return row.verification_status === "Verified"
      ? `${row.expense_id} was already verified`
      : `${row.expense_id} has no recorded payment to verify`;
  }
  if (row.payment_date) return `${row.expense_id} was already paid on ${oeDate(row.payment_date)}`;
  return `${row.expense_id} is ${String(row.approval_status || "").toLowerCase()} — only an approved request can be paid`;
};

// A card's peso total stays hidden as "*" until that card is clicked, matching
// Supplier Payment and Utility Payment. Each card has its own reveal key, so
// revealing the total never exposes Pending or Remaining as a side effect.
const OeCardAmount = ({ id, value, revealed, onToggle, className = "", tone = "total-supplies-amount" }) => {
  const isOpen = Boolean(revealed[id]);
  return (
    <strong
      className={`vendor-summary-amount payable-card-amount ${isOpen ? "is-open" : ""} ${className || tone}`.trim()}
      role="button"
      tabIndex={0}
      aria-label={isOpen ? `Hide total, currently ${oeMoney(value)}` : "Reveal total"}
      title={isOpen ? "Click to hide amount" : "Click to reveal amount"}
      onClick={event => {
        event.stopPropagation();
        onToggle(id);
      }}
      onKeyDown={event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle(id);
        }
      }}
    >
      {isOpen ? oeMoney(value) : "*"}
    </strong>
  );
};

// A failed request has to say what actually failed, rather than showing an empty
// table that is indistinguishable from "no claims yet".
const oeFailureMessage = (error, context) => {
  if (error && error.kind === "network") {
    return `The backend did not answer while loading ${context}. Start it with "npm start" in the Backend folder, then try again.`;
  }
  if (error && error.kind === "http") {
    return `The backend rejected the request for ${context} (HTTP ${error.status})${error.detail ? `: ${error.detail}` : "."}`;
  }
  return `${context} could not be loaded: ${(error && error.message) || "unknown error"}.`;
};

const oeRequest = async (url, options = {}) => {
  let response;
  try {
    response = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  } catch (cause) {
    const error = new Error("The backend could not be reached.");
    error.kind = "network";
    error.cause = cause;
    throw error;
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = new Error(payload?.message || response.statusText || "Request failed");
    error.kind = "http";
    error.status = response.status;
    error.detail = payload?.message || null;
    throw error;
  }
  return payload;
};

function OfficeExpenseManagementPage({ onNew, onAudit }) {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [filterApproval, setFilterApproval] = useState("All Status");
  const [filterBudget, setFilterBudget] = useState("All Budget");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const [editing, setEditing] = useState(null);
  const [paying, setPaying] = useState(null);
  const [verifying, setVerifying] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [menuFor, setMenuFor] = useState(null);
  const [revealedAmounts, setRevealedAmounts] = useState({});

  const toggleAmount = (key) =>
    setRevealedAmounts(prev => ({ ...prev, [key]: !prev[key] }));

  // The full set is fetched once and the narrower filters are applied here, so a
  // search never silently changes what the summary cards claim.
  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const payload = await oeRequest(`${API_BASE}/api/office-expenses`);
      setRecords(Array.isArray(payload?.data) ? payload.data : []);
      // The cards are read from the server's own summary of the same rows, so the
      // budget block the backend computed is displayed rather than recalculated.
      setSummary(payload?.summary || null);
    } catch (error) {
      setRecords([]);
      setSummary(null);
      setLoadError(oeFailureMessage(error, "office expenses"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const categoryRecords = useMemo(
    () => (selectedCategory === "All" ? records : records.filter(r => r.category === selectedCategory)),
    [records, selectedCategory]
  );

  const filteredRecords = useMemo(() => {
    const phrase = search.trim().toLowerCase();
    return categoryRecords.filter(row => {
      if (filterApproval !== "All Status" && row.approval_status !== filterApproval) return false;
      if (filterBudget !== "All Budget" && row.budget_status !== filterBudget) return false;
      // The range spans request -> expense -> payment date, so a claim paid inside
      // the window is found even if it was requested outside it.
      const dates = [row.request_date, row.expense_date, row.payment_date].filter(Boolean);
      if (dateFrom && !dates.some(d => d >= dateFrom)) return false;
      if (dateTo && !dates.some(d => d <= dateTo)) return false;
      if (!phrase) return true;
      return [
        row.expense_id, row.department, row.category, row.description,
        row.vendor, row.requested_by, row.payment_reference, row.remarks,
      ].some(v => String(v || "").toLowerCase().includes(phrase));
    });
  }, [categoryRecords, search, filterApproval, filterBudget, dateFrom, dateTo]);

  const selectedRecord = useMemo(
    () => categoryRecords.find(r => r.id === selectedId) || filteredRecords[0] || null,
    [categoryRecords, filteredRecords, selectedId]
  );

  // A blocked action explains itself rather than being a dead greyed button, which
  // is indistinguishable from a broken one.
  const explainBlocked = (row, action) => {
    if (action === "approve") {
      if (row.approval_status === "Approved") {
        window.alert(`${row.expense_id} is already approved. There is nothing left to approve.`);
        return;
      }
      if (row.approval_status === "Rejected") {
        window.alert(`${row.expense_id} was rejected and must be raised as a new request.`);
        return;
      }
      if (row.approval_status === "Cancelled") {
        window.alert(`${row.expense_id} was cancelled. Approve is not available on a cancelled request.`);
        return;
      }
      window.alert(`${row.expense_id} was already verified. Its approval can no longer be changed.`);
      return;
    }
    if (action === "verify") {
      window.alert(
        row.verification_status === "Verified"
          ? `${row.expense_id} was already verified by ${oeBlank(row.verified_by)}.`
          : `${row.expense_id} has no recorded payment, so there is nothing to verify yet.`
      );
      return;
    }
    window.alert(
      row.approval_status !== "Approved"
        ? `${row.expense_id} is ${row.approval_status.toLowerCase()} and cannot be paid. Only an approved request can be released.`
        : `${row.expense_id} has already been paid on ${oeDate(row.payment_date)}.`
    );
  };

  // Any mutation re-reads afterwards, otherwise the cards would keep showing the
  // pre-edit figures while the table row had already changed.
  const runAction = async (label, action) => {
    setSaving(true);
    try {
      const result = await action();
      setLoadError("");
      if (result?.message) onAudit?.(result.message);
      await load();
      return result;
    } catch (error) {
      setLoadError(oeFailureMessage(error, label));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const approveRecord = async (row) => {
    if (row.approval_status === "Approved" || row.verified_on) return explainBlocked(row, "approve");
    // A claim that is already over its allocation is flagged before it is approved,
    // so the approver is not left to discover it only afterwards.
    if (row.budget_status === "Over Budget") {
      const ok = window.confirm(
        `${row.expense_id} is OVER BUDGET.\n\nRequested: ${oeMoney(row.requested_amount)}\nAllocation: ${oeMoney(row.budget_allocation)}\n\nApprove anyway?`
      );
      if (!ok) return;
    }
    const result = await runAction(`approving ${row.expense_id}`, () =>
      oeRequest(`${API_BASE}/api/office-expenses/${row.id}/approval`, {
        method: "PUT",
        body: JSON.stringify({ status: "Approved", approved_by: "Admin User" }),
      })
    );
    if (result) {
      window.alert(
        row.budget_status === "Over Budget"
          ? `${row.expense_id} was approved over budget. It now reads For Payment.`
          : `${row.expense_id} moved to Approved and is now For Payment.`
      );
    }
  };

  const submitRecord = async (row) => {
    if (!["Draft", "Submitted"].includes(row.approval_status)) return explainBlocked(row, "approve");
    await runAction(`submitting ${row.expense_id}`, () =>
      oeRequest(`${API_BASE}/api/office-expenses/${row.id}/approval`, {
        method: "PUT",
        body: JSON.stringify({ status: "Submitted" }),
      })
    );
  };

  const cancelRecord = async (row) => {
    await runAction(`cancelling ${row.expense_id}`, () =>
      oeRequest(`${API_BASE}/api/office-expenses/${row.id}/approval`, {
        method: "PUT",
        body: JSON.stringify({ status: "Cancelled" }),
      })
    );
  };

  const deleteRecord = async (row) => {
    if (!window.confirm(`Delete ${row.expense_id}? This cannot be undone.`)) return;
    const result = await runAction(`deleting ${row.expense_id}`, () =>
      oeRequest(`${API_BASE}/api/office-expenses/${row.id}`, { method: "DELETE" })
    );
    if (result) {
      setSelectedId(null);
      window.alert(`${row.expense_id} deleted.`);
    }
  };

  // The printed record shows the real amounts. Masking a printed claim would defeat
  // the purpose of printing it, so the "*" is a screen-only affordance.
  const printRecord = (row) => {
    const w = window.open("", "_blank");
    if (!w) {
      window.alert("The print window was blocked. Allow pop-ups for this site and try again.");
      return;
    }
    w.document.write(`<html><head><title>${row.expense_id}</title></head><body style="font-family:Arial;padding:40px">
      <h1>PRIMEPOWER - Office Expense</h1><hr/>
      <p><b>Expense ID:</b> ${row.expense_id}</p>
      <p><b>Request Date:</b> ${oeDate(row.request_date)}</p>
      <p><b>Expense Date:</b> ${oeDate(row.expense_date)}</p>
      <p><b>Department:</b> ${oeBlank(row.department)}</p>
      <p><b>Category:</b> ${oeBlank(row.category)}</p>
      <p><b>Description:</b> ${oeBlank(row.description)}</p>
      <p><b>Vendor:</b> ${oeBlank(row.vendor)}</p>
      <p><b>Requested Amount:</b> ${oeMoney(row.requested_amount)}</p>
      <p><b>Approved Amount:</b> ${row.approved_amount === null ? "—" : oeMoney(row.approved_amount)}</p>
      <p><b>Budget Allocation:</b> ${oeMoney(row.budget_allocation)}</p>
      <p><b>Amount Used:</b> ${oeMoney(row.amount_used)}</p>
      <p><b>Remaining Budget:</b> ${oeMoney(row.remaining_budget)}</p>
      <p><b>Budget Status:</b> ${row.budget_status}</p>
      <p><b>Requested By:</b> ${oeBlank(row.requested_by)}</p>
      <p><b>Priority:</b> ${oeBlank(row.priority)}</p>
      <p><b>Supporting Document:</b> ${oeBlank(row.supporting_document)}</p>
      <p><b>Approval Status:</b> ${row.approval_status}</p>
      <p><b>Approved By:</b> ${oeBlank(row.approved_by)}</p>
      <p><b>Payment Status:</b> ${row.payment_status}</p>
      <p><b>Payment Method:</b> ${oeBlank(row.payment_method)}</p>
      <p><b>Payment Date:</b> ${oeDate(row.payment_date)}</p>
      <p><b>Payment Reference:</b> ${oeBlank(row.payment_reference)}</p>
      <p><b>Verification Status:</b> ${row.verification_status}</p>
      <p><b>Verified By:</b> ${oeBlank(row.verified_by)}</p>
      <p><b>Remarks:</b> ${oeBlank(row.remarks)}</p>
      <script>window.print()</script></body></html>`);
    w.document.close();
  };

  const s = summary;

  return <section className="management-page vendor-payment-page">
    <Breadcrumb current="Office Expense Management" parent="Accounts Payable" />
    <div className="management-header">
      <div><h2>OFFICE EXPENSE MANAGEMENT</h2><p>Run office expense claims from intake through budget check, approval, payment and verification.</p></div>
      <div className="management-actions">
        <button className="light-button" onClick={() => window.print()} disabled={saving}><Printer size={15}/> Print / Save PDF</button>
        <button className="primary-button" onClick={onNew} disabled={saving}>＋ New Office Expense</button>
      </div>
    </div>

    <div className="payment-methods">
      <span className="payment-method-label">Expense Category</span>
      {OE_CATEGORIES.map(category => (
        <button
          key={category}
          className={`payment-method ${selectedCategory === category ? "selected" : ""}`}
          onClick={() => { setSelectedCategory(category); setSelectedId(null); }}
        >{category}</button>
      ))}
    </div>

    <div className="vendor-toolbar">
      <div className="search-box vendor-search"><span>⌕</span><input placeholder="Search expense, department, vendor, reference..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="vendor-toolbar-controls">
        <select className="vendor-select" value={filterApproval} onChange={e => setFilterApproval(e.target.value)} aria-label="Approval status">
          <option>All Status</option>
          {OE_APPROVAL_STATUSES.map(option => <option key={option}>{option}</option>)}
        </select>
        <select className="vendor-select" value={filterBudget} onChange={e => setFilterBudget(e.target.value)} aria-label="Budget status">
          <option>All Budget</option>
          <option>Within Budget</option>
          <option>Near Budget Limit</option>
          <option>Over Budget</option>
        </select>
        <input className="vendor-select up-date" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} aria-label="Date range from" title="From date" />
        <input className="vendor-select up-date" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} aria-label="Date range to" title="To date" />
        {(dateFrom || dateTo) && <button className="light-button" onClick={() => { setDateFrom(""); setDateTo(""); }}>Clear</button>}
      </div>
    </div>

    {/* Real failure text, not a guess. An empty table is only correct when the
        API actually said "no records". */}
    {loadError && <div className="cfu-error" role="alert">{loadError}</div>}

    <div className="vendor-summary-grid">
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Total Office Expenses</span>
        <OeCardAmount id="oe-card-total" value={s ? s.total_amount : 0} revealed={revealedAmounts} onToggle={toggleAmount} className="total-supplies-amount" />
        <span className="vendor-summary-count">{s ? s.total : 0} record{(s ? s.total : 0) === 1 ? "" : "s"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Pending Approval</span>
        <OeCardAmount id="oe-card-pending" value={s ? s.pending_approval_amount : 0} revealed={revealedAmounts} onToggle={toggleAmount} className="pending-amount" />
        <span className="vendor-summary-count">{s ? s.pending_approval : 0} record{(s ? s.pending_approval : 0) === 1 ? "" : "s"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Approved</span>
        <OeCardAmount id="oe-card-approved" value={s ? s.approved_amount : 0} revealed={revealedAmounts} onToggle={toggleAmount} className="approved-amount" />
        <span className="vendor-summary-count">{s ? s.approved : 0} record{(s ? s.approved : 0) === 1 ? "" : "s"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">For Payment</span>
        <OeCardAmount id="oe-card-payment" value={s ? s.for_payment_amount : 0} revealed={revealedAmounts} onToggle={toggleAmount} className="for-payment-amount" />
        <span className="vendor-summary-count">{s ? s.for_payment : 0} record{(s ? s.for_payment : 0) === 1 ? "" : "s"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Paid This Month</span>
        <OeCardAmount id="oe-card-paid" value={s ? s.paid_this_month_amount : 0} revealed={revealedAmounts} onToggle={toggleAmount} className="paid-amount" />
        <span className="vendor-summary-count">{s ? s.paid_this_month : 0} record{(s ? s.paid_this_month : 0) === 1 ? "" : "s"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Pending Verification</span>
        <OeCardAmount id="oe-card-verify" value={s ? s.pending_verification_amount : 0} revealed={revealedAmounts} onToggle={toggleAmount} className="pending-verification-amount" />
        <span className="vendor-summary-count">{s ? s.pending_verification : 0} record{(s ? s.pending_verification : 0) === 1 ? "" : "s"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Remaining Office Budget</span>
        <OeCardAmount id="oe-card-budget" value={s ? s.remaining_amount : 0} revealed={revealedAmounts} onToggle={toggleAmount} className="remaining-budget-amount" />
        {/* Utilization and the budget figures come from the backend's own summary,
            not from a subtraction done in the browser. */}
        <span className="vendor-summary-count">{s ? s.utilization : 0}% of {oeMoney(s ? s.budget_amount : 0)} used</span>
      </div>
    </div>

    <section className="vendor-record-panel">
      <div className="vendor-record-heading">
        <h3>Office Expenses</h3>
        <span className="vendor-summary-count">{filteredRecords.length} of {categoryRecords.length} shown</span>
      </div>
      <div className="table-card vendor-table-card">
        <table>
          <thead>
            <tr>
              <th>Expense ID</th>
              <th>Category</th>
              <th>Vendor</th>
              <th className="money-cell">Amount</th>
              <th>Budget Status</th>
              <th>Approval</th>
              <th>Payment</th>
              <th>Verification</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="9" className="empty">Loading office expenses...</td></tr>}
            {!loading && filteredRecords.length === 0 && (
              <tr>
                <td colSpan="9" className="empty">
                  {categoryRecords.length === 0
                    ? `No ${selectedCategory === "All" ? "" : selectedCategory.toLowerCase() + " "}expenses yet. Click "New Office Expense" to raise one.`
                    : "No records match the current search and filters."}
                </td>
              </tr>
            )}
            {!loading && filteredRecords.map(r => <tr key={r.id} onClick={() => setSelectedId(r.id)} className={selectedRecord?.id === r.id ? "selected-row" : ""}>
              <td className="link-cell">{r.expense_id}</td>
              <td>{oeBlank(r.category)}</td>
              <td className="strong-cell">{oeBlank(r.vendor)}</td>
              <PayableAmountCell rowId={`${r.id}-row`} value={r.requested_amount} revealed={revealedAmounts} onToggle={toggleAmount} format={oeMoney} />
              {/* Each badge takes its class from the status the API returned, so a
                  status change in the database recolours the table with no edit. */}
              <td><span className={oeStatusClass(r.budget_status)}>{r.budget_status}</span></td>
              <td><span className={oeStatusClass(r.approval_status)}>{r.approval_status}</span></td>
              <td><span className={oeStatusClass(r.payment_status)}>{r.payment_status}</span></td>
              <td><span className={oeStatusClass(r.verification_status)}>{r.verification_status}</span></td>
              <td onClick={e => e.stopPropagation()}>
                <div className="row-actions">
                  <button type="button" title="View details" aria-label={`View ${r.expense_id}`} onClick={() => setSelectedId(r.id)}><Eye size={15}/></button>
                  <button type="button" title="Edit" aria-label={`Edit ${r.expense_id}`} onClick={() => setEditing({ ...r })}><Edit3 size={15}/></button>
                  <button
                    type="button"
                    title={r.approval_status === "Approved"
                      ? `${r.expense_id} is already approved`
                      : r.verified_on
                        ? `${r.expense_id} is verified — approval can no longer change`
                        : r.budget_status === "Over Budget"
                          ? `Approve ${r.expense_id} (over budget — will confirm)`
                          : `Approve ${r.expense_id}`}
                    aria-label={`Approve ${r.expense_id}`}
                    className={r.approval_status === "Approved" || r.verified_on ? "sp-blocked" : ""}
                    disabled={saving}
                    onClick={() => approveRecord(r)}
                  ><CheckCircle2 size={15}/></button>
                  <button
                    type="button"
                    title={r.can_record_payment ? `Release payment for ${r.expense_id}` : explainTitle(r, "pay")}
                    aria-label={`Record payment for ${r.expense_id}`}
                    className={r.can_record_payment ? "" : "sp-blocked"}
                    disabled={saving}
                    onClick={() => r.can_record_payment
                      ? setPaying({ ...r, amount_used: r.approved_amount ?? r.requested_amount, payment_date: oeTodayYmd() })
                      : explainBlocked(r, "pay")}
                  ><CreditCard size={15}/></button>
                  <button
                    type="button"
                    title={r.can_verify ? `Verify ${r.expense_id}` : explainTitle(r, "verify")}
                    aria-label={`Verify ${r.expense_id}`}
                    className={r.can_verify ? "" : "sp-blocked"}
                    disabled={saving}
                    onClick={() => r.can_verify ? setVerifying({ ...r }) : explainBlocked(r, "verify")}
                  ><ShieldCheck size={15}/></button>
                  <button type="button" title="Print" aria-label={`Print ${r.expense_id}`} onClick={() => printRecord(r)}><Printer size={15}/></button>
                  <div className="row-menu">
                    <button type="button" title="More actions" aria-label={`More actions for ${r.expense_id}`} onClick={() => setMenuFor(menuFor === r.id ? null : r.id)}><MoreHorizontal size={15}/></button>
                    {menuFor === r.id && (
                      <div className="row-menu-popover">
                        {["Draft", "Submitted"].includes(r.approval_status) && (
                          <button type="button" disabled={saving} onClick={() => { setMenuFor(null); submitRecord(r); }}>Submit for approval</button>
                        )}
                        {r.approval_status !== "Rejected" && r.approval_status !== "Cancelled" && !r.verified_on && (
                          <button type="button" disabled={saving} onClick={() => { setMenuFor(null); setRejecting({ ...r }); }}>Reject</button>
                        )}
                        {r.approval_status !== "Cancelled" && !r.verified_on && (
                          <button type="button" disabled={saving} onClick={() => { setMenuFor(null); cancelRecord(r); }}>Cancel request</button>
                        )}
                        <button type="button" className="danger" disabled={saving} onClick={() => { setMenuFor(null); deleteRecord(r); }}>Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </section>

    {selectedRecord && (
      <section className="vendor-detail-panel">
        <div className="vendor-detail-header">
          <div>
            <span className="vendor-detail-kicker">Office Expense / Record</span>
            <h3>{selectedRecord.expense_id}</h3>
          </div>
          <div className="sp-detail-actions">
            <span className={oeStatusClass(selectedRecord.budget_status)}>{selectedRecord.budget_status}</span>
            <span className={oeStatusClass(selectedRecord.approval_status)}>{selectedRecord.approval_status}</span>
            <span className={oeStatusClass(selectedRecord.payment_status)}>{selectedRecord.payment_status}</span>
            <span className={oeStatusClass(selectedRecord.verification_status)}>{selectedRecord.verification_status}</span>
            <button
              type="button"
              className="light-button sp-reveal-all"
              onClick={() => {
                const keys = ["requested", "approved", "used", "remaining"].map(f => `${selectedRecord.id}-${f}`);
                const allOpen = keys.every(k => revealedAmounts[k]);
                setRevealedAmounts(prev => {
                  const next = { ...prev };
                  keys.forEach(k => { next[k] = !allOpen; });
                  return next;
                });
              }}
            >
              {["requested", "approved", "used", "remaining"].every(f => revealedAmounts[`${selectedRecord.id}-${f}`])
                ? "Hide Amounts"
                : "Reveal Amounts"}
            </button>
          </div>
        </div>
        <div className="vendor-detail-grid">
          <div className="vendor-detail-block">
            <h4>Expense Information</h4>
            <div className="vendor-detail-list">
              <div><span>Expense ID</span><b>{selectedRecord.expense_id}</b></div>
              <div><span>Request Date</span><b>{oeDate(selectedRecord.request_date)}</b></div>
              <div><span>Expense Date</span><b>{oeDate(selectedRecord.expense_date)}</b></div>
              <div><span>Department / Office</span><b>{oeBlank(selectedRecord.department)}</b></div>
              <div><span>Expense Category</span><b>{oeBlank(selectedRecord.category)}</b></div>
              <div><span>Description</span><b>{oeBlank(selectedRecord.description)}</b></div>
              <div><span>Supplier / Vendor</span><b>{oeBlank(selectedRecord.vendor)}</b></div>
              <div><span>Requested Amount</span><b><SpMaskedAmount id={`${selectedRecord.id}-requested`} value={selectedRecord.requested_amount} revealed={revealedAmounts} onToggle={toggleAmount} /></b></div>
              <div><span>Approved Amount</span><b>{selectedRecord.approved_amount === null ? "—" : <SpMaskedAmount id={`${selectedRecord.id}-approved`} value={selectedRecord.approved_amount} revealed={revealedAmounts} onToggle={toggleAmount} />}</b></div>
              <div><span>Budget Allocation</span><b><SpMaskedAmount id={`${selectedRecord.id}-alloc`} value={selectedRecord.budget_allocation} revealed={revealedAmounts} onToggle={toggleAmount} /></b></div>
              <div><span>Amount Used</span><b><SpMaskedAmount id={`${selectedRecord.id}-used`} value={selectedRecord.amount_used} revealed={revealedAmounts} onToggle={toggleAmount} /></b></div>
              <div><span>Remaining Budget</span><b><SpMaskedAmount id={`${selectedRecord.id}-remaining`} value={selectedRecord.remaining_budget} revealed={revealedAmounts} onToggle={toggleAmount} /></b></div>
              <div><span>Budget Status</span><b>{selectedRecord.budget_status} ({selectedRecord.utilization}% used)</b></div>
              <div><span>Requested By</span><b>{oeBlank(selectedRecord.requested_by)}</b></div>
              <div><span>Priority</span><b>{oeBlank(selectedRecord.priority)}</b></div>
            </div>
          </div>
          <div className="vendor-detail-block">
            <h4>Approval Information</h4>
            <div className="vendor-detail-list">
              <div><span>Approval Status</span><b>{selectedRecord.approval_status}</b></div>
              <div><span>Approved By</span><b>{oeBlank(selectedRecord.approved_by)}</b></div>
              <div><span>Approved On</span><b>{oeDate(selectedRecord.approved_on)}</b></div>
              <div><span>Rejection Reason</span><b>{selectedRecord.approval_status === "Rejected" ? oeBlank(selectedRecord.rejection_reason) : "—"}</b></div>
              <div><span>Created</span><b>{oeDate(String(selectedRecord.created_at || "").slice(0, 10))}</b></div>
              <div><span>Last Updated</span><b>{oeDate(String(selectedRecord.updated_at || "").slice(0, 10))}</b></div>
            </div>
          </div>
          <div className="vendor-detail-block">
            <h4>Payment Information</h4>
            <div className="vendor-detail-list">
              <div><span>Payment Status</span><b>{selectedRecord.payment_status}</b></div>
              <div><span>Payment Method</span><b>{oeBlank(selectedRecord.payment_method)}</b></div>
              <div><span>Payment Date</span><b>{oeDate(selectedRecord.payment_date)}</b></div>
              <div><span>Payment Reference</span><b>{oeBlank(selectedRecord.payment_reference)}</b></div>
              <div><span>Bank / Cash Account</span><b>{oeBlank(selectedRecord.bank_account)}</b></div>
            </div>
          </div>
          <div className="vendor-detail-block">
            <h4>Verification &amp; Documents</h4>
            <div className="vendor-detail-list">
              <div><span>Verification Status</span><b>{selectedRecord.verification_status}</b></div>
              <div><span>Verified By</span><b>{oeBlank(selectedRecord.verified_by)}</b></div>
              <div><span>Verified On</span><b>{oeDate(selectedRecord.verified_on)}</b></div>
              <div><span>Supporting Document</span><b>{oeBlank(selectedRecord.supporting_document)}</b></div>
              <div><span>Remarks</span><b>{oeBlank(selectedRecord.remarks)}</b></div>
              <div><span>Print Record</span><b><button className="document-link" onClick={() => printRecord(selectedRecord)}>Open printable copy</button></b></div>
            </div>
          </div>
        </div>
      </section>
    )}

    {/* Release Payment dialog — PUT /api/office-expenses/:id/payment. The backend
        recomputes every derived status, so this form only states how much was
        released and when. The ceiling shown is the APPROVED amount. */}
    {paying && (
      <div className="modal-overlay" onClick={() => !saving && setPaying(null)}>
        <form
          className="modal"
          onClick={e => e.stopPropagation()}
          onSubmit={async e => {
            e.preventDefault();
            const cap = paying.approved_amount ?? paying.requested_amount;
            const failed = e.target.payment_failed.value === "yes";
            const result = await runAction(`releasing a payment for ${paying.expense_id}`, () =>
              oeRequest(`${API_BASE}/api/office-expenses/${paying.id}/payment`, {
                method: "PUT",
                body: JSON.stringify({
                  payment_failed: failed,
                  amount_used: failed ? 0 : Number(e.target.amount_used.value),
                  payment_date: e.target.payment_date.value,
                  payment_method: e.target.payment_method.value,
                  payment_reference: e.target.payment_reference.value,
                  bank_account: e.target.bank_account.value,
                }),
              })
            );
            if (result) { setPaying(null); window.alert(result.message); }
          }}
        >
          <div className="modal-header">
            <div>
              <h2>Release Payment — {paying.expense_id}</h2>
              <p>Approved: {oeMoney(paying.approved_amount ?? 0)} of {oeMoney(paying.requested_amount)} requested</p>
            </div>
            <button type="button" onClick={() => setPaying(null)} disabled={saving}><X size={20}/></button>
          </div>
          <div className="form-grid">
            <label>Payment Outcome
              <select name="payment_failed" defaultValue="no">
                <option value="no">Paid successfully</option>
                <option value="yes">Payment failed</option>
              </select>
            </label>
            <label>Amount Released
              <input name="amount_used" type="number" min="0.01" max={paying.approved_amount ?? paying.requested_amount} step="0.01" defaultValue={paying.amount_used} required />
            </label>
            <label>Payment Date
              <input name="payment_date" type="date" defaultValue={paying.payment_date} required />
            </label>
            <label>Payment Method
              <select name="payment_method" defaultValue={paying.payment_method === "—" ? "Bank Transfer" : paying.payment_method}>
                {OE_PAYMENT_METHODS.map(method => <option key={method}>{method}</option>)}
              </select>
            </label>
            <label>Payment Reference<input name="payment_reference" type="text" defaultValue={paying.payment_reference === "—" ? "" : paying.payment_reference} placeholder="e.g. BT-62015" /></label>
            <label>Bank / Cash Account<input name="bank_account" type="text" defaultValue={paying.bank_account === "—" ? "" : paying.bank_account} placeholder="e.g. BDO-91002" /></label>
          </div>
          <div className="modal-footer">
            <button type="button" className="light-button" onClick={() => setPaying(null)} disabled={saving}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : "Record Payment"}</button>
          </div>
        </form>
      </div>
    )}

    {/* Verify dialog — PUT /api/office-expenses/:id/verification. Verification is
        gated on a recorded payment by the backend. */}
    {verifying && (
      <div className="modal-overlay" onClick={() => !saving && setVerifying(null)}>
        <form
          className="modal"
          onClick={e => e.stopPropagation()}
          onSubmit={async e => {
            e.preventDefault();
            const result = await runAction(`verifying ${verifying.expense_id}`, () =>
              oeRequest(`${API_BASE}/api/office-expenses/${verifying.id}/verification`, {
                method: "PUT",
                body: JSON.stringify({
                  verified: true,
                  verified_by: e.target.verified_by.value,
                  verified_on: e.target.verified_on.value,
                  remarks: e.target.remarks.value,
                }),
              })
            );
            if (result) { setVerifying(null); window.alert(result.message); }
          }}
        >
          <div className="modal-header">
            <div>
              <h2>Verify — {verifying.expense_id}</h2>
              <p>Confirm the document and the payment of {oeMoney(verifying.amount_used)}</p>
            </div>
            <button type="button" onClick={() => setVerifying(null)} disabled={saving}><X size={20}/></button>
          </div>
          <div className="form-grid">
            <label>Verified By<input name="verified_by" type="text" defaultValue="Admin User" required /></label>
            <label>Verification Date<input name="verified_on" type="date" defaultValue={oeTodayYmd()} required /></label>
            <label className="full">Remarks<textarea name="remarks" rows="2" defaultValue={verifying.remarks} /></label>
          </div>
          <div className="modal-footer">
            <button type="button" className="light-button" onClick={() => setVerifying(null)} disabled={saving}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : "Confirm Verification"}</button>
          </div>
        </form>
      </div>
    )}

    {/* Reject dialog — a reason is required by the backend, so the audit trail
        never records a refusal with no explanation. */}
    {rejecting && (
      <div className="modal-overlay" onClick={() => !saving && setRejecting(null)}>
        <form
          className="modal"
          onClick={e => e.stopPropagation()}
          onSubmit={async e => {
            e.preventDefault();
            const result = await runAction(`rejecting ${rejecting.expense_id}`, () =>
              oeRequest(`${API_BASE}/api/office-expenses/${rejecting.id}/approval`, {
                method: "PUT",
                body: JSON.stringify({
                  status: "Rejected",
                  rejection_reason: e.target.rejection_reason.value,
                }),
              })
            );
            if (result) { setRejecting(null); window.alert(result.message); }
          }}
        >
          <div className="modal-header">
            <div>
              <h2>Reject — {rejecting.expense_id}</h2>
              <p>{oeMoney(rejecting.requested_amount)} requested by {oeBlank(rejecting.requested_by)}</p>
            </div>
            <button type="button" onClick={() => setRejecting(null)} disabled={saving}><X size={20}/></button>
          </div>
          <div className="form-grid">
            <label className="full">Reason for rejection
              <textarea name="rejection_reason" rows="3" placeholder="Explain why this request is being rejected..." required />
            </label>
          </div>
          <div className="modal-footer">
            <button type="button" className="light-button" onClick={() => setRejecting(null)} disabled={saving}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : "Reject Request"}</button>
          </div>
        </form>
      </div>
    )}

    {/* Edit dialog — PUT /api/office-expenses/:id. The approval, payment and
        verification fields are absent on purpose: they are events, and each has
        its own endpoint. */}
    {editing && (
      <OfficeExpenseForm
        record={editing}
        saving={saving}
        onClose={() => setEditing(null)}
        onSubmit={async (payload) => {
          const result = await runAction(`updating ${editing.expense_id}`, () =>
            oeRequest(`${API_BASE}/api/office-expenses/${editing.id}`, {
              method: "PUT",
              body: JSON.stringify(payload),
            })
          );
          if (result) { setEditing(null); window.alert(result.message); }
        }}
      />
    )}
  </section>;
}

// Edit form for an existing claim. Approval status, amount used, payment date and
// verification are deliberately not editable here: they are the events that move
// the process forward, and each is only reachable through its own endpoint. An
// editable "Approved" or "Paid" would let the table contradict the ledger.
function OfficeExpenseForm({ record, saving, onClose, onSubmit }) {
  const blank = (v) => (v === "—" || v === null || v === undefined ? "" : v);
  const [form, setForm] = useState({
    request_date: record.request_date || "",
    expense_date: record.expense_date || "",
    department: record.department === "—" ? "Administration" : record.department,
    category: record.category === "—" ? "Office Supplies" : record.category,
    description: blank(record.description),
    vendor: blank(record.vendor),
    requested_amount: String(record.requested_amount ?? 0),
    budget_allocation: String(record.budget_allocation ?? 0),
    requested_by: blank(record.requested_by),
    priority: record.priority || "Normal",
    supporting_document: blank(record.supporting_document),
    remarks: record.remarks || "",
  });

  const set = (key) => e => setForm(prev => ({ ...prev, [key]: e.target.value }));

  // The budget band is previewed live from the same rule the backend uses, so the
  // user sees a claim go Over Budget before saving rather than after.
  const requested = Number(form.requested_amount || 0);
  const allocation = Number(form.budget_allocation || 0);
  const previewBudget = allocation <= 0
    ? (requested > 0 ? "Over Budget" : "Within Budget")
    : requested > allocation
      ? "Over Budget"
      : requested / allocation >= 0.8
        ? "Near Budget Limit"
        : "Within Budget";

  return (
    <div className="modal-overlay" onClick={() => !saving && onClose()}>
      <form
        className="modal"
        onClick={e => e.stopPropagation()}
        onSubmit={e => {
          e.preventDefault();
          onSubmit({
            ...form,
            requested_amount: Number(form.requested_amount || 0),
            budget_allocation: Number(form.budget_allocation || 0),
          });
        }}
      >
        <div className="modal-header">
          <div>
            <h2>Edit Expense — {record.expense_id}</h2>
            <p>Current status: {record.approval_status} &middot; {record.payment_status}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
        </div>
        <div className="form-grid">
          <label>Request Date<input type="date" value={form.request_date} onChange={set("request_date")} /></label>
          <label>Expense Date<input type="date" value={form.expense_date} onChange={set("expense_date")} required /></label>
          <label>Department
            <select value={form.department} onChange={set("department")}>
              {OE_DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </label>
          <label>Category
            <select value={form.category} onChange={set("category")}>
              {OE_CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="full">Description<input value={form.description} onChange={set("description")} required /></label>
          <label>Supplier / Vendor<input value={form.vendor} onChange={set("vendor")} required /></label>
          <label>Requested By<input value={form.requested_by} onChange={set("requested_by")} required /></label>
          <label>Requested Amount<input type="number" min="0" step="0.01" value={form.requested_amount} onChange={set("requested_amount")} required /></label>
          <label>Budget Allocation<input type="number" min="0" step="0.01" value={form.budget_allocation} onChange={set("budget_allocation")} required /></label>
          <label>Priority
            <select value={form.priority} onChange={set("priority")}>
              {OE_PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </label>
          <label>Supporting Document<input value={form.supporting_document} onChange={set("supporting_document")} placeholder="e.g. OR-61220" /></label>
          <label className="full">
            Budget check: <span className={oeStatusClass(previewBudget)}>{previewBudget}</span>
          </label>
          <label className="full">Remarks<textarea rows="2" value={form.remarks} onChange={set("remarks")} /></label>
        </div>
        <div className="modal-footer">
          <button type="button" className="light-button" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </form>
    </div>
  );
}
function ModulePage({ page, onNew, transactions, onUpdateRecord, onAudit }) {
  const revenue = transactions.filter(x=>x.type === "Income" && x.status !== "Pending").reduce((a,x)=>a+Number(x.amount||0),0);
  const expenses = transactions.filter(x=>x.type === "Expense" && x.status !== "Pending").reduce((a,x)=>a+Number(x.amount||0),0);
  const profit = revenue - expenses;
  const isReport = ["Income Statement", "Expense Reports", "Revenue Reports", "Profit Analysis"].includes(page);
  const isAnalytics = page.includes("Analytics") || page === "Financial KPI Monitoring";
  const paymentPage = ["Supplier Payment Management", "Utility Payment Management", "Office Expense Management", "Vendor Payment Tracking"].includes(page);

  const printReport = () => {
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>${page}</title></head><body style="font-family:Arial;padding:40px"><h1>PRIMEPOWER Finance Management</h1><h2>${page}</h2><p>Generated: ${new Date().toLocaleString()}</p><hr/><p>Revenue: ${money(revenue)}</p><p>Expenses: ${money(expenses)}</p><p>Net Profit: ${money(profit)}</p><script>window.print()</script></body></html>`);
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
    {isReport ? <ReportContent page={page} onPrint={printReport} transactions={transactions} /> : isAnalytics ? <AnalyticsContent page={page} /> : <GenericContent page={page} transactions={transactions} onUpdateRecord={onUpdateRecord} onAudit={onAudit} />}
  </section>;
}

function findParent(page) { for (const s of sections) for (const i of s.items) if (i.children.includes(page)) return i.name; return "Financial Management"; }

function GenericContent({ page, transactions, onUpdateRecord, onAudit }) {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [formError, setFormError] = useState("");
  const rows = page === "Payment Recording" ? transactions.filter(x=>x.type==="Income") : page.includes("Expense") || page.includes("Payable") || page.includes("Outflow") ? transactions.filter(x=>x.type==="Expense") : transactions;
  // No hard-coded aging data lives here — "Aging of Receivables" renders via
  // <AgingReceivablesPage/>, which fetches GET /api/receivables/aging.
  const headers = page === "Bank Account Management" ? ["Account", "Account Type", "Account No.", "Available Balance", "Status", "Actions"] : ["Reference", "Description", "Category", "Amount", "Date", "Status", "Actions"];

  const openEdit = (record) => {
    setSelectedRecord(null);
    setFormError("");
    setEditForm({
      description: record.description || "",
      category: record.category || "",
      amount: String(record.amount ?? 0),
      date: record.date || "",
      status: record.status || "Pending",
    });
    setEditingRecord(record);
  };

  const saveEdit = (event) => {
    event.preventDefault();
    const description = editForm.description.trim();
    const category = editForm.category.trim();
    const date = editForm.date.trim();
    const amount = Number(editForm.amount);
    const status = editForm.status.trim();

    if (!description || !category || !date || !status) {
      setFormError("Complete all required fields before saving.");
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setFormError("Enter a valid non-negative amount.");
      return;
    }
    if (!onUpdateRecord) {
      setFormError("Editing is not available for this record.");
      return;
    }

    const updatedRecord = { ...editingRecord, description, category, amount, date, status };
    onUpdateRecord(updatedRecord);
    setEditingRecord(null);
    setEditForm(null);
    setFormError("");
    onAudit?.(`Updated ${page.toLowerCase()} record`, `${updatedRecord.id} - ${updatedRecord.description}`);
  };

  const printRecord = (record, index) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.alert("Please allow pop-ups to print this record.");
      return;
    }
    const reference = `REF-${String(index + 1).padStart(3, "0")}`;
    printWindow.document.write(`
      <html><head><title>${page} - ${reference}</title></head>
      <body style="font-family:Arial,sans-serif;padding:40px;color:#203b4e">
        <h1>PRIMEPOWER - ${page}</h1>
        <p style="color:#64748b">Generated: ${new Date().toLocaleString()}</p><hr/>
        <p><b>Reference:</b> ${reference}</p>
        <p><b>Description:</b> ${record.description}</p>
        <p><b>Category:</b> ${record.category}</p>
        <p><b>Amount:</b> ${record.type === "Expense" ? "-" : "+"}${money(record.amount)}</p>
        <p><b>Date:</b> ${record.date}</p>
        <p><b>Status:</b> ${record.status}</p>
        <p><b>Account:</b> ${record.account || "—"}</p>
        <script>window.print();</script>
      </body></html>
    `);
    printWindow.document.close();
    onAudit?.(`Printed ${page.toLowerCase()} record`, reference);
  };
  return <>
    <div className="table-card">
      <table>
        <thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.length ? rows.map((r,i)=><tr key={r.id}>
            <td className="link-cell">REF-{String(i+1).padStart(3,"0")}</td>
            <td className="strong-cell">{r.description}</td>
            <td>{r.category}</td>
            <td className={`money-cell ${r.type === "Expense" ? "red-text" : "green-text"}`}>{r.type === "Expense" ? "-" : "+"}{money(r.amount)}</td>
            <td>{r.date}</td>
            <td><span className={`contract-status ${r.status.toLowerCase()}`}>{r.status}</span></td>
            <td><div className="row-actions">
              <button type="button" title="View" aria-label={`View ${r.description}`} onClick={() => setSelectedRecord(r)}><Eye size={15}/></button>
              <button type="button" title="Edit" aria-label={`Edit ${r.description}`} onClick={() => openEdit(r)}><Edit3 size={15}/></button>
              <button type="button" title="Print" aria-label={`Print ${r.description}`} onClick={() => printRecord(r, i)}><Printer size={15}/></button>
            </div></td>
          </tr>) : <tr><td colSpan={7} className="empty">No records found.</td></tr>}
        </tbody>
      </table>
    </div>

    {selectedRecord && (
      <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="generic-record-title" onClick={(event) => event.stopPropagation()}>
          <div className="modal-header">
            <div><h2 id="generic-record-title">Record Details</h2><p>{page}</p></div>
            <button type="button" onClick={() => setSelectedRecord(null)} aria-label="Close"><X size={15}/></button>
          </div>
          <div className="aging-detail-body">
            <div className="aging-detail-section">
              <h4>Record Information</h4>
              <dl className="aging-detail-grid">
                <div><dt>Description</dt><dd>{selectedRecord.description}</dd></div>
                <div><dt>Category</dt><dd>{selectedRecord.category}</dd></div>
                <div><dt>Amount</dt><dd>{selectedRecord.type === "Expense" ? "-" : "+"}{money(selectedRecord.amount)}</dd></div>
                <div><dt>Date</dt><dd>{selectedRecord.date}</dd></div>
                <div><dt>Status</dt><dd>{selectedRecord.status}</dd></div>
                <div><dt>Account</dt><dd>{selectedRecord.account || "—"}</dd></div>
              </dl>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="light-button" onClick={() => openEdit(selectedRecord)}><Edit3 size={14}/> Edit</button>
            <button type="button" className="primary-button" onClick={() => printRecord(selectedRecord, rows.findIndex(record => record.id === selectedRecord.id))}><Printer size={14}/> Print</button>
          </div>
        </div>
      </div>
    )}

    {editingRecord && (
      <div className="modal-overlay" onClick={() => setEditingRecord(null)}>
        <form className="modal" role="dialog" aria-modal="true" aria-labelledby="generic-edit-title" onClick={(event) => event.stopPropagation()} onSubmit={saveEdit}>
          <div className="modal-header">
            <div><h2 id="generic-edit-title">Edit Record</h2><p>{page}</p></div>
            <button type="button" onClick={() => setEditingRecord(null)} aria-label="Close"><X size={15}/></button>
          </div>
          <div className="aging-detail-body">
            <div className="form-grid">
              <label className="full">Description *<input value={editForm.description} onChange={(event) => setEditForm(previous => ({ ...previous, description: event.target.value }))} required autoFocus /></label>
              <label>Category *<input value={editForm.category} onChange={(event) => setEditForm(previous => ({ ...previous, category: event.target.value }))} required /></label>
              <label>Amount *<input type="number" min="0" step="0.01" value={editForm.amount} onChange={(event) => setEditForm(previous => ({ ...previous, amount: event.target.value }))} required /></label>
              <label>Date *<input type="date" value={editForm.date} onChange={(event) => setEditForm(previous => ({ ...previous, date: event.target.value }))} required /></label>
              <label>Status *<input value={editForm.status} onChange={(event) => setEditForm(previous => ({ ...previous, status: event.target.value }))} required /></label>
            </div>
            {formError && <p className="contract-alert" role="alert"><AlertTriangle size={16}/> {formError}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="light-button" onClick={() => setEditingRecord(null)}>Cancel</button>
            <button type="submit" className="primary-button">Save Changes</button>
          </div>
        </form>
      </div>
    )}
  </>;
}

function ReportContent({ page, onPrint, transactions }) {
  const revenue = transactions.filter(x=>x.type === "Income" && x.status !== "Pending").reduce((a,x)=>a+Number(x.amount||0),0);
  const expenses = transactions.filter(x=>x.type === "Expense" && x.status !== "Pending").reduce((a,x)=>a+Number(x.amount||0),0);
  const payroll = transactions.filter(x=>x.type === "Expense" && /payroll|salary/i.test(x.category + " " + x.description)).reduce((a,x)=>a+Number(x.amount||0),0);
  const profit = revenue - expenses;
  return <div className="report-grid">
    <div className="card report-main">
      <div className="report-heading"><div><h3>{page}</h3><p>Financial report for the current reporting period.</p></div><button className="primary-button" onClick={onPrint}><FileDown size={15}/> Print / Save PDF</button></div>
      <div className="report-lines"><div><span>Revenue</span><b>{money(revenue)}</b></div><div><span>Operating Expenses</span><b>{money(expenses)}</b></div><div><span>Payroll Costs</span><b>{money(payroll)}</b></div><div className="total"><span>Net Profit</span><b>{money(profit)}</b></div></div>
    </div>
    <div className="card"><h3>Financial Summary</h3><div className="kpi-list"><div><span>Profit Margin</span><strong>37.7%</strong></div><div><span>Collection Rate</span><strong>82.4%</strong></div><div><span>Budget Utilization</span><strong>74%</strong></div><div><span>Cash Coverage</span><strong>3.2 mo.</strong></div></div></div>
  </div>;
}

function ArchivedPage({ records, onRestore, search }) {
  const [revealedValues, setRevealedValues] = useState({});
  const [showAllValues, setShowAllValues] = useState(false);

  const toggleValue = (id) => {
    setRevealedValues(prev => ({
      ...prev,
      [id]: !(prev[id] ?? showAllValues)
    }));
  };

  const toggleAllValues = () => {
    const nextState = !showAllValues;
    setShowAllValues(nextState);
    const updated = {};
    records.forEach(r => {
      updated[r.id] = nextState;
    });
    setRevealedValues(updated);
  };

  const filtered = records.filter(r => `${r.id} ${r.client} ${r.status}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="management-page">
    <Breadcrumb current="Archived Records" parent="Archive Management" />
    <div className="management-header"><div><h2>Archived Records</h2><p>Search and restore archived contracts and financial records.</p></div><div className="management-actions"><button className="light-button" onClick={() => window.location.reload()}><RotateCcw size={15}/> Refresh</button></div></div>
    <div className="table-card"><table><thead><tr>
      <th>Record ID</th>
      <th>Client</th>
      <th>
        <div className="th-with-action">
          <span>Value</span>
          <button
            type="button"
            className="header-visibility-toggle"
            onClick={toggleAllValues}
            title={showAllValues ? "Hide all values" : "Show all values"}
            aria-label={showAllValues ? "Hide all values" : "Show all values"}
          >
            {showAllValues ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
      </th>
      <th>Original End Date</th>
      <th>Archived By</th>
      <th>Archived At</th>
      <th>Action</th>
    </tr></thead><tbody>
      {filtered.length ? filtered.map(r => {
        const isRevealed = revealedValues[r.id] ?? showAllValues;
        return <tr key={r.id}>
          <td className="link-cell">{r.id}</td>
          <td className="strong-cell">{r.client}</td>
          <td className="money-cell">
            <button
              type="button"
              className={`contract-value-button ${isRevealed ? "revealed" : "masked"}`}
              onClick={() => toggleValue(r.id)}
              title={isRevealed ? "Click to hide value" : "Click to view value"}
            >
              <span>{isRevealed ? money(r.value) : "*"}</span>
              <span className="contract-value-icon">
                {isRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
              </span>
            </button>
          </td>
          <td>{r.end}</td>
          <td>{r.archivedBy || "Admin User"}</td>
          <td>{r.archivedAt || "—"}</td>
          <td><button className="restore-button" onClick={() => onRestore(r)}><ArchiveRestore size={15}/> Restore</button></td>
        </tr>;
      }) : <tr><td colSpan="7" className="empty">No archived records found.</td></tr>}
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
    { label: "Account number", key: "accountNumber", value: "4021" },
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
  const buildValues = () => Object.fromEntries(fields.map(field => [field.key, field.value]));
  const [values, setValues] = useState(buildValues);
  const [saved, setSaved] = useState(false);
  const [renderedPage, setRenderedPage] = useState(page);

  // Switching settings pages swaps the whole form, so the state has to be replaced in the
  // same render that renders the new fields. Rebuilding it in a useEffect instead commits
  // one render where the new page's fields are already mounted while the state still holds
  // the previous page's keys, so their `value` is undefined for that commit; the effect then
  // fills them in and React reports the input as having changed from uncontrolled to
  // controlled. Adjusting state during render keeps the form and the page in step.
  if (page !== renderedPage) {
    setRenderedPage(page);
    setValues(buildValues());
    setSaved(false);
  }

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
      {fields.map(field => <div className="admin-setting-field" key={`${page}-${field.key}`}>
        <label htmlFor={`setting-${field.key}`}>{field.label}</label>
        {field.type === "toggle" ? (
          <button id={`setting-${field.key}`} type="button" className={`setting-toggle ${values[field.key] ? "enabled" : ""}`} onClick={() => updateValue(field.key, !values[field.key])} aria-pressed={!!values[field.key]}>{values[field.key] ? "Enabled" : "Disabled"}</button>
        ) : field.options ? (
          <select id={`setting-${field.key}`} value={values[field.key] ?? field.value ?? ""} onChange={event => updateValue(field.key, event.target.value)}>{field.options.map(option => <option key={option}>{option}</option>)}</select>
        ) : field.type === "file" ? (
          /* A file input cannot be given a value, so it stays uncontrolled by design and
             reports the chosen file's name through the same form state. */
          <input id={`setting-${field.key}`} type="file" accept="image/*" onChange={event => updateValue(field.key, event.target.files?.[0]?.name || "")} />
        ) : (
          <input id={`setting-${field.key}`} type={field.type === "readonly" ? "text" : (field.type || "text")} value={values[field.key] ?? field.value ?? ""} readOnly={field.type === "readonly"} onChange={event => updateValue(field.key, event.target.value)} />
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

function TransactionTable({ transactions }) {
  const [revealedAmounts, setRevealedAmounts] = useState({});

  const toggleAmount = (id) => {
    setRevealedAmounts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return <div className="table-wrapper"><table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Account</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead><tbody>{transactions.map(t=><tr key={t.id}><td>{t.date}</td><td className="strong-cell">{t.description}</td><td>{t.category}</td><td>{t.account}</td><td><span className={`badge ${t.type.toLowerCase()}`}>{t.type}</span></td><td className={`money-cell masked-amount ${t.type === "Income" ? "green-text" : "red-text"}`} onClick={() => toggleAmount(t.id)} title={revealedAmounts[t.id] ? "Click to hide amount" : "Click to reveal amount"}>{revealedAmounts[t.id] ? `${t.type === "Income" ? "+" : "-"}${money(t.amount)}` : "*"}</td><td><span className={`contract-status ${t.status.toLowerCase()}`}>{t.status}</span></td></tr>)}</tbody></table></div>;
}

function Modal({ title, onClose, onAudit, onSave, onSaveContract }) {
  const [file, setFile] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash Payment");
  const isContract = title.includes("Contract");
  const isPayment = /Payment|Invoice|Receipt|Expense|Revenue|Budget Request/i.test(title);

  const [form, setForm] = useState({
    reference: "",
    name: "",
    company: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
    billingCycle: "Monthly",
    paymentTerms: "Net 30 Days",
    contractType: "Service Agreement",
    description: "",
    status: "Active",
  });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    const amount = Number(form.amount || 0);
    if (!form.name.trim() || !form.date || amount <= 0) {
      window.alert("Please enter the name, amount, and date.");
      return;
    }
    if (isContract) {
      const billingMultiplier = form.billingCycle === "Quarterly" ? 4 : form.billingCycle === "Annually" ? 1 : 12;
      const billingAmount = Math.round(amount / billingMultiplier);
      const record = {
        id: form.reference.trim() || `CON-${String(Date.now()).slice(-4)}`,
        client: form.name.trim(),
        company: form.company?.trim() || form.name.trim(),
        contactPerson: form.contactPerson?.trim() || "Not specified",
        contactEmail: form.contactEmail?.trim() || "billing@client.com",
        contactPhone: form.contactPhone?.trim() || "+63 917 000 0000",
        value: amount,
        start: form.startDate || form.date,
        end: form.endDate || form.date,
        billingCycle: form.billingCycle || "Monthly",
        billingAmount,
        paymentTerms: form.paymentTerms || "Net 30 Days",
        contractType: form.contractType || "Service Agreement",
        status: form.status === "Completed" ? "Active" : form.status,
        renewals: [],
        documents: file ? [{ id: `DOC-${Date.now()}`, name: file.name, uploadedAt: new Date().toLocaleString() }] : [],
      };
      onSaveContract?.(record);
    } else {
      const expense = /Expense|Payment|Payable|Supply|Utility|Payroll|Cash|Check|Bank/i.test(title);
      const record = {
        id: Date.now(),
        date: form.date,
        description: form.description.trim() || `${title} - ${form.name.trim()}`,
        category: title.replace(/^New\s+/, ""),
        type: expense ? "Expense" : "Income",
        amount,
        account: paymentMethod,
        status: form.status,
        client: form.name.trim(),
        reference: form.reference.trim() || `REF-${Date.now()}`,
      };
      onSave?.(record);
    }
    if (file) onAudit?.(`Created ${title} with supporting document`, file.name);
    else onAudit?.(`Created ${title}`);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            <p>Enter the information below to create a new {isContract ? "client contract" : "record"}.</p>
          </div>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label>
              Reference / Contract No.
              <input value={form.reference} onChange={e=>update("reference",e.target.value)} placeholder="e.g. CON-006" />
            </label>
            <label>
              Client Name
              <input value={form.name} onChange={e=>update("name",e.target.value)} placeholder="e.g. Acme Corporation" required />
            </label>
            {isContract && (
              <>
                <label>
                  Company / Organization
                  <input value={form.company} onChange={e=>update("company",e.target.value)} placeholder="e.g. Acme Industrial Holdings" />
                </label>
                <label>
                  Contact Person
                  <input value={form.contactPerson} onChange={e=>update("contactPerson",e.target.value)} placeholder="e.g. Sarah Jenkins" />
                </label>
                <label>
                  Contact Email
                  <input type="email" value={form.contactEmail} onChange={e=>update("contactEmail",e.target.value)} placeholder="e.g. sarah@acme.com" />
                </label>
                <label>
                  Contact Phone
                  <input value={form.contactPhone} onChange={e=>update("contactPhone",e.target.value)} placeholder="e.g. +63 917 555 0101" />
                </label>
              </>
            )}
            <label>
              {isContract ? "Total Contract Value (PHP)" : "Amount (PHP)"}
              <input value={form.amount} onChange={e=>update("amount",e.target.value)} type="number" min="0" step="0.01" placeholder="0.00" required />
            </label>
            <label>
              {isContract ? "Contract Agreement Date" : "Date"}
              <input value={form.date} onChange={e=>update("date",e.target.value)} type="date" required />
            </label>
            {isContract && (
              <>
                <label>
                  Start Date
                  <input value={form.startDate} onChange={e=>update("startDate",e.target.value)} type="date" />
                </label>
                <label>
                  Expiration Date
                  <input value={form.endDate} onChange={e=>update("endDate",e.target.value)} type="date" required />
                </label>
                <label>
                  Billing Cycle
                  <select value={form.billingCycle} onChange={e=>update("billingCycle",e.target.value)}>
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Semi-Annually</option>
                    <option>Annually</option>
                    <option>Milestone-Based</option>
                  </select>
                </label>
                <label>
                  Payment Terms
                  <select value={form.paymentTerms} onChange={e=>update("paymentTerms",e.target.value)}>
                    <option>Net 30 Days</option>
                    <option>Net 15 Days</option>
                    <option>Net 60 Days</option>
                    <option>Due on Receipt</option>
                  </select>
                </label>
                <label>
                  Contract Type
                  <select value={form.contractType} onChange={e=>update("contractType",e.target.value)}>
                    <option>Service Agreement</option>
                    <option>Maintenance Contract</option>
                    <option>IT & Network Management</option>
                    <option>Logistics Management</option>
                    <option>Energy Infrastructure Service</option>
                    <option>General Consulting</option>
                  </select>
                </label>
              </>
            )}
            {isPayment && (
              <label>
                Payment Method
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option>Supply Payment</option>
                  <option>Cash Payment</option>
                  <option>Check Payment</option>
                  <option>Bank Payment</option>
                </select>
              </label>
            )}
            <label className="full">
              Description / Notes
              <input value={form.description} onChange={e=>update("description",e.target.value)} placeholder="Enter description or terms notes" />
            </label>
            <label>
              Status
              <select value={form.status} onChange={e=>update("status",e.target.value)}>
                <option>Active</option>
                <option>Pending</option>
                <option>Completed</option>
                <option>Scheduled</option>
                <option>For Approval</option>
              </select>
            </label>
            <label>
              Supporting Document (PDF)
              <input type="file" accept="application/pdf" onChange={e=>setFile(e.target.files?.[0] || null)} />
            </label>
            {file && <div className="file-preview full"><FileText size={16}/> {file.name} <span>{Math.round(file.size / 1024)} KB</span></div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>
            <button className="save-button">Save Record</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;

// Tax Calculation reads its records from the same Node backend as the other modules
// (GET /api/tax/calculations). Nothing here is typed in: the cards, the table and
// the detail panel all derive from what the API returns.
//
// The money is derived server-side. The React page only reads taxable_amount,
// tax_amount, withholding_tax and total_tax, so the browser can never be the place
// where a tax figure was worked out. A record's colour comes from the status the
// API returned, through taxStatusClass.

const TAX_TYPES = ['VAT', 'Withholding Tax', 'Tax-Exempt', 'Zero-Rated'];
const TAX_STATUSES = ['Pending Review', 'Calculated', 'Verified', 'Rejected', 'Cancelled'];
const TAX_TRANSACTION_TYPES = [
  'Service Invoice', 'Client Payment', 'Supplier Payment',
  'Utility Bill', 'Office Expense', 'Vendor Invoice',
];
const TAX_ADJUSTMENT_REASONS = [
  'Tax-exempt amount',
  'Zero-rated amount',
  'Taxable adjustment',
  'Withholding tax',
  'Discount affecting taxable amount',
  'Tax credit',
  'Previous tax adjustment',
  'Other approved adjustment',
];

const taxMoney = (value) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const taxDate = (ymd) => {
  if (!ymd) return "—";
  const date = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const taxDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const taxBlank = (v) => (v === null || v === undefined || v === "" || v === "—" ? "—" : v);

const taxTodayYmd = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const taxSlug = (s) => String(s ?? "").trim().toLowerCase().replace(/\s+/g, "-");

// Keyed on the status the API returned. An unknown status falls back to the neutral
// class rather than silently borrowing another status's colour.
const TAX_STATUS_CLASS = {
  "pending-review": "tx-pending", calculated: "tx-calculated",
  verified: "tx-verified", rejected: "tx-rejected", cancelled: "tx-cancelled",
};
const taxStatusClass = (status) => `contract-status tx-status ${TAX_STATUS_CLASS[taxSlug(status)] || "tx-neutral"}`;

const TAX_TYPE_CLASS = {
  vat: "tx-vat", "withholding-tax": "tx-wht", "tax-exempt": "tx-exempt", "zero-rated": "tx-zero",
};
const taxTypeClass = (type) => `tx-type ${TAX_TYPE_CLASS[taxSlug(type)] || "tx-neutral"}`;

const taxFailure = (error, context) => {
  if (error && error.kind === "network") {
    return `The backend did not answer while loading ${context}. Start it with "npm start" in the Backend folder, then try again.`;
  }
  if (error && error.kind === "http") {
    return `The backend rejected the request for ${context} (HTTP ${error.status})${error.detail ? `: ${error.detail}` : "."}`;
  }
  return `${context} could not be loaded: ${(error && error.message) || "unknown error"}.`;
};

const taxRequest = async (url, options = {}) => {
  let response;
  try {
    response = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  } catch (cause) {
    const error = new Error("The backend could not be reached.");
    error.kind = "network";
    error.cause = cause;
    throw error;
  }
  const text = await response.text();
  let payload = null;
  if (text) { try { payload = JSON.parse(text); } catch { payload = null; } }
  if (!response.ok) {
    const error = new Error(payload?.message || response.statusText || "Request failed");
    error.kind = "http";
    error.status = response.status;
    error.detail = payload?.message || null;
    // The API can return several validation findings; they are surfaced together
    // rather than showing only the first.
    error.findings = payload?.errors || null;
    throw error;
  }
  return payload;
};

// A card's peso total stays hidden as "*" until that card is clicked, matching the
// other payable modules. Each card has its own reveal key.
//
// `forceOpen` lets a page-wide "Show amounts" switch override the individual state
// without altering it, so turning the switch off restores whatever the user had
// revealed before rather than resetting everything.
const TaxCardAmount = ({ id, value, revealed, onToggle, tone, forceOpen = false }) => {
  const isOpen = forceOpen || Boolean(revealed[id]);
  return (
    <strong
      className={`vendor-summary-amount payable-card-amount ${isOpen ? "is-open" : ""} ${tone}`}
      role="button"
      tabIndex={0}
      aria-label={isOpen ? `Hide total, currently ${taxMoney(value)}` : "Reveal total"}
      title={isOpen ? "Click to hide amount" : "Click to reveal amount"}
      onClick={event => { event.stopPropagation(); onToggle(id); }}
      onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onToggle(id); } }}
    >
      {isOpen ? taxMoney(value) : "*"}
    </strong>
  );
};

const TaxMasked = ({ rowId, value, revealed, onToggle, forceOpen = false }) => {
  const key = `${rowId}-amount`;
  const isOpen = forceOpen || Boolean(revealed[key]);
  return (
    <span
      className="masked-amount"
      role="button"
      tabIndex={0}
      aria-label={isOpen ? `Hide amount, currently ${taxMoney(value)}` : "Reveal amount"}
      title={isOpen ? "Click to hide amount" : "Click to reveal amount"}
      onClick={event => { event.stopPropagation(); onToggle(key); }}
      onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onToggle(key); } }}
    >
      {isOpen ? taxMoney(value) : "*"}
    </span>
  );
};

// ============================================================
// Tax Records page
// ============================================================
//
// The permanent filed history, downstream of Tax Calculation. It reuses the tax
// module's helpers (taxRequest, taxMoney, taxDate, taxFailure, the masked-amount
// widgets) so the two tax pages look and behave identically.
//
// Every figure below is read from the API. The page never computes a total of its own
// beyond the arithmetic the user can see on screen, and it never derives a status: the
// badge class comes from whatever status the backend returned, so a record the API
// reports as Filed always renders as Filed.

// New Tax Record. A record is normally PROMOTED from a reviewed calculation rather than
// typed, because the figures then come from the working paper and cannot disagree with
// it. The eligible list is what the API says may still be filed; anything already
// recorded, or not yet reviewed, is not offered.
const TaxRecordIntakeModal = ({ eligible, saving, onClose, onSubmit }) => {
  const [choice, setChoice] = useState(eligible[0] ? String(eligible[0].id) : "");
  const selected = eligible.find(c => String(c.id) === choice) || null;
  return <div className="modal-overlay" onClick={() => !saving && onClose()}>
    <div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <div>
          <h2>New Tax Record</h2>
          <p>Created from a calculation that has already been reviewed.</p>
        </div>
        <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
      </div>
      <div className="form-grid">
        {eligible.length === 0
          ? <p className="full">No reviewed calculation is waiting to be filed. Open Tax Calculation and verify a calculation first.</p>
          : <>
            <label className="full">Reviewed Calculation
              <select value={choice} onChange={e => setChoice(e.target.value)}>
                {eligible.map(c => <option key={c.id} value={c.id}>{c.tax_calculation_id} — {c.transaction_type} — {taxBlank(c.reference_number)} — {taxMoney(c.final_tax_amount)}</option>)}
              </select>
            </label>
            {selected && <>
              <label>Client / Supplier<input readOnly value={taxBlank(selected.client_supplier)} /></label>
              <label>Tax Type<input readOnly value={`${selected.tax_type} @ ${selected.tax_rate}%`} /></label>
              <label>Taxable Amount<input readOnly value={taxMoney(selected.taxable_amount)} /></label>
              <label>Tax Amount<input readOnly value={taxMoney(selected.tax_amount)} /></label>
              <label>Withholding Tax<input readOnly value={taxMoney(selected.withholding_tax)} /></label>
              <label>Final Tax Amount<input readOnly value={taxMoney(selected.final_tax_amount)} /></label>
            </>}
          </>}
      </div>
      <div className="modal-footer">
        <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="button" className="primary" disabled={saving || !selected}
          onClick={() => onSubmit({ source_calculation_id: Number(choice) })}>
          {saving ? "Creating..." : "Create Record"}
        </button>
      </div>
    </div>
  </div>;
};


// Edit. A Filed or Cancelled record is closed to editing by the API, and the form says
// so rather than letting the user fill in fields that will be refused on save.
const TaxRecordEditModal = ({ record, saving, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    transaction_type: record.transaction_type || "",
    reference_number: record.reference_number || "",
    client_supplier: record.client_supplier || "",
    tax_type: record.tax_type || "VAT",
    tax_rate: String(record.tax_rate ?? 12),
    taxable_amount: String(record.taxable_amount ?? 0),
    tax_amount: String(record.tax_amount ?? 0),
    withholding_tax: String(record.withholding_tax ?? 0),
    tax_adjustment: String(record.tax_adjustment ?? 0),
    remarks: record.remarks || "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const locked = record.record_status === "Filed" || record.record_status === "Cancelled";
  // Preview of the identity the API enforces, so the arithmetic is visible before saving
  // rather than reported as a 422 afterwards.
  const preview = Math.round(((Number(form.tax_amount) || 0) - (Number(form.withholding_tax) || 0) + (Number(form.tax_adjustment) || 0)) * 100) / 100;

  return <div className="modal-overlay" onClick={() => !saving && onClose()}>
    <form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => {
      e.preventDefault();
      onSubmit({
        transaction_type: form.transaction_type,
        reference_number: form.reference_number,
        client_supplier: form.client_supplier,
        tax_type: form.tax_type,
        tax_rate: Number(form.tax_rate),
        taxable_amount: Number(form.taxable_amount),
        tax_amount: Number(form.tax_amount),
        withholding_tax: Number(form.withholding_tax),
        tax_adjustment: Number(form.tax_adjustment),
        remarks: form.remarks,
      });
    }}>
      <div className="modal-header">
        <div>
          <h2>Edit {record.tax_record_id}</h2>
          <p>
            {locked
              ? `${record.tax_record_id} is ${record.record_status.toLowerCase()} and can no longer be edited.`
              : record.record_status === "Verified"
                ? "Already verified — the amounts cannot be changed."
                : `Currently ${taxMoney(record.final_tax_amount)} final tax.`}
          </p>
        </div>
        <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
      </div>
      <div className="form-grid">
        <label>Transaction Type<input value={form.transaction_type} disabled={locked || saving} onChange={e => set("transaction_type", e.target.value)} /></label>
        <label>Reference Number<input value={form.reference_number} disabled={locked || saving} onChange={e => set("reference_number", e.target.value)} /></label>
        <label className="full">Client / Supplier<input value={form.client_supplier} disabled={locked || saving} onChange={e => set("client_supplier", e.target.value)} /></label>
        <label>Tax Type
          <select value={form.tax_type} disabled={locked || saving} onChange={e => set("tax_type", e.target.value)}>
            {TAX_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label>Tax Rate (%)<input type="number" min="0" max="100" step="0.01" value={form.tax_rate} disabled={locked || saving} onChange={e => set("tax_rate", e.target.value)} /></label>
        <label>Taxable Amount<input type="number" min="0" step="0.01" value={form.taxable_amount} disabled={locked || saving} onChange={e => set("taxable_amount", e.target.value)} /></label>
        <label>Tax Amount<input type="number" min="0" step="0.01" value={form.tax_amount} disabled={locked || saving} onChange={e => set("tax_amount", e.target.value)} /></label>
        <label>Withholding Tax<input type="number" min="0" step="0.01" value={form.withholding_tax} disabled={locked || saving} onChange={e => set("withholding_tax", e.target.value)} /></label>
        <label>Tax Adjustment<input type="number" step="0.01" value={form.tax_adjustment} disabled={locked || saving} onChange={e => set("tax_adjustment", e.target.value)} /></label>
        <label className="full">Remarks<textarea rows="2" value={form.remarks} disabled={locked || saving} onChange={e => set("remarks", e.target.value)} /></label>
        <p className="full">Tax less withholding, plus adjustment: <strong>{taxMoney(preview)}</strong> (stored: {taxMoney(record.final_tax_amount)})</p>
      </div>
      <div className="modal-footer">
        <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="primary" disabled={saving || locked}>{saving ? "Saving..." : "Save Changes"}</button>
      </div>
    </form>
  </div>;
};


// Record a remittance. The amount is capped at what is still outstanding, because paying
// more than was filed would overstate what was remitted to the authority.
const TaxRecordRemitModal = ({ record, saving, onClose, onSubmit }) => {
  const remaining = Number(record.tax_remaining) || 0;
  const [amount, setAmount] = useState(String(remaining));
  const value = Number(amount) || 0;
  const invalid = value <= 0 || value > remaining;
  return <div className="modal-overlay" onClick={() => !saving && onClose()}>
    <form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); onSubmit(value); }}>
      <div className="modal-header">
        <div><h2>Record Remittance</h2><p>{record.tax_record_id} — {taxMoney(remaining)} outstanding</p></div>
        <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
      </div>
      <div className="form-grid">
        <label>Final Tax Amount<input readOnly value={taxMoney(record.final_tax_amount)} /></label>
        <label>Already Paid<input readOnly value={taxMoney(record.tax_paid)} /></label>
        <label className="full">Amount Remitted<input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /></label>
        {value > remaining && <p className="full">That is more than the {taxMoney(remaining)} still outstanding.</p>}
        {value <= 0 && <p className="full">Enter an amount greater than zero.</p>}
      </div>
      <div className="modal-footer">
        <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="primary" disabled={saving || invalid}>{saving ? "Recording..." : "Record Remittance"}</button>
      </div>
    </form>
  </div>;
};

// File the return. This is the terminal step: the API locks the record afterwards, so
// the modal says so before the user commits rather than after.
const TaxRecordFileModal = ({ record, saving, onClose, onSubmit }) => {
  const [returnNumber, setReturnNumber] = useState(record.return_number || "");
  return <div className="modal-overlay" onClick={() => !saving && onClose()}>
    <form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); onSubmit(returnNumber.trim()); }}>
      <div className="modal-header">
        <div>
          <h2>File Return</h2>
          <p>{record.tax_record_id} — final tax {taxMoney(record.final_tax_amount)}</p>
        </div>
        <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
      </div>
      <div className="form-grid">
        <p className="full">Filing submits this return and closes the record. A filed record can no longer be edited — only cancelled and replaced — so check the figures first.</p>
        <label className="full">Return Number<input value={returnNumber} placeholder="e.g. BIR-2550-Q3" onChange={e => setReturnNumber(e.target.value)} /></label>
      </div>
      <div className="modal-footer">
        <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="primary" disabled={saving || !returnNumber.trim()}>{saving ? "Filing..." : "File Return"}</button>
      </div>
    </form>
  </div>;
};

// Cancel. A reason is required by the API, and the field is mandatory here for the same
// reason: a cancelled filing drops out of the totals and has to stay explainable.
const TaxRecordCancelModal = ({ record, saving, onClose, onSubmit }) => {
  const [reason, setReason] = useState("");
  return <div className="modal-overlay" onClick={() => !saving && onClose()}>
    <form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); onSubmit(reason.trim()); }}>
      <div className="modal-header">
        <div><h2>Cancel {record.tax_record_id}</h2><p>Final tax {taxMoney(record.final_tax_amount)}</p></div>
        <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
      </div>
      <div className="form-grid">
        <p className="full">This record will be marked Cancelled and drop out of the filing totals. It stays in the ledger with its full history.</p>
        <label className="full">Cancellation Reason<textarea rows="3" value={reason} onChange={e => setReason(e.target.value)} /></label>
      </div>
      <div className="modal-footer">
        <button type="button" onClick={onClose} disabled={saving}>Keep Record</button>
        <button type="submit" className="primary" disabled={saving || !reason.trim()}>{saving ? "Cancelling..." : "Cancel Record"}</button>
      </div>
    </form>
  </div>;
};


// Row overflow menu. Each action is disabled with a stated reason rather than hidden,
// so an unavailable step is explained instead of silently missing.
const TaxRecordMenu = ({ record, saving, onClose, onEdit, onRemit, onFile, onCancel }) => {
  const closed = record.record_status === "Filed";
  const cancelled = record.record_status === "Cancelled";
  const settled = record.payment_status === "Paid";
  return <div className="vendor-action-menu" onClick={e => e.stopPropagation()}>
    <button disabled={saving || closed || cancelled} title={closed ? `${record.tax_record_id} is filed and can no longer be edited.` : cancelled ? `${record.tax_record_id} is cancelled.` : "Edit this record"} onClick={onEdit}>✏ Edit Record</button>
    <button disabled={saving || cancelled || settled || record.final_tax_amount <= 0}
      title={cancelled ? `${record.tax_record_id} is cancelled.` : settled ? `${record.tax_record_id} is paid in full — nothing left to remit.` : record.final_tax_amount <= 0 ? `${record.tax_record_id} has no final tax amount to remit.` : "Record a remittance to the authority"}
      onClick={onRemit}>₳ Record Remittance</button>
    <button disabled={saving || record.record_status !== "Verified"}
      title={record.record_status !== "Verified" ? `${record.tax_record_id} must be verified before it can be filed.` : "Submit the return and lock the record"}
      onClick={onFile}>🖹 File Return</button>
    <button disabled={saving || closed || cancelled}
      title={closed ? `${record.tax_record_id} is already filed.` : cancelled ? `${record.tax_record_id} is already cancelled.` : "Cancel this record"}
      onClick={onCancel}>✕ Cancel Record</button>
    <button disabled={saving} onClick={onClose}>Close</button>
  </div>;
};

const TaxRecordDetail = ({ record, tab, setTab, revealed, toggle, saving, onVerify, onForFiling, onPrint }) => {
  const money = (field, key) => <TaxMasked rowId={`${record.id}-${key}`} value={record[field]} revealed={revealed} onToggle={toggle} />;
  const trail = Array.isArray(record.history) ? record.history : [];
  const tabs = ["Record", "Computation", "Filing", "History"];
  return <div className="vendor-detail-panel">
    <div className="vendor-detail-header">
      <div>
        <strong>{record.tax_record_id}</strong>
        <span className="vendor-detail-kicker">{taxBlank(record.client_supplier)} &middot; {taxBlank(record.reference_number)}</span>
      </div>
      <div className="vendor-detail-block">
        <span className={taxRecordBadge(record.record_status, TAX_RECORD_STATUS_CLASS)}>{record.record_status}</span>
        <span className={taxRecordBadge(record.filing_status, TAX_FILING_STATUS_CLASS)}>{record.filing_status}</span>
        <span className={taxRecordBadge(record.payment_status, TAX_PAYMENT_STATUS_CLASS)}>{record.payment_status}</span>
      </div>
      <div className="vendor-detail-actions">
        {record.record_status === "Draft" && <button className="light-button" disabled={saving} onClick={onVerify}>✓ Verify</button>}
        {record.record_status === "Verified" && <button className="light-button" disabled={saving} onClick={onForFiling}>🖹 For Filing</button>}
        <button className="light-button" onClick={onPrint}>🖨 Print</button>
      </div>
    </div>

    <div className="vendor-detail-tabs">
      {tabs.map(t => <button key={t} className={tab === t ? "is-active" : ""} onClick={() => setTab(t)}>{t}</button>)}
    </div>

    {tab === "Record" && <div className="vendor-detail-grid">
      <div className="vendor-detail-list">
        <h4>Transaction</h4>
        <div><span>Tax Record ID</span><b>{record.tax_record_id}</b></div>
        <div><span>Tax Period</span><b>{taxBlank(record.tax_period)}</b></div>
        <div><span>Transaction Date</span><b>{taxDate(record.transaction_date)}</b></div>
        <div><span>Transaction Type</span><b>{taxBlank(record.transaction_type)}</b></div>
        <div><span>Reference Number</span><b>{taxBlank(record.reference_number)}</b></div>
        <div><span>Client / Supplier</span><b>{taxBlank(record.client_supplier)}</b></div>
        <div><span>Source Calculation</span><b>{taxBlank(record.source_reference)}</b></div>
      </div>
      <div className="vendor-detail-list">
        <h4>Signatories</h4>
        <div><span>Calculated By</span><b>{taxBlank(record.calculated_by)}</b></div>
        <div><span>Verified By</span><b>{taxBlank(record.verified_by)}</b></div>
        <div><span>Verified On</span><b>{taxDate(record.verified_on)}</b></div>
        <div><span>Filed By</span><b>{taxBlank(record.filed_by)}</b></div>
        <div><span>Filed On</span><b>{taxDate(record.filed_on)}</b></div>
        <div><span>Created Date</span><b>{taxDate(record.created_date)}</b></div>
      </div>
      {record.remarks && <div className="vendor-detail-list"><h4>Remarks</h4><p className="vendor-detail-note">{record.remarks}</p></div>}
    </div>}

    {tab === "Computation" && <div className="vendor-detail-grid">
      <div className="vendor-detail-list">
        <h4>Tax Computation</h4>
        <div><span>Tax Type</span><b><span className={taxTypeClass(record.tax_type)}>{record.tax_type}</span></b></div>
        <div><span>Taxable Amount</span><b className="money-cell">{money("taxable_amount", "d-taxable")}</b></div>
        <div><span>Tax Rate</span><b>{record.tax_rate}%</b></div>
        <div><span>Tax Amount</span><b className="money-cell">{money("tax_amount", "d-tax")}</b></div>
        <div><span>Less: Withholding Tax</span><b className="money-cell">{money("withholding_tax", "d-wht")}</b></div>
        <div><span>Tax Adjustment</span><b className="money-cell">{money("tax_adjustment", "d-adj")}</b></div>
      </div>
      <div className="vendor-detail-list">
        <h4>Final Position</h4>
        <div><span>Final Tax Amount</span><b className="money-cell">{money("final_tax_amount", "d-final")}</b></div>
        <div><span>Tax Paid</span><b className="money-cell">{money("tax_paid", "d-paid")}</b></div>
        <div><span>Outstanding</span><b className="money-cell">{money("tax_remaining", "d-rem")}</b></div>
        <div><span>Record Status</span><b>{record.record_status}</b></div>
        <div><span>Payment Status</span><b>{record.payment_status}</b></div>
      </div>
    </div>}

    {tab === "Filing" && <div className="vendor-detail-grid">
      <div className="vendor-detail-list">
        <h4>Filing</h4>
        <div><span>Record Status</span><b>{record.record_status}</b></div>
        <div><span>Filing Status</span><b>{record.filing_status}</b></div>
        <div><span>Return Number</span><b>{taxBlank(record.return_number)}</b></div>
        <div><span>Filed On</span><b>{taxDate(record.filed_on)}</b></div>
        <div><span>Filed By</span><b>{taxBlank(record.filed_by)}</b></div>
      </div>
      <div className="vendor-detail-list">
        <h4>Remittance</h4>
        <div><span>Payment Status</span><b>{record.payment_status}</b></div>
        <div><span>Final Tax Amount</span><b className="money-cell">{money("final_tax_amount", "f-final")}</b></div>
        <div><span>Tax Paid</span><b className="money-cell">{money("tax_paid", "f-paid")}</b></div>
        <div><span>Outstanding</span><b className="money-cell">{money("tax_remaining", "f-rem")}</b></div>
      </div>
    </div>}

    {tab === "History" && <div className="vendor-timeline">
      {trail.length === 0 ? <p className="vendor-detail-note">No history recorded yet.</p>
        : trail.map((h, i) => <div className="vendor-timeline-item" key={h.id || i}>
          <span className="vendor-timeline-dot" />
          <div>
            <strong>{h.action}</strong>
            <span className="vendor-timeline-meta">{taxDateTime(h.created_at)} &middot; {taxBlank(h.actor)}</span>
            {h.remarks && <p>{h.remarks}</p>}
          </div>
        </div>)}
    </div>}
  </div>;
};

const TAX_RECORD_STATUSES_LOCAL = ["Draft", "Verified", "Filed", "Cancelled"];

const TAX_RECORD_FILING_STATUSES = ["Not Filed", "For Filing", "Filed"];
const TAX_RECORD_PAYMENT_STATUSES = ["Unpaid", "Partially Paid", "Paid"];

// Three separate axes, each with its own colour. Filing and record status are NOT the
// same thing: a record can be Verified (reviewed) while still Not Filed (not submitted),
// and it can be Filed (submitted) while Partially Paid (money still outstanding).
const TAX_RECORD_STATUS_CLASS = {
  draft: "tx-pending", verified: "tx-verified", filed: "tx-approved", cancelled: "tx-cancelled",
};
const TAX_FILING_STATUS_CLASS = {
  "not-filed": "tx-neutral", "for-filing": "tx-calculated", filed: "tx-approved",
};
const TAX_PAYMENT_STATUS_CLASS = {
  unpaid: "tx-neutral", "partially-paid": "tx-pending", paid: "tx-verified",
};

const taxRecordBadge = (status, map, prefix) =>
  `contract-status tx-status ${map[taxSlug(status)] || "tx-neutral"} ${prefix || ""}`;

// ============================================================
// Tax Filing Preparation page
// ============================================================
//
// Nothing on this page is typed in. The return's figures are assembled by the API from
// the live transaction tables (billings, payments, supplier_payments, utility_payments,
// office_expenses, vendor_payments) and re-derived on every read, so a new invoice or
// expense anywhere in PrimePower moves these totals. The page only displays what the API
// returns and sends workflow actions back.
//
// It reuses the tax module's helpers (taxRequest, taxMoney, taxDate, taxFailure,
// TaxCardAmount, TaxMasked) so all three tax pages look and behave identically.

// Row overflow menu. A blocked action states why in its title and stays dimmed rather
// than disappearing, so the workflow is always legible.
const TaxFilingMenu = ({ filing, saving, onClose, onEdit, onProfile, onDelete }) => {
  const filed = filing.filing_status === 'Filed';
  return <div className="vendor-action-menu" onClick={e => e.stopPropagation()}>
    <button disabled={saving || filed} title={filed ? `${filing.filing_id} has been filed and is closed.` : 'Edit the filing period and details'} onClick={onEdit}>✏ Edit Preparation</button>
    <button disabled={saving} title="Edit the company name, TIN and taxpayer details used on every return" onClick={onProfile}>🏢 Taxpayer Information</button>
    <button disabled={saving || filed} title={filed ? `${filing.filing_id} has been filed and cannot be deleted.` : 'Delete this preparation'} onClick={onDelete}>🗑 Delete</button>
    <button disabled={saving} onClick={onClose}>Close</button>
  </div>;
};

const TaxFilingDetail = ({ filing, tab, setTab, revealed, toggle, saving, onPrint, onDoc, onProfile, onSubmit, onApprove, onAdvance }) => {
  const s = filing.summary;
  const v = s.validation;
  const money = (field, key) => <TaxMasked rowId={`${filing.id}-${key}`} value={field} revealed={revealed} onToggle={toggle} />;
  const tabs = ['Summary', 'Transactions', 'Withholding', 'Documents', 'Validation'];

  return <div className="vendor-detail-panel">
    <div className="vendor-detail-header">
      <div>
        <strong>{filing.filing_id}</strong>
        <span className="vendor-detail-kicker">{filing.tax_type} &middot; {filing.period_label}</span>
      </div>
      <div className="vendor-detail-block">
        <span className={filingBadge(filing.filing_status, FILING_STATUS_CLASS)}>{filing.filing_status}</span>
        <span className={`tf-readiness ${filing.readiness === 100 ? "is-full" : ""}`}>{filing.readiness}% ready</span>
      </div>
      <div className="vendor-detail-actions">
        {filing.can_submit && <button className="light-button" disabled={saving} onClick={onSubmit}>Submit for Review</button>}
        {filing.can_mark_ready && <button className="light-button" disabled={saving} onClick={onApprove}>✓ Approve</button>}
        {filing.can_file && <button className="primary-button" disabled={saving} onClick={() => onAdvance("Filed")}>🖹 File Return</button>}
        {!filing.can_mark_ready && !filing.can_file && v.errors > 0 && <button className="light-button" disabled title={filing.blocking_reasons.join(' · ')}>Mark Ready</button>}
        <button className="light-button" disabled={saving} onClick={onProfile}>🏢</button>
        <button className="light-button" onClick={onPrint}>🖨</button>
      </div>
    </div>

    <div className="vendor-detail-tabs">
      {tabs.map(t => <button key={t} className={tab === t ? "is-active" : ""} onClick={() => setTab(t)}>{t}</button>)}
    </div>

    {tab === "Summary" && <div className="vendor-detail-grid">
      <div className="vendor-detail-list">
        <h4>Taxable Sales</h4>
        <div><span>Gross Sales</span><b className="money-cell">{money(s.sales.gross, "s-gross")}</b></div>
        <div><span>VATable Sales</span><b className="money-cell">{money(s.sales.taxable, "s-taxable")}</b></div>
        <div><span>Zero-Rated Sales</span><b className="money-cell">{money(s.sales.zero_rated, "s-zero")}</b></div>
        <div><span>Exempt Sales</span><b className="money-cell">{money(s.sales.exempt, "s-exempt")}</b></div>
        <div><span>Output Tax ({s.sales.rate}%)</span><b className="money-cell">{money(s.computation.output_tax, "s-out")}</b></div>
      </div>
      <div className="vendor-detail-list">
        <h4>Purchases / Expenses</h4>
        <div><span>Total Purchases</span><b className="money-cell">{money(s.purchases.gross, "p-gross")}</b></div>
        <div><span>VATable Purchases</span><b className="money-cell">{money(s.purchases.taxable, "p-taxable")}</b></div>
        <div><span>Exempt Purchases</span><b className="money-cell">{money(s.purchases.exempt, "p-exempt")}</b></div>
        <div><span>Input Tax ({s.purchases.rate}%)</span><b className="money-cell">{money(s.computation.input_tax, "p-in")}</b></div>
        <div><span>Client Payments Received</span><b className="money-cell">{money(s.receipts.gross, "p-receipts")}</b></div>
      </div>
      <div className="vendor-detail-list">
        <h4>Tax Computation</h4>
        {/* The waterfall is shown in full rather than collapsed into one figure. "Tax
            Payable" and "Credit" are different outcomes, and a reader cannot tell which
            applies without seeing that the prior credit was applied first. */}
        <div><span>Output Tax</span><b className="money-cell">{money(s.computation.output_tax, "c-out")}</b></div>
        <div><span>Less: Input Tax</span><b className="money-cell">{money(s.computation.input_tax, "c-in")}</b></div>
        <div className="tf-computation-sub">
          <span>This period&rsquo;s result</span>
          <b className="money-cell">{money(Math.abs(Number(s.computation.period_net || 0)), "c-period")}</b>
        </div>
        {Number(s.computation.prior_credit || 0) > 0 && <div className="tf-computation-sub">
          <span>Less: credit from earlier returns</span>
          <b className="money-cell">{money(s.computation.prior_credit, "c-prior")}</b>
        </div>}
        <div className="tf-computation-total">
          <span>Tax Payable</span>
          <b className="money-cell">{money(s.computation.payable, "c-payable")}</b>
        </div>
        <div className={Number(s.computation.credit || 0) > 0 ? "tf-computation-credit" : "tf-computation-sub"}>
          <span>Credit carried forward</span>
          <b className="money-cell">{money(s.computation.credit, "c-credit")}</b>
        </div>
        <div><span>Withholding Credited</span><b className="money-cell">{money(s.withholding.total, "c-wht")}</b></div>
        {Array.isArray(filing.credit_chain) && filing.credit_chain.length > 0 && <>
          <h4 className="tf-chain-title">Credit carried in from</h4>
          <ul className="tf-chain-list">
            {filing.credit_chain.map((c, i) => <li key={i}>
              <span className="mono">{c.filing_id}</span>
              <span>
                {c.credit_earned > 0
                  ? <>earned {taxMoney(c.credit_earned)} credit</>
                  : <>used {taxMoney(c.credit_used)} of credit</>}
                {c.balance_after > 0 && <> &middot; balance {taxMoney(c.balance_after)}</>}
              </span>
            </li>)}
          </ul>
        </>}
      </div>
      <div className="vendor-detail-list">
        <h4>Filing Period</h4>
        <div><span>Tax Type</span><b>{filing.tax_type}</b></div>
        <div><span>Filing Period</span><b>{filing.filing_period}</b></div>
        <div><span>Period Start</span><b>{taxDate(filing.period_start)}</b></div>
        <div><span>Period End</span><b>{taxDate(filing.period_end)}</b></div>
        <div><span>Filing Deadline</span><b>{taxDate(filing.filing_deadline)}</b></div>
        <div><span>Prepared By</span><b>{taxBlank(filing.prepared_by)}</b></div>
        <div><span>Reviewed By</span><b>{taxBlank(filing.reviewed_by)}</b></div>
        <div><span>Return Number</span><b>{taxBlank(filing.reference_number)}</b></div>
      </div>
    </div>}

    {tab === "Transactions" && <div className="tf-tx-tab">
      <div className="tf-tx-group">
        <h4>Sales <span>{s.sales.count} transaction(s) &middot; {taxMoney(s.sales.gross)}</span></h4>
        {s.sales.transactions.length === 0 ? <p className="vendor-detail-note">No sales fell within this period.</p>
          : <table className="tf-tx-table"><thead><tr>
            <th>Reference</th><th>Client</th><th>Date</th><th>Amount</th><th>Classification</th><th>Tax</th><th>Status</th>
          </tr></thead><tbody>
            {s.sales.transactions.map((t, i) => <tr key={`${t.source_table}-${t.reference_number}-${i}`}>
              <td className="mono">{t.reference_number}</td><td>{taxBlank(t.party)}</td><td>{taxDate(t.transaction_date)}</td>
              <td className="money-cell">{taxMoney(t.amount)}</td>
              <td><span className={`tx-status ${t.classification === "Taxable" ? "tx-verified" : t.classification === "Exempt" ? "tx-neutral" : "tx-calculated"}`}>{t.classification}</span></td>
              <td className="money-cell">{taxMoney(t.tax)}</td>
              <td>
                {/* The source module's own state, not a re-derivation. An invoice still
                    in dispute keeps its tax in the total above but is flagged here. */}
                <span className={filingBadge(t.verified ? "Verified" : "Pending Review", FILING_DOC_STATUS_CLASS)}>
                  {t.verified ? "✓ Verified" : "⚠ Review"}
                </span>
                <span className="tf-doc-reason">{taxBlank(t.status)}</span>
              </td>
            </tr>)}
          </tbody></table>}
      </div>
      <div className="tf-tx-group">
        <h4>Purchases &amp; Expenses <span>{s.purchases.count} transaction(s) &middot; {taxMoney(s.purchases.gross)}</span></h4>
        {s.purchases.transactions.length === 0 ? <p className="vendor-detail-note">No purchases fell within this period.</p>
          : <table className="tf-tx-table"><thead><tr>
            <th>Reference</th><th>Supplier</th><th>Source</th><th>Date</th><th>Amount</th><th>Classification</th><th>Input Tax</th><th>Status</th>
          </tr></thead><tbody>
            {s.purchases.transactions.map((t, i) => <tr key={`${t.source_table}-${t.reference_number}-${i}`}>
              <td className="mono">{t.reference_number}</td><td>{taxBlank(t.party)}</td><td>{t.source_group}</td>
              <td>{taxDate(t.transaction_date)}</td>
              <td className="money-cell">{taxMoney(t.amount)}</td>
              <td><span className={`tx-status ${t.classification === "Taxable" ? "tx-verified" : t.classification === "Exempt" ? "tx-neutral" : "tx-calculated"}`}>{t.classification}</span></td>
              <td className="money-cell">{taxMoney(t.tax)}</td>
              <td>
                <span className={filingBadge(t.verified ? "Verified" : "Pending Review", FILING_DOC_STATUS_CLASS)}>
                  {t.verified ? "✓ Verified" : "⚠ Review"}
                </span>
                <span className="tf-doc-reason">{taxBlank(t.status)}</span>
              </td>
            </tr>)}
          </tbody></table>}
      </div>
    </div>}

    {tab === "Withholding" && <div className="tf-tx-group">
      <h4>Withholding Tax Schedule <span>{s.withholding.count} certificate(s) &middot; {taxMoney(s.withholding.total)} credited</span></h4>
      {s.withholding.count === 0 ? <p className="vendor-detail-note">No withholding was recorded in this period.</p>
        : <table className="tf-tx-table"><thead><tr>
          <th>Supplier</th><th>Reference</th><th>Date</th><th>Gross Amount</th><th>Withholding</th><th>ATC</th><th>Status</th>
        </tr></thead><tbody>
          {s.withholding.items.map((w) => <tr key={w.tax_calculation_id}>
            <td>{taxBlank(w.supplier)}</td>
            <td className="mono">{taxBlank(w.reference_number)}</td>
            <td>{taxDate(w.transaction_date)}</td>
            <td className="money-cell">{taxMoney(w.gross_amount)}</td>
            <td className="money-cell">{taxMoney(w.withholding_tax)}</td>
            <td className="mono">{taxBlank(w.atc)}</td>
            <td>
              <span className={filingBadge(w.status, FILING_DOC_STATUS_CLASS)}>{w.status}</span>
              {w.status_reason && <span className="tf-doc-reason">{w.status_reason}</span>}
            </td>
          </tr>)}
        </tbody></table>}
      <p className="vendor-detail-note">
        Withholding is credited from verified tax calculations rather than recomputed here, so the
        return cannot disagree with a certificate that was already reviewed.
      </p>
    </div>}

    {tab === "Documents" && <div className="tf-doc-list">
      <div className="tf-doc-head">
        <h4>Supporting Documents</h4>
        <span>{filing.can_edit_documents ? "Click a document to attach or verify it." : `${filing.filing_id} has been filed; its documents are closed.`}</span>
      </div>
      {filing.documents.map((d) => <div className="tf-doc-row" key={d.id}>
        <div>
          <strong>{d.document_type}</strong>
          <span className="tf-doc-meta">
            {d.required ? "Required" : "Optional"}
            {d.file_name ? ` · ${d.file_name}` : ""}
            {d.uploaded_by ? ` · ${d.uploaded_by}` : ""}
            {d.verified_by ? ` · verified by ${d.verified_by}` : ""}
          </span>
        </div>
        <div className="tf-doc-actions">
          <span className={filingBadge(d.document_status, FILING_DOC_STATUS_CLASS)}>{d.document_status}</span>
          {filing.can_edit_documents && <button className="light-button" onClick={() => onDoc(d)}>{d.file_name ? "Update" : "Attach"}</button>}
        </div>
      </div>)}
    </div>}

    {tab === "Validation" && <div className="tf-validation">
      <div className="tf-readiness-bar" role="img" aria-label={`Filing readiness ${filing.readiness} percent`}>
        <div className="tf-readiness-fill" style={{ width: `${filing.readiness}%` }} />
        <span>{filing.readiness}%</span>
      </div>
      <p className="vendor-detail-note">
        {v.errors > 0
          ? `${v.errors} check(s) must pass before this return can be marked Ready for Filing.`
          : v.warnings > 0
            ? `All required checks pass. ${v.warnings} advisory warning(s) to review.`
            : "Every check passes. This return can be marked Ready for Filing."}
      </p>
      <ul className="tf-check-list">
        {v.checks.map((c) => <li key={c.key} className={`tf-check is-${c.status}`}>
          <span className="tf-check-icon">{c.status === "pass" ? "✓" : c.status === "warning" ? "!" : "✕"}</span>
          <div>
            <strong>{c.label}</strong>
            {c.detail && <span>{c.detail}</span>}
          </div>
        </li>)}
      </ul>
    </div>}
  </div>;
};

// Fallback option lists, used only until the API's `meta` arrives. The API is
// authoritative -- it returns these same lists from the backend constants -- so these
// exist to stop the dropdowns rendering empty on the very first paint, not to define
// what a valid tax type or filing status is. The backend rejects anything else.
//
// TAX_FILING_TAX_TYPES was previously referenced by the create modal and the filter bar
// but never declared, so the page threw "TAX_FILING_TAX_TYPES is not defined" on render
// and the ErrorBoundary replaced the whole module. It is declared here beside
// TAX_FILING_STATUSES_LOCAL, which is its twin and was already present.
const TAX_FILING_TAX_TYPES = ['VAT', 'Percentage Tax', 'Withholding Tax', 'Income Tax'];
const TAX_FILING_STATUSES_LOCAL = ['Draft', 'For Review', 'Ready for Filing', 'Filed', 'With Issues'];

// Create or edit a preparation. The period dates are resolved by the API from the period
// type, so the form only asks for the type and an anchor month — it never lets someone
// declare a "Monthly" return that spans three months. There is deliberately no amount
// field: the figures come from the ledger.
const TaxFilingCreateModal = ({ initial, saving, onClose, onSubmit }) => {
  const editing = Boolean(initial.editing);
  const [form, setForm] = useState({
    tax_type: initial.tax_type || 'VAT',
    filing_period: initial.filing_period || 'Monthly',
    anchor_date: `${(initial.as_of || '').slice(0, 8)}01`,
    period_start: initial.period_start || '',
    period_end: initial.period_end || '',
    prepared_by: initial.prepared_by || 'Admin User',
    remarks: initial.remarks || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return <div className="modal-overlay" onClick={() => !saving && onClose()}>
    <form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => {
      e.preventDefault();
      onSubmit({
        tax_type: form.tax_type,
        filing_period: form.filing_period,
        ...(editing ? {} : { anchor_date: form.anchor_date }),
        ...(editing ? { period_start: form.period_start, period_end: form.period_end } : {}),
        prepared_by: form.prepared_by,
        remarks: form.remarks,
      });
    }}>
      <div className="modal-header">
        <div>
          <h2>{editing ? `Edit ${initial.filing_id}` : "Create Tax Filing Preparation"}</h2>
          <p>{editing ? initial.period_label : "The period is derived from the filing period and the month below."}</p>
        </div>
        <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
      </div>
      <div className="form-grid">
        <label>Tax Type
          <select value={form.tax_type} onChange={e => set("tax_type", e.target.value)}>
            {TAX_FILING_TAX_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label>Filing Period
          <select value={form.filing_period} onChange={e => set("filing_period", e.target.value)} disabled={editing}>
            {TAX_FILING_PERIODS.map(p => <option key={p}>{p}</option>)}
          </select>
        </label>
        {editing ? <>
          <label>Period Start<input type="date" value={form.period_start} onChange={e => set("period_start", e.target.value)} /></label>
          <label>Period End<input type="date" value={form.period_end} onChange={e => set("period_end", e.target.value)} /></label>
        </> : <label className="full">Period Month<input type="date" value={form.anchor_date} onChange={e => set("anchor_date", e.target.value)} /></label>}
        <label className="full">Prepared By<input value={form.prepared_by} onChange={e => set("prepared_by", e.target.value)} /></label>
        <label className="full">Remarks<textarea rows="2" value={form.remarks} onChange={e => set("remarks", e.target.value)} /></label>
        <p className="full">The sales, purchase and tax figures are calculated from the transactions recorded in that period. They are not entered here.</p>
      </div>
      <div className="modal-footer">
        <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="primary" disabled={saving}>{saving ? "Saving..." : editing ? "Save Changes" : "Create Preparation"}</button>
      </div>
    </form>
  </div>;
};

// The taxpayer identity. This is the one place the return's company details are edited,
// and the TIN is checked against the same rule the readiness gate applies.
const TaxFilingProfileModal = ({ profile, saving, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    company_name: profile.company_name || '',
    tin: profile.tin || '',
    registered_address: profile.registered_address || '',
    rdo_code: profile.rdo_code || '',
    taxpayer_type: profile.taxpayer_type || '',
    contact_person: profile.contact_person || '',
    contact_number: profile.contact_number || '',
    email: profile.email || '',
    authorized_representative: profile.authorized_representative || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const digits = form.tin.replace(/[^0-9]/g, "");
  const tinOk = digits.length === 9 || (digits.length >= 12 && digits.length <= 14);
  return <div className="modal-overlay" onClick={() => !saving && onClose()}>
    <form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
      <div className="modal-header">
        <div><h2>Taxpayer Information</h2><p>Printed on every return this company files.</p></div>
        <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
      </div>
      <div className="form-grid">
        <label className="full">Company Name<input value={form.company_name} onChange={e => set("company_name", e.target.value)} /></label>
        <label>TIN<input value={form.tin} onChange={e => set("tin", e.target.value)} /></label>
        <label>RDO Code<input value={form.rdo_code} onChange={e => set("rdo_code", e.target.value)} /></label>
        <label className="full">Registered Address<textarea rows="2" value={form.registered_address} onChange={e => set("registered_address", e.target.value)} /></label>
        <label className="full">Taxpayer Type<input value={form.taxpayer_type} onChange={e => set("taxpayer_type", e.target.value)} /></label>
        <label>Contact Person<input value={form.contact_person} onChange={e => set("contact_person", e.target.value)} /></label>
        <label>Contact Number<input value={form.contact_number} onChange={e => set("contact_number", e.target.value)} /></label>
        <label className="full">Email<input value={form.email} onChange={e => set("email", e.target.value)} /></label>
        <label className="full">Authorized Representative<input value={form.authorized_representative} onChange={e => set("authorized_representative", e.target.value)} /></label>
        {form.tin && !tinOk && <p className="full">A TIN is 9 digits, or 9 plus a 3-5 digit branch code. This one has {digits.length}.</p>}
      </div>
      <div className="modal-footer">
        <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="primary" disabled={saving || !tinOk}>{saving ? "Saving..." : "Save Taxpayer Information"}</button>
      </div>
    </form>
  </div>;
};

// A workflow step. When validation is blocking the step, the reasons are listed here
// rather than leaving a disabled button with no explanation.
const TaxFilingStatusModal = ({ filing, target, saving, onClose, onSubmit }) => {
  const [returnNumber, setReturnNumber] = useState(filing.reference_number || '');
  const [remarks, setRemarks] = useState('');
  const blocked = ['Ready for Filing', 'Filed'].includes(target) && !filing.validation_passed;
  const needsRef = target === 'Filed' && !returnNumber.trim();
  return <div className="modal-overlay" onClick={() => !saving && onClose()}>
    <form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => {
      e.preventDefault();
      onSubmit({ filing_status: target, reference_number: returnNumber.trim(), remarks, actor: 'Tax Commissioner' });
    }}>
      <div className="modal-header">
        <div>
          <h2>{target}</h2>
          <p>{filing.filing_id} &middot; {filing.tax_type} &middot; {filing.period_label}</p>
        </div>
        <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
      </div>
      <div className="form-grid">
        {blocked && <div className="full">
          <p className="tf-modal-blocked">
            {filing.validation_errors} validation check(s) must pass first. Readiness is {filing.readiness}%.
          </p>
          <ul className="tf-block-list">
            {filing.blocking_reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>}
        {target === 'Filed' && <label className="full">Return Number<input value={returnNumber} placeholder="e.g. BIR-2550-M09" onChange={e => setReturnNumber(e.target.value)} /></label>}
        <label className="full">Remarks<textarea rows="2" value={remarks} onChange={e => setRemarks(e.target.value)} /></label>
        <p className="full">
          {filing.is_credit
            ? `This period carries a credit of ${taxMoney(filing.tax_credit)}; there is nothing payable.`
            : `Tax payable for this period is ${taxMoney(filing.tax_payable)}.`}
        </p>
      </div>
      <div className="modal-footer">
        <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="primary" disabled={saving || blocked || needsRef}>
          {saving ? "Saving..." : target}
        </button>
      </div>
    </form>
  </div>;
};

// Attach or verify a supporting document. Only the file name and status are recorded:
// there is no multipart dependency in this project, so no binary is uploaded. The
// backend refuses to mark a document Verified without a file behind it.
const TaxFilingDocModal = ({ filing, document, saving, onClose, onSubmit }) => {
  const [fileName, setFileName] = useState(document.file_name || '');
  const [status, setStatus] = useState(document.document_status === 'Missing' ? 'Attached' : document.document_status);
  const [notes, setNotes] = useState('');
  const invalid = status === 'Verified' && !fileName.trim();
  return <div className="modal-overlay" onClick={() => !saving && onClose()}>
    <form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => {
      e.preventDefault();
      onSubmit({ document_status: status, file_name: fileName.trim(), notes, uploaded_by: "Admin User" });
    }}>
      <div className="modal-header">
        <div>
          <h2>{document.document_type}</h2>
          <p>{filing.filing_id} &middot; {document.required ? "Required document" : "Optional document"}</p>
        </div>
        <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
      </div>
      <div className="form-grid">
        <label className="full">File Name<input value={fileName} placeholder="e.g. sales-invoices.pdf" onChange={e => setFileName(e.target.value)} /></label>
        <label className="full">Status
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option>Attached</option><option>Verified</option><option>Pending Review</option><option>Missing</option>
          </select>
        </label>
        <label className="full">Notes<textarea rows="2" value={notes} onChange={e => setNotes(e.target.value)} /></label>
        {invalid && <p className="full">A document cannot be marked Verified without a file attached to it.</p>}
      </div>
      <div className="modal-footer">
        <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="primary" disabled={saving || invalid}>{saving ? "Saving..." : "Save Document"}</button>
      </div>
    </form>
  </div>;
};

const TaxFilingDeleteModal = ({ filing, saving, onClose, onSubmit }) => <div className="modal-overlay" onClick={() => !saving && onClose()}>
  <form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); onSubmit(); }}>
    <div className="modal-header">
      <div><h2>Delete {filing.filing_id}</h2><p>{filing.tax_type} &middot; {filing.period_label}</p></div>
      <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
    </div>
    <div className="form-grid">
      <p className="full">
        This removes the preparation and its document checklist. The underlying sales,
        purchases and expenses are not touched — they belong to their own modules.
      </p>
    </div>
    <div className="modal-footer">
      <button type="button" onClick={onClose} disabled={saving}>Keep Preparation</button>
      <button type="submit" className="primary" disabled={saving}>{saving ? "Deleting..." : "Delete Preparation"}</button>
    </div>
  </form>
</div>;

const TAX_FILING_PERIODS = ['Monthly', 'Quarterly', 'Annual'];

const FILING_STATUS_CLASS = {
  draft: 'tx-pending',
  'for-review': 'tx-calculated',
  'ready-for-filing': 'tx-verified',
  filed: 'tx-approved',
  'with-issues': 'tx-rejected',
};
const FILING_DOC_STATUS_CLASS = {
  verified: 'tx-verified', attached: 'tx-calculated',
  'pending-review': 'tx-pending', missing: 'tx-rejected',
};

const filingBadge = (status, map) =>
  `contract-status tx-status ${map[taxSlug(status)] || 'tx-neutral'}`;

function TaxFilingPreparationPage({ onAudit }) {
  const [filings, setFilings] = useState([]);
  const [meta, setMeta] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState("");

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterTax, setFilterTax] = useState('All Taxes');
  const [selectedId, setSelectedId] = useState(null);
  const [detailTab, setDetailTab] = useState('Summary');

  const [creating, setCreating] = useState(null);
  const [filingAction, setFilingAction] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [docTarget, setDocTarget] = useState(null);
  const [revealed, setRevealed] = useState({});
  // A single control for every figure on the page. Masking one cell at a time means
  // comparing a return's payable against its credit takes a dozen clicks and is easy to
  // get wrong, so "Show amounts" reveals the whole return at once while the individual
  // cells stay clickable for anyone who wants to reveal just one.
  const [showAll, setShowAll] = useState(false);
  // Credit left unused after the whole filing chain has run. Reported by the API rather
  // than summed here, because a credit already consumed by a later filing must not be
  // counted a second time.
  const [openCredit, setOpenCredit] = useState(0);

  const toggle = (key) => setRevealed(prev => ({ ...prev, [key]: !prev[key] }));

  // When the page-wide switch is on, every masked figure reads as revealed regardless of
  // its own key. Turning it off returns each cell to what it was showing before, rather
  // than clearing the record, so the choice is not lost.
  const isRevealed = (key) => showAll || Boolean(revealed[key]);

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const payload = await taxRequest(`${API_BASE}/api/tax-filing-preparations`);
      setFilings(Array.isArray(payload?.data) ? payload.data : []);
      setMeta(payload?.meta || null);
      setOpenCredit(Number(payload?.open_credit || 0));
    } catch (error) {
      setFilings([]);
      setMeta(null);
      setLoadError(taxFailure(error, 'tax filing preparations'));
    } finally {
      setLoading(false);
    }
  };

  // The list endpoint already carries every figure each row needs, so the summary is
  // computed from that same payload rather than refetching each filing.
  useEffect(() => { load(); }, []);

  const overview = useMemo(() => {
    const sum = (f) => filings.reduce((t, r) => t + Number(r[f] || 0), 0);
    return {
      total: filings.length,
      // Payable and credit are reported separately and never netted against each other.
      // A credit is NOT a negative payable: it is an amount the company may carry forward,
      // so adding the two together would understate a real liability.
      payable: sum('tax_payable'),
      credit: sum('tax_credit'),
      // Credit still unused after the whole chain has run. This is what a future filing
      // can actually claim; summing the per-filing credits would double-count any credit
      // a later filing has already consumed.
      openCredit: Number(openCredit || 0),
      output: sum('output_tax'),
      input: sum('input_tax'),
      sales: sum('gross_sales'),
      purchases: sum('total_purchases'),
      ready: filings.filter((f) => f.can_mark_ready).length,
      filed: filings.filter((f) => f.filing_status === 'Filed').length,
      // The verification split is summed from each filing's own transaction counts, so
      // the card and the Transactions tab cannot disagree about how many are verified.
      salesTx: filings.reduce((t, f) => ({
        count: t.count + f.summary.sales.count,
        verified_count: t.verified_count + f.summary.sales.verified_count,
      }), { count: 0, verified_count: 0 }),
      purchTx: filings.reduce((t, f) => ({
        count: t.count + f.summary.purchases.count,
        verified_count: t.verified_count + f.summary.purchases.verified_count,
      }), { count: 0, verified_count: 0 }),
    };
  }, [filings, openCredit]);

  const filtered = useMemo(() => {
    const phrase = search.trim().toLowerCase();
    return filings.filter(f => {
      if (filterStatus !== 'All Status' && f.filing_status !== filterStatus) return false;
      if (filterTax !== 'All Taxes' && f.tax_type !== filterTax) return false;
      if (!phrase) return true;
      return [f.filing_id, f.tax_type, f.period_label, f.prepared_by, f.reference_number, f.taxpayer_company]
        .some(v => String(v || '').toLowerCase().includes(phrase));
    });
  }, [filings, search, filterStatus, filterTax]);

  const selected = useMemo(
    () => filings.find(f => f.id === selectedId) || filtered[0] || null,
    [filings, filtered, selectedId]
  );

  const run = async (label, fn) => {
    setSaving(true);
    setFlash("");
    try {
      const result = await fn();
      setFlash(result);
      await load();
      if (onAudit) onAudit(label);
      return result;
    } catch (error) {
      const detail = error && error.findings ? error.findings.join(" ") : null;
      setFlash(detail || taxFailure(error, "that action"));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const printFiling = (f) => {
    if (!f) return;
    const s = f.summary;
    const w = window.open("", "_blank");
    if (!w) return;
    const line = (label, value) => `<tr><th>${label}</th><td>${value}</td></tr>`;
    w.document.write(`<!DOCTYPE html><html><head><title>${f.filing_id}</title><style>
      body{font-family:Segoe UI,Arial,sans-serif;padding:40px;color:#1c1c1c}
      h1{font-size:18px;letter-spacing:2px;margin:0 0 4px}
      h2{font-size:15px;margin:22px 0 10px;padding-bottom:6px;border-bottom:2px solid #1c1c1c}
      .sub{color:#555;font-size:12px;margin:0 0 20px}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th{text-align:left;padding:7px 10px;background:#f2f2f2;border:1px solid #ddd;width:250px;font-weight:600}
      td{padding:7px 10px;border:1px solid #ddd}
      .total{background:#f7f9fb;font-weight:700}
      .sign{margin-top:46px;display:flex;gap:40px}
      .sign div{flex:1;border-top:1px solid #1c1c1c;padding-top:6px;font-size:12px;text-align:center}
      @media print{body{padding:0}}
    </style></head><body>
      <h1>PRIMEPOWER</h1>
      <p class="sub">FINANCIAL MANAGEMENT SYSTEM &nbsp;&middot;&nbsp; ${f.tax_type} RETURN</p>
      <h2>${f.filing_id} &mdash; ${f.period_label}</h2>
      <table>
        ${line("Company", taxBlank(s.profile.company_name))}
        ${line("TIN", taxBlank(s.profile.tin))}
        ${line("Registered Address", taxBlank(s.profile.registered_address))}
        ${line("RDO Code", taxBlank(s.profile.rdo_code))}
        ${line("Taxpayer Type", taxBlank(s.profile.taxpayer_type))}
        ${line("Filing Period", `${f.filing_period} (${f.period_start} to ${f.period_end})`)}
        ${line("Filing Deadline", f.filing_deadline || "—")}
      </table>
      <h2>Taxable Sales</h2>
      <table>
        ${line("Gross Sales", taxMoney(s.sales.gross))}
        ${line("VATable Sales", taxMoney(s.sales.taxable))}
        ${line("Zero-Rated Sales", taxMoney(s.sales.zero_rated))}
        ${line("Exempt Sales", taxMoney(s.sales.exempt))}
        ${line(`Output Tax (${s.sales.rate}%)`, taxMoney(s.computation.output_tax))}
      </table>
      <h2>Purchases / Expenses</h2>
      <table>
        ${line("Total Purchases", taxMoney(s.purchases.gross))}
        ${line("VATable Purchases", taxMoney(s.purchases.taxable))}
        ${line(`Input Tax (${s.purchases.rate}%)`, taxMoney(s.computation.input_tax))}
        ${line("Exempt Purchases", taxMoney(s.purchases.exempt))}
        ${line("Withholding Tax Credited", taxMoney(s.withholding.total))}
      </table>
      <h2>Tax Computation</h2>
      <table>
        ${line("Output Tax", taxMoney(s.computation.output_tax))}
        ${line("Less: Input Tax", taxMoney(s.computation.input_tax))}
        <tr class="total">${line(s.computation.is_credit ? "Credit Carried Forward" : "Tax Payable",
          taxMoney(s.computation.is_credit ? s.computation.credit : s.computation.payable))}</tr>
      </table>
      <h2>Certification</h2>
      <table>
        ${line("Prepared By", taxBlank(f.prepared_by))}
        ${line("Reviewed By", taxBlank(f.reviewed_by))}
        ${line("Filing Status", f.filing_status)}
        ${line("Return Number", taxBlank(f.reference_number))}
        ${line("Readiness", `${f.readiness}% (${f.validation_errors} error(s), ${f.validation_warnings} warning(s))`)}
      </table>
      <div class="sign"><div>Prepared By</div><div>Reviewed By</div><div>Filed By</div></div>
    </body></html>`);
    w.document.close();
    w.print();
  };

  // The per-invoice verification split the specification asks for. Counts are summed
  // from the same rows the totals were built from, so they cannot contradict them.
  const sideCounts = (s) => `${s.verified_count} of ${s.count} verified`;

  return <section className="management-page vendor-payment-page">
    <Breadcrumb current="Tax Filing Preparation" parent="Tax Management" />
    <div className="management-header">
      <div><h2>TAX FILING PREPARATION</h2><p>Assemble a {meta ? meta.vat_rate : 12}% return from transactions recorded across billing, payments, payables, utilities and expenses.</p></div>
      <div className="management-actions">
        <button className="light-button" onClick={() => window.print()} disabled={saving}><Printer size={15}/> Print / Save PDF</button>
        <button className="light-button" disabled={loading || saving} onClick={load} title="Re-read every source table and recompute the return">⟳ Refresh Data</button>
        <button
          className="light-button"
          onClick={() => setShowAll(v => !v)}
          aria-pressed={showAll}
          title={showAll ? 'Hide all peso amounts' : 'Show all peso amounts on this page'}
        >
          {/* Lucide glyphs rather than the 🙈/👁 emoji, which rendered in full colour
              and stood out against the monochrome action buttons beside them. */}
          {showAll ? <EyeOff size={14}/> : <Eye size={14}/>} {showAll ? "Hide Amounts" : "Show Amounts"}
        </button>
        <button className="primary-button" onClick={() => setCreating({ tax_type: 'VAT', filing_period: 'Monthly' })} disabled={saving}><Plus size={15}/> Create Preparation</button>
      </div>
    </div>

    <div className="vendor-toolbar">
      <div className="search-box vendor-search"><span>⌕</span><input placeholder="Search filing, tax, period, return number..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="vendor-toolbar-controls">
        <select className="vendor-select" value={filterTax} onChange={e => setFilterTax(e.target.value)} aria-label="Tax type">
          <option>All Taxes</option>
          {(meta ? meta.tax_types : TAX_FILING_TAX_TYPES).map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="vendor-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} aria-label="Filing status">
          <option>All Status</option>
          {(meta ? meta.statuses : TAX_FILING_STATUSES_LOCAL).map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
    </div>

    {loadError && <div className="cfu-error" role="alert">{loadError}</div>}
    {flash && <div className="cfu-error" role="status">{flash}</div>}

    <div className="vendor-summary-grid">
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Taxable Sales</span>
        <TaxCardAmount id="tf-sales" value={overview.sales} revealed={revealed} onToggle={toggle} tone="total-supplies-amount" forceOpen={showAll} />
        <span className="vendor-summary-count">{sideCounts(overview.salesTx)}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Total Purchases</span>
        <TaxCardAmount id="tf-purchases" value={overview.purchases} revealed={revealed} onToggle={toggle} tone="pending-amount" forceOpen={showAll} />
        <span className="vendor-summary-count">{sideCounts(overview.purchTx)}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Tax Payable</span>
        <TaxCardAmount id="tf-payable" value={overview.payable} revealed={revealed} onToggle={toggle} tone="calculated-amount" forceOpen={showAll} />
        <span className="vendor-summary-count">
          {overview.total} return{overview.total === 1 ? '' : 's'} · {overview.ready} ready
        </span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Credit Carried Forward</span>
        <TaxCardAmount id="tf-credit" value={overview.openCredit} revealed={revealed} onToggle={toggle} tone="overdue-amount" forceOpen={showAll} />
        <span className="vendor-summary-count">
          {overview.openCredit > 0 ? 'available to a future return' : 'fully used'}
        </span>
      </div>
    </div>

    <div className="vendor-table-card">
      <table className="vendor-table">
        <thead><tr>
          <th>Filing ID</th><th>Tax Type</th><th>Period</th><th>Deadline</th>
          <th>Taxable Sales</th><th>Purchases</th><th>Output Tax</th><th>Input Tax</th>
          <th>Tax Payable</th><th>Credit</th><th>Readiness</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {loading ? <tr><td colSpan="13">Loading tax filing preparations...</td></tr>
            : filtered.length === 0 ? <tr><td colSpan="13">No tax filing preparations match the current filters.</td></tr>
            : filtered.map(f => <tr key={f.id} className={selected && selected.id === f.id ? "is-selected" : ""} onClick={() => { setSelectedId(f.id); setDetailTab("Summary"); }}>
              <td className="mono">{f.filing_id}</td>
              <td><span className={taxTypeClass(f.tax_type)}>{f.tax_type}</span></td>
              <td>{f.period_label}</td>
              <td>{f.filing_deadline ? <span className="tf-deadline-cell">
                <span className="tf-deadline-date">{taxDate(f.filing_deadline)}</span>
                {f.deadline_overdue && <span
                  className="tf-overdue-flag"
                  title={`The ${f.period_label} ${f.tax_type} return was due on ${taxDate(f.filing_deadline)} and is still ${String(f.filing_status).toLowerCase()} - ${Math.abs(f.days_to_deadline)} day(s) past the deadline.`}
                >{Math.abs(f.days_to_deadline)}d overdue</span>}
              </span> : "—"}</td>
              <td className="money-cell"><TaxMasked rowId={`${f.id}-sales`} value={f.gross_sales} revealed={revealed} onToggle={toggle} forceOpen={showAll} /></td>
              <td className="money-cell"><TaxMasked rowId={`${f.id}-purch`} value={f.total_purchases} revealed={revealed} onToggle={toggle} forceOpen={showAll} /></td>
              <td className="money-cell"><TaxMasked rowId={`${f.id}-out`} value={f.output_tax} revealed={revealed} onToggle={toggle} forceOpen={showAll} /></td>
              <td className="money-cell"><TaxMasked rowId={`${f.id}-in`} value={f.input_tax} revealed={revealed} onToggle={toggle} forceOpen={showAll} /></td>
              <td className="money-cell">
                {/* Payable and credit occupy SEPARATE columns. Showing a credit in a column
                    headed "Payable" implied a negative liability, which is a different thing:
                    one is money owed, the other is credit to apply against a future return. */}
                <TaxMasked rowId={`${f.id}-pay`} value={f.tax_payable} revealed={revealed} onToggle={toggle} forceOpen={showAll} />
              </td>
              <td className="money-cell">
                {f.tax_credit > 0
                  ? <span className="tf-credit" title={`Input tax exceeded output tax by ${taxMoney(f.tax_credit)}`}>credit {taxMoney(f.tax_credit)}</span>
                  : <span className="tf-muted">—</span>}
              </td>
              <td>
                {/* The percentage alone gave no way to tell a genuinely ready return from
                    one blocked on a missing document, and made filings with different
                    problems look identical. The completed-check count sits beside it and
                    the tooltip names what is outstanding. */}
                <span
                  className={`tf-readiness ${f.readiness === 100 ? "is-full" : ""}`}
                  title={f.blocking_reasons && f.blocking_reasons.length
                    ? f.blocking_reasons.join(" · ")
                    : "All validation checks pass"}
                >
                  {f.readiness}%
                  <small className="tf-readiness-detail">
                    {f.validation_completed ?? 0}/{f.validation_total ?? 0} checks
                  </small>
                </span>
              </td>
              <td><span className={filingBadge(f.filing_status, FILING_STATUS_CLASS)}>{f.filing_status}</span></td>
              <td onClick={e => e.stopPropagation()}>
                <div className="vendor-row-actions">
                  {/* Icon-only, matching Tax Records and Tax Calculation. The meaning is
                      carried by the lucide glyph plus the title/aria-label tooltip rather
                      than a text label, which is what left these three controls looking
                      different from one page to the next. */}
                  {/* Receipt opens the filing receipt / return record. The printer glyph
                      beside it is Print, so the two read as Receipt then Print. */}
                  <button className="tax-icon-btn" title="Open the tax filing receipt / record" aria-label="Open the tax filing receipt" onClick={() => { setSelectedId(f.id); setDetailTab("Summary"); }}><ReceiptText size={16}/></button>
                  <button className="tax-icon-btn" title="Print the filing / report" aria-label="Print the filing report" onClick={() => printFiling(f)}><Printer size={16}/></button>
                  <button className="tax-icon-btn" title="More actions: edit, company profile, delete" aria-label="More actions" onClick={() => setFilingAction(filingAction && filingAction.id === f.id ? null : f)}><MoreHorizontal size={16}/></button>
                  {filingAction && filingAction.id === f.id && <TaxFilingMenu filing={f} saving={saving} onClose={() => setFilingAction(null)}
                    onEdit={() => { setFilingAction(null); setCreating({ ...f, editing: true }); }}
                    onProfile={() => { setFilingAction(null); setEditingProfile(true); }}
                    onDelete={() => { setFilingAction(null); setDocTarget({ filing: f, mode: "delete" }); }} />}
                </div>
              </td>
            </tr>)}
        </tbody>
      </table>
    </div>

    {selected && <TaxFilingDetail filing={selected} tab={detailTab} setTab={setDetailTab} revealed={revealed} toggle={toggle} saving={saving}
      onPrint={() => printFiling(selected)}
      onDoc={d => setDocTarget({ filing: selected, document: d })}
      onProfile={() => setEditingProfile(true)}
      onSubmit={() => setFilingAction({ ...selected, advance: "For Review", verb: "submit" })}
      onApprove={() => setFilingAction({ ...selected, advance: "Ready for Filing", verb: "approve" })}
      onAdvance={next => setFilingAction({ ...selected, advance: next })} />}

    {creating && <TaxFilingCreateModal initial={creating} saving={saving} onClose={() => setCreating(null)}
      onSubmit={async payload => {
        const r = await run(creating.editing ? "Updated tax filing preparation" : "Created tax filing preparation",
          async () => (await taxRequest(`${API_BASE}/api/tax-filing-preparations${creating.editing ? `/${creating.id}` : ""}`, {
            method: creating.editing ? "PUT" : "POST", body: JSON.stringify(payload),
          })).message);
        if (r) setCreating(null);
        return r;
      }} />}

    {editingProfile && <TaxFilingProfileModal profile={(selected && selected.summary.profile) || {}} saving={saving} onClose={() => setEditingProfile(false)}
      onSubmit={async payload => { const r = await run("Saved taxpayer information", async () => (await taxRequest(`${API_BASE}/api/tax-filing-preparations/profile`, { method: "PUT", body: JSON.stringify(payload) })).message); if (r) setEditingProfile(false); return r; }} />}

    {filingAction && filingAction.advance && <TaxFilingStatusModal filing={filingAction} target={filingAction.advance} saving={saving} onClose={() => setFilingAction(null)}
      onSubmit={async payload => { const r = await run(`Set ${filingAction.filing_id} to ${filingAction.advance}`, async () => (await taxRequest(`${API_BASE}/api/tax-filing-preparations/${filingAction.id}/status`, { method: "POST", body: JSON.stringify(payload) })).message); if (r) setFilingAction(null); return r; }} />}

    {docTarget && docTarget.document && <TaxFilingDocModal filing={docTarget.filing} document={docTarget.document} saving={saving} onClose={() => setDocTarget(null)}
      onSubmit={async payload => { const r = await run(`Updated ${docTarget.document.document_type}`, async () => (await taxRequest(`${API_BASE}/api/tax-filing-preparations/${docTarget.filing.id}/documents/${docTarget.document.id}`, { method: "PUT", body: JSON.stringify(payload) })).message); if (r) setDocTarget(null); return r; }} />}

    {docTarget && docTarget.mode === "delete" && <TaxFilingDeleteModal filing={docTarget.filing} saving={saving} onClose={() => setDocTarget(null)}
      onSubmit={async () => { const r = await run("Deleted tax filing preparation", async () => (await taxRequest(`${API_BASE}/api/tax-filing-preparations/${docTarget.filing.id}`, { method: "DELETE" })).message); if (r) { setDocTarget(null); setSelectedId(null); } return r; }} />}
  </section>;
}

function TaxRecordsPage({ onAudit }) {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [eligible, setEligible] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState("");

  const [search, setSearch] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("All Periods");
  const [filterType, setFilterType] = useState("All Types");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [filterFiling, setFilterFiling] = useState("All Filing");
  const [filterPayment, setFilterPayment] = useState("All Payment");
  const [selectedId, setSelectedId] = useState(null);
  const [detailTab, setDetailTab] = useState("Record");

  const [intake, setIntake] = useState(null);
  const [editing, setEditing] = useState(null);
  const [remitting, setRemitting] = useState(null);
  const [filing, setFiling] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [menuFor, setMenuFor] = useState(null);
  const [revealed, setRevealed] = useState({});

  const toggle = (key) => setRevealed(prev => ({ ...prev, [key]: !prev[key] }));

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const payload = await taxRequest(`${API_BASE}/api/tax/records`);
      setRecords(Array.isArray(payload?.data) ? payload.data : []);
      setSummary(payload?.summary || null);
    } catch (error) {
      setRecords([]);
      setSummary(null);
      setLoadError(taxFailure(error, "tax records"));
    } finally {
      setLoading(false);
    }
  };

  // The calculations that can still be promoted into a record. Only reviewed work
  // appears here, so the intake form cannot file something that was never checked.
  const loadEligible = async () => {
    try {
      const payload = await taxRequest(`${API_BASE}/api/tax/records/calculations`);
      setEligible(Array.isArray(payload?.data) ? payload.data : []);
    } catch {
      setEligible([]);
    }
  };

  useEffect(() => { load(); loadEligible(); }, []);

  const filteredRecords = useMemo(() => {
    const phrase = search.trim().toLowerCase();
    return records.filter(row => {
      if (filterPeriod !== "All Periods" && row.tax_period !== filterPeriod) return false;
      if (filterType !== "All Types" && row.tax_type !== filterType) return false;
      if (filterStatus !== "All Status" && row.record_status !== filterStatus) return false;
      if (filterFiling !== "All Filing" && row.filing_status !== filterFiling) return false;
      if (filterPayment !== "All Payment" && row.payment_status !== filterPayment) return false;
      if (!phrase) return true;
      return [row.tax_record_id, row.reference_number, row.client_supplier, row.transaction_type, row.tax_type, row.return_number]
        .some(v => String(v || "").toLowerCase().includes(phrase));
    });
  }, [records, search, filterPeriod, filterType, filterStatus, filterFiling, filterPayment]);

  const selected = useMemo(
    () => records.find(r => r.id === selectedId) || filteredRecords[0] || null,
    [records, filteredRecords, selectedId]
  );

  const periods = useMemo(
    () => [...new Set(records.map(r => r.tax_period).filter(Boolean))].sort().reverse(),
    [records]
  );

  const s = summary;

  const run = async (label, fn) => {
    setSaving(true);
    setFlash("");
    try {
      const result = await fn();
      setFlash(result);
      await load();
      await loadEligible();
      if (onAudit) onAudit(label);
      return result;
    } catch (error) {
      const detail = error && error.findings ? error.findings.join(" ") : null;
      setFlash(detail || taxFailure(error, "that action").replace(/^The backend /, "The backend "));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const printRecord = (r) => {
    if (!r) return;
    const w = window.open("", "_blank");
    if (!w) return;
    const line = (label, value) => `<tr><th>${label}</th><td>${value}</td></tr>`;
    w.document.write(`<!DOCTYPE html><html><head><title>${r.tax_record_id}</title><style>
      body{font-family:Segoe UI,Arial,sans-serif;padding:40px;color:#1c1c1c}
      h1{font-size:18px;letter-spacing:2px;margin:0 0 4px}
      h2{font-size:15px;margin:22px 0 10px;padding-bottom:6px;border-bottom:2px solid #1c1c1c}
      .sub{color:#555;font-size:12px;margin:0 0 20px}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th{text-align:left;padding:7px 10px;background:#f2f2f2;border:1px solid #ddd;width:230px;font-weight:600}
      td{padding:7px 10px;border:1px solid #ddd}
      .sign{margin-top:46px;display:flex;gap:40px}
      .sign div{flex:1;border-top:1px solid #1c1c1c;padding-top:6px;font-size:12px;text-align:center}
      @media print{body{padding:0}}
    </style></head><body>
      <h1>PRIMEPOWER</h1>
      <p class="sub">FINANCIAL MANAGEMENT SYSTEM &nbsp;&middot;&nbsp; TAX RECORD</p>
      <h2>${r.tax_record_id} &mdash; ${r.tax_type}</h2>
      <table>
        ${line("Tax Period", taxBlank(r.tax_period))}
        ${line("Transaction Date", taxDate(r.transaction_date))}
        ${line("Transaction Type", taxBlank(r.transaction_type))}
        ${line("Reference Number", taxBlank(r.reference_number))}
        ${line("Client / Supplier", taxBlank(r.client_supplier))}
      </table>
      <h2>Tax Computation</h2>
      <table>
        ${line("Taxable Amount", taxMoney(r.taxable_amount))}
        ${line("Tax Rate", `${r.tax_rate}%`)}
        ${line("Tax Amount", taxMoney(r.tax_amount))}
        ${line("Less: Withholding Tax", taxMoney(r.withholding_tax))}
        ${line("Tax Adjustment", taxMoney(r.tax_adjustment))}
        ${line("Final Tax Amount", taxMoney(r.final_tax_amount))}
        ${line("Tax Paid", taxMoney(r.tax_paid))}
        ${line("Outstanding", taxMoney(r.tax_remaining))}
      </table>
      <h2>Status</h2>
      <table>
        ${line("Record Status", r.record_status)}
        ${line("Filing Status", r.filing_status)}
        ${line("Payment Status", r.payment_status)}
        ${line("Return Number", taxBlank(r.return_number))}
        ${line("Source Calculation", taxBlank(r.source_reference))}
      </table>
      <h2>Signatories</h2>
      <table>
        ${line("Calculated By", taxBlank(r.calculated_by))}
        ${line("Verified By", taxBlank(r.verified_by))}
        ${line("Verified On", taxDate(r.verified_on))}
        ${line("Filed By", taxBlank(r.filed_by))}
        ${line("Filed On", taxDate(r.filed_on))}
      </table>
      ${r.remarks ? `<h2>Remarks</h2><p style="font-size:13px">${r.remarks}</p>` : ""}
      <div class="sign"><div>Prepared By</div><div>Verified By</div><div>Filed By</div></div>
    </body></html>`);
    w.document.close();
    w.print();
  };

  return <section className="management-page vendor-payment-page">
    <Breadcrumb current="Tax Records" parent="Tax Management" />
    <div className="management-header">
      <div><h2>TAX RECORDS</h2><p>The permanent filed record of tax computed from reviewed calculations, with its full filing and payment history.</p></div>
      <div className="management-actions">
        <button className="light-button" onClick={() => window.print()} disabled={saving}><Printer size={15}/> Print / Save PDF</button>
        <button className="primary-button" onClick={() => setIntake({})} disabled={saving}>＋ New Tax Record</button>
      </div>
    </div>

    <div className="vendor-toolbar">
      <div className="search-box vendor-search"><span>⌕</span><input placeholder="Search reference, client, return number..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="vendor-toolbar-controls">
        <select className="vendor-select" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} aria-label="Tax period">
          <option>All Periods</option>
          {periods.map(p => <option key={p}>{p}</option>)}
        </select>
        <select className="vendor-select" value={filterType} onChange={e => setFilterType(e.target.value)} aria-label="Tax type">
          <option>All Types</option>
          {TAX_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="vendor-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} aria-label="Record status">
          <option>All Status</option>
          {TAX_RECORD_STATUSES_LOCAL.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="vendor-select" value={filterFiling} onChange={e => setFilterFiling(e.target.value)} aria-label="Filing status">
          <option>All Filing</option>
          {TAX_RECORD_FILING_STATUSES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="vendor-select" value={filterPayment} onChange={e => setFilterPayment(e.target.value)} aria-label="Payment status">
          <option>All Payment</option>
          {TAX_RECORD_PAYMENT_STATUSES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
    </div>

    {loadError && <div className="cfu-error" role="alert">{loadError}</div>}
    {flash && <div className="cfu-error" role="status">{flash}</div>}

    <div className="vendor-summary-grid">
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Total Taxable Amount</span>
        <TaxCardAmount id="tr-total-taxable" value={s ? s.total_taxable : 0} revealed={revealed} onToggle={toggle} tone="total-supplies-amount" />
        <span className="vendor-summary-count">{s ? s.total : 0} record{(s ? s.total : 0) === 1 ? "" : "s"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Total Tax Calculated</span>
        <TaxCardAmount id="tr-calculated" value={s ? s.total_tax_calculated : 0} revealed={revealed} onToggle={toggle} tone="calculated-amount" />
        <span className="vendor-summary-count">final payable {s ? taxMoney(s.total_final_tax) : "—"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">For Filing</span>
        <TaxCardAmount id="tr-for-filing" value={s ? s.for_filing_amount : 0} revealed={revealed} onToggle={toggle} tone="pending-amount" />
        <span className="vendor-summary-count">{s ? s.for_filing : 0} queued</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Outstanding</span>
        <TaxCardAmount id="tr-outstanding" value={s ? s.total_outstanding : 0} revealed={revealed} onToggle={toggle} tone="overdue-amount" />
        <span className="vendor-summary-count">{s ? s.unpaid : 0} not fully paid</span>
      </div>
    </div>

    <div className="vendor-table-card">
      <table className="vendor-table">
        <thead><tr>
          <th>ID</th><th>Reference</th><th>Client / Supplier</th><th>Tax Type</th>
          <th>Taxable</th><th>Tax</th><th>Final</th><th>Record</th><th>Filing</th><th>Payment</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {loading ? <tr><td colSpan="11">Loading tax records...</td></tr>
            : filteredRecords.length === 0 ? <tr><td colSpan="11">No tax records match the current filters.</td></tr>
            : filteredRecords.map(r => <tr key={r.id} className={selected && selected.id === r.id ? "is-selected" : ""} onClick={() => { setSelectedId(r.id); setDetailTab("Record"); }}>
              <td className="mono">{r.tax_record_id}</td>
              <td>{taxBlank(r.reference_number)}</td>
              <td>{taxBlank(r.client_supplier)}</td>
              <td><span className={taxTypeClass(r.tax_type)}>{r.tax_type}</span></td>
              <td className="money-cell"><TaxMasked rowId={`${r.id}-taxable`} value={r.taxable_amount} revealed={revealed} onToggle={toggle} /></td>
              <td className="money-cell"><TaxMasked rowId={`${r.id}-tax`} value={r.tax_amount} revealed={revealed} onToggle={toggle} /></td>
              <td className="money-cell"><TaxMasked rowId={`${r.id}-final`} value={r.final_tax_amount} revealed={revealed} onToggle={toggle} /></td>
              <td><span className={taxRecordBadge(r.record_status, TAX_RECORD_STATUS_CLASS)}>{r.record_status}</span></td>
              <td><span className={taxRecordBadge(r.filing_status, TAX_FILING_STATUS_CLASS)}>{r.filing_status}</span></td>
              <td><span className={taxRecordBadge(r.payment_status, TAX_PAYMENT_STATUS_CLASS)}>{r.payment_status}</span></td>
              <td onClick={e => e.stopPropagation()}>
                <div className="vendor-row-actions">
                  <button className="tax-icon-btn" type="button" title="Open the tax filing record / receipt" aria-label={`Open the receipt for ${r.tax_record_id}`} onClick={() => { setSelectedId(r.id); setDetailTab("Record"); }}><ReceiptText size={16}/></button>
                  <button className="tax-icon-btn" type="button" title="Print the tax record / report" aria-label={`Print ${r.tax_record_id}`} onClick={() => printRecord(r)}><Printer size={16}/></button>
                  <button className="tax-icon-btn" type="button" title="More actions" aria-label={`More actions for ${r.tax_record_id}`} onClick={() => setMenuFor(menuFor === r.id ? null : r.id)}><MoreHorizontal size={16}/></button>
                  {menuFor === r.id && <TaxRecordMenu record={r} saving={saving} onClose={() => setMenuFor(null)}
                    onEdit={() => { setMenuFor(null); setEditing(r); }}
                    onRemit={() => { setMenuFor(null); setRemitting(r); }}
                    onFile={() => { setMenuFor(null); setFiling(r); }}
                    onCancel={() => { setMenuFor(null); setCancelling(r); }} />}
                </div>
              </td>
            </tr>)}
        </tbody>
      </table>
    </div>

    {selected && <TaxRecordDetail record={selected} tab={detailTab} setTab={setDetailTab} revealed={revealed} toggle={toggle} saving={saving}
      onVerify={() => run("Verified tax record", async () => (await taxRequest(`${API_BASE}/api/tax/records/${selected.id}/verify`, { method: "POST", body: JSON.stringify({ verified_by: "Tax Commissioner" }) })).message)}
      onForFiling={() => run("Queued tax record for filing", async () => (await taxRequest(`${API_BASE}/api/tax/records/${selected.id}/for-filing`, { method: "POST", body: JSON.stringify({}) })).message)}
      onPrint={() => printRecord(selected)} />}

    {intake && <TaxRecordIntakeModal eligible={eligible} saving={saving} onClose={() => setIntake(null)}
      onSubmit={async payload => { const r = await run("Created tax record", async () => (await taxRequest(`${API_BASE}/api/tax/records`, { method: "POST", body: JSON.stringify(payload) })).message); if (r) setIntake(null); return r; }} />}

    {editing && <TaxRecordEditModal record={editing} saving={saving} onClose={() => setEditing(null)}
      onSubmit={async payload => { const r = await run("Updated tax record", async () => (await taxRequest(`${API_BASE}/api/tax/records/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) })).message); if (r) setEditing(null); return r; }} />}

    {remitting && <TaxRecordRemitModal record={remitting} saving={saving} onClose={() => setRemitting(null)}
      onSubmit={async amount => { const r = await run("Recorded tax remittance", async () => (await taxRequest(`${API_BASE}/api/tax/records/${remitting.id}/payment`, { method: "POST", body: JSON.stringify({ amount, verified_by: "Treasury Officer" }) })).message); if (r) setRemitting(null); return r; }} />}

    {filing && <TaxRecordFileModal record={filing} saving={saving} onClose={() => setFiling(null)}
      onSubmit={async returnNumber => { const r = await run("Filed tax record", async () => (await taxRequest(`${API_BASE}/api/tax/records/${filing.id}/file`, { method: "POST", body: JSON.stringify({ return_number: returnNumber, verified_by: "Tax Commissioner" }) })).message); if (r) setFiling(null); return r; }} />}

    {cancelling && <TaxRecordCancelModal record={cancelling} saving={saving} onClose={() => setCancelling(null)}
      onSubmit={async reason => { const r = await run("Cancelled tax record", async () => (await taxRequest(`${API_BASE}/api/tax/records/${cancelling.id}/cancel`, { method: "POST", body: JSON.stringify({ reason }) })).message); if (r) setCancelling(null); return r; }} />}
  </section>;
}

function TaxCalculationPage({ onAudit }) {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("All Periods");
  const [filterType, setFilterType] = useState("All Types");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [selectedId, setSelectedId] = useState(null);
  const [detailTab, setDetailTab] = useState("Source");

  const [intake, setIntake] = useState(null);
  const [adjusting, setAdjusting] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [menuFor, setMenuFor] = useState(null);
  const [revealed, setRevealed] = useState({});

  const toggle = (key) => setRevealed(prev => ({ ...prev, [key]: !prev[key] }));

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const payload = await taxRequest(`${API_BASE}/api/tax/calculations`);
      setRecords(Array.isArray(payload?.data) ? payload.data : []);
      // The cards read the backend's own summary of the same rows.
      setSummary(payload?.summary || null);
    } catch (error) {
      setRecords([]);
      setSummary(null);
      setLoadError(taxFailure(error, "tax calculations"));
    } finally {
      setLoading(false);
    }
  };

  // The real transactions the intake form can be built from, read live from the
  // other modules' tables.
  const loadSources = async () => {
    try {
      const payload = await taxRequest(`${API_BASE}/api/tax/calculations/sources`);
      setSources(Array.isArray(payload?.data) ? payload.data : []);
    } catch {
      setSources([]);
    }
  };

  useEffect(() => { load(); loadSources(); }, []);

  const filteredRecords = useMemo(() => {
    const phrase = search.trim().toLowerCase();
    return records.filter(row => {
      if (filterPeriod !== "All Periods" && row.tax_period !== filterPeriod) return false;
      if (filterType !== "All Types" && row.tax_type !== filterType) return false;
      if (filterStatus !== "All Status" && row.status !== filterStatus) return false;
      if (!phrase) return true;
      return [row.tax_calculation_id, row.reference_number, row.client_supplier, row.transaction_type, row.tax_type]
        .some(v => String(v || "").toLowerCase().includes(phrase));
    });
  }, [records, search, filterPeriod, filterType, filterStatus]);

  const selected = useMemo(
    () => records.find(r => r.id === selectedId) || filteredRecords[0] || null,
    [records, filteredRecords, selectedId]
  );

  const periods = useMemo(
    () => [...new Set(records.map(r => r.tax_period).filter(Boolean))].sort().reverse(),
    [records]
  );

  // Any mutation re-reads afterwards, otherwise the cards would keep showing the
  // pre-edit figures while the table row had already changed.
  const runAction = async (label, action) => {
    setSaving(true);
    try {
      const result = await action();
      setLoadError("");
      if (result?.message) onAudit?.(result.message);
      await load();
      return result;
    } catch (error) {
      setLoadError(taxFailure(error, label));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const call = (row, endpoint, payload) =>
    taxRequest(`${API_BASE}/api/tax/calculations/${row.id}/${endpoint}`, {
      method: "PUT",
      body: JSON.stringify(payload || {}),
    });

  const doVerify = async (row) => {
    if (!row.can_verify) {
      window.alert(row.status === "Verified"
        ? `${row.tax_calculation_id} is already verified.`
        : `${row.tax_calculation_id} was cancelled and cannot be verified.`);
      return;
    }
    // Outstanding findings are shown before the click, so the user knows why the
    // backend will refuse rather than discovering it from an error banner.
    if (row.findings.length) {
      window.alert(`${row.tax_calculation_id} cannot be verified:\n\n- ${row.findings.join("\n- ")}`);
      return;
    }
    const result = await runAction(`verifying ${row.tax_calculation_id}`, () =>
      call(row, "verify", { verified_by: "Tax Commissioner" })
    );
    if (result) window.alert(result.message);
  };

  const doRecalculate = async (row) => {
    const result = await runAction(`recalculating ${row.tax_calculation_id}`, () =>
      call(row, "recalculate", { calculated_by: "Tax Officer" })
    );
    if (result) window.alert(result.message);
  };

  const doDelete = async (row) => {
    if (!window.confirm(`Delete ${row.tax_calculation_id}? Its adjustments and review trail will also be removed.`)) return;
    const result = await runAction(`deleting ${row.tax_calculation_id}`, () =>
      taxRequest(`${API_BASE}/api/tax/calculations/${row.id}`, { method: "DELETE" })
    );
    if (result) { setSelectedId(null); window.alert(result.message); }
  };

  // The printed record shows the real amounts: masking a filed tax record would
  // defeat the purpose of printing it.
  const printRecord = (row) => {
    const w = window.open("", "_blank");
    if (!w) { window.alert("The print window was blocked. Allow pop-ups for this site and try again."); return; }
    const line = (a, b) => `<tr><td style="padding:4px"><b>${a}:</b></td><td>${b}</td></tr>`;
    w.document.write(`<html><head><title>${row.tax_calculation_id}</title></head><body style="font-family:Arial;padding:40px">
      <h2 style="text-align:center">PRIMEPOWER</h2>
      <h3 style="text-align:center">TAX CALCULATION RECORD</h3><hr/>
      <table style="width:100%;border-collapse:collapse">
        ${line("Tax Calculation ID", taxBlank(row.tax_calculation_id))}
        ${line("Tax Period", taxBlank(row.tax_period))}
        ${line("Transaction Type", taxBlank(row.transaction_type))}
        ${line("Reference No.", taxBlank(row.reference_number))}
        ${line("Client / Supplier", taxBlank(row.client_supplier))}
        ${line("Transaction Date", taxDate(row.transaction_date))}
        ${line("Tax Type", taxBlank(row.tax_type))}
        ${line("Taxable Status", taxBlank(row.taxable_status))}
        ${line("Gross Amount", taxMoney(row.gross_amount))}
        ${line("Less: Discount", taxMoney(row.discount))}
        ${line("Tax-exempt Amount", taxMoney(row.exempt_amount))}
        ${line("Zero-rated Amount", taxMoney(row.zero_rated_amount))}
        ${line("Taxable Amount", `<b>${taxMoney(row.taxable_amount)}</b>`)}
        ${line("Tax Rate", `${row.tax_rate}%`)}
        ${line("Tax Amount", `<b>${taxMoney(row.tax_amount)}</b>`)}
        ${line("Less: Withholding Tax", taxMoney(row.withholding_tax))}
        ${line("Total Tax Payable", `<b>${taxMoney(row.total_tax)}</b>`)}
        ${line("Calculated By", taxBlank(row.calculated_by))}
        ${line("Verified By", taxBlank(row.verified_by))}
        ${line("Status", `<b>${taxBlank(row.status).toUpperCase()}</b>`)}
      </table>
      <div style="margin-top:60px;display:flex;justify-content:space-between">
        <div style="width:30%;border-top:1px solid #000;padding-top:6px">Calculated By</div>
        <div style="width:30%;border-top:1px solid #000;padding-top:6px">Reviewed By</div>
        <div style="width:30%;border-top:1px solid #000;padding-top:6px">Approved By</div>
      </div>
      <script>window.print()</script></body></html>`);
    w.document.close();
  };

  const s = summary;

  return <section className="management-page vendor-payment-page">
    <Breadcrumb current="Tax Calculation" parent="Tax Management" />
    <div className="management-header">
      <div><h2>TAX CALCULATION</h2><p>Calculate, review and verify tax on transactions recorded across billing, payments, payables and expenses.</p></div>
      <div className="management-actions">
        <button className="light-button" onClick={() => window.print()} disabled={saving}><Printer size={15}/> Print / Save PDF</button>
        <button className="primary-button" onClick={() => setIntake({})} disabled={saving}>＋ New Tax Calculation</button>
      </div>
    </div>

    <div className="vendor-toolbar">
      <div className="search-box vendor-search"><span>⌕</span><input placeholder="Search reference, client, transaction type..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="vendor-toolbar-controls">
        <select className="vendor-select" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} aria-label="Tax period">
          <option>All Periods</option>
          {periods.map(p => <option key={p}>{p}</option>)}
        </select>
        <select className="vendor-select" value={filterType} onChange={e => setFilterType(e.target.value)} aria-label="Tax type">
          <option>All Types</option>
          {TAX_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="vendor-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} aria-label="Status">
          <option>All Status</option>
          {TAX_STATUSES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
    </div>

    {loadError && <div className="cfu-error" role="alert">{loadError}</div>}

    <div className="vendor-summary-grid">
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Total Taxable Amount</span>
        <TaxCardAmount id="tx-taxable" value={s ? s.total_taxable : 0} revealed={revealed} onToggle={toggle} tone="total-supplies-amount" />
        <span className="vendor-summary-count">{s ? s.total : 0} record{(s ? s.total : 0) === 1 ? "" : "s"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Total Tax Calculated</span>
        <TaxCardAmount id="tx-calculated" value={s ? s.total_tax_calculated : 0} revealed={revealed} onToggle={toggle} tone="calculated-amount" />
        <span className="vendor-summary-count">net payable {s ? taxMoney(s.total_tax_payable) : "—"}</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Pending Review</span>
        <TaxCardAmount id="tx-pending" value={s ? s.pending_review_amount : 0} revealed={revealed} onToggle={toggle} tone="pending-amount" />
        <span className="vendor-summary-count">{s ? s.pending_review : 0} awaiting sign-off</span>
      </div>
      <div className="vendor-summary-card">
        <span className="vendor-summary-label">Verified Tax</span>
        <TaxCardAmount id="tx-verified" value={s ? s.verified_amount : 0} revealed={revealed} onToggle={toggle} tone="verified-amount" />
        <span className="vendor-summary-count">{s ? s.verified : 0} verified</span>
      </div>
    </div>

    {/* The by-type summary the document calls for, straight from the backend. */}
    {s && s.by_tax_type.some(t => t.count > 0) && (
      <section className="vendor-record-panel">
        <div className="vendor-record-heading"><h3>Summary by Tax Type</h3></div>
        <div className="table-card vendor-table-card">
          <table>
            <thead>
              <tr>
                <th>Tax Type</th>
                <th className="money-cell">Taxable Amount</th>
                <th className="money-cell">Tax Calculated</th>
                <th className="money-cell">Net Payable</th>
                <th>Records</th>
              </tr>
            </thead>
            <tbody>
              {s.by_tax_type.filter(t => t.count > 0).map(t => (
                <tr key={t.tax_type}>
                  <td><span className={taxTypeClass(t.tax_type)}>{t.tax_type}</span></td>
                  <td className="money-cell">{taxMoney(t.taxable_amount)}</td>
                  <td className="money-cell">{taxMoney(t.tax_amount)}</td>
                  <td className="money-cell">{taxMoney(t.total_tax)}</td>
                  <td>{t.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    )}

    <section className="vendor-record-panel">
      <div className="vendor-record-heading">
        <h3>Tax Calculations</h3>
        <span className="vendor-summary-count">{filteredRecords.length} of {records.length} shown</span>
      </div>
      <div className="table-card vendor-table-card">
        <table>
          <thead>
            <tr>
              <th>Tax Calculation ID</th>
              <th>Reference</th>
              <th>Client / Supplier</th>
              <th>Tax Type</th>
              <th className="money-cell">Taxable Amount</th>
              <th className="money-cell">Rate</th>
              <th className="money-cell">Tax Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="9" className="empty">Loading tax calculations...</td></tr>}
            {!loading && filteredRecords.length === 0 && (
              <tr><td colSpan="9" className="empty">No tax calculations match the current search and filters.</td></tr>
            )}
            {!loading && filteredRecords.map(r => <tr key={r.id} onClick={() => setSelectedId(r.id)} className={selected?.id === r.id ? "selected-row" : ""}>
              <td className="link-cell">{r.tax_calculation_id}</td>
              <td>{taxBlank(r.reference_number)}</td>
              <td className="strong-cell">{taxBlank(r.client_supplier)}</td>
              <td><span className={taxTypeClass(r.tax_type)}>{r.tax_type}</span></td>
              <td className="money-cell"><TaxMasked rowId={r.id} value={r.taxable_amount} revealed={revealed} onToggle={toggle} /></td>
              <td className="money-cell">{r.tax_rate}%</td>
              <td className="money-cell">{taxMoney(r.tax_amount)}</td>
              {/* The badge colour comes from the status the API returned. */}
              <td><span className={taxStatusClass(r.status)}>{r.status}</span></td>
              <td onClick={e => e.stopPropagation()}>
                <div className="row-actions">
                  <button className="tax-icon-btn" type="button" title="View details" aria-label={`View ${r.tax_calculation_id}`} onClick={() => { setSelectedId(r.id); setDetailTab("Source"); }}><Eye size={16}/></button>
                  <button
                    className={r.can_verify && !r.findings.length ? "tax-icon-btn" : "tax-icon-btn sp-blocked"}
                    type="button"
                    title={r.can_verify
                      ? `Verify ${r.tax_calculation_id}`
                      : r.status === "Verified"
                        ? `${r.tax_calculation_id} is already verified`
                        : r.findings.length
                          ? `Blocked: ${r.findings[0]}`
                          : `${r.tax_calculation_id} is ${String(r.status).toLowerCase()}`}
                    aria-label={`Verify ${r.tax_calculation_id}`}
                    disabled={saving}
                    onClick={() => doVerify(r)}
                  ><ShieldCheck size={16}/></button>
                  <button className="tax-icon-btn" type="button" title="Print record" aria-label={`Print ${r.tax_calculation_id}`} onClick={() => printRecord(r)}><Printer size={16}/></button>
                  <div className="row-menu">
                    <button className="tax-icon-btn" type="button" title="More actions" aria-label={`More actions for ${r.tax_calculation_id}`} onClick={() => setMenuFor(menuFor === r.id ? null : r.id)}><MoreHorizontal size={16}/></button>
                    {menuFor === r.id && (
                      <div className="row-menu-popover">
                        <button type="button" disabled={saving} onClick={() => { setMenuFor(null); setAdjusting({ ...r }); }}>Add adjustment</button>
                        <button type="button" disabled={saving} onClick={() => { setMenuFor(null); doRecalculate(r); }}>Recalculate from source</button>
                        <button type="button" disabled={saving} onClick={() => { setMenuFor(null); setRejecting({ ...r }); }}>Reject</button>
                        <button type="button" className="danger" disabled={saving} onClick={() => { setMenuFor(null); doDelete(r); }}>Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </section>

    {selected && (
      <section className="vendor-detail-panel">
        <div className="vendor-detail-header">
          <div>
            <span className="vendor-detail-kicker">Tax Calculation</span>
            <h3>{selected.tax_calculation_id} — {taxBlank(selected.client_supplier)}</h3>
            <p className="vp-detail-sub">{taxBlank(selected.reference_number)} &middot; {taxBlank(selected.transaction_type)}</p>
          </div>
          <div className="sp-detail-actions">
            <span className={taxTypeClass(selected.tax_type)}>{selected.tax_type}</span>
            <span className={taxStatusClass(selected.status)}>{selected.status}</span>
            <button type="button" className="light-button" onClick={() => printRecord(selected)}><Printer size={14}/> Record</button>
          </div>
        </div>

        {selected.findings.length > 0 && (
          <div className="cfu-error" role="alert">
            <b>This calculation cannot be verified yet:</b>
            {selected.findings.map((f, i) => <div key={i}>{f}</div>)}
          </div>
        )}

        <div className="vp-tabs">
          {["Source", "Calculation", "Adjustments", "Review"].map(tab => (
            <button key={tab} type="button" className={`vp-tab ${detailTab === tab ? "active" : ""}`} onClick={() => setDetailTab(tab)}>
              {tab}
              {tab === "Adjustments" && selected.adjustments.length > 0 && <span className="vp-tab-count">{selected.adjustments.length}</span>}
              {tab === "Review" && selected.activities.length > 0 && <span className="vp-tab-count">{selected.activities.length}</span>}
            </button>
          ))}
        </div>

        <div className="vendor-detail-grid">
          {detailTab === "Source" && (
            <div className="vendor-detail-block">
              <h4>Source Transaction</h4>
              <div className="vendor-detail-list">
                <div><span>Transaction Type</span><b>{taxBlank(selected.transaction_type)}</b></div>
                <div><span>Reference No.</span><b>{taxBlank(selected.reference_number)}</b></div>
                <div><span>Client / Supplier</span><b>{taxBlank(selected.client_supplier)}</b></div>
                <div><span>Transaction Date</span><b>{taxDate(selected.transaction_date)}</b></div>
                <div><span>Source Table</span><b>{taxBlank(selected.source_table)}</b></div>
                <div><span>Tax Period</span><b>{taxBlank(selected.tax_period)}</b></div>
                <div><span>Gross Amount</span><b>{taxMoney(selected.gross_amount)}</b></div>
                <div><span>Taxable Status</span><b>{taxBlank(selected.taxable_status)}</b></div>
              </div>
            </div>
          )}

          {detailTab === "Calculation" && (
            <div className="vendor-detail-block">
              <h4>Tax Calculation</h4>
              <div className="vendor-detail-list">
                <div><span>Gross Amount</span><b>{taxMoney(selected.gross_amount)}</b></div>
                <div><span>Less: Discount</span><b>{taxMoney(selected.discount)}</b></div>
                <div><span>Less: Tax-exempt</span><b>{taxMoney(selected.exempt_amount)}</b></div>
                <div><span>Less: Zero-rated</span><b>{taxMoney(selected.zero_rated_amount)}</b></div>
                <div><span>Taxable Amount</span><b>{taxMoney(selected.taxable_amount)}</b></div>
                <div><span>Tax Rate</span><b>{selected.tax_rate}% ({taxBlank(selected.tax_type)})</b></div>
                <div><span>Tax Amount</span><b>{taxMoney(selected.tax_amount)}</b></div>
                <div><span>Less: Withholding Tax</span><b>{taxMoney(selected.withholding_tax)}</b></div>
                <div><span>Less: Tax Credit</span><b>{taxMoney(selected.tax_credit)}</b></div>
                <div><span>Total Tax Payable</span><b>{taxMoney(selected.total_tax)}</b></div>
                <div><span>Total Amount</span><b>{taxMoney(selected.total_amount)}</b></div>
              </div>
            </div>
          )}

          {detailTab === "Adjustments" && (
            <div className="vendor-detail-block">
              <h4>Tax Adjustments</h4>
              {selected.adjustments.length === 0 ? (
                <div className="vendor-detail-list"><div><span>Adjustments</span><b>None recorded</b></div></div>
              ) : (
                <div className="vendor-detail-list">
                  {selected.adjustments.map(a => (
                    <div key={a.id}>
                      <span>{taxBlank(a.reason)}</span>
                      <b>{taxMoney(a.amount)} &middot; {a.affects_taxable ? "reduces the taxable base" : "reduces the tax payable"}</b>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {detailTab === "Review" && (
            <div className="vendor-detail-block vp-timeline-block">
              <h4>Review Trail</h4>
              <div className="vendor-detail-list">
                <div><span>Calculated By</span><b>{taxBlank(selected.calculated_by)}</b></div>
                <div><span>Calculation Date</span><b>{taxDate(selected.calculated_at)}</b></div>
                <div><span>Verified By</span><b>{taxBlank(selected.verified_by)}</b></div>
                <div><span>Verification Date</span><b>{taxDate(selected.verified_at)}</b></div>
                <div><span>Rejection Reason</span><b>{selected.status === "Rejected" ? taxBlank(selected.rejection_reason) : "—"}</b></div>
                <div><span>Remarks</span><b>{taxBlank(selected.remarks)}</b></div>
              </div>
              <div className="vp-timeline" style={{ marginTop: 12 }}>
                {selected.activities.length === 0 && <p className="empty">No activity recorded yet.</p>}
                {selected.activities.map(entry => (
                  <div className="vp-timeline-item" key={entry.id}>
                    <span className="vp-timeline-dot" />
                    <div>
                      <strong>{taxBlank(entry.action)}</strong>
                      <p>{taxBlank(entry.remarks)}</p>
                      <small>{taxDateTime(entry.created_at)} &middot; {taxBlank(entry.actor)}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    )}

    {/* Add Adjustment dialog — POST /api/tax/calculations/:id/adjustments. The tax
        figures are recomputed by the backend on the next read. */}
    {adjusting && (
      <div className="modal-overlay" onClick={() => !saving && setAdjusting(null)}>
        <form
          className="modal"
          onClick={e => e.stopPropagation()}
          onSubmit={async e => {
            e.preventDefault();
            const f = e.target;
            const result = await runAction(`recording an adjustment on ${adjusting.tax_calculation_id}`, () =>
              taxRequest(`${API_BASE}/api/tax/calculations/${adjusting.id}/adjustments`, {
                method: "POST",
                body: JSON.stringify({
                  reason: f.reason.value,
                  amount: Number(f.amount.value),
                  affects_taxable: f.affects_taxable.value === "yes",
                  notes: f.notes.value,
                  created_by: "Tax Officer",
                }),
              })
            );
            if (result) { setAdjusting(null); window.alert(result.message); }
          }}
        >
          <div className="modal-header">
            <div>
              <h2>Add Adjustment — {adjusting.tax_calculation_id}</h2>
              <p>Current taxable amount: {taxMoney(adjusting.taxable_amount)}</p>
            </div>
            <button type="button" onClick={() => setAdjusting(null)} disabled={saving}><X size={20}/></button>
          </div>
          <div className="form-grid">
            <label>Reason
              <select name="reason" defaultValue="Withholding tax">
                {TAX_ADJUSTMENT_REASONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </label>
            <label>Amount<input name="amount" type="number" min="0" step="0.01" required /></label>
            <label className="full">Affects
              <select name="affects_taxable" defaultValue="no">
                <option value="no">The tax payable</option>
                <option value="yes">The taxable base</option>
              </select>
            </label>
            <label className="full">Notes<textarea name="notes" rows="2" /></label>
          </div>
          <div className="modal-footer">
            <button type="button" className="light-button" onClick={() => setAdjusting(null)} disabled={saving}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : "Record Adjustment"}</button>
          </div>
        </form>
      </div>
    )}

    {/* Reject dialog — a reason is required so the record says what to correct. */}
    {rejecting && (
      <div className="modal-overlay" onClick={() => !saving && setRejecting(null)}>
        <form
          className="modal"
          onClick={e => e.stopPropagation()}
          onSubmit={async e => {
            e.preventDefault();
            const result = await runAction(`rejecting ${rejecting.tax_calculation_id}`, () =>
              call(rejecting, "reject", {
                rejection_reason: e.target.rejection_reason.value,
                rejected_by: "Tax Commissioner",
              })
            );
            if (result) { setRejecting(null); window.alert(result.message); }
          }}
        >
          <div className="modal-header">
            <div>
              <h2>Reject — {rejecting.tax_calculation_id}</h2>
              <p>{taxMoney(rejecting.total_tax)} total tax payable</p>
            </div>
            <button type="button" onClick={() => setRejecting(null)} disabled={saving}><X size={20}/></button>
          </div>
          <div className="form-grid">
            <label className="full">Reason for rejection
              <textarea name="rejection_reason" rows="3" placeholder="Explain what must be corrected..." required />
            </label>
          </div>
          <div className="modal-footer">
            <button type="button" className="light-button" onClick={() => setRejecting(null)} disabled={saving}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : "Reject Calculation"}</button>
          </div>
        </form>
      </div>
    )}

    {intake && (
      <TaxIntakeForm
        sources={sources}
        saving={saving}
        onClose={() => setIntake(null)}
        onSubmit={async (payload) => {
          const result = await runAction("creating a tax calculation", () =>
            taxRequest(`${API_BASE}/api/tax/calculations`, { method: "POST", body: JSON.stringify(payload) })
          );
          if (result) { setIntake(null); window.alert(result.message); }
        }}
      />
    )}
  </section>;
}

// The intake. The transaction is chosen from the real records the API returns and
// the amount is READ by the backend, so nothing here can be typed to disagree with
// the transaction it claims to come from.
function TaxIntakeForm({ sources, saving, onClose, onSubmit }) {
  const [table, setTable] = useState(sources[0] ? sources[0].table : "");
  const [reference, setReference] = useState("");
  const [taxType, setTaxType] = useState("VAT");
  const [taxableStatus, setTaxableStatus] = useState("Taxable");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");

  const group = sources.find(g => g.table === table);
  const picked = group ? group.items.find(i => i.reference_number === reference) : null;

  // The rate is read from the tax type rather than typed, so a VAT record cannot be
  // filed at the withholding rate by accident. The preview is only a preview; the
  // backend computes the real figure.
  const RATE = { VAT: 12, "Withholding Tax": 2, "Tax-Exempt": 0, "Zero-Rated": 0 };
  const rate = RATE[taxType] ?? 12;
  const previewTax = picked && taxableStatus === "Taxable"
    ? Number(((picked.source_amount * rate) / 100).toFixed(2))
    : 0;

  const submit = e => {
    e.preventDefault();
    if (!table || !reference) { setError("Choose the transaction this calculation is for."); return; }
    if (!picked) { setError("That transaction is no longer available. Pick another."); return; }
    onSubmit({
      source_table: table,
      reference_number: reference,
      tax_type: taxType,
      taxable_status: taxableStatus,
      tax_period_start: periodStart || null,
      tax_period_end: periodEnd || null,
      calculated_by: "Tax Officer",
      remarks,
    });
  };

  return (
    <div className="modal-overlay" onClick={() => !saving && onClose()}>
      <form className="modal vp-intake" onClick={e => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-header">
          <div><h2>New Tax Calculation</h2><p>Pick the transaction to calculate tax on</p></div>
          <button type="button" onClick={onClose} disabled={saving}><X size={20}/></button>
        </div>
        {error && <div className="cfu-error" role="alert">{error}</div>}
        <div className="form-grid">
          <label>Transaction Type
            <select value={table} onChange={e => { setTable(e.target.value); setReference(""); }}>
              {sources.map(g => <option key={g.table} value={g.table}>{g.transaction_type} ({g.items.length})</option>)}
            </select>
          </label>
          <label>Reference No.
            <select value={reference} onChange={e => setReference(e.target.value)} required>
              <option value="">Select transaction...</option>
              {(group ? group.items : []).map(item => (
                <option key={item.reference_number} value={item.reference_number}>
                  {item.reference_number} — {item.client_supplier} ({taxMoney(item.source_amount)})
                </option>
              ))}
            </select>
          </label>
          <label>Tax Type
            <select value={taxType} onChange={e => setTaxType(e.target.value)}>
              {TAX_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label>Taxable Status
            <select value={taxableStatus} onChange={e => setTaxableStatus(e.target.value)}>
              <option>Taxable</option>
              <option>Exempt</option>
              <option>Zero-Rated</option>
            </select>
          </label>
          <label>Tax Period Start<input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} /></label>
          <label>Tax Period End<input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} /></label>
          <label className="full">Remarks<textarea rows="2" value={remarks} onChange={e => setRemarks(e.target.value)} /></label>
          <label className="full">
            Source Amount: <b>{picked ? taxMoney(picked.source_amount) : "—"}</b>
            {"  "}&middot; Rate <b>{rate}%</b>
            {"  "}&middot; Tax <b>{taxMoney(previewTax)}</b>
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="light-button" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="primary-button" disabled={saving}>{saving ? "Creating..." : "Create Calculation"}</button>
        </div>
      </form>
    </div>
  );
}
