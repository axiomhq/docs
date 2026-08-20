import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  // Next.js compiles documentation routes and search assets on demand. A
  // single CI worker prevents cold compiles from starving each other while
  // preserving fast parallel runs against an already-warm local server.
  workers: process.env.CI ? 1 : undefined,
  // One retry absorbs genuine environment blips; the prod-server suite does
  // not need flake headroom beyond that.
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  expect: {
    timeout: process.env.CI ? 15_000 : 5_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'on-first-retry',
  },
  // E2E runs against the production build — the artifact users actually get.
  // The dev compiler's on-demand cold paths (route compiles, index builds,
  // chunk loads) were the source of every timing flake; prod has none.
  // Local iteration: keep any server (prod or `pnpm dev`) running on 3100 and
  // reuseExistingServer skips the build entirely.
  webServer: {
    command: 'pnpm build && PORT=3100 HOSTNAME=127.0.0.1 RATE_LIMIT_LOCAL_FALLBACK=1 pnpm start',
    url: 'http://127.0.0.1:3100/docs',
    reuseExistingServer: !process.env.CI,
    timeout: 600_000,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
});
