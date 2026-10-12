// Our Product: the builder, flavors, four channels, pour video.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { app, setDrink, goTo, drinkLink } from '../app.js';
import { CONFIG } from '../config.js';
import { BASES, TOPS, getBase, getTop, comboName, TOTAL_COMBOS } from '../data/menu.js';
import { copyText, shareLink } from '../utils/share.js';
import { nextCutoff, clock } from '../utils/countdown.js';
import { embed, coarse } from '../utils/env.js';

const lum = (hex) => { const n = parseInt(hex.slice(1), 16); const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255); };
const inkOn = (hex) => (lum(hex) > 0.32 ? '#1a1240' : '#ffffff');

// ---------- builder ----------
export function initBuilder() {
  document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><filter id="goo"><feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b"/><feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="g"/><feComposite in="SourceGraphic" in2="g" operator="atop"/></filter></svg>`);
  const q = new URLSearchParams(location.search);
  const state = { base: getBase(q.get('base')) ? q.get('base') : 'sala', top: getTop(q.get('top')) ? q.get('top') : 'mango' };
  const tried = new Set([`${state.base}|${state.top}`]);
  const status = document.getElementById('b-status');

  const rows = {};
  const build = (groupId, list, kind) => {
    const row = document.querySelector(`#${groupId} .goo-row`);
    row.innerHTML = list.map((f) => `<label class="goo-opt has-blob"><input type="radio" name="${kind}" value="${f.id}" ${state[kind] === f.id ? 'checked' : ''}><span><i style="--c:${f.hex}"></i>${f.name}</span></label>`).join('');
    const layer = document.createElement('div'); layer.className = 'goo-layer'; layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = '<div class="goo-blob trail"></div><div class="goo-blob lead"></div>';
    row.prepend(layer);
    rows[kind] = { row, layer, list };
    row.addEventListener('change', (e) => { if (e.target.name !== kind) return; state[kind] = e.target.value; pick(true); });
  };
  const placeBlobs = (animate) => {
    for (const kind of ['base', 'top']) {
      const { row, layer, list } = rows[kind];
      const lab = row.querySelector('input:checked')?.closest('label'); if (!lab) continue;
      const span = lab.querySelector('span'), rr = row.getBoundingClientRect(), r = span.getBoundingClientRect();
      const hex = list.find((f) => f.id === state[kind]).hex;
      const box = { x: r.left - rr.left, y: r.top - rr.top, width: r.width, height: r.height };
      row.querySelectorAll('.goo-opt span').forEach((s) => { s.style.color = ''; });
      span.style.color = inkOn(hex);
      const [trail, lead] = layer.children;
      if (animate && app.tier !== 'C') {
        gsap.to(lead, { ...box, backgroundColor: hex, duration: 0.4, ease: 'back.out(1.5)', overwrite: true });
        gsap.to(trail, { ...box, backgroundColor: hex, duration: 0.7, ease: 'elastic.out(1,.6)', delay: 0.05, overwrite: true });
      } else { gsap.set([lead, trail], { ...box, backgroundColor: hex }); }
    }
  };
  build('base-group', BASES, 'base'); build('top-group', TOPS, 'top');
  new ResizeObserver(() => placeBlobs(false)).observe(document.getElementById('builder-form'));
  document.fonts?.ready.then(() => placeBlobs(false));

  function pick(user) {
    const key = `${state.base}|${state.top}`; tried.add(key);
    const b = getBase(state.base), t = getTop(state.top), name = comboName(state.base, state.top);
    document.getElementById('combo-name').textContent = name;
    document.getElementById('combo-detail').textContent = `${b.name} and ${t.name.toLowerCase()}. ${CONFIG.CURRENCY}${CONFIG.PRICE}`;
    document.getElementById('tried').textContent = `You've tried ${tried.size} of ${TOTAL_COMBOS}.`;
    document.getElementById('b-link').value = drinkLink(state.base, state.top);
    placeBlobs(true);
    setDrink(state.base, state.top, { pour: user });
    document.dispatchEvent(new CustomEvent('sparkz:drink', { detail: { ...state, user } }));
    if (name !== 'Your Way') gsap.fromTo('#combo-name', { '--w': 125 }, { '--w': 100, duration: 0.8, ease: 'power3.out' });
  }
  document.getElementById('combo-name').style.fontVariationSettings = "'wdth' var(--w,100), 'wght' 600";
  // (the combo line is announced by aria-live)
  setTimeout(() => placeBlobs(false), 50);
  pick(false);

  document.getElementById('b-surprise').addEventListener('click', () => {
    state.base = BASES[Math.floor(Math.random() * BASES.length)].id; state.top = TOPS[Math.floor(Math.random() * TOPS.length)].id;
    for (const k of ['base', 'top']) rows[k].row.querySelector(`input[value="${state[k]}"]`).checked = true;
    pick(true);
  });
  document.getElementById('b-order').addEventListener('click', () => { document.dispatchEvent(new CustomEvent('sparkz:drink', { detail: { ...state, user: true } })); goTo('order'); });
  document.getElementById('b-copy').addEventListener('click', async () => {
    const url = drinkLink(state.base, state.top), name = comboName(state.base, state.top);
    const res = await shareLink({ title: `Sparkz: ${name}`, text: `Try this Sparkz: ${name}`, url });
    status.textContent = res === 'copied' ? 'Link copied.' : res === 'shared' ? 'Shared.' : res === 'manual' ? 'Copy the link below.' : '';
    if (res === 'manual') { const f = document.getElementById('b-fallback'); f.hidden = false; const i = document.getElementById('b-link'); i.focus(); i.select(); }
  });
  document.getElementById('b-link').addEventListener('focus', (e) => e.target.select());

  // deep links: ?base=kiwi&top=strawberry#builder plays the pour when the section is reached
  const api = {
    set(base, top, user = true) {
      state.base = base; state.top = top;
      for (const k of ['base', 'top']) { const i = rows[k].row.querySelector(`input[value="${state[k]}"]`); if (i) i.checked = true; }
      pick(user);
    },
    get state() { return { ...state }; },
    reapply() { setDrink(state.base, state.top, { animate: true }); },
  };
  // ScrollTriggers are created later, in page order, so pin spacers above are measured correctly
  api.triggers = () => {
    if (q.get('base') && q.get('top')) {
      ScrollTrigger.create({ trigger: '#builder', start: 'top 70%', once: true, onEnter: () => api.set(state.base, state.top, true) });
    }
    ScrollTrigger.create({ trigger: '.builder-sec', start: 'top 75%', end: 'bottom 25%', onEnter: () => api.reapply(), onEnterBack: () => api.reapply() });
  };
  return api;
}

