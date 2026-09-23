# MidiDraft

Turn audio ideas into editable MIDI drafts, then clean and export them for your DAW.

A focused audio-to-MIDI converter for music producers. Drop in an MP3 or WAV,
hear the transcription against the original, fix what the model got wrong, and
download a standard `.mid` file. **The conversion runs in the browser — audio is
never uploaded.**

Built on the [TanStarter](https://tanstarter.dev) boilerplate (TanStack Start +
React 19 on Cloudflare Workers).

## Run it locally

```bash
pnpm install
cp .env.example .env   # only VITE_BASE_URL is needed for the converter
pnpm dev
```

Then open http://localhost:3000. The converter works with no configuration — no
database, no API keys, no payment provider. Auth, email, storage and payments
come from the boilerplate and need their own setup before they do anything.

## What is built

| Area | Status |
|------|--------|
| Free single-file converter | Done — decode, segment select, transcribe, A/B preview, piano roll, cleanup, `.mid` export |
| Marketing and SEO pages | Done — homepage tool, examples, pricing, 3 guides, legal, blog, sitemap, JSON-LD |
| Batch conversion | Not built. `/batch-audio-to-midi` is `noindex` and unlisted |
| Cleanup presets | Not built. `/midi-cleanup` is `noindex` and unlisted |
| Paid checkout | Not wired up. Prices are published, buttons disabled |

Scope, phases, pricing and the day-90 decision rules come from the 90-day plan,
recorded in [`docs/plan.md`](docs/plan.md) (source: Feishu doc linked there).
Product analytics and the GA4 setup are in [`docs/analytics.md`](docs/analytics.md).

Feature gating lives in [`src/config/product.ts`](src/config/product.ts). Flipping
a flag to `true` adds that page to the nav and sitemap and drops the `noindex`, so
do not flip it before the feature works.

## How the converter works

Transcription uses [Spotify's Basic Pitch](https://github.com/spotify/basic-pitch-ts)
running client-side on TensorFlow.js. The model (~1 MB) is served from
`public/models/basic-pitch/` and lazy-loaded on first use, so it never touches the
initial page bundle.

Inference is deliberately split from note extraction: the expensive model pass runs
once per audio segment, and moving a sensitivity slider only re-derives notes from
the cached output. That is what makes the detection controls feel immediate.

See [`src/lib/midi/`](src/lib/midi/) and the architecture notes in
[CLAUDE.md](CLAUDE.md).

## Example clips

The three clips in `public/examples/` are synthesised from scratch by
`scripts`-style generation, so they carry no third-party rights. One of them —
dense chords with reverb — is included specifically because the model handles it
badly. Shipping only the wins would not tell anyone whether the tool works on
their material.

## Commands

```bash
pnpm dev          # dev server on port 3000
pnpm build        # production build
pnpm deploy       # build + deploy to Cloudflare Workers
pnpm lint         # Biome lint + format, with auto-fix
pnpm check        # Biome, read-only
```

## License

The boilerplate is covered by its own [LICENSE](LICENSE).
