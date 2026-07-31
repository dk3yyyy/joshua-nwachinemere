import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pageErrors = [];
const failedRequests = [];

function captureRuntime(page) {
  page.on('console', (message) => {
    if (message.type() === 'error') pageErrors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => pageErrors.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`));
}

test.beforeEach(() => {
  pageErrors.length = 0;
  failedRequests.length = 0;
});

test.afterEach(() => {
  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
  expect(failedRequests, failedRequests.join('\n')).toEqual([]);
});

test('desktop interview dossier is usable, accessible, and free of overflow', async ({ page }) => {
  captureRuntime(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Inspect the work');
  await expect(page.getByText('5 inspectable projects')).toBeVisible();
  await expect(page.getByText('8 merged upstream PRs')).toBeVisible();

  const pageWidth = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(pageWidth.scroll).toBeLessThanOrEqual(pageWidth.client + 1);

  await page.getByRole('tab', { name: /Noughtline/ }).click();
  await expect(page.getByRole('tabpanel', { name: /Noughtline/ })).toBeVisible();
  await expect(page.getByText('Server-authoritative multiplayer')).toBeVisible();

  const tab = page.getByRole('tab', { name: /Noughtline/ });
  await tab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /VirusTotal Bot/ })).toBeFocused();
  await expect(page.getByRole('tabpanel', { name: /VirusTotal Bot/ })).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: /Football Predictor/ })).toBeFocused();
  await expect(page.getByText('53.77% accuracy versus a 56.70% bookmaker benchmark')).toBeVisible();

  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations).toEqual([]);
});

test('mobile navigation, project reachability, touch targets, and layout work', async ({ page }) => {
  captureRuntime(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menu = page.locator('.menu-button');
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAccessibleName(/Open navigation/);
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).toHaveAccessibleName(/Close navigation/);
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Work' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');

  await page.getByRole('link', { name: 'Open the evidence' }).click();
  await expect(page.getByRole('heading', { name: 'What has he actually built?' })).toBeInViewport();
  const footballTab = page.getByRole('tab', { name: /Football Predictor/ });
  await footballTab.scrollIntoViewIfNeeded();
  await footballTab.click();
  await expect(page.getByRole('tabpanel', { name: /Football Predictor/ })).toBeVisible();

  const sizes = await page.locator('button, .button, .project-links a').evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return { label: node.textContent?.trim(), width: rect.width, height: rect.height };
  }).filter((size) => size.width > 0 && size.height > 0));
  for (const size of sizes) {
    expect(size.height, `${size.label} height`).toBeGreaterThanOrEqual(44);
  }
  const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
});

test('reduced motion disables progress decoration and preserves all content', async ({ page }) => {
  captureRuntime(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.reading-progress')).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Should we talk?' })).toBeAttached();
  await expect(page.getByRole('tab', { name: /Volyx Lens/ })).toHaveAttribute('aria-selected', 'true');
});

test('core content remains available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('tabpanel')).toHaveCount(5);
  await expect(page.getByText('53.77% accuracy versus a 56.70% bookmaker benchmark')).toBeVisible();
  await context.close();
});
