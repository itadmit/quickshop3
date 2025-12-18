'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiPhotograph, HiPlay } from 'react-icons/hi';

interface CollageProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  editorDevice?: 'desktop' | 'tablet' | 'mobile';
}

export function Collage({ section, onUpdate, editorDevice }: CollageProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  const blocks = section.blocks || [];

  // Get settings
  const title = settings.title || '';
  const layout = settings.layout || 'left-large'; // left-large, right-large, grid
  const gap = settings.gap || 'medium';
  const imageBorderRadius = settings.image_border_radius || '8px';
  const titleAlign = settings.title_align || 'center';

  // Determine if mobile view
  const isMobileView = editorDevice === 'mobile' || editorDevice === 'tablet';

  // Typography
  const fontFamily = style.typography?.font_family || '"Noto Sans Hebrew", sans-serif';
  const textColor = style.typography?.color || '#111827';

  // Gap classes
  const gapClasses = {
    small: 'gap-2',
    medium: 'gap-4',
    large: 'gap-6',
  }[gap] || 'gap-4';

  // Title alignment
  const titleAlignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[titleAlign] || 'text-center';

  // Render a single media block
  const renderMediaBlock = (block: any, index: number, isLarge: boolean = false) => {
    const hasImage = block?.content?.image_url;
    const hasVideo = block?.content?.video_url;
    const heading = block?.content?.heading;
    const subheading = block?.content?.subheading;
    const buttonText = block?.content?.button_text;
    const buttonUrl = block?.content?.button_url;

    return (
      <div 
        key={block?.id || index}
        className={`relative overflow-hidden group ${isLarge ? 'row-span-2' : ''}`}
        style={{ borderRadius: imageBorderRadius }}
      >
        {/* Background Image/Video */}
        {hasVideo ? (
          <video 
            src={block.content.video_url}
            className="w-full h-full object-cover absolute inset-0"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : hasImage ? (
          <img 
            src={block.content.image_url}
            alt={heading || `תמונה ${index + 1}`}
            className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <HiPhotograph className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />

        {/* Content */}
        {(heading || subheading || buttonText) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 text-white">
            {hasVideo && !heading && !buttonText && (
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <HiPlay className="w-8 h-8" />
              </div>
            )}
            {heading && (
              <h3 className="text-xl md:text-2xl font-bold mb-2 drop-shadow-lg">
                {heading}
              </h3>
            )}
            {subheading && (
              <p className="text-sm md:text-base mb-4 drop-shadow-md">
                {subheading}
              </p>
            )}
            {buttonText && (
              <a 
                href={buttonUrl || '#'}
                className="px-6 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-gray-100 transition-colors"
              >
                {buttonText}
              </a>
            )}
          </div>
        )}
      </div>
    );
  };

  // Get blocks or placeholders
  const getBlocksForLayout = () => {
    const needed = layout === 'grid' ? 4 : 3;
    const result = [];
    for (let i = 0; i < needed; i++) {
      result.push(blocks[i] || { id: `placeholder-${i}`, content: {} });
    }
    return result;
  };

  const displayBlocks = getBlocksForLayout();

  return (
    <div className="w-full py-12 md:py-16" style={{ fontFamily }}>
      <div className="container mx-auto px-4">
        {/* Section Title */}
        {title && (
          <h2 
            className={`text-2xl md:text-3xl font-bold mb-8 md:mb-12 ${titleAlignClasses}`}
            style={{ color: textColor }}
          >
            {title}
          </h2>
        )}

        {/* Collage Grid */}
        {isMobileView ? (
          // Mobile: Stacked layout
          <div className={`grid grid-cols-1 ${gapClasses}`}>
            {displayBlocks.map((block, index) => (
              <div key={block.id} className="aspect-[4/3]">
                {renderMediaBlock(block, index)}
              </div>
            ))}
          </div>
        ) : layout === 'grid' ? (
          // Grid layout: 2x2
          <div className={`grid grid-cols-2 ${gapClasses}`}>
            {displayBlocks.slice(0, 4).map((block, index) => (
              <div key={block.id} className="aspect-[4/3]">
                {renderMediaBlock(block, index)}
              </div>
            ))}
          </div>
        ) : layout === 'right-large' ? (
          // Right large layout (RTL: large on left visually)
          <div className={`grid grid-cols-2 grid-rows-2 ${gapClasses}`} style={{ height: '500px' }}>
            {renderMediaBlock(displayBlocks[0], 0)}
            {renderMediaBlock(displayBlocks[1], 1, true)}
            {renderMediaBlock(displayBlocks[2], 2)}
          </div>
        ) : (
          // Left large layout (RTL: large on right visually) - Default
          <div className={`grid grid-cols-2 grid-rows-2 ${gapClasses}`} style={{ height: '500px' }}>
            {renderMediaBlock(displayBlocks[0], 0, true)}
            {renderMediaBlock(displayBlocks[1], 1)}
            {renderMediaBlock(displayBlocks[2], 2)}
          </div>
        )}
      </div>
    </div>
  );
}

