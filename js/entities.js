// ────────────────────────────────────────────────────────────
// BUG
// Timers (slowUntil/frozenUntil) are in game-seconds so pause
// and speed changes behave correctly.
// ────────────────────────────────────────────────────────────
class Bug {
  constructor(type, hpScale = 1, rewardScale = 1) {
    const d = BUG_DEF[type];
    this.type = type;
    this.maxHp = Math.round(d.hp * hpScale);
    this.hp = this.maxHp;
    this.speed = d.speed; this.color = d.color; this.size = d.size;
    this.reward = Math.round(d.reward * rewardScale);
    this.label = d.label || '';
    this.segIdx = 0; this.segT = 0;
    this.x = PATH_PX[0].x; this.y = PATH_PX[0].y;
    this.dead = false; this.reached = false;
    this.killed = false;              // died to damage (not by leaking into prod)
    this.wobble = Math.random() * Math.PI * 2;
    this.slowUntil = 0;
    this.frozenUntil = 0;
    this.regen = d.regen || 0;
    this.splitSpawn = d.splits || false;
    this.immuneTo = d.immuneTo || [];
  }

  progress() {
    return (this.segIdx + this.segT) / (PATH_PX.length - 1);
  }

  update(dt) {
    if (this.dead || this.reached) return;
    this.wobble += dt * 3.5;
    if (this.regen && this.hp > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.regen * dt);
    }
    const isFrozen = state.now < this.frozenUntil;
    const isSlowed = !isFrozen && state.now < this.slowUntil;
    const spd = isFrozen ? 0 : isSlowed ? this.speed * 0.45 : this.speed;
    let rem = spd * dt;
    while (rem > 0 && this.segIdx < PATH_PX.length - 1) {
      const a = PATH_PX[this.segIdx], b = PATH_PX[this.segIdx + 1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.sqrt(dx*dx + dy*dy);
      const segRem = len * (1 - this.segT);
      if (rem >= segRem) {
        rem -= segRem;
        this.segIdx++;
        this.segT = 0;
      } else {
        this.segT += rem / len;
        rem = 0;
      }
    }
    if (this.segIdx >= PATH_PX.length - 1) { this.reached = true; return; }
    const a = PATH_PX[this.segIdx], b = PATH_PX[this.segIdx + 1];
    this.x = a.x + (b.x - a.x) * this.segT;
    this.y = a.y + (b.y - a.y) * this.segT;
  }

