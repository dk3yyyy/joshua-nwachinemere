import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  const source = pathToFileURL(resolve('design/social-card-v6.html')).href;
  await page.goto(source, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const overflow = await page.evaluate(() => [
    document.documentElement.scrollWidth - innerWidth,
    document.documentElement.scrollHeight - innerHeight,
  ]);
  if (overflow.some((value) => value !== 0)) {
    throw new Error(`Social card overflowed its canvas: ${overflow.join(', ')}`);
  }
  await page.screenshot({ path: 'public/og-card-v6.png' });
} finally {
  await browser.close();
}
