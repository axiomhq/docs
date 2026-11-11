'use client';

import { useTheme } from 'next-themes';
import { Toaster } from 'sonner';

export function DocsToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="bottom-right"
      theme={resolvedTheme === 'light' ? 'light' : 'dark'}
      toastOptions={{
        classNames: {
          // Sonner sets these on the toast itself, so every declaration keeps
          // the `!important` the hand-written rules carried.
          toast:
            'axiom-toast border! border-(--border-primary)! rounded-md! bg-(--bg-overlay)! text-(--text-primary)! shadow-none! font-mono!',
          title: 'axiom-toast-title text-[12px]! font-semibold!',
          description: 'axiom-toast-description text-(--text-tertiary)! text-[11px]!',
          actionButton:
            'axiom-toast-action h-6! px-2! border! border-(--border-primary)! rounded-[3px]! bg-transparent! text-(--text-primary)! font-mono! text-[11px]! font-medium! hover:bg-(--bg-inert)! focus-visible:outline-2! focus-visible:outline-(--color-accent)!',
        },
      }}
    />
  );
}
