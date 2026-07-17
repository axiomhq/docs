import { describe, expect, it } from 'vitest';
import { getApiOperation, resolveSchema, schemaExample } from '@/lib/openapi';

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

  it('unwraps array responses and chained schema references', () => {
    const endpoint = getApiOperation('v2 get /dashboards')!;
    const responseSchema = endpoint.operation.responses['200'].content['application/json'].schema;
    const resource = resolveSchema(endpoint.document, responseSchema.items)!;
    const dashboard = resolveSchema(endpoint.document, resource.properties.dashboard)!;

    expect(responseSchema.type).toBe('array');
    expect(dashboard.properties.name.type).toBe('string');
    expect(dashboard.required).toContain('name');
  });
});
