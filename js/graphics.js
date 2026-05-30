// ============================================================
// graphics.js — TowerGraphics + EnemyGraphics SVG 產生器
// ============================================================

const TowerGraphics = {
    cache: {},
    spriteSheet: null,
    spriteRows: { ice: 0, basic: 1, rapid: 2, sniper: 3 },
    spriteFrameW: 64,
    spriteFrameH: 64,

    init: function () {
        const sheet = new Image();
        sheet.src = 'PIC/TurrpetAs.png';
        this.spriteSheet = sheet;

        for (let key in TOWER_TYPES) {
            if (this.spriteRows[key] !== undefined) continue;
            const img = new Image();
            if (key === 'vampire') {
                img.src = 'PIC/vampire.png';
            } else {
                img.src = this.generateSVG(key, TOWER_TYPES[key]);
            }
            this.cache[key] = img;
        }
    },

    getSpriteFrame: function (type, cooldownTimer, totalCooldown) {
        const row = this.spriteRows[type];
        if (row === undefined) return null;
        const isAttacking = cooldownTimer > totalCooldown * 0.6;
        let col;
        if (isAttacking) {
            col = 2 + (Math.floor(Date.now() / 150) % 2);
        } else {
            col = Math.floor(Date.now() / 500) % 2;
        }
        return { sx: col * this.spriteFrameW, sy: row * this.spriteFrameH, sw: this.spriteFrameW, sh: this.spriteFrameH };
    },

    generateSVG: function (key, t) {
        const c = t.color;
        const base =
            `<polygon points="25,15 75,15 85,25 85,75 75,85 25,85 15,75 15,25" fill="#1f2833" stroke="${c}" stroke-width="3"/>` +
            `<circle cx="50" cy="50" r="28" fill="#0b0c10" stroke="${c}" stroke-width="2"/>`;

        let weapon = '';

        if (key === 'bank') {
            weapon = `<rect x="35" y="35" width="30" height="30" fill="#ffd700"/>` +
                     `<text x="50" y="55" fill="#222" font-size="20" font-family="Arial" font-weight="bold" text-anchor="middle" dominant-baseline="central">$</text>`;
        } else if (key === 'cannon') {
            weapon = `<rect x="50" y="40" width="35" height="20" fill="#888"/>` +
                     `<circle cx="50" cy="50" r="15" fill="#333"/>`;
        } else if (key === 'poison') {
            weapon = `<circle cx="50" cy="50" r="18" fill="${c}"/>` +
                     `<circle cx="55" cy="45" r="5" fill="#fff" opacity="0.6"/>`;
        } else if (key === 'tesla') {
            weapon = `<path d="M 50,25 L 75,25 M 50,75 L 75,75 M 65,25 L 65,75" stroke="${c}" stroke-width="6"/>` +
                     `<circle cx="50" cy="50" r="15" fill="#fee440"/>`;
        } else if (key === 'flame') {
            weapon = `<path d="M 50,42 L 85,46 L 85,54 L 50,58 Z" fill="#ff4400"/>` +
                     `<circle cx="50" cy="50" r="16" fill="#aa2200"/>`;
        } else if (key === 'gatling') {
            weapon = `<rect x="50" y="36" width="30" height="4" fill="#a0b0b0"/>` +
                     `<rect x="50" y="45" width="35" height="4" fill="#a0b0b0"/>` +
                     `<rect x="50" y="54" width="30" height="4" fill="#a0b0b0"/>`;
        } else if (key === 'multishot') {
            weapon = `<path d="M 50,50 L 80,15 M 50,50 L 90,50 M 50,50 L 80,85" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`;
        } else if (key === 'radar') {
            weapon = `<path d="M 70,20 A 40 40 0 0 0 70,80" fill="none" stroke="${c}" stroke-width="4"/>` +
                     `<circle cx="50" cy="50" r="12" fill="#fff"/>`;
        } else if (key === 'plasma') {
            weapon = `<rect x="40" y="35" width="40" height="10" fill="#d000ff" rx="4"/>` +
                     `<rect x="40" y="55" width="40" height="10" fill="#d000ff" rx="4"/>` +
                     `<circle cx="50" cy="50" r="14" fill="#fff"/>`;
        } else if (key === 'laser' || key === 'prism') {
            weapon = `<polygon points="40,30 80,50 40,70" fill="${c}"/>` +
                     `<polygon points="45,40 70,50 45,60" fill="#fff"/>`;
        } else if (key === 'artillery') {
            weapon = `<rect x="40" y="32" width="45" height="36" fill="${c}" rx="5"/>` +
                     `<circle cx="50" cy="50" r="22" fill="#333"/>`;
        } else if (key === 'emp') {
            weapon = `<circle cx="50" cy="50" r="20" fill="none" stroke="${c}" stroke-width="4" stroke-dasharray="8 8"/>` +
                     `<circle cx="50" cy="50" r="10" fill="${c}"/>`;
        } else if (key === 'blackhole') {
            weapon = `<circle cx="50" cy="50" r="22" fill="#000"/>` +
                     `<path d="M 50,20 A 30 30 0 0 1 80,50 M 50,80 A 30 30 0 0 1 20,50" fill="none" stroke="${c}" stroke-width="4"/>`;
        } else if (key === 'dronepad') {
            weapon = `<polygon points="50,20 75,35 75,65 50,80 25,65 25,35" fill="none" stroke="${c}" stroke-width="4"/>` +
                     `<circle cx="50" cy="50" r="8" fill="#fff"/>`;
        } else if (key === 'railgun') {
            weapon = `<rect x="30" y="35" width="60" height="8" fill="#2962ff"/>` +
                     `<rect x="30" y="57" width="60" height="8" fill="#2962ff"/>` +
                     `<rect x="40" y="30" width="20" height="40" fill="#fff"/>`;
        } else if (key === 'nuke') {
            weapon = `<path d="M 40,35 L 75,50 L 40,65 Z" fill="#ff9900"/>` +
                     `<circle cx="50" cy="50" r="14" fill="#660000"/>`;
        } else if (key === 'orbital') {
            weapon = `<circle cx="50" cy="50" r="26" fill="none" stroke="#fff" stroke-width="4"/>` +
                     `<rect x="45" y="10" width="10" height="30" fill="${c}"/>` +
                     `<circle cx="50" cy="20" r="6" fill="#ff0000"/>`;
        } else if (key === 'vampire') {
            weapon = `<polygon points="50,20 80,50 50,80 20,50" fill="${c}"/>` +
                     `<circle cx="50" cy="50" r="10" fill="#fff"/>`;
        } else if (key === 'greed') {
            weapon = `<polygon points="50,15 62,38 85,42 68,58 72,82 50,72 28,82 32,58 15,42 38,38" fill="${c}"/>` +
                     `<text x="50" y="55" fill="#000" font-size="24" font-weight="bold" text-anchor="middle" dominant-baseline="central">+</text>`;
        } else if (key === 'chrono') {
            weapon = `<polygon points="30,25 70,25 40,50 70,75 30,75 60,50" fill="${c}"/>`;
        } else if (key === 'doom') {
            weapon = `<rect x="40" y="25" width="40" height="50" fill="${c}"/>` +
                     `<rect x="75" y="35" width="10" height="30" fill="#000"/>` +
                     `<rect x="35" y="35" width="20" height="30" fill="#444"/>`;
        } else {
            weapon = `<circle cx="50" cy="50" r="20" fill="${c}"/>`;
        }

        const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${base}${weapon}</svg>`;
        return 'data:image/svg+xml,' + encodeURIComponent(svgStr);
    }
};

// ============================================================
// EnemyGraphics — 小怪 SVG 圖形產生器
// ============================================================

const EnemyGraphics = {
    cache: {},
    spriteSheet: null,
    spriteRows: { normal: 0, scout: 1, tank: 2, healer: 3 },
    spriteFrameW: 32,
    spriteFrameH: 32,

    init: function () {
        const sheet = new Image();
        sheet.src = 'PIC/EEMYAs.png';
        this.spriteSheet = sheet;

        for (let key in ENEMY_TYPES) {
            if (this.spriteRows[key] !== undefined) continue;
            const img = new Image();
            img.src = this.generateSVG(key, ENEMY_TYPES[key]);
            this.cache[key] = img;
        }
    },

    getSpriteFrame: function (typeKey) {
        const row = this.spriteRows[typeKey];
        if (row === undefined) return null;
        const col = Math.floor(Date.now() / 200) % 4;
        return { sx: col * this.spriteFrameW, sy: row * this.spriteFrameH, sw: this.spriteFrameW, sh: this.spriteFrameH };
    },

    generateSVG: function (key, t) {
        const c = t.color;
        let body = '';

        if (key === 'normal') {
            body = `<ellipse cx="50" cy="55" rx="28" ry="24" fill="${c}"/>
                    <ellipse cx="50" cy="55" rx="28" ry="24" fill="url(#nGrad)" opacity="0.6"/>
                    <ellipse cx="50" cy="60" rx="20" ry="14" fill="${c}" opacity="0.5"/>
                    <path d="M35,35 Q30,15 20,10" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>
                    <path d="M65,35 Q70,15 80,10" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>
                    <circle cx="20" cy="10" r="4" fill="#ff0"/>
                    <circle cx="80" cy="10" r="4" fill="#ff0"/>
                    <ellipse cx="40" cy="45" rx="7" ry="9" fill="#200"/>
                    <ellipse cx="60" cy="45" rx="7" ry="9" fill="#200"/>
                    <ellipse cx="41" cy="44" rx="4" ry="5" fill="#f44"/>
                    <ellipse cx="61" cy="44" rx="4" ry="5" fill="#f44"/>
                    <ellipse cx="42" cy="43" rx="2" ry="2" fill="#fff"/>
                    <ellipse cx="62" cy="43" rx="2" ry="2" fill="#fff"/>
                    <path d="M38,68 Q50,78 62,68" stroke="#a11" stroke-width="2" fill="none"/>
                    <defs><radialGradient id="nGrad"><stop offset="0%" stop-color="#fff" stop-opacity="0.4"/><stop offset="100%" stop-color="${c}" stop-opacity="0"/></radialGradient></defs>`;
        } else if (key === 'scout') {
            body = `<polygon points="85,50 25,25 35,45 25,50 35,55 25,75" fill="${c}"/>
                    <polygon points="85,50 25,25 25,75" fill="url(#sGrad)" opacity="0.5"/>
                    <polygon points="40,45 60,50 40,55" fill="#fff" opacity="0.6"/>
                    <rect x="55" y="47" width="20" height="6" rx="2" fill="#fff" opacity="0.3"/>
                    <circle cx="70" cy="50" r="4" fill="#0ff"/>
                    <circle cx="70" cy="50" r="2" fill="#fff"/>
                    <polygon points="25,48 10,46 12,50 10,54 25,52" fill="#f80" opacity="0.8"/>
                    <polygon points="25,48 15,48 17,50 15,52 25,52" fill="#ff0" opacity="0.6"/>
                    <line x1="30" y1="30" x2="45" y2="42" stroke="${c}" stroke-width="2" opacity="0.5"/>
                    <line x1="30" y1="70" x2="45" y2="58" stroke="${c}" stroke-width="2" opacity="0.5"/>
                    <defs><linearGradient id="sGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#fff" stop-opacity="0.3"/><stop offset="100%" stop-color="${c}" stop-opacity="0"/></linearGradient></defs>`;
        } else if (key === 'tank') {
            body = `<rect x="15" y="25" width="70" height="50" rx="8" fill="#555"/>
                    <rect x="20" y="30" width="60" height="40" rx="5" fill="${c}"/>
                    <rect x="20" y="30" width="60" height="40" rx="5" fill="url(#tGrad)" opacity="0.4"/>
                    <rect x="25" y="35" width="50" height="30" rx="3" fill="#444"/>
                    <rect x="30" y="40" width="40" height="20" rx="2" fill="#333"/>
                    <circle cx="50" cy="50" r="10" fill="${c}"/>
                    <circle cx="50" cy="50" r="6" fill="#fff" opacity="0.3"/>
                    <rect x="60" y="46" width="25" height="8" rx="2" fill="#aaa"/>
                    <rect x="15" y="20" width="70" height="6" rx="2" fill="#333" stroke="#555" stroke-width="1"/>
                    <rect x="15" y="74" width="70" height="6" rx="2" fill="#333" stroke="#555" stroke-width="1"/>
                    <line x1="20" y1="22" x2="20" y2="26" stroke="#777" stroke-width="3"/>
                    <line x1="35" y1="22" x2="35" y2="26" stroke="#777" stroke-width="3"/>
                    <line x1="50" y1="22" x2="50" y2="26" stroke="#777" stroke-width="3"/>
                    <line x1="65" y1="22" x2="65" y2="26" stroke="#777" stroke-width="3"/>
                    <line x1="80" y1="22" x2="80" y2="26" stroke="#777" stroke-width="3"/>
                    <line x1="20" y1="76" x2="20" y2="80" stroke="#777" stroke-width="3"/>
                    <line x1="35" y1="76" x2="35" y2="80" stroke="#777" stroke-width="3"/>
                    <line x1="50" y1="76" x2="50" y2="80" stroke="#777" stroke-width="3"/>
                    <line x1="65" y1="76" x2="65" y2="80" stroke="#777" stroke-width="3"/>
                    <line x1="80" y1="76" x2="80" y2="80" stroke="#777" stroke-width="3"/>
                    <defs><linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fff" stop-opacity="0.5"/><stop offset="100%" stop-color="#000" stop-opacity="0.3"/></linearGradient></defs>`;
        } else if (key === 'healer') {
            body = `<polygon points="50,15 80,32 80,68 50,85 20,68 20,32" fill="${c}" opacity="0.7"/>
                    <polygon points="50,15 80,32 80,68 50,85 20,68 20,32" fill="none" stroke="#fff" stroke-width="2" opacity="0.5"/>
                    <polygon points="50,25 70,37 70,63 50,75 30,63 30,37" fill="${c}" opacity="0.5"/>
                    <rect x="45" y="30" width="10" height="40" rx="2" fill="#fff"/>
                    <rect x="30" y="45" width="40" height="10" rx="2" fill="#fff"/>
                    <circle cx="50" cy="50" r="8" fill="#fff" opacity="0.6"/>
                    <circle cx="50" cy="50" r="4" fill="${c}"/>
                    <circle cx="50" cy="50" r="22" fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="4 4" opacity="0.4"/>`;
        } else if (key === 'stealth') {
            body = `<path d="M50,10 Q80,30 75,60 Q70,85 60,90 Q55,80 50,90 Q45,80 40,90 Q30,85 25,60 Q20,30 50,10Z" fill="${c}" opacity="0.6"/>
                    <path d="M50,10 Q80,30 75,60 Q70,85 60,90 Q55,80 50,90 Q45,80 40,90 Q30,85 25,60 Q20,30 50,10Z" fill="url(#stGrad)" opacity="0.4"/>
                    <ellipse cx="40" cy="40" rx="8" ry="6" fill="#000"/>
                    <ellipse cx="60" cy="40" rx="8" ry="6" fill="#000"/>
                    <ellipse cx="40" cy="40" rx="5" ry="4" fill="#e0f"/>
                    <ellipse cx="60" cy="40" rx="5" ry="4" fill="#e0f"/>
                    <ellipse cx="41" cy="39" rx="2" ry="2" fill="#fff"/>
                    <ellipse cx="61" cy="39" rx="2" ry="2" fill="#fff"/>
                    <defs><linearGradient id="stGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fff" stop-opacity="0.3"/><stop offset="100%" stop-color="#000" stop-opacity="0.5"/></linearGradient></defs>`;
        } else if (key === 'drone') {
            body = `<ellipse cx="50" cy="50" rx="18" ry="14" fill="${c}"/>
                    <ellipse cx="50" cy="50" rx="10" ry="8" fill="#fff" opacity="0.2"/>
                    <ellipse cx="35" cy="35" rx="14" ry="6" fill="#fff" opacity="0.3" transform="rotate(-30,35,35)"/>
                    <ellipse cx="65" cy="35" rx="14" ry="6" fill="#fff" opacity="0.3" transform="rotate(30,65,35)"/>
                    <circle cx="55" cy="46" r="3" fill="#ff0"/>
                    <circle cx="55" cy="46" r="1.5" fill="#fff"/>
                    <line x1="50" y1="64" x2="45" y2="75" stroke="${c}" stroke-width="1.5"/>
                    <line x1="50" y1="64" x2="55" y2="75" stroke="${c}" stroke-width="1.5"/>`;
        } else if (key === 'boss_berserker') {
            body = `<circle cx="50" cy="55" r="32" fill="#330000"/>
                    <circle cx="50" cy="55" r="30" fill="${c}"/>
                    <circle cx="50" cy="55" r="30" fill="url(#bbGrad)"/>
                    <path d="M20,30 L30,10 L35,28" fill="#f80" opacity="0.9"/>
                    <path d="M35,22 L42,5 L45,22" fill="#ff0" opacity="0.8"/>
                    <path d="M45,18 L50,0 L55,18" fill="#f80" opacity="0.9"/>
                    <path d="M55,22 L58,5 L65,22" fill="#ff0" opacity="0.8"/>
                    <path d="M65,28 L70,10 L80,30" fill="#f80" opacity="0.9"/>
                    <rect x="33" y="42" width="14" height="18" rx="3" fill="#111"/>
                    <rect x="53" y="42" width="14" height="18" rx="3" fill="#111"/>
                    <circle cx="40" cy="50" r="5" fill="#ff0"/>
                    <circle cx="60" cy="50" r="5" fill="#ff0"/>
                    <circle cx="40" cy="50" r="2" fill="#f00"/>
                    <circle cx="60" cy="50" r="2" fill="#f00"/>
                    <path d="M38,72 L42,68 L46,72 L50,66 L54,72 L58,68 L62,72" stroke="#111" stroke-width="2" fill="none"/>
                    <line x1="30" y1="55" x2="25" y2="65" stroke="#f80" stroke-width="2" opacity="0.6"/>
                    <line x1="70" y1="55" x2="75" y2="65" stroke="#f80" stroke-width="2" opacity="0.6"/>
                    <line x1="45" y1="35" x2="55" y2="35" stroke="#f80" stroke-width="1" opacity="0.4"/>
                    <defs><radialGradient id="bbGrad"><stop offset="30%" stop-color="#ff0" stop-opacity="0.2"/><stop offset="100%" stop-color="#300" stop-opacity="0.5"/></radialGradient></defs>`;
        } else if (key === 'boss_carrier') {
            body = `<polygon points="50,8 88,28 88,72 50,92 12,72 12,28" fill="#222"/>
                    <polygon points="50,8 88,28 88,72 50,92 12,72 12,28" fill="none" stroke="${c}" stroke-width="3"/>
                    <polygon points="50,18 78,33 78,67 50,82 22,67 22,33" fill="#1a0a20"/>
                    <rect x="30" y="38" width="40" height="24" fill="#111" stroke="${c}" stroke-width="1"/>
                    <rect x="35" y="42" width="12" height="8" fill="${c}" opacity="0.5"/>
                    <rect x="53" y="42" width="12" height="8" fill="${c}" opacity="0.5"/>
                    <rect x="35" y="54" width="12" height="4" fill="#e040fb" opacity="0.6"/>
                    <rect x="53" y="54" width="12" height="4" fill="#e040fb" opacity="0.6"/>
                    <circle cx="50" cy="50" r="6" fill="${c}"/>
                    <circle cx="50" cy="50" r="3" fill="#fff"/>
                    <line x1="12" y1="50" x2="22" y2="50" stroke="${c}" stroke-width="2"/>
                    <line x1="78" y1="50" x2="88" y2="50" stroke="${c}" stroke-width="2"/>`;
        } else if (key === 'boss_armored') {
            body = `<circle cx="50" cy="50" r="35" fill="#333"/>
                    <circle cx="50" cy="50" r="32" fill="${c}"/>
                    <circle cx="50" cy="50" r="32" fill="url(#baGrad)" opacity="0.5"/>
                    <circle cx="50" cy="50" r="24" fill="#444" stroke="#888" stroke-width="2"/>
                    <circle cx="50" cy="50" r="16" fill="#333" stroke="#aaa" stroke-width="2"/>
                    <circle cx="50" cy="50" r="8" fill="#fff" opacity="0.3"/>
                    <circle cx="50" cy="50" r="4" fill="#f00"/>
                    <rect x="47" y="10" width="6" height="14" fill="#888"/>
                    <rect x="47" y="76" width="6" height="14" fill="#888"/>
                    <rect x="10" y="47" width="14" height="6" fill="#888"/>
                    <rect x="76" y="47" width="14" height="6" fill="#888"/>
                    <rect x="20" y="18" width="5" height="10" fill="#888" transform="rotate(45,22,23)"/>
                    <rect x="75" y="18" width="5" height="10" fill="#888" transform="rotate(-45,77,23)"/>
                    <rect x="20" y="72" width="5" height="10" fill="#888" transform="rotate(-45,22,77)"/>
                    <rect x="75" y="72" width="5" height="10" fill="#888" transform="rotate(45,77,77)"/>
                    <defs><radialGradient id="baGrad"><stop offset="0%" stop-color="#fff" stop-opacity="0.3"/><stop offset="100%" stop-color="#000" stop-opacity="0.4"/></radialGradient></defs>`;
        } else if (key === 'boss_teleporter') {
            body = `<circle cx="50" cy="50" r="30" fill="#000"/>
                    <circle cx="50" cy="50" r="28" fill="url(#btGrad)"/>
                    <path d="M50,22 A28,28 0 0,1 78,50" fill="none" stroke="${c}" stroke-width="4" opacity="0.9"/>
                    <path d="M78,50 A28,28 0 0,1 50,78" fill="none" stroke="#00f" stroke-width="3" opacity="0.7"/>
                    <path d="M50,78 A28,28 0 0,1 22,50" fill="none" stroke="${c}" stroke-width="4" opacity="0.9"/>
                    <path d="M22,50 A28,28 0 0,1 50,22" fill="none" stroke="#00f" stroke-width="3" opacity="0.7"/>
                    <circle cx="50" cy="50" r="18" fill="none" stroke="#44f" stroke-width="2" stroke-dasharray="6 3" opacity="0.5"/>
                    <circle cx="50" cy="50" r="10" fill="${c}" opacity="0.8"/>
                    <circle cx="50" cy="50" r="5" fill="#fff"/>
                    <line x1="50" y1="12" x2="50" y2="20" stroke="#fff" stroke-width="2" opacity="0.5"/>
                    <line x1="50" y1="80" x2="50" y2="88" stroke="#fff" stroke-width="2" opacity="0.5"/>
                    <line x1="12" y1="50" x2="20" y2="50" stroke="#fff" stroke-width="2" opacity="0.5"/>
                    <line x1="80" y1="50" x2="88" y2="50" stroke="#fff" stroke-width="2" opacity="0.5"/>
                    <defs><radialGradient id="btGrad"><stop offset="0%" stop-color="${c}" stop-opacity="0.6"/><stop offset="60%" stop-color="#006" stop-opacity="0.3"/><stop offset="100%" stop-color="#000" stop-opacity="0.8"/></radialGradient></defs>`;
        }

        const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${body}</svg>`;
        return 'data:image/svg+xml,' + encodeURIComponent(svgStr);
    }
};

// ============================================================
// BaseGraphics — 基地圖像載入
// ============================================================

const BaseGraphics = {
    cache: null,

    init: function () {
        const img = new Image();
        img.src = 'PIC/bases.png';
        this.cache = img;
    }
};

// FenceGraphics — 柵欄貼圖
// ============================================================

const FenceGraphics = {
    cache: null,
    init() {
        const img = new Image();
        img.src = 'PIC/GAPs.png';
        this.cache = img;
    }
};

// GroundGraphics — 底層地面貼圖
// ============================================================

const GroundGraphics = {
    cache: null,
    init() {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => { this.cache = img; resolve(); };
            img.onerror = () => { this.cache = img; resolve(); };
            img.src = 'PIC/MOONGRN.png';
        });
    }
};
