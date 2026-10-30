/* ============================================================
   seaDuel v1.2.4 — COMMAND THE OCEAN. WIN THE CHAMPIONSHIP.
   ============================================================ */

/* // 1. CANVAS & DOM */
const canvas = document.querySelector('#sea');
const ctx = canvas.getContext('2d');
const $ = id => document.getElementById(id);
function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}
function setHTML(id, html) {
  const el = $(id);
  if (el) el.innerHTML = html;
}

let W = 0, H = 0, DPR = 1;

/* // 2. CONSTANTS */
const MAX_ROUNDS = 11;
const MAX_HP = 100;
const PLAYER_BASE_FIRE = 660;
const PLAYER_FIRE_UPGRADE = 35;
const MIN_FIRE = 280;
const PLAYER_SPEED = 83;   // ~25% slower base (was 110)
const TURN_SPEED = 1.15;
const BOOST_SPEED = 172;   // ~25% slower boost (was 230)
const BOOST_DURATION = 2000;
const BOOST_CD = 22000;
const SHIELD_DURATION = 4000;
const SHIELD_CD = 25000;
const DOUBLE_DURATION = 5000;
const DOUBLE_CD = 28000;
const TORPEDO_DAMAGE = 28;
const TORPEDO_SPEED = 420;
const CRIT_CHANCE = 0.12;
const CRIT_MULT = 2.2;

const ENVIRONMENTS = [
  { name: 'Tropical Ocean', rounds: [1, 2, 3], colors: ['#0a7a8a', '#0a9aaa', '#067a8a'], fog: '#40c8d022', wave: 1.0 },
  { name: 'Stormy Ocean', rounds: [4, 5, 6], colors: ['#0a3a5a', '#0c4a6a', '#082a40'], fog: '#20305044', wave: 1.6 },
  { name: 'Arctic Ocean', rounds: [7, 8, 9], colors: ['#1a4a6a', '#2a6a8a', '#0a3a5a'], fog: '#a0d0ff18', wave: 0.85 },
  { name: 'Sunset Battlefield', rounds: [10, 11], colors: ['#2a2040', '#4a3050', '#1a1830'], fog: '#ff804020', wave: 1.2 }
];

/* // 3. GAME STATE */
let player, enemy;
let shots = [], particles = [], torpedoes = [];
let round = 1, playerRounds = 0, enemyRounds = 0;
let playerBattles = 0, enemyBattles = 0;
let playerHP = MAX_HP, enemyHP = MAX_HP;
let running = false, paused = false, waiting = false;
let championFinished = false;
let left = false, right = false, firing = false;
let playerFireDelay = PLAYER_BASE_FIRE;
let nextPlayerShot = 0, enemyNextShot = 0;
let boostUntil = 0, boostReady = 0;
let shieldUntil = 0, shieldReady = 0;
let doubleUntil = 0, doubleReady = 0;
let torpedoAmmo = 2, torpedoReady = 0;
let last = 0, oceanTime = 0, animationId = 0;
let shakeUntil = 0, shakeMag = 0;
let soundOn = true;
let currentEnv = ENVIRONMENTS[0];
let totalBattlesWon = 0;
let pauseStartedAt = 0;
let totalPausedMs = 0;

function gameNow() {
  const extra = (paused && pauseStartedAt) ? (performance.now() - pauseStartedAt) : 0;
  return performance.now() - totalPausedMs - extra;
}

