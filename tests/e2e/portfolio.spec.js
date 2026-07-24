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
  await expect(page.locator('h1')).toContainText('Models answer.');
  await expect(page.locator('h1')).toContainText('I engineer what happens next.');
  await expect(page.locator('#work .case-study')).toHaveCount(5);
  await expect(page.locator('#contact')).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);

  await page.screenshot({
    path: new URL(`portfolio-${testInfo.project.name}.png`, output).pathname,
    fullPage: true,
  });
});

test('system field explains each engineering layer with keyboard-operable controls', async ({ page }) => {
  await page.goto('./');
  const field = page.locator('[data-system-field]');
  const nodes = field.locator('[data-field-node]');
  const detail = field.locator('[data-field-detail]');

  await expect(field).toBeVisible();
  await expect(nodes).toHaveCount(5);
  await expect(nodes.first()).toHaveAttribute('aria-pressed', 'true');
  const evaluate = field.getByRole('button', { name: /evaluate/i });
  await evaluate.focus();
  await page.keyboard.press('Enter');
  await expect(evaluate).toHaveAttribute('aria-pressed', 'true');
  await expect(detail).toContainText(/quality|latency|failure/i);
});

test('page holds its composition across phone, tablet, and laptop widths', async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 800 },
    { width: 390, height: 844 },
    { width: 667, height: 900 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('./');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-system-field]')).toBeVisible();
    const geometry = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      fieldRight: document.querySelector('[data-system-field]').getBoundingClientRect().right,
    }));
    expect(geometry.overflow, `${viewport.width}px page overflow`).toBeLessThanOrEqual(1);
    expect(geometry.fieldRight, `${viewport.width}px system field clipping`).toBeLessThanOrEqual(viewport.width + 1);
  }
});

test('reduced-motion preference removes reveal movement and leaves content visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');

  const reveal = page.locator('[data-reveal]').first();
  await expect(reveal).toBeVisible();
  const motion = await reveal.evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      opacity: styles.opacity,
      transform: styles.transform,
      transitionDuration: styles.transitionDuration,
    };
  });

  expect(motion.opacity).toBe('1');
  expect(motion.transform).toBe('none');
  expect(parseFloat(motion.transitionDuration)).toBeLessThanOrEqual(0.001);
});

test('critical first viewport stays visible even before reveal observers respond', async ({ page }) => {
  await page.addInitScript(() => {
    window.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });
  await page.goto('./');

  for (const selector of ['.hero-kicker', '.hero-copy', '.system-field']) {
    await expect(page.locator(selector), `${selector} should never depend on an observer callback`).toHaveCSS('opacity', '1');
  }
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

test('desktop first fold pairs the manifesto with concrete engineering proof', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');

  const proofItems = page.locator('.hero-proof-index > div');
  await expect(proofItems).toHaveCount(4);
  await expect(proofItems.first()).toContainText('Context');
  await expect(proofItems.last()).toContainText('Evaluation');

  const fold = await page.evaluate(() => {
    const proof = document.querySelector('.hero-proof-index').getBoundingClientRect();
    const fieldElement = document.querySelector('.system-field');
    const field = fieldElement.getBoundingClientRect();
    return {
      proofTop: proof.top,
      proofBottom: proof.bottom,
      fieldTop: field.top,
      fieldOpacity: getComputedStyle(fieldElement).opacity,
    };
  });

  expect(fold.proofTop).toBeGreaterThanOrEqual(0);
  expect(fold.proofBottom).toBeLessThanOrEqual(900);
  expect(fold.fieldTop).toBeLessThan(900);
  expect(fold.fieldOpacity).toBe('1');
});

test('short laptop fold exposes a named inspectable project', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('./');

  const proof = page.locator('.hero-project-proof');
  await expect(proof).toContainText('Volyx Lens');
  await expect(proof.getByRole('link')).toBeVisible();
  const box = await proof.boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(768);
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

test('mobile navigation remains a full viewport layer after the page has scrolled', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect(page.locator('.site-header')).toHaveClass(/is-scrolled/);

  await page.getByRole('button', { name: 'Open navigation' }).click();

  const layer = await page.evaluate(() => {
    const nav = document.querySelector('.site-nav').getBoundingClientRect();
    const links = [...document.querySelectorAll('.site-nav a')].map((link) => link.getBoundingClientRect());
    return {
      top: nav.top,
      left: nav.left,
      right: nav.right,
      bottom: nav.bottom,
      linksInsideLayer: links.every((link) => (
        link.top >= nav.top && link.left >= nav.left && link.right <= nav.right && link.bottom <= nav.bottom
      )),
    };
  });

  expect(layer.top).toBeCloseTo(0, 0);
  expect(layer.left).toBeCloseTo(0, 0);
  expect(layer.right).toBeCloseTo(390, 0);
  expect(layer.bottom).toBeCloseTo(844, 0);
  expect(layer.linksInsideLayer).toBe(true);
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
  await expect(page.locator('#work .case-study').first()).toHaveCSS('opacity', '1');
  await expect(page.locator('.nav-toggle')).toBeHidden();
  await expect(page.locator('.site-nav')).toBeVisible();
  await expect(page.locator('.site-nav a[href="#work"]')).toBeVisible();
  await context.close();
});

test('reveal content fails open when the JavaScript bundle cannot load', async ({ page }) => {
  await page.route('**/*.js', (route) => route.abort());
  await page.goto('./');
  await expect(page.locator('.hero-copy')).toHaveCSS('opacity', '1');
  await expect(page.locator('#work .case-study').first()).toHaveCSS('opacity', '1');
});

test('mobile project links meet touch-target guidance and page length stays focused', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('./');

  const links = await page.locator('.project-footer a, .lens-artifacts a').all();
  expect(links.length).toBeGreaterThan(0);
  for (const link of links) {
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }

  const metaSize = await page.locator('.project-meta').first().evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  expect(metaSize).toBeGreaterThanOrEqual(12);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(8_000);
});

test('mobile keeps visual proof for flagship projects and compacts supporting work', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');

  const projects = page.locator('#work .case-study');
  await expect(projects.nth(0).locator('.case-canvas')).toBeVisible();
  await expect(projects.nth(1).locator('.case-canvas')).toBeVisible();
  await expect(projects.nth(2).locator('.case-canvas')).toBeHidden();
  await expect(projects.nth(2).locator('.project-signal')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(7_500);

  await page.setViewportSize({ width: 320, height: 800 });
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(7_800);
});

test('Volyx Lens exposes more than a repository landing page', async ({ page }) => {
  await page.goto('./');
  const artifacts = page.locator('.lens-artifacts');
  await expect(artifacts).toContainText(/onboarding|architecture|release/i);
  await expect(artifacts.getByRole('link')).toHaveCount(3);
  const hrefs = await artifacts.getByRole('link').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  expect(hrefs.some((href) => href.includes('/blob/main/docs/'))).toBe(true);
  expect(hrefs.some((href) => href.includes('/actions'))).toBe(true);
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
