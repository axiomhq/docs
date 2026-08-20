import { Children, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";
import {
  Accordion as ShadcnAccordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type MdxAccordionProps = {
  children: ReactNode;
  title: ReactNode;
};

// Chrome shared with the article code fields and `.docs-tabs`: 1px
// --border-primary shell at --radius-md on --bg-surface, a 38px header
// strip in 13px sans medium, hairline separators, 12px panel padding
// with the tabs' 10px sibling rhythm.
const rootClassName =
  "docs-accordion my-5 mx-0 rounded-md border-(--border-primary) bg-(--bg-surface) shadow-none";

const itemClassName =
  "not-last:border-b-[0.5px] not-last:border-b-(--border-primary) data-open:bg-transparent";

const triggerClassName =
  "min-h-[38px] items-center gap-4 rounded-none px-3 py-2 font-sans text-[13px]/[18px] font-medium tracking-normal text-(--text-secondary) no-underline transition-[color,background-color] duration-150 ease-[ease] hover:bg-interactive-hover hover:text-(--text-primary) hover:no-underline aria-expanded:text-(--text-primary) **:data-[slot=accordion-trigger-icon]:size-3.5 **:data-[slot=accordion-trigger-icon]:text-(--text-quaternary) focus-visible:z-10 focus-visible:border-(--brand) focus-visible:ring-2 focus-visible:ring-(--brand)/30";

const contentClassName =
  "docs-accordion-content border-t-[0.5px] border-(--border-primary) p-3 text-(--text-tertiary) text-[14px] leading-[22px] tracking-[-.003em] [&>*]:my-0! [&>*+*]:mt-2.5! [&>*+.placeholder-config]:mt-0! [&_p]:m-0! [&_:is(h2,h3,h4,h5,h6)]:mt-5! [&_:is(h2,h3,h4,h5,h6)]:mb-2! [&_:is(h2,h3,h4,h5,h6)]:text-(--text-primary)! [&_:is(h2,h3,h4,h5,h6)]:font-sans! [&_:is(h2,h3,h4,h5,h6)]:font-semibold! [&_:is(h2,h3,h4,h5,h6):first-child]:mt-0! [&_h2]:text-[17px]! [&_h2]:leading-6! [&_h3]:text-[15px]! [&_h3]:leading-[22px]! [&_:is(h4,h5,h6)]:text-[14px]! [&_:is(h4,h5,h6)]:leading-[22px]!";

function MdxAccordionItem({
  children,
  title,
  value,
}: MdxAccordionProps & { value: string }) {
  return (
    <AccordionItem value={value} className={itemClassName}>
      <AccordionTrigger className={triggerClassName}>
        {title}
      </AccordionTrigger>
      <AccordionContent className={contentClassName}>
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}

export function Accordion({ children, title }: MdxAccordionProps) {
  return (
    <ShadcnAccordion
      hiddenUntilFound
      multiple={false}
      className={rootClassName}
    >
      <MdxAccordionItem value="item-1" title={title}>
        {children}
      </MdxAccordionItem>
    </ShadcnAccordion>
  );
}

export function AccordionGroup({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter(
    isValidElement,
  ) as ReactElement<MdxAccordionProps>[];

  return (
    <ShadcnAccordion
      hiddenUntilFound
      multiple={false}
      className={rootClassName}
    >
      {items.map((item, index) => (
        <MdxAccordionItem
          key={index}
          value={`item-${index + 1}`}
          title={item.props.title}
        >
          {item.props.children}
        </MdxAccordionItem>
      ))}
    </ShadcnAccordion>
  );
}
