import { expect, test } from '@playwright/test';

test('landing, guide, query, and API routes render', async ({ page }) => {
  await page.goto('/docs');
  await expect(page.getByRole('heading', { name: 'From first event to petabyte scale.' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', /^(dark|light)$/);

  await page.goto('/docs/getting-started');
  await expect(page.getByRole('heading', { name: 'Quickstart', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Axiom fundamentals', level: 2 })).toBeVisible();

  await page.goto('/docs/apl/tabular-operators/summarize-operator');
  await expect(page.getByRole('heading', { name: 'summarize', level: 1 })).toBeVisible();

  await page.goto('/docs/restapi/endpoints/ingestIntoDataset');
  await expect(page.getByText('/v1/datasets/{dataset_name}/ingest', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Parameters' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Response' })).toBeVisible();
});

test('API reference uses highlighted code, compact schemas, and persistent language tabs', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/docs/restapi/endpoints/getToken');

  const requestCode = page.locator('#example .api-code');
  await expect(requestCode.getByRole('tab', { name: 'cURL' })).toHaveAttribute('aria-selected', 'true');
  await expect(requestCode.getByRole('tab', { name: 'JavaScript' })).toBeVisible();
  await expect(requestCode.getByRole('tab', { name: 'Python' })).toBeVisible();
  await expect(requestCode.getByRole('tab', { name: 'Go' })).toBeVisible();
  await expect(requestCode.locator('pre.shiki')).toBeVisible();

  const tokenColors = await requestCode.locator('pre.shiki span').evaluateAll((elements) => (
    [...new Set(elements.map((element) => getComputedStyle(element).color))]
  ));
  expect(tokenColors.length).toBeGreaterThan(1);
  expect(tokenColors).toContain('rgb(240, 243, 246)');
  await expect(requestCode.locator('pre code')).toHaveCSS('border-top-width', '0px');

  const parametersHeading = page.getByRole('heading', { name: 'Parameters', level: 2 });
  await expect(parametersHeading).toHaveCSS('border-bottom-width', '0px');
  const parameterTable = page.getByRole('table', { name: 'Request parameters' });
  await expect(parameterTable).toBeVisible();
  await expect(parameterTable.getByRole('columnheader', { name: 'Location' })).toBeVisible();
  await expect(parameterTable.getByRole('cell', { name: 'path' })).toBeVisible();

  await expect(page.locator('.sidebar-group h2').filter({ hasText: /^API tokens$/ })).toBeVisible();
  await expect(page.locator('.sidebar-group h2').filter({ hasText: /endpoints/i })).toHaveCount(0);
  await expect(page.locator('.site-header .ask-ai')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Search documentation and ask AI' })).toBeVisible();

  const tryIt = page.locator('.api-try');
  await tryIt.getByText('Try it', { exact: true }).click();
  await expect(tryIt.getByLabel('API token Required')).toHaveAttribute('data-ph-no-capture', 'true');
  const orgIdInput = tryIt.getByPlaceholder('Your organization ID');
  await expect(orgIdInput).toHaveCount(0);
  await expect(tryIt.getByRole('button', { name: 'Run GET request' })).toBeDisabled();
  await tryIt.getByLabel('API token Required').fill('xaapt-test');
  await expect(orgIdInput).toHaveAttribute('data-ph-no-capture', 'true');
  await expect(tryIt.getByText('Personal access tokens require an organization ID.', { exact: false })).toBeVisible();
  await expect(tryIt.getByRole('button', { name: 'Run GET request' })).toBeDisabled();
  await expect(tryIt.getByLabel('Organization ID Required for PAT')).toBeVisible();
  await orgIdInput.fill('org-id');
  await expect(tryIt.getByRole('button', { name: 'Run GET request' })).toBeEnabled();
  await orgIdInput.fill('');
  await tryIt.getByLabel('API token Required').fill('test-token');
  await expect(orgIdInput).toHaveCount(0);
  await tryIt.getByRole('button', { name: 'Run GET request' }).click();
  await expect(tryIt.getByRole('alert')).toHaveText('Enter a value for id.');
  await expect(page.locator('#response .api-code')).toHaveCount(0);

  const responseSchema = page.getByRole('table', { name: 'Response schema' });
  const expiresRow = responseSchema.getByRole('row').filter({ hasText: 'expiresAt' });
  expect((await expiresRow.boundingBox())!.height).toBeLessThanOrEqual(40);

  const objectRow = responseSchema.getByRole('row').filter({ hasText: /^orgCapabilities/ });
  const childRow = responseSchema.getByRole('row').filter({ hasText: /^└annotations/ });
  await expect(objectRow).toHaveAttribute('data-depth', '0');
  await expect(childRow).toHaveAttribute('data-depth', '1');
  const objectPadding = await objectRow.locator('.api-schema-name').evaluate((element) => parseFloat(getComputedStyle(element).paddingLeft));
  const childPadding = await childRow.locator('.api-schema-name').evaluate((element) => parseFloat(getComputedStyle(element).paddingLeft));
  expect(childPadding).toBeGreaterThan(objectPadding);

  const activeSidebarLink = page.locator('.sidebar-link.active');
  const sidebarLabel = await activeSidebarLink.locator('.sidebar-link-label').boundingBox();
  const sidebarMethod = await activeSidebarLink.locator('.method').boundingBox();
  expect(sidebarMethod!.x).toBeGreaterThan(sidebarLabel!.x + sidebarLabel!.width);

  await requestCode.getByRole('tab', { name: 'Python' }).click();
  await expect(requestCode.getByRole('tabpanel', { name: 'Python code example' })).toContainText('import requests');
  await page.goto('/docs/restapi/endpoints/createToken');
  await expect(page.locator('#example').getByRole('tab', { name: 'Python' })).toHaveAttribute('aria-selected', 'true');

  await page.goto('/docs/restapi/endpoints/getDashboards');
  const listResponseSchema = page.getByRole('table', { name: 'Response schema' });
  await expect(listResponseSchema).toBeVisible();
  await expect(listResponseSchema.getByRole('row').filter({ hasText: /^createdAtstring<date-time>/ })).toBeVisible();
  await expect(listResponseSchema.getByRole('row').filter({ hasText: /^dashboardobject/ })).toHaveAttribute('data-depth', '0');
  await expect(listResponseSchema.getByRole('row').filter({ hasText: /^└name/ }).first()).toHaveAttribute('data-depth', '1');
});

test('theme defaults to the system and persists an explicit local preference', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/docs');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => localStorage.getItem('axiom-docs-theme'))).toBeNull();

  await page.getByRole('button', { name: 'Color theme: system' }).click();
  await page.getByRole('menuitemradio', { name: 'Light' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.evaluate(() => localStorage.getItem('axiom-docs-theme'))).toBe('light');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Color theme: light' }).click();
  await page.getByRole('menuitemradio', { name: 'System' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => localStorage.getItem('axiom-docs-theme'))).toBe('system');
});

test('search and mobile navigation are keyboard and touch accessible', async ({ page }) => {
  await page.goto('/docs');

  await expect.poll(async () => {
    await page.keyboard.press('ControlOrMeta+KeyK');
    return page.getByRole('dialog').isVisible();
  }, { timeout: 15_000 }).toBe(true);
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

test('query reference navigation and MDX components follow the compact interaction model', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/apl/scalar-functions/conditional-function/case');

  const title = page.getByRole('heading', { name: 'case', exact: true, level: 1 });
  await expect(title).toHaveCSS('font-family', /SF Mono|Menlo/);

  const languageComparisons = page.locator('.language-comparisons');
  await expect(languageComparisons).toHaveCSS('border-radius', '4px');
  const splunkComparison = languageComparisons.getByRole('button', { name: 'Splunk SPL users' });
  await expect(splunkComparison).toHaveCSS('min-height', '34px');
  expect((await languageComparisons.boundingBox())!.width).toBe((await page.locator('.doc-article .prose').boundingBox())!.width);
  await expect(page.locator('.doc-article .prose > h2').last()).toContainText('Other query languages');
  await splunkComparison.click();
  await expect(languageComparisons.getByRole('region', { name: 'Splunk SPL users' })).toContainText(/alternating condition-value pairs/);

  const tabs = page.locator('.docs-tabs > div');
  await expect(tabs).toHaveCSS('border-radius', '4px');
  await expect(tabs.getByRole('tablist')).toHaveCSS('height', '38px');
  await expect(tabs.locator('figure.shiki').first()).toHaveCSS('border-radius', '4px');
  const tabSurfaces = await tabs.evaluate((element) => {
    const tablist = element.querySelector('[role="tablist"]')!;
    const panel = element.querySelector('[role="tabpanel"]')!;
    const activeTab = element.querySelector('[role="tab"][aria-selected="true"]')!;
    return {
      bar: getComputedStyle(tablist).backgroundColor,
      panel: getComputedStyle(panel).backgroundColor,
      accent: getComputedStyle(activeTab, '::after').backgroundColor,
    };
  });
  expect(tabSurfaces.panel).not.toBe(tabSurfaces.bar);
  expect(tabSurfaces.accent).toBe('rgb(218, 92, 43)');

  const playground = tabs.getByRole('link', { name: /Run in Playground/ }).first();
  await expect(playground).toHaveAttribute('target', '_blank');
  await expect(playground.locator('svg').last()).toHaveAttribute('aria-label', 'Opens in a new tab');
  const queryFigure = tabs.locator('.query-example figure').first();
  const copyButton = queryFigure.getByRole('button', { name: 'Copy Text' });
  const copyControl = copyButton.locator('xpath=..');
  await expect(copyControl).toHaveCSS('opacity', '0');
  await queryFigure.hover();
  await expect(copyControl).toHaveCSS('opacity', '1');
  const playgroundBox = (await playground.boundingBox())!;
  const queryBox = (await queryFigure.boundingBox())!;
  const copyBox = (await copyButton.boundingBox())!;
  expect(playgroundBox.y).toBeGreaterThanOrEqual(queryBox.y);
  expect(playgroundBox.y + playgroundBox.height).toBeLessThan(queryBox.y + queryBox.height);
  expect(copyBox.x + copyBox.width).toBeLessThan(playgroundBox.x);
  expect(Math.abs(copyBox.y - playgroundBox.y)).toBeLessThanOrEqual(1);

  const outputTable = tabs.getByRole('table').first();
  await expect(outputTable.locator('xpath=..')).toHaveCSS('border-radius', '4px');
  await expect(outputTable.getByRole('columnheader').first()).toHaveCSS('padding', '7px 10px');

  const relatedFunction = page.getByRole('link', { name: 'iff', exact: true }).last();
  await expect(relatedFunction).toHaveAttribute('href', '/docs/apl/scalar-functions/conditional-function/iff');
  await expect(relatedFunction).toHaveCSS('font-family', /Mono/);
  await page.locator('.sidebar').getByRole('link', { name: 'iff', exact: true }).click();
  await expect(page).toHaveURL(/\/conditional-function\/iff$/);
  await expect(page.locator('.nav-nested[open] > summary span')).toHaveText(['Functions', 'Scalar functions', 'Conditional functions']);
});

test('Axiom article chrome, callouts, and heading links follow the docs interaction model', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/platform-overview/architecture');

  const sidebarHeading = page.locator('.sidebar-group h2').first();
  const breadcrumbs = page.locator('.doc-breadcrumbs');
  const sidebarBox = await sidebarHeading.boundingBox();
  const breadcrumbBox = await breadcrumbs.boundingBox();
  expect(sidebarBox).not.toBeNull();
  expect(breadcrumbBox).not.toBeNull();
  expect(Math.abs(sidebarBox!.y - breadcrumbBox!.y)).toBeLessThanOrEqual(1);

  const brand = page.getByRole('link', { name: 'Axiom documentation home' });
  await expect(brand.locator('.brand-logo:visible')).toHaveCount(1);
  await expect(brand.locator('svg')).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Documentation sections' }).getByRole('link', { name: 'Changelog' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Open console →' })).toBeVisible();

  const notice = page.locator('.doc-notice').first();
  await expect(notice).toBeVisible();
  await expect(notice.locator('svg')).toHaveCount(0);
  const noticeStyles = await notice.evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      background: styles.backgroundColor,
      canvas: getComputedStyle(document.body).backgroundColor,
      borderLeft: styles.borderLeftWidth,
      font: styles.fontFamily,
      bodyFont: getComputedStyle(document.body).fontFamily,
      shadow: styles.boxShadow,
    };
  });
  expect(noticeStyles.background).not.toBe(noticeStyles.canvas);
  expect(noticeStyles.borderLeft).toBe('3px');
  expect(noticeStyles.font).not.toBe(noticeStyles.bodyFont);
  expect(noticeStyles.shadow).toBe('none');

  const heading = page.getByRole('heading', { name: 'Ingestion architecture', level: 2 });
  const headingLink = heading.getByRole('link', { name: 'Ingestion architecture' });
  await heading.hover();
  await expect(heading.locator('.anchor-hash')).toHaveCSS('opacity', '1');
  await headingLink.click();
  await expect(page).toHaveURL(/#ingestion-architecture$/);
  await expect(heading).toBeInViewport();
  expect((await heading.boundingBox())!.y).toBeGreaterThanOrEqual(56);
  await expect(page.getByText('Link copied', { exact: true })).toBeVisible();

  const tocLink = page.getByRole('complementary', { name: 'On this page' }).getByRole('link', { name: 'Ingestion architecture' });
  const indicator = await tocLink.evaluate((element) => {
    const styles = getComputedStyle(element, '::before');
    return { width: styles.width, height: styles.height, radius: styles.borderRadius };
  });
  expect(indicator).toEqual({ width: '5px', height: '9px', radius: '0px' });
});

