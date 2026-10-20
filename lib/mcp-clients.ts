import type { StructuredData } from 'fumadocs-core/mdx-plugins';

export const MCP_SERVER_URL = 'https://mcp.axiom.co/mcp';
export const MCP_PAGE_PATH = '/docs/console/intelligence/mcp-server';
export const MCP_DOCS_URL = `https://axiom.co${MCP_PAGE_PATH}`;
export const MCP_SETUP_PROMPT_URL = 'https://axiom.co/docs/mcp/setup-prompt.md';

export type McpClientId =
  | 'claude-code'
  | 'codex'
  | 'gemini'
  | 'antigravity'
  | 'copilot-cli'
  | 'amp'
  | 'fx'
  | 'opencode'
  | 'cursor'
  | 'vs-code'
  | 'devin'
  | 'kiro'
  | 'zed'
  | 'warp'
  | 'claude'
  | 'chatgpt'
  | 'goose'
  | 'other';

export type McpClientGroup = 'terminal' | 'editor' | 'chat' | 'other';

export type McpSetupAction =
  | 'one_click'
  | 'copy_command'
  | 'copy_config'
  | 'copy_prompt'
  | 'copy_add_mcp'
  | 'open_client_docs';

export type McpClient = {
  id: McpClientId;
  label: string;
  group: McpClientGroup;
  aliases?: string[];
  install?: { label: string; href: string };
  steps?: string[];
  command?: string;
  config?: { intro: string; file?: string; value: object };
  signIn?: string;
  notes?: string[];
  docs: string;
  checked: string;
};

function query(params: Record<string, string>) {
  return Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
}

const remoteEntry = { url: MCP_SERVER_URL };

const mcpRemote = {
  mcpServers: {
    axiom: { command: 'npx', args: ['-y', 'mcp-remote', MCP_SERVER_URL] },
  },
};

