import { cn } from '@/lib/utils';

/**
 * Axiom's agent activity orb: a brand-orange diamond core that breathes while
 * a square sonar ping expands and fades around it. The animation lives in
 * globals.css (`.ai-orb`). A fixed 14×14 footprint so working rows never
 * shift layout.
 */
export function Orb({ className }: { className?: string }) {
  return <span className={cn('ai-orb', className)} aria-hidden="true" />;
}
