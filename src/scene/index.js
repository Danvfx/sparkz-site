// The one shared 3D scene: a procedural 500ml cup, dome lid, 50ml flavor container, straw, liquid shader and fizz.
// The cup follows whichever [data-cup-slot] element is most in view, so layout stays in the DOM.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { liquidVert, liquidFrag, streamVert, streamFrag, bubbleVert, bubbleFrag, glassVert, glassFrag, shadowFrag } from './shaders.js';

const CUP_H = 2.6, Y0 = -1.3, R_BOT = 0.62, R_TOP = 0.95, FILL_Y = 0.78, LIQ_BOTTOM = -1.25;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (p, a, b) => clamp((p - a) / (b - a));
const ease = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const radiusAt = (h01) => lerp(R_BOT, R_TOP, h01);

export async function createScene({ canvas, tier, onStats }) {
  const lite = tier === 'B';
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !lite, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  let dprCap = lite ? 1.25 : 1.75; // phones render fewer pixels, and at 30fps to save battery
  const minInterval = lite ? 1000 / 30 : 0;
  const setSize = () => {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  };
  setSize();

  const scene = new THREE.Scene();
  const FOV = 32, CAM_Z = 12;
  const camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 60);
  camera.position.set(0, 0, CAM_Z);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.7;
  const key = new THREE.DirectionalLight(0xffd9a0, 2.2);
  key.position.set(-3, 5, 6);
  scene.add(key, new THREE.AmbientLight(0xffffff, 0.35));

  // ---- rigs: `stage` follows the slot; `spin` rocks the cup; container and stream stay still ----
  const stage = new THREE.Group();
