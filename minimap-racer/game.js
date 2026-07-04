"use strict";

/* =========================================================================
   Minimap Racer
   Das gesamte Spielfeld IST die Minimap: eine feste, ans Fenster angepasste
   Draufsicht auf die Strecke. Der Wagen fährt automatisch, an Kreuzungen
   muss per ←/→ die Abbiegerichtung gewählt werden, bevor es weitergeht.
   ========================================================================= */

// ---------------------------------------------------------------------
// Track-Definition (Graph aus Knoten + gerichteten Kanten)
// ---------------------------------------------------------------------

const NODES = {
  S:  { x: 100,  y: 500 },
  J1: { x: 400,  y: 500 },
  A1: { x: 400,  y: 220 },
  A2: { x: 400,  y: 900 },
  M1: { x: 750,  y: 500 },
  J2: { x: 1000, y: 500 },
  B1: { x: 1000, y: 230 },
  B2: { x: 1150, y: 950 },
  M2: { x: 1350, y: 500 },
  J3: { x: 1450, y: 500 },
  C1: { x: 1450, y: 230 },
  C2: { x: 1600, y: 950 },
  M3: { x: 1750, y: 500 },
  F:  { x: 1900, y: 500 },
};

// Jeder Eintrag: from, to, side ("left"/"right"/null = keine Wahl nötig)
const EDGE_DEFS = [
  ["S", "J1", null],
  ["J1", "A1", "left"],
  ["J1", "A2", "right"],
  ["A1", "M1", null],
  ["A2", "M1", null],
  ["M1", "J2", null],
  ["J2", "B1", "left"],
  ["J2", "B2", "right"],
  ["B1", "M2", null],
  ["B2", "M2", null],
  ["M2", "J3", null],
  ["J3", "C1", "left"],
  ["J3", "C2", "right"],
  ["C1", "M3", null],
  ["C2", "M3", null],
  ["M3", "F", null],
];

const START_NODE = "S";
const FINISH_NODE = "F";

const CRUISE_SPEED = 400;      // Weltpixel / Sekunde
const DECEL_DIST = 140;        // Bremsweg vor einer Kreuzung
const ACCEL_DIST = 140;        // Beschleunigungsweg nach einer Kreuzung

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function buildGraph() {
  const edges = EDGE_DEFS.map(([from, to, side]) => ({
    from, to, side,
    length: dist(NODES[from], NODES[to]),
  }));

  const outgoing = {};
  for (const id of Object.keys(NODES)) outgoing[id] = [];
  for (const e of edges) outgoing[e.from].push(e);

  return { edges, outgoing };
}

const GRAPH = buildGraph();

function isJunction(nodeId) {
  return GRAPH.outgoing[nodeId].length > 1;
}

// Dijkstra über den kleinen Graphen, um die optimale (kürzeste) Strecke
// zu ermitteln -> daraus leiten wir die Diamant-Zielzeit ab.
function shortestPathLength(startId, endId) {
  const dists = {};
  for (const id of Object.keys(NODES)) dists[id] = Infinity;
  dists[startId] = 0;
  const visited = new Set();

  while (visited.size < Object.keys(NODES).length) {
    let current = null;
    let currentDist = Infinity;
    for (const id of Object.keys(NODES)) {
      if (!visited.has(id) && dists[id] < currentDist) {
        current = id;
        currentDist = dists[id];
      }
    }
    if (current === null) break;
    visited.add(current);
    if (current === endId) break;

    for (const e of GRAPH.outgoing[current]) {
      const alt = dists[current] + e.length;
      if (alt < dists[e.to]) dists[e.to] = alt;
    }
  }
  return dists[endId];
}

const JUNCTION_COUNT = Object.keys(NODES).filter(isJunction).length;
const OPTIMAL_DISTANCE = shortestPathLength(START_NODE, FINISH_NODE);

