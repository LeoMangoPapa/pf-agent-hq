// Shared harness for space-station concept previews (reuses Agent HQ bots + furniture)
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
export { THREE };

let s0 = 987654; export const rnd = () => { s0 = (s0 * 1664525 + 1013904223) >>> 0; return s0 / 4294967296; };
export const ROOMS = [
  { name: 'Điều phối', icon: '🧭', color: 0x2f6bff, bots: ['Captain', 'Tác vụ', 'dr eggbot'] },
  { name: 'Sàn TMĐT', icon: '🛒', color: 0xff7a1a, bots: ['Shopee Bot', 'Tiktok Shop Bot'] },
  { name: 'Marketing', icon: '📣', color: 0xf5c518, bots: ['Tiktok MKT', 'Facebook MKT', 'AI Cinametic'] },
  { name: 'Nghiên cứu', icon: '🔬', color: 0x22c55e, bots: ['Kalodata Bot', 'Douyin Bot', 'Soi Quảng Cáo FB'] },
  { name: 'Chăm sóc khách', icon: '💬', color: 0xe639c8, bots: ['Pancake Bot', 'Hỏi Đáp'] },
  { name: 'Vận hành', icon: '🚚', color: 0xef3b3b, bots: ['GHTK-bot', 'Kiot Viet-bot'] },
  { name: 'Web & Hỗ trợ', icon: '🌐', color: 0x8b5cf6, bots: ['Website-PF', 'Pearlfarm Bot'] },
];
const WORKING = new Set(['Captain', 'Shopee Bot', 'Tiktok MKT', 'AI Cinametic', 'Kalodata Bot', 'Pancake Bot', 'GHTK-bot', 'Website-PF', 'Douyin Bot']);
const WALKING = new Set(['Tác vụ', 'Facebook MKT', 'Hỏi Đáp', 'Kiot Viet-bot']);
const CHAR_FILES = ['female-a', 'male-a', 'female-b', 'male-b', 'female-c', 'male-c', 'female-d', 'male-e'];
export const RW = 9.6, RD = 7.6, FS = 2.7, CS = 2.5;

export function canvasTex(w, h, draw, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; }
export function label(html, cls) { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; return new CSS2DObject(d); }
export function starfield(scene, n = 4000, r = 380, tint = [1, 1, 1]) {
  const p = new Float32Array(n * 3), c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const u = rnd() * 2 - 1, a = rnd() * 6.283, s = Math.sqrt(1 - u * u); p.set([Math.cos(a) * s * r, u * r, Math.sin(a) * s * r], i * 3); const b = 0.4 + rnd() ** 3 * 2.2; c.set([b * tint[0] * (0.8 + rnd() * 0.3), b * tint[1] * (0.85 + rnd() * 0.2), b * tint[2]], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  const sprite = canvasTex(32, 32, (x) => { const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, '#fff'); gr.addColorStop(0.3, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); });
  const m = new THREE.PointsMaterial({ size: 2.2, map: sprite, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const pts = new THREE.Points(g, m); scene.add(pts); return pts;
}
export function nebulaSky(stops, blobs = []) { // equirect canvas backdrop
  return canvasTex(2048, 1024, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); stops.forEach(([o, c]) => g.addColorStop(o, c)); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'lighter';
    for (const [cx, cy, r, col, n] of blobs) for (let k = 0; k < (n || 40); k++) { const px = cx * w + (rnd() - .5) * r * w, py = cy * h + (rnd() - .5) * r * h * 0.6, rr = r * w * (0.1 + rnd() * 0.25); const gr = x.createRadialGradient(px, py, 0, px, py, rr); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(px - rr, py - rr, rr * 2, rr * 2); }
    x.globalCompositeOperation = 'source-over';
  });
}

