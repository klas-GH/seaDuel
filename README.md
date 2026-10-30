# seaDuel

A fast mobile-friendly naval duel mini-game.

Blue ship vs red AI ship on a wrapping ocean. First to 2 battle wins takes the round. 11 rounds decide the champion.

## 🎮 Play now

**https://klas-gh.github.io/seaDuel/**

*(If the link is still 404, enable Pages once — see below.)*

## Controls

**Keyboard**
- `←` `→` or `A` `D` — steer
- `↑` or `W` — boost (2 s, 22 s cooldown)
- `Space` — continuous fire

**Touch / Mobile**
- Left / Right buttons
- Boost button
- Tap near the enemy ship to fire

## Features
- Progressive fire-rate upgrades each round
- Best-of-3 battles → 11-round championship
- Boost with visual glow + trail
- Responsive layout for phone & desktop

## Enable GitHub Pages (one-time)

1. Open the repo → **Settings** → **Pages**
2. Under **Build and deployment** → **Source**, choose **GitHub Actions**
3. Wait ~1 minute for the workflow to finish
4. The game will be live at the link above

Or serve locally:

```bash
python3 -m http.server
```

Then open `http://localhost:8000`

## Version

**v1.0.4** — 22 s boost cooldown, boost visual polish, tap-fire fix, cleanup + Pages deploy.
