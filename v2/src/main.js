import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { createDragon, STYLES } from './dragon2.js';
import { initTasks, openTask } from './tasks.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

const MOBILE = Math.min(innerWidth, innerHeight) < 600;
const ROOMS = [
  { name: 'Điều phối', icon: '🧭', color: 0x2f6bff, bots: ['Captain', 'Tác vụ', 'dr eggbot'] },
  { name: 'Sàn TMĐT', icon: '🛒', color: 0xff7a1a, bots: ['Shopee Bot', 'Tiktok Shop Bot'] },
  { name: 'Marketing', icon: '📣', color: 0xf5c518, bots: ['Tiktok MKT', 'Facebook MKT', 'AI Cinametic'] },
  { name: 'Nghiên cứu', icon: '🔬', color: 0x22c55e, bots: ['Kalodata Bot', 'Douyin Bot', 'Soi Quảng Cáo FB'] },
  { name: 'Chăm sóc khách', icon: '💬', color: 0xe639c8, bots: ['Pancake Bot', 'Hỏi Đáp'] },
  { name: 'Vận hành', icon: '🚚', color: 0xef3b3b, bots: ['GHTK-bot', 'Kiot Viet-bot'] },
  { name: 'Web & Hỗ trợ', icon: '🌐', color: 0x8b5cf6, bots: ['Website-PF', 'Pearlfarm Bot'] },
];
const CHAR_FILES = ['female-a', 'male-a', 'female-b', 'male-b', 'female-c', 'male-c', 'female-d', 'male-e'];
const RADIUS = 19.5, RW = 9.6, RD = 7.6, FS = 2.7, CS = 2.5;

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: !MOBILE, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = MOBILE ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.getElementById('app').appendChild(renderer.domElement);
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
labelRenderer.domElement.className = 'labels';
document.getElementById('app').appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc9d6d4);
scene.fog = new THREE.Fog(0xc9d6d4, 120, 230);
const camera = new THREE.PerspectiveCamera(MOBILE ? 50 : 38, innerWidth / innerHeight, 0.5, 400);
const HOME = MOBILE ? new THREE.Vector3(0, 112, 46) : new THREE.Vector3(0, 44, 50);
camera.position.copy(HOME);
const controls = new OrbitControls(camera, labelRenderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.maxPolarAngle = 1.2; controls.minDistance = 10; controls.maxDistance = 140;
controls.target.set(0, 0, MOBILE ? 0 : 1);

scene.add(new THREE.HemisphereLight(0xe8f2ff, 0x3d5a34, 1.5));
const sun = new THREE.DirectionalLight(0xfff1dd, 2.4);
sun.position.set(-18, 34, 22); sun.castShadow = true;
const sm = MOBILE ? 1024 : 2048;
sun.shadow.mapSize.set(sm, sm);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 90 });
sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03;
scene.add(sun);

// lake water
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
{
  const pm = new THREE.PMREMGenerator(renderer), es = canvasTex(64, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#8fb9e0'); g.addColorStop(0.48, '#e9f2f4'); g.addColorStop(0.52, '#5f8a6a'); g.addColorStop(1, '#2c4a3c'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  es.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = pm.fromEquirectangular(es).texture;
}
const waterTex = (() => {
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), im = x.createImageData(N, N);
  const W = []; for (let k = 0; k < 10; k++) W.push([1 + Math.floor(Math.random() * 6), (1 + Math.floor(Math.random() * 6)) * (Math.random() < .5 ? -1 : 1), Math.random() * 6.28, 0.5 / (k + 1)]);
  const P = 2 * Math.PI / N;
  for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) { let dx = 0, dy = 0; for (const [a, b, ph, amp] of W) { const v = Math.cos((a * xx + b * yy) * P + ph) * amp; dx += v * a; dy += v * b; } const o = (yy * N + xx) * 4; im.data[o] = 128 + dx * 9; im.data[o + 1] = 128 + dy * 9; im.data[o + 2] = 255; im.data[o + 3] = 255; }
  x.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(22, 22); return t;
})();
const waterTex2 = waterTex.clone(); waterTex2.repeat.set(9, 9); waterTex2.needsUpdate = true;
const waterMat = new THREE.MeshPhysicalMaterial({ color: 0x2f7f7a, roughness: 0.08, metalness: 0, normalMap: waterTex, normalScale: new THREE.Vector2(0.35, 0.35), clearcoat: 1, clearcoatRoughness: 0.05, clearcoatNormalMap: waterTex2, clearcoatNormalScale: new THREE.Vector2(0.25, 0.25), envMapIntensity: 1.1, transparent: true, opacity: 0.88 });
const ground = new THREE.Mesh(new THREE.CircleGeometry(90, 96), waterMat);
const lakeBed = new THREE.Mesh(new THREE.CircleGeometry(90, 48), new THREE.MeshStandardMaterial({ color: 0x1d4a3e, roughness: 1 })); lakeBed.rotation.x = -Math.PI / 2; lakeBed.position.y = -1.2;
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground); scene.add(lakeBed);
const stars = { rotation: { y: 0 } };
// distant shore trees
{
  const tm = new THREE.MeshStandardMaterial({ color: 0x3f6b35, roughness: 1 }), tg = new THREE.IcosahedronGeometry(1, 1);
  for (let i = 0; i < 160; i++) { const a = i / 160 * Math.PI * 2 + Math.random() * 0.03, r = 66 + Math.random() * 8, t = new THREE.Mesh(tg, tm); t.position.set(Math.cos(a) * r, 2 + Math.random() * 2, Math.sin(a) * r); t.scale.set(3 + Math.random() * 2, 3 + Math.random() * 3, 3 + Math.random() * 2); scene.add(t); }
}

// ---------- models ----------
const manager = new THREE.LoadingManager();
manager.setURLModifier(u => u.includes('colormap') ? 'data:image/png;base64,' + window.MODELS['colormap.png'] : u);
const loader = new GLTFLoader(manager);
const b64 = s => { const bin = atob(s), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a.buffer; };
const load = f => new Promise((res, rej) => loader.parse(b64(window.MODELS[f]), '', res, rej));
const PROTO = {};
function centered(scene0, s) {
  const g = new THREE.Group(); const inner = scene0.clone(true); inner.scale.setScalar(s);
  const bb = new THREE.Box3().setFromObject(inner); const c = bb.getCenter(new THREE.Vector3());
  inner.position.set(-c.x, -bb.min.y, -c.z); g.add(inner);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
function put(name, parent, x, y, z, ry = 0, s = FS) {
  const o = centered(PROTO[name], s); o.position.set(x, y, z); o.rotation.y = ry; parent.add(o); return o;
}

// ---------- helpers ----------
function rrect(w, d, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r);
  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d); s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
