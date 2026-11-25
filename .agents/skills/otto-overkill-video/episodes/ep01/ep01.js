// Episode 01 — "Phone at 1%" — scene, shots and render(t).
import {
  THREE, clamp, lerp, seg, eio, eout, ein, eback, spring, hash, v3, lerpV,
  mat, glowMat, rbox, mesh, at, canvasTex, glowSprite, makeOtto, pose, blinkAt,
  makePhone, batteryScreen, makeCharger, PAL,
} from "./otto-kit.js";

const W = 1080, H = 1920;
const canvas = document.getElementById("stage");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, W / H, 0.03, 400);

// ============ LIGHTS ============
const hemi = new THREE.HemisphereLight("#dfe8ff", "#9a7b62", 1.25);
scene.add(hemi);
const key = new THREE.DirectionalLight("#fff1dc", 2.3);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = -6; key.shadow.camera.right = 6;
key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
key.shadow.camera.near = 0.5; key.shadow.camera.far = 30;
key.shadow.bias = -0.0006;
key.shadow.radius = 4;
scene.add(key, key.target);
const lamp = new THREE.PointLight("#ffbe73", 3.0, 7, 1.6);
scene.add(lamp);
const phoneLight = new THREE.PointLight("#7fb6ff", 0, 2.6, 1.5);
scene.add(phoneLight);
const sparkLight = new THREE.PointLight("#bfe4ff", 0, 6, 1.4);
scene.add(sparkLight);

// ============ BEDROOM (origin) ============
const room = new THREE.Group();
scene.add(room);
const RX0 = -3.2, RX1 = 7.6, RZ0 = -3.0, RZ1 = 3.5;

const floorTex = canvasTex(1024, 512, (g, w, h) => {
  const cols = ["#c98f57", "#c3884f", "#cf975f", "#bf844c"];
  for (let i = 0; i < 16; i++) {
    g.fillStyle = cols[i % 4];
    g.fillRect(0, i * 32, w, 32);
    g.fillStyle = "rgba(90,50,20,0.35)";
    g.fillRect(0, i * 32 + 30, w, 2);
    const off = hash(i) * w;
    g.fillRect(off, i * 32, 2, 32);
  }
});
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
floorTex.repeat.set(3, 3);
const floor = mesh(new THREE.PlaneGeometry(RX1 - RX0, RZ1 - RZ0), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.7 }), { shadow: false });
floor.rotation.x = -Math.PI / 2;
at(floor, (RX0 + RX1) / 2, 0, (RZ0 + RZ1) / 2);
room.add(floor);

const wallTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = "#cfbdea";
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 16; i++) {
    g.fillStyle = i % 2 ? "rgba(255,255,255,0.13)" : "rgba(150,120,200,0.08)";
    g.fillRect(i * 32, 0, 16, h);
  }
  for (let i = 0; i < 60; i++) {
    g.fillStyle = "rgba(255,255,255,0.35)";
    g.beginPath();
    g.arc(hash(i) * w, hash(i + 99) * h, 2.5, 0, 7);
    g.fill();
  }
});
wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
wallTex.repeat.set(6, 2);
const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.92 });
const backWall = mesh(new THREE.PlaneGeometry(RX1 - RX0, 3.4), wallMat, { shadow: false });
at(backWall, (RX0 + RX1) / 2, 1.7, RZ0);
room.add(backWall);
const leftWall = mesh(new THREE.PlaneGeometry(RZ1 - RZ0, 3.4), wallMat, { shadow: false });
leftWall.rotation.y = Math.PI / 2;
at(leftWall, RX0, 1.7, (RZ0 + RZ1) / 2);
room.add(leftWall);
const rightWall = mesh(new THREE.PlaneGeometry(RZ1 - RZ0, 3.4), wallMat, { shadow: false });
rightWall.rotation.y = -Math.PI / 2;
at(rightWall, RX1, 1.7, (RZ0 + RZ1) / 2);
room.add(rightWall);
// skirting
for (const [w, x, z, ry] of [[RX1 - RX0, (RX0 + RX1) / 2, RZ0 + 0.02, 0], [RZ1 - RZ0, RX0 + 0.02, (RZ0 + RZ1) / 2, Math.PI / 2], [RZ1 - RZ0, RX1 - 0.02, (RZ0 + RZ1) / 2, -Math.PI / 2]]) {
  const s = mesh(new THREE.BoxGeometry(w, 0.12, 0.03), mat("#f4eefc", 0.6), { shadow: false });
  s.rotation.y = ry;
  at(s, x, 0.06, z);
  room.add(s);
}
// ceiling (for interior bounce look in wide shots)
const ceil = mesh(new THREE.PlaneGeometry(RX1 - RX0, RZ1 - RZ0), mat("#f3eef8", 1), { shadow: false });
ceil.rotation.x = Math.PI / 2;
at(ceil, (RX0 + RX1) / 2, 3.4, (RZ0 + RZ1) / 2);
room.add(ceil);

// window with night sky
const win = new THREE.Group();
at(win, 0.9, 1.75, RZ0 + 0.01);
room.add(win);
const skyTex = canvasTex(256, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, "#1a2a6a");
  gr.addColorStop(1, "#3f5fb0");
  g.fillStyle = gr;
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    g.fillStyle = "rgba(255,255,255," + (0.4 + hash(i) * 0.6) + ")";
    g.fillRect(hash(i + 3) * w, hash(i + 7) * h * 0.8, 2, 2);
  }
  g.fillStyle = "#fff6d6";
  g.beginPath();
  g.arc(180, 70, 26, 0, 7);
  g.fill();
});
const sky = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.05), new THREE.MeshBasicMaterial({ map: skyTex, toneMapped: false }));
win.add(sky);
for (const [w, h, x, y] of [[1.46, 0.08, 0, 0.56], [1.46, 0.08, 0, -0.56], [0.08, 1.2, 0.69, 0], [0.08, 1.2, -0.69, 0], [0.05, 1.05, 0, 0], [1.3, 0.05, 0, 0]]) {
  const f = mesh(new THREE.BoxGeometry(w, h, 0.07), mat("#ffffff", 0.5));
  at(f, x, y, 0.03);
  win.add(f);
}
const sill = mesh(rbox(1.6, 0.06, 0.22, 0.02), mat("#ffffff", 0.5));
at(sill, 0, -0.62, 0.1);
win.add(sill);
// curtains
for (const s of [1, -1]) {
  const c = mesh(rbox(0.35, 1.5, 0.08, 0.04), mat("#5cc0b5", 0.95));
  at(c, 0.95 * s, -0.05, 0.12);
  win.add(c);
}

