import Container from '@/components/layout/container';
import { GUIDES } from '@/config/guides';
import { websiteConfig } from '@/config/website';
import { getSortedPosts } from '@/lib/blog';
import { Routes } from '@/lib/routes';
import { seo } from '@/lib/seo';
import { IconArrowRight } from '@tabler/icons-react';
import { Link, createFileRoute } from '@tanstack/react-router';

const description =
  'Step-by-step audio to MIDI guides for FL Studio, Ableton Live, Logic Pro and GarageBand, plus what decides whether a recording converts well.';

export const Route = createFileRoute('/(pages)/guides/')({
  head: () =>
    seo('/guides', {
      title: `Audio to MIDI guides for your DAW | ${websiteConfig.metadata?.name}`,
      description,
      keywords:
        'audio to midi guide, audio to midi tutorial, mp3 to midi daw, import midi daw',
    }),
  component: GuidesPage,
});

/**
 * The single way in to everything written for reading rather than doing.
 * How-to guides come first; the blog posts are background on why conversion
 * behaves the way it does, so they sit underneath instead of on their own nav
 * entry.
 */
function GuidesPage() {
  const posts = websiteConfig.blog?.enable ? getSortedPosts() : [];

  return (
    <Container className="px-4 py-14">
      <div className="mx-auto max-w-3xl">
        <p className="st-eyebrow">Guides</p>
        <h1 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">
          Audio to MIDI, in the DAW you already use
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{description}</p>
        <p className="mt-4 text-muted-foreground">
          Each one uses the free{' '}
          <Link to={Routes.Root} className="text-foreground underline">
            audio to MIDI converter
          </Link>{' '}
          on the homepage for the conversion, then covers the part that differs
          between DAWs: getting the <code>.mid</code> in at the right tempo.
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {GUIDES.map((guide) => (
            <li key={guide.href}>
              <Link
                to={guide.href}
                className="st-card group flex h-full flex-col p-5 transition-colors hover:border-foreground/30"
              >
                <guide.icon className="size-5 text-muted-foreground" />
                <h2 className="mt-3 font-medium">{guide.title}</h2>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {guide.description}
                </p>
                <span className="mt-4 inline-flex items-center text-sm">
                  Read the guide
                  <IconArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {posts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-medium tracking-tight">
              Background reading
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Why conversion behaves the way it does. Useful once, not needed
              every time.
            </p>
            <ul className="mt-6 divide-y border-y">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link
                    to="/blog/$slug"
                    params={{ slug: post.slug }}
                    className="block py-4 hover:text-foreground"
                  >
                    <span className="font-medium">{post.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                      {post.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Container>
  );
}
