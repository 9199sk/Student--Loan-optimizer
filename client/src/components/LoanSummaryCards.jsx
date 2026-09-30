import { CreditCard, TrendingUp, Wallet, Calendar } from 'lucide-react';
import { formatINR, formatTenure, formatMonthYear, round } from '../utils/formatters.js';

/**
 * LoanSummaryCards
 *
 * Four KPI cards + principal-vs-interest breakdown bar.
 * When `hasPrepayment` is true, the last card shows the prepaid debt-free date
 * and tenure instead of the original.
 */
export default function LoanSummaryCards({ results, hasPrepayment }) {
  const { emi, original, savings } = results;
  const { totalPayment, totalInterest, totalPrincipal } = original;

  const interestPct  = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0;
  const principalPct = 100 - interestPct;

  // Show prepaid dates/tenure when active; original otherwise
  const debtFreeDate   = hasPrepayment ? savings.newDebtFreeDate   : savings.originalDebtFreeDate;
  const tenureMonths   = hasPrepayment ? savings.newTenureMonths   : savings.originalTenureMonths;
  const displayInterest = hasPrepayment ? savings.newTotalInterest : totalInterest;

  return (
    <div className="flex flex-col gap-4">
      {/* ── 4 KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={CreditCard}
          iconColor="text-indigo-400"
          iconBg="bg-indigo-500/15"
          label="Monthly EMI"
          value={formatINR(round(emi, 0))}
          sub="fixed monthly payment"
        />
        <KpiCard
          icon={TrendingUp}
          iconColor="text-rose-400"
          iconBg="bg-rose-500/15"
          label={hasPrepayment ? 'Interest (New)' : 'Total Interest'}
          value={formatINR(round(displayInterest, 0))}
          sub={`${round(hasPrepayment
            ? (displayInterest / totalPayment) * 100
            : interestPct, 1)}% of outflow`}
          highlight={hasPrepayment}
        />
        <KpiCard
          icon={Wallet}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/15"
          label="Total Payment"
          value={formatINR(round(totalPayment, 0))}
          sub="Principal + Interest"
        />
        <KpiCard
          icon={Calendar}
          iconColor={hasPrepayment ? 'text-emerald-400' : 'text-emerald-400'}
          iconBg={hasPrepayment ? 'bg-emerald-500/25' : 'bg-emerald-500/15'}
          label={hasPrepayment ? 'New Debt-Free Date' : 'Debt-Free By'}
          value={formatMonthYear(debtFreeDate)}
          sub={formatTenure(tenureMonths)}
          highlight={hasPrepayment}
        />
      </div>

      {/* ── Principal vs Interest Breakdown ──────────────────────────────── */}
      <BreakdownBar
        principal={totalPrincipal}
        interest={totalInterest}
        newInterest={hasPrepayment ? savings.newTotalInterest : null}
        principalPct={principalPct}
        interestPct={interestPct}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, iconColor, iconBg, label, value, sub, highlight }) {
  return (
    <div className={`card p-5 flex flex-col gap-3 transition-all duration-300 ${
      highlight ? 'border-emerald-500/40 shadow-emerald-500/10' : ''
    }`}>
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div>
        <p className="stat-label">{label}</p>
        <p className={`text-xl font-bold mt-0.5 leading-tight ${
          highlight ? 'text-emerald-300' : 'text-slate-100'
        }`}>
          {value}
        </p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function BreakdownBar({ principal, interest, newInterest, principalPct, interestPct }) {
  const hasNewInterest = newInterest !== null && newInterest !== undefined;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200">Payment Breakdown</h3>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <LegendDot color="bg-indigo-500" label="Principal" />
          <LegendDot color="bg-rose-500" label="Interest" />
          {hasNewInterest && <LegendDot color="bg-emerald-500/50" label="Saved" />}
        </div>
      </div>

      {/* Stacked bar */}
      <div className="flex rounded-full overflow-hidden h-3 gap-0.5 mb-4">
        <div
          className="bg-indigo-500 transition-all duration-500 rounded-l-full"
          style={{ width: `${principalPct}%` }}
        />
        {hasNewInterest ? (
          <>
            <div
              className="bg-rose-500 transition-all duration-500"
              style={{ width: `${(newInterest / (principal + interest)) * 100}%` }}
            />
            <div
              className="bg-emerald-500/30 transition-all duration-500 rounded-r-full flex-1"
            />
          </>
        ) : (
          <div className="bg-rose-500 transition-all duration-500 rounded-r-full flex-1" />
        )}
      </div>

      {/* Values */}
      <div className={`grid gap-4 ${hasNewInterest ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <div>
          <p className="text-xs text-slate-500 mb-1">Principal</p>
          <p className="text-base font-bold text-indigo-400">{formatINR(round(principal, 0))}</p>
          <p className="text-xs text-slate-600 mt-0.5">{round(principalPct, 1)}%</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">
            {hasNewInterest ? 'Interest (New)' : 'Interest'}
          </p>
          <p className="text-base font-bold text-rose-400">
            {formatINR(round(hasNewInterest ? newInterest : interest, 0))}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">{round(interestPct, 1)}%</p>
        </div>
        {hasNewInterest && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Interest Saved</p>
            <p className="text-base font-bold text-emerald-400">
              {formatINR(round(interest - newInterest, 0))}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {round(((interest - newInterest) / interest) * 100, 1)}% less
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
