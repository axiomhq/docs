import { describe, expect, it } from 'vitest';
import { componentJsonSchema } from '@/lib/json-schema';
import { DASHBOARD_SCHEMA_URL, dashboardJsonSchema } from '@/lib/published-schemas';

function refs(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(refs);
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) =>
    key === '$ref' && typeof child === 'string' ? [child] : refs(child),
  );
}

describe('componentJsonSchema', () => {
  const document = {
    components: {
      schemas: {
        Root: {
          type: 'object',
          properties: {
            nullable: { type: 'string', nullable: true, example: 'a' },
            count: { type: 'integer', minimum: 0, exclusiveMinimum: true },
            item: { $ref: '#/components/schemas/Item' },
            nullableChoice: { oneOf: [{ type: 'string' }, { type: 'number' }], nullable: true },
          },
        },
        Item: {
          oneOf: [{ $ref: '#/components/schemas/A' }, { $ref: '#/components/schemas/B' }],
        },
        A: { type: 'object', required: ['kind'], properties: { kind: { type: 'string', enum: ['a'] } } },
        B: { type: 'object', required: ['kind'], properties: { kind: { type: 'string', enum: ['b'] } } },
        Unused: { type: 'string' },
      },
    },
  };
  const schema = componentJsonSchema(document, 'Root', { id: 'https://example.com/root.json', title: 'Root', description: 'Root' });

  it('includes only the referenced components and rewrites references', () => {
    expect(Object.keys(schema.$defs).sort()).toEqual(['A', 'B', 'Item', 'Root']);
    expect(schema.$ref).toBe('#/$defs/Root');
    expect(schema.$defs.Root.properties.item).toEqual({ $ref: '#/$defs/Item' });
  });

  it('converts OpenAPI 3.0 keywords to JSON Schema 2020-12', () => {
    const { properties } = schema.$defs.Root;
    expect(properties.nullable).toEqual({ type: ['string', 'null'], examples: ['a'] });
    expect(properties.count).toEqual({ type: 'integer', exclusiveMinimum: 0 });
    expect(properties.nullableChoice).toEqual({
      anyOf: [{ oneOf: [{ type: 'string' }, { type: 'number' }] }, { type: 'null' }],
    });
  });

  it('turns a oneOf of tagged objects into if/then branches on the tag', () => {
    expect(schema.$defs.Item).toEqual({
      type: 'object',
      required: ['kind'],
      properties: { kind: { enum: ['a', 'b'] } },
      allOf: [
        { if: { properties: { kind: { const: 'a' } } }, then: { $ref: '#/$defs/A' } },
        { if: { properties: { kind: { const: 'b' } } }, then: { $ref: '#/$defs/B' } },
      ],
    });
  });
});

describe('dashboardJsonSchema', () => {
  const schema = dashboardJsonSchema();
  const serialized = JSON.stringify(schema);

  it('is a self-contained draft 2020-12 schema', () => {
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(schema.$id).toBe(DASHBOARD_SCHEMA_URL);
    for (const ref of refs(schema)) {
      expect(ref).toMatch(/^#\/\$defs\//);
      expect(schema.$defs[ref.slice('#/$defs/'.length)]).toBeDefined();
    }
    expect(serialized).not.toContain('"nullable"');
  });

  it('describes sections and chart section membership', () => {
    expect(schema.$defs.Section.required).toEqual(['id', 'title']);
    expect(Object.keys(schema.$defs.Section.properties)).toEqual(['id', 'title', 'defaultCollapsed']);
    expect(schema.$defs.TimeSeriesChart.properties.sectionId).toEqual({ $ref: '#/$defs/SectionId' });
  });

  it('selects the chart definition by chart type', () => {
    const chart = schema.$defs.Chart;
    expect(chart.required).toEqual(['type']);
    expect(chart.properties.type.enum).toContain('TimeSeries');
    expect(chart.allOf).toContainEqual({
      if: { properties: { type: { const: 'TimeSeries' } } },
      then: { $ref: '#/$defs/TimeSeriesChart' },
    });
  });
});
