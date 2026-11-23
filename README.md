# SkyScout Tactics — VALORANT Tactical Scouting & Assistant Coach

**Built for Cloud9 × JetBrains: Sky's The Limit Hackathon 2026 (Category 1: VALORANT Tactical Scouting + Bonus AI Workflow Story)**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-00AEEF?style=flat-square)](https://cocvn157.github.io/skyscout-tactics/)
[![License: MIT](https://img.shields.io/badge/License-MIT-10B981?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/React%2019%20%2B%20TypeScript-5.7-38BDF8?style=flat-square)](#architecture)
[![Vitest](https://img.shields.io/badge/Tests-37%20Passed%20(0%20Skipped)-10B981?style=flat-square)](#local-quickstart-windows-powershell--posix)

**SkyScout Tactics** turns raw GRID-compatible VALORANT match telemetry and scrim logs into instant, statistically bounded coaching decisions: interactive 2D SVG round replays, Wilson confidence-bounded opponent tendencies, ranked timeout anti-strat calls, buy-round 2-round Expected Value (EV) simulations, and tamper-evident SHA-256 Coach Prep Sheets.

---

## Live Deployment & Zero-Cost Architecture

- **Live Web App:** https://cocvn157.github.io/skyscout-tactics/
- **Cost & Dependencies:** `$0` runtime cost — runs 100% deterministically in the browser with zero paid LLM APIs or external font/backend dependencies.

---

## Core Capabilities

1. **GRID-Compatible Telemetry Importer & Schema Validator (`src/engine/importer.ts`)**
   - Supports **GRID `seriesState` JSON**, native **`grid-valorant-v1` JSON**, and **flat tactical round CSV**.
   - Performs line- and field-level schema validation with structured diagnostics (`ValidationIssue`).
   - Ships with 3 full multi-round VCT-style tactical datasets (**Ascent** 22 rounds `13–9`, **Haven** 24 rounds `13–11`, **Bind** 20 rounds `13–7`) plus 1-click sample GRID/CSV loaders.

2. **Interactive 2D SVG Tactical Mini-Map Replay (`src/components/TacticalMapView.tsx`)**
   - Accurate normalized `0..100` SVG blueprints for **Ascent**, **Haven** (3 sites), and **Bind** (teleporters).
   - Smooth playback scrubber (`t = 0s .. roundEnd`) interpolating agent movement, highlighting active utility timing windows (smokes, flashes, recon bolts, mollies), kill vectors with First-Blood badges, and match-wide Spike Plant heatmaps.

3. **Opponent Tendency & Anti-Strat Engine (`src/engine/antiStrat.ts`, `src/engine/statistics.ts`)**
   - Computes **95% Wilson score confidence intervals** (`wilsonInterval`) so coaches never overfit small samples.
   - Detects fast-hit (`<30s`) vs late-clock (`55s+`) attack timing splits, low-buy (`eco`/`force`) crunch habits, solo-anchor / lurk exploits, site concentration bias, and post-plant conversion vulnerabilities.
   - Generates **Priority Ranked Round Calls (`P1..P5`)** with clickable round citations (`R1`, `R4`, ...) that deep-link directly back to the 2D SVG Replay.

4. **Economy & Buy-Round What-If Simulator (`src/engine/economy.ts`)**
   - Models VALORANT's exact loss-bonus cascade (`$1,900` → `$2,400` → `$2,900`) and `$3,900` full-buy threshold.
   - Evaluates `Full Eco`, `Half-Buy`, `Force Buy`, and `Full Buy` across 2-Round Expected Wins (`2-Rnd EV`) to prevent double-eco traps, optionally calibrated with the active match's First-Blood and Post-Plant rates.

5. **Tamper-Evident Coach Prep Sheet Export (`src/engine/exporter.ts`)**
   - Exports formatted **Coach Prep Sheet (`.md`)** and canonical **JSON Brief (`.json`)** sealed with a deterministic FIPS 180-4 pure-TypeScript **SHA-256 digest** + built-in one-click verifier.

---

## Architecture

```text
src/
├── types/telemetry.ts          # GRID-compatible domain schema & analytics contracts
├── data/
│   ├── maps.ts                 # Ascent, Haven & Bind normalized 2D SVG map blueprints
│   └── matches.ts              # 3 full VCT-style multi-round scouting fixtures (66 rounds total)
├── engine/
│   ├── statistics.ts           # Match analytics, timing buckets, utility windows, Wilson 95% CI
│   ├── antiStrat.ts            # Opponent tendency detection & ranked round-call generator
│   ├── economy.ts              # Loss-bonus cascade & 2-round EV buy-round simulator
│   ├── importer.ts             # GRID seriesState / JSON / CSV parser & validator
│   └── exporter.ts             # Markdown Coach Prep Sheet + pure-TS SHA-256 brief signer
├── components/                 # TacticalMapView, TendencyAntiStratView, EconomySimulatorView, ImporterExportView
└── test/                       # Vitest + React Testing Library test suite
```

---

## JetBrains Tooling & AI Workflow Story

- **JetBrains Workspace Config (`.idea/`)**: Configured with clean WebStorm project descriptors (`.idea/skyscout-tactics.iml`, `modules.xml`, `vcs.xml`, `misc.xml`, and npm Run Configurations for `Dev Server` and `Run Vitest Suite`).
- **JetBrains Junie Guidelines (`.junie/guidelines.md`)**: Documents domain schema invariants, statistical Wilson CI constraints, offline-first determinism, and verification commands so Junie can extend maps, tactical rules, or GRID mappers without regressions.

---

## Local Quickstart (Windows PowerShell / POSIX)

```bash
npm install
npx tsc --noEmit
npm test
npm run build
npm run dev
```

*(On Windows PowerShell with restricted execution policies, invoke `npm.cmd` and `npx.cmd`.)*

---

## License

MIT License — see [LICENSE](LICENSE).
