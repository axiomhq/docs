import type { Metadata } from "next";
import { ScrollText, Waypoints, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { IntegrationIcon } from "@/components/integration-icons";
import {
  CarbonApi,
  CarbonCode,
  CarbonRocket,
} from "@/components/landing-icons";
import { ZoneLink as Link } from "@/components/zone-link";
import { ogImage } from "@/lib/og";

const quickCards = [
  {
    title: "Quickstart",
    description:
      "Send your first events in five minutes. No schema, no credit card.",
    href: "/docs/getting-started",
    Icon: CarbonRocket,
  },
  {
    title: "Query with APL",
    description:
      "From count() to joins. Operators, functions, and worked examples.",
    href: "/docs/apl/overview",
    Icon: CarbonCode,
  },
  {
    title: "API reference",
    description:
      "REST endpoints, tokens, and limits. Ingest and query over HTTP.",
    href: "/docs/restapi/introduction",
    Icon: CarbonApi,
  },
];

// `slug` picks a brand mark from components/integration-icons.tsx; the two
// integrations with no simple-icons entry carry a lucide `fallback` instead.
type Integration = {
  label: string;
  href: string;
  blurb: string;
  slug?: string;
  fallback?: LucideIcon;
};

const integrations: Integration[] = [
  {
    label: "OpenTelemetry",
    href: "/docs/send-data/opentelemetry",
    slug: "opentelemetry",
    blurb: "Traces, logs, and metrics over OTLP.",
  },
  {
    label: "JavaScript",
    href: "/docs/guides/javascript",
    slug: "javascript",
    blurb: "Events from Node.js and the browser.",
  },
  {
    label: "Python",
    href: "/docs/guides/python",
    slug: "python",
    blurb: "Structured logs from Python services.",
  },
  {
    label: "Go",
    href: "/docs/guides/go",
    slug: "go",
    blurb: "Ship events with axiom-go.",
  },
  {
    label: "Kubernetes",
    href: "/docs/send-data/kubernetes",
    slug: "kubernetes",
    blurb: "Cluster and pod logs at scale.",
  },
  {
    label: "AWS",
    href: "/docs/send-data/cloudwatch",
    slug: "aws",
    blurb: "CloudWatch, Lambda, and S3.",
  },
  {
    label: "Vector",
    href: "/docs/send-data/vector",
    fallback: Waypoints,
    blurb: "High-throughput log routing.",
  },
  {
    label: "Vercel",
    href: "/docs/apps/vercel",
    slug: "vercel",
    blurb: "Function and edge logs, zero config.",
  },
  {
    label: "Cloudflare",
    href: "/docs/apps/cloudflare-workers",
    slug: "cloudflare",
    blurb: "Workers logs from the edge.",
  },
  {
    label: "Syslog",
    href: "/docs/send-data/syslog",
    fallback: ScrollText,
    blurb: "Streams from hosts and network gear.",
  },
  {
    label: "Grafana",
    href: "/docs/apps/grafana",
    slug: "grafana",
    blurb: "Dashboards on top of Axiom queries.",
  },
  {
    label: "Terraform",
    href: "/docs/apps/terraform",
    slug: "terraform",
    blurb: "Axiom resources as code.",
  },
];

const platformRows = [
  [
    "Send data",
    "Connect your applications, infrastructure, and telemetry pipelines.",
    "/docs/send-data/methods",
  ],
  [
    "Explore data",
    "Search, filter, and inspect every event in real time.",
    "/docs/query-data/explore",
  ],
  [
    "Query with APL",
    "Transform and analyze data with Axiom Processing Language.",
    "/docs/apl/overview",
  ],
  [
    "Build dashboards",
    "Turn saved queries into durable, shareable views.",
    "/docs/dashboards/create",
  ],
  [
    "Create monitors",
    "Detect thresholds, matches, and anomalies before users do.",
    "/docs/monitor-data/monitors",
  ],
  [
    "Manage datasets",
    "Control schemas, retention, access, and usage at scale.",
    "/docs/reference/datasets",
  ],
];

const title = "Axiom Docs";
const description =
  "Learn how to send, store, and query logs, traces, metrics, and events with Axiom.";

// Shared by .landing-hero, .quick-grid and .landing-section in globals.css.
const measure = "w-[min(760px,100%)] mx-auto";
// `!` marks utilities whose property is also set by an element default
// (`h1,h2,p,small,a` in styles/tokens.css, `a { color: inherit }` in
// app/globals.css). Those defaults now live in @layer base, so the plain
// utilities would win anyway — the `!` is belt-and-braces from the migration
// and safe to drop in a cleanup pass.
const sectionHeadingTitle =
  "m-0! text-(--text-tertiary)! font-mono! text-[12px]! leading-4! tracking-[.08em]! uppercase";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/docs" },
  openGraph: {
    title,
    description,
    siteName: "Axiom",
    type: "website",
    url: "/docs",
    images: [ogImage(title)],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage(title)],
  },
};

