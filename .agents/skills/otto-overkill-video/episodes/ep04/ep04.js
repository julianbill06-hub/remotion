// Episode 04 — "The pickle jar" — Otto vs. a lid. Solo episode.
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
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
scene.background = new THREE.Color("#fde3a7");
const camera = new THREE.PerspectiveCamera(42, W / H, 0.03, 200);

const hemi = new THREE.HemisphereLight("#fff7ea", "#b09070", 1.3);
scene.add(hemi);
const key = new THREE.DirectionalLight("#fff2de", 2.2);
key.position.set(-2.5, 6, 5);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 20 });
key.shadow.bias = -0.0006;
key.shadow.radius = 4;
scene.add(key);
const flashL = new THREE.PointLight("#eaffc0", 0, 6, 1.4);
flashL.position.set(0.9, 1.0, -0.2);
scene.add(flashL);

// ---------- kitchen ----------
const WZ = -1.9, CEIL = 3.0;
const tileTex = canvasTex(256, 256, (g) => {
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    g.fillStyle = (x + y) % 2 ? "#fbf6ec" : "#f7b9a0";
    g.fillRect(x * 32, y * 32, 32, 32);
  }
});
tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
tileTex.repeat.set(4, 4);
const floor = mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.6 }), { shadow: false });
floor.rotation.x = -Math.PI / 2;
scene.add(floor);
const wallTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#ffe08a";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(255,255,255,0.22)";
  for (let i = 0; i < 8; i++) g.fillRect(i * 32, 0, 12, h);
});
wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
wallTex.repeat.set(5, 2);
const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 });
const back = mesh(new THREE.PlaneGeometry(10, CEIL), wallMat, { shadow: false });
at(back, 0, CEIL / 2, WZ);
scene.add(back);
for (const s of [1, -1]) {
  const side = mesh(new THREE.PlaneGeometry(8, CEIL), wallMat, { shadow: false });
  side.rotation.y = -s * Math.PI / 2;
  at(side, 3.0 * s, CEIL / 2, 2);
  scene.add(side);
}
const ceil = mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ color: "#fff3dc" }), { shadow: false });
ceil.rotation.x = Math.PI / 2;
ceil.position.y = CEIL;
scene.add(ceil);
// counter along the back
const counter = mesh(rbox(3.6, 0.9, 0.65, 0.03), mat("#6fa8ff", 0.7));
at(counter, -0.6, 0.45, WZ + 0.33);
scene.add(counter);
const ctop = mesh(rbox(3.7, 0.06, 0.7, 0.02), mat("#f7f3ea", 0.4));
at(ctop, -0.6, 0.93, WZ + 0.35);
scene.add(ctop);
for (let i = 0; i < 4; i++) {
  const door = mesh(rbox(0.82, 0.7, 0.03, 0.02), mat("#8cbcff", 0.7));
  at(door, -1.95 + i * 0.9, 0.45, WZ + 0.67);
  scene.add(door);
  const up = mesh(rbox(0.82, 0.6, 0.35, 0.02), mat("#8cbcff", 0.7));
  at(up, -1.95 + i * 0.9, 2.25, WZ + 0.18);
  scene.add(up);
}
// sink + faucet
const sink = mesh(rbox(0.6, 0.04, 0.45, 0.02), mat("#cfd6e0", 0.3, { metalness: 0.4 }));
at(sink, -1.4, 0.965, WZ + 0.35);
scene.add(sink);
const tap = mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 16, Math.PI), mat("#cfd6e0", 0.25, { metalness: 0.6 }));
at(tap, -1.4, 1.1, WZ + 0.15);
scene.add(tap);
// window
const sky = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.8), new THREE.MeshBasicMaterial({ color: "#9fd8ff", toneMapped: false }));
at(sky, 1.9, 1.85, WZ + 0.01);
scene.add(sky);
for (const [w, h, x, y] of [[1.12, 0.07, 0, 0.43], [1.12, 0.07, 0, -0.43], [0.07, 0.93, 0.53, 0], [0.07, 0.93, -0.53, 0], [0.05, 0.8, 0, 0]]) {
  const f = mesh(new THREE.BoxGeometry(w, h, 0.06), mat("#ffffff", 0.5));
  at(f, 1.9 + x, 1.85 + y, WZ + 0.03);
  scene.add(f);
}
// fridge
const fridge = mesh(rbox(0.85, 2.0, 0.75, 0.08), mat("#ffffff", 0.45));
at(fridge, -2.45, 1.0, WZ + 0.4);
scene.add(fridge);

