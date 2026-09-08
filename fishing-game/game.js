"use strict";

/* =========================================================================
   Blitzangler
   Angel auswerfen, warten bis ein Fisch anbeißt, dann eine Tastenfolge
   (←↑↓→) in der richtigen Reihenfolge nachdrücken, bevor die Zeit abläuft.
   8 echte Fischarten von Rotfeder bis Blauwal, jede mit eigener Anzahl an
   Tastendrücken, Gewicht und Punkten. Mit jedem Tastendruck wird das
   Zeitfenster für den nächsten knapper. Verpasst du eine Taste, fällst du
   in den Fluss. Nach einem Fang hältst du ihn erst über den Kopf, bevor
   die Statistik erscheint. Im Angelladen kannst du bessere Ruten kaufen,
   die weniger Tastendrücke brauchen und mehr Zeit geben.
   ========================================================================= */

const DIRECTIONS = ["left", "up", "down", "right"];
const DIRECTION_ARROWS = { left: "←", up: "↑", down: "↓", right: "→" };

const BITE_WAIT_MIN = 1.2;
const BITE_WAIT_MAX = 3.4;
const FAIL_ANIM_DURATION = 0.9;
const SUCCESS_JUMP_DURATION = 0.7;
const SUCCESS_HOLD_DURATION = 1.0;
const CAST_ANIM_DURATION = 0.55; // Ausholen + Wurf beim Auswerfen

// 19 Fisch-/Meeresarten, geordnet nach Schwierigkeit. Mehr Tastendrücke ->
// mehr Punkte. "shape" bestimmt die art-typische Silhouette beim Zeichnen
// (siehe drawCreature) – jede Art sieht so aus wie ihre echte Tiergruppe,
// nicht nur andersfarbig. Seedrache und Kraken brauchen zusätzlich eine
// exklusive Angel, sonst beißen sie gar nicht erst an (siehe requiresRod).
const FISH_SPECIES = [
  { id: "rotfeder", name: "Rotfeder", presses: 2, weight: [80, 350], unit: "g",
    points: 60, rarity: 30, emoji: "🐟", color: "#9fb8c9", colorDark: "#6f8fa3", sizeScale: 0.7, shape: "fish" },
  { id: "barsch", name: "Flussbarsch", presses: 3, weight: [150, 700], unit: "g",
    points: 110, rarity: 24, emoji: "🐟", color: "#7fae6a", colorDark: "#557a45", sizeScale: 0.85, shape: "fish" },
  { id: "karpfen", name: "Karpfen", presses: 4, weight: [1.5, 8], unit: "kg",
    points: 180, rarity: 18, emoji: "🐠", color: "#c2a45a", colorDark: "#8f7639", sizeScale: 1.0, shape: "fish" },
  { id: "hecht", name: "Hecht", presses: 5, weight: [2, 9], unit: "kg",
    points: 260, rarity: 12, emoji: "🐠", color: "#5c8a5c", colorDark: "#3d603d", sizeScale: 1.15, shape: "fish" },
  { id: "lachs", name: "Lachs", presses: 6, weight: [3, 14], unit: "kg",
    points: 360, rarity: 8, emoji: "🐡", color: "#e08a6a", colorDark: "#a85c42", sizeScale: 1.3, shape: "fish" },
  { id: "thunfisch", name: "Blauflossen-Thunfisch", presses: 7, weight: [50, 300], unit: "kg",
    points: 480, rarity: 5, emoji: "🐡", color: "#3f5f7a", colorDark: "#263c4d", sizeScale: 1.55, shape: "tuna" },
  { id: "schwertfisch", name: "Schwertfisch", presses: 8, weight: [50, 150], unit: "kg",
    points: 590, rarity: 3.8, emoji: "🐟", color: "#7a94a8", colorDark: "#4f6577", sizeScale: 1.7, shape: "billfish" },
  { id: "hai", name: "Weißer Hai", presses: 9, weight: [500, 1100], unit: "kg",
    points: 700, rarity: 2.5, emoji: "🦈", color: "#8f9aa3", colorDark: "#5f6870", sizeScale: 1.9, shape: "shark" },
  { id: "blauwal", name: "Blauwal", presses: 10, weight: [100, 150], unit: "t",
    points: 1200, rarity: 0.5, emoji: "🐋", color: "#3a5a78", colorDark: "#223549", sizeScale: 2.4, shape: "whale" },
  { id: "riesenkalmar", name: "Riesenkalmar", presses: 11, weight: [150, 450], unit: "kg",
    points: 1450, rarity: 0.35, emoji: "🦑", color: "#5a4a7a", colorDark: "#3a2f52", sizeScale: 2.0, shape: "cephalopod" },
  { id: "mondfisch", name: "Mondfisch", presses: 12, weight: [300, 2300], unit: "kg",
    points: 1700, rarity: 0.22, emoji: "🐟", color: "#b9c4cc", colorDark: "#8996a1", sizeScale: 2.1, shape: "disc" },
  { id: "groenlandhai", name: "Grönlandhai", presses: 13, weight: [400, 1000], unit: "kg",
    points: 1950, rarity: 0.15, emoji: "🦈", color: "#6b7d8a", colorDark: "#46545c", sizeScale: 2.15, shape: "shark" },
  { id: "pottwal", name: "Pottwal", presses: 14, weight: [35, 45], unit: "t",
    points: 2200, rarity: 0.08, emoji: "🐋", color: "#4a5a68", colorDark: "#2e3a44", sizeScale: 2.3, shape: "whale" },
  { id: "seedrache", name: "Seedrache", presses: 15, weight: [2, 5], unit: "t",
    points: 3000, rarity: 1.5, emoji: "🐉", color: "#4c9a5a", colorDark: "#2f6b3a", sizeScale: 2.8,
    shape: "serpent", requiresRod: "dragon" },
  { id: "walhai", name: "Walhai", presses: 16, weight: [10, 20], unit: "t",
    points: 2500, rarity: 0.06, emoji: "🦈", color: "#5a7a92", colorDark: "#37546b", sizeScale: 2.6, shape: "shark" },
  { id: "kolosskalmar", name: "Kolosskalmar", presses: 17, weight: [400, 750], unit: "kg",
    points: 2800, rarity: 0.045, emoji: "🦑", color: "#9a3f3f", colorDark: "#6b2626", sizeScale: 2.3, shape: "cephalopod" },
  { id: "groenlandwal", name: "Grönlandwal", presses: 18, weight: [60, 100], unit: "t",
    points: 3100, rarity: 0.03, emoji: "🐋", color: "#39465a", colorDark: "#232c3a", sizeScale: 2.5, shape: "whale" },
  { id: "megalodon", name: "Megalodon", presses: 19, weight: [30, 65], unit: "t",
    points: 3500, rarity: 0.015, emoji: "🦈", color: "#33383f", colorDark: "#1c1f24", sizeScale: 3.0, shape: "shark" },
  { id: "kraken", name: "Kraken", presses: 20, weight: [10, 20], unit: "t",
    points: 6000, rarity: 2, emoji: "🐙", color: "#3a2350", colorDark: "#1f1230", sizeScale: 3.6,
    shape: "kraken", requiresRod: "kraken" },
];

// 15 Mutationen: seltene Varianten, die einen gefangenen Fisch mehr wert
// machen. Werden erst nach dem Fang aufgedeckt (Überraschungseffekt).
const MUTATIONS = [
  { id: "riese", name: "Riesenexemplar", prefixEmoji: "📏", chance: 6,
    pointMultiplier: 1.4, weightMultiplier: 1.5, sizeMultiplier: 1.3 },
  { id: "zwerg", name: "Zwergexemplar", prefixEmoji: "🤏", chance: 5,
    pointMultiplier: 1.3, weightMultiplier: 0.6, sizeMultiplier: 0.6 },
  { id: "glitzer", name: "Glitzerschuppen", prefixEmoji: "✨", chance: 4,
    pointMultiplier: 1.6, weightMultiplier: 1.0, sizeMultiplier: 1.0,
    colorOverride: "#eae6c8", colorDarkOverride: "#c9c49a", sparkle: true },
  { id: "schatten", name: "Schattenfisch", prefixEmoji: "🌑", chance: 1.8,
    pointMultiplier: 1.9, weightMultiplier: 1.0, sizeMultiplier: 1.0,
    colorOverride: "#232323", colorDarkOverride: "#101010" },
  { id: "albino", name: "Albino", prefixEmoji: "🤍", chance: 2.5,
    pointMultiplier: 1.8, weightMultiplier: 1.05, sizeMultiplier: 1.05,
    colorOverride: "#f4f6f8", colorDarkOverride: "#c7ccd1" },
  { id: "metallisch", name: "Metallisch", prefixEmoji: "⚙️", chance: 1.6,
    pointMultiplier: 1.95, weightMultiplier: 1.1, sizeMultiplier: 1.0,
    colorOverride: "#c7ccd1", colorDarkOverride: "#8f969c", sparkle: true },
  { id: "eisig", name: "Eisig", prefixEmoji: "❄️", chance: 1.3,
    pointMultiplier: 1.85, weightMultiplier: 1.0, sizeMultiplier: 1.0,
    colorOverride: "#dff4ff", colorDarkOverride: "#a8d8e8" },
  { id: "uralt", name: "Uralt", prefixEmoji: "🦴", chance: 1.5,
    pointMultiplier: 2.0, weightMultiplier: 1.2, sizeMultiplier: 1.15,
    colorOverride: "#6b6650", colorDarkOverride: "#454130" },
  { id: "kristall", name: "Kristallschuppen", prefixEmoji: "💎", chance: 1.2,
    pointMultiplier: 2.1, weightMultiplier: 1.0, sizeMultiplier: 1.0,
    colorOverride: "#bfe9ff", colorDarkOverride: "#8fcbe0", sparkle: true },
  { id: "feurig", name: "Feurig", prefixEmoji: "🔥", chance: 1.0,
    pointMultiplier: 2.0, weightMultiplier: 1.0, sizeMultiplier: 1.05,
    colorOverride: "#ff6a3c", colorDarkOverride: "#b8401a" },
  { id: "zweikoepfig", name: "Zweiköpfig", prefixEmoji: "2️⃣", chance: 1.0,
    pointMultiplier: 2.2, weightMultiplier: 1.05, sizeMultiplier: 1.1,
    colorOverride: "#7a9a5a", colorDarkOverride: "#4f6a3a" },
  { id: "radioaktiv", name: "Radioaktiv", prefixEmoji: "☢️", chance: 0.6,
    pointMultiplier: 2.6, weightMultiplier: 1.05, sizeMultiplier: 1.1,
    colorOverride: "#aef23c", colorDarkOverride: "#6b9e1f", sparkle: true },
  { id: "gold", name: "Goldrausch", prefixEmoji: "👑", chance: 0.8,
    pointMultiplier: 2.5, weightMultiplier: 1.1, sizeMultiplier: 1.1,
    colorOverride: "#f2c94c", colorDarkOverride: "#b8901f", sparkle: true },
  { id: "regenbogen", name: "Regenbogenglanz", prefixEmoji: "🌈", chance: 0.4,
    pointMultiplier: 3.0, weightMultiplier: 1.1, sizeMultiplier: 1.1,
    colorOverride: "#ff6fae", colorDarkOverride: "#c23f82", sparkle: true },
  { id: "kosmisch", name: "Kosmisch", prefixEmoji: "🌌", chance: 0.2,
    pointMultiplier: 3.5, weightMultiplier: 1.3, sizeMultiplier: 1.2,
    colorOverride: "#2a1a4a", colorDarkOverride: "#1a0f30", sparkle: true },
];

