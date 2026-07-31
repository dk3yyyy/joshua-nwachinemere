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

test('system field explains each engineering layer with keyboard-operable controls', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'The interactive field is intentionally omitted from the phone reading path');
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
    const field = page.locator('[data-system-field]');
    if (viewport.width <= 860) await expect(field).toBeHidden();
    else await expect(field).toBeVisible();
    const geometry = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      fieldRight: document.querySelector('[data-system-field]').getBoundingClientRect().right,
    }));
    expect(geometry.overflow, `${viewport.width}px page overflow`).toBeLessThanOrEqual(1);
    expect(geometry.fieldRight, `${viewport.width}px system field clipping`).toBeLessThanOrEqual(viewport.width + 1);
  }
});

test('responsive boundaries do not create multi-screen page-length cliffs', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  const heights = new Map();
  for (const width of [600, 601, 860, 861]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('./');
    heights.set(width, await page.evaluate(() => document.documentElement.scrollHeight));
  }

  expect(Math.abs(heights.get(601) - heights.get(600))).toBeLessThanOrEqual(1_800);
  expect(Math.abs(heights.get(861) - heights.get(860))).toBeLessThanOrEqual(1_800);
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
  await expect(proofItems.first()).toContainText('Role');
  await expect(proofItems.nth(2)).toContainText('External review');

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

test('mobile keeps the hero and project rhythm compact but readable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');

  const heroSize = await page.locator('h1').evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  expect(heroSize).toBeLessThanOrEqual(54);

  const projectGaps = await page.locator('#work .case-study').evaluateAll((projects) => (
    projects.map((project) => parseFloat(getComputedStyle(project).rowGap))
  ));
  expect(projectGaps).toHaveLength(5);
  for (const gap of projectGaps) expect(gap).toBeGreaterThanOrEqual(20);

  const factColumns = await page.locator('.project-facts').first().evaluate((element) => (
    getComputedStyle(element).gridTemplateColumns.split(' ').length
  ));
  expect(factColumns).toBe(1);
});

