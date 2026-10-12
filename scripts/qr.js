// Build-time QR codes (SVG) for the cup stickers. SITE_URL comes from src/config.js (or the SITE_URL env var).
import QRCode from 'qrcode';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const { CONFIG } = await import(pathToFileURL(resolve('src/config.js')).href);
const site = process.env.SITE_URL || CONFIG.SITE_URL || 'https://example.invalid/'; // TODO: set SITE_URL after the first deploy
const opts = { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1a1240', light: '#ffffff' } };
mkdirSync('public/qr', { recursive: true });
writeFileSync('public/qr/site.svg', await QRCode.toString(`${site}${site.includes('?') ? '&' : '?'}src=cup#builder`, opts));
const form = CONFIG.ORDER_FORM.VIEW_URL || `${site}#order`;
writeFileSync('public/qr/preorder.svg', await QRCode.toString(form, opts));
console.log('QR codes written for', site);
