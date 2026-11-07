// Theme "Lâu đài kẹo ngọt": pastel candy castle on pink clouds.
import * as THREE from 'three';

const PLAT_R = 30, Y = 0.1, ROOM_R = 2.9;
const PASTEL = { pink: 0xffb3cf, mint: 0xb8f0d8, lilac: 0xd9c4f5, peach: 0xffd1b0, cream: 0xfff3e3, berry: 0xff7fae };
const ROOF = [0xff9fc6, 0x9fe6c6, 0xc7a8f0, 0xffbd8f];
const riverX = z => 5.5 * Math.sin(z * 0.16 + 0.6);

function tex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o });
const CSS = `
body.theme-keo-ngot{font-family:"Nunito","Quicksand",ui-rounded,"SF Pro Rounded","Segoe UI",system-ui,sans-serif;color:#6b3b5a;background:#ffe3ef}
.theme-keo-ngot .glass{background:linear-gradient(135deg,rgba(255,255,255,.82),rgba(255,228,240,.72));border:2px solid rgba(255,182,213,.9);box-shadow:0 8px 24px rgba(214,110,160,.25),inset 0 1px 0 #fff;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-radius:20px;color:#7a3c64}
.theme-keo-ngot .brand b{color:#e0558f;font-weight:800;letter-spacing:.3px;font-size:16px}
.theme-keo-ngot .brand small{color:#b07aa0}
.theme-keo-ngot .brand .dot{width:14px;height:14px;background:radial-gradient(circle at 35% 30%,#fff,#ffb3cf 45%,#ff7fae);box-shadow:0 0 0 3px #fff,0 0 10px #ff9cc5}
.theme-keo-ngot .pill,.theme-keo-ngot .note{color:#7a3c64}.theme-keo-ngot .note.ok{color:#2f9b6e}.theme-keo-ngot .note.off{color:#d64545}
.theme-keo-ngot #btn-task,.theme-keo-ngot #btn-blk,.theme-keo-ngot #btn-q{color:#c2407a;border-color:#ffb3cf;font-weight:800}
.theme-keo-ngot #btn-task{background:linear-gradient(135deg,#ffd6e7,#fff)}
.theme-keo-ngot .card .hd{color:#d0467f;font-weight:800}.theme-keo-ngot .card .hd:after{color:#ff8fbd}
.theme-keo-ngot #act-list li{border-top-color:rgba(255,160,200,.35);color:#86506f}.theme-keo-ngot #act-list li b{color:#c2407a}.theme-keo-ngot #act-list li em{color:#c79ab5}
.theme-keo-ngot .zb button{background:#fff0f6;border-color:#ffb3cf;color:#d0467f}
.theme-keo-ngot .room-label{background:rgba(255,255,255,.92);border:2px solid #ffc4dc;border-left:5px solid var(--c);color:#7a3c64;box-shadow:0 4px 14px rgba(214,110,160,.3)}
.theme-keo-ngot .room-label b{color:#c2407a}.theme-keo-ngot .room-label small{color:#a87596}
.theme-keo-ngot .room-label .ic{background:color-mix(in srgb,var(--c) 22%,#fff)}
.theme-keo-ngot .bot-label{font-size:9.5px;line-height:1.25;padding:1.5px 6px 1.5px 5px;border-radius:999px;background:rgba(255,255,255,.95);border:0;color:#5a2448;font-weight:800;letter-spacing:.1px;gap:3px;box-shadow:0 1px 4px rgba(150,60,110,.28)}
.theme-keo-ngot .bot-label i{width:5px;height:5px}.theme-keo-ngot .bot-label i.off{background:#c9a9bd}
@media(max-width:700px){.theme-keo-ngot .bot-label{font-size:8px;padding:1px 5px}}
.theme-keo-ngot .brain-label{background:linear-gradient(135deg,#fff,#ffe1ee);border:2px solid #ff9cc5;box-shadow:0 4px 18px rgba(255,120,170,.35)}
.theme-keo-ngot .brain-label b{color:#e0558f;letter-spacing:2px}.theme-keo-ngot .brain-label span{color:#a87596}
.theme-keo-ngot #task select,.theme-keo-ngot #task textarea{background:#fff;border:1.5px solid #ffc4dc;color:#6b3b5a}
.theme-keo-ngot #task label,.theme-keo-ngot #tk-ctx,.theme-keo-ngot #tk-n{color:#a87596}
.theme-keo-ngot #tk-send{background:linear-gradient(135deg,#ff8fbd,#ffb38f);color:#fff}
.theme-keo-ngot #task h4{border-top-color:#ffd0e3;color:#d0467f}.theme-keo-ngot #tk-list li{color:#86506f;border-top-color:#ffe0ec}.theme-keo-ngot #tk-list li b{color:#c2407a}
.theme-keo-ngot #blk-list li{background:#fff2f5;border-color:#ffb3c4;color:#7a3c64}.theme-keo-ngot #blk-list li b{color:#c2407a}.theme-keo-ngot #blk-list .t{color:#d64565}.theme-keo-ngot #blk-list .a{color:#c27a1a}
.theme-keo-ngot #blk-n.on{color:#fff;background:#ff5f8f}
.theme-keo-ngot #tip{color:#7a3c64}.theme-keo-ngot #help{color:#a87596}
.theme-keo-ngot #loading{color:#e0558f;background:radial-gradient(circle,#fff,#ffd6e7);font-weight:800}
`;

