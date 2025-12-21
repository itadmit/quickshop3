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

// Dynamic imports for real components (only used in storefront)
import dynamic from 'next/dynamic';

const SideCart = dynamic(() => import('@/components/storefront/SideCart').then(mod => mod.SideCart), { ssr: false });
const SearchBar = dynamic(() => import('@/components/storefront/SearchBar').then(mod => mod.SearchBar), { ssr: false });
const CountrySelector = dynamic(() => import('@/components/storefront/CountrySelector').then(mod => mod.CountrySelector), { ssr: false });

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
  const [shouldRenderMenu, setShouldRenderMenu] = useState(false);
  const [isMenuAnimating, setIsMenuAnimating] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const params = useParams();
  const storeSlug = params?.storeSlug as string || '';
  
  // Mobile menu animation handling (exactly like SideCart)
  useEffect(() => {
    if (isMobileMenuOpen) {
      // פתיחה: מוסיף ל-DOM ואז מפעיל אנימציה
      setShouldRenderMenu(true);
      // מונע scrollbar ומרווחים
      document.body.classList.add('menu-open');
      document.documentElement.classList.add('menu-open');
      document.body.style.overflow = 'hidden';
      document.body.style.marginRight = '0';
      document.body.style.paddingRight = '0';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.marginRight = '0';
      document.documentElement.style.paddingRight = '0';
      // delay כדי שהאנימציה תרוץ (הקומפוננטה תהיה ב-DOM לפני האנימציה)
      // משתמשים ב-requestAnimationFrame כפול כדי לוודא שה-DOM נצבע לפני האנימציה
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsMenuAnimating(true);
        });
      });
    } else {
      // סגירה: מפעיל אנימציה ואז מסיר מה-DOM
      setIsMenuAnimating(false);
      const timer = setTimeout(() => {
        setShouldRenderMenu(false);
        document.body.classList.remove('menu-open');
        document.documentElement.classList.remove('menu-open');
        document.body.style.overflow = 'unset';
        document.body.style.marginRight = '';
        document.body.style.paddingRight = '';
        document.documentElement.style.overflow = 'unset';
        document.documentElement.style.marginRight = '';
        document.documentElement.style.paddingRight = '';
      }, 300); // אותו זמן כמו האנימציה
      return () => clearTimeout(timer);
    }
  }, [isMobileMenuOpen]);
  
  // Close menu on Escape key (like SideCart)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen]);
  
  const settings = section.settings || {};
  const style = section.style || {};
  
  // Sticky enabled defaults to true if not explicitly set to false
  const isStickyEnabled = settings.sticky?.enabled !== false;
  
  // Sticky header shrink effect - must be before any early returns
  useEffect(() => {
    if (!isPreview && isStickyEnabled && settings.sticky?.shrink === 'shrink') {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 50);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isPreview, isStickyEnabled, settings.sticky?.shrink]);
  
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

    // Storefront mode - real components
    if (split) {
      if (position === 'right') {
        return settings.search?.enabled === true ? <SearchBar placeholder={settings.search?.placeholder} /> : null;
      }
      if (position === 'left') {
        return (
          <div className="flex items-center gap-1">
            {settings.cart?.enabled === true && storeId && <SideCart storeId={storeId} />}
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
        {settings.search?.enabled === true && <SearchBar placeholder={settings.search?.placeholder} />}
        {settings.currency_selector?.enabled === true && <CountrySelector />}
        {settings.cart?.enabled === true && storeId && <SideCart storeId={storeId} />}
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

  // Mobile Menu Sidebar - opens from right with animation like SideCart
  const MobileMenu = () => {
    // Use mobile menu items if available, otherwise use desktop menu items
    const mobileMenuItems = settings.navigation?.menu_items_mobile && settings.navigation.menu_items_mobile.length > 0
      ? settings.navigation.menu_items_mobile
      : settings.navigation?.menu_items || [];
    
    if (isPreview || !shouldRenderMenu) return null;
    
    return (
      <>
        {/* Backdrop - exactly like SideCart, flush to all edges */}
        <div
          className="fixed bg-black z-40 transition-opacity duration-300 ease-in-out"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: isMenuAnimating ? 0.5 : 0
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        {/* Sidebar from right - with CSS animation, flush to right edge */}
        <div 
          className={`fixed inset-y-0 bg-white z-50 flex flex-col ${
            isMenuAnimating ? 'mobile-menu-enter' : ''
          }`}
          style={{ 
            top: 0,
            bottom: 0,
            right: 0,
            left: 'auto',
            width: '100%',
            maxWidth: '28rem',
            margin: 0,
            padding: 0,
            boxShadow: '-4px 0 6px -1px rgba(0, 0, 0, 0.1)',
            transform: isMenuAnimating ? 'translateX(0)' : 'translateX(100%)',
            transition: !isMenuAnimating ? 'transform 300ms ease-in-out' : 'none',
            willChange: 'transform',
            overflow: 'hidden',
            borderRight: 'none',
            outline: 'none'
          }}
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold" style={{ color: textColor }}>תפריט</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              style={{ color: iconColor }}
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>
          
          {/* Menu items */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {mobileMenuItems.map((item: any, index: number) => (
                <Link
                  key={index}
                  href={item.url?.startsWith('/') ? `/shops/${storeSlug}${item.url}` : item.url || '#'}
                  className="block font-medium text-base py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ color: navColor }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            
            {settings.user_account?.enabled === true && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <Link
                  href={`/shops/${storeSlug}/account`}
                  className="flex items-center gap-3 font-medium text-base py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ color: navColor }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <HiUser className="w-5 h-5" />
                  החשבון שלי
                </Link>
              </div>
            )}
          </nav>
        </div>
      </>
    );
  };

  // Mobile Icons Component for Preview
  const MobileIconsPreview = () => (
    <div className="flex items-center gap-1">
      {settings.wishlist?.enabled === true && (
        <IconButton title="מועדפים"><HiHeart className="w-5 h-5" /></IconButton>
      )}
      {settings.user_account?.enabled === true && (
        <IconButton title="חשבון"><HiUser className="w-5 h-5" /></IconButton>
      )}
      {settings.cart?.enabled !== false && (
        <IconButton title="עגלה"><HiShoppingCart className="w-5 h-5" /></IconButton>
      )}
    </div>
  );

  // Mobile view for customizer preview - respects layout style
  if (isPreview && isMobileView) {
    const renderMobilePreviewLayout = () => {
      switch (layoutStyle) {
        // Logo Center layouts
        case 'menu_right_logo_center':
        case 'logo_center_menu_below':
          return (
            <div className="flex items-center justify-between w-full relative">
              <MobileMenuButton />
              <div className="absolute left-1/2 transform -translate-x-1/2">
                <Logo mobile />
              </div>
              <MobileIconsPreview />
            </div>
          );
        // Logo Left
        case 'logo_left_menu_center':
          return (
            <div className="flex items-center justify-between w-full">
              <Logo mobile />
              <div className="flex items-center gap-1">
                <MobileIconsPreview />
                <MobileMenuButton />
              </div>
            </div>
          );
        // Logo Right (default)
        case 'logo_right_menu_center':
        default:
          return (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1">
                <MobileMenuButton />
                <MobileIconsPreview />
              </div>
              <Logo mobile />
            </div>
          );
      }
    };

    return (
      <header 
        className="sticky top-0 z-50"
        style={{ backgroundColor: bgColor, ...getBorderStyles() }}
      >
        <div 
          className="max-w-7xl mx-auto px-4 flex items-center justify-between"
          style={{ height: heightMobile }}
        >
          {renderMobilePreviewLayout()}
        </div>
      </header>
    );
  }

  // Mobile Icons Component (without cart - handled separately)
  const MobileIcons = () => (
    <div className="flex items-center gap-1">
      {settings.wishlist?.enabled === true && (
        isPreview ? (
          <IconButton title="מועדפים"><HiHeart className="w-5 h-5" /></IconButton>
        ) : (
          <Link href={`/shops/${storeSlug}/wishlist`} className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100/50 transition-colors" style={{ color: iconColor }}>
            <HiHeart className="w-5 h-5" />
          </Link>
        )
      )}
      {settings.user_account?.enabled === true && (
        isPreview ? (
          <IconButton title="חשבון"><HiUser className="w-5 h-5" /></IconButton>
        ) : (
          <Link href={`/shops/${storeSlug}/account`} className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100/50 transition-colors" style={{ color: iconColor }}>
            <HiUser className="w-5 h-5" />
          </Link>
        )
      )}
      {settings.cart?.enabled !== false && (
        !isPreview && storeId ? (
          <SideCart storeId={storeId} />
        ) : (
          <IconButton title="עגלה"><HiShoppingCart className="w-5 h-5" /></IconButton>
        )
      )}
    </div>
  );

  // Layouts - Desktop and Mobile combined
  const renderLayout = () => {
    switch (layoutStyle) {
      // Logo Center layouts: hamburger right, logo center, icons left
      case 'menu_right_logo_center':
        return (
          <>
            {/* Desktop */}
            <div className="hidden md:contents"><Navigation /></div>
            <div className="hidden md:block"><Logo /></div>
            <div className="hidden md:flex items-center gap-2"><Icons /></div>
            {/* Mobile: hamburger right, logo center, icons left */}
            <div className="md:hidden flex items-center justify-between w-full">
              <MobileMenuButton />
              <div className="absolute left-1/2 transform -translate-x-1/2">
                <Logo mobile />
              </div>
              <MobileIcons />
            </div>
          </>
        );

      case 'logo_center_menu_below':
        return (
          <div className="w-full">
            {/* Desktop */}
            <div className="hidden md:flex items-center justify-between" style={{ minHeight: heightDesktop }}>
              <Icons split position="right" />
              <Logo />
              <Icons split position="left" />
            </div>
            <div className="hidden md:flex justify-center pb-3 -mt-1">
              <Navigation />
            </div>
            {/* Mobile: hamburger right, logo center, icons left */}
            <div className="md:hidden flex items-center justify-between w-full" style={{ minHeight: heightMobile }}>
              <MobileMenuButton />
              <div className="absolute left-1/2 transform -translate-x-1/2">
                <Logo mobile />
              </div>
              <MobileIcons />
            </div>
          </div>
        );

      // Logo Left: logo left, icons+hamburger right
      case 'logo_left_menu_center':
        return (
          <>
            {/* Desktop */}
            <div className="hidden md:flex items-center gap-2"><Icons /></div>
            <div className="hidden md:contents"><Navigation /></div>
            <div className="hidden md:block"><Logo /></div>
            {/* Mobile: logo left, icons+hamburger right */}
            <div className="md:hidden flex items-center justify-between w-full">
              <Logo mobile />
              <div className="flex items-center gap-1">
                <MobileIcons />
                <MobileMenuButton />
              </div>
            </div>
          </>
        );

      // Logo Right (default): logo right, hamburger+icons left
      case 'logo_right_menu_center':
      default:
        return (
          <>
            {/* Desktop */}
            <div className="hidden md:block"><Logo /></div>
            <div className="hidden md:contents"><Navigation /></div>
            <div className="hidden md:flex items-center gap-2"><Icons /></div>
            {/* Mobile: logo right, hamburger+icons left */}
            <div className="md:hidden flex items-center justify-between w-full">
              <div className="flex items-center gap-1">
                <MobileMenuButton />
                <MobileIcons />
              </div>
              <Logo mobile />
            </div>
          </>
        );
    }
  };

  const headerHeight = isScrolled && settings.sticky?.shrink === 'shrink' 
    ? (parseInt(heightDesktop) * 0.8) + 'px' 
    : heightDesktop;

  return (
    <>
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
          className="max-w-7xl mx-auto px-4 flex items-center justify-between relative"
          style={{ minHeight: layoutStyle === 'logo_center_menu_below' ? 'auto' : headerHeight }}
        >
          {renderLayout()}
        </div>
      </header>
      {/* Mobile Menu - outside header to avoid sticky/fixed conflicts */}
      <MobileMenu />
    </>
  );
}

// Export for customizer (backwards compatibility)
export { UnifiedHeader as Header };

