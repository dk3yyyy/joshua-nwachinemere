// Ad-hoc audit sweep: overflow, console errors, axe, dark mode, no-JS.
// Usage: node scripts/audit-sweep.mjs http://localhost:4173/
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const url = process.argv[2] || 'http://localhost:4173/';
const widths = [320, 360, 390, 414, 600, 767, 768, 900, 901, 1024, 1050, 1051, 1180, 1280, 1440, 1920];

const browser = await chromium.launch();
const results = { overflow: [], console: [], axe: {}, noJs: null, dark: {} };

// --- overflow + console across widths
for (const width of widths) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(250);
  const m = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    iw: window.innerWidth,
    bodyOverflow: getComputedStyle(document.body).overflowX,
  }));
  if (m.sw > m.iw + 1) results.overflow.push({ width, scrollWidth: m.sw, innerWidth: m.iw });
  if (errors.length) results.console.push({ width, errors });
  await ctx.close();
}

// --- axe at 3 sizes, light + dark
for (const [label, width] of [['desktop', 1440], ['tablet', 820], ['mobile', 390]]) {
  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(300);
    const res = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    results.axe[`${label}-${scheme}`] = res.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.length,
      targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
      help: v.help,
    }));
    if (scheme === 'dark') {
      results.dark[label] = await page.evaluate(() => {
        const cs = getComputedStyle(document.body);
        return { bg: cs.backgroundColor, color: cs.color };
      });
    }
    await ctx.close();
  }
}

// --- no-JS
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' });
  results.noJs = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const style = h1 ? getComputedStyle(h1) : null;
    const sections = [...document.querySelectorAll('main section')].map((s) => ({
      id: s.id,
      visible: !!(s.offsetHeight && getComputedStyle(s).opacity !== '0' && getComputedStyle(s).visibility !== 'hidden'),
    }));
    return {
      h1Text: h1?.textContent?.trim(),
      h1Visible: style ? style.opacity !== '0' && style.visibility !== 'hidden' : false,
      bodyHeight: document.body.scrollHeight,
      sections,
    };
  });
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
