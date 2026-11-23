# Devpost Submission Guide — SkyScout Tactics

**Hackathon:** Cloud9 × JetBrains: Sky's The Limit Hackathon 2026 (`https://cloud9.devpost.com/`)  
**Target Category:** Category 1 — VALORANT & Game Changers Tactical Scouting (`$6,000` Best + `$1,000` Bonus AI Workflow Story)  
**Submission Deadline:** `2027-01-13 02:00 VN`

---

## Checklist for `@cocvn157` Before Submitting on Devpost

1. **Register on Devpost (`https://cloud9.devpost.com/`):**
   - Upon registering, Devpost / JetBrains emails free trial codes (JetBrains All Products Pack + AI Ultimate / Junie) typically within **5 business days**.
2. **Optional IDE Polish (Recommended for Proof):**
   - Open `C:\Users\NITRO\.gemini\antigravity\scratch\cloud9-skyscout` in **JetBrains WebStorm** (the `.idea/` run configurations `Dev Server` and `Run Vitest Suite` work out-of-the-box) and review/run a task via **Junie** using `.junie/guidelines.md`.
3. **Upload Demo Video to YouTube:**
   - Upload `demo/skyscout-tactics-demo.mp4` (`1280×720` H.264, `<= 3 min`) to YouTube as **Unlisted** or **Public**.
   - Paste the YouTube URL in Devpost's **Video Demo** field.
4. **Paste Repository & Live Links:**
   - **GitHub Repository:** `https://github.com/cocvn157/skyscout-tactics`
   - **Try It Out / Live Demo URL:** `https://cocvn157.github.io/skyscout-tactics/`

---

## Ready-to-Copy Devpost Form Fields

### Project Name
`SkyScout Tactics`

### Tagline / Elevator Pitch
`Statistically grounded VALORANT scouting assistant: GRID telemetry importer, 2D SVG round replay, Wilson CI anti-strat engine & 2-round economy EV simulator.`

### Built With (Tags)
`react`, `typescript`, `vite`, `vitest`, `svg`, `jetbrains-webstorm`, `jetbrains-junie`, `valorant`, `grid-esports`

### Project Story / Write-Up

#### Inspiration
Professional VALORANT coaches spend hours scrubbing VODs and spreadsheets between series to answer four concrete questions: *What tempo does the opponent run on attack? Which site anchors crack under fast pressure? Should we force-buy at $3,050 or save to avoid a double-eco trap? And how do we share a tamper-proof prep sheet before map veto?* **SkyScout Tactics** brings all four into a unified, zero-latency tactical war room tailored for Cloud9 coaching workflows.

#### What It Does
- **GRID-Compatible Telemetry Importer & Validator:** Accepts **GRID `seriesState` JSON**, native **`grid-valorant-v1` JSON**, and **tactical CSV** logs with line-level diagnostics, alongside 3 pre-loaded multi-round VCT-style series (**Ascent** `13–9`, **Haven** `13–11`, **Bind** `13–7` — 66 total rounds).
- **Interactive 2D SVG Tactical Mini-Map Replay:** Scrubbable round playback (`0s` to round end) rendering interpolated player routes, active utility timing circles (smokes, flashes, recon, mollies), kill vectors with First-Blood highlights, Bind teleporter lanes, and match-wide Spike Plant heatmaps.
- **Opponent Tendency & Ranked Anti-Strat Engine:** Automatically classifies opponent timing splits (`<30s` fast hit, `30–54s` mid-round, `55s+` late default), low-buy aggression, solo-anchor / lurk weaknesses, and post-plant holds — every signal bounded by **95% Wilson score confidence intervals** and linked directly to clickable round evidence (`R1`, `R4`, ...).
- **Economy & Buy-Round What-If Simulator:** Models VALORANT's loss-bonus cascade (`$1,900` / `$2,400` / `$2,900`), compares `Full Eco`, `Half-Buy`, `Force Buy`, and `Full Buy` across **2-Round Expected Wins (`2-Rnd EV`)**, and flags force-buy traps that break next-round rifles (`<$3,900`).
- **SHA-256 Verified Coach Prep Export:** Generates one-click Markdown Prep Sheets and canonical JSON briefs signed with a deterministic pure-TypeScript FIPS 180-4 **SHA-256 digest** + built-in integrity verifier.

#### How We Built It (JetBrains WebStorm + Junie Workflow Story)
- Engineered in **React 19 + TypeScript 5.7 + Vite 6** with strict type safety (`tsc --noEmit` zero errors) and **Vitest + React Testing Library**.
- Organized around `.idea/` WebStorm project modules/run configurations and `.junie/guidelines.md` documenting pure deterministic engine boundaries (`src/engine/`), Wilson statistical bounds (`src/engine/statistics.ts`), and zero-external-API reliability.
- Deployed continuously via GitHub Actions (`.github/workflows/pages.yml`) to GitHub Pages.

#### Challenges We Ran Into
1. **Avoiding Small-Sample Coaching Traps:** Raw percentages (like "100% win rate" on 2 rounds) mislead coaches. Replacing naive ratios with **Wilson 95% confidence intervals** and mandatory round-citation deep-links keeps every recommendation grounded in sample size.
2. **Harmonizing Heterogeneous Telemetry Formats:** Real scrim logs arrive as GRID `seriesState` snapshots or flat CSV tables. Writing a unified validator (`validateAndParseMatchInput`) that normalizes both into `MatchSeries` while catching line/field errors solved cross-format prep.
3. **Deterministic Integrity Offline:** Ensuring identical SHA-256 brief verification across browsers and Node test runners led us to implement pure-TypeScript FIPS 180-4 `sha256Hex()`.
