import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  DocsBody,
  DocsDescription,
  DocsTitle,
} from "fumadocs-ui/page";
import { ApiOperation } from "@/components/api-operation";
import { mdxComponents } from "@/components/mdx-components";
import {
  TableOfContents,
  type TocItem,
} from "@/components/table-of-contents";
import { ArticleFooter } from "@/components/article-footer";
import { CopyPageMenu } from "@/components/copy-page";
import { ZoneLink as Link } from "@/components/zone-link";
import { withoutDocsBasePath } from "@/lib/docs-paths";
import {
  getAdjacentNavigation,
  getBreadcrumbs,
  getNavigation,
  getSection,
} from "@/lib/navigation";
import { getApiOperationSections } from "@/lib/openapi";
import { ogImage } from "@/lib/og";
import {
  pageGraph,
  structuredDataProps,
} from "@/lib/structured-data";
import { source } from "@/lib/source";
import "./doc-prose.css";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ slug?: string[] }> };

export default async function DocumentationPage({
  params,
}: PageProps) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();
  // Mintlify link-out pages carry a `url` and are redirects, not documents. Production 307s all of
  // them; rendering the stub instead would publish a near-empty page at an indexable URL.
  if (page.data.url) redirect(withoutDocsBasePath(page.data.url));

  const href = page.url;
  const section = getSection(href);
  const navigation = getNavigation(section);
  const adjacentNavigation = getAdjacentNavigation(navigation, href);
  const breadcrumbs = getBreadcrumbs(navigation, href);
  if (breadcrumbs.length > 0)
    breadcrumbs[breadcrumbs.length - 1] = { title: page.data.title };
  // Structured data keeps the full trail; the visible breadcrumb shows only the
  // first two ancestor groups — never the page itself, whose title sits directly
  // below — so deep sections can't produce long trails.
  const visibleBreadcrumbs = breadcrumbs.slice(0, -1).slice(0, 2);
  const querySyntaxTitle =
    section === "query" &&
    slug?.at(-1) !== "overview" &&
    slug?.some((segment) => /(?:function|operator)s?$/.test(segment));
  const Body = page.data.body;
  const tocItems: TocItem[] = page.data.openapi
    ? getApiOperationSections(page.data.openapi)
    : page.data.toc.map((item) => ({
        title: item.title,
        url: item.url,
        depth: item.depth,
      }));
  const hasToc = tocItems.length > 0;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={structuredDataProps(
          pageGraph({
            url: href,
            title: page.data.title,
            description: page.data.description,
            keywords: page.data.keywords,
            breadcrumbs,
          }),
        )}
      />
      <div className="article-layout min-h-[calc(100svh_-_56px)] px-8 pt-14 pb-24 max-md:px-9 max-sm:px-5 max-sm:pt-9 max-sm:pb-18">
        <div
          className={cn(
            "article-content mx-auto grid w-full max-w-md grid-cols-[minmax(0,768px)]",
            hasToc &&
              "xl:max-w-[1026px] xl:grid-cols-[minmax(0,768px)_210px] xl:gap-x-12",
          )}
          data-has-toc={hasToc || undefined}
        >
          <article
            className={cn(
              "doc-article min-w-0 w-full",
              querySyntaxTitle && "query-syntax-article",
            )}
          >
            <div className="doc-topline mt-0 mx-0 mb-5 flex items-start justify-between gap-x-4 gap-y-2">
              <nav
                className="doc-breadcrumbs m-0 min-h-[30px] flex flex-wrap items-center gap-x-2 gap-y-1 text-(--color-accent-text) font-mono text-[12px] leading-4 font-[550] max-sm:min-h-0"
                aria-label="Breadcrumb"
              >
                {visibleBreadcrumbs.map((item, index) => {
                  const last =
                    index === visibleBreadcrumbs.length - 1;
                  return (
                    <span
                      className="doc-breadcrumb inline-flex gap-2 min-w-0"
                      key={`${item.title}-${index}`}
                    >
                      {item.href ? (
                        <Link
                          href={item.href}
                          prefetch={false}
                          className="[&:hover]:underline [&:hover]:underline-offset-[3px] [&:hover]:decoration-current"
                        >
                          {item.title}
                        </Link>
                      ) : (
                        <span>{item.title}</span>
                      )}
                      {!last && (
                        <b
                          aria-hidden="true"
                          className="text-(--border-strong) font-normal"
                        >
                          /
                        </b>
                      )}
                    </span>
                  );
                })}
              </nav>
              {!page.data.openapi && (
                <CopyPageMenu markdownPath={`${href}.md`} />
              )}
            </div>
            <DocsTitle
              className={
                querySyntaxTitle
                  ? "query-syntax-title m-0 font-(family-name:--font-query) text-[32px] leading-10 font-semibold tracking-normal text-foreground text-balance [font-variant-ligatures:none]"
                  : "m-0 font-sans text-[34px] leading-[42px] font-semibold tracking-[-.03em] text-foreground text-balance"
              }
            >
              {page.data.title}
            </DocsTitle>
            <DocsDescription className="mt-1.5 mx-0 mb-[34px] max-w-[640px] font-sans text-[16px] leading-7 font-normal tracking-[-.006em] text-secondary-foreground text-pretty">
              {page.data.description}
            </DocsDescription>
            <DocsBody className="doc-prose">
              {page.data.openapi ? (
                <ApiOperation value={page.data.openapi}>
                  <Body components={mdxComponents} />
                </ApiOperation>
              ) : (
                <Body components={mdxComponents} />
              )}
            </DocsBody>
            <ArticleFooter
              pageHref={href}
              pageTitle={page.data.title}
              editHref={`https://github.com/axiomhq/docs/edit/main/content/docs/${page.path}`}
              previous={adjacentNavigation.previous}
              next={adjacentNavigation.next}
            />
          </article>
          {hasToc && <TableOfContents items={tocItems} />}
        </div>
      </div>
    </>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();
  // The first breadcrumb is the sidebar group — "Send data", "Dashboards" — which
  // reads far better on a card than the four coarse values getSection returns.
  const [group] = getBreadcrumbs(
    getNavigation(getSection(page.url)),
    page.url,
  );
  const images = [ogImage(page.data.title, group?.title)];
  return {
    title: page.data.title,
    description: page.data.description,
    robots: page.data.noindex
      ? { index: false, follow: false }
      : undefined,
    alternates: { canonical: page.url },
    // siteName is repeated here because Next replaces the layout's openGraph
    // object wholesale rather than merging into it.
    openGraph: {
      title: page.data.title,
      description: page.data.description,
      siteName: "Axiom",
      type: "article",
      url: page.url,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: page.data.title,
      description: page.data.description,
      images,
    },
  };
}