export function setup({ bg = 0x05070f, fov = 38, cam = [0, 44, 50], target = [0, 0, 0], exposure = 1.05, bloom = [0.55, 0.6, 0.82], shadow = 30 }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = exposure;
  document.getElementById('app').appendChild(renderer.domElement);
  const labelRenderer = new CSS2DRenderer(); labelRenderer.setSize(innerWidth, innerHeight); labelRenderer.domElement.className = 'labels'; document.getElementById('app').appendChild(labelRenderer.domElement);
  const scene = new THREE.Scene(); scene.background = bg instanceof THREE.Texture ? bg : new THREE.Color(bg);
  const camera = new THREE.PerspectiveCamera(fov, innerWidth / innerHeight, 0.5, 2000); camera.position.set(...cam); camera.lookAt(...target);
  const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), ...bloom)); composer.addPass(new OutputPass());
  const H = { renderer, labelRenderer, scene, camera, composer, rooms: [], bots: [], updaters: [], PROTO: {} };
  H.sunShadow = (light) => { light.castShadow = true; light.shadow.mapSize.set(2048, 2048); Object.assign(light.shadow.camera, { left: -shadow, right: shadow, top: shadow, bottom: -shadow, near: 1, far: 220 }); light.shadow.bias = -0.0004; light.shadow.normalBias = 0.03; };
  return H;
}

