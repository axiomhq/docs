import Link from 'next/link';
import { DocsShell } from '@/components/docs-shell';
import { AskAiPrompt, SearchPrompt } from '@/components/search-prompt';
import { getNavigation } from '@/lib/navigation';

const quickCards = [
  { title: 'Quickstart', description: 'Send your first events in five minutes. No schema, no credit card.', action: 'Start here →', href: '/docs/getting-started' },
  { title: 'Query with APL', description: 'From count() to joins. Operators, functions, and worked examples.', action: 'Learn APL →', href: '/docs/apl/overview' },
  { title: 'API reference', description: 'REST endpoints, tokens, and limits. Ingest and query over HTTP.', action: 'Browse the API →', href: '/docs/restapi/introduction' },
];

const integrations = [
  ['OpenTelemetry', '/docs/send-data/opentelemetry'], ['JavaScript', '/docs/guides/javascript'], ['Python', '/docs/guides/python'],
  ['Go', '/docs/guides/go'], ['Kubernetes', '/docs/send-data/kubernetes'], ['AWS', '/docs/send-data/cloudwatch'],
  ['Vector', '/docs/send-data/vector'], ['Vercel', '/docs/apps/vercel'], ['Cloudflare', '/docs/apps/cloudflare-workers'],
  ['Syslog', '/docs/send-data/syslog'], ['Grafana', '/docs/apps/grafana'], ['Terraform', '/docs/apps/terraform'],
];

const platformRows = [
  ['Send data', 'Connect your applications, infrastructure, and telemetry pipelines.', '/docs/send-data/methods'],
  ['Explore data', 'Search, filter, and inspect every event in real time.', '/docs/query-data/explore'],
  ['Query with APL', 'Transform and analyze data with Axiom Processing Language.', '/docs/apl/overview'],
  ['Build dashboards', 'Turn saved queries into durable, shareable views.', '/docs/dashboards/create'],
  ['Create monitors', 'Detect thresholds, matches, and anomalies before users do.', '/docs/monitor-data/monitors'],
  ['Manage datasets', 'Control schemas, retention, access, and usage at scale.', '/docs/reference/datasets'],
];

export default function DocsLandingPage() {
  return (
    <DocsShell navigation={getNavigation('documentation')} activeHref="/docs" landing>
      <div className="landing-content">
        <section className="landing-hero">
          <h1>From first event to petabyte scale.</h1>
          <p>Send, store, and query logs, traces, metrics, and events. From first ingest to petabyte scale.</p>
          <SearchPrompt />
        </section>
        <section className="quick-grid" aria-label="Popular starting points">
          {quickCards.map((card) => <Link href={card.href} prefetch={false} className="quick-card" key={card.title}><strong>{card.title}</strong><span>{card.description}</span><small>{card.action}</small></Link>)}
        </section>
        <section className="landing-section">
          <div className="section-heading"><h2>Send data</h2><span /><Link href="/docs/apps/introduction" prefetch={false}>All integrations →</Link></div>
          <div className="integration-list">{integrations.map(([label, href]) => <Link href={href} prefetch={false} key={label}>{label}</Link>)}</div>
        </section>
        <section className="landing-section platform-index">
          <div className="section-heading"><h2>Explore the platform</h2><span /></div>
          {platformRows.map(([title, description, href]) => <Link href={href} prefetch={false} key={title}><strong>{title}</strong><span>{description}</span><b>→</b></Link>)}
        </section>
        <footer className="landing-footer"><span>Can’t find it?</span><AskAiPrompt /><a href="https://discord.gg/axiomco">Discord</a><a href="https://axiom.co/contact">Support</a><small>axiom.co/docs</small></footer>
      </div>
    </DocsShell>
  );
}
