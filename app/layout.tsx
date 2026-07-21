import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { DocsToaster } from '@/components/docs-toaster';
import { DocsSearchProvider } from '@/components/docs-search-provider';
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
  icons: { icon: { url: '/doc-assets/logo/favicon.svg?v=2', type: 'image/svg+xml' } },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${geist.variable} ${geistMono.variable}`}>
      <body>
        <RootProvider
          theme={{ attribute: ['class', 'data-theme'], defaultTheme: 'system', enableSystem: true, storageKey: 'axiom-docs-theme' }}
          search={{ enabled: false }}
        >
          <DocsSearchProvider>
            {children}
            <DocsToaster />
          </DocsSearchProvider>
        </RootProvider>
      </body>
    </html>
  );
}
