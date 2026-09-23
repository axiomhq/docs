import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AssistantResponse } from '@/components/assistant-response';
import { assistantSourcePaths } from '@/lib/assistant-links';

afterEach(cleanup);

const spotlight = '/docs/console/intelligence/spotlight';

describe('assistant documentation links', () => {
  it('repairs generated links without changing other destinations or code', () => {
    const { getByRole, getByText } = render(
      <AssistantResponse sourceUrls={[spotlight]} linkSafety={{ enabled: false }}>
        {[
          '[Spotlight](/console/intelligence/spotlight)',
          '[Canonical](/docs/console/intelligence/spotlight?view=full#use-spotlight)',
          '[Absolute](https://axiom.co/console/intelligence/spotlight?view=full#use-spotlight)',
          '[Docs home](/docs#overview)',
          '[Section](#use-spotlight)',
          '[Pricing](https://axiom.co/pricing)',
          '[Console](https://app.axiom.co)',
          '[External](https://example.com/console/intelligence/spotlight)',
          '`/console/intelligence/spotlight`',
        ].join('\n\n')}
      </AssistantResponse>,
    );

    for (const [name, href] of [
      ['Spotlight', spotlight],
      ['Canonical', `${spotlight}?view=full#use-spotlight`],
      ['Absolute', `https://axiom.co${spotlight}?view=full#use-spotlight`],
      ['Docs home', '/docs#overview'],
      ['Section', '#use-spotlight'],
      ['Pricing', 'https://axiom.co/pricing'],
      ['Console', 'https://app.axiom.co/'],
      ['External', 'https://example.com/console/intelligence/spotlight'],
    ]) {
      expect(getByRole('link', { name })).toHaveAttribute('href', href);
    }
    expect(getByText('/console/intelligence/spotlight').tagName).toBe('CODE');
  });

  it('repairs existing answer blocks when matching sources arrive later', () => {
    const text = '[Spotlight](https://axiom.co/console/intelligence/spotlight)';
    const { getByRole, rerender } = render(
      <AssistantResponse sourceUrls={[]} linkSafety={{ enabled: false }}>{text}</AssistantResponse>,
    );
    expect(getByRole('link', { name: 'Spotlight' })).toHaveAttribute('href', 'https://axiom.co/console/intelligence/spotlight');

    rerender(
      <AssistantResponse sourceUrls={[spotlight]} linkSafety={{ enabled: false }}>{text}</AssistantResponse>,
    );
    expect(getByRole('link', { name: 'Spotlight' })).toHaveAttribute('href', `https://axiom.co${spotlight}`);
  });

  it('preserves Streamdown sanitization and leaves image paths alone', () => {
    const { container, getByRole } = render(
      <AssistantResponse sourceUrls={[spotlight]} linkSafety={{ enabled: false }}>
        {'[Unsafe](javascript:alert%281%29)\n\n![Example](/doc-assets/example.png)'}
      </AssistantResponse>,
    );
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
    expect(getByRole('img', { name: 'Example' })).toHaveAttribute('src', '/doc-assets/example.png');
  });

  it('uses a stable signature for the same retrieved pages', () => {
    expect(assistantSourcePaths([
      `${spotlight}#use-spotlight`, '/docs', spotlight, '/docs?view=full', '/docs-other',
    ])).toEqual(['/docs', spotlight]);
  });
});
