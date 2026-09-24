import { Link } from '@tanstack/react-router';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BottomLinkProps {
  href: string;
  label: string;
}

export function BottomLink({ href, label }: BottomLinkProps) {
  const className = cn(
    buttonVariants({ variant: 'link', size: 'sm' }),
    'font-normal w-full text-muted-foreground hover:underline underline-offset-4 hover:text-primary'
  );
  // Router links take the path alone; one carrying a query (a callbackUrl to
  // return to) is a plain link.
  if (href.includes('?')) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link to={href} className={className}>
      {label}
    </Link>
  );
}
