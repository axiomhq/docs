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
          toast: 'axiom-toast',
          title: 'axiom-toast-title',
          description: 'axiom-toast-description',
        },
      }}
    />
  );
}
