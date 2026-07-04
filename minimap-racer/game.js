"use strict";

/* =========================================================================
   Minimap Racer
   Das gesamte Spielfeld IST die Minimap: eine feste, ans Fenster angepasste
   Draufsicht auf die Strecke. Der Wagen fährt automatisch, an Kreuzungen
   muss per ←/→ die Abbiegerichtung gewählt werden, bevor es weitergeht.
   5 Level mit steigender Schwierigkeit (mehr Kreuzungen, mehr Tempo,
   weniger Brems-/Beschleunigungsweg), am Ende eine Gesamtübersicht.
   ========================================================================= */

// ---------------------------------------------------------------------
// Track-Builder: baut einen Knoten/Kanten-Graphen aus einer Kette von
// geraden Stücken und Gabelungen (Kreuzung -> zwei Äste -> Zusammenführung).
// Arbeitet mit einer laufenden Fahrtrichtung, damit Level auch Kurven
// enthalten können (nicht nur rein horizontale Strecken).
// ---------------------------------------------------------------------

function vecFromAngleDeg(deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: Math.cos(rad), y: Math.sin(rad) };
}

function rotateVec(v, deg) {
  const rad = (deg * Math.PI) / 180;
  const c = Math.cos(rad), s = Math.sin(rad);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}

function perpOf(h) {
  return { x: -h.y, y: h.x };
}

function movePoint(p, dir, len) {
  return { x: p.x + dir.x * len, y: p.y + dir.y * len };
}

function createTrackBuilder(startHeadingDeg) {
  const nodes = { S: { x: 0, y: 0 } };
  const edgeDefs = [];
  let cur = "S";
  let heading = vecFromAngleDeg(startHeadingDeg);

  function straight(id, length) {
    nodes[id] = movePoint(nodes[cur], heading, length);
    edgeDefs.push([cur, id]);
    cur = id;
  }

  function turn(deg) {
    heading = rotateVec(heading, deg);
  }

  // approach: Strecke von der aktuellen Position bis zur Kreuzung.
  // aFwd/aLat, bFwd/bLat: Position der beiden Äste relativ zur Kreuzung
  // (Fwd = entlang der Fahrtrichtung, Lat = seitlich versetzt).
  // mFwd: wie weit die Zusammenführung (auf der Mittellinie) danach liegt.
  function fork(prefix, { approach, aFwd = 0, aLat, bFwd = 0, bLat, mFwd }) {
    const jId = prefix + "J", aId = prefix + "A", bId = prefix + "B", mId = prefix + "M";
    const perp = perpOf(heading);

    nodes[jId] = movePoint(nodes[cur], heading, approach);
    edgeDefs.push([cur, jId]);

    nodes[aId] = movePoint(movePoint(nodes[jId], heading, aFwd), perp, -aLat);
    edgeDefs.push([jId, aId]);

    nodes[bId] = movePoint(movePoint(nodes[jId], heading, bFwd), perp, bLat);
    edgeDefs.push([jId, bId]);

    nodes[mId] = movePoint(nodes[jId], heading, mFwd);
    edgeDefs.push([aId, mId]);
    edgeDefs.push([bId, mId]);

    cur = mId;
  }

  function finish(length) {
    straight("F", length);
  }

  return { nodes, edgeDefs, straight, turn, fork, finish };
}

// ---------------------------------------------------------------------
// Level-Definitionen: 5 Strecken mit steigender Schwierigkeit.
// Schwieriger = mehr Kreuzungen, höheres Tempo, kürzerer Brems-/
// Beschleunigungsweg, längere Umwege bei falscher Abzweigung.
// ---------------------------------------------------------------------

