import { AlertTriangle, Crosshair, ShieldAlert, TrendingUp } from 'lucide-react';
import { formatPct } from '../engine/statistics';
import type {
  AntiStratCall,
  MatchAnalytics,
  MatchSeries,
  OpponentTendency,
  TendencySeverity,
} from '../types/telemetry';

interface TendencyAntiStratViewProps {
  match: MatchSeries;
  analytics: MatchAnalytics;
  tendencies: OpponentTendency[];
  calls: AntiStratCall[];
  onJumpToRound: (roundNumber: number) => void;
}

function severityBadgeClass(sev: TendencySeverity): string {
  if (sev === 'high') return 'badge-red';
  if (sev === 'medium') return 'badge-amber';
  return 'badge-slate';
}

export function TendencyAntiStratView({
  match,
  analytics,
  tendencies,
  calls,
  onJumpToRound,
}: TendencyAntiStratViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Timing Splits & Utility Window Telemetry */}
      <div className="equal-two-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">
                <TrendingUp size={17} color="var(--c9-cyan)" />
                {match.opponentTag} Attack Timing Splits (Wilson 95% CI)
              </h2>
              <p className="panel-subtitle">
                Classifies opponent execute clocks into fast hits (&lt;30s), mid-round (30–54s), and late defaults (55s+).
              </p>
            </div>
          </div>

          <div className="data-list">
            {analytics.oppTimingSplits.map((bucket) => (
              <div key={bucket.bucket} className="item-card">
                <div className="item-card-header">
                  <div>
                    <strong>{bucket.label}</strong>{' '}
                    <span className="mono" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      ({bucket.rangeLabel})
                    </span>
                  </div>
                  <span className="mono" style={{ fontSize: '0.78rem' }}>
                    {bucket.wins}/{bucket.rounds} opp wins ·{' '}
                    {bucket.rounds > 0
                      ? `${formatPct(bucket.winRate.rate)} (CI ${formatPct(bucket.winRate.low)}–${formatPct(bucket.winRate.high)})`
                      : '0 rounds'}
                  </span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill-opp"
                    style={{
                      width: `${bucket.rounds > 0 ? Math.round(bucket.winRate.rate * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">
                <Crosshair size={17} color="var(--amber)" />
                Utility Timing Windows Across Series
              </h2>
              <p className="panel-subtitle">
                Tracks ability saturation across early info, mid control, execute dump, and post-plant phases.
              </p>
            </div>
          </div>

          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Phase Window</th>
                  <th>Clock</th>
                  <th>C9 / {match.opponentTag}</th>
                  <th>Top Utility</th>
                </tr>
              </thead>
              <tbody>
                {analytics.utilityWindows.map((w) => (
                  <tr key={w.window}>
                    <td>
                      <strong>{w.label}</strong>
                    </td>
                    <td className="mono">{w.rangeSec}</td>
                    <td className="mono">
                      <span style={{ color: 'var(--c9-cyan)' }}>{w.c9Count}</span> /{' '}
                      <span style={{ color: '#ff808b' }}>{w.oppCount}</span>
                    </td>
                    <td>{w.topAbility}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Opponent Tendencies & Ranked Anti-Strat Round Calls */}
      <div className="equal-two-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">
                <AlertTriangle size={17} color="var(--val-red)" />
                Detected {match.opponentName} Tendencies
              </h2>
              <p className="panel-subtitle">
                Deterministic pattern detector with exact sample sizes and clickable round evidence.
              </p>
            </div>
            <span className="badge badge-slate">{tendencies.length} Signals</span>
          </div>

          <div className="data-list">
            {tendencies.map((t) => (
              <article key={t.id} className="item-card">
                <div className="item-card-header">
                  <strong style={{ fontSize: '0.9rem' }}>{t.title}</strong>
                  <span className={`badge ${severityBadgeClass(t.severity)}`}>
                    {t.severity} confidence
                  </span>
                </div>
                <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--c9-cyan)' }}>
                  {t.sampleLabel} · Rate {formatPct(t.metric.rate)} · 95% Wilson CI [
                  {formatPct(t.metric.low)}, {formatPct(t.metric.high)}]
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {t.evidenceSummary}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Evidence:</span>
                  {t.supportingRounds.map((rNum) => (
                    <button
                      key={rNum}
                      type="button"
                      className="round-cite-btn"
                      onClick={() => onJumpToRound(rNum)}
                      title={`Jump to Round ${rNum} on 2D Replay`}
                    >
                      R{rNum}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">
                <ShieldAlert size={17} color="var(--emerald)" />
                Ranked Anti-Strat Round Calls
              </h2>
              <p className="panel-subtitle">
                Coach-ready timeout calls ordered by statistical impact and sample strength.
              </p>
            </div>
            <span className="badge badge-emerald">{calls.length} Actionable Calls</span>
          </div>

          <div className="data-list">
            {calls.map((c) => (
              <article key={c.id} className="item-card">
                <div className="item-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="badge badge-c9">P{c.priority}</span>
                    <span className="badge badge-slate">{c.sideContext}</span>
                    <strong style={{ fontSize: '0.92rem' }}>{c.callTitle}</strong>
                  </div>
                </div>
                <div style={{ fontSize: '0.79rem', color: '#fbbf24' }}>
                  <strong>Trigger:</strong> {c.triggerCondition}
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                  {c.executionPlan}
                </p>
                <div style={{ fontSize: '0.77rem', color: '#34d399' }}>
                  <strong>Expected Edge:</strong> {c.expectedGain}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Inspect VOD/2D:</span>
                  {c.supportingRounds.map((rNum) => (
                    <button
                      key={rNum}
                      type="button"
                      className="round-cite-btn"
                      onClick={() => onJumpToRound(rNum)}
                    >
                      R{rNum}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
