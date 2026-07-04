"use strict";

/* =========================================================================
   Blitzangler
   Angel auswerfen, warten bis ein Fisch anbeißt, dann eine Tastenfolge
   (←↑↓→) in der richtigen Reihenfolge nachdrücken, bevor die Zeit abläuft.
   Je länger die Folge, desto größer/schwerer der Fisch und desto mehr
   Punkte gibt's. Mit jedem Tastendruck wird das Zeitfenster für den
   nächsten knapper. Verpasst du eine Taste, fällst du in den Fluss.
   ========================================================================= */

const DIRECTIONS = ["left", "up", "down", "right"];
const DIRECTION_ARROWS = { left: "←", up: "↑", down: "↓", right: "→" };

const MIN_SEQ_LEN = 2;
const MAX_SEQ_LEN = 9;
const INITIAL_KEY_TIME = 1.3;   // Sekunden für den ersten Tastendruck
const KEY_TIME_DECAY = 0.86;    // Faktor, um den das Zeitfenster je Druck schrumpft
const MIN_KEY_TIME = 0.4;       // Zeitfenster schrumpft nie unter diesen Wert
const BITE_WAIT_MIN = 1.2;
const BITE_WAIT_MAX = 3.4;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildFishSequence() {
  const length = randomInt(MIN_SEQ_LEN, MAX_SEQ_LEN);
  const sequence = [];
  for (let i = 0; i < length; i++) {
    sequence.push(DIRECTIONS[randomInt(0, DIRECTIONS.length - 1)]);
  }
  return sequence;
}

function weightForLength(length) {
  const base = 150 + (length - 2) * 110;
  const jitter = 0.85 + Math.random() * 0.3;
  return Math.round(base * jitter);
}

function pointsForLength(length) {
  return length * 25;
}

function fishEmojiForWeight(weight) {
  if (weight < 300) return "🐟";
  if (weight < 600) return "🐠";
  if (weight < 900) return "🐡";
  return "🦈";
}

// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------

let selectedCharacter = null;

// gameState: "casting" (wartet auf Biss) | "biting" (QTE läuft) |
// "success" | "failure" | "idle"
let gameState = "idle";

let biteDeadline = 0;
let castStartTime = 0;

let sequence = [];
let seqIndex = 0;
let keyDeadline = 0;
let currentKeyBudget = INITIAL_KEY_TIME;

let animState = null; // { type: "success" | "failure", start }
const ANIM_DURATION = 0.9;

let score = 0;
let catches = []; // { weight, length, points }

let lastFrameTime = 0;
let bobPhase = 0;

// ---------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------

const screens = {
  select: document.getElementById("screen-select"),
  game: document.getElementById("screen-game"),
  summary: document.getElementById("screen-summary"),
};

const btnStart = document.getElementById("btn-start");
const btnExitGame = document.getElementById("btn-exit-game");
const btnContinue = document.getElementById("btn-continue");
const btnRestart = document.getElementById("btn-restart");
const btnChangeAngler = document.getElementById("btn-change-angler");

const hudScore = document.getElementById("hud-score");
const hudCatches = document.getElementById("hud-catches");
const statusText = document.getElementById("status-text");
const qtePanel = document.getElementById("qte-panel");
const qteKeysEl = document.getElementById("qte-keys");
const qteTimerFill = document.getElementById("qte-timerbar-fill");
const outcomePanel = document.getElementById("outcome-panel");
const outcomeTitle = document.getElementById("outcome-title");
const outcomeDetails = document.getElementById("outcome-details");
const summaryStats = document.getElementById("summary-stats");
const catchList = document.getElementById("catch-list");

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

function showScreen(name) {
  for (const key of Object.keys(screens)) {
    screens[key].classList.toggle("active", key === name);
  }
}

// ---------------------------------------------------------------------
// Character portraits (reines Canvas, keine Assets)
// ---------------------------------------------------------------------

function drawHead(ctx, cx, cy, radius, character, angle) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#e8b28a";
  ctx.fill();

  if (character === "long") {
    ctx.beginPath();
    ctx.moveTo(-radius * 0.9, -radius * 0.2);
    ctx.quadraticCurveTo(-radius * 1.9, radius * 0.4, -radius * 1.3, radius * 1.6);
    ctx.quadraticCurveTo(-radius * 0.6, radius * 1.9, -radius * 0.3, radius * 1.1);
    ctx.quadraticCurveTo(radius * 0.3, radius * 1.9, radius * 1.0, radius * 1.6);
    ctx.quadraticCurveTo(radius * 1.9, radius * 0.5, radius * 0.9, -radius * 0.2);
    ctx.closePath();
    ctx.fillStyle = "#3b2a1e";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.95, 0, Math.PI * 2);
    ctx.fillStyle = "#e8b28a";
    ctx.fill();
  } else {
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

drawPortrait(document.querySelector('canvas[data-portrait="bald"]'), "bald");
drawPortrait(document.querySelector('canvas[data-portrait="long"]'), "long");

document.querySelectorAll(".character-card").forEach((card) => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".character-card").forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
    selectedCharacter = card.dataset.character;
    btnStart.disabled = false;
  });
});