// bed (back-left)
const bed = new THREE.Group();
room.add(bed);
const BX = -1.85, BZ = -1.85;
const frame = mesh(rbox(1.75, 0.32, 2.35, 0.06), mat("#a8683a", 0.7));
at(frame, BX, 0.2, BZ);
bed.add(frame);
const headboard = mesh(rbox(1.85, 1.1, 0.12, 0.05), mat("#a8683a", 0.7));
at(headboard, BX, 0.62, RZ0 + 0.08);
bed.add(headboard);
const mattress = mesh(rbox(1.65, 0.24, 2.2, 0.1), mat("#fbfaf6", 0.9));
at(mattress, BX, 0.47, BZ + 0.02);
bed.add(mattress);
const pillow = mesh(rbox(0.9, 0.2, 0.45, 0.1), mat("#ffffff", 0.95));
at(pillow, BX, 0.66, RZ0 + 0.42);
pillow.rotation.x = -0.35;
bed.add(pillow);
const blanket = mesh(rbox(1.72, 0.2, 1.55, 0.09), mat("#3aa6a0", 0.95));
at(blanket, BX, 0.66, BZ + 0.36);
bed.add(blanket);
const fold = mesh(rbox(1.73, 0.1, 0.26, 0.05), mat("#f6f1e6", 0.95));
at(fold, BX, 0.73, BZ - 0.36);
bed.add(fold);

// nightstand + lamp
const ns = mesh(rbox(0.6, 0.55, 0.5, 0.04), mat("#e9d5b5", 0.7));
at(ns, -0.6, 0.28, RZ0 + 0.35);
room.add(ns);
const lampBase = mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.3, 16), mat("#4b6fe0", 0.5));
at(lampBase, -0.6, 0.7, RZ0 + 0.35);
room.add(lampBase);
const shade = mesh(new THREE.CylinderGeometry(0.14, 0.24, 0.26, 20, 1, true), new THREE.MeshStandardMaterial({ color: "#fff3d6", emissive: "#ffcf86", emissiveIntensity: 0.9, side: THREE.DoubleSide }));
at(shade, -0.6, 0.98, RZ0 + 0.35);
room.add(shade);
lamp.position.set(-0.6, 1.0, RZ0 + 0.5);

// framed blueprint above bed
const bp = canvasTex(256, 200, (g, w, h) => {
  g.fillStyle = "#2453a8";
  g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(255,255,255,0.8)";
  g.lineWidth = 3;
  g.beginPath();
  g.arc(128, 100, 42, 0, 7);
  g.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.strokeRect(128 + Math.cos(a) * 52 - 8, 100 + Math.sin(a) * 52 - 8, 16, 16);
  }
  g.strokeStyle = "rgba(255,255,255,0.35)";
  g.lineWidth = 1;
  for (let i = 0; i < w; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); }
  for (let i = 0; i < h; i += 16) { g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
});
const bpFrame = mesh(rbox(0.95, 0.78, 0.05, 0.02), mat("#3b2a20", 0.6));
at(bpFrame, BX, 1.85, RZ0 + 0.03);
room.add(bpFrame);
const bpPic = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.65), new THREE.MeshStandardMaterial({ map: bp, roughness: 0.8 }));
at(bpPic, BX, 1.85, RZ0 + 0.06);
room.add(bpPic);

// rug
const rug = mesh(new THREE.CircleGeometry(1.3, 40), mat("#f3a8b8", 1), { shadow: false });
rug.rotation.x = -Math.PI / 2;
at(rug, 1.6, 0.005, 0.2);
room.add(rug);
const rug2 = mesh(new THREE.RingGeometry(0.9, 1.05, 40), mat("#ffffff", 1), { shadow: false });
rug2.rotation.x = -Math.PI / 2;
at(rug2, 1.6, 0.007, 0.2);
room.add(rug2);

