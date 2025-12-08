/**
 * Customizer Layout for Storefront
 * מציג את הסקשנים מהקסטומייזר בפרונט
 */

import React from 'react';
import { getPageLayout } from '@/lib/customizer/getPageConfig';
import { getStoreIdBySlug } from '@/lib/utils/store';
import { StorefrontSectionRenderer } from './StorefrontSectionRenderer';
import { NEW_YORK_TEMPLATE } from '@/lib/customizer/templates/new-york';

interface CustomizerLayoutProps {
  storeSlug: string;
  pageType?: string;
  pageHandle?: string;
  children?: React.ReactNode;
}

export async function CustomizerLayout({ 
  storeSlug, 
  pageType = 'home',
  pageHandle,
  children 
}: CustomizerLayoutProps) {
  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    // Fallback to old layout if store not found
    return <>{children}</>;
  }

  // Load page layout from customizer
  const pageLayout = await getPageLayout(storeId, pageType, pageHandle);
  
  let sections = [];
  if (pageLayout && pageLayout.sections && pageLayout.sections.length > 0) {
    sections = pageLayout.sections;
  } else {
    // Use default template if no custom layout exists
    sections = NEW_YORK_TEMPLATE.sections;
  }

  // Filter only header and footer for layout wrapper
  const headerSection = sections.find((s: any) => s.type === 'header' && s.visible !== false);
  const footerSection = sections.find((s: any) => s.type === 'footer' && s.visible !== false);
  
  // Get content sections (everything except header/footer) - only for home page
  // For other pages, we only show header/footer and let children render the content
  const contentSections = pageType === 'home' 
    ? sections.filter((s: any) => 
        s.type !== 'header' && s.type !== 'footer' && s.visible !== false
      )
    : [];

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      {/* Header from Customizer */}
      {headerSection && (
        <StorefrontSectionRenderer section={headerSection} />
      )}
      
      {/* Main Content */}
      <main className="flex-1">
        {/* Render content sections from customizer */}
        {contentSections.map((section: any) => (
          <StorefrontSectionRenderer key={section.id} section={section} />
        ))}
        
        {/* Page-specific content (children) */}
        {children}
      </main>

      {/* Footer from Customizer */}
      {footerSection && (
        <StorefrontSectionRenderer section={footerSection} />
      )}
    </div>
  );
}

