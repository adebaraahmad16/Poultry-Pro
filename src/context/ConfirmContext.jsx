import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { AlertTriangle, AlertCircle, X } from '../components/common/Icons';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children, Dialog = null }) {
  const [dialogState, setDialogState] = useState(null);
  const resolveRef = useRef(null);
  const DialogShell = Dialog || 'div';

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialogState({
        title: options.title || 'Are you sure?',
        message: options.message || 'Please confirm to continue.',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        isDanger: options.isDanger !== false,
        isOpen: true,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolveRef.current) resolveRef.current(true);
    setDialogState(null);
  }, []);

  const handleCancel = useCallback(() => {
    if (resolveRef.current) resolveRef.current(false);
    setDialogState(null);
  }, []);

  // Keyboard accessibility: Escape to cancel, Enter to confirm
  useEffect(() => {
    if (!dialogState?.isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogState?.isOpen, handleCancel]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialogState?.isOpen && (
        <DialogShell
          onClose={Dialog ? handleCancel : undefined}
          title={Dialog ? dialogState.title : undefined}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-2xl shrink-0 ${
                  dialogState.isDanger
                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                }`}
              >
                {dialogState.isDanger ? (
                  <AlertCircle className="w-6 h-6 stroke-[2.2]" />
                ) : (
                  <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  id="confirm-dialog-title"
                  className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-snug"
                >
                  {dialogState.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {dialogState.message}
                </p>
              </div>

              <button
                onClick={handleCancel}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
              >
                {dialogState.cancelText}
              </button>

              <button
                type="button"
                autoFocus
                onClick={handleConfirm}
                className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all ${
                  dialogState.isDanger
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                }`}
              >
                {dialogState.confirmText}
              </button>
            </div>
          </div>
        </DialogShell>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}
