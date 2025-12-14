'use client';

import React, { useEffect } from 'react';
import { GeneralSettingsPanel } from './panels/GeneralSettingsPanel';
import { HiX } from 'react-icons/hi';

interface GeneralSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GeneralSettingsModal({ isOpen, onClose }: GeneralSettingsModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    
    const modalElement = document.querySelector('[role="dialog"]');
    if (modalElement) {
      const focusableElements = modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      };

      document.addEventListener('keydown', handleTab);
      firstElement?.focus();

      return () => document.removeEventListener('keydown', handleTab);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" 
      dir="rtl"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div 
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 id="modal-title" className="text-xl font-bold text-gray-900">הגדרות כלליות</h2>
              <p className="text-sm text-gray-500 mt-0.5">התאמה אישית של עיצוב האתר והגדרות גלובליות</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all hover:scale-105 active:scale-95"
            aria-label="סגור"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-50/30">
          <GeneralSettingsPanel onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

