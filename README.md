# Straylight 🏎️🌆

A fullstack synthwave night-drive racer. Three.js frontend, Express/JWT backend,
persistent accounts, saved progress, a career/missions mode, unlockable cars
and routes, power-ups, and per-route leaderboards.

## What's in the box

**Frontend** (`public/`) — vanilla JS + Three.js r128, no build step required.
- Procedurally-built hypercar models (4 cars) with underglow, brake lights, spotlights, spoiler, mirrors
- 3 routes with distinct scenery, sky, and weather: Neon Highway (the city route), Sunset Desert, Storm Coast (rain + lightning)
- Postprocessing: bloom (neon glow) + afterimage trail that intensifies with speed/nitro
- Power-ups: nitro boost, shield, coins
- Touch controls for mobile, keyboard for desktop
- Auth screens, garage (car/track/career/leaderboard tabs)

**Backend** (`server/`) — Node + Express.
- JWT-based auth (register/login), passwords hashed with bcrypt
- Progress persistence per account (best distance/speed, coins, unlocked cars/tracks, mission state)
- Mission ("career") evaluation and track-unlock logic runs server-side (`server/progressUtils.js`, `server/missions.js`) so it can't be spoofed by the client
- Per-route leaderboard
- Data stored in a local JSON file via `lowdb` (`server/data/db.json`) — no external database or native build tools required

## Running it

```bash
npm install
npm start
```

Then open **http://localhost:3000**. That's it — the same Express server hosts
both the API (`/api/...`) and the game client.

Guests can play without an account, but progress, unlocks, and leaderboard
entries only save for signed-in accounts.

## Project layout

```
server/
  index.js          Express app entry point
  routes.js         /api/auth, /api/progress, /api/runs, /api/leaderboard, /api/catalog
  auth.js           JWT sign/verify middleware
  db.js             lowdb (JSON file) setup
  missions.js        Mission / track / car catalog (shared source of truth)
  progressUtils.js   Server-side rules for applying a finished run to a player's progress
  data/db.json       The actual data file (safe to delete to reset all data)

public/
  index.html
  css/style.css
  vendor/three/      Three.js + postprocessing addons, vendored locally (no CDN dependency)
  js/
    api.js           Thin fetch wrapper + JWT storage
    auth-ui.js        Login/register/guest screen logic
    catalog.js        Loads mission/track/car catalog from the server, adds client-only visuals
    garage-ui.js       Car/track/career/leaderboard tab UI
    world.js           Sky, fog, road, per-track scenery generation, infinite recycling
    car.js             Procedural hypercar model builder
    traffic.js          AI traffic cars
    powerups.js         Nitro/shield/coin pickups
    weather.js          Rain + lightning for the storm route
    postfx.js           Bloom + afterimage postprocessing pipeline
    main.js             Game loop: input, physics, collisions, scoring, run submission
```

## Adding your own ideas

- **New mission**: add an entry to `MISSIONS` in `server/missions.js` (type: `speed` / `distance` / `nitro` / `runs` / `track`). It'll show up in the Career tab and get evaluated automatically on the next run.
- **New track**: add to `TRACKS` in `server/missions.js` (with an unlock rule) and a matching visual entry in `TRACK_VISUALS` in `public/js/catalog.js` (sky colors, fog, ground, weather, scenery type). Then add a scenery-prop branch in `public/js/world.js` if you want new prop types beyond city/desert/coast.
- **New car**: add to `CARS` in `server/missions.js` and `CAR_VISUALS` in `public/js/catalog.js`. The procedural builder in `public/js/car.js` will use the new colors automatically; tweak geometry there for a genuinely different silhouette.
- **New power-up type**: add to `TYPES` in `public/js/powerups.js` and handle it in `onPickup()` in `public/js/main.js`.

## Deploying

This needs a persistent Node process (not static hosting) since it has a real
backend. Any of these work with no code changes:

- **Render / Railway / Fly.io** — connect the repo, build command `npm install`, start command `npm start`.
- **A VPS** — `npm install && npm start`, put it behind nginx/Caddy for TLS, use `pm2` or a systemd unit to keep it alive.

Two things worth doing before a real deployment:
1. Set a real `JWT_SECRET` environment variable (the code falls back to a dev default otherwise).
2. `server/data/db.json` is a flat file — fine for a personal project or small
   leaderboard, but swap in a real database (Postgres/SQLite) if you expect
   concurrent writes at scale.

