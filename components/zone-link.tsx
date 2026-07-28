'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import type { ComponentProps } from 'react';
import { withoutDocsBasePath } from '@/lib/docs-paths';

// Viewport prefetch stays off everywhere (prefetch={false} at call sites): the
// sidebar alone holds hundreds of links and would flood the network. Instead the
// first hover/focus/touch on a link primes its route, so the payload is cached
// by the time the click lands and navigation renders without a visible wait.
export function ZoneLink({ href, onPointerEnter, onFocus, onTouchStart, ...props }: ComponentProps<typeof Link>) {
  const router = useRouter();
  const primed = useRef(false);
  const target = typeof href === 'string' ? withoutDocsBasePath(href) : href;

  function prime() {
    if (primed.current || props.prefetch === true) return;
    primed.current = true;
    if (typeof target === 'string' && target.startsWith('/')) router.prefetch(target);
  }

  return (
    <Link
      href={target}
      onPointerEnter={(event) => { prime(); onPointerEnter?.(event); }}
      onFocus={(event) => { prime(); onFocus?.(event); }}
      onTouchStart={(event) => { prime(); onTouchStart?.(event); }}
      {...props}
    />
  );
}
