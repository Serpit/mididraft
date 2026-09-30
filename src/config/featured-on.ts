/**
 * Directories that list MidiDraft and require a link back as the condition
 * of their free tier. Their checks look for a plain followed link to the
 * exact URL below, so keep the href unchanged and do not add `nofollow`.
 * Remove an entry only after its listing has been withdrawn.
 */
export const FEATURED_ON = [
  { name: 'MossAI Tools', href: 'https://mossai.org' },
  { name: 'Toolso.AI', href: 'https://toolso.ai' },
  { name: 'TopAIHubs', href: 'https://topaihubs.com' },
] as const;