const LEVEL_DEFS = [
  {
    name: "Level 1 – Einstieg",
    cruiseSpeed: 360,
    decelDist: 150,
    accelDist: 150,
    build() {
      const b = createTrackBuilder(0);
      b.fork("f1", { approach: 260, aLat: 210, bLat: 300, mFwd: 300 });
      b.fork("f2", { approach: 240, aLat: 220, bFwd: 100, bLat: 340, mFwd: 260 });
      b.finish(220);
      return b;
    },
  },
  {
    name: "Level 2 – Aufwärmen",
    cruiseSpeed: 390,
    decelDist: 140,
    accelDist: 140,
    build() {
      const b = createTrackBuilder(0);
      b.fork("f1", { approach: 300, aLat: 280, bLat: 400, mFwd: 350 });
      b.fork("f2", { approach: 250, aLat: 270, bFwd: 150, bLat: 450, mFwd: 350 });
      b.fork("f3", { approach: 100, aLat: 270, bFwd: 150, bLat: 450, mFwd: 300 });
      b.finish(150);
      return b;
    },
  },
  {
    name: "Level 3 – Volles Tempo",
    cruiseSpeed: 415,
    decelDist: 130,
    accelDist: 130,
    build() {
      const b = createTrackBuilder(0);
      b.fork("f1", { approach: 300, aLat: 280, bLat: 400, mFwd: 350 });
      b.fork("f2", { approach: 250, aLat: 270, bFwd: 150, bLat: 450, mFwd: 350 });
      b.fork("f3", { approach: 150, aLat: 270, bFwd: 150, bLat: 450, mFwd: 300 });
      b.fork("f4", { approach: 150, aLat: 280, bFwd: 170, bLat: 500, mFwd: 320 });
      b.finish(180);
      return b;
    },
  },
  {
    name: "Level 4 – Präzision",
    cruiseSpeed: 440,
    decelDist: 120,
    accelDist: 120,
    build() {
      const b = createTrackBuilder(0);
      b.fork("f1", { approach: 280, aLat: 280, bLat: 400, mFwd: 320 });
      b.fork("f2", { approach: 220, aLat: 270, bFwd: 150, bLat: 450, mFwd: 320 });
      b.fork("f3", { approach: 130, aLat: 270, bFwd: 150, bLat: 450, mFwd: 280 });
      b.fork("f4", { approach: 130, aLat: 280, bFwd: 170, bLat: 500, mFwd: 300 });
      b.fork("f5", { approach: 130, aLat: 290, bFwd: 190, bLat: 560, mFwd: 300 });
      b.finish(170);
      return b;
    },
  },
  {
    name: "Level 5 – Meisterklasse",
    cruiseSpeed: 465,
    decelDist: 110,
    accelDist: 110,
    build() {
      const b = createTrackBuilder(0);
      b.fork("f1", { approach: 260, aLat: 280, bLat: 400, mFwd: 300 });
      b.fork("f2", { approach: 200, aLat: 270, bFwd: 150, bLat: 450, mFwd: 300 });
      b.fork("f3", { approach: 120, aLat: 270, bFwd: 150, bLat: 450, mFwd: 260 });
      b.turn(55);
      b.fork("f4", { approach: 220, aLat: 280, bFwd: 170, bLat: 480, mFwd: 280 });
      b.turn(-70);
      b.fork("f5", { approach: 200, aLat: 280, bFwd: 180, bLat: 500, mFwd: 280 });
      b.fork("f6", { approach: 120, aLat: 290, bFwd: 190, bLat: 540, mFwd: 280 });
      b.finish(160);
      return b;
    },
  },
];

const START_NODE = "S";
const FINISH_NODE = "F";
const MIN_REACTION_PER_JUNCTION = 0.2; // Annahme für eine "perfekte" Fahrt (Diamant-Basis)
const DIAMOND_TIME_FACTOR = 1.1;

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Dijkstra über den Level-Graphen -> kürzeste Distanz zwischen zwei Knoten.
function shortestPathLength(level, startId, endId) {
  const ids = Object.keys(level.nodes);
  const dists = {};
  for (const id of ids) dists[id] = Infinity;
  dists[startId] = 0;
  const visited = new Set();

  while (visited.size < ids.length) {
    let current = null;
    let currentDist = Infinity;
    for (const id of ids) {
      if (!visited.has(id) && dists[id] < currentDist) {
        current = id;
        currentDist = dists[id];
      }
    }
    if (current === null) break;
    visited.add(current);
    if (current === endId) break;

    for (const e of level.outgoing[current]) {
      const alt = dists[current] + e.length;
      if (alt < dists[e.to]) dists[e.to] = alt;
    }
  }
  return dists[endId];
}

