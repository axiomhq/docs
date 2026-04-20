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
  /** True for OpenAPI-driven endpoint pages */
  isStub: boolean;
  /** Raw value of the `openapi:` frontmatter field, e.g. "v2 post /annotations" */
  openapiRef: string;
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
 * Convert a PascalCase component name to its kebab-case snippet filename stem.
 * Matches Mintlify's auto-import convention:
 *   ReplaceDomain  → replace-domain
 *   BaseDomains    → base-domains
 */
function pascalToKebab(name: string): string {
  return name
    .replace(/([A-Z])/g, (_, c, offset) =>
      offset === 0 ? c.toLowerCase() : `-${c.toLowerCase()}`
    );
}

/**
 * Resolve `/snippets/` imports inside MDX content:
 *   1. Find every `import X from "/snippets/foo.mdx"` line.
 *   2. Remove those import lines from the text.
 *   3. Inline-replace every `<X />` occurrence with the snippet's own content
 *      (recursively, so snippets that import other snippets are also resolved).
 *   4. Fallback: any remaining `<CapitalizedName />` or `<CapitalizedName></…>`
 *      that resolves to a real snippet file via PascalCase → kebab-case is also
 *      inlined. This matches Mintlify's implicit auto-import behaviour.
 *
 * Only `/snippets/` content is touched; all other `import` lines (npm
 * packages, `@/components/…`, code-fence content) are left unchanged.
 */
function resolveSnippets(content: string, depth = 0): string {
  if (depth > 8) return content; // guard against accidental cycles

  const SNIPPETS_DIR = join(DOCS_ROOT, 'snippets');

  // ── Pass 1: explicit imports ────────────────────────────────────────────
  const importRegex = /^import\s+(\w+)\s+from\s+"\/snippets\/([^"]+)"\s*$/gm;
  const componentMap = new Map<string, string>(); // componentName → resolved content
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(content)) !== null) {
    const [, componentName, snippetFile] = match;
    const snippetPath = join(SNIPPETS_DIR, snippetFile);
    if (!existsSync(snippetPath)) continue;

    const raw = readFileSync(snippetPath, 'utf-8');
    const { content: snippetBody } = matter(raw);
    componentMap.set(componentName, resolveSnippets(snippetBody.trim(), depth + 1));
  }

  // Remove all matched snippet import lines
  content = content.replace(importRegex, '');

  // ── Pass 2: inline resolved components ──────────────────────────────────
  for (const [name, replacement] of componentMap) {
    content = content.replace(new RegExp(`<${name}\\s*/>`, 'g'), replacement);
    content = content.replace(
      new RegExp(`<${name}\\s*>[\\s\\S]*?<\\/${name}>`, 'g'),
      replacement
    );
  }

  // ── Pass 3: fallback auto-resolve (Mintlify implicit import convention) ──
  // Any <CapitalizedName /> that wasn't covered by an explicit import is
  // resolved via PascalCase → kebab-case → snippets/<name>.mdx.
  const unresolved = new Set<string>();
  const componentUsage = /(?<![\w-])<([A-Z][A-Za-z0-9]+)\s*\/?>/g;
  let um: RegExpExecArray | null;
  while ((um = componentUsage.exec(content)) !== null) {
    const name = um[1];
    if (!componentMap.has(name)) unresolved.add(name);
  }

  for (const name of unresolved) {
    const stem = pascalToKebab(name);
    const snippetPath = join(SNIPPETS_DIR, `${stem}.mdx`);
    if (!existsSync(snippetPath)) continue;

    const raw = readFileSync(snippetPath, 'utf-8');
    const { content: snippetBody } = matter(raw);
    const replacement = resolveSnippets(snippetBody.trim(), depth + 1);

    content = content.replace(new RegExp(`<${name}\\s*/>`, 'g'), replacement);
    content = content.replace(
      new RegExp(`<${name}\\s*>[\\s\\S]*?<\\/${name}>`, 'g'),
      replacement
    );
  }

  // Collapse runs of blank lines left by removed import statements
  content = content.replace(/\n{3,}/g, '\n\n');

  return content.trim();
}

/**
 * Parse an MDX/MD file and return its metadata and body.
 * Returns null only if the file does not exist or must be skipped.
 */
