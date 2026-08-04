'use client';

import { ZoneLink as Link } from '@/components/zone-link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { withDocsBasePath } from '@/lib/docs-paths';
import { useTheme } from 'next-themes';
import { Check, Menu, Monitor, Moon, Search, Sun, X } from 'lucide-react';
import { useRef, useSyncExternalStore } from 'react';
import { useDocsSearchController } from '@/components/docs-search-provider';
import { captureDocsEvent } from '@/lib/docs-analytics';

const tabs = [
  { label: 'Documentation', href: '/docs', match: (path: string) => !path.startsWith('/docs/apl/') && !path.startsWith('/docs/mpl/') && !path.startsWith('/docs/restapi/') },
  { label: 'Query reference', href: '/docs/apl/overview', match: (path: string) => path.startsWith('/docs/apl/') || path.startsWith('/docs/mpl/') },
  { label: 'API reference', href: '/docs/restapi/introduction', match: (path: string) => path.startsWith('/docs/restapi/') },
];

// Shared chrome for the two `.header-icon` buttons (mobile trigger, theme summary).
// Display is set per call site: the trigger is hidden until max-xl, the theme
// summary is always inline-flex.
const headerIconClass = 'h-7 w-7 items-center justify-center gap-1.5 rounded-[4px] border border-(--border-primary) bg-transparent text-(--text-secondary) cursor-pointer hover:bg-(--bg-emph-primary)';
const themeOptionClass = "flex h-8 w-full items-center gap-2 rounded-[3px] border-0 px-[7px] py-0 bg-transparent text-(--text-tertiary) font-sans text-[13px] leading-4 font-medium cursor-pointer hover:bg-(--bg-emph-tertiary) hover:text-(--text-primary) aria-checked:bg-(--bg-emph-tertiary) aria-checked:text-(--text-primary)";

function AxiomMark() {
  return (
    <svg className="brand-mark w-[25px] h-[22px] fill-current max-sm:w-[23px] max-sm:h-[20px]" viewBox="0 0 358 309" aria-hidden="true">
      <path d="M354.75 215.609 278.412 87.847c-3.501-5.872-12.127-10.676-19.17-10.676h-47.659c-11.077 0-15.618-7.548-10.093-16.772l26.136-43.627c2.074-3.463 2.069-7.725-.011-11.183C225.534 2.13 221.691 0 217.533 0h-66.485c-7.044 0-15.688 4.793-19.212 10.652L2.645 225.448c-3.525 5.859-3.526 15.447-.006 21.307l33.243 55.325c5.539 9.217 14.622 9.228 20.184.023l25.974-42.98c5.564-9.205 14.645-9.195 20.185.023l23.548 39.192c3.521 5.86 12.164 10.654 19.207 10.654h153.633c7.04 0 15.685-4.794 19.206-10.654l36.892-61.397c3.521-5.86 3.538-15.459.039-21.332Zm-103.096-6.149c5.505 9.236.945 16.794-10.132 16.794H122.021c-11.077 0-15.609-7.542-10.07-16.76l59.796-99.517c5.539-9.218 14.602-9.217 20.141.001l59.766 99.482Z" />
    </svg>
  );
}

export function DocumentationSections({ className = 'header-tabs', onNavigate }: { className?: string; onNavigate?: () => void }) {
  // usePathname() strips the /docs basePath, but the tab matchers below expect
  // the full /docs-prefixed path — normalize it the same way the sidebar does.
  const pathname = withDocsBasePath(usePathname());
  // Tab chrome belongs to the header instance only; the drawer instance
  // (`.drawer-sections`) styles the same links from its own rules.
  const headerTabs = className.split(' ').includes('header-tabs');

  return (
    <nav className={cn(className, headerTabs && 'flex gap-1 max-xl:hidden')} aria-label="Documentation sections">
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch={false}
            className={cn(
              active && 'active',
              headerTabs && 'relative rounded-[4px] px-2.5 py-1.5 font-sans text-[14px] leading-4 font-medium tracking-[-.006em] hover:bg-(--bg-emph-tertiary)',
              headerTabs && (active
                ? "text-(--text-primary) after:content-[''] after:absolute after:left-[10px] after:right-[10px] after:bottom-[-14px] after:h-px after:bg-(--color-accent)"
                : 'text-(--text-tertiary) hover:text-(--text-secondary)'),
            )}
            onClick={onNavigate}
          >{tab.label}</Link>
        );
      })}
    </nav>
  );
}

