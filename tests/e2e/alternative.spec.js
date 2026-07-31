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

  await page.getByRole('tab', { name: /Football Forecasting Lab/ }).click();
  await expect(page.getByRole('tabpanel', { name: /Football Forecasting Lab/ })).toBeVisible();
  await expect(page.getByText('Temporal forecasting experiment')).toBeVisible();

  const tab = page.getByRole('tab', { name: /Football Forecasting Lab/ });
  await tab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /Telegram Social Video Downloader/ })).toBeFocused();
  await expect(page.getByRole('tabpanel', { name: /Telegram Social Video Downloader/ })).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: /Telegram User Counter/ })).toBeFocused();
  await expect(page.getByText('Transactional registration and milestone delivery')).toBeVisible();

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
  const anchorClearance = await page.evaluate(() => {
    const masthead = document.querySelector('.masthead').getBoundingClientRect();
    const heading = document.querySelector('#work h2').getBoundingClientRect();
    return heading.top - masthead.bottom;
  });
  expect(anchorClearance).toBeGreaterThanOrEqual(8);
  const finalTab = page.getByRole('tab', { name: /Telegram User Counter/ });
  await finalTab.scrollIntoViewIfNeeded();
  await finalTab.click();
  await expect(page.getByRole('tabpanel', { name: /Telegram User Counter/ })).toBeVisible();

  const sizes = await page.locator('button, .button, .project-links a').evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return { label: node.textContent?.trim(), width: rect.width, height: rect.height };
  }).filter((size) => size.width > 0 && size.height > 0));
  for (const size of sizes) {
    expect(size.height, `${size.label} height`).toBeGreaterThanOrEqual(44);
    expect(size.width, `${size.label} width`).toBeGreaterThanOrEqual(44);
  }
  for (const target of [page.locator('.candidate-card dd a'), page.locator('.method-context a')]) {
    const box = await target.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(24);
    expect(box.width).toBeGreaterThanOrEqual(24);
  }
  const footerLink = await page.locator('.footer a').boundingBox();
  expect(footerLink.height).toBeGreaterThanOrEqual(44);
  expect(footerLink.width).toBeGreaterThanOrEqual(44);
  const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(width.scroll).toBeLessThanOrEqual(width.client + 1);

  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations).toEqual([]);
});

