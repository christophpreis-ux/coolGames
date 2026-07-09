"use strict";

/* =========================================================================
   Voltgarage
   Ein Sammelkarten-Rennspiel: Booster öffnen (wie bei Sammelkarten), damit
   Elektro-Rennwagen und Fähigkeitskarten sammeln, gegen Gegner antreten.
   Verlierst du ein Rennen, gehört dein eingesetztes Auto danach dem Gegner
   – deshalb muss man riskante Angebote auch mal ablehnen können.
   ========================================================================= */

const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"];
const RARITY_LABEL = {
  common: "Gewöhnlich", uncommon: "Ungewöhnlich", rare: "Selten",
  epic: "Episch", legendary: "Legendär",
};

const PACK_PRICE = 150;
const PACK_SIZE = 5;
const STARTING_CREDITS = 300;

// Wahrscheinlichkeiten (%) je Seltenheit für einen Booster-Zug.
const PACK_ODDS = { common: 50, uncommon: 28, rare: 14, epic: 6, legendary: 2 };
// Gegner-Autos sind im Schnitt etwas herausfordernder verteilt als Booster.
const OPPONENT_ODDS = { common: 35, uncommon: 30, rare: 20, epic: 10, legendary: 5 };

const REWARD_BY_RARITY = { common: 20, uncommon: 40, rare: 70, epic: 120, legendary: 200 };
const BASE_STEAL_CHANCE = 0.08;

// ---------------------------------------------------------------------
// 50 Autos, 10 pro Seltenheitsstufe. Jedes mit Speed/Beschleunigung/
// Handling (1-100) sowie Körperfarbe + Akzentfarbe fürs Icon.
// ---------------------------------------------------------------------
const CARS = [
  // Gewöhnlich
  { id: "schrotthaufen", name: "Schrotthaufen", rarity: "common", speed: 22, accel: 18, handling: 25, color: "#8a7a6a", accent: "#5a4a3a" },
  { id: "zitronenflitzer", name: "Zitronenflitzer", rarity: "common", speed: 25, accel: 30, handling: 20, color: "#d4c93a", accent: "#a89a1f" },
  { id: "blechbuechse", name: "Blechbüchse", rarity: "common", speed: 20, accel: 22, handling: 30, color: "#9aa0a6", accent: "#6b7278" },
  { id: "wackeldackel_e", name: "Wackeldackel-E", rarity: "common", speed: 28, accel: 20, handling: 24, color: "#c48a5a", accent: "#8f5f38" },
  { id: "sparmobil", name: "Sparmobil", rarity: "common", speed: 24, accel: 26, handling: 22, color: "#7fae6a", accent: "#557a45" },
  { id: "rentnerflitzer", name: "Rentnerflitzer", rarity: "common", speed: 20, accel: 18, handling: 35, color: "#6a8ab0", accent: "#45607f" },
  { id: "uraltstromer", name: "Uralt-Stromer", rarity: "common", speed: 26, accel: 24, handling: 20, color: "#a0785a", accent: "#6f5038" },
  { id: "waermflasche_e", name: "Wärmflasche-E", rarity: "common", speed: 22, accel: 28, handling: 24, color: "#d47a7a", accent: "#a04f4f" },
  { id: "milchkaennchen", name: "Milchkännchen", rarity: "common", speed: 25, accel: 22, handling: 28, color: "#e8e4d8", accent: "#b8b2a0" },
  { id: "gartenzwerg_gt", name: "Gartenzwerg GT", rarity: "common", speed: 30, accel: 24, handling: 22, color: "#6aa06a", accent: "#427a42" },

  // Ungewöhnlich
  { id: "stadtblitz", name: "Stadtblitz", rarity: "uncommon", speed: 45, accel: 40, handling: 38, color: "#3f8fd4", accent: "#2a5f8f" },
  { id: "pendlerpfeil", name: "Pendlerpfeil", rarity: "uncommon", speed: 42, accel: 44, handling: 36, color: "#d48a3f", accent: "#a05f2a" },
  { id: "kompaktvolt", name: "Kompaktvolt", rarity: "uncommon", speed: 38, accel: 42, handling: 44, color: "#4fae8a", accent: "#337a5c" },
  { id: "silberstreif", name: "Silberstreif", rarity: "uncommon", speed: 46, accel: 38, handling: 40, color: "#b8bcc0", accent: "#888c90" },
  { id: "alltagsrakete", name: "Alltagsrakete", rarity: "uncommon", speed: 48, accel: 45, handling: 35, color: "#d43f5a", accent: "#a02a40" },
  { id: "blauer_blitz", name: "Blauer Blitz", rarity: "uncommon", speed: 44, accel: 48, handling: 38, color: "#3f5ad4", accent: "#2a3ea0" },
  { id: "stromlinie_s1", name: "Stromlinie S1", rarity: "uncommon", speed: 40, accel: 46, handling: 42, color: "#5ad4c0", accent: "#3aa08f" },
  { id: "nachbarschaftsrakete", name: "Nachbarschaftsrakete", rarity: "uncommon", speed: 47, accel: 42, handling: 40, color: "#d4a03f", accent: "#a0752a" },
  { id: "bueroschtuhl_gt", name: "Bürostuhl GT", rarity: "uncommon", speed: 36, accel: 40, handling: 48, color: "#8a6ad4", accent: "#5f47a0" },
  { id: "vorstadtpanther", name: "Vorstadtpanther", rarity: "uncommon", speed: 50, accel: 44, handling: 38, color: "#333a45", accent: "#1c2028" },

  // Selten
  { id: "sturmvogel", name: "Sturmvogel", rarity: "rare", speed: 62, accel: 58, handling: 55, color: "#4fc4e0", accent: "#2f8fa8" },
  { id: "plasmaflitzer", name: "Plasmaflitzer", rarity: "rare", speed: 58, accel: 64, handling: 52, color: "#d43fc4", accent: "#a02a94" },
  { id: "kobalt_gt", name: "Kobalt GT", rarity: "rare", speed: 60, accel: 55, handling: 60, color: "#2a4faf", accent: "#1c3578" },
  { id: "turbovolt_x", name: "Turbovolt X", rarity: "rare", speed: 68, accel: 60, handling: 50, color: "#e0603f", accent: "#a83f28" },
  { id: "nachtschatten", name: "Nachtschatten", rarity: "rare", speed: 55, accel: 58, handling: 64, color: "#232833", accent: "#14171d" },
  { id: "silberpfeil_e", name: "Silberpfeil-E", rarity: "rare", speed: 64, accel: 56, handling: 58, color: "#c8ccd4", accent: "#9a9ea8" },
  { id: "windschnitt", name: "Windschnitt", rarity: "rare", speed: 58, accel: 62, handling: 56, color: "#5ae0a0", accent: "#38a878" },
  { id: "funkenflug", name: "Funkenflug", rarity: "rare", speed: 60, accel: 66, handling: 52, color: "#e0d43f", accent: "#a89f2a" },
  { id: "amperecoupe", name: "Ampere-Coupé", rarity: "rare", speed: 56, accel: 60, handling: 62, color: "#3fa0e0", accent: "#2a72a8" },
  { id: "blitzrochen", name: "Blitzrochen", rarity: "rare", speed: 66, accel: 58, handling: 54, color: "#7a3fe0", accent: "#5228a8" },

  // Episch
  { id: "photon_gt", name: "Photon-GT", rarity: "epic", speed: 78, accel: 72, handling: 68, color: "#f4f6f8", accent: "#bfe9ff" },
  { id: "quantensprung", name: "Quantensprung", rarity: "epic", speed: 74, accel: 80, handling: 66, color: "#7a3fd4", accent: "#52299e" },
  { id: "voltano", name: "Voltano", rarity: "epic", speed: 80, accel: 68, handling: 70, color: "#e0603f", accent: "#a8402a" },
  { id: "neonstuermer", name: "Neonstürmer", rarity: "epic", speed: 72, accel: 76, handling: 72, color: "#3fe0d4", accent: "#2aa89e" },
  { id: "titanblitz", name: "Titanblitz", rarity: "epic", speed: 82, accel: 70, handling: 64, color: "#8a94a0", accent: "#5f6874" },
  { id: "ionentiger", name: "Ionentiger", rarity: "epic", speed: 76, accel: 74, handling: 74, color: "#e0a03f", accent: "#a8752a" },
  { id: "plasmapanther", name: "Plasmapanther", rarity: "epic", speed: 70, accel: 78, handling: 72, color: "#d43f8a", accent: "#a02a63" },
  { id: "hyperdrift", name: "Hyperdrift", rarity: "epic", speed: 84, accel: 66, handling: 68, color: "#3f5ae0", accent: "#2a3ea8" },
  { id: "schockwelle", name: "Schockwelle", rarity: "epic", speed: 74, accel: 82, handling: 64, color: "#e0e03f", accent: "#a8a82a" },
  { id: "prisma_x", name: "Prisma-X", rarity: "epic", speed: 78, accel: 74, handling: 76, color: "#60e03f", accent: "#45a82a" },

  // Legendär
  { id: "quantenblitz", name: "Quantenblitz", rarity: "legendary", speed: 92, accel: 88, handling: 84, color: "#7fd4ff", accent: "#4fa0d4" },
  { id: "photon_supreme", name: "Photon-Supreme", rarity: "legendary", speed: 96, accel: 84, handling: 86, color: "#ffffff", accent: "#d4d8e0" },
  { id: "ewigkeitsmotor", name: "Ewigkeitsmotor", rarity: "legendary", speed: 88, accel: 90, handling: 88, color: "#d4af37", accent: "#a0801f" },
  { id: "singularitaet_x", name: "Singularität-X", rarity: "legendary", speed: 94, accel: 92, handling: 80, color: "#232840", accent: "#7a5aff" },
  { id: "sternenstaub_gt", name: "Sternenstaub-GT", rarity: "legendary", speed: 90, accel: 86, handling: 90, color: "#c8a0ff", accent: "#9060d4" },
  { id: "voltgott", name: "Voltgott", rarity: "legendary", speed: 98, accel: 90, handling: 84, color: "#3ff0ff", accent: "#1fb8c8" },
  { id: "zeitraffer_e", name: "Zeitraffer-E", rarity: "legendary", speed: 86, accel: 94, handling: 88, color: "#ff6a3c", accent: "#c8401a" },
  { id: "unendlichkeitsantrieb", name: "Unendlichkeitsantrieb", rarity: "legendary", speed: 92, accel: 88, handling: 92, color: "#60ffb0", accent: "#2acf80" },
  { id: "kosmosracer", name: "Kosmos-Racer", rarity: "legendary", speed: 90, accel: 92, handling: 90, color: "#7a5aff", accent: "#4f30d4" },
  { id: "apex_volt", name: "Apex Volt", rarity: "legendary", speed: 100, accel: 96, handling: 94, color: "#ffd43f", accent: "#d4a01f" },
];

