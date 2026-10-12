// Navigation: compact nav, full-screen menu, chapter rail, active section, anchor scrolling, "Open full site", cursor.
import gsap from 'gsap';
import { app, goTo, siteUrl } from '../app.js';
import { CONFIG } from '../config.js';
import { embed, coarse } from '../utils/env.js';

const CHAPTERS = [
  ['home', 'Home', ['home', 'pour']], ['about', 'About Us'], ['product', 'Our Product'], ['sdg', 'SDG 12'], ['message', 'Our Message'],
  ['pitch', 'Our Pitch'], ['order', 'Order'], ['feedback', 'Feedback'], ['sources', 'Sources'],
];

export function initNav() {
  const menu = document.getElementById('menu'), btn = document.getElementById('menu-btn');
  const setMenu = (open) => {
    menu.hidden = !open; btn.setAttribute('aria-expanded', String(open)); btn.textContent = open ? 'Close' : 'Menu';
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) menu.querySelector('a')?.focus(); else btn.focus({ preventScroll: true });
  };
  btn.addEventListener('click', () => setMenu(menu.hidden));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  // every in-page link scrolls through goTo so pinned sections and Lenis are handled
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    if (!id || !document.getElementById(id)) return;
    e.preventDefault();
    if (!menu.hidden) { setMenu(false); }
    const off = ['builder', 'flavors', 'channels', 'signatures', 'game', 'pledge'].includes(id) ? -72 : 0;
    goTo(id, off);
  });

  // rail
  const rail = document.getElementById('rail');
  rail.innerHTML = CHAPTERS.map(([id, label]) => `<a href="#${id}" data-r="${id}" aria-label="${label}"><span>${label}</span></a>`).join('');

  // active section (the section crossing the middle of the viewport)
  const map = new Map();
  for (const [id, , group] of CHAPTERS) for (const g of group ?? [id]) { const el = document.getElementById(g); if (el) map.set(el, id); }
  const setActive = (id) => {
    document.querySelectorAll('.nav-links a, .rail a').forEach((a) => {
      const on = (a.getAttribute('href') === `#${id}`);
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  };
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) setActive(map.get(en.target));
  }, { rootMargin: '-45% 0px -54% 0px' });
  map.forEach((_, el) => io.observe(el));
  setActive('home');

  // "Open full site" inside an iframe
  document.documentElement.classList.toggle('embed', embed);
  if (embed) {
    const a = document.getElementById('open-full');
    const u = new URL(CONFIG.SITE_URL || (location.origin + location.pathname)); u.searchParams.set('embed', '0');
    a.href = u.toString(); a.hidden = false;
  }

  // custom cursor: standalone, desktop, Tier A only
  if (!embed && !coarse && app.tier === 'A') {
    const c = document.createElement('div'); c.className = 'cursor'; c.setAttribute('aria-hidden', 'true'); document.body.appendChild(c);
    const qx = gsap.quickTo(c, 'x', { duration: 0.18, ease: 'power3' }), qy = gsap.quickTo(c, 'y', { duration: 0.18, ease: 'power3' });
    window.addEventListener('pointermove', (e) => { qx(e.clientX); qy(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', (e) => c.classList.toggle('grow', !!e.target.closest('a, button, [data-magnet], summary, label')));
    // magnetic pull on the main buttons
    document.querySelectorAll('[data-magnet]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - (r.left + r.width / 2)) * 0.25, y: (e.clientY - (r.top + r.height / 2)) * 0.3, duration: 0.3, ease: 'power2.out' });
      });
      el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,.5)' }));
    });
  }
  return { setMenu, siteUrl };
}
