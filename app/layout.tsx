import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { RootProvider } from 'fumadocs-ui/provider/next';
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
  icons: { icon: '/doc-assets/logo/favicon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <body>
        <RootProvider
          theme={{ attribute: ['class', 'data-theme'], defaultTheme: 'dark', enableSystem: false }}
          search={{ options: { api: '/api/search' } }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
