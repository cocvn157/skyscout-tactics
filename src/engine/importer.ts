import { MAP_BLUEPRINTS } from '../data/maps';
import type {
  BuyType,
  Coordinate,
  ImportParseResult,
  MapId,
  MatchSeries,
  OutcomeReason,
  PlayerSnapshot,
  RoundTelemetry,
  TargetSite,
  TeamTag,
  ValidationIssue,
} from '../types/telemetry';

const VALID_MAPS = new Set<MapId>(['ascent', 'haven', 'bind']);
const VALID_BUYS = new Set<BuyType>(['pistol', 'eco', 'half-buy', 'force', 'full-buy']);
const VALID_OUTCOMES = new Set<OutcomeReason>([
  'elimination',
  'spike-detonated',
  'spike-defused',
  'time-expired',
]);
const VALID_SITES = new Set<TargetSite>(['A', 'B', 'C', 'Split', 'None']);

function clampCoord(c: Coordinate): Coordinate {
  return {
    x: Math.max(4, Math.min(96, Number(c.x.toFixed(1)))),
    y: Math.max(4, Math.min(96, Number(c.y.toFixed(1)))),
  };
}

function normalizeMapId(raw: string): MapId | null {
  const lower = raw.trim().toLowerCase();
  if (lower.includes('ascent')) return 'ascent';
  if (lower.includes('haven')) return 'haven';
  if (lower.includes('bind')) return 'bind';
  return VALID_MAPS.has(lower as MapId) ? (lower as MapId) : null;
}

function buildSynthesizedPlayers(
  roundNumber: number,
  map: MapId,
  attackTeam: TeamTag,
  winner: TeamTag,
  targetSite: TargetSite,
  firstBloodTeam: TeamTag,
): PlayerSnapshot[] {
  const blueprint = MAP_BLUEPRINTS[map];
  const siteKey: 'A' | 'B' | 'C' =
    targetSite === 'A' || targetSite === 'B' || targetSite === 'C'
      ? targetSite
      : blueprint.sites[0] ?? 'A';
  const anchor = blueprint.defaultPlantAnchors[siteKey];

  const c9Agents: Array<{ name: string; agent: string; role: PlayerSnapshot['role'] }> = [
    { name: 'oxy', agent: 'Jett', role: 'Duelist' },
    { name: 'moose', agent: 'Cypher', role: 'Sentinel' },
    { name: 'Xeppaa', agent: 'Skye', role: 'Initiator' },
    { name: 'v1c', agent: 'Omen', role: 'Controller' },
    { name: 'mitch', agent: 'Sova', role: 'Initiator' },
  ];
  const oppAgents: Array<{ name: string; agent: string; role: PlayerSnapshot['role'] }> = [
    { name: 'Entry1', agent: 'Raze', role: 'Duelist' },
    { name: 'Flex2', agent: 'KAY/O', role: 'Initiator' },
    { name: 'Smokes3', agent: 'Brimstone', role: 'Controller' },
    { name: 'Recon4', agent: 'Fade', role: 'Initiator' },
    { name: 'Anchor5', agent: 'Killjoy', role: 'Sentinel' },
  ];

  const makeTeam = (
    team: TeamTag,
    roster: typeof c9Agents,
    isAtk: boolean,
  ): PlayerSnapshot[] =>
    roster.map((p, idx) => {
      const startBase = isAtk ? blueprint.attackSpawnCenter : blueprint.defenseSpawnCenter;
      const startPos = clampCoord({
        x: startBase.x + (idx - 2) * 6,
        y: startBase.y + (isAtk ? -2 : 2),
      });
      const spreadX = (idx - 2) * 5 + ((roundNumber + idx) % 3) * 2;
      const spreadY = isAtk ? 4 + idx * 2 : -4 - idx * 2;
      const endPos = clampCoord({
        x: anchor.x + spreadX,
        y: anchor.y + spreadY,
      });
      const teamWon = winner === team;
      const alive = teamWon ? idx < 3 : idx === 4 && roundNumber % 4 === 0;
      const gotFb = idx === 0 && firstBloodTeam === team;
      const gotFd = idx === 0 && firstBloodTeam !== team;

      return {
        playerId: `${team.toLowerCase()}-${idx + 1}`,
        name: p.name,
        team,
        agent: p.agent,
        role: p.role,
        alive,
        hp: alive ? 72 + ((idx * 11) % 28) : 0,
        credits: 2400 + ((roundNumber * 350) % 2800),
        loadoutValue: 3900,
        startPos,
        endPos,
        firstBlood: gotFb,
        firstDeath: gotFd,
        kills: gotFb ? 2 : teamWon ? 1 : 0,
        deaths: alive ? 0 : 1,
        assists: idx === 2 || idx === 3 ? 1 : 0,
      };
    });

  return [
    ...makeTeam('C9', c9Agents, attackTeam === 'C9'),
    ...makeTeam('OPP', oppAgents, attackTeam === 'OPP'),
  ];
}

