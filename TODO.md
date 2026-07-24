# Release TODO — Mintlify → Fumadocs cutover

Working checklist for shipping `feat/fumadocs-redesign` to `axiom.co/docs`.
Tasks are in **dependency order**. Work top to bottom; do not skip ahead.

**Status of the branch as audited (2026-07-24):** `eslint`, `tsc --noEmit`, `vitest` (18 tests),
`audit:content`, and `next build` (636 static pages) all pass. `.next/standalone/server.js` boots and
serves correctly. The app is sound — everything below is routing, content drift, or launch hygiene.

## How to use this file

- Do one task per commit. Tick the box only after its **Verify** command passes.
- 🚫 **NEVER edit `~/Desktop/Axiom/www`.** It is read-only for this work — read it to understand
  behaviour, never modify it. Everything it needs is collected in **Phase 4**, to be filed as a single
  request at the very end, after all `docs`-side work is done and verified. Items tagged `[HANDOFF]`
  point there; they are never tasks to do inline.
- So: all *work* happens in this repo (`~/Desktop/Axiom/docs`). The front door — the `/docs` proxy,
  `robots.txt`, and a second redirect table — lives in `www` and is observed only.
- **Nothing in Phases 0–3 depends on a `www` change.** You can complete the entire checklist, run the
  release gate against staging, and be fully ready to ship without touching it.
- Tasks marked `[HUMAN]` need a decision from the team — stop and ask, do not guess. (None remain
  open: T0.1 was the only one and it is now decided.)
- Findings are labelled `[verified]` (reproduced directly against live URLs / git) or
  `[unverified]` (reported by audit, needs confirmation before acting).
- Node ≥24 is required. Local default is 22.16.0 — use `/opt/homebrew/opt/node/bin/node` or `nvm use 24`.
- Never run `pnpm build` while a dev server is running; it clobbers `.next`.

---

## Phase 0 — Prerequisites

### [x] T0.1 ~~Decide the deployment topology~~ — **DECIDED: `axiom.co/docs`**

**The site ships at `axiom.co`, serving docs under `/docs`.** `docs.axiom.dev` is staging only.
Everything below assumes this. No further decision needed.

**How it actually works — the marketing repo owns the front door.** `~/Desktop/Axiom/www`
(branch `main`) proxies docs via a Next.js rewrite, `www/next.config.ts:65-78`:

```ts
async rewrites() {
  return { beforeFiles: [
    { source: "/docs/:path*", destination: "https://axiom.mintlify.dev/docs/:path*" },
  ]};
}
```

Three consequences that shape this entire file:

1. **Cutover is a one-line rewrite swap in `www`, not a DNS change.** Point `destination` at the new
   deployment and redeploy `www`. Rollback is reverting that line — minutes, not a DNS TTL.
2. **It is a rewrite, not a redirect** — the URL bar stays on `axiom.co` and the docs app receives the
   full `/docs/...` path. This is why `basePath` must not be added (see below) and why the docs app's
   own routes are already correct.
3. **`/docs/:path*` is the only thing proxied.** Everything else on `axiom.co` — including
   `/robots.txt` and `/sitemap.xml` — is served by `www` and never reaches the docs app.

And three consequences for this repo:

- **Canonicals are already correct.** Every `[...slug]` page emits
  `<link rel="canonical" href="https://axiom.co/docs/..."/>` and the sitemap uses the same origin.
  Nothing to change — this was only a risk under the rejected subdomain option.
- **Do NOT set `basePath: '/docs'`.** ⚠️ Content routes already live at `app/docs/[...slug]`, so the
  app serves `/docs/getting-started` at its own origin root today. Adding `basePath` would serve them
  at `/docs/docs/getting-started`. The proxy passes the full path through, so content routing already
  works as-is.
- **The actual defect is narrower than it first looked:** only the *root-mounted* routes are wrong.
  `app/sitemap.ts`, `app/llms.txt/`, `app/llms-full.txt/`, `app/llms-apl.md/` sat at the origin root,
  which under an `axiom.co/docs` proxy is territory owned by the marketing app and never forwarded to
  us. They must move under `app/docs/` — T1.3 (sitemap, ✅ done) and T1.4 (the three `llms*` routes).
  `app/robots.ts` is the exception: it stays at the root and is simply inert in production, because
  `robots.txt` is only honoured at an origin root and that file belongs to `www`.

**Verify:** `rg 'basePath' next.config.mjs` → no matches (confirming we did not add one).

### [ ] T0.2 Set `NEXT_PUBLIC_SITE_URL=https://axiom.co` in the **production build env only**

**This is an env var, not a code change.** No files change. Four consumers read it, all identically:

```
app/layout.tsx:21          metadataBase        ← drives every canonical and og:url
app/docs/sitemap.ts:5      sitemap <loc> origin
app/robots.ts:4            sitemap declaration  (inert on production — www serves robots.txt)
app/api/chat/route.ts:134  OpenRouter attribution header
```