function dashTexture(color) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 8; const g = c.getContext('2d');
  g.fillStyle = color; g.fillRect(0, 2, 34, 4);
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
function screenTexture(hex, seed) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 96; const g = c.getContext('2d');
  g.fillStyle = '#0b1220'; g.fillRect(0, 0, 128, 96);
  const col = '#' + new THREE.Color(hex).getHexString();
  if (seed % 2) { g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); for (let i = 0; i < 9; i++) g.lineTo(8 + i * 14, 78 - (Math.sin(i * 1.3 + seed) * 18 + i * 5)); g.stroke(); }
  else for (let i = 0; i < 8; i++) { g.fillStyle = i % 3 ? '#9fe8ff' : col; g.fillRect(10, 10 + i * 10, 20 + ((i * 37 + seed * 13) % 80), 5); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function label(html, cls) { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; return new CSS2DObject(d); }

// ---------- brain ----------
const brain = new THREE.Group(); scene.add(brain);
const TOP = 10.2;
{
  // island: irregular grassy blob
  const sh = new THREE.Shape(); const N = 40;
  for (let k = 0; k <= N; k++) { const a = k / N * Math.PI * 2, r = 6.3 + Math.sin(a * 3 + 1) * 0.45 + Math.sin(a * 5) * 0.25; const p = [Math.cos(a) * r * 1.15, Math.sin(a) * r * 0.95]; k ? sh.lineTo(...p) : sh.moveTo(...p); }
  const isl = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.7, bevelEnabled: true, bevelSize: 0.35, bevelThickness: 0.2, bevelSegments: 2 }), new THREE.MeshStandardMaterial({ color: 0x6f9a45, roughness: 1 }));
  isl.rotation.x = -Math.PI / 2; isl.position.y = -0.3; isl.receiveShadow = true; brain.add(isl);
  const shrubM = [0x3f7a2c, 0x4e8c33, 0x5c9a3a].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true })), sg = new THREE.IcosahedronGeometry(1, 1);
  for (let k = 0; k < 70; k++) { const a = Math.random() * Math.PI * 2, r = 6.3 + Math.sin(a * 3 + 1) * 0.45 - Math.random() * 0.6; if (Math.abs(Math.sin(a)) < 0.25 && Math.cos(a) > 0) continue; const b = new THREE.Mesh(sg, shrubM[k % 3]); b.position.set(Math.cos(a) * r * 1.15, 0.55, -Math.sin(a) * r * 0.95); b.scale.set(0.6 + Math.random() * 0.5, 0.45 + Math.random() * 0.4, 0.6 + Math.random() * 0.5); b.castShadow = true; brain.add(b); }
  // tower
  const stone = new THREE.MeshStandardMaterial({ color: 0xb9b6ac, roughness: 0.95, map: canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#d0cdc4'; x.fillRect(0, 0, w, h); for (let k = 0; k < 900; k++) { x.fillStyle = `rgba(${60 + Math.random() * 40},${60 + Math.random() * 40},55,${Math.random() * 0.12})`; const px = Math.random() * w; x.fillRect(px, Math.random() * h, 2 + Math.random() * 10, 4 + Math.random() * 40); } }) });
  const dark = new THREE.MeshStandardMaterial({ color: 0x6d6a62, roughness: 1 });
  const voidM = new THREE.MeshStandardMaterial({ color: 0x1d1c1a, roughness: 1 });
  function archWall(w, h, n, aw, ah) {
    const s2 = new THREE.Shape(); s2.moveTo(-w / 2, 0); s2.lineTo(w / 2, 0); s2.lineTo(w / 2, h); s2.lineTo(-w / 2, h); s2.lineTo(-w / 2, 0);
    for (let k = 0; k < n; k++) { const cx = (k - (n - 1) / 2) * (w / n), hp = new THREE.Path(); hp.moveTo(cx - aw / 2, 0.25); hp.lineTo(cx + aw / 2, 0.25); hp.lineTo(cx + aw / 2, ah - aw / 2); hp.absarc(cx, ah - aw / 2, aw / 2, 0, Math.PI, false); hp.lineTo(cx - aw / 2, 0.25); s2.holes.push(hp); }
    return new THREE.ExtrudeGeometry(s2, { depth: 0.22, bevelEnabled: false, curveSegments: 10 });
  }
  function tier(y, W, D, H, nW, nD, aw, ah) {
    const g = new THREE.Group(); g.position.y = y; brain.add(g);
    for (const [len, n, rot, off] of [[W, nW, 0, D / 2], [W, nW, Math.PI, D / 2], [D, nD, Math.PI / 2, W / 2], [D, nD, -Math.PI / 2, W / 2]]) {
      const m = new THREE.Mesh(archWall(len, H, n, aw, ah), stone); m.rotation.y = rot; m.position.set(Math.sin(rot) * (off - 0.22), 0, Math.cos(rot) * (off - 0.22)); m.castShadow = m.receiveShadow = true; g.add(m);
    }
    const core = new THREE.Mesh(new THREE.BoxGeometry(W - 1.0, H, D - 1.0), voidM); core.position.y = H / 2; g.add(core);
    for (const [px, pz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.42, H + 0.1, 0.42), stone); p.position.set(px * (W / 2 - 0.1), H / 2, pz * (D / 2 - 0.1)); p.castShadow = true; g.add(p); }
    const cor = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, 0.28, D + 0.5), dark); cor.position.y = H + 0.14; cor.castShadow = true; g.add(cor);
    const par = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, 0.35, D + 0.3), stone); par.position.y = H + 0.45; g.add(par);
    return g;
  }
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.5, 4.4), dark); plinth.position.y = 0.65; plinth.receiveShadow = true; brain.add(plinth);
  const steps = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 1.2), stone); steps.position.set(0, 0.55, 2.7); brain.add(steps);
  tier(0.9, 5.0, 3.8, 3.0, 3, 2, 0.9, 2.3);
  tier(4.65, 3.8, 2.8, 2.2, 3, 1, 0.65, 1.6);
  const t3 = tier(7.65, 2.5, 2.0, 1.4, 1, 1, 0.6, 1.1);
  const ow = new THREE.Mesh(new THREE.CircleGeometry(0.32, 20), voidM); ow.position.set(0, 0.75, 1.02); t3.add(ow);
  // roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.95, 0.9, 4, 1), new THREE.MeshStandardMaterial({ color: 0x8a8070, roughness: 1 })); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.8; roof.position.y = 9.85 - 0.3; roof.castShadow = true; brain.add(roof);
  for (const [px, pz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 6), dark); e.position.set(px * 1.45, 9.6, pz * 1.15); e.rotation.set(pz * 0.6, 0, -px * 0.6); brain.add(e); }
  const fin = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffe6a0, emissive: 0xffc860, emissiveIntensity: 0.4 })); fin.position.y = TOP; brain.add(fin);
}
const orb = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 20), new THREE.MeshStandardMaterial({ color: 0xbff6ff, emissive: 0x5fdcff, emissiveIntensity: 1.2, roughness: 0.2 }));
orb.position.y = TOP + 2.2; brain.add(orb);
const orbLight = new THREE.PointLight(0x5ee7ff, 30, 14, 1.6); orbLight.position.y = TOP + 2.2; brain.add(orbLight);
const shells = [];
for (let i = 0; i < 2; i++) {
  const s = new THREE.Mesh(new THREE.TorusGeometry(1.0 + i * 0.35, 0.025, 6, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x9ff0ff).multiplyScalar(1.6), transparent: true, opacity: 0.8 }));
  s.position.y = TOP + 2.2; s.rotation.set(Math.random() * 3, Math.random() * 3, 0); brain.add(s); shells.push(s);
}
const beamFade = canvasTex(4, 256, (x, w, h) => { const g = x.createLinearGradient(0, h, 0, 0); g.addColorStop(0, '#000'); g.addColorStop(0.12, '#888'); g.addColorStop(0.35, '#fff'); g.addColorStop(1, '#666'); x.fillStyle = g; x.fillRect(0, 0, w, h); }); beamFade.colorSpace = THREE.NoColorSpace;
const beamMat = new THREE.MeshBasicMaterial({ alphaMap: beamFade, color: 0x7fe9ff, transparent: true, opacity: 0.26, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.9, 30, 32, 1, true), beamMat); beam.position.y = TOP + 16.5; brain.add(beam);
const beam2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 30, 16, 1, true), new THREE.MeshBasicMaterial({ alphaMap: beamFade, color: 0xffffff, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false })); beam2.position.y = TOP + 16.5; brain.add(beam2);
const sparks = [];
{
  const g = new THREE.SphereGeometry(0.07, 8, 6), m = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xc8f7ff).multiplyScalar(3) });
  for (let i = 0; i < 40; i++) { const s = new THREE.Mesh(g, m); s.userData = { r: 0.8 + Math.random() * 1.6, a: Math.random() * 6.28, y: TOP + 1.6 + Math.random() * 3, sp: 0.2 + Math.random() * 0.6 }; brain.add(s); sparks.push(s); }
}
const brainLabel = label('<b>THÁP RÙA · BỘ NÃO</b><span>Captain điều phối · bộ nhớ chung</span>', 'brain-label');
brainLabel.position.set(0, 0.8, MOBILE ? 4 : 7.6); brain.add(brainLabel);