function hydrateSyntheticRound(base: {
  roundNumber: number;
  map: MapId;
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
}): RoundTelemetry {
  const blueprint = MAP_BLUEPRINTS[base.map];
  const siteKey: 'A' | 'B' | 'C' =
    base.targetSite === 'A' || base.targetSite === 'B' || base.targetSite === 'C'
      ? base.targetSite
      : blueprint.sites[0] ?? 'A';
  const anchor = blueprint.defaultPlantAnchors[siteKey];

  const plantPos =
    base.plantSec !== null
      ? clampCoord({
          x: anchor.x + ((base.roundNumber % 3) - 1) * 1.8,
          y: anchor.y + ((base.roundNumber % 2) === 0 ? 1.5 : -1.5),
        })
      : null;

  const execTime = base.executeSec ?? 38;
  const fbTime = Math.max(8, execTime - 6);
  const killer = base.firstBloodTeam === 'C9' ? 'oxy' : 'Entry1';
  const victim = base.firstBloodTeam === 'C9' ? 'Anchor5' : 'moose';

  const players = buildSynthesizedPlayers(
    base.roundNumber,
    base.map,
    base.attackTeam,
    base.winner,
    base.targetSite,
    base.firstBloodTeam,
  );

  return {
    roundNumber: base.roundNumber,
    half: base.roundNumber <= 12 ? 1 : base.roundNumber <= 24 ? 2 : 'OT',
    attackTeam: base.attackTeam,
    winner: base.winner,
    outcomeReason: base.outcomeReason,
    attackBuyType: base.attackBuyType,
    defenseBuyType: base.defenseBuyType,
    attackTeamBank: base.attackTeamBank,
    defenseTeamBank: base.defenseTeamBank,
    targetSite: base.targetSite,
    executeSec: base.executeSec,
    plantSec: base.plantSec,
    plantPos,
    postPlantOutcome:
      base.plantSec === null
        ? null
        : base.winner === base.attackTeam
          ? 'won'
          : 'lost',
    oppSetupTag: base.oppSetupTag,
    roundDurationSec: Math.max(45, (base.plantSec ?? execTime + 18) + 28),
    players,
    utility: [
      {
        id: `u-r${base.roundNumber}-1`,
        timestampSec: Math.max(6, execTime - 4),
        actorName: base.attackTeam === 'C9' ? 'v1c' : 'Smokes3',
        team: base.attackTeam,
        agent: base.attackTeam === 'C9' ? 'Omen' : 'Brimstone',
        ability: 'Dark Cover / Sky Smoke',
        type: 'smoke',
        from: clampCoord({ x: anchor.x - 10, y: anchor.y + 32 }),
        to: clampCoord({ x: anchor.x - 4, y: anchor.y - 6 }),
        radius: 6.2,
        durationSec: 15,
        site: siteKey,
      },
      {
        id: `u-r${base.roundNumber}-2`,
        timestampSec: Math.max(8, execTime - 1),
        actorName: base.attackTeam === 'C9' ? 'Xeppaa' : 'Flex2',
        team: base.attackTeam,
        agent: base.attackTeam === 'C9' ? 'Skye' : 'KAY/O',
        ability: 'Flash / Recon',
        type: 'flash',
        from: clampCoord({ x: anchor.x + 2, y: anchor.y + 24 }),
        to: clampCoord({ x: anchor.x + 2, y: anchor.y + 4 }),
        radius: 4.5,
        durationSec: 4,
        site: siteKey,
      },
    ],
    kills: [
      {
        id: `k-r${base.roundNumber}-1`,
        timestampSec: fbTime,
        killer,
        killerTeam: base.firstBloodTeam,
        victim,
        victimTeam: base.firstBloodTeam === 'C9' ? 'OPP' : 'C9',
        weapon: base.attackBuyType === 'pistol' ? 'Ghost' : 'Vandal',
        killerPos: clampCoord({ x: anchor.x + 4, y: anchor.y + 10 }),
        victimPos: clampCoord({ x: anchor.x, y: anchor.y + 1 }),
        isFirstBlood: true,
      },
    ],
  };
}