// Angelruten: bessere Ruten brauchen weniger Tastendrücke und geben mehr
// Zeit pro Tastendruck. Werden mit Punkten im Angelladen gekauft. Die
// Drachen-Angel bzw. Kraken-Angel sind zusätzlich die einzige Möglichkeit,
// den Seedrachen bzw. den Kraken überhaupt anbeißen zu lassen.
const RODS = {
  standard: {
    name: "Standardrute", price: 0, pressReduction: 0,
    initialTime: 1.3, decay: 0.86, minTime: 0.4,
    desc: "Deine Rute vom ersten Tag. Volle Tastenfolge, normales Tempo.",
  },
  gold: {
    name: "Gold-Angel", price: 350, pressReduction: 1,
    initialTime: 1.6, decay: 0.9, minTime: 0.5,
    desc: "Ein Tastendruck weniger nötig, spürbar mehr Zeit pro Druck.",
  },
  diamond: {
    name: "Diamant-Angel", price: 900, pressReduction: 2,
    initialTime: 1.9, decay: 0.94, minTime: 0.6,
    desc: "Zwei Tastendrücke weniger nötig und am meisten Zeit pro Druck.",
  },
  platin: {
    name: "Platin-Angel", price: 1600, pressReduction: 2,
    initialTime: 2.0, decay: 0.95, minTime: 0.6,
    desc: "Wie die Diamant-Angel, aber mit spürbar mehr Zeit pro Druck.",
  },
  titan: {
    name: "Titan-Angel", price: 2800, pressReduction: 3,
    initialTime: 2.1, decay: 0.955, minTime: 0.65,
    desc: "Drei Tastendrücke weniger, dazu eine der stabilsten Ruten im Laden.",
  },
  dragon: {
    name: "Drachen-Angel", price: 5000, pressReduction: 3,
    initialTime: 2.2, decay: 0.97, minTime: 0.7,
    desc: "Sehr stark – und die einzige Rute, an der der legendäre Seedrache anbeißt.",
  },
  legenden: {
    name: "Legenden-Angel", price: 6500, pressReduction: 4,
    initialTime: 2.4, decay: 0.97, minTime: 0.72,
    desc: "Vier Tastendrücke weniger – für die ganz großen Brocken.",
  },
  mythos: {
    name: "Mythos-Angel", price: 9000, pressReduction: 5,
    initialTime: 2.6, decay: 0.975, minTime: 0.75,
    desc: "Fünf Tastendrücke weniger und mehr Zeit als jede andere normale Rute.",
  },
  kraken: {
    name: "Kraken-Angel", price: 15000, pressReduction: 5,
    initialTime: 2.8, decay: 0.98, minTime: 0.8,
    desc: "Die stärkste und teuerste Rute überhaupt – nur mit ihr beißt der Kraken persönlich an.",
  },
};

// Farb-/Deko-Design pro Rute, fürs Ladenregal und für die Rute in der Szene.
const ROD_VISUALS = {
  standard: { color: "#8a5a3b", accent: null },
  gold: { color: "#e8b93f", accent: "#fff3c4", style: "shine" },
  diamond: { color: "#bfe9ff", accent: "#eafcff", style: "sparkle" },
  platin: { color: "#d7dde3", accent: "#ffffff", style: "shine" },
  titan: { color: "#4a5568", accent: "#9fb0c2", style: "shine" },
  dragon: { color: "#7a2020", accent: "#ff7a3c", style: "flame" },
  legenden: { color: "#6a3fa0", accent: "#c9a6ff", style: "sparkle" },
  mythos: { color: "#1f9e8a", accent: "#7ffce0", style: "sparkle" },
  kraken: { color: "#1a1a2e", accent: "#5ee6c4", style: "flame" },
};

// Köder: brauchst du für jeden Wurf (1 Stück pro Wurf, egal ob Fang oder
// Fehlschlag). Bessere Köder machen die Fische nicht leichter zu fangen,
// sondern verschieben die Zufallsauswahl stark zugunsten seltener/besserer
// Arten (siehe pickFishSpecies: boost^Tier-Anteil). Werden in Tüten
// gekauft und können sich anhäufen; die Tütengröße (bagSize) ist pro
// Köder unterschiedlich – der Ultraköder kommt nur im Zweierpack.
const BAIT_BAG_SIZE = 20;
const STARTER_BAIT_COUNT = 20;

const BAITS = {
  standard: {
    name: "Standardköder", price: 60, boost: 1, bagSize: BAIT_BAG_SIZE,
    desc: "Der Klassiker. Ganz normale Fangchancen für alle Arten.",
  },
  premium: {
    name: "Premiumköder", price: 120, boost: 3, bagSize: BAIT_BAG_SIZE,
    desc: "Deutlich höhere Chance auf größere, seltenere Fische.",
  },
  profi: {
    name: "Profiköder", price: 500, boost: 8, bagSize: BAIT_BAG_SIZE,
    desc: "Starker Zug zu seltenen, wertvollen Fängen.",
  },
  meister: {
    name: "Meisterköder", price: 1000, boost: 20, bagSize: BAIT_BAG_SIZE,
    desc: "Maximale Chance auf die seltensten Fänge im ganzen Spiel.",
  },
  ultra: {
    name: "Ultraköder", price: 5000, boost: 1, bagSize: 2, guaranteed: true,
    desc: "Kein Zufall mehr: Angelt garantiert den bestmöglichen Fisch, den deine aktuelle Angel überhaupt fangen kann. Nur im Zweierpack erhältlich.",
  },
};

const BAIT_VISUALS = {
  standard: "#8a5a3b",
  premium: "#4a90c2",
  profi: "#8a4ac2",
  meister: "#e8b93f",
  ultra: "#ff3b6b",
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Wählt eine Fischart aus dem Pool (ohne rodgesperrte Arten), gewichtet
// nach Seltenheit UND nach dem Köder-Boost: je höher der Tier-Index
// (=weiter hinten in der jeweils gültigen Liste), desto stärker wirkt der
// Boost des aktuell ausgerüsteten Köders.
function pickFishSpecies() {
  const pool = FISH_SPECIES.filter((f) => !f.requiresRod || f.requiresRod === equippedRod);
  const bait = BAITS[equippedBait];

  // Ultraköder: kein Zufall, sondern immer der punktbeste Fisch, den die
  // aktuell ausgerüstete Angel überhaupt fangen kann.
  if (bait.guaranteed) {
    return pool.reduce((best, f) => (!best || f.points > best.points ? f : best), pool[0]);
  }

  const maxIndex = pool.length - 1;

  const weights = pool.map((f, i) => {
    const tierShare = maxIndex > 0 ? i / maxIndex : 0;
    return f.rarity * Math.pow(bait.boost, tierShare);
  });
  const total = weights.reduce((a, b) => a + b, 0);

  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    if (r < weights[i]) return pool[i];
    r -= weights[i];
  }
  return pool[pool.length - 1];
}

function pickMutation() {
  const r = Math.random() * 100;
  let cumulative = 0;
  for (const m of MUTATIONS) {
    cumulative += m.chance;
    if (r < cumulative) return m;
  }
  return null;
}

function fishVisual(species, mutation) {
  return {
    color: mutation && mutation.colorOverride ? mutation.colorOverride : species.color,
    colorDark: mutation && mutation.colorDarkOverride ? mutation.colorDarkOverride : species.colorDark,
    scale: species.sizeScale * (mutation ? mutation.sizeMultiplier : 1),
    sparkle: Boolean(mutation && mutation.sparkle),
  };
}

function buildSequenceForSpecies(species, rod) {
  const effectiveLength = Math.max(1, species.presses - rod.pressReduction);
  const seq = [];
  for (let i = 0; i < effectiveLength; i++) {
    seq.push(DIRECTIONS[randomInt(0, DIRECTIONS.length - 1)]);
  }
  return seq;
}

const UNIT_TO_GRAMS = { g: 1, kg: 1000, t: 1_000_000 };

function formatWeight(value, unit) {
  if (unit === "g") return `${Math.round(value)} g`;
  if (unit === "kg") return `${value < 10 ? value.toFixed(1) : Math.round(value)} kg`;
  return `${value.toFixed(1)} t`;
}

function formatGrams(grams) {
  if (grams >= 1_000_000) return `${(grams / 1_000_000).toFixed(1)} t`;
  if (grams >= 1000) return `${(grams / 1000 < 10 ? (grams / 1000).toFixed(1) : Math.round(grams / 1000))} kg`;
  return `${Math.round(grams)} g`;
}

// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------

let selectedCharacter = null;

// gameState: "casting" (wartet auf Biss) | "biting" (QTE läuft) |
// "success" | "failure" | "outofbait" | "idle"
let gameState = "idle";

let biteDeadline = 0;

let currentSpecies = null;
let currentMutation = null;
let sequence = [];
let seqIndex = 0;
let keyDeadline = 0;
let currentKeyBudget = 0;

