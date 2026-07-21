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

export default defineConfig();
