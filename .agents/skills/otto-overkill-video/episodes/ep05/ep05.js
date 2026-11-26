// Episode 05 — "The blanket thief" — Otto chains his half of the blanket to the bed.
import {
  THREE, clamp, lerp, seg, eio, eout, ein, spring, hash, v3,
  mat, glowMat, rbox, mesh, at, canvasTex, glowSprite, makeOtto, pose, blinkAt,
} from "./otto-kit.js";

const W = 1080, H = 1920;
const canvas = document.getElementById("stage");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.08;
const scene = new THREE.Scene();
scene.background = new THREE.Color("#2b3566");
const camera = new THREE.PerspectiveCamera(42, W / H, 0.03, 200);

// night, but readable: cool moon key + blue fill + warm bedside lamp
const hemi = new THREE.HemisphereLight("#b9c6ff", "#5b4a6a", 1.35);
scene.add(hemi);
const moonL = new THREE.DirectionalLight("#cfdcff", 1.9);
moonL.position.set(-3, 6, 3);
moonL.castShadow = true;
moonL.shadow.mapSize.set(1024, 1024);
Object.assign(moonL.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 20 });
moonL.shadow.bias = -0.0006;
moonL.shadow.radius = 4;
scene.add(moonL);
const lamp = new THREE.PointLight("#ffb866", 2.4, 4.5, 1.5);
lamp.position.set(-1.55, 1.05, -1.35);
scene.add(lamp);

// ---------- bedroom ----------
const WZ = -1.75;
const floorTex = canvasTex(512, 512, (g, w) => {
  const cols = ["#9a7a6a", "#93725f", "#a08070", "#8d6d5c"];
  for (let i = 0; i < 16; i++) {
    g.fillStyle = cols[i % 4]; g.fillRect(0, i * 32, w, 32);
    g.fillStyle = "rgba(40,20,20,0.3)"; g.fillRect(0, i * 32 + 30, w, 2); g.fillRect(hash(i) * w, i * 32, 2, 32);
  }
});
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
floorTex.repeat.set(3, 3);
const floor = mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.75 }), { shadow: false });
floor.rotation.x = -Math.PI / 2;
scene.add(floor);
const wallTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#8d7fc8"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(255,255,255,0.25)"; g.beginPath(); g.arc(hash(i) * w, hash(i + 5) * h, 3, 0, 7); g.fill(); }
});
wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
wallTex.repeat.set(5, 2);
const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 });
const back = mesh(new THREE.PlaneGeometry(12, 3.4), wallMat, { shadow: false });
at(back, 0, 1.7, WZ);
scene.add(back);
for (const s of [1, -1]) {
  const side = mesh(new THREE.PlaneGeometry(8, 3.4), wallMat, { shadow: false });
  side.rotation.y = -s * Math.PI / 2;
  at(side, 3.2 * s, 1.7, 2);
  scene.add(side);
}
const rug = mesh(new THREE.CircleGeometry(1.5, 40), mat("#5ac0b5", 1), { shadow: false });
rug.rotation.x = -Math.PI / 2;
at(rug, 1.7, 0.006, 0.6);
scene.add(rug);
// window with moon
const sky = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.8), new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = "#16205a"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 20; i++) { g.fillStyle = "#ffffff"; g.fillRect(hash(i) * w, hash(i + 3) * h, 2, 2); }
  g.fillStyle = "#fff4cf"; g.beginPath(); g.arc(90, 40, 16, 0, 7); g.fill();
}), toneMapped: false }));
at(sky, 1.7, 1.9, WZ + 0.01);
scene.add(sky);
for (const [w, h, x, y] of [[1.02, 0.07, 0, 0.43], [1.02, 0.07, 0, -0.43], [0.07, 0.93, 0.48, 0], [0.07, 0.93, -0.48, 0], [0.05, 0.8, 0, 0]]) {
  const f = mesh(new THREE.BoxGeometry(w, h, 0.06), mat("#ffffff", 0.5));
  at(f, 1.7 + x, 1.9 + y, WZ + 0.03);
  scene.add(f);
}
// nightstands + lamp
for (const s of [1, -1]) {
  const ns = mesh(rbox(0.5, 0.5, 0.42, 0.04), mat("#e9d5b5", 0.7));
  at(ns, 1.55 * s, 0.25, WZ + 0.3);
  scene.add(ns);
}
const lampBase = mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.25, 14), mat("#ffc81a", 0.5));
at(lampBase, -1.55, 0.62, WZ + 0.3);
scene.add(lampBase);
const shade = mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.22, 18, 1, true), new THREE.MeshStandardMaterial({ color: "#fff3d6", emissive: "#ffcf86", emissiveIntensity: 1.0, side: THREE.DoubleSide }));
at(shade, -1.55, 0.86, WZ + 0.3);
scene.add(shade);

