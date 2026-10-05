/**
 * Inyecta los scripts de Google Analytics 4 y Meta Pixel en el
 * `<head>`. Sólo se cargan si su ID está configurado.
 *
 * Va en el root layout — el storefront los necesita; el panel admin
 * comparte el layout pero los visitantes admin no son audiencia, no
 * tracking ahí (lo evitamos no envíando eventos desde `/admin/*`).
 */
import Script from "next/script";

import {
  GA_MEASUREMENT_ID,
  META_PIXEL_ID,
  hasGA,
  hasPixel,
} from "./config";

export function AnalyticsScripts() {
  if (!hasGA && !hasPixel) return null;

  return (
    <>
      {hasGA && (
        <>
          <Script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="lazyOnload"
          />
          <Script id="ga4-init" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `}
          </Script>
        </>
      )}

      {hasPixel && (
        <Script id="meta-pixel" strategy="lazyOnload">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
