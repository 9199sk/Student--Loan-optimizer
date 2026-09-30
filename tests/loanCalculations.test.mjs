/**
 * loanCalculations.test.mjs
 *
 * Standalone unit tests for the financial calculation engine.
 * Uses Node.js built-in test runner (no jest / vitest needed).
 *
 * Run with:
 *   node --experimental-vm-modules tests/loanCalculations.test.mjs
 *   OR simply:
 *   node tests/loanCalculations.test.mjs
 */

import assert from 'node:assert/strict';
import {
  calculateEMI,
  generateAmortizationSchedule,
  simulatePrepayment,
  calculateSavings,
  calculateLoanSummary,
  validateLoanInput,
  validatePrepaymentInput,
  calculatePostMoratoriumPrincipal,
} from '../client/src/utils/loanCalculations.js';

// ─────────────────────────────────────────────────────────────────────────────
// Tiny test runner (no external deps)
// ─────────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ ${name}`);
    console.log(`     ${err.message}`);
    failures.push({ name, message: err.message });
    failed++;
  }
}

function describe(suiteName, fn) {
  console.log(`\n📋 ${suiteName}`);
  fn();
}

/** Assert two numbers are equal within a tolerance. */
function assertNear(actual, expected, tolerance = 0.01, message = '') {
  const diff = Math.abs(actual - expected);
  assert.ok(
    diff <= tolerance,
    message || `Expected ${expected} ± ${tolerance}, got ${actual} (diff: ${diff.toFixed(4)})`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DEMO SCENARIO (used throughout tests)
// ─────────────────────────────────────────────────────────────────────────────
//
//  P  = ₹10,00,000
//  r  = 10% per annum
//  n  = 120 months (10 years)
//
//  Monthly r = 10 / 12 / 100 = 0.008333...
//  (1 + r)^120 = (1.008333...)^120
//
//  EMI = 1000000 × 0.008333 × (1.008333)^120 / ((1.008333)^120 - 1)
//      ≈ ₹13,215.07

const DEMO = {
  principal: 1_000_000,
  annualRate: 10,
  tenureMonths: 120,
  startDate: new Date('2025-01-01'),
};
const EXPECTED_EMI = 13215.07; // ₹ per month (reference value)

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: EMI CALCULATION
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateEMI()', () => {
  test('Demo scenario: EMI ≈ ₹13,215.07', () => {
    const emi = calculateEMI(DEMO.principal, DEMO.annualRate, DEMO.tenureMonths);
    assertNear(emi, EXPECTED_EMI, 1.0, `EMI mismatch`);
  });

  test('Zero interest rate → EMI = P / n', () => {
    const emi = calculateEMI(600_000, 0, 60);
    assertNear(emi, 10_000, 0.001);
  });

  test('Short tenure: 5L at 8% for 12 months', () => {
    // EMI = 500000 × (0.08/12) × (1+0.08/12)^12 / ((1+0.08/12)^12 - 1) ≈ ₹43,494.21
    const emi = calculateEMI(500_000, 8, 12);
    assertNear(emi, 43_494.21, 1);
  });

  test('Very small principal: ₹1000 at 12% for 12 months', () => {
    const emi = calculateEMI(1_000, 12, 12);
    assert.ok(emi > 0 && emi < 1_000, `EMI (${emi}) should be between 0 and principal`);
  });

  test('Large principal: ₹5 crore at 9% for 240 months', () => {
    const emi = calculateEMI(5e7, 9, 240);
    assert.ok(emi > 0 && isFinite(emi), 'EMI should be finite positive');
  });

  test('EMI × n is always ≥ principal (interest is non-negative)', () => {
    const emi = calculateEMI(DEMO.principal, DEMO.annualRate, DEMO.tenureMonths);
    assert.ok(emi * DEMO.tenureMonths >= DEMO.principal, 'Total payments must cover principal');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: AMORTIZATION SCHEDULE
// ─────────────────────────────────────────────────────────────────────────────

describe('generateAmortizationSchedule()', () => {
  const result = generateAmortizationSchedule(
    DEMO.principal,
    DEMO.annualRate,
    DEMO.tenureMonths,
    0,
    DEMO.startDate
  );

  test('Schedule length equals tenure months (120)', () => {
    assert.equal(result.schedule.length, DEMO.tenureMonths);
  });

  test('Month numbers are sequential 1 → 120', () => {
    result.schedule.forEach((row, i) => {
      assert.equal(row.month, i + 1);
    });
  });

  test('First month: interest = P × monthly_r', () => {
    const expectedInterest = DEMO.principal * (DEMO.annualRate / 12 / 100);
    assertNear(result.schedule[0].interestPaid, expectedInterest, 0.01);
  });

  test('First row: principalPaid = EMI − firstMonthInterest', () => {
    const r = DEMO.annualRate / 12 / 100;
    const expectedPrincipal = result.emi - DEMO.principal * r;
    assertNear(result.schedule[0].principalPaid, expectedPrincipal, 0.01);
  });

  test('Balance decreases monotonically', () => {
    for (let i = 1; i < result.schedule.length; i++) {
      assert.ok(
        result.schedule[i].balance <= result.schedule[i - 1].balance,
        `Balance increased at month ${i + 1}`
      );
    }
  });

  test('Final balance is essentially 0 (< ₹1)', () => {
    const lastRow = result.schedule[result.schedule.length - 1];
    assert.ok(Math.abs(lastRow.balance) < 1, `Final balance: ₹${lastRow.balance}`);
  });

  test('totalPrincipal = original principal (within ₹1)', () => {
    assertNear(result.totalPrincipal, DEMO.principal, 1);
  });

  test('totalPayment = totalPrincipal + totalInterest', () => {
    assertNear(result.totalPayment, result.totalPrincipal + result.totalInterest, 0.01);
  });

  test('totalInterest is positive', () => {
    assert.ok(result.totalInterest > 0);
  });

  test('EMI value matches calculateEMI() directly', () => {
    const directEMI = calculateEMI(DEMO.principal, DEMO.annualRate, DEMO.tenureMonths);
    assertNear(result.emi, directEMI, 0.001);
  });

  test('Principal component grows each month (reducing balance)', () => {
    // In standard amortization, each month's principal portion is slightly larger
    const repayRows = result.schedule.filter(r => !r.isMoratorium);
    for (let i = 1; i < repayRows.length - 1; i++) {
      assert.ok(
        repayRows[i].principalPaid >= repayRows[i - 1].principalPaid - 0.01,
        `Principal did not grow at month ${repayRows[i].month}`
      );
    }
  });

  test('Interest component decreases each month', () => {
    const repayRows = result.schedule.filter(r => !r.isMoratorium);
    for (let i = 1; i < repayRows.length; i++) {
      assert.ok(
        repayRows[i].interestPaid <= repayRows[i - 1].interestPaid + 0.01,
        `Interest did not decrease at month ${repayRows[i].month}`
      );
    }
  });

  test('Zero interest rate: all payments are equal', () => {
    const res = generateAmortizationSchedule(600_000, 0, 60, 0, new Date('2025-01-01'));
    const rows = res.schedule.filter(r => !r.isMoratorium);
    rows.forEach(row => {
      assertNear(row.payment, 600_000 / 60, 0.01);
      assertNear(row.interestPaid, 0, 0.001);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: MORATORIUM PERIOD
// ─────────────────────────────────────────────────────────────────────────────

describe('calculatePostMoratoriumPrincipal() / moratorium in schedule', () => {
  test('6-month moratorium increases principal correctly', () => {
    // P × (1+r)^6
    const r = DEMO.annualRate / 12 / 100;
    const expected = DEMO.principal * Math.pow(1 + r, 6);
    const actual = calculatePostMoratoriumPrincipal(DEMO.principal, DEMO.annualRate, 6);
    assertNear(actual, expected, 0.01);
  });

  test('Zero moratorium returns original principal', () => {
    const result = calculatePostMoratoriumPrincipal(DEMO.principal, DEMO.annualRate, 0);
    assert.equal(result, DEMO.principal);
  });

  test('Moratorium rows have payment = 0 in schedule', () => {
    const result = generateAmortizationSchedule(
      DEMO.principal, DEMO.annualRate, DEMO.tenureMonths, 12, DEMO.startDate
    );
    const morRows = result.schedule.filter(r => r.isMoratorium);
    assert.equal(morRows.length, 12);
    morRows.forEach(row => assert.equal(row.payment, 0));
  });

  test('Schedule with moratorium has correct total month count', () => {
    const result = generateAmortizationSchedule(
      DEMO.principal, DEMO.annualRate, DEMO.tenureMonths, 12, DEMO.startDate
    );
    assert.equal(result.schedule.length, DEMO.tenureMonths);
  });

  test('Post-moratorium balance is higher than original principal', () => {
    const result = generateAmortizationSchedule(
      DEMO.principal, DEMO.annualRate, DEMO.tenureMonths, 6, DEMO.startDate
    );
    const firstRepayRow = result.schedule.find(r => !r.isMoratorium);
    // The balance just before first repayment = capitalized principal
    const morRows = result.schedule.filter(r => r.isMoratorium);
    const capitalizedPrincipal = morRows[morRows.length - 1].balance;
    assert.ok(capitalizedPrincipal > DEMO.principal, 'Capitalized principal should exceed original');
    assert.ok(firstRepayRow, 'Should have at least one repayment row');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4: PREPAYMENT SIMULATION
// ─────────────────────────────────────────────────────────────────────────────

describe('simulatePrepayment()', () => {
  const extraMonthly = 2_000;

  const prepaidResult = simulatePrepayment(
    DEMO.principal,
    DEMO.annualRate,
    DEMO.tenureMonths,
    0,
    DEMO.startDate,
    { extraMonthly }
  );

  test('Loan ends earlier with extra monthly payment', () => {
    const base = generateAmortizationSchedule(
      DEMO.principal, DEMO.annualRate, DEMO.tenureMonths, 0, DEMO.startDate
    );
    assert.ok(
      prepaidResult.actualTenureMonths < base.schedule.length,
      `Expected shorter tenure, got ${prepaidResult.actualTenureMonths} vs ${base.schedule.length}`
    );
  });

  test('Total interest paid is less with extra payments', () => {
    const base = generateAmortizationSchedule(
      DEMO.principal, DEMO.annualRate, DEMO.tenureMonths, 0, DEMO.startDate
    );
    assert.ok(
      prepaidResult.totalInterest < base.totalInterest,
      `Prepaid interest (${prepaidResult.totalInterest}) should be less than base (${base.totalInterest})`
    );
  });

  test('Total principal recovered equals original principal (within ₹1)', () => {
    assertNear(prepaidResult.totalPrincipal, DEMO.principal, 1);
  });

  test('Final balance is 0', () => {
    const lastRow = prepaidResult.schedule[prepaidResult.schedule.length - 1];
    assert.ok(Math.abs(lastRow.balance) < 1, `Final balance: ${lastRow.balance}`);
  });

  test('Balance never goes negative', () => {
    prepaidResult.schedule.forEach(row => {
      assert.ok(row.balance >= -0.01, `Negative balance at month ${row.month}: ${row.balance}`);
    });
  });

  // Lump sum test
  test('Lump sum at month 12 reduces tenure', () => {
    const lumpResult = simulatePrepayment(
      DEMO.principal, DEMO.annualRate, DEMO.tenureMonths, 0, DEMO.startDate,
      { lumpSum: 200_000, lumpSumMonth: 12 }
    );
    const base = generateAmortizationSchedule(
      DEMO.principal, DEMO.annualRate, DEMO.tenureMonths, 0, DEMO.startDate
    );
    assert.ok(
      lumpResult.actualTenureMonths < base.schedule.length,
      `Lump sum should reduce tenure`
    );
  });

  test('Lump sum at month 12 is visible in that row extraPayment', () => {
    const lumpResult = simulatePrepayment(
      DEMO.principal, DEMO.annualRate, DEMO.tenureMonths, 0, DEMO.startDate,
      { lumpSum: 200_000, lumpSumMonth: 12 }
    );
    const month12 = lumpResult.schedule.find(r => r.month === 12);
    assert.ok(month12, 'Month 12 row should exist');
    assertNear(month12.extraPayment, 200_000, 1);
  });

  test('Lump sum larger than remaining balance caps at balance, not negative', () => {
    // Apply ₹9L lump sum at month 1 on a ₹10L loan — should clear most of the loan
    const result = simulatePrepayment(
      DEMO.principal, DEMO.annualRate, DEMO.tenureMonths, 0, DEMO.startDate,
      { lumpSum: 950_000, lumpSumMonth: 1 }
    );
    result.schedule.forEach(row => {
      assert.ok(row.balance >= -0.01, `Balance should not go negative. Got: ${row.balance}`);
    });
  });

  test('Extra payment larger than remaining monthly balance is capped', () => {
    // Tiny loan, huge extra payment
    const result = simulatePrepayment(5000, 10, 12, 0, new Date(), { extraMonthly: 100_000 });
    result.schedule.forEach(row => {
      assert.ok(row.balance >= -0.01, `Balance should not go negative`);
    });
    assert.equal(result.actualTenureMonths, 1, 'Should finish in 1 month');
  });

  test('No prepayment → same result as generateAmortizationSchedule', () => {
    const noPrepay = simulatePrepayment(
      DEMO.principal, DEMO.annualRate, DEMO.tenureMonths, 0, DEMO.startDate, {}
    );
    const base = generateAmortizationSchedule(
      DEMO.principal, DEMO.annualRate, DEMO.tenureMonths, 0, DEMO.startDate
    );
    assertNear(noPrepay.totalInterest, base.totalInterest, 1);
    assertNear(noPrepay.emi, base.emi, 0.01);
  });

  test('Combined extra monthly + lump sum gives maximum savings', () => {
    const combined = simulatePrepayment(
      DEMO.principal, DEMO.annualRate, DEMO.tenureMonths, 0, DEMO.startDate,
      { extraMonthly: 2000, lumpSum: 100_000, lumpSumMonth: 12 }
    );
    const onlyExtra = simulatePrepayment(
      DEMO.principal, DEMO.annualRate, DEMO.tenureMonths, 0, DEMO.startDate,
      { extraMonthly: 2000 }
    );
    assert.ok(
      combined.totalInterest <= onlyExtra.totalInterest,
      'Combined strategy should save at least as much as extra-only'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5: SAVINGS CALCULATION
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateSavings()', () => {
  const original = generateAmortizationSchedule(
    DEMO.principal, DEMO.annualRate, DEMO.tenureMonths, 0, DEMO.startDate
  );
  const prepaid = simulatePrepayment(
    DEMO.principal, DEMO.annualRate, DEMO.tenureMonths, 0, DEMO.startDate,
    { extraMonthly: 2000 }
  );
  const savings = calculateSavings(original, prepaid, DEMO.startDate);

  test('interestSaved > 0', () => {
    assert.ok(savings.interestSaved > 0, `Expected positive savings, got ${savings.interestSaved}`);
  });

  test('monthsSaved > 0', () => {
    assert.ok(savings.monthsSaved > 0, `Expected months saved, got ${savings.monthsSaved}`);
  });

  test('newDebtFreeDate is before originalDebtFreeDate', () => {
    assert.ok(
      savings.newDebtFreeDate < savings.originalDebtFreeDate,
      `New debt-free date should be earlier`
    );
  });

  test('originalTenureMonths = DEMO.tenureMonths', () => {
    assert.equal(savings.originalTenureMonths, DEMO.tenureMonths);
  });

  test('interestSaved = originalTotalInterest - newTotalInterest', () => {
    assertNear(
      savings.interestSaved,
      savings.originalTotalInterest - savings.newTotalInterest,
      0.01
    );
  });

  test('No-prepayment scenario: savings are all zero', () => {
    const noPrepaid = simulatePrepayment(
      DEMO.principal, DEMO.annualRate, DEMO.tenureMonths, 0, DEMO.startDate, {}
    );
    const zeroSavings = calculateSavings(original, noPrepaid, DEMO.startDate);
    assertNear(zeroSavings.interestSaved, 0, 1);
    assert.equal(zeroSavings.monthsSaved, 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 6: calculateLoanSummary() — full pipeline
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateLoanSummary()', () => {
  test('Returns valid result for demo scenario', () => {
    const result = calculateLoanSummary(DEMO, { extraMonthly: 2000 });
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
    assert.ok(result.emi > 0);
    assert.ok(result.savings.interestSaved > 0);
    assert.ok(result.savings.monthsSaved > 0);
  });

  test('Prints demo scenario summary (informational)', () => {
    const result = calculateLoanSummary(DEMO, { extraMonthly: 2000 });
    const s = result.savings;
    console.log('\n  📊 Demo Scenario Results:');
    console.log(`     Principal:        ₹${(DEMO.principal / 100).toFixed(0)}00`);
    console.log(`     EMI:              ₹${result.emi.toFixed(2)}/mo`);
    console.log(`     Original tenure:  ${s.originalTenureMonths} months`);
    console.log(`     New tenure:       ${s.newTenureMonths} months`);
    console.log(`     Months saved:     ${s.monthsSaved}`);
    console.log(`     Original interest:₹${s.originalTotalInterest.toFixed(2)}`);
    console.log(`     New interest:     ₹${s.newTotalInterest.toFixed(2)}`);
    console.log(`     Interest saved:   ₹${s.interestSaved.toFixed(2)}`);
    console.log(`     Original debt-free: ${s.originalDebtFreeDate.toDateString()}`);
    console.log(`     New debt-free:      ${s.newDebtFreeDate.toDateString()}`);
    assert.ok(true); // informational only
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 7: INPUT VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

describe('validateLoanInput()', () => {
  test('Valid input returns no errors', () => {
    const { valid, errors } = validateLoanInput(DEMO);
    assert.equal(valid, true);
    assert.equal(errors.length, 0);
  });

  test('Negative principal is rejected', () => {
    const { valid } = validateLoanInput({ ...DEMO, principal: -1000 });
    assert.equal(valid, false);
  });

  test('Zero principal is rejected', () => {
    const { valid } = validateLoanInput({ ...DEMO, principal: 0 });
    assert.equal(valid, false);
  });

  test('Negative interest rate is rejected', () => {
    const { valid } = validateLoanInput({ ...DEMO, annualRate: -5 });
    assert.equal(valid, false);
  });

  test('Zero interest rate is accepted', () => {
    const { valid } = validateLoanInput({ ...DEMO, annualRate: 0 });
    assert.equal(valid, true);
  });

  test('Non-integer tenure is rejected', () => {
    const { valid } = validateLoanInput({ ...DEMO, tenureMonths: 10.5 });
    assert.equal(valid, false);
  });

  test('Tenure ≤ 0 is rejected', () => {
    const { valid } = validateLoanInput({ ...DEMO, tenureMonths: 0 });
    assert.equal(valid, false);
  });

  test('Moratorium ≥ tenure is rejected', () => {
    const { valid } = validateLoanInput({ ...DEMO, moratoriumMonths: 120 });
    assert.equal(valid, false);
  });

  test('Invalid date is rejected', () => {
    const { valid } = validateLoanInput({ ...DEMO, startDate: 'not-a-date' });
    assert.equal(valid, false);
  });

  test('Rate > 100% is rejected', () => {
    const { valid } = validateLoanInput({ ...DEMO, annualRate: 150 });
    assert.equal(valid, false);
  });

  test('Principal > 100 crore is rejected', () => {
    const { valid } = validateLoanInput({ ...DEMO, principal: 2e9 });
    assert.equal(valid, false);
  });
});

describe('validatePrepaymentInput()', () => {
  test('All zeros is valid', () => {
    const { valid } = validatePrepaymentInput({}, DEMO.tenureMonths);
    assert.equal(valid, true);
  });

  test('Negative extraMonthly is rejected', () => {
    const { valid } = validatePrepaymentInput({ extraMonthly: -500 }, DEMO.tenureMonths);
    assert.equal(valid, false);
  });

  test('Lump sum without month is rejected', () => {
    const { valid } = validatePrepaymentInput({ lumpSum: 100_000, lumpSumMonth: 0 }, DEMO.tenureMonths);
    assert.equal(valid, false);
  });

  test('Lump sum month beyond tenure is rejected', () => {
    const { valid } = validatePrepaymentInput({ lumpSum: 100_000, lumpSumMonth: 200 }, DEMO.tenureMonths);
    assert.equal(valid, false);
  });

  test('Valid lump sum is accepted', () => {
    const { valid } = validatePrepaymentInput({ lumpSum: 100_000, lumpSumMonth: 12 }, DEMO.tenureMonths);
    assert.equal(valid, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 8: EDGE CASES
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge Cases', () => {
  test('1-month tenure: single payment covers principal + interest', () => {
    const result = generateAmortizationSchedule(100_000, 12, 1, 0, new Date());
    assert.equal(result.schedule.length, 1);
    // payment = principal + 1 month interest
    const expectedPayment = 100_000 + 100_000 * (12 / 12 / 100);
    assertNear(result.schedule[0].payment, expectedPayment, 0.01);
  });

  test('Very small principal (₹100) does not produce NaN', () => {
    const result = generateAmortizationSchedule(100, 10, 12, 0, new Date());
    result.schedule.forEach(row => {
      assert.ok(isFinite(row.payment), `NaN/Inf payment at month ${row.month}`);
      assert.ok(isFinite(row.balance), `NaN/Inf balance at month ${row.month}`);
    });
  });

  test('Full prepayment on month 1 ends loan immediately', () => {
    const result = simulatePrepayment(
      DEMO.principal, DEMO.annualRate, DEMO.tenureMonths, 0, DEMO.startDate,
      { lumpSum: DEMO.principal * 2, lumpSumMonth: 1 }
    );
    assert.equal(result.actualTenureMonths, 1);
    assert.ok(Math.abs(result.schedule[result.schedule.length - 1].balance) < 1);
  });

  test('Zero extra monthly → no change in tenure vs base', () => {
    const result = simulatePrepayment(
      DEMO.principal, DEMO.annualRate, DEMO.tenureMonths, 0, DEMO.startDate,
      { extraMonthly: 0 }
    );
    const base = generateAmortizationSchedule(
      DEMO.principal, DEMO.annualRate, DEMO.tenureMonths, 0, DEMO.startDate
    );
    assert.equal(result.actualTenureMonths, base.schedule.length);
  });

  test('calculateLoanSummary rejects invalid input gracefully', () => {
    const result = calculateLoanSummary({ principal: -1, annualRate: 10, tenureMonths: 120 });
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RESULTS SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60));
console.log(`\n🏁 Results: ${passed} passed, ${failed} failed\n`);

if (failures.length > 0) {
  console.log('❌ Failed tests:');
  failures.forEach(f => console.log(`   • ${f.name}\n     → ${f.message}`));
  console.log('');
  process.exit(1);
} else {
  console.log('🎉 All tests passed!\n');
}
