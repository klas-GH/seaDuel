# seaDuel v1.1

**COMMAND THE OCEAN. WIN THE CHAMPIONSHIP.**

A polished mobile-friendly naval arcade combat game. Blue player battleship vs red AI enemy on a wrapping ocean. Win 11 rounds (best-of-three battles each) to become champion.

## 🎮 Play now

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
- Best-of-3 battles → 11-round championship
- Progressive fire-rate upgrades
- Intelligent enemy AI (3 difficulty tiers)
- 4 special abilities (Boost, Shield, Double Fire, Torpedo)
- Critical hits
- 4 ocean environments (Tropical → Stormy → Arctic → Sunset)
- Screen shake, particles, trails, muzzle flashes
- Procedural sound effects (Web Audio)
- Optional vibration feedback
- Local high-score records
- Pause / resume / restart
- Fully responsive (phone + desktop)

## Files
- `index.html` — structure & UI
- `style.css` — layout & theme
- `game.js` — full game engine

No frameworks. No external assets. Pure HTML5 Canvas + Vanilla JS.

## Run locally

```bash
python3 -m http.server
```

Then open `http://localhost:8000`

## Version
**v1.1.0** — Full upgrade from v1.0.4
