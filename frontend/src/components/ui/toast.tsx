'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

let toastListeners: ((toast: Toast) => void)[] = [];

export function showToast(message: string, type: ToastType = 'success') {
  const toast: Toast = { id: Date.now().toString(), message, type };
  toastListeners.forEach((listener) => listener(toast));
}

const TOAST_CONFIG: Record<ToastType, { icon: typeof CheckCircle2; bg: string; border: string; text: string }> = {
  success: { icon: CheckCircle2, bg: 'bg-green-950/90', border: 'border-green-700/50', text: 'text-green-300' },
  error: { icon: AlertCircle, bg: 'bg-red-950/90', border: 'border-red-700/50', text: 'text-red-300' },
  warning: { icon: AlertTriangle, bg: 'bg-yellow-950/90', border: 'border-yellow-700/50', text: 'text-yellow-300' },
  info: { icon: Info, bg: 'bg-blue-950/90', border: 'border-blue-700/50', text: 'text-blue-300' },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4000);
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const config = TOAST_CONFIG[toast.type];
        const Icon = config.icon;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-2xl animate-in slide-in-from-right-5 fade-in duration-300 ${config.bg} ${config.border}`}
          >
            <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.text}`} />
            <p className={`text-sm flex-1 ${config.text}`}>{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-slate-500 hover:text-white transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
