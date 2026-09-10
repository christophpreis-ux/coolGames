"use strict";

/* =========================================================================
   City Jumper
   Auto-Runner: Die Figur läuft automatisch nach vorne über die Dächer der
   Stadt und wird dabei stetig schneller. Leertaste (oder Tippen/Klicken)
   lässt sie über die Lücke zum nächsten Hausdach springen; ein zweiter
   Druck in der Luft löst einen Doppelsprung für die ganz breiten Lücken
   aus. Verpasst man ein Dach, fällt die Figur runter und der Lauf ist
   vorbei.
   ========================================================================= */

// -- Physik: alles als Anteil von canvas.width/height statt fixer Pixel,
// damit sich das Spiel unabhängig von der tatsächlichen Fenstergröße
// immer gleich anfühlt. --
const GRAVITY_FACTOR = 4.6;        // * canvas.height, pro Sekunde^2
const JUMP_VELOCITY_FACTOR = 1.38; // * canvas.height, pro Sekunde (Sprung-Anfangsgeschwindigkeit nach oben)
const COYOTE_TIME_MS = 110;        // Gnadenfrist nach Verlassen eines Dachs, in der ein Sprung noch als normaler (nicht: Doppel-)Sprung zählt

// -- Lauftempo: startet gemächlich und wird bis zu einer Obergrenze
// stetig schneller. Die Lücken zwischen den Häusern werden anhand des
// jeweils AKTUELLEN Tempos generiert, bleiben also immer fair springbar –
// schwerer wird es dadurch, dass weniger Reaktionszeit in echten Sekunden
// bleibt, nicht dadurch, dass Lücken plötzlich unfair breit werden. --
const RUN_SPEED_START_FACTOR = 0.3;  // * canvas.width, pro Sekunde
const RUN_SPEED_MAX_FACTOR = 0.78;
const RUN_SPEED_ACCEL_FACTOR = 0.014; // Tempozunahme pro Sekunde^2 -- erreicht das Maxtempo nach rund 35s

const PLAYER_SCREEN_X_FACTOR = 0.3; // Spieler bleibt fix auf dem Bildschirm, die Welt scrollt
const DEATH_Y_FACTOR = 1.12;        // Fällt die Figur tiefer, ist der Lauf vorbei

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------

let gameState = "idle"; // "idle" | "running" | "over"

let speedFactor = RUN_SPEED_START_FACTOR;
let distanceFactor = 0; // akkumulierte, auflösungsunabhängige Strecke (siehe scoreFromDistance)

let playerY = 0;        // Bildschirm-Y der Füße (= aktuelle Dachhöhe im Stand)
let playerVY = 0;
let falling = false;    // true = in der Luft (gesprungen ODER Kante ohne Sprung verpasst)
let wallHit = false;    // true = gegen eine Hauswand geprallt statt zu landen -- kein Sprung mehr möglich, fällt benommen runter
let wallHitAt = 0;      // performance.now() des Aufpralls, treibt die Taumel-Rotation
let jumpsUsed = 0;      // 0/1/2 – steuert den Doppelsprung
let lastGroundedAt = 0; // performance.now() der letzten Landung, fürs Coyote-Zeitfenster
let runCyclePhase = 0;  // treibt die Beinbewegung der Lauf-Animation

let buildings = [];       // { x, width, roofY } in Bildschirm-x – die Welt scrollt, nicht die Kamera
let skylineBuildings = []; // statischer Parallax-Hintergrund, einmal pro Lauf erzeugt

let lastFrameTime = 0;
let highScore = 0;

const CITY_JUMPER_SAVE_KEY = "city_jumper_highscore_v1";

