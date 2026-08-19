import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const params = new URLSearchParams(location.search);
const selectedCharacter = params.get('character') || "D'Artagnan";
const chapterScene = Number(params.get('scene') || 0);
document.title = `The Three Musketeers VR - ${selectedCharacter}`;
document.getElementById('hud-title').firstChild.textContent = `THE THREE MUSKETEERS - ${selectedCharacter} `;
document.getElementById('hud-chapter').textContent = `Chapter One - The Three Presents · Scene ${chapterScene + 1}`;
document.querySelector('#blocker-text h1').textContent = `You are ${selectedCharacter}`;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
document.getElementById('vr-button-holder').appendChild(VRButton.createButton(renderer));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fc6e0);
scene.fog = new THREE.Fog(0x9fc6e0, 20, 90);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 500);

const playerRig = new THREE.Group();
playerRig.add(camera);
camera.position.set(0, 1.65, 0);
scene.add(playerRig);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const hemi = new THREE.HemisphereLight(0xffffff, 0x3a2f1f, 0.9);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff2d6, 1.1);
sun.position.set(30, 45, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -60;
sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60;
sun.shadow.camera.bottom = -60;
sun.shadow.camera.far = 150;
scene.add(sun);

function makeMaterialTexture(base, detail, repeatX, repeatY) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = base;
  context.fillRect(0, 0, 128, 128);
  for (let index = 0; index < 260; index += 1) {
    context.fillStyle = detail;
    context.globalAlpha = 0.12 + Math.random() * 0.2;
    const size = 1 + Math.random() * 5;
    context.fillRect(Math.random() * 128, Math.random() * 128, size, size);
  }
  context.globalAlpha = 0.18;
  context.strokeStyle = detail;
  context.lineWidth = 1;
  for (let offset = 0; offset < 128; offset += 16) {
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset + 22, 128);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const grassTexture = makeMaterialTexture('#4c7a3a', '#d4c16c', 8, 20);
const roadTexture = makeMaterialTexture('#8a7355', '#d0b47d', 3, 18);
const stoneTexture = makeMaterialTexture('#8f8f8f', '#e2d9bf', 8, 10);
const wallTexture = makeMaterialTexture('#e8d9b0', '#9b774d', 3, 3);
const roofTexture = makeMaterialTexture('#8a3b2b', '#d5a066', 4, 4);

const WORLD_LENGTH = 210;

const field = new THREE.Mesh(
  new THREE.PlaneGeometry(80, WORLD_LENGTH + 40),
  new THREE.MeshStandardMaterial({ color: 0x4c7a3a, map: grassTexture, roughness: 1 })
);
field.rotation.x = -Math.PI / 2;
field.position.set(0, 0, -WORLD_LENGTH / 2 + 10);
field.receiveShadow = true;
scene.add(field);

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(6, WORLD_LENGTH),
  new THREE.MeshStandardMaterial({ color: 0x8a7355, map: roadTexture, roughness: 1 })
);
road.rotation.x = -Math.PI / 2;
road.position.set(0, 0.01, -WORLD_LENGTH / 2 + 5);
road.receiveShadow = true;
scene.add(road);

const courtyard = new THREE.Mesh(
  new THREE.PlaneGeometry(26, 34),
  new THREE.MeshStandardMaterial({ color: 0x8f8f8f, map: stoneTexture, roughness: 0.9 })
);
courtyard.rotation.x = -Math.PI / 2;
courtyard.position.set(0, 0.015, -168);
courtyard.receiveShadow = true;
scene.add(courtyard);

function makeTree(x, z, scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.26, 2.2, 6),
    new THREE.MeshStandardMaterial({ color: 0x5b3d24, roughness: 1 })
  );
  trunk.position.y = 1.1;
  trunk.castShadow = true;
  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(1.5, 3.2, 7),
    new THREE.MeshStandardMaterial({ color: 0x2f6b34, roughness: 1 })
  );
  leaves.position.y = 3.1;
  leaves.castShadow = true;
  g.add(trunk, leaves);
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  g.rotation.y = Math.random() * Math.PI * 2;
  return g;
}