const b64 = s => { const bin = atob(s), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a.buffer; };
export async function loadModels(H) {
  const manager = new THREE.LoadingManager(); manager.setURLModifier(u => u.includes('colormap') ? 'data:image/png;base64,' + window.MODELS['colormap.png'] : u);
  const loader = new GLTFLoader(manager), load = f => new Promise((res, rej) => loader.parse(b64(window.MODELS[f]), '', res, rej));
  for (const f of ['desk', 'chairDesk', 'computerScreen', 'computerKeyboard', 'loungeSofaLong', 'pottedPlant', 'plantSmall1', 'lampRoundFloor', 'bookcaseOpen', 'rugRectangle']) H.PROTO[f] = (await load(f + '.glb')).scene;
  for (let i = 0; i < CHAR_FILES.length; i++) H.PROTO['char' + i] = await load('character-' + CHAR_FILES[i] + '.glb');
}
function centered(scene0, s) {
  const g = new THREE.Group(), inner = scene0.clone(true); inner.scale.setScalar(s);
  const bb = new THREE.Box3().setFromObject(inner), c = bb.getCenter(new THREE.Vector3()); inner.position.set(-c.x, -bb.min.y, -c.z); g.add(inner);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g;
}
function screenTexture(hex, seed) {
  return canvasTex(128, 96, (g) => {
    g.fillStyle = '#0b1220'; g.fillRect(0, 0, 128, 96); const col = '#' + new THREE.Color(hex).getHexString();
    if (seed % 2) { g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); for (let i = 0; i < 9; i++) g.lineTo(8 + i * 14, 78 - (Math.sin(i * 1.3 + seed) * 18 + i * 5)); g.stroke(); }
    else for (let i = 0; i < 8; i++) { g.fillStyle = i % 3 ? '#9fe8ff' : col; g.fillRect(10, 10 + i * 10, 20 + ((i * 37 + seed * 13) % 80), 5); }
  });
}
let charIdx = 0;
// Furnish one office inside group g (local floor at y=Y, front = +z). Bots: walk / sit only.
export function furnish(H, g, R, Y = 0, opts = {}) {
  const put = (name, x, y, z, ry = 0, s = FS) => { const o = centered(H.PROTO[name], s); o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };
  const col = new THREE.Color(R.color);
  if (!opts.noRug) put('rugRectangle', -0.6, Y + 0.005, -0.6, 0, 3.0);
  put(opts.plant || 'pottedPlant', -RW / 2 + 0.8, Y, -RD / 2 + 0.8);
  put('lampRoundFloor', RW / 2 - 0.7, Y, -RD / 2 + 0.7);
  put('loungeSofaLong', RW / 2 - 1.05, Y, 1.0, -Math.PI / 2);
  const lamp = new THREE.PointLight(opts.lampColor || 0xffd9a0, opts.lamp ?? 5, 7, 2); lamp.position.set(RW / 2 - 0.7, Y + 2.4, -RD / 2 + 0.7); g.add(lamp);
  const n = R.bots.length, room = { def: R, group: g, bots: [] };
  R.bots.forEach((name, i) => {
    const x = (i - (n - 1) / 2) * 2.5 - 0.3, dz = -RD / 2 + 1.25;
    put('desk', x, Y, dz, Math.PI);
    const working = WORKING.has(name);
    for (const sx of [-0.42, 0.42]) {
      const s = put('computerScreen', x + sx, Y + 1.03, dz - 0.15, sx > 0 ? -0.2 : 0.2);
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.6), new THREE.MeshBasicMaterial({ map: screenTexture(R.color, i * 2 + (sx > 0)), color: new THREE.Color().setScalar(working ? 1.6 : 0.12) }));
      glow.position.set(0, 0.42, 0.08); s.add(glow);
    }
    put('computerKeyboard', x, Y + 1.03, dz + 0.22, Math.PI);
    put('chairDesk', x, Y, dz + 1.0, 0);
    const desk = new THREE.Vector3(x, Y + 0.38, dz + 0.95), sofa = new THREE.Vector3(RW / 2 - 1.05, Y + 0.35, 0.1 + i * 0.95);
    const gl = H.PROTO['char' + (charIdx++ % CHAR_FILES.length)], c = SkeletonUtils.clone(gl.scene); c.scale.setScalar(CS);
    c.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    const mixer = new THREE.AnimationMixer(c), act = {}; for (const clip of gl.animations) act[clip.name] = mixer.clipAction(clip);
    const holder = new THREE.Group(); holder.add(c); g.add(holder);
    const lab = label(`<i class="${working ? 'on' : 'off'}"></i>${name}`, 'bot-label'); lab.position.set(0, 2.25, 0); holder.add(lab);
    const b = { name, holder, mixer, act, working, walking: WALKING.has(name) };
    if (b.walking) { // pacing between desk aisle and sofa: walk loop
      const A = new THREE.Vector3(x, Y, dz + 1.9), B = new THREE.Vector3(RW / 2 - 2.3, Y, 0.4 + i * 0.95);
      b.path = [A, B]; b.ph = i * 0.37 + R.name.length * 0.1; act.walk.play();
    } else { const s = working ? { p: desk, ry: Math.PI } : { p: sofa, ry: Math.PI / 2 }; holder.position.copy(s.p); holder.rotation.y = s.ry; act.sit.play(); }
    H.bots.push(b); room.bots.push(b);
  });
  const y = room.bots.filter(b => b.working).length;
  const lab = label(`<span class="ic">${R.icon}</span><div><b>${R.name}</b><small><i></i>${n} bot · ${y} đang làm</small></div>`, 'room-label');
  lab.position.set(0, Y + (opts.labelY ?? 0.6), RD / 2 + (opts.labelZ ?? 1.5)); g.add(lab); lab.element.style.setProperty('--c', '#' + col.getHexString());
  H.rooms.push(room); return room;
}
function updBots(H, dt, t) {
  for (const b of H.bots) {
    b.mixer.update(dt);
    if (b.path) { const [A, B] = b.path, d = A.distanceTo(B), per = d / 1.2, u = ((t / per + b.ph) % 2), fw = u < 1, k = fw ? u : 2 - u; b.holder.position.lerpVectors(A, B, k); const dir = fw ? B.clone().sub(A) : A.clone().sub(B); b.holder.rotation.y = Math.atan2(dir.x, dir.z); }
  }
}
// Mock UI chrome (same DOM/CSS as the live page). Hide the label HTML count etc.
export function fillUI(theme) {
  const n = 17, y = 9;
  document.getElementById('g-count').textContent = `${n} bot · ${y} đang làm · ${n - y} rảnh`;
  document.getElementById('blk-n').textContent = '2'; document.getElementById('blk-n').classList.add('on');
  const u = document.getElementById('upd'); u.textContent = '✓ Cập nhật 16:14'; u.className = 'note glass ok';
  const ev = [['Website-PF', 'Cập nhật trang sản phẩm', '16:13'], ['GHTK-bot', 'Tạo vận đơn', '16:12'], ['Pancake Bot', 'Trả lời tin nhắn khách', '16:10'], ['Kalodata Bot', 'Phân tích xu hướng', '16:09'], ['AI Cinametic', 'Dựng video sản phẩm', '16:07']];
  document.getElementById('act-list').innerHTML = ev.map(([b, t, h]) => `<li><b>${b}</b> bắt đầu: ${t}<em>${h}</em></li>`).join('');
  document.querySelector('.brand small').textContent = theme;
  document.getElementById('loading')?.remove();
}
export function run(H, { stills = [8.0] } = {}) {
  const T = parseFloat(new URLSearchParams(location.search).get('t') || stills[0]);
  // deterministic warm-up then single frame (for stills); live loop otherwise
  const step = (t, dt) => { updBots(H, dt, t); H.updaters.forEach(f => f(t, dt)); };
  if (new URLSearchParams(location.search).has('live')) {
    const clock = new THREE.Clock(); const loop = () => { const dt = Math.min(clock.getDelta(), 0.05); step(clock.elapsedTime, dt); H.composer.render(); H.labelRenderer.render(H.scene, H.camera); requestAnimationFrame(loop); }; loop();
  } else {
    for (let t = 0; t <= T; t += 1 / 15) step(t, 1 / 15);
    H.composer.render(); H.labelRenderer.render(H.scene, H.camera);
  }
  window.__ready = true;
}
// little helpers for space props
export function thrusterGlow(color, size = 1) {
  const tex = canvasTex(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, '#fff'); g.addColorStop(0.25, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: new THREE.Color(color).multiplyScalar(2), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.scale.setScalar(size); return s;
}
export function drone(color = 0x5ee7ff, body = 0xdfe6f0) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: body, metalness: 0.7, roughness: 0.3 });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.35, 20, 14), m); core.scale.y = 0.6; g.add(core);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.5) })); eye.position.z = 0.3; g.add(eye);
  for (const s of [-1, 1]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.12), m); arm.position.x = s * 0.5; g.add(arm); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 6, 20), m); ring.rotation.x = Math.PI / 2; ring.position.x = s * 0.85; g.add(ring); const gl = thrusterGlow(color, 0.5); gl.position.set(s * 0.85, -0.1, 0); g.add(gl); }
  return g;
}
export function shuttle(hull = 0xe8ecf2, accent = 0xff6a2a, glow = 0x7fd8ff, s = 1) {
  const g = new THREE.Group(), hm = new THREE.MeshStandardMaterial({ color: hull, metalness: 0.5, roughness: 0.35 }), am = new THREE.MeshStandardMaterial({ color: accent, metalness: 0.3, roughness: 0.5 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.6, 2.6, 6, 16), hm); body.rotation.x = Math.PI / 2; g.add(body);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x223a55, metalness: 0.2, roughness: 0.05, clearcoat: 1 })); nose.rotation.x = Math.PI / 2; nose.position.set(0, 0.25, 1.4); g.add(nose);
  const wg = new THREE.Shape(); wg.moveTo(0, 0.8); wg.lineTo(2.2, -0.6); wg.lineTo(2.2, -1.1); wg.lineTo(0, -1.3); wg.lineTo(-2.2, -1.1); wg.lineTo(-2.2, -0.6); wg.lineTo(0, 0.8);
  const wing = new THREE.Mesh(new THREE.ExtrudeGeometry(wg, { depth: 0.1, bevelEnabled: false }), am); wing.rotation.x = -Math.PI / 2; wing.position.y = -0.1; g.add(wing);
  for (const x of [-0.35, 0.35]) { const e = thrusterGlow(glow, 1.4); e.position.set(x, 0, -2.0); g.add(e); const n = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.4, 12), hm); n.rotation.x = Math.PI / 2; n.position.set(x, 0, -1.8); g.add(n); }
  const trail = new THREE.Mesh(new THREE.ConeGeometry(0.28, 4, 12, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(glow).multiplyScalar(1.5), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })); trail.rotation.x = Math.PI / 2; trail.position.z = -4.0; g.add(trail);
  g.scale.setScalar(s); return g;
}