function validateNativeSeries(raw: Record<string, unknown>, issues: ValidationIssue[]): MatchSeries | null {
  const mapRaw = String(raw.map ?? '');
  const map = normalizeMapId(mapRaw);
  if (!map) {
    issues.push({
      field: 'map',
      severity: 'error',
      message: `Unsupported map "${mapRaw}". Supported maps: ascent, haven, bind.`,
    });
    return null;
  }

  if (!Array.isArray(raw.rounds) || raw.rounds.length === 0) {
    issues.push({
      field: 'rounds',
      severity: 'error',
      message: 'Match payload must contain a non-empty rounds array.',
    });
    return null;
  }

  const rounds: RoundTelemetry[] = [];
  raw.rounds.forEach((item, index) => {
    const r = item as Record<string, unknown>;
    const roundNumber = Number(r.roundNumber);
    const attackTeam = r.attackTeam as TeamTag;
    const winner = r.winner as TeamTag;

    if (!Number.isInteger(roundNumber) || roundNumber <= 0) {
      issues.push({
        field: `rounds[${index}].roundNumber`,
        severity: 'error',
        message: 'roundNumber must be a positive integer.',
      });
      return;
    }
    if (attackTeam !== 'C9' && attackTeam !== 'OPP') {
      issues.push({
        field: `rounds[${index}].attackTeam`,
        severity: 'error',
        message: `Round ${roundNumber}: attackTeam must be "C9" or "OPP".`,
      });
      return;
    }
    if (winner !== 'C9' && winner !== 'OPP') {
      issues.push({
        field: `rounds[${index}].winner`,
        severity: 'error',
        message: `Round ${roundNumber}: winner must be "C9" or "OPP".`,
      });
      return;
    }

    const executeSec =
      r.executeSec === null || r.executeSec === undefined ? null : Number(r.executeSec);
    if (executeSec !== null && (Number.isNaN(executeSec) || executeSec < 0 || executeSec > 160)) {
      issues.push({
        field: `rounds[${index}].executeSec`,
        severity: 'error',
        message: `Round ${roundNumber}: executeSec out of valid range [0..160].`,
      });
      return;
    }

    const targetSite = VALID_SITES.has(r.targetSite as TargetSite)
      ? (r.targetSite as TargetSite)
      : 'A';

    // If round provides full player/utility arrays, preserve them; otherwise synthesize cleanly
    if (Array.isArray(r.players) && r.players.length > 0) {
      rounds.push({
        ...(r as unknown as RoundTelemetry),
        targetSite,
        executeSec,
      });
    } else {
      rounds.push(
        hydrateSyntheticRound({
          roundNumber,
          map,
          attackTeam,
          winner,
          outcomeReason: VALID_OUTCOMES.has(r.outcomeReason as OutcomeReason)
            ? (r.outcomeReason as OutcomeReason)
            : 'elimination',
          attackBuyType: VALID_BUYS.has(r.attackBuyType as BuyType)
            ? (r.attackBuyType as BuyType)
            : 'full-buy',
          defenseBuyType: VALID_BUYS.has(r.defenseBuyType as BuyType)
            ? (r.defenseBuyType as BuyType)
            : 'full-buy',
          attackTeamBank: Number(r.attackTeamBank ?? 21500),
          defenseTeamBank: Number(r.defenseTeamBank ?? 22000),
          targetSite,
          executeSec,
          plantSec: r.plantSec === null || r.plantSec === undefined ? null : Number(r.plantSec),
          oppSetupTag: String(r.oppSetupTag ?? 'Standard Default'),
          firstBloodTeam: winner,
        }),
      );
    }
  });

  if (issues.some((i) => i.severity === 'error')) {
    return null;
  }

  const c9Score = rounds.filter((r) => r.winner === 'C9').length;
  const oppScore = rounds.length - c9Score;

  return {
    id: String(raw.id ?? `custom-json-${Date.now()}`),
    schemaVersion: 'grid-valorant-v1',
    source: 'custom-upload',
    tournament: String(raw.tournament ?? 'Custom GRID / Telemetry Import'),
    matchDate: String(raw.matchDate ?? '2026-11-23'),
    map,
    teamC9Name: String(raw.teamC9Name ?? 'Cloud9'),
    opponentName: String(raw.opponentName ?? 'Opponent'),
    opponentTag: String(raw.opponentTag ?? 'OPP'),
    finalScore: { c9: c9Score, opp: oppScore },
    rounds,
  };
}

