// Smoke test across modes: console errors, horizontal overflow, nav landing, 3D presence. Needs the dev server.
import { chromium } from '../../node_modules/playwright/index.mjs';
const base = process.argv[2] || 'http://localhost:5174/';
const cases = [
  ['desktop A', '', { width: 1280, height: 800 }],
  ['desktop lite', '?lite=1', { width: 1280, height: 800 }],
  ['static C', '?static=1', { width: 1280, height: 800 }],
  ['embed 1280x600', '?embed=1', { width: 1280, height: 600 }],
  ['mobile 375', '', { width: 375, height: 740 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
];
const ids = ['home', 'about', 'product', 'sdg', 'message', 'pitch', 'order', 'feedback', 'sources'];
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [name, q, vp, ctx = {}] of cases) {
  const page = await (await browser.newContext({ viewport: vp, ...ctx })).newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto(base + q); await page.waitForTimeout(4500);
  const info = await page.evaluate(() => ({ tier: document.documentElement.className, gl: document.documentElement.classList.contains('gl'), over: document.documentElement.scrollWidth - innerWidth }));
  const bad = [];
  for (const id of ids) {
    await page.evaluate((id) => { const a = document.querySelector(`a[href="#${id}"]`); a.click(); }, id);
    await page.waitForTimeout(id === 'home' ? 1800 : 2200);
    const d = await page.evaluate((id) => Math.round(document.getElementById(id).getBoundingClientRect().top), id);
    if (Math.abs(d) > 130) bad.push(`${id}:${d}`);
  }
  console.log(name, JSON.stringify(info), 'navMiss=', bad.join(',') || 'none', 'errors=', errs.length ? errs.slice(0, 4) : 'none');
  await page.close();
}
await browser.close();