// ---------- turtles & birds ----------
const turtles = [], birds = [];
{
  const shellM = new THREE.MeshStandardMaterial({ color: 0x5b6b2e, roughness: 0.6, flatShading: true }), skinM = new THREE.MeshStandardMaterial({ color: 0x8f9a55, roughness: 0.8 });
  const rim = new THREE.MeshStandardMaterial({ color: 0xc2b46a, roughness: 0.7 });
  const flG = new THREE.BoxGeometry(0.9, 0.08, 0.32); flG.translate(0.42, 0, 0);
  [[10.2, 0.13, 0], [11.5, -0.1, 2.1], [9.6, 0.11, 4.2], [30, 0.07, 1], [32, -0.06, 3.5], [29, 0.08, 5.3]].forEach(([r, sp, a0], k) => {
    const g = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), shellM); shell.scale.set(1, 0.45, 1.25); g.add(shell);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.07, 5, 20), rim); ring.rotation.x = Math.PI / 2; ring.scale.y = 1.25; g.add(ring);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), skinM); head.scale.set(1, 0.8, 1.3); head.position.set(0, 0.05, 1.35); g.add(head);
    const fl = [];
    for (const [sx, z] of [[1, 0.55], [-1, 0.55], [1, -0.75], [-1, -0.75]]) { const f = new THREE.Mesh(flG, skinM); f.position.set(sx * 0.7, -0.02, z); f.scale.set(sx * (z > 0 ? 1 : 0.6), 1, 1); g.add(f); fl.push(f); }
    g.scale.setScalar(1.25); g.traverse(o => o.castShadow = true); scene.add(g);
    turtles.push({ g, head, fl, r, sp, a: a0, ph: k * 1.7 });
  });
  const bm = new THREE.MeshStandardMaterial({ color: 0x3a3a40, side: THREE.DoubleSide, roughness: 0.9 });
  const wG = new THREE.BufferGeometry(); wG.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.25, 0, 0, -0.25, 1.1, 0, -0.1], 3)); wG.computeVertexNormals();
  for (let k = 0; k < 11; k++) {
    const g = new THREE.Group(), body = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.8, 6), bm); body.rotation.x = Math.PI / 2; g.add(body);
    const L = new THREE.Mesh(wG, bm), R = new THREE.Mesh(wG, bm); R.scale.x = -1; g.add(L, R);
    g.scale.setScalar(1.4); scene.add(g);
    birds.push({ g, L, R, off: new THREE.Vector3((Math.random() - .5) * 5, (Math.random() - .5) * 2, (Math.random() - .5) * 5), ph: Math.random() * 6, flock: k < 7 ? 0 : 1 });
  }
}
// ---------- dragon ----------
const dragon = (() => {
  const N = 64, segs = [], gold = new THREE.MeshStandardMaterial({ color: 0xd9a52b, metalness: 0.55, roughness: 0.35, flatShading: true, emissive: 0x3a2400, emissiveIntensity: 0.4 });
  const jade = new THREE.MeshStandardMaterial({ color: 0x2fa37a, metalness: 0.3, roughness: 0.4, flatShading: true });
  const red = new THREE.MeshStandardMaterial({ color: 0xd42a1e, roughness: 0.5, emissive: 0x500000, emissiveIntensity: 0.5, side: THREE.DoubleSide });
  const cream = new THREE.MeshStandardMaterial({ color: 0xf3e2b0, roughness: 0.6 });
  const root = new THREE.Group(); scene.add(root);
  const segG = new THREE.IcosahedronGeometry(1, 1), bellyG = new THREE.SphereGeometry(0.8, 8, 6), finG = new THREE.ConeGeometry(0.35, 1.0, 4); finG.translate(0, 0.5, 0);
  const legG = new THREE.CylinderGeometry(0.12, 0.08, 1.0, 5); legG.translate(0, -0.5, 0); const clawG = new THREE.ConeGeometry(0.08, 0.3, 4);
  for (let i = 0; i < N; i++) {
    const k = i / (N - 1), r = 1.1 * Math.sin(Math.min(1, k * 1.1 + 0.12) * Math.PI * 0.95) * (1 - k * 0.55) + 0.12;
    const g = new THREE.Group(); root.add(g);
    const b = new THREE.Mesh(segG, i % 5 === 2 ? jade : gold); b.scale.set(r, r * 0.95, r * 1.9); g.add(b);
    const bl = new THREE.Mesh(bellyG, cream); bl.scale.set(r * 0.85, r * 0.6, r * 1.7); bl.position.y = -r * 0.42; g.add(bl);
    if (i % 3 === 0 && i > 2 && i < N - 3) { const f = new THREE.Mesh(finG, red); f.scale.set(r * 0.9, r * 1.4, r * 1.2); f.position.y = r * 0.7; f.rotation.x = -0.5; g.add(f); }
    if (i === 9 || i === 40) for (const s of [-1, 1]) {
      const leg = new THREE.Group(); leg.position.set(s * r * 0.8, -r * 0.3, 0); leg.rotation.z = s * 0.9; g.add(leg);
      const l = new THREE.Mesh(legG, gold); leg.add(l); for (const c of [-0.12, 0, 0.12]) { const cl = new THREE.Mesh(clawG, cream); cl.position.set(c, -1.05, 0.08); cl.rotation.x = Math.PI; leg.add(cl); }
      g.userData.legs = (g.userData.legs || []).concat(leg);
    }
    segs.push({ g, r });
  }
  // tail tuft
  const tuft = new THREE.Group(); segs[N - 1].g.add(tuft);
  for (let k = 0; k < 6; k++) { const f = new THREE.Mesh(finG, red); f.scale.set(0.5, 1.6, 0.5); f.rotation.set(Math.PI / 2 + (k - 2.5) * 0.25, 0, (k % 2 - 0.5) * 0.6); tuft.add(f); }
  // head
  const head = new THREE.Group(); root.add(head);
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), gold); skull.scale.set(0.9, 0.75, 1.1); head.add(skull);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 1.3), gold); snout.position.set(0, -0.1, 1.1); head.add(snout);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.2, 1.1), red); jaw.position.set(0, -0.45, 1.0); jaw.rotation.x = 0.25; head.add(jaw);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), red); nose.position.set(0, 0.12, 1.75); head.add(nose);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff27a })); eye.position.set(s * 0.45, 0.35, 0.65); head.add(eye);
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.4, 6), cream); horn.position.set(s * 0.35, 0.9, -0.5); horn.rotation.set(-1.0, 0, s * -0.3); head.add(horn);
    const wp = [0, 1, 2, 3, 4].map(k => new THREE.Vector3(s * (0.4 + k * 0.45), -0.1 - Math.sin(k) * 0.25, 1.6 - k * 0.55));
    const wh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wp), 12, 0.04, 4), cream); head.add(wh);
  }
  for (let k = 0; k < 7; k++) { const m = new THREE.Mesh(finG, red); m.scale.set(0.6, 1.5, 0.5); m.position.set((k - 3) * 0.2, 0.4, -0.7); m.rotation.set(-2.2 + Math.abs(k - 3) * 0.1, 0, (k - 3) * 0.25); head.add(m); }
  head.scale.setScalar(1.45);
  // pearl
  const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 14), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff0c0, emissiveIntensity: 1.6 })); scene.add(pearl);
  const pl = new THREE.PointLight(0xffe7a0, 25, 12, 1.6); pearl.add(pl);
  root.traverse(o => o.castShadow = true); head.traverse(o => o.castShadow = true);
  const P = (u, out = new THREE.Vector3()) => out.set(Math.sin(u) * (25 + Math.sin(u * 3) * 3), 11 + Math.sin(u * 2) * 3, Math.cos(u) * (21 + Math.sin(u * 3) * 3));
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), side = new THREE.Vector3();
  function update(t) {
    const u0 = t * 0.11 + (window.__dragonPhase || 0), ds = 0.018;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const u = u0 - i * ds, p = P(u, new THREE.Vector3()), n = P(u + 0.01, tmp).sub(p).normalize();
      side.crossVectors(n, up).normalize();
      const w = Math.sin(i * 0.45 - t * 4.0) * 1.1 * Math.min(1, i / 6);
      p.addScaledVector(side, w); p.y += Math.cos(i * 0.32 - t * 3.0) * 0.9 * Math.min(1, i / 6);
      pts.push(p);
    }
    head.position.copy(pts[0]); head.lookAt(tmp2.copy(pts[0]).multiplyScalar(2).sub(pts[1]));
    for (let i = 0; i < N; i++) {
      const s = segs[i].g; s.position.copy(pts[i + 1]); s.lookAt(pts[i]);
      if (s.userData.legs) s.userData.legs.forEach((l, k) => l.rotation.x = Math.sin(t * 3 + k * Math.PI) * 0.5);
    }
    jaw.rotation.x = 0.25 + Math.sin(t * 2) * 0.15;
    P(u0 + 0.09, pearl.position); pearl.position.y += Math.sin(t * 2) * 0.5;
  }
  return { update, hide() { root.visible = false; head.visible = false; pearl.visible = false; }, P };
})();