function isJunction(level, nodeId) {
  return level.outgoing[nodeId].length > 1;
}

function firstEdgeFrom(level, nodeId) {
  return level.outgoing[nodeId][0];
}

// Von einer Kreuzung aus ist die schnellste Wahl die Abzweigung, deren
// (eigene Länge + kürzester Restweg zum Ziel) minimal ist.
function bestEdgeAt(level, nodeId) {
  let best = null;
  let bestTotal = Infinity;
  for (const e of level.outgoing[nodeId]) {
    const total = e.length + shortestPathLength(level, e.to, FINISH_NODE);
    if (total < bestTotal) {
      bestTotal = total;
      best = e;
    }
  }
  return best;
}

// Reine Physik-Funktion (kein DOM/Global-State), damit sie sowohl im
// echten Spiel als auch in der Kopfrechnung für die Diamant-Zielzeit
// (simulateOptimalRun) exakt dasselbe Verhalten hat.
function stepDriving(level, state, dt) {
  const edge = state.edge;
  const from = level.nodes[edge.from];
  const to = level.nodes[edge.to];
  const remainingDist = (1 - state.t) * edge.length;
  const nextNodeIsJunction = isJunction(level, edge.to) && edge.to !== FINISH_NODE;

  if (nextNodeIsJunction && remainingDist < level.decelDist) {
    // Konstante Bremsverzögerung: v = sqrt(2 * a * verbleibende Distanz),
    // sodass die Geschwindigkeit exakt an der Kreuzung bei 0 ankommt.
    const decel = (level.cruiseSpeed * level.cruiseSpeed) / (2 * level.decelDist);
    state.speed = Math.sqrt(Math.max(0, 2 * decel * remainingDist));
  } else if (state.speed < level.cruiseSpeed) {
    const accel = (level.cruiseSpeed * level.cruiseSpeed) / (2 * level.accelDist);
    state.speed = Math.min(level.cruiseSpeed, state.speed + accel * dt);
  } else {
    state.speed = level.cruiseSpeed;
  }

  // Bewegung auf die Restdistanz begrenzen, damit der Wagen exakt am
  // Knoten ankommt statt in einem einzelnen (großen) Frame darüber
  // hinauszuschießen und die Kreuzung zu verpassen.
  const moveDist = Math.min(state.speed * dt, remainingDist);
  state.distanceTraveled += moveDist;
  state.t = Math.min(1, state.t + moveDist / edge.length);
  state.x = from.x + (to.x - from.x) * state.t;
  state.y = from.y + (to.y - from.y) * state.t;
  state.heading = Math.atan2(to.y - from.y, to.x - from.x);

  if (state.t >= 1) {
    state.speed = 0;
    if (edge.to === FINISH_NODE) return "finished";
    if (nextNodeIsJunction) return "waiting";
    return "continue";
  }
  return "driving";
}

// Simuliert eine fehlerfreie Fahrt (optimale Route, konstante Reaktionszeit
// pro Kreuzung) mit fester Schrittweite, um die Diamant-Zielzeit direkt aus
// der tatsächlichen Fahrphysik abzuleiten statt sie von Hand zu schätzen.
function simulateOptimalRun(level, reactionDelay) {
  const dt = 1 / 120;
  const state = {
    edge: firstEdgeFrom(level, START_NODE),
    t: 0,
    speed: level.cruiseSpeed,
    x: level.nodes[START_NODE].x,
    y: level.nodes[START_NODE].y,
    heading: 0,
    distanceTraveled: 0,
  };
  let elapsed = 0;

  for (let guard = 0; guard < 200000; guard++) {
    const result = stepDriving(level, state, dt);
    elapsed += dt;

    if (result === "finished") return elapsed;
    if (result === "continue") {
      state.edge = firstEdgeFrom(level, state.edge.to);
      state.t = 0;
    } else if (result === "waiting") {
      elapsed += reactionDelay;
      state.edge = bestEdgeAt(level, state.edge.to);
      state.t = 0;
      state.speed = 0;
    }
  }
  throw new Error("simulateOptimalRun: Ziel nicht erreicht (Endlosschleife?)");
}