function makeHouse(x, z, w = 6, d = 5, h = 3, wallColor = 0xe8d9b0, roofColor = 0x8a3b2b) {
  const g = new THREE.Group();
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color: wallColor, map: wallTexture, roughness: 0.9 })
  );
  walls.position.y = h / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(Math.sqrt(w * w + d * d) / 1.7, h * 0.75, 4),
    new THREE.MeshStandardMaterial({ color: roofColor, map: roofTexture, roughness: 0.8 })
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.y = h + (h * 0.75) / 2 - 0.1;
  roof.castShadow = true;
  g.add(walls, roof);
  g.position.set(x, 0, z);
  return g;
}

function makeHumanoid({ shirt = 0x3a4f6b, pants = 0x2b2b2b, skin = 0xd8b48c, hat = null } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.28, 0.75, 4, 8),
    new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.9 })
  );
  body.position.y = 1.05;
  body.castShadow = true;
  const legs = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.22, 0.7, 8),
    new THREE.MeshStandardMaterial({ color: pants, roughness: 0.9 })
  );
  legs.position.y = 0.4;
  legs.castShadow = true;
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 10),
    new THREE.MeshStandardMaterial({ color: skin, roughness: 0.8 })
  );
  head.position.y = 1.65;
  head.castShadow = true;
  g.add(body, legs, head);
  if (hat) {
    const brim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.04, 14),
      new THREE.MeshStandardMaterial({ color: hat, roughness: 0.8 })
    );
    brim.position.y = 1.83;
    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.18, 0.22, 12),
      new THREE.MeshStandardMaterial({ color: hat, roughness: 0.8 })
    );
    crown.position.y = 1.95;
    g.add(brim, crown);
  }
  return g;
}

function makeHorse(bodyColor = 0xd8b23a) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.85 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 0.6), bodyMat);
  body.position.y = 0.9;
  body.castShadow = true;
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 0.4), bodyMat);
  neck.position.set(0.85, 1.25, 0);
  neck.rotation.z = -0.5;
  neck.castShadow = true;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.3), bodyMat);
  head.position.set(1.25, 1.55, 0);
  head.castShadow = true;
  const legGeo = new THREE.BoxGeometry(0.16, 0.75, 0.16);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x6b4a1c, roughness: 0.9 });
  const legOffsets = [
    [0.55, -0.28], [0.55, 0.28], [-0.55, -0.28], [-0.55, 0.28]
  ];
  for (const [lx, lz] of legOffsets) {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(lx, 0.4, lz);
    leg.castShadow = true;
    g.add(leg);
  }
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.1, 0.6, 6), legMat);
  tail.position.set(-0.8, 0.85, 0);
  tail.rotation.z = 0.6;
  g.add(body, neck, head, tail);
  return g;
}

function makeTeleportRing(x, z) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.35, 0.5, 24),
    new THREE.MeshBasicMaterial({ color: 0xf2e6c9, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.03, z);
  scene.add(ring);
  return ring;
}

function makeTextSprite(text, { fontsize = 42, color = '#f2e6c9', bg = 'rgba(10,8,4,0.72)', width = 6, maxWidthPx = 900 } = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const padding = 28;
  ctx.font = `${fontsize}px Georgia, serif`;

  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidthPx && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  const lineHeight = fontsize * 13 / 10 + fontsize * 0.35;
  canvas.width = maxWidthPx + padding * 2;
  canvas.height = lines.length * (fontsize + 14) + padding * 2;

  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, canvas.width, canvas.height, 20);
  ctx.fill();

  ctx.font = `${fontsize}px Georgia, serif`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  lines.forEach((l, i) => {
    ctx.fillText(l, padding, padding + i * (fontsize + 14));
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  const aspect = canvas.width / canvas.height;
  sprite.scale.set(width, width / aspect, 1);
  sprite.renderOrder = 999;
  return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeSignpost(text, x, z, rotY = 0) {
  const g = new THREE.Group();
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 1.8, 6),
    new THREE.MeshStandardMaterial({ color: 0x5b3d24 })
  );
  post.position.y = 0.9;
  post.castShadow = true;
  const label = makeTextSprite(text, { fontsize: 34, width: 2.4 });
  label.position.set(0, 1.75, 0);
  g.add(post, label);
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  scene.add(g);
  return g;
}

