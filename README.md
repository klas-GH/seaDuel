# seaDuel v1.3.0

**COMMAND THE OCEAN. WIN THE CHAMPIONSHIP.**

Naval arcade combat — 12-round championship, coin shop upgrades, bosses, multi-enemy fleets.

## Play

**https://klas-gh.github.io/seaDuel/**

```bash
python -m http.server 8080
```

## Highlights (v1.3.0)

- **Direct-aim shells** — always fire along the on-screen line to the target (no wrap shortcut)
- **Shells dissolve** at edges; ships still wrap
- **Start with 1 gun**; enemy dual guns from round 4+
- **Coin shop** after each round you win: Armour, Shells, Guns (max 3), Speed, Torpedoes
- **Round 6 mini-boss** (1.5× size & HP) · **Round 12 final boss** (2.5× size, 2× guns, 2.5× HP)
- **Rounds 7–10:** 2 enemies · **Round 11:** 3 enemies
- Boss announcements on intro screens

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

### v1.3.0
- Direct on-screen aiming (no wrap fire)
- Gun progression, coin economy + shop
- Bosses on 6 & 12; multi-enemy 7–11
- 12-round championship
- Regression tests

### v1.2.4
- Shell dissolve at edges, −25% base speed, README refresh

## License

MIT
