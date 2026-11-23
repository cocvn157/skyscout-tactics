import type {
  AgentRole,
  BuyType,
  Coordinate,
  KillEvent,
  MapId,
  MatchSeries,
  OutcomeReason,
  PlayerSnapshot,
  RoundTelemetry,
  TargetSite,
  TeamTag,
  UtilityEvent,
  UtilityType,
} from '../types/telemetry';
import { MAP_BLUEPRINTS } from './maps';

interface RosterMember {
  name: string;
  agent: string;
  role: AgentRole;
  primaryUtility: { ability: string; type: UtilityType; radius: number; durationSec: number };
}

interface RoundBlueprintSpec {
  roundNumber: number;
  attackTeam: TeamTag;
  winner: TeamTag;
  outcomeReason: OutcomeReason;
  attackBuyType: BuyType;
  defenseBuyType: BuyType;
  attackTeamBank: number;
  defenseTeamBank: number;
  targetSite: TargetSite;
  executeSec: number | null;
  plantSec: number | null;
  oppSetupTag: string;
  firstBloodTeam: TeamTag;
  fbAtSec: number;
  weapon: string;
}

const C9_ROSTER_BY_MAP: Record<MapId, RosterMember[]> = {
  ascent: [
    {
      name: 'oxy',
      agent: 'Jett',
      role: 'Duelist',
      primaryUtility: { ability: 'Cloudburst + Tailwind', type: 'dash', radius: 4.5, durationSec: 5 },
    },
    {
      name: 'mitch',
      agent: 'Sova',
      role: 'Initiator',
      primaryUtility: { ability: 'Recon Bolt', type: 'recon', radius: 7.5, durationSec: 6 },
    },
    {
      name: 'Xeppaa',
      agent: 'KAY/O',
      role: 'Initiator',
      primaryUtility: { ability: 'FLASH/drive', type: 'flash', radius: 5.2, durationSec: 3.5 },
    },
    {
      name: 'v1c',
      agent: 'Omen',
      role: 'Controller',
      primaryUtility: { ability: 'Dark Cover', type: 'smoke', radius: 6.8, durationSec: 15 },
    },
    {
      name: 'moose',
      agent: 'Cypher',
      role: 'Sentinel',
      primaryUtility: { ability: 'Cyber Cage', type: 'smoke', radius: 5.0, durationSec: 7 },
    },
  ],
  haven: [
    {
      name: 'oxy',
      agent: 'Neon',
      role: 'Duelist',
      primaryUtility: { ability: 'Fast Lane', type: 'wall', radius: 6.0, durationSec: 6 },
    },
    {
      name: 'Xeppaa',
      agent: 'Breach',
      role: 'Initiator',
      primaryUtility: { ability: 'Flashpoint', type: 'flash', radius: 5.5, durationSec: 3.5 },
    },
    {
      name: 'mitch',
      agent: 'Sova',
      role: 'Initiator',
      primaryUtility: { ability: 'Owl Drone / Recon', type: 'recon', radius: 7.2, durationSec: 6.5 },
    },
    {
      name: 'v1c',
      agent: 'Omen',
      role: 'Controller',
      primaryUtility: { ability: 'Dark Cover', type: 'smoke', radius: 6.6, durationSec: 15 },
    },
    {
      name: 'moose',
      agent: 'Cypher',
      role: 'Sentinel',
      primaryUtility: { ability: 'Trapwire + Cage', type: 'smoke', radius: 5.2, durationSec: 7 },
    },
  ],
  bind: [
    {
      name: 'oxy',
      agent: 'Raze',
      role: 'Duelist',
      primaryUtility: { ability: 'Paint Shells', type: 'molly', radius: 5.2, durationSec: 4.5 },
    },
    {
      name: 'Xeppaa',
      agent: 'Skye',
      role: 'Initiator',
      primaryUtility: { ability: 'Guiding Light', type: 'flash', radius: 5.5, durationSec: 3.5 },
    },
    {
      name: 'mitch',
      agent: 'Gekko',
      role: 'Initiator',
      primaryUtility: { ability: 'Dizzy', type: 'flash', radius: 6.2, durationSec: 4 },
    },
    {
      name: 'v1c',
      agent: 'Brimstone',
      role: 'Controller',
      primaryUtility: { ability: 'Sky Smoke', type: 'smoke', radius: 6.8, durationSec: 19 },
    },
    {
      name: 'moose',
      agent: 'Viper',
      role: 'Controller',
      primaryUtility: { ability: 'Poison Cloud', type: 'molly', radius: 6.4, durationSec: 14 },
    },
  ],
};

const OPP_ROSTER_BY_MAP: Record<MapId, RosterMember[]> = {
  ascent: [
    {
      name: 'mada',
      agent: 'Jett',
      role: 'Duelist',
      primaryUtility: { ability: 'Tailwind Entry', type: 'dash', radius: 4.5, durationSec: 4.5 },
    },
    {
      name: 'Ethan',
      agent: 'KAY/O',
      role: 'Initiator',
      primaryUtility: { ability: 'ZERO/point', type: 'recon', radius: 7.4, durationSec: 5 },
    },
    {
      name: 'brawk',
      agent: 'Sova',
      role: 'Initiator',
      primaryUtility: { ability: 'Recon Bolt', type: 'recon', radius: 7.5, durationSec: 6 },
    },
    {
      name: 's0m',
      agent: 'Omen',
      role: 'Controller',
      primaryUtility: { ability: 'Paranoia + Smoke', type: 'smoke', radius: 6.8, durationSec: 15 },
    },
    {
      name: 'FNS',
      agent: 'Killjoy',
      role: 'Sentinel',
      primaryUtility: { ability: 'Nanoswarm', type: 'molly', radius: 5.0, durationSec: 4.5 },
    },
  ],
  haven: [
    {
      name: 'zekken',
      agent: 'Neon',
      role: 'Duelist',
      primaryUtility: { ability: 'Relay Bolt', type: 'flash', radius: 5.0, durationSec: 3.5 },
    },
    {
      name: 'N4RRATE',
      agent: 'Fade',
      role: 'Initiator',
      primaryUtility: { ability: 'Haunt', type: 'recon', radius: 7.6, durationSec: 5.5 },
    },
    {
      name: 'johnqt',
      agent: 'Cypher',
      role: 'Sentinel',
      primaryUtility: { ability: 'Cyber Cage', type: 'smoke', radius: 5.0, durationSec: 7 },
    },
    {
      name: 'bang',
      agent: 'Omen',
      role: 'Controller',
      primaryUtility: { ability: 'Dark Cover', type: 'smoke', radius: 6.8, durationSec: 15 },
    },
    {
      name: 'Zellsis',
      agent: 'Breach',
      role: 'Initiator',
      primaryUtility: { ability: 'Aftershock', type: 'molly', radius: 4.8, durationSec: 4 },
    },
  ],
  bind: [
    {
      name: 'dgzin',
      agent: 'Raze',
      role: 'Duelist',
      primaryUtility: { ability: 'Blast Pack + Nade', type: 'molly', radius: 5.0, durationSec: 4.5 },
    },
    {
      name: 'cauanzin',
      agent: 'Skye',
      role: 'Initiator',
      primaryUtility: { ability: 'Trailblazer', type: 'recon', radius: 6.2, durationSec: 5 },
    },
    {
      name: 'tuyz',
      agent: 'Brimstone',
      role: 'Controller',
      primaryUtility: { ability: 'Incendiary Lineup', type: 'molly', radius: 5.8, durationSec: 7.5 },
    },
    {
      name: 'lukxo',
      agent: 'Viper',
      role: 'Controller',
      primaryUtility: { ability: 'Snake Bite', type: 'molly', radius: 5.6, durationSec: 6.5 },
    },
    {
      name: 'pANcada',
      agent: 'Gekko',
      role: 'Initiator',
      primaryUtility: { ability: 'Mosh Pit', type: 'molly', radius: 5.4, durationSec: 5 },
    },
  ],
};

