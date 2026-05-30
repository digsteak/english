// ============================================================
// entities.js — Enemy / Tower / Projectile 類別
// ============================================================

// --- 敵人類別 ---
class Enemy {
    constructor(wave, typeKey, x, y, pathIdx) {
        this.typeKey = typeKey;
        const type = ENEMY_TYPES[typeKey];

        if (x !== undefined && y !== undefined && pathIdx !== undefined) {
            this.x = x;
            this.y = y;
            this.pathIndex = pathIdx;
            if (this.pathIndex >= G.currentPath.length - 1) {
                this.pathIndex = G.currentPath.length - 2;
            }
        } else {
            this.pathIndex = 0;
            this.x = G.currentPath[0].x * TILE_SIZE + TILE_SIZE / 2;
            this.y = G.currentPath[0].y * TILE_SIZE + TILE_SIZE / 2;
        }

        const waveMult = 1 + (wave * 0.25);
        const bossScale = Math.pow(2, Math.floor(G.gameState.bossesKilled / SCALING_INTERVAL));
        this.maxHp = Math.floor(BASE_ENEMY_HP * type.hpMod * waveMult * bossScale);
        this.hp = this.maxHp;
        this.baseSpeed = (BASE_ENEMY_SPEED * type.speedMod * DRAW_SCALE) + Math.min(MAX_SPEED_BONUS, wave * SPEED_SCALE_PER_WAVE);
        this.speed = this.baseSpeed;
        this.radius = type.radius;
        this.color = type.color;
        this.reward = Math.max(1, Math.floor(
            (10 + wave * 1.5) * Math.sqrt(bossScale) * (typeKey === 'drone' ? DRONE_REWARD_MULTIPLIER : 1)
        ));

        this.isBoss = type.group === 'boss';
        if (this.isBoss) {
            this.reward *= BOSS_REWARD_MULTIPLIER;
            this.angle = 0;
        }

        // 狀態效果計時器
        this.slowTimer = 0;
        this.burnTimer = 0;
        this.burnDamage = 0;
        this.poisonTimer = 0;
        this.poisonDamage = 0;
        this.healTimer = 0;
        this.stunTimer = 0;
        this.stuck = false;
        this.carrierSpawnTimer = 0;
        this.teleportTimer = 0;
        this.stealthPhase = 0;

        this.updateTarget();
    }

    updateTarget() {
        this.targetIndex = this.pathIndex + 1;
        if (this.targetIndex < G.currentPath.length) {
            this.targetX = G.currentPath[this.targetIndex].x * TILE_SIZE + TILE_SIZE / 2;
            this.targetY = G.currentPath[this.targetIndex].y * TILE_SIZE + TILE_SIZE / 2;
            const dist = Math.sqrt((this.targetX - this.x) ** 2 + (this.targetY - this.y) ** 2);
            this.vx = (this.targetX - this.x) / dist;
            this.vy = (this.targetY - this.y) / dist;
        }
    }

