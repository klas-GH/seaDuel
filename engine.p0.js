/* ============================================================
   seaDuel v1.3.0 — COMMAND THE OCEAN. WIN THE CHAMPIONSHIP.
   ============================================================ */

const canvas = document.querySelector('#sea');
const ctx = canvas.getContext('2d');
const $ = id => document.getElementById(id);
function setText(id, t) { const el = $(id); if (el) el.textContent = t; }
function setHTML(id, h) { const el = $(id); if (el) el.innerHTML = h; }

let W = 0, H = 0, DPR = 1;

const MAX_ROUNDS = 12;
const BASE_HP = 100;
const PLAYER_BASE_FIRE = 660;
const PLAYER_FIRE_UPGRADE = 30;
const MIN_FIRE = 280;
const BASE_PLAYER_SPEED = 83;
const TURN_SPEED = 1.15;
const BASE_BOOST_SPEED = 172;
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