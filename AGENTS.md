# AGENTS.md

This file is the working handbook for agents contributing to this repository. It applies to the entire repository. Read it before changing code or content, then inspect any files directly involved in the task. Do not treat this as a substitute for verifying the current implementation: the repository is under active redesign.

## Project mission

This repository powers `https://axiom.co/docs`.

The current project is a full migration away from Mintlify to a self-hosted documentation application that Axiom owns. It uses Next.js, Fumadocs, and the existing MDX/OpenAPI content while applying an Axiom-specific information architecture and visual system.

The goal is not a generic Fumadocs theme. The experience should:

- Feel native to Axiom rather than Mintlify or stock Fumadocs.
- Preserve the depth and usefulness of the existing documentation.
- Make long technical pages fast to scan and comfortable to read.
- Keep documentation, query reference, and API reference coherent while respecting their different needs.
- Remain responsive, accessible, searchable, linkable, and statically buildable.
- Provide strong foundations for future Axiom-owned components and analytics.

At the time this file was created, active redesign work is on `feat/fumadocs-redesign`. Always check the current branch and worktree before editing; do not assume `main` has the same architecture.

## Runtime and package management

- Node.js: `24.18.0`, pinned in `.node-version`.
- Package manager: `pnpm 11.9.0`, pinned in `package.json`.
- Framework: Next.js App Router, currently Next 16.
- Documentation framework: Fumadocs with `fumadocs-mdx`; API operations use the custom renderer backed by checked-in OpenAPI documents.
- Styling: Tailwind v4 is available, but most application styling is deliberate custom CSS in `app/globals.css` backed by `styles/tokens.css`.
- Unit tests: Vitest + jsdom.
- Browser tests: Playwright, desktop Chromium and Pixel 7 profiles.
- Analytics: PostHog client SDK.

Install and run locally:

```bash
pnpm install
pnpm dev --hostname 127.0.0.1 --port 3100
```

The README mentions port 3000 for general contributors. Port 3100 is the established redesign/testing port and is also the Playwright base URL. Reuse an existing server when possible instead of starting competing processes.

## Source map

### Application

- `app/layout.tsx` — root providers, local Geist fonts, theme configuration, and global metadata.
- `app/docs/[...slug]/page.tsx` — shared documentation page renderer, metadata, breadcrumbs, TOC, query-title treatment, article footer, and OpenAPI dispatch.
- `app/docs/page.tsx` — documentation landing page.
- `app/api/search/route.ts` — Fumadocs/Orama search endpoint.
- `app/api/chat/route.ts` — grounded OpenRouter assistant with constrained documentation search/read tools.
- `app/api/md/[...slug]/route.ts` — processed Markdown output for individual pages.
- `app/api/try/route.ts` — constrained server-side proxy used by API reference “Try it”. Treat this as security-sensitive.
- `app/globals.css` — layout and component styling. This file encodes many reviewed product decisions; do not broadly replace it with stock theme CSS.
- `styles/tokens.css` — Axiom primitives and semantic light/dark tokens.
- `instrumentation-client.ts` — PostHog initialization before hydration.

### Shared UI

- `components/docs-shell.tsx` — header/sidebar shell and recursive navigation.
- `components/docs-search.tsx` — unified, debounced Search/Ask AI dialog and ranked search results.
- `components/docs-assistant.tsx` — lazily loaded assistant conversation UI and source presentation.
- `components/markdown.tsx` — bounded streaming Markdown renderer for assistant answers.
- `components/site-header.tsx` — top-level section tabs, unified search/AI entry point, theme menu, and console link.
- `components/table-of-contents.tsx` — transparent floating TOC and scroll tracking.
- `components/heading-anchor.tsx` — hover hash, smooth navigation, clipboard copy, and Sonner feedback.
- `components/mdx-components.tsx` — compatibility boundary between legacy MDX constructs and Axiom/Fumadocs components.
- `components/api-operation.tsx` — OpenAPI operation rendering, schemas, request samples, and response details.
- `components/api-code-block.tsx` — persistent cURL/JavaScript/Python/Go tabs.
- `components/api-try-it.tsx` — browser-side “Try it” fields, credential persistence, and result presentation.
- `components/article-footer.tsx` — PostHog-backed helpfulness feedback, previous/next links, and GitHub edit link.
- `components/language-comparisons.tsx` — compact APL migration comparisons.
- `components/placeholder-code.tsx` — interactive placeholder replacement in code examples.