window.__birds = birds;
const DSEL = (new URLSearchParams(location.search).get('dragon') || 'D').toUpperCase();
const dragonImpl = STYLES[DSEL] ? (dragon.hide(), createDragon(scene, DSEL, camera, controls, dragon.P)) : dragon;
function updateFauna(dt, t) {
  dragonImpl.update(t, dt);
  for (const T of turtles) {
    T.a += dt * T.sp * 0.25;
    const wob = Math.sin(t * 0.3 + T.ph) * 1.2, x = Math.sin(T.a) * (T.r + wob), z = Math.cos(T.a) * (T.r + wob);
    const surf = Math.max(0, Math.sin(t * 0.25 + T.ph)) ** 6;
    T.g.position.set(x, -0.28 + surf * 0.33 + Math.sin(t * 1.3 + T.ph) * 0.03, z);
    T.g.rotation.y = Math.atan2(Math.cos(T.a) * Math.sign(T.sp), -Math.sin(T.a) * Math.sign(T.sp)); T.g.rotation.z = Math.sin(t * 1.1 + T.ph) * 0.05;
    T.head.position.y = 0.05 + surf * 0.25;
    T.fl.forEach((f, i) => f.rotation.y = Math.sin(t * 2.6 + T.ph + (i % 2 ? Math.PI : 0) + (i > 1 ? 1 : 0)) * 0.45 * (i % 2 ? -1 : 1));
  }
  const c = [new THREE.Vector3(Math.sin(t * 0.12) * 26, 17 + Math.sin(t * 0.3) * 2, Math.sin(t * 0.24) * 16), new THREE.Vector3(Math.cos(t * 0.1 + 2) * 34, 21 + Math.cos(t * 0.27) * 2, Math.sin(t * 0.1 + 2) * 30)];
  const n = [new THREE.Vector3(Math.cos(t * 0.12) * 26 * 0.12, 0, Math.cos(t * 0.24) * 16 * 0.24), new THREE.Vector3(-Math.sin(t * 0.1 + 2) * 3.4, 0, Math.cos(t * 0.1 + 2) * 3)];
  for (const B of birds) {
    const p = c[B.flock].clone().add(B.off); p.y += Math.sin(t * 0.8 + B.ph) * 0.4; B.g.position.copy(p);
    const d = n[B.flock]; B.g.rotation.set(0, Math.atan2(d.x, d.z), 0);
    const f = Math.sin(t * 9 + B.ph) * 0.7; B.L.rotation.z = f; B.R.rotation.z = -f;
  }
}

