import '@fontsource-variable/fredoka/standard.css';
import '@fontsource-variable/figtree/index.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/cream.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { app, setDrink, goTo } from './app.js';
import { CONFIG } from './config.js';
import { embed, present, debug, params, detectTier, coarse } from './utils/env.js';
import { mountSvgCups } from './utils/svgCup.js';
import { initNav } from './sections/nav.js';
import { heroIntro, initPour, initHill } from './sections/story.js';
import { initBuilder, initFlavors, initChannels, initChannelsPin, initVideo } from './sections/product.js';
import { initSignatures } from './sections/signatures.js';
import { initCites, initCupCopy, initInfographic, initLoop, initGame } from './sections/sdg.js';
import { initMessage, initPitch } from './sections/message.js';
import { initOrder, initFeedback } from './sections/forms.js';

gsap.registerPlugin(ScrollTrigger, SplitText);
gsap.ticker.lagSmoothing(0);
const root = document.documentElement;
app.tier = detectTier();
root.classList.add(`tier-${app.tier.toLowerCase()}`);
if (present) root.classList.add('present');
if (embed) root.classList.add('embed');

// preloader: the real parts (fonts, logo, scene) drive the progress; a hard cap reveals the page at about 2.5s regardless
const pre = document.getElementById('preloader');
const preMark = pre.querySelector('.pre-mark');
preMark.innerHTML = document.querySelector('#sparkz-mark').innerHTML; // real elements, so the drops can animate
let progress = 0;
const setProgress = (p) => { progress = Math.max(progress, p); gsap.to('#pre-fill', { attr: { y: 74 - 68 * progress }, duration: 0.35, overwrite: true }); };
gsap.from('.pre-mark .mk-drop', { y: -70, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'bounce.out' });
let revealed = false;
const reveal = () => {
  if (revealed) return; revealed = true; setProgress(1);
  setTimeout(() => { pre.classList.add('done'); heroIntro(); ScrollTrigger.refresh(); }, 250);
  setTimeout(() => pre.remove(), 900);
};
setTimeout(reveal, app.tier === 'C' ? 700 : 2500);

// static content
initCupCopy(); initCites(); mountSvgCups();
const builder = initBuilder();
initFlavors(); initChannels(); initVideo();
initPitch(); initOrder(); initFeedback();
initNav();
initGame();
setProgress(0.25);

// scroll: Lenis only standalone on strong devices (inside an iframe it can trap the mouse wheel)
async function setupScroll() {
  if (!embed && app.tier === 'A' && !coarse) {
    const { default: Lenis } = await import('lenis');
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    app.lenis = lenis;
  } else root.classList.add('native-scroll');
}
await setupScroll();

// 3D after first paint
async function setupScene() {
  if (app.tier === 'C') return;
  try {
    const { createScene } = await import('./scene/index.js');
    app.scene = await createScene({
      canvas: document.getElementById('gl'), tier: app.tier,
      onStats: ({ fps, downgraded }) => { if (debug) console.info('[sparkz] fps', fps.toFixed(1), downgraded || ''); },
    });
    setDrink(app.drink.base, app.drink.top, { animate: false });
    gsap.ticker.add((t) => app.scene.update(t * 1000)); // one shared frame loop
    root.classList.add('gl');
    if (debug) window.__app = app;
  } catch (err) {
    console.warn('[sparkz] 3D unavailable, using the static cup', err);
    app.tier = 'C'; root.classList.remove('tier-a', 'tier-b'); root.classList.add('tier-c');
  }
}
setProgress(0.5);
await Promise.all([document.fonts.ready, setupScene()]);
setProgress(0.85);

// scroll-driven sections (after fonts so measurements are right)
setDrink(builder.state.base, builder.state.top, { animate: false });
// create ScrollTriggers top to bottom so every pin spacer is measured in order
initPour(); initHill(); builder.triggers(); initSignatures(builder); initChannelsPin(); initInfographic(); initLoop();
initMessage(builder);
ScrollTrigger.sort();
ScrollTrigger.refresh();
// images change heights: refresh once they have loaded
window.addEventListener('load', () => ScrollTrigger.refresh());
document.querySelectorAll('img[loading="lazy"]').forEach((i) => i.addEventListener('load', () => ScrollTrigger.refresh(), { once: true }));
reveal();

// land on a hash (also past pinned sections)
if (location.hash && document.getElementById(location.hash.slice(1))) setTimeout(() => goTo(location.hash.slice(1)), 700);

// presentation mode: arrow keys step the pour beats
if (present) {
  const beats = [0, 0.18, 0.5, 0.8, 1]; let i = 0;
  const pin = document.querySelector('.pour-pin');
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    i = Math.max(0, Math.min(beats.length - 1, i + (e.key === 'ArrowRight' ? 1 : -1)));
    const st = ScrollTrigger.getAll().find((s) => s.trigger === pin); if (!st) return;
    const y = st.start + (st.end - st.start) * beats[i];
    if (app.lenis) app.lenis.scrollTo(y); else window.scrollTo({ top: y, behavior: 'smooth' });
  });
}

if (debug) {
  const d = document.createElement('div'); d.id = 'debug'; document.body.appendChild(d);
  setInterval(() => { d.textContent = `tier ${app.tier} | ${embed ? 'embed' : 'standalone'} | fps ${app.scene ? app.scene.fps?.toFixed(0) : '-'} ${app.scene?.downgraded ?? ''}`; }, 500);
}
if (params.get('tier')) console.info('[sparkz] use ?lite=1 or ?static=1 to force a tier');
export { CONFIG };
