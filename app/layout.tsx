import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { DocsToaster } from '@/components/docs-toaster';
import './globals.css';

const themeBootstrap = `(function(){try{var key='axiom-docs-theme';var match=document.cookie.match(/(?:^|; )axiom-docs-theme=(dark|light)(?:;|$)/);if(match){localStorage.setItem(key,match[1]);}else{localStorage.removeItem(key);}}catch(_){}})();`;

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
  icons: { icon: '/doc-assets/logo/favicon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${geist.variable} ${geistMono.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: themeBootstrap }} /></head>
      <body>
        <RootProvider
          theme={{ attribute: ['class', 'data-theme'], defaultTheme: 'system', enableSystem: true, storageKey: 'axiom-docs-theme' }}
          search={{ options: { api: '/api/search' } }}
        >
          {children}
          <DocsToaster />
        </RootProvider>
      </body>
    </html>
  );
}
