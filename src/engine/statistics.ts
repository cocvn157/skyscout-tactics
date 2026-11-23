import { MAP_BLUEPRINTS } from '../data/maps';
import type {
  MatchAnalytics,
  MatchSeries,
  RoundTelemetry,
  SiteMetric,
  TimingBucketMetric,
  UtilityWindowMetric,
  WilsonConfidence,
} from '../types/telemetry';

export function wilsonInterval(
  successes: number,
  total: number,
  z = 1.96,
): WilsonConfidence {
  if (total <= 0) {
    return { successes: 0, total: 0, rate: 0, low: 0, high: 0 };
  }
  const safeSuccesses = Math.max(0, Math.min(successes, total));
  const p = safeSuccesses / total;
  const z2 = z * z;
  const denom = 1 + z2 / total;
  const center = (p + z2 / (2 * total)) / denom;
  const margin =
    (z * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total)) / denom;

  return {
    successes: safeSuccesses,
    total,
    rate: Number(p.toFixed(4)),
    low: Number(Math.max(0, center - margin).toFixed(4)),
    high: Number(Math.min(1, center + margin).toFixed(4)),
  };
}

export function formatPct(rate: number, digits = 0): string {
  return `${(rate * 100).toFixed(digits)}%`;
}

export function formatConfidenceBand(w: WilsonConfidence): string {
  if (w.total === 0) return 'n=0 (no sample)';
  return `${formatPct(w.rate)} (${w.successes}/${w.total}, 95% CI ${formatPct(w.low)}–${formatPct(w.high)})`;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Number((sum / values.length).toFixed(1));
}

function isFirstBloodWonBy(round: RoundTelemetry, team: 'C9' | 'OPP'): boolean {
  const fb = round.kills.find((k) => k.isFirstBlood);
  return fb?.killerTeam === team;
}

