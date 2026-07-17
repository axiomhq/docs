import { expect, test } from '@playwright/test';

test('landing, guide, query, and API routes render', async ({ page }) => {
  await page.goto('/docs');
  await expect(page.getByRole('heading', { name: 'From first event to petabyte scale.' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.goto('/docs/getting-started');
  await expect(page.getByRole('heading', { name: 'Quickstart', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Axiom fundamentals', level: 2 })).toBeVisible();

  await page.goto('/docs/apl/tabular-operators/summarize-operator');
  await expect(page.getByRole('heading', { name: 'summarize', level: 1 })).toBeVisible();

  await page.goto('/docs/restapi/endpoints/ingestIntoDataset');
  await expect(page.getByText('/v1/datasets/{dataset_name}/ingest', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Parameters #' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Response #' })).toBeVisible();
});

test('theme, search, and mobile navigation are keyboard and touch accessible', async ({ page }) => {
  await page.goto('/docs');
  await page.getByRole('button', { name: 'Toggle color theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.keyboard.press('ControlOrMeta+KeyK');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('navigation', { name: 'Page navigation' })).toBeVisible();
  await page.getByRole('complementary').getByRole('button', { name: 'Close navigation' }).click();
});

test('analytics is silent without a PostHog project token', async ({ page }) => {
  const analyticsRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).hostname.includes('posthog')) analyticsRequests.push(request.url());
  });
  await page.goto('/docs');
  await page.goto('/docs/apl/overview');
  expect(analyticsRequests).toEqual([]);
});

test('article remains viewport-centered across desktop and tablet widths', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/docs/getting-started');
    const articleLocator = page.locator('.doc-article');
    await expect(articleLocator).toBeVisible();
    const article = await articleLocator.boundingBox();
    expect(article).not.toBeNull();
    expect(Math.abs(article!.x + article!.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(1);
  }
});

test('table of contents tracks the active heading and keeps a transparent surface', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/platform-overview/architecture');

  const toc = page.getByRole('complementary', { name: 'On this page' });
  const queryArchitecture = toc.getByRole('link', { name: 'Query architecture' });
  await expect(toc).toBeVisible();
  await expect.poll(() => toc.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgba(0, 0, 0, 0)');

  await queryArchitecture.click();
  await expect(queryArchitecture).toHaveAttribute('aria-current', 'location');
  await expect(page.getByRole('heading', { name: 'Query architecture', level: 2 })).toBeInViewport();

  const consoleExpander = page.locator('.nav-nested summary').filter({ hasText: 'Console' });
  await expect(consoleExpander.locator('span')).toHaveText('Console');
  const label = await consoleExpander.locator('span').boundingBox();
  const chevron = await consoleExpander.locator('svg').boundingBox();
  expect(label).not.toBeNull();
  expect(chevron).not.toBeNull();
  expect(chevron!.x).toBeGreaterThan(label!.x + label!.width);
});

test('client navigation and configurable code examples hydrate without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/docs/restapi/introduction');
  await expect(page.getByLabel('Dataset name')).toBeVisible();
  await page.getByLabel('Dataset name').fill('production-events');
  await expect(page.locator('pre').filter({ hasText: 'production-events' }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Dataset name')).toHaveValue('production-events', { timeout: 15_000 });
  expect(errors).toEqual([]);
});
