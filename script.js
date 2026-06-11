// ===== UTILITY =====
function formatNumber(n) {
    if (n < 1000) return Math.floor(n).toString();
    const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
    const tier = Math.floor(Math.log10(Math.abs(n)) / 3);
    if (tier >= suffixes.length) return Math.floor(n).toExponential(1);
    const suffix = suffixes[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = n / scale;
    return scaled.toFixed(1) + suffix;
}

function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }

// ===== GAME STATE =====
let cookies = 0;
let cookiesPerSecond = 0;
let cookiesClicked = 0;
let cookiesAllTime = 0;
let clickPower = 1;
let goldenCookiesClicked = 0;
let totalPrestige = 0;
let prestigeMultiplier = 1;
let gameStarted = Date.now();

let activeEffects = {};
let wrathMode = false;
let soundEnabled = true;
let buyMode = 1;

const saveKey = 'cookie-clicker-save-v1';

// ===== BUILDINGS DATA =====
const buildingDefs = [
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

const upgrades = {};
buildingDefs.forEach(b => { upgrades[b.id] = { cost: b.cost, cps: b.cps, owned: 0, costMultiplier: b.mult }; });

// ===== ONE-TIME UPGRADES =====
const clickUpgrades = [
    { id: 'click1', label: 'Reinforced Index Finger', desc: 'Click power +1', cost: 100,     apply: () => { clickPower += 1; } },
    { id: 'click2', label: 'Carpal Tunnel Prevention', desc: 'Click power x2', cost: 5000,   apply: () => { clickPower *= 2; } },
    { id: 'click3', label: 'Ambidextrous', desc: 'Click power +5', cost: 50000,    apply: () => { clickPower += 5; } },
    { id: 'click4', label: 'Thousand Fingers', desc: 'Click power +0.1 per cursor', cost: 100000, apply: () => {} },
    { id: 'click5', label: 'Million Fingers', desc: 'Click power +0.5 per cursor', cost: 5000000, apply: () => {} },
    { id: 'click6', label: 'Billion Fingers', desc: 'Click power +1 per cursor', cost: 100000000, apply: () => {} },
];

const buildingUpgrades = {};
buildingDefs.forEach(b => {
    buildingUpgrades[b.id] = [
        { id: b.id + '_u1', label: 'Upgraded ' + b.label, desc: b.label + ' x2 CPS', cost: b.cost * 10, mult: 2 },
        { id: b.id + '_u2', label: 'Reinforced ' + b.label, desc: b.label + ' x2 CPS', cost: b.cost * 50, mult: 2 },
        { id: b.id + '_u3', label: 'Enhanced ' + b.label, desc: b.label + ' x2 CPS', cost: b.cost * 200, mult: 2 },
    ];
});

const ownedClickUpgrades = {};
clickUpgrades.forEach(u => ownedClickUpgrades[u.id] = false);
const ownedBuildingUpgrades = {};
Object.keys(buildingUpgrades).forEach(type => {
    ownedBuildingUpgrades[type] = {};
    buildingUpgrades[type].forEach(u => ownedBuildingUpgrades[type][u.id] = false);
});

// ===== ACHIEVEMENTS =====
const achievementDefs = [
    { id: 'ach_100', label: '100 Cookies', desc: 'Bake 100 cookies total', check: () => cookiesAllTime >= 100 },
    { id: 'ach_1k', label: '1,000 Cookies', desc: 'Bake 1,000 cookies total', check: () => cookiesAllTime >= 1000 },
    { id: 'ach_10k', label: '10,000 Cookies', desc: 'Bake 10,000 cookies total', check: () => cookiesAllTime >= 10000 },
    { id: 'ach_100k', label: '100,000 Cookies', desc: 'Bake 100,000 cookies total', check: () => cookiesAllTime >= 100000 },
    { id: 'ach_1m', label: '1 Million Cookies', desc: 'Bake 1,000,000 cookies total', check: () => cookiesAllTime >= 1000000 },
    { id: 'ach_1b', label: '1 Billion Cookies', desc: 'Bake 1,000,000,000 cookies total', check: () => cookiesAllTime >= 1000000000 },
    { id: 'ach_1t', label: '1 Trillion Cookies', desc: 'Bake 1,000,000,000,000 cookies total', check: () => cookiesAllTime >= 1000000000000 },
    { id: 'ach_cursor1', label: 'Click', desc: 'Own at least 1 cursor', check: () => upgrades.cursor.owned >= 1 },
    { id: 'ach_cursor10', label: 'Clicktastic', desc: 'Own at least 10 cursors', check: () => upgrades.cursor.owned >= 10 },
    { id: 'ach_cursor50', label: 'Clickathon', desc: 'Own at least 50 cursors', check: () => upgrades.cursor.owned >= 50 },
    { id: 'ach_grandma1', label: 'Grandma', desc: 'Own at least 1 grandma', check: () => upgrades.grandma.owned >= 1 },
    { id: 'ach_grandma10', label: 'Grandma Party', desc: 'Own at least 10 grandmas', check: () => upgrades.grandma.owned >= 10 },
    { id: 'ach_farm1', label: 'Farm', desc: 'Own at least 1 farm', check: () => upgrades.farm.owned >= 1 },
    { id: 'ach_mine1', label: 'Mine', desc: 'Own at least 1 mine', check: () => upgrades.mine.owned >= 1 },
    { id: 'ach_factory1', label: 'Factory', desc: 'Own at least 1 factory', check: () => upgrades.factory.owned >= 1 },
    { id: 'ach_bank1', label: 'Bank', desc: 'Own at least 1 bank', check: () => upgrades.bank.owned >= 1 },
    { id: 'ach_temple1', label: 'Temple', desc: 'Own at least 1 temple', check: () => upgrades.temple.owned >= 1 },
    { id: 'ach_wizard1', label: 'Wizard Tower', desc: 'Own at least 1 wizard tower', check: () => upgrades.wizard.owned >= 1 },
    { id: 'ach_portal1', label: 'Portal', desc: 'Own at least 1 portal', check: () => upgrades.portal.owned >= 1 },
    { id: 'ach_timemachine1', label: 'Time Machine', desc: 'Own at least 1 time machine', check: () => upgrades.timemachine.owned >= 1 },
    { id: 'ach_antimatter1', label: 'Antimatter', desc: 'Own at least 1 antimatter condenser', check: () => upgrades.antimatter.owned >= 1 },
    { id: 'ach_prism1', label: 'Prism', desc: 'Own at least 1 prism', check: () => upgrades.prism.owned >= 1 },
    { id: 'ach_golden1', label: 'Golden Cookie', desc: 'Click 1 golden cookie', check: () => goldenCookiesClicked >= 1 },
    { id: 'ach_golden10', label: 'Golden Cookies x10', desc: 'Click 10 golden cookies', check: () => goldenCookiesClicked >= 10 },
    { id: 'ach_click100', label: '100 Clicks', desc: 'Click the cookie 100 times', check: () => cookiesClicked >= 100 },
    { id: 'ach_click1000', label: '1,000 Clicks', desc: 'Click the cookie 1,000 times', check: () => cookiesClicked >= 1000 },
];
let achievements = {};
achievementDefs.forEach(a => achievements[a.id] = false);

// ===== DOM REFERENCES =====
const cookieCountEl = document.getElementById('cookie-count');
const cpsEl = document.getElementById('cookies-per-second');
const theCookieBtn = document.getElementById('the-cookie');
const cursorCircle = document.getElementById('cursor-circle');
const ownedUpgradesEl = document.getElementById('owned-upgrades');
const shopEl = document.getElementById('shop');
const upgradeShopEl = document.getElementById('upgrade-shop');
const achievementsEl = document.getElementById('achievements-list');
const statsEl = document.getElementById('stats-content');
const settingsEl = document.getElementById('settings-content');
const cpsBreakdownEl = document.getElementById('cps-breakdown');
const bulkBtns = document.querySelectorAll('.bulk-btn');
const effectsEl = document.getElementById('active-effects');
const prestigeBtn = document.getElementById('prestige-btn');

// ===== SAVE / LOAD =====
function saveGame() {
    const data = {
        cookies, cookiesPerSecond, cookiesClicked, cookiesAllTime, clickPower,
        goldenCookiesClicked, totalPrestige, prestigeMultiplier, wrathMode, soundEnabled,
        upgrades, ownedClickUpgrades, ownedBuildingUpgrades, achievements, gameStarted,
        activeEffects: {},
    };
    Object.keys(activeEffects).forEach(k => {
        if (activeEffects[k].timeout) data.activeEffects[k] = { ...activeEffects[k], timeout: true };
    });
    localStorage.setItem(saveKey, JSON.stringify(data));
}

function loadGame() {
    const saved = localStorage.getItem(saveKey);
    if (!saved) return;

    try {
        const d = JSON.parse(saved);
        cookies = d.cookies ?? 0;
        cookiesPerSecond = d.cookiesPerSecond ?? 0;
        cookiesClicked = d.cookiesClicked ?? 0;
        cookiesAllTime = d.cookiesAllTime ?? 0;
        clickPower = d.clickPower ?? 1;
        goldenCookiesClicked = d.goldenCookiesClicked ?? 0;
        totalPrestige = d.totalPrestige ?? 0;
        prestigeMultiplier = d.prestigeMultiplier ?? 1;
        wrathMode = d.wrathMode ?? false;
        soundEnabled = d.soundEnabled ?? true;
        gameStarted = d.gameStarted ?? 0;

        if (d.upgrades) {
            Object.keys(d.upgrades).forEach(type => {
                if (upgrades[type]) {
                    upgrades[type].cost = d.upgrades[type].cost ?? upgrades[type].cost;
                    upgrades[type].owned = d.upgrades[type].owned ?? upgrades[type].owned;
                }
            });
        }

        if (d.ownedClickUpgrades) {
            Object.keys(d.ownedClickUpgrades).forEach(id => {
                if (ownedClickUpgrades[id] !== undefined) ownedClickUpgrades[id] = d.ownedClickUpgrades[id];
            });
        }

        if (d.ownedBuildingUpgrades) {
            Object.keys(d.ownedBuildingUpgrades).forEach(type => {
                if (ownedBuildingUpgrades[type]) {
                    Object.keys(d.ownedBuildingUpgrades[type]).forEach(id => {
                        if (ownedBuildingUpgrades[type][id] !== undefined) ownedBuildingUpgrades[type][id] = d.ownedBuildingUpgrades[type][id];
                    });
                }
            });
        }

        if (d.achievements) {
            Object.keys(d.achievements).forEach(id => {
                if (achievements[id] !== undefined) achievements[id] = d.achievements[id];
            });
        }
    } catch (e) {
        localStorage.removeItem(saveKey);
    }
}

// ===== EFFECTS =====
function getClickPower() {
    let power = clickPower;
    if (activeEffects.clickFrenzy) power *= 777;
    if (activeEffects.frenzy) power *= 7;
    return power;
}

function getCpsMultiplier() {
    let mult = prestigeMultiplier;
    if (activeEffects.frenzy) mult *= 7;
    Object.keys(activeEffects).forEach(k => {
        if (k.startsWith('building_special_')) mult *= activeEffects[k].mult;
    });
    return mult;
}

function getEffectiveCps() {
    let base = 0;
    buildingDefs.forEach(b => {
        let bCps = upgrades[b.id].cps * upgrades[b.id].owned;
        const bg = ownedBuildingUpgrades[b.id];
        if (bg) {
            Object.keys(bg).forEach(id => { if (bg[id]) bCps *= 2; });
        }
        base += bCps;
    });
    return base * getCpsMultiplier();
}

// ===== GOLDEN COOKIE =====
let goldenTimer = null;
function scheduleGoldenCookie() {
    if (goldenTimer) clearTimeout(goldenTimer);
    const delay = randInt(30, 180) * 1000;
    goldenTimer = setTimeout(() => {
        spawnGoldenCookie();
        scheduleGoldenCookie();
    }, delay);
}

function spawnGoldenCookie() {
    const existing = document.querySelector('.golden-cookie');
    if (existing) return;

    const isWrath = wrathMode && Math.random() < 0.3;
    const el = document.createElement('div');
    el.className = isWrath ? 'golden-cookie wrath-cookie' : 'golden-cookie';
    el.textContent = isWrath ? '☠' : '★';
    el.style.left = `${rand(20, 60)}%`;
    el.style.top = `${rand(10, 60)}%`;

    el.addEventListener('click', () => {
        el.remove();
        if (isWrath) {
            applyWrathEffect();
        } else {
            applyGoldenEffect();
        }
        goldenCookiesClicked++;
        updateDisplay();
        saveGame();
    });

    document.querySelector('.game-container').appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, 13000);
}

