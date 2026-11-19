/**
 * Rivers, Railroads, Paved Roads, Bridges & Road-Building Targets Layer
 */

import React from 'react';
import { GameState } from '../../game/types';
import { getSharedEdgeSegment, hexToPixel, parseHexKey } from '../../game/hexMath';
import { TRANSPORTER_SPECS } from '../../game/constants';
import {
  canBuildRoad,
  doesSideFlankRiverEdge,
  edgeHasBankRoadPair,
  getBuilderAccessibleSides,
  getDryRoadGeometry,
  getNeighborSideOnHex,
  getRiverBankRoadGeometry,
  getRiverBridgeGeometry,
  getRiverEdgeBankPairs,
  getTransporterSide,
} from '../../game/engine';

export interface TileRiverPathData {
  paths: string[];
  center: { x: number; y: number };
  isSource: boolean;
  isConfluence: boolean;
  midpoints: { x: number; y: number }[];
}

export interface SelectEdgeRoadOptions {
  material?: 'boards' | 'stone';
  buildType?: 'road' | 'bridge';
  bankPair?: { hexASide: number; hexBSide: number };
}

interface EdgeAndRailLayerProps {
  gameState: GameState;
  activePlayerId: string;
  tileRiverPaths: Record<string, TileRiverPathData>;
  hexRadius: number;
  selectedTransporterId: string | null;
  selectedHexId: string | null;
  buildMode: 'none' | 'road' | 'factory' | 'wonder';
  onSelectEdgeForRoad?: (hexA: string, hexB: string, options?: SelectEdgeRoadOptions) => void;
}

