import { describe, expect, it } from 'vitest';
import { BUILTIN_MATCHES } from '../data/matches';
import {
  computeMatchAnalytics,
  formatConfidenceBand,
  formatPct,
  wilsonInterval,
} from '../engine/statistics';

describe('statistics & Wilson confidence intervals', () => {
  it('handles empty sample safely with zeroed interval', () => {
    const w = wilsonInterval(0, 0);
    expect(w).toEqual({ successes: 0, total: 0, rate: 0, low: 0, high: 0 });
    expect(formatConfidenceBand(w)).toBe('n=0 (no sample)');
  });

  it('computes accurate 95% Wilson CI for 10/20 (50%)', () => {
    const w = wilsonInterval(10, 20);
    expect(w.rate).toBe(0.5);
    expect(w.low).toBeGreaterThan(0.29);
    expect(w.low).toBeLessThan(0.31);
    expect(w.high).toBeGreaterThan(0.69);
    expect(w.high).toBeLessThan(0.71);
  });

  it('clamps out-of-range successes cleanly between 0 and total', () => {
    const full = wilsonInterval(12, 8);
    expect(full.successes).toBe(8);
    expect(full.rate).toBe(1);
    expect(full.high).toBe(1);
    expect(full.low).toBeGreaterThan(0.6);

    const empty = wilsonInterval(-4, 10);
    expect(empty.successes).toBe(0);
    expect(empty.rate).toBe(0);
    expect(empty.low).toBe(0);
  });

  it('formats percentages and confidence bands predictably', () => {
    expect(formatPct(0.635, 1)).toBe('63.5%');
    const band = formatConfidenceBand(wilsonInterval(6, 10));
    expect(band).toContain('60%');
    expect(band).toContain('6/10');
    expect(band).toContain('95% CI');
  });

  it('computes consistent Ascent (13-9) series telemetry metrics', () => {
    const ascent = BUILTIN_MATCHES[0]!;
    const stats = computeMatchAnalytics(ascent);
    expect(stats.totalRounds).toBe(22);
    expect(stats.c9Wins).toBe(13);
    expect(stats.oppWins).toBe(9);
    expect(stats.c9AttackStats.total + stats.c9DefenseStats.total).toBe(22);

    const oppSplitSum = stats.oppTimingSplits.reduce((s, b) => s + b.rounds, 0);
    expect(oppSplitSum).toBe(stats.c9DefenseStats.total);
    expect(stats.avgOppExecuteSec).toBeGreaterThan(40);
  });

  it('computes 3-site metrics on Haven (24 rounds) including Site C', () => {
    const haven = BUILTIN_MATCHES[1]!;
    const stats = computeMatchAnalytics(haven);
    expect(stats.totalRounds).toBe(24);
    expect(stats.c9Wins).toBe(13);
    expect(stats.oppWins).toBe(11);
    const siteC = stats.siteMetrics.find((m) => m.site === 'C');
    expect(siteC).toBeDefined();
    expect(siteC!.attempts).toBeGreaterThan(5);
  });

  it('aggregates utility timing windows across all Bind rounds', () => {
    const bind = BUILTIN_MATCHES[2]!;
    const stats = computeMatchAnalytics(bind);
    expect(stats.totalRounds).toBe(20);
    const totalUtility = stats.utilityWindows.reduce((acc, w) => acc + w.count, 0);
    const rawUtility = bind.rounds.reduce((acc, r) => acc + r.utility.length, 0);
    expect(totalUtility).toBe(rawUtility);
    expect(stats.utilityWindows.some((w) => w.topAbility !== 'None')).toBe(true);
  });
});
