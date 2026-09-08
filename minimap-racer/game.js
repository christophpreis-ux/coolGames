"use strict";

/* =========================================================================
   Minimap Racer
   Der Wagen fährt automatisch, an Kreuzungen muss per ←/→ (manchmal auch ↑
   für geradeaus) die Richtung gewählt werden, bevor es weitergeht. 3 lange,
   zunehmend schwierigere Level. Weil die Strecken lang sind, folgt die
   Kamera dem Wagen; eine kleine Übersichtskarte in der Ecke zeigt die
   gesamte Strecke, damit man die Orientierung nicht verliert.
   ========================================================================= */

// ---------------------------------------------------------------------
// Track-Builder: baut einen Knoten/Kanten-Graphen aus einer Kette von
// geraden Stücken und Gabelungen (Kreuzung -> 2 oder 3 Äste -> Zusammen-
// führung). Arbeitet mit einer laufenden Fahrtrichtung, damit Level auch
// Kurven enthalten können (nicht nur rein horizontale Strecken).
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
  // branches: 2 oder 3 Äste, je { fwd, lat } relativ zur Kreuzung
  // (Fwd = entlang der Fahrtrichtung, Lat = seitlich versetzt).
  // mFwd: wie weit die Zusammenführung (auf der Mittellinie) danach liegt.
  function fork(prefix, { approach, mFwd, branches }) {
    const jId = prefix + "J", mId = prefix + "M";
    const perp = perpOf(heading);

    nodes[jId] = movePoint(nodes[cur], heading, approach);
    edgeDefs.push([cur, jId]);

    const branchIds = branches.map((br, i) => {
      const id = prefix + "B" + i;
      nodes[id] = movePoint(movePoint(nodes[jId], heading, br.fwd || 0), perp, br.lat);
      edgeDefs.push([jId, id]);
      return id;
    });

    nodes[mId] = movePoint(nodes[jId], heading, mFwd);
    for (const id of branchIds) edgeDefs.push([id, mId]);

    cur = mId;
  }

  function finish(length) {
    straight("F", length);
  }

  return { nodes, edgeDefs, straight, turn, fork, finish };
}

// Kleine Helfer, um Gabelungen mit 2 bzw. 3 Ästen bequem zu beschreiben.
function twoWay(approach, shortLat, longFwd, longLat, mFwd) {
  return {
    approach, mFwd,
    branches: [
      { fwd: 0, lat: -shortLat },
      { fwd: longFwd, lat: longLat },
    ],
  };
}

function threeWay(approach, leftLat, straightFwd, rightFwd, rightLat, mFwd) {
  return {
    approach, mFwd,
    branches: [
      { fwd: 0, lat: -leftLat },
      { fwd: straightFwd, lat: 0 },
      { fwd: rightFwd, lat: rightLat },
    ],
  };
}

// ---------------------------------------------------------------------
// Level-Definitionen: 3 lange Strecken mit steigender Schwierigkeit.
// Schwieriger = mehr Kreuzungen (teils mit 3 Abzweigungen), höheres Tempo,
// kürzerer Brems-/Beschleunigungsweg, mehr Kurven im Streckenverlauf.
// ---------------------------------------------------------------------

