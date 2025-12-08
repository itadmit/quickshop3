'use client';

import React, { useState, useEffect } from 'react';
import { CustomizerLayout } from './components/CustomizerLayout';
import { useStoreId } from '@/hooks/useStoreId';

export default function CustomizePage() {
  const storeId = useStoreId();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (storeId) {
      setIsLoading(false);
    }
  }, [storeId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען קסטומייזר...</p>
        </div>
      </div>
    );
  }

  return <CustomizerLayout />;
}
