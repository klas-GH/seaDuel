# seaDuel v1.5.1

**COMMAND THE OCEAN. WIN THE CHAMPIONSHIP.**

Naval arcade — 12-round championship, coin shop, bosses, multi-enemy, **level select**, **difficulty**.

## Play

**https://klas-gh.github.io/seaDuel/**

```bash
python -m http.server 8080
```

## Difficulty (v1.5.1)

| Mode | Enemy stats |
|------|-------------|
| **Easy** | Baseline (v1.4 balance) |
| **Normal** | +25% HP, armour (DR), shell damage, speed, fire rate |
| **Hard** | +50% HP, armour (DR), shell damage, speed, fire rate |

Pick difficulty on the menu before PLAY. Choice is saved.

**Unlocks are per difficulty** — clearing Easy does not unlock Hard start levels.

**Mid-ladder stipend:** starting at round N grants `(N−1)×15` coins so you can buy upgrades without replaying from R1.

## Other features

- Level select — unlock higher start rounds by winning (per difficulty)
- Direct-aim shells, edge dissolve, coin shop
- R6 mini-boss · R12 final boss · multi-enemy R7–11

## Controls

| Key | Action |
|-----|--------|
| ← → / A D | Steer |
| ↑ / W | Boost |
| Space | Fire |
| Q / E / R | Shield / Double Fire / Torpedo |
| Esc | Pause |

## Tests

```bash
node tests/regression.mjs
```

## Changelog

### v1.5.1
- Enemy armour on Normal/Hard: damage taken ÷ mult (true armour DR)
- Enemy shell flight speed + fire rate scale with difficulty
- Per-difficulty level unlocks (Easy / Normal / Hard tracked separately)
- Mid-ladder coin stipend: (startRound−1)×15
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
