import { MAP_BLUEPRINTS } from '../data/maps';
import type {
  AntiStratCall,
  MatchSeries,
  OpponentTendency,
  RoundTelemetry,
  TendencySeverity,
} from '../types/telemetry';
import { formatPct, wilsonInterval } from './statistics';

function classifySeverity(rate: number, sampleSize: number): TendencySeverity {
  if (sampleSize >= 4 && rate >= 0.6) return 'high';
  if (sampleSize >= 3 && rate >= 0.45) return 'medium';
  return 'low';
}

function getPreferredSite(rounds: RoundTelemetry[], sites: Array<'A' | 'B' | 'C'>) {
  let bestSite: 'A' | 'B' | 'C' = sites[0] ?? 'A';
  let bestCount = -1;
  for (const s of sites) {
    const count = rounds.filter((r) => r.targetSite === s).length;
    if (count > bestCount) {
      bestCount = count;
      bestSite = s;
    }
  }
  return { site: bestSite, count: bestCount };
}

export function analyzeOpponentTendencies(match: MatchSeries): {
  tendencies: OpponentTendency[];
  calls: AntiStratCall[];
} {
  const tendencies: OpponentTendency[] = [];
  const calls: AntiStratCall[] = [];
  const rounds = match.rounds;
  const oppAtkRounds = rounds.filter((r) => r.attackTeam === 'OPP');
  const oppDefRounds = rounds.filter((r) => r.attackTeam === 'C9');
  const mapInfo = MAP_BLUEPRINTS[match.map];

  // 1. Fast-Hit vs Late-Exec Timing Split (Opponent Attack)
  const fastOppAtk = oppAtkRounds.filter((r) => r.executeSec !== null && r.executeSec < 30);
  const lateOppAtk = oppAtkRounds.filter((r) => r.executeSec !== null && r.executeSec >= 55);

  if (oppAtkRounds.length > 0 && fastOppAtk.length >= lateOppAtk.length && fastOppAtk.length >= 2) {
    const metric = wilsonInterval(fastOppAtk.length, oppAtkRounds.length);
    const { site } = getPreferredSite(fastOppAtk, mapInfo.sites);
    const roundNums = fastOppAtk.map((r) => r.roundNumber);
    const sev = classifySeverity(metric.rate, oppAtkRounds.length);

    tendencies.push({
      id: 'tendency-fast-hit',
      title: `${match.opponentTag} favors early <30s site bursts (Site ${site} bias)`,
      category: 'timing',
      severity: sev,
      sampleLabel: `${fastOppAtk.length}/${oppAtkRounds.length} opp attack rounds`,
      metric,
      evidenceSummary: `${formatPct(metric.rate)} of ${match.opponentTag}'s attack rounds hit before 30s (95% CI ${formatPct(metric.low)}–${formatPct(metric.high)}), forcing early anchor pressure on Site ${site}.`,
      supportingRounds: roundNums,
    });

    calls.push({
      id: 'call-anti-fast-hit',
      priority: 1,
      sideContext: 'defense',
      triggerCondition: `When ${match.opponentTag} invests early movement/flash utility < 18s on ${mapInfo.name}`,
      callTitle: `Anchor Delay + Anti-Rush Crossfire on ${site}`,
      executionPlan: `Pre-place Sentinel trip/stall on ${site} choke, hold one-way smoke for t=18–28s burst, and keep Mid rotator tethered for immediate flood instead of deep info peeks.`,
      expectedGain: `Neutralizes ${formatPct(metric.rate)} fast-exec tempo across ${roundNums.length} observed rounds.`,
      confidence: sev,
      supportingRounds: roundNums,
      linkedTendencyId: 'tendency-fast-hit',
    });
  } else if (oppAtkRounds.length > 0 && lateOppAtk.length >= 2) {
    const metric = wilsonInterval(lateOppAtk.length, oppAtkRounds.length);
    const { site } = getPreferredSite(lateOppAtk, mapInfo.sites);
    const roundNums = lateOppAtk.map((r) => r.roundNumber);
    const sev = classifySeverity(metric.rate, oppAtkRounds.length);

    tendencies.push({
      id: 'tendency-late-exec',
      title: `${match.opponentTag} runs late-clock 55s+ defaults toward ${site}`,
      category: 'timing',
      severity: sev,
      sampleLabel: `${lateOppAtk.length}/${oppAtkRounds.length} opp attack rounds`,
      metric,
      evidenceSummary: `${formatPct(metric.rate)} of ${match.opponentTag}'s attack rounds burn 55s+ before committing, baiting early defensive utility.`,
      supportingRounds: roundNums,
    });

    calls.push({
      id: 'call-anti-late-exec',
      priority: 1,
      sideContext: 'defense',
      triggerCondition: 'Clock reaches 55s elapsed without hard site smoke commit',
      callTitle: `Hold Second Smoke + Late Pinch Timing on ${site}`,
      executionPlan: `Preserve primary Controller smoke until t=50s, take silent Mid/Lane info at t=35s to spot fakes, and pinch ${site} entrance once spike commit begins.`,
      expectedGain: `Denies late-round execute windows on ${roundNums.length} documented late defaults.`,
      confidence: sev,
      supportingRounds: roundNums,
      linkedTendencyId: 'tendency-late-exec',
    });
  }

  // 2. Eco / Force-Buy Aggression Habit
  const oppEcoOrForce = rounds.filter((r) => {
    const buy = r.attackTeam === 'OPP' ? r.attackBuyType : r.defenseBuyType;
    return buy === 'eco' || buy === 'force' || buy === 'half-buy';
  });
  const aggroLowBuys = oppEcoOrForce.filter(
    (r) =>
      (r.executeSec !== null && r.executeSec < 32) ||
      r.oppSetupTag.toLowerCase().includes('crunch') ||
      r.oppSetupTag.toLowerCase().includes('stack') ||
      r.oppSetupTag.toLowerCase().includes('rush') ||
      r.oppSetupTag.toLowerCase().includes('drop'),
  );

  if (oppEcoOrForce.length >= 2 && aggroLowBuys.length >= 2) {
    const metric = wilsonInterval(aggroLowBuys.length, oppEcoOrForce.length);
    const roundNums = aggroLowBuys.map((r) => r.roundNumber);
    const sev = classifySeverity(metric.rate, oppEcoOrForce.length);

    tendencies.push({
      id: 'tendency-eco-aggro',
      title: `${match.opponentTag} forces aggressive stacks & crunches on low-buy rounds`,
      category: 'economy',
      severity: sev,
      sampleLabel: `${aggroLowBuys.length}/${oppEcoOrForce.length} eco/force rounds`,
      metric,
      evidenceSummary: `On ${formatPct(metric.rate)} of low-buy rounds, ${match.opponentTag} avoids passive defaults and pushes tight angles/stacks to steal rifles.`,
      supportingRounds: roundNums,
    });

    calls.push({
      id: 'call-anti-eco-discipline',
      priority: 2,
      sideContext: 'attack',
      triggerCondition: `${match.opponentTag} team bank drops below full-buy threshold (<$19,500)`,
      callTitle: 'Anti-Eco Long-Range Spacing & Anti-Stack Clear',
      executionPlan: `Ban dry close-corner peeks; run recon dart / drone into high-stack chokes before entry and trade in pairs at >20m rifle range.`,
      expectedGain: `Protects rifle economy and cuts upset rate observed in ${roundNums.length} low-buy rounds.`,
      confidence: sev,
      supportingRounds: roundNums,
      linkedTendencyId: 'tendency-eco-aggro',
    });
  }

  // 3. Lurk / Solo Anchor Exploitation (Opponent Defense)
  const lurkOrSoloRounds = rounds.filter(
    (r) =>
      r.oppSetupTag.toLowerCase().includes('lurk') ||
      r.oppSetupTag.toLowerCase().includes('solo') ||
      r.oppSetupTag.toLowerCase().includes('1-3-1') ||
      r.oppSetupTag.toLowerCase().includes('weak'),
  );
  if (lurkOrSoloRounds.length >= 2) {
    const c9ExploitedWins = lurkOrSoloRounds.filter((r) => r.winner === 'C9').length;
    const metric = wilsonInterval(c9ExploitedWins, lurkOrSoloRounds.length);
    const roundNums = lurkOrSoloRounds.map((r) => r.roundNumber);
    const sev = classifySeverity(lurkOrSoloRounds.length / Math.max(1, rounds.length) + 0.3, lurkOrSoloRounds.length);

    tendencies.push({
      id: 'tendency-lurk-anchor',
      title: `${match.opponentTag} exposes solo-anchor / recurring lurk lanes`,
      category: 'lurk',
      severity: sev,
      sampleLabel: `${lurkOrSoloRounds.length} flagged rounds`,
      metric,
      evidenceSummary: `Detected ${lurkOrSoloRounds.length} rounds with solo-anchor setups or predictable flank lurks; C9 converted ${formatPct(metric.rate)} when contesting these lanes.`,
      supportingRounds: roundNums,
    });

    const targetSide = oppDefRounds.length >= oppAtkRounds.length ? 'attack' : 'defense';
    calls.push({
      id: 'call-punish-solo-lurk',
      priority: 3,
      sideContext: targetSide,
      triggerCondition: `${match.opponentTag} shows 3+ players mid/opposite site early`,
      callTitle: 'Fast Pivot Overload & Rear Lurk Trap',
      executionPlan: `Condition early noise on primary lane for 12s, leave 1 lurk-watcher with Sentinel trip/flash, then 4-man burst the isolated anchor site before rotates arrive.`,
      expectedGain: `Targets recurring solo-anchor gaps documented in Rounds ${roundNums.slice(0, 5).map((n) => `#${n}`).join(', ')}.`,
      confidence: sev,
      supportingRounds: roundNums,
      linkedTendencyId: 'tendency-lurk-anchor',
    });
  }

  // 4. Site Concentration & Utility Trigger Exploit
  const oppSiteCounts = mapInfo.sites.map((site) => {
    const siteRounds = oppAtkRounds.filter((r) => r.targetSite === site);
    return { site, count: siteRounds.length, rounds: siteRounds };
  });
  oppSiteCounts.sort((a, b) => b.count - a.count);
  const topSite = oppSiteCounts[0];
  if (topSite && oppAtkRounds.length >= 3 && topSite.count / oppAtkRounds.length >= 0.4) {
    const metric = wilsonInterval(topSite.count, oppAtkRounds.length);
    const roundNums = topSite.rounds.map((r) => r.roundNumber);
    const sev = classifySeverity(metric.rate, oppAtkRounds.length);

    tendencies.push({
      id: 'tendency-site-bias',
      title: `Heavy Site ${topSite.site} attack concentration (${formatPct(metric.rate)})`,
      category: 'setup',
      severity: sev,
      sampleLabel: `${topSite.count}/${oppAtkRounds.length} opp attacks`,
      metric,
      evidenceSummary: `${match.opponentTag} commits to Site ${topSite.site} in ${topSite.count} of ${oppAtkRounds.length} attack rounds (95% CI ${formatPct(metric.low)}–${formatPct(metric.high)}).`,
      supportingRounds: roundNums,
    });

    calls.push({
      id: 'call-stack-counter-site',
      priority: 4,
      sideContext: 'defense',
      triggerCondition: `Gun rounds vs ${match.opponentTag} default on ${mapInfo.name}`,
      callTitle: `Heavy 3-Player Stronghold & Early Info on ${topSite.site}`,
      executionPlan: `Deploy 3-2 defensive weight toward ${topSite.site} with double-initiator counter-flash ready for choke contact while weak-side plays fast-retake info.`,
      expectedGain: `Direct statistical counter to ${formatPct(metric.rate)} Site ${topSite.site} target frequency.`,
      confidence: sev,
      supportingRounds: roundNums,
      linkedTendencyId: 'tendency-site-bias',
    });
  }

  // 5. Post-Plant Conversion / Retake Vulnerability
  const oppPlantedRounds = oppAtkRounds.filter((r) => r.plantSec !== null);
  if (oppPlantedRounds.length >= 3) {
    const oppPostPlantWins = oppPlantedRounds.filter((r) => r.winner === 'OPP').length;
    const metric = wilsonInterval(oppPostPlantWins, oppPlantedRounds.length);
    const roundNums = oppPlantedRounds.map((r) => r.roundNumber);
    const isStrongPostPlant = metric.rate >= 0.55;
    const sev = classifySeverity(
      isStrongPostPlant ? metric.rate : 1 - metric.rate,
      oppPlantedRounds.length,
    );

    tendencies.push({
      id: 'tendency-post-plant',
      title: isStrongPostPlant
        ? `${match.opponentTag} converts ${formatPct(metric.rate)} of post-plants with stall lineups`
        : `${match.opponentTag} struggles in post-plant holds (${formatPct(metric.rate)} win rate)`,
      category: 'post-plant',
      severity: sev,
      sampleLabel: `${oppPostPlantWins}/${oppPlantedRounds.length} post-plants won`,
      metric,
      evidenceSummary: isStrongPostPlant
        ? `Once ${match.opponentTag} sticks spike, they close ${oppPostPlantWins}/${oppPlantedRounds.length} rounds via off-site mollies/lineups.`
        : `${match.opponentTag} lost ${oppPlantedRounds.length - oppPostPlantWins} of ${oppPlantedRounds.length} rounds even after planting spike.`,
      supportingRounds: roundNums,
    });

    calls.push({
      id: 'call-post-plant-protocol',
      priority: 5,
      sideContext: 'defense',
      triggerCondition: isStrongPostPlant
        ? 'Spike tap or post-plant lineup threat active'
        : 'Opponent commits onto site and plants spike',
      callTitle: isStrongPostPlant
        ? 'Deny Plant Choke Early / Discipline Save When <3 Alive'
        : 'Synchronized 3-Man Flood Retake with Smoke-Off Main',
      executionPlan: isStrongPostPlant
        ? `Invest defensive molly/shock on default plant box at t=plant attempt; if down 2v4 post-plant against lineup utility, call immediate weapon save.`
        : `Avoid 1v1 hero retakes; group 3 players at link/spawn, drop retake smoke on main choke, and double-swing site off Initiator flash.`,
      expectedGain: isStrongPostPlant
        ? `Prevents economy collapse against ${formatPct(metric.rate)} opponent post-plant conversion.`
        : `Capitalizes on ${formatPct(1 - metric.rate)} C9 retake conversion rate.`,
      confidence: sev,
      supportingRounds: roundNums,
      linkedTendencyId: 'tendency-post-plant',
    });
  }

  // Fallback call when custom short dataset (<3 rounds) is uploaded
  if (tendencies.length === 0 && rounds.length > 0) {
    const firstNums = rounds.map((r) => r.roundNumber);
    const metric = wilsonInterval(
      rounds.filter((r) => r.winner === 'C9').length,
      rounds.length,
    );
    tendencies.push({
      id: 'tendency-small-sample',
      title: `Limited sample (${rounds.length} rounds) — preliminary baseline only`,
      category: 'setup',
      severity: 'low',
      sampleLabel: `${rounds.length} rounds`,
      metric,
      evidenceSummary:
        'Upload 6+ rounds for high-confidence timing, eco, and lurk pattern detection.',
      supportingRounds: firstNums,
    });
    calls.push({
      id: 'call-baseline-default',
      priority: 1,
      sideContext: 'attack',
      triggerCondition: 'Early scouting series (< 6 rounds)',
      callTitle: 'Balanced 1-3-1 Information Default',
      executionPlan:
        'Collect early Mid utility reactions before committing site execute; tag opponent anchor rotations in next 3 rounds.',
      expectedGain: 'Builds reliable statistical sample without risking dry site hits.',
      confidence: 'low',
      supportingRounds: firstNums,
      linkedTendencyId: 'tendency-small-sample',
    });
  }

  // Sort calls cleanly by priority
  calls.sort((a, b) => a.priority - b.priority);

  return { tendencies, calls };
}
