import { Link, NavLink } from 'react-router-dom';
import { TrendingDown, BookOpen, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
            <TrendingDown size={18} className="text-white" />
          </div>
          <span className="font-bold text-slate-100 hidden sm:block">
            Loan<span className="text-indigo-400">Optimizer</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`
            }
          >
            Dashboard
          </NavLink>

          {user && (
            <NavLink
              to="/saved"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <BookOpen size={15} />
              Saved
            </NavLink>
          )}
        </nav>

        {/* Auth actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:flex items-center gap-1.5 text-sm text-slate-400">
                <User size={14} />
                {user.name}
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 btn-secondary text-sm py-1.5 px-3"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-sm py-1.5 px-4">
                Login
              </Link>
              <Link to="/register" className="btn-primary text-sm py-1.5 px-4">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
