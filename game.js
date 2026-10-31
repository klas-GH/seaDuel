/* ============================================================
   seaDuel v1.6.6 — COMMAND THE OCEAN. WIN THE CHAMPIONSHIP.
   ============================================================ */

const canvas = document.querySelector('#sea');
const ctx = canvas.getContext('2d');
const $ = id => document.getElementById(id);
function setText(id, t) { const el = $(id); if (el) el.textContent = t; }
function setHTML(id, h) { const el = $(id); if (el) el.innerHTML = h; }

let W = 0, H = 0, DPR = 1;

const MAX_ROUNDS = 12;
const BASE_HP = 100;
const PLAYER_BASE_FIRE = 780;
const PLAYER_FIRE_UPGRADE = 16;
const MIN_FIRE = 460;
const BASE_PLAYER_SPEED = 83;
const TURN_SPEED = 1.15;
const BASE_BOOST_SPEED = 172;
const PACE = 0.85; // v1.5.2: all ship & projectile speeds −15%
const COIN_SCALE = 0.67; // v1.5.2: coin income −33%
const GUN3_FROM_ROUND = 9; // 3rd cannon only from round 9
function scaledCoins(n) { return Math.max(0, Math.round(n * COIN_SCALE)); }
const BOOST_DURATION = 2000;
const BOOST_CD = 22000;
const SHIELD_DURATION = 4000;
const SHIELD_CD = 25000;
const DOUBLE_DURATION = 5000;
const DOUBLE_CD = 28000;
const TORPEDO_DAMAGE = 28;
const TORPEDO_SPEED = 380;
const CRIT_CHANCE = 0.12;
const CRIT_MULT = 2.2;

const ENVIRONMENTS = [
  { name: 'Tropical Ocean', rounds: [1, 2, 3], colors: ['#0a7a8a', '#0a9aaa', '#067a8a'], fog: '#40c8d022', wave: 1.0 },
  { name: 'Stormy Ocean', rounds: [4, 5, 6], colors: ['#0a3a5a', '#0c4a6a', '#082a40'], fog: '#20305044', wave: 1.6 },
  { name: 'Arctic Ocean', rounds: [7, 8, 9], colors: ['#1a4a6a', '#2a6a8a', '#0a3a5a'], fog: '#a0d0ff18', wave: 0.85 },
  { name: 'Sunset Battlefield', rounds: [10, 11, 12], colors: ['#2a2040', '#4a3050', '#1a1830'], fog: '#ff804020', wave: 1.2 }
];

/* Upgrades / economy */
const SHOP = [
  { id: 'armour', name: '🛡 Armour', desc: '+20 max HP', cost: 40, max: 5 },
  { id: 'shells', name: '💥 Shells', desc: '+15% damage', cost: 35, max: 5 },
  { id: 'guns', name: '🔫 Guns', desc: '+1 cannon (max 3)', cost: 50, max: 2 }, // start 1, buy up to +2
  { id: 'speed', name: '💨 Speed', desc: '+8% ship speed', cost: 30, max: 5 },
  { id: 'torpedoes', name: '🚀 Torpedoes', desc: '+1 ammo', cost: 25, max: 4 }
];

let player, enemies = [];
let shots = [], particles = [], torpedoes = [];
let round = 1, playerRounds = 0, enemyRounds = 0;
let playerBattles = 0, enemyBattles = 0;
let playerHP = BASE_HP, playerMaxHP = BASE_HP;
let running = false, paused = false, waiting = false;
let championFinished = false;
let left = false, right = false, firing = false;
let playerFireDelay = PLAYER_BASE_FIRE;
let nextPlayerShot = 0;
let boostUntil = 0, boostReady = 0;
let shieldUntil = 0, shieldReady = 0;
let doubleUntil = 0, doubleReady = 0;
let torpedoAmmo = 2, torpedoReady = 0, torpedoMax = 2;
let last = 0, oceanTime = 0, animationId = 0;
let shakeUntil = 0, shakeMag = 0;
let soundOn = true;
let currentEnv = ENVIRONMENTS[0];
let totalBattlesWon = 0;
let pauseStartedAt = 0, totalPausedMs = 0;
let coins = 0;
let upgrades = { armour: 0, shells: 0, guns: 0, speed: 0, torpedoes: 0 };
let playerGuns = 1;
let shellDamage = 7;
let pendingShop = false;
let selectedStartRound = 1;
let maxUnlockedRound = 1; // highest playable start level (1 = only R1)
/* Difficulty v1.6: Easy baseline, Normal +40%, Hard +80%.
   Armour DR uses half that bonus so it does not fully stack with HP. */
const DIFFICULTIES = {
  easy:   { id: 'easy',   name: 'Easy',   mult: 1.00, label: 'EASY' },
  normal: { id: 'normal', name: 'Normal', mult: 1.40, label: 'NORMAL' },
  hard:   { id: 'hard',   name: 'Hard',   mult: 1.80, label: 'HARD' }
};
let selectedDifficulty = 'easy';
function difficultyMult() {
  return (DIFFICULTIES[selectedDifficulty] || DIFFICULTIES.easy).mult;
}
function difficultyName() {
  return (DIFFICULTIES[selectedDifficulty] || DIFFICULTIES.easy).name;
}
function armourMult() {
  const dm = difficultyMult();
  return 1 + (dm - 1) * 0.5;
}
const ROLES = {
  hunter: { name: 'Hunter', hp: 1, speed: 1.18, shell: 1 },
  gunner: { name: 'Gunner', hp: 0.92, speed: 0.9, shell: 1.18 },
  brute:  { name: 'Brute', hp: 1.35, speed: 0.78, shell: 0.9 }
};
const ABILITIES = [
  { id: 'boost', name: 'Boost', key: 'W / ↑' },
  { id: 'shield', name: 'Shield', key: 'Q' },
  { id: 'double', name: 'D-Fire', key: 'E' },
  { id: 'torpedo', name: 'Torpedo', key: 'R' }
];
let loadout = ['boost', 'shield'];
function hasAbility(id) { return loadout.indexOf(id) !== -1; }
function roleForSlot(i, n) {
  if (n > 1 && round >= 7) return ['hunter', 'gunner', 'brute'][i % 3];
  if (round === 6 || round === 12) return 'brute';
  if (round <= 3) return 'hunter';
  return 'gunner';
}
function roleMods(role, boss) {
  const r = ROLES[role] || ROLES.hunter;
  const hp = boss ? (1 + (r.hp - 1) * 0.4) : r.hp;
  return { name: r.name, hp: hp, speed: r.speed, shell: r.shell };
}

