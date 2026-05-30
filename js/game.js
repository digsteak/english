// ============================================================
// game.js — 遊戲核心邏輯、迴圈、波次管理
// ============================================================

// --- 當前最高合成等級 ---
function getCurrentMaxLevel() {
    return 5 + Math.floor(G.gameState.bossesKilled / SCALING_INTERVAL);
}

// --- 暫停切換 ---
function togglePause() {
    if (!G.gameState.isPlaying || G.gameState.isGameOver) return;
    G.gameState.isPaused = !G.gameState.isPaused;
    document.getElementById('pause-btn').innerText = G.gameState.isPaused ? '▶️ 繼續 (P)' : '⏸️ 暫停 (P)';
}

// --- 一鍵合成 ---
function autoMerge() {
    if (!G.gameState.isPlaying || G.gameState.isGameOver || G.gameState.isPaused) return;
    let mergedAny = false;
    let keepChecking = true;
    const currentMax = getCurrentMaxLevel();

    while (keepChecking) {
        keepChecking = false;
        for (let i = 0; i < G.towers.length; i++) {
            for (let j = i + 1; j < G.towers.length; j++) {
                const t1 = G.towers[i];
                const t2 = G.towers[j];
                if (t1.type === t2.type && t1.level === t2.level && t1.level < currentMax) {
                    t1.level++;
                    createExplosion(t1.x, t1.y, 15, '#ffd700');
                    G.towers.splice(j, 1);
                    keepChecking = true;
                    mergedAny = true;
                    break;
                }
            }
            if (keepChecking) break;
        }
    }
    if (mergedAny) {
        G.gameState.selectedTower = null;
        soundManager.merge();
        showToast('✨ 一鍵合成完成！');
        updateUI();
    } else {
        showToast('目前沒有可合成的塔');
    }
}

// --- 地圖切換 ---
function switchMap() {
    if (G.gameState.mapLevel === 2 || G.currentMapIsCustom) return;
    soundManager.warp();
    const overlay = document.getElementById('warp-overlay');
    overlay.style.opacity = 1;

    setTimeout(() => {
        G.enemies = [];
        G.projectiles = [];
        G.particles = [];
        G.effects = [];
        G.floatingTexts = [];
        G.gameState.enemiesToSpawn = [];
        G.gameState.waveInProgress = false;
        document.getElementById('next-wave-btn').style.display = 'block';

        let refundTotal = 0;
        G.towers.forEach(t => refundTotal += TOWER_TYPES[t.type].cost * t.level);
        G.gameState.money += refundTotal;
        G.towers = [];
        G.gameState.selectedTower = null;

        G.currentPath = PATH_POINTS_2;
        G.tileData = generateTileDataFromPath(PATH_POINTS_2);
        G.gameState.mapLevel = 2;
        document.body.classList.add('map-2');

        showToast(`🚀 空間跳躍完成！\n進入第二星區\n全額回收補給: $${refundTotal}`);
        updateUI();
        overlay.style.opacity = 0;
    }, 1000);
}

// --- 傷害處理 ---
function applyDamage(enemy, dmg) {
    if (!enemy || enemy.hp <= 0) return;
    enemy.hp -= dmg;
    if (enemy.hp <= 0 && G.enemies.includes(enemy)) {
        G.gameState.money += enemy.reward;
        G.gameState.score += 10;
        createExplosion(enemy.x, enemy.y, 8, '#fff');
        soundManager.explosion();

        // 母艦死亡時產生無人機
        if (enemy.typeKey === 'boss_carrier') {
            for (let i = 0; i < 3; i++) {
                const offsetX = (i - 1) * 10;
                const offsetY = (Math.floor(Math.random() * 3) - 1) * 10;
                const drone = new Enemy(G.gameState.wave, 'drone', enemy.x + offsetX, enemy.y + offsetY, enemy.pathIndex);
                drone.updateTarget();
                G.enemies.push(drone);
            }
        }

        if (enemy.isBoss) {
            G.gameState.bossesKilled++;
            checkUnlocks();

            // 無限模式地圖切換
            if (G.gameState.mode === 'infinite' && G.gameState.bossesKilled === MAP_SWITCH_BOSS_KILL_INFINITE && G.gameState.mapLevel === 1) {
                switchMap();
            }

            // 強化通知
            if (G.gameState.bossesKilled % SCALING_INTERVAL === 0) {
                const scale = Math.pow(2, Math.floor(G.gameState.bossesKilled / SCALING_INTERVAL));
                const lvlCap = getCurrentMaxLevel();
                showToast(`⚠️ 敵軍全面強化 (x${scale})！\n✨ 合成上限提升至 Lv.${lvlCap}`);
                updateScalingInfo();
            }
        }
    }
}

