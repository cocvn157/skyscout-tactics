export type MapId = 'ascent' | 'haven' | 'bind';

export type TeamTag = 'C9' | 'OPP';

export type Side = 'attack' | 'defense';

export type AgentRole = 'Duelist' | 'Initiator' | 'Controller' | 'Sentinel';

export type BuyType = 'pistol' | 'eco' | 'half-buy' | 'force' | 'full-buy';

export type OutcomeReason =
  | 'elimination'
  | 'spike-detonated'
  | 'spike-defused'
  | 'time-expired';

export type UtilityType = 'smoke' | 'flash' | 'recon' | 'molly' | 'wall' | 'dash';

export type TargetSite = 'A' | 'B' | 'C' | 'Split' | 'None';

export interface Coordinate {
  /** Normalized horizontal coordinate [0..100] on tactical minimap */
  x: number;
  /** Normalized vertical coordinate [0..100] on tactical minimap */
  y: number;
}

export interface PlayerSnapshot {
  playerId: string;
  name: string;
  team: TeamTag;
  agent: string;
  role: AgentRole;
  alive: boolean;
  hp: number;
  credits: number;
  loadoutValue: number;
  startPos: Coordinate;
  endPos: Coordinate;
  firstBlood: boolean;
  firstDeath: boolean;
  kills: number;
  deaths: number;
  assists: number;
}

export interface UtilityEvent {
  id: string;
  timestampSec: number;
  actorName: string;
  team: TeamTag;
  agent: string;
  ability: string;
  type: UtilityType;
  from: Coordinate;
  to: Coordinate;
  radius: number;
  durationSec: number;
  site: 'A' | 'B' | 'C' | 'Mid';
}

export interface KillEvent {
  id: string;
  timestampSec: number;
  killer: string;
  killerTeam: TeamTag;
  victim: string;
  victimTeam: TeamTag;
  weapon: string;
  killerPos: Coordinate;
  victimPos: Coordinate;
  isFirstBlood: boolean;
  tradedWithinSec?: number;
}

export interface RoundTelemetry {
  roundNumber: number;
  half: 1 | 2 | 'OT';
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
  plantPos: Coordinate | null;
  postPlantOutcome: 'won' | 'lost' | null;
  oppSetupTag: string;
  roundDurationSec: number;
  players: PlayerSnapshot[];
  utility: UtilityEvent[];
  kills: KillEvent[];
}

export interface MatchSeries {
  id: string;
  schemaVersion: 'grid-valorant-v1';
  source: 'GRID-compat-fixture' | 'custom-upload';
  tournament: string;
  matchDate: string;
  map: MapId;
  teamC9Name: string;
  opponentName: string;
  opponentTag: string;
  finalScore: {
    c9: number;
    opp: number;
  };
  rounds: RoundTelemetry[];
}

export interface ValidationIssue {
  line?: number;
  field: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface ImportParseResult {
  ok: boolean;
  formatDetected: 'grid-valorant-v1' | 'grid-series-state' | 'csv' | 'unknown';
  match?: MatchSeries;
  issues: ValidationIssue[];
}

export interface WilsonConfidence {
  successes: number;
  total: number;
  rate: number;
  low: number;
  high: number;
}

export interface SiteMetric {
  site: 'A' | 'B' | 'C' | 'Split';
  attempts: number;
  wins: number;
  winRate: WilsonConfidence;
  avgExecuteSec: number | null;
  plantRate: number;
}

export interface TimingBucketMetric {
  bucket: 'fast' | 'mid' | 'late';
  label: string;
  rangeLabel: string;
  rounds: number;
  wins: number;
  winRate: WilsonConfidence;
}

export interface UtilityWindowMetric {
  window: 'early-info' | 'mid-control' | 'site-exec' | 'post-plant';
  label: string;
  rangeSec: string;
  count: number;
  c9Count: number;
  oppCount: number;
  topAbility: string;
}

export interface MatchAnalytics {
  totalRounds: number;
  c9Wins: number;
  oppWins: number;
  overallWinRate: WilsonConfidence;
  c9AttackStats: WilsonConfidence;
  c9DefenseStats: WilsonConfidence;
  pistolWinRate: WilsonConfidence;
  pistolConversionRate: WilsonConfidence;
  firstBloodWinRate: WilsonConfidence;
  postPlantWinRate: WilsonConfidence;
  oppPostPlantWinRate: WilsonConfidence;
  avgOppExecuteSec: number | null;
  avgC9ExecuteSec: number | null;
  siteMetrics: SiteMetric[];
  oppTimingSplits: TimingBucketMetric[];
  utilityWindows: UtilityWindowMetric[];
}

export type TendencySeverity = 'high' | 'medium' | 'low';

export interface OpponentTendency {
  id: string;
  title: string;
  category: 'timing' | 'economy' | 'setup' | 'lurk' | 'post-plant';
  severity: TendencySeverity;
  sampleLabel: string;
  metric: WilsonConfidence;
  evidenceSummary: string;
  supportingRounds: number[];
}

export interface AntiStratCall {
  id: string;
  priority: number;
  sideContext: Side;
  triggerCondition: string;
  callTitle: string;
  executionPlan: string;
  expectedGain: string;
  confidence: TendencySeverity;
  supportingRounds: number[];
  linkedTendencyId: string;
}

export type EconomyDecision = 'eco' | 'half-buy' | 'force' | 'full-buy';

export interface EconomySimInput {
  ourAvgCredits: number;
  enemyAvgCredits: number;
  ourLossStreak: 0 | 1 | 2 | 3;
  enemyLossStreak: 0 | 1 | 2 | 3;
  ourDecision: EconomyDecision;
  enemyExpectedBuy: 'eco' | 'force' | 'full-buy';
  side: Side;
  includeMatchBaseline: boolean;
  matchFirstBloodRate?: number;
  matchPostPlantRate?: number;
}

export interface EconomyOutcomeBranch {
  decision: EconomyDecision;
  label: string;
  spendPerPlayer: number;
  remainingPerPlayer: number;
  currentRoundWinProb: number;
  nextRoundBankIfWin: number;
  nextRoundBankIfLoss: number;
  nextRoundFullBuyGuaranteedOnLoss: boolean;
  twoRoundExpectedWins: number;
}

export interface EconomySimResult {
  lossBonusCredits: number;
  nextLossBonusCredits: number;
  recommendedDecision: EconomyDecision;
  recommendationHeadline: string;
  rationale: string;
  selectedBranch: EconomyOutcomeBranch;
  allBranches: EconomyOutcomeBranch[];
}
