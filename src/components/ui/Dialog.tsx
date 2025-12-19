'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { HiX } from 'react-icons/hi';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  closeOnBackdropClick?: boolean;
}

interface DialogContentProps {
  children: ReactNode;
  className?: string;
  dir?: 'rtl' | 'ltr';
  showCloseButton?: boolean;
  onClose?: () => void;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
}

interface DialogHeaderProps {
  children: ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: ReactNode;
}

interface DialogDescriptionProps {
  children: ReactNode;
}

interface DialogFooterProps {
  children: ReactNode;
  className?: string;
}

interface DialogBodyProps {
  children: ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, children, closeOnBackdropClick = true }: DialogProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity duration-200"
        onClick={() => closeOnBackdropClick && onOpenChange(false)}
      />
      <div className="relative z-50 transition-all duration-200 transform">
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ 
  children, 
  className = '', 
  dir = 'rtl',
  showCloseButton = true,
  onClose,
  maxWidth = '3xl'
}: DialogContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const maxWidthClasses = {
    sm: 'min-w-[400px] max-w-sm',
    md: 'min-w-[500px] max-w-md',
    lg: 'min-w-[600px] max-w-lg',
    xl: 'min-w-[700px] max-w-xl',
    '2xl': 'min-w-[750px] max-w-2xl',
    '3xl': 'min-w-[800px] max-w-3xl',
    full: 'min-w-[90vw] max-w-full'
  };

  return (
    <div 
      ref={contentRef}
      className={`relative z-50 bg-white rounded-xl shadow-2xl ${maxWidthClasses[maxWidth]} w-full mx-4 max-h-[95vh] flex flex-col ${className}`}
      dir={dir}
      onClick={(e) => e.stopPropagation()}
    >
      {showCloseButton && (
        <button
          onClick={onClose}
          className="absolute left-6 top-6 z-10 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="סגור"
        >
          <HiX className="w-5 h-5" />
        </button>
      )}
      {children}
    </div>
  );
}

export function DialogHeader({ children, className = '' }: DialogHeaderProps) {
  return (
    <div className={`px-8 pt-6 pb-5 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

export function DialogTitle({ children }: DialogTitleProps) {
  return (
    <h2 className="text-2xl font-bold text-gray-900 pr-8">
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

export function DialogBody({ children, className = '' }: DialogBodyProps) {
  return (
    <div className={`px-8 py-6 overflow-y-auto overflow-x-visible ${className}`}>
      {children}
    </div>
  );
}

export function DialogFooter({ children, className = '' }: DialogFooterProps) {
  return (
    <div className={`px-8 py-5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3 ${className}`}>
      {children}
    </div>
  );
}

