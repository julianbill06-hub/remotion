// Otto Overkill — shared 3D kit (character, materials, props, helpers).
// Pure functions of time only: no clocks, no Math.random.
import * as THREE from "./lib/three.module.min.js";
export { THREE };

// ---------- math ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const eio = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const eout = (k) => 1 - Math.pow(1 - k, 3);
export const ein = (k) => k * k * k;
export const eback = (k) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
};
// damped spring settle: 0 -> 1 with overshoot
export const spring = (k, f = 3, d = 5) => (k <= 0 ? 0 : 1 - Math.exp(-d * k) * Math.cos(f * Math.PI * k));
export function hash(i) {
  let x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
export const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const lerpV = (a, b, k) => new THREE.Vector3(lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k));

// ---------- materials ----------
const matCache = new Map();
export function mat(color, rough = 0.78, extra = {}) {
  const key = color + "|" + rough + "|" + JSON.stringify(extra);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, ...extra }));
  return matCache.get(key);
}
export function glowMat(color) {
  return new THREE.MeshBasicMaterial({ color, toneMapped: false });
}

// rounded box via bevelled extrusion, centred
export function rbox(w, h, d, r = 0.04, segs = 3) {
  r = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
  const s = new THREE.Shape();
  const x = -w / 2 + r, y = -h / 2 + r, W = w - 2 * r, H = h - 2 * r;
  s.moveTo(x, y);
  s.lineTo(x + W, y);
  s.lineTo(x + W, y + H);
  s.lineTo(x, y + H);
  s.lineTo(x, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, d - 2 * r), bevelEnabled: true, bevelSize: r, bevelThickness: r, bevelSegments: segs, curveSegments: 4 });
  g.translate(0, 0, -(d - 2 * r) / 2);
  g.computeVertexNormals();
  return g;
}
export function mesh(geo, material, { shadow = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = shadow;
  m.receiveShadow = receive;
  return m;
}
export function at(obj, x, y, z) {
  obj.position.set(x, y, z);
  return obj;
}

// ---------- canvas textures ----------
export function canvasTex(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
export const glowTex = canvasTex(128, 128, (g, w, h) => {
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(0.25, "rgba(255,255,255,0.55)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, w, h);
});
export function glowSprite(color, size) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
  s.scale.set(size, size, 1);
  return s;
}

// ---------- Otto ----------
export const PAL = {
  skin: "#f6c29b",
  hair: "#c8521c",
  hoodie: "#ff7a2e",
  hoodieDark: "#e0601a",
  pants: "#2e3d6b",
  shoe: "#f5f5f2",
  sole: "#cfcfcf",
  hat: "#ffc81a",
  ink: "#1d1a22",
};

export function makeOtto() {
  const P = {};
  const root = new THREE.Group();
  const hips = at(new THREE.Group(), 0, 0.9, 0);
  root.add(hips);
  P.root = root;
  P.hips = hips;

  // legs
  for (const side of [1, -1]) {
    const hip = at(new THREE.Group(), 0.16 * side, 0.02, 0);
    const leg = mesh(new THREE.CapsuleGeometry(0.135, 0.56, 4, 12), mat(PAL.pants));
    leg.position.y = -0.36;
    hip.add(leg);
    const shoe = mesh(rbox(0.24, 0.13, 0.36, 0.06), mat(PAL.shoe, 0.6));
    at(shoe, 0, -0.84, 0.05);
    hip.add(shoe);
    const sole = mesh(rbox(0.25, 0.04, 0.37, 0.015), mat(PAL.sole));
    at(sole, 0, -0.9, 0.05);
    hip.add(sole);
    hips.add(hip);
    P[side > 0 ? "legL" : "legR"] = hip;
  }
  // pelvis
  const pelvis = mesh(rbox(0.5, 0.2, 0.32, 0.08), mat(PAL.pants));
  pelvis.position.y = 0.04;
  hips.add(pelvis);

  const spine = new THREE.Group();
  hips.add(spine);
  P.spine = spine;
  const torso = mesh(rbox(0.66, 0.68, 0.4, 0.14), mat(PAL.hoodie));
  torso.position.y = 0.4;
  spine.add(torso);
  const pocket = mesh(rbox(0.4, 0.16, 0.06, 0.03), mat(PAL.hoodieDark));
  at(pocket, 0, 0.26, 0.19);
  spine.add(pocket);
  const hood = mesh(new THREE.TorusGeometry(0.2, 0.07, 8, 20), mat(PAL.hoodieDark));
  hood.rotation.x = Math.PI / 2 - 0.25;
  at(hood, 0, 0.75, -0.04);
  spine.add(hood);
  for (const side of [1, -1]) {
    const str = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 6), mat("#ffffff"));
    at(str, 0.07 * side, 0.62, 0.2);
    spine.add(str);
  }

  // arms
  for (const side of [1, -1]) {
    const sh = at(new THREE.Group(), 0.4 * side, 0.66, 0);
    const upper = mesh(new THREE.CapsuleGeometry(0.1, 0.2, 4, 10), mat(PAL.hoodie));
    upper.position.y = -0.15;
    sh.add(upper);
    const elbow = at(new THREE.Group(), 0, -0.3, 0);
    sh.add(elbow);
    const fore = mesh(new THREE.CapsuleGeometry(0.095, 0.18, 4, 10), mat(PAL.hoodie));
    fore.position.y = -0.13;
    elbow.add(fore);
    const cuff = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 12), mat(PAL.hoodieDark));
    cuff.position.y = -0.25;
    elbow.add(cuff);
    const hand = at(new THREE.Group(), 0, -0.32, 0);
    elbow.add(hand);
    const palm = mesh(new THREE.SphereGeometry(0.1, 16, 12), mat(PAL.skin));
    palm.scale.set(1, 1.05, 0.85);
    hand.add(palm);
    const thumb = mesh(new THREE.CapsuleGeometry(0.035, 0.06, 3, 8), mat(PAL.skin));
    at(thumb, -0.07 * side, 0.0, 0.06);
    thumb.rotation.z = 0.6 * side;
    hand.add(thumb);
    spine.add(sh);
    P[side > 0 ? "shL" : "shR"] = sh;
    P[side > 0 ? "elL" : "elR"] = elbow;
    P[side > 0 ? "handL" : "handR"] = hand;
    P[side > 0 ? "thumbL" : "thumbR"] = thumb;
  }

  // head
  const neck = at(new THREE.Group(), 0, 0.74, 0);
  spine.add(neck);
  const neckM = mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.12, 10), mat(PAL.skin));
  neckM.position.y = 0.03;
  neck.add(neckM);
  const head = at(new THREE.Group(), 0, 0.06, 0);
  neck.add(head);
  P.head = head;
  const skull = mesh(new THREE.SphereGeometry(0.33, 32, 24), mat(PAL.skin, 0.7));
  skull.scale.set(1, 1.04, 0.96);
  skull.position.y = 0.3;
  head.add(skull);
  for (const side of [1, -1]) {
    const ear = mesh(new THREE.SphereGeometry(0.07, 12, 10), mat(PAL.skin, 0.7));
    ear.scale.set(0.6, 1, 0.8);
    at(ear, 0.32 * side, 0.3, 0);
    head.add(ear);
  }
  const hair = mesh(new THREE.SphereGeometry(0.345, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.42), mat(PAL.hair, 0.9));
  hair.scale.set(1, 1.04, 0.98);
  hair.rotation.x = -0.32;
  at(hair, 0, 0.31, -0.02);
  head.add(hair);
  const nose = mesh(new THREE.SphereGeometry(0.06, 14, 10), mat("#f0a986", 0.7));
  nose.scale.set(1, 0.9, 0.85);
  at(nose, 0, 0.27, 0.32);
  head.add(nose);
  // mustache — Otto's signature
  for (const side of [1, -1]) {
    const m = mesh(new THREE.CapsuleGeometry(0.038, 0.1, 4, 10), mat(PAL.hair, 0.9));
    m.rotation.z = Math.PI / 2 + 0.38 * side;
    at(m, 0.075 * side, 0.205, 0.3);
    head.add(m);
  }
  // eyes
  P.eyes = [];
  for (const side of [1, -1]) {
    const eg = at(new THREE.Group(), 0.12 * side, 0.36, 0.265);
    const white = mesh(new THREE.SphereGeometry(0.078, 18, 14), mat("#ffffff", 0.35), { shadow: false });
    white.scale.set(1, 1.12, 0.7);
    eg.add(white);
    const pupil = mesh(new THREE.SphereGeometry(0.04, 14, 10), mat(PAL.ink, 0.25), { shadow: false });
    pupil.scale.set(1, 1.1, 0.5);
    pupil.position.z = 0.05;
    eg.add(pupil);
    const glint = mesh(new THREE.SphereGeometry(0.011, 8, 6), glowMat("#ffffff"), { shadow: false });
    at(glint, 0.012, 0.016, 0.022);
    pupil.add(glint);
    const lid = mesh(new THREE.SphereGeometry(0.086, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(PAL.skin, 0.7), { shadow: false });
    lid.scale.set(1, 1.12, 0.78);
    eg.add(lid);
    const brow = mesh(rbox(0.13, 0.032, 0.03, 0.012), mat(PAL.hair, 0.9), { shadow: false });
    brow.position.set(0, 0.115, 0.03);
    eg.add(brow);
    head.add(eg);
    P.eyes.push({ g: eg, pupil, lid, brow, side });
  }
  // mouth
  const mouth = at(new THREE.Group(), 0, 0.14, 0.305);
  head.add(mouth);
  const smile = mesh(new THREE.TorusGeometry(0.06, 0.014, 8, 18, Math.PI), mat("#7a2a1c", 0.5), { shadow: false });
  smile.rotation.z = Math.PI;
  mouth.add(smile);
  const oMouth = mesh(new THREE.SphereGeometry(0.045, 14, 10), mat("#5a1a14", 0.5), { shadow: false });
  oMouth.scale.set(1, 1.2, 0.4);
  mouth.add(oMouth);
  P.smile = smile;
  P.oMouth = oMouth;

  // hard hat (on a group so it can drop in)
  const hat = new THREE.Group();
  const dome = mesh(new THREE.SphereGeometry(0.37, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat(PAL.hat, 0.45));
  dome.scale.set(1, 0.9, 1.02);
  hat.add(dome);
  const brim = mesh(new THREE.CylinderGeometry(0.44, 0.45, 0.035, 32), mat(PAL.hat, 0.45));
  brim.scale.set(1, 1, 1.08);
  at(brim, 0, 0.01, 0.04);
  hat.add(brim);
  const ridge = mesh(rbox(0.07, 0.07, 0.62, 0.03), mat("#f2b400", 0.45));
  ridge.rotation.x = 0;
  at(ridge, 0, 0.3, 0);
  hat.add(ridge);
  const badge = mesh(new THREE.CircleGeometry(0.06, 20), mat("#ff7a2e", 0.5), { shadow: false });
  at(badge, 0, 0.2, 0.3);
  badge.rotation.x = -0.75;
  hat.add(badge);
  at(hat, 0, 0.5, 0);
  head.add(hat);
  P.hat = hat;

  root.traverse((o) => {
    if (o.isMesh) o.frustumCulled = true;
  });
  return P;
}

// Apply a pose. Every field optional; missing => neutral.
export function pose(P, s) {
  const d = (v, def = 0) => (v === undefined ? def : v);
  P.root.position.set(d(s.x), d(s.y), d(s.z));
  P.root.rotation.set(0, d(s.ry), 0);
  P.root.scale.set(1 + d(s.sq) * 0.5, 1 - d(s.sq), 1 + d(s.sq) * 0.5);
  P.hips.position.y = d(s.hipY, 0.9);
  P.hips.rotation.set(d(s.hipX), 0, 0);
  P.spine.rotation.set(d(s.lean), d(s.twist), d(s.tilt));
  const arm = (sh, el, a) => {
    a = a || [0, 0.08, 0];
    sh.rotation.set(a[0], a[3] || 0, a[1]);
    el.rotation.set(a[2], 0, 0);
  };
  arm(P.shL, P.elL, s.armL);
  arm(P.shR, P.elR, s.armR ? [s.armR[0], -s.armR[1], s.armR[2], s.armR[3] ? -s.armR[3] : 0] : [0, -0.08, 0]);
  P.legL.rotation.set(d(s.legL), 0, d(s.legLz));
  P.legR.rotation.set(d(s.legR), 0, -d(s.legLz));
  P.head.rotation.set(d(s.nod), d(s.turn), d(s.headTilt));
  // face
  const lid = d(s.lid, 0); // 0 open .. 1 closed
  const blink = d(s.blink, 0);
  const L = clamp(Math.max(lid, blink));
  for (const e of P.eyes) {
    e.pupil.position.x = clamp(d(s.lookX), -1, 1) * 0.03;
    e.pupil.position.y = clamp(d(s.lookY), -1, 1) * 0.035;
    e.lid.rotation.x = lerp(-1.45, 0.55, L);
    // brow: worried (+) raises inner end, angry (-) lowers it
    const br = d(s.brow);
    e.brow.rotation.z = -br * 0.42 * e.side;
    e.brow.position.y = 0.115 + d(s.browUp) * 0.04 + Math.abs(br) * 0.008;
    const ps = d(s.pupil, 1);
    e.pupil.scale.set(ps, ps * 1.1, 0.5);
  }
  const sm = d(s.smile, 0.3);
  P.smile.scale.set(1 + Math.abs(sm) * 0.2, Math.max(0.05, Math.abs(sm)) * Math.sign(sm || 1), 1);
  P.smile.visible = d(s.open) < 0.15;
  P.oMouth.visible = d(s.open) >= 0.15;
  P.oMouth.scale.set(0.7 + d(s.open) * 0.4, 0.6 + d(s.open) * 0.9, 0.4);
  // hat: 1 = on head, 0 = far above (hidden)
  const h = d(s.hat, 1);
  P.hat.visible = h > 0.001;
  P.hat.position.y = 0.5 + (1 - h) * 1.6;
  const hs = d(s.hatSq);
  P.hat.scale.set(1 + hs * 0.25, 1 - hs * 0.3, 1 + hs * 0.25);
}

// deterministic blinks: returns 0..1 closure
export function blinkAt(t, seed = 0) {
  const times = [];
  let x = 0.6 + hash(seed) * 1.2;
  while (x < 40) {
    times.push(x);
    x += 1.8 + hash(seed + times.length * 7.3) * 2.4;
  }
  for (const b of times) {
    const k = (t - b) / 0.16;
    if (k >= 0 && k <= 1) return Math.sin(k * Math.PI);
  }
  return 0;
}

// ---------- props ----------
export function makePhone(drawScreen) {
  const g = new THREE.Group();
  const body = mesh(rbox(0.13, 0.25, 0.022, 0.018), mat("#24242c", 0.35));
  g.add(body);
  const screens = drawScreen.map((fn) => {
    const tex = canvasTex(256, 512, fn);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.115, 0.23), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    m.position.z = 0.0125;
    m.visible = false;
    g.add(m);
    return m;
  });
  const cam = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.006, 12), mat("#111", 0.2));
  cam.rotation.x = Math.PI / 2;
  at(cam, -0.035, 0.09, -0.013);
  g.add(cam);
  g.userData.screens = screens;
  g.userData.show = (i) => screens.forEach((s, j) => (s.visible = j === i));
  return g;
}

