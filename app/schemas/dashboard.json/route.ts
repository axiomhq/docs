import { dashboardJsonSchema } from '@/lib/published-schemas';

export const dynamic = 'force-static';

export function GET() {
  return Response.json(dashboardJsonSchema(), {
    headers: { 'Content-Type': 'application/schema+json' },
  });
}
