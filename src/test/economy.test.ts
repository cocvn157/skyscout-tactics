import { describe, expect, it } from 'vitest';
import {
  FULL_BUY_THRESHOLD,
  LOSS_BONUS_LADDER,
  MAX_CREDITS,
  getLossBonusForStreak,
  getNextLossBonusAfterLoss,
  simulateEconomyDecision,
} from '../engine/economy';

describe('economy & buy-round what-if simulator', () => {
  it('follows VALORANT loss bonus ladder (1900 / 2400 / 2900)', () => {
    expect(LOSS_BONUS_LADDER).toEqual([1900, 2400, 2900]);
    expect(getLossBonusForStreak(0)).toBe(1900);
    expect(getLossBonusForStreak(1)).toBe(1900);
    expect(getLossBonusForStreak(2)).toBe(2400);
    expect(getLossBonusForStreak(3)).toBe(2900);

    expect(getNextLossBonusAfterLoss(0)).toBe(1900);
    expect(getNextLossBonusAfterLoss(1)).toBe(2400);
    expect(getNextLossBonusAfterLoss(2)).toBe(2900);
    expect(getNextLossBonusAfterLoss(3)).toBe(2900);
  });

  it('warns against force-buy trap when $2,950 force breaks next-round full buy', () => {
    const res = simulateEconomyDecision({
      ourAvgCredits: 2950,
      enemyAvgCredits: 4700,
      ourLossStreak: 0,
      enemyLossStreak: 0,
      ourDecision: 'force',
      enemyExpectedBuy: 'full-buy',
      side: 'defense',
      includeMatchBaseline: false,
    });

    const ecoBranch = res.allBranches.find((b) => b.decision === 'eco')!;
    const forceBranch = res.allBranches.find((b) => b.decision === 'force')!;

    expect(ecoBranch.nextRoundFullBuyGuaranteedOnLoss).toBe(true);
    expect(ecoBranch.nextRoundBankIfLoss).toBeGreaterThanOrEqual(FULL_BUY_THRESHOLD);
    expect(forceBranch.nextRoundFullBuyGuaranteedOnLoss).toBe(false);
    expect(forceBranch.nextRoundBankIfLoss).toBeLessThan(FULL_BUY_THRESHOLD);
    expect(res.recommendedDecision).not.toBe('force');
  });

  it('recommends full-buy when team credits comfortably exceed $4,400', () => {
    const res = simulateEconomyDecision({
      ourAvgCredits: 4800,
      enemyAvgCredits: 4500,
      ourLossStreak: 0,
      enemyLossStreak: 1,
      ourDecision: 'full-buy',
      enemyExpectedBuy: 'full-buy',
      side: 'defense',
      includeMatchBaseline: false,
    });

    expect(res.recommendedDecision).toBe('full-buy');
    expect(res.selectedBranch.currentRoundWinProb).toBeGreaterThan(0.45);
    expect(res.recommendationHeadline).toContain('FULL BUY');
  });

  it('clamps extreme credit inputs safely inside [0, 9000]', () => {
    const res = simulateEconomyDecision({
      ourAvgCredits: 15000,
      enemyAvgCredits: -500,
      ourLossStreak: 3,
      enemyLossStreak: 0,
      ourDecision: 'full-buy',
      enemyExpectedBuy: 'eco',
      side: 'attack',
      includeMatchBaseline: false,
    });

    for (const branch of res.allBranches) {
      expect(branch.nextRoundBankIfWin).toBeLessThanOrEqual(MAX_CREDITS);
      expect(branch.nextRoundBankIfLoss).toBeGreaterThanOrEqual(0);
    }
  });

  it('reflects higher win probability against enemy eco than enemy full-buy', () => {
    const vsEco = simulateEconomyDecision({
      ourAvgCredits: 4500,
      enemyAvgCredits: 1900,
      ourLossStreak: 0,
      enemyLossStreak: 1,
      ourDecision: 'full-buy',
      enemyExpectedBuy: 'eco',
      side: 'attack',
      includeMatchBaseline: false,
    });

    const vsFull = simulateEconomyDecision({
      ourAvgCredits: 4500,
      enemyAvgCredits: 4500,
      ourLossStreak: 0,
      enemyLossStreak: 0,
      ourDecision: 'full-buy',
      enemyExpectedBuy: 'full-buy',
      side: 'attack',
      includeMatchBaseline: false,
    });

    expect(vsEco.selectedBranch.currentRoundWinProb).toBeGreaterThan(
      vsFull.selectedBranch.currentRoundWinProb,
    );
  });

  it('incorporates match baseline first-blood and post-plant rates when enabled', () => {
    const strongBaseline = simulateEconomyDecision({
      ourAvgCredits: 4400,
      enemyAvgCredits: 4400,
      ourLossStreak: 0,
      enemyLossStreak: 0,
      ourDecision: 'full-buy',
      enemyExpectedBuy: 'full-buy',
      side: 'attack',
      includeMatchBaseline: true,
      matchFirstBloodRate: 0.78,
      matchPostPlantRate: 0.8,
    });

    const weakBaseline = simulateEconomyDecision({
      ourAvgCredits: 4400,
      enemyAvgCredits: 4400,
      ourLossStreak: 0,
      enemyLossStreak: 0,
      ourDecision: 'full-buy',
      enemyExpectedBuy: 'full-buy',
      side: 'attack',
      includeMatchBaseline: true,
      matchFirstBloodRate: 0.25,
      matchPostPlantRate: 0.25,
    });

    expect(strongBaseline.selectedBranch.currentRoundWinProb).toBeGreaterThan(
      weakBaseline.selectedBranch.currentRoundWinProb,
    );
  });

  it('always returns all four buy branches with valid probabilities', () => {
    const res = simulateEconomyDecision({
      ourAvgCredits: 3200,
      enemyAvgCredits: 4200,
      ourLossStreak: 2,
      enemyLossStreak: 0,
      ourDecision: 'half-buy',
      enemyExpectedBuy: 'full-buy',
      side: 'defense',
      includeMatchBaseline: false,
    });

    expect(res.allBranches).toHaveLength(4);
    for (const b of res.allBranches) {
      expect(b.currentRoundWinProb).toBeGreaterThan(0);
      expect(b.currentRoundWinProb).toBeLessThan(1);
      expect(b.twoRoundExpectedWins).toBeGreaterThan(0);
    }
  });
});
