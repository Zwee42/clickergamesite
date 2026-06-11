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

// ===== BUILDING UPGRADE HELPERS =====
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
    const leftPanel = document.querySelector('.left-panel');
    const prevScroll = leftPanel ? leftPanel.scrollTop : 0;
    ownedUpgradesEl.innerHTML = '';
    const maxRows = 3;
    const maxPerRow = 5;
    const gap = 6;
    const panelWidth = ownedUpgradesEl.clientWidth || 180;
    let boxSize = Math.floor((panelWidth - (maxPerRow - 1) * gap) / maxPerRow);
    if (boxSize > 42) boxSize = 42;

    buildingDefs.forEach((b) => {
        const owned = upgrades[b.id].owned;
        if (owned === 0) return;

        const totalSlots = maxRows * maxPerRow;
        const toShow = Math.min(owned, totalSlots);
        const rowsCount = Math.ceil(toShow / maxPerRow);

        for (let r = 0; r < rowsCount; r++) {
            const row = document.createElement('div');
            row.className = 'upgrade-row';

            const start = r * maxPerRow;
            const end = Math.min(start + maxPerRow, toShow);

            for (let i = start; i < end; i++) {
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

            if (r < rowsCount - 1) {
                row.style.borderBottom = 'none';
                row.style.paddingBottom = '0';
                row.style.marginBottom = '0';
            }

            ownedUpgradesEl.appendChild(row);
        }
    });

    if (ownedUpgradesEl.children.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'owned-upgrades-empty';
        empty.textContent = 'No upgrades yet. Buy from the shop!';
        ownedUpgradesEl.appendChild(empty);
    }

    if (leftPanel) leftPanel.scrollTop = prevScroll;
}

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
        if (buyMode !== 0 && bulk.bought > 1) {
            costText += ' &times;' + bulk.bought + ' = <b>' + formatNumber(bulk.totalCost) + '</b>';
        }
        const effectiveCps = upg.cps * getBuildingMultiplier(b.id);
        label.innerHTML = b.label + ' (' + costText + ') <br>' +
            '<small>+' + formatNumber(effectiveCps) + ' cookie/sec</small><br>' +
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
    if (gained < 1) {
        prestigeBtn.textContent = 'Prestige (need 1B cookies to gain a level)';
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
        if (buyMode !== 0 && bulk.bought > 1) {
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

// ===== STAR EFFECT =====
function createClickStars(event) {
    const rect = theCookieBtn.getBoundingClientRect();
    const cx = event ? event.clientX : rect.left + rect.width / 2;
    const cy = event ? event.clientY : rect.top + rect.height / 2;

    for (let i = 0; i < 5; i++) {
        const star = document.createElement('div');
        star.className = 'star-burst';
        star.textContent = '\u2605';
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

// ===== TABS =====
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-btn--active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('tab-content--active'));
        btn.classList.add('tab-btn--active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('tab-content--active');
    });
});

// ===== BULK BUY MODE =====
function setBuyMode(mode) {
    buyMode = mode;
    bulkBtns.forEach(b => b.classList.toggle('bulk-btn--active', parseInt(b.dataset.mode) === mode));
    renderShop();
}
