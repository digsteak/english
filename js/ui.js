// ============================================================
// ui.js — UI 管理、商店系統、Toast 通知
// ============================================================

// --- Toast 通知（修復 timer 覆蓋問題） ---
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    clearTimeout(G.toastTimer);
    toast.innerText = msg;
    toast.style.opacity = 1;
    G.toastTimer = setTimeout(() => { toast.style.opacity = 0; }, TOAST_DURATION);
}

// --- 更新遊戲 UI ---
function updateUI() {
    document.getElementById('money-display').innerText = G.gameState.money;
    document.getElementById('lives-display').innerText = `${G.gameState.lives} / ${G.gameState.maxLives || 1000}`;
    document.getElementById('wave-display').innerText = G.gameState.wave;
    document.getElementById('boss-kill-display').innerText = G.gameState.bossesKilled;
    document.getElementById('tower-count-display').innerText = G.towers.length;
    document.getElementById('tower-max-display').innerText = G.gameState.maxTowers;

    const hint = document.getElementById('merge-hint');
    hint.style.display = G.gameState.selectedTower ? 'block' : 'none';

    const sellBtn = document.getElementById('sell-btn');
    if (G.gameState.selectedTower) {
        const t = G.gameState.selectedTower;
        const refund = Math.floor(TOWER_TYPES[t.type].cost * t.level * SELL_REFUND_RATE);
        sellBtn.innerText = `🗑️ 販賣 ($${refund})`;
        sellBtn.style.display = 'block';
    } else {
        sellBtn.style.display = 'none';
    }

    for (let type in TOWER_TYPES) {
        const btn = document.getElementById('btn-' + type);
        if (!btn) continue;
        const cost = TOWER_TYPES[type].cost;
        document.getElementById('cost-' + type).innerText = cost;
        btn.className = 'tower-btn';
        if (TOWER_TYPES[type].locked) {
            btn.classList.add('hidden');
        } else {
            btn.classList.remove('hidden');
            if (G.gameState.money < cost) btn.classList.add('disabled');
            if (G.gameState.buildModeType === type) btn.classList.add('selected');
        }
        // 同步更新快速列按鈕
        const qbtn = document.getElementById('qbtn-' + type);
        if (qbtn) {
            if (TOWER_TYPES[type].locked) {
                qbtn.style.display = 'none';
            } else {
                qbtn.style.display = '';
                qbtn.style.opacity = G.gameState.money < cost ? '0.4' : '1';
                qbtn.style.background = G.gameState.buildModeType === type ? '#45a29e' : '#1f2833';
                qbtn.style.color = G.gameState.buildModeType === type ? 'white' : TOWER_TYPES[type].color;
            }
        }
    }
}

// --- 更新敵軍強度顯示 ---
function updateScalingInfo() {
    const scale = Math.pow(2, Math.floor(G.gameState.bossesKilled / SCALING_INTERVAL));
    const lvlCap = getCurrentMaxLevel();
    document.getElementById('scaling-info').innerText = `敵軍強度: x${scale} | 等級上限: Lv.${lvlCap}`;
}

// --- 初始化塔防按鈕（面板完整列表） ---
function initTowerButtons() {
    const container = document.getElementById('tower-controls');
    if (!container) return;
    container.innerHTML = '';
    const quickContainer = document.getElementById('quick-towers');
    if (quickContainer) quickContainer.innerHTML = '';
    let idx = 0;
    for (let key in TOWER_TYPES) {
        const btn = document.createElement('button');
        btn.id = 'btn-' + key;
        btn.className = 'tower-btn hidden';
        btn.style.borderColor = TOWER_TYPES[key].color;
        btn.innerHTML = `<span>${TOWER_TYPES[key].name}</span><small>$<span id="cost-${key}">${TOWER_TYPES[key].cost}</span></small>`;
        btn.onclick = () => setBuildMode(key);
        container.appendChild(btn);
        // 前三種基礎塔也加入快速列
        if (idx < 3 && quickContainer) {
            const qbtn = document.createElement('button');
            qbtn.id = 'qbtn-' + key;
            qbtn.className = 'quick-btn';
            qbtn.style.borderColor = TOWER_TYPES[key].color;
            qbtn.style.color = TOWER_TYPES[key].color;
            qbtn.innerHTML = `${TOWER_TYPES[key].name} <small style="color:#ffd700">$${TOWER_TYPES[key].cost}</small>`;
            qbtn.onclick = () => setBuildMode(key);
            quickContainer.appendChild(qbtn);
        }
        idx++;
    }
}

