import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
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
const RADIUS = 17, RW = 9.6, RD = 7.6, FS = 2.7, CS = 2.5;

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
scene.background = new THREE.Color(0x060914);
scene.fog = new THREE.Fog(0x060914, 70, 140);
const camera = new THREE.PerspectiveCamera(MOBILE ? 50 : 38, innerWidth / innerHeight, 0.5, 400);
const HOME = MOBILE ? new THREE.Vector3(0, 92, 40) : new THREE.Vector3(0, 40, 44);
camera.position.copy(HOME);
const controls = new OrbitControls(camera, labelRenderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.maxPolarAngle = 1.2; controls.minDistance = 10; controls.maxDistance = 140;
controls.target.set(0, 0, MOBILE ? 0 : 1);

scene.add(new THREE.HemisphereLight(0x8fa8ff, 0x10131f, 0.9));
const sun = new THREE.DirectionalLight(0xfff1dd, 2.0);
sun.position.set(-18, 34, 22); sun.castShadow = true;
const sm = MOBILE ? 1024 : 2048;
sun.shadow.mapSize.set(sm, sm);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 90 });
sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03;
scene.add(sun);

// ground + floor specks + stars
const ground = new THREE.Mesh(new THREE.CircleGeometry(80, 64), new THREE.MeshStandardMaterial({ color: 0x141a2c, roughness: 0.95 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
function points(n, fn, size, color, opacity) {
  const p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) fn(p, i * 3);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.Points(g, new THREE.PointsMaterial({ color, size, sizeAttenuation: true, transparent: true, opacity, depthWrite: false }));
  scene.add(m); return m;
}
points(1400, (p, i) => { const r = 6 + Math.random() * 60, a = Math.random() * 6.283; p[i] = Math.cos(a) * r; p[i + 1] = 0.03; p[i + 2] = Math.sin(a) * r; }, 0.12, 0x6d7aa8, 0.55);
const stars = points(2500, (p, i) => { const v = new THREE.Vector3().randomDirection().multiplyScalar(150 + Math.random() * 60); v.y = Math.abs(v.y) * 0.8 - 10; p.set([v.x, v.y, v.z], i); }, 0.9, 0xffffff, 0.85);

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
{
  const base = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.8, 0.6, 64), new THREE.MeshStandardMaterial({ color: 0x101a2e, metalness: 0.6, roughness: 0.4 }));
  base.position.y = 0.3; base.receiveShadow = true; brain.add(base);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 0.25, 64), new THREE.MeshStandardMaterial({ color: 0x0f2c44, emissive: 0x0a4d6e, emissiveIntensity: 0.6, metalness: 0.5, roughness: 0.3 }));
  top.position.y = 0.72; brain.add(top);
  for (const [r, w, y, int] of [[6.0, 0.12, 0.62, 3], [4.6, 0.08, 0.86, 2.5], [3.0, 0.06, 0.86, 2]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, w, 8, 128), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x5ee7ff).multiplyScalar(int) }));
    ring.rotation.x = Math.PI / 2; ring.position.y = y; brain.add(ring);
  }
}
const orb = new THREE.Mesh(new THREE.SphereGeometry(1.25, 48, 32), new THREE.MeshStandardMaterial({ color: 0xbff6ff, emissive: 0x5fdcff, emissiveIntensity: 1.2, roughness: 0.2 }));
orb.position.y = 4; brain.add(orb);
const orbLight = new THREE.PointLight(0x5ee7ff, 60, 22, 1.6); orbLight.position.y = 4; brain.add(orbLight);
const shells = [];
for (let i = 0; i < 3; i++) {
  const s = new THREE.Mesh(new THREE.TorusGeometry(2.0 + i * 0.45, 0.025, 6, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x9ff0ff).multiplyScalar(1.6), transparent: true, opacity: 0.8 }));
  s.position.y = 4; s.rotation.set(Math.random() * 3, Math.random() * 3, 0); brain.add(s); shells.push(s);
}
const beamMat = new THREE.MeshBasicMaterial({ color: 0x7fe9ff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.9, 30, 32, 1, true), beamMat); beam.position.y = 15; brain.add(beam);
const beam2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 30, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })); beam2.position.y = 15; brain.add(beam2);
const sparks = [];
{
  const g = new THREE.SphereGeometry(0.07, 8, 6), m = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xc8f7ff).multiplyScalar(3) });
  for (let i = 0; i < 40; i++) { const s = new THREE.Mesh(g, m); s.userData = { r: 1.8 + Math.random() * 3, a: Math.random() * 6.28, y: 1 + Math.random() * 6, sp: 0.2 + Math.random() * 0.6 }; brain.add(s); sparks.push(s); }
}
const brainLabel = label('<b>BỘ NÃO</b><span>Captain điều phối · bộ nhớ chung</span>', 'brain-label');
brainLabel.position.set(0, 0.8, MOBILE ? 0 : 7.4); brain.add(brainLabel);