// bed: frame + slats + posts + headboard
const BZ0 = -1.6, BZ1 = 1.0, BW = 1.9;
const wood = mat("#b0703f", 0.7);
for (const s of [1, -1]) {
  const rail = mesh(rbox(0.1, 0.18, BZ1 - BZ0, 0.03), wood);
  at(rail, (BW / 2) * s, 0.3, (BZ0 + BZ1) / 2);
  scene.add(rail);
}
const footRail = mesh(rbox(BW, 0.18, 0.1, 0.03), wood);
at(footRail, 0, 0.3, BZ1);
scene.add(footRail);
for (let i = 0; i < 9; i++) {
  const sl = mesh(rbox(BW - 0.1, 0.03, 0.14, 0.01), mat("#d9a36b", 0.7));
  at(sl, 0, 0.33, BZ0 + 0.2 + i * 0.29);
  scene.add(sl);
}
const headboard = mesh(rbox(BW + 0.2, 1.0, 0.1, 0.05), wood);
at(headboard, 0, 0.6, BZ0 - 0.02);
scene.add(headboard);
for (const [x, z] of [[-1, BZ1], [1, BZ1]]) {
  const p = mesh(rbox(0.12, 0.6, 0.12, 0.03), wood);
  at(p, x * (BW / 2 + 0.02), 0.3, z);
  scene.add(p);
}
const mattress = new THREE.Group();
scene.add(mattress);
const mat0 = mesh(rbox(BW - 0.08, 0.27, BZ1 - BZ0 - 0.1, 0.1), mat("#fbfaf6", 0.9));
mattress.add(mat0);
for (const s of [1, -1]) {
  const pil = mesh(rbox(0.7, 0.16, 0.38, 0.08), mat("#ffffff", 0.95));
  pil.rotation.x = -0.2;
  at(pil, 0.45 * s, 0.2, BZ0 + 0.3 - (BZ0 + BZ1) / 2);
  mattress.add(pil);
}
const MTOP = 0.6;
const MPOS = v3(0, 0.465, (BZ0 + BZ1) / 2);

// blanket
const blanket = new THREE.Group();
scene.add(blanket);
const blTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#ff7f6e"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#ffb3a6";
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if ((x + y) % 2) g.fillRect(x * 32, y * 32, 32, 32);
});
const blMesh = mesh(rbox(1, 0.12, 1, 0.05), new THREE.MeshStandardMaterial({ map: blTex, roughness: 0.95 }));
blanket.add(blMesh);
function setBlanket(cx, w, y, z0, z1, thick = 1) {
  blanket.position.set(cx, y, (z0 + z1) / 2);
  blMesh.scale.set(w, thick, z1 - z0);
}

