'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiPhotograph } from 'react-icons/hi';

interface GalleryProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

export function Gallery({ section, onUpdate }: GalleryProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  const blocks = section.blocks || [];
  
  // Get image blocks
  const imageBlocks = blocks.filter(b => b.type === 'image');
  
  const itemsPerRow = settings.items_per_row || 3;

  const getGridCols = () => {
    switch (itemsPerRow) {
      case 2: return 'md:grid-cols-2';
      case 3: return 'md:grid-cols-3';
      case 4: return 'md:grid-cols-4';
      case 5: return 'md:grid-cols-5';
      case 6: return 'md:grid-cols-6';
      default: return 'md:grid-cols-3';
    }
  };

  // Title alignment
  const titleAlignClass = settings.title_align === 'left' ? 'text-left' : settings.title_align === 'center' ? 'text-center' : 'text-right';
  
  const fontFamily = style.typography?.font_family || '"Noto Sans Hebrew", sans-serif';
  const textColor = style.typography?.color || '#111827';

  return (
    <div className="w-full" style={{ fontFamily }}>
      <div className="container mx-auto px-4">
        {settings.title && (
          <h2 
            className={`text-3xl font-bold mb-12 ${titleAlignClass}`}
            style={{ color: textColor }}
          >
            {settings.title}
          </h2>
        )}

        {settings.display_type === 'carousel' ? (
          <div className="overflow-x-auto scrollbar-hide" style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
            <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
              {imageBlocks.length > 0 ? imageBlocks.map((block, idx) => {
                const cardWidth = `calc((100vw - 2rem) / ${Math.min(itemsPerRow, 4)})`;
                return (
                  <div
                    key={block.id || idx}
                    className="flex-shrink-0 group cursor-pointer"
                    style={{ 
                      width: cardWidth,
                      scrollSnapAlign: 'start'
                    }}
                  >
                    <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                      {block.content?.image_url ? (
                        <img 
                          src={block.content.image_url} 
                          alt={block.content.alt_text || 'Gallery image'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          <HiPhotograph className="w-12 h-12 opacity-20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center text-gray-400 py-12">
                  <HiPhotograph className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>אין תמונות בגלריה. הוסף תמונות דרך ההגדרות.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${getGridCols()} gap-4`}>
            {imageBlocks.length > 0 ? imageBlocks.map((block, idx) => (
              <div key={block.id || idx} className="group cursor-pointer">
                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                  {block.content?.image_url ? (
                    <img 
                      src={block.content.image_url} 
                      alt={block.content.alt_text || 'Gallery image'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <HiPhotograph className="w-12 h-12 opacity-20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center text-gray-400 py-12">
                <HiPhotograph className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>אין תמונות בגלריה. הוסף תמונות דרך ההגדרות.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

