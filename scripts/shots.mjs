import { chromium } from '../../node_modules/playwright/index.mjs';
const [,, q = '', w = '375', h = '740', mobile = '1', ...ids] = process.argv;
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, ...(mobile === '1' ? { isMobile: true, hasTouch: true, deviceScaleFactor: 1 } : {}) });
const page = await ctx.newPage();
await page.goto('http://localhost:5174/' + q); await page.waitForTimeout(4500);
for (const id of ids) {
  const [sel, off = '0'] = id.split('@');
  await page.evaluate(([s, o]) => { const el = document.querySelector(s); window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + +o, behavior: 'instant' }); }, [sel, off]);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `_shots/${w}-${sel.replace(/\W/g, '')}-${off}.png` });
}
await browser.close();