// chains (link by link) + padlocks
const linkMat = mat("#c9ced8", 0.25, { metalness: 0.8 });
const chains = [];
const CH = [[-0.6], [0.05], [0.7]].map(([z]) => z);
for (const z of CH) {
  const links = [];
  for (let i = 0; i < 11; i++) {
    const l = mesh(new THREE.TorusGeometry(0.032, 0.009, 6, 12), linkMat, { shadow: false });
    scene.add(l);
    links.push(l);
  }
  chains.push({ z, links });
}
function layChain(c, a, b, reveal, sag = 0.18) {
  const mid = a.clone().lerp(b, 0.5).add(v3(-0.18, -sag, 0));
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  c.links.forEach((l, i) => {
    const u = i / (c.links.length - 1);
    l.visible = i < reveal * c.links.length;
    const p = curve.getPoint(u), tg = curve.getTangent(u);
    l.position.copy(p);
    l.lookAt(p.clone().add(tg));
    l.rotateY(Math.PI / 2);
    l.rotateX(i % 2 ? Math.PI / 2 : 0);
    const pop = clamp(reveal * c.links.length - i);
    l.scale.setScalar(Math.max(0.001, spring(pop, 2, 6)));
  });
}
function makeLock() {
  const g = new THREE.Group();
  g.add(mesh(rbox(0.11, 0.09, 0.05, 0.015), mat("#ffc81a", 0.35, { metalness: 0.4 })));
  const sh = mesh(new THREE.TorusGeometry(0.035, 0.01, 8, 16, Math.PI), linkMat);
  sh.position.y = 0.045;
  g.add(sh);
  scene.add(g);
  return g;
}
const locks = [makeLock(), makeLock()];

// breath puffs
const puffTex = canvasTex(64, 64, (g) => {
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(230,245,255,0.9)"); r.addColorStop(1, "rgba(230,245,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
});
const puffs = [0, 1, 2].map(() => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false }));
  scene.add(s);
  return s;
});
const zzzTex = canvasTex(128, 128, (g) => {
  g.fillStyle = "#ffffff"; g.font = "900 90px 'Archivo Black', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("Z", 64, 68);
});
const zzz = [0, 1, 2].map(() => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: zzzTex, transparent: true, depthWrite: false }));
  scene.add(s);
  return s;
});

// ---------- characters ----------
const otto = makeOtto();
scene.add(otto.root);
const mia = makeOtto({
  pal: { hoodie: "#43b9a8", hoodieDark: "#2f9a8a", hair: "#4a2a1a", pants: "#6a5aa8", skin: "#eeb894", lip: "#c2455a", accent: "#ff5f8f" },
  mustache: false, hat: false, longHair: true, lashes: true,
});
scene.add(mia.root);
const ottoSkin = otto.head.children[0].material;
const SKIN = new THREE.Color("#f6c29b"), COLD = new THREE.Color("#a9d4ff");

// lying on the back, head toward the headboard (-z); feet at z
function lie(P, x, z, top, e = {}) {
  pose(P, { arms: 0, armL: [0, 0.12, 0], armR: [0, 0.12, 0], ...e, x, z, y: 0 });
  P.root.rotation.set(-Math.PI / 2, e.roll || 0, 0);
  P.root.position.set(x, top + 0.2, z);
}
function cam(pos, look, fov = 42) {
  camera.position.set(pos[0], pos[1], pos[2]);
  camera.lookAt(look[0], look[1], look[2]);
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
}
const shake = (t, t0, a, d) => {
  const k = seg(t, t0, t0 + d);
  return k <= 0 || k >= 1 ? 0 : Math.sin(t * 93) * a * (1 - k);
};
const OX = -0.45, MX = 0.45, FEET = 0.85;
const C = { s2: 3.2, s3: 4.65, s4: 6.95, s5: 8.15, s6: 12.6, s7: 14.6, s8: 16.7, end: 19.0 };
const OTTO_HEAD = () => otto.head.localToWorld(v3(0, 0.3, 0.2));

