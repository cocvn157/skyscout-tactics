import { describe, expect, it } from 'vitest';
import { BUILTIN_MATCHES } from '../data/matches';
import { analyzeOpponentTendencies } from '../engine/antiStrat';
import { simulateEconomyDecision } from '../engine/economy';
import {
  buildSignedCoachBrief,
  generateCoachPrepMarkdown,
  sha256Hex,
  verifySignedCoachBrief,
} from '../engine/exporter';
import {
  buildSampleCsvTemplate,
  buildSampleGridSeriesJsonTemplate,
  validateAndParseMatchInput,
} from '../engine/importer';
import { computeMatchAnalytics } from '../engine/statistics';

describe('GRID telemetry importer & SHA-256 brief exporter', () => {
  it('computes NIST-accurate SHA-256 digests for standard test vectors', () => {
    expect(sha256Hex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('builds a signed coach brief and detects tampering accurately', () => {
    const match = BUILTIN_MATCHES[0]!;
    const analytics = computeMatchAnalytics(match);
    const { tendencies, calls } = analyzeOpponentTendencies(match);
    const econ = simulateEconomyDecision({
      ourAvgCredits: 3100,
      enemyAvgCredits: 4500,
      ourLossStreak: 1,
      enemyLossStreak: 0,
      ourDecision: 'eco',
      enemyExpectedBuy: 'full-buy',
      side: 'defense',
      includeMatchBaseline: true,
    });

    const signed = buildSignedCoachBrief(match, analytics, tendencies, calls, econ);
    const serialized = JSON.stringify({
      payload: signed.payload,
      integritySha256: signed.integritySha256,
    });
    expect(verifySignedCoachBrief(serialized).valid).toBe(true);

    const tampered = serialized.replace('"c9": 13', '"c9": 99').replace('"c9":13', '"c9":99');
    expect(verifySignedCoachBrief(tampered).valid).toBe(false);
  });

  it('generates Markdown Coach Prep Sheet with embedded SHA-256 and round calls', () => {
    const match = BUILTIN_MATCHES[1]!;
    const analytics = computeMatchAnalytics(match);
    const { tendencies, calls } = analyzeOpponentTendencies(match);
    const econ = simulateEconomyDecision({
      ourAvgCredits: 4500,
      enemyAvgCredits: 4300,
      ourLossStreak: 0,
      enemyLossStreak: 1,
      ourDecision: 'full-buy',
      enemyExpectedBuy: 'full-buy',
      side: 'attack',
      includeMatchBaseline: false,
    });

    const md = generateCoachPrepMarkdown(match, analytics, tendencies, calls, econ);
    expect(md).toContain('SkyScout Tactical Prep Sheet');
    expect(md).toContain('Haven');
    expect(md).toContain('Telemetry Integrity SHA-256');
    expect(md).toContain('Priority Anti-Strat Round Calls');
  });

  it('parses GRID Series State JSON template into normalized MatchSeries', () => {
    const sample = buildSampleGridSeriesJsonTemplate();
    const res = validateAndParseMatchInput(sample);
    expect(res.ok).toBe(true);
    expect(res.formatDetected).toBe('grid-series-state');
    expect(res.match).toBeDefined();
    expect(res.match!.map).toBe('bind');
    expect(res.match!.rounds).toHaveLength(6);
    expect(res.match!.opponentTag).toBe('EG');
  });

  it('parses sample tactical CSV into full playable rounds', () => {
    const csv = buildSampleCsvTemplate();
    const res = validateAndParseMatchInput(csv, 'haven');
    expect(res.ok).toBe(true);
    expect(res.formatDetected).toBe('csv');
    expect(res.match!.map).toBe('haven');
    expect(res.match!.rounds).toHaveLength(8);
    expect(res.match!.rounds[0]!.players.length).toBe(10);
  });

  it('parses native grid-valorant-v1 JSON format cleanly', () => {
    const raw = JSON.stringify(BUILTIN_MATCHES[2]);
    const res = validateAndParseMatchInput(raw);
    expect(res.ok).toBe(true);
    expect(res.formatDetected).toBe('grid-valorant-v1');
    expect(res.match!.rounds).toHaveLength(20);
  });

  it('rejects empty and malformed JSON inputs with explicit diagnostics', () => {
    const emptyRes = validateAndParseMatchInput('   ');
    expect(emptyRes.ok).toBe(false);
    expect(emptyRes.issues[0]!.field).toBe('input');

    const badJson = validateAndParseMatchInput('{ bad json');
    expect(badJson.ok).toBe(false);
    expect(badJson.issues[0]!.field).toBe('json');
  });

  it('rejects unsupported maps in JSON telemetry', () => {
    const unsupported = JSON.stringify({
      map: 'icebox',
      rounds: [{ roundNumber: 1, attackTeam: 'C9', winner: 'C9' }],
    });
    const res = validateAndParseMatchInput(unsupported);
    expect(res.ok).toBe(false);
    expect(res.issues.some((i) => i.field === 'map')).toBe(true);
  });

  it('reports line-level errors for invalid CSV columns or values', () => {
    const badCsv = [
      'roundNumber,attackTeam,winner,targetSite,executeSec',
      '1,C9,INVALID_TEAM,A,25',
      '2,OPP,OPP,B,-5',
    ].join('\n');
    const res = validateAndParseMatchInput(badCsv, 'ascent');
    expect(res.ok).toBe(false);
    expect(res.issues.length).toBeGreaterThanOrEqual(2);
    expect(res.issues.some((i) => i.line === 2 && i.field === 'winner')).toBe(true);
    expect(res.issues.some((i) => i.line === 3 && i.field === 'executeSec')).toBe(true);
  });
});