function applyGoldenEffect() {
    const effects = ['frenzy', 'clickFrenzy', 'cookieStorm', 'buildingSpecial'];
    const chosen = effects[randInt(0, effects.length - 1)];

    if (chosen === 'frenzy') {
        startEffect('frenzy', 77, 7);
        showPopup('Frenzy! x7', '#ffd700');
    } else if (chosen === 'clickFrenzy') {
        startEffect('clickFrenzy', 13, 777);
        showPopup('Click Frenzy! x777', '#ff6600');
    } else if (chosen === 'cookieStorm') {
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                cookies += randInt(100, 300);
                updateDisplay();
            }, i * 30);
        }
        showPopup('Cookie Storm!', '#88ccff');
    } else if (chosen === 'buildingSpecial') {
        const types = buildingDefs.filter(b => upgrades[b.id].owned > 0);
        if (types.length > 0) {
            const b = types[randInt(0, types.length - 1)];
            startEffect('building_special_' + b.id, 30, 10);
            showPopup(b.label + ' x10!', '#44ff88');
        }
    }
}

function applyWrathEffect() {
    const effects = ['clot', 'elderFrenzy', 'ruin'];
    const chosen = effects[randInt(0, effects.length - 1)];

    if (chosen === 'clot') {
        startEffect('clot', 66, 0.5);
        showPopup('Clot! CPS halved', '#cc0000');
    } else if (chosen === 'elderFrenzy') {
        startEffect('frenzy', 8, 666);
        showPopup('Elder Frenzy! x666', '#ff0000');
    } else if (chosen === 'ruin') {
        const loss = Math.min(cookies, cookies * 0.1 + 100);
        cookies -= loss;
        showPopup('Ruin! -' + formatNumber(loss), '#cc0000');
    }
}

