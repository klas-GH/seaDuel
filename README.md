# seaDuel v1.5.2

**COMMAND THE OCEAN. WIN THE CHAMPIONSHIP.**

Naval arcade — 12-round championship, coin shop, bosses, multi-enemy, **level select**, **difficulty**.

## Play

**https://klas-gh.github.io/seaDuel/**

```bash
python -m http.server 8080
```

## Difficulty

| Mode | Enemy stats |
|------|-------------|
| **Easy** | Baseline |
| **Normal** | +25% HP, armour (DR), shell damage, speed, fire rate |
| **Hard** | +50% HP, armour (DR), shell damage, speed, fire rate |

Pick difficulty on the menu before PLAY. Choice is saved.

**Unlocks are per difficulty** — clearing Easy does not unlock Hard start levels.

**Mid-ladder stipend:** starting at round N grants `round((N−1)×15×0.67)` coins (v1.5.2 coin cut).

**Pace:** ship, shell, and torpedo speeds are 85% of v1.5.1 (`PACE = 0.85`).

## Other features

- Level select — unlock higher start rounds by winning (per difficulty)
- Direct-aim shells, edge dissolve, coin shop
- R6 mini-boss · R12 final boss
- 2 enemies on R7–R8 · **3 enemies on R9–R11** (bosses stay solo)
- **3rd cannon** can be bought only from Round 9
- **Enter** continues (battle result, shop, round intro, pause, menus)

## Controls

| Key | Action |
|-----|--------|
| ← → / A D | Steer |
| ↑ / W | Boost |
| Space | Fire |
| Q / E / R | Shield / Double Fire / Torpedo |
| Esc | Pause |
| Enter | Continue / Play / Resume |

## Tests

```bash
node tests/regression.mjs
```

## Changelog

### v1.5.2
- 3rd cannon locked until Round 9 (2nd cannon still buyable earlier)
- Fleet of 3 enemies from Round 9 through 11 (R6 and R12 stay solo bosses)
- Enter continues on desktop (results, shop, ready, pause, menus)
- Coin income −33% (battles, round bonus, mid-ladder stipend)
- Movement and projectile speed −15%
- Mobile: scrollable menus, safe-area insets, 44px level buttons

### v1.5.1
- Enemy armour on Normal/Hard: damage taken ÷ mult (true armour DR)
- Enemy shell flight speed + fire rate scale with difficulty
- Per-difficulty level unlocks (Easy / Normal / Hard tracked separately)
- Mid-ladder coin stipend: (startRound−1)×15 before the v1.5.2 scale
- Repo cleanup: obsolete engine chunks removed

### v1.5.0
- Difficulty: Easy / Normal (+25%) / Hard (+50%) enemy attributes
- Difficulty selector on intro menu

### v1.4.0
- Level selector; unlock by clearing rounds

### v1.3.0
- Direct aim, coin shop, bosses, multi-enemy

## License

MIT
