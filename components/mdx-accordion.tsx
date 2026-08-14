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

const rootClassName =
  "docs-accordion my-5 mx-0 rounded-[4px] border-(--border-primary) bg-(--bg-surface) shadow-none";

const triggerClassName =
  "min-h-11 items-center gap-4 rounded-none px-4 py-2.5 text-(--text-secondary) text-[14px]/[20px] font-[550] tracking-[-.005em] no-underline transition-[color,background-color,border-color,box-shadow] duration-150 ease-[ease] hover:bg-interactive-hover hover:text-(--text-primary) hover:no-underline aria-expanded:text-(--text-primary) focus-visible:z-10 focus-visible:border-(--brand) focus-visible:ring-2 focus-visible:ring-(--brand)/30";

const contentClassName =
  "docs-accordion-content px-4 pb-4 text-(--text-tertiary) text-[14px] leading-[23px] tracking-[-.003em] [&>*]:my-0! [&>*+*]:mt-[14px]! [&_p]:m-0! [&_:is(h2,h3,h4,h5,h6)]:mt-5! [&_:is(h2,h3,h4,h5,h6)]:mb-2! [&_:is(h2,h3,h4,h5,h6)]:text-(--text-primary)! [&_:is(h2,h3,h4,h5,h6)]:font-sans! [&_:is(h2,h3,h4,h5,h6)]:font-semibold! [&_:is(h2,h3,h4,h5,h6):first-child]:mt-0! [&_h2]:text-[17px]! [&_h2]:leading-6! [&_h3]:text-[15px]! [&_h3]:leading-[22px]! [&_:is(h4,h5,h6)]:text-[14px]! [&_:is(h4,h5,h6)]:leading-[22px]!";

function MdxAccordionItem({
  children,
  title,
  value,
}: MdxAccordionProps & { value: string }) {
  return (
    <AccordionItem value={value} className="data-open:bg-(--bg-inert)">
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
