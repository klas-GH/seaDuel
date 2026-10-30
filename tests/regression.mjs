/**
 * seaDuel v1.5.2 regression tests (Node)
 * Run: node tests/regression.mjs
 */
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const src = readFileSync(path.join(root, 'game.js'), 'utf8');

let failed = 0, passed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('  ✓', msg); }
  else { failed++; console.error('  ✗', msg); }
}

const store = {};
const fakeEl = () => ({
  style: {}, classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} },
  textContent: '', innerHTML: '', disabled: false,
  addEventListener() {}, getBoundingClientRect() { return { width: 800, height: 400, left: 0, top: 0 }; },
  clientWidth: 800, clientHeight: 400, offsetHeight: 400,
  setPointerCapture() {}, querySelectorAll() { return []; }
});
const canvas = {
  getContext: () => ({
    setTransform() {}, fillRect() {}, createLinearGradient() { return { addColorStop() {} }; },
    beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {},
    arc() {}, save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    ellipse() {}, closePath() {}
  }),
  style: {}, width: 800, height: 400,
  addEventListener() {}, getBoundingClientRect() { return { width: 800, height: 400, left: 0, top: 0 }; }
};
const documentStub = {
  querySelector: (sel) => (sel === '#sea' ? canvas : fakeEl()),
  getElementById: () => fakeEl(),
  querySelectorAll: () => [],
  addEventListener() {}
};
const sandbox = {
  console,
  document: documentStub,
  window: {
    addEventListener() {},
    devicePixelRatio: 1,
    innerWidth: 800,
    innerHeight: 600,
    AudioContext: class {
      constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
      createOscillator() {
        return { connect() {}, frequency: { setValueAtTime() {}, linearRampToValueAtTime() {} }, start() {}, stop() {}, type: 'sine' };
      }
      createGain() { return { connect() {}, gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
      resume() {}
    },
    requestAnimationFrame: () => 1,
    cancelAnimationFrame() {},
    localStorage: {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; }
    }
  },
  performance: { now: () => 0 },
  navigator: {},
  Math, JSON, parseInt, parseFloat, setTimeout, clearTimeout, String, Number, Array, Object, Boolean, Error, isFinite
};
sandbox.window.document = documentStub;
sandbox.window.performance = sandbox.performance;
sandbox.globalThis = sandbox;

console.log('\nseaDuel v1.5.2 regression tests\n');
vm.runInNewContext(src + '\nthis.__SD = window.seaDuel;', sandbox);
const SD = sandbox.__SD;

assert(!!SD, 'window.seaDuel exported');
assert(SD.version === '1.5.2', 'version is 1.5.2');
assert(src.includes('amount / dm') || src.includes('amount / difficultyMult'), 'enemy armour DR in damageEnemy');

// v1.5.2
assert(SD.PACE === 0.85, 'PACE is 0.85 (−15% speed)');
assert(SD.COIN_SCALE === 0.67, 'COIN_SCALE is 0.67 (−33% coins)');
assert(SD.GUN3_FROM_ROUND === 9, '3rd gun from round 9');
assert(SD.scaledCoins(100) === 67, 'scaledCoins 100 → 67');
assert(src.includes('continueOnEnter'), 'Enter continues');
assert(src.includes("e.key === 'Enter'"), 'Enter key handler');
{
  vm.runInNewContext('round=8; upgrades.guns=1;', sandbox);
  assert(SD.thirdGunLocked() === true, '3rd gun locked on round 8');
  vm.runInNewContext('round=9; upgrades.guns=1;', sandbox);
  assert(SD.thirdGunLocked() === false, '3rd gun open on round 9');
  vm.runInNewContext('round=3; upgrades.guns=0;', sandbox);
  assert(SD.thirdGunLocked() === false, '2nd cannon not locked early');
  vm.runInNewContext('round=1; upgrades.guns=0;', sandbox);
}

// v1.5.1 polish
assert(src.includes('(start - 1) * 15') || src.includes('(start-1)*15'), 'mid-ladder coin stipend');
assert(src.includes('unlocks') && src.includes('ensureUnlockMap'), 'per-difficulty unlocks');
assert(src.includes('/ difficultyMult()'), 'enemy fire rate scales with difficulty');

assert(src.includes('difficultyMult'), 'difficultyMult present');
assert(SD.MAX_ROUNDS === 12, 'MAX_ROUNDS is 12');

{
  const a = SD.angleToScreen({ x: 100, y: 100 }, { x: 200, y: 100 });
  assert(Math.abs(a) < 0.01, 'angleToScreen right ≈ 0');
  const b = SD.angleToScreen({ x: 200, y: 100 }, { x: 100, y: 100 });
  assert(Math.abs(Math.abs(b) - Math.PI) < 0.01, 'angleToScreen left ≈ π');
  const far = SD.angleToScreen({ x: 10, y: 200 }, { x: 790, y: 200 });
  assert(Math.abs(far) < 0.2, 'far-right aims right (no wrap-left)');
}

assert(Math.abs(SD.distScreen({ x: 0, y: 0 }, { x: 3, y: 4 }) - 5) < 1e-9, 'distScreen 3-4-5');

function countAt(r) {
  return vm.runInNewContext(`round=${r}; enemyCountForRound()`, sandbox);
}
assert(countAt(1) === 1, 'round 1 → 1 enemy');
assert(countAt(6) === 1, 'round 6 boss alone');
assert(countAt(7) === 2, 'round 7 → 2 enemies');
assert(countAt(8) === 2, 'round 8 → 2 enemies');
assert(countAt(9) === 3, 'round 9 → 3 enemies');
assert(countAt(10) === 3, 'round 10 → 3 enemies');
assert(countAt(11) === 3, 'round 11 → 3 enemies');
assert(countAt(12) === 1, 'round 12 boss alone');

assert(vm.runInNewContext('round=6; isBossRound()', sandbox) === true, 'round 6 is boss');
assert(vm.runInNewContext('round=12; isBossRound()', sandbox) === true, 'round 12 is boss');
assert(vm.runInNewContext('round=3; isBossRound()', sandbox) === false, 'round 3 not boss');

assert(Math.abs(vm.runInNewContext('round=1; speedScale()', sandbox) - 1) < 1e-9, 'speedScale r1 = 1');
assert(Math.abs(vm.runInNewContext('round=11; speedScale()', sandbox) - 1.1) < 1e-9, 'speedScale r11 = 1.1');

assert(SD.SHOP.length === 5, '5 shop items');
assert(SD.SHOP.some(i => i.id === 'guns' && i.max === 2), 'guns max +2 (total 3)');
assert(SD.SHOP.every(i => i.cost > 0), 'all shop costs positive');

assert(!/b\.x = wrap\(b\.x/.test(src), 'shots do not wrap x');
assert(src.includes('angleToScreen'), 'uses angleToScreen');
assert(src.includes('b.x += b.vx'), 'shells integrate without wrap');
assert(src.includes('openShop'), 'shop system present');
assert(src.includes('spawnEnemies'), 'multi-enemy spawn present');
assert(src.includes('isBoss'), 'boss flags present');

// Boss scale / guns in source
assert(/round === 6.*scale = 1\.5/.test(src) || /scale = 1\.5.*round === 6/.test(src) || src.includes('scale = 1.5'), 'mini-boss 1.5× scale');
assert(src.includes('scale = 2.5'), 'final boss 2.5× scale');
assert(src.includes('hpMult = 1.5'), 'mini-boss HP ×1.5');
assert(src.includes('hpMult = 2.5'), 'final boss HP ×2.5');
assert(/guns = 4/.test(src), 'final boss dual×2 guns (4)');

// Start with 1 gun; enemy dual after round 3
assert(src.includes('playerGuns = 1'), 'player starts with 1 gun');
assert(/round > 3.*guns = 2/.test(src) || src.includes('guns = 2'), 'enemy dual guns after round 3');

// Shop item IDs
const shopIds = SD.SHOP.map(i => i.id).sort().join(',');
assert(shopIds === 'armour,guns,shells,speed,torpedoes', 'shop has armour/shells/guns/speed/torpedoes');

// Sounds for all actions
['fire', 'torpedo', 'boost', 'shield', 'double', 'hit', 'crit', 'explode', 'coin', 'buy', 'win', 'lose', 'boss', 'champ']
  .forEach(s => assert(src.includes("case '" + s + "'"), 'sound case: ' + s));

// Edge dissolve (no wrap on shells)
assert(src.includes('b.x < -8') || src.includes('b.x < -'), 'shells dissolve at edges');
assert(!/wrap\(b\.x/.test(src), 'no wrap() on projectile x');

// Pause-aware timers
assert(src.includes('gameNow') && src.includes('totalPausedMs'), 'pause-aware timers');

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