  draw(ctx) {
    if (this.dead) return;
    const wx = Math.sin(this.wobble) * 1.5;
    const wy = Math.cos(this.wobble * 0.8) * 1.5;
    const px = this.x + wx, py = this.y + wy;

    if (this.type === 'boss') {
      ctx.shadowColor = '#ea580c'; ctx.shadowBlur = 18;
    } else if (this.type === 'megaboss') {
      const pulse = (Math.sin(state.now * 6) + 1) * 0.5;
      ctx.shadowColor = '#7c3aed'; ctx.shadowBlur = 20 + pulse * 25;
    }

    if (state.now < this.frozenUntil) {
      ctx.beginPath(); ctx.arc(px, py, this.size + 5, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(14,165,233,0.18)'; ctx.fill();
      ctx.strokeStyle = 'rgba(125,211,252,0.9)'; ctx.lineWidth = 2.5; ctx.stroke();
    } else if (state.now < this.slowUntil) {
      ctx.beginPath(); ctx.arc(px, py, this.size + 4, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(34,211,238,0.8)'; ctx.lineWidth = 2; ctx.stroke();
    }

    // regen aura for memory leaks
    if (this.regen && this.hp < this.maxHp) {
      ctx.beginPath(); ctx.arc(px, py, this.size + 3 + Math.sin(state.now * 5) * 1.5, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(234,179,8,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
    }

    // shadow
    ctx.beginPath(); ctx.arc(px + 2, py + 2, this.size, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();

    // body
    ctx.beginPath(); ctx.arc(px, py, this.size, 0, Math.PI*2);
    ctx.fillStyle = this.color; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.shadowBlur = 0;

    // eyes
    if (this.size >= 10) {
      const eo = this.size * 0.32;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath(); ctx.arc(px - eo, py - eo*0.6, 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(px + eo, py - eo*0.6, 2, 0, Math.PI*2); ctx.fill();
    }

    // label
    if (this.label) {
      const fs = this.size > 12 ? 9 : 7;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = `bold ${fs}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const labelY = this.size >= 10 ? py + this.size * 0.25 : py;
      ctx.fillText(this.label, px, labelY);
    }

    // hp bar
    if (this.hp < this.maxHp) {
      const bw = this.size * 2.6, bh = 3;
      const bx = px - bw/2, by = py - this.size - 8;
      ctx.fillStyle = '#1e293b'; ctx.fillRect(bx, by, bw, bh);
      const pct = this.hp / this.maxHp;
      ctx.fillStyle = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#fbbf24' : '#ef4444';
      ctx.fillRect(bx, by, bw * pct, bh);
    }
  }
}

// ────────────────────────────────────────────────────────────
// TOWER
// ────────────────────────────────────────────────────────────
class Tower {
  constructor(col, row, type) {
    this.col = col; this.row = row;
    this.x = col*CELL + CELL/2; this.y = row*CELL + CELL/2;
    this.type = type;
    const d = TOWER_DEF[type];
    this.name = d.name; this.color = d.color; this.icon = d.icon;
    this.range = d.range; this.fireRate = d.fireRate;
    this.dmg = { ...d.dmg };
    this.pColor = d.pColor; this.flakyRate = d.flakyRate;
    this.retry = d.retry || false; this.multishot = d.multishot || 0;
    this.freeze = d.freeze || 0; this.splash = d.splash || 0; this.slow = d.slow || 0;
    this.level = 1; this.baseCost = d.cost; this.totalSpent = d.cost;
    this.flakiness = 0; this.lastFired = -999; this.kills = 0; this.pulse = 0;
    this.targetMode = 0;   // index into TARGET_MODES
  }

  pickTargets(inRange) {
    const mode = TARGET_MODES[this.targetMode];
    inRange.sort((a, b) => {
      switch (mode) {
        case 'LAST':   return a.progress() - b.progress();
        case 'STRONG': return b.hp - a.hp;
        case 'WEAK':   return a.hp - b.hp;
        default:       return b.progress() - a.progress();   // FIRST
      }
    });
    return this.multishot ? inRange.slice(0, this.multishot) : [inRange[0]];
  }

  update(dt, bugs) {
    if (this.pulse > 0) this.pulse = Math.max(0, this.pulse - dt * 6);
    this.flakiness = Math.min(95, this.flakiness + this.flakyRate * dt * 0.08);
    const hasAlly = state.towers.some(t =>
      t !== this && Math.abs(t.col - this.col) <= 1 && Math.abs(t.row - this.row) <= 1);
    const effectiveRate = (this.fireRate * (hasAlly ? 0.85 : 1.0)) / 1000;
    if (state.now - this.lastFired < effectiveRate) return;
    const inRange = bugs.filter(b => {
      if (b.dead || b.reached) return false;
      const dx = b.x - this.x, dy = b.y - this.y;
      return dx*dx + dy*dy <= this.range * this.range;
    });
    if (!inRange.length) return;
    this.lastFired = state.now;
    this.pulse = 1;
    if (Math.random() * 100 < this.flakiness) {
      if (this.retry && Math.random() < 0.5) {
        spawnText(this.x, this.y, '#69d3a7', 'RETRY');
      } else {
        spawnText(this.x, this.y, '#6b7280', 'MISS');
        return;
      }
    }
    SFX.shoot(this.type);
    for (const target of this.pickTargets(inRange)) {
      state.projectiles.push(new Projectile(this, target));
    }
  }

  draw(ctx, hovered, selected) {
    const s = CELL * 0.36;
    if (hovered || selected) {
      ctx.beginPath(); ctx.arc(this.x, this.y, this.range, 0, Math.PI*2);
      ctx.fillStyle = `rgba(${hexRgb(this.color)},${selected ? 0.05 : 0.03})`; ctx.fill();
      ctx.strokeStyle = `rgba(${hexRgb(this.color)},${selected ? 0.45 : 0.2})`;
      ctx.lineWidth = selected ? 1.5 : 1; ctx.stroke();
    }
    if (selected) {
      const sg = s + 5;
      ctx.strokeStyle = `rgba(${hexRgb(this.color)},0.7)`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.rect(this.x - sg, this.y - sg, sg*2, sg*2); ctx.stroke();
    }
    if (this.pulse > 0) {
      ctx.beginPath(); ctx.arc(this.x, this.y, s + this.pulse * 18, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(${hexRgb(this.color)},${this.pulse * 0.5})`; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.fillStyle = '#111827';
    ctx.strokeStyle = selected ? '#ffffff' : this.color; ctx.lineWidth = selected ? 2.5 : 2;
    ctx.beginPath(); ctx.rect(this.x - s, this.y - s, s*2, s*2); ctx.fill(); ctx.stroke();
    if (this.icon === 'Se') {
      ctx.fillStyle = this.color;
      ctx.font = `bold ${Math.round(s * 0.85)}px monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(this.icon, this.x, this.y + 1);
    } else {
      ctx.font = `${Math.round(s * 1.35)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(this.icon, this.x, this.y + 2);
    }
    if (this.level > 1) {
      ctx.fillStyle = this.level === 3 ? '#fbbf24' : '#60a5fa';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillText(`L${this.level}`, this.x + s - 1, this.y - s + 1);
    }
    if (this.flakiness > 10) {
      const bw = CELL * 0.7, bh = 3;
      const bx = this.x - bw/2, by = this.y + s + 3;
      ctx.fillStyle = '#1e293b'; ctx.fillRect(bx, by, bw, bh);
      const fc = this.flakiness > 70 ? '#ef4444' : this.flakiness > 40 ? '#f59e0b' : '#22c55e';
      ctx.fillStyle = fc; ctx.fillRect(bx, by, bw * (1 - this.flakiness/100), bh);
    }
  }
}

// ────────────────────────────────────────────────────────────
// PROJECTILE
// ────────────────────────────────────────────────────────────
class Projectile {
  constructor(tower, target) {
    this.tower = tower;
    this.towerType = tower.type;
    this.x = tower.x; this.y = tower.y;
    this.target = target;
    this.dmg = tower.dmg[target.type] || 0;
    this.dmgObj = tower.dmg;
    this.color = tower.pColor;
    this.slow = tower.slow;        // seconds
    this.freeze = tower.freeze;    // seconds
    this.splash = tower.splash;    // px radius
    this.speed = 360; this.dead = false;
  }

  update(dt) {
    if (this.dead || this.target.dead || this.target.reached) { this.dead = true; return; }
    const dx = this.target.x - this.x, dy = this.target.y - this.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 10) {
      this.dead = true;
      if (this.target.immuneTo.includes(this.towerType)) {
        spawnText(this.target.x, this.target.y, '#0f766e', 'IMMUNE');
        return;
      }
      // idempotency: 25% chance to spawn a duplicate and consume the projectile
      if (this.target.type === 'idempotency' && Math.random() < 0.25 &&
          state.bugs.filter(b => !b.dead && b.type === 'idempotency').length < 10) {
        const dup = new Bug('idempotency');
        dup.segIdx = this.target.segIdx; dup.segT = this.target.segT;
        dup.x = this.target.x; dup.y = this.target.y;
        dup.hp = this.target.hp; dup.maxHp = this.target.maxHp;
        dup.reward = this.target.reward;
        state.bugs.push(dup);
        spawnText(this.target.x, this.target.y, '#7e22ce', '2x DUPE!');
        return;
      }
      if (this.freeze > 0) this.target.frozenUntil = Math.max(this.target.frozenUntil, state.now + this.freeze);
      else if (this.slow > 0) this.target.slowUntil = Math.max(this.target.slowUntil, state.now + this.slow);
      this.target.hp -= this.dmg;
      if (this.splash > 0) spawnSplash(this.x, this.y, this.splash, this.dmgObj, this.color, this.tower, this.target);
      if (this.target.hp <= 0) killBug(this.target, this.tower, true);
      return;
    }
    const s = this.speed * dt;
    this.x += (dx/dist) * s; this.y += (dy/dist) * s;
  }

  draw(ctx) {
    ctx.shadowColor = this.color; ctx.shadowBlur = 7;
    ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI*2);
    ctx.fillStyle = this.color; ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// credit a kill: reward, shift-left score multiplier, particles
function killBug(bug, tower, showText) {
  if (bug.dead) return;
  bug.dead = true;
  bug.killed = true;
  if (tower) tower.kills++;
  state.budget += bug.reward;
  const p = bug.progress();
  const mult = p < 0.33 ? 10 : p < 0.66 ? 3 : 1;
  const pts = bug.reward * mult;
  state.score += pts;
  if (showText) {
    if (mult > 1) spawnText(bug.x, bug.y, '#22c55e', `+${pts} x${mult}`);
    else spawnText(bug.x, bug.y, '#64748b', `+${pts}`);
  }
  spawnBurst(bug.x, bug.y, bug.color);
  SFX.kill();
}

// ────────────────────────────────────────────────────────────
// PARTICLES
// ────────────────────────────────────────────────────────────
class TextParticle {
  constructor(x, y, color, text) {
    this.x = x; this.y = y; this.color = color; this.text = text;
    this.life = 1; this.vy = -55;
  }
  update(dt) { this.y += this.vy * dt; this.life -= dt * 1.6; }
  draw(ctx) {
    if (this.life <= 0) return;
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color; ctx.font = 'bold 11px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(this.text, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}

class DotParticle {
  constructor(x, y, color) {
    this.x = x; this.y = y; this.color = color;
    this.vx = (Math.random() - 0.5) * 90; this.vy = (Math.random() - 0.5) * 90;
    this.size = 2 + Math.random() * 3; this.life = 1;
  }
  update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt * 2.2; }
  draw(ctx) {
    if (this.life <= 0) return;
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
    ctx.fillStyle = this.color; ctx.fill();
    ctx.globalAlpha = 1;
  }
}

class SplashParticle {
  constructor(x, y, maxR, color) {
    this.x = x; this.y = y; this.maxR = maxR; this.color = color;
    this.r = 4; this.life = 1;
  }
  update(dt) {
    this.r = Math.min(this.maxR, this.r + (this.maxR / 0.28) * dt);
    this.life -= dt / 0.28;
  }
  draw(ctx) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life * 0.65);
    ctx.strokeStyle = this.color; ctx.lineWidth = 2.5;
    ctx.shadowColor = this.color; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }
}

function spawnText(x, y, color, text) { state.particles.push(new TextParticle(x, y, color, text)); }
function spawnBurst(x, y, color) { for (let i = 0; i < 5; i++) state.particles.push(new DotParticle(x, y, color)); }

function spawnSplash(x, y, radius, dmgObj, color, tower, exclude) {
  state.particles.push(new SplashParticle(x, y, radius, color));
  for (const bug of state.bugs) {
    if (bug === exclude || bug.dead || bug.reached) continue;
    const dx = bug.x - x, dy = bug.y - y;
    if (dx*dx + dy*dy <= radius * radius) {
      bug.hp -= (dmgObj[bug.type] || 0) * 0.45;
      if (bug.hp <= 0) killBug(bug, tower, false);
    }
  }
}
