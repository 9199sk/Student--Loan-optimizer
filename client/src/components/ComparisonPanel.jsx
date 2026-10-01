import { ArrowRight, ArrowDown } from 'lucide-react';
import { formatINR, formatTenure, formatMonthYear, round } from '../utils/formatters.js';

/**
 * ComparisonPanel
 *
 * Side-by-side (desktop) / stacked (mobile) before-vs-after comparison.
 * Three rows: Total Interest, Loan Tenure, Debt-Free Date.
 */
export default function ComparisonPanel({ savings }) {
  const {
    originalTotalInterest,
    newTotalInterest,
    originalTenureMonths,
    newTenureMonths,
    originalDebtFreeDate,
    newDebtFreeDate,
    interestSaved,
    monthsSaved,
  } = savings;

  const rows = [
    {
      label: 'Total Interest',
      without: formatINR(round(originalTotalInterest, 0)),
      with:    formatINR(round(newTotalInterest, 0)),
      diff:    interestSaved > 0
        ? `↓ ${formatINR(round(interestSaved, 0))} saved`
        : null,
      better:  newTotalInterest < originalTotalInterest,
    },
    {
      label: 'Loan Tenure',
      without: formatTenure(originalTenureMonths),
      with:    formatTenure(newTenureMonths),
      diff:    monthsSaved > 0 ? `↓ ${formatTenure(monthsSaved)} shorter` : null,
      better:  newTenureMonths < originalTenureMonths,
    },
    {
      label: 'Debt-Free Date',
      without: formatMonthYear(originalDebtFreeDate),
      with:    formatMonthYear(newDebtFreeDate),
      diff:    monthsSaved > 0
        ? `${monthsSaved} months earlier`
        : null,
      better:  newTenureMonths < originalTenureMonths,
    },
  ];

  return (
    <div className="card overflow-hidden">
      {/* Header ****/}  
      <div className="px-5 py-4 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-slate-200">Repayment Comparison</h3>
        <p className="text-xs text-slate-500 mt-0.5">Side-by-side impact of your prepayment strategy</p>
      </div>

      {/* Column headers — hidden on very small screens */}
      <div className="hidden sm:grid grid-cols-[1fr_auto_1fr] gap-4 px-5 pt-4 pb-2">
        <ColHeader label="Without Prepayment" color="text-slate-400" dot="bg-slate-600" />
        <div /> {/* spacer for arrow column */}
        <ColHeader label="With Prepayment" color="text-emerald-400" dot="bg-emerald-500" align="right" />
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-800/60">
        {rows.map((row) => (
          <CompareRow key={row.label} row={row} />
        ))}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ColHeader({ label, color, dot, align = 'left' }) {
  return (
    <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : ''}`}>
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      <span className={`text-xs font-medium ${color} uppercase tracking-wider`}>{label}</span>
    </div>
  );
}

function CompareRow({ row }) {
  return (
    <div className="px-5 py-4">
      {/* Row label */}
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">{row.label}</p>

      {/* Values grid */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {/* Without */}
        <div>
          <p className="text-base font-semibold text-slate-400 tabular-nums">{row.without}</p>
          <p className="text-[10px] text-slate-600 mt-0.5 sm:hidden">Without prepayment</p>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center gap-0.5">
          <ArrowRight size={16} className="text-slate-700 hidden sm:block" />
          <ArrowDown size={16} className="text-slate-700 sm:hidden" />
        </div>

        {/* With */}
        <div className="text-right">
          <p className={`text-base font-bold tabular-nums ${row.better ? 'text-emerald-400' : 'text-slate-200'}`}>
            {row.with}
          </p>
          {row.diff && (
            <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">{row.diff}</p>
          )}
          <p className="text-[10px] text-slate-600 mt-0.5 sm:hidden">With prepayment</p>
        </div>
      </div>
    </div>
  );
}
