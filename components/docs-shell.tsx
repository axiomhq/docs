"use client";

import { ZoneLink as Link } from "@/components/zone-link";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { withDocsBasePath } from "@/lib/docs-paths";
import type {
  NavigationGroup,
  NavigationItem,
} from "@/lib/navigation";
import { DocumentationSections, SiteHeader } from "./site-header";

type Section = "documentation" | "query" | "api" | "changelog";

// Mirrors lib/navigation's getSection rather than importing it: that module
// pulls docs.json and the fumadocs source into any bundle that imports it.
function sectionOf(pathname: string): Section {
  if (
    pathname === "/docs/changelog" ||
    pathname.startsWith("/docs/changelog/")
  )
    return "changelog";
  if (
    pathname.startsWith("/docs/apl/") ||
    pathname.startsWith("/docs/mpl/")
  )
    return "query";
  if (pathname.startsWith("/docs/restapi/")) return "api";
  return "documentation";
}

function containsActive(
  item: NavigationItem,
  activeHref: string,
): boolean {
  if (item.href === activeHref) return true;
  return (
    item.children?.some((child) =>
      containsActive(child, activeHref),
    ) ?? false
  );
}

function isSyntaxReference(href?: string): boolean {
  return Boolean(
    href &&
    /\/(?:scalar-functions|aggregation-functions|operators)\//.test(
      href,
    ),
  );
}

function NavItem({
  item,
  activeHref,
  onNavigate,
  depth = 0,
}: {
  item: NavigationItem;
  activeHref: string;
  onNavigate: () => void;
  depth?: number;
}) {
  if (item.children) {
    const open = containsActive(item, activeHref);
    return (
      <details
        className="nav-nested mx-0 my-px open:[&>summary_svg]:[transform:rotate(90deg)]"
        open={open}
      >
        <summary
          className={cn(
            "flex min-h-[30px] m-0 -mx-2.5 cursor-pointer items-center gap-[7px] rounded-md px-2.5 py-1.5 font-sans text-[14px] leading-[18px] tracking-[-.006em] max-xl:min-h-[40px] max-xl:py-2",
            "font-[450] text-secondary-foreground! [&:hover]:bg-sidebar-accent [&:hover]:text-sidebar-accent-foreground!",
            "list-none [&::-webkit-details-marker]:hidden",
          )}
          // Indent the row itself while preserving the pill's symmetric gutter.
          style={{ marginLeft: -10 + depth * 10 }}
        >
          <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
            {item.title}
          </span>
          <ChevronRight
            size={12}
            className="ml-auto flex-none [transition:transform_.15s_ease]"
          />
        </summary>
        <div>
          {item.children.map((child) => (
            <NavItem
              key={child.href ?? child.title}
              item={child}
              activeHref={activeHref}
              onNavigate={onNavigate}
              depth={depth + 1}
            />
          ))}
        </div>
      </details>
    );
  }

  const active = item.href === activeHref;
  const syntaxReference = isSyntaxReference(item.href);

  return (
    <Link
      href={item.href!}
      prefetch={false}
      className={cn(
        "sidebar-link",
        "flex min-h-[30px] m-0 -mx-2.5 cursor-pointer items-center gap-[7px] rounded-md px-2.5 py-1.5 font-sans text-[14px] leading-[18px] tracking-[-.006em] max-xl:min-h-[40px] max-xl:py-2",
        active &&
          "active bg-sidebar-accent font-[450] text-sidebar-accent-foreground! [text-shadow:-0.2px_0_0_currentColor,0.2px_0_0_currentColor]",
        !active &&
          "font-[450] text-secondary-foreground! [&:hover]:bg-sidebar-accent [&:hover]:text-sidebar-accent-foreground!",
        syntaxReference && "syntax-reference-link",
      )}
      // Indent the row itself while preserving the pill's symmetric gutter.
      style={{ marginLeft: -10 + depth * 10 }}
      onClick={onNavigate}
    >
      <span
        className={cn(
          "sidebar-link-label",
          "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap",
          syntaxReference &&
            "font-(family-name:--font-query) tracking-[0]",
        )}
      >
        {item.title}
      </span>
      {item.method && (
        <span
          className={cn(
            "method",
            "method-" + item.method.toLowerCase(),
            "ml-auto min-w-[34px] flex-none rounded-[3px] px-1 py-px text-center font-mono text-[10px] leading-[14px] font-semibold tracking-[.02em]",
          )}
        >
          {item.method}
        </span>
      )}
    </Link>
  );
}

