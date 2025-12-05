/**
 * Tracking Pixels Component - הטמעת פיקסלים בפרונט
 * 
 * מטמיע פיקסלים וקודי מעקב לפי placement (head/body/footer)
 */

'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

interface TrackingPixel {
  id: number;
  pixel_type: string;
  pixel_id: string | null;
  pixel_code: string | null;
  placement: string;
}

interface TrackingCode {
  id: number;
  code_type: string | null;
  code_content: string;
  placement: string;
}

interface TrackingPixelsProps {
  storeId: number;
  placement: 'head' | 'body' | 'footer';
}

export function TrackingPixels({ storeId, placement }: TrackingPixelsProps) {
  const [pixels, setPixels] = useState<TrackingPixel[]>([]);
  const [codes, setCodes] = useState<TrackingCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTracking = async () => {
      try {
        const response = await fetch(`/api/tracking?storeId=${storeId}&placement=${placement}`);
        if (response.ok) {
          const data = await response.json();
          setPixels(data.pixels || []);
          setCodes(data.codes || []);
        }
      } catch (error) {
        console.error('Error loading tracking pixels:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTracking();
  }, [storeId, placement]);

  if (loading) return null;

  return (
    <>
      {/* Facebook Pixel */}
      {pixels
        .filter((p) => p.pixel_type === 'facebook' && p.pixel_id)
        .map((pixel) => (
          <Script
            key={pixel.id}
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
        ))}

      {/* TikTok Pixel */}
      {pixels
        .filter((p) => p.pixel_type === 'tiktok' && p.pixel_id)
        .map((pixel) => (
          <Script
            key={pixel.id}
            id={`tt-pixel-${pixel.id}`}
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function (w, d, t) {
                  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                  ttq.load('${pixel.pixel_id}');
                  ttq.page();
                }(window, document, 'ttq');
              `,
            }}
          />
        ))}

      {/* Google Analytics 4 */}
      {pixels
        .filter((p) => p.pixel_type === 'google_analytics' && p.pixel_id)
        .map((pixel) => (
          <>
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
          </>
        ))}

      {/* Google Tag Manager */}
      {pixels
        .filter((p) => p.pixel_type === 'google_tag_manager' && p.pixel_id)
        .map((pixel) => (
          <>
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
            {placement === 'body' && (
              <noscript>
                <iframe
                  src={`https://www.googletagmanager.com/ns.html?id=${pixel.pixel_id}`}
                  height="0"
                  width="0"
                  style={{ display: 'none', visibility: 'hidden' }}
                />
              </noscript>
            )}
          </>
        ))}

      {/* Custom HTML Codes */}
      {codes
        .filter((c) => c.code_type === 'custom_html' || !c.code_type)
        .map((code) => (
          <div
            key={code.id}
            dangerouslySetInnerHTML={{ __html: code.code_content }}
          />
        ))}

      {/* Custom Scripts */}
      {codes
        .filter((c) => c.code_type === 'script')
        .map((code) => (
          <Script
            key={code.id}
            id={`custom-script-${code.id}`}
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: code.code_content }}
          />
        ))}
    </>
  );
}

