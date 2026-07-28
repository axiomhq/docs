import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { DocsBody, DocsDescription, DocsTitle } from 'fumadocs-ui/page';
import { DocsShell } from '@/components/docs-shell';
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
    <DocsShell navigation={navigation} activeHref={href}>
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
      <div className="article-layout">
        <article className={querySyntaxTitle ? 'doc-article query-syntax-article' : 'doc-article'}>
          <div className="doc-topline">
            <nav className="doc-breadcrumbs" aria-label="Breadcrumb">
              {visibleBreadcrumbs.map((item, index) => {
                const last = index === visibleBreadcrumbs.length - 1;
                return (
                  <span className="doc-breadcrumb" key={`${item.title}-${index}`}>
                    {item.href ? <Link href={item.href} prefetch={false}>{item.title}</Link> : <span>{item.title}</span>}
                    {!last && <b aria-hidden="true">/</b>}
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
    </DocsShell>
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