### Content and generation

- `content/docs/(documentation)` — product documentation and guides.
- `content/docs/(query-reference)` — APL and MPL reference.
- `content/docs/(api-reference)` — REST API prose, endpoint pages, and OpenAPI files.
- `content/docs/(changelog)` — changelog route content. The changelog is intentionally not a top-header tab.
- `content/snippets` — reusable MDX fragments. Snippets compile but are not routable pages.
- `public/doc-assets` — checked-in images, icons, videos, and Axiom logos.
- `source.config.ts` — Fumadocs frontmatter schema and processed-Markdown generation.
- `lib/source.ts` — Fumadocs source loader at `/docs`.
- `lib/navigation.ts` — navigation conversion, section detection, API method labels, and article adjacency.
- `lib/openapi.ts` — OpenAPI lookup and schema utilities.
- `docs.json` — migration manifest for navigation and redirects. It is no longer a Mintlify runtime config.
- `lib/redirects.mjs` — redirect extraction used by Next.js.
- `scripts/audit-content.mjs` — migration-baseline and link/asset audit.

Generated directories/files include `.next`, `.source`, `test-results`, `tsconfig.tsbuildinfo`, and most of `.vercel`. Do not hand-edit or commit generated output.

## Content model and routing

Parenthesized content folders are route groups and are omitted from public URLs. For example:

- `content/docs/(documentation)/getting-started.mdx` → `/docs/getting-started`
- `content/docs/(query-reference)/apl/overview.mdx` → `/docs/apl/overview`
- `content/docs/(api-reference)/restapi/introduction.mdx` → `/docs/restapi/introduction`

Frontmatter extends the Fumadocs page schema with:

- `sidebarTitle?: string`
- `keywords?: string[]`
- `openapi?: string`
- `noindex?: boolean`
- `mode?: string`

Unknown legacy fields are currently accepted to keep the migration compatible. Do not remove that compatibility without auditing all MDX.

Application code reads the first three navigation tabs and redirects from `docs.json`. Keep navigation ordering there in sync with page additions, removals, and moves. Previous/next article links are derived from that same ordering, so a navigation edit also changes pagination.

The current content audit intentionally locks the migration baseline:

- 624 routable MDX pages
- 21 snippets
- 645 total MDX files
- 126 documentation assets
- 89 OpenAPI endpoint pages
- 115 redirects

If a legitimate task changes one of these counts, update `scripts/audit-content.mjs` in the same commit and explain why. Never relax the audit only to make a failing check pass.

Internal MDX links frequently retain pre-migration root paths such as `/apl/...`. `DocsLink` in `components/mdx-components.tsx` prefixes eligible internal paths with `/docs`. Preserve this behavior unless content is migrated atomically. Links to `/doc-assets`, `/llms*`, hashes, and external URLs have distinct handling.

The AI-readable surfaces are product features and must continue to work:

- `/llms.txt`
- `/llms-full.txt`
- `/llms-apl.md`
- `/docs/<path>.md`

## MDX compatibility layer

Mintlify-specific content was retained by mapping its constructs in `components/mdx-components.tsx`. Important mappings include:

- `Info`, `Note`, `Tip`, `Warning`, and `CallOut` → Axiom notices.
- `Accordion` and `AccordionGroup` → Fumadocs accordion primitives with compact custom styling.
- `Tabs` and `Tab` → a shared compact tab treatment.
- `LanguageComparisons` → the query-language comparison control.
- `Card`, `CardGroup`, `Cards`, `Steps`, and `Step` → Fumadocs primitives.
- `Frame`, `CodeGroup`, `ParamField`, and `ResponseField` → custom compatibility components.
- All Markdown headings → `HeadingAnchor`.
- Markdown `pre` → interactive placeholder-aware code rendering.

