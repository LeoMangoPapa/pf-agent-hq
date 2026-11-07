// Theme "Phố Hội Đèn Lồng": Indochine Hội An shophouse hotel on a full-moon night (dollhouse cut-away, open front +z).
import * as THREE from 'three';
import { makeBoat, fireflies, music } from './hoian-extras.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const FH = 4.6, HW = 17, D = 6;               // floor height, half width, half depth
const P = { red: 0xC8102E, gold: 0xE8B23A, green: 0x3F7D58, indigo: 0x2E3A87, teak: 0x5A3A22, pink: 0xe58fb0, yellow: 0xE8B23A };
const ROOMS = [
  { name: 'Sảnh · Điều phối', icon: '🏮', color: 0xb5651d, bots: ['Captain', 'Tác vụ', 'Pearlfarm Bot'], up: 0xb0122a, wall: 'teak' },
  { name: 'Tầng 1 · Phân tích', icon: '📊', color: P.gold, bots: ['Kalodata Bot', 'Website-PF', 'dr eggbot'], up: 0xd99a1e, wall: 'ochre' },
  { name: 'Tầng 2 · Vận chuyển', icon: '🚚', color: 0x4f5fd0, bots: ['GHTK-bot', 'Kiot Viet-bot'], up: P.indigo, wall: 'indigo' },
  { name: 'Tầng 3 · Marketing', icon: '🪷', color: 0xe58fb0, bots: ['Facebook MKT', 'Tiktok MKT', 'AI Cinametic', 'Soi Quảng Cáo FB'], up: 0xd9728f, wall: 'lotus' },
  { name: 'Tầng 4 · Sàn TMĐT', icon: '🎋', color: 0x4fa56f, bots: ['Shopee Bot', 'Tiktok Shop Bot', 'Douyin Bot'], up: P.green, wall: 'bamboo' },
  { name: 'Tầng 5 · Bán hàng', icon: '🧧', color: P.red, bots: ['Pancake Bot', 'Hỏi Đáp'], up: P.red, wall: 'lantern' },
  { name: 'Sân thượng · Vườn đèn', icon: '🌕', color: 0xf2c94c, bots: [], up: 0xa8102a, wall: null },
];
function tex(w, h, draw, k = 2) { const c = document.createElement('canvas'); c.width = w * k; c.height = h * k; const x = c.getContext('2d'); x.scale(k, k); draw(x, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; }
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
const box = (w, h, d, m, x, y, z, par) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; par.add(o); return o; };

const WALLS = {
  teak: (x, w, h) => { x.fillStyle = '#4a2c18'; x.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#5e3a22' : '#553420'; x.fillRect(i * w / 8 + 4, 10, w / 8 - 8, h - 20); x.strokeStyle = '#E8B23A88'; x.lineWidth = 2; x.strokeRect(i * w / 8 + 14, 24, w / 8 - 28, h - 48); } },
  ochre: (x, w, h) => { x.fillStyle = '#c98f2a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#a8701a'; x.lineWidth = 3; for (let i = 0; i < w; i += 32) for (let j = 0; j < h; j += 32) { x.beginPath(); x.arc(i + 16, j + 16, 12, 0, 7); x.stroke(); } },
  indigo: (x, w, h) => { x.fillStyle = '#26307a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#8f9be0aa'; x.lineWidth = 2.5; for (let j = 0; j < h; j += 26) for (let i = 0; i < w; i += 52) { x.beginPath(); x.arc(i + 26, j + 26, 22, Math.PI, 2 * Math.PI); x.arc(i + 26, j + 26, 12, 2 * Math.PI, Math.PI, true); x.stroke(); } },
  lotus: (x, w, h) => { x.fillStyle = '#f3b7c8'; x.fillRect(0, 0, w, h); for (let k = 0; k < 10; k++) { const cx = (k * 97) % w + 20, cy = (k * 61) % (h - 60) + 40; x.fillStyle = '#e07796'; for (let p = -2; p <= 2; p++) { x.save(); x.translate(cx, cy); x.rotate(p * 0.42); x.beginPath(); x.ellipse(0, -14, 7, 18, 0, 0, 7); x.fill(); x.restore(); } x.fillStyle = '#5e8f5a'; x.fillRect(cx - 1, cy, 2, 40); } },
  bamboo: (x, w, h) => { x.fillStyle = '#2f5d3f'; x.fillRect(0, 0, w, h); for (let i = 0; i < 18; i++) { const bx = (i * 29) % w; x.fillStyle = i % 2 ? '#5f9b5c' : '#4b8650'; x.fillRect(bx, 0, 12, h); x.fillStyle = '#2c5a35'; for (let j = (i * 17) % 50; j < h; j += 54) x.fillRect(bx - 1, j, 14, 3); x.fillStyle = '#79b46a'; x.beginPath(); x.ellipse(bx + 18, (i * 41) % h, 12, 3, -0.5, 0, 7); x.fill(); } },
  lantern: (x, w, h) => { x.fillStyle = '#8e0f22'; x.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 64) for (let j = 0; j < h; j += 64) { const o = (j / 64) % 2 ? 32 : 0; x.fillStyle = '#E8B23A'; x.beginPath(); x.ellipse(i + 32 + o, j + 32, 10, 13, 0, 0, 7); x.fill(); x.fillRect(i + 31 + o, j + 14, 2, 6); x.fillStyle = '#b81830'; x.beginPath(); x.ellipse(i + 32 + o, j + 32, 6, 10, 0, 0, 7); x.fill(); } },
};

