import { ZoneLink } from "@/components/zone-link";
import { cn } from "@/lib/utils";

type LandingSectionHeadingProps = {
  title: string;
  trailingLink?: {
    href: string;
    label: string;
  };
  className?: string;
};

export function LandingSectionHeading({
  title,
  trailingLink,
  className,
}: LandingSectionHeadingProps) {
  return (
    <div
      data-slot="landing-section-heading"
      className={cn("section-heading flex items-center gap-2.5", className)}
    >
      <h2
        data-slot="landing-section-heading-title"
        className="m-0! shrink-0 whitespace-nowrap text-(--text-tertiary)! font-mono! text-[12px]! leading-4! font-normal! tracking-[0px]! uppercase"
      >
        {title}
      </h2>
      <span
        aria-hidden="true"
        data-slot="landing-section-heading-divider"
        className="h-px min-w-0 flex-1 bg-[linear-gradient(to_right,transparent,var(--border-primary))]"
      />
      {trailingLink && (
        <ZoneLink
          href={trailingLink.href}
          prefetch={false}
          data-slot="landing-section-heading-link"
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-(--text-tertiary)! font-mono text-[12px] leading-4 font-normal tracking-[0px] transition-colors duration-150 ease-[ease] hover:text-(--text-primary)! focus-visible:text-(--text-primary)!"
        >
          {trailingLink.label}
          <span aria-hidden="true">→</span>
        </ZoneLink>
      )}
    </div>
  );
}
