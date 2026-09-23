import { HeaderSection } from '@/components/shared/header-section';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { Icon } from '@tabler/icons-react';
import {
  IconChartBar,
  IconDatabase,
  IconFingerprint,
  IconId,
} from '@tabler/icons-react';
import { useState } from 'react';

const m = {
  title: 'FEATURES',
  subtitle: 'Everything you need to ship',
  description: 'Built-in features so you can focus on your product',
  items: {
    'item-1': {
      title: 'Database',
      description:
        'Store and query your data with a powerful database layer. Supports relations, migrations, and type-safe access.',
    },
    'item-2': {
      title: 'Authentication',
      description:
        'Secure auth with email, OAuth, and magic links. Session management and role-based access built in.',
    },
    'item-3': {
      title: 'Identity',
      description:
        'User profiles, avatars, and account management. Connect multiple providers per user.',
    },
    'item-4': {
      title: 'Analytics',
      description:
        'Track usage and conversions. Dashboards and reports out of the box.',
    },
  },
};

type ImageKey = 'item-1' | 'item-2' | 'item-3' | 'item-4';

const icons: Record<ImageKey, Icon> = {
  'item-1': IconDatabase,
  'item-2': IconFingerprint,
  'item-3': IconId,
  'item-4': IconChartBar,
};

const images: Record<
  ImageKey,
  { image: string; darkImage: string; alt: string }
> = {
  'item-1': {
    image: 'https://cdn.mksaas.com/blocks/charts-light.png',
    darkImage: 'https://cdn.mksaas.com/blocks/charts.png',
    alt: 'Product Feature One',
  },
  'item-2': {
    image: 'https://cdn.mksaas.com/blocks/music-light.png',
    darkImage: 'https://cdn.mksaas.com/blocks/music.png',
    alt: 'Product Feature Two',
  },
  'item-3': {
    image: 'https://cdn.mksaas.com/blocks/mail2-light.png',
    darkImage: 'https://cdn.mksaas.com/blocks/mail2.png',
    alt: 'Product Feature Three',
  },
  'item-4': {
    image: 'https://cdn.mksaas.com/blocks/payments-light.png',
    darkImage: 'https://cdn.mksaas.com/blocks/payments.png',
    alt: 'Product Feature Four',
  },
};

export default function FeaturesSection() {
  const [activeItem, setActiveItem] = useState<ImageKey>('item-1');

  return (
    <section id="features" className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-2 lg:px-0 space-y-8 lg:space-y-20 dark:[--color-border:color-mix(in_oklab,var(--color-white)_10%,transparent)]">
        <ScrollReveal>
          <HeaderSection
            title={m.title}
            subtitle={m.subtitle}
            description={m.description}
          />
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-24">
            <div className="flex flex-col gap-8 lg:col-span-5">
              <div className="text-left lg:pr-0">
                <h3 className="py-1 text-3xl font-semibold leading-normal text-foreground lg:text-4xl">
                  {m.title}
                </h3>
                <p className="mt-4 text-muted-foreground">{m.description}</p>
              </div>
              <Accordion
                value={[activeItem]}
                onValueChange={(v) =>
                  setActiveItem((v?.[0] as ImageKey) ?? 'item-1')
                }
                className="w-full"
              >
                {(Object.keys(m.items) as ImageKey[]).map((key) => {
                  const ItemIcon = icons[key];
                  return (
                    <AccordionItem key={key} value={key}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-2 text-base">
                          <ItemIcon className="size-4" />
                          {m.items[key].title}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {m.items[key].description}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>

            <div className="relative flex w-full overflow-hidden rounded-2xl border bg-background p-2 lg:col-span-7 lg:h-auto">
              <div className="relative w-full rounded-2xl aspect-76/59 bg-background">
                <div
                  key={activeItem}
                  className="animate-crossfade-in size-full overflow-hidden rounded-2xl border bg-muted shadow-md"
                >
                  <img
                    src={images[activeItem].image}
                    alt={images[activeItem].alt}
                    loading="lazy"
                    className="size-full object-cover object-top-left rounded-2xl dark:hidden"
                  />
                  <img
                    src={images[activeItem].darkImage}
                    alt={images[activeItem].alt}
                    loading="lazy"
                    className="hidden size-full object-cover object-top-left rounded-2xl dark:block"
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