// ---------- shared furniture geometry ----------
// S-shaped tufted chaise (profile in x/y, extruded along z), length ~3.4
const CH_L = 3.4, CH_W = 0.95, CH_S = 1.25;
const chaiseCurve = new THREE.SplineCurve([[0, .5], [.1, .55], [.32, .98], [.55, .56], [.72, .66], [.88, 1.18], [.98, 1.42], [1.0, 1.3]].map(([u, y]) => new THREE.Vector2(u * CH_L - CH_L / 2, y)));
const chaiseTop = u => chaiseCurve.getPoint(u);
function chaiseGeo() {
  const sh = new THREE.Shape(); sh.moveTo(-CH_L / 2, 0.14); sh.lineTo(CH_L / 2 - 0.05, 0.14);
  const pts = chaiseCurve.getPoints(60).reverse(); pts.forEach(p => sh.lineTo(p.x, p.y));
  sh.lineTo(-CH_L / 2, 0.14);
  const g = new THREE.ExtrudeGeometry(sh, { depth: CH_W, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.08, bevelSegments: 4, curveSegments: 40 });
  g.translate(0, 0, -CH_W / 2); g.computeVertexNormals(); return g;
}
function buttonsGeo() {
  const parts = [], sg = new THREE.SphereGeometry(0.035, 6, 4);
  for (let i = 0; i <= 26; i++) { const u = 0.03 + i / 26 * 0.94, p = chaiseTop(u), q = chaiseTop(Math.min(1, u + 0.01)), n = new THREE.Vector2(-(q.y - p.y), q.x - p.x).normalize();
    for (let k = 0; k < 4; k++) { const z = -CH_W / 2 + 0.15 + (k + (i % 2) * 0.5) * (CH_W - 0.3) / 3.5; const b = sg.clone(); b.translate(p.x + n.x * 0.085, p.y + n.y * 0.085, z); parts.push(b); } }
  for (let i = 0; i < 40; i++) { const u = i / 39, p = chaiseTop(u); for (const z of [-CH_W / 2 - 0.09, CH_W / 2 + 0.09]) { const b = sg.clone(); b.scale(0.6, 0.6, 0.6); b.translate(p.x, p.y - 0.06, z); parts.push(b); } } // nailhead trim
  return mergeGeometries(parts);
}
// giant dome birdcage (origin at the base ring)
const CG_R = 2.38, CG_H = 2.3, CG_D = 1.2;
function cageGeo() {
  const parts = [], N = 30;
  for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, g = new THREE.CylinderGeometry(0.022, 0.022, CG_H, 5); g.translate(Math.cos(a) * CG_R, CG_H / 2, Math.sin(a) * CG_R); parts.push(g); }
  for (let i = 0; i < N / 2; i++) { const a = i / (N / 2) * Math.PI * 2, pts = []; for (let k = 0; k <= 12; k++) { const s = k / 12 * Math.PI / 2; pts.push(new THREE.Vector3(Math.cos(a) * CG_R * Math.cos(s), CG_H + CG_D * Math.sin(s), Math.sin(a) * CG_R * Math.cos(s))); }
    parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.024, 5)); }
  for (const [r, y, t] of [[CG_R, 0.03, 0.06], [CG_R, 0.85, 0.03], [CG_R, CG_H, 0.06], [CG_R * Math.cos(0.7), CG_H + CG_D * Math.sin(0.7), 0.035]]) { const g = new THREE.TorusGeometry(r, t, 6, 64); g.rotateX(Math.PI / 2); g.translate(0, y, 0); parts.push(g); }
  const top = new THREE.SphereGeometry(0.16, 12, 8); top.translate(0, CG_H + CG_D + 0.06, 0); parts.push(top);
  const ring = new THREE.TorusGeometry(0.16, 0.035, 6, 20); ring.translate(0, CG_H + CG_D + 0.34, 0); parts.push(ring);
  return mergeGeometries(parts.map(g => g.index ? g.toNonIndexed() : g));
}
function lanternGeo() {
  const pts = []; for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI; pts.push(new THREE.Vector2(0.06 + 0.4 * Math.sin(a), -Math.cos(a) * 0.5)); }
  return new THREE.LatheGeometry(pts, 18);
}

const CSS = `
body.theme-hoi-an{font-family:"Be Vietnam Pro","Segoe UI",system-ui,sans-serif;color:#f6e7c8;background:#0c1026}
.theme-hoi-an .glass{background:linear-gradient(135deg,rgba(38,18,14,.86),rgba(70,30,22,.8));border:1.5px solid rgba(232,178,58,.55);box-shadow:0 8px 24px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,220,150,.15);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-radius:14px;color:#f6e7c8}
.theme-hoi-an .brand b{color:#E8B23A;font-weight:800;letter-spacing:.4px}
.theme-hoi-an .brand small{color:#d9b98a}
.theme-hoi-an .brand .dot{background:radial-gradient(circle at 40% 35%,#ffd27a,#C8102E 70%);box-shadow:0 0 12px #ff5a3a}
.theme-hoi-an .note.ok{color:#9fe0a8}.theme-hoi-an .note.off{color:#ff9a8a}
.theme-hoi-an #btn-task,.theme-hoi-an #btn-blk,.theme-hoi-an #btn-q,.theme-hoi-an .btn-th{color:#ffe3a3;border-color:rgba(232,178,58,.6);font-weight:700}
.theme-hoi-an #btn-task{background:linear-gradient(135deg,#a50e26,#5a1410)}
.theme-hoi-an .card .hd{color:#E8B23A}.theme-hoi-an #act-list li{border-top-color:rgba(232,178,58,.18);color:#e8d3ae}.theme-hoi-an #act-list li b{color:#ffd27a}
.theme-hoi-an .zb button{background:#3a1a12;border-color:rgba(232,178,58,.4);color:#ffd27a}
.theme-hoi-an .room-label{position:relative;padding:6px 11px 6px 6px;gap:7px;background:linear-gradient(180deg,#b3102a,#7a0a1c);border:1.7px solid #E8B23A;border-radius:7px;box-shadow:0 0 0 2px #3e2516,0 6px 22px rgba(0,0,0,.6),0 0 26px rgba(232,120,40,.35);color:#fff}
.theme-hoi-an .room-label:before{content:"";position:absolute;left:50%;top:-8px;width:1.5px;height:7px;background:#E8B23A}
.theme-hoi-an .room-label:after{content:"";position:absolute;left:50%;bottom:-6px;width:4px;height:6px;margin-left:-2px;background:#E8B23A;border-radius:0 0 3px 3px}
.theme-hoi-an .room-label .ic{width:23px;height:23px;font-size:13px;border-radius:50%;background:#fff3d6;box-shadow:inset 0 0 0 2px var(--c)}
.theme-hoi-an .room-label b{color:#fff6dc;font-size:11px;font-weight:800;letter-spacing:.3px;text-shadow:0 1px 2px #000}.theme-hoi-an .room-label small{color:#ffe3a3;font-size:8.5px;font-weight:600}
@media(max-width:700px){.theme-hoi-an .room-label{padding:3px 6px 3px 3px}.theme-hoi-an .room-label b{font-size:9px}.theme-hoi-an .room-label small{font-size:7.5px}.theme-hoi-an .room-label .ic{width:16px;height:16px;font-size:9px}}
.theme-hoi-an .bot-label{font-size:9px;line-height:1.2;padding:1px 5px;border-radius:999px;background:rgba(30,12,8,.82);border:1px solid rgba(232,178,58,.45);color:#fff2d6;font-weight:600;gap:3px}
.theme-hoi-an .bot-label i{width:5px;height:5px}.theme-hoi-an .bot-label.walker{opacity:.85;font-style:italic;pointer-events:none}
@media(max-width:700px){.theme-hoi-an .bot-label{font-size:8px}}
.theme-hoi-an #task select,.theme-hoi-an #task textarea{background:#1e0e0a;border-color:rgba(232,178,58,.35);color:#f6e7c8}
.theme-hoi-an #tk-send{background:linear-gradient(135deg,#C8102E,#E8B23A)}
.theme-hoi-an .room-label{cursor:pointer}.theme-hoi-an .room-label:hover{filter:brightness(1.15)}
.theme-hoi-an #top{flex-wrap:wrap;gap:5px;max-width:calc(100% - 345px)}.theme-hoi-an #top>*{white-space:nowrap;flex-shrink:0}
.theme-hoi-an #top .brand small{display:none}@media(max-width:1400px){.theme-hoi-an #top .brand b{font-size:13px}.theme-hoi-an #top .pill,.theme-hoi-an #btn-task,.theme-hoi-an #btn-blk{font-size:12px;padding-left:9px;padding-right:9px}}.theme-hoi-an #top .glass{padding-top:8px;padding-bottom:8px}
@media(max-width:1400px){.theme-hoi-an #upd{font-size:0!important;padding:8px 10px!important}.theme-hoi-an #upd:before{content:"●";font-size:13px}}
.theme-hoi-an #btn-q{font-size:0!important;padding:8px 10px!important}.theme-hoi-an #btn-q:before{content:"✨";font-size:13px}
.theme-hoi-an .th-menu{position:relative;padding:0!important}.theme-hoi-an .th-menu summary{padding:8px 11px!important}.theme-hoi-an .th-menu summary{list-style:none;cursor:pointer;padding:9px 12px;font-size:12.5px;font-weight:700;color:#ffe3a3;white-space:nowrap}.theme-hoi-an .th-menu summary::-webkit-details-marker{display:none}
.theme-hoi-an .th-menu .dd{position:absolute;top:calc(100% + 6px);left:0;display:grid;gap:4px;padding:6px;min-width:180px;z-index:40}
.theme-hoi-an .th-menu .dd a{padding:8px 10px;border-radius:8px;color:#fff2d6;text-decoration:none;font-size:13px}.theme-hoi-an .th-menu .dd a:hover{background:rgba(232,178,58,.18)}
.theme-hoi-an #btn-music,.theme-hoi-an #btn-all{padding:9px 10px!important;white-space:nowrap}
@media(max-width:700px){.theme-hoi-an #top{flex-wrap:wrap;max-width:calc(100% - 16px);gap:5px}.theme-hoi-an #top .brand b{font-size:12px}.theme-hoi-an #top .glass{padding:6px 8px}.theme-hoi-an .th-menu summary{padding:7px 9px;font-size:12px}.theme-hoi-an #btn-music,.theme-hoi-an #btn-all{padding:7px 8px!important;font-size:12px!important}}
.theme-hoi-an #loading{color:#E8B23A;background:radial-gradient(circle,#2a1a3a,#0c1026)}
`;

