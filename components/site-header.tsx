"use client";

import { ZoneLink as Link } from "@/components/zone-link";
import { Button, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { withDocsBasePath } from "@/lib/docs-paths";
import { useTheme } from "next-themes";
import { Menu, X } from "lucide-react";
import { Asleep, Awake, Search } from "@carbon/icons-react";
import {
  ApiIntroductionIcon,
  QueryReferenceIcon,
  WhatIsAxiomIcon,
} from "@/assets/icons";
import { type CSSProperties, useSyncExternalStore } from "react";
import { useDocsSearchController } from "@/components/docs-search-provider";
import { captureDocsEvent } from "@/lib/docs-analytics";

// Store-less subscription for the useSyncExternalStore hydration idiom below.
const emptySubscribe = () => () => {};

const tabs = [
  {
    label: "Documentation",
    href: "/docs",
    // Each section's intro icon, shown only in the drawer instance so the
    // tabs read like the sidebar items beneath them.
    Icon: WhatIsAxiomIcon,
    match: (path: string) =>
      !path.startsWith("/docs/apl/") &&
      !path.startsWith("/docs/mpl/") &&
      !path.startsWith("/docs/restapi/"),
  },
  {
    label: "Query Reference",
    href: "/docs/apl/overview",
    Icon: QueryReferenceIcon,
    match: (path: string) =>
      path.startsWith("/docs/apl/") || path.startsWith("/docs/mpl/"),
  },
  {
    label: "API Reference",
    href: "/docs/restapi/introduction",
    Icon: ApiIntroductionIcon,
    match: (path: string) => path.startsWith("/docs/restapi/"),
  },
];

function AxiomMark() {
  return (
    <svg
      className="brand-mark h-[19px] w-[22px] fill-current"
      viewBox="0 0 358 309"
      aria-hidden="true"
    >
      <path d="M354.75 215.609 278.412 87.847c-3.501-5.872-12.127-10.676-19.17-10.676h-47.659c-11.077 0-15.618-7.548-10.093-16.772l26.136-43.627c2.074-3.463 2.069-7.725-.011-11.183C225.534 2.13 221.691 0 217.533 0h-66.485c-7.044 0-15.688 4.793-19.212 10.652L2.645 225.448c-3.525 5.859-3.526 15.447-.006 21.307l33.243 55.325c5.539 9.217 14.622 9.228 20.184.023l25.974-42.98c5.564-9.205 14.645-9.195 20.185.023l23.548 39.192c3.521 5.86 12.164 10.654 19.207 10.654h153.633c7.04 0 15.685-4.794 19.206-10.654l36.892-61.397c3.521-5.86 3.538-15.459.039-21.332Zm-103.096-6.149c5.505 9.236.945 16.794-10.132 16.794H122.021c-11.077 0-15.609-7.542-10.07-16.76l59.796-99.517c5.539-9.218 14.602-9.217 20.141.001l59.766 99.482Z" />
    </svg>
  );
}

export function AxiomDocsBrand({
  className,
}: {
  className?: string;
}) {
  return (
    <Link
      href="/docs"
      prefetch={false}
      className={cn(
        "brand flex h-7 flex-none items-center gap-2.5",
        className,
      )}
      aria-label="Axiom documentation home"
    >
      <AxiomMark />
      <span className="brand-badge inline-flex h-4 items-center border-0 border-l-2 border-brand bg-transparent pl-2.5 font-mono text-[15px] leading-none font-medium tracking-[-.05em] text-foreground max-md:hidden">
        Docs
      </span>
    </Link>
  );
}

export function DocumentationSections({
  className = "header-tabs",
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  // usePathname() strips the /docs basePath, but the tab matchers below expect
  // the full /docs-prefixed path — normalize it the same way the sidebar does.
  const pathname = withDocsBasePath(usePathname());
  // Tab chrome belongs to the header instance only; the drawer instance
  // (`.drawer-sections`) styles the same links from its own rules.
  const headerTabs = className.split(" ").includes("header-tabs");

  return (
    <nav
      className={cn(
        className,
        headerTabs && "flex items-center gap-2 max-xl:hidden",
      )}
      aria-label="Documentation sections"
    >
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch={false}
            className={cn(
              active && "active",
              headerTabs &&
                "relative flex h-[30px] items-center justify-center rounded-md font-medium px-2.5 font-sans text-[13px] leading-none",
              headerTabs &&
                "bg-transparent hover:bg-interactive-hover hover:text-foreground",
              headerTabs &&
                (active
                  ? "text-foreground after:absolute after:left-2.5 after:right-2.5 after:-bottom-[13px] after:h-px after:bg-brand after:content-['']"
                  : "text-secondary-foreground"),
            )}
            onClick={onNavigate}
          >
            {!headerTabs && (
              <tab.Icon
                aria-hidden="true"
                className="sidebar-item-icon flex-none"
                width={14}
                height={14}
              />
            )}
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SiteHeader({
  drawerOpen,
  onMenu,
}: {
  drawerOpen: boolean;
  onMenu: () => void;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  // The theme is unknowable during SSR, so aria-pressed appears after
  // hydration; before that the button is a plain (state-less) toggle,
  // matching the CSS-driven Moon/Sun swap.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const { openSearch } = useDocsSearchController();

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <header className="site-header sticky top-0 z-50 flex h-14 flex-none items-center gap-[30px] border-b border-border/50 bg-background pl-[22px] pr-4 backdrop-blur-[12px] max-xl:gap-3 max-md:px-4 max-sm:gap-2">
      <AxiomDocsBrand />
      <DocumentationSections />
      <div className="header-actions ml-auto flex items-center gap-3 max-lg:gap-2 max-sm:gap-1.5">
        <button
          className="header-search flex h-7 w-[260px] items-center gap-1.5 overflow-hidden rounded-md border border-border/50 bg-transparent px-2 text-muted-foreground cursor-pointer hover:bg-interactive-hover max-lg:w-auto"
          aria-label="Search documentation and ask AI"
          onClick={() => openSearch("header")}
        >
          <Search size={12} />
          <span className="min-w-0 flex-1 truncate text-left font-sans text-[12px] leading-none font-normal max-lg:hidden">
            What are you looking for?
          </span>
          {/* Compact label for the icon-only breakpoint. */}
          <span className="hidden font-sans text-[12px] leading-none font-normal max-lg:inline">
            Search
          </span>
        </button>
        <span
          className="header-divider h-4 w-px flex-none bg-border max-sm:hidden"
          aria-hidden="true"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Toggle color theme"
          aria-pressed={mounted ? resolvedTheme === "dark" : undefined}
          onClick={toggleTheme}
        >
          <Asleep
            size={14}
            data-theme-icon="moon"
            className="hidden [html.light_&]:block"
            aria-hidden="true"
          />
          <Awake
            size={14}
            data-theme-icon="sun"
            className="hidden [html.dark_&]:block"
            aria-hidden="true"
          />
        </Button>
        <span
          className="header-divider h-4 w-px flex-none bg-border max-md:hidden"
          aria-hidden="true"
        />
        <ButtonLink
          arrow
          href="https://app.axiom.co"
          target="_blank"
          rel="noreferrer"
          variant="solid-color"
          className="console-button h-7 rounded-md px-2 font-sans text-[13px] leading-none font-[450] focus-visible:ring-3 active:not-aria-[haspopup]:scale-98 max-md:hidden"
          style={{ "--btn-accent": "var(--brand)" } as CSSProperties}
          onClick={() =>
            captureDocsEvent("docs_console_opened", {
              placement: "header",
            })
          }
        >
          Open Console
        </ButtonLink>
        {/* Hidden on desktop; becomes the drawer toggle below xl, matching
            the drawer breakpoint in docs-shell. Last in the row so it sits
            at the far right on phones; Button's icon size matches the theme
            toggle next to it. */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          id="docs-navigation-trigger"
          className="mobile-menu-trigger xl:hidden"
          aria-label={
            drawerOpen ? "Close navigation" : "Open navigation"
          }
          aria-controls="docs-navigation-drawer"
          aria-expanded={drawerOpen}
          onClick={onMenu}
        >
          {drawerOpen ? <X /> : <Menu />}
        </Button>
      </div>
    </header>
  );
}