const follow = new THREE.Group(); // same position and scale as stage, but no spin or tilt: holds the container and stream
  const spin = new THREE.Group();
  stage.add(spin);
  scene.add(stage, follow);

  const makeGlass = (strength) => new THREE.ShaderMaterial({ vertexShader: glassVert, fragmentShader: glassFrag, uniforms: { uFade: { value: 1 }, uStrength: { value: strength } }, transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const glassMat = makeGlass(1);
  const segs = lite ? 36 : 64;

  // cup shell (thin wall) and rolled rim
  const shellPts = [
    new THREE.Vector2(0, Y0), new THREE.Vector2(R_BOT, Y0), new THREE.Vector2(R_TOP, Y0 + CUP_H),
    new THREE.Vector2(R_TOP - 0.035, Y0 + CUP_H), new THREE.Vector2(R_BOT - 0.035, Y0 + 0.035), new THREE.Vector2(0, Y0 + 0.035),
  ];
  const shell = new THREE.Mesh(new THREE.LatheGeometry(shellPts, segs), glassMat);
  shell.renderOrder = 4;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R_TOP + 0.01, 0.034, 10, segs), glassMat);
  rim.rotation.x = Math.PI / 2; rim.position.y = Y0 + CUP_H; rim.renderOrder = 4;
  // a solid frosted base so the cup reads as an object, not just a glass outline
  const puck = new THREE.Mesh(new THREE.CylinderGeometry(R_BOT - 0.03, R_BOT - 0.03, 0.07, segs), makeGlass(1.6));
  puck.position.y = Y0 + 0.04; puck.renderOrder = 4;
  spin.add(shell, rim, puck);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.7), new THREE.ShaderMaterial({ vertexShader: streamVert, fragmentShader: shadowFrag, transparent: true, depthWrite: false }));
  shadow.position.set(0.05, Y0 - 0.03, 0.15); shadow.renderOrder = 0; follow.add(shadow);

  // liquid
  const rIn = (y) => radiusAt((y - Y0) / CUP_H) - 0.05;
  const liqPts = [new THREE.Vector2(0, LIQ_BOTTOM)];
  for (let i = 0; i <= 8; i++) { const y = lerp(LIQ_BOTTOM, FILL_Y, i / 8); liqPts.push(new THREE.Vector2(i === 0 ? rIn(y) : rIn(y), y)); }
  liqPts.push(new THREE.Vector2(0, FILL_Y));
  const liquidU = {
    uBase: { value: new THREE.Color('#C81D3E') }, uTop: { value: new THREE.Color('#FFC233') },
    uPour: { value: 0 }, uSettle: { value: 0 }, uTime: { value: 0 }, uSink: { value: 0 }, uStream: { value: 0 },
    uBottom: { value: LIQ_BOTTOM }, uFill: { value: FILL_Y },
  };
  const liquid = new THREE.Mesh(
    new THREE.LatheGeometry(liqPts, segs),
    new THREE.ShaderMaterial({ vertexShader: liquidVert, fragmentShader: liquidFrag, uniforms: liquidU, transparent: true, side: THREE.FrontSide, depthWrite: false }),
  );
  liquid.renderOrder = 2;
  spin.add(liquid);

  // fizz
  const nBubbles = tier === 'A' ? 400 : 120;
  const seeds = new Float32Array(nBubbles * 4);
  for (let i = 0; i < nBubbles; i++) {
    seeds[i * 4] = Math.random(); seeds[i * 4 + 1] = Math.random();
    seeds[i * 4 + 2] = Math.random(); seeds[i * 4 + 3] = 0.05 + Math.random() * 0.08; // bubble diameter in cup units
  }
  const bGeo = new THREE.BufferGeometry();
  bGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nBubbles * 3), 3));
  bGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  const bubbleU = {
    uTime: liquidU.uTime, uScale: { value: 300 }, uBottom: { value: LIQ_BOTTOM }, uFill: { value: FILL_Y },
    uRBot: { value: R_BOT - 0.05 }, uRTop: { value: R_TOP - 0.05 }, uAlive: { value: 1 },
  };
  const bubbles = new THREE.Points(bGeo, new THREE.ShaderMaterial({
    vertexShader: bubbleVert, fragmentShader: bubbleFrag, uniforms: bubbleU, transparent: true, depthWrite: false,
  }));
  bubbles.frustumCulled = false; bubbles.renderOrder = 3;
  spin.add(bubbles);

  // straw: matte sugarcane fiber
  const fiber = document.createElement('canvas'); fiber.width = 64; fiber.height = 256;
  { const g = fiber.getContext('2d'); g.fillStyle = '#d6ad74'; g.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(${90 + Math.random() * 60},${60 + Math.random() * 40},30,${0.08 + Math.random() * 0.18})`; g.lineWidth = Math.random() * 1.6;
      const x = Math.random() * 64; g.beginPath(); g.moveTo(x, Math.random() * 256); g.lineTo(x + (Math.random() - 0.5) * 3, Math.random() * 256); g.stroke(); } }
  const fiberTex = new THREE.CanvasTexture(fiber); fiberTex.colorSpace = THREE.SRGBColorSpace;
  const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 3.5, 14), new THREE.MeshStandardMaterial({ map: fiberTex, roughness: 0.92, metalness: 0 }));
  straw.position.set(0.2, 0.95, -0.05); straw.rotation.z = -0.13;
  spin.add(straw);

  // dome lid with a straw hole
  const domePts = [new THREE.Vector2(R_TOP + 0.06, Y0 + CUP_H - 0.04), new THREE.Vector2(R_TOP + 0.06, Y0 + CUP_H + 0.07)];
  for (let i = 0; i <= 10; i++) { const a = (i / 10) * (Math.PI / 2); domePts.push(new THREE.Vector2(lerp(R_TOP, 0.11, Math.sin(a)), Y0 + CUP_H + 0.07 + Math.sin(a) * 0.42)); }
  const domeMat = makeGlass(1.4);
  const dome = new THREE.Mesh(new THREE.LatheGeometry(domePts, segs), domeMat);
  dome.renderOrder = 5;
  spin.add(dome);

  // logo sticker (curved to the cup wall)
  const sticker = new THREE.Group(); spin.add(sticker);
  new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}img/logo-sticker.png`, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const aspect = tex.image.width / tex.image.height;
    const hS = 1.15, yMid = -0.12, wS = hS * aspect;
    const rAt = (y) => radiusAt((y - Y0) / CUP_H) + 0.012;
    const theta = wS / rAt(yMid);
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(rAt(yMid + hS / 2), rAt(yMid - hS / 2), hS, 32, 1, true, -theta / 2, theta),
      new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.4, metalness: 0, alphaTest: 0.03, side: THREE.FrontSide, depthWrite: false }),
    );
    m.position.y = yMid; m.renderOrder = 6; sticker.add(m);
  });

  // 50ml flavor container (origin = bottom centre, lip at y = 1)
  const container = new THREE.Group(); follow.add(container);
  const bodyPts = [[0, 0], [0.26, 0], [0.28, 0.06], [0.28, 0.6], [0.24, 0.74], [0.15, 0.86], [0.125, 0.92], [0.125, 1.0], [0.1, 1.0], [0.1, 0.9], [0.2, 0.74], [0.25, 0.6], [0.25, 0.06], [0, 0.04]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const bodyMat = makeGlass(1.3);
  const body = new THREE.Mesh(new THREE.LatheGeometry(bodyPts, 40), bodyMat); body.renderOrder = 4;
  const flavorMat = new THREE.MeshStandardMaterial({ color: '#FFC233', roughness: 0.15, transparent: true, opacity: 0.92, emissive: '#FFC233', emissiveIntensity: 0.12 });
  const flavor = new THREE.Mesh(new THREE.LatheGeometry([[0, 0.04], [0.245, 0.04], [0.245, 0.6], [0.2, 0.72], [0.14, 0.82], [0.09, 0.82], [0, 0.82]].map(([x, y]) => new THREE.Vector2(x, y)), 36), flavorMat);
  flavor.renderOrder = 3;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 24), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 }));
  cap.position.y = 1.06;
  container.add(body, flavor, cap);

  // pour stream
  const streamU = { uColor: { value: new THREE.Color('#FFC233') }, uTime: liquidU.uTime, uAlpha: { value: 0 } };
  const streamGeo = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);
  const stream = new THREE.Mesh(streamGeo, new THREE.ShaderMaterial({ vertexShader: streamVert, fragmentShader: streamFrag, uniforms: streamU, transparent: true, depthWrite: false }));
  stream.renderOrder = 5; follow.add(stream);

  // ---- pour choreography: a pure function of p (0..1), so scrolling back un-pours ----
  const REST = new THREE.Vector2(1.95, -0.3), HOVER = new THREE.Vector2(1.7, 1.7), POUR = new THREE.Vector2(0.5, 1.72), RET = new THREE.Vector2(2.3, 1.2), OFF = new THREE.Vector2(3.6, 1.2);
  const L = new THREE.Vector2();
  function applyPour(p) {
    const lid = ease(seg(p, 0, 0.12)), rise = ease(seg(p, 0.06, 0.22)), capT = ease(seg(p, 0.2, 0.3));
    const tilt = ease(seg(p, 0.28, 0.45)), pourT = seg(p, 0.4, 0.8), back = ease(seg(p, 0.8, 0.95)), exit = ease(seg(p, 0.95, 1));
    // dome lid lifts away
    dome.position.set(-lid * 1.6, lid * 1.5, 0); dome.rotation.z = lid * 0.5; domeMat.uniforms.uFade.value = 1 - lid; dome.visible = lid < 0.995;
    // container path
    L.copy(REST).lerp(HOVER, rise).lerp(POUR, tilt).lerp(RET, back).lerp(OFF, exit);
    const th = (tilt * 125 + pourT * 12) * Math.PI / 180 * (1 - back);
    container.rotation.z = th;
    // keep the lip at L: pos = L - R(th) * (0,1)
    container.position.set(L.x + Math.sin(th), L.y - Math.cos(th), 0);
    container.visible = p < 0.999;
    cap.position.set(capT * 0.35, 1.06 + capT * 0.9, 0); cap.rotation.z = capT * 1.4; cap.visible = capT < 0.97;
    flavorMat.opacity = 0.92 - pourT * 0.7;
    // stream from the lip down to the liquid surface
    const sIn = seg(p, 0.4, 0.46), sOut = 1 - seg(p, 0.76, 0.82);
    const width = Math.min(sIn, sOut) * (1 - 0.55 * pourT);
    const lipX = L.x, top = L.y - 0.05, bottom = FILL_Y;
    const len = Math.max(0.01, top - bottom);
    stream.visible = width > 0.01;
    stream.scale.set(0.045 * width + 0.004, len, 0.045 * width + 0.004);
    stream.position.set(lipX, bottom + len / 2, 0);
    streamU.uAlpha.value = Math.min(1, width * 2);
    liquidU.uStream.value = Math.min(1, width * 2);
    liquidU.uPour.value = ease(seg(p, 0.42, 0.78));
    liquidU.uSettle.value = ease(seg(p, 0.74, 1));
  }

  // ---- drink colors ----
  const cssVars = (base, top, layering) => {
    const r = document.documentElement.style;
    r.setProperty('--cup-base', base); r.setProperty('--cup-top', top);
    r.setProperty('--cup-bottom', layering === 'top' ? top : base); r.setProperty('--cup-upper', layering === 'top' ? base : top);
  };
  function setDrink({ base, top, layering = 'base' }, { animate = true } = {}) {
    const cb = new THREE.Color(base), ct = new THREE.Color(top);
    liquidU.uSink.value = layering === 'top' ? 1 : 0;
    cssVars(base, top, layering);
    flavorMat.color.set(top); flavorMat.emissive.set(top); streamU.uColor.value.set(top);
    if (!animate) { liquidU.uBase.value.copy(cb); liquidU.uTop.value.copy(ct); return; }
    gsap.to(liquidU.uBase.value, { r: cb.r, g: cb.g, b: cb.b, duration: 0.6, ease: 'power2.out', overwrite: true });
    gsap.to(liquidU.uTop.value, { r: ct.r, g: ct.g, b: ct.b, duration: 0.6, ease: 'power2.out', overwrite: true });
  }

  // ---- pour ownership: slots say 0, 'scrub' or 1; the builder can override with a timed play ----
  let scrubP = 0, override = null, overrideTween = null, curP = 0;
  const api = {
    setDrink,
    setScrub(p) { scrubP = p; },
    /** Play a short automatic pour (about 2.4s), used by the builder. Skips the lid-lift. */
    playPour() {
      overrideTween?.kill();
      override = { p: 0.14 };
      overrideTween = gsap.to(override, { p: 1, duration: 2.6, ease: 'none', onComplete: () => { override = null; } });
    },
    get tier() { return tier; },
  };

  // ---- slot following ----
  const slotEls = () => [...document.querySelectorAll('[data-cup-slot]')];
  let slots = slotEls();
  const cur = { x: 0, y: 0, s: 0 }, from = { x: 0, y: 0, s: 0 };
  let activeEl = null, glide = 1;
  let activePour = 0;
  const upp = () => (2 * CAM_Z * Math.tan((FOV * Math.PI) / 360)) / window.innerHeight;
  function pickSlot() {
    const vh = window.innerHeight; let best = null, bestD = Infinity;
    for (const el of slots) {
      const r = el.getBoundingClientRect();
      if (r.height < 20 || r.bottom < 0 || r.top > vh) continue;
      const cy = (r.top + r.bottom) / 2;
      if (cy < -0.05 * vh || cy > 1.05 * vh) continue; // only follow a slot whose middle is on screen
      const d = Math.abs(cy - vh / 2) - Math.min(r.height, vh) * 0.15;
      if (d < bestD) { bestD = d; best = { el, r }; }
    }
    return best;
  }

  const pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => { pointer.x = (e.clientX / window.innerWidth - 0.5) * 2; pointer.y = (e.clientY / window.innerHeight - 0.5) * 2; }, { passive: true });
  const refreshSlots = () => { slots = slotEls(); };
  window.addEventListener('resize', () => { setSize(); camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); refreshSlots(); });

  // ---- optional bloom (Tier A) ----
  let composer = null;
  // Bloom is off: UnrealBloomPass on a transparent canvas washes the drink out. TODO: revisit with a separate emissive-only bloom pass.
  const BLOOM = false;
  if (tier === 'A' && BLOOM) {
    try {
      const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
        import('three/addons/postprocessing/EffectComposer.js'), import('three/addons/postprocessing/RenderPass.js'),
        import('three/addons/postprocessing/UnrealBloomPass.js'), import('three/addons/postprocessing/OutputPass.js'),
      ]);
      const rt = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { type: THREE.HalfFloatType, samples: 4 });
      composer = new EffectComposer(renderer, rt);
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.18, 0.6, 0.92));
      composer.addPass(new OutputPass());
      window.addEventListener('resize', () => composer?.setSize(window.innerWidth, window.innerHeight));
    } catch { composer = null; }
  }

  // ---- loop with FPS guard ----
  let running = true, acc = 0, frames = 0, guardDone = false, onDemand = false, last = 0;
  let lastNow = null;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; lastNow = null; });
  let visibleScale = 0;

  // driven by gsap.ticker (see main.js) so scrolling, tweens and rendering share one frame loop
  function frame(now) {
    if (!running) return;
    if (lastNow !== null && now - lastNow < (onDemand ? 1000 / 24 : minInterval) - 2) return;
    const dt = lastNow === null ? 0.016 : Math.min((now - lastNow) / 1000, 0.1);
    lastNow = now; last = now;
    liquidU.uTime.value += dt;

    // read layout once per frame, before any writes
    const pick = pickSlot();
    if (pick) {
      const r = pick.r, u = upp(), mult = parseFloat(pick.el.dataset.cupScale || '1');
      const tx = ((r.left + r.right) / 2 - window.innerWidth / 2) * u + parseFloat(pick.el.dataset.cupX || '0') * r.width * u;
      const ty = -((r.top + r.bottom) / 2 - window.innerHeight / 2) * u - parseFloat(pick.el.dataset.cupY || '0') * r.height * u;
      const ts = (r.height * u * mult) / CUP_H;
      const mode = pick.el.dataset.pour;
      activePour = mode === 'scrub' ? scrubP : mode === '0' ? 0 : 1;
      if (pick.el !== activeEl) { // glide between slots, then stay glued to the DOM so there is no scroll lag
        activeEl = pick.el; from.x = cur.s === 0 ? tx : cur.x; from.y = cur.s === 0 ? ty : cur.y; from.s = cur.s; glide = 0;
      }
      glide = Math.min(1, glide + dt / 0.6);
      const e = 1 - (1 - glide) ** 3;
      cur.x = lerp(from.x, tx, e); cur.y = lerp(from.y, ty, e); cur.s = lerp(from.s, ts, e);
    } else {
      activeEl = null; cur.s *= Math.exp(-dt * 12); if (cur.s < 0.01) cur.s = 0;
    }
    visibleScale = cur.s;
    stage.position.set(cur.x, cur.y, 0); stage.scale.setScalar(Math.max(cur.s, 0.0001));
    follow.position.copy(stage.position); follow.scale.copy(stage.scale);
    curP = lerp(curP, override ? override.p : activePour, override ? 1 : 1 - Math.exp(-dt * 12));
    applyPour(curP);

    spin.rotation.y = Math.sin(liquidU.uTime.value * 0.45) * 0.38;
    stage.rotation.y = pointer.x * 0.12; stage.rotation.x = pointer.y * 0.05;
    bubbleU.uScale.value = (window.innerHeight * renderer.getPixelRatio() * Math.max(cur.s, 0.001)) / (2 * CAM_Z * Math.tan((FOV * Math.PI) / 360));

    if (visibleScale > 0.002) { composer ? composer.render() : renderer.render(scene, camera); }

    // FPS guard for the first 3 seconds
    if (!guardDone) {
      acc += dt; frames++;
      if (acc > 3) {
        guardDone = true; const fps = frames / acc;
        if (fps < 45 && tier === 'A') { composer = null; dprCap = 1.5; setSize(); bubbleU.uAlive.value = 0.3; api.downgraded = 'B'; }
        else if (fps < 30) { onDemand = true; dprCap = 1.25; setSize(); bubbleU.uAlive.value = 0.3; api.downgraded = 'B-ondemand'; }
        onStats?.({ fps, downgraded: api.downgraded });
      }
    }
    api.fps = frames / Math.max(acc, 0.001);
  }

  if (new URLSearchParams(location.search).get('debug') === '1') window.__sparkz = { shell, rim, liquid, dome, bubbles, liquidU, glassMat, renderer, scene, straw, sticker, container };
  api.update = frame;
  api.refreshSlots = refreshSlots; api.cur = cur; api.pick = () => { const p = pickSlot(); return p && { cls: p.el.className, top: p.r.top, h: p.r.height }; };
  return api;
}
