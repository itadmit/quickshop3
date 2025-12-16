/**
 * useTranslation Hook - לקומפוננטות Client
 * עם caching למניעת קריאות API מיותרות
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';

interface TranslationData {
  [key: string]: any;
}

// Global cache for locale and translations to prevent duplicate API calls
const localeCache = new Map<string, { locale: string; timestamp: number }>();
const translationsCache = new Map<string, { data: TranslationData; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// In-flight request tracking to prevent duplicate requests
const pendingLocaleRequests = new Map<string, Promise<string>>();
const pendingTranslationsRequests = new Map<string, Promise<TranslationData>>();

export function useTranslation(namespace: string = 'common') {
  const params = useParams();
  const storeSlug = params?.storeSlug as string;
  
  // Initialize locale from cache immediately if available
  const initialLocale = storeSlug ? (localeCache.get(storeSlug)?.locale || 'he-IL') : 'he-IL';
  const [locale, setLocale] = useState<string>(initialLocale);
  
  // Initialize translations from cache immediately if available
  const initialCacheKey = `${initialLocale}_${namespace}_${storeSlug || ''}`;
  const initialTranslations = translationsCache.get(initialCacheKey)?.data || {};
  const [translations, setTranslations] = useState<TranslationData>(initialTranslations);
  
  const [loading, setLoading] = useState(Object.keys(initialTranslations).length === 0);
  const mountedRef = useRef(true);
  
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  
  useEffect(() => {
    // טעינת locale מהחנות עם caching
    const loadLocale = async () => {
      if (!storeSlug) return;
      
      const cacheKey = storeSlug;
      const cached = localeCache.get(cacheKey);
      
      // Check if cached value is still valid
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        if (mountedRef.current) setLocale(cached.locale);
        return;
      }
      
      // Check if there's already a pending request
      if (pendingLocaleRequests.has(cacheKey)) {
        const result = await pendingLocaleRequests.get(cacheKey);
        if (mountedRef.current && result) setLocale(result);
        return;
      }
      
      // Make the API call
      const request = (async () => {
        try {
          const response = await fetch(`/api/stores/${storeSlug}/locale`);
          if (response.ok) {
            const data = await response.json();
            const newLocale = data.locale || 'he-IL';
            localeCache.set(cacheKey, { locale: newLocale, timestamp: Date.now() });
            return newLocale;
          }
        } catch (error) {
          console.error('Error loading locale:', error);
        }
        return 'he-IL';
      })();
      
      pendingLocaleRequests.set(cacheKey, request);
      const result = await request;
      pendingLocaleRequests.delete(cacheKey);
      
      if (mountedRef.current) setLocale(result);
    };
    
    loadLocale();
  }, [storeSlug]);
  
  useEffect(() => {
    // טעינת תרגומים עם caching
    const loadTranslations = async () => {
      if (!locale) return;
      
      const cacheKey = `${locale}_${namespace}_${storeSlug || ''}`;
      const cached = translationsCache.get(cacheKey);
      
      // Check if cached value is still valid
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        if (mountedRef.current) {
          setTranslations(cached.data);
          setLoading(false);
        }
        return;
      }
      
      // Check if there's already a pending request
      if (pendingTranslationsRequests.has(cacheKey)) {
        const result = await pendingTranslationsRequests.get(cacheKey);
        if (mountedRef.current && result) {
          setTranslations(result);
          setLoading(false);
        }
        return;
      }
      
      // Make the API call
      if (mountedRef.current) setLoading(true);
      
      const request = (async () => {
        try {
          const response = await fetch(
            `/api/translations?locale=${locale}&namespace=${namespace}${storeSlug ? `&storeSlug=${storeSlug}` : ''}`
          );
          
          if (response.ok) {
            const data = await response.json();
            const translationsData = data.translations || {};
            translationsCache.set(cacheKey, { data: translationsData, timestamp: Date.now() });
            return translationsData;
          }
        } catch (error) {
          console.error('Error loading translations:', error);
        }
        return {};
      })();
      
      pendingTranslationsRequests.set(cacheKey, request);
      const result = await request;
      pendingTranslationsRequests.delete(cacheKey);
      
      if (mountedRef.current) {
        setTranslations(result);
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

