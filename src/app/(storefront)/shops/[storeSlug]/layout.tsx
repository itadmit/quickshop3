import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import React from 'react';
import { headers } from 'next/headers';
import { PageViewTracker } from '@/components/storefront/PageViewTracker';
import { ConditionalLayout } from '@/components/storefront/ConditionalLayout';
import { LocaleSetter } from '@/components/storefront/LocaleSetter';
import { getStoreBySlug } from '@/lib/utils/store';
import { getActivePixels, getActiveTrackingCodes } from '@/lib/tracking/pixels';
import { getNavigationCollections } from '@/lib/storefront/queries';

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

  // טעינת פיקסלים וקודי מעקב + Collections לניווט
  const [headPixels, headCodes, bodyPixels, bodyCodes, footerPixels, footerCodes, navigationCollections] = await Promise.all([
    getActivePixels(store.id).then(p => p.filter(p => p.placement === 'head')),
    getActiveTrackingCodes(store.id).then(c => c.filter(c => c.placement === 'head')),
    getActivePixels(store.id).then(p => p.filter(p => p.placement === 'body')),
    getActiveTrackingCodes(store.id).then(c => c.filter(c => c.placement === 'body')),
    getActivePixels(store.id).then(p => p.filter(p => p.placement === 'footer')),
    getActiveTrackingCodes(store.id).then(c => c.filter(c => c.placement === 'footer')),
    getNavigationCollections(store.id),
  ]);

  return (
    <>
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
      
      {/* Layout Structure: Header -> Content -> Footer (מותנה) */}
      <div className="min-h-screen flex flex-col" dir="rtl">
        <PageViewTracker />
        <ConditionalLayout storeName={store.name} collections={navigationCollections}>
          {children}
        </ConditionalLayout>
      </div>

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
    </>
  );
}