// Der Startwagen: extra schlecht, nicht Teil des 50er-Booster-Pools.
const STARTER_CAR = {
  id: "rostlaube", name: "Rostlaube", rarity: "common", starter: true,
  speed: 12, accel: 10, handling: 14, color: "#7a6a5a", accent: "#4a3f30",
};

const CAR_BY_ID = {};
for (const c of CARS) CAR_BY_ID[c.id] = c;
CAR_BY_ID[STARTER_CAR.id] = STARTER_CAR;

// ---------------------------------------------------------------------
// 50 Fähigkeitskarten, 10 pro Seltenheitsstufe. Werden beim Renneinsatz
// verbraucht (einmalig). "effects" wird in resolveRace() ausgewertet.
// ---------------------------------------------------------------------
const ABILITIES = [
  // Gewöhnlich
  { id: "turbo1", name: "Turbo-Kick I", rarity: "common", desc: "+10% Tempo", effects: { speedBoost: 0.10 } },
  { id: "grip1", name: "Grip-Boost I", rarity: "common", desc: "+10% Handling", effects: { handlingBoost: 0.10 } },
  { id: "sprint1", name: "Sprint-Boost I", rarity: "common", desc: "+10% Beschleunigung", effects: { accelBoost: 0.10 } },
  { id: "sand1", name: "Sand im Getriebe I", rarity: "common", desc: "Gegner −8% Tempo", effects: { oppSpeedDebuff: 0.08 } },
  { id: "bremsstaub1", name: "Bremsstaub I", rarity: "common", desc: "Gegner −8% Handling", effects: { oppHandlingDebuff: 0.08 } },
  { id: "verzoegerung1", name: "Verzögerung I", rarity: "common", desc: "Gegner −8% Beschleunigung", effects: { oppAccelDebuff: 0.08 } },
  { id: "gluecksbringer1", name: "Glücksbringer I", rarity: "common", desc: "Etwas weniger Pech im Rennwurf", effects: { luckFloor: 0.95 } },
  { id: "trinkgeld", name: "Trinkgeld", rarity: "common", desc: "+20% Belohnung bei Sieg", effects: { rewardMult: 1.20 } },
  { id: "rostschutz", name: "Rostschutz", rarity: "common", desc: "20% Chance, Auto bei Niederlage zu behalten", effects: { keepCarChance: 0.20 } },
  { id: "ersatzteil", name: "Ersatzteil", rarity: "common", desc: "Bei Niederlage kleine Credit-Rückerstattung", effects: { refundOnLoss: 15 } },

  // Ungewöhnlich
  { id: "turbo2", name: "Turbo-Kick II", rarity: "uncommon", desc: "+18% Tempo", effects: { speedBoost: 0.18 } },
  { id: "grip2", name: "Grip-Boost II", rarity: "uncommon", desc: "+18% Handling", effects: { handlingBoost: 0.18 } },
  { id: "sprint2", name: "Sprint-Boost II", rarity: "uncommon", desc: "+18% Beschleunigung", effects: { accelBoost: 0.18 } },
  { id: "sabotage1", name: "Sabotage I", rarity: "uncommon", desc: "Gegner −15% Tempo", effects: { oppSpeedDebuff: 0.15 } },
  { id: "stottermotor", name: "Stotter-Motor", rarity: "uncommon", desc: "Gegner −15% Beschleunigung", effects: { oppAccelDebuff: 0.15 } },
  { id: "glatte_reifen", name: "Glatte Reifen", rarity: "uncommon", desc: "Gegner −15% Handling", effects: { oppHandlingDebuff: 0.15 } },
  { id: "gluecksbringer2", name: "Glücksbringer II", rarity: "uncommon", desc: "Deutlich weniger Pech im Rennwurf", effects: { luckFloor: 1.0 } },
  { id: "sponsorendeal", name: "Sponsoren-Deal", rarity: "uncommon", desc: "+40% Belohnung bei Sieg", effects: { rewardMult: 1.40 } },
  { id: "ersatzwagen", name: "Ersatzwagen", rarity: "uncommon", desc: "35% Chance, Auto bei Niederlage zu behalten", effects: { keepCarChance: 0.35 } },
  { id: "diebstahlsicherung", name: "Diebstahlsicherung", rarity: "uncommon", desc: "+15% Chance auf Gegner-Auto bei Sieg", effects: { stealChanceBonus: 0.15 } },

  // Selten
  { id: "nitro1", name: "Nitro-Schub I", rarity: "rare", desc: "+28% Tempo", effects: { speedBoost: 0.28 } },
  { id: "praezision1", name: "Präzisionslenkung I", rarity: "rare", desc: "+28% Handling", effects: { handlingBoost: 0.28 } },
  { id: "launchcontrol1", name: "Launch-Control I", rarity: "rare", desc: "+28% Beschleunigung", effects: { accelBoost: 0.28 } },
  { id: "sabotage2", name: "Sabotage II", rarity: "rare", desc: "Gegner −22% Tempo", effects: { oppSpeedDebuff: 0.22 } },
  { id: "getriebeschaden", name: "Getriebeschaden", rarity: "rare", desc: "Gegner −22% Beschleunigung", effects: { oppAccelDebuff: 0.22 } },
  { id: "oelspur", name: "Ölspur", rarity: "rare", desc: "Gegner −22% Handling", effects: { oppHandlingDebuff: 0.22 } },
  { id: "allesysteme1", name: "Alle Systeme I", rarity: "rare", desc: "+12% auf alle eigenen Werte", effects: { allBoost: 0.12 } },
  { id: "jackpot", name: "Jackpot", rarity: "rare", desc: "+70% Belohnung bei Sieg", effects: { rewardMult: 1.70 } },
  { id: "vollkasko", name: "Vollkasko", rarity: "rare", desc: "50% Chance, Auto bei Niederlage zu behalten", effects: { keepCarChance: 0.50 } },
  { id: "kopfgeldjaeger1", name: "Kopfgeldjäger I", rarity: "rare", desc: "+30% Chance auf Gegner-Auto bei Sieg", effects: { stealChanceBonus: 0.30 } },

  // Episch
  { id: "nitro2", name: "Nitro-Schub II", rarity: "epic", desc: "+40% Tempo", effects: { speedBoost: 0.40 } },
  { id: "praezision2", name: "Präzisionslenkung II", rarity: "epic", desc: "+40% Handling", effects: { handlingBoost: 0.40 } },
  { id: "launchcontrol2", name: "Launch-Control II", rarity: "epic", desc: "+40% Beschleunigung", effects: { accelBoost: 0.40 } },
  { id: "systemausfall", name: "Systemausfall", rarity: "epic", desc: "Gegner −30% auf alle Werte", effects: { oppAllDebuff: 0.30 } },
  { id: "allesysteme2", name: "Alle Systeme II", rarity: "epic", desc: "+20% auf alle eigenen Werte", effects: { allBoost: 0.20 } },
  { id: "perfekterstart", name: "Perfekter Start", rarity: "epic", desc: "Garantiert kein negativer Zufallswert", effects: { luckFloor: 1.0, guaranteedNoBadRoll: true } },
  { id: "hauptgewinn", name: "Hauptgewinn", rarity: "epic", desc: "+120% Belohnung bei Sieg", effects: { rewardMult: 2.20 } },
  { id: "vollversicherung", name: "Vollversicherung", rarity: "epic", desc: "75% Chance, Auto bei Niederlage zu behalten", effects: { keepCarChance: 0.75 } },
  { id: "kopfgeldjaeger2", name: "Kopfgeldjäger II", rarity: "epic", desc: "+55% Chance auf Gegner-Auto bei Sieg", effects: { stealChanceBonus: 0.55 } },
  { id: "doppelzug", name: "Doppelzug", rarity: "epic", desc: "Nach dem Rennen: 100 Bonus-Credits", effects: { bonusCreditsAlways: 100 } },

  // Legendär
  { id: "quantensprung_a", name: "Quantensprung", rarity: "legendary", desc: "+55% auf alle eigenen Werte", effects: { allBoost: 0.55 } },
  { id: "totalschaden", name: "Totalschaden", rarity: "legendary", desc: "Gegner −45% auf alle Werte", effects: { oppAllDebuff: 0.45 } },
  { id: "unbesiegbar", name: "Unbesiegbar", rarity: "legendary", desc: "Auto ist bei Niederlage garantiert sicher", effects: { keepCarChance: 1.0 } },
  { id: "zeitmanipulation", name: "Zeitmanipulation", rarity: "legendary", desc: "Garantierter Sieg in diesem Rennen", effects: { guaranteedWin: true } },
  { id: "goldrausch", name: "Goldrausch", rarity: "legendary", desc: "+250% Belohnung bei Sieg", effects: { rewardMult: 3.50 } },
  { id: "autodieb", name: "Autodieb", rarity: "legendary", desc: "Garantiert Gegner-Auto bei Sieg", effects: { stealChanceBonus: 1.0 } },
  { id: "phoenix", name: "Phönix", rarity: "legendary", desc: "Auto sicher bei Niederlage + Trost-Credits", effects: { keepCarChance: 1.0, refundOnLoss: 60 } },
  { id: "systemkollaps", name: "Systemkollaps", rarity: "legendary", desc: "Gegner-Werte halbiert (−50%)", effects: { oppAllDebuff: 0.50 } },
  { id: "meisterstratege", name: "Meisterstratege", rarity: "legendary", desc: "+35% eigene Werte, Gegner −20%", effects: { allBoost: 0.35, oppAllDebuff: 0.20 } },
  { id: "singularitaet", name: "Singularität", rarity: "legendary", desc: "Garantierter Sieg + garantiertes Gegner-Auto", effects: { guaranteedWin: true, stealChanceBonus: 1.0 } },
];

