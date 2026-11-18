/**
 * Buildings, Ground Goods & Transporter Tokens Layer
 */

import React from 'react';
import { GameState, GoodType, Transporter } from '../../game/types';
import { hexToPixel } from '../../game/hexMath';
import { BUILDING_SPECS, GOOD_DETAILS, TRANSPORTER_SPECS } from '../../game/constants';
import {
  areSidesConnectedByBridgeOnHex,
  getBuildingSide,
  getGoodsOnSide,
  getHexSideLayout,
  getHexSideVisualAnchor,
  getTransporterCargoWeight,
  getTransporterSide,
  getWatercraftVisualOffset,
} from '../../game/engine';

interface TokenLayerProps {
  gameState: GameState;
  transportersByHex: Record<string, Transporter[]>;
  hexRadius: number;
  activePlayerId: string;
  selectedTransporterId: string | null;
  reachableHexIds?: Set<string>;
  buildMode?: 'none' | 'road' | 'factory' | 'wonder';
  onSelectHex: (hexId: string | null) => void;
  onSelectTransporter: (transporterId: string | null) => void;
  onMoveTransporter?: (transporterId: string, targetHexId: string, targetSide?: number) => void;
}

export const TokenLayer: React.FC<TokenLayerProps> = ({
  gameState,
  transportersByHex,
  hexRadius,
  activePlayerId,
  selectedTransporterId,
  reachableHexIds,
  buildMode = 'none',
  onSelectHex,
  onSelectTransporter,
  onMoveTransporter,
}) => {
  const orientation = gameState.hexOrientation || 'pointy';
  const selectedTransporter = selectedTransporterId
    ? gameState.transporters[selectedTransporterId]
    : undefined;

  return (
    <g pointerEvents={buildMode === 'road' ? 'none' : undefined}>
      {/* Buildings & Workshops (anchored on their legal bank side) */}
      {Object.values(gameState.hexes).map(hex => {
        if (!hex.building) return null;
        const center = hexToPixel(hex.q, hex.r, hexRadius, orientation);
        const layout = getHexSideLayout(gameState, hex.id);
        const bSide = getBuildingSide(gameState, hex);
        const anchor = getHexSideVisualAnchor(gameState, hex.id, bSide, hexRadius);
        const spec = BUILDING_SPECS[hex.building.type];
        const owner = gameState.players.find(p => p.id === hex.building?.ownerId);
        const bx = center.x + anchor.dx;
        const by = center.y + anchor.dy - 9;
        const w = layout.isSplit ? 32 : 38;
        const h = layout.isSplit ? 25 : 30;

        return (
          <g
            key={`bld_${hex.id}`}
            transform={`translate(${bx}, ${by})`}
            className="cursor-pointer transition-transform hover:scale-115"
            onClick={e => {
              e.stopPropagation();
              if (
                selectedTransporterId &&
                reachableHexIds?.has(hex.id) &&
                onMoveTransporter
              ) {
                onMoveTransporter(selectedTransporterId, hex.id);
              } else {
                onSelectHex(hex.id);
              }
            }}
          >
            <rect
              x={-w / 2}
              y={-h / 2}
              width={w}
              height={h}
              rx="7"
              fill="#020617"
              stroke={owner?.color || '#cbd5e1'}
              strokeWidth="2.5"
              className="shadow-2xl"
            />
            <text textAnchor="middle" dy="5" fontSize={layout.isSplit ? '13' : '15'}>
              {spec?.icon || '🏠'}
            </text>
          </g>
        );
      })}

      {/* Neutral Goods Stacks on Ground (per riverbank side on split tiles) */}
      {Object.values(gameState.hexes).map(hex => {
        const layout = getHexSideLayout(gameState, hex.id);
        const center = hexToPixel(hex.q, hex.r, hexRadius, orientation);

        return layout.sides.map(region => {
          const sideGoods = getGoodsOnSide(gameState, hex.id, region.side);
          const goodEntries = Object.entries(sideGoods).filter(([_, qty]) => (qty || 0) > 0);
          if (goodEntries.length === 0) return null;

          const anchor = getHexSideVisualAnchor(gameState, hex.id, region.side, hexRadius);
          const gx = center.x + anchor.dx;
          const gy = center.y + anchor.dy + (layout.isSplit ? 14 : 17);
          const scale = layout.isSplit && goodEntries.length > 2 ? 0.85 : 1;

          return (
            <g
              key={`goods_${hex.id}_s${region.side}`}
              transform={`translate(${gx}, ${gy}) scale(${scale})`}
              className="pointer-events-none"
            >
              <rect
                x={-(goodEntries.length * 11.5)}
                y="-9.5"
                width={goodEntries.length * 23}
                height="19"
                rx="5"
                fill="#020617"
                fillOpacity="0.92"
                stroke="#475569"
                strokeWidth="1.2"
              />
              {goodEntries.map(([gName, qty], gIdx) => {
                const xOffset = -(goodEntries.length * 11.5) + gIdx * 23 + 11.5;
                const item = GOOD_DETAILS[gName as GoodType];
                return (
                  <text
                    key={gName}
                    x={xOffset}
                    y="4"
                    textAnchor="middle"
                    fontSize="10"
                    fill="#ffffff"
                    className="font-mono-numbers font-bold"
                  >
                    {item ? `${item.icon}${qty}` : `${gName}:${qty}`}
                  </text>
                );
              })}
            </g>
          );
        });
      })}

      {/* Clickable Internal Bridge Crossing Target (when selected land transporter can cross bridge inside current hex) */}
      {gameState.phase === 'MOVEMENT' &&
        buildMode !== 'road' &&
        selectedTransporter &&
        selectedTransporter.ownerId === activePlayerId &&
        selectedTransporter.movesLeft > 0 &&
        !TRANSPORTER_SPECS[selectedTransporter.type].waterOnly &&
        (() => {
          const hex = gameState.hexes[selectedTransporter.hexId];
          if (!hex) return null;
          const layout = getHexSideLayout(gameState, hex.id);
          if (!layout.isSplit) return null;
          const tSide = getTransporterSide(gameState, selectedTransporter);
          const center = hexToPixel(hex.q, hex.r, hexRadius, orientation);

          return layout.sides
            .filter(
              r =>
                r.side !== tSide &&
                areSidesConnectedByBridgeOnHex(gameState, hex.id, tSide, r.side)
            )
            .map(region => {
              const targetAnchor = getHexSideVisualAnchor(gameState, hex.id, region.side, hexRadius);
              return (
                <g
                  key={`cross_bridge_${hex.id}_${region.side}`}
                  transform={`translate(${center.x + targetAnchor.dx}, ${center.y + targetAnchor.dy})`}
                  className="cursor-pointer"
                  onClick={e => {
                    e.stopPropagation();
                    onMoveTransporter?.(selectedTransporter.id, hex.id, region.side);
                  }}
                >
                  <title>Cross Bridge to {region.compassLabel}</title>
                  <circle r="13" fill="#22c55e" fillOpacity="0.4" className="animate-ping" />
                  <circle r="9" fill="#22c55e" fillOpacity="0.95" stroke="#ffffff" strokeWidth="1.5" />
                  <text textAnchor="middle" dy="3.5" fontSize="9.5" className="select-none pointer-events-none">
                    🌉
                  </text>
                </g>
              );
            });
        })()}

      {/* Transporters (Donkeys, Wagons, Boats — offset per legal bank or water channel) */}
      {Object.entries(transportersByHex).map(([hexId, transList]) => {
        const hex = gameState.hexes[hexId];
        if (!hex) return null;
        const center = hexToPixel(hex.q, hex.r, hexRadius, orientation);
        const layout = getHexSideLayout(gameState, hexId);

        const waterList = transList.filter(t => TRANSPORTER_SPECS[t.type].waterOnly);
        const landBySide = new Map<number, Transporter[]>();
        transList
          .filter(t => !TRANSPORTER_SPECS[t.type].waterOnly)
          .forEach(t => {
            const s = getTransporterSide(gameState, t);
            if (!landBySide.has(s)) landBySide.set(s, []);
            landBySide.get(s)!.push(t);
          });

        const renderTransporterToken = (t: Transporter, tx: number, ty: number) => {
          const spec = TRANSPORTER_SPECS[t.type];
          const isSelected = selectedTransporterId === t.id;
          const isOwnedByActive = t.ownerId === activePlayerId;
          const owner = gameState.players.find(p => p.id === t.ownerId);
          const carriedWeight = getTransporterCargoWeight(t);
          const carriedGeese = t.cargo.goose || 0;

          return (
            <g
              key={t.id}
              transform={`translate(${tx}, ${ty})`}
              className="cursor-pointer transition-transform hover:scale-125"
              onClick={e => {
                e.stopPropagation();
                onSelectTransporter(t.id);
                onSelectHex(t.hexId);
              }}
            >
              {isSelected && (
                <circle
                  r="20"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3.2"
                  strokeDasharray="5,2.5"
                  className="animate-spin"
                />
              )}

              <circle
                r="13.5"
                fill={owner?.color || '#64748b'}
                stroke={isSelected ? '#ffffff' : '#020617'}
                strokeWidth="2.2"
                className="shadow-2xl"
              />

              <text
                textAnchor="middle"
                dy="4.5"
                fontSize="12.5"
                className="select-none pointer-events-none"
              >
                {spec?.icon || '🫏'}
              </text>

              {isOwnedByActive && t.movesLeft > 0 && (
                <circle
                  cx="10"
                  cy="-10"
                  r="5.5"
                  fill="#22c55e"
                  stroke="#020617"
                  strokeWidth="1.5"
                />
              )}

              {(carriedWeight > 0 || carriedGeese > 0) && (() => {
                const badgeLabel =
                  carriedGeese > 0 && carriedWeight > 0
                    ? `${carriedWeight}/${t.capacity}+🪿${carriedGeese}`
                    : carriedGeese > 0
                    ? `🪿${carriedGeese}`
                    : `${carriedWeight}/${t.capacity}`;
                const badgeWidth = carriedGeese > 0 && carriedWeight > 0 ? 40 : 25;
                return (
                  <g transform={`translate(${-badgeWidth / 2}, 9.5)`}>
                    <rect
                      x="0"
                      y="0"
                      width={badgeWidth}
                      height="12"
                      rx="4"
                      fill="#020617"
                      stroke={carriedWeight > 0 ? '#f59e0b' : '#cbd5e1'}
                      strokeWidth="1.2"
                    />
                    <text
                      x={badgeWidth / 2}
                      y="8.5"
                      textAnchor="middle"
                      fontSize="8"
                      fill={carriedWeight > 0 ? '#fbbf24' : '#f8fafc'}
                      className="font-mono-numbers font-bold"
                    >
                      {badgeLabel}
                    </text>
                  </g>
                );
              })()}
            </g>
          );
        };

        return (
          <g key={`transporters_${hexId}`}>
            {Array.from(landBySide.entries()).flatMap(([sideNum, group]) => {
              const anchor = getHexSideVisualAnchor(gameState, hexId, sideNum, hexRadius);
              const isCenteredInterior = !layout.isSplit && anchor.dx === 0 && anchor.dy === 0;
              const perpX = -Math.sin(anchor.angle);
              const perpY = Math.cos(anchor.angle);
              const buildingOnThisSide =
                Boolean(hex.building) && getBuildingSide(gameState, hex) === sideNum;

              return group.map((t, idx) => {
                if (isCenteredInterior) {
                  const total = group.length;
                  const angle = (idx / total) * Math.PI * 2;
                  const r = total > 1 ? 19 : 0;
                  return renderTransporterToken(
                    t,
                    center.x + r * Math.cos(angle),
                    center.y + r * Math.sin(angle) - 4
                  );
                }
                const spacing = layout.isSplit
                  ? Math.min(15, 22 / Math.max(1, group.length - 1))
                  : 19;
                const tangentOffset = (idx - (group.length - 1) / 2) * spacing;
                const yNudge = buildingOnThisSide ? 3 : -1;
                const tx = center.x + anchor.dx + perpX * tangentOffset;
                const ty = center.y + anchor.dy + yNudge + perpY * tangentOffset;
                return renderTransporterToken(t, tx, ty);
              });
            })}

            {waterList.map((t, wIdx) => {
              const wOff = getWatercraftVisualOffset(
                gameState,
                t,
                hexRadius,
                wIdx,
                waterList.length
              );
              return renderTransporterToken(t, center.x + wOff.dx, center.y + wOff.dy);
            })}
          </g>
        );
      })}
    </g>
  );
};
