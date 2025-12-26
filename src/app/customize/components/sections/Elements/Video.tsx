'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiVideoCamera } from 'react-icons/hi';

interface VideoProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  editorDevice?: 'mobile' | 'tablet' | 'desktop';
}

export function Video({ section, onUpdate, editorDevice }: VideoProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  
  const videoUrl = (editorDevice === 'mobile' && settings.video_url_mobile) 
    ? settings.video_url_mobile 
    : settings.video_url;
  const autoplay = settings.autoplay !== false;
  const muted = settings.muted !== false;
  const loop = settings.loop === true;
  const controls = settings.controls !== false;
  const playsInline = settings.plays_inline !== false;
  const videoFit = settings.video_fit || 'cover';
  const borderRadius = style.border?.border_radius || '0px';

  return (
    <div className="w-full flex justify-center">
      <div
        className="relative aspect-video w-full max-w-3xl bg-gray-100 flex items-center justify-center overflow-hidden"
        style={{ borderRadius: borderRadius }}
      >
        {videoUrl ? (
          <video
            src={videoUrl}
            className="w-full h-full"
            autoPlay={autoplay}
            muted={muted}
            loop={loop}
            controls={controls}
            playsInline={playsInline}
            style={{ objectFit: videoFit as any }}
          />
        ) : (
          <HiVideoCamera className="w-12 h-12 text-gray-300" />
        )}
      </div>
    </div>
  );
}