function parseGridSeriesState(raw: Record<string, unknown>, issues: ValidationIssue[]): MatchSeries | null {
  const seriesState = raw.seriesState as Record<string, unknown> | undefined;
  if (!seriesState || !Array.isArray(seriesState.games) || seriesState.games.length === 0) {
    issues.push({
      field: 'seriesState.games',
      severity: 'error',
      message: 'GRID seriesState object requires a non-empty games array.',
    });
    return null;
  }

  const game = seriesState.games[0] as Record<string, unknown>;
  const mapObj = game.map as Record<string, unknown> | undefined;
  const mapName = String(mapObj?.name ?? game.map ?? '');
  const map = normalizeMapId(mapName);
  if (!map) {
    issues.push({
      field: 'seriesState.games[0].map.name',
      severity: 'error',
      message: `Unsupported GRID map "${mapName}". Supported maps: Ascent, Haven, Bind.`,
    });
    return null;
  }

  const teams = Array.isArray(seriesState.teams) ? seriesState.teams : [];
  const team0 = (teams[0] as Record<string, unknown> | undefined) ?? {};
  const team1 = (teams[1] as Record<string, unknown> | undefined) ?? {};
  const c9Id = String(team0.id ?? 'c9');
  const oppName = String(team1.name ?? 'GRID Opponent');
  const oppTag = String(team1.code ?? oppName.slice(0, 4).toUpperCase());

  const segments = Array.isArray(game.segments) ? game.segments : [];
  if (segments.length === 0) {
    issues.push({
      field: 'seriesState.games[0].segments',
      severity: 'error',
      message: 'GRID game payload requires segments (rounds) array.',
    });
    return null;
  }

  const rounds: RoundTelemetry[] = segments.map((seg, idx) => {
    const s = seg as Record<string, unknown>;
    const roundNumber = Number(s.sequenceNumber ?? idx + 1);
    const attackerId = String(s.attackerTeamId ?? (roundNumber <= 12 ? c9Id : 'opp'));
    const winnerId = String(s.winnerTeamId ?? c9Id);
    const attackTeam: TeamTag = attackerId === c9Id ? 'C9' : 'OPP';
    const winner: TeamTag = winnerId === c9Id ? 'C9' : 'OPP';
    const siteRaw = String(s.targetSite ?? 'A') as TargetSite;
    const targetSite: TargetSite = VALID_SITES.has(siteRaw) ? siteRaw : 'A';
    const executeSec =
      s.executeSec === null || s.executeSec === undefined ? 36 : Number(s.executeSec);
    const plantSec =
      s.plantSec === null || s.plantSec === undefined ? null : Number(s.plantSec);

    return hydrateSyntheticRound({
      roundNumber,
      map,
      attackTeam,
      winner,
      outcomeReason: VALID_OUTCOMES.has(s.outcomeReason as OutcomeReason)
        ? (s.outcomeReason as OutcomeReason)
        : 'elimination',
      attackBuyType: VALID_BUYS.has(s.attackBuyType as BuyType)
        ? (s.attackBuyType as BuyType)
        : 'full-buy',
      defenseBuyType: VALID_BUYS.has(s.defenseBuyType as BuyType)
        ? (s.defenseBuyType as BuyType)
        : 'full-buy',
      attackTeamBank: Number(s.attackTeamBank ?? 20500),
      defenseTeamBank: Number(s.defenseTeamBank ?? 21000),
      targetSite,
      executeSec,
      plantSec,
      oppSetupTag: String(s.setupTag ?? 'GRID Segment Default'),
      firstBloodTeam: s.firstBloodTeamId === c9Id ? 'C9' : s.firstBloodTeamId ? 'OPP' : winner,
    });
  });

  const c9Wins = rounds.filter((r) => r.winner === 'C9').length;
  return {
    id: `grid-${String(seriesState.id ?? Date.now())}`,
    schemaVersion: 'grid-valorant-v1',
    source: 'custom-upload',
    tournament: String(seriesState.tournamentName ?? 'GRID Series State Feed'),
    matchDate: String(seriesState.startedAt ?? '2026-11-23').slice(0, 10),
    map,
    teamC9Name: String(team0.name ?? 'Cloud9'),
    opponentName: oppName,
    opponentTag: oppTag,
    finalScore: { c9: c9Wins, opp: rounds.length - c9Wins },
    rounds,
  };
}

