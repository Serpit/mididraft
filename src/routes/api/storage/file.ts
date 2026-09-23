import { createFileRoute } from '@tanstack/react-router';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { auth } from '@/auth/auth';
import { getDb } from '@/db';
import { userFiles } from '@/db/app.schema';
import { eq } from 'drizzle-orm';
import { getFile } from '@/storage';
import { ConfigurationError } from '@/storage/types';

/**
 * Serves a file by key via the storage provider (same-origin proxy URL).
 * Checks ownership for private files.
 */
export const Route = createFileRoute('/api/storage/file')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const key = url.searchParams.get('key');
        if (!key || key.includes('..')) {
          return new Response('Bad Request', { status: 400 });
        }

        try {
          const headers = getRequestHeaders();
          const session = await auth.api.getSession({ headers });
          const userId = session?.user?.id;

          const db = getDb();
          const [fileRecord] = await db
            .select({ userId: userFiles.userId, isPublic: userFiles.isPublic })
            .from(userFiles)
            .where(eq(userFiles.r2Key, key))
            .limit(1);

          if (fileRecord) {
            if (!fileRecord.isPublic) {
              if (!userId || fileRecord.userId !== userId) {
                return new Response('Forbidden', { status: 403 });
              }
            }
          }

          const file = await getFile(key);
          if (!file) {
            return new Response('Not Found', { status: 404 });
          }

          // Only allow safe content types to be rendered inline;
          // force download for everything else to prevent stored XSS.
          const safeInlineTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/bmp',
            'image/x-icon',
            'image/svg+xml',
            'application/pdf',
          ];
          const responseHeaders: Record<string, string> = {
            'Content-Type': file.contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          };
          if (!safeInlineTypes.includes(file.contentType)) {
            responseHeaders['Content-Disposition'] = 'attachment';
          }

          return new Response(file.body, { headers: responseHeaders });
        } catch (e) {
          if (e instanceof ConfigurationError) {
            return new Response('Storage not configured', { status: 503 });
          }
          throw e;
        }
      },
    },
  },
});
