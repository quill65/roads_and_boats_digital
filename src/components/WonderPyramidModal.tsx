/**
 * Monumental Wonder of the World Stepped Pyramid Modal
 */

import React from 'react';
import { GameState } from '../game/types';
import { canBuildWonder } from '../game/engine';

interface WonderPyramidModalProps {
  gameState: GameState;
  activePlayerId: string;
  onClose: () => void;
  onContributeWonder: (transporterId: string, amount: number) => void;
}

export const WonderPyramidModal: React.FC<WonderPyramidModalProps> = ({
  gameState,
  activePlayerId,
  onClose,
  onContributeWonder,
}) => {
  const activePlayer = gameState.players.find(p => p.id === activePlayerId);
  const homeHexId = activePlayer?.homeHexId;
  const homeHex = homeHexId ? gameState.hexes[homeHexId] : undefined;

  const homeTransporters = Object.values(gameState.transporters).filter(
    t => t.ownerId === activePlayerId && Boolean(homeHexId) && t.hexId === homeHexId
  );

  const groundCount = homeHex
    ? Object.values(homeHex.goods).reduce((s, q) => s + (q || 0), 0)
    : 0;
  const carriedCount = homeTransporters.reduce(
    (s, t) => s + Object.values(t.cargo).reduce((cs, q) => cs + (q || 0), 0),
    0
  );
  const totalHomeGoods = groundCount + carriedCount;

  const primaryAnchorId = homeTransporters[0]?.id || 'GROUND';
  const check = canBuildWonder(gameState, activePlayerId, primaryAnchorId, 1);
  const nextBrickCost = check.goodsCost ?? 1;
  const totalWonderBricks = gameState.wonder.reduce((s, t) => s + t.bricks.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="relative px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border-b border-amber-900/40 shrink-0">
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <span className="text-2xl sm:text-3xl shrink-0">🏛️</span>
              <div className="min-w-0">
                <h3 className="text-base sm:text-xl font-bold font-serif-title text-amber-200 truncate">
                  The Wonder of the World
                </h3>
                <p className="text-xs text-amber-300/70 truncate">
                  10 VP per Row (split by bricks) · {totalWonderBricks} / 64 Bricks · Phase: {gameState.phase}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close Wonder"
              className="w-9 h-9 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Pyramid Tier Visualization */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-slate-950 flex flex-col items-center gap-4">
          <div className="w-full max-w-xl px-3 py-2 rounded-xl bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-200/90 text-center">
            Each of the 13 Wonder rows awards <strong>10 VP</strong> divided proportionally among player bricks in that row. Cost starts at 1 good per brick (+1 per extra brick in the same round, and +1 base after brick #17). Desert irrigates at brick #45!
          </div>

          <div className="w-full max-w-xl flex flex-col gap-2.5">
            {/* Reverse so Tier 3 (Apex) is at the top */}
            {[...gameState.wonder].reverse().map(tier => {
              return (
                <div key={tier.tierIndex} className="flex flex-col items-center gap-1">
                  <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs text-amber-300/80 font-medium">
                    <span>{tier.name}</span>
                    <span>·</span>
                    <span className="text-amber-400 font-bold">10 VP / Row</span>
                  </div>

                  {/* Brick Slots Row */}
                  <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 p-2 bg-slate-900/90 border border-slate-800 rounded-xl shadow-inner max-w-full">
                    {Array.from({ length: tier.totalSlots }).map((_, slotIdx) => {
                      const brick = tier.bricks[slotIdx];
                      const isNeutral = brick?.ownerId === 'NEUTRAL';
                      const owner =
                        brick && !isNeutral
                          ? gameState.players.find(p => p.id === brick.ownerId)
                          : null;

                      return (
                        <div
                          key={slotIdx}
                          className={`w-7 h-6 sm:w-9 sm:h-7 rounded-md border flex items-center justify-center transition-all ${
                            isNeutral
                              ? 'border-slate-500 bg-slate-600/80 shadow'
                              : brick
                              ? 'border-amber-400/80 shadow'
                              : 'border-slate-800 bg-slate-950/80'
                          }`}
                          style={{
                            backgroundColor: isNeutral ? undefined : owner?.color || undefined,
                          }}
                          title={
                            isNeutral
                              ? `Neutral Brick (Round ${brick.round})`
                              : brick
                              ? `Brick by ${owner?.name || brick.ownerId} (Round ${brick.round})`
                              : 'Empty slot'
                          }
                        >
                          {isNeutral ? (
                            <span className="text-[11px] sm:text-xs font-bold text-slate-200 font-mono">
                              N
                            </span>
                          ) : brick ? (
                            <span className="text-[11px] sm:text-xs font-bold text-white font-mono">
                              🧱
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-700">·</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action / Contribution Strip */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            {homeHexId ? (
              <span className={totalHomeGoods >= nextBrickCost ? 'text-emerald-400' : 'text-amber-300/90'}>
                Goods at home ({homeHexId}): <strong>{totalHomeGoods}</strong> total ({groundCount} ground, {carriedCount} carried). Next brick costs <strong>{nextBrickCost}</strong> good{nextBrickCost === 1 ? '' : 's'}.
              </span>
            ) : (
              <span className="text-slate-400">
                Bring goods to your home (starting) tile during the Wonder Phase to contribute Wonder bricks.
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
            <button
              disabled={!check.valid}
              title={check.reason}
              onClick={() => onContributeWonder(primaryAnchorId, 1)}
              className={`flex-1 sm:flex-initial px-4 sm:px-5 py-2 text-xs font-bold rounded-xl transition-all shadow whitespace-nowrap ${
                check.valid
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              Lay 1 Wonder Brick (Cost: {nextBrickCost} Good{nextBrickCost === 1 ? '' : 's'})
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl whitespace-nowrap"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
