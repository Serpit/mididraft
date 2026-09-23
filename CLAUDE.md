# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MidiDraft** — an audio-to-MIDI converter site for music producers. Built on the
TanStarter (mkfast-template) boilerplate: TanStack Start + React 19 on Cloudflare
Workers, with auth (Better Auth), payments (Stripe / Creem), email, R2 storage, D1
via Drizzle, blog (Content Collections) and an admin dashboard inherited from it.

### What this product is

Convert MP3/WAV to an editable MIDI draft, compare it against the original by ear,
clean it up, and download a standard `.mid`. **The conversion runs entirely in the
browser** — audio is never uploaded. The free tier is the complete job, not a trial.

Scope decisions live in `src/config/product.ts`, taken from the 90-day plan:

- The **homepage is the tool**. Do not add a `/audio-to-midi` page to compete with it.
- Instrument keywords (`voice to midi`, `guitar to midi`) are homepage sections, not
  separate pages, until search data shows a genuinely different task.
- `productConfig.features` gates unfinished features. A page whose feature is off
  renders `NotLaunched`, is `noindex`, and is absent from the nav and sitemap.
  **Do not publish a page for a feature that does not work.**
- Paid plans are priced but not on sale; `features.paidPlans` is false.

### Converter architecture (`src/lib/midi/`)

| File | Role |
|------|------|
| `audio.ts` | Decode, mix to mono, slice a segment, resample to 22050 Hz, waveform peaks |
| `transcribe.ts` | Lazy-loads `@spotify/basic-pitch`; `analyze()` runs the model, `notesFromOutput()` derives notes |
| `cleanup.ts` | Pure note transforms (short/quiet removal, merge, overlap trim, quantize) plus stats and tempo estimation |
| `export.ts` | `.mid` writing via `@tonejs/midi`, and reading a `.mid` back |
| `player.ts` | A/B preview: original audio vs a WebAudio synth of the notes, sharing one playhead |
| `examples.ts` | The three demo clips, including one deliberate failure case |

Two things to preserve when changing this:

1. **Inference is split from note extraction.** `analyze()` is expensive and runs once
   per segment; threshold changes re-run only `notesFromOutput()`. Do not collapse them.
2. **Everything is client-side.** `basic-pitch` and TensorFlow.js load through a dynamic
   `import()` so they stay out of the entry bundle. Never import them at module scope.

The model is served from `public/models/basic-pitch/`, copied from the npm package.
Re-copy it after upgrading `@spotify/basic-pitch`. Do not add `@tensorflow/tfjs` as a
direct dependency — basic-pitch pins its own version and a second copy re-registers
every kernel.

### Content and claims

Copy on this site states limitations plainly and avoids accuracy percentages. The
examples page ships a clip the model handles badly on purpose. Keep it that way.

## Commands

```bash
pnpm dev                    # Dev server on port 3000
pnpm build                  # Production build
pnpm deploy                 # Build + deploy to Cloudflare Workers

pnpm lint                   # Biome lint + format with auto-fix
pnpm check                  # Biome lint (read-only, no auto-fix)
pnpm format                 # Biome format only
pnpm knip                   # Find unused exports/dependencies

pnpm db:generate            # Generate Drizzle migrations from schema
pnpm db:migrate:local       # Apply migrations to local D1
pnpm db:migrate:remote      # Apply migrations to remote D1
pnpm db:studio:local        # Open Drizzle Studio (local)
pnpm db:studio:remote       # Open Drizzle Studio (remote)

pnpm auth:schema:generate   # Regenerate Better Auth schema → src/db/auth.schema.ts
pnpm email:dev              # React Email preview on port 3333
pnpm cf-typegen             # Generate Cloudflare Worker types (also runs on postinstall)
```

No test framework is configured. Manual testing via `pnpm dev` and test routes in `src/routes/(tests)/`.

## Architecture

### Request Flow
Incoming request → Cloudflare Worker (`src/server.ts`) → TanStack Start handler → server functions execute (auth, DB, email) → React SSR → response with hydration state → client-side React hydration via TanStack Router.

