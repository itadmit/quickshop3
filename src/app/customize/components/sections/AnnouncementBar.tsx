'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiX, HiSpeakerphone } from 'react-icons/hi';

interface AnnouncementBarProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

export function AnnouncementBar({ section, onUpdate }: AnnouncementBarProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  const [dismissed, setDismissed] = React.useState(false);

  // Get settings
  const text = settings.text || 'משלוח חינם בהזמנות מעל ₪200';
  const linkText = settings.link_text || '';
  const linkUrl = settings.link_url || '';
  const showDismiss = settings.show_dismiss !== false;
  const textAlign = settings.text_align || 'center';
  const height = settings.height || 'auto';
  const isScrolling = settings.scrolling_text === true;
  const scrollSpeed = settings.scroll_speed || 'normal';

  // Colors from style
  const backgroundColor = style.background?.background_color || '#000000';
  const textColor = style.typography?.color || '#FFFFFF';
  const linkColor = settings.link_color || textColor;

  // Height classes
  const heightClasses = {
    small: 'py-1',
    auto: 'py-2',
    large: 'py-3',
  }[height] || 'py-2';

  // Scroll speed
  const scrollDuration = {
    slow: '30s',
    normal: '20s',
    fast: '10s',
  }[scrollSpeed] || '20s';

  // Text align classes
  const textAlignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }[textAlign] || 'justify-center';

  if (dismissed) return null;

  return (
    <>
      {isScrolling && (
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes scroll-left {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .announcement-scroll {
            animation: scroll-left ${scrollDuration} linear infinite;
          }
        `}} />
      )}
      <div 
        className={`w-full ${heightClasses} px-4 relative`}
        style={{ backgroundColor }}
        dir="rtl"
      >
        <div className={`flex items-center ${textAlignClasses} max-w-7xl mx-auto`}>
          {isScrolling ? (
            <div className="overflow-hidden flex-1">
              <div 
                className="announcement-scroll whitespace-nowrap flex items-center gap-2"
                style={{ color: textColor }}
              >
                <HiSpeakerphone className="w-4 h-4 inline-block flex-shrink-0" />
                <span className="text-sm font-medium">{text}</span>
                {linkText && (
                  <a 
                    href={linkUrl || '#'}
                    className="text-sm underline hover:no-underline"
                    style={{ color: linkColor }}
                  >
                    {linkText}
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div 
              className="flex items-center gap-2"
              style={{ color: textColor }}
            >
              <HiSpeakerphone className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">{text}</span>
              {linkText && (
                <a 
                  href={linkUrl || '#'}
                  className="text-sm underline hover:no-underline"
                  style={{ color: linkColor }}
                >
                  {linkText}
                </a>
              )}
            </div>
          )}
          
          {showDismiss && (
            <button 
              onClick={() => setDismissed(true)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity"
              style={{ color: textColor }}
              aria-label="סגור"
            >
              <HiX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

