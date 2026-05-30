# TES 地圖重新設計規劃書

## 現狀 vs 目標

| 項目 | 現值 | 目標值 |
|------|------|--------|
| 遊戲區域 (canvas) | 1536 × 864 | **1024 × 576** |
| TILE_SIZE | 32 | **32** (不變) |
| COLS / ROWS | 48 × 27 | **32 × 18** |
| 塔顯示尺寸 | 28×28 | **64×64** |
| 基地 (終點) | 12px 圓形 | **96×96** |
| 道路貼圖 | 無（純色線） | **32×32 tile** |
| 玩家視野總面積 | 1536×864 全吃滿 | 1024×576 (遊戲) + 剩餘給 UI |

---

## 階段 A：核心尺寸常數

修改 4 個檔案：

### A1. `js/constants.js`

新增常數（建議放在檔案頂部，TILE_SIZE 之後）：

```js
const CANVAS_W = 1024;
const CANVAS_H = 576;
const COLS = 32;   // CANVAS_W / TILE_SIZE
const ROWS = 18;   // CANVAS_H / TILE_SIZE
```

修改第 142 行路徑驗證：
```js
// 原本
if (p.x < 0 || p.x >= 48 || p.y < 0 || p.y >= 27)

// 改為
if (p.x < 0 || p.x >= COLS || p.y < 0 || p.y >= ROWS)
```

### A2. `index.html` 第 12 行

```html
<!-- 原本 -->
<canvas id="gameCanvas" width="1536" height="864"></canvas>

<!-- 改為 -->
<canvas id="gameCanvas" width="1024" height="576"></canvas>
```

### A3. `map-editor.html` 第 83 行

```js
// 原本
const COLS = 48, ROWS = 27, TILE = 32;

// 改為
const COLS = 32, ROWS = 18, TILE = 32;
```

### A4. `maps/defaultlv1.json` 與 `maps/defaultlv2.json`

```json
// 原本
"tileWidth": 48, "tileHeight": 27,

// 改為
"tileWidth": 32, "tileHeight": 18,
```

---

## 階段 B：塔顯示尺寸 (28 → 64)

### B1. `js/entities.js` 第 471 行 — 塔本體大小

```js
// 原本
const displaySize = 28;

// 改為
const displaySize = 64;
```

### B2. `js/entities.js` 第 433 行 — 選取圈半徑

```js
// 原本
ctx.arc(0, 0, 16, 0, Math.PI * 2);  // 固定半徑 16

// 改為 (與顯示尺寸連動)
ctx.arc(0, 0, displaySize / 2, 0, Math.PI * 2);
```

### B3. `js/entities.js` 第 456 行 — 等級光框

```js
// 原本
ctx.strokeRect(-14, -14, 28, 28);

// 改為 (與顯示尺寸連動)
const hs = displaySize / 2;
ctx.strokeRect(-hs, -hs, displaySize, displaySize);
```

### B4. `js/entities.js` 第 491 行 — 星星標籤 Y 偏移

```js
// 原本
ctx.fillText(starStr, this.x, this.y - 20);

// 改為
ctx.fillText(starStr, this.x, this.y - (displaySize / 2 + 4));
```

---

## 階段 C：基地繪製 (12px 圓 → 96×96)

### C1. 新增基地圖示

在 `js/graphics.js` 中新增一個 SVG 生成器函數，用於繪製基地（一個堅固的六角形或圓形基地站）。

```js
function generateBaseSVG() {
    const size = 100;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        <defs>
            <radialGradient id="baseGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#45a29e" stop-opacity="0.8"/>
                <stop offset="100%" stop-color="#1f2833" stop-opacity="1"/>
            </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#baseGrad)" stroke="#66fcf1" stroke-width="4"/>
        <text x="50" y="55" text-anchor="middle" fill="#fff" font-size="28" font-weight="bold">基地</text>
    </svg>`;
}
```

### C2. 修改終點繪製

`js/game.js` 中 `drawPath()` 函數的終點繪製部分（約第 425 行）：

```js
// 原本（簡化）
ctx.arc(px, py, 12, 0, Math.PI * 2);
ctx.fillStyle = '#e94560';
ctx.fill();

// 改為
const BASE_SIZE = 96;
const baseImg = getBaseImage();  // 緩存的基地圖片
ctx.drawImage(baseImg, px - BASE_SIZE / 2, py - BASE_SIZE / 2, BASE_SIZE, BASE_SIZE);
```

---

## 階段 D：地形 Tile 渲染（新增功能）

### D1. 定義 Tile 類型 (`js/constants.js`)

```js
const TILE_TYPES = {
    PLAIN: 0,    // 平原 / 草地
    ROAD: 1,     // 道路
    WALL: 2,     // 障礙物（不可放置塔）
};

const TILE_COLORS = {
    0: '#1a2a1a',  // 平原 - 深綠色
    1: '#3a3a2a',  // 道路 - 土色
    2: '#2a1a1a',  // 障礙 - 深紅色
};
```

同時新增 tile SVG 生成器函數 `generateTileSVG(type)` 在 `js/graphics.js` 或 `js/constants.js` 中。

### D2. 載入 tileData

修改 `js/constants.js` 中的 `loadMapFromJSON`：

```js
// 新增：讀取 tileData，若無則自動生成
G.tileData = data.tileData;
if (!G.tileData || G.tileData.length === 0) {
    // 自動從 path 生成 tileData
    G.tileData = generateTileDataFromPath(G.currentPath);
}