// desk + chair mid-room on back wall
const desk = mesh(rbox(1.5, 0.08, 0.7, 0.02), mat("#f2e3c8", 0.6));
at(desk, 3.4, 0.78, RZ0 + 0.4);
room.add(desk);
for (const [x, z] of [[2.72, RZ0 + 0.1], [4.08, RZ0 + 0.1], [2.72, RZ0 + 0.7], [4.08, RZ0 + 0.7]]) {
  const l = mesh(new THREE.BoxGeometry(0.06, 0.76, 0.06), mat("#7c5a3c"));
  at(l, x, 0.38, z);
  room.add(l);
}
const monitor = mesh(rbox(0.7, 0.42, 0.05, 0.02), mat("#26262e", 0.4));
at(monitor, 3.4, 1.15, RZ0 + 0.25);
room.add(monitor);
const mstand = mesh(new THREE.BoxGeometry(0.06, 0.2, 0.06), mat("#26262e"));
at(mstand, 3.4, 0.9, RZ0 + 0.25);
room.add(mstand);
const chair = mesh(rbox(0.5, 0.08, 0.5, 0.03), mat("#ff8f6b"));
at(chair, 3.3, 0.5, RZ0 + 1.05);
room.add(chair);
const chairBack = mesh(rbox(0.5, 0.5, 0.07, 0.03), mat("#ff8f6b"));
at(chairBack, 3.3, 0.8, RZ0 + 1.3);
room.add(chairBack);
const chairLeg = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.46, 8), mat("#555"));
at(chairLeg, 3.3, 0.24, RZ0 + 1.05);
room.add(chairLeg);
// shelf with boxes
const shelf = mesh(rbox(1.2, 0.05, 0.25, 0.02), mat("#ffffff"));
at(shelf, 5.3, 1.7, RZ0 + 0.13);
room.add(shelf);
["#ffcf4a", "#5cc0b5", "#ff7a2e", "#4b6fe0"].forEach((c, i) => {
  const b = mesh(rbox(0.18, 0.24 + hash(i) * 0.12, 0.18, 0.03), mat(c));
  at(b, 4.9 + i * 0.27, 1.85, RZ0 + 0.13);
  room.add(b);
});
// plant next to socket
const pot = mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.36, 18), mat("#e26d4c"));
at(pot, 7.05, 0.18, RZ0 + 0.35);
room.add(pot);
for (let i = 0; i < 7; i++) {
  const leaf = mesh(new THREE.SphereGeometry(0.16, 12, 8), mat("#3fa35a"));
  leaf.scale.set(0.6, 1.4, 0.35);
  const a = (i / 7) * Math.PI * 2;
  at(leaf, 7.05 + Math.cos(a) * 0.13, 0.62 + hash(i) * 0.15, RZ0 + 0.35 + Math.sin(a) * 0.13);
  leaf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
  room.add(leaf);
}

// SOCKET (far right, low on back wall)
const SX = 6.25, SY = 0.42, SZ = RZ0 + 0.015;
const plate = mesh(rbox(0.36, 0.2, 0.03, 0.02), mat("#ffffff", 0.4));
at(plate, SX, SY, SZ);
room.add(plate);
for (const s of [-1, 1]) {
  const hole = mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.01, 20), mat("#e9e9e9", 0.5));
  hole.rotation.x = Math.PI / 2;
  at(hole, SX + s * 0.085, SY, SZ + 0.017);
  room.add(hole);
}
// the ORIGINAL charger, plugged in left slot, cable to floor
const origCharger = makeCharger(1.0);
origCharger.rotation.x = Math.PI / 2;
origCharger.rotation.z = Math.PI;
at(origCharger, SX - 0.085, SY, SZ + 0.06);
room.add(origCharger);
const origCable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([v3(SX - 0.085, SY - 0.07, SZ + 0.08), v3(SX - 0.1, 0.15, SZ + 0.15), v3(SX - 0.3, 0.02, SZ + 0.35), v3(SX - 0.05, 0.02, SZ + 0.55), v3(SX + 0.2, 0.02, SZ + 0.3)]), 40, 0.012, 6), mat("#ffffff", 0.5));
origCable.castShadow = true;
room.add(origCable);
// "way over there" glow ping on the charger
const chargerPing = glowSprite("#9fe7ff", 0.5);
at(chargerPing, SX - 0.085, SY, SZ + 0.2);
room.add(chargerPing);

// ============ OTTO + PHONE ============
const otto = makeOtto();
scene.add(otto.root);
const phone = makePhone([batteryScreen(1, "#ff4040", false), batteryScreen(2, "#38e07a", true)]);
otto.handR.add(phone);
phone.position.set(0.02, -0.12, 0.08);
phone.rotation.set(-1.25, 0.25, 0);
// a loose phone (lying on the bed while charging)
const phone2 = makePhone([batteryScreen(1, "#ff4040", false), batteryScreen(2, "#38e07a", true)]);
phone2.rotation.x = -Math.PI / 2;
at(phone2, BX + 0.35, 0.8, BZ + 0.15);
phone2.rotation.z = 0.4;
room.add(phone2);

// ============ THE CABLE OF CHARGERS ============
const cablePts = [
  v3(BX + 0.35, 0.79, BZ + 0.27), v3(BX + 0.75, 0.75, BZ + 0.5), v3(BX + 0.95, 0.35, BZ + 0.7), v3(BX + 1.1, 0.03, BZ + 1.0),
  v3(0.2, 0.03, 0.4), v3(1.0, 0.03, 1.1), v3(1.9, 0.03, 0.7), v3(2.5, 0.03, -0.2), v3(3.3, 0.03, 0.1),
  v3(4.2, 0.03, 0.6), v3(5.0, 0.03, -0.1), v3(5.6, 0.03, -1.4), v3(6.0, 0.03, -2.4), v3(SX + 0.085, 0.1, SZ + 0.16), v3(SX + 0.085, SY - 0.02, SZ + 0.12),
];
const cableCurve = new THREE.CatmullRomCurve3(cablePts, false, "catmullrom", 0.3);
const TUB = 400, RAD = 8;
const cableGeo = new THREE.TubeGeometry(cableCurve, TUB, 0.03, RAD, false);
const cable = mesh(cableGeo, mat("#ffffff", 0.45));
room.add(cable);
const chainU = [0.2, 0.31, 0.42, 0.53, 0.64, 0.75, 0.86];
const chainBricks = chainU.map((u) => {
  const c = makeCharger(2.2);
  const p = cableCurve.getPointAt(u);
  const tng = cableCurve.getTangentAt(u);
  c.position.copy(p).add(v3(0, 0.07, 0));
  c.rotation.set(Math.PI / 2, 0, Math.atan2(tng.x, tng.z) + Math.PI);
  room.add(c);
  return c;
});
// the plug end carried by Otto
const plugEnd = makeCharger(1.0);
room.add(plugEnd);

