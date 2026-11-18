/**
 * Hexagonal Terrain Tile Rendering Layer
 */

import React from 'react';
import { HexEdge, HexOrientation, HexTile, Player } from '../../game/types';
import { getHexCornerPoints, hexToPixel } from '../../game/hexMath';
import { getBestAccessibleSide, getBuildingSide, getHexSideVisualAnchor } from '../../game/engine';
import { TERRAIN_AERIAL_TEXTURES, TERRAIN_INFO } from '../../game/constants';

interface HexTileLayerProps {
  hexes: Record<string, HexTile>;
  edges: Record<string, HexEdge>;
  players: Player[];
  hexRadius: number;
  hexOrientation: HexOrientation;
  selectedHexId: string | null;
  selectedTransporterId: string | null;
  reachableHexIds: Set<string>;
  onSelectHex: (hexId: string | null) => void;
  onMoveTransporter: (transporterId: string, targetHexId: string, targetSide?: number) => void;
}

export const HexTileLayer: React.FC<HexTileLayerProps> = ({
  hexes,
  edges,
  players,
  hexRadius,
  hexOrientation,
  selectedHexId,
  selectedTransporterId,
  reachableHexIds,
  onSelectHex,
  onMoveTransporter,
}) => {
  const layoutState = { hexes, edges, hexOrientation };

  return (
    <>
      {Object.values(hexes).map(hex => {
        const center = hexToPixel(hex.q, hex.r, hexRadius, hexOrientation);
        const points = getHexCornerPoints(center.x, center.y, hexRadius, hexOrientation);
        const info = TERRAIN_INFO[hex.terrain] || TERRAIN_INFO.pasture;
        const isSelected = selectedHexId === hex.id;
        const isReachable = reachableHexIds.has(hex.id);
        const isHomeHex = players.some(p => p.homeHexId === hex.id);
        const homeSide = isHomeHex
          ? hex.building
            ? getBuildingSide(layoutState, hex)
            : getBestAccessibleSide(layoutState, hex.id)
          : 0;
        const homeAnchor = isHomeHex
          ? getHexSideVisualAnchor(layoutState, hex.id, homeSide, hexRadius)
          : { dx: 0, dy: 0, angle: 0 };

        return (
          <g
            key={hex.id}
            className="cursor-pointer transition-all duration-150"
            onClick={e => {
              e.stopPropagation();
              if (isReachable && selectedTransporterId) {
                onMoveTransporter(selectedTransporterId, hex.id);
              } else {
                onSelectHex(hex.id);
              }
            }}
          >
            <g clipPath={`url(#clip_${hex.id})`}>
              <image
                href={TERRAIN_AERIAL_TEXTURES[hex.terrain]}
                x={center.x - hexRadius * 1.16}
                y={center.y - hexRadius * 1.16}
                width={hexRadius * 2.32}
                height={hexRadius * 2.32}
                preserveAspectRatio="xMidYMid slice"
              />

              <polygon
                points={points}
                fill={info.tint}
                fillOpacity={info.tintOpacity}
              />

              {hex.terrain === 'water' && (
                <g pointerEvents="none" opacity="0.75">
                  <path
                    d={`M ${center.x - 30} ${center.y - 16} Q ${center.x - 15} ${center.y - 22} ${center.x} ${center.y - 16} T ${center.x + 30} ${center.y - 16}`}
                    fill="none"
                    stroke="#e0f2fe"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d={`M ${center.x - 26} ${center.y} Q ${center.x - 13} ${center.y - 6} ${center.x} ${center.y} T ${center.x + 26} ${center.y}`}
                    fill="none"
                    stroke="#7dd3fc"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d={`M ${center.x - 28} ${center.y + 16} Q ${center.x - 14} ${center.y + 10} ${center.x} ${center.y + 16} T ${center.x + 28} ${center.y + 16}`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </g>
              )}

              <polygon points={points} fill="url(#hexRadialVignette)" />
            </g>

            <polygon
              points={points}
              fill="none"
              stroke={isSelected ? '#38bdf8' : isReachable ? '#4ade80' : info.stroke}
              strokeWidth={isSelected ? 4.5 : isReachable ? 3.5 : 2.5}
              strokeDasharray={isReachable ? '4,2' : undefined}
              className="transition-colors hover:brightness-125"
              filter="url(#tileShadow)"
            />

            {isHomeHex && (
              <g
                pointerEvents="none"
                transform={`translate(${center.x + homeAnchor.dx * 0.9}, ${center.y + homeAnchor.dy * 0.9 - 18})`}
              >
                <circle r="11" fill="#020617" fillOpacity="0.8" stroke="#f59e0b" strokeWidth="1" />
                <text textAnchor="middle" dy="4.5" fontSize="13" className="fill-amber-200">
                  ⛺
                </text>
              </g>
            )}

            {isSelected && (
              <g pointerEvents="none" transform={`translate(${center.x}, ${center.y - hexRadius * 0.72})`}>
                <rect
                  x="-44"
                  y="-11"
                  width="88"
                  height="20"
                  rx="6"
                  fill="#020617"
                  fillOpacity="0.95"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                />
                <text
                  textAnchor="middle"
                  dy="3.5"
                  fontSize="9"
                  fill="#38bdf8"
                  className="font-bold tracking-wider uppercase font-mono"
                >
                  {info.name}
                </text>
              </g>
            )}

            {isReachable && (
              <g pointerEvents="none" transform={`translate(${center.x}, ${center.y})`}>
                <circle r="13" fill="#22c55e" fillOpacity="0.4" className="animate-ping" />
                <circle r="8.5" fill="#22c55e" fillOpacity="0.95" />
                <circle r="3.5" fill="#ffffff" />
              </g>
            )}
          </g>
        );
      })}
    </>
  );
};
