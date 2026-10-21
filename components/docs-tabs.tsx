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

// The URL only changes through select, which also sets state, so no
// subscription is needed to keep the snapshot fresh.
const emptySubscribe = () => () => {};

// Static pages render the first tab (server snapshot); after hydration the
// URL's choice is adopted before paint. Unknown values fall back. Without
// `param`, selection is local state only; with it, the URL is shareable.
export function useUrlChoice<T extends string>(
  param: string | undefined,
  values: readonly T[],
  resolve: (raw: string) => string = (raw) => raw,
) {
  const [picked, setPicked] = useState<T>();
  const requested = useSyncExternalStore(
    emptySubscribe,
    () =>
      param ? new URLSearchParams(window.location.search).get(param) : null,
    () => null,
  );
  const fromUrl =
    requested === null
      ? undefined
      : values.find((value) => value === resolve(requested));
  const value = picked ?? fromUrl ?? values[0];

  function select(next: T) {
    setPicked(next);
    if (!param) return;
    // replaceState keeps other params and the heading hash, adds no history
    // entry, and does not scroll.
    const url = new URL(window.location.href);
    url.searchParams.set(param, next);
    window.history.replaceState(null, "", url);
  }

  return { value, select };
}

// Controlled tab shell (Fumadocs' styled Tabs cannot be controlled). The
// root's chrome comes from `.docs-tabs > div` in globals.css. Each `param`
// should be unique on its page — nested groups need distinct names.
export function DocsTabs({ children, items, values, param }: DocsTabsProps) {
  const { value, select } = useUrlChoice(param, values);

  function selectTab(next: string) {
    if (values.includes(next)) select(next);
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
