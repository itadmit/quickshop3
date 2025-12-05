'use client';

import { useEffect } from 'react';

interface LocaleSetterProps {
  locale: string;
}

export function LocaleSetter({ locale }: LocaleSetterProps) {
  useEffect(() => {
    // עדכון lang attribute של ה-html tag
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale || 'he';
    }
  }, [locale]);

  return null;
}

