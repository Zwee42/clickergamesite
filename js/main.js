// ===== SAVE / LOAD =====
function saveGame() {
    const data = {
        cookies, cookiesPerSecond, cookiesClicked, cookiesAllTime, clickPower,
        goldenCookiesClicked, totalPrestige, prestigeMultiplier, soundEnabled,
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

    updateDisplay();
    saveGame();
    createClickStars(event);
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
