import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const headline = 'I build the part of an AI system that checks the model’s work.';
const projects = [
  'Volyx Lens',
  'Local Review Intelligence',
  'Football Forecasting Lab',
  'Telegram Social Video Downloader',
  'ChainScope Wallet Analyzer',
];
const projectIds = ['project-lens', 'project-local-ai', 'project-football', 'project-downloader', 'project-wallet'];
const navLabels = ['Work', 'Receipts', 'Upstream', 'Writing', 'Background', 'Contact'];

// Budgets measured against the settled page (machine finished, steps drawn)
// with roughly 8% headroom. They are ceilings that catch runaway growth.
const viewports = [
  { width: 320, height: 800, maxPageHeight: 12400, maxHeroHeight: 1520 },
  { width: 390, height: 844, maxPageHeight: 11400, maxHeroHeight: 1320 },
  { width: 768, height: 1024, maxPageHeight: 10600, maxHeroHeight: 1180 },
  { width: 1024, height: 768, maxPageHeight: 7250, maxHeroHeight: 980 },
  { width: 1050, height: 800, maxPageHeight: 7250, maxHeroHeight: 950 },
  { width: 1051, height: 800, maxPageHeight: 6840, maxHeroHeight: 890 },
  { width: 1366, height: 768, maxPageHeight: 7620, maxHeroHeight: 1020 },
];

function monitorRuntime(page) {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => {
    if (new URL(request.url()).origin === new URL(page.url()).origin) {
      errors.push(`request: ${request.method()} ${request.url()} ${request.failure()?.errorText}`);
    }
  });
  return errors;
}

// Axe must not sample a heading or a section while its entrance transition is
// mid-flight: a half-faded colour is a false contrast failure.
async function settleReveals(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => {
    const top = document.querySelector('#top');
    const h1 = document.querySelector('h1');
    return Boolean(top?.classList.contains('ready')) && (!h1?.classList.contains('split') || h1.classList.contains('in'));
  });
  await page.evaluate(async () => {
    const step = Math.max(320, Math.round(innerHeight * 0.75));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    scrollTo(0, 0);
  });
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      try {
        animation.finish();
      } catch {
        // Scroll-driven timelines cannot be finished; they are not transitions.
      }
    }
  });
  await page.waitForTimeout(80);
}

async function expectNoOverflow(page, label, { soft = false } = {}) {
  const assertion = soft ? expect.soft : expect;
  const geometry = await page.evaluate(() => ({
    page: [document.documentElement.scrollWidth, document.documentElement.clientWidth],
    containers: [...document.querySelectorAll('.primary-nav, .wrap, .machine, .tablewrap, .also, .prs, .certs, .contact, .idcard')].map((node) => ({
      className: node.className,
      right: node.getBoundingClientRect().right,
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
      overflowing: node.scrollWidth > node.clientWidth + 1 && !node.classList.contains('tablewrap'),
    })),
  }));
  assertion(geometry.page[0], `${label} page overflow`).toBeLessThanOrEqual(geometry.page[1] + 1);
  for (const item of geometry.containers) {
    assertion(item.right, `${label} ${item.className} crosses the viewport`).toBeLessThanOrEqual(geometry.page[1] + 1);
    assertion(item.overflowing, `${label} ${item.className} overflows`).toBe(false);
  }
}

// Inline links inside prose and table cells are exempt from the 44px target
// rule (WCAG 2.5.8); buttons, block links and primary actions are not.
async function expectTouchTargets(page, label, { soft = false } = {}) {
  const assertion = soft ? expect.soft : expect;
  const targets = await page.locator('button:visible, .btn:visible, .essays a:visible, .certs a:visible, .primary-nav[data-open="true"] a:visible').evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return { label: (node.textContent || node.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 48), width: rect.width, height: rect.height };
  }));
  assertion(targets.length).toBeGreaterThan(0);
  const small = targets.filter((target) => target.width < 43.98 || target.height < 43.98);
  assertion(small, `${label} targets below 44x44: ${JSON.stringify(small)}`).toEqual([]);
}

