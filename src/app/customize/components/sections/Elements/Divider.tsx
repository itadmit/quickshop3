'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';

interface DividerProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  editorDevice?: 'mobile' | 'tablet' | 'desktop';
}

export function Divider({ section, onUpdate, editorDevice }: DividerProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  
  const dividerStyle = settings.divider_style || 'solid';
  const dividerWidth = settings.divider_width || 'medium';
  const dividerThickness = settings.divider_thickness || '1px';
  const dividerColor = style.border?.border_color || '#E5E7EB';

  const getWidthClass = () => {
    switch (dividerWidth) {
      case 'small': return 'w-1/4';
      case 'medium': return 'w-1/2';
      case 'large': return 'w-3/4';
      case 'full':
      default: return 'w-full';
    }
  };

  const getBorderStyle = () => {
    switch (dividerStyle) {
      case 'dashed': return 'dashed';
      case 'dotted': return 'dotted';
      case 'double': return 'double';
      case 'solid':
      default: return 'solid';
    }
  };

  return (
    <div className="w-full flex justify-center">
      <hr
        className={`${getWidthClass()}`}
        style={{
          borderTopStyle: getBorderStyle(),
          borderTopWidth: dividerThickness,
          borderTopColor: dividerColor,
        }}
      />
    </div>
  );
}

