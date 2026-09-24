/**
 * Tell Bing, Yandex and the other IndexNow engines that pages changed.
 *
 *   pnpm indexnow                         # every URL in the live sitemap
 *   pnpm indexnow /guides /examples       # just these paths
 *
 * Run it after a deploy that changed page content. It reads the sitemap from
 * the live site, so deploy first. IndexNow does not reach Google; submit to
 * Search Console for that.
 *
 * The key is public by design: IndexNow proves you own the host by fetching
 * `https://<host>/<key>.txt`, which is served from `public/`. To rotate it,
 * replace that file and INDEXNOW_KEY together.
 */
const SITE = process.env.INDEXNOW_SITE ?? 'https://mididraft.com';
const INDEXNOW_KEY = 'a0ad0c83d2928de6b2f8b00bc22a974a';

async function sitemapUrls(): Promise<string[]> {
  const res = await fetch(`${SITE}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml: HTTP ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

async function main() {
  const paths = process.argv.slice(2);
  const urlList = paths.length
    ? paths.map((path) => new URL(path, SITE).toString())
    : await sitemapUrls();

  const keyLocation = `${SITE}/${INDEXNOW_KEY}.txt`;
  const keyRes = await fetch(keyLocation);
  if (!keyRes.ok || (await keyRes.text()).trim() !== INDEXNOW_KEY) {
    throw new Error(`${keyLocation} is not serving the key; deploy first.`);
  }

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: new URL(SITE).host,
      key: INDEXNOW_KEY,
      keyLocation,
      urlList,
    }),
  });

  // 200 and 202 both mean accepted; 202 is "key not verified yet".
  if (res.status !== 200 && res.status !== 202) {
    throw new Error(`IndexNow: HTTP ${res.status} ${await res.text()}`);
  }
  console.log(`IndexNow accepted ${urlList.length} URLs (HTTP ${res.status})`);
  for (const url of urlList) console.log(`  ${url}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
