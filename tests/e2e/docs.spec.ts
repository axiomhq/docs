import { expect, test } from '@playwright/test';

test('landing, guide, query, and API routes render', async ({ page }) => {
  await page.goto('/docs');
  await expect(page.getByRole('heading', { name: 'From first event to petabyte scale.' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', /^(dark|light)$/);

  await page.goto('/docs/getting-started');
  await expect(page.getByRole('heading', { name: 'Quickstart', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Axiom fundamentals', level: 2 })).toBeVisible();

  await page.goto('/docs/llms/llms-apl');
  await expect(page).toHaveURL(/\/docs\/llms-apl\.md$/);

  await page.goto('/docs/apl/tabular-operators/summarize-operator');
  await expect(page.getByRole('heading', { name: 'summarize', level: 1 })).toBeVisible();

  await page.goto('/docs/restapi/endpoints/ingestIntoDataset');
  await expect(page.getByText('/v1/datasets/{dataset_name}/ingest', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Parameters' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Response' })).toBeVisible();
});

test('shared icon cards match the www treatment with compact docs spacing', async ({ page }, testInfo) => {
  await page.goto('/docs');
  const landing = page.locator('.landing-content');
  const flares = page.locator('canvas.hero-flares');
  const hero = page.locator('.landing-hero');
  const heroTitle = hero.getByRole('heading', { level: 1 });
  const heroDescription = hero.locator('p');
  await expect(heroTitle).toHaveCSS('text-align', 'center');
  await expect(heroTitle).toHaveCSS('font-weight', '500');
  await expect(heroDescription).toHaveCSS('text-align', 'center');
  const heroBox = (await hero.boundingBox())!;
  const heroTitleBox = (await heroTitle.boundingBox())!;
  const heroDescriptionBox = (await heroDescription.boundingBox())!;
  const heroCenter = heroBox.x + heroBox.width / 2;
  expect(Math.abs(heroTitleBox.x + heroTitleBox.width / 2 - heroCenter)).toBeLessThanOrEqual(1);
  expect(Math.abs(heroDescriptionBox.x + heroDescriptionBox.width / 2 - heroCenter)).toBeLessThanOrEqual(1);
  await expect(flares).toHaveCount(1);
  await expect(flares).toHaveAttribute('aria-hidden', 'true');
  await expect(flares).toHaveCSS('pointer-events', 'none');
  await expect(flares).toHaveCSS('position', 'absolute');
  if (testInfo.project.name === 'desktop-chromium') {
    await expect(flares).toBeVisible();
    await expect(landing).toHaveCSS('padding-top', '208px');
  } else {
    await expect(flares).toBeHidden();
    await expect(landing).toHaveCSS('padding-top', '28px');
  }

  const sectionHeadings = page.locator('[data-slot="landing-section-heading"]');
  await expect(sectionHeadings).toHaveCount(2);
  for (const [index, name] of ['Send data', 'Explore the platform'].entries()) {
    const heading = sectionHeadings.nth(index);
    const headingTitle = heading.getByRole('heading', { level: 2, name, exact: true });
    const divider = heading.locator('[data-slot="landing-section-heading-divider"]');
    await expect(headingTitle).toHaveCSS('font-weight', '400');
    await expect(headingTitle).toHaveCSS('letter-spacing', /^(normal|0px)$/);
    await expect(divider).toHaveCSS('height', '1px');
    await expect(divider).toHaveCSS('background-image', /linear-gradient/);
  }
  const allIntegrations = sectionHeadings.first().getByRole('link', {
    name: 'All integrations',
    exact: true,
  });
  await expect(allIntegrations).toHaveAttribute('href', '/docs/apps/introduction');
  await expect(allIntegrations).toHaveCSS('font-weight', '400');
  await expect(sectionHeadings.nth(1).getByRole('link')).toHaveCount(0);

  const quickGrid = page.locator('.quick-grid');
  const integrationList = page.locator('.integration-list');
  const platformList = page.locator('.platform-list');
  await expect(
    quickGrid.getByRole('link', { name: /Query with APL/ }),
  ).toHaveAttribute('href', '/docs/apl/introduction');
  await expect(
    integrationList.getByRole('link', { name: /AWS/ }),
  ).toHaveAttribute('href', '/docs/send-data/aws-overview');
  await expect(
    integrationList.getByRole('link', { name: /Syslog/ }),
  ).toHaveAttribute('href', '/docs/send-data/syslog-proxy');
  await expect(
    platformList.getByRole('link', { name: /Explore data/ }),
  ).toHaveAttribute('href', '/docs/query-data/explore');
  await expect(
    platformList.getByRole('link', { name: /Query with APL/ }),
  ).toHaveAttribute('href', '/docs/apl/introduction');

  const landingCards = page.locator('.quick-grid > .icon-card');
  await expect(landingCards).toHaveCount(3);
  await expect(landingCards.first()).toHaveClass(/quick-card/);
  await expect(landingCards.first()).toHaveClass(/rounded-xl/);
  await expect(landingCards.first()).toHaveClass(/border-gray-3\/50/);
  await expect(landingCards.first()).toHaveClass(/gap-6/);
  await expect(landingCards.first()).toHaveCSS('border-top-width', '1px');
  await expect(landingCards.first()).toHaveCSS('border-top-style', 'solid');
  await expect(landingCards.first()).toHaveCSS('gap', '24px');
  await expect(landingCards.first().locator('.icon-card-icon')).toBeVisible();
  await expect(landingCards.first().locator('.icon-card-icon svg')).toHaveCSS('width', '20px');
  // Quick cards sit above the first LandingSectionHeading h2, so their titles
  // are h2 to keep the outline sequential.
  await expect(landingCards.first().getByRole('heading', { level: 2 })).toHaveCSS('font-size', '14px');
  await expect(landingCards.first().getByRole('heading', { level: 2 })).toHaveCSS('font-weight', '450');
  const arrow = landingCards.first().locator('svg[aria-hidden="true"]').last();
  await expect(arrow).toHaveCSS('opacity', '0');
  if (testInfo.project.name === 'desktop-chromium') {
    const restingBorder = await landingCards.first().evaluate((element) => getComputedStyle(element).borderTopColor);
    await landingCards.first().hover();
    await expect(arrow).toHaveCSS('opacity', '1');
    await expect.poll(() => landingCards.first().evaluate((element) => getComputedStyle(element).borderTopColor))
      .not.toBe(restingBorder);
  }

  await page.goto('/docs/apps/introduction');
  const extensionCards = page.locator('.app-cards > .icon-card');
  await expect(extensionCards).toHaveCount(12);
  await expect(extensionCards.first()).toHaveClass(/app-card/);
  await expect(extensionCards.first()).toHaveCSS('gap', '24px');
  await expect(extensionCards.first()).toHaveAttribute('href', '/docs/apps/lambda');
});

test('landing platform rows stay simple and contained across breakpoints', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs');

  const rows = page.locator('.platform-list > .platform-row');
  const separators = page.locator('.platform-list > hr[data-slot="platform-row-separator"]');
  await expect(rows).toHaveCount(6);
  await expect(separators).toHaveCount(5);
  await expect(rows.first()).toHaveAttribute('href', '/docs/send-data/methods');
  await expect(rows.last()).toHaveAttribute('href', '/docs/reference/datasets');
  await expect(rows.first()).toHaveCSS('border-bottom-width', '0px');

  const platformListBox = (await page.locator('.platform-list').boundingBox())!;
  const separatorBox = (await separators.first().boundingBox())!;
  expect(separatorBox.height).toBe(1);
  expect(Math.abs(separatorBox.width - (platformListBox.width - 10))).toBeLessThanOrEqual(1);
  expect(
    Math.abs(
      separatorBox.x -
        (platformListBox.x + (platformListBox.width - separatorBox.width) / 2),
    ),
  ).toBeLessThanOrEqual(1);

  const firstRow = rows.first();
  const title = firstRow.locator('[data-slot="platform-row-title"]');
  const description = firstRow.locator('[data-slot="platform-row-description"]');
  const arrow = firstRow.locator('[data-slot="platform-row-arrow"]');
  const [rowBox, titleBox, descriptionBox, arrowBox] = await Promise.all(
    [firstRow, title, description, arrow].map((locator) => locator.boundingBox()),
  );
  expect(descriptionBox!.x).toBeGreaterThan(titleBox!.x + titleBox!.width);
  expect(arrowBox!.x).toBeGreaterThan(descriptionBox!.x + descriptionBox!.width);
  expect(arrowBox!.x + arrowBox!.width).toBeLessThanOrEqual(rowBox!.x + rowBox!.width + 1);
  await expect(arrow).toHaveText('→');
  await expect(arrow).toHaveCSS('border-top-width', '0px');
  await expect(arrow).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(arrow).toHaveCSS('transition-duration', '0s');
  expect(
    await firstRow.evaluate((element) => getComputedStyle(element, '::before').content),
  ).toBe('none');

  if (testInfo.project.name === 'desktop-chromium') {
    const restingBackground = await firstRow.evaluate((element) => getComputedStyle(element).backgroundColor);
    const restingArrowColor = await arrow.evaluate((element) => getComputedStyle(element).color);
    await firstRow.hover();
    await expect.poll(() => firstRow.evaluate((element) => getComputedStyle(element).backgroundColor))
      .not.toBe(restingBackground);
    await expect.poll(() => arrow.evaluate((element) => getComputedStyle(element).color))
      .not.toBe(restingArrowColor);
  }
  await firstRow.focus();
  await expect(firstRow).toHaveCSS('outline-width', '1px');

  await page.setViewportSize({ width: 390, height: 844 });
  const [mobileRowBox, mobileTitleBox, mobileDescriptionBox, mobileArrowBox] = await Promise.all(
    [firstRow, title, description, arrow].map((locator) => locator.boundingBox()),
  );
  expect(Math.abs(mobileTitleBox!.x - mobileDescriptionBox!.x)).toBeLessThanOrEqual(1);
  expect(mobileDescriptionBox!.y).toBeGreaterThan(mobileTitleBox!.y);
  expect(mobileArrowBox!.x + mobileArrowBox!.width).toBeLessThanOrEqual(
    mobileRowBox!.x + mobileRowBox!.width + 1,
  );
  expect(
    await page.locator('.landing-content').evaluate((element) => element.scrollWidth - element.clientWidth),
  ).toBeLessThanOrEqual(1);
  const mobilePlatformListBox = (await page.locator('.platform-list').boundingBox())!;
  const mobileSeparatorBox = (await separators.first().boundingBox())!;
  expect(Math.abs(mobileSeparatorBox.width - (mobilePlatformListBox.width - 10)))
    .toBeLessThanOrEqual(1);
  expect(
    Math.abs(
      mobileSeparatorBox.x -
        (mobilePlatformListBox.x + (mobilePlatformListBox.width - mobileSeparatorBox.width) / 2),
    ),
  ).toBeLessThanOrEqual(1);
});

test('landing community and support cards link and stack cleanly', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs');

  const platform = page.locator('.platform-index');
  const community = page.getByRole('region', { name: 'Community and support' });
  const cards = community.locator('[data-slot="community-support-card"]');
  const discord = cards.first();
  const support = cards.last();

  await expect(community).toBeVisible();
  await expect(cards).toHaveCount(2);
  await expect(discord).toHaveAttribute('href', 'https://discord.gg/axiom-co');
  await expect(discord).toHaveAttribute('target', '_blank');
  await expect(discord).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(support).toHaveAttribute('href', 'https://axiom.co/support');
  await expect(discord.locator('strong')).toHaveText('Build with the community');
  await expect(discord.locator('strong')).toHaveCSS('font-weight', '500');
  await expect(support.locator('strong')).toHaveText('Talk to our support team');
  await expect(support.locator('strong')).toHaveCSS('font-weight', '500');
  const icons = cards.locator('[data-slot="community-support-icon"]');
  await expect(icons).toHaveCount(2);
  await expect(icons.first()).toHaveAttribute('aria-hidden', 'true');
  await expect(icons.last()).toHaveAttribute('aria-hidden', 'true');
  await expect(discord).toHaveClass(/rounded-xl/);
  await expect(discord).toHaveClass(/border-gray-3\/50/);
  const iconCardRadius = await page.locator('.quick-card').first()
    .evaluate((element) => getComputedStyle(element).borderRadius);
  await expect(discord).toHaveCSS('border-radius', iconCardRadius);
  await expect(discord).toHaveCSS('border-top-width', '1px');
  await expect(discord).toHaveCSS('box-shadow', 'none');

  const [platformBox, communityBox, discordBox, supportBox] = await Promise.all(
    [platform, community, discord, support].map((locator) => locator.boundingBox()),
  );
  expect(communityBox!.y).toBeGreaterThan(platformBox!.y + platformBox!.height);
  expect(Math.abs(discordBox!.y - supportBox!.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(discordBox!.height - supportBox!.height)).toBeLessThanOrEqual(1);
  expect(Math.abs(discordBox!.width - supportBox!.width)).toBeLessThanOrEqual(1);
  expect(supportBox!.x - (discordBox!.x + discordBox!.width)).toBeGreaterThanOrEqual(15);
  await expect(support).toHaveCSS('border-left-width', '1px');
  await expect(support).toHaveCSS('border-top-width', '1px');

  await discord.focus();
  await expect(discord).toHaveCSS('outline-width', '1px');

  await page.setViewportSize({ width: 390, height: 844 });
  const [mobileCommunityBox, mobileDiscordBox, mobileSupportBox] = await Promise.all(
    [community, discord, support].map((locator) => locator.boundingBox()),
  );
  expect(Math.abs(mobileDiscordBox!.x - mobileSupportBox!.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(mobileDiscordBox!.width - mobileSupportBox!.width)).toBeLessThanOrEqual(1);
  expect(mobileSupportBox!.y).toBeGreaterThanOrEqual(
    mobileDiscordBox!.y + mobileDiscordBox!.height + 15,
  );
  expect(mobileDiscordBox!.width).toBeLessThanOrEqual(mobileCommunityBox!.width + 1);
  await expect(support).toHaveCSS('border-left-width', '1px');
  await expect(support).toHaveCSS('border-top-width', '1px');
  expect(
    await page.locator('.landing-content').evaluate((element) => element.scrollWidth - element.clientWidth),
  ).toBeLessThanOrEqual(1);
});

test('landing flare respects reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/docs');

  // Screenshot comparison can't prove anything here: headless Chromium has no
  // WebGL, so the canvas never paints in either motion mode. The shader
  // surfaces its motion decision as data-animate instead.
  const flare = page.locator('canvas.hero-flares');
  await expect(flare).toBeVisible();
  await expect(flare).toHaveAttribute('data-animate', 'false');

  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'no-preference' });
  await page.reload();
  await expect(flare).toHaveAttribute('data-animate', 'true');
});

test('API reference sidebar icons stay on Get started and Edge links', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/restapi/introduction');

  const apiSidebar = page.locator('.sidebar');
  const getStartedHrefs = [
    '/docs/restapi/introduction',
    '/docs/restapi/ingest',
    '/docs/restapi/query',
    '/docs/restapi/pagination',
    '/docs/restapi/api-limits',
  ];
  const edgeHrefs = [
    '/docs/restapi/endpoints/ingestToDataset',
    '/docs/restapi/endpoints/ingestHecEvent',
    '/docs/restapi/endpoints/ingestHecRaw',
    '/docs/restapi/endpoints/getHecHealth',
    '/docs/restapi/endpoints/queryEdge',
    '/docs/restapi/endpoints/queryBatch',
    '/docs/restapi/endpoints/queryMetrics',
    '/docs/restapi/endpoints/getDatasetMetrics',
    '/docs/restapi/endpoints/getDatasetMetricTags',
    '/docs/restapi/endpoints/getDatasetMetricTagValues',
    '/docs/restapi/endpoints/getDatasetTags',
    '/docs/restapi/endpoints/getDatasetTagValues',
  ];
  for (const href of [...getStartedHrefs, ...edgeHrefs]) {
    await expect(
      apiSidebar.locator(`a[href="${href}"] > [data-slot="sidebar-icon"]`),
    ).toHaveCount(1);
  }
  await expect(apiSidebar.locator('[data-slot="sidebar-icon"]')).toHaveCount(
    getStartedHrefs.length + edgeHrefs.length,
  );
  await expect(
    apiSidebar.locator(
      'a[href="/docs/restapi/endpoints/getAnnotations"] > [data-slot="sidebar-icon"]',
    ),
  ).toHaveCount(0);
  await expect(
    apiSidebar.locator('[data-slot="sidebar-icon"]').first(),
  ).toHaveCSS('width', '14px');
  await expect(
    apiSidebar.locator('[data-slot="sidebar-icon"]').first(),
  ).toHaveAttribute('aria-hidden', 'true');
});

