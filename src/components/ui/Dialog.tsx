'use client';

import { ReactNode, useEffect, useRef, createContext, useContext } from 'react';
import { HiX } from 'react-icons/hi';

interface DialogContextType {
  onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextType | null>(null);

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
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
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
    <DialogContext.Provider value={{ onOpenChange }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity duration-200"
          onClick={() => closeOnBackdropClick && onOpenChange(false)}
        />
        <div className="relative z-50 transition-all duration-200 transform">
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  );
}

export function DialogContent({ 
  children, 
  className = '', 
  dir = 'rtl',
  showCloseButton = true,
  onClose,
  maxWidth = 'lg'
}: DialogContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const context = useContext(DialogContext);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (context) {
      context.onOpenChange(false);
    }
  };

  return (
    <div 
      ref={contentRef}
      className={`relative z-50 bg-white rounded-lg shadow-xl ${maxWidthClasses[maxWidth]} w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col ${className}`}
      dir={dir}
      onClick={(e) => e.stopPropagation()}
    >
      {showCloseButton && (
        <button
          onClick={handleClose}
          className="absolute left-4 top-4 z-10 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

export function DialogTitle({ children }: DialogTitleProps) {
  return (
    <h2 className="text-xl font-semibold text-gray-900 pr-8">
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

export function DialogFooter({ children, className = '' }: DialogFooterProps) {
  return (
    <div className={`px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 ${className}`}>
      {children}
    </div>
  );
}

