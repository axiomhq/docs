import { componentJsonSchema } from '@/lib/json-schema';
import { getOpenApiDocument } from '@/lib/openapi';

const ORIGIN = 'https://axiom.co';

export const DASHBOARD_SCHEMA_URL = `${ORIGIN}/docs/schemas/dashboard.json`;

export const OPENAPI_SPEC_LABELS: Record<string, string> = {
  v1: 'v1 API (https://api.axiom.co/v1): datasets, ingest, and queries',
  v2: 'v2 API (https://api.axiom.co/v2): dashboards, monitors, notifiers, tokens, and other resources',
  'v1-edge-ingest': 'Edge ingest API',
  'v1-edge-query': 'Edge query API',
  'v1-edge-hec': 'Edge HEC-compatible ingest API',
};

export function openApiSpecUrl(specId: string): string {
  return `${ORIGIN}/docs/openapi/${specId}.json`;
}

/** JSON Schema for the `dashboard` document sent to the v2 dashboards API. */
export function dashboardJsonSchema() {
  return componentJsonSchema(getOpenApiDocument('v2')!, 'Dashboard', {
    id: DASHBOARD_SCHEMA_URL,
    title: 'Axiom dashboard',
    description:
      'The `dashboard` document accepted by the Axiom v2 dashboards API (POST /v2/dashboards and PUT /v2/dashboards/uid/{uid}). Generated from the v2 OpenAPI spec. The API also checks constraints that JSON Schema cannot express: chart, layout, and section IDs are unique; every chart has exactly one layout item whose `i` equals the chart `id`; every `sectionId` names an entry in `sections`; SmartFilter charts have no `sectionId`. Reference: https://axiom.co/docs/restapi/dashboard-json',
  });
}
