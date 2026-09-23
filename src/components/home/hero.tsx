import { Converter } from '@/components/converter/converter';
import Container from '@/components/layout/container';
import { productConfig } from '@/config/product';
import { Routes } from '@/lib/routes';
import { Link } from '@tanstack/react-router';

/**
 * The homepage hero is the tool.
 *
 * The plan is explicit about this: get the user converting, do not spend the
 * first screen on brand animation, and do not build a second /audio-to-midi
 * page that competes with this one.
 *
 * On this branch the heading is short and centred and the card is directly
 * underneath, because the job of the first screen is to make the next step
 * obvious to someone who has never used an audio-to-MIDI tool before.
 */
export function HeroSection() {
  return (
    <section id="converter" className="border-b border-hairline">
      <Container className="px-4 py-10 sm:py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-balance text-3xl font-medium tracking-tight sm:text-4xl">
            Turn MP3 &amp; WAV into editable MIDI
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-balance leading-relaxed text-muted-foreground sm:text-lg">
            {productConfig.positioning}
          </p>
        </div>

        <div className="mx-auto mt-7 max-w-3xl">
          <Converter />
        </div>

        <p className="mx-auto mt-8 max-w-xl text-center leading-relaxed text-muted-foreground">
          Best on a clear single instrument or one melody line. Dense mixes and
          heavy reverb give a rough sketch at best —{' '}
          <Link
            to={Routes.Examples}
            className="text-foreground underline underline-offset-4"
          >
            hear an example of that
          </Link>{' '}
          before you decide whether this fits your material.
        </p>
      </Container>
    </section>
  );
}