test('tablet keeps project facts compact without restoring dense hero visuals', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('./');

  await expect(page.locator('.system-field')).toBeHidden();
  const roleRail = page.locator('.role-rail');
  const roleTrack = page.locator('[data-role-rail-track]');
  await expect(roleRail).toBeVisible();
  await expect(roleRail).toHaveAttribute('tabindex', '0');
  await expect(roleTrack.locator('[data-role-rail-clone]')).toHaveCount(0);
  const roleMetrics = await roleRail.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    overflowX: getComputedStyle(element).overflowX,
  }));
  expect(roleMetrics.scrollWidth).toBeGreaterThan(roleMetrics.clientWidth + 100);
  expect(roleMetrics.overflowX).toBe('auto');
  await roleRail.scrollIntoViewIfNeeded();
  await expect(roleTrack).toHaveCSS('transform', 'none');
  const tabletTarget = await roleTrack.locator(':scope > div').nth(2).evaluate((element) => element.offsetLeft);
  await roleRail.evaluate((element, left) => element.scrollTo({ left, behavior: 'auto' }), tabletTarget);
  await page.waitForTimeout(200);
  const tabletManualPosition = await roleRail.evaluate((element) => element.scrollLeft);
  await page.waitForTimeout(500);
  expect(await roleRail.evaluate((element) => element.scrollLeft)).toBeCloseTo(tabletManualPosition, 0);
  const factColumns = await page.locator('.project-facts').first().evaluate((element) => (
    getComputedStyle(element).gridTemplateColumns.split(' ').length
  ));
  expect(factColumns).toBe(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('mobile capability strip is a stable manual rail with natural backward and forward scrolling', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');

  const rail = page.locator('.role-rail');
  const track = page.locator('[data-role-rail-track]');
  await rail.scrollIntoViewIfNeeded();
  await expect(track.locator('[data-role-rail-clone]')).toHaveCount(0);
  await expect(track).toHaveCSS('transform', 'none');
  const metrics = await rail.evaluate((element) => ({
    overflow: getComputedStyle(element).overflowX,
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(metrics.overflow).toBe('auto');
  expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);

  const itemPositions = await track.locator(':scope > div').evaluateAll((items) => items.map((item) => item.offsetLeft));
  await rail.evaluate((element, left) => element.scrollTo({ left, behavior: 'auto' }), itemPositions[2]);
  await page.waitForTimeout(250);
  const forwardLeft = await rail.evaluate((element) => element.scrollLeft);
  expect(forwardLeft).toBeGreaterThan(itemPositions[1]);

  await rail.evaluate((element, left) => element.scrollTo({ left, behavior: 'auto' }), itemPositions[1]);
  await page.waitForTimeout(250);
  const backwardLeft = await rail.evaluate((element) => element.scrollLeft);
  expect(backwardLeft).toBeLessThan(forwardLeft);
  await page.waitForTimeout(700);
  expect(await rail.evaluate((element) => element.scrollLeft)).toBeCloseTo(backwardLeft, 0);

  await page.setViewportSize({ width: 390, height: 760 });
  await page.waitForTimeout(300);
  expect(await rail.evaluate((element) => element.scrollLeft)).toBeCloseTo(backwardLeft, 0);

  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('mobile contributions are a stable manual carousel with reachable backward and final cards', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');

  const rail = page.locator('[data-contribution-rail]');
  await rail.scrollIntoViewIfNeeded();
  await expect(rail.locator('[data-contribution-clone]')).toHaveCount(0);
  await expect(rail).toHaveCSS('scroll-snap-type', 'x mandatory');
  await expect(rail).not.toHaveClass(/is-auto-scrolling/);

  const scrollLeft = () => rail.evaluate((element) => element.scrollLeft);
  const initialLeft = await scrollLeft();
  await page.waitForTimeout(700);
  expect(await scrollLeft()).toBeCloseTo(initialLeft, 0);

  const cards = rail.locator('.contribution-card');
  const cardPositions = await cards.evaluateAll((items) => items.map((item) => item.offsetLeft - items[0].offsetLeft));
  await rail.evaluate((element, left) => element.scrollTo({ left, behavior: 'auto' }), cardPositions[2]);
  await expect(page.locator('[data-contribution-status]')).toHaveText('Contribution 3 of 4');
  const forwardLeft = await scrollLeft();

  await rail.evaluate((element, left) => element.scrollTo({ left, behavior: 'auto' }), cardPositions[1]);
  await expect(page.locator('[data-contribution-status]')).toHaveText('Contribution 2 of 4');
  const backwardLeft = await scrollLeft();
  expect(backwardLeft).toBeLessThan(forwardLeft);
  await page.waitForTimeout(700);
  expect(await scrollLeft()).toBeCloseTo(backwardLeft, 0);

  await rail.focus();
  await page.keyboard.press('End');
  await expect(page.locator('[data-contribution-status]')).toHaveText('Contribution 4 of 4');
  expect(await scrollLeft()).toBeGreaterThan(cardPositions[2]);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator('[data-contribution-clone]')).toHaveCount(0);
});

test('contribution rail exposes explicit carousel semantics and keyboard-operable progress', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('./');

  const rail = page.locator('[data-contribution-rail]');
  const previous = page.getByRole('button', { name: 'Previous contribution' });
  const next = page.getByRole('button', { name: 'Next contribution' });
  const status = page.locator('[data-contribution-status]');

  await expect(rail).toHaveAttribute('aria-label', 'Merged upstream contributions');
  await expect(rail).toHaveAttribute('aria-roledescription', 'carousel');
  await expect(rail).toHaveAttribute('aria-describedby', 'contribution-status');
  await expect(rail.locator('[role="group"]')).toHaveCount(4);
  for (let index = 0; index < 4; index += 1) {
    await expect(rail.locator('[role="group"]').nth(index)).toHaveAttribute('aria-roledescription', 'slide');
  }
  await expect(rail.locator('[role="group"]').first()).toHaveAttribute('aria-label', 'OpenAI Agents SDK, contribution 1 of 4');
  await expect(rail.locator('[role="group"]').nth(3)).toHaveAttribute('aria-label', 'FastStream, contribution 4 of 4');
  await expect(previous).toHaveAttribute('aria-controls', 'contribution-rail');
  await expect(next).toHaveAttribute('aria-controls', 'contribution-rail');
  await expect(page.locator('[data-contribution-status]')).toHaveAttribute('id', 'contribution-status');
  await expect(page.locator('[data-contribution-status]')).toHaveAttribute('aria-atomic', 'true');
  await expect(previous).toBeVisible();
  await expect(next).toBeVisible();
  await expect(previous).toBeDisabled();
  await expect(status).toHaveText('Contribution 1 of 4');

  await next.focus();
  await page.keyboard.press('Enter');
  await expect(status).toHaveText('Contribution 2 of 4');
  await expect(previous).toBeEnabled();
  expect(await rail.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);

  await rail.focus();
  await page.keyboard.press('Home');
  await expect(status).toHaveText('Contribution 1 of 4');
  await page.keyboard.press('End');
  await expect(status).toHaveText('Contribution 4 of 4');

  for (const button of [previous, next]) {
    const box = await button.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});

test('contribution rail remains content-accessible without JavaScript', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 768, height: 1024 } });
  const page = await context.newPage();
  await page.goto(test.info().project.use.baseURL);
  await expect(page.locator('.contribution-card')).toHaveCount(4);
  await expect(page.locator('.contribution-controls')).toBeHidden();
  await expect(page.getByRole('link', { name: /View merged PR/ })).toHaveCount(4);
  await expect(page.locator('.additional-contribution a')).toHaveCount(4);
  await context.close();
});

