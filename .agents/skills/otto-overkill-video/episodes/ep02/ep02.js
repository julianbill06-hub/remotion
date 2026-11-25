// Episode 02 — "I'm not hungry" — Otto vs. his girlfriend Mia over a box of fries.
import {
  THREE, clamp, lerp, seg, eio, eout, ein, spring, hash, v3, lerpV,
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
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
scene.background = new THREE.Color("#ffd9bf");
const camera = new THREE.PerspectiveCamera(42, W / H, 0.03, 200);

// ---------- lights ----------
const hemi = new THREE.HemisphereLight("#fff4ea", "#b08a70", 1.3);
scene.add(hemi);
const key = new THREE.DirectionalLight("#fff2de", 2.2);
key.position.set(-2.5, 6, 4.5);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 20 });
key.shadow.bias = -0.0006;
key.shadow.radius = 4;
scene.add(key);
const pend = new THREE.PointLight("#ffd29a", 2.2, 4, 1.5);
pend.position.set(0, 1.85, 0);
scene.add(pend);
const alarmLight = new THREE.PointLight("#ff2a2a", 0, 4, 1.4);
alarmLight.position.set(-0.18, 1.3, 0.35);
scene.add(alarmLight);

// ---------- kitchen ----------
const tileTex = canvasTex(256, 256, (g, w, h) => {
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    g.fillStyle = (x + y) % 2 ? "#f4efe6" : "#9fd6cf";
    g.fillRect(x * 32, y * 32, 32, 32);
  }
});
tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
tileTex.repeat.set(4, 4);
const floor = mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.6 }), { shadow: false });
floor.rotation.x = -Math.PI / 2;
scene.add(floor);
const WZ = -2.3;
const wallTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#ffc9a8";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(255,255,255,0.18)";
  for (let i = 0; i < 8; i++) g.fillRect(i * 32, 0, 14, h);
});
wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
wallTex.repeat.set(5, 2);
const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 });
const back = mesh(new THREE.PlaneGeometry(10, 3.4), wallMat, { shadow: false });
at(back, 0, 1.7, WZ);
scene.add(back);
for (const s of [1, -1]) {
  const side = mesh(new THREE.PlaneGeometry(8, 3.4), wallMat, { shadow: false });
  side.rotation.y = -s * Math.PI / 2;
  at(side, 3.2 * s, 1.7, 1.7);
  scene.add(side);
}
// counter + cabinets
const counter = mesh(rbox(3.4, 0.9, 0.65, 0.03), mat("#7fcfc2", 0.7));
at(counter, -0.9, 0.45, WZ + 0.33);
scene.add(counter);
const top = mesh(rbox(3.5, 0.06, 0.7, 0.02), mat("#f7f3ea", 0.4));
at(top, -0.9, 0.93, WZ + 0.35);
scene.add(top);
for (let i = 0; i < 4; i++) {
  const door = mesh(rbox(0.78, 0.7, 0.03, 0.02), mat("#92ddd1", 0.7));
  at(door, -2.2 + i * 0.86, 0.45, WZ + 0.67);
  scene.add(door);
  const knob = mesh(new THREE.SphereGeometry(0.025, 10, 8), mat("#ffffff", 0.3));
  at(knob, -2.2 + i * 0.86 + 0.28, 0.65, WZ + 0.7);
  scene.add(knob);
  const up = mesh(rbox(0.78, 0.6, 0.35, 0.02), mat("#92ddd1", 0.7));
  at(up, -2.2 + i * 0.86, 2.3, WZ + 0.18);
  scene.add(up);
}
const fridge = mesh(rbox(0.9, 2.0, 0.75, 0.08), mat("#fbfbfb", 0.45));
at(fridge, 1.5, 1.0, WZ + 0.4);
scene.add(fridge);
const fh = mesh(rbox(0.05, 0.5, 0.06, 0.02), mat("#c8c8c8", 0.3));
at(fh, 1.15, 1.25, WZ + 0.8);
scene.add(fh);
// magnets on fridge
["#ff5f8f", "#ffc81a", "#4b6fe0"].forEach((c, i) => {
  const m = mesh(new THREE.CircleGeometry(0.05, 16), mat(c), { shadow: false });
  at(m, 1.4 + i * 0.13, 1.5 + hash(i) * 0.2, WZ + 0.78);
  scene.add(m);
});
// window
const sky = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.8), new THREE.MeshBasicMaterial({ color: "#9fd8ff", toneMapped: false }));
at(sky, 2.4, 1.85, WZ + 0.01);
scene.add(sky);
for (const [w, h, x, y] of [[1.12, 0.07, 0, 0.43], [1.12, 0.07, 0, -0.43], [0.07, 0.93, 0.53, 0], [0.07, 0.93, -0.53, 0], [0.05, 0.8, 0, 0]]) {
  const f = mesh(new THREE.BoxGeometry(w, h, 0.06), mat("#ffffff", 0.5));
  at(f, 2.4 + x, 1.85 + y, WZ + 0.03);
  scene.add(f);
}
// pendant lamp
const cord = mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.2, 6), mat("#333"));
at(cord, 0, 2.8, 0);
scene.add(cord);
const shade = mesh(new THREE.ConeGeometry(0.28, 0.25, 24, 1, true), new THREE.MeshStandardMaterial({ color: "#ffc81a", emissive: "#ffb347", emissiveIntensity: 0.3, side: THREE.DoubleSide }));
at(shade, 0, 2.1, 0);
scene.add(shade);

