/**
 * Storefront - Dynamic Section Renderer
 * רינדור דינמי של סקשנים לפי הגדרות מהקסטומייזר
 */

import dynamic from 'next/dynamic';
import { SectionConfig } from '@/lib/customizer/types';

// Empty component for fallback
const EmptyComponent = () => null;

// Helper function to safely import components
const safeImport = (importFn: () => Promise<any>, componentName?: string) => {
  return dynamic(
    () =>
      importFn()
        .then((m) => {
          if (componentName && m[componentName]) {
            return { default: m[componentName] };
          }
          return m;
        })
        .catch(() => ({ default: EmptyComponent }))
  );
};

// Lazy load sections for performance
const SECTION_COMPONENTS: Record<string, any> = {
  slideshow: safeImport(() => import('./sections/Slideshow'), 'Slideshow'),
  collection_list: safeImport(() => import('./sections/CollectionList'), 'CollectionList'),
  rich_text: safeImport(() => import('./sections/RichText'), 'RichText'),
  announcement_bar: safeImport(() => import('./sections/AnnouncementBar'), 'AnnouncementBar'),
  custom_html: safeImport(() => import('./sections/CustomHTML'), 'CustomHTML'),
  featured_product: safeImport(() => import('./sections/FeaturedProduct'), 'FeaturedProduct'),
  product_grid: safeImport(() => import('./sections/ProductGrid'), 'ProductGrid'),
  image_with_text: safeImport(() => import('./sections/ImageWithText'), 'ImageWithText'),
  // Placeholders for future sections
  featured_collection: dynamic(() => Promise.resolve({ default: EmptyComponent })),
  new_arrivals: dynamic(() => Promise.resolve({ default: EmptyComponent })),
  best_sellers: dynamic(() => Promise.resolve({ default: EmptyComponent })),
  image_with_text_overlay: dynamic(() => Promise.resolve({ default: EmptyComponent })),
  video: dynamic(() => Promise.resolve({ default: EmptyComponent })),
  testimonials: dynamic(() => Promise.resolve({ default: EmptyComponent })),
  faq: dynamic(() => Promise.resolve({ default: EmptyComponent })),
  newsletter: dynamic(() => Promise.resolve({ default: EmptyComponent })),
  trust_badges: dynamic(() => Promise.resolve({ default: EmptyComponent })),
  footer: safeImport(() => import('./StorefrontFooter')),
  header: safeImport(() => import('./StorefrontHeader')),
};

interface DynamicSectionProps {
  section: SectionConfig;
  globalSettings?: any;
}

export function DynamicSection({ section, globalSettings }: DynamicSectionProps) {
  const Component = SECTION_COMPONENTS[section.type];

  if (!Component) {
    console.warn(`Unknown section type: ${section.type}`);
    return null;
  }

  return (
    <section
      className={`section-${section.type} ${section.custom_classes || ''}`}
      data-section-id={section.type}
    >
      <Component
        settings={section.settings}
        blocks={section.blocks}
        globalSettings={globalSettings}
      />
    </section>
  );
}
