import v1 from '@/content/docs/(api-reference)/restapi/versions/v1.json';
import v2 from '@/content/docs/(api-reference)/restapi/versions/v2.json';
import edgeIngest from '@/content/docs/(api-reference)/restapi/versions/v1-edge-ingest.json';
import edgeQuery from '@/content/docs/(api-reference)/restapi/versions/v1-edge-query.json';

// OpenAPI documents are heterogeneous recursive JSON objects.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonObject = Record<string, any>;

const documents: Record<string, JsonObject> = {
  v1,
  v2,
  'v1-edge-ingest': edgeIngest,
  'v1-edge-query': edgeQuery,
};

export type ApiOperationData = {
  document: JsonObject;
  specId: string;
  method: string;
  path: string;
  displayPath: string;
  baseUrl: string;
  pathItem: JsonObject;
  operation: JsonObject;
};

export function resolveSchema(document: JsonObject, schema: JsonObject | undefined): JsonObject | undefined {
  if (!schema?.$ref) return schema;
  const parts = String(schema.$ref).replace(/^#\//, '').split('/');
  return parts.reduce((value: JsonObject | undefined, part: string) => value?.[part], document as JsonObject | undefined);
}

export function getApiOperation(value: string): ApiOperationData | undefined {
  const match = value.match(/^(\S+)\s+(get|post|put|patch|delete)\s+(.+)$/i);
  if (!match) return;
  const [, specId, methodValue, path] = match;
  const document = documents[specId];
  const method = methodValue.toLowerCase();
  const pathItem = document?.paths?.[path];
  const operation = pathItem?.[method];
  if (!document || !operation) return;
  const baseUrl = document.servers?.[0]?.url ?? '';
  const prefix = baseUrl ? new URL(baseUrl).pathname.replace(/\/$/, '') : '';
  return { document, specId, method, path, displayPath: `${prefix}${path}` || '/', baseUrl, pathItem, operation };
}

export function schemaExample(document: JsonObject, input: JsonObject | undefined, depth = 0): unknown {
  const schema = resolveSchema(document, input);
  if (!schema || depth > 4) return null;
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.enum?.length) return schema.enum[0];
  if (schema.type === 'array') return [schemaExample(document, schema.items, depth + 1)];
  if (schema.type === 'object' || schema.properties) {
    return Object.fromEntries(Object.entries<JsonObject>(schema.properties ?? {}).map(([key, value]) => [key, schemaExample(document, value, depth + 1)]));
  }
  if (schema.type === 'integer' || schema.type === 'number') return 0;
  if (schema.type === 'boolean') return true;
  if (schema.format === 'date-time') return '2026-01-01T00:00:00Z';
  if (schema.format === 'binary') return { message: 'hello from Axiom', status: 200 };
  return 'string';
}