function clampPos(x: number, y: number): Coordinate {
  return {
    x: Math.max(5, Math.min(95, Number(x.toFixed(1)))),
    y: Math.max(5, Math.min(95, Number(y.toFixed(1)))),
  };
}

function getSiteLaneAnchors(map: MapId, site: TargetSite): {
  choke: Coordinate;
  siteCenter: Coordinate;
  smokePoint: Coordinate;
  flankPoint: Coordinate;
} {
  const bp = MAP_BLUEPRINTS[map];
  const resolvedSite: 'A' | 'B' | 'C' =
    site === 'A' || site === 'B' || site === 'C' ? site : bp.sites[0] ?? 'A';
  const center = bp.defaultPlantAnchors[resolvedSite];

  if (map === 'ascent') {
    if (resolvedSite === 'A') {
      return {
        choke: { x: 78, y: 50 },
        siteCenter: center,
        smokePoint: { x: 67, y: 22 },
        flankPoint: { x: 54, y: 44 },
      };
    }
    return {
      choke: { x: 18, y: 51 },
      siteCenter: center,
      smokePoint: { x: 35, y: 29 },
      flankPoint: { x: 47, y: 54 },
    };
  }

  if (map === 'haven') {
    if (resolvedSite === 'A') {
      return {
        choke: { x: 83, y: 48 },
        siteCenter: center,
        smokePoint: { x: 70, y: 20 },
        flankPoint: { x: 66, y: 46 },
      };
    }
    if (resolvedSite === 'B') {
      return {
        choke: { x: 50, y: 49 },
        siteCenter: center,
        smokePoint: { x: 41, y: 24 },
        flankPoint: { x: 32, y: 42 },
      };
    }
    return {
      choke: { x: 15, y: 50 },
      siteCenter: center,
      smokePoint: { x: 28, y: 22 },
      flankPoint: { x: 31, y: 40 },
    };
  }

  // Bind
  if (resolvedSite === 'A') {
    return {
      choke: { x: 82, y: 48 },
      siteCenter: center,
      smokePoint: { x: 69, y: 21 },
      flankPoint: { x: 61, y: 48 },
    };
  }
  return {
    choke: { x: 28, y: 47 },
    siteCenter: center,
    smokePoint: { x: 33, y: 21 },
    flankPoint: { x: 14, y: 54 },
  };
}