test('320px enhanced text spacing preserves content and controls', async ({ page }) => {
  captureRuntime(page);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await page.addStyleTag({ content: `
    * { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }
    p, li, dd { margin-bottom: 2em !important; }
  ` });

  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    tabsScrollWidth: document.querySelector('.dossier-tabs').scrollWidth,
    tabsClientWidth: document.querySelector('.dossier-tabs').clientWidth,
  }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
  expect(layout.tabsScrollWidth).toBeLessThanOrEqual(layout.tabsClientWidth + 1);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Telegram User Counter/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open the evidence' })).toBeVisible();
  for (const heading of await page.getByRole('heading', { level: 2 }).all()) {
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
  }
  await expect(page.getByRole('link', { name: /FastStream.*PR #2961/ })).toBeVisible();
  await expect(page.getByLabel('Should we talk?').getByRole('link', { name: 'Email me ↗' })).toBeVisible();
});

test('responsive dossier is intentionally composed across phone, tablet, and short laptop', async ({ page }) => {
  captureRuntime(page);

  for (const viewport of [
    { width: 320, height: 800, maxPageHeight: 9600, maxCoverHeight: 1200 },
    { width: 390, height: 844, maxPageHeight: 9000, maxCoverHeight: 1050 },
    { width: 761, height: 1024, maxPageHeight: 8200, maxCoverHeight: 920 },
    { width: 768, height: 1024, maxPageHeight: 8200, maxCoverHeight: 920 },
    { width: 1024, height: 768, maxPageHeight: 8000, maxCoverHeight: 800 },
    { width: 1366, height: 768, maxPageHeight: 7600, maxCoverHeight: 770 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');

    const layout = await page.evaluate(() => {
      const cover = document.querySelector('.cover').getBoundingClientRect();
      const tabs = document.querySelector('.dossier-tabs');
      const questionIndex = document.querySelector('.question-index');
      const visibleTabs = [...tabs.querySelectorAll('[role="tab"]')].map((tab) => {
        const rect = tab.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      });
      return {
        pageHeight: document.documentElement.scrollHeight,
        pageWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        coverHeight: cover.height,
        tabScrollWidth: tabs.scrollWidth,
        tabClientWidth: tabs.clientWidth,
        questionColumns: getComputedStyle(questionIndex).gridTemplateColumns.split(' ').length,
        visibleTabs,
      };
    });

    expect(layout.pageWidth, `${viewport.width}px page overflow`).toBeLessThanOrEqual(layout.clientWidth + 1);
    expect(layout.pageHeight, `${viewport.width}px page length`).toBeLessThanOrEqual(viewport.maxPageHeight);
    expect(layout.coverHeight, `${viewport.width}px cover height`).toBeLessThanOrEqual(viewport.maxCoverHeight);
    expect(layout.tabScrollWidth, `${viewport.width}px dossier selector overflow`).toBeLessThanOrEqual(layout.tabClientWidth + 1);
    expect(layout.visibleTabs).toHaveLength(5);
    for (const tab of layout.visibleTabs) {
      expect(tab.height, `${viewport.width}px tab target height`).toBeGreaterThanOrEqual(44);
    }
    if (viewport.width <= 390) expect(layout.questionColumns).toBe(2);
  }
});

test('restrained palette, hidden email, and focus treatment remain legible', async ({ page }) => {
  captureRuntime(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const palette = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const sectionBackgrounds = [...document.querySelectorAll('.interview-question')]
      .map((node) => getComputedStyle(node).backgroundColor);
    return {
      paper: root.getPropertyValue('--paper').trim(),
      paperDeep: root.getPropertyValue('--paper-deep').trim(),
      surface: root.getPropertyValue('--surface').trim(),
      ink: root.getPropertyValue('--ink').trim(),
      signal: root.getPropertyValue('--signal').trim(),
      displayInk: getComputedStyle(document.querySelector('.cover h1')).color,
      displayCharcoal: getComputedStyle(document.querySelector('.cover h1 em')).color,
      answerCharcoal: getComputedStyle(document.querySelector('.answer-lede')).color,
      sectionBackgrounds: [...new Set(sectionBackgrounds)],
      beforeContent: getComputedStyle(document.querySelector('.cover-main'), '::before').content,
      afterContent: getComputedStyle(document.querySelector('.cover-main'), '::after').content,
    };
  });
  expect(palette).toEqual({
    paper: '#f3f3f0',
    paperDeep: '#e3e4e1',
    surface: '#fbfbf9',
    ink: '#15171a',
    signal: '#45494d',
    displayInk: 'rgb(21, 23, 26)',
    displayCharcoal: 'rgb(69, 73, 77)',
    answerCharcoal: 'rgb(69, 73, 77)',
    sectionBackgrounds: ['rgb(251, 251, 249)'],
    beforeContent: 'none',
    afterContent: 'none',
  });

  const glass = await page.evaluate(() => {
    const section = getComputedStyle(document.querySelector('.interview-question'));
    const cover = getComputedStyle(document.querySelector('.cover'));
    return {
      radius: parseFloat(section.borderRadius),
      sectionBackdrop: section.backdropFilter || section.webkitBackdropFilter,
      coverBackdrop: cover.backdropFilter || cover.webkitBackdropFilter,
    };
  });
  expect(glass.radius).toBeGreaterThanOrEqual(20);
  expect(glass.sectionBackdrop).toBe('none');
  expect(glass.coverBackdrop).toContain('blur');

  await expect(page.getByRole('link', { name: 'Email me ↗' })).toHaveCount(2);
  await expect(page.locator('body')).not.toContainText('josh0victor@outlook.com');

  const selected = page.getByRole('tab', { name: /Volyx Lens/ });
  await selected.focus();
  await expect(selected).toBeFocused();
  const focus = await selected.evaluate((node) => {
    const style = getComputedStyle(node);
    return { outline: style.outlineColor, shadow: style.boxShadow };
  });
  expect(focus.outline).toBe('rgb(255, 255, 255)');
  expect(focus.shadow).toContain('inset');
});

test('inline evidence links retain full touch targets', async ({ page }) => {
  captureRuntime(page);
  for (const viewport of [{ width: 320, height: 800 }, { width: 390, height: 844 }, { width: 1366, height: 768 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    for (const target of [
      page.locator('.candidate-card dd').getByRole('link', { name: 'Volyx Lens' }),
      page.locator('.method-context').getByRole('link', { name: 'Visit VolyxAI ↗' }),
    ]) {
      const box = await target.boundingBox();
      expect(box, `target missing at ${viewport.width}px`).not.toBeNull();
      expect(box.height, `target too short at ${viewport.width}px`).toBeGreaterThanOrEqual(44);
    }
  }
});

test('secondary typography stays readable on phone and desktop', async ({ page }) => {
  captureRuntime(page);
  const groups = [
    {
      minimum: 13,
      selectors: [
        '.candidate-card dd', '.question-index strong', '.proof-note p',
        '.capability-lines strong', '.project-facts dd', '.project-description',
        '.verified-result', '.merge-row strong', '.merge-row b', '.method-list p',
        '.profile-grid p',
      ],
    },
    {
      minimum: 12,
      selectors: [
        '.identity small', '.identity-seal', '.cover-status', '.eyebrow', '.button',
        '.candidate-card-head', '.candidate-card dt', '.question-index > p', '.question-index span',
        '.question-margin span', '.question-margin p', '.proof-note > span', '.capability-lines span', '.speaker',
        '.dossier-tabs button', '.dossier-tabs button span', '.project-sheet-head', '.project-facts dt',
        '.project-links a', '.project-stack', '.merge-row span', '.merge-row em',
        '.method-list em', '.footer',
      ],
    },
  ];

  for (const viewport of [{ width: 390, height: 844 }, { width: 1366, height: 768 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    for (const group of groups) {
      for (const selector of group.selectors) {
        const size = await page.locator(selector).first().evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
        expect(size, `${selector} at ${viewport.width}px`).toBeGreaterThanOrEqual(group.minimum);
      }
    }
  }
});

test('glass fallbacks and focus indicators survive constrained rendering modes', async ({ page }) => {
  captureRuntime(page);
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setEmulatedMedia', {
    media: 'screen',
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const fallback = await page.evaluate(() => {
    const selectors = [
      '.masthead', '.cover', '.cover-main', '.interview-question', '.proof-note',
      '.dossier-tabs', '.project-sheet', '.profile-grid > div', '.candidate-card',
      '.candidate-card > a', '.closing', '.primary-nav',
    ];
    return selectors.map((selector) => {
      const style = getComputedStyle(document.querySelector(selector));
      return { selector, background: style.backgroundColor, backdrop: style.backdropFilter || style.webkitBackdropFilter };
    });
  });
  for (const surface of fallback) {
    expect(surface.backdrop, `${surface.selector} still blurs`).toBe('none');
    expect(surface.background, `${surface.selector} is not opaque`).toMatch(/^rgb\(/);
  }

  await session.send('Emulation.setEmulatedMedia', { media: 'screen', features: [] });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.reload();
  for (const target of [
    page.getByRole('link', { name: 'Joshua Nwachinemere' }),
    page.getByRole('link', { name: 'Contact' }),
    page.locator('.candidate-card').getByRole('link', { name: 'Email me ↗' }),
    page.locator('.question-index').getByRole('link').first(),
    page.getByRole('tab', { name: /Volyx Lens/ }),
    page.locator('.project-links').getByRole('link').first(),
    page.locator('.closing-actions').getByRole('link').first(),
  ]) {
    await target.focus();
    const focusStyle = await target.evaluate((node) => {
      const style = getComputedStyle(node);
      return { outlineWidth: parseFloat(style.outlineWidth), outlineOffset: parseFloat(style.outlineOffset), shadow: style.boxShadow };
    });
    expect(focusStyle.outlineWidth).toBeGreaterThanOrEqual(3);
    expect(focusStyle.outlineOffset).toBeLessThan(0);
    expect(focusStyle.shadow).not.toBe('none');
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  for (const inlineLink of [
    page.locator('.candidate-card dd a'),
    page.locator('.footer a'),
  ]) {
    await inlineLink.focus();
    const inlineFocus = await inlineLink.evaluate((node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return {
        height: rect.height,
        outlineWidth: parseFloat(style.outlineWidth),
        outlineOffset: parseFloat(style.outlineOffset),
        shadow: style.boxShadow,
      };
    });
    expect(inlineFocus.height).toBeGreaterThanOrEqual(24);
    expect(inlineFocus.outlineWidth).toBeGreaterThanOrEqual(2);
    expect(inlineFocus.outlineOffset).toBeGreaterThanOrEqual(2);
    expect(inlineFocus.shadow).not.toContain('inset');
  }

  await page.emulateMedia({ forcedColors: 'active' });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.reload();
  const forcedFocus = page.getByRole('link', { name: 'Contact' });
  await forcedFocus.focus();
  await expect(forcedFocus).toBeFocused();
  expect(await forcedFocus.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe('none');
});

test('glass layout remains stable around both responsive boundaries', async ({ page }) => {
  captureRuntime(page);
  const samples = new Map();
  for (const width of [759, 760, 761, 899, 900, 901]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const geometry = await page.evaluate(() => ({
      page: [document.documentElement.scrollWidth, document.documentElement.clientWidth],
      tabs: [document.querySelector('.dossier-tabs').scrollWidth, document.querySelector('.dossier-tabs').clientWidth],
      work: document.querySelector('#work .question-copy').getBoundingClientRect().width,
    }));
    samples.set(width, geometry);
    expect(geometry.page[0], `${width}px page overflow`).toBeLessThanOrEqual(geometry.page[1] + 1);
    expect(geometry.tabs[0], `${width}px tab overflow`).toBeLessThanOrEqual(geometry.tabs[1] + 1);
  }
  for (const [left, right] of [[760, 761], [900, 901]]) {
    const before = samples.get(left);
    const after = samples.get(right);
    expect(after.work / before.work, `${left}/${right}px work-column cliff`).toBeGreaterThanOrEqual(.85);
    expect(after.tabs[1] / before.tabs[1], `${left}/${right}px tablist cliff`).toBeGreaterThanOrEqual(.85);
  }
});

test('short-laptop first screen contains role, named proof, and primary actions', async ({ page }) => {
  captureRuntime(page);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  for (const locator of [
    page.getByRole('heading', { level: 1 }),
    page.getByText('AI Engineer', { exact: true }).first(),
    page.getByText('Volyx Lens', { exact: true }).first(),
    page.getByRole('link', { name: 'Open the evidence' }),
    page.getByRole('link', { name: 'Read the CV' }),
  ]) {
    await expect(locator).toBeVisible();
    const box = await locator.boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(768);
  }
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
