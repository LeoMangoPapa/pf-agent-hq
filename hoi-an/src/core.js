// Agent HQ core: renderer, bots, status polling, UI. Theme-agnostic.
// A theme module exports { id, name, init(ctx), buildRooms(ctx, ROOMS), update(dt, t), ... } (see themes/README in this folder).
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { initTasks, openTask } from './tasks.js';

export const ROOMS = [
  { name: 'Điều phối', icon: '🧭', color: 0x2f6bff, bots: ['Captain', 'Tác vụ', 'dr eggbot'] },
  { name: 'Sàn TMĐT', icon: '🛒', color: 0xff7a1a, bots: ['Shopee Bot', 'Tiktok Shop Bot'] },
  { name: 'Marketing', icon: '📣', color: 0xf5c518, bots: ['Tiktok MKT', 'Facebook MKT', 'AI Cinametic'] },
  { name: 'Nghiên cứu', icon: '🔬', color: 0x22c55e, bots: ['Kalodata Bot', 'Douyin Bot', 'Soi Quảng Cáo FB'] },
  { name: 'Chăm sóc khách', icon: '💬', color: 0xe639c8, bots: ['Pancake Bot', 'Hỏi Đáp'] },
  { name: 'Vận hành', icon: '🚚', color: 0xef3b3b, bots: ['GHTK-bot', 'Kiot Viet-bot'] },
  { name: 'Web & Hỗ trợ', icon: '🌐', color: 0x8b5cf6, bots: ['Website-PF', 'Pearlfarm Bot'] },
];
const CHAR_FILES = ['female-a', 'male-a', 'female-b', 'male-b', 'female-c', 'male-c', 'female-d', 'male-e'];
const FS = 2.7, CS = 2.5;

