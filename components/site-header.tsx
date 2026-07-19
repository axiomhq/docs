'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Check, Menu, Monitor, Moon, Search, Sun, X } from 'lucide-react';
import { useRef, useSyncExternalStore } from 'react';
import { useDocsSearchController } from '@/components/docs-search-provider';

const tabs = [
  { label: 'Documentation', href: '/docs', match: (path: string) => !path.startsWith('/docs/apl/') && !path.startsWith('/docs/mpl/') && !path.startsWith('/docs/restapi/') },
  { label: 'Query reference', href: '/docs/apl/overview', match: (path: string) => path.startsWith('/docs/apl/') || path.startsWith('/docs/mpl/') },
  { label: 'API reference', href: '/docs/restapi/introduction', match: (path: string) => path.startsWith('/docs/restapi/') },
];

function AxiomMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 358 309" aria-hidden="true">
      <path d="M354.75 215.609 278.412 87.847c-3.501-5.872-12.127-10.676-19.17-10.676h-47.659c-11.077 0-15.618-7.548-10.093-16.772l26.136-43.627c2.074-3.463 2.069-7.725-.011-11.183C225.534 2.13 221.691 0 217.533 0h-66.485c-7.044 0-15.688 4.793-19.212 10.652L2.645 225.448c-3.525 5.859-3.526 15.447-.006 21.307l33.243 55.325c5.539 9.217 14.622 9.228 20.184.023l25.974-42.98c5.564-9.205 14.645-9.195 20.185.023l23.548 39.192c3.521 5.86 12.164 10.654 19.207 10.654h153.633c7.04 0 15.685-4.794 19.206-10.654l36.892-61.397c3.521-5.86 3.538-15.459.039-21.332Zm-103.096-6.149c5.505 9.236.945 16.794-10.132 16.794H122.021c-11.077 0-15.609-7.542-10.07-16.76l59.796-99.517c5.539-9.218 14.602-9.217 20.141.001l59.766 99.482Z" />
    </svg>
  );
}

export function DocumentationSections({ className = 'header-tabs', onNavigate }: { className?: string; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className={className} aria-label="Documentation sections">
      {tabs.map((tab) => <Link key={tab.href} href={tab.href} prefetch={false} className={tab.match(pathname) ? 'active' : ''} onClick={onNavigate}>{tab.label}</Link>)}
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
    <header className="site-header">
      <button id="docs-navigation-trigger" className="header-icon mobile-menu-trigger" aria-label={drawerOpen ? 'Close navigation' : 'Open navigation'} aria-controls="docs-navigation-drawer" aria-expanded={drawerOpen} onClick={onMenu}>
        {drawerOpen ? <X size={18} /> : <Menu size={18} />}
      </button>
      <Link href="/docs" prefetch={false} className="brand" aria-label="Axiom documentation home">
        <AxiomMark />
        <span className="brand-badge">Docs</span>
      </Link>
      <DocumentationSections />
      <div className="header-actions">
        <button className="header-search" aria-label="Search documentation and ask AI" onClick={openSearch}>
          <Search size={14} /><span>Search or ask AI…</span><kbd>⌘K</kbd>
        </button>
        <details className="theme-menu" ref={themeMenu}>
          <summary className="header-icon" role="button" aria-haspopup="menu" aria-label={`Color theme: ${selectedTheme}`}><ThemeIcon size={14} /></summary>
          <div className="theme-menu-popover" role="menu" aria-label="Color theme">
            <button role="menuitemradio" aria-checked={selectedTheme === 'system'} onClick={() => chooseTheme('system')}><Monitor size={14} /><span>System</span>{selectedTheme === 'system' && <Check size={13} />}</button>
            <button role="menuitemradio" aria-checked={selectedTheme === 'dark'} onClick={() => chooseTheme('dark')}><Moon size={14} /><span>Dark</span>{selectedTheme === 'dark' && <Check size={13} />}</button>
            <button role="menuitemradio" aria-checked={selectedTheme === 'light'} onClick={() => chooseTheme('light')}><Sun size={14} /><span>Light</span>{selectedTheme === 'light' && <Check size={13} />}</button>
          </div>
        </details>
        <a className="console-button" href="https://app.axiom.co" target="_blank" rel="noreferrer">Open console <span>→</span></a>
      </div>
    </header>
  );
}
