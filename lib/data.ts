import { BuildingDef, ClickUpgradeDef, BuildingUpgradeDef, AchievementDef, GameState } from './types';

export const buildingDefs: BuildingDef[] = [
  { id: 'cursor',     label: 'Cursor',      cost: 15,         cps: 1,    mult: 1.15 },
  { id: 'grandma',    label: 'Grandma',     cost: 100,        cps: 5,    mult: 1.15 },
  { id: 'farm',       label: 'Farm',        cost: 1100,       cps: 8,    mult: 1.15 },
  { id: 'mine',       label: 'Mine',        cost: 12000,      cps: 25,   mult: 1.16 },
  { id: 'factory',    label: 'Factory',     cost: 60000,      cps: 100,  mult: 1.17 },
  { id: 'bank',       label: 'Bank',        cost: 250000,     cps: 500,  mult: 1.18 },
  { id: 'temple',     label: 'Temple',      cost: 1400000,    cps: 2000,  mult: 1.15 },
  { id: 'wizard',     label: 'Wizard Tower',cost: 5000000,    cps: 7000,  mult: 1.15 },
  { id: 'portal',     label: 'Portal',      cost: 33000000,   cps: 30000, mult: 1.15 },
  { id: 'timemachine',label: 'Time Machine',cost: 510000000,  cps: 100000, mult: 1.15 },
  { id: 'antimatter', label: 'Antimatter',  cost: 12000000000, cps: 400000, mult: 1.15 },
  { id: 'prism',      label: 'Prism',       cost: 750000000000, cps: 2000000, mult: 1.15 },
];

export function defaultBuildings(): Record<string, import('./types').BuildingState> {
  const map: Record<string, import('./types').BuildingState> = {};
  buildingDefs.forEach(b => {
    map[b.id] = { cost: b.cost, cps: b.cps, owned: 0, costMultiplier: b.mult };
  });
  return map;
}

export const clickUpgrades: ClickUpgradeDef[] = [
  { id: 'click1', label: 'Reinforced Index Finger', desc: 'Click power +1', cost: 100,     apply: (s) => { s.clickPower += 1; } },
  { id: 'click2', label: 'Carpal Tunnel Prevention', desc: 'Click power x2', cost: 5000,   apply: (s) => { s.clickPower *= 2; } },
  { id: 'click3', label: 'Ambidextrous', desc: 'Click power +5', cost: 50000,    apply: (s) => { s.clickPower += 5; } },
  { id: 'click4', label: 'Thousand Fingers', desc: 'Click power +0.1 per cursor', cost: 100000, apply: () => {} },
  { id: 'click5', label: 'Million Fingers', desc: 'Click power +0.5 per cursor', cost: 5000000, apply: () => {} },
  { id: 'click6', label: 'Billion Fingers', desc: 'Click power +1 per cursor', cost: 100000000, apply: () => {} },
];

export const buildingUpgrades: Record<string, BuildingUpgradeDef[]> = {};
buildingDefs.forEach(b => {
  buildingUpgrades[b.id] = [
    { id: b.id + '_u1', label: 'Upgraded ' + b.label, desc: b.label + ' x2 CPS', cost: b.cost * 10, mult: 2 },
    { id: b.id + '_u2', label: 'Reinforced ' + b.label, desc: b.label + ' x2 CPS', cost: b.cost * 50, mult: 2 },
    { id: b.id + '_u3', label: 'Enhanced ' + b.label, desc: b.label + ' x2 CPS', cost: b.cost * 200, mult: 2 },
  ];
});

export function defaultClickUpgrades(): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  clickUpgrades.forEach(u => map[u.id] = false);
  return map;
}

export function defaultBuildingUpgrades(): Record<string, Record<string, boolean>> {
  const map: Record<string, Record<string, boolean>> = {};
  Object.keys(buildingUpgrades).forEach(type => {
    map[type] = {};
    buildingUpgrades[type].forEach(u => map[type][u.id] = false);
  });
  return map;
}

