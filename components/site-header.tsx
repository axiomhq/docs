'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Menu, Moon, Search, Sparkles, Sun, X } from 'lucide-react';
import { useSearchContext } from 'fumadocs-ui/contexts/search';
import { useState } from 'react';
import { AxiomMark } from './axiom-logo';

const tabs = [
  { label: 'Documentation', href: '/docs', match: (path: string) => !path.startsWith('/docs/apl/') && !path.startsWith('/docs/mpl/') && !path.startsWith('/docs/restapi/') && !path.startsWith('/docs/changelog') },
  { label: 'Query reference', href: '/docs/apl/overview', match: (path: string) => path.startsWith('/docs/apl/') || path.startsWith('/docs/mpl/') },
  { label: 'API reference', href: '/docs/restapi/introduction', match: (path: string) => path.startsWith('/docs/restapi/') },
  { label: 'Changelog', href: '/docs/changelog', match: (path: string) => path.startsWith('/docs/changelog') },
];

export function SiteHeader({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { setOpenSearch } = useSearchContext();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="site-header">
      <button className="header-icon mobile-menu-trigger" aria-label="Open navigation" onClick={onMenu}><Menu size={16} /></button>
      <Link href="/docs" className="brand" aria-label="Axiom documentation home">
        <AxiomMark width={16} height={14} />
        <span className="brand-word">axiom</span>
        <span className="brand-badge">Docs</span>
      </Link>
      <nav className={mobileOpen ? 'header-tabs mobile-open' : 'header-tabs'} aria-label="Documentation sections">
        {tabs.map((tab) => <Link key={tab.href} href={tab.href} className={tab.match(pathname) ? 'active' : ''} onClick={() => setMobileOpen(false)}>{tab.label}</Link>)}
      </nav>
      <div className="header-actions">
        <button className="header-search" aria-label="Search documentation" onClick={() => setOpenSearch(true)}>
          <Search size={14} /><span>Search docs…</span><kbd>⌘K</kbd>
        </button>
        <button className="header-button ask-ai" onClick={() => setOpenSearch(true)}><Sparkles size={13} />Ask AI</button>
        <button className="header-icon" aria-label="Toggle color theme" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
          <Sun className="theme-icon-dark" size={14} />
          <Moon className="theme-icon-light" size={14} />
        </button>
        <a className="console-button" href="https://app.axiom.co" target="_blank" rel="noreferrer">Open Console <span>→</span></a>
        <button className="header-icon mobile-tabs-trigger" aria-label="Toggle sections" onClick={() => setMobileOpen((value) => !value)}>
          {mobileOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>
    </header>
  );
}
