// Episode 03 — "Where do you want to eat?" — the restaurant wheel.
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
scene.background = new THREE.Color("#bfe6d8");
const camera = new THREE.PerspectiveCamera(42, W / H, 0.03, 200);

// ---------- lights ----------
const hemi = new THREE.HemisphereLight("#fff6ec", "#a88a70", 1.3);
scene.add(hemi);
const key = new THREE.DirectionalLight("#fff2de", 2.2);
key.position.set(-2.5, 6, 5);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.5, far: 25 });
key.shadow.bias = -0.0006;
key.shadow.radius = 4;
scene.add(key);
const lampL = new THREE.PointLight("#ffc27a", 0, 5, 1.5);
lampL.position.set(-1.7, 1.6, -1.2);
scene.add(lampL);

// ---------- living room ----------
const WZ = -2.2;
const floorTex = canvasTex(512, 512, (g, w, h) => {
  const cols = ["#d29a62", "#c98f57", "#d7a26a", "#c48a52"];
  for (let i = 0; i < 16; i++) {
    g.fillStyle = cols[i % 4];
    g.fillRect(0, i * 32, w, 32);
    g.fillStyle = "rgba(90,50,20,0.3)";
    g.fillRect(0, i * 32 + 30, w, 2);
    g.fillRect(hash(i) * w, i * 32, 2, 32);
  }
});
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
floorTex.repeat.set(3, 3);
const floor = mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.7 }), { shadow: false });
floor.rotation.x = -Math.PI / 2;
scene.add(floor);
const wallTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#a9dcc9";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(255,255,255,0.14)";
  for (let i = 0; i < 8; i++) g.fillRect(i * 32, 0, 12, h);
});
wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
wallTex.repeat.set(6, 2);
const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 });
const back = mesh(new THREE.PlaneGeometry(12, 3.6), wallMat, { shadow: false });
at(back, 0, 1.8, WZ);
scene.add(back);
for (const s of [1, -1]) {
  const side = mesh(new THREE.PlaneGeometry(8, 3.6), wallMat, { shadow: false });
  side.rotation.y = -s * Math.PI / 2;
  at(side, 3.6 * s, 1.8, 1.8);
  scene.add(side);
}
const rug = mesh(rbox(3.0, 0.02, 1.8, 0.01), mat("#f6b0c0", 1), { shadow: false });
at(rug, 0, 0.01, 0.1);
scene.add(rug);
// sofa
const sofa = new THREE.Group();
at(sofa, 0, 0, -1.45);
scene.add(sofa);
const SC = "#ff7f6e";
const seatM = mesh(rbox(2.3, 0.3, 0.85, 0.1), mat(SC, 0.9));
at(seatM, 0, 0.35, 0.05);
sofa.add(seatM);
const backM = mesh(rbox(2.3, 0.75, 0.3, 0.12), mat(SC, 0.9));
at(backM, 0, 0.75, -0.38);
sofa.add(backM);
for (const s of [1, -1]) {
  const arm = mesh(rbox(0.28, 0.6, 0.9, 0.12), mat("#f0675a", 0.9));
  at(arm, 1.2 * s, 0.45, 0.0);
  sofa.add(arm);
  const cush = mesh(rbox(0.4, 0.38, 0.14, 0.08), mat(s > 0 ? "#ffd35a" : "#5bb0ff", 0.95));
  cush.rotation.z = 0.2 * s;
  at(cush, 0.88 * s, 0.7, -0.18);
  sofa.add(cush);
}
const base = mesh(rbox(2.5, 0.2, 0.9, 0.04), mat("#b15c4c"));
at(base, 0, 0.1, 0.0);
sofa.add(base);
// coffee table
const ctable = mesh(rbox(1.2, 0.07, 0.6, 0.03), mat("#f2e3c8", 0.6));
at(ctable, 0, 0.42, -0.2);
scene.add(ctable);
for (const [x, z] of [[-0.52, -0.45], [0.52, -0.45], [-0.52, 0.05], [0.52, 0.05]]) {
  const l = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), mat("#7c5a3c"));
  at(l, x, 0.2, z);
  scene.add(l);
}
// pizza box (for the ending)
const pizza = new THREE.Group();
at(pizza, 0, 0.47, -0.2);
scene.add(pizza);
const pbox = mesh(rbox(0.5, 0.05, 0.5, 0.01), mat("#e9c690", 0.8));
pizza.add(pbox);
const lid = mesh(rbox(0.5, 0.02, 0.5, 0.01), mat("#e9c690", 0.8));
lid.position.set(0, -0.01, -0.52);
pizza.add(lid);
const pie = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 32, 1, false, 0, Math.PI * 2 * 0.75), mat("#f2b33d", 0.8));
pie.position.y = 0.04;
pizza.add(pie);
for (let i = 0; i < 9; i++) {
  const a = hash(i * 3) * Math.PI * 1.5, r = 0.05 + hash(i * 7) * 0.13;
  const pp = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 14), mat("#c0392b", 0.7));
  at(pp, Math.sin(a) * r, 0.06, Math.cos(a) * r);
  pizza.add(pp);
}
// window (sky changes day -> night)
const skyMat = new THREE.MeshBasicMaterial({ color: "#9fd8ff", toneMapped: false });
const sky = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.95), skyMat);
at(sky, -2.0, 1.85, WZ + 0.01);
scene.add(sky);
const moon = new THREE.Mesh(new THREE.CircleGeometry(0.08, 20), new THREE.MeshBasicMaterial({ color: "#fff4cf", toneMapped: false }));
at(moon, -1.75, 2.1, WZ + 0.015);
scene.add(moon);
for (const [w, h, x, y] of [[1.22, 0.07, 0, 0.51], [1.22, 0.07, 0, -0.51], [0.07, 1.08, 0.58, 0], [0.07, 1.08, -0.58, 0], [0.05, 0.95, 0, 0], [1.1, 0.05, 0, 0]]) {
  const f = mesh(new THREE.BoxGeometry(w, h, 0.06), mat("#ffffff", 0.5));
  at(f, -2.0 + x, 1.85 + y, WZ + 0.03);
  scene.add(f);
}
// floor lamp
const pole = mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.5, 8), mat("#333"));
at(pole, -1.7, 0.75, -1.5);
scene.add(pole);
const lshade = mesh(new THREE.CylinderGeometry(0.15, 0.25, 0.3, 20, 1, true), new THREE.MeshStandardMaterial({ color: "#fff1d0", emissive: "#ffc27a", emissiveIntensity: 0.2, side: THREE.DoubleSide }));
at(lshade, -1.7, 1.55, -1.5);
scene.add(lshade);
// wall clock (above sofa)
const clockFace = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 32), mat("#ffffff", 0.4));
clockFace.rotation.x = Math.PI / 2;
at(clockFace, 0, 2.35, WZ + 0.03);
scene.add(clockFace);
const clockRim = mesh(new THREE.TorusGeometry(0.22, 0.025, 8, 32), mat("#ff7f6e", 0.5));
at(clockRim, 0, 2.35, WZ + 0.05);
scene.add(clockRim);
for (let i = 0; i < 12; i++) {
  const tk = mesh(new THREE.BoxGeometry(0.012, 0.035, 0.01), mat("#333"), { shadow: false });
  const a = (i / 12) * Math.PI * 2;
  at(tk, Math.sin(a) * 0.18, 2.35 + Math.cos(a) * 0.18, WZ + 0.06);
  tk.rotation.z = -a;
  scene.add(tk);
}
const hourHand = new THREE.Group(), minHand = new THREE.Group();
at(hourHand, 0, 2.35, WZ + 0.07);
at(minHand, 0, 2.35, WZ + 0.075);
const hh = mesh(new THREE.BoxGeometry(0.02, 0.11, 0.01), mat("#222"), { shadow: false });
hh.position.y = 0.05;
hourHand.add(hh);
const mh = mesh(new THREE.BoxGeometry(0.014, 0.16, 0.01), mat("#222"), { shadow: false });
mh.position.y = 0.075;
minHand.add(mh);
scene.add(hourHand, minHand);
function setClock(hours) {
  minHand.rotation.z = -((hours % 1) * Math.PI * 2);
  hourHand.rotation.z = -(((hours % 12) / 12) * Math.PI * 2);
}
// plant
const pot = mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.36, 18), mat("#ffd35a"));
at(pot, 1.65, 0.18, -1.7);
scene.add(pot);
for (let i = 0; i < 7; i++) {
  const leaf = mesh(new THREE.SphereGeometry(0.17, 12, 8), mat("#3fa35a"));
  leaf.scale.set(0.6, 1.5, 0.35);
  const a = (i / 7) * Math.PI * 2;
  at(leaf, 1.65 + Math.cos(a) * 0.12, 0.62 + hash(i) * 0.15, -1.7 + Math.sin(a) * 0.12);
  leaf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
  scene.add(leaf);
}

