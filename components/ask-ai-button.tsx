"use client";

import { SparkleIcon } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import { useDocsSearchController } from "@/components/docs-search-provider";

/**
 * Floating Ask AI entry point, fixed to the bottom-right of the viewport.
 * Sits below the header (z-50) and mobile drawer (z-70) layers. The solid
 * background matters: the outline variant's gradient starts transparent,
 * and article text would otherwise show through.
 */
export function AskAiButton() {
  const { openAssistant } = useDocsSearchController();

  return (
    <Button
      type="button"
      variant="outline"
      className="ask-ai-button fixed right-5 bottom-[max(20px,env(safe-area-inset-bottom))] z-40 h-8 rounded-md bg-background px-3 font-sans text-[13px] leading-none font-[450] shadow-lg"
      onClick={() => openAssistant("", "floating")}
    >
      <SparkleIcon aria-hidden="true" />
      Ask AI
    </Button>
  );
}