// ---------- the jar ----------
function makeJar() {
  const g = new THREE.Group();
  const glassM = new THREE.MeshStandardMaterial({ color: "#e8fff0", transparent: true, opacity: 0.35, roughness: 0.05, depthWrite: false });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.26, 28), glassM);
  body.position.y = 0.13;
  g.add(body);
  const juice = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 24), new THREE.MeshStandardMaterial({ color: "#a9c94a", transparent: true, opacity: 0.55, roughness: 0.3 }), { shadow: false });
  juice.position.y = 0.12;
  g.add(juice);
  for (let i = 0; i < 4; i++) {
    const p = mesh(new THREE.CapsuleGeometry(0.03, 0.13, 4, 10), mat("#4f8f2a", 0.7), { shadow: false });
    at(p, (hash(i * 3) - 0.5) * 0.1, 0.12, (hash(i * 7) - 0.5) * 0.1);
    p.rotation.set((hash(i) - 0.5) * 0.5, 0, (hash(i * 2) - 0.5) * 0.5);
    g.add(p);
  }
  const label = mesh(new THREE.CylinderGeometry(0.112, 0.112, 0.1, 28, 1, true, -0.9, 1.8), new THREE.MeshStandardMaterial({ color: "#ffffff", map: canvasTex(256, 64, (c, w, h) => {
    c.fillStyle = "#fff6e0"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#3d7a22"; c.font = "900 40px 'Archivo Black', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("PICKLES", w / 2, h / 2 + 2);
  }), side: THREE.DoubleSide }), { shadow: false });
  label.position.y = 0.12;
  g.add(label);
  const lid = new THREE.Group();
  lid.position.y = 0.27;
  const lm = mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.05, 28), mat("#e8b52e", 0.3, { metalness: 0.5 }));
  lid.add(lm);
  for (let i = 0; i < 16; i++) {
    const r = mesh(new THREE.BoxGeometry(0.01, 0.045, 0.012), mat("#c99a1e", 0.3, { metalness: 0.5 }));
    const a = (i / 16) * Math.PI * 2;
    at(r, Math.sin(a) * 0.116, 0, Math.cos(a) * 0.116);
    r.rotation.y = a;
    lid.add(r);
  }
  g.add(lid);
  g.userData = { lid, body, juice };
  return g;
}
const jar = makeJar();
scene.add(jar);

