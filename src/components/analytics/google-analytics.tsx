import { ClientScript } from '@/components/shared/client-script';
import { clientEnv } from '@/env/client';
import { GTAG_READY_EVENT } from '@/lib/analytics/events';

/**
 * Google Analytics (GA4)
 * https://analytics.google.com
 *
 * Google signals and ad personalisation are off, as the cookie policy
 * promises. Add `?ga_debug=1` to any URL to see its events in GA DebugView.
 * The ready event lets `track()` send anything queued before this ran.
 */
export function GoogleAnalytics() {
  if (!import.meta.env.PROD) return null;
  const id = clientEnv.VITE_GOOGLE_ANALYTICS_ID;
  if (!id) return null;

  const inlineHtml = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    var config = {
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    };
    if (/[?&]ga_debug=1/.test(location.search)) config.debug_mode = true;
    gtag('config', '${id}', config);
    window.dispatchEvent(new Event('${GTAG_READY_EVENT}'));
  `;
  return (
    <>
      <ClientScript
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        async
      />
      <ClientScript id="google-analytics" inlineHtml={inlineHtml} />
    </>
  );
}
