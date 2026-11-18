/**
 * Interactive SVG Hexagonal Board View for Roads & Boats
 * Orchestrates viewport pan/zoom, tile rendering, rivers/railroads/roads, and pieces.
 */

import React, { useMemo, useRef } from 'react';
import { GameState, Transporter } from '../game/types';
import {
  getHexCornerPoints,
  getSharedEdgeSegment,
  hexToPixel,
  parseHexKey,
} from '../game/hexMath';
import { canMoveTransporter } from '../game/engine';
import { useBoardViewport } from './board/useBoardViewport';
import { HexTileLayer } from './board/HexTileLayer';
import { EdgeAndRailLayer, TileRiverPathData } from './board/EdgeAndRailLayer';
import { TokenLayer } from './board/TokenLayer';

interface HexBoardProps {
  gameState: GameState;
  activePlayerId: string;
  selectedTransporterId: string | null;
  selectedHexId: string | null;
  buildMode: 'none' | 'road' | 'factory' | 'wonder';
  onSelectTransporter: (transporterId: string | null) => void;
  onSelectHex: (hexId: string | null) => void;
  onMoveTransporter: (transporterId: string, targetHexId: string, targetSide?: number) => void;
  onSelectEdgeForRoad?: (hexA: string, hexB: string) => void;
}

const HEX_RADIUS = 60;

export const HexBoard: React.FC<HexBoardProps> = ({
  gameState,
  activePlayerId,
  selectedTransporterId,
  selectedHexId,
  buildMode,
  onSelectTransporter,
  onSelectHex,
  onMoveTransporter,
  onSelectEdgeForRoad,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const orientation = gameState.hexOrientation || 'pointy';

  const {
    viewTransform,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useBoardViewport(containerRef, gameState.id, gameState.hexes, HEX_RADIUS, orientation);

  const selectedTransporter = selectedTransporterId
    ? gameState.transporters[selectedTransporterId]
    : null;

  const reachableHexIds = useMemo(() => {
    if (
      !selectedTransporter ||
      selectedTransporter.ownerId !== activePlayerId ||
      gameState.phase !== 'MOVEMENT'
    ) {
      return new Set<string>();
    }
    const valid = new Set<string>();
    Object.values(gameState.hexes).forEach(hex => {
      if (canMoveTransporter(gameState, selectedTransporter.id, hex.id, activePlayerId).valid) {
        valid.add(hex.id);
      }
    });
    return valid;
  }, [gameState, selectedTransporter, activePlayerId]);

  const transportersByHex = useMemo(() => {
    const map: Record<string, Transporter[]> = {};
    Object.values(gameState.transporters).forEach(t => {
      if (!map[t.hexId]) map[t.hexId] = [];
      map[t.hexId].push(t);
    });
    return map;
  }, [gameState.transporters]);

  const tileRiverPaths = useMemo(() => {
    const incident: Record<string, typeof gameState.edges[string][]> = {};
    Object.values(gameState.edges).forEach(edge => {
      if (edge.isRiver) {
        if (!incident[edge.hexA]) incident[edge.hexA] = [];
        incident[edge.hexA].push(edge);
        if (!incident[edge.hexB]) incident[edge.hexB] = [];
        incident[edge.hexB].push(edge);
      }
    });

    const pathsMap: Record<string, TileRiverPathData> = {};
    Object.values(gameState.hexes).forEach(hex => {
      const inc = incident[hex.id];
      if (!inc || inc.length === 0) return;

      const center = hexToPixel(hex.q, hex.r, HEX_RADIUS, orientation);
      const midpoints = inc.map(re => {
        const otherKey = re.hexA === hex.id ? re.hexB : re.hexA;
        const oCoord = parseHexKey(otherKey);
        const seg = getSharedEdgeSegment(hex.q, hex.r, oCoord.q, oCoord.r, HEX_RADIUS, orientation);
        return { x: seg.midX, y: seg.midY };
      });

      const paths: string[] = [];
      let isSource = false;
      let isConfluence = false;

      if (midpoints.length === 1) {
        isSource = true;
        paths.push(`M ${center.x} ${center.y} L ${midpoints[0].x} ${midpoints[0].y}`);
      } else if (midpoints.length === 2) {
        paths.push(
          `M ${midpoints[0].x} ${midpoints[0].y} Q ${center.x} ${center.y} ${midpoints[1].x} ${midpoints[1].y}`
        );
      } else {
        isConfluence = true;
        midpoints.forEach(m => {
          paths.push(`M ${m.x} ${m.y} L ${center.x} ${center.y}`);
        });
      }

      pathsMap[hex.id] = { paths, center, isSource, isConfluence, midpoints };
    });

    return pathsMap;
  }, [gameState.hexes, gameState.edges, orientation]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-slate-950 select-none cursor-grab active:cursor-grabbing touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <svg className="w-full h-full">
        <defs>
          {Object.values(gameState.hexes).map(hex => {
            const center = hexToPixel(hex.q, hex.r, HEX_RADIUS, orientation);
            const points = getHexCornerPoints(center.x, center.y, HEX_RADIUS, orientation);
            return (
              <clipPath key={`clip_${hex.id}`} id={`clip_${hex.id}`}>
                <polygon points={points} />
              </clipPath>
            );
          })}

          <radialGradient id="hexRadialVignette" cx="50%" cy="50%" r="72%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
            <stop offset="65%" stopColor="#000000" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
          </radialGradient>

          <filter id="tileShadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.6" />
          </filter>
        </defs>

        <g transform={`translate(${viewTransform.x}, ${viewTransform.y}) scale(${viewTransform.scale})`}>
          <HexTileLayer
            hexes={gameState.hexes}
            edges={gameState.edges}
            players={gameState.players}
            hexRadius={HEX_RADIUS}
            hexOrientation={orientation}
            selectedHexId={selectedHexId}
            selectedTransporterId={selectedTransporterId}
            reachableHexIds={reachableHexIds}
            onSelectHex={onSelectHex}
            onMoveTransporter={onMoveTransporter}
          />

          <EdgeAndRailLayer
            gameState={gameState}
            activePlayerId={activePlayerId}
            tileRiverPaths={tileRiverPaths}
            hexRadius={HEX_RADIUS}
            selectedTransporterId={selectedTransporterId}
            selectedHexId={selectedHexId}
            buildMode={buildMode}
            onSelectEdgeForRoad={onSelectEdgeForRoad}
          />

          <TokenLayer
            gameState={gameState}
            transportersByHex={transportersByHex}
            hexRadius={HEX_RADIUS}
            activePlayerId={activePlayerId}
            selectedTransporterId={selectedTransporterId}
            reachableHexIds={reachableHexIds}
            buildMode={buildMode}
            onSelectHex={onSelectHex}
            onSelectTransporter={onSelectTransporter}
            onMoveTransporter={onMoveTransporter}
          />
        </g>
      </svg>

      {buildMode === 'road' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 max-w-[calc(100vw-1.5rem)] w-max sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900/95 border border-amber-400/80 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 sm:gap-3">
          <span className="text-xl sm:text-2xl animate-pulse shrink-0">🛣️</span>
          <div className="text-xs min-w-0">
            <p className="font-bold text-amber-300">Road & Bridge Building Mode</p>
            <p className="text-slate-300 leading-snug">Tap any glowing border: 🛣️ Road (1 Stone) or 🌉 Bridge (2 Boards)</p>
          </div>
        </div>
      )}
    </div>
  );
};
