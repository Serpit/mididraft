# Production deployment

- Site: https://mididraft.com
- Repository: https://github.com/Serpit/mididraft
- Production branch: `main`
- Hosting: Cloudflare Workers Builds, Worker `mididraft`
- Account: `Gserpit@gmail.com` (`c44f96d73d3a41fa80298e1fbca99dbb`)

Cloudflare builds and deploys changes pushed to `main` automatically.

Build command:

```sh
NODE_OPTIONS=--max-old-space-size=4096 VITE_BASE_URL=https://mididraft.com VITE_PAYMENT_PROVIDER=waffo VITE_GOOGLE_ANALYTICS_ID=G-6C8T3HFK3N pnpm build
```

Deploy command:

```sh
pnpm exec wrangler deploy
```

The 4 GB Node heap prevents the SSR build from exhausting the default heap.
`VITE_*` values are baked in at build time, so they live in this command, not
in the Worker's runtime variables — a runtime variable is invisible to the
build, and an inline assignment here overrides any build variable.
The GitHub Actions workflow is a manual fallback and requires its own repository
secrets; it does not run on pushes to avoid duplicate deployments.

The production D1 database and custom domain are defined in `wrangler.jsonc`.
Migrations 0000–0003 were applied at launch, 0004 (`cleanup_presets`) with
the paid launch and 0005 (`launch_offer`) with the first-purchase offer, all
recorded in `d1_migrations`. Apply new ones with
`pnpm exec wrangler d1 migrations apply mididraft --remote` (wrangler must be
logged in to the account above).

Runtime secrets (Cloudflare secrets, never Git): `BETTER_AUTH_SECRET`,
`WAFFO_MERCHANT_ID`, `WAFFO_PRIVATE_KEY` (the Waffo **production** key) and
`WAFFO_MODE=prod`. See `docs/payment.md` for Waffo.

R2 cloud uploads are disabled; audio conversion and MIDI export run locally in
the browser. Paid plans are on sale through Waffo Pancake.

## Search engines after a deploy

**Bing Webmaster Tools.** Add the site at <https://www.bing.com/webmasters>
with *Import from Google Search Console* — it copies the verified property and
its sitemap, so no verification tag is needed in the code. If you add the site
manually instead, submit `https://mididraft.com/sitemap.xml`.

**IndexNow** (Bing, Yandex, Seznam, Naver). The key file is
`public/a0ad0c83d2928de6b2f8b00bc22a974a.txt`. After a deploy that changed page
content, run:

```bash
pnpm indexnow                    # every URL in the live sitemap
pnpm indexnow /guides /examples  # only the pages that changed
```

The script reads the sitemap and key file from the live site, so run it after
the deploy finishes. Google does not use IndexNow; use Search Console there.

Sitemap `lastmod` dates are set by hand (`src/routes/sitemap[.]xml.ts`, and
`updated` in `src/config/guides.ts` for guides). Bump a page's date when its
content changes, and never to the build date — engines stop trusting a
`lastmod` that changes on every deploy.