test('additional merged contributions are collapsed by default and keyboard-expandable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('./');

  const details = page.locator('.more-contributions');
  const summary = details.locator('summary');
  await expect(details).not.toHaveAttribute('open', '');
  await expect(summary).toContainText('View 4 more merged contributions');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open', '');
  await expect(details.locator('.additional-contribution')).toHaveCount(4);
  await expect(details.locator('a')).toHaveCount(4);
});

test('tablet metadata is readable, touch-safe, and page-height contract is resilient', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport);
    await page.goto('./');
    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      height: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      projectMeta: parseFloat(getComputedStyle(document.querySelector('.project-meta')).fontSize),
      factLabel: parseFloat(getComputedStyle(document.querySelector('.project-facts dt')).fontSize),
      factValue: parseFloat(getComputedStyle(document.querySelector('.project-facts dd')).fontSize),
      contributionMeta: parseFloat(getComputedStyle(document.querySelector('.contribution-meta')).fontSize),
    }));
    expect(metrics.overflow).toBeLessThanOrEqual(1);
    expect(metrics.height / metrics.viewportHeight).toBeLessThan(10);
    expect(metrics.projectMeta).toBeGreaterThanOrEqual(viewport.width === 768 ? 10 : 12);
    expect(metrics.factLabel).toBeGreaterThanOrEqual(9);
    expect(metrics.factValue).toBeGreaterThanOrEqual(10);
    expect(metrics.contributionMeta).toBeGreaterThanOrEqual(9);
  }
});
test('desktop capability strip auto-scrolls while contributions retain their grid', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('./');

  const contributionGrid = page.locator('[data-contribution-rail]');
  await expect(page.locator('.contribution-controls')).toBeHidden();
  await expect(contributionGrid.locator('[data-contribution-clone]')).toHaveCount(0);
  expect(await contributionGrid.evaluate((element) => ({
    columns: getComputedStyle(element).gridTemplateColumns.split(' ').length,
    overflow: element.scrollWidth - element.clientWidth,
  }))).toEqual({ columns: 2, overflow: 0 });

  const rail = page.locator('.role-rail');
  const track = page.locator('[data-role-rail-track]');
  await expect(track.locator('[data-role-rail-clone]')).toHaveCount(4);
  for (const clone of await track.locator('[data-role-rail-clone]').all()) {
    await expect(clone).toHaveAttribute('aria-hidden', 'true');
    await expect(clone).toHaveAttribute('inert', '');
  }

  const trackX = () => track.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);
  const offscreenX = await trackX();
  await page.waitForTimeout(350);
  expect(await trackX()).toBe(offscreenX);

  await rail.scrollIntoViewIfNeeded();
  const initialX = await trackX();
  await expect.poll(trackX, { timeout: 2500 }).toBeLessThan(initialX - 8);

  await rail.hover();
  const hoveredX = await trackX();
  await page.waitForTimeout(350);
  expect(await trackX()).toBeLessThan(hoveredX - 8);

  const motionToggle = page.locator('[data-role-rail-motion]');
  await expect(motionToggle).toBeVisible();
  await expect(motionToggle).toHaveAccessibleName('Pause capability motion');
  await expect(motionToggle).toHaveAttribute('aria-pressed', 'false');
  await motionToggle.click();
  await expect(motionToggle).toHaveAccessibleName('Play capability motion');
  await expect(motionToggle).toHaveAttribute('aria-pressed', 'true');
  const pausedX = await trackX();
  await page.waitForTimeout(350);
  expect(await trackX()).toBeCloseTo(pausedX, 0);
  await motionToggle.click();
  await expect.poll(trackX, { timeout: 2500 }).toBeLessThan(pausedX - 8);

  await page.evaluate(() => {
    const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
    window.__portfolioRafRequests = 0;
    window.requestAnimationFrame = (callback) => {
      window.__portfolioRafRequests += 1;
      return nativeRequestAnimationFrame(callback);
    };
  });
  await page.waitForTimeout(250);
  const visibleRafRequests = await page.evaluate(() => window.__portfolioRafRequests);
  expect(visibleRafRequests).toBeGreaterThan(5);
  await motionToggle.click();
  await page.evaluate(() => { window.__portfolioRafRequests = 0; });
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__portfolioRafRequests)).toBe(0);
  await motionToggle.click();
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.__portfolioRafRequests)).toBeGreaterThan(0);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  });
  await expect.poll(() => rail.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.bottom <= 0 || rect.top >= window.innerHeight;
  })).toBe(true);
  await page.waitForTimeout(100);
  await page.evaluate(() => { window.__portfolioRafRequests = 0; });
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__portfolioRafRequests)).toBe(0);

  await rail.evaluate((element) => element.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await expect.poll(() => rail.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  })).toBe(true);
  await page.evaluate(() => { window.__portfolioRafRequests = 0; });
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__portfolioRafRequests)).toBeGreaterThan(5);

  await page.setViewportSize({ width: 860, height: 1000 });
  await expect(track.locator('[data-role-rail-clone]')).toHaveCount(0);
  await expect(track).toHaveCSS('transform', 'none');
  await expect(motionToggle).toBeHidden();
  await page.setViewportSize({ width: 861, height: 1000 });
  await expect(track.locator('[data-role-rail-clone]')).toHaveCount(4);
  await expect(motionToggle).toBeVisible();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  const reducedTrack = page.locator('[data-role-rail-track]');
  const reducedRail = page.locator('.role-rail');
  await expect(reducedTrack.locator('[data-role-rail-clone]')).toHaveCount(0);
  await expect(reducedTrack).toHaveCSS('transform', 'none');
  await expect(page.locator('[data-role-rail-motion]')).toBeHidden();
  await expect(reducedRail).toHaveCSS('overflow-x', 'auto');
  expect(await reducedRail.evaluate((element) => element.scrollWidth)).toBeGreaterThan(
    await reducedRail.evaluate((element) => element.clientWidth),
  );
  await reducedRail.evaluate((element) => element.scrollTo({ left: element.scrollWidth, behavior: 'auto' }));
  expect(await reducedRail.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
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
  const pageLength = await page.evaluate(() => document.documentElement.scrollHeight / window.innerHeight);
  expect(pageLength).toBeLessThanOrEqual(9.5);
});