// animState.phase (nur bei "success"): "jumping" -> "holding" -> Panel wird gezeigt
let animState = null;

let score = 0;
let catches = []; // { species, weightValue, weightGrams, presses, points }

let ownedRods = new Set(["standard"]);
let equippedRod = "standard";

// Startet mit einer kostenlosen Tüte Standardköder. Bleibt (wie die
// Ruten) über "Nochmal von vorne" hinweg erhalten – nur ein harter Reset
// (siehe hardReset) setzt sie zurück auf den Startbestand.
let baitInventory = { standard: STARTER_BAIT_COUNT, premium: 0, profi: 0, meister: 0, ultra: 0 };
let equippedBait = "standard";

let bobPhase = 0;
let castAnimStart = 0; // performance.now() beim Auswerfen, treibt die Aushol-/Wurf-Animation
let lastTugTime = 0;   // performance.now() des letzten erfolgreichen Tastendrucks beim Drill (Ruck-Animation)

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
const btnShop = document.getElementById("btn-shop");
const btnShopClose = document.getElementById("btn-shop-close");
const btnContinue = document.getElementById("btn-continue");
const btnRestart = document.getElementById("btn-restart");
const btnChangeAngler = document.getElementById("btn-change-angler");

const hudScore = document.getElementById("hud-score");
const hudCatches = document.getElementById("hud-catches");
const hudRod = document.getElementById("hud-rod");
const hudBait = document.getElementById("hud-bait");
const statusText = document.getElementById("status-text");
const qtePanel = document.getElementById("qte-panel");
const qteKeysEl = document.getElementById("qte-keys");
const qteTimerFill = document.getElementById("qte-timerbar-fill");
const outcomePanel = document.getElementById("outcome-panel");
const outcomeTitle = document.getElementById("outcome-title");
const outcomeDetails = document.getElementById("outcome-details");
const noBaitPanel = document.getElementById("no-bait-panel");
const noBaitTitle = document.getElementById("no-bait-title");
const noBaitDetails = document.getElementById("no-bait-details");
const btnNoBaitAction = document.getElementById("btn-no-bait-action");
const summaryStats = document.getElementById("summary-stats");
const catchList = document.getElementById("catch-list");

const shopModal = document.getElementById("shop-modal");
const shopPointsEl = document.getElementById("shop-points");
const shopRodsEl = document.getElementById("shop-rods");
const shopBaitsEl = document.getElementById("shop-baits");

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

// expression: "neutral" (normal) | "strain" (angespannt beim Drillen) |
// "happy" (Fang gelandet) | "shock" (fällt ins Wasser)
function drawHead(ctx, cx, cy, radius, character, angle, expression) {
  expression = expression || "neutral";
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

  // -- Gesicht --
  const eyeY = -radius * 0.05;
  const eyeDX = radius * 0.32;
  const eyeR = radius * (expression === "shock" ? 0.16 : 0.1);

  ctx.fillStyle = "#2a2018";
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.arc(side * eyeDX, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();
  });

  // Augenbrauen (Ausdruck je nach Zustand)
  ctx.strokeStyle = "#3b2a1e";
  ctx.lineWidth = Math.max(1, radius * 0.09);
  ctx.lineCap = "round";
  [-1, 1].forEach((side) => {
    const bx = side * eyeDX;
    const by = eyeY - radius * 0.32;
    ctx.beginPath();
    if (expression === "strain") {
      ctx.moveTo(bx - side * radius * 0.14, by + radius * 0.07);
      ctx.lineTo(bx + side * radius * 0.14, by - radius * 0.05);
    } else if (expression === "shock") {
      ctx.moveTo(bx - radius * 0.15, by - radius * 0.06);
      ctx.lineTo(bx + radius * 0.15, by - radius * 0.06);
    } else if (expression === "happy") {
      ctx.moveTo(bx - radius * 0.14, by + radius * 0.03);
      ctx.lineTo(bx + radius * 0.14, by - radius * 0.06);
    } else {
      ctx.moveTo(bx - radius * 0.14, by);
      ctx.lineTo(bx + radius * 0.14, by - radius * 0.03);
    }
    ctx.stroke();
  });

  // Mund
  const mouthY = radius * 0.42;
  if (expression === "shock") {
    ctx.fillStyle = "#3a1f18";
    ctx.beginPath();
    ctx.ellipse(0, mouthY, radius * 0.16, radius * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = "#7a3d30";
    ctx.lineWidth = Math.max(1, radius * 0.09);
    ctx.lineCap = "round";
    ctx.beginPath();
    if (expression === "happy") {
      ctx.arc(0, mouthY - radius * 0.1, radius * 0.32, 0.15 * Math.PI, 0.85 * Math.PI);
    } else if (expression === "strain") {
      ctx.moveTo(-radius * 0.22, mouthY);
      ctx.lineTo(radius * 0.22, mouthY);
    } else {
      ctx.arc(0, mouthY - radius * 0.14, radius * 0.22, 0.2 * Math.PI, 0.8 * Math.PI);
    }
    ctx.stroke();
  }

  ctx.restore();
}

