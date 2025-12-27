'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiPhotograph } from 'react-icons/hi';
import Link from 'next/link';
import { sectionPropsAreEqual } from '../sectionMemoUtils';

interface ImageProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  editorDevice?: 'mobile' | 'tablet' | 'desktop';
}

function ImageComponent({ section, onUpdate, editorDevice }: ImageProps) {
  const settings = section.settings || {};
  const style = section.style || {};

  const imageUrl = (editorDevice === 'mobile' && settings.image_url_mobile) 
    ? settings.image_url_mobile 
    : settings.image_url;
  const linkUrl = settings.link_url;
  const imageWidth = settings.image_width || 'full';
  const imageRatio = settings.image_ratio || 'adapt';
  const imageFit = settings.image_fit || 'cover';
  const imagePosition = settings.image_position || 'center';
  const borderRadius = style.border?.border_radius || '0px';

  const getWidthClass = () => {
    switch (imageWidth) {
      case 'small': return 'max-w-xs';
      case 'medium': return 'max-w-md';
      case 'large': return 'max-w-xl';
      case 'full':
      default: return 'w-full';
    }
  };

  const getRatioClass = () => {
    switch (imageRatio) {
      case 'square': return 'aspect-square';
      case 'portrait': return 'aspect-[3/4]';
      case 'landscape': return 'aspect-[4/3]';
      case 'adapt':
      default: return ''; // Adapt to image content
    }
  };

  const content = (
    <div
      className={`relative bg-gray-100 flex items-center justify-center overflow-hidden ${getWidthClass()} ${getRatioClass()}`}
      style={{ borderRadius: borderRadius }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={settings.alt_text || 'תמונה'}
          className="w-full h-full"
          style={{ objectFit: imageFit as any, objectPosition: imagePosition }}
        />
      ) : (
        <HiPhotograph className="w-12 h-12 text-gray-300" />
      )}
    </div>
  );

  return (
    <div className="w-full flex justify-center"> {/* Center the image */}
      {linkUrl ? (
        <Link href={linkUrl} className="block">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}

export const Image = React.memo(ImageComponent, sectionPropsAreEqual);
