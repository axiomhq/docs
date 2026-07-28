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
    return redirects;
  },
  async rewrites() {
    return [{ source: '/:path*.md', destination: '/api/md/:path*' }];
  },
};

export default createMDX()(config);