export function SiteHeader({ drawerOpen, onMenu }: { drawerOpen: boolean; onMenu: () => void }) {
  const { theme, setTheme } = useTheme();
  const { openSearch } = useDocsSearchController();
  const themeMenu = useRef<HTMLDetailsElement>(null);
  const themeMounted = useSyncExternalStore(() => () => undefined, () => true, () => false);

  function chooseTheme(value: 'system' | 'dark' | 'light') {
    setTheme(value);
    themeMenu.current?.removeAttribute('open');
  }

  const selectedTheme = themeMounted ? theme ?? 'system' : 'system';
  const ThemeIcon = selectedTheme === 'dark' ? Moon : selectedTheme === 'light' ? Sun : Monitor;

  return (
    <header className="site-header fixed inset-x-0 top-0 bottom-auto z-50 flex h-14 items-center gap-6 px-6 py-0 border-b border-(--border-primary) bg-[color-mix(in_srgb,var(--bg-canvas)_94%,transparent)] backdrop-blur-[12px] max-md:gap-3 max-md:px-4 max-sm:gap-2">
      {/* Hidden on desktop; becomes the drawer toggle below xl, matching
          the drawer breakpoint in docs-shell. */}
      <button id="docs-navigation-trigger" className={cn('header-icon mobile-menu-trigger hidden', headerIconClass, 'max-xl:inline-flex max-xl:h-10 max-xl:w-10 max-xl:-ml-2 max-xl:border-transparent')} aria-label={drawerOpen ? 'Close navigation' : 'Open navigation'} aria-controls="docs-navigation-drawer" aria-expanded={drawerOpen} onClick={onMenu}>
        {drawerOpen ? <X size={16} /> : <Menu size={16} />}
      </button>
      <Link href="/docs" prefetch={false} className="brand flex h-7 flex-none items-center gap-[9px]" aria-label="Axiom documentation home">
        <AxiomMark />
        <span className="brand-badge inline-flex h-[18px] items-center pl-[9px] border-0 border-l-2 border-(--color-accent) rounded-none bg-transparent text-(--text-primary) font-mono text-[14px] leading-[18px] font-semibold tracking-[.04em] uppercase max-md:hidden">Docs</span>
      </Link>
      <DocumentationSections />
      <div className="header-actions ml-auto flex items-center gap-2 max-sm:gap-1.5">
        <button className="header-search flex h-7 w-[220px] items-center gap-2 px-2 py-0 rounded-[4px] border border-(--border-primary) bg-(--bg-inert) text-(--text-tertiary) cursor-pointer max-lg:w-[34px] max-lg:justify-center" aria-label="Search documentation and ask AI" onClick={() => openSearch('header')}>
          <Search size={14} /><span className="flex-1 text-left font-sans text-[14px] leading-4 font-[450] max-lg:hidden">Search or ask AI…</span><kbd className="max-lg:hidden">⌘K</kbd>
        </button>
        <details className="theme-menu group relative" ref={themeMenu}>
          <summary className={cn('header-icon inline-flex', headerIconClass, 'list-none [&::-webkit-details-marker]:hidden group-open:bg-(--bg-emph-primary)')} role="button" aria-haspopup="menu" aria-label={`Color theme: ${selectedTheme}`}><ThemeIcon size={14} /></summary>
          <div className="theme-menu-popover hidden group-open:block absolute top-[34px] right-0 z-[70] w-[132px] p-1 rounded-[4px] border border-(--border-primary) bg-(--bg-overlay) shadow-[0_8px_28px_rgba(0,0,0,.28)]" role="menu" aria-label="Color theme">
            <button className={themeOptionClass} role="menuitemradio" aria-checked={selectedTheme === 'system'} onClick={() => chooseTheme('system')}><Monitor size={14} /><span className="flex-1 text-left">System</span>{selectedTheme === 'system' && <Check size={13} />}</button>
            <button className={themeOptionClass} role="menuitemradio" aria-checked={selectedTheme === 'dark'} onClick={() => chooseTheme('dark')}><Moon size={14} /><span className="flex-1 text-left">Dark</span>{selectedTheme === 'dark' && <Check size={13} />}</button>
            <button className={themeOptionClass} role="menuitemradio" aria-checked={selectedTheme === 'light'} onClick={() => chooseTheme('light')}><Sun size={14} /><span className="flex-1 text-left">Light</span>{selectedTheme === 'light' && <Check size={13} />}</button>
          </div>
        </details>
        <a
          className="console-button inline-flex h-7 items-center gap-1 px-3 py-0 rounded-[4px] bg-(--bg-emph-primary-inverse) text-(--text-on-inverse-primary) font-sans text-[14px] leading-4 font-semibold max-md:hidden"
          href="https://app.axiom.co"
          target="_blank"
          rel="noreferrer"
          onClick={() => captureDocsEvent('docs_console_opened', { placement: 'header' })}
        >
          Open console <span>→</span>
        </a>
      </div>
    </header>
  );
}