function startEffect(id, seconds, multiplier) {
    if (activeEffects[id] && activeEffects[id].timeout) {
        clearTimeout(activeEffects[id].timeout);
    }

    const endTime = Date.now() + seconds * 1000;

    if (id.startsWith('building_special_')) {
        activeEffects[id] = { mult: multiplier, timeout: null, endTime };
    } else if (id === 'frenzy' || id === 'clot') {
        activeEffects[id] = { mult: multiplier, timeout: null, endTime };
    } else if (id === 'clickFrenzy') {
        activeEffects[id] = { mult: 777, timeout: null, endTime };
    }

    activeEffects[id].timeout = setTimeout(() => {
        delete activeEffects[id];
        updateDisplay();
    }, seconds * 1000);

    updateDisplay();
}

function getCpsForDisplay() {
    const base = getEffectiveCps();
    return activeEffects.clot ? base * 0.5 : base;
}

// ===== BUILDING UPGRADES =====
function getBuildingMultiplier(type) {
    let mult = 1;
    const bg = ownedBuildingUpgrades[type];
    if (bg) {
        Object.keys(bg).forEach(id => { if (bg[id]) mult *= 2; });
    }
    return mult;
}

function getBuildingCps(type, count) {
    let bCps = upgrades[type].cps * count;
    const bg = ownedBuildingUpgrades[type];
    if (bg) {
        Object.keys(bg).forEach(id => { if (bg[id]) bCps *= 2; });
    }
    return bCps;
}

