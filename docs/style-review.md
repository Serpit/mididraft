# Design C — warm-white audio tool

Branch: `design/elevenlabs-studio`
Baseline: `063d947049182469f49dc62a44af78a8c1af9b61` (`master`, "Initial commit")
Default theme: **light**. Dark is fully supported and shipped.

Preview:

```bash
cd /Users/serpit/space/music-web-styles/c-elevenlabs && pnpm dev
```

`pnpm dev` binds port 3000. The screenshots below were captured against
`pnpm exec vite dev --port 3103`.

## What this version is trying to be

The version built for the first ten minutes. One column, one obvious next
step, and nothing on screen the visitor has not asked for yet. Soft cards,
pill actions, a lot of air, and secondary controls that stay closed until
someone wants them.

### Tokens

| | Light (default) | Dark |
|---|---|---|
| Canvas | `#FDFCFC` | `#131211` |
| Card | `#F5F3F1` | `#1E1C1A` |
| Inner surface | `#FFFFFF` | `#262320` |
| Hairline | `#E6E2DE` | `#322E2B` |
| Primary button | `#121110` on `#FAF9F8` | inverted |
| Original audio | `#2F6FEB` | `#7BA5FF` |
| Transcribed MIDI | `#D8551D` | `#FF8A4C` |

Cards are 20–24px, actions are pills. `--radius-md` stays a normal 10px rather
than becoming a pill: the inherited template uses `rounded-md` for dropdowns
and inputs too, and a pill-shaped dropdown is not softness, it is a bug. The
pill belongs to actions, and the actions ask for it by name.

**The colour system is the one real idea here.** Blue is the recording, orange
is the MIDI, and that pair appears on the waveform, the note roll, the A/B
switch and the example cards — nowhere else. Buttons stay black and white on
purpose: if every control were coloured, "blue is what you played, orange is
what the model heard" would stop meaning anything. Every swatch also sits next
to its own word, so the colour is shorthand for a label that is already on
screen rather than the only thing carrying the meaning.

**Deviations from the reference.** The reference leans on large decorative
spheres and very light heading weights. Neither is copied: the tool has to own
the first screen, and heading weight stays at `font-medium` so the copy holds
up at body sizes.

## Layout decisions

**Single column, progressive.** Nothing is beside anything else. The order is
the order you work in:

```
file name · 18s selected · stays on this device            Change file
● ORIGINAL AUDIO    waveform + segment handles
▶  ( ● Original | ● MIDI )  Loop off                        0:00 / 0:18
● TRANSCRIBED MIDI  piano roll
54 notes · B2–F4 · 244 ms median · 129 BPM
[ Adjust notes ⌄ ]                                   [ Download MIDI ]
```

**Listening comes before reading.** The A/B transport sits *above* the note
roll, not under it. Comparing the two is the only thing that tells a
first-time user whether the transcription is any good, so it is the first
control after the audio rather than something to find below a picture of
notes.

**One player, one playhead.** Switching between Original and MIDI keeps your
place; there are never two independent players. The roll doubles as the
scrubber.

**The two things they came for stay together.** *Adjust notes* and *Download
MIDI* are always on the same bar, and that bar is `sticky bottom-0`, so
opening the settings never pushes the download away — it stays pinned at the
bottom of the viewport while the parameters scroll behind it.

**Settings are grouped by the question they answer**, not by pipeline stage:
"What counts as a note" (re-reads the model output) and "What to tidy up
afterwards" (reversible, applied to the notes you can see). The panel opens
with a line stating that every change is instant and nothing is re-converted,
because that is the thing a new user is most likely to be afraid of.

**Example cards convert, they do not just play.** Each card has the recording
inline and a *Convert it and listen* button that sends the same clip to the
converter at the top of the page and runs it, via a `mididraft:load-example`
window event. "Hear the before and after" is the whole promise of that
section; making someone scroll back up and hunt for the right button would
break it.

**Vertical rhythm is tuned so the result fits one screen.** After a short
scroll, the waveform, the A/B switch, the roll, the summary and both actions
are visible together at 1440×900 (`desktop-light-05-ready-transport.png`).
That was worth trimming the hero and the roll height for.

**Homepage order** is tool → before/after → how it works → formats, limits and
privacy → FAQ. Two merges: `how-it-works` + `use-cases` became `workflow.tsx`,
and `formats` + `privacy-note` became `capabilities.tsx`.
`Routes.HowItWorks` (`/#how-it-works`) and `Routes.Formats` (`/#formats`)
still resolve.

