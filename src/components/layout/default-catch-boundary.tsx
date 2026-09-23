import { Link } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { Logo } from '@/components/shared/logo';
import { buttonVariants } from '@/components/ui/button';
import { messages } from '@/messages';
import { cn } from '@/lib/utils';

const m = messages.catchBoundary;

/**
 * Default catch boundary for TanStack Router.
 * Layout and styling aligned with NotFound for consistency.
 */
export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const message = error?.message ?? m.description;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-4">
      <Logo className="size-12" />
      <h1 className="text-4xl font-bold">{m.title}</h1>
      <p className="text-balance text-center text-xl font-medium text-muted-foreground">
        {message}
      </p>
      <Link
        to="/"
        className={cn(buttonVariants({ size: 'lg', variant: 'default' }))}
      >
        {m.backToHome}
      </Link>
    </div>
  );
}
