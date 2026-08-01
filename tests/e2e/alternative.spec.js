import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const projects = [
  'Volyx Lens',
  'Local Review Intelligence',
  'Football Forecasting Lab',
  'Telegram Social Video Downloader',
  'ChainScope Wallet Analyzer',
];

const viewports = [
  { width: 320, height: 800, maxPageHeight: 8300, maxHeroHeight: 900 },
  { width: 390, height: 844, maxPageHeight: 7400, maxHeroHeight: 820 },
  { width: 768, height: 1024, maxPageHeight: 7150, maxHeroHeight: 760 },
  { width: 1024, height: 768 },
  { width: 1366, height: 768, maxPageHeight: 6700, maxHeroHeight: 720 },
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

async function expectNoOverflow(page, label) {
  const geometry = await page.evaluate(() => ({
    page: [document.documentElement.scrollWidth, document.documentElement.clientWidth],
    containers: [...document.querySelectorAll('.primary-nav, .project-card, .contribution-list')].map((node) => ({
      className: node.className,
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
    })),
  }));
  expect(geometry.page[0], `${label} page overflow`).toBeLessThanOrEqual(geometry.page[1] + 1);
  for (const item of geometry.containers) {
    expect(item.scrollWidth, `${label} ${item.className} overflow`).toBeLessThanOrEqual(item.clientWidth + 1);
  }
}

async function expectTouchTargets(page, label) {
  const targets = await page.locator('a:visible, button:visible').evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return { label: node.textContent.trim().replace(/\s+/g, ' '), width: rect.width, height: rect.height };
  }));
  expect(targets.length).toBeGreaterThan(20);
  for (const target of targets) {
    expect(target.width, `${label}: ${target.label} width`).toBeGreaterThanOrEqual(44);
    expect(target.height, `${label}: ${target.label} height`).toBeGreaterThanOrEqual(44);
  }
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
  const focused = [];
  for (let index = 0; index < focusableCount + 2; index += 1) {
    await page.keyboard.press('Tab');
    const item = await page.evaluate(() => {
      const node = document.activeElement;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        tag: node.tagName,
        label: (node.textContent || node.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' '),
        width: rect.width,
        height: rect.height,
        outlineStyle: style.outlineStyle,
        outlineWidth: parseFloat(style.outlineWidth),
      };
    });
    if (!['A', 'BUTTON'].includes(item.tag)) continue;
    focused.push(item);
    expect(item.width, `${label}: focused ${item.label} width`).toBeGreaterThanOrEqual(44);
    expect(item.height, `${label}: focused ${item.label} height`).toBeGreaterThanOrEqual(44);
    expect(item.outlineStyle, `${label}: focused ${item.label} outline`).not.toBe('none');
    expect(item.outlineWidth, `${label}: focused ${item.label} outline width`).toBeGreaterThanOrEqual(2);
  }
  expect(focused.length, `${label}: keyboard-reached visible targets`).toBeGreaterThanOrEqual(focusableCount);
}