// Baut einen Level-Def zu einem vollständigen, spielbaren Level aus:
// Graph, Kantenlängen, Kreuzungszahl, optimale Distanz und die daraus
// simulierte Diamant-Zielzeit.
function prepareLevel(def) {
  const built = def.build();
  const edges = built.edgeDefs.map(([from, to]) => ({
    from, to, length: dist(built.nodes[from], built.nodes[to]),
  }));
  const outgoing = {};
  for (const id of Object.keys(built.nodes)) outgoing[id] = [];
  for (const e of edges) outgoing[e.from].push(e);

  const level = {
    name: def.name,
    cruiseSpeed: def.cruiseSpeed,
    decelDist: def.decelDist,
    accelDist: def.accelDist,
    nodes: built.nodes,
    edges,
    outgoing,
  };

  level.junctionCount = Object.keys(level.nodes).filter((id) => isJunction(level, id)).length;
  level.optimalDistance = shortestPathLength(level, START_NODE, FINISH_NODE);
  level.parTime = simulateOptimalRun(level, MIN_REACTION_PER_JUNCTION);
  level.diamondTimeLimit = level.parTime * DIAMOND_TIME_FACTOR;

  return level;
}

const LEVELS = LEVEL_DEFS.map(prepareLevel);

// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------

let selectedCharacter = null;
let currentLevelIndex = 0;
let levelResults = []; // { medal, totalTime, avgReaction } pro Level, Index = Levelnummer-1

let currentLevel = LEVELS[0];

const car = {
  state: "idle", // idle | driving | waiting | finished
  edge: null,
  t: 0,
  speed: 0,
  x: 0,
  y: 0,
  heading: 0,
  pendingLeft: null,
  pendingRight: null,
};

let raceStartTime = 0;
let raceElapsed = 0;
let reactionStartTime = 0;
let reactionTimes = [];
let distanceTraveled = 0;
let lastFrameTime = 0;

// ---------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------

const screens = {
  select: document.getElementById("screen-select"),
  race: document.getElementById("screen-race"),
  result: document.getElementById("screen-result"),
  overview: document.getElementById("screen-overview"),
};

const btnStart = document.getElementById("btn-start");
const btnRetry = document.getElementById("btn-retry");
const btnNext = document.getElementById("btn-next");
const btnBack = document.getElementById("btn-back");
const btnExitRace = document.getElementById("btn-exit-race");
const btnRestartAll = document.getElementById("btn-restart-all");
const btnChangeDriver = document.getElementById("btn-change-driver");
const resultHeading = document.getElementById("result-heading");
const hudTimer = document.getElementById("hud-timer");
const hudLevel = document.getElementById("hud-level");
const hudJunctionCount = document.getElementById("hud-junction-count");
const decisionBanner = document.getElementById("decision-banner");
const decisionTimerFill = document.getElementById("decision-timerbar-fill");
const medalBadge = document.getElementById("medal-badge");
const resultStats = document.getElementById("result-stats");
const overviewList = document.getElementById("overview-list");

const canvas = document.getElementById("race-canvas");
const ctx = canvas.getContext("2d");

function showScreen(name) {
  for (const key of Object.keys(screens)) {
    screens[key].classList.toggle("active", key === name);
  }
}

// ---------------------------------------------------------------------
// Character portraits & car sprite (alles reines Canvas, keine Assets)
// ---------------------------------------------------------------------