`NEXT_PUBLIC_` means it is **inlined at build time**, not read at runtime. Changing it requires a
rebuild, not a restart.

#### ⚠️ Set it on production only. Leave staging and preview UNSET.

`app/docs/[...slug]/page.tsx:83` sets `canonical: page.url` — a **relative** path. Next resolves it
against `metadataBase`, so this one var decides the canonical origin for all 626 pages:

| Build env | `metadataBase` | canonical emitted | Effect |
|---|---|---|---|
| Staging, **unset** (today) | `https://axiom.co` | `https://axiom.co/docs/…` | ✅ points at production |
| Staging, set to the staging URL | `https://docs.axiom.dev` | `https://docs.axiom.dev/docs/…` | ❌ staging self-canonicalizes |

Staging is crawlable (`robots.txt` → `Allow: /docs/`), so today's cross-domain canonical is the only
thing stopping it being indexed as a rival copy of the docs. **Setting it "correctly" per environment
would remove that protection** — the intuitive move is the harmful one. See T2.9.

#### Why do it at all, then?

Practical effect on production today is **zero** — the fallback already equals the production origin.
This is drift insurance, not a bug fix: a silent default that is right by coincidence breaks silently
the day someone edits the fallback or deploys to a different origin. Two minutes, no risk.

One real behaviour change to expect: `app/api/chat/route.ts:134` has a **different** fallback,
`'https://axiom.co/docs'` (note the `/docs`). Setting the var to `https://axiom.co` changes that
consumer's `appUrl` to the bare origin. It only affects an OpenRouter attribution header, so the
impact is cosmetic — but normalize the four fallbacks while you are in there.

**Verify** — only meaningful *after* W1; `axiom.co/docs/sitemap.xml` is served by Mintlify until then.
Check staging instead, which must still emit production canonicals:
```bash
curl -s <staging>/docs/introduction | grep -o '<link rel="canonical"[^>]*>'
# → https://axiom.co/docs/introduction   (NOT the staging host)
```

---

## Phase 1 — Blockers (must land before the rewrite swap)

### [x] T1.1 ~~Merge `main`~~ — **DONE: ported 3 pages + 2 edits, no merge** `[verified]`

