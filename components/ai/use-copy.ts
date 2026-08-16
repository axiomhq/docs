'use client';

import { useEffect, useRef, useState } from 'react';
import { copyToClipboard } from '@/lib/clipboard';

/**
 * Clipboard copy with a debounced checkmark: every copy restarts the idle
 * timer, so spamming the button holds a steady checkmark instead of
 * flickering, and the copy icon returns only after the clicks stop.
 *
 * Goes through copyToClipboard so insecure LAN origins get the execCommand
 * fallback, and the checkmark only shows when the copy actually happened.
 * Resolves true on success so callers can gate analytics on it.
 */
export function useCopy(timeout = 1200) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async (text: string) => {
    if (!(await copyToClipboard(text))) return false;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), timeout);
    return true;
  };

  return { copied, copy };
}
