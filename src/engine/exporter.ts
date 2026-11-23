import { MAP_BLUEPRINTS } from '../data/maps';
import type {
  AntiStratCall,
  EconomySimResult,
  MatchAnalytics,
  MatchSeries,
  OpponentTendency,
} from '../types/telemetry';
import { formatConfidenceBand, formatPct } from './statistics';

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

/**
 * Pure TypeScript FIPS 180-4 SHA-256 returning lowercase 64-char hex digest.
 * Deterministic across browser and Node/Vitest environments.
 */
export function sha256Hex(message: string): string {
  const bytes = new TextEncoder().encode(message);
  const bitLen = bytes.length * 8;
  const paddedLen = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  const highBits = Math.floor(bitLen / 0x100000000);
  const lowBits = bitLen >>> 0;
  view.setUint32(paddedLen - 8, highBits, false);
  view.setUint32(paddedLen - 4, lowBits, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Uint32Array(64);
  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i += 1) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i += 1) {
      const s0 =
        ((w[i - 15]! >>> 7) | (w[i - 15]! << 25)) ^
        ((w[i - 15]! >>> 18) | (w[i - 15]! << 14)) ^
        (w[i - 15]! >>> 3);
      const s1 =
        ((w[i - 2]! >>> 17) | (w[i - 2]! << 15)) ^
        ((w[i - 2]! >>> 19) | (w[i - 2]! << 13)) ^
        (w[i - 2]! >>> 10);
      w[i] = (w[i - 16]! + s0 + w[i - 7]! + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i += 1) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + SHA256_K[i]! + w[i]!) >>> 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((val) => val.toString(16).padStart(8, '0'))
    .join('');
}

export interface CoachBriefPayload {
  schemaVersion: 'skyscout-brief-v1';
  matchId: string;
  tournament: string;
  matchDate: string;
  map: string;
  matchup: string;
  finalScore: { c9: number; opp: number };
  summaryMetrics: {
    totalRounds: number;
    attackWinRate: number;
    defenseWinRate: number;
    firstBloodConversionRate: number;
    c9PostPlantWinRate: number;
    avgOppExecuteSec: number | null;
  };
  tendencies: Array<{
    id: string;
    title: string;
    severity: string;
    rate: number;
    wilson95CI: [number, number];
    supportingRounds: number[];
  }>;
  antiStratCalls: Array<{
    priority: number;
    side: string;
    callTitle: string;
    trigger: string;
    plan: string;
    supportingRounds: number[];
  }>;
  economyPlan: {
    recommendedDecision: string;
    headline: string;
    twoRoundExpectedWins: number;
    nextRoundBankIfLoss: number;
  };
}

export interface SignedCoachBrief {
  payload: CoachBriefPayload;
  integritySha256: string;
  canonicalPayloadJson: string;
}

export function buildSignedCoachBrief(
  match: MatchSeries,
  analytics: MatchAnalytics,
  tendencies: OpponentTendency[],
  calls: AntiStratCall[],
  economy: EconomySimResult,
): SignedCoachBrief {
  const mapName = MAP_BLUEPRINTS[match.map].name;
  const payload: CoachBriefPayload = {
    schemaVersion: 'skyscout-brief-v1',
    matchId: match.id,
    tournament: match.tournament,
    matchDate: match.matchDate,
    map: mapName,
    matchup: `${match.teamC9Name} vs ${match.opponentName} (${match.opponentTag})`,
    finalScore: { ...match.finalScore },
    summaryMetrics: {
      totalRounds: analytics.totalRounds,
      attackWinRate: analytics.c9AttackStats.rate,
      defenseWinRate: analytics.c9DefenseStats.rate,
      firstBloodConversionRate: analytics.firstBloodWinRate.rate,
      c9PostPlantWinRate: analytics.postPlantWinRate.rate,
      avgOppExecuteSec: analytics.avgOppExecuteSec,
    },
    tendencies: tendencies.map((t) => ({
      id: t.id,
      title: t.title,
      severity: t.severity,
      rate: t.metric.rate,
      wilson95CI: [t.metric.low, t.metric.high],
      supportingRounds: [...t.supportingRounds],
    })),
    antiStratCalls: calls.map((c) => ({
      priority: c.priority,
      side: c.sideContext,
      callTitle: c.callTitle,
      trigger: c.triggerCondition,
      plan: c.executionPlan,
      supportingRounds: [...c.supportingRounds],
    })),
    economyPlan: {
      recommendedDecision: economy.recommendedDecision,
      headline: economy.recommendationHeadline,
      twoRoundExpectedWins: economy.selectedBranch.twoRoundExpectedWins,
      nextRoundBankIfLoss: economy.selectedBranch.nextRoundBankIfLoss,
    },
  };

  const canonicalPayloadJson = JSON.stringify(payload);
  const integritySha256 = sha256Hex(canonicalPayloadJson);

  return {
    payload,
    integritySha256,
    canonicalPayloadJson,
  };
}

