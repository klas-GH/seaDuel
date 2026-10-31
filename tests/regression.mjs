/**
 * seaDuel v1.6.0 regression tests (Node)
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

console.log('\nseaDuel v1.6.0 regression tests\n');
vm.runInNewContext(src + '\nthis.__SD = window.seaDuel;', sandbox);
const SD = sandbox.__SD;

assert(!!SD, 'window.seaDuel exported');
assert(SD.version === '1.6.2', 'version is 1.6.2');
assert(src.includes('amount / dm') || src.includes('armourMult'), 'enemy armour DR present');
assert(src.includes('playerBattles >= 2'), 'best of 3 (2 wins) kept');
assert(src.includes('Best of 3'), 'Best of 3 UI text kept');

// v1.6
assert(SD.DIFFICULTIES.normal.mult === 1.4, 'Normal mult 1.40');
assert(SD.DIFFICULTIES.hard.mult === 1.8, 'Hard mult 1.80');
assert(Math.abs(SD.armourMult() - 1) < 1e-9, 'armourMult easy = 1');
vm.runInNewContext("selectedDifficulty='normal'", sandbox);
assert(Math.abs(SD.armourMult() - 1.2) < 1e-9, 'armourMult normal = 1.2 (half of +40%)');
vm.runInNewContext("selectedDifficulty='hard'", sandbox);
assert(Math.abs(SD.armourMult() - 1.4) < 1e-9, 'armourMult hard = 1.4 (half of +80%)');
vm.runInNewContext("selectedDifficulty='easy'", sandbox);

assert(SD.PACE === 0.85, 'PACE 0.85');
assert(SD.COIN_SCALE === 0.67, 'COIN_SCALE 0.67');
assert(SD.GUN3_FROM_ROUND === 9, '3rd gun from round 9');
assert(src.includes('PLAYER_BASE_FIRE = 780'), 'slower player fire start');
assert(src.includes('PLAYER_FIRE_UPGRADE = 16'), 'slower player fire climb');
assert(src.includes('shellDamage = 7') || src.includes('Math.round(7 *'), 'player shells base 7');
assert(src.includes('projectileSpeed'), 'enemy shells use projectileSpeed');
assert(src.includes('continueOnEnter'), 'Enter continues');

assert(!!SD.ROLES.hunter && !!SD.ROLES.gunner && !!SD.ROLES.brute, 'three roles');
assert(SD.ABILITIES.length === 4, '4 abilities');
vm.runInNewContext('round=2; loadout=["boost","shield"]', sandbox);
assert(SD.roleForSlot(0, 1) === 'hunter', 'R2 solo → hunter');
vm.runInNewContext('round=5', sandbox);
assert(SD.roleForSlot(0, 1) === 'gunner', 'R5 solo → gunner');
vm.runInNewContext('round=6', sandbox);
assert(SD.roleForSlot(0, 1) === 'brute', 'R6 boss → brute');
vm.runInNewContext('round=9', sandbox);
assert(SD.roleForSlot(0, 3) === 'hunter', 'R9 fleet slot0 hunter');
assert(SD.roleForSlot(1, 3) === 'gunner', 'R9 fleet slot1 gunner');
assert(SD.roleForSlot(2, 3) === 'brute', 'R9 fleet slot2 brute');
vm.runInNewContext('loadout=["boost","shield"]', sandbox);
assert(SD.hasAbility('boost') === true, 'hasAbility boost');
assert(SD.hasAbility('torpedo') === false, 'torpedo locked by default');

// v1.5.x polish still present
assert(src.includes('(start - 1) * 15') || src.includes('(start-1)*15'), 'mid-ladder stipend');
assert(src.includes('unlocks') && src.includes('ensureUnlockMap'), 'per-difficulty unlocks');
assert(SD.MAX_ROUNDS === 12, 'MAX_ROUNDS 12');

{
  const a = SD.angleToScreen({ x: 100, y: 100 }, { x: 200, y: 100 });
  assert(Math.abs(a) < 0.01, 'angleToScreen right ≈ 0');
  const b = SD.angleToScreen({ x: 200, y: 100 }, { x: 100, y: 100 });
  assert(Math.abs(Math.abs(b) - Math.PI) < 0.01, 'angleToScreen left ≈ π');
}

function countAt(r) {
  return vm.runInNewContext(`round=${r}; enemyCountForRound()`, sandbox);
}
assert(countAt(1) === 1, 'round 1 → 1');
assert(countAt(6) === 1, 'round 6 boss alone');
assert(countAt(7) === 2, 'round 7 → 2');
assert(countAt(8) === 2, 'round 8 → 2');
assert(countAt(9) === 3, 'round 9 → 3');
assert(countAt(11) === 3, 'round 11 → 3');
assert(countAt(12) === 1, 'round 12 boss alone');

assert(vm.runInNewContext('round=6; isBossRound()', sandbox) === true, 'R6 boss');
assert(vm.runInNewContext('round=12; isBossRound()', sandbox) === true, 'R12 boss');

assert(SD.SHOP.length === 5, '5 shop items');
assert(SD.SHOP.some(i => i.id === 'guns' && i.max === 2), 'guns max +2');
assert(src.includes('openShop'), 'shop present');
assert(src.includes('thirdGunLocked'), '3rd gun lock');
assert(!/wrap\(b\.x/.test(src), 'no wrap on shell x');

['fire', 'torpedo', 'boost', 'shield', 'double', 'hit', 'crit', 'coin', 'buy', 'win', 'lose', 'boss', 'champ']
  .forEach(s => assert(src.includes("case '" + s + "'"), 'sound: ' + s));

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