// --- 解鎖邏輯 ---
function checkUnlocks() {
    if (G.gameState.mode === 'campaign') {
        // 戰役模式由 handleWaveClear 處理
    } else {
        // 無限模式按 Boss 擊殺數解鎖
        const k = G.gameState.bossesKilled;
        if (k >= 2  && TOWER_TYPES.ice.locked)       unlockTower('ice');
        if (k >= 4  && TOWER_TYPES.cannon.locked)     unlockTower('cannon');
        if (k >= 6  && TOWER_TYPES.poison.locked)     unlockTower('poison');
        if (k >= 8  && TOWER_TYPES.flame.locked)      unlockTower('flame');
        if (k >= 10 && TOWER_TYPES.tesla.locked)      unlockTower('tesla');
        if (k >= 12 && TOWER_TYPES.gatling.locked)    unlockTower('gatling');
        if (k >= 15 && TOWER_TYPES.multishot.locked)  unlockTower('multishot');
        if (k >= 18 && TOWER_TYPES.bank.locked)       unlockTower('bank');
        if (k >= 21 && TOWER_TYPES.radar.locked)      unlockTower('radar');
        if (k >= 25 && TOWER_TYPES.plasma.locked)     unlockTower('plasma');
        if (k >= 30 && TOWER_TYPES.laser.locked)      unlockTower('laser');
        if (k >= 35 && TOWER_TYPES.artillery.locked)  unlockTower('artillery');
        if (k >= 40 && TOWER_TYPES.emp.locked)        unlockTower('emp');
        if (k >= 45 && TOWER_TYPES.blackhole.locked)  unlockTower('blackhole');
        if (k >= 50 && TOWER_TYPES.dronepad.locked)   unlockTower('dronepad');
        if (k >= 55 && TOWER_TYPES.prism.locked)      unlockTower('prism');
        if (k >= 60 && TOWER_TYPES.railgun.locked)    unlockTower('railgun');
        if (k >= 70 && TOWER_TYPES.nuke.locked)       unlockTower('nuke');
        if (k >= 80 && TOWER_TYPES.orbital.locked)    unlockTower('orbital');
    }
}

function unlockTower(id) {
    if (TOWER_TYPES[id] && TOWER_TYPES[id].locked) {
        TOWER_TYPES[id].locked = false;
        const btn = document.getElementById('btn-' + id);
        if (btn) btn.classList.remove('hidden');
        return `${TOWER_TYPES[id].name}`;
    }
    return null;
}

