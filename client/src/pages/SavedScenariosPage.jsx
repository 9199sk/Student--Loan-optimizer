import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookmarkCheck, Trash2, ArrowRight, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api.js';
import { formatINR } from '../utils/formatters.js';

export default function SavedScenariosPage() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  const fetchScenarios = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/scenarios');
      setScenarios(data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load saved scenarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scenario?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/scenarios/${id}`);
      setScenarios((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete scenario');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLoadScenario = (scenario) => {
    navigate('/', { state: { loadScenario: scenario } });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
        <RefreshCw size={24} className="animate-spin text-indigo-400" />
        <p className="text-sm">Loading your saved scenarios...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Saved Loan Scenarios</h1>
          <p className="text-sm text-slate-400 mt-1">
            Compare saved calculations or reload them back into the optimizer
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-4">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {scenarios.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <BookmarkCheck size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-200">No saved scenarios yet</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Use the Loan Optimizer on the dashboard to calculate and save your loan scenarios here.
            </p>
          </div>
          <button onClick={() => navigate('/')} className="btn-primary text-xs px-4 py-2 mt-2">
            Go to Calculator
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {scenarios.map((scenario) => {
            const { _id, name, loanInput, prepayment, summary, createdAt } = scenario;
            const extraMonthly = prepayment?.extraMonthly || 0;
            const lumpSum = prepayment?.lumpSum || 0;
            const interestSaved = summary?.interestSaved || 0;
            const monthsSaved = summary?.monthsSaved || 0;

            return (
              <div
                key={_id}
                className="card p-5 flex flex-col justify-between gap-5 hover:border-slate-700 transition-all group"
              >
                <div className="flex flex-col gap-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {name}
                    </h2>
                    <button
                      onClick={() => handleDelete(_id)}
                      disabled={deletingId === _id}
                      title="Delete scenario"
                      className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded hover:bg-slate-800"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Loan Parameters Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 block">Loan Amount</span>
                      <span className="font-semibold text-slate-200">{formatINR(loanInput?.principal || 0)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Interest Rate</span>
                      <span className="font-semibold text-slate-200">{loanInput?.annualRate}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Tenure</span>
                      <span className="font-semibold text-slate-200">
                        {((loanInput?.tenureMonths || 0) / 12).toFixed(1)} yrs ({loanInput?.tenureMonths} mo)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Extra Payment</span>
                      <span className="font-semibold text-slate-200">
                        {extraMonthly > 0 ? `+${formatINR(extraMonthly)}/mo` : lumpSum > 0 ? `+${formatINR(lumpSum)} lump` : 'None'}
                      </span>
                    </div>
                  </div>

                  {/* Savings summary badge */}
                  {interestSaved > 0 ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl p-2.5 flex justify-between items-center font-medium">
                      <span>Interest Saved: {formatINR(interestSaved)}</span>
                      {monthsSaved > 0 && <span>({monthsSaved} mo earlier)</span>}
                    </div>
                  ) : (
                    <div className="bg-slate-800/40 text-slate-400 text-xs rounded-xl p-2.5 text-center">
                      Standard Repayment (No prepayment)
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>

                  <button
                    onClick={() => handleLoadScenario(scenario)}
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    Load Scenario
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
