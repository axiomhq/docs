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

  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.getByRole('button', { name: 'Toggle sections' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Open navigation' }).click();
  const drawer = page.locator('#docs-navigation-drawer');
  await expect(drawer.getByRole('navigation', { name: 'Documentation sections' })).toBeVisible();
  await expect(drawer.getByRole('navigation', { name: 'Page navigation' })).toBeVisible();
  await drawer.getByRole('link', { name: 'Query reference' }).click();
  await expect(page).toHaveURL(/\/docs\/apl\/overview$/);
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('button', { name: 'Close navigation' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused();
  await expect(drawer).not.toBeVisible();
});

test('search and the docs assistant share one private, keyboard-accessible dialog', async ({ page }) => {
  await page.goto('/docs');

  const dialog = page.getByRole('dialog', { name: 'Search and ask Axiom Docs' });
  await expect.poll(async () => {
    await page.keyboard.press('ControlOrMeta+KeyK');
    return dialog.isVisible();
  }, { timeout: 15_000 }).toBe(true);
  await expect(page.getByRole('tab', { name: 'Search' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: 'Search' })).toHaveCSS('padding-left', '9px');
  const searchInput = page.getByRole('combobox', { name: 'Search documentation' });
  await expect(searchInput).toBeFocused();
  await expect(searchInput).toHaveAttribute('placeholder', 'Search pages, APIs, APL, and MPL…');
  await expect(page.locator('.docs-search-input-row')).toHaveCSS('box-shadow', 'none');
  const searchRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/search') searchRequests.push(request.url());
  });
  await searchInput.pressSequentially('filter array', { delay: 25 });
  const firstSearchResult = page.locator('.docs-search-result').first();
  await expect(firstSearchResult).toContainText('array_iff', { timeout: 15_000 });
  await expect(firstSearchResult).toContainText('filter arrays by a condition');
  await expect(firstSearchResult.locator('.docs-search-result-path')).toHaveText('Docs / … / array_iff');
  await expect(firstSearchResult.locator('.docs-search-result-path')).toHaveAttribute('title', /Array functions/);
  expect(searchRequests).toHaveLength(1);
  for (let index = 0; index < 8; index += 1) await searchInput.press('ArrowDown');
  await expect(page.locator('.docs-search-result').nth(8)).toHaveAttribute('aria-selected', 'true');
  expect(await page.locator('.docs-search-results').evaluate((element) => element.scrollTop)).toBeGreaterThan(0);

  await searchInput.fill('splunk');
  const contextualResult = page.locator('.docs-search-result-content').filter({ hasText: /^Splunk:/ }).first();
  await expect(contextualResult).toContainText('Splunk uses a search command');
  await expect(contextualResult).not.toContainText('**');
  await expect(contextualResult).toContainText(/…$/);

  await searchInput.fill('dataset retention');
  const askFromSearch = page.getByRole('button', { name: /Ask AI about “dataset retention”/ });
  await expect(askFromSearch).toBeVisible();
  expect(await askFromSearch.evaluate((element) => element.closest('[role="listbox"]') === null)).toBe(true);
  await expect(firstSearchResult).toHaveAttribute('tabindex', '-1');
  await searchInput.press('Tab');
  await expect(askFromSearch).toBeFocused();
  await askFromSearch.click();

  await expect(page.getByRole('tab', { name: 'Ask AI' })).toHaveAttribute('aria-selected', 'true');
  const assistantInput = page.getByRole('textbox', { name: 'Ask Axiom Docs' });
  await expect(assistantInput).toHaveValue('dataset retention', { timeout: 15_000 });
  await expect(assistantInput).toHaveAttribute('data-ph-no-capture', 'true');
  await expect(page.locator('.docs-assistant-composer')).toHaveCSS('box-shadow', 'none');
  await expect(page.locator('.docs-assistant-input-wrap')).toHaveCSS('border-color', 'rgb(218, 92, 43)');
  expect(await page.evaluate(() => Object.values(localStorage).includes('dataset retention'))).toBe(false);

  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect.poll(async () => {
    await page.keyboard.press('ControlOrMeta+KeyI');
    return dialog.isVisible();
  }, { timeout: 15_000 }).toBe(true);
  await expect(page.getByRole('tab', { name: 'Ask AI' })).toHaveAttribute('aria-selected', 'true');
  await expect(assistantInput).toBeFocused();

  await page.setViewportSize({ width: 390, height: 844 });
  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeLessThanOrEqual(390);
  expect(box!.height).toBeLessThanOrEqual(844);
});