function parseCsvTelemetry(
  rawText: string,
  mapOverride: MapId,
  issues: ValidationIssue[],
): MatchSeries | null {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    issues.push({
      line: 1,
      field: 'csv',
      severity: 'error',
      message: 'CSV must include a header row and at least one round row.',
    });
    return null;
  }

  const header = lines[0]!.split(',').map((h) => h.trim());
  const required = ['roundNumber', 'attackTeam', 'winner', 'targetSite'];
  for (const req of required) {
    if (!header.includes(req)) {
      issues.push({
        line: 1,
        field: req,
        severity: 'error',
        message: `Missing required CSV column "${req}".`,
      });
    }
  }
  if (issues.some((i) => i.severity === 'error')) return null;

  const colIndex = (name: string) => header.indexOf(name);
  const rounds: RoundTelemetry[] = [];
  let detectedMap = mapOverride;
  let oppName = 'Custom Opponent';

  for (let i = 1; i < lines.length; i += 1) {
    const lineNum = i + 1;
    const cols = lines[i]!.split(',').map((c) => c.trim());
    if (cols.length < header.length - 1) {
      issues.push({
        line: lineNum,
        field: 'row',
        severity: 'error',
        message: `Line ${lineNum}: expected ${header.length} columns, found ${cols.length}.`,
      });
      continue;
    }

    const get = (col: string): string => {
      const idx = colIndex(col);
      return idx >= 0 ? (cols[idx] ?? '') : '';
    };

    const mapVal = get('map');
    if (mapVal) {
      const normalized = normalizeMapId(mapVal);
      if (normalized) detectedMap = normalized;
    }
    if (get('opponent')) oppName = get('opponent');

    const roundNumber = Number(get('roundNumber'));
    if (!Number.isInteger(roundNumber) || roundNumber <= 0) {
      issues.push({
        line: lineNum,
        field: 'roundNumber',
        severity: 'error',
        message: `Line ${lineNum}: invalid roundNumber "${get('roundNumber')}".`,
      });
      continue;
    }

    const attackTeam = get('attackTeam').toUpperCase() as TeamTag;
    const winner = get('winner').toUpperCase() as TeamTag;
    if (attackTeam !== 'C9' && attackTeam !== 'OPP') {
      issues.push({
        line: lineNum,
        field: 'attackTeam',
        severity: 'error',
        message: `Line ${lineNum}: attackTeam must be C9 or OPP.`,
      });
      continue;
    }
    if (winner !== 'C9' && winner !== 'OPP') {
      issues.push({
        line: lineNum,
        field: 'winner',
        severity: 'error',
        message: `Line ${lineNum}: winner must be C9 or OPP.`,
      });
      continue;
    }

    const siteRaw = get('targetSite') as TargetSite;
    const targetSite: TargetSite = VALID_SITES.has(siteRaw) ? siteRaw : 'A';
    const execRaw = get('executeSec');
    const executeSec = execRaw === '' || execRaw.toLowerCase() === 'null' ? null : Number(execRaw);
    if (executeSec !== null && (Number.isNaN(executeSec) || executeSec < 0)) {
      issues.push({
        line: lineNum,
        field: 'executeSec',
        severity: 'error',
        message: `Line ${lineNum}: executeSec must be >= 0 or empty.`,
      });
      continue;
    }

    const plantRaw = get('plantSec');
    const plantSec = plantRaw === '' || plantRaw.toLowerCase() === 'null' ? null : Number(plantRaw);
    const fbRaw = get('firstBloodTeam').toUpperCase();
    const firstBloodTeam: TeamTag = fbRaw === 'C9' || fbRaw === 'OPP' ? fbRaw : winner;

    rounds.push(
      hydrateSyntheticRound({
        roundNumber,
        map: detectedMap,
        attackTeam,
        winner,
        outcomeReason: VALID_OUTCOMES.has(get('outcomeReason') as OutcomeReason)
          ? (get('outcomeReason') as OutcomeReason)
          : 'elimination',
        attackBuyType: VALID_BUYS.has(get('attackBuyType') as BuyType)
          ? (get('attackBuyType') as BuyType)
          : 'full-buy',
        defenseBuyType: VALID_BUYS.has(get('defenseBuyType') as BuyType)
          ? (get('defenseBuyType') as BuyType)
          : 'full-buy',
        attackTeamBank: Number(get('attackBank') || 21000),
        defenseTeamBank: Number(get('defenseBank') || 21000),
        targetSite,
        executeSec,
        plantSec,
        oppSetupTag: get('oppSetupTag') || 'CSV Imported Round',
        firstBloodTeam,
      }),
    );
  }

  if (issues.some((i) => i.severity === 'error') || rounds.length === 0) {
    return null;
  }

  const c9Wins = rounds.filter((r) => r.winner === 'C9').length;
  return {
    id: `custom-csv-${Date.now()}`,
    schemaVersion: 'grid-valorant-v1',
    source: 'custom-upload',
    tournament: 'Custom CSV Scrim Telemetry',
    matchDate: '2026-11-23',
    map: detectedMap,
    teamC9Name: 'Cloud9',
    opponentName: oppName,
    opponentTag: oppName.slice(0, 4).toUpperCase() || 'OPP',
    finalScore: { c9: c9Wins, opp: rounds.length - c9Wins },
    rounds,
  };
}