test('API sidebar methods use semantic low-opacity badges', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/docs/restapi/endpoints/getDashboards');

  const apiSidebar = page.locator('.sidebar');
  const methods = [
    ['GET', '/docs/restapi/endpoints/getDashboards'],
    ['POST', '/docs/restapi/endpoints/createDashboard'],
    ['PUT', '/docs/restapi/endpoints/updateDashboard'],
    ['PATCH', '/docs/restapi/endpoints/patchDashboard'],
    ['DELETE', '/docs/restapi/endpoints/deleteDashboard'],
  ] as const;

  async function readBadgeStyles() {
    return Promise.all(methods.map(async ([method, href]) => {
      const badge = apiSidebar.locator(`a[href="${href}"] .method`);
      await expect(badge).toHaveText(method);
      await expect(badge).toHaveClass(new RegExp(`method-${method.toLowerCase()}`));
      await expect(badge).toHaveCSS('font-weight', '400');
      return badge.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          background: style.backgroundColor,
          backgroundVariable: style.getPropertyValue('--method-badge-background'),
          color: style.color,
          colorVariable: style.getPropertyValue('--method-badge-color'),
        };
      });
    }));
  }

  const darkStyles = await readBadgeStyles();
  for (const style of darkStyles) {
    expect(style.background).not.toBe('rgba(0, 0, 0, 0)');
    expect(style.backgroundVariable).toContain('11%');
    expect(style.colorVariable).not.toBe('');
  }
  expect(new Set(darkStyles.map(({ color }) => color)).size).toBe(4);

  await page.getByRole('button', { name: 'Toggle color theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const lightStyles = await readBadgeStyles();
  for (const [index, style] of lightStyles.entries()) {
    expect(style.background).not.toBe('rgba(0, 0, 0, 0)');
    expect(style.color).not.toBe(darkStyles[index].color);
  }
  expect(new Set(lightStyles.map(({ color }) => color)).size).toBe(4);
});

test('API reference uses highlighted code, compact schemas, and persistent language tabs', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/docs/restapi/endpoints/getToken');

  // Section ids live on the headings now (HeadingAnchor), not the sections.
  const requestCode = page.locator('.api-section:has(#example) .api-code');
  await expect(requestCode.getByRole('tab', { name: 'cURL' })).toHaveAttribute('aria-selected', 'true');
  await expect(requestCode.getByRole('tab', { name: 'JavaScript' })).toBeVisible();
  await expect(requestCode.getByRole('tab', { name: 'Python' })).toBeVisible();
  await expect(requestCode.getByRole('tab', { name: 'Go' })).toBeVisible();
  await expect(requestCode.locator('pre.shiki')).toBeVisible();

  const tokenColors = await requestCode.locator('pre.shiki span').evaluateAll((elements) => (
    [...new Set(elements.map((element) => getComputedStyle(element).color))]
  ));
  expect(tokenColors.length).toBeGreaterThan(1);
  // axiom-dark default token colour (lib/code-theme.ts).
  expect(tokenColors).toContain('rgb(212, 207, 201)');
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
  await expect(tryIt).toHaveClass(/ph-no-capture/);
  await expect(tryIt).toHaveAttribute('data-ph-no-capture', 'true');
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
  await expect(page.locator('.api-section:has(#response) .api-code')).toHaveCount(0);

  const responseSchema = page.getByRole('table', { name: 'Response schema' });
  const expiresRow = responseSchema.getByRole('row').filter({ hasText: 'expiresAt' });
  expect((await expiresRow.boundingBox())!.height).toBeLessThanOrEqual(44);

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
  await expect(page.locator('.api-section:has(#example)').getByRole('tab', { name: 'Python' })).toHaveAttribute('aria-selected', 'true');

  await page.goto('/docs/restapi/endpoints/getDashboards');
  const listResponseSchema = page.getByRole('table', { name: 'Response schema' });
  await expect(listResponseSchema).toBeVisible();
  await expect(listResponseSchema.getByRole('row').filter({ hasText: /^createdAtstring<date-time>/ })).toBeVisible();
  await expect(listResponseSchema.getByRole('row').filter({ hasText: /^dashboardobject/ })).toHaveAttribute('data-depth', '0');
  await expect(listResponseSchema.getByRole('row').filter({ hasText: /^└name/ }).first()).toHaveAttribute('data-depth', '1');
});

test('unauthenticated endpoints omit credentials from samples and the request runner', async ({ page }) => {
  await page.goto('/docs/restapi/endpoints/provisionOrg');

  const requestCode = page.locator('.api-section:has(#example) .api-code');
  const curlPanel = requestCode.getByRole('tabpanel', { name: 'cURL code example' });
  await expect(curlPanel).toContainText("curl -X POST 'https://api.axiom.co/v2/orgs/provision'");
  await expect(curlPanel).not.toContainText('Authorization');
  await requestCode.getByRole('tab', { name: 'Python' }).click();
  await expect(requestCode.getByRole('tabpanel', { name: 'Python code example' })).not.toContainText('Authorization');

  const tryIt = page.locator('.api-try');
  await tryIt.getByText('Try it', { exact: true }).click();
  await expect(tryIt.getByText('This endpoint doesn’t require authentication.')).toBeVisible();
  await expect(tryIt.getByLabel('API token Required')).toHaveCount(0);
  await expect(tryIt.getByRole('button', { name: 'Run POST request' })).toBeEnabled();
});

test('theme follows the system until toggled and persists explicit light and dark preferences', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/docs');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.locator('html').evaluate((element) => getComputedStyle(element).getPropertyValue('--radius').trim())).toMatch(/^0?\.475rem$/);
  expect(await page.locator('html').evaluate((element) => getComputedStyle(element).getPropertyValue('--radius-4xl').trim())).toMatch(/^calc\(0?\.475rem \* 2\.6\)$/);
  expect(await page.evaluate(() => localStorage.getItem('axiom-docs-theme'))).toBeNull();

  const themeToggle = page.getByRole('button', { name: 'Toggle color theme' });
  await expect(themeToggle.locator('[data-theme-icon=sun]')).toBeVisible();
  await expect(themeToggle.locator('[data-theme-icon=moon]')).toBeHidden();
  await expect(page.getByRole('menu', { name: 'Color theme' })).toHaveCount(0);
  await themeToggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(themeToggle.locator('[data-theme-icon=moon]')).toBeVisible();
  await expect(themeToggle.locator('[data-theme-icon=sun]')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('axiom-docs-theme'))).toBe('light');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Toggle color theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => localStorage.getItem('axiom-docs-theme'))).toBe('dark');
});