// the "workbench" chain Otto builds in shot 5 (on the floor in front of him)
const BUILD_ORIGIN = v3(0.55, 0, -0.35);
const buildBricks = [];
const buildCable = [];
for (let i = 0; i < 7; i++) {
  const c = makeCharger(1.8);
  room.add(c);
  buildBricks.push(c);
}
const buildPos = (i) => {
  // zig-zag snake on the floor
  const row = Math.floor(i / 4), k = i % 4;
  const x = row % 2 === 0 ? -0.6 + k * 0.4 : 0.6 - k * 0.4;
  return v3(BUILD_ORIGIN.x + x, 0.1, BUILD_ORIGIN.z + 0.55 + row * 0.42);
};
for (let i = 0; i < 6; i++) {
  const a = buildPos(i), b = buildPos(i + 1);
  const mid = a.clone().lerp(b, 0.5).add(v3(0, 0.05, 0.08));
  const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a.clone().add(v3(0, -0.06, 0)), mid, b.clone().add(v3(0, -0.06, 0))]), 16, 0.016, 6);
  const m = mesh(tg, mat("#ffffff", 0.45));
  room.add(m);
  buildCable.push(m);
}

// ============ SPARKS ============
const NSP = 90;
const spGeo = new THREE.BufferGeometry();
const spPos = new Float32Array(NSP * 3);
spGeo.setAttribute("position", new THREE.BufferAttribute(spPos, 3));
const sparkTex = canvasTex(64, 64, (g) => {
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(0.3, "rgba(255,240,170,0.9)");
  r.addColorStop(1, "rgba(255,200,80,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
});
const sparks = new THREE.Points(spGeo, new THREE.PointsMaterial({ size: 0.07, map: sparkTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: "#ffe9a8", toneMapped: false }));
sparks.frustumCulled = false;
scene.add(sparks);
const flash = glowSprite("#cfefff", 1.6);
at(flash, SX + 0.085, SY, SZ + 0.15);
scene.add(flash);
function sparkBurst(t, t0, origin, n = NSP, life = 0.9) {
  let alive = 0;
  for (let i = 0; i < NSP; i++) {
    const wave = Math.floor(i / 30); // 3 waves
    const tt = t - t0 - wave * 0.22;
    const L = life * (0.5 + hash(i * 3.1) * 0.6);
    if (i >= n || tt < 0 || tt > L) {
      spPos[i * 3 + 1] = -100;
      continue;
    }
    alive++;
    const a = hash(i * 1.7) * Math.PI * 2;
    const sp = 1.2 + hash(i * 2.3) * 2.6;
    const vx = Math.cos(a) * sp * 0.8, vz = 0.6 + hash(i * 5.1) * 1.4, vy = 0.6 + Math.sin(a) * sp * 0.7;
    spPos[i * 3] = origin.x + vx * tt;
    spPos[i * 3 + 1] = Math.max(0.02, origin.y + vy * tt - 4.9 * tt * tt);
    spPos[i * 3 + 2] = origin.z + vz * tt;
  }
  spGeo.attributes.position.needsUpdate = true;
  return alive;
}

// ============ STREET (x = 100) ============
const street = new THREE.Group();
street.position.set(100, 0, 0);
scene.add(street);
const ground = mesh(new THREE.PlaneGeometry(80, 40), mat("#3e7a4a", 1), { shadow: false });
ground.rotation.x = -Math.PI / 2;
street.add(ground);
const road = mesh(new THREE.PlaneGeometry(80, 4.5), mat("#3b3d46", 0.95), { shadow: false });
road.rotation.x = -Math.PI / 2;
at(road, 0, 0.01, 2.6);
street.add(road);
for (let i = -20; i < 20; i++) {
  const dash = mesh(new THREE.PlaneGeometry(1.0, 0.12), mat("#e8e2c8", 0.9), { shadow: false });
  dash.rotation.x = -Math.PI / 2;
  at(dash, i * 2, 0.02, 2.6);
  street.add(dash);
}
const walk = mesh(new THREE.BoxGeometry(80, 0.12, 1.4), mat("#b9b4c2", 0.95), { shadow: false });
at(walk, 0, 0.06, -0.2);
street.add(walk);
const houseCols = ["#f7d774", "#7fd0c4", "#f4a6b6", "#b9a6ee", "#9ad88a", "#ffbf8a", "#8fc4ff"];
const windows = []; // {mat, ottos}
const HOUSE_N = 7;
for (let i = 0; i < HOUSE_N; i++) {
  const hx = (i - 3) * 4.2;
  const h = new THREE.Group();
  at(h, hx, 0, -3.6);
  street.add(h);
  const hh = 3.2 + hash(i * 4.4) * 0.8;
  const body = mesh(rbox(3.4, hh, 3, 0.05), mat(houseCols[i], 0.9));
  body.position.y = hh / 2;
  h.add(body);
  const rs = new THREE.Shape();
  rs.moveTo(-1.95, 0); rs.lineTo(1.95, 0); rs.lineTo(0, 1.5); rs.closePath();
  const roof = mesh(new THREE.ExtrudeGeometry(rs, { depth: 3.3, bevelEnabled: false }), mat(i % 2 ? "#8c3b3b" : "#4d4f63", 0.85));
  at(roof, 0, hh, -1.65);
  h.add(roof);
  const door = mesh(rbox(0.75, 1.4, 0.1, 0.04), mat("#6b4430", 0.7));
  at(door, -0.9, 0.7, 1.5);
  h.add(door);
  for (const [wx, wy] of [[0.7, 1.15], [-0.75, hh - 0.95], [0.75, hh - 0.95]]) {
    const wm = new THREE.MeshBasicMaterial({ color: "#ffd77a", toneMapped: false });
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.7), wm);
    at(w, wx, wy, 1.52);
    h.add(w);
    const fr = mesh(new THREE.BoxGeometry(0.85, 0.8, 0.04), mat("#ffffff", 0.6), { shadow: false });
    at(fr, wx, wy, 1.505);
    h.add(fr);
    const gl = glowSprite("#ffc760", 1.6);
    at(gl, wx, wy, 1.7);
    h.add(gl);
    windows.push({ wm, gl, house: i, otto: i === 3 && wx > 0 && wy > 2 });
  }
}
const streetLights = [];
for (let i = 0; i < 4; i++) {
  const lx = (i - 1.5) * 7;
  const pole = mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.6, 10), mat("#2a2c36", 0.6));
  at(pole, lx, 1.8, 0.6);
  street.add(pole);
  const arm = mesh(new THREE.BoxGeometry(0.06, 0.06, 0.7), mat("#2a2c36"));
  at(arm, lx, 3.55, 0.9);
  street.add(arm);
  const head = mesh(rbox(0.36, 0.14, 0.46, 0.05), mat("#2a2c36"));
  at(head, lx, 3.5, 1.2);
  street.add(head);
  const bm = new THREE.MeshBasicMaterial({ color: "#ffe7a6", toneMapped: false });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), bm);
  at(bulb, lx, 3.4, 1.2);
  street.add(bulb);
  const gl = glowSprite("#ffd58a", 3.2);
  at(gl, lx, 3.35, 1.25);
  street.add(gl);
  const pool = mesh(new THREE.CircleGeometry(1.8, 32), new THREE.MeshBasicMaterial({ color: "#ffd58a", transparent: true, opacity: 0.22, depthWrite: false, toneMapped: false }), { shadow: false });
  pool.rotation.x = -Math.PI / 2;
  at(pool, lx, 0.13, 1.3);
  street.add(pool);
  streetLights.push({ bm, gl, pool });
}
// stars + moon
const stGeo = new THREE.BufferGeometry();
const stArr = new Float32Array(300 * 3);
for (let i = 0; i < 300; i++) {
  const a = hash(i * 1.3) * Math.PI - Math.PI / 2, e = 0.08 + hash(i * 2.9) * 1.2;
  stArr[i * 3] = Math.sin(a) * 120;
  stArr[i * 3 + 1] = Math.sin(e) * 120 * 0.6 + 8;
  stArr[i * 3 + 2] = -Math.cos(a) * 120;
}
stGeo.setAttribute("position", new THREE.BufferAttribute(stArr, 3));
const stars = new THREE.Points(stGeo, new THREE.PointsMaterial({ size: 0.6, color: "#ffffff", sizeAttenuation: true, toneMapped: false }));
street.add(stars);
const moon = new THREE.Mesh(new THREE.SphereGeometry(4, 24, 16), new THREE.MeshBasicMaterial({ color: "#fff5d6", toneMapped: false }));
at(moon, -30, 42, -90);
street.add(moon);
const moonGlow = glowSprite("#fff2c4", 26);
at(moonGlow, -30, 42, -89);
street.add(moonGlow);
const skyDome = new THREE.Mesh(new THREE.SphereGeometry(150, 24, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, toneMapped: false, map: canvasTex(16, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, "#070b24");
  gr.addColorStop(0.5, "#16245c");
  gr.addColorStop(1, "#3b4f9c");
  g.fillStyle = gr;
  g.fillRect(0, 0, w, h);
}) }));
street.add(skyDome);

