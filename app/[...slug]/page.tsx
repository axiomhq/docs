import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { DocsBody, DocsDescription, DocsTitle } from 'fumadocs-ui/page';
import { ApiOperation } from '@/components/api-operation';
import { mdxComponents } from '@/components/mdx-components';
import { TableOfContents, type TocItem } from '@/components/table-of-contents';
import { ArticleFooter } from '@/components/article-footer';
import { CopyPageMenu } from '@/components/copy-page';
import { ZoneLink as Link } from '@/components/zone-link';
import { withoutDocsBasePath } from '@/lib/docs-paths';
import { getAdjacentNavigation, getBreadcrumbs, getNavigation, getSection } from '@/lib/navigation';
import { ogImage } from '@/lib/og';
import { pageGraph, structuredDataProps } from '@/lib/structured-data';
import { source } from '@/lib/source';

type PageProps = { params: Promise<{ slug?: string[] }> };

// The reading column is shifted left of centre so the fixed table of contents on the
// right does not push the measure off-axis; the shift is dropped once the sidebar
// collapses into a drawer at 1240px.
const DOC_ARTICLE_CLASS = 'doc-article w-[min(768px,100%)] my-0 mx-auto translate-x-[-130px] max-xl:translate-x-0';

// The trail renders in the brand orange, so hover signals with an underline
// instead of a colour change. `[&:hover]` rather than `hover:` — Tailwind v4
// wraps `hover:` in `@media (hover: hover)`, which would drop the state on touch.
const BREADCRUMB_LINK_CLASS = '[&:hover]:underline [&:hover]:underline-offset-[3px]';

export default async function DocumentationPage({ params }: PageProps) {
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
  if (breadcrumbs.length > 0) breadcrumbs[breadcrumbs.length - 1] = { title: page.data.title };
  // Structured data keeps the full trail; the visible breadcrumb shows only the
  // first two ancestor groups — never the page itself, whose title sits directly
  // below — so deep sections can't produce long trails.
  const visibleBreadcrumbs = breadcrumbs.slice(0, -1).slice(0, 2);
  const querySyntaxTitle = section === 'query' && slug?.at(-1) !== 'overview' && slug?.some((segment) => /(?:function|operator)s?$/.test(segment));
  const Body = page.data.body;
  const tocItems: TocItem[] = page.data.openapi
    ? [
        { title: 'Parameters', url: '#parameters', depth: 2 },
        { title: 'Body', url: '#body', depth: 2 },
        { title: 'Example request', url: '#example', depth: 2 },
        { title: 'Response', url: '#response', depth: 2 },
      ]
    : page.data.toc.map((item) => ({ title: item.title, url: item.url, depth: item.depth }));

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
      <div className="article-layout relative min-h-[calc(100vh_-_56px)] pt-14 pb-24 px-[clamp(32px,6vw,96px)] max-md:px-9 max-sm:pt-9 max-sm:pb-18 max-sm:px-5">
        <article className={querySyntaxTitle ? `${DOC_ARTICLE_CLASS} query-syntax-article` : DOC_ARTICLE_CLASS}>
          <div className="doc-topline mt-0 mx-0 mb-5 flex items-start justify-between gap-x-4 gap-y-2">
            <nav className="doc-breadcrumbs m-0 flex flex-wrap gap-x-2 gap-y-1 text-(--color-accent-text) font-mono text-[12px] leading-4 font-[450]" aria-label="Breadcrumb">
              {visibleBreadcrumbs.map((item, index) => {
                const last = index === visibleBreadcrumbs.length - 1;
                return (
                  <span className="doc-breadcrumb inline-flex gap-2 min-w-0" key={`${item.title}-${index}`}>
                    {item.href ? <Link href={item.href} prefetch={false} className={BREADCRUMB_LINK_CLASS}>{item.title}</Link> : <span>{item.title}</span>}
                    {!last && <b aria-hidden="true" className="text-(--border-strong) font-normal">/</b>}
                  </span>
                );
              })}
            </nav>
            {!page.data.openapi && <CopyPageMenu markdownPath={`${href}.md`} />}
          </div>
          <DocsTitle className={querySyntaxTitle ? 'query-syntax-title' : undefined}>{page.data.title}</DocsTitle>
          <DocsDescription>{page.data.description}</DocsDescription>
          <DocsBody>
            {page.data.openapi ? <ApiOperation value={page.data.openapi}><Body components={mdxComponents} /></ApiOperation> : <Body components={mdxComponents} />}
          </DocsBody>
          <ArticleFooter
            pageHref={href}
            pageTitle={page.data.title}
            editHref={`https://github.com/axiomhq/docs/edit/main/content/docs/${page.path}`}
            previous={adjacentNavigation.previous}
            next={adjacentNavigation.next}
          />
        </article>
        {tocItems.length > 0 && <TableOfContents items={tocItems} />}
      </div>
    </>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();
  // The first breadcrumb is the sidebar group — "Send data", "Dashboards" — which
  // reads far better on a card than the four coarse values getSection returns.
  const [group] = getBreadcrumbs(getNavigation(getSection(page.url)), page.url);
  const images = [ogImage(page.data.title, group?.title)];
  return {
    title: page.data.title,
    description: page.data.description,
    robots: page.data.noindex ? { index: false, follow: false } : undefined,
    alternates: { canonical: page.url },
    // siteName is repeated here because Next replaces the layout's openGraph
    // object wholesale rather than merging into it.
    openGraph: { title: page.data.title, description: page.data.description, siteName: 'Axiom', type: 'article', url: page.url, images },
    twitter: { card: 'summary_large_image', title: page.data.title, description: page.data.description, images },
  };
}
