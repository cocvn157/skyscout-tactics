import type {
  EconomyDecision,
  EconomyOutcomeBranch,
  EconomySimInput,
  EconomySimResult,
} from '../types/telemetry';

export const FULL_BUY_THRESHOLD = 3900;
export const MAX_CREDITS = 9000;
export const WIN_BONUS_CREDITS = 3000;
export const LOSS_BONUS_LADDER = [1900, 2400, 2900] as const;

const DECISION_METADATA: Record<
  EconomyDecision,
  { label: string; targetSpend: number }
> = {
  eco: { label: 'Full Eco (Save)', targetSpend: 400 },
  'half-buy': { label: 'Light / Half-Buy', targetSpend: 1950 },
  force: { label: 'Force Buy', targetSpend: 3150 },
  'full-buy': { label: 'Full Buy', targetSpend: 4350 },
};

const ENEMY_LOADOUT_VALUE: Record<EconomySimInput['enemyExpectedBuy'], number> = {
  eco: 500,
  force: 2950,
  'full-buy': 4350,
};

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function getLossBonusForStreak(streak: 0 | 1 | 2 | 3): number {
  if (streak === 0) return LOSS_BONUS_LADDER[0];
  if (streak === 1) return LOSS_BONUS_LADDER[0];
  if (streak === 2) return LOSS_BONUS_LADDER[1];
  return LOSS_BONUS_LADDER[2];
}

export function getNextLossBonusAfterLoss(streak: 0 | 1 | 2 | 3): number {
  if (streak === 0) return LOSS_BONUS_LADDER[0]; // 1900 on 1st loss
  if (streak === 1) return LOSS_BONUS_LADDER[1]; // 2400 on 2nd loss
  return LOSS_BONUS_LADDER[2]; // 2900 cap on 3rd+ loss
}

function estimateWinProbability(
  effectiveSpend: number,
  enemyBuy: EconomySimInput['enemyExpectedBuy'],
  side: EconomySimInput['side'],
  includeBaseline: boolean,
  matchFbRate = 0.52,
  matchPostPlantRate = 0.55,
): number {
  const ourPower = clamp(effectiveSpend / 4350, 0.08, 1.05);
  const enemyPower = ENEMY_LOADOUT_VALUE[enemyBuy] / 4350;
  const sideBonus = side === 'defense' ? 0.08 : -0.04;
  const baselineShift = includeBaseline
    ? (matchFbRate - 0.5) * 0.45 + (matchPostPlantRate - 0.5) * 0.35
    : 0;

  const raw = logistic((ourPower - enemyPower) * 2.95 + sideBonus + baselineShift);
  return Number(clamp(raw, 0.08, 0.91).toFixed(3));
}

function estimateNextRoundWinProb(
  nextBank: number,
  enemyNextEstimatedBank: number,
  side: EconomySimInput['side'],
): number {
  const ourNextPower = nextBank >= FULL_BUY_THRESHOLD ? 1.0 : clamp(nextBank / 4350, 0.15, 0.85);
  const enemyNextPower =
    enemyNextEstimatedBank >= FULL_BUY_THRESHOLD
      ? 1.0
      : clamp(enemyNextEstimatedBank / 4350, 0.2, 0.85);
  const sideBonus = side === 'defense' ? 0.06 : -0.03;
  return clamp(logistic((ourNextPower - enemyNextPower) * 2.8 + sideBonus), 0.12, 0.88);
}

