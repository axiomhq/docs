'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { toast } from 'sonner';
import { CopyIcon } from '@/assets/icons';
import { DocsCodeBlock, type DocsCodeBlockProps } from '@/components/docs-code-block';
import { useUrlChoice } from '@/components/docs-tabs';
import { Button, ButtonLink } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/clipboard';
import { captureDocsEvent } from '@/lib/docs-analytics';
import {
  MCP_CLIENT_GROUPS,
  defaultMcpClient,
  findMcpClient,
  mcpCheckedLabel,
  mcpClients,
  mcpSetupPrompt,
  type McpClientId,
  type McpSetupAction,
} from '@/lib/mcp-clients';

export type McpSnippets = { command?: ReactNode; config?: ReactNode };

const clientIds = mcpClients.map((client) => client.id);
const resolveClient = (raw: string) => findMcpClient(raw)?.id ?? raw;

function track(client: McpClientId, action: McpSetupAction) {
  captureDocsEvent('docs_mcp_setup_action', { client, action });
}

export function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((part, index) => {
    if (index % 2 === 0) return part;
    return part.startsWith('`') ? <code key={index}>{part.slice(1, -1)}</code> : <strong key={index}>{part.slice(2, -2)}</strong>;
  });
}

export function McpCodeBlock({
  client,
  action,
  ...props
}: DocsCodeBlockProps & { client: McpClientId; action: McpSetupAction }) {
  return <DocsCodeBlock {...props} onCopied={() => track(client, action)} />;
}

export function McpClientPicker({ snippets }: { snippets: Record<string, McpSnippets> }) {
  const { value, select } = useUrlChoice('client', clientIds, resolveClient);
  const client = findMcpClient(value) ?? defaultMcpClient;
  const clientSnippets: McpSnippets = snippets[client.id] ?? {};
  const viewed = useRef(false);

  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    const raw = new URLSearchParams(window.location.search).get('client');
    const requested = raw === null ? undefined : findMcpClient(raw);
    captureDocsEvent('docs_mcp_setup_viewed', {
      client: requested?.id ?? defaultMcpClient.id,
      preselected: requested !== undefined,
    });
  }, []);

  function choose(next: McpClientId) {
    captureDocsEvent('docs_mcp_client_selected', { client: next, previous_client: client.id });
    select(next);
  }

  async function copyPrompt() {
    if (!(await copyToClipboard(mcpSetupPrompt()))) {
      toast.error('Couldn’t copy setup prompt');
      return;
    }
    track(client.id, 'copy_prompt');
    toast.success('Setup prompt copied');
  }

  const setup = (
    <>
      {clientSnippets.command}
      {client.config && <p>{inline(client.config.intro)}</p>}
      {clientSnippets.config}
    </>
  );
  const external = client.install?.href.startsWith('https:');

  return (
    <div className="mcp-setup" data-ph-no-autocapture>
      <div className="mcp-setup-head">
        <p>Using an AI coding agent? Copy a prompt that sets up Axiom MCP Server for you.</p>
        <Button type="button" variant="outline" className="text-[13px]" onClick={copyPrompt}>
          <CopyIcon className="size-[11px]" aria-hidden="true" />
          Copy setup prompt
        </Button>
      </div>
      <div className="mcp-setup-groups">
        {MCP_CLIENT_GROUPS.map((group) => (
          <fieldset key={group.id}>
            <legend>{group.label}</legend>
            <div className="mcp-setup-chips">
              {mcpClients
                .filter((option) => option.group === group.id)
                .map((option) => (
                  <label key={option.id} className="mcp-setup-chip">
                    <input
                      type="radio"
                      className="sr-only"
                      name="mcp-client"
                      value={option.id}
                      checked={option.id === client.id}
                      onChange={() => choose(option.id)}
                    />
                    {option.label}
                  </label>
                ))}
            </div>
          </fieldset>
        ))}
      </div>
      <section className="mcp-setup-panel" aria-label={`${client.label} setup`}>
        {client.install && (
          <ButtonLink
            href={client.install.href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer' : undefined}
            variant="solid-color"
            className="mcp-setup-install h-7 w-fit rounded-md px-2.5 font-sans text-[13px] font-[450] [--btn-accent:var(--brand)]"
            onClick={() => track(client.id, 'one_click')}
          >
            {client.install.label}
          </ButtonLink>
        )}
        {client.steps && (
          <ol>
            {client.steps.map((step) => (
              <li key={step}>{inline(step)}</li>
            ))}
          </ol>
        )}
        {!client.install && setup}
        {client.signIn && <p>{inline(client.signIn)}</p>}
        {client.notes?.map((note) => (
          <p key={note}>{inline(note)}</p>
        ))}
        {client.install && (clientSnippets.command || clientSnippets.config) && (
          <details>
            <summary>Set it up manually</summary>
            {setup}
          </details>
        )}
        <p className="mcp-setup-foot">
          <a href={client.docs} target="_blank" rel="noreferrer" onClick={() => track(client.id, 'open_client_docs')}>
            {client.label} documentation
          </a>
          <span>Checked {mcpCheckedLabel(client)}</span>
        </p>
      </section>
    </div>
  );
}
