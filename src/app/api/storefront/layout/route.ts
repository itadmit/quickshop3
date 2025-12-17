/**
 * API Route: Get Page Layout for Storefront
 * מחזיר את הסקשנים של דף מסוים לפי storeSlug, pageType ו-pageHandle
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPageLayout } from '@/lib/customizer/getPageConfig';
import { getStoreIdBySlug, getStoreBySlug } from '@/lib/utils/store';
import { NEW_YORK_TEMPLATE, getDefaultSectionsForPage } from '@/lib/customizer/templates/new-york';
import { query } from '@/lib/db';
import { getProductByHandle, getProductsList } from '@/lib/storefront/queries';
import { getCollectionByHandle } from '@/lib/storefront/queries';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const storeSlug = searchParams.get('storeSlug');
    const pageType = searchParams.get('pageType') || 'home';
    const pageHandle = searchParams.get('pageHandle') || undefined;

    if (!storeSlug) {
      return NextResponse.json({ error: 'storeSlug is required' }, { status: 400 });
    }

    const storeId = await getStoreIdBySlug(storeSlug);
    
    if (!storeId) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Load store information
    const store = await getStoreBySlug(storeSlug);

    // Load page layout from customizer
    // For product/collection pages, pass the handle to find specific or generic layout
    const pageLayout = await getPageLayout(storeId, pageType, pageHandle || undefined);
    
    let sections = [];
    if (pageLayout && pageLayout.sections && pageLayout.sections.length > 0) {
      sections = pageLayout.sections;
    } else {
      sections = getDefaultSectionsForPage(pageType);
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

    // Load product/collection data if needed
    let product = null;
    let collection = null;
    let products: any[] = [];

    if (pageType === 'product' && pageHandle) {
      try {
        product = await getProductByHandle(pageHandle, storeId);
      } catch (error) {
        console.error('Error loading product for customizer:', error);
      }
    }

    if (pageType === 'collection' && pageHandle) {
      try {
        if (pageHandle === 'all') {
          products = await getProductsList(storeId, { limit: 20, offset: 0 });
          collection = {
            id: 0,
            title: 'כל המוצרים',
            handle: 'all',
            description: '',
            image_url: null,
            product_count: products.length
          };
        } else {
          const collectionData = await getCollectionByHandle(pageHandle, storeId, { limit: 20, offset: 0 });
          collection = collectionData.collection;
          products = collectionData.products || [];
        }
      } catch (error) {
        console.error('Error loading collection for customizer:', error);
      }
    }

    return NextResponse.json({
      sections,
      store,
      storeId,
      product,
      collection,
      products,
    });
  } catch (error) {
    console.error('Error loading page layout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