test('keyboard focus indicators use the Axiom brand color everywhere', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/platform-overview/architecture');

  async function verifyFocusColor() {
    const colors = await page.evaluate(() => {
      const probe = document.createElement('span');
      document.body.append(probe);
      const resolve = (value: string) => {
        probe.style.color = value;
        return getComputedStyle(probe).color;
      };
      const resolved = {
        brand: resolve('var(--brand)'),
        fumadocsRing: resolve('var(--color-fd-ring)'),
        ring: resolve('var(--ring)'),
        sidebarRing: resolve('var(--sidebar-ring)'),
      };
      probe.remove();
      return resolved;
    });

    expect(colors.ring).toBe(colors.brand);
    expect(colors.sidebarRing).toBe(colors.brand);
    expect(colors.fumadocsRing).toBe(colors.brand);

    const headerTab = page.getByRole('navigation', { name: 'Documentation sections' })
      .getByRole('link', { name: 'Query Reference', exact: true });
    await headerTab.focus();
    await expect(headerTab).toHaveCSS('outline-color', colors.brand);

    const disclosure = page.locator('.nav-nested > summary').first();
    await disclosure.focus();
    await expect(disclosure).toHaveCSS('outline-color', colors.brand);

    const themeToggle = page.getByRole('button', { name: 'Toggle color theme' });
    await themeToggle.focus();
    await expect(themeToggle).toHaveCSS('border-color', colors.brand);
  }

  await verifyFocusColor();
  await page.getByRole('button', { name: 'Toggle color theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await verifyFocusColor();
});

test('Mermaid diagrams render with semantic theme colors', async ({ page }) => {
  const mermaidErrors: string[] = [];
  page.on('console', (message) => {
    if (message.text().includes('[docs] mermaid render failed')) {
      mermaidErrors.push(message.text());
    }
  });

  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/docs/splunk/overview');

  const diagram = page.locator('.doc-mermaid[data-rendered]');
  const sourceFallback = page.locator('.doc-mermaid-source');
  await expect.poll(async () => (await diagram.count()) + (await sourceFallback.count())).toBe(1);
  expect(await sourceFallback.count(), mermaidErrors.join('\n')).toBe(0);
  await expect(diagram.locator('svg')).toBeVisible();

  await page.getByRole('button', { name: 'Toggle color theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(diagram.locator('svg')).toBeVisible();
  await expect(sourceFallback).toHaveCount(0);

  await page.goto('/docs/splunk/portal/overview');
  await expect(page.locator('.doc-mermaid[data-rendered]')).toHaveCount(3);
  await expect(page.locator('.doc-mermaid svg')).toHaveCount(3);
  await expect(page.locator('.doc-mermaid-source')).toHaveCount(0);
});

test('Mermaid labels stay inside their boxes', async ({ page }) => {
  // Guards the measure/render font alignment in components/mermaid.tsx:
  // mermaid sizes boxes from its own text measurement, and any drift between
  // the fonts it measures with and the fonts the page renders shows up as
  // labels spilling past their box borders.
  await page.goto('/docs/splunk/portal/observability-cloud');
  const diagram = page.locator('.doc-mermaid[data-rendered]');
  await expect(diagram.locator('svg')).toBeVisible();

  const overflows = await page.evaluate(() => {
    const out: string[] = [];
    for (const text of document.querySelectorAll('.doc-mermaid svg text.actor')) {
      const rect = text.closest('g')?.querySelector('rect.actor');
      if (!rect) continue;
      const textBox = text.getBoundingClientRect();
      const rectBox = rect.getBoundingClientRect();
      if (textBox.left < rectBox.left - 1 || textBox.right > rectBox.right + 1) {
        out.push(text.textContent?.trim() ?? '');
      }
    }
    return out;
  });
  expect(overflows).toEqual([]);
});

test('table headers use normal font weight', async ({ page }) => {
  await page.goto('/docs/reference/system-requirements');
  await expect(page.locator('.doc-article table thead th').filter({ hasText: 'Android' })).toHaveCSS(
    'font-weight',
    '400',
  );

  await page.goto('/docs/restapi/endpoints/getToken');
  await expect(page.locator('.api-schema-table thead th').first()).toHaveCSS('font-weight', '400');
});

test('selected navigation rows stay stronger than hover in both themes', async ({ page }, testInfo) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 1440, height: 900 });

  async function verifyInteractionSurfaces(
    expectedSource: 'secondary' | 'foreground',
    expectedHoverOpacity: number,
    expectedSelectedOpacity: number,
  ) {
    await page.goto('/docs/platform-overview/architecture');

    const interactionColors = await page.evaluate(({ source, hoverOpacity, selectedOpacity }) => {
      const probe = document.createElement('span');
      document.body.append(probe);

      probe.style.backgroundColor = 'var(--interactive-hover)';
      const hover = getComputedStyle(probe).backgroundColor;
      probe.style.backgroundColor = 'var(--interactive-selected)';
      const selected = getComputedStyle(probe).backgroundColor;
      probe.style.backgroundColor = `color-mix(in srgb, var(--${source}) ${hoverOpacity}%, transparent)`;
      const expectedHover = getComputedStyle(probe).backgroundColor;
      probe.style.backgroundColor = `color-mix(in srgb, var(--${source}) ${selectedOpacity}%, transparent)`;
      const expectedSelected = getComputedStyle(probe).backgroundColor;
      probe.remove();

      return { expectedHover, expectedSelected, hover, selected };
    }, {
      source: expectedSource,
      hoverOpacity: expectedHoverOpacity,
      selectedOpacity: expectedSelectedOpacity,
    });
    expect(interactionColors.hover).toBe(interactionColors.expectedHover);
    expect(interactionColors.selected).toBe(interactionColors.expectedSelected);
    expect(interactionColors.selected).not.toBe(interactionColors.hover);

    const sections = page.getByRole('navigation', { name: 'Documentation sections' });
    const activeSection = sections.getByRole('link', { name: 'Documentation', exact: true });
    const inactiveSection = sections.getByRole('link', { name: 'Query Reference', exact: true });
    await expect(activeSection).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    if (testInfo.project.name === 'desktop-chromium') {
      await activeSection.hover();
      await expect(activeSection).toHaveCSS('background-color', interactionColors.hover);
      await inactiveSection.hover();
      await expect(inactiveSection).toHaveCSS('background-color', interactionColors.hover);
    }

    await page.goto('/docs/reference/datasets');
    const fundamentals = page.locator('details.nav-nested').filter({
      has: page.locator(':scope > summary').filter({ hasText: 'Fundamentals' }),
    }).first();
    const activeParent = fundamentals.locator(':scope > summary');
    const activePage = fundamentals.getByRole('link', { name: 'Datasets', exact: true });
    const inactivePage = fundamentals.getByRole('link', { name: 'Limits', exact: true });
    await expect(activeParent).toHaveCSS('background-color', interactionColors.hover);
    await expect(activePage).toHaveCSS('background-color', interactionColors.selected);
    if (testInfo.project.name === 'desktop-chromium') {
      await inactivePage.hover();
      await expect(inactivePage).toHaveCSS('background-color', interactionColors.hover);
    }
  }

  await verifyInteractionSurfaces('secondary', 30, 50);
  await page.getByRole('button', { name: 'Toggle color theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await verifyInteractionSurfaces('foreground', 4, 8);
});

test('expanded sidebar parents stay unhighlighted without an active descendant', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/get-help/faq');

  const sidebar = page.getByRole('navigation', { name: 'Page navigation' });
  const activePage = sidebar.getByRole('link', { name: 'FAQs', exact: true });
  const legal = sidebar.locator('details.nav-nested').filter({
    has: page.locator(':scope > summary').filter({ hasText: 'Legal' }),
  }).first();
  const legalSummary = legal.locator(':scope > summary');

  await expect(activePage).toHaveClass(/active/);
  await legalSummary.click();
  await expect(legal).toHaveAttribute('open', '');
  await page.mouse.move(900, 200);
  await expect(legalSummary).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(activePage).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

  await page.goto('/docs/legal/cookies');
  await expect(legal).toHaveAttribute('open', '');
  await expect(legalSummary).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
});

test('only the topmost active sidebar parent is highlighted at every nesting depth', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/apl/tabular-operators/distinct-operator');

  const sidebar = page.getByRole('navigation', { name: 'Page navigation' });
  const operators = sidebar.locator('details.nav-nested').filter({
    has: page.locator(':scope > summary').filter({ hasText: 'Operators' }),
  }).first();
  const tabularOperators = operators.locator('details.nav-nested').filter({
    has: page.locator(':scope > summary').filter({ hasText: 'Tabular operators' }),
  }).first();
  const operatorsSummary = operators.locator(':scope > summary');
  const tabularOperatorsSummary = tabularOperators.locator(':scope > summary');
  const activePage = tabularOperators.getByRole('link', {
    name: 'distinct',
    exact: true,
  });
  const transparent = 'rgba(0, 0, 0, 0)';
  const interactionColors = await page.evaluate(() => {
    const probe = document.createElement('span');
    document.body.append(probe);
    probe.style.backgroundColor = 'var(--interactive-hover)';
    const hover = getComputedStyle(probe).backgroundColor;
    probe.style.backgroundColor = 'var(--interactive-selected)';
    const selected = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return { hover, selected };
  });

  await expect(operators).toHaveAttribute('open', '');
  await expect(tabularOperators).toHaveAttribute('open', '');
  await expect(operatorsSummary).toHaveCSS('background-color', interactionColors.hover);
  await expect(tabularOperatorsSummary).toHaveCSS('background-color', transparent);
  await expect(activePage).toHaveClass(/active/);
  await expect(activePage).toHaveCSS('background-color', interactionColors.selected);

  await page.goto('/docs/dashboard-elements/gauge');
  const deepParentSummaries = ['Console', 'Dashboard', 'Elements', 'Element types'].map(
    (title) => sidebar.locator('summary').filter({
      has: page.getByText(title, { exact: true }),
    }),
  );
  await expect(deepParentSummaries[0]).toHaveCSS(
    'background-color',
    interactionColors.hover,
  );
  for (const nestedSummary of deepParentSummaries.slice(1)) {
    await expect(nestedSummary).toHaveCSS('background-color', transparent);
  }
  const deepActivePage = sidebar.getByRole('link', { name: 'Gauge', exact: true });
  await expect(deepActivePage).toHaveClass(/active/);
  await expect(deepActivePage).toHaveCSS(
    'background-color',
    interactionColors.selected,
  );
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

test('search stays private and hands off to the persistent assistant sidebar', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.goto('/docs');

  const dialog = page.getByRole('dialog', { name: 'Search Axiom Docs' });
  await expect.poll(async () => {
    await page.keyboard.press('ControlOrMeta+KeyK');
    return dialog.isVisible();
  }, { timeout: 15_000 }).toBe(true);
  await expect(dialog).toHaveClass(/ph-no-capture/);
  await expect(dialog.locator('[data-slot="command"]')).toHaveAttribute('data-ph-no-capture', 'true');
  // The mode tabs are gone — Ask AI is a button beside the input.
  const inputRow = dialog.locator('[data-slot="command-input-wrapper"]');
  await expect(inputRow.getByRole('button', { name: /Ask AI/ })).toBeVisible();
  const searchInput = page.getByRole('combobox', { name: 'Search documentation' });
  await expect(searchInput).toBeFocused();
  await expect(searchInput).toHaveAttribute('placeholder', 'Search pages, APIs, APL, and MPL…');
  const searchRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/docs/api/search') searchRequests.push(request.url());
  });
  await searchInput.pressSequentially('filter array', { delay: 25 });
  const firstSearchResult = page.locator('.docs-search-result').first();
  await expect(firstSearchResult).toContainText('array_iff');
  await expect(firstSearchResult).toContainText('filter arrays by a condition');
  await expect(firstSearchResult.locator('.docs-search-result-path')).toHaveText('Docs / … / array_iff');
  await expect(firstSearchResult.locator('.docs-search-result-path')).toHaveAttribute('title', /Array functions/);
  expect(searchRequests).toHaveLength(1);
  // Typing must not let cmdk re-pin the selection to the Ask AI row — Enter
  // has to keep meaning "open the first result".
  await searchInput.press('x');
  await searchInput.press('Backspace');
  await expect(firstSearchResult).toHaveAttribute('aria-selected', 'true');
  for (let index = 0; index < 8; index += 1) await searchInput.press('ArrowDown');
  await expect(page.locator('.docs-search-result').nth(8)).toHaveAttribute('aria-selected', 'true');
  // Keyboard selection keeps the active row inside the list's visible box —
  // whether that required scrolling depends on the viewport height.
  expect(await page.locator('.docs-search-results').evaluate((element) => {
    const selected = element.querySelector('[data-slot="command-item"][data-selected="true"]');
    if (!selected) return false;
    const list = element.getBoundingClientRect();
    const row = selected.getBoundingClientRect();
    return row.top >= list.top - 1 && row.bottom <= list.bottom + 1;
  })).toBe(true);

  await searchInput.fill('splunk');
  const contextualResult = page.locator('.docs-search-result-content').filter({ hasText: /^Splunk:/ }).first();
  await expect(contextualResult).toContainText('Splunk uses a search command');
  await expect(contextualResult).not.toContainText('**');
  await expect(contextualResult).toContainText(/…$/);

  await searchInput.fill('dataset retention');
  const askFromSearch = dialog.getByRole('option', { name: /Ask AI about “dataset retention”/ });
  await expect(askFromSearch).toBeVisible();
  // The ask row sits above the results but never steals the default selection.
  await expect(firstSearchResult).toHaveAttribute('aria-selected', 'true');
  await searchInput.press('ArrowUp');
  await expect(askFromSearch).toHaveAttribute('aria-selected', 'true');
  await searchInput.press('Enter');

  // The handoff closes the dialog, opens the persistent assistant sidebar,
  // and submits the question immediately.
  await expect(dialog).not.toBeVisible();
  const assistantSidebar = page.locator('.docs-assistant-sidebar');
  await expect(assistantSidebar).toBeVisible();
  await expect(assistantSidebar).toHaveClass(/ph-no-capture/);
  await expect(assistantSidebar).toHaveAttribute('data-ph-no-capture', 'true');
  const assistantInput = page.getByRole('textbox', { name: 'Ask Axiom Docs' });
  const submittedQuestion = assistantSidebar.locator('.docs-assistant-message.user');
  await expect(submittedQuestion).toContainText('dataset retention');
  // Exactly one submission — a duplicate would mean the handoff double-fired
  // the chat API.
  await expect(submittedQuestion).toHaveCount(1);
  await expect(assistantInput).toHaveAttribute('data-ph-no-capture', 'true');
  await expect(page.locator('.ai-prompt-frame')).toBeVisible();
  expect(await page.evaluate(() => Object.values(localStorage).includes('dataset retention'))).toBe(false);

  // The sidebar lives in the layout, so client navigation keeps it open and
  // the draft intact, while the floating TOC yields the right rail to it.
  // Desktop only: the navigation sidebar is a closed drawer on mobile and the
  // floating TOC never renders there.
  if (testInfo.project.name === 'desktop-chromium') {
    await page.getByRole('link', { name: 'Quickstart' }).first().click();
    await expect(page).toHaveURL(/getting-started/);
    await expect(assistantSidebar).toBeVisible();
    await expect(submittedQuestion).toContainText('dataset retention');
    await expect(page.locator('.floating-toc')).toBeHidden();
  }

  // Escape inside the sidebar closes it; ⌘I reopens it without losing the
  // conversation, and the TOC returns while it is closed.
  await assistantInput.press('Escape');
  await expect(assistantSidebar).not.toBeVisible();
  if (testInfo.project.name === 'desktop-chromium') {
    await expect(page.locator('.floating-toc')).toBeVisible();
  }
  await page.keyboard.press('ControlOrMeta+KeyI');
  await expect(assistantSidebar).toBeVisible();
  await expect(assistantInput).toBeFocused();
  await expect(submittedQuestion).toContainText('dataset retention');
  // Reopening must not re-submit the handed-off question.
  await expect(submittedQuestion).toHaveCount(1);

  // The open flag persists to localStorage, so a refresh keeps the sidebar
  // (the conversation itself is not persisted yet) — and a fresh load must
  // never auto-submit anything.
  await page.reload();
  await expect(assistantSidebar).toBeVisible();
  await expect(submittedQuestion).toHaveCount(0);

  // ⌘I inside the search dialog hands the typed query to the assistant —
  // it must not blindly toggle the sidebar and discard the text.
  await expect.poll(async () => {
    await page.keyboard.press('ControlOrMeta+KeyK');
    return dialog.isVisible();
  }, { timeout: 15_000 }).toBe(true);
  await searchInput.fill('ingest tokens');
  await page.keyboard.press('ControlOrMeta+KeyI');
  await expect(dialog).not.toBeVisible();
  await expect(submittedQuestion).toContainText('ingest tokens');
  await expect(submittedQuestion).toHaveCount(1);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => {
    await page.keyboard.press('ControlOrMeta+KeyK');
    return dialog.isVisible();
  }, { timeout: 15_000 }).toBe(true);
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
  await expect(noticeParagraphs.nth(1)).toHaveCSS('margin-top', '14px');
  await expect(noticeParagraphs.nth(2)).toHaveCSS('margin-top', '14px');
});

