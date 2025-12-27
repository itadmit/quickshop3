'use client';

import React, { useState } from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiX } from 'react-icons/hi';
import Link from 'next/link';
import { sectionPropsAreEqual } from './sectionMemoUtils';

interface AnnouncementBarProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

function AnnouncementBarComponent({ section, onUpdate }: AnnouncementBarProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const settings = section.settings || {};
  const style = section.style || {};
  
  // Settings
  const text = settings.text || 'משלוח חינם בקנייה מעל 299₪';
  const linkUrl = settings.link_url || '';
  const linkText = settings.link_text || '';
  const textAlign = settings.text_align || 'center';
  const showDismiss = settings.show_dismiss !== false;
  const scrollingText = settings.scrolling_text || false;
  const scrollSpeed = settings.scroll_speed || 'normal';
  const height = settings.height || 'auto';
  
  // Colors
  const backgroundColor = style.background?.background_color || settings.background_color || '#000000';
  const textColor = style.typography?.color || settings.text_color || '#ffffff';
  
  // Height classes
  const heightClasses: Record<string, string> = {
    small: 'py-1.5',
    auto: 'py-2',
    large: 'py-3',
  };
  
  // Text alignment
  const alignClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };
  
  // Scroll speed mapping
  const scrollDurations: Record<string, string> = {
    slow: '30s',
    normal: '20s',
    fast: '12s',
  };
  
  if (isDismissed) {
    return null;
  }

  const content = (
    <span className="inline-flex items-center gap-2">
      <span>{text}</span>
      {linkText && linkUrl && (
        <Link 
          href={linkUrl} 
          className="underline hover:no-underline font-medium"
          style={{ color: textColor }}
        >
          {linkText}
        </Link>
      )}
    </span>
  );

  return (
    <div 
      className={`relative ${heightClasses[height]} overflow-hidden`}
      style={{ backgroundColor }}
    >
      <div className={`container mx-auto px-4 ${alignClasses[textAlign]} flex items-center justify-center`}>
        {scrollingText ? (
          <div className="overflow-hidden whitespace-nowrap w-full">
            <div 
              className="inline-block animate-marquee"
              style={{
                color: textColor,
                animationDuration: scrollDurations[scrollSpeed],
              }}
            >
              {content}
              <span className="mx-12">{content}</span>
              <span className="mx-12">{content}</span>
            </div>
          </div>
        ) : (
          <span className="text-sm font-medium" style={{ color: textColor }}>
            {content}
          </span>
        )}
        
        {showDismiss && (
          <button
            onClick={() => setIsDismissed(true)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity"
            style={{ color: textColor }}
            aria-label="סגור"
          >
            <HiX className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Marquee animation styles */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
      `}</style>
    </div>
  );
}

export const AnnouncementBar = React.memo(AnnouncementBarComponent, sectionPropsAreEqual);
