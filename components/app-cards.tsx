import { createElement, type ReactNode } from 'react';
import { ZoneLink } from '@/components/zone-link';
import { INTEGRATION_ICONS, IntegrationIcon } from '@/components/integration-icons';
import { docIconStrokeWidth, resolveDocIcon } from '@/lib/doc-icons';

// Extensions/apps catalog cards, styled like the landing quick-cards: brand
// glyph top-left (INTEGRATION_ICONS, lucide fallback for brands simple-icons
// lacks), title, one-line description. Deliberately separate from the generic
// <Card>/<CardGroup> mapping, which keeps fumadocs' look.
export function AppCards({ children }: { children: ReactNode }) {
  return <div className="app-cards not-prose my-6 grid grid-cols-2 gap-4 max-sm:grid-cols-1">{children}</div>;
}

export function AppCard({ title, icon, href = '', children }: { title: ReactNode; icon?: string; href?: string; children?: ReactNode }) {
  const brand = icon && icon in INTEGRATION_ICONS;
  const lucide = !brand ? resolveDocIcon(icon) : undefined;
  return (
    <ZoneLink
      href={href}
      prefetch={false}
      className="app-card p-5 flex flex-col gap-1.5 rounded-[6px] bg-(--bg-surface) transition-[background-color] duration-150 ease-[ease] [&:hover]:bg-(--bg-raised)"
    >
      {(brand || lucide) && (
        <span className="app-card-icon mb-2.5 flex text-(--text-tertiary) transition-colors duration-150 ease-[ease] [.app-card:hover_&]:text-(--text-primary)">
          {brand
            ? <IntegrationIcon slug={icon!} size={20} />
            : createElement(lucide!, { size: 20, strokeWidth: docIconStrokeWidth(undefined), 'aria-hidden': true })}
        </span>
      )}
      <strong className="text-(--text-primary) font-sans text-[15px] leading-5 font-semibold tracking-[-.01em]">{title}</strong>
      <div className="text-(--text-tertiary) font-sans text-[13px] leading-5 font-normal [&_p]:m-0">{children}</div>
    </ZoneLink>
  );
}
