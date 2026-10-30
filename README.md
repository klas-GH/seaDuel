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
| **Normal** | +25% HP, armour (DR), shell damage, speed |
| **Hard** | +50% HP, armour (DR), shell damage, speed |

Pick difficulty on the menu before PLAY. Choice is saved.

## Other features

- Level select — unlock higher start rounds by winning
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
- Enemy shell flight speed scales with difficulty

### v1.5.0
- Difficulty: Easy / Normal (+25%) / Hard (+50%) enemy attributes
- Difficulty selector on intro menu

### v1.4.0
- Level selector; unlock by clearing rounds

### v1.3.0
- Direct aim, coin shop, bosses, multi-enemy

## License

MIT
