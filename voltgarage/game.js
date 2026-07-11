"use strict";

/* =========================================================================
   Voltgarage
   Ein Sammelkarten-Rennspiel: Booster öffnen (wie bei Sammelkarten), damit
   Elektro-Rennwagen und Fähigkeitskarten sammeln, gegen Gegner antreten.
   Verlierst du ein Rennen, gehört dein eingesetztes Auto danach dem Gegner
   – deshalb muss man riskante Angebote auch mal ablehnen können.
   ========================================================================= */

const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary", "goettlich"];
const RARITY_LABEL = {
  common: "Gewöhnlich", uncommon: "Ungewöhnlich", rare: "Selten",
  epic: "Episch", legendary: "Legendär", goettlich: "Göttlich",
};

const PACK_SIZE = 5;
const STARTING_CREDITS = 300;
const MAX_STAT = 140; // Göttliche Autos sprengen die alte 100er-Skala.

// Booster-Sortiment: Auto- und Fähigkeiten-Booster, jeweils Level 1 und 2.
// Level 2 kostet deutlich mehr, hat dafür stark verbesserte Seltenheits-Chancen.
// Göttliche Autos gibt es NUR im Auto-Booster Lv. 2 (Fähigkeiten haben keine
// göttliche Stufe, deshalb eigene Odds für die Fähigkeiten-Booster).
const LV1_CAR_ODDS = { common: 50, uncommon: 28, rare: 14, epic: 6, legendary: 2, goettlich: 0 };
const LV2_CAR_ODDS = { common: 15, uncommon: 28, rare: 29, epic: 16, legendary: 9, goettlich: 3 };
const LV1_ABILITY_ODDS = { common: 50, uncommon: 28, rare: 14, epic: 6, legendary: 2 };
const LV2_ABILITY_ODDS = { common: 16, uncommon: 30, rare: 30, epic: 16, legendary: 8 };
const PACK_TYPES = {
  auto1: { name: "Auto-Booster", level: 1, art: "📦", price: 150, pool: "cars", odds: LV1_CAR_ODDS, desc: "5 Auto-Karten" },
  auto2: { name: "Auto-Booster", level: 2, art: "🏆", price: 450, pool: "cars", odds: LV2_CAR_ODDS, desc: "5 Auto-Karten, viel bessere Chancen – nur hier gibt es göttliche Autos!" },
  skill1: { name: "Fähigkeiten-Booster", level: 1, art: "🎴", price: 120, pool: "abilities", odds: LV1_ABILITY_ODDS, desc: "5 Fähigkeitskarten" },
  skill2: { name: "Fähigkeiten-Booster", level: 2, art: "✨", price: 360, pool: "abilities", odds: LV2_ABILITY_ODDS, desc: "5 Fähigkeitskarten, viel bessere Chancen auf seltene Karten" },
};
const CHEAPEST_PACK_PRICE = Math.min(...Object.values(PACK_TYPES).map((p) => p.price));

// Gegner-Autos sind im Schnitt etwas herausfordernder verteilt als Booster.
const OPPONENT_ODDS = { common: 33, uncommon: 29, rare: 20, epic: 10, legendary: 6, goettlich: 2 };

const REWARD_BY_RARITY = { common: 20, uncommon: 40, rare: 70, epic: 120, legendary: 200, goettlich: 400 };

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

  // Göttlich – Stats jenseits der 100er-Skala, schweben statt zu rollen.
  { id: "zeus_x", name: "Zeus-X", rarity: "goettlich", speed: 140, accel: 128, handling: 118, color: "#f8f4ff", accent: "#ffd75a" },
  { id: "helios_prime", name: "Helios Prime", rarity: "goettlich", speed: 132, accel: 135, handling: 122, color: "#ffdf7a", accent: "#ff9a3c" },
  { id: "chronos_omega", name: "Chronos Omega", rarity: "goettlich", speed: 128, accel: 122, handling: 138, color: "#b8f4ff", accent: "#7a5aff" },
  { id: "walhalla_gt", name: "Walhalla GT", rarity: "goettlich", speed: 135, accel: 118, handling: 130, color: "#dfe8ff", accent: "#8fb8ff" },
  { id: "nova_divina", name: "Nova Divina", rarity: "goettlich", speed: 130, accel: 140, handling: 120, color: "#ffb8f4", accent: "#ff5ae0" },
  { id: "aether_unendlich", name: "Aether Unendlich", rarity: "goettlich", speed: 138, accel: 132, handling: 134, color: "#c8ffe8", accent: "#3fe0d4" },
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
  { id: "diebstahlsicherung", name: "Diebstahlsicherung", rarity: "uncommon", desc: "+15% Bonus-Credits fürs Ausschlachten des erbeuteten Autos", effects: { stealChanceBonus: 0.15 } },

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
  { id: "kopfgeldjaeger1", name: "Kopfgeldjäger I", rarity: "rare", desc: "+30% Bonus-Credits fürs Ausschlachten des erbeuteten Autos", effects: { stealChanceBonus: 0.30 } },
  { id: "kurzteleport", name: "Kurz-Teleport", rarity: "rare", desc: "Aktiv im Rennen: Teleport-Sprung ein Stück nach vorn", effects: { teleport: 0.25 } },
  { id: "oelfalle", name: "Ölfalle", rarity: "rare", desc: "Aktiv im Rennen: Ölspur – der Gegner rutscht und wird stark gebremst", effects: { trap: 0.35 } },

  // Episch
  { id: "nitro2", name: "Nitro-Schub II", rarity: "epic", desc: "+40% Tempo", effects: { speedBoost: 0.40 } },
  { id: "praezision2", name: "Präzisionslenkung II", rarity: "epic", desc: "+40% Handling", effects: { handlingBoost: 0.40 } },
  { id: "launchcontrol2", name: "Launch-Control II", rarity: "epic", desc: "+40% Beschleunigung", effects: { accelBoost: 0.40 } },
  { id: "systemausfall", name: "Systemausfall", rarity: "epic", desc: "Gegner −30% auf alle Werte", effects: { oppAllDebuff: 0.30 } },
  { id: "allesysteme2", name: "Alle Systeme II", rarity: "epic", desc: "+20% auf alle eigenen Werte", effects: { allBoost: 0.20 } },
  { id: "perfekterstart", name: "Perfekter Start", rarity: "epic", desc: "Garantiert kein negativer Zufallswert", effects: { luckFloor: 1.0, guaranteedNoBadRoll: true } },
  { id: "hauptgewinn", name: "Hauptgewinn", rarity: "epic", desc: "+120% Belohnung bei Sieg", effects: { rewardMult: 2.20 } },
  { id: "vollversicherung", name: "Vollversicherung", rarity: "epic", desc: "75% Chance, Auto bei Niederlage zu behalten", effects: { keepCarChance: 0.75 } },
  { id: "kopfgeldjaeger2", name: "Kopfgeldjäger II", rarity: "epic", desc: "+55% Bonus-Credits fürs Ausschlachten des erbeuteten Autos", effects: { stealChanceBonus: 0.55 } },
  { id: "doppelzug", name: "Doppelzug", rarity: "epic", desc: "Nach dem Rennen: 100 Bonus-Credits", effects: { bonusCreditsAlways: 100 } },
  { id: "blitzteleport", name: "Blitz-Teleport", rarity: "epic", desc: "Aktiv im Rennen: großer Teleport-Sprung nach vorn", effects: { teleport: 0.45 } },
  { id: "geist", name: "Geist", rarity: "epic", desc: "Aktiv im Rennen: Geisterform – gegnerische Angriffe gehen durch dich hindurch", effects: { ghost: true } },

  // Legendär
  { id: "quantensprung_a", name: "Quantensprung", rarity: "legendary", desc: "+55% auf alle eigenen Werte", effects: { allBoost: 0.55 } },
  { id: "totalschaden", name: "Totalschaden", rarity: "legendary", desc: "Gegner −45% auf alle Werte", effects: { oppAllDebuff: 0.45 } },
  { id: "unbesiegbar", name: "Unbesiegbar", rarity: "legendary", desc: "Auto ist bei Niederlage garantiert sicher", effects: { keepCarChance: 1.0 } },
  { id: "zeitmanipulation", name: "Zeitmanipulation", rarity: "legendary", desc: "Garantierter Sieg in diesem Rennen", effects: { guaranteedWin: true } },
  { id: "goldrausch", name: "Goldrausch", rarity: "legendary", desc: "+250% Belohnung bei Sieg", effects: { rewardMult: 3.50 } },
  { id: "autodieb", name: "Autodieb", rarity: "legendary", desc: "+100% Bonus-Credits fürs Ausschlachten des erbeuteten Autos", effects: { stealChanceBonus: 1.0 } },
  { id: "phoenix", name: "Phönix", rarity: "legendary", desc: "Auto sicher bei Niederlage + Trost-Credits", effects: { keepCarChance: 1.0, refundOnLoss: 60 } },
  { id: "systemkollaps", name: "Systemkollaps", rarity: "legendary", desc: "Gegner-Werte halbiert (−50%)", effects: { oppAllDebuff: 0.50 } },
  { id: "meisterstratege", name: "Meisterstratege", rarity: "legendary", desc: "+35% eigene Werte, Gegner −20%", effects: { allBoost: 0.35, oppAllDebuff: 0.20 } },
  { id: "singularitaet", name: "Singularität", rarity: "legendary", desc: "Garantierter Sieg + 100% Bonus-Credits fürs Ausschlachten des erbeuteten Autos", effects: { guaranteedWin: true, stealChanceBonus: 1.0 } },
  { id: "portalmeister", name: "Portal-Meister", rarity: "legendary", desc: "Aktiv im Rennen: riesiger Teleport-Sprung – und bei Niederlage teleportiert sich dein Auto sicher nach Hause", effects: { teleport: 0.7, keepCarChance: 1.0 } },
  { id: "schockfalle", name: "Schockfalle", rarity: "legendary", desc: "Aktiv im Rennen: Elektrofalle – legt den Gegner kurz komplett lahm", effects: { trap: 0.65 } },
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
const raceAbilityBar = document.getElementById("race-ability-bar");
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