// ---------- flavors ----------
export function initFlavors() {
  const ul = document.getElementById('swatches');
  const all = [...BASES.map((f) => ({ ...f, role: 'Base' })), ...TOPS.map((f) => ({ ...f, role: 'Top' }))];
  ul.innerHTML = all.map((f) => `<li class="swatch" data-local="${f.local}"><span class="dot" style="--c:${f.hex}"></span><b>${f.name}</b><span class="role">${f.role}. ${f.blurb}</span></li>`).join('');
  const btns = [...document.querySelectorAll('.seg-btn')];
  btns.forEach((b) => b.addEventListener('click', () => {
    btns.forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    ul.querySelectorAll('.swatch').forEach((li) => {
      const loc = li.dataset.local === 'true';
      li.hidden = b.dataset.f === 'local' ? !loc : b.dataset.f === 'familiar' ? loc : false;
    });
  }));
  const names = all.map((f) => f.name).join('   ');
  document.getElementById('marquee').innerHTML = `<span>${names}   </span><span>${names}   </span>`;
}

// ---------- four channels ----------
export function initChannels() {
  const live = document.getElementById('ch-count'), ring = document.getElementById('ring'), cut = document.getElementById('cutoff');
  const tick = () => {
    const n = nextCutoff(CONFIG.BREAK_SLOTS, CONFIG.PREORDER.CUTOFF_MINUTES);
    if (!n) { return; }
    const text = `Pre-orders for ${n.slot.label} close in ${clock(n.ms)}.`;
    live.textContent = text; cut.textContent = text;
    ring.setAttribute('stroke-dashoffset', String(188.5 * (1 - Math.min(1, n.ms / 864e5))));
  };
  if (CONFIG.BREAK_SLOTS.length) { tick(); setInterval(tick, 1000); }

  if (app.tier !== 'C') {
    gsap.to('.runner-dot', { x: 44, duration: 1.4, repeat: -1, yoyo: true, ease: 'power1.inOut' });
    gsap.fromTo('.pin-drop', { y: -26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'bounce.out', repeat: -1, repeatDelay: 1.6 });
  }
}

/** Horizontal pinned scroll on wide screens, a vertical stack elsewhere. Created after the pins above it. */
export function initChannelsPin() {
  if (app.tier === 'C') return;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    const root = document.documentElement, ch = document.getElementById('channels'), track = document.getElementById('ch-track');
    root.classList.add('hpin');
    const dist = () => Math.max(0, track.scrollWidth - ch.clientWidth);
    const st = ScrollTrigger.create({
      trigger: ch, start: 'top 12%', end: () => `+=${dist() * (embed ? 0.55 : 1)}`, pin: true, scrub: 0.4, invalidateOnRefresh: true, anticipatePin: 1,
      animation: gsap.to(track, { x: () => -dist(), ease: 'none' }),
    });
    ScrollTrigger.refresh();
    return () => { root.classList.remove('hpin'); st.kill(); gsap.set(track, { clearProps: 'all' }); };
  });
}

// ---------- real pour video (hidden until the files exist) ----------
export function initVideo() {
  const fig = document.getElementById('pour-video'); if (!fig) return;
  fetch('./video/pour.mp4', { method: 'HEAD' }).then((r) => {
    if (!r.ok || !/video|octet/.test(r.headers.get('content-type') || 'video')) return;
    fig.hidden = false;
    const v = fig.querySelector('video'), b = document.getElementById('vid-btn');
    const sync = () => { b.textContent = v.paused ? 'Play' : 'Pause'; b.setAttribute('aria-pressed', String(!v.paused)); };
    new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.4 }).observe(v);
    v.addEventListener('play', sync); v.addEventListener('pause', sync);
    b.addEventListener('click', () => (v.paused ? v.play() : v.pause()));
    sync();
  }).catch(() => {});
}
export { coarse, copyText };
