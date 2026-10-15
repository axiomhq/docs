import { getApiOperation, operationRequiresAuth, resolveSchema } from '@/lib/openapi';

// OpenAPI documents are heterogeneous recursive JSON objects.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonObject = Record<string, any>;

const SCHEMA_PREFIX = '#/components/schemas/';
const MAX_INLINE_DEPTH = 6;

/**
 * Renders the schemas of one operation as Markdown. Named schemas are listed
 * once under "Schemas" and referenced by name everywhere else.
 */
class SchemaWriter {
  private readonly pending: string[] = [];
  private readonly queued = new Set<string>();

  constructor(private readonly document: JsonObject) {}

  private component(name: string): JsonObject | undefined {
    return this.document.components?.schemas?.[name];
  }

  /** Scalars and enums read better inline than as a separate definition. */
  private isSimple(schema: JsonObject | undefined): boolean {
    if (!schema || schema.$ref) return false;
    if (schema.properties || schema.oneOf || schema.anyOf || schema.allOf) return false;
    if (schema.type === 'object' || schema.type === 'array') return false;
    return true;
  }

  private reference(name: string): string {
    const target = this.component(name);
    if (this.isSimple(target)) return this.inlineType(target!);
    if (!this.queued.has(name)) {
      this.queued.add(name);
      this.pending.push(name);
    }
    return `\`${name}\``;
  }

  inlineType(schema: JsonObject): string {
    if (typeof schema.$ref === 'string') {
      return schema.$ref.startsWith(SCHEMA_PREFIX)
        ? this.reference(schema.$ref.slice(SCHEMA_PREFIX.length))
        : this.inlineType(resolveSchema(this.document, schema) ?? {});
    }
    const variants = schema.oneOf ?? schema.anyOf;
    let type: string;
    if (Array.isArray(variants)) {
      type = `one of ${variants.map((variant: JsonObject) => this.inlineType(variant)).join(', ')}`;
    } else if (Array.isArray(schema.allOf)) {
      type = `all of ${schema.allOf.map((part: JsonObject) => this.inlineType(part)).join(', ')}`;
    } else if (schema.type === 'array') {
      type = `array of ${schema.items ? this.inlineType(schema.items) : 'any'}`;
    } else if (schema.type === 'object' && !schema.properties && typeof schema.additionalProperties === 'object') {
      type = `map of string to ${this.inlineType(schema.additionalProperties)}`;
    } else {
      type = schema.type ?? (schema.properties ? 'object' : 'any');
      if (schema.format) type += ` (${schema.format})`;
    }
    const facts = constraints(schema);
    return facts.length > 0 ? `${type}; ${facts.join('; ')}` : type;
  }

  /** Description of a simple named schema, which `inlineType` folds into its user. */
  private inlinedDescription(schema: JsonObject): string | undefined {
    if (typeof schema.$ref !== 'string' || !schema.$ref.startsWith(SCHEMA_PREFIX)) return;
    const target = this.component(schema.$ref.slice(SCHEMA_PREFIX.length));
    return this.isSimple(target) ? target?.description : undefined;
  }

  /** Bullet lines describing an object's properties, nested for anonymous objects. */
  fields(schema: JsonObject | undefined, indent = '', depth = 0): string[] {
    const resolved = schema?.$ref && !schema.$ref.startsWith(SCHEMA_PREFIX) ? resolveSchema(this.document, schema) : schema;
    if (!resolved?.properties || depth > MAX_INLINE_DEPTH) return [];
    const required: string[] = resolved.required ?? [];
    return Object.entries<JsonObject>(resolved.properties).flatMap(([name, property]) => {
      const nested = !property.$ref && (property.properties || property.items?.properties);
      const type = nested ? (property.type === 'array' ? 'array of object' : 'object') : this.inlineType(property);
      const facts = nested ? constraints(property) : [];
      const label = [type, ...facts, ...(required.includes(name) ? ['required'] : [])].join('; ');
      const text = property.description ?? this.inlinedDescription(property);
      const description = text ? `: ${itemText(text, indent)}` : '';
      return [
        `${indent}- \`${name}\` (${label})${description}`,
        ...(nested ? this.fields(property.properties ? property : property.items, `${indent}  `, depth + 1) : []),
      ];
    });
  }