// ---------- rooms, paths ----------
const bots = []; const rooms = []; const dashTex = []; const hitBoxes = [];
const walkers = []; const boats = [];

const woodM = new THREE.MeshStandardMaterial({ color: 0x5a2e1c, roughness: 0.75 });
const deckM = new THREE.MeshStandardMaterial({ map: canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#9a6a42'; x.fillRect(0, 0, w, h); for (let k = 0; k < 16; k++) { x.fillStyle = k % 2 ? '#8d5f3a' : '#a37349'; x.fillRect(0, k * 16, w, 15); x.fillStyle = '#5c3b22'; x.fillRect(0, k * 16 + 15, w, 1); } }), roughness: 0.85 });
const sailTex = canvasTex(256, 512, (x, w, h) => { x.fillStyle = '#d8332a'; x.fillRect(0, 0, w, h); for (let k = 0; k < 7; k++) { const y = k * h / 7; x.fillStyle = 'rgba(120,10,10,0.55)'; x.fillRect(0, y, w, 5); } x.strokeStyle = 'rgba(255,140,120,0.25)'; x.lineWidth = 2; for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(k * 50, 0); x.lineTo(k * 50 + 30, h); x.stroke(); } });
const flagTex = canvasTex(120, 80, (x, w, h) => { x.fillStyle = '#da251d'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffde00'; x.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 9 : 22, an = -Math.PI / 2 + k * Math.PI / 5; x.lineTo(60 + Math.cos(an) * r, 40 + Math.sin(an) * r); } x.fill(); });
function makeBoat(col) {
  const group = new THREE.Group();
  // hull outline (long axis x), pointed bow at +x, squarer stern at -x
  const L = RW / 2 + 1.6, B = RD / 2 + 0.1, sh = new THREE.Shape();
  sh.moveTo(-L + 0.4, -B * 0.85); sh.quadraticCurveTo(L * 0.4, -B * 1.08, L + 0.6, 0); sh.quadraticCurveTo(L * 0.4, B * 1.08, -L + 0.4, B * 0.85); sh.quadraticCurveTo(-L - 0.2, 0, -L + 0.4, -B * 0.85);
  const hg = new THREE.ExtrudeGeometry(sh, { depth: 1.6, bevelEnabled: false, curveSegments: 18 });
  const pos = hg.attributes.position; for (let k = 0; k < pos.count; k++) { const z = pos.getZ(k); if (z > 1.59) { pos.setX(k, pos.getX(k) * 0.82); pos.setY(k, pos.getY(k) * 0.55); } }
  hg.computeVertexNormals();
  const hull = new THREE.Mesh(hg, woodM); hull.rotation.x = Math.PI / 2; hull.position.y = 0.45; hull.castShadow = hull.receiveShadow = true; group.add(hull);
  const deck = new THREE.Mesh(new THREE.ShapeGeometry(sh, 18), deckM); deck.rotation.x = -Math.PI / 2; deck.position.y = 0.452; deck.receiveShadow = true;
  const uv = deck.geometry.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * 0.12, uv.getY(k) * 0.12); group.add(deck);
  // gunwale rail in team colour + raised stern
  const pts = sh.getSpacedPoints(80).map(p => new THREE.Vector3(p.x, 0.62, -p.y));
  const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 120, 0.09, 6, true), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.35, roughness: 0.5 })); group.add(rail);
  const stern = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, B * 1.5), woodM); stern.position.set(-L + 0.4, 0.95, 0); stern.castShadow = true; group.add(stern);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, B * 1.55), rail.material); trim.position.set(-L + 1.12, 1.5, 0); group.add(trim);
  // masts + batten sails (in the boat's x-y plane, behind the desks)
  const sails = [];
  const sailM = new THREE.MeshStandardMaterial({ map: sailTex, emissive: 0x5a0a06, emissiveIntensity: 0.6, side: THREE.DoubleSide, roughness: 0.8, transparent: true, opacity: 1, depthWrite: true });
  for (const [mx, H, W] of [[-2.6, 7.0, 3.6], [1.6, 8.6, 4.4]]) {
    const mz = -RD / 2 + 0.25;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, H + 1.2, 8), woodM); mast.position.set(mx, 0.45 + (H + 1.2) / 2, mz); mast.castShadow = true; group.add(mast);
    const ss = new THREE.Shape(); ss.moveTo(-W * 0.35, 0); ss.lineTo(W * 0.65, 0); ss.quadraticCurveTo(W * 0.75, H * 0.6, W * 0.45, H); ss.lineTo(-W * 0.25, H * 0.94); ss.quadraticCurveTo(-W * 0.45, H * 0.5, -W * 0.35, 0);
    const sg = new THREE.ShapeGeometry(ss, 12); const sp = sg.attributes.position, suv = sg.attributes.uv;
    for (let k = 0; k < sp.count; k++) { suv.setXY(k, (sp.getX(k) + W * 0.45) / (W * 1.2), sp.getY(k) / H); sp.setZ(k, Math.sin((sp.getX(k) + W * 0.35) / W * Math.PI) * 0.35); }
    sg.computeVertexNormals();
    const sail = new THREE.Mesh(sg, sailM); sail.position.set(mx, 2.2, mz + 0.12); sail.castShadow = true; group.add(sail); sails.push(sail);
    for (let k = 0; k <= 6; k++) { const bt = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, W * 1.05, 5), woodM); bt.rotation.z = Math.PI / 2; bt.position.set(W * 0.15, k * H / 6.3, 0.36); sail.add(bt); }
    const pen = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.35), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide })); pen.position.set(mx + 0.47, 0.45 + H + 1.0, mz); group.add(pen); sails.push(pen);
  }
  // Vietnam flag on the bow
  const fp = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), new THREE.MeshStandardMaterial({ color: 0xeeeeee })); fp.position.set(L - 0.2, 1.65, 0); group.add(fp);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.66, 8, 1), new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: 0.8 })); flag.position.set(L + 0.3, 2.5, 0); group.add(flag);
  return { group, sails, sailM, flag };
}
const _cv = new THREE.Vector3();
function updateBoat(b) {
  const t = clock.elapsedTime;
  b.g.position.y = Math.sin(t * 0.9 + b.ph) * 0.06; b.g.rotation.z = Math.sin(t * 0.7 + b.ph) * 0.012;
  const fp = b.flag.geometry.attributes.position; for (let k = 0; k < fp.count; k++) fp.setZ(k, Math.sin(fp.getX(k) * 5 + t * 5) * 0.06 * (fp.getX(k) + 0.5)); fp.needsUpdate = true;
  // fade sails that sit between camera and deck
  _cv.subVectors(camera.position, b.g.position).setY(0).normalize();
  const out = new THREE.Vector3(Math.sin(b.a), 0, Math.cos(b.a));
  const o = THREE.MathUtils.clamp(1.15 - Math.max(0, _cv.dot(out)) * 1.2, 0.3, 1); b.sailM.opacity = o; b.sailM.depthWrite = o > 0.95;
}

