const SITE_ORIGIN = 'https://axiom.co';
const DOCS_URL = `${SITE_ORIGIN}/docs`;
const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;
const WEBSITE_ID = `${DOCS_URL}#website`;

type Breadcrumb = { title: string; href?: string };

/**
 * Site-level identity, emitted once from the root layout. Kept separate from the per-page graph so
 * pages can reference it by `@id` instead of repeating it.
 */
export function siteGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORGANIZATION_ID,
        name: 'Axiom',
        url: SITE_ORIGIN,
        logo: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/doc-assets/logo/light.svg` },
      },
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        name: 'Axiom Docs',
        url: DOCS_URL,
        publisher: { '@id': ORGANIZATION_ID },
      },
    ],
  };
}

/**
 * Per-page graph. `TechArticle` rather than `WebPage` because every page here is developer
 * documentation, and it is the type search engines map to a documentation result.
 *
 * No `dateModified`: the migration rewrote every file, so git reports a single date for the whole
 * corpus. Claiming every page changed at once is worse than claiming nothing — see T2.3.
 */
export function pageGraph({
  url,
  title,
  description,
  keywords,
  breadcrumbs,
}: {
  url: string;
  title: string;
  description?: string;
  keywords?: string[];
  breadcrumbs: Breadcrumb[];
}) {
  const absolute = `${SITE_ORIGIN}${url}`;
  const trail = [{ title: 'Docs', href: '/docs' }, ...breadcrumbs];

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        '@id': `${absolute}#article`,
        headline: title,
        ...(description ? { description } : {}),
        ...(keywords?.length ? { keywords: keywords.join(', ') } : {}),
        url: absolute,
        isPartOf: { '@id': WEBSITE_ID },
        publisher: { '@id': ORGANIZATION_ID },
        inLanguage: 'en',
      },
      // Pages missing from the sidebar tree have no trail, leaving just the "Docs" root. A
      // one-item breadcrumb describes no hierarchy, so it is omitted rather than published empty.
      ...(trail.length > 1
        ? [
            {
              '@type': 'BreadcrumbList',
              '@id': `${absolute}#breadcrumbs`,
              itemListElement: trail.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.title,
                ...(item.href ? { item: `${SITE_ORIGIN}${item.href}` } : {}),
              })),
            },
          ]
        : []),
    ],
  };
}

/**
 * `</script>` inside a JSON string would close the tag early, so `<` is escaped. The value is
 * inlined rather than served separately because crawlers read it from the document.
 */
export function structuredDataProps(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') };
}