export function validateAndParseMatchInput(
  rawText: string,
  mapFallback: MapId = 'ascent',
): ImportParseResult {
  const trimmed = rawText.trim();
  const issues: ValidationIssue[] = [];

  if (!trimmed) {
    return {
      ok: false,
      formatDetected: 'unknown',
      issues: [{ field: 'input', severity: 'error', message: 'Telemetry input is empty.' }],
    };
  }

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      if ('seriesState' in parsed) {
        const match = parseGridSeriesState(parsed, issues);
        return {
          ok: Boolean(match) && !issues.some((i) => i.severity === 'error'),
          formatDetected: 'grid-series-state',
          match: match ?? undefined,
          issues,
        };
      }
      const match = validateNativeSeries(parsed, issues);
      return {
        ok: Boolean(match) && !issues.some((i) => i.severity === 'error'),
        formatDetected: 'grid-valorant-v1',
        match: match ?? undefined,
        issues,
      };
    } catch (err) {
      return {
        ok: false,
        formatDetected: 'unknown',
        issues: [
          {
            field: 'json',
            severity: 'error',
            message: `Invalid JSON syntax: ${err instanceof Error ? err.message : 'parse error'}`,
          },
        ],
      };
    }
  }

  const csvMatch = parseCsvTelemetry(trimmed, mapFallback, issues);
  return {
    ok: Boolean(csvMatch) && !issues.some((i) => i.severity === 'error'),
    formatDetected: 'csv',
    match: csvMatch ?? undefined,
    issues,
  };
}

