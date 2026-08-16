import { highlight } from "fumadocs-core/highlight";
import { axiomCodeDark, axiomCodeLight } from "@/lib/code-theme";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { CopyButton } from "./copy-button";
import { HeadingAnchor } from "./heading-anchor";
import { ApiCodeBlock, type ApiCodeSample } from "./api-code-block";
import { ApiTryIt, type ApiTryItParameter } from "./api-try-it";
import {
  getApiOperation,
  resolveSchema,
  schemaExample,
} from "@/lib/openapi";

// OpenAPI documents are heterogeneous recursive JSON objects.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonObject = Record<string, any>;

function schemaType(
  document: JsonObject,
  input: JsonObject | undefined,
): string {
  const schema = resolveSchema(document, input);
  if (!schema) return "unknown";
  if (schema.type === "array")
    return `${schemaType(document, schema.items)}[]`;
  const type =
    schema.type ?? (schema.properties ? "object" : "unknown");
  return schema.format ? `${type}<${schema.format}>` : type;
}

// The dark palette sits at 1.9–2.5:1 on the light tints, so the light theme
// repoints to darker text values that clear AA (>=4.5:1) on the same tints.
const METHOD_COLORS: Record<string, string> = {
  get: "method-get text-[#34d399] bg-[rgba(16,185,129,.11)] [:root[data-theme=light]_&]:text-[#047857] [:root[data-theme=light]_&]:bg-[rgba(16,185,129,.12)]",
  post: "method-post text-[#60a5fa] bg-[rgba(59,130,246,.11)] [:root[data-theme=light]_&]:text-[#1d4ed8] [:root[data-theme=light]_&]:bg-[rgba(59,130,246,.12)]",
  put: "method-put text-[#fbbf24] bg-[rgba(245,158,11,.11)] [:root[data-theme=light]_&]:text-[#92400e] [:root[data-theme=light]_&]:bg-[rgba(245,158,11,.14)]",
  patch:
    "method-patch text-[#fbbf24] bg-[rgba(245,158,11,.11)] [:root[data-theme=light]_&]:text-[#92400e] [:root[data-theme=light]_&]:bg-[rgba(245,158,11,.14)]",
  delete:
    "method-delete text-[#f87171] bg-[rgba(239,68,68,.11)] [:root[data-theme=light]_&]:text-[#b91c1c] [:root[data-theme=light]_&]:bg-[rgba(239,68,68,.12)]",
};

