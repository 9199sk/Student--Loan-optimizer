import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  TrendingDown,
  BookOpen,
  LogOut,
  User,
  Menu,
  X,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import logo from "../assets/vite.png";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          onClick={closeMobileMenu}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center group-hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20">
            <img src={logo} alt="Trending down" className="w-8 h-8" />
          </div>
          <span className="font-bold text-lg text-slate-100 tracking-tight">
            Loan<span className="text-indigo-400">Sathi</span>
          </span>
        </Link>

        {/* Desktop Nav links */}
        <nav className="hidden md:flex items-center gap-1.5">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-slate-800 text-slate-100 shadow-inner"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`
            }
          >
            <LayoutDashboard size={15} />
            Dashboard
          </NavLink>

          {user && (
            <NavLink
              to="/saved"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-slate-800 text-slate-100 shadow-inner"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`
              }
            >
              <BookOpen size={15} />
              Saved Scenarios
            </NavLink>
          )}
        </nav>

        {/* Desktop Auth actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                <User size={13} className="text-indigo-400" />
                {user.name}
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 btn-secondary text-xs py-2 px-3.5 hover:text-red-400 hover:border-red-500/30"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-secondary text-xs py-2 px-4">
                Login
              </Link>
              <Link
                to="/register"
                className="btn-primary text-xs py-2 px-4 shadow-md shadow-indigo-600/20"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={toggleMobileMenu}
          aria-label="Toggle Menu"
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 pt-3 pb-6 flex flex-col gap-3 animate-fadeIn">
          <nav className="flex flex-col gap-1">
            <NavLink
              to="/"
              end
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`
              }
            >
              <LayoutDashboard size={17} />
              Dashboard
            </NavLink>

            {user && (
              <NavLink
                to="/saved"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-slate-100"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`
                }
              >
                <BookOpen size={17} />
                Saved Scenarios
              </NavLink>
            )}
          </nav>

          <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
            {user ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 font-medium">
                  <User size={14} className="text-indigo-400" />
                  <span>
                    Logged in as{" "}
                    <strong className="text-slate-200">{user.name}</strong>
                  </span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    closeMobileMenu();
                  }}
                  className="btn-secondary w-full flex items-center justify-center gap-2 text-xs py-2.5 text-red-400 border-red-500/20"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="btn-secondary text-xs py-2.5 text-center justify-center"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="btn-primary text-xs py-2.5 text-center justify-center"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
