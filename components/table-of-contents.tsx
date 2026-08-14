'use client';

import { motion, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  buildTocTrace,
  getTocTraceX,
  pointAtTocTraceDistance,
  TOC_TRACE_BASE_X,
  type TocTraceRow,
} from '@/lib/toc-trace';
import type { ReactNode } from 'react';

export type TocItem = {
  title: ReactNode;
  url: string;
  depth: number;
};

const TOC_ROW_HEIGHT = 28;
const TOC_VERTICAL_PADDING = 2;
const TOC_LINK_PADDING = 15;
const TOC_CURSOR_WIDTH = 3;
const TOC_CURSOR_HEIGHT = 8;
const TRACE_SPRING = {
  stiffness: 520,
  damping: 42,
  mass: 0.65,
};

type TocMeasurement = {
  key: string;
  rows: TocTraceRow[];
};

const rowsMatch = (current: TocTraceRow[], next: TocTraceRow[]) =>
  current.length === next.length
  && current.every((row, index) => {
    const candidate = next[index];
    return row.depth === candidate.depth
      && Math.abs(row.top - candidate.top) <= 0.5
      && Math.abs(row.height - candidate.height) <= 0.5;
  });

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeUrl, setActiveUrl] = useState(items[0]?.url ?? '');
  const [measurement, setMeasurement] = useState<TocMeasurement | null>(null);
  const traceRef = useRef<HTMLDivElement>(null);
  const itemsKey = items
    .map((item) => `${item.depth}:${item.url}`)
    .join('|');
  const foundActiveIndex = items.findIndex((item) => item.url === activeUrl);
  const activeIndex = foundActiveIndex >= 0 ? foundActiveIndex : 0;
  const renderedActiveUrl = items[activeIndex]?.url ?? '';
  const fallbackRows = useMemo<TocTraceRow[]>(
    () => items.map((item, index) => ({
      depth: item.depth,
      top: TOC_VERTICAL_PADDING + index * TOC_ROW_HEIGHT,
      height: TOC_ROW_HEIGHT,
    })),
    [items],
  );
  const rows = measurement?.key === itemsKey
    ? measurement.rows
    : fallbackRows;
  const trace = useMemo(() => buildTocTrace(rows), [rows]);
  const targetDistance = trace.itemDistances[activeIndex] ?? 0;
  const animatedDistance = useSpring(targetDistance, TRACE_SPRING);
  const shouldReduceMotion = useReducedMotion();
  const layoutKey = `${itemsKey}:${trace.path}`;
  const previousLayoutKey = useRef(layoutKey);
  const markerTransform = useTransform(animatedDistance, (distance) => {
    const point = pointAtTocTraceDistance(trace, distance);
    const x = Math.round((point.x - TOC_CURSOR_WIDTH / 2) * 1000) / 1000;
    const y = Math.round((point.y - TOC_CURSOR_HEIGHT / 2) * 1000) / 1000;
    return `translate3d(${x}px, ${y}px, 0)`;
  });
  useLayoutEffect(() => {
    const traceElement = traceRef.current;
    if (!traceElement || items.length === 0) return;

    let frame = 0;
    const measure = () => {
      const links = Array.from(
        traceElement.querySelectorAll<HTMLElement>('[data-slot="toc-link"]'),
      );
      if (links.length !== items.length) return;

      const traceBox = traceElement.getBoundingClientRect();
      const nextRows = links.map((link, index) => {
        const box = link.getBoundingClientRect();
        return {
          depth: items[index].depth,
          top: box.top - traceBox.top,
          height: box.height,
        };
      });
      if (nextRows.some((row) => row.height <= 0)) return;

      setMeasurement((current) => {
        if (
          current?.key === itemsKey
          && rowsMatch(current.rows, nextRows)
        ) {
          return current;
        }
        return { key: itemsKey, rows: nextRows };
      });
    };
    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    measure();
    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(scheduleMeasure);
    resizeObserver?.observe(traceElement);
    traceElement
      .querySelectorAll<HTMLElement>('[data-slot="toc-link"]')
      .forEach((link) => resizeObserver?.observe(link));
    window.addEventListener('resize', scheduleMeasure);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, [items, itemsKey]);

  useLayoutEffect(() => {
    const layoutChanged = previousLayoutKey.current !== layoutKey;
    if (shouldReduceMotion || layoutChanged) {
      animatedDistance.jump(targetDistance);
    } else {
      animatedDistance.set(targetDistance);
    }
    previousLayoutKey.current = layoutKey;
  }, [animatedDistance, layoutKey, shouldReduceMotion, targetDistance]);

  useEffect(() => {
    const headings = items
      .map((item) => ({ item, element: document.getElementById(item.url.slice(1)) }))
      .filter((entry): entry is { item: TocItem; element: HTMLElement } => entry.element !== null);

    if (headings.length === 0) return;

    const scrollViewport = document.querySelector<HTMLElement>('.docs-scroll-viewport');
    const scrollTarget: HTMLElement | Window = scrollViewport ?? window;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Match the heading scroll offset, with a little tolerance for
        // sub-pixel layout so hash navigation activates the target heading.
        // The main ScrollArea begins below the fixed header, so its top edge
        // is part of the document-space reading line.
        const readingLine = (scrollViewport?.getBoundingClientRect().top ?? 0) + 60;
        let current = headings[0].item.url;

        for (const heading of headings) {
          if (heading.element.getBoundingClientRect().top > readingLine) break;
          current = heading.item.url;
        }

        const atPageEnd = scrollViewport
          ? scrollViewport.clientHeight + scrollViewport.scrollTop >= scrollViewport.scrollHeight - 4
          : window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        setActiveUrl(atPageEnd ? headings.at(-1)!.item.url : current);
      });
    };

    frame = requestAnimationFrame(update);
    scrollTarget.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      scrollTarget.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [items]);

  return (
    <aside
      className="floating-toc sticky top-14 hidden h-fit max-h-[calc(100svh_-_144px)] w-72 self-start flex-col bg-transparent p-0 pr-5 xl:col-start-4 xl:row-start-1 xl:flex [&_a_code]:text-inherit! [&_a_code]:[font-size:inherit]"
      aria-label="On this page"
    >
      {/* The heading stays outside the scroller so the scroll-fade mask never
          dims it — only the link list scrolls and fades at its edges. */}
      <div className="mb-2.5 flex flex-none items-center pl-[15px]">
        <strong className="block font-mono text-[11px] leading-[14px] font-semibold tracking-[.08em] text-secondary-foreground uppercase">
          On this page
        </strong>
      </div>
      <div className="min-h-0 flex-1 overflow-auto scroll-fade-y">
        <div className="toc-trace relative py-0.5" ref={traceRef}>
          {trace.path ? (
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
              focusable="false"
            >
              <path
                d={trace.path}
                data-slot="toc-trace-path"
                fill="none"
                className="stroke-sidebar-connector"
                strokeLinecap="square"
                strokeLinejoin="miter"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          ) : null}
          {trace.path ? (
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 z-[3] h-2 w-[3px] bg-(--color-accent)"
              data-slot="toc-cursor"
              style={{ transform: markerTransform }}
            />
          ) : null}
          {items.map((item) => {
            const active = item.url === renderedActiveUrl;
            return (
              <a
                className={cn(
                  'group/toc relative z-[2] grid min-h-7 grid-cols-[minmax(0,1fr)] items-center py-[5px] pr-1 font-sans text-[13px] leading-[18px] tracking-[-.006em] transition-[color] duration-(--duration-2) ease-(--ease-out) hover:text-(--text-secondary)! focus-visible:outline-1 focus-visible:outline-offset-[-2px] focus-visible:outline-(--color-accent)',
                  active
                    ? 'active font-medium text-foreground!'
                    : 'font-[450] text-(--text-quaternary)!',
                )}
                aria-current={active ? 'location' : undefined}
                data-slot="toc-link"
                href={item.url}
                key={item.url}
                onClick={(event) => {
                  if (
                    event.defaultPrevented
                    || event.button !== 0
                    || event.metaKey
                    || event.ctrlKey
                    || event.shiftKey
                    || event.altKey
                  ) {
                    return;
                  }
                  setActiveUrl(item.url);
                }}
                style={{
                  paddingLeft: TOC_LINK_PADDING
                    + getTocTraceX(item.depth)
                    - TOC_TRACE_BASE_X,
                }}
              >
                <span className="line-clamp-2 min-w-0 break-words">
                  {item.title}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
