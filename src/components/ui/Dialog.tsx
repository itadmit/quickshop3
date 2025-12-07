'use client';

import { ReactNode, useEffect } from 'react';
import { HiX } from 'react-icons/hi';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

interface DialogContentProps {
  children: ReactNode;
  className?: string;
  dir?: 'rtl' | 'ltr';
}

interface DialogHeaderProps {
  children: ReactNode;
}

interface DialogTitleProps {
  children: ReactNode;
}

interface DialogDescriptionProps {
  children: ReactNode;
}

interface DialogFooterProps {
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  );
}

export function DialogContent({ children, className = '', dir = 'rtl' }: DialogContentProps) {
  return (
    <div 
      className={`relative z-50 bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto flex flex-col ${className}`}
      dir={dir}
    >
      {children}
    </div>
  );
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return (
    <div className="px-6 py-4 border-b">
      {children}
    </div>
  );
}

export function DialogTitle({ children }: DialogTitleProps) {
  return (
    <h2 className="text-xl font-semibold text-gray-900">
      {children}
    </h2>
  );
}

export function DialogDescription({ children }: DialogDescriptionProps) {
  return (
    <div className="text-sm text-gray-600 mt-1">
      {children}
    </div>
  );
}

export function DialogFooter({ children }: DialogFooterProps) {
  return (
    <div className="px-6 py-4 border-t flex items-center justify-end gap-3 mt-4">
      {children}
    </div>
  );
}

