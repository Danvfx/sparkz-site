// SDG 12: citations, animated infographic, cup loop, copy that depends on the recycling decision, and the sorting game.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { app } from '../app.js';
import { CONFIG } from '../config.js';
import { REFS, LAWS, refEntries } from '../data/sources.js';

gsap.registerPlugin(DrawSVGPlugin, MotionPathPlugin);

/** Fill every [data-cite] with an APA in-text citation that links to its reference entry. */
export function initCites() {
  const all = [...REFS, ...LAWS];
  document.querySelectorAll('[data-cite]').forEach((el) => {
    const r = all.find((x) => x.id === el.dataset.cite); if (!r) return;
    el.innerHTML = `${el.dataset.prefix ?? ' '}<a class="cite" href="#ref-${r.id}">(${el.dataset.label ?? r.cite})</a>`;
  });
  document.getElementById('reflist').innerHTML = refEntries().map((r) => `<li id="ref-${r.id}">${r.html}</li>`).join('');
}

/** Copy that must follow the recycling decision (never promise recycling without a destination). */
export function initCupCopy() {
  const dest = CONFIG.RECYCLING_DESTINATION.trim();
  const line = dest ? `We collect empty cups at the stall and send them to ${dest} for recycling.` : 'We collect empty cups at the stall.';
  document.querySelectorAll('[data-cupline],[data-cuptarget]').forEach((el) => { el.textContent = line; });
  const msg = document.querySelector('[data-msg-line]');
  if (msg) msg.textContent = dest ? 'Bring it back to the stall, and it goes to recycling instead of the trash.' : 'Bring it back to the stall. We collect every empty cup.';
  if (CONFIG.TAKEBACK_LIVE) document.querySelectorAll('[data-epr]').forEach((el) => { el.hidden = false; });
  document.querySelectorAll('[data-hashtag]').forEach((el) => { el.textContent = CONFIG.HASHTAG; });
  document.querySelectorAll('[data-price]').forEach((el) => { el.textContent = CONFIG.PRICE; });
  document.querySelectorAll('[data-stall]').forEach((el) => { el.textContent = CONFIG.STALL_LOCATION; });
}

export function initInfographic() {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
    if (app.tier === 'C') return;
    const o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 1.4, ease: 'power2.out', onUpdate: () => { el.textContent = o.v.toFixed(dec); }, onComplete: () => { el.textContent = end.toFixed(dec); } }) });
  });
  if (app.tier !== 'C') gsap.from('.fact', { y: 30, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out', scrollTrigger: { trigger: '#infographic', start: 'top 80%', once: true } });
}

export function initLoop() {
  const path = document.getElementById('loop-path'); if (!path || app.tier === 'C') return;
  gsap.set('#loop-cup', { xPercent: 0 });
  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  tl.fromTo(path, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1 }, 0)
    .to('#loop-cup', { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], autoRotate: false }, duration: 1 }, 0);
  ScrollTrigger.create({ trigger: '#loop', start: 'top 80%', end: 'bottom 30%', scrub: 0.6, animation: tl });
}

// ---------- Sort your Sparkz ----------
const ITEMS = [
  { id: 'cup', name: 'Empty PET cup', bin: 'Recyclable', why: 'It is plastic that can be recycled once it is empty. Rinse out the drink first.' },
  { id: 'lid', name: 'Dome lid', bin: 'Recyclable', why: 'Empty, dry plastic lids can go with the cup.' },
  // TODO: confirm the 50ml container material (PET or PP) before keeping this answer.
  { id: 'flavor', name: '50ml flavor container', bin: 'Recyclable', why: 'Recyclable if it is PET or PP. We are confirming which one ours is.' },
  // TODO: confirm what the straw supplier label says (compostable, biodegradable, or certified).
  { id: 'bag', name: 'Bagasse straw', bin: 'Biodegradable', why: 'Sugarcane fiber breaks down, which is why we use it.' },
  { id: 'plastic', name: 'Plastic straw', bin: 'Residual', why: 'It is too small and light to recycle. That is why Sparkz switched.' },
  { id: 'leftover', name: 'Leftover drink', bin: 'Pour out', why: 'Pour it out before you sort anything. A full cup spoils the recycling.' },
];