function generateTileDataFromPath(path) {
    const grid = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
    for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i], p2 = path[i + 1];
        // 標記路徑經過的格子為道路
        if (p1.x === p2.x) {
            const minY = Math.min(p1.y, p2.y), maxY = Math.max(p1.y, p2.y);
            for (let y = minY; y <= maxY; y++) grid[y][p1.x] = 1;
        } else {
            const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
            for (let x = minX; x <= maxX; x++) grid[p1.y][x] = 1;
        }
    }
    return grid;
}
```

### D3. 繪製 Tile (`js/game.js`)

新增 `drawTiles()` 函數：

```js
function drawTiles() {
    if (!G.tileData) return;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const type = G.tileData[r]?.[c] ?? 0;
            const color = TILE_COLORS[type] || TILE_COLORS[0];
            ctx.fillStyle = color;
            ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
}
```

後續可升級為使用 SVG/Image 貼圖，但初期用顏色填充最快。

### D4. 修改渲染順序

在 `js/game.js` 的 `drawGame()`（或類似的主要繪製函數）中，調整繪製順序：

```
1. drawTiles()     — 最底層
2. drawGrid()      — 格線（可選，可淡化或關閉）
3. drawPath()      — 路徑疊在 tile 上
4. drawEntities()  — 塔、敵人、投射物、特效
```

### D5. 格線範圍修正

`drawGrid()` 中原本用 `canvas.width` / `canvas.height` 來決定格線範圍，改為：

```js
// 繪製垂直線
for (let i = 0; i <= canvas.width; i += TILE_SIZE) {
    if (i / TILE_SIZE > COLS) break;
    // ...
}
// 或更乾淨：
for (let c = 0; c <= COLS; c++) {
    ctx.moveTo(c * TILE_SIZE, 0);
    ctx.lineTo(c * TILE_SIZE, ROWS * TILE_SIZE);
}
```

---

## 階段 E：UI / CSS 佈局

### 方案 A：疊層式（改動最小）

維持現有 UI 疊在 canvas 上方的設計，只微調 CSS 中 absolute 定位的數值。

| 元素 | CSS 檔案位置 | 建議調整 |
|------|------------|----------|
| `.info-bar` | `styles.css:34` | top 值可略降 |
| `.control-bar-container` | `styles.css:44` | 底部高度可縮小 |
| `#next-wave-btn` | `styles.css:98` | 位置微調 |
| `#bottom-left-controls` | `styles.css:72` | 位置微調 |

### 方案 B：分離式佈局（推薦）

將 UI 移到 canvas 外部，真正解決遮擋問題。

#### B1. `index.html` 結構修改

```html
<div id="app-wrapper">
    <div class="game-area">
        <canvas id="gameCanvas" width="1024" height="576"></canvas>
    </div>
    <div class="ui-panel">
        <!-- info-bar, controls, 商店按鈕等移到此處 -->
    </div>
</div>
```

#### B2. CSS 修改

```css
#app-wrapper {
    display: flex;
    width: 100vw; height: 100vh;
    justify-content: center;
    align-items: center;
    background: #0b0c10;
}

.game-area {
    position: relative;
    width: 1024px;
    height: 576px;
    flex-shrink: 0;
}

.ui-panel {
    width: 256px;
    height: 576px;
    padding: 16px;
    background: #1f2833;
    border-left: 2px solid #45a29e;
    display: flex;
    flex-direction: column;
    gap: 12px;
}
```

---

## 階段 F：地圖編輯器 tile 編輯功能（可選）

### F1. 新增工具列按鈕

在 `map-editor.html` 的 toolbar 中新增 tile 類型選擇按鈕：

```html
<div class="sep"></div>
<button class="tile-btn active" data-tile="0" style="background:#1a2a1a;">🌿 平原</button>
<button class="tile-btn" data-tile="1" style="background:#3a3a2a;">🛤️ 道路</button>
<button class="tile-btn" data-tile="2" style="background:#2a1a1a;">🧱 障礙</button>
```

### F2. 維護 tileData 陣列

初始化：
```js
let tileData = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
```

滑鼠點擊時根據當前 tile 工具修改 `tileData[row][col]`：
```js
canvas.addEventListener('click', (e) => {
    const g = getGridPos(e);
    if (currentTileTool !== null) {
        tileData[g.row][g.col] = currentTileTool;
        render();
    }
});
```

### F3. 匯出時包含 tileData

在 `exportMap()` 中：
```js
const mapData = {
    // ... 原有欄位
    tileData: tileData,
};
```

---

## 相依性圖

```
階段 A ──→ 階段 B ──→ 階段 C ──→ 階段 D ──→ 階段 E
（核心常數） （塔尺寸）   （基地）    （地形）    （UI）
   │                                    ↑
   └── F. 地圖編輯器 tile 編輯 ──────────┘
```

- **階段 A** 是前置條件，所有階段皆依賴它
- **階段 B、C、D** 彼此獨立，可並行修改
- **階段 E** 依賴階段 A（canvas 大小確定後才能決定 UI 佈局）
- **階段 F** 依賴階段 A 和 D（tile 系統完成後編輯器才需要支援）

---

## 參考連結

- Skill 檔案：`.opencode/skills/tes-map-redesign/SKILL.md`
- 地圖編輯器：`map-editor.html`
- 主遊戲入口：`index.html`
- 常數定義：`js/constants.js`
- 圖形繪製：`js/graphics.js`
- 實體類別：`js/entities.js`
- 遊戲邏輯：`js/game.js`
- 主要邏輯：`js/main.js`
- 樣式表：`css/styles.css`