// OpenAPI documents are heterogeneous recursive JSON objects.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonObject = Record<string, any>;

const COMPONENT_PREFIX = '#/components/schemas/';

// Keywords whose values are data rather than subschemas.
const LITERAL_KEYWORDS = new Set(['enum', 'const', 'default', 'examples', 'required']);

export type JsonSchemaOptions = {
  id: string;
  title: string;
  description: string;
};

function componentName(ref: string): string | undefined {
  return ref.startsWith(COMPONENT_PREFIX) ? ref.slice(COMPONENT_PREFIX.length) : undefined;
}

function collectRefs(value: unknown, names: Set<string>) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectRefs(item, names));
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (key === '$ref' && typeof child === 'string') {
        const name = componentName(child);
        if (name) names.add(name);
      } else {
        collectRefs(child, names);
      }
    }
  }
}

/** Component schemas reachable from `root`, including `root`. */
export function schemaClosure(document: JsonObject, root: string): string[] {
  const schemas: JsonObject = document.components?.schemas ?? {};
  const seen = new Set<string>();
  const pending = [root];
  while (pending.length > 0) {
    const name = pending.pop()!;
    if (seen.has(name)) continue;
    if (!schemas[name]) throw new Error(`Missing OpenAPI component schema: ${name}`);
    seen.add(name);
    const refs = new Set<string>();
    collectRefs(schemas[name], refs);
    pending.push(...refs);
  }
  return [...seen].sort();
}

function withNull(schema: JsonObject): JsonObject {
  if (typeof schema.type === 'string') {
    const nullable: JsonObject = { ...schema, type: [schema.type, 'null'] };
    if (Array.isArray(schema.enum) && !schema.enum.includes(null)) nullable.enum = [...schema.enum, null];
    return nullable;
  }
  return { anyOf: [schema, { type: 'null' }] };
}

/** Converts an OpenAPI 3.0 schema object to JSON Schema 2020-12. */
function convert(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(convert);
  if (!value || typeof value !== 'object') return value;

  const input = value as JsonObject;
  const output: JsonObject = {};
  for (const [key, child] of Object.entries(input)) {
    if (key.startsWith('x-') || key === 'nullable' || key === 'example') continue;
    if (key === 'exclusiveMinimum' || key === 'exclusiveMaximum') continue;
    if (key === '$ref' && typeof child === 'string') {
      const name = componentName(child);
      output.$ref = name ? `#/$defs/${name}` : child;
    } else if (LITERAL_KEYWORDS.has(key)) {
      output[key] = child;
    } else if (key === 'properties' || key === 'patternProperties') {
      output[key] = Object.fromEntries(Object.entries<unknown>(child).map(([name, schema]) => [name, convert(schema)]));
    } else {
      output[key] = convert(child);
    }
  }

  // OpenAPI 3.0 spells exclusive bounds as booleans beside minimum/maximum.
  if (input.exclusiveMinimum === true && typeof input.minimum === 'number') {
    delete output.minimum;
    output.exclusiveMinimum = input.minimum;
  }
  if (input.exclusiveMaximum === true && typeof input.maximum === 'number') {
    delete output.maximum;
    output.exclusiveMaximum = input.maximum;
  }
  if (input.example !== undefined && output.examples === undefined) output.examples = [input.example];

  return input.nullable === true ? withNull(output) : output;
}

function singleEnumValue(schema: JsonObject | undefined): unknown {
  return Array.isArray(schema?.enum) && schema.enum.length === 1 ? schema.enum[0] : undefined;
}

/**
 * Rewrites a `oneOf` of object `$ref`s that share a single-valued enum property
 * (such as chart `type`) into `if`/`then` branches. Validators then report the
 * errors of the matching variant instead of every failed alternative.
 */
function discriminate(schema: JsonObject, defs: JsonObject): JsonObject {
  const variants: JsonObject[] = schema.oneOf;
  const targets = variants.map((variant) =>
    typeof variant.$ref === 'string' ? defs[variant.$ref.replace('#/$defs/', '')] : undefined,
  );
  if (targets.some((target) => !target?.properties)) return schema;

  const candidates = Object.keys(targets[0]!.properties).filter((name) =>
    targets.every((target) => target!.required?.includes(name) && singleEnumValue(target!.properties[name]) !== undefined),
  );
  for (const property of candidates) {
    const values = targets.map((target) => singleEnumValue(target!.properties[property]));
    if (new Set(values).size !== values.length) continue;

    const rest = { ...schema };
    delete rest.oneOf;
    return {
      ...rest,
      type: 'object',
      required: [property],
      properties: { [property]: { enum: values } },
      allOf: variants.map((variant, index) => ({
        if: { properties: { [property]: { const: values[index] } } },
        then: { $ref: variant.$ref },
      })),
    };
  }
  return schema;
}

/**
 * Builds a standalone JSON Schema (draft 2020-12) for one OpenAPI component and
 * every component it references, so clients can validate without the full spec.
 */
export function componentJsonSchema(document: JsonObject, root: string, options: JsonSchemaOptions): JsonObject {
  const schemas: JsonObject = document.components?.schemas ?? {};
  const $defs: JsonObject = Object.fromEntries(
    schemaClosure(document, root).map((name) => [name, convert(schemas[name])]),
  );
  for (const [name, schema] of Object.entries<JsonObject>($defs)) {
    if (Array.isArray(schema.oneOf)) $defs[name] = discriminate(schema, $defs);
  }
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: options.id,
    title: options.title,
    description: options.description,
    $ref: `#/$defs/${root}`,
    $defs,
  };
}