function drawPortrait(canvasEl, character) {
  const pctx = canvasEl.getContext("2d");
  const w = canvasEl.width, h = canvasEl.height;
  pctx.clearRect(0, 0, w, h);
  drawHead(pctx, w / 2, h / 2 + 6, 34, character, 0, "neutral");
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

function beginSession() {
  score = 0;
  catches = [];
  showScreen("game");
  requestAnimationFrame(() => {
    resizeCanvas();
    startCasting();
    requestAnimationFrame(loop);
  });
}

btnStart.addEventListener("click", () => {
  if (!selectedCharacter) return;
  beginSession();
});

btnExitGame.addEventListener("click", () => showSummary());
btnChangeAngler.addEventListener("click", () => showScreen("select"));
btnRestart.addEventListener("click", () => beginSession());

btnContinue.addEventListener("click", () => continueFishing());

function updateHud() {
  hudScore.textContent = `${score} Punkte`;
  hudCatches.textContent = `${catches.length} Fisch${catches.length === 1 ? "" : "e"} gefangen`;
  hudRod.textContent = `🎣 ${RODS[equippedRod].name}`;
  const baitLeft = baitInventory[equippedBait] || 0;
  hudBait.textContent = `🪱 ${BAITS[equippedBait].name} ×${baitLeft}`;
}

// Verbraucht 1 Köder für den bevorstehenden Wurf. Gibt true zurück, wenn
// geworfen werden kann. Ist der ausgerüstete Köder leer, wird automatisch
// auf einen anderen vorhandenen Köder gewechselt. Ist gar kein Köder mehr
// da, wird je nach Kontostand entweder zum Laden geschickt oder (wenn
// sich auch der billigste Köder nicht mehr leisten lässt) ein Reset
// erzwungen.
function consumeBait() {
  if (baitInventory[equippedBait] > 0) {
    baitInventory[equippedBait]--;
    updateHud();
    return true;
  }

  const fallback = Object.keys(BAITS).find((id) => baitInventory[id] > 0);
  if (fallback) {
    equippedBait = fallback;
    baitInventory[fallback]--;
    updateHud();
    return true;
  }

  const cheapestPrice = Math.min(...Object.values(BAITS).map((b) => b.price));
  gameState = "outofbait";
  qtePanel.classList.add("hidden");
  outcomePanel.classList.add("hidden");
  statusText.textContent = "";

  if (score >= cheapestPrice) {
    noBaitTitle.textContent = "Köder alle!";
    noBaitDetails.innerHTML = "<div>Du hast keinen Köder mehr im Köcher. Kauf im Angelladen nach, um weiterzuangeln.</div>";
    btnNoBaitAction.textContent = "Zum Angelladen";
    btnNoBaitAction.onclick = () => {
      renderShop();
      shopModal.classList.remove("hidden");
    };
  } else {
    noBaitTitle.textContent = "Köder alle – und pleite!";
    noBaitDetails.innerHTML = "<div>Kein Köder mehr und auch kein Geld für Nachschub. Zeit für einen Neustart.</div>";
    btnNoBaitAction.textContent = "Neu starten";
    btnNoBaitAction.onclick = () => hardReset();
  }
  noBaitPanel.classList.remove("hidden");
  return false;
}

// Kompletter Reset: Punkte, Fänge, Ruten UND Köder zurück auf null bzw.
// Startbestand. Die eigentliche Konsequenz, wenn man sich verzockt hat.
function hardReset() {
  score = 0;
  catches = [];
  ownedRods = new Set(["standard"]);
  equippedRod = "standard";
  baitInventory = { standard: STARTER_BAIT_COUNT, premium: 0, profi: 0, meister: 0, ultra: 0 };
  equippedBait = "standard";
  noBaitPanel.classList.add("hidden");
  updateHud();
  startCasting();
}

function startCasting() {
  if (!consumeBait()) return;

  gameState = "casting";
  castAnimStart = performance.now();
  statusText.textContent = "Angel ausgeworfen … warte auf einen Biss.";
  qtePanel.classList.add("hidden");
  outcomePanel.classList.add("hidden");
  noBaitPanel.classList.add("hidden");
  const waitTime = CAST_ANIM_DURATION + BITE_WAIT_MIN + Math.random() * (BITE_WAIT_MAX - BITE_WAIT_MIN);
  biteDeadline = performance.now() + waitTime * 1000;
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
  lastTugTime = performance.now();
  currentSpecies = pickFishSpecies();
  currentMutation = pickMutation();
  const rod = RODS[equippedRod];
  sequence = buildSequenceForSpecies(currentSpecies, rod);
  seqIndex = 0;
  currentKeyBudget = rod.initialTime;
  keyDeadline = performance.now() + currentKeyBudget * 1000;

  statusText.textContent = `Ein ${currentSpecies.name} beißt an! Tastenfolge nachdrücken!`;
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
  const rod = RODS[equippedRod];
  currentKeyBudget = Math.max(rod.minTime, currentKeyBudget * rod.decay);
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
  lastTugTime = performance.now();
  seqIndex++;
  renderQteRow();
  if (seqIndex >= sequence.length) {
    succeedCatch();
  } else {
    advanceKeyTimer();
  }
}

// Sobald das Ergebnis-Panel offen ist, reicht zum Weiterangeln irgendeine
// der vier Angel-Tasten – man muss nicht extra zum Button greifen.
function continueFishing() {
  outcomePanel.classList.add("hidden");
  animState = null;
  startCasting();
}

window.addEventListener("keydown", (e) => {
  const isDirectionKey = ["ArrowLeft", "a", "A", "ArrowRight", "d", "D", "ArrowUp", "w", "W", "ArrowDown", "s", "S"].includes(e.key);
  if (!isDirectionKey) return;

  if (gameState === "biting") {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") handleDirection("left");
    else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") handleDirection("right");
    else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") handleDirection("up");
    else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") handleDirection("down");
  } else if (!outcomePanel.classList.contains("hidden")) {
    continueFishing();
  }
});

function succeedCatch() {
  const species = currentSpecies;
  const mutation = currentMutation;
  const baseWeight = species.weight[0] + Math.random() * (species.weight[1] - species.weight[0]);
  const weightValue = mutation ? baseWeight * mutation.weightMultiplier : baseWeight;
  const weightGrams = weightValue * UNIT_TO_GRAMS[species.unit];
  const points = mutation ? Math.round(species.points * mutation.pointMultiplier) : species.points;
  const presses = sequence.length;

  score += points;
  catches.push({ species, mutation, weightValue, weightGrams, presses, points });
  updateHud();

  gameState = "success";
  qtePanel.classList.add("hidden");
  statusText.textContent = `${species.name} an der Angel – hoch damit!`;
  animState = { type: "success", start: performance.now(), species, mutation, revealed: false };
}

function failCatch() {
  gameState = "failure";
  qtePanel.classList.add("hidden");
  statusText.textContent = "";
  animState = { type: "failure", start: performance.now(), revealed: false };
}

function revealSuccessOutcome() {
  const c = catches[catches.length - 1];
  statusText.textContent = "";
  const emoji = c.mutation ? c.mutation.prefixEmoji : c.species.emoji;
  const name = c.mutation ? `${c.mutation.name}-${c.species.name}` : c.species.name;
  outcomeTitle.textContent = `${emoji} ${name} gefangen!`;
  outcomeDetails.innerHTML = `
    <div><b>${formatWeight(c.weightValue, c.species.unit)}</b> schwer</div>
    <div>${c.presses} Tastendrücke gebraucht</div>
    <div>+${c.points} Punkte${c.mutation ? " (Mutation!)" : ""}</div>
  `;
  outcomePanel.classList.remove("hidden");
}

function revealFailureOutcome() {
  outcomeTitle.textContent = "Reingefallen!";
  outcomeDetails.innerHTML = `<div>Der Fisch war zu stark – du bist in den Fluss gezogen worden.</div>`;
  outcomePanel.classList.remove("hidden");
}

function maybeRevealOutcome(now) {
  if (!animState || animState.revealed) return;
  const elapsed = (now - animState.start) / 1000;
  if (animState.type === "success" && elapsed >= SUCCESS_JUMP_DURATION + SUCCESS_HOLD_DURATION) {
    animState.revealed = true;
    revealSuccessOutcome();
  } else if (animState.type === "failure" && elapsed >= FAIL_ANIM_DURATION) {
    animState.revealed = true;
    revealFailureOutcome();
  }
}

function showSummary() {
  gameState = "idle";
  const totalGrams = catches.reduce((sum, c) => sum + c.weightGrams, 0);
  const biggest = catches.reduce((max, c) => (!max || c.weightGrams > max.weightGrams ? c : max), null);

  summaryStats.innerHTML = `
    <div class="stat-row"><span>Punkte gesamt</span><b>${score}</b></div>
    <div class="stat-row"><span>Fische gefangen</span><b>${catches.length}</b></div>
    <div class="stat-row"><span>Gesamtgewicht</span><b>${formatGrams(totalGrams)}</b></div>
    <div class="stat-row"><span>Größter Fang</span><b>${biggest ? biggest.species.name + " (" + formatWeight(biggest.weightValue, biggest.species.unit) + ")" : "–"}</b></div>
  `;

  catchList.innerHTML = catches.length
    ? catches.slice().reverse().map((c) => {
        const emoji = c.mutation ? c.mutation.prefixEmoji : c.species.emoji;
        const name = c.mutation ? `${c.mutation.name}-${c.species.name}` : c.species.name;
        return `
        <div class="catch-row">
          <div class="catch-emoji">${emoji}</div>
          <div class="catch-info">${name} · ${formatWeight(c.weightValue, c.species.unit)} · ${c.presses} Tastendrücke</div>
          <div class="catch-points">+${c.points}</div>
        </div>
      `;
      }).join("")
    : `<div class="catch-row"><div class="catch-info">Noch keinen Fisch gefangen.</div></div>`;

  showScreen("summary");
}

// ---------------------------------------------------------------------
// Angelladen (Shop)
// ---------------------------------------------------------------------

function drawRodIcon(canvasEl, rodId) {
  const visual = ROD_VISUALS[rodId];
  const c = canvasEl.getContext("2d");
  const w = canvasEl.width, h = canvasEl.height;
  c.clearRect(0, 0, w, h);

  const x1 = w * 0.22, y1 = h * 0.85;
  const x2 = w * 0.85, y2 = h * 0.15;

  c.strokeStyle = visual.color;
  c.lineWidth = Math.max(3, w * 0.06);
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();

  // Schnur + Haken
  c.strokeStyle = "rgba(230,230,230,0.6)";
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(x2, y2);
  c.lineTo(x2 - w * 0.12, y2 + h * 0.55);
  c.stroke();

  if (visual.style === "shine") {
    c.fillStyle = visual.accent;
    c.beginPath();
    c.arc(w * 0.55, h * 0.48, w * 0.05, 0, Math.PI * 2);
    c.fill();
  } else if (visual.style === "sparkle") {
    c.fillStyle = visual.accent;
    [[0.45, 0.55], [0.65, 0.35], [0.35, 0.3]].forEach(([fx, fy]) => {
      c.beginPath();
      c.arc(w * fx, h * fy, w * 0.035, 0, Math.PI * 2);
      c.fill();
    });
  } else if (visual.style === "flame") {
    c.fillStyle = visual.accent;
    [[0.4, 0.6], [0.58, 0.4]].forEach(([fx, fy]) => {
      c.beginPath();
      c.ellipse(w * fx, h * fy, w * 0.045, h * 0.07, 0.3, 0, Math.PI * 2);
      c.fill();
    });
  }
}

function drawBaitIcon(canvasEl, baitId) {
  const color = BAIT_VISUALS[baitId];
  const c = canvasEl.getContext("2d");
  const w = canvasEl.width, h = canvasEl.height;
  c.clearRect(0, 0, w, h);

  // Kleine Köder-Tüte
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(w * 0.3, h * 0.28);
  c.quadraticCurveTo(w * 0.14, h * 0.5, w * 0.3, h * 0.86);
  c.lineTo(w * 0.7, h * 0.86);
  c.quadraticCurveTo(w * 0.86, h * 0.5, w * 0.7, h * 0.28);
  c.closePath();
  c.fill();

  // Knoten oben
  c.strokeStyle = "rgba(0,0,0,0.35)";
  c.lineWidth = Math.max(2, w * 0.05);
  c.beginPath();
  c.moveTo(w * 0.35, h * 0.28);
  c.lineTo(w * 0.65, h * 0.28);
  c.stroke();
  c.beginPath();
  c.arc(w * 0.5, h * 0.2, w * 0.08, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();

  // Highlight
  c.fillStyle = "rgba(255,255,255,0.25)";
  c.beginPath();
  c.ellipse(w * 0.4, h * 0.5, w * 0.06, h * 0.14, 0, 0, Math.PI * 2);
  c.fill();

  // Stern-Symbol für den Ultraköder: garantiert statt Zufall
  if (baitId === "ultra") {
    const cx = w * 0.5, cy = h * 0.54, r = w * 0.15;
    c.fillStyle = "#fff4c8";
    c.beginPath();
    c.moveTo(cx, cy - r);
    c.lineTo(cx + r * 0.28, cy - r * 0.28);
    c.lineTo(cx + r, cy);
    c.lineTo(cx + r * 0.28, cy + r * 0.28);
    c.lineTo(cx, cy + r);
    c.lineTo(cx - r * 0.28, cy + r * 0.28);
    c.lineTo(cx - r, cy);
    c.lineTo(cx - r * 0.28, cy - r * 0.28);
    c.closePath();
    c.fill();
  }
}

function renderBaitShop() {
  shopBaitsEl.innerHTML = Object.entries(BAITS).map(([id, bait]) => {
    const stock = baitInventory[id] || 0;
    const equipped = equippedBait === id;
    const canAfford = score >= bait.price;

    return `
      <div class="rod-card ${equipped ? "rod-card-active" : ""} ${bait.guaranteed ? "rod-card-legendary" : ""}">
        <canvas class="rod-icon" data-bait-icon="${id}" width="70" height="70"></canvas>
        <div class="rod-body">
          <div class="rod-name">${bait.name}</div>
          <div class="rod-desc">${bait.desc}</div>
          <div class="bait-stock">Vorrat: ${stock}${equipped ? " · ausgerüstet" : ""}</div>
          <div class="bait-actions">
            <button class="rod-btn" data-buy-bait="${id}" ${canAfford ? "" : "disabled"}>${bait.bagSize === 1 ? "Köder" : `${bait.bagSize}er-Pack`} kaufen (+${bait.bagSize}) – ${bait.price} P</button>
            ${!equipped && stock > 0 ? `<button class="rod-btn bait-equip-btn" data-equip-bait="${id}">Ausrüsten</button>` : ""}
          </div>
        </div>
      </div>
    `;
  }).join("");

  shopBaitsEl.querySelectorAll("[data-buy-bait]").forEach((btn) => {
    btn.addEventListener("click", () => buyBait(btn.dataset.buyBait));
  });
  shopBaitsEl.querySelectorAll("[data-equip-bait]").forEach((btn) => {
    btn.addEventListener("click", () => {
      equippedBait = btn.dataset.equipBait;
      updateHud();
      renderBaitShop();
    });
  });
  shopBaitsEl.querySelectorAll("canvas[data-bait-icon]").forEach((c) => {
    drawBaitIcon(c, c.dataset.baitIcon);
  });
}

function buyBait(id) {
  const bait = BAITS[id];
  if (score < bait.price) return;
  score -= bait.price;
  baitInventory[id] = (baitInventory[id] || 0) + bait.bagSize;
  equippedBait = id;
  updateHud();
  renderShop();
}

function renderShop() {
  shopPointsEl.textContent = `Punkte: ${score}`;
  renderBaitShop();
  shopRodsEl.innerHTML = Object.entries(RODS).map(([id, rod]) => {
    const owned = ownedRods.has(id);
    const equipped = equippedRod === id;
    let label, disabled;
    if (equipped) { label = "Ausgerüstet"; disabled = true; }
    else if (owned) { label = "Ausrüsten"; disabled = false; }
    else { label = `Kaufen – ${rod.price} P`; disabled = score < rod.price; }

    return `
      <div class="rod-card ${equipped ? "rod-card-active" : ""} ${id === "dragon" || id === "kraken" ? "rod-card-legendary" : ""}">
        <canvas class="rod-icon" data-rod-icon="${id}" width="70" height="70"></canvas>
        <div class="rod-body">
          <div class="rod-name">${rod.name}</div>
          <div class="rod-desc">${rod.desc}</div>
          <button class="rod-btn" data-rod="${id}" ${disabled ? "disabled" : ""}>${label}</button>
        </div>
      </div>
    `;
  }).join("");

  shopRodsEl.querySelectorAll(".rod-btn").forEach((btn) => {
    btn.addEventListener("click", () => onRodButtonClick(btn.dataset.rod));
  });
  shopRodsEl.querySelectorAll("canvas[data-rod-icon]").forEach((c) => {
    drawRodIcon(c, c.dataset.rodIcon);
  });
}

function onRodButtonClick(id) {
  const rod = RODS[id];
  if (ownedRods.has(id)) {
    equippedRod = id;
  } else if (score >= rod.price) {
    score -= rod.price;
    ownedRods.add(id);
    equippedRod = id;
  }
  updateHud();
  renderShop();
}

function closeShop() {
  shopModal.classList.add("hidden");
  // War das Angeln wegen leerem Köcher blockiert, hier automatisch neu
  // versuchen (klappt, falls in der Zwischenzeit Köder gekauft wurden).
  if (gameState === "outofbait") startCasting();
}

btnShop.addEventListener("click", () => {
  if (gameState === "biting") return;
  renderShop();
  shopModal.classList.remove("hidden");
});
btnShopClose.addEventListener("click", closeShop);
shopModal.querySelector(".modal-backdrop").addEventListener("click", closeShop);

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

// Normale Fischform: kopfseitig bei +x, Schwanz bei -x. Mit gegabelter
// Schwanzflosse, Rücken-/Brustflosse, Bauchschattierung und einem
// richtigen Auge statt nur einem Punkt.
function drawFishShape(scale, color, colorDark) {
  const bodyRX = canvas.width * 0.028 * scale;
  const bodyRY = canvas.width * 0.0145 * scale;

  // Körper (spitz zulaufender Torpedo-Umriss statt reiner Ellipse)
  ctx.beginPath();
  ctx.moveTo(bodyRX, 0);
  ctx.bezierCurveTo(bodyRX, -bodyRY * 1.2, -bodyRX * 0.55, -bodyRY, -bodyRX * 0.95, -bodyRY * 0.22);
  ctx.bezierCurveTo(-bodyRX * 1.08, 0, -bodyRX * 1.08, 0, -bodyRX * 0.95, bodyRY * 0.22);
  ctx.bezierCurveTo(-bodyRX * 0.55, bodyRY, bodyRX, bodyRY * 1.2, bodyRX, 0);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // Bauchschattierung, an den Körperumriss geklemmt
  ctx.save();
  ctx.clip();
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.beginPath();
  ctx.ellipse(-bodyRX * 0.05, bodyRY * 0.55, bodyRX * 0.95, bodyRY * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Gegabelte Schwanzflosse
  const tailX = -bodyRX * 0.95;
  ctx.beginPath();
  ctx.moveTo(tailX, 0);
  ctx.lineTo(tailX - bodyRX * 0.7, -bodyRY * 1.35);
  ctx.lineTo(tailX - bodyRX * 0.3, 0);
  ctx.lineTo(tailX - bodyRX * 0.7, bodyRY * 1.35);
  ctx.closePath();
  ctx.fillStyle = colorDark;
  ctx.fill();

  // Rückenflosse
  ctx.beginPath();
  ctx.moveTo(bodyRX * 0.1, -bodyRY * 0.75);
  ctx.lineTo(bodyRX * 0.32, -bodyRY * 1.75);
  ctx.lineTo(bodyRX * 0.5, -bodyRY * 0.6);
  ctx.closePath();
  ctx.fillStyle = colorDark;
  ctx.fill();

  // Brustflosse
  ctx.beginPath();
  ctx.moveTo(bodyRX * 0.2, bodyRY * 0.5);
  ctx.lineTo(bodyRX * 0.05, bodyRY * 1.5);
  ctx.lineTo(bodyRX * 0.48, bodyRY * 0.7);
  ctx.closePath();
  ctx.fillStyle = colorDark;
  ctx.fill();

  // Kiemenbogen
  ctx.strokeStyle = "rgba(0,0,0,0.22)";
  ctx.lineWidth = Math.max(1, bodyRX * 0.05);
  ctx.beginPath();
  ctx.arc(bodyRX * 0.5, 0, bodyRY * 0.6, -Math.PI * 0.55, Math.PI * 0.55);
  ctx.stroke();

  // Auge (weiß + Pupille + Glanzpunkt)
  const eyeX = bodyRX * 0.63, eyeY = -bodyRY * 0.18;
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, Math.max(1.6, bodyRX * 0.135), 0, Math.PI * 2);
  ctx.fillStyle = "#f4f6f8";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeX + bodyRX * 0.02, eyeY, Math.max(1, bodyRX * 0.07), 0, Math.PI * 2);
  ctx.fillStyle = "#14171b";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeX - bodyRX * 0.02, eyeY - bodyRY * 0.06, Math.max(0.6, bodyRX * 0.03), 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
}

// Der Seedrache ist kein Fisch, sondern eine große Seeschlange: gewellter
// Buckel-Körper (wie ein klassisches Seeungeheuer), Drachenkopf mit
// Hörnern statt Fischkopf. Kopf liegt bei +x, Schwanzspitze bei -x, damit
// sie sich wie drawFishShape in bestehende Rotationen/Positionen einfügt.
function drawSeaDragon(scale, color, colorDark) {
  const unit = canvas.width * 0.012 * scale;
  const humpCount = 4;

  // Der Körper ist von der Form her nicht symmetrisch um (0,0) (der Kopf
  // ragt weniger weit nach +x als der Schwanz nach -x reicht) -> hier
  // rezentrieren, damit die Kreatur beim Halten mittig über dem Kopf sitzt.
  ctx.save();
  ctx.translate(unit * 2.3, 0);

  // Schwanzspitze
  ctx.beginPath();
  ctx.moveTo(-unit * 8.6, unit * 1.1);
  ctx.quadraticCurveTo(-unit * 10.8, unit * 2.4, -unit * 12.2, unit * 0.9);
  ctx.quadraticCurveTo(-unit * 10.6, unit * 0.15, -unit * 8.6, unit * 0.55);
  ctx.closePath();
  ctx.fillStyle = colorDark;
  ctx.fill();

  // Gewellte Rückenbuckel, vom Schwanz (klein) zum Kopf (groß)
  for (let i = humpCount; i >= 0; i--) {
    const t = i / humpCount;
    const x = unit * 1.6 - unit * 7.6 * t;
    const y = Math.sin(i * 1.3) * unit * 1.05;
    const r = unit * (2.5 - t * 1.25);

    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.72, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Rückenzacke auf jedem Buckel
    ctx.beginPath();
    ctx.moveTo(x - r * 0.5, y - r * 0.55);
    ctx.lineTo(x, y - r * 1.55);
    ctx.lineTo(x + r * 0.5, y - r * 0.55);
    ctx.closePath();
    ctx.fillStyle = colorDark;
    ctx.fill();
  }

  // Drachenkopf
  const headX = unit * 4.1, headY = 0, headR = unit * 2.9;
  ctx.beginPath();
  ctx.ellipse(headX, headY, headR, headR * 0.82, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Schnauze
  ctx.beginPath();
  ctx.ellipse(headX + headR * 0.95, headY + headR * 0.12, headR * 0.5, headR * 0.36, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Hörner
  ctx.strokeStyle = colorDark;
  ctx.lineWidth = Math.max(1.5, unit * 0.32);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(headX - headR * 0.15, headY - headR * 0.65);
  ctx.lineTo(headX, headY - headR * 1.5);
  ctx.moveTo(headX + headR * 0.4, headY - headR * 0.6);
  ctx.lineTo(headX + headR * 0.55, headY - headR * 1.4);
  ctx.stroke();

  // Auge
  ctx.beginPath();
  ctx.arc(headX + headR * 0.55, headY - headR * 0.25, headR * 0.17, 0, Math.PI * 2);
  ctx.fillStyle = "#f4f6f8";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(headX + headR * 0.6, headY - headR * 0.25, headR * 0.09, 0, Math.PI * 2);
  ctx.fillStyle = "#14171b";
  ctx.fill();

  ctx.restore();
}

// Hai-Silhouette: spitze Schnauze, hohe dreieckige Rückenflosse,
// asymmetrische (heterozerke) Schwanzflosse, Kiemenspalten.
function drawSharkShape(scale, color, colorDark) {
  const bodyRX = canvas.width * 0.032 * scale;
  const bodyRY = canvas.width * 0.012 * scale;

  ctx.beginPath();
  ctx.moveTo(bodyRX * 1.15, 0);
  ctx.quadraticCurveTo(bodyRX * 0.7, -bodyRY * 1.3, 0, -bodyRY * 1.05);
  ctx.quadraticCurveTo(-bodyRX * 0.75, -bodyRY * 0.55, -bodyRX * 0.95, -bodyRY * 0.15);
  ctx.quadraticCurveTo(-bodyRX * 0.75, bodyRY * 0.55, 0, bodyRY * 1.05);
  ctx.quadraticCurveTo(bodyRX * 0.7, bodyRY * 1.3, bodyRX * 1.15, 0);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  ctx.save();
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.beginPath();
  ctx.ellipse(0, bodyRY * 0.5, bodyRX * 0.9, bodyRY * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Heterozerke Schwanzflosse: großer oberer, kleiner unterer Lappen
  const tailX = -bodyRX * 0.95;
  ctx.beginPath();
  ctx.moveTo(tailX, -bodyRY * 0.1);
  ctx.quadraticCurveTo(tailX - bodyRX * 0.5, -bodyRY * 2.6, tailX - bodyRX * 0.85, -bodyRY * 2.9);
  ctx.quadraticCurveTo(tailX - bodyRX * 0.5, -bodyRY * 0.9, tailX - bodyRX * 0.15, -bodyRY * 0.05);
  ctx.closePath();
  ctx.fillStyle = colorDark;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(tailX, bodyRY * 0.1);
  ctx.quadraticCurveTo(tailX - bodyRX * 0.35, bodyRY * 1.3, tailX - bodyRX * 0.6, bodyRY * 1.5);
  ctx.quadraticCurveTo(tailX - bodyRX * 0.3, bodyRY * 0.5, tailX - bodyRX * 0.1, bodyRY * 0.05);
  ctx.closePath();
  ctx.fillStyle = colorDark;
  ctx.fill();

  // Hohe dreieckige Rückenflosse
  ctx.beginPath();
  ctx.moveTo(-bodyRX * 0.05, -bodyRY * 0.9);
  ctx.lineTo(bodyRX * 0.05, -bodyRY * 3.1);
  ctx.lineTo(bodyRX * 0.45, -bodyRY * 0.85);
  ctx.closePath();
  ctx.fillStyle = colorDark;
  ctx.fill();

  // Brustflosse
  ctx.beginPath();
  ctx.moveTo(bodyRX * 0.15, bodyRY * 0.6);
  ctx.lineTo(-bodyRX * 0.1, bodyRY * 1.9);
  ctx.lineTo(bodyRX * 0.5, bodyRY * 0.8);
  ctx.closePath();
  ctx.fillStyle = colorDark;
  ctx.fill();

  // Kiemenspalten
  ctx.strokeStyle = "rgba(0,0,0,0.28)";
  ctx.lineWidth = Math.max(1, bodyRX * 0.035);
  for (let i = 0; i < 4; i++) {
    const gx = bodyRX * (0.55 - i * 0.11);
    ctx.beginPath();
    ctx.moveTo(gx, -bodyRY * 0.75);
    ctx.lineTo(gx - bodyRX * 0.04, bodyRY * 0.55);
    ctx.stroke();
  }

  // Auge
  ctx.beginPath();
  ctx.arc(bodyRX * 0.78, -bodyRY * 0.1, Math.max(1.4, bodyRX * 0.09), 0, Math.PI * 2);
  ctx.fillStyle = "#14171b";
  ctx.fill();
}

// Thunfisch-Silhouette: schlanker Torpedokörper, sichelförmige Flossen,
// Halbmond-Schwanzflosse, kleine "Flösschen" (Finlets) am Schwanzansatz.
function drawTunaShape(scale, color, colorDark) {
  const bodyRX = canvas.width * 0.03 * scale;
  const bodyRY = canvas.width * 0.011 * scale;

  ctx.beginPath();
  ctx.moveTo(bodyRX, 0);
  ctx.bezierCurveTo(bodyRX * 0.9, -bodyRY * 1.3, -bodyRX * 0.3, -bodyRY * 1.1, -bodyRX * 0.85, -bodyRY * 0.2);
  ctx.bezierCurveTo(-bodyRX * 0.95, 0, -bodyRX * 0.95, 0, -bodyRX * 0.85, bodyRY * 0.2);
  ctx.bezierCurveTo(-bodyRX * 0.3, bodyRY * 1.1, bodyRX * 0.9, bodyRY * 1.3, bodyRX, 0);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  const tailX = -bodyRX * 0.85;
  ctx.beginPath();
  ctx.moveTo(tailX, 0);
  ctx.quadraticCurveTo(tailX - bodyRX * 0.35, -bodyRY * 0.3, tailX - bodyRX * 0.55, -bodyRY * 1.6);
  ctx.quadraticCurveTo(tailX - bodyRX * 0.25, -bodyRY * 0.5, tailX - bodyRX * 0.1, 0);
  ctx.quadraticCurveTo(tailX - bodyRX * 0.25, bodyRY * 0.5, tailX - bodyRX * 0.55, bodyRY * 1.6);
  ctx.quadraticCurveTo(tailX - bodyRX * 0.35, bodyRY * 0.3, tailX, 0);
  ctx.closePath();
  ctx.fillStyle = colorDark;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(bodyRX * 0.1, -bodyRY * 0.85);
  ctx.quadraticCurveTo(bodyRX * 0.28, -bodyRY * 1.9, bodyRX * 0.55, -bodyRY * 0.75);
  ctx.closePath();
  ctx.fillStyle = colorDark;
  ctx.fill();

  for (let i = 0; i < 4; i++) {
    const fx = -bodyRX * (0.35 + i * 0.13);
    ctx.beginPath();
    ctx.moveTo(fx, -bodyRY * 0.5);
    ctx.lineTo(fx - bodyRX * 0.04, -bodyRY * 0.85);
    ctx.lineTo(fx + bodyRX * 0.05, -bodyRY * 0.55);
    ctx.closePath();
    ctx.fillStyle = colorDark;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(bodyRX * 0.65, -bodyRY * 0.15, Math.max(1.3, bodyRX * 0.1), 0, Math.PI * 2);
  ctx.fillStyle = "#f4f6f8";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(bodyRX * 0.67, -bodyRY * 0.15, Math.max(0.8, bodyRX * 0.05), 0, Math.PI * 2);
  ctx.fillStyle = "#14171b";
  ctx.fill();
}

// Schwertfisch-Silhouette: langer spitzer Schnabel, hohe segelartige
// Rückenflosse.
function drawBillfishShape(scale, color, colorDark) {
  const bodyRX = canvas.width * 0.028 * scale;
  const bodyRY = canvas.width * 0.0105 * scale;

  ctx.beginPath();
  ctx.moveTo(bodyRX * 0.9, -bodyRY * 0.15);
  ctx.lineTo(bodyRX * 2.1, 0);
  ctx.lineTo(bodyRX * 0.9, bodyRY * 0.15);
  ctx.closePath();
  ctx.fillStyle = colorDark;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(bodyRX * 0.95, 0);
  ctx.bezierCurveTo(bodyRX * 0.85, -bodyRY * 1.2, -bodyRX * 0.3, -bodyRY, -bodyRX * 0.9, -bodyRY * 0.18);
  ctx.bezierCurveTo(-bodyRX, 0, -bodyRX, 0, -bodyRX * 0.9, bodyRY * 0.18);
  ctx.bezierCurveTo(-bodyRX * 0.3, bodyRY, bodyRX * 0.85, bodyRY * 1.2, bodyRX * 0.95, 0);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-bodyRX * 0.35, -bodyRY * 0.85);
  ctx.quadraticCurveTo(0, -bodyRY * 3.4, bodyRX * 0.45, -bodyRY * 0.8);
  ctx.closePath();
  ctx.fillStyle = colorDark;
  ctx.globalAlpha = 0.92;
  ctx.fill();
  ctx.globalAlpha = 1;

  const tailX = -bodyRX * 0.9;
  ctx.beginPath();
  ctx.moveTo(tailX, 0);
  ctx.quadraticCurveTo(tailX - bodyRX * 0.3, -bodyRY * 0.3, tailX - bodyRX * 0.5, -bodyRY * 1.5);
  ctx.quadraticCurveTo(tailX - bodyRX * 0.2, -bodyRY * 0.4, tailX - bodyRX * 0.08, 0);
  ctx.quadraticCurveTo(tailX - bodyRX * 0.2, bodyRY * 0.4, tailX - bodyRX * 0.5, bodyRY * 1.5);
  ctx.quadraticCurveTo(tailX - bodyRX * 0.3, bodyRY * 0.3, tailX, 0);
  ctx.closePath();
  ctx.fillStyle = colorDark;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(bodyRX * 0.65, -bodyRY * 0.1, Math.max(1.2, bodyRX * 0.09), 0, Math.PI * 2);
  ctx.fillStyle = "#14171b";
  ctx.fill();
}

// Wal-Silhouette: großer runder Körper, horizontale Fluke statt stehender
// Schwanzflosse, Blasloch, paddelförmige Brustflosse, kaum Rückenflosse.
function drawWhaleShape(scale, color, colorDark) {
  const bodyRX = canvas.width * 0.034 * scale;
  const bodyRY = canvas.width * 0.016 * scale;

  ctx.beginPath();
  ctx.moveTo(bodyRX, -bodyRY * 0.1);
  ctx.bezierCurveTo(bodyRX * 0.9, -bodyRY * 1.15, -bodyRX * 0.4, -bodyRY * 1.05, -bodyRX * 0.85, -bodyRY * 0.3);
  ctx.bezierCurveTo(-bodyRX * 1.02, 0, -bodyRX * 1.02, 0, -bodyRX * 0.85, bodyRY * 0.3);
  ctx.bezierCurveTo(-bodyRX * 0.4, bodyRY * 1.05, bodyRX * 0.75, bodyRY * 1.1, bodyRX, bodyRY * 0.15);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  ctx.save();
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.ellipse(-bodyRX * 0.1, bodyRY * 0.6, bodyRX * 0.9, bodyRY * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const tailX = -bodyRX * 0.88;
  ctx.beginPath();
  ctx.moveTo(tailX, 0);
  ctx.quadraticCurveTo(tailX - bodyRX * 0.55, -bodyRY * 0.35, tailX - bodyRX * 1.05, -bodyRY * 0.15);
  ctx.quadraticCurveTo(tailX - bodyRX * 0.55, bodyRY * 0.05, tailX - bodyRX * 0.2, 0);
  ctx.quadraticCurveTo(tailX - bodyRX * 0.55, bodyRY * 0.05, tailX - bodyRX * 1.05, bodyRY * 0.15);
  ctx.quadraticCurveTo(tailX - bodyRX * 0.55, bodyRY * 0.35, tailX, 0);
  ctx.closePath();
  ctx.fillStyle = colorDark;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-bodyRX * 0.35, -bodyRY * 0.75);
  ctx.lineTo(-bodyRX * 0.22, -bodyRY * 1.25);
  ctx.lineTo(-bodyRX * 0.05, -bodyRY * 0.7);
  ctx.closePath();
  ctx.fillStyle = colorDark;
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(bodyRX * 0.15, bodyRY * 0.75, bodyRX * 0.32, bodyRY * 0.42, 0.5, 0, Math.PI * 2);
  ctx.fillStyle = colorDark;
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(bodyRX * 0.55, -bodyRY * 0.85, bodyRX * 0.05, bodyRY * 0.12, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(bodyRX * 0.68, -bodyRY * 0.1, Math.max(1.3, bodyRX * 0.07), 0, Math.PI * 2);
  ctx.fillStyle = "#14171b";
  ctx.fill();
}

// Mondfisch-Silhouette: scheibenförmiger Körper, riesige gespiegelte
// Rücken-/Afterflosse, Stummelschwanz (Clavus) statt echter Schwanzflosse.
function drawDiscShape(scale, color, colorDark) {
  const r = canvas.width * 0.024 * scale;

  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.1, r * 1.35, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-r * 0.15, -r * 1.2);
  ctx.lineTo(r * 0.05, -r * 2.6);
  ctx.lineTo(r * 0.35, -r * 1.1);
  ctx.closePath();
  ctx.fillStyle = colorDark;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-r * 0.15, r * 1.2);
  ctx.lineTo(r * 0.05, r * 2.6);
  ctx.lineTo(r * 0.35, r * 1.1);
  ctx.closePath();
  ctx.fillStyle = colorDark;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-r * 1.05, -r * 0.5);
  ctx.quadraticCurveTo(-r * 1.35, 0, -r * 1.05, r * 0.5);
  ctx.quadraticCurveTo(-r * 1.15, 0, -r * 1.05, -r * 0.5);
  ctx.closePath();
  ctx.fillStyle = colorDark;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(r * 0.95, 0, Math.max(1, r * 0.08), 0, Math.PI * 2);
  ctx.fillStyle = colorDark;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(r * 0.55, -r * 0.25, Math.max(1.4, r * 0.13), 0, Math.PI * 2);
  ctx.fillStyle = "#f4f6f8";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.57, -r * 0.25, Math.max(0.8, r * 0.07), 0, Math.PI * 2);
  ctx.fillStyle = "#14171b";
  ctx.fill();
}

// Kopffüßer-Silhouette: Mantel + große Augen + mehrere geschwungene
// Tentakel. Mit menacing=true (Kraken) größer, mehr Tentakel, Saugnäpfe,
// gezackter Mantel und rot glühende Augen statt normaler Tintenfisch-Optik.
function drawCephalopodShape(scale, color, colorDark, menacing) {
  const r = canvas.width * (menacing ? 0.026 : 0.02) * scale;
  const tentacleCount = menacing ? 7 : 5;

  for (let i = 0; i < tentacleCount; i++) {
    const t = i / (tentacleCount - 1);
    const startAngle = -0.9 + t * 1.8;
    const startX = Math.sin(startAngle) * r * 0.6;
    const startY = r * 0.7;
    const length = r * (menacing ? 3.2 : 2.4) * (0.8 + 0.4 * Math.sin(i * 1.7));
    const curl = (i % 2 === 0 ? 1 : -1) * r * 0.6;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(startX + curl, startY + length * 0.55, startX + curl * 0.3, startY + length);
    ctx.lineWidth = Math.max(1.5, r * (menacing ? 0.22 : 0.16) * (1 - t * 0.3));
    ctx.strokeStyle = colorDark;
    ctx.lineCap = "round";
    ctx.stroke();

    if (menacing) {
      for (let s = 0.35; s < 1; s += 0.22) {
        const sx = startX + curl * 0.3 * s;
        const sy = startY + length * s;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(1, r * 0.05), 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fill();
      }
    }
  }

  const backReach = menacing ? 1.3 : 0.85;
  ctx.beginPath();
  ctx.moveTo(r * 0.2, -r * 1.1);
  ctx.quadraticCurveTo(r * 1.15, -r * 0.9, r * 1.05, 0);
  ctx.quadraticCurveTo(r * 1.15, r * 0.9, r * 0.2, r * 1.1);
  ctx.quadraticCurveTo(-r * (backReach * 0.75), r * 0.6, -r * backReach, 0);
  ctx.quadraticCurveTo(-r * (backReach * 0.75), -r * 0.6, r * 0.2, -r * 1.1);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  if (menacing) {
    for (let i = 0; i < 5; i++) {
      const a = -0.9 + (i / 4) * 1.8;
      const bx = Math.cos(a) * r * 1.0;
      const by = Math.sin(a) * r * 0.85 - r * 0.3;
      ctx.beginPath();
      ctx.moveTo(bx * 0.7, by * 0.7 - r * 0.2);
      ctx.lineTo(bx, by - r * 0.55);
      ctx.lineTo(bx * 0.75 + r * 0.15, by * 0.7);
      ctx.closePath();
      ctx.fillStyle = colorDark;
      ctx.fill();
    }
  }

  const eyeColor = menacing ? "#ff5a5a" : "#f4f6f8";
  ctx.beginPath();
  ctx.arc(r * 0.35, -r * 0.15, Math.max(1.6, r * 0.28), 0, Math.PI * 2);
  ctx.fillStyle = eyeColor;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.4, -r * 0.15, Math.max(1, r * 0.14), 0, Math.PI * 2);
  ctx.fillStyle = "#14171b";
  ctx.fill();
}