function gameNow() {
  const extra = (paused && pauseStartedAt) ? (performance.now() - pauseStartedAt) : 0;
  return performance.now() - totalPausedMs - extra;
}

function speedScale() { return 1 + (round - 1) * 0.01; }
function playerSpeed() {
  return BASE_PLAYER_SPEED * (1 + upgrades.speed * 0.08) * speedScale() * PACE;
}
function boostSpeed() {
  return BASE_BOOST_SPEED * (1 + upgrades.speed * 0.08) * speedScale() * PACE;
}

/* Audio */
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {} }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}
function beep(freq, dur, type = 'square', vol = 0.08, slide = 0) {
  if (!soundOn || !audioCtx) return;
  try {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
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
    case 'coin': beep(800, 0.08, 'sine', 0.06); beep(1000, 0.1, 'sine', 0.05); break;
    case 'buy': beep(520, 0.1, 'triangle', 0.08); beep(660, 0.12, 'triangle', 0.07); break;
    case 'win': beep(523, 0.15, 'sine', 0.1); setTimeout(() => beep(659, 0.15, 'sine', 0.1), 120); setTimeout(() => beep(784, 0.25, 'sine', 0.1), 240); break;
    case 'lose': beep(200, 0.3, 'sawtooth', 0.1, -80); break;
    case 'champ': beep(523, 0.2, 'sine', 0.12); setTimeout(() => beep(659, 0.2, 'sine', 0.12), 150); setTimeout(() => beep(784, 0.2, 'sine', 0.12), 300); setTimeout(() => beep(1046, 0.4, 'sine', 0.14), 450); break;
    case 'boss': beep(60, 0.4, 'sawtooth', 0.12); setTimeout(() => beep(90, 0.3, 'sawtooth', 0.1), 200); break;
  }
}
function vibrate(ms) { if (navigator.vibrate) try { navigator.vibrate(ms); } catch (_) {} }

/* Helpers */
function wrap(n, max) { if (!max) return 0; return ((n % max) + max) % max; }

/** Visual (non-toroidal) distance — for aiming on the current screen */
function distScreen(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Aim only along the direct on-screen line (no wrap shortcut) */
function angleToScreen(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/** Closest living enemy by on-screen distance */
function nearestEnemy(from) {
  let best = null, bestD = Infinity;
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    const d = distScreen(from, e);
    if (d < bestD) { bestD = d; best = e; }
  }
  return best;
}

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  const arena = $('arena');
  const wrapEl = $('arenaWrap');
  if (wrapEl && wrapEl.classList.contains('active')) void wrapEl.offsetHeight;
  let w = 0, h = 0;
  if (arena) {
    w = arena.clientWidth || arena.getBoundingClientRect().width;
    h = arena.clientHeight || arena.getBoundingClientRect().height;
  }
  if (w < 10 || h < 10) {
    w = Math.max(window.innerWidth || 800, 320);
    h = Math.max((window.innerHeight || 600) - 160, 200);
  }
  W = Math.floor(w); H = Math.floor(h);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  canvas.width = Math.max(1, Math.floor(W * DPR));
  canvas.height = Math.max(1, Math.floor(H * DPR));
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (player) { player.x = wrap(player.x, W); player.y = wrap(player.y, H); }
  for (const e of enemies) { e.x = wrap(e.x, W); e.y = wrap(e.y, H); }
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
  if (id === 'arenaWrap') { const a = $('arenaWrap'); if (a) a.classList.add('active'); }
}

function makeShip(x, y, heading, opts = {}) {
  return {
    x, y, heading,
    phase: Math.random() * 6,
    hp: opts.hp || BASE_HP,
    maxHp: opts.maxHp || opts.hp || BASE_HP,
    scale: opts.scale || 1,
    guns: opts.guns || 1,
    isBoss: !!opts.isBoss,
    role: opts.role || 'hunter',
    nextShot: 0
  };
}

function setLevel() {
  playerFireDelay = Math.max(MIN_FIRE, PLAYER_BASE_FIRE - (round - 1) * PLAYER_FIRE_UPGRADE);
  for (const e of ENVIRONMENTS) {
    if (e.rounds.includes(round)) { currentEnv = e; break; }
  }
}

function getAILevel() {
  if (round <= 3) return 1;
  if (round <= 7) return 2;
  return 3;
}

function enemyCountForRound() {
  if (round === 12 || round === 6) return 1; // bosses alone
  if (round >= 9) return 3; // lvl 9–11: fleet of 3
  if (round >= 7) return 2;
  return 1;
}

function thirdGunLocked() {
  // First extra cannon is always for sale; the 3rd cannon waits until round 9.
  return (upgrades.guns || 0) >= 1 && round < GUN3_FROM_ROUND;
}

function isBossRound() { return round === 6 || round === 12; }

function spawnEnemies() {
  enemies = [];
  const n = enemyCountForRound();
  const level = getAILevel();
  let scale = 1, hpMult = 1, guns = 1;
  if (round === 6) { scale = 1.5; hpMult = 1.5; guns = 2; }
  if (round === 12) { scale = 2.5; hpMult = 2.5; guns = 4; } // x2 guns relative to late dual = 2*2, or x2 of player max path: "x2 nr guns" vs our ship — boss has 2x guns of typical; at end player may have 3 so 4-6; use 4 for final boss
  if (round > 3 && round !== 6 && round !== 12) guns = 2;

  const dm = difficultyMult();
  const baseHp = Math.round(BASE_HP * hpMult * (1 + (level - 1) * 0.1) * dm);
  const slots = [
    [0.72, 0.22],
    [0.55, 0.18],
    [0.85, 0.30]
  ];
  for (let i = 0; i < n; i++) {
    const [sx, sy] = slots[i] || [0.5 + i * 0.15, 0.2];
    const role = roleForSlot(i, n);
    const mods = roleMods(role, isBossRound());
    const hp = Math.max(1, Math.round(baseHp * mods.hp));
    enemies.push(makeShip(W * sx, H * sy, Math.PI * 0.55, {
      hp: hp,
      maxHp: hp,
      scale,
      guns,
      isBoss: isBossRound(),
      role: role
    }));
  }
}

