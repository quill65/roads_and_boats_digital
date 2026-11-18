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
  getBuilderAccessibleSides,
  getNeighborSideOnHex,
  getTransporterSide,
} from '../../game/engine';

export interface TileRiverPathData {
  paths: string[];
  center: { x: number; y: number };
  isSource: boolean;
  isConfluence: boolean;
  midpoints: { x: number; y: number }[];
}

interface EdgeAndRailLayerProps {
  gameState: GameState;
  activePlayerId: string;
  tileRiverPaths: Record<string, TileRiverPathData>;
  hexRadius: number;
  selectedTransporterId: string | null;
  selectedHexId: string | null;
  buildMode: 'none' | 'road' | 'factory' | 'wonder';
  onSelectEdgeForRoad?: (hexA: string, hexB: string) => void;
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

      {/* Hex Edges: Railroads, Roads, Bridges & Road Construction Targets */}
      {Object.values(gameState.edges).map(edge => {
        const [coordA, coordB] = [parseHexKey(edge.hexA), parseHexKey(edge.hexB)];
        const seg = getSharedEdgeSegment(coordA.q, coordA.r, coordB.q, coordB.r, hexRadius, orientation);
        const centerA = hexToPixel(coordA.q, coordA.r, hexRadius, orientation);
        const centerB = hexToPixel(coordB.q, coordB.r, hexRadius, orientation);
        const midPoint = {
          x: (centerA.x + centerB.x) / 2,
          y: (centerA.y + centerB.y) / 2,
        };

        const isRoad = edge.improvement === 'road';
        const isBridge = edge.improvement === 'bridge';
        const isRailroad = Boolean(edge.isRailroad);
        const isCoastalOrSeaEdge =
          gameState.hexes[edge.hexA]?.terrain === 'water' ||
          gameState.hexes[edge.hexB]?.terrain === 'water';

        let isLegalSideForBuilder = false;
        let roadCheck: ReturnType<typeof canBuildRoad> | null = null;

        if (
          buildMode === 'road' &&
          builder &&
          !isRoad &&
          !isBridge &&
          !isRailroad &&
          !isCoastalOrSeaEdge &&
          (builder.hexId === edge.hexA || builder.hexId === edge.hexB)
        ) {
          const builderSide = getTransporterSide(gameState, builder);
          const bSpec = TRANSPORTER_SPECS[builder.type];
          if (edge.isRiver) {
            isLegalSideForBuilder =
              Boolean(bSpec.waterOnly && builder.waterLocation === 'river') ||
              doesSideFlankRiverEdge(gameState, builder.hexId, builderSide, edge.id);
          } else {
            const otherHexId = builder.hexId === edge.hexA ? edge.hexB : edge.hexA;
            const neededSide = getNeighborSideOnHex(gameState, builder.hexId, otherHexId);
            isLegalSideForBuilder =
              neededSide === null ||
              getBuilderAccessibleSides(gameState, builder.hexId, builder).has(neededSide);
          }

          if (isLegalSideForBuilder) {
            roadCheck = canBuildRoad(
              gameState,
              activePlayerId,
              edge.hexA,
              edge.hexB,
              edge.isRiver ? 'boards' : 'stone',
              builder.id
            );
          }
        }

        const canBuildHere = isLegalSideForBuilder;
        const hasMaterials = Boolean(roadCheck?.valid);

        return (
          <g
            key={edge.id}
            pointerEvents={canBuildHere ? 'auto' : 'none'}
            className={canBuildHere ? 'cursor-pointer' : ''}
            onClick={e => {
              if (canBuildHere && onSelectEdgeForRoad) {
                e.stopPropagation();
                onSelectEdgeForRoad(edge.hexA, edge.hexB);
              }
            }}
          >
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

            {isRoad && (
              <g className="filter drop-shadow-md">
                <line x1={centerA.x} y1={centerA.y} x2={centerB.x} y2={centerB.y} stroke="#1c1917" strokeWidth="9" strokeLinecap="round" />
                <line x1={centerA.x} y1={centerA.y} x2={centerB.x} y2={centerB.y} stroke="#d97706" strokeWidth="5.5" strokeLinecap="round" />
                <line x1={centerA.x} y1={centerA.y} x2={centerB.x} y2={centerB.y} stroke="#fef08a" strokeWidth="1.8" strokeDasharray="5,4" strokeLinecap="round" />
                <circle cx={centerA.x} cy={centerA.y} r="4" fill="#b45309" stroke="#1c1917" strokeWidth="1.5" />
                <circle cx={centerB.x} cy={centerB.y} r="4" fill="#b45309" stroke="#1c1917" strokeWidth="1.5" />
              </g>
            )}

            {isBridge && (
              <g className="filter drop-shadow-lg">
                <line
                  x1={midPoint.x - (seg.p2.x - seg.p1.x) * 0.25}
                  y1={midPoint.y - (seg.p2.y - seg.p1.y) * 0.25}
                  x2={midPoint.x + (seg.p2.x - seg.p1.x) * 0.25}
                  y2={midPoint.y + (seg.p2.y - seg.p1.y) * 0.25}
                  stroke="#292524"
                  strokeWidth="6"
                  strokeLinecap="square"
                />
                <line x1={centerA.x} y1={centerA.y} x2={centerB.x} y2={centerB.y} stroke="#451a03" strokeWidth="11" strokeLinecap="square" />
                <line x1={centerA.x} y1={centerA.y} x2={centerB.x} y2={centerB.y} stroke="#fde68a" strokeWidth="7" strokeDasharray="3.5,3" strokeLinecap="square" />
                <line x1={centerA.x} y1={centerA.y} x2={centerB.x} y2={centerB.y} stroke="#78350f" strokeWidth="1.5" />
                <circle cx={centerA.x} cy={centerA.y} r="4.5" fill="#451a03" stroke="#fde68a" strokeWidth="1" />
                <circle cx={centerB.x} cy={centerB.y} r="4.5" fill="#451a03" stroke="#fde68a" strokeWidth="1" />
              </g>
            )}

            {canBuildHere && (
              <g className="cursor-pointer" opacity={hasMaterials ? 1 : 0.72}>
                <title>
                  {hasMaterials
                    ? edge.isRiver
                      ? 'Click to build Bridge (2 Boards)'
                      : 'Click to pave Road (1 Stone)'
                    : roadCheck?.reason || 'Insufficient materials on this side'}
                </title>
                <line x1={centerA.x} y1={centerA.y} x2={centerB.x} y2={centerB.y} stroke="transparent" strokeWidth="36" strokeLinecap="round" pointerEvents="stroke" />
                <line x1={seg.p1.x} y1={seg.p1.y} x2={seg.p2.x} y2={seg.p2.y} stroke="transparent" strokeWidth="32" strokeLinecap="round" pointerEvents="stroke" />
                <line
                  x1={centerA.x}
                  y1={centerA.y}
                  x2={centerB.x}
                  y2={centerB.y}
                  stroke={hasMaterials ? '#fbbf24' : '#94a3b8'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeOpacity={hasMaterials ? 0.45 : 0.25}
                  className={hasMaterials ? 'animate-pulse' : undefined}
                />
                <line
                  x1={centerA.x}
                  y1={centerA.y}
                  x2={centerB.x}
                  y2={centerB.y}
                  stroke={hasMaterials ? '#fef08a' : '#cbd5e1'}
                  strokeWidth="3.5"
                  strokeDasharray="6,4"
                  strokeLinecap="round"
                />
                <g transform={`translate(${midPoint.x}, ${midPoint.y})`}>
                  <circle
                    r="15"
                    fill={hasMaterials ? '#f59e0b' : '#334155'}
                    stroke={hasMaterials ? '#ffffff' : '#94a3b8'}
                    strokeWidth="2.5"
                    className="shadow-xl"
                  />
                  <text textAnchor="middle" dy="4.5" fontSize="12" className="select-none pointer-events-none">
                    {edge.isRiver ? '🌉' : '🛣️'}
                  </text>
                </g>
              </g>
            )}
          </g>
        );
      })}
    </>
  );
};