function loadHighScore() {
  try {
    const raw = localStorage.getItem(CITY_JUMPER_SAVE_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch (err) {
    return 0;
  }
}

function saveHighScore(score) {
  try {
    localStorage.setItem(CITY_JUMPER_SAVE_KEY, String(score));
  } catch (err) {
    // z. B. Privatmodus ohne localStorage – dann eben ohne Speichern.
  }
}

// ---------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------

const screens = {
  start: document.getElementById("screen-start"),
  game: document.getElementById("screen-game"),
  over: document.getElementById("screen-over"),
};

const btnStart = document.getElementById("btn-start");
const btnRestart = document.getElementById("btn-restart");
const highscoreValue = document.getElementById("highscore-value");
const hudScore = document.getElementById("hud-score");
const hudHighscore = document.getElementById("hud-highscore");
const tapHint = document.getElementById("tap-hint");
const overTitle = document.getElementById("over-title");
const overScore = document.getElementById("over-score");
const overHighscore = document.getElementById("over-highscore");
const newRecordBanner = document.getElementById("new-record-banner");

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

function showScreen(name) {
  for (const key of Object.keys(screens)) {
    screens[key].classList.toggle("active", key === name);
  }
}

function resizeCanvas() {
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
}

window.addEventListener("resize", () => {
  if (screens.game.classList.contains("active")) resizeCanvas();
});

// ---------------------------------------------------------------------
// Score
// ---------------------------------------------------------------------

function scoreFromDistance(distFactor) {
  return Math.floor(distFactor * 600);
}

function updateHud() {
  hudScore.textContent = `${scoreFromDistance(distanceFactor)} m`;
  hudHighscore.textContent = `Rekord: ${highScore} m`;
}

// ---------------------------------------------------------------------
// Parallax-Skyline (statischer Hintergrund, einmal pro Lauf erzeugt)
// ---------------------------------------------------------------------

function generateSkyline() {
  skylineBuildings = [];
  let x = 0;
  while (x < canvas.width * 2.2) {
    const width = lerp(canvas.width * 0.05, canvas.width * 0.12, Math.random());
    const height = lerp(canvas.height * 0.12, canvas.height * 0.32, Math.random());
    skylineBuildings.push({ x, width, height });
    x += width + lerp(canvas.width * 0.01, canvas.width * 0.04, Math.random());
  }
}

// ---------------------------------------------------------------------
// Gebäude-Generierung
// ---------------------------------------------------------------------

// T = 2*V/G -- unabhängig von der Canvas-Größe, weil V und G beide mit
// canvas.height skalieren und sich das Verhältnis dadurch heraushebt.
function jumpAirTime() {
  return (2 * JUMP_VELOCITY_FACTOR) / GRAVITY_FACTOR;
}

function spawnNextBuilding() {
  const last = buildings[buildings.length - 1];
  const prevRight = last ? last.x + last.width : canvas.width * PLAYER_SCREEN_X_FACTOR - canvas.width * 0.1;
  const prevRoofY = last ? last.roofY : canvas.height * 0.56;

  // Maximale Sprungweite beim AKTUELLEN Tempo – Grundlage für faire,
  // tempoabhängige Lückenbreiten (siehe Kommentar bei RUN_SPEED_*).
  const maxSingle = speedFactor * canvas.width * jumpAirTime();

  const roll = Math.random();
  let gap;
  if (roll < 0.32) {
    gap = lerp(0.28, 0.5, Math.random()) * maxSingle; // leicht, lockerer einfacher Sprung
  } else if (roll < 0.72) {
    gap = lerp(0.5, 0.82, Math.random()) * maxSingle; // mittel, braucht gutes Timing
  } else {
    gap = lerp(0.95, 1.3, Math.random()) * maxSingle; // schwer, braucht den Doppelsprung
  }
  gap = Math.max(gap, canvas.width * 0.035);

  const width = lerp(canvas.width * 0.09, canvas.width * 0.24, Math.random());
  let roofY = prevRoofY + lerp(-1, 1, Math.random()) * canvas.height * 0.11;
  roofY = clamp(roofY, canvas.height * 0.38, canvas.height * 0.72);

  buildings.push({ x: prevRight + gap, width, roofY });
}

function ensureBuildingsAhead() {
  while (
    buildings.length === 0 ||
    buildings[buildings.length - 1].x + buildings[buildings.length - 1].width < canvas.width * 1.4
  ) {
    spawnNextBuilding();
  }
}

function groundYAt(screenX) {
  for (const b of buildings) {
    if (screenX >= b.x && screenX <= b.x + b.width) return b;
  }
  return null;
}

// ---------------------------------------------------------------------
// Game flow
// ---------------------------------------------------------------------

function startRun() {
  // Erst die Bildschirmumschaltung, damit #screen-game "active" (und damit
  // sichtbar mit einer echten Layout-Größe) ist, BEVOR resizeCanvas() die
  // Canvas-Größe von clientWidth/clientHeight abliest – sonst wären beide
  // 0, weil ein "display: none"-Element keine Layout-Größe hat.
  showScreen("game");
  resizeCanvas();
  generateSkyline();

  speedFactor = RUN_SPEED_START_FACTOR;
  distanceFactor = 0;
  jumpsUsed = 0;
  falling = false;
  wallHit = false;
  runCyclePhase = 0;

  buildings = [{ x: 0, width: canvas.width * (PLAYER_SCREEN_X_FACTOR + 0.35), roofY: canvas.height * 0.56 }];
  ensureBuildingsAhead();

  playerY = buildings[0].roofY;
  playerVY = 0;
  lastGroundedAt = performance.now();

  gameState = "running";
  tapHint.classList.remove("hidden");
  updateHud();

  lastFrameTime = performance.now();
  requestAnimationFrame(loop);
}

function triggerJump(now) {
  if (gameState !== "running" || wallHit) return;
  tapHint.classList.add("hidden");

  const withinCoyote = falling && jumpsUsed === 0 && now - lastGroundedAt < COYOTE_TIME_MS;
  if (!falling || withinCoyote) {
    playerVY = -JUMP_VELOCITY_FACTOR * canvas.height;
    falling = true;
    jumpsUsed = 1;
  } else if (jumpsUsed < 2) {
    playerVY = -JUMP_VELOCITY_FACTOR * canvas.height;
    jumpsUsed = 2;
  }
}

function endRun() {
  gameState = "over";
  const finalScore = scoreFromDistance(distanceFactor);
  const isRecord = finalScore > highScore;
  if (isRecord) {
    highScore = finalScore;
    saveHighScore(highScore);
  }
  overScore.textContent = `${finalScore} m`;
  overHighscore.textContent = `${highScore} m`;
  newRecordBanner.classList.toggle("hidden", !isRecord);
  highscoreValue.textContent = String(highScore);
  showScreen("over");
}

btnStart.addEventListener("click", startRun);
btnRestart.addEventListener("click", startRun);

window.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
  if (e.key === " " || e.key === "Spacebar" || e.key === "ArrowUp") {
    e.preventDefault();
    if (gameState === "running") triggerJump(performance.now());
  }
});