/* // 4. AUDIO */
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {}
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function beep(freq, dur, type = 'square', vol = 0.08, slide = 0) {
  if (!soundOn || !audioCtx) return;
  try {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (slide) o.frequency.linearRampToValueAtTime(freq + slide, audioCtx.currentTime + dur);
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (_) {}
}

function playSound(name) {
  ensureAudio();
  if (!soundOn) return;
  switch (name) {
    case 'fire': beep(180, 0.06, 'square', 0.07); break;
    case 'hit': beep(120, 0.1, 'sawtooth', 0.08, -40); break;
    case 'crit': beep(440, 0.15, 'square', 0.11); beep(660, 0.12, 'square', 0.09); break;
    case 'explode': beep(80, 0.4, 'sawtooth', 0.13, -60); break;
    case 'boost': beep(300, 0.2, 'sine', 0.09, 200); break;
    case 'shield': beep(500, 0.25, 'sine', 0.08); break;
    case 'double': beep(350, 0.15, 'triangle', 0.09, 100); break;
    case 'torpedo': beep(90, 0.3, 'sawtooth', 0.12, -30); break;
    case 'splash': beep(140, 0.05, 'triangle', 0.03, -30); break;
    case 'win': beep(523, 0.15, 'sine', 0.1); setTimeout(() => beep(659, 0.15, 'sine', 0.1), 120); setTimeout(() => beep(784, 0.25, 'sine', 0.1), 240); break;
    case 'lose': beep(200, 0.3, 'sawtooth', 0.1, -80); break;
    case 'champ': beep(523, 0.2, 'sine', 0.12); setTimeout(() => beep(659, 0.2, 'sine', 0.12), 150); setTimeout(() => beep(784, 0.2, 'sine', 0.12), 300); setTimeout(() => beep(1046, 0.4, 'sine', 0.14), 450); break;
  }
}

function vibrate(ms) {
  if (navigator.vibrate) try { navigator.vibrate(ms); } catch (_) {}
}

/* // 5. HELPERS */
function wrap(n, max) { if (!max) return 0; return ((n % max) + max) % max; }

function distance(a, b) {
  let dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
  dx = Math.min(dx, W - dx); dy = Math.min(dy, H - dy);
  return Math.hypot(dx, dy);
}

function angleTo(from, to) {
  const dx = wrap(to.x - from.x + W / 2, W) - W / 2;
  const dy = wrap(to.y - from.y + H / 2, H) - H / 2;
  return Math.atan2(dy, dx);
}

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  const arena = $('arena');
  const wrapEl = $('arenaWrap');
  if (wrapEl && wrapEl.classList.contains('active')) {
    void wrapEl.offsetHeight;
  }
  let w = 0, h = 0;
  if (arena) {
    w = arena.clientWidth || arena.getBoundingClientRect().width;
    h = arena.clientHeight || arena.getBoundingClientRect().height;
  }
  if (w < 10 || h < 10) {
    w = Math.max(window.innerWidth || 800, 320);
    h = Math.max((window.innerHeight || 600) - 160, 200);
  }
  W = Math.floor(w);
  H = Math.floor(h);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  canvas.width = Math.max(1, Math.floor(W * DPR));
  canvas.height = Math.max(1, Math.floor(H * DPR));
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (player) { player.x = wrap(player.x, W); player.y = wrap(player.y, H); }
  if (enemy) { enemy.x = wrap(enemy.x, W); enemy.y = wrap(enemy.y, H); }
}
window.addEventListener('resize', resize);

function showScreen(id) {
  const keepArena = (id === 'pause' || id === 'message');
  document.querySelectorAll('.screen').forEach(s => {
    if (keepArena && s.id === 'arenaWrap') return;
    s.classList.remove('active');
  });
  const el = $(id);
  if (el) el.classList.add('active');
  if (id === 'arenaWrap') {
    const a = $('arenaWrap');
    if (a) a.classList.add('active');
  }
}

/* // 6. SHIPS */
function makeShip(x, y, heading) {
  return { x, y, heading, phase: Math.random() * 6, vx: 0, vy: 0 };
}

function setLevel() {
  playerFireDelay = Math.max(MIN_FIRE, PLAYER_BASE_FIRE - (round - 1) * PLAYER_FIRE_UPGRADE);
  for (const e of ENVIRONMENTS) {
    if (e.rounds.includes(round)) { currentEnv = e; break; }
  }
}

function speedScale() {
  // Base already -25%; each later round +1%
  return 1 + (round - 1) * 0.01;
}

function getAILevel() {
  if (round <= 3) return 1;
  if (round <= 7) return 2;
  return 3;
}

/* // 7. COMBAT */
function fire(shooter, target, isEnemy, multi = false) {
  const angle = angleTo(shooter, target);
  const speed = (isEnemy ? 200 : 300) * speedScale();
  const count = multi ? 4 : 2;
  const spread = multi ? 0.18 : 0.12;
  for (let i = 0; i < count; i++) {
    const side = (i % 2 === 0) ? -1 : 1;
    const off = (Math.floor(i / 2) + 1) * spread * side;
    const a = angle + (count === 2 ? side * 0.08 : off);
    const px = shooter.x + Math.cos(angle + Math.PI / 2) * 16 * side;
    const py = shooter.y + Math.sin(angle + Math.PI / 2) * 16 * side;
    shots.push({
      x: wrap(px, W), y: wrap(py, H),
      vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      enemy: isEnemy, life: 3.5, trail: [], multi: !!multi && !isEnemy
    });
  }
  particles.push({ x: shooter.x, y: shooter.y, life: 0.15, color: '#ffe28a', size: 8, type: 'flash' });
  if (!isEnemy) playSound('fire');
}