function drawHead(ctx, cx, cy, radius, character, angle) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Kopf
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#e8b28a";
  ctx.fill();

  if (character === "long") {
    // Lange Haare: schwingende Form hinter/um den Kopf
    ctx.beginPath();
    ctx.moveTo(-radius * 0.9, -radius * 0.2);
    ctx.quadraticCurveTo(-radius * 1.9, radius * 0.4, -radius * 1.3, radius * 1.6);
    ctx.quadraticCurveTo(-radius * 0.6, radius * 1.9, -radius * 0.3, radius * 1.1);
    ctx.quadraticCurveTo(radius * 0.3, radius * 1.9, radius * 1.0, radius * 1.6);
    ctx.quadraticCurveTo(radius * 1.9, radius * 0.5, radius * 0.9, -radius * 0.2);
    ctx.closePath();
    ctx.fillStyle = "#3b2a1e";
    ctx.fill();

    // Kopf nochmal oben drauf, damit Gesicht sichtbar bleibt
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.95, 0, Math.PI * 2);
    ctx.fillStyle = "#e8b28a";
    ctx.fill();
  } else {
    // Glatze: kleiner Glanzpunkt
    ctx.beginPath();
    ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fill();
  }

  ctx.restore();
}

function drawPortrait(canvasEl, character) {
  const pctx = canvasEl.getContext("2d");
  const w = canvasEl.width, h = canvasEl.height;
  pctx.clearRect(0, 0, w, h);
  drawHead(pctx, w / 2, h / 2 + 6, 34, character, 0);
}

function drawCart(ctx, x, y, angle, character) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const bodyW = 34;
  const bodyH = 22;

  // Schatten
  ctx.beginPath();
  ctx.ellipse(0, 4, bodyW * 0.65, bodyH * 0.45, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fill();

  // Räder
  ctx.fillStyle = "#20242a";
  const wheelPositions = [
    [-bodyW / 2 + 4, -bodyH / 2 - 1],
    [bodyW / 2 - 4, -bodyH / 2 - 1],
    [-bodyW / 2 + 4, bodyH / 2 + 1],
    [bodyW / 2 - 4, bodyH / 2 + 1],
  ];
  for (const [wx, wy] of wheelPositions) {
    ctx.beginPath();
    ctx.arc(wx, wy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Einkaufswagen-Korb (Gitter), schrottig-rostige Farbe
  ctx.strokeStyle = "#8a5a3b";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH);

  ctx.lineWidth = 1.4;
  ctx.strokeStyle = "#a9744e";
  for (let i = 1; i < 4; i++) {
    const gx = -bodyW / 2 + (bodyW / 4) * i;
    ctx.beginPath();
    ctx.moveTo(gx, -bodyH / 2);
    ctx.lineTo(gx, bodyH / 2);
    ctx.stroke();
  }
  for (let i = 1; i < 3; i++) {
    const gy = -bodyH / 2 + (bodyH / 3) * i;
    ctx.beginPath();
    ctx.moveTo(-bodyW / 2, gy);
    ctx.lineTo(bodyW / 2, gy);
    ctx.stroke();
  }

  // Rost-Flecken für den "schrottigen" Look
  ctx.fillStyle = "rgba(120,60,20,0.5)";
  ctx.beginPath();
  ctx.arc(-bodyW / 4, bodyH / 4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(bodyW / 3, -bodyH / 4, 2.4, 0, Math.PI * 2);
  ctx.fill();

  // Stoßstange vorne (Fahrtrichtung = +x lokal)
  ctx.fillStyle = "#5c6066";
  ctx.fillRect(bodyW / 2 - 2, -bodyH / 2 - 1, 4, bodyH + 2);

  // Fahrerkopf sitzt hinten im Korb
  drawHead(ctx, -bodyW / 6, 0, 8, character, 0);

  ctx.restore();
}

drawPortrait(document.querySelector('canvas[data-portrait="bald"]'), "bald");
drawPortrait(document.querySelector('canvas[data-portrait="long"]'), "long");

// ---------------------------------------------------------------------
// Character select interactions
// ---------------------------------------------------------------------

document.querySelectorAll(".character-card").forEach((card) => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".character-card").forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
    selectedCharacter = card.dataset.character;
    btnStart.disabled = false;
  });
});

