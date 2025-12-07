/**
 * Customizer Module - Preview Frame Component
 * iframe עם תצוגה מקדימה של העמוד
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { PageType } from '@/lib/customizer/types';

interface PreviewFrameProps {
  pageType: PageType;
  pageHandle?: string;
  device: 'desktop' | 'tablet' | 'mobile';
  selectedSectionId: string | null;
  onSectionSelect: (id: string | null) => void;
}

export function PreviewFrame({
  pageType,
  pageHandle,
  device,
  selectedSectionId,
  onSectionSelect,
}: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    // Generate preview URL
    async function generatePreviewUrl() {
      try {
        // Get store slug from API
        const storeResponse = await fetch('/api/auth/me');
        const storeData = await storeResponse.json();
        
        if (storeData?.store?.slug) {
          const token = 'preview-token-placeholder'; // TODO: Generate proper token
          const params = new URLSearchParams({
            token,
            page: pageType,
          });
          if (pageHandle) {
            params.append('handle', pageHandle);
          }
          
          setPreviewUrl(`/shops/${storeData.store.slug}/preview?${params}`);
        }
      } catch (error) {
        console.error('Error generating preview URL:', error);
        // Fallback
        setPreviewUrl(`/shops/demo-store/preview?token=preview-token-placeholder&page=${pageType}`);
      }
    }
    
    generatePreviewUrl();
  }, [pageType, pageHandle]);

  useEffect(() => {
    // Listen for PostMessage from iframe
    function handleMessage(event: MessageEvent) {
      if (event.data.type === 'section-click') {
        onSectionSelect(event.data.sectionId);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSectionSelect]);

  // Send message to iframe when selection changes
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'highlight-section',
          sectionId: selectedSectionId,
        },
        '*'
      );
    }
  }, [selectedSectionId]);

  const deviceStyles = {
    desktop: 'w-full h-full',
    tablet: 'max-w-3xl mx-auto h-full',
    mobile: 'max-w-sm mx-auto h-full',
  };

  if (!previewUrl) {
    return (
      <div className={`${deviceStyles[device]} bg-white rounded-lg shadow-lg flex items-center justify-center`}>
        <div className="text-gray-500 text-center">
          <div className="text-lg mb-2">טוען תצוגה מקדימה...</div>
          <div className="text-sm">אנא המתן</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${deviceStyles[device]} bg-white rounded-lg shadow-lg overflow-hidden`}>
      {previewUrl && (
        <iframe
          ref={iframeRef}
          src={previewUrl}
          className="w-full h-full border-0"
          title="Preview"
          sandbox="allow-scripts allow-forms allow-popups allow-modals"
        />
      )}
    </div>
  );
}

