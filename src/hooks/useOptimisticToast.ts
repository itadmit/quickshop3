import { useState, useCallback } from 'react';

interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export function useOptimisticToast() {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);

  const toast = useCallback((props: ToastProps) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast = { ...props, id };
    
    setToasts(prev => [...prev, newToast]);

    // Auto dismiss after duration (default 2000ms)
    const duration = props.duration ?? 2000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);

    return {
      id,
      dismiss: () => setToasts(prev => prev.filter(t => t.id !== id)),
    };
  }, []);

  return { toast, toasts };
}

