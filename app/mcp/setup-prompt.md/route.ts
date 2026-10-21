import { mcpSetupPrompt } from '@/lib/mcp-clients';

export const dynamic = 'force-static';

export function GET() {
  return new Response(mcpSetupPrompt(), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
