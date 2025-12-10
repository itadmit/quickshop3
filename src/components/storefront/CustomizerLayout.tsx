/**
 * Customizer Layout for Storefront
 * מציג את הסקשנים מהקסטומייזר בפרונט
 */

import React from 'react';
import { getPageLayout } from '@/lib/customizer/getPageConfig';
import { getStoreIdBySlug, getStoreBySlug } from '@/lib/utils/store';
import { StorefrontSectionRenderer } from './StorefrontSectionRenderer';
import { NEW_YORK_TEMPLATE } from '@/lib/customizer/templates/new-york';
import { query } from '@/lib/db';

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

  // Load store information (name and logo)
  const store = await getStoreBySlug(storeSlug);

  // Load page layout from customizer
  const pageLayout = await getPageLayout(storeId, pageType, pageHandle);
  
  let sections = [];
  if (pageLayout && pageLayout.sections && pageLayout.sections.length > 0) {
    sections = pageLayout.sections;
  } else {
    // Use default template if no custom layout exists
    sections = NEW_YORK_TEMPLATE.sections;
  }

  // Helper function to load menu items from database
  const loadMenuItems = async (menuId: number | null | undefined) => {
    if (!menuId || !storeId) return null;
    try {
      const items = await query(
        `SELECT * FROM navigation_menu_items WHERE menu_id = $1 ORDER BY position`,
        [menuId]
      );
      return items.map((item: any) => ({
        label: item.title || item.label || '',
        url: item.url || ''
      }));
    } catch (error) {
      console.error('Error loading menu items:', error);
      return null;
    }
  };

  // Update header section with store name, logo, and navigation menus
  if (store) {
    const headerIndex = sections.findIndex((s: any) => s.type === 'header' && s.visible !== false);
    if (headerIndex !== -1) {
      const headerSection = sections[headerIndex];
      const navigationSettings = headerSection.settings?.navigation || {};
      
      // Load desktop menu items if menu_desktop is set
      let desktopMenuItems = navigationSettings.menu_items || [];
      if (navigationSettings.menu_desktop) {
        const loadedItems = await loadMenuItems(navigationSettings.menu_desktop);
        if (loadedItems) {
          desktopMenuItems = loadedItems;
        }
      }

      // Load mobile menu items if menu_mobile is set
      let mobileMenuItems = navigationSettings.menu_items_mobile || desktopMenuItems;
      if (navigationSettings.menu_mobile) {
        const loadedItems = await loadMenuItems(navigationSettings.menu_mobile);
        if (loadedItems) {
          mobileMenuItems = loadedItems;
        }
      }

      // Update existing header section
      sections[headerIndex] = {
        ...headerSection,
        settings: {
          ...headerSection.settings,
          logo: {
            ...headerSection.settings?.logo,
            text: store.name || headerSection.settings?.logo?.text || 'החנות שלי',
            image_url: store.logo || headerSection.settings?.logo?.image_url || null
          },
          navigation: {
            ...navigationSettings,
            menu_items: desktopMenuItems,
            menu_items_mobile: mobileMenuItems
          },
          // Ensure currency_selector defaults to false if not set
          currency_selector: {
            enabled: headerSection.settings?.currency_selector?.enabled ?? false
          }
        }
      };
    } else {
      // Create header section if it doesn't exist
      const defaultHeader = NEW_YORK_TEMPLATE.sections.find((s: any) => s.type === 'header');
      if (defaultHeader) {
        sections.unshift({
          ...defaultHeader,
          settings: {
            ...defaultHeader.settings,
            logo: {
              ...defaultHeader.settings?.logo,
              text: store.name || defaultHeader.settings?.logo?.text || 'החנות שלי',
              image_url: store.logo || defaultHeader.settings?.logo?.image_url || null
            }
          }
        });
      }
    }
  }

  // Filter only header and footer for layout wrapper
  const headerSection = sections.find((s: any) => s.type === 'header' && s.visible !== false);
  const footerSection = sections.find((s: any) => s.type === 'footer' && s.visible !== false);
  
  // Get content sections (everything except header/footer) - only for home page
  // For other pages (product, category, etc.), we only show header/footer and let children render the content
  // This ensures that product/category pages don't show customizer content sections
  const contentSections = (pageType === 'home' || pageType === undefined) 
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

