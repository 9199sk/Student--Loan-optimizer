/**
 * Shared UI atoms used across the dashboard.
 * Keeps individual component files lean.
 */

import { AlertCircle } from 'lucide-react';

/** Labelled input wrapper with inline error */
export function FieldGroup({ label, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="label mb-0">{label}</label>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-400 mt-0.5">
          <AlertCircle size={12} className="flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/** Input with an optional left/right adornment */
export function AdornedInput({ prefix, suffix, className = '', ...props }) {
  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3.5 text-slate-400 text-sm font-medium select-none pointer-events-none z-10">
          {prefix}
        </span>
      )}
      <input
        {...props}
        className={`input ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-12' : ''} ${className}`}
      />
      {suffix && (
        <span className="absolute right-3.5 text-slate-400 text-sm font-medium select-none pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}

/** Divider with optional label */
export function Divider({ label }) {
  if (!label) return <hr className="border-slate-800 my-4" />;
  return (
    <div className="relative flex items-center my-4">
      <hr className="flex-1 border-slate-800" />
      <span className="mx-3 text-xs text-slate-600 uppercase tracking-wider">{label}</span>
      <hr className="flex-1 border-slate-800" />
    </div>
  );
}

/** Spinning loader */
export function Spinner({ size = 20 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"
    />
  );
}

/** Empty-state placeholder */
export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="card flex flex-col items-center justify-center py-16 text-center gap-4">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center">
          <Icon size={26} className="text-slate-500" />
        </div>
      )}
      <div>
        <p className="text-slate-300 font-medium">{title}</p>
        {description && <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">{description}</p>}
      </div>
    </div>
  );
}
