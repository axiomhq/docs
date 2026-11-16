import { afterEach, describe, expect, it } from 'vitest';
import {
  getPlaceholderSnapshot,
  normalizeDatasetName,
  normalizeEdgeDomain,
  parsePlaceholderSnapshot,
  placeholderStorageKey,
  readPrefillValues,
  setPlaceholderValues,
  withoutPrefillParams,
} from '@/lib/placeholder-values';

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('normalizeEdgeDomain', () => {
  it.each([
    ['us-east-1.aws.edge.axiom.co', 'us-east-1.aws.edge.axiom.co'],
    ['EU-Central-1.AWS.edge.axiom.co', 'eu-central-1.aws.edge.axiom.co'],
    ['https://us-east-1.aws.edge.axiom.co', 'us-east-1.aws.edge.axiom.co'],
    ['https://us-east-1.aws.edge.axiom.co/', 'us-east-1.aws.edge.axiom.co'],
    [' ap-southeast-1.gcp.edge.axiom.co ', 'ap-southeast-1.gcp.edge.axiom.co'],
  ])('accepts %j', (raw, expected) => {
    expect(normalizeEdgeDomain(raw)).toBe(expected);
  });

  it.each([
    null,
    '',
    'evil.example.com',
    'edge.axiom.co',
    'api.axiom.co',
    'us-east-1.aws.edge.axiom.co.evil.com',
    'evil.com/.edge.axiom.co',
    'evil.com#.edge.axiom.co',
    'user@us-east-1.aws.edge.axiom.co',
    'us-east-1.aws.edge.axiom.co:8443',
    'us-east-1.aws.edge.axiom.co/v1/ingest',
    'http://us-east-1.aws.edge.axiom.co',
    'javascript:alert(1)//x.edge.axiom.co',
    'us east.edge.axiom.co',
    '-bad.edge.axiom.co',
    'a..edge.axiom.co',
    '$(curl evil).edge.axiom.co',
    'us-east-1\n.aws.edge.axiom.co',
    `${'a'.repeat(64)}.edge.axiom.co`,
  ])('rejects %j', (raw) => {
    expect(normalizeEdgeDomain(raw)).toBeUndefined();
  });
});

describe('normalizeDatasetName', () => {
  it.each(['boat-otel', 'Logs2', 'my_dataset', 'otel.traces', 'a'.repeat(128)])('accepts %j', (name) => {
    expect(normalizeDatasetName(name)).toBe(name);
  });

  it.each([null, '', '-leading', 'a b', 'x"; rm -rf ~; echo "', '$(id)', '<img src=x>', 'a/b', 'a'.repeat(129)])(
    'rejects %j',
    (name) => {
      expect(normalizeDatasetName(name)).toBeUndefined();
    },
  );
});

describe('readPrefillValues', () => {
  it('reads domain and dataset from the query string', () => {
    expect(readPrefillValues('?domain=us-east-1.aws.edge.axiom.co&dataset=boat-otel')).toEqual({
      values: { AXIOM_DOMAIN: 'us-east-1.aws.edge.axiom.co', DATASET_NAME: 'boat-otel' },
      present: true,
    });
  });

  it('drops invalid values but still reports the params as present', () => {
    expect(readPrefillValues('?domain=evil.example.com&dataset=boat-otel')).toEqual({
      values: { DATASET_NAME: 'boat-otel' },
      present: true,
    });
    expect(readPrefillValues('?dataset=%24(id)')).toEqual({ values: {}, present: true });
  });

  it('never reads credentials from the URL', () => {
    expect(readPrefillValues('?token=xaat-secret&API_TOKEN=xaat-secret&org=acme&ORGANIZATION_ID=acme')).toEqual({
      values: {},
      present: false,
    });
  });
});

describe('withoutPrefillParams', () => {
  it('removes only the prefill params', () => {
    expect(withoutPrefillParams('https://axiom.co/docs/send-data/convex?client=go&domain=x&dataset=y#setup'))
      .toBe('https://axiom.co/docs/send-data/convex?client=go#setup');
  });
});

describe('placeholder storage', () => {
  it('keeps domain and dataset in localStorage and secrets in sessionStorage', () => {
    setPlaceholderValues({
      AXIOM_DOMAIN: 'eu-central-1.aws.edge.axiom.co',
      DATASET_NAME: 'boat-otel',
      API_TOKEN: 'xaat-mock',
      ORGANIZATION_ID: 'org-mock',
    });

    expect(JSON.parse(localStorage.getItem(placeholderStorageKey)!)).toEqual({
      AXIOM_DOMAIN: 'eu-central-1.aws.edge.axiom.co',
      DATASET_NAME: 'boat-otel',
    });
    expect(JSON.parse(sessionStorage.getItem(placeholderStorageKey)!)).toEqual({
      API_TOKEN: 'xaat-mock',
      ORGANIZATION_ID: 'org-mock',
    });
    expect(parsePlaceholderSnapshot(getPlaceholderSnapshot())).toEqual({
      AXIOM_DOMAIN: 'eu-central-1.aws.edge.axiom.co',
      DATASET_NAME: 'boat-otel',
      API_TOKEN: 'xaat-mock',
      ORGANIZATION_ID: 'org-mock',
    });
  });

  it('clears values and ignores entries kept in the wrong storage', () => {
    sessionStorage.setItem(placeholderStorageKey, JSON.stringify({ DATASET_NAME: 'stale', API_TOKEN: 'xaat-mock' }));
    localStorage.setItem(placeholderStorageKey, JSON.stringify({ API_TOKEN: 'xaat-leaked', DATASET_NAME: 'boat-otel' }));
    expect(parsePlaceholderSnapshot(getPlaceholderSnapshot())).toEqual({ DATASET_NAME: 'boat-otel', API_TOKEN: 'xaat-mock' });

    setPlaceholderValues({ DATASET_NAME: undefined });
    expect(parsePlaceholderSnapshot(getPlaceholderSnapshot())).toEqual({ API_TOKEN: 'xaat-mock' });
    expect(localStorage.getItem(placeholderStorageKey)).toBe('{}');
  });

  it('tolerates malformed stored JSON', () => {
    localStorage.setItem(placeholderStorageKey, 'not json');
    sessionStorage.setItem(placeholderStorageKey, 'null');
    expect(parsePlaceholderSnapshot(getPlaceholderSnapshot())).toEqual({});
  });
});