// ===== RENDER OWNED UPGRADES (LEFT PANEL) =====
function renderOwnedUpgrades() {
    ownedUpgradesEl.innerHTML = '';
    const panelWidth = ownedUpgradesEl.clientWidth || 180;
    const gap = 6;
    const maxRows = 3;

    buildingDefs.forEach((b) => {
        const owned = upgrades[b.id].owned;
        if (owned === 0) return;

        const row = document.createElement('div');
        row.className = 'upgrade-row';

        let boxSize = 52;
        const perRow = Math.max(1, Math.floor((panelWidth + gap) / (boxSize + gap)));
        const rowsNeeded = Math.ceil(owned / perRow);
        if (rowsNeeded > maxRows) {
            const targetPerRow = Math.ceil(owned / maxRows);
            boxSize = Math.min(52, Math.floor((panelWidth - (targetPerRow - 1) * gap) / targetPerRow));
        }

        for (let i = 0; i < Math.min(owned, 999); i++) {
            const box = document.createElement('div');
            box.className = 'upgrade-box';
            box.style.width = boxSize + 'px';
            box.style.height = boxSize + 'px';

            const iconSize = Math.floor(boxSize * 0.7);
            const icon = document.createElement('img');
            icon.className = 'upgrade-box-icon';
            icon.style.width = iconSize + 'px';
            icon.style.height = iconSize + 'px';
            icon.src = upgradeIcons[b.id];
            icon.alt = b.label;

            box.appendChild(icon);
            row.appendChild(box);
        }

        const mult = getBuildingMultiplier(b.id);
        if (mult > 1) {
            const multBadge = document.createElement('span');
            multBadge.className = 'upgrade-mult';
            multBadge.textContent = 'x' + mult;
            row.appendChild(multBadge);
        }

        ownedUpgradesEl.appendChild(row);
    });

    if (ownedUpgradesEl.children.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'owned-upgrades-empty';
        empty.textContent = 'No upgrades yet. Buy from the shop!';
        ownedUpgradesEl.appendChild(empty);
    }
}

