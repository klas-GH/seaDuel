
/* // 1. CANVAS AND ELEMENTS */

const canvas = document.querySelector('#sea');
const ctx = canvas.getContext('2d');

const $ = id => document.getElementById(id);

const playerHP = $('playerHP');
const enemyHP = $('enemyHP');

let W = 0, H = 0, DPR = 1;

let player, enemy;
let shots = [], particles = [];


/* // 2. GAME SETTINGS */

const MAX_ROUNDS = 11;
const MAX_HP = 100;

const PLAYER_BASE_FIRE = 660;
const PLAYER_FIRE_UPGRADE = 35;

const ENEMY_FIRE_DELAY = 950;

const PLAYER_SPEED = 105;
const TURN_SPEED = 1.15;
const BOOST_SPEED = 210;

let playerFireDelay = PLAYER_BASE_FIRE;


/* // 3. GAME STATE */

let round = 1;

let playerRounds = 0;
let enemyRounds = 0;

let playerBattles = 0;
let enemyBattles = 0;

let playerHPValue = MAX_HP;
let enemyHPValue = MAX_HP;

let running = false;
let waiting = false;
let championFinished = false;

let left = false;
let right = false;
let space = false;

let boostUntil = 0;
let boostReady = 0;

let nextPlayerShot = 0;
let enemyNextShot = 0;

let last = 0;
let oceanTime = 0;
let animationId = 0;

let score = 0;


/* // 4. RESIZE AND HELPERS */

function wrap(n, max) {
  return ((n % max) + max) % max;
}

function distance(a, b) {
  let dx = Math.abs(a.x - b.x);
  let dy = Math.abs(a.y - b.y);

  dx = Math.min(dx, W - dx);
  dy = Math.min(dy, H - dy);

  return Math.hypot(dx, dy);
}

function resize() {
  const r = canvas.getBoundingClientRect();

  DPR = Math.min(window.devicePixelRatio || 1, 2);

  W = r.width;
  H = r.height;

  canvas.width = W * DPR;
  canvas.height = H * DPR;

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  if (player) {
    player.x = wrap(player.x, W);
    player.y = wrap(player.y, H);
  }

  if (enemy) {
    enemy.x = wrap(enemy.x, W);
    enemy.y = wrap(enemy.y, H);
  }
}

window.addEventListener('resize', resize);


/* // 5. SHIP CREATION */

function makeShip(x, y, heading) {
  return {
    x, y, heading,
    phase: Math.random() * 6
  };
}


/* // 6. HEALTH UI */

function updateHealthUI() {
  playerHP.style.width = playerHPValue + '%';
  enemyHP.style.width = enemyHPValue + '%';

  $('playerHPText').textContent =
    playerHPValue + '%';

  $('enemyHPText').textContent =
    enemyHPValue + '%';

  playerHP.style.background =
    playerHPValue <= 25 ? '#ff4242' : '#29b7ff';

  enemyHP.style.background =
    enemyHPValue <= 25 ? '#ff4242' : '#ff4545';
}

function updateBattleUI() {
  $('round').textContent = round;

  $('score').textContent =
    playerRounds;

  $('battleScore').textContent =
    playerBattles + ' - ' + enemyBattles;
}


/* // 7. INITIALIZE BATTLE */

function initBattle() {
  resize();

  player = makeShip(
    W * .5,
    H * .76,
    -3 * Math.PI / 4
  );

  enemy = makeShip(
    W * .5,
    H * .23,
    Math.PI / 4
  );

  shots = [];
  particles = [];

  playerHPValue = MAX_HP;
  enemyHPValue = MAX_HP;

  left = false;
  right = false;
  space = false;

  boostUntil = 0;
  boostReady = 0;

  nextPlayerShot = 0;

  enemyNextShot =
    performance.now() + 1500;

  oceanTime = 0;

  updateHealthUI();
  updateBattleUI();

  $('message').style.display = 'none';

  running = true;
  waiting = false;

  last = 0;

  cancelAnimationFrame(animationId);

  animationId = requestAnimationFrame(loop);
}


/* // 8. START GAME */

function startGame() {
  round = 1;

  playerRounds = 0;
  enemyRounds = 0;

  playerBattles = 0;
  enemyBattles = 0;

  score = 0;

  championFinished = false;

  setLevel();

  initBattle();
}


