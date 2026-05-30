分析完畢，現在整理修改規劃。

---

## 程式設計修改規劃

### 需求摘要

| 項目 | 現值 | 目標值 |
|------|------|--------|
| 遊戲區域 (`canvas`) | 1536 × 864 | **1024 × 576** |
| TILE_SIZE | 32 | **32** (不變) |
| 地圖編輯網格 (COLS × ROWS) | 48 × 27 | **32 × 18** |
| 塔顯示尺寸 | 28×28 | **64×64** |
| 基地 (終點) | 12px 圓形 | **96×96** |
| 道路貼圖 | 無 tile 渲染（純色線） | **32×32 tile 貼圖 (道路、平原)** |
| 剩餘空間 | 無 | 留給 UI 訊息使用 |

---

### 修改清單

#### 第一階段：尺寸常數與畫布

| # | 檔案 | 修改內容 |
|---|------|----------|
| 1 | `js/constants.js:6` | `TILE_SIZE` 保持 `32`（不變） |
| 2 | `js/constants.js:2` | **新增** `CANVAS_W = 1024`, `CANVAS_H = 576` |
| 3 | `js/constants.js:4` | **新增** `COLS = 32`, `ROWS = 18`（由 CANVAS_W / TILE_SIZE 推算） |
| 4 | `js/constants.js:142` | 路徑驗證的硬編碼 `48` → `COLS`, `27` → `ROWS` |
| 5 | `index.html:12` | `<canvas width="1024" height="576">` |
| 6 | `css/styles.css:22-25` | `#game-container` 的 16:9 比例需調整（原依賴 1536:864，新遊戲區 1024:576 仍是 16:9，但需考量 UI 空間 — 見下方 UI 佈局討論） |

#### 第二階段：塔尺寸 (28 → 64)

| # | 檔案 | 修改內容 |
|---|------|----------|
| 7 | `js/entities.js:471` | `displaySize` 從 `28` → `64` |
| 8 | `js/entities.js:433` | 選取圈半徑 `16` → `32`（改為 `displaySize / 2`） |
| 9 | `js/entities.js:456` | 光框 `-14, 28, 28` → 以 `displaySize` 動態計算 |
| 10 | `js/entities.js:491` | 星星 Y 偏移 `20` → `32` ( `displaySize / 2 + 4`) |
| 11 | `js/graphics.js:105` | SVG viewBox 保持 `100×100`（向量，無需改），但可考慮提高解析度 |

#### 第三階段：基地尺寸

| # | 檔案 | 修改內容 |
|---|------|----------|
| 12 | `js/game.js:425` | 終點半徑 `12` → 需改為基地貼圖繪製 (96×96) |
| 13 | `js/game.js:402-428` | `drawPath` 函數：終點改為繪製基地圖示，`drawImage` 96×96 |

#### 第四階段：地形 Tile 渲染（32×32 道路/平原貼圖）

| # | 檔案 | 修改內容 |
|---|------|----------|
| 14 | `js/constants.js` | **新增** `TILE_TEXTURES` 物件，定義 `0: 平原`, `1: 道路` 等 tile 類型與對應 SVG/圖片 |
| 15 | `js/game.js` | **新增** `drawTiles()` 函數，根據地圖 `tileData` 逐格繪製 tile 貼圖 |
| 16 | `js/game.js` | `render()` 中，繪製順序改為：`drawTiles()` → `drawGrid()` → `drawPath()` → entities |
| 17 | `js/game.js:382-399` | 格線繪製改以 `COLS`/`ROWS` 取代 `canvas.width`/`canvas.height` |
| 18 | `js/constants.js:130-177` | `loadMapFromJSON` 需讀取 `tileData` 並存入 `G.tileData` |
| 19 | `map-editor.html:83` | `COLS` → `32`, `ROWS` → `18` |
| 20 | `map-editor.html:453-456` | 匯出 tileData 邏輯需擴充（目前填全 0，需增加 tile 類型編輯器） |

#### 第五階段：UI/CSS 佈局調整

| # | 檔案 | 修改內容 |
|---|------|----------|
| 21 | `index.html` | 將 canvas 包在遊戲區容器中，外部容器擴大到容納 UI |
| 22 | `css/styles.css` | 調整 `#game-container` 為較大尺寸（例如 1280×720 或保留自動縮放），遊戲區 1024×576 + 右側/底部 UI 面板 256×144 等 |
| 23 | `css/styles.css:44-52` | 控制欄 `.control-bar-container` 可能需要移出 canvas 範圍 |
| 24 | `css/styles.css:34-38` | `.info-bar` 位置可能需調整 |

---

### UI 佈局建議

目前所有 UI 元素都用 `position: absolute` 疊在 canvas 上方，遮擋遊戲畫面。建議兩種方案：

**方案 A：保留現有疊層設計**（改動最小）
- Canvas 保持 1024×576
- UI 元素仍用 absolute 疊加，位置微調即可

**方案 B：分離式佈局**（較乾淨）
- 整個容器擴展為約 1280×720
- 左側/中央：1024×576 遊戲 canvas
- 右側：256px 寬度保留給資訊/控制面板
- 頂部資訊列移到 canvas 上方獨立的 bar

你想採用哪個方案？另外，關於 tile 編輯器部分（讓編輯器具備繪製不同 tile 類型的能力），是現在做還是之後再做？