// Theme "Ngọc trai vũ trụ": white-gold space station around an iridescent pearl core.
import * as THREE from 'three';
import { createFX } from './ngoc-trai-fx.js';
import { createFlagship } from './flagship.js';

const POD_R = 21, POD_W = 3.0, POD_L = 3.8, HUB_IN = 7.6, HUB_OUT = 12.2, PEARL_R = 6.0, PEARL_Y = 5.4;
const Y = 0.12; // pod floor height (local)

function nebulaMat() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vD;
      float h(vec3 p){ p=fract(p*0.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
      float n(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
        return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
      float fbm(vec3 p){ float a=.5, s=0.; for(int k=0;k<5;k++){ s+=a*n(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=.5; } return s; }
      void main(){
        vec3 d = normalize(vD);
        float c = fbm(d*2.4), c2 = fbm(d*5.0+vec3(4.)), w = fbm(d*1.3+vec3(c*1.6));
        vec3 deep = vec3(.20,.10,.36), lav = vec3(.60,.42,.84), pink = vec3(.99,.62,.88), cream = vec3(1.,.86,.96);
        vec3 col = mix(deep, lav, smoothstep(.38,.68,w));
        col = mix(col, pink, smoothstep(.42,.78,c*w*1.6) * .9);
        float lane = smoothstep(.55,.75,fbm(d*3.1+vec3(7.)));
        col *= 1. - lane*.35;
        col = mix(col, cream, smoothstep(.62,.95,c2*c*1.9) * .45);
        col *= .78 + .22*smoothstep(-.6,.4,d.y);
        gl_FragColor = vec4(col,1.);
      }`
  });
}
function pearlMat() {
  return new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){ vec4 wp = modelMatrix*vec4(position,1.); vP = position; vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition-wp.xyz); gl_Position = projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `uniform float uT; varying vec3 vN; varying vec3 vV; varying vec3 vP;
      float h(vec3 p){ p=fract(p*0.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
      float n(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
        return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
      void main(){
        vec3 N = normalize(vN), V = normalize(vV);
        float nv = clamp(dot(N,V),0.,1.), fr = pow(1.-nv, 2.2);
        vec3 p = vP*0.32;
        float sw = n(p + vec3(uT*.07, uT*.05, -uT*.06)) + .5*n(p*2.3 - vec3(uT*.11));
        float film = sw*1.1 + nv*1.4 + uT*.035;
        vec3 irid = .5 + .5*cos(6.2832*(film + vec3(0.,.33,.67)));
        vec3 base = vec3(1.,.92,.98);
        vec3 col = mix(base, mix(irid, vec3(1.,.9,1.), .12), .62 + .25*fr);
        vec3 L = normalize(vec3(-.4,.8,.5)); float spec = pow(max(dot(reflect(-L,N),V),0.),48.);
        col *= .62 + .3*nv; col += fr*vec3(.9,.7,1.)*.55 + spec*.9;
        gl_FragColor = vec4(col*.95, 1.);
      }`
  });
}
function fresnelMat(color, power, strength) {
  return new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(color) }, uS: { value: strength } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 wp = modelMatrix*vec4(position,1.); vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition-wp.xyz); gl_Position = projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `uniform vec3 uC; uniform float uS; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.-abs(dot(normalize(vN),normalize(vV))), ${power.toFixed(1)}); gl_FragColor = vec4(uC*f*uS, 1.); }`
  });
}

export const theme = {
  id: 'ngoc-trai', name: 'Ngọc trai vũ trụ',
  home: new THREE.Vector3(0, 46, 50), homeMobile: new THREE.Vector3(0, 100, 52), target: new THREE.Vector3(0, 0, 1),
  controls: { maxPolarAngle: 1.45, minDistance: 10, maxDistance: 160 },
  exposure: 0.95, bloom: [0.32, 0.45, 0.97], vignette: 0.42, css: 'body.theme-ngoc-trai{font-family:"Avenir Next","Segoe UI",system-ui,sans-serif;color:#f7eefc;background:#140a26}.theme-ngoc-trai .glass{background:linear-gradient(135deg,rgba(255,255,255,.13),rgba(200,170,255,.06)) ,rgba(28,16,48,.55);border:1px solid rgba(238,206,140,.42);box-shadow:0 10px 34px rgba(10,0,30,.45),inset 0 1px 0 rgba(255,255,255,.18);backdrop-filter:blur(14px) saturate(1.3);-webkit-backdrop-filter:blur(14px) saturate(1.3);border-radius:16px}.theme-ngoc-trai .brand b{font-family:Georgia,"Times New Roman",serif;font-weight:600;letter-spacing:.6px;font-size:16px;background:linear-gradient(90deg,#fff6e0,#f2cf86,#fff);-webkit-background-clip:text;background-clip:text;color:transparent}.theme-ngoc-trai .brand small{color:#d9c6ef;letter-spacing:.4px}.theme-ngoc-trai .brand .dot{width:14px;height:14px;background:radial-gradient(circle at 35% 30%,#fff,#f6d9ff 35%,#b9a2ff 70%,#e9b8ff);box-shadow:0 0 14px #f3d0ff,0 0 4px #fff}.theme-ngoc-trai .pill,.theme-ngoc-trai .note{color:#efe4fb}.theme-ngoc-trai .note.ok{color:#c8f5d8}.theme-ngoc-trai #btn-task,.theme-ngoc-trai #btn-blk,.theme-ngoc-trai #btn-q{color:#fff7e6;border-color:rgba(238,206,140,.6)}.theme-ngoc-trai #btn-task{background:linear-gradient(135deg,rgba(242,207,134,.35),rgba(255,255,255,.08)),rgba(28,16,48,.55)}#btn-q{padding:9px 12px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;color:#fff}.theme-ngoc-trai .card .hd{font-family:Georgia,serif;letter-spacing:.4px;color:#fbefd6}.theme-ngoc-trai .card .hd:after{color:#e8c77f}.theme-ngoc-trai #act-list li{border-top-color:rgba(238,206,140,.16);color:#e1d5f0}.theme-ngoc-trai #act-list li em{color:#b9a7d4}.theme-ngoc-trai .zb button{background:rgba(255,255,255,.08);border-color:rgba(238,206,140,.45);color:#fbefd6}.theme-ngoc-trai .room-label{background:linear-gradient(135deg,rgba(80,46,120,.85),rgba(28,14,52,.88));border:1px solid rgba(238,206,140,.5);border-left:3px solid var(--c);backdrop-filter:blur(8px);box-shadow:0 6px 20px rgba(20,0,40,.5)}.theme-ngoc-trai .room-label b{font-family:Georgia,serif;letter-spacing:.3px;color:#fff8ea}.theme-ngoc-trai .room-label small{color:#dccbf0}.theme-ngoc-trai .bot-label{background:rgba(30,18,52,.72);border:1px solid rgba(238,206,140,.35);color:#f4eafc}.theme-ngoc-trai .brain-label{background:linear-gradient(135deg,rgba(90,50,130,.85),rgba(30,14,56,.88));border:1px solid rgba(242,207,134,.75);box-shadow:0 0 26px rgba(243,208,255,.45);backdrop-filter:blur(8px)}.theme-ngoc-trai .brain-label b{color:#fff3d2;font-family:Georgia,serif;letter-spacing:3px}.theme-ngoc-trai .brain-label span{color:#ecdcff}.theme-ngoc-trai #task select,.theme-ngoc-trai #task textarea{background:rgba(20,10,38,.7);border-color:rgba(238,206,140,.35);color:#fbf4ff}.theme-ngoc-trai #tk-send{background:linear-gradient(135deg,#f2cf86,#e6a6ff);color:#2a1440}.theme-ngoc-trai #task h4{border-top-color:rgba(238,206,140,.25);font-family:Georgia,serif;color:#fbefd6}.theme-ngoc-trai #loading{color:#f3d0ff;font-family:Georgia,serif;letter-spacing:2px;background:radial-gradient(circle,#3a2160,#140a26)}', mapRadius: 26, mapCore: '#f3d7ff', mapLine: '#5a4a6e', farDist: 75,
  walkPaths: [], s: {},

  init(ctx) {
    const { scene, renderer, canvasTex, MOBILE, QUALITY } = ctx, s = this.s;
    scene.background = new THREE.Color(0x241640);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 48, 24), nebulaMat()); sky.renderOrder = -1; scene.add(sky); s.sky = sky;
    // starfield
    { const N = QUALITY === 'low' ? 1500 : 3500, p = new Float32Array(N * 3), c = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(420 + Math.random() * 120); p.set([v.x, v.y, v.z], i * 3); const w = 0.6 + Math.random() * 0.6; c.set([w, w * (0.85 + Math.random() * 0.15), w], i * 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
      const dot = canvasTex(32, 32, (x, w) => { const r = x.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, '#fff'); r.addColorStop(0.3, 'rgba(255,240,255,.6)'); r.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = r; x.fillRect(0, 0, w, w); });
      s.stars = new THREE.Points(g, new THREE.PointsMaterial({ size: 2.4, map: dot, vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true }));
      scene.add(s.stars); }
    // environment for metals: lavender / pink / white bands
    { const pm = new THREE.PMREMGenerator(renderer), es = canvasTex(64, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#fff6ff'); g.addColorStop(0.3, '#e6c6f0'); g.addColorStop(0.5, '#fff1d6'); g.addColorStop(0.62, '#9d7fc4'); g.addColorStop(1, '#3a2758'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
      es.mapping = THREE.EquirectangularReflectionMapping; scene.environment = pm.fromEquirectangular(es).texture; }
    scene.add(new THREE.HemisphereLight(0xfff0ff, 0x5a3f7f, 0.75));
    const sun = new THREE.DirectionalLight(0xfff3e6, 1.7); sun.position.set(-20, 40, 26); sun.castShadow = true;
    const sm = MOBILE ? 1024 : 2048; sun.shadow.mapSize.set(sm, sm);
    Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 100 });
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03; scene.add(sun);
    const rim = new THREE.DirectionalLight(0xf0b8ff, 0.8); rim.position.set(25, 10, -30); scene.add(rim);

    // materials
    s.white = new THREE.MeshPhysicalMaterial({ color: 0xe9e2e6, roughness: 0.3, metalness: 0.0, clearcoat: 0.8, clearcoatRoughness: 0.15, envMapIntensity: 0.9 });
    s.gold = new THREE.MeshStandardMaterial({ color: 0xe0b45c, roughness: 0.28, metalness: 1.0, envMapIntensity: 1.3 });
    s.goldDim = new THREE.MeshStandardMaterial({ color: 0xb98a3e, roughness: 0.4, metalness: 1.0, envMapIntensity: 1.1 });
    s.floor = new THREE.MeshStandardMaterial({ color: 0xece4de, roughness: 0.55, map: canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#efe7e1'; x.fillRect(0, 0, w, h); x.strokeStyle = '#d7c9bd'; x.lineWidth = 2; for (let k = 0; k <= 8; k++) { x.beginPath(); x.moveTo(k * 32, 0); x.lineTo(k * 32, h); x.stroke(); x.beginPath(); x.moveTo(0, k * 32); x.lineTo(w, k * 32); x.stroke(); } }) });
    s.floor.map.wrapS = s.floor.map.wrapT = THREE.RepeatWrapping;
    this.buildHub(ctx);
    this.buildAsteroids(ctx);
    s.flagship = createFlagship(ctx, s);
  },

  buildHub(ctx) {
    const { scene, label, MOBILE } = ctx, s = this.s;
    const hub = new THREE.Group(); scene.add(hub); s.hub = hub;
    // deck annulus
    const sh = new THREE.Shape(); sh.absarc(0, 0, HUB_OUT, 0, Math.PI * 2, false); const hole = new THREE.Path(); hole.absarc(0, 0, HUB_IN, 0, Math.PI * 2, true); sh.holes.push(hole);
    const deck = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 1.0, bevelEnabled: true, bevelSize: 0.2, bevelThickness: 0.2, bevelSegments: 3, curveSegments: 96 }), s.white);
    deck.rotation.x = -Math.PI / 2; deck.position.y = -1.0 + Y; deck.receiveShadow = deck.castShadow = true; hub.add(deck);
    const T = (r, tube, y, mat, seg = 128) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 16, seg), mat); m.rotation.x = Math.PI / 2; m.position.y = y; m.castShadow = true; hub.add(m); return m; };
    s.mainRing = T(9.8, 0.55, 1.15, s.gold);            // the gold ring around the pearl
    T(9.8, 0.16, 2.0, s.goldDim); T(HUB_OUT + 0.15, 0.22, Y + 0.1, s.gold); T(HUB_IN - 0.1, 0.25, Y + 0.05, s.gold);
    // posts on the main ring
    const pg = new THREE.CylinderGeometry(0.12, 0.16, 1.4, 8);
    for (let k = 0; k < 34; k++) { const a = k / 34 * Math.PI * 2, p = new THREE.Mesh(pg, s.goldDim); p.position.set(Math.sin(a) * 9.8, 0.75, Math.cos(a) * 9.8); hub.add(p); }
    // stacked rings under the station (engine levels)
    [[7.6, -1.6], [6.4, -2.8], [5.0, -3.9], [3.4, -4.8]].forEach(([r, y], k) => { T(r, 0.35, y, k % 2 ? s.goldDim : s.gold, 96); const d = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.2, r - 0.6, 0.9, 64), s.white); d.position.y = y - 0.3; hub.add(d); });
    const glowRing = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.18, 12, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.2, 2.0) })); glowRing.rotation.x = Math.PI / 2; glowRing.position.y = -5.6; hub.add(glowRing);
    // pearl cradle
    const cradle = new THREE.Mesh(new THREE.SphereGeometry(PEARL_R * 0.78, 48, 16, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38), s.gold); cradle.position.y = PEARL_Y - 0.8; hub.add(cradle);
    // the pearl
    s.pearlMat = pearlMat();
    s.pearl = new THREE.Mesh(new THREE.SphereGeometry(PEARL_R, 96, 64), s.pearlMat); s.pearl.position.y = PEARL_Y; hub.add(s.pearl);
    s.halo = new THREE.Mesh(new THREE.SphereGeometry(PEARL_R * 1.12, 64, 32), fresnelMat(0xf2c8ff, 2.8, 0.55)); s.halo.position.y = PEARL_Y; hub.add(s.halo);
    s.pearlLight = new THREE.PointLight(0xf4d8ff, MOBILE ? 14 : 20, 30, 1.6); s.pearlLight.position.y = PEARL_Y; hub.add(s.pearlLight);
    // sparkle motes around the pearl
    s.motes = [];
    const mg = new THREE.SphereGeometry(0.06, 6, 4), mm = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.9, 2.4) });
    for (let i = 0; i < 36; i++) { const m = new THREE.Mesh(mg, mm); m.userData = { r: PEARL_R + 0.8 + Math.random() * 2.2, a: Math.random() * 6.28, y: PEARL_Y - 3 + Math.random() * 6, sp: 0.1 + Math.random() * 0.3 }; hub.add(m); s.motes.push(m); }
    const bl = label('<b>NGỌC TRAI · BỘ NÃO</b><span>Captain điều phối · bộ nhớ chung</span>', 'brain-label');
    bl.position.set(0, 1.2, MOBILE ? 9 : HUB_OUT + 0.8); hub.add(bl);
  },

  buildPod(ctx, parent, accent) {
    const s = this.s, g = new THREE.Group(); parent.add(g);
    const CUT = 0.43 * Math.PI, CY = 1.15, SY = 2.3;
    // egg bowl (lower part), open on top
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, CUT, Math.PI - CUT), s.white);
    bowl.scale.set(POD_W + 0.15, SY, POD_L + 0.15); bowl.position.y = CY; bowl.material.side = THREE.DoubleSide; bowl.castShadow = bowl.receiveShadow = true; g.add(bowl);
    // hood over the outer end (egg top), leaves the front open
    const hood = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 16, Math.PI * 1.18, Math.PI * 0.64, 0.16 * Math.PI, CUT - 0.16 * Math.PI), s.white);
    hood.scale.set(POD_W + 0.15, SY * 1.25, POD_L + 0.15); hood.position.y = CY; hood.castShadow = true; g.add(hood);
    const rimR = Math.sin(CUT), rimY = CY + Math.cos(CUT) * SY;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.075, 8, 96), s.gold); rim.rotation.x = Math.PI / 2; rim.scale.set((POD_W + 0.15) * rimR, (POD_L + 0.15) * rimR, 1); rim.position.y = rimY; g.add(rim);
    const band = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 8, 96), s.gold); band.rotation.x = Math.PI / 2; band.scale.set(POD_W + 0.2, POD_L + 0.2, 1); band.position.y = CY - 0.55; g.add(band);
    // gold ribs on the hood
    for (const ph of [Math.PI * 1.32, Math.PI * 1.5, Math.PI * 1.68]) {
      const pts = []; for (let k = 0; k <= 16; k++) { const th = 0.16 * Math.PI + (CUT - 0.16 * Math.PI) * k / 16; pts.push(new THREE.Vector3(-Math.cos(ph) * Math.sin(th) * (POD_W + 0.2), CY + Math.cos(th) * SY * 1.25, Math.sin(ph) * Math.sin(th) * (POD_L + 0.2))); }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.05, 6), s.gold));
    }
    // glass canopy over the opening (bots stay visible)
    s.glass ||= new THREE.MeshPhysicalMaterial({ color: 0xf4ecff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.1, envMapIntensity: 1.6, depthWrite: false, clearcoat: 1 });
    s.glassRim ||= fresnelMat(0xf6e2ff, 3.0, 0.45);
    const capG = new THREE.SphereGeometry(1, 40, 14, 0, Math.PI * 2, 0, CUT);
    for (const m of [s.glass, s.glassRim]) { const cap = new THREE.Mesh(capG, m); cap.scale.set(POD_W + 0.12, SY * 0.95, POD_L + 0.12); cap.position.y = CY + 0.02; cap.renderOrder = 4; g.add(cap); }
    for (const ph of [0, Math.PI / 2]) { const pts = []; for (let k = 0; k <= 20; k++) { const th = -CUT + 2 * CUT * k / 20; pts.push(new THREE.Vector3(Math.sin(th) * Math.cos(ph) * (POD_W + 0.15), CY + Math.cos(th) * SY * 0.95, Math.sin(th) * Math.sin(ph) * (POD_L + 0.15))); }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.035, 5), s.gold)); }
    // floor + accent light strip in team colour
    const fl = new THREE.Mesh(new THREE.CircleGeometry(1, 48), s.floor); fl.rotation.x = -Math.PI / 2; fl.scale.set(POD_W - 0.15, POD_L - 0.15, 1); fl.position.y = Y; fl.receiveShadow = true; g.add(fl);
    const strip = new THREE.Mesh(new THREE.TorusGeometry(1, 0.035, 6, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(accent).multiplyScalar(1.5) })); strip.rotation.x = Math.PI / 2; strip.scale.set(POD_W - 0.25, POD_L - 0.25, 1); strip.position.y = Y + 0.03; g.add(strip);
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 16), s.gold); fin.rotation.x = Math.PI; fin.position.y = CY - SY - 0.4; g.add(fin);
    return g;
  },

  buildRooms(ctx, ROOMS) {
    const { scene, put, label, screenTexture, makeBot, rooms, MOBILE } = ctx, s = this.s;
    const total = ROOMS.reduce((n, R) => n + R.bots.length, 0);
    let k = 0;
    const bridgeM = s.white, railG = new THREE.CylinderGeometry(0.07, 0.07, 1, 6);
    ROOMS.forEach((R, ri) => {
      const room = { def: R, bots: [], map: [0, 0] }; const mid = (R.bots.length - 1) / 2;
      R.bots.forEach((name, i) => {
        const a = (k + 0.5) / total * Math.PI * 2 + Math.PI; k++;
        const g = new THREE.Group(); g.position.set(Math.sin(a) * POD_R, 0, Math.cos(a) * POD_R); g.rotation.y = a + Math.PI; scene.add(g);
        this.buildPod(ctx, g, R.color);
        // desk at the outer end, facing the pearl
        const dz = -1.55;
        put('desk', g, 0, Y, dz, Math.PI);
        const screens = [];
        for (const sx of [-0.42, 0.42]) {
          const sc = put('computerScreen', g, sx, Y + 1.03, dz - 0.15, (sx > 0 ? -0.2 : 0.2));
          const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.6), new THREE.MeshBasicMaterial({ map: screenTexture(R.color, i * 2 + (sx > 0)), color: 0xffffff }));
          glow.position.set(0, 0.42, 0.08); sc.add(glow); screens.push(glow);
        }
        put('computerKeyboard', g, 0, Y + 1.03, dz + 0.22, Math.PI);
        put('chairDesk', g, 0, Y, dz + 1.0, 0);
        put('loungeSofaLong', g, -1.85, Y, 1.15, Math.PI / 2, 2.0);
        put('plantSmall1', g, 1.9, Y, -1.4);
        const seat = {
          floorY: Y,
          desk: { p: new THREE.Vector3(0, Y + 0.38, dz + 0.95), ry: Math.PI, approach: new THREE.Vector3(0, Y, dz + 1.9) },
          sofa: { p: new THREE.Vector3(-1.85 + 0.12, Y + 0.3, 1.15), ry: Math.PI / 2, approach: new THREE.Vector3(-0.6, Y, 1.15) },
        };
        makeBot(name, room, g, seat, screens);
        (s.docks ||= []).push({ p: new THREE.Vector3(Math.sin(a) * (POD_R + POD_L + 1.6), 1.6, Math.cos(a) * (POD_R + POD_L + 1.6)), out: new THREE.Vector3(Math.sin(a), 0, Math.cos(a)) });
        // bridge from hub to pod
        const br = new THREE.Group(); br.rotation.y = a; scene.add(br);
        const L = POD_R - POD_L - HUB_OUT + 0.6, mz = HUB_OUT - 0.3 + L / 2;
        const slab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.35, L), bridgeM); slab.position.set(0, Y - 0.2, mz); slab.receiveShadow = slab.castShadow = true; br.add(slab);
        for (const sx of [-0.78, 0.78]) {
          const rail = new THREE.Mesh(railG, s.gold); rail.rotation.x = Math.PI / 2; rail.scale.y = L; rail.position.set(sx, Y + 0.65, mz); br.add(rail);
          for (let q = 0; q <= 3; q++) { const post = new THREE.Mesh(railG, s.goldDim); post.scale.y = 0.65; post.position.set(sx, Y + 0.33, mz - L / 2 + q * L / 3); br.add(post); }
        }
        const under = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, L * 0.9), s.goldDim); under.position.set(0, Y - 0.55, mz); br.add(under);
        if (i === Math.round(mid)) {
          room.map = [Math.sin(a) * POD_R, Math.cos(a) * POD_R];
          const lab = label('', 'room-label'); lab.position.set(0, MOBILE ? 3 : 4.0, -POD_L - 0.6); g.add(lab); room.label = lab;
          lab.element.style.setProperty('--c', '#' + new THREE.Color(R.color).getHexString());
        }
        if ((k % 4) === 1 && this.walkPaths.length < 5) this.walkPaths.push([new THREE.Vector3(Math.sin(a) * (HUB_OUT + 0.4), Y, Math.cos(a) * (HUB_OUT + 0.4)), new THREE.Vector3(Math.sin(a) * (POD_R - POD_L - 0.2), Y, Math.cos(a) * (POD_R - POD_L - 0.2))]);
      });
      rooms.push(room);
    });
    s.fx = createFX(ctx, s, s.docks);
  },

  buildAsteroids(ctx) {
    const s = this.s; s.rocks = [];
    const m = new THREE.MeshStandardMaterial({ color: 0x8a8090, roughness: 0.95, flatShading: true });
    const spots = [[-48, -6, 30], [-60, 10, -10], [52, -10, 34], [62, 6, -18], [-30, -14, 52], [40, -16, 50], [-70, -4, 20], [24, 20, -60], [-40, 24, -55], [70, 18, 30], [-18, -20, 60], [10, -22, 64]];
    spots.forEach(([x, y, z], i) => {
      const g = new THREE.IcosahedronGeometry(1, 2), p = g.attributes.position, v = new THREE.Vector3();
      for (let k = 0; k < p.count; k++) { v.fromBufferAttribute(p, k); const f = 1 + 0.28 * Math.sin(v.x * 3.1 + i) * Math.sin(v.y * 2.7 + i * 2) + 0.15 * Math.sin(v.z * 5.3); v.multiplyScalar(f); p.setXYZ(k, v.x, v.y, v.z); }
      g.computeVertexNormals();
      const r = new THREE.Mesh(g, m), sc = 0.8 + (i * 37 % 10) / 10 * 2.2; r.scale.set(sc, sc * 0.8, sc * 1.1); r.position.set(x, y, z);
      r.userData = { sp: new THREE.Vector3(0.05 + i % 3 * 0.03, 0.04, 0.02 * (i % 2 ? 1 : -1)), y0: y, ph: i };
      ctx.scene.add(r); s.rocks.push(r);
    });
  },

  // translucent silver whale: one continuous skinned-on-CPU tube along a moving spine
  buildWhale(ctx) {
    const s = this.s, NS = 64, NR = 24, LEN = 13.5;
    const prof = u => { // radius along body, u=0 head .. 1 tail
      const head = u < 0.16 ? Math.sqrt(Math.max(0, 1 - ((0.16 - u) / 0.16) ** 2)) : 1;
      const tail = 1 - THREE.MathUtils.smoothstep(u, 0.36, 1.0) * 0.93;
      return 2.05 * head * tail + 0.03;
    };
    const pos = new Float32Array(NS * NR * 3), uv = new Float32Array(NS * NR * 2), idx = [];
    for (let i = 0; i < NS; i++) for (let j = 0; j < NR; j++) { uv[(i * NR + j) * 2] = j / NR; uv[(i * NR + j) * 2 + 1] = i / (NS - 1); }
    for (let i = 0; i < NS - 1; i++) for (let j = 0; j < NR; j++) { const a = i * NR + j, b = i * NR + (j + 1) % NR, c = a + NR, d = b + NR; idx.push(a, c, b, b, c, d); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
    const body = new THREE.MeshPhysicalMaterial({ color: 0xdcd6f2, metalness: 0.35, roughness: 0.18, transparent: true, opacity: 0.5, iridescence: 1, iridescenceIOR: 1.6, envMapIntensity: 1.4, depthWrite: false, side: THREE.DoubleSide, emissive: 0x4a3a6a, emissiveIntensity: 0.15 });
    const mesh = new THREE.Mesh(geo, body); mesh.frustumCulled = false; mesh.renderOrder = 2;
    const glow = new THREE.Mesh(geo, fresnelMat(0xe9dcff, 2.2, 0.7)); glow.frustumCulled = false; glow.renderOrder = 3;
    const root = new THREE.Group(); root.add(mesh, glow); ctx.scene.add(root);
    // flukes / fins as flat shapes attached to spine frames
    const finMat = body.clone(); finMat.opacity = 0.45;
    const fs = new THREE.Shape(); fs.moveTo(0, 0); fs.bezierCurveTo(1.2, -0.2, 2.6, -0.9, 3.4, -1.9); fs.bezierCurveTo(2.6, -1.5, 1.6, -1.4, 0.9, -1.25); fs.bezierCurveTo(0.6, -0.9, 0.2, -0.6, 0, -0.4);
    const flukeG = new THREE.ShapeGeometry(fs, 16);
    const mkFluke = sx => { const m = new THREE.Mesh(flukeG, finMat); m.scale.set(sx * 1.5, 1.5, 1); m.rotation.x = -Math.PI / 2; const p = new THREE.Group(); p.add(m); m.position.z = 0.2; root.add(p); const gm = new THREE.Mesh(flukeG, fresnelMat(0xe9dcff, 1.5, 0.5)); gm.scale.copy(m.scale); gm.rotation.copy(m.rotation); gm.position.copy(m.position); p.add(gm); return p; };
    const flukes = [mkFluke(1), mkFluke(-1)];
    const ps = new THREE.Shape(); ps.moveTo(0, 0); ps.bezierCurveTo(1.0, -0.4, 2.8, -1.6, 4.2, -2.9); ps.bezierCurveTo(3.4, -2.4, 1.6, -1.6, 0.2, -1.2); ps.lineTo(0, 0);
    const pecG = new THREE.ShapeGeometry(ps, 16); pecG.scale(0.85, 0.85, 1);
    const mkPec = sx => { const p = new THREE.Group(); const m = new THREE.Mesh(pecG, finMat); m.scale.set(sx, 1, 1); m.rotation.x = -Math.PI / 2; m.rotation.y = sx * -0.5; p.add(m); root.add(p); return p; };
    const pecs = [mkPec(1), mkPec(-1)];
    const eyeM = new THREE.MeshBasicMaterial({ color: 0x3a2a5a }); const eyes = [new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), eyeM), new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), eyeM)]; eyes.forEach(e => root.add(e));
    const P = (u, o = new THREE.Vector3()) => o.set(Math.sin(u) * (36 + Math.sin(u * 2) * 4), 9 + Math.sin(u * 1.5) * 4, Math.cos(u) * (32 + Math.sin(u * 2) * 3));
    const spine = Array.from({ length: NS }, () => new THREE.Vector3()), Tn = [], Sd = [], Up = [];
    for (let i = 0; i < NS; i++) { Tn.push(new THREE.Vector3()); Sd.push(new THREE.Vector3()); Up.push(new THREE.Vector3()); }
    const up = new THREE.Vector3(0, 1, 0), m4 = new THREE.Matrix4();
    s.whale = { root, P, phase: 0,
      update(t) {
        const u0 = t * 0.045 + this.phase, du = LEN / 36 / (NS - 1);
        for (let i = 0; i < NS; i++) { const u = i / (NS - 1); P(u0 - i * du, spine[i]); spine[i].y += Math.sin(u * 5.2 - t * 1.3) * 0.75 * u * u - Math.sin(-t * 1.3) * 0.05; }
        for (let i = 0; i < NS; i++) { const a = spine[Math.max(0, i - 1)], b = spine[Math.min(NS - 1, i + 1)]; Tn[i].subVectors(a, b).normalize(); Sd[i].crossVectors(Tn[i], up).normalize(); Up[i].crossVectors(Sd[i], Tn[i]).normalize(); }
        for (let i = 0; i < NS; i++) {
          const u = i / (NS - 1), r = prof(u), belly = u < 0.5 ? 1 : 1 - (u - 0.5) * 0.6;
          for (let j = 0; j < NR; j++) { const th = j / NR * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th), ry = sn < 0 ? 0.78 * belly : 0.88;
            const o = (i * NR + j) * 3; pos[o] = spine[i].x + Sd[i].x * c * r + Up[i].x * sn * r * ry; pos[o + 1] = spine[i].y + Sd[i].y * c * r + Up[i].y * sn * r * ry; pos[o + 2] = spine[i].z + Sd[i].z * c * r + Up[i].z * sn * r * ry; }
        }
        geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
        const place = (obj, i, off) => { m4.makeBasis(Sd[i], Up[i], Tn[i].clone().negate()); obj.quaternion.setFromRotationMatrix(m4); obj.position.copy(spine[i]); if (off) obj.position.addScaledVector(Sd[i], off[0]).addScaledVector(Up[i], off[1]); };
        const tail = NS - 1; flukes.forEach(f => { place(f, tail - 1); f.rotateX(Math.sin(5.2 - t * 1.3) * 0.25); });
        const pi = Math.round(NS * 0.27), pr = prof(0.27);
        pecs.forEach((p, k) => { place(p, pi, [(k ? -1 : 1) * pr * 0.8, -pr * 0.45]); p.rotateZ((k ? -1 : 1) * (0.35 + Math.sin(t * 0.9) * 0.12)); });
        const ei = Math.round(NS * 0.07), er = prof(0.07);
        eyes.forEach((e, k) => e.position.copy(spine[ei]).addScaledVector(Sd[ei], (k ? -1 : 1) * er * 0.93).addScaledVector(Up[ei], -er * 0.15));
      } };
  },

  update(dt, t) {
    const s = this.s;
    s.pearlMat.uniforms.uT.value = t;
    s.pearl.rotation.y = t * 0.05; s.pearl.position.y = PEARL_Y + Math.sin(t * 0.6) * 0.15; s.halo.position.y = s.pearl.position.y;
    s.pearlLight.intensity = (s.pearlLight.userData.base ??= s.pearlLight.intensity) * (0.92 + Math.sin(t * 0.8) * 0.08);
    s.motes.forEach(m => { const u = m.userData; u.a += dt * u.sp; m.position.set(Math.cos(u.a) * u.r, u.y + Math.sin(t * 0.7 + u.a) * 0.5, Math.sin(u.a) * u.r); });
    s.rocks.forEach(r => { const u = r.userData; r.rotation.x += dt * u.sp.x; r.rotation.y += dt * u.sp.y; r.rotation.z += dt * u.sp.z; r.position.y = u.y0 + Math.sin(t * 0.2 + u.ph) * 0.8; });
    s.stars.rotation.y = t * 0.003; s.sky.rotation.y = t * 0.002;
    s.fx && s.fx.update(dt, t);
    s.flagship.phase = window.__shipPhase ?? s.flagship.phase; s.flagship.update(t, dt);
  },
};
export default theme;