// table with cloth
const TY = 0.76;
const cloth = mesh(new THREE.CylinderGeometry(0.62, 0.68, 0.33, 40), mat("#ffffff", 0.9));
at(cloth, 0, TY - 0.17, 0);
scene.add(cloth);
const clothTop = mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.02, 40), mat("#ff8aa6", 0.9));
at(clothTop, 0, TY, 0);
scene.add(clothTop);
const tleg = mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.42, 12), mat("#8a5a3a"));
at(tleg, 0, 0.2, 0);
scene.add(tleg);
// stools
for (const s of [1, -1]) {
  const seat = mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.07, 24), mat(s > 0 ? "#4b6fe0" : "#ffc81a"));
  at(seat, 0.78 * s, 0.5, 0.05);
  scene.add(seat);
  const l = mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.48, 10), mat("#555"));
  at(l, 0.78 * s, 0.24, 0.05);
  scene.add(l);
}

// plates, fries, burger, glass
const FX = -0.2, FZ = 0.2; // fries position on table
const plateO = mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.03, 32), mat("#ffffff", 0.4));
at(plateO, -0.24, TY + 0.02, -0.12);
scene.add(plateO);
const plateM = mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.03, 32), mat("#ffffff", 0.4));
at(plateM, 0.3, TY + 0.02, 0.05);
scene.add(plateM);
const glass = mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.2, 20), new THREE.MeshStandardMaterial({ color: "#cfefff", transparent: true, opacity: 0.45, roughness: 0.1 }));
at(glass, 0.38, TY + 0.11, -0.25);
scene.add(glass);
const carton = new THREE.Group();
at(carton, FX, TY + 0.01, FZ);
scene.add(carton);
const box = mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.17, 4, 1), mat("#e8322f", 0.6));
box.rotation.y = Math.PI / 4;
box.position.y = 0.085;
carton.add(box);
const logo = mesh(new THREE.CircleGeometry(0.035, 16), mat("#ffc81a"), { shadow: false });
at(logo, 0, 0.09, 0.083);
carton.add(logo);
const fries = [];
for (let i = 0; i < 16; i++) {
  const f = mesh(new THREE.BoxGeometry(0.022, 0.16 + hash(i) * 0.06, 0.022), mat("#ffcf4a", 0.7));
  at(f, (hash(i * 3) - 0.5) * 0.12, 0.2 + hash(i * 5) * 0.03, (hash(i * 7) - 0.5) * 0.1);
  f.rotation.set((hash(i * 9) - 0.5) * 0.5, hash(i) * 3, (hash(i * 11) - 0.5) * 0.5);
  carton.add(f);
  fries.push(f);
}
function makeBurger() {
  const b = new THREE.Group();
  const parts = [
    [new THREE.CylinderGeometry(0.11, 0.1, 0.04, 24), "#e0a050", 0.02],
    [new THREE.CylinderGeometry(0.115, 0.115, 0.035, 24), "#5a2e1a", 0.058],
    [new THREE.BoxGeometry(0.2, 0.01, 0.2), "#ffcf3a", 0.08],
    [new THREE.CylinderGeometry(0.125, 0.12, 0.015, 24), "#5fbf4a", 0.093],
  ];
  for (const [g, c, y] of parts) {
    const m = mesh(g, mat(c, 0.7));
    m.position.y = y;
    if (c === "#ffcf3a") m.rotation.y = 0.5;
    b.add(m);
  }
  const topBun = mesh(new THREE.SphereGeometry(0.115, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat("#e9a24c", 0.6));
  topBun.scale.y = 0.7;
  topBun.position.y = 0.1;
  b.add(topBun);
  for (let i = 0; i < 9; i++) {
    const s = mesh(new THREE.SphereGeometry(0.008, 6, 4), mat("#fff6d8"), { shadow: false });
    const a = hash(i * 2) * 6.28, r = hash(i * 3) * 0.08;
    at(s, Math.cos(a) * r, 0.1 + Math.sqrt(Math.max(0, 0.0132 - r * r)) * 0.7, Math.sin(a) * r);
    s.scale.y = 0.5;
    b.add(s);
  }
  return b;
}
const burger = makeBurger();
scene.add(burger);
// the vault
const vault = new THREE.Group();
at(vault, FX, TY, FZ);
scene.add(vault);
const domeG = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#d8f4ff", transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0.1, depthWrite: false }));
domeG.scale.y = 1.6;
vault.add(domeG);
const rim = mesh(new THREE.TorusGeometry(0.2, 0.018, 10, 40), mat("#9aa3b5", 0.3, { metalness: 0.7 }));
rim.rotation.x = Math.PI / 2;
rim.position.y = 0.01;
vault.add(rim);
const locks = [];
for (let i = 0; i < 3; i++) {
  const a = Math.PI / 2 + (i - 1) * 0.8;
  const l = new THREE.Group();
  at(l, Math.cos(a) * 0.22, 0.05, Math.sin(a) * 0.22);
  l.rotation.y = -a + Math.PI / 2;
  const body = mesh(rbox(0.07, 0.06, 0.03, 0.01), mat("#ffc81a", 0.35, { metalness: 0.4 }));
  l.add(body);
  const sh = mesh(new THREE.TorusGeometry(0.022, 0.007, 8, 16, Math.PI), mat("#c9c9c9", 0.3, { metalness: 0.7 }));
  sh.position.y = 0.03;
  l.add(sh);
  vault.add(l);
  locks.push(l);
}
const lasers = [];
for (let i = 0; i < 3; i++) {
  const lz = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.7, 6), glowMat("#ff2d2d"), { shadow: false });
  lz.rotation.z = Math.PI / 2;
  lz.rotation.y = (i - 1) * 0.6;
  lz.position.y = 0.06 + i * 0.07;
  vault.add(lz);
  lasers.push(lz);
}
const siren = mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.06, 16), new THREE.MeshStandardMaterial({ color: "#ff3030", emissive: "#ff0000", emissiveIntensity: 0.2 }));
siren.position.y = 0.35;
vault.add(siren);
const sirenGlow = glowSprite("#ff3a3a", 0.5);
sirenGlow.position.y = 0.36;
vault.add(sirenGlow);

