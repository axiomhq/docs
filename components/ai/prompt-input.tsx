'use client';

import { BorderBeam } from 'border-beam';
import { ArrowUp } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLayoutEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

/**
 * Text-only AI composer, adapted from aicss.dev's "AI Agent Input" (its
 * module.css converted to Tailwind, palette mapped to our tokens). The source
 * component's attachments, model switcher, skill pills, and enhance-prompt
 * flow are intentionally left out. While an answer streams, the card wears
 * border-beam's pulse-inner glow in the warm sunset palette.
 */
type AiPromptInputProps = {
  id?: string;
  value: string;
  placeholder?: string;
  /** An answer is streaming: sweeps the border and swaps send for stop. */
  busy?: boolean;
  maxLength?: number;
  'aria-label'?: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onStop?: () => void;
};

export function AiPromptInput({
  id,
  value,
  placeholder,
  busy = false,
  maxLength,
  'aria-label': ariaLabel,
  onChange,
  onSubmit,
  onStop,
}: AiPromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { resolvedTheme } = useTheme();
  const canSend = value.trim().length > 0 && !busy;

  // Auto-grow with the content between one line and 160px, like the source
  // component's contenteditable field.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [value]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    // The Enter that commits an IME candidate must never submit — CJK users
    // could otherwise not compose a question without firing a request.
    if (event.nativeEvent.isComposing) return;
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    if (canSend) onSubmit(value);
  };

  return (
    <div className="ai-prompt-input w-full">
      {/* staticColors matters: the pulse family otherwise rotates the whole
          palette through a full hue circle and the sunset warmth drifts into
          greens and blues. */}
      <BorderBeam
        size="pulse-inner"
        colorVariant="sunset"
        staticColors
        saturation={0.85}
        strength={0.35}
        active={busy}
        theme={resolvedTheme === 'light' ? 'light' : 'dark'}
        className="w-full"
      >
      <div
        className={cn(
          'ai-prompt-frame relative flex flex-col gap-3 rounded-md border-[0.5px] border-transparent bg-(--bg-surface) px-2.5 pt-2.5 pb-2.5',
          // Hairline ring painted first so it stays even on every edge, then
          // the soft drops — straight from the source component.
          'shadow-[0_0_0_0.5px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.05),0_2px_4px_rgba(0,0,0,0.02)]',
          'dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.12),0_1px_2px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.3)]',
        )}
      >
        <textarea
          ref={textareaRef}
          id={id}
          rows={1}
          value={value}
          maxLength={maxLength}
          aria-label={ariaLabel}
          placeholder={placeholder}
          data-ph-no-capture
          className="max-h-40 min-h-[19px] w-full resize-none overflow-y-auto border-0 bg-transparent p-0 font-sans text-[13px] leading-[19px] tracking-[-0.01em] text-(--text-primary) outline-0 placeholder:text-(--text-primary) placeholder:opacity-50"
          onChange={(event) => onChange(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="flex items-center justify-end">
          {busy ? (
            <button
              type="button"
              aria-label="Stop answer"
              className={cn(
                'relative inline-flex size-[22px] flex-none cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-(--text-on-inverse-primary)',
                'before:absolute before:inset-0 before:rounded-full before:bg-(--bg-emph-primary-inverse) before:transition-[background,transform] before:duration-150 before:ease-out',
                'hover:before:opacity-90 active:before:scale-[0.98]',
              )}
              onClick={onStop}
            >
              <span className="relative size-2 bg-current" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Send"
              disabled={!canSend}
              className={cn(
                'relative inline-flex size-[22px] flex-none items-center justify-center border-0 bg-transparent p-0',
                'before:absolute before:inset-0 before:rounded-full before:transition-[background,transform,opacity] before:duration-150 before:ease-out',
                canSend
                  ? 'cursor-pointer text-(--text-on-inverse-primary) before:bg-(--bg-emph-primary-inverse) hover:before:opacity-90 active:before:scale-[0.98]'
                  : 'cursor-default text-(--text-tertiary) before:bg-[rgba(26,26,26,0.06)] dark:before:bg-[rgba(245,245,245,0.06)]',
              )}
              onClick={() => canSend && onSubmit(value)}
            >
              <ArrowUp size={14} className="relative" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
      </BorderBeam>
    </div>
  );
}
