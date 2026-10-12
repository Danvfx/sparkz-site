// Exports the static advocacy poster (PNG + printable PDF) using the site's own poster maker.
// Needs the dev server running (npm run dev) and Playwright with a Chromium build.
import { chromium } from '../../node_modules/playwright/index.mjs';
import { writeFileSync } from 'node:fs';

const url = process.argv[2] || 'http://localhost:5174/?static=1';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(url);
await page.waitForSelector('#pledge-make');
await page.selectOption('#pledge-drink', 'sala|mango');
await page.click('#pledge-make');
await page.waitForFunction(() => document.getElementById('pledge-dl').href.startsWith('data:image/png'));
const data = await page.evaluate(() => document.getElementById('pledge-canvas').toDataURL('image/png'));
const png = Buffer.from(data.split(',')[1], 'base64');
writeFileSync('public/img/advocacy-poster.png', png);
const pdfPage = await browser.newPage();
await pdfPage.setContent(`<style>@page{size:A4;margin:0}body{margin:0}img{width:210mm;height:297mm;object-fit:contain;display:block}</style><img src="${data}">`);
writeFileSync('public/img/advocacy-poster.pdf', await pdfPage.pdf({ format: 'A4', printBackground: true }));
await browser.close();
console.log('poster exported', png.length);
