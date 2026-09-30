/**
 * formatters.js
 *
 * Display-layer formatting utilities.
 * All rounding of financial values happens HERE — never in the calculation engine.
 */

/**
 * Format a number as Indian Rupee currency.
 * Uses INR locale for lakh/crore grouping (e.g. ₹12,34,567).
 *
 * @param {number} amount
 * @param {object} [opts]
 * @param {number} [opts.decimals=0]     - Decimal places to show
 * @param {boolean} [opts.compact=false] - Use compact notation (₹12.3L, ₹1.2Cr)
 * @returns {string}
 */
export function formatINR(amount, { decimals = 0, compact = false } = {}) {
  if (amount === null || amount === undefined || !isFinite(amount)) return '—';

  if (compact) {
    if (Math.abs(amount) >= 1e7) {
      return `₹${(amount / 1e7).toFixed(2)}Cr`;
    }
    if (Math.abs(amount) >= 1e5) {
      return `₹${(amount / 1e5).toFixed(2)}L`;
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Format a month count into a human-readable tenure string.
 * e.g. 120 → "10 yrs", 15 → "1 yr 3 mos", 11 → "11 mos"
 *
 * @param {number} months
 * @returns {string}
 */
export function formatTenure(months) {
  if (!Number.isFinite(months) || months <= 0) return '—';
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) return `${remainingMonths} mo${remainingMonths !== 1 ? 's' : ''}`;
  if (remainingMonths === 0) return `${years} yr${years !== 1 ? 's' : ''}`;
  return `${years} yr${years !== 1 ? 's' : ''} ${remainingMonths} mo${remainingMonths !== 1 ? 's' : ''}`;
}

/**
 * Format a Date into a readable month-year string.
 * e.g. new Date('2034-09-01') → "Sep 2034"
 *
 * @param {Date|string} date
 * @returns {string}
 */
export function formatMonthYear(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

/**
 * Format a Date into a full readable date.
 * e.g. "15 Sep 2034"
 *
 * @param {Date|string} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Round a number to a given number of decimal places.
 * Uses "round half away from zero" (standard financial rounding).
 *
 * @param {number} value
 * @param {number} [places=2]
 * @returns {number}
 */
export function round(value, places = 2) {
  const factor = Math.pow(10, places);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Format a percentage.
 * e.g. 10.5 → "10.50%"
 *
 * @param {number} value
 * @param {number} [decimals=2]
 * @returns {string}
 */
export function formatPercent(value, decimals = 2) {
  if (!isFinite(value)) return '—';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Abbreviate a large INR number for axis labels in charts.
 * e.g. 1000000 → "₹10L", 500000 → "₹5L", 10000000 → "₹1Cr"
 *
 * @param {number} value
 * @returns {string}
 */
export function formatChartAxis(value) {
  if (!isFinite(value)) return '';
  if (Math.abs(value) >= 1e7) return `₹${(value / 1e7).toFixed(1)}Cr`;
  if (Math.abs(value) >= 1e5) return `₹${(value / 1e5).toFixed(1)}L`;
  if (Math.abs(value) >= 1e3) return `₹${(value / 1e3).toFixed(0)}K`;
  return `₹${value.toFixed(0)}`;
}
