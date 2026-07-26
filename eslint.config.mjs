import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    '.next/**',
    '.source/**',
    'node_modules/**',
    'out/**',
    // Vendored shadcn/ui + AI Elements registry components. Owned upstream and
    // re-pulled by the CLI, so they are not held to this project's lint rules.
    'components/ui/**',
    'components/ai-elements/**',
  ]),
]);
