'use client';

import React from 'react';
import { SectionSettings, BlockSettings } from '@/lib/customizer/types';
import { HiPhotograph } from 'react-icons/hi';
import Link from 'next/link';
import { sectionPropsAreEqual } from './sectionMemoUtils';

interface CollageProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

function CollageComponent({ section, onUpdate }: CollageProps) {
  const settings = section.settings || {};
  const blocks = section.blocks || [];
  
  // Settings
  const title = settings.title || '';
  const titleAlign = settings.title_align || 'center';
  const layout = settings.layout || 'left-large'; // left-large, right-large, equal
  const gap = settings.gap || 'medium';
  const imageBorderRadius = settings.image_border_radius || '8px';
  
  // Text alignment mapping
  const textAlignClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };
  
  // Gap mapping
  const gapClasses: Record<string, string> = {
    small: 'gap-2',
    medium: 'gap-4',
    large: 'gap-6',
  };

  // Placeholder image component
  const PlaceholderImage = ({ className = '' }: { className?: string }) => (
    <div 
      className={`bg-gray-100 flex items-center justify-center ${className}`}
      style={{ borderRadius: imageBorderRadius }}
    >
      <HiPhotograph className="w-12 h-12 text-gray-300" />
    </div>
  );

  // Image component
  const CollageImage = ({ block, className = '' }: { block?: BlockSettings; className?: string }) => {
    const imageUrl = block?.content?.image_url;
    const linkUrl = block?.content?.link_url;
    
    const imageElement = imageUrl ? (
      <img 
        src={imageUrl} 
        alt={block?.content?.title || ''} 
        className={`w-full h-full object-cover ${className}`}
        style={{ borderRadius: imageBorderRadius }}
      />
    ) : (
      <PlaceholderImage className={className} />
    );
    
    if (linkUrl) {
      return (
        <Link href={linkUrl} className={`block w-full h-full overflow-hidden ${className}`} style={{ borderRadius: imageBorderRadius }}>
          {imageElement}
        </Link>
      );
    }
    
    return (
      <div className={`w-full h-full overflow-hidden ${className}`} style={{ borderRadius: imageBorderRadius }}>
        {imageElement}
      </div>
    );
  };

  // If no blocks, show placeholder
  if (blocks.length === 0) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {title && (
            <h2 className={`text-2xl font-bold mb-8 ${textAlignClasses[titleAlign]}`}>
              {title}
            </h2>
          )}
          <div className={`grid grid-cols-2 md:grid-cols-3 ${gapClasses[gap]} h-[400px]`}>
            <PlaceholderImage className="col-span-1 md:row-span-2 h-full min-h-[200px]" />
            <PlaceholderImage className="h-full min-h-[100px]" />
            <PlaceholderImage className="h-full min-h-[100px]" />
          </div>
          <p className="text-center text-gray-500 mt-4 text-sm">הוסף תמונות דרך סרגל העריכה</p>
        </div>
      </div>
    );
  }

  // Render based on layout
  const renderLayout = () => {
    switch (layout) {
      case 'left-large':
        return (
          <div className={`grid grid-cols-2 md:grid-cols-3 ${gapClasses[gap]}`} style={{ minHeight: '400px' }}>
            <CollageImage block={blocks[0]} className="col-span-1 md:row-span-2 h-full min-h-[300px]" />
            <CollageImage block={blocks[1]} className="h-full min-h-[140px]" />
            <CollageImage block={blocks[2]} className="h-full min-h-[140px]" />
            {blocks[3] && <CollageImage block={blocks[3]} className="h-full min-h-[140px]" />}
            {blocks[4] && <CollageImage block={blocks[4]} className="h-full min-h-[140px]" />}
          </div>
        );
      
      case 'right-large':
        return (
          <div className={`grid grid-cols-2 md:grid-cols-3 ${gapClasses[gap]}`} style={{ minHeight: '400px' }}>
            <CollageImage block={blocks[1]} className="h-full min-h-[140px]" />
            <CollageImage block={blocks[2]} className="h-full min-h-[140px]" />
            <CollageImage block={blocks[0]} className="col-span-1 md:row-span-2 h-full min-h-[300px]" />
            {blocks[3] && <CollageImage block={blocks[3]} className="h-full min-h-[140px]" />}
            {blocks[4] && <CollageImage block={blocks[4]} className="h-full min-h-[140px]" />}
          </div>
        );
      
      case 'equal':
      default:
        return (
          <div className={`grid grid-cols-2 md:grid-cols-3 ${gapClasses[gap]}`}>
            {blocks.map((block, index) => (
              <CollageImage key={block.id || index} block={block} className="aspect-square" />
            ))}
          </div>
        );
    }
  };

  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {title && (
          <h2 className={`text-2xl font-bold mb-8 ${textAlignClasses[titleAlign]}`}>
            {title}
          </h2>
        )}
        {renderLayout()}
      </div>
    </div>
  );
}

export const Collage = React.memo(CollageComponent, sectionPropsAreEqual);
