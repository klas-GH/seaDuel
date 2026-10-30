/* ============================================================
   seaDuel v1.2 — COMMAND THE OCEAN. WIN THE CHAMPIONSHIP.
   ============================================================ */

/* // 1. CANVAS & DOM */
const canvas = document.querySelector('#sea');
const ctx = canvas.getContext('2d');
const $ = id => document.getElementById(id);

let W = 0, H = 0, DPR = 1;

/* // 2. CONSTANTS */
const MAX_ROUNDS = 11;
const MAX_HP = 100;
const PLAYER_BASE_FIRE = 660;
const PLAYER_FIRE_UPGRADE = 35;
const MIN_FIRE = 280;
const PLAYER_SPEED = 110;
const TURN_SPEED = 1.25;
const BOOST_SPEED = 230;
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
  // Wall time minus time spent paused — freezes ability timers while paused
  const extra = (paused && pauseStartedAt) ? (performance.now() - pauseStartedAt) : 0;
  return performance.now() - totalPausedMs - extra;
}

/* // 4. AUDIO (Web Audio — no external files) */
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

function playSound(kind) {
  ensureAudio();
  switch (kind) {
    case 'shot': beep(220, 0.08, 'square', 0.06); break;
    case 'hit': beep(90, 0.12, 'sawtooth', 0.1, -40); break;
    case 'crit': beep(440, 0.15, 'square', 0.12, 200); beep(660, 0.1, 'triangle', 0.08); break;
    case 'boost': beep(180, 0.25, 'sawtooth', 0.09, 120); break;
    case 'shield': beep(300, 0.2, 'sine', 0.07, -50); break;
    case 'double': beep(350, 0.15, 'triangle', 0.08, 100); break;
    case 'torpedo': beep(60, 0.3, 'sawtooth', 0.12, -20); break;
    case 'win': beep(523, 0.15); setTimeout(() => beep(659, 0.15), 120); setTimeout(() => beep(784, 0.25), 240); break;
    case 'lose': beep(200, 0.3, 'sawtooth', 0.1, -80); break;
    case 'champ': for (let i = 0; i < 5; i++) setTimeout(() => beep(400 + i * 80, 0.12, 'square', 0.08), i * 90); break;
  }
}