async function expectKeyboardFocusVisibility(page, label) {
  const menu = page.locator('.menu-button');
  if (await menu.isVisible()) {
    await menu.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
  }

  await page.locator('body').focus();
  const focusableCount = await page.locator('a:visible, button:visible').count();
  let focused = 0;
  for (let index = 0; index < focusableCount + 2; index += 1) {
    await page.keyboard.press('Tab');
    const item = await page.evaluate(() => {
      const node = document.activeElement;
      if (!node || !['A', 'BUTTON'].includes(node.tagName)) return null;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        tag: node.tagName,
        label: (node.textContent || node.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 48),
        width: rect.width,
        height: rect.height,
        outlineStyle: style.outlineStyle,
        outlineWidth: parseFloat(style.outlineWidth),
        control: node.tagName === 'BUTTON' || node.classList.contains('btn'),
      };
    });
    if (!item) continue;
    focused += 1;
    expect(item.outlineStyle, `${label}: focused ${item.label} outline`).not.toBe('none');
    expect(item.outlineWidth, `${label}: focused ${item.label} outline width`).toBeGreaterThanOrEqual(2);
    if (item.control) {
      expect.soft(item.width, `${label}: focused ${item.label} width`).toBeGreaterThanOrEqual(43.98);
      expect.soft(item.height, `${label}: focused ${item.label} height`).toBeGreaterThanOrEqual(43.98);
    }
  }
  expect(focused, `${label}: keyboard-reached visible targets`).toBeGreaterThanOrEqual(focusableCount);
}

