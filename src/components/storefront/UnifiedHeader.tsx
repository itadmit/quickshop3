/**
 * Unified Header Component
 * קומפוננט הדר אחיד לקסטומייזר ולפרונט
 * משתמש ב-isPreview כדי להחליט אם להציג קומפוננטים אמיתיים או דמה
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { HiSearch, HiUser, HiMenu, HiX, HiHeart, HiShoppingCart } from 'react-icons/hi';
import { SectionSettings } from '@/lib/customizer/types';

// Regular imports - we'll use isMounted to prevent hydration mismatch
import { SideCart } from '@/components/storefront/SideCart';
import { SearchBar } from '@/components/storefront/SearchBar';
import { CountrySelector } from '@/components/storefront/CountrySelector';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

interface UnifiedHeaderProps {
  section: SectionSettings;
  onUpdate?: (updates: Partial<SectionSettings>) => void;
  editorDevice?: DeviceType;
  isPreview?: boolean; // true = customizer preview (no real functionality)
  storeId?: string;
}

export function UnifiedHeader({ 
  section, 
  onUpdate, 
  editorDevice = 'desktop',
  isPreview = false,
  storeId
}: UnifiedHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const params = useParams();
  const storeSlug = params?.storeSlug as string || '';

  // Fix hydration mismatch - only render client-side components after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const settings = section.settings || {};
  const style = section.style || {};
  const isMobileView = editorDevice === 'mobile' || editorDevice === 'tablet';

  // Layout style
  const layoutStyle = settings.layout_style || 'logo_right_menu_center';
  
  // Styling
  const bgColor = style.background?.background_color || '#FFFFFF';
  const textColor = style.typography?.color || '#000000';
  const navColor = style.navigation?.color || '#374151';
  const navHoverColor = style.navigation?.hover_color || '#000000';
  const iconColor = style.icons?.color || '#4B5563';
  const iconHoverColor = style.icons?.hover_color || '#000000';
  const borderStyle = style.border?.bottom_style || 'solid';
  const borderColor = style.border?.border_color || '#E5E7EB';
  
  // Sizes
  const heightDesktop = style.spacing?.height_desktop || '64px';
  const heightMobile = style.spacing?.height_mobile || '56px';
  const logoHeightDesktop = settings.logo?.height_desktop || '40px';
  const logoHeightMobile = settings.logo?.height_mobile || '32px';
  const logoPaddingDesktop = settings.logo?.padding_desktop || '0px';
  const logoPaddingMobile = settings.logo?.padding_mobile || '0px';
  const navGap = settings.navigation?.gap || '24';
  const navFontSize = settings.navigation?.font_size || 'medium';
  const navFontWeight = settings.navigation?.font_weight || 'medium';

  // Font size mapping
  const fontSizeMap: Record<string, string> = { small: '13px', medium: '14px', large: '16px' };
  const fontWeightMap: Record<string, string> = { normal: '400', medium: '500', bold: '600' };

  // Border/shadow style
  const getBorderStyles = (): React.CSSProperties => {
    if (borderStyle === 'none') return {};
    if (borderStyle === 'shadow') return { boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' };
    return { borderBottom: `1px solid ${borderColor}` };
  };

  // Create link - in preview mode, links don't navigate
  const createLink = (href: string, children: React.ReactNode, className?: string, style?: React.CSSProperties) => {
    if (isPreview) {
      return <span className={className} style={style}>{children}</span>;
    }
    const fullHref = href.startsWith('/') ? `/shops/${storeSlug}${href}` : href;
    return <Link href={fullHref} className={className} style={style}>{children}</Link>;
  };

  // Logo component
  const Logo = ({ mobile = false }: { mobile?: boolean }) => {
    const logoContent = (
      <div 
        className="flex items-center flex-shrink-0"
        style={{ padding: mobile ? logoPaddingMobile : logoPaddingDesktop }}
      >
        {settings.logo?.image_url ? (
          <img 
            src={settings.logo.image_url} 
            alt={settings.logo.text || 'לוגו'} 
            style={{ height: mobile ? logoHeightMobile : logoHeightDesktop, width: 'auto' }}
          />
        ) : (
          <h1 
            className={`font-bold ${mobile ? 'text-lg' : 'text-xl'}`}
            style={{ color: textColor }}
          >
            {settings.logo?.text || 'החנות שלי'}
          </h1>
        )}
      </div>
    );

    if (isPreview) return logoContent;
    return <Link href={`/shops/${storeSlug}`}>{logoContent}</Link>;
  };

  // Navigation component
  const Navigation = ({ vertical = false }: { vertical?: boolean }) => {
    // Always use desktop menu items for desktop navigation
    const menuItems = settings.navigation?.menu_items || [];
    return (
      <nav className={`flex ${vertical ? 'flex-col' : 'items-center'}`} style={{ gap: vertical ? '12px' : `${navGap}px` }}>
        {menuItems.slice(0, 6).map((item: any, index: number) => {
        const linkStyle = { 
          color: navColor,
          fontSize: fontSizeMap[navFontSize] || fontSizeMap.medium,
          fontWeight: fontWeightMap[navFontWeight] || fontWeightMap.medium
        };
        
        if (isPreview) {
          return (
            <span
              key={index}
              className="transition-colors whitespace-nowrap cursor-pointer"
              style={linkStyle}
            >
              {item.label}
            </span>
          );
        }

        const href = item.url?.startsWith('/') ? `/shops/${storeSlug}${item.url}` : item.url || '#';
        return (
          <Link
            key={index}
            href={href}
            className="transition-colors whitespace-nowrap"
            style={linkStyle}
            onMouseEnter={(e) => e.currentTarget.style.color = navHoverColor}
            onMouseLeave={(e) => e.currentTarget.style.color = navColor}
          >
            {item.label}
          </Link>
        );
      })}
      </nav>
    );
  };

  // Icon Button component
  const IconButton = ({ 
    children, 
    title, 
    href, 
    onClick 
  }: { 
    children: React.ReactNode; 
    title: string; 
    href?: string;
    onClick?: () => void;
  }) => {
    const classes = "p-2 rounded-lg transition-colors hover:bg-black/5";
    const styles = { color: iconColor };
    
    if (isPreview || (!href && !onClick)) {
      return (
        <button className={classes} style={styles} title={title}>
          {children}
        </button>
      );
    }

    if (href) {
      return (
        <Link href={href} className={classes} style={styles} title={title}>
          {children}
        </Link>
      );
    }

    return (
      <button onClick={onClick} className={classes} style={styles} title={title}>
        {children}
      </button>
    );
  };

  // Icons component - different for preview vs storefront
  const Icons = ({ split = false, position = 'all' }: { split?: boolean; position?: 'left' | 'right' | 'all' }) => {
    // Preview mode - simple icons
    if (isPreview) {
      if (split) {
        if (position === 'right') {
          return settings.search?.enabled === true ? (
            <IconButton title="חיפוש"><HiSearch className="w-5 h-5" /></IconButton>
          ) : null;
        }
        if (position === 'left') {
          return (
            <div className="flex items-center gap-1">
              {settings.cart?.enabled === true && (
                <IconButton title="עגלה"><HiShoppingCart className="w-5 h-5" /></IconButton>
              )}
              {settings.wishlist?.enabled && (
                <IconButton title="מועדפים"><HiHeart className="w-5 h-5" /></IconButton>
              )}
              {settings.user_account?.enabled === true && (
                <IconButton title="חשבון"><HiUser className="w-5 h-5" /></IconButton>
              )}
            </div>
          );
        }
      }
      
      return (
        <div className="flex items-center gap-1">
          {settings.search?.enabled === true && (
            <IconButton title="חיפוש"><HiSearch className="w-5 h-5" /></IconButton>
          )}
          {settings.cart?.enabled === true && (
            <IconButton title="עגלה"><HiShoppingCart className="w-5 h-5" /></IconButton>
          )}
          {settings.wishlist?.enabled === true && (
            <IconButton title="מועדפים"><HiHeart className="w-5 h-5" /></IconButton>
          )}
          {!isMobileView && settings.user_account?.enabled === true && (
            <IconButton title="חשבון"><HiUser className="w-5 h-5" /></IconButton>
          )}
          {isMobileView && (
            <button className="p-2 rounded-lg hover:bg-gray-100" style={{ color: iconColor }}>
              <HiMenu className="w-6 h-6" />
            </button>
          )}
        </div>
      );
    }

    // Storefront mode - real components (only after mount to prevent hydration mismatch)
    if (split) {
      if (position === 'right') {
        return settings.search?.enabled === true && isMounted ? <SearchBar placeholder={settings.search?.placeholder} /> : null;
      }
      if (position === 'left') {
        return (
          <div className="flex items-center gap-1">
            {settings.cart?.enabled === true && storeId && isMounted && <SideCart storeId={storeId} />}
            {settings.wishlist?.enabled === true && (
              <IconButton title="מועדפים" href={`/shops/${storeSlug}/wishlist`}>
                <HiHeart className="w-5 h-5" />
              </IconButton>
            )}
            {settings.user_account?.enabled === true && (
              <IconButton title="חשבון" href={`/shops/${storeSlug}/account`}>
                <HiUser className="w-5 h-5" />
              </IconButton>
            )}
          </div>
        );
      }
    }

    return (
      <div className="flex items-center gap-1">
        {settings.search?.enabled === true && isMounted && <SearchBar placeholder={settings.search?.placeholder} />}
        {settings.currency_selector?.enabled === true && isMounted && <CountrySelector />}
        {settings.cart?.enabled === true && storeId && isMounted && <SideCart storeId={storeId} />}
        {settings.wishlist?.enabled === true && (
          <IconButton title="מועדפים" href={`/shops/${storeSlug}/wishlist`}>
            <HiHeart className="w-5 h-5" />
          </IconButton>
        )}
        {settings.user_account?.enabled === true && (
          <IconButton title="חשבון" href={`/shops/${storeSlug}/account`}>
            <HiUser className="w-5 h-5" />
          </IconButton>
        )}
      </div>
    );
  };

  // Mobile Menu Button
  const MobileMenuButton = () => (
    <button
      onClick={() => !isPreview && setIsMobileMenuOpen(!isMobileMenuOpen)}
      className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
      aria-label="תפריט"
      style={{ color: iconColor }}
    >
      {isMobileMenuOpen ? <HiX className="w-5 h-5" /> : <HiMenu className="w-5 h-5" />}
    </button>
  );

  // Mobile Menu Dropdown
  const MobileMenu = () => {
    // Use mobile menu items if available, otherwise use desktop menu items
    const mobileMenuItems = settings.navigation?.menu_items_mobile && settings.navigation.menu_items_mobile.length > 0
      ? settings.navigation.menu_items_mobile
      : settings.navigation?.menu_items || [];
    
    return (
      !isPreview && isMobileMenuOpen && (
        <div 
          className="md:hidden absolute top-full left-0 right-0 shadow-lg py-4 px-4 z-40 animate-in slide-in-from-top-2 duration-200"
          style={{ 
            backgroundColor: bgColor,
            borderBottom: `1px solid ${borderColor}` 
          }}
        >
          <nav className="flex flex-col gap-3">
            {mobileMenuItems.map((item: any, index: number) => (
            <Link
              key={index}
              href={item.url?.startsWith('/') ? `/shops/${storeSlug}${item.url}` : item.url || '#'}
              className="font-medium text-lg py-2 border-b border-gray-100 last:border-0 transition-colors"
              style={{ color: navColor }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
            ))}
            {settings.user_account?.enabled === true && (
              <Link
                href={`/shops/${storeSlug}/account`}
                className="flex items-center gap-2 font-medium text-lg py-2 mt-2"
                style={{ color: navColor }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <HiUser className="w-5 h-5" />
                החשבון שלי
              </Link>
            )}
          </nav>
        </div>
      )
    );
  };

  // Mobile view for customizer preview
  if (isPreview && isMobileView) {
    return (
      <header 
        className="sticky top-0 z-50"
        style={{ backgroundColor: bgColor, ...getBorderStyles() }}
      >
        <div 
          className="max-w-7xl mx-auto px-4 flex items-center justify-between"
          style={{ height: heightMobile }}
        >
          <Logo mobile />
          <Icons />
        </div>
      </header>
    );
  }

  // Desktop layouts
  const renderDesktopLayout = () => {
    switch (layoutStyle) {
      case 'menu_right_logo_center':
        return (
          <>
            <div className="hidden md:contents"><Navigation /></div>
            <Logo />
            <div className="hidden md:flex items-center gap-2"><Icons /></div>
            <div className="md:hidden flex items-center gap-2">
              {!isPreview && settings.cart?.enabled === true && storeId && isMounted && <SideCart storeId={storeId} />}
              {isPreview && settings.cart?.enabled === true && (
                <IconButton title="עגלה"><HiShoppingCart className="w-5 h-5" /></IconButton>
              )}
              <MobileMenuButton />
            </div>
          </>
        );

      case 'logo_left_menu_center':
        return (
          <>
            <div className="hidden md:flex items-center gap-2"><Icons /></div>
            <div className="hidden md:contents"><Navigation /></div>
            <Logo />
            <div className="md:hidden flex items-center gap-2">
              {!isPreview && settings.cart?.enabled === true && storeId && isMounted && <SideCart storeId={storeId} />}
              {isPreview && settings.cart?.enabled === true && (
                <IconButton title="עגלה"><HiShoppingCart className="w-5 h-5" /></IconButton>
              )}
              <MobileMenuButton />
            </div>
          </>
        );

      case 'logo_center_menu_below':
        return (
          <div className="w-full">
            <div className="flex items-center justify-between" style={{ minHeight: heightDesktop }}>
              <div className="hidden md:flex"><Icons split position="right" /></div>
              <Logo />
              <div className="hidden md:flex"><Icons split position="left" /></div>
              <div className="md:hidden flex items-center gap-2">
                {!isPreview && settings.cart?.enabled !== false && storeId && isMounted && <SideCart storeId={storeId} />}
                {isPreview && settings.cart?.enabled !== false && (
                  <IconButton title="עגלה"><HiShoppingCart className="w-5 h-5" /></IconButton>
                )}
                <MobileMenuButton />
              </div>
            </div>
            <div className="hidden md:flex justify-center pb-3 -mt-1">
              <Navigation />
            </div>
          </div>
        );

      case 'logo_right_menu_center':
      default:
        return (
          <>
            <Logo />
            <div className="hidden md:contents"><Navigation /></div>
            <div className="hidden md:flex items-center gap-2"><Icons /></div>
            <div className="md:hidden flex items-center gap-2">
              {!isPreview && settings.cart?.enabled === true && storeId && isMounted && <SideCart storeId={storeId} />}
              {isPreview && settings.cart?.enabled === true && (
                <IconButton title="עגלה"><HiShoppingCart className="w-5 h-5" /></IconButton>
              )}
              <MobileMenuButton />
            </div>
          </>
        );
    }
  };

  // Sticky header shrink effect
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Sticky enabled defaults to true if not explicitly set to false
  const isStickyEnabled = settings.sticky?.enabled !== false;
  
  useEffect(() => {
    if (!isPreview && isStickyEnabled && settings.sticky?.shrink === 'shrink') {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 50);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isPreview, isStickyEnabled, settings.sticky?.shrink]);

  const headerHeight = isScrolled && settings.sticky?.shrink === 'shrink' 
    ? (parseInt(heightDesktop) * 0.8) + 'px' 
    : heightDesktop;

  return (
    <header 
      className={`${isStickyEnabled ? 'sticky top-0' : 'relative'} z-50 transition-all duration-300`}
      style={{ 
        backgroundColor: bgColor, 
        ...getBorderStyles(),
        ...(isScrolled && settings.sticky?.shrink === 'shrink' && {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        })
      }}
    >
      <div 
        className="max-w-7xl mx-auto px-4 flex items-center justify-between"
        style={{ minHeight: layoutStyle === 'logo_center_menu_below' ? 'auto' : headerHeight }}
      >
        {renderDesktopLayout()}
      </div>
      <MobileMenu />
    </header>
  );
}

// Export for customizer (backwards compatibility)
export { UnifiedHeader as Header };