const ABILITY_BY_ID = {};
for (const a of ABILITIES) ABILITY_BY_ID[a.id] = a;

function carsOfRarity(rarity) { return CARS.filter((c) => c.rarity === rarity); }
function abilitiesOfRarity(rarity) { return ABILITIES.filter((a) => a.rarity === rarity); }

function pickWeightedRarity(odds) {
  const total = Object.values(odds).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const rarity of RARITY_ORDER) {
    if (r < odds[rarity]) return rarity;
    r -= odds[rarity];
  }
  return RARITY_ORDER[0];
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------

let credits = STARTING_CREDITS;
let ownedCars = [STARTER_CAR.id];        // flat array von car-IDs, Duplikate erlaubt
let ownedAbilities = [];                  // flat array von ability-IDs, Duplikate erlaubt
let discoveredCars = new Set();
let discoveredAbilities = new Set();

let currentOffer = null;      // { car }
let raceSelection = { carId: null, abilityIds: [] };
let lastPackCards = [];

// ---------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------

const screens = {
  intro: document.getElementById("screen-intro"),
  hub: document.getElementById("screen-hub"),
};

const btnStart = document.getElementById("btn-start");
const hubCredits = document.getElementById("hub-credits");
const hubDex = document.getElementById("hub-dex");
const btnCollection = document.getElementById("btn-collection");
const btnReset = document.getElementById("btn-reset");
const btnOpenPack = document.getElementById("btn-open-pack");
const btnGetOffer = document.getElementById("btn-get-offer");
const garageGrid = document.getElementById("garage-grid");
const abilityInventoryEl = document.getElementById("ability-inventory");

const packModal = document.getElementById("pack-modal");
const btnPackClose = document.getElementById("btn-pack-close");
const packIntro = document.getElementById("pack-intro");
const packReveal = document.getElementById("pack-reveal");
const btnPackReveal = document.getElementById("btn-pack-reveal");
const packCardsEl = document.getElementById("pack-cards");
const btnPackDone = document.getElementById("btn-pack-done");

const challengeModal = document.getElementById("challenge-modal");
const btnChallengeClose = document.getElementById("btn-challenge-close");
const challengeHeading = document.getElementById("challenge-heading");
const phaseOffer = document.getElementById("phase-offer");
const offerOpponentCard = document.getElementById("offer-opponent-card");
const btnOfferReject = document.getElementById("btn-offer-reject");
const btnOfferAccept = document.getElementById("btn-offer-accept");
const phasePickCar = document.getElementById("phase-pick-car");
const pickCarGrid = document.getElementById("pick-car-grid");
const phasePickAbility = document.getElementById("phase-pick-ability");
const pickAbilityGrid = document.getElementById("pick-ability-grid");
const btnAbilityDone = document.getElementById("btn-ability-done");
const phaseRace = document.getElementById("phase-race");
const raceCanvas = document.getElementById("race-canvas");
const phaseResult = document.getElementById("phase-result");
const resultTitle = document.getElementById("result-title");
const resultDetails = document.getElementById("result-details");
const btnResultClose = document.getElementById("btn-result-close");