test('notice variants pair Carbon icons and labels with their accent rule', async ({ page }) => {
  await page.goto('/docs/guides/opentelemetry-claude-code');

  for (const [type, label] of [
    ['warn', 'Warning'],
    ['info', 'Info'],
    ['idea', 'Idea'],
  ] as const) {
    const notice = page.locator(`.doc-notice[data-notice-type="${type}"]`).first();
    const heading = notice.locator('[data-slot="notice-heading"]');
    const icon = heading.locator('svg');

    await expect(notice).toBeVisible();
    await expect(heading).toContainText(label);
    await expect(icon).toHaveCount(1);
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
    await expect(icon).toHaveCSS('width', '16px');

    const colors = await notice.evaluate((element) => {
      const headingElement = element.querySelector('[data-slot="notice-heading"]')!;
      return {
        border: getComputedStyle(element).borderLeftColor,
        heading: getComputedStyle(headingElement).color,
        icon: getComputedStyle(headingElement.querySelector('svg')!).color,
        label: getComputedStyle(headingElement.querySelector('strong')!).color,
      };
    });
    expect(colors.heading).toBe(colors.border);
    expect(colors.icon).toBe(colors.border);
    expect(colors.label).toBe(colors.border);
  }
});

test('prose link hover uses a solid brand underline without dimming text', async ({ page }, testInfo) => {
  await page.goto('/docs/introduction');

  const link = page.getByRole('link', { name: 'Learn more about Axiom’s features', exact: true });
  const resting = await link.evaluate((element) => {
    const styles = getComputedStyle(element);
    return { color: styles.color, opacity: styles.opacity };
  });
  expect(resting.opacity).toBe('1');

  if (testInfo.project.name === 'desktop-chromium') {
    const brand = await page.getByRole('link', { name: 'Open Console', exact: true })
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    await link.scrollIntoViewIfNeeded();
    await link.hover();
    await expect(link).toHaveCSS('color', resting.color);
    await expect(link).toHaveCSS('opacity', '1');
    await expect(link).toHaveCSS('text-decoration-color', brand);
  }
});

test('keyboard hints use restrained semantic keycap colors in both themes', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/docs/query-data/query-editor');

  async function verifyKeycapColors() {
    const keycap = page.locator('kbd').first();
    await expect(keycap).toHaveText('Cmd/Ctrl');

    const colors = await page.evaluate(() => {
      const probe = document.createElement('span');
      document.body.append(probe);
      const resolve = (value: string) => {
        probe.style.color = value;
        return getComputedStyle(probe).color;
      };
      // Keycaps share the inline-code chip treatment (doc-prose kbd rule).
      const resolved = {
        background: resolve('var(--card)'),
        border: resolve('var(--color-fd-border)'),
        foreground: resolve('var(--text-primary)'),
      };
      probe.remove();
      return resolved;
    });
    const styles = await keycap.evaluate((element) => {
      const computed = getComputedStyle(element);
      const shadowColors = computed.boxShadow.match(/rgba?\([^)]+\)/g) ?? [];
      return {
        background: computed.backgroundColor,
        border: computed.borderTopColor,
        foreground: computed.color,
        hasVisibleShadow: shadowColors.some((color) => !color.endsWith(', 0)')),
      };
    });

    expect(styles).toEqual({
      background: colors.background,
      border: colors.border,
      foreground: colors.foreground,
      hasVisibleShadow: false,
    });
  }

  await verifyKeycapColors();
  await page.getByRole('button', { name: 'Toggle color theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await verifyKeycapColors();
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

test('article layout centers its real content group without synthetic rail space', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/docs/getting-started');
    const article = (await page.locator('.doc-article').boundingBox())!;
    expect(Math.abs(article.x + article.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
  }
});

test('pages without a table of contents center in the available main area', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/docs');

    const main = (await page.locator('.docs-main').boundingBox())!;
    const hero = (await page.locator('.landing-hero').boundingBox())!;
    expect(Math.abs(hero.x + hero.width / 2 - (main.x + main.width / 2))).toBeLessThanOrEqual(1);
    await expect(page.getByRole('complementary', { name: 'On this page' })).toHaveCount(0);
  }

  for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/docs/apps/introduction');
    const main = (await page.locator('.docs-main').boundingBox())!;
    const article = (await page.locator('.doc-article').boundingBox())!;
    const articleContent = page.locator('.article-content');
    await expect(articleContent).not.toHaveAttribute('data-has-toc');
    await expect(page.getByRole('complementary', { name: 'On this page' })).toHaveCount(0);
    expect(
      Math.abs(
        article.x + article.width / 2 -
          (main.x + main.width / 2),
      ),
    ).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
  }
});

test('table-only query overview uses the full article width without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/apl/tabular-operators/overview');

  const article = page.locator('.doc-article');
  const articleContent = page.locator('.article-content');
  const tableScroller = article.locator('.doc-prose > div.relative.overflow-auto:has(> table)');
  const [mainBox, articleBox, tableScrollerBox] = await Promise.all([
    page.locator('.docs-main').boundingBox(),
    article.boundingBox(),
    tableScroller.boundingBox(),
  ]);

  await expect(articleContent).not.toHaveAttribute('data-has-toc');
  await expect(page.getByRole('complementary', { name: 'On this page' })).toHaveCount(0);
  expect(mainBox).not.toBeNull();
  expect(articleBox).not.toBeNull();
  expect(tableScrollerBox).not.toBeNull();
  expect(articleBox!.width).toBe(768);
  expect(
    Math.abs(
      articleBox!.x + articleBox!.width / 2 -
        (mainBox!.x + mainBox!.width / 2),
    ),
  ).toBeLessThanOrEqual(1);
  expect(Math.abs(tableScrollerBox!.width - articleBox!.width)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);

  await page.setViewportSize({ width: 390, height: 844 });
  const [mobileArticleBox, mobileTableScrollerBox] = await Promise.all([
    article.boundingBox(),
    tableScroller.boundingBox(),
  ]);
  expect(mobileArticleBox).not.toBeNull();
  expect(mobileTableScrollerBox).not.toBeNull();
  expect(mobileArticleBox!.width).toBe(350);
  expect(Math.abs(mobileArticleBox!.x + mobileArticleBox!.width / 2 - 195)).toBeLessThanOrEqual(1);
  expect(Math.abs(mobileTableScrollerBox!.width - mobileArticleBox!.width)).toBeLessThanOrEqual(1);
  expect(mobileTableScrollerBox!.x).toBeGreaterThanOrEqual(0);
  expect(mobileTableScrollerBox!.x + mobileTableScrollerBox!.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test('table of contents uses a right-edge rail while the article stays viewport-centered', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/reference/semantic-conventions');

  const toc = page.getByRole('complementary', { name: 'On this page' });
  const mainBox = (await page.locator('.docs-main').boundingBox())!;
  const contentBox = (await page.locator('.article-content').boundingBox())!;
  const articleBox = (await page.locator('.doc-article').boundingBox())!;
  const tocBox = (await toc.boundingBox())!;
  const breadcrumbsBox = (await page.locator('.doc-breadcrumbs').boundingBox())!;

  await expect(toc).toBeVisible();
  await expect(toc).toHaveCSS('width', '288px');
  expect(Math.abs(tocBox.y - breadcrumbsBox.y)).toBeLessThanOrEqual(1);
  expect(contentBox.x).toBe(mainBox.x);
  expect(contentBox.width).toBe(mainBox.width);
  expect(tocBox.x + tocBox.width).toBe(1440);
  expect(Math.abs(articleBox.x + articleBox.width / 2 - 720)).toBeLessThanOrEqual(1);
  expect(articleBox.x - mainBox.x).toBeGreaterThan(
    tocBox.x - (articleBox.x + articleBox.width),
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
});

test('terms of service uses semantic sections and the standard article layout', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/legal/terms-of-service');

  const sectionTitles = [
    '1 SCOPE OF SERVICE AND RESTRICTIONS',
    '2 FEES, TAXES, AND AUTHORIZED RESELLERS',
    '3 TERM AND TERMINATION',
    '4 CONFIDENTIALITY',
    '5 INDEMNIFICATION',
    '6 WARRANTY',
    '7 LIMITATIONS OF LIABILITY',
    '8 MISCELLANEOUS',
  ];
  const sections = page.locator('.doc-prose > h2');
  await expect(sections).toHaveCount(sectionTitles.length);
  await expect(sections).toHaveText(sectionTitles);

  const articleContent = page.locator('.article-content');
  const toc = page.getByRole('complementary', { name: 'On this page' });
  await expect(articleContent).toHaveAttribute('data-has-toc', 'true');
  await expect(toc).toBeVisible();
  await expect(toc.getByRole('link')).toHaveCount(sectionTitles.length);
  await expect(
    toc.getByRole('link', { name: sectionTitles[0] }),
  ).toHaveAttribute('href', '#1-scope-of-service-and-restrictions');
  await expect(sections.first()).toHaveCSS('font-size', '24px');
  await expect(sections.first()).toHaveCSS('line-height', '31px');
});

test('table of contents tracks the active heading and keeps a transparent surface', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/platform-overview/architecture');

  const toc = page.getByRole('complementary', { name: 'On this page' });
  const queryArchitecture = toc.getByRole('link', { name: 'Query architecture' });
  await expect(toc).toBeVisible();
  await expect(toc).toHaveCSS('position', 'sticky');
  await expect.poll(() => toc.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  const articleBox = (await page.locator('.doc-article').boundingBox())!;
  const tocBox = (await toc.boundingBox())!;
  expect(tocBox.x).toBeGreaterThanOrEqual(articleBox.x + articleBox.width);

  await queryArchitecture.click();
  await expect(queryArchitecture).toHaveAttribute('aria-current', 'location');
  const queryArchitectureHeading = page.getByRole('heading', { name: 'Query architecture', level: 2 });
  await expect(queryArchitectureHeading).toBeInViewport();
  const headingBox = (await queryArchitectureHeading.boundingBox())!;
  const scrollViewportBox = (await page.locator('.docs-scroll-viewport').boundingBox())!;
  expect(Math.abs(headingBox.y - scrollViewportBox.y - 32)).toBeLessThanOrEqual(1);

  const consoleExpander = page.locator('.nav-nested summary').filter({ hasText: 'Console' });
  await expect(consoleExpander.locator('span')).toHaveText('Console');
  const label = await consoleExpander.locator('span').boundingBox();
  const chevron = await consoleExpander.locator('.sidebar-chevron').boundingBox();
  expect(label).not.toBeNull();
  expect(chevron).not.toBeNull();
  expect(chevron!.x).toBeGreaterThan(label!.x + label!.width);

  await page.goto('/docs/reference/performance');
  const codedTocLink = page.locator('.floating-toc a').filter({ has: page.locator('code') }).first();
  const tocCode = codedTocLink.locator('code').first();
  await expect(tocCode).toHaveCSS('color', await codedTocLink.evaluate((element) => getComputedStyle(element).color));
  await expect(tocCode).toHaveCSS('font-size', await codedTocLink.evaluate((element) => getComputedStyle(element).fontSize));
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/docs/favicon.ico');
});

