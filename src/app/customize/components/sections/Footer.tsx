'use client';

import React, { useState, useEffect } from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { FaFacebook, FaInstagram, FaTwitter, FaWhatsapp, FaPinterest, FaYoutube } from 'react-icons/fa';
import { SiTiktok, SiSnapchat } from 'react-icons/si';
import { CountrySelector } from '@/components/storefront/CountrySelector';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

type DeviceType = 'desktop' | 'tablet' | 'mobile';

interface FooterProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  editorDevice?: DeviceType;
}

export function Footer({ section, onUpdate, editorDevice = 'desktop' }: FooterProps) {
  const settings = section.settings || {};
  const isMobileView = editorDevice === 'mobile' || editorDevice === 'tablet';
  const showCurrencySelector = settings.currency_selector?.enabled === true;
  const params = useParams();
  const storeSlug = params?.storeSlug as string || '';
  const { t } = useTranslation('storefront');
  
  const columnsCount = settings.columns_count || 4;
  const columns = settings.columns || [];
  
  // Load menu items for columns with menu type
  const [menuItemsMap, setMenuItemsMap] = useState<Record<number, Array<{ label: string; url: string }>>>({});
  
  useEffect(() => {
    const loadMenuItems = async () => {
      const itemsMap: Record<number, Array<{ label: string; url: string }>> = {};
      
      // Ensure we have columns array
      const currentColumns = columns.length > 0 ? columns : Array.from({ length: columnsCount }).map(() => ({ type: 'menu', title: '', menu_id: null, text: '', image_url: '' }));
      
      for (let i = 0; i < currentColumns.length; i++) {
        const column = currentColumns[i];
        if (column && column.type === 'menu' && column.menu_id) {
          try {
            const response = await fetch(`/api/navigation/${column.menu_id}`);
            if (response.ok) {
              const data = await response.json();
              const items = (data.navigation_menu?.items || []).map((item: any) => ({
                label: item.title || item.label || '',
                url: item.url || ''
              }));
              itemsMap[i] = items;
            } else {
              console.error(`Failed to load menu ${column.menu_id} for column ${i}:`, response.status);
            }
          } catch (error) {
            console.error(`Error loading menu items for column ${i}:`, error);
          }
        }
      }
      
      setMenuItemsMap(itemsMap);
    };
    
    if (columns.length > 0 || columnsCount > 0) {
      loadMenuItems();
    }
  }, [columns, columnsCount]);

  const getGridCols = () => {
    if (isMobileView) return 'grid-cols-1';
    switch (columnsCount) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-3';
      case 4: return 'grid-cols-1 md:grid-cols-4';
      default: return 'grid-cols-1 md:grid-cols-4';
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className={`grid gap-8 ${getGridCols()}`}>
            {Array.from({ length: columnsCount }).map((_, index) => {
            const column = columns[index] || { 
              type: 'menu', 
              title: '', 
              menu_id: null, 
              text: '', 
              image_url: '',
              newsletter_title: '',
              newsletter_content: '',
              newsletter_button_bg: '#000000',
              newsletter_button_text: '#FFFFFF'
            };
            const columnType = column.type || 'menu';
            const menuItems = menuItemsMap[index] || [];
            
            return (
              <div key={index}>
                {column.title && (
                  <h3 className="text-white font-semibold mb-4">{column.title}</h3>
                )}
                
                {columnType === 'menu' && column.menu_id && (
                  <ul className="space-y-2">
                    {menuItems.length > 0 ? (
                      menuItems.map((item: any, linkIndex: number) => (
                        <li key={linkIndex}>
                          <Link
                            href={item.url?.startsWith('/') ? `/shops/${storeSlug}${item.url}` : item.url || '#'}
                            className="hover:text-white transition-colors"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500 text-sm">{t('footer.loading_menu') || 'טוען תפריט...'}</li>
                    )}
                  </ul>
                )}
                
                {columnType === 'menu' && !column.menu_id && (
                  <p className="text-gray-500 text-sm">{t('footer.no_menu_selected') || 'לא נבחר תפריט'}</p>
                )}
                
                {columnType === 'text' && (
                  <div 
                    className="text-gray-300 text-sm prose prose-sm prose-invert max-w-none"
                    style={{
                      '--tw-prose-body': '#9CA3AF',
                      '--tw-prose-headings': '#FFFFFF',
                      '--tw-prose-links': '#9CA3AF',
                      '--tw-prose-bold': '#FFFFFF',
                    } as React.CSSProperties}
                    dangerouslySetInnerHTML={{ __html: column.text || '' }}
                  />
                )}
                
                {columnType === 'image' && column.image_url && (
                  <div>
                    <img 
                      src={column.image_url} 
                      alt={column.title || `תמונה ${index + 1}`}
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                )}
                
                {columnType === 'newsletter' && (
                  <div className="space-y-4">
                    {column.newsletter_title && (
                      <h4 className="text-white font-semibold text-lg">{column.newsletter_title}</h4>
                    )}
                    {column.newsletter_content && (
                      <p className="text-gray-300 text-sm">{column.newsletter_content}</p>
                    )}
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        // TODO: Handle newsletter subscription
                      }}
                      className="flex flex-col gap-2"
                    >
                      <input
                        type="email"
                        placeholder={t('newsletter.email_placeholder') || 'הכנס את כתובת המייל'}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                        dir="ltr"
                      />
                      <button
                        type="submit"
                        className="px-6 py-2 rounded-lg transition-colors font-medium"
                        style={{
                          backgroundColor: column.newsletter_button_bg || '#000000',
                          color: column.newsletter_button_text || '#FFFFFF'
                        }}
                      >
                        {t('footer.send') || 'שלח'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col items-center gap-4">
            {/* Currency Selector */}
            {showCurrencySelector && (
              <div className="flex justify-center">
                <CountrySelector />
              </div>
            )}
            
            <p className="text-center text-sm">{settings.copyright || t('footer.powered_by') || `מופעל על ידי Quick Shop - פלטפורמה להקמת חנויות וירטואליות © ${new Date().getFullYear()}`}</p>
            
            {/* Social Links */}
            {settings.social_links?.enabled !== false && settings.social_links?.links && settings.social_links.links.length > 0 && (
              <div className="flex items-center justify-center gap-4">
                {settings.social_links.links
                  .filter((social: any) => social.url && social.url.trim() !== '')
                  .map((social: any, index: number) => (
                    <a
                      key={index}
                      href={social.url}
                      className="text-gray-400 hover:text-white transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.platform}
                    >
                      {social.platform === 'facebook' && <FaFacebook className="w-5 h-5" />}
                      {social.platform === 'instagram' && <FaInstagram className="w-5 h-5" />}
                      {social.platform === 'twitter' && <FaTwitter className="w-5 h-5" />}
                      {social.platform === 'tiktok' && <SiTiktok className="w-5 h-5" />}
                      {social.platform === 'whatsapp' && <FaWhatsapp className="w-5 h-5" />}
                      {social.platform === 'snapchat' && <SiSnapchat className="w-5 h-5" />}
                      {social.platform === 'pinterest' && <FaPinterest className="w-5 h-5" />}
                      {social.platform === 'youtube' && <FaYoutube className="w-5 h-5" />}
                      {!['facebook', 'instagram', 'twitter', 'tiktok', 'whatsapp', 'snapchat', 'pinterest', 'youtube'].includes(social.platform) && '🔗'}
                    </a>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
