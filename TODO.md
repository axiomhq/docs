# Release TODO — Mintlify → Fumadocs cutover

Working checklist for shipping `feat/fumadocs-redesign` to `axiom.co/docs`.
Tasks are in **dependency order**. Work top to bottom; do not skip ahead.

Completed tasks are removed from this file — see **Done so far** for the one-line record and
`git log` for detail. Anything a later task still depends on is distilled into **Deployment context**
and **Conventions** below, so nothing load-bearing is lost with the task that established it.

## How to use this file

- Do one task per commit. Tick the box only after its **Verify** command passes, then delete the task
  body and add a line to **Done so far**.
- 🚫 **NEVER edit `~/Desktop/Axiom/www`.** It is read-only for this work — read it to understand
  behaviour, never modify it. Everything it needs is collected in **Phase 4**, to be filed as a single
  request at the very end. Items tagged `[HANDOFF]` point there; they are never tasks to do inline.
- **Nothing in Phases 0–3 depends on a `www` change.** You can complete the entire checklist, run the
  release gate against staging, and be fully ready to ship without touching it.
- Tasks marked `[HUMAN]` need a decision from the team — stop and ask, do not guess.
- Findings are labelled `[verified]` (reproduced directly against live URLs / git) or
  `[unverified]` (reported by audit, needs confirmation before acting).
- Node ≥24 is required. Local default is 22.16.0 — use `/opt/homebrew/opt/node/bin/node` or `nvm use 24`.
- Never run `pnpm build` while a dev server is running; it clobbers `.next`.

---

## Deployment context

**The site ships at `axiom.co`, serving docs under `/docs`.** `docs.axiom.dev` is staging only.

`~/Desktop/Axiom/www` (branch `main`) owns the front door and proxies docs via a Next.js rewrite,
`www/next.config.ts:65-78`:

```ts
async rewrites() {
  return { beforeFiles: [
    { source: "/docs/:path*", destination: "https://axiom.mintlify.dev/docs/:path*" },
  ]};
}
```

1. **Cutover is a one-line rewrite swap in `www`, not a DNS change.** Rollback is reverting that
   line — minutes, not a TTL. See Phase 4 / W1.
2. **It is a rewrite, not a redirect** — the URL bar stays on `axiom.co` and this app receives the
   full `/docs/...` path.
3. **`/docs/:path*` is the only thing proxied.** Everything else on `axiom.co`, including
   `/robots.txt` and `/sitemap.xml`, is served by `www` and never reaches this app.

Consequences that constrain the work:

- ⚠️ **Do NOT set `basePath: '/docs'`.** Content routes already live at `app/docs/[...slug]`, so the
  app serves `/docs/getting-started` at its own origin root. Adding `basePath` would produce
  `/docs/docs/getting-started`. The proxy passes the full path through; routing is already correct.
- **Canonicals are already correct.** Every `[...slug]` page emits
  `<link rel="canonical" href="https://axiom.co/docs/..."/>` and the sitemap uses the same origin.
- **`app/robots.ts` is inert in production** and stays at the app root. `robots.txt` is only honoured
  at an origin root, and `axiom.co/robots.txt` belongs to `www`. This file serves staging only;
  production robots changes are Phase 4 / W2.
- **Two redirect layers exist.** `www` resolves its own `/docs` redirects *before* the rewrite, so it
  wins over `docs.json`. See T1.6.

## Conventions

**Porting content from `main`.** `main` is still the Mintlify tree (flat `send-data/*.mdx`); this
branch uses `content/docs/(documentation)/…`. **Never `git merge origin/main`** — port by content and
apply both transformations:

1. Snippet imports: `from "/snippets/x.mdx"` → `from "@/content/snippets/x.mdx"`
2. Code fences: ` ```mpl ` → ` ```kusto `. Shiki has no `mpl` grammar and `next build` fails outright.
   The branch uses `kusto` for APL/MPL everywhere.

Neither is caught by `audit:content`; only `next build` catches the fence one.

**Floors, not freezes.** `scripts/audit-content.mjs` and `tests/redirects.test.ts` assert *floors* on
counts plus zero-tolerance invariants. ⚠️ **Raise a floor only when content is deliberately retired,
never to quiet a red build** — the exact-equality snapshots they replaced trained exactly that reflex.

## Done so far

| | Task | Commit |
|---|---|---|
| T0.1 | Deployment topology decided → `axiom.co/docs` (distilled above) | — |
| T1.1 | Ported StatsD/Traefik/PgBouncer + 2 edits from `main`, no merge | `6fd391e` |
| T1.2 | Unfroze `audit-content.mjs` → floors + invariants | `6fd391e` |
| T1.3 | Sitemap served at `/docs/sitemap.xml` | `cf7b669` |
| T1.4 | `llms.txt` / `llms-full.txt` / `llms-apl.md` served under `/docs` | `3667f9c` |
| T1.5 | Redirects for legacy `/docs/llms` and `/docs/llms-apl`; redirect tests hardened | `e1eed9d` |
| T2.1 | Per-page Open Graph + Twitter cards via the marketing `/og` route | see below |
| T2.4 | `/docs` landing page metadata — canonical, OG, Twitter (closed by T2.1) | see below |
| T2.2 | JSON-LD: Organization + WebSite site-wide, TechArticle + BreadcrumbList per page | `next` |
| T2.5 | Legacy `.md` redirects — every non-wildcard redirect mirrored at its `.md` twin | `next` |
| T2.6 | `url:` frontmatter now 307s like production, and is excluded from the sitemap | `fca6c5e` |
| T1.6 | Redirect-layer chaining verified in the full sweep — 226/228 land on 200 | `6e8b827` |
| T2.7 | Nav orphans measured: 63, inherited from production, all reachable — no action | — |

