import { describe, expect, it } from 'vitest';
import {
  apiOperationMarkdown,
  getApiOperation,
  getApiOperationSections,
  resolveSchema,
  schemaExample,
} from '@/lib/openapi';

describe('OpenAPI migration', () => {
  it('resolves the legacy endpoint reference against the checked-in spec', () => {
    const endpoint = getApiOperation('v1 post /datasets/{dataset_name}/ingest');
    expect(endpoint?.method).toBe('post');
    expect(endpoint?.displayPath).toBe('/v1/datasets/{dataset_name}/ingest');
    expect(endpoint?.operation.operationId).toBe('ingestIntoDataset');
  });

  it('resolves response schemas and generates an example', () => {
    const endpoint = getApiOperation('v1 post /datasets/{dataset_name}/ingest')!;
    const schema = endpoint.operation.responses['200'].content['application/json'].schema;
    expect(resolveSchema(endpoint.document, schema)?.properties).toBeDefined();
    expect(schemaExample(endpoint.document, schema)).toMatchObject({ ingested: 2, failed: 0 });
  });

  it('resolves the edge HEC endpoint reference and status schema', () => {
    const endpoint = getApiOperation('v1-edge-hec post /services/collector/event');
    expect(endpoint?.method).toBe('post');
    expect(endpoint?.displayPath).toBe('/services/collector/event');
    expect(endpoint?.operation.operationId).toBe('ingestHecEvent');

    const schema = endpoint!.operation.responses['200'].content['application/json'].schema;
    expect(schemaExample(endpoint!.document, schema)).toMatchObject({ text: 'Success', code: 0 });
  });

  it('unwraps array responses and chained schema references', () => {
    const endpoint = getApiOperation('v2 get /dashboards')!;
    const responseSchema = endpoint.operation.responses['200'].content['application/json'].schema;
    const resource = resolveSchema(endpoint.document, responseSchema.items)!;
    const dashboard = resolveSchema(endpoint.document, resource.properties.dashboard)!;

    expect(responseSchema.type).toBe('array');
    expect(dashboard.properties.name.type).toBe('string');
    expect(dashboard.required).toContain('name');
  });

  it('builds the page TOC only from sections rendered by the operation', () => {
    expect(getApiOperationSections('v2 get /dashboards')).toEqual([
      { title: 'Parameters', url: '#parameters', depth: 2 },
      { title: 'Request', url: '#example', depth: 2 },
      { title: 'Response', url: '#response', depth: 2 },
    ]);

    expect(
      getApiOperationSections('v1 post /datasets/{dataset_name}/ingest'),
    ).toEqual([
      { title: 'Parameters', url: '#parameters', depth: 2 },
      { title: 'Body', url: '#body', depth: 2 },
      { title: 'Request', url: '#example', depth: 2 },
      { title: 'Response', url: '#response', depth: 2 },
    ]);
    expect(getApiOperationSections('missing get /nothing')).toEqual([]);
  });

  it('renders the spec-backed operation as Markdown around the page prose', () => {
    const markdown = apiOperationMarkdown('v2 post /dashboards', 'Page prose.');

    expect(markdown.startsWith('`POST /v2/dashboards`')).toBe(true);
    const order = ['Create a dashboard from a dashboard document payload.', 'Page prose.', '## Body', '## Request', '## Response'];
    const positions = order.map((text) => markdown.indexOf(text));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(markdown).toContain('| `dashboard.owner` | `string` | Yes | User ID of the dashboard owner.');
    expect(markdown).toContain("curl -X POST 'https://api.axiom.co/v2/dashboards'");
    expect(markdown).toContain('| `409` | Dashboard already exists | `application/json` |');

    expect(apiOperationMarkdown('v2 get /dashboards')).toContain('| `labelIds` | `string[]` | query | No |');
    expect(apiOperationMarkdown('missing get /nothing', 'Page prose.')).toBe('Page prose.');
  });
});