export function startHQ(theme) {
  const MOBILE = Math.min(innerWidth, innerHeight) < 600;
  const CAPTURE = /[?&]capture=1/.test(location.search);
  const QUALITY = (new URLSearchParams(location.search).get('q') || localStorage.getItem('pfhq-q') || (MOBILE ? 'low' : 'high')) === 'low' ? 'low' : 'high';
  if (theme.css) { const st = document.createElement('style'); st.textContent = theme.css; document.head.appendChild(st); }
  document.body.classList.add('theme-' + theme.id);
  { const top = document.getElementById('top'), qb = document.createElement('button'); qb.id = 'btn-q'; qb.className = 'glass'; qb.title = 'Chất lượng đồ hoạ';
    qb.textContent = QUALITY === 'high' ? '✨ Đẹp' : '⚡ Nhẹ'; qb.onclick = () => { localStorage.setItem('pfhq-q', QUALITY === 'high' ? 'low' : 'high'); location.reload(); }; top.insertBefore(qb, document.getElementById('upd')); }
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: CAPTURE });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = QUALITY === 'high';
  renderer.shadowMap.type = MOBILE ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = theme.exposure ?? 1.05;
  document.getElementById('app').appendChild(renderer.domElement);
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(innerWidth, innerHeight);
  labelRenderer.domElement.className = 'labels';
  document.getElementById('app').appendChild(labelRenderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(MOBILE ? 50 : 38, innerWidth / innerHeight, 0.5, 900);
  const HOME = (MOBILE ? theme.homeMobile : theme.home).clone();
  const TARGET = theme.target ? theme.target.clone() : new THREE.Vector3();
  camera.position.copy(HOME);
  const controls = new OrbitControls(camera, labelRenderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  Object.assign(controls, theme.controls || { maxPolarAngle: 1.2, minDistance: 10, maxDistance: 140 });
  controls.target.copy(TARGET);

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
  function put(name, parent, x, y, z, ry = 0, s = FS) { const o = centered(PROTO[name], s); o.position.set(x, y, z); o.rotation.y = ry; parent.add(o); return o; }
  function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
  function screenTexture(hex, seed) {
    const c = document.createElement('canvas'); c.width = 128; c.height = 96; const g = c.getContext('2d');
    g.fillStyle = '#0b1220'; g.fillRect(0, 0, 128, 96);
    const col = '#' + new THREE.Color(hex).getHexString();
    if (seed % 2) { g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); for (let i = 0; i < 9; i++) g.lineTo(8 + i * 14, 78 - (Math.sin(i * 1.3 + seed) * 18 + i * 5)); g.stroke(); }
    else for (let i = 0; i < 8; i++) { g.fillStyle = i % 3 ? '#9fe8ff' : col; g.fillRect(10, 10 + i * 10, 20 + ((i * 37 + seed * 13) % 80), 5); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function label(html, cls) { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; return new CSS2DObject(d); }

  // ---------- bots (walk + sit only; animation clips untouched, no bone edits) ----------
  const bots = [], rooms = [], hitBoxes = [], walkers = [];
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
  // seat = { desk:{p,ry,approach}, sofa:{p,ry,approach}, floorY }
  function makeBot(name, room, parent, seat, screens) {
    const ch = makeChar(charIdx++);
    const holder = new THREE.Group(); holder.add(ch.obj); parent.add(holder);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2, 1.1), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 0.9; holder.add(hit);
    const lab = label('', 'bot-label'); lab.position.set(0, 2.25, 0); holder.add(lab);
    const b = { name, room, holder, screens, seat, working: false, task: '', ...ch, label: lab, move: null, cur: null };
    hit.userData.bot = b; hitBoxes.push(hit);
    placeBot(b, true); bots.push(b); room.bots.push(b); return b;
  }
  function placeBot(b, instant) {
    const s = b.working ? b.seat.desk : b.seat.sofa, fy = b.seat.floorY;
    b.screens.forEach(m => { m.material.color.setScalar(b.working ? 1.6 : 0.12); });
    b.label.element.innerHTML = `<i class="${b.working ? 'on' : 'off'}"></i>${b.name}`;
    b.label.element.classList.toggle('busy', b.working);
    if (instant) { b.holder.position.copy(s.p); b.holder.rotation.y = s.ry; play(b, 'sit'); return; }
    const from = b.holder.position.clone(), prev = b.working ? b.seat.sofa : b.seat.desk;
    const pts = [from, prev.approach.clone().setY(fy), s.approach.clone().setY(fy), s.p.clone()];
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
  function addWalkers(paths) {
    paths.forEach(([A, B, nm], k) => { const ch = makeChar(k + 3); scene.add(ch.obj); if (nm) { const l = label(nm, 'bot-label walker'); l.position.set(0, 2.25 / CS, 0); ch.obj.add(l); } const w = { ...ch, A, B, t: k * 0.27, dir: 1, cur: null }; play(w, 'walk'); walkers.push(w); });
  }
  function updateWalker(w, dt) {
    w.mixer.update(dt); w.t += dt * 0.09 * w.dir;
    if (w.t > 1) { w.t = 1; w.dir = -1; } if (w.t < 0) { w.t = 0; w.dir = 1; }
    const side = new THREE.Vector3(w.B.z - w.A.z, 0, w.A.x - w.B.x).normalize().multiplyScalar(0.35 * w.dir);
    w.obj.position.lerpVectors(w.A, w.B, w.t).add(side);
    const d = w.B.clone().sub(w.A).multiplyScalar(w.dir); w.obj.rotation.y = Math.atan2(d.x, d.z);
    if (theme.walkY) w.obj.position.y = w.A.y + theme.walkY(w.obj.position.x, w.obj.position.z);
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
  // NOTE(hoi-an): walkers may carry a label; rooms may come from theme.rooms

  // minimap: rooms supply map:[x,z]; bots' world positions are drawn as dots
  const mm = $('#minimap canvas'), mx = mm.getContext('2d'), MR = theme.mapRadius || 24, _w = new THREE.Vector3();
  function drawMinimap() {
    const W = mm.width, H = mm.height, s = W / (MR * 2); mx.clearRect(0, 0, W, H);
    mx.save(); mx.translate(W / 2, H / 2);
    mx.strokeStyle = theme.mapLine || '#26314d'; mx.lineWidth = 2;
    for (const r of rooms) { mx.beginPath(); mx.moveTo(0, 0); mx.lineTo(r.map[0] * s, r.map[1] * s); mx.stroke(); }
    for (const b of bots) { b.holder.getWorldPosition(_w); mx.fillStyle = b.working ? '#' + new THREE.Color(b.room.def.color).getHexString() : '#59607a'; mx.beginPath(); mx.arc(_w.x * s, _w.z * s, 3.2, 0, 7); mx.fill(); }
    for (const r of rooms) {
      const x = r.map[0] * s * 1.18, y = r.map[1] * s * 1.18;
      mx.fillStyle = '#' + new THREE.Color(r.def.color).getHexString(); mx.beginPath(); mx.roundRect(x - 9, y - 6, 18, 12, 3); mx.fill();
      mx.fillStyle = '#fff'; mx.font = 'bold 9px system-ui'; mx.textAlign = 'center'; mx.fillText(r.bots.filter(b => b.working).length, x, y + 3);
    }
    const cc = theme.mapCore || '#7fe9ff'; mx.fillStyle = cc; mx.shadowColor = cc; mx.shadowBlur = 8; mx.beginPath(); mx.arc(0, 0, 6, 0, 7); mx.fill(); mx.shadowBlur = 0;
    const cp = camera.position, ang = Math.atan2(cp.x - controls.target.x, cp.z - controls.target.z);
    const cx = Math.sin(ang) * MR * 0.88 * s, cy = Math.cos(ang) * MR * 0.88 * s;
    mx.fillStyle = '#ffffff'; mx.beginPath(); mx.moveTo(cx, cy); mx.lineTo(cx + Math.sin(ang + 2.7) * 8, cy + Math.cos(ang + 2.7) * 8); mx.lineTo(cx + Math.sin(ang - 2.7) * 8, cy + Math.cos(ang - 2.7) * 8); mx.fill();
    mx.restore();
  }
  function zoom(f) { const v = camera.position.clone().sub(controls.target).multiplyScalar(f); const L = THREE.MathUtils.clamp(v.length(), controls.minDistance, controls.maxDistance); camera.position.copy(controls.target).add(v.setLength(L)); }
  $('#zin').onclick = () => zoom(0.8); $('#zout').onclick = () => zoom(1.25);
  $('#zhome').onclick = () => { camera.position.copy(HOME); controls.target.copy(TARGET); };
  mm.addEventListener('click', e => {
    const r = mm.getBoundingClientRect(), s = mm.width / (MR * 2) * (r.width / mm.width);
    const x = (e.clientX - r.left - r.width / 2) / s, z = (e.clientY - r.top - r.height / 2) / s;
    const off = camera.position.clone().sub(controls.target); controls.target.set(x, TARGET.y, z); camera.position.copy(controls.target).add(off);
  });

  // post
  const _pr = renderer.getPixelRatio(), _rt = new THREE.WebGLRenderTarget(innerWidth * _pr, innerHeight * _pr, { type: THREE.HalfFloatType, samples: MOBILE ? 2 : 4 });
  const composer = new EffectComposer(renderer, _rt); // MSAA render target: keeps antialiasing with post-processing
  composer.addPass(new RenderPass(scene, camera));
  const bp = theme.bloom || [0.35, 0.4, 0.97];
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight).multiplyScalar(MOBILE ? 0.5 : 1), MOBILE ? bp[0] * 0.85 : bp[0], bp[1], bp[2]);
  composer.addPass(bloom); composer.addPass(new OutputPass());
  if (theme.vignette) composer.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null }, uV: { value: theme.vignette } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform sampler2D tDiffuse; uniform float uV; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv-.5; float v = smoothstep(.85, .25, length(d*vec2(1.1,1.))); c.rgb *= mix(1.-uV, 1., v); c.rgb += vec3(.012,.006,.02)*(1.-v); gl_FragColor = c; }' }));
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); labelRenderer.setSize(innerWidth, innerHeight);
  });

  const ctx = { QUALITY, THREE, scene, renderer, camera, controls, MOBILE, put, label, canvasTex, screenTexture, makeBot, rooms, bots, FS };
  let simT = 0, frame = 0;
  function step(dt) {
    simT += dt; const t = simT;
    controls.update();
    theme.update(dt, t);
    bots.forEach(b => updateBot(b, dt)); walkers.forEach(w => updateWalker(w, dt));
    const dist = camera.position.distanceTo(controls.target);
    document.body.classList.toggle('far', dist > (MOBILE ? 60 : theme.farDist || 68)); document.body.classList.toggle('vfar', MOBILE && dist > 70);
    composer.render(); labelRenderer.render(scene, camera);
    if (++frame % 10 === 0) drawMinimap();
  }
  const clock = new THREE.Clock();
  function tick() { step(Math.min(clock.getDelta(), 0.05)); requestAnimationFrame(tick); }

  (async () => {
    const furn = ['desk', 'chairDesk', 'computerScreen', 'computerKeyboard', 'loungeSofaLong', 'pottedPlant', 'plantSmall1', 'lampRoundFloor', 'bookcaseOpen', 'rugRectangle'];
    for (const f of furn) PROTO[f] = (await load(f + '.glb')).scene;
    for (let i = 0; i < CHAR_FILES.length; i++) PROTO['char' + i] = await load('character-' + CHAR_FILES[i] + '.glb');
    theme.init(ctx);
    theme.buildRooms(ctx, theme.rooms || ROOMS);
    addWalkers(theme.walkPaths || []);
    { const an = renderer.capabilities.getMaxAnisotropy(); scene.traverse(o => { const ms = o.material ? [].concat(o.material) : []; ms.forEach(m => ['map', 'emissiveMap'].forEach(k => { const t = m[k]; if (t && t.isTexture) { t.anisotropy = Math.min(an, 8); t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.needsUpdate = true; } })); }); }
    renderActivity(); refresh(); poll(); setInterval(poll, 15000);
    $('#loading').remove();
    window.__dbg = { THREE, camera, controls, bots, rooms, applyData, scene, theme, get t() { return simT; }, set t(v) { simT = v; } };
    window.__step = step;
    window.__ready = true;
    if (!CAPTURE) tick();
  })().catch(e => { $('#loading').textContent = 'Lỗi tải mô hình: ' + e.message; console.error(e); });
}