export const EdgeAndRailLayer: React.FC<EdgeAndRailLayerProps> = ({
  gameState,
  activePlayerId,
  tileRiverPaths,
  hexRadius,
  selectedTransporterId,
  selectedHexId,
  buildMode,
  onSelectEdgeForRoad,
}) => {
  const orientation = gameState.hexOrientation || 'pointy';
  const selectedT = selectedTransporterId ? gameState.transporters[selectedTransporterId] : undefined;
  const builder =
    selectedT && selectedT.ownerId === activePlayerId
      ? selectedT
      : selectedHexId
      ? Object.values(gameState.transporters).find(
          t => t.ownerId === activePlayerId && t.hexId === selectedHexId
        )
      : undefined;

  return (
    <>
      {/* River Network */}
      <g id="boardRiverNetwork" pointerEvents="none">
        {Object.entries(tileRiverPaths).map(([hexId, rData]) => (
          <g key={`river_net_${hexId}`}>
            {rData.paths.map((pathD, pIdx) => (
              <path
                key={`river_path_${hexId}_${pIdx}`}
                d={pathD}
                fill="none"
                stroke="#0284c7"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {(rData.isSource || rData.isConfluence) && (
              <circle cx={rData.center.x} cy={rData.center.y} r="3.5" fill="#0284c7" />
            )}
          </g>
        ))}
      </g>

      {/* Hex Edges: Railroads, Roads, Riverbank Roads, Bridges & Construction Targets */}
      {Object.values(gameState.edges).map(edge => {
        const [coordA, coordB] = [parseHexKey(edge.hexA), parseHexKey(edge.hexB)];
        const seg = getSharedEdgeSegment(coordA.q, coordA.r, coordB.q, coordB.r, hexRadius, orientation);
        const centerA = hexToPixel(coordA.q, coordA.r, hexRadius, orientation);
        const centerB = hexToPixel(coordB.q, coordB.r, hexRadius, orientation);

        const isRoad = edge.improvement === 'road';
        const isBridge = edge.improvement === 'bridge';
        const isRailroad = Boolean(edge.isRailroad);
        const bankRoads = edge.riverBankRoads || [];
        const isCoastalOrSeaEdge =
          gameState.hexes[edge.hexA]?.terrain === 'water' ||
          gameState.hexes[edge.hexB]?.terrain === 'water';

        const dryRoadGeom = !edge.isRiver ? getDryRoadGeometry(gameState, edge, hexRadius) : null;
        const bridgeGeom = edge.isRiver ? getRiverBridgeGeometry(gameState, edge, hexRadius) : null;

        const builderOnEndpoint = Boolean(
          builder && (builder.hexId === edge.hexA || builder.hexId === edge.hexB)
        );
        const canShowBuildTargets =
          buildMode === 'road' &&
          Boolean(builder) &&
          !isBridge &&
          !isRailroad &&
          !isCoastalOrSeaEdge &&
          builderOnEndpoint;

        let dryRoadTarget: { check: ReturnType<typeof canBuildRoad> } | null = null;
        let riverBridgeTarget: { check: ReturnType<typeof canBuildRoad> } | null = null;
        const riverBankRoadTargets: Array<{
          bankPair: { hexASide: number; hexBSide: number };
          geom: ReturnType<typeof getRiverBankRoadGeometry>;
          check: ReturnType<typeof canBuildRoad>;
        }> = [];

        if (canShowBuildTargets && builder) {
          const builderSide = getTransporterSide(gameState, builder);
          const bSpec = TRANSPORTER_SPECS[builder.type];
          const accessibleBuilder = getBuilderAccessibleSides(gameState, builder.hexId, builder);

          if (!edge.isRiver) {
            if (!isRoad) {
              const otherHexId = builder.hexId === edge.hexA ? edge.hexB : edge.hexA;
              const neededSide = getNeighborSideOnHex(gameState, builder.hexId, otherHexId);
              const isLegalSide =
                neededSide === null || accessibleBuilder.has(neededSide);
              if (isLegalSide) {
                dryRoadTarget = {
                  check: canBuildRoad(
                    gameState,
                    activePlayerId,
                    edge.hexA,
                    edge.hexB,
                    'stone',
                    builder.id,
                    { buildType: 'road' }
                  ),
                };
              }
            }
          } else {
            const canReachRiver =
              Boolean(bSpec.waterOnly && builder.waterLocation === 'river') ||
              doesSideFlankRiverEdge(gameState, builder.hexId, builderSide, edge.id);

            if (canReachRiver) {
              riverBridgeTarget = {
                check: canBuildRoad(
                  gameState,
                  activePlayerId,
                  edge.hexA,
                  edge.hexB,
                  'stone',
                  builder.id,
                  { buildType: 'bridge' }
                ),
              };

              const allBankPairs = getRiverEdgeBankPairs(gameState, edge);
              allBankPairs.forEach((pair, pIdx) => {
                if (edgeHasBankRoadPair(edge, pair)) return;
                const reqSide = builder.hexId === edge.hexA ? pair.hexASide : pair.hexBSide;
                if (!accessibleBuilder.has(reqSide)) return;

                riverBankRoadTargets.push({
                  bankPair: pair,
                  geom: getRiverBankRoadGeometry(gameState, edge, pair, hexRadius, pIdx),
                  check: canBuildRoad(
                    gameState,
                    activePlayerId,
                    edge.hexA,
                    edge.hexB,
                    'stone',
                    builder.id,
                    { buildType: 'road', bankPair: pair }
                  ),
                });
              });
            }
          }
        }

        return (
          <g key={edge.id}>
            {isRailroad && (
              <g className="filter drop-shadow-md" pointerEvents="none">
                <line
                  x1={centerA.x}
                  y1={centerA.y}
                  x2={centerB.x}
                  y2={centerB.y}
                  stroke="#0f172a"
                  strokeWidth="9"
                  strokeLinecap="round"
                />
                <line
                  x1={centerA.x}
                  y1={centerA.y}
                  x2={centerB.x}
                  y2={centerB.y}
                  stroke="#f8fafc"
                  strokeWidth="5.5"
                  strokeDasharray="4,5"
                  strokeLinecap="butt"
                />
                <line
                  x1={centerA.x}
                  y1={centerA.y}
                  x2={centerB.x}
                  y2={centerB.y}
                  stroke="#334155"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx={centerA.x} cy={centerA.y} r="4.5" fill="#0f172a" stroke="#f8fafc" strokeWidth="1.5" />
                <circle cx={centerB.x} cy={centerB.y} r="4.5" fill="#0f172a" stroke="#f8fafc" strokeWidth="1.5" />
              </g>
            )}

            {/* Paved Dry-Border Land Road (anchored strictly on facing dry banks, never crossing water) */}
            {isRoad && dryRoadGeom && (
              <g className="filter drop-shadow-md" pointerEvents="none">
                <path d={dryRoadGeom.pathD} fill="none" stroke="#1c1917" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d={dryRoadGeom.pathD} fill="none" stroke="#d97706" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d={dryRoadGeom.pathD} fill="none" stroke="#fef08a" strokeWidth="1.7" strokeDasharray="5,4" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={dryRoadGeom.start.x} cy={dryRoadGeom.start.y} r="3.8" fill="#b45309" stroke="#1c1917" strokeWidth="1.4" />
                <circle cx={dryRoadGeom.end.x} cy={dryRoadGeom.end.y} r="3.8" fill="#b45309" stroke="#1c1917" strokeWidth="1.4" />
              </g>
            )}

            {/* Paved Riverbank Roads (curving strictly along the dry riverbank, never crossing water) */}
            {bankRoads.map((bankRoad, brIdx) => {
              const geom = getRiverBankRoadGeometry(gameState, edge, bankRoad, hexRadius, brIdx);
              return (
                <g key={`bank_road_${edge.id}_${brIdx}`} className="filter drop-shadow-md" pointerEvents="none">
                  <path d={geom.pathD} fill="none" stroke="#1c1917" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={geom.pathD} fill="none" stroke="#d97706" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={geom.pathD} fill="none" stroke="#fef08a" strokeWidth="1.5" strokeDasharray="4,3.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx={geom.start.x} cy={geom.start.y} r="3.3" fill="#b45309" stroke="#1c1917" strokeWidth="1.2" />
                  <circle cx={geom.end.x} cy={geom.end.y} r="3.3" fill="#b45309" stroke="#1c1917" strokeWidth="1.2" />
                </g>
              );
            })}

            {/* River Bridge: spans strictly perpendicular across the water with small landings on each bank */}
            {isBridge && bridgeGeom && (() => {
              const { start, end, riverDir } = bridgeGeom;
              const capHalf = 6.2;
              return (
                <g className="filter drop-shadow-lg" pointerEvents="none">
                  {/* Bank abutments at each end of the bridge */}
                  <line
                    x1={start.x - riverDir.x * capHalf}
                    y1={start.y - riverDir.y * capHalf}
                    x2={start.x + riverDir.x * capHalf}
                    y2={start.y + riverDir.y * capHalf}
                    stroke="#292524"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <line
                    x1={end.x - riverDir.x * capHalf}
                    y1={end.y - riverDir.y * capHalf}
                    x2={end.x + riverDir.x * capHalf}
                    y2={end.y + riverDir.y * capHalf}
                    stroke="#292524"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  {/* Timber deck & railings spanning the water */}
                  <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#451a03" strokeWidth="11.5" strokeLinecap="butt" />
                  <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#fde68a" strokeWidth="7.5" strokeDasharray="3.2,2.2" strokeLinecap="butt" />
                  <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#78350f" strokeWidth="1.4" strokeLinecap="butt" />
                </g>
              );
            })()}

            {/* Dry Land Road Target */}
            {dryRoadTarget && dryRoadGeom && (() => {
              const hasMaterials = Boolean(dryRoadTarget.check.valid);
              return (
                <g
                  className="cursor-pointer"
                  pointerEvents="auto"
                  opacity={hasMaterials ? 1 : 0.72}
                  onClick={e => {
                    e.stopPropagation();
                    onSelectEdgeForRoad?.(edge.hexA, edge.hexB, {
                      material: 'stone',
                      buildType: 'road',
                    });
                  }}
                >
                  <title>
                    {hasMaterials
                      ? 'Click to pave Road (1 Stone)'
                      : dryRoadTarget.check.reason || 'Insufficient materials on this side'}
                  </title>
                  <path d={dryRoadGeom.pathD} fill="none" stroke="transparent" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" pointerEvents="stroke" />
                  <line x1={seg.p1.x} y1={seg.p1.y} x2={seg.p2.x} y2={seg.p2.y} stroke="transparent" strokeWidth="24" strokeLinecap="round" pointerEvents="stroke" />
                  <path
                    d={dryRoadGeom.pathD}
                    fill="none"
                    stroke={hasMaterials ? '#fbbf24' : '#94a3b8'}
                    strokeWidth="7.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeOpacity={hasMaterials ? 0.45 : 0.25}
                    className={hasMaterials ? 'animate-pulse' : undefined}
                  />
                  <path
                    d={dryRoadGeom.pathD}
                    fill="none"
                    stroke={hasMaterials ? '#fef08a' : '#cbd5e1'}
                    strokeWidth="3.2"
                    strokeDasharray="6,4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <g transform={`translate(${dryRoadGeom.midPoint.x}, ${dryRoadGeom.midPoint.y})`}>
                    <circle
                      r="14"
                      fill={hasMaterials ? '#f59e0b' : '#334155'}
                      stroke={hasMaterials ? '#ffffff' : '#94a3b8'}
                      strokeWidth="2.3"
                      className="shadow-xl"
                    />
                    <text textAnchor="middle" dy="4.2" fontSize="11.5" className="select-none pointer-events-none">
                      🛣️
                    </text>
                  </g>
                </g>
              );
            })()}

            {/* River Bridge Target (1 Stone, short perpendicular span across the water) */}
            {riverBridgeTarget && bridgeGeom && (() => {
              const hasMaterials = Boolean(riverBridgeTarget.check.valid);
              const { start, end, midPoint } = bridgeGeom;
              return (
                <g
                  className="cursor-pointer"
                  pointerEvents="auto"
                  opacity={hasMaterials ? 1 : 0.72}
                  onClick={e => {
                    e.stopPropagation();
                    onSelectEdgeForRoad?.(edge.hexA, edge.hexB, {
                      material: 'stone',
                      buildType: 'bridge',
                    });
                  }}
                >
                  <title>
                    {hasMaterials
                      ? 'Click to build Bridge across water (1 Stone)'
                      : riverBridgeTarget.check.reason || 'Insufficient materials on this side'}
                  </title>
                  <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="transparent" strokeWidth="18" strokeLinecap="round" pointerEvents="stroke" />
                  <circle cx={midPoint.x} cy={midPoint.y} r="12" fill="transparent" />
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={hasMaterials ? '#fbbf24' : '#94a3b8'}
                    strokeWidth="9"
                    strokeLinecap="butt"
                    strokeOpacity={hasMaterials ? 0.5 : 0.28}
                    className={hasMaterials ? 'animate-pulse' : undefined}
                  />
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={hasMaterials ? '#fef08a' : '#cbd5e1'}
                    strokeWidth="3.5"
                    strokeDasharray="4,3"
                    strokeLinecap="butt"
                  />
                  <g transform={`translate(${midPoint.x}, ${midPoint.y})`}>
                    <circle
                      r="10.5"
                      fill={hasMaterials ? '#f59e0b' : '#334155'}
                      stroke={hasMaterials ? '#ffffff' : '#94a3b8'}
                      strokeWidth="2"
                      className="shadow-xl"
                    />
                    <text textAnchor="middle" dy="3.6" fontSize="9.5" className="select-none pointer-events-none">
                      🌉
                    </text>
                  </g>
                </g>
              );
            })()}

            {/* Riverbank Road Target(s) (1 Stone, following the dry bank alongside the river) */}
            {riverBankRoadTargets.map((target, tIdx) => {
              const hasMaterials = Boolean(target.check.valid);
              const { pathD, badgePoint } = target.geom;
              return (
                <g
                  key={`bank_road_target_${edge.id}_${tIdx}`}
                  className="cursor-pointer"
                  pointerEvents="auto"
                  opacity={hasMaterials ? 1 : 0.78}
                  onClick={e => {
                    e.stopPropagation();
                    onSelectEdgeForRoad?.(edge.hexA, edge.hexB, {
                      material: 'stone',
                      buildType: 'road',
                      bankPair: target.bankPair,
                    });
                  }}
                >
                  <title>
                    {hasMaterials
                      ? 'Click to pave Road alongside river (1 Stone)'
                      : target.check.reason || 'Insufficient Stone on this side'}
                  </title>
                  <path d={pathD} fill="none" stroke="transparent" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" pointerEvents="stroke" />
                  <circle cx={badgePoint.x} cy={badgePoint.y} r="12" fill="transparent" />
                  <path
                    d={pathD}
                    fill="none"
                    stroke={hasMaterials ? '#fbbf24' : '#94a3b8'}
                    strokeWidth="6.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeOpacity={hasMaterials ? 0.45 : 0.25}
                    className={hasMaterials ? 'animate-pulse' : undefined}
                  />
                  <path
                    d={pathD}
                    fill="none"
                    stroke={hasMaterials ? '#fef08a' : '#cbd5e1'}
                    strokeWidth="2.8"
                    strokeDasharray="5,4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <g transform={`translate(${badgePoint.x}, ${badgePoint.y})`}>
                    <circle
                      r="10.5"
                      fill={hasMaterials ? '#f59e0b' : '#334155'}
                      stroke={hasMaterials ? '#ffffff' : '#94a3b8'}
                      strokeWidth="2"
                      className="shadow-xl"
                    />
                    <text textAnchor="middle" dy="3.6" fontSize="9.5" className="select-none pointer-events-none">
                      🛣️
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        );
      })}
    </>
  );
};
