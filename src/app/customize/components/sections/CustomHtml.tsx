'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { sectionPropsAreEqual } from './sectionMemoUtils';

interface CustomHtmlProps {
  section: SectionSettings;
  onUpdate?: (updates: Partial<SectionSettings>) => void;
}

function CustomHtmlComponent({ section, onUpdate }: CustomHtmlProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  
  // Settings
  const htmlContent = settings.html_content || '';
  const cssContent = settings.css_content || '';
  const containerWidth = settings.container_width || 'full';
  
  // Style settings
  const backgroundColor = style.background?.background_color || settings.background_color || 'transparent';
  
  // Max width classes
  const maxWidthClasses: Record<string, string> = {
    'narrow': 'max-w-2xl',
    'container': 'max-w-6xl',
    'full': 'max-w-full',
  };

  if (!htmlContent) {
    return (
      <div 
        className={`py-8 ${maxWidthClasses[containerWidth]} mx-auto px-4`}
        style={{ backgroundColor }}
      >
        <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm">אין תוכן HTML</p>
          <p className="text-xs mt-1">הוסף קוד HTML בהגדרות הסקשן</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="py-8"
      style={{ backgroundColor }}
    >
      {/* Custom CSS */}
      {cssContent && (
        <style dangerouslySetInnerHTML={{ __html: cssContent }} />
      )}
      
      {/* Custom HTML */}
      <div 
        className={`${maxWidthClasses[containerWidth]} mx-auto px-4`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}

export const CustomHtml = React.memo(CustomHtmlComponent, sectionPropsAreEqual);