/* // 5. UTILS */
function wrap(v, max) {
  if (max <= 0) return 0;
  v = v % max;
  return v < 0 ? v + max : v;
}
function dist(a, b) {
  let dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
  dx = Math.min(dx, W - dx); dy = Math.min(dy, H - dy);
  return Math.hypot(dx, dy);
}
function angleTo(from, to) {
  const dx = wrap(to.x - from.x + W / 2, W) - W / 2;
  const dy = wrap(to.y - from.y + H / 2, H) - H / 2;
  return Math.atan2(dy, dx);
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function resize() {
  const r = canvas.getBoundingClientRect();
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = r.width; H = r.height;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (player) { player.x = wrap(player.x, W); player.y = wrap(player.y, H); }
  if (enemy) { enemy.x = wrap(enemy.x, W); enemy.y = wrap(enemy.y, H); }
}
window.addEventListener('resize', resize);

/* // 6. SHIPS */
function makeShip(x, y, heading) {
  return { x, y, heading, radius: 18 };
}

/* // 7. COMBAT */
function fire(shooter, target, isEnemy, multi) {
  const angle = angleTo(shooter, target);
  const spread = multi ? 0.18 : 0;
  const count = multi ? 2 : 1;
  for (let i = 0; i < count; i++) {
    const side = multi ? (i === 0 ? -1 : 1) : 0;
    const a = angle + side * spread;
    const speed = isEnemy ? 260 : 320;
    const px = shooter.x + Math.cos(angle + Math.PI / 2) * 16 * side;
    const py = shooter.y + Math.sin(angle + Math.PI / 2) * 16 * side;
    shots.push({
      x: multi ? px : shooter.x,
      y: multi ? py : shooter.y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: 1.4,
      enemy: isEnemy,
      multi: !!multi,
      dmg: isEnemy ? 8 : 10
    });
  }
  particles.push({ x: shooter.x, y: shooter.y, life: 0.15, color: '#ffe28a', size: 8, type: 'flash' });
  playSound('shot');
}

function damage(target, amount, isCrit) {
  const now = gameNow();
  if (target === player) {
    if (now < shieldUntil) {
      particles.push({ x: player.x, y: player.y, life: 0.3, color: '#4ecbff', size: 20, type: 'shield' });
      return;
    }
    playerHP = Math.max(0, playerHP - amount);
    burst(player.x, player.y, isCrit ? '#ffee44' : '#ff5555', isCrit ? 14 : 8);
  } else {
    enemyHP = Math.max(0, enemyHP - amount);
    burst(enemy.x, enemy.y, isCrit ? '#ffee44' : '#ffe66d', isCrit ? 14 : 8);
  }
  playSound(isCrit ? 'crit' : 'hit');
  if (amount >= 15) { shakeUntil = gameNow() + 200; shakeMag = 4; }
  updateHP();
}

function burst(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 40 + Math.random() * 80;
    particles.push({
      x, y,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: 0.4 + Math.random() * 0.3,
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

function activateTorpedo() {
  const now = gameNow();
  if (!running || now < torpedoReady || torpedoAmmo <= 0) return;
  torpedoAmmo--;
  torpedoReady = now + 8000;
  const a = angleTo(player, enemy);
  torpedoes.push({
    x: player.x, y: player.y,
    vx: Math.cos(a) * TORPEDO_SPEED,
    vy: Math.sin(a) * TORPEDO_SPEED,
    life: 2.5
  });
  playSound('torpedo');
  updateAbilityUI();
}

function updateAbilityUI() {
  const now = gameNow();
  const set = (btn, cdEl, ready, until, activeLabel) => {
    if (!btn || !cdEl) return;
    if (now < until) {
      btn.classList.add('active');
      cdEl.textContent = activeLabel;
    } else if (now < ready) {
      btn.classList.remove('active');
      const left = Math.ceil((ready - now) / 1000);
      cdEl.textContent = left + 's';
    } else {
      btn.classList.remove('active');
      cdEl.textContent = '';
    }
  };
  set($('boostBtn'), $('boostCD'), boostReady, boostUntil, 'ACTIVE');
  set($('shieldBtn'), $('shieldCD'), shieldReady, shieldUntil, 'ACTIVE');
  set($('doubleBtn'), $('doubleCD'), doubleReady, doubleUntil, 'ACTIVE');
  const tBtn = $('torpedoBtn'), tCd = $('torpedoCD');
  if (tBtn && tCd) {
    if (torpedoAmmo <= 0 && now >= torpedoReady) {
      tCd.textContent = '0';
      tBtn.classList.add('disabled');
    } else if (now < torpedoReady) {
      tBtn.classList.remove('disabled');
      tCd.textContent = Math.ceil((torpedoReady - now) / 1000) + 's';
    } else {
      tBtn.classList.remove('disabled');
      tCd.textContent = torpedoAmmo;
    }
  }
}

/* // 9. AI */
function getAILevel() {
  if (round <= 3) return 0;
  if (round <= 7) return 1;
  return 2;
}

function updateEnemy(dt) {
  if (!enemy || !player) return;
  const level = getAILevel();
  const now = gameNow();
  const distToPlayer = dist(enemy, player);
  const desired = angleTo(enemy, player);
  let turn = 1.2 + level * 0.4;
  let diff = desired - enemy.heading;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  enemy.heading += clamp(diff, -turn * dt, turn * dt);

  // dodge shots
  for (const s of shots) {
    if (s.enemy) continue;
    if (dist(enemy, s) < 80) {
      const away = Math.atan2(enemy.y - s.y, enemy.x - s.x);
      enemy.heading += clamp(away - enemy.heading, -1.5 * dt, 1.5 * dt);
    }
  }

  let speed = 90 + level * 15;
  if (distToPlayer < 120) speed *= 0.7;
  if (distToPlayer > 280) speed *= 1.15;
  enemy.x = wrap(enemy.x + Math.cos(enemy.heading) * speed * dt, W);
  enemy.y = wrap(enemy.y + Math.sin(enemy.heading) * speed * dt, H);

  const fireRate = [900, 700, 520][level];
  if (now > enemyNextShot && distToPlayer < 340) {
    fire(enemy, player, true, false);
    enemyNextShot = now + fireRate + Math.random() * 200;
  }
}

/* // 10. UPDATE LOOP */
function update(dt) {
  if (!running || paused) return;
  oceanTime += dt;
  const now = gameNow();

  // player movement
  if (left) player.heading -= TURN_SPEED * dt;
  if (right) player.heading += TURN_SPEED * dt;
  let speed = PLAYER_SPEED;
  const boosting = now < boostUntil;
  if (boosting) speed = BOOST_SPEED;
  player.x = wrap(player.x + Math.cos(player.heading) * speed * dt, W);
  player.y = wrap(player.y + Math.sin(player.heading) * speed * dt, H);
  if (boosting) {
    particles.push({
      x: player.x - Math.cos(player.heading) * 20 + (Math.random() - 0.5) * 8,
      y: player.y - Math.sin(player.heading) * 20 + (Math.random() - 0.5) * 8,
      life: 0.2 + Math.random() * 0.2, color: '#ffcc66', size: 3, type: 'trail'
    });
  }

  // fire
  if (firing && now >= nextPlayerShot) {
    const multi = now < doubleUntil;
    fire(player, enemy, false, multi);
    nextPlayerShot = now + (multi ? playerFireDelay * 0.7 : playerFireDelay);
  }

  updateEnemy(dt);

  // shots
  for (let i = shots.length - 1; i >= 0; i--) {
    const b = shots[i];
    b.x = wrap(b.x + b.vx * dt, W);
    b.y = wrap(b.y + b.vy * dt, H);
    b.life -= dt;
    if (b.life <= 0) { shots.splice(i, 1); continue; }
    const target = b.enemy ? player : enemy;
    if (dist(b, target) < target.radius + 4) {
      let dmg = b.dmg;
      let isCrit = false;
      if (!b.enemy && Math.random() < CRIT_CHANCE) {
        dmg = Math.round(dmg * CRIT_MULT);
        isCrit = true;
      }
      damage(target, dmg, isCrit);
      shots.splice(i, 1);
    }
  }

  // torpedoes
  for (let i = torpedoes.length - 1; i >= 0; i--) {
    const t = torpedoes[i];
    t.x = wrap(t.x + t.vx * dt, W);
    t.y = wrap(t.y + t.vy * dt, H);
    t.life -= dt;
    if (t.life <= 0) { torpedoes.splice(i, 1); continue; }
    if (dist(t, enemy) < enemy.radius + 8) {
      damage(enemy, TORPEDO_DAMAGE, true);
      burst(enemy.x, enemy.y, '#ff8844', 18);
      shakeUntil = gameNow() + 300; shakeMag = 7;
      torpedoes.splice(i, 1);
    }
  }

  // particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.vx) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; }
    if (p.life <= 0) particles.splice(i, 1);
  }

  if (playerHP <= 0 || enemyHP <= 0) endBattle();
  updateAbilityUI();
}

/* // 11. DRAW */
function drawOcean() {
  const cols = currentEnv.colors;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, cols[0]);
  g.addColorStop(0.5, cols[1]);
  g.addColorStop(1, cols[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // waves
  ctx.strokeStyle = currentEnv.fog;
  ctx.lineWidth = 1.5;
  for (let row = 0; row < 6; row++) {
    ctx.beginPath();
    for (let x = 0; x <= W; x += 10) {
      const yy = H * 0.15 + row * H * 0.14 + Math.sin(x * 0.02 + oceanTime * currentEnv.wave + row) * 6;
      if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }

  // arctic snow
  if (currentEnv.name.includes('Arctic') && Math.random() < 0.3) {
    particles.push({
      x: Math.random() * W, y: -5,
      vx: (Math.random() - 0.5) * 20, vy: 30 + Math.random() * 40,
      life: 1.5, color: '#e0f0ff', size: 1.5, type: 'snow'
    });
  }
  // fog overlay
  ctx.fillStyle = currentEnv.fog;
  ctx.fillRect(0, 0, W, H);
}

function drawShip(ship, color, isPlayer) {
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.heading);
  // hull
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(22, 0);
  ctx.lineTo(-14, 12);
  ctx.lineTo(-10, 0);
  ctx.lineTo(-14, -12);
  ctx.closePath();
  ctx.fill();
  // bridge
  ctx.fillStyle = '#fff';
  ctx.fillRect(-4, -5, 10, 10);
  // gun
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(8, 0); ctx.lineTo(20, 0);
  ctx.stroke();
  ctx.restore();
}

function draw() {
  if (!W || !H) return;
  let ox = 0, oy = 0;
  if (gameNow() < shakeUntil) {
    ox = (Math.random() - 0.5) * shakeMag;
    oy = (Math.random() - 0.5) * shakeMag;
  }
  ctx.save();
  ctx.translate(ox, oy);
  drawOcean();

  // shots
  for (const b of shots) {
    const col = b.enemy ? '#ff4242' : (b.multi ? '#ff9944' : '#ffe45b');
    const sz = b.multi ? 4.5 : 3.2;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(b.x, b.y, sz, 0, Math.PI * 2);
    ctx.fill();
  }

  // torpedoes
  for (const t of torpedoes) {
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(Math.atan2(t.vy, t.vx));
    ctx.fillStyle = '#ff6622';
    ctx.beginPath();
    ctx.moveTo(12, 0); ctx.lineTo(-8, 5); ctx.lineTo(-8, -5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ff8844aa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 0); ctx.lineTo(-18, 0);
    ctx.stroke();
    ctx.restore();
  }

  if (player) {
    const boosting = gameNow() < boostUntil;
    const shielded = gameNow() < shieldUntil;
    if (shielded) {
      ctx.strokeStyle = '#4ecbff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 36, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (boosting) {
      ctx.shadowColor = '#ffcc44';
      ctx.shadowBlur = 18;
    }
    drawShip(player, '#29b7ff', true);
    ctx.shadowBlur = 0;
  }
  if (enemy) drawShip(enemy, '#ff4545', false);

  // particles
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function updateHP() {
  $('playerHP').style.width = (playerHP / MAX_HP * 100) + '%';
  $('enemyHP').style.width = (enemyHP / MAX_HP * 100) + '%';
  $('playerHP').style.background = playerHP <= 25 ? '#ff4242' : '#29b7ff';
  $('enemyHP').style.background = enemyHP <= 25 ? '#ff4242' : '#ff4545';
}

function updateScoreboard() {
  $('roundNum').textContent = round;
  $('playerRounds').textContent = playerRounds;
  $('enemyRounds').textContent = enemyRounds;
  $('battleText').textContent = playerBattles + ' – ' + enemyBattles;
}

/* // 13. BATTLE / ROUND / CHAMPIONSHIP */
function initBattle() {
  resize();
  // ensure layout has settled
  if (W < 10 || H < 10) {
    const r = canvas.getBoundingClientRect();
    W = Math.max(r.width, 320);
    H = Math.max(r.height, 240);
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  player = makeShip(W * 0.28, H * 0.72, -Math.PI * 0.55);
  enemy = makeShip(W * 0.72, H * 0.22, Math.PI * 0.55);
  shots = []; particles = []; torpedoes = [];
  playerHP = MAX_HP; enemyHP = MAX_HP;
  left = right = firing = false;
  boostUntil = shieldUntil = doubleUntil = 0;
  boostReady = shieldReady = doubleReady = 0;
  torpedoAmmo = 2; torpedoReady = 0;
  nextPlayerShot = 0; enemyNextShot = 0;
  pauseStartedAt = 0;
  totalPausedMs = 0;
  shakeUntil = 0;
  updateHP();
  updateAbilityUI();
  showScreen('game');
  running = true; paused = false; waiting = false;
  last = performance.now();
  if (!animationId) loop(last);
}

function endBattle() {
  if (waiting) return;
  waiting = true;
  running = false;
  const playerWon = playerHP > 0;
  if (playerWon) {
    playerBattles++;
    playSound('win');
  } else {
    enemyBattles++;
    playSound('lose');
  }
  updateScoreboard();
  setTimeout(() => {
    if (playerBattles >= 2 || enemyBattles >= 2) {
      if (playerBattles >= 2) {
        playerRounds++;
        totalBattlesWon++;
        playerFireDelay = Math.max(MIN_FIRE, playerFireDelay - PLAYER_FIRE_UPGRADE);
      } else {
        enemyRounds++;
      }
      playerBattles = 0;
      enemyBattles = 0;
      if (playerRounds >= 6 || enemyRounds >= 6 || round >= MAX_ROUNDS) {
        finishChampionship(playerRounds > enemyRounds);
      } else {
        round++;
        setLevel();
        showRoundIntro();
      }
    } else {
      $('continueMsg').textContent = playerWon ? 'You won the battle!' : 'Enemy won the battle.';
      showScreen('continue');
    }
  }, 800);
}

function continueGame() {
  if (playerBattles >= 2 || enemyBattles >= 2) {
    // should not reach here normally
    playerBattles = 0;
    enemyBattles = 0;
    setLevel();
    showRoundIntro();
    return;
  }
  initBattle();
}

function showRoundIntro() {
  setLevel();
  const level = getAILevel();
  const names = ['Cadet', 'Captain', 'Admiral'];
  $('roundTitle').textContent = 'Round ' + round;
  $('roundEnv').textContent = currentEnv.name;
  $('roundAI').textContent = 'Enemy: ' + names[level];
  $('roundBestOf').textContent = 'Best of 3  ·  Fire rate: ' + Math.round(1000 / playerFireDelay) + '/s';
  showScreen('roundIntro');
}

function setLevel() {
  currentEnv = ENVIRONMENTS.find(e => e.rounds.includes(round)) || ENVIRONMENTS[0];
}

function startChampionship() {
  round = 1;
  playerRounds = 0; enemyRounds = 0;
  playerBattles = 0; enemyBattles = 0;
  playerFireDelay = PLAYER_BASE_FIRE;
  totalBattlesWon = 0;
  championFinished = false;
  setLevel();
  showRoundIntro();
}

function finishChampionship(won) {
  championFinished = true;
  running = false;
  saveRecord(won);
  playSound(won ? 'champ' : 'lose');
  $('champTitle').textContent = won ? 'CHAMPION!' : 'DEFEATED';
  $('champMsg').textContent = won
    ? 'You commanded the ocean and won the championship!'
    : 'The enemy fleet prevailed. Try again, Captain.';
  $('champStats').textContent = 'Rounds ' + playerRounds + '–' + enemyRounds + '  ·  Battles won: ' + totalBattlesWon;
  showScreen('champEnd');
}

/* // 14. RECORDS */
function saveRecord(won) {
  try {
    const key = 'seaDuel_v11';
    let data = JSON.parse(localStorage.getItem(key) || '{}');
    data.plays = (data.plays || 0) + 1;
    if (won) data.wins = (data.wins || 0) + 1;
    data.bestRounds = Math.max(data.bestRounds || 0, playerRounds);
    data.bestBattles = Math.max(data.bestBattles || 0, totalBattlesWon);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (_) {}
}

function showRecords() {
  try {
    const data = JSON.parse(localStorage.getItem('seaDuel_v11') || '{}');
    $('recPlays').textContent = data.plays || 0;
    $('recWins').textContent = data.wins || 0;
    $('recBestRounds').textContent = data.bestRounds || 0;
    $('recBestBattles').textContent = data.bestBattles || 0;
  } catch (_) {}
  showScreen('records');
}

/* // 15. SCREENS */
function showScreen(name) {
  ['menu', 'howto', 'records', 'roundIntro', 'game', 'continue', 'champEnd', 'pause'].forEach(s => {
    const el = $(s + 'Screen');
    if (el) el.classList.toggle('active', s === name);
  });
  if (name === 'game') {
    requestAnimationFrame(() => resize());
  }
}

/* // 16. PAUSE */
function togglePause() {
  if (!running && !paused) return;
  if (paused) {
    if (pauseStartedAt) {
      totalPausedMs += performance.now() - pauseStartedAt;
      pauseStartedAt = 0;
    }
    paused = false;
    last = performance.now();
    showScreen('game');
  } else {
    paused = true;
    pauseStartedAt = performance.now();
    showScreen('pause');
  }
  updateSoundButtons();
}

/* // 17. SOUND TOGGLE */
function toggleSound() {
  soundOn = !soundOn;
  updateSoundButtons();
}
function updateSoundButtons() {
  const t = soundOn ? '🔊 Sound' : '🔇 Muted';
  if ($('soundToggleMenu')) $('soundToggleMenu').textContent = t;
  if ($('soundTogglePause')) $('soundTogglePause').textContent = t;
}

/* // 18. INPUT */
document.addEventListener('keydown', e => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') left = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') right = true;
  if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); activateBoost(); }
  if (e.code === 'Space') { e.preventDefault(); firing = true; }
  if (e.code === 'KeyQ') activateShield();
  if (e.code === 'KeyE') activateDouble();
  if (e.code === 'KeyR') activateTorpedo();
  if (e.code === 'Escape') togglePause();
});
document.addEventListener('keyup', e => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') left = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') right = false;
  if (e.code === 'Space') firing = false;
});

// touch controls
$('leftBtn')?.addEventListener('pointerdown', e => { e.preventDefault(); left = true; });
$('leftBtn')?.addEventListener('pointerup', e => { left = false; });
$('leftBtn')?.addEventListener('pointerleave', e => { left = false; });
$('rightBtn')?.addEventListener('pointerdown', e => { e.preventDefault(); right = true; });
$('rightBtn')?.addEventListener('pointerup', e => { right = false; });
$('rightBtn')?.addEventListener('pointerleave', e => { right = false; });
$('fireBtn')?.addEventListener('pointerdown', e => { e.preventDefault(); firing = true; });
$('fireBtn')?.addEventListener('pointerup', e => { firing = false; });
$('fireBtn')?.addEventListener('pointerleave', e => { firing = false; });
$('boostBtn').addEventListener('pointerdown', e => { e.preventDefault(); activateBoost(); });
$('shieldBtn').addEventListener('pointerdown', e => { e.preventDefault(); activateShield(); });
$('doubleBtn').addEventListener('pointerdown', e => { e.preventDefault(); activateDouble(); });
$('torpedoBtn').addEventListener('pointerdown', e => { e.preventDefault(); activateTorpedo(); });

canvas.addEventListener('pointerdown', e => {
  if (!running || paused) return;
  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;
  // tap near enemy to fire burst
  if (enemy && dist({ x, y }, enemy) < 100) {
    const now = gameNow();
    if (now >= nextPlayerShot) {
      fire(player, enemy, false, now < doubleUntil);
      nextPlayerShot = now + playerFireDelay;
    }
  }
});

$('pauseBtn').addEventListener('click', togglePause);
$('resumeBtn').addEventListener('click', togglePause);
$('restartBattleBtn').addEventListener('click', () => {
  paused = false;
  initBattle();
});
$('menuFromPauseBtn').addEventListener('click', () => {
  running = false; paused = false;
  cancelAnimationFrame(animationId);
  animationId = 0;
  showScreen('menu');
});

/* // 19. BUTTON WIRING */
$('playBtn').addEventListener('click', () => {
  ensureAudio();
  startChampionship();
});
$('howtoBtn').addEventListener('click', () => showScreen('howto'));
$('howtoClose').addEventListener('click', () => showScreen('menu'));
$('recordsBtn').addEventListener('click', showRecords);
$('recordsClose').addEventListener('click', () => showScreen('menu'));
$('resetRecordsBtn').addEventListener('click', () => {
  if (confirm('Reset all local records?')) {
    localStorage.removeItem('seaDuel_v11');
    showRecords();
  }
});
$('roundReadyBtn').addEventListener('click', initBattle);
$('continueBtn').addEventListener('click', continueGame);
$('playAgainBtn').addEventListener('click', startChampionship);
$('menuFromChampBtn').addEventListener('click', () => showScreen('menu'));
$('soundToggleMenu').addEventListener('click', toggleSound);
$('soundTogglePause').addEventListener('click', toggleSound);

document.addEventListener('visibilitychange', () => { last = 0; });

/* // 20. START */
showScreen('menu');
updateSoundButtons();

function loop(t) {
  animationId = requestAnimationFrame(loop);
  if (!last) last = t;
  const dt = Math.min((t - last) / 1000, 0.05);
  last = t;
  update(dt);
  draw();
}