// ---------- characters ----------
const otto = makeOtto();
scene.add(otto.root);
const mia = makeOtto({
  pal: { hoodie: "#43b9a8", hoodieDark: "#2f9a8a", hair: "#4a2a1a", pants: "#6a5aa8", skin: "#eeb894", lip: "#c2455a", accent: "#ff5f8f" },
  mustache: false, hat: false, longHair: true, lashes: true,
});
scene.add(mia.root);
// a fry for Otto's final shot
const ottoFry = mesh(new THREE.BoxGeometry(0.022, 0.18, 0.022), mat("#ffcf4a", 0.7));
otto.handR.add(ottoFry);
at(ottoFry, 0, -0.08, 0.09);
ottoFry.rotation.x = 1.2;
// Mia's sneaky grabbing hand (close-ups only)
const grab = new THREE.Group();
const sleeve = mesh(new THREE.CapsuleGeometry(0.075, 0.5, 4, 10), mat("#43b9a8"));
sleeve.rotation.z = Math.PI / 2;
sleeve.position.x = 0.34;
grab.add(sleeve);
const gHand = mesh(new THREE.SphereGeometry(0.075, 14, 10), mat("#eeb894"));
gHand.scale.set(1.1, 0.8, 1);
grab.add(gHand);
const gFry = mesh(new THREE.BoxGeometry(0.02, 0.16, 0.02), mat("#ffcf4a", 0.7));
at(gFry, -0.02, 0.08, 0);
gFry.rotation.z = 0.5;
grab.add(gFry);
scene.add(grab);

