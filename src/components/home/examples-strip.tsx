import Container from '@/components/layout/container';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { EXAMPLES } from '@/lib/midi/examples';
import { Routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { IconArrowRight } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';

export function ExamplesStripSection() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Hear it before you use it
          </h2>
          <p className="mt-3 text-muted-foreground">
            Three clips made for this site, including one the model handles
            badly. Listen, then run them through the converter yourself.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-3">
          {EXAMPLES.map((example) => (
            <div key={example.slug} className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{example.shortLabel}</h3>
                {example.kind === 'limitation' && (
                  <Badge variant="outline">Hard case</Badge>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {example.description}
              </p>
              {/* biome-ignore lint/a11y/useMediaCaption: instrumental audio with no speech */}
              <audio
                controls
                preload="none"
                src={example.audioUrl}
                className="mt-4 w-full"
              />
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to={Routes.Examples}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            See the full results and test conditions
            <IconArrowRight className="ml-1 size-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
