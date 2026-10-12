const fs = require('fs');
const path = require('path');
const cssPath = path.join(__dirname, '..', '..', 'src', 'styles', 'index.css');
const css = fs.readFileSync(cssPath, 'utf8');
const classes = [
  'kpi-card', 'report-grid', 'card', 'filter-bar', 'filter-group', 'filter-input', 'filter-select',
  'btn', 'table-card', 'th-with-action', 'kpi-list', 'comparison-card', 'detail-table', 'status',
  'kpi-label', 'kpi-value', 'kpi-sub', 'sentence', 'report-heading', 'report-lines', 'report-footer',
  'report-note', 'empty', 'empty-state', 'filter-actions', 'row-value', 'row-result', 'row-value-negative',
  'statement-section', 'section-title', 'details-card', 'header-vis', 'corrupted', 'management-page',
  'light-button', 'primary-button', 'status', 'timeline'
];
const re = new RegExp('^\\s*\\.(' + classes.join('|') + ')\\b', 'gm');
const seen = new Set();
let m;
while ((m = re.exec(css))) {
  if (!seen.has(m[1])) {
    seen.add(m[1]);
    const line = css.slice(0, m.index).split('\n').length;
    console.log(line + ': .' + m[1]);
  }
}
