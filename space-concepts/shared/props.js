import { THREE, canvasTex, rnd, RW, RD } from './common.js';
export function rrect(w, d, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r);
  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d); s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
// value-noise fbm
const P = new Uint8Array(512); { const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) P[i] = p[i & 255]; }
const fade = t => t * t * (3 - 2 * t), h2 = (x, y) => P[P[x & 255] + (y & 255)] / 255;
export function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = fade(x - xi), yf = fade(y - yi); const a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1); return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf; }
export function fbm(x, y, o = 5) { let v = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { v += vnoise(x * f, y * f) * a; f *= 2; a *= 0.5; } return v; }
// tileable-in-x fbm on equirect: sample on cylinder
export function fbmEq(u, v, sc = 4, o = 5) { const a = u * Math.PI * 2; return fbm(Math.cos(a) * sc + 50, Math.sin(a) * sc + v * sc * 2 + 50, o); }
export function pixTex(w, h, fn, srgb = true) {
  return canvasTex(w, h, (x) => { const im = x.createImageData(w, h); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const [r, g, b, a = 255] = fn(i / w, j / h); const o = (j * w + i) * 4; im.data[o] = r; im.data[o + 1] = g; im.data[o + 2] = b; im.data[o + 3] = a; } x.putImageData(im, 0, 0); }, srgb);
}
export function atmosphere(radius, color, power = 3, intensity = 1.4) {
  const m = new THREE.ShaderMaterial({ uniforms: { c: { value: new THREE.Color(color) }, p: { value: power }, k: { value: intensity } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide,
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform vec3 c; uniform float p; uniform float k; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(clamp(1.0-abs(dot(vN,vV)),0.,1.), p); gl_FragColor = vec4(c*f*k, f); }' });
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 64), m);
}
export function panelTex(base = '#d9dee6', line = '#9aa3b0', seed = 1, w = 512) {
  return canvasTex(w, w, (x) => { x.fillStyle = base; x.fillRect(0, 0, w, w); for (let k = 0; k < 60; k++) { const px = Math.floor(rnd() * 8) * w / 8, py = Math.floor(rnd() * 8) * w / 8, sw = w / 8 * (1 + Math.floor(rnd() * 2)), sh = w / 8; x.fillStyle = `rgba(0,0,0,${rnd() * 0.07})`; x.fillRect(px, py, sw, sh); } x.strokeStyle = line; x.lineWidth = 2; for (let k = 0; k <= 8; k++) { x.beginPath(); x.moveTo(k * w / 8, 0); x.lineTo(k * w / 8, w); x.stroke(); x.beginPath(); x.moveTo(0, k * w / 8); x.lineTo(w, k * w / 8); x.stroke(); } for (let k = 0; k < 40; k++) { x.fillStyle = line; x.fillRect(rnd() * w, rnd() * w, 3, 3); } });
}
export function glowMat(color, k = 2) { return new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), toneMapped: false }); }
