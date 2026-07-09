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

const PACK_SIZE = 5;
const STARTING_CREDITS = 300;

// Booster-Sortiment: Auto- und Fähigkeiten-Booster, jeweils Level 1 und 2.
// Level 2 kostet deutlich mehr, hat dafür stark verbesserte Seltenheits-Chancen.
const LV1_ODDS = { common: 50, uncommon: 28, rare: 14, epic: 6, legendary: 2 };
const LV2_ODDS = { common: 16, uncommon: 30, rare: 30, epic: 16, legendary: 8 };
const PACK_TYPES = {
  auto1: { name: "Auto-Booster", level: 1, art: "📦", price: 150, pool: "cars", odds: LV1_ODDS, desc: "5 Auto-Karten" },
  auto2: { name: "Auto-Booster", level: 2, art: "🏆", price: 450, pool: "cars", odds: LV2_ODDS, desc: "5 Auto-Karten, viel bessere Chancen auf seltene Autos" },
  skill1: { name: "Fähigkeiten-Booster", level: 1, art: "🎴", price: 120, pool: "abilities", odds: LV1_ODDS, desc: "5 Fähigkeitskarten" },
  skill2: { name: "Fähigkeiten-Booster", level: 2, art: "✨", price: 360, pool: "abilities", odds: LV2_ODDS, desc: "5 Fähigkeitskarten, viel bessere Chancen auf seltene Karten" },
};
const CHEAPEST_PACK_PRICE = Math.min(...Object.values(PACK_TYPES).map((p) => p.price));

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
  { id: "kurzteleport", name: "Kurz-Teleport", rarity: "rare", desc: "Teleportiert dich im Rennen ein Stück nach vorn (+25% Rennwurf)", effects: { teleport: 0.25 } },

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
  { id: "blitzteleport", name: "Blitz-Teleport", rarity: "epic", desc: "Großer Teleport-Sprung nach vorn (+45% Rennwurf)", effects: { teleport: 0.45 } },

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
  { id: "portalmeister", name: "Portal-Meister", rarity: "legendary", desc: "Riesiger Teleport-Sprung (+70% Rennwurf), und bei Niederlage teleportiert sich dein Auto sicher nach Hause", effects: { teleport: 0.7, keepCarChance: 1.0 } },
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
// Autosave: Der komplette Spielstand landet nach jeder Änderung in
// localStorage (updateHub ruft saveGame auf). Beim Laden werden nur
// bekannte IDs übernommen, damit ein alter Spielstand nach Daten-
// änderungen nichts kaputt machen kann.
// ---------------------------------------------------------------------

const SAVE_KEY = "voltgarage_save_v1";

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      credits,
      ownedCars,
      ownedAbilities,
      discoveredCars: [...discoveredCars],
      discoveredAbilities: [...discoveredAbilities],
    }));
  } catch (err) {
    // z. B. Privatmodus ohne localStorage – dann eben ohne Speichern.
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    if (typeof s.credits !== "number" || !Array.isArray(s.ownedCars)) return false;
    credits = s.credits;
    ownedCars = s.ownedCars.filter((id) => CAR_BY_ID[id]);
    ownedAbilities = (Array.isArray(s.ownedAbilities) ? s.ownedAbilities : []).filter((id) => ABILITY_BY_ID[id]);
    discoveredCars = new Set((s.discoveredCars || []).filter((id) => CAR_BY_ID[id] && id !== STARTER_CAR.id));
    discoveredAbilities = new Set((s.discoveredAbilities || []).filter((id) => ABILITY_BY_ID[id]));
    return true;
  } catch (err) {
    return false;
  }
}

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
const packChooseEl = document.getElementById("pack-choose");
const packReveal = document.getElementById("pack-reveal");
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

const CAR_BODY_FN = {
  common: drawCarCommon,
  uncommon: drawCarUncommon,
  rare: drawCarRare,
  epic: drawCarEpic,
  legendary: drawCarLegendary,
};

// =========================================================================
// FX-Engine: Jedes einzelne Auto (alle 50 + Rostlaube) hat einen eigenen,
// permanent laufenden Animationseffekt, passend zu seinem Namen. Effekte
// bestehen aus bis zu drei Hooks: bg (hinter dem Auto), transform (bewegt
// die Karosserie selbst, z. B. Wackeln) und fg (Partikel davor). Partikel-
// bahnen sind deterministisch aus einem Hash der Auto-ID abgeleitet, damit
// jede Karte ihren Effekt stabil und flackerfrei wiederholt.
// =========================================================================

function carRand(car, i) {
  const x = Math.sin(hashStr(car.id) * 0.0001 + i * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function fxPuff(ctx, x, y, r, rgb, alpha) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.fillStyle = `rgb(${rgb})`;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function fxExhaust(e, rgb, opts) {
  const { ctx, w, h, t } = e;
  const o = Object.assign({ count: 3, speed: 0.35, size: 0.03, x: 0.07, y: 0.62 }, opts);
  for (let i = 0; i < o.count; i++) {
    const p = (t * o.speed + i / o.count) % 1;
    fxPuff(ctx, w * o.x - p * w * 0.12 + Math.sin((t + i * 7) * 2.2) * w * 0.01,
      h * o.y - p * h * 0.22, w * o.size * (0.5 + p), rgb, (1 - p) * 0.45);
  }
}

function fxTwinkle(ctx, x, y, r, color, alpha) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = r * 1.6;
  ctx.lineWidth = Math.max(1, r * 0.3);
  ctx.beginPath();
  ctx.moveTo(x - r, y); ctx.lineTo(x + r, y);
  ctx.moveTo(x, y - r); ctx.lineTo(x, y + r);
  ctx.stroke();
  ctx.restore();
}

function fxBolt(ctx, x0, y0, x1, y1, color, seed, jag, lw) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
  const px = -dy / len, py = dx / len;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  ctx.lineWidth = lw || 1.6;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  const n = 6;
  for (let i = 1; i < n; i++) {
    const f = i / n;
    const s = Math.sin(seed * 13.7 + i * 91.7) * 0.9 + Math.sin(seed * 57.1 + i * 37.3) * 0.4;
    ctx.lineTo(x0 + dx * f + px * s * jag, y0 + dy * f + py * s * jag);
  }
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.restore();
}

function fxRing(ctx, x, y, r, color, alpha, lw) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw || 2;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function fxGhostBody(e, ox, oy, alpha) {
  const { ctx, w, h, car } = e;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(ox, oy);
  CAR_BODY_FN[car.rarity](ctx, w, h, car);
  ctx.restore();
}

