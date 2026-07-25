import Link from 'next/link';
import type { ComponentProps } from 'react';
import { withoutDocsBasePath } from '@/lib/docs-paths';

export function ZoneLink({ href, ...props }: ComponentProps<typeof Link>) {
  const target = typeof href === 'string' ? withoutDocsBasePath(href) : href;
  return <Link href={target} {...props} />;
}
