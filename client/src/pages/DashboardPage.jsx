import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calculator, Bookmark, CheckCircle2 } from 'lucide-react';
import { useLoanCalculator } from '../hooks/useLoanCalculator.js';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import LoanInputForm from '../components/LoanInputForm.jsx';
import PrepaymentSimulator from '../components/PrepaymentSimulator.jsx';
import LoanSummaryCards from '../components/LoanSummaryCards.jsx';
import SavingsBanner from '../components/SavingsBanner.jsx';
import ComparisonPanel from '../components/ComparisonPanel.jsx';
import AmortizationTable from '../components/AmortizationTable.jsx';
import SaveScenarioModal from '../components/SaveScenarioModal.jsx';
import { EmptyState } from '../components/ui.jsx';
import RemainingBalanceChart from '../components/charts/RemainingBalanceChart.jsx';
import PrincipalInterestChart from '../components/charts/PrincipalInterestChart.jsx';
import CumulativeInterestChart from '../components/charts/CumulativeInterestChart.jsx';

/**
 * DashboardPage
 *
 * Main calculation dashboard with support for:
 *   - EMI calculation & prepayment simulation
 *   - Dynamic interactive charts
 *   - Saving loan scenarios (Phase 7)
 *   - Loading saved scenarios from SavedScenariosPage
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
    loadScenario,
    prepaymentErrors,
    hasPrepayment,
    parsed,
    isValid,
    results,
  } = useLoanCalculator();

  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Auto-load scenario if redirected from SavedScenariosPage
  useEffect(() => {
    if (location.state?.loadScenario) {
      loadScenario(location.state.loadScenario);
      // Clear location state so refresh doesn't overwrite user edits
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, loadScenario, navigate]);

  const handleSaveClick = () => {
    if (!user) {
      // Redirect to login if user is not authenticated
      navigate('/login');
      return;
    }
    setSaveError('');
    setIsModalOpen(true);
  };

  const handleConfirmSave = async (scenarioName) => {
    if (!results || !parsed) return;
    setSaving(true);
    setSaveError('');

    const payload = {
      name: scenarioName,
      loanInput: {
        principal: parsed.principal,
        annualRate: parsed.annualRate,
        tenureMonths: parsed.tenureMonths,
        moratoriumMonths: parsed.moratoriumMonths,
        startDate: parsed.startDate,
      },
      prepayment: {
        extraMonthly: prepayment.extraMonthly || 0,
        lumpSum: prepayment.lumpSum || 0,
        lumpSumMonth: prepayment.lumpSumMonth || 0,
      },
      summary: {
        emi: results.emi,
        totalInterest: results.original.totalInterest,
        interestSaved: results.savings?.interestSaved || 0,
        monthsSaved: results.savings?.monthsSaved || 0,
        debtFreeDate: results.savings?.newDebtFreeDate || results.savings?.originalDebtFreeDate,
      },
    };

    try {
      await api.post('/scenarios', payload);
      setIsModalOpen(false);
      setToastMessage(`Scenario "${scenarioName}" saved successfully!`);
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      setSaveError(err.message || 'Failed to save scenario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page title & Save action ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Loan EMI & Prepayment Optimizer</h1>
          <p className="text-sm text-slate-400 mt-1">
            Calculate your EMI, simulate prepayments, and see exactly how much you can save
          </p>
        </div>

        {/* Save Scenario Button */}
        {isValid && results && (
          <button
            onClick={handleSaveClick}
            className="btn-primary flex items-center justify-center gap-2 text-sm px-4 py-2.5 self-start sm:self-auto shrink-0 shadow-lg shadow-indigo-600/20"
          >
            <Bookmark size={16} />
            <span>{user ? 'Save Scenario' : 'Login to Save Scenario'}</span>
          </button>
        )}
      </div>

      {/* Success Toast */}
      {toastMessage && (
        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-sm font-medium animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => navigate('/saved')}
            className="text-xs underline hover:text-emerald-300 font-semibold"
          >
            View Saved
          </button>
        </div>
      )}

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
              {hasPrepayment && <ComparisonPanel savings={results.savings} />}

              {/* Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <div className="xl:col-span-2">
                  <RemainingBalanceChart
                    originalSchedule={results.original.schedule}
                    prepaidSchedule={results.prepaid.schedule}
                    hasPrepayment={hasPrepayment}
                  />
                </div>
                <PrincipalInterestChart schedule={results.original.schedule} />
                <CumulativeInterestChart
                  originalSchedule={results.original.schedule}
                  prepaidSchedule={results.prepaid.schedule}
                  hasPrepayment={hasPrepayment}
                />
              </div>

              {/* Amortization table — with toggle between original/prepaid */}
              <AmortizationTable
                schedule={results.original.schedule}
                scheduleAlt={hasPrepayment ? results.prepaid.schedule : null}
                hasPrepayment={hasPrepayment}
                totalInterest={results.original.totalInterest}
                totalPayment={results.original.totalPayment}
                totalPrincipal={results.original.totalPrincipal}
                altTotals={
                  hasPrepayment
                    ? {
                        totalInterest: results.prepaid.totalInterest,
                        totalPayment: results.prepaid.totalPayment,
                        totalPrincipal: results.prepaid.totalPrincipal,
                      }
                    : null
                }
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

      {/* Save Scenario Modal */}
      <SaveScenarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleConfirmSave}
        parsed={parsed}
        prepayment={prepayment}
        savings={results?.savings}
        saving={saving}
        error={saveError}
      />
    </div>
  );
}
