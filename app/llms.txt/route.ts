import { llms } from 'fumadocs-core/source';
import { source } from '@/lib/source';

export const dynamic = 'force-static';

export function GET() {
  const index = llms(source).index();
  return new Response(`${index}\n\n## Complete corpus\n\n- [All documentation in one file](/llms-full.txt)\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