// ===== ICONS =====
const upgradeIcons = {
    cursor: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23fff3d1'/%3E%3Cpath d='M18 10l28 28-9 2-2 9L7 21l11-11z' fill='%236b4f2a'/%3E%3Cpath d='M20 12l24 24' stroke='%23f9d56e' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E",
    grandma: 'grandma.png',
    farm: 'farm-removebg-preview.png',
    mine: 'mine-removebg-preview.png',
    factory: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23eef7ff'/%3E%3Cpath d='M10 48h44V24l-10 6v-6l-12 8V22L20 30v-6l-10 8z' fill='%23688bb5'/%3E%3Crect x='18' y='36' width='6' height='6' fill='%23d9eefc'/%3E%3Crect x='28' y='36' width='6' height='6' fill='%23d9eefc'/%3E%3Crect x='38' y='36' width='6' height='6' fill='%23d9eefc'/%3E%3C/svg%3E",
    bank: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23fff9e8'/%3E%3Cpath d='M10 28h44l-22-12-22 12z' fill='%23c7a25b'/%3E%3Cpath d='M14 28h36v6H14z' fill='%23e7c87a'/%3E%3Cpath d='M18 34h6v14h-6zm10 0h6v14h-6zm10 0h6v14h-6zm10 0h6v14h-6z' fill='%23805f2d'/%3E%3Cpath d='M12 50h40v4H12z' fill='%23805f2d'/%3E%3C/svg%3E",
    temple: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23fff0e6'/%3E%3Cpath d='M32 8L12 28h8v24h24V28h8L32 8z' fill='%23d4a373'/%3E%3Cpath d='M28 32h8v16h-8z' fill='%238b5e3c'/%3E%3C/svg%3E",
    wizard: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23e8e0ff'/%3E%3Cpath d='M16 48V20l16-8 16 8v28z' fill='%23634d9e'/%3E%3Ccircle cx='32' cy='24' r='6' fill='%23b8a5e8'/%3E%3Cpath d='M28 28v8h8v-8' fill='%234d3570'/%3E%3C/svg%3E",
    portal: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23ffe0f0'/%3E%3Cellipse cx='32' cy='32' rx='18' ry='22' fill='%23942d75'/%3E%3Cellipse cx='32' cy='32' rx='12' ry='16' fill='%23d45d9e'/%3E%3C/svg%3E",
    timemachine: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23e0f0ff'/%3E%3Ccircle cx='32' cy='32' r='18' fill='%233a7ca5'/%3E%3Ccircle cx='32' cy='32' r='12' fill='%235db8e8'/%3E%3Cpath d='M32 22v10l6 4' stroke='%23fff' stroke-width='3' fill='none' stroke-linecap='round'/%3E%3C/svg%3E",
    antimatter: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23333'/%3E%3Ccircle cx='32' cy='32' r='20' fill='%23555'/%3E%3Ccircle cx='32' cy='32' r='8' fill='%23f0f'/%3E%3C/svg%3E",
    prism: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23f0f8ff'/%3E%3Cpolygon points='32,8 8,52 56,52' fill='%23b8d4e8'/%3E%3Cpolygon points='32,18 18,48 46,48' fill='%23e8f4ff'/%3E%3Cpath d='M32 18l-6 15h12z' fill='%23ffdddd' opacity='0.6'/%3E%3C/svg%3E",
};

// ===== SHOP RENDER =====
function renderShop() {
    shopEl.innerHTML = '';
    buildingDefs.forEach((b) => {
        const upg = upgrades[b.id];
        const bulk = calcBulkPurchase(b.id);
        const btn = document.createElement('button');
        btn.className = 'upgrade-btn';
        btn.id = 'buy-' + b.id;
        btn.disabled = cookies < upg.cost;

        const img = document.createElement('img');
        img.className = 'upgrade-icon';
        img.src = upgradeIcons[b.id];
        img.alt = b.label;

        const label = document.createElement('div');
        let costText = 'cost: <span id="' + b.id + '-cost">' + formatNumber(upg.cost) + '</span>';
        if (bulk.bought > 1) {
            costText += ' &times;' + bulk.bought + ' = <b>' + formatNumber(bulk.totalCost) + '</b>';
        }
        label.innerHTML = b.label + ' (' + costText + ') <br>' +
            '<small>+' + formatNumber(upg.cps) + ' cookie/sec</small><br>' +
            'Owned: <span id="' + b.id + '-owned">' + upg.owned + '</span>';

        btn.appendChild(img);
        btn.appendChild(label);
        btn.addEventListener('click', () => buyBuilding(b.id));
        shopEl.appendChild(btn);
    });
}

function renderUpgradeShop() {
    upgradeShopEl.innerHTML = '';

    const clickSection = document.createElement('div');
    clickSection.innerHTML = '<h3>Click Upgrades</h3>';
    clickUpgrades.forEach(u => {
        if (ownedClickUpgrades[u.id]) return;
        const btn = document.createElement('button');
        btn.className = 'upgrade-btn upgrade-btn--small';
        btn.textContent = u.label + ' - ' + formatNumber(u.cost);
        btn.title = u.desc;
        btn.disabled = cookies < u.cost;
        btn.addEventListener('click', () => buyClickUpgrade(u.id));
        clickSection.appendChild(btn);
    });
    upgradeShopEl.appendChild(clickSection);

    buildingDefs.forEach(b => {
        const bg = buildingUpgrades[b.id];
        const hasAny = bg.some(u => !ownedBuildingUpgrades[b.id][u.id]);
        if (!hasAny) return;

        const section = document.createElement('div');
        section.innerHTML = '<h4>' + b.label + ' Upgrades</h4>';
        bg.forEach(u => {
            if (ownedBuildingUpgrades[b.id][u.id]) return;
            const btn = document.createElement('button');
            btn.className = 'upgrade-btn upgrade-btn--small';
            btn.textContent = u.label + ' - ' + formatNumber(u.cost);
            btn.title = u.desc;
            btn.disabled = cookies < u.cost;
            btn.addEventListener('click', () => buyBuildingUpgrade(b.id, u.id));
            section.appendChild(btn);
        });
        upgradeShopEl.appendChild(section);
    });
}

