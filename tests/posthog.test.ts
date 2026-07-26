import { afterEach, describe, expect, it, vi } from 'vitest';
import { sanitizePostHogEvent, withoutUrlDetails } from '@/lib/posthog-privacy';

const { capture, init } = vi.hoisted(() => ({ capture: vi.fn(), init: vi.fn() }));

vi.mock('posthog-js', () => ({ default: { capture, init } }));

afterEach(() => {
  capture.mockReset();
  init.mockReset();
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe('PostHog client instrumentation', () => {
  it('initializes product analytics when the public project token is configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', 'phc_test');

    await import('@/instrumentation-client');

    expect(init).toHaveBeenCalledOnce();
    expect(init).toHaveBeenCalledWith('phc_test', expect.objectContaining({
      api_host: 'https://m.axiom.co',
      defaults: '2026-05-30',
      autocapture: {
        css_selector_ignorelist: [
          '.ph-no-autocapture',
          '[data-ph-no-autocapture]',
          '.ph-no-capture',
          '[data-ph-no-capture]',
        ],
      },
      capture_pageview: 'history_change',
      capture_pageleave: true,
      capture_dead_clicks: false,
      capture_heatmaps: false,
      capture_performance: false,
      cross_subdomain_cookie: true,
      person_profiles: 'identified_only',
      disable_surveys: true,
      disable_session_recording: true,
      disable_product_tours: true,
      advanced_disable_feature_flags: true,
    }));
    expect(init.mock.calls[0][1].before_send).toBe(sanitizePostHogEvent);
  });

  it('does not initialize analytics without a public project token', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', '');

    await import('@/instrumentation-client');

    expect(init).not.toHaveBeenCalled();
  });

  it('strips queries and fragments from analytics URLs', () => {
    expect(withoutUrlDetails('https://axiom.co/docs/search?token=secret#result'))
      .toBe('https://axiom.co/docs/search');
    expect(sanitizePostHogEvent({
      event: '$pageview',
      properties: {
        $current_url: 'https://axiom.co/docs/apl/overview?q=secret#heading',
        $referrer: 'https://example.com/private?query=secret',
        safe_property: 'kept',
      },
    })).toEqual({
      event: '$pageview',
      properties: {
        $current_url: 'https://axiom.co/docs/apl/overview',
        $referrer: 'https://example.com/private',
        safe_property: 'kept',
      },
    });
  });

  it('captures only typed, query-free documentation properties when configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', 'phc_test');
    window.history.replaceState({}, '', '/docs/apl/overview?query=private');
    const { captureDocsEvent } = await import('@/lib/docs-analytics');

    captureDocsEvent('docs_search_completed', {
      duration_bucket: '250ms_to_1s',
      outcome: 'results',
      result_count: 4,
    });

    expect(capture).toHaveBeenCalledWith('docs_search_completed', {
      docs_section: 'query_reference',
      page_path: '/docs/apl/overview',
      duration_bucket: '250ms_to_1s',
      outcome: 'results',
      result_count: 4,
    });
  });

  it('does not capture custom events without a public project token', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', '');
    const { captureDocsEvent } = await import('@/lib/docs-analytics');

    captureDocsEvent('docs_playground_opened', {});

    expect(capture).not.toHaveBeenCalled();
  });
});