btnStart.addEventListener("click", () => {
  if (!selectedCharacter) return;
  levelResults = [];
  startLevel(0);
});

btnRetry.addEventListener("click", () => startLevel(currentLevelIndex));
btnNext.addEventListener("click", () => {
  if (currentLevelIndex < LEVELS.length - 1) {
    startLevel(currentLevelIndex + 1);
  } else {
    showOverview();
  }
});
btnBack.addEventListener("click", () => showScreen("select"));
btnExitRace.addEventListener("click", () => exitRace());
btnRestartAll.addEventListener("click", () => {
  levelResults = [];
  startLevel(0);
});
btnChangeDriver.addEventListener("click", () => showScreen("select"));

// ---------------------------------------------------------------------
// Canvas sizing + world-to-screen transform (statische Gesamtkarten-Ansicht)
// ---------------------------------------------------------------------

let view = { scale: 1, offsetX: 0, offsetY: 0 };

function computeView() {
  const pad = 120;
  const xs = Object.values(currentLevel.nodes).map((n) => n.x);
  const ys = Object.values(currentLevel.nodes).map((n) => n.y);
  const minX = Math.min(...xs) - pad;
  const maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad;
  const maxY = Math.max(...ys) + pad;

  const worldW = maxX - minX;
  const worldH = maxY - minY;

  const scale = Math.min(canvas.width / worldW, canvas.height / worldH);
  const offsetX = (canvas.width - worldW * scale) / 2 - minX * scale;
  const offsetY = (canvas.height - worldH * scale) / 2 - minY * scale;

  view = { scale, offsetX, offsetY };
}

function worldToScreen(x, y) {
  return [x * view.scale + view.offsetX, y * view.scale + view.offsetY];
}

function resizeCanvas() {
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
  computeView();
}

window.addEventListener("resize", () => {
  if (screens.race.classList.contains("active")) resizeCanvas();
});

// ---------------------------------------------------------------------
// Race setup / loop
// ---------------------------------------------------------------------

function startLevel(index) {
  currentLevelIndex = index;
  currentLevel = LEVELS[index];

  car.state = "driving";
  car.edge = firstEdgeFrom(currentLevel, START_NODE);
  car.t = 0;
  car.speed = currentLevel.cruiseSpeed;
  car.distanceTraveled = 0;
  [car.x, car.y] = [currentLevel.nodes[START_NODE].x, currentLevel.nodes[START_NODE].y];

  raceStartTime = performance.now();
  raceElapsed = 0;
  reactionTimes = [];
  distanceTraveled = 0;

  hudLevel.textContent = `Level ${index + 1}/${LEVELS.length}`;

  showScreen("race");
  decisionBanner.classList.add("hidden");
  requestAnimationFrame(() => {
    resizeCanvas();
    lastFrameTime = performance.now();
    requestAnimationFrame(loop);
  });
}

function exitRace() {
  car.state = "idle";
  decisionBanner.classList.add("hidden");
  showScreen("select");
}

// Bestimmt per Kreuzprodukt, welcher der beiden Äste an einer Kreuzung
// "links" bzw. "rechts" ist – relativ zur Richtung, aus der man kommt.
// Funktioniert unabhängig von der absoluten Fahrtrichtung, also auch in
// Kurven (siehe Level 5).
function resolveJunctionSides(level, incomingEdge) {
  const from = level.nodes[incomingEdge.from];
  const to = level.nodes[incomingEdge.to];
  const inDir = { x: to.x - from.x, y: to.y - from.y };

  const options = level.outgoing[incomingEdge.to];
  const [e1, e2] = options;
  const p1 = level.nodes[e1.from], q1 = level.nodes[e1.to];
  const dir1 = { x: q1.x - p1.x, y: q1.y - p1.y };
  const cross = inDir.x * dir1.y - inDir.y * dir1.x;

  return cross < 0 ? { left: e1, right: e2 } : { left: e2, right: e1 };
}

