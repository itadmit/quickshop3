'use client';

import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { SectionRenderer } from './sections/SectionRenderer';
import { HiPencil, HiTrash, HiDocument } from 'react-icons/hi';

interface PreviewFrameProps {
  sections: SectionSettings[];
  selectedSectionId: string | null;
  device: 'desktop' | 'tablet' | 'mobile';
  zoom: number;
  showGrid: boolean;
  showOutlines: boolean;
  onSectionSelect: (sectionId: string | null) => void;
  onSectionUpdate: (sectionId: string, updates: Partial<SectionSettings>) => void;
  onSectionDelete?: (sectionId: string) => void;
  pageType?: string;
  sampleProduct?: any;
  sampleCollection?: any;
}

// Sections that belong in the product gallery column (left side on desktop)
const PRODUCT_GALLERY_SECTIONS = ['product_gallery'];

// Sections that belong in the product info column (right side on desktop)
const PRODUCT_INFO_SECTIONS = [
  'product_name', 
  'product_title',
  'product_price', 
  'product_variations',
  'product_variants',
  'product_add_to_cart'
];

// Full-width sections below the main product area
const PRODUCT_FULL_WIDTH_SECTIONS = [
  'product_description',
  'product_custom_fields',
  'product_reviews',
  'related_products',
  'product_recently_viewed',
  'recently_viewed'
];

