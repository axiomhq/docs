import type { ReactNode } from 'react';
import { ArrowUpRightIcon } from '@/assets/icons';
import { cn } from '@/lib/utils';
import { ZoneLink } from '@/components/zone-link';

type IconCardGap = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type IconCardProps = {
  title: ReactNode;
  description?: ReactNode;
  lead?: ReactNode;
  icon?: ReactNode;
  href?: string;
  className?: string;
  variant?: 'bordered' | 'non-bordered';
  gap?: IconCardGap;
};

const GAP: Record<IconCardGap, string> = {
  xs: 'gap-2',
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-12',
};

export function IconCard({
  title,
  description,
  lead,
  icon,
  href,
  className,
  variant = 'bordered',
  gap = 'xl',
}: IconCardProps) {
  const hasLink = Boolean(href);
  const content = (
    <>
      <span className="flex items-start justify-between">
        <span className="icon-card-icon flex size-5 items-center justify-center [&>svg]:size-5">
          {icon}
        </span>
        {hasLink && (
          <ArrowUpRightIcon
            aria-hidden="true"
            className="shrink-0 text-secondary-foreground opacity-0 transition-opacity duration-200 group-hover/iconcard:opacity-100"
          />
        )}
      </span>
      <div className="flex flex-col gap-1">
        {title && (
          <h3 className="text-sm font-[450] text-foreground">
            {title}
          </h3>
        )}
        {description && (
          <div className="text-xs text-gray-10 leading-4.5 [&_p]:m-0">
            {lead && <span className="font-medium text-foreground">{lead} </span>}
            {description}
          </div>
        )}
      </div>
    </>
  );
  const cardClassName = variant === 'non-bordered'
    ? cn(
        'icon-card group/iconcard relative isolate flex h-full flex-col rounded-xl p-4',
        GAP[gap],
        hasLink && 'after:absolute after:-inset-2 after:-z-10 after:rounded-2xl after:bg-card after:opacity-0 after:transition-opacity after:duration-200 hover:after:opacity-100',
        className,
      )
    : cn(
        'icon-card group/iconcard flex h-full flex-col rounded-xl border border-gray-3/50 bg-card p-4 hover:border-gray-4',
        GAP[gap],
        hasLink && 'transition-colors duration-200',
        className,
      );

  if (hasLink) {
    return (
      <ZoneLink href={href!} prefetch={false} className={cardClassName}>
        {content}
      </ZoneLink>
    );
  }

  return <article className={cardClassName}>{content}</article>;
}
