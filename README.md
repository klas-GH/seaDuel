# seaDuel v1.6.0

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

Player armour no longer fully stacks with enemy armour (half effect). Enemy shells are faster; your fire rate climbs slower.

## Loadout

Before a run, pick **2 of 4** abilities (Boost, Shield, Double-Fire, Torpedo). The other two stay locked for that championship.

## Enemy roles (from round 7)

Fleets mix **hunter** (closes in), **gunner** (faster shells, keeps range), **brute** (more HP, slower).

## Rules kept from 1.5.2

- Best of 3 battles per round (2 wins)
- 3rd gun unlocks at Round 9
- Enter continues, coin/speed cuts, PACE 0.85

## Controls

| Key | Action |
|-----|--------|
| ← → / A D | Steer |
| ↑ / W | Boost |
| Space | Fire |
| Q | Shield |
| E | Double-Fire |
| R | Torpedo |
| Esc | Pause |
| Enter | Continue |

Touch controls on mobile. Safe-area aware.

## Changelog

### v1.6.0
- **Pressure**: faster enemy shells, earlier fire, slower player fire climb, Normal +40% / Hard +80%
- **Loadout**: pick 2 of 4 abilities before the run
- **Roles**: hunter / gunner / brute mixed from R7
- Best-of-3 kept; armour half-stack; player shells hit harder (base 7)

### v1.5.2
- 3rd gun from Round 9, fleet of 3, Enter, coin/speed cuts, PACE −15%