    move() {
        if (this.stuck) return false;
        if (this.stunTimer > 0) { this.stunTimer--; return false; }

        let currentSpeed = this.speed;

        // 狂暴 Boss：血量越低速度越快
        if (this.typeKey === 'boss_berserker') {
            const hpRatio = this.hp / this.maxHp;
            if (hpRatio < BOSS_BERSERKER_SPEED_THRESHOLD) {
                currentSpeed = this.baseSpeed * (1 + (BOSS_BERSERKER_SPEED_THRESHOLD - hpRatio) * 2);
            }
        }

        // 減速效果
        if (this.slowTimer > 0) {
            currentSpeed *= SLOW_SPEED_MULT;
            this.slowTimer--;
        }

        // 燃燒效果
        if (this.burnTimer > 0) {
            this.burnTimer--;
            if (this.burnTimer % BURN_TICK_INTERVAL === 0) {
                applyDamage(this, this.burnDamage);
                G.particles.push(new Particle(this.x, this.y, '#ff4400'));
            }
        }

        // 中毒效果
        if (this.poisonTimer > 0) {
            this.poisonTimer--;
            currentSpeed *= POISON_SPEED_MULT;
            if (this.poisonTimer % POISON_TICK_INTERVAL === 0) {
                applyDamage(this, this.poisonDamage);
                G.particles.push(new Particle(this.x, this.y, '#00ff00'));
            }
        }

        // 治療者特殊行為
        if (this.typeKey === 'healer') {
            this.healTimer++;
            if (this.healTimer > HEALER_COOLDOWN_FRAMES) {
                this.healTimer = 0;
                G.enemies.forEach(e => {
                    if (e !== this && Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2) < HEALER_HEAL_RANGE * DRAW_SCALE) {
                        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * HEALER_HEAL_PERCENT);
                        createExplosion(e.x, e.y, 3, '#00ff00');
                    }
                });
                createExplosion(this.x, this.y, 8, '#00ff00');
            }
        }

        // 母艦特殊行為：定期生成無人機
        if (this.typeKey === 'boss_carrier') {
            this.carrierSpawnTimer++;
            if (this.carrierSpawnTimer > CARRIER_SPAWN_INTERVAL) {
                this.carrierSpawnTimer = 0;
                const drone = new Enemy(G.gameState.wave, 'drone', this.x, this.y, this.pathIndex);
                drone.updateTarget();
                G.enemies.push(drone);
            }
        }

        // 傳送者特殊行為：定期瞬移
        if (this.typeKey === 'boss_teleporter') {
            this.teleportTimer++;
            if (this.teleportTimer > TELEPORTER_INTERVAL) {
                this.teleportTimer = 0;
                createExplosion(this.x, this.y, 10, '#2962ff');
                this.x += this.vx * TELEPORTER_JUMP_DIST;
                this.y += this.vy * TELEPORTER_JUMP_DIST;
                createExplosion(this.x, this.y, 10, '#2962ff');
                this.updateTarget();
            }
        }

        // 隱形相位
        if (this.typeKey === 'stealth') {
            this.stealthPhase += STEALTH_PHASE_SPEED;
        }

        // 移動
        this.x += this.vx * currentSpeed;
        this.y += this.vy * currentSpeed;

        // Boss 旋轉
        if (this.isBoss) {
            if (this.typeKey === 'boss_berserker') {
                this.angle += BOSS_ROTATION_BASE + (1 - this.hp / this.maxHp) * 0.1;
            } else {
                this.angle += BOSS_DEFAULT_ROTATION;
            }
        }

        // 到達下一路徑點
        const dist = Math.sqrt((this.targetX - this.x) ** 2 + (this.targetY - this.y) ** 2);
        if (dist < currentSpeed) {
            this.pathIndex++;
            if (this.pathIndex >= G.currentPath.length - 1) return true; // 到達終點
            this.updateTarget();
        }
        return false;
    }

    draw() {
        const ctx = G.ctx;
        const img = EnemyGraphics.cache[this.typeKey];
        const drawSize = this.radius * 2.0;
        ctx.save();
        ctx.translate(this.x, this.y);

        // 隱形效果
        if (this.typeKey === 'stealth') {
            ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(this.stealthPhase));
        }

        // Boss 旋轉
        if (this.isBoss) ctx.rotate(this.angle);

        // 非 Boss 小怪根據移動方向旋轉
        const isSpriteSheetEnemy = EnemyGraphics.spriteRows[this.typeKey] !== undefined;
        if (!this.isBoss && isSpriteSheetEnemy) {
            const moveAngle = Math.atan2(this.vy, this.vx);
            ctx.rotate(moveAngle);
        }

        // 繪製 SpriteSheet（normal/scout/tank/healer）或 SVG 備用
        const frame = EnemyGraphics.getSpriteFrame(this.typeKey);
        if (frame && EnemyGraphics.spriteSheet && EnemyGraphics.spriteSheet.complete) {
            ctx.drawImage(
                EnemyGraphics.spriteSheet,
                frame.sx, frame.sy, frame.sw, frame.sh,
                -drawSize / 2, -drawSize / 2, drawSize, drawSize
            );
        } else if (img && img.complete) {
            ctx.drawImage(img, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        }

        // 狀態效果覆蓋色
        if (this.stunTimer > 0 || this.slowTimer > 0 || this.poisonTimer > 0 || this.stuck || (this.burnTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0)) {
            ctx.globalCompositeOperation = 'source-atop';
            if (this.stunTimer > 0) ctx.fillStyle = 'rgba(255,255,255,0.5)';
            else if (this.slowTimer > 0) ctx.fillStyle = 'rgba(128,222,234,0.4)';
            else if (this.poisonTimer > 0) ctx.fillStyle = 'rgba(178,255,89,0.4)';
            else if (this.stuck) ctx.fillStyle = 'rgba(85,85,85,0.5)';
            else ctx.fillStyle = 'rgba(255,85,0,0.5)';
            ctx.fillRect(-drawSize / 2, -drawSize / 2, drawSize, drawSize);
            ctx.globalCompositeOperation = 'source-over';
        }

        // Boss 額外光環特效
        if (this.isBoss) {
            const glowR = drawSize * 0.6;
            ctx.globalAlpha = 0.15 + 0.1 * Math.sin(Date.now() / 300);
            ctx.beginPath();
            ctx.arc(0, 0, glowR, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        ctx.restore();

        // 血量條
        const hpPct = this.hp / this.maxHp;
        const barW = 18;
        const barH = 3;
        const barX = this.x - barW / 2;
        const barY = this.y - this.radius - 6;
        ctx.fillStyle = '#440000';
        ctx.fillRect(barX, barY, barW, barH);
        const hpColor = hpPct > 0.5 ? '#00ff00' : hpPct > 0.25 ? '#ffaa00' : '#ff0000';
        ctx.fillStyle = hpColor;
        ctx.fillRect(barX, barY, barW * hpPct, barH);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);
    }
}