test('professional portfolio is complete, accessible, private, and runtime-clean', async ({ page }) => {
  const errors = monitorRuntime(page);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('AI Engineer building reliable Python systems for Applied AI.');
  await expect(page.locator('.hero-system-map')).toBeVisible();
  await expect(page.locator('[data-project-name]')).toHaveCount(5);
  for (const project of projects) await expect(page.getByRole('heading', { name: project, exact: true })).toBeVisible();
  await expect(page.locator('.project-card--primary')).toHaveCount(3);
  await expect(page.locator('.project-card--compact')).toHaveCount(2);
  await expect(page.locator('.project-visual img')).toHaveCount(3);
  await expect(page.locator('.visual-link')).toHaveCount(0);
  const lensImageRatio = await page.locator('.project-visual--lens img').evaluate((image) => {
    const rect = image.getBoundingClientRect();
    return {
      rendered: rect.width / rect.height,
      intrinsic: image.naturalWidth / image.naturalHeight,
    };
  });
  expect(Math.abs(lensImageRatio.rendered - lensImageRatio.intrinsic)).toBeLessThan(0.01);
  const dashboardImageRatio = await page.locator('#project-local-ai .project-visual--dashboard img').evaluate((image) => {
    const rect = image.getBoundingClientRect();
    return {
      rendered: rect.width / rect.height,
      intrinsic: image.naturalWidth / image.naturalHeight,
    };
  });
  expect(Math.abs(dashboardImageRatio.rendered - dashboardImageRatio.intrinsic)).toBeLessThan(0.01);
  const footballImageRatio = await page.locator('.project-visual--football img').evaluate((image) => {
    const rect = image.getBoundingClientRect();
    return {
      rendered: rect.width / rect.height,
      intrinsic: image.naturalWidth / image.naturalHeight,
    };
  });
  expect(Math.abs(footballImageRatio.rendered - footballImageRatio.intrinsic)).toBeLessThan(0.01);
  await expect(page.locator('.contribution-row')).toHaveCount(8);
  await expect(page.locator('.contribution-row:visible')).toHaveCount(8);
  await expect(page.locator('[role="tab"], [role="tabpanel"], .reading-progress')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('joshua0nwachinemere@gmail.com');
  await expect(page.locator('body')).not.toContainText('josh0victor@outlook.com');
  await expect(page.getByRole('link', { name: 'Email me', exact: true })).toHaveAttribute(
    'href',
    'mailto:joshua0nwachinemere@gmail.com?subject=AI%20Engineer%20opportunity',
  );

  const palette = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const hero = getComputedStyle(document.querySelector('.hero'));
    const contact = getComputedStyle(document.querySelector('.closing'));
    const accent = getComputedStyle(document.querySelector('.hero h1 em'));
    return {
      paper: root.getPropertyValue('--paper').trim(),
      surface: root.getPropertyValue('--surface').trim(),
      ink: root.getPropertyValue('--ink').trim(),
      muted: root.getPropertyValue('--muted').trim(),
      signal: root.getPropertyValue('--signal').trim(),
      heroBackground: hero.backgroundColor,
      contactBackground: contact.backgroundColor,
      accentFamily: accent.fontFamily,
    };
  });
  expect(palette).toMatchObject({
    paper: '#f3f3f0', surface: '#fbfbf9', ink: '#15171a', muted: '#565b60', signal: '#45494d',
    heroBackground: 'rgba(0, 0, 0, 0)', contactBackground: 'rgb(21, 23, 26)',
  });
  expect(palette.accentFamily).toContain('Newsreader');

  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations).toEqual([]);
  expect(errors).toEqual([]);
});

test('responsive composition meets page, hero, grid, overflow, and target budgets', async ({ page }, testInfo) => {
  const errors = monitorRuntime(page);
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    const layout = await page.evaluate(() => ({
      pageHeight: document.documentElement.scrollHeight,
      heroHeight: document.querySelector('.hero').getBoundingClientRect().height,
      additionalColumns: getComputedStyle(document.querySelector('.additional-project-grid')).gridTemplateColumns.split(' ').length,
      contributionColumns: getComputedStyle(document.querySelector('.contribution-list')).gridTemplateColumns.split(' ').length,
      credentialColumns: getComputedStyle(document.querySelector('.credential-links')).gridTemplateColumns.split(' ').length,
      systemMapDisplay: getComputedStyle(document.querySelector('.hero-system-map')).display,
    }));
    if (viewport.maxPageHeight) expect(layout.pageHeight, `${viewport.width}px page height`).toBeLessThanOrEqual(viewport.maxPageHeight);
    if (viewport.maxHeroHeight) expect(layout.heroHeight, `${viewport.width}px hero height`).toBeLessThanOrEqual(viewport.maxHeroHeight);
    if (viewport.width < 680) expect(layout.additionalColumns).toBe(1);
    if (viewport.width >= 768 && viewport.width <= 1024) expect(layout.additionalColumns).toBe(2);
    if (viewport.width === 1366) expect(layout.additionalColumns).toBe(2);
    expect(layout.systemMapDisplay, `${viewport.width}px desktop-only system map`).toBe(viewport.width > 1050 ? 'block' : 'none');
    expect(layout.contributionColumns).toBe(viewport.width >= 768 ? 2 : 1);
    expect(layout.credentialColumns).toBe(viewport.width < 768 ? 1 : 3);
    await expectNoOverflow(page, `${viewport.width}px`);
    await expectTouchTargets(page, `${viewport.width}px`);
    await testInfo.attach(`portfolio-${viewport.width}`, { body: await page.screenshot(), contentType: 'image/png' });
  }
  expect(errors).toEqual([]);
});