export const mcpClients: McpClient[] = [
  {
    id: 'claude-code',
    label: 'Claude Code',
    group: 'terminal',
    command: `claude mcp add --transport http --scope user axiom ${MCP_SERVER_URL}`,
    signIn: 'In Claude Code, run `/mcp` and select **axiom** to sign in in your browser.',
    docs: 'https://code.claude.com/docs/en/mcp',
    checked: '2026-10-20',
  },
  {
    id: 'codex',
    label: 'Codex',
    group: 'terminal',
    command: `codex mcp add axiom --url ${MCP_SERVER_URL}\ncodex mcp login axiom`,
    signIn: 'Sign in to Axiom in the browser window that the login command opens.',
    docs: 'https://learn.chatgpt.com/docs/extend/mcp?surface=cli',
    checked: '2026-10-20',
  },
  {
    id: 'gemini',
    label: 'Gemini CLI',
    group: 'terminal',
    command: `gemini mcp add --transport http --scope user axiom ${MCP_SERVER_URL}`,
    signIn: 'Gemini CLI opens your browser to sign in the first time it connects. To sign in again, run `/mcp auth axiom`.',
    notes: [
      'Gemini CLI requires a paid Gemini API key or a Gemini Code Assist Standard or Enterprise license. On other plans, use Antigravity.',
    ],
    docs: 'https://geminicli.com/docs/tools/mcp-server/',
    checked: '2026-10-20',
  },
  {
    id: 'antigravity',
    label: 'Antigravity',
    group: 'terminal',
    config: {
      intro: 'Add the following to `~/.gemini/config/mcp_config.json`. Antigravity CLI and the Antigravity IDE both read this file.',
      file: '~/.gemini/config/mcp_config.json',
      value: { mcpServers: { axiom: { serverUrl: MCP_SERVER_URL } } },
    },
    signIn: 'Sign in to Axiom in your browser when Antigravity connects. In Antigravity CLI, run `/mcp` to check the connection.',
    docs: 'https://antigravity.google/docs/mcp',
    checked: '2026-10-20',
  },
  {
    id: 'copilot-cli',
    label: 'Copilot CLI',
    group: 'terminal',
    command: `copilot mcp add --transport http axiom ${MCP_SERVER_URL}`,
    signIn: 'In Copilot CLI, run `/mcp auth axiom` to sign in in your browser.',
    docs: 'https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers',
    checked: '2026-10-20',
  },
  {
    id: 'amp',
    label: 'Amp',
    group: 'terminal',
    command: `amp mcp add axiom ${MCP_SERVER_URL}`,
    signIn: 'Amp opens your browser to sign in the next time it starts.',
    docs: 'https://ampcode.com/docs/customize/mcp',
    checked: '2026-10-20',
  },
  {
    id: 'fx',
    label: 'fx',
    group: 'terminal',
    command: `fx mcp add --transport http axiom ${MCP_SERVER_URL}\nfx mcp auth axiom`,
    signIn: 'Sign in to Axiom in the browser window that the auth command opens.',
    docs: 'https://fx.sh/docs/capabilities/mcp',
    checked: '2026-10-20',
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    group: 'terminal',
    config: {
      intro: 'Add the following to `~/.config/opencode/opencode.json`:',
      file: '~/.config/opencode/opencode.json',
      value: {
        $schema: 'https://opencode.ai/config.json',
        mcp: { axiom: { type: 'remote', url: MCP_SERVER_URL, enabled: true } },
      },
    },
    signIn: 'Run `opencode mcp auth axiom` to sign in in your browser.',
    docs: 'https://opencode.ai/docs/mcp-servers/',
    checked: '2026-10-20',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    group: 'editor',
    install: {
      label: 'Add to Cursor',
      href: `cursor://anysphere.cursor-deeplink/mcp/install?${query({ name: 'axiom', config: btoa(JSON.stringify(remoteEntry)) })}`,
    },
    config: {
      intro: 'Add the following to `~/.cursor/mcp.json` for all projects, or to `.cursor/mcp.json` for one project:',
      file: '~/.cursor/mcp.json',
      value: { mcpServers: { axiom: remoteEntry } },
    },
    signIn: 'Sign in to Axiom when Cursor prompts you.',
    notes: [
      'To add Axiom MCP Server for your Cursor team, go to **Dashboard > Integrations & MCP** in Cursor, and then add the URL `https://mcp.axiom.co/mcp`. To make it available to Cursor cloud agents, also make it available by default on **Dashboard > Plugins**.',
    ],
    docs: 'https://cursor.com/docs/mcp',
    checked: '2026-10-20',
  },
  {
    id: 'vs-code',
    label: 'VS Code',
    group: 'editor',
    install: {
      label: 'Add to VS Code',
      href: `vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name: 'axiom', type: 'http', url: MCP_SERVER_URL }))}`,
    },
    command: `code --add-mcp '${JSON.stringify({ name: 'axiom', type: 'http', url: MCP_SERVER_URL })}'`,
    signIn: 'VS Code opens your browser to sign in the first time it starts the server.',
    docs: 'https://code.visualstudio.com/docs/agent-customization/mcp-servers',
    checked: '2026-10-20',
  },
  {
    id: 'devin',
    label: 'Devin Desktop',
    group: 'editor',
    aliases: ['windsurf'],
    command: `devin mcp add -s user axiom ${MCP_SERVER_URL}`,
    signIn: 'Devin prompts you to sign in the first time it uses Axiom. To sign in sooner, run `devin mcp login axiom`.',
    notes: ['Devin Desktop was formerly Windsurf.'],
    docs: 'https://docs.devin.ai/cli/extensibility/mcp/configuration',
    checked: '2026-10-20',
  },
  {
    id: 'kiro',
    label: 'Kiro',
    group: 'editor',
    install: {
      label: 'Add to Kiro',
      href: `https://kiro.dev/launch/mcp/add?${query({ name: 'axiom', config: JSON.stringify(remoteEntry) })}`,
    },
    config: {
      intro: 'Add the following to `~/.kiro/settings/mcp.json`:',
      file: '~/.kiro/settings/mcp.json',
      value: { mcpServers: { axiom: remoteEntry } },
    },
    signIn: 'Kiro opens your browser to sign in when it connects.',
    docs: 'https://kiro.dev/docs/mcp/',
    checked: '2026-10-20',
  },
  {
    id: 'zed',
    label: 'Zed',
    group: 'editor',
    config: {
      intro: 'Run **zed: open settings file**, and then add the following:',
      value: { context_servers: { axiom: remoteEntry } },
    },
    signIn: 'Zed prompts you to sign in when it connects.',
    docs: 'https://zed.dev/docs/ai/mcp',
    checked: '2026-10-20',
  },
  {
    id: 'warp',
    label: 'Warp',
    group: 'editor',
    config: {
      intro: 'Go to **Settings > Agents > MCP servers**, click **+ Add**, and then paste the following:',
      value: { Axiom: remoteEntry },
    },
    signIn: 'Warp opens your browser to sign in when the server starts.',
    docs: 'https://docs.warp.dev/agents/capabilities/mcp/',
    checked: '2026-10-20',
  },
  {
    id: 'claude',
    label: 'Claude',
    group: 'chat',
    install: {
      label: 'Add to Claude',
      href: `https://claude.ai/customize/connectors?${query({ modal: 'add-custom-connector', connectorName: 'Axiom', connectorUrl: MCP_SERVER_URL })}`,
    },
    steps: [
      'Review the prefilled name and URL, and then confirm.',
      'Click **Connect** and sign in to Axiom in your browser.',
    ],
    notes: [
      'Free plans can add one custom connector. On Team and Enterprise plans, an owner may need to add the connector first in **Organization settings > Connectors**.',
    ],
    config: {
      intro: 'Using Claude Desktop without custom connectors? Go to **Settings > Developers**, click **Edit Config**, add the following to `claude_desktop_config.json`, and then restart Claude Desktop:',
      value: mcpRemote,
    },
    docs: 'https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp',
    checked: '2026-10-20',
  },
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    group: 'chat',
    steps: [
      'In ChatGPT, go to **Plugins**, click **+**, and then click **Add custom MCP server**.',
      'Enter the name `Axiom` and a short description.',
      'Under **Connection**, enter the MCP server URL `https://mcp.axiom.co/mcp`.',
      'Set up OAuth authentication, review the warning, and then click **I understand and want to continue**.',
      'Click **Create as a plugin**, and then sign in to Axiom in your browser.',
    ],
    docs: 'https://developers.openai.com/apps-sdk/deploy/connect-chatgpt',
    checked: '2026-10-20',
  },
  {
    id: 'goose',
    label: 'Goose',
    group: 'chat',
    install: {
      label: 'Add to Goose',
      href: `goose://extension?${query({ url: MCP_SERVER_URL, type: 'streamable_http', id: 'axiom', name: 'Axiom', description: 'Query and analyze Axiom data with APL from your AI agent' })}`,
    },
    signIn: 'Sign in to Axiom when Goose prompts you.',
    docs: 'https://goose-docs.ai/docs/getting-started/using-extensions/',
    checked: '2026-10-20',
  },
  {
    id: 'other',
    label: 'Other',
    group: 'other',
    command: `npx -y add-mcp ${MCP_SERVER_URL} -g`,
    config: {
      intro: 'If your agent supports remote MCP over HTTP, add a server named `Axiom` with the URL `https://mcp.axiom.co/mcp`. If it doesn’t, use `mcp-remote`:',
      value: mcpRemote,
    },
    signIn: 'Sign in to Axiom in your browser when your agent prompts you.',
    notes: [
      'Clients that only support the older HTTP+SSE transport can use `https://mcp.axiom.co/sse`.',
      'For agents that can’t sign in through a browser, use header-based authentication below.',
    ],
    docs: 'https://add-mcp.com/docs/quickstart',
    checked: '2026-10-20',
  },
];