function buildRoundFromSpec(map: MapId, spec: RoundBlueprintSpec): RoundTelemetry {
  const bp = MAP_BLUEPRINTS[map];
  const anchors = getSiteLaneAnchors(map, spec.targetSite);
  const c9Roster = C9_ROSTER_BY_MAP[map];
  const oppRoster = OPP_ROSTER_BY_MAP[map];

  const atkRoster = spec.attackTeam === 'C9' ? c9Roster : oppRoster;
  const defRoster = spec.attackTeam === 'C9' ? oppRoster : c9Roster;

  const isLurkRound = spec.oppSetupTag.toLowerCase().includes('lurk');
  const plantPos =
    spec.plantSec !== null
      ? clampPos(
          anchors.siteCenter.x + ((spec.roundNumber % 3) - 1) * 1.9,
          anchors.siteCenter.y + ((spec.roundNumber % 2) === 0 ? 1.4 : -1.6),
        )
      : null;

  const buildSidePlayers = (
    roster: RosterMember[],
    team: TeamTag,
    isAttack: boolean,
  ): PlayerSnapshot[] =>
    roster.map((member, idx) => {
      const spawn = isAttack ? bp.attackSpawnCenter : bp.defenseSpawnCenter;
      const startPos = clampPos(
        spawn.x + (idx - 2) * 5.5,
        spawn.y + (isAttack ? -3 : 3),
      );

      let endPos: Coordinate;
      if (isAttack) {
        if (idx === 4 && isLurkRound) {
          endPos = clampPos(anchors.flankPoint.x, anchors.flankPoint.y + 6);
        } else if (idx === 0 || idx === 1) {
          endPos = clampPos(
            anchors.siteCenter.x + (idx === 0 ? -3 : 4),
            anchors.siteCenter.y + (idx === 0 ? 3 : -2),
          );
        } else {
          endPos = clampPos(
            anchors.choke.x + (idx - 2.5) * 4,
            anchors.choke.y - 9 + idx * 1.5,
          );
        }
      } else {
        if (idx === 4) {
          endPos = clampPos(anchors.siteCenter.x + 4, anchors.siteCenter.y - 6);
        } else if (idx === 3) {
          endPos = clampPos(anchors.smokePoint.x, anchors.smokePoint.y + 3);
        } else {
          endPos = clampPos(
            anchors.siteCenter.x + (idx - 1) * 6,
            anchors.siteCenter.y - 3,
          );
        }
      }

      const teamWon = spec.winner === team;
      const alive = teamWon ? idx < 3 : idx === 3 && spec.outcomeReason === 'spike-detonated';
      const firstBlood = idx === 0 && spec.firstBloodTeam === team;
      const firstDeath = idx === 4 && spec.firstBloodTeam !== team;

      return {
        playerId: `${team.toLowerCase()}-${idx + 1}`,
        name: member.name,
        team,
        agent: member.agent,
        role: member.role,
        alive,
        hp: alive ? 64 + ((spec.roundNumber * 13 + idx * 17) % 36) : 0,
        credits: Math.round((isAttack ? spec.attackTeamBank : spec.defenseTeamBank) / 5),
        loadoutValue:
          (isAttack ? spec.attackBuyType : spec.defenseBuyType) === 'full-buy'
            ? 4350
            : (isAttack ? spec.attackBuyType : spec.defenseBuyType) === 'force'
              ? 3050
              : (isAttack ? spec.attackBuyType : spec.defenseBuyType) === 'half-buy'
                ? 1950
                : 800,
        startPos,
        endPos,
        firstBlood,
        firstDeath,
        kills: firstBlood ? 2 : teamWon && idx < 3 ? 1 : 0,
        deaths: alive ? 0 : 1,
        assists: idx === 1 || idx === 3 ? 1 : 0,
      };
    });

  const players = [
    ...buildSidePlayers(
      c9Roster,
      'C9',
      spec.attackTeam === 'C9',
    ),
    ...buildSidePlayers(
      oppRoster,
      'OPP',
      spec.attackTeam === 'OPP',
    ),
  ];

  const execTime = spec.executeSec ?? 36;
  const siteCode: 'A' | 'B' | 'C' | 'Mid' =
    spec.targetSite === 'A' || spec.targetSite === 'B' || spec.targetSite === 'C'
      ? spec.targetSite
      : 'Mid';

  const atkSmoker = atkRoster[3]!;
  const atkInitiator = atkRoster[1]!;
  const atkDuelist = atkRoster[0]!;
  const defInitiator = defRoster[1]!;
  const defSentinel = defRoster[4]!;

  const utility: UtilityEvent[] = [
    {
      id: `r${spec.roundNumber}-u1`,
      timestampSec: Math.max(5, Math.min(18, execTime - 10)),
      actorName: defInitiator.name,
      team: spec.attackTeam === 'C9' ? 'OPP' : 'C9',
      agent: defInitiator.agent,
      ability: defInitiator.primaryUtility.ability,
      type: defInitiator.primaryUtility.type,
      from: clampPos(anchors.siteCenter.x, anchors.siteCenter.y - 6),
      to: clampPos(anchors.choke.x, anchors.choke.y + 4),
      radius: defInitiator.primaryUtility.radius,
      durationSec: defInitiator.primaryUtility.durationSec,
      site: siteCode,
    },
    {
      id: `r${spec.roundNumber}-u2`,
      timestampSec: Math.max(8, execTime - 3),
      actorName: atkSmoker.name,
      team: spec.attackTeam,
      agent: atkSmoker.agent,
      ability: atkSmoker.primaryUtility.ability,
      type: 'smoke',
      from: clampPos(anchors.choke.x - 4, anchors.choke.y + 14),
      to: anchors.smokePoint,
      radius: atkSmoker.primaryUtility.radius,
      durationSec: atkSmoker.primaryUtility.durationSec,
      site: siteCode,
    },
    {
      id: `r${spec.roundNumber}-u3`,
      timestampSec: Math.max(10, execTime - 1),
      actorName: atkInitiator.name,
      team: spec.attackTeam,
      agent: atkInitiator.agent,
      ability: atkInitiator.primaryUtility.ability,
      type: atkInitiator.primaryUtility.type,
      from: clampPos(anchors.choke.x, anchors.choke.y + 6),
      to: clampPos(anchors.siteCenter.x, anchors.siteCenter.y + 2),
      radius: atkInitiator.primaryUtility.radius,
      durationSec: atkInitiator.primaryUtility.durationSec,
      site: siteCode,
    },
    {
      id: `r${spec.roundNumber}-u4`,
      timestampSec: execTime + 2,
      actorName: atkDuelist.name,
      team: spec.attackTeam,
      agent: atkDuelist.agent,
      ability: atkDuelist.primaryUtility.ability,
      type: atkDuelist.primaryUtility.type,
      from: anchors.choke,
      to: anchors.siteCenter,
      radius: atkDuelist.primaryUtility.radius,
      durationSec: atkDuelist.primaryUtility.durationSec,
      site: siteCode,
    },
  ];

  if (spec.plantSec !== null) {
    utility.push({
      id: `r${spec.roundNumber}-u5`,
      timestampSec: spec.plantSec + 8,
      actorName: defSentinel.name,
      team: spec.attackTeam === 'C9' ? 'OPP' : 'C9',
      agent: defSentinel.agent,
      ability: defSentinel.primaryUtility.ability,
      type: defSentinel.primaryUtility.type,
      from: clampPos(anchors.siteCenter.x + 8, anchors.siteCenter.y - 8),
      to: plantPos ?? anchors.siteCenter,
      radius: defSentinel.primaryUtility.radius,
      durationSec: defSentinel.primaryUtility.durationSec,
      site: siteCode,
    });
  }

  const fbKiller =
    spec.firstBloodTeam === spec.attackTeam ? atkRoster[0]! : defRoster[0]!;
  const fbVictim =
    spec.firstBloodTeam === spec.attackTeam ? defRoster[4]! : atkRoster[4]!;

  const winTeamRoster = spec.winner === 'C9' ? c9Roster : oppRoster;
  const loseTeamRoster = spec.winner === 'C9' ? oppRoster : c9Roster;

  const kills: KillEvent[] = [
    {
      id: `r${spec.roundNumber}-k1`,
      timestampSec: spec.fbAtSec,
      killer: fbKiller.name,
      killerTeam: spec.firstBloodTeam,
      victim: fbVictim.name,
      victimTeam: spec.firstBloodTeam === 'C9' ? 'OPP' : 'C9',
      weapon: spec.weapon,
      killerPos: clampPos(anchors.choke.x - 2, anchors.choke.y - 2),
      victimPos: clampPos(anchors.siteCenter.x + 2, anchors.siteCenter.y - 2),
      isFirstBlood: true,
      tradedWithinSec: spec.winner !== spec.firstBloodTeam ? 3 : undefined,
    },
    {
      id: `r${spec.roundNumber}-k2`,
      timestampSec: spec.fbAtSec + 6,
      killer: winTeamRoster[1]!.name,
      killerTeam: spec.winner,
      victim: loseTeamRoster[1]!.name,
      victimTeam: spec.winner === 'C9' ? 'OPP' : 'C9',
      weapon: spec.weapon,
      killerPos: clampPos(anchors.siteCenter.x - 4, anchors.siteCenter.y + 4),
      victimPos: clampPos(anchors.siteCenter.x + 3, anchors.siteCenter.y - 5),
      isFirstBlood: false,
    },
    {
      id: `r${spec.roundNumber}-k3`,
      timestampSec: (spec.plantSec ?? execTime + 10) + 12,
      killer: winTeamRoster[2]!.name,
      killerTeam: spec.winner,
      victim: loseTeamRoster[2]!.name,
      victimTeam: spec.winner === 'C9' ? 'OPP' : 'C9',
      weapon: spec.weapon,
      killerPos: clampPos(anchors.smokePoint.x + 2, anchors.smokePoint.y + 4),
      victimPos: clampPos(anchors.siteCenter.x - 1, anchors.siteCenter.y + 2),
      isFirstBlood: false,
    },
  ];

  return {
    roundNumber: spec.roundNumber,
    half: spec.roundNumber <= 12 ? 1 : spec.roundNumber <= 24 ? 2 : 'OT',
    attackTeam: spec.attackTeam,
    winner: spec.winner,
    outcomeReason: spec.outcomeReason,
    attackBuyType: spec.attackBuyType,
    defenseBuyType: spec.defenseBuyType,
    attackTeamBank: spec.attackTeamBank,
    defenseTeamBank: spec.defenseTeamBank,
    targetSite: spec.targetSite,
    executeSec: spec.executeSec,
    plantSec: spec.plantSec,
    plantPos,
    postPlantOutcome:
      spec.plantSec === null
        ? null
        : spec.winner === spec.attackTeam
          ? 'won'
          : 'lost',
    oppSetupTag: spec.oppSetupTag,
    roundDurationSec: Math.max(52, (spec.plantSec ?? execTime + 15) + 26),
    players,
    utility,
    kills,
  };
}

