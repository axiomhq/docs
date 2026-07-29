import { createMDX } from 'fumadocs-mdx/next';

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  basePath: '/docs',
  allowedDevOrigins: ['127.0.0.1', 'adipurush', 'adipurush.tail9166b.ts.net'],
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  async redirects() {
    const { redirects } = await import('./lib/redirects.mjs');
    return [
      // The app lives entirely under basePath /docs, so the deployment root
      // would otherwise 404 — which Vercel's checks read as a broken site.
      // basePath: false keeps the source at the bare origin root.
      { source: '/', destination: '/docs', basePath: false, permanent: false },
      ...redirects,
    ];
  },
  async rewrites() {
    return [{ source: '/:path*.md', destination: '/api/md/:path*' }];
  },
};

export default createMDX()(config);
