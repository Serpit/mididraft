import { ClientScript } from '@/components/shared/client-script';
import { clientEnv } from '@/env/client';
import { GTAG_READY_EVENT } from '@/lib/analytics/events';

const INTERNAL_KEY = 'mididraft:internal';

/**
 * Google Analytics (GA4)
 * https://analytics.google.com
 *
 * Google signals and ad personalisation are off, as the cookie policy
 * promises. Add `?ga_debug=1` to any URL to see its events in GA DebugView.
 * The ready event lets `track()` send anything queued before this ran.
 *
 * Open any URL with `?internal=1` once to stop this browser from sending
 * anything to GA, for good; `?internal=0` undoes it. It is a browser flag
 * rather than an IP rule because the team browses through proxies whose
 * exit IPs change.
 */
export function GoogleAnalytics() {
  if (!import.meta.env.PROD) return null;
  const id = clientEnv.VITE_GOOGLE_ANALYTICS_ID;
  if (!id) return null;

  const inlineHtml = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    try {
      var flag = location.search.match(/[?&]internal=([01])/);
      if (flag && flag[1] === '1') localStorage.setItem('${INTERNAL_KEY}', '1');
      if (flag && flag[1] === '0') localStorage.removeItem('${INTERNAL_KEY}');
      if (localStorage.getItem('${INTERNAL_KEY}')) {
        window['ga-disable-${id}'] = true;
      }
    } catch (e) {}
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
