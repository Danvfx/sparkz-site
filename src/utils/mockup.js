// Vector drink mockups for the gallery. Drawn in code from src/data/menu.js, so the colors and the
// layer order always match the 3D cup and the builder. No raster images, no AI art.
import { SIGNATURES, getBase, getTop } from '../data/menu.js';

const CUP = 'M46 52h108l-12 226q-1 8-9 8H67q-8 0-9-8z';

function cupSvg(sig) {
  const b = getBase(sig.base), t = getTop(sig.top), id = `mk-${sig.id}`;
  // 'base': base syrup at the bottom, poured top above it. 'top': the poured syrup sinks to the bottom.
  const [low, high] = sig.layering === 'top' ? [t, b] : [b, t];
  return `<svg class="mockup" viewBox="0 0 220 340" role="img" aria-labelledby="${id}-t" focusable="false">
    <title id="${id}-t">${sig.name}: ${high.name} over ${low.name}, drawn as a vector mockup</title>
    <defs>
      <linearGradient id="${id}-liq" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${high.hex}"/><stop offset=".36" stop-color="${high.hex}"/>
        <stop offset=".6" stop-color="${low.hex}"/><stop offset="1" stop-color="${low.hex}"/>
      </linearGradient>
      <linearGradient id="${id}-shine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/>
        <stop offset="1" stop-color="#fff" stop-opacity=".18"/>
      </linearGradient>
      <clipPath id="${id}-clip"><path d="${CUP}"/></clipPath>
    </defs>
    <ellipse cx="104" cy="304" rx="62" ry="9" fill="#1a1a2e" opacity=".16"/>
    <rect x="122" y="6" width="11" height="196" rx="5.5" fill="#d6ad74" transform="rotate(9 128 104)"/>
    <g clip-path="url(#${id}-clip)">
      <rect x="40" y="86" width="120" height="204" fill="url(#${id}-liq)"/>
      <g fill="#fff" opacity=".28">
        <rect x="64" y="96" width="30" height="30" rx="7" transform="rotate(-14 79 111)"/>
        <rect x="102" y="112" width="28" height="28" rx="7" transform="rotate(12 116 126)"/>
        <rect x="80" y="150" width="26" height="26" rx="6" transform="rotate(-6 93 163)"/>
      </g>
      <rect x="40" y="52" width="120" height="240" fill="url(#${id}-shine)"/>
    </g>
    <path d="${CUP}" fill="none" stroke="#1a1a2e" stroke-opacity=".55" stroke-width="3" stroke-linejoin="round"/>
    <rect x="40" y="46" width="120" height="10" rx="5" fill="#fff" fill-opacity=".85" stroke="#1a1a2e" stroke-opacity=".55" stroke-width="2"/>
    <g transform="translate(100 214)">
      <rect x="-30" y="-17" width="60" height="34" rx="17" fill="#fff" fill-opacity=".92"/>
      <text x="0" y="5" text-anchor="middle" font-family="var(--font-display, sans-serif)" font-weight="700" font-size="15" fill="#1a1a2e">Sparkz</text>
    </g>
  </svg>`;
}

export function mountMockups() {
  document.querySelectorAll('[data-mockup]').forEach((el) => {
    const sig = SIGNATURES.find((s) => s.id === el.dataset.mockup);
    if (!sig) return;
    const b = getBase(sig.base), t = getTop(sig.top);
    el.style.setProperty('--m1', b.hex); el.style.setProperty('--m2', t.hex);
    el.insertAdjacentHTML('afterbegin', cupSvg(sig));
  });
}
