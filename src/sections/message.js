// Our Message: the pledge poster generator. Our Pitch: the deck.
import { app, siteUrl, drinkLink, getBase, getTop, labelFor, goTo } from '../app.js';
import { CONFIG } from '../config.js';
import { BASES, TOPS, comboName } from '../data/menu.js';
import { embed, params } from '../utils/env.js';
import { shareLink } from '../utils/share.js';

const W = 1080, H = 1920;
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
const img = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

async function drawPoster(canvas, baseId, topId) {
  const b = getBase(baseId), t = getTop(topId), c = canvas.getContext('2d');
  await document.fonts.load("700 80px 'Fredoka Variable'"); await document.fonts.load("600 40px 'Figtree Variable'");
  const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#fff3d6'); bg.addColorStop(1, '#ffd9a0'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
  // soft splashes in the drink colors
  for (const [col, x, y, r] of [[b.hex, 120, 260, 360], [t.hex, 980, 520, 320], [b.hex, 900, 1500, 300]]) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col + 'aa'); g.addColorStop(1, col + '00'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  const cx = W / 2, top = 520, bot = 1360, rt = 270, rb = 190;
  c.save(); c.translate(cx + 110, top - 130); c.rotate(0.14); rr(c, -22, 0, 44, 440, 22); c.fillStyle = '#d6ad74'; c.fill(); c.restore();
  c.textAlign = 'center';
  const stroked = (txt, x, y, size, fill = '#fff', stroke = '#1d7a2c') => { c.font = `700 ${size}px 'Fredoka Variable', sans-serif`; c.lineJoin = 'round'; c.lineWidth = size * 0.16; c.strokeStyle = stroke; c.strokeText(txt, x, y); c.fillStyle = fill; c.fillText(txt, x, y); };
  stroked('I bring back', W / 2, 240, 150); stroked('my cup.', W / 2, 400, 150);
  // cup
  const g = c.createLinearGradient(0, top, 0, bot); g.addColorStop(0, t.hex); g.addColorStop(0.45, t.hex); g.addColorStop(0.7, b.hex); g.addColorStop(1, b.hex);
  const layering = comboName(baseId, topId) && 'base';
  if (layering === 'top') { g.addColorStop(0, b.hex); }
  c.save(); c.beginPath(); c.moveTo(cx - rt, top); c.lineTo(cx + rt, top); c.lineTo(cx + rb, bot - 30); c.quadraticCurveTo(cx + rb, bot, cx + rb - 30, bot); c.lineTo(cx - rb + 30, bot); c.quadraticCurveTo(cx - rb, bot, cx - rb, bot - 30); c.closePath();
  c.fillStyle = g; c.globalAlpha = 0.92; c.fill(); c.globalAlpha = 1; c.lineWidth = 10; c.strokeStyle = 'rgba(255,255,255,.85)'; c.stroke(); c.restore();
  c.save(); c.translate(cx + 110, top - 130); c.rotate(0.14); c.beginPath(); c.rect(-40, 130, 80, 400); c.clip(); rr(c, -22, 0, 44, 440, 22); c.fillStyle = 'rgba(214,173,116,.85)'; c.fill(); c.restore();
  const logo = await img('./img/logo-sticker.png');
  if (logo) { const lw = 360, lh = lw * logo.height / logo.width; c.drawImage(logo, cx - lw / 2, 800, lw, lh); }
  c.fillStyle = '#1a1240'; c.font = `700 64px 'Fredoka Variable', sans-serif`; c.fillText(comboName(baseId, topId), cx, 1500);
  c.font = `600 40px 'Figtree Variable', sans-serif`; c.fillText(`${b.name} + ${t.name}`, cx, 1556);
  c.fillStyle = '#1d7a2c'; c.font = `700 84px 'Fredoka Variable', sans-serif`; c.fillText(CONFIG.HASHTAG, cx, 1680);
  c.fillStyle = '#1a1240'; c.font = `600 34px 'Figtree Variable', sans-serif`; c.fillText('SDG 12: Responsible Consumption and Production', cx, 1750);
  const qr = await img('./qr/site.svg');
  if (qr) { rr(c, 80, 1760, 120, 120, 14); c.fillStyle = '#fff'; c.fill(); c.drawImage(qr, 88, 1768, 104, 104); }
  c.textAlign = 'left'; c.font = `600 30px 'Figtree Variable', sans-serif`; c.fillStyle = '#1a1240'; c.fillText('Scan to build yours', 220, 1830);
  c.textAlign = 'right'; c.font = `700 56px 'Fredoka Variable', sans-serif`; c.fillStyle = '#d6720a'; c.fillText('Sparkz', W - 80, 1840);
}

