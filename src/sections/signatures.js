// Signature drinks: a pinned, stepped section. The same 3D cup stays put and recolors.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { app, setDrink, goTo } from '../app.js';
import { SIGNATURES, getBase, getTop } from '../data/menu.js';
import { embed } from '../utils/env.js';

export function initSignatures(builder) {
  const sigs = document.getElementById('signatures'), host = sigs.querySelector('.sig-panels');
  host.innerHTML = SIGNATURES.map((s, i) => {
    const b = getBase(s.base), t = getTop(s.top);
    return `<article class="sig-panel${i === 0 ? ' is-on' : ''}" data-i="${i}" aria-label="${s.name}">
      <h3 class="sig-name">${s.name}</h3>
      <p class="sig-line">${s.line}</p>
      <p class="sig-meta">${s.story} Base ${b.name}, top ${t.name}.</p>
      <button type="button" class="btn btn-primary" data-build="${i}">Build this one</button>
    </article>`;
  }).join('');
  const panels = [...host.querySelectorAll('.sig-panel')];
  host.addEventListener('click', (e) => {
    const i = e.target.closest('[data-build]')?.dataset.build; if (i === undefined) return;
    const s = SIGNATURES[+i]; builder.set(s.base, s.top, true); goTo('builder', -72);
  });

  let cur = -1;
  const show = (i, animate = true) => {
    if (i === cur) return; cur = i;
    const s = SIGNATURES[i], b = getBase(s.base), t = getTop(s.top);
    panels.forEach((p, k) => p.classList.toggle('is-on', k === i));
    sigs.style.setProperty('--s1', b.hex); sigs.style.setProperty('--s2', t.hex);
    setDrink(s.base, s.top, { animate });
    if (app.tier !== 'C') {
      const name = panels[i].querySelector('.sig-name');
      name.style.fontVariationSettings = "'wdth' var(--w,100), 'wght' var(--wg,600)";
      gsap.fromTo(name, { '--w': 125, '--wg': 300 }, { '--w': 100, '--wg': 600, duration: 1, ease: 'power3.out' });
      gsap.fromTo(panels[i].children, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: 'power2.out', delay: 0.05 });
    }
  };
  if (app.tier === 'C') {
    // static: every drink shown with its own color bar
    panels.forEach((p, i) => { const s = SIGNATURES[i]; p.insertAdjacentHTML('afterbegin', `<div class="sig-bar" style="background:linear-gradient(90deg, ${getBase(s.base).hex}, ${getTop(s.top).hex})"></div>`); });
    return;
  }
  show(0, false);
  const end = embed ? 150 : 300;
  ScrollTrigger.create({
    trigger: '.sig-pin', start: 'top top', end: `+=${end}%`, pin: true, anticipatePin: 1,
    onUpdate: (self) => show(Math.min(SIGNATURES.length - 1, Math.floor(self.progress * SIGNATURES.length)), true),
    onEnter: () => { cur = -1; show(0); }, onEnterBack: () => { cur = -1; show(SIGNATURES.length - 1); },
  });
}
