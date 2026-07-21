# Axiom Docs

This repository powers [axiom.co/docs](https://axiom.co/docs). It is a self-hosted Next.js App Router application built with Fumadocs and MDX.

## Requirements

- Node.js 24.18.0 (pinned in `.node-version`)
- pnpm 11.9.0 (pinned in `package.json`)
- Optional: [Vale](https://vale.sh/docs/install) for editorial style checks

## Local development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000/docs`. The site defaults to dark mode and stores the reader’s theme and code-placeholder values in browser storage.

## Content structure

- `content/docs/(documentation)` — product documentation and guides
- `content/docs/(query-reference)` — APL and MPL reference
- `content/docs/(api-reference)` — REST reference and the four checked-in OpenAPI documents
- `content/docs/(changelog)` — changelog entry point
- `content/snippets` — reusable MDX fragments; these are compiled but not routable
- `public/doc-assets` — documentation images, icons, and video

Parenthesized folders are Fumadocs route groups and do not appear in URLs. Public documentation routes remain under `/docs`, for example `/docs/getting-started` and `/docs/apl/overview`.

The old navigation and 115 redirects remain in `docs.json` as a migration manifest. Application code reads only its navigation tabs and redirects; Mintlify is not a runtime or build dependency.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm audit:content
pnpm build
pnpm test:e2e
```

`pnpm check` runs every non-browser check and the production build. The content audit protects the migration baseline: 645 MDX files, 624 routable pages, 21 snippets, 126 assets, 89 OpenAPI endpoint pages, and 115 redirects. It also fails on broken internal links, missing local assets, or retired Fathom/do11y references.

## Production

```bash
pnpm build
pnpm start
```

The build emits a Next.js standalone server and automatically copies its public and static assets into place. `pnpm start` runs that self-contained server with Node 24. Set `HOSTNAME` and `PORT` to override the defaults.

Set `NEXT_PUBLIC_SITE_URL` to the canonical origin used for metadata and the sitemap. It defaults to `https://axiom.co`.

## Documentation assistant

The search dialog includes an optional documentation-grounded assistant. It uses OpenRouter with `z-ai/glm-5.2`, retrieves context from the checked-in Fumadocs search index, and reads processed Markdown only for documentation pages returned by that search.

```bash
OPENROUTER_API_KEY=sk-or-v1-...
```

The key is server-only. Without it, regular documentation search continues to work and assistant requests return an unavailable response. Questions and generated answers are not persisted or sent to PostHog.

## PostHog

Analytics is disabled unless a public project token is present. Local development, tests, and unconfigured previews send no analytics requests.

```bash
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

PostHog is initialized through Next.js `instrumentation-client.ts`. Configured deployments capture the initial page view, client-side route changes, page leaves, and standard autocapture events. Person profiles are created only for identified users. There is no Fathom or do11y integration.

## AI-readable routes

- `/llms.txt` — structured index of the documentation
- `/llms-full.txt` — complete processed Markdown corpus
- `/docs/<path>.md` — processed Markdown for one page
- `/llms-apl.md` — compact APL page index retained for compatibility

## Contributing

Before opening a pull request, run `pnpm check` and `pnpm test:e2e`. For editorial guidance, see [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md).