---

## Phase 0 — Prerequisites

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

---

## Phase 1 — Blockers (must land before the rewrite swap)

### [ ] T1.7 Meter `/api/chat` and `/api/try` — ⛔ **BLOCKED, awaiting team decision** `[HUMAN]`

> **Do not start this task.** Paused 2026-07-25 pending two answers from the team. It is the only
> remaining Phase 1 blocker; everything else in Phase 1 is done.
>
> **Q1 — Who owns the OpenRouter key?** Setting a hard daily spend cap is the single highest-value
> step (~10 minutes, dashboard only, no code) and it bounds the worst case regardless of what else
> ships. If the key is not ours to cap, this becomes a handoff.
>
> **Q2 — Which shared store for the rate limiter?** Vercel KV, Upstash Redis, or something already
> in the stack. Needed to make the limit global instead of per-instance. If adding a dependency is
> unwanted, the fallback is: spend cap + a tightened in-memory window, documented as per-instance.
>
> Nothing here blocks T2.x or Phase 3 — skip past it and come back once answered.

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

> **Social cards (T2.1) are done.** `lib/og.ts` builds `https://axiom.co/og?title=…&eyebrow=…`,
> rendered by `www/src/app/og/route.tsx` — the same card the marketing site uses. We call that route
> rather than shipping an `opengraph-image`, because the docs route is a catch-all
> (`app/docs/[...slug]`) and Next forbids a child segment after a catch-all; the `www` team hit the
> same wall and built `/og` for exactly this reason. The origin is hard-coded, not derived from
> `NEXT_PUBLIC_SITE_URL`, since `/og` is served from production wherever this app runs.
>
> ⚠️ Next replaces a parent's `openGraph`/`twitter` object wholesale rather than merging, so
> `siteName` and `card` are repeated in each page's metadata. Removing them from a page silently
> drops the tags.
>
> **567 of 629 pages get a section eyebrow.** The other 62 are pages missing from the sidebar tree,
> so they have no breadcrumb to read a group from — the card still renders, just title-only. Fixing
> T2.7 raises this automatically.

### [x] ~~T2.3 Sitemap `lastmod`~~ — **`<priority>` dropped; `lastmod` deliberately NOT added**

`<priority>` is gone: Google has stated it ignores the field, and a uniform `0.7` carried no signal.

**`lastmod` was not added, and the plan's premise was wrong.** It assumed an accurate date was
available. There is none:

| Source | Result |
|---|---|
| Frontmatter | no date field on any page |
| `git log` per file | **all 635 files report 2026-07** — the migration rewrote everything |
| Production sitemap | genuinely varied: 384 in 2026-01, 79 in 2026-04, 41 in 2026-03, … across 7 months |

Deriving from git would stamp all 625 URLs with one timestamp, replacing production's real per-page
history with a claim that the entire corpus changed at once. A uniform `lastmod` is a weak signal at
best and a trust-eroding one at worst, so omitting it beats fabricating it.

**If `lastmod` is wanted later**, the honest route is to seed from production's sitemap before
cutover — snapshot the 623 real dates into a committed map — and let git dates take over for pages
edited after the migration, once git history carries real signal again. Worth doing; not worth
guessing.


### [x] ~~T2.7 Navigation orphans~~ — **measured: not a regression, no action** `[verified]`

63 of 629 pages have no sidebar entry. That number is real, but it is **inherited from production, not
introduced by the migration**: `docs.json` *is* Mintlify's nav config, and it lists only two pages
under "Send data" (`reference-architectures`, `methods`). Production's sidebar omits exactly the same
pages.

They are also reachable — via hub pages (`send-data/methods` links all 31 shippers), via search, and
via the sitemap, which lists all 625 indexable URLs. Nothing is stranded.

Concentrated in `send-data` (31) and `guides` (25). The only visible cost is that their social cards
render title-only, since there is no breadcrumb group to use as an eyebrow.

Worth revisiting as an IA improvement; not a release blocker, and not something the cutover changes.

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
  Drift is what stranded the three send-data guides that had to be ported by hand.

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
1. [ ] Every open task in Phases 0–2 ticked; **Done so far** reflects them.
2. [ ] Redeploy staging from branch HEAD — the deploy audited on 2026-07-24 was ~5 days stale
   (`age: 420440`), so `gauge` and `sections` 404'd there while rendering fine locally. **Every
   measurement taken against `docs.axiom.dev` before that redeploy is suspect and must be re-taken.**
3. [ ] Release gate returns zero 404s against the fresh staging deploy.
4. [ ] Sample 20 legacy redirects end-to-end; each must terminate on a 200. Include all four T1.6
   conflict paths.
5. [ ] `[HANDOFF]` Search Console registration for `axiom.co/docs/sitemap.xml` confirmed. If it is not
   registered, the `www` robots.txt request (Phase 4 / W2) becomes mandatory and must ship with the
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
10. [ ] `curl -s https://axiom.co/docs/sitemap.xml | grep -c '<loc>'` → ≥624. (If W2
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