// --- 返回首頁 ---
function returnToHome() {
    document.getElementById('overlay-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'none';
    document.getElementById('ui-panel').style.display = 'none';
    document.getElementById('quick-bar').style.display = 'none';
    document.getElementById('home-screen').style.display = 'flex';
    document.getElementById('home-bank-display').innerText = G.globalBank;
    G.gameState.isPlaying = false;
}

// --- 開始遊戲 ---
function startGame(mode) {
    soundManager.init();
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('overlay-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';
    document.getElementById('ui-panel').style.display = 'flex';
    document.getElementById('quick-bar').style.display = 'flex';
    document.getElementById('next-wave-btn').style.display = 'block';

    // 重設陣列
    G.towers = [];
    G.enemies = [];
    G.projectiles = [];
    G.particles = [];
    G.floatingTexts = [];
    G.effects = [];

    // 重設遊戲狀態
    G.gameState = {
        mode: mode,
        money: INITIAL_MONEY,
        lives: INITIAL_LIVES,
        maxLives: INITIAL_LIVES,
        baseAttackDamage: 500,
        wave: 0,
        bossesKilled: 0,
        isPlaying: true,
        isGameOver: false,
        isPaused: false,
        buildModeType: null,
        selectedTower: null,
        spawnTimer: 0,
        enemiesToSpawn: [],
        waveInProgress: false,
        maxTowers: INITIAL_MAX_TOWERS,
        score: 0,
        mapLevel: 1
    };

    if (mode === 'campaign') {
        G.gameState.money += G.globalBank;
        G.globalBank = 0;
        localStorage.setItem('starDefenseBank', 0);
        document.getElementById('mode-display-text').innerText = '(關卡模式: 100關)';
    } else {
        document.getElementById('mode-display-text').innerText = '(無限模式)';
    }

    // 鎖定所有進階塔，保留商店已購買的
    const preservedPremium = {};
    for (let key in TOWER_TYPES) {
        if (TOWER_TYPES[key].isPremium && G.unlockedPremium.includes(key)) {
            preservedPremium[key] = true;
        }
        TOWER_TYPES[key].locked = !BASE_TOWERS.includes(key);
    }
    for (let key in preservedPremium) {
        TOWER_TYPES[key].locked = false;
    }

    // 更新按鈕顯示
    document.querySelectorAll('.tower-btn').forEach(btn => {
        const id = btn.id.replace('btn-', '');
        if (TOWER_TYPES[id].locked) btn.classList.add('hidden');
        else btn.classList.remove('hidden');
    });

    document.body.classList.remove('map-2');

    if (G.loadedMapData && G.loadedMapData.path) {
        G.currentPath = G.loadedMapData.path;
        G.currentMapIsCustom = true;
        G.tileData = G.loadedMapData.tileData && G.loadedMapData.tileData.length > 0
            ? G.loadedMapData.tileData : generateTileDataFromPath(G.currentPath);
    } else {
        G.currentPath = PATH_POINTS_1;
        G.currentMapIsCustom = false;
        G.tileData = generateTileDataFromPath(G.currentPath);
    }
    updateScalingInfo();
    updateUI();
    gameLoop();
}

// --- 波次管理 ---
function startNextWave() {
    if (G.gameState.waveInProgress || G.gameState.isGameOver || G.gameState.isPaused) return;

    if (G.gameState.mode === 'campaign' && G.gameState.wave >= CAMPAIGN_MAX_WAVES) {
        gameWin();
        return;
    }

    if (G.gameState.mode === 'campaign' && G.gameState.wave === MAP_SWITCH_WAVE_CAMPAIGN && G.gameState.mapLevel === 1) {
        switchMap();
        setTimeout(() => spawnWaveLogic(), 1000);
    } else {
        spawnWaveLogic();
    }
}

function spawnWaveLogic() {
    soundManager.startWave();
    G.gameState.wave++;
    G.gameState.waveInProgress = true;
    G.gameState.enemiesToSpawn = [];

    const isBossWave = (G.gameState.wave % 10 === 0);

    if (isBossWave) {
        const isSuperBoss = (G.gameState.wave % 20 === 0);
        showToast(`⚠️ ${isSuperBoss ? '災難級 ' : ''}BOSS 來襲！(第 ${G.gameState.wave} 波)`);
        const bossCount = (isSuperBoss ? 10 : 3) + Math.floor(G.gameState.wave / 10);

        for (let i = 0; i < (isSuperBoss ? 15 : 8); i++) {
            G.gameState.enemiesToSpawn.push(Math.random() > 0.5 ? 'scout' : 'stealth');
        }

        const bossTypes = ['boss_berserker', 'boss_carrier', 'boss_armored', 'boss_teleporter'];
        for (let i = 0; i < bossCount; i++) {
            const randomBoss = bossTypes[Math.floor(Math.random() * bossTypes.length)];
            G.gameState.enemiesToSpawn.push(randomBoss);
            G.gameState.enemiesToSpawn.push(isSuperBoss ? 'healer' : 'tank');
        }
    } else {
        const count = 5 + Math.floor(G.gameState.wave * 1.8);
        for (let i = 0; i < count; i++) {
            let type = 'normal';
            const rand = Math.random();
            if (G.gameState.wave > 3 && rand < 0.3) type = 'scout';
            else if (G.gameState.wave > 5 && rand < 0.2) type = 'tank';
            else if (G.gameState.wave > 7 && rand < 0.1) type = 'healer';
            else if (G.gameState.wave > 12 && rand < 0.15) type = 'stealth';
            G.gameState.enemiesToSpawn.push(type);
        }
    }

    G.gameState.spawnTimer = 0;
    document.getElementById('next-wave-btn').style.display = 'none';
    if (G.gameState.wave % TOWER_INCREASE_INTERVAL === 0 && !isBossWave) {
        G.gameState.maxTowers += MAX_TOWER_INCREASE;
        showToast('建築上限提升!');
    }
    updateUI();
}

function handleWaveClear() {
    G.gameState.waveInProgress = false;
    document.getElementById('next-wave-btn').style.display = 'block';

    // 基地每撐過一波攻擊，生命值上限增加 1000（上限 50000），修復 1000，攻擊力增加 50（上限 10000）
    G.gameState.maxLives = Math.min(50000, (G.gameState.maxLives || 1000) + 1000);
    G.gameState.lives = Math.min(G.gameState.maxLives, G.gameState.lives + 1000);
    G.gameState.baseAttackDamage = Math.min(10000, (G.gameState.baseAttackDamage || 500) + 50);

    const upgradeMsg = `🏰 基地升級！生命值: ${G.gameState.lives}/${G.gameState.maxLives} | 攻擊力: ${G.gameState.baseAttackDamage}`;

    if (G.gameState.mode === 'campaign' && G.gameState.wave % 10 === 0) {
        const unlocks = UNLOCK_SCHEDULE[G.gameState.wave];
        if (unlocks) {
            const names = [];
            unlocks.forEach(id => {
                const n = unlockTower(id);
                if (n) names.push(n);
            });
            if (names.length > 0) {
                showToast(`🎉 成功抵禦第 ${G.gameState.wave} 波！\n解鎖新科技：【${names.join('】與【')}】\n${upgradeMsg}`);
            }
        }
    } else {
        showToast(`波數完成！\n${upgradeMsg}`);
    }

    G.autoWaveTimer = AUTO_WAVE_DELAY;
    updateUI();
}

function resetAutoWave() {
    if (G.gameState.waveInProgress || G.gameState.isGameOver || !G.gameState.isPlaying) {
        G.autoWaveTimer = 0;
        return;
    }
    G.autoWaveTimer = AUTO_WAVE_DELAY;
}

// --- 遊戲結束 ---
function handleGameOverTransfer() {
    if (G.gameState.mode === 'infinite' && G.gameState.money > 0) {
        G.globalBank += G.gameState.money;
        localStorage.setItem('starDefenseBank', G.globalBank);
        return `已將剩餘資金 $${G.gameState.money} 轉入全域星際幣！`;
    }
    return '';
}

function gameOver() {
    G.gameState.isPlaying = false;
    G.gameState.isGameOver = true;
    const transferMsg = handleGameOverTransfer();
    document.getElementById('overlay-title').innerText = '基地淪陷';
    document.getElementById('overlay-title').style.color = '#ff3333';
    document.getElementById('overlay-desc').innerHTML =
        `最終波數: ${G.gameState.wave}<br>BOSS 擊殺數: ${G.gameState.bossesKilled}<br><br><span style="color:#ffd700">${transferMsg}</span>`;
    document.getElementById('overlay-screen').style.display = 'flex';
}

function gameWin() {
    G.gameState.isPlaying = false;
    G.gameState.isGameOver = true;
    const transferMsg = handleGameOverTransfer();
    document.getElementById('overlay-title').innerText = '戰役勝利！';
    document.getElementById('overlay-title').style.color = '#ffd700';
    document.getElementById('overlay-desc').innerHTML =
        `您已成功守護星區 (通關 100 波)！<br>BOSS 擊殺數: ${G.gameState.bossesKilled}<br><br><span style="color:#ffd700">${transferMsg}</span>`;
    document.getElementById('overlay-screen').style.display = 'flex';
}

// --- 路徑判斷 ---
function isPath(c, r) {
    for (let i = 0; i < G.currentPath.length - 1; i++) {
        const p1 = G.currentPath[i];
        const p2 = G.currentPath[i + 1];
        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);
        if (c >= minX && c <= maxX && r >= minY && r <= maxY) return true;
    }
    return false;
}

// --- 放置驗證（塔佔用 2×2 範圍，檢查塔身所有格） ---
function isValidPlacement(c, r) {
    if (c < 1 || c >= COLS - 1 || r < 1 || r >= ROWS - 1) return false;
    
    // 塔中心必須是平地 (PLAIN)
    if (G.tileData && G.tileData[r] && G.tileData[r][c] !== TILE_TYPES.PLAIN) return false;
    
    for (let dc = -1; dc <= 1; dc++) {
        for (let dr = -1; dr <= 1; dr++) {
            const nc = c + dc, nr = r + dr;
            if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) return false;
            
            // 塔身範圍（3x3）不可疊加在道路、牆壁或基地上，但可以與 FENCE_BUFFER (柵欄緩衝區) 重疊
            if (G.tileData && G.tileData[nr]) {
                const type = G.tileData[nr][nc];
                if (type === TILE_TYPES.ROAD || type === TILE_TYPES.WALL || type === TILE_TYPES.BASE_ZONE) {
                    return false;
                }
            }
            
            // 塔與塔之間不能重疊（中心點距離必須大於 1）
            if (G.towers.find(t => t.c === nc && t.r === nr)) return false;
        }
    }
    return true;
}

