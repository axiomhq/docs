import { source } from '@/lib/source';

export const dynamic = 'force-static';

export async function GET() {
  const pages = source.getPages().filter((page) => !page.data.noindex);
  const content = await Promise.all(pages.map(async (page) => `\n\n---\n\n# ${page.data.title}\n\nSource: ${page.url}\n\n${await page.data.getText('processed')}`));
  return new Response(`# Axiom documentation\n${content.join('')}`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