function drawCreature(species, scale, color, colorDark) {
  switch (species.shape) {
    case "serpent": drawSeaDragon(scale, color, colorDark); break;
    case "shark": drawSharkShape(scale, color, colorDark); break;
    case "tuna": drawTunaShape(scale, color, colorDark); break;
    case "billfish": drawBillfishShape(scale, color, colorDark); break;
    case "whale": drawWhaleShape(scale, color, colorDark); break;
    case "disc": drawDiscShape(scale, color, colorDark); break;
    case "cephalopod": drawCephalopodShape(scale, color, colorDark, false); break;
    case "kraken": drawCephalopodShape(scale, color, colorDark, true); break;
    default: drawFishShape(scale, color, colorDark);
  }
}

function drawStar(cx, cy, r, alpha) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = `rgba(255,244,200,${alpha})`;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.28, -r * 0.28);
  ctx.lineTo(r, 0);
  ctx.lineTo(r * 0.28, r * 0.28);
  ctx.lineTo(0, r);
  ctx.lineTo(-r * 0.28, r * 0.28);
  ctx.lineTo(-r, 0);
  ctx.lineTo(-r * 0.28, -r * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSparkles(x, y, radius, now) {
  const count = 4;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + now / 900;
    const dist = radius * (1.3 + 0.2 * Math.sin(now / 260 + i));
    const px = x + Math.cos(angle) * dist;
    const py = y + Math.sin(angle) * dist * 0.6;
    const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(now / 220 + i * 1.7));
    drawStar(px, py, radius * 0.16, twinkle);
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Kleiner "Überschwing" am Ende des Wurfs, damit die Rute spürbar
// nach vorn schnalzt statt einfach sanft anzuhalten.
function easeOutBack(t) {
  const c1 = 1.4, c3 = c1 + 1;
  const p = t - 1;
  return 1 + c3 * p * p * p + c1 * p * p;
}

// Zeichnet einen Arm/ein Bein als zwei Segmente (Ober-/Unterschenkel bzw.
// Ober-/Unterarm) mit leicht ausgebeultem "Ellbogen"/"Knie", statt einer
// stocksteifen geraden Linie.
function drawLimb(shoulderX, shoulderY, handX, handY, bend, width, color) {
  const dx = handX - shoulderX, dy = handY - shoulderY;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const midX = (shoulderX + handX) / 2 + nx * bend;
  const midY = (shoulderY + handY) / 2 + ny * bend;

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(midX, midY);
  ctx.lineTo(handX, handY);
  ctx.stroke();
}

function drawAngler(now, fallProgress, holdInfo) {
  const hand = anglerHandPos();
  const bodyX = hand.x - 14;
  const shoulderY = hand.y - 4;
  const bodyH = canvas.height * 0.16;
  const torsoH = bodyH * 0.52;
  const hipY = shoulderY + torsoH;
  const feetY = hipY + bodyH * 0.48;
  const headR = canvas.height * 0.024;
  const limbW = Math.max(2.5, canvas.width * 0.0055);
  const suitColor = "#5b6b7a";
  const suitDark = "#455460";

  ctx.save();
  if (fallProgress > 0) {
    // Charakter kippt ins Wasser
    const dropX = fallProgress * canvas.width * 0.05;
    const dropY = fallProgress * canvas.height * 0.12;
    const rotate = fallProgress * 0.9;
    ctx.translate(bodyX + dropX, shoulderY + (feetY - shoulderY) * 0.5 + dropY);
    ctx.rotate(rotate);
    ctx.translate(-bodyX, -(shoulderY + (feetY - shoulderY) * 0.5));
  }

  const bob = holdInfo ? Math.sin(holdInfo.progress * Math.PI * 3) * canvas.height * 0.004 : 0;
  const isCastAnim = gameState === "casting" && now - castAnimStart < CAST_ANIM_DURATION * 1000;
  const isReeling = gameState === "biting";

  // -- Zustandsabhängiger Ausdruck & leichte Körperhaltung --
  let expression = "neutral";
  let headTilt = 0;
  let leanX = 0;
  let stance = canvas.width * 0.009; // Standbreite der Beine
  if (fallProgress > 0) {
    expression = "shock";
  } else if (holdInfo) {
    expression = "happy";
    headTilt = Math.sin(holdInfo.progress * Math.PI * 3) * 0.06;
  } else if (isReeling) {
    expression = "strain";
    const tugElapsed = (now - lastTugTime) / 1000;
    const tug = Math.exp(-tugElapsed * 6) * canvas.height * 0.02;
    leanX = -tug * 0.6;
    headTilt = Math.sin(now / 240) * 0.045;
    stance *= 1.25; // breiterer Stand beim Drillen
  } else if (isCastAnim) {
    headTilt = Math.sin((now - castAnimStart) / 90) * 0.03;
  }

  // -- Beine & Füße --
  ctx.strokeStyle = suitDark;
  ctx.lineWidth = limbW * 1.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(bodyX - stance + leanX * 0.3, hipY);
  ctx.lineTo(bodyX - stance - stance * 0.15, feetY);
  ctx.moveTo(bodyX + stance + leanX * 0.3, hipY);
  ctx.lineTo(bodyX + stance + stance * 0.15, feetY);
  ctx.stroke();

  ctx.fillStyle = "#20262c";
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.ellipse(
      bodyX + side * (stance + stance * 0.15) + canvas.width * 0.008, feetY,
      canvas.width * 0.012, canvas.height * 0.006, 0, 0, Math.PI * 2
    );
    ctx.fill();
  });

  // -- Torso (mit leichtem Lehnen beim Drillen) --
  ctx.save();
  ctx.translate(leanX, 0);
  ctx.fillStyle = suitColor;
  ctx.beginPath();
  ctx.moveTo(bodyX - 10, shoulderY + 3);
  ctx.quadraticCurveTo(bodyX - 12, shoulderY, bodyX - 8, shoulderY - 2);
  ctx.lineTo(bodyX + 8, shoulderY - 2);
  ctx.quadraticCurveTo(bodyX + 12, shoulderY, bodyX + 10, shoulderY + 3);
  ctx.lineTo(bodyX + 9, hipY);
  ctx.lineTo(bodyX - 9, hipY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // -- Arme --
  const shoulderL = { x: bodyX - 8 + leanX, y: shoulderY + 2 };
  const shoulderR = { x: bodyX + 8 + leanX, y: shoulderY + 2 };

  if (holdInfo) {
    // Beide Arme hoch, Fisch wird über dem Kopf präsentiert
    const holdHandY = shoulderY - headR * 2.3 + bob;
    drawLimb(shoulderL.x, shoulderL.y, bodyX - headR * 1.2, holdHandY, -4, limbW, suitColor);
    drawLimb(shoulderR.x, shoulderR.y, bodyX + headR * 1.2, holdHandY, 4, limbW, suitColor);
  } else if (isCastAnim) {
    // Ausholen (erste 40%) dann Wurf nach vorn (letzte 60%, mit leichtem Überschwung)
    const p = Math.min(1, (now - castAnimStart) / (CAST_ANIM_DURATION * 1000));
    const windBack = { x: bodyX + canvas.width * 0.026, y: shoulderY - canvas.height * 0.065 };
    let rodHandX, rodHandY;
    if (p < 0.4) {
      const wp = 1 - Math.pow(1 - p / 0.4, 2);
      rodHandX = lerp(hand.x, windBack.x, wp);
      rodHandY = lerp(hand.y, windBack.y, wp);
    } else {
      const tp = easeOutBack(Math.min(1, (p - 0.4) / 0.6));
      rodHandX = lerp(windBack.x, hand.x, tp);
      rodHandY = lerp(windBack.y, hand.y, tp);
    }
    drawLimb(shoulderR.x, shoulderR.y, rodHandX, rodHandY, 6, limbW, suitColor);
    drawLimb(shoulderL.x, shoulderL.y, bodyX - 15 + leanX, hipY - torsoH * 0.15, -3, limbW, suitColor);

    // Rute in der ausholenden Hand, damit sie während der Animation nicht "leer" wirkt
    const rodVisual = ROD_VISUALS[equippedRod];
    ctx.strokeStyle = rodVisual.color;
    ctx.lineWidth = Math.max(2, canvas.width * 0.003);
    ctx.beginPath();
    ctx.moveTo(rodHandX - (rodHandX - shoulderR.x) * 0.3, rodHandY - (rodHandY - shoulderR.y) * 0.3);
    ctx.lineTo(rodHandX + (rodHandX - windBack.x) * 0.8, rodHandY + (rodHandY - windBack.y) * 0.8);
    ctx.stroke();
  } else if (isReeling) {
    // Kurbelnde Drill-Bewegung: beide Hände nah an der Rolle, gegenläufig
    const crank = Math.sin(now / 210) * canvas.height * 0.008;
    const tugElapsed = (now - lastTugTime) / 1000;
    const tug = Math.exp(-tugElapsed * 6) * canvas.height * 0.018;
    drawLimb(shoulderR.x, shoulderR.y, hand.x + leanX * 0.4, hand.y + crank - tug, 5, limbW, suitColor);
    drawLimb(shoulderL.x, shoulderL.y, hand.x - canvas.width * 0.012 + leanX * 0.4, hand.y - crank - tug * 0.6, -5, limbW, suitColor);
  } else {
    // Ruhehaltung: Rutenhand hält die Rute, der andere Arm hängt entspannt
    drawLimb(shoulderR.x, shoulderR.y, hand.x, hand.y, 5, limbW, suitColor);
    drawLimb(shoulderL.x, shoulderL.y, bodyX - 14 + leanX, hipY - torsoH * 0.1, -3, limbW, suitColor);
  }

  // -- Kopf --
  const headCy = shoulderY - headR * 1.2 + leanX * 0;
  drawHead(ctx, bodyX + leanX, headCy, headR, selectedCharacter || "bald", headTilt, expression);

  if (holdInfo) {
    const fishY = shoulderY - headR * 2.6 - canvas.height * 0.02 + bob;
    const visual = fishVisual(holdInfo.species, holdInfo.mutation);
    // Seedrache und Kraken dürfen richtig groß bleiben; alle anderen
    // werden gedeckelt, damit sie über dem Kopf nicht den ganzen
    // Bildschirm füllen.
    const uncapped = holdInfo.species.shape === "serpent" || holdInfo.species.shape === "kraken";
    const heldScale = uncapped ? visual.scale : Math.min(visual.scale, 2.2);
    ctx.save();
    ctx.translate(bodyX, fishY);
    drawCreature(holdInfo.species, heldScale, visual.color, visual.colorDark);
    ctx.restore();
    if (visual.sparkle) {
      drawSparkles(bodyX, fishY, canvas.width * 0.03 * heldScale, now);
    }
  }

  ctx.restore();
}

