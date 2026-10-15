import { docs } from 'collections/server';
import { loader, type InferPageType } from 'fumadocs-core/source';
import { apiOperationMarkdown } from '@/lib/openapi';

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
});

/** A page as Markdown for the `.md`, `llms-full.txt` and assistant surfaces, including spec-rendered API content. */
export async function getPageMarkdown(page: InferPageType<typeof source>): Promise<string> {
  const markdown = await page.data.getText('processed');
  return page.data.openapi ? apiOperationMarkdown(page.data.openapi, markdown) : markdown;
}