/* // 9. LEVEL UPGRADES */

function setLevel() {
  // Each new round improves player firing speed.
  playerFireDelay = Math.max(
    280,
    PLAYER_BASE_FIRE -
    (round - 1) * PLAYER_FIRE_UPGRADE
  );
}


/* // 10. FIRING SYSTEM */

function fire(shooter, target, isEnemy) {
  const dx =
    wrap(target.x - shooter.x + W / 2, W) - W / 2;

  const dy =
    wrap(target.y - shooter.y + H / 2, H) - H / 2;

  const angle = Math.atan2(dy, dx);

  const speed = isEnemy ? 240 : 370;

  [-1, 1].forEach(side => {
    const px =
      shooter.x +
      Math.cos(angle + Math.PI / 2) * 17 * side;

    const py =
      shooter.y +
      Math.sin(angle + Math.PI / 2) * 17 * side;

    shots.push({
      x: wrap(px, W),
      y: wrap(py, H),

      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,

      enemy: isEnemy,
      life: 4
    });
  });

  particles.push({
    x: shooter.x,
    y: shooter.y,
    life: .2,
    color: '#ffe28a'
  });
}


/* // 11. SHIP DRAWING */

function drawShip(s, color) {
  ctx.save();

  ctx.translate(s.x, s.y);
  ctx.rotate(s.heading + Math.PI / 2);

  // Shadow
  ctx.fillStyle = '#001b30aa';

  ctx.beginPath();
  ctx.ellipse(3, 5, 19, 29, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hull
  ctx.fillStyle = color;
  ctx.strokeStyle = '#d6f5ff';
  ctx.lineWidth = 1.5;

  ctx.beginPath();

  ctx.moveTo(0, -27);
  ctx.lineTo(15, -8);
  ctx.lineTo(13, 20);
  ctx.lineTo(0, 27);
  ctx.lineTo(-13, 20);
  ctx.lineTo(-15, -8);

  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Deck
  ctx.fillStyle = '#b7c8cb';
  ctx.fillRect(-7, -7, 14, 19);

  ctx.fillStyle = '#435a68';
  ctx.fillRect(-6, -5, 12, 8);

  // Cannons
  [-1, 1].forEach(side => {
    ctx.fillStyle = '#303a43';
    ctx.fillRect(side * 11 - 2, -11, 5, 12);

    ctx.fillStyle = '#b9c4c9';

    ctx.beginPath();
    ctx.arc(side * 13, -10, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Bow
  ctx.fillStyle = '#fff';
  ctx.fillRect(-3, -22, 6, 3);

  ctx.restore();
}


/* // 12. OCEAN GRAPHICS */

function drawOcean() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);

  grad.addColorStop(0, '#07506f');
  grad.addColorStop(.5, '#087d98');
  grad.addColorStop(1, '#06466c');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.lineWidth = 1;

  for (let i = 0; i < 17; i++) {
    const y = wrap(i * 65 + oceanTime * 30, H);

    ctx.strokeStyle =
      i % 2 ? '#a5edff18' : '#b8f4ff25';

    ctx.beginPath();

    for (let x = 0; x <= W; x += 8) {
      const yy = y + Math.sin(x * .025 + i) * 5;

      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }

    ctx.stroke();
  }
}


/* // 13. PARTICLE EXPLOSIONS */

function burst(x, y, color) {
  for (let i = 0; i < 9; i++) {
    particles.push({
      x: x + (Math.random() - .5) * 20,
      y: y + (Math.random() - .5) * 20,
      life: .35 + Math.random() * .3,
      color
    });
  }
}


/* // 14. DAMAGE AND BATTLE RESULTS */

function battleOver(winner) {
  if (!running || waiting) return;

  running = false;
  waiting = true;

  cancelAnimationFrame(animationId);

  if (winner === 'player') {
    playerBattles++;
    score += 10;
  } else {
    enemyBattles++;
  }

  updateBattleUI();

  if (playerBattles >= 2) {
    playerRounds++;

    showMessage(
      '🏆 ROUND WON!',
      'You won round ' + round + '!<br>' +
      'Round score: ' + playerRounds +
      ' - ' + enemyRounds
    );

    return;
  }

  if (enemyBattles >= 2) {
    enemyRounds++;

    showMessage(
      '💥 ROUND LOST!',
      'Enemy won round ' + round + '.<br>' +
      'Round score: ' + playerRounds +
      ' - ' + enemyRounds
    );

    return;
  }

  showMessage(
    winner === 'player' ? '🎯 BATTLE WON!' : '💥 BATTLE LOST!',
    'Battles: ' + playerBattles +
    ' - ' + enemyBattles +
    '<br>First to 2 wins takes the round!'
  );
}

function damage(target, amount) {
  if (!running) return;

  if (target === 'player') {
    playerHPValue = Math.max(
      0,
      playerHPValue - amount
    );

    burst(player.x, player.y, '#ff5555');

    if (playerHPValue <= 0) {
      updateHealthUI();
      battleOver('enemy');
      return;
    }

  } else {
    enemyHPValue = Math.max(
      0,
      enemyHPValue - amount
    );

    burst(enemy.x, enemy.y, '#ffe66d');

    if (enemyHPValue <= 0) {
      updateHealthUI();
      battleOver('player');
      return;
    }
  }

  updateHealthUI();
}

function showMessage(title, text) {
  $('messageTitle').textContent = title;
  $('messageText').innerHTML = text;

  $('message').style.display = 'flex';
}


/* // 15. ROUND AND CHAMPIONSHIP PROGRESSION */

function continueGame() {
  if (championFinished) {
    startGame();
    return;
  }

  // A round has been completed.
  if (playerBattles >= 2 || enemyBattles >= 2) {

    // Championship finished after round 11.
    if (round >= MAX_ROUNDS) {
      finishChampionship();
      return;
    }

    round++;

    playerBattles = 0;
    enemyBattles = 0;

    setLevel();

    $('hint').textContent =
      'LEVEL ' + round + ' — FIRE FASTER! ⚡';

    initBattle();
    return;
  }

  // Another battle in the same round.
  initBattle();
}

function finishChampionship() {
  running = false;
  waiting = true;
  championFinished = true;

  cancelAnimationFrame(animationId);

  if (playerRounds > enemyRounds) {
    showMessage(
      '🏆 YOU ARE THE CHAMPION!',
      'Congratulations!<br><br>' +
      'You defeated the enemy!<br>' +
      'Final score: ' +
      playerRounds + ' - ' + enemyRounds +
      '<br><br>ALL 11 ROUNDS COMPLETED!'
    );

  } else if (enemyRounds > playerRounds) {
    showMessage(
      '💀 ENEMY CHAMPION!',
      'The enemy won the championship!<br><br>' +
      'Final score: ' +
      playerRounds + ' - ' + enemyRounds +
      '<br><br>Try again!'
    );

  } else {
    showMessage(
      '🤝 CHAMPIONSHIP DRAW!',
      'Both ships finished with ' +
      playerRounds + ' round wins!<br><br>' +
      'Play again to decide the champion!'
    );
  }

  $('continueBtn').textContent = '↻ PLAY AGAIN';
}


/* // 16. MAIN GAME UPDATE */

function update(dt, time) {
  oceanTime += dt;

  const boosting = time < boostUntil;

  const speed = boosting
    ? BOOST_SPEED
    : PLAYER_SPEED;

  // Player steering
  if (left) player.heading -= TURN_SPEED * dt;
  if (right) player.heading += TURN_SPEED * dt;

  // Player movement
  player.x = wrap(
    player.x + Math.cos(player.heading) * speed * dt,
    W
  );

  player.y = wrap(
    player.y + Math.sin(player.heading) * speed * dt,
    H
  );

  // Enemy movement
  enemy.phase += dt * (.9 + round * .035);

  const enemyVX = Math.cos(enemy.phase) * (35 + round * 2);
  const enemyVY = 55 + round * 3;

  enemy.x = wrap(enemy.x + enemyVX * dt, W);
  enemy.y = wrap(enemy.y + enemyVY * dt, H);

  enemy.heading = Math.atan2(enemyVY, enemyVX);

  // Player continuous firing
  if (space && time >= nextPlayerShot) {
    fire(player, enemy, false);
    nextPlayerShot = time + playerFireDelay;
  }

  // Enemy firing
  if (time >= enemyNextShot) {
    fire(enemy, player, true);

    enemyNextShot =
      time + Math.max(500, ENEMY_FIRE_DELAY - round * 20)
      + Math.random() * 400;
  }

  // Projectile movement and collision
  for (let i = shots.length - 1; i >= 0; i--) {
    const b = shots[i];

    b.x = wrap(b.x + b.vx * dt, W);
    b.y = wrap(b.y + b.vy * dt, H);

    b.life -= dt;

    if (b.life <= 0) {
      shots.splice(i, 1);
      continue;
    }

    const target = b.enemy ? player : enemy;

    if (distance(b, target) < 19) {
      if (b.enemy) {
        damage('player', 5);
      } else {
        damage('enemy', 5);
      }

      shots.splice(i, 1);
    }
  }

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].life -= dt;

    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }
}