test('professional portfolio is complete, private, and runtime-clean', async ({ page }) => {
  const errors = monitorRuntime(page);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(headline);
  await expect(page.getByText('Open to AI engineer roles', { exact: true })).toBeVisible();
  await expect(page.locator('[data-project-name]')).toHaveCount(5);
  for (const project of projects) await expect(page.getByRole('heading', { name: project, exact: true })).toBeVisible();

  await expect(page.locator('#work article.project')).toHaveCount(3);
  await expect(page.locator('#work .also article')).toHaveCount(2);
  await expect(page.locator('#work .also')).toBeVisible();
  for (const id of ['project-lens', 'project-local-ai', 'project-football', 'project-downloader', 'project-wallet']) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
  await expect(page.locator('.steps')).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) await expect(page.locator('.steps').nth(index).locator('li')).toHaveCount(4);
  await expect(page.locator('.result .res')).toHaveCount(6);

  const nav = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(nav.getByRole('link')).toHaveCount(6);
  for (const [index, label] of navLabels.entries()) {
    await expect(nav.getByRole('link').nth(index)).toHaveText(label);
    await expect(nav.getByRole('link').nth(index)).toHaveAttribute('href', ['#work', '#receipts', '#contributions', '#writing', '#background', '#contact'][index]);
  }

  await expect(page.locator('#receipts table')).toHaveCount(1);
  await expect(page.locator('#receipts thead th')).toHaveCount(5);
  await expect(page.locator('#receipts tbody tr')).toHaveCount(4);
  await expect(page.locator('#receipts td.n')).not.toHaveCount(0);
  await expect(page.locator('#receipts tbody')).toContainText('53.77%');
  await expect(page.locator('#receipts .loss-t')).toHaveCount(0);

  await expect(page.locator('#contributions .contribution-row')).toHaveCount(9);
  await expect(page.locator('#contributions .contribution-row:visible')).toHaveCount(9);
  await expect(page.locator('#contributions .ref')).toHaveCount(9);

  await expect(page.locator('#writing .essays a')).toHaveCount(5);
  await expect(page.locator('#writing .essays .et')).toHaveCount(5);
  await expect(page.locator('#writing .essays .ed')).toHaveCount(5);

  await expect(page.locator('#background dl.record > div')).toHaveCount(5);
  await expect(page.locator('#background ul.certs a')).toHaveCount(3);

  const contact = page.locator('#contact');
  await expect(contact.locator('h2')).toBeVisible();
  await expect(contact.locator('.lede')).toBeVisible();
  await expect(contact.locator('.btn')).toHaveCount(4);
  for (const [index, label] of ['Email me', 'Download CV', 'GitHub', 'LinkedIn'].entries()) {
    await expect(contact.locator('.btn').nth(index)).toHaveText(label);
  }
  await expect(contact.locator('.btn.primary')).toHaveText('Email me');
  await expect(contact.locator('.idcard')).toBeVisible();
  await expect(contact.locator('.idcard')).toHaveAttribute('aria-label', 'Contact card for Joshua Nwachinemere, AI engineer');

  const footer = page.locator('footer');
  await expect(footer).toContainText('© 2026 Joshua Nwachinemere');
  await expect(footer).toContainText('AI Engineer · Python and applied AI');
  await expect(footer).toContainText('No cookies, no analytics, no trackers.');

  await expect(page.locator('body')).not.toContainText('joshua0nwachinemere@gmail.com');
  await expect(page.locator('body')).not.toContainText('josh0victor@outlook.com');
  const email = page.getByRole('link', { name: 'Email me', exact: true });
  await expect(email).toHaveAttribute('href', 'mailto:joshua0nwachinemere@gmail.com?subject=AI%20Engineer%20opportunity');
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(1);

  const renderedRatio = async (locator) => {
    await locator.scrollIntoViewIfNeeded();
    return locator.evaluate(async (image) => {
      await image.decode();
      const rect = image.getBoundingClientRect();
      return { rendered: rect.width / rect.height, intrinsic: image.naturalWidth / image.naturalHeight };
    });
  };
  for (const selector of ['#project-lens .shot img', '#project-local-ai .shot img', '#project-football .shot img']) {
    const ratio = await renderedRatio(page.locator(selector));
    expect(Math.abs(ratio.rendered - ratio.intrinsic), selector).toBeLessThan(0.01);
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  const structure = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const body = getComputedStyle(document.body);
    const h1 = getComputedStyle(document.querySelector('h1'));
    const header = document.querySelector('.top');
    const headerWrap = document.querySelector('.top .wrap');
    const wrap = document.querySelector('.hero');
    return {
      paper: root.getPropertyValue('--paper').trim(),
      ink: root.getPropertyValue('--fg-1').trim(),
      blue: root.getPropertyValue('--blue').trim(),
      onBlue: root.getPropertyValue('--on-blue').trim(),
      bodyBackground: body.backgroundColor,
      h1Family: h1.fontFamily,
      h1Color: h1.color,
      headerPosition: getComputedStyle(header).position,
      headerHeight: headerWrap.getBoundingClientRect().height,
      wrapWidth: wrap.getBoundingClientRect().width,
      wrapMaxWidth: getComputedStyle(wrap).maxWidth,
    };
  });
  expect(structure).toMatchObject({
    paper: '#FFFFFF',
    ink: '#000000',
    blue: '#1A35E5',
    onBlue: '#FFFFFF',
    bodyBackground: 'rgb(255, 255, 255)',
    headerPosition: 'sticky',
    headerHeight: 64,
    wrapMaxWidth: '1200px',
  });
  expect(structure.h1Family).toContain('Instrument Serif');
  expect(structure.h1Color).toBe('rgb(0, 0, 0)');
  expect(structure.wrapWidth).toBeLessThanOrEqual(1200);

  await expect(page.locator('[role="tab"], [role="tabpanel"], .reading-progress, .theme-toggle, .theme-control')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('automatic theme follows the OS in both schemes and clears legacy overrides', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('portfolio-theme', 'light'));
  await page.goto('/');

  await expect(page.locator('.theme-control, .theme-toggle')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'auto');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#000000');
  expect(await page.evaluate(() => localStorage.getItem('portfolio-theme'))).toBeNull();
  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(page.locator('.idcard')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  const darkTokens = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    return ['--paper', '--fg-1', '--blue', '--on-blue'].map((token) => root.getPropertyValue(token).trim());
  });
  expect(darkTokens).toEqual(['#000000', '#FFFFFF', '#7086FF', '#000000']);

  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'auto');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#ffffff');
  await expect(page.locator('h1')).toHaveCSS('color', 'rgb(0, 0, 0)');
  expect(await page.evaluate(() => localStorage.getItem('portfolio-theme'))).toBeNull();

  await page.emulateMedia({ colorScheme: 'dark' });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'auto');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  expect(await page.evaluate(() => localStorage.getItem('portfolio-theme'))).toBeNull();

  for (const { width } of viewports) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.locator('.theme-control, .theme-toggle')).toHaveCount(0);
    expect.soft(await page.evaluate(() => document.documentElement.scrollWidth), `${width}px page overflow`).toBeLessThanOrEqual(width);
  }
});