export const achievementDefs: AchievementDef[] = [
  { id: 'ach_100', label: '100 Cookies', desc: 'Bake 100 cookies total', check: (s) => s.cookiesAllTime >= 100 },
  { id: 'ach_1k', label: '1,000 Cookies', desc: 'Bake 1,000 cookies total', check: (s) => s.cookiesAllTime >= 1000 },
  { id: 'ach_10k', label: '10,000 Cookies', desc: 'Bake 10,000 cookies total', check: (s) => s.cookiesAllTime >= 10000 },
  { id: 'ach_100k', label: '100,000 Cookies', desc: 'Bake 100,000 cookies total', check: (s) => s.cookiesAllTime >= 100000 },
  { id: 'ach_1m', label: '1 Million Cookies', desc: 'Bake 1,000,000 cookies total', check: (s) => s.cookiesAllTime >= 1000000 },
  { id: 'ach_1b', label: '1 Billion Cookies', desc: 'Bake 1,000,000,000 cookies total', check: (s) => s.cookiesAllTime >= 1000000000 },
  { id: 'ach_1t', label: '1 Trillion Cookies', desc: 'Bake 1,000,000,000,000 cookies total', check: (s) => s.cookiesAllTime >= 1000000000000 },
  { id: 'ach_cursor1', label: 'Click', desc: 'Own at least 1 cursor', check: (s) => s.buildings.cursor?.owned >= 1 },
  { id: 'ach_cursor10', label: 'Clicktastic', desc: 'Own at least 10 cursors', check: (s) => s.buildings.cursor?.owned >= 10 },
  { id: 'ach_cursor50', label: 'Clickathon', desc: 'Own at least 50 cursors', check: (s) => s.buildings.cursor?.owned >= 50 },
  { id: 'ach_grandma1', label: 'Grandma', desc: 'Own at least 1 grandma', check: (s) => s.buildings.grandma?.owned >= 1 },
  { id: 'ach_grandma10', label: 'Grandma Party', desc: 'Own at least 10 grandmas', check: (s) => s.buildings.grandma?.owned >= 10 },
  { id: 'ach_farm1', label: 'Farm', desc: 'Own at least 1 farm', check: (s) => s.buildings.farm?.owned >= 1 },
  { id: 'ach_mine1', label: 'Mine', desc: 'Own at least 1 mine', check: (s) => s.buildings.mine?.owned >= 1 },
  { id: 'ach_factory1', label: 'Factory', desc: 'Own at least 1 factory', check: (s) => s.buildings.factory?.owned >= 1 },
  { id: 'ach_bank1', label: 'Bank', desc: 'Own at least 1 bank', check: (s) => s.buildings.bank?.owned >= 1 },
  { id: 'ach_temple1', label: 'Temple', desc: 'Own at least 1 temple', check: (s) => s.buildings.temple?.owned >= 1 },
  { id: 'ach_wizard1', label: 'Wizard Tower', desc: 'Own at least 1 wizard tower', check: (s) => s.buildings.wizard?.owned >= 1 },
  { id: 'ach_portal1', label: 'Portal', desc: 'Own at least 1 portal', check: (s) => s.buildings.portal?.owned >= 1 },
  { id: 'ach_timemachine1', label: 'Time Machine', desc: 'Own at least 1 time machine', check: (s) => s.buildings.timemachine?.owned >= 1 },
  { id: 'ach_antimatter1', label: 'Antimatter', desc: 'Own at least 1 antimatter condenser', check: (s) => s.buildings.antimatter?.owned >= 1 },
  { id: 'ach_prism1', label: 'Prism', desc: 'Own at least 1 prism', check: (s) => s.buildings.prism?.owned >= 1 },
  { id: 'ach_golden1', label: 'Golden Cookie', desc: 'Click 1 golden cookie', check: (s) => s.goldenCookiesClicked >= 1 },
  { id: 'ach_golden10', label: 'Golden Cookies x10', desc: 'Click 10 golden cookies', check: (s) => s.goldenCookiesClicked >= 10 },
  { id: 'ach_click100', label: '100 Clicks', desc: 'Click the cookie 100 times', check: (s) => s.cookiesClicked >= 100 },
  { id: 'ach_click1000', label: '1,000 Clicks', desc: 'Click the cookie 1,000 times', check: (s) => s.cookiesClicked >= 1000 },
];

