import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { formatINR, formatMonthYear, round } from '../utils/formatters.js';

const PAGE_SIZE = 12;

/**
 * AmortizationTable
 *
 * Paginated month-by-month amortization breakdown.
 * When hasPrepayment is true, shows a toggle to switch between
 * the original schedule and the prepayment schedule.
 *
 * Props:
 *   schedule        — original schedule rows
 *   scheduleAlt     — prepayment schedule rows (optional)
 *   hasPrepayment   — show the toggle
 *   totalInterest, totalPayment, totalPrincipal
 *   altTotals       — totals for the prepayment schedule
 */
export default function AmortizationTable({
  schedule,
  scheduleAlt,
  hasPrepayment,
  totalInterest,
  totalPayment,
  totalPrincipal,
  altTotals,
}) {
  const [page, setPage] = useState(1);
  const [collapsed, setCollapsed] = useState(false);
  const [showAlt, setShowAlt] = useState(false);

  // Which schedule is currently displayed
  const activeSchedule = showAlt && hasPrepayment && scheduleAlt ? scheduleAlt : schedule;
  const activeTotals   = showAlt && hasPrepayment && altTotals ? altTotals : { totalInterest, totalPayment, totalPrincipal };

  const repayRows = activeSchedule.filter(r => !r.isMoratorium);
  const totalPages = Math.ceil(activeSchedule.length / PAGE_SIZE);

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return activeSchedule.slice(start, start + PAGE_SIZE);
  // reset to page 1 when toggling between schedules
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSchedule, page]);

  // Reset page to 1 when toggling view
  const handleToggle = (alt) => {
    setShowAlt(alt);
    setPage(1);
  };

  // Jump to page containing the current calendar month
  const todayMonthRow = activeSchedule.findIndex(r => {
    const d = new Date(r.date);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const todayPage = todayMonthRow >= 0 ? Math.ceil((todayMonthRow + 1) / PAGE_SIZE) : null;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Amortization Schedule</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeSchedule.length} months
            {activeSchedule.some(r => r.isMoratorium) && ` · ${activeSchedule.filter(r => r.isMoratorium).length} moratorium`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Schedule toggle — only when prepayment is active */}
          {hasPrepayment && (
            <div className="flex rounded-lg overflow-hidden border border-slate-700 text-xs">
              <button
                onClick={() => handleToggle(false)}
                className={`px-3 py-1.5 transition-colors ${
                  !showAlt
                    ? 'bg-slate-700 text-slate-100'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                Original
              </button>
              <button
                onClick={() => handleToggle(true)}
                className={`px-3 py-1.5 transition-colors ${
                  showAlt
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                Prepaid
              </button>
            </div>
          )}
          {todayPage && todayPage !== page && (
            <button
              onClick={() => setPage(todayPage)}
              className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Today →
            </button>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-400"
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50">
                  <Th>Month</Th>
                  <Th>Date</Th>
                  <Th align="right">Payment</Th>
                  <Th align="right">Principal</Th>
                  <Th align="right">Interest</Th>
                  <Th align="right">Balance</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, idx) => (
                  <TableRow key={row.month} row={row} isEven={idx % 2 === 0} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals row */}
          <div className="border-t border-slate-700 px-5 py-3 bg-slate-800/40 grid grid-cols-3 sm:grid-cols-5 gap-4 text-xs">
            <TotalCell label="Months" value={`${repayRows.length}`} />
            <TotalCell label="Total Payment" value={formatINR(round(activeTotals.totalPayment, 0))} color="text-amber-400" />
            <TotalCell label="Total Principal" value={formatINR(round(activeTotals.totalPrincipal, 0))} color="text-indigo-400" />
            <TotalCell label="Total Interest" value={formatINR(round(activeTotals.totalInterest, 0))} color="text-rose-400" />
            <TotalCell label="Final Balance" value="₹0" color="text-emerald-400" />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-slate-800 px-5 py-3 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Showing rows {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, activeSchedule.length)} of {activeSchedule.length}
              </span>
              <div className="flex items-center gap-1">
                <PageButton onClick={() => setPage(1)} disabled={page === 1} title="First">«</PageButton>
                <PageButton onClick={() => setPage(p => p - 1)} disabled={page === 1} title="Prev">
                  <ChevronLeft size={14} />
                </PageButton>

                {getPageRange(page, totalPages).map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="w-8 text-center text-slate-600 text-xs">…</span>
                  ) : (
                    <PageButton
                      key={p}
                      onClick={() => setPage(p)}
                      active={page === p}
                    >
                      {p}
                    </PageButton>
                  )
                )}

                <PageButton onClick={() => setPage(p => p + 1)} disabled={page === totalPages} title="Next">
                  <ChevronRight size={14} />
                </PageButton>
                <PageButton onClick={() => setPage(totalPages)} disabled={page === totalPages} title="Last">»</PageButton>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Th({ children, align = 'left' }) {
  return (
    <th
      className={`px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap text-${align}`}
    >
      {children}
    </th>
  );
}

function TableRow({ row, isEven }) {
  const isMora = row.isMoratorium;
  const isLast = Math.abs(row.balance) < 1;

  return (
    <tr
      className={`
        border-b border-slate-800/60 transition-colors
        ${isEven ? 'bg-transparent' : 'bg-slate-800/20'}
        ${isMora ? 'opacity-50' : 'hover:bg-slate-800/40'}
        ${isLast ? 'bg-emerald-950/20' : ''}
      `}
    >
      {/* Month */}
      <td className="px-4 py-2.5 text-slate-400 tabular-nums text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-mono">{row.month}</span>
          {isMora && (
            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 rounded-full">
              Mora.
            </span>
          )}
          {isLast && !isMora && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 rounded-full">
              Final
            </span>
          )}
        </div>
      </td>

      {/* Date */}
      <td className="px-4 py-2.5 text-slate-400 text-xs whitespace-nowrap">
        {formatMonthYear(row.date)}
      </td>

      {/* Payment */}
      <td className="px-4 py-2.5 text-right tabular-nums">
        {isMora ? (
          <span className="text-xs text-slate-600">—</span>
        ) : (
          <span className="text-slate-200 font-medium">{formatINR(round(row.payment, 0))}</span>
        )}
      </td>

      {/* Principal */}
      <td className="px-4 py-2.5 text-right tabular-nums">
        {isMora ? (
          <span className="text-xs text-slate-600">—</span>
        ) : (
          <span className="text-indigo-400 font-medium">{formatINR(round(row.principalPaid, 0))}</span>
        )}
      </td>

      {/* Interest */}
      <td className="px-4 py-2.5 text-right tabular-nums">
        <span className={`font-medium ${isMora ? 'text-amber-500' : 'text-rose-400'}`}>
          {formatINR(round(row.interestPaid, 0))}
          {isMora && <span className="text-[10px] text-amber-600 ml-1">(accrued)</span>}
        </span>
      </td>

      {/* Balance */}
      <td className="px-4 py-2.5 text-right tabular-nums">
        <span className={`font-medium ${isLast && !isMora ? 'text-emerald-400' : 'text-slate-300'}`}>
          {formatINR(round(row.balance, 0))}
        </span>
      </td>
    </tr>
  );
}

function TotalCell({ label, value, color = 'text-slate-200' }) {
  return (
    <div>
      <p className="text-slate-500 mb-0.5">{label}</p>
      <p className={`font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function PageButton({ children, onClick, disabled, active, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        min-w-[32px] h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors
        ${active
          ? 'bg-indigo-600 text-white'
          : disabled
            ? 'text-slate-700 cursor-not-allowed'
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        }
      `}
    >
      {children}
    </button>
  );
}

// Generate page number range with ellipsis: [1, 2, ..., 7, 8, 9, ..., 15]
function getPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [];
  const addPage = p => pages.push(p);
  const addEllipsis = () => pages.push('...');

  addPage(1);
  if (current > 3) addEllipsis();

  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    addPage(p);
  }

  if (current < total - 2) addEllipsis();
  addPage(total);

  return pages;
}
