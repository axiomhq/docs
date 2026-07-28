import { pageSchema } from 'fumadocs-core/source/schema';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { z } from 'zod';

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
  },
});
