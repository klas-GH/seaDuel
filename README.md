# seaDuel v1.2.4

**COMMAND THE OCEAN. WIN THE CHAMPIONSHIP.**

Mobile-friendly naval arcade combat. Blue player ship vs red AI on a wrapping ocean. Win 11 rounds (best-of-3 battles each) to become champion.

## Play

**https://klas-gh.github.io/seaDuel/**

Local:

```bash
python -m http.server 8080
# open http://localhost:8080
```

## Controls

| Keyboard | Action |
|----------|--------|
| ← → / A D | Steer |
| ↑ / W | Boost |
| Space | Fire cannons |
| Q | Shield |
| E | Double Fire |
| R | Torpedo |
| Esc | Pause |

**Mobile:** Left / Right / Fire buttons + ability bar. Tap near the enemy to fire.

## Gameplay

- **Championship:** 11 rounds. Each round is best of 3 battles.
- **Environments:** Tropical → Stormy → Arctic → Sunset.
- **AI ranks:** Cadet → Captain → Admiral (scales with round).
- **Fire rate** improves as you win rounds.
- **Ships wrap** the ocean edges. **Shells and torpedoes dissolve** at the edge (no wrap).
- **Speed:** slower base start; +1% ship/shell speed each round.

## Abilities

| Ability | Effect | Cooldown |
|---------|--------|----------|
| Boost | Burst speed + trail | 22s |
| Shield | Blocks damage briefly | 25s |
| D-Fire | Multi-shot burst | 28s |
| Torp | Heavy single shot (2 ammo) | short reload |

## Sound (Web Audio)

All actions have SFX (toggle on menu / pause):

- Fire, hit, crit, explode
- Boost, shield, double-fire, torpedo
- Win / lose battle, championship fanfare

## Changelog

### v1.2.4
- Shells & torpedoes dissolve at edges (no re-entry wrap)
- Ship speed −25% at start; +1% per round
- Sound check: fire / torpedo / boost / shield / double / hit / win-lose
- README fully refreshed

### v1.2.3
- Battle-screen zoom fix (canvas size lock)
- Visible PAUSE button in header

### v1.2.2
- READY unlock after 1.2s
- Resize when arena is visible

### v1.2.0
- Pause-aware ability timers
- Spawn positions, compact UI, double-fire visuals

## Files

- `index.html` — UI screens
- `style.css` — layout & mobile
- `game.js` — engine (combat, AI, abilities, audio)

## License

MIT — play and share freely.