// steam puffs + sweat drop
const puffTex = canvasTex(64, 64, (g) => {
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,0.95)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
});
const puffs = [];
for (let i = 0; i < 8; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false }));
  scene.add(s);
  puffs.push(s);
}
const sweat = mesh(new THREE.SphereGeometry(0.04, 12, 10), new THREE.MeshStandardMaterial({ color: "#7fd0ff", roughness: 0.1, transparent: true, opacity: 0.85 }), { shadow: false });
sweat.scale.set(0.8, 1.3, 0.6);
otto.head.add(sweat);

// ---------- helpers ----------
function cam(pos, look, fov = 42) {
  camera.position.set(pos[0], pos[1], pos[2]);
  camera.lookAt(look[0], look[1], look[2]);
  if (camera.fov !== fov) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
}
const shake = (t, t0, a, d) => {
  const k = seg(t, t0, t0 + d);
  return k <= 0 || k >= 1 ? 0 : Math.sin(t * 93) * a * (1 - k);
};
const OX = -0.74, MX = 0.74, SZ = 0.05;
const SIT = { hipY: 0.62, legL: -Math.PI / 2 + 0.1, legR: -Math.PI / 2 + 0.1 };
const OTTO = (t, e = {}) => ({ x: OX, z: SZ, ry: Math.PI / 2 - 0.4, ...SIT, blink: blinkAt(t, 3), armL: [-0.7, 0.1, -0.9], armR: [-0.7, 0.1, -0.9], ...e });
const MIA = (t, e = {}) => ({ x: MX, z: SZ, ry: -Math.PI / 2 + 0.4, ...SIT, blink: blinkAt(t, 8), hat: 0, smile: 0.5, ...e });
function friesLeft(t) {
  const grabs = [3.25, 3.6, 3.95];
  let n = 16;
  for (const g of grabs) if (t > g + 0.12) n -= 3;
  return n;
}
function burgerOnPlate() {
  burger.visible = true;
  if (burger.parent !== scene) scene.add(burger);
  burger.position.set(-0.24, TY + 0.035, -0.12);
  burger.rotation.set(0, 0, 0);
  burger.scale.setScalar(1);
}

const C = { s2: 2.6, s3: 4.55, s4: 6.45, s5: 7.6, s6: 11.7, s7: 13.5, s7b: 14.9, s8: 16.95, s9: 18.95, end: 21.5 };

