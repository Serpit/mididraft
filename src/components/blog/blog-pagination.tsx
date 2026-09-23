import { Link } from '@tanstack/react-router';
import { messages } from '@/messages';

export function BlogPagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const prevPage = currentPage - 1;
  const nextPage = currentPage + 1;

  return (
    <nav
      className="mt-8 flex items-center justify-center gap-2"
      aria-label="Blog pagination"
    >
      {currentPage > 1 ? (
        <Link
          to="/blog"
          search={prevPage <= 1 ? { page: undefined } : { page: prevPage }}
          className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          {messages.blog.previous}
        </Link>
      ) : (
        <span className="inline-flex cursor-not-allowed items-center rounded-lg border border-border px-4 py-2 text-muted-foreground text-sm">
          {messages.blog.previous}
        </span>
      )}
      <span className="px-2 text-muted-foreground text-sm">
        {messages.blog.page} {currentPage} {messages.blog.of} {totalPages}
      </span>
      {currentPage < totalPages ? (
        <Link
          to="/blog"
          search={{ page: nextPage }}
          className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          {messages.blog.next}
        </Link>
      ) : (
        <span className="inline-flex cursor-not-allowed items-center rounded-lg border border-border px-4 py-2 text-muted-foreground text-sm">
          {messages.blog.next}
        </span>
      )}
    </nav>
  );
}
