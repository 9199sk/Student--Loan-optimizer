import { RotateCcw, Info } from 'lucide-react';
import { FieldGroup, AdornedInput } from './ui.jsx';

// Common tenure presets (years)
const TENURE_PRESETS = [5, 7, 10, 15, 20];

/**
 * LoanInputForm
 *
 * Receives raw string state + setter from useLoanCalculator.
 * Renders all loan input fields with inline validation.
 * Communicates only via setField(fieldName, value).
 */
export default function LoanInputForm({ raw, setField, fieldErrors, resetToDemo }) {
  const tenureYears = parseFloat(raw.tenureYearsRaw) || 0;
  const tenureMonths = Math.round(tenureYears * 12);

  return (
    <div className="card p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Loan Details</h2>
          <p className="text-xs text-slate-500 mt-0.5">Enter your education loan parameters</p>
        </div>
        <button
          onClick={resetToDemo}
          title="Reset to demo scenario"
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-400 transition-colors py-1 px-2 rounded-lg hover:bg-slate-800"
        >
          <RotateCcw size={13} />
          Demo
        </button>
      </div>

      {/* ── Principal ────────────────────────────────────── */}
      <FieldGroup
        label="Loan Amount"
        hint={formatLakhHint(raw.principalRaw)}
        error={fieldErrors.principal}
      >
        <AdornedInput
          type="number"
          prefix="₹"
          inputMode="numeric"
          placeholder="10,00,000"
          value={raw.principalRaw}
          min={1}
          step={10000}
          onChange={e => setField('principalRaw', e.target.value)}
        />
        {/* Quick picks */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {[500000, 1000000, 2000000, 5000000].map(v => (
            <button
              key={v}
              onClick={() => setField('principalRaw', String(v))}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                raw.principalRaw === String(v)
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              {v >= 1e7 ? `₹${v / 1e7}Cr` : `₹${v / 1e5}L`}
            </button>
          ))}
        </div>
      </FieldGroup>

      {/* ── Annual Interest Rate ──────────────────────────── */}
      <FieldGroup
        label="Annual Interest Rate"
        hint={raw.annualRateRaw ? `${(parseFloat(raw.annualRateRaw) / 12).toFixed(3)}% / mo` : ''}
        error={fieldErrors.annualRate}
      >
        <AdornedInput
          type="number"
          suffix="%"
          inputMode="decimal"
          placeholder="10"
          value={raw.annualRateRaw}
          min={0}
          max={100}
          step={0.1}
          onChange={e => setField('annualRateRaw', e.target.value)}
        />
      </FieldGroup>

      {/* ── Tenure ───────────────────────────────────────── */}
      <FieldGroup
        label="Loan Tenure"
        hint={tenureMonths > 0 ? `${tenureMonths} months` : ''}
        error={fieldErrors.tenureYears}
      >
        <AdornedInput
          type="number"
          suffix="yrs"
          inputMode="decimal"
          placeholder="10"
          value={raw.tenureYearsRaw}
          min={0.5}
          max={50}
          step={0.5}
          onChange={e => setField('tenureYearsRaw', e.target.value)}
        />
        {/* Tenure presets */}
        <div className="flex gap-1.5 mt-1">
          {TENURE_PRESETS.map(y => (
            <button
              key={y}
              onClick={() => setField('tenureYearsRaw', String(y))}
              className={`flex-1 text-xs py-1 rounded-lg border transition-colors ${
                raw.tenureYearsRaw === String(y)
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              {y}y
            </button>
          ))}
        </div>
      </FieldGroup>

      {/* ── Moratorium ───────────────────────────────────── */}
      <FieldGroup
        label={
          <span className="flex items-center gap-1.5">
            Moratorium Period
            <span
              title="During moratorium, no EMI is paid. Interest accrues and is added to the principal."
              className="cursor-help"
            >
              <Info size={13} className="text-slate-500" />
            </span>
          </span>
        }
        hint="months with no payment"
        error={fieldErrors.moratoriumMonths}
      >
        <AdornedInput
          type="number"
          suffix="mo"
          inputMode="numeric"
          placeholder="0"
          value={raw.moratoriumMonthsRaw}
          min={0}
          step={1}
          onChange={e => setField('moratoriumMonthsRaw', e.target.value)}
        />
        <div className="flex gap-1.5 mt-1">
          {[0, 6, 12, 18, 24].map(m => (
            <button
              key={m}
              onClick={() => setField('moratoriumMonthsRaw', String(m))}
              className={`flex-1 text-xs py-1 rounded-lg border transition-colors ${
                raw.moratoriumMonthsRaw === String(m)
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              {m === 0 ? 'None' : `${m}m`}
            </button>
          ))}
        </div>
      </FieldGroup>

      {/* ── Start Date ───────────────────────────────────── */}
      <FieldGroup label="Loan Start Date">
        <input
          type="date"
          className="input"
          value={raw.startDate}
          max="2040-12-31"
          min="2000-01-01"
          onChange={e => setField('startDate', e.target.value)}
        />
      </FieldGroup>
    </div>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatLakhHint(rawStr) {
  const v = parseFloat(rawStr);
  if (!rawStr || isNaN(v) || v <= 0) return '';
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return '';
}