export function verifySignedCoachBrief(briefJson: string): {
  valid: boolean;
  expectedSha256: string;
  computedSha256: string;
} {
  const parsed = JSON.parse(briefJson) as {
    payload: CoachBriefPayload;
    integritySha256: string;
  };
  const canonical = JSON.stringify(parsed.payload);
  const computedSha256 = sha256Hex(canonical);
  return {
    valid: computedSha256 === parsed.integritySha256,
    expectedSha256: parsed.integritySha256,
    computedSha256,
  };
}

export function generateCoachPrepMarkdown(
  match: MatchSeries,
  analytics: MatchAnalytics,
  tendencies: OpponentTendency[],
  calls: AntiStratCall[],
  economy: EconomySimResult,
): string {
  const signed = buildSignedCoachBrief(match, analytics, tendencies, calls, economy);
  const mapInfo = MAP_BLUEPRINTS[match.map];

  const lines: string[] = [
    `# SkyScout Tactical Prep Sheet — ${match.teamC9Name} vs ${match.opponentName}`,
    '',
    `- **Map:** ${mapInfo.name}`,
    `- **Tournament / Feed:** ${match.tournament} (${match.matchDate})`,
    `- **Scoreline:** ${match.teamC9Name} ${match.finalScore.c9} – ${match.finalScore.opp} ${match.opponentTag} (${analytics.totalRounds} rounds)`,
    `- **Telemetry Integrity SHA-256:** \`${signed.integritySha256}\``,
    '',
    '## 1. Series Telemetry Snapshot',
    `- **Attack Win Rate:** ${formatConfidenceBand(analytics.c9AttackStats)}`,
    `- **Defense Win Rate:** ${formatConfidenceBand(analytics.c9DefenseStats)}`,
    `- **First-Blood Conversion:** ${formatConfidenceBand(analytics.firstBloodWinRate)}`,
    `- **C9 Post-Plant Conversion:** ${formatConfidenceBand(analytics.postPlantWinRate)}`,
    `- **Opponent Avg Execute Time:** ${analytics.avgOppExecuteSec !== null ? `${analytics.avgOppExecuteSec}s` : 'N/A'}`,
    '',
    '## 2. Detected Opponent Tendencies (95% Wilson CI)',
    ...tendencies.map(
      (t, idx) =>
        `${idx + 1}. **[${t.severity.toUpperCase()}] ${t.title}** — ${formatPct(t.metric.rate)} (${t.sampleLabel}, 95% CI ${formatPct(t.metric.low)}–${formatPct(t.metric.high)}) | Rounds: ${t.supportingRounds.map((r) => `#${r}`).join(', ')}`,
    ),
    '',
    '## 3. Priority Anti-Strat Round Calls',
    ...calls.map(
      (c) =>
        `- **P${c.priority} (${c.sideContext.toUpperCase()}) — ${c.callTitle}**\n  - *Trigger:* ${c.triggerCondition}\n  - *Plan:* ${c.executionPlan}\n  - *Supporting Rounds:* ${c.supportingRounds.map((r) => `#${r}`).join(', ')}`,
    ),
    '',
    '## 4. Economy & Buy-Round Simulation',
    `- **Model Decision:** ${economy.recommendationHeadline}`,
    `- **Rationale:** ${economy.rationale}`,
    `- **Selected Branch 2-Round EV:** ${economy.selectedBranch.twoRoundExpectedWins.toFixed(2)} expected wins | Next Loss Bank: $${economy.selectedBranch.nextRoundBankIfLoss.toLocaleString('en-US')}`,
    '',
  ];

  return lines.join('\n');
}
