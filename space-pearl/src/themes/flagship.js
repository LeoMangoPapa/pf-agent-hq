// Flagship cruiser "VIỆT NAM": white-gold-silver hull, Vietnamese flag on tail & hull, slow banking loop.
import * as THREE from 'three';
import { glow } from './ngoc-trai-fx.js';

function tex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
// Flag of Vietnam: 2:3, red #DA251D, yellow #FFFF00 star, outer radius = 1/5 of flag length, centred.
export function flagTexture(W = 600) {
  const H = W * 2 / 3;
  return tex(W, H, (x) => { x.fillStyle = '#da251d'; x.fillRect(0, 0, W, H); x.fillStyle = '#ffff00'; const R = W / 5, r = R * 0.381966; x.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r : R; x.lineTo(W / 2 + Math.cos(a) * rr, H / 2 + Math.sin(a) * rr); } x.closePath(); x.fill(); });
}
function nameTexture() {
  return tex(1024, 192, (x, w, h) => { x.clearRect(0, 0, w, h);
    const fl = 150, fh = 100; // small flag before the text
    x.fillStyle = '#da251d'; x.fillRect(14, (h - fh) / 2, fl, fh); x.fillStyle = '#ffff00'; const R = fl / 5, r = R * 0.381966; x.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r : R; x.lineTo(14 + fl / 2 + Math.cos(a) * rr, h / 2 + Math.sin(a) * rr); } x.fill();
    x.font = '700 118px Georgia, "Noto Serif", "DejaVu Serif", serif'; x.textBaseline = 'middle';
    const g = x.createLinearGradient(0, 40, 0, 160); g.addColorStop(0, '#fff3c4'); g.addColorStop(0.5, '#e2b24f'); g.addColorStop(1, '#a8761f');
    x.lineWidth = 8; x.strokeStyle = 'rgba(70,40,10,.85)'; x.strokeText('VIỆT NAM', 200, h / 2 + 6); x.fillStyle = g; x.fillText('VIỆT NAM', 200, h / 2 + 6); });
}
function panelTexture() {
  return tex(512, 512, (x, w, h) => { x.fillStyle = '#f1eef2'; x.fillRect(0, 0, w, h);
    for (let k = 0; k < 220; k++) { const px = (k * 97) % w, py = (k * 61 + (k % 7) * 13) % h, pw = 30 + (k * 37) % 90, ph = 20 + (k * 53) % 60; x.fillStyle = `rgba(${200 + (k % 3) * 10},${198 + (k % 4) * 8},${210},.35)`; x.fillRect(px, py, pw, ph); }
    x.strokeStyle = 'rgba(120,115,135,.55)'; x.lineWidth = 1.5;
    for (let i = 0; i <= 16; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, h); x.stroke(); }
    for (let j = 0; j <= 8; j++) { x.beginPath(); x.moveTo(0, j * 64 + (j % 2) * 8); x.lineTo(w, j * 64 + (j % 2) * 8); x.stroke(); }
    x.fillStyle = 'rgba(90,85,110,.6)'; for (let k = 0; k < 120; k++) x.fillRect((k * 131) % w, (k * 89) % h, 3, 3); });
}

