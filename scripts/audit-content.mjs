import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

const docsRoot = path.join(root, 'content/docs');
const docs = walk(docsRoot).filter((file) => file.endsWith('.mdx'));
const snippets = walk(path.join(root, 'content/snippets')).filter((file) => file.endsWith('.mdx'));
const assets = walk(path.join(root, 'public/doc-assets'));
const config = JSON.parse(readFileSync(path.join(root, 'docs.json'), 'utf8'));

function routeFor(file) {
  const relative = path.relative(docsRoot, file).replace(/^\([^/]+\)\//, '').replace(/\.mdx$/, '');
  return `/${relative.replace(/\/index$/, '')}`;
}

const routes = new Set(['/', ...docs.map(routeFor)]);
const redirectSources = new Set(config.redirects.map((item) => item.source.replace(/\/\*$/, '')));
const unresolved = [];
const missingAssets = [];
const linkPattern = /(?:\]\(|href=|src=)["']?(\/[A-Za-z0-9_./{}?=#%+*:-]+)/g;

for (const file of [...docs, ...snippets]) {
  const content = readFileSync(file, 'utf8');
  for (const match of content.matchAll(linkPattern)) {
    const original = match[1];
    if (original.includes('{') || original.startsWith('//')) continue;
    const pathname = original.split(/[?#]/)[0].replace(/^\/docs(?=\/|$)/, '') || '/';
    if (pathname.startsWith('/doc-assets/')) {
      if (!existsSync(path.join(root, 'public', pathname))) missingAssets.push({ file: path.relative(root, file), target: original });
      continue;
    }
    if (pathname === '/llms.txt' || pathname === '/llms-full.txt' || pathname === '/llms-apl.md') continue;
    const normalized = pathname.replace(/\.md$/, '').replace(/\/$/, '') || '/';
    if (!routes.has(normalized) && !redirectSources.has(normalized)) unresolved.push({ file: path.relative(root, file), target: original });
  }
}

const runtimeFiles = [path.join(root, 'app'), path.join(root, 'components'), path.join(root, 'scripts')].filter(existsSync).flatMap(walk).concat([path.join(root, 'docs.json'), path.join(root, 'package.json')]);
const staleText = runtimeFiles
  .filter((file) => !file.endsWith('audit-content.mjs'))
  .filter((file) => /fathom|do11y/i.test(readFileSync(file, 'utf8')))
  .map((file) => path.relative(root, file));

const results = {
  routablePages: docs.length,
  snippets: snippets.length,
  mdxTotal: docs.length + snippets.length,
  assets: assets.length,
  redirects: config.redirects.length,
  openapiPages: docs.filter((file) => /^openapi:/m.test(readFileSync(file, 'utf8'))).length,
  unresolvedLinks: unresolved,
  missingAssets,
  retiredAnalyticsReferences: staleText,
};

console.log(JSON.stringify(results, null, 2));

// Invariants: these are defects at any corpus size, so zero is the only passing value.
const defects = [
  ['unresolved links', unresolved],
  ['missing assets', missingAssets],
  ['retired analytics references', staleText],
].filter(([, found]) => found.length > 0);

// Floors: the corpus is expected to grow. Adding pages must pass; losing them must not.
// Raise a floor deliberately when content is intentionally retired — never to silence a red build.
const floors = { routablePages: 629, snippets: 21, mdxTotal: 650, assets: 129, redirects: 115, openapiPages: 89 };
const shrunk = Object.entries(floors).filter(([key, min]) => results[key] < min);

for (const [label, found] of defects) console.error(`✗ ${found.length} ${label}`);
for (const [key, min] of shrunk) console.error(`✗ ${key} fell to ${results[key]}, floor is ${min}`);

if (defects.length > 0 || shrunk.length > 0) process.exitCode = 1;
