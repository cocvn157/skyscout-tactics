import { Coins, ShieldCheck, TrendingUp } from 'lucide-react';
import {
  FULL_BUY_THRESHOLD,
  LOSS_BONUS_LADDER,
} from '../engine/economy';
import type {
  EconomyDecision,
  EconomySimInput,
  EconomySimResult,
  MatchSeries,
} from '../types/telemetry';

interface EconomySimulatorViewProps {
  match: MatchSeries;
  input: EconomySimInput;
  result: EconomySimResult;
  onChangeInput: (next: EconomySimInput) => void;
}

const DECISIONS: Array<{ id: EconomyDecision; label: string }> = [
  { id: 'eco', label: 'Full Eco (~$400)' },
  { id: 'half-buy', label: 'Half-Buy (~$1,950)' },
  { id: 'force', label: 'Force Buy (~$3,150)' },
  { id: 'full-buy', label: 'Full Buy (~$4,350)' },
];

export function EconomySimulatorView({
  match,
  input,
  result,
  onChangeInput,
}: EconomySimulatorViewProps) {
  const maxEv = Math.max(1.5, ...result.allBranches.map((b) => b.twoRoundExpectedWins));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Recommendation Banner */}
      <section className="panel" aria-label="Economy recommendation summary">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">
              <Coins size={18} color="var(--amber)" />
              {result.recommendationHeadline}
            </h2>
            <p className="panel-subtitle">{result.rationale}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className="badge badge-amber">
              Next Loss Bonus: ${result.nextLossBonusCredits.toLocaleString('en-US')}
            </span>
            <span className="badge badge-c9">
              Full Buy Line: ${FULL_BUY_THRESHOLD.toLocaleString('en-US')}
            </span>
          </div>
        </div>

        {/* Loss-Bonus Cascade Ladder */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '8px',
          }}
        >
          {LOSS_BONUS_LADDER.map((amount, idx) => {
            const tier = idx + 1;
            const active =
              (input.ourLossStreak === 0 && tier === 1) ||
              (input.ourLossStreak === 1 && tier === 2) ||
              (input.ourLossStreak >= 2 && tier === 3);
            return (
              <div
                key={amount}
                className="item-card"
                style={{
                  padding: '8px 10px',
                  borderColor: active ? 'var(--amber)' : undefined,
                  background: active ? 'rgba(245, 158, 11, 0.1)' : undefined,
                }}
              >
                <span className="kpi-label">Loss Cascade Tier {tier}{tier === 3 ? '+' : ''}</span>
                <strong className="mono" style={{ fontSize: '0.98rem', color: active ? '#fbbf24' : 'var(--text-primary)' }}>
                  ${amount.toLocaleString('en-US')} {active ? '← Next on Loss' : ''}
                </strong>
              </div>
            );
          })}
        </div>
      </section>

      <div className="two-col-grid">
        {/* Interactive Controls */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">What-If Buy-Round Controls</h2>
              <p className="panel-subtitle">
                Adjust per-player credits, loss streak, and opponent expected buy to model 2-round expected wins.
              </p>
            </div>
          </div>

          <div className="data-list">
            <label className="item-card">
              <div className="item-card-header">
                <strong>Our Avg Credits / Player</strong>
                <span className="mono" style={{ color: 'var(--c9-cyan)', fontWeight: 700 }}>
                  ${input.ourAvgCredits.toLocaleString('en-US')} (Team ${(input.ourAvgCredits * 5).toLocaleString('en-US')})
                </span>
              </div>
              <input
                type="range"
                min={1000}
                max={9000}
                step={150}
                value={input.ourAvgCredits}
                onChange={(e) =>
                  onChangeInput({ ...input, ourAvgCredits: Number(e.target.value) })
                }
                className="range-slider"
                aria-label="Our average credits per player"
              />
            </label>

            <label className="item-card">
              <div className="item-card-header">
                <strong>Enemy Avg Credits / Player</strong>
                <span className="mono" style={{ color: '#ff808b', fontWeight: 700 }}>
                  ${input.enemyAvgCredits.toLocaleString('en-US')}
                </span>
              </div>
              <input
                type="range"
                min={1000}
                max={9000}
                step={150}
                value={input.enemyAvgCredits}
                onChange={(e) =>
                  onChangeInput({ ...input, enemyAvgCredits: Number(e.target.value) })
                }
                className="range-slider"
                aria-label="Enemy average credits per player"
              />
            </label>

            <div className="equal-two-grid">
              <div className="item-card">
                <span className="kpi-label">Our Loss Streak</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {([0, 1, 2, 3] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`btn btn-sm btn-toggle ${input.ourLossStreak === s ? 'active' : ''}`}
                      onClick={() => onChangeInput({ ...input, ourLossStreak: s })}
                    >
                      {s === 3 ? '3+ Losses' : `${s} Loss${s === 1 ? '' : 'es'}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="item-card">
                <span className="kpi-label">Active Side & Enemy Buy</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {(['attack', 'defense'] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      className={`btn btn-sm btn-toggle ${input.side === side ? 'active' : ''}`}
                      onClick={() => onChangeInput({ ...input, side })}
                    >
                      {side.toUpperCase()}
                    </button>
                  ))}
                  <select
                    className="select-control"
                    style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                    value={input.enemyExpectedBuy}
                    onChange={(e) =>
                      onChangeInput({
                        ...input,
                        enemyExpectedBuy: e.target.value as EconomySimInput['enemyExpectedBuy'],
                      })
                    }
                    aria-label="Enemy expected buy"
                  >
                    <option value="eco">Enemy: Eco</option>
                    <option value="force">Enemy: Force</option>
                    <option value="full-buy">Enemy: Full Buy</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="item-card">
              <span className="kpi-label">Test Our Buy Call</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                {DECISIONS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={`btn btn-sm btn-toggle ${input.ourDecision === d.id ? 'active' : ''}`}
                    onClick={() => onChangeInput({ ...input, ourDecision: d.id })}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <label
              className="item-card"
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            >
              <div>
                <strong>Calibrate with {match.teamC9Name} vs {match.opponentTag} Baseline</strong>
                <div className="panel-subtitle">
                  Applies match First-Blood & Post-Plant conversion modifiers.
                </div>
              </div>
              <input
                type="checkbox"
                checked={input.includeMatchBaseline}
                onChange={(e) =>
                  onChangeInput({ ...input, includeMatchBaseline: e.target.checked })
                }
                aria-label="Calibrate with active match baseline"
              />
            </label>
          </div>
        </section>

        {/* Branch Outcome Matrix */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">
                <TrendingUp size={17} color="var(--emerald)" />
                2-Round Expected Win Value & Bankroll Tree
              </h2>
              <p className="panel-subtitle">
                Evaluates current round win probability plus next-round rifle guarantee if lost.
              </p>
            </div>
          </div>

          <div className="data-list">
            {result.allBranches.map((branch) => {
              const isOptimal = branch.decision === result.recommendedDecision;
              const isSelected = branch.decision === input.ourDecision;
              return (
                <div
                  key={branch.decision}
                  className="item-card"
                  style={{
                    borderColor: isOptimal
                      ? 'var(--emerald)'
                      : isSelected
                        ? 'var(--c9-blue)'
                        : undefined,
                  }}
                >
                  <div className="item-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                      <strong>{branch.label}</strong>
                      {isOptimal && (
                        <span className="badge badge-emerald">
                          <ShieldCheck size={12} /> Optimal EV
                        </span>
                      )}
                      {isSelected && <span className="badge badge-c9">Selected</span>}
                    </div>
                    <span className="mono" style={{ fontSize: '0.84rem', fontWeight: 700 }}>
                      2-Rnd EV: {branch.twoRoundExpectedWins.toFixed(2)} wins
                    </span>
                  </div>

                  <div className="bar-track">
                    <div
                      className={isOptimal ? 'bar-fill-emerald' : 'bar-fill-c9'}
                      style={{
                        width: `${Math.min(100, Math.round((branch.twoRoundExpectedWins / maxEv) * 100))}%`,
                      }}
                    />
                  </div>

                  <div
                    className="mono"
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                      fontSize: '0.74rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>Spend: ${branch.spendPerPlayer.toLocaleString('en-US')}</span>
                    <span>Win Prob: {Math.round(branch.currentRoundWinProb * 100)}%</span>
                    <span>If Win: ${branch.nextRoundBankIfWin.toLocaleString('en-US')}</span>
                    <span
                      style={{
                        color: branch.nextRoundFullBuyGuaranteedOnLoss ? '#34d399' : '#ff808b',
                      }}
                    >
                      If Loss: ${branch.nextRoundBankIfLoss.toLocaleString('en-US')} (
                      {branch.nextRoundFullBuyGuaranteedOnLoss ? 'Full Buy OK' : 'Broken Buy'})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
