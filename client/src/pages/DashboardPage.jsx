import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calculator, Bookmark, CheckCircle2, Download } from 'lucide-react';
import { useLoanCalculator } from '../hooks/useLoanCalculator.js';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import DashboardHero from '../components/DashboardHero.jsx';
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
import { generateDebtFreeRoadmapPDF } from '../utils/pdfGenerator.js';

/**
 * DashboardPage
 *
 * Professional Fintech Loan & Prepayment Optimizer Dashboard:
 *   - Hero overview banner
 *   - Form inputs with real-time validation & slider controls
 *   - Interactive KPI cards & principal-vs-interest breakdown
 *   - Prepayment impact savings highlight & comparison panel
 *   - Dynamic Recharts financial visualizations
 *   - Full paginated amortization table
 *   - Printable PDF roadmap generator
 *   - Saved scenario manager
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

  const handleDownloadPDF = () => {
    if (!parsed || !results) return;
    generateDebtFreeRoadmapPDF({
      parsed,
      prepayment,
      results,
      hasPrepayment,
    });
  };

  const handleSaveClick = () => {
    if (!user) {
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
    <div className="flex flex-col gap-5 max-w-7xl mx-auto py-2">
      {/* ── Hero Banner ────────────────────────────────────────────────────── */}
      <DashboardHero />

      {/* ── Action Toolbar & Title ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Financial Optimizer & Simulator</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Adjust inputs on the left to see real-time recalculations and savings projections
          </p>
        </div>

        {/* Action Buttons */}
        {isValid && results && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
            <button
              onClick={handleDownloadPDF}
              className="btn-secondary flex items-center justify-center gap-2 text-xs py-2 px-3.5 shadow-sm border-slate-700 hover:border-slate-600"
              title="Download Printable PDF Roadmap"
            >
              <Download size={15} className="text-indigo-400" />
              <span>Download Roadmap (PDF)</span>
            </button>

            <button
              onClick={handleSaveClick}
              className="btn-primary flex items-center justify-center gap-2 text-xs py-2 px-3.5 shadow-md shadow-indigo-600/20"
            >
              <Bookmark size={15} />
              <span>{user ? 'Save Scenario' : 'Login to Save'}</span>
            </button>
          </div>
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

      {/* ── Main Dashboard Grid ────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-[360px_1fr] gap-6 items-start">
        {/* Left sidebar — sticky on desktop */}
        <div className="flex flex-col gap-5 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
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
              {/* KPI Summary cards */}
              <LoanSummaryCards results={results} hasPrepayment={hasPrepayment} />

              {/* Savings Banner — shown when prepayment saves interest */}
              {hasPrepayment && results.savings.interestSaved > 0 && (
                <SavingsBanner savings={results.savings} />
              )}

              {/* Comparison Panel */}
              {hasPrepayment && <ComparisonPanel savings={results.savings} />}

              {/* Recharts Visualizations */}
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

              {/* Paginated Amortization Table */}
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
              description="Fill in the form on the left to calculate your EMI and simulate prepayments."
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