function buildRoom(R, idx) {
  const a = idx / ROOMS.length * Math.PI * 2;
  const g = new THREE.Group(); g.position.set(Math.sin(a) * RADIUS, 0, Math.cos(a) * RADIUS); g.rotation.y = a + Math.PI; scene.add(g);
  const col = new THREE.Color(R.color);
  const boat = makeBoat(col); g.add(boat.group); boats.push({ ...boat, g, a, ph: idx * 0.9 });
  const Y = 0.45;
  put('rugRectangle', g, -0.6, Y + 0.005, -0.6, 0, 3.0);
  put('pottedPlant', g, -RW / 2 + 0.8, Y, -RD / 2 + 0.8);
  put('pottedPlant', g, RW / 2 - 0.8, Y, RD / 2 - 0.9);
  put('lampRoundFloor', g, RW / 2 - 0.7, Y, -RD / 2 + 0.7);
  const sofa = put('loungeSofaLong', g, RW / 2 - 1.05, Y, 1.0, -Math.PI / 2);
  const lampLight = new THREE.PointLight(0xffd9a0, MOBILE ? 0 : 6, 7, 2); lampLight.position.set(RW / 2 - 0.7, Y + 2.4, -RD / 2 + 0.7); g.add(lampLight);
  const n = R.bots.length, room = { def: R, group: g, bots: [], angle: a };
  R.bots.forEach((name, i) => {
    const x = (i - (n - 1) / 2) * 2.5 - 0.3;
    const dz = -RD / 2 + 1.25;
    put('desk', g, x, Y, dz, Math.PI);
    const screens = [];
    for (const sx of [-0.42, 0.42]) {
      const s = put('computerScreen', g, x + sx, Y + 1.03, dz - 0.15, (sx > 0 ? -0.2 : 0.2));
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.6), new THREE.MeshBasicMaterial({ map: screenTexture(R.color, i * 2 + (sx > 0)), color: 0xffffff }));
      glow.position.set(0, 0.42, 0.08); s.add(glow); screens.push(glow);
    }
    put('computerKeyboard', g, x, Y + 1.03, dz + 0.22, Math.PI);
    put('chairDesk', g, x, Y, dz + 1.0, 0);
    room.bots.push(makeBot(name, room, i, new THREE.Vector3(x, Y + 0.38, dz + 0.95), new THREE.Vector3(RW / 2 - 1.05, Y + 0.35, 0.1 + i * 0.95), screens));
  });
  const lab = label('', 'room-label'); lab.position.set(0, MOBILE ? 2 : 0.6, MOBILE ? 0 : RD / 2 + 1.5); g.add(lab); room.label = lab;
  lab.element.style.setProperty('--c', '#' + col.getHexString());
  // path
  const len = RADIUS - RD / 2 - 6.4;
  const path = new THREE.Group(); path.rotation.y = a; scene.add(path);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(1.8, len), deckM);
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0.2, 6.4 + len / 2); road.receiveShadow = true; path.add(road);
  const t = dashTexture('#' + col.clone().lerp(new THREE.Color(0xffffff), 0.3).getHexString()); t.repeat.set(len / 1.4, 1); dashTex.push(t);
  const dash = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.18), new THREE.MeshBasicMaterial({ map: t, transparent: true, color: new THREE.Color(1.8, 1.8, 1.8) }));
  dash.rotation.set(-Math.PI / 2, 0, Math.PI / 2); dash.position.set(0, 0.22, 6.4 + len / 2); path.add(dash);
  room.pathStart = new THREE.Vector3(Math.sin(a) * 7, 0.05, Math.cos(a) * 7); room.pathEnd = new THREE.Vector3(Math.sin(a) * (RADIUS - RD / 2 - 0.6), 0.05, Math.cos(a) * (RADIUS - RD / 2 - 0.6));
  rooms.push(room);
}

