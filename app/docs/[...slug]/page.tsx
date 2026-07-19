import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DocsBody, DocsDescription, DocsTitle } from 'fumadocs-ui/page';
import { DocsShell } from '@/components/docs-shell';
import { ApiOperation } from '@/components/api-operation';
import { mdxComponents } from '@/components/mdx-components';
import { TableOfContents, type TocItem } from '@/components/table-of-contents';
import { ArticleFooter } from '@/components/article-footer';
import { getAdjacentNavigation, getBreadcrumbs, getNavigation, getSection } from '@/lib/navigation';
import { source } from '@/lib/source';

type PageProps = { params: Promise<{ slug?: string[] }> };

export default async function DocumentationPage({ params }: PageProps) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const href = page.url;
  const section = getSection(href);
  const navigation = getNavigation(section);
  const adjacentNavigation = getAdjacentNavigation(navigation, href);
  const breadcrumbs = getBreadcrumbs(navigation, href);
  if (breadcrumbs.length > 0) breadcrumbs[breadcrumbs.length - 1] = { title: page.data.title };
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
      <div className="article-layout">
        <article className={querySyntaxTitle ? 'doc-article query-syntax-article' : 'doc-article'}>
          <nav className="doc-breadcrumbs" aria-label="Breadcrumb">
            {breadcrumbs.map((item, index) => {
              const current = index === breadcrumbs.length - 1;
              return (
                <span className="doc-breadcrumb" key={`${item.title}-${index}`}>
                  {item.href && !current ? <Link href={item.href}>{item.title}</Link> : <span aria-current={current ? 'page' : undefined}>{item.title}</span>}
                  {!current && <b aria-hidden="true">/</b>}
                </span>
              );
            })}
          </nav>
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
  return {
    title: page.data.title,
    description: page.data.description,
    robots: page.data.noindex ? { index: false, follow: false } : undefined,
    alternates: { canonical: page.url },
    openGraph: { title: page.data.title, description: page.data.description, type: 'article', url: page.url },
  };
}