function launchTorpedo() {
  const now = gameNow();
  if (!running || torpedoAmmo <= 0 || now < torpedoReady) return;
  torpedoAmmo--;
  torpedoReady = now + 800;
  const angle = angleTo(player, enemy);
  torpedoes.push({
    x: player.x, y: player.y,
    vx: Math.cos(angle) * TORPEDO_SPEED,
    vy: Math.sin(angle) * TORPEDO_SPEED,
    life: 5, trail: []
  });
  playSound('torpedo');
  updateAbilityUI();
}

function damage(target, amount, isCrit = false) {
  if (!running) return;
  if (target === 'player') {
    if (gameNow() < shieldUntil) {
      particles.push({ x: player.x, y: player.y, life: 0.3, color: '#4ecbff', size: 20, type: 'shield' });
      return;
    }
    playerHP = Math.max(0, playerHP - amount);
    burst(player.x, player.y, isCrit ? '#ffee44' : '#ff5555', isCrit ? 14 : 8);
    if (isCrit) { showCrit(); playSound('crit'); vibrate(40); }
    else playSound('hit');
    if (playerHP <= 0) { updateHealthUI(); battleOver('enemy'); return; }
  } else {
    enemyHP = Math.max(0, enemyHP - amount);
    burst(enemy.x, enemy.y, isCrit ? '#ffee44' : '#ffe66d', isCrit ? 14 : 8);
    if (isCrit) { showCrit(); playSound('crit'); vibrate(30); }
    else playSound('hit');
    if (enemyHP <= 0) { updateHealthUI(); battleOver('player'); return; }
  }
  updateHealthUI();
  if (amount >= 15) { shakeUntil = gameNow() + 200; shakeMag = 4; }
}

function showCrit() {
  const el = $('critFlash');
  if (!el) return;
  el.textContent = 'CRITICAL!';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 400);
}

function burst(x, y, color, n = 9) {
  for (let i = 0; i < n; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 24,
      y: y + (Math.random() - 0.5) * 24,
      life: 0.3 + Math.random() * 0.35,
      color, size: 3 + Math.random() * 4, type: 'spark'
    });
  }
}

/* // 8. ABILITIES */
function activateBoost() {
  const now = gameNow();
  if (!running || now < boostReady) return;
  boostUntil = now + BOOST_DURATION;
  boostReady = now + BOOST_CD;
  playSound('boost');
  updateAbilityUI();
}
function activateShield() {
  const now = gameNow();
  if (!running || now < shieldReady) return;
  shieldUntil = now + SHIELD_DURATION;
  shieldReady = now + SHIELD_CD;
  playSound('shield');
  updateAbilityUI();
}
function activateDouble() {
  const now = gameNow();
  if (!running || now < doubleReady) return;
  doubleUntil = now + DOUBLE_DURATION;
  doubleReady = now + DOUBLE_CD;
  playSound('double');
  updateAbilityUI();
}

function updateAbilityUI() {
  const now = gameNow();
  const set = (btn, cdEl, readyAt, until, activeText) => {
    if (!btn || !cdEl) return;
    const rem = Math.max(0, readyAt - now);
    btn.disabled = rem > 0 && now >= until;
    btn.classList.toggle('active', now < until);
    if (now < until) cdEl.textContent = activeText;
    else if (rem <= 0) cdEl.textContent = 'READY';
    else cdEl.textContent = Math.ceil(rem / 1000) + 's';
  };
  set($('boostBtn'), $('boostCD'), boostReady, boostUntil, 'ACTIVE');
  set($('shieldBtn'), $('shieldCD'), shieldReady, shieldUntil, 'UP');
  set($('doubleBtn'), $('doubleCD'), doubleReady, doubleUntil, 'ACTIVE');
  const tBtn = $('torpedoBtn'), tAmmo = $('torpedoAmmo');
  if (tBtn) tBtn.disabled = torpedoAmmo <= 0;
  if (tAmmo) tAmmo.textContent = String(torpedoAmmo);
}

