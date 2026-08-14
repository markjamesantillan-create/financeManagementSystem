import React, { useMemo, useState } from "react";
import "./index.css";

const initialTransactions = [
  {
    id: 1,
    date: "2026-08-08",
    description: "Client Payment",
    category: "Revenue",
    type: "Income",
    amount: 125000,
    account: "BDO Business",
    status: "Completed",
  },
  {
    id: 2,
    date: "2026-08-07",
    description: "Office Supplies",
    category: "Office",
    type: "Expense",
    amount: 8500,
    account: "Cash",
    status: "Completed",
  },
  {
    id: 3,
    date: "2026-08-06",
    description: "Employee Salaries",
    category: "Payroll",
    type: "Expense",
    amount: 68000,
    account: "BDO Business",
    status: "Completed",
  },
  {
    id: 4,
    date: "2026-08-05",
    description: "Project Service Fee",
    category: "Revenue",
    type: "Income",
    amount: 95000,
    account: "BPI Corporate",
    status: "Completed",
  },
  {
    id: 5,
    date: "2026-08-04",
    description: "Internet and Utilities",
    category: "Utilities",
    type: "Expense",
    amount: 12500,
    account: "Cash",
    status: "Pending",
  },
  {
    id: 6,
    date: "2026-08-03",
    description: "Transportation",
    category: "Transportation",
    type: "Expense",
    amount: 7200,
    account: "Cash",
    status: "Completed",
  },
];

const monthlyData = [
  { month: "Jan", revenue: 180000, expense: 105000 },
  { month: "Feb", revenue: 210000, expense: 112000 },
  { month: "Mar", revenue: 240000, expense: 130000 },
  { month: "Apr", revenue: 225000, expense: 118000 },
  { month: "May", revenue: 290000, expense: 145000 },
  { month: "Jun", revenue: 310000, expense: 152000 },
  { month: "Jul", revenue: 345000, expense: 170000 },
  { month: "Aug", revenue: 420000, expense: 196000 },
];

const expenseCategories = [
  { name: "Payroll", amount: 68000, percent: 35 },
  { name: "Utilities", amount: 12500, percent: 8 },
  { name: "Office", amount: 8500, percent: 6 },
  { name: "Transportation", amount: 7200, percent: 5 },
  { name: "Marketing", amount: 28000, percent: 15 },
  { name: "Operations", amount: 72000, percent: 31 },
];

const accounts = [
  {
    name: "BDO Business",
    number: "**** 4582",
    balance: 385000,
    type: "Bank Account",
  },
  {
    name: "BPI Corporate",
    number: "**** 7721",
    balance: 245000,
    type: "Bank Account",
  },
  {
    name: "Cash",
    number: "Petty Cash",
    balance: 85000,
    type: "Cash",
  },
];

