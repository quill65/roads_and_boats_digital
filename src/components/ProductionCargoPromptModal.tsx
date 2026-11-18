/**
 * Prompt Modal shown when advancing into Production if player transporters stationed
 * on factory tiles hold loaded cargo that can be used as production inputs.
 */

import React, { useState } from 'react';
import { GameState } from '../game/types';
import { getHexSideLayout, TransporterProductionCandidate } from '../game/engine';
import { BUILDING_SPECS, GOOD_DETAILS, TRANSPORTER_SPECS } from '../game/constants';

interface ProductionCargoPromptModalProps {
  gameState: GameState;
  candidates: TransporterProductionCandidate[];
  onCancel: () => void;
  onConfirm: (allowTransporterCargo: boolean | string[]) => void;
}

export const ProductionCargoPromptModal: React.FC<ProductionCargoPromptModalProps> = ({
  gameState,
  candidates,
  onCancel,
  onConfirm,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(candidates.map(c => c.transporterId))
  );

  const toggleTransporter = (tId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(tId)) {
        next.delete(tId);
      } else {
        next.add(tId);
      }
      return next;
    });
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-800/90 border-b border-slate-700/70 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span className="text-2xl shrink-0">⚙️</span>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">
                Use Loaded Cargo for Production?
              </h3>
              <p className="text-xs text-slate-400 truncate">
                Round {gameState.round + 1} Production Phase
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel Advance Phase"
            className="w-9 h-9 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto space-y-3">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            You have items loaded in transporter{candidates.length > 1 ? 's' : ''} on factory tile
            {candidates.length > 1 ? 's' : ''} that can be used as production inputs directly without
            having unloaded them. Choose which transporters&apos; loaded items to use:
          </p>

          <div className="space-y-2.5">
            {candidates.map(cand => {
              const checked = selectedIds.has(cand.transporterId);
              const bSpec = BUILDING_SPECS[cand.buildingType];
              const tSpec = TRANSPORTER_SPECS[cand.transporterType];
              const layout = getHexSideLayout(gameState, cand.hexId);
              const bankLabel = layout.isSplit
                ? layout.sides[cand.buildingSide]?.compassLabel
                : null;

              return (
                <label
                  key={cand.transporterId}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    checked
                      ? 'bg-amber-950/30 border-amber-500/60 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTransporter(cand.transporterId)}
                    className="mt-1 h-4 w-4 accent-amber-400 rounded cursor-pointer shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{bSpec?.icon || '🏭'}</span>
                        <span>{cand.buildingName}</span>
                        <span className="text-xs font-mono text-slate-400 font-normal">
                          ({cand.hexId}{bankLabel ? ` · ${bankLabel}` : ''})
                        </span>
                      </span>
                      <span className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                        <span>{tSpec?.icon || '🐴'}</span>
                        <span>{cand.transporterName}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-slate-400">Usable loaded inputs:</span>
                      {cand.usableGoods.map(ug => {
                        const detail = GOOD_DETAILS[ug.good];
                        return (
                          <span
                            key={ug.good}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-700/70 text-emerald-300 text-[11px] font-mono font-semibold"
                          >
                            <span>{detail?.icon || '📦'}</span>
                            <span>
                              {ug.quantity}x {detail?.name || ug.good}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(false)}
            className="px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl transition-colors"
          >
            Keep All on Transporters
          </button>
          <button
            type="button"
            onClick={() =>
              onConfirm(selectedCount > 0 ? Array.from(selectedIds) : false)
            }
            className="px-4 py-2 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-lg"
          >
            {selectedCount === candidates.length
              ? 'Use All & Produce'
              : selectedCount > 0
              ? `Use Selected (${selectedCount}) & Produce`
              : 'Produce (Ground Only)'}
          </button>
        </div>
      </div>
    </div>
  );
};