canvas.addEventListener("pointerdown", () => {
  if (gameState === "running") triggerJump(performance.now());
});

// Gegen eine Hauswand geprallt statt sauber gelandet (oder durchgeflogen):
// kurzer Rückprall nach oben, danach taumelt die Figur benommen (Hände am
// Kopf, siehe drawPlayer) nach unten in den Fall-Tod. Kein erneuter Sprung
// mehr möglich (siehe triggerJump).
function triggerWallHit(now) {
  wallHit = true;
  wallHitAt = now;
  playerVY = -canvas.height * 0.28;
  tapHint.classList.add("hidden");
}

// ---------------------------------------------------------------------
// Physik-Update
// ---------------------------------------------------------------------

function updatePhysics(dt, now) {
  speedFactor = Math.min(RUN_SPEED_MAX_FACTOR, speedFactor + RUN_SPEED_ACCEL_FACTOR * dt);
  distanceFactor += speedFactor * dt;

  const speedPx = speedFactor * canvas.width;
  for (const b of buildings) b.x -= speedPx * dt;
  buildings = buildings.filter((b) => b.x + b.width > -canvas.width * 0.2);
  ensureBuildingsAhead();

  const playerScreenX = canvas.width * PLAYER_SCREEN_X_FACTOR;

  if (falling) {
    const prevPlayerY = playerY;
    playerVY += GRAVITY_FACTOR * canvas.height * dt;
    playerY += playerVY * dt;

    if (wallHit) {
      // Bereits benommen von einem Wandtreffer -- nur noch runterfallen,
      // keine Landung und kein zweiter Wandtreffer mehr möglich.
      if (playerY > canvas.height * DEATH_Y_FACTOR) {
        endRun();
        return;
      }
    } else {
      // Nur landen, wenn die Dachhöhe in GENAU diesem Frame von oben
      // erreicht wird (prevPlayerY war noch über dem Dach). Ohne dieses
      // "von oben"-Kriterium würde ein höheres Gebäude, das unter die feste
      // Spielerposition scrollt, während man schon TIEFER als sein Dach
      // gefallen ist, die Figur fälschlich nach oben auf das Dach schnappen
      // lassen -- sah aus wie ein automatischer Katapultsprung an der
      // Hauswand und machte echtes Springen überflüssig.
      const ground = groundYAt(playerScreenX);
      if (ground && playerVY >= 0 && prevPlayerY <= ground.roofY && playerY >= ground.roofY) {
        playerY = ground.roofY;
        playerVY = 0;
        falling = false;
        jumpsUsed = 0;
        lastGroundedAt = now;
      } else if (ground && playerY > ground.roofY) {
        // Hier läge die Figur unterhalb der Dachkante, also seitlich in der
        // Hauswand -- statt einfach durchzufliegen, gibt's jetzt Aufprall.
        triggerWallHit(now);
      } else if (playerY > canvas.height * DEATH_Y_FACTOR) {
        endRun();
        return;
      }
    }
  } else {
    const ground = groundYAt(playerScreenX);
    if (ground) {
      playerY = ground.roofY;
    } else {
      // Kante verpasst, kein Sprung ausgelöst -- der Boden ist einfach weg.
      falling = true;
    }
  }

  runCyclePhase += dt * (falling ? 0 : 9 + speedFactor * 6);
  updateHud();
}