test('portfolio assistant opens as a corner popup, answers with citations, and closes accessibly', async ({ page }) => {
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
  await expect(page.locator('#assistant-question')).toBeFocused();

  const widgetGeometry = await assistant.evaluate((root) => {
    const panel = root.querySelector('.assistant-panel').getBoundingClientRect();
    return { panelLeft: panel.left, panelRight: panel.right, panelBottom: panel.bottom, viewportWidth: innerWidth, viewportHeight: innerHeight };
  });
  expect(widgetGeometry.panelLeft).toBeGreaterThanOrEqual(8);
  expect(widgetGeometry.panelRight).toBeLessThanOrEqual(widgetGeometry.viewportWidth - 8);
  expect(widgetGeometry.panelBottom).toBeLessThanOrEqual(widgetGeometry.viewportHeight - 64);

  await assistant.getByRole('button', { name: 'RAG and evaluation' }).click();
  await expect(assistant.getByText(/Semantic Recall@5 of 0\.913/)).toBeVisible();
  const citation = assistant.getByRole('link', { name: /Local Review Intelligence/ });
  await expect(citation).toHaveAttribute('href', '#project-local-ai');

  const input = assistant.getByLabel('Ask a question about Joshua');
  await input.fill('What is Joshua’s home address?');
  await page.keyboard.press('Control+Enter');
  await expect(assistant.getByText(/can’t answer that from the verified evidence/)).toBeVisible();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('');

  const before = await assistant.locator('.assistant-message').count();
  await assistant.getByRole('button', { name: 'Open-source work', exact: true }).click();
  await expect(assistant.locator('.assistant-message')).toHaveCount(before + 2);

  const assistantTargets = await assistant.locator('button:visible').evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return { label: (node.getAttribute('aria-label') || node.textContent).trim(), width: rect.width, height: rect.height };
  }));
  expect.soft(assistantTargets.filter((target) => target.width < 43.98 || target.height < 43.98), 'assistant targets below 44x44').toEqual([]);

  await page.keyboard.press('Escape');
  await expect(assistant.getByRole('dialog')).toBeHidden();
  await expect(launcher).toBeFocused();
});

test('responsive composition meets page, hero, grid, overflow, and target budgets', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const errors = monitorRuntime(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    await page.evaluate(() => window.scrollTo(0, 0));

    const layout = await page.evaluate(() => {
      const columns = (selector) => getComputedStyle(document.querySelector(selector)).gridTemplateColumns.split(' ').length;
      return {
        pageHeight: document.documentElement.scrollHeight,
        heroHeight: document.querySelector('#top').getBoundingClientRect().height,
        heroColumns: columns('.hero-grid'),
        sheadColumns: columns('.shead'),
        projectColumns: columns('.project'),
        contactColumns: columns('.contact'),
        essayColumns: columns('.essays a'),
        recordColumns: columns('.record > div'),
        alsoColumns: columns('.also'),
        stepColumns: columns('.steps'),
        factColumns: columns('.facts li'),
        prColumns: getComputedStyle(document.querySelector('.prs')).columnCount,
        navDisplay: getComputedStyle(document.querySelector('#primary-nav')).display,
        menuDisplay: getComputedStyle(document.querySelector('.menu-button')).display,
        machineDisplay: getComputedStyle(document.querySelector('.machine')).display,
        machineWidth: document.querySelector('.machine').getBoundingClientRect().width,
        wrapWidth: document.querySelector('.hero').getBoundingClientRect().width,
        callsCount: document.querySelectorAll('.calls').length,
      };
    });
    expect(layout.pageHeight, `${viewport.width}px page height`).toBeLessThanOrEqual(viewport.maxPageHeight);
    expect(layout.heroHeight, `${viewport.width}px hero height`).toBeLessThanOrEqual(viewport.maxHeroHeight);
    expect(layout.heroColumns, `${viewport.width}px hero columns`).toBe(viewport.width <= 959 ? 1 : 2);
    expect(layout.sheadColumns, `${viewport.width}px section-head columns`).toBe(viewport.width <= 959 ? 1 : 2);
    expect(layout.projectColumns, `${viewport.width}px project columns`).toBe(viewport.width <= 959 ? 1 : 2);
    expect(layout.contactColumns, `${viewport.width}px contact columns`).toBe(viewport.width <= 959 ? 1 : 2);
    expect(layout.essayColumns, `${viewport.width}px essay columns`).toBe(viewport.width <= 959 ? 1 : 2);
    expect(layout.recordColumns, `${viewport.width}px record columns`).toBe(viewport.width <= 959 ? 1 : 2);
    expect(layout.alsoColumns, `${viewport.width}px also columns`).toBe(viewport.width <= 760 ? 1 : 2);
    expect(layout.stepColumns, `${viewport.width}px step columns`).toBe(viewport.width <= 620 ? 2 : 4);
    expect(layout.factColumns, `${viewport.width}px fact columns`).toBe(viewport.width <= 620 ? 1 : 2);
    expect(layout.prColumns, `${viewport.width}px upstream columns`).toBe(viewport.width <= 960 ? '1' : '2');
    expect(layout.navDisplay, `${viewport.width}px primary navigation`).toBe(viewport.width > 960 ? 'flex' : 'none');
    expect(layout.menuDisplay, `${viewport.width}px menu button`).toBe(viewport.width <= 959 ? 'flex' : 'none');
    expect(layout.machineDisplay, `${viewport.width}px check machine`).toBe('block');
    expect(layout.machineWidth, `${viewport.width}px check machine width`).toBeLessThanOrEqual(layout.wrapWidth + 1);
    expect(layout.callsCount, `${viewport.width}px stale .calls`).toBe(0);
    await expectNoOverflow(page, `${viewport.width}px`, { soft: true });
    await expectTouchTargets(page, `${viewport.width}px`, { soft: true });
    await testInfo.attach(`portfolio-${viewport.width}`, { body: await page.screenshot(), contentType: 'image/png' });
  }
  expect(errors).toEqual([]);
});

