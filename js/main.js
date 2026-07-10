// ────────────────────────────────────────────────────────────
// STATE
// ────────────────────────────────────────────────────────────
let canvas, ctx;
let PATH_PX = [];
let PATH_CELLS = new Set();
let WAVE_DEFS = [];
let CURRENT_LEVEL = null;

const SPEEDS = [1, 2, 4];
const TRIAGE_COST = 200;

let state = {
  budget:0, score:0, lives:0, wave:0, cleared:0, now:0,
  speedIdx:0, paused:false, autoWave:false, autoWaveAt:null,
  endless:false, placing:null, waveActive:false, gameOver:false, gameWon:false,
  towers:[], bugs:[], projectiles:[], particles:[],
  spawnQueue:[], spawnTimer:0, spawnGap:1000, hpScale:1, rewardScale:1,
  hoveredCell:null, screenFlash:0, shake:0, selectedTower:null, banner:null
};

function initState() {
  state = {
    budget: CURRENT_LEVEL.budget,
    score: 0,
    lives: CURRENT_LEVEL.lives,
    wave: 0,          // waves started
    cleared: 0,       // waves fully cleared
    now: 0,           // game-time in seconds (respects pause/speed)
    speedIdx: state.speedIdx || 0,
    paused: false,
    autoWave: loadPref('pd_autowave') === '1',
    autoWaveAt: null,
    endless: false,
    placing: null, waveActive: false, gameOver: false, gameWon: false,
    towers: [], bugs: [], projectiles: [], particles: [],
    spawnQueue: [], spawnTimer: 0, spawnGap: 1000, hpScale: 1, rewardScale: 1,
    hoveredCell: null, screenFlash: 0, shake: 0, selectedTower: null, banner: null
  };
}