// --- 建造模式切換 ---
function setBuildMode(type) {
    if (TOWER_TYPES[type] && TOWER_TYPES[type].locked) return;
    if (G.gameState.buildModeType === type) {
        G.gameState.buildModeType = null;
    } else {
        G.gameState.buildModeType = type;
        G.gameState.selectedTower = null;
    }
    updateUI();
}

// --- 販賣選中的塔 ---
function sellSelectedTower() {
    if (!G.gameState.selectedTower) return;
    soundManager.sell();
    const t = G.gameState.selectedTower;
    const refund = Math.floor(TOWER_TYPES[t.type].cost * t.level * SELL_REFUND_RATE);
    G.gameState.money += refund;
    G.towers = G.towers.filter(tower => tower !== t);
    G.gameState.selectedTower = null;
    createExplosion(t.x, t.y, 10, '#888');
    showToast(`已販賣! +$${refund}`);
    updateUI();
}

// --- 全螢幕切換 ---
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            showToast(`無法進入全螢幕: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// ============================================================
// 商店系統
// ============================================================

function toggleShop() {
    if (document.getElementById('shop-screen').style.display === 'flex') {
        closeShop();
    } else if (G.gameState.isPlaying && !G.gameState.isGameOver) {
        openShop(true);
    }
}

function openShop(fromGame = false) {
    G.shopOpenFromGame = fromGame;
    document.getElementById('shop-error').innerText = '';

    if (fromGame) {
        if (!G.gameState.isPaused && G.gameState.isPlaying) {
            togglePause();
            G.shopAutoPaused = true;
        } else {
            G.shopAutoPaused = false;
        }
        document.getElementById('shop-screen').style.zIndex = '200';
    } else {
        document.getElementById('home-screen').style.display = 'none';
        document.getElementById('shop-screen').style.zIndex = '160';
    }

    document.getElementById('shop-screen').style.display = 'flex';
    renderShop();
}

function closeShop() {
    document.getElementById('shop-screen').style.display = 'none';
    if (G.shopOpenFromGame) {
        if (G.shopAutoPaused && G.gameState.isPaused && G.gameState.isPlaying) {
            togglePause();
        }
        updateUI();
    } else {
        document.getElementById('home-screen').style.display = 'flex';
        document.getElementById('home-bank-display').innerText = G.globalBank;
    }
}

function renderShop() {
    let bankText = G.globalBank;
    if (G.shopOpenFromGame) {
        bankText += ` (可動用局內資金代扣: $${G.gameState.money})`;
    }
    document.getElementById('shop-bank-display').innerText = bankText;

    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '';

    for (let key in TOWER_TYPES) {
        if (TOWER_TYPES[key].isPremium) {
            const isBought = G.unlockedPremium.includes(key);
            const item = document.createElement('div');
            item.className = `shop-item ${isBought ? 'bought' : ''}`;
            item.style.borderColor = TOWER_TYPES[key].color;

            item.innerHTML = `
                <h3 style="color:${TOWER_TYPES[key].color}">${TOWER_TYPES[key].name}塔</h3>
                <p>${TOWER_TYPES[key].desc}</p>
                <button class="shop-btn ${isBought ? 'bought' : ''}"
                        onclick="buyPremium('${key}')">
                    ${isBought ? '已解鎖' : '購買: $' + TOWER_TYPES[key].price}
                </button>
            `;
            grid.appendChild(item);
        }
    }
}

function buyPremium(key) {
    if (G.unlockedPremium.includes(key)) return;
    const price = TOWER_TYPES[key].price;

    let canBuy = false;
    if (G.globalBank >= price) {
        G.globalBank -= price;
        canBuy = true;
    } else if (G.shopOpenFromGame && (G.globalBank + G.gameState.money) >= price) {
        const needed = price - G.globalBank;
        G.globalBank = 0;
        G.gameState.money -= needed;
        canBuy = true;
    }

    if (canBuy) {
        localStorage.setItem('starDefenseBank', G.globalBank);
        G.unlockedPremium.push(key);
        localStorage.setItem('starDefensePremium', JSON.stringify(G.unlockedPremium));
        TOWER_TYPES[key].locked = false;
        soundManager.build();
        renderShop();
        if (G.shopOpenFromGame) updateUI();
    } else {
        document.getElementById('shop-error').innerText = '❌ 星際幣及局內資金不足！';
        soundManager.damage();
    }
}
