'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { HiX, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';

interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

interface ToastItem extends ToastProps {
  id: string;
}

interface ToastContextType {
  toast: (props: ToastProps) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return a no-op toast if no provider
    return { toast: () => {} };
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((props: ToastProps) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast = { ...props, id };
    
    setToasts(prev => [...prev, newToast]);

    const duration = props.duration ?? 3000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-4 left-4 z-[9999] flex flex-col gap-2 max-w-sm" dir="rtl">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              flex items-start gap-3 p-4 rounded-lg shadow-lg border
              animate-in slide-in-from-left-5 fade-in duration-200
              ${t.variant === 'destructive' 
                ? 'bg-red-50 border-red-200 text-red-900' 
                : 'bg-white border-gray-200 text-gray-900'}
            `}
          >
            {t.variant === 'destructive' ? (
              <HiExclamationCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            ) : (
              <HiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{t.title}</p>
              {t.description && (
                <p className={`text-sm mt-1 ${t.variant === 'destructive' ? 'text-red-700' : 'text-gray-600'}`}>
                  {t.description}
                </p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className={`flex-shrink-0 p-1 rounded hover:bg-gray-100 transition-colors ${
                t.variant === 'destructive' ? 'hover:bg-red-100' : ''
              }`}
            >
              <HiX className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

