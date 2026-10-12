// Shared runtime state and helpers used by every section module.
import { CONFIG } from './config.js';
import { BASES, TOPS, SIGNATURES, getBase, getTop, findSignature, DEFAULT_LAYERING } from './data/menu.js';
import { embed, params, reducedMotion } from './utils/env.js';

export const app = {
  tier: 'C', embed, scene: null, lenis: null,
  drink: { base: 'sala', top: 'mango' },
  refreshers: [],
};

/** Set the shared drink. Updates the CSS variables (SVG fallback, glows) and the 3D scene when it exists. */
export function setDrink(base, top, { animate = true, pour = false } = {}) {
  app.drink = { base, top };
  const b = getBase(base), t = getTop(top);
  const layering = findSignature(base, top)?.layering ?? DEFAULT_LAYERING;
  if (app.scene) {
    app.scene.setDrink({ base: b.hex, top: t.hex, layering }, { animate });
    if (pour) app.scene.playPour();
  } else {
    const r = document.documentElement.style;
    r.setProperty('--cup-base', b.hex); r.setProperty('--cup-top', t.hex);
    r.setProperty('--cup-bottom', layering === 'top' ? t.hex : b.hex); r.setProperty('--cup-upper', layering === 'top' ? b.hex : t.hex);
  }
}

export const siteUrl = () => CONFIG.SITE_URL || (location.origin + location.pathname);
export const drinkLink = (base, top, hash = 'build') => `${siteUrl()}?base=${base}&top=${top}#${hash === 'build' ? 'builder' : hash}`;

/** Scroll to an element id. Works past pinned sections (layout includes the pin spacers) and with Lenis. */
export function goTo(id, offset = 0) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY + offset;
  if (app.lenis) app.lenis.scrollTo(y, { duration: 1.1 });
  else {
    // long native smooth scrolls can be interrupted by pins, so jump when the target is far away
    const far = Math.abs(y - window.scrollY) > window.innerHeight * 2.5;
    window.scrollTo({ top: y, behavior: reducedMotion || far ? 'instant' : 'smooth' });
    if (far) requestAnimationFrame(() => setTimeout(() => window.scrollTo({ top: document.getElementById(id).getBoundingClientRect().top + window.scrollY + offset, behavior: 'instant' }), 120));
  }
  try { history.replaceState(null, '', `#${id}`); } catch { /* sandboxed iframes can block this */ }
}

export const labelFor = (base, top) => {
  const s = findSignature(base, top);
  return s ? `${s.name} (${getBase(base).name} + ${getTop(top).name})` : `${getBase(base).name} + ${getTop(top).name}`;
};
export { BASES, TOPS, SIGNATURES, getBase, getTop, findSignature, params };