test('table of contents trace turns crisply with heading depth and the cursor follows it', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/reference/optimize-usage');

  const toc = page.getByRole('complementary', { name: 'On this page' });
  const h2Link = toc.getByRole('link', { name: 'Optimize queries', exact: true });
  const h3Link = toc.getByRole('link', { name: 'What GB-hours are', exact: true });
  const h4Link = toc.getByRole('link', {
    name: 'Optimize the order of field-specific filters',
    exact: true,
  });
  const cursor = toc.locator('[data-slot="toc-cursor"]');
  const tracePath = toc.locator('[data-slot="toc-trace-path"]');

  await expect(toc).toBeVisible();
  await expect(tracePath).toBeVisible();
  await expect(cursor).toBeVisible();
  const cursorBox = (await cursor.boundingBox())!;
  expect({ width: cursorBox.width, height: cursorBox.height }).toEqual({
    width: 3,
    height: 8,
  });
  await expect(cursor).toHaveCSS('border-radius', '0px');

  const paddings = await Promise.all(
    [h2Link, h3Link, h4Link].map((link) => (
      link.evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingLeft))
    )),
  );
  expect(paddings[1] - paddings[0]).toBe(7);
  expect(paddings[2] - paddings[1]).toBe(7);
  expect(
    await tracePath.evaluate((element) => (element as SVGGraphicsElement).getBBox().width),
  ).toBe(14);

  const settleOnLink = async (link: typeof h2Link) => {
    await link.click();
    await expect(link).toHaveAttribute('aria-current', 'location');
    await expect.poll(async () => {
      const [cursorBox, linkBox] = await Promise.all([
        cursor.boundingBox(),
        link.boundingBox(),
      ]);
      return Math.abs(
        cursorBox!.y + cursorBox!.height / 2
        - (linkBox!.y + linkBox!.height / 2),
      );
    }).toBeLessThanOrEqual(1);
    const box = (await cursor.boundingBox())!;
    return box.x + box.width / 2;
  };

  const h2CursorX = await settleOnLink(h2Link);
  const h3CursorX = await settleOnLink(h3Link);
  const h4CursorX = await settleOnLink(h4Link);
  expect(h3CursorX - h2CursorX).toBeCloseTo(7, 1);
  expect(h4CursorX - h3CursorX).toBeCloseTo(7, 1);

  // A fast sequence should remain interruptible and settle on the last target.
  await h2Link.click();
  await h4Link.click();
  await h3Link.click();
  await expect(h3Link).toHaveAttribute('aria-current', 'location');
  await expect.poll(async () => {
    const [cursorBox, linkBox] = await Promise.all([
      cursor.boundingBox(),
      h3Link.boundingBox(),
    ]);
    return Math.abs(
      cursorBox!.y + cursorBox!.height / 2
      - (linkBox!.y + linkBox!.height / 2),
    );
  }).toBeLessThanOrEqual(1);
});

test('table of contents trace jumps directly when reduced motion is requested', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/docs/platform-overview/architecture');

  const toc = page.getByRole('complementary', { name: 'On this page' });
  const nestedLink = toc.getByRole('link', { name: 'EventDB storage', exact: true });

  const motionFrames = await nestedLink.evaluate(async (element) => {
    const cursorElement = element
      .closest('aside')!
      .querySelector<HTMLElement>('[data-slot="toc-cursor"]')!;
    const readFrame = () => {
      const cursorBox = cursorElement.getBoundingClientRect();
      const linkBox = element.getBoundingClientRect();
      return {
        transform: getComputedStyle(cursorElement).transform,
        centerDelta: Math.abs(
          cursorBox.top + cursorBox.height / 2
          - (linkBox.top + linkBox.height / 2),
        ),
      };
    };

    const before = getComputedStyle(cursorElement).transform;
    element.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      button: 0,
      cancelable: true,
    }));
    const frames = [];
    for (let frame = 0; frame < 8; frame += 1) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      frames.push(readFrame());
    }
    return { before, frames };
  });
  await expect(nestedLink).toHaveAttribute('aria-current', 'location');
  const transforms = motionFrames.frames.map((frame) => frame.transform);
  const settledTransform = transforms.at(-1)!;
  expect(settledTransform).not.toBe(motionFrames.before);
  expect(new Set(transforms).size).toBeLessThanOrEqual(2);
  expect(transforms.slice(-3)).toEqual([
    settledTransform,
    settledTransform,
    settledTransform,
  ]);
  expect(motionFrames.frames.at(-1)!.centerDelta).toBeLessThanOrEqual(1);
});

test('query reference sidebar icons stay on top-level options', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/apl/overview');

  const querySidebar = page.locator('.sidebar');
  const queryLeafHrefs = [
    '/docs/apl/overview',
    '/docs/apl/introduction',
    '/docs/apl/tutorial',
    '/docs/apl/apl-features',
    '/docs/mpl/introduction',
    '/docs/mpl/sample-queries',
    '/docs/mpl/migrate-metrics',
  ];
  for (const href of queryLeafHrefs) {
    await expect(
      querySidebar.locator(`a[href="${href}"] > [data-slot="sidebar-icon"]`),
    ).toHaveCount(1);
  }
  for (const title of ['Functions', 'Operators', 'Reference', 'Migrate']) {
    const row = querySidebar
      .locator('details.nav-nested > summary')
      .filter({ hasText: new RegExp(`^${title}$`) });
    await expect(row.locator(':scope > [data-slot="sidebar-icon"]')).toHaveCount(1);
  }
  await expect(querySidebar.locator('[data-slot="sidebar-icon"]')).toHaveCount(11);
  await expect(
    querySidebar.locator('[data-sidebar-child] [data-slot="sidebar-icon"]'),
  ).toHaveCount(0);
  await expect(
    querySidebar.locator('[data-slot="sidebar-icon"]').first(),
  ).toHaveCSS('width', '14px');
  await expect(
    querySidebar.locator('[data-slot="sidebar-icon"]').first(),
  ).toHaveAttribute('aria-hidden', 'true');
});

test('query reference navigation and MDX components follow the compact interaction model', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/apl/scalar-functions/conditional-function/case');

  // Query-reference titles dropped the mono treatment; they share the sans stack.
  const title = page.getByRole('heading', { name: 'case', exact: true, level: 1 });
  await expect(title).toHaveCSS('font-family', /Geist/);
  const accentColor = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.backgroundColor = 'var(--color-accent)';
    document.body.append(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  });

  const languageComparisons = page.locator('.language-comparisons');
  await expect(languageComparisons).toHaveCSS('border-radius', '4px');
  const splunkComparison = languageComparisons.getByRole('button', { name: 'Splunk SPL users' });
  const sqlComparison = languageComparisons.getByRole('button', { name: 'ANSI SQL users' });
  await expect(splunkComparison).toHaveCSS('min-height', '34px');
  await expect(splunkComparison).toHaveCSS('font-weight', '450');
  expect((await languageComparisons.boundingBox())!.width).toBe((await page.locator('.doc-article .prose').boundingBox())!.width);
  await expect(page.locator('.doc-article .prose > h2').last()).toContainText('Other query languages');
  await splunkComparison.click();
  const comparisonPanel = languageComparisons.getByRole('region', { name: 'Splunk SPL users' });
  await expect(comparisonPanel).toContainText(/alternating condition-value pairs/);
  await expect(splunkComparison).toHaveCSS('font-weight', '500');
  await expect(comparisonPanel).toHaveCSS('font-size', '14px');
  await expect(comparisonPanel).toHaveCSS('line-height', '22px');
  await expect(comparisonPanel).toHaveCSS('padding', '12px');
  const comparisonSurfaces = await languageComparisons.evaluate((element) => {
    const options = element.querySelector('.language-comparison-options')!;
    const panel = element.querySelector('[role="region"]')!;
    const active = element.querySelector('button[aria-expanded="true"]')!;
    return {
      bar: getComputedStyle(options).backgroundColor,
      panel: getComputedStyle(panel).backgroundColor,
      accent: getComputedStyle(active, '::after').backgroundColor,
    };
  });
  expect(comparisonSurfaces.panel).not.toBe(comparisonSurfaces.bar);
  expect(comparisonSurfaces.accent).toBe(accentColor);
  await sqlComparison.click();
  await expect(splunkComparison).toHaveAttribute('aria-expanded', 'false');
  await expect(sqlComparison).toHaveAttribute('aria-expanded', 'true');
  await expect(languageComparisons.getByRole('region', { name: 'ANSI SQL users' })).toBeVisible();

  const tabs = page.locator('.docs-tabs > div');
  await expect(tabs).toHaveCSS('border-radius', '6.08px');
  await expect(tabs.getByRole('tablist')).toHaveCSS('height', '38px');
  await expect(tabs.locator('.docs-code-block').first()).toHaveCSS('border-radius', '6.08px');
  const selectedPanel = tabs.getByRole('tabpanel');
  await expect(selectedPanel).toHaveCSS('font-size', '14px');
  await expect(selectedPanel).toHaveCSS('line-height', '22px');
  await expect(selectedPanel).toHaveCSS('padding', '12px');
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
  expect(tabSurfaces.accent).toBe(accentColor);

  const playground = tabs.getByRole('link', { name: /Run in Playground/ }).first();
  await expect(playground).toHaveAttribute('target', '_blank');
  const queryBlock = tabs.locator('.docs-code-block').first();
  const copyButton = queryBlock.getByRole('button', { name: 'Copy code' });
  await expect(copyButton).toBeVisible();
  const playgroundBox = (await playground.boundingBox())!;
  const queryBox = (await queryBlock.boundingBox())!;
  const copyBox = (await copyButton.boundingBox())!;
  expect(playgroundBox.y).toBeGreaterThanOrEqual(queryBox.y);
  expect(playgroundBox.y + playgroundBox.height).toBeLessThan(queryBox.y + queryBox.height);
  // The pill sits in the header, left of the copy button, on the same band.
  expect(playgroundBox.x + playgroundBox.width).toBeLessThan(copyBox.x);
  expect(Math.abs(copyBox.y + copyBox.height / 2 - (playgroundBox.y + playgroundBox.height / 2)))
    .toBeLessThanOrEqual(6);

  const outputTable = tabs.getByRole('table').first();
  await expect(outputTable.locator('xpath=..')).toHaveCSS('border-radius', '6.08px');
  await expect(outputTable.getByRole('columnheader').first()).toHaveCSS('padding', '8px 10px');
  await expect(outputTable.getByRole('cell').first()).toHaveCSS('font-size', '13px');
  await expect(outputTable.getByRole('cell').first()).toHaveCSS('line-height', '22px');

  const relatedFunction = page.getByRole('link', { name: 'iff', exact: true }).last();
  await expect(relatedFunction).toHaveAttribute('href', '/docs/apl/scalar-functions/conditional-function/iff');
  await page.locator('.sidebar').getByRole('link', { name: 'iff', exact: true }).click();
  await expect(page).toHaveURL(/\/conditional-function\/iff$/);
  await expect(page.locator('.nav-nested[open] > summary span')).toHaveText(['Functions', 'Scalar functions', 'Conditional functions']);
});