export function defaultAchievements(): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  achievementDefs.forEach(a => map[a.id] = false);
  return map;
}

export const upgradeIcons: Record<string, string> = {
  cursor: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23fff3d1'/%3E%3Cpath d='M18 10l28 28-9 2-2 9L7 21l11-11z' fill='%236b4f2a'/%3E%3Cpath d='M20 12l24 24' stroke='%23f9d56e' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E",
  grandma: 'img/grandma.png',
  farm: 'img/farm-removebg-preview.png',
  mine: 'img/mine-removebg-preview.png',
  factory: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23eef7ff'/%3E%3Cpath d='M10 48h44V24l-10 6v-6l-12 8V22L20 30v-6l-10 8z' fill='%23688bb5'/%3E%3Crect x='18' y='36' width='6' height='6' fill='%23d9eefc'/%3E%3Crect x='28' y='36' width='6' height='6' fill='%23d9eefc'/%3E%3Crect x='38' y='36' width='6' height='6' fill='%23d9eefc'/%3E%3C/svg%3E",
  bank: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23fff9e8'/%3E%3Cpath d='M10 28h44l-22-12-22 12z' fill='%23c7a25b'/%3E%3Cpath d='M14 28h36v6H14z' fill='%23e7c87a'/%3E%3Cpath d='M18 34h6v14h-6zm10 0h6v14h-6zm10 0h6v14h-6zm10 0h6v14h-6z' fill='%23805f2d'/%3E%3Cpath d='M12 50h40v4H12z' fill='%23805f2d'/%3E%3C/svg%3E",
  temple: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23fff0e6'/%3E%3Cpath d='M32 8L12 28h8v24h24V28h8L32 8z' fill='%23d4a373'/%3E%3Cpath d='M28 32h8v16h-8z' fill='%238b5e3c'/%3E%3C/svg%3E",
  wizard: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23e8e0ff'/%3E%3Cpath d='M16 48V20l16-8 16 8v28z' fill='%23634d9e'/%3E%3Ccircle cx='32' cy='24' r='6' fill='%23b8a5e8'/%3E%3Cpath d='M28 28v8h8v-8' fill='%234d3570'/%3E%3C/svg%3E",
  portal: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23ffe0f0'/%3E%3Cellipse cx='32' cy='32' rx='18' ry='22' fill='%23942d75'/%3E%3Cellipse cx='32' cy='32' rx='12' ry='16' fill='%23d45d9e'/%3E%3C/svg%3E",
  timemachine: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23e0f0ff'/%3E%3Ccircle cx='32' cy='32' r='18' fill='%233a7ca5'/%3E%3Ccircle cx='32' cy='32' r='12' fill='%235db8e8'/%3E%3Cpath d='M32 22v10l6 4' stroke='%23fff' stroke-width='3' fill='none' stroke-linecap='round'/%3E%3C/svg%3E",
  antimatter: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23333'/%3E%3Ccircle cx='32' cy='32' r='20' fill='%23555'/%3E%3Ccircle cx='32' cy='32' r='8' fill='%23f0f'/%3E%3C/svg%3E",
  prism: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23f0f8ff'/%3E%3Cpolygon points='32,8 8,52 56,52' fill='%23b8d4e8'/%3E%3Cpolygon points='32,18 18,48 46,48' fill='%23e8f4ff'/%3E%3Cpath d='M32 18l-6 15h12z' fill='%23ffdddd' opacity='0.6'/%3E%3C/svg%3E",
};
