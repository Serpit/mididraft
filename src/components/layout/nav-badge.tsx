import type { ReactNode } from 'react';

/** A small tag beside a nav link, e.g. which plan a tool belongs to. */
export function NavBadge({ children }: { children: ReactNode }) {
  return (
    <span className="ml-1.5 rounded-full bg-midi/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-midi">
      {children}
    </span>
  );
}