// --- 防禦塔類別 ---
class Tower {
    constructor(c, r, type) {
        this.c = c;
        this.r = r;
        this.x = c * TILE_SIZE + TILE_SIZE / 2;
        this.y = r * TILE_SIZE + TILE_SIZE / 2;
        this.type = type;
        this.level = 1;
        const base = TOWER_TYPES[type];
        this.baseRange = base.range;
        this.baseDamage = base.damage;
        this.baseCooldown = base.cooldown;
        this.color = base.color;
        this.special = base.type;
        this.cooldownTimer = 0;
        this.angle = 0;
        this.spinUp = 0;
        this.maxSpin = 10;
        this.buffs = { range: 1, speed: 1 };
    }

    get range() {
        return this.baseRange * this.buffs.range;
    }

    getDamage() {
        let p = 10;
        switch (this.special) {
            case 'nuke':         p = 100; break;
            case 'cannon':       p = 25; break;
            case 'single':
                if (this.type === 'plasma') p = 50;
                else if (this.type === 'sniper') p = 30;
                break;
            case 'flame':        p = 1; break;
            case 'gatling':      p = 2; break;
            case 'multishot':    p = 5; break;
            case 'blackhole':    p = 2; break;
            case 'artillery':    p = 80; break;
            case 'pierce_heavy': p = 150; break;
            case 'orbital':      p = 50; break;
            case 'drone':        p = 15; break;
            case 'vampire':      p = 15; break;
            case 'greed':        p = 5; break;
            case 'chrono':       p = 2; break;
            case 'doom':         p = 1000; break;
        }
        return this.baseDamage + (this.level - 1) * p;
    }

    getCooldown() {
        if (this.special === 'eco') {
            return Math.max(ECO_MIN_COOLDOWN, this.baseCooldown - (this.level - 1) * ECO_COOLDOWN_REDUCTION);
        }
        if (this.special === 'radar') return 0;

        let red = 5;
        if (['nuke', 'cannon', 'blackhole', 'artillery', 'pierce_heavy', 'orbital', 'doom'].includes(this.special)) {
            red = 15;
        }
        if (this.special === 'gatling') {
            return 15 / this.buffs.speed;
        }
        let cd = Math.max(2, this.baseCooldown - (this.level - 1) * red);
        return Math.max(2, cd / this.buffs.speed);
    }

    upgrade() {
        if (this.level < getCurrentMaxLevel()) {
            this.level++;
            createExplosion(this.x, this.y, 15, '#ffd700');
            showToast(`合成成功! Lv.${this.level}`);
            soundManager.merge();
            return true;
        }
        return false;
    }

