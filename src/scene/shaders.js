// GLSL for the liquid, the pour stream and the fizz.
const noise = /* glsl */ `
float hash31(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vnoise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash31(i), hash31(i+vec3(1,0,0)), f.x), mix(hash31(i+vec3(0,1,0)), hash31(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(hash31(i+vec3(0,0,1)), hash31(i+vec3(1,0,1)), f.x), mix(hash31(i+vec3(0,1,1)), hash31(i+vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p){ float a = 0.5, s = 0.0; for(int i=0;i<3;i++){ s += a*vnoise(p); p = p*2.03 + 7.1; a *= 0.5; } return s; }
`;

export const liquidVert = /* glsl */ `
varying vec3 vPos; varying vec3 vN; varying vec3 vView;
void main(){
  vPos = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

// uBase/uTop: drink colors. uPour: how far the poured color has sunk (0..1). uSettle: plumes smoothing into a gradient (0..1).
// uSink: 0 = base ends at the bottom, 1 = the poured syrup ends at the bottom. TODO: match reference footage of a real pour.
export const liquidFrag = /* glsl */ `
precision highp float;
uniform vec3 uBase, uTop; uniform float uPour, uSettle, uTime, uSink, uStream, uBottom, uFill;
varying vec3 vPos; varying vec3 vN; varying vec3 vView;
${noise}
void main(){
  float h = clamp((vPos.y - uBottom) / (uFill - uBottom), 0.0, 1.0);
  float r = length(vPos.xz);
  float plume = 0.0;
  if (uPour > 0.002 && uSettle < 0.999) { // the noise only runs while the pour is happening
    vec3 p = vec3(vPos.xz * 1.7, vPos.y * 1.2 - uTime * 0.12);
    vec3 q = vec3(vnoise(p), vnoise(p + 3.1), vnoise(p - 5.7));
    float n = fbm(p + 1.7 * q);
    float depth = 1.0 - h;
    float reach = uPour * 1.35;
    plume = smoothstep(0.0, 0.32, reach - depth + (n - 0.5) * 0.95);
    float widen = 0.22 + uPour * 1.15;
    plume *= 1.0 - smoothstep(widen * 0.45, widen, r + (n - 0.5) * 0.55);
  }
  float grad = uSink < 0.5 ? smoothstep(0.28, 0.86, h) : 1.0 - smoothstep(0.14, 0.72, h);
  float amount = mix(plume, grad, uSettle);
  vec3 col = mix(uBase, uTop, amount);
  float lam = 0.82 + 0.3 * max(dot(normalize(vN), normalize(vec3(-0.5, 0.6, 0.7))), 0.0);
  col *= lam;
  float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vView))), 2.4);
  col += fres * 0.22;
  float alpha = 0.97;
  if (vN.y > 0.9) {
    float ring = smoothstep(0.05, 0.0, abs(r - fract(uTime * 0.45) * 0.85)) * uStream;
    col += ring * 0.35; alpha = 0.9;
  }
  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
}`;

export const streamVert = /* glsl */ `
varying vec2 vUv; varying vec3 vPos;
void main(){ vUv = uv; vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
export const streamFrag = /* glsl */ `
precision highp float;
uniform vec3 uColor; uniform float uTime, uAlpha;
varying vec2 vUv; varying vec3 vPos;
${noise}
void main(){
  float n = vnoise(vec3(vUv.x * 6.0, vUv.y * 3.0 - uTime * 2.4, 0.0));
  float edge = 1.0 - pow(abs(vUv.x - 0.5) * 2.0, 3.0);
  float a = uAlpha * edge * (0.8 + 0.2 * n);
  gl_FragColor = vec4(uColor * (0.9 + 0.3 * n), a);
  #include <colorspace_fragment>
}`;

export const bubbleVert = /* glsl */ `
attribute vec4 aSeed; uniform float uTime, uScale, uBottom, uFill, uRBot, uRTop, uAlive;
varying float vA;
void main(){
  float t = fract(uTime * (0.05 + aSeed.z * 0.09) + aSeed.x);
  float y = mix(uBottom + 0.05, uFill - 0.03, t);
  float h = (y - (-1.3)) / 2.6;
  float rad = mix(uRBot, uRTop, h) * 0.86 * sqrt(aSeed.y);
  float ang = aSeed.x * 40.0 + t * 3.0;
  vec3 pos = vec3(cos(ang) * rad + sin(uTime * 2.0 + aSeed.x * 20.0) * 0.015, y, sin(ang) * rad);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = aSeed.w * uScale / -mv.z;
  vA = (smoothstep(0.0, 0.06, t) * (1.0 - smoothstep(0.92, 1.0, t))) * step(aSeed.x, uAlive);
  gl_Position = projectionMatrix * mv;
}`;
export const bubbleFrag = /* glsl */ `
precision highp float; varying float vA;
void main(){
  vec2 c = gl_PointCoord - 0.5; float d = length(c);
  float ring = smoothstep(0.5, 0.42, d) * (0.35 + 0.65 * smoothstep(0.25, 0.46, d));
  gl_FragColor = vec4(1.0, 1.0, 1.0, ring * 0.7 * vA);
}`;

// Frosted glass that reads on a cream page: cool darker rim, soft body, spec highlights and condensation beads.
export const glassVert = /* glsl */ `
varying vec3 vN; varying vec3 vV; varying vec3 vP;
void main(){
  vP = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
export const glassFrag = /* glsl */ `
precision highp float;
uniform float uFade, uStrength; varying vec3 vN; varying vec3 vV; varying vec3 vP;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
void main(){
  vec3 n = normalize(gl_FrontFacing ? vN : -vN);
  float f = pow(1.0 - abs(dot(n, normalize(vV))), 2.0);
  vec3 L = normalize(vec3(-0.6, 0.5, 0.8));
  float spec = pow(max(dot(reflect(-L, n), normalize(vV)), 0.0), 28.0);
  float side = pow(max(dot(n, normalize(vec3(0.9, 0.2, 0.4))), 0.0), 18.0);
  vec2 g = vec2(atan(vP.x, vP.z) * 11.5, vP.y * 15.0); vec2 id = floor(g); vec2 fr = fract(g) - 0.5;
  float hh = h21(id); vec2 off = (vec2(h21(id + 7.1), h21(id + 3.3)) - 0.5) * 0.5;
  float r = 0.1 + 0.16 * hh;
  float bead = step(0.5, hh) * smoothstep(r, r * 0.5, length(fr - off));
  vec3 tint = mix(vec3(0.9, 0.95, 1.0), vec3(0.4, 0.48, 0.66), f);
  float a = (0.11 + f * 0.5 + spec * 0.6 + side * 0.25 + bead * 0.2) * uStrength * uFade;
  gl_FragColor = vec4(tint + vec3(spec * 0.5 + bead * 0.3), clamp(a, 0.0, 0.92));
  #include <colorspace_fragment>
}`;

export const shadowFrag = /* glsl */ `
precision highp float; varying vec2 vUv;
void main(){
  vec2 c = (vUv - 0.5) * 2.0;
  float a = pow(clamp(1.0 - length(c), 0.0, 1.0), 1.6) * 0.32;
  gl_FragColor = vec4(0.1, 0.07, 0.25, a);
  #include <colorspace_fragment>
}`;