**Navigation** lost the *Pages* dropdown (About / Contact / Privacy / Terms) —
footer material. On a first visit the nav should only offer the tool, the
proof and the guides.

## Verification

Run from this worktree.

| Check | Result |
|---|---|
| `pnpm check` | **1 pre-existing error**, unchanged from the baseline: `scripts/generate-examples.mjs:61 lint/style/useConst` plus a format diff on the same file. No `src/` findings. |
| `pnpm build` | **passes** (`✓ built`, client + server) |
| `npx tsc --noEmit` | Same three baseline files as `master` (`ui/form.tsx`, `ui/scroll-area.tsx`, `payment/provider/stripe.ts`). No new errors from this branch. |

Manual regression, driven in a real browser:

- Example clips load, decode and transcribe. `guitar-arpeggio.wav` → 54 notes,
  129 BPM, B2–F4, 244 ms median.
- Playback runs; the A/B switch changes source without losing the playhead.
- *Convert it and listen* on an example card scrolls to the converter and runs
  that clip.
- Cleanup at maximum leaves the surviving notes in orange and draws the 54
  pre-cleanup notes as ghosts, with the show/hide toggle
  (`desktop-light-07-cleanup-ghosts.png`). No model re-run.
- Every slider reports its real value: measured 53% / 30% / 21% / 49% of track
  for 0.50, 0.30, 120 ms and 129 BPM. See the second shared fix below.
- A file that cannot decode gives a readable error and keeps the drop card and
  the example buttons on screen (`desktop-light-08-error.png`).
- MIDI export round-trip through the app's own reader: pitch, start, duration
  and tempo come back intact.
- No new console errors and no hydration warnings.
- 1440 / 390 / 320: `document.scrollWidth === window.innerWidth` at every
  width — no horizontal page overflow.

### Shared fixes, synced to all three branches

Two defects turned up during verification. Neither was introduced by the
redesign; both are addressed on all three branches so the comparison stays
honest.

**1. The waveform vanished in any narrow container.** `buildWaveformPeaks`
returns a fixed 600 peaks, rendered as one flex child per peak with a 1px gap.
Below roughly 1200px each bar drops under a pixel of ink and the waveform
disappears completely — on every phone. `waveform.tsx` now measures the
container and downsamples the peaks to `floor(width / 3)` buckets, taking the
max of each.

**2. Sliders mounted inside `display: none` measured zero.** Base UI reads
slider geometry on mount, so a settings panel that was kept mounted and hidden
drew every thumb at the left end regardless of its value — *Sensitivity 0.50*
rendered as 0. On this branch the panel is now mounted only while it is open.
That costs nothing: detection, cleanup and tempo live in `converter.tsx`, not
in the panel.

## Screenshots

`/Users/serpit/space/music-web-styles/screenshots/c-elevenlabs/` — captured by
the same CDP harness as the other two branches: same clip
(`guitar-arpeggio.wav`), same viewports, explicitly pinned theme. Not
committed.

| File | State |
|---|---|
| `desktop-light-01-initial` | first screen, 1440×900 |
| `desktop-light-02-home-full` | whole page |
| `desktop-light-03-converting` | transcription in flight |
| `desktop-light-04-ready` | converted, audible, exportable |
| `desktop-light-05-ready-transport` | the whole result on one screen |
| `desktop-light-06-parameters` | settings open, actions still pinned |
| `desktop-light-07-cleanup-ghosts` | heavy cleanup, before/after overlay |
| `desktop-light-08-error` | undecodable file, recovery intact |
| `desktop-dark-09-initial`, `desktop-dark-10-ready` | dark theme |
| `mobile-light-01-initial`, `-02-ready`, `-03-parameters` | 390×844 |
| `narrow320-light-01-ready` | 320px |

## Known limitations

- The example cards' "after" is a live conversion, not a pre-rendered audio
  file. That is honest — it is the real output — but it costs the visitor a
  few seconds of model time, and on a slow machine the first one is slower
  still because the model has to download.
- `mididraft:load-example` is a window event, which is looser coupling than a
  shared store. It is deliberate (the section and the converter are on
  opposite ends of the page and share no parent), but it is the kind of thing
  that needs a comment to survive.
- Inter is used only if the visitor already has it; otherwise this renders in
  the platform UI face. Self-hosting Inter would add two WOFF2 files, which
  the repo's font policy treats as a deliberate decision rather than a default.
- The single column means the piano roll is narrower than in design A at the
  same viewport, so dense transcriptions have less horizontal room.
