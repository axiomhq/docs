import { describe, expect, it } from 'vitest';
import v1 from '@/content/docs/(api-reference)/restapi/versions/v1.json';
import v2 from '@/content/docs/(api-reference)/restapi/versions/v2.json';
import edgeHec from '@/content/docs/(api-reference)/restapi/versions/v1-edge-hec.json';
import edgeIngest from '@/content/docs/(api-reference)/restapi/versions/v1-edge-ingest.json';
import edgeQuery from '@/content/docs/(api-reference)/restapi/versions/v1-edge-query.json';
import { apiOperationMarkdown } from '@/lib/openapi-markdown';

const METHODS = ['get', 'post', 'put', 'patch', 'delete'];

describe('apiOperationMarkdown', () => {
  const createDashboard = apiOperationMarkdown('v2 post /dashboards', 'Page prose.')!;

  it('starts with the request line, description, and page prose', () => {
    expect(createDashboard.startsWith('```http\nPOST https://api.axiom.co/v2/dashboards\n```')).toBe(true);
    expect(createDashboard.indexOf('Create a dashboard from a dashboard document payload.')).toBeLessThan(
      createDashboard.indexOf('Page prose.'),
    );
    expect(createDashboard).toContain('## Authentication\n\nAuthenticate using an API token');
  });

  it('documents the request body down to referenced schemas', () => {
    expect(createDashboard).toContain('## Request body\n\nContent type: `application/json` (required)');
    expect(createDashboard).toContain('- `dashboard` (`DashboardDocument`; required)');
    expect(createDashboard).toContain('### DashboardDocument\n\nSame as `Dashboard`.');
    expect(createDashboard).toContain('- `sections` (array of `Section`; items ≤ 1000)');
    expect(createDashboard).toContain('- `title` (string; length 1–200; required)');
    expect(createDashboard).toContain('- `sectionId` (string (uuid))');
  });

  it('keeps the descriptions of schemas folded into a field type', () => {
    expect(createDashboard).toMatch(/- `owner` \(string; required\): User ID of the dashboard owner\./);
  });

  it('names the tag that selects a union variant', () => {
    expect(createDashboard).toContain('One of the following, selected by `type`:');
    expect(createDashboard).toContain('- `TimeSeriesChart` (`type`: `"TimeSeries"`)');
  });

  it('defines each referenced schema once', () => {
    const headings = createDashboard.match(/^### [A-Za-z]+$/gm) ?? [];
    expect(new Set(headings).size).toBe(headings.length);
    for (const name of createDashboard.matchAll(/`([A-Z][A-Za-z]+)`/g)) {
      if (createDashboard.includes(`(\`${name[1]}\``) || createDashboard.includes(`of \`${name[1]}\``)) {
        expect(headings).toContain(`### ${name[1]}`);
      }
    }
  });

  it('keeps multi-line descriptions inside their list item', () => {
    expect(apiOperationMarkdown('v2 get /apl-starred-queries')).toContain(
      '- `who` (query; string): - If the value of `who` is your own user ID, the request returns queries saved by the authenticated user.\n  - If the value',
    );
  });

  it('lists parameters with their location', () => {
    expect(apiOperationMarkdown('v1 post /datasets/{dataset_name}/ingest')).toMatch(
      /- `dataset_name` \(path; string; required\)/,
    );
  });

  it('keeps server placeholders and non-bearer authentication', () => {
    const hec = apiOperationMarkdown('v1-edge-hec post /services/collector/event')!;
    expect(hec).toContain('POST https://hec.{axiom-domain}/services/collector/event');
    expect(hec).toContain('Splunk');
  });

  it('renders every operation in the checked-in specs', () => {
    const specs = { v1, v2, 'v1-edge-hec': edgeHec, 'v1-edge-ingest': edgeIngest, 'v1-edge-query': edgeQuery };
    for (const [id, spec] of Object.entries(specs)) {
      for (const [path, item] of Object.entries<Record<string, unknown>>(spec.paths)) {
        for (const method of METHODS.filter((name) => item[name])) {
          const markdown = apiOperationMarkdown(`${id} ${method} ${path}`);
          expect(markdown, `${id} ${method} ${path}`).toBeDefined();
          expect(markdown, `${id} ${method} ${path}`).not.toMatch(/\(undefined|; undefined|\[object Object\]/);
        }
      }
    }
  });

  it('returns nothing for unknown operations', () => {
    expect(apiOperationMarkdown('v2 get /missing')).toBeUndefined();
  });
});