function drawRodAndBobber(now) {
  const hand = anglerHandPos();
  const rest = bobberRestPos();

  let bx = rest.x;
  let by = rest.y;

  const isCastAnim = gameState === "casting" && now - castAnimStart < CAST_ANIM_DURATION * 1000;
  if (isCastAnim) {
    return; // Rute+Schwimmer erscheinen erst, sobald der Wurf abgeschlossen ist (siehe drawAngler)
  } else if (gameState === "casting") {
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

  // Angel (Rute) – Farbe/Deko je nach ausgerüsteter Angel
  const rodVisual = ROD_VISUALS[equippedRod];
  const rodBaseX = hand.x - canvas.width * 0.03;
  const rodBaseY = hand.y + canvas.height * 0.05;
  ctx.strokeStyle = rodVisual.color;
  ctx.lineWidth = Math.max(2, canvas.width * 0.003);
  ctx.beginPath();
  ctx.moveTo(rodBaseX, rodBaseY);
  ctx.lineTo(hand.x, hand.y);
  ctx.stroke();

  if (rodVisual.style === "shine") {
    ctx.fillStyle = rodVisual.accent;
    ctx.beginPath();
    ctx.arc(hand.x - (hand.x - rodBaseX) * 0.4, hand.y - (hand.y - rodBaseY) * 0.4, Math.max(1.5, canvas.width * 0.0035), 0, Math.PI * 2);
    ctx.fill();
  } else if (rodVisual.style === "sparkle") {
    drawSparkles(hand.x - (hand.x - rodBaseX) * 0.5, hand.y - (hand.y - rodBaseY) * 0.5, canvas.width * 0.012, now);
  } else if (rodVisual.style === "flame") {
    for (let i = 1; i <= 2; i++) {
      const fx = rodBaseX + (hand.x - rodBaseX) * (i / 3);
      const fy = rodBaseY + (hand.y - rodBaseY) * (i / 3);
      ctx.fillStyle = rodVisual.accent;
      ctx.beginPath();
      ctx.arc(fx, fy, Math.max(1.5, canvas.width * 0.0035), 0, Math.PI * 2);
      ctx.fill();
    }
  }

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

function drawFishJump(progress, species, mutation, now) {
  const rest = bobberRestPos();
  const jumpHeight = canvas.height * 0.14;
  const arc = Math.sin(Math.min(1, progress) * Math.PI);
  const x = rest.x + canvas.width * 0.04;
  const y = rest.y - arc * jumpHeight;
  const visual = fishVisual(species, mutation);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.3 + arc * 0.5);
  drawCreature(species, visual.scale, visual.color, visual.colorDark);
  ctx.restore();

  if (visual.sparkle) {
    drawSparkles(x, y, canvas.width * 0.03 * visual.scale, now);
  }

  drawSplash(rest.x, rest.y, Math.min(1, progress * 1.4));
}

function render(now) {
  drawScene(now);

  let fallProgress = 0;
  let holdInfo = null;
  let jumpInfo = null;

  if (animState && animState.type === "failure") {
    fallProgress = Math.min(1, (now - animState.start) / 1000 / FAIL_ANIM_DURATION);
  } else if (animState && animState.type === "success") {
    const elapsed = (now - animState.start) / 1000;
    if (elapsed < SUCCESS_JUMP_DURATION) {
      jumpInfo = { progress: elapsed / SUCCESS_JUMP_DURATION, species: animState.species, mutation: animState.mutation };
    } else {
      const holdProgress = Math.min(1, (elapsed - SUCCESS_JUMP_DURATION) / SUCCESS_HOLD_DURATION);
      holdInfo = { progress: holdProgress, species: animState.species, mutation: animState.mutation };
    }
  }

  drawAngler(now, fallProgress, holdInfo);
  drawRodAndBobber(now);

  if (jumpInfo) {
    drawFishJump(jumpInfo.progress, jumpInfo.species, jumpInfo.mutation, now);
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

  maybeRevealOutcome(now);
  render(now);

  if (gameState !== "idle") {
    requestAnimationFrame(loop);
  }
}