// ===== BUY FUNCTIONS =====
function getBuyCount() {
    if (buyMode === 0) return 1;
    if (buyMode === 1) return 10;
    if (buyMode === 2) return 100;
    return Infinity;
}

function calcBulkPurchase(type) {
    const upg = upgrades[type];
    const count = getBuyCount();
    let bought = 0;
    let totalCost = 0;
    let tempCost = upg.cost;

    for (let i = 0; i < count; i++) {
        if (cookies < totalCost + tempCost) break;
        totalCost += tempCost;
        tempCost = Math.ceil(tempCost * upg.costMultiplier);
        bought++;
        if (count === Infinity && bought >= 10000) break;
    }
    return { bought, totalCost, unitCost: upg.cost };
}

function buyBuilding(type) {
    const upg = upgrades[type];
    const count = getBuyCount();
    let bought = 0;
    let totalCost = 0;
    let tempCost = upg.cost;

    for (let i = 0; i < count; i++) {
        if (cookies < totalCost + tempCost) break;
        totalCost += tempCost;
        tempCost = Math.ceil(tempCost * upg.costMultiplier);
        bought++;
        if (count === Infinity && bought >= 10000) break;
    }

    if (bought === 0) return;

    cookies -= totalCost;
    upg.owned += bought;
    upg.cost = tempCost;

    if (type === 'cursor') {
        for (let i = 0; i < bought; i++) addVisualCursor();
    }

    playSound();
    renderOwnedUpgrades();
    renderShop();
    renderUpgradeShop();
    updateDisplay();
    saveGame();
}

function buyClickUpgrade(id) {
    const u = clickUpgrades.find(x => x.id === id);
    if (!u || ownedClickUpgrades[id] || cookies < u.cost) return;
    cookies -= u.cost;
    ownedClickUpgrades[id] = true;
    u.apply();
    playSound();
    renderUpgradeShop();
    updateDisplay();
    saveGame();
}

function buyBuildingUpgrade(type, id) {
    const u = buildingUpgrades[type].find(x => x.id === id);
    if (!u || ownedBuildingUpgrades[type][id] || cookies < u.cost) return;
    cookies -= u.cost;
    ownedBuildingUpgrades[type][id] = true;
    playSound();
    renderUpgradeShop();
    renderOwnedUpgrades();
    updateDisplay();
    saveGame();
}

// ===== DISPLAY UPDATE =====
function updateDisplay() {
    const effectiveCps = getCpsForDisplay();
    cookieCountEl.textContent = formatNumber(cookies);
    const hasEffects = Object.keys(activeEffects).length > 0;
    cpsEl.textContent = formatNumber(effectiveCps) + (hasEffects ? ' (!)' : '');

    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        const id = btn.id;
        if (id && id.startsWith('buy-')) {
            const type = id.replace('buy-', '');
            if (upgrades[type]) btn.disabled = cookies < upgrades[type].cost;
        }
    });

    updateEffects();
    updatePrestigeBtn();
    updateCpsBreakdown();
    updateAchievements();
    updateStats();
    updateOwnedDisplay();
    updateShopCosts();
}

function updateEffects() {
    if (!effectsEl) return;
    effectsEl.innerHTML = '';
    const entries = Object.entries(activeEffects);
    if (entries.length === 0) { effectsEl.style.display = 'none'; return; }
    effectsEl.style.display = 'flex';

    const now = Date.now();
    const labels = {
        frenzy: 'Frenzy x7',
        clickFrenzy: 'Click Frenzy x777',
        clot: 'Clot x0.5',
    };
    entries.forEach(([id, data]) => {
        const remaining = data.endTime ? Math.max(0, Math.ceil((data.endTime - now) / 1000)) : 0;
        const timer = remaining > 0 ? ' [' + remaining + 's]' : '';

        if (id.startsWith('building_special_')) {
            const type = id.replace('building_special_', '');
            const b = buildingDefs.find(x => x.id === type);
            if (b) {
                const el = document.createElement('span');
                el.className = 'effect-badge effect-badge--special';
                el.textContent = b.label + ' x10' + timer;
                effectsEl.appendChild(el);
            }
            return;
        }
        const el = document.createElement('span');
        el.className = 'effect-badge effect-badge--' + id;
        el.textContent = (labels[id] || id) + timer;
        effectsEl.appendChild(el);
    });
}