/* // 9. ENEMY AI */
function updateEnemy(dt, time) {
  const level = getAILevel();
  enemy.phase += dt * (0.7 + level * 0.25 + round * 0.02);
  const toPlayer = angleTo(enemy, player);
  const dist = distance(enemy, player);
  let desiredAngle = toPlayer;
  if (dist < 90) desiredAngle = toPlayer + Math.PI * 0.6;
  else if (dist > 220) desiredAngle = toPlayer;
  else desiredAngle = toPlayer + Math.sin(enemy.phase) * (0.8 + level * 0.2);
  for (const s of shots) {
    if (s.enemy) continue;
    if (distance(s, enemy) < 70) {
      desiredAngle = Math.atan2(enemy.y - s.y, enemy.x - s.x);
      break;
    }
  }
  const speed = (30 + round * 2.6 + level * 9) * speedScale();
  const turn = 1.2 + level * 0.4;
  let da = desiredAngle - enemy.heading;
  while (da > Math.PI) da -= Math.PI * 2;
  while (da < -Math.PI) da += Math.PI * 2;
  enemy.heading += Math.max(-turn * dt, Math.min(turn * dt, da));
  enemy.x = wrap(enemy.x + Math.cos(enemy.heading) * speed * dt, W);
  enemy.y = wrap(enemy.y + Math.sin(enemy.heading) * speed * dt, H);
  const fireBase = Math.max(420, 980 - round * 35 - level * 40);
  if (time >= enemyNextShot) {
    fire(enemy, player, true, false);
    enemyNextShot = time + fireBase + Math.random() * 350;
  }
}

/* // 10. UPDATE */
function update(dt, time) {
  oceanTime += dt;
  const boosting = gameNow() < boostUntil;
  const speed = (boosting ? BOOST_SPEED : PLAYER_SPEED) * speedScale();
  if (left) player.heading -= TURN_SPEED * dt;
  if (right) player.heading += TURN_SPEED * dt;
  player.x = wrap(player.x + Math.cos(player.heading) * speed * dt, W);
  player.y = wrap(player.y + Math.sin(player.heading) * speed * dt, H);
  if (boosting && Math.random() < 0.5) {
    particles.push({
      x: player.x - Math.cos(player.heading) * 20 + (Math.random() - 0.5) * 8,
      y: player.y - Math.sin(player.heading) * 20 + (Math.random() - 0.5) * 8,
      life: 0.2 + Math.random() * 0.2, color: '#ffcc66', size: 3, type: 'trail'
    });
  }
  updateEnemy(dt, time);
  if (firing && time >= nextPlayerShot) {
    const multi = gameNow() < doubleUntil;
    fire(player, enemy, false, multi);
    nextPlayerShot = time + (multi ? playerFireDelay * 0.65 : playerFireDelay);
  }
  for (let i = shots.length - 1; i >= 0; i--) {
    const b = shots[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.trail) { b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > 6) b.trail.shift(); }
    if (b.x < -8 || b.x > W + 8 || b.y < -8 || b.y > H + 8 || b.life <= 0) {
      if (b.life > 0) {
        particles.push({
          x: Math.max(0, Math.min(W, b.x)),
          y: Math.max(0, Math.min(H, b.y)),
          life: 0.2, color: b.enemy ? '#ff6666' : '#ffe28a', size: 5, type: 'spark'
        });
      }
      shots.splice(i, 1);
      continue;
    }
    const target = b.enemy ? player : enemy;
    if (distance(b, target) < 20) {
      const isCrit = Math.random() < CRIT_CHANCE;
      const dmg = isCrit ? Math.round(5 * CRIT_MULT) : 5;
      damage(b.enemy ? 'player' : 'enemy', dmg, isCrit);
      shots.splice(i, 1);
    }
  }
  for (let i = torpedoes.length - 1; i >= 0; i--) {
    const t = torpedoes[i];
    t.x += t.vx * dt;
    t.y += t.vy * dt;
    t.life -= dt;
    t.trail.push({ x: t.x, y: t.y });
    if (t.trail.length > 10) t.trail.shift();
    if (t.x < -12 || t.x > W + 12 || t.y < -12 || t.y > H + 12 || t.life <= 0) {
      if (t.life > 0) {
        particles.push({
          x: Math.max(0, Math.min(W, t.x)),
          y: Math.max(0, Math.min(H, t.y)),
          life: 0.25, color: '#ff8844', size: 7, type: 'spark'
        });
      }
      torpedoes.splice(i, 1);
      continue;
    }
    if (distance(t, enemy) < 24) {
      damage('enemy', TORPEDO_DAMAGE, true);
      burst(enemy.x, enemy.y, '#ff8844', 18);
      playSound('explode');
      shakeUntil = gameNow() + 300; shakeMag = 7;
      torpedoes.splice(i, 1);
    }
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].life -= dt;
    if (particles[i].life <= 0) particles.splice(i, 1);
  }
  updateAbilityUI();
}

