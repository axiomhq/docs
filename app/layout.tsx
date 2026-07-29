import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { DocsShell } from '@/components/docs-shell';
import { DocsToaster } from '@/components/docs-toaster';
import { DocsSearchProvider } from '@/components/docs-search-provider';
import { getNavigation } from '@/lib/navigation';
import { siteGraph, structuredDataProps } from '@/lib/structured-data';
import './globals.css';

const geist = localFont({
  src: './fonts/Geist-Variable.ttf',
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = localFont({
  src: './fonts/GeistMono-Variable.ttf',
  variable: '--font-geist-mono',
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
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${geist.variable} ${geistMono.variable}`}>
      <body>
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
