import { createFileRoute } from '@tanstack/react-router';
import { getBaseUrl } from '@/lib/urls';

/**
 * Dynamic robots.txt
 *
 * Crawl control only. Pages that must stay out of the index — unfinished
 * feature pages, private results — use a `noindex` meta tag, because
 * robots.txt cannot reliably remove a page and is not a privacy mechanism.
 */
export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: async () => {
        const base = getBaseUrl().replace(/\/$/, '');
        const robots = `User-agent: *
Allow: /
Disallow: /auth
Disallow: /dashboard
Disallow: /settings
Disallow: /admin
Disallow: /api/

Sitemap: ${base}/sitemap.xml`;

        return new Response(robots, {
          headers: { 'Content-Type': 'text/plain' },
        });
      },
    },
  },
});