    update() {
        if (this.special === 'radar') return;
        if (this.cooldownTimer > 0) this.cooldownTimer--;

        // 經濟塔：產生金幣
        if (this.special === 'eco') {
            if (this.cooldownTimer <= 0) {
                const amount = ECO_BASE_INCOME + this.level * ECO_INCOME_PER_LEVEL;
                G.gameState.money += amount;
                G.floatingTexts.push(new FloatingText(this.x, this.y - 20, `+$${amount}`, '#ffd700'));
                soundManager.coin();
                this.cooldownTimer = this.getCooldown();
            }
            return;
        }

        // 尋找目標
        let targets = [];
        if (this.special === 'orbital' || this.special === 'chrono') {
            if (G.enemies.length > 0) {
                if (this.special === 'chrono') {
                    targets = G.enemies;
                } else {
                    targets.push(G.enemies[Math.floor(Math.random() * G.enemies.length)]);
                }
            }
        } else if (['tesla', 'nuke', 'cannon', 'blackhole', 'artillery', 'emp', 'doom'].includes(this.special)) {
            const limit = ['nuke', 'blackhole', 'emp', 'artillery', 'doom'].includes(this.special) ? 99 : 5;
            targets = G.enemies.filter(e =>
                Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2) <= this.range
            ).slice(0, limit);
        } else {
            let nearest = Infinity;
            let target = null;
            for (let e of G.enemies) {
                // 隱形偵測邏輯
                if (e.typeKey === 'stealth' && e.stealthPhase % Math.PI < Math.PI / 2 && ['sniper', 'plasma'].includes(this.type)) {
                    continue;
                }
                const d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                if (d <= this.range && d < nearest) {
                    nearest = d;
                    target = e;
                }
            }
            if (target) targets.push(target);
        }

