/**
 * useTranslation Hook - לקומפוננטות Client
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

interface TranslationData {
  [key: string]: any;
}

export function useTranslation(namespace: string = 'common') {
  const params = useParams();
  const storeSlug = params?.storeSlug as string;
  const [locale, setLocale] = useState<string>('he-IL');
  const [translations, setTranslations] = useState<TranslationData>({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // טעינת locale מהחנות
    const loadLocale = async () => {
      try {
        if (storeSlug) {
          const response = await fetch(`/api/stores/${storeSlug}/locale`);
          if (response.ok) {
            const data = await response.json();
            setLocale(data.locale || 'he-IL');
          }
        }
      } catch (error) {
        console.error('Error loading locale:', error);
      }
    };
    
    loadLocale();
  }, [storeSlug]);
  
  useEffect(() => {
    // טעינת תרגומים
    const loadTranslations = async () => {
      if (!locale) return;
      
      try {
        setLoading(true);
        const response = await fetch(
          `/api/translations?locale=${locale}&namespace=${namespace}${storeSlug ? `&storeSlug=${storeSlug}` : ''}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setTranslations(data.translations || {});
        }
      } catch (error) {
        console.error('Error loading translations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadTranslations();
  }, [locale, namespace, storeSlug]);
  
  const getNestedValue = useCallback((obj: any, path: string): string | null => {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }
    
    return typeof current === 'string' ? current : null;
  }, []);
  
  const replaceParams = useCallback((text: string, params: Record<string, string | number>): string => {
    let result = text;
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
    return result;
  }, []);
  
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const translation = getNestedValue(translations, key);
    
    if (!translation) {
      return key; // Fallback ל-key עצמו
    }
    
    if (params) {
      return replaceParams(translation, params);
    }
    
    return translation;
  }, [translations, getNestedValue, replaceParams]);
  
  return { t, locale, loading };
}

