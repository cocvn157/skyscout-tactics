# JetBrains Junie Guidelines — SkyScout Tactics

## Overview
SkyScout Tactics is a deterministic VALORANT tactical scouting & assistant-coach platform designed for **Cloud9 x JetBrains: Sky's The Limit Hackathon 2026 (Category 1)**. It parses GRID-compatible esports telemetry and CSV match logs, visualizes round-by-round executions on an interactive 2D SVG mini-map, detects statistically bounded opponent tendencies (with 95% Wilson confidence intervals), models VALORANT buy-round economy decisions, and exports SHA-256 verified coach prep briefs.

## Repository Architecture
- `src/types/telemetry.ts` — Strongly typed domain contracts (`MatchSeries`, `RoundTelemetry`, `UtilityEvent`, `KillEvent`, `OpponentTendency`, `AntiStratCall`, `EconomySimInput`, `EconomySimResult`).
- `src/data/maps.ts` — Normalized `0..100` SVG blueprints for **Ascent**, **Haven**, and **Bind** (zones, walls, plant boxes, callouts, teleporters).
- `src/data/matches.ts` — Pre-loaded VCT-style multi-round scouting series (`C9 vs NRG` Ascent, `C9 vs SEN` Haven, `C9 vs LOUD` Bind).
- `src/engine/statistics.ts` — Deterministic match metrics, site frequencies, timing buckets (`<30s`, `30–54s`, `55s+`), utility windows, and `wilsonInterval()`.
- `src/engine/antiStrat.ts` — Ranked opponent tendency & round-call counter generator citing exact round numbers.
- `src/engine/economy.ts` — VALORANT loss-bonus ladder (`$1,900` / `$2,400` / `$2,900`), next-round full-buy guarantees (`$3,900` threshold), and 2-round expected-win optimization.
- `src/engine/importer.ts` — Validates and normalizes `grid-valorant-v1` JSON, `GRID seriesState` JSON, and flat tactical CSV rows with line/field diagnostics.
- `src/engine/exporter.ts` — Generates Coach Prep Sheet Markdown and canonical JSON briefs sealed with FIPS 180-4 pure-TypeScript `sha256Hex()`.
- `src/components/` — `TacticalMapView`, `TendencyAntiStratView`, `EconomySimulatorView`, `ImporterExportView`.

## Verification & Workflow Commands
Always run checks from project root (`npm.cmd` / `npx.cmd` on Windows PowerShell):
1. Typecheck: `npx.cmd tsc --noEmit` (must report `0` errors)
2. Test Suite: `npm.cmd test` (Vitest + React Testing Library + jsdom; `0` skipped tests allowed)
3. Production Build: `npm.cmd run build` (outputs static bundle to `dist/`)

## Coding Standards for Contributors & Junie
- Keep all analytics and SHA-256 generation **100% deterministic and offline-capable** (`$0` paid API calls).
- Every detected tendency or anti-strat call must carry sample size `n`, 95% Wilson bounds, and valid `supportingRounds[]`.
- Do not add external font CDNs or unbundled runtime network calls that fail offline or in sandboxed evaluations.
- Preserve responsive layout compatibility for both desktop (`1280x720`) and mobile (`390x844`) viewports with zero horizontal overflow.
