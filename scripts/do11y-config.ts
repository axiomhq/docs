/**
 * Do11y configuration example.
 *
 * Copy this file alongside do11y.js in your docs site and rename it to
 * do11y-config.js. Set the values below to match your Axiom setup.
 *
 * This file must load before do11y.js. For frameworks that auto-include
 * all .js files (like Mintlify), alphabetical ordering handles this
 * automatically.
 *
 * Any option from the config object in do11y.js can be set here.
 * See the README for the full list.
 */

declare global {
  interface Window {
    Do11yConfig?: Partial<{
      axiomHost: string;
      axiomToken: string;
      axiomDataset: string;
      framework: string;
      allowedDomains: string[] | null;
      [key: string]: unknown;
    }>;
  }
}

window.Do11yConfig = {
  // Required: Axiom ingest endpoint.
  // Use an edge deployment domain for lower latency:
  //   US East 1 (AWS):    'us-east-1.aws.edge.axiom.co'
  //   EU Central 1 (AWS): 'eu-central-1.aws.edge.axiom.co'
  axiomHost: 'us-east-1.aws.edge.axiom.co',

  // Required: Ingest-only API token scoped to a single dataset.
  axiomToken: 'xaat-31aceafd-2a71-4313-8a43-1494ea125085',

  // Required: Target Axiom dataset.
  axiomDataset: 'docs-analytics',

  // Documentation framework. Supported values:
  // 'mintlify', 'docusaurus', 'nextra', 'gitbook', 'mkdocs-material',
  // 'vitepress', 'custom'
  framework: 'mintlify',

  // Optional: restrict which domains may send data.
  // Set to null to allow any domain.
  // allowedDomains: ['docs.example.com'],
  allowedDomains: ['axiom.co'],

  // Settings for testing only
  // debug: true,
  // allowedDomains: null,
  // respectDNT: false,
};

export {};