function updatePrestigeBtn() {
    if (!prestigeBtn) return;
    const gained = Math.floor(Math.sqrt(cookies / 1000000000));
    if (cookies < 1000000 || gained < 1) {
        prestigeBtn.textContent = 'Prestige (need 1M+ cookies)';
        prestigeBtn.disabled = true;
    } else {
        const newMult = 1 + (totalPrestige + gained) * 0.01;
        prestigeBtn.textContent = 'Prestige: +' + gained + ' levels (x' + newMult.toFixed(2) + ' mult)';
        prestigeBtn.disabled = false;
    }
}

function updateOwnedDisplay() {
    buildingDefs.forEach(b => {
        const ownedEl = document.getElementById(b.id + '-owned');
        if (ownedEl) ownedEl.textContent = upgrades[b.id].owned;
    });
}

function updateShopCosts() {
    buildingDefs.forEach(b => {
        const bulk = calcBulkPurchase(b.id);
        const costEl = document.getElementById(b.id + '-cost');
        if (!costEl) return;
        let text = formatNumber(upgrades[b.id].cost);
        if (bulk.bought > 1) {
            text += ' &times;' + bulk.bought + ' = <b>' + formatNumber(bulk.totalCost) + '</b>';
        }
        costEl.innerHTML = text;

        const btn = document.getElementById('buy-' + b.id);
        if (btn) btn.disabled = cookies < upgrades[b.id].cost;
    });
}

function updateCpsBreakdown() {
    if (!cpsBreakdownEl) return;
    cpsBreakdownEl.innerHTML = '';
    let total = 0;
    buildingDefs.forEach(b => {
        const count = upgrades[b.id].owned;
        if (count === 0) return;
        const bCps = getBuildingCps(b.id, count) * getCpsMultiplier();
        total += bCps;
        const row = document.createElement('div');
        row.className = 'cps-row';
        row.textContent = b.label + ': ' + formatNumber(bCps) + ' CPS (' + count + ' owned)';
        cpsBreakdownEl.appendChild(row);
    });
    if (total > 0) {
        const totalRow = document.createElement('div');
        totalRow.className = 'cps-row cps-row--total';
        totalRow.textContent = 'Total: ' + formatNumber(total) + ' CPS';
        cpsBreakdownEl.appendChild(totalRow);
    }
}

// ===== ACHIEVEMENTS =====
function updateAchievements() {
    if (!achievementsEl) return;
    let changed = false;
    achievementDefs.forEach(a => {
        if (!achievements[a.id] && a.check()) {
            achievements[a.id] = true;
            changed = true;
            showPopup('Achievement: ' + a.label, '#ffd700');
        }
    });
    if (changed) saveGame();

    achievementsEl.innerHTML = '';
    let count = 0;
    achievementDefs.forEach(a => {
        const el = document.createElement('div');
        el.className = 'achievement' + (achievements[a.id] ? ' achievement--unlocked' : '');
        el.textContent = achievements[a.id] ? a.label : '???';
        el.title = a.desc;
        achievementsEl.appendChild(el);
        if (achievements[a.id]) count++;
    });
}

// ===== STATS =====
function updateStats() {
    if (!statsEl) return;
    statsEl.innerHTML =
        'Cookies baked (all time): ' + formatNumber(cookiesAllTime) + '<br>' +
        'Cookies in bank: ' + formatNumber(cookies) + '<br>' +
        'Total clicks: ' + formatNumber(cookiesClicked) + '<br>' +
        'Golden cookies clicked: ' + goldenCookiesClicked + '<br>' +
        'Play time: ' + formatTime(Math.floor((Date.now() - gameStarted) / 1000)) + '<br>' +
        'Prestige level: ' + totalPrestige + ' (x' + prestigeMultiplier.toFixed(1) + ')';
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h + 'h ' + m + 'm ' + s + 's';
}

// ===== SETTINGS =====
function renderSettings() {
    if (!settingsEl) return;
    settingsEl.innerHTML = '';
    const soundBtn = document.createElement('button');
    soundBtn.className = 'upgrade-btn upgrade-btn--small';
    soundBtn.textContent = soundEnabled ? 'Sound: ON' : 'Sound: OFF';
    soundBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        renderSettings();
        saveGame();
    });
    settingsEl.appendChild(soundBtn);

    const resetBtn = document.createElement('button');
    resetBtn.className = 'upgrade-btn upgrade-btn--small upgrade-btn--danger';
    resetBtn.textContent = 'Hard Reset';
    resetBtn.addEventListener('click', () => {
        if (confirm('Delete ALL progress?')) {
            localStorage.removeItem(saveKey);
            location.reload();
        }
    });
    settingsEl.appendChild(resetBtn);
}

function playSound() {
    if (!soundEnabled) return;
    try {
        const a = new Audio('bubbleclick.mp3');
        a.volume = 0.3;
        a.play().catch(() => {});
    } catch (e) {}
}

