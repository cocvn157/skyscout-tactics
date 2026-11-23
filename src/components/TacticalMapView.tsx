import { useEffect, useMemo, useState } from 'react';
import {
  Crosshair,
  Flame,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Target,
} from 'lucide-react';
import { MAP_BLUEPRINTS } from '../data/maps';
import type {
  BuyType,
  Coordinate,
  MatchAnalytics,
  MatchSeries,
  RoundTelemetry,
  UtilityType,
} from '../types/telemetry';
import { formatPct } from '../engine/statistics';

interface TacticalMapViewProps {
  match: MatchSeries;
  analytics: MatchAnalytics;
  selectedRoundNum: number;
  onSelectRound: (roundNum: number) => void;
}

const BUY_SHORT: Record<BuyType, string> = {
  pistol: 'PST',
  eco: 'ECO',
  'half-buy': 'HLF',
  force: 'FRC',
  'full-buy': 'BUY',
};

const UTILITY_COLORS: Record<UtilityType, string> = {
  smoke: '#94a3b8',
  flash: '#facc15',
  recon: '#38bdf8',
  molly: '#f97316',
  wall: '#2dd4bf',
  dash: '#c084fc',
};

function interpolatePos(start: Coordinate, end: Coordinate, ratio: number): Coordinate {
  const clamped = Math.max(0, Math.min(1, ratio));
  return {
    x: start.x + (end.x - start.x) * clamped,
    y: start.y + (end.y - start.y) * clamped,
  };
}

