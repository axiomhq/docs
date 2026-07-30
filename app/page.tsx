import type { Metadata } from 'next';
import { cn } from '@/lib/utils';
import { AskAiPrompt, SearchPrompt } from '@/components/search-prompt';
import { ZoneLink as Link } from '@/components/zone-link';
import { ogImage } from '@/lib/og';

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

const title = 'Axiom Docs';
const description = 'Learn how to send, store, and query logs, traces, metrics, and events with Axiom.';

// Shared by .landing-hero, .quick-grid and .landing-section in globals.css.
const measure = 'w-[min(760px,100%)] mx-auto';
// `!` marks utilities whose property is also set by an element default
// (`h1,h2,p,small,a` in styles/tokens.css, `a { color: inherit }` in
// app/globals.css). Those defaults now live in @layer base, so the plain
// utilities would win anyway — the `!` is belt-and-braces from the migration
// and safe to drop in a cleanup pass.
const sectionHeadingTitle = 'm-0! text-(--text-tertiary)! font-mono! text-[12px]! leading-4! font-semibold! tracking-[.08em]! uppercase';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/docs' },
  openGraph: { title, description, siteName: 'Axiom', type: 'website', url: '/docs', images: [ogImage(title)] },
  twitter: { card: 'summary_large_image', title, description, images: [ogImage(title)] },
};

export default function DocsLandingPage() {
  return (
    <div className="landing-content pt-10 px-14 pb-0 max-lg:px-10 max-md:px-7 max-sm:pt-7 max-sm:px-5">
      <section className={cn('landing-hero', measure, 'pt-6 px-0 pb-12 max-sm:pt-2')}>
        <h1 className="m-0! max-w-[700px] text-(--text-primary)! font-sans! text-[44px]! leading-12! font-semibold! tracking-[-.03em]! text-pretty max-sm:text-[36px]! max-sm:leading-10!">From first event to petabyte scale.</h1>
        <p className="max-w-[560px] mt-[14px]! mx-0! mb-0! text-(--text-tertiary)! font-sans text-[16px] leading-[26px] font-normal tracking-[-.01em]">Send, store, and query logs, traces, metrics, and events. From first ingest to petabyte scale.</p>
        <SearchPrompt />
      </section>
      <section className={cn('quick-grid', measure, 'grid grid-cols-3 gap-4 max-sm:grid-cols-1')} aria-label="Popular starting points">
        {quickCards.map((card) => <Link href={card.href} prefetch={false} className="quick-card min-h-[158px] p-5 flex flex-col gap-1.5 border border-(--border-primary) rounded-[4px] bg-(--bg-surface) hover:bg-(--bg-raised) hover:border-(--border-strong) max-sm:min-h-0" key={card.title}><strong className="font-sans text-[15px] leading-5 font-semibold tracking-[-.01em]">{card.title}</strong><span className="text-(--text-tertiary) font-sans text-[13px] leading-5 font-normal">{card.description}</span><small className="mt-auto text-(--text-tertiary)! font-mono text-[12px]! leading-4! font-[450]">{card.action}</small></Link>)}
      </section>
      <section className={cn('landing-section', measure, 'mt-14')}>
        <div className="section-heading flex items-center gap-4 mb-5"><h2 className={sectionHeadingTitle}>Send data</h2><span className="flex-1 border-t border-(--border-primary)" /><Link href="/docs/apps/introduction" prefetch={false} className="text-(--text-tertiary)! font-mono text-[12px] leading-4 font-[450]">All integrations →</Link></div>
        <div className="integration-list flex flex-wrap gap-2">{integrations.map(([label, href]) => <Link href={href} prefetch={false} key={label} className="h-8 px-3 py-0 flex items-center border border-(--border-primary) rounded-[4px] text-(--text-secondary)! font-mono text-[12px] leading-4 font-[450] hover:bg-(--bg-emph-tertiary) hover:text-(--text-primary)!">{label}</Link>)}</div>
      </section>
      <section className={cn('landing-section platform-index', measure, 'mt-14')}>
        <div className="section-heading flex items-center gap-4 mb-2"><h2 className={sectionHeadingTitle}>Explore the platform</h2><span className="flex-1 border-t border-(--border-primary) text-(--text-tertiary) font-sans text-[13px] leading-5 font-normal" /></div>
        {platformRows.map(([title, description, href]) => <Link href={href} prefetch={false} key={title} className="py-4 px-1 flex items-baseline gap-3 border-b border-(--border-secondary) hover:bg-(--bg-emph-tertiary) max-sm:items-start max-sm:flex-wrap"><strong className="w-[180px] flex-none font-sans text-[14px] leading-5 font-semibold max-sm:w-full">{title}</strong><span className="flex-1 text-(--text-tertiary) font-sans text-[13px] leading-5 font-normal">{description}</span><b className="text-(--text-quaternary) font-normal">→</b></Link>)}
      </section>
      <footer className="landing-footer mt-20 -mx-14 mb-0 py-5 px-8 flex items-center gap-6 border-t border-(--border-primary) text-(--text-tertiary) font-mono text-[12px] leading-4 font-[450] max-lg:-mx-10 max-md:-mx-7 max-sm:mt-16 max-sm:-mx-5 max-sm:mb-0 max-sm:py-5 max-sm:px-5 max-sm:flex-wrap max-sm:gap-x-5 max-sm:gap-y-[14px]"><span className="text-(--text-quaternary) uppercase tracking-[.06em]">Can’t find it?</span><AskAiPrompt /><a href="https://discord.gg/axiomco">Discord</a><a href="https://axiom.co/contact">Support</a><small className="ml-auto text-(--text-quaternary)! font-mono text-[12px]! leading-4! font-[450] max-sm:w-full max-sm:ml-0">axiom.co/docs</small></footer>
    </div>
  );
}
