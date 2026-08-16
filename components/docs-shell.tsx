"use client";

import {
  apiSidebarPageIcons,
  ChevronIcon,
  documentationSidebarGroupIcons,
  documentationSidebarPageIcons,
  querySidebarGroupIcons,
  querySidebarPageIcons,
  type SidebarIconAsset,
} from "@/assets/icons";
import { ZoneLink as Link } from "@/components/zone-link";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SidebarNestedConnector,
  useSidebarConnectorPoints,
} from "@/components/sidebar-connector";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { withDocsBasePath } from "@/lib/docs-paths";
import type {
  NavigationGroup,
  NavigationItem,
} from "@/lib/navigation";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { AskAiButton } from "./ask-ai-button";
import { DocsAssistantSidebar } from "./docs-assistant-sidebar";
import { useDocsSearchController } from "./docs-search-provider";
import { DocumentationSections, SiteHeader } from "./site-header";

type Section = "documentation" | "query" | "api" | "changelog";
type SidebarIconSection = Exclude<Section, "changelog">;

const noSidebarGroupIcons: Readonly<
  Record<string, SidebarIconAsset>
> = {};

const sidebarIconMaps = {
  documentation: {
    groups: documentationSidebarGroupIcons,
    pages: documentationSidebarPageIcons,
  },
  query: {
    groups: querySidebarGroupIcons,
    pages: querySidebarPageIcons,
  },
  api: {
    groups: noSidebarGroupIcons,
    pages: apiSidebarPageIcons,
  },
} satisfies Record<
  SidebarIconSection,
  {
    groups: Readonly<Record<string, SidebarIconAsset>>;
    pages: Readonly<Record<string, SidebarIconAsset>>;
  }
>;

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

function SidebarIcon({
  icon,
  className,
}: {
  icon: SidebarIconAsset;
  className?: string;
}) {
  const Icon = icon.icon;

  return (
    <Icon
      aria-hidden="true"
      className={cn("sidebar-item-icon flex-none", className)}
      data-slot="sidebar-icon"
      focusable="false"
      width={icon.size}
      height={icon.size}
    />
  );
}

function DisclosureIcon() {
  return (
    <ChevronIcon
      aria-hidden="true"
      className="sidebar-chevron ml-auto h-[5px] w-[9px] flex-none -rotate-90 transition-transform duration-150 ease-out"
    />
  );
}

function NestedNavItem({
  item,
  activeHref,
  onNavigate,
  depth,
  iconSection,
  icon,
}: {
  item: NavigationItem;
  activeHref: string;
  onNavigate: () => void;
  depth: number;
  iconSection?: SidebarIconSection;
  icon?: SidebarIconAsset;
}) {
  const open = containsActive(item, activeHref);
  const activeChildIndex =
    item.children?.findIndex((child) =>
      containsActive(child, activeHref),
    ) ?? -1;
  const activeChild = item.children?.[activeChildIndex];
  const activeContinues = Boolean(
    activeChild?.children?.some((child) =>
      containsActive(child, activeHref),
    ),
  );
  const [hoveredChild, setHoveredChild] = useState<{
    index: number;
    continues: boolean;
  } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const connectorPoints = useSidebarConnectorPoints(
    listRef,
    item.children?.length ?? 0,
  );

  const updateHoveredChild = (target: EventTarget | null) => {
    const list = listRef.current;
    if (!list || !(target instanceof Node)) return;

    const children = Array.from(
      list.querySelectorAll<HTMLElement>(
        ":scope > [data-sidebar-child]",
      ),
    );
    const index = children.findIndex((child) => child.contains(target));
    if (index < 0) return;

    const row = children[index]?.querySelector<HTMLElement>(
      ":scope > [data-sidebar-row], :scope > details > [data-sidebar-row]",
    );
    const next = {
      index,
      continues: Boolean(row && !row.contains(target)),
    };
    setHoveredChild((current) =>
      current?.index === next.index &&
      current.continues === next.continues
        ? current
        : next,
    );
  };

  return (
    <details
      className={cn(
        "nav-nested mx-0 open:[&>summary_.sidebar-chevron]:rotate-0",
        depth === 0 &&
          activeChildIndex >= 0 &&
          "[&>summary]:bg-interactive-hover [&>summary]:text-sidebar-accent-foreground!",
      )}
      open={open}
    >
      <summary
        data-sidebar-row
        className={cn(
          "relative m-0 flex h-7.5 cursor-pointer items-center gap-2 rounded-[4px] px-2.5 font-sans text-[13px] leading-none font-normal tracking-normal max-xl:min-h-10",
          "text-secondary-foreground! [&:hover]:bg-interactive-hover [&:hover]:text-sidebar-accent-foreground!",
          "list-none [&::-webkit-details-marker]:hidden",
        )}
        style={
          depth > 0 ? { paddingLeft: 12 + depth * 20 } : undefined
        }
      >
        {icon && <SidebarIcon icon={icon} />}
        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
          {item.title}
        </span>
        <DisclosureIcon />
      </summary>
      <div
        ref={listRef}
        data-active-child-index={activeChildIndex}
        className="relative flex flex-col gap-0.5"
        onMouseOver={(event) => updateHoveredChild(event.target)}
        onMouseLeave={() => setHoveredChild(null)}
        onFocusCapture={(event) => updateHoveredChild(event.target)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setHoveredChild(null);
          }
        }}
      >
        <SidebarNestedConnector
          points={connectorPoints}
          activeIndex={activeChildIndex}
          activeContinues={activeContinues}
          branchDepth={depth}
          hoveredIndex={hoveredChild?.index ?? null}
          hoverContinues={hoveredChild?.continues ?? false}
        />
        {item.children?.map((child) => (
          <div
            data-sidebar-child
            key={child.href ?? child.title}
          >
            <NavItem
              item={child}
              activeHref={activeHref}
              onNavigate={onNavigate}
              depth={depth + 1}
              iconSection={iconSection}
            />
          </div>
        ))}
      </div>
    </details>
  );
}

