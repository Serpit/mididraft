import { createFileRoute } from '@tanstack/react-router';
import { getBaseUrl } from '@/lib/urls';
import { getSortedPosts } from '@/lib/blog';
import { productConfig } from '@/config/product';
import { websiteConfig } from '@/config/website';

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
        const staticUrls: {
          path: string;
          changefreq?: string;
          priority?: string;
        }[] = [
          { path: '/', changefreq: 'weekly', priority: '1.0' },
          { path: '/examples', changefreq: 'monthly', priority: '0.8' },
          { path: '/pricing', changefreq: 'monthly', priority: '0.7' },
          {
            path: '/guides/audio-to-midi-fl-studio',
            changefreq: 'monthly',
            priority: '0.7',
          },
          {
            path: '/guides/audio-to-midi-ableton',
            changefreq: 'monthly',
            priority: '0.7',
          },
          {
            path: '/guides/improve-audio-to-midi-results',
            changefreq: 'monthly',
            priority: '0.7',
          },
          { path: '/about', changefreq: 'monthly' },
          { path: '/contact', changefreq: 'monthly' },
          { path: '/privacy', changefreq: 'yearly' },
          { path: '/terms', changefreq: 'yearly' },
          { path: '/cookie', changefreq: 'yearly' },
        ];

        // Feature pages join the sitemap the day the feature ships, not before.
        if (productConfig.features.batch) {
          staticUrls.push({
            path: '/batch-audio-to-midi',
            changefreq: 'monthly',
            priority: '0.8',
          });
        }
        if (productConfig.features.cleanupPresets) {
          staticUrls.push({
            path: '/midi-cleanup',
            changefreq: 'monthly',
            priority: '0.8',
          });
        }
        if (websiteConfig.blog?.enable) {
          staticUrls.push({ path: '/blog', changefreq: 'weekly' });
        }

        const urlEntry = (
          path: string,
          opts?: { changefreq?: string; priority?: string; lastmod?: string }
        ) => {
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
          .map((u) =>
            urlEntry(u.path, { changefreq: u.changefreq, priority: u.priority })
          )
          .join('\n');

        let blogPart = '';
        if (websiteConfig.blog?.enable) {
          const posts = getSortedPosts();
          blogPart = posts
            .map((p) =>
              urlEntry(`/blog/${p.slug}`, {
                changefreq: 'monthly',
                lastmod: new Date(p.date).toISOString().slice(0, 10),
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
