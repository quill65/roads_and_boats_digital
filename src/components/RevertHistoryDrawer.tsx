/**
 * Revert History / Time Travel Memory Drawer
 * Allows players to inspect full move memory and revert any number of moves.
 */

import React from 'react';
import { GameState, HistoryEntry } from '../game/types';

interface RevertHistoryDrawerProps {
  isOpen: boolean;
  gameState: GameState;
  onClose: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onRevertToIndex: (targetIndex: number) => void;
}

export const RevertHistoryDrawer: React.FC<RevertHistoryDrawerProps> = ({
  isOpen,
  gameState,
  onClose,
  onUndo,
  onRedo,
  onRevertToIndex,
}) => {
  if (!isOpen) return null;

  const history = gameState.history || [];
  const redoStack = gameState.redoStack || [];

  return (
    <div className="fixed top-14 sm:top-16 right-2 sm:right-4 z-40 w-96 max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-4.5rem)] sm:max-h-[calc(100dvh-5.5rem)] bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-in">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3 bg-gradient-to-r from-slate-900 via-amber-950/60 to-slate-900 border-b border-amber-900/40 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl shrink-0">⏳</span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-amber-200 truncate">
              Move Memory & Time Machine
            </h3>
            <p className="text-[11px] text-amber-300/70">
              {history.length} {history.length === 1 ? 'choice' : 'choices'} remembered
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close Move Memory"
          className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center text-xs shrink-0"
        >
          ✕
        </button>
      </div>

      {/* Quick Step Bar */}
      <div className="px-4 sm:px-5 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
        <button
          disabled={history.length === 0}
          onClick={onUndo}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
            history.length > 0
              ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}
          title="Revert the very last choice (Ctrl+Z)"
        >
          <span>⤺</span>
          <span>Undo 1 Move</span>
        </button>

        <button
          disabled={redoStack.length === 0}
          onClick={onRedo}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
            redoStack.length > 0
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
              : 'bg-slate-900 text-slate-700 cursor-not-allowed border border-slate-800'
          }`}
          title="Redo previously reverted choice (Ctrl+Y)"
        >
          <span>Redo</span>
          <span>⤻</span>
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 min-h-0 p-3.5 sm:p-4 overflow-y-auto space-y-2 text-xs">
        {history.length === 0 ? (
          <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-2">
            <span className="text-2xl">🌱</span>
            <p className="text-xs">No moves have been made yet in this game.</p>
            <p className="text-[11px] text-slate-600">Every move or construction choice will be recorded here.</p>
          </div>
        ) : (
          [...history].reverse().map((entry, revIdx) => {
            const actualIndex = history.length - 1 - revIdx;
            const movesBack = history.length - actualIndex;

            return (
              <div
                key={entry.id}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-amber-500/50 transition-all flex flex-col gap-2 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-bold shrink-0">
                      #{actualIndex + 1}
                    </span>
                    <span className="text-xs font-semibold text-white leading-snug">
                      {entry.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {movesBack} {movesBack === 1 ? 'move ago' : 'moves ago'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span>
                    R{entry.round} · {entry.phase}
                  </span>
                  <button
                    onClick={() => onRevertToIndex(actualIndex)}
                    className="px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900 border border-amber-800/60 rounded-md transition-colors"
                  >
                    Revert to this point
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 sm:px-5 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
        <span>Hotkeys: Ctrl+Z (Undo) · Ctrl+Y (Redo)</span>
        <button
          onClick={onClose}
          className="text-xs text-slate-300 hover:text-white font-semibold"
        >
          Close
        </button>
      </div>
    </div>
  );
};
