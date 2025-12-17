'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PreviewFrame } from './PreviewFrame';
import { Sidebar } from './Sidebar';
import { Header, DeviceType } from './Header';
import { SettingsAndStylePanel } from './SettingsAndStylePanel';
import { ElementsSidebar } from './ElementsSidebar';
import { TemplatesModal } from './TemplatesModal';
import { GeneralSettingsModal } from './GeneralSettingsModal';
import { NEW_YORK_TEMPLATE, getDefaultSectionsForPage } from '@/lib/customizer/templates/new-york';
import { EditorState, SectionSettings, PageType } from '@/lib/customizer/types';
import { getSectionName } from '@/lib/customizer/sectionNames';
import { DEMO_PRODUCT, DEMO_COLLECTION, DEMO_COLLECTION_PRODUCTS } from '@/lib/customizer/demoData';
import { HiCheckCircle, HiXCircle } from 'react-icons/hi';

// Toast Component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-rose-50 border border-rose-200'
      }`}>
        {type === 'success' ? (
          <HiCheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <HiXCircle className="w-5 h-5 text-rose-400" />
        )}
        <span className={`text-sm font-medium ${type === 'success' ? 'text-green-800' : 'text-rose-800'}`}>
          {message}
        </span>
      </div>
    </div>
  );
}

export function CustomizerLayout() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [editorState, setEditorState] = useState<EditorState>({
    device: 'desktop',
    zoom: 100,
    showGrid: false,
    showOutlines: false
  });

  const [pageSections, setPageSections] = useState<SectionSettings[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [storeSlug, setStoreSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isGeneralSettingsModalOpen, setIsGeneralSettingsModalOpen] = useState(false);
  const [currentPageType, setCurrentPageType] = useState<PageType>('home');
  const [currentPageHandle, setCurrentPageHandle] = useState<string | null>(null);
  
  // Sample product for product page preview (start with demo data)
  const [sampleProduct, setSampleProduct] = useState<any>(DEMO_PRODUCT);
  // Sample collection for collection page preview (start with demo data)
  const [sampleCollection, setSampleCollection] = useState<any>(DEMO_COLLECTION);
  
  // Store sections for each page type to preserve changes when switching
  const [pageSectionsCache, setPageSectionsCache] = useState<Record<PageType, SectionSettings[]>>({
    home: [],
    product: [],
    collection: [],
    cart: [],
    checkout: [],
    page: []
  });

  // Load initial page data from URL params or default to 'home'
  useEffect(() => {
    const pageTypeParam = searchParams.get('pageType') as PageType | null;
    const pageHandleParam = searchParams.get('pageHandle');
    
    const initialPageType = pageTypeParam || 'home';
    const initialPageHandle = pageHandleParam || null;
    
    setCurrentPageHandle(initialPageHandle);
    loadPageData(initialPageType, initialPageHandle);
  }, [searchParams]);

  const loadPageData = useCallback(async (pageType: PageType = 'home', pageHandle: string | null = null) => {
    try {
      setIsLoading(true);
      
      // Check if we have cached sections for this page type (only if no specific handle)
      if (!pageHandle && pageSectionsCache[pageType] && pageSectionsCache[pageType].length > 0) {
        setPageSections(pageSectionsCache[pageType]);
        setCurrentPageType(pageType);
        setIsLoading(false);
        return;
      }
      
      // Build URL with optional pageHandle
      let apiUrl = `/api/customizer/pages?pageType=${pageType}`;
      if (pageHandle) {
        apiUrl += `&handle=${encodeURIComponent(pageHandle)}`;
      }
      
      const response = await fetch(apiUrl);
      const data = await response.json();

      let sections: SectionSettings[] = [];
      if (data.sections && data.sections.length > 0) {
        sections = data.sections;
      } else {
        // Load default sections for this page type from New York template
        sections = getDefaultSectionsForPage(pageType);
      }

      // Get store info and collections from API response
      const storeName = data.store?.name || 'החנות שלי';
      const storeLogo = data.store?.logo || null;
      const collections = data.collections || [];
      
      // For product page preview - use real product if available, otherwise demo
      if (pageType === 'product') {
        if (pageHandle && data.store?.slug) {
          // Load real product from API
          try {
            const productResponse = await fetch(`/api/storefront/products?handle=${encodeURIComponent(pageHandle)}&storeSlug=${data.store.slug}`);
            if (productResponse.ok) {
              const productData = await productResponse.json();
              if (productData.product) {
                setSampleProduct(productData.product);
              } else {
                setSampleProduct(DEMO_PRODUCT);
              }
            } else {
              setSampleProduct(DEMO_PRODUCT);
            }
          } catch (error) {
            console.error('Error loading product for customizer:', error);
            setSampleProduct(DEMO_PRODUCT);
          }
        } else {
          setSampleProduct(DEMO_PRODUCT);
        }
      }
      
      // For collection page preview - use real collection if available, otherwise demo
      if (pageType === 'collection') {
        if (pageHandle && data.store?.slug) {
          // Load real collection from API
          try {
            const collectionResponse = await fetch(`/api/storefront/collections?handle=${encodeURIComponent(pageHandle)}&storeSlug=${data.store.slug}`);
            if (collectionResponse.ok) {
              const collectionData = await collectionResponse.json();
              if (collectionData.collection) {
                setSampleCollection(collectionData.collection);
              } else {
                setSampleCollection(DEMO_COLLECTION);
              }
            } else {
              setSampleCollection(DEMO_COLLECTION);
            }
          } catch (error) {
            console.error('Error loading collection for customizer:', error);
            setSampleCollection(DEMO_COLLECTION);
          }
        } else {
          setSampleCollection(DEMO_COLLECTION);
        }
      }
      
      // Store the store slug for preview
      if (data.store?.slug) {
        setStoreSlug(data.store.slug);
      }

      // Ensure header and footer are always present and locked
      const hasHeader = sections.some(s => s.type === 'header');
      const hasFooter = sections.some(s => s.type === 'footer');

      // Add or update header with store data
      if (!hasHeader) {
        const headerSection: SectionSettings = {
          id: 'header-fixed',
          type: 'header',
          name: 'כותרת עליונה',
          visible: true,
          order: 0,
          locked: true,
          blocks: [],
          style: {},
          settings: {
            logo: {
              text: storeName,
              image_url: storeLogo
            },
            navigation: {
              menu_items: [
                { label: 'בית', url: '/' },
                ...collections.slice(0, 5).map((col: any) => ({
                  label: col.name,
                  url: `/categories/${col.handle}`
                })),
                { label: 'אודות', url: '/pages/about' },
                { label: 'צור קשר', url: '/pages/contact' }
              ]
            },
            search: {
              enabled: true,
              placeholder: 'חפש מוצרים...'
            },
            cart: {
              enabled: true
            },
            currency_selector: {
              enabled: false
            },
            user_account: {
              enabled: true
            }
          }
        };
        sections.unshift(headerSection);
      } else {
        // Update existing header with store data
        const headerIndex = sections.findIndex(s => s.type === 'header');
        if (headerIndex >= 0) {
          sections[headerIndex].locked = true;
          sections[headerIndex].name = 'כותרת עליונה';
          
          // Always update logo with store data (override template defaults)
          sections[headerIndex].settings = {
            ...sections[headerIndex].settings,
            logo: {
              text: storeName,
              image_url: storeLogo || sections[headerIndex].settings?.logo?.image_url || null
            },
            navigation: {
              menu_items: [
                { label: 'בית', url: '/' },
                ...collections.slice(0, 5).map((col: any) => ({
                  label: col.name,
                  url: `/categories/${col.handle}`
                })),
                { label: 'אודות', url: '/pages/about' },
                { label: 'צור קשר', url: '/pages/contact' }
              ]
            },
            search: sections[headerIndex].settings?.search || { enabled: true, placeholder: 'חפש מוצרים...' },
            cart: sections[headerIndex].settings?.cart || { enabled: true },
            user_account: sections[headerIndex].settings?.user_account || { enabled: true }
          };
        }
      }

      // Add or update footer
      if (!hasFooter) {
        // Try to get default footer menu via API
        let footerMenuId = null;
        try {
          const menuResponse = await fetch('/api/navigation?position=footer&limit=1');
          if (menuResponse.ok) {
            const menuData = await menuResponse.json();
            if (menuData.navigation_menus && menuData.navigation_menus.length > 0) {
              footerMenuId = menuData.navigation_menus[0].id;
            }
          }
        } catch (error) {
          console.error('Error loading footer menu:', error);
        }

        const footerSection: SectionSettings = {
          id: 'footer-fixed',
          type: 'footer',
          name: 'כותרת תחתונה',
          visible: true,
          order: sections.length,
          locked: true,
          blocks: [],
          style: {},
          settings: {
            columns_count: 4,
            columns: [
              {
                type: 'menu',
                title: 'חברה',
                menu_id: footerMenuId,
                text: '',
                image_url: '',
                newsletter_title: '',
                newsletter_content: '',
                newsletter_button_bg: '#000000',
                newsletter_button_text: '#FFFFFF'
              },
              {
                type: 'menu',
                title: 'מוצרים',
                menu_id: footerMenuId,
                text: '',
                image_url: '',
                newsletter_title: '',
                newsletter_content: '',
                newsletter_button_bg: '#000000',
                newsletter_button_text: '#FFFFFF'
              },
              {
                type: 'menu',
                title: 'שירות לקוחות',
                menu_id: footerMenuId,
                text: '',
                image_url: '',
                newsletter_title: '',
                newsletter_content: '',
                newsletter_button_bg: '#000000',
                newsletter_button_text: '#FFFFFF'
              },
              {
                type: 'newsletter',
                title: '',
                menu_id: null,
                text: '',
                image_url: '',
                newsletter_title: 'הישאר מעודכן',
                newsletter_content: 'הירשם לניוזלטר שלנו וקבל עדכונים על מוצרים חדשים והנחות מיוחדות',
                newsletter_button_bg: '#000000',
                newsletter_button_text: '#FFFFFF'
              }
            ],
            social_links: {
              enabled: true,
              links: [
                { platform: 'facebook', url: 'https://facebook.com' },
                { platform: 'instagram', url: 'https://instagram.com' },
                { platform: 'twitter', url: 'https://twitter.com' }
              ]
            },
            currency_selector: {
              enabled: false
            },
            copyright: `מופעל על ידי Quick Shop - פלטפורמה להקמת חנויות וירטואליות © ${new Date().getFullYear()}`
          }
        };
        sections.push(footerSection);
      } else {
        // Update existing footer with store data
        const footerIndex = sections.findIndex(s => s.type === 'footer');
        if (footerIndex >= 0) {
          sections[footerIndex].locked = true;
          sections[footerIndex].name = 'כותרת תחתונה';
          
          // Ensure new footer structure with columns_count
          const existingSettings = sections[footerIndex].settings || {};
          
          // If old structure (no columns_count), migrate to new structure
          if (!existingSettings.columns_count) {
            sections[footerIndex].settings = {
              ...existingSettings,
              columns_count: 4,
              columns: [
                ...(existingSettings.columns || []).slice(0, 3),
                {
                  type: 'newsletter',
                  title: '',
                  menu_id: null,
                  text: '',
                  image_url: '',
                  newsletter_title: 'הישאר מעודכן',
                  newsletter_content: 'הירשם לניוזלטר שלנו וקבל עדכונים על מוצרים חדשים והנחות מיוחדות',
                  newsletter_button_bg: '#000000',
                  newsletter_button_text: '#FFFFFF'
                }
              ],
              social_links: existingSettings.social_links || {
                enabled: true,
                links: []
              },
              currency_selector: existingSettings.currency_selector || {
                enabled: false
              },
              copyright: `מופעל על ידי Quick Shop - פלטפורמה להקמת חנויות וירטואליות © ${new Date().getFullYear()}`
            };
          } else {
            // Just update copyright
            sections[footerIndex].settings = {
              ...existingSettings,
              copyright: `מופעל על ידי Quick Shop - פלטפורמה להקמת חנויות וירטואליות © ${new Date().getFullYear()}`
            };
          }
          
          // Move footer to end if not already
          const footer = sections.splice(footerIndex, 1)[0];
          footer.order = sections.length;
          sections.push(footer);
        }
      }

      // Reorder all sections
      sections.forEach((section, index) => {
        section.order = index;
      });

      // Debug: Log sections to see what we have
      console.log('Loaded sections:', sections.map(s => ({ id: s.id, type: s.type, visible: s.visible, hasSettings: !!s.settings })));

      setPageSections(sections);
      setCurrentPageType(pageType);
      
      // Cache the sections for this page type
      setPageSectionsCache(prev => ({
        ...prev,
        [pageType]: sections
      }));
    } catch (error) {
      console.error('Error loading page data:', error);
      // Fallback to default template for this page type
      const sections = [...getDefaultSectionsForPage(pageType)];
      const headerIndex = sections.findIndex(s => s.type === 'header');
      const footerIndex = sections.findIndex(s => s.type === 'footer');
      if (headerIndex >= 0) sections[headerIndex].locked = true;
      if (footerIndex >= 0) sections[footerIndex].locked = true;
      setPageSections(sections);
      setCurrentPageType(pageType);
    } finally {
      setIsLoading(false);
    }
  }, [pageSectionsCache]);
  
  // Handle page type change - also updates URL
  const handlePageTypeChange = useCallback((newPageType: PageType) => {
    if (newPageType === currentPageType) return;
    
    // Save current sections to cache before switching
    setPageSectionsCache(prev => ({
      ...prev,
      [currentPageType]: pageSections
    }));
    
    // Clear selection when switching pages
    setSelectedSectionId(null);
    
    // Clear page handle when switching page types
    setCurrentPageHandle(null);
    
    // Update URL to reflect new page type
    const storeId = searchParams.get('storeId');
    const newUrl = `/customize?storeId=${storeId}&pageType=${newPageType}`;
    router.push(newUrl, { scroll: false });
    
    // Load the new page type (without specific handle)
    loadPageData(newPageType, null);
  }, [currentPageType, pageSections, loadPageData, searchParams, router]);

  const handleDeviceChange = useCallback((device: DeviceType) => {
    setEditorState(prev => ({ ...prev, device }));
  }, []);

  const handleSectionSelect = useCallback((sectionId: string | null) => {
    setSelectedSectionId(sectionId);
  }, []);

  const handleSectionUpdate = useCallback((sectionId: string, updates: Partial<SectionSettings>) => {
    setPageSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, ...updates }
          : section
      )
    );
  }, []);

  const handleSectionAdd = useCallback((sectionType: string, position?: number) => {
    // Don't allow adding header or footer - they are fixed
    if (sectionType === 'header' || sectionType === 'footer') {
      return;
    }

    let defaultBlocks: any[] = [];
    let defaultSettings: any = {};

    // Default content for new sections
    switch (sectionType) {
      case 'hero_banner':
        defaultSettings = {
          heading: 'קולקציית קיץ 2024',
          subheading: 'הפריטים החמים ביותר לעונה',
          button_text: 'קנה עכשיו',
          button_url: '/categories/all',
          height: 'medium',
          text_align: 'center',
          content_position_vertical: 'center',
          content_position_horizontal: 'center'
        };
        break;

      case 'featured_products':
        defaultSettings = {
          title: 'מוצרים מומלצים',
          collection: 'all',
          items_per_row: 4,
          products_count: 8,
          show_view_all: true,
          view_all_text: 'לכל המוצרים',
          display_type: 'grid'
        };
        break;

      case 'featured_collections':
        defaultSettings = {
          title: 'קטגוריות פופולריות',
          items_per_row: 4,
          display_type: 'grid',
          show_view_all: true
        };
        break;

      case 'image_with_text':
        defaultSettings = {
          height: 'auto',
          layout: 'image_right',
          image_width: 'medium'
        };
        defaultBlocks = [
          {
            id: `img-${Date.now()}`,
            type: 'image',
            content: {
              image_url: '' // Placeholder handled by component
            }
          },
          {
            id: `txt-${Date.now()}`,
            type: 'text',
            content: {
              heading: 'הסיפור שלנו',
              text: 'אנחנו מאמינים באיכות ללא פשרות ובעיצוב על זמני. כל פריט בקולקציה שלנו נבחר בקפידה כדי להבטיח את החוויה הטובה ביותר עבורכם.',
              button_text: 'קרא עוד',
              button_url: '/pages/about'
            },
            style: {
              text_align: 'right'
            }
          }
        ];
        break;

      case 'rich_text':
        defaultSettings = {
          content_width: 'regular',
          content_align: 'center'
        };
        defaultBlocks = [
          {
            id: `rt-${Date.now()}`,
            type: 'text',
            content: {
              heading: 'דברו על המותג שלכם',
              text: 'שתפו מידע על המותג שלכם עם הלקוחות. תארו מוצר, שתפו הודעות, או קבלו את פני הלקוחות לחנות שלכם.'
            }
          }
        ];
        break;

      case 'newsletter':
        defaultSettings = {
          height: 'small',
          content_width: 'regular'
        };
        break;

      case 'slideshow':
        defaultSettings = {
          autoplay: true,
          autoplay_speed: 5,
          height: 'medium'
        };
        defaultBlocks = [
          {
            id: `slide-${Date.now()}-1`,
            type: 'image',
            content: {
              heading: 'ברוכים הבאים לחנות החדשה',
              subheading: 'גלו את הקולקציה החדשה שלנו',
              button_text: 'קנה עכשיו',
              button_url: '/categories/all',
              image_url: '' // Placeholder will be handled by component
            }
          },
          {
            id: `slide-${Date.now()}-2`,
            type: 'image',
            content: {
              heading: 'מבצעי קיץ חמים',
              subheading: 'עד 50% הנחה על כל הפריטים',
              button_text: 'למבצעים',
              button_url: '/categories/sale',
              image_url: ''
            }
          }
        ];
        break;

      case 'testimonials':
        defaultSettings = {
          title: 'לקוחות מספרים',
          subtitle: 'מה הלקוחות שלנו חושבים עלינו',
          columns: 3
        };
        defaultBlocks = [
          {
            id: `testim-${Date.now()}-1`,
            type: 'text',
            content: {
              text: 'שירות מעולה ומוצרים איכותיים מאוד! המשלוח הגיע מהר ובצורה מסודרת. בטוח אזמין שוב.',
              heading: 'דניאל כהן',
              subheading: 'לקוח מאומת'
            }
          },
          {
            id: `testim-${Date.now()}-2`,
            type: 'text',
            content: {
              text: 'חווית קנייה נהדרת. האתר נוח לשימוש והמחירים הוגנים. ממליצה בחום!',
              heading: 'נועה לוי',
              subheading: 'לקוחה מאומתת'
            }
          },
          {
            id: `testim-${Date.now()}-3`,
            type: 'text',
            content: {
              text: 'חיפשתי את המוצר הזה המון זמן ומצאתי אותו כאן במחיר הכי טוב. תודה רבה!',
              heading: 'יוסי אברהמי',
              subheading: 'לקוח מאומת'
            }
          }
        ];
        break;

      case 'faq':
        defaultSettings = {
          title: 'שאלות ותשובות',
          width: 'regular'
        };
        defaultBlocks = [
          {
            id: `faq-${Date.now()}-1`,
            type: 'text',
            content: {
              heading: 'כמה זמן לוקח המשלוח?',
              text: 'זמן המשלוח תלוי במיקום ובשיטת המשלוח שנבחרה. בדרך כלל משלוח רגיל לוקח 3-5 ימי עסקים.'
            }
          },
          {
            id: `faq-${Date.now()}-2`,
            type: 'text',
            content: {
              heading: 'האם ניתן להחזיר מוצר?',
              text: 'כן, ניתן להחזיר מוצרים תוך 14 יום מקבלתם, בתנאי שלא נעשה בהם שימוש והם באריזתם המקורית.'
            }
          },
          {
            id: `faq-${Date.now()}-3`,
            type: 'text',
            content: {
              heading: 'איך יוצרים קשר עם שירות הלקוחות?',
              text: 'ניתן ליצור קשר דרך עמוד "צור קשר" באתר, במייל support@example.com או בטלפון 050-0000000.'
            }
          }
        ];
        break;
      
      case 'gallery':
         defaultSettings = {
             items_per_row: 4,
             display_type: 'grid'
         };
         break;
         
      case 'video':
        defaultSettings = {
            title: 'הסיפור שלנו בוידאו',
            description: 'צפו בסרטון קצר על תהליך הייצור שלנו'
        };
        break;

      case 'contact_form':
        defaultSettings = {
            title: 'צור קשר',
            subtitle: 'נשמח לשמוע מכם',
            submit_text: 'שלח הודעה'
        };
        break;
    }

    const newSection: SectionSettings = {
      id: `section-${Date.now()}`,
      type: sectionType as any,
      name: getSectionName(sectionType),
      visible: true,
      order: position ?? pageSections.length,
      blocks: defaultBlocks,
      style: {
        background: {
          background_color: '#FFFFFF'
        },
        typography: {
          font_family: '"Noto Sans Hebrew", sans-serif'
        },
        spacing: {
          padding_top: '60px',
          padding_bottom: '60px'
        }
      },
      settings: defaultSettings
    };

    setPageSections(prev => {
      const updated = [...prev];
      
      // Find footer index (should be last)
      const footerIndex = updated.findIndex(s => s.type === 'footer');
      const insertBeforeFooter = footerIndex >= 0 ? footerIndex : updated.length;
      
      if (position !== undefined) {
        // Make sure we don't insert before header or after footer
        const headerIndex = updated.findIndex(s => s.type === 'header');
        const safePosition = Math.max(
          headerIndex >= 0 ? headerIndex + 1 : 0,
          Math.min(position, insertBeforeFooter)
        );
        updated.splice(safePosition, 0, newSection);
      } else {
        // Always insert before footer (or at end if no footer)
        updated.splice(insertBeforeFooter, 0, newSection);
      }
      
      // Update order for all sections
      updated.forEach((section, index) => {
        section.order = index;
      });
      
      return updated;
    });

    // Automatically select the new section to scroll to it and open settings
    // Timeout needed to allow state update and render to happen first
    setTimeout(() => {
        setSelectedSectionId(newSection.id);
    }, 100);

  }, [pageSections]);

  const handleSectionDelete = useCallback((sectionId: string) => {
    setPageSections(prev => {
      const section = prev.find(s => s.id === sectionId);
      // Don't allow deleting header or footer - they are locked/fixed
      if (section && (section.type === 'header' || section.type === 'footer' || section.locked)) {
        return prev;
      }
      return prev.filter(section => section.id !== sectionId);
    });
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
    }
  }, [selectedSectionId]);

  const handleSectionMove = useCallback((sectionId: string, newPosition: number) => {
    setPageSections(prev => {
      const sectionIndex = prev.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) return prev;

      const section = prev[sectionIndex];
      // Don't allow moving header or footer - they are locked/fixed
      if (section.locked || section.type === 'header' || section.type === 'footer') {
        return prev;
      }

      const updated = [...prev];
      const [movedSection] = updated.splice(sectionIndex, 1);
      
      // Find header and footer positions
      const headerIndex = updated.findIndex(s => s.type === 'header');
      const footerIndex = updated.findIndex(s => s.type === 'footer');
      
      // Ensure header stays at position 0 and footer stays at end
      let safePosition = newPosition;
      if (headerIndex >= 0 && newPosition <= headerIndex) {
        safePosition = headerIndex + 1;
      }
      if (footerIndex >= 0 && newPosition >= footerIndex) {
        safePosition = footerIndex;
      }
      
      updated.splice(safePosition, 0, movedSection);

      // Update order for all sections
      updated.forEach((section, index) => {
        section.order = index;
      });

      return updated;
    });
  }, []);

  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    try {
      const response = await fetch('/api/customizer/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageType: currentPageType,
          sections: pageSections,
          isPublished: true
        }),
      });

      const result = await response.json();
      if (result.success) {
        setToast({ message: 'השינויים פורסמו בהצלחה!', type: 'success' });
      } else {
        setToast({ message: 'שגיאה בפרסום: ' + result.error, type: 'error' });
      }
    } catch (error) {
      console.error('Error publishing:', error);
      setToast({ message: 'שגיאה בפרסום', type: 'error' });
    } finally {
      setIsPublishing(false);
    }
  }, [pageSections]);

  const handleImportTemplate = useCallback((importedSections: SectionSettings[]) => {
    try {
      // Ensure header and footer are preserved if they exist
      const currentHeader = pageSections.find(s => s.type === 'header');
      const currentFooter = pageSections.find(s => s.type === 'footer');
      
      // Filter out header and footer from imported sections
      const importedWithoutHeaderFooter = importedSections.filter(
        s => s.type !== 'header' && s.type !== 'footer'
      );
      
      // Build new sections array
      const newSections: SectionSettings[] = [];
      
      // Add header if exists in current or imported
      if (currentHeader) {
        newSections.push(currentHeader);
      } else {
        const importedHeader = importedSections.find(s => s.type === 'header');
        if (importedHeader) {
          importedHeader.locked = true;
          newSections.push(importedHeader);
        }
      }
      
      // Add imported sections
      importedWithoutHeaderFooter.forEach((section, index) => {
        newSections.push({
          ...section,
          order: newSections.length,
          id: section.id || `section-${Date.now()}-${index}`
        });
      });
      
      // Add footer if exists in current or imported
      if (currentFooter) {
        newSections.push(currentFooter);
      } else {
        const importedFooter = importedSections.find(s => s.type === 'footer');
        if (importedFooter) {
          importedFooter.locked = true;
          newSections.push(importedFooter);
        }
      }
      
      // Update order for all sections
      newSections.forEach((section, index) => {
        section.order = index;
      });
      
      setPageSections(newSections);
      setSelectedSectionId(null);
      setToast({ message: 'התבנית יובאה בהצלחה!', type: 'success' });
    } catch (error) {
      console.error('Error importing template:', error);
      setToast({ message: 'שגיאה בייבוא התבנית', type: 'error' });
    }
  }, [pageSections]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען עמוד...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50" dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Header */}
      <Header
        onPreview={() => {
          if (storeSlug) {
            window.open(`/shops/${storeSlug}`, '_blank');
          } else {
            setToast({ message: 'לא נמצא slug של החנות', type: 'error' });
          }
        }}
        onPublish={handlePublish}
        onTemplates={() => setIsTemplatesModalOpen(true)}
        onGeneralSettings={() => setIsGeneralSettingsModalOpen(true)}
        device={editorState.device}
        onDeviceChange={handleDeviceChange}
        isPublishing={isPublishing}
        pageType={currentPageType}
        onPageTypeChange={handlePageTypeChange}
      />

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        sections={pageSections}
        onImport={handleImportTemplate}
      />

      {/* General Settings Modal */}
      <GeneralSettingsModal
        isOpen={isGeneralSettingsModalOpen}
        onClose={() => setIsGeneralSettingsModalOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Elements Sidebar (Right Side - Start in RTL) */}
        <div className="w-80 bg-white border-l border-gray-200">
          <ElementsSidebar
            sections={pageSections}
            selectedSectionId={selectedSectionId}
            onSectionSelect={handleSectionSelect}
            onSectionAdd={handleSectionAdd}
            onSectionDelete={handleSectionDelete}
            onSectionMove={handleSectionMove}
            onSectionUpdate={handleSectionUpdate}
            pageType={currentPageType}
          />
        </div>

        {/* Preview Frame */}
        <div className="flex-1 bg-white">
          <PreviewFrame
            sections={pageSections}
            selectedSectionId={selectedSectionId}
            device={editorState.device}
            zoom={editorState.zoom}
            showGrid={editorState.showGrid}
            showOutlines={editorState.showOutlines}
            onSectionSelect={handleSectionSelect}
            onSectionUpdate={handleSectionUpdate}
            onSectionDelete={handleSectionDelete}
            pageType={currentPageType}
            sampleProduct={sampleProduct}
            sampleCollection={sampleCollection}
          />
        </div>

        {/* Settings Panel (Left Side - End in RTL) */}
        <div className="w-80 bg-white border-r border-gray-200">
          <SettingsAndStylePanel
            sections={pageSections}
            selectedSectionId={selectedSectionId}
            onSectionUpdate={handleSectionUpdate}
            device={editorState.device}
          />
        </div>
      </div>
    </div>
  );
}