// ============ SHOT HELPERS ============
function cam(pos, look, fov = 42, roll = 0) {
  camera.position.set(pos[0], pos[1], pos[2]);
  camera.lookAt(look[0], look[1], look[2]);
  if (roll) camera.rotateZ(roll);
  if (camera.fov !== fov) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
}
function shake(t, t0, amp, dur) {
  const k = seg(t, t0, t0 + dur);
  if (k <= 0 || k >= 1) return [0, 0];
  const a = amp * (1 - k);
  return [Math.sin(t * 91) * a, Math.cos(t * 73) * a];
}
const BEDPOSE = (t, extra = {}) => ({
  x: BX, z: BZ - 0.62, y: 0, ry: 0, hipY: 0.66, legL: -Math.PI / 2 + 0.05, legR: -Math.PI / 2 + 0.05, lean: -0.12,
  blink: blinkAt(t, 1), ...extra,
});
const HOLD_PHONE = { armR: [-1.05, -0.12, -1.25], armL: [-1.0, -0.22, -1.15, 0.5] };

// ============ SHOTS ============
// time cut-points (seconds)
const C = { s1b: 1.35, s2: 2.95, s3: 4.85, s4: 6.55, s5: 7.75, s5b: 10.2, s6: 11.95, s7: 14.6, s7b: 15.4, s8: 16.15, s9: 19.95, end: 23 };

function setRoomNight(k) {
  // k: 0 normal, 1 blackout
  hemi.intensity = lerp(1.25, 0.1, k);
  hemi.color.set(k > 0.5 ? "#5a6aa8" : "#dfe8ff");
  key.intensity = lerp(2.3, 0.04, k);
  lamp.intensity = lerp(3.0, 0, k);
  shade.material.emissiveIntensity = lerp(0.9, 0.02, k);
  scene.background = new THREE.Color(k > 0.5 ? "#0b0f20" : "#cfbdea");
}

function show({ roomOn = true, streetOn = false }) {
  room.visible = roomOn;
  otto.root.visible = roomOn;
  street.visible = streetOn;
}