function applyUpgradeStats() {
  playerMaxHP = BASE_HP + upgrades.armour * 20;
  shellDamage = Math.round(7 * (1 + upgrades.shells * 0.15));
  playerGuns = 1 + upgrades.guns;
  if (playerGuns > 3) playerGuns = 3;
  torpedoMax = 2 + upgrades.torpedoes;
}

/* Combat — direct on-screen aim only */
function projectileSpeed(isEnemy, shooter) {
  const pace = PACE * speedScale();
  if (!isEnemy) return 300 * pace;
  const shell = (ROLES[shooter && shooter.role] || ROLES.hunter).shell;
  const diffShell = 1 + (difficultyMult() - 1) * 0.45;
  return 360 * pace * shell * diffShell;
}
function fire(shooter, target, isEnemy, multi = false) {
  if (!target) return;
  const angle = angleToScreen(shooter, target); // NEVER wrap-aim
  const speed = projectileSpeed(isEnemy, shooter);
  const guns = isEnemy ? (shooter.guns || 1) : (multi ? Math.max(playerGuns, 2) : playerGuns);
  const count = multi && !isEnemy ? Math.max(guns, 2) + 1 : guns;
  const spread = count > 1 ? 0.14 : 0;
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : (i / (count - 1) - 0.5);
    const a = angle + t * spread * (count - 1);
    const side = count === 1 ? 0 : (i - (count - 1) / 2);
    const px = shooter.x + Math.cos(angle + Math.PI / 2) * 10 * side;
    const py = shooter.y + Math.sin(angle + Math.PI / 2) * 10 * side;
    shots.push({
      x: px, y: py,
      vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      enemy: isEnemy, life: 2.8, trail: [], multi: !!multi && !isEnemy,
      dmg: isEnemy ? Math.round(5 * difficultyMult()) : shellDamage
    });
  }
  particles.push({ x: shooter.x, y: shooter.y, life: 0.15, color: '#ffe28a', size: 8, type: 'flash' });
  if (!isEnemy) playSound('fire');
}

function launchTorpedo() {
  const now = gameNow();
  if (!running || !hasAbility('torpedo') || torpedoAmmo <= 0 || now < torpedoReady) return;
  const target = nearestEnemy(player);
  if (!target) return;
  torpedoAmmo--;
  torpedoReady = now + 800;
  const angle = angleToScreen(player, target);
  torpedoes.push({
    x: player.x, y: player.y,
    vx: Math.cos(angle) * TORPEDO_SPEED * PACE,
    vy: Math.sin(angle) * TORPEDO_SPEED * PACE,
    life: 4, trail: []
  });
  playSound('torpedo');
  updateAbilityUI();
}

function damagePlayer(amount, isCrit) {
  if (gameNow() < shieldUntil) {
    particles.push({ x: player.x, y: player.y, life: 0.3, color: '#4ecbff', size: 20, type: 'shield' });
    return;
  }
  playerHP = Math.max(0, playerHP - amount);
  burst(player.x, player.y, isCrit ? '#ffee44' : '#ff5555', isCrit ? 14 : 8);
  playSound(isCrit ? 'crit' : 'hit');
  shakeUntil = gameNow() + (isCrit ? 280 : 140);
  shakeMag = isCrit ? 8 : 4;
  if (isCrit) { showCrit(); vibrate(40); }
  updateHealthUI();
  if (playerHP <= 0) battleOver('enemy');
}