// ---------------------------------------------------------------------
// Canvas sizing
// ---------------------------------------------------------------------

function resizeCanvas() {
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
}

window.addEventListener("resize", () => {
  if (screens.game.classList.contains("active")) resizeCanvas();
});

// ---------------------------------------------------------------------
// Scene geometry helpers
// ---------------------------------------------------------------------

function waterSurfaceY() {
  return canvas.height * 0.5;
}

function bankWidth() {
  return canvas.width * 0.16;
}

function anglerHandPos() {
  return { x: bankWidth() * 0.75, y: waterSurfaceY() - canvas.height * 0.14 };
}

function bobberRestPos() {
  return { x: canvas.width * 0.55, y: waterSurfaceY() };
}

// ---------------------------------------------------------------------
// Game flow
// ---------------------------------------------------------------------

btnStart.addEventListener("click", () => {
  if (!selectedCharacter) return;
  score = 0;
  catches = [];
  showScreen("game");
  requestAnimationFrame(() => {
    resizeCanvas();
    lastFrameTime = performance.now();
    startCasting();
    requestAnimationFrame(loop);
  });
});

btnExitGame.addEventListener("click", () => showSummary());
btnChangeAngler.addEventListener("click", () => showScreen("select"));
btnRestart.addEventListener("click", () => {
  score = 0;
  catches = [];
  showScreen("game");
  requestAnimationFrame(() => {
    resizeCanvas();
    lastFrameTime = performance.now();
    startCasting();
    requestAnimationFrame(loop);
  });
});

btnContinue.addEventListener("click", () => {
  outcomePanel.classList.add("hidden");
  animState = null;
  startCasting();
});

function updateHud() {
  hudScore.textContent = `${score} Punkte`;
  hudCatches.textContent = `${catches.length} Fisch${catches.length === 1 ? "" : "e"} gefangen`;
}

function startCasting() {
  gameState = "casting";
  statusText.textContent = "Angel ausgeworfen … warte auf einen Biss.";
  qtePanel.classList.add("hidden");
  outcomePanel.classList.add("hidden");
  const waitTime = BITE_WAIT_MIN + Math.random() * (BITE_WAIT_MAX - BITE_WAIT_MIN);
  castStartTime = performance.now();
  biteDeadline = castStartTime + waitTime * 1000;
  updateHud();
}

function renderQteRow() {
  qteKeysEl.innerHTML = sequence.map((dir, i) => {
    const cls = i < seqIndex ? "done" : i === seqIndex ? "current" : "";
    return `<div class="qte-key ${cls}">${DIRECTION_ARROWS[dir]}</div>`;
  }).join("");
}

function startBite() {
  gameState = "biting";
  sequence = buildFishSequence();
  seqIndex = 0;
  currentKeyBudget = INITIAL_KEY_TIME;
  keyDeadline = performance.now() + currentKeyBudget * 1000;

  statusText.textContent = "Er beißt an! Tastenfolge nachdrücken!";
  qtePanel.classList.remove("hidden");
  renderQteRow();
  qteTimerFill.style.transition = "none";
  qteTimerFill.style.width = "100%";
  requestAnimationFrame(() => {
    qteTimerFill.style.transition = `width ${currentKeyBudget}s linear`;
    qteTimerFill.style.width = "0%";
  });
}

function advanceKeyTimer() {
  currentKeyBudget = Math.max(MIN_KEY_TIME, currentKeyBudget * KEY_TIME_DECAY);
  keyDeadline = performance.now() + currentKeyBudget * 1000;
  qteTimerFill.style.transition = "none";
  qteTimerFill.style.width = "100%";
  requestAnimationFrame(() => {
    qteTimerFill.style.transition = `width ${currentKeyBudget}s linear`;
    qteTimerFill.style.width = "0%";
  });
}

