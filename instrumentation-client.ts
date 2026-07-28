import posthog from 'posthog-js';
import { sanitizePostHogEvent } from '@/lib/posthog-privacy';

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

if (projectToken) {
  posthog.init(projectToken, {
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
    before_send: sanitizePostHogEvent,
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
  });
}
