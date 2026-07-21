import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const output = '.next/standalone';
const copies = [
  ['public', join(output, 'public')],
  ['.next/static', join(output, '.next/static')],
];

for (const [source, destination] of copies) {
  if (!existsSync(source)) continue;
  rmSync(destination, { recursive: true, force: true });
  mkdirSync(destination, { recursive: true });
  cpSync(source, destination, { recursive: true });
}

console.log('Prepared .next/standalone with public and static assets.');