  /** A body or response schema: its fields when it's an object, otherwise its type. */
  body(schema: JsonObject): string[] {
    const named = typeof schema.$ref === 'string' && schema.$ref.startsWith(SCHEMA_PREFIX);
    const target = named ? this.component(schema.$ref.slice(SCHEMA_PREFIX.length)) : schema;
    if (target?.properties && !target.$ref) {
      return [...(target.description ? [target.description.trim(), ''] : []), ...this.fields(target)];
    }
    return [`Type: ${this.inlineType(schema)}`];
  }

  /** Definitions of every named schema referenced so far, including transitive ones. */
  definitions(): string[] {
    const lines: string[] = [];
    for (let index = 0; index < this.pending.length; index++) {
      const name = this.pending[index]!;
      lines.push('', `### ${name}`, '', ...this.definition(this.component(name) ?? {}));
    }
    return lines;
  }

  private definition(schema: JsonObject): string[] {
    const lines: string[] = [];
    if (schema.description) lines.push(schema.description.trim(), '');
    // OpenAPI 3.0 ignores keywords beside $ref, so an aliased component is its target.
    if (typeof schema.$ref === 'string') return [...lines, `Same as ${this.inlineType({ $ref: schema.$ref })}.`];

    const variants: JsonObject[] | undefined = schema.oneOf ?? schema.anyOf;
    if (variants) {
      const tag = discriminator(this.document, variants);
      lines.push(tag ? `One of the following, selected by \`${tag}\`:` : 'One of the following:', '');
      lines.push(
        ...variants.map((variant) => {
          const value = tag && resolveSchema(this.document, variant)?.properties?.[tag]?.enum?.[0];
          return `- ${this.inlineType(variant)}${tag ? ` (\`${tag}\`: \`${JSON.stringify(value)}\`)` : ''}`;
        }),
      );
      return lines;
    }
    if (schema.allOf) {
      lines.push('All of the following:', '');
      for (const part of schema.allOf as JsonObject[]) {
        lines.push(part.properties ? '- Object with:' : `- ${this.inlineType(part)}`, ...this.fields(part, '  '));
      }
      return lines;
    }
    if (schema.properties) {
      const facts = constraints(schema);
      lines.push(`Object${schema.additionalProperties === false ? '. Other fields aren\'t allowed' : ''}${facts.length ? `; ${facts.join('; ')}` : ''}.`, '');
      return [...lines, ...this.fields(schema)];
    }
    return [...lines, `Type: ${this.inlineType(schema)}`];
  }
}

function oneLine(text: string): string {
  return text.trim().replace(/\s*\n\s*/g, ' ');
}

/** Description text continuing a list item, keeping its own lists and paragraphs. */
function itemText(text: string, indent: string): string {
  return text.trim().replace(/\n/g, `\n${indent}  `);
}

function constraints(schema: JsonObject): string[] {
  const facts: string[] = [];
  if (Array.isArray(schema.enum)) facts.push(`one of ${schema.enum.map((value: unknown) => `\`${JSON.stringify(value)}\``).join(', ')}`);
  if (schema.minLength !== undefined || schema.maxLength !== undefined) facts.push(`length ${range(schema.minLength, schema.maxLength)}`);
  if (schema.minimum !== undefined || schema.maximum !== undefined) {
    facts.push(`value ${range(schema.minimum, schema.maximum, schema.exclusiveMinimum === true, schema.exclusiveMaximum === true)}`);
  }
  if (schema.minItems !== undefined || schema.maxItems !== undefined) facts.push(`items ${range(schema.minItems, schema.maxItems)}`);
  // Formats such as uuid already say what a regex would spell out.
  if (schema.pattern && !schema.format) facts.push(`pattern \`${schema.pattern}\``);
  if (schema.default !== undefined) facts.push(`default \`${JSON.stringify(schema.default)}\``);
  if (schema.nullable) facts.push('nullable');
  if (schema.readOnly) facts.push('read-only');
  if (schema.deprecated) facts.push('deprecated');
  return facts;
}

function range(min: number | undefined, max: number | undefined, exclusiveMin = false, exclusiveMax = false): string {
  if (min !== undefined && max !== undefined && !exclusiveMin && !exclusiveMax) return `${min}–${max}`;
  return [
    ...(min !== undefined ? [`${exclusiveMin ? '>' : '≥'} ${min}`] : []),
    ...(max !== undefined ? [`${exclusiveMax ? '<' : '≤'} ${max}`] : []),
  ].join(', ');
}

/** The property whose single enum value tells the variants of a union apart. */
function discriminator(document: JsonObject, variants: JsonObject[]): string | undefined {
  const targets = variants.map((variant) => resolveSchema(document, variant));
  if (targets.some((target) => !target?.properties)) return;
  return Object.keys(targets[0]!.properties).find((name) => {
    const values = targets.map((target) => target!.properties[name]?.enum);
    return values.every((value) => Array.isArray(value) && value.length === 1) && new Set(values.map((value) => value[0])).size === values.length;
  });
}

function authentication(document: JsonObject, operation: JsonObject): string[] {
  if (!operationRequiresAuth(document, operation)) return ['No authentication required.'];
  const requirements: JsonObject[] = operation.security ?? document.security ?? [];
  const schemes = document.components?.securitySchemes ?? {};
  const descriptions = [...new Set(requirements.flatMap((requirement) => Object.keys(requirement)))]
    .map((name) => schemes[name]?.description)
    .filter(Boolean)
    .map(oneLine);
  return descriptions.length > 0 ? descriptions : ['Send an API token in the `Authorization: Bearer API_TOKEN` header.'];
}

/**
 * Markdown reference for one API operation, for the `.md` and llms-full.txt
 * surfaces. `prose` is the page's own content, placed after the description.
 */
export function apiOperationMarkdown(value: string, prose = ''): string | undefined {
  const data = getApiOperation(value);
  if (!data) return;
  const { document, method, pathItem, operation } = data;
  const writer = new SchemaWriter(document);
  const url = data.baseUrl ? `${data.baseUrl.replace(/\/$/, '')}${data.path}` : data.displayPath;
  const lines = ['```http', `${method.toUpperCase()} ${url}`, '```'];
  if (operation.description) lines.push('', operation.description.trim());
  if (prose.trim()) lines.push('', prose.trim());

  const serverVariables = Object.entries<JsonObject>(document.servers?.[0]?.variables ?? {});
  if (serverVariables.length > 0) {
    lines.push('', ...serverVariables.map(([name, variable]) => `\`{${name}}\`: ${oneLine(variable.description ?? '')}`.trim()));
  }

  lines.push('', '## Authentication', '', ...authentication(document, operation));

  const parameters: JsonObject[] = [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])].map(
    (parameter) => resolveSchema(document, parameter) ?? parameter,
  );
  if (parameters.length > 0) {
    lines.push('', '## Parameters', '');
    for (const parameter of parameters) {
      const label = [parameter.in, parameter.schema ? writer.inlineType(parameter.schema) : 'string', ...(parameter.required ? ['required'] : [])].join('; ');
      lines.push(`- \`${parameter.name}\` (${label})${parameter.description ? `: ${itemText(parameter.description, '')}` : ''}`);
    }
  }

  const requestBody = resolveSchema(document, operation.requestBody);
  const bodyEntries = Object.entries<JsonObject>(requestBody?.content ?? {});
  if (bodyEntries.length > 0) {
    lines.push('', '## Request body', '');
    if (requestBody?.description) lines.push(requestBody.description.trim(), '');
    for (const [contentType, content] of bodyEntries) {
      lines.push(`Content type: \`${contentType}\`${requestBody?.required ? ' (required)' : ''}`, '');
      if (content.schema) lines.push(...writer.body(content.schema));
    }
  }

  const responses = Object.entries<JsonObject>(operation.responses ?? {});
  if (responses.length > 0) {
    lines.push('', '## Responses');
    for (const [code, reference] of responses) {
      const response = resolveSchema(document, reference) ?? reference;
      lines.push('', `### ${code}${response.description ? `: ${oneLine(response.description)}` : ''}`);
      for (const [contentType, content] of Object.entries<JsonObject>(response.content ?? {})) {
        lines.push('', `Content type: \`${contentType}\``);
        if (content.schema) lines.push('', ...writer.body(content.schema));
      }
    }
  }

  const definitions = writer.definitions();
  if (definitions.length > 0) lines.push('', '## Schemas', ...definitions);
  return lines.join('\n');
}
