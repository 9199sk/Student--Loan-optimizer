import { Sparkles, TrendingDown, Clock, BadgePercent } from 'lucide-react';
import { formatINR, formatTenure, formatMonthYear, round } from '../utils/formatters.js';

/**
 * SavingsBanner
 *
 * Attractive hero card shown only when prepayment produces real savings.
 * Summarises the entire benefit in one glance.
 */
export default function SavingsBanner({ savings }) {
  const {
    interestSaved,
    monthsSaved,
    originalTotalInterest,
    newTotalInterest,
    newDebtFreeDate,
  } = savings;

  if (interestSaved <= 0 || monthsSaved <= 0) return null;

  const pctSaved = originalTotalInterest > 0
    ? round((interestSaved / originalTotalInterest) * 100, 1)
    : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 p-6">
      {/* Background glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start gap-3 mb-5 relative">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles size={20} className="text-emerald-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-1">
            Prepayment Impact
          </p>
          <h3 className="text-lg font-bold text-slate-100 leading-snug">
            Save{' '}
            <span className="text-emerald-400">{formatINR(round(interestSaved, 0))}</span>
            {' '}in interest &amp; become debt-free{' '}
            <span className="text-emerald-400">{formatTenure(monthsSaved)} earlier</span>!
          </h3>
        </div>
      </div>

      {/* 3 metric pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative">
        <MetricPill
          icon={TrendingDown}
          label="Interest Saved"
          value={formatINR(round(interestSaved, 0))}
          sub="less interest paid"
          color="emerald"
        />
        <MetricPill
          icon={Clock}
          label="Time Saved"
          value={formatTenure(monthsSaved)}
          sub={`debt-free by ${formatMonthYear(newDebtFreeDate)}`}
          color="indigo"
        />
        <MetricPill
          icon={BadgePercent}
          label="% Saved"
          value={`${pctSaved}%`}
          sub="of original interest"
          color="amber"
        />
      </div>

      {/* Mini before/after interest bar */}
      <div className="mt-5 relative">
        <p className="text-xs text-slate-500 mb-2">Interest reduction</p>
        <div className="flex rounded-full h-2 overflow-hidden bg-slate-800">
          {/* New (smaller) interest */}
          <div
            className="bg-emerald-500 rounded-l-full transition-all duration-700"
            style={{ width: `${(newTotalInterest / originalTotalInterest) * 100}%` }}
          />
          {/* Saved portion */}
          <div
            className="bg-emerald-500/25 transition-all duration-700"
            style={{ width: `${(interestSaved / originalTotalInterest) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-slate-600">
          <span>New interest: {formatINR(round(newTotalInterest, 0))}</span>
          <span className="text-emerald-700">Saved: {formatINR(round(interestSaved, 0))}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const COLOR_MAP = {
  emerald: {
    bg:   'bg-emerald-500/10',
    icon: 'text-emerald-400',
    val:  'text-emerald-300',
  },
  indigo: {
    bg:   'bg-indigo-500/10',
    icon: 'text-indigo-400',
    val:  'text-indigo-300',
  },
  amber: {
    bg:   'bg-amber-500/10',
    icon: 'text-amber-400',
    val:  'text-amber-300',
  },
};

function MetricPill({ icon: Icon, label, value, sub, color }) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.emerald;
  return (
    <div className={`${c.bg} rounded-xl px-4 py-3 flex items-center gap-3`}>
      <Icon size={18} className={`${c.icon} flex-shrink-0`} />
      <div className="min-w-0">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
        <p className={`text-base font-bold ${c.val} leading-tight truncate`}>{value}</p>
        <p className="text-[10px] text-slate-600 truncate">{sub}</p>
      </div>
    </div>
  );
}