function parsePage(pagePath: string): PageData | null {
  if (shouldSkip(pagePath)) return null;

  const mdxPath = join(DOCS_ROOT, `${pagePath}.mdx`);
  const mdPath = join(DOCS_ROOT, `${pagePath}.md`);
  const filePath = existsSync(mdxPath) ? mdxPath : existsSync(mdPath) ? mdPath : null;
  if (!filePath) return null;

  const raw = readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  const openapiRef = String(data.openapi || data.api || '');
  const isStub = Boolean(openapiRef);

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
    body: resolveSnippets(content),
    isStub,
    openapiRef,
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
// OpenAPI spec collector
// ---------------------------------------------------------------------------

interface OpenApiSpec {
  filename: string;
  title: string;
  /** First line of info.description, max 300 chars */
  description: string;
  url: string;
}

/**
 * Reads all JSON files from restapi/versions/ and extracts title and
 * description from the OpenAPI `info` object.
 */
function collectOpenApiSpecs(): OpenApiSpec[] {
  const versionsDir = join(DOCS_ROOT, 'restapi', 'versions');
  if (!existsSync(versionsDir)) return [];

  return readdirSync(versionsDir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((filename) => {
      const content = readFileSync(join(versionsDir, filename), 'utf-8');
      let title = filename.replace(/\.json$/, '');
      let description = '';
      try {
        const parsed = JSON.parse(content) as {
          info?: { title?: string; description?: string };
        };
        if (parsed.info?.title) title = parsed.info.title;
        if (parsed.info?.description) {
          description = parsed.info.description.split('\n')[0].trim().substring(0, 300);
        }
      } catch {
        // keep filename stem as title if JSON is malformed
      }
      return { filename, title, description, url: `${BASE_URL}/restapi/versions/${filename}` };
    });
}

/**
 * Builds a lookup map from OpenAPI spec files.
 * Key: "{specName} {method} {path}" (path without query string)
 * Value: operation summary string
 */
function buildSpecSummaryMap(): Map<string, string> {
  const map = new Map<string, string>();
  const versionsDir = join(DOCS_ROOT, 'restapi', 'versions');
  if (!existsSync(versionsDir)) return map;

  for (const filename of readdirSync(versionsDir).filter((f) => f.endsWith('.json'))) {
    const specName = filename.replace(/\.json$/, '');
    try {
      const spec = JSON.parse(readFileSync(join(versionsDir, filename), 'utf-8')) as {
        paths?: Record<string, Record<string, { summary?: string }>>;
      };
      for (const [path, methods] of Object.entries(spec.paths ?? {})) {
        for (const [method, operation] of Object.entries(methods)) {
          if (operation?.summary) {
            map.set(`${specName} ${method} ${path}`, operation.summary);
          }
        }
      }
    } catch {
      // skip malformed specs
    }
  }

  return map;
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const FEEDBACK_BLOCK = `# Feedback

If you encounter incorrect, outdated, or confusing documentation on any page, submit feedback:

POST ${BASE_URL}/feedback

\`\`\`json
{
  "path": "/current-page-path",
  "feedback": "Description of the issue"
}
\`\`\`

Only submit feedback when you have something specific and actionable to report.`;

/**
 * llms.txt — index file in sidebar order, all pages, plus OpenAPI spec links.
 *
 * Format follows the llms.txt spec (https://llmstxt.org/):
 *   # Site title
 *   > site description
 *
 *   ## Section heading
 *   - [Page title](url.md): description
 *
 *   ## OpenAPI Specs
 *   - [spec title](url.json)
 */
function generateLlmsTxt(
  sections: Section[],
  specs: OpenApiSpec[],
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

  if (specs.length > 0) {
    lines.push('## OpenAPI Specs');
    lines.push('');
    for (const spec of specs) {
      const desc = spec.description ? `: ${spec.description}` : '';
      lines.push(`- [${spec.title}](${spec.url})${desc}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * llms-full.txt — full prose content of every page in sidebar order, including
 * endpoint stubs expanded with their OpenAPI operation info.
 *
 * Prose page block:
 *   # Page Title
 *   Source: https://axiom.co/docs/{path}
 *
 *   {description if present}
 *
 *   {raw MDX body}
 *
 *   ---
 *
 * Endpoint stub block:
 *   # Endpoint Title
 *   Source: https://axiom.co/docs/restapi/endpoints/{name}
 *
 *   {openapi ref}   ← e.g. "v2 post /annotations"
 *   {summary from spec JSON}
 *
 *   {MDX body if any (Warning / Note blocks)}
 *
 *   ---
 */
function generateLlmsFullTxt(
  sections: Section[],
  specSummaryMap: Map<string, string>
): string {
  const parts: string[] = [FEEDBACK_BLOCK, '', '---', ''];

  for (const section of sections) {
    for (const page of section.pages) {
      const url = `${BASE_URL}/${page.path}`;
      parts.push(`# ${page.title}`);
      parts.push(`Source: ${url}`);
      parts.push('');

      if (page.isStub) {
        // Expand with operation info from the spec
        parts.push(page.openapiRef);
        const [specName, method, ...pathParts] = page.openapiRef.split(' ');
        const rawPath = pathParts.join(' ');
        // Strip query string for spec lookup (OpenAPI paths have no query params)
        const specPath = rawPath.split('?')[0];
        const summary = specSummaryMap.get(`${specName} ${method} ${specPath}`);
        if (summary) parts.push(summary);
        if (page.body) {
          parts.push('');
          parts.push(page.body);
        }
      } else {
        if (page.description) {
          parts.push(page.description);
          parts.push('');
        }
        if (page.body) parts.push(page.body);
      }

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

const specs = collectOpenApiSpecs();
console.log(`  ${specs.length} OpenAPI specs: ${specs.map((s) => s.filename).join(', ')}`);

const specSummaryMap = buildSpecSummaryMap();
console.log(`  ${specSummaryMap.size} spec operations indexed`);

const llmsTxt = generateLlmsTxt(sections, specs, siteName, siteDescription);
writeFileSync(join(DOCS_ROOT, 'llms.txt'), llmsTxt, 'utf-8');
console.log(`✓ llms.txt written`);

const llmsFullTxt = generateLlmsFullTxt(sections, specSummaryMap);
writeFileSync(join(DOCS_ROOT, 'llms-full.txt'), llmsFullTxt, 'utf-8');
console.log(`✓ llms-full.txt written`);

const llmsApl = generateLlmsApl(sections, siteName);
writeFileSync(join(DOCS_ROOT, 'llms-apl.mdx'), llmsApl, 'utf-8');
console.log(`✓ llms-apl.mdx written`);