export function createFlagship(ctx, s) {
  const { scene } = ctx, root = new THREE.Group(), ship = new THREE.Group(); root.add(ship); scene.add(root);
  const pt = panelTexture(); pt.wrapS = pt.wrapT = THREE.RepeatWrapping; pt.repeat.set(6, 2);
  const hullM = new THREE.MeshPhysicalMaterial({ map: pt, color: 0xffffff, roughness: 0.3, metalness: 0.15, clearcoat: 0.9, clearcoatRoughness: 0.2, envMapIntensity: 1.1 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xc9ccd6, metalness: 1, roughness: 0.22, envMapIntensity: 1.3 });
  const gold = s.gold, dark = new THREE.MeshStandardMaterial({ color: 0x2a2440, metalness: 0.6, roughness: 0.35 });
  // main hull: lathe along z (nose +z), oval section
  const prof = []; const L = 26;
  for (let i = 0; i <= 40; i++) { const u = i / 40, z = -L / 2 + u * L; let r = u < 0.08 ? 1.6 + u / 0.08 * 0.6 : u < 0.62 ? 2.2 : 2.2 * Math.cos((u - 0.62) / 0.38 * Math.PI / 2) ** 0.8 + 0.05; prof.push(new THREE.Vector2(Math.max(r, 0.05), z)); }
  const hg = new THREE.LatheGeometry(prof, 48); hg.rotateX(Math.PI / 2); hg.rotateZ(Math.PI / 2); hg.scale(1.15, 0.75, 1); // lathe axis y -> z, nose +z
  const hull = new THREE.Mesh(hg, hullM); ship.add(hull);
  // fix orientation check: nose at +z
  hg.computeBoundingBox();
  // dorsal superstructure + bridge
  const sup = new THREE.Mesh(new THREE.CapsuleGeometry(1.0, 7, 6, 20), hullM); sup.rotation.x = Math.PI / 2; sup.scale.set(1.2, 1, 0.8); sup.position.set(0, 1.6, -1.5); ship.add(sup);
  const bridge = new THREE.Mesh(new THREE.SphereGeometry(0.95, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x6a58b0, roughness: 0.05, metalness: 0.3, clearcoat: 1, emissive: 0x2a1c60, emissiveIntensity: 0.6 }));
  bridge.scale.set(1, 0.6, 1.6); bridge.position.set(0, 2.3, 2.2); ship.add(bridge);
  [-11.4, -8.6, -5.8, -3.0].forEach((z, k) => { const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.09, 8, 48), k % 2 ? silver : gold); ring.scale.set(2.55, 1.68, 1); ring.position.z = z; ship.add(ring); });
  const stripe = (y, m) => { const st = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.12, 15), m); st.position.set(0, y, -1); ship.add(st); };
  stripe(-0.2, gold);
  // swept wings with gold leading edge and silver nacelles
  const ws = new THREE.Shape(); ws.moveTo(0, 3); ws.lineTo(7.5, -3.2); ws.lineTo(7.5, -5.4); ws.lineTo(0, -6.5); ws.lineTo(0, 3);
  const wg = new THREE.ExtrudeGeometry(ws, { depth: 0.28, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.06, bevelSegments: 2 }); wg.rotateX(Math.PI / 2);
  const engines = [];
  for (const sx of [-1, 1]) {
    const w = new THREE.Mesh(wg, hullM); w.scale.set(sx, 1, 1); w.position.set(sx * 1.6, -0.3, -3); ship.add(w);
    const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 9.7, 8), gold); edge.position.set(sx * (1.6 + 3.75), -0.15, -3.1); edge.lookAt(sx * (1.6 + 7.5), -0.15, -6.2); edge.rotateX(Math.PI / 2); ship.add(edge);
    const nac = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.95, 8, 24), silver); nac.rotation.x = Math.PI / 2; nac.position.set(sx * 8.4, -1.3, -6); ship.add(nac);
    const nr = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.1, 8, 32), gold); nr.position.set(sx * 8.4, -1.3, -9.9); ship.add(nr);
    const nosec = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.6, 24), silver); nosec.rotation.x = Math.PI / 2; nosec.position.set(sx * 8.4, -1.3, -1.2); ship.add(nosec);
    engines.push(new THREE.Vector3(sx * 8.4, -1.3, -10.1));
    const py = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.0, 3), silver); py.position.set(sx * 8.4, -0.75, -5.5); ship.add(py);
    // nav lights: red port (-x), green starboard (+x)
    const nl = glow(sx < 0 ? 0xff2a3a : 0x2aff7a, 1.6); nl.position.set(sx * 9.25, -1.1, -2.6); ship.add(nl); (ship.userData.nav ||= []).push(nl);
  }
  // main engines cluster
  for (const [x, y] of [[0, 0], [-1.1, 0.5], [1.1, 0.5]]) engines.push(new THREE.Vector3(x, y, -L / 2 - 0.3));
  const engMat = () => new THREE.MeshBasicMaterial({ color: new THREE.Color(1.1, 0.75, 1.5), transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false });
  const trails = [], glows = [];
  for (const e of engines) {
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.45, 0.8, 20, 1, true), silver); bell.rotation.x = Math.PI / 2; bell.position.copy(e).setZ(e.z + 0.35); ship.add(bell);
    const core = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.9, 3.0), side: THREE.DoubleSide })); core.position.copy(e).setZ(e.z + 0.2); ship.add(core);
    const gl = glow(0xe6b8ff, 3.2); gl.position.copy(e); ship.add(gl); glows.push(gl);
    const tr = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 16, 1, true), engMat()); tr.geometry.translate(0, -0.5, 0); tr.rotation.x = Math.PI / 2; tr.position.copy(e); tr.scale.y = 9; ship.add(tr); trails.push(tr);
  }
  // tail fin with the flag on both sides
  const fs = new THREE.Shape(); fs.moveTo(0, 0); fs.lineTo(5.2, 0); fs.lineTo(3.6, 4.6); fs.lineTo(1.6, 4.6); fs.lineTo(0, 0);
  const fin = new THREE.Mesh(new THREE.ExtrudeGeometry(fs, { depth: 0.3, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.05 }), hullM);
  fin.rotation.y = Math.PI / 2; fin.position.set(-0.15, 1.3, -5.6); ship.add(fin);
  const finEdge = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 2.2), gold); finEdge.position.set(0, 5.95, -8.4); ship.add(finEdge);
  const ft = flagTexture(), fm = new THREE.MeshStandardMaterial({ map: ft, roughness: 0.5, emissive: 0xffffff, emissiveMap: ft, emissiveIntensity: 0.35 });
  for (const sx of [-1, 1]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.8), fm); f.position.set(sx * 0.27, 3.5, -8.4); f.rotation.y = sx * Math.PI / 2; ship.add(f); }
  // hull name "VIỆT NAM" on both flanks (each plane faces outward → never mirrored)
  const nt = nameTexture(), nm = new THREE.MeshStandardMaterial({ map: nt, transparent: true, roughness: 0.4, emissive: 0xffffff, emissiveMap: nt, emissiveIntensity: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 1.6), nm); p.position.set(sx * 2.62, 0.12, 2.0); p.rotation.y = sx * Math.PI / 2; ship.add(p); }
  // belly flag + windows strip
  const win = tex(512, 16, (x, w, h) => { x.fillStyle = 'rgba(0,0,0,0)'; x.clearRect(0, 0, w, h); for (let i = 0; i < 40; i++) { x.fillStyle = i % 5 === 3 ? 'rgba(255,230,170,.25)' : '#ffe9b0'; x.fillRect(i * 12.8 + 3, 4, 7, 8); } });
  const wm = new THREE.MeshBasicMaterial({ map: win, transparent: true, color: new THREE.Color(1.6, 1.4, 1.1), depthWrite: false });
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(14, 0.35), wm); p.position.set(sx * 2.56, -0.85, -0.5); p.rotation.y = sx * Math.PI / 2; ship.add(p); }
  // strobes
  const strobe = glow(0xffffff, 2.2); strobe.position.set(0, 6.1, -9.2); ship.add(strobe);
  const strobe2 = glow(0xffffff, 1.6); strobe2.position.set(0, -1.4, -3); ship.add(strobe2);
  ship.traverse(o => { if (o.isMesh && !o.material.transparent) { o.castShadow = true; } });
  ship.scale.setScalar(0.6); // v4: 2/3 of v3 (0.9)

  const P = (u, o = new THREE.Vector3()) => o.set(Math.sin(u) * (30 + Math.sin(u * 2) * 2.5), 14.5 + Math.sin(u * 1.5 + 1) * 1.5, Math.cos(u) * (28 + Math.sin(u * 2) * 2));
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), t1 = new THREE.Vector3(), t2 = new THREE.Vector3();
  const api = { root, ship, P, phase: 0, speed: 0.045, u: 0,
    update(t, dt) {
      const u = t * this.speed + this.phase; this.u = u;
      P(u, a); P(u + 0.01, b); P(u + 0.03, c);
      root.position.copy(a); root.lookAt(b);
      t1.subVectors(b, a).normalize(); t2.subVectors(c, b).normalize();
      const turn = (t1.x * t2.z - t1.z * t2.x) / 0.02; // signed turn rate
      const bank = THREE.MathUtils.clamp(turn * 0.4, -0.2, 0.2);
      ship.rotation.z = THREE.MathUtils.lerp(ship.rotation.z, bank, dt ? Math.min(1, dt * 2) : 1);
      ship.rotation.x = Math.sin(t * 0.4) * 0.03;
      const fl = 1 + Math.sin(t * 23) * 0.06 + Math.sin(t * 37) * 0.04;
      glows.forEach(g => g.scale.setScalar(3.2 * fl)); trails.forEach((tr, i) => { tr.scale.y = (i < 2 ? 7 : 10) * fl; });
      ship.userData.nav.forEach(n => n.material.opacity = (t % 1.2) < 0.6 ? 1 : 0.35);
      strobe.material.opacity = (t % 1.5) < 0.08 ? 1 : 0; strobe2.material.opacity = ((t + 0.4) % 1.5) < 0.08 ? 1 : 0;
    } };
  return api;
}
