import type { ReactNode } from 'react';

export interface GuidePlate {
  title: string;
  image: string;
  body: ReactNode;
  /** A short, concrete setting or habit, shown as a chip under the body. */
  tip?: string;
}

interface GuidePlatesProps {
  items: GuidePlate[];
  /** Number the cards, for a sequence the reader follows in order. */
  numbered?: boolean;
}

/**
 * Paper-illustrated cards for a guide, two across. Guides are where the
 * artwork lives: the homepage stays the tool plus plain text, and a reader
 * who has chosen to read a guide has the attention for pictures.
 *
 * Rendered inside GuideLayout's prose block, so it opts out of prose styles.
 */
export function GuidePlates({ items, numbered }: GuidePlatesProps) {
  const Wrapper = numbered ? 'ol' : 'ul';

  return (
    <Wrapper className="not-prose my-8 grid list-none gap-4 p-0 sm:grid-cols-2">
      {items.map((item, index) => (
        <li key={item.title} className="group st-card flex flex-col p-2">
          <div className="st-plate aspect-[4/3]">
            <img
              src={item.image}
              alt=""
              width={960}
              height={725}
              loading="lazy"
              decoding="async"
            />
            {numbered && (
              <span className="st-readout absolute top-3 left-3 flex size-8 items-center justify-center rounded-full bg-surface-strong text-sm shadow-sm">
                {index + 1}
              </span>
            )}
          </div>
          <div className="flex flex-1 flex-col items-start px-3 pt-4 pb-3">
            <h3 className="font-medium">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {item.body}
            </p>
            {item.tip && (
              <p className="mt-auto pt-4">
                <span className="inline-flex rounded-full bg-surface-strong px-3 py-1 text-xs">
                  {item.tip}
                </span>
              </p>
            )}
          </div>
        </li>
      ))}
    </Wrapper>
  );
}
