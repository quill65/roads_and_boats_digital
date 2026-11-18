/**
 * Game Heads-Up Display (HUD): Top Navigation, Phase Controls, Scoreboard, and Actions
 */

import React, { useState } from 'react';
import { GameState, Phase, Transporter } from '../game/types';
import { getBotProfile, isOnlyActivePlayerRemaining } from '../game/engine';
import { sounds } from '../utils/soundEffects';

interface GameHUDProps {
  gameState: GameState;
  activePlayerId: string;
  isObserving?: boolean;
  selectedTransporter: Transporter | null;
  selectedHexId: string | null;
  buildMode: 'none' | 'road' | 'factory' | 'wonder';
  onAdvancePhase: () => void;
  onOpenCargo: () => void;
  onOpenBuildMenu: () => void;
  onOpenWonder: () => void;
  onOpenAlmanac: () => void;
  onOpenTutorial: () => void;
  onOpenPlayerAid: () => void;
  onOpenHistory: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onLeaveMatch: () => void;
  onResignMatch: () => Promise<void> | void;
  onDeleteMatch?: () => Promise<boolean | void> | void;
  onRenameMatch?: (newName: string) => Promise<boolean | void> | void;
  canDeleteMatch?: boolean;
  onToggleBuildRoad: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenTestSuite?: () => void;
  onOpenSolitaire?: () => void;
  originalMatchId?: string | null;
  onReturnToOriginalMatch?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  gameState,
  activePlayerId,
  isObserving = false,
  selectedTransporter,
  selectedHexId,
  buildMode,
  onAdvancePhase,
  onOpenCargo,
  onOpenBuildMenu,
  onOpenWonder,
  onOpenAlmanac,
  onOpenTutorial,
  onOpenPlayerAid,
  onOpenHistory,
  onUndo,
  onRedo,
  onLeaveMatch,
  onResignMatch,
  onDeleteMatch,
  onRenameMatch,
  canDeleteMatch = false,
  onToggleBuildRoad,
  soundEnabled,
  onToggleSound,
  onOpenTestSuite,
  onOpenSolitaire,
  originalMatchId,
  onReturnToOriginalMatch,
}) => {
  const [confirmAction, setConfirmAction] = useState<'resign' | 'delete' | null>(null);
  const [isSubmittingMatchAction, setIsSubmittingMatchAction] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [showMobileScores, setShowMobileScores] = useState(false);

  const handleCopyGameCode = async () => {
    try {
      await navigator.clipboard?.writeText(gameState.id);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      // Clipboard unsupported in context
    }
  };

  const activePlayer = gameState.players.find(p => p.id === activePlayerId);
  const isReadOnly = Boolean(isObserving || activePlayer?.resigned);
  const willResignRemoveMatch = isOnlyActivePlayerRemaining(gameState, activePlayerId);
  const historyCount = gameState.history?.length || 0;
  const redoCount = gameState.redoStack?.length || 0;

  const handleConfirmMatchAction = async () => {
    if (!confirmAction || isSubmittingMatchAction) return;
    setIsSubmittingMatchAction(true);
    try {
      if (confirmAction === 'resign') {
        await onResignMatch();
      } else if (confirmAction === 'delete' && onDeleteMatch) {
        await onDeleteMatch();
      }
      setConfirmAction(null);
    } finally {
      setIsSubmittingMatchAction(false);
    }
  };

  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onRenameMatch || isSavingName) return;
    const trimmed = editedName.trim();
    if (!trimmed || trimmed === gameState.name) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    try {
      const ok = await onRenameMatch(trimmed);
      if (ok !== false) {
        setIsEditingName(false);
      }
    } finally {
      setIsSavingName(false);
    }
  };

  const getNextPhaseActionLabel = (phase: Phase) => {
    switch (phase) {
      case 'PRODUCTION':
        return 'Start Movement Phase →';
      case 'MOVEMENT':
        return 'Finish Moves & Enter Building →';
      case 'BUILDING':
        return 'Proceed to Wonder Phase →';
      case 'WONDER':
        return 'Complete Round & Produce →';
      case 'COMPLETED':
        return 'Game Over';
    }
  };

  return (
    <>
      {/* 1. Top HUD Bar */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between gap-2.5 sm:gap-4 px-2.5 sm:px-6 py-2 sm:py-3 bg-slate-950/85 backdrop-blur-md border-b border-slate-800 shadow-md overflow-x-auto no-scrollbar">
        {/* Left: Back & Game Info */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            onClick={onLeaveMatch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
          >
            ← Lobby
          </button>
          {isObserving ? (
            <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-sky-300 bg-sky-950/50 border border-sky-700/70">
              <span>👁️</span>
              <span className="hidden sm:inline">Observing (Read-Only)</span>
            </span>
          ) : activePlayer?.resigned ? (
            <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-950/50 border border-rose-800/70">
              <span>🏳️</span>
              <span className="hidden sm:inline">Resigned (View Only)</span>
            </span>
          ) : (
            <button
              onClick={() => setConfirmAction('resign')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/50 border border-rose-800/70 hover:bg-rose-900/70 transition-colors"
              title={
                willResignRemoveMatch
                  ? 'Resign and remove match (you are the only active player)'
                  : 'Resign from this match'
              }
            >
              <span>🏳️</span>
              <span className="hidden sm:inline">Resign</span>
            </button>
          )}
          {canDeleteMatch && onDeleteMatch && (
            <button
              onClick={() => setConfirmAction('delete')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-300 hover:text-white bg-red-950/50 border border-red-800/70 hover:bg-red-900/70 transition-colors"
              title="Delete this match permanently (Match Starter only)"
            >
              <span>🗑️</span>
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
          {originalMatchId && onReturnToOriginalMatch && (
            <button
              onClick={onReturnToOriginalMatch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-300 hover:text-white bg-amber-950/90 border border-amber-600 hover:bg-amber-900 transition-all shadow-md animate-pulse"
              title="Return to your main game match"
            >
              <span>↩️</span>
              <span>Return to My Match</span>
            </button>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              {isEditingName ? (
                <form onSubmit={handleSaveRename} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editedName}
                    onChange={e => setEditedName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Escape') {
                        setIsEditingName(false);
                      }
                    }}
                    maxLength={40}
                    autoFocus
                    disabled={isSavingName}
                    className="px-2 py-0.5 text-xs font-bold text-white bg-slate-900 border border-amber-400 rounded-md focus:outline-none w-44"
                    placeholder="Game name"
                  />
                  <button
                    type="submit"
                    disabled={isSavingName || !editedName.trim()}
                    className="px-1.5 py-0.5 text-[10px] font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded disabled:opacity-50"
                    title="Save game name"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    disabled={isSavingName}
                    className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-300 hover:text-white bg-slate-800 rounded"
                    title="Cancel rename"
                  >
                    ✕
                  </button>
                </form>
              ) : (
                <>
                  <h1 className="text-sm font-bold font-serif-title text-white tracking-wide truncate max-w-[200px]">
                    {gameState.name}
                  </h1>
                  {!isReadOnly && onRenameMatch && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditedName(gameState.name);
                        setIsEditingName(true);
                      }}
                      className="text-[11px] text-slate-400 hover:text-amber-300 transition-colors px-1"
                      title="Name / rename this game"
                    >
                      ✏️
                    </button>
                  )}
                </>
              )}
              {gameState.isSolitaire && (
                <span
                  className="text-[10px] font-semibold text-amber-300 bg-amber-950/70 border border-amber-600/60 px-1.5 py-0.2 rounded shrink-0"
                  title="Solo game: strictly 1 human player only (zero bots)"
                >
                  Solo · 1 Player
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] text-slate-400 font-mono-numbers">
              <span>R{gameState.round}/{gameState.maxRounds}</span>
              <span className="md:hidden px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-sans font-extrabold text-[10px] tracking-wide">
                {gameState.phase}
              </span>
              <span>·</span>
              <button
                type="button"
                onClick={handleCopyGameCode}
                className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 hover:border-amber-400/70 text-amber-200 font-mono text-[10px] transition-colors"
                title="Copy 8-digit hex Game Code to share"
              >
                <span className="hidden sm:inline text-slate-400">Code:</span>
                <span className="font-bold tracking-wider">{gameState.id}</span>
                <span>{copiedCode ? '✓' : '📋'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center: Phase Tracker */}
        <div className="hidden md:flex items-center gap-2 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
          {(['PRODUCTION', 'MOVEMENT', 'BUILDING', 'WONDER'] as Phase[]).map((p, idx) => {
            const isActive = gameState.phase === p;
            return (
              <span
                key={p}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 bg-transparent'
                }`}
              >
                {idx + 1}. {p}
              </span>
            );
          })}
        </div>

        {/* Right: Quick Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile Leaderboard / VP Toggle */}
          <button
            type="button"
            onClick={() => setShowMobileScores(prev => !prev)}
            className={`lg:hidden px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1 shrink-0 ${
              showMobileScores
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-slate-900 text-amber-300 border-slate-700 hover:bg-slate-800'
            }`}
            title="Show Leaderboard & Player VP"
          >
            <span>🏆</span>
            <span>{activePlayer ? `${activePlayer.score} VP` : 'Scores'}</span>
          </button>

          {/* Quick Undo / Redo controls */}
          <button
            disabled={isReadOnly || historyCount === 0}
            onClick={onUndo}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border ${
              !isReadOnly && historyCount > 0
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300 shadow'
                : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
            }`}
            title={isReadOnly ? 'Read-only mode' : 'Undo Last Move (Ctrl+Z)'}
          >
            <span>⤺</span>
            <span className="hidden sm:inline">Undo</span>
            {historyCount > 0 && (
              <span className="text-[10px] font-mono font-extrabold bg-slate-950 text-amber-300 px-1 py-0.2 rounded-full">
                {historyCount}
              </span>
            )}
          </button>

          <button
            disabled={isReadOnly || redoCount === 0}
            onClick={onRedo}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border ${
              !isReadOnly && redoCount > 0
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 shadow'
                : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
            }`}
            title={isReadOnly ? 'Read-only mode' : 'Redo Reverted Move (Ctrl+Y)'}
          >
            <span>Redo</span>
            <span>⤻</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors flex items-center gap-1"
            title="Open Full Move Memory & Time Machine Drawer"
          >
            <span>⏳</span>
            <span className="hidden md:inline">Memory</span>
          </button>

          {onOpenSolitaire && (
            <button
              onClick={onOpenSolitaire}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-300 hover:text-white bg-amber-950/40 border border-amber-600/70 hover:bg-amber-900/60 transition-colors flex items-center gap-1 shrink-0 shadow-sm"
              title="Pre-Made Scenarios: 1-Player Solo, Splotter Scenario Book PDF, 1–2 Player Maps & Multiplayer"
            >
              <span>🗺️</span>
              <span>Pre-Made Scenarios</span>
            </button>
          )}

          <button
            onClick={onOpenPlayerAid}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-300 hover:text-white bg-slate-900 border border-amber-600/60 hover:bg-slate-800 transition-colors flex items-center gap-1 shrink-0"
            title="Official Roads & Boats Player Aid (Buildings, Vehicles & Tech Tree)"
          >
            <span>📋</span>
            <span>Player Aid</span>
          </button>

          <button
            onClick={onOpenTutorial}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 border border-amber-300 shadow-md transition-all flex items-center gap-1.5 shrink-0"
            title="Interactive Step-by-Step Tutorial"
          >
            <span>🎓</span>
            <span>Tutorial</span>
          </button>

          <button
            onClick={onOpenAlmanac}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors shrink-0"
            title="Almanac & Rulebook"
          >
            📖 Almanac
          </button>

          {onOpenTestSuite && (
            <button
              onClick={onOpenTestSuite}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-300 hover:text-white bg-slate-900 border border-emerald-600/60 hover:bg-emerald-950/40 transition-colors flex items-center gap-1 shrink-0"
              title="Automated Gameplay Test Suite & Rule Simulator"
            >
              <span>🧪</span>
              <span className="hidden sm:inline">Tests</span>
            </button>
          )}

          <button
            onClick={onOpenWonder}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-950/40 border border-amber-900/50 hover:bg-amber-900/40 transition-colors flex items-center gap-1 shrink-0"
            title="Wonder Stepped Pyramid"
          >
            <span>🏛️</span>
            <span>Wonder</span>
          </button>

          <button
            onClick={onToggleSound}
            className="w-8 h-8 rounded-lg text-slate-300 hover:text-white bg-slate-900 border border-slate-800 flex items-center justify-center text-xs shrink-0"
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {soundEnabled ? '🔔' : '🔕'}
          </button>
        </div>
      </header>

      {/* 2. Left Overlay: Scoreboard (Desktop fixed; Mobile collapsible) */}
      <div
        className={`absolute top-14 sm:top-16 left-2 sm:left-4 right-2 sm:right-auto z-30 ${
          showMobileScores ? 'flex' : 'hidden lg:flex'
        } flex-col gap-2 p-3 bg-slate-950/92 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl sm:w-64 lg:w-60 max-h-[45dvh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {gameState.isSolitaire ? 'Solo Score · 1 Player' : 'Leaderboard & VP'}
          </p>
          <button
            type="button"
            onClick={() => setShowMobileScores(false)}
            className="lg:hidden w-6 h-6 rounded text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center text-xs"
            aria-label="Close Scores"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          {(gameState.isSolitaire ? gameState.players.slice(0, 1) : gameState.players).map(p => {
            const isMe = p.id === activePlayerId;
            return (
              <div
                key={p.id}
                className={`p-2 rounded-xl flex items-center justify-between border transition-all ${
                  p.resigned
                    ? 'bg-slate-950/40 border-slate-800/40 opacity-55'
                    : isMe
                    ? 'bg-slate-900/90 border-amber-500/50 shadow'
                    : 'bg-slate-950/50 border-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate">
                      {p.name} {isMe && '(You)'}
                    </p>
                    {p.resigned ? (
                      <p className="text-[9px] text-rose-400 font-mono">Resigned</p>
                    ) : (
                      p.isAI && (
                        <p className="text-[9px] text-emerald-400/80 font-mono">
                          {getBotProfile(p.aiProfileId).difficulty} AI · {getBotProfile(p.aiProfileId).focus}
                        </p>
                      )
                    )}
                  </div>
                </div>
                <span className="text-sm font-extrabold font-mono text-amber-400 shrink-0 ml-2">
                  {p.score} VP
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Bottom Floating Stage Advancement & Action Buttons (No Overlay Box) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-wrap items-center justify-center gap-2 max-w-[calc(100vw-1rem)]">
        {!isReadOnly && selectedTransporter && (
          <button
            onClick={onOpenCargo}
            className="pointer-events-auto px-3 py-2 text-xs font-bold text-slate-100 hover:text-white bg-slate-900/95 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700 shadow-lg whitespace-nowrap"
          >
            🎒 Manage Cargo
          </button>
        )}

        {!isReadOnly && gameState.phase === 'BUILDING' && selectedTransporter && (
          <>
            <button
              onClick={onOpenBuildMenu}
              className="pointer-events-auto px-3 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-lg whitespace-nowrap"
            >
              🏗️ Build Workshop
            </button>
            <button
              onClick={onToggleBuildRoad}
              className={`pointer-events-auto px-3 py-2 text-xs font-bold rounded-xl transition-colors border shadow-lg whitespace-nowrap ${
                buildMode === 'road'
                  ? 'bg-amber-500 text-slate-950 border-amber-300 animate-pulse'
                  : 'bg-slate-900/95 text-slate-100 border-slate-700 hover:bg-slate-800'
              }`}
            >
              🛣️ Pave Road/Bridge
            </button>
          </>
        )}

        <button
          onClick={onAdvancePhase}
          disabled={isReadOnly}
          className="pointer-events-auto min-h-[40px] px-5 py-2.5 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xl hover:shadow-amber-400/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isObserving
            ? 'Observing (Read-Only)'
            : activePlayer?.resigned
            ? 'Resigned (View Only)'
            : getNextPhaseActionLabel(gameState.phase)}
        </button>
      </div>

      {/* Resign / Delete Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between gap-2 shrink-0">
              <h3 className="text-base font-bold text-white font-serif-title flex items-center gap-2 min-w-0">
                <span className="shrink-0">{confirmAction === 'resign' ? '🏳️' : '🗑️'}</span>
                <span className="truncate">{confirmAction === 'resign' ? 'Resign Match?' : 'Delete Match?'}</span>
              </h3>
              <button
                onClick={() => setConfirmAction(null)}
                disabled={isSubmittingMatchAction}
                aria-label="Close Confirmation"
                className="w-9 h-9 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center shrink-0"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {confirmAction === 'resign' ? (
                <p className="text-sm text-slate-300 leading-relaxed">
                  {willResignRemoveMatch
                    ? 'You are the only active player remaining in this match. Resigning will end the game and permanently remove the match.'
                    : 'Are you sure you want to resign? Other active players will continue the match without you.'}
                </p>
              ) : (
                <p className="text-sm text-slate-300 leading-relaxed">
                  {activePlayer?.isHost
                    ? <>As the player who started <strong className="text-white">{gameState.name}</strong>, deleting this game will permanently remove it for all players.</>
                    : <>Using elevated privileges (<strong className="text-amber-300">John Burt</strong>), deleting <strong className="text-white">{gameState.name}</strong> will permanently remove it for all players.</>}
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-2.5 sm:gap-3 pt-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  disabled={isSubmittingMatchAction}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmMatchAction}
                  disabled={isSubmittingMatchAction}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors shadow disabled:opacity-60"
                >
                  {isSubmittingMatchAction
                    ? 'Processing...'
                    : confirmAction === 'resign'
                    ? willResignRemoveMatch
                      ? 'Resign & Remove Match'
                      : 'Confirm Resign'
                    : 'Delete Match'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
