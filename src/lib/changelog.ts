import { allChangelogs } from 'content-collections';
import type { Changelog } from 'content-collections';

export type ChangelogRelease = Changelog & { slug: string };

export function getChangelogReleases(): ChangelogRelease[] {
  return [...(allChangelogs as ChangelogRelease[])]
    .filter((r) => r.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
