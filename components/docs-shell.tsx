'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { NavigationGroup, NavigationItem } from '@/lib/navigation';
import { DocumentationSections, SiteHeader } from './site-header';

function containsActive(item: NavigationItem, activeHref: string): boolean {
  if (item.href === activeHref) return true;
  return item.children?.some((child) => containsActive(child, activeHref)) ?? false;
}

function isSyntaxReference(href?: string): boolean {
  return Boolean(href && /\/(?:scalar-functions|aggregation-functions|operators)\//.test(href));
}

function NavItem({ item, activeHref, onNavigate, depth = 0 }: { item: NavigationItem; activeHref: string; onNavigate: () => void; depth?: number }) {
  if (item.children) {
    const open = containsActive(item, activeHref);
    return (
      <details className="nav-nested" open={open}>
        <summary style={{ paddingLeft: 10 + depth * 10 }}><span>{item.title}</span><ChevronRight size={12} /></summary>
        <div>{item.children.map((child) => <NavItem key={child.href ?? child.title} item={child} activeHref={activeHref} onNavigate={onNavigate} depth={depth + 1} />)}</div>
      </details>
    );
  }

  return (
    <Link href={item.href!} prefetch={false} className={['sidebar-link', item.href === activeHref && 'active', isSyntaxReference(item.href) && 'syntax-reference-link'].filter(Boolean).join(' ')} style={{ paddingLeft: 10 + depth * 10 }} onClick={onNavigate}>
      <span className="sidebar-link-label">{item.title}</span>
      {item.method && <span className={`method method-${item.method.toLowerCase()}`}>{item.method}</span>}
    </Link>
  );
}

export function DocsShell({ navigation, activeHref, children, landing = false }: { navigation: NavigationGroup[]; activeHref: string; children: React.ReactNode; landing?: boolean }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1241px)');
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setDrawerOpen(false);
    };
    desktop.addEventListener('change', closeAtDesktop);
    return () => desktop.removeEventListener('change', closeAtDesktop);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerRef.current?.querySelector<HTMLAnchorElement>('a')?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setDrawerOpen(false);
      document.getElementById('docs-navigation-trigger')?.focus();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [drawerOpen]);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="docs-app">
      <SiteHeader drawerOpen={drawerOpen} onMenu={() => setDrawerOpen((open) => !open)} />
      <div className="docs-grid">
        <aside id="docs-navigation-drawer" ref={drawerRef} className={drawerOpen ? 'sidebar open' : 'sidebar'}>
          <DocumentationSections className="drawer-sections" onNavigate={closeDrawer} />
          <nav aria-label="Page navigation">
            {navigation.map((group) => (
              <section className="sidebar-group" key={group.title}>
                <h2>{group.title}</h2>
                {group.items.map((item) => <NavItem key={item.href ?? item.title} item={item} activeHref={activeHref} onNavigate={closeDrawer} />)}
              </section>
            ))}
          </nav>
        </aside>
        {drawerOpen && <button className="sidebar-backdrop" aria-hidden="true" tabIndex={-1} onClick={closeDrawer} />}
        <main className={landing ? 'docs-main landing-main' : 'docs-main'}>{children}</main>
      </div>
    </div>
  );
}