export const theme = {
  id: 'keo-ngot', name: 'Lâu đài kẹo ngọt',
  home: new THREE.Vector3(0, 50, 58), homeMobile: new THREE.Vector3(0, 100, 60), target: new THREE.Vector3(0, 1, 3),
  controls: { maxPolarAngle: 1.35, minDistance: 10, maxDistance: 170 },
  exposure: 0.82, bloom: [0.08, 0.4, 0.98], vignette: 0.2, mapRadius: 32, mapCore: '#ff7fae', mapLine: '#ffc4dc', farDist: 80, css: CSS,
  walkPaths: [], s: {},

  init(ctx) {
    const { scene, renderer, QUALITY } = ctx, s = this.s; s.HI = QUALITY === 'high';
    scene.background = new THREE.Color(0xffd9e8);
    scene.fog = new THREE.Fog(0xffc9df, 160, 360);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, map: tex(8, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffc1da'); g.addColorStop(0.42, '#ffe4ef'); g.addColorStop(0.55, '#ffd2e4'); g.addColorStop(1, '#f7b3cf'); x.fillStyle = g; x.fillRect(0, 0, w, h); }) }));
    scene.add(sky);
    { const pm = new THREE.PMREMGenerator(renderer), es = tex(64, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#ffe2ee'); g.addColorStop(1, '#f2a9c8'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
      es.mapping = THREE.EquirectangularReflectionMapping; scene.environment = pm.fromEquirectangular(es).texture; }
    scene.add(new THREE.HemisphereLight(0xfff4fa, 0xd98ab0, 0.55));
    const sun = new THREE.DirectionalLight(0xfff1e8, 1.9); sun.position.set(-26, 46, 32); sun.castShadow = true;
    sun.shadow.mapSize.set(s.HI ? 2048 : 1024, s.HI ? 2048 : 1024); Object.assign(sun.shadow.camera, { left: -38, right: 38, top: 38, bottom: -38, near: 1, far: 130 });
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04; scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffd6ea, 0.6); fill.position.set(30, 18, -20); scene.add(fill);
    this.buildClouds(ctx); this.buildPlatform(ctx); this.buildTower(ctx); this.buildRiver(ctx); this.buildDecor(ctx);
  },

  buildClouds(ctx) {
    const s = this.s, cm = new THREE.MeshStandardMaterial({ color: 0xffe4ef, roughness: 1, emissive: 0xff9cc5, emissiveIntensity: 0.25 }), g = new THREE.SphereGeometry(1, 20, 14);
    s.clouds = [];
    const puff = (x, y, z, sc, n = 7) => { const c = new THREE.Group(); for (let i = 0; i < n; i++) { const m = new THREE.Mesh(g, cm), a = i / n * Math.PI * 2; m.position.set(Math.cos(a) * sc * 0.9 * (0.6 + (i % 3) * 0.2), (i % 2) * sc * 0.25, Math.sin(a) * sc * 0.5); m.scale.setScalar(sc * (0.55 + ((i * 7) % 5) * 0.1)); c.add(m); } c.position.set(x, y, z); ctx.scene.add(c); s.clouds.push({ c, y0: y, ph: x * 0.1 + z * 0.07 }); return c; };
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; puff(Math.sin(a) * 30, -9 - (i % 3) * 2, Math.cos(a) * 28, 7 + (i % 3) * 2, 8); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + 0.3; puff(Math.sin(a) * (95 + (i % 4) * 25), -6 + (i % 5) * 9, Math.cos(a) * (95 + (i % 3) * 25), 12 + (i % 4) * 4, 9); }
  },

  buildPlatform(ctx) {
    const { scene } = ctx, s = this.s;
    const biscuit = tex(256, 64, (x, w, h) => { x.fillStyle = '#f2c79a'; x.fillRect(0, 0, w, h); x.fillStyle = '#e3ad78'; for (let i = 0; i < 40; i++) x.fillRect((i * 37) % w, (i * 23) % h, 3, 3); x.fillStyle = '#fff3e3'; x.fillRect(0, h * 0.42, w, h * 0.16); });
    biscuit.wrapS = THREE.RepeatWrapping; biscuit.repeat.set(10, 1);
    const side = mat(0xffffff, { map: biscuit, roughness: 0.8 });
    const top = mat(0xffbfd8, { roughness: 0.75 });
    const tiers = [[PLAT_R + 2, -4.6, 2.6], [PLAT_R, -2.0, 2.0]];
    for (const [r, y, h] of tiers) { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 96, 1), [side, top, top]); c.position.y = y + h / 2 - 0.0; c.receiveShadow = c.castShadow = true; scene.add(c); }
    // drippy pink frosting rim + candy beads
    const drip = new THREE.Mesh(new THREE.TorusGeometry(PLAT_R, 0.55, 12, 128), mat(PASTEL.pink, { roughness: 0.35 })); drip.rotation.x = Math.PI / 2; drip.position.y = Y; scene.add(drip);
    const beadG = new THREE.SphereGeometry(0.42, 12, 8), n = 160, beads = new THREE.InstancedMesh(beadG, mat(0xffffff, { roughness: 0.3 }), n * 2), m4 = new THREE.Matrix4(), col = new THREE.Color();
    const bc = [0xff9cc5, 0xb8f0d8, 0xd9c4f5, 0xffe08a, 0xffffff, 0x9fd8ff];
    for (let i = 0; i < n * 2; i++) { const ring = i < n ? 0 : 1, a = (i % n) / n * Math.PI * 2, r = ring ? PLAT_R + 2.1 : PLAT_R + 0.55, y = ring ? -2.0 : Y + 0.4;
      m4.makeTranslation(Math.sin(a) * r, y, Math.cos(a) * r); beads.setMatrixAt(i, m4); beads.setColorAt(i, col.setHex(bc[i % bc.length])); }
    scene.add(beads);
    // drips down the side
    const dg = new THREE.CapsuleGeometry(0.45, 1, 4, 10), dm = mat(PASTEL.pink, { roughness: 0.35 }), drips = new THREE.InstancedMesh(dg, dm, 70);
    for (let i = 0; i < 70; i++) { const a = i / 70 * Math.PI * 2 + 0.02, L = 0.6 + ((i * 53) % 10) / 10 * 1.4; m4.compose(new THREE.Vector3(Math.sin(a) * (PLAT_R + 0.15), Y - 0.4 - L * 0.5, Math.cos(a) * (PLAT_R + 0.15)), new THREE.Quaternion(), new THREE.Vector3(1, L, 1)); drips.setMatrixAt(i, m4); }
    scene.add(drips);
    // sprinkles on the top surface
    const spG = new THREE.CapsuleGeometry(0.06, 0.3, 2, 6), N = s.HI ? 1600 : 700, sp = new THREE.InstancedMesh(spG, mat(0xffffff, { roughness: 0.4 }), N), q = new THREE.Quaternion(), e = new THREE.Euler();
    const sc = [0xff6fa5, 0x7fe0b8, 0xb79cf0, 0xffd166, 0x6cc6ff, 0xffffff, 0xff9a6c]; let k = 0;
    while (k < N) { const r = Math.sqrt(Math.random()) * (PLAT_R - 1), a = Math.random() * Math.PI * 2, x = Math.sin(a) * r, z = Math.cos(a) * r; if (r < 8 || Math.abs(x - riverX(z)) < 2.6 && z > -6) continue;
      e.set(Math.PI / 2, 0, Math.random() * Math.PI); q.setFromEuler(e); m4.compose(new THREE.Vector3(x, Y + 0.08, z), q, new THREE.Vector3(1, 1, 1)); sp.setMatrixAt(k, m4); sp.setColorAt(k, col.setHex(sc[k % sc.length])); k++; }
    scene.add(sp);
    // twinkle sparkles
    const pts = new Float32Array(240 * 3); for (let i = 0; i < 240; i++) { const r = Math.random() * 36, a = Math.random() * 6.28; pts.set([Math.sin(a) * r, 1 + Math.random() * 18, Math.cos(a) * r], i * 3); }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    const dot = tex(32, 32, (x) => { const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, '#fff'); g.addColorStop(0.3, 'rgba(255,240,250,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); });
    s.sparkle = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.9, map: dot, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xfff6c8 })); scene.add(s.sparkle);
  },

  swirl(parent, r, h, color, turns = 4) { // piped whipped-cream swirl: stacked squashed tori
    const m = mat(color, { roughness: 0.45 }), g = new THREE.Group(); parent.add(g);
    const N = turns * 3; for (let i = 0; i < N; i++) { const k = i / N, rr = r * (1 - k * 0.92), t = new THREE.Mesh(new THREE.TorusGeometry(rr, Math.max(0.12, r * 0.28 * (1 - k * 0.6)), 10, 32), m);
      t.rotation.x = Math.PI / 2; t.position.set(Math.cos(i * 2.1) * r * 0.04, k * h, Math.sin(i * 2.1) * r * 0.04); t.castShadow = true; g.add(t); }
    const tip = new THREE.Mesh(new THREE.ConeGeometry(r * 0.16, h * 0.18, 12), m); tip.position.y = h * 1.02; g.add(tip);
    return g;
  },

  buildTower(ctx) {
    const { scene, label, MOBILE } = ctx, s = this.s, g = new THREE.Group(); scene.add(g); s.tower = g;
    const wafer = tex(256, 128, (x, w, h) => { x.fillStyle = '#ffd0e2'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffe9f1'; for (let i = 0; i < 6; i++) x.fillRect(0, i * 22 + 8, w, 6); x.fillStyle = '#f5a9c7'; for (let i = 0; i < 16; i++) x.fillRect(i * 16, 0, 2, h); });
    wafer.wrapS = THREE.RepeatWrapping; wafer.repeat.set(4, 1);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(6.4, 7, 2.2, 48), mat(0xffffff, { map: wafer })); base.position.y = Y + 1.1; base.castShadow = base.receiveShadow = true; g.add(base);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.8, 6.5, 48), mat(0xffffff, { map: wafer })); body.position.y = Y + 2.2 + 3.25; body.castShadow = true; g.add(body);
    const band = (y, r) => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.5, 12, 64), mat(0xfff5ea, { roughness: 0.4 })); t.rotation.x = Math.PI / 2; t.position.y = y; g.add(t); };
    band(Y + 2.3, 6.3); band(Y + 8.6, 5.6);
    const doorM = mat(0x8a4a6a, { roughness: 0.9 });
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + Math.PI / 6, d = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.3, 20, 1, false, 0, Math.PI), doorM);
      d.rotation.set(Math.PI / 2, 0, 0); const w = new THREE.Group(); w.rotation.y = a; g.add(w); d.position.set(0, Y + 5.6, 5.55); d.rotation.z = Math.PI; w.add(d);
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 0.3), doorM); box.position.set(0, Y + 4.9, 5.55); w.add(box); }
    const mainDoor = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.9, 0.4), doorM); mainDoor.position.set(0, Y + 1.0, 6.75); g.add(mainDoor);
    const cream = this.swirl(g, 5.8, 7.5, 0xffb8d2, 5); cream.position.y = Y + 8.6;
    const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 16), new THREE.MeshPhysicalMaterial({ color: 0xff3d6e, roughness: 0.15, clearcoat: 1 })); cherry.position.y = Y + 8.6 + 8.6; g.add(cherry);
    // little turret swirls on the tower rim
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, t = new THREE.Group(); t.position.set(Math.sin(a) * 6.2, Y + 2.3, Math.cos(a) * 6.2); g.add(t);
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.2, 20), mat(ROOF[i % 4])); c.position.y = 1.1; t.add(c); const sw = this.swirl(t, 1.0, 1.6, 0xfff3f8, 2); sw.position.y = 2.2; }
    // rainbow behind the tower
    const RB = [0xffb3b3, 0xffd6a5, 0xfff3a8, 0xc8f2c2, 0xb5dcff, 0xd9c4f5];
    RB.forEach((c, i) => { const r = new THREE.Mesh(new THREE.TorusGeometry(20 - i * 1.1, 0.58, 10, 96, Math.PI), new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, emissive: c, emissiveIntensity: 0.35 })); r.position.set(0, Y + 2, -12); g.add(r); });
    const bl = label('<b>LÂU ĐÀI KẸO · BỘ NÃO</b><span>Captain điều phối · bộ nhớ chung</span>', 'brain-label'); bl.position.set(0, Y + 0.6, MOBILE ? 8 : 9.5); g.add(bl);
  },

  buildRiver(ctx) {
    const { scene } = ctx, s = this.s, pts = [];
    for (let i = 0; i <= 30; i++) { const z = -5 + i / 30 * (PLAT_R + 5); pts.push(new THREE.Vector3(riverX(z), Y + 0.12, z)); }
    const curve = new THREE.CatmullRomCurve3(pts); s.river = curve;
    const N = 160, W = 2.3, pos = [], uv = [], idx = [];
    for (let i = 0; i <= N; i++) { const t = i / N, p = curve.getPointAt(t), tg = curve.getTangentAt(t), sd = new THREE.Vector3(tg.z, 0, -tg.x).normalize(), w = W * (1 + 0.15 * Math.sin(t * 17));
      for (const k of [-1, 1]) { const q = p.clone().addScaledVector(sd, k * w); pos.push(q.x, q.y, q.z); uv.push(k < 0 ? 0 : 1, t * 12); }
      if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
    s.rs = []; for (let i = 0; i <= 400; i++) { const t = i / 400, p = curve.getPointAt(t); s.rs.push([p.x, p.z, W * (1 + 0.15 * Math.sin(t * 17)) * 1.04 + 0.32]); }
    s.riverD = (x, z) => { let m = 1e9; for (const [a, b, w] of s.rs) m = Math.min(m, Math.hypot(x - a, z - b) - w); return m; }; // <0 = on the river (incl. banks)
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const W2 = 128, H2 = 256, cc = document.createElement('canvas'), nc = document.createElement('canvas'); cc.width = nc.width = W2; cc.height = nc.height = H2;
    const hgt = (x, y) => { const u = x / W2 * Math.PI * 2, v = y / H2 * Math.PI * 2; return Math.sin(u * 3 + Math.sin(v * 2) * 1.6) * 0.5 + Math.sin(u * 7 - v * 3 + Math.sin(v) * 2) * 0.3 + Math.sin(v * 5 + u * 2) * 0.2; };
    const ci = cc.getContext('2d').createImageData(W2, H2), ni = nc.getContext('2d').createImageData(W2, H2);
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) { const h = hgt(x, y), o = (y * W2 + x) * 4, l = 0.5 + h * 0.5;
      ci.data[o] = 70 + l * 70; ci.data[o + 1] = 34 + l * 36; ci.data[o + 2] = 18 + l * 20; ci.data[o + 3] = 255;
      const dx = hgt(x + 1, y) - hgt(x - 1, y), dy = hgt(x, y + 1) - hgt(x, y - 1), n = new THREE.Vector3(-dx * 1.4, -dy * 1.4, 1).normalize();
      ni.data[o] = (n.x * 0.5 + 0.5) * 255; ni.data[o + 1] = (n.y * 0.5 + 0.5) * 255; ni.data[o + 2] = (n.z * 0.5 + 0.5) * 255; ni.data[o + 3] = 255; }
    cc.getContext('2d').putImageData(ci, 0, 0); nc.getContext('2d').putImageData(ni, 0, 0);
    s.choc = new THREE.CanvasTexture(cc); s.choc.colorSpace = THREE.SRGBColorSpace; s.chocN = new THREE.CanvasTexture(nc);
    for (const q of [s.choc, s.chocN]) { q.wrapS = q.wrapT = THREE.RepeatWrapping; q.anisotropy = 4; }
    s.chocN2 = s.chocN.clone(); s.chocN2.repeat.set(0.7, 0.55); s.chocN2.needsUpdate = true;
    s.choc.wrapS = s.choc.wrapT = THREE.RepeatWrapping;
    const river = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ map: s.choc, normalMap: s.chocN, normalScale: new THREE.Vector2(0.5, 0.5), clearcoatNormalMap: s.chocN2, clearcoatNormalScale: new THREE.Vector2(0.35, 0.35), color: 0xffffff, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.3, sheenColor: new THREE.Color(0xc98a5a) })); river.receiveShadow = true; scene.add(river);
    // frosting banks
    for (const k of [-1, 1]) { const bp = []; for (let i = 0; i <= 60; i++) { const t = i / 60, p = curve.getPointAt(t), tg = curve.getTangentAt(t), sd = new THREE.Vector3(tg.z, 0, -tg.x).normalize(); bp.push(p.clone().addScaledVector(sd, k * W * (1 + 0.15 * Math.sin(t * 17)) * 1.04).setY(Y + 0.2)); }
      const b = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bp), 160, 0.32, 8), mat(0xfff3f8, { roughness: 0.4 })); b.castShadow = true; scene.add(b); }
    // chocolate waterfall over the front edge
    const end = curve.getPointAt(1), fall = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 7, 1, 8), new THREE.MeshPhysicalMaterial({ map: s.fallMap = s.choc.clone(), normalMap: s.chocN, roughness: 0.2, clearcoat: 1, side: THREE.DoubleSide }));
    fall.position.set(end.x, Y - 3.4, PLAT_R + 2.3); scene.add(fall); s.fall = fall;
    // gummy bears
    s.bears = [];
    const BC = [0xff4f86, 0xffa63d, 0x5fd97a, 0xffd23f, 0xff7fd0, 0xb48cff, 0x5cc8ff];
    const SG = new THREE.SphereGeometry(1, 28, 20), dark = mat(0x2a1420, { roughness: 0.15 }), shine = new THREE.MeshBasicMaterial({ color: 0xffffff }), blush = new THREE.MeshBasicMaterial({ color: 0xff9ab8, transparent: true, opacity: 0.7 });
    const bear = (color) => { const c = new THREE.Color(color), light = c.clone().lerp(new THREE.Color(0xffffff), 0.45);
      const m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, transmission: !s.HI ? 0 : 0.55, thickness: 1.2, ior: 1.35, attenuationColor: c, attenuationDistance: 1.5, transparent: true, opacity: 0.93, emissive: c, emissiveIntensity: 0.32, sheen: 0.5, sheenColor: light });
      const mb = m.clone(); mb.color = light; mb.emissive = light; mb.emissiveIntensity = 0.25; mb.attenuationColor = light;
      const g = new THREE.Group(), S = (mm, x, y, z, sx, sy = sx, sz = sx, cast = true) => { const o = new THREE.Mesh(SG, mm); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = cast; g.add(o); return o; };
      S(m, 0, 0.72, 0, 0.5, 0.58, 0.44);            // body
      S(mb, 0, 0.66, 0.3, 0.3, 0.36, 0.16, false);  // belly
      S(m, 0, 1.5, 0, 0.46, 0.42, 0.42);            // head
      for (const k of [-1, 1]) {
        S(m, k * 0.32, 1.86, -0.02, 0.17, 0.17, 0.12); S(mb, k * 0.32, 1.86, 0.06, 0.09, 0.09, 0.05, false); // ears
        S(m, k * 0.46, 0.92, 0.08, 0.17, 0.27, 0.17).rotation.z = k * 0.55;                                  // arms
        S(m, k * 0.25, 0.22, 0.08, 0.2, 0.2, 0.24);                                                           // legs
        S(mb, k * 0.25, 0.2, 0.3, 0.1, 0.1, 0.03, false);                                                     // paw pads
        S(dark, k * 0.15, 1.58, 0.38, 0.055, 0.065, 0.04, false);                                              // eyes
        S(shine, k * 0.15 + 0.02, 1.61, 0.415, 0.018, 0.018, 0.01, false);                                     // eye glint
        S(blush, k * 0.28, 1.44, 0.33, 0.08, 0.05, 0.02, false);                                               // cheeks
      }
      S(mb, 0, 1.4, 0.36, 0.17, 0.12, 0.12);        // snout
      S(dark, 0, 1.45, 0.47, 0.05, 0.035, 0.03, false); // nose
      S(shine, -0.18, 1.72, 0.3, 0.07, 0.035, 0.03, false).rotation.z = 0.6;  // head highlight
      S(shine, -0.2, 0.95, 0.36, 0.05, 0.08, 0.02, false);                     // body highlight
      g.scale.setScalar(1.3); scene.add(g); return g; };
    for (let i = 0; i < 12; i++) s.bears.push({ b: bear(BC[i % BC.length]), y0: Y, hop: i % 3 === 1, ph: i * 0.37, ry: 0 });
  },

  buildDecor(ctx) {
    const { scene } = ctx, s = this.s;
    const waffle = tex(128, 128, (x, w, h) => { x.fillStyle = '#e8b27a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#c98a4f'; x.lineWidth = 4; for (let i = -8; i < 16; i++) { x.beginPath(); x.moveTo(i * 16, 0); x.lineTo(i * 16 + h, h); x.stroke(); x.beginPath(); x.moveTo(i * 16, h); x.lineTo(i * 16 + h, 0); x.stroke(); } });
    waffle.wrapS = waffle.wrapT = THREE.RepeatWrapping; waffle.repeat.set(3, 2);
    const coneM = mat(0xffffff, { map: waffle, roughness: 0.8 }); s.obst = [[0, 0, 7.4]];
    // ice cream cone towers around the edge (skip the front so the river/camera stays clear)
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + Math.PI / 12; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.5) continue;
      const g = new THREE.Group(); g.position.set(Math.sin(a) * (PLAT_R - 1.2), Y, Math.cos(a) * (PLAT_R - 1.2)); scene.add(g); s.obst.push([g.position.x, g.position.z, 2.2]);
      const h = 5 + (i % 3) * 1.6, cone = new THREE.Mesh(new THREE.ConeGeometry(1.9, h, 24, 1, true), coneM); cone.rotation.x = Math.PI; cone.position.y = h / 2; cone.castShadow = true; g.add(cone);
      const scoop = new THREE.Mesh(new THREE.SphereGeometry(2.1, 24, 16), mat(ROOF[i % 4], { roughness: 0.5 })); scoop.position.y = h + 0.4; scoop.scale.y = 0.8; scoop.castShadow = true; g.add(scoop);
      const sw = this.swirl(g, 1.5, 2.4, ROOF[(i + 1) % 4], 2); sw.position.y = h + 1.4; }
    // lollipops
    const spiral = (c1, c2) => tex(128, 128, (x, w) => { x.fillStyle = c1; x.fillRect(0, 0, w, w); x.strokeStyle = c2; x.lineWidth = 9; x.beginPath(); for (let k = 0; k < 400; k++) { const a = k * 0.09, r = k * 0.15; x.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } x.stroke(); });
    const LP = [[-14, -19, '#ffffff', '#ff6fa5'], [13, -20, '#ffffff', '#b79cf0'], [-25, 2, '#ffffff', '#7fe0b8'], [24, 4, '#ffffff', '#ff9a6c'], [-9, 18, '#fff3a8', '#ff6fa5'], [18, 17, '#ffffff', '#ff6fa5'], [0, -15, '#ffffff', '#6cc6ff']];
    s.lollies = [];
    for (const [x, z, c1, c2] of LP) { const g = new THREE.Group(); g.position.set(x, Y, z); scene.add(g); s.obst.push([x, z, 0.4]);
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 7, 10), mat(0xffffff)); st.position.y = 3.5; g.add(st);
      const d = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.5, 40), [mat(0xffffff, { roughness: 0.3 }), new THREE.MeshPhysicalMaterial({ map: spiral(c1, c2), roughness: 0.15, clearcoat: 1 }), new THREE.MeshPhysicalMaterial({ map: spiral(c1, c2), roughness: 0.15, clearcoat: 1 })]);
      d.rotation.x = Math.PI / 2; d.position.y = 7.6; d.castShadow = true; g.add(d); s.lollies.push(d); }
  },

  buildRooms(ctx, ROOMS) {
    const { scene, put, label, screenTexture, makeBot, rooms, MOBILE } = ctx, s = this.s;
    // pick spots: inner ring then outer ring, avoiding the river and the tower
    const spots = [];
    const tryRing = (r, n, off) => { for (let i = 0; i < n; i++) { const a = off + i / n * Math.PI * 2, x = Math.sin(a) * r, z = Math.cos(a) * r; if (z > -7 && Math.abs(x - riverX(z)) < 5.2) continue; if (Math.abs(x) < 9 && z < -9 && z > -16 && r < 15) continue; spots.push([x, z]); } };
    tryRing(13.5, 9, 0.35); tryRing(22.5, 14, 0.1);
    spots.sort((p, q) => Math.atan2(p[0], p[1]) - Math.atan2(q[0], q[1]));
    const total = ROOMS.reduce((n, R) => n + R.bots.length, 0), use = spots.slice(0, total);
    if (use.length < total) console.warn('not enough room spots', use.length, total);
    const linerTex = c => tex(256, 64, (x, w, h) => { x.fillStyle = c; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 32; i++) x.fillRect(i * 8, 0, 3, h); x.fillStyle = 'rgba(255,255,255,.9)'; x.fillRect(0, 0, w, 6); });
    s.paths = [];
    const pathTex = tex(64, 64, (x, w, h) => { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.fillStyle = '#ff8fb8'; for (let i = -2; i < 4; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32 + 16, 0); x.lineTo(i * 32 + 16 + h, h); x.lineTo(i * 32 + h, h); x.fill(); } });
    pathTex.wrapS = pathTex.wrapT = THREE.RepeatWrapping;
    let k = 0;
    ROOMS.forEach((R, ri) => {
      const room = { def: R, bots: [], map: [0, 0] }, mid = Math.round((R.bots.length - 1) / 2);
      R.bots.forEach((name, i) => {
        const [x, z] = use[k % use.length], c = ROOF[k % 4]; k++;
        const g = new THREE.Group(); g.position.set(x, Y, z); g.rotation.y = Math.PI + Math.atan2(x * 0.25, 60 - z) ; scene.add(g); // openings face the default camera (+z)
        // cupcake liner wall with an open front arch (local -z)
        const lt = linerTex('#' + new THREE.Color(c).lerp(new THREE.Color(0xffffff), 0.15).getHexString()); lt.wrapS = THREE.RepeatWrapping; lt.repeat.set(3, 1);
        const OPEN = 1.0, wall = new THREE.Mesh(new THREE.CylinderGeometry(ROOM_R + 0.15, ROOM_R - 0.15, 2.4, 40, 1, true, Math.PI + OPEN, Math.PI * 2 - OPEN * 2), mat(0xffffff, { map: lt, side: THREE.DoubleSide }));
        wall.position.y = 1.2; wall.castShadow = wall.receiveShadow = true; g.add(wall);
        const floor = new THREE.Mesh(new THREE.CircleGeometry(ROOM_R, 40), mat(0xffe6d6, { roughness: 0.8 })); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.04; floor.receiveShadow = true; g.add(floor);
        // frosting dome roof (open at the front) + piped rim + swirl + sprinkles cherry
        const dome = new THREE.Mesh(new THREE.SphereGeometry(ROOM_R + 0.35, 40, 16, Math.PI * 1.5 + OPEN, Math.PI * 2 - OPEN * 2, 0, Math.PI / 2), mat(c, { roughness: 0.45, side: THREE.DoubleSide }));
        dome.scale.y = 0.85; dome.position.y = 2.4; dome.castShadow = true; g.add(dome);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(ROOM_R + 0.3, 0.32, 10, 48, Math.PI * 2 - OPEN * 2), mat(0xfff5fa, { roughness: 0.4 })); rim.rotation.set(Math.PI / 2, 0, -Math.PI / 2 - (Math.PI - OPEN) + Math.PI); rim.position.y = 2.42; g.add(rim);
        const sw = this.swirl(g, 1.1, 1.8, 0xfff3f8, 2); sw.position.set(0, 2.4 + (ROOM_R + 0.35) * 0.85 - 0.2, 0);
        const ch = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), new THREE.MeshPhysicalMaterial({ color: 0xff3d6e, roughness: 0.15, clearcoat: 1 })); ch.position.y = sw.position.y + 2.05; g.add(ch);
        // arch trim around the opening
        const arch = new THREE.Mesh(new THREE.TorusGeometry(ROOM_R * Math.sin(OPEN) + 0.05, 0.22, 8, 32, Math.PI), mat(0xfff5fa)); arch.position.set(0, 2.4, -ROOM_R * Math.cos(OPEN) - 0.05); g.add(arch);
        for (const sx of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.4, 10), mat(0xfff5fa)); post.position.set(sx * (ROOM_R * Math.sin(OPEN) + 0.05), 1.2, -ROOM_R * Math.cos(OPEN) - 0.05); g.add(post); }
        // furniture: desk near the front so the bot faces the camera
        const dz = -0.9;
        put('desk', g, 0, 0.05, dz, Math.PI);
        const screens = [];
        for (const sx of [-0.42, 0.42]) { const scn = put('computerScreen', g, sx, 0.05 + 1.03, dz - 0.15, sx > 0 ? -0.2 : 0.2);
          const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.6), new THREE.MeshBasicMaterial({ map: screenTexture(R.color, i * 2 + (sx > 0)), color: 0xffffff })); gl.position.set(0, 0.42, 0.08); scn.add(gl); screens.push(gl); }
        put('computerKeyboard', g, 0, 0.05 + 1.03, dz + 0.22, Math.PI);
        put('chairDesk', g, 0, 0.05, dz + 1.0, 0);
        put('loungeSofaLong', g, -1.7, 0.05, 1.0, Math.PI / 2, 1.7);
        put('plantSmall1', g, 1.8, 0.05, 0.9);
        // bot at desk faces local -z (= towards the opening/camera)
        const seat = { floorY: 0.05,
          desk: { p: new THREE.Vector3(0, 0.05 + 0.38, dz + 0.95), ry: Math.PI, approach: new THREE.Vector3(0, 0.05, dz + 1.8) },
          sofa: { p: new THREE.Vector3(-1.7 + 0.12, 0.05 + 0.3, 1.0), ry: Math.PI / 2, approach: new THREE.Vector3(-0.5, 0.05, 1.0) } };
        makeBot(name, room, g, seat, screens);
        // candy-cane path from the room towards the tower
        const L = Math.hypot(x, z) - 8.5, ang = Math.atan2(x, z);
        if (L > 2) { const pth = new THREE.Mesh(new THREE.PlaneGeometry(1.5, L - ROOM_R + 0.4), mat(0xffffff, { map: pathTex.clone(), roughness: 0.6 })); pth.material.map.repeat.set(1, (L - ROOM_R) / 1.5); pth.material.map.needsUpdate = true;
          pth.rotation.set(-Math.PI / 2, 0, ang); const mr = 8.5 + (L - ROOM_R) / 2; pth.position.set(Math.sin(ang) * mr, Y + 0.06, Math.cos(ang) * mr); pth.receiveShadow = true; scene.add(pth);
          const r0 = 8.5, r1 = 8.5 + L - ROOM_R + 0.4, seg = { ang, r0, r1, x, z }; s.paths.push(seg);
          // where the candy path crosses the chocolate river, lay a candy-cane bridge over it
          let c0 = -1, c1 = -1; for (let r = r0; r <= r1; r += 0.1) if (s.riverD(Math.sin(ang) * r, Math.cos(ang) * r) < 0.9) { if (c0 < 0) c0 = r; c1 = r; }
          if (c0 >= 0) { seg.bridge = true; seg.ba = c0 - 0.6; seg.bb = c1 + 0.6; this.bridge(ctx, ang, c0 - 0.6, c1 + 0.6); } }
        if (i === mid) { room.map = [x, z]; const lab = label('', 'room-label'); lab.position.set(0, MOBILE ? 6 : 6.4, 0); g.add(lab); room.label = lab; lab.element.style.setProperty('--c', '#' + new THREE.Color(R.color).getHexString()); }
      });
      rooms.push(room);
    });
    s.roomC = use.map(([x, z]) => [x, z]);
    const segD = (px, pz, P, off = 0) => { const ax = Math.sin(P.ang) * P.r0, az = Math.cos(P.ang) * P.r0, bx = Math.sin(P.ang) * P.r1, bz = Math.cos(P.ang) * P.r1, dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz))); return Math.hypot(px - ax - dx * t, pz - az - dz * t); };
    s.segD = segD;
    // walkers only on river-free paths that do not pass through another room; spread around the platform
    const ok = s.paths.filter(P => !P.bridge && s.roomC.every(([x, z]) => (x === P.x && z === P.z) || segD(x, z, P) > ROOM_R + 0.9));
    ok.sort((a, b) => a.ang - b.ang); const step = Math.max(1, Math.floor(ok.length / 4));
    for (let i = 0; i < ok.length && this.walkPaths.length < 4; i += step) { const P = ok[i], a = P.ang, e = P.r1 - 0.7;
      this.walkPaths.push([new THREE.Vector3(Math.sin(a) * 9, Y + 0.06, Math.cos(a) * 9), new THREE.Vector3(Math.sin(a) * e, Y + 0.06, Math.cos(a) * e)]); }
    if (/[?&]reel=1/.test(location.search)) { const br = s.paths.filter(P => P.bridge && s.roomC.every(([x, z]) => (x === P.x && z === P.z) || segD(x, z, P) > ROOM_R + 0.9));
      br.forEach(P => { const a = P.ang, e = P.r1 - 0.7; this.walkPaths.push([new THREE.Vector3(Math.sin(a) * 9, Y + 0.06, Math.cos(a) * 9), new THREE.Vector3(Math.sin(a) * e, Y + 0.06, Math.cos(a) * e)]); }); }
    s.bridges = s.paths.filter(P => P.bridge);
    // gummy bears: open ground only (outside every room + margin, off the river, paths, tower, cones, lollipops)
    const BR = 0.95, free = (x, z, others) => { const r = Math.hypot(x, z); if (r > PLAT_R - 2.2) return false;
      if (s.roomC.some(([a, b]) => Math.hypot(x - a, z - b) < ROOM_R + 0.4 + BR + 0.6)) return false;
      if (s.riverD(x, z) < BR + 0.5) return false; if (s.paths.some(P => segD(x, z, P) < 0.75 + BR + 0.4)) return false;
      if (this.walkPaths.some(([A, B]) => segD(x, z, { ang: Math.atan2(A.x, A.z), r0: 9, r1: Math.hypot(B.x, B.z) }) < 0.35 + BR + 0.6)) return false;
      if (s.obst.some(([a, b, rr]) => Math.hypot(x - a, z - b) < rr + BR + 0.3)) return false;
      return others.every(o => Math.hypot(x - o[0], z - o[1]) > 3); };
    const cand = []; for (let x = -PLAT_R; x <= PLAT_R; x += 0.5) for (let z = -PLAT_R; z <= PLAT_R; z += 0.5) if (free(x, z, [])) cand.push([x, z]);
    const chosen = [];
    const pick = (pool, n) => { for (let j = 0; j < n; j++) { let best = null, bd = -Infinity; for (const c of pool) { if (!free(c[0], c[1], chosen)) continue; const d = chosen.length ? Math.min(...chosen.map(o => Math.hypot(c[0] - o[0], c[1] - o[1]))) : -Math.hypot(c[0] - 2, c[1] - 20); if (d > bd) { bd = d; best = c; } } if (best) chosen.push(best); } };
    pick(cand.filter(([x, z]) => s.riverD(x, z) < 3.2 && z > 0), 5); pick(cand, s.bears.length - chosen.length);
    s.bears.forEach((B, i) => { const c = chosen[i]; if (!c) { B.b.visible = false; return; } B.b.position.set(c[0], Y, c[1]); B.ry = B.b.rotation.y = Math.atan2(4 - c[0], 40 - c[1]) + (i % 3 - 1) * 0.4; });
    // automated clip check (exposed for tests)
    const bad = [];
    this.walkPaths.forEach(([A, B], i) => { for (let k = 0; k <= 200; k++) { const t = k / 200; for (const sd of [-0.35, 0.35]) { const dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz), x = A.x + dx * t + dz / L * sd, z = A.z + dz * t - dx / L * sd;
      if (s.riverD(x, z) < 0.35 && !this.walkY(x, z)) bad.push(['walker-river', i, x.toFixed(1), z.toFixed(1)]); if (s.obst.some(([a, b, rr]) => Math.hypot(x - a, z - b) < rr + 0.3) && Math.hypot(x, z) > 8.9) bad.push(['walker-obst', i]); } } });
    s.bears.forEach((B, i) => { if (!B.b.visible) return; const { x, z } = B.b.position;
      s.roomC.forEach(([a, b]) => { if (Math.hypot(x - a, z - b) < ROOM_R + 0.4 + BR) bad.push(['bear-room', i]); });
      if (s.riverD(x, z) < BR) bad.push(['bear-river', i]); if (s.obst.some(([a, b, rr]) => Math.hypot(x - a, z - b) < rr + BR)) bad.push(['bear-obst', i]);
      if (s.paths.some(P => segD(x, z, P) < 0.75 + BR)) bad.push(['bear-path', i]); });
    window.__candyCheck = { bad, walkers: this.walkPaths.length, bears: s.bears.filter(B => B.b.visible).length, bridges: s.paths.filter(P => P.bridge).length, cand: cand.length };
  },

  walkY(x, z) { const s = this.s; if (!s.bridges) return 0; for (const P of s.bridges) { const along = x * Math.sin(P.ang) + z * Math.cos(P.ang), lat = Math.abs(x * Math.cos(P.ang) - z * Math.sin(P.ang));
      if (lat < 1.1 && along > P.ba && along < P.bb) { const u = (along - P.ba) / (P.bb - P.ba); return 0.34 + 4 * 0.9 * u * (1 - u); } } return 0; },

  bridge(ctx, ang, a, b) { // arched candy-cane bridge along the path direction from radius a to b
    const g = new THREE.Group(), L = b - a, H = 0.9, deck = mat(0xfff5fa, { roughness: 0.4 }), red = mat(0xff5f8f, { roughness: 0.35 }), N = 14;
    g.position.set(Math.sin(ang) * (a + b) / 2, Y, Math.cos(ang) * (a + b) / 2); g.rotation.y = ang; ctx.scene.add(g);
    for (let i = 0; i < N; i++) { const u0 = i / N, u1 = (i + 1) / N, y0 = 0.25 + 4 * H * u0 * (1 - u0), y1 = 0.25 + 4 * H * u1 * (1 - u1), z0 = -L / 2 + u0 * L, z1 = -L / 2 + u1 * L;
      const sl = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.18, Math.hypot(z1 - z0, y1 - y0) + 0.04), i % 2 ? deck : red); sl.position.set(0, (y0 + y1) / 2, (z0 + z1) / 2); sl.rotation.x = -Math.atan2(y1 - y0, z1 - z0); sl.castShadow = sl.receiveShadow = true; g.add(sl);
      for (const sx of [-1, 1]) if (i % 2 === 0) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 8), i % 4 ? red : deck); post.position.set(sx * 0.9, y0 + 0.35, z0); g.add(post); } }
    for (const sx of [-1, 1]) { const pts = []; for (let i = 0; i <= 20; i++) { const u = i / 20; pts.push(new THREE.Vector3(sx * 0.9, 0.95 + 4 * H * u * (1 - u), -L / 2 + u * L)); }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.1, 8), red)); }
  },

  update(dt, t) {
    const s = this.s;
    const f = (t * 0.22) % 1; s.choc.offset.y = -f; s.chocN.offset.y = -f; s.chocN2.offset.set(Math.sin(t * 0.3) * 0.05, -((t * 0.13) % 1)); s.fallMap.offset.y = (t * 0.5) % 1;
    s.clouds.forEach(c => { c.c.position.y = c.y0 + Math.sin(t * 0.25 + c.ph) * 0.8; c.c.rotation.y = Math.sin(t * 0.05 + c.ph) * 0.2; });
    s.sparkle.material.opacity = 0.55 + Math.sin(t * 2.3) * 0.35; s.sparkle.rotation.y = t * 0.02;
    s.bears.forEach(B => { if (B.hop) { const P = 1.8, p = ((t + B.ph * P) % P) / P; let h = 0, sq = 0;
        if (p < 0.5) { const u = p / 0.5; h = 4 * u * (1 - u); } else if (p < 0.7) { const u = (p - 0.5) / 0.2; sq = Math.sin(u * Math.PI) * (1 - u * 0.4); }
        else if (p > 0.85) { const u = (p - 0.85) / 0.15; sq = Math.sin(u * Math.PI) * 0.5; }
        B.b.position.y = B.y0 + h * 0.9; B.b.scale.set(1.3 * (1 + sq * 0.09), 1.3 * (1 - sq * 0.1 + h * 0.05), 1.3 * (1 + sq * 0.09)); B.b.rotation.y = B.ry + Math.sin(t * 0.5 + B.ph) * 0.15; }
      else { B.b.rotation.z = Math.sin(t * 1.2 + B.ph * 3) * 0.05; B.b.scale.y = 1.3 * (1 + Math.sin(t * 2 + B.ph) * 0.015); } });
    s.lollies.forEach((l, i) => l.rotation.y = Math.sin(t * 0.8 + i) * 0.15);
    s.tower.children.forEach(() => {});
  },
};
export default theme;
