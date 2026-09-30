import { Calculator } from 'lucide-react';
import { useLoanCalculator } from '../hooks/useLoanCalculator.js';
import LoanInputForm from '../components/LoanInputForm.jsx';
import PrepaymentSimulator from '../components/PrepaymentSimulator.jsx';
import LoanSummaryCards from '../components/LoanSummaryCards.jsx';
import SavingsBanner from '../components/SavingsBanner.jsx';
import ComparisonPanel from '../components/ComparisonPanel.jsx';
import AmortizationTable from '../components/AmortizationTable.jsx';
import { EmptyState } from '../components/ui.jsx';

/**
 * DashboardPage
 *
 * Layout:
 *   Desktop (≥ lg):  Sticky left sidebar (LoanInputForm + PrepaymentSimulator) | scrollable right column
 *   Mobile:          Stacked vertically
 *
 * Data flows:
 *   useLoanCalculator() → calculateLoanSummary(loanInput, prepayment) → all child components
 */
export default function DashboardPage() {
  const {
    raw,
    setField,
    resetToDemo,
    fieldErrors,
    prepayment,
    setPrepaymentField,
    clearPrepayment,
    prepaymentErrors,
    hasPrepayment,
    parsed,
    isValid,
    results,
  } = useLoanCalculator();

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page title ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Loan EMI & Prepayment Optimizer</h1>
        <p className="text-sm text-slate-400 mt-1">
          Calculate your EMI, simulate prepayments, and see exactly how much you can save
        </p>
      </div>

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-[360px_1fr] gap-6 items-start">

        {/* Left sidebar — sticky on desktop */}
        <div className="flex flex-col gap-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1">
          <LoanInputForm
            raw={raw}
            setField={setField}
            fieldErrors={fieldErrors}
            resetToDemo={resetToDemo}
          />
          <PrepaymentSimulator
            prepayment={prepayment}
            setPrepaymentField={setPrepaymentField}
            clearPrepayment={clearPrepayment}
            prepaymentErrors={prepaymentErrors}
            hasPrepayment={hasPrepayment}
            tenureMonths={parsed.tenureMonths}
            startDate={raw.startDate}
            emi={results?.emi ?? 0}
          />
        </div>

        {/* Right: Results column */}
        <div className="flex flex-col gap-5 min-w-0">
          {isValid && results ? (
            <>
              {/* KPI cards — always visible */}
              <LoanSummaryCards results={results} hasPrepayment={hasPrepayment} />

              {/* Savings banner — only when there are actual savings */}
              {hasPrepayment && results.savings.interestSaved > 0 && (
                <SavingsBanner savings={results.savings} />
              )}

              {/* Comparison panel — only when prepayment is configured */}
              {hasPrepayment && (
                <ComparisonPanel savings={results.savings} />
              )}

              {/* Amortization table — with toggle between original/prepaid */}
              <AmortizationTable
                schedule={results.original.schedule}
                scheduleAlt={hasPrepayment ? results.prepaid.schedule : null}
                hasPrepayment={hasPrepayment}
                totalInterest={results.original.totalInterest}
                totalPayment={results.original.totalPayment}
                totalPrincipal={results.original.totalPrincipal}
                altTotals={hasPrepayment ? {
                  totalInterest: results.prepaid.totalInterest,
                  totalPayment:  results.prepaid.totalPayment,
                  totalPrincipal: results.prepaid.totalPrincipal,
                } : null}
              />
            </>
          ) : (
            <EmptyState
              icon={Calculator}
              title="Enter your loan details"
              description="Fill in the form to calculate your EMI and see a full prepayment simulation."
            />
          )}
        </div>
      </div>
    </div>
  );
}