### Key Architectural Patterns

- **File-based routing**: `src/routes/` maps to URL paths. `[param]` for dynamic segments, `$` for catch-all, `(group)` for layout-only groups, `__root.tsx` for root layout. Route tree auto-generates into `src/routeTree.gen.ts` — never edit this file.

- **Server functions**: Defined with `createServerFn()` from `@tanstack/react-start`. Located in `src/api/`. Support `.inputValidator()` (Zod) and `.middleware()` chains. Called directly from client code.

- **Provider pattern**: Mail, storage, newsletter, notification, and payment each use a provider abstraction (`src/*/provider/`) so implementations can be swapped (e.g., `src/mail/provider/resend.ts`, `src/storage/provider/r2.ts`).

- **Middleware**: `src/middlewares/auth-middleware.ts` (requires login) and `src/middlewares/admin-middleware.ts` (requires admin role) used with server functions.

- **Environment variables**: Client-side uses `VITE_` prefix (build-time, via `src/env/client.ts`). Server-side uses Cloudflare Worker bindings/secrets (runtime, via `src/env/server.ts`). Both validated with Zod via `@t3-oss/env-core`.

### Key Source Directories

| Directory | Purpose |
|-----------|---------|
| `src/routes/` | File-based routes (pages, API handlers, webhooks) |
| `src/api/` | Server functions (payment, users, contact, newsletter, files) |
| `src/auth/` | Better Auth config (`auth.ts` server, `client.ts` client) |
| `src/db/` | Drizzle schemas (`auth.schema.ts` auto-generated, `app.schema.ts` app tables), migrations, types |
| `src/payment/` | Stripe / Creem integration (checkout, portal, webhooks) |
| `src/mail/` | Resend / Cloudflare Email — provider, templates (React components), rendering |
| `src/storage/` | Cloudflare R2 file storage |
| `src/newsletter/` | Resend and Beehiiv newsletter via API |
| `src/notification/` | Discord/Feishu webhook notifications |
| `src/components/ui/` | shadcn/ui components (auto-generated, excluded from linting) |
| `src/config/` | Site configuration (website.ts is the main config for features, pricing, metadata) |
| `src/lib/` | Utilities (routes, SEO, formatters, markdown parsing) |
| `src/hooks/` | React hooks (auth, payment, files, etc.) |
| `content/` | Markdown content (blog, pages, changelog) for Content Collections |
| `docs/` | Module-specific documentation (auth, db, payment, mail, storage, env, design) |

### Database

Two schema files merged in `src/db/schema.ts`:
- `auth.schema.ts` — auto-generated by Better Auth (user, session, account, verification, apiKey)
- `app.schema.ts` — application tables (userFiles, payment, etc.)

Types inferred from tables in `src/db/types.ts`. Access via `getDb()` from `src/db/index.ts`.

### Cloudflare Bindings (wrangler.jsonc)
- `DB` — D1 database binding
- `BUCKET` — R2 storage binding

## Code Style

Enforced by Biome (`biome.json`):
- 2-space indent, 80-char line width, single quotes, semicolons always, ES5 trailing commas
- Files excluded from linting: `src/components/ui/`, `src/components/data-table/`, `src/db/`, `src/routeTree.gen.ts`, type definition files

### Conventions
- **File names**: kebab-case (`use-auth.ts`, `data-table.tsx`)
- **Components**: PascalCase (`DataTable`, `LoginForm`)
- **Hooks**: camelCase with `use` prefix
- **Constants**: SCREAMING_SNAKE_CASE
- **Imports**: Use `@/` path alias for all src imports. Order: external → internal (`@/`) → relative
- **Forms**: `react-hook-form` + `@hookform/resolvers` + Zod
- **State**: TanStack Query for server state (query key factory pattern)
- **Styling**: Tailwind CSS v4 with `cn()` from `src/lib/utils.ts`, class-based dark mode
- **Icons**: `@tabler/icons-react`

### Cloudflare Workers Constraint
Avoid Node.js-specific APIs — this runs on Cloudflare Workers runtime, not Node.js.
