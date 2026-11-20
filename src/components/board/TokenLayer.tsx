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

  const buildingCentersByHex: Record<string, { x: number; y: number }> = {};
  const tokenPositionsByHex: Record<string, Array<{ x: number; y: number }>> = {};

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
        buildingCentersByHex[hex.id] = { x: bx, y: by };
        const w = layout.isSplit ? 32 : 38;
        const h = layout.isSplit ? 25 : 30;

        return (
          <g
            key={`bld_${hex.id}`}
            transform={`translate(${bx}, ${by})`}
            className="group cursor-pointer"
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
              className="shadow-2xl transition-[filter] duration-150 group-hover:brightness-125"
            />
            <text textAnchor="middle" dy="5" fontSize={layout.isSplit ? '13' : '15'} className="select-none pointer-events-none">
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

          const canMoveOntoEnemyToken = Boolean(
            !isOwnedByActive &&
              gameState.phase === 'MOVEMENT' &&
              buildMode !== 'road' &&
              selectedTransporter &&
              selectedTransporter.ownerId === activePlayerId &&
              reachableHexIds?.has(t.hexId) &&
              onMoveTransporter
          );

          return (
            <g
              key={t.id}
              transform={`translate(${tx}, ${ty})`}
              className="group cursor-pointer"
              onClick={e => {
                e.stopPropagation();
                if (canMoveOntoEnemyToken && selectedTransporter) {
                  onMoveTransporter?.(selectedTransporter.id, t.hexId);
                } else {
                  onSelectTransporter(t.id);
                  onSelectHex(t.hexId);
                }
              }}
            >
              {/* Subtle non-moving hover highlight ring */}
              <circle
                r="15.5"
                fill="none"
                stroke="#fde68a"
                strokeWidth="2"
                className="opacity-0 transition-opacity duration-150 group-hover:opacity-90 pointer-events-none"
              />

              {isSelected && (
                <circle
                  r="18"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeDasharray="5,2.5"
                  className="animate-spin pointer-events-none"
                />
              )}

              <circle
                r="12.5"
                fill={owner?.color || '#64748b'}
                stroke={isSelected ? '#ffffff' : '#020617'}
                strokeWidth="2.2"
                className="shadow-2xl transition-[filter] duration-150 group-hover:brightness-115"
              />

              <text
                textAnchor="middle"
                dy="4.2"
                fontSize="12"
                className="select-none pointer-events-none"
              >
                {spec?.icon || '🫏'}
              </text>

              {isOwnedByActive && t.movesLeft > 0 && (
                <circle
                  cx="9.5"
                  cy="-9.5"
                  r="5"
                  fill="#22c55e"
                  stroke="#020617"
                  strokeWidth="1.5"
                  className="pointer-events-none"
                />
              )}

              {isOwnedByActive && t.movesLeft <= 0 && gameState.phase === 'MOVEMENT' && (
                <g transform="translate(9.5, -9.5)" className="pointer-events-none">
                  <circle
                    r="5.2"
                    fill="#0f172a"
                    stroke="#ef4444"
                    strokeWidth="1.3"
                  />
                  <text
                    textAnchor="middle"
                    dy="2.7"
                    fontSize="7.2"
                    fill="#fca5a5"
                    className="font-mono-numbers font-extrabold"
                  >
                    0
                  </text>
                </g>
              )}

              {(carriedWeight > 0 || carriedGeese > 0) && (() => {
                const badgeLabel =
                  carriedGeese > 0 && carriedWeight > 0
                    ? `${carriedWeight}/${t.capacity}+🪿${carriedGeese}`
                    : carriedGeese > 0
                    ? `🪿${carriedGeese}`
                    : `${carriedWeight}/${t.capacity}`;
                const badgeWidth = carriedGeese > 0 && carriedWeight > 0 ? 38 : 24;
                return (
                  <g transform={`translate(${-badgeWidth / 2}, 9)`} className="pointer-events-none">
                    <rect
                      x="0"
                      y="0"
                      width={badgeWidth}
                      height="11.5"
                      rx="4"
                      fill="#020617"
                      stroke={carriedWeight > 0 ? '#f59e0b' : '#cbd5e1'}
                      strokeWidth="1.2"
                    />
                    <text
                      x={badgeWidth / 2}
                      y="8.2"
                      textAnchor="middle"
                      fontSize="7.8"
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

        const positionedTokens: Array<{ t: Transporter; tx: number; ty: number }> = [];

        Array.from(landBySide.entries()).forEach(([sideNum, group]) => {
          const anchor = getHexSideVisualAnchor(gameState, hexId, sideNum, hexRadius);
          const buildingOnThisSide =
            Boolean(hex.building) && getBuildingSide(gameState, hex) === sideNum;
          const total = group.length;

          if (!layout.isSplit) {
            // Unsplit tile: spread generously in 2D across the hex interior so tokens never cover each other
            const baseDx = anchor.dx * 0.32;
            const baseDy = anchor.dy * 0.32;
            const maxR = hexRadius * 0.6;

            group.forEach((t, idx) => {
              let ox = 0;
              let oy = 0;
              if (total === 1) {
                ox = 0;
                oy = buildingOnThisSide ? 11 : -2;
              } else if (total === 2) {
                ox = idx === 0 ? -19 : 19;
                oy = buildingOnThisSide ? 9 : -2;
              } else if (total === 3) {
                const angle = -Math.PI / 2 + (idx * Math.PI * 2) / 3;
                const r = 23;
                ox = Math.cos(angle) * r;
                oy = Math.sin(angle) * r;
              } else if (total === 4) {
                const gridOffsets = [
                  { x: -18, y: -16 },
                  { x: 18, y: -16 },
                  { x: -18, y: 16 },
                  { x: 18, y: 16 },
                ];
                ox = gridOffsets[idx].x;
                oy = gridOffsets[idx].y;
              } else if (total <= 6) {
                const angle = -Math.PI / 2 + (idx * Math.PI * 2) / total;
                const r = total === 5 ? 26 : 28;
                ox = Math.cos(angle) * r;
                oy = Math.sin(angle) * r;
              } else if (idx < 6) {
                const angle = -Math.PI / 2 + (idx * Math.PI * 2) / 6;
                ox = Math.cos(angle) * 31;
                oy = Math.sin(angle) * 31;
              } else {
                const innerTotal = total - 6;
                const innerIdx = idx - 6;
                if (innerTotal === 1) {
                  ox = 0;
                  oy = 0;
                } else {
                  const angle = (innerIdx * Math.PI * 2) / innerTotal;
                  ox = Math.cos(angle) * 12;
                  oy = Math.sin(angle) * 12;
                }
              }

              let dx = baseDx + ox;
              let dy = baseDy + oy;
              const dist = Math.hypot(dx, dy);
              if (dist > maxR) {
                dx = (dx / dist) * maxR;
                dy = (dy / dist) * maxR;
              }
              positionedTokens.push({ t, tx: center.x + dx, ty: center.y + dy });
            });
            return;
          }

          // Split river tile: distribute strictly inside this bank's angular sector without stacking
          const region = layout.sides[sideNum] || layout.sides[0];
          const edgeMargin = Math.min(0.3, region.span * 0.18);
          const minAng = region.startAngle + edgeMargin;
          const maxAng = region.startAngle + region.span - edgeMargin;
          const usableSpan = Math.max(0.18, maxAng - minAng);
          const centerAng = region.startAngle + region.span / 2;

          group.forEach((t, idx) => {
            if (total === 1) {
              const yNudge = buildingOnThisSide ? 6 : -1;
              positionedTokens.push({
                t,
                tx: center.x + anchor.dx,
                ty: center.y + anchor.dy + yNudge,
              });
              return;
            }

            const useTwoArcs = total >= 4 || (total === 3 && usableSpan < 1.15);
            if (!useTwoArcs) {
              const desiredSpan = Math.min(usableSpan, (total - 1) * 0.92);
              const step = total > 1 ? desiredSpan / (total - 1) : 0;
              const ang = centerAng - desiredSpan / 2 + idx * step;
              const r =
                usableSpan < 0.75
                  ? hexRadius * (idx % 2 === 0 ? 0.34 : 0.58)
                  : hexRadius * 0.52;
              positionedTokens.push({
                t,
                tx: center.x + Math.cos(ang) * r,
                ty: center.y + Math.sin(ang) * r,
              });
            } else {
              const outerCount = Math.ceil(total * 0.6);
              const isOuter = idx < outerCount;
              const rowCount = isOuter ? outerCount : total - outerCount;
              const rowIdx = isOuter ? idx : idx - outerCount;
              const r = isOuter ? hexRadius * 0.58 : hexRadius * 0.33;
              const maxStep = isOuter ? 0.72 : 0.95;
              const rowSpan =
                rowCount > 1 ? Math.min(usableSpan, (rowCount - 1) * maxStep) : 0;
              const ang =
                rowCount > 1
                  ? centerAng - rowSpan / 2 + (rowIdx * rowSpan) / (rowCount - 1)
                  : centerAng;
              positionedTokens.push({
                t,
                tx: center.x + Math.cos(ang) * r,
                ty: center.y + Math.sin(ang) * r,
              });
            }
          });
        });

        waterList.forEach((t, wIdx) => {
          const wOff = getWatercraftVisualOffset(
            gameState,
            t,
            hexRadius,
            wIdx,
            waterList.length
          );
          positionedTokens.push({ t, tx: center.x + wOff.dx, ty: center.y + wOff.dy });
        });

        // Render the selected transporter last so its selection ring & badge sit on top
        positionedTokens.sort((a, b) => {
          const aSel = a.t.id === selectedTransporterId ? 1 : 0;
          const bSel = b.t.id === selectedTransporterId ? 1 : 0;
          return aSel - bSel;
        });

        tokenPositionsByHex[hexId] = positionedTokens.map(p => ({ x: p.tx, y: p.ty }));

        return (
          <g key={`transporters_${hexId}`}>
            {positionedTokens.map(({ t, tx, ty }) => renderTransporterToken(t, tx, ty))}
          </g>
        );
      })}

      {/* Unobstructed Clickable Move Destination Indicators (rendered cleanly above buildings & units) */}
      {gameState.phase === 'MOVEMENT' &&
        buildMode !== 'road' &&
        selectedTransporter &&
        selectedTransporter.ownerId === activePlayerId &&
        reachableHexIds &&
        reachableHexIds.size > 0 &&
        onMoveTransporter && (
          <g id="reachableMoveTargets">
            {Array.from(reachableHexIds).map(targetHexId => {
              const hex = gameState.hexes[targetHexId];
              if (!hex) return null;
              const center = hexToPixel(hex.q, hex.r, hexRadius, orientation);
              const occupied: Array<{ x: number; y: number }> = [];
              if (buildingCentersByHex[targetHexId]) {
                occupied.push(buildingCentersByHex[targetHexId]);
              }
              if (tokenPositionsByHex[targetHexId]) {
                occupied.push(...tokenPositionsByHex[targetHexId]);
              }

              const candidates = [
                { dx: 0, dy: 0 },
                { dx: 0, dy: -24 },
                { dx: 0, dy: 24 },
                { dx: -22, dy: 0 },
                { dx: 22, dy: 0 },
                { dx: -18, dy: -18 },
                { dx: 18, dy: -18 },
                { dx: -18, dy: 18 },
                { dx: 18, dy: 18 },
              ];

              let bestSpot = center;
              if (occupied.length > 0) {
                const centerMinDist = Math.min(
                  ...occupied.map(o => Math.hypot(center.x - o.x, center.y - o.y))
                );
                if (centerMinDist < 19) {
                  let bestScore = -1;
                  for (const cand of candidates) {
                    const px = center.x + cand.dx;
                    const py = center.y + cand.dy;
                    const minDist = Math.min(...occupied.map(o => Math.hypot(px - o.x, py - o.y)));
                    if (minDist > bestScore) {
                      bestScore = minDist;
                      bestSpot = { x: px, y: py };
                    }
                  }
                }
              }

              return (
                <g
                  key={`move_dot_${targetHexId}`}
                  transform={`translate(${bestSpot.x}, ${bestSpot.y})`}
                  className="cursor-pointer"
                  pointerEvents="auto"
                  onClick={e => {
                    e.stopPropagation();
                    onMoveTransporter(selectedTransporter.id, targetHexId);
                  }}
                >
                  <title>Move selected unit here</title>
                  <circle r="13" fill="transparent" />
                  <circle
                    r="11.5"
                    fill="#22c55e"
                    fillOpacity="0.38"
                    className="animate-ping pointer-events-none"
                  />
                  <circle
                    r="8"
                    fill="#22c55e"
                    fillOpacity="0.96"
                    stroke="#020617"
                    strokeWidth="1.4"
                    className="pointer-events-none"
                  />
                  <circle r="3.2" fill="#ffffff" className="pointer-events-none" />
                </g>
              );
            })}
          </g>
        )}
    </g>
  );
};
