'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';

interface CustomHtmlProps {
  section: SectionSettings;
  onUpdate?: (updates: Partial<SectionSettings>) => void;
}

export function CustomHtml({ section, onUpdate }: CustomHtmlProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  
  // Settings
  const htmlContent = settings.html_content || '';
  const cssContent = settings.css_content || '';
  const maxWidth = settings.max_width || 'full';
  const padding = settings.padding || 'medium';
  
  // Style settings
  const backgroundColor = style.background?.background_color || settings.background_color || 'transparent';
  
  // Max width classes
  const maxWidthClasses: Record<string, string> = {
    'small': 'max-w-2xl',
    'medium': 'max-w-4xl',
    'large': 'max-w-6xl',
    'full': 'max-w-full',
  };
  
  // Padding classes
  const paddingClasses: Record<string, string> = {
    'none': 'py-0',
    'small': 'py-4',
    'medium': 'py-8',
    'large': 'py-12',
  };

  if (!htmlContent) {
    return (
      <div 
        className={`${paddingClasses[padding]} ${maxWidthClasses[maxWidth]} mx-auto px-4`}
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
      className={`${paddingClasses[padding]}`}
      style={{ backgroundColor }}
    >
      {/* Custom CSS */}
      {cssContent && (
        <style dangerouslySetInnerHTML={{ __html: cssContent }} />
      )}
      
      {/* Custom HTML */}
      <div 
        className={`${maxWidthClasses[maxWidth]} mx-auto px-4`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
