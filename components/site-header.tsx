'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Check, Menu, Monitor, Moon, Search, Sun, X } from 'lucide-react';
import { useSearchContext } from 'fumadocs-ui/contexts/search';
import { useRef, useState, useSyncExternalStore } from 'react';

const tabs = [
  { label: 'Documentation', href: '/docs', match: (path: string) => !path.startsWith('/docs/apl/') && !path.startsWith('/docs/mpl/') && !path.startsWith('/docs/restapi/') },
  { label: 'Query reference', href: '/docs/apl/overview', match: (path: string) => path.startsWith('/docs/apl/') || path.startsWith('/docs/mpl/') },
  { label: 'API reference', href: '/docs/restapi/introduction', match: (path: string) => path.startsWith('/docs/restapi/') },
];

export function SiteHeader({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { setOpenSearch } = useSearchContext();
  const [mobileOpen, setMobileOpen] = useState(false);
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
      <button className="header-icon mobile-menu-trigger" aria-label="Open navigation" onClick={onMenu}><Menu size={16} /></button>
      <Link href="/docs" className="brand" aria-label="Axiom documentation home">
        <Image className="brand-logo brand-logo-dark" src="/doc-assets/logo/dark.svg" width={88} height={15} alt="" priority />
        <Image className="brand-logo brand-logo-light" src="/doc-assets/logo/light.svg" width={88} height={15} alt="" priority />
        <span className="brand-badge">Docs</span>
      </Link>
      <nav className={mobileOpen ? 'header-tabs mobile-open' : 'header-tabs'} aria-label="Documentation sections">
        {tabs.map((tab) => <Link key={tab.href} href={tab.href} className={tab.match(pathname) ? 'active' : ''} onClick={() => setMobileOpen(false)}>{tab.label}</Link>)}
      </nav>
      <div className="header-actions">
        <button className="header-search" aria-label="Search documentation and ask AI" onClick={() => setOpenSearch(true)}>
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
        <button className="header-icon mobile-tabs-trigger" aria-label="Toggle sections" onClick={() => setMobileOpen((value) => !value)}>
          {mobileOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>
    </header>
  );
}