function damageEnemy(e, amount, isCrit) {
  if (!e || e.hp <= 0) return;
  // Armour: half the difficulty bonus so it does not fully stack with HP
  const dm = armourMult();
  if (dm > 1) amount = Math.max(1, Math.round(amount / dm));
  e.hp = Math.max(0, e.hp - amount);
  burst(e.x, e.y, isCrit ? '#ffee44' : '#ffe66d', isCrit ? 14 : 8);
  playSound(isCrit ? 'crit' : 'hit');
  const bossHit = !!e.isBoss;
  shakeUntil = gameNow() + (isCrit ? 320 : bossHit ? 220 : 100);
  shakeMag = isCrit ? 9 : bossHit ? 6 : 3;
  if (isCrit) { showCrit(); vibrate(30); }
  updateHealthUI();
  if (enemies.every(en => en.hp <= 0)) battleOver('player');
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

function activateBoost() {
  const now = gameNow();
  if (!running || !hasAbility('boost') || now < boostReady) return;
  boostUntil = now + BOOST_DURATION;
  boostReady = now + BOOST_CD;
  playSound('boost');
  updateAbilityUI();
}
function activateShield() {
  const now = gameNow();
  if (!running || !hasAbility('shield') || now < shieldReady) return;
  shieldUntil = now + SHIELD_DURATION;
  shieldReady = now + SHIELD_CD;
  playSound('shield');
  updateAbilityUI();
}
function activateDouble() {
  const now = gameNow();
  if (!running || !hasAbility('double') || now < doubleReady) return;
  doubleUntil = now + DOUBLE_DURATION;
  doubleReady = now + DOUBLE_CD;
  playSound('double');
  updateAbilityUI();
}

function updateAbilityUI() {
  const now = gameNow();
  const set = (btn, cdEl, readyAt, until, activeText, abilityId) => {
    if (!btn || !cdEl) return;
    if (!hasAbility(abilityId)) {
      btn.disabled = true;
      btn.classList.add('locked');
      btn.classList.remove('active');
      cdEl.textContent = 'OFF';
      return;
    }
    btn.classList.remove('locked');
    const rem = Math.max(0, readyAt - now);
    btn.disabled = rem > 0 && now >= until;
    btn.classList.toggle('active', now < until);
    if (now < until) cdEl.textContent = activeText;
    else if (rem <= 0) cdEl.textContent = 'READY';
    else cdEl.textContent = Math.ceil(rem / 1000) + 's';
  };
  set($('boostBtn'), $('boostCD'), boostReady, boostUntil, 'ACTIVE', 'boost');
  set($('shieldBtn'), $('shieldCD'), shieldReady, shieldUntil, 'UP', 'shield');
  set($('doubleBtn'), $('doubleCD'), doubleReady, doubleUntil, 'ACTIVE', 'double');
  const tBtn = $('torpedoBtn'), tAmmo = $('torpedoAmmo');
  if (tBtn && !hasAbility('torpedo')) {
    tBtn.disabled = true;
    tBtn.classList.add('locked');
    if (tAmmo) tAmmo.textContent = 'OFF';
  } else if (tBtn) {
    tBtn.classList.remove('locked');
    tBtn.disabled = torpedoAmmo <= 0;
    if (tAmmo) tAmmo.textContent = String(torpedoAmmo);
  }
}

function updateEnemy(e, dt, time) {
  if (e.hp <= 0) return;
  const level = getAILevel();
  e.phase += dt * (0.7 + level * 0.25);
  const toP = angleToScreen(e, player);
  const dist = distScreen(e, player);
  const role = e.role || 'hunter';
  let desired = toP;
  if (role === 'gunner') {
    if (dist < 210 * e.scale) desired = toP + Math.PI;
    else if (dist > 340) desired = toP;
    else desired = toP + Math.sin(e.phase) * 0.35;
  } else if (role === 'brute') {
    if (dist < 80 * e.scale) desired = toP + Math.PI * 0.35;
  } else if (dist < 64 * e.scale) {
    desired = toP + Math.PI * 0.45;
  }
  for (const s of shots) {
    if (s.enemy) continue;
    if (distScreen(s, e) < 70) {
      desired = Math.atan2(e.y - s.y, e.x - s.x);
      break;
    }
  }
  const speed = (28 + round * 2.2 + level * 8) * speedScale() * (e.isBoss ? 0.85 : 1) * difficultyMult() * PACE * (ROLES[role] || ROLES.hunter).speed;
  const turn = 1.1 + level * 0.35;
  let da = desired - e.heading;
  while (da > Math.PI) da -= Math.PI * 2;
  while (da < -Math.PI) da += Math.PI * 2;
  e.heading += Math.max(-turn * dt, Math.min(turn * dt, da));
  e.x = wrap(e.x + Math.cos(e.heading) * speed * dt, W);
  e.y = wrap(e.y + Math.sin(e.heading) * speed * dt, H);
  const fireBase = Math.max(300, (700 - round * 16 - level * 22) / difficultyMult()) * (e.isBoss ? 1.45 : 1);
  if (time >= e.nextShot) {
    fire(e, player, true, false);
    e.nextShot = time + fireBase + Math.random() * 300;
  }
}

function update(dt, time) {
  oceanTime += dt;
  const boosting = gameNow() < boostUntil;
  const speed = boosting ? boostSpeed() : playerSpeed();
  if (left) player.heading -= TURN_SPEED * dt;
  if (right) player.heading += TURN_SPEED * dt;
  player.x = wrap(player.x + Math.cos(player.heading) * speed * dt, W);
  player.y = wrap(player.y + Math.sin(player.heading) * speed * dt, H);
  // wake / boost trail
  if (Math.random() < (boosting ? 0.85 : 0.25)) {
    const back = boosting ? 22 : 16;
    particles.push({
      x: player.x - Math.cos(player.heading) * back + (Math.random() - 0.5) * (boosting ? 12 : 6),
      y: player.y - Math.sin(player.heading) * back + (Math.random() - 0.5) * (boosting ? 12 : 6),
      life: 0.18 + Math.random() * (boosting ? 0.35 : 0.22),
      color: boosting ? (Math.random() < 0.5 ? '#ffcc66' : '#ffe8a0') : '#a0d8ff55',
      size: boosting ? 2.5 + Math.random() * 3.5 : 1.5 + Math.random() * 2,
      type: 'wake'
    });
  }

  for (const e of enemies) updateEnemy(e, dt, time);

  if (firing && time >= nextPlayerShot) {
    const target = nearestEnemy(player);
    if (target) {
      const multi = gameNow() < doubleUntil;
      fire(player, target, false, multi);
      nextPlayerShot = time + (multi ? playerFireDelay * 0.65 : playerFireDelay);
    }
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
          x: Math.max(0, Math.min(W, b.x)), y: Math.max(0, Math.min(H, b.y)),
          life: 0.2, color: b.enemy ? '#ff6666' : '#ffe28a', size: 5, type: 'spark'
        });
      }
      shots.splice(i, 1);
      continue;
    }
    if (b.enemy) {
      if (distScreen(b, player) < 18) {
        const isCrit = Math.random() < CRIT_CHANCE;
        damagePlayer(isCrit ? Math.round(b.dmg * CRIT_MULT) : b.dmg, isCrit);
        shots.splice(i, 1);
      }
    } else {
      let hit = false;
      for (const e of enemies) {
        if (e.hp <= 0) continue;
        if (distScreen(b, e) < 16 * e.scale + 4) {
          const isCrit = Math.random() < CRIT_CHANCE;
          damageEnemy(e, isCrit ? Math.round(b.dmg * CRIT_MULT) : b.dmg, isCrit);
          hit = true;
          break;
        }
      }
      if (hit) shots.splice(i, 1);
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
      torpedoes.splice(i, 1);
      continue;
    }
    for (const e of enemies) {
      if (e.hp <= 0) continue;
      if (distScreen(t, e) < 20 * e.scale) {
        damageEnemy(e, TORPEDO_DAMAGE, true);
        burst(e.x, e.y, '#ff8844', 18);
        playSound('explode');
        shakeUntil = gameNow() + 300; shakeMag = 7;
        torpedoes.splice(i, 1);
        break;
      }
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.type === 'wake' || p.type === 'trail') {
      p.x += (Math.random() - 0.5) * 8 * dt;
      p.y += (Math.random() - 0.5) * 8 * dt;
      p.size = Math.max(0.5, (p.size || 3) * (1 - dt * 1.2));
    }
    if (p.life <= 0) particles.splice(i, 1);
  }
  updateAbilityUI();
}

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
}