test('compact query examples stay contained on phone-width layouts', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/docs/apl/tabular-operators/distinct-operator');

  const article = page.locator('.doc-article .prose');
  const tabs = page.locator('.docs-tabs').first();
  const tablist = tabs.getByRole('tablist');
  const tabsBox = (await tabs.boundingBox())!;
  const articleBox = (await article.boundingBox())!;
  expect(tabsBox.x).toBeGreaterThanOrEqual(articleBox.x - 1);
  expect(tabsBox.x + tabsBox.width).toBeLessThanOrEqual(articleBox.x + articleBox.width + 1);
  await expect(tablist).toHaveCSS('overflow-x', 'auto');
  await expect(tablist.getByRole('tab')).toHaveCount(3);

  const logTab = tablist.getByRole('tab', { name: 'Log analysis' });
  const tracesTab = tablist.getByRole('tab', { name: 'OpenTelemetry traces' });
  await expect(logTab).toHaveCSS('min-height', '44px');
  await logTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(tracesTab).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.getByRole('tabpanel')).toContainText('unique services involved in traces');

  await logTab.click();
  const queryFigure = tabs.locator('.docs-code-block').first();
  const playground = tabs.getByRole('link', { name: /Run in Playground/ }).first();
  const queryBox = (await queryFigure.boundingBox())!;
  const playgroundBox = (await playground.boundingBox())!;
  expect(playgroundBox.x + playgroundBox.width).toBeLessThanOrEqual(queryBox.x + queryBox.width);

  const comparisons = page.locator('.language-comparisons');
  const comparisonButtons = comparisons.getByRole('button');
  await expect(comparisonButtons).toHaveCount(2);
  await expect(comparisonButtons.first()).toHaveCSS('min-height', '44px');
  const firstButtonBox = (await comparisonButtons.first().boundingBox())!;
  const secondButtonBox = (await comparisonButtons.last().boundingBox())!;
  expect(Math.abs(firstButtonBox.width - secondButtonBox.width)).toBeLessThanOrEqual(1);

  await comparisons.getByRole('button', { name: 'ANSI SQL users' }).click();
  const comparisonPanel = comparisons.getByRole('region', { name: 'ANSI SQL users' });
  await expect(comparisonPanel).toHaveCSS('font-size', '14px');
  expect((await comparisonPanel.boundingBox())!.width).toBeLessThanOrEqual((await comparisons.boundingBox())!.width);
});

test('nested sidebar connectors distinguish the active and hovered rows', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/reference/datasets');

  const fundamentals = page.locator('details.nav-nested').filter({
    has: page.locator(':scope > summary').filter({ hasText: 'Fundamentals' }),
  }).first();
  await expect(fundamentals).toHaveAttribute('open', '');

  const activeConnector = fundamentals.locator('[data-slot="sidebar-active-connector"]').first();
  await expect(activeConnector).toBeVisible();
  const activePath = await activeConnector.getAttribute('d');

  await fundamentals.getByRole('link', { name: 'Limits', exact: true }).hover();
  // Hover paths are pre-rendered per child and revealed by CSS, so assert
  // on the visible one rather than on DOM presence.
  const hoverConnector = fundamentals.locator('[data-slot="sidebar-hover-connector"]:visible').first();
  await expect(hoverConnector).toHaveAttribute('stroke-dasharray', '4 4');
  const connectorStyles = await Promise.all(
    [activeConnector, hoverConnector].map((connector) =>
      connector.evaluate((element) => {
        const styles = getComputedStyle(element);
        return {
          opacity: styles.opacity,
          stroke: styles.stroke,
          strokeOpacity: styles.strokeOpacity,
        };
      }),
    ),
  );
  expect(connectorStyles[0]).toEqual(connectorStyles[1]);
  expect(connectorStyles[0]?.opacity).toBe('1');
  expect(connectorStyles[0]?.strokeOpacity).toBe('1');
  expect(connectorStyles[0]?.stroke).not.toMatch(/rgba|\/\s*0\./);
  const limitsHoverPath = await hoverConnector.getAttribute('d');
  expect(limitsHoverPath).not.toBe(activePath);

  await fundamentals.getByRole('link', { name: 'Edge deployments', exact: true }).hover();
  await expect(hoverConnector).not.toHaveAttribute('d', limitsHoverPath!);

  await fundamentals.getByRole('link', { name: 'Datasets', exact: true }).hover();
  await expect(fundamentals.locator('[data-slot="sidebar-hover-connector"]:visible')).toHaveCount(0);
  await expect(activeConnector).toHaveAttribute('d', activePath!);

  await page.goto('/docs/reference/limits');
  const fundamentalsWithLaterSelection = page.locator('details.nav-nested').filter({
    has: page.locator(':scope > summary').filter({ hasText: 'Fundamentals' }),
  }).first();
  await expect(
    fundamentalsWithLaterSelection.getByRole('link', { name: 'Limits', exact: true }),
  ).toHaveClass(/active/);
  await fundamentalsWithLaterSelection
    .getByRole('link', { name: 'Edge deployments', exact: true })
    .hover();
  await expect(
    fundamentalsWithLaterSelection.locator('[data-slot="sidebar-hover-connector"]:visible'),
  ).toHaveAttribute('d', /^M15\.5 0V/);
});

test('nested sidebar connector remains continuous through active parent rows', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/console/intelligence/skills/build-dashboards');

  const aiAgents = page.locator('details.nav-nested').filter({
    has: page.locator(':scope > summary').filter({ hasText: 'AI agents' }),
  }).first();
  const skills = aiAgents.locator('details.nav-nested').filter({
    has: page.locator(':scope > summary').filter({ hasText: 'Skills' }),
  }).first();
  await expect(aiAgents).toHaveAttribute('open', '');
  await expect(skills).toHaveAttribute('open', '');
  const rootSummary = aiAgents.locator(':scope > summary');
  const intermediateSummary = skills.locator(':scope > summary');
  const activeLeaf = skills.getByRole('link', { name: 'Build dashboards', exact: true });
  const parentBackground = await rootSummary.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  expect(parentBackground).not.toBe('rgba(0, 0, 0, 0)');
  await expect(intermediateSummary).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(activeLeaf).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(activeLeaf).not.toHaveCSS('background-color', parentBackground);

  const continuation = aiAgents.locator(
    ':scope > div > [data-slot="sidebar-nested-connector"] > [data-slot="sidebar-active-continuation"]',
  );
  const nestedConnector = skills.locator(
    ':scope > div > [data-slot="sidebar-nested-connector"]',
  );
  await expect(continuation).toHaveCount(1);
  await expect(continuation).toHaveAttribute('d', /^M15\.5 0V/);
  await expect(continuation).not.toHaveAttribute('stroke-dasharray');
  await expect(
    aiAgents.locator(
      ':scope > div > [data-slot="sidebar-nested-connector"] > [data-slot="sidebar-active-connector"]',
    ),
  ).toHaveCount(0);
  const nestedActiveConnector = nestedConnector.locator(
    '[data-slot="sidebar-active-connector"]',
  );
  await expect(nestedActiveConnector).toBeVisible();
  await expect(nestedActiveConnector).toHaveAttribute('d', /H46\.5$/);
  await skills.getByRole('link', { name: 'Axiom alerting', exact: true }).hover();
  await expect(
    skills.locator(':scope > div > [data-sidebar-child] > svg > [data-slot="sidebar-hover-connector"]:visible'),
  ).toHaveAttribute('d', /H46\.5$/);
  await expect(
    nestedConnector.locator('[data-slot="sidebar-active-continuation"]'),
  ).toHaveCount(0);

  const continuationEnd = await continuation.evaluate((element) => {
    const path = element as SVGPathElement;
    const point = path.getPointAtLength(path.getTotalLength());
    return path.ownerSVGElement!.getBoundingClientRect().top + point.y;
  });
  const nestedConnectorStart = await nestedConnector
    .locator('[data-slot="sidebar-active-connector"]')
    .evaluate((element) => {
      const path = element as SVGPathElement;
      const point = path.getPointAtLength(0);
      return path.ownerSVGElement!.getBoundingClientRect().top + point.y;
    });
  expect(Math.abs(continuationEnd - nestedConnectorStart)).toBeLessThanOrEqual(1);
});

test('nested sidebar hover connector remains continuous through intermediate parents', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/console/intelligence/ai-agents-overview');

  const aiAgents = page.locator('details.nav-nested').filter({
    has: page.locator(':scope > summary').filter({ hasText: 'AI agents' }),
  }).first();
  const skills = aiAgents.locator('details.nav-nested').filter({
    has: page.locator(':scope > summary').filter({ hasText: 'Skills' }),
  }).first();
  await skills.locator(':scope > summary').click();
  await skills.getByRole('link', { name: 'Build dashboards', exact: true }).hover();

  // The continuation is a zero-width vertical line, which Playwright's
  // :visible heuristic rejects (empty bounding box), so scope to the child
  // wrapping Skills and assert the CSS reveal on computed display instead.
  const hoverContinuation = aiAgents
    .locator(':scope > div > [data-sidebar-child]')
    .filter({ has: page.locator('details > summary', { hasText: 'Skills' }) })
    .locator(':scope > svg > [data-slot="sidebar-hover-continuation"]');
  const nestedHoverConnector = skills.locator(
    ':scope > div > [data-sidebar-child] > svg > [data-slot="sidebar-hover-connector"]:visible',
  );
  await expect(hoverContinuation).toHaveCSS('display', 'inline');
  await expect(hoverContinuation).toHaveAttribute('d', /^M15\.5 0V/);
  await expect(hoverContinuation).toHaveAttribute('stroke-dasharray', '4 4');
  await expect(
    aiAgents.locator(
      ':scope > div > [data-sidebar-child] > svg > [data-slot="sidebar-hover-connector"]:visible',
    ),
  ).toHaveCount(0);
  await expect(nestedHoverConnector).toHaveAttribute('d', /H46\.5$/);

  const continuationEnd = await hoverContinuation.evaluate((element) => {
    const path = element as SVGPathElement;
    const point = path.getPointAtLength(path.getTotalLength());
    return path.ownerSVGElement!.getBoundingClientRect().top + point.y;
  });
  const nestedConnectorStart = await nestedHoverConnector.evaluate((element) => {
    const path = element as SVGPathElement;
    const point = path.getPointAtLength(0);
    return path.ownerSVGElement!.getBoundingClientRect().top + point.y;
  });
  expect(Math.abs(continuationEnd - nestedConnectorStart)).toBeLessThanOrEqual(1);
});

test('sidebar scrollbar is visible only while scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 720 });
  await page.goto('/docs/platform-overview/architecture');

  const scrollArea = page.locator('.sidebar [data-slot="scroll-area"]');
  const viewport = scrollArea.locator('[data-slot="scroll-area-viewport"]');
  const scrollbar = scrollArea.locator('[data-slot="scroll-area-scrollbar"]');
  const content = page.locator('.sidebar-scroll-content');

  await expect(viewport).toBeVisible();
  await expect(content).toHaveCSS('padding-bottom', '24px');
  await expect(scrollbar).toHaveCSS('opacity', '0');
  await scrollArea.hover();
  await expect(scrollbar).toHaveAttribute('data-hovering', '');
  await expect(scrollbar).toHaveCSS('opacity', '0');

  await viewport.hover();
  await page.mouse.wheel(0, 120);
  await expect(scrollbar).toHaveAttribute('data-scrolling', '');
  await expect(scrollbar).toHaveCSS('opacity', '1');
  await expect(scrollbar).not.toHaveAttribute('data-scrolling', '');
  await expect(scrollbar).toHaveAttribute('data-hovering', '');
  await expect(scrollbar).toHaveCSS('opacity', '0');
});