export function simulateEconomyDecision(input: EconomySimInput): EconomySimResult {
  const ourCredits = clamp(Math.round(input.ourAvgCredits), 0, MAX_CREDITS);
  const enemyCredits = clamp(Math.round(input.enemyAvgCredits), 0, MAX_CREDITS);

  const currentLossBonus = getLossBonusForStreak(input.ourLossStreak);
  const nextLossBonusOnLoss = getNextLossBonusAfterLoss(input.ourLossStreak);

  // Average residual bonus across round (kills + spike plant + minor save carry)
  const avgWinResidual = input.side === 'attack' ? 500 : 400;
  const avgLossResidual = input.side === 'attack' ? 350 : 200;

  const enemyNextIfTheyLose = clamp(
    Math.max(0, enemyCredits - ENEMY_LOADOUT_VALUE[input.enemyExpectedBuy]) +
      getNextLossBonusAfterLoss(input.enemyLossStreak) +
      250,
    0,
    MAX_CREDITS,
  );
  const enemyNextIfTheyWin = clamp(
    Math.max(0, enemyCredits - ENEMY_LOADOUT_VALUE[input.enemyExpectedBuy]) +
      WIN_BONUS_CREDITS +
      500,
    0,
    MAX_CREDITS,
  );

  const decisions: EconomyDecision[] = ['eco', 'half-buy', 'force', 'full-buy'];

  const allBranches: EconomyOutcomeBranch[] = decisions.map((decision) => {
    const meta = DECISION_METADATA[decision];
    const spendPerPlayer = Math.min(ourCredits, meta.targetSpend);
    const remainingPerPlayer = Math.max(0, ourCredits - spendPerPlayer);

    const winProb = estimateWinProbability(
      spendPerPlayer,
      input.enemyExpectedBuy,
      input.side,
      input.includeMatchBaseline,
      input.matchFirstBloodRate,
      input.matchPostPlantRate,
    );

    const nextRoundBankIfWin = clamp(
      remainingPerPlayer + WIN_BONUS_CREDITS + avgWinResidual,
      0,
      MAX_CREDITS,
    );
    const nextRoundBankIfLoss = clamp(
      remainingPerPlayer + nextLossBonusOnLoss + avgLossResidual,
      0,
      MAX_CREDITS,
    );

    const nextWinProbIfWin = estimateNextRoundWinProb(
      nextRoundBankIfWin,
      enemyNextIfTheyLose,
      input.side,
    );
    const nextWinProbIfLoss = estimateNextRoundWinProb(
      nextRoundBankIfLoss,
      enemyNextIfTheyWin,
      input.side,
    );

    const twoRoundExpectedWins = Number(
      (winProb * (1 + nextWinProbIfWin) + (1 - winProb) * nextWinProbIfLoss).toFixed(3),
    );

    return {
      decision,
      label: meta.label,
      spendPerPlayer,
      remainingPerPlayer,
      currentRoundWinProb: winProb,
      nextRoundBankIfWin,
      nextRoundBankIfLoss,
      nextRoundFullBuyGuaranteedOnLoss: nextRoundBankIfLoss >= FULL_BUY_THRESHOLD,
      twoRoundExpectedWins,
    };
  });

  // Determine optimal branch (prefer guaranteed full-buy if EV within 0.015)
  const viableBranches = allBranches.filter((b) =>
    b.decision === 'full-buy' ? ourCredits >= FULL_BUY_THRESHOLD : true,
  );

  let best = viableBranches[0]!;
  for (const candidate of viableBranches.slice(1)) {
    const evDiff = candidate.twoRoundExpectedWins - best.twoRoundExpectedWins;
    if (
      evDiff > 0.015 ||
      (Math.abs(evDiff) <= 0.015 &&
        candidate.nextRoundFullBuyGuaranteedOnLoss &&
        !best.nextRoundFullBuyGuaranteedOnLoss)
    ) {
      best = candidate;
    }
  }

  const selectedBranch =
    allBranches.find((b) => b.decision === input.ourDecision) ?? best;

  let recommendationHeadline = `RECOMMENDED: ${best.label.toUpperCase()}`;
  let rationale = '';
  if (best.decision === 'full-buy') {
    recommendationHeadline = 'RECOMMENDED: FULL BUY (RIFLE PARITY)';
    rationale = `Team credits ($${ourCredits.toLocaleString('en-US')}) cover full rifles, heavy armor, and execute utility with ${Math.round(best.currentRoundWinProb * 100)}% current-round win projection and ${best.twoRoundExpectedWins.toFixed(2)} two-round expected wins.`;
  } else if (best.decision === 'eco') {
    recommendationHeadline = 'RECOMMENDED: FULL ECO FOR GUARANTEED FULL BUY';
    rationale = `Spending down on a Force traps next-round loss bank below $${FULL_BUY_THRESHOLD.toLocaleString('en-US')}. Full Eco preserves ~$${best.nextRoundBankIfLoss.toLocaleString('en-US')} even on a loss, guaranteeing rifles + full utility next round (${best.twoRoundExpectedWins.toFixed(2)} 2-round EV).`;
  } else if (best.decision === 'half-buy') {
    recommendationHeadline = 'RECOMMENDED: LIGHT / HALF-BUY (UPGRADE + BANK)';
    rationale = `With $${ourCredits.toLocaleString('en-US')} average credits and $${nextLossBonusOnLoss.toLocaleString('en-US')} incoming loss bonus, investing ~$${best.spendPerPlayer.toLocaleString('en-US')} keeps $${best.nextRoundBankIfLoss.toLocaleString('en-US')} on loss while contesting with Sheriff/Spectre (${Math.round(best.currentRoundWinProb * 100)}% win chance).`;
  } else {
    recommendationHeadline = 'RECOMMENDED: COORDINATED FORCE BUY';
    rationale = `Max loss-bonus floor ($${nextLossBonusOnLoss.toLocaleString('en-US')}) plus remaining credits yields ${best.twoRoundExpectedWins.toFixed(2)} two-round EV while punishing enemy ${input.enemyExpectedBuy}.`;
  }

  return {
    lossBonusCredits: currentLossBonus,
    nextLossBonusCredits: nextLossBonusOnLoss,
    recommendedDecision: best.decision,
    recommendationHeadline,
    rationale,
    selectedBranch,
    allBranches,
  };
}
