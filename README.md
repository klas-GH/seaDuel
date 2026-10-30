# seaDuel v1.2.2

**COMMAND THE OCEAN. WIN THE CHAMPIONSHIP.**

A polished mobile-friendly naval arcade combat game. Blue player battleship vs red AI enemy on a wrapping ocean. Win 11 rounds (best-of-three battles each) to become champion.

## Play now

**https://klas-gh.github.io/seaDuel/**

*(If still 404: Settings → Pages → Source → GitHub Actions)*

## Controls

### Keyboard
| Key | Action |
|-----|--------|
| ← → / A D | Steer |
| ↑ / W | Boost |
| Space | Continuous fire |
| Q | Shield |
| E | Double Fire |
| R | Torpedo |
| Esc | Pause |

### Mobile
- Left / Right buttons
- Fire button (or tap near enemy)
- Ability buttons: Boost, Shield, Double Fire, Torpedo

## Features
- 11-round championship, best-of-3 battles
- Progressive fire-rate upgrades
- 4 environments (Tropical, Stormy, Arctic, Sunset)
- 4 abilities: Boost, Shield, Double Fire, Torpedo
- Crits, particles, screen shake, Web Audio SFX
- Pause, local records, mobile + keyboard

## v1.2.2
- READY unlocks after **1.2s** read pause
- Fix desktop combat zoom after first battle (measure canvas only when arena is visible)

## v1.2.0
- Pause-aware ability timers (`gameNow` / `totalPausedMs`)
- Spawn positions 0.28 / 0.72
- Compact UI, double-fire orange projectiles

## Local run
```bash
python -m http.server 8080
# open http://localhost:8080
```
