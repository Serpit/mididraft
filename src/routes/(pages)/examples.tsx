import Container from '@/components/layout/container';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { websiteConfig } from '@/config/website';
import { EXAMPLES } from '@/lib/midi/examples';
import { Routes } from '@/lib/routes';
import { seo } from '@/lib/seo';
import { cn } from '@/lib/utils';
import { IconArrowRight, IconDownload } from '@tabler/icons-react';
import { Link, createFileRoute } from '@tanstack/react-router';

const title = 'Examples';
const description =
  'Three original clips run through MidiDraft, with the test conditions and what to expect from each — including one the model handles badly.';

export const Route = createFileRoute('/(pages)/examples')({
  head: () =>
    seo('/examples', {
      title: `Audio to MIDI examples — what converts well and what does not | ${websiteConfig.metadata?.name}`,
      description,
      keywords:
        'audio to midi example, mp3 to midi example, audio to midi accuracy, basic pitch example',
    }),
  component: ExamplesPage,
});

function ExamplesPage() {
  return (
    <Container className="px-4 py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{description}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          Every clip here was synthesised from scratch for this site, so there
          are no third-party rights on them and you are free to re-run the test
          yourself. Nothing on this page is a claimed accuracy figure — open a
          clip in the converter and judge the result with your own ears.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-3xl space-y-8">
        {EXAMPLES.map((example) => (
          <article
            key={example.slug}
            className="rounded-xl border bg-card p-6 sm:p-8"
          >
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold">{example.title}</h2>
              {example.kind === 'limitation' && (
                <Badge variant="outline">Hard case</Badge>
              )}
            </div>

            <p className="mt-3 text-muted-foreground">{example.description}</p>

            {/* biome-ignore lint/a11y/useMediaCaption: instrumental audio with no speech */}
            <audio
              controls
              preload="none"
              src={example.audioUrl}
              className="mt-5 w-full"
            />

            <dl className="mt-6 space-y-4 text-sm">
              <div>
                <dt className="font-medium">What to expect</dt>
                <dd className="mt-1 leading-relaxed text-muted-foreground">
                  {example.expectation}
                </dd>
              </div>
              <div>
                <dt className="font-medium">Test conditions</dt>
                <dd className="mt-1 leading-relaxed text-muted-foreground">
                  {example.conditions}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={Routes.Root}
                className={cn(buttonVariants({ size: 'sm' }))}
              >
                Convert this in the browser
                <IconArrowRight className="ml-1 size-4" />
              </Link>
              <a
                href={example.audioUrl}
                download={example.fileName}
                className={cn(
                  buttonVariants({ size: 'sm', variant: 'outline' })
                )}
              >
                <IconDownload className="mr-1 size-4" />
                Download the source audio
              </a>
            </div>
          </article>
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-3xl rounded-xl border border-dashed bg-muted/30 p-6">
        <h2 className="font-semibold">Why there is no accuracy percentage</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A single number hides the thing that matters: which material works.
          Three clips are not a benchmark either — they are a way to hear the
          shape of the output before you spend time on it. If you want to know
          whether your own material converts, the honest test is to run thirty
          seconds of it through the free converter, which costs you nothing and
          needs no account.
        </p>
        <Link
          to={Routes.GuideImproveResults}
          className="mt-4 inline-block text-sm underline underline-offset-2"
        >
          What makes a take convert well
        </Link>
      </div>
    </Container>
  );
}