test('phone spacing preserves the gutter, section rhythm, and readable single columns', async ({ page }) => {
  for (const viewport of viewports.filter(({ width }) => width <= 390)) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const spacing = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth;
      const box = (selector) => document.querySelector(selector).getBoundingClientRect();
      const style = (selector) => getComputedStyle(document.querySelector(selector));
      return {
        heroLeft: box('.hero').left,
        heroRight: viewportWidth - box('.hero').right,
        wrapPaddingLeft: parseFloat(style('.hero').paddingLeft),
        wrapPaddingRight: parseFloat(style('.hero').paddingRight),
        h1Left: box('h1').left,
        sectionPaddingTop: parseFloat(style('#work').paddingTop),
        sectionPaddingBottom: parseFloat(style('#work').paddingBottom),
        sheadGap: parseFloat(style('.shead').marginBottom),
        factColumns: style('.facts li').gridTemplateColumns.split(' ').length,
        idcard: box('.idcard'),
        viewportWidth,
      };
    });
    expect(spacing.heroLeft, `${viewport.width}px hero reaches the left edge`).toBe(0);
    expect(spacing.heroRight, `${viewport.width}px hero reaches the right edge`).toBe(0);
    expect(spacing.wrapPaddingLeft, `${viewport.width}px left gutter`).toBeGreaterThanOrEqual(20);
    expect(spacing.wrapPaddingRight, `${viewport.width}px right gutter`).toBeGreaterThanOrEqual(20);
    expect(spacing.h1Left, `${viewport.width}px headline starts on the gutter`).toBe(spacing.wrapPaddingLeft);
    expect(spacing.sectionPaddingTop, `${viewport.width}px section top rhythm`).toBeGreaterThanOrEqual(36);
    expect(spacing.sectionPaddingBottom, `${viewport.width}px section bottom rhythm`).toBeGreaterThanOrEqual(36);
    expect(spacing.sheadGap, `${viewport.width}px heading-to-content gap`).toBeGreaterThanOrEqual(20);
    expect(spacing.factColumns, `${viewport.width}px fact columns`).toBe(1);
    expect.soft(spacing.idcard.right, `${viewport.width}px contact card right edge`).toBeLessThanOrEqual(spacing.viewportWidth);
  }
});