function loadPref(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function savePref(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

// ────────────────────────────────────────────────────────────
// BEST SCORES (per level, localStorage)
// ────────────────────────────────────────────────────────────
function loadBests() {
  try { return JSON.parse(localStorage.getItem('pd_best') || '{}'); } catch (e) { return {}; }
}

function recordBest(won) {
  if (!CURRENT_LEVEL) return;
  const bests = loadBests();
  const cur = bests[CURRENT_LEVEL.id] || { score: 0, won: false, wave: 0 };
  bests[CURRENT_LEVEL.id] = {
    score: Math.max(cur.score, state.score),
    won: cur.won || won,
    wave: Math.max(cur.wave, state.cleared)
  };
  savePref('pd_best', JSON.stringify(bests));
}

// ────────────────────────────────────────────────────────────
// LEVEL SELECT
// ────────────────────────────────────────────────────────────
function renderLevelCards() {
  const bests = loadBests();
  const wrap = document.getElementById('level-cards');
  wrap.innerHTML = LEVELS.map(lv => {
    const b = bests[lv.id];
    const best = b && b.score > 0
      ? `Best: ${b.score.toLocaleString()}${b.won ? ' <span class="lc-won">✔ CLEARED</span>' : ''}`
      : 'Not attempted';
    return `
      <div class="level-card" style="border-color:${lv.theme}" onclick="chooseLevel(${lv.id})">
        <div class="lc-name" style="color:${lv.theme}">${lv.name}</div>
        <div class="lc-sub">${lv.subtitle}</div>
        <div class="lc-stats">Budget: $${lv.budget} &middot; Lives: ${lv.lives}<br>
          Waves: ${lv.waves.length}<br>Difficulty: ${lv.difficulty}</div>
        <div class="lc-best">${best}</div>
      </div>`;
  }).join('');
}

function chooseLevel(idx) {
  CURRENT_LEVEL = LEVELS[idx];
  PATH_PX = buildPathPx(CURRENT_LEVEL.rawPath);
  PATH_CELLS = buildPathCells(CURRENT_LEVEL.rawPath);
  WAVE_DEFS = CURRENT_LEVEL.waves;
  document.getElementById('level-select').classList.remove('show');
  initState();
  hideTowerInfo();
  document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
  updateUI();
  setMsg(`${CURRENT_LEVEL.name}: Place test layers on the grid, then send the first wave. [Space] sends waves.`);
}

function showLevelSelect() {
  renderLevelCards();
  document.getElementById('level-select').classList.add('show');
}

function goLevelSelect() {
  document.getElementById('overlay').classList.remove('show');
  showLevelSelect();
}

// ────────────────────────────────────────────────────────────
// WAVES
// ────────────────────────────────────────────────────────────
function hasNextWave() {
  return state.endless || state.wave < WAVE_DEFS.length;
}

function nextWaveDef() {
  if (state.wave < WAVE_DEFS.length) {
    return { ...WAVE_DEFS[state.wave], hpScale: 1, rewardScale: 1 };
  }
  return genEndlessWave(state.wave - WAVE_DEFS.length + 1);
}

function canSendWave() {
  return CURRENT_LEVEL && !state.gameOver && !state.gameWon
    && !state.waveActive && hasNextWave();
}

function startWave() {
  if (!canSendWave()) return;
  const early = state.bugs.length > 0;
  const def = nextWaveDef();
  state.spawnQueue = [...def.bugs];
  state.spawnGap = def.ms;
  state.hpScale = def.hpScale || 1;
  state.rewardScale = def.rewardScale || 1;
  state.spawnTimer = 0;
  state.waveActive = true;
  state.wave++;
  state.autoWaveAt = null;
  if (early) {
    const bonus = 40 + state.wave * 8;
    state.budget += bonus;
    spawnText(W/2, 44, '#fbbf24', `EARLY WAVE +$${bonus}`);
  }
  showBanner(state.endless && state.wave > WAVE_DEFS.length
    ? `OVERTIME ${state.wave - WAVE_DEFS.length}`
    : `WAVE ${state.wave} / ${WAVE_DEFS.length}`);
  SFX.wave();
  setMsg(`Wave ${state.wave}: ${state.spawnQueue.length} bugs incoming.`);
  updateUI();
}

function awardClearBonus(waveNum) {
  const bonus = waveNum <= WAVE_DEFS.length
    ? CURRENT_LEVEL.waveBonusBase + waveNum * CURRENT_LEVEL.waveBonusPer
    : 100 + (waveNum - WAVE_DEFS.length) * 12;
  state.budget += bonus;
  return bonus;
}

// ────────────────────────────────────────────────────────────
// ACTIONS
// ────────────────────────────────────────────────────────────
function selectTower(type) {
  if (!CURRENT_LEVEL || state.gameOver || state.gameWon) return;
  const cost = TOWER_DEF[type].cost;
  if (state.budget < cost) { setMsg(`Need $${cost} for ${TOWER_DEF[type].name}. Have $${Math.floor(state.budget)}.`); return; }
  state.placing = state.placing === type ? null : type;
  state.selectedTower = null; hideTowerInfo();
  document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
  if (state.placing) {
    document.getElementById(`btn-${type}`).classList.add('selected');
    setMsg(`Click grid to place ${TOWER_DEF[type].name} ($${cost}). Right-click or ESC to cancel.`);
  } else { setMsg('Placement cancelled.'); }
}

function placeTower(col, row) {
  if (!state.placing) return;
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
  const key = `${col},${row}`;
  if (PATH_CELLS.has(key)) { setMsg('Cannot place on the pipeline path.'); return; }
  if (state.towers.some(t => t.col === col && t.row === row)) { setMsg('Cell occupied.'); return; }
  const cost = TOWER_DEF[state.placing].cost;
  if (state.budget < cost) { setMsg('Not enough budget.'); return; }
  state.budget -= cost;
  state.towers.push(new Tower(col, row, state.placing));
  SFX.place();
  setMsg(`${TOWER_DEF[state.placing].name} placed.`);
  if (state.budget < cost) {
    state.placing = null;
    document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
  }
  updateUI();
}

function runTriage() {
  if (!CURRENT_LEVEL || state.gameOver || state.gameWon) return;
  if (state.budget < TRIAGE_COST) { setMsg(`AI Triage costs $${TRIAGE_COST}. Not enough budget.`); return; }
  state.budget -= TRIAGE_COST;
  state.towers.forEach(t => { t.flakiness = Math.max(0, t.flakiness - 60); });
  spawnText(W/2, H/2 - 30, '#a855f7', 'AI TRIAGE: TESTS STABILIZED');
  SFX.triage();
  setMsg('AI Triage complete. All tests repaired.');
  updateUI();
}

function selectPlacedTower(col, row) {
  const t = state.towers.find(t => t.col === col && t.row === row);
  if (state.selectedTower === t) { state.selectedTower = null; hideTowerInfo(); }
  else {
    state.selectedTower = t || null;
    if (state.selectedTower) showTowerInfo(state.selectedTower);
    else hideTowerInfo();
  }
}

function upgradeCost(t) {
  return t.level === 1 ? Math.round(t.baseCost * 0.75) : Math.round(t.baseCost * 1.2);
}

function showTowerInfo(t) {
  document.getElementById('tower-divider').style.display = 'block';
  document.getElementById('tower-info').style.display = 'block';
  const nameEl = document.getElementById('ti-name');
  nameEl.textContent = t.name;
  nameEl.style.color = t.color;
  const stars = '★'.repeat(t.level) + '☆'.repeat(3 - t.level);
  document.getElementById('ti-level').textContent = `Level ${t.level}  ${stars}`;
  const strengths = Object.entries(t.dmg)
    .filter(([k]) => k !== 'boss' && k !== 'megaboss')
    .sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([k, v]) => `${BUG_DEF[k].label || k} ${v}`).join(' · ');
  document.getElementById('ti-stats').innerHTML =
    `Range: ${t.range} · Rate: ${t.fireRate}ms<br>` +
    `Kills: ${t.kills} · Flaky: ${Math.round(t.flakiness)}%<br>` +
    `Strong vs: ${strengths}`;
  document.getElementById('ti-target-btn').textContent = `TARGET: ${TARGET_MODES[t.targetMode]}`;
  const upBtn = document.getElementById('ti-upgrade-btn');
  if (t.level < 3) {
    upBtn.textContent = `UPGRADE LV${t.level + 1}  ($${upgradeCost(t)})`;
    upBtn.disabled = state.budget < upgradeCost(t);
  } else {
    upBtn.textContent = 'MAX LEVEL';
    upBtn.disabled = true;
  }
  document.getElementById('ti-sell-btn').textContent = `SELL  (+$${Math.floor(t.totalSpent * 0.5)})`;
}

function hideTowerInfo() {
  document.getElementById('tower-divider').style.display = 'none';
  document.getElementById('tower-info').style.display = 'none';
}

function cycleTargetMode() {
  const t = state.selectedTower; if (!t) return;
  t.targetMode = (t.targetMode + 1) % TARGET_MODES.length;
  SFX.ui();
  showTowerInfo(t);
}

function upgradeTower() {
  const t = state.selectedTower; if (!t || t.level >= 3) return;
  const cost = upgradeCost(t);
  if (state.budget < cost) { setMsg(`Need $${cost} to upgrade.`); return; }
  state.budget -= cost; t.totalSpent += cost; t.level++;
  for (const bt of Object.keys(t.dmg)) t.dmg[bt] = Math.round(t.dmg[bt] * 1.4);
  t.range = Math.round(t.range * 1.1);
  t.fireRate = Math.round(t.fireRate * 0.82);
  t.flakiness = Math.max(0, t.flakiness - 20);
  spawnText(t.x, t.y - 12, '#fbbf24', `LV${t.level}`);
  SFX.upgrade();
  showTowerInfo(t); updateUI();
}

function sellTower() {
  const t = state.selectedTower; if (!t) return;
  const refund = Math.floor(t.totalSpent * 0.5);
  state.budget += refund;
  state.towers = state.towers.filter(x => x !== t);
  state.selectedTower = null; hideTowerInfo();
  spawnText(t.x, t.y, '#ef4444', `+$${refund}`);
  SFX.sell();
  updateUI();
}

// ────────────────────────────────────────────────────────────
// TOOLBAR
// ────────────────────────────────────────────────────────────
function togglePause() {
  if (!CURRENT_LEVEL || state.gameOver || state.gameWon) return;
  state.paused = !state.paused;
  SFX.ui();
  updateUI();
}

function cycleSpeed() {
  state.speedIdx = (state.speedIdx + 1) % SPEEDS.length;
  SFX.ui();
  updateUI();
}

function toggleMute() {
  SFX.toggle();
  SFX.ui();
  updateUI();
}

function toggleAutoWave() {
  state.autoWave = !state.autoWave;
  savePref('pd_autowave', state.autoWave ? '1' : '0');
  if (!state.autoWave) state.autoWaveAt = null;
  SFX.ui();
  updateUI();
}

// ────────────────────────────────────────────────────────────
// UI
// ────────────────────────────────────────────────────────────
function setMsg(m) { document.getElementById('msg-bar').textContent = m; }

function showBanner(text) { state.banner = { text, life: 2 }; }

let lastPreviewKey = null;
function renderWavePreview() {
  const key = CURRENT_LEVEL ? `${CURRENT_LEVEL.id}|${state.wave}|${state.endless}|${state.gameWon}` : 'none';
  if (key === lastPreviewKey) return;
  lastPreviewKey = key;
  const el = document.getElementById('wave-preview');
  if (!CURRENT_LEVEL || state.gameWon || !hasNextWave()) {
    el.innerHTML = '<span class="pv-none">—</span>';
    return;
  }
  const def = nextWaveDef();
  const counts = {};
  for (const b of def.bugs) counts[b] = (counts[b] || 0) + 1;
  el.innerHTML = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, n]) => {
      const d = BUG_DEF[type];
      const label = d.label || (type === 'boss' ? 'BOSS' : 'MEGA');
      return `<span class="pv-chip"><i style="background:${d.color}"></i>${label}×${n}</span>`;
    }).join('');
}

