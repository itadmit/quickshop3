'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PreviewFrame } from './PreviewFrame';
import { Sidebar } from './Sidebar';
import { Header, DeviceType } from './Header';
import { SettingsAndStylePanel } from './SettingsAndStylePanel';
import { ElementsSidebar } from './ElementsSidebar';
import { NEW_YORK_TEMPLATE } from '@/lib/customizer/templates/new-york';
import { EditorState, SectionSettings } from '@/lib/customizer/types';

export function CustomizerLayout() {
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

  // Load initial page data
  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = useCallback(async () => {
    try {
      const response = await fetch('/api/customizer/pages?pageType=home');
      const data = await response.json();

      let sections: SectionSettings[] = [];
      if (data.sections && data.sections.length > 0) {
        sections = data.sections;
      } else {
        // Load default New York template
        sections = NEW_YORK_TEMPLATE.sections;
      }

      // Get store info and collections from API response
      const storeName = data.store?.name || 'החנות שלי';
      const storeLogo = data.store?.logo || null;
      const collections = data.collections || [];
      
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
                  url: `/collections/${col.handle}`
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
            user_account: {
              enabled: true
            }
          }
        };
        sections.unshift(headerSection);
      } else {
        // Update existing header with store data if settings are empty
        const headerIndex = sections.findIndex(s => s.type === 'header');
        if (headerIndex >= 0) {
          sections[headerIndex].locked = true;
          // Update settings with store data if not already set
          if (!sections[headerIndex].settings || Object.keys(sections[headerIndex].settings).length === 0) {
            sections[headerIndex].settings = {
              logo: {
                text: storeName,
                image_url: storeLogo
              },
              navigation: {
                menu_items: [
                  { label: 'בית', url: '/' },
                  ...collections.slice(0, 5).map((col: any) => ({
                    label: col.name,
                    url: `/collections/${col.handle}`
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
              user_account: {
                enabled: true
              }
            };
          } else {
            // Update logo if not set
            if (!sections[headerIndex].settings.logo) {
              sections[headerIndex].settings.logo = {
                text: storeName,
                image_url: storeLogo
              };
            } else {
              // Update logo text if empty
              if (!sections[headerIndex].settings.logo.text) {
                sections[headerIndex].settings.logo.text = storeName;
              }
              if (!sections[headerIndex].settings.logo.image_url && storeLogo) {
                sections[headerIndex].settings.logo.image_url = storeLogo;
              }
            }
          }
        }
      }

      // Add or update footer
      if (!hasFooter) {
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
            columns: [
              {
                title: 'חברה',
                links: [
                  { label: 'אודותינו', url: '/pages/about' },
                  { label: 'צור קשר', url: '/pages/contact' },
                  { label: 'משלוחים', url: '/pages/shipping' },
                  { label: 'החזרות', url: '/pages/returns' }
                ]
              },
              {
                title: 'מוצרים',
                links: [
                  { label: 'כל המוצרים', url: '/collections/all' },
                  ...collections.slice(0, 3).map((col: any) => ({
                    label: col.name,
                    url: `/collections/${col.handle}`
                  }))
                ]
              },
              {
                title: 'שירות לקוחות',
                links: [
                  { label: 'שאלות נפוצות', url: '/pages/faq' },
                  { label: 'מדיניות פרטיות', url: '/pages/privacy' },
                  { label: 'תנאי שימוש', url: '/pages/terms' }
                ]
              }
            ],
            social_links: [
              { platform: 'facebook', url: 'https://facebook.com' },
              { platform: 'instagram', url: 'https://instagram.com' },
              { platform: 'twitter', url: 'https://twitter.com' }
            ],
            copyright: `© ${new Date().getFullYear()} ${storeName} - כל הזכויות שמורות`,
            payment_methods: ['visa', 'mastercard', 'paypal']
          }
        };
        sections.push(footerSection);
      } else {
        // Mark existing footer as locked and ensure it's last
        const footerIndex = sections.findIndex(s => s.type === 'footer');
        if (footerIndex >= 0) {
          sections[footerIndex].locked = true;
          // Update copyright with store name if not set
          if (!sections[footerIndex].settings.copyright) {
            sections[footerIndex].settings.copyright = `© ${new Date().getFullYear()} ${storeName} - כל הזכויות שמורות`;
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
    } catch (error) {
      console.error('Error loading page data:', error);
      // Fallback to default template with header/footer
      const sections = [...NEW_YORK_TEMPLATE.sections];
      const headerIndex = sections.findIndex(s => s.type === 'header');
      const footerIndex = sections.findIndex(s => s.type === 'footer');
      if (headerIndex >= 0) sections[headerIndex].locked = true;
      if (footerIndex >= 0) sections[footerIndex].locked = true;
      setPageSections(sections);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

    const newSection: SectionSettings = {
      id: `section-${Date.now()}`,
      type: sectionType as any,
      name: sectionType,
      visible: true,
      order: position ?? pageSections.length,
      blocks: [],
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
      settings: {}
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

  const handleSave = useCallback(async () => {
    try {
      const response = await fetch('/api/customizer/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageType: 'home',
          sections: pageSections,
          isPublished: false
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('השינויים נשמרו בהצלחה!');
      } else {
        alert('שגיאה בשמירה: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('שגיאה בשמירה');
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
      {/* Header */}
      <Header
        onSave={handleSave}
        onPreview={() => {
          if (storeSlug) {
            window.open(`/shops/${storeSlug}`, '_blank');
          } else {
            alert('לא נמצא slug של החנות');
          }
        }}
        onPublish={async () => {
          try {
            const response = await fetch('/api/customizer/pages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                pageType: 'home',
                sections: pageSections,
                isPublished: true
              }),
            });

            const result = await response.json();
            if (result.success) {
              alert('העמוד פורסם בהצלחה!');
            } else {
              alert('שגיאה בפרסום: ' + result.error);
            }
          } catch (error) {
            console.error('Error publishing:', error);
            alert('שגיאה בפרסום');
          }
        }}
        device={editorState.device}
        onDeviceChange={handleDeviceChange}
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
