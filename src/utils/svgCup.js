// SVG cup used when WebGL is off (Tier C), and while the 3D scene loads.
export function mountSvgCups() {
  const defs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
    <linearGradient id="cupg" x1="0" y1="1" x2="0" y2="0"><stop class="stop-b" offset="0"/><stop class="stop-b" offset=".34"/><stop class="stop-t" offset=".72"/><stop class="stop-t" offset="1"/></linearGradient>
    <clipPath id="cupclip"><path d="M46 52h108l-12 226q-1 8-9 8H67q-8 0-9-8z"/></clipPath></defs></svg>`;
  document.body.insertAdjacentHTML('afterbegin', defs);
  const cup = `<svg class="cup-svg" viewBox="0 0 220 320" aria-hidden="true" focusable="false">
    <rect x="124" y="2" width="12" height="190" rx="6" fill="#d6ad74" transform="rotate(10 130 100)"/>
    <rect x="40" y="46" width="120" height="260" fill="url(#cupg)" clip-path="url(#cupclip)" opacity=".92"/>
    <path d="M46 52h108l-12 226q-1 8-9 8H67q-8 0-9-8z" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.7)" stroke-width="3" stroke-linejoin="round"/>
    <rect x="40" y="44" width="120" height="9" rx="4.5" fill="rgba(255,255,255,.5)"/>
    <image href="./img/logo-sticker.png" x="62" y="140" width="76" height="66" preserveAspectRatio="xMidYMid meet"/>
  </svg>`;
  document.querySelectorAll('[data-cup-slot]').forEach((s) => s.insertAdjacentHTML('beforeend', cup));
}