test('main document uses the shared scrollbar only while scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 720 });
  await page.goto('/docs');

  const scrollArea = page.locator('.docs-main-scroll');
  const viewport = scrollArea.locator('[data-slot="scroll-area-viewport"]');
  const scrollbar = scrollArea.locator('[data-slot="scroll-area-scrollbar"]');
  const main = page.locator('.docs-main');

  await expect(viewport).toBeVisible();
  await expect(main).toHaveCSS('padding-bottom', '56px');
  expect(await viewport.evaluate((element) => element.scrollHeight)).toBeGreaterThan(
    await viewport.evaluate((element) => element.clientHeight),
  );
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(720);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(scrollbar).toHaveCSS('opacity', '0');

  await viewport.focus();
  await page.keyboard.press('PageDown');
  await expect.poll(() => viewport.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await viewport.evaluate((element) => element.scrollTo({ top: 0 }));

  await scrollArea.hover();
  await expect(scrollbar).toHaveAttribute('data-hovering', '');
  await expect(scrollbar).toHaveCSS('opacity', '0');

  await viewport.hover();
  await page.mouse.wheel(0, 160);
  await expect.poll(() => viewport.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(scrollbar).toHaveAttribute('data-scrolling', '');
  await expect(scrollbar).toHaveCSS('opacity', '1');
  await expect(scrollbar).not.toHaveAttribute('data-scrolling', '');
  await expect(scrollbar).toHaveCSS('opacity', '0');

  await viewport.evaluate((element) => element.scrollTo({ top: element.scrollHeight }));
  const viewportBox = (await viewport.boundingBox())!;
  const lastSectionBox = (await page.locator('.community-support').boundingBox())!;
  expect(
    Math.round(
      viewportBox.y + viewportBox.height -
        (lastSectionBox.y + lastSectionBox.height),
    ),
  ).toBe(56);

  await page.locator('.platform-index a[href="/docs/send-data/methods"]').click();
  await expect(page).toHaveURL(/\/docs\/send-data\/methods$/);
  await expect.poll(() => page.locator('.docs-scroll-viewport').evaluate((element) => element.scrollTop)).toBe(0);
  await expect(page.locator('.docs-main')).toHaveCSS('padding-bottom', '56px');
  await expect(page.locator('.article-layout')).toHaveCSS('padding-bottom', '0px');
});

test('Axiom article chrome, callouts, and heading links follow the docs interaction model', async ({ page, context }, testInfo) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/platform-overview/architecture');

  const sidebarHeading = page.locator('.sidebar-group h2').first();
  const breadcrumbs = page.locator('.doc-breadcrumbs');
  const sidebarBox = await sidebarHeading.boundingBox();
  const breadcrumbBox = await breadcrumbs.boundingBox();
  const sidebarShellBox = (await page.locator('.sidebar').boundingBox())!;
  expect(sidebarBox).not.toBeNull();
  expect(breadcrumbBox).not.toBeNull();
  expect(sidebarBox!.y - sidebarShellBox.y).toBe(20);
  expect(breadcrumbBox!.y).toBeGreaterThan(sidebarBox!.y);

  const brand = page.getByRole('link', { name: 'Axiom documentation home' });
  await expect(brand.locator('.brand-mark')).toBeVisible();
  await expect(brand.locator('.brand-logo')).toHaveCount(0);
  const headerBox = (await page.locator('.site-header').boundingBox())!;
  const brandBox = (await brand.boundingBox())!;
  const sectionTabsBox = (await page.getByRole('navigation', { name: 'Documentation sections' }).boundingBox())!;
  expect(headerBox.x).toBe(0);
  expect(headerBox.width).toBe(1440);
  expect(sectionTabsBox.x - (brandBox.x + brandBox.width)).toBeGreaterThanOrEqual(29);
  expect(sectionTabsBox.x - (brandBox.x + brandBox.width)).toBeLessThanOrEqual(31);
  expect(sidebarShellBox.y).toBe(headerBox.y + headerBox.height);
  expect(sidebarShellBox.width).toBe(272);
  const fundamentalsSummary = page.locator('.nav-nested > summary').filter({ hasText: 'Fundamentals' });
  const activeSidebarRow = page.locator('.sidebar-link.active');
  await expect(fundamentalsSummary).toHaveCSS('user-select', 'none');
  await expect(activeSidebarRow).toHaveCSS('user-select', 'none');
  await expect(activeSidebarRow).toHaveCSS('height', '30px');
  await expect(activeSidebarRow).toHaveCSS('font-size', '13px');
  await expect(activeSidebarRow).toHaveCSS('border-radius', '4px');
  await expect(activeSidebarRow.locator('svg')).toHaveCount(1);
  await expect(activeSidebarRow.locator('svg')).toHaveCSS('width', '14px');
  await expect(fundamentalsSummary).toHaveCSS('font-size', '13px');
  const badge = brand.locator('.brand-badge');
  await expect(brand.locator('.brand-mark')).toHaveCSS('width', '22px');
  await expect(brand.locator('.brand-mark')).toHaveCSS('height', '19px');
  await expect(badge).toHaveCSS('font-size', '15px');
  const brandColor = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--brand)';
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  const mediumRadius = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.borderRadius = 'var(--radius-md)';
    document.body.append(probe);
    const radius = getComputedStyle(probe).borderRadius;
    probe.remove();
    return radius;
  });
  await expect(badge).toHaveCSS('border-left-color', brandColor);
  await expect(badge).toHaveCSS('border-radius', '0px');
  await expect(badge).toHaveCSS('font-weight', '500');
  const sectionTabs = page.getByRole('navigation', { name: 'Documentation sections' });
  const activeSectionTab = sectionTabs.getByRole('link', { name: 'Documentation', exact: true });
  await expect(activeSectionTab).toHaveCSS('height', '30px');
  await expect(activeSectionTab).toHaveCSS('border-radius', mediumRadius);
  await expect(activeSectionTab).toHaveCSS('font-size', '13px');
  await expect(activeSectionTab).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  if (testInfo.project.name === 'desktop-chromium') {
    const hoverBackground = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.backgroundColor = 'var(--interactive-hover)';
      document.body.append(probe);
      const color = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return color;
    });
    await activeSectionTab.hover();
    await expect(activeSectionTab).toHaveCSS('background-color', hoverBackground);
  }
  const activeTabLine = await activeSectionTab.evaluate((element) => {
    const styles = getComputedStyle(element, '::after');
    return { color: styles.backgroundColor, height: styles.height };
  });
  expect(activeTabLine).toEqual({ color: brandColor, height: '1px' });
  await expect(sectionTabs.getByRole('link', { name: 'Changelog' })).toHaveCount(0);
  await expect(page.locator('.header-divider')).toHaveCount(2);
  await expect(page.locator('.header-search')).toContainText('What are you looking for?');
  const consoleButton = page.getByRole('link', { name: 'Open Console', exact: true });
  await expect(consoleButton).toBeVisible();
  await expect(consoleButton).toHaveCSS('height', '28px');
  await expect(consoleButton).toHaveCSS('border-radius', mediumRadius);
  await expect(consoleButton).toHaveCSS('font-size', '13px');
  await expect(consoleButton).toHaveCSS('font-weight', '450');
  await expect(consoleButton).toHaveCSS('background-color', brandColor);
  const buttonArrows = consoleButton.locator('.button-arrow > span');
  await expect(buttonArrows).toHaveCount(2);
  if (testInfo.project.name === 'desktop-chromium') {
    const transitionProperties = await buttonArrows.first().evaluate((element) =>
      getComputedStyle(element).transitionProperty.split(',').map((property) => property.trim()),
    );
    expect(transitionProperties).toContain('translate');
    expect(transitionProperties).toContain('opacity');
    await consoleButton.hover();
    await expect(buttonArrows.first()).toHaveCSS('transition-duration', '0.3s');
    await expect(buttonArrows.first()).toHaveCSS('opacity', '0');
    await expect(buttonArrows.last()).toHaveCSS('opacity', '1');
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(buttonArrows.first()).toHaveCSS('transform', 'none');
  await expect(buttonArrows.first()).toHaveCSS('opacity', '1');
  await expect(buttonArrows.last()).toHaveCSS('display', 'none');

  const notice = page.locator('.doc-notice').first();
  const noticeHeading = notice.locator('[data-slot="notice-heading"]');
  const noticeIcon = noticeHeading.locator('svg');
  await expect(notice).toBeVisible();
  await expect(notice).toHaveAttribute('data-notice-type', 'idea');
  await expect(noticeHeading).toContainText('Idea');
  await expect(noticeIcon).toHaveCount(1);
  await expect(noticeIcon).toHaveAttribute('aria-hidden', 'true');
  await expect(noticeIcon).toHaveCSS('width', '16px');
  const noticeStyles = await notice.evaluate((element) => {
    const styles = getComputedStyle(element);
    const heading = element.querySelector('[data-slot="notice-heading"]')!;
    const icon = heading.querySelector('svg')!;
    const label = heading.querySelector('strong')!;
    return {
      background: styles.backgroundColor,
      canvas: getComputedStyle(document.body).backgroundColor,
      borderLeft: styles.borderLeftWidth,
      borderLeftColor: styles.borderLeftColor,
      headingColor: getComputedStyle(heading).color,
      iconColor: getComputedStyle(icon).color,
      labelColor: getComputedStyle(label).color,
      font: styles.fontFamily,
      bodyFont: getComputedStyle(document.body).fontFamily,
      shadow: styles.boxShadow,
    };
  });
  // Light-theme notices are tinted with their accent at 5% (notice.tsx);
  // the icon, label, and left rule carry the rest of the differentiation.
  // Dark mode keeps the shared card surface instead.
  const expectedBackground = await notice.evaluate((element) => {
    const probe = document.createElement('span');
    probe.style.backgroundColor = 'color-mix(in oklab, var(--notice-accent) 5%, transparent)';
    element.append(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  });
  expect(noticeStyles.background).toBe(expectedBackground);
  expect(noticeStyles.borderLeft).toBe('2px');
  expect(noticeStyles.headingColor).toBe(noticeStyles.borderLeftColor);
  expect(noticeStyles.iconColor).toBe(noticeStyles.borderLeftColor);
  expect(noticeStyles.labelColor).toBe(noticeStyles.borderLeftColor);
  // Notices share the body sans face.
  expect(noticeStyles.font).toBe(noticeStyles.bodyFont);
  expect(noticeStyles.shadow).toBe('none');

  const heading = page.getByRole('heading', { name: 'Ingestion architecture', level: 2 });
  const headingLink = heading.getByRole('link', { name: 'Ingestion architecture' });
  await heading.hover();
  await expect(heading.locator('.anchor-hash')).toHaveCSS('opacity', '1');
  await headingLink.click();
  await expect(page).toHaveURL(/#ingestion-architecture$/);
  await expect(heading).toBeInViewport();
  expect((await heading.boundingBox())!.y).toBeGreaterThanOrEqual(56);
  // Copy feedback at desktop widths is an inline checkmark swapped in for the
  // chain icon for a short period plus a screen-reader announcement; the
  // toast only appears below sm, where the gutter marker is hidden.
  await expect(heading.locator('.anchor-hash svg.lucide-check')).toBeVisible();
  await expect(page.locator('#heading-anchor-live-region')).toHaveText('Link copied');
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(0);
  await expect(heading.locator('.anchor-hash svg.lucide-link')).toBeVisible({ timeout: 5000 });

  const indicator = page
    .getByRole('complementary', { name: 'On this page' })
    .locator('[data-slot="toc-cursor"]');
  const indicatorBox = (await indicator.boundingBox())!;
  expect({ width: indicatorBox.width, height: indicatorBox.height }).toEqual({
    width: 3,
    height: 8,
  });
  await expect(indicator).toHaveCSS('border-radius', '0px');
});

test('article hierarchy and footer navigation follow the compact docs pattern', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/docs/console/intelligence/mcp-server');

  const parentHeading = page.getByRole('heading', { name: 'Current capabilities', level: 2 });
  const childHeading = page.getByRole('heading', { name: 'Supported MCP tools', level: 3 });
  const parentBox = (await parentHeading.boundingBox())!;
  const childBox = (await childHeading.boundingBox())!;
  expect(childBox.y - (parentBox.y + parentBox.height)).toBeLessThanOrEqual(20);

  const pagination = page.getByRole('navigation', { name: 'Adjacent documentation pages' });
  await expect(pagination.getByRole('link', { name: /Previous AI agents/ })).toHaveAttribute('href', '/docs/console/intelligence/ai-agents-overview');
  await expect(pagination.getByRole('link', { name: /Next Set query cost limits for AI agents/ })).toHaveAttribute('href', '/docs/console/intelligence/query-cost-limits');

  const helpful = page.getByRole('button', { name: 'Yes, this page was helpful' });
  const unhelpful = page.getByRole('button', { name: 'No, this page was not helpful' });
  const resolveBackground = (variable: string) => page.evaluate((cssVariable) => {
    const probe = document.createElement('span');
    probe.style.backgroundColor = `var(${cssVariable})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  }, variable);
  await expect(helpful).toHaveCSS(
    'background-color',
    await resolveBackground('--interactive-selected'),
  );
  await expect(unhelpful).toHaveCSS(
    'background-color',
    await resolveBackground('--interactive-selected'),
  );
  await helpful.click();
  await expect(helpful).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status')).toHaveText('Thanks for the feedback.');
  const resolveColor = (variable: string) => page.evaluate((cssVariable) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${cssVariable})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, variable);
  await expect(helpful).toHaveCSS('color', await resolveColor('--brand'));

  await page.getByRole('button', { name: 'Toggle color theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(helpful).toHaveCSS('color', await resolveColor('--text-primary'));
  await expect(unhelpful).toHaveCSS(
    'background-color',
    await resolveBackground('--interactive-selected'),
  );
  await expect(page.getByRole('link', { name: 'Suggest edits on GitHub' })).toBeVisible();
});

test('deep documentation pages cap the breadcrumb at the first two ancestors', async ({ page }, testInfo) => {
  await page.goto('/docs/dashboard-elements/pie-chart');

  const breadcrumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(breadcrumbs).toHaveText(/^\s*Understand data\s*\/\s*Console\s*$/);
  await expect(breadcrumbs.getByText('Pie chart')).toHaveCount(0);
  const breadcrumbLinks = breadcrumbs.getByRole('link');
  await expect(breadcrumbLinks).toHaveCount(2);
  const semanticColors = await page.evaluate(() => {
    const probe = document.createElement('span');
    document.body.append(probe);
    probe.style.color = 'var(--secondary-foreground)';
    const sidebarItem = getComputedStyle(probe).color;
    probe.style.color = 'var(--foreground)';
    const foreground = getComputedStyle(probe).color;
    probe.remove();
    return { foreground, sidebarItem };
  });
  await expect(breadcrumbLinks.first()).toHaveCSS('color', semanticColors.sidebarItem);
  await expect(breadcrumbLinks.first()).toHaveCSS('text-decoration-line', 'none');
  if (testInfo.project.name === 'desktop-chromium') {
    await breadcrumbLinks.first().hover();
    await expect(breadcrumbLinks.first()).toHaveCSS('color', semanticColors.foreground);
    await expect(breadcrumbLinks.first()).toHaveCSS('text-decoration-line', 'none');
  }
});

test('breadcrumbs align with the copy page control', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/dashboard-elements/pie-chart');

  const breadcrumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  const breadcrumbTextBox = await breadcrumbs.locator('.doc-breadcrumb').first().boundingBox();
  const copyPageBox = await page.locator('.copy-page').boundingBox();
  expect(breadcrumbTextBox).not.toBeNull();
  expect(copyPageBox).not.toBeNull();
  expect(Math.abs(breadcrumbTextBox!.y + breadcrumbTextBox!.height / 2 - (copyPageBox!.y + copyPageBox!.height / 2))).toBeLessThanOrEqual(1);
  await expect(breadcrumbs).toHaveCSS('font-weight', '300');
});

test('the copy page menu offers the Markdown surface and assistant links', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/dashboard-elements/pie-chart');

  const menuTrigger = page.getByRole('button', { name: 'More page actions' });
  await menuTrigger.focus();
  await menuTrigger.press('Enter');
  await expect(menuTrigger).toHaveAttribute('aria-expanded', 'true');

  const markdownItem = page.getByRole('menuitem', { name: 'View as Markdown' });
  const askAiItem = page.getByRole('menuitem', { name: 'Ask AI about this page' });
  await expect(markdownItem).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(askAiItem).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menuTrigger).toBeFocused();
  await expect(menuTrigger).toHaveAttribute('aria-expanded', 'false');

  await menuTrigger.click();
  const menu = page.getByRole('menu', { name: 'Page actions' });
  await expect(menu).toHaveClass(/rounded-md/);
  await expect(menu.locator('[data-slot="copy-page-action-icon"]')).toHaveCount(2);
  await expect(menu.locator('.copy-page-brand')).toHaveCount(3);
  await expect(markdownItem).toHaveAttribute('href', '/docs/dashboard-elements/pie-chart.md');
  await expect(page.getByRole('menuitem', { name: 'Open in ChatGPT' })).toHaveAttribute('href', /chatgpt\.com.*axiom\.co%2Fdocs%2Fdashboard-elements%2Fpie-chart\.md/);
  await page.keyboard.press('Escape');
  await expect(menu).not.toBeVisible();

  const copyButton = page.getByRole('button', { name: 'Copy page', exact: true });
  const restingBox = (await copyButton.boundingBox())!;
  const restingIconBox = (await copyButton.locator('[data-slot="copy-page-copy-icon"]').boundingBox())!;
  const restingLabelBox = (await copyButton.locator('[data-slot="copy-page-label"]').boundingBox())!;
  expect(restingLabelBox.height).toBe(16);
  expect(Math.abs(restingIconBox.y + restingIconBox.height / 2 - (restingBox.y + restingBox.height / 2)))
    .toBeLessThanOrEqual(1);
  expect(Math.abs(restingLabelBox.y + restingLabelBox.height / 2 - (restingBox.y + restingBox.height / 2)))
    .toBeLessThanOrEqual(1);
  await copyButton.hover();
  await page.mouse.down();
  const pressedBox = (await copyButton.boundingBox())!;
  expect(pressedBox.y).toBe(restingBox.y);
  await page.mouse.up();

  const copiedButton = page.getByRole('button', { name: 'Copied' });
  await expect(copiedButton).toBeVisible();
  const copiedBox = (await copiedButton.boundingBox())!;
  expect(copiedBox.width).toBe(restingBox.width);
  expect(copiedBox.x).toBe(restingBox.x);
  expect(copiedBox.y).toBe(restingBox.y);
  const copiedIconBox = (await copiedButton.locator('[data-slot="copy-page-copy-icon"]').boundingBox())!;
  const copiedLabelBox = (await copiedButton.locator('[data-slot="copy-page-label"]').boundingBox())!;
  expect(copiedLabelBox).toEqual(restingLabelBox);
  expect(Math.abs(copiedIconBox.y + copiedIconBox.height / 2 - (copiedBox.y + copiedBox.height / 2)))
    .toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('# Pie chart');
});

test('placeholder forms update and copy every matching code example', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/docs/restapi/query');

  const form = page.locator('.placeholder-config').first();
  const codeBlock = form.locator('xpath=preceding-sibling::div[contains(@class,"docs-code-block")][1]');
  await form.locator('select').selectOption('us-east-1.aws.edge.axiom.co');
  await form.getByPlaceholder('xaat-api-token').fill('xaat-example-token');
  await form.getByPlaceholder('dataset-name').fill('example-dataset');

  await expect(codeBlock.locator('pre')).toContainText('https://us-east-1.aws.edge.axiom.co/v1/query/_apl');
  await expect(codeBlock.locator('pre')).toContainText('Authorization: Bearer xaat-example-token');
  await expect(codeBlock.locator('pre')).toContainText('"apl": "example-dataset | limit 10"');
  await expect(codeBlock.locator('pre')).not.toContainText(/AXIOM_DOMAIN|API_TOKEN|DATASET_NAME/);

  await codeBlock.getByRole('button', { name: 'Copy code' }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('https://us-east-1.aws.edge.axiom.co/v1/query/_apl');
  expect(copied).toContain('Authorization: Bearer xaat-example-token');
  expect(copied).toContain('"apl": "example-dataset | limit 10"');
  expect(copied).not.toMatch(/AXIOM_DOMAIN|API_TOKEN|DATASET_NAME/);

  const otherDatasetForms = page.locator('.placeholder-config').filter({ has: page.getByPlaceholder('dataset-name') });
  await expect(otherDatasetForms).toHaveCount(3);
  for (const otherForm of await otherDatasetForms.all()) {
    await expect(otherForm.getByPlaceholder('dataset-name')).toHaveValue('example-dataset');
    await expect(otherForm.locator('xpath=preceding-sibling::div[contains(@class,"docs-code-block")][1]').locator('pre')).toContainText('example-dataset');
  }

  await page.goto('/docs/getting-started');
  const persistedForm = page.locator('.placeholder-config').first();
  await expect(persistedForm.getByPlaceholder('xaat-api-token')).toHaveValue('xaat-example-token');
  await expect(persistedForm.getByPlaceholder('dataset-name')).toHaveValue('example-dataset');
  const persistedCodeBlock = persistedForm.locator('xpath=preceding-sibling::div[contains(@class,"docs-code-block")][1]');
  await expect(persistedCodeBlock.locator('pre')).toContainText('xaat-example-token');
  await expect(persistedCodeBlock.locator('pre')).toContainText('example-dataset');

  await page.goto('/docs/guides/opentelemetry-claude-code');
  const compositeNameBlock = page.locator('.docs-code-block').filter({ hasText: 'AXIOM_METRICS_DATASET' }).first();
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
  const boldLabel = page.getByText('Regional Edge Layer:', { exact: true });

  // The production CSS pipeline may re-emit token colors in lab()/oklch
  // notation, so expected values resolve through the same serializer the
  // computed styles use instead of hardcoded rgb literals. Probes mount
  // inside the prose so scoped tokens like --docs-copy resolve.
  const resolveColor = (value: string) =>
    page.evaluate((input) => {
      const probe = document.createElement('span');
      probe.style.color = input;
      (document.querySelector('.doc-prose') ?? document.body).append(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    }, value);

  // Body copy matches www's secondary foreground in each theme, and stays
  // visibly quieter than headings.
  const verifyHierarchy = async () => {
    const copyColor = await resolveColor('var(--docs-copy)');
    const emphasisColor = await resolveColor('var(--text-primary)');
    expect(copyColor).not.toBe(emphasisColor);
    await expect(bodyCopy).toHaveCSS('color', copyColor);
    await expect(heading).toHaveCSS('color', emphasisColor);
    await expect(boldLabel).toHaveCSS('color', emphasisColor);
  };

  await verifyHierarchy();
  await page.getByRole('button', { name: 'Toggle color theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await verifyHierarchy();
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
  await expect(page.getByLabel('Dataset name')).toHaveValue('production-events');
  expect(errors).toEqual([]);
});

test('MDX accordions are compact, keyboard accessible, and searchable', async ({ page }) => {
  await page.goto('/docs/getting-started');

  const trigger = page.getByRole('button', {
    name: 'Example: Alert on increased error rate',
    exact: true,
  });
  const accordion = page.locator('[data-slot="accordion"]').filter({ has: trigger });
  const panel = accordion.locator('[data-slot="accordion-content"]');
  const inner = panel.locator('[data-slot="accordion-content-inner"]');

  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toHaveAttribute('hidden', 'until-found');
  await expect(panel).toContainText('This example creates a threshold monitor');

  const closedStyles = await accordion.evaluate((root) => {
    const button = root.querySelector<HTMLElement>('[data-slot="accordion-trigger"]')!;
    const content = root.querySelector<HTMLElement>('[data-slot="accordion-content"]')!;
    const contentInner = root.querySelector<HTMLElement>('[data-slot="accordion-content-inner"]')!;
    const rootStyle = getComputedStyle(root);
    const buttonStyle = getComputedStyle(button);
    const contentStyle = getComputedStyle(content);
    const innerStyle = getComputedStyle(contentInner);

    return {
      borderRadius: rootStyle.borderRadius,
      borderWidth: rootStyle.borderTopWidth,
      boxShadow: rootStyle.boxShadow,
      triggerHeight: button.getBoundingClientRect().height,
      triggerFontSize: buttonStyle.fontSize,
      triggerPaddingLeft: buttonStyle.paddingLeft,
      panelHeight: content.getBoundingClientRect().height,
      panelPadding: contentStyle.paddingLeft,
      panelBorder: contentStyle.borderTopWidth,
      innerPaddingLeft: innerStyle.paddingLeft,
    };
  });

  expect(closedStyles).toMatchObject({
    borderRadius: '6.08px',
    borderWidth: '1px',
    triggerFontSize: '13px',
    triggerPaddingLeft: '12px',
    panelHeight: 0,
    panelPadding: '0px',
    panelBorder: '0px',
    innerPaddingLeft: '12px',
  });
  expect(closedStyles.triggerHeight).toBeGreaterThanOrEqual(38);
  // Chromium serializes translucent shadows as rgba(...), fully opaque ones as
  // rgb(...); catch both, allowing only a fully transparent black.
  expect(closedStyles.boxShadow).not.toMatch(/rgba?\((?!0, 0, 0, 0\)|0 0 0 \/ 0\))/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    await page.evaluate(() => document.documentElement.clientWidth),
  );

  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(panel).not.toHaveAttribute('hidden');
  await expect(panel).toBeVisible();
  await expect(inner).toHaveCSS('padding-left', '12px');

  await page.keyboard.press('Space');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toHaveAttribute('hidden', 'until-found');

  await panel.dispatchEvent('beforematch');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(panel).not.toHaveAttribute('hidden');
  await expect(panel).toBeVisible();
});

test('grouped MDX accordions keep only one item open', async ({ page }) => {
  await page.goto('/docs/apps/convex');

  const first = page.getByRole('button', {
    name: 'Track function execution times',
    exact: true,
  });
  const group = page.locator('[data-slot="accordion"]').filter({ has: first });
  const second = group.getByRole('button', {
    name: 'Track function errors',
    exact: true,
  });

  await first.click();
  await expect(first).toHaveAttribute('aria-expanded', 'true');
  await second.click();
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  await expect(second).toHaveAttribute('aria-expanded', 'true');
  await expect(group.locator('[data-slot="accordion-content"]').first()).toHaveAttribute(
    'hidden',
    'until-found',
  );
});

test('fragment navigation reveals content inside a closed MDX accordion', async ({ page }) => {
  await page.goto('/docs/console/intelligence/mcp-server');

  const trigger = page.getByRole('button', { name: 'Local setup', exact: true });
  const panel = page
    .locator('[data-slot="accordion"]')
    .filter({ has: trigger })
    .locator('[data-slot="accordion-content"]');
  await expect(panel).toHaveAttribute('hidden', 'until-found');

  await page.evaluate(() => {
    window.location.hash = 'local-setup';
  });

  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('heading', { name: 'Local setup', level: 2 })).toBeVisible();
});