function drawShip(s, color, damaged) {
  const sc = s.scale || 1;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.heading + Math.PI / 2);
  ctx.scale(sc, sc);
  // soft water shadow
  ctx.fillStyle = '#00101aaa';
  ctx.beginPath(); ctx.ellipse(2, 8, 16, 26, 0, 0, Math.PI * 2); ctx.fill();
  // hull body
  ctx.fillStyle = damaged ? '#4a4a4a' : color;
  ctx.strokeStyle = s.isBoss ? '#ffcc44' : '#e8f8ff';
  ctx.lineWidth = s.isBoss ? 2.8 : 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.lineTo(13, -10);
  ctx.lineTo(15, 6);
  ctx.lineTo(11, 20);
  ctx.lineTo(0, 28);
  ctx.lineTo(-11, 20);
  ctx.lineTo(-15, 6);
  ctx.lineTo(-13, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // deck plate
  ctx.fillStyle = damaged ? '#5a5a5a' : '#c5d4d8';
  ctx.beginPath();
  ctx.moveTo(0, -10); ctx.lineTo(7, -2); ctx.lineTo(6, 14); ctx.lineTo(0, 18); ctx.lineTo(-6, 14); ctx.lineTo(-7, -2);
  ctx.closePath(); ctx.fill();
  // bridge / cabin
  ctx.fillStyle = '#2a3a48';
  ctx.fillRect(-5, -2, 10, 9);
  ctx.fillStyle = '#6ec8ff88';
  ctx.fillRect(-4, -1, 8, 3);
  // guns
  const gunN = s.guns || 1;
  for (let i = 0; i < gunN; i++) {
    const side = gunN === 1 ? 0 : (i / (gunN - 1) - 0.5) * 18;
    ctx.fillStyle = '#1a2228';
    ctx.fillRect(side - 2.2, -16, 4.4, 14);
    ctx.fillStyle = '#4a5560';
    ctx.fillRect(side - 1.4, -16, 2.8, 4);
  }
  // bow highlight
  ctx.fillStyle = '#ffffffcc';
  ctx.fillRect(-2, -24, 4, 3);
  // boss stripe
  if (s.isBoss) {
    ctx.strokeStyle = '#ffaa2288';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-10, 4); ctx.lineTo(10, 4); ctx.stroke();
  }
  if (damaged) {
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-7, -2); ctx.lineTo(6, 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, -6); ctx.lineTo(-4, 12); ctx.stroke();
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
    ctx.beginPath(); ctx.arc(b.x, b.y, b.multi ? 4.5 : 3.5, 0, Math.PI * 2); ctx.fill();
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
  for (const e of enemies) {
    if (e.hp > 0) drawShip(e, e.isBoss ? '#ff6633' : '#e63d43', e.hp <= e.maxHp * 0.35);
  }
  if (player) {
    const boosting = gameNow() < boostUntil;
    const shielded = gameNow() < shieldUntil;
    if (shielded) {
      ctx.beginPath(); ctx.arc(player.x, player.y, 36, 0, Math.PI * 2);
      ctx.strokeStyle = '#4ecbffaa'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#4ecbff18'; ctx.fill();
    }
    if (boosting) {
      ctx.save(); ctx.shadowBlur = 20; ctx.shadowColor = '#ffcc44';
      drawShip(player, '#4ecbff', playerHP <= playerMaxHP * 0.35);
      ctx.restore();
    } else {
      drawShip(player, '#258bea', playerHP <= playerMaxHP * 0.35);
    }
  }
  particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life * 2);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}

function updateHealthUI() {
  const pct = Math.round((playerHP / playerMaxHP) * 100);
  const pHP = $('playerHP');
  if (pHP) {
    pHP.style.width = pct + '%';
    pHP.style.background = pct <= 25 ? '#ff4242' : '#29b7ff';
  }
  setText('playerHPText', pct + '%');

  const alive = enemies.filter(e => e.hp > 0);
  let ePct = 0;
  if (alive.length) {
    const total = alive.reduce((s, e) => s + e.hp, 0);
    const max = alive.reduce((s, e) => s + e.maxHp, 0);
    ePct = Math.round((total / max) * 100);
  }
  const eHP = $('enemyHP');
  if (eHP) {
    eHP.style.width = ePct + '%';
    eHP.style.background = ePct <= 25 ? '#ff4242' : '#ff4545';
  }
  setText('enemyHPText', ePct + '%');
  const solo = alive[0] || enemies[0];
  const roleName = solo && ROLES[solo.role] ? ROLES[solo.role].name.toUpperCase() : 'ENEMY';
  const label = isBossRound() ? (round === 12 ? '🔴 FINAL BOSS' : '🔴 MINI-BOSS') :
    (enemies.length > 1 ? '🔴 FLEET x' + enemies.length : '🔴 ' + roleName);
  setText('enemyLabel', label);
}

function updateBattleUI() {
  setText('round', String(round));
  setText('playerRounds', String(playerRounds));
  setText('enemyRounds', String(enemyRounds));
  setText('battleText', playerBattles + ' – ' + enemyBattles);
  setText('coinHud', String(coins));
}

function initBattle() {
  showScreen('arenaWrap');
  const wrapEl = $('arenaWrap');
  if (wrapEl) void wrapEl.offsetHeight;
  resize();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    resize();
    if (player) { player.x = W * 0.28; player.y = H * 0.72; }
  }));

  applyUpgradeStats();
  player = makeShip(W * 0.28, H * 0.72, -Math.PI * 0.55, { hp: playerMaxHP, maxHp: playerMaxHP, guns: playerGuns });
  playerHP = playerMaxHP;
  spawnEnemies();
  shots = []; particles = []; torpedoes = [];
  left = right = firing = false;
  boostUntil = shieldUntil = doubleUntil = 0;
  boostReady = shieldReady = doubleReady = 0;
  torpedoAmmo = torpedoMax;
  torpedoReady = 0;
  pauseStartedAt = 0; totalPausedMs = 0;
  nextPlayerShot = 0;
  oceanTime = 0;
  updateHealthUI(); updateBattleUI(); updateAbilityUI();
  running = true; waiting = false; paused = false;
  last = 0;
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(loop);
  let hint = 'ROUND ' + round + ' — ' + currentEnv.name;
  if (round === 6) hint = '⚠ MINI-BOSS — ' + currentEnv.name;
  if (round === 12) hint = '☠ FINAL BOSS — ' + currentEnv.name;
  setText('hint', hint);
  if (isBossRound()) playSound('boss');
}