// ---------- THE WHEEL ----------
const FOODS = [
  ["PIZZA", "#ff5a4e"], ["SUSHI", "#3fb6a8"], ["TACOS", "#ffc81a"], ["BURGER", "#8a5bd6"],
  ["RAMEN", "#ff8a3d"], ["SALAD", "#5cc96b"], ["PASTA", "#ff6fa5"], ["THAI", "#3d8bff"],
  ["KEBAB", "#ffb02e"], ["WINGS", "#e0453a"], ["CURRY", "#2fb7d6"], ["DONUTS", "#c76bf0"],
];
const NS = FOODS.length;
const wheelTex = canvasTex(1024, 1024, (g, w, h) => {
  const cx = 512, cy = 512, R = 508;
  FOODS.forEach(([name, col], i) => {
    const a0 = -Math.PI / 2 + (i - 0.5) * (Math.PI * 2 / NS), a1 = a0 + Math.PI * 2 / NS;
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(cx, cy);
    g.arc(cx, cy, R, a0, a1);
    g.closePath();
    g.fill();
    g.strokeStyle = "#ffffff";
    g.lineWidth = 8;
    g.stroke();
    g.save();
    g.translate(cx, cy);
    g.rotate((a0 + a1) / 2);
    g.fillStyle = "#ffffff";
    g.font = "900 64px 'Archivo Black', sans-serif";
    g.textAlign = "right";
    g.textBaseline = "middle";
    g.lineWidth = 10;
    g.strokeStyle = "rgba(0,0,0,0.35)";
    g.strokeText(name, R - 34, 0);
    g.fillText(name, R - 34, 0);
    g.restore();
  });
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.arc(cx, cy, 80, 0, 7);
  g.fill();
  g.fillStyle = "#ffc81a";
  g.beginPath();
  g.arc(cx, cy, 56, 0, 7);
  g.fill();
});
const WHEEL = v3(1.75, 1.45, -1.55);
const wheelRig = new THREE.Group();
at(wheelRig, WHEEL.x, 0, WHEEL.z);
wheelRig.rotation.y = -0.45;
scene.add(wheelRig);
const wheel = new THREE.Group();
wheel.position.y = 1.45;
wheelRig.add(wheel);
const disc = mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.08, 64), mat("#ffffff", 0.5));
disc.rotation.x = Math.PI / 2;
const face = mesh(new THREE.CircleGeometry(0.95, 64), new THREE.MeshStandardMaterial({ map: wheelTex, roughness: 0.6 }), { shadow: false });
face.position.z = 0.042;
wheel.add(face);
// cylinder cap UVs: rotate texture so index 0 is at the top
disc.rotation.y = 0;
wheel.add(disc);
const hub = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 20), mat("#ffc81a", 0.4));
hub.rotation.x = Math.PI / 2;
wheel.add(hub);
for (let i = 0; i < NS; i++) {
  const a = (i + 0.5) / NS * Math.PI * 2;
  const peg = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8), mat("#ffffff", 0.3));
  peg.rotation.x = Math.PI / 2;
  at(peg, Math.sin(a) * 0.9, Math.cos(a) * 0.9, 0.06);
  wheel.add(peg);
}
const ring = mesh(new THREE.TorusGeometry(0.97, 0.04, 10, 64), mat("#ffc81a", 0.35, { metalness: 0.3 }));
wheel.add(ring);
// stand
for (const s of [1, -1]) {
  const leg = mesh(rbox(0.1, 1.6, 0.1, 0.03), mat("#4b6fe0"));
  leg.rotation.z = 0.25 * s;
  at(leg, 0.32 * s, 0.75, -0.12);
  wheelRig.add(leg);
}
const foot = mesh(rbox(1.2, 0.08, 0.5, 0.03), mat("#4b6fe0"));
at(foot, 0, 0.04, -0.12);
wheelRig.add(foot);
const pointer = new THREE.Group();
at(pointer, 0, 1.45 + 1.08, 0.08);
wheelRig.add(pointer);
const ps = new THREE.Shape();
ps.moveTo(-0.09, 0.08); ps.lineTo(0.09, 0.08); ps.lineTo(0, -0.14); ps.closePath();
const pm = mesh(new THREE.ExtrudeGeometry(ps, { depth: 0.05, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2 }), mat("#ff3b3b", 0.4));
pointer.add(pm);
// spin counter sign on the stand
const counterCanvas = document.createElement("canvas");
counterCanvas.width = 512;
counterCanvas.height = 192;
const counterTex = new THREE.CanvasTexture(counterCanvas);
counterTex.colorSpace = THREE.SRGBColorSpace;
let lastCount = -1;
function drawCounter(n) {
  if (n === lastCount) return;
  lastCount = n;
  const g = counterCanvas.getContext("2d");
  g.fillStyle = "#1d1a22";
  g.fillRect(0, 0, 512, 192);
  g.fillStyle = "#e6ff3d";
  g.font = "900 104px 'Archivo Black', sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("SPIN #" + n, 256, 100);
  counterTex.needsUpdate = true;
}
drawCounter(1);
const counter = mesh(rbox(0.7, 0.28, 0.04, 0.02), mat("#1d1a22"));
at(counter, 0, 0.32, 0.03);
wheelRig.add(counter);
const counterFace = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.24), new THREE.MeshBasicMaterial({ map: counterTex, toneMapped: false }));
at(counterFace, 0, 0.32, 0.055);
wheelRig.add(counterFace);
// lever
const lever = new THREE.Group();
at(lever, -0.75, 0.55, 0.05);
wheelRig.add(lever);
const lstick = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8), mat("#9aa3b5", 0.3, { metalness: 0.6 }));
lstick.position.y = 0.25;
lever.add(lstick);
const lknob = mesh(new THREE.SphereGeometry(0.06, 14, 10), mat("#ff3b3b", 0.4));
lknob.position.y = 0.5;
lever.add(lknob);
const lbase = mesh(rbox(0.2, 0.12, 0.2, 0.03), mat("#4b6fe0"));
at(lbase, -0.75, 0.5, 0.05);
wheelRig.add(lbase);
const lpost = mesh(new THREE.BoxGeometry(0.06, 0.5, 0.06), mat("#4b6fe0"));
at(lpost, -0.75, 0.25, 0.05);
wheelRig.add(lpost);

