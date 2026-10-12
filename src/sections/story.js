// Home (hero + pour) and the About Us break-time animation.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { app } from '../app.js';
import { embed, coarse } from '../utils/env.js';

const swell = (el, from = 125) => gsap.fromTo(el, { '--w': from, '--wg': 320 }, { '--w': 100, '--wg': 650, duration: 1.2, ease: 'power3.out' });

export function heroIntro() {
  const title = document.querySelector('.hero-title');
  title.style.fontVariationSettings = "'wdth' var(--w, 100), 'wght' var(--wg, 650)";
  if (app.tier === 'C') return;
  const split = SplitText.create(title, { type: 'chars', charsClass: 'ch' });
  gsap.set(split.chars, { display: 'inline-block' });
  gsap.from(split.chars, { yPercent: 70, opacity: 0, rotate: 6, duration: 0.8, ease: 'back.out(1.7)', stagger: 0.035 });
  gsap.fromTo(split.chars, { '--w': 125, '--wg': 320 }, { '--w': 100, '--wg': 650, duration: 1.1, ease: 'power3.out', stagger: 0.035 });
  gsap.from('.tagline, .lede, .sdg-line, .hero .cta, .skip-order', { opacity: 0, y: 18, duration: 0.7, stagger: 0.09, delay: 0.5, ease: 'power2.out' });
}

export function initPour() {
  const beats = [...document.querySelectorAll('.beat')].map((el) => ({ el, at: el.dataset.at.split(',').map(Number) }));
  if (app.tier === 'C') return;
  const pin = document.querySelector('.pour-pin');
  const end = embed ? 200 : coarse ? 300 : 400; // embed uses about half the scroll distance
  ScrollTrigger.create({
    trigger: pin, start: 'top top', end: `+=${end}%`, pin: true, scrub: 0.25, anticipatePin: 1,
    onUpdate: (self) => {
      const p = self.progress;
      app.scene?.setScrub(p);
      for (const { el, at } of beats) {
        const [a, b] = at, fade = 0.04;
        const o = Math.max(0, Math.min(1, (p - a) / fade, (b - p) / fade));
        el.style.opacity = String(o); el.style.transform = `translateY(${(1 - o) * 14}px)`;
      }
    },
  });
}

/** About Us: a dot walks uphill and joins the line while the break ring drains; then a runner arrives. */
export function initHill() {
  const q = (s) => document.querySelector(s);
  const walker = q('#walker'), ring = q('#timer-ring'), runner = q('#runner');
  const ground = q('#hill-ground');
  if (!ground) return;
  const len = ground.getTotalLength();
  const at = (t) => ground.getPointAtLength(len * t);
  const place = (el, t, dy = -8) => { const p = at(t); el.setAttribute('cx', p.x); el.setAttribute('cy', p.y + dy); };
  const state = { t: 0, ring: 0, run: 0 };
  const draw = () => {
    place(walker, 0.05 + state.t * 0.62);
    ring.setAttribute('stroke-dashoffset', String(163.4 * state.ring));
    const r = at(1 - state.run * 0.9); runner.setAttribute('cx', r.x); runner.setAttribute('cy', r.y - 8);
  };
  draw();
  if (app.tier === 'C') { gsap.set(['#queue', '#soyes'], { opacity: 1 }); return; }
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  tl.to(state, { t: 1, ring: 0.95, duration: 4, onUpdate: draw })
    .to('#queue', { opacity: 1, duration: 0.4 }, 3.4)
    .to('#bell', { opacity: 1, duration: 0.3 }, 4)
    .to('#walker', { opacity: 0.25, duration: 0.3 }, 4.4)
    .set(state, { ring: 0 }, 4.8)
    .to('#runner', { opacity: 1, duration: 0.2 }, 4.8)
    .to(state, { run: 1, ring: 0.1, duration: 2, onUpdate: draw }, 4.8)
    .to('#soyes', { opacity: 1, duration: 0.6 }, 6.6)
    .to('#bell', { opacity: 0, duration: 0.2 }, 4.9);
  ScrollTrigger.create({ trigger: '#hill', start: 'top 80%', end: 'bottom 35%', scrub: 0.6, animation: tl });
}
export { swell };