const CAR_FX = {
  // ---------------- Starter ----------------
  rostlaube: { fg(e) { const { ctx, w, h, t } = e; // stotternder Auspuff + Elektrik-Fizzle
    fxExhaust(e, "130,130,130", { count: 3, speed: 0.3, size: 0.032 });
    if ((t * 0.6) % 1 < 0.1) fxTwinkle(ctx, w * 0.74, h * 0.4, w * 0.02, "#ffd75a", 0.8);
  } },

  // ---------------- Gewöhnlich ----------------
  schrotthaufen: { fg(e) { const { ctx, w, h, t, car } = e; // Rostflocken bröckeln ab
    for (let i = 0; i < 4; i++) {
      const p = (t * 0.35 + carRand(car, i)) % 1;
      ctx.save();
      ctx.globalAlpha = (1 - p) * 0.8;
      ctx.fillStyle = "#8a5a30";
      ctx.fillRect(w * (0.2 + carRand(car, i + 9) * 0.55), h * 0.55 + p * h * 0.28, w * 0.012, w * 0.012);
      ctx.restore();
    }
  } },
  zitronenflitzer: { fg(e) { const { ctx, w, h, t, car } = e; // saure Funken-Blitzer
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.8 + carRand(car, i)) % 1;
      if (ph < 0.18) fxTwinkle(ctx, w * (0.2 + carRand(car, i + 3) * 0.6), h * (0.3 + carRand(car, i + 6) * 0.3), w * 0.02, "#f4e04a", 1 - ph / 0.18);
    }
  } },
  blechbuechse: { transform(e) { const { ctx, h, t } = e; // scheppert und klappert
    ctx.translate(0, Math.sin(t * 31) * h * 0.006);
  }, fg(e) { const { ctx, w, h, t } = e;
    if ((t * 0.5) % 1 < 0.12) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.7, h * 0.24); ctx.lineTo(w * 0.74, h * 0.18);
      ctx.moveTo(w * 0.74, h * 0.26); ctx.lineTo(w * 0.79, h * 0.21);
      ctx.stroke();
      ctx.restore();
    }
  } },
  wackeldackel_e: { transform(e) { const { ctx, w, h, t } = e; // wackelt wie sein Namensgeber
    ctx.translate(w * 0.5, h * 0.78);
    ctx.rotate(Math.sin(t * 3.2) * 0.045);
    ctx.translate(-w * 0.5, -h * 0.78);
  } },
  sparmobil: { fg(e) { const { ctx, w, h, t, car } = e; // sparsame Öko-Blätter
    for (let i = 0; i < 2; i++) {
      const p = (t * 0.22 + i * 0.5) % 1;
      ctx.save();
      ctx.globalAlpha = (1 - p) * 0.8;
      ctx.fillStyle = "#7fd07f";
      ctx.translate(w * (0.3 + carRand(car, i) * 0.4) + Math.sin(p * 6 + i) * w * 0.03, h * 0.35 - p * h * 0.25);
      ctx.rotate(p * 4 + i);
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.014, w * 0.007, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } },
  rentnerflitzer: { fg(e) { const { ctx, w, h, t } = e; // der Blinker läuft seit 1987
    if ((t % 1.2) < 0.6) {
      ctx.save();
      ctx.fillStyle = "#ffaa30";
      ctx.shadowColor = "#ffaa30";
      ctx.shadowBlur = w * 0.03;
      ctx.beginPath();
      ctx.arc(w * 0.13, h * 0.52, w * 0.016, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } },
  uraltstromer: { fg(e) { // die Haube dampft
    fxExhaust(e, "200,200,200", { count: 4, speed: 0.2, size: 0.04, x: 0.72, y: 0.36 });
  } },
  waermflasche_e: { fg(e) { const { ctx, w, h, t } = e; // Hitzeflimmern überm Dach
    ctx.save();
    ctx.strokeStyle = "#ff7a5a";
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.35 + i / 3) % 1;
      const bx = w * (0.34 + i * 0.13), by = h * 0.3 - p * h * 0.2;
      ctx.globalAlpha = (1 - p) * 0.5;
      ctx.beginPath();
      for (let s = 0; s <= 6; s++) {
        const xx = bx + Math.sin(s / 2 + t * 5 + i * 2) * w * 0.014, yy = by - s * h * 0.018;
        s === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy);
      }
      ctx.stroke();
    }
    ctx.restore();
  } },
  milchkaennchen: { fg(e) { const { ctx, w, h, t, car } = e; // aufsteigende Milchbläschen
    for (let i = 0; i < 4; i++) {
      const p = (t * 0.3 + carRand(car, i)) % 1;
      fxPuff(ctx, w * (0.25 + carRand(car, i + 4) * 0.5), h * 0.4 - p * h * 0.22, w * 0.01 + p * w * 0.008, "245,242,230", (1 - p) * 0.8);
    }
  } },
  gartenzwerg_gt: { fg(e) { const { ctx, w, h, t, car } = e; // Laub wirbelt hinterher
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.4 + i / 3) % 1;
      ctx.save();
      ctx.globalAlpha = (1 - p) * 0.85;
      ctx.fillStyle = i % 2 ? "#6fae4f" : "#4f8f3f";
      ctx.translate(w * 0.16 - p * w * 0.12, h * (0.45 + carRand(car, i) * 0.2) + Math.sin(p * 9 + i) * h * 0.05);
      ctx.rotate(t * 4 + i * 2);
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.013, w * 0.006, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } },

  // ---------------- Ungewöhnlich ----------------
  stadtblitz: { fg(e) { const { ctx, w, h, t } = e; // Funk-Antenne mit Zap
    ctx.save();
    ctx.strokeStyle = "rgba(127,212,255,0.8)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(w * 0.47, h * 0.3); ctx.lineTo(w * 0.47, h * 0.16);
    ctx.stroke();
    ctx.restore();
    const ph = (t * 0.7) % 1;
    if (ph < 0.25) {
      fxBolt(ctx, w * 0.47, h * 0.14, w * 0.53, h * 0.28, "#7fd4ff", Math.floor(t * 6), w * 0.015, 1.4);
      fxTwinkle(ctx, w * 0.47, h * 0.13, w * 0.016, "#bfe9ff", 1 - ph * 4);
    }
  } },
  pendlerpfeil: { fg(e) { const { ctx, w, h, t, car } = e; // Pfeil-Chevrons ziehen hinterher
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.9 + i / 3) % 1;
      const x = w * 0.16 - p * w * 0.14, y = h * 0.55;
      ctx.save();
      ctx.globalAlpha = (1 - p) * 0.9;
      ctx.strokeStyle = car.accent;
      ctx.lineWidth = Math.max(1.5, w * 0.012);
      ctx.beginPath();
      ctx.moveTo(x + w * 0.03, y - h * 0.07); ctx.lineTo(x, y); ctx.lineTo(x + w * 0.03, y + h * 0.07);
      ctx.stroke();
      ctx.restore();
    }
  } },
  kompaktvolt: { fg(e) { const { ctx, w, h, t } = e; // Ladebalken an der Tür füllt sich
    const seg = 4, fill = Math.floor(((t * 0.8) % 1) * (seg + 1));
    for (let i = 0; i < seg; i++) {
      ctx.save();
      ctx.globalAlpha = i < fill ? 0.95 : 0.25;
      ctx.fillStyle = i < fill ? "#5aff9a" : "#2a4a3a";
      if (i < fill) { ctx.shadowColor = "#5aff9a"; ctx.shadowBlur = 3; }
      ctx.fillRect(w * (0.36 + i * 0.05), h * 0.56, w * 0.035, h * 0.05);
      ctx.restore();
    }
  } },
  silberstreif: { fg(e) { const { ctx, w, h, t } = e; // Silberglanz wandert übers Blech
    const p = (t * 0.45) % 1, x = w * (0.05 + p * 0.9);
    ctx.save();
    ctx.globalAlpha = 0.5 * Math.sin(Math.PI * p);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = w * 0.02;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.05, h * 0.72); ctx.lineTo(x + w * 0.05, h * 0.3);
    ctx.stroke();
    ctx.restore();
  } },
  alltagsrakete: { fg(e) { const { ctx, w, h, t } = e; // Raketenflamme am Heck
    const f = 0.7 + Math.sin(t * 22) * 0.3;
    ctx.save();
    ctx.translate(w * 0.09, h * 0.6);
    ctx.fillStyle = "#ff8a3c";
    ctx.beginPath(); ctx.moveTo(0, -h * 0.05); ctx.lineTo(-w * 0.07 * f, 0); ctx.lineTo(0, h * 0.05); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#ffd75a";
    ctx.beginPath(); ctx.moveTo(0, -h * 0.025); ctx.lineTo(-w * 0.04 * f, 0); ctx.lineTo(0, h * 0.025); ctx.closePath(); ctx.fill();
    ctx.restore();
    fxExhaust(e, "160,160,160", { count: 2, speed: 0.5, size: 0.02, x: 0.04, y: 0.6 });
  } },
  blauer_blitz: { fg(e) { const { ctx, w, h, t } = e; // Blitz schlägt neben dem Dach ein
    const ph = (t * 0.9) % 1;
    if (ph < 0.2) {
      fxBolt(ctx, w * 0.5, h * 0.05, w * 0.55, h * 0.26, "#4fa0ff", Math.floor(t * 5), w * 0.02, 2);
      fxTwinkle(ctx, w * 0.55, h * 0.27, w * 0.02, "#9fd0ff", 1 - ph * 5);
    }
  } },
  stromlinie_s1: { fg(e) { const { ctx, w, h, t } = e; // Luftströmungslinien gleiten übers Dach
    ctx.save();
    ctx.strokeStyle = "rgba(90,212,192,0.7)";
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.7 + i / 3) % 1, x = w * (0.15 + p * 0.7);
      ctx.globalAlpha = Math.sin(Math.PI * p) * 0.7;
      ctx.beginPath();
      ctx.moveTo(x - w * 0.08, h * (0.24 + i * 0.05));
      ctx.quadraticCurveTo(x, h * (0.2 + i * 0.05), x + w * 0.08, h * (0.24 + i * 0.05));
      ctx.stroke();
    }
    ctx.restore();
  } },
  nachbarschaftsrakete: { fg(e) { const { ctx, w, h, t, car } = e; // Konfetti-Party
    const cols = ["#ff6a6a", "#ffd75a", "#6ad0ff", "#7fff9a", "#d08aff"];
    for (let i = 0; i < 5; i++) {
      const p = (t * 0.5 + carRand(car, i)) % 1;
      ctx.save();
      ctx.globalAlpha = 1 - p;
      ctx.fillStyle = cols[i];
      ctx.translate(w * 0.16 - p * w * 0.13, h * (0.3 + carRand(car, i + 5) * 0.35) + Math.sin(p * 8 + i) * h * 0.04);
      ctx.rotate(t * 6 + i);
      ctx.fillRect(-w * 0.008, -w * 0.008, w * 0.016, w * 0.016);
      ctx.restore();
    }
  } },
  bueroschtuhl_gt: { fg(e) { const { ctx, w, h, t, car } = e; // Akten fliegen davon
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.4 + i / 3) % 1;
      ctx.save();
      ctx.globalAlpha = (1 - p) * 0.9;
      ctx.fillStyle = "#f0f0e8";
      ctx.translate(w * 0.15 - p * w * 0.12, h * (0.35 + carRand(car, i) * 0.2) - Math.sin(p * 5 + i) * h * 0.06);
      ctx.rotate(Math.sin(t * 3 + i) * 0.8);
      ctx.fillRect(-w * 0.014, -w * 0.01, w * 0.028, w * 0.02);
      ctx.strokeStyle = "#999";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(-w * 0.008, -w * 0.003); ctx.lineTo(w * 0.008, -w * 0.003);
      ctx.moveTo(-w * 0.008, w * 0.003); ctx.lineTo(w * 0.008, w * 0.003);
      ctx.stroke();
      ctx.restore();
    }
  } },
  vorstadtpanther: { fg(e) { const { ctx, w, h, t } = e; // lauernde Panther-Augen, blinzeln ab und zu
    const blink = (t * 0.4) % 1 < 0.85 ? 1 : 0.1;
    ctx.save();
    ctx.globalAlpha = blink;
    ctx.fillStyle = "#5aff7a";
    ctx.shadowColor = "#5aff7a";
    ctx.shadowBlur = w * 0.02;
    ctx.beginPath(); ctx.ellipse(w * 0.42, h * 0.41, w * 0.012, h * 0.012, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(w * 0.52, h * 0.41, w * 0.012, h * 0.012, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } },

  // ---------------- Selten ----------------
  sturmvogel: { fg(e) { const { ctx, w, h, t } = e; // Sturmwirbel ziehen vorbei
    ctx.save();
    ctx.strokeStyle = "rgba(79,196,224,0.8)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 2; i++) {
      const p = (t * 0.5 + i / 2) % 1, x = w * (0.75 - p * 0.6);
      ctx.globalAlpha = Math.sin(Math.PI * p) * 0.8;
      ctx.beginPath();
      ctx.arc(x, h * (0.3 + i * 0.12), w * 0.03, t * 3 + i, t * 3 + i + 4.5);
      ctx.stroke();
    }
    ctx.restore();
  } },
  plasmaflitzer: { fg(e) { const { ctx, w, h, t } = e; // orbitierende Plasmakugeln
    for (let i = 0; i < 3; i++) {
      const a = t * 1.6 + i * (Math.PI * 2 / 3);
      const x = w * 0.5 + Math.cos(a) * w * 0.4, y = h * 0.5 + Math.sin(a) * h * 0.28;
      const behind = Math.sin(a) < 0;
      ctx.save();
      ctx.globalAlpha = behind ? 0.35 : 0.9;
      ctx.fillStyle = "#ff5ae0";
      ctx.shadowColor = "#ff5ae0";
      ctx.shadowBlur = w * 0.02;
      ctx.beginPath();
      ctx.arc(x, y, w * (behind ? 0.008 : 0.013) * (1 + Math.sin(t * 5 + i) * 0.25), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } },
  kobalt_gt: { fg(e) { const { ctx, w, h, t } = e; // Energie-Ringe pulsieren aus den Felgen
    for (const wx of [w * 0.24, w * 0.76]) {
      const p = (t * 0.8 + (wx > w * 0.5 ? 0.5 : 0)) % 1;
      fxRing(ctx, wx, h * 0.78, w * 0.03 + p * w * 0.09, "#4f8fff", (1 - p) * 0.7, 2);
    }
  } },
  turbovolt_x: { fg(e) { const { ctx, w, h, t } = e; // blaue Turboflamme + X-Funken
    const f = 0.7 + Math.sin(t * 26) * 0.3;
    ctx.save();
    ctx.translate(w * 0.07, h * 0.64);
    ctx.fillStyle = "#4fa0ff";
    ctx.beginPath(); ctx.moveTo(0, -h * 0.04); ctx.lineTo(-w * 0.09 * f, 0); ctx.lineTo(0, h * 0.04); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#d0ecff";
    ctx.beginPath(); ctx.moveTo(0, -h * 0.02); ctx.lineTo(-w * 0.05 * f, 0); ctx.lineTo(0, h * 0.02); ctx.closePath(); ctx.fill();
    ctx.restore();
    if ((t * 1.4) % 1 < 0.2) {
      ctx.save();
      ctx.strokeStyle = "#ffd75a";
      ctx.lineWidth = 1.6;
      ctx.shadowColor = "#ffd75a";
      ctx.shadowBlur = 4;
      const x = w * 0.12, y = h * 0.42, r = w * 0.018;
      ctx.beginPath();
      ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r);
      ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r);
      ctx.stroke();
      ctx.restore();
    }
  } },
  nachtschatten: { bg(e) { // Schattengeister hängen dem Auto nach
    fxGhostBody(e, -e.w * 0.07, 0, 0.22);
    fxGhostBody(e, -e.w * 0.14, 0, 0.1);
  } },
  silberpfeil_e: { fg(e) { const { ctx, w, h, t } = e; // ein Silberpfeil schießt nach vorn
    const p = (t * 0.9) % 1, x = w * (0.1 + p * 0.8), y = h * 0.55;
    ctx.save();
    ctx.globalAlpha = Math.sin(Math.PI * p);
    ctx.strokeStyle = "#e8ecf4";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 5;
    ctx.beginPath(); ctx.moveTo(x - w * 0.1, y); ctx.lineTo(x, y); ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(x + w * 0.02, y); ctx.lineTo(x - w * 0.005, y - h * 0.03); ctx.lineTo(x - w * 0.005, y + h * 0.03);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  } },
  windschnitt: { fg(e) { const { ctx, w, h, t } = e; // messerscharfe Luftschnitte
    for (let i = 0; i < 2; i++) {
      const ph = (t * 0.7 + i * 0.5) % 1;
      if (ph < 0.3) {
        ctx.save();
        ctx.globalAlpha = 1 - ph / 0.3;
        ctx.strokeStyle = "#dfffee";
        ctx.lineWidth = 1.2;
        const x = w * (0.3 + i * 0.3);
        ctx.beginPath(); ctx.moveTo(x, h * 0.2); ctx.lineTo(x + w * 0.14, h * 0.65); ctx.stroke();
        ctx.restore();
      }
    }
  } },
  funkenflug: { fg(e) { const { ctx, w, h, t, car } = e; // Funkenfontäne am Heckrad
    for (let i = 0; i < 6; i++) {
      const p = (t * 1.1 + carRand(car, i)) % 1;
      const x = w * 0.24 - p * w * (0.1 + carRand(car, i + 6) * 0.1);
      const y = h * 0.75 - Math.sin(Math.PI * p) * h * (0.15 + carRand(car, i + 12) * 0.2);
      ctx.save();
      ctx.globalAlpha = 1 - p;
      ctx.fillStyle = i % 2 ? "#ffd75a" : "#ff9a3c";
      ctx.shadowColor = "#ffb84a";
      ctx.shadowBlur = 3;
      ctx.fillRect(x, y, Math.max(1.2, w * 0.007), Math.max(1.2, w * 0.007));
      ctx.restore();
    }
  } },
  amperecoupe: { fg(e) { const { ctx, w, h, t } = e; // Strombogen zwischen den Rädern
    if ((t * 1.2) % 1 < 0.55) fxBolt(ctx, w * 0.24, h * 0.8, w * 0.76, h * 0.8, "#4fd0ff", Math.floor(t * 8), h * 0.05, 1.4);
  } },
  blitzrochen: { fg(e) { const { ctx, w, h, t } = e; // Blitze gleiten wie ein Rochen unterm Bauch entlang
    const x = w * (0.3 + ((t * 0.5) % 1) * 0.4);
    fxBolt(ctx, x, h * 0.72, x + w * 0.08, h * 0.72, "#b07aff", Math.floor(t * 9), h * 0.035, 1.3);
  } },

  // ---------------- Episch ----------------
  photon_gt: { fg(e) { const { ctx, w, h, t } = e; // Photonenstrahl aus dem Scheinwerfer
    ctx.save();
    ctx.globalAlpha = 0.3 + Math.sin(t * 3) * 0.15;
    const g = ctx.createLinearGradient(w * 0.92, 0, w * 1.15, 0);
    g.addColorStop(0, "rgba(255,250,220,0.9)");
    g.addColorStop(1, "rgba(255,250,220,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(w * 0.92, h * 0.5);
    ctx.lineTo(w * 1.15, h * 0.4 + Math.sin(t * 1.5) * h * 0.04);
    ctx.lineTo(w * 1.15, h * 0.68);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    fxTwinkle(ctx, w * 0.92, h * 0.51, w * 0.024, "#fffbe0", 0.6 + Math.sin(t * 5) * 0.4);
  } },
  quantensprung: { fg(e) { const { ctx, w, h, t } = e; // Quanten-Teleport-Flackern
    const ph = (t * 0.55) % 1;
    if (ph < 0.22) {
      const k = 1 - ph / 0.22;
      fxGhostBody(e, w * 0.1 * k, 0, 0.35 * k);
      fxGhostBody(e, -w * 0.1 * k, 0, 0.35 * k);
      fxRing(ctx, w * 0.5, h * 0.52, w * 0.2 + ph * w * 0.6, "#b07aff", k * 0.6, 1.5);
    }
  } },
  voltano: { bg(e) { const { ctx, w, h, t, gy } = e; // Lava-Glut unterm Wagen
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(t * 4) * 0.15;
    ctx.fillStyle = "#ff5a2a";
    ctx.beginPath();
    ctx.ellipse(w * 0.5, gy, w * 0.4, h * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, fg(e) { const { ctx, w, h, t, car } = e; // aufsteigende Glutpartikel
    for (let i = 0; i < 5; i++) {
      const p = (t * 0.5 + carRand(car, i)) % 1;
      fxPuff(ctx, w * (0.2 + carRand(car, i + 5) * 0.6) + Math.sin(p * 7 + i) * w * 0.015, h * 0.6 - p * h * 0.4, Math.max(1, w * 0.006), i % 2 ? "255,120,60" : "255,190,90", 1 - p);
    }
  } },
  neonstuermer: { fg(e) { const { ctx, w, h, t } = e; // Neonrand in wechselnder Farbe
    const col = `hsl(${(t * 70) % 360},100%,65%)`;
    ctx.save();
    ctx.strokeStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = w * 0.03;
    ctx.lineWidth = Math.max(1.5, w * 0.008);
    ctx.beginPath();
    ctx.moveTo(w * 0.06, h * 0.6);
    ctx.quadraticCurveTo(w * 0.08, h * 0.42, w * 0.24, h * 0.34);
    ctx.lineTo(w * 0.46, h * 0.22);
    ctx.lineTo(w * 0.68, h * 0.3);
    ctx.quadraticCurveTo(w * 0.86, h * 0.4, w * 0.94, h * 0.6);
    ctx.stroke();
    ctx.restore();
  } },
  titanblitz: { fg(e) { const { ctx, w, h, t } = e; // Blitzeinschlag aufs Dach
    const ph = (t * 0.45) % 1;
    if (ph < 0.15) {
      const k = 1 - ph / 0.15;
      fxBolt(ctx, w * 0.36, 0, w * 0.46, h * 0.24, "#cfe4ff", Math.floor(t * 3), w * 0.03, 2.2);
      fxTwinkle(ctx, w * 0.46, h * 0.24, w * 0.03 * k + w * 0.01, "#ffffff", k);
      fxRing(ctx, w * 0.46, h * 0.24, w * 0.03 + ph * w * 0.25, "#cfe4ff", k * 0.8, 1.5);
    }
  } },
  ionentiger: { fg(e) { const { ctx, w, h, t, car } = e; // pulsierende Tigerstreifen
    ctx.save();
    ctx.globalAlpha = Math.max(0.15, 0.5 + Math.sin(t * 3) * 0.35);
    ctx.strokeStyle = car.accent;
    ctx.lineWidth = Math.max(2, w * 0.014);
    ctx.lineCap = "round";
    ctx.shadowColor = car.accent;
    ctx.shadowBlur = w * 0.015;
    for (let i = 0; i < 3; i++) {
      const x = w * (0.34 + i * 0.12);
      ctx.beginPath();
      ctx.moveTo(x, h * 0.42);
      ctx.quadraticCurveTo(x - w * 0.03, h * 0.55, x + w * 0.01, h * 0.7);
      ctx.stroke();
    }
    ctx.restore();
  } },
  plasmapanther: { fg(e) { const { ctx, w, h, t } = e; // glühende Tatzen-Spur
    for (let i = 0; i < 2; i++) {
      const p = (t * 0.45 + i * 0.5) % 1, x = w * 0.18 - p * w * 0.14, y = h * 0.76;
      ctx.save();
      ctx.globalAlpha = (1 - p) * 0.8;
      ctx.fillStyle = "#ff5ad0";
      ctx.shadowColor = "#ff5ad0";
      ctx.shadowBlur = 4;
      ctx.beginPath(); ctx.arc(x, y, w * 0.011, 0, Math.PI * 2); ctx.fill();
      for (let z = 0; z < 3; z++) {
        ctx.beginPath();
        ctx.arc(x + (z - 1) * w * 0.012, y - h * 0.035, w * 0.005, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  } },
  hyperdrift: { fg(e) { const { ctx, w, h, t, car } = e; // Driftqualm + Speedlines
    for (let i = 0; i < 4; i++) {
      const p = (t * 0.7 + carRand(car, i)) % 1;
      fxPuff(ctx, w * 0.2 - p * w * 0.15, h * 0.74 - p * h * 0.1, w * 0.02 + p * w * 0.03, "220,220,225", (1 - p) * 0.4);
    }
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const p = (t * 1.6 + i / 3) % 1, x = w * (0.05 + p * 0.25);
      ctx.globalAlpha = (1 - p) * 0.6;
      ctx.beginPath();
      ctx.moveTo(x, h * (0.3 + i * 0.15)); ctx.lineTo(x + w * 0.07, h * (0.3 + i * 0.15));
      ctx.stroke();
    }
    ctx.restore();
  } },
  schockwelle: { fg(e) { const { ctx, w, h, t } = e; // Schockwellen-Ringe
    for (let i = 0; i < 2; i++) {
      const p = (t * 0.55 + i / 2) % 1;
      fxRing(ctx, w * 0.5, h * 0.55, w * 0.05 + p * w * 0.42, "#ffe45a", (1 - p) * 0.55, 2.5);
    }
  } },
  prisma_x: { fg(e) { const { ctx, w, h, t } = e; // Regenbogen-Prismenstrahlen
    const cols = ["#ff5a5a", "#ffd75a", "#5aff7a", "#5ab4ff", "#b45aff"];
    ctx.save();
    ctx.globalAlpha = 0.55;
    cols.forEach((c, i) => {
      const a = -0.9 + i * 0.18 + Math.sin(t * 1.2) * 0.08;
      ctx.strokeStyle = c;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(w * 0.55, h * 0.3);
      ctx.lineTo(w * 0.55 + Math.cos(a) * w * 0.4, h * 0.3 + Math.sin(a) * w * 0.4);
      ctx.stroke();
    });
    ctx.restore();
  } },

  // ---------------- Legendär ----------------
  quantenblitz: { fg(e) { const { ctx, w, h, t } = e; // tanzende Blitzbögen über der Karosserie
    const s = Math.floor(t * 7);
    fxBolt(ctx, w * (0.2 + ((s * 131) % 50) / 100), h * 0.35, w * (0.45 + ((s * 77) % 45) / 100), h * (0.25 + ((s * 53) % 30) / 100), "#9fdcff", s, w * 0.02, 1.5);
    if ((t * 7) % 1 < 0.5) fxBolt(ctx, w * 0.6, h * 0.28, w * 0.85, h * 0.4, "#dff2ff", s + 3, w * 0.018, 1.2);
  } },
  photon_supreme: { bg(e) { const { ctx, w, h, t } = e; // rotierender Strahlenkranz
    ctx.save();
    ctx.translate(w * 0.5, h * 0.52);
    ctx.rotate(t * 0.35);
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    for (let i = 0; i < 10; i++) {
      ctx.rotate(Math.PI / 5);
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(w * 0.5, -w * 0.035); ctx.lineTo(w * 0.5, w * 0.035);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }, fg(e) { const { ctx, w, h, t, car } = e;
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.6 + carRand(car, i)) % 1;
      if (ph < 0.25) fxTwinkle(ctx, w * (0.2 + carRand(car, i + 3) * 0.6), h * (0.25 + carRand(car, i + 6) * 0.35), w * 0.018, "#ffffff", 1 - ph * 4);
    }
  } },
  ewigkeitsmotor: { bg(e) { const { ctx, w, h, t } = e; // goldenes Uhrwerk dreht sich dahinter
    ctx.save();
    ctx.translate(w * 0.5, h * 0.54);
    ctx.rotate(t * 0.5);
    ctx.strokeStyle = "rgba(212,175,55,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, w * 0.36, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * w * 0.36, Math.sin(a) * w * 0.36);
      ctx.lineTo(Math.cos(a) * w * 0.41, Math.sin(a) * w * 0.41);
      ctx.stroke();
    }
    ctx.restore();
  }, fg(e) { const { ctx, w, h, t } = e;
    fxRing(ctx, w * 0.5, h * 0.54, w * 0.42, "#ffd75a", (0.5 + Math.sin(t * 2) * 0.3) * 0.35, 1.2);
  } },
  singularitaet_x: { bg(e) { const { ctx, w, h, t } = e; // Schwarzes Loch saugt Sterne an
    const cx = w * 0.5, cy = h * 0.5;
    ctx.save();
    ctx.strokeStyle = "rgba(122,90,255,0.5)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, w * (0.18 + i * 0.1), t * (1.2 - i * 0.3) + i * 2, t * (1.2 - i * 0.3) + i * 2 + 4);
      ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {
      const p = 1 - ((t * 0.4 + i / 6) % 1);
      const a = t * 1.5 + i * 1.05 + p * 4, r = p * w * 0.45;
      ctx.globalAlpha = 1 - p * 0.7;
      ctx.fillStyle = "#cfc0ff";
      ctx.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.55, 1.6, 1.6);
    }
    ctx.restore();
  } },
  sternenstaub_gt: { fg(e) { const { ctx, w, h, t, car } = e; // funkelnder Sternenstaub-Schweif
    for (let i = 0; i < 6; i++) {
      const p = (t * 0.5 + carRand(car, i)) % 1;
      const x = w * 0.2 - p * w * 0.18;
      const y = h * (0.35 + carRand(car, i + 6) * 0.3) + Math.sin(p * 6 + i) * h * 0.03;
      fxTwinkle(ctx, x, y, w * (0.006 + carRand(car, i + 12) * 0.01), "#d8b8ff", 1 - p);
    }
  } },
  voltgott: { bg(e) { const { ctx, w, h, t } = e; // göttliche Strom-Aura
    ctx.save();
    const a = 0.18 + Math.sin(t * 2.5) * 0.08;
    const g = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.05, w * 0.5, h * 0.5, w * 0.5);
    g.addColorStop(0, `rgba(63,240,255,${a})`);
    g.addColorStop(1, "rgba(63,240,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }, fg(e) { const { ctx, w, h, t } = e; // Blitze des Voltgotts + Blitzkrone
    const ph = (t * 0.8) % 1, s = Math.floor(t * 0.8);
    if (ph < 0.2) {
      fxBolt(ctx, w * 0.12, 0, w * 0.35, h * 0.3, "#bff8ff", s, w * 0.03, 2);
      fxBolt(ctx, w * 0.9, 0, w * 0.7, h * 0.28, "#bff8ff", s + 5, w * 0.03, 2);
    }
    if ((t * 5) % 1 < 0.6) fxBolt(ctx, w * 0.4, h * 0.16, w * 0.62, h * 0.18, "#eafcff", Math.floor(t * 10), w * 0.016, 1.2);
  } },
  zeitraffer_e: { bg(e) { // Zeitraffer-Nachbilder hinter dem Auto
    fxGhostBody(e, -e.w * 0.05, 0, 0.3);
    fxGhostBody(e, -e.w * 0.1, 0, 0.16);
    fxGhostBody(e, -e.w * 0.15, 0, 0.07);
  }, fg(e) { const { ctx, w, h, t } = e; // schwebende Uhr mit rasendem Zeiger
    const x = w * 0.18, y = h * 0.2, r = w * 0.035;
    ctx.save();
    ctx.strokeStyle = "#ffb46a";
    ctx.lineWidth = 1.4;
    ctx.shadowColor = "#ffb46a";
    ctx.shadowBlur = 3;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(t * 6) * r * 0.7, y + Math.sin(t * 6) * r * 0.7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(t * 0.5) * r * 0.45, y + Math.sin(t * 0.5) * r * 0.45); ctx.stroke();
    ctx.restore();
  } },
  unendlichkeitsantrieb: { fg(e) { const { ctx, w, h, t } = e; // Partikel auf einer Unendlich-Bahn
    const cx = w * 0.5, cy = h * 0.42, sx = w * 0.42, sy = h * 0.2;
    ctx.save();
    for (let i = 0; i < 10; i++) {
      const u = t * 1.1 - i * 0.07;
      const x = cx + Math.cos(u) * sx, y = cy + Math.sin(2 * u) * sy * 0.5;
      ctx.globalAlpha = (1 - i / 10) * 0.9;
      ctx.fillStyle = "#7dffc0";
      ctx.shadowColor = "#7dffc0";
      ctx.shadowBlur = i ? 0 : 5;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1, w * 0.008 * (1 - i / 12)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } },
  kosmosracer: { bg(e) { const { ctx, w, h, t, car } = e; // Nebelschwaden + funkelnde Sterne
    ctx.save();
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = i % 2 ? "#7a5aff" : "#3f8fd4";
      ctx.beginPath();
      ctx.ellipse(w * (0.25 + i * 0.25) + Math.sin(t * 0.4 + i) * w * 0.03, h * (0.3 + (i % 2) * 0.3), w * 0.14, h * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 8; i++) {
      const tw = 0.4 + Math.sin(t * 2 + i * 1.7) * 0.4;
      ctx.fillStyle = `rgba(255,255,255,${Math.max(0, tw)})`;
      ctx.fillRect(w * carRand(car, i), h * carRand(car, i + 8) * 0.9, 1.4, 1.4);
    }
    ctx.restore();
  }, fg(e) { const { ctx, w, h, t } = e; // kleiner Ringplanet im Orbit
    const a = t * 0.9, x = w * 0.5 + Math.cos(a) * w * 0.42, y = h * 0.45 + Math.sin(a) * h * 0.3;
    ctx.save();
    ctx.fillStyle = "#ffb46a";
    ctx.beginPath(); ctx.arc(x, y, w * 0.012, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,180,106,0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(x, y, w * 0.022, w * 0.007, -0.4, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  } },
  apex_volt: { fg(e) { const { ctx, w, h, t } = e; // die Blitzkrone des Champions
    const cx = w * 0.52, cy = h * 0.1;
    ctx.save();
    ctx.globalAlpha = 0.75 + Math.sin(t * 3) * 0.25;
    ctx.fillStyle = "#ffd43f";
    ctx.shadowColor = "#ffd43f";
    ctx.shadowBlur = w * 0.02;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.05, cy + h * 0.06); ctx.lineTo(cx - w * 0.05, cy);
    ctx.lineTo(cx - w * 0.025, cy + h * 0.035); ctx.lineTo(cx, cy - h * 0.02);
    ctx.lineTo(cx + w * 0.025, cy + h * 0.035); ctx.lineTo(cx + w * 0.05, cy);
    ctx.lineTo(cx + w * 0.05, cy + h * 0.06);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    if ((t * 1.1) % 1 < 0.25) {
      fxBolt(ctx, cx - w * 0.05, cy + h * 0.02, cx - w * 0.16, h * 0.3, "#ffe98a", Math.floor(t * 4), w * 0.02, 1.4);
      fxBolt(ctx, cx + w * 0.05, cy + h * 0.02, cx + w * 0.14, h * 0.32, "#ffe98a", Math.floor(t * 4) + 2, w * 0.02, 1.4);
    }
    fxRing(ctx, w * 0.5, h * 0.55, w * 0.4 + Math.sin(t * 2) * w * 0.02, "#ffd43f", 0.2, 1.5);
  } },
};

const GROUND_Y = { common: 0.78, uncommon: 0.78, rare: 0.78, epic: 0.8, legendary: 0.82 };
const SHADOW_SPREAD = { common: 0.4, uncommon: 0.42, rare: 0.44, epic: 0.46, legendary: 0.5 };

function renderCar(ctx, w, h, car, t) {
  const fx = CAR_FX[car.id] || {};
  const e = { ctx, w, h, t: t || 0, car, gy: h * GROUND_Y[car.rarity] };
  drawGroundShadow(ctx, w, h, e.gy, SHADOW_SPREAD[car.rarity]);
  if (fx.bg) fx.bg(e);
  ctx.save();
  if (fx.transform) fx.transform(e);
  CAR_BODY_FN[car.rarity](ctx, w, h, car);
  ctx.restore();
  if (fx.fg) fx.fg(e);
}

// Eine einzige rAF-Schleife animiert alle sichtbaren Karten-Icons (~30 fps
// reichen dafür völlig). Nicht mehr eingehängte Canvases werden automatisch
// aussortiert, unsichtbare (z. B. in geschlossenen Modals) übersprungen.
const ANIMATED_ICONS = new Map();
let iconLoopActive = false;
let lastIconFrame = 0;

function iconAnimFrame(now) {
  for (const cv of ANIMATED_ICONS.keys()) {
    if (!cv.isConnected) ANIMATED_ICONS.delete(cv);
  }
  if (ANIMATED_ICONS.size === 0) {
    iconLoopActive = false;
    return;
  }
  if (now - lastIconFrame >= 33) {
    lastIconFrame = now;
    const t = now / 1000;
    for (const [cv, car] of ANIMATED_ICONS) {
      if (cv.offsetParent === null) continue;
      const ctx = cv.getContext("2d");
      ctx.clearRect(0, 0, cv.width, cv.height);
      renderCar(ctx, cv.width, cv.height, car, t);
    }
  }
  requestAnimationFrame(iconAnimFrame);
}

function drawCarIcon(canvasEl, car) {
  ANIMATED_ICONS.set(canvasEl, car);
  const ctx = canvasEl.getContext("2d");
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  renderCar(ctx, canvasEl.width, canvasEl.height, car, performance.now() / 1000);
  if (!iconLoopActive) {
    iconLoopActive = true;
    requestAnimationFrame(iconAnimFrame);
  }
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
  btnOpenPack.disabled = credits < CHEAPEST_PACK_PRICE;
  btnGetOffer.disabled = ownedCars.length === 0;

  garageGrid.innerHTML = ownedCars.length
    ? groupByIdWithCount(ownedCars).map(({ id, count }) => carCardHTML(CAR_BY_ID[id], { count })).join("")
    : `<div class="empty-hint">Keine Autos mehr! Öffne einen Booster.</div>`;
  drawAllPendingCarIcons(garageGrid);

  abilityInventoryEl.innerHTML = ownedAbilities.length
    ? groupByIdWithCount(ownedAbilities).map(({ id, count }) => abilityCardHTML(ABILITY_BY_ID[id], { count })).join("")
    : `<div class="empty-hint">Noch keine Fähigkeitskarten.</div>`;

  saveGame();
}

// ---------------------------------------------------------------------
// Intro / Start
// ---------------------------------------------------------------------

// Gespeicherten Spielstand laden (falls vorhanden).
if (loadGame()) {
  btnStart.textContent = "Weiterspielen";
}

btnStart.addEventListener("click", () => {
  // Rostlaube ist kein Teil der 50er-Sammlung und zählt daher nicht mit.
  showScreen("hub");
  updateHub();
});

// ---------------------------------------------------------------------
// Booster kaufen: erst Sorte wählen (Auto/Fähigkeiten, Lv. 1/2), dann
// liegen die 5 Karten verdeckt da und werden einzeln angetippt.
// ---------------------------------------------------------------------

function drawPackCard(pack) {
  const rarity = pickWeightedRarity(pack.odds);
  if (pack.pool === "cars") {
    return { type: "car", item: randomFrom(carsOfRarity(rarity)) };
  }
  return { type: "ability", item: randomFrom(abilitiesOfRarity(rarity)) };
}

function renderPackChoose() {
  packChooseEl.innerHTML = Object.entries(PACK_TYPES).map(([id, p]) => `
    <button class="pack-option" data-pack="${id}" ${credits < p.price ? "disabled" : ""}>
      <div class="pack-art">${p.art}</div>
      <div class="pack-name">${p.name} <span class="pack-level${p.level === 2 ? " pack-level-2" : ""}">Lv. ${p.level}</span></div>
      <div class="pack-desc">${p.desc}</div>
      <div class="pack-price">${p.price} ⚡</div>
    </button>
  `).join("");
}

btnOpenPack.addEventListener("click", () => {
  renderPackChoose();
  packChooseEl.classList.remove("hidden");
  packReveal.classList.add("hidden");
  packCardsEl.innerHTML = "";
  btnPackDone.classList.add("hidden");
  openModal(packModal);
});

packChooseEl.addEventListener("click", (ev) => {
  const btn = ev.target.closest(".pack-option");
  if (!btn || btn.disabled) return;
  const pack = PACK_TYPES[btn.dataset.pack];
  if (!pack || credits < pack.price) return;
  buyPack(pack);
});

function buyPack(pack) {
  credits -= pack.price;

  lastPackCards = [];
  for (let i = 0; i < PACK_SIZE; i++) lastPackCards.push(drawPackCard(pack));

  // Die Karten gehören dem Spieler ab dem Kauf – auch wenn das Modal
  // vor dem Umdrehen geschlossen wird (wichtig fürs Autosave).
  for (const pull of lastPackCards) {
    if (pull.type === "car") {
      ownedCars.push(pull.item.id);
      discoveredCars.add(pull.item.id);
    } else {
      ownedAbilities.push(pull.item.id);
      discoveredAbilities.add(pull.item.id);
    }
  }
  updateHub();

  packChooseEl.classList.add("hidden");
  packReveal.classList.remove("hidden");
  btnPackDone.classList.add("hidden");
  packCardsEl.innerHTML = lastPackCards.map((pull, i) => {
    const inner = pull.type === "car" ? carCardHTML(pull.item) : abilityCardHTML(pull.item);
    return `
      <div class="pack-flip" style="animation-delay:${i * 0.12}s">
        <div class="pack-flip-inner">
          <div class="pack-face pack-back">
            <div class="pack-back-bolt">⚡</div>
            <div>VOLT</div>
            <div class="pack-back-hint">Antippen!</div>
          </div>
          <div class="pack-face pack-face-up">${inner}</div>
        </div>
      </div>
    `;
  }).join("");
  drawAllPendingCarIcons(packCardsEl);
}

packCardsEl.addEventListener("click", (ev) => {
  const flip = ev.target.closest(".pack-flip");
  if (!flip || flip.classList.contains("flipped")) return;
  flip.classList.add("flipped");
  if (packCardsEl.querySelectorAll(".pack-flip:not(.flipped)").length === 0) {
    btnPackDone.classList.remove("hidden");
  }
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
    teleport: 0,
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
    if (fx.teleport) e.teleport += fx.teleport;
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
  // Ein Teleport wirkt als direkter Sprung nach vorn auf den Rennwurf.
  const playerRoll = playerBase * (effects.luckFloor + Math.random() * rollRange + 0.15) * (1 + effects.teleport);
  const opponentRoll = opponentBase * (0.85 + Math.random() * 0.3);

  const playerWins = effects.guaranteedWin || playerRoll >= opponentRoll;
  return { playerWins, playerBase, opponentBase, playerRoll, opponentRoll };
}

function runRace() {
  const playerCar = CAR_BY_ID[raceSelection.carId];
  const opponentCar = currentOffer.car;
  const effects = combineEffects(raceSelection.abilityIds);
  const outcome = resolveRace(playerCar, opponentCar, effects);

  animateRace(playerCar, opponentCar, outcome.playerWins, effects.teleport > 0, () => {
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

function animateRace(playerCar, opponentCar, playerWins, teleportUsed, onDone) {
  const ctx = raceCanvas.getContext("2d");
  const w = raceCanvas.width, h = raceCanvas.height;
  const trackStart = w * 0.08, trackEnd = w * 0.92;
  const laneY = [h * 0.35, h * 0.7];
  const TELEPORT_AT = 0.38; // Zeitpunkt des sichtbaren Teleport-Sprungs

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
    renderCar(ctx, cw, chh, car, performance.now() / 1000);
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

    let playerX = trackStart + (trackEnd - trackStart) * eased * playerPace;
    const oppX = trackStart + (trackEnd - trackStart) * eased * opponentPace;
    const bob1 = Math.sin(elapsed / 90) * 2;
    const bob2 = Math.sin(elapsed / 90 + 1.4) * 2;

    if (teleportUsed) {
      // Vor dem Sprung hängt das Auto sichtbar zurück, dann schnappt es
      // nach vorn – am Ziel stimmt die Position wieder mit dem Ergebnis überein.
      const dist = (trackEnd - trackStart) * playerPace;
      if (t < TELEPORT_AT) {
        playerX -= dist * 0.12 * (1 - (t / TELEPORT_AT) * 0.4);
      } else {
        playerX += dist * 0.03 * (1 - (t - TELEPORT_AT) / (1 - TELEPORT_AT));
      }
    }

    drawSmallCar(playerCar, playerX, laneY[0] + bob1, 1);
    drawSmallCar(opponentCar, oppX, laneY[1] + bob2, 1);

    if (teleportUsed && Math.abs(t - TELEPORT_AT) < 0.06) {
      // Portal-Effekt: Ring am Austritt, Ring am Eintritt, Energiespur dazwischen.
      const k = 1 - Math.abs(t - TELEPORT_AT) / 0.06;
      const fromX = playerX - (trackEnd - trackStart) * playerPace * 0.14;
      fxRing(ctx, playerX, laneY[0], 10 + (1 - k) * 34, "#7a5aff", k, 3);
      fxRing(ctx, fromX, laneY[0], 8 + (1 - k) * 26, "#3fe0d4", k * 0.8, 2);
      ctx.save();
      ctx.globalAlpha = k * 0.9;
      ctx.strokeStyle = "#bfa8ff";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#7a5aff";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(fromX, laneY[0]);
      ctx.lineTo(playerX, laneY[0]);
      ctx.stroke();
      ctx.restore();
    }

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
