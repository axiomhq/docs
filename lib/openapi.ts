import v1 from '@/content/docs/(api-reference)/restapi/versions/v1.json';
import v2 from '@/content/docs/(api-reference)/restapi/versions/v2.json';
import edgeIngest from '@/content/docs/(api-reference)/restapi/versions/v1-edge-ingest.json';
import edgeQuery from '@/content/docs/(api-reference)/restapi/versions/v1-edge-query.json';
import edgeHec from '@/content/docs/(api-reference)/restapi/versions/v1-edge-hec.json';

// OpenAPI documents are heterogeneous recursive JSON objects.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonObject = Record<string, any>;

const documents: Record<string, JsonObject> = {
  v1,
  v2,
  'v1-edge-ingest': edgeIngest,
  'v1-edge-query': edgeQuery,
  'v1-edge-hec': edgeHec,
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

export function resolveSchema(document: JsonObject, schema: JsonObject | undefined, depth = 0): JsonObject | undefined {
  if (!schema?.$ref || depth > 12) return schema;
  const parts = String(schema.$ref).replace(/^#\//, '').split('/');
  const target = parts.reduce((value: JsonObject | undefined, part: string) => value?.[part], document as JsonObject | undefined);
  if (!target) return schema;
  const resolved = resolveSchema(document, target, depth + 1);
  if (!resolved) return schema;
  const overrides = { ...schema };
  delete overrides.$ref;
  return { ...resolved, ...overrides };
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

export type ApiOperationSection = {
  title: string;
  url: string;
  depth: number;
};

export function getApiOperationSections(value: string): ApiOperationSection[] {
  const data = getApiOperation(value);
  if (!data) return [];

  const { pathItem, operation } = data;
  const parameterCount = [
    ...(pathItem.parameters ?? []),
    ...(operation.parameters ?? []),
  ].length;
  const hasBody = Object.keys(resolveSchema(data.document, operation.requestBody)?.content ?? {}).length > 0;
  const hasResponses = Object.keys(operation.responses ?? {}).length > 0;

  return [
    ...(parameterCount > 0
      ? [{ title: 'Parameters', url: '#parameters', depth: 2 }]
      : []),
    ...(hasBody ? [{ title: 'Body', url: '#body', depth: 2 }] : []),
    { title: 'Request', url: '#example', depth: 2 },
    ...(hasResponses
      ? [{ title: 'Response', url: '#response', depth: 2 }]
      : []),
  ];
}

export function operationRequiresAuth(document: JsonObject, operation: JsonObject): boolean {
  const security = (operation.security ?? document.security) as unknown[] | undefined;
  return !security || security.length > 0;
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

export function schemaType(document: JsonObject, input: JsonObject | undefined): string {
  const schema = resolveSchema(document, input);
  if (!schema) return 'unknown';
  if (schema.type === 'array') return `${schemaType(document, schema.items)}[]`;
  const type = schema.type ?? (schema.properties ? 'object' : 'unknown');
  return schema.format ? `${type}<${schema.format}>` : type;
}

// Specs are inconsistent about response descriptions: some omit them
// entirely (403/404 on several endpoints) and some carry a literal
// "(empty)" placeholder — fall back to the HTTP reason phrase.
const STATUS_TEXT: Record<string, string> = {
  '200': 'OK',
  '201': 'Created',
  '202': 'Accepted',
  '204': 'No Content',
  '400': 'Bad Request',
  '401': 'Unauthorized',
  '403': 'Forbidden',
  '404': 'Not Found',
  '409': 'Conflict',
  '412': 'Precondition Failed',
  '422': 'Unprocessable Entity',
  '429': 'Too Many Requests',
  '500': 'Internal Server Error',
  '503': 'Service Unavailable',
};

export function responseDescription(code: string, description?: string) {
  if (description && description !== '(empty)') return description;
  return STATUS_TEXT[code] ?? '';
}

export type SchemaRow = {
  key: string;
  name: string;
  field: JsonObject;
  description?: string;
  required: boolean;
  depth: number;
  location?: string;
  hasChildren: boolean;
};

function nestedSchema(document: JsonObject, field: JsonObject | undefined) {
  const resolved = resolveSchema(document, field);
  if (resolved?.properties) return resolved;
  if (resolved?.type === 'array') {
    const items = resolveSchema(document, resolved.items);
    if (items?.properties) return items;
  }
}

function schemaRows(
  document: JsonObject,
  input: JsonObject | undefined,
  required: string[] = [],
  depth = 0,
  parent = '',
): SchemaRow[] {
  const schema = resolveSchema(document, input);
  if (!schema || depth > 5) return [];
  if (schema.type === 'array') {
    const items = resolveSchema(document, schema.items);
    return schemaRows(document, items, items?.required ?? [], depth, parent);
  }
  return Object.entries<JsonObject>(schema.properties ?? {}).flatMap(([name, field]) => {
    const resolved = resolveSchema(document, field);
    const children = nestedSchema(document, field);
    const key = parent ? `${parent}.${name}` : name;
    return [
      {
        key,
        name,
        field,
        description: resolved?.description,
        required: required.includes(name),
        depth,
        hasChildren: Boolean(children),
      },
      ...schemaRows(document, children, children?.required, depth + 1, key),
    ];
  });
}

export type ApiRequestSample = { id: string; label: string; language: string; code: string };

function requestSamples(
  method: string,
  requestUrl: string,
  bodyType: string | undefined,
  bodyExample: unknown,
  requiresAuth: boolean,
): ApiRequestSample[] {
  const upperMethod = method.toUpperCase();
  const json = bodyType ? JSON.stringify(bodyExample, null, 2) : undefined;
  const curl = [
    `curl -X ${upperMethod} '${requestUrl}'`,
    ...(requiresAuth ? [`  -H 'Authorization: Bearer API_TOKEN'`] : []),
    ...(bodyType ? [`  -H 'Content-Type: ${bodyType}'`, `  -d '${JSON.stringify(bodyExample)}'`] : []),
  ].join(' \\\n');
  const javascriptHeaders = [
    ...(requiresAuth ? [`    Authorization: 'Bearer API_TOKEN',`] : []),
    ...(bodyType ? [`    'Content-Type': '${bodyType}',`] : []),
  ];
  const javascriptOptions = [
    `  method: '${upperMethod}',`,
    ...(javascriptHeaders.length ? [`  headers: {`, ...javascriptHeaders, `  },`] : []),
    ...(json ? [`  body: JSON.stringify(${json.replace(/\n/g, '\n  ')}),`] : []),
  ];
  const javascript = [
    `const response = await fetch('${requestUrl}', {`,
    ...javascriptOptions,
    `});`,
    ``,
    `const data = await response.json();`,
  ].join('\n');
  const pythonHeaders = [
    ...(requiresAuth ? [`'Authorization': 'Bearer API_TOKEN'`] : []),
    ...(bodyType ? [`'Content-Type': '${bodyType}'`] : []),
  ];
  const python = [
    ...(json ? [`import json`] : []),
    `import requests`,
    ``,
    `response = requests.request(`,
    `    '${upperMethod}',`,
    `    '${requestUrl}',`,
    ...(pythonHeaders.length ? [`    headers={${pythonHeaders.join(', ')}},`] : []),
    // Raw string: a plain triple-quote would collapse JSON's \" escapes
    // before json.loads parses them.
    ...(json ? [`    json=json.loads(r'''${json}'''),`] : []),
    `)`,
    `response.raise_for_status()`,
    `data = response.json()`,
  ].join('\n');
  const goImports = bodyType
    ? [`    "bytes"`, `    "fmt"`, `    "io"`, `    "net/http"`]
    : [`    "fmt"`, `    "io"`, `    "net/http"`];
  const goBody = json ? `bytes.NewBufferString(\`${json}\`)` : 'nil';
  const go = [
    `package main`,
    ``,
    `import (`,
    ...goImports,
    `)`,
    ``,
    `func main() {`,
    `    req, err := http.NewRequest("${upperMethod}", "${requestUrl}", ${goBody})`,
    `    if err != nil { panic(err) }`,
    ...(requiresAuth ? [`    req.Header.Set("Authorization", "Bearer API_TOKEN")`] : []),
    ...(bodyType ? [`    req.Header.Set("Content-Type", "${bodyType}")`] : []),
    ``,
    `    res, err := http.DefaultClient.Do(req)`,
    `    if err != nil { panic(err) }`,
    `    defer res.Body.Close()`,
    ``,
    `    body, err := io.ReadAll(res.Body)`,
    `    if err != nil { panic(err) }`,
    `    fmt.Println(string(body))`,
    `}`,
  ].join('\n');

  return [
    { id: 'curl', label: 'cURL', language: 'bash', code: curl },
    { id: 'javascript', label: 'JavaScript', language: 'javascript', code: javascript },
    { id: 'python', label: 'Python', language: 'python', code: python },
    { id: 'go', label: 'Go', language: 'go', code: go },
  ];
}

/** Everything the HTML and Markdown renderings of an operation display, derived once from the spec. */
export function describeApiOperation(value: string) {
  const data = getApiOperation(value);
  if (!data) return;
  const { document, method, displayPath, baseUrl, path, pathItem, operation } = data;
  const parameters: JsonObject[] = [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])].map(
    (item: JsonObject) => resolveSchema(document, item) ?? item,
  );
  // Several v2 operations reference their body via $ref — read it through
  // the resolver like every other spec read, or those pages document no body.
  const requestBody = resolveSchema(document, operation.requestBody);
  const bodyContent = requestBody?.content as Record<string, JsonObject> | undefined;
  const bodyType = bodyContent ? Object.keys(bodyContent)[0] : undefined;
  const bodySchema = bodyType ? bodyContent?.[bodyType]?.schema : undefined;
  const responseEntries = Object.entries<JsonObject>(operation.responses ?? {});
  const successResponse = responseEntries.find(([code]) => /^2/.test(code)) ?? responseEntries[0];
  const responseType = successResponse ? Object.keys(successResponse[1].content ?? {})[0] : undefined;
  const responseSchema =
    responseType && successResponse ? successResponse[1].content?.[responseType]?.schema : undefined;
  const placeholder = (_: string, name: string) => name.toUpperCase().replace(/-/g, '_');
  const requestUrl = baseUrl
    ? new URL(path.replace(/^\//, '').replace(/\{([^}]+)\}/g, placeholder), baseUrl).toString()
    : displayPath.replace(/\{([^}]+)\}/g, placeholder);
  const bodyExample = bodyType ? schemaExample(document, bodySchema) : undefined;
  const requiresAuth = operationRequiresAuth(document, operation);
  const parameterRows: SchemaRow[] = parameters.map((parameter) => ({
    key: `${parameter.in}-${parameter.name}`,
    name: parameter.name,
    field: parameter.schema ?? {},
    description: parameter.description,
    required: Boolean(parameter.required),
    depth: 0,
    location: parameter.in,
    hasChildren: Boolean(nestedSchema(document, parameter.schema)),
  }));

  return {
    ...data,
    parameters,
    parameterRows,
    requestBody,
    bodyContent,
    bodyType,
    bodySchema,
    bodyDescription: resolveSchema(document, bodySchema)?.description ?? requestBody?.description,
    bodyExample,
    bodyRows: schemaRows(document, bodySchema, resolveSchema(document, bodySchema)?.required),
    responseEntries,
    responseSchema,
    responseRows: schemaRows(document, responseSchema, resolveSchema(document, responseSchema)?.required),
    requiresAuth,
    samples: requestSamples(method, requestUrl, bodyType, bodyExample, requiresAuth),
  };
}

function markdownCell(value: string | undefined) {
  return (value ?? '').replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|').trim();
}

function markdownSchemaTable(document: JsonObject, rows: SchemaRow[]) {
  const hasLocation = rows.some((row) => row.location);
  const header = hasLocation ? ['Name', 'Type', 'Location', 'Required', 'Description'] : ['Property', 'Type', 'Required', 'Description'];
  return [
    `| ${header.join(' | ')} |`,
    `| ${header.map(() => '---').join(' | ')} |`,
    ...rows.map((row) =>
      [
        '',
        // Schema rows carry their full dotted path, so nesting stays unambiguous without indentation.
        `\`${hasLocation ? row.name : row.key}\``,
        `\`${schemaType(document, row.field)}\``,
        ...(hasLocation ? [row.location ?? ''] : []),
        row.required ? 'Yes' : 'No',
        markdownCell(row.description),
        '',
      ].join(' | ').trim(),
    ),
  ].join('\n');
}

/**
 * Markdown for an OpenAPI-backed page. Endpoint MDX files hold only frontmatter and optional prose; the HTML
 * page renders everything else from the spec, so text exports must too. `prose` keeps the HTML page's position.
 */
export function apiOperationMarkdown(value: string, prose = ''): string {
  const op = describeApiOperation(value);
  if (!op) return prose;
  const { document } = op;
  const curl = op.samples.find((sample) => sample.id === 'curl')!;
  const sections = [`\`${op.method.toUpperCase()} ${op.displayPath}\``];
  if (op.baseUrl) sections.push(`Base URL: \`${op.baseUrl}\``);
  if (op.operation.description) sections.push(op.operation.description.trim());
  if (prose.trim()) sections.push(prose.trim());
  if (op.parameterRows.length) sections.push(`## Parameters\n\n${markdownSchemaTable(document, op.parameterRows)}`);
  if (op.bodyContent) {
    sections.push(
      [
        '## Body',
        op.bodyDescription?.trim(),
        `Content type: ${Object.keys(op.bodyContent).map((type) => `\`${type}\``).join(', ')}`,
        op.bodyRows.length ? markdownSchemaTable(document, op.bodyRows) : undefined,
      ]
        .filter(Boolean)
        .join('\n\n'),
    );
  }
  sections.push(`## Request\n\n\`\`\`${curl.language}\n${curl.code}\n\`\`\``);
  if (op.responseEntries.length) {
    sections.push(
      [
        '## Response',
        [
          '| Status | Description | Content type |',
          '| --- | --- | --- |',
          ...op.responseEntries.map(
            ([code, response]) =>
              `| \`${code}\` | ${markdownCell(responseDescription(code, response.description))} | ${Object.keys(response.content ?? {}).map((type) => `\`${type}\``).join(', ')} |`,
          ),
        ].join('\n'),
        op.responseRows.length ? markdownSchemaTable(document, op.responseRows) : undefined,
      ]
        .filter(Boolean)
        .join('\n\n'),
    );
  }
  return sections.join('\n\n');
}