test('editorial typography, measure, and control scale hold at every width', async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const tokens = await page.evaluate(() => {
      const style = (selector) => getComputedStyle(document.querySelector(selector));
      const size = (selector) => parseFloat(style(selector).fontSize);
      return {
        h1Family: style('h1').fontFamily,
        h2Family: style('.shead h2').fontFamily,
        etFamily: style('.et').fontFamily,
        resFamily: style('.res strong').fontFamily,
        bodyFamily: style('body').fontFamily,
        h1Size: size('h1'),
        h2Size: size('.shead h2'),
        ledeSize: size('.lede'),
        bodySize: size('body'),
        smallSize: size('.shot figcaption'),
        refFamily: style('.ref').fontFamily,
        wrapMaxWidth: parseFloat(style('.hero').maxWidth),
        headerHeight: document.querySelector('.top .wrap').getBoundingClientRect().height,
        h1LineHeight: parseFloat(style('h1').lineHeight) / size('h1'),
        btnHeight: document.querySelector('.btn').getBoundingClientRect().height,
        machineRadius: parseFloat(style('.machine').borderRadius),
        instrumentLoaded: document.fonts.check('16px "Instrument Serif"') && document.fonts.check('16px "Instrument Sans"'),
      };
    });
    expect(tokens.h1Family, `${viewport.width}px display face`).toContain('Instrument Serif');
    expect(tokens.h2Family, `${viewport.width}px heading face`).toContain('Instrument Serif');
    expect(tokens.etFamily, `${viewport.width}px essay face`).toContain('Instrument Serif');
    expect(tokens.resFamily, `${viewport.width}px metric face`).toContain('Instrument Serif');
    expect(tokens.bodyFamily, `${viewport.width}px body face`).toContain('Instrument Sans');
    expect(tokens.h1Size, `${viewport.width}px display floor`).toBeGreaterThanOrEqual(40);
    expect(tokens.h2Size, `${viewport.width}px section heading floor`).toBeGreaterThanOrEqual(40);
    expect(tokens.ledeSize, `${viewport.width}px lede`).toBeGreaterThanOrEqual(19);
    expect(tokens.bodySize, `${viewport.width}px body floor`).toBeGreaterThanOrEqual(16);
    expect(tokens.smallSize, `${viewport.width}px caption floor`).toBeGreaterThanOrEqual(13);
    expect(tokens.wrapMaxWidth, `${viewport.width}px measure`).toBeLessThanOrEqual(1200);
    expect(tokens.headerHeight, `${viewport.width}px masthead`).toBe(64);
    expect(tokens.h1LineHeight, `${viewport.width}px display leading`).toBeLessThanOrEqual(1);
    expect(tokens.btnHeight, `${viewport.width}px button height`).toBeGreaterThanOrEqual(44);
    expect(tokens.machineRadius, `${viewport.width}px machine radius`).toBeGreaterThanOrEqual(20);
    expect(tokens.instrumentLoaded, `${viewport.width}px self-hosted faces loaded`).toBe(true);
  }
});

test('receipts toggle reveals evidence links and states the change', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  const toggle = page.locator('#rcptToggle');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(toggle).toHaveAccessibleName('Show receipts');
  await expect(page.locator('.rcpt').first()).toBeHidden();

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle).toHaveText('Hide receipts');
  await expect(page.locator('body')).toHaveClass(/receipts/);
  await expect(page.locator('.rcpt')).toHaveCount(4);
  for (let index = 0; index < 4; index += 1) await expect(page.locator('.rcpt').nth(index)).toBeVisible();
  await expect(page.locator('.rcpt').first()).toHaveAttribute('target', '_blank');
  await expect(page.locator('.rcpt').first()).toHaveAttribute('rel', 'noreferrer');
  await expect(page.locator('#live')).toHaveText('Receipts shown. Each result now links to its evidence.');

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(toggle).toHaveText('Show receipts');
  await expect(page.locator('body')).not.toHaveClass(/receipts/);
  await expect(page.locator('.rcpt').first()).toBeHidden();
});

test('the hero panel states four verified checks and nothing moves on its own', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  const checks = page.locator('.machine .check');
  await expect(checks).toHaveCount(4);
  for (let index = 0; index < 4; index += 1) {
    await expect(checks.nth(index).locator('.check-name')).not.toBeEmpty();
    await expect(checks.nth(index).locator('.what')).not.toBeEmpty();
    await expect(checks.nth(index).locator('.why')).not.toBeEmpty();
    await expect(checks.nth(index).locator('.st')).toHaveText(/Measured|Verified|Merged/);
  }
  await expect(page.locator('#runBtn, #tally, #held, .slot')).toHaveCount(0);
  await expect(page.locator('.check .st').first()).toBeVisible();

  const marks = await checks.first().locator('.st').evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(marks).toBe('rgb(26, 53, 229)');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator('.machine .check')).toHaveCount(4);
  const motion = await checks.first().evaluate((node) => {
    const style = getComputedStyle(node);
    return { animation: style.animationName, opacity: style.opacity };
  });
  expect(motion.animation).toBe('none');
  expect(motion.opacity).toBe('1');
});