Prefer improving a shared mapping over manually rewriting hundreds of pages. Rewrite MDX when the content order or semantics are genuinely wrong, not just to work around a reusable rendering issue.

## Design contract

The design has gone through detailed browser review. Treat the following as product requirements, not incidental styling.

### Overall layout

- Main article content must feel centered in the viewport, not merely centered in the area to the right of the sidebar.
- The desktop article transform compensates for the fixed sidebar. Do not remove it without verifying 1440px, 1024px, and 768px viewport centering.
- The sidebar’s first group heading aligns horizontally with the article breadcrumbs on initial load.
- Protect tablet and small-screen margins; switch to the drawer navigation at the established breakpoint.
- Avoid decorative shadows. Axiom surfaces use borders, small tonal shifts, and compact spacing.
- Border radii are restrained, normally 3–4px. Do not introduce large rounded cards or pill-heavy UI.
- Axiom’s primary interaction accent is orange (`--color-accent` / `--orange-500`), not blue. Status colors may still use blue/green/amber/red where semantically appropriate.

### Typography and reading rhythm

- Body copy is deliberately lower contrast than headings and bold text. In dark mode it is lighter than the canvas but darker than headings; light mode uses the inverse hierarchy.
- Do not flatten all copy to the same contrast.
- Prose spacing and line-height are tuned in `app/globals.css`; check adjacent heading combinations before changing global margins.
- Direct parent/subsection headings (`h2 + h3`, `h3 + h4`) have tighter spacing than unrelated sections.
- APL/MPL function and operator page titles use a true monospace stack. Related function/operator links also use monospace.
- Inline code remains compact and clearly distinct from prose.

### Header and navigation

- Use the full Axiom wordmark with the Docs badge; do not combine the wordmark and separate icon mark.
- Header tabs are Documentation, Query reference, and API reference. Do not add Changelog unless explicitly requested.
- Search and “Ask AI” are one entry point because Fumadocs search provides both behaviors.
- “Open console” is sentence case.
- Theme defaults to system and uses `next-themes` local persistence under `axiom-docs-theme`. The menu offers System, Dark, and Light with matching icons.
- Sidebar expansion chevrons sit on the right, so nested labels do not acquire awkward left indentation.
- All ancestors of the active sidebar page remain expanded during navigation.
- API method badges sit at the right edge of sidebar rows, after the endpoint name.
- API group headings use resource plurals such as “API tokens” and “Datasets”, not “... endpoints”.

### Article chrome

- The floating “On this page” control has no card background.
- Its active item follows scroll position and uses a small terminal-like rectangular marker, not a dot.
- Heading hashes appear on hover/focus. Clicking a heading copies the full anchor URL and shows a Sonner notification.
- Notices use a colored left border, a subtly distinct background, no icon, and no shadow. Notice copy is monospace at the compact 12px/19px treatment.
- The article footer contains helpful/not-helpful feedback, previous/next pages, and “Suggest edits on GitHub”.

### Code, tabs, tables, and query examples

- Use syntax highlighting for all code samples with readable light and dark themes.
- Copy controls appear on hover/focus rather than permanently dominating every code block.
- A query example’s “Run in Playground” action is inset at the top-right of the query block, opens a new tab, and aligns with the copy control.
- Use the same compact tab language across API samples and MDX examples.
- Tab content must use a visibly different surface from the tab bar.
- Tables should share a consistent compact style across prose, query output, and API schemas.
- API schema rows are compact, nested object children are visibly indented, and location has its own column when present.
- Query-language comparisons belong at the end of function/operator pages and use the compact shared comparison component rather than large repeated accordions.

## API reference requirements

The four checked-in OpenAPI documents are:

