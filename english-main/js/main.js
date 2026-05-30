// ============================================================
// main.js — 進入點：初始化、事件綁定、啟動
// ============================================================

(function () {
    'use strict';

    // --- Canvas 初始化 ---
    G.canvas = document.getElementById('gameCanvas');
    G.ctx = G.canvas ? G.canvas.getContext('2d') : null;

    if (!G.canvas || !G.ctx) {
        console.error('Canvas initialization failed');
        return;
    }

    // --- 載入持久化資料 ---
    G.globalBank = parseInt(localStorage.getItem('starDefenseBank'), 10) || 0;
    G.unlockedPremium = JSON.parse(localStorage.getItem('starDefensePremium')) || [];

    const bankDisplay = document.getElementById('home-bank-display');
    if (bankDisplay) bankDisplay.innerText = G.globalBank;
    else console.warn('home-bank-display element not found');

    // --- 初始化圖形快取 ---
    TowerGraphics.init();
    EnemyGraphics.init();
    BaseGraphics.init();
    FenceGraphics.init();
    GroundGraphics.init();

    // --- 初始化 UI ---
    initTowerButtons();

    // --- 滑鼠座標轉換 ---
    function getMousePos(evt) {
        const rect = G.canvas.getBoundingClientRect();
        const scaleX = G.canvas.width / rect.width;
        const scaleY = G.canvas.height / rect.height;
        return {
            x: (evt.clientX - rect.left) * scaleX,
            y: (evt.clientY - rect.top) * scaleY
        };
    }

    // --- Canvas 點擊事件 ---
    G.canvas.addEventListener('mousedown', (e) => {
        if (!G.gameState.isPlaying || G.gameState.isGameOver) return;
        const pos = getMousePos(e);
        const c = Math.floor(pos.x / TILE_SIZE);
        const r = Math.floor(pos.y / TILE_SIZE);
        const clickedTower = G.towers.find(t => t.c === c && t.r === r);

        // 任何玩家點擊重置倒數
        resetAutoWave();

        // 建造模式
        if (G.gameState.buildModeType) {
            if (!isValidPlacement(c, r)) {
                // 不顯示提示，僅不建造
            } else if (G.gameState.money < TOWER_TYPES[G.gameState.buildModeType].cost) {
                showToast('資金不足!');
                soundManager.damage();
            } else if (G.towers.length >= G.gameState.maxTowers) {
                showToast('已達建築上限! 請合成塔');
                soundManager.damage();
            } else {
                soundManager.build();
                G.gameState.money -= TOWER_TYPES[G.gameState.buildModeType].cost;
                G.towers.push(new Tower(c, r, G.gameState.buildModeType));
                createExplosion(c * TILE_SIZE + TILE_SIZE / 2, r * TILE_SIZE + TILE_SIZE / 2, 10, '#fff');
                if (G.gameState.money < TOWER_TYPES[G.gameState.buildModeType].cost) {
                    G.gameState.buildModeType = null;
                }
                updateUI();
            }
            return;
        }

        // 選取/合成模式
        if (clickedTower) {
            if (G.gameState.selectedTower === clickedTower) {
                G.gameState.selectedTower = null;
            } else if (G.gameState.selectedTower) {
                const t1 = G.gameState.selectedTower;
                const t2 = clickedTower;
                if (t1.type === t2.type && t1.level === t2.level) {
                    if (t2.upgrade()) {
                        G.towers = G.towers.filter(t => t !== t1);
                        G.gameState.selectedTower = null;
                        updateUI();
                    } else {
                        showToast('已達最高等級!');
                        soundManager.damage();
                    }
                } else {
                    G.gameState.selectedTower = t2;
                    showToast('無法合成 (需同類同級)');
                    soundManager.damage();
                }
            } else {
                G.gameState.selectedTower = clickedTower;
            }
        } else {
            G.gameState.selectedTower = null;
        }
        updateUI();
    });

    // --- 滑鼠移動事件 ---
    G.canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);
        G.mouseX = pos.x;
        G.mouseY = pos.y;
    });

    // --- 鍵盤快捷鍵 ---
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') startNextWave();
        if (e.code === 'Escape') {
            G.gameState.buildModeType = null;
            G.gameState.selectedTower = null;
            updateUI();
        }
        if (e.code === 'Delete' || e.code === 'Backspace') sellSelectedTower();
        if (e.code === 'KeyP') togglePause();
        if (e.code === 'KeyM') autoMerge();
        if (e.code === 'KeyB') toggleShop();
        if (e.code === 'KeyF') toggleFullScreen();
    });

    // --- 初始繪製 ---
    drawGround();
    drawTiles();
    drawGrid();
    drawPath();

    // --- 載入地圖按鈕（首頁） ---
    document.getElementById('map-file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (!data.path || !Array.isArray(data.path) || data.path.length < 2) {
                    showToast('地圖格式錯誤');
                    return;
                }
                G.loadedMapData = data;
                G.loadedMapName = data.name || file.name.replace('.json', '');
                document.getElementById('loaded-map-name').innerText = G.loadedMapName;
                document.getElementById('loaded-map-name').style.color = '#ffd700';
                showToast(`已載入地圖: ${G.loadedMapName}`);
            } catch (err) {
                showToast('JSON 解析失敗');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    // --- 載入地圖按鈕（遊戲中） ---
    document.getElementById('ingame-map-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (loadMapFromJSON(data)) {
                    G.loadedMapData = data;
                    G.loadedMapName = data.name || file.name.replace('.json', '');
                }
            } catch (err) {
                showToast('JSON 解析失敗');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

})();
