import posthog from 'posthog-js';

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

if (projectToken) {
  posthog.init(projectToken, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
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
}