- `content/docs/(api-reference)/restapi/versions/v1.json`
- `content/docs/(api-reference)/restapi/versions/v1-edge-ingest.json`
- `content/docs/(api-reference)/restapi/versions/v1-edge-query.json`
- `content/docs/(api-reference)/restapi/versions/v2.json`

Endpoint pages reference operations through the `openapi` frontmatter value. `ApiOperation` is responsible for:

- Endpoint method/path display.
- Request parameters and body schema.
- Response schema, including list endpoints.
- Recursive object/array rows to a bounded depth.
- High-contrast Shiki output.
- cURL, JavaScript, Python, and Go examples.
- A global language choice persisted as `axiom-docs-api-language`.
- The “Try it” control adjacent to request examples.

Do not restore static fake response payloads beneath every endpoint. The product direction is an expandable request runner that accepts documented parameters and shows the real response.

### “Try it” security and credential behavior

This area handles user credentials. Preserve all of the following unless a task explicitly redesigns the security model:

- Credentials are stored only in `sessionStorage`, never local storage or cookies.
- Credential inputs carry `data-ph-no-capture` so PostHog does not capture them.
- API tokens (`xaat...`) do not require or forward an organization ID.
- Personal access token variants (`xapt...` and `xaapt...`) require an organization ID.
- The server accepts only operations found in the checked-in OpenAPI documents.
- Requests may target only HTTPS `api.axiom.co` or `*.edge.axiom.co` hosts on the standard port.
- Redirects are rejected.
- Upstream requests use a 15-second timeout and `no-store` caching.
- Request bodies are capped at 256 KiB.
- Response previews are capped at 1 MiB.
- Error responses must not echo secrets.
- Automated tests must use mock credentials and mocked upstream responses. Do not run live Axiom API requests with a user’s token.
- Do not inspect, print, copy, or persist credentials from an existing browser session while debugging.

Any change to `app/api/try/route.ts`, token detection, credential storage, or PostHog capture attributes requires focused tests.

## Analytics and privacy

PostHog is optional and initialized only when `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` is present. Production values are supplied through Vercel:

- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`
- `NEXT_PUBLIC_POSTHOG_HOST`

The root `instrumentation-client.ts` explicitly enables initial/history-change pageviews, page leaves, and autocapture with identified-only person profiles. Local development, tests, and unconfigured preview deployments must send no PostHog traffic.

The page-feedback event is `docs_page_feedback_submitted` and currently includes only:

- `helpful`
- `page_path`
- `page_title`

Do not add credentials, request/response bodies, search text, free-form documentation feedback, or other potentially sensitive values to analytics without an explicit product/privacy decision. Fathom and do11y are retired and must not be reintroduced.

## Search, theme, and browser persistence

- Search is generated from the Fumadocs source and exposed at `/api/search`.
- Search and AI prompting intentionally share the same custom dialog; the assistant bundle loads only when Ask AI is opened.
- Theme preference uses local storage through `next-themes`.
- API language preference uses local storage.
- Interactive code placeholders may use browser storage.
- API credentials use session storage only.

When adding persistence, document the key, choose the least durable storage that satisfies the feature, and add hydration-safe behavior and tests.

## Testing and verification

Run focused checks while iterating, then proportionate full checks before handoff.

Non-browser checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm audit:content
pnpm build
```

`pnpm check` runs all of the above in sequence.

Browser checks:

```bash
pnpm test:e2e
```

Playwright uses `http://127.0.0.1:3100`, reuses an existing local server outside CI, and runs both desktop and mobile projects. A focused test can be run with:

```bash
pnpm exec playwright test tests/e2e/docs.spec.ts -g "relevant test name"
```

Testing expectations:

- Add or update Vitest coverage for data transformation, security behavior, and initialization logic.
- Add or update Playwright coverage for visual contracts, navigation state, responsive behavior, persistence, and interaction.
- For CSS-only changes, still run lint and type-check plus the most relevant E2E test.
- For shared page rendering or navigation changes, run a production build because all documentation paths are statically generated.
- For content changes, run `pnpm audit:content` and verify links/assets.
- For API rendering changes, test both a single-resource endpoint and a list endpoint.
- For analytics changes, verify configured initialization and tokenless silence.