function updateUI() {
  document.getElementById('s-budget').textContent = `$${Math.floor(state.budget)}`;
  document.getElementById('s-score').textContent = state.score.toLocaleString();
  document.getElementById('s-lives').textContent = state.lives;
  document.getElementById('s-wave').textContent = state.endless
    ? `${state.wave} (∞)` : `${state.wave} / ${WAVE_DEFS.length}`;
  document.getElementById('s-bugs').textContent =
    state.bugs.filter(b => !b.dead && !b.reached).length + state.spawnQueue.length;

  Object.keys(TOWER_DEF).forEach(t => {
    const b = document.getElementById(`btn-${t}`);
    if (b) b.classList.toggle('cant-afford', state.budget < TOWER_DEF[t].cost);
  });
  document.getElementById('triage-btn').disabled = state.budget < TRIAGE_COST;

  // wave button
  const wb = document.getElementById('wave-btn');
  if (!CURRENT_LEVEL || state.gameOver || state.gameWon) {
    wb.disabled = true; wb.textContent = '▶ SEND WAVE';
  } else if (state.waveActive) {
    wb.disabled = true; wb.textContent = 'WAVE INCOMING…';
  } else if (!hasNextWave()) {
    wb.disabled = true; wb.textContent = 'FINAL WAVE ACTIVE';
  } else if (state.bugs.length > 0) {
    wb.disabled = false; wb.textContent = `⏩ EARLY WAVE (+$${40 + (state.wave + 1) * 8})`;
  } else if (state.autoWaveAt != null) {
    wb.disabled = false;
    wb.textContent = `▶ AUTO IN ${Math.max(0, Math.ceil(state.autoWaveAt - state.now))}s`;
  } else {
    wb.disabled = false; wb.textContent = '▶ SEND WAVE';
  }

  // toolbar
  document.getElementById('btn-pause').textContent = state.paused ? '▶ RESUME' : '⏸ PAUSE';
  document.getElementById('btn-pause').classList.toggle('tb-on', state.paused);
  document.getElementById('btn-speed').textContent = `${SPEEDS[state.speedIdx]}× SPEED`;
  document.getElementById('btn-sound').textContent = SFX.muted ? '🔇 SOUND' : '🔊 SOUND';
  document.getElementById('btn-auto').textContent = `AUTO-WAVE: ${state.autoWave ? 'ON' : 'OFF'}`;
  document.getElementById('btn-auto').classList.toggle('tb-on', state.autoWave);

  renderWavePreview();
  if (state.selectedTower) showTowerInfo(state.selectedTower);
}

