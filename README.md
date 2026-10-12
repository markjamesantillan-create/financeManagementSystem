# FinCore Agency Financial Management

A React + Vite financial management dashboard designed for a manpower/agency business.

## Included modules
- Dashboard
- Income / Revenue Management
- Expense Management
- Transactions / General Ledger
- Clients & Project Profitability
- Employees & Staff
- Payroll
- Budget Management
- Profit & Loss
- Cash Flow
- Financial Reports
- AI Financial Suggestions
- Settings

## Run locally

1. Install Node.js.
2. Open the `frontend` folder in a terminal.
3. Run:

```bash
npm install
npm run dev
```

The dev command starts the backend, waits for its database to be ready, then starts Vite. Open `http://127.0.0.1:5173` after it appears in the terminal. Stop both servers with Ctrl+C.

## Notes
The app uses the Node/Express backend in `../Backend` and PostgreSQL settings in `../Backend/.env`.

## Source layout
- `src/App.jsx` contains the application shell and page selection.
- `src/components/` contains shared UI components.
- `src/modules/` groups feature pages by business area.
- `src/pages/auth/` contains the login page; `src/pages/` also contains
  extracted page implementations.
- `src/styles/` contains the global stylesheet and module-specific styles.
- `src/assets/` contains application assets.
- `scripts/diagnostics/` contains frontend inspection utilities.

The API remains in the sibling `Backend` directory. The Vite proxy and
development startup configuration remain at the frontend root.

## Privacy display
Financial amounts and selected personal or account identifiers are masked in
the interface and can be revealed one value at a time. This is a display
control, not encryption; API responses and stored values are unchanged.
Explicit print and export actions continue to produce readable financial
records.

## Revenue and profit reports

Revenue Reports uses `GET /api/reports/revenue` and recognizes valid issued
billings on an accrual basis. Verified payment receipts are presented separately
as collections to avoid counting invoices and their payments as two revenues.
It supports date/client/category/search filters, client and invoice details,
monthly/quarterly/annual trend grouping, print/PDF, and spreadsheet-compatible
CSV export.

Profit Analysis uses the database-backed income-statement endpoint for the
selected period and comparison period. Expense breakdowns follow the existing
backend report calculations; budget targets and recommendations are not shown
because the report endpoint does not provide reconciled values for them. Both
reports support browser print / Save as PDF and spreadsheet-compatible CSV
downloads that open in Excel.
