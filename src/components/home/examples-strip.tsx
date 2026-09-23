import Container from '@/components/layout/container';
import { Button, buttonVariants } from '@/components/ui/button';
import { EXAMPLES } from '@/lib/midi/examples';
import { Routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { IconArrowRight, IconArrowUp } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';

/**
 * Before and after, on one card.
 *
 * "Listen" plays the recording. "Convert it" sends the same clip to the
 * converter at the top of the page and runs it, so the after is the real
 * thing rather than a rendering we prepared earlier. Making someone scroll
 * back up and hunt for the right button would break the whole point of the
 * section.
 */
export function ExamplesStripSection() {
  const loadExample = (url: string, name: string) => {
    window.dispatchEvent(
      new CustomEvent('mididraft:load-example', { detail: { url, name } })
    );
  };

  return (
    <section id="examples" className="border-b border-hairline py-16 sm:py-20">
      <Container className="px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="st-eyebrow">Before and after</p>
          <h2 className="mt-3 text-balance text-2xl font-medium tracking-tight sm:text-3xl">
            Hear it before you use it
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Three clips made for this site, including one the model handles
            badly. Play the recording, then convert the same clip and listen to
            what comes back.
          </p>
        </div>

        <ul className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-3">
          {EXAMPLES.map((example) => (
            <li key={example.slug} className="st-card flex flex-col p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{example.shortLabel}</h3>
                {example.kind === 'limitation' && (
                  <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                    Hard case
                  </span>
                )}
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {example.description}
              </p>

              <p className="st-eyebrow mt-4 flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="st-key-audio size-2 rounded-full"
                />
                Original
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
                className="mt-4 h-11 w-full rounded-full bg-surface-strong"
                onClick={() => loadExample(example.audioUrl, example.fileName)}
              >
                <IconArrowUp className="mr-1.5 size-4" />
                Convert it and listen
              </Button>
            </li>
          ))}
        </ul>

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