// ────────────────────────────────────────────────────────────
// LEADERBOARD (local)
// ────────────────────────────────────────────────────────────
function loadScores() {
  try { return JSON.parse(localStorage.getItem('pd_scores') || '[]'); } catch (e) { return []; }
}

function submitScore(name, score, level) {
  const entry = { name, score, level, date: new Date().toISOString().slice(0, 10) };
  const scores = loadScores();
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  scores.splice(10);
  savePref('pd_scores', JSON.stringify(scores));
  return scores;
}

function renderLeaderboard(scores, highlightScore) {
  const el = document.getElementById('o-leaderboard');
  if (!scores.length) {
    el.innerHTML = '<div style="color:#4b5563;font-size:0.7rem;text-align:center">No scores yet. Be first!</div>';
    return;
  }
  const rows = scores.map((s, i) => {
    const hl = highlightScore !== null && s.score === highlightScore ? ' class="lb-highlight"' : '';
    return `<tr${hl}><td>${i + 1}</td><td>${escapeHtml(s.name)}</td><td>${s.score}</td><td>${escapeHtml(s.level || '')}</td><td>${escapeHtml(s.date || '')}</td></tr>`;
  }).join('');
  el.innerHTML = `<table><thead><tr><th>#</th><th>Name</th><th>Score</th><th>Level</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function saveScore() {
  const name = (document.getElementById('o-name').value || 'Anonymous').trim() || 'Anonymous';
  document.getElementById('o-save-btn').disabled = true;
  document.getElementById('o-save-btn').textContent = 'Saved!';
  const overtime = state.cleared - WAVE_DEFS.length;
  const levelLabel = CURRENT_LEVEL
    ? CURRENT_LEVEL.name + (overtime > 0 ? ` +${overtime}` : '') : '';
  renderLeaderboard(submitScore(name, state.score, levelLabel), state.score);
}

// ────────────────────────────────────────────────────────────
// GAME LOOP
// ────────────────────────────────────────────────────────────
let lastTs = 0;

function tick(ts) {
  const dt = Math.min((ts - lastTs) / 1000, 0.05);
  lastTs = ts;
  if (CURRENT_LEVEL && !state.gameOver && !state.gameWon && !state.paused) {
    // integer substeps keep collision/hit checks stable at high speed
    for (let i = 0; i < SPEEDS[state.speedIdx]; i++) update(dt);
  }
  render();
  requestAnimationFrame(tick);
}

function update(dt) {
  state.now += dt;

  // spawning
  if (state.waveActive) {
    if (state.spawnQueue.length > 0) {
      state.spawnTimer -= dt * 1000;
      if (state.spawnTimer <= 0) {
        state.bugs.push(new Bug(state.spawnQueue.shift(), state.hpScale, state.rewardScale));
        state.spawnTimer = state.spawnGap;
      }
    }
    if (state.spawnQueue.length === 0) state.waveActive = false;   // allows early next wave
  }

  for (const t of state.towers) t.update(dt, state.bugs);

  for (const b of state.bugs) {
    b.update(dt);
    if (b.reached && !b.dead) {
      b.dead = true;
      state.lives--;
      state.screenFlash = 0.6;
      state.shake = 7;
      SFX.leak();
      setMsg(`BUG REACHED PRODUCTION! ${state.lives} live${state.lives !== 1 ? 's' : ''} remaining.`);
      if (state.lives <= 0) { state.gameOver = true; showOverlay(false); return; }
    }
  }

  for (const p of state.projectiles) p.update(dt);
  state.projectiles = state.projectiles.filter(p => !p.dead);

  for (const p of state.particles) p.update(dt);
  state.particles = state.particles.filter(p => p.life > 0);

  // state mutation bugs split only when killed by tests, not when they leak
  const splits = [];
  for (const b of state.bugs) {
    if (b.dead && b.killed && b.splitSpawn) {
      for (let i = 0; i < 2; i++) {
        const child = new Bug('off_by_one', state.hpScale, state.rewardScale);
        child.segIdx = b.segIdx; child.segT = b.segT;
        child.x = b.x; child.y = b.y;
        splits.push(child);
      }
      spawnText(b.x, b.y, '#dc2626', 'SPLIT!');
    }
  }
  state.bugs.push(...splits);
  state.bugs = state.bugs.filter(b => !b.dead);

  // wave clear
  if (!state.waveActive && state.spawnQueue.length === 0 && state.bugs.length === 0
      && state.wave > state.cleared) {
    let bonusTotal = 0;
    const batch = state.wave - state.cleared;
    while (state.cleared < state.wave) {
      state.cleared++;
      bonusTotal += awardClearBonus(state.cleared);
    }
    state.towers.forEach(t => {
      t.flakiness = Math.min(95, t.flakiness + t.flakyRate * 2.5 * batch);
    });
    if (!state.endless && state.cleared >= WAVE_DEFS.length) {
      state.gameWon = true;
      showOverlay(true);
      return;
    }
    SFX.clear();
    if (state.cleared > 1 && Math.random() < 0.55) {
      const ev = WAVE_EVENTS[Math.floor(Math.random() * WAVE_EVENTS.length)];
      ev.effect();
      setMsg(`Wave ${state.cleared} cleared! +$${bonusTotal} bonus. ${ev.msg}`);
    } else {
      setMsg(`Wave ${state.cleared} cleared! +$${bonusTotal} bonus. Tests degraded. Maintain or triage.`);
    }
    if (state.autoWave && hasNextWave()) state.autoWaveAt = state.now + 3;
  }

  if (state.autoWaveAt != null && state.now >= state.autoWaveAt) startWave();

  if (state.screenFlash > 0) state.screenFlash = Math.max(0, state.screenFlash - dt * 3);
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 14);
  if (state.banner) {
    state.banner.life -= dt;
    if (state.banner.life <= 0) state.banner = null;
  }
  updateUI();
}

// ────────────────────────────────────────────────────────────
// RENDER
// ────────────────────────────────────────────────────────────
function render() {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0a0f1e'; ctx.fillRect(0, 0, W, H);

  if (!CURRENT_LEVEL) return;

  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }

  drawGrid();
  drawPath();
  drawHoverPreview();

  for (const t of state.towers) {
    const hov = state.hoveredCell && state.hoveredCell.col === t.col && state.hoveredCell.row === t.row;
    t.draw(ctx, hov, state.selectedTower === t);
  }
  for (const b of state.bugs) b.draw(ctx);
  for (const p of state.projectiles) p.draw(ctx);
  for (const p of state.particles) p.draw(ctx);

  // prod zone strip
  ctx.fillStyle = 'rgba(34,197,94,0.06)'; ctx.fillRect(W - 62, 0, 62, H);
  ctx.strokeStyle = 'rgba(34,197,94,0.35)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W - 62, 0); ctx.lineTo(W - 62, H); ctx.stroke();

  ctx.restore();

  if (state.screenFlash > 0) {
    ctx.fillStyle = `rgba(239,68,68,${state.screenFlash * 0.22})`;
    ctx.fillRect(0, 0, W, H);
  }

  if (state.banner) {
    const a = Math.min(1, state.banner.life);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(10,15,30,0.55)';
    ctx.fillRect(0, H/2 - 44, W, 88);
    ctx.fillStyle = CURRENT_LEVEL.theme;
    ctx.font = 'bold 34px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(state.banner.text, W/2, H/2);
    ctx.restore();
  }

  if (state.paused) {
    ctx.fillStyle = 'rgba(10,15,30,0.65)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 30px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', W/2, H/2 - 12);
    ctx.font = '13px Courier New';
    ctx.fillStyle = '#64748b';
    ctx.fillText('press P or click resume', W/2, H/2 + 18);
  }
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(15,23,42,0.9)'; ctx.lineWidth = 0.5;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c*CELL, 0); ctx.lineTo(c*CELL, H); ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r*CELL); ctx.lineTo(W, r*CELL); ctx.stroke();
  }
}

function drawPath() {
  ctx.strokeStyle = '#0f2037'; ctx.lineWidth = CELL - 2; ctx.lineCap = 'square'; ctx.lineJoin = 'miter';
  ctx.beginPath(); ctx.moveTo(PATH_PX[0].x, PATH_PX[0].y);
  for (let i = 1; i < PATH_PX.length; i++) ctx.lineTo(PATH_PX[i].x, PATH_PX[i].y);
  ctx.stroke();

  // animated flow dashes show pipeline direction
  ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 2;
  ctx.setLineDash([14, 9]);
  ctx.lineDashOffset = -(state.now * 30) % 23;
  ctx.beginPath(); ctx.moveTo(PATH_PX[0].x, PATH_PX[0].y);
  for (let i = 1; i < PATH_PX.length; i++) ctx.lineTo(PATH_PX[i].x, PATH_PX[i].y);
  ctx.stroke();
  ctx.setLineDash([]); ctx.lineDashOffset = 0;

  const GATES = getAutoGates(PATH_PX);
  const GH = CELL * 0.6;

  for (const g of GATES) {
    const p = PATH_PX[g.idx];
    const rgb = hexRgb(g.color);

    ctx.save();
    ctx.shadowColor = g.color; ctx.shadowBlur = 8;
    ctx.strokeStyle = g.color; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    if (g.horiz) { ctx.moveTo(p.x - GH, p.y); ctx.lineTo(p.x + GH, p.y); }
    else { ctx.moveTo(p.x, p.y - GH); ctx.lineTo(p.x, p.y + GH); }
    ctx.stroke();
    ctx.restore();

    const lx = p.x + g.lx, ly = p.y + g.ly;
    ctx.font = 'bold 9px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tw = ctx.measureText(g.name).width;
    const ph = 14, pw = tw + 14;
    ctx.fillStyle = `rgba(${rgb},0.18)`;
    ctx.beginPath(); ctx.roundRect(lx - pw/2, ly - ph/2, pw, ph, 5); ctx.fill();
    ctx.strokeStyle = `rgba(${rgb},0.6)`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(lx - pw/2, ly - ph/2, pw, ph, 5); ctx.stroke();
    ctx.fillStyle = g.color;
    ctx.fillText(g.name, lx, ly);
  }

  ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ef4444';
  ctx.fillText('GIT', 22, PATH_PX[0].y - 16);
  ctx.fillText('PUSH', 22, PATH_PX[0].y - 4);
  ctx.fillStyle = '#22c55e';
  ctx.fillText('PROD', W - 28, PATH_PX[PATH_PX.length - 1].y - 14);
}

function drawHoverPreview() {
  if (!state.hoveredCell || !state.placing) return;
  const { col, row } = state.hoveredCell;
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
  const key = `${col},${row}`;
  const blocked = PATH_CELLS.has(key) || state.towers.some(t => t.col === col && t.row === row);
  const def = TOWER_DEF[state.placing];
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = blocked ? '#ef4444' : def.color;
  ctx.fillRect(col*CELL, row*CELL, CELL, CELL);
  ctx.globalAlpha = 1;
  if (!blocked) {
    ctx.beginPath(); ctx.arc(col*CELL + CELL/2, row*CELL + CELL/2, def.range, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(${hexRgb(def.color)},0.25)`; ctx.lineWidth = 1; ctx.stroke();
  }
}

