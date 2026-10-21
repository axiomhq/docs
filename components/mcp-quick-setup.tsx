import { highlight } from 'fumadocs-core/highlight';
import { axiomCodeDark, axiomCodeLight } from '@/lib/code-theme';
import { mcpClients, mcpConfigCode, type McpClient, type McpClientId, type McpSetupAction } from '@/lib/mcp-clients';
import { cn } from '@/lib/utils';
import { McpClientPicker, McpCodeBlock, type McpSnippets } from './mcp-client-picker';

function codeBlock(code: string, lang: 'bash' | 'json', client: McpClientId, action: McpSetupAction) {
  return highlight(code, {
    lang,
    themes: { light: axiomCodeLight, dark: axiomCodeDark },
    defaultColor: false,
    components: {
      pre: (props) => (
        <McpCodeBlock {...props} className={cn(props.className, `language-${lang}`)} client={client} action={action} />
      ),
    },
  });
}

async function snippets(client: McpClient): Promise<[McpClientId, McpSnippets]> {
  return [
    client.id,
    {
      command: client.command
        ? await codeBlock(client.command, 'bash', client.id, client.id === 'other' ? 'copy_add_mcp' : 'copy_command')
        : undefined,
      config: client.config ? await codeBlock(mcpConfigCode(client), 'json', client.id, 'copy_config') : undefined,
    },
  ];
}

export async function McpQuickSetup() {
  const entries = await Promise.all(mcpClients.map(snippets));
  return <McpClientPicker snippets={Object.fromEntries(entries)} />;
}