// ---------- the press ----------
const press = new THREE.Group();
const PX = 0.85, PZ = -0.55;
at(press, PX, 0, PZ);
scene.add(press);
const stripes = canvasTex(256, 64, (g, w, h) => {
  for (let i = -2; i < 12; i++) {
    g.fillStyle = i % 2 ? "#1d1a22" : "#ffc81a";
    g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32 + 32, 0); g.lineTo(i * 32 + 32 - 32, h); g.lineTo(i * 32 - 32, h); g.closePath(); g.fill();
  }
});
const baseP = mesh(rbox(1.2, 0.3, 0.8, 0.05), new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.6 }));
baseP.position.y = 0.15;
press.add(baseP);
const anvil = mesh(rbox(0.6, 0.06, 0.5, 0.02), mat("#9aa3b5", 0.3, { metalness: 0.6 }));
anvil.position.y = 0.33;
press.add(anvil);
for (const s of [1, -1]) {
  const col = mesh(rbox(0.16, 2.3, 0.16, 0.04), mat("#ffc81a", 0.5));
  at(col, 0.48 * s, 1.45, 0);
  press.add(col);
}
const beam = mesh(rbox(1.25, 0.32, 0.4, 0.06), mat("#ffc81a", 0.5));
beam.position.y = 2.6;
press.add(beam);
const cyl = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 24), mat("#e0453a", 0.4, { metalness: 0.2 }));
cyl.position.y = 2.2;
press.add(cyl);
const piston = new THREE.Group();
press.add(piston);
const rod = mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.4, 16), mat("#d9dee8", 0.2, { metalness: 0.8 }));
rod.position.y = 0.7;
piston.add(rod);
const plate = mesh(rbox(0.5, 0.08, 0.42, 0.02), mat("#9aa3b5", 0.3, { metalness: 0.6 }));
piston.add(plate);
// gauge
const gaugeTex = canvasTex(256, 256, (g) => {
  g.fillStyle = "#ffffff"; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill();
  g.strokeStyle = "#1d1a22"; g.lineWidth = 10; g.stroke();
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
    g.strokeStyle = i >= 8 ? "#e0453a" : "#1d1a22"; g.lineWidth = 6;
    g.beginPath(); g.moveTo(128 + Math.cos(a) * 92, 128 + Math.sin(a) * 92); g.lineTo(128 + Math.cos(a) * 110, 128 + Math.sin(a) * 110); g.stroke();
  }
  g.fillStyle = "#1d1a22"; g.font = "900 40px 'Archivo Black', sans-serif"; g.textAlign = "center"; g.fillText("20 T", 128, 200);
});
const gauge = new THREE.Group();
at(gauge, 0, 2.6, 0.21);
press.add(gauge);
gauge.add(new THREE.Mesh(new THREE.CircleGeometry(0.15, 32), new THREE.MeshStandardMaterial({ map: gaugeTex, roughness: 0.5 })));
const needle = mesh(new THREE.BoxGeometry(0.012, 0.11, 0.01), mat("#e0453a"), { shadow: false });
const needleP = new THREE.Group();
needleP.position.z = 0.01;
needle.position.y = 0.05;
needleP.add(needle);
gauge.add(needleP);
// control panel + big red button
const panel = mesh(rbox(0.35, 0.9, 0.3, 0.04), mat("#4b6fe0"));
at(panel, -0.85, 0.45, 0.25);
press.add(panel);
const btn = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 20), new THREE.MeshStandardMaterial({ color: "#ff2a2a", emissive: "#ff0000", emissiveIntensity: 0.3 }));
at(btn, -0.85, 0.93, 0.25);
press.add(btn);

// ---------- explosion ----------
const drops = [];
const NDROP = 46, NSHARD = 28;
const dropMat = new THREE.MeshStandardMaterial({ color: "#a9c94a", roughness: 0.25 });
for (let i = 0; i < NDROP; i++) {
  const m = mesh(new THREE.SphereGeometry(0.03 + hash(i * 4.1) * 0.03, 10, 8), dropMat, { shadow: false });
  scene.add(m);
  drops.push(m);
}
const shardMat = new THREE.MeshStandardMaterial({ color: "#e8fff0", transparent: true, opacity: 0.6, roughness: 0.05 });
const shards = [];
for (let i = 0; i < NSHARD; i++) {
  const m = mesh(new THREE.TetrahedronGeometry(0.035 + hash(i * 9.3) * 0.03), shardMat, { shadow: false });
  scene.add(m);
  shards.push(m);
}
const BOOM = 12.85;
const O = v3(PX, 0.5, PZ);
function ballistic(i, dt, seed, speed) {
  const a = hash(seed + i * 1.7) * Math.PI * 2;
  const up = 0.35 + hash(seed + i * 2.9) * 0.9;
  const sp = speed * (0.6 + hash(seed + i * 5.3) * 0.8);
  const v = v3(Math.cos(a) * sp, up * sp, Math.sin(a) * sp * 0.8 + 0.6);
  // integrate analytically with floor / wall / ceiling stops
  let p = O.clone().add(v.clone().multiplyScalar(dt)).add(v3(0, -4.9 * dt * dt, 0));
  // find first contact time by sampling (deterministic)
  let tHit = Infinity;
  for (let s = 0.01; s <= dt; s += 0.01) {
    const q = O.clone().add(v.clone().multiplyScalar(s)).add(v3(0, -4.9 * s * s, 0));
    if (q.y < 0.03 || q.y > CEIL - 0.03 || q.z < WZ + 0.04 || Math.abs(q.x) > 2.95) { tHit = s; break; }
  }
  if (tHit < Infinity) {
    p = O.clone().add(v.clone().multiplyScalar(tHit)).add(v3(0, -4.9 * tHit * tHit, 0));
    p.y = clamp(p.y, 0.03, CEIL - 0.03);
    p.z = Math.max(p.z, WZ + 0.04);
  }
  return { p, landed: tHit < Infinity, tHit };
}
// splats that stay on surfaces
const splatMat = new THREE.MeshBasicMaterial({ color: "#9cc23f", transparent: true, opacity: 0.85, toneMapped: true });
const splats = [];
for (let i = 0; i < NDROP; i++) {
  const s = new THREE.Mesh(new THREE.CircleGeometry(0.06 + hash(i * 3.3) * 0.08, 14), splatMat);
  s.visible = false;
  scene.add(s);
  splats.push(s);
}
// juice spots on Otto
const ottoSpots = [];

