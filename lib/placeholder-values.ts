// Reader-supplied values for code example placeholders. The edge domain and
// dataset name aren't secret and stay in localStorage, so a Console link
// (`?domain=…&dataset=…`) carries across pages and visits. Tokens and the
// organization ID stay in sessionStorage and never come from a URL.
export const placeholderStorageKey = 'axiom-docs-placeholders';
export const placeholderChangeEvent = 'axiom-placeholder-change';

export const placeholderKeys = ['AXIOM_DOMAIN', 'API_TOKEN', 'DATASET_NAME', 'ORGANIZATION_ID'] as const;
export type PlaceholderKey = (typeof placeholderKeys)[number];
export type PlaceholderValues = Partial<Record<PlaceholderKey, string>>;

const persistentKeys = new Set<PlaceholderKey>(['AXIOM_DOMAIN', 'DATASET_NAME']);

// Query params Console may send. Never add a credential here.
export const prefillParams = { domain: 'AXIOM_DOMAIN', dataset: 'DATASET_NAME' } as const;

const hostnameLabel = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

// Accepts a bare Axiom cloud edge hostname such as `us-east-1.aws.edge.axiom.co`.
// A leading `https://` and trailing slash are tolerated because Console stores
// deployment domains as origins. Anything else (paths, ports, credentials,
// other hosts) is rejected, so a crafted link can't point readers' copied
// commands, and the tokens in them, at a server Axiom doesn't run.
export function normalizeEdgeDomain(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const host = raw.trim().toLowerCase().replace(/^https:\/\//, '').replace(/\/$/, '');
  if (host.length > 253 || !host.endsWith('.edge.axiom.co')) return undefined;
  return host.split('.').every((label) => hostnameLabel.test(label)) ? host : undefined;
}

// Dataset names are ASCII alphanumerics and hyphens; underscores and dots are
// tolerated for older datasets. Nothing here can break out of a quoted string
// or shell argument in an example.
export function normalizeDatasetName(raw: string | null | undefined): string | undefined {
  const name = raw?.trim();
  return name && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(name) ? name : undefined;
}

export function readPrefillValues(search: string): { values: PlaceholderValues; present: boolean } {
  const params = new URLSearchParams(search);
  const domain = normalizeEdgeDomain(params.get('domain'));
  const dataset = normalizeDatasetName(params.get('dataset'));
  return {
    values: { ...(domain && { AXIOM_DOMAIN: domain }), ...(dataset && { DATASET_NAME: dataset }) },
    present: Object.keys(prefillParams).some((name) => params.has(name)),
  };
}

// Strips the prefill params so reloading or sharing the page doesn't reapply
// values the reader has since cleared. Other params and the hash stay.
export function withoutPrefillParams(href: string): string {
  const url = new URL(href);
  for (const name of Object.keys(prefillParams)) url.searchParams.delete(name);
  return url.toString();
}

function readStorage(storage: () => Storage) {
  try { return storage().getItem(placeholderStorageKey) ?? '{}'; } catch { return '{}'; }
}

function parse(snapshot: string): PlaceholderValues {
  try {
    const parsed: unknown = JSON.parse(snapshot);
    return parsed && typeof parsed === 'object' ? parsed as PlaceholderValues : {};
  } catch { return {}; }
}

// One string covering both storages so useSyncExternalStore can compare it.
export function getPlaceholderSnapshot() {
  return `${readStorage(() => window.localStorage)}\n${readStorage(() => window.sessionStorage)}`;
}

export function getServerPlaceholderSnapshot() {
  return '{}\n{}';
}

export function parsePlaceholderSnapshot(snapshot: string): PlaceholderValues {
  const [local = '{}', session = '{}'] = snapshot.split('\n');
  const stored = { local: parse(local), session: parse(session) };
  const values: PlaceholderValues = {};
  for (const key of placeholderKeys) {
    const value = stored[persistentKeys.has(key) ? 'local' : 'session'][key];
    if (typeof value === 'string' && value) values[key] = value;
  }
  return values;
}

export function subscribePlaceholderValues(callback: () => void) {
  const onStorage = (event: StorageEvent) => { if (event.key === placeholderStorageKey) callback(); };
  window.addEventListener(placeholderChangeEvent, callback);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(placeholderChangeEvent, callback);
    window.removeEventListener('storage', onStorage);
  };
}

export function setPlaceholderValues(changes: PlaceholderValues) {
  const current = parsePlaceholderSnapshot(getPlaceholderSnapshot());
  const next = { ...current, ...changes };
  for (const persistent of [true, false]) {
    const owned = Object.fromEntries(placeholderKeys
      .filter((key) => persistentKeys.has(key) === persistent && next[key])
      .map((key) => [key, next[key]]));
    try {
      const storage = persistent ? window.localStorage : window.sessionStorage;
      storage.setItem(placeholderStorageKey, JSON.stringify(owned));
    } catch { /* storage unavailable */ }
  }
  window.dispatchEvent(new Event(placeholderChangeEvent));
}
