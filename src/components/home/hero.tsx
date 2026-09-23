import { Converter } from '@/components/converter/converter';
import Container from '@/components/layout/container';
import { productConfig } from '@/config/product';
import { Routes } from '@/lib/routes';
import { Link } from '@tanstack/react-router';
import { IconCheck } from '@tabler/icons-react';

const POINTS = [
  'Free export, no account',
  'Runs in your browser',
  'MP3, WAV, FLAC, M4A',
];

/**
 * The homepage hero is the tool.
 *
 * The plan is explicit about this: get the user converting, do not spend the
 * first screen on brand animation, and do not build a second /audio-to-midi
 * page that competes with this one.
 */
export function HeroSection() {
  return (
    <section id="converter" className="border-b bg-muted/20">
      <Container className="px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Turn MP3 &amp; WAV into Editable MIDI
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
            {productConfig.positioning} Drop in a clear loop, hear the MIDI
            against the original, fix what the model got wrong, and download a
            standard <code className="text-foreground">.mid</code> file — free.
          </p>

          <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-1.5">
                <IconCheck className="size-4 text-primary" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto mt-8 max-w-5xl">
          <Converter />
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-muted-foreground">
          Best on a clear single instrument or one melody line. Dense mixes and
          heavy reverb give a rough sketch at best —{' '}
          <Link
            to={Routes.Examples}
            className="underline underline-offset-2 hover:text-foreground"
          >
            hear an example of that
          </Link>{' '}
          before you decide whether this fits your material.
        </p>
      </Container>
    </section>
  );
}
