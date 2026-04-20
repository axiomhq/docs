import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import matter from 'gray-matter';

const DOCS_ROOT = resolve(process.cwd());
const BASE_URL = 'https://axiom.co/docs';

// Page paths that start with any of these prefixes are excluded from all outputs.
// - snippets/   internal reusable partials, not standalone docs
// - llms/       the overview pages that describe these very files (avoid circularity)
// - restapi/endpoints/  individual OpenAPI-driven endpoint pages (dense schema content)
const SKIP_PREFIXES = ['snippets/', 'llms/', 'restapi/endpoints/'];

interface PageData {
  path: string;
  title: string;
  description: string;
  body: string;
}

interface Section {
  heading: string;
  pages: PageData[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shouldSkip(path: string): boolean {
  return SKIP_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/**
 * Read and parse an MDX/MD file, returning its frontmatter + body.
 * Returns null for files that don't exist, should be skipped, or are
 * OpenAPI-generated stub pages (they have an `openapi:` frontmatter field
 * and contain no useful prose).
 */
function readPage(pagePath: string): PageData | null {
  if (shouldSkip(pagePath)) return null;

  const mdxPath = join(DOCS_ROOT, `${pagePath}.mdx`);
  const mdPath = join(DOCS_ROOT, `${pagePath}.md`);
  const filePath = existsSync(mdxPath) ? mdxPath : existsSync(mdPath) ? mdPath : null;
  if (!filePath) return null;

  const raw = readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  // Skip thin OpenAPI stub pages – they don't contain prose content
  if (data.openapi || data.api) return null;

  const title =
    String(data.title || data.sidebarTitle || pagePath.split('/').pop() || pagePath);

  // Trim description to first line, max 300 chars (matches Mintlify behaviour)
  const description = String(data.description ?? '')
    .split('\n')[0]
    .trim()
    .substring(0, 300);

  return { path: pagePath, title, description, body: content.trim() };
}

/**
 * Recursively walk a Mintlify navigation entry, which is either a plain page
 * path string or a nested group object (`{ group, pages }`).
 */
function collectPaths(pages: (string | Record<string, unknown>)[]): string[] {
  const result: string[] = [];
  for (const entry of pages) {
    if (typeof entry === 'string') {
      result.push(entry);
    } else if (Array.isArray((entry as Record<string, unknown>).pages)) {
      result.push(
        ...collectPaths((entry as Record<string, unknown>).pages as (string | Record<string, unknown>)[])
      );
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Build the section list from docs.json navigation
// ---------------------------------------------------------------------------

// The primary tab whose groups are used verbatim as section headings.
// All other tabs get the tab name prepended: "{tab}: {group}".
const PRIMARY_TAB = 'Documentation';

function buildSections(): Section[] {
  const docsJson = JSON.parse(readFileSync(join(DOCS_ROOT, 'docs.json'), 'utf-8'));
  const tabs: { tab: string; groups: { group: string; pages: (string | Record<string, unknown>)[] }[] }[] =
    docsJson.navigation?.tabs ?? [];

  const sections: Section[] = [];

  for (const tab of tabs) {
    for (const group of tab.groups ?? []) {
      const paths = collectPaths(group.pages ?? []);
      const pages: PageData[] = [];

      for (const path of paths) {
        const page = readPage(path);
        if (page) pages.push(page);
      }

      if (pages.length > 0) {
        const heading =
          tab.tab === PRIMARY_TAB ? group.group : `${tab.tab}: ${group.group}`;
        sections.push({ heading, pages });
      }
    }
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/**
 * llms.txt — index file in sidebar order.
 *
 * Format follows the llms.txt spec (https://llmstxt.org/):
 *   # Site title
 *   > site description
 *
 *   ## Section heading
 *   - [Page title](url.md): description
 */
function generateLlmsTxt(
  sections: Section[],
  siteName: string,
  siteDescription: string
): string {
  const lines: string[] = [
    `# ${siteName}`,
    '',
    `> ${siteDescription}`,
    '',
  ];

  for (const section of sections) {
    lines.push(`## ${section.heading}`);
    lines.push('');
    for (const page of section.pages) {
      const url = `${BASE_URL}/${page.path}.md`;
      const desc = page.description ? `: ${page.description}` : '';
      lines.push(`- [${page.title}](${url})${desc}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * llms-full.txt — full prose content of every page, in sidebar order.
 *
 * Each page block:
 *   # Page Title
 *   Source: https://axiom.co/docs/{path}
 *
 *   {description if present}
 *
 *   {raw MDX body}
 *
 *   ---
 */
function generateLlmsFullTxt(sections: Section[]): string {
  const parts: string[] = [];

  for (const section of sections) {
    for (const page of section.pages) {
      const url = `${BASE_URL}/${page.path}`;
      parts.push(`# ${page.title}`);
      parts.push(`Source: ${url}`);
      parts.push('');
      if (page.description) {
        parts.push(page.description);
        parts.push('');
      }
      parts.push(page.body);
      parts.push('');
      parts.push('---');
      parts.push('');
    }
  }

  return parts.join('\n');
}

/**
 * llms-apl.mdx — APL-only index (overwrites the manually maintained root file).
 *
 * Keeps the established `# Axiom Docs \n\n## Query reference` structure so
 * the rendered output at /llms-apl.md stays compatible with existing tooling.
 */
function generateLlmsApl(sections: Section[], siteName: string): string {
  const lines: string[] = [
    `# ${siteName}`,
    '',
    '## Query reference',
    '',
  ];

  for (const section of sections) {
    const aplPages = section.pages.filter((p) => p.path.startsWith('apl/'));
    for (const page of aplPages) {
      const url = `${BASE_URL}/${page.path}.md`;
      const desc = page.description ? `: ${page.description}` : '';
      lines.push(`- [${page.title}](${url})${desc}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const docsJsonRaw = JSON.parse(readFileSync(join(DOCS_ROOT, 'docs.json'), 'utf-8'));
const siteName: string = docsJsonRaw.name ?? 'Docs';
const siteDescription: string = docsJsonRaw.description ?? '';

console.log('Building navigation index from docs.json…');
const sections = buildSections();
const totalPages = sections.reduce((n, s) => n + s.pages.length, 0);
console.log(`  ${sections.length} sections, ${totalPages} pages`);

const llmsTxt = generateLlmsTxt(sections, siteName, siteDescription);
writeFileSync(join(DOCS_ROOT, 'llms.txt'), llmsTxt, 'utf-8');
console.log(`✓ llms.txt written`);

const llmsFullTxt = generateLlmsFullTxt(sections);
writeFileSync(join(DOCS_ROOT, 'llms-full.txt'), llmsFullTxt, 'utf-8');
console.log(`✓ llms-full.txt written`);

const llmsApl = generateLlmsApl(sections, siteName);
writeFileSync(join(DOCS_ROOT, 'llms-apl.mdx'), llmsApl, 'utf-8');
console.log(`✓ llms-apl.mdx written`);
