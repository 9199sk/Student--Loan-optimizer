import { useState, useEffect } from 'react';
import { X, BookmarkCheck, AlertCircle } from 'lucide-react';
import { formatINR } from '../utils/formatters.js';

export default function SaveScenarioModal({
  isOpen,
  onClose,
  onSave,
  parsed,
  prepayment,
  savings,
  saving,
  error,
}) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen && parsed) {
      const defaultName = `₹${formatINR(parsed.principal, { decimals: 0 })} @ ${parsed.annualRate}% (${parsed.tenureMonths / 12}y)`;
      setName(defaultName);
    }
  }, [isOpen, parsed]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="card max-w-md w-full p-6 shadow-2xl border-slate-800 flex flex-col gap-5 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <BookmarkCheck size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Save Loan Scenario</h3>
            <p className="text-xs text-slate-400">Save this calculation to compare or reload later</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg p-3">
            <AlertCircle size={15} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Preview summary */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Principal:</span>
            <span className="font-semibold text-slate-200">{formatINR(parsed?.principal || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Interest Rate & Tenure:</span>
            <span className="font-semibold text-slate-200">{parsed?.annualRate}% for {parsed?.tenureMonths / 12} yrs</span>
          </div>
          {(prepayment?.extraMonthly > 0 || prepayment?.lumpSum > 0) && (
            <div className="flex justify-between text-emerald-400 font-medium">
              <span>Prepayment Savings:</span>
              <span>{formatINR(savings?.interestSaved || 0)} saved</span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label text-xs" htmlFor="scenarioName">
              Scenario Name
            </label>
            <input
              id="scenarioName"
              type="text"
              className="input text-sm"
              placeholder="e.g. HDFC 10% Loan with ₹5k Extra"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              autoFocus
            />
          </div>

          <div className="flex gap-3 justify-end mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
            >
              {saving ? 'Saving...' : 'Save Scenario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