export function DocsShell({
  navigations,
  children,
}: {
  navigations: Record<Section, NavigationGroup[]>;
  children: React.ReactNode;
}) {
  // The shell lives in the root layout so navigation payloads exclude it; the
  // active page and sidebar section are derived from the pathname instead of
  // per-page props. usePathname reports app-relative paths (no /docs basePath).
  const pathname = usePathname();
  const activeHref = pathname === "/" ? "/docs" : withDocsBasePath(pathname);
  const navigation = navigations[sectionOf(activeHref)];
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 80rem)");
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setDrawerOpen(false);
    };
    desktop.addEventListener("change", closeAtDesktop);
    return () =>
      desktop.removeEventListener("change", closeAtDesktop);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current
      ?.querySelector<HTMLAnchorElement>(".drawer-sections a")
      ?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setDrawerOpen(false);
      document.getElementById("docs-navigation-trigger")?.focus();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [drawerOpen]);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="docs-app flex min-h-svh flex-col bg-background text-foreground">
      <SiteHeader
        drawerOpen={drawerOpen}
        onMenu={() => setDrawerOpen((open) => !open)}
      />
      <div className="docs-body flex min-h-0 flex-1">
        <aside
          id="docs-navigation-drawer"
          ref={drawerRef}
          className={cn(
            "sidebar sticky top-14 z-30 flex h-[calc(100svh-3.5rem)] w-64 flex-none flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground max-xl:fixed max-xl:bottom-0 max-xl:left-0 max-xl:z-[70] max-xl:h-auto max-xl:w-[min(300px,86vw)] max-xl:shadow-[12px_0_48px_rgba(0,0,0,.35)] motion-reduce:[transition:none]!",
            drawerOpen
              ? "open max-xl:visible max-xl:[transform:translateX(0)] max-xl:[transition:transform_.2s_ease,visibility_0s_linear_0s]"
              : "max-xl:invisible max-xl:[transform:translateX(-105%)] max-xl:[transition:transform_.2s_ease,visibility_0s_linear_.2s]",
          )}
        >
          <div className="sidebar-scroll scroll-fade-t scroll-fade-b min-h-0 flex-1 overflow-y-auto px-6 pt-14 pb-12 [scrollbar-width:thin] max-xl:pt-4 max-xl:pb-[max(48px,env(safe-area-inset-bottom))]">
            <DocumentationSections
              className={cn(
                "drawer-sections hidden",
                "max-xl:m-0 max-xl:mb-5 max-xl:flex max-xl:flex-col max-xl:gap-px max-xl:border-b max-xl:border-sidebar-border max-xl:pb-3",
                "max-xl:-mx-6 max-xl:px-6",
                "max-xl:[&_a]:flex max-xl:[&_a]:min-h-[38px] max-xl:[&_a]:items-center max-xl:[&_a]:-mx-2.5 max-xl:[&_a]:rounded-md max-xl:[&_a]:px-2.5 max-xl:[&_a]:py-0 max-xl:[&_a]:font-sans max-xl:[&_a]:text-[13px] max-xl:[&_a]:leading-[18px]",
                "max-xl:[&_a:not(.active)]:font-medium max-xl:[&_a:not(.active)]:text-secondary-foreground!",
                "max-xl:[&_a:not(.active):hover]:bg-sidebar-accent max-xl:[&_a:not(.active):hover]:text-sidebar-accent-foreground!",
                "max-xl:[&_a.active]:bg-sidebar-accent max-xl:[&_a.active]:font-medium max-xl:[&_a.active]:text-sidebar-accent-foreground! max-xl:[&_a.active]:[text-shadow:-0.2px_0_0_currentColor,0.2px_0_0_currentColor]",
              )}
              onNavigate={closeDrawer}
            />
            <nav aria-label="Page navigation">
              {navigation.map((group) => (
                <section
                  // 20px group gap on mobile matches the divider→first-heading
                  // gap above, so the drawer keeps one vertical rhythm.
                  className="sidebar-group m-0 mb-6 max-xl:mb-5"
                  key={group.title}
                >
                  {/* Every utility that collides with the UNLAYERED `h1,h2,…` / `h2` element
                    rules in styles/tokens.css is !important: unlayered declarations beat
                    `@layer utilities` no matter the specificity, so without `!` these
                    headings fall back to 24px/28px sans. */}
                  <h2 className="m-0! mb-2! font-mono! text-[11px]! leading-[14px]! font-semibold! tracking-[.1em]! text-secondary-foreground! uppercase">
                    {group.title}
                  </h2>
                  {group.items.map((item) => (
                    <NavItem
                      key={item.href ?? item.title}
                      item={item}
                      activeHref={activeHref}
                      onNavigate={closeDrawer}
                    />
                  ))}
                </section>
              ))}
            </nav>
          </div>
        </aside>
        {drawerOpen && (
          <button
            className="sidebar-backdrop hidden max-xl:fixed max-xl:inset-[56px_0_0] max-xl:z-[60] max-xl:block max-xl:border-0 max-xl:bg-[rgba(0,0,0,.5)]"
            aria-hidden="true"
            tabIndex={-1}
            onClick={closeDrawer}
          />
        )}
        <main className="docs-main min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