export const defaultMcpClient = mcpClients[0];

export function findMcpClient(value: string): McpClient | undefined {
  return mcpClients.find((client) => client.id === value || client.aliases?.includes(value));
}

export function mcpConfigCode(client: McpClient) {
  return client.config ? JSON.stringify(client.config.value, null, 2) : '';
}

export function mcpCheckedLabel(client: McpClient) {
  return new Date(`${client.checked}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function agentCanSetUp(client: McpClient) {
  return (client.group === 'terminal' || client.group === 'editor') && Boolean(client.command || client.config?.file);
}

function promptSection(client: McpClient) {
  const parts = [`## ${client.label}`];
  if (client.command) parts.push(`\`\`\`\n${client.command}\n\`\`\``);
  else if (client.config?.file) {
    parts.push(`Add the following to \`${client.config.file}\`, merging it with any servers already there:`);
    parts.push(`\`\`\`json\n${mcpConfigCode(client)}\n\`\`\``);
  }
  if (client.signIn) parts.push(`Then tell the user: ${client.signIn}`);
  return parts.join('\n\n');
}

export function mcpSetupPrompt() {
  return [
    'These are official instructions from Axiom to connect your AI agent to Axiom through the Axiom MCP server.',
    'Complete all of the following steps yourself by running the commands or editing the config files directly. Do not ask the user to run any of these commands.',
    `Register the Axiom MCP server at ${MCP_SERVER_URL} using the section for your agent below. The server authenticates with OAuth in the browser, so do not ask for or store an API token.`,
    ...mcpClients.filter(agentCanSetUp).map(promptSection),
    `## Any other agent\n\nAdd a remote HTTP MCP server named \`axiom\` with the URL ${MCP_SERVER_URL} to your agent's MCP config. The agent asks the user to sign in the first time it connects.`,
    [
      'Once done, tell the user:',
      '```',
      '┌─ Axiom MCP Setup Complete ─────────────────────────────┐',
      '│  ✓ MCP  <path>                                         │',
      '│                                                        │',
      '│  ⚡ Restart your agent to load the Axiom MCP server    │',
      '└────────────────────────────────────────────────────────┘',
      '```',
    ].join('\n'),
    `For setup guides and troubleshooting, see ${MCP_DOCS_URL}`,
  ].join('\n\n');
}

function clientMarkdown(client: McpClient) {
  const parts = [`#### ${client.label}`];
  if (client.install) parts.push(`[${client.install.label}](${client.install.href})`);
  if (client.steps) parts.push(client.steps.map((step, index) => `${index + 1}. ${step}`).join('\n'));
  if (client.command) parts.push(`\`\`\`bash\n${client.command}\n\`\`\``);
  if (client.config) parts.push(client.config.intro, `\`\`\`json\n${mcpConfigCode(client)}\n\`\`\``);
  if (client.signIn) parts.push(client.signIn);
  parts.push(...(client.notes ?? []));
  parts.push(`For more information, see the [${client.label} documentation](${client.docs}).`);
  return parts.join('\n\n');
}

export function mcpClientsMarkdown() {
  return [
    `To have an AI agent set up Axiom MCP Server for you, give it the [setup prompt](${MCP_SETUP_PROMPT_URL}).`,
    ...mcpClients.map(clientMarkdown),
  ].join('\n\n');
}

function clientSearchText(client: McpClient) {
  return [client.label, client.install?.label, ...(client.steps ?? []), client.command, client.config?.intro, client.signIn, ...(client.notes ?? [])]
    .filter(Boolean)
    .join(' ');
}

export function withMcpClientsSearch(url: string, data: StructuredData): StructuredData {
  if (url !== MCP_PAGE_PATH) return data;
  return {
    ...data,
    contents: [...data.contents, ...mcpClients.map((client) => ({ heading: 'quick-setup', content: clientSearchText(client) }))],
  };
}