// the one pickle
const hero = mesh(new THREE.CapsuleGeometry(0.035, 0.14, 4, 12), mat("#4f8f2a", 0.6));
scene.add(hero);
const heroDrip = mesh(new THREE.SphereGeometry(0.015, 8, 6), dropMat, { shadow: false });
scene.add(heroDrip);

const boomFlash = glowSprite("#f2ffd0", 2.5);
scene.add(boomFlash);

// ---------- Otto ----------
const otto = makeOtto();
scene.add(otto.root);
const skinMat = otto.head.children[0].material;
const SKIN = new THREE.Color("#f6c29b"), RED = new THREE.Color("#ff6b5a");
for (let i = 0; i < 6; i++) {
  const s = mesh(new THREE.SphereGeometry(0.035 + hash(i) * 0.03, 10, 8), dropMat, { shadow: false });
  s.scale.z = 0.35;
  const a = -1 + hash(i * 3) * 2, b = hash(i * 5);
  at(s, Math.sin(a) * 0.3, 0.2 + b * 0.25, Math.cos(a) * 0.3);
  s.lookAt(s.position.clone().multiplyScalar(2));
  otto.head.add(s);
  ottoSpots.push(s);
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
const OX = -0.45, OZ = 0.15;
const C = { s2: 1.75, s3: 3.4, s4: 5.75, s5: 6.95, s6: 11.0, s7: BOOM, s7b: 13.95, s8: 15.6, s9: 17.0, s10: 18.6, end: 21.0 };
const HOLD = { armL: [-1.15, -0.35, -0.75], armR: [-1.25, -0.25, -0.8] };

function render(t) {
  // defaults
  skinMat.color.copy(SKIN);
  press.visible = t >= C.s5 + 0.4;
  press.position.y = 0;
  piston.position.y = 1.85;
  needleP.rotation.z = Math.PI * 0.75 - Math.PI * 0.5; // pointing at "0"
  needleP.rotation.z = (135 * Math.PI) / 180;
  drops.forEach((d) => (d.visible = false));
  shards.forEach((d) => (d.visible = false));
  splats.forEach((s) => (s.visible = false));
  ottoSpots.forEach((s) => (s.visible = t > BOOM + 0.15));
  hero.visible = false;
  heroDrip.visible = false;
  boomFlash.visible = false;
  flashL.intensity = 0;
  jar.visible = t < BOOM;
  jar.scale.set(1, 1, 1);
  jar.userData.lid.visible = true;
  jar.userData.lid.position.set(0, 0.27, 0);
  jar.userData.lid.rotation.set(0, 0, 0);
  if (jar.parent !== scene) scene.add(jar);
  pose(otto, { x: OX, z: OZ, ry: 0.35, blink: blinkAt(t, 2), hat: t >= C.s4 + 0.12 ? 1 : 0 });

  if (t < C.s3) {
    // S1/S2 — holding the jar; then the struggle
    otto.handL.add(jar);
    jar.position.set(0.09, -0.12, 0.08);
    jar.rotation.set(-0.15, 0, 0.6);
    const strain = seg(t, 2.0, 2.2) * (1 - seg(t, 3.25, 3.4));
    const tw = Math.sin(t * 20) * strain;
    jar.userData.lid.rotation.y = tw * 0.08;
    skinMat.color.copy(SKIN).lerp(RED, strain * (0.5 + 0.4 * Math.abs(Math.sin(t * 6))));
    pose(otto, {
      x: OX, z: OZ, ry: 0.35, blink: strain ? 0 : blinkAt(t, 2), hat: 0,
      armL: HOLD.armL, armR: [-1.25 - tw * 0.08, -0.15, -0.8 + tw * 0.1],
      lid: strain ? 0.85 : 0, brow: strain ? -0.9 : 0.3, smile: strain ? -0.6 : 0.8, open: !strain && t > 0.9 && t < 1.4 ? 0.3 : 0,
      lookY: strain ? 0 : -0.5, sq: strain * 0.025 * Math.sin(t * 30), lean: strain * 0.12, nod: strain ? 0.1 : 0.25,
    });
    if (t < C.s2) {
      const k = eio(seg(t, 0, C.s2));
      cam([OX + 0.6, lerp(1.75, 1.72, k), OZ + lerp(2.1, 1.8, k)], [OX + 0.12, 1.5, OZ], 42);
    } else {
      const k = eout(seg(t, C.s2, C.s3));
      cam([OX + 0.45 + Math.sin(t * 40) * 0.004 * strain, 1.8, OZ + lerp(2.4, 2.15, k)], [OX + 0.1, 1.55, OZ], 42);
    }
  } else if (t < C.s4) {
    // S3 — "Normal people would just run it under hot water": Otto glances at the sink... nope.
    otto.handL.add(jar);
    jar.position.set(0.09, -0.12, 0.08);
    jar.rotation.set(-0.15, 0, 0.6);
    const lt = t - C.s3;
    const look = eio(seg(lt, 0.6, 0.9)) * (1 - eio(seg(lt, 1.5, 1.8)));
    const sk = seg(lt, 1.8, 2.3);
    pose(otto, { x: OX, z: OZ, ry: 0.35, blink: blinkAt(t, 2), hat: 0, ...HOLD,
      turn: -0.9 * look + Math.sin(sk * Math.PI * 4) * 0.25 * (1 - sk), lookX: -look, lid: 0.45, brow: -0.2, smile: -0.25 });
    const k = eio(seg(t, C.s3, C.s4));
    cam([lerp(-0.3, -0.4, k), 1.95, lerp(3.2, 2.9, k)], [-0.8, 1.45, -0.4], 46);
  } else if (t < C.s5) {
    // S4 — Not Otto. Hat.
    otto.handL.add(jar);
    jar.position.set(0.09, -0.12, 0.08);
    jar.rotation.set(-0.15, 0, 0.6);
    const lt = t - C.s4;
    const drop = seg(lt, 0.12, 0.42), land = seg(lt, 0.42, 0.9);
    const hatSq = drop >= 1 ? Math.exp(-land * 6) * Math.cos(land * 18) * 0.6 : 0;
    pose(otto, { x: OX, z: OZ, ry: 0.35, ...HOLD, hat: drop < 1 ? ein(drop) : 1, hatSq, lid: lerp(0, 0.45, eout(land)), brow: lerp(0.2, -1, eout(land)), smile: lerp(0, 0.55, eout(land)) });
    const k = eout(seg(lt, 0, 1.1));
    cam([OX + 0.35 + shake(t, C.s4 + 0.42, 0.02, 0.25), 1.9, OZ + lerp(1.9, 1.6, k)], [OX + 0.05, 1.7, OZ], 40);
  } else if (t < C.s7) {
    // S5/S6 — the press: rises in, jar on the anvil, gauge to 20 T, piston comes down, lid pops
    const rise = seg(t, 7.35, 7.95);
    press.position.y = -3 * (1 - spring(rise, 2, 6));
    jar.position.set(PX, 0.36, PZ);
    jar.rotation.set(0, 0, 0);
    const g = eio(seg(t, 9.1, 10.2));
    needleP.rotation.z = (135 - 230 * g + Math.sin(t * 40) * 3 * g) * Math.PI / 180;
    const down = eio(seg(t, 11.0, 11.85));
    piston.position.y = lerp(1.85, 0.67, down);
    const pop = seg(t, 11.9, 12.6);
    if (pop > 0) {
      jar.userData.lid.position.set(pop * 0.6, 0.27 + Math.sin(pop * Math.PI) * 0.4, pop * 0.35);
      jar.userData.lid.rotation.set(pop * 9, 0, pop * 6);
      const bulge = seg(t, 12.0, BOOM);
      jar.scale.set(1 + bulge * 0.35, 1 - bulge * 0.12, 1 + bulge * 0.35);
      piston.position.y = lerp(0.67, 0.36 + 0.27 * (1 - bulge * 0.12), seg(t, 11.9, 12.1));
    }
    btn.material.emissiveIntensity = t > 10.95 && t < 11.3 ? 1.5 : 0.3;
    const pressBtn = t > 10.95 && t < 11.3 ? 1 : 0;
    pose(otto, { x: 0.0, z: -0.15, ry: 0.6, hat: 1, blink: blinkAt(t, 2), armR: [-0.9 - pressBtn * 0.2, -0.05, -0.5 + pressBtn * 0.3], armL: [-0.2, 0.15, -0.3],
      turn: -0.35, lid: 0.35, brow: -0.9, smile: 0.5, lookX: 0.5 });
    if (t < C.s6) {
      const k = eio(seg(t, C.s5, C.s6));
      const a = lerp(-0.35, 0.25, k);
      cam([PX + Math.sin(a) * 3.3 - 0.3, lerp(1.9, 1.75, k), PZ + Math.cos(a) * 3.3], [PX - 0.3, 1.35, PZ], 50);
    } else {
      const k = eout(seg(t, C.s6, C.s7));
      cam([PX + 0.15, lerp(0.95, 0.85, k), PZ + lerp(1.45, 1.25, k)], [PX, 0.6, PZ], 42);
    }
  } else if (t < C.s8) {
    // S7 — BOOM
    piston.position.y = 0.36;
    const dt = t - BOOM;
    drops.forEach((d, i) => {
      const r = ballistic(i, dt, 11, 3.2);
      d.visible = !r.landed;
      d.position.copy(r.p);
      const s = splats[i];
      if (r.landed) {
        s.visible = true;
        s.position.copy(r.p);
        if (r.p.y <= 0.031) { s.rotation.set(-Math.PI / 2, 0, 0); s.position.y = 0.012 + i * 0.0002; }
        else if (r.p.y >= CEIL - 0.031) { s.rotation.set(Math.PI / 2, 0, 0); s.position.y = CEIL - 0.01; }
        else if (r.p.z <= WZ + 0.041) { s.rotation.set(0, 0, 0); s.position.z = WZ + 0.012 + i * 0.0002; }
        else { s.rotation.set(0, -Math.sign(r.p.x) * Math.PI / 2, 0); s.position.x = Math.sign(r.p.x) * 2.985; }
        s.scale.setScalar(spring(seg(t, BOOM + r.tHit, BOOM + r.tHit + 0.2), 2, 6));
      }
    });
    shards.forEach((d, i) => {
      const r = ballistic(i, dt, 77, 4.0);
      d.visible = true;
      d.position.copy(r.p);
      d.rotation.set(dt * (3 + i), dt * 5, 0);
      if (r.landed) d.rotation.set(i, i * 2, 0);
    });
    // the hero pickle flies to the ceiling
    const hp = seg(t, BOOM, BOOM + 0.45);
    hero.visible = true;
    hero.position.set(lerp(PX, -0.3, hp), lerp(0.5, CEIL - 0.04, eout(hp)), lerp(PZ, 0.35, hp));
    hero.rotation.set(hp < 1 ? t * 18 : Math.PI / 2, 0, 0.4);
    boomFlash.visible = dt < 0.35;
    boomFlash.position.set(PX, 0.55, PZ + 0.1);
    boomFlash.scale.setScalar(1 + dt * 8);
    boomFlash.material.opacity = 1 - dt / 0.35;
    flashL.intensity = 14 * Math.exp(-dt * 5);
    if (t < C.s7b) {
      const s = shake(t, BOOM, 0.06, 0.7);
      cam([PX + 0.15 + s, 0.95 + s, PZ + 1.9], [PX, 0.7, PZ], 48);
    } else {
      // wide: the whole kitchen is green. Otto stunned, juice on his face.
      pose(otto, { x: 0.0, z: -0.15, ry: 0.45, hat: 1, armR: [-0.3, 0.3, -0.4], armL: [-0.3, 0.3, -0.4],
        lid: 0, pupil: 0.55, brow: 0.9, browUp: 0.5, open: 0.6, smile: 0, blink: 0 });
      const k = eout(seg(t, C.s7b, C.s8));
      cam([0.3, lerp(2.2, 2.1, k), lerp(4.2, 3.8, k)], [0.3, 1.2, -0.6], 52);
    }
  } else {
    // aftermath state
    piston.position.y = 0.36;
    drops.forEach((d, i) => {
      const r = ballistic(i, 3, 11, 3.2);
      const s = splats[i];
      if (!r.landed) return;
      s.visible = true;
      s.position.copy(r.p);
      if (r.p.y <= 0.031) { s.rotation.set(-Math.PI / 2, 0, 0); s.position.y = 0.012 + i * 0.0002; }
      else if (r.p.y >= CEIL - 0.031) { s.rotation.set(Math.PI / 2, 0, 0); s.position.y = CEIL - 0.01; }
      else if (r.p.z <= WZ + 0.041) { s.rotation.set(0, 0, 0); s.position.z = WZ + 0.012 + i * 0.0002; }
      else { s.rotation.set(0, -Math.sign(r.p.x) * Math.PI / 2, 0); s.position.x = Math.sign(r.p.x) * 2.985; }
    });
    shards.forEach((d, i) => {
      const r = ballistic(i, 3, 77, 4.0);
      d.visible = true;
      d.position.copy(r.p);
      d.rotation.set(i, i * 2, 0);
    });
    const HP = v3(-0.3, CEIL - 0.04, 0.35);
    hero.visible = true;
    hero.rotation.set(Math.PI / 2, 0, 0.4);
    hero.position.copy(HP);
    if (t < C.s9) {
      // S8 — searching the floor
      const lt = t - C.s8;
      pose(otto, { x: -0.3, z: 0.2, ry: 0.2, hat: 1, blink: blinkAt(t, 2), lean: 0.35, nod: 0.45, turn: Math.sin(lt * 4) * 0.6,
        armL: [-0.5, 0.2, -0.4], armR: [-0.5, 0.2, -0.4], lookY: -0.8, lookX: Math.sin(lt * 4), brow: 0.5, smile: -0.2 });
      const k = eio(seg(t, C.s8, C.s9));
      cam([0.15, lerp(0.75, 0.8, k), lerp(2.4, 2.2, k)], [-0.3, 1.6, 0.2], 52);
    } else if (t < C.s10) {
      // S9 — he looks up. It's on the ceiling. (camera tilts up)
      pose(otto, { x: -0.3, z: 0.2, ry: 0.2, hat: 1, nod: -0.75, lookY: 1, brow: 0.9, browUp: 0.6, pupil: 0.8, open: 0.4, armL: [0, 0.1, 0], armR: [0, 0.1, 0] });
      heroDrip.visible = true;
      const dp = ((t - C.s9) * 1.3) % 1;
      heroDrip.position.set(HP.x, HP.y - 0.04 - dp * 0.9, HP.z);
      const k = eio(seg(t, C.s9, 17.9));
      cam([0.35, lerp(1.4, 1.2, k), 1.6], [lerp(-0.3, -0.3, k), lerp(1.6, 2.75, k), lerp(0.2, 0.35, k)], 50);
    } else {
      // S10 — the pickle drops straight into his open mouth. Worth it.
      const fall = seg(t, 18.45, 18.85);
      const headY = 0.9 + 0.74 + 0.06 + 0.15;
      const chew = t > 18.9 ? Math.abs(Math.sin((t - 18.9) * 11)) : 0;
      const look = 1 - eio(seg(t, 18.95, 19.3));
      pose(otto, { x: -0.3, z: 0.2, ry: 0.2, hat: 1, nod: -0.55 * look, lookY: look, open: t < 18.9 ? 0.8 : chew * 0.35,
        smile: t < 18.9 ? 0 : 0.85, lid: t < 18.9 ? 0 : 0.5, brow: t < 18.9 ? 0.6 : -0.2, browUp: 0.3, armL: [0, 0.1, 0], armR: [0, 0.1, 0], blink: 0,
        sq: t > 18.85 && t < 19.05 ? 0.04 : 0 });
      otto.root.updateMatrixWorld(true);
      const mouth = otto.head.localToWorld(v3(0, 0.14, 0.33));
      hero.visible = fall < 1;
      hero.position.set(lerp(HP.x, mouth.x, fall), lerp(HP.y, mouth.y, ein(fall)), lerp(HP.z, mouth.z, fall));
      hero.rotation.set(Math.PI / 2 - fall * 1.2, 0, 0.4);
      const k = eout(seg(t, C.s10, C.end));
      cam([0.05, lerp(2.05, 1.95, k), lerp(2.5, 2.2, k)], [-0.3, 1.95, 0.2], 46);
    }
  }
  renderer.render(scene, camera);
}
window.addEventListener("hf-seek", (e) => render(e.detail.time));
render(0);
