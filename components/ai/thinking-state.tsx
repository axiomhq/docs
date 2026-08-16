import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Orb } from './orb';

/**
 * Shimmering "the agent is working" label with the activity orb, adapted
 * from aicss.dev's Thinking State. The gradient text treatment lives in globals.css as `.ai-shimmer-text` —
 * background-clip:text shimmer can't be expressed as Tailwind utilities. The
 * shimmer tone follows the element's text color.
 */
export function ThinkingState({
  children = 'Thinking',
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Orb />
      <span className="ai-shimmer-text font-sans text-[13px] leading-[18px] font-medium text-(--text-tertiary)">
        {children}
      </span>
    </span>
  );
}
