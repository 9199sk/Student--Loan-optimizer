/**
 * chartData.js
 *
 * Transforms raw amortization schedule arrays into Recharts-ready datasets.
 *
 * Design rules:
 *  - No rounding of values in this layer (let Recharts receive full precision)
 *  - Thinning keeps line charts smooth and bar charts readable
 *  - Null values signal "loan ended" to Recharts (it draws a gap / stops)
 */

// ─────────────────────────────────────────────────────────────────────────────
// DATA THINNING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reduce an array to at most `maxPoints` entries while always keeping the
 * first and last element. Used to keep charts legible for long tenures.
 *
 * @param {Array}  data
 * @param {number} maxPoints
 * @returns {Array}
 */
function thin(data, maxPoints) {
  if (data.length <= maxPoints) return data;
  const step   = Math.ceil(data.length / maxPoints);
  const result = [];

  for (let i = 0; i < data.length; i += step) result.push(data[i]);

  // Guarantee last point is always included
  if (result[result.length - 1] !== data[data.length - 1]) {
    result.push(data[data.length - 1]);
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. REMAINING BALANCE COMPARISON
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Produces data for the balance-over-time line chart.
 *
 * Result shape: [{ month, normal, prepaid? }, ...]
 *  - `normal`  — remaining balance under the original schedule
 *  - `prepaid` — remaining balance with prepayments; null when loan has ended
 *
 * When prepaid loan ends before original, months after its end have prepaid = null.
 * Recharts interprets null as "stop drawing" for that series.
 *
 * @param {Array} originalSchedule  — rows from generateAmortizationSchedule()
 * @param {Array} prepaidSchedule   — rows from simulatePrepayment() (may be empty / same)
 * @param {number} [maxPoints=120]  — max data points for the chart
 * @returns {Array}
 */
export function prepareBalanceData(originalSchedule, prepaidSchedule = [], maxPoints = 120) {
  // Build prepaid lookup: month → balance
  const prepaidMap = new Map(prepaidSchedule.map(r => [r.month, r.balance]));

  const merged = originalSchedule.map(row => {
    const entry = { month: row.month, normal: row.balance };
    if (prepaidSchedule.length > 0) {
      // Use the prepaid balance for this month, or null if loan already closed
      entry.prepaid = prepaidMap.has(row.month) ? prepaidMap.get(row.month) : null;
    }
    return entry;
  });

  return thin(merged, maxPoints);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MONTHLY EMI COMPOSITION (Principal vs Interest)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Produces per-month principal / interest split for a stacked bar chart.
 *
 * Only includes repayment rows (moratorium rows have payment = 0).
 * Thinned to at most `maxBars` to keep the bar chart readable.
 *
 * Result shape: [{ month, principal, interest }, ...]
 *
 * @param {Array}  schedule  — rows from generateAmortizationSchedule()
 * @param {number} [maxBars=24]
 * @returns {Array}
 */
export function prepareEMIBreakdownData(schedule, maxBars = 24) {
  const repayRows = schedule.filter(r => !r.isMoratorium);

  const data = repayRows.map(row => ({
    month:     row.month,
    principal: row.principalPaid,
    interest:  row.interestPaid,
  }));

  return thin(data, maxBars);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CUMULATIVE INTEREST COMPARISON
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Produces running cumulative interest paid under both scenarios.
 *
 * Result shape: [{ month, cumOriginal, cumPrepaid? }, ...]
 *
 * @param {Array}  originalSchedule
 * @param {Array}  prepaidSchedule
 * @param {number} [maxPoints=120]
 * @returns {Array}
 */
export function prepareCumulativeInterestData(originalSchedule, prepaidSchedule = [], maxPoints = 120) {
  // Build prepaid running total map
  const prepaidRunning = new Map();
  let cumPrepaid = 0;
  prepaidSchedule.forEach(row => {
    if (!row.isMoratorium) cumPrepaid += row.interestPaid;
    prepaidRunning.set(row.month, cumPrepaid);
  });

  let cumOriginal = 0;
  const merged = originalSchedule.map(row => {
    if (!row.isMoratorium) cumOriginal += row.interestPaid;
    const entry = { month: row.month, cumOriginal };

    if (prepaidSchedule.length > 0) {
      // After prepaid loan closes, it stays flat at its final cumulative interest
      const lastPrepaidMonth = prepaidSchedule[prepaidSchedule.length - 1]?.month ?? 0;
      entry.cumPrepaid = prepaidRunning.has(row.month)
        ? prepaidRunning.get(row.month)
        : row.month > lastPrepaidMonth
          ? cumPrepaid   // stays flat after loan is paid off
          : null;
    }
    return entry;
  });

  return thin(merged, maxPoints);
}
