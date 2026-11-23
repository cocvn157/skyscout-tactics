import { useMemo, useState } from 'react';
import {
  Coins,
  Crosshair,
  MapPin,
  Radar,
  ShieldAlert,
  UploadCloud,
} from 'lucide-react';
import { EconomySimulatorView } from './components/EconomySimulatorView';
import { ImporterExportView } from './components/ImporterExportView';
import { TacticalMapView } from './components/TacticalMapView';
import { TendencyAntiStratView } from './components/TendencyAntiStratView';
import { MAP_BLUEPRINTS } from './data/maps';
import { BUILTIN_MATCHES } from './data/matches';
import { analyzeOpponentTendencies } from './engine/antiStrat';
import { simulateEconomyDecision } from './engine/economy';
import { computeMatchAnalytics, formatPct } from './engine/statistics';
import type { EconomySimInput, MatchSeries } from './types/telemetry';

type ActiveTab = 'replay' | 'antistrat' | 'economy' | 'import';

const DEFAULT_ECONOMY_INPUT: EconomySimInput = {
  ourAvgCredits: 3050,
  enemyAvgCredits: 4650,
  ourLossStreak: 1,
  enemyLossStreak: 0,
  ourDecision: 'eco',
  enemyExpectedBuy: 'full-buy',
  side: 'defense',
  includeMatchBaseline: true,
};

