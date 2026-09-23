# Production deployment

- Site: https://mididraft.com
- Repository: https://github.com/Serpit/mididraft
- Production branch: `main`
- Hosting: Cloudflare Workers Builds, Worker `mididraft`
- Account: `Gserpit@gmail.com` (`c44f96d73d3a41fa80298e1fbca99dbb`)

Cloudflare builds and deploys changes pushed to `main` automatically.

Build command:

```sh
NODE_OPTIONS=--max-old-space-size=4096 VITE_BASE_URL=https://mididraft.com VITE_PAYMENT_PROVIDER= pnpm build
```

Deploy command:

```sh
pnpm exec wrangler deploy
```

The 4 GB Node heap prevents the SSR build from exhausting the default heap.
The GitHub Actions workflow is a manual fallback and requires its own repository
secrets; it does not run on pushes to avoid duplicate deployments.

The production D1 database and custom domain are defined in `wrangler.jsonc`.
Migrations 0000–0003 were applied at launch and recorded in `d1_migrations`.
Keep the runtime `BETTER_AUTH_SECRET` in Cloudflare secrets, never in Git.
R2 cloud uploads are disabled; audio conversion and MIDI export run locally in
the browser. Paid plans remain disabled.
