// ============================================================
// constants.js — 遊戲常數、配置定義、全域狀態容器
// ============================================================

// --- 基礎常數 ---
const TILE_SIZE = 32;
const DRAW_SCALE = 1.0;
const CANVAS_W = 1024;
const CANVAS_H = 576;
const COLS = 32;   // CANVAS_W / TILE_SIZE
const ROWS = 18;   // CANVAS_H / TILE_SIZE

// --- 提取的魔術數字常數 ---
const SPAWN_INTERVAL_FRAMES = 30;
const HEALER_COOLDOWN_FRAMES = 120;
const HEALER_HEAL_RANGE = 100;
const HEALER_HEAL_PERCENT = 0.15;
const CARRIER_SPAWN_INTERVAL = 90;
const TELEPORTER_INTERVAL = 240;
const TELEPORTER_JUMP_DIST = 100;
const STEALTH_PHASE_SPEED = 0.05;
const BURN_TICK_INTERVAL = 10;
const POISON_TICK_INTERVAL = 20;
const POISON_SPEED_MULT = 0.8;
const SLOW_SPEED_MULT = 0.5;
const STUN_DURATION = 60;
const CHRONO_SLOW_DURATION = 180;
const BURN_DURATION = 120;
const POISON_DURATION = 200;
const BOSS_ROTATION_BASE = 0.05;
const BOSS_DEFAULT_ROTATION = 0.03;
const RADAR_ROTATION_SPEED = 0.05;
const RADAR_BUFF_RANGE = 1;
const RADAR_BUFF_MULTIPLIER = 1.25;
const GRAVITY_FIELD_DURATION = 180;
const GRAVITY_FIELD_RADIUS = 120;
const GRAVITY_PULL_STRENGTH = 0.05;
const GRAVITY_DAMAGE_INTERVAL = 30;
const ORBITAL_DURATION = 60;
const ORBITAL_RADIUS = 80;
const ORBITAL_TICK_INTERVAL = 10;
const BOSS_BASE_DAMAGE = 500;
const TANK_BASE_DAMAGE = 100;
const NORMAL_BASE_DAMAGE = 50;
const BASE_ATTACK_DAMAGE = 100;
const BASE_ATTACK_RANGE = 250;
const BASE_ATTACK_COOLDOWN = 60;
const AUTO_WAVE_DELAY = 600;
const MAX_TOWER_INCREASE = 2;
const TOWER_INCREASE_INTERVAL = 5;
const SELL_REFUND_RATE = 0.7;
const INITIAL_MONEY = 450;
const INITIAL_LIVES = 1000;
const INITIAL_MAX_TOWERS = 20;
const BASE_ENEMY_HP = 40;
const BASE_ENEMY_SPEED = 1.5;
const SPEED_SCALE_PER_WAVE = 0.05;
const MAX_SPEED_BONUS = 2.0;
const BOSS_REWARD_MULTIPLIER = 5;
const DRONE_REWARD_MULTIPLIER = 0.2;
const MAP_SWITCH_BOSS_KILL_INFINITE = 50;
const MAP_SWITCH_WAVE_CAMPAIGN = 50;
const CAMPAIGN_MAX_WAVES = 100;
const SCALING_INTERVAL = 10;
const TOAST_DURATION = 3000;
const GREED_BONUS_GOLD = 2;
const ECO_BASE_INCOME = 5;
const ECO_INCOME_PER_LEVEL = 5;
const ECO_COOLDOWN_REDUCTION = 10;
const ECO_MIN_COOLDOWN = 60;
const BOSS_BERSERKER_SPEED_THRESHOLD = 0.5;
const MULTISHOT_SPREAD = 0.2;
const CHRONO_AOE_RANGE = 1000;

// --- 基礎塔列表 ---
const BASE_TOWERS = ['basic', 'rapid', 'sniper'];

// 塔 3×3 佔位檢查讓最小可放置距離增加 1 格 (32px)，統一補償射程
const RANGE_COMPENSATION = 32;

