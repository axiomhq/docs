'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Clipboard copy with a debounced checkmark: every copy restarts the idle
 * timer, so spamming the button holds a steady checkmark instead of
 * flickering, and the copy icon returns only after the clicks stop.
 */
export function useCopy(timeout = 1200) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), timeout);
  };

  return { copied, copy };
}