function makeChar(i) {
  const gl = PROTO['char' + (i % CHAR_FILES.length)];
  const c = SkeletonUtils.clone(gl.scene); c.scale.setScalar(CS);
  c.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  const mixer = new THREE.AnimationMixer(c);
  const act = {}; for (const clip of gl.animations) act[clip.name] = mixer.clipAction(clip);
  return { obj: c, mixer, act };
}
function play(b, name) { if (b.cur === name) return; const n = b.act[name]; n.reset().fadeIn(0.25).play(); if (b.cur) b.act[b.cur].fadeOut(0.25); b.cur = name; }
let charIdx = 0;
function makeBot(name, room, i, desk, sofa, screens) {
  const ch = makeChar(charIdx++);
  const holder = new THREE.Group(); holder.add(ch.obj); room.group.add(holder);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2, 1.1), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 0.9; holder.add(hit);
  const lab = label('', 'bot-label'); lab.position.set(0, 2.25, 0); holder.add(lab);
  const b = { name, room, holder, screens, desk, sofa, working: false, task: '', ...ch, label: lab, move: null, cur: null };
  hit.userData.bot = b; hitBoxes.push(hit);
  placeBot(b, true); bots.push(b); return b;
}
function seatFor(b) { return b.working ? { p: b.desk, ry: Math.PI } : { p: b.sofa, ry: Math.PI / 2 }; }
function placeBot(b, instant) {
  const s = seatFor(b);
  b.screens.forEach(m => { m.material.color.setScalar(b.working ? 1.6 : 0.12); });
  b.label.element.innerHTML = `<i class="${b.working ? 'on' : 'off'}"></i>${b.name}`;
  b.label.element.classList.toggle('busy', b.working);
  if (instant) { b.holder.position.copy(s.p); b.holder.rotation.y = s.ry; play(b, b.working ? 'sit' : 'sit'); return; }
  const from = b.holder.position.clone(); const floorY = 0.45;
  const pts = [from, new THREE.Vector3(from.x, floorY, from.z + (b.working ? 0 : 0.6)), new THREE.Vector3(s.p.x, floorY, b.working ? s.p.z + 0.6 : s.p.z), s.p.clone()];
  b.move = { pts, seg: 0, t: 0, ry: s.ry };
  play(b, 'walk');
}
function updateBot(b, dt) {
  b.mixer.update(dt);
  const m = b.move; if (!m) return;
  const A = m.pts[m.seg], B = m.pts[m.seg + 1]; const d = A.distanceTo(B) || 0.01;
  m.t += dt * 2.4 / d;
  b.holder.position.lerpVectors(A, B, Math.min(m.t, 1));
  const dir = new THREE.Vector3().subVectors(B, A); dir.y = 0;
  if (dir.lengthSq() > 0.01) b.holder.rotation.y = Math.atan2(dir.x, dir.z);
  if (m.t >= 1) { m.seg++; m.t = 0; if (m.seg >= m.pts.length - 1) { b.move = null; b.holder.rotation.y = m.ry; play(b, 'sit'); } }
}

// ---------- UI ----------
const $ = s => document.querySelector(s);
let activity = [];
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hm = ts => new Date(ts * 1000).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Saigon', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
function renderActivity() {
  $('#act-list').innerHTML = activity.length ? activity.slice(0, 8).map(e => `<li><b>${esc(e.bot)}</b> ${e.state === 'lam' ? 'bắt đầu: ' + esc(e.task || 'đang làm') : 'đã xong, chuyển sang Rảnh'}<em>${hm(e.t)}</em></li>`).join('') : '<li>Chưa có hoạt động nào</li>';
}
function refresh() {
  for (const r of rooms) {
    const y = r.bots.filter(b => b.working).length;
    r.label.element.innerHTML = `<span class="ic">${r.def.icon}</span><div><b>${r.def.name}</b><small><i></i>${r.bots.length} bot · ${y} đang làm</small></div>`;
  }
  const y = bots.filter(b => b.working).length;
  $('#g-count').textContent = `${bots.length} bot · ${y} đang làm · ${bots.length - y} rảnh`;
  drawMinimap();
}
const norm = n => n.toLowerCase().trim();
function applyData(d) {
  const st = {}; for (const [k, v] of Object.entries(d.bots || {})) st[norm(k)] = v;
  for (const b of bots) {
    const v = st[norm(b.name)] || { state: 'ranh', task: '' };
    const w = v.state === 'lam'; b.task = v.task || '';
    if (w !== b.working) { b.working = w; placeBot(b, false); }
  }
  activity = d.events || []; renderActivity(); refresh();
}
const CFG = window.PF_HQ || {};
async function poll() {
  const el = $('#upd');
  try {
    const r = await fetch(CFG.api + '?k=' + encodeURIComponent(CFG.key) + '&_=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    applyData(await r.json());
    el.className = 'note glass ok'; el.textContent = '● cập nhật lúc ' + new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Saigon', hour12: false });
  } catch (e) { el.className = 'note glass off'; el.textContent = '○ Mất kết nối, đang thử lại…'; }
}
function showTask(b) {
  const el = $('#tip'); el.innerHTML = `<b>${esc(b.name)}</b><br>${b.working ? '🟢 Đang làm: ' + esc(b.task || '—') : '⚪ Rảnh'}`;
  el.style.display = 'block'; clearTimeout(showTask.t); showTask.t = setTimeout(() => el.style.display = 'none', 5000);
}
document.querySelectorAll('.card .hd').forEach(h => h.addEventListener('click', () => h.parentElement.classList.toggle('collapsed')));
if (MOBILE) document.querySelector('#activity').classList.add('collapsed');

// picking
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let down = null;
labelRenderer.domElement.addEventListener('pointerdown', e => down = [e.clientX, e.clientY]);
labelRenderer.domElement.addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
  ptr.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1); ray.setFromCamera(ptr, camera);
  const h = ray.intersectObjects(hitBoxes)[0]; if (h) { showTask(h.object.userData.bot); openTask(h.object.userData.bot.name, h.object.userData.bot.room.def.name); }
});
document.addEventListener('click', e => {
  const el = e.target.closest('.bot-label'); if (el) { const b = bots.find(b => b.label.element === el); if (b) { showTask(b); openTask(b.name, b.room.def.name); } return; }
  const rl = e.target.closest('.room-label'); if (rl) { const r = rooms.find(r => r.label.element === rl); if (r) openTask('Captain', r.def.name + ' · ' + r.def.bots.join(', ')); }
});
initTasks(() => bots.map(b => b.name));