scene.add(makeHouse(-6, -8, 7, 6, 3));
for (let i = 0; i < 14; i++) {
  scene.add(makeTree(-25 + Math.random() * 15, 5 - Math.random() * 30, 0.8 + Math.random() * 0.5));
  scene.add(makeTree(12 + Math.random() * 15, 5 - Math.random() * 30, 0.8 + Math.random() * 0.5));
}

const father = makeHumanoid({ shirt: 0x5b4632, pants: 0x2b2320, hat: 0x3b2c1f });
father.position.set(-1.5, 0, -10);
father.rotation.y = Math.PI * 0.15;
scene.add(father);

const fatherLabel = makeTextSprite("Your father, D'Artagnan the Elder", { fontsize: 28, width: 3 });
fatherLabel.position.set(-1.5, 2.3, -10);
scene.add(fatherLabel);

const horse = makeHorse(0xd8b23a);
horse.position.set(1.8, 0, -9.5);
horse.rotation.y = -0.4;
scene.add(horse);

const purseMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.14, 10, 10),
  new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.4, metalness: 0.6 })
);
purseMesh.position.set(-1.8, 0.9, -12.5);
purseMesh.castShadow = true;
scene.add(purseMesh);

const table = new THREE.Mesh(
  new THREE.BoxGeometry(1.4, 0.75, 0.8),
  new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 0.9 })
);
table.position.set(-1.8, 0.375, -12.5);
table.castShadow = true;
scene.add(table);
purseMesh.position.y = 0.9;

const letterMesh = new THREE.Mesh(
  new THREE.BoxGeometry(0.28, 0.02, 0.2),
  new THREE.MeshStandardMaterial({ color: 0xefe4c2, roughness: 0.8 })
);
letterMesh.position.set(-1.1, 1.0, -15.6);
letterMesh.rotation.set(-0.3, 0.3, 0);
letterMesh.castShadow = true;
scene.add(letterMesh);

makeSignpost('The road to Paris  →', 4, -23, -Math.PI / 2.2);

for (let i = 0; i < 40; i++) {
  const z = -26 - Math.random() * 118;
  const side = Math.random() < 0.5 ? -1 : 1;
  const x = side * (5 + Math.random() * 20);
  scene.add(makeTree(x, z, 0.7 + Math.random() * 0.8));
}

const milestones = [
  { text: 'Tarbes', z: -50 },
  { text: 'Auch', z: -90 },
  { text: 'Meung-sur-Loire — one league', z: -130 },
];
for (const m of milestones) {
  makeSignpost(m.text, 3.6, m.z, -Math.PI / 2.2);
}

const teleportRings = [];
for (let z = -22; z > -150; z -= 9) {
  teleportRings.push(makeTeleportRing(0, z));
}
for (const z of [-155, -162, -169]) {
  teleportRings.push(makeTeleportRing(0, z));
}

const inn = makeHouse(-3, -178, 10, 7, 4.2, 0xcbb98a, 0x5a2b22);
scene.add(inn);

const innSign = makeTextSprite('THE FRANC MEUNIER', { fontsize: 30, width: 2.6 });
innSign.position.set(-3, 5.6, -174.2);
scene.add(innSign);

