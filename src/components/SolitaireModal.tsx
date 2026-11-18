/**
 * Pre-Made Scenarios Modal
 *
 * Layout:
 * 1) A single compact filter row with minimum height containing filters for:
 *    - Map Set
 *    - Player Count
 *    - Skill Level
 * 2) Filtered scenario descriptions with a Select button on each scenario card,
 *    taking up the vast majority of the screen space.
 */

import React, { useState, useMemo } from 'react';
import {
  ALL_SCENARIOS,
  SCENARIO_MAP_SETS,
  SolitaireScenario,
} from '../game/scenarios';
import { MAP_PRESETS, MapPreset, ScenarioMapSetId } from '../game/maps';
import { DEFAULT_BOT_PROFILE_ID } from '../game/engine';
import {
  getEdgeKey,
  getHexCornerPoints,
  getSharedEdgeSegment,
  hexToKey,
  hexToPixel,
  parseHexKey,
} from '../game/hexMath';
import { TerrainType } from '../game/types';

export interface ScenarioLaunchOptions {
  customName?: string;
  isSolitaire?: boolean;
  fillWithBots?: boolean;
  botProfileId?: string;
}

interface SolitaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (
    scenario: SolitaireScenario,
    customNameOrOptions?: string | ScenarioLaunchOptions
  ) => void;
  initialMapSet?: 'all' | ScenarioMapSetId;
}

function scenarioMatchesPlayerCount(
  recommendedPlayers: string | undefined,
  playerCountFilter: string
): boolean {
  if (playerCountFilter === 'all') return true;
  const target = Number(playerCountFilter);
  if (Number.isNaN(target)) return true;

  const text = (recommendedPlayers || '1 Player').trim();
  const rangeMatch = text.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (rangeMatch) {
    const minP = Number(rangeMatch[1]);
    const maxP = Number(rangeMatch[2]);
    return target >= minP && target <= maxP;
  }

  const singleMatch = text.match(/(\d+)/);
  if (singleMatch) {
    return Number(singleMatch[1]) === target;
  }

  return target === 1;
}

function getTerrainColor(terrain: TerrainType): string {
  switch (terrain) {
    case 'pasture':
      return '#4ade80';
    case 'forest':
      return '#15803d';
    case 'mountain':
      return '#b45309';
    case 'rock':
      return '#94a3b8';
    case 'water':
      return '#38bdf8';
    case 'desert':
      return '#eab308';
    default:
      return '#64748b';
  }
}

function getDifficultyBadgeStyle(difficulty: SolitaireScenario['difficulty']): string {
  switch (difficulty) {
    case 'Beginner':
      return 'bg-emerald-950/80 border-emerald-600/60 text-emerald-300';
    case 'Intermediate':
      return 'bg-sky-950/80 border-sky-600/60 text-sky-300';
    case 'Advanced':
      return 'bg-amber-950/80 border-amber-600/60 text-amber-300';
    case 'Master':
      return 'bg-rose-950/80 border-rose-600/60 text-rose-300';
    default:
      return 'bg-slate-800 border-slate-700 text-slate-300';
  }
}

