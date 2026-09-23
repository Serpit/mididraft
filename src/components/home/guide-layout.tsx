import Container from '@/components/layout/container';
import { buttonVariants } from '@/components/ui/button';
import { Routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

interface GuideLayoutProps {
  title: string;
  intro: string;
  /** Kept short and honest: what the reader will have when they finish. */
  outcome: string;
  children: ReactNode;
  /** Where to send the reader next — always something they can actually do. */
  next?: { label: string; to: string };
}

export function GuideLayout({
  title,
  intro,
  outcome,
  children,
  next,
}: GuideLayoutProps) {
  return (
    <Container className="px-4 py-14">
      <article className="mx-auto max-w-3xl">
        <Link
          to={Routes.Root}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft className="mr-1 size-4" />
          Back to the converter
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{intro}</p>

        <p className="mt-6 rounded-lg border-l-2 border-primary bg-muted/40 py-3 pl-4 text-sm">
          <span className="font-medium">When you are done: </span>
          <span className="text-muted-foreground">{outcome}</span>
        </p>

        <div className="prose prose-neutral mt-10 max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-h2:text-xl prose-h3:text-base">
          {children}
        </div>

        <div className="mt-12 flex flex-wrap gap-3 border-t pt-8">
          <Link to={Routes.Root} className={cn(buttonVariants())}>
            Convert a file now
            <IconArrowRight className="ml-1 size-4" />
          </Link>
          {next && (
            <Link
              to={next.to}
              className={cn(buttonVariants({ variant: 'outline' }))}
            >
              {next.label}
            </Link>
          )}
        </div>
      </article>
    </Container>
  );
}
