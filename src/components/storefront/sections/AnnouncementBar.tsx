/**
 * Storefront - Announcement Bar Section Component
 * קומפוננטת בר הודעות עליון
 */

'use client';

import { useState } from 'react';

interface AnnouncementBarProps {
  settings: {
    message?: string;
    link?: string;
    link_text?: string;
    background_color?: string;
    text_color?: string;
    show_close_button?: boolean;
  };
  blocks?: any[];
  globalSettings?: any;
}

export function AnnouncementBar({ settings, blocks, globalSettings }: AnnouncementBarProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || !settings.message) {
    return null;
  }

  return (
    <div
      className="py-2 px-4 text-center text-sm font-medium"
      style={{
        backgroundColor: settings.background_color || '#000000',
        color: settings.text_color || '#FFFFFF',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
        <span>{settings.message}</span>
        {settings.link && settings.link_text && (
          <a
            href={settings.link}
            className="underline hover:no-underline"
          >
            {settings.link_text}
          </a>
        )}
        {settings.show_close_button && (
          <button
            onClick={() => setIsVisible(false)}
            className="ml-auto opacity-75 hover:opacity-100"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