function createMatchSeries(
  base: Omit<MatchSeries, 'finalScore' | 'rounds'>,
  specs: RoundBlueprintSpec[],
): MatchSeries {
  const rounds = specs.map((spec) => buildRoundFromSpec(base.map, spec));
  const c9 = rounds.filter((r) => r.winner === 'C9').length;
  return {
    ...base,
    finalScore: { c9, opp: rounds.length - c9 },
    rounds,
  };
}

// MATCH 1: Ascent — C9 vs NRG (22 rounds, 13-9)
// Pattern: NRG runs late 55s+ B-Market splits on full buys, aggressive Force/Eco A-Main crunches, solo B anchor on defense
const ASCENT_SPECS: RoundBlueprintSpec[] = [
  { roundNumber: 1, attackTeam: 'OPP', winner: 'OPP', outcomeReason: 'spike-detonated', attackBuyType: 'pistol', defenseBuyType: 'pistol', attackTeamBank: 4000, defenseTeamBank: 4000, targetSite: 'B', executeSec: 61, plantSec: 68, oppSetupTag: 'Late B-Market Split', firstBloodTeam: 'OPP', fbAtSec: 56, weapon: 'Ghost' },
  { roundNumber: 2, attackTeam: 'OPP', winner: 'OPP', outcomeReason: 'elimination', attackBuyType: 'full-buy', defenseBuyType: 'eco', attackTeamBank: 18400, defenseTeamBank: 8400, targetSite: 'A', executeSec: 26, plantSec: 34, oppSetupTag: 'Anti-Eco A-Main Crunch', firstBloodTeam: 'OPP', fbAtSec: 21, weapon: 'Spectre' },
  { roundNumber: 3, attackTeam: 'OPP', winner: 'C9', outcomeReason: 'elimination', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 22100, defenseTeamBank: 20400, targetSite: 'B', executeSec: 59, plantSec: null, oppSetupTag: 'Late B-Market Default', firstBloodTeam: 'C9', fbAtSec: 48, weapon: 'Vandal' },
  { roundNumber: 4, attackTeam: 'OPP', winner: 'C9', outcomeReason: 'spike-defused', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 21500, defenseTeamBank: 23200, targetSite: 'B', executeSec: 64, plantSec: 71, oppSetupTag: 'Late B-Market + Cat Lurk', firstBloodTeam: 'C9', fbAtSec: 59, weapon: 'Vandal' },
  { roundNumber: 5, attackTeam: 'OPP', winner: 'C9', outcomeReason: 'elimination', attackBuyType: 'eco', defenseBuyType: 'full-buy', attackTeamBank: 9200, defenseTeamBank: 24900, targetSite: 'A', executeSec: 22, plantSec: null, oppSetupTag: 'Eco A-Main Stack Rush', firstBloodTeam: 'C9', fbAtSec: 17, weapon: 'Phantom' },
  { roundNumber: 6, attackTeam: 'OPP', winner: 'OPP', outcomeReason: 'spike-detonated', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 22400, defenseTeamBank: 25600, targetSite: 'B', executeSec: 63, plantSec: 70, oppSetupTag: 'Late B-Market Split', firstBloodTeam: 'OPP', fbAtSec: 58, weapon: 'Vandal' },
  { roundNumber: 7, attackTeam: 'OPP', winner: 'C9', outcomeReason: 'elimination', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 24200, defenseTeamBank: 21800, targetSite: 'A', executeSec: 57, plantSec: 66, oppSetupTag: 'Late A-Tree Split', firstBloodTeam: 'C9', fbAtSec: 52, weapon: 'Vandal' },
  { roundNumber: 8, attackTeam: 'OPP', winner: 'C9', outcomeReason: 'elimination', attackBuyType: 'force', defenseBuyType: 'full-buy', attackTeamBank: 14800, defenseTeamBank: 24400, targetSite: 'A', executeSec: 24, plantSec: null, oppSetupTag: 'Force A-Main Crunch', firstBloodTeam: 'C9', fbAtSec: 19, weapon: 'Vandal' },
  { roundNumber: 9, attackTeam: 'OPP', winner: 'OPP', outcomeReason: 'spike-detonated', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 21200, defenseTeamBank: 25100, targetSite: 'B', executeSec: 62, plantSec: 69, oppSetupTag: 'Late B-Main + Market Exec', firstBloodTeam: 'OPP', fbAtSec: 57, weapon: 'Vandal' },
  { roundNumber: 10, attackTeam: 'OPP', winner: 'OPP', outcomeReason: 'spike-detonated', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 24800, defenseTeamBank: 21400, targetSite: 'B', executeSec: 58, plantSec: 65, oppSetupTag: 'Late B-Market Pinch', firstBloodTeam: 'OPP', fbAtSec: 54, weapon: 'Phantom' },
  { roundNumber: 11, attackTeam: 'OPP', winner: 'C9', outcomeReason: 'elimination', attackBuyType: 'full-buy', defenseBuyType: 'half-buy', attackTeamBank: 26100, defenseTeamBank: 14200, targetSite: 'A', executeSec: 44, plantSec: null, oppSetupTag: 'Mid Catwalk Default', firstBloodTeam: 'C9', fbAtSec: 36, weapon: 'Sheriff' },
  { roundNumber: 12, attackTeam: 'OPP', winner: 'C9', outcomeReason: 'spike-defused', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 24500, defenseTeamBank: 22900, targetSite: 'B', executeSec: 60, plantSec: 68, oppSetupTag: 'Late B-Market Lurk Split', firstBloodTeam: 'OPP', fbAtSec: 55, weapon: 'Vandal' },
  { roundNumber: 13, attackTeam: 'C9', winner: 'C9', outcomeReason: 'spike-detonated', attackBuyType: 'pistol', defenseBuyType: 'pistol', attackTeamBank: 4000, defenseTeamBank: 4000, targetSite: 'B', executeSec: 27, plantSec: 34, oppSetupTag: 'Solo B Anchor (Killjoy)', firstBloodTeam: 'C9', fbAtSec: 22, weapon: 'Ghost' },
  { roundNumber: 14, attackTeam: 'C9', winner: 'C9', outcomeReason: 'elimination', attackBuyType: 'full-buy', defenseBuyType: 'eco', attackTeamBank: 19400, defenseTeamBank: 8600, targetSite: 'A', executeSec: 29, plantSec: 37, oppSetupTag: 'Eco A-Main Stack Push', firstBloodTeam: 'C9', fbAtSec: 23, weapon: 'Bulldog' },
  { roundNumber: 15, attackTeam: 'C9', winner: 'OPP', outcomeReason: 'elimination', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 23400, defenseTeamBank: 21100, targetSite: 'A', executeSec: 41, plantSec: null, oppSetupTag: 'Fast A-Tree Retake', firstBloodTeam: 'OPP', fbAtSec: 34, weapon: 'Vandal' },
  { roundNumber: 16, attackTeam: 'C9', winner: 'C9', outcomeReason: 'spike-detonated', attackBuyType: 'full-buy', defenseBuyType: 'force', attackTeamBank: 22800, defenseTeamBank: 15100, targetSite: 'B', executeSec: 35, plantSec: 42, oppSetupTag: 'Force B-Main Crunch + Solo Anchor', firstBloodTeam: 'C9', fbAtSec: 29, weapon: 'Vandal' },
  { roundNumber: 17, attackTeam: 'C9', winner: 'OPP', outcomeReason: 'spike-defused', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 24900, defenseTeamBank: 21900, targetSite: 'A', executeSec: 46, plantSec: 53, oppSetupTag: 'Heavy A-Main Crossfire', firstBloodTeam: 'OPP', fbAtSec: 40, weapon: 'Operator' },
  { roundNumber: 18, attackTeam: 'C9', winner: 'C9', outcomeReason: 'spike-detonated', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 22100, defenseTeamBank: 23800, targetSite: 'B', executeSec: 38, plantSec: 46, oppSetupTag: 'Solo B Anchor Punished', firstBloodTeam: 'C9', fbAtSec: 33, weapon: 'Vandal' },
  { roundNumber: 19, attackTeam: 'C9', winner: 'OPP', outcomeReason: 'elimination', attackBuyType: 'half-buy', defenseBuyType: 'full-buy', attackTeamBank: 14600, defenseTeamBank: 25100, targetSite: 'A', executeSec: 34, plantSec: null, oppSetupTag: 'A-Main Recon Trap', firstBloodTeam: 'OPP', fbAtSec: 27, weapon: 'Vandal' },
  { roundNumber: 20, attackTeam: 'C9', winner: 'C9', outcomeReason: 'spike-detonated', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 23600, defenseTeamBank: 24200, targetSite: 'B', executeSec: 43, plantSec: 51, oppSetupTag: 'Market Fake -> Solo B Overload', firstBloodTeam: 'C9', fbAtSec: 38, weapon: 'Phantom' },
  { roundNumber: 21, attackTeam: 'C9', winner: 'OPP', outcomeReason: 'elimination', attackBuyType: 'full-buy', defenseBuyType: 'force', attackTeamBank: 25200, defenseTeamBank: 15800, targetSite: 'A', executeSec: 28, plantSec: null, oppSetupTag: 'Force Mid-Tiles Crunch', firstBloodTeam: 'OPP', fbAtSec: 21, weapon: 'Spectre' },
  { roundNumber: 22, attackTeam: 'C9', winner: 'C9', outcomeReason: 'spike-detonated', attackBuyType: 'full-buy', defenseBuyType: 'eco', attackTeamBank: 24800, defenseTeamBank: 9500, targetSite: 'B', executeSec: 33, plantSec: 40, oppSetupTag: 'Eco Stack A -> Empty B', firstBloodTeam: 'C9', fbAtSec: 28, weapon: 'Vandal' },
];