function battleOver(winner) {
  if (!running || waiting) return;
  running = false; waiting = true;
  cancelAnimationFrame(animationId);
  playSound(winner === 'player' ? 'win' : 'lose');
  if (winner === 'player') {
    vibrate(60);
    playerBattles++;
    totalBattlesWon++;
    const coinBase = isBossRound() ? (round === 12 ? 80 : 50) : 15 + enemies.length * 5;
    const coinGain = scaledCoins(coinBase * (0.85 + difficultyMult() * 0.15));
    coins += coinGain;
    playSound('coin');
  } else {
    enemyBattles++;
  }
  updateBattleUI();
  if (playerBattles >= 2) {
    playerRounds++;
    unlockThrough(round);
    const bonus = scaledCoins(25 + round * 3);
    coins += bonus;
    pendingShop = true;
    showMessage('🏆 ROUND WON!', 'Round ' + round + ' secured!<br>+' + bonus + ' coins · Total 🪙 ' + coins +
      '<br>Championship: ' + playerRounds + ' – ' + enemyRounds);
    return;
  }
  if (enemyBattles >= 2) {
    enemyRounds++;
    pendingShop = false;
    showMessage('💥 ROUND LOST', 'Enemy took round ' + round + '.<br>Championship: ' + playerRounds + ' – ' + enemyRounds);
    return;
  }
  showMessage(
    winner === 'player' ? '🎯 BATTLE WON!' : '💥 BATTLE LOST!',
    (winner === 'player' ? '+coins · ' : '') + 'Battles: ' + playerBattles + ' – ' + enemyBattles
  );
}

function showMessage(title, text) {
  setText('messageTitle', title);
  setHTML('messageText', text);
  showScreen('message');
}

function openShop() {
  setText('shopCoins', '🪙 ' + coins + ' coins');
  const grid = $('shopGrid');
  if (!grid) return;
  grid.innerHTML = '';
  SHOP.forEach(item => {
    const owned = upgrades[item.id] || 0;
    const maxed = owned >= item.max;
    const locked = item.id === 'guns' && thirdGunLocked();
    const can = !maxed && !locked && coins >= item.cost;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'shop-item' + (maxed || locked || !can ? ' sold-out' : '');
    const status = maxed ? 'MAX' : locked ? '🔒 from Round ' + GUN3_FROM_ROUND : (item.cost + ' 🪙 · lvl ' + owned + '/' + item.max);
    btn.innerHTML = '<b>' + item.name + '</b><small>' + item.desc + '<br>' + status + '</small>';
    btn.disabled = maxed || locked || !can;
    btn.onclick = () => {
      if (upgrades[item.id] >= item.max || coins < item.cost) return;
      if (item.id === 'guns' && thirdGunLocked()) return;
      coins -= item.cost;
      upgrades[item.id]++;
      applyUpgradeStats();
      playSound('buy');
      updateBattleUI();
      openShop();
    };
    grid.appendChild(btn);
  });
  showScreen('shop');
}

function continueGame() {
  if (championFinished) { startChampionship(); return; }
  if (playerBattles >= 2 || enemyBattles >= 2) {
    if (pendingShop && playerBattles >= 2) {
      pendingShop = false;
      openShop();
      return;
    }
    if (round >= MAX_ROUNDS) { finishChampionship(); return; }
    round++;
    playerBattles = 0; enemyBattles = 0;
    setLevel();
    showRoundIntro();
    return;
  }
  initBattle();
}

function afterShop() {
  if (round >= MAX_ROUNDS) { finishChampionship(); return; }
  round++;
  playerBattles = 0; enemyBattles = 0;
  setLevel();
  showRoundIntro();
}

function showRoundIntro() {
  setLevel();
  const level = getAILevel();
  const ranks = { 1: 'Cadet', 2: 'Captain', 3: 'Admiral' };
  setText('roundIntroTitle', 'ROUND ' + round + '/' + MAX_ROUNDS);
  setText('roundIntroEnv', currentEnv.name);
  let diff = ranks[level] || 'Cadet';
  diff += ' · ' + difficultyName();
  const n = enemyCountForRound();
  const roleNames = [];
  for (let i = 0; i < n; i++) {
    const nm = (ROLES[roleForSlot(i, n)] || ROLES.hunter).name;
    if (roleNames.indexOf(nm) === -1) roleNames.push(nm);
  }
  if (n > 1) diff += ' · Fleet x' + n;
  if (roleNames.length) diff += ' · ' + roleNames.join('/');
  if (round > 3 && !isBossRound()) diff += ' · Dual guns';
  setText('roundIntroDiff', diff);
  const improved = Math.round((PLAYER_BASE_FIRE - playerFireDelay) / PLAYER_FIRE_UPGRADE);
  setText('roundIntroUpgrade', improved > 0 ? 'Best of 3 · Fire +' + improved : 'Best of 3 · 1 gun start');

  const bossEl = $('roundIntroBoss');
  if (bossEl) {
    if (round === 6) {
      bossEl.style.display = '';
      bossEl.textContent = '⚠ MINI-BOSS AHEAD — 1.5× size & HP';
    } else if (round === 12) {
      bossEl.style.display = '';
      bossEl.textContent = '☠ FINAL BOSS — 2.5× size · 2× guns · 2.5× HP';
    } else if (round === 5) {
      bossEl.style.display = '';
      bossEl.textContent = 'Next: Round 6 is a MINI-BOSS';
    } else if (round === 11) {
      bossEl.style.display = '';
      bossEl.textContent = 'Next: Round 12 is the FINAL BOSS';
    } else {
      bossEl.style.display = 'none';
      bossEl.textContent = '';
    }
  }

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
    '<br>Coins banked: 🪙 ' + coins
  );
  showScreen('champEnd');
}

function startChampionship(fromRound) {
  loadProgress();
  const start = Math.max(1, Math.min(MAX_ROUNDS, fromRound || selectedStartRound || 1));
  if (start > maxUnlockedRound) {
    selectedStartRound = maxUnlockedRound;
    renderLevelSelect();
    return;
  }
  round = start;
  playerRounds = enemyRounds = 0;
  playerBattles = enemyBattles = 0;
  totalBattlesWon = 0;
  championFinished = false;
  // Stipend when starting mid-ladder so R8+ is playable without grinding from R1
  coins = Math.max(0, scaledCoins((start - 1) * 15));
  upgrades = { armour: 0, shells: 0, guns: 0, speed: 0, torpedoes: 0 };
  applyUpgradeStats();
  pendingShop = false;
  totalPausedMs = 0;
  pauseStartedAt = 0;
  setLevel();
  showRoundIntro();
}

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