export function App() {
  const [matches, setMatches] = useState<MatchSeries[]>(BUILTIN_MATCHES);
  const [selectedMatchId, setSelectedMatchId] = useState<string>(BUILTIN_MATCHES[0]!.id);
  const [activeTab, setActiveTab] = useState<ActiveTab>('replay');
  const [selectedRoundNum, setSelectedRoundNum] = useState<number>(1);
  const [economyInput, setEconomyInput] = useState<EconomySimInput>(DEFAULT_ECONOMY_INPUT);

  const activeMatch = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) ?? matches[0]!,
    [matches, selectedMatchId],
  );

  const analytics = useMemo(() => computeMatchAnalytics(activeMatch), [activeMatch]);

  const { tendencies, calls } = useMemo(
    () => analyzeOpponentTendencies(activeMatch),
    [activeMatch],
  );

  const economyResult = useMemo(
    () =>
      simulateEconomyDecision({
        ...economyInput,
        matchFirstBloodRate: analytics.firstBloodWinRate.rate,
        matchPostPlantRate: analytics.postPlantWinRate.rate,
      }),
    [economyInput, analytics.firstBloodWinRate.rate, analytics.postPlantWinRate.rate],
  );

  const mapInfo = MAP_BLUEPRINTS[activeMatch.map];

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    const nextMatch = matches.find((m) => m.id === matchId);
    setSelectedRoundNum(nextMatch?.rounds[0]?.roundNumber ?? 1);
  };

  const handleJumpToRound = (roundNum: number) => {
    setSelectedRoundNum(roundNum);
    setActiveTab('replay');
  };

  const handleImportMatch = (imported: MatchSeries) => {
    setMatches((prev) => [imported, ...prev.filter((m) => m.id !== imported.id)]);
    setSelectedMatchId(imported.id);
    setSelectedRoundNum(imported.rounds[0]?.roundNumber ?? 1);
  };

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="topbar">
        <div className="brand-group">
          <div className="brand-logo" aria-hidden="true">
            <Radar size={22} />
          </div>
          <div>
            <h1 className="brand-title">
              SkyScout Tactics
              <span className="badge badge-c9">Cloud9 × JetBrains</span>
              <span className="badge badge-slate">GRID-Compat v1</span>
            </h1>
            <p className="brand-sub">
              VALORANT Tactical Scouting, 2D SVG Replay, Statistical Anti-Strat & Economy EV Engine
            </p>
          </div>
        </div>

        <div className="match-controls">
          <label htmlFor="match-selector" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Active Series:
          </label>
          <select
            id="match-selector"
            className="select-control"
            value={activeMatch.id}
            onChange={(e) => handleSelectMatch(e.target.value)}
          >
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {MAP_BLUEPRINTS[m.map].name} — {m.teamC9Name} vs {m.opponentTag} ({m.finalScore.c9}–{m.finalScore.opp})
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav-tabs" aria-label="Primary sections">
        <button
          type="button"
          className={`nav-tab ${activeTab === 'replay' ? 'active' : ''}`}
          onClick={() => setActiveTab('replay')}
        >
          <MapPin size={16} />
          Tactical Map &amp; Replay
        </button>
        <button
          type="button"
          className={`nav-tab ${activeTab === 'antistrat' ? 'active' : ''}`}
          onClick={() => setActiveTab('antistrat')}
        >
          <ShieldAlert size={16} />
          Tendencies &amp; Anti-Strat ({calls.length})
        </button>
        <button
          type="button"
          className={`nav-tab ${activeTab === 'economy' ? 'active' : ''}`}
          onClick={() => setActiveTab('economy')}
        >
          <Coins size={16} />
          Economy Simulator
        </button>
        <button
          type="button"
          className={`nav-tab ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          <UploadCloud size={16} />
          GRID Importer &amp; Export
        </button>
      </nav>

      {/* KPI Telemetry Strip */}
      <section className="kpi-grid" aria-label="Series key performance metrics">
        <div className="kpi-card">
          <span className="kpi-label">Match Scoreline · {mapInfo.name}</span>
          <div className="kpi-value">
            <span className="mono">
              {activeMatch.finalScore.c9} – {activeMatch.finalScore.opp}
            </span>
            <span className="badge badge-c9">{activeMatch.source}</span>
          </div>
          <span className="kpi-meta">
            {activeMatch.tournament} ({analytics.totalRounds} rounds)
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Side Win Split (ATK / DEF)</span>
          <div className="kpi-value mono">
            <span>{formatPct(analytics.c9AttackStats.rate)}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/</span>
            <span style={{ color: 'var(--c9-cyan)' }}>{formatPct(analytics.c9DefenseStats.rate)}</span>
          </div>
          <span className="kpi-meta">
            ATK {analytics.c9AttackStats.successes}/{analytics.c9AttackStats.total} · DEF{' '}
            {analytics.c9DefenseStats.successes}/{analytics.c9DefenseStats.total}
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">First Blood &amp; Post-Plant (95% CI)</span>
          <div className="kpi-value mono">
            <span>FB {formatPct(analytics.firstBloodWinRate.rate)}</span>
            <span style={{ color: '#34d399', fontSize: '0.95rem' }}>
              PP {formatPct(analytics.postPlantWinRate.rate)}
            </span>
          </div>
          <span className="kpi-meta">
            FB CI [{formatPct(analytics.firstBloodWinRate.low)}–{formatPct(analytics.firstBloodWinRate.high)}]
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">
            <Crosshair size={12} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
            {activeMatch.opponentTag} Avg Exec &amp; Top Call
          </span>
          <div className="kpi-value mono">
            <span>{analytics.avgOppExecuteSec !== null ? `${analytics.avgOppExecuteSec}s` : '—'}</span>
            <span className="badge badge-emerald">{tendencies.length} Signals</span>
          </div>
          <span className="kpi-meta">
            Top P1: {calls[0]?.callTitle ?? 'Inspect Anti-Strat tab'}
          </span>
        </div>
      </section>

      {/* Active Workspace */}
      <main>
        {activeTab === 'replay' && (
          <TacticalMapView
            match={activeMatch}
            analytics={analytics}
            selectedRoundNum={selectedRoundNum}
            onSelectRound={setSelectedRoundNum}
          />
        )}
        {activeTab === 'antistrat' && (
          <TendencyAntiStratView
            match={activeMatch}
            analytics={analytics}
            tendencies={tendencies}
            calls={calls}
            onJumpToRound={handleJumpToRound}
          />
        )}
        {activeTab === 'economy' && (
          <EconomySimulatorView
            match={activeMatch}
            input={economyInput}
            result={economyResult}
            onChangeInput={setEconomyInput}
          />
        )}
        {activeTab === 'import' && (
          <ImporterExportView
            match={activeMatch}
            analytics={analytics}
            tendencies={tendencies}
            calls={calls}
            economyResult={economyResult}
            onImportMatch={handleImportMatch}
          />
        )}
      </main>

      <footer className="footer-bar">
        <span>
          SkyScout Tactics · Deterministic Local Engine ($0 external APIs) · Built for Cloud9 × JetBrains Sky&apos;s The Limit 2026
        </span>
        <span className="mono">
          Schema: {activeMatch.schemaVersion} · Active: {activeMatch.id}
        </span>
      </footer>
    </div>
  );
}

export default App;
