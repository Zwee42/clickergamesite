import { GameState } from './types';
import {
  buildingDefs, buildingUpgrades, clickUpgrades,
  defaultBuildings, defaultClickUpgrades, defaultBuildingUpgrades, defaultAchievements,
} from './data';

export function formatNumber(n: number): string {
  if (n < 1000) return Math.floor(n).toString();
  const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  const tier = Math.floor(Math.log10(Math.abs(n)) / 3);
  if (tier >= suffixes.length) return Math.floor(n).toExponential(1);
  const suffix = suffixes[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = n / scale;
  return scaled.toFixed(1) + suffix;
}

export function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h + 'h ' + m + 'm ' + s + 's';
}

export function getClickPower(state: GameState): number {
  let power = state.clickPower;
  if (state.activeEffects.clickFrenzy) power *= 777;
  if (state.activeEffects.frenzy) power *= 7;
  return power;
}

export function getCpsMultiplier(state: GameState): number {
  let mult = state.prestigeMultiplier;
  if (state.activeEffects.frenzy) mult *= 7;
  Object.keys(state.activeEffects).forEach(k => {
    if (k.startsWith('building_special_')) mult *= state.activeEffects[k].mult;
  });
  return mult;
}

export function getEffectiveCps(state: GameState): number {
  let base = 0;
  buildingDefs.forEach(b => {
    const upg = state.buildings[b.id];
    if (!upg) return;
    let bCps = upg.cps * upg.owned;
    const bg = state.ownedBuildingUpgrades[b.id];
    if (bg) {
      Object.keys(bg).forEach(id => { if (bg[id]) bCps *= 2; });
    }
    base += bCps;
  });
  return base * getCpsMultiplier(state);
}

export function getCpsForDisplay(state: GameState): number {
  const base = getEffectiveCps(state);
  return state.activeEffects.clot ? base * 0.5 : base;
}

export function getBuildingMultiplier(state: GameState, type: string): number {
  let mult = 1;
  const bg = state.ownedBuildingUpgrades[type];
  if (bg) {
    Object.keys(bg).forEach(id => { if (bg[id]) mult *= 2; });
  }
  return mult;
}

export function getBuildingCps(state: GameState, type: string, count: number): number {
  const upg = state.buildings[type];
  if (!upg) return 0;
  let bCps = upg.cps * count;
  const bg = state.ownedBuildingUpgrades[type];
  if (bg) {
    Object.keys(bg).forEach(id => { if (bg[id]) bCps *= 2; });
  }
  return bCps;
}

export function calcBulkPurchase(state: GameState, type: string): { bought: number; totalCost: number } {
  const upg = state.buildings[type];
  if (!upg) return { bought: 0, totalCost: 0 };
  const count = getBuyCount(state.buyMode);
  let bought = 0;
  let totalCost = 0;
  let tempCost = upg.cost;
  for (let i = 0; i < count; i++) {
    if (state.cookies < totalCost + tempCost) break;
    totalCost += tempCost;
    tempCost = Math.ceil(tempCost * upg.costMultiplier);
    bought++;
    if (count === Infinity && bought >= 10000) break;
  }
  return { bought, totalCost };
}

export function getBuyCount(mode: number): number {
  if (mode === 0) return 1;
  if (mode === 1) return 10;
  if (mode === 2) return 100;
  return Infinity;
}

export function buyBuilding(state: GameState, type: string): number {
  const upg = state.buildings[type];
  if (!upg) return 0;
  const count = getBuyCount(state.buyMode);
  let bought = 0;
  let totalCost = 0;
  let tempCost = upg.cost;
  for (let i = 0; i < count; i++) {
    if (state.cookies < totalCost + tempCost) break;
    totalCost += tempCost;
    tempCost = Math.ceil(tempCost * upg.costMultiplier);
    bought++;
    if (count === Infinity && bought >= 10000) break;
  }
  if (bought === 0) return 0;
  state.cookies -= totalCost;
  upg.owned += bought;
  upg.cost = tempCost;
  return bought;
}