// ────────────────────────────────────────────────────────────
// OVERLAY / END STATES
// ────────────────────────────────────────────────────────────
function showOverlay(won) {
  recordBest(won);
  const overtime = state.cleared - WAVE_DEFS.length;
  document.getElementById('o-title').textContent = won ? 'Pipeline Secure!' : 'Bugs in Production';
  document.getElementById('o-title').style.color = won ? '#22c55e' : '#ef4444';
  document.getElementById('o-score').textContent = `Final Score: ${state.score.toLocaleString()}`;
  let detail;
  if (won) {
    detail = `All ${WAVE_DEFS.length} waves cleared with ${state.lives} live${state.lives !== 1 ? 's' : ''} remaining.`;
  } else if (state.endless && overtime >= 0) {
    detail = `Cleared all ${WAVE_DEFS.length} waves plus ${overtime} overtime wave${overtime !== 1 ? 's' : ''}. Legendary on-call shift.`;
  } else {
    const remain = WAVE_DEFS.length - state.cleared;
    detail = `${remain} wave${remain !== 1 ? 's' : ''} remain. Ship faster next time.`;
  }
  document.getElementById('o-detail').textContent = detail;
  document.getElementById('o-save-btn').disabled = false;
  document.getElementById('o-save-btn').textContent = 'Save Score';
  document.getElementById('o-name').value = '';
  document.getElementById('endless-btn').style.display = won ? 'inline-block' : 'none';
  document.getElementById('overlay').classList.add('show');
  if (won) SFX.win(); else SFX.lose();
  renderLeaderboard(loadScores(), null);
}