const ScenarioMiniMap: React.FC<{ mapPreset?: MapPreset }> = ({ mapPreset }) => {
  if (!mapPreset || mapPreset.hexes.length === 0) return null;

  const hexOrientation = mapPreset.hexOrientation || 'pointy';
  const size = 16;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const hexCoordSet = new Set<string>();
  mapPreset.hexes.forEach(hex => {
    hexCoordSet.add(hexToKey(hex.q, hex.r));
    const { x: cx, y: cy } = hexToPixel(hex.q, hex.r, size, hexOrientation);
    minX = Math.min(minX, cx - size);
    maxX = Math.max(maxX, cx + size);
    minY = Math.min(minY, cy - size);
    maxY = Math.max(maxY, cy + size);
  });

  // Build connected river network paths per hex (matching HexBoard rendering)
  const seenRiverEdges = new Set<string>();
  const riverNeighborsByHex: Record<string, Array<{ q: number; r: number }>> = {};
  (mapPreset.riverEdges || []).forEach(r => {
    const k1 = hexToKey(r.q1, r.r1);
    const k2 = hexToKey(r.q2, r.r2);
    if (!hexCoordSet.has(k1) || !hexCoordSet.has(k2)) return;
    const edgeKey = getEdgeKey(r.q1, r.r1, r.q2, r.r2);
    if (seenRiverEdges.has(edgeKey)) return;
    seenRiverEdges.add(edgeKey);

    if (!riverNeighborsByHex[k1]) riverNeighborsByHex[k1] = [];
    riverNeighborsByHex[k1].push({ q: r.q2, r: r.r2 });
    if (!riverNeighborsByHex[k2]) riverNeighborsByHex[k2] = [];
    riverNeighborsByHex[k2].push({ q: r.q1, r: r.r1 });
  });

  const tileRiverPaths: Array<{
    key: string;
    paths: string[];
    center: { x: number; y: number };
    hasDot: boolean;
  }> = [];

  Object.entries(riverNeighborsByHex).forEach(([hexKey, neighbors]) => {
    if (neighbors.length === 0) return;
    const coord = parseHexKey(hexKey);
    const center = hexToPixel(coord.q, coord.r, size, hexOrientation);
    const midpoints = neighbors.map(nb => {
      const seg = getSharedEdgeSegment(coord.q, coord.r, nb.q, nb.r, size, hexOrientation);
      return { x: seg.midX, y: seg.midY };
    });

    const paths: string[] = [];
    let hasDot = false;
    if (midpoints.length === 1) {
      hasDot = true;
      paths.push(`M ${center.x} ${center.y} L ${midpoints[0].x} ${midpoints[0].y}`);
    } else if (midpoints.length === 2) {
      paths.push(
        `M ${midpoints[0].x} ${midpoints[0].y} Q ${center.x} ${center.y} ${midpoints[1].x} ${midpoints[1].y}`
      );
    } else {
      hasDot = true;
      midpoints.forEach(m => {
        paths.push(`M ${m.x} ${m.y} L ${center.x} ${center.y}`);
      });
    }

    tileRiverPaths.push({ key: hexKey, paths, center, hasDot });
  });

  const pad = 12;
  const viewBox = `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;

  return (
    <svg
      viewBox={viewBox}
      className="w-full h-full select-none"
      aria-label={`Map preview for ${mapPreset.name}`}
    >
      {/* 1. Terrain Hex Tiles */}
      {mapPreset.hexes.map(hex => {
        const { x: cx, y: cy } = hexToPixel(hex.q, hex.r, size, hexOrientation);
        const points = getHexCornerPoints(cx, cy, size - 0.8, hexOrientation);
        const isHome = mapPreset.playerHomeHexes.some(
          h => h.q === hex.q && h.r === hex.r
        );

        return (
          <polygon
            key={`${hex.q},${hex.r}`}
            points={points}
            fill={getTerrainColor(hex.terrain)}
            stroke={isHome ? '#fef08a' : '#0f172a'}
            strokeWidth={isHome ? 2 : 1}
            opacity={0.92}
          />
        );
      })}

      {/* 2. River Network */}
      {tileRiverPaths.length > 0 && (
        <g pointerEvents="none">
          {tileRiverPaths.map(rTile => (
            <g key={`minimap_river_${rTile.key}`}>
              {rTile.paths.map((d, idx) => (
                <React.Fragment key={idx}>
                  <path
                    d={d}
                    fill="none"
                    stroke="#0c4a6e"
                    strokeWidth={3.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={d}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </React.Fragment>
              ))}
              {rTile.hasDot && (
                <circle
                  cx={rTile.center.x}
                  cy={rTile.center.y}
                  r={1.6}
                  fill="#38bdf8"
                  stroke="#0c4a6e"
                  strokeWidth={0.7}
                />
              )}
            </g>
          ))}
        </g>
      )}

      {/* 3. Pre-Built Railroads & Initial Roads (if present) */}
      {(mapPreset.railroads || []).map((rr, idx) => {
        const c1 = hexToPixel(rr.q1, rr.r1, size, hexOrientation);
        const c2 = hexToPixel(rr.q2, rr.r2, size, hexOrientation);
        return (
          <g key={`minimap_rr_${idx}`} pointerEvents="none">
            <line x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} stroke="#0f172a" strokeWidth={2.5} strokeLinecap="round" />
            <line
              x1={c1.x}
              y1={c1.y}
              x2={c2.x}
              y2={c2.y}
              stroke="#f8fafc"
              strokeWidth={1.2}
              strokeDasharray="2,2"
            />
          </g>
        );
      })}

      {(mapPreset.initialRoads || []).map((rd, idx) => {
        const c1 = hexToPixel(rd.q1, rd.r1, size, hexOrientation);
        const c2 = hexToPixel(rd.q2, rd.r2, size, hexOrientation);
        return (
          <g key={`minimap_road_${idx}`} pointerEvents="none">
            <line x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} stroke="#451a03" strokeWidth={2.4} strokeLinecap="round" />
            <line x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} stroke="#f59e0b" strokeWidth={1.2} strokeLinecap="round" />
          </g>
        );
      })}

      {/* 4. Home Hex Markers */}
      {mapPreset.playerHomeHexes.map((home, idx) => {
        if (!hexCoordSet.has(hexToKey(home.q, home.r))) return null;
        const { x: cx, y: cy } = hexToPixel(home.q, home.r, size, hexOrientation);
        return (
          <circle
            key={`minimap_home_${idx}`}
            cx={cx}
            cy={cy}
            r={5}
            fill="#78350f"
            stroke="#fde047"
            strokeWidth={1.2}
          />
        );
      })}
    </svg>
  );
};

export const SolitaireModal: React.FC<SolitaireModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario,
  initialMapSet = 'all',
}) => {
  const [selectedMapSet, setSelectedMapSet] = useState<'all' | ScenarioMapSetId>(initialMapSet);
  const [selectedPlayerCount, setSelectedPlayerCount] = useState<string>('all');
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<string>('all');

  // Per-scenario launch mode override for multi-player capable scenarios ('ai' | 'solo' | 'open')
  const [launchModeByScenario, setLaunchModeByScenario] = useState<
    Record<string, 'ai' | 'solo' | 'open'>
  >({});

  const filteredScenarios = useMemo(() => {
    return ALL_SCENARIOS.filter(sc => {
      const matchesMapSet =
        selectedMapSet === 'all' || (sc.mapSetId || 'solitaire_compendium') === selectedMapSet;
      const matchesPlayerCount = scenarioMatchesPlayerCount(
        sc.recommendedPlayers,
        selectedPlayerCount
      );
      const matchesSkill =
        selectedSkillLevel === 'all' ||
        sc.difficulty.toLowerCase() === selectedSkillLevel.toLowerCase();
      return matchesMapSet && matchesPlayerCount && matchesSkill;
    });
  }, [selectedMapSet, selectedPlayerCount, selectedSkillLevel]);

  if (!isOpen) return null;

  const hasActiveFilters =
    selectedMapSet !== 'all' ||
    selectedPlayerCount !== 'all' ||
    selectedSkillLevel !== 'all';

  const handleSelectClick = (sc: SolitaireScenario) => {
    const isStrictlySolo = Boolean(
      sc.isSolitaireOnly || sc.mapPresetId.startsWith('scenario_')
    );
    const mode = launchModeByScenario[sc.id] || 'ai';

    if (isStrictlySolo || mode === 'solo') {
      onSelectScenario(sc, {
        customName: sc.name,
        isSolitaire: true,
        fillWithBots: false,
      });
    } else {
      onSelectScenario(sc, {
        customName: sc.name,
        isSolitaire: false,
        fillWithBots: mode === 'ai',
        botProfileId: DEFAULT_BOT_PROFILE_ID,
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="premade-scenarios-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-7xl h-[94dvh] max-h-[94dvh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 1) Compact Header & Filter Bar with Top-Left Close Button */}
        <div className="px-3 sm:px-3.5 py-2 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 hover:border-amber-400/70 transition-colors shrink-0 text-sm font-bold"
              aria-label="Close Pre-Made Scenarios"
              title="Close Pre-Made Scenarios"
            >
              ✕
            </button>
            <span className="text-base shrink-0" aria-hidden="true">
              🗺️
            </span>
            <h2
              id="premade-scenarios-title"
              className="text-sm font-bold font-serif-title text-white tracking-wide truncate"
            >
              Pre-Made Scenarios
            </h2>
            <span className="px-1.5 py-0.5 text-[11px] font-mono font-bold rounded bg-amber-950/80 border border-amber-600/60 text-amber-300 shrink-0">
              {filteredScenarios.length} / {ALL_SCENARIOS.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Map Set Filter */}
            <label className="flex items-center gap-1.5 text-xs text-slate-300 min-w-0 flex-1 sm:flex-initial">
              <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap shrink-0">
                Map Set:
              </span>
              <select
                value={selectedMapSet}
                onChange={e =>
                  setSelectedMapSet(e.target.value as 'all' | ScenarioMapSetId)
                }
                aria-label="Filter by Map Set"
                className="min-w-0 w-full sm:w-auto px-2 py-1.5 sm:py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-100 focus:outline-none focus:border-amber-400"
              >
                <option value="all">All Map Sets ({ALL_SCENARIOS.length})</option>
                {SCENARIO_MAP_SETS.map(set => (
                  <option key={set.id} value={set.id}>
                    {set.shortName}
                  </option>
                ))}
              </select>
            </label>

            {/* Player Count Filter */}
            <label className="flex items-center gap-1.5 text-xs text-slate-300 min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap shrink-0">
                Players:
              </span>
              <select
                value={selectedPlayerCount}
                onChange={e => setSelectedPlayerCount(e.target.value)}
                aria-label="Filter by Player Count"
                className="px-2 py-1.5 sm:py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-100 focus:outline-none focus:border-amber-400"
              >
                <option value="all">All Counts</option>
                <option value="1">1 Player</option>
                <option value="2">2 Players</option>
                <option value="3">3 Players</option>
                <option value="4">4 Players</option>
              </select>
            </label>

            {/* Skill Level Filter */}
            <label className="flex items-center gap-1.5 text-xs text-slate-300 min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap shrink-0">
                Skill:
              </span>
              <select
                value={selectedSkillLevel}
                onChange={e => setSelectedSkillLevel(e.target.value)}
                aria-label="Filter by Skill Level"
                className="px-2 py-1.5 sm:py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-100 focus:outline-none focus:border-amber-400"
              >
                <option value="all">All Skill Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Master">Master</option>
              </select>
            </label>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSelectedMapSet('all');
                  setSelectedPlayerCount('all');
                  setSelectedSkillLevel('all');
                }}
                className="px-2.5 py-1.5 sm:py-1 rounded-lg text-[11px] font-semibold text-amber-300 hover:text-white bg-slate-900 border border-slate-700 hover:border-amber-500/60 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* 2) Filtered Scenario Descriptions with Select Button (Occupies Most of Screen Space) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 bg-slate-900/90">
          {filteredScenarios.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <p className="text-sm text-slate-400 mb-3">
                No pre-made scenarios match the selected Map Set, Player Count, and Skill Level filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedMapSet('all');
                  setSelectedPlayerCount('all');
                  setSelectedSkillLevel('all');
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            filteredScenarios.map(sc => {
              const mapPreset = MAP_PRESETS[sc.mapPresetId];
              const setInfo = SCENARIO_MAP_SETS.find(
                ms => ms.id === (sc.mapSetId || 'solitaire_compendium')
              );
              const isStrictlySolo = Boolean(
                sc.isSolitaireOnly || sc.mapPresetId.startsWith('scenario_')
              );
              const launchMode = launchModeByScenario[sc.id] || 'ai';
              const combinedNotes = [
                ...(mapPreset?.scenarioNotes || []),
                ...sc.keyTactics.filter(
                  t => !(mapPreset?.scenarioNotes || []).includes(t)
                ),
              ];

              return (
                <article
                  key={sc.id}
                  className="p-3.5 sm:p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col md:flex-row gap-4 items-stretch"
                >
                  {/* Mini Hex Map Preview */}
                  <div className="w-full md:w-44 h-36 md:h-auto shrink-0 rounded-lg bg-slate-950 border border-slate-800/90 p-1.5 flex flex-col justify-between">
                    <div className="flex-1 min-h-0 flex items-center justify-center">
                      <ScenarioMiniMap mapPreset={mapPreset} />
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 text-center pt-1 border-t border-slate-900 truncate">
                      {mapPreset?.hexes.length || 0} Hexes · {sc.maxRounds} Turns
                    </div>
                  </div>

                  {/* Scenario Description, Notes & Attribution */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between gap-2.5">
                    <div>
                      {/* Title & Metadata Badges Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <h3 className="text-base font-bold font-serif-title text-white">
                            {sc.name}
                          </h3>
                          <span className="text-xs text-slate-400">
                            {sc.subtitle}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {setInfo && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-900 border border-slate-700 text-slate-300">
                              {setInfo.icon} {setInfo.shortName}
                            </span>
                          )}
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-900 border border-slate-700 text-amber-300">
                            👥 {sc.recommendedPlayers || '1 Player'}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getDifficultyBadgeStyle(
                              sc.difficulty
                            )}`}
                          >
                            {sc.difficulty}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-900 border border-slate-800 text-slate-300">
                            Target: {sc.targetScore} VP
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-200 leading-relaxed mt-1.5">
                        {sc.description}
                      </p>

                      {/* Objective & Special Rules */}
                      <div className="mt-2 text-xs text-slate-300 space-y-1">
                        <div>
                          <span className="font-bold text-amber-300">Objective: </span>
                          <span>{sc.objective}</span>
                        </div>
                        {(sc.specialRules || mapPreset?.specialRules) && (
                          <div>
                            <span className="font-bold text-sky-300">Special Rules: </span>
                            <span className="text-slate-300">
                              {sc.specialRules || mapPreset?.specialRules}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Scenario Notes */}
                      {combinedNotes.length > 0 && (
                        <ul className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-400">
                          {combinedNotes.slice(0, 4).map((note, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-amber-400 font-bold shrink-0">•</span>
                              <span className="leading-snug">{note}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Attribution & Select Action Bar */}
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-400 truncate max-w-full">
                        <span className="text-slate-500">Attribution: </span>
                        <span className="text-slate-300 font-medium">
                          {sc.author || sc.designer}
                        </span>
                        <span className="mx-1.5 text-slate-600">·</span>
                        <span>
                          {sc.publisher || 'Splotter Spellen'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 ml-auto">
                        {!isStrictlySolo && (
                          <select
                            value={launchMode}
                            onChange={e =>
                              setLaunchModeByScenario(prev => ({
                                ...prev,
                                [sc.id]: e.target.value as 'ai' | 'solo' | 'open',
                              }))
                            }
                            aria-label={`Launch mode for ${sc.name}`}
                            className="px-2.5 py-2 sm:py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-400"
                          >
                            <option value="ai">vs. AI Bot</option>
                            <option value="open">Open Multiplayer</option>
                            <option value="solo">1P Solo</option>
                          </select>
                        )}

                        <button
                          type="button"
                          onClick={() => handleSelectClick(sc)}
                          className="px-4 py-2 sm:py-1.5 min-h-[36px] rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all shadow cursor-pointer whitespace-nowrap"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
