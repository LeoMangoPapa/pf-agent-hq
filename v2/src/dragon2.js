// Five procedural serpentine dragons (A..E). Select with ?dragon=A..E
import * as THREE from 'three';

export const STYLES = {
  A: { name: 'Lý triều vàng', rb: 0.55, len: 26, body: '#d4a532', hl: '#ffe08a', edge: '#7a5210', belly: '#f6e3a4', rows: 16, metal: 0.75, rough: 0.32, fin: ['#e0901c', '#ffd46a'], finShape: 'flame', finScale: 1.5, mane: '#e2541c', horn: '#f3d98c', head: 'ly', pearl: 0xfff2c0, normal: 2.2, crest: true },
  B: { name: 'Ngọc bích', rb: 0.75, len: 24, body: '#1d8f68', hl: '#6fe0b4', edge: '#0c4a35', belly: '#f1dc9a', rows: 10, metal: 0.15, rough: 0.25, clearcoat: 1, fin: ['#c99a2e', '#ffe39a'], finShape: 'cloud', finScale: 1.6, mane: '#e6b84a', horn: '#ffe7a8', head: 'ly', pearl: 0xe8fff4, normal: 0.9 },
  C: { name: 'Lân hội đỏ vàng', rb: 0.8, len: 22, body: '#c4161c', hl: '#ff5a3c', edge: '#ffcf4a', belly: '#ffd85a', rows: 12, metal: 0.35, rough: 0.4, fin: ['#ffb21e', '#fff1a0'], finShape: 'flame', finScale: 1.7, mane: '#fff6e0', horn: '#ffcf4a', head: 'lion', pearl: 0xffe070, normal: 1.4 },
  D: { name: 'Thủy long bạc', rb: 0.62, len: 27, body: '#dfe9f2', hl: '#ffffff', edge: '#7fa3c8', belly: '#eaf6ff', rows: 14, metal: 0.4, rough: 0.18, clearcoat: 1, iridescence: 1, fin: ['#6fd6ff', '#e8fbff'], finShape: 'wave', finScale: 2.0, finOpacity: 0.55, mane: '#bfefff', horn: '#e8f4ff', head: 'ly', pearl: 0xbff4ff, normal: 1.2, trail: true, smooth: true },
  E: { name: 'Đồng cổ', rb: 0.72, len: 24, body: '#7a5a34', hl: '#b08850', edge: '#2e2216', belly: '#8f7448', rows: 12, metal: 0.92, rough: 0.42, fin: ['#5e4a2c', '#9a7a48'], finShape: 'spike', finScale: 1.4, mane: '#6a5434', horn: '#a2875a', head: 'ly', pearl: 0xffa040, normal: 2.0, patina: true, glow: '#ff9a2a' },
};

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
function cnv(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); return c; }
function tex(c, srgb = true) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; }

