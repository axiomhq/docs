'use client';

import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Children, type ReactNode, useId, useState } from 'react';

export function LanguageComparisons({ children, titles }: { children: ReactNode; titles: string[] }) {
  const panels = Children.toArray(children);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const id = useId();

  return (
    <div className="language-comparisons w-full my-3 overflow-hidden border border-(--border-primary) rounded-[4px] bg-(--bg-surface)">
      <div className="language-comparison-options grid grid-cols-2 [&>button+button]:border-l [&>button+button]:border-l-(--border-primary)">
        {titles.map((title, index) => {
          const open = openIndex === index;
          return (
            <button className="min-h-[34px] px-2.5 py-[5px] flex items-center gap-[7px] border-0 text-(--text-secondary) bg-transparent font-sans! text-[12px]! leading-4! font-[550]! cursor-pointer hover:text-(--text-primary) hover:bg-(--bg-inert) aria-expanded:text-(--text-primary) aria-expanded:bg-(--bg-inert)" key={title} type="button" aria-expanded={open} aria-controls={`${id}-${index}`} onClick={() => setOpenIndex(open ? null : index)}>
              <ChevronDown className={cn('flex-none text-(--text-quaternary) transition-transform duration-150 ease-[ease]', open ? 'rotate-0' : '-rotate-90')} size={13} /><span>{title}</span>
            </button>
          );
        })}
      </div>
      {openIndex !== null && <div className="language-comparison-content pt-[14px] px-4 pb-4 border-t border-t-(--border-primary) bg-(--bg-raised)" id={`${id}-${openIndex}`} role="region" aria-label={titles[openIndex]}>{panels[openIndex]}</div>}
    </div>
  );
}