const collectionModal = document.getElementById("collection-modal");
const btnCollectionClose = document.getElementById("btn-collection-close");
const tabCars = document.getElementById("tab-cars");
const tabAbilities = document.getElementById("tab-abilities");
const collectionCarsEl = document.getElementById("collection-cars");
const collectionAbilitiesEl = document.getElementById("collection-abilities");

const resetModal = document.getElementById("reset-modal");
const btnResetClose = document.getElementById("btn-reset-close");
const btnResetCancel = document.getElementById("btn-reset-cancel");
const btnResetConfirm = document.getElementById("btn-reset-confirm");

function showScreen(name) {
  for (const key of Object.keys(screens)) {
    screens[key].classList.toggle("active", key === name);
  }
}

function openModal(modalEl) { modalEl.classList.remove("hidden"); }
function closeModal(modalEl) { modalEl.classList.add("hidden"); }

// ---------------------------------------------------------------------
// Karten-Rendering (Auto- & Fähigkeitskarten als HTML + Canvas-Icon)
// ---------------------------------------------------------------------

function statBarRow(label, value) {
  return `
    <div class="stat-bar-row">
      <span class="stat-bar-label">${label}</span>
      <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${value}%"></div></div>
    </div>
  `;
}

function carCardHTML(car, opts) {
  opts = opts || {};
  const iconId = `caricon-${car.id}-${Math.random().toString(36).slice(2, 8)}`;
  const countBadge = opts.count && opts.count > 1 ? `<div class="card-count-badge">×${opts.count}</div>` : "";
  const classes = ["game-card", `rarity-${car.rarity}`];
  if (opts.selectable) classes.push("selectable");
  if (opts.selected) classes.push("selected");
  if (opts.undiscovered) classes.push("card-undiscovered");
  return `
    <div class="${classes.join(" ")}" data-car-id="${car.id}">
      ${countBadge}
      <canvas class="car-icon" id="${iconId}" width="220" height="100" data-draw-car="${opts.undiscovered ? "" : car.id}"></canvas>
      <div class="card-name">${opts.undiscovered ? "???" : car.name}</div>
      <div class="card-rarity-tag">${RARITY_LABEL[car.rarity]}</div>
      ${opts.undiscovered ? "" : `
      <div class="stat-bars">
        ${statBarRow("T", car.speed)}
        ${statBarRow("B", car.accel)}
        ${statBarRow("H", car.handling)}
      </div>`}
    </div>
  `;
}

function abilityCardHTML(ability, opts) {
  opts = opts || {};
  const countBadge = opts.count && opts.count > 1 ? `<div class="card-count-badge">×${opts.count}</div>` : "";
  const classes = ["game-card", `rarity-${ability.rarity}`];
  if (opts.selectable) classes.push("selectable");
  if (opts.selected) classes.push("selected");
  if (opts.undiscovered) classes.push("card-undiscovered");
  return `
    <div class="${classes.join(" ")}" data-ability-id="${ability.id}">
      ${countBadge}
      <div class="card-name">${opts.undiscovered ? "???" : ability.name}</div>
      <div class="card-rarity-tag">${RARITY_LABEL[ability.rarity]}</div>
      ${opts.undiscovered ? "" : `<div class="card-desc">${ability.desc}</div>`}
    </div>
  `;
}

function drawAllPendingCarIcons(container) {
  container.querySelectorAll("canvas[data-draw-car]").forEach((c) => {
    const carId = c.dataset.drawCar;
    if (carId && CAR_BY_ID[carId]) drawCarIcon(c, CAR_BY_ID[carId]);
  });
}

// ---- Auto-Icons (Seitenansicht, je Seltenheit eine eigene Silhouette) ----
// Jedes Auto bekommt Verlaufsschattierung, Scheiben mit Reflexion,
// Scheinwerfer/Rücklichter, Spiegel und Felgen mit Speichen. Name-Zusätze
// wirken sich auf die Zeichnung aus ("GT" -> Heckspoiler, "-E" -> Ladeblitz),
// und ein deterministischer Hash der Auto-ID variiert Speichenzahl/Felgenstil
// leicht, damit nicht alle Autos einer Seltenheit wie Klone aussehen.

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function shadeColor(hex, amt) {
  const c = hex.replace("#", "");
  const full = c.length === 3 ? c.split("").map((ch) => ch + ch).join("") : c;
  const num = parseInt(full, 16);
  const mix = amt >= 0 ? 255 : 0;
  const k = Math.abs(amt);
  const r = Math.round(((num >> 16) & 0xff) + (mix - ((num >> 16) & 0xff)) * k);
  const g = Math.round(((num >> 8) & 0xff) + (mix - ((num >> 8) & 0xff)) * k);
  const b = Math.round((num & 0xff) + (mix - (num & 0xff)) * k);
  return `rgb(${r},${g},${b})`;
}

function bodyGradient(ctx, color, y0, y1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, shadeColor(color, 0.3));
  g.addColorStop(0.55, color);
  g.addColorStop(1, shadeColor(color, -0.25));
  return g;
}

