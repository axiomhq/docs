import { getNavigation, type NavigationItem } from '@/lib/navigation';
import { source } from '@/lib/source';

export const dynamic = 'force-static';

// Links must be absolute: llms.txt consumers fetch this file once and resolve
// nothing, and the .md suffix hands them clean Markdown instead of the HTML shell.
const ORIGIN = 'https://axiom.co';

const SECTIONS = [
  { title: 'Documentation', section: 'documentation' },
  { title: 'Query reference', section: 'query' },
  { title: 'API reference', section: 'api' },
  { title: 'Changelog', section: 'changelog' },
] as const;

function flattenHrefs(items: NavigationItem[]): string[] {
  return items.flatMap((item) => (item.href ? [item.href] : flattenHrefs(item.children ?? [])));
}

function entryLine(page: { url: string; data: { title: string; description?: string } }) {
  return `- [${page.data.title}](${ORIGIN}${page.url}.md)${page.data.description ? `: ${page.data.description}` : ''}`;
}

export function GET() {
  // Link-out stubs (`url` frontmatter) redirect rather than render, and noindex
  // pages are excluded from every AI-readable surface.
  const pages = new Map(
    source.getPages().filter((page) => !page.data.noindex && !page.data.url).map((page) => [page.url, page]),
  );
  const seen = new Set<string>();

  const lines = [
    '# Axiom documentation',
    '',
    '> Axiom is a data platform for ingesting, storing, and querying logs, traces, and other event data. This documentation covers the Axiom Console, sending data, the Axiom Processing Language (APL), and the REST API.',
    '',
    `Every page below is served as plain Markdown at the linked \`.md\` URL. The entire corpus in one file: [llms-full.txt](${ORIGIN}/docs/llms-full.txt). A standalone APL language reference: [llms-apl.md](${ORIGIN}/docs/llms-apl.md).`,
  ];

  for (const { title, section } of SECTIONS) {
    const entries = getNavigation(section)
      .flatMap((group) => flattenHrefs(group.items))
      .filter((href) => pages.has(href) && !seen.has(href))
      .map((href) => {
        seen.add(href);
        return entryLine(pages.get(href)!);
      });
    if (entries.length > 0) lines.push('', `## ${title}`, '', ...entries);
  }

  // Routable pages missing from the docs.json navigation still belong in the index.
  const unlisted = [...pages.values()].filter((page) => !seen.has(page.url)).map(entryLine);
  if (unlisted.length > 0) lines.push('', '## Other pages', '', ...unlisted);

  return new Response(`${lines.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
