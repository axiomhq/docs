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

const expected = results.routablePages === 625 && results.snippets === 21 && results.mdxTotal === 646 && results.assets === 127 && results.redirects === 115 && results.openapiPages === 89;
if (!expected || unresolved.length > 0 || missingAssets.length > 0 || staleText.length > 0) process.exitCode = 1;
