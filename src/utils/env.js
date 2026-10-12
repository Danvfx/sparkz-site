export const params = new URLSearchParams(location.search);
const inIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
export const embed = params.get('embed') === '1' ? true : params.get('embed') === '0' ? false : inIframe;
export const present = params.get('present') === '1';
export const debug = params.get('debug') === '1';
export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const coarse = matchMedia('(pointer: coarse)').matches;

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

// A full, B lite, C static.
export function detectTier() {
  if (params.get('static') === '1' || reducedMotion || !hasWebGL()) return 'C';
  if (
    params.get('lite') === '1' || coarse ||
    (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
  ) return 'B';
  return 'A';
}

export const safe = (fn, fallback) => { try { return fn(); } catch { return fallback; } };
export const store = {
  get: (k) => safe(() => sessionStorage.getItem(k), null),
  set: (k, v) => safe(() => sessionStorage.setItem(k, v)),
};
