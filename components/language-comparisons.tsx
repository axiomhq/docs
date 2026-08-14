"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Children, type ReactNode, useId, useState } from "react";

export function LanguageComparisons({
  children,
  titles,
}: {
  children: ReactNode;
  titles: string[];
}) {
  const panels = Children.toArray(children);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const id = useId();

  return (
    <div className="language-comparisons my-3 w-full overflow-hidden rounded-[4px] border border-(--border-primary) bg-(--bg-surface)">
      <div className="language-comparison-options grid grid-cols-2 bg-(--bg-emph-tertiary) [&>button+button]:border-l [&>button+button]:border-l-(--border-primary)">
        {titles.map((title, index) => {
          const open = openIndex === index;
          const triggerId = `${id}-trigger-${index}`;
          const panelId = `${id}-panel-${index}`;

          return (
            <button
              id={triggerId}
              className="relative flex min-h-[34px] cursor-pointer items-center gap-[7px] border-0 bg-transparent px-2.5 py-[5px] text-left font-sans! text-[12px]! leading-4! font-[450]! text-(--text-secondary) after:absolute after:right-2.5 after:-bottom-px after:left-2.5 after:h-0.5 after:bg-transparent after:content-[''] hover:bg-interactive-hover hover:text-(--text-primary) focus-visible:z-1 aria-expanded:bg-(--bg-surface) aria-expanded:font-medium! aria-expanded:text-(--text-primary) aria-expanded:after:bg-(--color-accent) max-sm:min-h-11"
              key={title}
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenIndex(open ? null : index)}
            >
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "flex-none transition-transform duration-150 ease-[ease]",
                  open ? "rotate-0" : "-rotate-90",
                )}
                size={13}
              />
              <span>{title}</span>
            </button>
          );
        })}
      </div>
      {openIndex !== null && (
        <div
          className="language-comparison-content border-t border-t-(--border-primary) bg-(--bg-surface) p-3 font-sans text-[14px] leading-[22px] [&>div>*]:my-0! [&>div>*+*]:mt-[10px]! [&_.code-group]:rounded-[4px]!"
          id={`${id}-panel-${openIndex}`}
          role="region"
          aria-labelledby={`${id}-trigger-${openIndex}`}
        >
          {panels[openIndex]}
        </div>
      )}
    </div>
  );
}
