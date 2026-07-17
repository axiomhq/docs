import { highlight } from 'fumadocs-core/highlight';
import type { ReactNode } from 'react';
import { CopyButton } from './copy-button';
import { ApiCodeBlock, type ApiCodeSample } from './api-code-block';
import { getApiOperation, resolveSchema, schemaExample } from '@/lib/openapi';

// OpenAPI documents are heterogeneous recursive JSON objects.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonObject = Record<string, any>;

function schemaType(document: JsonObject, input: JsonObject | undefined): string {
  const schema = resolveSchema(document, input);
  if (!schema) return 'unknown';
  if (schema.type === 'array') return `${schemaType(document, schema.items)}[]`;
  return schema.type ?? (schema.properties ? 'object' : 'unknown');
}

function PlainMarkdown({ value }: { value?: string }) {
  if (!value) return null;
  const chunks = value.split(/(`[^`]+`)/g);
  return <>{chunks.map((chunk, index) => chunk.startsWith('`') && chunk.endsWith('`') ? <code key={index}>{chunk.slice(1, -1)}</code> : <span key={index}>{chunk}</span>)}</>;
}

type SchemaRow = {
  key: string;
  name: string;
  field: JsonObject;
  description?: string;
  required: boolean;
  depth: number;
  location?: string;
  hasChildren: boolean;
};

function nestedSchema(document: JsonObject, field: JsonObject) {
  const resolved = resolveSchema(document, field);
  if (resolved?.properties) return resolved;
  if (resolved?.type === 'array') {
    const items = resolveSchema(document, resolved.items);
    if (items?.properties) return items;
  }
}

function schemaRows(document: JsonObject, input: JsonObject | undefined, required: string[] = [], depth = 0, parent = ''): SchemaRow[] {
  const schema = resolveSchema(document, input);
  if (!schema || depth > 5) return [];
  return Object.entries<JsonObject>(schema.properties ?? {}).flatMap(([name, field]) => {
    const resolved = resolveSchema(document, field);
    const children = nestedSchema(document, field);
    const key = parent ? `${parent}.${name}` : name;
    return [{
      key,
      name,
      field,
      description: resolved?.description,
      required: required.includes(name),
      depth,
      hasChildren: Boolean(children),
    }, ...schemaRows(document, children, children?.required, depth + 1, key)];
  });
}

function SchemaTable({ document, rows, label }: { document: JsonObject; rows: SchemaRow[]; label: string }) {
  if (rows.length === 0) return null;
  return (
    <div className="api-schema-wrap">
      <table className="api-schema-table" aria-label={label}>
        <thead><tr><th>Property</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>{rows.map((row) => (
          <tr className={row.hasChildren ? 'api-schema-object-row' : undefined} data-depth={row.depth} key={row.key}>
            <td className="api-schema-name" style={{ paddingLeft: 12 + row.depth * 18 }}>
              {row.depth > 0 && <span className="api-schema-branch" aria-hidden="true">└</span>}
              <code>{row.name}</code>
            </td>
            <td className="api-schema-type">
              <code>{schemaType(document, row.field)}</code>
              {row.required && <b>Required</b>}
              {row.location && <span>{row.location}</span>}
            </td>
            <td className="api-schema-description"><PlainMarkdown value={row.description} />{!row.description && <span aria-hidden="true">—</span>}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function requestSamples(method: string, requestUrl: string, bodyType: string | undefined, bodyExample: unknown) {
  const upperMethod = method.toUpperCase();
  const json = bodyType ? JSON.stringify(bodyExample, null, 2) : undefined;
  const curl = [`curl -X ${upperMethod} '${requestUrl}'`, `  -H 'Authorization: Bearer API_TOKEN'`, ...(bodyType ? [`  -H 'Content-Type: ${bodyType}'`, `  -d '${JSON.stringify(bodyExample)}'`] : [])].join(' \\\n');
  const javascriptOptions = [
    `  method: '${upperMethod}',`,
    `  headers: {`,
    `    Authorization: 'Bearer API_TOKEN',`,
    ...(bodyType ? [`    'Content-Type': '${bodyType}',`] : []),
    `  },`,
    ...(json ? [`  body: JSON.stringify(${json.replace(/\n/g, '\n  ')}),`] : []),
  ];
  const javascript = [`const response = await fetch('${requestUrl}', {`, ...javascriptOptions, `});`, ``, `const data = await response.json();`].join('\n');
  const python = [
    ...(json ? [`import json`] : []),
    `import requests`,
    ``,
    `response = requests.request(`,
    `    '${upperMethod}',`,
    `    '${requestUrl}',`,
    `    headers={'Authorization': 'Bearer API_TOKEN'${bodyType ? `, 'Content-Type': '${bodyType}'` : ''}},`,
    ...(json ? [`    json=json.loads('''${json}'''),`] : []),
    `)`,
    `response.raise_for_status()`,
    `data = response.json()`,
  ].join('\n');
  const goImports = bodyType ? [`    "bytes"`, `    "fmt"`, `    "io"`, `    "net/http"`] : [`    "fmt"`, `    "io"`, `    "net/http"`];
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
    `    req.Header.Set("Authorization", "Bearer API_TOKEN")`,
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

async function highlightedSamples(samples: ReturnType<typeof requestSamples>): Promise<ApiCodeSample[]> {
  return Promise.all(samples.map(async (sample) => ({
    id: sample.id,
    label: sample.label,
    code: sample.code,
    highlighted: await highlight(sample.code, { lang: sample.language, themes: { light: 'github-light', dark: 'github-dark' } }),
  })));
}

export async function ApiOperation({ value, children }: { value: string; children: ReactNode }) {
  const data = getApiOperation(value);
  if (!data) return <>{children}</>;
  const { document, method, displayPath, baseUrl, path, pathItem, operation } = data;
  const parameters = [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])].map((item: JsonObject) => resolveSchema(document, item) ?? item);
  const bodyContent = operation.requestBody?.content as Record<string, JsonObject> | undefined;
  const bodyType = bodyContent ? Object.keys(bodyContent)[0] : undefined;
  const bodySchema = bodyType ? bodyContent?.[bodyType]?.schema : undefined;
  const responseEntries = Object.entries<JsonObject>(operation.responses ?? {});
  const successResponse = responseEntries.find(([code]) => /^2/.test(code)) ?? responseEntries[0];
  const responseType = successResponse ? Object.keys(successResponse[1].content ?? {})[0] : undefined;
  const responseSchema = responseType && successResponse ? successResponse[1].content?.[responseType]?.schema : undefined;
  const concretePath = displayPath.replace(/\{([^}]+)\}/g, (_, name) => name.toUpperCase().replace(/-/g, '_'));
  const requestUrl = baseUrl ? new URL(path.replace(/^\//, '').replace(/\{([^}]+)\}/g, (_, name) => name.toUpperCase().replace(/-/g, '_')), baseUrl).toString() : concretePath;
  const bodyExample = bodyType ? schemaExample(document, bodySchema) : undefined;
  const responseExample = JSON.stringify(schemaExample(document, responseSchema), null, 2);
  const requestCodeSamples = await highlightedSamples(requestSamples(method, requestUrl, bodyType, bodyExample));
  const responseCodeSample: ApiCodeSample = {
    id: 'json',
    label: 'JSON',
    code: responseExample,
    highlighted: await highlight(responseExample, { lang: 'json', themes: { light: 'github-light', dark: 'github-dark' } }),
  };
  const parameterRows: SchemaRow[] = parameters.map((parameter: JsonObject) => ({
    key: `${parameter.in}-${parameter.name}`,
    name: parameter.name,
    field: parameter.schema ?? {},
    description: parameter.description,
    required: Boolean(parameter.required),
    depth: 0,
    location: parameter.in,
    hasChildren: Boolean(nestedSchema(document, parameter.schema)),
  }));
  const bodyRows = schemaRows(document, bodySchema, resolveSchema(document, bodySchema)?.required);
  const responseRows = schemaRows(document, responseSchema, resolveSchema(document, responseSchema)?.required);

  return <div className="api-operation">
    <div className="endpoint-bar"><span className={`endpoint-method method-${method}`}>{method.toUpperCase()}</span><code>{displayPath}</code><CopyButton value={displayPath} label="" /></div>
    {operation.description && <p className="endpoint-description"><PlainMarkdown value={operation.description} /></p>}
    {children}
    {parameters.length > 0 && <section className="api-section" id="parameters"><h2>Parameters <a href="#parameters">#</a></h2><SchemaTable document={document} rows={parameterRows} label="Request parameters" /></section>}
    {bodyContent && <section className="api-section" id="body"><h2>Body <a href="#body">#</a></h2><p className="api-section-copy"><PlainMarkdown value={resolveSchema(document, bodySchema)?.description ?? operation.requestBody?.description} /></p><div className="media-types">{Object.keys(bodyContent).map((type) => <code key={type}>{type}</code>)}</div><SchemaTable document={document} rows={bodyRows} label="Request body schema" /></section>}
    <section className="api-section" id="example"><h2>Example request <a href="#example">#</a></h2><ApiCodeBlock samples={requestCodeSamples} /></section>
    {responseEntries.length > 0 && <section className="api-section" id="response"><h2>Response <a href="#response">#</a></h2>{responseEntries.map(([code, response]) => <div className="api-response" key={code}><div><span className={/^2/.test(code) ? 'status-dot success' : 'status-dot error'} /><code>{code}</code><span>{response.description}</span></div>{response.content && <small>{Object.keys(response.content).join(', ')}</small>}</div>)}{responseSchema && <><SchemaTable document={document} rows={responseRows} label="Response schema" /><ApiCodeBlock samples={[responseCodeSample]} label={`${successResponse?.[0]} response`} /></>}</section>}
  </div>;
}