const balcony = new THREE.Mesh(
  new THREE.BoxGeometry(2.4, 0.15, 1),
  new THREE.MeshStandardMaterial({ color: 0x4a3626 })
);
balcony.position.set(-3, 3.0, -174.8);
balcony.castShadow = true;
scene.add(balcony);

const stranger = makeHumanoid({ shirt: 0x2a2a30, pants: 0x1a1a1e, hat: 0x1a1a1e });
stranger.scale.setScalar(1.05);
stranger.position.set(-3, 3.0, -174.8);
scene.add(stranger);

const strangerLabel = makeTextSprite('A Stranger', { fontsize: 26, width: 2.2 });
strangerLabel.position.set(-3, 4.4, -174.8);
scene.add(strangerLabel);

const tiedHorse = makeHorse(0xd8b23a);
tiedHorse.position.set(2, 0, -166);
tiedHorse.rotation.y = 0.6;
scene.add(tiedHorse);

const henchmen = [
  makeHumanoid({ shirt: 0x555049, pants: 0x2b2b2b }),
  makeHumanoid({ shirt: 0x4a4a4a, pants: 0x2b2b2b }),
];
henchmen[0].position.set(-6.5, 0, -177);
henchmen[1].position.set(-7.5, 0, -179);
henchmen.forEach(h => { h.visible = false; scene.add(h); });

let panelSprite = null;
function showLine(text, { duration = 4200, width = 1.7 } = {}) {
  if (panelSprite) {
    camera.remove(panelSprite);
    panelSprite = null;
  }
  panelSprite = makeTextSprite(text, { fontsize: 30, width: 90, maxWidthPx: 640 });
  panelSprite.scale.set(width, panelSprite.scale.y * (width / panelSprite.scale.x), 1);
  panelSprite.position.set(0, -0.35, -1.4);
  camera.add(panelSprite);
  if (duration > 0) {
    setTimeout(() => {
      if (panelSprite) { camera.remove(panelSprite); panelSprite = null; }
    }, duration);
  }
}

const lineQueue = [];
let queueRunning = false;
function queueLine(text, opts = {}) {
  lineQueue.push({ text, opts });
  if (!queueRunning) runQueue();
}
async function runQueue() {
  queueRunning = true;
  while (lineQueue.length) {
    const { text, opts } = lineQueue.shift();
    showLine(text, opts);
    const duration = opts.duration ?? 4200;
    await wait(duration + 300);
  }
  queueRunning = false;
}

const fadeEl = document.getElementById('fade');
function fadeToBlack(holdMs = 900) {
  return new Promise(resolve => {
    fadeEl.classList.add('on');
    setTimeout(() => {
      resolve();
      setTimeout(() => fadeEl.classList.remove('on'), holdMs);
    }, 650);
  });
}

const collected = { horse: false, purse: false, letter: false };
const inventoryEls = {
  horse: document.getElementById('item-horse'),
  purse: document.getElementById('item-purse'),
  letter: document.getElementById('item-letter'),
};