// ---------- food "nope" signs over Mia ----------
function signTex(label, col) {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = "#ffffff";
    g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill();
    g.fillStyle = col;
    g.beginPath(); g.arc(128, 128, 104, 0, 7); g.fill();
    g.fillStyle = "#ffffff";
    g.font = "900 46px 'Archivo Black', sans-serif";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(label, 128, 132);
  });
}
const xTex = canvasTex(256, 256, (g) => {
  g.strokeStyle = "#ff2a2a";
  g.lineWidth = 30; g.lineCap = "round";
  g.beginPath(); g.moveTo(50, 50); g.lineTo(206, 206); g.moveTo(206, 50); g.lineTo(50, 206); g.stroke();
});
const signs = [["SUSHI", "#3fb6a8"], ["TACOS", "#ffc81a"], ["BURGER", "#8a5bd6"], ["PIZZA", "#ff5a4e"]].map(([l, c]) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: signTex(l, c), transparent: true }));
  const x = new THREE.Sprite(new THREE.SpriteMaterial({ map: xTex, transparent: true, depthTest: false }));
  scene.add(s, x);
  return { s, x };
});

// ---------- characters ----------
const otto = makeOtto();
scene.add(otto.root);
const mia = makeOtto({
  pal: { hoodie: "#43b9a8", hoodieDark: "#2f9a8a", hair: "#4a2a1a", pants: "#6a5aa8", skin: "#eeb894", lip: "#c2455a", accent: "#ff5f8f" },
  mustache: false, hat: false, longHair: true, lashes: true,
});
scene.add(mia.root);
const slice = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.025, 3, 1, false, 0, Math.PI / 3.2), mat("#f2b33d", 0.8));
mia.handL.add(slice);
at(slice, 0, -0.05, 0.08);
slice.rotation.set(1.2, 0, 0);
const sweat = mesh(new THREE.SphereGeometry(0.04, 12, 10), new THREE.MeshStandardMaterial({ color: "#7fd0ff", roughness: 0.1, transparent: true, opacity: 0.85 }), { shadow: false });
sweat.scale.set(0.8, 1.3, 0.6);
otto.head.add(sweat);

