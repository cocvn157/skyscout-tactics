import { describe, expect, it } from 'vitest';
import { BUILTIN_MATCHES } from '../data/matches';
import { analyzeOpponentTendencies } from '../engine/antiStrat';
import type { MatchSeries } from '../types/telemetry';

describe('opponent tendency & anti-strat engine', () => {
  it('identifies NRG late-clock B-Market default and solo-anchor habits on Ascent', () => {
    const ascent = BUILTIN_MATCHES[0]!;
    const { tendencies, calls } = analyzeOpponentTendencies(ascent);

    expect(tendencies.some((t) => t.id === 'tendency-late-exec')).toBe(true);
    expect(tendencies.some((t) => t.id === 'tendency-eco-aggro')).toBe(true);
    expect(tendencies.some((t) => t.id === 'tendency-lurk-anchor')).toBe(true);
    expect(calls[0]!.id).toBe('call-anti-late-exec');
  });

  it('identifies SEN fast <30s C-Long burst pattern on Haven', () => {
    const haven = BUILTIN_MATCHES[1]!;
    const { tendencies, calls } = analyzeOpponentTendencies(haven);

    const fastHit = tendencies.find((t) => t.id === 'tendency-fast-hit');
    expect(fastHit).toBeDefined();
    expect(fastHit!.severity).toBe('high');
    expect(calls.some((c) => c.id === 'call-anti-fast-hit')).toBe(true);
    expect(calls.some((c) => c.callTitle.includes('C'))).toBe(true);
  });

  it('identifies LOUD fast Hookah drops & heavy Site B focus on Bind', () => {
    const bind = BUILTIN_MATCHES[2]!;
    const { tendencies, calls } = analyzeOpponentTendencies(bind);

    expect(tendencies.some((t) => t.id === 'tendency-fast-hit')).toBe(true);
    expect(tendencies.some((t) => t.id === 'tendency-site-bias')).toBe(true);
    expect(calls.length).toBeGreaterThanOrEqual(4);
  });

  it('orders ranked anti-strat calls monotonically by ascending priority', () => {
    for (const match of BUILTIN_MATCHES) {
      const { calls } = analyzeOpponentTendencies(match);
      for (let i = 1; i < calls.length; i += 1) {
        expect(calls[i]!.priority).toBeGreaterThanOrEqual(calls[i - 1]!.priority);
      }
    }
  });

  it('cites only valid round numbers present in the analyzed match', () => {
    for (const match of BUILTIN_MATCHES) {
      const validSet = new Set(match.rounds.map((r) => r.roundNumber));
      const { tendencies, calls } = analyzeOpponentTendencies(match);
      for (const t of tendencies) {
        expect(t.supportingRounds.length).toBeGreaterThan(0);
        for (const r of t.supportingRounds) {
          expect(validSet.has(r)).toBe(true);
        }
      }
      for (const c of calls) {
        expect(c.supportingRounds.length).toBeGreaterThan(0);
        for (const r of c.supportingRounds) {
          expect(validSet.has(r)).toBe(true);
        }
      }
    }
  });

  it('maintains valid Wilson CI ordering low <= rate <= high on every tendency', () => {
    for (const match of BUILTIN_MATCHES) {
      const { tendencies } = analyzeOpponentTendencies(match);
      for (const t of tendencies) {
        expect(t.metric.low).toBeLessThanOrEqual(t.metric.rate);
        expect(t.metric.rate).toBeLessThanOrEqual(t.metric.high);
      }
    }
  });

  it('provides low-confidence preliminary fallback on small 1-round sample', () => {
    const base = BUILTIN_MATCHES[0]!;
    const tinyMatch: MatchSeries = {
      ...base,
      id: 'tiny-sample',
      finalScore: { c9: 1, opp: 0 },
      rounds: [base.rounds[0]!],
    };
    const { tendencies, calls } = analyzeOpponentTendencies(tinyMatch);
    expect(tendencies).toHaveLength(1);
    expect(tendencies[0]!.id).toBe('tendency-small-sample');
    expect(tendencies[0]!.severity).toBe('low');
    expect(calls[0]!.id).toBe('call-baseline-default');
  });
});
