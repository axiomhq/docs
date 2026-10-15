import { getOpenApiDocument, openApiSpecIds } from '@/lib/openapi';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return openApiSpecIds.map((id) => ({ spec: `${id}.json` }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ spec: string }> }) {
  const { spec } = await params;
  const document = spec.endsWith('.json') ? getOpenApiDocument(spec.slice(0, -'.json'.length)) : undefined;
  if (!document) return new Response('Not found', { status: 404 });
  return Response.json(document);
}
