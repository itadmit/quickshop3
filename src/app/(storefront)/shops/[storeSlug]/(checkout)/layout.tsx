import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { LocaleSetter } from '@/components/storefront/LocaleSetter';
import { getStoreBySlug } from '@/lib/utils/store';
import { getActivePixels, getActiveTrackingCodes } from '@/lib/tracking/pixels';

/**
 * Layout מיוחד לצ'ק אאוט - ללא Header ו-Footer
 * Route Group זה מבטל את ה-layout הרגיל של הסטורפרונט
 */
export default async function CheckoutGroupLayout({
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

  // טעינת פיקסלים וקודי מעקב (רק לצ'ק אאוט)
  const [headPixels, headCodes, bodyPixels, bodyCodes, footerPixels, footerCodes] = await Promise.all([
    getActivePixels(store.id).then(p => p.filter(p => p.placement === 'head')),
    getActiveTrackingCodes(store.id).then(c => c.filter(c => c.placement === 'head')),
    getActivePixels(store.id).then(p => p.filter(p => p.placement === 'body')),
    getActiveTrackingCodes(store.id).then(c => c.filter(c => c.placement === 'body')),
    getActivePixels(store.id).then(p => p.filter(p => p.placement === 'footer')),
    getActiveTrackingCodes(store.id).then(c => c.filter(c => c.placement === 'footer')),
  ]);

  return (
    <>
      {/* Head Tracking Pixels */}
      {headPixels.map((pixel) => (
        pixel.pixel_code && (
          <Script
            key={`head-pixel-${pixel.id}`}
            id={`head-pixel-${pixel.id}`}
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: pixel.pixel_code }}
          />
        )
      ))}

      {/* Head Tracking Codes */}
      {headCodes
        .filter((c) => c.code_type === 'script' || !c.code_type)
        .map((code) => (
          <Script
            key={`head-code-${code.id}`}
            dangerouslySetInnerHTML={{ __html: code.code_content }}
          />
        ))}

      {/* Body Tracking Pixels (for noscript tags) */}
      {bodyPixels
        .filter((p) => p.pixel_code?.includes('<noscript'))
        .map((pixel) => (
          pixel.pixel_code && (
            <noscript
              key={`body-pixel-noscript-${pixel.id}`}
              dangerouslySetInnerHTML={{
                __html: pixel.pixel_code
                  .replace(/<noscript>/gi, '')
                  .replace(/<\/noscript>/gi, ''),
              }}
            />
          )
        ))}

      <LocaleSetter locale={store.locale || 'he'} />
      
      {/* Checkout Content - בלי Header ו-Footer */}
      <div className="min-h-screen" dir="rtl">
        {children}
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