`origin/main` is **not** an ancestor of HEAD. Commit `b5cab9e` (PR #679) shipped three guides that do
not exist on this branch at all:

| URL | prod | new site |
|---|---|---|
| `/docs/send-data/statsd` | 200 | **404** |
| `/docs/send-data/traefik` | 200 | **404** |
| `/docs/send-data/pgbouncer` | 200 | **404** |

All three are in production's live sitemap. Cutting over today deletes three indexed pages.

Same commit also carries edits this branch lacks:
- `content/docs/(documentation)/send-data/methods.mdx` — 0 mentions of the three shippers on this
  branch; the production page has table rows for all three.
- `content/docs/(documentation)/send-data/opentelemetry.mdx` — this branch still ships the **pre-fix,
  invalid** metrics pipeline (`processors:` as a map). `main` corrected it to a list plus a top-level
  `processors:` block. We would hand users a collector config production already fixed.

#### ✅ DONE — ported, deliberately NOT merged

`git merge origin/main` was **rejected on purpose.** `main` is still the Mintlify tree, where content
lives flat at `send-data/*.mdx`; here it lives at `content/docs/(documentation)/send-data/*.mdx`. A
merge would have added the files at the old paths (unroutable), and fought over `docs.json`,
`README.md` and every other file the redesign rewrote.

Instead the single missing commit `b5cab9e` — 5 files, no `docs.json` change — was ported by content:

| File | Action |
|---|---|
| `send-data/statsd.mdx` | new → `content/docs/(documentation)/send-data/` |
| `send-data/traefik.mdx` | new → same |
| `send-data/pgbouncer.mdx` | new → same |
| `send-data/methods.mdx` | 3 table rows added, alphabetical position preserved |
| `send-data/opentelemetry.mdx` | metrics `processors:` block corrected to match `main` |

Two transformations were required — **the reason a merge would have shipped broken**:

1. **Snippet imports.** Mintlify absolute `from "/snippets/x.mdx"` → `from "@/content/snippets/x.mdx"`.
2. **Code fences.** The new pages used ` ```mpl `, which Mintlify tolerated and **Shiki rejects** —
   `next build` failed with `ShikiError: Language 'mpl' not found`. This branch standardizes on
   ` ```kusto ` for APL/MPL (1,884 uses in `(query-reference)`, zero uses of `mpl`). Rewrote both.

⚠️ **Apply both transformations to any future port from `main`.** Neither is caught by
`audit:content`; only `next build` catches the fence one.

**Verified:** files byte-identical to `main` apart from the import rewrite · `next build` ✓ 639 pages
(636 → +3) · all 3 pages serve 200 from the standalone server · snippets render (not empty) · `methods`
links all 3 · lint ✓ · 18 tests ✓ · `audit:content` ✓.

**Note:** the audit baseline was bumped 626→629 / 647→650 to keep the gate green. That is a patch, not
T1.2 — the exact-equality freeze is still there and still needs replacing.

### [x] T1.2 ~~Unfreeze `scripts/audit-content.mjs`~~ — **DONE: floors + invariants** `[verified]`

Baseline was bumped to 629/650 during T1.1 so the gate would pass, but the underlying problem is
untouched: `scripts/audit-content.mjs:66` is still exact-equality against a frozen snapshot:

```js
const expected = results.routablePages === 626 && results.snippets === 21 && results.mdxTotal === 647
  && results.assets === 129 && results.redirects === 115 && results.openapiPages === 89;
```

`package.json:19` wires it into `pnpm check`; `.github/workflows/ci.yml` runs `pnpm check` on
`push: [main]`. Merging T1.1 changes these counts and **fails CI immediately**. Worse, once this lands
on `main`, every future content PR fails on arrival — it is a freeze, not a check.

Change to lower-bound assertions (counts must not *drop*) and keep the genuinely valuable parts —
`unresolvedLinks`, `missingAssets`, `retiredAnalyticsReferences` — as exact-zero checks.

Note `README.md:44` documents a **third**, stale baseline (645 mdx / 624 pages / 126 assets). Fix it
to match reality while you are here.

#### ✅ DONE

Split into the two jobs it was conflating:

- **Invariants — zero tolerance, forever.** `unresolvedLinks`, `missingAssets`,
  `retiredAnalyticsReferences`. These are defects at any corpus size.
- **Floors — the corpus may grow, never silently shrink.** Replaces the exact-equality snapshot.
  Failures now name the offending metric instead of exiting 1 silently.

`README.md` corrected: it documented a third baseline (645/624/126) matching neither the code nor
reality, and described the counts as a frozen "migration baseline" rather than floors.

**Tested all six paths:**

| Case | Expected | Result |
|---|---|---|
| current tree | pass | ✓ exit 0 |
| add a page (630/651) | pass | ✓ exit 0 |
| delete 2 pages | fail | ✓ `routablePages fell to 627, floor is 629` |
| broken internal link, counts unchanged | fail | ✓ `1 unresolved links` |
| `fathom` reference reintroduced | fail | ✓ `1 retired analytics references` |
| restored | pass | ✓ exit 0 |

Destructive cases were run in a scratch copy, never in the repo. Suite after: audit ✓ · lint ✓ ·
18 tests ✓.

⚠️ **Raise a floor only when content is deliberately retired — never to quiet a red build.** That
reflex is what this task existed to remove.

### [x] T1.3 ~~Serve `/docs/sitemap.xml`~~ — **repo side DONE; robots deferred to W2** `[verified]` `[HANDOFF]`

Sitemap discovery is broken end to end:

```
axiom.co/docs/sitemap.xml         200, 624 locs   ← the URL registered in Search Console
docs.axiom.dev/docs/sitemap.xml   404             ← FIXED, now 200 locally
docs.axiom.dev/sitemap.xml        200, 624 locs   ← FIXED, now 404
docs.axiom.dev/docs/robots.txt    404             ← stays 404 by design, see part 2
```

And `app/robots.ts:5` advertises `${origin}/sitemap.xml` → `https://axiom.co/sitemap.xml`, which is the
**marketing** sitemap containing **zero** docs URLs.

At cutover, Google's registered sitemap URL 404s and the sitemap robots does point to has none of our
626 pages — at exactly the moment every page's markup and internal links change. Recrawl stalls for
weeks instead of days.

#### ✅ Part 1 DONE — in this repo

Moved `app/sitemap.ts` → **`app/docs/sitemap.ts`**, and updated `app/robots.ts` to advertise
`${origin}/docs/sitemap.xml`.

Not `app/docs/sitemap.xml/route.ts` as originally planned: Next's `sitemap` metadata convention
works in nested segments, so `app/docs/sitemap.ts` maps to `/docs/sitemap.xml` on its own
(`is-metadata-route.js:118` matches any path ending in `/sitemap.xml`, not just root). Verified by
build, not assumed — a hand-rolled route handler would have been redundant.

`app/robots.ts` stays at the root and keeps a comment explaining it serves staging only; production
`/robots.txt` is outside the proxied prefix and belongs to `www`. Its sitemap line was pointing at a
URL that now exists nowhere, so it was corrected regardless.

**Verified from the standalone server:**

| Route | Before | After |
|---|---|---|
| `/docs/sitemap.xml` | 404 | **200**, 629 `<loc>`, origin `https://axiom.co` |
| `/sitemap.xml` | 200 | **404** (correctly gone) |
| `/robots.txt` | `Sitemap: …/sitemap.xml` | `Sitemap: …/docs/sitemap.xml` |

`next build` ✓ 639 pages · audit ✓ · lint ✓ · typecheck ✓ · 18 tests ✓. Do **not** add `basePath`
(see T0.1).

**Fix, part 2 — `[HANDOFF]` to the `www` owners. Recommended, not mandatory.** ⚠️

`robots.txt` is only honoured at an **origin root**, and `/robots.txt` is not inside the proxied
`/docs/:path*` prefix — so it is served by `www/src/app/robots.ts` and this repo's `app/robots.ts`
never runs on production at all. Moving it under `app/docs/` fixes nothing; a file at
`axiom.co/docs/robots.txt` is ignored by every crawler.

`www/src/app/robots.ts:64` currently emits one sitemap:

```ts
sitemap: `${siteConfig.url}/sitemap.xml`,     // → https://axiom.co/sitemap.xml, 284 locs, 0 of them /docs
```

Change to declare both (multiple `Sitemap:` lines are valid and standard):

```ts
sitemap: [`${siteConfig.url}/sitemap.xml`, `${siteConfig.url}/docs/sitemap.xml`],
```

**Why it is only *recommended*:** Google's primary sitemap source is the Search Console submission,
not robots.txt. If `axiom.co/docs/sitemap.xml` is already registered there — it returns 200 with 624
locs today — then serving that URL from this repo (part 1) is sufficient on its own, and the robots
line is redundancy rather than a requirement.

⚠️ **Verify the Search Console registration before deciding to skip it.** Nobody has confirmed what is
actually registered; that requires console access. If it is *not* registered, this handoff becomes
mandatory and the sitemap is otherwise undiscoverable.

Either way, do not edit `www`. This is **W2 in Phase 4** — filed at the end, not now.

Keep this repo's `app/robots.ts` only to give staging hosts crawl directives, and add a comment saying
it is inert on production. Note it currently emits `Allow: /docs/` with no `Disallow`, so staging is
fully crawlable — see T2.9.

**Verify:**
```bash
curl -s https://axiom.co/docs/sitemap.xml | grep -c '<loc>'      # >= 624
curl -s https://axiom.co/robots.txt | grep -c 'docs/sitemap.xml' # must be 1 — the marketing-side fix
```

### [x] T1.4 ~~Serve the `/docs/llms*` surface~~ — **DONE** `[verified]`

The entire machine-readable surface 404s at the URLs Axiom advertises:

| URL | prod | new site |
|---|---|---|
| `/docs/llms.txt` | 200 | **404** |
| `/docs/llms-full.txt` | 200 | **404** |
| `/docs/llms-apl.md` | 200 | **404** |
| `/docs/llms-apl` | 200, **in prod sitemap** | **404, no redirect** |

They are served only at origin root — `/llms.txt`, `/llms-full.txt`, `/llms-apl.md` all return 200.
`/docs/llms.txt` is the ecosystem-standard URL AI crawlers fetch.

Move all three route directories under `app/docs/` — they are self-contained `route.ts` handlers with
`export const dynamic = 'force-static'`, so the move is purely a path change:

```
app/llms.txt/route.ts       → app/docs/llms.txt/route.ts
app/llms-full.txt/route.ts  → app/docs/llms-full.txt/route.ts
app/llms-apl.md/route.ts    → app/docs/llms-apl.md/route.ts
```

Serving 200s at the historic URLs is better than redirecting here — these are fetched by machines that
often do not follow redirects.

#### ✅ DONE

All three directories moved; `dynamic = 'force-static'` meant the move was purely a path change.

Also fixed `app/docs/llms.txt/route.ts:8`, which emitted a body link to `/llms-full.txt` — a URL that
no longer exists after the move. Now `/docs/llms-full.txt`.

`content/llms-apl.md` (read via `process.cwd()`) was confirmed present in `.next/standalone/content/`,
so the handler resolves in the standalone server. It is also `force-static`, so the read happens at
build time regardless.

**Verified from the standalone server:**

| Route | Before | After |
|---|---|---|
| `/docs/llms.txt` | 404 | **200** `text/plain`, 86 KB |
| `/docs/llms-full.txt` | 404 | **200** `text/plain`, 3.5 MB |
| `/docs/llms-apl.md` | 404 | **200** `text/markdown`, 55 KB |
| `/llms.txt`, `/llms-full.txt`, `/llms-apl.md` | 200 | **404** (correctly gone) |

Generated content is internally consistent — every URL inside carries the `/docs` prefix:
`llms.txt` indexes `(/docs/restapi/ingest)`, `llms-full.txt` emits `Source: /docs/introduction`, and
the corpus link resolves to `/docs/llms-full.txt`.

build ✓ 639 pages · audit ✓ · lint ✓ · typecheck ✓ · 18 tests ✓

⚠️ Content still links to these URLs **absolutely** (`https://axiom.co/docs/llms.txt`). Absolute URLs
are not matched by the audit's link pattern, which only checks root-relative paths — so nothing here
validates them. That is T1.5, and it needs manual verification.

### [ ] T1.5 Add the `/llms-apl` redirect and fix six absolute links `[verified]`

`/docs/llms-apl` is a live, indexed, sitemap-listed page whose content moved to `/docs/llms/llms-apl`
with no redirect — its ranking signal is discarded rather than passed on.

Add `{"source": "/llms-apl", "destination": "/llms/llms-apl"}` to `docs.json`. It flows through
`lib/redirects.mjs` automatically (already `permanent: true`, so 308 — correct).

Then fix the shipped content that links to URLs we ourselves 404:
```
content/docs/(documentation)/llms/llms.mdx:3,:6
content/docs/(documentation)/llms/llms-full.mdx:3,:6
content/docs/(documentation)/llms/llms-overview.mdx:23,:24
```

**Verify:**
```bash
curl -s -o /dev/null -w '%{http_code}\n' <staging>/docs/llms-apl       # 308
grep -rn "axiom.co/docs/llms" content/docs/                            # no hits
```

### [ ] T1.6 Verify the two redirect layers still chain — `www` wins `[verified]` `[HANDOFF]`

There are **two** `/docs` redirect tables, and until now only one of them was in view.

`www/src/lib/config/redirects.ts` holds 53 `/docs` redirects that run in `next.config.ts`
`async redirects()` — and in Next.js **redirects execute before `beforeFiles` rewrites**. So `www`
resolves the redirect *first*, and only the survivor is proxied to the docs app. `www` always wins.
The docs app's own 115 redirects (from `docs.json`) only ever see what `www` did not already rewrite.

Measured overlap:

| | count |
|---|---|
| `/docs` redirects in `www` | 53 |
| redirects in the docs app (`docs.json`) | 115 |
| same source in **both** | 52 |
| same source, **conflicting destination** | **4** |
| sources only in `www` | 1 |

The four conflicts, where `www`'s destination silently overrides the docs app's:

```
/docs/usage/getting-started      www → /docs/getting-started-guide/getting-started
                                docs → /docs/getting-started
/docs/introducing-axiom          www → /docs/introduction
                                docs → /docs
/docs/install/introducing-axiom  www → /docs/getting-started-guide/getting-started
                                docs → /docs/getting-started
/docs/install/cloud              www → /docs/getting-started-guide/getting-started
                                docs → /docs/getting-started
```

**✅ Verified safe — this does NOT block release, and needs no `www` change.**

Every conflict chain lands correctly. `www` redirects to its destination, the docs app re-redirects,
and the result is a 200 on the new site:

```
/docs/usage/getting-started  →www→ /docs/getting-started-guide/getting-started
                             →docs→ /docs/getting-started                       200 ✓
/docs/introducing-axiom      →www→ /docs/introduction                           200 ✓
/docs/install/cloud          →www→ /docs/getting-started-guide/getting-started
                             →docs→ /docs/getting-started                       200 ✓
```

The same chains already resolve identically on production today, so this is **existing behaviour, not
a migration regression**. Cost is one extra hop on 4 legacy paths — negligible traffic, no SEO harm
(both hops are permanent redirects).

**So the task here is verification only:** confirm the 4 chains still land after T1.1–T1.5, and record
in `AGENTS.md` that `www` shadows `docs.json` for these sources so the next person does not spend an
afternoon on it.

Leave the shadowed `docs.json` entries in place. They are inert while `www` holds them, and they keep
this repo correct standalone if the proxy layer ever changes.

*Optional `www` cleanup, neither blocking, both carried as **W3 in Phase 4**: the 52 duplicated entries
could be dropped so one table is authoritative; and three `www` redirects point at pages that do not
exist (`/docs/data-shippers/axiom-honeycomb-proxy`, `/docs/integrations/datadog-migration`,
`/docs/usage/run-queries-on-aws`) — all three **already 404 on production today**, pre-existing rot
unchanged by this migration.*

**Verify:**
```bash
for p in /docs/usage/getting-started /docs/introducing-axiom /docs/install/cloud \
         /docs/install/introducing-axiom; do
  curl -sSL -o /dev/null -w "$p → %{http_code} %{url_effective}\n" https://axiom.co$p
done   # all 200
```

### [ ] T1.7 Meter `/api/chat` and `/api/try` — net-new public attack surface

Two unauthenticated public endpoints that Mintlify never had.

`lib/ai-rate-limit.ts` is a plain in-memory `Map` (12 req/min). On Vercel each serverless instance
holds its own map, so the limit fans out under concurrency. `/api/try` has **no limiter at all**.

Per `/api/chat` request the model can consume 24,000 chars of history (`app/api/chat/route.ts:24`)
× 6 tool steps (`:146`) × 18,000 chars each (`lib/docs-search.ts:55`). No auth, no CAPTCHA, no spend cap.

Minimum to unblock, in order:
1. **Hard daily spend cap on the OpenRouter key** — ~10 minutes, and it makes everything else non-fatal.
2. Move the counter to a shared durable store (Vercel KV / Upstash) so it is global across instances.
3. Apply a limiter to `/api/try`, keyed on IP, tighter than chat.

A Turnstile gate on first assistant use is follow-up, not a blocker.

*Useful negative result: the limiter is **not** header-spoofable — Vercel overwrites `X-Forwarded-For`
and `clientId()` (`route.ts:66-69`) holds. The defect is instance fan-out only.*

**Verify:** spend cap visible in the OpenRouter dashboard; limiter state survives across instances.

---

## Phase 2 — Fix at cutover or in week one

### [ ] T2.1 Open Graph images, site-wide `[verified]`

`og:image` count on the new site: **0**. Confirmed on both the live staging site and a local
production build. `twitter:card` is downgraded to `summary`; `og:site_name` is gone. No OG asset or
generator exists anywhere in `app/` or `public/`.

Every one of 626 URLs shared in Slack, Discord, X, LinkedIn or an LLM chat renders as a bare text link.

Add `app/docs/[...slug]/opengraph-image.tsx` using `next/og`, plus `openGraph.siteName` and
`twitter.card` in `app/layout.tsx:20-28`.

**Verify:** `curl -s <staging>/docs/getting-started | grep -c 'og:image'` → ≥1

### [ ] T2.2 JSON-LD structured data

`application/ld+json` count on the new site: **0**. Production emits `Organization`, `WebSite`,
`WebPage`, `BreadcrumbList` and `Article`/`TechArticle` per page.

The data already exists — `getBreadcrumbs` (`app/docs/[...slug]/page.tsx:24`) and `keywords`
(`source.config.ts:11`). Restores breadcrumb rich results and freshness signals across the corpus.

### [ ] T2.3 Sitemap `lastmod`

`app/docs/sitemap.ts:6-7` emits `<priority>` (Google ignores it) and no `<lastmod>` (Google uses it).
Production's sitemap is the exact inverse: 623 `<lastmod>`, 0 `<priority>`.

An accurate one-time `lastmod` at cutover is the single strongest recrawl signal available — ship it
**with** the cutover if at all possible.

### [ ] T2.4 `/docs` landing page metadata `[verified]`

`app/docs/page.tsx` exports neither `metadata` nor `generateMetadata`. Its live `<head>` has only
`<title>` and `<meta name="description">` — no canonical, no `og:*`, no `twitter:*`.

It is the `priority: 1` URL in the sitemap and the target of `/` → `/docs` (`app/page.tsx:4`), so it is
the one page that can be indexed as a duplicate. Every `[...slug]` page gets these correctly via
`generateMetadata`; only the landing page is missing them.

### [ ] T2.5 Legacy `.md` redirects

`lib/redirects.mjs:16-18` emits literal sources with no `.md` variant, so `/docs/<legacy>.md` matches
no redirect and the rewrite at `next.config.mjs:16` sends it to `/api/md/<legacy>`, which has no page.
Production 307s all 115.

Confirmed 404 on new vs 307 on prod: `/docs/usage/analyze.md`, `/docs/apl.md`, `/docs/index.md`,
`/docs/usage/datasets.md`, `/docs/monitor-data/alerts.md`. Narrow (legacy ∩ `.md` only) — hence
Phase 2, not Phase 1.

### [ ] T2.6 Three `llms` stub pages became indexable

Production 307s `/docs/llms/llms`, `/llms-full`, `/llms-apl` away and lists none in its sitemap. The
new site serves all three as 200 HTML **and** declares them in the sitemap.

Root cause worth fixing generally: `source.config.ts:16` ends with `.catchall(z.unknown())`, so
Mintlify's `url:` link-out frontmatter parses cleanly and is then read by nobody. Grep the corpus for
other `url:` frontmatter and decide explicitly what it should do.

### [ ] T2.7 `[unverified]` Navigation orphans

Audit reported 60 of 626 pages with no sidebar entry, no breadcrumbs and no prev/next. **One verifier
contested this — confirm the count yourself before acting.** `lib/navigation.ts` has zero unit coverage
either way.

**Verify:** diff generated routes against nav-linked routes, both directions.

### [ ] T2.8 Rotate the Axiom ingest token

`scripts/do11y-config.js` is gone on this branch (good), but the token `xaat-31ace…` remains in git
history and is currently live in production HTML. It is write-only ingest and already public, so this
is hygiene rather than an incident — but "public and never rotated" is not a state to carry into a
fresh deployment.

### [ ] T2.9 Decide staging's indexability explicitly

Staging is fully crawlable today — `app/robots.ts:5` emits `Allow: /docs/` with no `Disallow`, and
`docs.axiom.dev/robots.txt` confirms it live.

It is not currently causing harm: every page emits a canonical pointing at `https://axiom.co/docs/…`
(see T0.2), so crawlers attribute the content to production. But that protection is **incidental** —
it holds only because `NEXT_PUBLIC_SITE_URL` is unset on staging. Anyone "fixing" that var, or adding
a staging-specific origin, silently turns `docs.axiom.dev` into a duplicate of the entire docs corpus
competing with `axiom.co` in the index.

Make the intent explicit rather than emergent. Pick one:

- **Vercel Deployment Protection** on the staging project — strongest, and it also removes the
  unauthenticated `/api/chat` and `/api/try` exposure on staging (relates to T1.7).
- **`X-Robots-Tag: noindex`** on staging responses, via `headers()` in `next.config.mjs` gated on an
  env var.
- **Deliberately keep the cross-domain canonical** — valid, but then document it in `AGENTS.md` as
  load-bearing so the next person does not "fix" it.

Not a blocker: staging has been live and crawlable for some time with canonicals intact.

---

## Phase 3 — Post-launch backlog

- [ ] **CI validates the dev server, never the production build.** Redirects, sitemap, robots and the
  `.md` routes have zero automated coverage. `tests/redirects.test.ts` asserts nothing about
  permanence, destination resolvability, duplicates or loops. E2E runs only `pnpm dev`, desktop-only.
  Add the old-sitemap→new-host sweep (see Release gate) as a CI job.
- [ ] `output: standalone` and the `pnpm start` path are unexercised — Vercel does not use them.
  Related: `scripts/prepare-standalone.mjs:11,17` `continue`s past missing sources and always prints
  success, so it reports "Prepared .next/standalone" even when no server artifact exists. The `&&` in
  `package.json:11` gates it on `next build`, so it only misleads when run directly — add an
  existence assertion on `.next/standalone/server.js`.
- [ ] Redirect hygiene: 11 redirects resolve through 2–3 hop chains; 2 terminate on destinations not in
  `content/docs`; `/` → `/docs` is a 307 (`app/page.tsx:4` uses `redirect()`) rather than 308.
- [ ] `/api/md/[...slug]` is fully dynamic and uncached — 626 crawlable URLs re-processing MDX per request.
- [ ] Search: `keywords` frontmatter on 178 pages is dropped from the index; responses are `no-store`;
  re-scores 500 candidates inside the sort comparator; snippet sanitiser strips angle-bracket
  placeholders, yielding results that open with a bare colon.
- [ ] A11y: mobile nav drawer is visually modal with no focus trap, no `inert` background, no dialog
  semantics; five images have no `alt`; five sidebar `<h2>`s precede the page `<h1>`; dead 1241–1339px
  layout band. Contrast findings were computed from tokens — re-check in a browser.
- [ ] Content: `CallOut kind=` is ignored so example/tip callouts render as generic info;
  `content/snippets/definitions.mdx` is imported by no page; the published cookie policy does not match
  the analytics stack now shipping.
- [ ] Housekeeping: a developer's Tailscale hostname is committed in `next.config.mjs`
  (`allowedDevOrigins`); `NEXT_PUBLIC_SITE_URL` is documented under a runtime section though it is
  build-time.
- [ ] Establish a **content freeze / sync policy**. `main` averages ~3 `.mdx` commits per week and there
  is no documented sync mechanism — grep for `cutover|content freeze|sync from main` across
  `README.md`, `AGENTS.md`, `DESIGN.md`, `PRODUCT.md`, `.github/CONTRIBUTING.md` returns zero hits.
  Drift is what caused T1.1.

---

## Phase 4 — `www` handoffs (LAST, after everything above is done)

🚫 **Do not do these. Do not edit `www`.** This section exists so the handoffs are collected in one
place and filed as a single request at the end, once all `docs`-side work is complete and verified.

Batch all three into **one `www` PR**. They deploy together, and the swap is the moment of cutover.

| # | Change | Status |
|---|---|---|
| **W1** | Swap the rewrite destination (`www/next.config.ts:73-75`) off Mintlify onto the new deployment | 🔴 **Mandatory** — this *is* the cutover |
| **W2** | Add `${siteConfig.url}/docs/sitemap.xml` to the sitemap list in `www/src/app/robots.ts:64` | 🟡 Recommended — mandatory only if Search Console does not already have it registered |
| **W3** | Drop the 52 `/docs` entries from `www/src/lib/config/redirects.ts` that duplicate `docs.json`; delete the 3 that point at pages 404 on production today | 🟢 Optional cleanup — verified not to affect behaviour |

**W1 detail:**
```diff
  {
    source: "/docs/:path*",
-   destination: "https://axiom.mintlify.dev/docs/:path*",
+   destination: "https://<new-docs-deployment>/docs/:path*",
  },
```

**Before filing:** confirm the new deployment is publicly reachable and not behind Vercel preview
protection — a protected URL in that rewrite 401s the entire docs section.

**Ordering note:** W2 does not have to precede W1. A robots.txt sitemap line takes effect whenever
crawlers next read it, so shipping it in the same PR is fine and shipping it slightly later is
survivable. W1 is the only one with a hard moment attached to it.

---

## Release gate

Run before cutover and again immediately after. **Zero 404s or do not proceed.**

Until W1 ships, `<host>` is the staging deployment; after W1 it is `axiom.co`.

```bash
# Extract every URL from production's live sitemap, probe it against the new host.
curl -s https://axiom.co/docs/sitemap.xml \
  | grep -oE '<loc>[^<]+' | sed 's/<loc>//' \
  | sed 's|https://axiom.co|<staging-or-axiom.co-after-cutover>|' \
  | while read -r u; do
      code=$(curl -sSL -o /dev/null -w '%{http_code}' --max-time 20 "$u")
      [ "$code" = "200" ] || echo "FAIL $code $u"
    done
```

Save the output as the pre-cutover baseline.

---

## Cutover checklist

**The switch is Phase 4 / W1** — one line in `www`, filed as a handoff at the very end. It is what
"cutover" *means* under this architecture: the proxy destination is the only thing deciding whether
readers get Mintlify or the new app. It cannot be done from this repo.

No DNS change, no TTL to wait out. `www` deploys to flip; reverting that line and redeploying rolls
back.

Everything under **Before** is `docs`-side and must be finished *before* W1 is filed.

**Before**
1. [ ] T0.2–T1.7 all ticked (T0.1 is decided).
2. [ ] Redeploy staging from branch HEAD — the deploy audited on 2026-07-24 was ~5 days stale
   (`age: 420440`), so `gauge` and `sections` 404'd there while rendering fine locally. **Every
   measurement taken against `docs.axiom.dev` before that redeploy is suspect and must be re-taken.**
3. [ ] Release gate returns zero 404s against the fresh staging deploy.
4. [ ] Sample 20 legacy redirects end-to-end; each must terminate on a 200. Include all four T1.6
   conflict paths.
5. [ ] `[HANDOFF]` Search Console registration for `axiom.co/docs/sitemap.xml` confirmed. If it is not
   registered, the `www` robots.txt request (T1.3 part 2) becomes mandatory and must ship with the
   swap.
6. [ ] Confirm the new deployment is reachable from `www`'s edge and does not require auth
   (Vercel preview deployments are protected by default — a protected URL in the rewrite yields a
   sitewide 401).

**Cutover**
7. [ ] Swap the rewrite destination and deploy `www`, at a low-traffic hour, on a day the rollback
   owners are awake.
8. [ ] Re-submit `https://axiom.co/docs/sitemap.xml` in Search Console; request indexing on
   `/docs/introduction` and `/docs/getting-started`.

**First hour**
9. [ ] `curl -sI https://axiom.co/docs/introduction` → 200, canonical → `https://axiom.co/docs/introduction`.
10. [ ] `curl -s https://axiom.co/docs/sitemap.xml | grep -c '<loc>'` → ≥624. (If the T1.3 handoff
   shipped, also: `curl -s https://axiom.co/robots.txt | grep -c docs/sitemap` → 1.)
11. [ ] Release gate against **production**. Zero 404s.
12. [ ] `/docs/llms.txt`, `/docs/llms-full.txt`, `/docs/llms-apl.md` → 200; `/docs/llms-apl` → 3xx → 200.
13. [ ] `/doc-assets/*` images load on a rendered page (view it, don't just `curl`).
14. [ ] Search returns results; one OpenAPI page renders a populated operation, not an empty shell.
15. [ ] Confirm the URL bar stays on `axiom.co` — a rewrite that degrades to a redirect leaks the
   origin host and moves SEO authority off the apex, which is the whole point of the proxy.
16. [ ] Watch OpenRouter spend and `/api/chat` + `/api/try` volume for the full hour.
17. [ ] Watch CDN 404 rate against the pre-cutover baseline.

**Rollback triggers** — revert the rewrite line and redeploy `www` if any is true:
- The production release gate returns any 404 that was 200 before cutover.
- Sitewide 404 rate exceeds ~2× baseline for 15 consecutive minutes.
- `/docs/introduction` or `/docs/getting-started` non-200, or canonical points anywhere but `axiom.co`.
- 5xx (or any 401) rate above 1% sustained for 10 minutes.
- OpenRouter spend crosses the daily cap in the first hour → kill the endpoints first (they are
  severable via feature flag); roll back only if the site is also degraded.

Rollback is a config revert and nothing here writes to a shared datastore, so there is no state to
unwind. That bounded blast radius is why this is *ship with fixes* rather than *do not ship* — and
with the switch being a rewrite rather than DNS, the exit is a deploy rather than a propagation wait.