const interactables = [
  {
    pos: new THREE.Vector3(-1.5, 0, -10.5),
    radius: 2.4,
    triggered: false,
    onTrigger: () => {
      queueLine('"Come here, my boy. Your mother and I have three gifts for you before you ride for Paris."', { duration: 5000 });
    },
  },
  {
    pos: horse.position.clone(),
    radius: 2.2,
    triggered: false,
    onTrigger: () => {
      queueLine('"This Béarnese pony has served me thirteen years — and never once fell ill. Mind you, its color is... conspicuous."', { duration: 5200 });
      collected.horse = true;
      inventoryEls.horse.classList.add('collected');
    },
  },
  {
    pos: table.position.clone(),
    radius: 2.3,
    triggered: false,
    onTrigger: () => {
      queueLine('"Fifteen crowns, and my sword — the sword I carried in the Wars of Religion. Spend the money wisely, and draw the sword only for good cause."', { duration: 5500 });
      collected.purse = true;
      inventoryEls.purse.classList.add('collected');
    },
  },
  {
    pos: new THREE.Vector3(-1.0, 0, -16),
    radius: 1.8,
    triggered: false,
    onTrigger: () => {
      queueLine('As you turn to go, your father presses one more thing into your hand: "A letter of introduction to Monsieur de Tréville, Captain of the King\'s Musketeers, and an old friend of mine. Guard it with your life."', { duration: 5800 });
      collected.letter = true;
      inventoryEls.letter.classList.add('collected');
    },
  },
  {
    pos: new THREE.Vector3(0, 0, -23),
    radius: 3,
    triggered: false,
    onTrigger: () => {
      queueLine('You mount your yellow horse and set out on the road to Paris. Three counsels ring in your ears: never fear quarrels, seek adventure, and fight duels whenever they are forbidden — for that doubles the courage needed.', { duration: 6500 });
    },
  },
  {
    pos: new THREE.Vector3(0, 0, -160),
    radius: 5,
    triggered: false,
    onTrigger: () => {
      queueLine('You arrive at Meung-sur-Loire. Outside the inn "The Franc Meunier," a knot of townsfolk is staring up at a gentleman leaning from a window — and, unmistakably, laughing at your horse.', { duration: 6000 });
    },
  },
  {
    pos: new THREE.Vector3(0, 0, -172),
    radius: 6,
    triggered: false,
    onTrigger: () => {
      startConfrontation();
    },
  },
];

function updateInteractables() {
  const p = playerRig.position;
  for (const it of interactables) {
    if (it.triggered) continue;
    const dx = p.x - it.pos.x, dz = p.z - it.pos.z;
    if (dx * dx + dz * dz < it.radius * it.radius) {
      it.triggered = true;
      it.onTrigger();
    }
  }
}