// ===== POPUP =====
function showPopup(text, color) {
    const el = document.createElement('div');
    el.className = 'effect-popup';
    el.textContent = text;
    el.style.color = color || '#fff';
    el.style.left = '50%';
    el.style.top = '30%';
    document.querySelector('.game-container').appendChild(el);
    setTimeout(() => el.remove(), 2000);
}

// ===== PRESTIGE =====
function doPrestige() {
    if (cookies < 1000000) return;
    const gained = Math.floor(Math.sqrt(cookies / 1000000000));
    if (gained < 1) return;
    if (!confirm('Reset for ' + gained + ' prestige levels?')) return;

    totalPrestige += gained;
    prestigeMultiplier = 1 + totalPrestige * 0.01;
    cookies = 0;
    cookiesPerSecond = 0;
    clickPower = 1;

    buildingDefs.forEach(b => {
        upgrades[b.id].cost = b.cost;
        upgrades[b.id].owned = 0;
    });

    Object.keys(ownedClickUpgrades).forEach(k => ownedClickUpgrades[k] = false);
    Object.keys(ownedBuildingUpgrades).forEach(type => {
        Object.keys(ownedBuildingUpgrades[type]).forEach(k => ownedBuildingUpgrades[type][k] = false);
    });

    document.querySelectorAll('.visual-cursor').forEach(el => el.remove());

    renderOwnedUpgrades();
    renderShop();
    renderUpgradeShop();
    updateDisplay();
    saveGame();
    showPopup('Prestige! x' + prestigeMultiplier.toFixed(2), '#a855f7');
}

// ===== GRANDMAPOCALYPSE (SIMPLIFIED) =====
function checkGrandmapocalypse() {
    if (upgrades.grandma.owned >= 1 && !wrathMode) {
        wrathMode = true;
        showPopup('Grandmapocalypse begins...', '#aa2222');
    }
}

// ===== CLICK COOKIE =====
function clickCookie(event) {
    const power = getClickPower();
    cookies += power;
    cookiesClicked++;
    cookiesAllTime += power;
    if (gameStarted === 0) gameStarted = Date.now();

    playSound();

    if (Math.random() < 0.01) {
        spawnGoldenCookie();
    }

    checkGrandmapocalypse();
    updateDisplay();
    saveGame();
    createClickStars(event);
}

// ===== STAR EFFECT =====
function createClickStars(event) {
    const rect = theCookieBtn.getBoundingClientRect();
    const cx = event ? event.clientX : rect.left + rect.width / 2;
    const cy = event ? event.clientY : rect.top + rect.height / 2;

    for (let i = 0; i < 5; i++) {
        const star = document.createElement('div');
        star.className = 'star-burst';
        star.textContent = '★';
        const angle = (Math.PI * 2 * i) / 5;
        const dist = 30 + Math.random() * 35;
        star.style.left = cx + 'px';
        star.style.top = cy + 'px';
        star.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
        star.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
        document.body.appendChild(star);
        setTimeout(() => star.remove(), 700);
    }
}

// ===== VISUAL CURSORS =====
function rebuildVisualCursors() {
    cursorCircle.innerHTML = '';
    for (let i = 0; i < upgrades.cursor.owned; i++) addVisualCursor();
}

function addVisualCursor() {
    const cursor = document.createElement('div');
    cursor.className = 'visual-cursor';
    cursorCircle.appendChild(cursor);
    const cursors = document.querySelectorAll('.visual-cursor');
    const step = 360 / cursors.length;
    cursors.forEach((c, i) => {
        c.style.transform = 'rotate(' + (step * i) + 'deg) translate(100px) rotate(-' + (step * i) + 'deg)';
    });
}

// ===== BULK BUY =====
function setBuyMode(mode) {
    buyMode = mode;
    bulkBtns.forEach(b => b.classList.toggle('bulk-btn--active', parseInt(b.dataset.mode) === mode));
    renderShop();
}

// ===== TABS =====
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-btn--active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('tab-content--active'));
        btn.classList.add('tab-btn--active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('tab-content--active');
    });
});

// ===== INIT =====
loadGame();
rebuildVisualCursors();
renderOwnedUpgrades();
renderShop();
renderUpgradeShop();
renderSettings();
updateDisplay();
scheduleGoldenCookie();

// ===== EVENT LISTENERS =====
theCookieBtn.addEventListener('click', clickCookie);

bulkBtns.forEach(btn => {
    btn.addEventListener('click', () => setBuyMode(parseInt(btn.dataset.mode)));
});
setBuyMode(0);

document.getElementById('prestige-btn')?.addEventListener('click', doPrestige);

// ===== TICK =====
setInterval(() => {
    const cps = getCpsForDisplay();
    cookies += cps / 10;
    cookiesAllTime += cps / 10;
    updateDisplay();
}, 100);

setInterval(saveGame, 5000);
window.addEventListener('beforeunload', saveGame);
