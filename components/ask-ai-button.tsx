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
  const { assistantOpen, openAssistant } = useDocsSearchController();

  // The sidebar it opens covers this corner; showing both would be redundant.
  if (assistantOpen) return null;

  return (
    <Button
      type="button"
      // Focus lands back here when the sidebar closes while holding focus.
      id="ask-ai-button"
      variant="outline"
      className="ask-ai-button fixed right-5 bottom-[max(20px,env(safe-area-inset-bottom))] z-40 h-8 rounded-md bg-background pl-3 pr-1.5 font-sans text-[13px] leading-none font-[450] shadow-lg"
      onClick={() => openAssistant("", "floating")}
    >
      <SparkleIcon aria-hidden="true" />
      Ask AI
      <span className="ml-1 inline-flex items-center gap-1" aria-hidden="true">
        <kbd className="kbd-cmd">⌘</kbd>
        <kbd>I</kbd>
      </span>
    </Button>
  );
}
