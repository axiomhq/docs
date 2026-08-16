'use client';

import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Command menu primitives (shadcn base command, cmdk + Base UI Dialog),
 * restyled to the docs design system: --bg-overlay panel, hairline borders,
 * mono section headings with a gradient rule, and the interactive-* row
 * states the rest of the chrome uses.
 */
function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        'flex size-full min-h-0 flex-col overflow-hidden bg-(--bg-canvas) text-(--text-primary)',
        className,
      )}
      {...props}
    />
  );
}

function CommandDialog({
  title,
  description,
  open,
  onOpenChange,
  className,
  children,
}: {
  title: string;
  description: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-[rgba(0,0,0,.58)] backdrop-blur-[2px] duration-100 data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0" />
        <DialogPrimitive.Popup
          data-slot="command-dialog"
          className={cn(
            'fixed top-[18%] left-1/2 z-50 flex max-h-[min(560px,calc(100dvh-64px))] w-[min(640px,calc(100vw-32px))] -translate-x-1/2 flex-col overflow-hidden rounded-md border border-(--border-primary) bg-(--bg-overlay) text-(--text-primary) shadow-[0_16px_48px_rgba(0,0,0,.36)] outline-none duration-100 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[.98] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[.98] max-sm:top-1.5 max-sm:h-[calc(100dvh-12px)] max-sm:max-h-none max-sm:w-[calc(100vw-12px)]',
            className,
          )}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function CommandInput({
  className,
  trailing,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input> & {
  /** Rendered after the input, inside the row — actions like Ask AI. */
  trailing?: React.ReactNode;
}) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex h-12 flex-none items-center gap-2.5 border-b border-(--border-primary) px-3.5 text-(--icon-secondary) max-sm:h-13 max-sm:px-3"
    >
      <Search size={17} aria-hidden="true" className="flex-none" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          'min-w-0 flex-1 border-0 bg-transparent font-sans text-[15px] leading-5 font-[450] tracking-[-.01em] text-(--text-primary) outline-none placeholder:text-(--text-tertiary) placeholder:opacity-100 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
      {trailing}
    </div>
  );
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        'scroll-fade-y min-h-0 flex-1 scroll-py-1.5 overflow-x-hidden overflow-y-auto overscroll-contain p-1.5 outline-none',
        className,
      )}
      {...props}
    />
  );
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn(
        'px-3 py-[38px] text-center font-mono text-[12px] leading-[18px] font-[450] text-(--text-tertiary)',
        className,
      )}
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        'overflow-hidden text-(--text-primary)',
        // Section headings: quiet mono labels in the primary text color.
        '[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-1 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:leading-4 [&_[cmdk-group-heading]]:font-normal [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-(--text-primary)',
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn('mx-2 my-1.5 h-px bg-(--border-primary)', className)}
      {...props}
    />
  );
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        'flex min-h-9 cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 font-sans text-[13px] leading-[18px] font-[450] text-(--text-secondary) outline-none select-none max-md:min-h-11 max-sm:text-[14px]',
        'data-[selected=true]:bg-interactive-selected data-[selected=true]:text-(--text-primary) data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0',
        className,
      )}
      {...props}
    />
  );
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn('ml-auto inline-flex items-center gap-1', className)}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