function render(t) {
  ottoSkin.color.copy(SKIN);
  puffs.forEach((p) => (p.visible = false));
  zzz.forEach((p) => (p.visible = false));
  locks.forEach((l) => (l.visible = false));
  chains.forEach((c) => c.links.forEach((l) => (l.visible = false)));
  mattress.position.copy(MPOS);
  mattress.rotation.set(0, 0, 0);
  let top = MTOP;
  const sleepy = { lid: 1, smile: 0.25 };

  if (t < C.s4) {
    // S1-S3 — the steal, the cold, the deadpan
    const steal = eio(seg(t, 1.9, 2.45));
    const roll = Math.sin(seg(t, 1.85, 2.5) * Math.PI) * 0.5;
    lie(mia, MX, FEET, top, { ...sleepy, roll: -roll, turn: -roll * 0.5, smile: steal > 0.9 ? 0.6 : 0.25, hat: 0 });
    const cold = seg(t, 2.6, 3.4);
    ottoSkin.color.copy(SKIN).lerp(COLD, cold * 0.8);
    const shiv = cold * Math.sin(t * 55) * 0.03;
    if (t < C.s3) {
      lie(otto, OX + shiv * 0.3, FEET, top, { lid: t < 3.25 ? 1 : 0, brow: cold, smile: -0.4 * cold, open: cold > 0.5 ? Math.abs(Math.sin(t * 30)) * 0.4 : 0, hat: 0, pupil: 0.8, turn: shiv * 3, roll: shiv,
        armL: [0, -0.5 * cold, -0.8 * cold], armR: [0, -0.5 * cold, -0.8 * cold] });
    } else {
      const sk = seg(t, 6.05, 6.6);
      lie(otto, OX + shiv * 0.3, FEET, top, { lid: 0.45, smile: -0.3, brow: -0.2, hat: 0, turn: -0.35 + Math.sin(sk * Math.PI * 4) * 0.3 * (1 - sk), roll: shiv,
        armL: [0, -0.5, -0.8], armR: [0, -0.5, -0.8] });
    }
    // blanket: shared -> bunched over Mia
    setBlanket(lerp(0, 0.5, steal), lerp(1.85, 0.95, steal), lerp(MTOP + 0.38, MTOP + 0.48, steal), -0.85, 0.95, lerp(1, 2.6, steal));
    blanket.rotation.z = -0.15 * steal;
    if (t < C.s2) {
      const k = eio(seg(t, 0, C.s2));
      cam([0.2, lerp(3.9, 3.7, k), lerp(2.6, 2.3, k)], [0, 0.55, -0.35], 50);
      zzz.forEach((z, i) => {
        const ph = (t * 0.6 + i / 3) % 1;
        z.visible = t < 1.8;
        z.position.set(MX + 0.15 + ph * 0.3, MTOP + 0.6 + ph * 0.6, -1.0);
        z.scale.setScalar(0.12 + ph * 0.1);
        z.material.opacity = 1 - ph;
      });
    } else if (t < C.s3) {
      otto.root.updateMatrixWorld(true);
      const h = OTTO_HEAD();
      puffs.forEach((p, i) => {
        const ph = ((t - C.s2) * 1.4 + i / 3) % 1;
        p.visible = true;
        p.position.set(h.x + 0.05, h.y + 0.15 + ph * 0.35, h.z + 0.25 + ph * 0.1);
        p.scale.setScalar(0.1 + ph * 0.25);
        p.material.opacity = 0.9 * (1 - ph);
      });
      const k = eout(seg(t, C.s2, C.s3));
      cam([OX + 0.15 + shiv, lerp(2.5, 2.35, k), lerp(0.25, 0.1, k)], [OX, MTOP + 0.2, -1.0], 46);
    } else {
      const k = eio(seg(t, C.s3, C.s4));
      cam([0.1, lerp(2.6, 2.45, k), lerp(0.75, 0.55, k)], [0.05, MTOP + 0.2, -0.9], 48);
    }
  } else if (t < C.s6) {
    // S4/S5 — sits up, hard hat; then chains his half
    lie(mia, MX, FEET, top, { ...sleepy, hat: 0, roll: -0.2 });
    setBlanket(OX, 1.0, MTOP + 0.38, -0.85, 0.95);
    blanket.rotation.z = 0;
    if (t < C.s5) {
      const lt = t - C.s4;
      const up = spring(seg(lt, 0, 0.3), 2, 6);
      const drop = seg(lt, 0.12, 0.42), land = seg(lt, 0.42, 0.9);
      const hatSq = drop >= 1 ? Math.exp(-land * 6) * Math.cos(land * 18) * 0.6 : 0;
      pose(otto, { x: OX, z: -1.15, hipY: MTOP + 0.05, legL: -Math.PI / 2, legR: -Math.PI / 2, lean: lerp(-1.4, -0.05, up),
        hat: drop < 1 ? ein(drop) : 1, hatSq, lid: lerp(0, 0.45, eout(land)), brow: lerp(0.2, -1, eout(land)), smile: lerp(0, 0.55, eout(land)) });
      setBlanket(OX, 1.0, MTOP + 0.2, -0.4, 0.95);
      const k = eout(seg(lt, 0, 1.1));
      cam([OX + 0.1 + shake(t, C.s4 + 0.42, 0.02, 0.25), 1.95, lerp(0.75, 0.45, k)], [OX, 1.7, -1.15], 40);
    } else {
      // chains grow link by link, padlocks snap on
      const back = seg(t, 10.6, 11.0);
      lie(otto, OX, FEET, top, { hat: 1, lid: lerp(0.35, 0.6, back), brow: -0.8, smile: 0.6, turn: -0.3 });
      chains.forEach((c, i) => {
        const r = seg(t, 8.55 + i * 0.5, 9.25 + i * 0.5);
        layChain(c, v3(OX - 0.48, MTOP + 0.4, c.z), v3(-BW / 2 - 0.06, 0.32, c.z), r);
      });
      [11.25, 11.65].forEach((lt, i) => {
        const l = locks[i];
        const k = seg(t, lt - 0.02, lt + 0.25);
        l.visible = k > 0;
        l.scale.setScalar(Math.max(0.001, spring(k, 2.5, 6)));
        l.position.set(-BW / 2 - 0.1, 0.3, chains[i * 2].z);
        l.rotation.set(0, -Math.PI / 2, 0);
      });
      const k = eio(seg(t, C.s5, C.s6));
      const a = lerp(-0.95, -0.45, k);
      cam([OX + Math.sin(a) * 2.4, lerp(2.4, 2.3, k), 0.1 + Math.cos(a) * 2.4], [OX - 0.25, 0.55, 0.05], 48);
    }
  } else if (t < C.s7) {
    // S6 — Mia tugs. Chains hold. Otto sleeps smug.
    const tug = [13.0, 13.45, 13.9].reduce((m, tt) => Math.max(m, Math.max(0, 1 - Math.abs(t - tt) / 0.18)), 0);
    lie(otto, OX, FEET, top, { hat: 1, lid: 1, smile: 0.7 });
    lie(mia, MX, FEET, top, { hat: 0, lid: 0.2, brow: -1, smile: -0.5, turn: 0.45, roll: -0.25 - tug * 0.1, armL: [-0.2, -0.9 - tug * 0.3, -0.6], armR: [0, 0.1, 0] });
    setBlanket(OX + tug * 0.08, 1.0 + tug * 0.12, MTOP + 0.38, -0.85, 0.95);
    blanket.rotation.z = 0;
    chains.forEach((c) => layChain(c, v3(OX - 0.48 + tug * 0.14, MTOP + 0.4, c.z), v3(-BW / 2 - 0.06, 0.32, c.z), 1, 0.18 - tug * 0.15));
    locks.forEach((l, i) => { l.visible = true; l.scale.setScalar(1); l.position.set(-BW / 2 - 0.1, 0.3, chains[i * 2].z); l.rotation.set(0, -Math.PI / 2, 0); });
    const k = eout(seg(t, C.s6, C.s7));
    cam([0.05 + shake(t, 13.0, 0.01, 0.2), lerp(3.5, 3.35, k), lerp(1.2, 1.0, k)], [0.0, MTOP + 0.1, -0.85], 46);
  } else {
    // S7 — she steals the mattress; Otto drops onto the slats. S8 — still worth it.
    const pull = eio(seg(t, 14.95, 15.8));
    const MX2 = 2.15;
    mattress.position.set(lerp(0, 0.3, pull), lerp(0.465, 0.52, Math.sin(pull * Math.PI)) - 0.325 * seg(t, 15.55, 15.8), lerp(MPOS.z, 2.65, pull));
    const drop = seg(t, 15.15, 15.3);
    const SLAT = 0.35;
    const ottoTop = lerp(MTOP, SLAT, ein(drop));
    const bump = t > 15.3 ? Math.exp(-(t - 15.3) * 8) * Math.sin((t - 15.3) * 30) * 0.03 : 0;
    const shiv = Math.sin(t * 50) * 0.012;
    lie(otto, OX, FEET, ottoTop + bump, { hat: 1, lid: t < 15.3 ? 1 : t < 16.7 ? 0 : 0.55, pupil: t < 16.7 ? 0.6 : 1, brow: t < 16.7 ? 0.9 : -0.1,
      open: t > 15.3 && t < 16.7 ? 0.5 : 0, smile: t < 16.7 ? 0 : 0.7, turn: t < 16.7 ? 0 : -0.35, roll: t > 16.7 ? shiv : 0 });
    setBlanket(OX, 1.0, ottoTop + 0.38 + bump, -0.85, 0.95);
    chains.forEach((c) => layChain(c, v3(OX - 0.48, ottoTop + 0.4, c.z), v3(-BW / 2 - 0.06, 0.32, c.z), 1, Math.max(0.02, 0.18 - (MTOP - ottoTop))));
    locks.forEach((l, i) => { l.visible = true; l.scale.setScalar(1); l.position.set(-BW / 2 - 0.1, 0.3, chains[i * 2].z); l.rotation.set(0, -Math.PI / 2, 0); });
    // Mia: stands and drags, then lies down on the mattress on the floor
    if (t < 15.95) {
      pose(mia, { x: 0.3, z: lerp(1.45, 4.1, pull), ry: Math.PI, hat: 0, lean: 0.25, armL: [-1.3, 0.1, -0.1], armR: [-1.3, 0.1, -0.1],
        brow: -0.8, lid: 0.3, smile: 0.4, legL: Math.sin(t * 14) * 0.4 * (pull > 0 && pull < 1), legR: -Math.sin(t * 14) * 0.4 * (pull > 0 && pull < 1) });
    } else {
      lie(mia, 0.3, 3.65, 0.28, { hat: 0, lid: 1, smile: 0.8, roll: -0.2 });
    }
    if (t < C.s8) {
      const k = eio(seg(t, C.s7, C.s8));
      cam([lerp(1.7, 1.6, k), lerp(3.8, 3.6, k), lerp(5.0, 4.7, k)], [0.1, 0.4, 0.8], 52);
    } else {
      const k = eout(seg(t, C.s8, C.end));
      cam([lerp(0.5, 0.4, k), lerp(3.4, 3.2, k), lerp(5.1, 4.7, k)], [-0.05, 0.35, 0.4], 50);
      zzz.forEach((z, i) => {
        const ph = ((t - C.s8) * 0.6 + i / 3) % 1;
        z.visible = true;
        z.position.set(0.55 + ph * 0.3, 0.7 + ph * 0.6, 1.6);
        z.scale.setScalar(0.12 + ph * 0.1);
        z.material.opacity = 1 - ph;
      });
    }
  }
  renderer.render(scene, camera);
}
window.addEventListener("hf-seek", (e) => render(e.detail.time));
render(0);
