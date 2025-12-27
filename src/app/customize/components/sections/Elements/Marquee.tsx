'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { sectionPropsAreEqual } from '../sectionMemoUtils';

interface MarqueeProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  editorDevice?: 'mobile' | 'tablet' | 'desktop';
}

function MarqueeComponent({ section, onUpdate, editorDevice }: MarqueeProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  
  const fontFamily = style.typography?.font_family || '"Noto Sans Hebrew", sans-serif';
  const textColor = style.typography?.color || '#111827';
  const bgColor = style.background?.background_color || 'transparent';
  
  // Text size
  const getTextSizeClass = () => {
    const size = settings.text_size || 'medium';
    const sizeMap: Record<string, string> = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
      xlarge: 'text-xl',
    };
    return sizeMap[size] || 'text-base';
  };
  
  // Speed
  const getSpeed = () => {
    const speed = settings.speed || 'normal';
    const speedMap: Record<string, string> = {
      slow: '20s',
      normal: '15s',
      fast: '10s',
    };
    return speedMap[speed] || '15s';
  };
  
  // Direction
  const direction = settings.direction || 'right';
  const isRTL = direction === 'right'; // In RTL, 'right' means scrolling left to right visually

  return (
    <div 
      className="w-full py-4 overflow-hidden"
      style={{ 
        fontFamily,
        backgroundColor: bgColor,
      }}
    >
      <div className="relative">
        <div
          className={`flex ${getTextSizeClass()} font-medium whitespace-nowrap`}
          style={{
            color: textColor,
            animation: `marquee-${direction} ${getSpeed()} linear infinite`,
            direction: isRTL ? 'rtl' : 'ltr',
          }}
        >
          <span className="px-8">{settings.text || 'טקסט נע'}</span>
          <span className="px-8">{settings.text || 'טקסט נע'}</span>
          <span className="px-8">{settings.text || 'טקסט נע'}</span>
        </div>
      </div>
      <style jsx global>{`
        @keyframes marquee-right {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @keyframes marquee-left {
          0% { transform: translateX(-33.333%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

export const Marquee = React.memo(MarqueeComponent, sectionPropsAreEqual);

