/**
 * Shared Store Layout
 * ההדר והפוטר נטענים פעם אחת ב-layout ונשארים קבועים בכל הניווט
 * רק התוכן (children) משתנה בין הדפים
 */

import React from 'react';
import { getPageLayout } from '@/lib/customizer/getPageConfig';
import { getStoreBySlug } from '@/lib/utils/store';
import { StorefrontSectionRenderer } from './StorefrontSectionRenderer';
import { NEW_YORK_TEMPLATE } from '@/lib/customizer/templates/new-york';
import { query } from '@/lib/db';

interface SharedStoreLayoutProps {
  storeSlug: string;
  storeId: number;
  children: React.ReactNode;
}

export async function SharedStoreLayout({ 
  storeSlug, 
  storeId,
  children 
}: SharedStoreLayoutProps) {
  // Load home page layout for header/footer (these are shared across all pages)
  const store = await getStoreBySlug(storeSlug);
  const homeLayout = await getPageLayout(storeId, 'home', undefined);
  
  let headerSection = null;
  let footerSection = null;
  
  if (homeLayout && homeLayout.sections && homeLayout.sections.length > 0) {
    headerSection = homeLayout.sections.find((s: any) => s.type === 'header' && s.visible !== false);
    footerSection = homeLayout.sections.find((s: any) => s.type === 'footer' && s.visible !== false);
  }
  
  // Fallback to default template if no header/footer found
  if (!headerSection) {
    headerSection = NEW_YORK_TEMPLATE.sections.find((s: any) => s.type === 'header');
  }
  if (!footerSection) {
    footerSection = NEW_YORK_TEMPLATE.sections.find((s: any) => s.type === 'footer');
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

  // Update header with store info and menu items
  if (headerSection && store) {
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

    headerSection = {
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
        currency_selector: {
          enabled: headerSection.settings?.currency_selector?.enabled ?? false
        }
      }
    };
  }

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      {/* Header - Shared across all pages, doesn't re-render on navigation */}
      {headerSection && (
        <StorefrontSectionRenderer 
          section={headerSection} 
          storeSlug={storeSlug}
          storeId={storeId}
        />
      )}
      
      {/* Main Content - Changes on navigation */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer - Shared across all pages, doesn't re-render on navigation */}
      {footerSection && (
        <StorefrontSectionRenderer 
          section={footerSection} 
          storeSlug={storeSlug}
        />
      )}
    </div>
  );
}