// overlapping scales + belly plates; mode 'color' | 'height' | 'glow'
function drawSkin(x, w, h, st, mode) {
  const rows = st.rows, sh = h / rows, sw = sh * 1.15;
  x.fillStyle = mode === 'color' ? st.edge : mode === 'height' ? '#202020' : '#000'; x.fillRect(0, 0, w, h);
  for (let c = Math.ceil(w / sw) + 1; c >= -1; c--) for (let r = -1; r <= rows; r++) {
    const cx = c * sw, cy = r * sh + (c % 2 ? sh / 2 : 0), rad = sh * 0.72;
    x.beginPath(); x.ellipse(cx, cy, rad * 1.05, rad, 0, 0, Math.PI * 2);
    let g;
    if (mode === 'color') { g = x.createRadialGradient(cx - rad * 0.45, cy, 1, cx - rad * 0.2, cy, rad * 1.05); g.addColorStop(0, st.hl); g.addColorStop(0.6, st.body); g.addColorStop(0.92, st.body); g.addColorStop(1, st.edge); }
    else if (mode === 'height') { g = x.createRadialGradient(cx - rad * 0.4, cy, 1, cx - rad * 0.2, cy, rad * 1.05); g.addColorStop(0, '#ffffff'); g.addColorStop(0.85, '#9a9a9a'); g.addColorStop(1, '#202020'); }
    else g = '#000';
    x.fillStyle = g; x.fill();
    if (mode === 'glow') { x.strokeStyle = st.glow; x.lineWidth = 2; x.stroke(); }
    if (mode === 'color') { x.strokeStyle = st.edge; x.globalAlpha = 0.6; x.lineWidth = 1.5; x.stroke(); x.globalAlpha = 1; }
  }
  if (st.patina && mode === 'color') for (let k = 0; k < 260; k++) { x.fillStyle = `rgba(${60 + Math.random() * 30},${130 + Math.random() * 50},${110 + Math.random() * 30},${0.08 + Math.random() * 0.2})`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 3 + Math.random() * 18, 0, 7); x.fill(); }
  // belly band (v 0.62..0.88)
  const y0 = h * 0.62, y1 = h * 0.88, pw = sw * 0.9;
  for (let c = 0; c < w / pw + 1; c++) {
    const px = c * pw;
    let g = mode === 'color' ? x.createLinearGradient(px, 0, px + pw, 0) : null;
    if (g) { g.addColorStop(0, st.belly); g.addColorStop(0.8, st.belly); g.addColorStop(1, st.edge); }
    x.fillStyle = mode === 'color' ? g : mode === 'height' ? '#c8c8c8' : '#000';
    x.beginPath(); x.roundRect(px, y0, pw - 2, y1 - y0, 8); x.fill();
    if (mode === 'height') { x.fillStyle = '#303030'; x.fillRect(px + pw - 3, y0, 3, y1 - y0); }
  }
}
function heightToNormal(src, k) {
  const w = src.width, h = src.height, d = src.getContext('2d').getImageData(0, 0, w, h).data;
  return cnv(w, h, (x) => {
    const im = x.createImageData(w, h), H = (i, j) => d[(((j + h) % h) * w + ((i + w) % w)) * 4] / 255;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const dx = (H(i + 1, j) - H(i - 1, j)) * k, dy = (H(i, j + 1) - H(i, j - 1)) * k, o = (j * w + i) * 4, n = Math.hypot(dx, dy, 1); im.data[o] = (-dx / n * 0.5 + 0.5) * 255; im.data[o + 1] = (dy / n * 0.5 + 0.5) * 255; im.data[o + 2] = (1 / n * 0.5 + 0.5) * 255; im.data[o + 3] = 255; }
    x.putImageData(im, 0, 0);
  });
}
function taperTube(pts, r0, r1, seg = 24, rad = 8) {
  const curve = new THREE.CatmullRomCurve3(pts), g = new THREE.TubeGeometry(curve, seg, 1, rad, false), p = g.attributes.position, v = V();
  for (let i = 0; i <= seg; i++) { const c = curve.getPointAt(i / seg), r = THREE.MathUtils.lerp(r0, r1, Math.pow(i / seg, 0.8)); for (let j = 0; j <= rad; j++) { const k = i * (rad + 1) + j; v.fromBufferAttribute(p, k).sub(c).multiplyScalar(r).add(c); p.setXYZ(k, v.x, v.y, v.z); } }
  g.computeVertexNormals(); return g;
}
// fin outline in XY: X = backwards along body, Y = up
function finShape(kind) {
  const s = new THREE.Shape();
  if (kind === 'flame') { s.moveTo(-0.15, 0); s.bezierCurveTo(-0.1, 0.5, 0.25, 0.9, 0.65, 1.05); s.bezierCurveTo(0.4, 0.75, 0.45, 0.6, 0.62, 0.5); s.bezierCurveTo(0.8, 0.62, 0.95, 0.62, 1.15, 0.6); s.bezierCurveTo(0.85, 0.4, 0.9, 0.2, 1.1, 0); }
  else if (kind === 'cloud') { s.moveTo(-0.1, 0); s.bezierCurveTo(-0.3, 0.45, 0.05, 0.8, 0.32, 0.6); s.bezierCurveTo(0.35, 0.95, 0.8, 0.98, 0.78, 0.62); s.bezierCurveTo(1.05, 0.7, 1.2, 0.35, 1.0, 0.22); s.bezierCurveTo(1.15, 0.12, 1.1, 0.0, 1.0, 0); }
  else if (kind === 'wave') { s.moveTo(-0.2, 0); s.bezierCurveTo(-0.05, 0.5, 0.5, 1.15, 1.5, 1.05); s.bezierCurveTo(1.05, 0.85, 0.95, 0.55, 1.15, 0.45); s.bezierCurveTo(1.35, 0.5, 1.6, 0.35, 1.8, 0.2); s.bezierCurveTo(1.5, 0.15, 1.4, 0.05, 1.3, 0); }
  else { s.moveTo(0, 0); s.lineTo(0.25, 0.95); s.lineTo(0.42, 0.55); s.lineTo(0.62, 0.8); s.lineTo(0.72, 0.42); s.lineTo(1.0, 0.5); s.lineTo(0.95, 0); }
  s.lineTo(-0.15, 0);
  const g = new THREE.ShapeGeometry(s, 16); g.rotateY(Math.PI / 2); return g;
}
function finMaterial(st) {
  const t = tex(cnv(64, 256, (x, w, h) => { const g = x.createLinearGradient(0, h, 0, 0); g.addColorStop(0, st.fin[0]); g.addColorStop(1, st.fin[1]); x.fillStyle = g; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(0,0,0,0.18)'; x.lineWidth = 3; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(k * 16 + 4, h); x.lineTo(k * 16 + 10, 0); x.stroke(); } }));
  t.repeat.set(3, 1);
  const m = new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.5, metalness: st.metal * 0.6, transparent: !!st.finOpacity, opacity: st.finOpacity || 1, depthWrite: !st.finOpacity });
  if (st.finOpacity) { m.emissive = new THREE.Color(st.fin[0]); m.emissiveIntensity = 0.5; }
  if (st.glow) { m.emissive = new THREE.Color(st.glow); m.emissiveMap = tex(cnv(8, 128, (x, w, h) => { const g = x.createLinearGradient(0, h, 0, 0); g.addColorStop(0, '#000'); g.addColorStop(0.8, '#000'); g.addColorStop(1, '#fff'); x.fillStyle = g; x.fillRect(0, 0, w, h); })); m.emissiveIntensity = 1.2; }
  return m;
}

export function createDragon(scene, key, camera, controls, P) {
  const st = STYLES[key], rb = st.rb, NS = 150, R = 18;
  const root = new THREE.Group(); scene.add(root);
  // materials
  const cMap = tex(cnv(1024, 512, (x, w, h) => drawSkin(x, w, h, st, 'color')));
  const nMap = tex(heightToNormal(cnv(1024, 512, (x, w, h) => drawSkin(x, w, h, st, 'height')), st.normal * 0.7), false);
  const MP = st.clearcoat ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
  const bodyM = new MP({ map: cMap, normalMap: nMap, normalScale: new THREE.Vector2(0.6, 0.6), metalness: st.metal, roughness: st.rough, envMapIntensity: 0.75 });
  if (st.clearcoat) { bodyM.clearcoat = st.clearcoat; bodyM.clearcoatRoughness = 0.15; }
  if (st.iridescence) { bodyM.iridescence = st.iridescence; bodyM.iridescenceIOR = 1.4; }
  if (st.glow) { bodyM.emissive = new THREE.Color(st.glow); bodyM.emissiveMap = tex(cnv(1024, 512, (x, w, h) => drawSkin(x, w, h, st, 'glow'))); bodyM.emissiveIntensity = 0.6; }
  const headM = bodyM.clone(); headM.map = cMap.clone(); headM.map.repeat.set(2, 1); headM.map.needsUpdate = true; headM.normalMap = nMap.clone(); headM.normalMap.repeat.set(2, 1); headM.normalMap.needsUpdate = true;
  const finM = finMaterial(st);
  const maneM = new THREE.MeshStandardMaterial({ color: st.mane, roughness: 0.55, metalness: st.metal * 0.5, side: THREE.DoubleSide, emissive: st.glow ? new THREE.Color(st.glow) : new THREE.Color(0), emissiveIntensity: st.glow ? 0.15 : 0 });
  const hornM = new THREE.MeshStandardMaterial({ color: st.horn, roughness: 0.35, metalness: st.metal * 0.8 });
  const toothM = new THREE.MeshStandardMaterial({ color: st.patina ? '#c9b48a' : '#fffaf0', roughness: 0.3 });
  const mouthM = new THREE.MeshStandardMaterial({ color: '#5a0a10', roughness: 0.6 });
  const tongueM = new THREE.MeshStandardMaterial({ color: '#d8283a', roughness: 0.4 });
  const eyeM = new THREE.MeshStandardMaterial({ color: st.glow ? '#ff7a1a' : '#fff2a0', emissive: st.glow ? '#ff5a00' : '#ffcc33', emissiveIntensity: st.glow ? 3 : 1.2, roughness: 0.1 });
  const pupilM = new THREE.MeshStandardMaterial({ color: '#100500', roughness: 0.1 });

  // ---------- body tube (rebuilt each frame) ----------
  const nV = NS * (R + 1), pos = new Float32Array(nV * 3), uv = new Float32Array(nV * 2), idx = [];
  for (let i = 0; i < NS; i++) for (let j = 0; j <= R; j++) { const k = i * (R + 1) + j; uv[k * 2] = i * 0.055 * st.rows / 10 / rb; uv[k * 2 + 1] = j / R; if (i < NS - 1 && j < R) { const a = k, b = k + R + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); } }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bg.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); bg.setIndex(idx);
  const body = new THREE.Mesh(bg, bodyM); body.castShadow = true; body.frustumCulled = false; root.add(body);
  const prof = st.smooth ? (k => rb * (k < 0.08 ? 0.7 + 0.3 * THREE.MathUtils.smoothstep(k, 0, 0.08) : Math.max(0.05, 1 - 0.95 * Math.pow((k - 0.08) / 0.92, 1.4)))) : k => rb * (k < 0.1 ? 0.62 + 0.38 * THREE.MathUtils.smoothstep(k, 0, 0.1) : Math.max(0.04, 1 - 0.96 * Math.pow((k - 0.1) / 0.9, 1.25)) * (1 + 0.12 * Math.sin(k * 12) * (k < 0.6)));

  // ---------- dorsal fins (instanced) ----------
  const finIdx = []; for (let i = st.smooth ? 12 : 6; i < NS - (st.smooth ? 14 : 8); i += st.smooth ? 11 : st.finShape === 'spike' ? 3 : 4) finIdx.push(i);
  const fins = new THREE.InstancedMesh(finShape(st.finShape), finM, finIdx.length); fins.frustumCulled = false; fins.castShadow = true; root.add(fins);
  // belly side-fins small
  const sideIdx = []; for (let i = st.smooth ? 30 : 14; i < NS - 20; i += st.smooth ? 30 : 9) sideIdx.push(i);
  const sfins = new THREE.InstancedMesh(finShape(st.finShape), finM, sideIdx.length * 2); sfins.frustumCulled = false; root.add(sfins);

  // ---------- legs ----------
  const legs = [];
  for (const [li, ph] of [[16, 0], [72, Math.PI]]) for (const s of [-1, 1]) {
    const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner); root.add(g);
    const L = [V(0, 0, 0), V(s * 0.55, -0.15, 0.15), V(s * 0.85, -0.65, 0.45), V(s * 0.95, -1.05, 0.8)];
    inner.add(new THREE.Mesh(taperTube(L, 0.32, 0.17, 16, 10), bodyM));
    const foot = V(s * 0.95, -1.08, 0.85);
    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), bodyM); palm.position.copy(foot); palm.scale.set(1.2, 0.7, 1.1); inner.add(palm);
    for (let c = 0; c < 4; c++) { const a = (c - 1.5) * 0.45, d = V(Math.sin(a) * 0.25 + (c === 0 ? -s * 0.1 : 0), -0.05, Math.cos(a) * 0.3); inner.add(new THREE.Mesh(taperTube([foot.clone(), foot.clone().add(d), foot.clone().add(d.clone().multiplyScalar(1.6)).add(V(0, -0.15, 0)), foot.clone().add(d.clone().multiplyScalar(1.7)).add(V(0, -0.35, -0.05))], 0.07, 0.008, 10, 6), hornM)); }
    const tuft = new THREE.Mesh(finShape(st.finShape), finM); tuft.position.set(s * 0.8, -0.55, 0.4); tuft.scale.setScalar(0.7); tuft.rotation.set(0.6, 0, -s * 0.9); inner.add(tuft);
    g.scale.setScalar(rb * 1.05); legs.push({ g, inner, li, ph, s });
  }

  // ---------- head ----------
  const head = new THREE.Group(); root.add(head);
  const hs = rb * (st.head === 'lion' ? 1.55 : 1.45); head.scale.setScalar(hs);
  const add = (geo, m, p, sc, rot) => { const o = new THREE.Mesh(geo, m); if (p) o.position.copy(p); if (sc) o.scale.copy(sc); if (rot) o.rotation.set(...rot); o.castShadow = true; head.add(o); return o; };
  const lion = st.head === 'lion';
  add(new THREE.SphereGeometry(1, 32, 24), headM, V(0, 0.15, -0.05), lion ? V(1.1, 0.95, 1.0) : V(0.82, 0.72, 0.95));
  const snout = add(new THREE.CapsuleGeometry(0.42, 1.0, 8, 20).rotateX(Math.PI / 2), headM, V(0, 0.08, 1.0), lion ? V(1.45, 0.9, 0.8) : V(1.15, 0.72, 1.05));
  add(new THREE.SphereGeometry(0.5, 24, 16), headM, V(0, 0.28, lion ? 1.45 : 1.75), lion ? V(1.3, 0.75, 0.6) : V(0.9, 0.55, 0.5)); // curled nose bulb
  for (const s of [-1, 1]) {
    add(new THREE.TorusGeometry(0.13, 0.05, 8, 16), maneM, V(s * 0.22, 0.42, lion ? 1.72 : 1.95), null, [0.4, s * 0.4, 0]);
    // eyes + brows
    const ep = lion ? V(s * 0.5, 0.55, 0.75) : V(s * 0.46, 0.42, 0.58);
    add(new THREE.SphereGeometry(lion ? 0.3 : 0.17, 20, 14), lion ? new THREE.MeshStandardMaterial({ color: '#fff', roughness: 0.2 }) : eyeM, ep);
    add(new THREE.SphereGeometry(lion ? 0.15 : 0.08, 12, 10), lion ? pupilM : pupilM, ep.clone().add(V(s * 0.06, 0, lion ? 0.22 : 0.13)));
    const brow = add(finShape(lion ? 'cloud' : st.finShape), maneM, ep.clone().add(V(s * 0.05, 0.16, 0.05)), V(0.55, 0.5, 0.55), [0, 0, -s * 0.5]);
    brow.rotation.y = s * 0.25;
    // cheek fins
    add(finShape(st.finShape), maneM, V(s * 0.72, -0.05, 0.25), V(0.9, 0.75, 0.9), [0, s * 0.5, -s * 1.4]);
    // antlers (branching)
    if (!lion || s === 1) {
      const xo = lion ? 0 : s;
      const main = [V(xo * 0.35, 0.72, -0.15), V(xo * 0.55, 1.25, -0.55), V(xo * 0.7, 1.6, -1.2), V(xo * 0.62, 1.75, -1.95)];
      add(taperTube(main, 0.13, 0.03, 24, 8), hornM);
      const c = new THREE.CatmullRomCurve3(main);
      for (const [t, d] of [[0.35, V(xo * 0.15, 0.55, 0.25)], [0.62, V(xo * 0.25, 0.5, 0.05)], [0.8, V(-xo * 0.05, 0.35, -0.2)]]) { const b = c.getPointAt(t); add(taperTube([b, b.clone().add(d.clone().multiplyScalar(0.5)).add(V(0, 0, -0.1)), b.clone().add(d)], 0.07, 0.015, 10, 6), hornM); }
    }
  }
  if (lion) { // pompoms + mirror + fluffy beard
    const pomM = [new THREE.MeshStandardMaterial({ color: '#ffe14a', roughness: 0.9 }), new THREE.MeshStandardMaterial({ color: '#ff3b2f', roughness: 0.9 }), new THREE.MeshStandardMaterial({ color: '#f0e6d0', roughness: 0.9 })];
    [[0, 1.15, 0.2, 0.28], [-0.7, 0.85, 0.1, 0.2], [0.7, 0.85, 0.1, 0.2], [-0.35, 1.05, 0.5, 0.15], [0.35, 1.05, 0.5, 0.15]].forEach(([x, y, z, r], k) => add(new THREE.IcosahedronGeometry(r, 2), pomM[k % 3], V(x, y, z)));
    add(new THREE.CircleGeometry(0.22, 24), new THREE.MeshStandardMaterial({ color: '#dfe8ff', metalness: 1, roughness: 0.05 }), V(0, 0.62, 1.0), null, [-0.3, 0, 0]);
    const fur = new THREE.MeshStandardMaterial({ color: '#f3dfb0', roughness: 1 });
    for (let k = 0; k < 18; k++) { const a = k / 26 * Math.PI * 1.6 - Math.PI * 0.8; add(new THREE.IcosahedronGeometry(0.22 + Math.random() * 0.12, 1), k % 4 ? fur : pomM[0], V(Math.sin(a) * 1.05, Math.cos(a) * 0.9 + 0.1, -0.55 + Math.random() * 0.2)); }
  }
  // jaw
  const jaw = new THREE.Group(); jaw.position.set(0, -0.2, 0.15); head.add(jaw);
  const jm = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.0, 6, 16).rotateX(Math.PI / 2), headM); jm.position.set(0, -0.12, 0.85); jm.scale.set(lion ? 1.7 : 1.2, 0.55, 1); jaw.add(jm);
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), mouthM); mouth.position.set(0, 0.02, 0.85); mouth.scale.set(lion ? 1.0 : 0.8, 0.3, 1.3); jaw.add(mouth);
  jaw.add(new THREE.Mesh(taperTube([V(0, 0.05, 0.4), V(0, 0.12, 1.1), V(0, 0.0, 1.7), V(0, 0.2, 2.2)], 0.12, 0.04, 16, 8), tongueM));
  const toothG = new THREE.ConeGeometry(0.045, 0.2, 8);
  for (const s of [-1, 1]) for (let k = 0; k < 6; k++) {
    const z = 0.65 + k * 0.17, x = s * (lion ? 0.55 : 0.36) * (1 - k * 0.04), fang = k === 5;
    const up = new THREE.Mesh(toothG, toothM); up.position.set(x, -0.18, z); up.rotation.x = Math.PI; up.scale.setScalar(fang ? 2.0 : 1); head.add(up);
    const lo = new THREE.Mesh(toothG, toothM); lo.position.set(x * 0.95, 0.08, z - 0.05); lo.scale.setScalar(k === 4 ? 1.8 : 0.9); jaw.add(lo);
  }
  // whiskers (flowing)
  const whisk = [];
  for (const s of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(s * 0.4, 0.15, 1.65); head.add(w);
    w.add(new THREE.Mesh(taperTube([V(0, 0, 0), V(s * 0.8, 0.2, -0.1), V(s * 1.5, -0.3, -0.8), V(s * 2.0, 0.25, -1.9), V(s * 2.3, -0.2, -3.0), V(s * 2.5, 0.2, -3.8)], 0.055, 0.008, 40, 6), hornM));
    whisk.push({ w, s });
    for (let b = 0; b < 3; b++) { const bw = new THREE.Mesh(taperTube([V(s * 0.15 * b, -0.4, 0.9 - b * 0.2), V(s * (0.2 + b * 0.15), -0.9, 0.6 - b * 0.2), V(s * (0.15 + b * 0.2), -1.4, 0.2 - b * 0.25)], 0.05, 0.01, 12, 5), maneM); jaw.add(bw); }
  }
  // mane: curly flames around the back of the skull
  const maneG = finShape(lion ? 'cloud' : st.finShape);
  for (let k = 0; k < (lion ? 9 : 13); k++) {
    const a = (k / ((lion ? 9 : 13) - 1) - 0.5) * Math.PI * 1.5;
    const m = new THREE.Mesh(maneG, maneM); m.position.set(Math.sin(a) * 0.62, Math.cos(a) * 0.5 + 0.2, -0.6); m.rotation.set(0, 0, -a); m.scale.setScalar(0.9 + Math.random() * 0.5); head.add(m);
    const curl = []; for (let q = 0; q < 14; q++) { const ang = q * 0.6, rr = 0.22 * (1 - q / 16); curl.push(V(Math.cos(ang) * rr, Math.sin(ang) * rr, -q * 0.06)); }
    if (k % 2 === 0) { const cm = new THREE.Mesh(taperTube(curl, 0.05, 0.015, 24, 5), maneM); cm.position.set(Math.sin(a) * 0.8, Math.cos(a) * 0.68 + 0.2, -1.3); cm.rotation.z = -a; head.add(cm); }
  }
  if (st.crest) add(finShape('flame'), maneM, V(0, 0.75, 0.15), V(1.3, 1.5, 1.3));
  head.traverse(o => o.castShadow = true);

  // tail tuft
  const tail = new THREE.Group(); root.add(tail);
  for (let k = 0; k < 7; k++) { const m = new THREE.Mesh(finShape(st.finShape), finM); m.rotation.z = (k - 3) * 0.45; m.scale.set(1, 1.2, 1.6); tail.add(m); }
  tail.scale.setScalar(rb * 1.6);

  // pearl
  const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.45, 32, 20), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: st.pearl, emissiveIntensity: 0.55, roughness: 0.1 })); scene.add(pearl);
  pearl.add(new THREE.PointLight(st.pearl, 10, 10, 1.6));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(cnv(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); })), color: st.pearl, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.setScalar(1.2); halo.material.opacity = 0.45; pearl.add(halo);
  // fill light for the dragon
  const fill = new THREE.PointLight(0xffffff, 14, 30, 1.5); scene.add(fill);

  // water dragon: mist/sparkle trail
  let trail = null;
  if (st.trail) {
    const TN = 600, tp = new Float32Array(TN * 3), tc = new Float32Array(TN * 3);
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(tp, 3)); tg.setAttribute('color', new THREE.BufferAttribute(tc, 3));
    const spr = tex(cnv(32, 32, (x) => { const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); }));
    const pts = new THREE.Points(tg, new THREE.PointsMaterial({ size: 0.45, map: spr, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); pts.frustumCulled = false; scene.add(pts);
    trail = { tp, tc, tg, life: new Float32Array(TN), vel: new Float32Array(TN * 3), n: 0, TN };
  }

  const pts = Array.from({ length: NS }, () => V()), T = Array.from({ length: NS }, () => V()), N = Array.from({ length: NS }, () => V()), S = Array.from({ length: NS }, () => V());
  const up = V(0, 1, 0), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), tmp = V(), tmp2 = V(), sc = V();
  const ds = st.len / 26 / NS;
  function frameAt(i, out) { return m4.makeBasis(S[i], N[i], T[i]); }
  function update(t, dt) {
    if (window.__dragonT != null) t = window.__dragonT;
    const u0 = t * 0.11 + (window.__dragonPhase || 0);
    for (let i = 0; i < NS; i++) { const u = u0 - i * ds; P(u, pts[i]); }
    if (st.smooth) for (let i = 0; i < NS; i++) T[i].subVectors(pts[Math.max(0, i - 1)], pts[Math.min(NS - 1, i + 1)]); // base-path tangents (before displacement)
    for (let i = 0; i < NS; i++) { // waves
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(NS - 1, i + 1)]; if (st.smooth) tmp.copy(T[i]).normalize(); else tmp.subVectors(a, b).normalize(); tmp2.crossVectors(tmp, up).normalize();
      const env = Math.min(1, i / 14), ph = i / NS * st.len;
      if (st.smooth) { // planar sinuous slither: one travelling wave, vertical locked in phase -> no corkscrew
        const w = Math.sin(ph * 0.42 - t * 1.8) * (0.6 + 0.9 * i / NS) * env;
        pts[i].addScaledVector(tmp2, w); pts[i].y += w * 0.25 + Math.sin(ph * 0.12 - t * 0.6) * 0.5 * env;
      } else {
      pts[i].addScaledVector(tmp2, Math.sin(ph * 0.55 - t * 2.2) * 1.3 * env);
      pts[i].y += Math.sin(ph * 0.42 - t * 1.7 + 1) * 1.1 * env; }
    }
    if (st.smooth) { // parallel-transport frames: start from world-up at the head, carry forward with minimal rotation (no roll)
      for (let i = 0; i < NS; i++) T[i].subVectors(pts[Math.max(0, i - 1)], pts[Math.min(NS - 1, i + 1)]).normalize();
      N[0].copy(up).addScaledVector(T[0], -up.dot(T[0])).normalize(); S[0].crossVectors(N[0], T[0]).normalize();
      for (let i = 1; i < NS; i++) {
        q.setFromUnitVectors(T[i - 1], T[i]); N[i].copy(N[i - 1]).applyQuaternion(q);
        N[i].addScaledVector(T[i], -N[i].dot(T[i])).lerp(tmp.copy(up).addScaledVector(T[i], -up.dot(T[i])).normalize(), 0.02).normalize(); // gentle bias to keep belly down
        S[i].crossVectors(N[i], T[i]).normalize();
      }
    } else for (let i = 0; i < NS; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(NS - 1, i + 1)];
      T[i].subVectors(a, b).normalize();
      N[i].copy(up).addScaledVector(T[i], -up.dot(T[i])).normalize(); S[i].crossVectors(N[i], T[i]).normalize();
    }
    for (let i = 0; i < NS; i++) {
      const r = prof(i / (NS - 1)) * (st.smooth ? 1 : 1 + 0.03 * Math.sin(t * 3 - i * 0.2));
      for (let j = 0; j <= R; j++) {
        const th = j / R * Math.PI * 2, c = Math.cos(th), s = Math.sin(th), k = (i * (R + 1) + j) * 3, rr = r * (s < 0 ? 1 + s * 0.12 : 1);
        pos[k] = pts[i].x + (S[i].x * c + N[i].x * s) * rr; pos[k + 1] = pts[i].y + (S[i].y * c + N[i].y * s) * rr; pos[k + 2] = pts[i].z + (S[i].z * c + N[i].z * s) * rr;
      }
    }
    bg.attributes.position.needsUpdate = true; bg.computeVertexNormals();
    finIdx.forEach((i, n) => { const r = prof(i / (NS - 1)), s = r * st.finScale * (1 + (st.smooth ? 0.04 : 0.12) * Math.sin(t * 3 - i * 0.25)); frameAt(i); m4.scale(sc.set(s, s, s)); m4.setPosition(tmp.copy(pts[i]).addScaledVector(N[i], r * 0.8)); fins.setMatrixAt(n, m4); });
    fins.instanceMatrix.needsUpdate = true;
    sideIdx.forEach((i, n) => { const r = prof(i / (NS - 1)); for (const s of [0, 1]) { const sg = s ? 1 : -1; const rot = new THREE.Matrix4().makeRotationZ(sg * (2.0 + (st.smooth ? 0.08 : 0.2) * Math.sin(t * 2.5 + i))); frameAt(i); m4.multiply(rot); m4.scale(sc.setScalar(r * st.finScale * 0.55)); m4.setPosition(tmp.copy(pts[i]).addScaledVector(S[i], sg * r * 0.85).addScaledVector(N[i], -r * 0.2)); sfins.setMatrixAt(n * 2 + s, m4); } });
    sfins.instanceMatrix.needsUpdate = true;
    for (const L of legs) { frameAt(L.li); L.g.quaternion.setFromRotationMatrix(m4); const r = prof(L.li / (NS - 1)); L.g.position.copy(pts[L.li]).addScaledVector(S[L.li], L.s * r * 0.55).addScaledVector(N[L.li], -r * 0.3); L.inner.rotation.x = Math.sin(t * 2.6 + L.ph + (L.s > 0 ? 0 : Math.PI)) * 0.45; L.inner.rotation.z = L.s * Math.sin(t * 2.6 + L.ph) * 0.15; }
    frameAt(0); head.quaternion.setFromRotationMatrix(m4); head.position.copy(pts[0]).addScaledVector(T[0], hs * 0.55);
    head.rotateX(-0.08 + Math.sin(t * 1.3) * 0.06);
    jaw.rotation.x = 0.42 + Math.sin(t * 1.9) * 0.12;
    whisk.forEach(({ w, s }) => { w.rotation.y = s * (0.1 + Math.sin(t * 2 + s) * 0.12); w.rotation.x = Math.sin(t * 2.4 + s) * 0.15; });
    frameAt(NS - 1); tail.quaternion.setFromRotationMatrix(m4); tail.position.copy(pts[NS - 1]); tail.rotateZ(Math.sin(t * 2) * (st.smooth ? 0.08 : 0.3));
    P(u0 + 0.12, pearl.position); pearl.position.y += 1.5 + Math.sin(t * 2) * 0.4; pearl.rotation.y += dt;
    fill.position.copy(pts[20]).add(V(0, 5, 0));
    if (st.glow) bodyM.emissiveIntensity = 0.45 + Math.sin(t * 2) * 0.25;
    if (trail) {
      const { tp, tc, life, vel, TN } = trail;
      for (let e = 0; e < 6; e++) { const k = trail.n++ % TN, i = Math.floor(Math.random() * NS), r = prof(i / (NS - 1)); const a = Math.random() * 6.28; tp.set([pts[i].x + (S[i].x * Math.cos(a) + N[i].x * Math.sin(a)) * r * 1.2, pts[i].y + Math.sin(a) * r * 1.2, pts[i].z + (S[i].z * Math.cos(a)) * r * 1.2], k * 3); vel.set([(Math.random() - .5) * 0.6, -0.3 - Math.random() * 0.4, (Math.random() - .5) * 0.6], k * 3); life[k] = 1; }
      for (let k = 0; k < TN; k++) { if (life[k] <= 0) { tc[k * 3] = tc[k * 3 + 1] = tc[k * 3 + 2] = 0; continue; } life[k] -= dt * 0.5; tp[k * 3] += vel[k * 3] * dt; tp[k * 3 + 1] += vel[k * 3 + 1] * dt; tp[k * 3 + 2] += vel[k * 3 + 2] * dt; const l = Math.max(0, life[k]); tc[k * 3] = 0.6 * l; tc[k * 3 + 1] = 0.9 * l; tc[k * 3 + 2] = 1.0 * l; }
      trail.tg.attributes.position.needsUpdate = true; trail.tg.attributes.color.needsUpdate = true;
    }
    if (window.__dragonCam === 'close') {
      const c = pts[30]; tmp.copy(S[30]); if (tmp.dot(c) > 0) tmp.negate();
      camera.position.copy(c).addScaledVector(tmp, 17).addScaledVector(T[30], 4).add(V(0, 4.0, 0));
      controls.target.copy(pts[22]); camera.lookAt(controls.target);
    }
    window.__dragonInfo = { head: pts[0].toArray(), n: [40, 75, 110, 145].map(i => N[i].toArray()), tt: [40, 75, 110, 145].map(i => T[i].toArray()) };
  }
  return { update, root };
}
