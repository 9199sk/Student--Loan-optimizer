import { X } from 'lucide-react';
import { FieldGroup, AdornedInput } from './ui.jsx';
import { formatINR } from '../utils/formatters.js';

// Slider range (₹0 – ₹20,000 in steps of ₹500)
const SLIDER_MAX  = 20000;
const SLIDER_STEP = 500;

// Quick-pick extra monthly amounts
const EXTRA_PRESETS = [500, 1000, 2000, 5000, 10000];

/**
 * PrepaymentSimulator
 *
 * Controls for:
 *  - Extra monthly payment (slider + presets)
 *  - One-time lump-sum (amount + month)
 *
 * Props supplied by useLoanCalculator() via DashboardPage.
 */
export default function PrepaymentSimulator({
  prepayment,
  setPrepaymentField,
  clearPrepayment,
  prepaymentErrors,
  hasPrepayment,
  tenureMonths,   // used to bound lumpSumMonth
  startDate,      // used to display lump-sum calendar date
  emi,            // used to show max-slider context label
}) {
  const { extraMonthly, lumpSum, lumpSumMonth } = prepayment;

  // Compute the calendar date for lumpSumMonth
  const lumpSumDate = getLumpSumDate(startDate, lumpSumMonth);

  // Slider fill percentage for the gradient background trick
  const sliderPct = SLIDER_MAX > 0 ? (extraMonthly / SLIDER_MAX) * 100 : 0;

  return (
    <div className="card p-6 flex flex-col gap-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Prepayment Simulator</h2>
          <p className="text-xs text-slate-500 mt-0.5">See how extra payments reduce your loan</p>
        </div>
        {hasPrepayment && (
          <button
            onClick={clearPrepayment}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800"
          >
            <X size={13} />
            Clear
          </button>
        )}
      </div>

      {/* ── Extra Monthly Payment ───────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="label mb-0 text-sm">Extra Monthly Payment</label>
          {/* Live value badge */}
          <span className="text-base font-bold text-indigo-400 tabular-nums">
            {extraMonthly > 0 ? formatINR(extraMonthly) : (
              <span className="text-slate-600 font-normal text-sm">₹0 / mo</span>
            )}
          </span>
        </div>

        {/* Slider */}
        <div className="relative">
          <input
            type="range"
            min={0}
            max={SLIDER_MAX}
            step={SLIDER_STEP}
            value={extraMonthly}
            onChange={e => setPrepaymentField('extraMonthly', Number(e.target.value))}
            style={{
              background: `linear-gradient(to right, #6366f1 ${sliderPct}%, #1e293b ${sliderPct}%)`,
            }}
          />
          {/* Scale labels */}
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-slate-600">₹0</span>
            <span className="text-[10px] text-slate-600">₹10K</span>
            <span className="text-[10px] text-slate-600">₹20K</span>
          </div>
        </div>

        {/* Quick preset buttons */}
        <div className="flex flex-wrap gap-1.5">
          {EXTRA_PRESETS.map(amount => (
            <button
              key={amount}
              onClick={() => setPrepaymentField('extraMonthly', extraMonthly === amount ? 0 : amount)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                extraMonthly === amount
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 shadow-indigo-500/20 shadow-sm'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              +{formatINR(amount, { decimals: 0 })}
            </button>
          ))}
        </div>

        {/* Contextual hint */}
        {extraMonthly > 0 && emi > 0 && (
          <p className="text-xs text-slate-500">
            Total monthly outflow:{' '}
            <span className="text-slate-300 font-medium">
              {formatINR(Math.round(emi + extraMonthly))}/mo
            </span>
            {' '}({((extraMonthly / emi) * 100).toFixed(0)}% extra over EMI)
          </p>
        )}
      </div>

      {/* ── Divider ────────────────────────────────────────────────── */}
      <div className="relative flex items-center">
        <hr className="flex-1 border-slate-800" />
        <span className="mx-3 text-[10px] text-slate-600 uppercase tracking-widest">or</span>
        <hr className="flex-1 border-slate-800" />
      </div>

      {/* ── Lump-Sum Payment ───────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-slate-300 mb-0.5">One-Time Lump Sum</p>
          <p className="text-xs text-slate-500">Make a single large prepayment in a specific month</p>
        </div>

        <FieldGroup label="Lump-Sum Amount" error={prepaymentErrors.lumpSum}>
          <AdornedInput
            type="number"
            prefix="₹"
            inputMode="numeric"
            placeholder="e.g. 2,00,000"
            value={lumpSum || ''}
            min={0}
            step={10000}
            onChange={e => setPrepaymentField('lumpSum', parseFloat(e.target.value) || 0)}
          />
          {/* Lump-sum quick picks */}
          <div className="flex flex-wrap gap-1.5 mt-1">
            {[50000, 100000, 200000, 500000].map(v => (
              <button
                key={v}
                onClick={() => setPrepaymentField('lumpSum', lumpSum === v ? 0 : v)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  lumpSum === v
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                {v >= 1e5 ? `₹${v / 1e5}L` : `₹${v / 1e3}K`}
              </button>
            ))}
          </div>
        </FieldGroup>

        <FieldGroup
          label="Payment Month"
          hint={lumpSumDate}
          error={prepaymentErrors.lumpSumMonth}
        >
          <AdornedInput
            type="number"
            suffix="mo"
            inputMode="numeric"
            placeholder={`1 – ${tenureMonths || '120'}`}
            value={lumpSumMonth || ''}
            min={1}
            max={tenureMonths || 600}
            step={1}
            onChange={e => setPrepaymentField('lumpSumMonth', parseInt(e.target.value, 10) || 0)}
          />
        </FieldGroup>
      </div>
    </div>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function getLumpSumDate(startDate, lumpSumMonth) {
  if (!startDate || !lumpSumMonth || lumpSumMonth < 1) return '';
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return '';
  d.setMonth(d.getMonth() + lumpSumMonth - 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}
