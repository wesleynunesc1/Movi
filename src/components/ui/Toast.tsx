import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  toast: (options: Omit<ToastMessage, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type, title, description }: Omit<ToastMessage, 'id'>) => {
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((prev) => [...prev, { id, type, title, description }]);
      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  const success = useCallback((title: string, description?: string) => toast({ type: 'success', title, description }), [toast]);
  const error = useCallback((title: string, description?: string) => toast({ type: 'error', title, description }), [toast]);
  const warning = useCallback((title: string, description?: string) => toast({ type: 'warning', title, description }), [toast]);
  const info = useCallback((title: string, description?: string) => toast({ type: 'info', title, description }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      {/* Toast container floating in the top-right corner */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border bg-surface shadow-elevated transition-all animate-in slide-in-from-top-2 duration-200',
              t.type === 'success' && 'border-status-success/30 text-movi-graphite',
              t.type === 'error' && 'border-status-danger/30 text-movi-graphite',
              t.type === 'warning' && 'border-status-warning/30 text-movi-graphite',
              t.type === 'info' && 'border-border text-movi-graphite'
            )}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-status-success" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-status-danger" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-status-warning" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-movi-yellow" />}
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-semibold text-movi-graphite">{t.title}</h5>
              {t.description && <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{t.description}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-text-muted hover:text-movi-graphite p-1 rounded-lg transition-colors shrink-0"
              aria-label="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