function NavItem({
  item,
  activeHref,
  onNavigate,
  depth = 0,
  iconSection,
}: {
  item: NavigationItem;
  activeHref: string;
  onNavigate: () => void;
  depth?: number;
  iconSection?: SidebarIconSection;
}) {
  const iconMap = iconSection
    ? sidebarIconMaps[iconSection]
    : undefined;
  const icon =
    iconMap && depth === 0
      ? item.href
        ? iconMap.pages[item.href]
        : iconMap.groups[item.title]
      : undefined;

  if (item.children) {
    return (
      <NestedNavItem
        item={item}
        activeHref={activeHref}
        onNavigate={onNavigate}
        depth={depth}
        iconSection={iconSection}
        icon={icon}
      />
    );
  }

  const active = item.href === activeHref;

  return (
    <Link
      data-sidebar-row
      href={item.href!}
      prefetch={false}
      className={cn(
        "sidebar-link",
        "relative m-0 flex h-7.5 cursor-pointer items-center gap-2 rounded-[4px] px-2.5 font-sans text-[13px] leading-none font-normal tracking-normal max-xl:min-h-10",
        active &&
          "active bg-interactive-selected text-sidebar-accent-foreground!",
        !active &&
          "text-secondary-foreground! [&:hover]:bg-interactive-hover [&:hover]:text-sidebar-accent-foreground!",
      )}
      style={depth > 0 ? { paddingLeft: 12 + depth * 20 } : undefined}
      onClick={onNavigate}
    >
      {icon && <SidebarIcon icon={icon} />}
      <span className="sidebar-link-label min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
        {item.title}
      </span>
      {item.method && (
        <span
          className={cn(
            "method",
            "method-" + item.method.toLowerCase(),
            "ml-auto min-w-[34px] flex-none rounded-[3px] px-1 py-px text-center font-mono text-[10px] leading-[14px] font-normal tracking-[.02em]",
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
  const activeHref =
    pathname === "/" ? "/docs" : withDocsBasePath(pathname);
  const activeSection = sectionOf(activeHref);
  const navigation = navigations[activeSection];
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { assistantOpen } = useDocsSearchController();
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
    <div
      className="docs-app flex h-svh overflow-hidden flex-col bg-background text-foreground"
      // globals.css keys off this to collapse the floating TOC and its grid
      // rail while the Ask AI sidebar occupies the right edge.
      data-assistant-open={assistantOpen || undefined}
    >
      <SiteHeader
        drawerOpen={drawerOpen}
        onMenu={() => setDrawerOpen((open) => !open)}
      />
      <div className="docs-body flex min-h-0 flex-1">
        <aside
          id="docs-navigation-drawer"
          ref={drawerRef}
          className={cn(
            "sidebar sticky top-14 z-30 flex h-[calc(100svh-3.5rem)] w-68 flex-none flex-col select-none bg-background text-sidebar-foreground max-xl:fixed max-xl:bottom-0 max-xl:left-0 max-xl:z-[70] max-xl:h-auto max-xl:w-[min(300px,86vw)] max-xl:shadow-[12px_0_48px_rgba(0,0,0,.35)] motion-reduce:[transition:none]!",
            drawerOpen
              ? "open max-xl:visible max-xl:[transform:translateX(0)] max-xl:[transition:transform_.2s_ease,visibility_0s_linear_0s]"
              : "max-xl:invisible max-xl:[transform:translateX(-105%)] max-xl:[transition:transform_.2s_ease,visibility_0s_linear_.2s]",
          )}
        >
          <ScrollArea
            className="sidebar-scroll min-h-0 flex-1"
            viewportClassName="scroll-fade-t scroll-fade-b"
            scrollbarClassName="opacity-0 transition-opacity duration-150 data-[scrolling]:opacity-100"
          >
            <div className="sidebar-scroll-content px-[15px] pt-5 pb-6 max-xl:px-4 max-xl:pt-4 max-xl:pb-[max(48px,env(safe-area-inset-bottom))]">
              <DocumentationSections
                className={cn(
                  "drawer-sections hidden",
                  "max-xl:m-0 max-xl:mb-5 max-xl:flex max-xl:flex-col max-xl:gap-0.5 max-xl:border-b max-xl:border-sidebar-border max-xl:pb-3",
                  "max-xl:-mx-4 max-xl:px-4",
                  "max-xl:[&_a]:flex max-xl:[&_a]:min-h-[38px] max-xl:[&_a]:items-center max-xl:[&_a]:gap-2 max-xl:[&_a]:rounded-md max-xl:[&_a]:px-2.5 max-xl:[&_a]:py-0 max-xl:[&_a]:font-sans max-xl:[&_a]:text-[13px] max-xl:[&_a]:leading-[18px] max-xl:[&_a]:font-normal",
                  "max-xl:[&_a:not(.active)]:text-secondary-foreground!",
                  "max-xl:[&_a:not(.active):hover]:bg-interactive-hover max-xl:[&_a:not(.active):hover]:text-sidebar-accent-foreground!",
                  "max-xl:[&_a.active]:bg-interactive-selected max-xl:[&_a.active]:text-sidebar-accent-foreground! max-xl:[&_a.active]:[text-shadow:-0.2px_0_0_currentColor,0.2px_0_0_currentColor]",
                )}
                onNavigate={closeDrawer}
              />
              <nav aria-label="Page navigation">
                {navigation.map((group) => (
                  <section
                    // 20px group gap on mobile matches the divider→first-heading
                    // gap above, so the drawer keeps one vertical rhythm.
                    className="sidebar-group m-0 mb-5 last:mb-0"
                    key={group.title}
                  >
                    {/* Every utility that collides with the UNLAYERED `h1,h2,…` / `h2` element
                      rules in styles/tokens.css is !important: unlayered declarations beat
                      `@layer utilities` no matter the specificity, so without `!` these
                      headings fall back to 24px/28px sans. */}
                    <h2 className="m-0! mb-2.5! px-2.5 font-mono! text-[11px]! leading-[14px]! font-medium! tracking-normal! text-sidebar-foreground! uppercase">
                      {group.title}
                    </h2>
                    <div className="flex flex-col gap-0.5">
                      {group.items.map((item) => (
                        <NavItem
                          key={item.href ?? item.title}
                          item={item}
                          activeHref={activeHref}
                          onNavigate={closeDrawer}
                          iconSection={
                            activeSection === "changelog"
                              ? undefined
                              : activeSection
                          }
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </nav>
            </div>
          </ScrollArea>
        </aside>
        {drawerOpen && (
          <button
            className="sidebar-backdrop hidden max-xl:fixed max-xl:inset-[56px_0_0] max-xl:z-[60] max-xl:block max-xl:border-0 max-xl:bg-[rgba(0,0,0,.5)]"
            aria-hidden="true"
            tabIndex={-1}
            onClick={closeDrawer}
          />
        )}
        <ResizablePanelGroup
          orientation="horizontal"
          className="docs-main-panels min-h-0 min-w-0 flex-1"
        >
          {/* The collapsed/mobile flex overrides for these two panels live in
              globals.css, keyed on the panel ids — the library applies
              `className` to an inner div, not the sized panel element. */}
          <ResizablePanel id="docs-main-panel" className="min-w-0">
            <ScrollArea
              key={pathname}
              className="docs-main-scroll h-full min-w-0"
              viewportClassName="docs-scroll-viewport overscroll-contain"
              scrollbarClassName="opacity-0 transition-opacity duration-150 data-[scrolling]:opacity-100"
            >
              <main className="docs-main min-w-0 pb-14">{children}</main>
            </ScrollArea>
          </ResizablePanel>
          <ResizableHandle
            className={cn(
              // The library flags pointer proximity via data-separator (CSS
              // :hover rarely fires — the panels overlap the 1px line).
              "bg-border/50 transition-colors data-[separator=hover]:bg-brand/70 data-[separator=active]:bg-brand max-xl:hidden",
              !assistantOpen && "hidden",
            )}
          />
          <ResizablePanel
            id="docs-assistant-panel"
            defaultSize={360}
            minSize={320}
            maxSize={440}
          >
            <DocsAssistantSidebar />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <AskAiButton />
    </div>
  );
}
