"use client";

import { useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { TabsList, TabsTrigger } from "fumadocs-ui/components/tabs";
import { Tabs } from "fumadocs-ui/components/tabs.unstyled";

type DocsTabsProps = {
  children: ReactNode;
  items: string[];
  values: string[];
  /** Mirror the selected tab to `?<param>=<value>` so shared links reopen it. */
  param?: string;
};

// The URL only changes through selectTab, which also sets state, so no
// subscription is needed to keep the snapshot fresh.
const emptySubscribe = () => () => {};

// Controlled tab shell (Fumadocs' styled Tabs cannot be controlled). The
// root's chrome comes from `.docs-tabs > div` in globals.css. Without
// `param`, selection is local state only; with it, the URL is shareable.
// Each `param` should be unique on its page — nested groups need distinct
// names.
export function DocsTabs({ children, items, values, param }: DocsTabsProps) {
  const [picked, setPicked] = useState<string>();
  // Static pages render the first tab (server snapshot); after hydration
  // the URL's choice is adopted before paint. Unknown values fall back.
  const requested = useSyncExternalStore(
    emptySubscribe,
    () =>
      param ? new URLSearchParams(window.location.search).get(param) : null,
    () => null,
  );
  const value =
    picked ??
    (requested && values.includes(requested) ? requested : values[0]);

  function selectTab(next: string) {
    if (!values.includes(next)) return;
    setPicked(next);
    if (!param) return;
    // replaceState keeps other params and the heading hash, adds no history
    // entry, and does not scroll.
    const url = new URL(window.location.href);
    url.searchParams.set(param, next);
    window.history.replaceState(null, "", url);
  }

  return (
    <Tabs className="flex flex-col" value={value} onValueChange={selectTab}>
      <TabsList>
        {items.map((item, index) => (
          <TabsTrigger key={values[index]} value={values[index]}>
            {item}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}
