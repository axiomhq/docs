/**
 * Playwright screenshot script.
 *
 * Reads .heroshot/config.json and captures every defined screenshot using
 * Playwright's bundled Chromium. Supports selectors, scroll positions, padding,
 * color schemes, deviceScaleFactor, textOverrides, and multiple viewports —
 * matching the heroshot config format.
 *
 * Usage:
 *   node screenshot.mjs              # capture all
 *   node screenshot.mjs dashboard    # capture screenshots whose name matches
 */

import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const [, , pattern] = process.argv;

// ---------------------------------------------------------------------------
// Load config
// ---------------------------------------------------------------------------

let config;
try {
  config = JSON.parse(readFileSync(resolve(__dirname, '.heroshot/config.json'), 'utf8'));
} catch {
  console.error('No .heroshot/config.json found. Run `npx heroshot config` first.');
  process.exit(1);
}

const {
  outputDirectory = 'heroshots',
  outputFormat = 'png',
  jpegQuality = 80,
  browser: browserConfig = {},
  screenshots = [],
} = config;

const outDir = resolve(__dirname, outputDirectory);
mkdirSync(outDir, { recursive: true });

const defaultViewport = browserConfig.viewport ?? { width: 1280, height: 800 };
const deviceScaleFactor = browserConfig.deviceScaleFactor ?? 1;
const configColorScheme = browserConfig.colorScheme; // undefined → both light + dark
const userAgent = browserConfig.userAgent;

const VIEWPORT_PRESETS = {
  desktop: { width: 1280, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function parseViewport(v) {
  if (typeof v === 'object') return v;
  if (VIEWPORT_PRESETS[v]) return VIEWPORT_PRESETS[v];
  const [w, h] = v.split('x').map(Number);
  return { width: w, height: h };
}

function outputPath(name, viewportKey, scheme) {
  const parts = [slugify(name)];
  if (viewportKey) parts.push(viewportKey);
  if (scheme) parts.push(scheme);
  return resolve(outDir, `${parts.join('-')}.${outputFormat}`);
}

async function applyTextOverrides(page, overrides) {
  if (!overrides) return;
  for (const [sel, text] of Object.entries(overrides)) {
    await page.evaluate(
      ({ sel, text }) => {
        document.querySelectorAll(sel).forEach((el) => { el.textContent = text; });
      },
      { sel, text }
    );
  }
}

async function captureShot(page, screenshot, viewportKey, scheme) {
  const { url, selector, scroll, padding, textOverrides } = screenshot;
  const path = outputPath(screenshot.name, viewportKey, scheme);
  const type = outputFormat === 'jpeg' ? 'jpeg' : 'png';
  const quality = outputFormat === 'jpeg' ? jpegQuality : undefined;
  const shotOpts = { path, type, ...(quality !== undefined ? { quality } : {}) };

  await page.goto(url, { waitUntil: 'networkidle' });

  if (scroll) await page.evaluate(({ x, y }) => window.scrollTo(x, y), scroll);
  if (textOverrides) await applyTextOverrides(page, textOverrides);

  if (selector) {
    const el = page.locator(selector).first();
    await el.waitFor({ state: 'visible', timeout: 10000 });

    if (padding) {
      const box = await el.boundingBox();
      await page.screenshot({
        ...shotOpts,
        clip: {
          x: Math.max(0, box.x - (padding.left ?? 0)),
          y: Math.max(0, box.y - (padding.top ?? 0)),
          width: box.width + (padding.left ?? 0) + (padding.right ?? 0),
          height: box.height + (padding.top ?? 0) + (padding.bottom ?? 0),
        },
      });
    } else {
      await el.screenshot(shotOpts);
    }
  } else {
    await page.screenshot({ ...shotOpts, fullPage: true });
  }

  console.log(`  ✓  ${path}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run() {
  const toCapture = pattern
    ? screenshots.filter((s) =>
        s.name.toLowerCase().includes(pattern.toLowerCase()) ||
        (s.id && s.id.includes(pattern))
      )
    : screenshots;

  if (toCapture.length === 0) {
    console.log(pattern ? `No screenshots matched "${pattern}".` : 'No screenshots defined.');
    return;
  }

  const schemes = configColorScheme ? [configColorScheme] : ['light', 'dark'];
  const multiScheme = schemes.length > 1;

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Users/manototh/.playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell',
  });

  for (const scheme of schemes) {
    console.log(`\nColor scheme: ${scheme}`);

    for (const shot of toCapture) {
      const viewports = shot.viewports?.length
        ? shot.viewports.map((v) => ({ key: v, size: parseViewport(v) }))
        : [{ key: null, size: defaultViewport }];
      const multiViewport = viewports.length > 1;

      for (const { key: vpKey, size: vpSize } of viewports) {
        const label = [shot.name, vpKey, multiScheme ? scheme : null].filter(Boolean).join(' › ');
        console.log(`  → ${label}`);

        const context = await browser.newContext({
          viewport: vpSize,
          deviceScaleFactor,
          colorScheme: scheme,
          ...(userAgent ? { userAgent } : {}),
        });
        const page = await context.newPage();

        await captureShot(
          page,
          shot,
          multiViewport ? vpKey : null,
          multiScheme ? scheme : null
        );

        await context.close();
      }
    }
  }

  await browser.close();
  console.log('\nDone.');
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
