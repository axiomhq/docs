import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocsBody, DocsDescription, DocsTitle } from 'fumadocs-ui/page';
import { DocsShell } from '@/components/docs-shell';
import { ApiOperation } from '@/components/api-operation';
import { mdxComponents } from '@/components/mdx-components';
import { getNavigation, getSection } from '@/lib/navigation';
import { source } from '@/lib/source';

type PageProps = { params: Promise<{ slug?: string[] }> };

export default async function DocumentationPage({ params }: PageProps) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const href = page.url;
  const section = getSection(href);
  const Body = page.data.body;

  return (
    <DocsShell navigation={getNavigation(section)} activeHref={href}>
      <div className="article-layout">
        <article className="doc-article">
          <div className="doc-breadcrumbs"><span>{section === 'query' ? 'Query reference' : section === 'api' ? 'API reference' : section === 'changelog' ? 'Updates' : 'Documentation'}</span><b>/</b><span>{page.data.title}</span></div>
          <DocsTitle>{page.data.title}</DocsTitle>
          <DocsDescription>{page.data.description}</DocsDescription>
          <DocsBody>
            {page.data.openapi ? <ApiOperation value={page.data.openapi}><Body components={mdxComponents} /></ApiOperation> : <Body components={mdxComponents} />}
          </DocsBody>
          <div className="article-footer">
            <a href={`https://github.com/axiomhq/docs/edit/main/content/docs/${page.path}`} target="_blank" rel="noreferrer">Edit this page on GitHub</a>
          </div>
        </article>
        {(page.data.toc.length > 0 || page.data.openapi) && (
          <aside className="floating-toc" aria-label="On this page">
            <strong>On this page</strong>
            {page.data.openapi ? <><a href="#parameters">Parameters</a><a href="#body">Body</a><a href="#example">Example request</a><a href="#response">Response</a></> : page.data.toc.map((item) => <a key={item.url} href={item.url} style={{ paddingLeft: Math.max(0, item.depth - 2) * 10 }}>{item.title}</a>)}
          </aside>
        )}
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