test('project steps draw in on scroll and are already drawn under reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  const steps = page.locator('.steps');
  for (let index = 0; index < 3; index += 1) {
    const list = steps.nth(index);
    await list.scrollIntoViewIfNeeded();
    await expect(list).toHaveClass(/drawn/, { timeout: 5_000 });
    await expect(list.locator('.sh-hard')).toHaveCount(1);
    await expect(list.locator('.sh-failed')).toHaveCount(0);
    const labels = await list.locator('b').allTextContents();
    expect(labels).toEqual(['Approach', 'Hard part', 'Insight', 'Shipped']);
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator('.steps')).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) {
    await expect(page.locator('.steps').nth(index)).toHaveClass(/drawn/);
    const state = await page.locator('.steps').nth(index).locator('.shape').first().evaluate((node) => {
      const style = getComputedStyle(node);
      return { opacity: style.opacity, transition: parseFloat(style.transitionDuration) };
    });
    expect(state.opacity).toBe('1');
    expect(state.transition).toBeLessThanOrEqual(0.001);
  }
});

test('mobile navigation is keyboard-operable, dismisses on Escape, and restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menu = page.locator('.menu-button');
  await expect(menu).toHaveAccessibleName('Open navigation');
  await menu.focus();
  await page.keyboard.press('Enter');
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).toHaveAccessibleName('Close navigation');
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Work' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeFocused();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeHidden();

  await page.keyboard.press('Enter');
  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Work' }).click();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  const clearance = await page.evaluate(() => {
    const header = document.querySelector('.top').getBoundingClientRect();
    const section = document.querySelector('#work').getBoundingClientRect();
    return section.top - header.bottom;
  });
  expect(clearance).toBeGreaterThanOrEqual(6);
});

test('contact card stays inside every viewport and tracks the pointer', async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    expect.soft(await page.evaluate(() => document.documentElement.scrollWidth), `${viewport.width}px page overflow`).toBeLessThanOrEqual(viewport.width + 1);
    const card = page.locator('.idcard');
    await card.scrollIntoViewIfNeeded();
    const geometry = await card.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const stage = node.parentElement.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width, height: rect.height, stageLeft: stage.left, stageRight: stage.right, viewport: document.documentElement.clientWidth };
    });
    expect.soft(geometry.left, `${viewport.width}px card left`).toBeGreaterThanOrEqual(-1);
    expect.soft(geometry.right, `${viewport.width}px card right`).toBeLessThanOrEqual(geometry.viewport + 1);
    expect.soft(geometry.left, `${viewport.width}px card inside stage`).toBeGreaterThanOrEqual(geometry.stageLeft - 1);
    expect.soft(geometry.right, `${viewport.width}px card inside stage`).toBeLessThanOrEqual(geometry.stageRight + 1);
    expect.soft(geometry.width / geometry.height, `${viewport.width}px card ratio`).toBeCloseTo(1.586, 1);
  }

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  const card = page.locator('.idcard');
  await card.scrollIntoViewIfNeeded();
  const box = await card.boundingBox();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.25);
  await expect.poll(() => card.evaluate((node) => node.style.getPropertyValue('--mx'))).not.toBe('');
  await expect.poll(() => card.evaluate((node) => node.style.getPropertyValue('--ry'))).not.toBe('');
});

test('accessibility is clean in light and dark at every required width', async ({ page }) => {
  test.setTimeout(180_000);
  const failures = [];
  for (const scheme of ['light', 'dark']) {
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
        await settleReveals(page);
      const results = await new AxeBuilder({ page }).analyze();
      if (results.violations.length) {
        failures.push({
          scheme,
          width: viewport.width,
          violations: results.violations.map((violation) => ({
            id: violation.id,
            impact: violation.impact,
            nodes: violation.nodes.length,
            targets: violation.nodes.slice(0, 4).map((node) => node.target.join(' ')),
          })),
        });
      }
    }
  }
  expect(failures, `Axe violations: ${JSON.stringify(failures, null, 2)}`).toEqual([]);
});

test('keyboard focus is visible with a 2px outline at every required width', async ({ page }) => {
  test.setTimeout(180_000);
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expectKeyboardFocusVisibility(page, `${viewport.width}px`);
  }
});