export async function initGame() {
  const itemsEl = document.getElementById('game-items'), binsEl = document.getElementById('game-bins');
  const status = document.getElementById('game-status'), end = document.getElementById('game-end');
  const bins = [...CONFIG.BINS, 'Pour out'];
  let right = 0, done = 0, armed = null;

  const render = () => {
    right = 0; done = 0; armed = null; end.hidden = true; status.textContent = '';
    itemsEl.innerHTML = ITEMS.map((it) => `<li><button type="button" class="g-item" data-id="${it.id}" aria-pressed="false">${it.name}</button></li>`).join('');
    binsEl.innerHTML = bins.map((b) => `<button type="button" class="bin" data-bin="${b}"><b>${b === 'Pour out' ? 'Pour it out first' : b}</b><ul></ul></button>`).join('');
    bind();
  };
  const drop = (btn, bin) => {
    const it = ITEMS.find((x) => x.id === btn.dataset.id); const ok = it.bin === bin;
    if (ok) right++;
    done++;
    btn.classList.add('is-done'); btn.hidden = true; btn.closest('li').hidden = true;
    const li = document.createElement('li'); li.textContent = it.name;
    binsEl.querySelector(`[data-bin="${bin}"] ul`).appendChild(li);
    status.textContent = `${ok ? 'Right.' : `Not quite. It goes in ${it.bin === 'Pour out' ? 'the drain, poured out first' : it.bin}.`} ${it.why}`;
    armed = null; itemsEl.querySelectorAll('.g-item').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    binsEl.querySelectorAll('.bin').forEach((b) => b.classList.remove('is-armed'));
    if (done === ITEMS.length) { document.getElementById('game-score').textContent = `${right} of ${ITEMS.length} sorted right`; end.hidden = false; }
  };
  function bind() {
    // tap or keyboard: choose an item, then a bin
    itemsEl.querySelectorAll('.g-item').forEach((b) => b.addEventListener('click', () => {
      if (b.classList.contains('is-done')) return;
      armed = armed === b ? null : b;
      itemsEl.querySelectorAll('.g-item').forEach((x) => x.setAttribute('aria-pressed', String(x === armed)));
      binsEl.querySelectorAll('.bin').forEach((x) => x.classList.toggle('is-armed', !!armed));
      status.textContent = armed ? `${armed.textContent} selected. Choose a bin.` : '';
    }));
    binsEl.querySelectorAll('.bin').forEach((bn) => bn.addEventListener('click', () => { if (armed) drop(armed, bn.dataset.bin); }));
    // drag with GSAP Draggable on desktop
    import('gsap/Draggable').then(({ Draggable }) => {
      gsap.registerPlugin(Draggable);
      itemsEl.querySelectorAll('.g-item').forEach((b) => {
        Draggable.create(b, {
          type: 'x,y', zIndexBoost: true, minimumMovement: 6,
          onDrag() { binsEl.querySelectorAll('.bin').forEach((bn) => bn.classList.toggle('is-over', this.hitTest(bn, '30%'))); },
          onDragEnd() {
            const hit = [...binsEl.querySelectorAll('.bin')].find((bn) => this.hitTest(bn, '30%'));
            binsEl.querySelectorAll('.bin').forEach((bn) => bn.classList.remove('is-over'));
            if (hit) { gsap.set(b, { x: 0, y: 0 }); drop(b, hit.dataset.bin); } else gsap.to(b, { x: 0, y: 0, duration: 0.4, ease: 'back.out(1.7)' });
          },
        });
      });
    });
  }
  document.getElementById('game-again').addEventListener('click', render);
  render();
}
