'use client';

import { ChevronDown } from 'lucide-react';
import { Children, type ReactNode, useId, useState } from 'react';

export function LanguageComparisons({ children, titles }: { children: ReactNode; titles: string[] }) {
  const panels = Children.toArray(children);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const id = useId();

  return (
    <div className="language-comparisons">
      <div className="language-comparison-options">
        {titles.map((title, index) => {
          const open = openIndex === index;
          return (
            <button key={title} type="button" aria-expanded={open} aria-controls={`${id}-${index}`} onClick={() => setOpenIndex(open ? null : index)}>
              <ChevronDown size={13} /><span>{title}</span>
            </button>
          );
        })}
      </div>
      {openIndex !== null && <div className="language-comparison-content" id={`${id}-${openIndex}`} role="region" aria-label={titles[openIndex]}>{panels[openIndex]}</div>}
    </div>
  );
}
