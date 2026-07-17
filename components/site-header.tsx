'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Menu, Moon, Search, Sparkles, Sun, X } from 'lucide-react';
import { useSearchContext } from 'fumadocs-ui/contexts/search';
import { useState } from 'react';

const tabs = [
  { label: 'Documentation', href: '/docs', match: (path: string) => !path.startsWith('/docs/apl/') && !path.startsWith('/docs/mpl/') && !path.startsWith('/docs/restapi/') },
  { label: 'Query reference', href: '/docs/apl/overview', match: (path: string) => path.startsWith('/docs/apl/') || path.startsWith('/docs/mpl/') },
  { label: 'API reference', href: '/docs/restapi/introduction', match: (path: string) => path.startsWith('/docs/restapi/') },
];

export function SiteHeader({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { setOpenSearch } = useSearchContext();
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleTheme() {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    document.cookie = `axiom-docs-theme=${nextTheme}; Path=/; Max-Age=31536000; SameSite=Lax`;
    setTheme(nextTheme);
  }

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
        <button className="header-search" aria-label="Search documentation" onClick={() => setOpenSearch(true)}>
          <Search size={14} /><span>Search docs…</span><kbd>⌘K</kbd>
        </button>
        <button className="header-button ask-ai" onClick={() => setOpenSearch(true)}><Sparkles size={13} />Ask AI</button>
        <button className="header-icon" aria-label="Toggle color theme" onClick={toggleTheme}>
          <Sun className="theme-icon-dark" size={14} />
          <Moon className="theme-icon-light" size={14} />
        </button>
        <a className="console-button" href="https://app.axiom.co" target="_blank" rel="noreferrer">Open console <span>→</span></a>
        <button className="header-icon mobile-tabs-trigger" aria-label="Toggle sections" onClick={() => setMobileOpen((value) => !value)}>
          {mobileOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>
    </header>
  );
}
