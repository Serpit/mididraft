import { HeaderSection } from '@/components/shared/header-section';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Link } from '@tanstack/react-router';
import {
  IconBrandCodesandbox,
  IconBrandGoogleFilled,
  IconBrandOpenai,
  IconBrandReact,
  IconBrandVisualStudio,
  IconBrandWikipedia,
  IconChevronRight,
} from '@tabler/icons-react';
import type { Icon } from '@tabler/icons-react';

const m = {
  title: 'INTEGRATIONS',
  subtitle: 'Works with your stack',
  description: 'Connect to the tools you already use',
  learnMore: 'Learn More',
  items: {
    'item-1': {
      title: 'AI & LLMs',
      description: 'Connect to OpenAI, Anthropic, and more.',
    },
    'item-2': {
      title: 'Replit',
      description: 'Deploy and run in the cloud.',
    },
    'item-3': {
      title: 'Magic UI',
      description: 'Beautiful animated components.',
    },
    'item-4': {
      title: 'VS Codium',
      description: 'AI-powered code editor.',
    },
    'item-5': {
      title: 'MediaWiki',
      description: 'Knowledge base integration.',
    },
    'item-6': { title: 'Google PaLM', description: 'Google AI models.' },
  },
};

// Brand colors (visible on both light and dark backgrounds)
export const BRAND_COLORS = {
  openai: '#0d8c6c',
  codesandbox: '#e06a10',
  react: '#149eca',
  vs: '#0065a9',
  wikipedia: '#9c27b0',
  google: '#2a6fdb',
} as const;

const items: Array<{
  title: string;
  description: string;
  icon: Icon;
  color: string;
}> = [
  { ...m.items['item-1'], icon: IconBrandOpenai, color: BRAND_COLORS.openai },
  {
    ...m.items['item-2'],
    icon: IconBrandCodesandbox,
    color: BRAND_COLORS.codesandbox,
  },
  { ...m.items['item-3'], icon: IconBrandReact, color: BRAND_COLORS.react },
  { ...m.items['item-4'], icon: IconBrandVisualStudio, color: BRAND_COLORS.vs },
  {
    ...m.items['item-5'],
    icon: IconBrandWikipedia,
    color: BRAND_COLORS.wikipedia,
  },
  {
    ...m.items['item-6'],
    icon: IconBrandGoogleFilled,
    color: BRAND_COLORS.google,
  },
];

function IntegrationCard({
  title,
  description,
  icon: Icon,
  color,
}: {
  title: string;
  description: string;
  icon: Icon;
  color: string;
}) {
  return (
    <Card className="bg-transparent p-6 transition-colors duration-200 hover:bg-accent dark:hover:bg-card">
      <div className="relative">
        <Icon className="size-10 shrink-0" style={{ color }} />

        <div className="space-y-2 py-6">
          <h3 className="text-base font-medium">{title}</h3>
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {description}
          </p>
        </div>

        <div className="flex gap-3 border-t border-dashed pt-6">
          <Link
            to="/"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'gap-1 pr-2 shadow-none'
            )}
          >
            {m.learnMore}
            <IconChevronRight className="ml-0 size-3.5 opacity-50" />
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default function IntegrationSection() {
  return (
    <section id="integration" className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <HeaderSection
            title={m.title}
            subtitle={m.subtitle}
            description={m.description}
          />
        </ScrollReveal>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <ScrollReveal key={item.title} delay={index * 80}>
              <IntegrationCard
                title={item.title}
                description={item.description}
                icon={item.icon}
                color={item.color}
              />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