// minimap
const mm = $('#minimap canvas'), mx = mm.getContext('2d');
function drawMinimap() {
  const W = mm.width, H = mm.height, s = W / 48; mx.clearRect(0, 0, W, H);
  mx.save(); mx.translate(W / 2, H / 2);
  mx.strokeStyle = '#26314d'; mx.lineWidth = 2;
  for (const r of rooms) { mx.beginPath(); mx.moveTo(0, 0); mx.lineTo(Math.sin(r.angle) * RADIUS * s, Math.cos(r.angle) * RADIUS * s); mx.stroke(); }
  for (const r of rooms) {
    const x = Math.sin(r.angle) * RADIUS * s, y = Math.cos(r.angle) * RADIUS * s;
    mx.fillStyle = '#' + new THREE.Color(r.def.color).getHexString(); mx.beginPath(); mx.roundRect(x - 9, y - 6, 18, 12, 3); mx.fill();
    mx.fillStyle = '#fff'; mx.font = 'bold 9px system-ui'; mx.textAlign = 'center'; mx.fillText(r.bots.filter(b => b.working).length, x, y + 3);
  }
  mx.fillStyle = '#7fe9ff'; mx.shadowColor = '#7fe9ff'; mx.shadowBlur = 8; mx.beginPath(); mx.arc(0, 0, 5, 0, 7); mx.fill(); mx.shadowBlur = 0;
  // camera
  const cp = camera.position, ang = Math.atan2(cp.x - controls.target.x, cp.z - controls.target.z);
  const cx = Math.sin(ang) * 21 * s, cy = Math.cos(ang) * 21 * s;
  mx.fillStyle = '#ffffff'; mx.beginPath(); mx.moveTo(cx, cy); mx.lineTo(cx + Math.sin(ang + 2.7) * 8, cy + Math.cos(ang + 2.7) * 8); mx.lineTo(cx + Math.sin(ang - 2.7) * 8, cy + Math.cos(ang - 2.7) * 8); mx.fill();
  mx.restore();
}
function zoom(f) { const v = camera.position.clone().sub(controls.target).multiplyScalar(f); const L = THREE.MathUtils.clamp(v.length(), controls.minDistance, controls.maxDistance); camera.position.copy(controls.target).add(v.setLength(L)); }
$('#zin').onclick = () => zoom(0.8); $('#zout').onclick = () => zoom(1.25);
$('#zhome').onclick = () => { camera.position.copy(HOME); controls.target.set(0, 0, MOBILE ? 0 : 1); };
mm.addEventListener('click', e => {
  const r = mm.getBoundingClientRect(), s = mm.width / 48 * (r.width / mm.width);
  const x = (e.clientX - r.left - r.width / 2) / s, z = (e.clientY - r.top - r.height / 2) / s;
  const off = camera.position.clone().sub(controls.target); controls.target.set(x, 0, z); camera.position.copy(controls.target).add(off);
});

// walkers
function addWalkers() {
  [[0, 2], [2, 5], [4, 1], [6, 3]].forEach(([ri, ci], k) => {
    const ch = makeChar(ci + 3); scene.add(ch.obj); const w = { ...ch, room: rooms[ri], t: k * 0.27, dir: 1, cur: null }; play(w, 'walk'); walkers.push(w);
  });
}
function updateWalker(w, dt) {
  w.mixer.update(dt); w.t += dt * 0.09 * w.dir;
  if (w.t > 1) { w.t = 1; w.dir = -1; } if (w.t < 0) { w.t = 0; w.dir = 1; }
  const A = w.room.pathStart, B = w.room.pathEnd;
  const side = new THREE.Vector3(B.z - A.z, 0, A.x - B.x).normalize().multiplyScalar(0.45 * w.dir);
  w.obj.position.lerpVectors(A, B, w.t).add(side);
  const d = B.clone().sub(A).multiplyScalar(w.dir); w.obj.rotation.y = Math.atan2(d.x, d.z);
}

// post
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight).multiplyScalar(MOBILE ? 0.5 : 1), MOBILE ? 0.3 : 0.35, 0.4, 0.97);
composer.addPass(bloom); composer.addPass(new OutputPass());

function resize() {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); labelRenderer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', resize);

const clock = new THREE.Clock();
let frame = 0;
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  controls.update();
  orb.position.y = TOP + 2.2 + Math.sin(t * 1.6) * 0.15; orb.material.emissiveIntensity = 1.5 + Math.sin(t * 3) * 0.3;
  shells.forEach((s, i) => { s.position.y = orb.position.y; s.rotation.x += dt * (0.3 + i * 0.2); s.rotation.y += dt * (0.4 - i * 0.1); });
  beamMat.opacity = 0.22 + Math.sin(t * 2.2) * 0.06; boats.forEach(updateBoat, t);
  sparks.forEach(s => { const u = s.userData; u.a += dt * u.sp; s.position.set(Math.cos(u.a) * u.r, u.y + Math.sin(t + u.a) * 0.4, Math.sin(u.a) * u.r); });
  dashTex.forEach(tx => tx.offset.x -= dt * 0.8); waterTex.offset.x += dt * 0.012; waterTex.offset.y += dt * 0.007; waterTex2.offset.x -= dt * 0.009; waterTex2.offset.y += dt * 0.011; updateFauna(dt, t);
  stars.rotation.y += dt * 0.005;
  bots.forEach(b => updateBot(b, dt)); walkers.forEach(w => updateWalker(w, dt));
  const dist = camera.position.distanceTo(controls.target);
  document.body.classList.toggle('far', dist > (MOBILE ? 60 : 68)); document.body.classList.toggle('vfar', MOBILE && dist > 70);
  composer.render(); labelRenderer.render(scene, camera);
  if (++frame % 10 === 0) drawMinimap();
  requestAnimationFrame(tick);
}

(async () => {
  const furn = ['desk', 'chairDesk', 'computerScreen', 'computerKeyboard', 'loungeSofaLong', 'pottedPlant', 'plantSmall1', 'lampRoundFloor', 'bookcaseOpen', 'rugRectangle'];
  for (const f of furn) PROTO[f] = (await load(f + '.glb')).scene;
  for (let i = 0; i < CHAR_FILES.length; i++) PROTO['char' + i] = await load('character-' + CHAR_FILES[i] + '.glb');
  ROOMS.forEach(buildRoom); addWalkers(); renderActivity(); refresh(); poll(); setInterval(poll, 15000);
  $('#loading').remove(); window.__ready = true; window.__dbg = { camera, controls, bots, applyData, clock }; tick();
})().catch(e => { $('#loading').textContent = 'Lỗi tải mô hình: ' + e.message; console.error(e); });