test('table links and notice blocks retain clear affordance and rhythm', async ({ page }) => {
  await page.goto('/docs/send-data/methods#popular-methods');

  const firstTableLink = page.locator('.doc-article table tbody td a').first();
  await expect(firstTableLink).toHaveText('Rest API');
  await expect(firstTableLink).toHaveCSS('text-decoration-line', 'underline');

  const noticeParagraphs = page.locator('.doc-notice').first().locator('p');
  await expect(noticeParagraphs).toHaveCount(3);
  await expect(noticeParagraphs.nth(1)).toHaveCSS('margin-top', '10px');
  await expect(noticeParagraphs.nth(2)).toHaveCSS('margin-top', '10px');
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

test('landing content reserves the desktop table-of-contents rail', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/docs');

    const hero = (await page.locator('.landing-hero').boundingBox())!;
    const search = (await page.locator('.hero-search').boundingBox())!;
    expect(Math.abs(hero.x + hero.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(1);
    expect(search.width).toBe(hero.width);
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

  await page.goto('/docs/reference/performance');
  const codedTocLink = page.locator('.floating-toc a').filter({ has: page.locator('code') }).first();
  const tocCode = codedTocLink.locator('code').first();
  await expect(tocCode).toHaveCSS('color', await codedTocLink.evaluate((element) => getComputedStyle(element).color));
  await expect(tocCode).toHaveCSS('font-size', await codedTocLink.evaluate((element) => getComputedStyle(element).fontSize));
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /\/doc-assets\/logo\/favicon\.svg\?v=2$/);
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
  await expect(brand.locator('.brand-mark')).toBeVisible();
  await expect(brand.locator('.brand-logo')).toHaveCount(0);
  const badge = brand.locator('.brand-badge');
  await expect(badge).toHaveCSS('font-size', '12px');
  await expect(badge).toHaveCSS('border-left-color', 'rgb(218, 92, 43)');
  await expect(badge).toHaveCSS('border-radius', '0px');
  await expect(badge).toHaveCSS('font-weight', '600');
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

test('deep documentation pages show their complete navigation ancestry', async ({ page }) => {
  await page.goto('/docs/dashboard-elements/pie-chart');

  const breadcrumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(breadcrumbs).toHaveText(/Understand data\s*\/\s*Console\s*\/\s*Dashboard\s*\/\s*Elements\s*\/\s*Element types\s*\/\s*Pie chart/);
  await expect(breadcrumbs.getByRole('link', { name: 'Dashboard', exact: true })).toHaveAttribute('href', '/docs/dashboards/create');
  await expect(breadcrumbs.getByText('Pie chart', { exact: true })).toHaveAttribute('aria-current', 'page');
});

test('placeholder forms update and copy every matching code example', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/docs/restapi/query');

  const form = page.locator('.placeholder-config').first();
  const codeBlock = form.locator('xpath=preceding-sibling::figure[1]');
  await form.locator('select').selectOption('us-east-1.aws.edge.axiom.co');
  await form.getByPlaceholder('xaat-api-token').fill('xaat-example-token');
  await form.getByPlaceholder('dataset-name').fill('example-dataset');

  await expect(codeBlock.locator('pre')).toContainText('https://us-east-1.aws.edge.axiom.co/v1/query/_apl');
  await expect(codeBlock.locator('pre')).toContainText('Authorization: Bearer xaat-example-token');
  await expect(codeBlock.locator('pre')).toContainText('"apl": "example-dataset | limit 10"');
  await expect(codeBlock.locator('pre')).not.toContainText(/AXIOM_DOMAIN|API_TOKEN|DATASET_NAME/);

  await codeBlock.getByRole('button', { name: 'Copy Text' }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('https://us-east-1.aws.edge.axiom.co/v1/query/_apl');
  expect(copied).toContain('Authorization: Bearer xaat-example-token');
  expect(copied).toContain('"apl": "example-dataset | limit 10"');
  expect(copied).not.toMatch(/AXIOM_DOMAIN|API_TOKEN|DATASET_NAME/);

  const otherDatasetForms = page.locator('.placeholder-config').filter({ has: page.getByPlaceholder('dataset-name') });
  await expect(otherDatasetForms).toHaveCount(3);
  for (const otherForm of await otherDatasetForms.all()) {
    await expect(otherForm.getByPlaceholder('dataset-name')).toHaveValue('example-dataset');
    await expect(otherForm.locator('xpath=preceding-sibling::figure[1]').locator('pre')).toContainText('example-dataset');
  }

  await page.goto('/docs/getting-started');
  const persistedForm = page.locator('.placeholder-config').first();
  await expect(persistedForm.getByPlaceholder('xaat-api-token')).toHaveValue('xaat-example-token');
  await expect(persistedForm.getByPlaceholder('dataset-name')).toHaveValue('example-dataset');
  const persistedCodeBlock = persistedForm.locator('xpath=preceding-sibling::figure[1]');
  await expect(persistedCodeBlock.locator('pre')).toContainText('xaat-example-token');
  await expect(persistedCodeBlock.locator('pre')).toContainText('example-dataset');

  await page.goto('/docs/guides/opentelemetry-claude-code');
  const compositeNameBlock = page.locator('figure').filter({ hasText: 'AXIOM_METRICS_DATASET' }).first();
  const compositeNameForm = compositeNameBlock.locator('xpath=following-sibling::div[contains(@class,"placeholder-config")][1]');
  await expect(compositeNameBlock.locator('pre')).toContainText('AXIOM_API_TOKEN="xaat-example-token"');
  await expect(compositeNameBlock.locator('pre')).toContainText('AXIOM_METRICS_DATASET="METRICS_DATASET_NAME"');
  await expect(compositeNameForm.getByPlaceholder('dataset-name')).toHaveCount(0);
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
