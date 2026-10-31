# seaDuel v1.6.9

**COMMAND THE OCEAN. WIN THE CHAMPIONSHIP.**

Naval arcade — 12-round championship, coin shop, bosses, multi-enemy, **level select**, **difficulty**, **loadout**, **enemy roles**.

## Play

**https://klas-gh.github.io/seaDuel/**

```bash
python -m http.server 8080
```

## Difficulty (v1.6)

| Mode | Enemy stats |
|------|-------------|
| **Easy** | Baseline |
| **Normal** | +40% HP, shell damage, speed, fire rate · armour DR +20% |
| **Hard** | +80% HP, shell damage, speed, fire rate · armour DR +40% |

Armour DR is **half** the difficulty bonus so HP and armour do not fully stack into a sponge.

**Unlocks are per difficulty.** Mid-ladder stipend: `round((N−1)×15×0.67)` coins.

**Pace:** ship / shell / torpedo speeds ×0.85 (from v1.5.2).

## v1.6 combat

- Enemy shells faster than player shells; enemies shoot sooner
- Player fire rate climbs slower (late game is not a laser)
- Player shells hit harder (base 7) so fights stay short
- **Best of 3** still decides each round (2 battle wins)
- **Loadout:** pick 2 of 4 abilities before PLAY (others locked)
- **Roles:** Hunter / Gunner / Brute; fleets mix roles from round 7

## Other features

- Level select · R6 mini-boss · R12 final boss
- 2 enemies on R7–R8 · 3 on R9–R11
- 3rd cannon only from Round 9
- Enter continues on desktop

## Controls

| Key | Action |
|-----|--------|
| ← → / A D | Steer |
| ↑ / W | Boost (if in loadout) |
| Space | Fire |
| Q / E / R | Shield / Double Fire / Torpedo (if in loadout) |
| Esc | Pause |
| Enter | Continue / Play / Resume |

## PWA (v1.6.1)

- **Installable** — works offline via service worker
- **Install banner** appears on desktop browsers that support it
- **Manifest** with app icons and standalone display

## Tests

```bash
node tests/regression.mjs
```

## Changelog

### v1.6.9
- Galaxy A25: intro screen no longer overflows vertically (widened short-phone fit range)
- Regression test fixes for two v1.6.6 assertions

### v1.6.8
- Mobile menu fit: intro screen no longer overflows on narrow / short phones
- Regression test fixes for two v1.6.6 assertions

### v1.6.6
- Version unified to 1.6.6 across HTML / JS / SW / tests
- localStorage key `seaDuel_v16` (migrates from v14 / v13)
- Removed legacy `engine.f*` from service-worker cache (engine already inlined)
- Install banner: fixed top overlay, auto-hides after 3 seconds
- Desktop menu fits fully on one page (no scroll)
- Visual juice: improved ship sprites, continuous wake + boost trail, screen shake on hits / crits / boss

### v1.6.1
- Engine inlined into `game.js` (no fetch needed; works offline)
- PWA support: `manifest.json`, `sw.js`, install banner
- Desktop intro/menu panels now fit the viewport (scrollable, capped height)
- Version bumped to 1.6.1

### v1.6.0
- Pressure: faster enemy fire & shells, slower player fire climb, Normal +40% / Hard +80%
- Armour DR half-stack with HP (no sponge)
- Player shells base damage 7
- Loadout: pick 2 of 4 abilities
- Enemy roles: Hunter, Gunner, Brute (mixed fleets from R7)
- Best of 3 rounds kept

### v1.5.2
- 3rd cannon from Round 9 · fleet of 3 on R9–11 · Enter continue
- Coins −33% · speed −15% · mobile polish

### v1.5.1
- Enemy armour DR · per-difficulty unlocks · mid-ladder stipend

### v1.5.0
- Difficulty Easy / Normal / Hard

### v1.4.0
- Level selector

### v1.3.0
- Direct aim, coin shop, bosses, multi-enemy

## License

MIT
