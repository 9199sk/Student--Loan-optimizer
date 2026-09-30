/**
 * useLoanCalculator.js
 *
 * Central state + calculation hook for the loan dashboard.
 * Manages form state, prepayment state, runs the calculation engine on every
 * change, and returns results ready for UI consumption.
 */

import { useState, useMemo, useCallback } from 'react';
import { calculateLoanSummary } from '../utils/loanCalculations.js';

// Default values shown on first load (demo scenario)
const DEFAULT_INPUT = {
  principalRaw:       '1000000', // stored as string so partial input works
  annualRateRaw:      '10',
  tenureYearsRaw:     '10',      // UI uses years; internally converted to months
  moratoriumMonthsRaw:'0',
  startDate: new Date().toISOString().slice(0, 10), // 'YYYY-MM-DD'
};

const DEFAULT_PREPAYMENT = {
  extraMonthly:  0,   // ₹ extra per month on top of EMI
  lumpSum:       0,   // ₹ one-time payment
  lumpSumMonth:  0,   // month number (1-indexed) when lump sum is applied
};

export function useLoanCalculator() {
  const [raw, setRaw] = useState(DEFAULT_INPUT);
  const [prepayment, setPrepayment] = useState(DEFAULT_PREPAYMENT);

  // Parse raw strings → typed numbers
  const parsed = useMemo(() => ({
    principal:        parseFloat(raw.principalRaw)         || 0,
    annualRate:       parseFloat(raw.annualRateRaw)        || 0,
    tenureMonths:     Math.round((parseFloat(raw.tenureYearsRaw) || 0) * 12),
    moratoriumMonths: parseInt(raw.moratoriumMonthsRaw, 10) || 0,
    startDate:        raw.startDate,
  }), [raw]);

  // Validate prepayment against current tenure
  const prepaymentErrors = useMemo(() => {
    const e = {};
    if (prepayment.lumpSum > 0 && prepayment.lumpSumMonth < 1) {
      e.lumpSumMonth = 'Enter the payment month (≥ 1)';
    }
    if (prepayment.lumpSumMonth > parsed.tenureMonths && parsed.tenureMonths > 0) {
      e.lumpSumMonth = `Must be within loan tenure (≤ ${parsed.tenureMonths} mo)`;
    }
    if (prepayment.extraMonthly < 0) {
      e.extraMonthly = 'Cannot be negative';
    }
    if (prepayment.lumpSum < 0) {
      e.lumpSum = 'Cannot be negative';
    }
    return e;
  }, [prepayment, parsed.tenureMonths]);

  // Sanitised prepayment passed to the engine (zeros out invalid combos)
  const safePrepayment = useMemo(() => ({
    extraMonthly: Math.max(0, prepayment.extraMonthly),
    lumpSum:      prepayment.lumpSum > 0 && prepayment.lumpSumMonth >= 1 ? prepayment.lumpSum : 0,
    lumpSumMonth: prepayment.lumpSumMonth >= 1 ? prepayment.lumpSumMonth : 0,
  }), [prepayment]);

  // Run validation + full calculation on every change
  const results = useMemo(() => {
    if (parsed.principal <= 0 || parsed.tenureMonths <= 0 || parsed.annualRate < 0) {
      return null;
    }
    return calculateLoanSummary(parsed, safePrepayment);
  }, [parsed, safePrepayment]);

  // Field-level validation errors for the loan form
  const fieldErrors = useMemo(() => {
    const e = {};
    const { principal: p, annualRate: r, tenureMonths: t, moratoriumMonths: m } = parsed;

    if (raw.principalRaw !== '' && (isNaN(p) || p <= 0))
      e.principal = 'Enter a principal greater than ₹0';
    if (p > 1e9)
      e.principal = 'Cannot exceed ₹100 crore';
    if (raw.annualRateRaw !== '' && (isNaN(r) || r < 0))
      e.annualRate = 'Rate must be 0% or more';
    if (r > 100)
      e.annualRate = 'Rate cannot exceed 100%';
    if (raw.tenureYearsRaw !== '' && (isNaN(t / 12) || t <= 0))
      e.tenureYears = 'Tenure must be greater than 0';
    if (t > 600)
      e.tenureYears = 'Maximum tenure is 50 years';
    if (isFinite(m) && m < 0)
      e.moratoriumMonths = 'Cannot be negative';
    if (isFinite(m) && isFinite(t) && m >= t)
      e.moratoriumMonths = 'Must be less than tenure';

    return e;
  }, [parsed, raw]);

  const isValid = results?.valid === true && Object.keys(fieldErrors).length === 0;

  const hasPrepayment = safePrepayment.extraMonthly > 0 || safePrepayment.lumpSum > 0;

  /** Update a single loan input raw field */
  const setField = useCallback(
    (field, value) => setRaw(prev => ({ ...prev, [field]: value })),
    []
  );

  /** Update a prepayment field */
  const setPrepaymentField = useCallback(
    (field, value) => setPrepayment(prev => ({ ...prev, [field]: value })),
    []
  );

  /** Reset loan inputs to demo */
  const resetToDemo = useCallback(() => {
    setRaw(DEFAULT_INPUT);
    setPrepayment(DEFAULT_PREPAYMENT);
  }, []);

  /** Clear only prepayment settings */
  const clearPrepayment = useCallback(() => setPrepayment(DEFAULT_PREPAYMENT), []);

  return {
    // Form state
    raw,
    setField,
    resetToDemo,
    fieldErrors,
    // Prepayment state
    prepayment,
    setPrepaymentField,
    clearPrepayment,
    prepaymentErrors,
    hasPrepayment,
    // Derived
    parsed,
    isValid,
    results: isValid ? results : null,
  };
}
