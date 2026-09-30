import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingDown, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <TrendingDown size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-100">
            Loan<span className="text-indigo-400">Optimizer</span>
          </span>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-semibold text-slate-100 mb-1">Create an account</h2>
          <p className="text-sm text-slate-400 mb-6">Start optimizing your loan repayment today</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-5">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <input
                id="name" name="name" type="text" className="input"
                placeholder="Priya Sharma"
                value={form.name} onChange={handleChange} required
              />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email" name="email" type="email" className="input"
                placeholder="you@example.com"
                value={form.email} onChange={handleChange} required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password" name="password" type="password" className="input"
                placeholder="Min. 6 characters"
                value={form.password} onChange={handleChange} required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-slate-400 text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
