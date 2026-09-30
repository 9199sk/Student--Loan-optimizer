/**
 * loanCalculations.js
 *
 * Core financial calculation engine for the Student Loan Optimizer.
 * All functions are pure — no React, no DOM, no MongoDB dependencies.
 *
 * PRECISION RULES:
 *  - Never round intermediate values.
 *  - Use full floating-point precision throughout.
 *  - Only round at the presentation layer (formatters.js).
 *
 * FORMULA:
 *  EMI = P × r × (1+r)^n / ((1+r)^n − 1)
 *  where r = annualRate / 12 / 100  (monthly rate)
 *        n = tenure in months
 */

// ─────────────────────────────────────────────────────────────────────────────
// INPUT VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates the core loan input fields.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateLoanInput({ principal, annualRate, tenureMonths, moratoriumMonths = 0, startDate }) {
  const errors = [];

  if (typeof principal !== 'number' || !isFinite(principal) || principal <= 0) {
    errors.push('Principal must be a positive number.');
  }
  if (principal > 1e9) {
    errors.push('Principal cannot exceed ₹100 crore.');
  }
  if (typeof annualRate !== 'number' || !isFinite(annualRate) || annualRate < 0) {
    errors.push('Annual interest rate must be zero or positive.');
  }
  if (annualRate > 100) {
    errors.push('Annual interest rate cannot exceed 100%.');
  }
  if (!Number.isInteger(tenureMonths) || tenureMonths <= 0) {
    errors.push('Tenure must be a positive whole number of months.');
  }
  if (tenureMonths > 600) {
    errors.push('Tenure cannot exceed 50 years (600 months).');
  }
  if (!Number.isInteger(moratoriumMonths) || moratoriumMonths < 0) {
    errors.push('Moratorium months must be a non-negative integer.');
  }
  if (moratoriumMonths >= tenureMonths) {
    errors.push('Moratorium period must be shorter than the total tenure.');
  }
  if (startDate && isNaN(new Date(startDate).getTime())) {
    errors.push('Start date must be a valid date.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates prepayment inputs.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePrepaymentInput({ extraMonthly = 0, lumpSum = 0, lumpSumMonth = 0 }, tenureMonths) {
  const errors = [];

  if (typeof extraMonthly !== 'number' || !isFinite(extraMonthly) || extraMonthly < 0) {
    errors.push('Extra monthly payment must be zero or positive.');
  }
  if (typeof lumpSum !== 'number' || !isFinite(lumpSum) || lumpSum < 0) {
    errors.push('Lump-sum payment must be zero or positive.');
  }
  if (lumpSum > 0) {
    if (!Number.isInteger(lumpSumMonth) || lumpSumMonth < 1) {
      errors.push('Lump-sum payment month must be a positive integer.');
    }
    if (lumpSumMonth > tenureMonths) {
      errors.push(`Lump-sum payment month cannot exceed loan tenure (${tenureMonths} months).`);
    }
  }

  return { valid: errors.length === 0, errors };
}


// ─────────────────────────────────────────────────────────────────────────────
// CORE CALCULATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates the monthly EMI using the standard reducing-balance formula.
 *
 * Edge case: when annualRate === 0, EMI = P / n (simple equal instalment).
 *
 * @param {number} principal   - Loan amount in ₹
 * @param {number} annualRate  - Annual interest rate as a percentage (e.g. 10 for 10%)
 * @param {number} tenureMonths - Total repayment tenure in months
 * @returns {number} Monthly EMI (full precision, not rounded)
 */
export function calculateEMI(principal, annualRate, tenureMonths) {
  if (annualRate === 0) {
    return principal / tenureMonths;
  }

  const r = annualRate / 12 / 100;           // monthly interest rate
  const compoundFactor = Math.pow(1 + r, tenureMonths);
  return (principal * r * compoundFactor) / (compoundFactor - 1);
}


/**
 * Calculates the effective principal after a moratorium period.
 *
 * During moratorium, no EMI is paid — interest accrues and is capitalized
 * (added to the outstanding principal). After moratorium the EMI is
 * recalculated on this inflated principal for the remaining tenure.
 *
 * @param {number} principal         - Original disbursed principal
 * @param {number} annualRate        - Annual interest rate %
 * @param {number} moratoriumMonths  - Number of moratorium months
 * @returns {number} Capitalized principal after moratorium
 */
export function calculatePostMoratoriumPrincipal(principal, annualRate, moratoriumMonths) {
  if (moratoriumMonths === 0 || annualRate === 0) return principal;
  const r = annualRate / 12 / 100;
  return principal * Math.pow(1 + r, moratoriumMonths);
}


/**
 * Generates a month-by-month amortization schedule WITHOUT any prepayment.
 *
 * @param {number} principal        - Original disbursed principal (₹)
 * @param {number} annualRate       - Annual interest rate %
 * @param {number} tenureMonths     - Repayment tenure in months (after moratorium)
 * @param {number} moratoriumMonths - Months before repayment starts (default 0)
 * @param {Date|string} startDate   - Loan start date
 *
 * @returns {{
 *   schedule: Array<{
 *     month: number,
 *     date: Date,
 *     payment: number,
 *     principalPaid: number,
 *     interestPaid: number,
 *     balance: number,
 *     isMoratorium: boolean
 *   }>,
 *   emi: number,
 *   totalPayment: number,
 *   totalInterest: number,
 *   totalPrincipal: number
 * }}
 */
export function generateAmortizationSchedule(
  principal,
  annualRate,
  tenureMonths,
  moratoriumMonths = 0,
  startDate = new Date()
) {
  const schedule = [];
  const r = annualRate / 12 / 100;
  const start = new Date(startDate);

  // Step 1: Process moratorium months (interest capitalizes, nothing is paid)
  let balance = principal;
  for (let m = 1; m <= moratoriumMonths; m++) {
    const interestAccrued = balance * r;
    balance += interestAccrued;            // capitalize interest

    const date = new Date(start);
    date.setMonth(date.getMonth() + m - 1);

    schedule.push({
      month: m,
      date,
      payment: 0,
      principalPaid: 0,
      interestPaid: interestAccrued,       // accrued but NOT paid
      balance,
      isMoratorium: true,
    });
  }

  // Step 2: Recalculate EMI on the (possibly inflated) principal for remaining tenure
  const repaymentPrincipal = balance;
  const repaymentMonths = tenureMonths - moratoriumMonths;
  const emi = calculateEMI(repaymentPrincipal, annualRate, repaymentMonths);

  // Step 3: Generate repayment schedule
  for (let m = moratoriumMonths + 1; m <= tenureMonths; m++) {
    const interestComponent = balance * r;
    let principalComponent = emi - interestComponent;
    let payment = emi;

    // Final payment correction: don't let balance go negative
    if (principalComponent > balance) {
      principalComponent = balance;
      payment = principalComponent + interestComponent;
    }

    balance -= principalComponent;

    // Clamp floating-point dust to zero
    if (Math.abs(balance) < 0.005) balance = 0;

    const date = new Date(start);
    date.setMonth(date.getMonth() + m - 1);

    schedule.push({
      month: m,
      date,
      payment,
      principalPaid: principalComponent,
      interestPaid: interestComponent,
      balance,
      isMoratorium: false,
    });

    if (balance === 0) break;
  }

  // Totals (across repayment months only — moratorium rows have payment=0)
  const repaymentRows = schedule.filter(r => !r.isMoratorium);
  const totalPayment = repaymentRows.reduce((s, r) => s + r.payment, 0);
  const totalPrincipal = repaymentRows.reduce((s, r) => s + r.principalPaid, 0);
  const totalInterest = repaymentRows.reduce((s, r) => s + r.interestPaid, 0);

  return {
    schedule,
    emi,
    totalPayment,
    totalInterest,
    totalPrincipal,
  };
}


/**
 * Simulates the loan repayment WITH prepayments applied each month.
 *
 * Strategy:
 *  - Base EMI is fixed (calculated from original principal & tenure).
 *  - Every month, `extraMonthly` is ADDED on top of EMI.
 *  - At `lumpSumMonth`, an additional `lumpSum` one-time payment is applied.
 *  - Excess payment is capped at the remaining balance (never negative).
 *
 * @param {number} principal
 * @param {number} annualRate
 * @param {number} tenureMonths
 * @param {number} moratoriumMonths
 * @param {Date|string} startDate
 * @param {{
 *   extraMonthly?: number,
 *   lumpSum?: number,
 *   lumpSumMonth?: number
 * }} prepayment
 *
 * @returns {{
 *   schedule: Array<{
 *     month: number,
 *     date: Date,
 *     payment: number,
 *     principalPaid: number,
 *     interestPaid: number,
 *     balance: number,
 *     extraPayment: number,
 *     isMoratorium: boolean
 *   }>,
 *   emi: number,
 *   totalPayment: number,
 *   totalInterest: number,
 *   totalPrincipal: number,
 *   actualTenureMonths: number
 * }}
 */
export function simulatePrepayment(
  principal,
  annualRate,
  tenureMonths,
  moratoriumMonths = 0,
  startDate = new Date(),
  prepayment = {}
) {
  const { extraMonthly = 0, lumpSum = 0, lumpSumMonth = 0 } = prepayment;
  const r = annualRate / 12 / 100;
  const start = new Date(startDate);
  const schedule = [];

  // ── Moratorium phase ──────────────────────────────────────────────────────
  let balance = principal;
  for (let m = 1; m <= moratoriumMonths; m++) {
    const interestAccrued = balance * r;
    balance += interestAccrued;

    const date = new Date(start);
    date.setMonth(date.getMonth() + m - 1);

    schedule.push({
      month: m,
      date,
      payment: 0,
      principalPaid: 0,
      interestPaid: interestAccrued,
      balance,
      extraPayment: 0,
      isMoratorium: true,
    });
  }

  // ── EMI based on post-moratorium balance for remaining tenure ─────────────
  const repaymentPrincipal = balance;
  const repaymentMonths = tenureMonths - moratoriumMonths;
  const emi = calculateEMI(repaymentPrincipal, annualRate, repaymentMonths);

  // ── Repayment phase with prepayments ─────────────────────────────────────
  for (let m = moratoriumMonths + 1; m <= tenureMonths; m++) {
    if (balance <= 0) break;

    const interestComponent = balance * r;
    let principalFromEMI = emi - interestComponent;
    let extraThisMonth = extraMonthly;

    // Apply lump sum in the designated month
    const lumpSumThisMonth = (lumpSum > 0 && m === lumpSumMonth) ? lumpSum : 0;

    // Total principal reduction this month
    let totalPrincipalPaid = principalFromEMI + extraThisMonth + lumpSumThisMonth;

    // Cap so balance never goes negative
    if (totalPrincipalPaid > balance) {
      totalPrincipalPaid = balance;
      extraThisMonth = Math.max(0, totalPrincipalPaid - principalFromEMI - lumpSumThisMonth);
    }

    const totalPaymentThisMonth = interestComponent + totalPrincipalPaid;
    balance -= totalPrincipalPaid;

    if (Math.abs(balance) < 0.005) balance = 0;

    const date = new Date(start);
    date.setMonth(date.getMonth() + m - 1);

    schedule.push({
      month: m,
      date,
      payment: totalPaymentThisMonth,
      principalPaid: totalPrincipalPaid,
      interestPaid: interestComponent,
      balance,
      extraPayment: extraThisMonth + lumpSumThisMonth,
      isMoratorium: false,
    });

    if (balance === 0) break;
  }

  const repaymentRows = schedule.filter(r => !r.isMoratorium);
  const totalPayment = repaymentRows.reduce((s, r) => s + r.payment, 0);
  const totalPrincipal = repaymentRows.reduce((s, r) => s + r.principalPaid, 0);
  const totalInterest = repaymentRows.reduce((s, r) => s + r.interestPaid, 0);
  const actualTenureMonths = schedule[schedule.length - 1]?.month ?? tenureMonths;

  return {
    schedule,
    emi,
    totalPayment,
    totalInterest,
    totalPrincipal,
    actualTenureMonths,
  };
}


/**
 * Computes a comparison between the original schedule and the prepayment scenario.
 *
 * @param {object} original  - Result from generateAmortizationSchedule()
 * @param {object} prepaid   - Result from simulatePrepayment()
 * @param {Date|string} startDate
 *
 * @returns {{
 *   originalTotalInterest: number,
 *   newTotalInterest: number,
 *   interestSaved: number,
 *   originalTenureMonths: number,
 *   newTenureMonths: number,
 *   monthsSaved: number,
 *   originalDebtFreeDate: Date,
 *   newDebtFreeDate: Date
 * }}
 */
export function calculateSavings(original, prepaid, startDate = new Date()) {
  const start = new Date(startDate);

  const originalTenureMonths = original.schedule[original.schedule.length - 1]?.month ?? 0;
  const newTenureMonths = prepaid.schedule[prepaid.schedule.length - 1]?.month ?? 0;

  const originalDebtFreeDate = new Date(start);
  originalDebtFreeDate.setMonth(originalDebtFreeDate.getMonth() + originalTenureMonths - 1);

  const newDebtFreeDate = new Date(start);
  newDebtFreeDate.setMonth(newDebtFreeDate.getMonth() + newTenureMonths - 1);

  return {
    originalTotalInterest: original.totalInterest,
    newTotalInterest: prepaid.totalInterest,
    interestSaved: original.totalInterest - prepaid.totalInterest,
    originalTenureMonths,
    newTenureMonths,
    monthsSaved: originalTenureMonths - newTenureMonths,
    originalDebtFreeDate,
    newDebtFreeDate,
  };
}


/**
 * One-stop function: validates inputs, runs both schedules, computes savings.
 * This is the primary function the UI calls.
 *
 * @param {{
 *   principal: number,
 *   annualRate: number,
 *   tenureMonths: number,
 *   moratoriumMonths?: number,
 *   startDate?: Date|string
 * }} loanInput
 *
 * @param {{
 *   extraMonthly?: number,
 *   lumpSum?: number,
 *   lumpSumMonth?: number
 * }} prepayment
 *
 * @returns {{
 *   valid: boolean,
 *   errors: string[],
 *   emi: number,
 *   original: object,
 *   prepaid: object,
 *   savings: object
 * }}
 */
export function calculateLoanSummary(loanInput, prepayment = {}) {
  const {
    principal,
    annualRate,
    tenureMonths,
    moratoriumMonths = 0,
    startDate = new Date(),
  } = loanInput;

  // Validate
  const loanValidation = validateLoanInput(loanInput);
  const prepayValidation = validatePrepaymentInput(prepayment, tenureMonths);
  const allErrors = [...loanValidation.errors, ...prepayValidation.errors];

  if (allErrors.length > 0) {
    return { valid: false, errors: allErrors };
  }

  // Generate both schedules
  const original = generateAmortizationSchedule(
    principal, annualRate, tenureMonths, moratoriumMonths, startDate
  );

  const hasPrepayment =
    (prepayment.extraMonthly ?? 0) > 0 ||
    (prepayment.lumpSum ?? 0) > 0;

  const prepaid = hasPrepayment
    ? simulatePrepayment(principal, annualRate, tenureMonths, moratoriumMonths, startDate, prepayment)
    : { ...original, actualTenureMonths: original.schedule[original.schedule.length - 1]?.month };

  const savings = calculateSavings(original, prepaid, startDate);

  return {
    valid: true,
    errors: [],
    emi: original.emi,
    original,
    prepaid,
    savings,
  };
}