function PreviewFrameComponent({
  sections,
  selectedSectionId,
  device,
  zoom,
  showGrid,
  showOutlines,
  onSectionSelect,
  onSectionUpdate,
  onSectionDelete,
  pageType = 'home',
  sampleProduct,
  sampleCollection
}: PreviewFrameProps) {
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [hoveredSectionId, setHoveredSectionId] = React.useState<string | null>(null);

  // Scroll to selected section
  useEffect(() => {
    if (selectedSectionId && sectionRefs.current[selectedSectionId]) {
      sectionRefs.current[selectedSectionId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [selectedSectionId]);

  const handleSectionClick = useCallback((sectionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onSectionSelect(sectionId);
  }, [onSectionSelect]);

  const handleCanvasClick = useCallback(() => {
    onSectionSelect(null);
  }, [onSectionSelect]);

  const getDeviceStyles = () => {
    switch (device) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      default:
        return 'w-full';
    }
  };

  // Categorize sections for product page layout
  const { headerSections, gallerySections, infoSections, fullWidthSections, footerSections } = useMemo(() => {
    if (pageType !== 'product') {
      return {
        headerSections: sections,
        gallerySections: [],
        infoSections: [],
        fullWidthSections: [],
        footerSections: []
      };
    }

    const header: SectionSettings[] = [];
    const gallery: SectionSettings[] = [];
    const info: SectionSettings[] = [];
    const fullWidth: SectionSettings[] = [];
    const footer: SectionSettings[] = [];

    sections.forEach(section => {
      if (section.type === 'header') {
        header.push(section);
      } else if (section.type === 'footer') {
        footer.push(section);
      } else if (PRODUCT_GALLERY_SECTIONS.includes(section.type)) {
        gallery.push(section);
      } else if (PRODUCT_INFO_SECTIONS.includes(section.type)) {
        info.push(section);
      } else if (PRODUCT_FULL_WIDTH_SECTIONS.includes(section.type)) {
        fullWidth.push(section);
      } else {
        // Any other sections go to full width
        fullWidth.push(section);
      }
    });

    return {
      headerSections: header,
      gallerySections: gallery,
      infoSections: info,
      fullWidthSections: fullWidth,
      footerSections: footer
    };
  }, [sections, pageType]);

  // Memoize onUpdate callback to prevent re-renders
  const handleSectionUpdate = useCallback((sectionId: string, updates: Partial<SectionSettings>) => {
    onSectionUpdate(sectionId, updates);
  }, [onSectionUpdate]);

  // Render a single section with controls
  const renderSection = useCallback((section: SectionSettings) => (
    <div
      key={section.id}
      ref={(el) => {
        sectionRefs.current[section.id] = el;
      }}
      className="relative group"
      onMouseEnter={() => setHoveredSectionId(section.id)}
      onMouseLeave={() => setHoveredSectionId(null)}
      onClick={(e) => handleSectionClick(section.id, e)}
    >
      {/* Section Content */}
      <SectionRenderer
        section={section}
        isSelected={selectedSectionId === section.id}
        onUpdate={(updates) => handleSectionUpdate(section.id, updates)}
        device={device}
        sampleProduct={sampleProduct}
        sampleCollection={sampleCollection}
      />

      {/* Overlay Border - Always on top */}
      <div
        className={`absolute inset-0 pointer-events-none transition-all duration-200 ${
          selectedSectionId === section.id
            ? 'ring-2 ring-gray-900 z-[100]'
            : hoveredSectionId === section.id
            ? 'ring-2 ring-gray-600 z-[90]'
            : showOutlines
            ? 'ring-1 ring-gray-200 z-[80]'
            : ''
        }`}
        style={{
          margin: selectedSectionId === section.id ? '-2px' : hoveredSectionId === section.id ? '-2px' : '0'
        }}
      />

      {/* Section Controls - Always visible when selected or hovered */}
      {(selectedSectionId === section.id || hoveredSectionId === section.id) && (
        <div className="absolute top-2 right-2 z-[100] pointer-events-auto">
          <div className="flex items-center space-x-1 rtl:space-x-reverse">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Edit action
              }}
              className="w-8 h-8 bg-gray-900 text-white rounded shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
              title="ערוך"
            >
              <HiPencil className="w-4 h-4 text-white" />
            </button>
            {!section.locked && onSectionDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSectionDelete(section.id);
                  onSectionSelect(null);
                }}
                className="w-8 h-8 bg-red-500 text-white rounded shadow-lg flex items-center justify-center hover:bg-red-600 transition-colors"
                title="מחק"
              >
                <HiTrash className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  ), [selectedSectionId, hoveredSectionId, showOutlines, device, sampleProduct, sampleCollection, handleSectionClick, handleSectionUpdate, onSectionDelete, onSectionSelect]);

  // Check if we should use product page layout
  const isProductPage = pageType === 'product';
  const isDesktopView = device === 'desktop';
  const useProductLayout = isProductPage && (gallerySections.length > 0 || infoSections.length > 0);

  return (
    <div className="h-full bg-gray-100 overflow-auto">
      <div className="min-h-full p-8">
        <div
          className={`bg-white shadow-lg mx-auto transition-all duration-300 ${getDeviceStyles()}`}
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center'
          }}
        >
          {/* Canvas Area */}
          <div
            className={`min-h-screen relative ${showGrid ? 'bg-grid' : ''}`}
            onClick={handleCanvasClick}
          >
            {/* Product Page Layout */}
            {useProductLayout ? (
              <>
                {/* Header */}
                {headerSections.map(renderSection)}

                {/* Main Product Area - 2 columns on desktop */}
                <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${
                  isDesktopView ? 'grid grid-cols-2 gap-8' : 'flex flex-col'
                }`}>
                  {/* Gallery Column (Left on desktop, order maintained) */}
                  <div className={`${isDesktopView ? 'sticky top-4 self-start' : ''}`}>
                    {gallerySections.map(renderSection)}
                  </div>

                  {/* Info Column (Right on desktop) */}
                  <div className="space-y-2">
                    {infoSections.map(renderSection)}
                  </div>
                </div>

                {/* Full Width Sections Below */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  {fullWidthSections.map(renderSection)}
                </div>

                {/* Footer */}
                {footerSections.map(renderSection)}
              </>
            ) : (
              /* Default Layout (Home page, etc.) */
              sections.map(renderSection)
            )}

            {/* Empty State */}
            {sections.length === 0 && (
              <div className="min-h-screen flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-6xl mb-4 text-gray-400">
                    <HiDocument className="w-24 h-24 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">העמוד ריק</h3>
                  <p className="text-sm">הוסף סקשנים כדי להתחיל לבנות את העמוד</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoize PreviewFrame to prevent re-renders when parent re-renders
export const PreviewFrame = React.memo(PreviewFrameComponent, (prevProps, nextProps) => {
  // Compare sections array - check if references changed
  const sectionsEqual = (
    prevProps.sections === nextProps.sections ||
    (
      prevProps.sections.length === nextProps.sections.length &&
      prevProps.sections.every((section, index) => section === nextProps.sections[index])
    )
  );
  
  // Compare other props
  const otherPropsEqual = (
    prevProps.selectedSectionId === nextProps.selectedSectionId &&
    prevProps.device === nextProps.device &&
    prevProps.zoom === nextProps.zoom &&
    prevProps.showGrid === nextProps.showGrid &&
    prevProps.showOutlines === nextProps.showOutlines &&
    prevProps.pageType === nextProps.pageType
  );
  
  return sectionsEqual && otherPropsEqual;
});