/* // 17. RENDER GAME */

function draw() {
  drawOcean();

  // Projectiles
  shots.forEach(b => {
    ctx.fillStyle = b.enemy ? '#ff4242' : '#ffe45b';

    ctx.shadowBlur = 10;
    ctx.shadowColor = ctx.fillStyle;

    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  });

  drawShip(enemy, '#e63d43');
  drawShip(player, '#258bea');

  // Particles
  particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life * 2);

    ctx.fillStyle = p.color;

    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
}


/* // 18. BOOST SYSTEM */

function activateBoost() {
  const now = performance.now();

  if (!running || now < boostReady) return;

  boostUntil = now + 2000;
  boostReady = now + 62000;
}

function updateBoostUI(time) {
  const remaining = Math.max(0, boostReady - time);

  $('boost').disabled = remaining > 0;

  if (time < boostUntil) {
    $('cooldown').textContent = 'BOOSTING!';
  } else if (remaining <= 0) {
    $('cooldown').textContent = 'READY';
  } else {
    $('cooldown').textContent =
      Math.ceil(remaining / 1000) + 's';
  }
}


/* // 19. GAME LOOP */

function loop(time) {
  if (!running) return;

  if (document.hidden) {
    last = 0;
    animationId = requestAnimationFrame(loop);
    return;
  }

  if (!last) last = time;

  const dt = Math.min((time - last) / 1000, .04);

  last = time;

  update(dt, time);
  draw();
  updateBoostUI(time);

  animationId = requestAnimationFrame(loop);
}


