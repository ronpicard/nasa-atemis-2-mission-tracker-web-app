# Artemis II Mission Tracker

A fan-built **mission control–style dashboard** for **Artemis II**: clocks, a **3D Earth–Moon trajectory** (React Three Fiber), live-style **telemetry**, **MET replay**, NASA **news wire**, briefing and transcript panels, and links to official coverage.

**Not affiliated with NASA.** Use [NASA’s official tracker](https://www.nasa.gov/trackartemis) for authoritative mission status.

## Live site

**[ronpicard.github.io/nasa-atemis-2-mission-tracker-web-app](https://ronpicard.github.io/nasa-atemis-2-mission-tracker-web-app/)**

Served from GitHub Pages (`gh-pages` branch). Deploy from this repo with `npm run deploy` (see below).

## What’s in the app

- **Clocks** — Zulu (UTC) and local time with fractional seconds.
- **3D trajectory** — Illustrative free-return path with Earth (textures, night lights, launch/splashdown markers), Moon, spacecraft model, trail, and sun-oriented lighting.
- **Solar backdrop** — Sun (procedural surface), and other planets placed along today’s Earth→Sun direction at **approximate relative sizes** (schematic positions).
- **Telemetry** — Polls an AROW-style JSON API (configurable); falls back to a **reference timeline** when offline or in replay. Distance/speed/phase, MET with scenario Zulu, optional attitude-style fields.
- **Replay** — Scrub MET on a timeline; jump back to “live” clock mode. After the modeled mission length, clocks/telemetry can keep advancing while the 3D path stays clamped.
- **NASA news** — Fetches the public [nasa.gov feed](https://www.nasa.gov/feed/) directly (CORS-friendly).
- **Mission briefing & transcript** — Static/educational panels; crew portraits where used.
- **Streams** — Links to official streams (no embedded players, for reliability).

## Tech stack

- **React 19** + **TypeScript** + **Vite**
- **Three.js** via **@react-three/fiber** and **@react-three/drei**
- **ESLint** (flat config)

## Environment variables

Create a `.env` (or `.env.local`) in the project root if you need to override defaults:

| Variable | Purpose |
|----------|---------|
| `VITE_ARTEMIS_API_BASE` | Base URL for telemetry JSON (no trailing slash). Default: `https://artemis.cdnspace.ca` |
| `VITE_MISSION_T0` | ISO mission reference epoch for MET / timeline (default is set in `missionTimeline.ts`) |

## Scripts

```bash
npm install
npm run dev      # local dev server
npm run build    # typecheck + production build (root base path)
npm run lint     # ESLint
npm run preview  # serve the production build locally
npm run deploy   # GH Pages build (subpath) + publish to gh-pages branch
```

`npm run deploy` runs `scripts/gh-pages-build.mjs` with `GH_PAGES=true` so Vite uses the base path from `package.json` → `config.gh_pages_base` (`/nasa-atemis-2-mission-tracker-web-app/`).

## Repository

**[github.com/ronpicard/nasa-atemis-2-mission-tracker-web-app](https://github.com/ronpicard/nasa-atemis-2-mission-tracker-web-app)**

## License / disclaimer

This project is an independent educational UI. Orbital geometry, telemetry mirrors, and timelines are **illustrative or third-party** unless noted otherwise. Always rely on **NASA** and **contractor** channels for real mission operations.