// ---------- helpers ----------
function cam(pos, look, fov = 42) {
  camera.position.set(pos[0], pos[1], pos[2]);
  camera.lookAt(look[0], look[1], look[2]);
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
}
const shake = (t, t0, a, d) => {
  const k = seg(t, t0, t0 + d);
  return k <= 0 || k >= 1 ? 0 : Math.sin(t * 93) * a * (1 - k);
};
const SOFA_Z = -1.35;
const SIT = { hipY: 0.62, legL: -1.05, legR: -1.05, lean: -0.08 };
const OX = -0.5, MX = 0.5;
const OTTO = (t, e = {}) => ({ x: OX, z: SOFA_Z, ry: 0.15, ...SIT, blink: blinkAt(t, 5), armL: [-0.35, 0.15, -0.6], armR: [-0.35, 0.15, -0.6], hat: 0, ...e });
const MIA = (t, e = {}) => ({ x: MX, z: SOFA_Z, ry: -0.15, ...SIT, blink: blinkAt(t, 11), hat: 0, smile: 0.5, armL: [-0.35, 0.15, -0.6], armR: [-0.35, 0.15, -0.6], ...e });
const C = { s2: 2.75, s3: 4.25, s4: 6.15, s5: 7.95, s6: 9.15, s7: 13.45, s8: 14.55, s9: 16.25, s10: 19.35, s11: 21.5, end: 23.5 };
const SPIN1 = [12.25, 13.5]; // first spin: lever pull -> lands on PIZZA

