'use client';

import { ChevronUp, Search } from '@carbon/icons-react';
import { type ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Live search state for the assistant, adapted from aicss.dev's Web Search
 * (module.css converted to Tailwind, palette on our tokens). Instead of the source's
 * self-driving demo timeline, it renders real tool-call state: a shimmering
 * header while any search is in flight, and a railed list where each query's
 * spinning globe resolves into a check (or an error mark).
 */
export type WebSearchItem = {
  id: string;
  label: string;
  state: 'loading' | 'done' | 'error';
};

const EASE = { transitionTimingFunction: 'cubic-bezier(0.32,0.72,0,1)' };

// Six meridians, phase-offset by 1/6 of the cycle, read as one rotating
// sphere. SMIL keeps the animation self-contained in the SVG.
const MERIDIANS = {
  L: 'M6.057 11.565 C2.081 11.565 0.371 8.159 0.371 5.964 C0.371 3.642 2.152 0.329 6.05 0.329',
  ML: 'M6.012 11.55 C4.575 10.496 3.333 8.116 3.321 5.964 C3.307 3.399 4.974 0.977 6.012 0.329',
  MR: 'M6.012 11.55 C7.211 10.781 8.715 8.287 8.715 5.964 C8.715 3.399 7.24 1.233 6.012 0.329',
  R: 'M6.012 11.55 C9.677 11.55 11.65 8.487 11.65 5.964 C11.65 3.499 9.748 0.329 6.012 0.329',
};

function Globe() {
  const values = [MERIDIANS.L, MERIDIANS.ML, MERIDIANS.MR, MERIDIANS.R, MERIDIANS.L].join(';');
  return (
    <svg
      viewBox="0 0 12 12"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.85"
      strokeLinecap="round"
      className="overflow-visible"
      aria-hidden="true"
    >
      <circle cx="6" cy="6" r="5.7" opacity="0.9" />
      <line x1="0.3" y1="6" x2="11.7" y2="6" opacity="0.9" />
      {['0s', '-1.2s', '-2.4s', '-3.6s', '-4.8s', '-6s'].map((begin) => (
        <path key={begin} d={MERIDIANS.L} opacity="0">
          <animate
            attributeName="d"
            dur="7.2s"
            begin={begin}
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;0.25;0.5;0.75;1"
            keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1"
            values={values}
          />
          <animate
            attributeName="opacity"
            dur="7.2s"
            begin={begin}
            repeatCount="indefinite"
            calcMode="linear"
            keyTimes="0;0.05;0.7;0.75;1"
            values="0;0.9;0.9;0;0"
          />
        </path>
      ))}
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

export function WebSearch({
  searchingLabel = 'Searching the docs',
  doneLabel = 'Searched the docs',
  items,
  pending = false,
}: {
  searchingLabel?: ReactNode;
  doneLabel?: ReactNode;
  items: WebSearchItem[];
  /** Search has been requested but no queries have streamed in yet. */
  pending?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const searching = pending || items.some((item) => item.state === 'loading');

  return (
    <div className="flex flex-col gap-1 font-sans text-[13px] leading-[1.4] text-(--text-primary)">
      <div className="flex min-h-5 items-center gap-1.5">
        <Search
          size={14}
          className="-ml-px flex-none text-(--text-tertiary)"
          aria-hidden="true"
        />
        <span className="inline-flex min-w-0 items-center gap-1 font-medium whitespace-nowrap">
          {/* Both labels occupy the same grid cell; the invisible twins
              reserve the widest width so swapping searching → done doesn't
              shift the chevron. */}
          <span className="inline-grid min-w-0">
            <span className={cn('col-start-1 row-start-1 overflow-hidden text-ellipsis', searching && 'ai-shimmer-text')}>
              {searching ? searchingLabel : doneLabel}
            </span>
            <span className="invisible col-start-1 row-start-1" aria-hidden="true">
              {searchingLabel}
            </span>
            <span className="invisible col-start-1 row-start-1" aria-hidden="true">
              {doneLabel}
            </span>
          </span>
          {items.length > 0 && (
            <button
              type="button"
              aria-label="Toggle search results"
              aria-expanded={open}
              className={cn(
                'inline-flex size-4 flex-none cursor-pointer items-center justify-center rounded-[4px] border-0 bg-transparent p-0 text-(--text-quaternary) transition-[color,transform] duration-200 hover:text-(--text-tertiary)',
                !open && 'rotate-180',
              )}
              style={EASE}
              onClick={() => setOpen((value) => !value)}
            >
              <ChevronUp size={10} aria-hidden="true" />
            </button>
          )}
        </span>
      </div>
      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-300',
          open
            ? 'grid-rows-[1fr] opacity-100'
            : 'pointer-events-none grid-rows-[0fr] opacity-0',
        )}
        style={EASE}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="relative flex items-stretch gap-1.5">
            <span
              className="ml-[5.5px] w-px flex-none self-stretch border-l border-(--border-primary)"
              aria-hidden="true"
            />
            <ul className="m-0 flex min-w-0 flex-1 list-none flex-col gap-1.5 py-1 pr-0 pl-1.5">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex min-w-0 translate-y-1 items-center gap-1.5 text-[12px] leading-[18px] text-(--text-tertiary) opacity-0 [animation:ai-enter_0.34s_cubic-bezier(0.32,0.72,0,1)_forwards] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:[animation:none]"
                >
                  <span className="relative inline-flex size-3.5 flex-none items-center justify-center">
                    <span
                      className={cn(
                        'absolute inset-0 inline-flex items-center justify-center text-(--text-quaternary) transition-[opacity,transform] duration-300',
                        item.state === 'loading'
                          ? 'scale-100 opacity-100'
                          : 'scale-[0.775] opacity-0',
                      )}
                      style={EASE}
                    >
                      <Globe />
                    </span>
                    <span
                      className={cn(
                        'inline-flex size-[5px] rounded-full bg-brand transition-[opacity,transform] delay-75 duration-300',
                        item.state === 'done'
                          ? 'scale-100 opacity-100'
                          : 'scale-50 opacity-0',
                      )}
                      style={EASE}
                    />
                    {item.state === 'error' && (
                      <span className="absolute inset-0 inline-flex items-center justify-center text-(--text-destructive)">
                        <ErrorIcon />
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      'min-w-0 overflow-hidden font-[450] text-ellipsis whitespace-nowrap text-(--text-primary)',
                      item.state === 'loading' && 'ai-shimmer-text',
                    )}
                  >
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
