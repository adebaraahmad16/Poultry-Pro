import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X 
} from '../components/common/Icons';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toastIdCounter = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'info', title, message, duration = 5000 }) => {
    if (!message && !title) return;

    // Prevent duplicate toast if an identical message is already showing
    setToasts((prev) => {
      const existing = prev.find((t) => t.message === message && t.type === type);
      if (existing) {
        // Reset its timer by updating its timestamp
        return prev.map((t) => t.id === existing.id ? { ...t, timestamp: Date.now() } : t);
      }
      toastIdCounter.current += 1;
      const id = `toast-${toastIdCounter.current}-${Date.now()}`;
      return [...prev, { id, type, title, message, duration, timestamp: Date.now() }];
    });
  }, []);

  const toast = {
    success: (message, options = {}) => {
      addToast({
        type: 'success',
        title: options.title || 'Success',
        message: typeof message === 'string' ? message : message?.message || 'Action completed successfully.',
        duration: options.duration || 5000,
      });
    },
    error: (message, options = {}) => {
      addToast({
        type: 'error',
        title: options.title || 'Error',
        message: typeof message === 'string' ? message : message?.message || 'An unexpected error occurred.',
        duration: options.duration || 6500, // Errors stay visible longer
      });
    },
    warning: (message, options = {}) => {
      addToast({
        type: 'warning',
        title: options.title || 'Attention Required',
        message: typeof message === 'string' ? message : message?.message || 'Please review this warning.',
        duration: options.duration || 5500,
      });
    },
    info: (message, options = {}) => {
      addToast({
        type: 'info',
        title: options.title || 'Information',
        message: typeof message === 'string' ? message : message?.message || '',
        duration: options.duration || 5000,
      });
    },
    dismiss: removeToast,
    clearAll: () => setToasts([]),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ─── Toast Container ──────────────────────────────────────────────────────────
function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none p-3 sm:p-0"
    >
      {toasts.map((item) => (
        <ToastItem key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ─── Individual Toast Card ────────────────────────────────────────────────────
function ToastItem({ item, onDismiss }) {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const remainingRef = useRef(item.duration);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();

    timerRef.current = setTimeout(() => {
      onDismiss(item.id);
    }, remainingRef.current);

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const fraction = Math.max(0, 1 - elapsed / remainingRef.current);
      setProgress(fraction * 100);
    }, 50);
  }, [item.id, onDismiss]);

  const pauseTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    clearInterval(intervalRef.current);
    const elapsed = Date.now() - startTimeRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);
  }, []);

  React.useEffect(() => {
    if (!isPaused) {
      startTimer();
    } else {
      pauseTimer();
    }
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(intervalRef.current);
    };
  }, [isPaused, startTimer, pauseTimer]);

  const config = {
    success: {
      borderColor: 'border-l-emerald-600',
      iconBg: 'bg-emerald-100 text-emerald-700',
      progressBar: 'bg-emerald-600',
      badge: 'bg-emerald-50 text-emerald-800',
      Icon: CheckCircle2,
      ariaType: 'status',
    },
    error: {
      borderColor: 'border-l-rose-600',
      iconBg: 'bg-rose-100 text-rose-700',
      progressBar: 'bg-rose-600',
      badge: 'bg-rose-50 text-rose-800',
      Icon: AlertCircle,
      ariaType: 'alert',
    },
    warning: {
      borderColor: 'border-l-amber-500',
      iconBg: 'bg-amber-100 text-amber-700',
      progressBar: 'bg-amber-500',
      badge: 'bg-amber-50 text-amber-800',
      Icon: AlertTriangle,
      ariaType: 'alert',
    },
    info: {
      borderColor: 'border-l-blue-600',
      iconBg: 'bg-blue-100 text-blue-700',
      progressBar: 'bg-blue-600',
      badge: 'bg-blue-50 text-blue-800',
      Icon: Info,
      ariaType: 'status',
    },
  }[item.type] || {
    borderColor: 'border-l-slate-600',
    iconBg: 'bg-slate-100 text-slate-700',
    progressBar: 'bg-slate-600',
    badge: 'bg-slate-50 text-slate-800',
    Icon: Info,
    ariaType: 'status',
  };

  const { Icon } = config;

  return (
    <div
      role={config.ariaType}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 ${config.borderColor} rounded-2xl shadow-xl shadow-slate-900/10 transition-all duration-300 animate-in slide-in-from-top-2 sm:slide-in-from-right-4`}
    >
      <div className="p-4 flex items-start gap-3.5">
        <div className={`p-2 rounded-xl shrink-0 ${config.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 pr-2">
          {item.title && (
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              {item.title}
            </h4>
          )}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed break-words">
            {item.message}
          </p>
        </div>

        <button
          onClick={() => onDismiss(item.id)}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Thin Progress Indicator */}
      <div className="h-1 w-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full transition-all duration-75 ${config.progressBar}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
