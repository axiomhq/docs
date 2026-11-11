'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { readPrefillValues, setPlaceholderValues, withoutPrefillParams } from '@/lib/placeholder-values';

// Applies `?domain=…&dataset=…` from Console links to every code example, then
// removes the params from the address bar. The toast names what was applied so
// readers can tell where the values came from and undo them.
export function PlaceholderPrefill() {
  const pathname = usePathname();

  useEffect(() => {
    const { values, present } = readPrefillValues(window.location.search);
    if (!present) return;
    window.history.replaceState(window.history.state, '', withoutPrefillParams(window.location.href));
    const applied = [values.DATASET_NAME, values.AXIOM_DOMAIN].filter(Boolean);
    if (applied.length === 0) return;

    setPlaceholderValues(values);
    toast('Code examples use your values', {
      id: 'placeholder-prefill',
      className: 'ph-no-capture',
      description: <span className="block wrap-anywhere">{applied.map((value) => <span className="block" key={value}>{value}</span>)}</span>,
      action: {
        label: 'Clear',
        onClick: () => setPlaceholderValues(Object.fromEntries(Object.keys(values).map((key) => [key, undefined]))),
      },
    });
  }, [pathname]);

  return null;
}
