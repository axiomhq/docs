import { createMDX } from 'fumadocs-mdx/next';

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1'],
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  async redirects() {
    const { redirects } = await import('./lib/redirects.mjs');
    return redirects;
  },
  async rewrites() {
    return [{ source: '/docs/:path*.md', destination: '/api/md/:path*' }];
  },
};

export default createMDX()(config);