// --- 塔防配置（可變，運行時修改 locked 屬性） ---
const TOWER_TYPES = {
    basic:     { name: '標準', cost: 50,   range: (130 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 20,   cooldown: 45,  color: '#4cc9f0', type: 'single',       locked: false },
    rapid:     { name: '速射', cost: 120,  range: (100 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 8,    cooldown: 12,  color: '#f72585', type: 'single',       locked: false },
    sniper:    { name: '狙擊', cost: 280,  range: (350 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 90,   cooldown: 110, color: '#7209b7', type: 'single',       locked: false },

    // 戰役模式解鎖塔
    ice:       { name: '冰霜', cost: 150,  range: (120 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 10,   cooldown: 40,  color: '#00ffff', type: 'slow',         locked: true, slowDuration: 120 },
    cannon:    { name: '加農', cost: 250,  range: (160 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 50,   cooldown: 90,  color: '#888888', type: 'cannon',       locked: true },
    poison:    { name: '毒液', cost: 200,  range: (110 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 5,    cooldown: 30,  color: '#00ff00', type: 'poison',       locked: true },
    tesla:     { name: '電磁', cost: 350,  range: (140 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 25,   cooldown: 50,  color: '#fee440', type: 'aoe',          locked: true },
    flame:     { name: '火焰', cost: 380,  range: (100 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 3,    cooldown: 5,   color: '#ff4400', type: 'flame',        locked: true },
    gatling:   { name: '機槍', cost: 450,  range: (150 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 8,    cooldown: 15,  color: '#607d8b', type: 'gatling',      locked: true },
    multishot: { name: '多重', cost: 480,  range: (140 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 25,   cooldown: 40,  color: '#00bcd4', type: 'multishot',    locked: true },
    bank:      { name: '銀行', cost: 500,  range: 0,                damage: 0,    cooldown: 120, color: '#ffd700', type: 'eco',          locked: true },
    radar:     { name: '雷達', cost: 600,  range: 0,                damage: 0,    cooldown: 0,   color: '#76ff03', type: 'radar',        locked: true },
    plasma:    { name: '電漿', cost: 750,  range: (180 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 200,  cooldown: 60,  color: '#d000ff', type: 'single',       locked: true },
    laser:     { name: '雷射', cost: 800,  range: (250 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 40,   cooldown: 8,   color: '#ff0055', type: 'pierce',       locked: true },
    artillery: { name: '重砲', cost: 1000, range: (300 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 300,  cooldown: 160, color: '#555555', type: 'artillery',    locked: true },
    emp:       { name: '脈衝', cost: 1100, range: (160 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 10,   cooldown: 90,  color: '#00e5ff', type: 'stun',         locked: true },
    blackhole: { name: '黑洞', cost: 1400, range: (200 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 5,    cooldown: 180, color: '#222222', type: 'blackhole',    locked: true },
    dronepad:  { name: '航母', cost: 1500, range: (350 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 60,   cooldown: 70,  color: '#ffeb3b', type: 'drone',        locked: true },
    prism:     { name: '光稜', cost: 1800, range: (220 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 15,   cooldown: 4,   color: '#00ff9d', type: 'laser',        locked: true },
    railgun:   { name: '磁軌', cost: 2000, range: (500 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 800,  cooldown: 200, color: '#2962ff', type: 'pierce_heavy', locked: true },
    nuke:      { name: '核彈', cost: 3000, range: (250 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 1000, cooldown: 250, color: '#ff9900', type: 'nuke',         locked: true },
    orbital:   { name: '天基', cost: 4000, range: (2000 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 150, cooldown: 150, color: '#ffffff', type: 'orbital',      locked: true },

    // 商店特權塔（永久解鎖）
    vampire:   { name: '吸血', cost: 600,  range: (150 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 40,   cooldown: 40,  color: '#d81b60', type: 'vampire',      locked: true, isPremium: true, price: 1000, desc: '擊殺敵人可回復基地生命值' },
    greed:     { name: '貪婪', cost: 450,  range: (130 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 15,   cooldown: 30,  color: '#fbc02d', type: 'greed',        locked: true, isPremium: true, price: 1500, desc: '每次攻擊命中都能額外獲得資金' },
    chrono:    { name: '時空', cost: 1200, range: (600 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 5,    cooldown: 80,  color: '#1de9b6', type: 'chrono',       locked: true, isPremium: true, price: 3000, desc: '超大範圍攻擊，並附加強力緩速' },
    doom:      { name: '末日', cost: 5000, range: (300 + RANGE_COMPENSATION) * DRAW_SCALE, damage: 5000, cooldown: 300, color: '#b71c1c', type: 'doom',         locked: true, isPremium: true, price: 8000, desc: '毀滅性極高單體傷害，連鎖爆發' }
};

// --- 敵人配置（不可變） ---
const ENEMY_TYPES = Object.freeze({
    normal:          { hpMod: 1.0,  speedMod: 1.0, color: '#e94560', radius: 12 * DRAW_SCALE, group: 'minion' },
    scout:           { hpMod: 0.5,  speedMod: 1.8, color: '#b8f2e6', radius: 9 * DRAW_SCALE,  group: 'minion' },
    tank:            { hpMod: 2.5,  speedMod: 0.6, color: '#8d99ae', radius: 16 * DRAW_SCALE, group: 'minion' },
    healer:          { hpMod: 1.2,  speedMod: 0.8, color: '#00ff00', radius: 14 * DRAW_SCALE, group: 'minion' },
    stealth:         { hpMod: 0.8,  speedMod: 1.2, color: '#9fa8da', radius: 11 * DRAW_SCALE, group: 'minion' },
    drone:           { hpMod: 0.3,  speedMod: 2.2, color: '#e040fb', radius: 6 * DRAW_SCALE,  group: 'minion' },
    boss_berserker:  { hpMod: 7.0,  speedMod: 0.6, color: '#ff3d00', radius: 22 * DRAW_SCALE, group: 'boss' },
    boss_carrier:    { hpMod: 9.0,  speedMod: 0.4, color: '#9c27b0', radius: 26 * DRAW_SCALE, group: 'boss' },
    boss_armored:    { hpMod: 12.0, speedMod: 0.4, color: '#607d8b', radius: 24 * DRAW_SCALE, group: 'boss' },
    boss_teleporter: { hpMod: 6.0,  speedMod: 0.5, color: '#2962ff', radius: 20 * DRAW_SCALE, group: 'boss' }
});

// --- 路徑定義（不可變） ---
let PATH_POINTS_1 = [
    { x: 0, y: 3 },  { x: 10, y: 3 }, { x: 10, y: 14 }, { x: 22, y: 14 },
    { x: 22, y: 3 }, { x: 30, y: 3 }
];

let PATH_POINTS_2 = [
    { x: 31, y: 14 }, { x: 10, y: 14 }, { x: 10, y: 4 }, { x: 24, y: 4 },
    { x: 24, y: 14 }, { x: 16, y: 14 }, { x: 16, y: 9 }, { x: 5, y: 9 }
];

// --- 地圖載入 ---
function loadMapFromJSON(jsonData) {
    try {
        const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

        if (!data.path || !Array.isArray(data.path) || data.path.length < 2) {
            showToast('地圖格式錯誤：path 至少需要 2 個點');
            return false;
        }

        for (let p of data.path) {
            if (typeof p.x !== 'number' || typeof p.y !== 'number' ||
                p.x < 0 || p.x >= COLS || p.y < 0 || p.y >= ROWS) {
                showToast('地圖格式錯誤：路徑點超出範圍 (0-' + (COLS-1) + ', 0-' + (ROWS-1) + ')');
                return false;
            }
        }

        for (let i = 0; i < data.path.length - 1; i++) {
            const p1 = data.path[i];
            const p2 = data.path[i + 1];
            if (p1.x !== p2.x && p1.y !== p2.y) {
                showToast('地圖格式錯誤：路徑必須是水平或垂直線段');
                return false;
            }
        }

        G.currentPath = data.path;
        G.tileData = data.tileData && data.tileData.length > 0 ? data.tileData : generateTileDataFromPath(data.path);
        G.towers = [];
        G.enemies = [];
        G.projectiles = [];
        G.particles = [];
        G.effects = [];
        G.floatingTexts = [];
        G.gameState.enemiesToSpawn = [];
        G.gameState.waveInProgress = false;
        document.getElementById('next-wave-btn').style.display = 'block';
        G.gameState.selectedTower = null;
        updateUI();

        const mapName = data.name || '自訂地圖';
        showToast(`地圖【${mapName}】已載入！`);
        return true;
    } catch (e) {
        showToast('JSON 解析失敗：' + e.message);
        return false;
    }
}

// --- Tile 類型常數 ---
const TILE_TYPES = {
    PLAIN: 0,
    ROAD: 1,
    WALL: 2,
    BASE_ZONE: 3,
    FENCE_BUFFER: 4,
};

const TILE_COLORS = {
    0: '#1a3a1a',
    1: '#3a3a2a',
    2: '#2a1a1a',
    3: '#1a1a2a',
    4: '#1a3a1a',
};

function generateTileDataFromPath(path) {
    if (!path || path.length === 0) return null;
    const grid = Array.from({ length: ROWS }, () => new Array(COLS).fill(TILE_TYPES.PLAIN));

    // Step 1: 標記路徑 ROAD
    for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i], p2 = path[i + 1];
        if (p1.x === p2.x) {
            const minY = Math.min(p1.y, p2.y), maxY = Math.max(p1.y, p2.y);
            for (let y = minY; y <= maxY; y++) grid[y][p1.x] = TILE_TYPES.ROAD;
        } else {
            const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
            for (let x = minX; x <= maxX; x++) grid[p1.y][x] = TILE_TYPES.ROAD;
        }
    }

    // Step 2: 道路兩側柵欄緩衝區
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (grid[r][c] !== TILE_TYPES.ROAD) continue;
            const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            for (let [dr, dc] of dirs) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] === TILE_TYPES.PLAIN) {
                    grid[nr][nc] = TILE_TYPES.FENCE_BUFFER;
                }
            }
        }
    }

    // Step 3: 基地終點周圍 3×3 標記 BASE_ZONE
    const end = path[path.length - 1];
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nx = end.x + dx, ny = end.y + dy;
            if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
                grid[ny][nx] = TILE_TYPES.BASE_ZONE;
            }
        }
    }

    return grid;
}

// --- 戰役模式解鎖排程 ---
const UNLOCK_SCHEDULE = Object.freeze({
    10:  ['ice', 'cannon'],
    20:  ['poison', 'flame'],
    30:  ['tesla', 'gatling'],
    40:  ['multishot', 'bank'],
    50:  ['radar', 'plasma'],
    60:  ['laser', 'artillery'],
    70:  ['emp', 'blackhole'],
    80:  ['dronepad', 'prism'],
    90:  ['railgun', 'nuke'],
    100: ['orbital']
});

// ============================================================
// 全域共享狀態容器 (window.G)
// 所有可變的遊戲運行時資料統一管理於此
// ============================================================
var G = window.G = {
    // Canvas 引用（在 main.js 中設定）
    canvas: null,
    ctx: null,

    // 載入的自訂地圖資料
    loadedMapData: null,
    loadedMapName: null,
    currentMapIsCustom: false,
    tileData: null,

    // 遊戲物件陣列
    towers: [],
    enemies: [],
    projectiles: [],
    particles: [],
    effects: [],
    floatingTexts: [],

    // 滑鼠位置
    mouseX: 0,
    mouseY: 0,

    // 商店狀態
    shopOpenFromGame: false,

    // 當前路徑
    currentPath: PATH_POINTS_1,

    // 持久化資料（從 localStorage 載入）
    globalBank: 0,
    unlockedPremium: [],

    // Toast 計時器
    toastTimer: null,

    // 基地攻擊計時器
    baseAttackTimer: 0,

    // 自動下一波倒數
    autoWaveTimer: 0,

    // 遊戲核心狀態
    gameState: {
        mode: 'infinite',
        money: INITIAL_MONEY,
        lives: INITIAL_LIVES,
        maxLives: INITIAL_LIVES,
        baseAttackDamage: 500,
        wave: 0,
        bossesKilled: 0,
        isPlaying: false,
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
    }
};