export function initMessage(builder) {
  const sel = document.getElementById('pledge-drink');
  const opts = [];
  for (const b of BASES) for (const t of TOPS) opts.push(`<option value="${b.id}|${t.id}">${labelFor(b.id, t.id)}</option>`);
  sel.innerHTML = opts.join('');
  const sync = () => { sel.value = `${app.drink.base}|${app.drink.top}`; };
  sync(); document.addEventListener('sparkz:drink', sync);

  const out = document.getElementById('pledge-out'), canvas = document.getElementById('pledge-canvas'), dl = document.getElementById('pledge-dl');
  const status = document.getElementById('share-status');

  async function make() {
    const [bs, ts] = sel.value.split('|');
    if (embed) { // downloads and sharing can be blocked in a frame: open the full site with the generator
      const u = new URL(CONFIG.SITE_URL || (location.origin + location.pathname)); u.searchParams.set('embed', '0'); u.searchParams.set('pledge', '1'); u.searchParams.set('base', bs); u.searchParams.set('top', ts); u.hash = 'message';
      window.open(u.toString(), '_blank', 'noopener,noreferrer'); return;
    }
    out.hidden = false;
    await drawPoster(canvas, bs, ts);
    try { dl.href = canvas.toDataURL('image/png'); } catch { /* tainted canvas: leave the link */ }
    out.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  document.getElementById('pledge-make').addEventListener('click', make);
  document.getElementById('take-pledge').addEventListener('click', (e) => { e.preventDefault(); goTo('pledge', -72); });
  document.querySelectorAll('[data-pledge-link]').forEach((a) => a.addEventListener('click', () => { sync(); }));
  document.getElementById('pledge-share').addEventListener('click', async () => {
    try {
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
      const file = new File([blob], 'sparkz-pledge.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'I bring back my cup', text: `${CONFIG.HASHTAG}` }); return; }
    } catch (e) { if (e?.name === 'AbortError') return; }
    document.getElementById('pledge-hint').textContent = 'Sharing files is not available here. Use Download, or press and hold the image to save it.';
  });
  document.getElementById('share-msg').addEventListener('click', async () => {
    const res = await shareLink({ title: 'Every cup comes back', text: `A Sparkz lasts one break. The cup lasts a lot longer. ${CONFIG.HASHTAG}`, url: siteUrl() });
    status.textContent = res === 'copied' ? 'Link copied.' : res === 'shared' ? 'Shared.' : res === 'manual' ? `Copy this link: ${siteUrl()}` : '';
  });

  // ?pledge=1 opens the generator right away (used when the embed hands off to the full site)
  if (params.get('pledge') === '1') {
    const bs = params.get('base'), ts = params.get('top');
    if (bs && ts && getBase(bs) && getTop(ts)) sel.value = `${bs}|${ts}`;
    setTimeout(() => { goTo('pledge', -72); make(); }, 900);
  }
  optionalPledgeCount();
}

// Optional: real pledge count from a published Google Sheet CSV. Hidden unless it reads reliably. Never a made-up number.
async function optionalPledgeCount() {
  if (!CONFIG.PLEDGE_COUNT_CSV) return;
  try {
    const r = await fetch(CONFIG.PLEDGE_COUNT_CSV); if (!r.ok) return;
    const rows = (await r.text()).trim().split(/\r?\n/).length - 1;
    if (rows > 0) { const el = document.getElementById('pledge-count'); el.textContent = `${rows} people have taken the pledge.`; el.hidden = false; }
  } catch { /* leave it hidden */ }
}

// ---------- Our Pitch ----------
export function initPitch() {
  const host = document.getElementById('pitch-embed'), P = CONFIG.PITCH;
  if (P.DRIVE_PREVIEW_URL) {
    host.innerHTML = `<iframe src="${P.DRIVE_PREVIEW_URL}" title="Sparkz pitch deck" loading="lazy" allow="fullscreen"></iframe>
      <p class="caption">The pitch deck behind this site. ${P.OPEN_URL ? `<a class="textlink" href="${P.OPEN_URL}" target="_blank" rel="noopener noreferrer">Open it in a new tab</a>` : ''}</p>`;
    return;
  }
  if (P.SLIDES.length) {
    let i = 0; host.innerHTML = `<div class="slides" tabindex="0" aria-label="Pitch slides, use the arrow keys"><img alt="" id="slide-img"></div><div class="slide-nav"><button type="button" class="btn btn-ghost" id="s-prev">Previous</button><span id="s-count"></span><button type="button" class="btn btn-ghost" id="s-next">Next</button></div><p class="caption">The pitch deck behind this site, slide by slide.</p>`;
    const show = (n) => { i = (n + P.SLIDES.length) % P.SLIDES.length; const el = document.getElementById('slide-img'); el.src = P.SLIDES[i]; el.alt = `Pitch slide ${i + 1} of ${P.SLIDES.length}`; document.getElementById('s-count').textContent = `${i + 1} of ${P.SLIDES.length}`; };
    show(0);
    document.getElementById('s-prev').onclick = () => show(i - 1); document.getElementById('s-next').onclick = () => show(i + 1);
    host.querySelector('.slides').addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') show(i + 1); if (e.key === 'ArrowLeft') show(i - 1); });
    return;
  }
  // Until the deck is supplied: a plain-language summary of what it covers (no financial figures).
  host.innerHTML = `<ul class="pitch-points">
    <li><b>The problem</b>Short breaks, a canteen far uphill, and a line that uses up the time that is left.</li>
    <li><b>The product</b>A build-your-own mocktail: 4 bases, 6 tops, 24 combinations, poured by you.</li>
    <li><b>Four ways to get one</b>Pre-order, the stall, roaming sellers, and delivery to a pinned spot on campus.</li>
    <li><b>Our values</b>Time Respect, Choice, Reach, Responsibility, and Transparency.</li>
    <li><b>SDG 12</b>Prevention, reduction, and recycling, built into how every cup is made and returned.</li></ul>
    <p class="caption">The full pitch deck is being added here.</p>`;
}