function enterWaitingAtJunction() {
  car.state = "waiting";
  car.speed = 0;
  const sides = resolveJunctionSides(currentLevel, car.edge);
  car.pendingLeft = sides.left;
  car.pendingRight = sides.right;

  reactionStartTime = performance.now();
  decisionBanner.classList.remove("hidden");
  decisionTimerFill.style.transition = "none";
  decisionTimerFill.style.width = "100%";
  // Sichtbare, sich leerende Leiste als Referenz (10s Skala = Silber-Schwelle)
  requestAnimationFrame(() => {
    decisionTimerFill.style.transition = "width 10s linear";
    decisionTimerFill.style.width = "0%";
  });
}

function chooseDirection(side) {
  if (car.state !== "waiting") return;
  const chosen = side === "left" ? car.pendingLeft : car.pendingRight;
  if (!chosen) return;

  const reactionTime = (performance.now() - reactionStartTime) / 1000;
  reactionTimes.push(reactionTime);

  car.edge = chosen;
  car.t = 0;
  car.state = "driving";
  car.speed = 0;
  decisionBanner.classList.add("hidden");
}

window.addEventListener("keydown", (e) => {
  if (car.state !== "waiting") return;
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
    chooseDirection("left");
  } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
    chooseDirection("right");
  }
});

function updateCar(dt) {
  if (car.state === "finished" || car.state === "waiting") return;

  const result = stepDriving(currentLevel, car, dt);
  distanceTraveled = car.distanceTraveled;

  if (result === "waiting") {
    enterWaitingAtJunction();
  } else if (result === "continue") {
    car.edge = firstEdgeFrom(currentLevel, car.edge.to);
    car.t = 0;
  } else if (result === "finished") {
    finishRace();
  }
}

function finishRace() {
  car.state = "finished";
  raceElapsed = (performance.now() - raceStartTime) / 1000;
  showResults();
}

// ---------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------

