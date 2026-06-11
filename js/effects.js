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

function getCpsForDisplay() {
    const base = getEffectiveCps();
    return activeEffects.clot ? base * 0.5 : base;
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

    const el = document.createElement('div');
    el.className = 'golden-cookie';
    el.style.left = `${rand(20, 60)}%`;
    el.style.top = `${rand(10, 60)}%`;

    el.addEventListener('click', (e) => {
        el.remove();
        goldenSparkle(e.clientX, e.clientY);
        applyGoldenEffect();
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

// ===== SOUND =====
function playSound() {
    if (!soundEnabled) return;
    try {
        const a = new Audio('audio/bubbleclick.mp3');
        a.volume = 0.3;
        a.play().catch(() => {});
    } catch (e) {}
}

// ===== SPARKLE PARTICLES =====
function goldenSparkle(cx, cy) {
    const colors = ['#ffd700', '#ffec8b', '#fff8dc', '#ffb347', '#ff6b6b'];
    for (let i = 0; i < 12; i++) {
        const p = document.createElement('div');
        p.className = 'golden-sparkle';
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 50;
        const size = 4 + Math.random() * 6;
        p.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;width:' + size + 'px;height:' + size + 'px;background:' + colors[Math.floor(Math.random() * colors.length)];
        p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
        p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 700);
    }
}
