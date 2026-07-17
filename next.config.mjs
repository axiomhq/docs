import { createMDX } from 'fumadocs-mdx/next';

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
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