export function buildSampleCsvTemplate(): string {
  return [
    'roundNumber,map,opponent,attackTeam,winner,outcomeReason,attackBuyType,defenseBuyType,attackBank,defenseBank,targetSite,executeSec,plantSec,oppSetupTag,firstBloodTeam',
    '1,haven,G2 Esports,OPP,OPP,spike-detonated,pistol,pistol,4000,4000,C,21,28,Fast C-Long Pistol Burst,OPP',
    '2,haven,G2 Esports,OPP,OPP,elimination,full-buy,eco,18500,8200,A,25,33,Anti-Eco A-Long Crunch,OPP',
    '3,haven,G2 Esports,OPP,C9,spike-defused,full-buy,force,21000,15200,B,23,31,Fast B-Window Flood,C9',
    '4,haven,G2 Esports,OPP,C9,elimination,eco,full-buy,9400,22400,C,22,,Eco C-Long Stack Rush,C9',
    '5,haven,G2 Esports,OPP,OPP,spike-detonated,full-buy,full-buy,23500,24000,C,58,64,Late C-Link Lurk Split,OPP',
    '6,haven,G2 Esports,C9,C9,elimination,full-buy,full-buy,24600,21800,A,34,42,1-3-1 Solo C Anchor,C9',
    '7,haven,G2 Esports,C9,C9,spike-detonated,full-buy,force,26200,14800,C,29,37,Solo C Anchor Punished,C9',
    '8,haven,G2 Esports,C9,OPP,elimination,full-buy,full-buy,27800,21500,B,41,,Heavy Garage Stack,OPP',
  ].join('\n');
}

export function buildSampleGridSeriesJsonTemplate(): string {
  return JSON.stringify(
    {
      seriesState: {
        id: 'grid-vct-americas-sample-2026',
        tournamentName: 'GRID Official Scrim Feed — VCT Americas Prep',
        startedAt: '2026-11-20T18:00:00Z',
        teams: [
          { id: 'c9', name: 'Cloud9', code: 'C9' },
          { id: 'eg', name: 'Evil Geniuses', code: 'EG' },
        ],
        games: [
          {
            map: { name: 'Bind' },
            segments: [
              { sequenceNumber: 1, attackerTeamId: 'eg', winnerTeamId: 'eg', targetSite: 'B', executeSec: 22, plantSec: 29, attackBuyType: 'pistol', defenseBuyType: 'pistol', setupTag: 'Fast Hookah Drop', firstBloodTeamId: 'eg' },
              { sequenceNumber: 2, attackerTeamId: 'eg', winnerTeamId: 'c9', targetSite: 'A', executeSec: 26, plantSec: null, attackBuyType: 'force', defenseBuyType: 'eco', setupTag: 'Force Showers Crunch', firstBloodTeamId: 'c9' },
              { sequenceNumber: 3, attackerTeamId: 'eg', winnerTeamId: 'c9', targetSite: 'B', executeSec: 24, plantSec: 32, attackBuyType: 'eco', defenseBuyType: 'full-buy', setupTag: 'Eco Hookah Stack', firstBloodTeamId: 'c9' },
              { sequenceNumber: 4, attackerTeamId: 'eg', winnerTeamId: 'eg', targetSite: 'B', executeSec: 23, plantSec: 30, attackBuyType: 'full-buy', defenseBuyType: 'full-buy', setupTag: 'Fast B Long + TP Fake', firstBloodTeamId: 'eg' },
              { sequenceNumber: 5, attackerTeamId: 'c9', winnerTeamId: 'c9', targetSite: 'A', executeSec: 36, plantSec: 44, attackBuyType: 'full-buy', defenseBuyType: 'full-buy', setupTag: 'Solo Lamps Anchor', firstBloodTeamId: 'c9' },
              { sequenceNumber: 6, attackerTeamId: 'c9', winnerTeamId: 'c9', targetSite: 'A', executeSec: 31, plantSec: 39, attackBuyType: 'full-buy', defenseBuyType: 'force', setupTag: 'Solo Lamps + Hookah Lurk', firstBloodTeamId: 'c9' },
            ],
          },
        ],
      },
    },
    null,
    2,
  );
}
