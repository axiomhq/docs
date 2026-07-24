/**
 * Social cards are rendered by the marketing app's `/og` route
 * (`www/src/app/og/route.tsx`), which templates a title and an optional section
 * eyebrow onto the Axiom brand card.
 *
 * Two things are deliberate here:
 *
 * - The origin is fixed rather than derived from `NEXT_PUBLIC_SITE_URL`. `/og`
 *   is served by the marketing app at the production origin no matter where this
 *   app is deployed, so a staging build must still point at axiom.co.
 * - We call `/og` instead of shipping a file-convention `opengraph-image`. The
 *   documentation route is a catch-all (`app/docs/[...slug]`) and Next forbids a
 *   child segment after a catch-all, so the file convention cannot be used here.
 */
const OG_ORIGIN = 'https://axiom.co';
const OG_WIDTH = 1200;
const OG_HEIGHT = 675;

export function ogImage(title: string, eyebrow?: string) {
  const params = new URLSearchParams({ title });
  if (eyebrow) params.set('eyebrow', eyebrow);
  return { url: `${OG_ORIGIN}/og?${params}`, width: OG_WIDTH, height: OG_HEIGHT, alt: title };
}
