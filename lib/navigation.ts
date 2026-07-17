import legacyConfig from '@/docs.json';
import { source } from '@/lib/source';

export type NavigationItem = {
  title: string;
  href?: string;
  method?: string;
  children?: NavigationItem[];
};

export type NavigationGroup = { title: string; items: NavigationItem[] };

type LegacyNested = { group: string; pages: LegacyPage[] };
type LegacyPage = string | LegacyNested;

const apiFrontmatter = /^v\d+\s+(get|post|put|patch|delete)\s+/i;

function humanize(value: string) {
  return value
    .split('/').at(-1)!
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function pageItem(slug: string): NavigationItem {
  const page = source.getPage(slug.split('/'));
  const openapi = page?.data.openapi;
  const method = typeof openapi === 'string' ? openapi.match(apiFrontmatter)?.[1]?.toUpperCase() : undefined;
  return {
    title: page?.data.sidebarTitle ?? page?.data.title ?? humanize(slug),
    href: `/docs/${slug}`,
    method,
  };
}

function nestedItem(item: LegacyPage): NavigationItem {
  if (typeof item === 'string') return pageItem(item);
  return { title: item.group, children: item.pages.map(nestedItem) };
}

export function getNavigation(section: 'documentation' | 'query' | 'api' | 'changelog'): NavigationGroup[] {
  if (section === 'changelog') {
    return [{ title: 'Updates', items: [{ title: 'Changelog', href: '/docs/changelog' }] }];
  }

  const index = section === 'documentation' ? 0 : section === 'query' ? 1 : 2;
  const tab = legacyConfig.navigation.tabs[index];
  return tab.groups.map((group) => ({
    title: group.group,
    items: (group.pages as LegacyPage[]).map(nestedItem),
  }));
}

export function getSection(pathname: string): 'documentation' | 'query' | 'api' | 'changelog' {
  if (pathname === '/docs/changelog' || pathname.startsWith('/docs/changelog/')) return 'changelog';
  if (pathname.startsWith('/docs/apl/') || pathname.startsWith('/docs/mpl/')) return 'query';
  if (pathname.startsWith('/docs/restapi/')) return 'api';
  return 'documentation';
}