When the in-app browser is available, use it for the final visual pass on the exact URL mentioned in feedback. Inspect computed styles or geometry where the issue concerns alignment, typography, or responsive layout. Use a temporary tab for verification and close it afterward; do not disrupt the user’s working tabs. Automated tests complement this pass rather than replacing it.

## Accessibility baseline

- Use semantic headings in order; do not change heading levels solely for visual size.
- Preserve named navigation regions, button labels, tab roles, `aria-selected`, `aria-current`, and status/alert announcements.
- Interactive controls must remain keyboard accessible with visible focus.
- Icon-only controls require accessible names; decorative icons should be hidden from assistive technology.
- Verify mobile navigation and search by keyboard/touch when their code changes.
- Respect `prefers-reduced-motion`.
- Maintain readable contrast in both themes.

## Working with content

- Follow the Google developer documentation style guide and `.github/CONTRIBUTING.md`.
- Preserve the author’s intended technical meaning. Do not invent product behavior or rewrite architecture claims without a source or explicit request.
- Prefer sentence case in UI and documentation headings.
- Keep code, commands, function names, operators, paths, field names, and tokens in monospace.
- Use reusable snippets for genuinely shared procedures; avoid copy-paste divergence.
- Keep related-function references as real links.
- Preserve redirects when moving or renaming a route.
- Avoid bulk mechanical MDX rewrites without an audit and representative visual review.

## Git and collaboration hygiene

- Inspect `git status --short` before editing.
- Existing modifications may belong to the user or another agent. Do not overwrite, stage, reformat, or commit them unless they are part of the assigned task.
- Stage explicit paths instead of `git add .` when the worktree contains unrelated changes.
- At the time this file was written, `.gitignore` had a separate uncommitted `.vercel` ignore entry. Preserve it unless the user assigns it.
- Do not use destructive commands such as `git reset --hard` or discard another contributor’s changes.
- Keep commits single-purpose with action-oriented messages.
- Push the active branch after the requested checks when the user asks for committed work.
- Report the commit hash, checks run, and any deliberately uncommitted user changes in the handoff.

## Common change recipes

### Add or move a documentation page

1. Add/move the MDX in the correct route group.
2. Update navigation ordering in `docs.json`.
3. Add a redirect for a moved public route.
4. Verify frontmatter and internal links.
5. Run the content audit, relevant browser test, and production build.

### Change a shared MDX component

1. Find representative pages in documentation, query reference, and API reference.
2. Update `components/mdx-components.tsx` and shared CSS rather than page-specific hacks.
3. Test light/dark and desktop/mobile.
4. Confirm migrated legacy syntax still renders.

### Change API rendering

1. Inspect the relevant OpenAPI operation and schema shape.
2. Test nested objects, arrays, required fields, and list responses.
3. Verify all four code languages and syntax highlighting.
4. Verify the stored language follows client-side navigation.
5. If touching “Try it”, apply the security checklist above and run `tests/api-try.test.ts`.

### Change typography or layout

1. Use semantic tokens and existing prose variables.
2. Check the exact reported page in both themes.
3. Check 1440px desktop, 1024px tablet, 768px portrait tablet, and a ~390px phone viewport as relevant.
4. Verify article centering, sidebar alignment, TOC behavior, and heading anchors.

## Completion checklist

Before declaring a task complete:

- The requested behavior is implemented, not merely described.
- The exact reported route has been verified when the task is visual or interactive.
- Light/dark and responsive implications were considered.
- Accessibility semantics remain intact.
- No credentials or sensitive values can reach logs or analytics.
- Focused tests pass.
- Broader checks are run in proportion to the blast radius.
- `git diff --check` passes.
- Unrelated worktree changes remain untouched.
- Requested commits are pushed and reported with their hash.
