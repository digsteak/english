// ============================================================
// effects.js — 粒子與視覺特效系統
// ============================================================

// --- 重力場（黑洞效果） ---
class GravityField {
    constructor(x, y, damage) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.life = GRAVITY_FIELD_DURATION;
        this.radius = GRAVITY_FIELD_RADIUS * DRAW_SCALE;
    }

    update() {
        this.life--;
        G.enemies.forEach(e => {
            const dist = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
            if (dist <= this.radius) {
                e.x += (this.x - e.x) * GRAVITY_PULL_STRENGTH;
                e.y += (this.y - e.y) * GRAVITY_PULL_STRENGTH;
                e.stuck = true;
                if (this.life % GRAVITY_DAMAGE_INTERVAL === 0) {
                    applyDamage(e, this.damage);
                }
            }
        });
    }

    draw() {
        const ctx = G.ctx;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Date.now() / 200);
        ctx.globalAlpha = 0.3 * (this.life / 60);
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a020f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(this.radius / 2, this.radius / 2, this.radius, 0, this.radius, this.radius);
        }
        ctx.stroke();
        ctx.restore();
    }
}

// --- 天基打擊 ---
class OrbitalStrike {
    constructor(x, y, damage) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.life = ORBITAL_DURATION;
        soundManager.playNoise(1.0, 0.1);
    }

    update() {
        this.life--;
        if (this.life % ORBITAL_TICK_INTERVAL === 0) {
            G.enemies.forEach(e => {
                if (Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2) < ORBITAL_RADIUS * DRAW_SCALE) {
                    applyDamage(e, this.damage);
                }
            });
            createExplosion(this.x, this.y, 5, '#fff');
        }
    }

    draw() {
        const ctx = G.ctx;
        ctx.globalAlpha = this.life / ORBITAL_DURATION;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, ORBITAL_RADIUS * DRAW_SCALE, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(this.x - ORBITAL_RADIUS * DRAW_SCALE, 0, ORBITAL_RADIUS * 2 * DRAW_SCALE, this.y);
        ctx.globalAlpha = 1;
    }
}

// --- 浮動文字 ---
class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1.0;
    }

    update() {
        this.y -= 0.5;
        this.life -= 0.02;
    }

    draw() {
        const ctx = G.ctx;
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.font = 'bold 18px Arial';
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1.0;
    }
}

// --- 基礎粒子 ---
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const a = Math.random() * Math.PI * 2;
        const s = (Math.random() * 2 + 1) * DRAW_SCALE;
        this.vx = Math.cos(a) * s;
        this.vy = Math.sin(a) * s;
        this.life = 1.0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.05;
    }

    draw() {
        const ctx = G.ctx;
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 4 * DRAW_SCALE, 4 * DRAW_SCALE);
        ctx.globalAlpha = 1.0;
    }
}

// --- 衝擊波 ---
class Shockwave {
    constructor(x, y, maxR, color) {
        this.x = x;
        this.y = y;
        this.r = 5;
        this.maxR = maxR;
        this.life = 1.0;
        this.color = color;
    }

    update() {
        this.r += 5 * DRAW_SCALE;
        this.life -= 0.08;
    }

    draw() {
        const ctx = G.ctx;
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4 * DRAW_SCALE;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }
}

// --- 雷射光束 ---
class LaserBeam {
    constructor(x1, y1, x2, y2, color, thick) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.color = color;
        this.life = 1.0;
        this.thick = thick;
    }

    update() {
        this.life -= 0.15;
    }

    draw() {
        const ctx = G.ctx;
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = (this.thick ? 4 : 2) * DRAW_SCALE;
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }
}

// --- 火焰噴射 ---
class FlameBreath {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.life = 1.0;
    }

    update() {
        this.life -= 0.2;
    }

    draw() {
        const ctx = G.ctx;
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.strokeStyle = '#ff4400';
        ctx.lineWidth = 4 * DRAW_SCALE;
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }
}

// --- 閃電效果 ---
class Lightning {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.life = 1.0;
        this.points = [];
        const steps = 5;
        const dx = (x2 - x1) / steps;
        const dy = (y2 - y1) / steps;
        this.points.push({ x: x1, y: y1 });
        for (let i = 1; i < steps; i++) {
            this.points.push({
                x: x1 + dx * i + (Math.random() - 0.5) * 15 * DRAW_SCALE,
                y: y1 + dy * i + (Math.random() - 0.5) * 15 * DRAW_SCALE
            });
        }
        this.points.push({ x: x2, y: y2 });
    }

    update() {
        this.life -= 0.2;
    }

    draw() {
        const ctx = G.ctx;
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.strokeStyle = '#fee440';
        ctx.lineWidth = 2 * DRAW_SCALE;
        ctx.beginPath();
        this.points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }
}

// --- 工具函數：產生爆炸粒子 ---
function createExplosion(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        G.particles.push(new Particle(x, y, color));
    }
}
