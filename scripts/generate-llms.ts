import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import matter from 'gray-matter';

const DOCS_ROOT = resolve(process.cwd());
const BASE_URL = 'https://axiom.co/docs';

// Files/directories entirely excluded from all outputs.
const SKIP_PREFIXES = [
  'snippets/',    // internal reusable partials
  'llms/',        // overview pages that describe these very files
  'node_modules/',
  '.github/',     // repo meta files (CONTRIBUTING.md, etc.)
];

// Root-level files to skip by exact path (no extension)
const SKIP_EXACT = new Set(['llms-apl', 'llms-full', 'llms', 'README']);

interface PageData {
  path: string;
  title: string;
  description: string;
  body: string;
  /** True for auto-generated OpenAPI stub pages that have no prose body */
  isStub: boolean;
}

interface Section {
  heading: string;
  pages: PageData[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shouldSkip(path: string): boolean {
  if (SKIP_EXACT.has(path)) return true;
  return SKIP_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/**
 * Parse an MDX/MD file and return its metadata and body.
 * Returns null only if the file does not exist or must be skipped.
 * OpenAPI stub pages are returned with an empty body and `isStub: true`.
 */
function parsePage(pagePath: string): PageData | null {
  if (shouldSkip(pagePath)) return null;

  const mdxPath = join(DOCS_ROOT, `${pagePath}.mdx`);
  const mdPath = join(DOCS_ROOT, `${pagePath}.md`);
  const filePath = existsSync(mdxPath) ? mdxPath : existsSync(mdPath) ? mdPath : null;
  if (!filePath) return null;

  const raw = readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  const isStub = Boolean(data.openapi || data.api);

  const title = String(
    data.title || data.sidebarTitle || pagePath.split('/').pop() || pagePath
  );

  // Trim description to first line, max 300 chars (matches Mintlify behaviour)
  const description = String(data.description ?? '')
    .split('\n')[0]
    .trim()
    .substring(0, 300);

  return {
    path: pagePath,
    title,
    description,
    body: isStub ? '' : content.trim(),
    isStub,
  };
}

/**
 * Recursively walk a Mintlify navigation entry, which is either a plain page
 * path string or a nested group object (`{ group, pages }`).
 */
function collectNavPaths(pages: (string | Record<string, unknown>)[]): string[] {
  const result: string[] = [];
  for (const entry of pages) {
    if (typeof entry === 'string') {
      result.push(entry);
    } else if (Array.isArray((entry as Record<string, unknown>).pages)) {
      result.push(
        ...collectNavPaths(
          (entry as Record<string, unknown>).pages as (string | Record<string, unknown>)[]
        )
      );
    }
  }
  return result;
}

/**
 * Recursively find all .mdx and .md files under a directory,
 * returning paths relative to DOCS_ROOT without extension.
 */
function globMdxFiles(dir: string = DOCS_ROOT): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...globMdxFiles(full));
    } else if (entry.endsWith('.mdx') || entry.endsWith('.md')) {
      const rel = relative(DOCS_ROOT, full).replace(/\.(mdx|md)$/, '');
      results.push(rel);
    }
  }
  return results;
}

/**
 * Convert a directory path segment into a human-readable section heading.
 * e.g. "send-data" → "Send data", "ai-engineering" → "AI engineering"
 */
function dirToHeading(dir: string): string {
  return dir
    .replace(/-/g, ' ')
    .replace(/^(.)/, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Build the section list
// ---------------------------------------------------------------------------

// The primary tab whose groups are used verbatim as section headings.
// All other tabs get the tab name prepended: "{tab}: {group}".
const PRIMARY_TAB = 'Documentation';

function buildSections(): Section[] {
  const docsJson = JSON.parse(readFileSync(join(DOCS_ROOT, 'docs.json'), 'utf-8'));
  const tabs: {
    tab: string;
    groups: { group: string; pages: (string | Record<string, unknown>)[] }[];
  }[] = docsJson.navigation?.tabs ?? [];

  const sections: Section[] = [];

  // --- Pass 1: build sections from docs.json navigation (defines order) ---
  const navPathSet = new Set<string>();
  // Map top-level directory → index of the first section that contains it.
  const dirToSectionIdx = new Map<string, number>();

  for (const tab of tabs) {
    for (const group of tab.groups ?? []) {
      const paths = collectNavPaths(group.pages ?? []);
      const pages: PageData[] = [];

      for (const path of paths) {
        const page = parsePage(path);
        if (page) {
          pages.push(page);
          navPathSet.add(path);
          const topDir = path.split('/')[0];
          if (!dirToSectionIdx.has(topDir)) {
            dirToSectionIdx.set(topDir, sections.length);
          }
        }
      }

      if (pages.length > 0) {
        const heading =
          tab.tab === PRIMARY_TAB ? group.group : `${tab.tab}: ${group.group}`;
        sections.push({ heading, pages });
      }
    }
  }

  // --- Pass 2: scan all .mdx files on disk and add anything not in nav ---
  // We create a "bucket" per top-level directory for unlisted pages.
  const unlistedByDir = new Map<string, PageData[]>();

  for (const diskPath of globMdxFiles()) {
    if (navPathSet.has(diskPath)) continue;
    if (shouldSkip(diskPath)) continue;

    const page = parsePage(diskPath);
    if (!page) continue;

    const topDir = diskPath.split('/')[0];

    if (dirToSectionIdx.has(topDir)) {
      // Append to the existing nav section that already owns this directory.
      sections[dirToSectionIdx.get(topDir)!].pages.push(page);
    } else {
      // Collect into a new section keyed by top-level directory.
      if (!unlistedByDir.has(topDir)) unlistedByDir.set(topDir, []);
      unlistedByDir.get(topDir)!.push(page);
    }
  }

  // Sort unlisted pages alphabetically within each new section, then append.
  for (const [dir, pages] of [...unlistedByDir.entries()].sort()) {
    pages.sort((a, b) => a.path.localeCompare(b.path));
    sections.push({ heading: dirToHeading(dir), pages });
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/**
 * llms.txt — index file in sidebar order, all pages.
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
 * Stub pages (OpenAPI-generated) are skipped since they carry no prose.
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
      if (page.isStub || !page.body) continue;

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
    for (const page of section.pages) {
      if (!page.path.startsWith('apl/')) continue;
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

console.log('Building navigation index from docs.json + disk scan…');
const sections = buildSections();
const totalPages = sections.reduce((n, s) => n + s.pages.length, 0);
const stubCount = sections.reduce(
  (n, s) => n + s.pages.filter((p) => p.isStub).length,
  0
);
console.log(
  `  ${sections.length} sections, ${totalPages} pages (${stubCount} API stubs, ${totalPages - stubCount} prose)`
);

const llmsTxt = generateLlmsTxt(sections, siteName, siteDescription);
writeFileSync(join(DOCS_ROOT, 'llms.txt'), llmsTxt, 'utf-8');
console.log(`✓ llms.txt written`);

const llmsFullTxt = generateLlmsFullTxt(sections);
writeFileSync(join(DOCS_ROOT, 'llms-full.txt'), llmsFullTxt, 'utf-8');
console.log(`✓ llms-full.txt written`);

const llmsApl = generateLlmsApl(sections, siteName);
writeFileSync(join(DOCS_ROOT, 'llms-apl.mdx'), llmsApl, 'utf-8');
console.log(`✓ llms-apl.mdx written`);
