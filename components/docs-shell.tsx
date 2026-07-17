'use client';

import Link from 'next/link';
import { ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import type { NavigationGroup, NavigationItem } from '@/lib/navigation';
import { SiteHeader } from './site-header';

function containsActive(item: NavigationItem, activeHref: string): boolean {
  if (item.href === activeHref) return true;
  return item.children?.some((child) => containsActive(child, activeHref)) ?? false;
}

function NavItem({ item, activeHref, depth = 0 }: { item: NavigationItem; activeHref: string; depth?: number }) {
  if (item.children) {
    const open = containsActive(item, activeHref);
    return (
      <details className="nav-nested" open={open}>
        <summary style={{ paddingLeft: 10 + depth * 10 }}><span>{item.title}</span><ChevronRight size={12} /></summary>
        <div>{item.children.map((child) => <NavItem key={child.href ?? child.title} item={child} activeHref={activeHref} depth={depth + 1} />)}</div>
      </details>
    );
  }

  return (
    <Link href={item.href!} className={item.href === activeHref ? 'sidebar-link active' : 'sidebar-link'} style={{ paddingLeft: 10 + depth * 10 }}>
      <span className="sidebar-link-label">{item.title}</span>
      {item.method && <span className={`method method-${item.method.toLowerCase()}`}>{item.method}</span>}
    </Link>
  );
}

export function DocsShell({ navigation, activeHref, children, landing = false }: { navigation: NavigationGroup[]; activeHref: string; children: React.ReactNode; landing?: boolean }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <div className="docs-app">
      <SiteHeader onMenu={() => setDrawerOpen(true)} />
      <div className="docs-grid">
        <aside className={drawerOpen ? 'sidebar open' : 'sidebar'}>
          <button className="sidebar-close" onClick={() => setDrawerOpen(false)} aria-label="Close navigation"><X size={16} /></button>
          <nav aria-label="Page navigation">
            {navigation.map((group) => (
              <section className="sidebar-group" key={group.title}>
                <h2>{group.title}</h2>
                {group.items.map((item) => <NavItem key={item.href ?? item.title} item={item} activeHref={activeHref} />)}
              </section>
            ))}
          </nav>
        </aside>
        {drawerOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} />}
        <main className={landing ? 'docs-main landing-main' : 'docs-main'}>{children}</main>
      </div>
    </div>
  );
}