// Am schnellsten Weg zu einer Kreuzung ist immer die Abzweigung, deren
// (eigene Länge + kürzester Restweg zum Ziel) minimal ist.
function bestEdgeAt(nodeId) {
  let best = null;
  let bestTotal = Infinity;
  for (const e of GRAPH.outgoing[nodeId]) {
    const total = e.length + shortestPathLength(e.to, FINISH_NODE);
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
function stepDriving(state, dt) {
  const edge = state.edge;
  const from = NODES[edge.from];
  const to = NODES[edge.to];
  const remainingDist = (1 - state.t) * edge.length;
  const nextNodeIsJunction = isJunction(edge.to) && edge.to !== FINISH_NODE;

  if (nextNodeIsJunction && remainingDist < DECEL_DIST) {
    // Konstante Bremsverzögerung: v = sqrt(2 * a * verbleibende Distanz),
    // sodass die Geschwindigkeit exakt an der Kreuzung bei 0 ankommt.
    const decel = (CRUISE_SPEED * CRUISE_SPEED) / (2 * DECEL_DIST);
    state.speed = Math.sqrt(Math.max(0, 2 * decel * remainingDist));
  } else if (state.speed < CRUISE_SPEED) {
    const accel = (CRUISE_SPEED * CRUISE_SPEED) / (2 * ACCEL_DIST);
    state.speed = Math.min(CRUISE_SPEED, state.speed + accel * dt);
  } else {
    state.speed = CRUISE_SPEED;
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
function simulateOptimalRun(reactionDelay) {
  const dt = 1 / 120;
  const state = {
    edge: firstEdgeFrom(START_NODE),
    t: 0,
    speed: CRUISE_SPEED,
    x: NODES[START_NODE].x,
    y: NODES[START_NODE].y,
    heading: 0,
    distanceTraveled: 0,
  };
  let elapsed = 0;

  for (let guard = 0; guard < 200000; guard++) {
    const result = stepDriving(state, dt);
    elapsed += dt;

    if (result === "finished") return elapsed;
    if (result === "continue") {
      state.edge = firstEdgeFrom(state.edge.to);
      state.t = 0;
    } else if (result === "waiting") {
      elapsed += reactionDelay;
      state.edge = bestEdgeAt(state.edge.to);
      state.t = 0;
      state.speed = 0;
    }
  }
  throw new Error("simulateOptimalRun: Ziel nicht erreicht (Endlosschleife?)");
}

const MIN_REACTION_PER_JUNCTION = 0.2;
const PAR_TIME = simulateOptimalRun(MIN_REACTION_PER_JUNCTION);
const DIAMOND_TIME_LIMIT = PAR_TIME * 1.1;

// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------

let selectedCharacter = null;

const car = {
  state: "idle", // idle | driving | waiting | finished
  edge: null,
  t: 0,
  speed: 0,
  x: 0,
  y: 0,
  heading: 0,
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
};

const btnStart = document.getElementById("btn-start");
const btnRetry = document.getElementById("btn-retry");
const btnBack = document.getElementById("btn-back");
const btnExitRace = document.getElementById("btn-exit-race");
const hudTimer = document.getElementById("hud-timer");
const hudJunctionCount = document.getElementById("hud-junction-count");
const decisionBanner = document.getElementById("decision-banner");
const decisionTimerFill = document.getElementById("decision-timerbar-fill");
const medalBadge = document.getElementById("medal-badge");
const resultStats = document.getElementById("result-stats");

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
  startRace();
});

btnRetry.addEventListener("click", () => startRace());
btnBack.addEventListener("click", () => showScreen("select"));
btnExitRace.addEventListener("click", () => exitRace());

// ---------------------------------------------------------------------
// Canvas sizing + world-to-screen transform (statische Gesamtkarten-Ansicht)
// ---------------------------------------------------------------------

let view = { scale: 1, offsetX: 0, offsetY: 0 };

function computeView() {
  const pad = 120;
  const xs = Object.values(NODES).map((n) => n.x);
  const ys = Object.values(NODES).map((n) => n.y);
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

function firstEdgeFrom(nodeId) {
  return GRAPH.outgoing[nodeId][0];
}

function startRace() {
  car.state = "driving";
  car.edge = firstEdgeFrom(START_NODE);
  car.t = 0;
  car.speed = CRUISE_SPEED;
  car.distanceTraveled = 0;
  [car.x, car.y] = [NODES[START_NODE].x, NODES[START_NODE].y];

  raceStartTime = performance.now();
  raceElapsed = 0;
  reactionTimes = [];
  distanceTraveled = 0;

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

function currentUpcomingJunctionEdges() {
  // Die beiden Wahlmöglichkeiten an der Kreuzung, in die car.edge hineinführt
  return GRAPH.outgoing[car.edge.to];
}

function enterWaitingAtJunction() {
  car.state = "waiting";
  car.speed = 0;
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
  const options = currentUpcomingJunctionEdges();
  const chosen = options.find((e) => e.side === side);
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

  const result = stepDriving(car, dt);
  distanceTraveled = car.distanceTraveled;

  if (result === "waiting") {
    enterWaitingAtJunction();
  } else if (result === "continue") {
    car.edge = firstEdgeFrom(car.edge.to);
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

  for (const edge of GRAPH.edges) {
    const [x1, y1] = worldToScreen(NODES[edge.from].x, NODES[edge.from].y);
    const [x2, y2] = worldToScreen(NODES[edge.to].x, NODES[edge.to].y);

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
  for (const [id, n] of Object.entries(NODES)) {
    const [x, y] = worldToScreen(n.x, n.y);

    if (id === START_NODE) {
      ctx.fillStyle = "#4bd07a";
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === FINISH_NODE) {
      drawCheckerFlag(x, y);
    } else if (isJunction(id)) {
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
  hudJunctionCount.textContent = `Kreuzungen: ${reactionTimes.length}/${JUNCTION_COUNT}`;
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

function computeMedal(totalTime, avgReaction) {
  if (totalTime <= DIAMOND_TIME_LIMIT) {
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
  const medal = computeMedal(raceElapsed, avgReaction);

  medalBadge.textContent = medal.icon;

  const extraDistance = distanceTraveled - OPTIMAL_DISTANCE;
  const extraPct = Math.max(0, (extraDistance / OPTIMAL_DISTANCE) * 100);

  resultStats.innerHTML = `
    <div class="medal-name">${medal.name}</div>
    <div class="stat-row"><span>Gesamtzeit</span><b>${raceElapsed.toFixed(2)}s</b></div>
    <div class="stat-row"><span>⌀ Reaktionszeit</span><b>${avgReaction.toFixed(2)}s</b></div>
    <div class="stat-row"><span>Gefahrene Strecke</span><b>${extraPct < 1 ? "optimaler Weg!" : "+" + extraPct.toFixed(0) + "% Umweg"}</b></div>
    <div class="stat-row" style="border:none;color:#a9b2bc;font-size:13px;margin-top:6px">${medal.desc}</div>
  `;

  showScreen("result");
}