test('phone spacing preserves approved gutters, card padding, rhythm, and readable background flow', async ({ page }) => {
  for (const viewport of viewports.filter(({ width }) => width <= 390)) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const spacing = await page.evaluate(() => {
      const hero = document.querySelector('.hero').getBoundingClientRect();
      const primary = getComputedStyle(document.querySelector('.project-card--primary'));
      const compact = getComputedStyle(document.querySelector('.project-card--compact'));
      const section = getComputedStyle(document.querySelector('.section'));
      const background = getComputedStyle(document.querySelector('.background-list'));
      return {
        gutterLeft: hero.left,
        gutterRight: innerWidth - hero.right,
        primaryPadding: parseFloat(primary.paddingLeft),
        compactPadding: parseFloat(compact.paddingLeft),
        sectionPaddingTop: parseFloat(section.paddingTop),
        sectionPaddingBottom: parseFloat(section.paddingBottom),
        backgroundColumns: background.gridTemplateColumns.split(' ').length,
      };
    });
    expect(spacing.gutterLeft, `${viewport.width}px left gutter`).toBeGreaterThanOrEqual(16);
    expect(spacing.gutterRight, `${viewport.width}px right gutter`).toBeGreaterThanOrEqual(16);
    expect(spacing.primaryPadding, `${viewport.width}px primary padding`).toBeGreaterThanOrEqual(20);
    expect(spacing.compactPadding, `${viewport.width}px compact padding`).toBeGreaterThanOrEqual(20);
    expect(spacing.sectionPaddingTop, `${viewport.width}px section top rhythm`).toBeGreaterThanOrEqual(40);
    expect(spacing.sectionPaddingBottom, `${viewport.width}px section bottom rhythm`).toBeGreaterThanOrEqual(40);
    expect(spacing.backgroundColumns, `${viewport.width}px background columns`).toBe(1);
  }
});

test('approved typography and responsive spacing tokens hold at every required width', async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const tokens = await page.evaluate(() => {
      const number = (selector, property) => parseFloat(getComputedStyle(document.querySelector(selector))[property]);
      const supportSizes = [...document.querySelectorAll('.hero-proof, .availability, .ownership-note, .contact-availability')]
        .map((node) => parseFloat(getComputedStyle(node).fontSize));
      const compactMetaGaps = [...document.querySelectorAll('.project-card--compact')].map((card) => {
        const meta = card.querySelector('.project-meta').getBoundingClientRect();
        const body = card.querySelector('.project-meta + p').getBoundingClientRect();
        return body.top - meta.bottom;
      });
      return {
        supportSizes,
        actionSize: number('.project-links a', 'fontSize'),
        compactTitleSize: number('.project-card--compact h3', 'fontSize'),
        primaryPadding: number('.project-card--primary', 'paddingLeft'),
        compactPadding: number('.project-card--compact', 'paddingLeft'),
        sectionPadding: number('.section', 'paddingTop'),
        primaryMetadataGap: number('.project-header', 'marginBottom'),
        compactMetaGaps,
        actionGap: number('.project-links', 'columnGap'),
        availabilityColor: getComputedStyle(document.querySelector('.availability')).color,
        primaryInkColor: getComputedStyle(document.querySelector('.hero h1')).color,
        availabilityWeight: Number(getComputedStyle(document.querySelector('.availability')).fontWeight),
      };
    });
    expect(Math.min(...tokens.supportSizes), `${viewport.width}px supporting-copy floor`).toBeGreaterThanOrEqual(16);
    expect(tokens.actionSize, `${viewport.width}px action-label size`).toBeGreaterThanOrEqual(13);
    expect(tokens.compactTitleSize, `${viewport.width}px compact title size`).toBeGreaterThanOrEqual(viewport.width < 768 ? 24 : 26);
    expect(tokens.primaryMetadataGap, `${viewport.width}px primary metadata gap`).toBeGreaterThanOrEqual(16);
    expect(Math.min(...tokens.compactMetaGaps), `${viewport.width}px compact metadata gap`).toBeGreaterThanOrEqual(16);
    expect(tokens.actionGap, `${viewport.width}px action grouping`).toBeGreaterThanOrEqual(8);
    expect(tokens.availabilityColor, `${viewport.width}px availability ink`).toBe(tokens.primaryInkColor);
    expect(tokens.availabilityWeight, `${viewport.width}px availability weight`).toBeGreaterThanOrEqual(500);
    const expected = viewport.width < 768
      ? { primary: 20, compact: 20, section: 40 }
      : viewport.width <= 900
        ? { primary: 24, compact: 24, section: 52 }
        : { primary: 32, compact: 24, section: 72 };
    expect(tokens.primaryPadding, `${viewport.width}px primary card token`).toBeGreaterThanOrEqual(expected.primary);
    expect(tokens.compactPadding, `${viewport.width}px compact card token`).toBeGreaterThanOrEqual(expected.compact);
    expect(tokens.sectionPadding, `${viewport.width}px section token`).toBeGreaterThanOrEqual(expected.section);
  }
});

