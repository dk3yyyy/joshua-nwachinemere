import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';

const output = new URL('../../artifacts/', import.meta.url);

test.beforeAll(async () => {
  await mkdir(output, { recursive: true });
});

test('renders without console errors or horizontal overflow', async ({ page }, testInfo) => {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('./');
  await expect(page.locator('h1')).toContainText('around the model');
  await expect(page.locator('#work .project')).toHaveCount(5);
  await expect(page.locator('#contact')).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);

  await page.screenshot({
    path: new URL(`portfolio-${testInfo.project.name}.png`, output).pathname,
    fullPage: true,
  });
});

test('desktop hero explanation and primary action stay above the fold on laptop screens', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');

  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
    { width: 1366, height: 800 },
    { width: 1366, height: 801 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('./');

    const explanation = page.locator('.hero-lede');
    const primaryAction = page.locator('.hero-actions .button-primary');
    await expect(page.locator('.hero-copy')).toHaveCSS('opacity', '1');
    await expect(explanation).toBeVisible();
    await expect(primaryAction).toBeVisible();

    const explanationBox = await explanation.boundingBox();
    const primaryActionBox = await primaryAction.boundingBox();
    expect(explanationBox.y).toBeGreaterThanOrEqual(0);
    expect(explanationBox.y + explanationBox.height).toBeLessThanOrEqual(viewport.height);
    expect(primaryActionBox.y).toBeGreaterThanOrEqual(0);
    expect(primaryActionBox.y + primaryActionBox.height).toBeLessThanOrEqual(viewport.height);
  }
});

test('mobile navigation traps keyboard focus and Escape restores the toggle', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('./');
  const toggle = page.locator('.nav-toggle');
  const links = page.locator('.site-nav a');

  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(toggle.locator('.sr-only')).toHaveText('Close navigation');
  await expect(page.locator('.site-nav')).toHaveClass(/is-open/);
  await expect(page.locator('main')).toHaveAttribute('inert', '');
  await expect(links.first()).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(links.last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(links.first()).toBeFocused();

  const openMenuAudit = await new AxeBuilder({ page }).analyze();
  const openMenuBlocking = openMenuAudit.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact));
  expect(openMenuBlocking).toEqual([]);

  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle.locator('.sr-only')).toHaveText('Open navigation');
  await expect(page.locator('main')).not.toHaveAttribute('inert', '');
  await expect(toggle).toBeFocused();
});

test('mobile navigation link activation closes and focuses its destination', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('./');
  const toggle = page.locator('.nav-toggle');

  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.site-nav a').first()).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.site-nav')).not.toHaveClass(/is-open/);
  await expect(page.locator('body')).not.toHaveClass(/nav-open/);
  await expect(page.locator('main')).not.toHaveAttribute('inert', '');
  await expect(page).toHaveURL(/#work$/);
  await expect(page.locator('#work')).toBeFocused();
});

test('desktop navigation keyboard order is unchanged', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile');
  await page.goto('./');

  await page.locator('.brand').focus();
  await page.keyboard.press('Tab');

  await expect(page.locator('.site-nav a').first()).toBeFocused();
  await expect(page.locator('.nav-toggle')).toBeHidden();
  await expect(page.locator('.site-nav')).toBeVisible();
  await expect(page.locator('main')).not.toHaveAttribute('inert', '');
});

test('sticky navigation identifies the active section without layout shift', async ({ page }) => {
  await page.goto('./');
  const activeLinks = page.locator('.site-nav a[aria-current="location"]');
  await expect(activeLinks).toHaveCount(0);

  const headerHeight = await page.locator('.site-header').evaluate((header) => header.getBoundingClientRect().height);
  for (const section of ['work', 'approach', 'about', 'contact']) {
    const link = page.locator(`.site-nav a[href="#${section}"]`);
    await page.locator(`#${section}`).evaluate((element) => element.scrollIntoView({ behavior: 'instant', block: 'start' }));
    await expect(link).toHaveAttribute('aria-current', 'location');
    await expect(activeLinks).toHaveCount(1);
    await expect(link).toHaveCSS('position', 'relative');
    expect(await link.evaluate((element) => getComputedStyle(element, '::after').position)).toBe('absolute');
    const sectionTop = await page.locator(`#${section}`).evaluate((element) => element.getBoundingClientRect().top);
    expect(sectionTop).toBeGreaterThanOrEqual(headerHeight - 1);
  }
});

test('deep links receive the correct initial active state', async ({ page }) => {
  await page.goto('./#about');
  await expect(page.locator('.site-nav a[href="#about"]')).toHaveAttribute('aria-current', 'location');
  await expect(page.locator('.site-nav a[aria-current="location"]')).toHaveCount(1);
});

test('primary content stays visible without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 412, height: 915 },
  });
  const page = await context.newPage();
  await page.goto(test.info().project.use.baseURL);
  await expect(page.locator('.hero-copy')).toHaveCSS('opacity', '1');
  await expect(page.locator('#work .project').first()).toHaveCSS('opacity', '1');
  await expect(page.locator('.nav-toggle')).toBeHidden();
  await expect(page.locator('.site-nav')).toBeVisible();
  await expect(page.locator('.site-nav a[href="#work"]')).toBeVisible();
  await context.close();
});

test('reveal content fails open when the JavaScript bundle cannot load', async ({ page }) => {
  await page.route('**/*.js', (route) => route.abort());
  await page.goto('./');
  await expect(page.locator('.hero-copy')).toHaveCSS('opacity', '1');
  await expect(page.locator('#work .project').first()).toHaveCSS('opacity', '1');
});

test('mobile project links meet touch-target guidance and page length stays focused', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('./');

  const links = await page.locator('.project-footer a').all();
  expect(links.length).toBeGreaterThan(0);
  for (const link of links) {
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    expect(box.height).toBeGreaterThanOrEqual(44);
  }

  const metaSize = await page.locator('.project-meta').first().evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  expect(metaSize).toBeGreaterThanOrEqual(12);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(8_000);
});

test('published CV link resolves to a PDF', async ({ page, request }) => {
  await page.goto('./');
  const href = await page.locator('a', { hasText: 'View CV' }).first().getAttribute('href');
  const response = await request.get(new URL(href, page.url()).toString());
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/pdf');
});

test('all internal section links resolve to existing targets', async ({ page }) => {
  await page.goto('./');
  const hashes = await page.locator('a[href^="#"]').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  for (const hash of new Set(hashes)) {
    expect(await page.locator(hash).count(), `Missing target for ${hash}`).toBe(1);
  }
});

test('has no serious or critical automated accessibility violations', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.hero-copy')).toHaveCSS('opacity', '1');
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact));
  expect(blocking, blocking.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([]);
});
