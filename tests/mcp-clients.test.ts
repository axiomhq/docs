import { describe, expect, it } from 'vitest';
import {
  MCP_PAGE_PATH,
  MCP_SERVER_URL,
  MCP_SETUP_PROMPT_URL,
  findMcpClient,
  mcpClients,
  mcpClientsMarkdown,
  mcpSetupPrompt,
  withMcpClientsSearch,
  type McpClientId,
} from '@/lib/mcp-clients';

function installHref(id: McpClientId) {
  const href = mcpClients.find((client) => client.id === id)?.install?.href;
  if (!href) throw new Error(`${id} has no install link`);
  return href;
}

describe('findMcpClient', () => {
  it('resolves ids and aliases, and rejects unknown values', () => {
    expect(findMcpClient('cursor')?.id).toBe('cursor');
    expect(findMcpClient('windsurf')?.id).toBe('devin');
    expect(findMcpClient('emacs')).toBeUndefined();
  });
});

describe('install links', () => {
  it('each decode back to the Axiom MCP URL', () => {
    const cursor = new URL(installHref('cursor'));
    expect(cursor.protocol).toBe('cursor:');
    expect(JSON.parse(atob(cursor.searchParams.get('config') ?? ''))).toEqual({ url: MCP_SERVER_URL });

    const vsCode = installHref('vs-code');
    expect(vsCode.startsWith('vscode:mcp/install?')).toBe(true);
    expect(JSON.parse(decodeURIComponent(vsCode.slice('vscode:mcp/install?'.length)))).toEqual({
      name: 'axiom',
      type: 'http',
      url: MCP_SERVER_URL,
    });

    const kiro = new URL(installHref('kiro'));
    expect(JSON.parse(kiro.searchParams.get('config') ?? '')).toEqual({ url: MCP_SERVER_URL });

    const goose = new URL(installHref('goose'));
    expect(goose.searchParams.get('url')).toBe(MCP_SERVER_URL);
    expect(goose.searchParams.get('type')).toBe('streamable_http');
    expect(installHref('goose')).not.toContain('+');

    expect(new URL(installHref('claude')).searchParams.get('connectorUrl')).toBe(MCP_SERVER_URL);
  });
});

describe('mcpSetupPrompt', () => {
  const prompt = mcpSetupPrompt();
  const sections = [...prompt.matchAll(/^## (.+)$/gm)].map((match) => match[1]);

  it('covers clients an agent can configure and skips the ones it cannot', () => {
    expect(sections).toEqual(expect.arrayContaining(['Claude Code', 'VS Code', 'Kiro', 'Antigravity', 'Any other agent']));
    for (const label of ['Claude', 'ChatGPT', 'Goose', 'Zed', 'Warp', 'Other']) expect(sections).not.toContain(label);
  });

  it('writes commands as-is and config clients as a file to merge', () => {
    expect(prompt).toContain('```\ncode --add-mcp');
    expect(prompt).toContain('Add the following to `~/.cursor/mcp.json`, merging it with any servers already there:\n\n```json');
  });

  it('ends with the completion box and the docs link', () => {
    expect(prompt).toContain('Axiom MCP Setup Complete');
    expect(prompt.endsWith('https://axiom.co/docs/console/intelligence/mcp-server')).toBe(true);
  });
});

describe('mcpClientsMarkdown', () => {
  const markdown = mcpClientsMarkdown();

  it('opens with a link to the setup prompt', () => {
    expect(markdown.split('\n\n')[0]).toContain(`[setup prompt](${MCP_SETUP_PROMPT_URL})`);
  });

  it('lists every client with install links and fenced snippets', () => {
    for (const client of mcpClients) expect(markdown).toContain(`#### ${client.label}\n`);
    expect(markdown).toContain(`[Add to Cursor](${installHref('cursor')})`);
    expect(markdown).toContain('```json\n{\n  "mcpServers": {\n    "axiom": {\n      "url": "https://mcp.axiom.co/mcp"');
    expect(markdown).toContain('1. In ChatGPT, go to **Plugins**');
  });
});

describe('withMcpClientsSearch', () => {
  const data = {
    headings: [{ id: 'quick-setup', content: 'Quick setup' }],
    contents: [{ heading: 'quick-setup', content: 'Choose your client.' }],
  };

  it('indexes every client under Quick setup on the MCP page only', () => {
    const indexed = withMcpClientsSearch(MCP_PAGE_PATH, data);

    expect(indexed.headings).toEqual(data.headings);
    expect(indexed.contents.slice(0, 1)).toEqual(data.contents);
    expect(indexed.contents).toHaveLength(1 + mcpClients.length);
    expect(indexed.contents.every((item) => item.heading === 'quick-setup')).toBe(true);
    expect(indexed.contents.find((item) => item.content.startsWith('Devin Desktop'))?.content).toContain('Windsurf');
    expect(indexed.contents.find((item) => item.content.startsWith('Codex'))?.content).toContain('codex mcp add axiom');
    expect(withMcpClientsSearch('/docs/getting-started', data)).toBe(data);
  });
});