// MATCH 2: Haven — C9 vs SEN (24 rounds, 13-11)
// Pattern: SEN runs fast <27s C-Long & A-Short bursts, 1-3-1 solo C Cypher anchor on defense, strong post-plant
const HAVEN_SPECS: RoundBlueprintSpec[] = [
  { roundNumber: 1, attackTeam: 'OPP', winner: 'OPP', outcomeReason: 'spike-detonated', attackBuyType: 'pistol', defenseBuyType: 'pistol', attackTeamBank: 4000, defenseTeamBank: 4000, targetSite: 'C', executeSec: 21, plantSec: 28, oppSetupTag: 'Fast C-Long Neon Burst', firstBloodTeam: 'OPP', fbAtSec: 17, weapon: 'Frenzy' },
  { roundNumber: 2, attackTeam: 'OPP', winner: 'OPP', outcomeReason: 'elimination', attackBuyType: 'full-buy', defenseBuyType: 'eco', attackTeamBank: 18600, defenseTeamBank: 8100, targetSite: 'A', executeSec: 24, plantSec: 31, oppSetupTag: 'Fast A-Short Crunch', firstBloodTeam: 'OPP', fbAtSec: 18, weapon: 'Spectre' },
  { roundNumber: 3, attackTeam: 'OPP', winner: 'C9', outcomeReason: 'elimination', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 22500, defenseTeamBank: 20500, targetSite: 'C', executeSec: 25, plantSec: 33, oppSetupTag: 'Fast C-Long Stun Hit', firstBloodTeam: 'C9', fbAtSec: 20, weapon: 'Vandal' },
  { roundNumber: 4, attackTeam: 'OPP', winner: 'OPP', outcomeReason: 'spike-detonated', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 23800, defenseTeamBank: 22400, targetSite: 'C', executeSec: 22, plantSec: 29, oppSetupTag: 'Fast C-Long + Garage Split', firstBloodTeam: 'OPP', fbAtSec: 19, weapon: 'Vandal' },
  { roundNumber: 5, attackTeam: 'OPP', winner: 'C9', outcomeReason: 'elimination', attackBuyType: 'force', defenseBuyType: 'full-buy', attackTeamBank: 14900, defenseTeamBank: 21600, targetSite: 'B', executeSec: 26, plantSec: null, oppSetupTag: 'Force Mid-Window Rush', firstBloodTeam: 'C9', fbAtSec: 21, weapon: 'Phantom' },
  { roundNumber: 6, attackTeam: 'OPP', winner: 'OPP', outcomeReason: 'spike-detonated', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 22200, defenseTeamBank: 24100, targetSite: 'C', executeSec: 27, plantSec: 35, oppSetupTag: 'Fast C-Long Wall Exec', firstBloodTeam: 'OPP', fbAtSec: 23, weapon: 'Vandal' },
  { roundNumber: 7, attackTeam: 'OPP', winner: 'C9', outcomeReason: 'spike-defused', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 24600, defenseTeamBank: 21900, targetSite: 'A', executeSec: 48, plantSec: 55, oppSetupTag: 'A-Long + Short Split', firstBloodTeam: 'C9', fbAtSec: 42, weapon: 'Vandal' },
  { roundNumber: 8, attackTeam: 'OPP', winner: 'OPP', outcomeReason: 'spike-detonated', attackBuyType: 'eco', defenseBuyType: 'full-buy', attackTeamBank: 9400, defenseTeamBank: 24800, targetSite: 'C', executeSec: 20, plantSec: 27, oppSetupTag: 'Eco C-Long 5-Man Rush', firstBloodTeam: 'OPP', fbAtSec: 16, weapon: 'Sheriff' },
  { roundNumber: 9, attackTeam: 'OPP', winner: 'C9', outcomeReason: 'elimination', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 21900, defenseTeamBank: 23600, targetSite: 'A', executeSec: 28, plantSec: null, oppSetupTag: 'Fast A-Long Breach Ult', firstBloodTeam: 'C9', fbAtSec: 22, weapon: 'Vandal' },
  { roundNumber: 10, attackTeam: 'OPP', winner: 'OPP', outcomeReason: 'spike-detonated', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 23400, defenseTeamBank: 22100, targetSite: 'C', executeSec: 24, plantSec: 32, oppSetupTag: 'Fast C-Long Lurk Trap', firstBloodTeam: 'OPP', fbAtSec: 19, weapon: 'Vandal' },
  { roundNumber: 11, attackTeam: 'OPP', winner: 'C9', outcomeReason: 'elimination', attackBuyType: 'full-buy', defenseBuyType: 'half-buy', attackTeamBank: 25100, defenseTeamBank: 14400, targetSite: 'B', executeSec: 39, plantSec: null, oppSetupTag: 'Mid Garage Probe', firstBloodTeam: 'C9', fbAtSec: 31, weapon: 'Bulldog' },
  { roundNumber: 12, attackTeam: 'OPP', winner: 'OPP', outcomeReason: 'spike-detonated', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 24300, defenseTeamBank: 22700, targetSite: 'C', executeSec: 26, plantSec: 34, oppSetupTag: 'Fast C-Long + Garage Pinch', firstBloodTeam: 'OPP', fbAtSec: 21, weapon: 'Vandal' },
  { roundNumber: 13, attackTeam: 'C9', winner: 'C9', outcomeReason: 'spike-detonated', attackBuyType: 'pistol', defenseBuyType: 'pistol', attackTeamBank: 4000, defenseTeamBank: 4000, targetSite: 'C', executeSec: 28, plantSec: 36, oppSetupTag: '1-3-1 Solo C Anchor', firstBloodTeam: 'C9', fbAtSec: 23, weapon: 'Ghost' },
  { roundNumber: 14, attackTeam: 'C9', winner: 'C9', outcomeReason: 'elimination', attackBuyType: 'full-buy', defenseBuyType: 'eco', attackTeamBank: 19200, defenseTeamBank: 8300, targetSite: 'A', executeSec: 26, plantSec: 35, oppSetupTag: 'Eco A-Short Stack', firstBloodTeam: 'C9', fbAtSec: 20, weapon: 'Spectre' },
  { roundNumber: 15, attackTeam: 'C9', winner: 'OPP', outcomeReason: 'elimination', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 23100, defenseTeamBank: 21200, targetSite: 'A', executeSec: 43, plantSec: null, oppSetupTag: 'Early A-Lobby Reclear', firstBloodTeam: 'OPP', fbAtSec: 32, weapon: 'Vandal' },
  { roundNumber: 16, attackTeam: 'C9', winner: 'C9', outcomeReason: 'spike-detonated', attackBuyType: 'full-buy', defenseBuyType: 'force', attackTeamBank: 22400, defenseTeamBank: 14700, targetSite: 'C', executeSec: 37, plantSec: 45, oppSetupTag: '1-3-1 Solo C Punished', firstBloodTeam: 'C9', fbAtSec: 31, weapon: 'Vandal' },
  { roundNumber: 17, attackTeam: 'C9', winner: 'OPP', outcomeReason: 'spike-defused', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 24700, defenseTeamBank: 21800, targetSite: 'B', executeSec: 47, plantSec: 55, oppSetupTag: 'Heavy Garage Flood Retake', firstBloodTeam: 'OPP', fbAtSec: 41, weapon: 'Vandal' },
  { roundNumber: 18, attackTeam: 'C9', winner: 'C9', outcomeReason: 'spike-detonated', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 23200, defenseTeamBank: 23400, targetSite: 'C', executeSec: 34, plantSec: 42, oppSetupTag: 'A-Lobby Fake -> Solo C Hit', firstBloodTeam: 'C9', fbAtSec: 28, weapon: 'Phantom' },
  { roundNumber: 19, attackTeam: 'C9', winner: 'OPP', outcomeReason: 'elimination', attackBuyType: 'half-buy', defenseBuyType: 'full-buy', attackTeamBank: 14500, defenseTeamBank: 24900, targetSite: 'A', executeSec: 31, plantSec: null, oppSetupTag: 'A-Long Operator Hold', firstBloodTeam: 'OPP', fbAtSec: 24, weapon: 'Operator' },
  { roundNumber: 20, attackTeam: 'C9', winner: 'C9', outcomeReason: 'elimination', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 22800, defenseTeamBank: 24100, targetSite: 'C', executeSec: 40, plantSec: 48, oppSetupTag: '1-3-1 Solo C Lurk Trap', firstBloodTeam: 'C9', fbAtSec: 34, weapon: 'Vandal' },
  { roundNumber: 21, attackTeam: 'C9', winner: 'C9', outcomeReason: 'spike-detonated', attackBuyType: 'full-buy', defenseBuyType: 'force', attackTeamBank: 24900, defenseTeamBank: 15200, targetSite: 'A', executeSec: 36, plantSec: 44, oppSetupTag: 'Force Garage Crunch Punished', firstBloodTeam: 'C9', fbAtSec: 29, weapon: 'Vandal' },
  { roundNumber: 22, attackTeam: 'C9', winner: 'OPP', outcomeReason: 'elimination', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 26300, defenseTeamBank: 22400, targetSite: 'B', executeSec: 49, plantSec: null, oppSetupTag: 'Double Initiator Mid Pinch', firstBloodTeam: 'OPP', fbAtSec: 38, weapon: 'Vandal' },
  { roundNumber: 23, attackTeam: 'C9', winner: 'C9', outcomeReason: 'spike-detonated', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 24100, defenseTeamBank: 23900, targetSite: 'C', executeSec: 35, plantSec: 43, oppSetupTag: 'Solo C Cypher Overload', firstBloodTeam: 'C9', fbAtSec: 29, weapon: 'Vandal' },
  { roundNumber: 24, attackTeam: 'C9', winner: 'C9', outcomeReason: 'elimination', attackBuyType: 'full-buy', defenseBuyType: 'eco', attackTeamBank: 26400, defenseTeamBank: 9800, targetSite: 'A', executeSec: 30, plantSec: 38, oppSetupTag: 'Eco A-Short Stack Cleared', firstBloodTeam: 'C9', fbAtSec: 25, weapon: 'Vandal' },
];