/* // 20. KEYBOARD CONTROLS */

window.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();

  if ([
    'arrowleft', 'arrowright', 'arrowup',
    ' ', 'a', 'd', 'w'
  ].includes(key)) {
    e.preventDefault();
  }

  if (key === 'arrowleft' || key === 'a') left = true;
  if (key === 'arrowright' || key === 'd') right = true;

  if ((key === 'arrowup' || key === 'w') && !e.repeat) {
    activateBoost();
  }

  if (key === ' ') space = true;
});

window.addEventListener('keyup', e => {
  const key = e.key.toLowerCase();

  if (key === 'arrowleft' || key === 'a') left = false;
  if (key === 'arrowright' || key === 'd') right = false;
  if (key === ' ') space = false;
});

window.addEventListener('blur', () => {
  left = false;
  right = false;
  space = false;
});


/* // 21. TOUCH CONTROLS */

function hold(id, setter) {
  const button = $(id);

  button.addEventListener('pointerdown', e => {
    e.preventDefault();

    setter(true);

    try {
      button.setPointerCapture(e.pointerId);
    } catch (_) {}
  });

  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => {
    button.addEventListener(ev, () => setter(false));
  });
}

hold('left', v => left = v);
hold('right', v => right = v);

$('boost').addEventListener('pointerdown', e => {
  e.preventDefault();
  activateBoost();
});


/* // 22. TAP ENEMY TO FIRE */

canvas.addEventListener('pointerdown', e => {
  if (!running) return;

  const r = canvas.getBoundingClientRect();

  const x = e.clientX - r.left;
  const y = e.clientY - r.top;

  if (distance({ x, y }, enemy) < 43) {
    const now = performance.now();

    if (now >= nextPlayerShot) {
      fire(player, enemy, false);
      nextPlayerShot = now + playerFireDelay;
    }

    burst(enemy.x, enemy.y, '#ffe66d');
  }
});


/* // 23. BUTTON ACTIONS */

$('continueBtn').addEventListener('click', continueGame);


/* // 24. PAUSE TIMING WHEN TAB CHANGES */

document.addEventListener('visibilitychange', () => {
  last = 0;
});


/* // 25. START */

startGame();