        // 攻擊
        if (targets.length > 0) {
            if (targets[0]) {
                this.angle = Math.atan2(targets[0].y - this.y, targets[0].x - this.x);
            }
            if (this.special === 'gatling' && this.spinUp < this.maxSpin) {
                this.spinUp += 0.1;
            }
            if (this.cooldownTimer <= 0) {
                soundManager.shoot(this.type);
                if (['nuke', 'cannon', 'blackhole', 'artillery', 'orbital', 'doom'].includes(this.special)) {
                    this.shoot(targets[0]);
                } else if (this.special === 'chrono') {
                    this.shoot(null);
                } else {
                    targets.forEach(t => this.shoot(t));
                }
                this.cooldownTimer = this.special === 'gatling'
                    ? Math.max(2, (15 - Math.floor(this.spinUp) - (this.level * 0.5)) / this.buffs.speed)
                    : this.getCooldown();
            }
        } else {
            if (this.special === 'gatling' && this.spinUp > 0) this.spinUp -= 0.1;
        }
    }

    shoot(target) {
        const dmg = this.getDamage();

        if (this.special === 'tesla') {
            applyDamage(target, dmg);
            G.particles.push(new Lightning(this.x, this.y, target.x, target.y));
        } else if (this.special === 'multishot') {
            const baseA = Math.atan2(target.y - this.y, target.x - this.x);
            [-MULTISHOT_SPREAD, 0, MULTISHOT_SPREAD].forEach(offset =>
                G.projectiles.push(new Projectile(this.x, this.y, null, dmg, this.color, this.type, baseA + offset))
            );
        } else if (this.special === 'emp') {
            G.effects.push(new Shockwave(this.x, this.y, this.range, this.color));
            G.enemies.filter(e =>
                Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2) <= this.range
            ).forEach(e => {
                e.stunTimer = STUN_DURATION;
                applyDamage(e, dmg);
            });
        } else if (this.special === 'orbital') {
            G.effects.push(new OrbitalStrike(target.x, target.y, dmg));
        } else if (this.special === 'drone') {
            G.projectiles.push(new Projectile(this.x, this.y, target, dmg, this.color, 'drone'));
        } else if (this.special === 'chrono') {
            G.effects.push(new Shockwave(this.x, this.y, CHRONO_AOE_RANGE * DRAW_SCALE, this.color));
            G.enemies.forEach(e => {
                e.slowTimer = CHRONO_SLOW_DURATION;
                applyDamage(e, dmg);
            });
        } else {
            G.projectiles.push(new Projectile(this.x, this.y, target, dmg, this.color, this.type));
        }
    }

    draw() {
        const ctx = G.ctx;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(DRAW_SCALE, DRAW_SCALE);

        const displaySize = 64;
        const hs = displaySize / 2;

        // 選取狀態
        if (G.gameState.selectedTower === this) {
            ctx.beginPath();
            ctx.arc(0, 0, hs, 0, Math.PI * 2);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
            if (this.range > 0) {
                ctx.beginPath();
                ctx.arc(0, 0, this.range / DRAW_SCALE, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        // 高等級發光特效
        if (this.level >= 5) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.level > 5 ? '#ff00ff' : '#ffd700';
            ctx.strokeStyle = this.level > 5 ? '#ff00ff' : '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect(-hs, -hs, displaySize, displaySize);
            ctx.shadowBlur = 0;
        }

        // 雷達自我旋轉
        if (this.type === 'radar') {
            this.angle += RADAR_ROTATION_SPEED;
        }

        // 旋轉塔防影像
        ctx.rotate(this.angle);

        // 繪製貼圖（SpriteSheet 優先，SVG 備用）
        const frame = TowerGraphics.getSpriteFrame(this.type, this.cooldownTimer, this.getCooldown());
        if (frame && TowerGraphics.spriteSheet && TowerGraphics.spriteSheet.complete) {
            // SpriteSheet 內定炮口向下，補償旋轉偏移使炮口對準敵人
            ctx.rotate(-Math.PI / 2);
            ctx.drawImage(
                TowerGraphics.spriteSheet,
                frame.sx, frame.sy, frame.sw, frame.sh,
                -displaySize / 2, -displaySize / 2, displaySize, displaySize
            );
        } else {
            const img = TowerGraphics.cache[this.type];
            if (img && img.complete) {
                ctx.drawImage(img, -displaySize / 2, -displaySize / 2, displaySize, displaySize);
            }
        }

        ctx.restore();

        // 等級星星
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        let starStr;
        const currentMax = getCurrentMaxLevel();
        if (this.level >= currentMax) {
            starStr = '👑MAX';
            if (this.level > 5) starStr += `+${this.level - 5}`;
        } else {
            starStr = '★'.repeat(Math.min(5, this.level));
            if (this.level > 5) starStr += `+${this.level - 5}`;
        }
        if (this.buffs.speed > 1) starStr = '⚡' + starStr;
        ctx.fillText(starStr, this.x, this.y - hs - 8);
    }
}

// --- 投射物類別 ---
class Projectile {
    constructor(x, y, target, damage, color, towerType, angle) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.color = color;
        this.type = towerType;
        this.speed = (towerType === 'drone' ? 6 : 12) * DRAW_SCALE;
        this.hit = false;

        const special = TOWER_TYPES[towerType] ? TOWER_TYPES[towerType].type : 'single';
        this.isInstant = ['laser', 'pierce', 'pierce_heavy', 'flame', 'single'].includes(special)
            && (towerType === 'sniper' || towerType === 'prism' || towerType === 'laser'
                || towerType === 'railgun' || towerType === 'flame' || towerType === 'vampire'
                || towerType === 'doom');

        // 多重射擊（無目標，有角度）
        if (angle !== undefined && !target) {
            this.vx = Math.cos(angle) * this.speed;
            this.vy = Math.sin(angle) * this.speed;
            this.life = 60;
        }

        // 即時命中
        if (this.isInstant) {
            this.hitEnemy();
            this.hit = true;
            if (special === 'flame') {
                G.particles.push(new FlameBreath(x, y, target.x, target.y));
            } else {
                G.particles.push(new LaserBeam(x, y, target.x, target.y, color, special === 'pierce_heavy'));
            }
        }
    }

    update() {
        if (this.hit) return;

        // 多重射擊（無鎖定）
        if (this.vx !== undefined) {
            this.x += this.vx;
            this.y += this.vy;
            this.life--;
            if (this.life <= 0) this.hit = true;
            for (let e of G.enemies) {
                if (Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2) < e.radius + 5) {
                    this.target = e;
                    this.hitEnemy();
                    this.hit = true;
                    break;
                }
            }
            return;
        }

        const special = TOWER_TYPES[this.type] ? TOWER_TYPES[this.type].type : 'single';
        const isAOE = ['nuke', 'cannon', 'blackhole', 'artillery', 'doom'].includes(special);

        // 目標已消失
        if (!isAOE && !G.enemies.includes(this.target)) {
            this.hit = true;
            return;
        }
        if (isAOE && !G.enemies.includes(this.target)) {
            this.hit = true;
            this.explode(this.x, this.y);
            return;
        }

        // 追蹤目標
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.speed) {
            if (isAOE) this.explode(this.target.x, this.target.y);
            else this.hitEnemy();
            this.hit = true;
        } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    hitEnemy() {
        const special = TOWER_TYPES[this.type] ? TOWER_TYPES[this.type].type : 'single';

        // boss_armored 免疫控制效果
        if (this.target.typeKey === 'boss_armored') {
            applyDamage(this.target, this.damage);
            createExplosion(this.target.x, this.target.y, 3, this.color);
            this.applyPremiumEffects(this.target);
            return;
        }

        if (special === 'flame') {
            this.target.burnTimer = BURN_DURATION;
            this.target.burnDamage = this.damage;
            createExplosion(this.target.x, this.target.y, 1, '#ff4400');
        } else if (special === 'poison') {
            this.target.poisonTimer = POISON_DURATION;
            this.target.poisonDamage = this.damage;
            createExplosion(this.target.x, this.target.y, 2, '#00ff00');
        } else if (special === 'pierce' || special === 'pierce_heavy') {
            applyDamage(this.target, this.damage);
        } else {
            applyDamage(this.target, this.damage);
            if (special === 'slow') {
                this.target.slowTimer = TOWER_TYPES.ice.slowDuration;
                createExplosion(this.target.x, this.target.y, 3, '#00ffff');
            } else {
                createExplosion(this.target.x, this.target.y, 3, this.color);
            }
        }

        this.applyPremiumEffects(this.target);
    }

    applyPremiumEffects(e) {
        if (this.type === 'vampire' && e.hp <= 0) {
            G.gameState.lives += 1;
            G.floatingTexts.push(new FloatingText(e.x, e.y, '+1❤️', '#ff3333'));
            updateUI();
        } else if (this.type === 'greed') {
            G.gameState.money += GREED_BONUS_GOLD;
            G.floatingTexts.push(new FloatingText(e.x, e.y, `+$${GREED_BONUS_GOLD}`, '#ffd700'));
            soundManager.coin();
            updateUI();
        }
    }

    explode(centerX, centerY) {
        const special = TOWER_TYPES[this.type] ? TOWER_TYPES[this.type].type : 'single';

        if (special === 'blackhole') {
            G.effects.push(new GravityField(centerX, centerY, this.damage));
            return;
        }

        let blastRadius = 60 * DRAW_SCALE;
        if (special === 'nuke' || special === 'doom') blastRadius = 150 * DRAW_SCALE;
        if (special === 'artillery') blastRadius = 100 * DRAW_SCALE;

        createExplosion(centerX, centerY, (special === 'nuke' || special === 'doom') ? 30 : 10, this.color);
        G.particles.push(new Shockwave(centerX, centerY, blastRadius, this.color));
        soundManager.explosion();

        G.enemies.forEach(e => {
            if (Math.sqrt((e.x - centerX) ** 2 + (e.y - centerY) ** 2) <= blastRadius) {
                applyDamage(e, this.damage);
                this.applyPremiumEffects(e);
            }
        });
    }

    draw() {
        if (this.hit) return;
        const ctx = G.ctx;
        ctx.fillStyle = this.color;
        const special = TOWER_TYPES[this.type] ? TOWER_TYPES[this.type].type : 'single';

        if (['nuke', 'cannon', 'blackhole', 'artillery', 'doom'].includes(special)) {
            const size = (special === 'nuke' || special === 'doom' ? 6 : 5) * DRAW_SCALE;
            ctx.beginPath();
            ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
            ctx.fill();
            if (special !== 'blackhole') {
                G.particles.push(new Particle(this.x, this.y, '#555'));
            }
        } else if (special === 'drone') {
            ctx.beginPath();
            ctx.moveTo(this.x + 5, this.y);
            ctx.lineTo(this.x - 5, this.y + 5);
            ctx.lineTo(this.x - 5, this.y - 5);
            ctx.fill();
        } else if (special === 'vampire') {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - 4 * DRAW_SCALE);
            ctx.lineTo(this.x + 4 * DRAW_SCALE, this.y);
            ctx.lineTo(this.x, this.y + 4 * DRAW_SCALE);
            ctx.lineTo(this.x - 4 * DRAW_SCALE, this.y);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4 * DRAW_SCALE, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
