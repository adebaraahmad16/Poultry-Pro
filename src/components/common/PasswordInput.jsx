import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from './Icons';

/**
 * PasswordInput — reusable password field with show/hide toggle.
 *
 * Props mirror a standard <input> and add:
 *   showLockIcon     {boolean} — prepend the lock icon (default true)
 *   inputClassName   {string}  — extra/override classes on the <input>
 *   wrapperClassName {string}  — extra classes on the wrapper <div>
 *
 * All other props (value, onChange, placeholder, required, autoComplete, …)
 * are forwarded directly to <input>.
 */
export default function PasswordInput({
  showLockIcon = true,
  inputClassName = '',
  wrapperClassName = '',
  id,
  'aria-label': ariaLabel,
  ...inputProps
}) {
  const [visible, setVisible] = useState(false);

  const toggle = (e) => {
    // Prevent accidental form submission inside a <form>
    e.preventDefault();
    e.stopPropagation();
    setVisible((v) => !v);
  };

  const paddingLeft = showLockIcon ? 'pl-10' : 'pl-4';

  return (
    <div className={`relative ${wrapperClassName}`}>
      {showLockIcon && (
        <Lock
          className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          aria-hidden="true"
        />
      )}
      <input
        {...inputProps}
        id={id}
        aria-label={ariaLabel}
        type={visible ? 'text' : 'password'}
        className={`w-full ${paddingLeft} pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${inputClassName}`}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
        tabIndex={0}
      >
        {visible ? (
          <EyeOff className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Eye className="w-4 h-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