test('mobile supporting typography remains comfortably readable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');

  const minimumSizes = {
    '.brand-copy': 12,
    '.section-index': 12,
    '.project-facts dt': 10,
    '.project-facts dd': 11,
    '.evidence-list': 11,
    '.lens-artifacts a': 10,
    '.project-footer .tags': 11,
    '.project-footer a': 12,
    '.project-signal': 10,
    '.capability-index dt': 12,
    '.capability-index dd': 11,
  };

  for (const [selector, minimum] of Object.entries(minimumSizes)) {
    const locator = page.locator(selector).first();
    await expect(locator).toBeVisible();
    const size = await locator.evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
    expect(size, selector).toBeGreaterThanOrEqual(minimum);
  }
});

test('320px layout reflows under user text-spacing overrides', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('./');
  await page.addStyleTag({
    content: '*:not(svg):not(svg *) { letter-spacing: .12em !important; word-spacing: .16em !important; line-height: 1.5 !important; }',
  });

  const geometry = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
  await expect(page.getByRole('heading', { name: 'Selected engineering work' })).toBeVisible();
  await expect(page.getByRole('link', { name: /View merged PR #2961/ })).toBeVisible();
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
  await expect(page.locator('.role-rail')).toBeVisible();
  const pageLength = await page.evaluate(() => document.documentElement.scrollHeight / window.innerHeight);
  expect(pageLength).toBeLessThanOrEqual(9.5);

  await page.setViewportSize({ width: 320, height: 800 });
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(8_100);
});

test('work heading never splits a word across lines', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Responsive heading-wrap regression');

  for (const viewport of [
    { width: 320, height: 800 },
    { width: 375, height: 812 },
    { width: 390, height: 844 },
    { width: 600, height: 900 },
    { width: 667, height: 900 },
    { width: 700, height: 900 },
    { width: 720, height: 900 },
    { width: 744, height: 900 },
    { width: 768, height: 900 },
    { width: 820, height: 900 },
    { width: 1024, height: 768 },
    { width: 1280, height: 768 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('./#work');

    const heading = page.locator('#work-title');
    await expect(heading).toBeVisible();
    const headingStyle = await heading.evaluate((element) => {
      const style = getComputedStyle(element);
      const bounds = element.getBoundingClientRect();
      return {
        overflowWrap: style.overflowWrap,
        wordBreak: style.wordBreak,
        left: bounds.left,
        right: bounds.right,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        viewportWidth: window.innerWidth,
      };
    });
    expect(headingStyle.overflowWrap, `${viewport.width}px overflow-wrap`).toBe('normal');
    expect(headingStyle.wordBreak, `${viewport.width}px word-break`).toBe('normal');
    expect(headingStyle.left).toBeGreaterThanOrEqual(0);
    expect(headingStyle.right).toBeLessThanOrEqual(headingStyle.viewportWidth);
    expect(
      headingStyle.scrollWidth,
      `${viewport.width}px heading text overflow: ${JSON.stringify(headingStyle)}`,
    ).toBeLessThanOrEqual(headingStyle.clientWidth);
    const wordLines = await heading.evaluate((element) => {
      const node = element.firstChild;
      const text = node.textContent;
      return [...text.matchAll(/\S+/g)].map((match) => {
        const lineTops = [];
        for (let index = match.index; index < match.index + match[0].length; index += 1) {
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + 1);
          lineTops.push(Math.round(range.getBoundingClientRect().top));
        }
        return { word: match[0], lines: new Set(lineTops).size };
      });
    });

    expect(
      wordLines,
      `${viewport.width}px heading word geometry: ${JSON.stringify(wordLines)}`,
    ).toEqual([
      { word: 'Selected', lines: 1 },
      { word: 'engineering', lines: 1 },
      { word: 'work', lines: 1 },
    ]);
  }
});

test('mobile Server State label stays clear of the game board', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile visual-overlap regression');

  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 812 }]) {
    await page.setViewportSize(viewport);
    await page.goto('./#work');

    const canvas = page.locator('.state-canvas');
    await expect(canvas).toBeVisible();
    const geometry = await canvas.evaluate((element) => {
      const labelElement = element.querySelector('.state-label');
      const label = labelElement.getBoundingClientRect();
      const board = element.querySelector('.state-board').getBoundingClientRect();
      return {
        labelBottom: label.bottom,
        labelTop: label.top,
        boardTop: board.top,
        computedLabelTop: getComputedStyle(labelElement).top,
        viewportWidth: window.innerWidth,
      };
    });

    expect(
      geometry.boardTop - geometry.labelBottom,
      `${viewport.width}px label-to-board clearance: ${JSON.stringify(geometry)}`,
    ).toBeGreaterThanOrEqual(8);
  }

  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('./#work');
  await expect(page.locator('.state-canvas')).toBeHidden();
});

test('mobile contact headline remains clear of decorative artwork', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile layout contract');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./#contact');

  await expect(page.locator('.contact-orbit')).toBeHidden();
  await expect(page.locator('#contact-title')).toBeVisible();
  await expect(page.locator('#contact-title')).toContainText('Hiring an AI Engineer');
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