// ---------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------

function drawBackground() {
  const w = canvas.width, h = canvas.height;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#25324a");
  sky.addColorStop(1, "#0e1620");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Parallax-Skyline scrollt langsamer als der Vordergrund, für Tiefe.
  const skylineSpan = canvas.width * 2.2;
  const parallaxOffset = (distanceFactor * canvas.width * 0.35) % skylineSpan;
  ctx.fillStyle = "#1a2333";
  for (const dupe of [0, skylineSpan]) {
    for (const b of skylineBuildings) {
      const x = b.x - parallaxOffset + dupe;
      if (x + b.width < 0 || x > w) continue;
      ctx.fillRect(x, h - b.height, b.width, b.height);
    }
  }
}

function drawBuildings() {
  const h = canvas.height;
  for (const b of buildings) {
    if (b.x + b.width < 0 || b.x > canvas.width) continue;

    const grad = ctx.createLinearGradient(0, b.roofY, 0, h);
    grad.addColorStop(0, "#5a6572");
    grad.addColorStop(1, "#333c46");
    ctx.fillStyle = grad;
    ctx.fillRect(b.x, b.roofY, b.width, h - b.roofY);

    ctx.fillStyle = "#7a879a";
    ctx.fillRect(b.x, b.roofY, b.width, Math.max(2, h * 0.006));

    // Fenster-Raster als Textur
    ctx.fillStyle = "rgba(255,224,140,0.32)";
    const winW = canvas.width * 0.012;
    const winH = canvas.height * 0.018;
    const gapX = winW * 1.6;
    const gapY = winH * 2.1;
    for (let wy = b.roofY + gapY * 0.8; wy < h - gapY * 0.5; wy += gapY) {
      for (let wx = b.x + gapX * 0.6; wx < b.x + b.width - winW; wx += gapX) {
        ctx.fillRect(wx, wy, winW, winH);
      }
    }
  }
}

function drawDizzyStar(cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a + Math.PI) * r, Math.sin(a + Math.PI) * r);
  }
  ctx.stroke();
  ctx.restore();
}