function drawRoadNetwork() {
  ctx.lineCap = "round";
  const roadWidth = Math.max(14, 30 * view.scale);

  for (const edge of currentLevel.edges) {
    const [x1, y1] = worldToScreen(currentLevel.nodes[edge.from].x, currentLevel.nodes[edge.from].y);
    const [x2, y2] = worldToScreen(currentLevel.nodes[edge.to].x, currentLevel.nodes[edge.to].y);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "#33383f";
    ctx.lineWidth = roadWidth;
    ctx.stroke();

    // Mittellinie
    ctx.setLineDash([roadWidth * 0.4, roadWidth * 0.5]);
    ctx.strokeStyle = "#f2d24b";
    ctx.lineWidth = Math.max(1.5, roadWidth * 0.06);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawNodes() {
  for (const [id, n] of Object.entries(currentLevel.nodes)) {
    const [x, y] = worldToScreen(n.x, n.y);

    if (id === START_NODE) {
      ctx.fillStyle = "#4bd07a";
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === FINISH_NODE) {
      drawCheckerFlag(x, y);
    } else if (isJunction(currentLevel, id)) {
      ctx.fillStyle = "#f2994a";
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawCheckerFlag(x, y) {
  const size = 18;
  const rows = 4, cols = 4;
  const cell = size / rows;
  ctx.save();
  ctx.translate(x - size / 2, y - size / 2);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? "#f4f6f8" : "#14171b";
      ctx.fillRect(c * cell, r * cell, cell, cell);
    }
  }
  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#14171b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawRoadNetwork();
  drawNodes();

  const [sx, sy] = worldToScreen(car.x, car.y);
  drawCart(ctx, sx, sy, car.heading, selectedCharacter || "bald");
}

// ---------------------------------------------------------------------
// HUD updates
// ---------------------------------------------------------------------

function updateHud() {
  const elapsed = car.state === "finished" ? raceElapsed : (performance.now() - raceStartTime) / 1000;
  hudTimer.textContent = elapsed.toFixed(1) + "s";
  hudJunctionCount.textContent = `Kreuzungen: ${reactionTimes.length}/${currentLevel.junctionCount}`;
}

// ---------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------

function loop(now) {
  const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
  lastFrameTime = now;

  updateCar(dt);
  render();
  updateHud();

  if (car.state === "driving" || car.state === "waiting") {
    requestAnimationFrame(loop);
  }
}

// ---------------------------------------------------------------------
// Results & medals
// ---------------------------------------------------------------------

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function computeMedal(level, totalTime, avgReaction) {
  if (totalTime <= level.diamondTimeLimit) {
    return { key: "diamond", icon: "💎", name: "Diamant-Medaille", desc: "Schnellste Gesamtzeit – perfekte Route, blitzschnell abgebogen!" };
  }
  if (avgReaction <= 5) {
    return { key: "gold", icon: "🥇", name: "Gold-Medaille", desc: "⌀ Reaktionszeit an Kreuzungen: 5 Sekunden oder schneller." };
  }
  if (avgReaction <= 10) {
    return { key: "silver", icon: "🥈", name: "Silber-Medaille", desc: "⌀ Reaktionszeit an Kreuzungen: bis zu 10 Sekunden." };
  }
  return { key: "none", icon: "🏁", name: "Ziel erreicht", desc: "Keine Medaille – versuch schneller an den Kreuzungen zu reagieren." };
}

function showResults() {
  const avgReaction = reactionTimes.length ? average(reactionTimes) : 0;
  const medal = computeMedal(currentLevel, raceElapsed, avgReaction);

  levelResults[currentLevelIndex] = {
    medal,
    totalTime: raceElapsed,
    avgReaction,
  };

  resultHeading.textContent = `${currentLevel.name} geschafft!`;
  medalBadge.textContent = medal.icon;

  const extraDistance = distanceTraveled - currentLevel.optimalDistance;
  const extraPct = Math.max(0, (extraDistance / currentLevel.optimalDistance) * 100);

  resultStats.innerHTML = `
    <div class="medal-name">${medal.name}</div>
    <div class="stat-row"><span>Gesamtzeit</span><b>${raceElapsed.toFixed(2)}s</b></div>
    <div class="stat-row"><span>⌀ Reaktionszeit</span><b>${avgReaction.toFixed(2)}s</b></div>
    <div class="stat-row"><span>Gefahrene Strecke</span><b>${extraPct < 1 ? "optimaler Weg!" : "+" + extraPct.toFixed(0) + "% Umweg"}</b></div>
    <div class="stat-row" style="border:none;color:#a9b2bc;font-size:13px;margin-top:6px">${medal.desc}</div>
  `;

  btnNext.textContent = currentLevelIndex < LEVELS.length - 1 ? "Nächstes Level" : "Gesamtübersicht";

  showScreen("result");
}

function showOverview() {
  overviewList.innerHTML = LEVELS.map((level, i) => {
    const result = levelResults[i];
    if (!result) {
      return `
        <div class="overview-row">
          <div class="overview-medal">–</div>
          <div class="overview-info">
            <div class="overview-level-name">${level.name}</div>
            <div class="overview-medal-name">Nicht gefahren</div>
          </div>
        </div>
      `;
    }
    return `
      <div class="overview-row">
        <div class="overview-medal">${result.medal.icon}</div>
        <div class="overview-info">
          <div class="overview-level-name">${level.name}</div>
          <div class="overview-medal-name">${result.medal.name}</div>
        </div>
        <div class="overview-time">${result.totalTime.toFixed(2)}s</div>
      </div>
    `;
  }).join("");

  showScreen("overview");
}
