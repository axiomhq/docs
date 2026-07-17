import { source } from '@/lib/source';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page || page.data.noindex) return new Response('Not found', { status: 404 });
  const markdown = await page.data.getText('processed');
  return new Response(`# ${page.data.title}\n\n${markdown}`, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
