/**
 * Customizer Module - Main Page
 * /dashboard/customize
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CustomizerLayout } from './components/CustomizerLayout';
import { PageType } from '@/lib/customizer/types';

export default function CustomizePage() {
  const searchParams = useSearchParams();
  const pageType = (searchParams.get('page') || 'home') as PageType;
  const pageHandle = searchParams.get('handle') || undefined;

  return (
    <div className="h-screen flex flex-col" dir="rtl">
      <CustomizerLayout pageType={pageType} pageHandle={pageHandle} />
    </div>
  );
}