function handleDirection(dir) {
  if (gameState !== "biting") return;
  if (sequence[seqIndex] !== dir) {
    failCatch();
    return;
  }
  seqIndex++;
  renderQteRow();
  if (seqIndex >= sequence.length) {
    succeedCatch();
  } else {
    advanceKeyTimer();
  }
}

window.addEventListener("keydown", (e) => {
  if (gameState !== "biting") return;
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") handleDirection("left");
  else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") handleDirection("right");
  else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") handleDirection("up");
  else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") handleDirection("down");
});

function succeedCatch() {
  const length = sequence.length;
  const weight = weightForLength(length);
  const points = pointsForLength(length);
  score += points;
  catches.push({ weight, length, points });
  updateHud();

  gameState = "success";
  qtePanel.classList.add("hidden");
  statusText.textContent = "";
  animState = { type: "success", start: performance.now() };

  const emoji = fishEmojiForWeight(weight);
  outcomeTitle.textContent = `${emoji} Gefangen!`;
  outcomeDetails.innerHTML = `
    <div><b>${weight} g</b> schwer</div>
    <div>${length} Tastendrücke gebraucht</div>
    <div>+${points} Punkte</div>
  `;
  outcomePanel.classList.remove("hidden");
}

function failCatch() {
  gameState = "failure";
  qtePanel.classList.add("hidden");
  statusText.textContent = "";
  animState = { type: "failure", start: performance.now() };

  outcomeTitle.textContent = "Reingefallen!";
  outcomeDetails.innerHTML = `<div>Der Fisch war zu stark – du bist in den Fluss gezogen worden.</div>`;
  outcomePanel.classList.remove("hidden");
}

function showSummary() {
  gameState = "idle";
  const totalWeight = catches.reduce((sum, c) => sum + c.weight, 0);
  const biggest = catches.reduce((max, c) => (c.weight > (max ? max.weight : 0) ? c : max), null);

  summaryStats.innerHTML = `
    <div class="stat-row"><span>Punkte gesamt</span><b>${score}</b></div>
    <div class="stat-row"><span>Fische gefangen</span><b>${catches.length}</b></div>
    <div class="stat-row"><span>Gesamtgewicht</span><b>${totalWeight} g</b></div>
    <div class="stat-row"><span>Größter Fang</span><b>${biggest ? biggest.weight + " g" : "–"}</b></div>
  `;

  catchList.innerHTML = catches.length
    ? catches.map((c) => `
        <div class="catch-row">
          <div class="catch-emoji">${fishEmojiForWeight(c.weight)}</div>
          <div class="catch-info">${c.weight} g · ${c.length} Tastendrücke</div>
          <div class="catch-points">+${c.points}</div>
        </div>
      `).join("")
    : `<div class="catch-row"><div class="catch-info">Noch keinen Fisch gefangen.</div></div>`;

  showScreen("summary");
}

// ---------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------

