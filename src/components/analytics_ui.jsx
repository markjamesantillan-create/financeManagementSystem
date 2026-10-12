// Shared presentational pieces for the Analytics Dashboard pages.
// Kept dependency-light (no charts here) so both Client Revenue and Payroll
// Cost analytics render the same cards, states, filters and insights.
import React from "react";
import { RefreshCw } from "lucide-react";
import RevealableAmount from "./RevealableAmount";

const money = (value) => new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
}).format(Number(value || 0));

const percent = (value) => `${Number(value || 0).toLocaleString("en-PH", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})}%`;

export { money, percent };

export function DashCard({ label, value, note, tone, display }) {
  return (
    <article className={`analytics-dash-card${tone ? ` ${tone}` : ""}`}>
      <span>{label}</span>
      <strong><RevealableAmount value={display ?? money(value)} /></strong>
      {note ? <small>{note}</small> : null}
    </article>
  );
}

export function DashPanel({ title, children }) {
  return (
    <section className="analytics-dash-panel">
      {title ? <h4>{title}</h4> : null}
      {children}
    </section>
  );
}

export function DashState({ loading, error, empty }) {
  if (loading) return <div className="analytics-dash-state">Loading analytics…</div>;
  if (error) return <div className="analytics-dash-state error" role="alert">{error}</div>;
  if (empty) return <div className="analytics-dash-state">No records found for the selected period.</div>;
  return null;
}

export function TrendChip({ value, suffix }) {
  const num = Number(value || 0);
  const tone = num > 0.05 ? "up" : num < -0.05 ? "down" : "flat";
  const arrow = num > 0.05 ? "↗" : num < -0.05 ? "↘" : "→";
  return <span className={`analytics-dash-chip ${tone}`}>{arrow} {percent(Math.abs(num))}{suffix ? ` ${suffix}` : ""}</span>;
}

export function DashFilters({ children, onSubmit }) {
  return (
    <form className="analytics-dash-filters" onSubmit={onSubmit}>
      {children}
    </form>
  );
}

export function RefreshButton({ onClick, loading }) {
  return (
    <button type="button" className="light-button" onClick={onClick} disabled={loading}>
      <RefreshCw size={15} /> Refresh
    </button>
  );
}
