/**
 * Game Heads-Up Display (HUD): Top Navigation, Phase Controls, Scoreboard, and Actions
 */

import React, { useState } from 'react';
import { GameState, GoodType, Phase, Transporter } from '../game/types';
import {
  BUILDING_SPECS,
  GOOD_DETAILS,
  TERRAIN_INFO,
  TRANSPORTER_SPECS,
} from '../game/constants';
import {
  getBotProfile,
  getTransporterCargoWeight,
  isOnlyActivePlayerRemaining,
} from '../game/engine';
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
  onOpenSolitaire?: () => void;
  hasResearchAvailable?: boolean;
  onOpenResearch?: () => void;
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
  onOpenSolitaire,
  hasResearchAvailable = false,
  onOpenResearch,
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

  // Selected Tile & Selected Transporter Map-Edge Legend Data
  const selectedHex = selectedHexId ? gameState.hexes[selectedHexId] || null : null;
  const selectedTerrain = selectedHex ? TERRAIN_INFO[selectedHex.terrain] || TERRAIN_INFO.pasture : null;
  const selectedBuildingSpec = selectedHex?.building
    ? BUILDING_SPECS[selectedHex.building.type]
    : null;
  const selectedBuildingOwner = selectedHex?.building
    ? gameState.players.find(p => p.id === selectedHex.building?.ownerId) || null
    : null;

  const tileResourceItems: Array<{
    good: GoodType;
    ground: number;
    carried: number;
    total: number;
  }> = [];

  if (selectedHex) {
    const groundMap: Partial<Record<GoodType, number>> = {};
    if (selectedHex.goodsBySide && Object.keys(selectedHex.goodsBySide).length > 0) {
      Object.values(selectedHex.goodsBySide).forEach(sideGoods => {
        Object.entries(sideGoods || {}).forEach(([good, qty]) => {
          if (qty && qty > 0) {
            const g = good as GoodType;
            groundMap[g] = (groundMap[g] || 0) + qty;
          }
        });
      });
    } else {
      Object.entries(selectedHex.goods || {}).forEach(([good, qty]) => {
        if (qty && qty > 0) {
          groundMap[good as GoodType] = qty;
        }
      });
    }

    const carriedMap: Partial<Record<GoodType, number>> = {};
    Object.values(gameState.transporters).forEach(t => {
      if (t.hexId !== selectedHex.id) return;
      Object.entries(t.cargo || {}).forEach(([good, qty]) => {
        if (qty && qty > 0) {
          const g = good as GoodType;
          carriedMap[g] = (carriedMap[g] || 0) + qty;
        }
      });
    });

    (Object.keys(GOOD_DETAILS) as GoodType[]).forEach(g => {
      const ground = groundMap[g] || 0;
      const carried = carriedMap[g] || 0;
      const total = ground + carried;
      if (total > 0) {
        tileResourceItems.push({ good: g, ground, carried, total });
      }
    });
  }

  const selectedTransporterSpec = selectedTransporter
    ? TRANSPORTER_SPECS[selectedTransporter.type]
    : null;
  const selectedTransporterOwner = selectedTransporter
    ? gameState.players.find(p => p.id === selectedTransporter.ownerId) || null
    : null;
  const selectedTransporterUsedSpace = selectedTransporter
    ? getTransporterCargoWeight(selectedTransporter)
    : 0;
  const selectedTransporterAvailableSpace = selectedTransporter
    ? Math.max(0, selectedTransporter.capacity - selectedTransporterUsedSpace)
    : 0;
  const selectedTransporterCargoItems: Array<{ good: GoodType; qty: number }> = [];
  if (selectedTransporter) {
    (Object.keys(GOOD_DETAILS) as GoodType[]).forEach(g => {
      const qty = selectedTransporter.cargo?.[g] || 0;
      if (qty > 0) {
        selectedTransporterCargoItems.push({ good: g, qty });
      }
    });
  }

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
      {/* 1 & 2. Top HUD Bar + Dynamic Below-Header Overlays (Scoreboard & Road Mode Banner) */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none flex flex-col">
        <header className="pointer-events-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-2 sm:px-4 lg:px-5 py-1.5 sm:py-2 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-md">
          {/* Left: Back, Match Controls & Game Info */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
            <button
              onClick={onLeaveMatch}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              ← Lobby
            </button>
            {isObserving ? (
              <span className="flex items-center gap-1 px-2 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold text-sky-300 bg-sky-950/50 border border-sky-700/70 whitespace-nowrap">
                <span>👁️</span>
                <span>Observing</span>
              </span>
            ) : activePlayer?.resigned ? (
              <span className="flex items-center gap-1 px-2 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold text-rose-300 bg-rose-950/50 border border-rose-800/70 whitespace-nowrap">
                <span>🏳️</span>
                <span>Resigned</span>
              </span>
            ) : (
              <button
                onClick={() => setConfirmAction('resign')}
                className="flex items-center gap-1 px-2 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/50 border border-rose-800/70 hover:bg-rose-900/70 transition-colors whitespace-nowrap"
                title={
                  willResignRemoveMatch
                    ? 'Resign and remove match (you are the only active player)'
                    : 'Resign from this match'
                }
              >
                <span>🏳️</span>
                <span>Resign</span>
              </button>
            )}
            {canDeleteMatch && onDeleteMatch && (
              <button
                onClick={() => setConfirmAction('delete')}
                className="flex items-center gap-1 px-2 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold text-red-300 hover:text-white bg-red-950/50 border border-red-800/70 hover:bg-red-900/70 transition-colors whitespace-nowrap"
                title="Delete this match permanently (Match Starter only)"
              >
                <span>🗑️</span>
                <span>Delete</span>
              </button>
            )}
            {originalMatchId && onReturnToOriginalMatch && (
              <button
                onClick={onReturnToOriginalMatch}
                className="flex items-center gap-1 px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold text-amber-300 hover:text-white bg-amber-950/90 border border-amber-600 hover:bg-amber-900 transition-all shadow-md animate-pulse whitespace-nowrap"
                title="Return to your main game match"
              >
                <span>↩️</span>
                <span>Return to Match</span>
              </button>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1">
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
                      className="px-2 py-0.5 text-xs font-bold text-white bg-slate-900 border border-amber-400 rounded-md focus:outline-none w-36 sm:w-44"
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
                    <h1 className="text-xs sm:text-sm font-bold font-serif-title text-white tracking-wide truncate max-w-[140px] sm:max-w-[200px]">
                      {gameState.name}
                    </h1>
                    {!isReadOnly && onRenameMatch && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditedName(gameState.name);
                          setIsEditingName(true);
                        }}
                        className="text-[11px] text-slate-400 hover:text-amber-300 transition-colors px-0.5"
                        title="Name / rename this game"
                      >
                        ✏️
                      </button>
                    )}
                  </>
                )}
                {gameState.isSolitaire && (
                  <span
                    className="text-[9px] sm:text-[10px] font-semibold text-amber-300 bg-amber-950/70 border border-amber-600/60 px-1.5 rounded shrink-0"
                    title="Solo game: strictly 1 human player only (zero bots)"
                  >
                    Solo
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 font-mono-numbers">
                <span>R{gameState.round}/{gameState.maxRounds}</span>
                <span className="md:hidden px-1.5 rounded bg-amber-400 text-slate-950 font-sans font-extrabold text-[9px] tracking-wide">
                  {gameState.phase}
                </span>
                <span>·</span>
                <button
                  type="button"
                  onClick={handleCopyGameCode}
                  className="inline-flex items-center gap-1 px-1.5 rounded bg-slate-900 border border-slate-700 hover:border-amber-400/70 text-amber-200 font-mono text-[10px] transition-colors"
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
          <div className="hidden md:flex items-center gap-1 p-0.5 bg-slate-900/90 border border-slate-800 rounded-xl shrink-0">
            {(['PRODUCTION', 'MOVEMENT', 'BUILDING', 'WONDER'] as Phase[]).map((p, idx) => {
              const isActive = gameState.phase === p;
              return (
                <span
                  key={p}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${
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

          {/* Menu Buttons: Always Visible, Wraps Cleanly Across Rows */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            {/* Mobile Leaderboard / VP Toggle */}
            <button
              type="button"
              onClick={() => setShowMobileScores(prev => !prev)}
              className={`lg:hidden px-2 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold border transition-colors flex items-center gap-1 whitespace-nowrap ${
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
              className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-colors flex items-center gap-1 border whitespace-nowrap ${
                !isReadOnly && historyCount > 0
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300 shadow'
                  : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
              }`}
              title={isReadOnly ? 'Read-only mode' : 'Undo Last Move (Ctrl+Z)'}
            >
              <span>⤺</span>
              <span>Undo</span>
              {historyCount > 0 && (
                <span className="text-[9px] font-mono font-extrabold bg-slate-950 text-amber-300 px-1 rounded-full">
                  {historyCount}
                </span>
              )}
            </button>

            <button
              disabled={isReadOnly || redoCount === 0}
              onClick={onRedo}
              className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-colors flex items-center gap-1 border whitespace-nowrap ${
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
              className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors flex items-center gap-1 whitespace-nowrap"
              title="Open Full Move Memory & Time Machine Drawer"
            >
              <span>⏳</span>
              <span>Memory</span>
            </button>

            {onOpenSolitaire && (
              <button
                onClick={onOpenSolitaire}
                className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold text-amber-300 hover:text-white bg-amber-950/40 border border-amber-600/70 hover:bg-amber-900/60 transition-colors flex items-center gap-1 whitespace-nowrap shadow-sm"
                title="Pre-Made Scenarios: 1-Player Solo, Splotter Scenario Book PDF, 1–2 Player Maps & Multiplayer"
              >
                <span>🗺️</span>
                <span className="sm:hidden">Scenarios</span>
                <span className="hidden sm:inline">Pre-Made Scenarios</span>
              </button>
            )}

            <button
              onClick={onOpenPlayerAid}
              className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold text-amber-300 hover:text-white bg-slate-900 border border-amber-600/60 hover:bg-slate-800 transition-colors flex items-center gap-1 whitespace-nowrap"
              title="Official Roads & Boats Player Aid (Buildings, Vehicles & Tech Tree)"
            >
              <span>📋</span>
              <span>Player Aid</span>
            </button>

            <button
              onClick={onOpenTutorial}
              className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 border border-amber-300 shadow-md transition-all flex items-center gap-1 whitespace-nowrap"
              title="Interactive Step-by-Step Tutorial"
            >
              <span>🎓</span>
              <span>Tutorial</span>
            </button>

            <button
              onClick={onOpenAlmanac}
              className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors flex items-center gap-1 whitespace-nowrap"
              title="Game Rules & Rulebook"
            >
              <span>📖</span>
              <span>Game Rules</span>
            </button>

            <button
              onClick={onOpenWonder}
              className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-950/40 border border-amber-900/50 hover:bg-amber-900/40 transition-colors flex items-center gap-1 whitespace-nowrap"
              title="Wonder Stepped Pyramid"
            >
              <span>🏛️</span>
              <span>Wonder</span>
            </button>

            <button
              onClick={onToggleSound}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-slate-300 hover:text-white bg-slate-900 border border-slate-800 flex items-center justify-center text-xs shrink-0"
              title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            >
              {soundEnabled ? '🔔' : '🔕'}
            </button>
          </div>
        </header>

        {/* Below-Header Floating Row: Scoreboard (Left) & Road Building Banner (Center) */}
        <div className="relative px-2 sm:px-4 pt-2 flex flex-col sm:flex-row items-start gap-2 pointer-events-none">
          {/* 2. Left Overlay: Scoreboard (Desktop fixed; Mobile collapsible) */}
          <div
            className={`pointer-events-auto ${
              showMobileScores ? 'flex' : 'hidden lg:flex'
            } flex-col gap-2 p-2.5 sm:p-3 bg-slate-950/92 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl w-full sm:w-64 lg:w-60 max-h-[42dvh] overflow-y-auto shrink-0`}
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

          {/* Road & Bridge Building Mode Banner (automatically clears multi-row header) */}
          {buildMode === 'road' && (
            <div className="pointer-events-auto mx-auto max-w-full px-3 sm:px-4 py-2 bg-slate-900/95 border border-amber-400/80 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2.5">
              <span className="text-xl sm:text-2xl animate-pulse shrink-0">🛣️</span>
              <div className="text-xs min-w-0">
                <p className="font-bold text-amber-300">Road &amp; Bridge Building Mode</p>
                <p className="text-slate-300 leading-snug">
                  Tap 🛣️ Road (1 Stone — land border or riverbank) or 🌉 Bridge (2 Boards — cross river)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3 & 4. Lower-Left Tile Legend, Lower-Right Transporter Legend, and Bottom Action Buttons */}
      <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none flex flex-col gap-1.5 p-1.5 sm:p-2.5 lg:block lg:p-0">
        {/* Lower Corner Legends Row (stacked directly above action buttons below lg; true bottom corners on lg+) */}
        <div className="flex items-end justify-between gap-1.5 w-full lg:block">
          {/* Selected Tile Legend — Lower Left */}
          <section
            aria-label="Selected Tile Legend"
            className="pointer-events-auto lg:absolute lg:bottom-2.5 lg:left-2.5 min-w-[120px] max-w-[48%] lg:max-w-[196px] px-2 py-1.5 bg-slate-950/82 backdrop-blur-sm border border-slate-800/85 rounded-lg shadow-lg text-slate-200 leading-tight"
          >
            <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-slate-800/80">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                Tile
              </span>
              {selectedHex && selectedTerrain ? (
                <span className="text-[10px] font-semibold text-sky-300 flex items-center gap-0.5 truncate">
                  <span className="shrink-0">{selectedTerrain.icon}</span>
                  <span className="truncate">{selectedTerrain.name}</span>
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 truncate">None</span>
              )}
            </div>

            {selectedHex && selectedTerrain && (
              <div className="mt-1 space-y-0.5 text-[10px]">
                {/* Building */}
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[9px] text-slate-400 shrink-0">Bldg</span>
                  {selectedHex.building && selectedBuildingSpec ? (
                    <span className="font-semibold text-white flex items-center gap-0.5 truncate">
                      {selectedBuildingOwner && (
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: selectedBuildingOwner.color }}
                        />
                      )}
                      <span className="shrink-0">{selectedBuildingSpec.icon}</span>
                      <span className="truncate">{selectedBuildingSpec.name}</span>
                    </span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </div>

                {/* Itemized Resources on Tile (Ground + On Transporters) */}
                <div className="pt-0.5 border-t border-slate-800/70">
                  {tileResourceItems.length === 0 ? (
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[9px] text-slate-400">Res</span>
                      <span className="text-slate-500">None</span>
                    </div>
                  ) : (
                    <ul className="space-y-0.5 max-h-20 sm:max-h-24 overflow-y-auto pr-0.5">
                      {tileResourceItems.map(item => {
                        const detail = GOOD_DETAILS[item.good];
                        const tag =
                          item.ground > 0 && item.carried > 0
                            ? `${item.ground}+${item.carried}c`
                            : item.carried > 0
                            ? 'c'
                            : '';
                        return (
                          <li
                            key={item.good}
                            className="flex items-center justify-between gap-1 text-[10px]"
                          >
                            <span className="flex items-center gap-0.5 min-w-0 truncate text-slate-200">
                              <span className="shrink-0">{detail.icon}</span>
                              <span className="truncate">{detail.name}</span>
                            </span>
                            <span className="flex items-center gap-1 shrink-0 font-mono">
                              {tag && <span className="text-[8px] text-slate-400">({tag})</span>}
                              <span className="font-bold text-amber-300">{item.total}</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Selected Transporter Legend — Lower Right */}
          <section
            aria-label="Selected Transporter Legend"
            className="pointer-events-auto lg:absolute lg:bottom-2.5 lg:right-2.5 min-w-[120px] max-w-[48%] lg:max-w-[196px] px-2 py-1.5 bg-slate-950/82 backdrop-blur-sm border border-slate-800/85 rounded-lg shadow-lg text-slate-200 leading-tight"
          >
            <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-slate-800/80">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                Unit
              </span>
              {selectedTransporter && selectedTransporterSpec ? (
                <span className="text-[10px] font-semibold text-amber-300 flex items-center gap-0.5 truncate">
                  {selectedTransporterOwner && (
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: selectedTransporterOwner.color }}
                    />
                  )}
                  <span className="shrink-0">{selectedTransporterSpec.icon}</span>
                  <span className="truncate">{selectedTransporterSpec.name}</span>
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 truncate">None</span>
              )}
            </div>

            {selectedTransporter && selectedTransporterSpec && (
              <div className="mt-1 space-y-0.5 text-[10px]">
                {/* Available Space & Moves Left */}
                <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                  <span className="text-slate-400 whitespace-nowrap">
                    Spc{' '}
                    <strong className="text-emerald-300">{selectedTransporterAvailableSpace}</strong>
                    <span className="text-slate-500">/{selectedTransporter.capacity}</span>
                  </span>
                  <span className="text-slate-400 whitespace-nowrap">
                    Mov{' '}
                    <strong className="text-sky-300">{selectedTransporter.movesLeft}</strong>
                    <span className="text-slate-500">/{selectedTransporter.maxMoves}</span>
                  </span>
                </div>

                {/* Itemized Cargo on Transporter (including Geese) */}
                <div className="pt-0.5 border-t border-slate-800/70">
                  {selectedTransporterCargoItems.length === 0 ? (
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[9px] text-slate-400">Cargo</span>
                      <span className="text-slate-500">Empty</span>
                    </div>
                  ) : (
                    <ul className="space-y-0.5 max-h-20 sm:max-h-24 overflow-y-auto pr-0.5">
                      {selectedTransporterCargoItems.map(item => {
                        const detail = GOOD_DETAILS[item.good];
                        return (
                          <li
                            key={item.good}
                            className="flex items-center justify-between gap-1 text-[10px]"
                          >
                            <span className="flex items-center gap-0.5 min-w-0 truncate text-slate-200">
                              <span className="shrink-0">{detail.icon}</span>
                              <span className="truncate">{detail.name}</span>
                            </span>
                            <span className="font-bold font-mono text-amber-300 shrink-0">
                              {item.qty}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Bottom Floating Stage Advancement & Action Buttons */}
        <div className="lg:absolute lg:bottom-3 lg:left-1/2 lg:-translate-x-1/2 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 w-full lg:w-auto lg:max-w-[calc(100vw-28rem)]">
          {!isReadOnly && selectedTransporter && (
            <button
              onClick={onOpenCargo}
              className="pointer-events-auto px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-slate-100 hover:text-white bg-slate-900/95 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700 shadow-lg whitespace-nowrap"
            >
              🎒 Manage Cargo
            </button>
          )}

          {!isReadOnly && gameState.phase === 'PRODUCTION' && hasResearchAvailable && onOpenResearch && (
            <button
              onClick={onOpenResearch}
              className="pointer-events-auto px-3 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-extrabold text-slate-950 bg-sky-400 hover:bg-sky-300 border border-sky-300 rounded-xl transition-colors shadow-lg whitespace-nowrap animate-pulse"
            >
              🧪 Research &amp; Upgrades
            </button>
          )}

          {!isReadOnly && gameState.phase === 'BUILDING' && selectedTransporter && (
            <>
              <button
                onClick={onOpenBuildMenu}
                className="pointer-events-auto px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-lg whitespace-nowrap"
              >
                🏗️ Build Workshop
              </button>
              <button
                onClick={onToggleBuildRoad}
                className={`pointer-events-auto px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-xl transition-colors border shadow-lg whitespace-nowrap ${
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
            className="pointer-events-auto min-h-[36px] sm:min-h-[40px] px-3.5 sm:px-5 py-1.5 sm:py-2.5 text-[11px] sm:text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xl hover:shadow-amber-400/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isObserving
              ? 'Observing (Read-Only)'
              : activePlayer?.resigned
              ? 'Resigned (View Only)'
              : getNextPhaseActionLabel(gameState.phase)}
          </button>
        </div>
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