// ---------- rooms, paths ----------
const bots = []; const rooms = []; const dashTex = []; const hitBoxes = [];
const walkers = [];
function buildRoom(R, idx) {
  const a = idx / ROOMS.length * Math.PI * 2;
  const g = new THREE.Group(); g.position.set(Math.sin(a) * RADIUS, 0, Math.cos(a) * RADIUS); g.rotation.y = a + Math.PI; scene.add(g);
  const col = new THREE.Color(R.color);
  const floorMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 });
  const floor = new THREE.Mesh(new THREE.ExtrudeGeometry(rrect(RW, RD, 0.5), { depth: 0.45, bevelEnabled: false }), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.castShadow = true; g.add(floor);
  const inset = new THREE.Mesh(new THREE.ShapeGeometry(rrect(RW - 1.2, RD - 1.4, 0.3)), new THREE.MeshStandardMaterial({ color: col.clone().lerp(new THREE.Color(0xffffff), 0.55), roughness: 0.8 }));
  inset.rotation.x = -Math.PI / 2; inset.position.set(0, 0.452, 0.1); inset.receiveShadow = true; g.add(inset);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(RW - 1, 0.06, 0.08), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(2.2) }));
  edge.position.set(0, 0.47, RD / 2 - 0.05); g.add(edge);
  const wallMat = new THREE.MeshStandardMaterial({ color: col.clone().lerp(new THREE.Color(0x1a1a2a), 0.25), roughness: 0.7 });
  const WH = 1.5, WT = 0.3;
  for (const [w, d, x, z] of [[RW, WT, 0, -RD / 2 + WT / 2], [WT, RD, -RW / 2 + WT / 2, 0], [WT, RD, RW / 2 - WT / 2, 0]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, WH, d), wallMat); m.position.set(x, 0.45 + WH / 2, z); m.castShadow = m.receiveShadow = true; g.add(m);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.06, d + 0.02), new THREE.MeshStandardMaterial({ color: col.clone().lerp(new THREE.Color(0xffffff), 0.4) }));
    cap.position.set(x, 0.45 + WH + 0.03, z); g.add(cap);
  }
  // wall screen
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), new THREE.MeshBasicMaterial({ map: screenTexture(R.color, idx + 1) }));
  ws.position.set(-1.6, 1.4, -RD / 2 + WT + 0.01); g.add(ws);
  const Y = 0.45;
  put('rugRectangle', g, 0, Y + 0.005, -1.4, 0, 3.4);
  put('bookcaseOpen', g, -RW / 2 + 0.75, Y, 1.2, Math.PI / 2);
  put('pottedPlant', g, -RW / 2 + 0.8, Y, -RD / 2 + 0.8);
  put('pottedPlant', g, RW / 2 - 0.8, Y, RD / 2 - 0.9);
  put('lampRoundFloor', g, RW / 2 - 0.7, Y, -RD / 2 + 0.7);
  put('plantSmall1', g, -RW / 2 + 0.75, Y + 2.38, 0.5);
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
  const road = new THREE.Mesh(new THREE.PlaneGeometry(1.8, len), new THREE.MeshStandardMaterial({ color: 0x0a0d17, roughness: 0.9 }));
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0.04, 6.4 + len / 2); road.receiveShadow = true; path.add(road);
  const t = dashTexture('#' + col.clone().lerp(new THREE.Color(0xffffff), 0.3).getHexString()); t.repeat.set(len / 1.4, 1); dashTex.push(t);
  const dash = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.18), new THREE.MeshBasicMaterial({ map: t, transparent: true, color: new THREE.Color(1.8, 1.8, 1.8) }));
  dash.rotation.set(-Math.PI / 2, 0, Math.PI / 2); dash.position.set(0, 0.06, 6.4 + len / 2); path.add(dash);
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
  const h = ray.intersectObjects(hitBoxes)[0]; if (h) showTask(h.object.userData.bot);
});
document.addEventListener('click', e => { const el = e.target.closest('.bot-label'); if (el) { const b = bots.find(b => b.label.element === el); if (b) showTask(b); } });

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
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight).multiplyScalar(MOBILE ? 0.5 : 1), MOBILE ? 0.45 : 0.6, 0.45, 0.9);
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
  orb.position.y = 4 + Math.sin(t * 1.6) * 0.3; orb.material.emissiveIntensity = 1.5 + Math.sin(t * 3) * 0.3;
  shells.forEach((s, i) => { s.position.y = orb.position.y; s.rotation.x += dt * (0.3 + i * 0.2); s.rotation.y += dt * (0.4 - i * 0.1); });
  beamMat.opacity = 0.18 + Math.sin(t * 2.2) * 0.05;
  sparks.forEach(s => { const u = s.userData; u.a += dt * u.sp; s.position.set(Math.cos(u.a) * u.r, u.y + Math.sin(t + u.a) * 0.4, Math.sin(u.a) * u.r); });
  dashTex.forEach(tx => tx.offset.x -= dt * 0.8);
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
  $('#loading').remove(); window.__ready = true; window.__dbg = { camera, controls, bots, applyData }; tick();
})().catch(e => { $('#loading').textContent = 'Lỗi tải mô hình: ' + e.message; console.error(e); });
