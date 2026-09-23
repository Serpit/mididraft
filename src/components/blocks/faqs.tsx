import { HeaderSection } from '@/components/shared/header-section';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const m = {
  title: 'FAQs',
  subtitle: 'Frequently asked questions',
  items: {
    'item-1': {
      question: 'Can I change my plan later?',
      answer:
        'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of the next billing cycle.',
    },
    'item-2': {
      question: 'What payment methods do you accept?',
      answer:
        'We accept all major credit cards, PayPal, and wire transfer for annual plans.',
    },
    'item-3': {
      question: 'Is there a free trial?',
      answer:
        'Yes, we offer a 14-day free trial on all paid plans. No credit card required.',
    },
    'item-4': {
      question: 'What is your refund policy?',
      answer:
        'We offer a 30-day money-back guarantee. Contact support for a full refund.',
    },
    'item-5': {
      question: 'How do I get support?',
      answer:
        'Email support is included for all plans. Pro and above get priority support.',
    },
  },
};

const faqItems = Object.entries(m.items).map(([id, item]) => ({
  id,
  ...item,
}));

export default function FaqSection() {
  return (
    <section id="faqs" className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <ScrollReveal>
          <HeaderSection title={m.title} subtitle={m.subtitle} />
        </ScrollReveal>

        <ScrollReveal delay={150} className="mx-auto mt-12 max-w-4xl">
          <Accordion className="ring-primary/10 w-full rounded-2xl border border-primary/15 px-4 py-3 shadow-sm ring-4 dark:ring-primary/5 dark:border-primary/10 sm:px-8">
            {faqItems.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="border-dashed"
              >
                <AccordionTrigger className="text-base hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-base text-muted-foreground">
                    {item.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollReveal>
      </div>
    </section>
  );
}
