/**
 * Rivers, Railroads, Paved Roads, Bridges & Road-Building Targets Layer
 */

import React, { useRef } from 'react';
import { GameState } from '../../game/types';
import { hexToPixel, parseHexKey } from '../../game/hexMath';
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

interface Point2D {
  x: number;
  y: number;
}

interface RoadBuildTargetItem {
  key: string;
  kind: 'dryRoad' | 'bridge' | 'bankRoad';
  hexA: string;
  hexB: string;
  options: SelectEdgeRoadOptions;
  hasMaterials: boolean;
  title: string;
  icon: '🛣️' | '🌉';
  badgePoint: Point2D;
  badgeRadius: number;
  visualPathD: string;
  hitStart: Point2D;
  hitEnd: Point2D;
  hitStrokeWidth: number;
  visualStrokeWidth: number;
  visualDashArray: string;
  visualHaloWidth: number;
}

function lerpPoint(a: Point2D, b: Point2D, t: number): Point2D {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

function distToSegment(p: Point2D, a: Point2D, b: Point2D): number {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const lenSq = vx * vx + vy * vy;
  if (lenSq <= 1e-6) {
    return Math.hypot(p.x - a.x, p.y - a.y);
  }
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / lenSq));
  return Math.hypot(p.x - (a.x + vx * t), p.y - (a.y + vy * t));
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
  const targetGroupRef = useRef<SVGGElement>(null);
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

  const roadTargets: RoadBuildTargetItem[] = [];

  if (buildMode === 'road' && builder) {
    const builderSide = getTransporterSide(gameState, builder);
    const bSpec = TRANSPORTER_SPECS[builder.type];
    const accessibleBuilder = getBuilderAccessibleSides(gameState, builder.hexId, builder);

    Object.values(gameState.edges).forEach(edge => {
      const isRoad = edge.improvement === 'road';
      const isBridge = edge.improvement === 'bridge';
      const isRailroad = Boolean(edge.isRailroad);
      const isCoastalOrSeaEdge =
        gameState.hexes[edge.hexA]?.terrain === 'water' ||
        gameState.hexes[edge.hexB]?.terrain === 'water';
      const builderOnEndpoint = builder.hexId === edge.hexA || builder.hexId === edge.hexB;

      if (isBridge || isRailroad || isCoastalOrSeaEdge || !builderOnEndpoint) return;

      if (!edge.isRiver) {
        if (isRoad) return;
        const otherHexId = builder.hexId === edge.hexA ? edge.hexB : edge.hexA;
        const neededSide = getNeighborSideOnHex(gameState, builder.hexId, otherHexId);
        const isLegalSide = neededSide === null || accessibleBuilder.has(neededSide);
        if (!isLegalSide) return;

        const dryRoadGeom = getDryRoadGeometry(gameState, edge, hexRadius);
        const check = canBuildRoad(
          gameState,
          activePlayerId,
          edge.hexA,
          edge.hexB,
          'stone',
          builder.id,
          { buildType: 'road' }
        );
        const hasMaterials = Boolean(check.valid);
        roadTargets.push({
          key: `dry_target_${edge.id}`,
          kind: 'dryRoad',
          hexA: edge.hexA,
          hexB: edge.hexB,
          options: { material: 'stone', buildType: 'road' },
          hasMaterials,
          title: hasMaterials
            ? 'Click to pave Road (1 Stone)'
            : check.reason || 'Insufficient materials on this side',
          icon: '🛣️',
          badgePoint: dryRoadGeom.midPoint,
          badgeRadius: 13.5,
          visualPathD: dryRoadGeom.pathD,
          hitStart: lerpPoint(dryRoadGeom.start, dryRoadGeom.midPoint, 0.3),
          hitEnd: lerpPoint(dryRoadGeom.end, dryRoadGeom.midPoint, 0.3),
          hitStrokeWidth: 14,
          visualStrokeWidth: 3.2,
          visualDashArray: '6,4',
          visualHaloWidth: 7.5,
        });
      } else {
        const canReachRiver =
          Boolean(bSpec.waterOnly && builder.waterLocation === 'river') ||
          doesSideFlankRiverEdge(gameState, builder.hexId, builderSide, edge.id);
        if (!canReachRiver) return;

        const bridgeGeom = getRiverBridgeGeometry(gameState, edge, hexRadius);
        const bridgeCheck = canBuildRoad(
          gameState,
          activePlayerId,
          edge.hexA,
          edge.hexB,
          'stone',
          builder.id,
          { buildType: 'bridge' }
        );
        const hasBridgeMaterials = Boolean(bridgeCheck.valid);
        roadTargets.push({
          key: `bridge_target_${edge.id}`,
          kind: 'bridge',
          hexA: edge.hexA,
          hexB: edge.hexB,
          options: { material: 'stone', buildType: 'bridge' },
          hasMaterials: hasBridgeMaterials,
          title: hasBridgeMaterials
            ? 'Click to build Bridge across water (1 Stone)'
            : bridgeCheck.reason || 'Insufficient materials on this side',
          icon: '🌉',
          badgePoint: bridgeGeom.midPoint,
          badgeRadius: 10.5,
          visualPathD: `M ${bridgeGeom.start.x} ${bridgeGeom.start.y} L ${bridgeGeom.end.x} ${bridgeGeom.end.y}`,
          hitStart: lerpPoint(bridgeGeom.start, bridgeGeom.end, 0.14),
          hitEnd: lerpPoint(bridgeGeom.start, bridgeGeom.end, 0.86),
          hitStrokeWidth: 14,
          visualStrokeWidth: 3.5,
          visualDashArray: '4,3',
          visualHaloWidth: 9,
        });

        const allBankPairs = getRiverEdgeBankPairs(gameState, edge);
        allBankPairs.forEach((pair, pIdx) => {
          if (edgeHasBankRoadPair(edge, pair)) return;
          const reqSide = builder.hexId === edge.hexA ? pair.hexASide : pair.hexBSide;
          if (!accessibleBuilder.has(reqSide)) return;

          const bankGeom = getRiverBankRoadGeometry(gameState, edge, pair, hexRadius, pIdx);
          const bankCheck = canBuildRoad(
            gameState,
            activePlayerId,
            edge.hexA,
            edge.hexB,
            'stone',
            builder.id,
            { buildType: 'road', bankPair: pair }
          );
          const hasBankMaterials = Boolean(bankCheck.valid);
          roadTargets.push({
            key: `bank_target_${edge.id}_${pIdx}`,
            kind: 'bankRoad',
            hexA: edge.hexA,
            hexB: edge.hexB,
            options: { material: 'stone', buildType: 'road', bankPair: pair },
            hasMaterials: hasBankMaterials,
            title: hasBankMaterials
              ? 'Click to pave Road alongside river (1 Stone)'
              : bankCheck.reason || 'Insufficient Stone on this side',
            icon: '🛣️',
            badgePoint: bankGeom.badgePoint,
            badgeRadius: 10.5,
            visualPathD: bankGeom.pathD,
            hitStart: lerpPoint(bankGeom.start, bankGeom.badgePoint, 0.35),
            hitEnd: lerpPoint(bankGeom.end, bankGeom.badgePoint, 0.35),
            hitStrokeWidth: 12,
            visualStrokeWidth: 2.8,
            visualDashArray: '5,4',
            visualHaloWidth: 6.5,
          });
        });
      }
    });
  }

  const handleRoadTargetClick = (
    e: React.MouseEvent<SVGGElement>,
    fallbackTarget: RoadBuildTargetItem
  ) => {
    e.stopPropagation();
    if (!onSelectEdgeForRoad) return;

    const groupEl = targetGroupRef.current;
    const svgEl = groupEl?.ownerSVGElement;
    const ctm = groupEl?.getScreenCTM();

    if (svgEl && ctm && roadTargets.length > 1) {
      const pt = svgEl.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const local = pt.matrixTransform(ctm.inverse());

      let bestTarget = fallbackTarget;
      let bestScore = Infinity;

      for (const candidate of roadTargets) {
        const badgeDist = Math.hypot(
          local.x - candidate.badgePoint.x,
          local.y - candidate.badgePoint.y
        );
        const segDist = Math.min(
          distToSegment(local, candidate.hitStart, candidate.badgePoint),
          distToSegment(local, candidate.badgePoint, candidate.hitEnd)
        );
        // Slightly prioritize direct taps inside the badge center, otherwise closest hit line
        const score = badgeDist <= candidate.badgeRadius + 2 ? badgeDist * 0.75 : Math.min(badgeDist, segDist);
        if (score < bestScore) {
          bestScore = score;
          bestTarget = candidate;
        }
      }

      onSelectEdgeForRoad(bestTarget.hexA, bestTarget.hexB, bestTarget.options);
      return;
    }

    onSelectEdgeForRoad(fallbackTarget.hexA, fallbackTarget.hexB, fallbackTarget.options);
  };

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

      {/* Existing Hex Edge Improvements: Railroads, Dry Roads, Riverbank Roads & Bridges */}
      <g id="boardExistingEdgeImprovements" pointerEvents="none">
        {Object.values(gameState.edges).map(edge => {
          const isRoad = edge.improvement === 'road';
          const isBridge = edge.improvement === 'bridge';
          const isRailroad = Boolean(edge.isRailroad);
          const bankRoads = edge.riverBankRoads || [];

          if (!isRailroad && !isRoad && !isBridge && bankRoads.length === 0) {
            return null;
          }

          const [coordA, coordB] = [parseHexKey(edge.hexA), parseHexKey(edge.hexB)];
          const centerA = hexToPixel(coordA.q, coordA.r, hexRadius, orientation);
          const centerB = hexToPixel(coordB.q, coordB.r, hexRadius, orientation);
          const dryRoadGeom = isRoad && !edge.isRiver ? getDryRoadGeometry(gameState, edge, hexRadius) : null;
          const bridgeGeom = isBridge && edge.isRiver ? getRiverBridgeGeometry(gameState, edge, hexRadius) : null;

          return (
            <g key={edge.id}>
              {isRailroad && (
                <g className="filter drop-shadow-md">
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

              {/* Paved Dry-Border Land Road */}
              {isRoad && dryRoadGeom && (
                <g className="filter drop-shadow-md">
                  <path d={dryRoadGeom.pathD} fill="none" stroke="#1c1917" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={dryRoadGeom.pathD} fill="none" stroke="#d97706" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={dryRoadGeom.pathD} fill="none" stroke="#fef08a" strokeWidth="1.7" strokeDasharray="5,4" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx={dryRoadGeom.start.x} cy={dryRoadGeom.start.y} r="3.8" fill="#b45309" stroke="#1c1917" strokeWidth="1.4" />
                  <circle cx={dryRoadGeom.end.x} cy={dryRoadGeom.end.y} r="3.8" fill="#b45309" stroke="#1c1917" strokeWidth="1.4" />
                </g>
              )}

              {/* Paved Riverbank Roads */}
              {bankRoads.map((bankRoad, brIdx) => {
                const geom = getRiverBankRoadGeometry(gameState, edge, bankRoad, hexRadius, brIdx);
                return (
                  <g key={`bank_road_${edge.id}_${brIdx}`} className="filter drop-shadow-md">
                    <path d={geom.pathD} fill="none" stroke="#1c1917" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={geom.pathD} fill="none" stroke="#d97706" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={geom.pathD} fill="none" stroke="#fef08a" strokeWidth="1.5" strokeDasharray="4,3.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx={geom.start.x} cy={geom.start.y} r="3.3" fill="#b45309" stroke="#1c1917" strokeWidth="1.2" />
                    <circle cx={geom.end.x} cy={geom.end.y} r="3.3" fill="#b45309" stroke="#1c1917" strokeWidth="1.2" />
                  </g>
                );
              })}

              {/* River Bridge */}
              {isBridge && bridgeGeom && (() => {
                const { start, end, riverDir } = bridgeGeom;
                const capHalf = 6.2;
                return (
                  <g className="filter drop-shadow-lg">
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
                    <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#451a03" strokeWidth="11.5" strokeLinecap="butt" />
                    <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#fde68a" strokeWidth="7.5" strokeDasharray="3.2,2.2" strokeLinecap="butt" />
                    <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#78350f" strokeWidth="1.4" strokeLinecap="butt" />
                  </g>
                );
              })()}
            </g>
          );
        })}
      </g>

      {/* Road & Bridge Construction Targets: Pass 1 = dashed paths & trimmed hit strokes, Pass 2 = badges on top */}
      {roadTargets.length > 0 && (
        <g ref={targetGroupRef} id="roadBuildTargets">
          {/* Sub-pass 1: Dashed preview lines + trimmed butt-capped hit corridors */}
          {roadTargets.map(target => (
            <g
              key={`${target.key}_line`}
              className="cursor-pointer"
              pointerEvents="auto"
              opacity={target.hasMaterials ? 1 : 0.74}
              onClick={e => handleRoadTargetClick(e, target)}
            >
              <title>{target.title}</title>
              <path
                d={target.visualPathD}
                fill="none"
                stroke={target.hasMaterials ? '#fbbf24' : '#94a3b8'}
                strokeWidth={target.visualHaloWidth}
                strokeLinecap={target.kind === 'bridge' ? 'butt' : 'round'}
                strokeLinejoin="round"
                strokeOpacity={target.hasMaterials ? 0.45 : 0.25}
                className={target.hasMaterials ? 'animate-pulse' : undefined}
                pointerEvents="none"
              />
              <path
                d={target.visualPathD}
                fill="none"
                stroke={target.hasMaterials ? '#fef08a' : '#cbd5e1'}
                strokeWidth={target.visualStrokeWidth}
                strokeDasharray={target.visualDashArray}
                strokeLinecap={target.kind === 'bridge' ? 'butt' : 'round'}
                strokeLinejoin="round"
                pointerEvents="none"
              />
              {/* Trimmed non-overlapping hit corridor centered on the road target */}
              <path
                d={`M ${target.hitStart.x} ${target.hitStart.y} L ${target.badgePoint.x} ${target.badgePoint.y} L ${target.hitEnd.x} ${target.hitEnd.y}`}
                fill="none"
                stroke="transparent"
                strokeWidth={target.hitStrokeWidth}
                strokeLinecap="butt"
                strokeLinejoin="round"
                pointerEvents="stroke"
              />
            </g>
          ))}

          {/* Sub-pass 2: Target circular icon badges rendered strictly on top */}
          {roadTargets.map(target => (
            <g
              key={`${target.key}_badge`}
              transform={`translate(${target.badgePoint.x}, ${target.badgePoint.y})`}
              className="cursor-pointer"
              pointerEvents="auto"
              opacity={target.hasMaterials ? 1 : 0.78}
              onClick={e => handleRoadTargetClick(e, target)}
            >
              <title>{target.title}</title>
              <circle
                r={target.badgeRadius}
                fill={target.hasMaterials ? '#f59e0b' : '#334155'}
                stroke={target.hasMaterials ? '#ffffff' : '#94a3b8'}
                strokeWidth={target.kind === 'dryRoad' ? 2.3 : 2}
                className="shadow-xl"
              />
              <text
                textAnchor="middle"
                dy={target.kind === 'dryRoad' ? '4.2' : '3.6'}
                fontSize={target.kind === 'dryRoad' ? '11.5' : '9.5'}
                className="select-none pointer-events-none"
              >
                {target.icon}
              </text>
            </g>
          ))}
        </g>
      )}
    </>
  );
};