test('article hierarchy and footer navigation follow the compact docs pattern', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/console/intelligence/mcp-server');

  const parentHeading = page.getByRole('heading', { name: 'Current capabilities', level: 2 });
  const childHeading = page.getByRole('heading', { name: 'Supported MCP tools', level: 3 });
  const parentBox = (await parentHeading.boundingBox())!;
  const childBox = (await childHeading.boundingBox())!;
  expect(childBox.y - (parentBox.y + parentBox.height)).toBeLessThanOrEqual(20);

  const pagination = page.getByRole('navigation', { name: 'Adjacent documentation pages' });
  await expect(pagination.getByRole('link', { name: /Previous AI agents/ })).toHaveAttribute('href', '/docs/console/intelligence/ai-agents-overview');
  await expect(pagination.getByRole('link', { name: /Next Skills for AI agents/ })).toHaveAttribute('href', '/docs/console/intelligence/skills');

  const helpful = page.getByRole('button', { name: 'Yes, this page was helpful' });
  await helpful.click();
  await expect(helpful).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status')).toHaveText('Thanks for the feedback.');
  await expect(page.getByRole('link', { name: 'Suggest edits on GitHub' })).toBeVisible();
});

test('article copy keeps a distinct contrast hierarchy in both themes', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/docs/platform-overview/architecture');

  const bodyCopy = page.locator('.doc-article .prose > p').first();
  const heading = page.getByRole('heading', { name: 'Ingestion architecture', level: 2 });
  const boldLabel = page.locator('.doc-article .prose strong').first();

  await expect(bodyCopy).toHaveCSS('color', 'rgb(212, 212, 212)');
  await expect(heading).toHaveCSS('color', 'rgb(250, 250, 250)');
  await expect(boldLabel).toHaveCSS('color', 'rgb(250, 250, 250)');

  await page.getByRole('button', { name: 'Color theme: system' }).click();
  await page.getByRole('menuitemradio', { name: 'Light' }).click();
  await expect(bodyCopy).toHaveCSS('color', 'rgb(82, 82, 82)');
  await expect(heading).toHaveCSS('color', 'rgb(10, 10, 10)');
  await expect(boldLabel).toHaveCSS('color', 'rgb(10, 10, 10)');
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