// MATCH 3: Bind — C9 vs LOUD (20 rounds, 13-7)
// Pattern: LOUD fast Hookah drops (<25s), heavy B post-plant Brim/Viper lineups, Showers solo defense leaks
const BIND_SPECS: RoundBlueprintSpec[] = [
  { roundNumber: 1, attackTeam: 'OPP', winner: 'OPP', outcomeReason: 'spike-detonated', attackBuyType: 'pistol', defenseBuyType: 'pistol', attackTeamBank: 4000, defenseTeamBank: 4000, targetSite: 'B', executeSec: 21, plantSec: 29, oppSetupTag: 'Fast Hookah Drop', firstBloodTeam: 'OPP', fbAtSec: 17, weapon: 'Ghost' },
  { roundNumber: 2, attackTeam: 'OPP', winner: 'OPP', outcomeReason: 'elimination', attackBuyType: 'full-buy', defenseBuyType: 'eco', attackTeamBank: 18900, defenseTeamBank: 8300, targetSite: 'B', executeSec: 23, plantSec: 30, oppSetupTag: 'Anti-Eco Hookah + Long Crunch', firstBloodTeam: 'OPP', fbAtSec: 18, weapon: 'Spectre' },
  { roundNumber: 3, attackTeam: 'OPP', winner: 'C9', outcomeReason: 'elimination', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 22900, defenseTeamBank: 20400, targetSite: 'A', executeSec: 42, plantSec: null, oppSetupTag: 'Showers + Short Default', firstBloodTeam: 'C9', fbAtSec: 35, weapon: 'Vandal' },
  { roundNumber: 4, attackTeam: 'OPP', winner: 'OPP', outcomeReason: 'spike-detonated', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 23400, defenseTeamBank: 22100, targetSite: 'B', executeSec: 24, plantSec: 31, oppSetupTag: 'Fast Hookah + Brim Lineup', firstBloodTeam: 'OPP', fbAtSec: 20, weapon: 'Vandal' },
  { roundNumber: 5, attackTeam: 'OPP', winner: 'C9', outcomeReason: 'elimination', attackBuyType: 'eco', defenseBuyType: 'full-buy', attackTeamBank: 9500, defenseTeamBank: 23600, targetSite: 'B', executeSec: 19, plantSec: null, oppSetupTag: 'Eco Hookah Drop Rush', firstBloodTeam: 'C9', fbAtSec: 15, weapon: 'Phantom' },
  { roundNumber: 6, attackTeam: 'OPP', winner: 'OPP', outcomeReason: 'spike-detonated', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 22600, defenseTeamBank: 24800, targetSite: 'B', executeSec: 25, plantSec: 32, oppSetupTag: 'B-Long + TP Fake Lineup', firstBloodTeam: 'OPP', fbAtSec: 21, weapon: 'Vandal' },
  { roundNumber: 7, attackTeam: 'OPP', winner: 'C9', outcomeReason: 'elimination', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 24500, defenseTeamBank: 21700, targetSite: 'A', executeSec: 45, plantSec: 53, oppSetupTag: 'Late A-Showers Exec', firstBloodTeam: 'C9', fbAtSec: 39, weapon: 'Vandal' },
  { roundNumber: 8, attackTeam: 'OPP', winner: 'C9', outcomeReason: 'elimination', attackBuyType: 'force', defenseBuyType: 'full-buy', attackTeamBank: 15100, defenseTeamBank: 23900, targetSite: 'B', executeSec: 22, plantSec: null, oppSetupTag: 'Force Hookah Satchel Drop', firstBloodTeam: 'C9', fbAtSec: 17, weapon: 'Vandal' },
  { roundNumber: 9, attackTeam: 'OPP', winner: 'OPP', outcomeReason: 'spike-detonated', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 21800, defenseTeamBank: 24700, targetSite: 'B', executeSec: 24, plantSec: 31, oppSetupTag: 'Fast B + Viper Snake Bite', firstBloodTeam: 'OPP', fbAtSec: 19, weapon: 'Phantom' },
  { roundNumber: 10, attackTeam: 'OPP', winner: 'C9', outcomeReason: 'spike-defused', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 24300, defenseTeamBank: 22100, targetSite: 'A', executeSec: 38, plantSec: 46, oppSetupTag: 'A-Short + Lamps Lurk', firstBloodTeam: 'C9', fbAtSec: 32, weapon: 'Vandal' },
  { roundNumber: 11, attackTeam: 'OPP', winner: 'C9', outcomeReason: 'elimination', attackBuyType: 'half-buy', defenseBuyType: 'full-buy', attackTeamBank: 14200, defenseTeamBank: 24200, targetSite: 'B', executeSec: 23, plantSec: null, oppSetupTag: 'Half-Buy Hookah Crunch', firstBloodTeam: 'C9', fbAtSec: 18, weapon: 'Vandal' },
  { roundNumber: 12, attackTeam: 'OPP', winner: 'C9', outcomeReason: 'elimination', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 23200, defenseTeamBank: 25600, targetSite: 'B', executeSec: 26, plantSec: 34, oppSetupTag: 'Fast Hookah Drop Countered', firstBloodTeam: 'C9', fbAtSec: 21, weapon: 'Vandal' },
  { roundNumber: 13, attackTeam: 'C9', winner: 'C9', outcomeReason: 'spike-detonated', attackBuyType: 'pistol', defenseBuyType: 'pistol', attackTeamBank: 4000, defenseTeamBank: 4000, targetSite: 'A', executeSec: 32, plantSec: 40, oppSetupTag: 'Solo Showers Anchor', firstBloodTeam: 'C9', fbAtSec: 26, weapon: 'Ghost' },
  { roundNumber: 14, attackTeam: 'C9', winner: 'C9', outcomeReason: 'elimination', attackBuyType: 'full-buy', defenseBuyType: 'eco', attackTeamBank: 19500, defenseTeamBank: 8400, targetSite: 'A', executeSec: 29, plantSec: 37, oppSetupTag: 'Eco Lamps Stack', firstBloodTeam: 'C9', fbAtSec: 23, weapon: 'Bulldog' },
  { roundNumber: 15, attackTeam: 'C9', winner: 'OPP', outcomeReason: 'elimination', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 23800, defenseTeamBank: 21100, targetSite: 'B', executeSec: 41, plantSec: null, oppSetupTag: 'Heavy B-Elbow Crossfire', firstBloodTeam: 'OPP', fbAtSec: 34, weapon: 'Vandal' },
  { roundNumber: 16, attackTeam: 'C9', winner: 'C9', outcomeReason: 'spike-detonated', attackBuyType: 'full-buy', defenseBuyType: 'force', attackTeamBank: 22900, defenseTeamBank: 14900, targetSite: 'A', executeSec: 35, plantSec: 43, oppSetupTag: 'Solo Showers + Lurk Punished', firstBloodTeam: 'C9', fbAtSec: 28, weapon: 'Vandal' },
  { roundNumber: 17, attackTeam: 'C9', winner: 'OPP', outcomeReason: 'spike-defused', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 24900, defenseTeamBank: 22300, targetSite: 'B', executeSec: 44, plantSec: 52, oppSetupTag: 'Hookah Flood Retake', firstBloodTeam: 'OPP', fbAtSec: 38, weapon: 'Vandal' },
  { roundNumber: 18, attackTeam: 'C9', winner: 'C9', outcomeReason: 'spike-detonated', attackBuyType: 'full-buy', defenseBuyType: 'full-buy', attackTeamBank: 23100, defenseTeamBank: 23600, targetSite: 'A', executeSec: 33, plantSec: 41, oppSetupTag: 'TP B->A Solo Showers', firstBloodTeam: 'C9', fbAtSec: 27, weapon: 'Phantom' },
  { roundNumber: 19, attackTeam: 'C9', winner: 'C9', outcomeReason: 'spike-detonated', attackBuyType: 'full-buy', defenseBuyType: 'force', attackTeamBank: 24700, defenseTeamBank: 15300, targetSite: 'B', executeSec: 37, plantSec: 45, oppSetupTag: 'Force Hookah Crunch Broken', firstBloodTeam: 'C9', fbAtSec: 31, weapon: 'Vandal' },
  { roundNumber: 20, attackTeam: 'C9', winner: 'C9', outcomeReason: 'elimination', attackBuyType: 'full-buy', defenseBuyType: 'eco', attackTeamBank: 26800, defenseTeamBank: 9200, targetSite: 'A', executeSec: 28, plantSec: 36, oppSetupTag: 'Eco Stack B -> Free A', firstBloodTeam: 'C9', fbAtSec: 22, weapon: 'Vandal' },
];

