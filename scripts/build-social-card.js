import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const browser = await chromium.launch({ headless: true });
const cardHost = (process.env.SITE_ORIGIN || 'https://joshua-nwachinemere.pages.dev')
  .trim()
  .replace(/^https?:\/\//, '')
  .replace(/\/+$/, '');
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  const source = pathToFileURL(resolve('design/social-card-v10.html')).href;
  await page.goto(source, { waitUntil: 'networkidle' });
  await page.evaluate((host) => {
    const label = document.querySelector('.card-url') || [...document.querySelectorAll('p')].find((node) => /\.(?:dev|pages\.dev)$/.test(node.textContent.trim()));
    if (label) label.textContent = host;
  }, cardHost);
  await page.evaluate(() => document.fonts.ready);
  const overflow = await page.evaluate(() => [
    document.documentElement.scrollWidth - innerWidth,
    document.documentElement.scrollHeight - innerHeight,
  ]);
  if (overflow.some((value) => value !== 0)) {
    throw new Error(`Social card overflowed its canvas: ${overflow.join(', ')}`);
  }
  await page.screenshot({ path: 'public/og-card-v10.png' });
} finally {
  await browser.close();
}