function formatMoney(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [transactions, setTransactions] = useState(initialTransactions);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactionsOpen, setTransactionsOpen] = useState(false);
  const [accountPayableOpen, setAccountPayableOpen] = useState(false);

  const [form, setForm] = useState({
    description: "",
    category: "Revenue",
    type: "Income",
    amount: "",
    account: "BDO Business",
    date: "2026-08-09",
  });

  const totalRevenue = transactions
    .filter((t) => t.type === "Income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "Expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netProfit = totalRevenue - totalExpenses;

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) =>
      `${transaction.description} ${transaction.category} ${transaction.account}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [transactions, search]);

  function addTransaction(e) {
    e.preventDefault();

    if (!form.description || !form.amount) return;

    const newTransaction = {
      id: Date.now(),
      date: form.date,
      description: form.description,
      category: form.category,
      type: form.type,
      amount: Number(form.amount),
      account: form.account,
      status: "Completed",
    };

    setTransactions([newTransaction, ...transactions]);
    setShowModal(false);

    setForm({
      description: "",
      category: "Revenue",
      type: "Income",
      amount: "",
      account: "BDO Business",
      date: "2026-08-09",
    });
  }

  const menuItems = [
    { name: "Dashboard", icon: "⌂" },
    { name: "Transactions", icon: "⇄" },
    { name: "Revenue", icon: "↗" },
    { name: "Expenses", icon: "↘" },
    { name: "Budget", icon: "▣" },
    { name: "Accounts", icon: "▤" },
    { name: "Reports", icon: "▥" },
  ];

  return (
    <div className="app">
   {/* SIDEBAR */}
<aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
  <div className="brand">

    <div className="brand-logo">
      <img src="/primepower-img.png" alt="Prime Power Logo" />
    </div>

    <div>
      <h2 style={{ color: "#D32F2F" }}>PRIMEPOWER MANPOWER</h2>
      <span style={{ color: "black" }}>Management System</span>
    </div>

  </div>

   <nav>

  {/* DASHBOARD */}
  <button
    className={activePage === "Dashboard" ? "menu active" : "menu"}
    onClick={() => {
      setActivePage("Dashboard");
      setSidebarOpen(false);
    }}
  >
    <span className="menu-icon">⌂</span>
    Dashboard
  </button>


  {/* TRANSACTIONS DROPDOWN */}
  <button
    className="menu"
    onClick={() => setTransactionsOpen(!transactionsOpen)}
  >
    <span className="menu-icon">⇄</span>
    Transactions
    <span className="dropdown-arrow">
      {transactionsOpen ? "▲" : "▼"}
    </span>
  </button>


 {/* TRANSACTIONS SUBMENU */}
{transactionsOpen && (
  <div className="submenu">

    {/* PAYMENT MONITORING */}
    <button
      className={
        activePage === "Payment Monitoring"
          ? "submenu-item active"
          : "submenu-item"
      }
      onClick={() => {
        setActivePage("Payment Monitoring");
        setSidebarOpen(false);
      }}
    >
      Payment Monitoring
    </button>

    {/* COLLECTION REMINDER */}
    <button
      className={
        activePage === "Collection Reminder"
          ? "submenu-item active"
          : "submenu-item"
      }
      onClick={() => {
        setActivePage("Collection Reminder");
        setSidebarOpen(false);
      }}
    >
      Collection Reminder
    </button>

   {/* ACCOUNT RECEIVABLE */}
   {activePage === "Account Receivable" && (
    <AccountReceivable transactions={transactions} />
     )}

    {/* GENERAL LEDGER */}
    <button
      className={
        activePage === "General Ledger"
          ? "submenu-item active"
          : "submenu-item"
      }
      onClick={() => {
        setActivePage("General Ledger");
        setSidebarOpen(false);
      }}
    >
      General Ledger
    </button>



  </div>
)}


 {/* ACCOUNT PAYABLE DROPDOWN */}
<button
  className="menu"
  onClick={() => setAccountPayableOpen(!accountPayableOpen)}
>
  <span className="menu-icon">↗</span>
  Account Payable
  <span className="dropdown-arrow">
    {accountPayableOpen ? "▲" : "▼"}
  </span>
</button>

{/* ACCOUNT PAYABLE SUBMENU */}
{accountPayableOpen && (
  <div className="submenu">

    {/* EDITING ACCOUNT PAYABLE */}
    <button
      className={
        activePage === "Editing Account Payable"
          ? "submenu-item active"
          : "submenu-item"
      }
      onClick={() => {
        setActivePage("Editing Account Payable");
        setSidebarOpen(false);
      }}
    >
      Editing Account Payable
    </button>

    {/* MONITORING ACCOUNT PAYABLE */}
    <button
      className={
        activePage === "Monitoring Account Payable"
          ? "submenu-item active"
          : "submenu-item"
      }
      onClick={() => {
        setActivePage("Monitoring Account Payable");
        setSidebarOpen(false);
      }}
    >
      Monitoring Account Payable
    </button>

    {/* ACCOUNT RECEIVABLE */}
    <button
      className={
        activePage === "Account Receivable"
          ? "submenu-item active"
          : "submenu-item"
      }
      onClick={() => {
        setActivePage("Account Receivable");
        setSidebarOpen(false);
      }}
    >
      Account Receivable
    </button>

  </div>
)}

  <button
    className={activePage === "Expenses" ? "menu active" : "menu"}
    onClick={() => {
      setActivePage("Expenses");
      setSidebarOpen(false);
    }}
  >
    <span className="menu-icon">↘</span>
    Expenses
  </button>

  <button
    className={activePage === "Budget" ? "menu active" : "menu"}
    onClick={() => {
      setActivePage("Budget");
      setSidebarOpen(false);
    }}
  >
    <span className="menu-icon">▣</span>
    Budget
  </button>

  <button
    className={activePage === "Accounts" ? "menu active" : "menu"}
    onClick={() => {
      setActivePage("Accounts");
      setSidebarOpen(false);
    }}
  >
    <span className="menu-icon">▤</span>
    Accounts
  </button>

  <button
    className={activePage === "Reports" ? "menu active" : "menu"}
    onClick={() => {
      setActivePage("Reports");
      setSidebarOpen(false);
    }}
  >
    <span className="menu-icon">▥</span>
    Reports
  </button>

        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon">✦</div>
            <strong>Financial Insights</strong>
            <p>Monitor your financial performance and business growth.</p>
            <button>View Insights</button>
          </div>

          <div className="profile">
            <div className="avatar">SM</div>
            <div>
              <strong>Scrum master</strong>
              <span>Administrator</span>
            </div>
            <span className="dots">•••</span>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">

        {/* HEADER */}
        <header className="header">
          <div className="header-left">
            <button
              className="mobile-menu"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>

            <div>
              <h1>{activePage}</h1>
              <p>Manage and monitor your business finances</p>
            </div>
          </div>

          <div className="header-actions">
            <div className="search-box">
              <span>⌕</span>
              <input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button className="notification">♢</button>

            <button
              className="add-button"
              onClick={() => setShowModal(true)}
            >
              + Add Transaction
            </button>
          </div>
        </header>
    
        {/* DASHBOARD */}
        {activePage === "Dashboard" && (
          <Dashboard
            totalRevenue={totalRevenue}
            totalExpenses={totalExpenses}
            netProfit={netProfit}
            transactions={filteredTransactions}
            setActivePage={setActivePage}
          />
        )}

        {/* TRANSACTIONS */}
        {activePage === "Transactions" && (
          <Transactions
            transactions={filteredTransactions}
            onAdd={() => setShowModal(true)}
          />
        )}

        {/* REVENUE */}
        {activePage === "Revenue" && (
          <Revenue
            transactions={transactions}
            totalRevenue={totalRevenue}
          />
        )}

        {/* EXPENSES */}
        {activePage === "Expenses" && (
          <Expenses
            transactions={transactions}
            totalExpenses={totalExpenses}
          />
        )}

        {/* BUDGET */}
        {activePage === "Budget" && <Budget />}

       {/* ACCOUNTS */}
{activePage === "Accounts" && <Accounts />}

{/* PAYMENT MONITORING */}
{activePage === "Payment Monitoring" && (
  <PaymentMonitoring transactions={transactions} />
)}

{/* COLLECTION REMINDER */}
{activePage === "Collection Reminder" && (
  <CollectionReminder transactions={transactions} />
)}

{/* GENERAL LEDGER */}
{activePage === "General Ledger" && (
  <GeneralLedger transactions={transactions} />
)}

{/* REPORTS */} 
        
      </main>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>Add Transaction</h2>
                <p>Record a new financial transaction</p>
              </div>

              <button onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={addTransaction}>
              <div className="form-grid">

                <div className="form-group full">
                  <label>Description</label>
                  <input
                    type="text"
                    placeholder="Enter transaction description"
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Transaction Type</label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value,
                        category:
                          e.target.value === "Income"
                            ? "Revenue"
                            : "Operations",
                      })
                    }
                  >
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value,
                      })
                    }
                  >
                    {form.type === "Income" ? (
                      <>
                        <option>Revenue</option>
                        <option>Service Income</option>
                        <option>Client Payment</option>
                        <option>Other Income</option>
                      </>
                    ) : (
                      <>
                        <option>Operations</option>
                        <option>Payroll</option>
                        <option>Office</option>
                        <option>Utilities</option>
                        <option>Transportation</option>
                        <option>Marketing</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    placeholder="₱0.00"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        amount: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Account</label>
                  <select
                    value={form.account}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        account: e.target.value,
                      })
                    }
                  >
                    <option>BDO Business</option>
                    <option>BPI Corporate</option>
                    <option>Cash</option>
                  </select>
                </div>

                <div className="form-group full">
                  <label>Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        date: e.target.value,
                      })
                    }
                  />
                </div>

              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button className="save-button" type="submit">
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


/* ================================
   DASHBOARD
================================ */

function Dashboard({
  totalRevenue,
  totalExpenses,
  netProfit,
  transactions,
  setActivePage,
}) {
  return (
    <>
      <section className="welcome">
        <div>
          <h2>Good day, Sir/Ma'am 👋</h2>
          <p>
            Here's what's happening with your financial performance today.
          </p>
        </div>

        <button
          className="outline-button"
          onClick={() => setActivePage("Reports")}
        >
          View Reports →
        </button>
      </section>

      {/* STAT CARDS */}
      <section className="stats">

        <StatCard
          title="Total Revenue"
          amount={totalRevenue}
          change="+12.8%"
          icon="↗"
          type="income"
        />

        <StatCard
          title="Total Expenses"
          amount={totalExpenses}
          change="+5.4%"
          icon="↘"
          type="expense"
        />

        <StatCard
          title="Net Profit"
          amount={netProfit}
          change="+18.6%"
          icon="₱"
          type="profit"
        />

        <StatCard
          title="Profit Margin"
          amount={
            totalRevenue
              ? `${((netProfit / totalRevenue) * 100).toFixed(1)}%`
              : "0%"
          }
          change="+2.4%"
          icon="%"
          type="margin"
          raw
        />

      </section>

      <section className="dashboard-grid">

        {/* PROFIT TREND */}
        <div className="card profit-card">
          <div className="card-header">
            <div>
              <h3>Profit Trend</h3>
              <p>Revenue vs expenses over the past 8 months</p>
            </div>

            <select>
              <option>Last 8 months</option>
              <option>Last 12 months</option>
              <option>This year</option>
            </select>
          </div>

          <ProfitChart />
        </div>

        {/* EXPENSE BREAKDOWN */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Expense Breakdown</h3>
              <p>Current month expenses</p>
            </div>
          </div>

          <ExpenseChart />

          <div className="expense-list">
            {expenseCategories.slice(0, 4).map((item) => (
              <div className="expense-row" key={item.name}>
                <div>
                  <span className="legend-dot"></span>
                  {item.name}
                </div>

                <strong>{formatMoney(item.amount)}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVENUE CHART */}
      <section className="card monthly-card">
        <div className="card-header">
          <div>
            <h3>Monthly Revenue</h3>
            <p>Revenue performance throughout the year</p>
          </div>
        </div>

        <RevenueChart />
      </section>

      {/* RECENT TRANSACTIONS */}
      <section className="card">
        <div className="card-header">
          <div>
            <h3>Recent Transactions</h3>
            <p>Your latest financial activities</p>
          </div>

          <button
            className="text-button"
            onClick={() => setActivePage("Transactions")}
          >
            View All →
          </button>
        </div>

        <TransactionTable transactions={transactions.slice(0, 5)} />
      </section>
    </>
  );
}


/* ================================
   STAT CARD
================================ */

function StatCard({
  title,
  amount,
  change,
  icon,
  type,
  raw,
}) {
  return (
    <div className={`stat-card ${type}`}>
      <div className="stat-top">
        <span>{title}</span>
        <div className="stat-icon">{icon}</div>
      </div>

      <h2>{raw ? amount : formatMoney(amount)}</h2>

      <div className="stat-bottom">
        <span className="positive">{change}</span>
        <span>vs last month</span>
      </div>
    </div>
  );
}


/* ================================
   PROFIT CHART
================================ */

function ProfitChart() {
  const maxValue = Math.max(
    ...monthlyData.map((x) => Math.max(x.revenue, x.expense))
  );

  return (
    <div className="line-chart">
      <div className="chart-y">
        <span>₱400k</span>
        <span>₱300k</span>
        <span>₱200k</span>
        <span>₱100k</span>
        <span>₱0</span>
      </div>

      <div className="chart-area">
        <div className="grid-lines">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div className="bars">
          {monthlyData.map((item) => (
            <div className="bar-group" key={item.month}>
              <div
                className="bar revenue-bar"
                style={{
                  height: `${(item.revenue / maxValue) * 100}%`,
                }}
              ></div>

              <div
                className="bar expense-bar"
                style={{
                  height: `${(item.expense / maxValue) * 100}%`,
                }}
              ></div>

              <span>{item.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-legend">
        <span>
          <i className="revenue-dot"></i>
          Revenue
        </span>

        <span>
          <i className="expense-dot"></i>
          Expenses
        </span>
      </div>
    </div>
  );
}


/* ================================
   EXPENSE CHART
================================ */

function ExpenseChart() {
  const total = expenseCategories.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  let current = 0;

  const gradient = expenseCategories
    .map((item, index) => {
      const start = current;
      current += (item.amount / total) * 360;

      return `${getGradientColor(index)} ${start}deg ${current}deg`;
    })
    .join(", ");

  return (
    <div className="donut-wrapper">
      <div
        className="donut"
        style={{
          background: `conic-gradient(${gradient})`,
        }}
      >
        <div className="donut-inner">
          <strong>{formatMoney(total)}</strong>
          <span>Total Expenses</span>
        </div>
      </div>
    </div>
  );
}

function getGradientColor(index) {
  const colors = [
    "#2563eb",
    "#16a34a",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
  ];

  return colors[index % colors.length];
}


/* ================================
   REVENUE CHART
================================ */

function RevenueChart() {
  const max = Math.max(...monthlyData.map((item) => item.revenue));

  return (
    <div className="revenue-chart">
      {monthlyData.map((item) => (
        <div className="revenue-column" key={item.month}>
          <div className="revenue-value">
            ₱{Math.round(item.revenue / 1000)}k
          </div>

          <div className="revenue-bar-container">
            <div
              className="revenue-bar-fill"
              style={{
                height: `${(item.revenue / max) * 100}%`,
              }}
            ></div>
          </div>

          <span>{item.month}</span>
        </div>
      ))}
    </div>
  );
}


/* ================================
   TRANSACTIONS
================================ */

function Transactions({ transactions, onAdd }) {
  return (
    <section className="page-content">

      <div className="page-title-row">
        <div>
          <h2>Transactions</h2>
          <p>Manage all income and expense transactions.</p>
        </div>

        <button className="add-button" onClick={onAdd}>
          + Add Transaction
        </button>
      </div>

      <div className="card">
        <TransactionTable transactions={transactions} />
      </div>
    </section>
  );
}


function TransactionTable({ transactions }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Account</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan="7" className="empty">
                No transactions found.
              </td>
            </tr>
          ) : (
            transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.date}</td>

                <td>
                  <strong>{transaction.description}</strong>
                </td>

                <td>{transaction.category}</td>

                <td>{transaction.account}</td>

                <td>
                  <span
                    className={
                      transaction.type === "Income"
                        ? "badge income"
                        : "badge expense"
                    }
                  >
                    {transaction.type}
                  </span>
                </td>

                <td
                  className={
                    transaction.type === "Income"
                      ? "amount income-text"
                      : "amount expense-text"
                  }
                >
                  {transaction.type === "Income" ? "+" : "-"}
                  {formatMoney(transaction.amount)}
                </td>

                <td>
                  <span
                    className={
                      transaction.status === "Completed"
                        ? "status completed"
                        : "status pending"
                    }
                  >
                    {transaction.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}


/* ================================
   REVENUE PAGE
================================ */

function Revenue({ transactions, totalRevenue }) {
  const revenueTransactions = transactions.filter(
    (item) => item.type === "Income"
  );

  return (
    <section className="page-content">
      <div className="page-title-row">
        <div>
          <h2>Revenue Management</h2>
          <p>Track and monitor all business income.</p>
        </div>
      </div>

      <div className="stats">
        <StatCard
          title="Total Revenue"
          amount={totalRevenue}
          change="+12.8%"
          icon="↗"
          type="income"
        />

        <StatCard
          title="Revenue Transactions"
          amount={revenueTransactions.length}
          change="+8.2%"
          icon="▤"
          type="profit"
          raw
        />

        <StatCard
          title="Average Revenue"
          amount={
            revenueTransactions.length
              ? totalRevenue / revenueTransactions.length
              : 0
          }
          change="+6.4%"
          icon="₱"
          type="margin"
        />
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3>Revenue Transactions</h3>
            <p>Income records</p>
          </div>
        </div>

        <TransactionTable transactions={revenueTransactions} />
      </div>
    </section>
  );
}


/* ================================
   EXPENSE PAGE
================================ */

function Expenses({ transactions, totalExpenses }) {
  const expenseTransactions = transactions.filter(
    (item) => item.type === "Expense"
  );

  return (
    <section className="page-content">
      <div className="page-title-row">
        <div>
          <h2>Expense Management</h2>
          <p>Monitor business spending and operating costs.</p>
        </div>
      </div>

      <div className="stats">
        <StatCard
          title="Total Expenses"
          amount={totalExpenses}
          change="+5.4%"
          icon="↘"
          type="expense"
        />

        <StatCard
          title="Expense Transactions"
          amount={expenseTransactions.length}
          change="+3.2%"
          icon="▤"
          type="margin"
          raw
        />

        <StatCard
          title="Average Expense"
          amount={
            expenseTransactions.length
              ? totalExpenses / expenseTransactions.length
              : 0
          }
          change="-2.4%"
          icon="₱"
          type="expense"
        />
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3>Expense Transactions</h3>
            <p>Business expenditure records</p>
          </div>
        </div>

        <TransactionTable transactions={expenseTransactions} />
      </div>
    </section>
  );
}


/* ================================
   BUDGET Management
================================ */

function Budget() {
  const budgets = [
    {
      category: "Payroll",
      budget: 100000,
      used: 68000,
    },
    {
      category: "Operations",
      budget: 120000,
      used: 72000,
    },
    {
      category: "Marketing",
      budget: 50000,
      used: 28000,
    },
    {
      category: "Utilities",
      budget: 25000,
      used: 12500,
    },
    {
      category: "Transportation",
      budget: 20000,
      used: 7200,
    },
  ];

  return (
    <section className="page-content">
      <div className="page-title-row">
        <div>
          <h2>Budget Management</h2>
          <p>Plan, monitor and control your financial budget.</p>
        </div>

        <button className="add-button">+ Create Budget</button>
      </div>

      <div className="budget-grid">
        {budgets.map((budget) => {
          const percentage = (budget.used / budget.budget) * 100;

          return (
            <div className="card budget-card" key={budget.category}>
              <div className="budget-header">
                <div>
                  <h3>{budget.category}</h3>
                  <p>Monthly Budget</p>
                </div>

                <strong>{percentage.toFixed(0)}%</strong>
              </div>

              <div className="progress">
                <div
                  style={{
                    width: `${Math.min(percentage, 100)}%`,
                  }}
                ></div>
              </div>

              <div className="budget-values">
                <span>
                  Used <strong>{formatMoney(budget.used)}</strong>
                </span>

                <span>
                  Budget <strong>{formatMoney(budget.budget)}</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}


/* ================================
   ACCOUNTS
================================ */

function Accounts() {
  const total = accounts.reduce(
    (sum, account) => sum + account.balance,
    0
  );

  return (
    <section className="page-content">
      <div className="page-title-row">
        <div>
          <h2>Accounts</h2>
          <p>Manage bank accounts and cash balances.</p>
        </div>

        <button className="add-button">+ Add Account</button>
      </div>

      <div className="account-total card">
        <div>
          <span>Total Available Balance</span>
          <h2>{formatMoney(total)}</h2>
        </div>

        <div className="account-total-icon">₱</div>
      </div>

      <div className="account-grid">
        {accounts.map((account) => (
          <div className="card account-card" key={account.name}>
            <div className="account-top">
              <div className="bank-icon">₱</div>

              <span className="account-type">
                {account.type}
              </span>
            </div>

            <h3>{account.name}</h3>

            <p>{account.number}</p>

            <div className="account-balance">
              <span>Available Balance</span>
              <strong>{formatMoney(account.balance)}</strong>
            </div>

            <button className="account-button">
              View Account →
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}


/* ================================
   REPORTS
================================ */

function Reports({
  totalRevenue,
  totalExpenses,
  netProfit,
}) {
  const profitMargin =
    totalRevenue > 0
      ? (netProfit / totalRevenue) * 100
      : 0;

  return (
    <section className="page-content">
      <div className="page-title-row">
        <div>
          <h2>Financial Reports</h2>
          <p>Analyze your overall financial performance.</p>
        </div>

        <button className="add-button">
          ↓ Export Report
        </button>
      </div>

      <div className="report-summary">

        <div className="report-box">
          <span>Total Revenue</span>
          <strong>{formatMoney(totalRevenue)}</strong>
          <small>Current period</small>
        </div>

        <div className="report-box">
          <span>Total Expenses</span>
          <strong>{formatMoney(totalExpenses)}</strong>
          <small>Current period</small>
        </div>

        <div className="report-box">
          <span>Net Profit</span>
          <strong>{formatMoney(netProfit)}</strong>
          <small>Current period</small>
        </div>

        <div className="report-box">
          <span>Profit Margin</span>
          <strong>{profitMargin.toFixed(1)}%</strong>
          <small>Current period</small>
        </div>

      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3>Financial Performance</h3>
            <p>Revenue and expense comparison</p>
          </div>
        </div>

        <ProfitChart />
      </div>

      <div className="report-cards">
        <div className="card">
          <h3>Income Statement</h3>

          <div className="statement-row">
            <span>Revenue</span>
            <strong>{formatMoney(totalRevenue)}</strong>
          </div>

          <div className="statement-row">
            <span>Operating Expenses</span>
            <strong>{formatMoney(totalExpenses)}</strong>
          </div>

          <div className="statement-row total">
            <span>Net Income</span>
            <strong>{formatMoney(netProfit)}</strong>
          </div>
        </div>

        <div className="card">
          <h3>Financial Health</h3>

          <div className="health-item">
            <span>Profitability</span>
            <strong className="good">Healthy</strong>
          </div>

          <div className="health-item">
            <span>Expense Control</span>
            <strong className="good">Good</strong>
          </div>

          <div className="health-item">
            <span>Cash Flow</span>
            <strong className="good">Positive</strong>
          </div>

          <div className="health-item">
            <span>Budget Utilization</span>
            <strong>68%</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================
   PAYMENT MONITORING
================================ */

function PaymentMonitoring({ transactions }) {
  const payments = transactions.filter(
    (transaction) => transaction.type === "Income"
  );

  const totalPayments = payments.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0
  );

  const completedPayments = payments.filter(
    (transaction) => transaction.status === "Completed"
  );

  const pendingPayments = payments.filter(
    (transaction) => transaction.status === "Pending"
  );

  return (
    <section className="page-content">

      <div className="page-title-row">
        <div>
          <h2>Payment Monitoring</h2>
          <p>Monitor client payments and payment status.</p>
        </div>
      </div>

      <div className="stats">

        <StatCard
          title="Total Payments"
          amount={totalPayments}
          change="+12.8%"
          icon="₱"
          type="income"
        />

        <StatCard
          title="Completed Payments"
          amount={completedPayments.length}
          change="+8.2%"
          icon="✓"
          type="profit"
          raw
        />

        <StatCard
          title="Pending Payments"
          amount={pendingPayments.length}
          change="0%"
          icon="!"
          type="expense"
          raw
        />

      </div>

      <div className="card">

        <div className="card-header">
          <div>
            <h3>Payment Records</h3>
            <p>Client payment monitoring</p>
          </div>
        </div>

        <TransactionTable transactions={payments} />

      </div>

    </section>
  );
}


/* ================================
   COLLECTION REMINDER
================================ */

function CollectionReminder({ transactions }) {
  // YOUR EXISTING COLLECTION REMINDER CODE
}


/* ================================
   ACCOUNT RECEIVABLE
================================ */

function AccountReceivable({ transactions }) {
  const receivables = transactions.filter(
    (transaction) => transaction.type === "Income"
  );

  const totalReceivable = receivables.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0
  );

  const collected = receivables
    .filter((transaction) => transaction.status === "Completed")
    .reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0
    );

  const pending = receivables
    .filter((transaction) => transaction.status === "Pending")
    .reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0
    );

  return (
    <section className="page-content">

      <div className="page-title-row">
        <div>
          <h2>Account Receivable</h2>
          <p>
            Manage customer receivables, collections, and outstanding payments.
          </p>
        </div>

        <button className="add-button">
          + Add Receivable
        </button>
      </div>

      <div className="stats">

        <StatCard
          title="Total Receivable"
          amount={totalReceivable}
          change="Current Period"
          icon="₱"
          type="income"
        />

        <StatCard
          title="Collected"
          amount={collected}
          change="Completed"
          icon="✓"
          type="profit"
        />

        <StatCard
          title="Outstanding"
          amount={pending}
          change="For Collection"
          icon="!"
          type="expense"
        />

      </div>

      <div className="card">

        <div className="card-header">
          <div>
            <h3>Accounts Receivable Records</h3>
            <p>
              Customer payments and outstanding receivables
            </p>
          </div>
        </div>

        {receivables.length === 0 ? (
          <div className="empty">
            No accounts receivable records found.
          </div>
        ) : (
          <TransactionTable transactions={receivables} />
        )}

      </div>

    </section>
  );
}

/* ================================
   GENERAL LEDGER
================================ */

function GeneralLedger({ transactions }) {
  let runningBalance = 0;

  const ledgerTransactions = [...transactions]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((transaction) => {
      const debit =
        transaction.type === "Expense"
          ? Number(transaction.amount)
          : 0;

      const credit =
        transaction.type === "Income"
          ? Number(transaction.amount)
          : 0;

      runningBalance += credit - debit;

      return {
        ...transaction,
        debit,
        credit,
        balance: runningBalance,
      };
    });

  const totalDebit = ledgerTransactions.reduce(
    (sum, transaction) => sum + transaction.debit,
    0
  );

  const totalCredit = ledgerTransactions.reduce(
    (sum, transaction) => sum + transaction.credit,
    0
  );

  return (
    <section className="page-content">

      <div className="page-title-row">
        <div>
          <h2>General Ledger</h2>
          <p>
            View all financial transactions with debit,
            credit, and running balance.
          </p>
        </div>
      </div>

      {/* LEDGER SUMMARY */}
      <div className="stats">

        <StatCard
          title="Total Debit"
          amount={totalDebit}
          change="Expenses"
          icon="↘"
          type="expense"
        />

        <StatCard
          title="Total Credit"
          amount={totalCredit}
          change="Income"
          icon="↗"
          type="income"
        />

        <StatCard
          title="Net Balance"
          amount={totalCredit - totalDebit}
          change="Current Balance"
          icon="₱"
          type="profit"
        />

      </div>

      {/* LEDGER TABLE */}
      <div className="card">

        <div className="card-header">
          <div>
            <h3>General Ledger Records</h3>
            <p>Complete financial transaction history</p>
          </div>
        </div>

        <div className="table-wrapper">

          <table>

            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Account</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Balance</th>
              </tr>
            </thead>

            <tbody>

              {ledgerTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty">
                    No ledger records found.
                  </td>
                </tr>
              ) : (
                ledgerTransactions.map((transaction) => (
                  <tr key={transaction.id}>

                    <td>{transaction.date}</td>

                    <td>
                      <strong>
                        {transaction.description}
                      </strong>
                    </td>

                    <td>{transaction.category}</td>

                    <td>{transaction.account}</td>

                    <td className="amount expense-text">
                      {transaction.debit > 0
                        ? `-${formatMoney(transaction.debit)}`
                        : "-"}
                    </td>

                    <td className="amount income-text">
                      {transaction.credit > 0
                        ? `+${formatMoney(transaction.credit)}`
                        : "-"}
                    </td>

                    <td>
                      <strong>
                        {formatMoney(transaction.balance)}
                      </strong>
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

      </div>

    </section>
  );
}

export default App;