function continueEndless() {
  state.endless = true;
  state.gameWon = false;
  document.getElementById('overlay').classList.remove('show');
  showBanner('OVERTIME');
  setMsg('ENDLESS MODE: waves keep scaling. Survive as long as you can.');
  if (state.autoWave) state.autoWaveAt = state.now + 3;
  SFX.wave();
  updateUI();
}

function restartGame() {
  document.getElementById('overlay').classList.remove('show');
  state.placing = null;
  document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
  hideTowerInfo();
  initState(); updateUI();
  setMsg(`${CURRENT_LEVEL.name} restarted. Place test layers on the grid.`);
}

// ────────────────────────────────────────────────────────────
// INPUT
// ────────────────────────────────────────────────────────────
function getCanvasCell(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const scaleX = W / r.width, scaleY = H / r.height;
  return {
    col: Math.floor((clientX - r.left) * scaleX / CELL),
    row: Math.floor((clientY - r.top) * scaleY / CELL)
  };
}

function cancelPlacement() {
  if (state.placing) {
    state.placing = null;
    document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
    setMsg('Placement cancelled.');
  } else if (state.selectedTower) {
    state.selectedTower = null; hideTowerInfo();
  }
}

function setupInput() {
  canvas.addEventListener('click', e => {
    const { col, row } = getCanvasCell(e.clientX, e.clientY);
    if (state.placing) placeTower(col, row);
    else selectPlacedTower(col, row);
  });
  canvas.addEventListener('mousemove', e => {
    state.hoveredCell = getCanvasCell(e.clientX, e.clientY);
  });
  canvas.addEventListener('mouseleave', () => { state.hoveredCell = null; });
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    state.hoveredCell = getCanvasCell(t.clientX, t.clientY);
  }, { passive: false });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    state.hoveredCell = getCanvasCell(t.clientX, t.clientY);
  }, { passive: false });
  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    const { col, row } = getCanvasCell(t.clientX, t.clientY);
    if (state.placing) placeTower(col, row);
    else selectPlacedTower(col, row);
    state.hoveredCell = null;
  }, { passive: false });
  canvas.addEventListener('contextmenu', e => {
    e.preventDefault();
    cancelPlacement();
  });

  const HOTKEY_TOWER = {};
  for (const [type, d] of Object.entries(TOWER_DEF)) HOTKEY_TOWER[d.hot] = type;

  window.addEventListener('keydown', e => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (!CURRENT_LEVEL) return;
    const k = e.key.toLowerCase();
    if (e.key === 'Escape') { cancelPlacement(); return; }
    if (k === ' ') { e.preventDefault(); startWave(); return; }
    if (k === 'p') { togglePause(); return; }
    if (k === 'f') { cycleSpeed(); return; }
    if (k === 'm') { toggleMute(); return; }
    if (k === 't') { runTriage(); return; }
    if (k === 'u') { upgradeTower(); return; }
    if (k === 'x') { sellTower(); return; }
    if (HOTKEY_TOWER[k]) { selectTower(HOTKEY_TOWER[k]); return; }
  });
}

// ────────────────────────────────────────────────────────────
// INIT
// ────────────────────────────────────────────────────────────
function init() {
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');
  setupInput();
  showLevelSelect();
  requestAnimationFrame(tick);
}
window.addEventListener('load', init);
