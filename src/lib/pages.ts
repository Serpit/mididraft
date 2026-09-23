import { allPages } from 'content-collections';
import type { Page } from 'content-collections';

export type PageDoc = Page & { slug: string };

export function getPageBySlug(slug: string): PageDoc | undefined {
  return (allPages as PageDoc[]).find((p) => p.slug === slug);
}
