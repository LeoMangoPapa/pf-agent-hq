// Hội An extras: boats, fireflies, original pentatonic music (WebAudio, off by default), click-a-floor camera fly.
import * as THREE from 'three';
export const SCALE = [261.63, 293.66, 349.23, 392.0, 440.0, 523.25, 587.33, 698.46, 783.99, 880.0]; // C D F G A (ngũ cung)
export const MEL = [[0, 4], [1, 5], [1.5, 4], [2, 3], [3, 2], [4, 3], [5, 4], [6, 6], [7, 5], [8, 4], [9, 3], [9.5, 2], [10, 1], [11, 2], [12, 0], [13, 1], [14, 2], [15, 0]];
export const BEAT = 60 / 76, BAR = 16;

export function makeBoat(T, mat, lantern, par, x, z, ry, sc) {
  const g = new T.Group(); g.position.set(x, -0.55, z); g.rotation.y = ry; g.scale.setScalar(sc); par.add(g);
  const hullM = mat(0x8a5a32, { roughness: 0.6 }), bandM = mat(0x2E3A87), redM = mat(0xC8102E);
  const sh = new T.Shape(); sh.moveTo(-2.4, 0.5); sh.quadraticCurveTo(-1.2, -0.25, 0, -0.25); sh.quadraticCurveTo(1.2, -0.25, 2.4, 0.5); sh.lineTo(-2.4, 0.5);
  const hull = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 1.1, bevelEnabled: false }), hullM); hull.position.z = -0.55; hull.castShadow = true; g.add(hull);
  const band = new T.Mesh(new T.BoxGeometry(4.2, 0.12, 1.14), bandM); band.position.y = 0.42; g.add(band);
  for (const sx of [-2.1, 2.1]) { const eye = new T.Mesh(new T.CircleGeometry(0.11, 10), redM); eye.position.set(sx, 0.25, 0.56); g.add(eye); }
  const roof = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 1.5, 12, 1, true, 0, Math.PI), mat(0x7a5a32, { side: T.DoubleSide, roughness: 0.9 })); roof.rotation.z = Math.PI / 2; roof.position.y = 0.55; g.add(roof);
  const pole = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 1.4, 5), hullM); pole.position.set(1.8, 1.1, 0); g.add(pole);
  lantern(g, 1.8, 1.8, 0, 0xC8102E, 0.45, 0.15);
  const pl = new T.PointLight(0xffa048, 8, 9, 1.4); pl.position.set(1.2, 1.4, 0.6); g.add(pl);
  return g;
}

export function fireflies(T, scene, n = 140) {
  const pos = new Float32Array(n * 3), seed = [];
  for (let i = 0; i < n; i++) { const river = i < n * 0.6, x = river ? -60 + Math.random() * 120 : (Math.random() < 0.5 ? -1 : 1) * (22 + Math.random() * 40), z = river ? 26 + Math.random() * 22 : -4 + Math.random() * 28, y = 0.6 + Math.random() * (river ? 3.5 : 9);
    seed.push([x, y, z, Math.random() * 6.3, 0.4 + Math.random() * 0.8]); pos.set([x, y, z], i * 3); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
  const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,210,1)'); gr.addColorStop(0.3, 'rgba(220,255,120,.7)'); gr.addColorStop(1, 'rgba(180,255,80,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
  const m = new T.PointsMaterial({ size: 0.9, map: new T.CanvasTexture(c), transparent: true, depthWrite: false, blending: T.AdditiveBlending, color: 0xeaff9a });
  const p = new T.Points(g, m); scene.add(p);
  return t => { const a = g.attributes.position.array; seed.forEach(([x, y, z, ph, sp], i) => { a[i * 3] = x + Math.sin(t * 0.3 * sp + ph) * 1.6; a[i * 3 + 1] = y + Math.sin(t * 0.7 * sp + ph * 2) * 0.5; a[i * 3 + 2] = z + Math.cos(t * 0.25 * sp + ph) * 1.4; }); g.attributes.position.needsUpdate = true; m.opacity = 0.75 + Math.sin(t * 3.1) * 0.25; };
}

// soft plucked-zither loop; created on first user click (autoplay policy), off by default
export function music() {
  let ac = null, master = null, timer = null, next = 0, step = 0;
  function pluck(t, f, bend) {
    const g = ac.createGain(); g.connect(master); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    for (const [h, a, type] of [[1, 1, 'triangle'], [2, 0.35, 'sine'], [3, 0.12, 'sine']]) { const o = ac.createOscillator(), og = ac.createGain(); o.type = type; og.gain.value = a; o.connect(og).connect(g);
      if (bend) { o.frequency.setValueAtTime(f * h * 0.944, t); o.frequency.linearRampToValueAtTime(f * h, t + 0.14); o.frequency.setValueAtTime(f * h, t + 0.9); o.frequency.linearRampToValueAtTime(f * h * 1.012, t + 1.6); } else o.frequency.setValueAtTime(f * h, t);
      o.start(t); o.stop(t + 2.5); }
  }
  function drone() { for (const [f, a] of [[130.81, 0.035], [196.0, 0.022]]) { const o = ac.createOscillator(), g = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.value = a; l.frequency.value = 0.08; lg.gain.value = a * 0.6; l.connect(lg).connect(g.gain); o.connect(g).connect(master); o.start(); l.start(); } }
  function sched() { while (next < ac.currentTime + 0.3) { const bar = Math.floor(step / MEL.length), [b, n] = MEL[step % MEL.length]; const t0 = bar * BAR * BEAT + b * BEAT; pluck(start + t0, SCALE[n], n % 3 === 0); step++; const [b2] = MEL[step % MEL.length]; next = start + Math.floor(step / MEL.length) * BAR * BEAT + b2 * BEAT; } }
  let start = 0;
  return { on: false, toggle() {
    if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = 0; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; master.connect(lp).connect(ac.destination); drone(); start = next = ac.currentTime + 0.1; timer = setInterval(sched, 100); }
    this.on = !this.on; ac.resume(); master.gain.setTargetAtTime(this.on ? 0.6 : 0, ac.currentTime, 0.4); return this.on; } };
}
