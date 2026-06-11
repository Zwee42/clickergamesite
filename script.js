// Game Variables
let cookies = 100;
let cookiesPerSecond = 0;

// Upgrades Data
const upgrades = {
    cursor: {
        cost: 15,
        cps: 1,
        owned: 0,
        costMultiplier: 1.15
    },
    grandma: {
        cost: 100,
        cps: 5,
        owned: 0,
        costMultiplier: 1.15
    },
    farm: {
        cost: 1100,
        cps: 8,
        owned: 0,
        costMultiplier: 1.15
    },
    mine: {
        cost: 12000,
        cps: 25,
        owned: 0,
        costMultiplier: 1.16
    },
    factory: {
        cost: 60000,
        cps: 100,
        owned: 0,
        costMultiplier: 1.17
    },
    bank: {
        cost: 250000,
        cps: 500,
        owned: 0,
        costMultiplier: 1.18
    }
};

// DOM Elements
const cookieCountEl = document.getElementById('cookie-count');
const cpsEl = document.getElementById('cookies-per-second');
const theCookieBtn = document.getElementById('the-cookie');

const buyCursorBtn = document.getElementById('buy-cursor');
const cursorCostEl = document.getElementById('cursor-cost');
const cursorOwnedEl = document.getElementById('cursor-owned');

const buyGrandmaBtn = document.getElementById('buy-grandma');
const grandmaCostEl = document.getElementById('grandma-cost');
const grandmaOwnedEl = document.getElementById('grandma-owned');

const buyFarmBtn = document.getElementById('buy-farm');
const farmCostEl = document.getElementById('farm-cost');
const farmOwnedEl = document.getElementById('farm-owned');

const buyMineBtn = document.getElementById('buy-mine');
const mineCostEl = document.getElementById('mine-cost');
const mineOwnedEl = document.getElementById('mine-owned');

const buyFactoryBtn = document.getElementById('buy-factory');
const factoryCostEl = document.getElementById('factory-cost');
const factoryOwnedEl = document.getElementById('factory-owned');

const buyBankBtn = document.getElementById('buy-bank');
const bankCostEl = document.getElementById('bank-cost');
const bankOwnedEl = document.getElementById('bank-owned');

const cursorCircle = document.getElementById('cursor-circle');

// Functions
function updateDisplay() {
    // Update score
    cookieCountEl.textContent = Math.floor(cookies);
    cpsEl.textContent = cookiesPerSecond.toFixed(1);
    
    // Update button states
    buyCursorBtn.disabled = cookies < upgrades.cursor.cost;
    buyGrandmaBtn.disabled = cookies < upgrades.grandma.cost;
    buyFarmBtn.disabled = cookies < upgrades.farm.cost;
    buyMineBtn.disabled = cookies < upgrades.mine.cost;
    buyFactoryBtn.disabled = cookies < upgrades.factory.cost;
    buyBankBtn.disabled = cookies < upgrades.bank.cost;
}

function clickCookie(event) {
    cookies += 1;
    updateDisplay();
    createClickStars(event);
}

function createClickStars(event) {
    const rect = theCookieBtn.getBoundingClientRect();
    const centerX = event && event.clientX !== undefined && event.clientX !== 0 ? event.clientX : rect.left + rect.width / 2;
    const centerY = event && event.clientY !== undefined && event.clientY !== 0 ? event.clientY : rect.top + rect.height / 2;

    const starCount = 5;
    for (let index = 0; index < starCount; index += 1) {
        const star = document.createElement('div');
        star.className = 'star-burst';
        star.textContent = '★';

        const angle = (Math.PI * 2 * index) / starCount;
        const distance = 30 + Math.random() * 35;
        const dx = `${Math.cos(angle) * distance}px`;
        const dy = `${Math.sin(angle) * distance}px`;

        star.style.left = `${centerX}px`;
        star.style.top = `${centerY}px`;
        star.style.setProperty('--dx', dx);
        star.style.setProperty('--dy', dy);

        document.body.appendChild(star);
        setTimeout(() => star.remove(), 700);
    }
}

function buyUpgrade(type) {
    const upgrade = upgrades[type];
    if (cookies >= upgrade.cost) {
        cookies -= upgrade.cost;
        upgrade.owned += 1;
        cookiesPerSecond += upgrade.cps;
        
        // Increase cost
        upgrade.cost = Math.ceil(upgrade.cost * upgrade.costMultiplier);
        
        // Update DOM for this upgrade
        if (type === 'cursor') {
            cursorCostEl.textContent = upgrade.cost;
            cursorOwnedEl.textContent = upgrade.owned;
            addVisualCursor();
        } else if (type === 'grandma') {
            grandmaCostEl.textContent = upgrade.cost;
            grandmaOwnedEl.textContent = upgrade.owned;
        } else if (type === 'farm') {
            farmCostEl.textContent = upgrade.cost;
            farmOwnedEl.textContent = upgrade.owned;
        } else if (type === 'mine') {
            mineCostEl.textContent = upgrade.cost;
            mineOwnedEl.textContent = upgrade.owned;
        } else if (type === 'factory') {
            factoryCostEl.textContent = upgrade.cost;
            factoryOwnedEl.textContent = upgrade.owned;
        } else if (type === 'bank') {
            bankCostEl.textContent = upgrade.cost;
            bankOwnedEl.textContent = upgrade.owned;
        }
        
        updateDisplay();
    }
}

function addVisualCursor() {
    // Create new cursor element
    const cursor = document.createElement('div');
    cursor.className = 'visual-cursor';
    cursorCircle.appendChild(cursor);
    
    // Reposition all cursors evenly in a circle
    const cursors = document.querySelectorAll('.visual-cursor');
    const angleStep = 360 / cursors.length;
    
    cursors.forEach((c, index) => {
        const angle = angleStep * index;
        // Rotate outwards, translate by radius (120px), then rotate to orient correctly
        c.style.transform = `rotate(${angle}deg) translate(120px) rotate(-90deg)`;
    });
}

// Fixed tick per 100ms for smoother visual updates instead of jumping every 1 second
setInterval(() => {
    cookies += cookiesPerSecond / 10;
    updateDisplay();
}, 100);

// Event Listeners
theCookieBtn.addEventListener('click', clickCookie);

buyCursorBtn.addEventListener('click', () => buyUpgrade('cursor'));
buyGrandmaBtn.addEventListener('click', () => buyUpgrade('grandma'));
buyFarmBtn.addEventListener('click', () => buyUpgrade('farm'));
buyMineBtn.addEventListener('click', () => buyUpgrade('mine'));
buyFactoryBtn.addEventListener('click', () => buyUpgrade('factory'));
buyBankBtn.addEventListener('click', () => buyUpgrade('bank'));

// Initial render
updateDisplay();