export function TacticalMapView({
  match,
  analytics,
  selectedRoundNum,
  onSelectRound,
}: TacticalMapViewProps) {
  const blueprint = MAP_BLUEPRINTS[match.map];
  const round: RoundTelemetry =
    match.rounds.find((r) => r.roundNumber === selectedRoundNum) ?? match.rounds[0]!;

  const [currentTime, setCurrentTime] = useState<number>(() =>
    Math.min(round.roundDurationSec, round.executeSec ?? 35),
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [showUtility, setShowUtility] = useState(true);
  const [showKills, setShowKills] = useState(true);
  const [showPlantHeatmap, setShowPlantHeatmap] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(Math.min(round.roundDurationSec, round.executeSec ?? 35));
  }, [match.id, round.roundNumber, round.roundDurationSec, round.executeSec]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const timer = window.setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= round.roundDurationSec) {
          setIsPlaying(false);
          return round.roundDurationSec;
        }
        return Math.min(round.roundDurationSec, Number((prev + 1.5).toFixed(1)));
      });
    }, 140);
    return () => window.clearInterval(timer);
  }, [isPlaying, round.roundDurationSec]);

  const moveProgress = Math.min(
    1,
    currentTime / Math.max(18, (round.executeSec ?? 38) + 6),
  );

  const allPlants = useMemo(
    () =>
      match.rounds
        .filter((r) => r.plantPos !== null)
        .map((r) => ({
          roundNumber: r.roundNumber,
          pos: r.plantPos!,
          attackTeam: r.attackTeam,
          wonPostPlant: r.postPlantOutcome === 'won',
        })),
    [match.rounds],
  );

  const activeUtility = round.utility.filter(
    (u) => currentTime >= u.timestampSec && currentTime <= u.timestampSec + u.durationSec + 6,
  );
  const visibleKills = round.kills.filter((k) => currentTime >= k.timestampSec);

  const togglePlay = () => {
    if (currentTime >= round.roundDurationSec) {
      setCurrentTime(0);
    }
    setIsPlaying((prev) => !prev);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Round Selector Strip */}
      <section className="panel" aria-label="Round timeline selector">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">
              <Layers size={17} color="var(--c9-cyan)" />
              Round-by-Round Timeline ({match.rounds.length} Rounds — {blueprint.name})
            </h2>
            <p className="panel-subtitle">
              Click any round to inspect agent routes, utility timing windows, spike plants, and first-blood duels.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className="badge badge-c9">Blue Border = {match.teamC9Name} Win</span>
            <span className="badge badge-red">Red Border = {match.opponentTag} Win</span>
          </div>
        </div>

        <div className="round-strip">
          {match.rounds.map((r) => {
            const isSelected = r.roundNumber === round.roundNumber;
            return (
              <button
                key={r.roundNumber}
                type="button"
                className={`round-chip ${r.winner === 'C9' ? 'win-c9' : 'win-opp'} ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectRound(r.roundNumber)}
                aria-label={`Select round ${r.roundNumber}`}
                aria-pressed={isSelected}
              >
                <span>R{r.roundNumber}</span>
                <span className="round-chip-sub">
                  {r.attackTeam === 'C9' ? 'ATK' : 'DEF'}·{BUY_SHORT[r.attackTeam === 'C9' ? r.attackBuyType : r.defenseBuyType]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main 2-column Tactical Map + Round Breakdown */}
      <div className="two-col-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">
                <Target size={17} color="var(--c9-cyan)" />
                {blueprint.name} 2D Tactical Replay — Round {round.roundNumber}
              </h2>
              <p className="panel-subtitle">{blueprint.subtitle}</p>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn btn-sm btn-toggle ${showUtility ? 'active' : ''}`}
                onClick={() => setShowUtility((v) => !v)}
              >
                Utility
              </button>
              <button
                type="button"
                className={`btn btn-sm btn-toggle ${showKills ? 'active' : ''}`}
                onClick={() => setShowKills((v) => !v)}
              >
                Kills
              </button>
              <button
                type="button"
                className={`btn btn-sm btn-toggle ${showPlantHeatmap ? 'active' : ''}`}
                onClick={() => setShowPlantHeatmap((v) => !v)}
              >
                Plant Heatmap
              </button>
              <button
                type="button"
                className={`btn btn-sm btn-toggle ${showLabels ? 'active' : ''}`}
                onClick={() => setShowLabels((v) => !v)}
              >
                Labels
              </button>
            </div>
          </div>

          <div className="map-stage">
            <svg
              viewBox="0 0 100 100"
              className="map-svg"
              role="img"
              aria-label={`${blueprint.name} tactical replay for round ${round.roundNumber}`}
            >
              {/* Subtle Grid */}
              <defs>
                <pattern id="tac-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path
                    d="M 10 0 L 0 0 0 10"
                    fill="none"
                    stroke="rgba(148,163,184,0.08)"
                    strokeWidth="0.25"
                  />
                </pattern>
                <marker
                  id="arrow-c9"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="3.5"
                  markerHeight="3.5"
                  orient="auto"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
                </marker>
                <marker
                  id="arrow-opp"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="3.5"
                  markerHeight="3.5"
                  orient="auto"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff4655" />
                </marker>
              </defs>

              <rect x="0" y="0" width="100" height="100" fill="url(#tac-grid)" />

              {/* Map Zones */}
              {blueprint.zones.map((z) => {
                const fill =
                  z.kind === 'site'
                    ? 'rgba(0, 174, 239, 0.12)'
                    : z.kind === 'spawn'
                      ? 'rgba(148, 163, 184, 0.08)'
                      : z.kind === 'teleporter'
                        ? 'rgba(167, 139, 250, 0.2)'
                        : 'rgba(30, 41, 59, 0.45)';
                const stroke =
                  z.kind === 'site'
                    ? 'rgba(56, 189, 248, 0.5)'
                    : z.kind === 'teleporter'
                      ? 'rgba(167, 139, 250, 0.65)'
                      : 'rgba(148, 163, 184, 0.22)';
                return (
                  <g key={z.id}>
                    <rect
                      x={z.x}
                      y={z.y}
                      width={z.w}
                      height={z.h}
                      rx={1.5}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={z.kind === 'site' ? 0.55 : 0.3}
                      strokeDasharray={z.kind === 'teleporter' ? '1.2 0.8' : undefined}
                    />
                    <text
                      x={z.x + z.w / 2}
                      y={z.y + z.h / 2 + 0.8}
                      textAnchor="middle"
                      fontSize={z.kind === 'site' ? '3.1' : '2.0'}
                      fontWeight="700"
                      fill={z.kind === 'site' ? '#7dd3fc' : 'rgba(148,163,184,0.7)'}
                    >
                      {z.label}
                    </text>
                  </g>
                );
              })}

              {/* Map Obstacles / Walls */}
              {blueprint.obstacles.map((ob, idx) => (
                <rect
                  key={idx}
                  x={ob.x}
                  y={ob.y}
                  width={ob.w}
                  height={ob.h}
                  rx={0.8}
                  fill="#0b1322"
                  stroke="rgba(100, 116, 139, 0.45)"
                  strokeWidth="0.35"
                />
              ))}

              {/* Bind Teleporters */}
              {blueprint.teleporters?.map((tp) => (
                <g key={tp.id}>
                  <line
                    x1={tp.from.x}
                    y1={tp.from.y}
                    x2={tp.to.x}
                    y2={tp.to.y}
                    stroke="#a78bfa"
                    strokeWidth="0.45"
                    strokeDasharray="1.4 1.1"
                    opacity="0.7"
                  />
                </g>
              ))}

              {/* Secondary Callouts */}
              {blueprint.callouts.map((c) => (
                <text
                  key={c.label}
                  x={c.x}
                  y={c.y}
                  textAnchor="middle"
                  fontSize="1.8"
                  fill="rgba(148,163,184,0.55)"
                >
                  {c.label}
                </text>
              ))}

              {/* Match-Wide Spike Plant Heatmap Overlay */}
              {showPlantHeatmap &&
                allPlants.map((p) => (
                  <circle
                    key={`plant-heat-${p.roundNumber}`}
                    cx={p.pos.x}
                    cy={p.pos.y}
                    r={p.roundNumber === round.roundNumber ? 2.8 : 1.7}
                    fill={
                      p.attackTeam === 'OPP'
                        ? 'rgba(255, 70, 85, 0.25)'
                        : 'rgba(0, 174, 239, 0.24)'
                    }
                    stroke={
                      p.roundNumber === round.roundNumber
                        ? '#f59e0b'
                        : p.attackTeam === 'OPP'
                          ? 'rgba(255,70,85,0.5)'
                          : 'rgba(56,189,248,0.5)'
                    }
                    strokeWidth={p.roundNumber === round.roundNumber ? '0.55' : '0.25'}
                  />
                ))}

              {/* Active Round Utility */}
              {showUtility &&
                activeUtility.map((u) => {
                  const color = UTILITY_COLORS[u.type];
                  const isLiveNow =
                    currentTime >= u.timestampSec &&
                    currentTime <= u.timestampSec + u.durationSec;
                  return (
                    <g key={u.id} opacity={isLiveNow ? 0.92 : 0.42}>
                      <line
                        x1={u.from.x}
                        y1={u.from.y}
                        x2={u.to.x}
                        y2={u.to.y}
                        stroke={color}
                        strokeWidth="0.4"
                        strokeDasharray="1.1 0.8"
                      />
                      <circle
                        cx={u.to.x}
                        cy={u.to.y}
                        r={u.radius}
                        fill={color}
                        fillOpacity={isLiveNow ? 0.22 : 0.08}
                        stroke={color}
                        strokeWidth="0.45"
                      />
                      {showLabels && (
                        <text
                          x={u.to.x}
                          y={u.to.y - u.radius - 0.8}
                          textAnchor="middle"
                          fontSize="1.8"
                          fontWeight="600"
                          fill={color}
                        >
                          {u.ability}
                        </text>
                      )}
                    </g>
                  );
                })}

              {/* Kill Vectors */}
              {showKills &&
                visibleKills.map((k) => {
                  const color = k.killerTeam === 'C9' ? '#38bdf8' : '#ff4655';
                  return (
                    <g key={k.id}>
                      <line
                        x1={k.killerPos.x}
                        y1={k.killerPos.y}
                        x2={k.victimPos.x}
                        y2={k.victimPos.y}
                        stroke={color}
                        strokeWidth="0.55"
                        markerEnd={k.killerTeam === 'C9' ? 'url(#arrow-c9)' : 'url(#arrow-opp)'}
                      />
                      <circle
                        cx={k.victimPos.x}
                        cy={k.victimPos.y}
                        r="1.3"
                        fill="none"
                        stroke={k.isFirstBlood ? '#facc15' : color}
                        strokeWidth="0.5"
                      />
                    </g>
                  );
                })}

              {/* Current Round Spike Plant Marker */}
              {round.plantPos && round.plantSec !== null && currentTime >= round.plantSec && (
                <g>
                  <polygon
                    points={`${round.plantPos.x},${round.plantPos.y - 2.3} ${round.plantPos.x + 2.1},${round.plantPos.y + 1.5} ${round.plantPos.x - 2.1},${round.plantPos.y + 1.5}`}
                    fill="#f59e0b"
                    stroke="#fef3c7"
                    strokeWidth="0.4"
                  />
                  <text
                    x={round.plantPos.x}
                    y={round.plantPos.y + 4.1}
                    textAnchor="middle"
                    fontSize="2.1"
                    fontWeight="700"
                    fill="#fbbf24"
                  >
                    SPIKE {round.plantSec}s
                  </text>
                </g>
              )}

              {/* Player Snapshots */}
              {round.players.map((p) => {
                const pos = interpolatePos(p.startPos, p.endPos, moveProgress);
                const isC9 = p.team === 'C9';
                const fill = isC9 ? '#00aeef' : '#ff4655';
                const fallen = currentTime >= round.roundDurationSec - 6 && !p.alive;
                return (
                  <g key={p.playerId} opacity={fallen ? 0.35 : 1}>
                    <line
                      x1={p.startPos.x}
                      y1={p.startPos.y}
                      x2={pos.x}
                      y2={pos.y}
                      stroke={fill}
                      strokeWidth="0.28"
                      opacity="0.38"
                    />
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="2.1"
                      fill={fill}
                      stroke={p.firstBlood ? '#facc15' : '#060a12'}
                      strokeWidth={p.firstBlood ? '0.6' : '0.45'}
                    />
                    {showLabels && (
                      <text
                        x={pos.x}
                        y={pos.y - 2.7}
                        textAnchor="middle"
                        fontSize="1.9"
                        fontWeight="700"
                        fill={isC9 ? '#bae6fd' : '#fecdd3'}
                      >
                        {p.name} ({p.agent.slice(0, 3)})
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Playback Controls */}
            <div className="scrubber-bar">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentTime(0);
                }}
              >
                <RotateCcw size={14} />
                0s
              </button>
              <input
                type="range"
                min={0}
                max={round.roundDurationSec}
                step={0.5}
                value={currentTime}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentTime(Number(e.target.value));
                }}
                className="range-slider"
                aria-label="Round playback time in seconds"
              />
              <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--c9-cyan)' }}>
                t = {currentTime.toFixed(1)}s / {round.roundDurationSec}s
              </span>
            </div>
          </div>
        </section>

        {/* Right Side: Round Tactical Breakdown */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">
                <Crosshair size={17} color="var(--val-red)" />
                Round {round.roundNumber} Telemetry Detail
              </h2>
              <p className="panel-subtitle">{round.oppSetupTag}</p>
            </div>
            <span className={`badge ${round.winner === 'C9' ? 'badge-c9' : 'badge-red'}`}>
              {round.winner === 'C9' ? match.teamC9Name : match.opponentTag} Win · {round.outcomeReason}
            </span>
          </div>

          <div className="equal-two-grid">
            <div className="item-card">
              <span className="kpi-label">Round Context</span>
              <div style={{ fontSize: '0.84rem', display: 'grid', gap: '4px' }}>
                <div>
                  Side: <strong>{round.attackTeam === 'C9' ? `${match.teamC9Name} ATK` : `${match.opponentTag} ATK`}</strong>
                </div>
                <div>
                  Target Site: <strong>Site {round.targetSite}</strong>
                </div>
                <div>
                  Execute / Plant:{' '}
                  <strong className="mono">
                    {round.executeSec !== null ? `${round.executeSec}s` : 'N/A'} /{' '}
                    {round.plantSec !== null ? `${round.plantSec}s` : 'No Plant'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="item-card">
              <span className="kpi-label">Round Economy</span>
              <div style={{ fontSize: '0.84rem', display: 'grid', gap: '4px' }}>
                <div>
                  ATK Buy: <strong style={{ textTransform: 'uppercase' }}>{round.attackBuyType}</strong>{' '}
                  <span className="mono">(${round.attackTeamBank.toLocaleString('en-US')})</span>
                </div>
                <div>
                  DEF Buy: <strong style={{ textTransform: 'uppercase' }}>{round.defenseBuyType}</strong>{' '}
                  <span className="mono">(${round.defenseTeamBank.toLocaleString('en-US')})</span>
                </div>
                <div>
                  Post-Plant:{' '}
                  <strong>
                    {round.postPlantOutcome ? round.postPlantOutcome.toUpperCase() : 'No Spike'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Utility Timeline Table */}
          <div>
            <h3 style={{ margin: '4px 0 8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Utility Sequence & Kill Feed (Syncs with Scrubber)
            </h3>
            <div className="data-list">
              {round.utility.map((u) => {
                const active =
                  currentTime >= u.timestampSec &&
                  currentTime <= u.timestampSec + u.durationSec;
                return (
                  <div
                    key={u.id}
                    className="item-card"
                    style={{
                      padding: '8px 10px',
                      borderColor: active ? UTILITY_COLORS[u.type] : undefined,
                    }}
                  >
                    <div className="item-card-header">
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        <Flame size={13} style={{ verticalAlign: 'text-bottom', marginRight: 5 }} color={UTILITY_COLORS[u.type]} />
                        {u.actorName} ({u.agent}) — {u.ability}
                      </span>
                      <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        {u.timestampSec}s–{u.timestampSec + u.durationSec}s · Site {u.site}
                      </span>
                    </div>
                  </div>
                );
              })}

              {round.kills.map((k) => (
                <div
                  key={k.id}
                  className="item-card"
                  style={{
                    padding: '8px 10px',
                    opacity: currentTime >= k.timestampSec ? 1 : 0.5,
                  }}
                >
                  <div className="item-card-header">
                    <span style={{ fontSize: '0.8rem' }}>
                      <strong style={{ color: k.killerTeam === 'C9' ? 'var(--c9-cyan)' : '#ff808b' }}>
                        {k.killer}
                      </strong>{' '}
                      [{k.weapon}] → <strong>{k.victim}</strong>
                    </span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {k.isFirstBlood && <span className="badge badge-amber">First Blood</span>}
                      <span className="mono" style={{ fontSize: '0.74rem' }}>
                        {k.timestampSec}s
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Site Frequency Summary */}
          <div className="item-card">
            <div className="item-card-header">
              <span className="kpi-label">
                <Shield size={13} style={{ verticalAlign: 'text-bottom', marginRight: 5 }} />
                Match Site Pressure ({blueprint.name})
              </span>
              <span className="kpi-meta">Post-plant Win: {formatPct(analytics.postPlantWinRate.rate)}</span>
            </div>
            <div style={{ display: 'grid', gap: '8px', marginTop: '4px' }}>
              {analytics.siteMetrics
                .filter((s) => s.attempts > 0)
                .map((s) => (
                  <div key={s.site} style={{ display: 'grid', gap: '3px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span>
                        <strong>Site {s.site}</strong> ({s.attempts} rounds · Avg Exec{' '}
                        {s.avgExecuteSec ?? '—'}s)
                      </span>
                      <span className="mono">
                        Plant {formatPct(s.plantRate)}
                      </span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill-c9"
                        style={{
                          width: `${Math.round((s.attempts / Math.max(1, analytics.totalRounds)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