const LEVEL_DEFS = [
  {
    name: "Level 1 – Einstieg",
    cruiseSpeed: 380,
    decelDist: 130,
    accelDist: 130,
    build() {
      const b = createTrackBuilder(0);
      b.fork("f1", twoWay(280, 220, 120, 340, 320));
      b.fork("f2", threeWay(240, 240, 260, 140, 380, 320));
      b.fork("f3", twoWay(220, 230, 130, 360, 300));
      b.fork("f4", twoWay(200, 240, 140, 380, 300));
      b.fork("f5", twoWay(180, 250, 150, 400, 280));
      b.finish(220);
      return b;
    },
  },
  {
    name: "Level 2 – Volles Tempo",
    cruiseSpeed: 420,
    decelDist: 115,
    accelDist: 115,
    build() {
      const b = createTrackBuilder(0);
      b.fork("f1", twoWay(300, 260, 140, 400, 340));
      b.fork("f2", threeWay(260, 260, 280, 150, 420, 340));
      b.fork("f3", twoWay(220, 250, 140, 400, 320));
      b.fork("f4", twoWay(200, 260, 150, 420, 320));
      b.turn(60);
      b.fork("f5", threeWay(240, 270, 290, 160, 440, 340));
      b.fork("f6", twoWay(200, 260, 150, 420, 300));
      b.fork("f7", twoWay(180, 270, 160, 440, 300));
      b.finish(200);
      return b;
    },
  },
  {
    name: "Level 3 – Meisterklasse",
    cruiseSpeed: 460,
    decelDist: 100,
    accelDist: 100,
    build() {
      const b = createTrackBuilder(0);
      b.fork("f1", twoWay(280, 270, 150, 420, 320));
      b.fork("f2", threeWay(240, 270, 290, 160, 440, 340));
      b.fork("f3", twoWay(200, 260, 150, 420, 300));
      b.turn(55);
      b.fork("f4", twoWay(220, 270, 160, 440, 320));
      b.fork("f5", threeWay(220, 280, 300, 170, 460, 340));
      b.turn(-65);
      b.fork("f6", twoWay(220, 270, 160, 440, 320));
      b.fork("f7", twoWay(200, 280, 170, 460, 300));
      b.turn(40);
      b.fork("f8", threeWay(220, 280, 300, 170, 460, 340));
      b.fork("f9", twoWay(180, 270, 160, 440, 300));
      b.finish(200);
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

// true zwischen "Rennen starten"/"Nochmal von vorne" und dem Verlassen
// (✕, Zurück zur Fahrerauswahl, Fahrer wechseln, oder alle 3 Level
// geschafft) – steuert, ob beim nächsten Seitenaufruf direkt wieder ins
// aktuelle Level gesprungen wird statt zur Fahrerauswahl.
let runActive = false;

// ---------------------------------------------------------------------
// Autosave: Fahrer, laufendes Level und bereits verdiente Medaillen
// landen nach jeder Änderung in localStorage, damit ein Rennen, das
// mittendrin abgebrochen wird (z. B. weil Schluss ist für heute), am
// nächsten Tag beim aktuellen Level weitergeht statt bei Level 1. Die
// laufende Fahrphysik selbst wird bewusst nicht festgehalten – beim
// Wiedereinstieg startet das Level einfach neu.
// ---------------------------------------------------------------------

const RACER_SAVE_KEY = "minimap_racer_save_v1";

function saveGame() {
  try {
    localStorage.setItem(RACER_SAVE_KEY, JSON.stringify({
      selectedCharacter,
      runActive,
      currentLevelIndex,
      levelResults: levelResults.map((r) => r && {
        medalKey: r.medal.key,
        totalTime: r.totalTime,
        avgReaction: r.avgReaction,
      }),
    }));
  } catch (err) {
    // z. B. Privatmodus ohne localStorage – dann eben ohne Speichern.
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(RACER_SAVE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);

    selectedCharacter = s.selectedCharacter === "bald" || s.selectedCharacter === "long" ? s.selectedCharacter : null;
    runActive = !!s.runActive;
    currentLevelIndex = Number.isInteger(s.currentLevelIndex) && s.currentLevelIndex >= 0 && s.currentLevelIndex < LEVELS.length
      ? s.currentLevelIndex : 0;
    levelResults = (Array.isArray(s.levelResults) ? s.levelResults : []).map((r) => {
      if (!r || !MEDAL_DEFS[r.medalKey]) return undefined;
      return { medal: MEDAL_DEFS[r.medalKey], totalTime: r.totalTime, avgReaction: r.avgReaction };
    });

    return true;
  } catch (err) {
    return false;
  }
}

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
  pendingStraight: null,
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
const keyStraightEl = document.querySelector(".key-straight");
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

function selectCharacter(character) {
  document.querySelectorAll(".character-card").forEach((c) => c.classList.remove("selected"));
  const card = document.querySelector(`.character-card[data-character="${character}"]`);
  if (card) card.classList.add("selected");
  selectedCharacter = character;
  btnStart.disabled = false;
  saveGame();
}

document.querySelectorAll(".character-card").forEach((card) => {
  card.addEventListener("click", () => selectCharacter(card.dataset.character));
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
btnBack.addEventListener("click", () => {
  runActive = false;
  saveGame();
  showScreen("select");
});
btnExitRace.addEventListener("click", () => exitRace());
btnRestartAll.addEventListener("click", () => {
  levelResults = [];
  startLevel(0);
});
btnChangeDriver.addEventListener("click", () => {
  runActive = false;
  saveGame();
  showScreen("select");
});

// ---------------------------------------------------------------------
// Kamera: folgt dem Wagen (die Strecken sind zu lang für eine feste
// Gesamtansicht). Dazu eine kleine Mini-Übersichtskarte in der Ecke,
// die immer die komplette Strecke zeigt, damit die Orientierung nicht
// verloren geht.
// ---------------------------------------------------------------------

const DESIRED_VISIBLE_WORLD_WIDTH = 1000; // Weltbreite, die auf den Bildschirm passen soll
const CAMERA_LOOKAHEAD = 160;
const CAMERA_SMOOTHING = 6; // höher = die Kamera folgt strammer

let mainScale = 1;
let view = { scale: 1, offsetX: 0, offsetY: 0 };
let insetView = null;
let camera = { x: 0, y: 0 };

function project(v, x, y) {
  return [x * v.scale + v.offsetX, y * v.scale + v.offsetY];
}

function worldToScreen(x, y) {
  return project(view, x, y);
}

function computeInsetView() {
  const rectW = canvas.width * 0.2;
  const rectH = canvas.height * 0.22;
  const margin = canvas.width * 0.018;
  const rectX = canvas.width - rectW - margin;
  const rectY = margin;

  const pad = 60;
  const xs = Object.values(currentLevel.nodes).map((n) => n.x);
  const ys = Object.values(currentLevel.nodes).map((n) => n.y);
  const minX = Math.min(...xs) - pad;
  const maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad;
  const maxY = Math.max(...ys) + pad;
  const worldW = maxX - minX;
  const worldH = maxY - minY;

  const scale = Math.min(rectW / worldW, rectH / worldH);
  const offsetX = rectX + (rectW - worldW * scale) / 2 - minX * scale;
  const offsetY = rectY + (rectH - worldH * scale) / 2 - minY * scale;

  insetView = { scale, offsetX, offsetY, rectX, rectY, rectW, rectH };
}

function resizeCanvas() {
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
  mainScale = canvas.width / DESIRED_VISIBLE_WORLD_WIDTH;
  computeInsetView();
}

window.addEventListener("resize", () => {
  if (screens.race.classList.contains("active")) resizeCanvas();
});

function updateCamera(dt) {
  const focusX = car.x + Math.cos(car.heading) * CAMERA_LOOKAHEAD;
  const focusY = car.y + Math.sin(car.heading) * CAMERA_LOOKAHEAD;

  const smoothing = 1 - Math.exp(-CAMERA_SMOOTHING * dt);
  camera.x += (focusX - camera.x) * smoothing;
  camera.y += (focusY - camera.y) * smoothing;

  view = {
    scale: mainScale,
    offsetX: canvas.width / 2 - camera.x * mainScale,
    offsetY: canvas.height / 2 - camera.y * mainScale,
  };
}

// ---------------------------------------------------------------------
// Race setup / loop
// ---------------------------------------------------------------------

function startLevel(index) {
  currentLevelIndex = index;
  currentLevel = LEVELS[index];
  runActive = true;
  saveGame();

  car.state = "driving";
  car.edge = firstEdgeFrom(currentLevel, START_NODE);
  car.t = 0;
  car.speed = currentLevel.cruiseSpeed;
  car.distanceTraveled = 0;
  [car.x, car.y] = [currentLevel.nodes[START_NODE].x, currentLevel.nodes[START_NODE].y];
  car.heading = 0;
  camera.x = car.x;
  camera.y = car.y;

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
  runActive = false;
  saveGame();
  showScreen("select");
}

// Bestimmt per Winkel zur Einfahrtsrichtung, welcher Ast an einer Kreuzung
// "links", "geradeaus" bzw. "rechts" ist. Funktioniert unabhängig von der
// absoluten Fahrtrichtung (auch in Kurven, siehe Level 2/3) und mit
// beliebig vielen Ästen (wir nutzen 2 oder 3).
function resolveJunctionOptions(level, incomingEdge) {
  const from = level.nodes[incomingEdge.from];
  const to = level.nodes[incomingEdge.to];
  const inAngle = Math.atan2(to.y - from.y, to.x - from.x);

  const options = level.outgoing[incomingEdge.to].map((e) => {
    const p = level.nodes[e.from], q = level.nodes[e.to];
    let rel = Math.atan2(q.y - p.y, q.x - p.x) - inAngle;
    while (rel > Math.PI) rel -= Math.PI * 2;
    while (rel <= -Math.PI) rel += Math.PI * 2;
    return { edge: e, rel };
  });
  options.sort((a, b) => a.rel - b.rel);

  if (options.length === 2) {
    return { left: options[0].edge, straight: null, right: options[1].edge };
  }
  return { left: options[0].edge, straight: options[1].edge, right: options[options.length - 1].edge };
}

function enterWaitingAtJunction() {
  car.state = "waiting";
  car.speed = 0;
  const options = resolveJunctionOptions(currentLevel, car.edge);
  car.pendingLeft = options.left;
  car.pendingStraight = options.straight;
  car.pendingRight = options.right;

  keyStraightEl.classList.toggle("hidden", !options.straight);

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
  const chosen = side === "left" ? car.pendingLeft : side === "right" ? car.pendingRight : car.pendingStraight;
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
  } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
    chooseDirection("straight");
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

function drawRoadNetwork(v, roadWidth, centerLineWidth) {
  ctx.lineCap = "round";

  for (const edge of currentLevel.edges) {
    const [x1, y1] = project(v, currentLevel.nodes[edge.from].x, currentLevel.nodes[edge.from].y);
    const [x2, y2] = project(v, currentLevel.nodes[edge.to].x, currentLevel.nodes[edge.to].y);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "#33383f";
    ctx.lineWidth = roadWidth;
    ctx.stroke();

    if (centerLineWidth > 0) {
      ctx.setLineDash([roadWidth * 0.4, roadWidth * 0.5]);
      ctx.strokeStyle = "#f2d24b";
      ctx.lineWidth = centerLineWidth;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

function drawNodes(v, dotRadius) {
  for (const [id, n] of Object.entries(currentLevel.nodes)) {
    const [x, y] = project(v, n.x, n.y);

    if (id === START_NODE) {
      ctx.fillStyle = "#4bd07a";
      ctx.beginPath();
      ctx.arc(x, y, dotRadius * 1.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === FINISH_NODE) {
      drawCheckerFlag(x, y, dotRadius * 2.5);
    } else if (isJunction(currentLevel, id)) {
      ctx.fillStyle = "#f2994a";
      ctx.beginPath();
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawCheckerFlag(x, y, size) {
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

function drawMinimapInset() {
  const v = insetView;
  ctx.save();
  ctx.beginPath();
  ctx.rect(v.rectX, v.rectY, v.rectW, v.rectH);
  ctx.clip();

  ctx.fillStyle = "rgba(15,17,20,0.88)";
  ctx.fillRect(v.rectX, v.rectY, v.rectW, v.rectH);

  drawRoadNetwork(v, Math.max(2, v.scale * 22), 0);
  drawNodes(v, Math.max(2, v.scale * 7));

  const [cx, cy] = project(v, car.x, car.y);
  ctx.fillStyle = "#f4f6f8";
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(3, v.scale * 10), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.strokeRect(v.rectX, v.rectY, v.rectW, v.rectH);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#14171b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const roadWidth = Math.max(14, 30 * view.scale);
  drawRoadNetwork(view, roadWidth, Math.max(1.5, roadWidth * 0.06));
  drawNodes(view, Math.max(4, 8 * view.scale));

  const [sx, sy] = worldToScreen(car.x, car.y);
  drawCart(ctx, sx, sy, car.heading, selectedCharacter || "bald");

  drawMinimapInset();
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
  updateCamera(dt);
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

const MEDAL_DEFS = {
  diamond: { key: "diamond", icon: "💎", name: "Diamant-Medaille", desc: "Schnellste Gesamtzeit – perfekte Route, blitzschnell abgebogen!" },
  gold: { key: "gold", icon: "🥇", name: "Gold-Medaille", desc: "⌀ Reaktionszeit an Kreuzungen: 5 Sekunden oder schneller." },
  silver: { key: "silver", icon: "🥈", name: "Silber-Medaille", desc: "⌀ Reaktionszeit an Kreuzungen: bis zu 10 Sekunden." },
  none: { key: "none", icon: "🏁", name: "Ziel erreicht", desc: "Keine Medaille – versuch schneller an den Kreuzungen zu reagieren." },
};

function computeMedal(level, totalTime, avgReaction) {
  if (totalTime <= level.diamondTimeLimit) return MEDAL_DEFS.diamond;
  if (avgReaction <= 5) return MEDAL_DEFS.gold;
  if (avgReaction <= 10) return MEDAL_DEFS.silver;
  return MEDAL_DEFS.none;
}

function showResults() {
  const avgReaction = reactionTimes.length ? average(reactionTimes) : 0;
  const medal = computeMedal(currentLevel, raceElapsed, avgReaction);

  levelResults[currentLevelIndex] = {
    medal,
    totalTime: raceElapsed,
    avgReaction,
  };
  saveGame();

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
  runActive = false;
  saveGame();
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

// ---------------------------------------------------------------------
// Boot: gespeicherten Spielstand laden. War man mitten in einem Lauf
// (Level gestartet, aber noch nicht beendet/verlassen), springt man
// direkt wieder ins aktuelle Level statt zur Fahrerauswahl.
// ---------------------------------------------------------------------

if (loadGame()) {
  if (selectedCharacter) selectCharacter(selectedCharacter);
  if (runActive && selectedCharacter) startLevel(currentLevelIndex);
}
