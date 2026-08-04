import { rehypeCodeDefaultOptions, remarkMdxMermaid } from 'fumadocs-core/mdx-plugins';
import { pageSchema } from 'fumadocs-core/source/schema';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { z } from 'zod';
import { axiomCodeDark, axiomCodeLight } from './lib/code-theme';

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema
      .extend({
        sidebarTitle: z.string().optional(),
        keywords: z.array(z.string()).optional(),
        // Mintlify link-out: the page is a redirect to this target rather than a document.
        url: z.string().optional(),
        openapi: z.string().optional(),
        noindex: z.boolean().optional(),
        mode: z.string().optional(),
      })
      .catchall(z.unknown()),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
});

export default defineConfig({
  mdxOptions: {
    // Imported snippet MDX compiles as standalone modules that never receive the
    // components prop page.tsx passes, so they need the provider to pick up the
    // shared pre/notice/link mappings from mdx-components.tsx.
    providerImportSource: '@/mdx-components',
    // ```mermaid fences become <Mermaid chart="…"/> (components/mermaid.tsx)
    // instead of Shiki code blocks.
    remarkPlugins: [remarkMdxMermaid],
    // Branded Shiki themes from www (grayscale + brand-orange accents) in
    // place of the stock github pair; defaults are spread so the notation
    // transformers and meta parsing stay intact.
    rehypeCodeOptions: {
      ...rehypeCodeDefaultOptions,
      themes: { light: axiomCodeLight, dark: axiomCodeDark },
    },
  },
});