export function computeMatchAnalytics(match: MatchSeries): MatchAnalytics {
  const rounds = match.rounds;
  const totalRounds = rounds.length;
  const c9Wins = rounds.filter((r) => r.winner === 'C9').length;
  const oppWins = totalRounds - c9Wins;

  const c9AtkRounds = rounds.filter((r) => r.attackTeam === 'C9');
  const c9DefRounds = rounds.filter((r) => r.attackTeam === 'OPP');

  const pistolRounds = rounds.filter((r) => r.roundNumber === 1 || r.roundNumber === 13);
  const pistolWins = pistolRounds.filter((r) => r.winner === 'C9');

  const postPistolFollowups = pistolWins
    .map((p) => rounds.find((r) => r.roundNumber === p.roundNumber + 1))
    .filter((r): r is RoundTelemetry => Boolean(r));

  const fbRoundsByC9 = rounds.filter((r) => isFirstBloodWonBy(r, 'C9'));

  const c9PostPlantRounds = c9AtkRounds.filter((r) => r.plantSec !== null);
  const oppPostPlantRounds = c9DefRounds.filter((r) => r.plantSec !== null);

  const oppExecTimes = c9DefRounds
    .map((r) => r.executeSec)
    .filter((v): v is number => v !== null);
  const c9ExecTimes = c9AtkRounds
    .map((r) => r.executeSec)
    .filter((v): v is number => v !== null);

  const mapSites = MAP_BLUEPRINTS[match.map].sites;
  const siteCandidates: Array<'A' | 'B' | 'C' | 'Split'> = [...mapSites, 'Split'];

  const siteMetrics: SiteMetric[] = siteCandidates.map((site) => {
    const targeted = rounds.filter((r) => r.targetSite === site);
    const oppTargeted = targeted.filter((r) => r.attackTeam === 'OPP');
    const oppSiteWins = oppTargeted.filter((r) => r.winner === 'OPP').length;
    const execTimes = targeted
      .map((r) => r.executeSec)
      .filter((v): v is number => v !== null);
    const plantedCount = targeted.filter((r) => r.plantSec !== null).length;

    return {
      site,
      attempts: targeted.length,
      wins: oppSiteWins,
      winRate: wilsonInterval(oppSiteWins, oppTargeted.length),
      avgExecuteSec: mean(execTimes),
      plantRate: targeted.length > 0 ? Number((plantedCount / targeted.length).toFixed(3)) : 0,
    };
  });

  const timingDefs: Array<{
    bucket: TimingBucketMetric['bucket'];
    label: string;
    rangeLabel: string;
    matchFn: (sec: number) => boolean;
  }> = [
    { bucket: 'fast', label: 'Fast Hit / Rush', rangeLabel: '< 30s', matchFn: (s) => s < 30 },
    { bucket: 'mid', label: 'Mid-Round Exec', rangeLabel: '30–54s', matchFn: (s) => s >= 30 && s < 55 },
    { bucket: 'late', label: 'Late-Clock Exec', rangeLabel: '55s+', matchFn: (s) => s >= 55 },
  ];

  const oppTimingSplits: TimingBucketMetric[] = timingDefs.map((def) => {
    const matching = c9DefRounds.filter(
      (r) => r.executeSec !== null && def.matchFn(r.executeSec),
    );
    const oppWon = matching.filter((r) => r.winner === 'OPP').length;
    return {
      bucket: def.bucket,
      label: def.label,
      rangeLabel: def.rangeLabel,
      rounds: matching.length,
      wins: oppWon,
      winRate: wilsonInterval(oppWon, matching.length),
    };
  });

  const allUtility = rounds.flatMap((r) => r.utility);
  const windowDefs: Array<{
    window: UtilityWindowMetric['window'];
    label: string;
    rangeSec: string;
    matchFn: (sec: number) => boolean;
  }> = [
    { window: 'early-info', label: 'Early Info & Orb', rangeSec: '0–20s', matchFn: (s) => s < 20 },
    { window: 'mid-control', label: 'Mid Map Control', rangeSec: '20–49s', matchFn: (s) => s >= 20 && s < 50 },
    { window: 'site-exec', label: 'Site Execute Dump', rangeSec: '50–74s', matchFn: (s) => s >= 50 && s < 75 },
    { window: 'post-plant', label: 'Post-Plant / Retake', rangeSec: '75s+', matchFn: (s) => s >= 75 },
  ];

  const utilityWindows: UtilityWindowMetric[] = windowDefs.map((def) => {
    const events = allUtility.filter((u) => def.matchFn(u.timestampSec));
    const abilityFreq = new Map<string, number>();
    for (const ev of events) {
      abilityFreq.set(ev.ability, (abilityFreq.get(ev.ability) ?? 0) + 1);
    }
    let topAbility = 'None';
    let topCount = 0;
    for (const [ability, cnt] of abilityFreq.entries()) {
      if (cnt > topCount) {
        topAbility = ability;
        topCount = cnt;
      }
    }

    return {
      window: def.window,
      label: def.label,
      rangeSec: def.rangeSec,
      count: events.length,
      c9Count: events.filter((u) => u.team === 'C9').length,
      oppCount: events.filter((u) => u.team === 'OPP').length,
      topAbility,
    };
  });

  return {
    totalRounds,
    c9Wins,
    oppWins,
    overallWinRate: wilsonInterval(c9Wins, totalRounds),
    c9AttackStats: wilsonInterval(
      c9AtkRounds.filter((r) => r.winner === 'C9').length,
      c9AtkRounds.length,
    ),
    c9DefenseStats: wilsonInterval(
      c9DefRounds.filter((r) => r.winner === 'C9').length,
      c9DefRounds.length,
    ),
    pistolWinRate: wilsonInterval(pistolWins.length, pistolRounds.length),
    pistolConversionRate: wilsonInterval(
      postPistolFollowups.filter((r) => r.winner === 'C9').length,
      postPistolFollowups.length,
    ),
    firstBloodWinRate: wilsonInterval(
      fbRoundsByC9.filter((r) => r.winner === 'C9').length,
      fbRoundsByC9.length,
    ),
    postPlantWinRate: wilsonInterval(
      c9PostPlantRounds.filter((r) => r.winner === 'C9').length,
      c9PostPlantRounds.length,
    ),
    oppPostPlantWinRate: wilsonInterval(
      oppPostPlantRounds.filter((r) => r.winner === 'OPP').length,
      oppPostPlantRounds.length,
    ),
    avgOppExecuteSec: mean(oppExecTimes),
    avgC9ExecuteSec: mean(c9ExecTimes),
    siteMetrics,
    oppTimingSplits,
    utilityWindows,
  };
}
