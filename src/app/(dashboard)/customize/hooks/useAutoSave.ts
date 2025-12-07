/**
 * Customizer Module - Auto Save Hook
 * Hook לשמירה אוטומטית עם debounce
 */

import { useEffect, useRef, useCallback } from 'react';
import { savePageDraft } from '../actions';
import { PageType } from '@/lib/customizer/types';

interface UseAutoSaveOptions {
  pageType: PageType;
  pageHandle?: string;
  sections: any[];
  sectionOrder: string[];
  enabled?: boolean;
  debounceMs?: number;
  onSave?: (success: boolean) => void;
}

export function useAutoSave({
  pageType,
  pageHandle,
  sections,
  sectionOrder,
  enabled = true,
  debounceMs = 2000,
  onSave,
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<Date | null>(null);

  const save = useCallback(async () => {
    if (!enabled || sections.length === 0) {
      return;
    }

    try {
      const result = await savePageDraft({
        page_type: pageType,
        page_handle: pageHandle,
        sections,
        section_order: sectionOrder,
      });

      if (result.success) {
        lastSavedRef.current = new Date();
        onSave?.(true);
      } else {
        onSave?.(false);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      onSave?.(false);
    }
  }, [pageType, pageHandle, sections, sectionOrder, enabled, onSave]);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    if (enabled && sections.length > 0) {
      timeoutRef.current = setTimeout(() => {
        save();
      }, debounceMs);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [sections, sectionOrder, enabled, debounceMs, save]);

  // Manual save function
  const manualSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await save();
  }, [save]);

  return {
    lastSaved: lastSavedRef.current,
    manualSave,
  };
}