/* Input */
function continueOnEnter() {
  const active = id => {
    const el = $(id);
    return !!(el && el.classList.contains('active'));
  };
  if (active('message')) return $('continueBtn');
  if (active('shop')) return $('shopContinueBtn');
  if (active('roundIntro')) return $('roundReadyBtn');
  if (active('pause')) return $('resumeBtn');
  if (active('champEnd')) return $('playAgainBtn');
  if (active('howto')) return $('howtoClose');
  if (active('records')) return $('recordsClose');
  if (active('menu')) return $('playBtn');
  return null;
}
window.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.repeat) {
    const btn = continueOnEnter();
    const focusedOther = e.target && e.target.tagName === 'BUTTON' && e.target !== btn;
    if (btn && !btn.disabled && !focusedOther) {
      e.preventDefault();
      btn.click();
    }
    return;
  }
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
  const target = nearestEnemy(player);
  if (!target) return;
  const now = gameNow();
  if (now >= nextPlayerShot) {
    fire(player, target, false, now < doubleUntil);
    nextPlayerShot = now + playerFireDelay;
  }
});

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
  renderLevelSelect();
  renderDifficultySelect();
  renderLoadout();
  showScreen('menu');
});

function ensureUnlockMap(r) {
  if (!r.unlocks || typeof r.unlocks !== 'object') {
    const legacy = Math.max(1, Math.min(MAX_ROUNDS, r.maxUnlocked || 1));
    r.unlocks = { easy: legacy, normal: 1, hard: 1 };
  }
  for (const id of ['easy', 'normal', 'hard']) {
    r.unlocks[id] = Math.max(1, Math.min(MAX_ROUNDS, r.unlocks[id] || 1));
  }
  // keep legacy maxUnlocked as overall high-water for records display
  r.maxUnlocked = Math.max(r.unlocks.easy, r.unlocks.normal, r.unlocks.hard, r.maxUnlocked || 1);
  return r;
}
function loadRecords() {
  try {
    let raw = localStorage.getItem('seaDuel_v16');
    if (!raw) {
      for (const key of ['seaDuel_v14', 'seaDuel_v13']) {
        const legacy = localStorage.getItem(key);
        if (legacy) {
          const o = ensureUnlockMap(JSON.parse(legacy));
          localStorage.setItem('seaDuel_v16', JSON.stringify(o));
          return o;
        }
      }
      return ensureUnlockMap({});
    }
    return ensureUnlockMap(JSON.parse(raw));
  } catch (_) { return ensureUnlockMap({}); }
}
function saveRecords() {
  const r = loadRecords();
  r.played = (r.played || 0) + 1;
  if (playerRounds > enemyRounds) r.won = (r.won || 0) + 1;
  r.bestScore = Math.max(r.bestScore || 0, playerRounds);
  r.bestBattles = Math.max(r.bestBattles || 0, totalBattlesWon);
  r.bestCoins = Math.max(r.bestCoins || 0, coins);
  r.difficulty = selectedDifficulty;
  r.unlocks[selectedDifficulty] = Math.max(r.unlocks[selectedDifficulty] || 1, maxUnlockedRound);
  r.maxUnlocked = Math.max(r.unlocks.easy, r.unlocks.normal, r.unlocks.hard);
  try { localStorage.setItem('seaDuel_v16', JSON.stringify(r)); } catch (_) {}
}
function loadLoadout() {
  const r = loadRecords();
  if (!Array.isArray(r.loadout)) return;
  const ids = r.loadout.filter(id => ABILITIES.some(a => a.id === id));
  if (ids.length === 2) loadout = ids;
}
function saveLoadout() {
  const r = loadRecords();
  r.loadout = loadout.slice();
  try { localStorage.setItem('seaDuel_v16', JSON.stringify(r)); } catch (_) {}
}
function renderLoadout() {
  const grid = $('loadoutGrid');
  if (!grid || typeof document === 'undefined' || !document.createElement) return;
  loadLoadout();
  grid.innerHTML = '';
  ABILITIES.forEach(a => {
    const on = hasAbility(a.id);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'loadout-btn' + (on ? ' selected' : '');
    btn.innerHTML = '<b>' + a.name + '</b><small>' + a.key + '</small>';
    btn.addEventListener('click', () => {
      if (on) {
        if (loadout.length <= 1) return;
        loadout = loadout.filter(id => id !== a.id);
      } else if (loadout.length < 2) {
        loadout = loadout.concat(a.id);
      } else {
        loadout = loadout.slice(1).concat(a.id);
      }
      saveLoadout();
      renderLoadout();
    });
    grid.appendChild(btn);
  });
  updateLoadoutLabel();
}
function updateLoadoutLabel() {
  const el = $('loadoutLabel');
  if (!el) return;
  const names = loadout.map(id => {
    const a = ABILITIES.find(x => x.id === id);
    return a ? a.name : id;
  });
  el.textContent = loadout.length === 2 ? ('Loadout: ' + names.join(' + ')) : 'Loadout: pick 2 abilities';
}
function loadProgress() {
  const r = loadRecords();
  loadLoadout();
  if (r.difficulty && DIFFICULTIES[r.difficulty]) selectedDifficulty = r.difficulty;
  maxUnlockedRound = Math.max(1, Math.min(MAX_ROUNDS, r.unlocks[selectedDifficulty] || 1));
  selectedStartRound = Math.min(selectedStartRound, maxUnlockedRound);
}
function saveDifficulty() {
  const r = loadRecords();
  r.difficulty = selectedDifficulty;
  try { localStorage.setItem('seaDuel_v16', JSON.stringify(r)); } catch (_) {}
  // switch unlock track for the newly selected difficulty
  maxUnlockedRound = Math.max(1, Math.min(MAX_ROUNDS, r.unlocks[selectedDifficulty] || 1));
  selectedStartRound = Math.min(selectedStartRound, maxUnlockedRound);
  renderLevelSelect();
}
function unlockThrough(wonRound) {
  // Cleared wonRound → can start from wonRound+1 (or stay at 12) on THIS difficulty only
  const next = Math.min(MAX_ROUNDS, Math.max(1, wonRound + 1));
  if (next > maxUnlockedRound) {
    maxUnlockedRound = next;
    const r = loadRecords();
    r.unlocks[selectedDifficulty] = maxUnlockedRound;
    r.maxUnlocked = Math.max(r.unlocks.easy, r.unlocks.normal, r.unlocks.hard);
    try { localStorage.setItem('seaDuel_v16', JSON.stringify(r)); } catch (_) {}
  }
}
function renderLevelSelect() {
  const grid = $('levelGrid');
  if (!grid || typeof document === 'undefined' || !document.createElement) return;
  loadProgress();
  grid.innerHTML = '';
  for (let i = 1; i <= MAX_ROUNDS; i++) {
    const btn = document.createElement('button');
    const locked = i > maxUnlockedRound;
    btn.className = 'level-btn' + (i === selectedStartRound ? ' selected' : '') + (locked ? ' locked' : '');
    btn.type = 'button';
    btn.disabled = locked;
    let label = String(i);
    if (i === 6) label = '6★';
    if (i === 12) label = '12☠';
    btn.textContent = locked ? '🔒' : label;
    btn.title = locked ? 'Clear earlier rounds to unlock' : ('Start at round ' + i);
    if (!locked) {
      btn.addEventListener('click', () => {
        selectedStartRound = i;
        renderLevelSelect();
        updateStartLabel();
      });
    }
    grid.appendChild(btn);
  }
  updateStartLabel();
}
function updateStartLabel() {
  const el = $('startLevelLabel');
  if (el) el.textContent = 'Start: Round ' + selectedStartRound + (selectedStartRound === 6 ? ' (mini-boss)' : selectedStartRound === 12 ? ' (final boss)' : '');
}
function renderDifficultySelect() {
  const grid = $('diffGrid');
  if (!grid || typeof document === 'undefined' || !document.createElement) return;
  loadProgress();
  grid.innerHTML = '';
  ['easy', 'normal', 'hard'].forEach(id => {
    const d = DIFFICULTIES[id];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'diff-btn' + (selectedDifficulty === id ? ' selected' : '') + (id === 'hard' ? ' hard' : id === 'normal' ? ' normal' : '');
    const pct = id === 'easy' ? '×1' : id === 'normal' ? '+40%' : '+80%';
    btn.innerHTML = '<b>' + d.label + '</b><small>Enemy ' + pct + '</small>';
    btn.title = d.name + ' — enemy HP / armour / shells / speed ×' + d.mult.toFixed(2);
    btn.addEventListener('click', () => {
      selectedDifficulty = id;
      saveDifficulty();
      renderDifficultySelect();
      updateDiffLabel();
    });
    grid.appendChild(btn);
  });
  updateDiffLabel();
}
function updateDiffLabel() {
  const el = $('diffLabel');
  if (!el) return;
  const d = DIFFICULTIES[selectedDifficulty] || DIFFICULTIES.easy;
  el.textContent = 'Difficulty: ' + d.name + (d.mult > 1 ? ' (enemy ×' + d.mult.toFixed(2) + ')' : ' (baseline)');
}
function showRecords() {
  const r = loadRecords();
  const list = $('recordsList');
  if (list) {
    const u = r.unlocks || { easy: 1, normal: 1, hard: 1 };
    list.innerHTML =
      `<li><span>Championships played</span><b>${r.played || 0}</b></li>` +
      `<li><span>Championships won</span><b>${r.won || 0}</b></li>` +
      `<li><span>Best round score</span><b>${r.bestScore || 0}</b></li>` +
      `<li><span>Best battles won</span><b>${r.bestBattles || 0}</b></li>` +
      `<li><span>Most coins in a run</span><b>${r.bestCoins || 0}</b></li>` +
      `<li><span>Unlock Easy / Normal / Hard</span><b>${u.easy || 1} / ${u.normal || 1} / ${u.hard || 1}</b></li>` +
      `<li><span>Last difficulty</span><b>${(DIFFICULTIES[r.difficulty] || DIFFICULTIES.easy).name}</b></li>`;
  }
  showScreen('records');
}

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