export function batteryScreen(pct, color, bolt) {
  return (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#1b1f3a");
    bg.addColorStop(1, "#0b0d1c");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255,255,255,0.85)";
    g.font = "bold 26px sans-serif";
    g.textAlign = "center";
    g.fillText("23:47", w / 2, 60);
    // battery
    const bx = 48, by = 300, bw = 160, bh = 80;
    g.lineWidth = 9;
    g.strokeStyle = "#ffffff";
    roundRect(g, bx, by, bw, bh, 16);
    g.stroke();
    g.fillStyle = "#ffffff";
    roundRect(g, bx + bw + 4, by + 24, 12, 32, 5);
    g.fill();
    g.fillStyle = color;
    roundRect(g, bx + 12, by + 12, Math.max(10, (bw - 24) * pct / 100 * 6), bh - 24, 6);
    g.fill();
    g.fillStyle = color;
    g.font = "900 96px sans-serif";
    g.fillText(pct + "%", w / 2, 230);
    if (bolt) {
      g.fillStyle = "#ffe14a";
      g.beginPath();
      g.moveTo(150, 400);
      g.lineTo(110, 460);
      g.lineTo(138, 460);
      g.lineTo(122, 510);
      g.lineTo(170, 448);
      g.lineTo(142, 448);
      g.closePath();
      g.fill();
    }
    if (!bolt) {
      g.fillStyle = "rgba(255,80,80,0.95)";
      g.font = "bold 28px sans-serif";
      g.fillText("LOW BATTERY", w / 2, 450);
    }
  };
}
export function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// USB wall charger brick with prongs
export function makeCharger(scale = 1) {
  const g = new THREE.Group();
  const b = mesh(rbox(0.11, 0.13, 0.08, 0.025), mat("#f7f7f4", 0.4));
  g.add(b);
  for (const s of [1, -1]) {
    const p = mesh(new THREE.BoxGeometry(0.012, 0.05, 0.004), mat("#c9c9c9", 0.3, { metalness: 0.6 }));
    at(p, 0.025 * s, 0.085, 0);
    g.add(p);
  }
  const port = mesh(new THREE.BoxGeometry(0.04, 0.012, 0.01), mat("#333", 0.5));
  at(port, 0, -0.066, 0);
  g.add(port);
  g.scale.setScalar(scale);
  return g;
}
