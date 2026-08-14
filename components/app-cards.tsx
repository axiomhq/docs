import { createElement, type ReactNode } from "react";
import { IconCard } from "@/components/icon-card";
import {
  INTEGRATION_ICONS,
  IntegrationIcon,
} from "@/components/integration-icons";
import { docIconStrokeWidth, resolveDocIcon } from "@/lib/doc-icons";

// Extensions/apps catalog cards, styled like the landing quick-cards: brand
// glyph top-left (INTEGRATION_ICONS, lucide fallback for brands simple-icons
// lacks), title, one-line description. Deliberately separate from the generic
// <Card>/<CardGroup> mapping, which keeps fumadocs' look.
export function AppCards({ children }: { children: ReactNode }) {
  return (
    <div className="app-cards not-prose my-6 grid grid-cols-2 gap-4 max-sm:grid-cols-1">
      {children}
    </div>
  );
}

export function AppCard({
  title,
  icon,
  href = "",
  children,
}: {
  title: ReactNode;
  icon?: string;
  href?: string;
  children?: ReactNode;
}) {
  const brand = icon && icon in INTEGRATION_ICONS;
  const lucide = !brand ? resolveDocIcon(icon) : undefined;
  return (
    <IconCard
      href={href}
      title={title}
      description={children}
      gap="md"
      icon={
        brand ? (
          <IntegrationIcon slug={icon!} size={20} />
        ) : lucide ? (
          createElement(lucide, {
            size: 20,
            strokeWidth: docIconStrokeWidth(undefined),
            "aria-hidden": true,
          })
        ) : undefined
      }
      className="app-card"
    />
  );
}
