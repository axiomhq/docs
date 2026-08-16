"use client";

import {
  CodeGlyphIcon,
  resolveCodeLanguage,
} from "@/components/ai/code-languages";
import CopyButton from "@/components/ai/copy-button";
import { cn } from "@/lib/utils";

/**
 * Code block with a language label, one-click copy, and line numbers, adapted
 * from aicss.dev's Code Block (module.css converted to Tailwind, palette mapped to our theme tokens).
 */
export function CodeBlock({
  lang,
  code,
  className,
}: {
  lang: string;
  code: string;
  className?: string;
}) {
  const lines = code.split("\n");
  const { label, Icon } = resolveCodeLanguage(lang);
  const LangIcon = Icon ?? CodeGlyphIcon;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-(--bg-surface) shadow-[0_0_0_1px_var(--border-primary)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-(--border-primary) py-2.5 pr-1.5 pl-4">
        <span className="inline-flex items-center gap-[7px]">
          <LangIcon
            className="size-3 flex-none text-(--text-tertiary)"
            aria-hidden="true"
          />
          <span className="font-mono text-[12.5px] leading-none text-(--text-primary)">
            {label}
          </span>
        </span>
        <CopyButton
          code={code}
          className="ml-auto [&_svg]:size-[13px]"
        />
      </div>
      <div className="relative py-2.5 font-mono text-[12.5px] leading-5 before:absolute before:top-0 before:bottom-0 before:left-8 before:w-px before:bg-(--border-primary) before:content-['']">
        {lines.map((line, index) => (
          <div className="grid grid-cols-[32px_1fr]" key={index}>
            <span className="px-[7px] text-right text-[11px] leading-5 text-(--text-tertiary) select-none">
              {index + 1}
            </span>
            <code className="overflow-x-auto pr-3 pl-2 whitespace-pre text-(--text-primary) [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {line || " "}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}
