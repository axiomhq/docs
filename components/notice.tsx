import { createElement, type ReactNode } from "react";
import {
  CheckmarkOutline,
  ErrorOutline,
  Idea,
  Information,
  WarningAlt,
} from "@carbon/icons-react";
import { cn } from "@/lib/utils";

const noticeVariants = {
  info: {
    label: "Info",
    icon: Information,
    className: "doc-notice-info [--notice-accent:var(--color-info)]",
  },
  idea: {
    label: "Idea",
    icon: Idea,
    className:
      "doc-notice-idea [--notice-accent:var(--color-accent)]",
  },
  warn: {
    label: "Warning",
    icon: WarningAlt,
    className:
      "doc-notice-warn [--notice-accent:var(--color-warning)]",
  },
  error: {
    label: "Error",
    icon: ErrorOutline,
    className:
      "doc-notice-error [--notice-accent:var(--color-destructive)]",
  },
  success: {
    label: "Success",
    icon: CheckmarkOutline,
    className:
      "doc-notice-success [--notice-accent:var(--color-success)]",
  },
} as const;

export type NoticeType = keyof typeof noticeVariants;

function noticeTypeFromKind(kind?: string): NoticeType {
  if (kind === "tip") return "idea";
  if (kind === "warn" || kind === "warning") return "warn";
  if (kind === "error" || kind === "danger") return "error";
  if (kind === "success") return "success";
  return "info";
}

export function Notice({
  children,
  title,
  type,
  kind,
}: {
  children: ReactNode;
  title?: ReactNode;
  type?: NoticeType;
  kind?: string;
}) {
  const noticeType = type ?? noticeTypeFromKind(kind);
  const variant = noticeVariants[noticeType];
  const defaultLabel = kind === "example" ? "Example" : variant.label;

  return (
    <aside
      data-notice-type={noticeType}
      className={cn(
        "doc-notice my-6 mx-0 p-3 border-l-2 border-l-(--notice-accent) rounded-sm rounded-l-none! bg-[color-mix(in_srgb,var(--notice-accent)_6%,var(--bg-canvas))] text-(--text-secondary) font-sans text-[14px] leading-[22px] font-[450] tracking-[-.005em] [&_:where(p,ul,ol)]:m-0! [&_:is(p,ul,ol)+:is(p,ul,ol)]:mt-[14px]!",
        variant.className,
      )}
    >
      <div
        data-slot="notice-heading"
        className="mb-2 flex items-center gap-2 text-(--notice-accent)"
      >
        {createElement(variant.icon, {
          size: 16,
          className: "doc-notice-icon flex-none",
          "aria-hidden": true,
          focusable: "false",
        })}
        <strong className="text-(--notice-accent)! font-medium text-[13px]">
          {title ?? defaultLabel}
        </strong>
      </div>
      <div data-slot="notice-content">{children}</div>
    </aside>
  );
}