test('short desktop first fold carries the availability, headline and lede', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  for (const locator of [
    page.getByRole('heading', { level: 1 }),
    page.getByText('Open to AI engineer roles', { exact: true }),
    page.locator('.hero .lede'),
  ]) {
    await expect(locator).toBeVisible();
    const box = await locator.boundingBox();
    expect(box.y, await locator.textContent()).toBeLessThan(768);
  }
  const hero = await page.evaluate(() => {
    const box = document.querySelector('#top').getBoundingClientRect();
    return { top: box.top, height: box.height, viewport: innerHeight };
  });
  expect(hero.height).toBeLessThanOrEqual(1270);
});

test('all content and navigation remain available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(headline);
  await expect(page.locator('article.project:visible, .also article:visible')).toHaveCount(5);
  await expect(page.locator('.contribution-row:visible')).toHaveCount(9);
  await expect(page.locator('#receipts tbody tr')).toHaveCount(4);
  await expect(page.locator('.essays a')).toHaveCount(5);
  await expect(page.locator('.certs a')).toHaveCount(3);
  await expect(page.getByText(/The market is the baseline/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Email me' })).toBeVisible();
  await expect(page.locator('[role="tab"], [role="tabpanel"]')).toHaveCount(0);
  await expectNoOverflow(page, 'no-JS mobile');
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
  for (const label of navLabels) {
    await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: label, exact: true })).toBeVisible();
  }
  await context.close();
});

test('reduced motion, reduced transparency, and forced colours remain usable', async ({ page, browser }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const heading = page.locator('h1');
  await expect(heading).not.toHaveClass(/split/);
  await expect(heading).toBeVisible();
  const motion = await page.locator('.rise').first().evaluate((node) => {
    const style = getComputedStyle(node);
    return { opacity: style.opacity, transition: parseFloat(style.transitionDuration), animation: style.animationName };
  });
  expect(motion.opacity).toBe('1');
  expect(motion.transition).toBeLessThanOrEqual(0.001);
  expect(motion.animation).toBe('none');
  await expect(page.locator('.steps')).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) await expect(page.locator('.steps').nth(index)).toHaveClass(/drawn/);
  await expect(page.locator('article.project:visible, .also article:visible')).toHaveCount(5);

  const noScriptContext = await browser.newContext({
    javaScriptEnabled: false,
    reducedMotion: 'reduce',
    viewport: { width: 390, height: 844 },
  });
  const noScriptPage = await noScriptContext.newPage();
  await noScriptPage.goto('/');
  const noScriptHeading = await noScriptPage.locator('h1').evaluate((node) => {
    const style = getComputedStyle(node);
    return { visibility: style.visibility, opacity: style.opacity, split: node.classList.contains('split') };
  });
  expect(noScriptHeading).toEqual({ visibility: 'visible', opacity: '1', split: false });
  await noScriptContext.close();

  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setEmulatedMedia', { media: 'screen', features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
  await page.reload();
  for (const selector of ['.top', '.machine', '.idcard', '.assistant-panel']) {
    const style = await page.locator(selector).first().evaluate((node) => {
      const value = getComputedStyle(node);
      return { background: value.backgroundColor, backdrop: value.backdropFilter || value.webkitBackdropFilter };
    });
    expect(style.background).toMatch(/^(rgb|rgba)\(/);
    expect(style.backdrop).toBe('none');
  }
  await session.send('Emulation.setEmulatedMedia', { media: 'screen', features: [] });

  await page.emulateMedia({ forcedColors: 'active' });
  await page.reload();
  const menu = page.locator('.menu-button');
  const contact = page.locator('.primary-nav a[href="#contact"]');
  if (await menu.isVisible()) {
    await menu.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
  }
  await contact.focus();
  await expect(contact).toBeFocused();
  expect(await contact.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe('none');
  expect(await page.locator('.project').first().evaluate((node) => getComputedStyle(node).borderStyle)).not.toBe('none');
});

test('320px WCAG text spacing retains every content group without clipping', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await page.addStyleTag({ content: `
    * { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }
    p, li, dd { margin-bottom: 2em !important; }
  ` });
  await expect(page.locator('article.project:visible, .also article:visible')).toHaveCount(5);
  await expect(page.locator('.contribution-row:visible')).toHaveCount(9);
  await expect(page.getByRole('heading', { name: 'Tell me what your model gets wrong.' })).toBeVisible();
  await expectNoOverflow(page, '320px text spacing');
});
