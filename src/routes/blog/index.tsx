import { createFileRoute, notFound } from '@tanstack/react-router';
import Container from '@/components/layout/container';
import { BlogGrid } from '@/components/blog/blog-grid';
import { BlogPagination } from '@/components/blog/blog-pagination';
import { getPaginatedPosts } from '@/lib/blog';
import { websiteConfig } from '@/config/website';
import { messages } from '@/messages';
import { seo } from '@/lib/seo';
import { getCanonicalUrl } from '@/lib/urls';

export const Route = createFileRoute('/blog/')({
  validateSearch: (search: Record<string, unknown>) => ({
    page:
      typeof search.page === 'number'
        ? search.page
        : typeof search.page === 'string'
          ? Number(search.page) || undefined
          : undefined,
  }),
  loader: ({ location }) => {
    const page = Number(new URLSearchParams(location.search).get('page')) || 1;
    return getPaginatedPosts(page);
  },
  head: ({ loaderData }) => {
    const path = '/blog';
    const currentPage = loaderData?.currentPage ?? 1;
    const totalPages = loaderData?.totalPages ?? 1;
    const pageSuffix = currentPage > 1 ? ` - Page ${currentPage}` : '';
    const metadata = seo(path, {
      title: `${messages.blog.title}${pageSuffix} | ${websiteConfig.metadata?.name}`,
      description: messages.blog.description,
    });

    // Canonicalize each paginated page to itself so Google can index them
    // independently instead of folding everything into /blog.
    const canonicalHref =
      currentPage > 1
        ? `${getCanonicalUrl(path)}?page=${currentPage}`
        : getCanonicalUrl(path);

    const paginationLinks: Array<{ rel: string; href: string }> = [
      { rel: 'canonical', href: canonicalHref },
    ];
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      paginationLinks.push({
        rel: 'prev',
        href:
          prevPage === 1
            ? getCanonicalUrl(path)
            : `${getCanonicalUrl(path)}?page=${prevPage}`,
      });
    }
    if (currentPage < totalPages) {
      paginationLinks.push({
        rel: 'next',
        href: `${getCanonicalUrl(path)}?page=${currentPage + 1}`,
      });
    }

    const blogJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: messages.blog.title,
      description: messages.blog.description,
      url: getCanonicalUrl(path),
    };
    return {
      ...metadata,
      links: paginationLinks,
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(blogJsonLd),
        },
      ],
    };
  },
  component: BlogListPage,
});

function BlogListPage() {
  const { posts, totalPages, currentPage } = Route.useLoaderData();
  if (!websiteConfig.blog?.enable) {
    throw notFound();
  }

  return (
    <Container className="py-16 px-4">
      <div className="mx-auto space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            {messages.blog.title}
          </h1>
          <p className="text-muted-foreground text-lg">
            {messages.blog.description}
          </p>
        </div>
        <BlogGrid posts={posts} />
        <BlogPagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </Container>
  );
}
