import { StrictMode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { captureDocsEvent, copyToClipboard } = vi.hoisted(() => ({
  captureDocsEvent: vi.fn(),
  copyToClipboard: vi.fn(),
}));

vi.mock('@/lib/docs-analytics', () => ({ captureDocsEvent }));
vi.mock('@/lib/clipboard', () => ({ copyToClipboard }));

import { McpClientPicker, McpCodeBlock, inline } from '@/components/mcp-client-picker';
import { mcpSetupPrompt } from '@/lib/mcp-clients';

const page = '/docs/console/intelligence/mcp-server';

beforeEach(() => {
  copyToClipboard.mockResolvedValue(true);
});

afterEach(() => {
  cleanup();
  captureDocsEvent.mockReset();
  copyToClipboard.mockReset();
  window.history.replaceState(null, '', page);
});

function renderPicker(search = '') {
  window.history.replaceState(null, '', `${page}${search}`);
  return render(
    <StrictMode>
      <McpClientPicker snippets={{}} />
    </StrictMode>,
  );
}

function events(name: string) {
  return captureDocsEvent.mock.calls.filter(([event]) => event === name).map(([, properties]) => properties);
}

describe('McpClientPicker', () => {
  it('opens an aliased client from the URL and reports the view once', () => {
    renderPicker('?client=windsurf#quick-setup');

    expect(screen.getByRole('radio', { name: 'Devin Desktop' })).toBeChecked();
    expect(events('docs_mcp_setup_viewed')).toEqual([{ client: 'devin', preselected: true }]);
  });

  it('shows Claude Code for an unknown client and does not count it as preselected', () => {
    renderPicker('?client=emacs');

    expect(screen.getByRole('radio', { name: 'Claude Code' })).toBeChecked();
    expect(events('docs_mcp_setup_viewed')).toEqual([{ client: 'claude-code', preselected: false }]);
    expect(window.location.search).toBe('?client=emacs');
  });

  it('writes the chosen client to the URL and reports the previous one', () => {
    renderPicker('#quick-setup');

    fireEvent.click(screen.getByRole('radio', { name: 'Cursor' }));

    expect(screen.getByRole('radio', { name: 'Cursor' })).toBeChecked();
    expect(window.location.search).toBe('?client=cursor');
    expect(window.location.hash).toBe('#quick-setup');
    expect(events('docs_mcp_client_selected')).toEqual([{ client: 'cursor', previous_client: 'claude-code' }]);
    const install = screen.getByRole('link', { name: 'Add to Cursor' });
    expect(install.getAttribute('href')).toMatch(/^cursor:\/\/anysphere\.cursor-deeplink\/mcp\/install\?/);
    expect(install).not.toHaveAttribute('target');
  });

  it('opens https install links in a new tab', () => {
    renderPicker('?client=claude');

    expect(screen.getByRole('link', { name: 'Add to Claude' })).toHaveAttribute('target', '_blank');
  });

  it('tracks the setup prompt copy, one-click installs and docs links', async () => {
    renderPicker('?client=goose');

    fireEvent.click(screen.getByRole('button', { name: 'Copy setup prompt' }));
    await waitFor(() => expect(events('docs_mcp_setup_action')).toEqual([{ client: 'goose', action: 'copy_prompt' }]));
    expect(copyToClipboard).toHaveBeenCalledWith(mcpSetupPrompt());

    fireEvent.click(screen.getByRole('link', { name: 'Add to Goose' }));
    fireEvent.click(screen.getByRole('link', { name: 'Goose documentation' }));
    expect(events('docs_mcp_setup_action').slice(1)).toEqual([
      { client: 'goose', action: 'one_click' },
      { client: 'goose', action: 'open_client_docs' },
    ]);
  });

  it('does not report a prompt copy that failed', async () => {
    copyToClipboard.mockResolvedValue(false);
    renderPicker();

    fireEvent.click(screen.getByRole('button', { name: 'Copy setup prompt' }));
    await waitFor(() => expect(copyToClipboard).toHaveBeenCalled());
    expect(events('docs_mcp_setup_action')).toEqual([]);
  });
});

describe('McpCodeBlock', () => {
  it('reports a copy only when the clipboard write succeeds', async () => {
    render(
      <McpCodeBlock client="codex" action="copy_command">
        <code>codex mcp login axiom</code>
      </McpCodeBlock>,
    );
    const copy = screen.getByRole('button', { name: 'Copy code' });

    copyToClipboard.mockResolvedValueOnce(false);
    fireEvent.click(copy);
    await waitFor(() => expect(copyToClipboard).toHaveBeenCalledTimes(1));
    expect(events('docs_mcp_setup_action')).toEqual([]);

    fireEvent.click(copy);
    await waitFor(() => expect(events('docs_mcp_setup_action')).toEqual([{ client: 'codex', action: 'copy_command' }]));
  });
});

describe('inline', () => {
  it('renders code and bold spans and keeps plain text', () => {
    render(<p>{inline('Run `/mcp` and select **axiom** now.')}</p>);

    expect(screen.getByText('/mcp').tagName).toBe('CODE');
    expect(screen.getByText('axiom').tagName).toBe('STRONG');
    expect(screen.getByText(/now\./)).toHaveTextContent('Run /mcp and select axiom now.');
  });
});