function showSign(i, t, tIn, tX) {
  const { s, x } = signs[i];
  const k = seg(t, tIn, tIn + 0.25);
  s.visible = k > 0;
  s.scale.setScalar(0.34 * spring(k, 2.5, 6) + 0.0001);
  const kx = seg(t, tX, tX + 0.15);
  x.visible = kx > 0;
  x.scale.setScalar(0.36 * eout(kx) + 0.0001);
  return { s, x };
}

function render(t) {
  // defaults
  signs.forEach(({ s, x }) => (s.visible = x.visible = false));
  sweat.visible = false;
  slice.visible = false;
  pizza.visible = t >= C.s10;
  wheelRig.visible = t >= C.s6 + 0.2;
  wheelRig.position.y = 0;
  lever.rotation.x = 0;
  drawCounter(1);
  // day -> night with the clock
  const night = seg(t, 16.4, 19.2);
  skyMat.color.set(new THREE.Color("#9fd8ff").lerp(new THREE.Color("#141c4a"), night));
  moon.visible = night > 0.6;
  hemi.intensity = lerp(1.3, 0.55, night);
  key.intensity = lerp(2.2, 0.35, night);
  lampL.intensity = lerp(0, 3.2, night);
  lshade.material.emissiveIntensity = lerp(0.2, 1.0, night);
  scene.background = new THREE.Color("#bfe6d8").lerp(new THREE.Color("#2a3352"), night);
  setClock(t < 16.4 ? 19.0 : lerp(19.0, 26.0, eio(seg(t, 16.4, 19.2))));
  // wheel angle
  let ang = 0;
  if (t >= SPIN1[0]) ang = -(6 * Math.PI * 2) * eout(seg(t, SPIN1[0], SPIN1[1]));
  if (t >= 16.6 && t < 19.2) ang = -(t - 16.6) * 26;
  wheel.rotation.z = ang;
  pose(otto, OTTO(t));
  pose(mia, MIA(t));

  if (t < C.s2) {
    // S1 — sofa two-shot: Otto asks
    pose(otto, OTTO(t, { turn: 0.55, smile: 0.6, browUp: 0.4, lookX: 0.6, armR: [-0.7, 0.2, -1.2] }));
    pose(mia, MIA(t, { turn: -0.15, smile: 0.3, lookX: 0.3, lookY: -0.3, armL: [-0.9, -0.1, -1.2], armR: [-0.9, -0.1, -1.2] }));
    const k = eio(seg(t, 0, C.s2));
    cam([0, lerp(1.6, 1.55, k), lerp(2.6, 2.15, k)], [0, 1.25, SOFA_Z], 46);
  } else if (t < C.s3) {
    // S2 — "anything." shrug
    const sh = spring(seg(t, 3.75, 4.1), 2.5, 6);
    pose(mia, MIA(t, { armL: [-0.4, 0.55 * sh, -1.5 * sh], armR: [-0.4, 0.55 * sh, -1.5 * sh], turn: -0.25, headTilt: 0.18 * sh, smile: 0.6, lid: 0.25, browUp: 0.6 * sh, lookX: -0.4 }));
    const k = eout(seg(t, C.s2, C.s3));
    cam([MX - 0.15, 1.72, lerp(0.75, 0.55, k)], [MX, 1.55, SOFA_Z], 42);
  } else if (t < C.s6) {
    if (t < C.s4) {
      // S3 — no to everything: signs pop + X, head shake per sign
      const ins = [4.45, 4.85, 5.25], xs = [4.62, 5.02, 5.42];
      let shakeAmt = 0;
      ins.forEach((ti, i) => {
        const { s, x } = showSign(i, t, ti, xs[i]);
        const a = -0.9 + i * 0.9;
        s.position.set(MX + Math.sin(a) * 0.55, 2.15 + Math.cos(a) * 0.1, SOFA_Z + 0.2);
        x.position.copy(s.position).add(v3(0, 0, 0.01));
        const d = t - xs[i];
        if (d > 0 && d < 0.35) shakeAmt = Math.sin(d / 0.35 * Math.PI * 4) * (1 - d / 0.35);
      });
      pose(mia, MIA(t, { turn: shakeAmt * 0.35, lid: 0.3, brow: -0.3, smile: -0.3, armL: [-0.3, -0.35, -1.6], armR: [-0.25, -0.4, -1.55] }));
      const k = eout(seg(t, C.s3, C.s4));
      cam([MX, 1.75, lerp(1.45, 1.3, k)], [MX, 1.75, SOFA_Z], 46);
    } else if (t < C.s5) {
      // S4 — Otto deadpan to camera
      const sk = seg(t, 7.2, 7.8);
      pose(otto, OTTO(t, { turn: Math.sin(sk * Math.PI * 4) * 0.25 * (1 - sk), lid: 0.45, smile: -0.25, brow: -0.2 }));
      const k = eio(seg(t, C.s4, C.s5));
      cam([OX + 0.05, 1.7, lerp(0.75, 0.6, k)], [OX, 1.6, SOFA_Z], 40);
    } else {
      // S5 — Not Otto. Hat.
      const lt = t - C.s5;
      const drop = seg(lt, 0.12, 0.42), land = seg(lt, 0.42, 0.9);
      const hatSq = drop >= 1 ? Math.exp(-land * 6) * Math.cos(land * 18) * 0.6 : 0;
      pose(otto, OTTO(t, { hat: drop < 1 ? ein(drop) : 1, hatSq, lid: lerp(0, 0.45, eout(land)), brow: lerp(0.2, -1, eout(land)), smile: lerp(0, 0.55, eout(land)), blink: 0 }));
      const k = eout(seg(lt, 0, 1.1));
      cam([OX + shake(t, C.s5 + 0.42, 0.02, 0.25), 1.75, lerp(0.85, 0.6, k)], [OX, 1.68, SOFA_Z], 38);
    }
  } else if (t < C.s7) {
    // S6 — the wheel rises; Otto pulls the lever; spin
    const rise = seg(t, 9.45, 10.0);
    wheelRig.visible = rise > 0;
    wheelRig.position.y = -2.6 * (1 - spring(rise, 2, 6));
    const pull = t > 12.05 ? Math.sin(seg(t, 12.05, 12.5) * Math.PI) : 0;
    lever.rotation.x = pull * 0.9;
    // Otto standing next to the lever
    pose(otto, { x: 0.65, z: -1.0, ry: 0.5, hipY: 0.9, hat: 1, blink: blinkAt(t, 5),
      armR: [-0.4 - pull * 0.5, -0.2, -0.5], armL: [0, 0.1, -0.1], turn: -0.4, lid: 0.35, brow: -0.8, smile: 0.55, lookX: 0.4 });
    pose(mia, MIA(t, { x: -0.3, turn: 0.4, open: rise > 0 ? 0.5 : 0, browUp: 0.7, pupil: 0.8, lookX: 1 }));
    const k = eio(seg(t, C.s6, C.s7));
    cam([lerp(0.6, 0.9, k), lerp(1.75, 1.7, k), lerp(3.6, 3.2, k)], [lerp(0.8, 1.2, k), 1.3, -1.3], 48);
  } else if (t < C.s8) {
    // S7 — close on the pointer: PIZZA
    wheelRig.visible = true;
    const p = new THREE.Vector3();
    pointer.getWorldPosition(p);
    const k = eout(seg(t, C.s7, C.s8));
    const fwd = v3(Math.sin(-0.45), 0, Math.cos(-0.45));
    const c = p.clone().add(v3(0, -0.35, 0));
    const pos = c.clone().add(fwd.multiplyScalar(lerp(1.5, 1.3, k)));
    cam([pos.x, pos.y + 0.1, pos.z], [c.x, c.y, c.z], 40);
  } else if (t < C.s9) {
    // S8 — "not pizza."
    const { s, x } = showSign(3, t, C.s8 + 0.1, 15.62);
    s.position.set(MX + 0.45, 2.15, SOFA_Z + 0.25);
    x.position.copy(s.position).add(v3(0, 0, 0.01));
    const d = t - 15.62;
    const shk = d > 0 && d < 0.45 ? Math.sin(d / 0.45 * Math.PI * 4) * (1 - d / 0.45) : 0;
    pose(mia, MIA(t, { turn: shk * 0.35 - 0.1, lid: 0.35, brow: -0.9, smile: -0.55, armL: [-0.3, -0.35, -1.6], armR: [-0.25, -0.4, -1.55] }));
    const k = eout(seg(t, C.s8, C.s9));
    cam([MX + 0.1, 1.85, lerp(1.6, 1.4, k)], [MX + 0.1, 1.75, SOFA_Z], 44);
  } else if (t < C.s10) {
    // S9 — 47 spins: counter, day -> night, Otto exhausted
    wheelRig.visible = true;
    const n = Math.max(2, Math.min(47, Math.floor(2 + 45 * seg(t, 16.6, 19.0))));
    drawCounter(n);
    lever.rotation.x = Math.abs(Math.sin(t * 14)) * 0.8;
    const tired = seg(t, 16.4, 19.2);
    pose(otto, { x: 0.65, z: -1.0, ry: 0.5, hipY: 0.9, hat: 1, armR: [-0.4 - Math.abs(Math.sin(t * 14)) * 0.5, -0.2, -0.5], armL: [0, 0.1, -0.1],
      turn: -0.3, lid: lerp(0.3, 0.7, tired), brow: 0.4, smile: lerp(0.3, -0.3, tired), lean: tired * 0.25, nod: tired * 0.2, sq: 0 });
    sweat.visible = tired > 0.3;
    sweat.position.set(0.27, 0.5 - ((t * 0.7) % 1) * 0.2, 0.18);
    pose(mia, MIA(t, { x: -0.3, turn: 0.4, lid: lerp(0.2, 0.75, tired), smile: -0.3, brow: -0.5, nod: tired * 0.25, headTilt: tired * 0.25 }));
    const k = eio(seg(t, C.s9, C.s10));
    cam([lerp(0.3, 0.2, k), 1.8, lerp(4.2, 3.9, k)], [0.6, 1.45, -1.4], 50);
  } else if (t < C.s11) {
    // S10 — 2 a.m. pizza on the sofa
    wheelRig.visible = true;
    drawCounter(47);
    slice.visible = true;
    const chew = Math.abs(Math.sin(t * 10));
    pose(mia, MIA(t, { armL: [-1.25, -0.15, -1.6], lid: 0.2, smile: 0.8, open: chew * 0.4, turn: -0.1, nod: 0.05 }));
    pose(otto, OTTO(t, { hat: 1, lid: 0.7, smile: 0.1, nod: 0.15, headTilt: -0.15, lean: 0.05 }));
    const k = eout(seg(t, C.s10, C.s11));
    cam([0, lerp(1.7, 1.65, k), lerp(2.8, 2.5, k)], [0, 1.2, SOFA_Z], 46);
  } else {
    // S11 — "Worth it." tired thumbs up
    wheelRig.visible = true;
    drawCounter(47);
    slice.visible = true;
    const up = spring(seg(t, 21.65, 22.1), 2.5, 6);
    pose(otto, OTTO(t, { hat: 1, armR: [-0.35 - 0.85 * up, -0.25 * up, -0.6 - 1.0 * up], lid: 0.62, smile: 0.75, browUp: 0.2, nod: 0.05 }));
    pose(mia, MIA(t, { armL: [-1.25, -0.15, -1.6], lid: 0.2, smile: 0.8, open: Math.abs(Math.sin(t * 10)) * 0.4, turn: -0.1 }));
    const k = eout(seg(t, C.s11, C.end));
    cam([OX + 0.1, 1.7, lerp(1.75, 1.5, k)], [OX + 0.05, 1.45, SOFA_Z], 44);
  }
  renderer.render(scene, camera);
}
window.addEventListener("hf-seek", (e) => render(e.detail.time));
render(0);
