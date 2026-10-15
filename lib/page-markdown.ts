import { apiOperationMarkdown } from '@/lib/openapi-markdown';
import type { source } from '@/lib/source';

type Page = ReturnType<typeof source.getPages>[number];

/** Page body as Markdown, including the generated reference of API operation pages. */
export async function pageMarkdown(page: Page): Promise<string> {
  const prose = await page.data.getText('processed');
  return (page.data.openapi && apiOperationMarkdown(page.data.openapi, prose)) || prose;
}