$('playBtn')?.addEventListener('click', () => {
  ensureAudio();
  if (loadout.length !== 2) { updateLoadoutLabel(); return; }
  startChampionship(selectedStartRound);
});
$('howtoBtn')?.addEventListener('click', () => showScreen('howto'));
$('howtoClose')?.addEventListener('click', () => { renderLevelSelect(); renderDifficultySelect(); renderLoadout(); showScreen('menu'); });
$('recordsBtn')?.addEventListener('click', showRecords);
$('recordsClose')?.addEventListener('click', () => { renderLevelSelect(); renderDifficultySelect(); renderLoadout(); showScreen('menu'); });
$('resetRecordsBtn')?.addEventListener('click', () => {
  if (confirm('Reset all local records and unlocked levels?')) {
    localStorage.removeItem('seaDuel_v16');
    localStorage.removeItem('seaDuel_v14');
    localStorage.removeItem('seaDuel_v13');
    maxUnlockedRound = 1;
    selectedStartRound = 1;
    selectedDifficulty = 'easy';
    loadout = ['boost', 'shield'];
    showRecords();
    renderLevelSelect();
    renderDifficultySelect();
    renderLoadout();
  }
});
$('roundReadyBtn')?.addEventListener('click', initBattle);
$('continueBtn')?.addEventListener('click', continueGame);
$('shopContinueBtn')?.addEventListener('click', afterShop);
$('playAgainBtn')?.addEventListener('click', () => startChampionship(selectedStartRound));
$('menuFromChampBtn')?.addEventListener('click', () => { renderLevelSelect(); renderDifficultySelect(); renderLoadout(); showScreen('menu'); });
$('soundToggleMenu')?.addEventListener('click', toggleSound);
$('soundTogglePause')?.addEventListener('click', toggleSound);

document.addEventListener('visibilitychange', () => { last = 0; });

/* Export for regression tests */
window.seaDuel = {
  angleToScreen, distScreen, wrap, speedScale, enemyCountForRound, isBossRound,
  getAILevel, SHOP, MAX_ROUNDS, unlockThrough, difficultyMult, DIFFICULTIES, ensureUnlockMap,
  thirdGunLocked, scaledCoins, PACE, COIN_SCALE, GUN3_FROM_ROUND,
  armourMult, roleForSlot, hasAbility, ROLES, ABILITIES, projectileSpeed,
  version: '1.6.6'
};

loadProgress();
if (typeof document !== 'undefined' && document.createElement) {
  renderLevelSelect();
  renderDifficultySelect();
  renderLoadout();
  showScreen('menu');
  updateSoundButtons();
}