// --- 繪製底層地面 ---
function drawGround() {
    const ctx = G.ctx;
    if (!ctx) return;
    const img = GroundGraphics.cache;
    if (img && img.complete) {
        ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
    } else {
        ctx.fillStyle = '#1a3a1a';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
}

// --- 繪製地形覆蓋層（ROAD 疊加上色，FENCE_BUFFER 貼圖）---
function drawTiles() {
    const ctx = G.ctx;
    if (!ctx || !G.tileData) return;
    const fenceImg = FenceGraphics.cache;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const type = G.tileData[r]?.[c] ?? 0;
            if (type === TILE_TYPES.PLAIN || type === TILE_TYPES.BASE_ZONE) continue;
            if (type === TILE_TYPES.FENCE_BUFFER && fenceImg && fenceImg.complete) {
                ctx.drawImage(fenceImg, c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = TILE_COLORS[type] || TILE_COLORS[0];
                ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

// --- 繪製格線 ---
function drawGrid() {
    const ctx = G.ctx;
    if (!ctx) return;
    ctx.strokeStyle = G.gameState.mapLevel === 2 ? '#4a1525' : '#1f2833';
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * TILE_SIZE, 0);
        ctx.lineTo(c * TILE_SIZE, ROWS * TILE_SIZE);
        ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * TILE_SIZE);
        ctx.lineTo(COLS * TILE_SIZE, r * TILE_SIZE);
        ctx.stroke();
    }
}

// --- 繪製路徑 ---
function drawPath() {
    const ctx = G.ctx;
    if (!ctx || !G.currentPath || G.currentPath.length === 0) return;
    const end = G.currentPath[G.currentPath.length - 1];
    const BASE_SIZE = 96;
    const bx = end ? end.x * TILE_SIZE + TILE_SIZE / 2 : 0;
    const by = end ? end.y * TILE_SIZE + TILE_SIZE / 2 : 0;

    ctx.strokeStyle = G.gameState.mapLevel === 2 ? '#591522' : '#2b3a4a';
    ctx.lineWidth = TILE_SIZE * 0.8;
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const len = G.currentPath.length;
    G.currentPath.forEach((p, i) => {
        if (!p) return;
        if (i === len - 1) return;
        const x = p.x * TILE_SIZE + TILE_SIZE / 2;
        const y = p.y * TILE_SIZE + TILE_SIZE / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    const secondLast = G.currentPath[len - 2];
    if (secondLast) {
        const lastX = secondLast.x * TILE_SIZE + TILE_SIZE / 2;
        const lastY = secondLast.y * TILE_SIZE + TILE_SIZE / 2;
        const dx = bx - lastX;
        const dy = by - lastY;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 0) {
            const inset = BASE_SIZE / 2;
            const t = Math.min(inset / d, 0.99);
            ctx.lineTo(bx - dx * t, by - dy * t);
        }
    }
    ctx.stroke();

    // 繪製基地圖像（最後才繪製，確保透明背景正確）
    if (end) {
        const baseImg = BaseGraphics.cache;
        if (baseImg && baseImg.complete) {
            ctx.drawImage(baseImg, bx - BASE_SIZE / 2, by - BASE_SIZE / 2, BASE_SIZE, BASE_SIZE);
        } else {
            ctx.fillStyle = '#2a1a1a';
            ctx.fillRect(bx - BASE_SIZE / 2, by - BASE_SIZE / 2, BASE_SIZE, BASE_SIZE);
            ctx.strokeStyle = '#ff4400';
            ctx.lineWidth = 3;
            ctx.strokeRect(bx - BASE_SIZE / 2, by - BASE_SIZE / 2, BASE_SIZE, BASE_SIZE);
        }
    }
}

// --- 主遊戲迴圈 ---
function gameLoop() {
    if (!G.gameState.isPlaying) return;
    const ctx = G.ctx;
    const canvas = G.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGround();
    drawTiles();
    drawGrid();
    drawPath();

    // ===== 暫停狀態 =====
    if (G.gameState.isPaused) {
        G.enemies.forEach(e => e.draw());
        G.towers.forEach(t => t.draw());
        G.projectiles.forEach(p => p.draw());
        G.particles.forEach(p => p.draw());
        G.effects.forEach(e => e.draw());
        G.floatingTexts.forEach(t => t.draw());

        ctx.fillStyle = 'rgba(11, 12, 16, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#66fcf1';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('暫停中', canvas.width / 2, canvas.height / 2);

        // 暫停時仍可預覽建造位置
        if (G.gameState.buildModeType) {
            const c = Math.floor(G.mouseX / TILE_SIZE);
            const r = Math.floor(G.mouseY / TILE_SIZE);
            const x = c * TILE_SIZE + TILE_SIZE / 2;
            const y = r * TILE_SIZE + TILE_SIZE / 2;
            const range = TOWER_TYPES[G.gameState.buildModeType].range;
            ctx.beginPath();
            ctx.arc(x, y, range, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(102,252,241,0.2)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(102,252,241,0.5)';
            ctx.stroke();
            ctx.fillStyle = isValidPlacement(c, r) ? 'rgba(102,252,241,0.5)' : 'rgba(255,51,51,0.5)';
            ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
        requestAnimationFrame(gameLoop);
        return;
    }

    // ===== 塔防增益重算 =====
    G.towers.forEach(t => t.buffs = { range: 1, speed: 1 });
    G.towers.forEach(t => {
        if (t.special === 'radar') {
            G.towers.forEach(n => {
                if (Math.abs(t.c - n.c) <= RADAR_BUFF_RANGE && Math.abs(t.r - n.r) <= RADAR_BUFF_RANGE && t !== n) {
                    n.buffs.range = RADAR_BUFF_MULTIPLIER;
                    n.buffs.speed = RADAR_BUFF_MULTIPLIER;
                }
            });
        }
    });

    // ===== 生成敵人 =====
    if (G.gameState.waveInProgress) {
        if (G.gameState.enemiesToSpawn.length > 0) {
            G.gameState.spawnTimer++;
            if (G.gameState.spawnTimer > SPAWN_INTERVAL_FRAMES) {
                const type = G.gameState.enemiesToSpawn.shift();
                G.enemies.push(new Enemy(G.gameState.wave, type));
                G.gameState.spawnTimer = 0;
            }
        } else if (G.enemies.length === 0) {
            handleWaveClear();
        }
    }

    // ===== 自動下一波倒數 =====
    if (G.autoWaveTimer > 0 && !G.gameState.waveInProgress && !G.gameState.isGameOver) {
        G.autoWaveTimer--;
        const seconds = Math.ceil(G.autoWaveTimer / 60);
        if (seconds > 0) {
            ctx.fillStyle = 'rgba(11,12,16,0.7)';
            const tx = canvas.width - 180;
            const ty = canvas.height - 50;
            const tw = 170;
            const th = 40;
            ctx.fillRect(tx, ty, tw, th);
            ctx.strokeStyle = '#66fcf1';
            ctx.lineWidth = 1;
            ctx.strokeRect(tx, ty, tw, th);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`⏳ ${seconds}s`, tx + tw / 2, ty + th / 2);
        }
        if (G.autoWaveTimer <= 0 && !G.gameState.waveInProgress) {
            startNextWave();
        }
    }

    // ===== 重設 stuck 狀態 =====
    G.enemies.forEach(e => e.stuck = false);

    // ===== 基地全方位攻擊（紅色火光 + 可見子彈） =====
    const end = G.currentPath[G.currentPath.length - 1];
    if (end) {
        const bx = end.x * TILE_SIZE + TILE_SIZE / 2;
        const by = end.y * TILE_SIZE + TILE_SIZE / 2;
        if (!G.baseAttackTimer || G.baseAttackTimer <= 0) {
            G.baseAttackTimer = BASE_ATTACK_COOLDOWN;
            G.enemies.forEach(e => {
                const dist = Math.sqrt((e.x - bx) ** 2 + (e.y - by) ** 2);
                if (dist <= BASE_ATTACK_RANGE) {
                    G.projectiles.push(new Projectile(bx, by, e, G.gameState.baseAttackDamage || 500, '#ff4400', 'basic'));
                }
            });
            createExplosion(bx, by, 15, '#ff4400');
        } else {
            G.baseAttackTimer--;
            const prog = 1 - G.baseAttackTimer / BASE_ATTACK_COOLDOWN;
            const glowR = 10 + prog * 60;
            ctx.fillStyle = `rgba(255, 68, 0, ${0.06 + prog * 0.04})`;
            ctx.beginPath();
            ctx.arc(bx, by, glowR, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ===== 更新/繪製特效 =====
    for (let i = G.effects.length - 1; i >= 0; i--) {
        G.effects[i].update();
        G.effects[i].draw();
        if (G.effects[i].life <= 0) G.effects.splice(i, 1);
    }

    // ===== 更新/繪製敵人 =====
    for (let i = G.enemies.length - 1; i >= 0; i--) {
        if (G.enemies[i].move()) {
            // 到達基地
            let damage = NORMAL_BASE_DAMAGE;
            if (G.enemies[i].isBoss) {
                damage = BOSS_BASE_DAMAGE;
                showToast('⚠️ 基地受到 BOSS 重創! (-5)');
            } else if (G.enemies[i].typeKey === 'tank') {
                damage = TANK_BASE_DAMAGE;
            }
            G.gameState.lives -= damage;
            soundManager.damage();
            G.floatingTexts.push(new FloatingText(G.enemies[i].x, G.enemies[i].y, `-${damage}💔`, '#ff3333'));
            G.enemies.splice(i, 1);
            updateUI();
            if (G.gameState.lives <= 0) {
                gameOver();
                return;
            }
        } else if (G.enemies[i].hp <= 0) {
            G.enemies.splice(i, 1);
            updateUI();
        } else {
            G.enemies[i].draw();
        }
    }

    // ===== 更新/繪製塔防 =====
    G.towers.forEach(t => {
        t.update();
        t.draw();
    });

    // ===== 建造預覽 =====
    if (G.gameState.buildModeType && !G.gameState.isGameOver) {
        const c = Math.floor(G.mouseX / TILE_SIZE);
        const r = Math.floor(G.mouseY / TILE_SIZE);
        const x = c * TILE_SIZE + TILE_SIZE / 2;
        const y = r * TILE_SIZE + TILE_SIZE / 2;
        const range = TOWER_TYPES[G.gameState.buildModeType].range;
        ctx.beginPath();
        ctx.arc(x, y, range, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(102,252,241,0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(102,252,241,0.3)';
        ctx.stroke();
        ctx.fillStyle = isValidPlacement(c, r) ? 'rgba(102,252,241,0.5)' : 'rgba(255,51,51,0.5)';
        ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }

    // ===== 更新/繪製投射物 =====
    for (let i = G.projectiles.length - 1; i >= 0; i--) {
        G.projectiles[i].update();
        G.projectiles[i].draw();
        if (G.projectiles[i].hit) G.projectiles.splice(i, 1);
    }

    // ===== 更新/繪製粒子 =====
    for (let i = G.particles.length - 1; i >= 0; i--) {
        G.particles[i].update();
        G.particles[i].draw();
        if (G.particles[i].life <= 0) G.particles.splice(i, 1);
    }

    // ===== 更新/繪製浮動文字 =====
    for (let i = G.floatingTexts.length - 1; i >= 0; i--) {
        G.floatingTexts[i].update();
        G.floatingTexts[i].draw();
        if (G.floatingTexts[i].life <= 0) G.floatingTexts.splice(i, 1);
    }

    requestAnimationFrame(gameLoop);
}
