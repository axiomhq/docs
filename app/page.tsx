import type { Metadata } from "next";
import { ArrowRight, Forum, LogoDiscord } from "@carbon/icons-react";
import { ScrollText, Waypoints, type LucideIcon } from "lucide-react";
import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { IntegrationIcon } from "@/components/integration-icons";
import {
  CarbonApi,
  CarbonRocket,
} from "@/components/landing-icons";
import { AplSearchIcon } from "@/assets/icons";
import { IconCard } from "@/components/icon-card";
import { HeroFlaresShader } from "@/components/hero-flares-shader";
import { LandingSectionHeading } from "@/components/landing-section-heading";
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
    href: "/docs/apl/introduction",
    Icon: AplSearchIcon,
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
    href: "/docs/send-data/aws-overview",
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
    href: "/docs/send-data/syslog-proxy",
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
    "/docs/apl/introduction",
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
    <div className="landing-content relative isolate overflow-x-clip px-14 pt-10 lg:pt-52 max-lg:px-10 max-md:px-7 max-sm:pt-7 max-sm:px-5">
      <HeroFlaresShader className="hero-flares absolute -top-[340px] left-1/2 z-0 hidden w-[853px] max-w-none -translate-x-1/2 lg:block" />
      <section
        className={cn(
          "landing-hero relative z-10",
          "w-[min(760px,100%)] mx-auto text-center",
          "pt-6 px-0 pb-12 max-sm:pt-2",
        )}
      >
        <h1 className="m-0! mx-auto! max-w-[700px] text-(--text-primary)! font-sans! text-[44px]! leading-12! font-medium! tracking-[-.03em]! text-pretty max-sm:text-[36px]! max-sm:leading-10!">
          From first event to petabyte scale.
        </h1>
        <p className="max-w-[560px] mt-[14px]! mx-auto! mb-0! text-(--text-tertiary)! font-sans text-[16px] leading-[26px] font-normal tracking-[-.01em]">
          Send, store, and query logs, traces, metrics, and events.
          From first ingest to petabyte scale.
        </p>
      </section>
      <section
        className={cn(
          "quick-grid relative z-10",
          "w-[min(760px,100%)] mx-auto",
          "grid grid-cols-3 gap-4 max-sm:grid-cols-1",
        )}
        aria-label="Popular starting points"
      >
        {quickCards.map(({ Icon, ...card }) => (
          <IconCard
            {...card}
            icon={<Icon />}
            gap="md"
            className="quick-card"
            // These cards precede the first LandingSectionHeading h2, so h3
            // here would skip a level in the page outline.
            titleAs="h2"
            key={card.title}
          />
        ))}
      </section>
      <section
        className={cn(
          "landing-section relative z-10",
          "w-[min(760px,100%)] mx-auto",
          "mt-14",
        )}
      >
        <LandingSectionHeading
          title="Send data"
          trailingLink={{
            href: "/docs/apps/introduction",
            label: "All integrations",
          }}
          className="mb-5"
        />
        <div className="integration-list grid grid-cols-3 gap-x-6 gap-y-1 max-md:grid-cols-2 max-sm:grid-cols-1">
          {integrations.map(
            ({ label, href, slug, blurb, fallback: Fallback }) => (
              <Link
                href={href}
                prefetch={false}
                key={label}
                className="-mx-2.5 px-2.5 py-2.5 flex items-start gap-3 rounded-[6px] no-underline transition-[background-color] duration-150 ease-[ease] [&:hover]:bg-interactive-hover"
              >
                <span className="flex-none mt-px">
                  {slug ? (
                    <IntegrationIcon slug={slug} size={18} />
                  ) : Fallback ? (
                    <Fallback
                      size={18}
                      className="text-(--text-secondary)"
                    />
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
          "landing-section platform-index relative z-10",
          "w-[min(760px,100%)] mx-auto",
          "mt-14",
        )}
      >
        <LandingSectionHeading
          title="Explore the platform"
          className="mb-2"
        />
        <nav
          className="platform-list"
          aria-label="Explore the platform"
        >
          {platformRows.map(([title, description, href], index) => (
            <Fragment key={title}>
              <Link
                href={href}
                prefetch={false}
                className={cn(
                  "platform-row grid grid-cols-[160px_minmax(0,1fr)_auto] items-center gap-x-5 px-2 py-4 hover:bg-interactive-hover rounded-md md:-mx-2!",
                  "focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-(--color-accent)",
                  "max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:gap-x-3 max-sm:gap-y-1 max-sm:px-1",
                )}
              >
                <span
                  data-slot="platform-row-title"
                  className="min-w-0 font-sans text-[14px] leading-5 font-medium text-(--text-primary)"
                >
                  {title}
                </span>
                <span
                  data-slot="platform-row-description"
                  className="min-w-0 text-(--text-tertiary) font-sans text-[13px] leading-5 font-normal max-sm:col-span-2 max-sm:col-start-1 max-sm:row-start-2"
                >
                  {description}
                </span>
                <span
                  aria-hidden="true"
                  data-slot="platform-row-arrow"
                  className="justify-self-end font-mono text-[15px] leading-none font-normal text-(--text-quaternary) [.platform-row:hover_&]:text-(--text-secondary) [.platform-row:focus-visible_&]:text-(--text-secondary) max-sm:col-start-2 max-sm:row-start-1"
                >
                  →
                </span>
              </Link>
              {index < platformRows.length - 1 && (
                <hr
                  aria-hidden="true"
                  data-slot="platform-row-separator"
                  className="mx-auto my-0 h-px w-[calc(100%-10px)] border-0 bg-(--border-secondary)"
                />
              )}
            </Fragment>
          ))}
        </nav>
      </section>
      <section
        aria-label="Community and support"
        className={cn(
          "landing-section community-support relative z-10",
          "w-[min(760px,100%)] mx-auto mt-12",
          "grid grid-cols-2 gap-4",
          "max-sm:grid-cols-1 max-sm:mt-10",
        )}
      >
        <a
          href="https://discord.gg/axiom-co"
          target="_blank"
          rel="noopener noreferrer"
          data-slot="community-support-card"
          className={cn(
            "group flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-gray-3/50 bg-card px-8 py-8 text-center no-underline",
            "hover:border-gray-4 hover:bg-interactive-hover focus-visible:z-10 focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-(--color-accent)",
            "max-sm:min-h-[190px] max-sm:px-6 max-sm:py-7",
          )}
        >
          <LogoDiscord
            size={32}
            aria-hidden="true"
            data-slot="community-support-icon"
            className="shrink-0 text-(--text-primary)"
          />
          <strong className="mt-5 font-sans text-[17px] leading-6 font-medium tracking-[-.01em] text-(--text-primary)">
            Build with the community
          </strong>
          <span className="mt-2 max-w-[290px] font-sans text-[13px] leading-5 font-normal text-(--text-tertiary)">
            Trade ideas, share projects, and learn from others using Axiom.
          </span>
          <span className="mt-5 inline-flex items-center gap-1.5 font-sans text-[13px] leading-5 font-medium text-(--text-secondary) group-hover:text-(--text-primary)">
            Visit Discord
            <ArrowRight size={14} aria-hidden="true" />
          </span>
        </a>
        <a
          href="https://axiom.co/support"
          data-slot="community-support-card"
          className={cn(
            "group flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-gray-3/50 bg-card px-8 py-8 text-center no-underline",
            "hover:border-gray-4 hover:bg-interactive-hover focus-visible:z-10 focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-(--color-accent)",
            "max-sm:min-h-[190px] max-sm:px-6 max-sm:py-7",
          )}
        >
          <Forum
            size={32}
            aria-hidden="true"
            data-slot="community-support-icon"
            className="shrink-0 text-(--text-secondary)"
          />
          <strong className="mt-5 font-sans text-[17px] leading-6 font-medium tracking-[-.01em] text-(--text-primary)">
            Talk to our support team
          </strong>
          <span className="mt-2 max-w-[290px] font-sans text-[13px] leading-5 font-normal text-(--text-tertiary)">
            Get guidance on your workspace, data, or anything blocking your
            progress.
          </span>
          <span className="mt-5 inline-flex items-center gap-1.5 font-sans text-[13px] leading-5 font-medium text-(--text-secondary) group-hover:text-(--text-primary)">
            Contact support
            <ArrowRight size={14} aria-hidden="true" />
          </span>
        </a>
      </section>
    </div>
  );
}
