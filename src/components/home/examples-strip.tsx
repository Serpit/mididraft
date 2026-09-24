import Container from '@/components/layout/container';
import { Button, buttonVariants } from '@/components/ui/button';
import { type Example, getExample } from '@/lib/midi/examples';
import { Routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import {
  IconArrowRight,
  IconArrowUp,
  IconGuitarPick,
  IconMicrophone,
  IconPiano,
} from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import type { ComponentType } from 'react';

/**
 * Voice, piano and guitar, each with its own before and after.
 *
 * These are the three instruments people search for by name ("voice to midi",
 * "piano to midi", "guitar to midi"), and the three behave differently enough
 * that one generic paragraph would not help anyone. They are sections of the
 * homepage rather than pages of their own until search data shows a
 * genuinely different task.
 *
 * "Listen" plays the recording. "Convert it" sends the same clip to the
 * converter at the top of the page and runs it, so the after is the real
 * thing — heard through the converter's Original / MIDI switch — rather than
 * a rendering we prepared earlier.
 */
interface Scene {
  id: string;
  icon: ComponentType<{ className?: string }>;
  heading: string;
  intro: string;
  goodAt: string;
  watchFor: string[];
  example: Example;
}

function mustGetExample(slug: string): Example {
  const example = getExample(slug);
  if (!example) throw new Error(`Missing example clip: ${slug}`);
  return example;
}

const SCENES: Scene[] = [
  {
    id: 'voice-to-midi',
    icon: IconMicrophone,
    heading: 'Voice to MIDI',
    intro:
      'Hum, sing or whistle the idea into your phone, then turn the vocal melody into MIDI notes you can put on any instrument.',
    goodAt:
      'One voice, close to the mic, in a quiet room, with no backing track playing.',
    watchFor: [
      'Vibrato on a held note can chop it into several short notes of the same pitch. "Merge repeated notes" joins them back up.',
      'A vocal inside a finished song converts along with everything else in the mix. Use an isolated vocal stem; this tool does not separate stems.',
    ],
    example: mustGetExample('vocal-line'),
  },
  {
    id: 'piano-to-midi',
    icon: IconPiano,
    heading: 'Piano to MIDI',
    intro:
      'Turn a recorded piano part — a melody, a bass line, a simple chord pattern — back into notes you can edit, re-voice or quantize.',
    goodAt:
      'Single-note lines and sparse chords from a dry recording or a bounced piano plugin.',
    watchFor: [
      'Sustain pedal makes notes ring long; expect to trim note ends.',
      'Dense voicings lose inner notes, and a strong overtone can show up an octave above the note you played.',
    ],
    example: mustGetExample('piano-melody'),
  },
  {
    id: 'guitar-to-midi',
    icon: IconGuitarPick,
    heading: 'Guitar to MIDI',
    intro:
      'Record a riff or an arpeggio and get it as MIDI, so you can double it with a synth or rewrite it in the piano roll.',
    goodAt:
      'A clean or DI signal, single notes and picked arpeggios, recorded without effects.',
    watchFor: [
      'Strings ringing into each other come out as overlapping, longer notes. "Trim overlaps" and "merge repeated notes" help.',
      'Distortion adds so many harmonics that the notes underneath get lost. Convert the DI track, not the amp sound.',
    ],
    example: mustGetExample('guitar-arpeggio'),
  },
];

const HARD_CASE = mustGetExample('dense-mix');

function loadExample(example: Example) {
  window.dispatchEvent(
    new CustomEvent('mididraft:load-example', {
      detail: { url: example.audioUrl, name: example.fileName },
    })
  );
}

function ExamplePlayer({ example }: { example: Example }) {
  return (
    <div className="flex flex-col">
      <p className="st-eyebrow flex items-center gap-2">
        <span aria-hidden="true" className="st-key-audio size-2 rounded-full" />
        Original: {example.shortLabel.toLowerCase()}
      </p>
      {/* biome-ignore lint/a11y/useMediaCaption: instrumental audio with no speech */}
      <audio
        controls
        preload="none"
        src={example.audioUrl}
        className="mt-2 w-full"
      />
      <Button
        type="button"
        variant="outline"
        className="mt-3 h-11 w-full rounded-full bg-surface-strong"
        onClick={() => loadExample(example)}
      >
        <IconArrowUp className="mr-1.5 size-4" />
        Convert it and compare
      </Button>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Runs in the converter above. Flip Original / MIDI while it plays to hear
        the difference.
      </p>
    </div>
  );
}

export function ExamplesStripSection() {
  return (
    <section id="examples" className="border-b border-hairline py-16 sm:py-20">
      <Container className="px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="st-eyebrow">Before and after</p>
          <h2 className="mt-3 text-balance text-2xl font-medium tracking-tight sm:text-3xl">
            Audio to MIDI for voice, piano and guitar
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Each instrument fails in its own way, so each gets its own clip.
            Play the recording, then convert the same clip and compare it with
            the MIDI. The last one is a case the model handles badly, on
            purpose.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-5xl space-y-5">
          {SCENES.map((scene) => (
            <article
              key={scene.id}
              id={scene.id}
              className="st-card grid scroll-mt-20 gap-6 p-5 sm:p-6 md:grid-cols-[1fr_18rem]"
            >
              <div>
                <h3 className="flex items-center gap-2 text-lg font-medium">
                  <scene.icon className="size-5 text-muted-foreground" />
                  {scene.heading}
                </h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {scene.intro}
                </p>
                <p className="mt-4 text-sm leading-relaxed">
                  <span className="font-medium">Works best on: </span>
                  <span className="text-muted-foreground">{scene.goodAt}</span>
                </p>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                  {scene.watchFor.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
              <ExamplePlayer example={scene.example} />
            </article>
          ))}

          <article className="st-card grid gap-6 p-5 sm:p-6 md:grid-cols-[1fr_18rem]">
            <div>
              <h3 className="flex flex-wrap items-center gap-2 text-lg font-medium">
                A full mix
                <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                  Hard case
                </span>
              </h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {HARD_CASE.description}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {HARD_CASE.expectation}
              </p>
            </div>
            <ExamplePlayer example={HARD_CASE} />
          </article>
        </div>

        <div className="mt-8 text-center">
          <Link
            to={Routes.Examples}
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'h-11 rounded-full'
            )}
          >
            See the full results and test conditions
            <IconArrowRight className="ml-1.5 size-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
