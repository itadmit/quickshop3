import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import React from 'react';
import { headers } from 'next/headers';
import { PageViewTracker } from '@/components/storefront/PageViewTracker';
import { SharedStoreLayout } from '@/components/storefront/SharedStoreLayout';
import { LocaleSetter } from '@/components/storefront/LocaleSetter';
import { PopupManager } from '@/components/storefront/PopupManager';
import { CookieBanner } from '@/components/storefront/CookieBanner';
import { ScrollToTop } from '@/components/storefront/ScrollToTop';
import { getStoreBySlug } from '@/lib/utils/store';
import { getActivePixels, getActiveTrackingCodes } from '@/lib/tracking/pixels';
import { query } from '@/lib/db';

// Get cookie translations based on locale
function getCookieTranslations(locale: string) {
  const isHebrew = locale?.startsWith('he');
  return isHebrew ? {
    cookieNotice: 'הודעת עוגיות',
    cookieDescription: 'אנו משתמשים בעוגיות כדי לשפר את חווית הגלישה שלך באתר. המשך השימוש באתר מהווה הסכמה לשימוש בעוגיות.',
    accept: 'אני מסכים',
    decline: 'לא מסכים',
    learnMore: 'קרא עוד',
    showLess: 'הצג פחות',
  } : {
    cookieNotice: 'Cookie Notice',
    cookieDescription: 'We use cookies to improve your browsing experience on our site. Continuing to use the site constitutes consent to our use of cookies.',
    accept: 'Accept',
    decline: 'Decline',
    learnMore: 'Learn More',
    showLess: 'Show Less',
  };
}

// בדיקה אם הנתיב הוא צ'ק אאוט
function isCheckoutPath(pathname: string, storeSlug: string): boolean {
  const basePath = `/shops/${storeSlug}`;
  return pathname.startsWith(`${basePath}/checkout`);
}

export default async function StoreSlugLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  
  // טעינת פרטי החנות לפי slug
  const store = await getStoreBySlug(storeSlug);

  if (!store) {
    notFound();
  }

  // בדיקה אם הנתיב הוא צ'ק אאוט - אם כן, לא נציג header/footer
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isCheckout = isCheckoutPath(pathname, storeSlug);

  // טעינת פיקסלים וקודי מעקב
  const [headPixels, headCodes, bodyPixels, bodyCodes, footerPixels, footerCodes, themeSettings] = await Promise.all([
    getActivePixels(store.id).then(p => p.filter(p => p.placement === 'head')),
    getActiveTrackingCodes(store.id).then(c => c.filter(c => c.placement === 'head')),
    getActivePixels(store.id).then(p => p.filter(p => p.placement === 'body')),
    getActiveTrackingCodes(store.id).then(c => c.filter(c => c.placement === 'body')),
    getActivePixels(store.id).then(p => p.filter(p => p.placement === 'footer')),
    getActiveTrackingCodes(store.id).then(c => c.filter(c => c.placement === 'footer')),
    query<{ custom_css: string; custom_head_code: string; custom_js: string }>(
      `SELECT custom_css, custom_head_code, custom_js FROM store_theme_settings WHERE store_id = $1 LIMIT 1`,
      [store.id]
    ).then(result => result[0] || { custom_css: '', custom_head_code: '', custom_js: '' }),
  ]);

  return (
    <>
      {/* Store Slug for Analytics */}
      <Script
        id="store-slug-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.__STORE_SLUG = '${storeSlug}'; window.__STORE_ID = ${store.id};`,
        }}
      />
      
      {/* Head Tracking Pixels */}
      {headPixels.map((pixel) => {
        if (pixel.pixel_type === 'facebook' && pixel.pixel_id) {
          return (
            <Script
              key={`fb-${pixel.id}`}
              id={`fb-pixel-${pixel.id}`}
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${pixel.pixel_id}');
                  fbq('track', 'PageView');
                `,
              }}
            />
          );
        }
        if (pixel.pixel_type === 'google_analytics' && pixel.pixel_id) {
          return (
            <React.Fragment key={`ga-wrapper-${pixel.id}`}>
              <Script
                key={`ga-${pixel.id}`}
                src={`https://www.googletagmanager.com/gtag/js?id=${pixel.pixel_id}`}
                strategy="afterInteractive"
              />
              <Script
                key={`ga-init-${pixel.id}`}
                id={`ga-init-${pixel.id}`}
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                  __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${pixel.pixel_id}');
                  `,
                }}
              />
            </React.Fragment>
          );
        }
        if (pixel.pixel_type === 'google_tag_manager' && pixel.pixel_id) {
          return (
            <Script
              key={`gtm-${pixel.id}`}
              id={`gtm-${pixel.id}`}
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                  })(window,document,'script','dataLayer','${pixel.pixel_id}');
                `,
              }}
            />
          );
        }
        if (pixel.pixel_code) {
          return (
            <Script
              key={`custom-${pixel.id}`}
              dangerouslySetInnerHTML={{ __html: pixel.pixel_code }}
            />
          );
        }
        return null;
      })}

      {/* Head Tracking Codes */}
      {headCodes
        .filter((c) => c.code_type === 'script' || !c.code_type)
        .map((code) => (
          <Script
            key={`code-${code.id}`}
            dangerouslySetInnerHTML={{ __html: code.code_content }}
          />
        ))}

      {/* Custom CSS from Theme Settings */}
      {themeSettings.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: themeSettings.custom_css }} />
      )}

      {/* Custom Head Scripts from Theme Settings */}
      {themeSettings.custom_head_code && (
        <Script
          id="theme-custom-head"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: themeSettings.custom_head_code }}
        />
      )}

      {/* GTM Noscript */}
      {headPixels
        .filter((p) => p.pixel_type === 'google_tag_manager' && p.pixel_id)
        .map((pixel) => (
          <noscript key={`gtm-noscript-${pixel.id}`}>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${pixel.pixel_id}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        ))}

      <LocaleSetter locale={store.locale || 'he'} />
      
      {/* Scroll to top on route change */}
      <ScrollToTop />
      
      {/* Layout Structure: Customizer Layout (Header + Content + Footer from Customizer) */}
      <PageViewTracker />
      <PopupManager storeId={store.id} />
      
      {/* אם זה צ'ק אאוט - לא נציג הדר ופוטר */}
      {isCheckout ? (
        <div className="min-h-screen" dir="rtl">
          {children}
        </div>
      ) : (
        <SharedStoreLayout storeSlug={storeSlug} storeId={store.id}>
          {children}
        </SharedStoreLayout>
      )}

      {/* Body Tracking Codes */}
      {bodyCodes
        .filter((c) => c.code_type === 'script' || !c.code_type)
        .map((code) => (
          <Script
            key={`body-code-${code.id}`}
            dangerouslySetInnerHTML={{ __html: code.code_content }}
          />
        ))}

      {/* Footer Tracking Codes */}
      {footerCodes
        .filter((c) => c.code_type === 'script' || !c.code_type)
        .map((code) => (
          <Script
            key={`footer-code-${code.id}`}
            dangerouslySetInnerHTML={{ __html: code.code_content }}
          />
        ))}

      {/* Custom Body Scripts from Theme Settings */}
      {themeSettings.custom_js && (
        <Script
          id="theme-custom-body"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: themeSettings.custom_js }}
        />
      )}

      {/* Cookie Consent Banner */}
      <CookieBanner 
        storeSlug={storeSlug} 
        translations={getCookieTranslations(store.locale || 'he-IL')}
      />
    </>
  );
}
