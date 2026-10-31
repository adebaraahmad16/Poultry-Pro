import React, { useEffect } from 'react';
import { X } from './Icons';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-xl' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        role="dialog" aria-modal="true" aria-label={title}
        className={`bg-white rounded-2xl shadow-xl w-full max-h-[90dvh] ${maxWidth} transform transition-all border border-slate-100 overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50">
          <h3 className="min-w-0 text-base sm:text-lg font-semibold text-slate-800 break-words">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            type="button" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="min-w-0 p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