/* // 11. GRAPHICS */
function drawOcean() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  const c = currentEnv.colors;
  g.addColorStop(0, c[0]); g.addColorStop(0.5, c[1]); g.addColorStop(1, c[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.lineWidth = 1;
  const waveAmp = 4 * currentEnv.wave;
  for (let i = 0; i < 14; i++) {
    const y = wrap(i * 55 + oceanTime * 28 * currentEnv.wave, H);
    ctx.strokeStyle = i % 2 ? '#a5edff15' : '#b8f4ff22';
    ctx.beginPath();
    for (let x = 0; x <= W; x += 10) {
      const yy = y + Math.sin(x * 0.022 + i + oceanTime) * waveAmp;
      if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  if (currentEnv.name === 'Arctic Ocean' && Math.random() < 0.3) {
    particles.push({ x: Math.random() * W, y: Math.random() * H * 0.4, life: 1.5, color: '#e0f0ff', size: 1.5, type: 'snow' });
  }
  if (currentEnv.name === 'Stormy Ocean' && Math.random() < 0.008) {
    ctx.fillStyle = '#ffffff33';
    ctx.fillRect(0, 0, W, H);
  }
}

function drawShip(s, color, damaged) {
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.heading + Math.PI / 2);
  ctx.fillStyle = '#001b30aa';
  ctx.beginPath(); ctx.ellipse(3, 5, 18, 28, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = damaged ? '#555' : color;
  ctx.strokeStyle = '#d6f5ff'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -26); ctx.lineTo(14, -7); ctx.lineTo(12, 19); ctx.lineTo(0, 26); ctx.lineTo(-12, 19); ctx.lineTo(-14, -7);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = damaged ? '#666' : '#b7c8cb'; ctx.fillRect(-6, -6, 12, 17);
  ctx.fillStyle = '#435a68'; ctx.fillRect(-5, -4, 10, 7);
  [-1, 1].forEach(side => {
    ctx.fillStyle = '#303a43'; ctx.fillRect(side * 10 - 2, -10, 4, 11);
    ctx.fillStyle = '#b9c4c9'; ctx.beginPath(); ctx.arc(side * 12, -9, 2.5, 0, Math.PI * 2); ctx.fill();
  });
  ctx.fillStyle = '#fff'; ctx.fillRect(-2.5, -21, 5, 2.5);
  if (damaged) {
    ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(5, 8); ctx.moveTo(4, -5); ctx.lineTo(-3, 10); ctx.stroke();
  }
  ctx.restore();
}

function draw() {
  let ox = 0, oy = 0;
  if (gameNow() < shakeUntil) {
    ox = (Math.random() - 0.5) * shakeMag;
    oy = (Math.random() - 0.5) * shakeMag;
  }
  ctx.save();
  ctx.translate(ox, oy);
  drawOcean();
  shots.forEach(b => {
    const col = b.enemy ? '#ff4242' : (b.multi ? '#ff9944' : '#ffe45b');
    if (b.trail) {
      ctx.strokeStyle = col + '88';
      ctx.lineWidth = b.multi ? 3 : 2;
      ctx.beginPath();
      b.trail.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.stroke();
    }
    ctx.fillStyle = col;
    ctx.shadowBlur = b.multi ? 12 : 8;
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.multi ? 4.5 : 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  });
  torpedoes.forEach(t => {
    if (t.trail.length > 1) {
      ctx.strokeStyle = '#ff8844aa'; ctx.lineWidth = 3;
      ctx.beginPath();
      t.trail.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.stroke();
    }
    ctx.fillStyle = '#ff6622';
    ctx.beginPath(); ctx.arc(t.x, t.y, 6, 0, Math.PI * 2); ctx.fill();
  });
  drawShip(enemy, '#e63d43', enemyHP <= 35);
  const boosting = gameNow() < boostUntil;
  const shielded = gameNow() < shieldUntil;
  if (shielded) {
    ctx.beginPath(); ctx.arc(player.x, player.y, 36, 0, Math.PI * 2);
    ctx.strokeStyle = '#4ecbffaa'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#4ecbff18'; ctx.fill();
  }
  if (boosting) {
    ctx.save(); ctx.shadowBlur = 20; ctx.shadowColor = '#ffcc44';
    drawShip(player, '#4ecbff', playerHP <= 35);
    ctx.restore();
  } else {
    drawShip(player, '#258bea', playerHP <= 35);
  }
  particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life * 2);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}

/* // 12. UI */
function updateHealthUI() {
  const pHP = $('playerHP'), eHP = $('enemyHP');
  if (pHP) pHP.style.width = playerHP + '%';
  if (eHP) eHP.style.width = enemyHP + '%';
  setText('playerHPText', Math.round(playerHP) + '%');
  setText('enemyHPText', Math.round(enemyHP) + '%');
  if (pHP) pHP.style.background = playerHP <= 25 ? '#ff4242' : '#29b7ff';
  if (eHP) eHP.style.background = enemyHP <= 25 ? '#ff4242' : '#ff4545';
}

function updateBattleUI() {
  setText('round', String(round));
  setText('playerRounds', String(playerRounds));
  setText('enemyRounds', String(enemyRounds));
  setText('battleText', playerBattles + ' – ' + enemyBattles);
}

/* // 13. BATTLE FLOW */
function initBattle() {
  showScreen('arenaWrap');
  const wrapEl = $('arenaWrap');
  if (wrapEl) void wrapEl.offsetHeight;
  resize();
  const applySpawn = () => {
    resize();
    if (player) { player.x = W * 0.28; player.y = H * 0.72; }
    if (enemy) { enemy.x = W * 0.72; enemy.y = H * 0.22; }
  };
  requestAnimationFrame(() => requestAnimationFrame(applySpawn));

  player = makeShip(W * 0.28, H * 0.72, -Math.PI * 0.55);
  enemy = makeShip(W * 0.72, H * 0.22, Math.PI * 0.55);
  shots = []; particles = []; torpedoes = [];
  playerHP = MAX_HP; enemyHP = MAX_HP;
  left = right = firing = false;
  boostUntil = shieldUntil = doubleUntil = 0;
  boostReady = shieldReady = doubleReady = 0;
  torpedoAmmo = 2; torpedoReady = 0;
  pauseStartedAt = 0; totalPausedMs = 0;
  nextPlayerShot = 0;
  enemyNextShot = performance.now() + 1400;
  oceanTime = 0;
  updateHealthUI(); updateBattleUI(); updateAbilityUI();
  running = true; waiting = false; paused = false;
  last = 0;
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(loop);
  setText('hint', 'ROUND ' + round + ' — ' + currentEnv.name);
}

function battleOver(winner) {
  if (!running || waiting) return;
  running = false; waiting = true;
  cancelAnimationFrame(animationId);
  playSound(winner === 'player' ? 'win' : 'lose');
  if (winner === 'player') vibrate(60);
  if (winner === 'player') { playerBattles++; totalBattlesWon++; }
  else enemyBattles++;
  updateBattleUI();
  if (playerBattles >= 2) {
    playerRounds++;
    showMessage('🏆 ROUND WON!', 'You took round ' + round + '!<br>Championship: ' + playerRounds + ' – ' + enemyRounds);
    return;
  }
  if (enemyBattles >= 2) {
    enemyRounds++;
    showMessage('💥 ROUND LOST', 'Enemy took round ' + round + '.<br>Championship: ' + playerRounds + ' – ' + enemyRounds);
    return;
  }
  showMessage(
    winner === 'player' ? '🎯 BATTLE WON!' : '💥 BATTLE LOST!',
    'Battles: ' + playerBattles + ' – ' + enemyBattles + '<br>First to 2 wins the round!'
  );
}

function showMessage(title, text) {
  setText('messageTitle', title);
  setHTML('messageText', text);
  showScreen('message');
}

function continueGame() {
  if (championFinished) { startChampionship(); return; }
  if (playerBattles >= 2 || enemyBattles >= 2) {
    if (round >= MAX_ROUNDS) { finishChampionship(); return; }
    round++;
    playerBattles = 0; enemyBattles = 0;
    setLevel();
    showRoundIntro();
    return;
  }
  initBattle();
}

function showRoundIntro() {
  setLevel();
  const level = getAILevel();
  const ranks = { 1: 'Cadet', 2: 'Captain', 3: 'Admiral' };
  const rank = ranks[level] || 'Cadet';
  setText('roundIntroTitle', 'ROUND ' + round + '/' + MAX_ROUNDS);
  setText('roundIntroEnv', currentEnv.name);
  setText('roundIntroDiff', rank);
  const improved = Math.round((PLAYER_BASE_FIRE - playerFireDelay) / PLAYER_FIRE_UPGRADE);
  setText('roundIntroUpgrade', improved > 0 ? 'Best of 3 · Fire +' + improved : 'Best of 3');
  const btn = $('roundReadyBtn');
  const hint = $('roundIntroHint');
  if (btn) { btn.disabled = true; btn.textContent = 'READY ▶'; }
  if (hint) setText('roundIntroHint', '');
  showScreen('roundIntro');
  const READ_MS = 1200;
  const start = performance.now();
  function tickRead() {
    const left = Math.max(0, READ_MS - (performance.now() - start));
    if (left > 0) {
      if (hint) setText('roundIntroHint', Math.ceil(left / 1000) + '…');
      requestAnimationFrame(tickRead);
    } else {
      if (hint) setText('roundIntroHint', '');
      if (btn) { btn.disabled = false; btn.textContent = 'READY ▶'; }
    }
  }
  requestAnimationFrame(tickRead);
}

function finishChampionship() {
  running = false; waiting = true; championFinished = true;
  cancelAnimationFrame(animationId);
  saveRecords();
  if (playerRounds > enemyRounds) {
    playSound('champ'); vibrate([50, 30, 50, 30, 80]);
    setText('champTitle', '🏆 YOU ARE THE CHAMPION!');
    setText('champText', 'You commanded the ocean!');
  } else if (enemyRounds > playerRounds) {
    playSound('lose');
    setText('champTitle', '💀 ENEMY CHAMPION');
    setText('champText', 'The red fleet prevails this time.');
  } else {
    setText('champTitle', '🤝 CHAMPIONSHIP DRAW');
    setText('champText', 'Equal commanders. Rematch?');
  }
  setHTML('champStats',
    'Final score: ' + playerRounds + ' – ' + enemyRounds +
    '<br>Battles won: ' + totalBattlesWon +
    '<br>All 11 rounds completed.'
  );
  showScreen('champEnd');
}

function startChampionship() {
  round = 1;
  playerRounds = enemyRounds = 0;
  playerBattles = enemyBattles = 0;
  totalBattlesWon = 0;
  championFinished = false;
  setLevel();
  showRoundIntro();
}

/* // 14. LOOP */
function loop(time) {
  if (!running || paused) return;
  if (document.hidden) { last = 0; animationId = requestAnimationFrame(loop); return; }
  if (!last) last = time;
  const dt = Math.min((time - last) / 1000, 0.04);
  last = time;
  update(dt, time);
  draw();
  animationId = requestAnimationFrame(loop);
}

/* // 15. INPUT */
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (['arrowleft', 'arrowright', 'arrowup', ' ', 'a', 'd', 'w', 'q', 'e', 'r', 'escape'].includes(k)) e.preventDefault();
  if (k === 'arrowleft' || k === 'a') left = true;
  if (k === 'arrowright' || k === 'd') right = true;
  if ((k === 'arrowup' || k === 'w') && !e.repeat) activateBoost();
  if (k === ' ') firing = true;
  if (k === 'q' && !e.repeat) activateShield();
  if (k === 'e' && !e.repeat) activateDouble();
  if (k === 'r' && !e.repeat) launchTorpedo();
  if (k === 'escape') togglePause();
});
window.addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  if (k === 'arrowleft' || k === 'a') left = false;
  if (k === 'arrowright' || k === 'd') right = false;
  if (k === ' ') firing = false;
});
window.addEventListener('blur', () => { left = right = firing = false; });