export function buyClickUpgrade(state: GameState, id: string): boolean {
  const u = clickUpgrades.find(x => x.id === id);
  if (!u || state.ownedClickUpgrades[id] || state.cookies < u.cost) return false;
  state.cookies -= u.cost;
  state.ownedClickUpgrades[id] = true;
  u.apply(state);
  return true;
}

export function buyBuildingUpgrade(state: GameState, type: string, id: string): boolean {
  const upgrades = buildingUpgrades[type];
  if (!upgrades) return false;
  const u = upgrades.find(x => x.id === id);
  if (!u || state.ownedBuildingUpgrades[type]?.[id] || state.cookies < u.cost) return false;
  state.cookies -= u.cost;
  state.ownedBuildingUpgrades[type][id] = true;
  return true;
}

export function doPrestige(state: GameState): boolean {
  if (state.cookies < 1000000) return false;
  const gained = Math.floor(Math.sqrt(state.cookies / 1000000000));
  if (gained < 1) return false;
  state.totalPrestige += gained;
  state.prestigeMultiplier = 1 + state.totalPrestige * 0.01;
  state.cookies = 0;
  state.cookiesPerSecond = 0;
  state.clickPower = 1;
  buildingDefs.forEach(b => {
    const upg = state.buildings[b.id];
    if (upg) {
      upg.cost = b.cost;
      upg.owned = 0;
    }
  });
  Object.keys(state.ownedClickUpgrades).forEach(k => state.ownedClickUpgrades[k] = false);
  Object.keys(state.ownedBuildingUpgrades).forEach(type => {
    Object.keys(state.ownedBuildingUpgrades[type]).forEach(k => state.ownedBuildingUpgrades[type][k] = false);
  });
  return true;
}

export function startEffect(state: GameState, id: string, seconds: number, multiplier: number): number {
  const endTime = Date.now() + seconds * 1000;
  if (id.startsWith('building_special_')) {
    state.activeEffects[id] = { mult: multiplier, endTime };
  } else if (id === 'frenzy' || id === 'clot') {
    state.activeEffects[id] = { mult: multiplier, endTime };
  } else if (id === 'clickFrenzy') {
    state.activeEffects[id] = { mult: 777, endTime };
  }
  return endTime;
}

export function applyGoldenEffect(state: GameState): string {
  const effects = ['frenzy', 'clickFrenzy', 'cookieStorm', 'buildingSpecial'];
  const chosen = effects[randInt(0, effects.length - 1)];
  if (chosen === 'frenzy') {
    startEffect(state, 'frenzy', 77, 7);
    return 'Frenzy! x7';
  } else if (chosen === 'clickFrenzy') {
    startEffect(state, 'clickFrenzy', 13, 777);
    return 'Click Frenzy! x777';
  } else if (chosen === 'cookieStorm') {
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        state.cookies += randInt(100, 300);
      }, i * 30);
    }
    return 'Cookie Storm!';
  } else if (chosen === 'buildingSpecial') {
    const types = buildingDefs.filter(b => (state.buildings[b.id]?.owned ?? 0) > 0);
    if (types.length > 0) {
      const b = types[randInt(0, types.length - 1)];
      startEffect(state, 'building_special_' + b.id, 30, 10);
      return b.label + ' x10!';
    }
  }
  return '';
}

export function createInitialState(): GameState {
  return {
    cookies: 0,
    cookiesPerSecond: 0,
    cookiesClicked: 0,
    cookiesAllTime: 0,
    clickPower: 1,
    goldenCookiesClicked: 0,
    totalPrestige: 0,
    prestigeMultiplier: 1,
    gameStarted: Date.now(),
    soundEnabled: true,
    buyMode: 1,
    buildings: defaultBuildings(),
    ownedClickUpgrades: defaultClickUpgrades(),
    ownedBuildingUpgrades: defaultBuildingUpgrades(),
    achievements: defaultAchievements(),
    activeEffects: {},
  };
}
