import type { ReactNode } from 'react';
import { CopyButton } from './copy-button';
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

function SchemaRows({ document, schema: input, required = [], depth = 0 }: { document: JsonObject; schema?: JsonObject; required?: string[]; depth?: number }) {
  const schema = resolveSchema(document, input);
  if (!schema || depth > 2) return null;
  return <>{Object.entries<JsonObject>(schema.properties ?? {}).map(([name, field]) => {
    const resolved = resolveSchema(document, field);
    return <div className="api-param-row" key={name}>
      <div className="api-param-name" style={{ paddingLeft: depth * 12 }}><code>{name}</code><div><span>{schemaType(document, field)}</span>{required.includes(name) && <b>Required</b>}</div></div>
      <div className="api-param-description"><PlainMarkdown value={resolved?.description} />{resolved?.properties && <SchemaRows document={document} schema={resolved} required={resolved.required} depth={depth + 1} />}</div>
    </div>;
  })}</>;
}

export function ApiOperation({ value, children }: { value: string; children: ReactNode }) {
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
  const curl = [`curl -X ${method.toUpperCase()} '${requestUrl}'`, `  -H 'Authorization: Bearer API_TOKEN'`, ...(bodyType ? [`  -H 'Content-Type: ${bodyType}'`, `  -d '${JSON.stringify(schemaExample(document, bodySchema))}'`] : [])].join(' \\\n');
  const responseExample = JSON.stringify(schemaExample(document, responseSchema), null, 2);

  return <div className="api-operation">
    <div className="endpoint-bar"><span className={`endpoint-method method-${method}`}>{method.toUpperCase()}</span><code>{displayPath}</code><CopyButton value={displayPath} label="" /></div>
    {operation.description && <p className="endpoint-description"><PlainMarkdown value={operation.description} /></p>}
    {children}
    {parameters.length > 0 && <section className="api-section" id="parameters"><h2>Parameters <a href="#parameters">#</a></h2>{parameters.map((parameter: JsonObject) => <div className="api-param-row" key={`${parameter.in}-${parameter.name}`}><div className="api-param-name"><code>{parameter.name}</code><div><span>{schemaType(document, parameter.schema)}</span>{parameter.required ? <b>Required</b> : <em>Optional</em>}</div><small>{parameter.in}</small></div><p className="api-param-description"><PlainMarkdown value={parameter.description} /></p></div>)}</section>}
    {bodyContent && <section className="api-section" id="body"><h2>Body <a href="#body">#</a></h2><p className="api-section-copy"><PlainMarkdown value={resolveSchema(document, bodySchema)?.description ?? operation.requestBody?.description} /></p><div className="media-types">{Object.keys(bodyContent).map((type) => <code key={type}>{type}</code>)}</div><SchemaRows document={document} schema={bodySchema} required={resolveSchema(document, bodySchema)?.required} /></section>}
    <section className="api-section" id="example"><h2>Example request <a href="#example">#</a></h2><div className="api-code"><div className="api-code-head"><span>cURL</span><CopyButton value={curl} /></div><pre><code>{curl}</code></pre></div></section>
    {responseEntries.length > 0 && <section className="api-section" id="response"><h2>Response <a href="#response">#</a></h2>{responseEntries.map(([code, response]) => <div className="api-response" key={code}><div><span className={/^2/.test(code) ? 'status-dot success' : 'status-dot error'} /><code>{code}</code><span>{response.description}</span></div>{response.content && <small>{Object.keys(response.content).join(', ')}</small>}</div>)}{responseSchema && <><SchemaRows document={document} schema={responseSchema} required={resolveSchema(document, responseSchema)?.required} /><div className="api-code"><div className="api-code-head"><span>{successResponse?.[0]} response</span><CopyButton value={responseExample} /></div><pre><code>{responseExample}</code></pre></div></>}</section>}
  </div>;
}
