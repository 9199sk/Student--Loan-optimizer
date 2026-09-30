/**
 * chartTheme.js
 *
 * Centralised Recharts visual constants for the dark fintech theme.
 * Import these instead of hard-coding colours in each chart file.
 */

export const COLORS = {
  normal:      '#6366f1',   // indigo-500  — original / no-prepayment series
  prepaid:     '#10b981',   // emerald-500 — with-prepayment series
  principal:   '#6366f1',   // indigo-500
  interest:    '#f43f5e',   // rose-500
  saved:       '#10b981',   // emerald-500
  grid:        '#1e293b',   // slate-800
  gridOpacity: 0.6,
  tick:        '#64748b',   // slate-500
  tooltipBg:   '#0f172a',   // slate-950
  tooltipBorder:'#334155',  // slate-700
};

export const CHART_MARGINS = { top: 8, right: 16, bottom: 0, left: 0 };

/** Y-axis tick formatter — compact INR labels */
export function yAxisFormatter(value) {
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(1)}Cr`;
  if (value >= 1e5) return `₹${(value / 1e5).toFixed(1)}L`;
  if (value >= 1e3) return `₹${(value / 1e3).toFixed(0)}K`;
  return `₹${value}`;
}

/** X-axis tick formatter — just the month number */
export function xAxisFormatter(value) {
  return `${value}`;
}
