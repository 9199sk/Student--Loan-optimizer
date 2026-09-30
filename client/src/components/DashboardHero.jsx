import { ShieldCheck, Zap, BarChart3, ArrowUpRight } from "lucide-react";

export default function DashboardHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 sm:p-7 mb-2">
      {/* Subtle Glows */}
      <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold w-fit">
            <Zap size={13} />
            <span>Smart Financial Optimizer</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight leading-tight">
            Take Control of Your{" "}
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-[length:200%_auto] animate-gradient">
              Student Debt
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mt-0.5">
            Model your reduction strategy, simulate monthly or lump-sum
            prepayments, and generate a personalised debt-free roadmap.
          </p>
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap md:flex-col gap-2.5 shrink-0 text-xs">
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3.5 py-2 rounded-xl text-slate-300">
            <ShieldCheck size={15} className="text-emerald-400" />
            <span>Zero Data Rounding Precision</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3.5 py-2 rounded-xl text-slate-300">
            <BarChart3 size={15} className="text-indigo-400" />
            <span>Interactive Visual Analytics</span>
          </div>
        </div>
      </div>
    </div>
  );
}