function hold(id, setter) {
  const btn = $(id);
  if (!btn) return;
  btn.addEventListener('pointerdown', e => {
    e.preventDefault();
    setter(true);
    try { btn.setPointerCapture(e.pointerId); } catch (_) {}
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => {
    btn.addEventListener(ev, () => setter(false));
  });
}
hold('leftBtn', v => left = v);
hold('rightBtn', v => right = v);
hold('fireBtn', v => firing = v);

$('boostBtn')?.addEventListener('pointerdown', e => { e.preventDefault(); activateBoost(); });
$('shieldBtn')?.addEventListener('pointerdown', e => { e.preventDefault(); activateShield(); });
$('doubleBtn')?.addEventListener('pointerdown', e => { e.preventDefault(); activateDouble(); });
$('torpedoBtn')?.addEventListener('pointerdown', e => { e.preventDefault(); launchTorpedo(); });

canvas.addEventListener('pointerdown', e => {
  if (!running || paused) return;
  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;
  if (distance({ x, y }, enemy) < 50) {
    const now = gameNow();
    if (now >= nextPlayerShot) {
      fire(player, enemy, false, now < doubleUntil);
      nextPlayerShot = now + playerFireDelay;
    }
  }
});

/* // 16. PAUSE */
function togglePause() {
  if (!running && !paused) return;
  if (paused) {
    if (pauseStartedAt) {
      totalPausedMs += performance.now() - pauseStartedAt;
      pauseStartedAt = 0;
    }
    paused = false;
    last = 0;
    showScreen('arenaWrap');
    const wrapEl = $('arenaWrap');
    if (wrapEl) void wrapEl.offsetHeight;
    resize();
    animationId = requestAnimationFrame(loop);
  } else {
    paused = true;
    pauseStartedAt = performance.now();
    cancelAnimationFrame(animationId);
    showScreen('pause');
  }
}

$('pauseBtn')?.addEventListener('click', togglePause);
$('resumeBtn')?.addEventListener('click', togglePause);
$('restartBattleBtn')?.addEventListener('click', () => { paused = false; initBattle(); });
$('menuFromPauseBtn')?.addEventListener('click', () => {
  running = false; paused = false;
  cancelAnimationFrame(animationId);
  showScreen('menu');
});

/* // 17. RECORDS */
function loadRecords() {
  try { return JSON.parse(localStorage.getItem('seaDuel_v11') || '{}'); }
  catch (_) { return {}; }
}
function saveRecords() {
  const r = loadRecords();
  r.played = (r.played || 0) + 1;
  if (playerRounds > enemyRounds) r.won = (r.won || 0) + 1;
  r.bestScore = Math.max(r.bestScore || 0, playerRounds);
  r.bestBattles = Math.max(r.bestBattles || 0, totalBattlesWon);
  try { localStorage.setItem('seaDuel_v11', JSON.stringify(r)); } catch (_) {}
}
function showRecords() {
  const r = loadRecords();
  const list = $('recordsList');
  if (list) {
    list.innerHTML =
      `<li><span>Championships played</span><b>${r.played || 0}</b></li>` +
      `<li><span>Championships won</span><b>${r.won || 0}</b></li>` +
      `<li><span>Best round score</span><b>${r.bestScore || 0}</b></li>` +
      `<li><span>Best battles won</span><b>${r.bestBattles || 0}</b></li>`;
  }
  showScreen('records');
}

/* // 18. SOUND */
function updateSoundButtons() {
  document.querySelectorAll('.sound-btn').forEach(b => {
    b.textContent = soundOn ? '🔊 SOUND: ON' : '🔇 SOUND: OFF';
  });
}
function toggleSound() {
  soundOn = !soundOn;
  ensureAudio();
  updateSoundButtons();
}

/* // 19. WIRING */
$('playBtn')?.addEventListener('click', () => { ensureAudio(); startChampionship(); });
$('howtoBtn')?.addEventListener('click', () => showScreen('howto'));
$('howtoClose')?.addEventListener('click', () => showScreen('menu'));
$('recordsBtn')?.addEventListener('click', showRecords);
$('recordsClose')?.addEventListener('click', () => showScreen('menu'));
$('resetRecordsBtn')?.addEventListener('click', () => {
  if (confirm('Reset all local records?')) {
    localStorage.removeItem('seaDuel_v11');
    showRecords();
  }
});
$('roundReadyBtn')?.addEventListener('click', initBattle);
$('continueBtn')?.addEventListener('click', continueGame);
$('playAgainBtn')?.addEventListener('click', startChampionship);
$('menuFromChampBtn')?.addEventListener('click', () => showScreen('menu'));
$('soundToggleMenu')?.addEventListener('click', toggleSound);
$('soundTogglePause')?.addEventListener('click', toggleSound);

document.addEventListener('visibilitychange', () => { last = 0; });

/* // 20. START */
showScreen('menu');
updateSoundButtons();
