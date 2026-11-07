// Flying objects and deep-space dressing for "Ngọc trai vũ trụ". Pure decoration: no bots, no UI.
import * as THREE from 'three';

const glowTex = (() => { let t; return () => t ||= (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })(); })();
export const glow = (color, size, op = 1) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: new THREE.Color(color), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false })); s.scale.setScalar(size); return s; };
const streakTex = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 8; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 128, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.85, 'rgba(255,230,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,1)'); x.fillStyle = g; x.fillRect(0, 2, 128, 4); return c; });
const ease = k => k * k * (3 - 2 * k);
const bez = (a, b, c, d, t, o) => { const u = 1 - t; return o.set(0, 0, 0).addScaledVector(a, u * u * u).addScaledVector(b, 3 * u * u * t).addScaledVector(c, 3 * u * t * t).addScaledVector(d, t * t * t); };

export function createFX(ctx, s, podDocks) {
  const { scene, QUALITY, canvasTex } = ctx, HI = QUALITY === 'high', fx = { list: [] };
  const white = s.white, gold = s.gold;

  // ---- distant planet with atmosphere + ring, and a small moon ----
  { const g = new THREE.Group(); g.position.set(-380, 58, 25); g.scale.setScalar(0.7); scene.add(g);
    const pm = new THREE.ShaderMaterial({ uniforms: { L: { value: new THREE.Vector3(0.9, 0.35, 0.25).normalize() } },
      vertexShader: 'varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(mat3(modelMatrix)*normal); vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `uniform vec3 L; varying vec3 vN; varying vec3 vP;
        void main(){ float b = sin(vP.y*.22 + sin(vP.x*.05)*2.)*.5+.5, b2 = sin(vP.y*.6+vP.z*.03)*.5+.5;
          vec3 c = mix(vec3(.55,.40,.75), vec3(.98,.78,.88), b); c = mix(c, vec3(1.,.93,.86), b2*.25);
          float d = max(dot(normalize(vN), L), 0.); gl_FragColor = vec4(c*(.06 + .7*pow(d,.8)), 1.); }` });
    g.add(new THREE.Mesh(new THREE.SphereGeometry(48, 64, 32), pm));
    const atm = new THREE.Mesh(new THREE.SphereGeometry(53, 64, 32), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
      vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 w = modelMatrix*vec4(position,1.); vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition-w.xyz); gl_Position = projectionMatrix*viewMatrix*w; }',
      fragmentShader: 'varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.-abs(dot(vN,vV)), 1.6); float r = smoothstep(.0,.35,f)*(1.-smoothstep(.6,1.,f)); gl_FragColor = vec4(vec3(1.,.72,.95)*r*.55, 1.); }' }));
    g.add(atm);
    const ring = new THREE.Mesh(new THREE.RingGeometry(64, 96, 128, 1), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, depthWrite: false, opacity: 0.3,
      map: canvasTex(256, 8, (x, w) => { for (let i = 0; i < w; i++) { const a = (0.35 + 0.65 * Math.abs(Math.sin(i * 0.17) * Math.sin(i * 0.05))) * (i > w * 0.45 && i < w * 0.5 ? 0.15 : 1); x.fillStyle = `rgba(${200 + (i % 30)},${170 + (i % 30)},235,${a})`; x.fillRect(i, 0, 1, 8); } }) }));
    { const uv = ring.geometry.attributes.uv, p = ring.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (Math.hypot(p.getX(i), p.getY(i)) - 64) / 32, 0.5); }
    ring.rotation.set(-1.25, 0.2, 0.3); g.add(ring);
    const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(9, 3), new THREE.MeshStandardMaterial({ color: 0xd8cfe0, roughness: 1, flatShading: true }));
    moon.position.set(210, 95, -360); scene.add(moon); moon.add(glow(0xf0d8ff, 34, 0.35));
    fx.planet = g; fx.moon = moon; }

  // ---- parallax star layers + drifting dust ----
  const pts = (n, rMin, rMax, size, col, op) => { const p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(rMin + Math.random() * (rMax - rMin)); p.set([v.x, v.y, v.z], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const m = new THREE.Points(g, new THREE.PointsMaterial({ size, map: glowTex(), color: col, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(m); return m; };
  fx.starsMid = pts(HI ? 1500 : 600, 200, 300, 1.6, 0xfff0ff, 0.9);
  fx.starsBright = pts(HI ? 140 : 60, 260, 380, 6, 0xffe8f8, 1);
  fx.dust = pts(HI ? 900 : 300, 14, 70, 0.35, 0xffe6c8, 0.75);

  // ---- shuttles: dock / undock at pods with engine glow trails ----
  const mkShuttle = () => { const g = new THREE.Group(), body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.5, 6, 16), white); body.rotation.x = Math.PI / 2; g.add(body);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.06, 8, 24), gold); band.position.z = -0.3; g.add(band);
    const cock = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), new THREE.MeshPhysicalMaterial({ color: 0x5a4a8a, roughness: 0.05, metalness: 0.4, clearcoat: 1 })); cock.position.set(0, 0.16, 0.75); g.add(cock);
    for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.6), gold); w.position.set(sx * 0.6, -0.1, -0.4); w.rotation.z = sx * -0.2; g.add(w); const nl = glow(sx > 0 ? 0x66ffb0 : 0xff6688, 0.5); nl.position.set(sx * 1.05, -0.2, -0.4); g.add(nl); }
    const eng = glow(0xffd0ff, 1.6); eng.position.z = -1.35; g.add(eng);
    const trail = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1, 12, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 0.6, 1.1), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
    trail.geometry.translate(0, -0.5, 0); trail.rotation.x = Math.PI / 2; trail.position.z = -1.2; g.add(trail);
    g.scale.setScalar(1.15); scene.add(g); return { g, eng, trail }; };
  fx.shuttles = [];
  const nS = HI ? 4 : 2;
  for (let i = 0; i < nS; i++) { const sh = mkShuttle(); sh.period = 26 + i * 3; sh.off = i * 7.3; sh.seed = i * 5; fx.shuttles.push(sh); }
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), farPt = (k, o) => { const a = k * 2.399; return o.set(Math.sin(a) * 85, 22 + (k % 3) * 9, Math.cos(a) * 85); };
  const P0 = new THREE.Vector3(), P1 = new THREE.Vector3(), P2 = new THREE.Vector3(), P3 = new THREE.Vector3();
  const flightPos = (sh, ph, cyc, out) => { // ph 0..1 within cycle
    const dock = podDocks[(sh.seed + cyc * 5) % podDocks.length], out0 = dock.out;
    if (ph < 0.42) { const k = ease(ph / 0.42); farPt(sh.seed + cyc * 2, P0); P3.copy(dock.p); P2.copy(dock.p).addScaledVector(out0, 9).setY(dock.p.y + 3); P1.copy(P0).lerp(P2, 0.4).setY(P0.y + 6); return bez(P0, P1, P2, P3, k, out); }
    if (ph < 0.58) return out.copy(dock.p).setY(dock.p.y + Math.sin(ph * 60) * 0.02);
    const k = ((ph - 0.58) / 0.42) ** 1.6; P0.copy(dock.p); P1.copy(dock.p).addScaledVector(out0, 9).setY(dock.p.y + 2); farPt(sh.seed + cyc * 2 + 1, P3); P2.copy(P3).lerp(P1, 0.4).setY(P3.y + 5); return bez(P0, P1, P2, P3, k, out); };

  // ---- cargo drones around the hub ----
  fx.drones = [];
  const dg = new THREE.OctahedronGeometry(0.45, 0), rg = new THREE.TorusGeometry(0.32, 0.04, 6, 16), cg = new THREE.BoxGeometry(0.5, 0.4, 0.5);
  for (let i = 0; i < (HI ? 7 : 3); i++) { const g = new THREE.Group(); g.add(new THREE.Mesh(dg, white));
    for (const [x, z] of [[0.6, 0.6], [-0.6, 0.6], [0.6, -0.6], [-0.6, -0.6]]) { const r = new THREE.Mesh(rg, gold); r.rotation.x = Math.PI / 2; r.position.set(x, 0.1, z); g.add(r); }
    const box = new THREE.Mesh(cg, gold); box.position.y = -0.6; g.add(box); const l = glow(i % 2 ? 0xff7799 : 0x88e0ff, 0.9); l.position.y = 0.45; g.add(l);
    scene.add(g); fx.drones.push({ g, l, r: 14.5 + (i % 3) * 1.6, y: 6 + (i % 4) * 1.4, sp: (i % 2 ? 1 : -1) * (0.12 + i * 0.015), a: i * 0.9 }); }

  // ---- satellites ----
  fx.sats = [];
  const panelTex = canvasTex(64, 32, (x, w, h) => { x.fillStyle = '#3b2f7a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#c9b6ff'; x.lineWidth = 1; for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * 8, 0); x.lineTo(i * 8, h); x.stroke(); } for (let j = 0; j <= 4; j++) { x.beginPath(); x.moveTo(0, j * 8); x.lineTo(w, j * 8); x.stroke(); } });
  const panelM = new THREE.MeshStandardMaterial({ map: panelTex, metalness: 0.6, roughness: 0.25, side: THREE.DoubleSide, emissive: 0x231a4a });
  for (let i = 0; i < 2; i++) { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.8), gold));
    for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.6), panelM); p.position.x = sx * 2.9; g.add(p); }
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 8, 0, Math.PI * 2, 0, 1.0), white); dish.position.z = 1.2; dish.rotation.x = Math.PI / 2; g.add(dish);
    const bl = glow(0xff4466, 1.2); bl.position.y = 0.9; g.add(bl); g.scale.setScalar(1.3); scene.add(g); fx.sats.push({ g, bl, r: 52 + i * 14, inc: 0.35 - i * 0.7, a: i * 2.8, sp: 0.03 - i * 0.012 }); }

  // ---- shooting stars ----
  fx.meteors = []; const mtex = new THREE.CanvasTexture(streakTex());
  for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(26, 0.35), new THREE.MeshBasicMaterial({ map: mtex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, opacity: 0 })); scene.add(m); fx.meteors.push({ m, t0: -10, dir: new THREE.Vector3(), p0: new THREE.Vector3(), period: 5 + i * 2.7, off: i * 1.9 }); }

  // ---- distant starship crossing ----
  { const g = new THREE.Group(), hull = new THREE.MeshStandardMaterial({ color: 0xe8e2ec, metalness: 0.5, roughness: 0.35 });
    const b = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2.4, 22, 12), hull); b.rotation.z = Math.PI / 2; g.add(b);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.2, 6, 12), hull); nose.rotation.z = -Math.PI / 2; nose.position.x = 14; g.add(nose);
    for (const sz of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 5), gold); w.position.set(-6, 0, sz * 3.6); g.add(w); }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.35, 8, 32), gold); ring.rotation.y = Math.PI / 2; ring.position.x = -3; g.add(ring);
    for (const sz of [-1.3, 0, 1.3]) { const e = glow(0xd9a8ff, 5.5); e.position.set(-12, 0, sz); g.add(e); }
    for (let k = 0; k < 6; k++) { const l = glow(0xfff2c0, 0.9); l.position.set(-8 + k * 3.5, 1.4, 0); g.add(l); }
    g.scale.setScalar(0.9); g.traverse(o => o.isSprite && (o.material.opacity = 0.5)); scene.add(g); fx.ship = g; }

  // ---- pearl light rays (billboard) ----
  { const t = canvasTex(256, 256, (x, w) => { x.translate(128, 128); for (let i = 0; i < 28; i++) { x.rotate(Math.PI * 2 / 28 + (i % 3) * 0.02); const len = 70 + (i * 53 % 58), g = x.createLinearGradient(0, 0, len, 0); g.addColorStop(0, 'rgba(255,240,255,.55)'); g.addColorStop(1, 'rgba(255,220,255,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(0, -3 - (i % 4)); x.lineTo(len, 0); x.lineTo(0, 3 + (i % 4)); x.fill(); } });
    t.colorSpace = THREE.NoColorSpace;
    fx.rays = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, color: 0xf6d6ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })); fx.rays.scale.setScalar(36); fx.rays.position.copy(s.pearl.position); fx.rays.renderOrder = -0.5; s.hub.add(fx.rays);
    fx.inner = glow(0xffe8ff, 17, 0.55); fx.inner.position.copy(s.pearl.position); s.hub.add(fx.inner); }

  const v = new THREE.Vector3(), nxt = new THREE.Vector3();
  fx.update = (dt, t) => {
    fx.starsMid.rotation.y = t * 0.006; fx.starsBright.rotation.y = -t * 0.002; fx.dust.rotation.y = t * 0.02; fx.dust.position.y = Math.sin(t * 0.2) * 0.6;
    fx.planet.rotation.y = t * 0.01; fx.moon.rotation.y = t * 0.03;
    for (const sh of fx.shuttles) { const T = t + sh.off, cyc = Math.floor(T / sh.period), ph = (T / sh.period) % 1;
      flightPos(sh, ph, cyc, v); flightPos(sh, Math.min(ph + 0.004, 0.999), cyc, nxt); sh.g.position.copy(v);
      const docked = ph >= 0.42 && ph < 0.58, spd = v.distanceTo(nxt);
      if (spd > 1e-4) sh.g.lookAt(nxt); else { const d = podDocks[(sh.seed + cyc * 5) % podDocks.length]; sh.g.lookAt(nxt.copy(v).sub(d.out)); }
      sh.trail.scale.set(1, docked ? 0.01 : 1.2 + Math.min(spd * 12, 3), 1); sh.trail.material.opacity = docked ? 0 : 0.35; sh.eng.scale.setScalar(docked ? 0.6 : 1.6 + Math.sin(t * 30) * 0.15); }
    for (const d of fx.drones) { d.a += dt * d.sp; d.g.position.set(Math.sin(d.a) * d.r, d.y + Math.sin(t * 1.3 + d.a * 3) * 0.3, Math.cos(d.a) * d.r); d.g.rotation.y = d.a + (d.sp > 0 ? Math.PI / 2 : -Math.PI / 2); d.l.material.opacity = (Math.sin(t * 6 + d.a * 10) > 0.4) ? 1 : 0.2; }
    for (const st of fx.sats) { st.a += dt * st.sp; const x = Math.cos(st.a) * st.r, z = Math.sin(st.a) * st.r; st.g.position.set(x, 12 + z * Math.sin(st.inc), z * Math.cos(st.inc)); st.g.rotation.y = -st.a; st.g.rotation.z = t * 0.05; st.bl.material.opacity = (t * 1.1 + st.a) % 1 < 0.15 ? 1 : 0.1; }
    for (const m of fx.meteors) { const k = Math.floor((t + m.off) / m.period), age = (t + m.off) % m.period;
      if (m.k !== k) { m.k = k; const r = Math.sin(k * 12.9898 + m.off * 78.2) * 43758.5453, rr = r - Math.floor(r); const a = rr * 6.28; m.p0.set(Math.sin(a) * 220, 70 + rr * 90, Math.cos(a) * 220 - 60); m.dir.set(-Math.cos(a) * 0.4 + 0.5, -0.45, Math.sin(a) * 0.4 + 0.3).normalize(); }
      const life = 1.3, on = age < life; m.m.material.opacity = on ? Math.sin(age / life * Math.PI) : 0;
      if (on) { m.m.position.copy(m.p0).addScaledVector(m.dir, age * 120); m.m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), m.dir); m.m.lookAt(ctx.camera.position); m.m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), m.dir); } }
    { const T = ((t * 0.012 + 0.35) % 1), x = -260 + T * 520; fx.ship.position.set(x, 80 + Math.sin(T * 3) * 6, -260 + T * 40); fx.ship.rotation.y = -0.08; }
    fx.rays.material.rotation = t * 0.02; fx.rays.material.opacity = 0.45 + Math.sin(t * 0.7) * 0.1; fx.inner.material.opacity = 0.45 + Math.sin(t * 0.9) * 0.1;
    fx.rays.position.y = fx.inner.position.y = s.pearl.position.y;
  };
  return fx;
}