// Läufer-Figur: einfache, gut lesbare Seitenansicht-Silhouette statt
// eines detaillierten Gesichts – bei diesem Tempo zählt vor allem die
// klare Pose (Lauf-Zyklus am Boden, angezogene Beine in der Luft, taumelnd
// mit Händen am Kopf nach einem Wandtreffer).
function drawPlayer(now) {
  const x = canvas.width * PLAYER_SCREEN_X_FACTOR;
  const scale = canvas.height * 0.001;

  const legLen = 26 * scale;
  const torsoH = 30 * scale;
  const headR = 11 * scale;
  const hipY = -legLen;
  const shoulderY = hipY - torsoH;
  const headCy = shoulderY - headR - 3 * scale;

  ctx.save();
  ctx.translate(x, playerY);

  const dazedElapsed = wallHit ? (now - wallHitAt) / 1000 : 0;
  const dazedSpin = dazedElapsed * 3.4;
  ctx.rotate(wallHit ? dazedSpin : falling ? -0.1 : 0.05);

  const suitColor = "#e8794a";
  const suitDark = "#b3552c";
  const skinColor = "#e8b28a";

  // Beine
  ctx.strokeStyle = suitDark;
  ctx.lineWidth = 6 * scale;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (wallHit) {
    // locker herabhängend statt angezogen -- benommen, keine Kontrolle mehr
    ctx.moveTo(0, hipY);
    ctx.lineTo(-5 * scale, hipY * 0.1);
    ctx.moveTo(0, hipY);
    ctx.lineTo(5 * scale, hipY * 0.05);
  } else if (falling) {
    ctx.moveTo(0, hipY);
    ctx.lineTo(-9 * scale, hipY * 0.35);
    ctx.moveTo(0, hipY);
    ctx.lineTo(7 * scale, hipY * 0.55);
  } else {
    const cyc = Math.sin(runCyclePhase);
    ctx.moveTo(0, hipY);
    ctx.lineTo(cyc * 11 * scale, 0);
    ctx.moveTo(0, hipY);
    ctx.lineTo(-cyc * 11 * scale, 0);
  }
  ctx.stroke();

  // Torso
  ctx.fillStyle = suitColor;
  ctx.beginPath();
  ctx.moveTo(-9 * scale, hipY);
  ctx.quadraticCurveTo(-10 * scale, shoulderY - 3 * scale, -6 * scale, shoulderY);
  ctx.lineTo(6 * scale, shoulderY);
  ctx.quadraticCurveTo(10 * scale, shoulderY - 3 * scale, 9 * scale, hipY);
  ctx.closePath();
  ctx.fill();

  // Arme
  ctx.strokeStyle = suitColor;
  ctx.lineWidth = 5 * scale;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (wallHit) {
    // Hände an den Kopf -- "autsch", benommen vom Aufprall
    ctx.moveTo(-6 * scale, shoulderY + 4 * scale);
    ctx.lineTo(-headR * 0.9, headCy + headR * 0.35);
    ctx.moveTo(6 * scale, shoulderY + 4 * scale);
    ctx.lineTo(headR * 0.9, headCy + headR * 0.35);
  } else if (falling) {
    ctx.moveTo(-6 * scale, shoulderY + 4 * scale);
    ctx.lineTo(-15 * scale, shoulderY - 8 * scale);
    ctx.moveTo(6 * scale, shoulderY + 4 * scale);
    ctx.lineTo(14 * scale, shoulderY + 14 * scale);
  } else {
    const cyc = Math.sin(runCyclePhase + Math.PI);
    ctx.moveTo(-6 * scale, shoulderY + 4 * scale);
    ctx.lineTo(-6 * scale + cyc * 10 * scale, shoulderY + 16 * scale);
    ctx.moveTo(6 * scale, shoulderY + 4 * scale);
    ctx.lineTo(6 * scale - cyc * 10 * scale, shoulderY + 16 * scale);
  }
  ctx.stroke();

  // Kopf
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(0, headCy, headR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#20262c";
  ctx.beginPath();
  ctx.arc(headR * 0.4, headCy, headR * 0.14, 0, Math.PI * 2);
  ctx.fill();

  // Benommenheits-Sternchen, kreisen über dem Kopf
  if (wallHit) {
    ctx.strokeStyle = "#f2c94c";
    ctx.lineWidth = Math.max(1, scale * 1.2);
    [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].forEach((offset) => {
      const a = dazedSpin * 2.2 + offset;
      const orbitR = headR * 1.9;
      drawDizzyStar(Math.cos(a) * orbitR, headCy - headR * 0.6 + Math.sin(a) * orbitR * 0.4, headR * 0.22);
    });
  }

  ctx.restore();
}

function render(now) {
  drawBackground();
  drawBuildings();
  drawPlayer(now);
}

// ---------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------

function loop(now) {
  const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
  lastFrameTime = now;

  if (gameState === "running") {
    updatePhysics(dt, now);
  }

  render(now);

  if (gameState === "running") {
    requestAnimationFrame(loop);
  }
}

// ---------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------

highScore = loadHighScore();
highscoreValue.textContent = String(highScore);
hudHighscore.textContent = `Rekord: ${highScore} m`;