function drawGroundShadow(ctx, w, h, gy, spread) {
  ctx.save();
  const grad = ctx.createRadialGradient(w * 0.5, gy, w * 0.05, w * 0.5, gy, w * (spread || 0.42));
  grad.addColorStop(0, "rgba(0,0,0,0.4)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(w * 0.5, gy + h * 0.02, w * (spread || 0.42), h * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWindowGlass(ctx, pts) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.clip();

  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const g = ctx.createLinearGradient(minX, minY, maxX, maxY);
  g.addColorStop(0, "rgba(150,190,215,0.6)");
  g.addColorStop(1, "rgba(28,42,58,0.8)");
  ctx.fillStyle = g;
  ctx.fillRect(minX, minY, maxX - minX, maxY - minY);

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.moveTo(minX + (maxX - minX) * 0.08, maxY);
  ctx.lineTo(minX + (maxX - minX) * 0.32, minY);
  ctx.lineTo(minX + (maxX - minX) * 0.48, minY);
  ctx.lineTo(minX + (maxX - minX) * 0.24, maxY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHeadlight(ctx, x, y, r, glow) {
  ctx.save();
  if (glow) { ctx.shadowColor = "#fff6c8"; ctx.shadowBlur = r * 2.4; }
  ctx.fillStyle = "#fff6c8";
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTaillight(ctx, x, y, r, glow) {
  ctx.save();
  if (glow) { ctx.shadowColor = "#ff4d4d"; ctx.shadowBlur = r * 2.2; }
  ctx.fillStyle = "#e0403f";
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMirror(ctx, x, y, s, accent) {
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(x, y, s, s * 0.6, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawSpoiler(ctx, x, gy, wingW, wingH, accent) {
  ctx.fillStyle = accent;
  ctx.fillRect(x, gy - wingH * 2.4, wingW * 0.12, wingH * 2.2);
  ctx.fillRect(x - wingW * 0.5, gy - wingH * 2.6, wingW, wingH * 0.4);
}

function drawChargeBolt(ctx, x, y, s, accent) {
  ctx.save();
  ctx.fillStyle = accent;
  ctx.shadowColor = accent;
  ctx.shadowBlur = s * 1.4;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.35, y - s);
  ctx.lineTo(x - s * 0.3, y + s * 0.15);
  ctx.lineTo(x + s * 0.05, y + s * 0.15);
  ctx.lineTo(x - s * 0.35, y + s);
  ctx.lineTo(x + s * 0.35, y - s * 0.1);
  ctx.lineTo(x, y - s * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawWheel(ctx, x, gy, r, spokes, accent, caliper) {
  ctx.beginPath();
  ctx.arc(x, gy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#14171b";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, gy, r * 0.62, 0, Math.PI * 2);
  ctx.fillStyle = "#7a828c";
  ctx.fill();

  if (caliper) {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(x, gy, r * 0.42, -0.6, 0.6);
    ctx.lineTo(x, gy);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = "#3a3f46";
  ctx.lineWidth = Math.max(1, r * 0.12);
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + Math.cos(a) * r * 0.58, gy + Math.sin(a) * r * 0.58);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(x, gy, r * 0.16, 0, Math.PI * 2);
  ctx.fillStyle = "#c8ccd2";
  ctx.fill();
}

function drawWheels(ctx, w, h, positions, r, baseSpokes, accent, caliper, variant) {
  positions.forEach((x, i) => {
    const spokes = baseSpokes + (variant % 3 === 0 ? 0 : variant % 3 === 1 ? 1 : -1);
    drawWheel(ctx, x, h * 0.78, r, Math.max(3, spokes), accent, caliper);
  });
}

function drawCarCommon(ctx, w, h, car) {
  const color = car.color, accent = car.accent, gy = h * 0.78;
  const variant = hashStr(car.id);
  const isGT = /\bGT\b/.test(car.name);
  const isE = /-E$/.test(car.name);

  drawGroundShadow(ctx, w, h, gy, 0.4);

  ctx.beginPath();
  ctx.moveTo(w * 0.12, gy);
  ctx.lineTo(w * 0.12, h * 0.5);
  ctx.lineTo(w * 0.22, h * 0.32);
  ctx.lineTo(w * 0.68, h * 0.32);
  ctx.lineTo(w * 0.8, h * 0.5);
  ctx.lineTo(w * 0.88, h * 0.5);
  ctx.lineTo(w * 0.88, gy);
  ctx.closePath();
  ctx.fillStyle = bodyGradient(ctx, color, h * 0.32, gy);
  ctx.fill();
  ctx.strokeStyle = shadeColor(color, -0.35);
  ctx.lineWidth = Math.max(1, w * 0.006);
  ctx.stroke();

  drawWindowGlass(ctx, [[w * 0.26, h * 0.36], [w * 0.64, h * 0.36], [w * 0.7, h * 0.5], [w * 0.3, h * 0.5]]);

  ctx.strokeStyle = shadeColor(color, -0.3);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.5);
  ctx.lineTo(w * 0.5, gy);
  ctx.stroke();

  drawMirror(ctx, w * 0.24, h * 0.42, w * 0.02, accent);
  drawHeadlight(ctx, w * 0.87, h * 0.58, w * 0.028);
  drawTaillight(ctx, w * 0.13, h * 0.58, w * 0.022);
  if (isGT) drawSpoiler(ctx, w * 0.14, gy, w * 0.1, h * 0.05, accent);
  if (isE) drawChargeBolt(ctx, w * 0.5, h * 0.44, w * 0.028, accent);

  drawWheels(ctx, w, h, [w * 0.28, w * 0.72], w * 0.085, 4, accent, false, variant);
}

function drawCarUncommon(ctx, w, h, car) {
  const color = car.color, accent = car.accent, gy = h * 0.78;
  const variant = hashStr(car.id);
  const isGT = /\bGT\b/.test(car.name);
  const isE = /-E$/.test(car.name);

  drawGroundShadow(ctx, w, h, gy, 0.42);

  ctx.beginPath();
  ctx.moveTo(w * 0.1, gy);
  ctx.lineTo(w * 0.1, h * 0.55);
  ctx.quadraticCurveTo(w * 0.14, h * 0.34, w * 0.32, h * 0.3);
  ctx.lineTo(w * 0.62, h * 0.3);
  ctx.quadraticCurveTo(w * 0.78, h * 0.34, w * 0.9, h * 0.55);
  ctx.lineTo(w * 0.9, gy);
  ctx.closePath();
  ctx.fillStyle = bodyGradient(ctx, color, h * 0.3, gy);
  ctx.fill();
  ctx.strokeStyle = shadeColor(color, -0.35);
  ctx.lineWidth = Math.max(1, w * 0.006);
  ctx.stroke();

  drawWindowGlass(ctx, [[w * 0.34, h * 0.33], [w * 0.6, h * 0.33], [w * 0.68, h * 0.5], [w * 0.28, h * 0.5]]);

  ctx.fillStyle = accent;
  ctx.fillRect(w * 0.12, h * 0.58, w * 0.76, h * 0.045);

  drawMirror(ctx, w * 0.22, h * 0.4, w * 0.022, accent);
  drawHeadlight(ctx, w * 0.89, h * 0.56, w * 0.03, true);
  drawTaillight(ctx, w * 0.11, h * 0.56, w * 0.024, true);
  if (isGT) drawSpoiler(ctx, w * 0.13, gy, w * 0.11, h * 0.055, accent);
  if (isE) drawChargeBolt(ctx, w * 0.5, h * 0.42, w * 0.03, accent);

  drawWheels(ctx, w, h, [w * 0.26, w * 0.74], w * 0.09, 5, accent, false, variant);
}

function drawCarRare(ctx, w, h, car) {
  const color = car.color, accent = car.accent, gy = h * 0.78;
  const variant = hashStr(car.id);
  const isGT = /\bGT\b/.test(car.name);
  const isE = /-E$/.test(car.name);

  drawGroundShadow(ctx, w, h, gy, 0.44);

  ctx.beginPath();
  ctx.moveTo(w * 0.08, gy);
  ctx.lineTo(w * 0.08, h * 0.58);
  ctx.quadraticCurveTo(w * 0.1, h * 0.4, w * 0.28, h * 0.32);
  ctx.lineTo(w * 0.5, h * 0.24);
  ctx.lineTo(w * 0.7, h * 0.32);
  ctx.quadraticCurveTo(w * 0.88, h * 0.4, w * 0.92, h * 0.58);
  ctx.lineTo(w * 0.92, gy);
  ctx.closePath();
  ctx.fillStyle = bodyGradient(ctx, color, h * 0.24, gy);
  ctx.fill();
  ctx.strokeStyle = shadeColor(color, -0.35);
  ctx.lineWidth = Math.max(1, w * 0.006);
  ctx.stroke();

  drawWindowGlass(ctx, [[w * 0.32, h * 0.34], [w * 0.5, h * 0.27], [w * 0.66, h * 0.34], [w * 0.62, h * 0.48], [w * 0.36, h * 0.48]]);

  ctx.fillStyle = accent;
  ctx.fillRect(w * 0.47, h * 0.24, w * 0.055, h * 0.5);
  ctx.fillRect(w * 0.1, h * 0.6, w * 0.15, h * 0.03);
  ctx.fillRect(w * 0.75, h * 0.6, w * 0.15, h * 0.03);

  drawMirror(ctx, w * 0.24, h * 0.38, w * 0.024, accent);
  drawHeadlight(ctx, w * 0.9, h * 0.54, w * 0.032, true);
  drawTaillight(ctx, w * 0.1, h * 0.54, w * 0.026, true);
  if (isGT) drawSpoiler(ctx, w * 0.12, gy, w * 0.12, h * 0.06, accent);
  if (isE) drawChargeBolt(ctx, w * 0.5, h * 0.36, w * 0.032, accent);

  drawWheels(ctx, w, h, [w * 0.24, w * 0.76], w * 0.095, 6, accent, true, variant);
}

function drawCarEpic(ctx, w, h, car) {
  const color = car.color, accent = car.accent, gy = h * 0.8;
  const variant = hashStr(car.id);
  const isE = /-E$/.test(car.name);

  drawGroundShadow(ctx, w, h, gy, 0.46);

  ctx.beginPath();
  ctx.moveTo(w * 0.06, gy);
  ctx.lineTo(w * 0.06, h * 0.6);
  ctx.quadraticCurveTo(w * 0.08, h * 0.42, w * 0.24, h * 0.34);
  ctx.lineTo(w * 0.46, h * 0.22);
  ctx.lineTo(w * 0.68, h * 0.3);
  ctx.quadraticCurveTo(w * 0.86, h * 0.4, w * 0.94, h * 0.6);
  ctx.lineTo(w * 0.94, gy);
  ctx.closePath();
  ctx.fillStyle = bodyGradient(ctx, color, h * 0.22, gy);
  ctx.fill();
  ctx.strokeStyle = shadeColor(color, -0.35);
  ctx.lineWidth = Math.max(1, w * 0.006);
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(w * 0.3, h * 0.34, w * 0.045, h * 0.035, 0, 0, Math.PI * 2);
  ctx.fill();

  drawWindowGlass(ctx, [[w * 0.48, h * 0.26], [w * 0.64, h * 0.32], [w * 0.6, h * 0.46], [w * 0.5, h * 0.46]]);

  ctx.fillStyle = accent;
  ctx.fillRect(w * 0.86, h * 0.26, w * 0.045, h * 0.2);
  ctx.fillRect(w * 0.81, h * 0.24, w * 0.13, h * 0.04);
  ctx.fillRect(w * 0.1, h * 0.62, w * 0.16, h * 0.028);
  ctx.fillRect(w * 0.74, h * 0.62, w * 0.16, h * 0.028);

  drawMirror(ctx, w * 0.22, h * 0.36, w * 0.026, accent);
  drawHeadlight(ctx, w * 0.92, h * 0.52, w * 0.034, true);
  drawHeadlight(ctx, w * 0.87, h * 0.5, w * 0.02, true);
  drawTaillight(ctx, w * 0.08, h * 0.52, w * 0.028, true);
  if (isE) drawChargeBolt(ctx, w * 0.5, h * 0.34, w * 0.034, accent);

  drawWheels(ctx, w, h, [w * 0.24, w * 0.78], w * 0.1, 7, accent, true, variant);
}

function drawCarLegendary(ctx, w, h, car) {
  const color = car.color, accent = car.accent, gy = h * 0.82;
  const variant = hashStr(car.id);
  const isE = /-E$/.test(car.name);

  drawGroundShadow(ctx, w, h, gy, 0.5);
  ctx.save();
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.ellipse(w * 0.5, gy + h * 0.01, w * 0.46, h * 0.045, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = w * 0.045;
  ctx.beginPath();
  ctx.moveTo(w * 0.05, gy);
  ctx.lineTo(w * 0.06, h * 0.62);
  ctx.quadraticCurveTo(w * 0.1, h * 0.44, w * 0.3, h * 0.34);
  ctx.lineTo(w * 0.55, h * 0.2);
  ctx.lineTo(w * 0.75, h * 0.3);
  ctx.quadraticCurveTo(w * 0.9, h * 0.4, w * 0.96, h * 0.6);
  ctx.lineTo(w * 0.95, gy);
  ctx.closePath();
  ctx.fillStyle = bodyGradient(ctx, color, h * 0.2, gy);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = shadeColor(color, -0.4);
  ctx.lineWidth = Math.max(1, w * 0.006);
  ctx.stroke();

  drawWindowGlass(ctx, [[w * 0.56, h * 0.24], [w * 0.72, h * 0.32], [w * 0.68, h * 0.44], [w * 0.58, h * 0.44]]);

  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1.5, w * 0.01);
  ctx.beginPath();
  ctx.moveTo(w * 0.14, h * 0.56);
  ctx.lineTo(w * 0.5, h * 0.5);
  ctx.lineTo(w * 0.86, h * 0.57);
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.fillRect(w * 0.88, h * 0.22, w * 0.04, h * 0.24);
  ctx.fillRect(w * 0.82, h * 0.2, w * 0.15, h * 0.035);
  ctx.fillRect(w * 0.08, h * 0.64, w * 0.14, h * 0.026);
  ctx.fillRect(w * 0.72, h * 0.64, w * 0.14, h * 0.026);

  drawMirror(ctx, w * 0.28, h * 0.36, w * 0.028, accent);
  drawHeadlight(ctx, w * 0.94, h * 0.5, w * 0.036, true);
  drawHeadlight(ctx, w * 0.89, h * 0.48, w * 0.022, true);
  drawTaillight(ctx, w * 0.06, h * 0.5, w * 0.03, true);
  if (isE) drawChargeBolt(ctx, w * 0.5, h * 0.32, w * 0.036, accent);

  drawWheels(ctx, w, h, [w * 0.22, w * 0.8], w * 0.105, 8, accent, true, variant);
}

const CAR_DRAW_FN = {
  common: drawCarCommon,
  uncommon: drawCarUncommon,
  rare: drawCarRare,
  epic: drawCarEpic,
  legendary: drawCarLegendary,
};

function drawCarIcon(canvasEl, car) {
  const ctx = canvasEl.getContext("2d");
  const w = canvasEl.width, h = canvasEl.height;
  ctx.clearRect(0, 0, w, h);
  CAR_DRAW_FN[car.rarity](ctx, w, h, car);
}

// ---------------------------------------------------------------------
// Hub-Rendering
// ---------------------------------------------------------------------

function groupByIdWithCount(ids) {
  const counts = {};
  const order = [];
  for (const id of ids) {
    if (!(id in counts)) order.push(id);
    counts[id] = (counts[id] || 0) + 1;
  }
  return order.map((id) => ({ id, count: counts[id] }));
}

function updateHub() {
  hubCredits.textContent = `⚡ ${credits} Credits`;
  hubDex.textContent = `🗂️ ${discoveredCars.size}/${CARS.length} Autos · ${discoveredAbilities.size}/${ABILITIES.length} Fähigkeiten`;
  btnOpenPack.disabled = credits < PACK_PRICE;
  btnGetOffer.disabled = ownedCars.length === 0;

  garageGrid.innerHTML = ownedCars.length
    ? groupByIdWithCount(ownedCars).map(({ id, count }) => carCardHTML(CAR_BY_ID[id], { count })).join("")
    : `<div class="empty-hint">Keine Autos mehr! Öffne einen Booster.</div>`;
  drawAllPendingCarIcons(garageGrid);

  abilityInventoryEl.innerHTML = ownedAbilities.length
    ? groupByIdWithCount(ownedAbilities).map(({ id, count }) => abilityCardHTML(ABILITY_BY_ID[id], { count })).join("")
    : `<div class="empty-hint">Noch keine Fähigkeitskarten.</div>`;
}

// ---------------------------------------------------------------------
// Intro / Start
// ---------------------------------------------------------------------

btnStart.addEventListener("click", () => {
  // Rostlaube ist kein Teil der 50er-Sammlung und zählt daher nicht mit.
  showScreen("hub");
  updateHub();
});

// ---------------------------------------------------------------------
// Booster öffnen
// ---------------------------------------------------------------------

function drawPackCard() {
  const rarity = pickWeightedRarity(PACK_ODDS);
  const isCar = Math.random() < 0.5;
  if (isCar) {
    return { type: "car", item: randomFrom(carsOfRarity(rarity)) };
  }
  return { type: "ability", item: randomFrom(abilitiesOfRarity(rarity)) };
}

btnOpenPack.addEventListener("click", () => {
  if (credits < PACK_PRICE) return;
  packIntro.classList.remove("hidden");
  packReveal.classList.add("hidden");
  packCardsEl.innerHTML = "";
  btnPackDone.classList.add("hidden");
  openModal(packModal);
});

btnPackReveal.addEventListener("click", () => {
  credits -= PACK_PRICE;
  updateHub();

  lastPackCards = [];
  for (let i = 0; i < PACK_SIZE; i++) lastPackCards.push(drawPackCard());

  for (const pull of lastPackCards) {
    if (pull.type === "car") {
      ownedCars.push(pull.item.id);
      discoveredCars.add(pull.item.id);
    } else {
      ownedAbilities.push(pull.item.id);
      discoveredAbilities.add(pull.item.id);
    }
  }

  packIntro.classList.add("hidden");
  packReveal.classList.remove("hidden");
  packCardsEl.innerHTML = lastPackCards.map((pull, i) => {
    const html = pull.type === "car" ? carCardHTML(pull.item) : abilityCardHTML(pull.item);
    return html.replace('class="game-card', `style="animation-delay:${i * 0.15}s" class="game-card`);
  }).join("");
  drawAllPendingCarIcons(packCardsEl);
  btnPackDone.classList.remove("hidden");

  updateHub();
});

btnPackDone.addEventListener("click", () => closeModal(packModal));
btnPackClose.addEventListener("click", () => closeModal(packModal));
packModal.querySelector(".modal-backdrop").addEventListener("click", () => closeModal(packModal));

// ---------------------------------------------------------------------
// Rennangebot: annehmen/ablehnen, Auto & Fähigkeiten wählen, Rennen
// ---------------------------------------------------------------------

function showPhase(phaseEl) {
  [phaseOffer, phasePickCar, phasePickAbility, phaseRace, phaseResult].forEach((p) => p.classList.add("hidden"));
  phaseEl.classList.remove("hidden");
}

btnGetOffer.addEventListener("click", () => {
  if (ownedCars.length === 0) return;
  const rarity = pickWeightedRarity(OPPONENT_ODDS);
  currentOffer = { car: randomFrom(carsOfRarity(rarity)) };
  raceSelection = { carId: null, abilityIds: [] };

  challengeHeading.textContent = "Rennangebot";
  offerOpponentCard.innerHTML = carCardHTML(currentOffer.car);
  drawAllPendingCarIcons(offerOpponentCard);
  showPhase(phaseOffer);
  openModal(challengeModal);
});

btnOfferReject.addEventListener("click", () => closeModal(challengeModal));
btnChallengeClose.addEventListener("click", () => closeModal(challengeModal));
challengeModal.querySelector(".modal-backdrop").addEventListener("click", () => closeModal(challengeModal));

btnOfferAccept.addEventListener("click", () => {
  challengeHeading.textContent = "Auto wählen";
  pickCarGrid.innerHTML = groupByIdWithCount(ownedCars).map(({ id, count }) =>
    carCardHTML(CAR_BY_ID[id], { count, selectable: true })
  ).join("");
  drawAllPendingCarIcons(pickCarGrid);
  showPhase(phasePickCar);
});

pickCarGrid.addEventListener("click", (e) => {
  const cardEl = e.target.closest(".game-card");
  if (!cardEl) return;
  raceSelection.carId = cardEl.dataset.carId;
  showAbilityPickPhase();
});

function showAbilityPickPhase() {
  challengeHeading.textContent = "Fähigkeiten einsetzen (optional)";
  raceSelection.abilityIds = [];
  renderAbilityPickGrid();
  showPhase(phasePickAbility);
}

function renderAbilityPickGrid() {
  const groups = groupByIdWithCount(ownedAbilities);
  pickAbilityGrid.innerHTML = groups.length
    ? groups.map(({ id, count }) => abilityCardHTML(ABILITY_BY_ID[id], {
        count, selectable: true, selected: raceSelection.abilityIds.includes(id),
      })).join("")
    : `<div class="empty-hint">Keine Fähigkeitskarten vorhanden.</div>`;
}

pickAbilityGrid.addEventListener("click", (e) => {
  const cardEl = e.target.closest(".game-card");
  if (!cardEl) return;
  const id = cardEl.dataset.abilityId;
  const idx = raceSelection.abilityIds.indexOf(id);
  if (idx >= 0) {
    raceSelection.abilityIds.splice(idx, 1);
  } else if (raceSelection.abilityIds.length < 2) {
    raceSelection.abilityIds.push(id);
  }
  renderAbilityPickGrid();
});

btnAbilityDone.addEventListener("click", () => {
  challengeHeading.textContent = "Rennen!";
  showPhase(phaseRace);
  runRace();
});

// ---------------------------------------------------------------------
// Rennauswertung
// ---------------------------------------------------------------------

function combineEffects(abilityIds) {
  const e = {
    speedBoost: 0, accelBoost: 0, handlingBoost: 0, allBoost: 0,
    oppSpeedDebuff: 0, oppAccelDebuff: 0, oppHandlingDebuff: 0, oppAllDebuff: 0,
    rewardMult: 1, keepCarChance: 0, stealChanceBonus: 0,
    guaranteedWin: false, luckFloor: 0.7, refundOnLoss: 0, bonusCreditsAlways: 0,
  };
  for (const id of abilityIds) {
    const ab = ABILITY_BY_ID[id];
    const fx = ab.effects;
    if (fx.speedBoost) e.speedBoost += fx.speedBoost;
    if (fx.accelBoost) e.accelBoost += fx.accelBoost;
    if (fx.handlingBoost) e.handlingBoost += fx.handlingBoost;
    if (fx.allBoost) e.allBoost += fx.allBoost;
    if (fx.oppSpeedDebuff) e.oppSpeedDebuff += fx.oppSpeedDebuff;
    if (fx.oppAccelDebuff) e.oppAccelDebuff += fx.oppAccelDebuff;
    if (fx.oppHandlingDebuff) e.oppHandlingDebuff += fx.oppHandlingDebuff;
    if (fx.oppAllDebuff) e.oppAllDebuff += fx.oppAllDebuff;
    if (fx.rewardMult) e.rewardMult *= fx.rewardMult;
    if (fx.keepCarChance) e.keepCarChance = Math.max(e.keepCarChance, fx.keepCarChance);
    if (fx.stealChanceBonus) e.stealChanceBonus += fx.stealChanceBonus;
    if (fx.guaranteedWin) e.guaranteedWin = true;
    if (fx.luckFloor) e.luckFloor = Math.max(e.luckFloor, fx.luckFloor);
    if (fx.refundOnLoss) e.refundOnLoss += fx.refundOnLoss;
    if (fx.bonusCreditsAlways) e.bonusCreditsAlways += fx.bonusCreditsAlways;
  }
  return e;
}

function carScore(car, speedMul, accelMul, handlingMul) {
  const speed = car.speed * (1 + speedMul);
  const accel = car.accel * (1 + accelMul);
  const handling = car.handling * (1 + handlingMul);
  return speed * 0.45 + accel * 0.3 + handling * 0.25;
}

function resolveRace(playerCar, opponentCar, effects) {
  const playerBase = carScore(
    playerCar,
    effects.speedBoost + effects.allBoost,
    effects.accelBoost + effects.allBoost,
    effects.handlingBoost + effects.allBoost
  );
  const opponentBase = carScore(
    opponentCar,
    -effects.oppSpeedDebuff - effects.oppAllDebuff,
    -effects.oppAccelDebuff - effects.oppAllDebuff,
    -effects.oppHandlingDebuff - effects.oppAllDebuff
  );

  const rollRange = 1 - effects.luckFloor;
  const playerRoll = playerBase * (effects.luckFloor + Math.random() * rollRange + 0.15);
  const opponentRoll = opponentBase * (0.85 + Math.random() * 0.3);

  const playerWins = effects.guaranteedWin || playerRoll >= opponentRoll;
  return { playerWins, playerBase, opponentBase, playerRoll, opponentRoll };
}

function runRace() {
  const playerCar = CAR_BY_ID[raceSelection.carId];
  const opponentCar = currentOffer.car;
  const effects = combineEffects(raceSelection.abilityIds);
  const outcome = resolveRace(playerCar, opponentCar, effects);

  animateRace(playerCar, opponentCar, outcome.playerWins, () => {
    applyRaceOutcome(playerCar, opponentCar, effects, outcome);
  });
}

function applyRaceOutcome(playerCar, opponentCar, effects, outcome) {
  // Verbrauchte Fähigkeitskarten entfernen (je 1 Exemplar pro genutzter Art).
  for (const id of raceSelection.abilityIds) {
    const idx = ownedAbilities.indexOf(id);
    if (idx >= 0) ownedAbilities.splice(idx, 1);
  }

  let creditsGained = 0;
  let carLost = false;
  let carStolen = false;

  if (outcome.playerWins) {
    creditsGained = Math.round(REWARD_BY_RARITY[opponentCar.rarity] * effects.rewardMult);
    if (Math.random() < BASE_STEAL_CHANCE + effects.stealChanceBonus) {
      ownedCars.push(opponentCar.id);
      discoveredCars.add(opponentCar.id);
      carStolen = true;
    }
  } else {
    const keeps = Math.random() < effects.keepCarChance;
    if (!keeps) {
      const idx = ownedCars.indexOf(playerCar.id);
      if (idx >= 0) ownedCars.splice(idx, 1);
      carLost = true;
    }
    if (effects.refundOnLoss) creditsGained += effects.refundOnLoss;
  }

  creditsGained += effects.bonusCreditsAlways;
  credits += creditsGained;
  updateHub();

  resultTitle.textContent = outcome.playerWins ? "🏁 Gewonnen!" : "💥 Verloren!";
  resultTitle.className = outcome.playerWins ? "win" : "lose";

  const lines = [];
  lines.push(`${playerCar.name} vs. ${opponentCar.name}`);
  if (outcome.playerWins) {
    lines.push(`+${creditsGained} Credits`);
    if (carStolen) lines.push(`Bonus: Du hast das ${opponentCar.name} des Gegners erbeutet!`);
  } else {
    if (carLost) lines.push(`Dein ${playerCar.name} geht an den Gegner.`);
    else lines.push(`Eine Fähigkeit hat dein ${playerCar.name} gerettet!`);
    if (creditsGained > 0) lines.push(`+${creditsGained} Trost-Credits`);
  }

  resultDetails.innerHTML = lines.map((l) => `<div>${l}</div>`).join("");
  showPhase(phaseResult);
}

btnResultClose.addEventListener("click", () => closeModal(challengeModal));

// ---------------------------------------------------------------------
// Renn-Animation (Canvas)
// ---------------------------------------------------------------------

function animateRace(playerCar, opponentCar, playerWins, onDone) {
  const ctx = raceCanvas.getContext("2d");
  const w = raceCanvas.width, h = raceCanvas.height;
  const trackStart = w * 0.08, trackEnd = w * 0.92;
  const laneY = [h * 0.35, h * 0.7];

  const margin = 0.06 + Math.random() * 0.22;
  const winnerPace = 1;
  const loserPace = 1 - margin;
  const playerPace = playerWins ? winnerPace : loserPace;
  const opponentPace = playerWins ? loserPace : winnerPace;

  const COUNTDOWN_MS = 900;
  const RACE_MS = 2600;
  const startTime = performance.now();

  function drawTrack(t) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0e1116";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.setLineDash([14, 10]);
    for (const y of [h * 0.5]) {
      ctx.beginPath();
      ctx.moveTo(trackStart, y);
      ctx.lineTo(trackEnd, y);
      ctx.lineDashOffset = -t * 120;
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Start/Ziel-Linien
    ctx.fillStyle = "#4bd07a";
    ctx.fillRect(trackStart - 3, h * 0.2, 4, h * 0.6);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#f4f6f8" : "#14171b";
      ctx.fillRect(trackEnd, h * 0.2 + i * (h * 0.6 / 6), 10, h * 0.6 / 6);
    }
  }

  function drawSmallCar(car, x, y, facing) {
    const cw = 70, chh = 34;
    ctx.save();
    ctx.translate(x, y - chh / 2);
    ctx.scale(facing, 1);
    CAR_DRAW_FN[car.rarity](ctx, cw, chh, car);
    ctx.restore();
  }

  function frame(now) {
    const elapsed = now - startTime;

    if (elapsed < COUNTDOWN_MS) {
      drawTrack(0);
      drawSmallCar(playerCar, trackStart + 10, laneY[0], 1);
      drawSmallCar(opponentCar, trackStart + 10, laneY[1], 1);
      const n = Math.ceil((COUNTDOWN_MS - elapsed) / 300);
      ctx.fillStyle = "#f4f6f8";
      ctx.font = `bold ${h * 0.22}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(n > 0 ? String(n) : "LOS!", w / 2, h * 0.58);
      requestAnimationFrame(frame);
      return;
    }

    const t = Math.min(1, (elapsed - COUNTDOWN_MS) / RACE_MS);
    const eased = 1 - Math.pow(1 - t, 2);
    drawTrack(t);

    const playerX = trackStart + (trackEnd - trackStart) * eased * playerPace;
    const oppX = trackStart + (trackEnd - trackStart) * eased * opponentPace;
    const bob1 = Math.sin(elapsed / 90) * 2;
    const bob2 = Math.sin(elapsed / 90 + 1.4) * 2;

    drawSmallCar(playerCar, playerX, laneY[0] + bob1, 1);
    drawSmallCar(opponentCar, oppX, laneY[1] + bob2, 1);

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      setTimeout(onDone, 500);
    }
  }

  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------
// Sammlung
// ---------------------------------------------------------------------

function renderCollection() {
  collectionCarsEl.innerHTML = CARS.map((car) => {
    const undiscovered = !discoveredCars.has(car.id);
    return carCardHTML(car, { undiscovered });
  }).join("");
  drawAllPendingCarIcons(collectionCarsEl);

  collectionAbilitiesEl.innerHTML = ABILITIES.map((ab) => {
    const undiscovered = !discoveredAbilities.has(ab.id);
    return abilityCardHTML(ab, { undiscovered });
  }).join("");
}

btnCollection.addEventListener("click", () => {
  renderCollection();
  tabCars.classList.add("tab-active");
  tabAbilities.classList.remove("tab-active");
  collectionCarsEl.classList.remove("hidden");
  collectionAbilitiesEl.classList.add("hidden");
  openModal(collectionModal);
});
btnCollectionClose.addEventListener("click", () => closeModal(collectionModal));
collectionModal.querySelector(".modal-backdrop").addEventListener("click", () => closeModal(collectionModal));

tabCars.addEventListener("click", () => {
  tabCars.classList.add("tab-active");
  tabAbilities.classList.remove("tab-active");
  collectionCarsEl.classList.remove("hidden");
  collectionAbilitiesEl.classList.add("hidden");
});
tabAbilities.addEventListener("click", () => {
  tabAbilities.classList.add("tab-active");
  tabCars.classList.remove("tab-active");
  collectionAbilitiesEl.classList.remove("hidden");
  collectionCarsEl.classList.add("hidden");
});

// ---------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------

btnReset.addEventListener("click", () => openModal(resetModal));
btnResetClose.addEventListener("click", () => closeModal(resetModal));
btnResetCancel.addEventListener("click", () => closeModal(resetModal));
resetModal.querySelector(".modal-backdrop").addEventListener("click", () => closeModal(resetModal));

btnResetConfirm.addEventListener("click", () => {
  credits = STARTING_CREDITS;
  ownedCars = [STARTER_CAR.id];
  ownedAbilities = [];
  updateHub();
  closeModal(resetModal);
});
