/**
 * Puppeteer screenshot script using Zen Browser.
 *
 * Playwright drives Firefox via a custom "juggler" protocol compiled only into
 * its own Firefox build — third-party forks like Zen don't include it.
 * Puppeteer uses Firefox's native CDP remote-debugging protocol instead,
 * which works with any standard Gecko build including Zen.
 *
 * Usage:
 *   npm install puppeteer-core   (already done)
 *   node screenshot.mjs
 *
 * Config is read from .heroshot/config.json (same format heroshot uses).
 */

import puppeteer from 'puppeteer-core';
import { readFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ZEN_EXECUTABLE = '/Applications/Zen.app/Contents/MacOS/zen';

// ---------------------------------------------------------------------------
// Load config
// ---------------------------------------------------------------------------

let config;
try {
  config = JSON.parse(readFileSync(resolve(__dirname, '.heroshot/config.json'), 'utf8'));
} catch {
  console.error('No .heroshot/config.json found. Run `npx heroshot config` first to define screenshots.');
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

const viewport = browserConfig.viewport ?? { width: 1280, height: 800 };
const deviceScaleFactor = browserConfig.deviceScaleFactor ?? 1;
const colorScheme = browserConfig.colorScheme; // undefined = both light + dark
const userAgent = browserConfig.userAgent;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function outputPath(name, variant) {
  const base = slugify(name);
  const suffix = variant ? `-${variant}` : '';
  return resolve(outDir, `${base}${suffix}.${outputFormat}`);
}

async function capture(page, screenshot, variant) {
  const { url, selector, scroll, padding } = screenshot;

  // 'load' is safer than 'networkidle2' for SPAs that do client-side redirects.
  // If the frame detaches mid-navigation (JS redirect), wait for the new frame to settle.
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  } catch (err) {
    if (err.message.includes('detached') || err.message.includes('Frame')) {
      await new Promise((r) => setTimeout(r, 2000));
      await page.waitForNavigation({ waitUntil: 'load', timeout: 15000 }).catch(() => {});
    } else {
      throw err;
    }
  }

  // Extra settle time for SPAs that render asynchronously after load
  await new Promise((r) => setTimeout(r, 1500));

  if (scroll) {
    await page.evaluate(({ x, y }) => window.scrollTo(x, y), scroll);
  }

  const path = outputPath(screenshot.name, variant);
  const type = outputFormat === 'jpeg' ? 'jpeg' : 'png';
  const quality = outputFormat === 'jpeg' ? jpegQuality : undefined;

  if (selector) {
    const el = await page.$(selector);
    if (!el) throw new Error(`Selector not found: ${selector}`);

    if (padding) {
      const box = await el.boundingBox();
      await page.screenshot({
        path,
        type,
        ...(quality !== undefined ? { quality } : {}),
        clip: {
          x: box.x - (padding.left ?? 0),
          y: box.y - (padding.top ?? 0),
          width: box.width + (padding.left ?? 0) + (padding.right ?? 0),
          height: box.height + (padding.top ?? 0) + (padding.bottom ?? 0),
        },
      });
    } else {
      await el.screenshot({ path, type, ...(quality !== undefined ? { quality } : {}) });
    }
  } else {
    await page.screenshot({ path, type, ...(quality !== undefined ? { quality } : {}), fullPage: true });
  }

  console.log(`  ✓ ${path}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run() {
  const schemes = colorScheme ? [colorScheme] : ['light', 'dark'];

  console.log('Launching Zen Browser...');
  // Zen doesn't support headless mode — it exits immediately with any headless flag.
  // Running headed opens a visible Zen window briefly while screenshots are taken.
  // A temp userDataDir avoids Zen's onboarding/session-restore overwriting new tabs.
  const browser = await puppeteer.launch({
    executablePath: ZEN_EXECUTABLE,
    browser: 'firefox',
    headless: false,
    userDataDir: '/tmp/zen-puppeteer-profile',
    defaultViewport: null, // set per-page after navigation to avoid race with Zen startup
    args: ['-no-remote'],
  });

  for (const scheme of schemes) {
    console.log(`\nCapturing ${scheme} mode:`);

    for (const screenshot of screenshots) {
      console.log(`  → ${screenshot.name}`);

      // Reuse the existing page on first iteration; open a new one after that.
      const pages = await browser.pages();
      const page = pages.length > 0 ? pages[0] : await browser.newPage();

      // Navigate first — Zen may replace a blank tab, so set viewport after load.
      await page.goto(screenshot.url, { waitUntil: 'networkidle2' });

      await page.setViewport({
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor,
      });

      if (userAgent) {
        await page.setUserAgent(userAgent);
      }

      // Emulate color scheme via CSS media feature override
      await page.emulateMediaFeatures([
        { name: 'prefers-color-scheme', value: scheme },
      ]);

      await capture(page, screenshot, schemes.length > 1 ? scheme : undefined);
    }
  }

  await browser.close();
  console.log('\nDone.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