function drawScene(now) {
  const w = canvas.width, h = canvas.height;
  const waterY = waterSurfaceY();

  // Himmel
  const sky = ctx.createLinearGradient(0, 0, 0, waterY);
  sky.addColorStop(0, "#1a2230");
  sky.addColorStop(1, "#2d3b4d");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, waterY);

  // Wasser
  const water = ctx.createLinearGradient(0, waterY, 0, h);
  water.addColorStop(0, "#2b6f8f");
  water.addColorStop(1, "#123044");
  ctx.fillStyle = water;
  ctx.fillRect(0, waterY, w, h - waterY);

  // Wellenlinien
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = Math.max(1, h * 0.003);
  const t = now / 1000;
  for (let row = 0; row < 4; row++) {
    const y = waterY + (h - waterY) * (0.18 + row * 0.22);
    ctx.beginPath();
    for (let x = 0; x <= w; x += 14) {
      const yy = y + Math.sin(x * 0.02 + t * 1.4 + row) * 4;
      if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }

  // Ufer
  const bw = bankWidth();
  ctx.fillStyle = "#3c5a3a";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(bw, 0);
  ctx.lineTo(bw * 0.7, waterY);
  ctx.lineTo(0, waterY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#4a3524";
  ctx.fillRect(0, waterY - h * 0.02, bw * 0.7, h * 0.03);
}

function drawAngler(now, fallProgress) {
  const hand = anglerHandPos();
  const bodyX = hand.x - 14;
  const bodyTopY = hand.y - 4;
  const bodyH = canvas.height * 0.16;

  ctx.save();
  if (fallProgress > 0) {
    // Charakter kippt ins Wasser
    const dropX = fallProgress * canvas.width * 0.05;
    const dropY = fallProgress * canvas.height * 0.12;
    const rotate = fallProgress * 0.9;
    ctx.translate(bodyX + dropX, bodyTopY + bodyH * 0.5 + dropY);
    ctx.rotate(rotate);
    ctx.translate(-(bodyX), -(bodyTopY + bodyH * 0.5));
  }

  // Körper
  ctx.fillStyle = "#5b6b7a";
  ctx.fillRect(bodyX - 10, bodyTopY, 20, bodyH);

  // Kopf
  drawHead(ctx, bodyX, bodyTopY - 4, canvas.height * 0.022, selectedCharacter || "bald", 0);

  ctx.restore();
}

function drawRodAndBobber(now) {
  const hand = anglerHandPos();
  const rest = bobberRestPos();

  let bx = rest.x;
  let by = rest.y;

  if (gameState === "casting") {
    by += Math.sin(now / 260 + bobPhase) * (canvas.height * 0.012);
  } else if (gameState === "biting") {
    by += canvas.height * 0.02;
  } else {
    return; // während Erfolg/Misserfolg zeigen wir keinen Schwimmer mehr
  }

  // Angelschnur
  ctx.strokeStyle = "rgba(230,230,230,0.6)";
  ctx.lineWidth = Math.max(1, canvas.width * 0.0012);
  ctx.beginPath();
  ctx.moveTo(hand.x, hand.y);
  ctx.lineTo(bx, by);
  ctx.stroke();

  // Angel (Rute)
  ctx.strokeStyle = "#8a5a3b";
  ctx.lineWidth = Math.max(2, canvas.width * 0.003);
  ctx.beginPath();
  ctx.moveTo(hand.x - canvas.width * 0.03, hand.y + canvas.height * 0.05);
  ctx.lineTo(hand.x, hand.y);
  ctx.stroke();

  // Schwimmer (Bobber)
  const r = Math.max(5, canvas.width * 0.009);
  ctx.beginPath();
  ctx.arc(bx, by, r, Math.PI, Math.PI * 2);
  ctx.fillStyle = "#e05a5a";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(bx, by, r, 0, Math.PI);
  ctx.fillStyle = "#f4f6f8";
  ctx.fill();
}

function drawSplash(x, y, progress) {
  const count = 6;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const dist = progress * canvas.width * 0.05;
    const px = x + Math.cos(angle) * dist;
    const py = y + Math.sin(angle) * dist * 0.5;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(1, (1 - progress) * canvas.width * 0.01), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - progress)})`;
    ctx.fill();
  }
}

function drawFishJump(progress) {
  const rest = bobberRestPos();
  const jumpHeight = canvas.height * 0.14;
  const arc = Math.sin(Math.min(1, progress) * Math.PI);
  const x = rest.x + canvas.width * 0.04;
  const y = rest.y - arc * jumpHeight;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.3 + arc * 0.5);
  ctx.fillStyle = "#bcd6dc";
  ctx.beginPath();
  ctx.ellipse(0, 0, canvas.width * 0.028, canvas.width * 0.013, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-canvas.width * 0.026, 0);
  ctx.lineTo(-canvas.width * 0.045, -canvas.width * 0.012);
  ctx.lineTo(-canvas.width * 0.045, canvas.width * 0.012);
  ctx.closePath();
  ctx.fillStyle = "#8fb4bc";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(canvas.width * 0.014, -canvas.width * 0.003, canvas.width * 0.003, 0, Math.PI * 2);
  ctx.fillStyle = "#14171b";
  ctx.fill();
  ctx.restore();

  drawSplash(rest.x, rest.y, Math.min(1, progress * 1.4));
}

function render(now) {
  drawScene(now);

  let fallProgress = 0;
  if (animState && animState.type === "failure") {
    fallProgress = Math.min(1, (now - animState.start) / 1000 / ANIM_DURATION);
  }
  drawAngler(now, fallProgress);
  drawRodAndBobber(now);

  if (animState && animState.type === "success") {
    const progress = (now - animState.start) / 1000 / ANIM_DURATION;
    if (progress <= 1) drawFishJump(progress);
  } else if (animState && animState.type === "failure") {
    drawSplash(anglerHandPos().x - 14, waterSurfaceY(), fallProgress);
  }
}

// ---------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------

function loop(now) {
  if (gameState === "casting" && now >= biteDeadline) {
    startBite();
  } else if (gameState === "biting" && now >= keyDeadline) {
    failCatch();
  }

  render(now);

  if (gameState !== "idle") {
    requestAnimationFrame(loop);
  }
}