export default function DocsLandingPage() {
  return (
    <div className="landing-content pt-10 px-14 pb-0 max-lg:px-10 max-md:px-7 max-sm:pt-7 max-sm:px-5">
      <section
        className={cn(
          "landing-hero",
          measure,
          "pt-6 px-0 pb-12 max-sm:pt-2",
        )}
      >
        <h1 className="m-0! max-w-[700px] text-(--text-primary)! font-sans! text-[44px]! leading-12! font-semibold! tracking-[-.03em]! text-pretty max-sm:text-[36px]! max-sm:leading-10!">
          From first event to petabyte scale.
        </h1>
        <p className="max-w-[560px] mt-[14px]! mx-0! mb-0! text-(--text-tertiary)! font-sans text-[16px] leading-[26px] font-normal tracking-[-.01em]">
          Send, store, and query logs, traces, metrics, and events.
          From first ingest to petabyte scale.
        </p>
      </section>
      <section
        className={cn(
          "quick-grid",
          measure,
          "grid grid-cols-3 gap-4 max-sm:grid-cols-1",
        )}
        aria-label="Popular starting points"
      >
        {quickCards.map(({ Icon, ...card }) => (
          <Link
            href={card.href}
            prefetch={false}
            className="quick-card p-5 flex flex-col gap-1.5 rounded-[6px] bg-(--bg-surface) transition-[background-color] duration-150 ease-[ease] [&:hover]:bg-(--bg-raised)"
            key={card.title}
          >
            <span className="mb-2.5 text-(--text-tertiary) [.quick-card:hover_&]:text-(--text-primary) transition-colors duration-150 ease-[ease]">
              <Icon size={22} />
            </span>
            <strong className="font-sans text-[15px] leading-5 font-semibold tracking-[-.01em]">
              {card.title}
            </strong>
            <span className="text-(--text-tertiary) font-sans text-[13px] leading-5 font-normal">
              {card.description}
            </span>
          </Link>
        ))}
      </section>
      <section className={cn("landing-section", measure, "mt-14")}>
        <div className="section-heading flex items-center gap-4 mb-5">
          <h2 className={sectionHeadingTitle}>Send data</h2>
          <span className="flex-1 border-t border-(--border-primary)" />
          <Link
            href="/docs/apps/introduction"
            prefetch={false}
            className="text-(--text-tertiary)! font-mono text-[12px] leading-4 font-[450]"
          >
            All integrations →
          </Link>
        </div>
        <div className="integration-list grid grid-cols-3 gap-x-6 gap-y-1 max-md:grid-cols-2 max-sm:grid-cols-1">
          {integrations.map(
            ({ label, href, slug, blurb, fallback: Fallback }) => (
              <Link
                href={href}
                prefetch={false}
                key={label}
                className="-mx-2.5 px-2.5 py-2.5 flex items-start gap-3 rounded-[6px] no-underline transition-[background-color] duration-150 ease-[ease] [&:hover]:bg-(--bg-inert)"
              >
                <span className="flex-none mt-px">
                  {slug ? (
                    <IntegrationIcon slug={slug} size={18} />
                  ) : Fallback ? (
                    <Fallback size={18} className="text-(--text-secondary)" />
                  ) : null}
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <strong className="font-sans text-[14px] leading-5 font-semibold text-(--text-primary)">
                    {label}
                  </strong>
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap text-(--text-tertiary) font-sans text-[12px] leading-[17px] font-normal">
                    {blurb}
                  </span>
                </span>
              </Link>
            ),
          )}
        </div>
      </section>
      <section
        className={cn(
          "landing-section platform-index",
          measure,
          "mt-14",
        )}
      >
        <div className="section-heading flex items-center gap-4 mb-2">
          <h2 className={sectionHeadingTitle}>
            Explore the platform
          </h2>
          <span className="flex-1 border-t border-(--border-primary) text-(--text-tertiary) font-sans text-[13px] leading-5 font-normal" />
        </div>
        {platformRows.map(([title, description, href]) => (
          <Link
            href={href}
            prefetch={false}
            key={title}
            className="py-4 px-1 flex items-baseline gap-3 border-b border-(--border-secondary) last:border-b-0 [&:hover]:bg-(--bg-emph-tertiary) [&:hover]:border-transparent [&:has(+_a:hover)]:border-transparent max-sm:items-start max-sm:flex-wrap"
          >
            <strong className="w-[180px] flex-none font-sans text-[14px] leading-5 font-semibold max-sm:w-full">
              {title}
            </strong>
            <span className="flex-1 text-(--text-tertiary) font-sans text-[13px] leading-5 font-normal">
              {description}
            </span>
            <b className="text-(--text-quaternary) font-mono font-normal">→</b>
          </Link>
        ))}
      </section>
    </div>
  );
}