export const BUILTIN_MATCHES: MatchSeries[] = [
  createMatchSeries(
    {
      id: 'c9-vs-nrg-ascent-2026',
      schemaVersion: 'grid-valorant-v1',
      source: 'GRID-compat-fixture',
      tournament: 'VCT Americas Pre-Match Prep (GRID-Compat)',
      matchDate: '2026-11-18',
      map: 'ascent',
      teamC9Name: 'Cloud9',
      opponentName: 'NRG Esports',
      opponentTag: 'NRG',
    },
    ASCENT_SPECS,
  ),
  createMatchSeries(
    {
      id: 'c9-vs-sen-haven-2026',
      schemaVersion: 'grid-valorant-v1',
      source: 'GRID-compat-fixture',
      tournament: 'VCT Americas Scouting Series (GRID-Compat)',
      matchDate: '2026-11-15',
      map: 'haven',
      teamC9Name: 'Cloud9',
      opponentName: 'Sentinels',
      opponentTag: 'SEN',
    },
    HAVEN_SPECS,
  ),
  createMatchSeries(
    {
      id: 'c9-vs-loud-bind-2026',
      schemaVersion: 'grid-valorant-v1',
      source: 'GRID-compat-fixture',
      tournament: 'Americas Kickoff Tactical Audit (GRID-Compat)',
      matchDate: '2026-11-12',
      map: 'bind',
      teamC9Name: 'Cloud9',
      opponentName: 'LOUD',
      opponentTag: 'LOUD',
    },
    BIND_SPECS,
  ),
];