function render(t) {
  // defaults
  show({ roomOn: true });
  setRoomNight(0);
  key.position.set(-1.5, 6.5, 5.5);
  key.target.position.set(1.5, 0, -1);
  phoneLight.intensity = 0;
  sparkLight.intensity = 0;
  flash.visible = false;
  sparks.visible = false;
  phone.visible = true;
  phone.userData.show(0);
  phone2.visible = false;
  phone2.userData.show(0);
  cable.visible = false;
  chainBricks.forEach((b) => (b.visible = false));
  buildBricks.forEach((b) => (b.visible = false));
  buildCable.forEach((b) => (b.visible = false));
  plugEnd.visible = false;
  chargerPing.visible = false;
  origCharger.visible = true;
  scene.fog = null;

  if (t < C.s2) {
    // S1 — Otto in bed, phone at 1%. (a) worried face push-in (b) POV on the phone screen
    const p = BEDPOSE(t, { ...HOLD_PHONE, nod: 0.28, brow: 0.9, lookY: -0.7, smile: -0.35, hat: 0 });
    // tiny anxious tremble
    p.headTilt = Math.sin(t * 9) * 0.02;
    pose(otto, p);
    phoneLight.intensity = 1.6;
    otto.handR.updateWorldMatrix(true, false);
    const ph = new THREE.Vector3();
    phone.getWorldPosition(ph);
    phoneLight.position.copy(ph).add(v3(0, 0.1, 0.12));
    if (t < C.s1b) {
      const k = eio(seg(t, 0, C.s1b));
      cam([lerp(BX + 0.75, BX + 0.5, k), lerp(1.95, 1.85, k), lerp(BZ + 1.75, BZ + 1.2, k)], [BX, 1.4, BZ - 0.5], 44);
    } else {
      const k = eout(seg(t, C.s1b, C.s2));
      const pulse = 0.5 + 0.5 * Math.sin((t - C.s1b) * 10);
      phoneLight.intensity = 1.6 + pulse;
      // POV: the phone held up in front of us, screen blinking 1%
      phone.visible = false;
      phone2.visible = true;
      phone2.userData.show(pulse > 0.25 ? 0 : -1);
      phone2.position.set(BX + 0.02, 1.25 + Math.sin(t * 7) * 0.003, BZ + 0.15);
      phone2.rotation.set(-0.25, 0, 0.06);
      phoneLight.position.set(BX, 1.35, BZ + 0.35);
      cam([BX + 0.01, lerp(1.36, 1.33, k), lerp(BZ + 0.62, BZ + 0.52, k)], [BX + 0.02, 1.25, BZ + 0.15], 40);
    }
  } else if (t < C.s3) {
    // S2 — whip-pan to the charger, way over there
    pose(otto, BEDPOSE(t, { ...HOLD_PHONE, nod: 0.05, turn: lerp(0, 0.9, eio(seg(t, C.s2, C.s2 + 0.3))), lookX: 1, brow: 0.6, smile: -0.2, hat: 0 }));
    const k = eio(seg(t, C.s2, C.s2 + 0.55));
    const pos = lerpV([BX + 0.9, 1.5, 0.6], [SX - 1.1, 0.75, SZ + 1.6], k);
    const look = lerpV([BX, 1.2, BZ], [SX - 0.08, SY, SZ], k);
    const settle = eout(seg(t, C.s2 + 0.55, C.s3));
    cam([pos.x, pos.y, pos.z - settle * 0.25], [look.x, look.y, look.z], lerp(46, 36, settle));
    chargerPing.visible = t > C.s2 + 0.5;
    const pk = ((t - C.s2 - 0.5) % 0.6) / 0.6;
    chargerPing.scale.setScalar(0.25 + pk * 0.6);
    chargerPing.material.opacity = 1 - pk;
  } else if (t < C.s4) {
    // S3 — wide: the distance. Otto looks at the floor... and nope.
    const lt = t - C.s3;
    const shakeHead = seg(lt, 0.9, 1.6);
    pose(otto, BEDPOSE(t, { ...HOLD_PHONE, nod: lerp(0.15, 0.35, eio(seg(lt, 0.2, 0.7))), turn: Math.sin(shakeHead * Math.PI * 4) * 0.35 * (1 - shakeHead) + 0.3, lookX: 0.6, lookY: -0.4, brow: -0.2, smile: -0.4, hat: 0 }));
    const k = eio(seg(t, C.s3, C.s4));
    cam([-3.05, lerp(3.15, 3.05, k), lerp(-1.45, -1.6, k)], [4.5, lerp(0.15, 0.05, k), -2.35], 52);
    chargerPing.visible = true;
    chargerPing.scale.setScalar(0.4 + 0.1 * Math.sin(t * 8));
    chargerPing.material.opacity = 0.8;
  } else if (t < C.s5) {
    // S4 — "Not Otto." Hard hat drops on with a squash.
    const lt = t - C.s4;
    const drop = seg(lt, 0.15, 0.42);
    const land = seg(lt, 0.42, 0.9);
    const hat = drop < 1 ? ein(drop) : 1;
    const hatSq = drop >= 1 ? Math.exp(-land * 6) * Math.cos(land * 18) * 0.6 : 0;
    pose(otto, BEDPOSE(t, {
      ...HOLD_PHONE, armR: [-0.35, 0.2, -0.6], armL: [-0.3, 0.2, -0.5], nod: lerp(0.0, -0.05, land) + (drop >= 1 ? hatSq * 0.08 : 0),
      lid: lerp(0, 0.45, eout(land)), brow: lerp(0.2, -1, eout(land)), lookX: 0, lookY: 0.1, smile: lerp(0, 0.55, eout(land)), hat, hatSq, blink: 0,
    }));
    phone.visible = false;
    phone2.visible = true;
    const k = eout(seg(lt, 0, 1.2));
    const [sx, sy] = shake(t, C.s4 + 0.42, 0.02, 0.25);
    cam([BX + sx, 1.85 + sy, lerp(BZ + 1.25, BZ + 0.85, k)], [BX, 1.72, BZ - 0.62], 38);
  } else if (t < C.s6) {
    // S5 — building: (a) snapping 7 chargers together on the floor (b) the cable crosses the room
    const lt = t - C.s5;
    const popTimes = [0.35, 0.75, 1.1, 1.42, 1.72, 2.0, 2.28].map((x) => C.s5 + x);
    let snap = 0;
    for (const pt of popTimes) {
      const d = t - pt;
      if (d > -0.18 && d < 0.12) snap = Math.max(snap, d < 0 ? eout((d + 0.18) / 0.18) : 1 - d / 0.12);
    }
    phone.visible = false;
    phone2.visible = true;
    if (t < C.s5b) {
      pose(otto, {
        x: BUILD_ORIGIN.x, z: BUILD_ORIGIN.z - 0.35, ry: 0, hipY: 0.25, legL: -1.45, legR: -1.45, legLz: 0.25, lean: 0.35,
        armL: [-0.9 - snap * 0.2, 0.6 - snap * 0.45, -0.6, 0.4], armR: [-0.9 - snap * 0.2, 0.6 - snap * 0.45, -0.6, 0.4],
        nod: 0.45, lookY: -0.8, lid: 0.35, brow: -0.9, smile: 0.25 + snap * 0.3, open: 0, hat: 1, blink: 0, sq: snap * 0.04,
      });
      buildBricks.forEach((b, i) => {
        const k = seg(t, popTimes[i] - 0.02, popTimes[i] + 0.25);
        b.visible = k > 0;
        const s = spring(k, 2.5, 6) * 1.8;
        b.scale.set(s, s, s);
        const p = buildPos(i);
        b.position.copy(p);
        b.position.y = 0.1 + (1 - eout(k)) * 0.5;
        b.rotation.set(Math.PI / 2, 0, (i % 2 ? 0.2 : -0.2) + (1 - k) * 2.0);
        if (i > 0) buildCable[i - 1].visible = k > 0.4;
      });
      const k = eio(seg(t, C.s5, C.s5b));
      const a = lerp(-0.55, 0.35, k);
      const r = lerp(3.4, 3.0, k);
      cam([BUILD_ORIGIN.x + Math.sin(a) * r, lerp(2.3, 2.1, k), BUILD_ORIGIN.z + 0.4 + Math.cos(a) * r], [BUILD_ORIGIN.x, 0.6, BUILD_ORIGIN.z + 0.35], 46);
    } else {
      // (b) bird's-eye tracking shot along the cable as it extends across the room
      const k = eio(seg(t, C.s5b + 0.05, C.s6 - 0.1));
      cable.visible = true;
      const segs = Math.floor(TUB * clamp(0.05 + k * 0.95));
      cableGeo.setDrawRange(0, segs * RAD * 6);
      chainBricks.forEach((b, i) => {
        b.visible = chainU[i] < 0.05 + k * 0.95;
      });
      const head = cableCurve.getPointAt(clamp(0.05 + k * 0.95));
      plugEnd.visible = true;
      plugEnd.position.copy(head).add(v3(0, 0.06, 0));
      const tg = cableCurve.getTangentAt(clamp(0.05 + k * 0.95));
      plugEnd.rotation.set(Math.PI / 2, 0, Math.atan2(tg.x, tg.z) + Math.PI);
      pose(otto, BEDPOSE(t, { armR: [-0.4, 0.3, -0.4], armL: [-0.4, 0.3, -0.4], nod: 0.2, turn: 0.6, lookX: 1, lid: 0.3, brow: -0.6, smile: 0.4, hat: 1 }));
      const look = lerpV([0, 0, 0], [0, 0, 0], 0);
      cam([head.x - 1.7, 3.5, head.z + 3.1], [head.x + 0.1, 0.0, head.z - 0.35], 50);
    }
  } else if (t < C.s7) {
    // S6 — Otto plugs it in himself... at the socket (right next to the original charger). Zap.
    const lt = t - C.s6;
    cable.visible = true;
    cableGeo.setDrawRange(0, Infinity);
    chainBricks.forEach((b) => (b.visible = true));
    phone.visible = false;
    phone2.visible = true;
    const plugIn = eio(seg(t, 12.95, 13.35));
    const zap = 13.45;
    const zk = seg(t, zap, zap + 0.6);
    const jolt = t > zap ? Math.exp(-(t - zap) * 4) : 0;
    // Otto kneeling at the socket, seen from the side
    pose(otto, {
      x: SX + 0.62, z: SZ + 0.5, ry: -Math.PI / 2 + 0.45, hipY: 0.5, legL: -1.3, legR: -0.2, lean: 0.4,
      armR: [-1.35 + plugIn * 0.2, -0.15, -0.25], armL: [-0.3, 0.35, -0.5],
      nod: 0.2, lookY: -0.3, lid: lerp(0.35, 0, jolt), brow: lerp(-0.8, 1, jolt), smile: 0.3, open: jolt * 0.9, hat: 1, pupil: lerp(1, 0.55, jolt),
      sq: -jolt * 0.06 * Math.sin((t - zap) * 40),
    });
    // plug in the hand, then in the socket
    const hp = new THREE.Vector3();
    otto.root.updateMatrixWorld(true);
    otto.handR.getWorldPosition(hp);
    plugEnd.visible = true;
    const sock = v3(SX + 0.085, SY, SZ + 0.065);
    plugEnd.position.copy(hp.clone().lerp(sock, plugIn));
    plugEnd.rotation.set(Math.PI / 2, 0, Math.PI);
    flash.visible = t > zap && t < zap + 0.5;
    flash.scale.setScalar(1.6 + 2.2 * (1 - zk));
    flash.material.opacity = 1 - seg(t, zap, zap + 0.5);
    sparks.visible = true;
    sparkBurst(t, zap, sock.clone().add(v3(0, 0, 0.05)));
    sparkLight.position.copy(sock).add(v3(0, 0.2, 0.4));
    sparkLight.intensity = t > zap ? 12 * Math.exp(-(t - zap) * 3) * (0.6 + 0.4 * hash(Math.floor(t * 30))) : 0;
    // room lights flicker
    if (t > zap) setRoomNight(0.55 * hash(Math.floor(t * 18)) * Math.exp(-(t - zap) * 1.5));
    const [sx, sy] = shake(t, zap, 0.05, 0.6);
    const k = eio(seg(t, C.s6, 13.3));
    cam([SX - 1.3 + sx, lerp(1.45, 1.25, k) + sy, SZ + lerp(3.3, 2.9, k)], [SX + 0.35, 0.75, SZ + 0.3], 46);
  } else if (t < C.s8) {
    cable.visible = true;
    cableGeo.setDrawRange(0, Infinity);
    chainBricks.forEach((b) => (b.visible = true));
    if (t < C.s7b) {
      // S7a — phone close-up: 1% -> 2% (ding)
      phone.visible = false;
      phone2.visible = true;
      phone2.userData.show(t > 14.8 ? 1 : 0);
      const p = phone2.position;
      const k = eout(seg(t, C.s7, C.s7b));
      const bump = t > 14.8 ? spring(seg(t, 14.8, 15.2), 3, 6) : 0;
      camera.up.set(Math.sin(0.4), 0, -Math.cos(0.4));
      cam([p.x + 0.01, p.y + lerp(0.62, 0.52, k) - bump * 0.04, p.z + 0.06], [p.x - 0.02, p.y, p.z + 0.06], 40);
      camera.up.set(0, 1, 0);
      phoneLight.intensity = 1.5;
      phoneLight.position.set(p.x, p.y + 0.3, p.z);
    } else {
      // S7b — Otto at the socket: tiny victory fist
      const lt = t - C.s7b;
      const fist = spring(seg(lt, 0.05, 0.5), 2.5, 5);
      pose(otto, {
        x: SX + 0.6, z: SZ + 1.2, ry: -0.35, hipY: 0.9,
        armR: [-0.6 * fist, 0.15, -2.2 * fist], armL: [0, 0.12, -0.1],
        nod: -0.05, lid: 0.25, brow: 0.3, browUp: 0.5, smile: 0.9, hat: 1, sq: -fist * 0.03,
      });
      phone.visible = false;
      phone2.visible = true;
      phone2.userData.show(1);
      const k = eout(seg(t, C.s7b, C.s8));
      cam([SX - 0.3, 1.7, SZ + lerp(4.6, 4.2, k)], [SX + 0.4, 1.25, SZ + 1.2], 44);
    }
  } else if (t < C.s9) {
    // S8 — the whole street. Lights out.
    show({ roomOn: false, streetOn: true });
    hemi.intensity = 1.1;
    hemi.color.set("#8aa0f0");
    hemi.groundColor.set("#1a2030");
    key.intensity = 1.3;
    key.color.set("#9fb6ff");
    key.position.set(70, 30, 30);
    key.target.position.set(100, 0, -3);
    scene.background = new THREE.Color("#0b1030");
    scene.fog = new THREE.Fog("#0d1436", 25, 70);
    const OUT0 = 17.45;
    windows.forEach((w) => {
      const tOff = OUT0 + w.house * 0.09 + (w.otto ? 0 : 0);
      let on = t < tOff ? 1 : 0;
      // flicker before dying
      if (t > tOff - 0.25 && t < tOff) on = hash(Math.floor(t * 30) + w.house) > 0.35 ? 1 : 0.2;
      if (w.otto && t >= tOff) {
        w.wm.color.set("#4f8dff");
        w.gl.material.color.set("#4f8dff");
        w.gl.visible = true;
        w.gl.scale.setScalar(1.2 + 0.1 * Math.sin(t * 6));
        return;
      }
      w.wm.color.set(on ? "#ffd77a" : "#1c2340");
      w.gl.material.color.set("#ffc760");
      w.gl.visible = on > 0.5;
    });
    streetLights.forEach((s, i) => {
      const tOff = OUT0 + 0.15 + i * 0.12;
      const on = t < tOff;
      s.bm.color.set(on ? "#ffe7a6" : "#2a2c36");
      s.gl.visible = on;
      s.pool.visible = on;
    });
    if (t > OUT0) { key.intensity = 0.7; hemi.intensity = 0.75; }
    const k = eio(seg(t, C.s8, C.s9));
    cam([100 + lerp(-1.5, 0.3, k), lerp(2.2, 2.4, k), lerp(17, 12.5, k)], [100 + lerp(-0.5, 0.6, k), lerp(3.6, 3.7, k), -3.6], 48);
  } else {
    // S9 — back inside, pitch dark, phone glow. "Totally worth it."
    const lt = t - C.s9;
    setRoomNight(1);
    cable.visible = true;
    cableGeo.setDrawRange(0, Infinity);
    chainBricks.forEach((b) => (b.visible = true));
    phone.userData.show(1);
    const nodK = seg(lt, 0.3, 1.3);
    pose(otto, BEDPOSE(t, { ...HOLD_PHONE, nod: 0.2 - Math.sin(nodK * Math.PI * 2) * 0.08, lookY: -0.4, lid: 0.45, brow: -0.2, browUp: 0.4, smile: 0.85, hat: 1 }));
    otto.root.updateMatrixWorld(true);
    const ph = new THREE.Vector3();
    phone.getWorldPosition(ph);
    phoneLight.position.copy(ph).add(v3(0, 0.15, 0.18));
    phoneLight.intensity = 3.2;
    // the socket still crackles in the background
    sparks.visible = true;
    const sock = v3(SX + 0.085, SY, SZ + 0.1);
    sparkBurst(t, 21.3, sock, 25, 0.5);
    sparkLight.position.copy(sock).add(v3(0, 0.2, 0.4));
    sparkLight.intensity = t > 21.3 && t < 21.7 ? 4 * hash(Math.floor(t * 30)) : 0;
    const k = eout(seg(t, C.s9, C.end));
    cam([BX + lerp(0.9, 0.6, k), 1.9, lerp(BZ + 2.4, BZ + 1.8, k)], [BX, 1.45, BZ - 0.55], 44);
  }
  renderer.render(scene, camera);
}

window.__ottoRender = render;
window.addEventListener("hf-seek", (e) => render(e.detail.time));
render(0);
