import { DEFAULT_AVATARS_FOLDER } from './constants';

/**
 * Public folders – files in these folders are shared/public resources:
 * - No userId scoping (stored directly under folder/)
 * - No userFiles DB record
 *
 * Add new folder prefixes here when needed.
 */
export const PUBLIC_FOLDERS: readonly string[] = [
  DEFAULT_AVATARS_FOLDER,
] as const;

/**
 * Check if a folder is a public folder (shared resource, no user scoping).
 */
export function isPublicFolder(folder?: string): boolean {
  if (!folder) return false;
  return PUBLIC_FOLDERS.some(
    (pf) => folder === pf || folder.startsWith(`${pf}/`)
  );
}
