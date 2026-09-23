import Container from '@/components/layout/container';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { IconArrowRight } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';

interface NotLaunchedProps {
  title: string;
  /** What the feature will do, described in the present tense of the plan. */
  summary: string;
  /** The concrete things it will do, so the scope is on the record. */
  scope: string[];
  /** What has to be true before this page goes live. */
  gate: string;
}

/**
 * Placeholder for a page whose feature is not built.
 *
 * The plan is firm that unfinished pages must not be published — so this page
 * is `noindex`, absent from the nav and absent from the sitemap. It exists so
 * the route and its copy can be reviewed before launch, not to collect traffic
 * for something that does not work.
 */
export function NotLaunched({ title, summary, scope, gate }: NotLaunchedProps) {
  return (
    <Container className="px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <Badge variant="outline">Not built yet</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{summary}</p>

        <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Planned scope
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {scope.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="text-primary">
                •
              </span>
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded-lg border border-dashed bg-muted/30 p-5">
          <h2 className="text-sm font-semibold">Before this page goes live</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {gate}
          </p>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Meanwhile, the free single-file converter is finished and does the
          whole job, including the MIDI download.
        </p>

        <Link to={Routes.Root} className={cn(buttonVariants(), 'mt-5')}>
          Use the converter
          <IconArrowRight className="ml-1 size-4" />
        </Link>
      </div>
    </Container>
  );
}