let chapterEnded = false;
async function startConfrontation() {
  lineQueue.length = 0;
  showLine('The Stranger leans further out and says: "That yellow coat... I knew it once, on a Béarnese pony, in my youth!" He laughs. His companions laugh with him.', { duration: 5500 });
  await wait(3200);
  showLine('Blood rushes to your head. "Sir!" you cry, hand on your hilt, "laugh at me if you dare — but not at my horse!"', { duration: 5000 });
  await wait(3800);
  henchmen.forEach(h => h.visible = true);
  showLine('The Stranger nods to two men lounging by the door. Before your sword clears its scabbard, a blow from a bench catches you from behind.', { duration: 5200 });
  await wait(2600);
  await fadeToBlack(1400);
  showLine("You come to, hours later, head throbbing, innkeeper fussing over the gash on your scalp. Your pockets are turned out. The letter to Monsieur de Tréville is gone — taken, you're certain, by the Stranger himself.", { duration: 7000 });
  if (collected.letter) {
    inventoryEls.letter.classList.remove('collected');
    inventoryEls.letter.style.textDecoration = 'line-through';
  }
  await wait(4200);
  showEndCard();
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function showEndCard() {
  chapterEnded = true;
  const overlay = document.createElement('div');
  overlay.id = 'end-card';
  overlay.innerHTML = `
    <div>
      <h1>End of Chapter One</h1>
      <p>"The Three Presents of D'Artagnan the Elder"</p>
      <p class="small">Next: Chapter Two — The Antechamber of M. de Tréville</p>
      <button id="restart-btn">Replay Chapter One</button>
    </div>`;
  Object.assign(overlay.style, {
    position: 'fixed', inset: 0, background: 'rgba(5,4,2,0.94)',
    color: '#f2e6c9', display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 30, textAlign: 'center', fontFamily: 'Georgia, serif',
  });
  document.body.appendChild(overlay);
  document.getElementById('restart-btn').addEventListener('click', () => location.reload());
}

const controls = new PointerLockControls(camera, renderer.domElement);
const blocker = document.getElementById('blocker');

blocker.addEventListener('click', () => {
  if (!renderer.xr.isPresenting) controls.lock();
});
controls.addEventListener('lock', () => blocker.classList.add('hidden'));
controls.addEventListener('unlock', () => { if (!chapterEnded) blocker.classList.remove('hidden'); });

const keys = { w: false, a: false, s: false, d: false };
window.addEventListener('keydown', e => { if (e.key.toLowerCase() in keys) keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { if (e.key.toLowerCase() in keys) keys[e.key.toLowerCase()] = false; });

const WALK_SPEED = 4.2;
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
function updateDesktopMovement(dt) {
  if (!controls.isLocked || renderer.xr.isPresenting) return;
  camera.getWorldDirection(forward);
  forward.y = 0; forward.normalize();
  right.set(forward.z, 0, -forward.x);

  const move = new THREE.Vector3();
  if (keys.w) move.add(forward);
  if (keys.s) move.sub(forward);
  if (keys.d) move.add(right);
  if (keys.a) move.sub(right);
  if (move.lengthSq() > 0) {
    move.normalize().multiplyScalar(WALK_SPEED * dt);
    playerRig.position.add(move);
    clampToWorld();
  }
}

function clampToWorld() {
  playerRig.position.x = THREE.MathUtils.clamp(playerRig.position.x, -14, 14);
  playerRig.position.z = THREE.MathUtils.clamp(playerRig.position.z, -188, 6);
}

const raycaster = new THREE.Raycaster();
const tempMatrix = new THREE.Matrix4();
const teleportMarker = new THREE.Mesh(
  new THREE.RingGeometry(0.25, 0.35, 24),
  new THREE.MeshBasicMaterial({ color: 0x88ff88, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
);
teleportMarker.rotation.x = -Math.PI / 2;
teleportMarker.visible = false;
scene.add(teleportMarker);

function buildController(index) {
  const controller = renderer.xr.getController(index);
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1),
  ]);
  const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xf2e6c9 }));
  line.scale.z = 8;
  controller.add(line);
  controller.userData.active = false;
  controller.addEventListener('selectstart', () => { controller.userData.active = true; });
  controller.addEventListener('selectend', () => {
    controller.userData.active = false;
    if (teleportMarker.visible) {
      playerRig.position.x = teleportMarker.position.x;
      playerRig.position.z = teleportMarker.position.z;
      clampToWorld();
    }
  });
  playerRig.add(controller);
  return controller;
}
const controller0 = buildController(0);
const controller1 = buildController(1);

function updateVRTeleportAim() {
  teleportMarker.visible = false;
  for (const controller of [controller0, controller1]) {
    if (!controller.userData.active) continue;
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    const hit = raycaster.ray.origin.y / -raycaster.ray.direction.y;
    if (hit > 0 && hit < 40) {
      const point = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(hit));
      teleportMarker.position.copy(point);
      teleportMarker.visible = true;
    }
  }
}

renderer.xr.addEventListener('sessionstart', () => {
  blocker.classList.add('hidden');
  playerRig.position.set(0, 0, 5);
});
renderer.xr.addEventListener('sessionend', () => {
  if (!chapterEnded) blocker.classList.remove('hidden');
});

playerRig.position.set(0, 0, 5);
const clock = new THREE.Clock();
let ringPulse = 0;

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  ringPulse += dt;

  updateDesktopMovement(dt);
  if (renderer.xr.isPresenting) updateVRTeleportAim();
  updateInteractables();

  for (const ring of teleportRings) {
    ring.material.opacity = 0.35 + 0.3 * Math.sin(ringPulse * 2 + ring.position.z);
  }
  const strangerBob = Math.sin(ringPulse * 1.5) * 0.03;
  stranger.position.y = 3.0 + strangerBob;

  renderer.render(scene, camera);
});

if (new URLSearchParams(location.search).has('debug')) {
  window.__debug = { playerRig, collected, interactables, startConfrontation, clampToWorld, showLine, queueLine };
  console.log('[debug] window.__debug exposed:', window.__debug);
}
