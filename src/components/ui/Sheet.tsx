'use client';

import { ReactNode, useEffect } from 'react';
import { HiX } from 'react-icons/hi';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  side?: 'left' | 'right';
}

interface SheetContentProps {
  children: ReactNode;
  className?: string;
}

interface SheetHeaderProps {
  children: ReactNode;
  className?: string;
  onClose?: () => void;
}

interface SheetTitleProps {
  children: ReactNode;
}

interface SheetDescriptionProps {
  children: ReactNode;
}

interface SheetBodyProps {
  children: ReactNode;
  className?: string;
}

interface SheetFooterProps {
  children: ReactNode;
  className?: string;
}

export function Sheet({ open, onOpenChange, children, side = 'left' }: SheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity duration-200"
        onClick={() => onOpenChange(false)}
      />
      <div className={`fixed top-0 ${side === 'left' ? 'left-0' : 'right-0'} h-full w-full max-w-lg bg-white shadow-xl z-50 flex flex-col transition-transform duration-300`} dir="rtl">
        {children}
      </div>
    </div>
  );
}

export function SheetContent({ children, className = '' }: SheetContentProps) {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {children}
    </div>
  );
}

export function SheetHeader({ children, className = '', onClose }: SheetHeaderProps) {
  return (
    <div className={`flex items-center justify-between p-6 border-b border-gray-200 ${className}`}>
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <HiX className="w-5 h-5 text-gray-600" />
        </button>
      )}
    </div>
  );
}

export function SheetTitle({ children }: SheetTitleProps) {
  return (
    <h2 className="text-xl font-semibold text-gray-900">{children}</h2>
  );
}

export function SheetDescription({ children }: SheetDescriptionProps) {
  return (
    <p className="text-sm text-gray-500 mt-1">{children}</p>
  );
}

export function SheetBody({ children, className = '' }: SheetBodyProps) {
  return (
    <div className={`flex-1 overflow-y-auto p-6 ${className}`}>
      {children}
    </div>
  );
}

export function SheetFooter({ children, className = '' }: SheetFooterProps) {
  return (
    <div className={`flex items-center justify-end gap-2 p-6 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