export const theme = {
  id: 'hoi-an', name: 'Phố Hội Đèn Lồng', rooms: ROOMS,
  home: new THREE.Vector3(6, 18, 74), homeMobile: new THREE.Vector3(-11, 16, 140), target: new THREE.Vector3(-2, 15, 0),
  controls: { maxPolarAngle: 1.62, minDistance: 8, maxDistance: 160 },
  exposure: 1.08, bloom: [0.5, 0.45, 0.92], vignette: 0.28, mapRadius: 26, mapCore: '#E8B23A', mapLine: '#5a3a22', farDist: 95, css: CSS,
  walkPaths: [], s: {},
  // stair tower on the right: even flights at x≈19.3 run z +4 → -4, odd flights at x≈21.3 run z -4 → +4
  walkY(x, z) { const f = x < 20.3 ? (4 - z) / 8 : (z + 4) / 8; return Math.max(0, Math.min(1, f)) * FH; },

  init(ctx) {
    const { scene, renderer, QUALITY } = ctx, s = this.s; s.HI = QUALITY === 'high'; s.lanterns = [];
    s.G = { chaise: chaiseGeo(), btn: buttonsGeo(), cage: cageGeo(), lan: lanternGeo() };
    s.M = { cage: new THREE.MeshStandardMaterial({ color: 0x2b211b, metalness: 0.85, roughness: 0.32 }), btn: mat(0x2a1a10, { roughness: 0.4, metalness: 0.4 }),
      teak: mat(0x6b4226, { roughness: 0.55 }), teakD: mat(0x3e2516, { roughness: 0.6 }), gold: new THREE.MeshStandardMaterial({ color: 0xE8B23A, metalness: 0.8, roughness: 0.3 }),
      yellow: mat(0xE8B23A, { roughness: 0.85, map: tex(256, 256, (x, w, h) => { x.fillStyle = '#e2ab3a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${150 + (i % 60)},${90 + (i % 40)},20,.08)`; x.fillRect((i * 53) % w, (i * 97) % h, 8 + (i % 14), 6); } }) }),
      white: mat(0xfff3e0, { roughness: 0.9 }) };
    scene.background = new THREE.Color(0x0a0f2a);
    scene.fog = new THREE.FogExp2(0x0d1433, 0.0055);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(420, 32, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, map: tex(8, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#050820'); g.addColorStop(0.45, '#101a45'); g.addColorStop(0.53, '#2a2650'); g.addColorStop(1, '#0a0d20'); x.fillStyle = g; x.fillRect(0, 0, w, h); }) }));
    scene.add(sky);
    { const n = 900, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, e = 0.1 + Math.random() * 1.3, r = 380; pos.set([Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r], i * 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); s.stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xfff6dd, size: 1.4, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.8 })); scene.add(s.stars); }
    { const pm = new THREE.PMREMGenerator(renderer), es = tex(64, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2a3470'); g.addColorStop(0.5, '#a8603a'); g.addColorStop(1, '#3a1a10'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
      es.mapping = THREE.EquirectangularReflectionMapping; scene.environment = pm.fromEquirectangular(es).texture; scene.environmentIntensity = 0.35; }
    // full moon + glow
    const MP = new THREE.Vector3(-70, 92, -150);
    s.moon = new THREE.Mesh(new THREE.SphereGeometry(9, 32, 20), new THREE.MeshBasicMaterial({ color: 0xfff4d6, fog: false, map: tex(128, 64, (x, w, h) => { x.fillStyle = '#fff6dc'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(200,190,160,.35)'; for (let i = 0; i < 14; i++) { x.beginPath(); x.arc((i * 37) % w, (i * 19) % h, 3 + (i % 5) * 2, 0, 7); x.fill(); } }) }));
    s.moon.position.copy(MP); scene.add(s.moon);
    const glowT = tex(128, 128, (x, w) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,240,200,.9)'); g.addColorStop(0.25, 'rgba(255,225,170,.35)'); g.addColorStop(1, 'rgba(255,220,160,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); });
    s.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })); s.glow.scale.setScalar(70); s.glow.position.copy(MP); scene.add(s.glow);
    s.glowT = glowT;
    scene.add(new THREE.HemisphereLight(0x5a6bb0, 0x3a2010, 0.55));
    const moonL = new THREE.DirectionalLight(0xb8c6ff, 0.9); moonL.position.set(-30, 50, 40); moonL.castShadow = true;
    moonL.shadow.mapSize.set(s.HI ? 2048 : 1024, s.HI ? 2048 : 1024); Object.assign(moonL.shadow.camera, { left: -36, right: 36, top: 44, bottom: -10, near: 1, far: 160 }); moonL.target.position.set(2, 14, 0);
    moonL.shadow.bias = -0.0006; moonL.shadow.normalBias = 0.04; scene.add(moonL, moonL.target);
    this.buildStreet(ctx); this.buildShell(ctx); this.buildStairs(ctx); this.buildRoof(ctx); this.buildNeighbours(ctx);
  },

  lantern(par, x, y, z, color = P.red, sc = 1, str = 0.6) {
    const s = this.s, pv = new THREE.Group(); pv.position.set(x, y, z); par.add(pv);
    const body = new THREE.Mesh(s.G.lan, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.5, roughness: 0.8, side: THREE.DoubleSide }));
    body.position.y = -str - 0.55 * sc; body.scale.setScalar(sc); pv.add(body);
    for (const dy of [0.5, -0.5]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.15 * sc, 0.15 * sc, 0.08 * sc, 12), s.M.gold); c.position.y = body.position.y + dy * sc; pv.add(c); }
    const tas = new THREE.Mesh(new THREE.ConeGeometry(0.06 * sc, 0.4 * sc, 6), new THREE.MeshStandardMaterial({ color: 0xffc23a, emissive: 0x8a4a00 })); tas.position.y = body.position.y - 0.75 * sc; tas.rotation.x = Math.PI; pv.add(tas);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, str, 4), s.M.teakD); st.position.y = -str / 2; pv.add(st);
    s.lanterns.push({ pv, ph: x * 0.37 + y * 0.21 + z * 0.13, a: 0.06 + ((x * 7 + y) % 3) * 0.015 }); return pv;
  },

  buildStreet(ctx) {
    const { scene } = ctx, s = this.s;
    const stone = tex(256, 256, (x, w, h) => { x.fillStyle = '#4a4440'; x.fillRect(0, 0, w, h); for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { x.fillStyle = `hsl(25,${8 + (i * j) % 7}%,${30 + ((i * 7 + j * 3) % 9)}%)`; x.fillRect(i * 32 + (j % 2) * 16 + 1, j * 32 + 1, 30, 30); } }); stone.repeat.set(30, 8);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(240, 46), mat(0xffffff, { map: stone, roughness: 0.9 })); g.rotation.x = -Math.PI / 2; g.position.set(0, -0.02, 4); g.receiveShadow = true; scene.add(g);
    // Thu Bồn river with moon reflection
    s.water = new THREE.Mesh(new THREE.PlaneGeometry(420, 200), new THREE.MeshStandardMaterial({ color: 0x0b1638, roughness: 0.12, metalness: 0.6 })); s.water.rotation.x = -Math.PI / 2; s.water.position.set(0, -0.6, 127); scene.add(s.water);
    const refl = tex(64, 256, (x, w, h) => { for (let j = 0; j < h; j += 3) { x.fillStyle = `rgba(255,230,170,${0.5 * (1 - j / h) * (0.4 + Math.random() * 0.6)})`; x.fillRect(w / 2 - (6 + Math.random() * 22), j, 12 + Math.random() * 44, 2); } });
    s.refl = new THREE.Mesh(new THREE.PlaneGeometry(14, 120), new THREE.MeshBasicMaterial({ map: refl, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); s.refl.rotation.x = -Math.PI / 2; s.refl.position.set(-22, -0.55, 90); scene.add(s.refl);
    // river lanterns (floating)
    s.boats = [[-14, 35, 0.1, 1.3], [6, 42, -0.15, 1.2], [24, 33, 3.0, 1.2], [-4, 50, 3.3, 1.4]].map(([x, z, ry, sc], i) => ({ g: makeBoat(THREE, mat, this.lantern.bind(this), scene, x, z, ry, sc), x0: x, z, ph: i * 1.7, sp: i % 2 ? -1 : 1 }));
    s.ff = fireflies(THREE, scene);
    s.floaters = []; for (let i = 0; i < 18; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), new THREE.MeshStandardMaterial({ color: [P.red, P.gold, 0xff7a3a][i % 3], emissive: [P.red, P.gold, 0xff7a3a][i % 3], emissiveIntensity: 2 })); m.scale.y = 0.7; m.position.set(-40 + (i * 23) % 80, -0.45, 32 + (i * 13) % 26); scene.add(m); s.floaters.push({ m, x0: m.position.x, ph: i }); }
    // quay edge + string lanterns along the street
    box(240, 0.7, 0.8, mat(0x5b5148), 0, -0.3, 27, scene);
    for (let i = 0; i < 16; i++) { const x = -60 + i * 8; const post = box(0.18, 4.2, 0.18, s.M.teakD, x, 2.1, 25.5, scene); if (i % 2) this.lantern(scene, x, 4.0, 25.5, i % 4 === 1 ? P.gold : P.red, 0.7, 0.3); }
  },

  buildShell(ctx) {
    const { scene } = ctx, s = this.s, M = s.M; s.levels = [];
    const H = FH * 6;
    // turmeric side walls with shuttered windows (exterior) + facade pilasters
    const winT = tex(128, 256, (x, w, h) => { x.fillStyle = '#e2ab3a'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffd98a'; x.fillRect(30, 60, 68, 120); x.fillStyle = '#ffcf6a'; x.beginPath(); x.arc(64, 60, 34, Math.PI, 0); x.fill(); x.fillStyle = '#2f5b3e'; x.fillRect(12, 50, 18, 132); x.fillRect(98, 50, 18, 132); x.fillStyle = '#7a4a22'; x.fillRect(26, 180, 76, 8); });
    winT.repeat.set(2, 6);
    const sideM = mat(0xffffff, { map: winT, roughness: 0.85, emissive: 0x3a2000, emissiveIntensity: 0.15 });
    for (const sx of [-1, 1]) { const w = box(0.6, H, 2 * D + 0.6, [sideM, sideM, M.yellow, M.yellow, M.yellow, M.yellow], sx * (HW + 0.3), H / 2, 0, scene); }
    box(2 * HW + 1.2, H, 0.6, M.yellow, 0, H / 2, -D - 0.3, scene);
    for (const sx of [-1, 1]) box(1.0, H + 0.4, 1.0, M.yellow, sx * (HW + 0.3), H / 2 + 0.2, D + 0.2, scene);
    // floor slabs (teak edge + gold trim), and ground plinth with steps
    const plank = tex(256, 256, (x, w, h) => { for (let j = 0; j < 16; j++) { x.fillStyle = `hsl(24,${40 + (j * 7) % 12}%,${24 + (j * 5) % 7}%)`; x.fillRect(0, j * 16, w, 15); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(((j * 73) % w), j * 16, 2, 16); } }); plank.repeat.set(8, 3);
    const floorM = mat(0xffffff, { map: plank, roughness: 0.45 });
    box(2 * HW + 3, 0.6, 2 * D + 3, mat(0x6d625a), 0, 0.0, 0.5, scene);
    for (let i = 0; i < 3; i++) box(2 * HW - 6, 0.2, 0.6, mat(0x7a6e64), 0, -0.2 + i * 0.0 + 0.1 - i * 0.12, D + 2.2 + i * 0.6, scene);
    for (let L = 0; L <= 6; L++) {
      const y = L * FH;
      if (L > 0) { box(2 * HW + 0.6, 0.34, 2 * D + 0.4, M.teak, 0, y - 0.17, 0.1, scene); box(2 * HW + 0.8, 0.1, 0.12, mat(0xc8962e, { roughness: 0.8 }), 0, y - 0.1, D + 0.35, scene); }
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(2 * HW, 2 * D), floorM); fl.rotation.x = -Math.PI / 2; fl.position.set(0, y + 0.31 * (L === 0), 0); fl.receiveShadow = true; scene.add(fl);
      s.levels.push(y + (L === 0 ? 0.31 : 0.01));
      // eave lanterns along the front edge of each slab
      if (L > 0) for (let i = 0; i < 9; i++) { const x = -HW + 1.5 + i * (2 * HW - 3) / 8; if (L === 6 && Math.abs(x) < 11) continue; this.lantern(scene, x, y - 0.35, D + 0.15, L === 6 ? P.red : (i % 2 ? P.red : 0xd8261a), 0.62, 0.25); }
    }
    // small tile awning over the lobby front + left facade lanterns
    for (let L = 1; L < 6; L++) this.lantern(scene, -HW - 1.4, L * FH + 3.2, D - 0.5, P.red, 0.8, 0.5);
    for (let L = 1; L < 6; L++) { const br = box(1.6, 0.12, 0.12, M.teakD, -HW - 0.8, L * FH + 3.25, D - 0.5, scene); }
  },

  tileTex() { return this._tt || (this._tt = tex(256, 128, (x, w, h) => { x.fillStyle = '#8a3a20'; x.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { const g = x.createLinearGradient(i * 16, 0, i * 16 + 16, 0); const yang = i % 2; g.addColorStop(0, yang ? '#6a2a16' : '#a8502c'); g.addColorStop(0.5, yang ? '#8a3a20' : '#c86a3a'); g.addColorStop(1, yang ? '#6a2a16' : '#a8502c'); x.fillStyle = g; x.fillRect(i * 16, 0, 16, h); } for (let j = 0; j < h; j += 16) { x.fillStyle = 'rgba(30,10,5,.35)'; x.fillRect(0, j, w, 2); } })); },
  tileRoof(par, w, d, h, x, y, z, rep = 4) {
    const t = this.tileTex().clone(); t.needsUpdate = true; t.repeat.set(rep, rep / 2);
    const g = new THREE.ConeGeometry(1, 1, 4, 1, true); g.rotateY(Math.PI / 4); g.computeVertexNormals();
    const r = new THREE.Mesh(g, mat(0xffffff, { map: t, roughness: 0.75, side: THREE.DoubleSide })); r.scale.set(w / 1.414, h, d / 1.414); r.position.set(x, y + h / 2, z); r.castShadow = true; par.add(r);
    const ridge = box(w * 0.18, 0.25, 0.3, mat(0x5a2414), x, y + h * 0.98, z, par);
    for (const sx of [-1, 1]) { const tip = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.09, 6, 12, Math.PI), mat(0x5a2414)); tip.position.set(x + sx * w * 0.09, y + h + 0.1, z); par.add(tip); }
    return r;
  },

  buildStairs(ctx) {
    const { scene } = ctx, s = this.s, M = s.M, X0 = HW + 0.6, X1 = HW + 5.2, H = FH * 6;
    box(X1 - X0 + 0.6, H, 0.5, M.yellow, (X0 + X1) / 2, H / 2, -D - 0.3, scene);
    box(0.5, H, 2 * D + 0.6, M.yellow, X1 + 0.3, H / 2, 0, scene);
    box(0.6, H + 0.4, 0.8, M.yellow, X1 + 0.3, H / 2 + 0.2, D + 0.2, scene);
    const stepM = mat(0x7a4a2a, { roughness: 0.6 }), N = 10;
    for (let L = 0; L < 6; L++) {
      const y0 = s.levels[L], even = L % 2 === 0, x = even ? 19.3 : 21.3;
      for (let i = 0; i < N; i++) { const f = (i + 0.5) / N, z = even ? 4 - f * 8 : -4 + f * 8; box(1.7, 0.18, 0.86, stepM, x, y0 + f * FH - 0.09, z, scene); }
      const ang = Math.atan2(FH, 8), rail = box(0.08, 0.08, Math.hypot(8, FH), M.teakD, x + (even ? -0.85 : 0.85), y0 + FH / 2 + 0.9, 0, scene); rail.rotation.x = even ? ang : -ang;
      // landings
      box(X1 - X0, 0.2, 1.6, M.teak, (X0 + X1) / 2, s.levels[L + 1] - 0.1, even ? -4.8 : 4.8, scene);
      this.lantern(scene, 20.3, s.levels[L + 1] + FH * 0.75, even ? 4.8 : -4.8, P.red, 0.55, 0.3);
      // door from the floor into the stair tower
      box(0.1, 2.6, 1.3, M.teakD, HW + 0.62, s.levels[L] + 1.3, even ? 4.8 : -4.8, scene);
    }
    box(X1 - X0, 0.2, 1.6, M.teak, (X0 + X1) / 2, s.levels[0] - 0.1, 4.8, scene);
    this.tileRoof(scene, X1 - X0 + 2, 2 * D + 2, 2.2, (X0 + X1) / 2, H + 0.2, 0, 3);
    // messenger bots walk the stairs (between floors)
    const flights = [0, 1, 2, 3, 4, 5], names = ['🏮 đưa tin', '📦 chuyển hàng', '🧾 báo cáo', '🏮 đưa tin', '💌 tin nhắn', '🌙 tuần tra'];
    flights.forEach((L, k) => { const even = L % 2 === 0, x = even ? 19.3 : 21.3, y = s.levels[L];
      this.walkPaths.push([new THREE.Vector3(x, y, even ? 5.0 : -5.0), new THREE.Vector3(x, y, even ? -5.0 : 5.0), names[k]]); });
  },

  buildRoof(ctx) {
    const { scene } = ctx, s = this.s, M = s.M, y = FH * 6;
    // balustrade + pavilion columns + big yin-yang tile roof
    for (let i = 0; i < 17; i++) { const x = -HW + 0.5 + i * (2 * HW - 1) / 16; box(0.14, 0.9, 0.14, M.teakD, x, y + 0.45, D + 0.1, scene); }
    box(2 * HW, 0.12, 0.2, M.teak, 0, y + 0.95, D + 0.1, scene);
    for (const [x, z] of [[-11, -5], [11, -5], [-11, 4.5], [11, 4.5]]) { box(0.45, 4.6, 0.45, mat(0x8a1a1a, { roughness: 0.5 }), x, y + 2.3, z, scene); }
    box(23, 0.35, 10.4, M.teak, 0, y + 4.7, -0.25, scene);
    this.tileRoof(scene, 30, 16, 4.2, 0, y + 4.85, -0.25, 6);
    // lantern garden: strings of lanterns + potted plants
    for (let i = 0; i < 9; i++) this.lantern(scene, -10 + i * 2.5, y + 4.5, 4.4, i % 2 ? P.gold : P.red, 0.55, 0.4 + (i % 3) * 0.3);
    for (let i = 0; i < 7; i++) this.lantern(scene, -9 + i * 3, y + 4.5, -2.5, [P.red, 0xff7a3a, P.gold][i % 3], 0.5, 0.8 + (i % 2) * 0.4);
    for (const x of [-15.5, -13, 13, 15.5]) for (const z of [-4.5, 3.5]) this.plant(scene, x, y, z, 0.9 + (x * z % 3) * 0.1);
  },
  plant(par, x, y, z, sc = 1) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.4 * sc, 0.3 * sc, 0.6 * sc, 12), mat(0x2E3A87, { roughness: 0.3 })); pot.position.set(x, y + 0.3 * sc, z); pot.castShadow = true; par.add(pot);
    const lm = mat(0x3F7D58, { roughness: 0.8 }); for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.35 * sc, 8, 6), lm); l.scale.set(1, 1.4, 0.4); l.position.set(x + Math.cos(i) * 0.25 * sc, y + (0.95 + (i % 3) * 0.25) * sc, z + Math.sin(i) * 0.25 * sc); l.rotation.z = Math.cos(i) * 0.6; par.add(l); }
  },
  buildNeighbours(ctx) {
    const { scene } = ctx, s = this.s;
    const W = tex(128, 128, (x, w, h) => { x.fillStyle = '#c8952e'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffcf7a'; x.fillRect(20, 30, 30, 50); x.fillRect(78, 30, 30, 50); x.fillStyle = '#284d36'; x.fillRect(14, 28, 6, 54); x.fillRect(50, 28, 6, 54); x.fillRect(72, 28, 6, 54); x.fillRect(108, 28, 6, 54); });
    const houses = [[-36, 12, 9, 12], [-52, 10, 7, 11], [36, 11, 8, 12], [51, 12, 10, 11], [-68, 12, 8, 10], [67, 10, 7, 10]];
    houses.forEach(([x, w, h, d], i) => { const t = W.clone(); t.needsUpdate = true; t.repeat.set(Math.round(w / 5), Math.round(h / 4));
      box(w, h, d, mat(0xffffff, { map: t, roughness: 0.85, emissive: 0x402000, emissiveIntensity: 0.2 }), x, h / 2, -1 - (i % 2) * 2, scene);
      this.tileRoof(scene, w + 2, d + 2, 2.6, x, h, -1 - (i % 2) * 2, 3);
      for (let k = 0; k < 3; k++) this.lantern(scene, x - w / 3 + k * w / 3, h - 0.6, d / 2 - 1 - (i % 2) * 2 + 0.4, k % 2 ? P.gold : P.red, 0.5, 0.2); });
  },

  // ---------- rooms ----------
  chaise(par, color, x, y, z, ry = 0) {
    const s = this.s, g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(CH_S); par.add(g);
    const m = new THREE.Mesh(s.G.chaise, new THREE.MeshPhysicalMaterial({ color, roughness: 0.55, sheen: 1, sheenColor: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.4), sheenRoughness: 0.4 })); m.castShadow = m.receiveShadow = true; g.add(m);
    g.add(new THREE.Mesh(s.G.btn, s.M.btn));
    for (const lx of [-1.4, 1.4]) for (const lz of [-0.38, 0.38]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.16, 6), s.M.gold); l.position.set(lx, 0.07, lz); g.add(l); }
    return g;
  },
  cageBed(par, color, x, y, z) {
    const s = this.s, g = new THREE.Group(); g.position.set(x, y, z); par.add(g);
    const stepM = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(color).multiplyScalar(0.55), roughness: 0.6, sheen: 0.6, sheenColor: new THREE.Color(color) });
    const st1 = new THREE.Mesh(new THREE.CylinderGeometry(3.05, 3.05, 0.22, 48), stepM); st1.position.y = 0.11; g.add(st1);
    const st2 = new THREE.Mesh(new THREE.CylinderGeometry(2.62, 2.62, 0.22, 48), stepM); st2.position.y = 0.33; g.add(st2);
    const glow = new THREE.Mesh(new THREE.TorusGeometry(3.06, 0.03, 6, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).lerp(new THREE.Color(0xffd0a0), 0.5) })); glow.rotation.x = Math.PI / 2; glow.position.y = 0.02; g.add(glow);
    const bed = new THREE.Mesh(new THREE.CylinderGeometry(2.22, 2.22, 0.45, 48), new THREE.MeshPhysicalMaterial({ color, roughness: 0.6, sheen: 1, sheenColor: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.5) })); bed.position.y = 0.44 + 0.225; g.add(bed);
    const cush = mat(0xd8c8b4, { roughness: 0.95 }), cush2 = mat(0xE8B23A, { roughness: 0.6 });
    [[-1.1, -1.3, 0], [0, -1.55, 0], [1.1, -1.3, 0], [-0.55, -0.9, 1], [0.55, -0.9, 1]].forEach(([cx, cz, k]) => { const c = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 10), k ? cush2 : cush); c.scale.set(1, k ? 0.6 : 0.85, 0.35); c.position.set(cx, 1.05 + (k ? -0.05 : 0.15), cz); c.rotation.y = -cx * 0.3; c.castShadow = true; g.add(c); });
    const throwM = mat(0xE8B23A, { roughness: 0.7 }), th = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.03, 0.5), throwM); th.position.set(0, 0.905, 0.6); g.add(th);
    const cage = new THREE.Mesh(s.G.cage, s.M.cage); cage.position.y = 0.44; cage.castShadow = true; g.add(cage);
    return g;
  },

  buildRooms(ctx, RM) {
    const { scene, put, label, screenTexture, makeBot, rooms, MOBILE } = ctx, s = this.s, M = s.M;
    s.roomLights = [];
    RM.forEach((R, L) => {
      const y = s.levels[L], g = new THREE.Group(); g.position.set(0, y, 0); scene.add(g);
      { const hb = new THREE.Mesh(new THREE.BoxGeometry(2 * HW, FH - 0.4, 2 * D), new THREE.MeshBasicMaterial({ visible: false })); hb.position.set(0, (FH - 0.4) / 2, 0); hb.userData.L = L; g.add(hb); (s.floorHits = s.floorHits || []).push(hb); }
      const room = { def: R, bots: [], map: [-20 + L * 6.6, (L % 2 ? 8 : -8)] };
      if (R.wall) { const t = tex(512, 256, WALLS[R.wall]); t.repeat.set(5, 1);
        const wm = mat(0xffffff, { map: t, roughness: 0.85 }); const bw = new THREE.Mesh(new THREE.PlaneGeometry(2 * HW, FH - 0.34), wm); bw.position.set(0, (FH - 0.34) / 2, -D + 0.01); bw.receiveShadow = true; g.add(bw);
        for (const sx of [-1, 1]) { const t2 = t.clone(); t2.needsUpdate = true; t2.repeat.set(2, 1); const sw = new THREE.Mesh(new THREE.PlaneGeometry(2 * D, FH - 0.34), mat(0xffffff, { map: t2, roughness: 0.85 })); sw.rotation.y = -sx * Math.PI / 2; sw.position.set(sx * (HW - 0.01), (FH - 0.34) / 2, 0); sw.receiveShadow = true; g.add(sw); }
        // carved teak ceiling beam + wainscot + framed art
        box(2 * HW, 0.3, 0.3, M.teakD, 0, FH - 0.5, -D + 0.2, g); box(2 * HW, 0.7, 0.06, M.teak, 0, 0.35, -D + 0.05, g);
        for (const ax of [-6.5, 6.5]) { box(1.6, 1.1, 0.06, M.gold, ax, 2.7, -D + 0.06, g); box(1.4, 0.9, 0.04, mat(new THREE.Color(R.up).lerp(new THREE.Color(0xfff0d0), 0.5)), ax, 2.7, -D + 0.1, g); }
        const pl = new THREE.PointLight(0xffb36a, 11, 26, 1.2); pl.position.set(-3, FH - 1.1, 0.5); g.add(pl); s.roomLights.push(pl);
        // ceiling lanterns inside the room
        for (const lx of [-13, -4, 4, 13]) this.lantern(g, lx, FH - 0.34, 0.5, R.wall === 'bamboo' ? P.red : (R.wall === 'lantern' ? P.gold : P.red), 0.5, 0.35);
      } else { const pl = new THREE.PointLight(0xffa860, 22, 30, 1.3); pl.position.set(0, 4, 1); g.add(pl); }
      // exactly one S-chaise + one birdcage bed per room
      const chX = -11.5, chZ = -1.2; this.chaise(g, R.up, chX, 0, chZ, 0);
      this.cageBed(g, R.up, 0, 0, -2.1);
      this.plant(g, -15.6, 0, -4.8); this.plant(g, 15.4, 0, -4.8, 0.8);
      if (L === 0) { // lobby: carved teak reception counter
        box(4.2, 1.05, 0.7, M.teak, -6.5, 0.53, 3.55, g); box(4.4, 0.08, 0.85, M.gold, -6.5, 1.08, 3.55, g);
        for (let i = 0; i < 5; i++) box(0.55, 0.6, 0.04, M.teakD, -8.2 + i * 0.85, 0.55, 3.92, g);
        put('bookcaseOpen', g, 14.8, 0, -4.9, 0, 2.4);
      }
      // poufs for idle bots (2nd..4th)
      const poufs = [[5.2, -3.4], [8.4, -3.4], [11.6, -3.4]];
      poufs.slice(0, Math.max(0, R.bots.length - 1)).forEach(([px, pz]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.42, 20), new THREE.MeshPhysicalMaterial({ color: R.up, roughness: 0.6, sheen: 1, sheenColor: new THREE.Color(0xffe0c0) })); p.position.set(px, 0.21, pz); p.castShadow = true; g.add(p); });
      if (R.bots.length > 1) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 20), M.teak); t.position.set(6.8, 0.62, -4.6); g.add(t); box(0.1, 0.6, 0.1, M.teakD, 6.8, 0.3, -4.6, g); }
      const deskX = [-6.5, 5.2, 8.8, 12.4];
      R.bots.forEach((name, i) => {
        const wx = deskX[i], wz = 2.0, ws = new THREE.Group(); ws.position.set(wx, 0, wz); ws.rotation.y = Math.PI; g.add(ws);
        const dz = -0.9; put('desk', ws, 0, 0.0, dz, Math.PI);
        const screens = []; const scn = put('computerScreen', ws, 0.62, 1.03, dz - 0.1, -0.35);
        const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.6), new THREE.MeshBasicMaterial({ map: screenTexture(R.color, i * 2 + L), color: 0xffffff })); gl.position.set(0, 0.42, 0.08); scn.add(gl); screens.push(gl);
        put('computerKeyboard', ws, 0, 1.03, dz + 0.22, Math.PI); put('chairDesk', ws, 0, 0, dz + 1.0, 0);
        // world (room) → ws local
        const loc = (X, Z) => new THREE.Vector3(-(X - wx), 0, -(Z - wz));
        let sp, sry, ap;
        if (i === 0) { const u = 0.55, top = chaiseTop(u); sp = loc(chX + top.x * CH_S, chZ); sp.y = top.y * CH_S - 0.15; sry = 0 - Math.PI; ap = loc(chX + top.x, chZ + 1.4); }
        else { const [px, pz] = poufs[i - 1]; sp = loc(px, pz); sp.y = 0.3; sry = 0 - Math.PI; ap = loc(px, pz + 1.1); }
        const seat = { floorY: 0, desk: { p: new THREE.Vector3(0, 0.38, dz + 0.95), ry: Math.PI, approach: new THREE.Vector3(0, 0, dz + 1.8) }, sofa: { p: sp, ry: sry, approach: ap } };
        makeBot(name, room, ws, seat, screens);
      });
      // exterior signboard: teak bracket arm off the left facade + CSS2D sign (always faces camera, outside the building)
      const SX = -HW - 4.6, SY = FH * 0.5; box(4.0, 0.14, 0.14, M.teakD, -HW - 2.6, SY + 0.95, D - 0.2, g); box(0.08, 0.35, 0.08, M.gold, SX, SY + 0.78, D - 0.2, g);
      const lab = label('', 'room-label'); lab.position.set(SX, SY, D - 0.2); g.add(lab); room.label = lab; lab.element.style.setProperty('--c', '#' + new THREE.Color(R.color).getHexString());
      rooms.push(room);
    });
    this.setupUI(ctx);
  },

  flyTo(L) { const s = this.s, c = s.ctx; let p1, q1;
    if (L == null) { p1 = (c.MOBILE ? this.homeMobile : this.home).clone(); q1 = this.target.clone(); }
    else { const y = s.levels[L]; p1 = new THREE.Vector3(-3, y + 3.0, c.MOBILE ? 30 : 21); q1 = new THREE.Vector3(-3, y + 1.9, -2); }
    s.fly = { p0: c.camera.position.clone(), q0: c.controls.target.clone(), p1, q1, t: 0 }; s.zoomed = L; document.body.classList.toggle('hoian-zoom', L != null); },
  setupUI(ctx) { const s = this.s; s.ctx = ctx;
    const top = document.getElementById('top'), mk = (id, txt, fn) => { const b = document.createElement('button'); b.id = id; b.className = 'glass btn-th'; b.style.cssText = 'padding:9px 12px;font-size:12.5px;cursor:pointer;font-family:inherit'; b.textContent = txt; b.onclick = fn; top.insertBefore(b, document.getElementById('upd')); return b; };
    const m = music(); const mb = mk('btn-music', '🔇', () => { const on = m.toggle(); mb.textContent = on ? '🎵' : '🔇'; mb.title = on ? 'Tắt nhạc' : 'Bật nhạc'; }); mb.title = 'Bật nhạc nền';
    mk('btn-all', '🏯', () => this.flyTo(null));
    document.getElementById('btn-all').title = 'Xem toàn cảnh (Esc)';
    { const u = document.getElementById('upd'), fix = () => { const t = u.textContent, n = t.replace('cập nhật lúc ', ''); if (n !== t) u.textContent = n; }; new MutationObserver(fix).observe(u, { childList: true, characterData: true, subtree: true }); u.title = 'Lần cập nhật trạng thái gần nhất'; }
    addEventListener('keydown', e => { if (e.key === 'Escape') this.flyTo(null); });
    // click a floor sign (capture phase, so the core's task panel does not open) or the floor itself
    // OrbitControls captures the pointer, so the click target can be the label layer: also look under the cursor
    document.addEventListener('click', e => { const el = (e.target.closest && e.target.closest('.room-label')) || document.elementsFromPoint(e.clientX, e.clientY).map(x => x.closest && x.closest('.room-label')).find(Boolean); if (!el) return; const L = ctx.rooms.findIndex(r => r.label.element === el); if (L >= 0) { e.stopPropagation(); this.flyTo(L); } }, true);
    const dom = ctx.controls.domElement, ray = new THREE.Raycaster(), v = new THREE.Vector2(); let d0 = null;
    dom.addEventListener('pointerdown', e => d0 = [e.clientX, e.clientY]);
    dom.addEventListener('pointerup', e => { if (!d0 || Math.hypot(e.clientX - d0[0], e.clientY - d0[1]) > 6) return; v.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1); ray.setFromCamera(v, ctx.camera);
      const h = ray.intersectObjects(s.floorHits)[0]; if (h && !ray.intersectObjects(ctx.bots.map(b => b.holder), true).length) this.flyTo(h.object.userData.L); });
  },
  update(dt, t) {
    const s = this.s;
    if (s.fly) { const f = s.fly; f.t = Math.min(1, f.t + dt / 1.6); const e = f.t * f.t * (3 - 2 * f.t), c = s.ctx; c.camera.position.lerpVectors(f.p0, f.p1, e); c.controls.target.lerpVectors(f.q0, f.q1, e); if (f.t >= 1) s.fly = null; }
    s.boats.forEach(b => { b.g.position.x = b.x0 + Math.sin(t * 0.05 * b.sp + b.ph) * 9; b.g.position.y = -0.55 + Math.sin(t * 1.1 + b.ph) * 0.06; b.g.rotation.z = Math.sin(t * 0.9 + b.ph) * 0.03; });
    s.ff(t);
    s.lanterns.forEach(l => { l.pv.rotation.z = Math.sin(t * 1.1 + l.ph) * l.a; l.pv.rotation.x = Math.sin(t * 0.8 + l.ph * 1.7) * l.a * 0.6; });
    const k = 1 + Math.sin(t * 0.7) * 0.06; s.glow.scale.setScalar(70 * k); s.glow.material.opacity = 0.85 + Math.sin(t * 0.7) * 0.12;
    s.refl.material.map.offset.y = (t * 0.03) % 1; s.refl.material.opacity = 0.8 + Math.sin(t * 1.3) * 0.15;
    s.floaters.forEach(f => { f.m.position.x = f.x0 + Math.sin(t * 0.15 + f.ph) * 2; f.m.position.y = -0.45 + Math.sin(t * 1.2 + f.ph) * 0.05; });
    s.roomLights.forEach((p, i) => p.intensity = 11 * (1 + Math.sin(t * 2.1 + i * 1.7) * 0.04));
    s.stars.material.opacity = 0.7 + Math.sin(t * 0.9) * 0.1;
  },
};
export default theme;
