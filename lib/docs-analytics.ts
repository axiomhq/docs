'use client';

import posthog from 'posthog-js';

export type SearchEntryPoint =
  | 'header'
  | 'hero'
  | 'shortcut'
  | 'mode_tab'
  | 'assistant_handoff';
export type AssistantEntryPoint =
  | 'floating'
  | 'hero'
  | 'shortcut'
  | 'mode_tab'
  | 'search_handoff'
  | 'search_empty_state'
  | 'search_footer'
  | 'copy_page_menu';

type DurationBucket = 'under_250ms' | '250ms_to_1s' | '1s_to_3s' | '3s_to_10s' | 'over_10s';
type StatusClass = '2xx' | '3xx' | '4xx' | '5xx' | 'unknown';
type ExampleField = 'AXIOM_DOMAIN' | 'API_TOKEN' | 'DATASET_NAME' | 'ORGANIZATION_ID';

type DocsAnalyticsEvents = {
  docs_search_opened: { entry_point: SearchEntryPoint };
  docs_search_completed: {
    duration_bucket: DurationBucket;
    outcome: 'results' | 'empty';
    result_count: number;
  };
  docs_search_result_opened: {
    destination_path: string;
    input_method: 'keyboard' | 'pointer';
    result_rank: number;
  };
  docs_search_ai_handoff: {
    entry_point: 'search_handoff' | 'search_empty_state' | 'search_footer';
    result_count: number;
  };
  docs_ai_opened: { entry_point: AssistantEntryPoint };
  docs_ai_question_submitted: {
    submission_type: 'question' | 'retry';
    turn_number: number;
  };
  docs_ai_answer_completed: {
    duration_bucket: DurationBucket;
    outcome: 'answered' | 'error' | 'stopped';
    source_count: number;
  };
  docs_ai_source_opened: { destination_path: string; source_rank: number };
  docs_api_try_opened: { method: string; operation: string };
  docs_api_try_completed: {
    duration_bucket: DurationBucket;
    method: string;
    operation: string;
    outcome: 'success' | 'upstream_error' | 'validation_error' | 'rate_limited' | 'proxy_error';
    status_class: StatusClass;
  };
  docs_api_language_selected: { language: string };
  docs_code_copied: {
    code_kind: 'api_sample' | 'endpoint_path';
    language?: string;
  };
  docs_example_customized: { field_name: ExampleField };
  docs_page_context_action: {
    action: 'copy_markdown' | 'view_markdown' | 'ask_ai' | 'open_claude' | 'open_chatgpt' | 'open_grok';
  };
  docs_playground_opened: Record<string, never>;
  docs_console_opened: { placement: 'header' };
  docs_edit_opened: { page_path: string };
  docs_page_feedback_submitted: {
    helpful: boolean;
    page_path: string;
    page_title: string;
  };
};

type DocsSection = 'documentation' | 'query_reference' | 'api_reference' | 'changelog';

const analyticsEnabled = Boolean(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN);

export function captureDocsEvent<EventName extends keyof DocsAnalyticsEvents>(
  event: EventName,
  properties: DocsAnalyticsEvents[EventName],
) {
  if (!analyticsEnabled || typeof window === 'undefined') return;
  posthog.capture(event, {
    docs_section: docsSection(window.location.pathname),
    page_path: safeDocsPath(window.location.pathname),
    ...properties,
  });
}

export function durationBucket(durationMs: number): DurationBucket {
  if (durationMs < 250) return 'under_250ms';
  if (durationMs < 1_000) return '250ms_to_1s';
  if (durationMs < 3_000) return '1s_to_3s';
  if (durationMs < 10_000) return '3s_to_10s';
  return 'over_10s';
}

export function analyticsTimestamp() {
  return performance.now();
}

export function statusClass(status: number): StatusClass {
  const family = Math.floor(status / 100);
  return family >= 2 && family <= 5 ? `${family}xx` as StatusClass : 'unknown';
}

export function safeDocsPath(value: string) {
  try {
    const url = new URL(value, window.location.origin);
    return url.pathname.startsWith('/docs') ? url.pathname : '/docs';
  } catch {
    const path = value.split(/[?#]/, 1)[0];
    return path.startsWith('/docs') ? path : '/docs';
  }
}

function docsSection(pathname: string): DocsSection {
  if (pathname.startsWith('/docs/apl/') || pathname.startsWith('/docs/mpl/')) {
    return 'query_reference';
  }
  if (pathname.startsWith('/docs/restapi/')) return 'api_reference';
  if (pathname.startsWith('/docs/changelog')) return 'changelog';
  return 'documentation';
}
