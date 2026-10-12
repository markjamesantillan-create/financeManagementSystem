import React, { useState, useEffect } from 'react';
import { RefreshCw, Printer, Download, Eye, TrendingUp, TrendingDown, Clock3 } from 'lucide-react';
import RevealableAmount from "./RevealableAmount";
import RevealableText from "./RevealableText";

const money = (v) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(Number(v || 0));
const fmt = (d) => { if (!d) return '\u2014'; const x = new Date(d + 'T00:00:00'); return isNaN(x.getTime()) ? d : x.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }); };
const fmtLong = (d) => { if (!d) return '\u2014'; const x = new Date(d + 'T00:00:00'); return isNaN(x.getTime()) ? d : x.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); };
const periodLabels = { monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Yearly', yearly: 'Yearly' };
const periodLabelsShort = { monthly: 'Month', quarterly: 'Quarter', annual: 'Year', yearly: 'Year' };
const periodDescriptions = { monthly: 'Revenue and expenses for a single month.', quarterly: 'Revenue and expenses for a quarter (3 months).', annual: 'Revenue and expenses for a full year.', yearly: 'Revenue and expenses for a full year.' };
const emptySections = { revenue: { title: 'Revenue', total: 0, prev_total: 0, items: [] }, cost_of_services: { title: 'Cost of Services', total: 0, prev_total: 0, items: [] }, operating_expenses: { title: 'Operating Expenses', total: 0, prev_total: 0, items: [] }, other_income_expenses: { title: 'Other Income / Expenses', total: 0, prev_total: 0, items: [] }, tax_expense: { title: 'Tax Expense', total: 0, prev_total: 0, items: [] } };

const Breadcrumb = () => <div className='breadcrumb'><a href='#'>Financial Management</a><span className='breadcrumb-sep'>&#8250;</span><span>Income Statement</span></div>;

function KpiCard({ label, value, accent, onClick, sub, isAmount = true }) {
  return (
    <div className='kpi-card' onClick={onClick} title='Click for details'>
      <div className='kpi-label'>{label}</div>
      <div className='kpi-value'>{isAmount ? <RevealableAmount value={value} /> : value}</div>
      {sub && <div className='kpi-sub'>{sub}</div>}
    </div>
  );
}

export default function IncomeStatementReport({ onReportReady }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ period: 'monthly', department: 'All Departments', from: '', to: '' });
  const [showDetails, setShowDetails] = useState(false);
  const [activeKpi, setActiveKpi] = useState(null);
  const [compare, setCompare] = useState(true);
  const [generatedDate, setGeneratedDate] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => fetchIncomeStatement(), 350);
    return () => clearTimeout(timer);
  }, [filters.period, filters.department, filters.from, filters.to]);

  useEffect(() => { setGeneratedDate(new Date().toISOString()); }, []);

  const fetchIncomeStatement = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('period', filters.period);
      if (filters.department && filters.department !== 'All Departments') params.append('department', filters.department);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      const res = await fetch('/api/reports/income-statement?' + params);
      const result = await res.json();
      if (result.success) setData(result);
      else setError(result.message || 'Failed to fetch income statement.');
    } catch {
      setError('Connection error. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  const period = data?.period || { type: filters.period, from: '', to: '', label: '' };
  const comparisonPeriod = data?.comparison_period || null;
  const summary = data?.summary || {};
  const prevSummary = data?.previous_summary || {};
  const sections = data?.sections || emptySections;

  const totalRevenue = summary.total_revenue || 0;
  const totalCostOfServices = summary.total_cost_of_services || 0;
  const grossProfit = summary.gross_profit || 0;
  const grossProfitMargin = summary.gross_profit_margin || 0;
  const totalOperatingExpenses = summary.total_operating_expenses || 0;
  const operatingIncome = summary.operating_income || 0;
  const operatingMargin = summary.operating_margin || 0;
  const totalOtherIncomeExpenses = summary.total_other_income_expenses || 0;
  const incomeBeforeTax = summary.income_before_tax || 0;
  const taxExpense = summary.tax_expense || 0;
  const netIncome = summary.net_income || 0;
  const netProfitMargin = summary.net_profit_margin || 0;

  const renderPdfHtml = () => {
    const rows = [
      ['Total Revenue', totalRevenue],
      ['Total Cost of Services', totalCostOfServices],
      ['Gross Profit', grossProfit],
      ['Total Operating Expenses', totalOperatingExpenses],
      ['Operating Income', operatingIncome],
      ['Other Income / Expenses', totalOtherIncomeExpenses],
      ['Income Before Tax', incomeBeforeTax],
      ['Income Tax Expense', taxExpense],
      [netIncome >= 0 ? 'Net Income' : 'Net Loss', netIncome]
    ];
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Income Statement</title>
      <style>
        body { font-family: Arial, sans-serif; color: #203b4d; margin: 32px; }
        h1 { color: #102b4e; }
        .period { color: #718697; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px 12px; border-bottom: 1px solid #dce6ef; text-align: left; }
        th { background: #f1f6fb; }
        td:last-child, th:last-child { text-align: right; }
      </style></head><body>
      <h1>Income Statement</h1>
      <p class="period">PrimePower · ${periodLabels[filters.period] || filters.period} · ${fmt(period.from)} – ${fmt(period.to)}</p>
      <table><thead><tr><th>Account</th><th>Amount</th></tr></thead><tbody>
      ${rows.map(([label, amount]) => `<tr><td>${label}</td><td>${money(amount)}</td></tr>`).join('')}
      </tbody></table></body></html>`;
  };

  const handleKpiClick = (key) => { setActiveKpi((p) => (p === key ? null : key)); if (onReportReady) onReportReady(key); };

  if (loading && !data) {
    return (<section className='management-page'><div className='management-header'><h2>Income Statement</h2><p>Generating...</p></div><div className='card empty'><div className='empty-state'><Clock3 size={32} /><p>Loading...</p></div></div></section>);
  }

  return (<section className='management-page income-statement-page'>
    <Breadcrumb />
    <div className='management-header'>
      <div>
        <h2>Income Statement</h2>
        <p>{periodDescriptions[filters.period] || ''}{filters.period === 'monthly' && ' Reporting ' + fmtLong(period.from) + ' to ' + fmtLong(period.to) + '.'}</p>
      </div>
      <div className='management-actions'>
        <button className='btn btn-ghost' onClick={fetchIncomeStatement} disabled={loading} title='Refresh data'><RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />{loading ? 'Refreshing...' : 'Refresh Data'}</button>
        <button className='btn btn-secondary' title='Export as HTML' onClick={() => { const blob = new Blob([renderPdfHtml()], { type: 'text/html;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'Income-Statement-' + new Date().toISOString().slice(0, 10) + '.html'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }}><Download size={15} /> Export HTML</button>
        <button className='btn btn-primary' onClick={() => { const w = window.open(''); if (w) { w.document.write(renderPdfHtml()); w.document.close(); w.print(); } }}><Printer size={15} /> Print / Save PDF</button>
        <button className='btn btn-ghost' onClick={() => setShowDetails(!showDetails)} title={showDetails ? 'Hide transactions' : 'View details'}><Eye size={15} /> {showDetails ? 'Hide Details' : 'View Details'}</button>
      </div>
    </div>

    <div className='report-info'>
      <div className='info-item'><span className='info-label'>Report Title</span><span className='info-value'>Income Statement</span></div>
      <div className='info-item'><span className='info-label'>Company</span><span className='info-value'>PrimePower</span></div>
      <div className='info-item'><span className='info-label'>Reporting Period</span><span className='info-value'>{periodLabels[filters.period] || filters.period}</span></div>
      <div className='info-item'><span className='info-label'>Date Range</span><span className='info-value'>{fmt(period.from)} &#8211; {fmt(period.to)}</span></div>
      <div className='info-item'><span className='info-label'>Prepared By</span><span className='info-value'>Admin User</span></div>
      <div className='info-item'><span className='info-label'>Generated Date</span><span className='info-value'>{fmtLong(generatedDate || new Date().toISOString())}</span></div>
      <div className='info-item'><span className='info-label'>Report Status</span><span className={'info-value status ' + (data ? 'status-final' : '')}>{data ? 'Final' : 'Draft'}</span></div>
    </div>

    <div className='report-grid'>
      <div className='card report-main'>
        <div className='kpi-row'>
          <KpiCard label='Total Revenue' value={money(totalRevenue)} accent='bg-blue-100 text-blue-600' onClick={() => handleKpiClick('Total Revenue')} sub={data ? 'Ref: ' + period.label : ''} />
          <KpiCard label='Gross Profit' value={money(grossProfit)} accent='bg-green-100 text-green-600' onClick={() => handleKpiClick('Gross Profit')} sub={'Margin: ' + grossProfitMargin.toFixed(1) + '%'} />
          <KpiCard label='Operating Income' value={money(operatingIncome)} accent='bg-purple-100 text-purple-600' onClick={() => handleKpiClick('Operating Income')} sub={'Margin: ' + operatingMargin.toFixed(1) + '%'} />
          <KpiCard label='Net Income' value={money(netIncome)} accent={netIncome >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} onClick={() => handleKpiClick('Net Income')} sub={netIncome >= 0 ? 'Profit' : 'Net Loss'} />
          <KpiCard label='Profit Margin' value={netProfitMargin.toFixed(1) + '%'} accent='bg-orange-100 text-orange-600' onClick={() => handleKpiClick('Profit Margin')} sub='Net Income / Total Revenue' isAmount={false} />
        </div>

        <div className='statement-body'>
          {/* Revenue */}
          <div className='statement-section'>
            <h3 className='section-title'>1. Revenue / Income</h3>
            <div className='statement-rows'>
              <div className='row-item'><div className='row-desc'><span className='row-label'>Service Revenue</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(summary.service_revenue || 0)} /></div></div>
              <div className='row-item'><div className='row-desc'><span className='row-label'>Client Billing Revenue</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(summary.client_billing_revenue || 0)} /></div></div>
              <div className='row-item'><div className='row-desc'><span className='row-label'>Other Income</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(summary.other_income || 0)} /></div></div>
            </div>
            <div className='statement-divider'></div>
            <div className='row-item row-result'><div className='row-desc'><span className='row-label'>Total Revenue</span></div><div className='row-value-wrap'><RevealableAmount className='row-value row-value-big' value={money(totalRevenue)} /></div></div>
          </div>

          {/* Cost of Services */}
          <div className='statement-section'>
            <h3 className='section-title'>2. Cost of Services / Cost of Revenue</h3>
            <div className='statement-rows'>
              <div className='row-item'><div className='row-desc'><span className='row-label'>Direct Labor</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(summary.direct_labor || 0)} /></div></div>
              <div className='row-item'><div className='row-desc'><span className='row-label'>Project / Service Materials</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(summary.materials_supplies || 0)} /></div></div>
              <div className='row-item'><div className='row-desc'><span className='row-label'>Outsourced Services</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(summary.project_costs || 0)} /></div></div>
              <div className='row-item'><div className='row-desc'><span className='row-label'>Other Direct Costs</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(summary.other_direct_costs || 0)} /></div></div>
            </div>
            <div className='statement-divider'></div>
            <div className='row-item row-result'><div className='row-desc'><span className='row-label'>Total Cost of Services</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(totalCostOfServices)} /></div></div>
            <div className='statement-divider'></div>
            <div className='row-item row-result'><div className='row-desc'><span className='row-label'>Gross Profit</span><span className='row-sub'>Total Revenue - Cost of Services</span></div><div className='row-value-wrap'><RevealableAmount className='row-value row-value-big' value={money(grossProfit)} /></div></div>
          </div>

          {/* Operating Expenses */}
          <div className='statement-section'>
            <h3 className='section-title'>3. Operating Expenses</h3>
            <div className='statement-rows'>
              <div className='row-group'><span className='row-group-title'>Payroll Expenses</span>
                <div className='row-item'><div className='row-desc'><span className='row-label'>Employee Salaries</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(summary.employee_salaries || 0)} /></div></div>
                <div className='row-item'><div className='row-desc'><span className='row-label'>Benefits &amp; Allowances</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(summary.benefits_allowances || 0)} /></div></div>
              </div>
              <div className='row-group'><span className='row-group-title'>Office Expenses</span>
                <div className='row-item'><div className='row-desc'><span className='row-label'>Office Supplies</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(summary.office_supplies || 0)} /></div></div>
                    <div className='row-item'><div className='row-desc'><span className='row-label'>Rent</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(summary.rent || 0)} /></div></div>
              </div>
              <div className='row-item'><div className='row-desc'><span className='row-label'>Utilities</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(summary.utilities || 0)} /></div></div>
              <div className='row-group'><span className='row-group-title'>Administrative Expenses</span>
                <div className='row-item'><div className='row-desc'><span className='row-label'>Transportation</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(summary.transportation || 0)} /></div></div>
                <div className='row-item'><div className='row-desc'><span className='row-label'>Repairs &amp; Maintenance</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(summary.maintenance || 0)} /></div></div>
              </div>
              <div className='row-item'><div className='row-desc'><span className='row-label'>Other Operating Expenses</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(summary.other_operating || 0)} /></div></div>
            </div>
            <div className='statement-divider'></div>
            <div className='row-item row-result'><div className='row-desc'><span className='row-label'>Total Operating Expenses</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(totalOperatingExpenses)} /></div></div>
          </div>

          {/* Operating Income */}
          <div className='statement-section'>
            <h3 className='section-title'>4. Operating Income</h3>
            <div className='statement-rows'>
              <div className='row-item row-result'><div className='row-desc'><span className='row-label'>Gross Profit</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(grossProfit)} /></div></div>
              <div className='row-item'><div className='row-desc'><span className='row-label'>Less: Operating Expenses</span></div><div className='row-value-wrap'><RevealableAmount className='row-value row-value-negative' value={money(totalOperatingExpenses)} /></div></div>
              <div className='row-item row-result'><div className='row-desc'><span className='row-label'>Operating Income</span></div><div className='row-value-wrap'><RevealableAmount className='row-value row-value-big' value={money(operatingIncome)} /></div></div>
              <div className='row-item'><div className='row-desc'><span className='row-label'>Operating Margin</span></div><div className='row-value-wrap'><strong>{operatingMargin.toFixed(1)}%</strong></div></div>
            </div>
          </div>

          {/* Other Income & Expenses */}
          <div className='statement-section'>
            <h3 className='section-title'>5. Other Income &amp; Expenses</h3>
            <div className='statement-rows'>
              <div className='row-group'><span className='row-group-title'>Other Income</span>
                <div className='row-item'><div className='row-desc'><span className='row-label'>Interest Income</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(summary.interest_income || 0)} /></div></div>
                <div className='row-item'><div className='row-desc'><span className='row-label'>Gain on Asset Disposal</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(summary.gain_disposal || 0)} /></div></div>
              </div>
              <div className='row-group'><span className='row-group-title'>Other Expenses</span>
                <div className='row-item'><div className='row-desc'><span className='row-label'>Bank Charges</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(summary.bank_charges || 0)} /></div></div>
                <div className='row-item'><div className='row-desc'><span className='row-label'>Interest Expense</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(summary.interest_expense || 0)} /></div></div>
              </div>
            </div>
            <div className='statement-divider'></div>
            <div className='row-item row-result'><div className='row-desc'><span className='row-label'>Total Other Income / Expenses</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(totalOtherIncomeExpenses)} /></div></div>
          </div>

          {/* Income Before Tax */}
          <div className='statement-section'>
            <h3 className='section-title'>6. Income Before Tax</h3>
            <div className='statement-rows'>
              <div className='row-item row-result'><div className='row-desc'><span className='row-label'>Operating Income</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(operatingIncome)} /></div></div>
              <div className='row-item'><div className='row-desc'><span className='row-label'>+ Other Income</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(Math.max(0, totalOtherIncomeExpenses))} /></div></div>
              <div className='row-item'><div className='row-desc'><span className='row-label'>- Other Expenses</span></div><div className='row-value-wrap'><RevealableAmount className='row-value row-value-negative' value={money(Math.max(0, -totalOtherIncomeExpenses))} /></div></div>
              <div className='row-item row-result'><div className='row-desc'><span className='row-label'>Income Before Tax</span></div><div className='row-value-wrap'><RevealableAmount className='row-value row-value-big' value={money(incomeBeforeTax)} /></div></div>
            </div>
          </div>

          {/* Tax Expense */}
          <div className='statement-section'>
            <h3 className='section-title'>7. Income Tax Expense</h3>
            <div className='statement-rows'>
              <div className='row-item'><div className='row-desc'><span className='row-label'>Corporate Income Tax (20%)</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(taxExpense)} /></div></div>
            </div>
            <div className='statement-divider'></div>
          </div>

          {/* Net Income / Net Loss */}
          <div className='statement-section'>
            <h3 className='section-title'>8. Net Income / Net Loss</h3>
            <div className='statement-rows'>
              <div className='row-item row-result'><div className='row-desc'><span className='row-label'>Income Before Tax</span></div><div className='row-value-wrap'><RevealableAmount className='row-value' value={money(incomeBeforeTax)} /></div></div>
              <div className='row-item'><div className='row-desc'><span className='row-label'>- Income Tax Expense</span></div><div className='row-value-wrap'><RevealableAmount className='row-value row-value-negative' value={money(taxExpense)} /></div></div>
              <div className={'row-item row-result ' + (netIncome >= 0 ? 'row-result-profit' : 'row-result-loss')}>
                <div className='row-desc'><span className='row-label'>{netIncome >= 0 ? 'NET INCOME' : 'NET LOSS'}</span><span className='row-sub'>Total Revenue - Total Expenses</span></div>
                <div className='row-value-wrap'><RevealableAmount className={'row-value row-value-big ' + (netIncome >= 0 ? 'row-value-profit' : 'row-value-loss')} value={money(netIncome)} /></div>
              </div>
              <div className='row-item'><div className='row-desc'><span className='row-label'>Profit Margin</span></div><div className='row-value-wrap'><strong>{netProfitMargin.toFixed(1)}%</strong></div></div>
            </div>
          </div>
        </div>
      </div>

      <div className='report-side'>
        <div className='card'>
          <h3 className='card-title'>Summary</h3>
          <div className='kpi-list'>
            <div><span className='kpi-label'>Total Expenses</span><RevealableAmount value={money(summary.total_expenses || (totalOperatingExpenses + Math.abs(totalOtherIncomeExpenses)))} /></div>
            <div><span className='kpi-label'>Gross Profit Margin</span><strong>{grossProfitMargin.toFixed(1)}%</strong></div>
            <div><span className='kpi-label'>Operating Margin</span><strong>{operatingMargin.toFixed(1)}%</strong></div>
            <div><span className='kpi-label'>Net Profit Margin</span><strong>{netProfitMargin.toFixed(1)}%</strong></div>
          </div>
          {comparisonPeriod && (
            <div className='card comparison-card'>
              <h4 className='card-subtitle'>Compared to Previous {periodLabelsShort[filters.period] || filters.period}</h4>
              <div className='comparison-list'>
                <div className='comparison-row'><span>Total Revenue</span><RevealableAmount className='comparison-amount' value={money(prevSummary.total_revenue)} /><RevealableAmount className={'comparison-delta ' + (Number(prevSummary.total_revenue || 0) >= totalRevenue ? 'positive' : 'negative')} value={money(totalRevenue - prevSummary.total_revenue)} /></div>
                <div className='comparison-row'><span>Total Expenses</span><RevealableAmount className='comparison-amount' value={money(prevSummary.total_expenses)} /><RevealableAmount className={'comparison-delta ' + (Number(prevSummary.total_expenses || 0) >= (summary.total_expenses || 0) ? 'positive' : 'negative')} value={money((summary.total_expenses || 0) - prevSummary.total_expenses)} /></div>
                <div className='comparison-row'><span>Net Income</span><RevealableAmount className={'comparison-amount ' + (netIncome >= prevSummary.net_income ? 'comparison-positive' : 'comparison-negative')} value={money(netIncome)} /><RevealableAmount className={'comparison-delta ' + (netIncome >= prevSummary.net_income ? 'positive' : 'negative')} value={money(netIncome - prevSummary.net_income)} /></div>
              </div>
            </div>
          )}
          {showDetails && details && Object.keys(details).length > 0 && (
            <div className='card details-card'>
              <h4 className='card-subtitle'>Underlying Transactions</h4>
              <div className='details-grid'>
                {Object.entries(details).map(([key, rows]) => Array.isArray(rows) && rows.length > 0 && (
                  <div key={key} className='detail-block'>
                    <h5 className='detail-title'>{key.replace(/_/g, ' ')}</h5>
                    <table className='detail-table'>
                      <thead><tr><th>Date</th><th>Description</th><th>Amount</th></tr></thead>
                      <tbody>{rows.slice(0, 15).map((row, idx) => (<tr key={idx}><td className='detail-date'>{fmtLong(row.date || row.transaction_date || '')}</td><td className='detail-desc'><RevealableText value={row.description || row.reference || row.note || '\u2014'} /></td><td className='detail-amount'><RevealableAmount value={money(row.amount || row.balance || row.total || 0)} /></td></tr>))}</tbody>
                    </table>
                    {rows.length > 15 && <p className='detail-more'>... and {rows.length - 15} more</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {(error || loading) && (
            <div className='card empty'><div className='empty-state'><Clock3 size={32} /><p>{loading ? 'Loading...' : error || 'No data'}</p></div></div>
          )}
        </div>
      </div>
    </div>

    <div className='report-footer'>
      <div className='filter-bar'>
        <div className='filter-group'><label className='filter-label'>From</label><input type='date' className='filter-input' value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} placeholder='YYYY-MM-DD' /></div>
        <div className='filter-group'><label className='filter-label'>To</label><input type='date' className='filter-input' value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} placeholder='YYYY-MM-DD' /></div>
        <div className='filter-group'><label className='filter-label'>Period</label><select className='filter-select' value={filters.period} onChange={(e) => setFilters({ ...filters, period: e.target.value })}><option value='monthly'>Monthly</option><option value='quarterly'>Quarterly</option><option value='annual'>Yearly</option></select></div>
        <div className='filter-group'><label className='filter-label'>Department</label><select className='filter-select' value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}><option value='All Departments'>All Departments</option><option value='Operations'>Operations</option><option value='Engineering'>Engineering</option><option value='Field Operations'>Field Operations</option><option value='Technical'>Technical</option><option value='Services'>Services</option></select></div>
        <div className='filter-group filter-actions'>
          <button className='btn btn-primary btn-sm' onClick={fetchIncomeStatement} disabled={loading}><RefreshCw size={14} /> Generate Report</button>
          <button className='btn btn-secondary btn-sm' onClick={() => setCompare(!compare)}>{compare ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{compare ? 'Compare Period' : 'Hide Comparison'}</button>
        </div>
      </div>
      <p className='report-note'>{summary.total_revenue > 0 ? <>Total Revenue: <RevealableAmount value={money(summary.total_revenue)} /></> : 'No revenue data for ' + filters.period + ' period.'}</p>
    </div>
  </section>);
}