test('accessibility and keyboard focus are verified at every required width', async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations, `${viewport.width}px Axe violations`).toEqual([]);
    await expectKeyboardFocusVisibility(page, `${viewport.width}px`);
  }
});

test('short desktop first fold contains the hiring essentials and selected-work start', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  const essentials = [
    page.getByRole('heading', { level: 1 }),
    page.locator('.hero-intro'),
    page.locator('.availability'),
    page.getByRole('link', { name: 'View selected work' }),
    page.getByRole('link', { name: 'Download CV' }).first(),
    page.getByRole('heading', { name: 'Selected AI engineering work' }),
  ];
  for (const locator of essentials) {
    await expect(locator).toBeVisible();
    const box = await locator.boundingBox();
    expect(box.y, await locator.textContent()).toBeLessThan(768);
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
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Work' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeFocused();

  await page.keyboard.press('Enter');
  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Work' }).click();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  const clearance = await page.evaluate(() => {
    const header = document.querySelector('.masthead').getBoundingClientRect();
    const section = document.querySelector('#work').getBoundingClientRect();
    return section.top - header.bottom;
  });
  expect(clearance).toBeGreaterThanOrEqual(8);
});

test('all content and navigation remain available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
  await expect(page.locator('.menu-button')).toBeHidden();
  await expect(page.locator('.project-card:visible')).toHaveCount(5);
  await expect(page.locator('.contribution-row:visible')).toHaveCount(8);
  await expect(page.getByText(/Evaluated across 1,140 rolling-origin test matches with 53\.77% accuracy/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Email me' })).toBeVisible();
  await expect(page.locator('[role="tab"], [role="tabpanel"]')).toHaveCount(0);
  await expectNoOverflow(page, 'no-JS mobile');
  await context.close();
});

test('reduced motion, reduced transparency, no-backdrop-filter, and forced colours remain usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const motion = await page.locator('.project-card').first().evaluate((node) => {
    const style = getComputedStyle(node);
    return { animation: style.animationName, transition: style.transitionDuration, transform: style.transform };
  });
  expect(motion.animation).toBe('none');
  expect(parseFloat(motion.transition)).toBeLessThanOrEqual(.01);
  expect(motion.transform).toBe('none');
  await expect(page.locator('.project-card:visible')).toHaveCount(5);

  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setEmulatedMedia', { media: 'screen', features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
  await page.reload();
  for (const selector of ['.masthead', '.project-card', '.closing']) {
    const style = await page.locator(selector).first().evaluate((node) => {
      const value = getComputedStyle(node);
      return { background: value.backgroundColor, backdrop: value.backdropFilter || value.webkitBackdropFilter };
    });
    expect(style.background).toMatch(/^rgb\(/);
    expect(style.backdrop).toBe('none');
  }
  await session.send('Emulation.setEmulatedMedia', { media: 'screen', features: [] });
  await page.emulateMedia({ forcedColors: 'active' });
  await page.reload();
  const menu = page.locator('.menu-button');
  const contact = page.getByRole('link', { name: 'Contact' });
  if (await menu.isVisible()) {
    await menu.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    for (let index = 0; index < 6; index += 1) await page.keyboard.press('Tab');
    await expect(contact).toBeFocused();
  } else {
    await contact.focus();
  }
  expect(await contact.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe('none');
  expect(await page.locator('.project-card').first().evaluate((node) => getComputedStyle(node).borderStyle)).not.toBe('none');
});

test('320px WCAG text spacing retains every content group without clipping', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await page.addStyleTag({ content: `
    * { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }
    p, li, dd { margin-bottom: 2em !important; }
  ` });
  await expectNoOverflow(page, '320px text spacing');
  await expect(page.locator('.project-card:visible')).toHaveCount(5);
  await expect(page.locator('.contribution-row:visible')).toHaveCount(8);
  await expect(page.getByRole('heading', { name: 'Interested in working together?' })).toBeVisible();
});
