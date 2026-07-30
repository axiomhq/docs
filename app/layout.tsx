import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import localFont from 'next/font/local';
import { cn } from '@/lib/utils';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { DocsShell } from '@/components/docs-shell';
import { DocsToaster } from '@/components/docs-toaster';
import { DocsSearchProvider } from '@/components/docs-search-provider';
import { getNavigation } from '@/lib/navigation';
import { siteGraph, structuredDataProps } from '@/lib/structured-data';
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

// Full original file — do NOT subset: the Berkeley Mono EULA (§1.12 + §8)
// prohibits Derivative Works, which includes subsetting the binary.
const berkeleyMono = localFont({
  src: './fonts/Berkeley_Mono_Variable.woff2',
  variable: '--font-berkeley-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://axiom.co'),
  title: {
    default: 'Axiom Docs',
    template: '%s | Axiom Docs',
  },
  description: 'Learn how to send, store, and query logs, traces, metrics, and events with Axiom.',
  icons: { icon: { url: '/docs/doc-assets/logo/favicon.svg?v=2', type: 'image/svg+xml' } },
  openGraph: { siteName: 'Axiom', type: 'website', locale: 'en_US' },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // `antialiased` matches www: macOS's default subpixel smoothing fattens
    // light-on-dark text, making 400 read like a medium weight.
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={cn(geist.variable, berkeleyMono.variable, 'scroll-smooth antialiased bg-(--bg-canvas)')}>
      <body className="m-0 bg-(--bg-canvas) text-(--text-primary) font-sans font-normal">
        <script type="application/ld+json" dangerouslySetInnerHTML={structuredDataProps(siteGraph())} />
        <RootProvider
          theme={{ attribute: ['class', 'data-theme'], defaultTheme: 'system', enableSystem: true, storageKey: 'axiom-docs-theme' }}
          search={{ enabled: false }}
        >
          <DocsSearchProvider>
            {/* The shell renders here — in a segment with no params — so client
                navigation reuses it and page payloads carry only the article. */}
            <DocsShell
              navigations={{
                documentation: getNavigation('documentation'),
                query: getNavigation('query'),
                api: getNavigation('api'),
                changelog: getNavigation('changelog'),
              }}
            >
              {children}
            </DocsShell>
            <DocsToaster />
          </DocsSearchProvider>
        </RootProvider>
      </body>
    </html>
  );
}
