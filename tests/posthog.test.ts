import { afterEach, describe, expect, it, vi } from 'vitest';

const { init } = vi.hoisted(() => ({ init: vi.fn() }));

vi.mock('posthog-js', () => ({ default: { init } }));

afterEach(() => {
  init.mockReset();
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe('PostHog client instrumentation', () => {
  it('initializes product analytics when the public project token is configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', 'phc_test');
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', 'https://eu.i.posthog.com');

    await import('@/instrumentation-client');

    expect(init).toHaveBeenCalledOnce();
    expect(init).toHaveBeenCalledWith('phc_test', {
      api_host: 'https://eu.i.posthog.com',
      defaults: '2026-05-30',
      autocapture: true,
      capture_pageview: 'history_change',
      capture_pageleave: true,
      person_profiles: 'identified_only',
      disable_surveys: true,
      disable_session_recording: true,
      disable_product_tours: true,
      advanced_disable_feature_flags: true,
    });
  });

  it('does not initialize analytics without a public project token', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', '');

    await import('@/instrumentation-client');

    expect(init).not.toHaveBeenCalled();
  });
});
