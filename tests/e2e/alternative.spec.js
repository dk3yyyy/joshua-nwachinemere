import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const projects = [
  'Volyx Lens',
  'Local Review Intelligence',
  'Football Forecasting Lab',
  'Telegram Social Video Downloader',
  'Bug Hunter',
];
const widths = [320, 390, 768, 1024, 1366];

function monitorRuntime(page) {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => {
    if (new URL(request.url()).origin !== new URL(page.url()).origin) return;
    const failure = request.failure()?.errorText ?? '';
    if (failure.includes('ERR_ABORTED')) return;
    errors.push(`request: ${request.method()} ${request.url()} ${failure}`);
  });
  return errors;
}

async function expectNoOverflow(page, label) {
  const geometry = await page.evaluate(() => ({
    page: [document.documentElement.scrollWidth, document.documentElement.clientWidth],
    boxes: [...document.querySelectorAll('.hero, .hero-projects, .project-card, .ledger, .writing-list')].map((node) => ({
      className: node.className,
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
    })),
  }));
  expect(geometry.page[0], `${label} page overflow`).toBeLessThanOrEqual(geometry.page[1] + 1);
  for (const box of geometry.boxes) {
    expect(box.scrollWidth, `${label} ${box.className} overflow`).toBeLessThanOrEqual(box.clientWidth + 1);
  }
}

test('portfolio content, links, accessibility and runtime are clean', async ({ page }) => {
  const errors = monitorRuntime(page);
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Python systems that show their work.');
  await expect(page.locator('.hero-project')).toHaveCount(3);
  await expect(page.locator('.project-card--primary')).toHaveCount(3);
  await expect(page.locator('.more-work-item')).toHaveCount(2);
  for (const project of projects.slice(0, 3)) {
    await expect(page.getByRole('heading', { name: project, exact: true })).toBeVisible();
  }
  for (const project of projects.slice(3)) {
    await expect(page.getByText(project, { exact: true }).first()).toBeVisible();
  }
  await expect(page.locator('.contribution-row')).toHaveCount(13);
  await expect(page.locator('.contribution-row:visible')).toHaveCount(13);
  await expect(page.locator('body')).not.toContainText('joshua0nwachinemere@gmail.com');
  await expect(page.locator('body')).not.toContainText('josh0victor@outlook.com');
  await expect(page.getByRole('link', { name: 'Email me', exact: true })).toHaveAttribute(
    'href',
    'mailto:joshua0nwachinemere@gmail.com?subject=AI%20Engineer%20opportunity',
  );
  await expect(page.locator('meta[name="theme-color"][media="(prefers-color-scheme: light)"]')).toHaveAttribute('content', '#fafafa');
  await expect(page.locator('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]')).toHaveAttribute('content', '#111110');
  await expect(page.locator('.theme-control, .theme-toggle')).toHaveCount(0);

  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations).toEqual([]);
  expect(errors).toEqual([]);
});

test('assistant opens, answers from local evidence, and closes accessibly', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const assistant = page.locator('[data-assistant]');
  const launcher = assistant.getByRole('button', { name: 'Ask Joshua', exact: true });
  await expect(launcher).toBeVisible();
  await expect(launcher).toHaveAttribute('aria-expanded', 'false');
  await expect(assistant.getByRole('dialog')).toBeHidden();

  await launcher.click();
  await expect(launcher).toHaveAttribute('aria-expanded', 'true');
  await expect(assistant.getByRole('dialog')).toBeVisible();
  await expect(assistant.getByRole('heading', { name: 'Ask Joshua' })).toBeVisible();

  await assistant.getByRole('button', { name: 'RAG and evaluation' }).click();
  await expect(assistant.getByText(/Semantic Recall@5 of 0\.913/)).toBeVisible();
  await expect(assistant.getByRole('link', { name: /Local Review Intelligence/ })).toHaveAttribute('href', '#project-local-ai');

  const input = assistant.getByLabel('Ask a question about Joshua');
  await input.fill('What is Joshua’s home address?');
  await page.keyboard.press('Control+Enter');
  await expect(assistant.getByText(/can’t answer that from the verified evidence/)).toBeVisible();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('');

  await page.keyboard.press('Escape');
  await expect(assistant.getByRole('dialog')).toBeHidden();
  await expect(launcher).toBeFocused();
});

test('responsive layout keeps the page and major regions inside the viewport', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors = monitorRuntime(page);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expectNoOverflow(page, `${width}px`);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.project-card--primary')).toHaveCount(3);
    await expect(page.locator('.contribution-row')).toHaveCount(13);
    const layout = await page.evaluate(() => ({
      heroHeight: document.querySelector('.hero').getBoundingClientRect().height,
      cardColumns: getComputedStyle(document.querySelector('.project-grid')).gridTemplateColumns.split(' ').length,
      ledgerColumns: getComputedStyle(document.querySelector('.ledger')).gridTemplateColumns.split(' ').length,
    }));
    expect(layout.heroHeight).toBeLessThan(760);
    expect(layout.cardColumns).toBe(width >= 1024 ? 3 : width >= 768 ? 2 : 1);
    expect(layout.ledgerColumns).toBe(width >= 900 ? 2 : 1);
    await testInfo.attach(`portfolio-${width}`, { body: await page.screenshot(), contentType: 'image/png' });
    await page.waitForLoadState('networkidle');
  }
  expect(errors).toEqual([]);
});

test('mobile navigation is keyboard operable and closes with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menu = page.locator('.menu-button');
  await expect(menu).toBeVisible();
  await menu.focus();
  await page.keyboard.press('Enter');
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#primary-nav')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeFocused();
});

test('all content remains available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Python systems that show their work.');
  for (const project of projects) {
    await expect(page.getByText(project, { exact: true }).first()).toBeVisible();
  }
  await expect(page.locator('[data-assistant]')).toBeHidden();
  await context.close();
});

test('reduced motion and forced colours remain usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await expectNoOverflow(page, 'reduced motion');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
