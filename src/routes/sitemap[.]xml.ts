import { createFileRoute } from '@tanstack/react-router';
import { getBaseUrl } from '@/lib/urls';
import { getSortedPosts } from '@/lib/blog';
import { productConfig } from '@/config/product';
import { websiteConfig } from '@/config/website';
import { GUIDES } from '@/config/guides';

interface SitemapEntry {
  path: string;
  changefreq?: string;
  priority?: string;
  lastmod?: string;
}

const toDay = (date: string) => new Date(date).toISOString().slice(0, 10);

/**
 * Dynamic sitemap.xml
 *
 * Only pages that are finished and indexable belong here. Unbuilt feature
 * pages are excluded via productConfig, and account, auth and payment pages
 * are never listed.
 */
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const base = getBaseUrl().replace(/\/$/, '');
        // `lastmod` is the date the page's content last changed, maintained by
        // hand. Search engines ignore lastmod once it proves unreliable, so it
        // is not stamped with the build date: bump a page's date only when its
        // text changes.
        const staticUrls: SitemapEntry[] = [
          {
            path: '/',
            changefreq: 'weekly',
            priority: '1.0',
            lastmod: '2026-09-24',
          },
          {
            path: '/examples',
            changefreq: 'monthly',
            priority: '0.8',
            lastmod: '2026-09-24',
          },
          {
            path: '/pricing',
            changefreq: 'monthly',
            priority: '0.7',
            lastmod: '2026-09-23',
          },
          {
            path: '/guides',
            changefreq: 'monthly',
            priority: '0.7',
            lastmod: '2026-09-24',
          },
          ...GUIDES.map((guide) => ({
            path: guide.href,
            changefreq: 'monthly',
            priority: '0.7',
            lastmod: guide.updated,
          })),
          { path: '/about', changefreq: 'monthly', lastmod: '2026-09-23' },
          { path: '/contact', changefreq: 'monthly', lastmod: '2026-09-23' },
          { path: '/privacy', changefreq: 'yearly', lastmod: '2026-09-23' },
          { path: '/terms', changefreq: 'yearly', lastmod: '2026-09-23' },
          { path: '/cookie', changefreq: 'yearly', lastmod: '2026-09-23' },
        ];

        // Feature pages join the sitemap the day the feature ships, not before.
        if (productConfig.features.batch) {
          staticUrls.push({
            path: '/batch-audio-to-midi',
            changefreq: 'monthly',
            priority: '0.8',
            lastmod: '2026-09-24',
          });
        }
        if (productConfig.features.cleanupPresets) {
          staticUrls.push({
            path: '/midi-cleanup',
            changefreq: 'monthly',
            priority: '0.8',
            lastmod: '2026-09-23',
          });
        }
        if (websiteConfig.blog?.enable) {
          const newest = getSortedPosts()[0];
          staticUrls.push({
            path: '/blog',
            changefreq: 'weekly',
            lastmod: newest ? toDay(newest.date) : undefined,
          });
        }

        const urlEntry = (path: string, opts?: Omit<SitemapEntry, 'path'>) => {
          const lastmod = opts?.lastmod
            ? `\n    <lastmod>${opts.lastmod}</lastmod>`
            : '';
          const changefreq = opts?.changefreq
            ? `\n    <changefreq>${opts.changefreq}</changefreq>`
            : '';
          const priority = opts?.priority
            ? `\n    <priority>${opts.priority}</priority>`
            : '';
          return `  <url>\n    <loc>${base}${path}</loc>${lastmod}${changefreq}${priority}\n  </url>`;
        };

        const staticPart = staticUrls
          .map(({ path, ...opts }) => urlEntry(path, opts))
          .join('\n');

        let blogPart = '';
        if (websiteConfig.blog?.enable) {
          const posts = getSortedPosts();
          blogPart = posts
            .map((p) =>
              urlEntry(`/blog/${p.slug}`, {
                changefreq: 'monthly',
                lastmod: toDay(p.date),
              })
            )
            .join('\n');
        }

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPart}
${blogPart ? `\n${blogPart}` : ''}
</urlset>`;

        return new Response(sitemap, {
          headers: { 'Content-Type': 'application/xml' },
        });
      },
    },
  },
});
