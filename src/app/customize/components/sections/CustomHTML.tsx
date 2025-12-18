'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiCode } from 'react-icons/hi';

interface CustomHTMLProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  isPreview?: boolean; // true when in customizer
}

export function CustomHTML({ section, onUpdate, isPreview = false }: CustomHTMLProps) {
  const settings = section.settings || {};
  const style = section.style || {};

  // Get settings
  const htmlContent = settings.html_content || '';
  const containerWidth = settings.container_width || 'container'; // full, container, narrow
  const showPlaceholder = !htmlContent || htmlContent.trim() === '';

  // Container width classes
  const containerClasses = {
    full: 'w-full',
    container: 'container mx-auto px-4',
    narrow: 'max-w-3xl mx-auto px-4',
  }[containerWidth] || 'container mx-auto px-4';

  // In preview mode, show a placeholder if no content
  if (showPlaceholder) {
    return (
      <div className="py-12">
        <div className={containerClasses}>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <HiCode className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">קוד HTML מותאם אישית</h3>
            <p className="text-sm text-gray-400">
              הוסף קוד HTML דרך סרגל ההגדרות
            </p>
          </div>
        </div>
      </div>
    );
  }

  // In preview mode (customizer), show warning about HTML
  if (isPreview) {
    return (
      <div className="py-8">
        <div className={containerClasses}>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <HiCode className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">קוד HTML מותאם אישית</span>
            </div>
            <p className="text-sm text-yellow-700">
              הקוד יוצג בחנות החיה. לצפייה מקדימה, שמור ופתח את החנות.
            </p>
            {htmlContent && (
              <div className="mt-3 p-3 bg-white rounded border border-yellow-200 text-xs font-mono text-gray-600 max-h-32 overflow-auto">
                {htmlContent.substring(0, 200)}{htmlContent.length > 200 ? '...' : ''}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // In storefront, render the actual HTML
  return (
    <div className="py-8">
      <div className={containerClasses}>
        <div 
          className="custom-html-content"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
}