function render(t) {
  // defaults
  alarmLight.intensity = 0;
  vault.visible = false;
  grab.visible = false;
  ottoFry.visible = false;
  sweat.visible = false;
  puffs.forEach((p) => (p.visible = false));
  burgerOnPlate();
  fries.forEach((f, i) => (f.visible = i < friesLeft(t)));
  sirenGlow.visible = false;
  siren.material.emissiveIntensity = 0.2;
  lasers.forEach((l) => (l.visible = false));
  pose(mia, MIA(t));
  pose(otto, OTTO(t, { hat: 0 }));

  if (t < C.s2) {
    // S1 — two-shot. Mia waves "not hungry", Otto happily holding... his fries are safe (for now)
    const wave = Math.sin(t * 9) * 0.25;
    pose(mia, MIA(t, { armL: [-0.6, 0.6 + wave, -1.6], nod: -0.05, turn: 0.35, lid: 0.15, smile: 0.7, headTilt: 0.12 }));
    pose(otto, OTTO(t, { hat: 0, turn: -0.3, smile: 0.6, lookX: 0.6 }));
    const k = eio(seg(t, 0, C.s2));
    cam([0, lerp(1.85, 1.8, k), lerp(3.7, 3.2, k)], [0, 1.2, 0], 46);
  } else if (t < C.s3) {
    // S2 — close-up: the hand. Three grabs.
    const grabs = [3.25, 3.6, 3.95];
    let gx = 1, gy = 0.15, holding = false;
    for (const g of grabs) {
      const d = t - g;
      if (d > -0.18 && d < 0.2) {
        const k = d < 0 ? eout((d + 0.18) / 0.18) : 1 - eio(d / 0.2);
        gx = Math.min(gx, 1 - k);
        gy = 0.15 - k * 0.07;
        holding = d > 0;
      }
    }
    grab.visible = true;
    grab.position.set(FX + 0.02 + gx * 0.55, TY + 0.2 + gy, FZ + 0.02);
    grab.rotation.set(0, 0, -0.2);
    gFry.visible = holding;
    pose(otto, OTTO(t, { hat: 0, turn: 0.1, lookX: 1, lookY: -0.6, brow: 0.6, smile: -0.2, open: t > 3.3 ? 0.5 : 0, pupil: 0.7 }));
    const k = eout(seg(t, C.s2, C.s3));
    cam([FX - 0.1, TY + lerp(0.6, 0.5, k), FZ + lerp(0.85, 0.75, k)], [FX + 0.05, TY + 0.15, FZ], 40);
  } else if (t < C.s4) {
    // S3 — Otto deadpan to camera, Mia chewing in the background
    const chew = Math.abs(Math.sin(t * 12));
    pose(mia, MIA(t, { smile: 0, open: 0.2 + chew * 0.4, lid: 0.5, turn: 0.2, nod: -0.05 }));
    const shakeK = seg(t, 5.6, 6.3);
    pose(otto, OTTO(t, { hat: 0, turn: -0.9 + Math.sin(shakeK * Math.PI * 4) * 0.25 * (1 - shakeK), lookX: -0.2, lid: 0.45, brow: -0.2, smile: -0.25 }));
    const k = eio(seg(t, C.s3, C.s4));
    cam([lerp(0.05, 0.1, k), 1.7, lerp(2.6, 2.35, k)], [OX + 0.25, 1.35, SZ], 42);
  } else if (t < C.s5) {
    // S4 — "Not Otto." hard hat drop
    const lt = t - C.s4;
    const drop = seg(lt, 0.12, 0.42), land = seg(lt, 0.42, 0.9);
    const hatSq = drop >= 1 ? Math.exp(-land * 6) * Math.cos(land * 18) * 0.6 : 0;
    pose(otto, OTTO(t, { hat: drop < 1 ? ein(drop) : 1, hatSq, turn: -1.0, lid: lerp(0, 0.45, eout(land)), brow: lerp(0.2, -1, eout(land)), smile: lerp(0, 0.55, eout(land)), blink: 0 }));
    const k = eout(seg(lt, 0, 1.1));
    const sx = shake(t, C.s4 + 0.42, 0.02, 0.25);
    cam([-0.2 + sx, 1.85, lerp(1.95, 1.6, k)], [OX + 0.05, 1.65, SZ], 40);
  } else if (t < C.s6) {
    // S5 — the build: dome drops, 3 locks, lasers, siren
    vault.visible = true;
    const dk = seg(t, 8.45, 8.75);
    const dland = seg(t, 8.75, 9.2);
    domeG.position.y = (1 - ein(dk)) * 1.2;
    rim.position.y = 0.01 + (1 - ein(dk)) * 1.2;
    domeG.scale.set(1 + Math.exp(-dland * 6) * Math.sin(dland * 20) * 0.08 * (dk >= 1), 1.6, 1);
    siren.position.y = 0.35 + (1 - ein(dk)) * 1.2;
    [9.4, 9.62, 9.88].forEach((lt, i) => {
      const k = seg(t, lt - 0.02, lt + 0.25);
      locks[i].visible = k > 0;
      locks[i].scale.setScalar(Math.max(0.001, spring(k, 2.5, 6)));
    });
    lasers.forEach((l, i) => {
      const k = seg(t, 10.45 + i * 0.08, 10.6 + i * 0.08);
      l.visible = k > 0;
      l.scale.set(1, k, 1);
    });
    const on = t > 10.9;
    sirenGlow.visible = on && dk >= 1;
    siren.material.emissiveIntensity = on ? 1.2 : 0.2;
    pose(otto, OTTO(t, { hat: 1, armL: [-0.5, 0.15, -0.5], armR: [-0.5, 0.15, -0.5], lean: 0.05, nod: 0.25, lookY: -0.5, lid: 0.35, brow: -0.9, smile: 0.4 }));
    pose(mia, MIA(t, { smile: -0.1, open: 0.35, browUp: 0.6, lookX: 0.3, pupil: 0.8 }));
    const k = eio(seg(t, C.s5, C.s6));
    const a = lerp(0.15, 0.85, k);
    cam([FX + Math.sin(a) * 1.3, lerp(1.45, 1.35, k), FZ + Math.cos(a) * 1.3], [FX, TY + 0.2, FZ], 42);
  } else if (t < C.s7) {
    // S6 — "The fries are safe." Hand sneaks in -> laser alarm
    vault.visible = true;
    domeG.position.y = 0; rim.position.y = 0.01; siren.position.y = 0.35; domeG.scale.set(1, 1.6, 1);
    locks.forEach((l) => { l.visible = true; l.scale.setScalar(1); });
    lasers.forEach((l) => { l.visible = true; l.scale.set(1, 1, 1); });
    const trig = 12.55;
    const reach = eio(seg(t, 12.1, trig));
    const yank = eout(seg(t, trig + 0.05, trig + 0.3));
    grab.visible = true;
    gFry.visible = false;
    grab.position.set(FX + 0.3 + (1 - reach) * 0.4 + yank * 0.6, TY + 0.3, FZ + 0.05);
    grab.rotation.set(0, 0, -0.3);
    const alarm = t > trig;
    const blinkOn = alarm && Math.floor((t - trig) * 8) % 2 === 0;
    sirenGlow.visible = true;
    sirenGlow.scale.setScalar(alarm ? (blinkOn ? 1.4 : 0.5) : 0.5);
    siren.material.emissiveIntensity = alarm ? (blinkOn ? 3 : 0.5) : 1.2;
    alarmLight.intensity = blinkOn ? 6 : 0;
    const sx = shake(t, trig, 0.015, 0.4);
    const k = eout(seg(t, C.s6, C.s7));
    cam([FX - 0.15 + sx, TY + lerp(0.62, 0.55, k), FZ + lerp(1.05, 0.95, k)], [FX + 0.05, TY + 0.2, FZ], 42);
  } else if (t < C.s8) {
    vault.visible = true;
    domeG.position.y = 0; rim.position.y = 0.01; siren.position.y = 0.35; domeG.scale.set(1, 1.6, 1);
    locks.forEach((l) => { l.visible = true; l.scale.setScalar(1); });
    lasers.forEach((l) => { l.visible = true; l.scale.set(1, 1, 1); });
    if (t < C.s7b) {
      // S7a — Mia is MAD: arms crossed, steam
      const lt = t - C.s7;
      const snap = spring(seg(lt, 0, 0.35), 2.5, 6);
      pose(mia, MIA(t, { armL: [-0.35, -0.4, -1.75], armR: [-0.3, -0.45, -1.65], brow: -1, lid: 0.35, smile: -0.7, turn: 0.15, nod: -0.08 * snap, headTilt: -0.1, sq: -0.04 * (1 - snap) }));
      mia.root.updateMatrixWorld(true);
      const hp = new THREE.Vector3();
      mia.head.getWorldPosition(hp);
      puffs.forEach((p, i) => {
        const ph = ((t * 1.4 + i / puffs.length) % 1);
        p.visible = true;
        const side = i % 2 ? 1 : -1;
        p.position.set(hp.x + side * (0.32 + ph * 0.15), hp.y + 0.35 + ph * 0.45, hp.z + 0.05);
        p.scale.setScalar(0.1 + ph * 0.25);
        p.material.opacity = 0.9 * (1 - ph);
      });
      const k = eout(seg(t, C.s7, C.s7b));
      cam([MX - 0.2, 1.85, lerp(2.4, 2.1, k)], [MX - 0.05, 1.6, SZ], 42);
    } else {
      // S7b — Otto realises. Sweat.
      const lt = t - C.s7b;
      pose(otto, OTTO(t, { hat: 1, turn: -0.75, lookX: 0.5, brow: 0.9, smile: -0.4, pupil: 0.7, lid: 0 }));
      sweat.visible = true;
      sweat.position.set(0.27, 0.48 - eio(seg(lt, 0.2, 1.8)) * 0.18, 0.18);
      const k = eout(seg(t, C.s7b, C.s8));
      cam([-0.15, 1.82, lerp(2.0, 1.75, k)], [OX + 0.05, 1.62, SZ], 40);
    }
  } else if (t < C.s9) {
    // S8 — she eats his burger, staring at the camera
    vault.visible = true;
    domeG.position.y = 0; rim.position.y = 0.01; siren.position.y = 0.35; domeG.scale.set(1, 1.6, 1);
    locks.forEach((l) => { l.visible = true; l.scale.setScalar(1); });
    lasers.forEach((l) => { l.visible = true; l.scale.set(1, 1, 1); });
    const bites = [17.45, 17.85, 18.25];
    let nb = 0, bitePose = 0;
    for (const b of bites) {
      if (t > b) nb++;
      const d = t - b;
      if (d > -0.15 && d < 0.15) bitePose = Math.max(bitePose, 1 - Math.abs(d) / 0.15);
    }
    pose(mia, MIA(t, { armL: [-1.45 - bitePose * 0.1, -0.35, -1.45], armR: [-1.45 - bitePose * 0.1, -0.35, -1.45], turn: 0.55, lid: 0.45, brow: -0.8, smile: 0.1, open: bitePose * 0.8 + (nb ? Math.abs(Math.sin(t * 12)) * 0.3 : 0), lookX: -0.2, nod: -0.05 }));
    mia.handL.add(burger);
    burger.position.set(-0.08, -0.06, 0.13);
    burger.rotation.set(1.1, 0, 0.2);
    burger.scale.setScalar(1.35 * (1 - nb * 0.26));
    const sx = shake(t, bites[0], 0.008, 0.15) + shake(t, bites[1], 0.008, 0.15) + shake(t, bites[2], 0.008, 0.15);
    const k = eout(seg(t, C.s8, C.s9));
    cam([MX - 0.45 + sx, 1.8, lerp(2.15, 1.9, k)], [MX - 0.05, 1.55, SZ], 42);
  } else {
    // S9 — "Still worth it." Otto smug with one fry, Mia with crumbs behind
    vault.visible = true;
    domeG.position.y = 0; rim.position.y = 0.01; siren.position.y = 0.35; domeG.scale.set(1, 1.6, 1);
    locks.forEach((l) => { l.visible = true; l.scale.setScalar(1); });
    lasers.forEach((l) => { l.visible = true; l.scale.set(1, 1, 1); });
    burger.visible = false;
    const lift = eio(seg(t, C.s9 + 0.2, C.s9 + 0.8));
    ottoFry.visible = true;
    pose(otto, OTTO(t, { hat: 1, armR: [lerp(-0.7, -1.15, lift), lerp(0.1, 0.25, lift), lerp(-0.9, -1.35, lift)], turn: -0.75, lid: 0.5, brow: -0.2, browUp: 0.4, smile: 0.85, nod: -0.05 }));
    pose(mia, MIA(t, { armL: [-0.35, -0.4, -1.75], armR: [-0.3, -0.45, -1.65], brow: -1, lid: 0.4, smile: -0.5, turn: 0.4, open: Math.abs(Math.sin(t * 12)) * 0.25 }));
    const k = eout(seg(t, C.s9, C.end));
    cam([0, 1.85, lerp(3.5, 3.15, k)], [0, 1.3, SZ], 48);
  }
  renderer.render(scene, camera);
}
window.addEventListener("hf-seek", (e) => render(e.detail.time));
render(0);
