# seaDuel v1.4.0

**COMMAND THE OCEAN. WIN THE CHAMPIONSHIP.**

Naval arcade combat — 12-round championship, coin shop, bosses, multi-enemy fleets, **level select**.

## Play

**https://klas-gh.github.io/seaDuel/**

```bash
python -m http.server 8080
```

## Highlights (v1.4.0)

- **Level select** on the menu — win rounds to unlock higher start levels; jump back in without restarting from R1
- Progress saved in localStorage (`maxUnlocked`)
- Records show highest unlocked round

### From v1.3

- Direct-aim shells (on-screen line only)
- Shells dissolve at edges; ships wrap
- 1-gun start; enemy dual guns from round 4+
- Coin shop: Armour, Shells, Guns (max 3), Speed, Torpedoes
- R6 mini-boss · R12 final boss
- R7–10: 2 enemies · R11: 3 enemies

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

### v1.4.0
- Level selector on intro/menu; unlock by clearing rounds
- Persist max unlocked start level
- Records: highest unlocked round

### v1.3.0
- Direct on-screen aiming, coin shop, bosses, multi-enemy

### v1.2.4
- Shell dissolve, −25% base speed, README refresh

## License

MIT
