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
import { getCached } from '@/lib/cache';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const storeSlug = searchParams.get('storeSlug');
    const pageType = searchParams.get('pageType') || 'home';
    const pageHandle = searchParams.get('pageHandle') || undefined;
    
    // Decode the handle if it's URL encoded
    const decodedPageHandle = pageHandle ? decodeURIComponent(pageHandle) : undefined;

    console.log(`[Layout API] Start - ${pageType} ${decodedPageHandle || ''}`);

    if (!storeSlug) {
      return NextResponse.json({ error: 'storeSlug is required' }, { status: 400 });
    }

    // ✅ אופטימיזציה: קרא את ה-store פעם אחת בלבד (עם cache)
    const store = await getStoreBySlug(storeSlug);
    console.log(`[Layout API] Got store (${Date.now() - startTime}ms)`);
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const storeId = store.id;

    // ✅ אופטימיזציה: טען את הכל במקביל!
    const layoutStartTime = Date.now();
    
    // Prepare all parallel promises
    const promises: Promise<any>[] = [];
    
    // Always need page layout
    promises.push(getPageLayout(storeId, pageType, decodedPageHandle));
    
    // Need home layout only if not home page (for header/footer)
    if (pageType !== 'home') {
      promises.push(getPageLayout(storeId, 'home', undefined));
    } else {
      promises.push(Promise.resolve(null));
    }
    
    // Load data based on page type (in parallel with layouts)
    if (pageType === 'product' && decodedPageHandle) {
      promises.push(getProductByHandle(decodedPageHandle, storeId));
    } else if ((pageType === 'collection' || pageType === 'category') && decodedPageHandle) {
      if (decodedPageHandle === 'all') {
        promises.push(getProductsList(storeId, { limit: 20, offset: 0 }));
      } else {
        promises.push(getCollectionByHandle(decodedPageHandle, storeId, { limit: 20, offset: 0 }));
      }
    } else if (pageType === 'products') {
      promises.push(getProductsList(storeId, { limit: 20, offset: 0 }));
    } else {
      promises.push(Promise.resolve(null));
    }
    
    // Execute all in parallel
    const [pageLayout, homeLayout, pageData] = await Promise.all(promises);
    
    console.log(`[Layout API] Got all data (${Date.now() - layoutStartTime}ms, total: ${Date.now() - startTime}ms)`);
    
    // If no layout found for 'other' type pages, use home layout
    if (!pageLayout && pageType === 'other') {
      pageLayout = homeLayout;
    }
    
    let sections = [];
    if (pageLayout && pageLayout.sections && pageLayout.sections.length > 0) {
      sections = pageLayout.sections;
    } else {
      sections = getDefaultSectionsForPage(pageType);
    }

    // ✅ תמיד להשתמש בהדר והפוטר מדף הבית (אם קיים)
    if (homeLayout && homeLayout.sections && homeLayout.sections.length > 0) {
      const homeHeaderSection = homeLayout.sections.find((s: any) => s.type === 'header' && s.visible !== false);
      const homeFooterSection = homeLayout.sections.find((s: any) => s.type === 'footer' && s.visible !== false);
      
      // החלפת ההדר והפוטר בהדר והפוטר מדף הבית
      if (homeHeaderSection) {
        const currentHeaderIndex = sections.findIndex((s: any) => s.type === 'header');
        if (currentHeaderIndex !== -1) {
          sections[currentHeaderIndex] = homeHeaderSection;
        } else {
          sections.unshift(homeHeaderSection);
        }
      }
      
      if (homeFooterSection) {
        const currentFooterIndex = sections.findIndex((s: any) => s.type === 'footer');
        if (currentFooterIndex !== -1) {
          sections[currentFooterIndex] = homeFooterSection;
        } else {
          sections.push(homeFooterSection);
        }
      }
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

    // ✅ עדכון ההדר והפוטר עם פרטי החנות - תמיד להשתמש בהדר מהקסטומייזר של דף הבית
    if (store) {
      const headerIndex = sections.findIndex((s: any) => s.type === 'header' && s.visible !== false);
      const headerSection = headerIndex !== -1 ? sections[headerIndex] : null;
      
      if (headerSection) {
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
        // ✅ אם אין הדר - ליצור הדר ברירת מחדל מהתבנית
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
      
      // ✅ וידוא שיש פוטר גם כן
      const footerIndex = sections.findIndex((s: any) => s.type === 'footer' && s.visible !== false);
      if (footerIndex === -1) {
        const defaultFooter = NEW_YORK_TEMPLATE.sections.find((s: any) => s.type === 'footer');
        if (defaultFooter) {
          sections.push(defaultFooter);
        }
      }
    }

    // ✅ השתמש בנתונים שכבר נטענו במקביל
    let product = null;
    let collection = null;
    let products: any[] = [];

    if (pageType === 'product' && decodedPageHandle && pageData) {
      product = pageData;
    }

    if ((pageType === 'collection' || pageType === 'category') && decodedPageHandle && pageData) {
      if (decodedPageHandle === 'all') {
        products = pageData || [];
        collection = {
          id: 0,
          title: 'כל המוצרים',
          handle: 'all',
          description: '',
          image_url: null,
          product_count: products.length
        };
      } else {
        collection = pageData?.collection;
        products = pageData?.products || [];
      }
    }

    if (pageType === 'products' && pageData) {
      products = pageData || [];
      collection = {
        id: 0,
        title: 'כל המוצרים',
        handle: 'all',
        description: '',
        image_url: null,
        product_count: products.length
      };
    }

    // ✅ תמיכה בדף כל הקטגוריות
    if (pageType === 'categories') {
      // אין צורך לטעון נתונים מיוחדים - הסקשן featured_collections יטען את הקטגוריות
    }

    console.log(`[Layout API] Completed in ${Date.now() - startTime}ms`);

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