function PlainMarkdown({
  value,
  codeClassName,
}: {
  value?: string;
  codeClassName?: string;
}) {
  if (!value) return null;
  const chunks = value.split(/(`[^`]+`)/g);
  return (
    <>
      {chunks.map((chunk, index) =>
        chunk.startsWith("`") && chunk.endsWith("`") ? (
          <code className={codeClassName} key={index}>
            {chunk.slice(1, -1)}
          </code>
        ) : (
          <span key={index}>{chunk}</span>
        ),
      )}
    </>
  );
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
  if (resolved?.type === "array") {
    const items = resolveSchema(document, resolved.items);
    if (items?.properties) return items;
  }
}

function schemaRows(
  document: JsonObject,
  input: JsonObject | undefined,
  required: string[] = [],
  depth = 0,
  parent = "",
): SchemaRow[] {
  const schema = resolveSchema(document, input);
  if (!schema || depth > 5) return [];
  if (schema.type === "array") {
    const items = resolveSchema(document, schema.items);
    return schemaRows(
      document,
      items,
      items?.required ?? [],
      depth,
      parent,
    );
  }
  return Object.entries<JsonObject>(schema.properties ?? {}).flatMap(
    ([name, field]) => {
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
        ...schemaRows(
          document,
          children,
          children?.required,
          depth + 1,
          key,
        ),
      ];
    },
  );
}

function SchemaTable({
  document,
  rows,
  label,
}: {
  document: JsonObject;
  rows: SchemaRow[];
  label: string;
}) {
  if (rows.length === 0) return null;
  const hasLocation = rows.some((row) => row.location);
  return (
    <div className="api-schema-wrap mt-[14px] overflow-x-auto border border-(--border-primary) rounded-md max-sm:-mr-2">
      {/* Corner cells carry the wrapper's inner radius — collapsed cell
          backgrounds paint square past an ancestor's rounded clip. */}
      <table
        className="api-schema-table w-full min-w-[620px] m-0! border-0! border-collapse table-fixed text-[13px]! [&_th:last-child]:border-r-0! [&_td:last-child]:border-r-0! [&_thead_th:first-child]:rounded-tl-[5px] [&_thead_th:last-child]:rounded-tr-[5px] [&_tbody_tr:last-child_td:first-child]:rounded-bl-[5px] [&_tbody_tr:last-child_td:last-child]:rounded-br-[5px]"
        data-has-location={hasLocation || undefined}
        aria-label={label}
      >
        <thead>
          <tr>
            <th
              className={cn(
                "py-2 px-2.5 border-t-0! border-l-0! border-r! border-r-(--border-primary)! border-b! border-b-(--border-primary)! text-(--text-secondary) bg-(--bg-inert) font-mono text-[13px] leading-[18px] font-normal text-left",
                hasLocation ? "w-[28%]" : "w-[30%]",
              )}
            >
              Property
            </th>
            <th
              className={cn(
                "py-2 px-2.5 border-t-0! border-l-0! border-r! border-r-(--border-primary)! border-b! border-b-(--border-primary)! text-(--text-secondary) bg-(--bg-inert) font-mono text-[13px] leading-[18px] font-normal text-left",
                hasLocation ? "w-[18%]" : "w-[25%]",
              )}
            >
              Type
            </th>
            {hasLocation && (
              <th className="py-2 px-2.5 border-t-0! border-l-0! border-r! border-r-(--border-primary)! border-b! border-b-(--border-primary)! text-(--text-secondary) bg-(--bg-inert) font-mono text-[13px] leading-[18px] font-normal text-left w-[14%]">
                Location
              </th>
            )}
            <th className="py-2 px-2.5 border-t-0! border-l-0! border-r! border-r-(--border-primary)! border-b! border-b-(--border-primary)! text-(--text-secondary) bg-(--bg-inert) font-mono text-[13px] leading-[18px] font-normal text-left">
              Description
            </th>
          </tr>
        </thead>
        <tbody className="[&>tr:last-child>td]:border-b-0!">
          {rows.map((row) => (
            <tr
              className={
                row.hasChildren
                  ? "api-schema-object-row [&>td]:bg-(--bg-inert)"
                  : undefined
              }
              data-depth={row.depth}
              key={row.key}
            >
              <td
                className="api-schema-name relative whitespace-nowrap py-[9px] px-2.5 border-t-0! border-l-0! border-r! border-r-(--border-tertiary)! border-b! border-b-(--border-tertiary)! align-top"
                style={{ paddingLeft: 10 + row.depth * 18 }}
              >
                {row.depth > 0 && (
                  <span
                    className="api-schema-branch mr-1.5 text-(--border-strong) font-mono text-[11px] leading-[14px] font-normal"
                    aria-hidden="true"
                  >
                    └
                  </span>
                )}
                <code className="p-0! border-0! bg-transparent! font-mono text-(--text-primary)! text-[13px]! font-[550]">
                  {row.name}
                </code>
              </td>
              <td className="api-schema-type whitespace-nowrap py-[9px] px-2.5 border-t-0! border-l-0! border-r! border-r-(--border-tertiary)! border-b! border-b-(--border-tertiary)! align-top">
                <code className="mr-[7px] p-0! border-0! bg-transparent! text-(--text-quaternary)! font-mono! text-[10px]! leading-[14px]! font-[450]! tracking-[.04em] uppercase">
                  {schemaType(document, row.field)}
                </code>
                {row.required && (
                  <b className="mr-[7px] text-(--color-warning-text)! font-mono! text-[10px]! leading-[14px]! font-[450]! tracking-[.04em] uppercase">
                    Required
                  </b>
                )}
              </td>
              {hasLocation && (
                <td className="api-schema-location py-[9px] px-2.5 border-t-0! border-l-0! border-r! border-r-(--border-tertiary)! border-b! border-b-(--border-tertiary)! align-top">
                  <code className="p-0! border-0! text-(--text-tertiary)! bg-transparent! font-mono! text-[10px]! leading-[14px]! font-medium! tracking-[.05em] uppercase">
                    {row.location}
                  </code>
                </td>
              )}
              <td className="api-schema-description text-(--text-secondary)! font-sans text-[13px] leading-[22px] font-normal py-[9px] px-2.5 border-t-0! border-l-0! border-r! border-r-(--border-tertiary)! border-b! border-b-(--border-tertiary)! align-top">
                <PlainMarkdown
                  value={row.description}
                  codeClassName="p-0! border-0! rounded-none! bg-transparent! font-mono text-[length:inherit]!"
                />
                {!row.description && (
                  <span aria-hidden="true">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function requestSamples(
  method: string,
  requestUrl: string,
  bodyType: string | undefined,
  bodyExample: unknown,
) {
  const upperMethod = method.toUpperCase();
  const json = bodyType
    ? JSON.stringify(bodyExample, null, 2)
    : undefined;
  const curl = [
    `curl -X ${upperMethod} '${requestUrl}'`,
    `  -H 'Authorization: Bearer API_TOKEN'`,
    ...(bodyType
      ? [
          `  -H 'Content-Type: ${bodyType}'`,
          `  -d '${JSON.stringify(bodyExample)}'`,
        ]
      : []),
  ].join(" \\\n");
  const javascriptOptions = [
    `  method: '${upperMethod}',`,
    `  headers: {`,
    `    Authorization: 'Bearer API_TOKEN',`,
    ...(bodyType ? [`    'Content-Type': '${bodyType}',`] : []),
    `  },`,
    ...(json
      ? [`  body: JSON.stringify(${json.replace(/\n/g, "\n  ")}),`]
      : []),
  ];
  const javascript = [
    `const response = await fetch('${requestUrl}', {`,
    ...javascriptOptions,
    `});`,
    ``,
    `const data = await response.json();`,
  ].join("\n");
  const python = [
    ...(json ? [`import json`] : []),
    `import requests`,
    ``,
    `response = requests.request(`,
    `    '${upperMethod}',`,
    `    '${requestUrl}',`,
    `    headers={'Authorization': 'Bearer API_TOKEN'${bodyType ? `, 'Content-Type': '${bodyType}'` : ""}},`,
    ...(json ? [`    json=json.loads('''${json}'''),`] : []),
    `)`,
    `response.raise_for_status()`,
    `data = response.json()`,
  ].join("\n");
  const goImports = bodyType
    ? [`    "bytes"`, `    "fmt"`, `    "io"`, `    "net/http"`]
    : [`    "fmt"`, `    "io"`, `    "net/http"`];
  const goBody = json ? `bytes.NewBufferString(\`${json}\`)` : "nil";
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
    ...(bodyType
      ? [`    req.Header.Set("Content-Type", "${bodyType}")`]
      : []),
    ``,
    `    res, err := http.DefaultClient.Do(req)`,
    `    if err != nil { panic(err) }`,
    `    defer res.Body.Close()`,
    ``,
    `    body, err := io.ReadAll(res.Body)`,
    `    if err != nil { panic(err) }`,
    `    fmt.Println(string(body))`,
    `}`,
  ].join("\n");

  return [
    { id: "curl", label: "cURL", language: "bash", code: curl },
    {
      id: "javascript",
      label: "JavaScript",
      language: "javascript",
      code: javascript,
    },
    {
      id: "python",
      label: "Python",
      language: "python",
      code: python,
    },
    { id: "go", label: "Go", language: "go", code: go },
  ];
}

async function highlightedSamples(
  samples: ReturnType<typeof requestSamples>,
): Promise<ApiCodeSample[]> {
  return Promise.all(
    samples.map(async (sample) => ({
      id: sample.id,
      label: sample.label,
      code: sample.code,
      // defaultColor: false keeps shiki from inlining the light hex as a literal
      // `color`, which would beat the .docs-code-block dark-theme CSS mapping.
      highlighted: await highlight(sample.code, {
        lang: sample.language,
        themes: { light: axiomCodeLight, dark: axiomCodeDark },
        defaultColor: false,
      }),
    })),
  );
}

export async function ApiOperation({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) {
  const data = getApiOperation(value);
  if (!data) return <>{children}</>;
  const {
    document,
    method,
    displayPath,
    baseUrl,
    path,
    pathItem,
    operation,
  } = data;
  const parameters = [
    ...(pathItem.parameters ?? []),
    ...(operation.parameters ?? []),
  ].map((item: JsonObject) => resolveSchema(document, item) ?? item);
  const bodyContent = operation.requestBody?.content as
    | Record<string, JsonObject>
    | undefined;
  const bodyType = bodyContent
    ? Object.keys(bodyContent)[0]
    : undefined;
  const bodySchema = bodyType
    ? bodyContent?.[bodyType]?.schema
    : undefined;
  const responseEntries = Object.entries<JsonObject>(
    operation.responses ?? {},
  );
  const successResponse =
    responseEntries.find(([code]) => /^2/.test(code)) ??
    responseEntries[0];
  const responseType = successResponse
    ? Object.keys(successResponse[1].content ?? {})[0]
    : undefined;
  const responseSchema =
    responseType && successResponse
      ? successResponse[1].content?.[responseType]?.schema
      : undefined;
  const concretePath = displayPath.replace(
    /\{([^}]+)\}/g,
    (_, name) => name.toUpperCase().replace(/-/g, "_"),
  );
  const requestUrl = baseUrl
    ? new URL(
        path
          .replace(/^\//, "")
          .replace(/\{([^}]+)\}/g, (_, name) =>
            name.toUpperCase().replace(/-/g, "_"),
          ),
        baseUrl,
      ).toString()
    : concretePath;
  const bodyExample = bodyType
    ? schemaExample(document, bodySchema)
    : undefined;
  const requestCodeSamples = await highlightedSamples(
    requestSamples(method, requestUrl, bodyType, bodyExample),
  );
  const parameterRows: SchemaRow[] = parameters.map(
    (parameter: JsonObject) => ({
      key: `${parameter.in}-${parameter.name}`,
      name: parameter.name,
      field: parameter.schema ?? {},
      description: parameter.description,
      required: Boolean(parameter.required),
      depth: 0,
      location: parameter.in,
      hasChildren: Boolean(nestedSchema(document, parameter.schema)),
    }),
  );
  const bodyRows = schemaRows(
    document,
    bodySchema,
    resolveSchema(document, bodySchema)?.required,
  );
  const responseRows = schemaRows(
    document,
    responseSchema,
    resolveSchema(document, responseSchema)?.required,
  );
  const tryParameters: ApiTryItParameter[] = parameters.map(
    (parameter: JsonObject) => ({
      name: parameter.name,
      location: parameter.in,
      required: Boolean(parameter.required),
      description: parameter.description,
      example:
        parameter.example ??
        parameter.schema?.example ??
        parameter.schema?.default,
    }),
  );
  const serverVariables = Object.entries<JsonObject>(
    document.servers?.[0]?.variables ?? {},
  ).map(([name, variable]) => ({
    name,
    required: true,
    description: variable.description,
    example: variable.default,
  }));

  return (
    <div className="api-operation">
      <div className="endpoint-bar my-4 min-h-[38px] py-1.5 pl-3 pr-1.5 flex items-center gap-2.5 border border-(--border-primary) rounded-md bg-(--bg-surface)">
        <span
          className={cn(
            "endpoint-method min-w-[34px] flex-none rounded-[3px] px-1 py-px text-center font-mono text-[10px] leading-[14px] font-normal tracking-[.02em]",
            METHOD_COLORS[method] ?? "method-" + method,
          )}
        >
          {method.toUpperCase()}
        </span>
        {/* `!` beats the prose inline-code chip styles this <code> sits inside. */}
        <code className="flex-1 overflow-x-auto text-(--text-primary) bg-transparent! border-0! font-mono! text-[13px]! leading-[18px]! font-[450]! whitespace-nowrap">
          {displayPath}
        </code>
        <CopyButton
          value={displayPath}
          label=""
          analytics={{ codeKind: "endpoint_path" }}
          className="h-6 w-6 p-0 flex-none justify-center rounded text-(--text-tertiary) active:scale-90 hover:text-(--text-primary) dark:hover:bg-[#232323]!"
        />
      </div>
      {operation.description && (
        <p className="endpoint-description mt-4 mb-6 text-(--text-tertiary) font-sans text-[16px] leading-[26px] font-normal">
          <PlainMarkdown value={operation.description} />
        </p>
      )}
      {children}
      {parameters.length > 0 && (
        <section className="api-section mt-11">
          <HeadingAnchor
            as="h2"
            id="parameters"
            className="m-0! p-0 border-0 text-(--text-primary) font-sans! text-[18px]! leading-6! font-semibold! tracking-[-.01em]"
          >
            Parameters
          </HeadingAnchor>
          <SchemaTable
            document={document}
            rows={parameterRows}
            label="Request parameters"
          />
        </section>
      )}
      {bodyContent && (
        <section className="api-section mt-11">
          <HeadingAnchor
            as="h2"
            id="body"
            className="m-0! p-0 border-0 text-(--text-primary) font-sans! text-[18px]! leading-6! font-semibold! tracking-[-.01em]"
          >
            Body
          </HeadingAnchor>
          <p className="api-section-copy mt-3 text-(--text-secondary) text-[15px] leading-[25px]">
            <PlainMarkdown
              value={
                resolveSchema(document, bodySchema)?.description ??
                operation.requestBody?.description
              }
              codeClassName="py-px px-1 border border-(--border-secondary) rounded-[3px] bg-(--bg-inert) font-mono"
            />
          </p>
          <div className="media-types mt-3 flex flex-wrap gap-1.5">
            {Object.keys(bodyContent).map((type) => (
              <code
                className="py-[3px] px-[7px] border border-(--border-primary) rounded-[3px] text-(--text-tertiary) bg-(--bg-inert) text-[10px]"
                key={type}
              >
                {type}
              </code>
            ))}
          </div>
          <SchemaTable
            document={document}
            rows={bodyRows}
            label="Request body schema"
          />
        </section>
      )}
      <section className="api-section mt-11">
        <HeadingAnchor
          as="h2"
          id="example"
          className="m-0! p-0 border-0 text-(--text-primary) font-sans! text-[18px]! leading-6! font-semibold! tracking-[-.01em]"
        >
          Request
        </HeadingAnchor>
        <ApiCodeBlock samples={requestCodeSamples} />
        <ApiTryIt
          operation={value}
          method={method}
          parameters={tryParameters}
          serverVariables={serverVariables}
          bodyType={bodyType}
          bodyExample={bodyExample}
        />
      </section>
      {responseEntries.length > 0 && (
        <section className="api-section mt-11">
          <HeadingAnchor
            as="h2"
            id="response"
            className="m-0! p-0 border-0 text-(--text-primary) font-sans! text-[18px]! leading-6! font-semibold! tracking-[-.01em]"
          >
            Response
          </HeadingAnchor>
          {responseEntries.map(([code, response], index) => (
            <div
              className={cn(
                "api-response min-h-[43px] py-2.5 px-1 flex items-start gap-3 border-b border-b-(--border-tertiary) max-sm:flex-col",
                index === responseEntries.length - 1 && "border-b-0!",
              )}
              key={code}
            >
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    /^2/.test(code)
                      ? "status-dot success bg-(--green-500)"
                      : "status-dot error bg-(--red-400)",
                    "size-2 mt-[5px] flex-none inline-block rounded-[999px] text-(--text-tertiary) text-[12px]",
                  )}
                />
                <code className="p-0! border-0! bg-transparent! text-(--text-secondary)!">
                  {code}
                </code>
                <span className="text-(--text-tertiary) text-[12px]">
                  {response.description}
                </span>
              </div>
              {response.content && (
                <small className="ml-auto text-(--text-quaternary) font-mono text-[10px] leading-[14px] font-[450] uppercase max-sm:ml-4">
                  {Object.keys(response.content).join(", ")}
                </small>
              )}
            </div>
          ))}
          {responseSchema && (
            <SchemaTable
              document={document}
              rows={responseRows}
              label="Response schema"
            />
          )}
        </section>
      )}
    </div>
  );
}
