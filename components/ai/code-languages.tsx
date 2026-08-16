import { Braces, Database, List } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

/**
 * Language identity for code-block headers: display label + icon per fence
 * language. Fumadocs' transformer already supplies brand icons for common
 * languages (typescript, python, shell, …) via the pre `icon` prop; this map
 * fills what it doesn't know — most importantly kusto, which is APL in our
 * docs — and normalizes labels.
 */

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export type CodeLanguage = {
  label: string;
  Icon?: IconComponent;
};

function AxiomMarkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 358 309" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M354.75 215.609 278.412 87.847c-3.501-5.872-12.127-10.676-19.17-10.676h-47.659c-11.077 0-15.618-7.548-10.093-16.772l26.136-43.627c2.074-3.463 2.069-7.725-.011-11.183C225.534 2.13 221.691 0 217.533 0h-66.485c-7.044 0-15.688 4.793-19.212 10.652L2.645 225.448c-3.525 5.859-3.526 15.447-.006 21.307l33.243 55.325c5.539 9.217 14.622 9.228 20.184.023l25.974-42.98c5.564-9.205 14.645-9.195 20.185.023l23.548 39.192c3.521 5.86 12.164 10.654 19.207 10.654h153.633c7.04 0 15.685-4.794 19.206-10.654l36.892-61.397c3.521-5.86 3.538-15.459.039-21.332Zm-103.096-6.149c5.505 9.236.945 16.794-10.132 16.794H122.021c-11.077 0-15.609-7.542-10.07-16.76l59.796-99.517c5.539-9.218 14.602-9.217 20.141.001l59.766 99.482Z" />
    </svg>
  );
}

/** Generic fallback when neither this map nor fumadocs knows the language. */
export function CodeGlyphIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="m8 6-6 6 6 6M16 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const CODE_LANGUAGES: Record<string, CodeLanguage> = {
  kusto: { label: 'APL', Icon: AxiomMarkIcon },
  apl: { label: 'APL', Icon: AxiomMarkIcon },
  sql: { label: 'SQL', Icon: Database },
  spl: { label: 'SPL', Icon: Database },
  splunk: { label: 'SPL', Icon: Database },
  json: { label: 'JSON', Icon: Braces },
  jsonc: { label: 'JSON', Icon: Braces },
  yaml: { label: 'YAML', Icon: List },
  yml: { label: 'YAML', Icon: List },
  toml: { label: 'TOML', Icon: List },
  ini: { label: 'INI', Icon: List },
  bash: { label: 'shell' },
  sh: { label: 'shell' },
  shell: { label: 'shell' },
  zsh: { label: 'shell' },
  console: { label: 'shell' },
  curl: { label: 'shell' },
  ts: { label: 'typescript' },
  tsx: { label: 'TSX' },
  js: { label: 'javascript' },
  jsx: { label: 'JSX' },
  py: { label: 'python' },
  rb: { label: 'ruby' },
  cs: { label: 'csharp' },
  'c#': { label: 'csharp' },
  golang: { label: 'go' },
  hcl: { label: 'HCL' },
  tf: { label: 'HCL' },
  http: { label: 'HTTP' },
  txt: { label: 'text' },
  plaintext: { label: 'text' },
};

/**
 * MPL queries share the `kusto` fence with APL; their tell is the source
 * line — a backtick-quoted `dataset`:`metric` pair, optionally preceded by
 * `set …;` directives (see the MPL query-structure reference).
 */
const MPL_SOURCE = /^\s*(?:set\s+[^;\n]+;\s*)*`[^`\n]+`\s*:\s*`[^`\n]+`/;

export function resolveCodeLanguage(
  lang: string | undefined,
  code?: string,
): CodeLanguage {
  if (!lang) return { label: 'code' };
  const id = lang.toLowerCase();
  if ((id === 'kusto' || id === 'apl' || id === 'mpl') && code && MPL_SOURCE.test(code)) {
    return { label: 'MPL', Icon: AxiomMarkIcon };
  }
  const entry = CODE_LANGUAGES[id];
  return entry ?? { label: id };
}
