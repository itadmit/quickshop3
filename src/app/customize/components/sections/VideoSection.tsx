'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiPlay } from 'react-icons/hi';

interface VideoSectionProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

export function VideoSection({ section, onUpdate }: VideoSectionProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  
  const videoUrl = settings.video_url;
  const coverImage = settings.cover_image;
  const textColor = style.typography?.color;

  return (
    <div className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {(settings.title || settings.description) && (
          <div className="text-center mb-10 max-w-3xl mx-auto">
            {settings.title && (
              <h2 className="text-3xl font-bold mb-4" style={{ color: textColor }}>{settings.title}</h2>
            )}
            {settings.description && (
              <p className="text-lg opacity-80" style={{ color: textColor }}>{settings.description}</p>
            )}
          </div>
        )}

        <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-xl group">
          {videoUrl ? (
            <video
              src={videoUrl}
              className="w-full h-full object-cover"
              controls={true}
              poster={coverImage}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <HiPlay className="w-10 h-10 ml-1" />
                </div>
                <p className="text-gray-400">בחר סרטון בהגדרות הסקשן</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