function statBarRow(label, value, statClass) {
  const pct = Math.min(100, (value / MAX_STAT) * 100);
  return `
    <div class="stat-bar-row">
      <span class="stat-bar-label">${label}</span>
      <div class="stat-bar-track"><div class="stat-bar-fill ${statClass || ""}" style="width:${pct}%"></div></div>
      <span class="stat-bar-value">${value}</span>
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
        ${statBarRow("T", car.speed, "stat-t")}
        ${statBarRow("B", car.accel, "stat-b")}
        ${statBarRow("H", car.handling, "stat-h")}
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

function drawCarGoettlich(ctx, w, h, car) {
  const color = car.color, accent = car.accent;
  const gy = h * 0.8;
  const hover = h * 0.08; // schwebt über dem Boden
  const by = gy - hover;  // Unterkante der Karosserie

  // Energiefeld unter dem schwebenden Wagen
  ctx.save();
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.ellipse(w * 0.5, gy, w * 0.4, h * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.5;
  for (const px of [w * 0.24, w * 0.5, w * 0.76]) {
    ctx.beginPath();
    ctx.moveTo(px, by);
    ctx.lineTo(px - w * 0.015, gy);
    ctx.lineTo(px + w * 0.015, gy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Extrem flache, gestreckte Karosserie mit Kanzel-Cockpit
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = w * 0.06;
  ctx.beginPath();
  ctx.moveTo(w * 0.04, by);
  ctx.quadraticCurveTo(w * 0.06, by - h * 0.16, w * 0.24, by - h * 0.2);
  ctx.lineTo(w * 0.42, by - h * 0.34);
  ctx.quadraticCurveTo(w * 0.55, by - h * 0.42, w * 0.68, by - h * 0.32);
  ctx.quadraticCurveTo(w * 0.88, by - h * 0.2, w * 0.97, by - h * 0.06);
  ctx.lineTo(w * 0.96, by);
  ctx.closePath();
  ctx.fillStyle = bodyGradient(ctx, color, by - h * 0.44, by);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = shadeColor(color, -0.35);
  ctx.lineWidth = Math.max(1, w * 0.006);
  ctx.stroke();

  // Kanzel (Glaskuppel)
  drawWindowGlass(ctx, [
    [w * 0.44, by - h * 0.33], [w * 0.56, by - h * 0.38],
    [w * 0.66, by - h * 0.3], [w * 0.6, by - h * 0.2], [w * 0.46, by - h * 0.2],
  ]);

  // Energie-Ader längs der Flanke
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.shadowColor = accent;
  ctx.shadowBlur = w * 0.02;
  ctx.lineWidth = Math.max(1.5, w * 0.012);
  ctx.beginPath();
  ctx.moveTo(w * 0.08, by - h * 0.1);
  ctx.quadraticCurveTo(w * 0.5, by - h * 0.02, w * 0.92, by - h * 0.08);
  ctx.stroke();
  ctx.restore();

  // Heckflosse + Lichter
  ctx.fillStyle = accent;
  ctx.fillRect(w * 0.06, by - h * 0.34, w * 0.03, h * 0.28);
  drawHeadlight(ctx, w * 0.95, by - h * 0.08, w * 0.032, true);
  drawTaillight(ctx, w * 0.05, by - h * 0.1, w * 0.028, true);
}

const CAR_BODY_FN = {
  common: drawCarCommon,
  uncommon: drawCarUncommon,
  rare: drawCarRare,
  epic: drawCarEpic,
  legendary: drawCarLegendary,
  goettlich: drawCarGoettlich,
};

// ---- Heckansicht für die Ego-Perspektive im Rennen ----
// Zeichnet ein Auto von hinten, zentriert um (0,0), Breite cw / Höhe ch.
function drawCarRear(ctx, cw, ch, car) {
  const rank = RARITY_ORDER.indexOf(car.rarity);
  const color = car.color, accent = car.accent;
  const divine = car.rarity === "goettlich";
  const bodyBottom = divine ? ch * 0.34 : ch * 0.44;

  ctx.save();
  ctx.translate(-cw / 2, -ch / 2);

  if (divine) {
    // Schwebe-Energiefeld statt Rädern
    ctx.save();
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.ellipse(cw * 0.5, ch * 0.9, cw * 0.42, ch * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Hinterreifen links/rechts
    ctx.fillStyle = "#14171b";
    ctx.fillRect(cw * 0.02, ch * 0.55, cw * 0.16, ch * 0.4);
    ctx.fillRect(cw * 0.82, ch * 0.55, cw * 0.16, ch * 0.4);
    ctx.fillStyle = "#3a3f46";
    ctx.fillRect(cw * 0.05, ch * 0.62, cw * 0.1, ch * 0.26);
    ctx.fillRect(cw * 0.85, ch * 0.62, cw * 0.1, ch * 0.26);
  }

  // Karosserie (Heck), leicht trapezförmig, mit Verlaufsschattierung
  ctx.save();
  if (rank >= 4) { ctx.shadowColor = accent; ctx.shadowBlur = cw * 0.08; }
  ctx.beginPath();
  ctx.moveTo(cw * 0.08, ch * 0.92);
  ctx.lineTo(cw * 0.1, bodyBottom);
  ctx.quadraticCurveTo(cw * 0.5, bodyBottom - ch * 0.14, cw * 0.9, bodyBottom);
  ctx.lineTo(cw * 0.92, ch * 0.92);
  ctx.closePath();
  ctx.fillStyle = bodyGradient(ctx, color, bodyBottom - ch * 0.14, ch * 0.92);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = shadeColor(color, -0.35);
  ctx.lineWidth = Math.max(1, cw * 0.012);
  ctx.stroke();

  // Heckscheibe
  ctx.save();
  const g = ctx.createLinearGradient(0, bodyBottom - ch * 0.08, 0, bodyBottom + ch * 0.16);
  g.addColorStop(0, "rgba(150,190,215,0.7)");
  g.addColorStop(1, "rgba(28,42,58,0.85)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cw * 0.24, bodyBottom + ch * 0.16);
  ctx.lineTo(cw * 0.28, bodyBottom - ch * 0.02);
  ctx.quadraticCurveTo(cw * 0.5, bodyBottom - ch * 0.1, cw * 0.72, bodyBottom - ch * 0.02);
  ctx.lineTo(cw * 0.76, bodyBottom + ch * 0.16);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Spoiler ab Episch
  if (rank >= 3) {
    ctx.fillStyle = accent;
    ctx.fillRect(cw * 0.12, bodyBottom - ch * 0.16, cw * 0.045, ch * 0.14);
    ctx.fillRect(cw * 0.835, bodyBottom - ch * 0.16, cw * 0.045, ch * 0.14);
    ctx.fillRect(cw * 0.08, bodyBottom - ch * 0.2, cw * 0.84, ch * 0.06);
  }

  // Rücklichter (glühend)
  ctx.save();
  ctx.fillStyle = "#ff4040";
  ctx.shadowColor = "#ff4040";
  ctx.shadowBlur = cw * 0.06;
  ctx.beginPath();
  ctx.roundRect(cw * 0.13, ch * 0.56, cw * 0.2, ch * 0.09, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(cw * 0.67, ch * 0.56, cw * 0.2, ch * 0.09, 3);
  ctx.fill();
  ctx.restore();

  // Kennzeichen
  ctx.fillStyle = "#e8e8e0";
  ctx.fillRect(cw * 0.41, ch * 0.68, cw * 0.18, ch * 0.1);
  ctx.fillStyle = "#333";
  ctx.font = `bold ${Math.max(4, ch * 0.075)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("VOLT", cw * 0.5, ch * 0.76);

  ctx.restore();
}

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
  // ---------------- Göttlich ----------------
  zeus_x: { bg(e) { const { ctx, w, h, t } = e; // Gewitterwolke über dem Wagen
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#3a4258";
    for (const [ox, r] of [[-0.1, 0.07], [0, 0.09], [0.1, 0.07]]) {
      ctx.beginPath();
      ctx.arc(w * (0.5 + ox), h * 0.08, w * r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }, fg(e) { const { ctx, w, h, t } = e; // Zeus wirft Blitze
    const ph = (t * 1.1) % 1, s = Math.floor(t * 1.1);
    if (ph < 0.18) {
      const tx = w * (0.3 + ((s * 173) % 40) / 100);
      fxBolt(ctx, w * 0.5, h * 0.1, tx, h * 0.4, "#ffef9a", s, w * 0.035, 2.4);
      fxTwinkle(ctx, tx, h * 0.42, w * 0.024, "#fff8d0", 1 - ph / 0.18);
    }
  } },
  helios_prime: { bg(e) { const { ctx, w, h, t } = e; // lodernde Sonnenkorona
    ctx.save();
    ctx.translate(w * 0.5, h * 0.5);
    ctx.rotate(t * 0.6);
    ctx.strokeStyle = "rgba(255,170,60,0.55)";
    ctx.lineWidth = Math.max(1.5, w * 0.012);
    for (let i = 0; i < 12; i++) {
      ctx.rotate(Math.PI / 6);
      const flick = 1 + Math.sin(t * 5 + i) * 0.2;
      ctx.beginPath();
      ctx.moveTo(w * 0.34, 0);
      ctx.lineTo(w * 0.42 * flick, 0);
      ctx.stroke();
    }
    ctx.restore();
  }, fg(e) { const { ctx, w, h, t } = e;
    ctx.save();
    const a = 0.2 + Math.sin(t * 3) * 0.1;
    const g = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.02, w * 0.5, h * 0.5, w * 0.45);
    g.addColorStop(0, `rgba(255,200,90,${a})`);
    g.addColorStop(1, "rgba(255,200,90,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } },
  chronos_omega: { bg(e) { // Zeit-Nachbilder in beide Richtungen
    fxGhostBody(e, -e.w * 0.06, 0, 0.18);
    fxGhostBody(e, e.w * 0.06, 0, 0.18);
  }, fg(e) { const { ctx, w, h, t } = e; // tickende Zeit-Ringe
    for (let i = 0; i < 2; i++) {
      const p = (t * 0.4 + i / 2) % 1;
      fxRing(ctx, w * 0.5, h * 0.5, w * 0.1 + p * w * 0.36, "#7a5aff", (1 - p) * 0.5, 1.6);
    }
    const a = Math.floor(t * 4) * (Math.PI / 6); // tickt in Schritten statt fließend
    ctx.save();
    ctx.strokeStyle = "#b8f4ff";
    ctx.lineWidth = 1.6;
    ctx.shadowColor = "#b8f4ff";
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.5);
    ctx.lineTo(w * 0.5 + Math.cos(a) * w * 0.09, h * 0.5 + Math.sin(a) * w * 0.09);
    ctx.stroke();
    ctx.restore();
  } },
  walhalla_gt: { fg(e) { const { ctx, w, h, t, car } = e; // aufsteigende leuchtende Runen
    const runes = ["ᚠ", "ᚱ", "ᛟ", "ᛗ", "ᛞ"];
    ctx.save();
    ctx.textAlign = "center";
    for (let i = 0; i < 4; i++) {
      const p = (t * 0.3 + carRand(car, i)) % 1;
      ctx.globalAlpha = Math.sin(Math.PI * p) * 0.9;
      ctx.fillStyle = "#8fb8ff";
      ctx.shadowColor = "#8fb8ff";
      ctx.shadowBlur = 6;
      ctx.font = `${Math.max(8, w * 0.05)}px serif`;
      ctx.fillText(runes[i % runes.length], w * (0.2 + carRand(car, i + 4) * 0.6), h * 0.55 - p * h * 0.4);
    }
    ctx.restore();
  } },
  nova_divina: { fg(e) { const { ctx, w, h, t } = e; // Supernova-Pulse
    const p = (t * 0.5) % 1;
    ctx.save();
    const g = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.01, w * 0.5, h * 0.5, w * 0.06 + p * w * 0.44);
    g.addColorStop(0, `rgba(255,90,224,${(1 - p) * 0.35})`);
    g.addColorStop(0.7, `rgba(255,184,244,${(1 - p) * 0.18})`);
    g.addColorStop(1, "rgba(255,184,244,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    fxRing(ctx, w * 0.5, h * 0.5, w * 0.06 + p * w * 0.44, "#ff5ae0", (1 - p) * 0.7, 2);
    fxTwinkle(ctx, w * 0.5, h * 0.32, w * 0.02, "#ffd0f4", 0.5 + Math.sin(t * 6) * 0.4);
  } },
  aether_unendlich: { bg(e) { const { ctx, w, h, t } = e; // schimmernde Aurora-Bänder
    ctx.save();
    for (let b = 0; b < 3; b++) {
      const hue = 150 + b * 40 + Math.sin(t * 0.8 + b) * 20;
      ctx.strokeStyle = `hsla(${hue},90%,65%,0.4)`;
      ctx.lineWidth = Math.max(2, h * 0.05);
      ctx.beginPath();
      for (let s = 0; s <= 10; s++) {
        const x = w * (s / 10);
        const y = h * (0.18 + b * 0.08) + Math.sin(s * 0.9 + t * (1.2 + b * 0.3)) * h * 0.05;
        s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
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

const GROUND_Y = { common: 0.78, uncommon: 0.78, rare: 0.78, epic: 0.8, legendary: 0.82, goettlich: 0.8 };
const SHADOW_SPREAD = { common: 0.4, uncommon: 0.42, rare: 0.44, epic: 0.46, legendary: 0.5, goettlich: 0.52 };

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
    rewardMult: 1, keepCarChance: 0,
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
    // Das erbeutete Auto gibt es bei einem Sieg ohnehin garantiert – dieser
    // Wert wirkt daher nur noch als Bonus-Multiplikator auf die Credits.
    if (fx.stealChanceBonus) e.rewardMult *= 1 + fx.stealChanceBonus;
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

// ---------------------------------------------------------------------
// Rennen: Live-Simulation aus der Ego-/Verfolgerperspektive.
// Beide Autos fahren von allein; die Geschwindigkeit kommt direkt aus den
// Stats (doppelter Score = fast doppelt so schnell – der Unterschied ist
// wirklich spürbar). Aktive Fähigkeiten (Nitro, Teleport, Fallen, Geist …)
// liegen während des Rennens als Buttons unter der Strecke und werden erst
// beim Drücken gezündet. Gegner können angreifen – außer man ist ein Geist.
// ---------------------------------------------------------------------

const RACE_LENGTH = 800; // Meter – deutlich längere Strecke
const RACE_VIEW_DIST = 240; // wie weit die Kamera nach vorn schaut (m)

// Welche Effekt-Felder machen eine Karte im Rennen "aktiv" (Button)?
const ACTIVE_EFFECT_KEYS = [
  "speedBoost", "accelBoost", "handlingBoost", "allBoost",
  "oppSpeedDebuff", "oppAccelDebuff", "oppHandlingDebuff", "oppAllDebuff",
  "teleport", "trap", "ghost",
];

function isActiveAbility(ab) {
  return ACTIVE_EFFECT_KEYS.some((k) => ab.effects[k]);
}

function abilityEmoji(ab) {
  const fx = ab.effects;
  if (fx.ghost) return "👻";
  if (fx.trap) return "🛢️";
  if (fx.teleport) return "🌀";
  if (fx.oppSpeedDebuff || fx.oppAccelDebuff || fx.oppHandlingDebuff || fx.oppAllDebuff) return "💥";
  if (fx.speedBoost || fx.allBoost) return "🔥";
  if (fx.accelBoost) return "⚡";
  if (fx.handlingBoost) return "🌀";
  return "✨";
}

function topSpeedFromScore(score) {
  return 45 + score * 0.85; // m/s – Rostlaube ~200 km/h, Göttlich ~550 km/h
}

let raceRuntime = null;

function renderRaceAbilityBar() {
  const parts = raceSelection.abilityIds.map((id) => {
    const ab = ABILITY_BY_ID[id];
    if (isActiveAbility(ab)) {
      return `<button class="race-ability-btn" data-race-ability="${id}" disabled>
        <span class="race-ability-emoji">${abilityEmoji(ab)}</span>${ab.name}
      </button>`;
    }
    return `<div class="race-passive-chip">🎗 ${ab.name} <span>passiv</span></div>`;
  });
  raceAbilityBar.innerHTML = parts.join("") || `<div class="race-passive-chip">Keine Fähigkeiten dabei</div>`;
}

raceAbilityBar.addEventListener("click", (ev) => {
  const btn = ev.target.closest(".race-ability-btn");
  if (!btn || btn.disabled) return;
  btn.disabled = true;
  btn.classList.add("race-ability-used");
  activateRaceAbility(btn.dataset.raceAbility);
});

function activateRaceAbility(id) {
  const rt = raceRuntime;
  if (!rt || rt.done || !rt.running) return;
  const fx = ABILITY_BY_ID[id].effects;
  const now = performance.now();
  rt.activatedIds.push(id);

  const boost = (fx.speedBoost || 0) * 0.9 + (fx.allBoost || 0) * 0.9 +
    (fx.accelBoost || 0) * 0.5 + (fx.handlingBoost || 0) * 0.35;
  if (boost > 0) {
    rt.player.boostMult *= 1 + boost;
    rt.player.v *= 1 + (fx.accelBoost || 0) * 0.3;
    rt.nitroUntil = now + 1600;
    rt.msgs.push({ text: `🔥 ${ABILITY_BY_ID[id].name}!`, until: now + 1500, color: "#ffb84a" });
  }

  const debuff = (fx.oppSpeedDebuff || 0) + (fx.oppAccelDebuff || 0) +
    (fx.oppHandlingDebuff || 0) + (fx.oppAllDebuff || 0) * 1.6;
  if (debuff > 0) {
    rt.opp.slowUntil = now + 2600;
    rt.opp.slowFactor = 1 - Math.min(0.8, debuff * 0.9);
    rt.opp.hitFlashUntil = now + 700;
    rt.msgs.push({ text: `💥 ${ABILITY_BY_ID[id].name} trifft den Gegner!`, until: now + 1500, color: "#ff7a5a" });
  }

  if (fx.trap) {
    rt.opp.slowUntil = now + 3200;
    rt.opp.slowFactor = 1 - Math.min(0.9, fx.trap);
    rt.opp.skidUntil = now + 3200;
    rt.oilAtDist = rt.opp.dist + 4;
    rt.oilUntil = now + 3500;
    rt.msgs.push({ text: `🛢️ ${ABILITY_BY_ID[id].name}! Der Gegner rutscht!`, until: now + 1800, color: "#ffd75a" });
  }

  if (fx.teleport) {
    rt.player.dist += fx.teleport * 120;
    rt.teleportFlashUntil = now + 700;
    rt.msgs.push({ text: `🌀 Teleport!`, until: now + 1400, color: "#b8a0ff" });
  }

  if (fx.ghost) {
    rt.ghost = true;
    rt.msgs.push({ text: `👻 Geisterform aktiv – unverwundbar!`, until: now + 1800, color: "#c8e8ff" });
  }
}

function runRace() {
  const playerCar = CAR_BY_ID[raceSelection.carId];
  const oppCar = currentOffer.car;

  const passiveIds = raceSelection.abilityIds.filter((id) => !isActiveAbility(ABILITY_BY_ID[id]));
  const pFx = combineEffects(passiveIds);

  // Zufalls-Streuung: Glücksbringer (luckFloor) nimmt das Pech raus.
  const playerNoise = pFx.luckFloor >= 1 ? 1 + Math.random() * 0.05 : 0.93 + Math.random() * 0.14;
  const oppNoise = 0.93 + Math.random() * 0.14;

  const playerTop = topSpeedFromScore(carScore(playerCar, 0, 0, 0)) * playerNoise;
  let oppTop = topSpeedFromScore(carScore(oppCar, 0, 0, 0)) * oppNoise;
  if (pFx.guaranteedWin) oppTop = Math.min(oppTop, playerTop * 0.8);

  // Gegner-Angriffe: je seltener das Gegner-Auto, desto angriffslustiger.
  const aggr = { common: 0.25, uncommon: 0.35, rare: 0.5, epic: 0.65, legendary: 0.8, goettlich: 0.95 }[oppCar.rarity] || 0.3;
  const attacks = [];
  if (Math.random() < aggr) attacks.push(2000 + Math.random() * 3000);
  if (Math.random() < aggr * 0.5) attacks.push(5500 + Math.random() * 3000);

  raceRuntime = {
    playerCar, oppCar, passiveIds,
    activatedIds: [], consumedIds: [],
    pFx,
    player: { dist: 0, v: 0, top: playerTop, accel: playerCar.accel, handling: playerCar.handling, boostMult: 1, slowUntil: 0, slowFactor: 1 },
    opp: { dist: 0, v: 0, top: oppTop, accel: oppCar.accel, handling: oppCar.handling, boostMult: 1, slowUntil: 0, slowFactor: 1, hitFlashUntil: 0, skidUntil: 0 },
    ghost: false,
    attacks,
    msgs: [],
    nitroUntil: 0, teleportFlashUntil: 0, attackFlashUntil: 0, blockedFlashUntil: 0,
    oilAtDist: -1, oilUntil: 0,
    startTime: performance.now(),
    countdownMs: 1800,
    running: false, done: false, finishAt: 0, outcome: null,
    lastFrame: performance.now(),
  };

  renderRaceAbilityBar();
  requestAnimationFrame(egoRaceFrame);
}

function raceCurveK(dist) {
  // Sanfte, wechselnde Kurven – macht die Strecke lebendig.
  return Math.sin(dist / 170) * 0.55 + Math.sin(dist / 63) * 0.18;
}

function simRacer(r, dt, now) {
  const slowed = now < r.slowUntil ? r.slowFactor : 1;
  const curve = Math.abs(raceCurveK(r.dist));
  const curveSlow = 1 - curve * 0.16 * (1 - Math.min(1, r.handling / 190));
  const targetV = r.top * r.boostMult * slowed * curveSlow;
  const approach = Math.min(1, dt * (1.1 + r.accel / 55)); // Beschleunigung wirkt spürbar
  r.v += (targetV - r.v) * approach;
  r.dist += r.v * dt;
}

function finishRace(now) {
  const rt = raceRuntime;
  rt.done = true;
  rt.running = false;
  const playerWins = rt.player.dist >= RACE_LENGTH && (rt.opp.dist < RACE_LENGTH || rt.player.dist >= rt.opp.dist);
  const marginM = Math.abs(rt.player.dist - rt.opp.dist);
  rt.consumedIds = rt.passiveIds.concat(rt.activatedIds);
  rt.outcome = { playerWins, marginM };
  rt.finishAt = now;
  // Buttons deaktivieren
  raceAbilityBar.querySelectorAll(".race-ability-btn").forEach((b) => { b.disabled = true; });
  setTimeout(() => {
    const effectsFinal = combineEffects(rt.consumedIds);
    applyRaceOutcome(rt.playerCar, rt.oppCar, effectsFinal, rt.outcome);
  }, 1100);
}

function egoRaceFrame(now) {
  const rt = raceRuntime;
  if (!rt) return;
  const dt = Math.min(0.05, (now - rt.lastFrame) / 1000);
  rt.lastFrame = now;
  const sinceStart = now - rt.startTime;

  if (!rt.running && !rt.done && sinceStart >= rt.countdownMs) {
    rt.running = true;
    raceAbilityBar.querySelectorAll(".race-ability-btn:not(.race-ability-used)").forEach((b) => { b.disabled = false; });
  }

  if (rt.running && !rt.done) {
    simRacer(rt.player, dt, now);
    simRacer(rt.opp, dt, now);

    // Geplante Gegner-Angriffe
    for (let i = rt.attacks.length - 1; i >= 0; i--) {
      if (sinceStart - rt.countdownMs >= rt.attacks[i]) {
        rt.attacks.splice(i, 1);
        if (rt.ghost) {
          rt.blockedFlashUntil = now + 900;
          rt.msgs.push({ text: "👻 Angriff geht durch dich hindurch!", until: now + 1600, color: "#c8e8ff" });
        } else {
          rt.player.slowUntil = now + 2000;
          rt.player.slowFactor = 0.72;
          rt.attackFlashUntil = now + 700;
          rt.msgs.push({ text: "⚡ Der Gegner greift an!", until: now + 1600, color: "#ff6a6a" });
        }
      }
    }

    if (rt.player.dist >= RACE_LENGTH || rt.opp.dist >= RACE_LENGTH) {
      finishRace(now);
    }
  }

  drawEgoRace(now, sinceStart);

  if (!rt.done || now - rt.finishAt < 1100) {
    requestAnimationFrame(egoRaceFrame);
  }
}

// ---- Pseudo-3D-Zeichnung der Ego-Perspektive ----

function drawEgoRace(now, sinceStart) {
  const rt = raceRuntime;
  const ctx = raceCanvas.getContext("2d");
  const w = raceCanvas.width, h = raceCanvas.height;
  const horizon = h * 0.4;
  const focal = 14; // Meter bis "Kamera-Nähe"
  const pDist = rt.player.dist;
  const curveHere = raceCurveK(pDist);

  function proj(z) {
    const s = focal / (focal + z);
    return { s, y: horizon + (h - horizon) * s };
  }
  // Seitliche Verschiebung der Straße durch Kurven (wächst mit der Entfernung).
  function curveShift(z) {
    return raceCurveK(pDist + z) * z * z * 0.055;
  }
  function roadX(z, lateralM) {
    const { s } = proj(z);
    return w / 2 + curveShift(z) * s + lateralM * s * (w / 22);
  }

  // --- Himmel: Abenddämmerung mit Sonne und Wolken ---
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#131b33");
  sky.addColorStop(0.55, "#3a3a63");
  sky.addColorStop(1, "#c86a4a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, horizon);

  const sunX = w * 0.5 - curveHere * w * 0.18;
  ctx.save();
  const sunG = ctx.createRadialGradient(sunX, horizon - h * 0.03, 2, sunX, horizon - h * 0.03, w * 0.09);
  sunG.addColorStop(0, "rgba(255,214,140,0.95)");
  sunG.addColorStop(1, "rgba(255,150,80,0)");
  ctx.fillStyle = sunG;
  ctx.fillRect(sunX - w * 0.1, horizon - h * 0.16, w * 0.2, h * 0.16);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(220,200,220,0.14)";
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 263 + now * 0.004) % (w + 200)) - 100;
    ctx.beginPath();
    ctx.ellipse(cx, horizon * (0.25 + (i % 3) * 0.18), w * 0.07, h * 0.02, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // --- Berge (zwei Parallax-Ebenen) ---
  for (const [layerK, color, amp] of [[0.008, "#1c2438", 0.1], [0.02, "#252c44", 0.06]]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    for (let x = 0; x <= w; x += 24) {
      const ridge = Math.sin((x + pDist * layerK * 60) * 0.011) + Math.sin((x + pDist * layerK * 60) * 0.027) * 0.5;
      ctx.lineTo(x, horizon - Math.abs(ridge) * h * amp - 2);
    }
    ctx.lineTo(w, horizon);
    ctx.closePath();
    ctx.fill();
  }

  // --- Boden ---
  const ground = ctx.createLinearGradient(0, horizon, 0, h);
  ground.addColorStop(0, "#232e22");
  ground.addColorStop(1, "#161d14");
  ctx.fillStyle = ground;
  ctx.fillRect(0, horizon, w, h - horizon);

  // --- Straße in Tiefen-Scheiben ---
  const SLICES = 30;
  const ROAD_HALF = 8; // Meter halbe Straßenbreite
  for (let i = SLICES - 1; i >= 0; i--) {
    const z1 = (i / SLICES) * RACE_VIEW_DIST;
    const z2 = ((i + 1) / SLICES) * RACE_VIEW_DIST;
    const p1 = proj(z1), p2 = proj(z2);
    const seg = Math.floor((pDist + z1) / 9) % 2 === 0;

    // Asphalt
    ctx.fillStyle = seg ? "#33383f" : "#2e333a";
    ctx.beginPath();
    ctx.moveTo(roadX(z1, -ROAD_HALF), p1.y);
    ctx.lineTo(roadX(z1, ROAD_HALF), p1.y);
    ctx.lineTo(roadX(z2, ROAD_HALF), p2.y);
    ctx.lineTo(roadX(z2, -ROAD_HALF), p2.y);
    ctx.closePath();
    ctx.fill();

    // Randstreifen (rot-weiß) + Mittellinie
    for (const side of [-1, 1]) {
      ctx.fillStyle = seg ? "#c8cdd4" : "#c44a3f";
      ctx.beginPath();
      ctx.moveTo(roadX(z1, side * ROAD_HALF), p1.y);
      ctx.lineTo(roadX(z1, side * (ROAD_HALF + 0.9)), p1.y);
      ctx.lineTo(roadX(z2, side * (ROAD_HALF + 0.9)), p2.y);
      ctx.lineTo(roadX(z2, side * ROAD_HALF), p2.y);
      ctx.closePath();
      ctx.fill();
    }
    if (seg) {
      ctx.fillStyle = "rgba(240,240,235,0.85)";
      ctx.beginPath();
      ctx.moveTo(roadX(z1, -0.25), p1.y);
      ctx.lineTo(roadX(z1, 0.25), p1.y);
      ctx.lineTo(roadX(z2, 0.25), p2.y);
      ctx.lineTo(roadX(z2, -0.25), p2.y);
      ctx.closePath();
      ctx.fill();
    }
  }

  // --- Leitplanken-Pfosten & Bäume am Straßenrand ---
  for (let z = 6; z < RACE_VIEW_DIST; z += 14) {
    const worldZ = Math.ceil((pDist + z) / 14) * 14 - pDist;
    if (worldZ < 1 || worldZ > RACE_VIEW_DIST) continue;
    const { s, y } = proj(worldZ);
    for (const side of [-1, 1]) {
      const x = roadX(worldZ, side * (ROAD_HALF + 1.6));
      ctx.fillStyle = "#8a929c";
      ctx.fillRect(x - 1.5 * s, y - 14 * s, 3 * s, 14 * s);
      ctx.fillStyle = side === -1 ? "#ffb84a" : "#ff6a5a";
      ctx.fillRect(x - 2 * s, y - 14 * s, 4 * s, 3.5 * s);
    }
  }
  for (let z = 10; z < RACE_VIEW_DIST; z += 34) {
    const worldZ = Math.ceil((pDist + z) / 34) * 34 - pDist;
    if (worldZ < 2 || worldZ > RACE_VIEW_DIST) continue;
    const { s, y } = proj(worldZ);
    const side = Math.floor((pDist + worldZ) / 34) % 2 === 0 ? -1 : 1;
    const x = roadX(worldZ, side * (ROAD_HALF + 5));
    ctx.fillStyle = "#3a2c20";
    ctx.fillRect(x - 2 * s, y - 26 * s, 4 * s, 26 * s);
    ctx.fillStyle = "#22422a";
    ctx.beginPath();
    ctx.moveTo(x, y - 62 * s);
    ctx.lineTo(x - 16 * s, y - 22 * s);
    ctx.lineTo(x + 16 * s, y - 22 * s);
    ctx.closePath();
    ctx.fill();
  }

  // --- Ölfleck der Falle ---
  if (now < rt.oilUntil && rt.oilAtDist > 0) {
    const oz = rt.oilAtDist - pDist;
    if (oz > 1 && oz < RACE_VIEW_DIST) {
      const { s, y } = proj(oz);
      ctx.save();
      ctx.fillStyle = "rgba(20,16,28,0.8)";
      ctx.beginPath();
      ctx.ellipse(roadX(oz, -3.4), y, 36 * s, 9 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // --- Ziel-Bogen ---
  const finishZ = RACE_LENGTH - pDist;
  if (finishZ > 0 && finishZ < RACE_VIEW_DIST) {
    const { s, y } = proj(finishZ);
    const xl = roadX(finishZ, -ROAD_HALF - 1), xr = roadX(finishZ, ROAD_HALF + 1);
    ctx.fillStyle = "#d8dde4";
    ctx.fillRect(xl - 3 * s, y - 80 * s, 6 * s, 80 * s);
    ctx.fillRect(xr - 3 * s, y - 80 * s, 6 * s, 80 * s);
    const bannerH = 18 * s;
    for (let cx = 0; cx < 8; cx++) {
      for (let cy = 0; cy < 2; cy++) {
        ctx.fillStyle = (cx + cy) % 2 === 0 ? "#f4f6f8" : "#14171b";
        ctx.fillRect(xl + ((xr - xl) / 8) * cx, y - 80 * s + cy * bannerH / 2, (xr - xl) / 8 + 1, bannerH / 2);
      }
    }
  }

  // --- Gegner-Auto (wenn vor uns sichtbar) ---
  const delta = rt.opp.dist - rt.player.dist;
  if (delta > -6) {
    const oz = Math.max(0.8, Math.min(delta + 7, RACE_VIEW_DIST));
    const { s, y } = proj(oz);
    const skid = now < rt.opp.skidUntil ? Math.sin(now / 55) * 8 * s : 0;
    const ocw = 150 * s, och = 96 * s;
    ctx.save();
    ctx.translate(roadX(oz, -3.4) + skid, y - och * 0.45);
    if (now < rt.opp.hitFlashUntil) {
      ctx.globalAlpha = 0.55 + Math.sin(now / 40) * 0.3;
    }
    drawCarRear(ctx, ocw, och, rt.oppCar);
    ctx.restore();
    if (now < rt.opp.hitFlashUntil) {
      fxBolt(ctx, roadX(oz, -3.4) - 30 * s, y - och, roadX(oz, -3.4) + 20 * s, y - och * 0.4, "#ffd75a", Math.floor(now / 60), 8 * s, 2);
    }
  }

  // --- Spielerauto (Heckansicht, unten) ---
  const sway = curveHere * -26 + Math.sin(now / 120) * 2.5;
  const pcw = 190, pch = 120;
  const px = w * 0.5 + w * 0.155 + sway, py = h * 0.86;
  ctx.save();
  if (rt.ghost) {
    ctx.globalAlpha = 0.5;
    ctx.shadowColor = "#c8e8ff";
    ctx.shadowBlur = 24;
  }
  ctx.translate(px, py);
  drawCarRear(ctx, pcw, pch, rt.playerCar);
  ctx.restore();

  // Nitro-Flammen hinterm Spielerauto
  if (now < rt.nitroUntil) {
    const f = 0.7 + Math.sin(now / 28) * 0.3;
    for (const ox of [-pcw * 0.3, pcw * 0.3]) {
      ctx.save();
      ctx.translate(px + ox, py + pch * 0.42);
      ctx.fillStyle = "#4fa0ff";
      ctx.beginPath();
      ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.lineTo(0, 34 * f);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#d0ecff";
      ctx.beginPath();
      ctx.moveTo(-4.5, 0); ctx.lineTo(4.5, 0); ctx.lineTo(0, 20 * f);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
  // Teleport-Portal um den Spieler
  if (now < rt.teleportFlashUntil) {
    const k = (rt.teleportFlashUntil - now) / 700;
    fxRing(ctx, px, py, 30 + (1 - k) * 90, "#7a5aff", k, 5);
    fxRing(ctx, px, py, 16 + (1 - k) * 60, "#3fe0d4", k * 0.8, 3);
  }
  // Geist blockt Angriff
  if (now < rt.blockedFlashUntil) {
    const k = (rt.blockedFlashUntil - now) / 900;
    ctx.save();
    ctx.globalAlpha = k * 0.8;
    ctx.font = `bold ${h * 0.06}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#c8e8ff";
    ctx.fillText("👻", px, py - pch * 0.75);
    ctx.restore();
  }
  // Angriff: roter Blitz + Vignette
  if (now < rt.attackFlashUntil) {
    const k = (rt.attackFlashUntil - now) / 700;
    fxBolt(ctx, w * 0.35, horizon * 0.6, px - 20, py - pch * 0.3, "#ff5a5a", Math.floor(now / 50), 22, 3);
    ctx.save();
    ctx.globalAlpha = k * 0.3;
    ctx.fillStyle = "#ff3a3a";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // --- HUD ---
  ctx.save();
  // Tacho
  ctx.fillStyle = "rgba(10,12,18,0.55)";
  ctx.beginPath();
  ctx.roundRect(14, 12, 176, 54, 10);
  ctx.fill();
  ctx.fillStyle = "#f4f6f8";
  ctx.font = `bold ${h * 0.062}px sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText(`${Math.round(rt.player.v * 3.6)}`, 26, 52);
  ctx.font = `${h * 0.03}px sans-serif`;
  ctx.fillStyle = "#a9b2bc";
  ctx.fillText("km/h", 118, 52);

  // Fortschrittsbalken oben
  const barX = w * 0.3, barW = w * 0.4, barY = 22;
  ctx.fillStyle = "rgba(10,12,18,0.55)";
  ctx.beginPath();
  ctx.roundRect(barX - 8, barY - 8, barW + 16, 22, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(barX, barY + 3);
  ctx.lineTo(barX + barW, barY + 3);
  ctx.stroke();
  ctx.fillStyle = "#f4f6f8";
  ctx.fillRect(barX + barW - 1.5, barY - 4, 3, 14); // Ziel
  const pMark = barX + Math.min(1, rt.player.dist / RACE_LENGTH) * barW;
  const oMark = barX + Math.min(1, rt.opp.dist / RACE_LENGTH) * barW;
  ctx.fillStyle = "#ff6a5a";
  ctx.beginPath(); ctx.arc(oMark, barY + 3, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#3fe0d4";
  ctx.beginPath(); ctx.arc(pMark, barY + 3, 7, 0, Math.PI * 2); ctx.fill();

  // Rückstand/Vorsprung
  ctx.font = `bold ${h * 0.036}px sans-serif`;
  ctx.textAlign = "right";
  const gap = rt.opp.dist - rt.player.dist;
  ctx.fillStyle = gap > 0 ? "#ff8a7a" : "#7dffc0";
  ctx.fillText(gap > 0 ? `−${Math.round(gap)} m` : `+${Math.round(-gap)} m`, w - 18, 46);
  ctx.restore();

  // Meldungen (Fähigkeiten, Angriffe)
  rt.msgs = rt.msgs.filter((m) => now < m.until);
  ctx.save();
  ctx.textAlign = "center";
  rt.msgs.forEach((m, i) => {
    const k = Math.min(1, (m.until - now) / 400);
    ctx.globalAlpha = k;
    ctx.font = `bold ${h * 0.045}px sans-serif`;
    ctx.fillStyle = m.color;
    ctx.fillText(m.text, w / 2, h * 0.56 + i * h * 0.055);
  });
  ctx.restore();

  // Countdown / Ziel-Banner
  if (sinceStart < rt.countdownMs) {
    const n = Math.ceil((rt.countdownMs - sinceStart) / 600);
    ctx.save();
    ctx.fillStyle = "rgba(8,10,14,0.45)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#f4f6f8";
    ctx.font = `bold ${h * 0.24}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(String(n), w / 2, h * 0.55);
    ctx.font = `${h * 0.045}px sans-serif`;
    ctx.fillStyle = "#a9b2bc";
    ctx.fillText(`${RACE_LENGTH} m · Wer zuerst im Ziel ist, gewinnt`, w / 2, h * 0.66);
    ctx.restore();
  } else if (sinceStart < rt.countdownMs + 700 && !rt.done) {
    ctx.save();
    ctx.fillStyle = "#7dffc0";
    ctx.font = `bold ${h * 0.16}px sans-serif`;
    ctx.textAlign = "center";
    ctx.globalAlpha = 1 - (sinceStart - rt.countdownMs) / 700;
    ctx.fillText("LOS!", w / 2, h * 0.55);
    ctx.restore();
  }

  if (rt.done && rt.outcome) {
    ctx.save();
    ctx.fillStyle = "rgba(8,10,14,0.5)";
    ctx.fillRect(0, h * 0.36, w, h * 0.26);
    ctx.font = `bold ${h * 0.11}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = rt.outcome.playerWins ? "#7dffc0" : "#ff8a7a";
    ctx.fillText(rt.outcome.playerWins ? "🏁 ZIEL – GEWONNEN!" : "🏁 Der Gegner ist im Ziel …", w / 2, h * 0.53);
    ctx.restore();
  }
}

function applyRaceOutcome(playerCar, opponentCar, effects, outcome) {
  // Nur wirklich benutzte Karten verbrauchen: passive zählen immer,
  // aktive nur, wenn ihr Button gedrückt wurde. Nicht gezündete aktive
  // Karten wandern zurück ins Inventar.
  const consumed = raceRuntime ? raceRuntime.consumedIds : raceSelection.abilityIds;
  for (const id of consumed) {
    const idx = ownedAbilities.indexOf(id);
    if (idx >= 0) ownedAbilities.splice(idx, 1);
  }
  const unused = raceSelection.abilityIds.filter((id) => !consumed.includes(id));

  let creditsGained = 0;
  let carLost = false;

  if (outcome.playerWins) {
    creditsGained = Math.round(REWARD_BY_RARITY[opponentCar.rarity] * effects.rewardMult);
    // Wer gewinnt, bekommt das Auto des Gegners immer obendrauf.
    ownedCars.push(opponentCar.id);
    discoveredCars.add(opponentCar.id);
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
  if (outcome.marginM != null) {
    lines.push(outcome.playerWins
      ? `Vorsprung im Ziel: ${Math.round(outcome.marginM)} m`
      : `Rückstand im Ziel: ${Math.round(outcome.marginM)} m`);
  }
  if (outcome.playerWins) {
    lines.push(`+${creditsGained} Credits`);
    lines.push(`Du hast dir außerdem das ${opponentCar.name} des Gegners geschnappt!`);
  } else {
    if (carLost) lines.push(`Dein ${playerCar.name} geht an den Gegner.`);
    else lines.push(`Eine Fähigkeit hat dein ${playerCar.name} gerettet!`);
    if (creditsGained > 0) lines.push(`+${creditsGained} Trost-Credits`);
  }
  if (unused.length) {
    lines.push(`Nicht gezündet, bleibt im Inventar: ${unused.map((id) => ABILITY_BY_ID[id].name).join(", ")}`);
  }

  resultDetails.innerHTML = lines.map((l) => `<div>${l}</div>`).join("");
  showPhase(phaseResult);
}

btnResultClose.addEventListener("click", () => closeModal(challengeModal));

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
