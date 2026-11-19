/**
 * Online Multiplayer Matchmaking & Lobby System for Roads & Boats
 */

import React, { useState, useEffect } from 'react';
import { MAP_PRESETS, ScenarioMapSetId } from '../game/maps';
import { SCENARIO_MAP_SETS } from '../game/scenarios';
import { BOT_PROFILES, DEFAULT_BOT_PROFILE_ID, isElevatedPrivilegedPlayer } from '../game/engine';
import { getSavedPlayerId } from '../utils/clientIdentity';

interface LobbyGameSummary {
  id: string;
  name: string;
  mapName: string;
  status: 'waiting' | 'playing' | 'finished';
  round: number;
  phase: string;
  playerCount: number;
  activePlayerCount?: number;
  isSolitaire?: boolean;
  scenarioId?: string;
  creatorClientId?: string;
  creatorPlayerId?: string;
  hostName?: string;
  players: Array<{
    id: string;
    name: string;
    color: string;
    isAI: boolean;
    isHost?: boolean;
    resigned?: boolean;
  }>;
  updatedAt: number;
}

interface MultiplayerLobbyProps {
  clientId: string;
  onJoinGame: (gameId: string, playerName: string) => void;
  onObserveGame: (gameId: string) => void;
  onCreateGame: (
    name: string,
    mapName: string,
    hostName: string,
    fillWithBots: boolean,
    botProfileId?: string
  ) => void;
  onDeleteGame: (gameId: string) => Promise<boolean> | void;
  onRenameGame?: (gameId: string, newName: string) => Promise<boolean | void> | void;
  onStartTutorial: () => void;
  onOpenPlayerAid: () => void;
  onOpenSolitaire?: () => void;
  onOpenGameRules?: () => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  clientId,
  onJoinGame,
  onObserveGame,
  onCreateGame,
  onDeleteGame,
  onRenameGame,
  onStartTutorial,
  onOpenPlayerAid,
  onOpenSolitaire,
  onOpenGameRules,
}) => {
  const [gamesList, setGamesList] = useState<LobbyGameSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState<string>('');
  const [savingRenameId, setSavingRenameId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('rb_player_name') || 'Merchant Prince';
  });

  // Modal / Form state for Creating Game
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGameName, setNewGameName] = useState('Realm of Iron & Timber');
  const [selectedMap, setSelectedMap] = useState('river_valley');
  const [createMapSetFilter, setCreateMapSetFilter] = useState<'all' | ScenarioMapSetId>('all');
  const [fillBots, setFillBots] = useState(true);
  const [selectedBotProfileId, setSelectedBotProfileId] = useState<string>(DEFAULT_BOT_PROFILE_ID);
  const [roomCodeInput, setRoomCodeInput] = useState('');

  const fetchGames = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/games');
      if (res.ok) {
        const data = await res.json();
        setGamesList(data.games || []);
      }
    } catch (err) {
      console.error('Failed to fetch games:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleNameChange = (val: string) => {
    setPlayerName(val);
    localStorage.setItem('rb_player_name', val);
  };

  const isSelectedMapSolo = selectedMap.startsWith('scenario_');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateGame(
      newGameName,
      selectedMap,
      playerName,
      isSelectedMapSolo ? false : fillBots,
      isSelectedMapSolo || !fillBots ? undefined : selectedBotProfileId
    );
    setShowCreateModal(false);
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = roomCodeInput.trim();
    if (cleaned) {
      onJoinGame(cleaned, playerName);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard?.writeText(code);
      setCopiedCodeId(code);
      setTimeout(() => {
        setCopiedCodeId(prev => (prev === code ? null : prev));
      }, 1800);
    } catch {
      // Fallback: pre-fill input if clipboard unavailable
      setRoomCodeInput(code);
    }
  };

  const handleConfirmDelete = async (gameId: string) => {
    setDeletingId(gameId);
    try {
      const deleted = await onDeleteGame(gameId);
      if (deleted) {
        setGamesList(prev => prev.filter(g => g.id !== gameId));
        setConfirmDeleteId(null);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleConfirmRename = async (e: React.FormEvent, gameId: string, currentName: string) => {
    e.preventDefault();
    if (!onRenameGame || savingRenameId) return;
    const trimmed = renameInput.trim();
    if (!trimmed || trimmed === currentName) {
      setRenamingId(null);
      return;
    }
    setSavingRenameId(gameId);
    try {
      const ok = await onRenameGame(gameId, trimmed);
      if (ok !== false) {
        setGamesList(prev => prev.map(item => (item.id === gameId ? { ...item, name: trimmed } : item)));
        setRenamingId(null);
      }
    } finally {
      setSavingRenameId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar following Top Bar Contract */}
      <header className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 px-3 sm:px-6 lg:px-8 py-3 sm:py-4 border-b border-slate-800 bg-slate-950/85 backdrop-blur sticky top-0 z-30">
        <div className="flex items-center justify-between gap-3 w-full sm:w-auto">
          <a href="/" className="text-lg sm:text-xl font-bold font-serif-title tracking-tight text-amber-200 whitespace-nowrap shrink-0">
            Roads & Boats
          </a>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 min-w-0">
            <span className="hidden md:inline shrink-0">Player Name:</span>
            <input
              type="text"
              value={playerName}
              onChange={e => handleNameChange(e.target.value)}
              aria-label="Player Name"
              className="w-36 sm:w-44 px-2.5 sm:px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs font-semibold focus:outline-none focus:border-amber-400"
              placeholder="Your sovereign name"
              maxLength={24}
            />
            {isElevatedPrivilegedPlayer(playerName) && (
              <span
                className="px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/60 text-amber-300 text-[10px] font-bold tracking-wide shrink-0"
                title="Elevated privileges: can delete any game"
              >
                🛡️ <span className="hidden sm:inline">Elevated</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full xl:w-auto">
          {onOpenSolitaire && (
            <button
              onClick={onOpenSolitaire}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-amber-300 hover:text-white bg-amber-950/60 border border-amber-600/70 hover:bg-amber-900 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow"
              title="Official Roads & Boats Pre-Made Scenarios (1-Player Solo, Splotter Scenario Book & 1–2P Maps)"
            >
              <span>🗺️</span>
              <span>Pre-Made Scenarios</span>
            </button>
          )}
          <button
            onClick={onOpenPlayerAid}
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-amber-300 hover:text-white bg-slate-900 border border-amber-600/60 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            title="Open Buildings & Vehicles Player Aid Reference Card"
          >
            <span>📋</span>
            <span>Player Aid</span>
          </button>
          <button
            onClick={onStartTutorial}
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-amber-300 hover:text-white bg-amber-950/60 border border-amber-800/60 hover:bg-amber-900 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <span>🎓</span>
            <span>Tutorial</span>
          </button>
          {onOpenGameRules && (
            <button
              onClick={onOpenGameRules}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-slate-200 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow"
              title="Open Roads & Boats Game Rules & Rulebook"
            >
              <span>📖</span>
              <span>Game Rules</span>
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow sm:ml-auto xl:ml-0"
          >
            + Create Match
          </button>
        </div>
      </header>

      {/* Compact Title Section (No Background Image) */}
      <div className="relative border-b border-slate-800 bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col items-center text-center">
          <p className="text-[11px] uppercase tracking-widest text-amber-400 font-bold mb-1">
            The Digital Adaptation of Splotter Spellen's Masterpiece
          </p>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold font-serif-title text-white max-w-3xl leading-tight">
            Transport, Logistics & The Great Wonder
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-2xl leading-snug">
            Command pack donkeys, wagons, and river barges across a vibrant hexagonal landscape. Harvest timber, quarry stone, erect factories, and race to construct the Wonder of the World.
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
            >
              🌐 Host Multiplayer Lobby
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Matchmaking & Room Browser */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-10 w-full flex-1 flex flex-col gap-6 sm:gap-8">
        {/* Join by Direct Code Bar */}
        <div className="p-3.5 sm:p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl shrink-0">🔑</span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">Join by Game Code</p>
              <p className="text-xs text-slate-400">Enter an 8-digit hex game code from a friend (e.g. A1B2C3D4)</p>
            </div>
          </div>
          <form onSubmit={handleJoinByCode} className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={roomCodeInput}
              onChange={e => setRoomCodeInput(e.target.value)}
              placeholder="Paste Match ID here..."
              className="px-3 py-2 sm:py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono uppercase tracking-wider text-white focus:outline-none focus:border-amber-400 w-full sm:w-48 md:w-52"
            />
            <button
              type="submit"
              className="flex-1 sm:flex-initial px-4 py-2 sm:py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap"
            >
              Join / Resume
            </button>
            <button
              type="button"
              onClick={() => {
                const cleaned = roomCodeInput.trim();
                if (cleaned) onObserveGame(cleaned);
              }}
              className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 text-xs font-semibold text-sky-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              👁️ Observe
            </button>
          </form>
        </div>

        {/* Public Games List */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-serif-title text-white">Active Matchmaking Lobbies</h2>
                <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono text-amber-300">
                  {gamesList.length} {gamesList.length === 1 ? 'game' : 'games'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Join an ongoing match or observe online sessions (10 visible rows · scrollable)</p>
            </div>
            <button
              onClick={fetchGames}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors shrink-0"
            >
              {isLoading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>

          {gamesList.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col items-center gap-3">
              <span className="text-4xl">🏕️</span>
              <p className="text-base font-semibold text-slate-300">No active public sessions right now</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Create a match to play solo against intelligent AI bots or invite friends to join your logistics empire.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg"
              >
                Create the First Match
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-900 border border-slate-800/90 shadow-lg overflow-hidden">
              {/* Vertically sized 10-game board: 40px sticky header + 10 x 44px rows = 480px with vertical scrollbar */}
              <div className="h-[480px] overflow-y-scroll lobby-scrollbar">
                {/* Sticky Single-Row Header */}
                <div className="sticky top-0 z-10 flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 h-[40px] box-border bg-slate-950/95 backdrop-blur border-b border-slate-800 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <div className="w-[74px] sm:w-28 shrink-0">Code</div>
                  <div className="flex-1 min-w-0">Match</div>
                  <div className="w-36 hidden md:block shrink-0">Map</div>
                  <div className="w-56 hidden sm:block shrink-0">Players</div>
                  <div className="w-32 hidden lg:block shrink-0">Progress</div>
                  <div className="w-auto sm:w-64 shrink-0 text-right">Actions</div>
                </div>

                {gamesList.map(g => {
                  const mapSpec = MAP_PRESETS[g.mapName] || MAP_PRESETS.river_valley;
                  const isSolo = Boolean(g.isSolitaire || g.mapName.startsWith('scenario_'));
                  const visiblePlayers = isSolo ? g.players.slice(0, 1) : g.players;
                  const savedPlayerId = getSavedPlayerId(g.id);
                  const myExistingPlayer = g.players.find(
                    p =>
                      (savedPlayerId && p.id === savedPlayerId) ||
                      p.name.trim().toLowerCase() === playerName.trim().toLowerCase()
                  );
                  const isElevated = isElevatedPrivilegedPlayer(playerName);
                  const isCreator = Boolean(
                    (g.creatorClientId && g.creatorClientId === clientId) ||
                      (g.creatorPlayerId && savedPlayerId === g.creatorPlayerId)
                  );
                  const canDelete = isElevated || isCreator;
                  const canRename =
                    isElevated || isCreator || Boolean(myExistingPlayer && !myExistingPlayer.resigned);
                  const isResigned = Boolean(myExistingPlayer?.resigned);
                  const isFullForNewJoiner = !isSolo && !myExistingPlayer && g.playerCount >= 4;
                  const joinLabel = isSolo
                    ? 'Resume'
                    : isResigned
                    ? 'Resigned'
                    : myExistingPlayer
                    ? 'Resume'
                    : isFullForNewJoiner
                    ? 'Full'
                    : 'Join';

                  return (
                    <div
                      key={g.id}
                      className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 h-[44px] box-border border-b border-slate-800/70 hover:bg-slate-800/45 transition-colors"
                    >
                      {/* Game Code */}
                      <div className="w-[74px] sm:w-28 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(g.id)}
                          className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-slate-950 border border-slate-700/80 hover:border-amber-400/70 text-[10px] sm:text-[11px] font-mono text-amber-200 transition-colors max-w-full"
                          title="Copy 8-digit hex Game Code"
                        >
                          <span className="font-bold tracking-wider truncate">{g.id}</span>
                          <span className="hidden sm:inline text-[10px] text-slate-400">
                            {copiedCodeId === g.id ? '✓' : '📋'}
                          </span>
                        </button>
                      </div>

                      {/* Match Title */}
                      <div className="flex-1 min-w-0 flex items-center gap-1 sm:gap-1.5 overflow-hidden">
                        {renamingId === g.id ? (
                          <form
                            onSubmit={e => handleConfirmRename(e, g.id, g.name)}
                            className="flex items-center gap-1 w-full"
                          >
                            <input
                              type="text"
                              value={renameInput}
                              onChange={e => setRenameInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Escape') setRenamingId(null);
                              }}
                              maxLength={40}
                              autoFocus
                              disabled={savingRenameId === g.id}
                              className="flex-1 min-w-0 px-2 py-0.5 text-xs font-bold text-white bg-slate-950 border border-amber-400 rounded focus:outline-none"
                              placeholder="Enter game name..."
                            />
                            <button
                              type="submit"
                              disabled={savingRenameId === g.id || !renameInput.trim()}
                              className="px-1.5 py-0.5 text-[10px] font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded shrink-0 disabled:opacity-50"
                              title="Save game name"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => setRenamingId(null)}
                              disabled={savingRenameId === g.id}
                              className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-300 hover:text-white bg-slate-800 rounded shrink-0"
                              title="Cancel rename"
                            >
                              ✕
                            </button>
                          </form>
                        ) : (
                          <>
                            <span className="text-xs font-bold text-white truncate">
                              {g.name}
                            </span>
                            {canRename && onRenameGame && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRenamingId(g.id);
                                  setRenameInput(g.name);
                                }}
                                className="text-[11px] text-slate-400 hover:text-amber-300 transition-colors shrink-0 px-0.5"
                                title="Name / rename this game"
                              >
                                ✏️
                              </button>
                            )}
                            {isSolo && (
                              <span className="text-[9px] font-mono font-semibold text-amber-300 bg-amber-950/70 border border-amber-700/50 px-1.5 py-0.2 rounded shrink-0">
                                1P Solo
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Map */}
                      <div className="w-36 hidden md:block shrink-0 text-xs text-amber-300/80 truncate">
                        {mapSpec.name}
                      </div>

                      {/* Players */}
                      <div className="w-56 hidden sm:flex items-center gap-1.5 shrink-0 overflow-hidden">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 shrink-0">
                          {isSolo ? '1/1' : `${g.playerCount}/4`}
                        </span>
                        <div className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-[11px] text-slate-300 truncate">
                          {visiblePlayers.map((p, idx) => (
                            <span
                              key={p.id}
                              className={`inline-flex items-center gap-1 shrink-0 ${
                                p.resigned ? 'opacity-50 line-through text-rose-300' : ''
                              }`}
                            >
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: p.color }}
                              />
                              <span className="max-w-[76px] truncate">{p.name}</span>
                              {idx < visiblePlayers.length - 1 && (
                                <span className="text-slate-600">,</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Round & Status */}
                      <div className="w-32 hidden lg:flex items-center gap-1.5 shrink-0 text-[11px] whitespace-nowrap">
                        <span className="text-slate-400 font-mono">R{g.round}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-300 truncate max-w-[68px]">{g.phase}</span>
                      </div>

                      {/* Actions: Join/Resume, Observe, Delete */}
                      <div className="w-auto sm:w-64 shrink-0 flex items-center justify-end gap-1 sm:gap-1.5">
                        <button
                          onClick={() => onJoinGame(g.id, playerName)}
                          disabled={isResigned || isFullForNewJoiner}
                          className="px-2 sm:px-2.5 py-1.5 sm:py-1 text-[11px] font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed whitespace-nowrap"
                          title={
                            isResigned
                              ? 'You resigned from this match — click Observe to watch'
                              : isFullForNewJoiner
                              ? 'Match is full — click Observe to watch'
                              : isSolo || myExistingPlayer
                              ? 'Resume this match as a player'
                              : 'Join this match as a player'
                          }
                        >
                          {joinLabel}
                        </button>

                        <button
                          onClick={() => onObserveGame(g.id)}
                          className="px-2 sm:px-2.5 py-1.5 sm:py-1 text-[11px] font-semibold text-sky-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
                          title="Observe this match in read-only spectator mode"
                          aria-label={`Observe ${g.name}`}
                        >
                          👁️<span className="hidden sm:inline"> Observe</span>
                        </button>

                        {canDelete && (
                          confirmDeleteId === g.id ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleConfirmDelete(g.id)}
                                disabled={deletingId === g.id}
                                className="px-2 py-1.5 sm:py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors disabled:opacity-60"
                              >
                                {deletingId === g.id ? '...' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                disabled={deletingId === g.id}
                                className="px-1.5 py-1.5 sm:py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                title="Cancel delete"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(g.id)}
                              className="px-2 py-1.5 sm:py-1 text-[11px] font-semibold text-rose-300 hover:text-white bg-rose-950/50 border border-rose-800/70 hover:bg-rose-900/70 rounded-lg transition-colors shrink-0"
                              title={
                                isElevated && !isCreator
                                  ? 'Delete any match (Elevated privilege: John Burt)'
                                  : 'Delete this match permanently (Starter only)'
                              }
                              aria-label={`Delete ${g.name}`}
                            >
                              🗑️
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Game Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white font-serif-title">Create New Match</h3>
                <p className="text-[11px] text-slate-400">
                  Choose from Classic Multiplayer, Splotter Scenario Book (`roads_and_boats_splotter_maps.pdf`), 1–2P Maps (`r&b_-_1-2...`), or Pre-Made Solo Scenarios
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                aria-label="Close Create Match"
                className="w-9 h-9 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center shrink-0"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Game Name
                </label>
                <input
                  type="text"
                  required
                  value={newGameName}
                  onChange={e => setNewGameName(e.target.value)}
                  placeholder="Enter game name..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  maxLength={40}
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Scenario Map Set
                  </label>
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCreateMapSetFilter('all')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                        createMapSetFilter === 'all'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      All ({Object.keys(MAP_PRESETS).length})
                    </button>
                    {SCENARIO_MAP_SETS.map(ms => (
                      <button
                        type="button"
                        key={ms.id}
                        onClick={() => setCreateMapSetFilter(ms.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                          createMapSetFilter === ms.id
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {ms.icon} {ms.shortName}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {Object.values(MAP_PRESETS)
                    .filter(
                      m =>
                        createMapSetFilter === 'all' ||
                        (m.mapSetId || 'solitaire_compendium') === createMapSetFilter
                    )
                    .map(m => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setSelectedMap(m.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selectedMap === m.id
                            ? 'bg-amber-950/40 border-amber-400 text-white'
                            : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold truncate">{m.name}</p>
                          <span className="text-[9px] font-mono text-amber-300 shrink-0">
                            {m.recommendedPlayers}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                          {m.description}
                        </p>
                        {(m.author || m.publisher) && (
                          <p className="text-[9px] text-slate-400 font-mono mt-1 truncate">
                            {m.author ? `${m.author} · ` : ''}
                            {m.publisher || 'Splotter Spellen'}
                          </p>
                        )}
                      </button>
                    ))}
                </div>

                {/* Selected Map Attribution & Scenario Notes Box */}
                {MAP_PRESETS[selectedMap] && (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-amber-300">
                        {MAP_PRESETS[selectedMap].name} ({MAP_PRESETS[selectedMap].recommendedPlayers})
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {MAP_PRESETS[selectedMap].author
                          ? `Author: ${MAP_PRESETS[selectedMap].author} · `
                          : ''}
                        Publisher: {MAP_PRESETS[selectedMap].publisher || 'Splotter Spellen'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      {MAP_PRESETS[selectedMap].description}
                    </p>
                    {MAP_PRESETS[selectedMap].scenarioNotes &&
                      MAP_PRESETS[selectedMap].scenarioNotes!.length > 0 && (
                        <ul className="text-[11px] text-slate-400 space-y-0.5 pt-1">
                          {MAP_PRESETS[selectedMap].scenarioNotes!.slice(0, 2).map((note, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-amber-400 font-bold">›</span>
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>
                )}
              </div>

              <div className="pt-2 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="fillBots"
                    checked={isSelectedMapSolo ? false : fillBots}
                    disabled={isSelectedMapSolo}
                    onChange={e => setFillBots(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700 focus:ring-0 disabled:opacity-40"
                  />
                  <label
                    htmlFor="fillBots"
                    className={`text-xs ${isSelectedMapSolo ? 'text-slate-500' : 'text-slate-300 cursor-pointer'}`}
                  >
                    Include an AI Bot Opponent
                  </label>
                </div>

                {!isSelectedMapSolo && fillBots && (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Choose AI Opponent Profile
                    </label>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {BOT_PROFILES.map(bot => (
                        <button
                          type="button"
                          key={bot.id}
                          onClick={() => setSelectedBotProfileId(bot.id)}
                          className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                            selectedBotProfileId === bot.id
                              ? 'bg-amber-950/40 border-amber-400 text-white'
                              : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-white">{bot.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300">
                              {bot.difficulty} · {bot.focus}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 leading-snug">{bot.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isSelectedMapSolo && (
                  <p className="text-[11px] text-amber-300/90 mt-1.5">
                    Pre-Made Solo map selected: strictly 1 human player only (zero bots, no additional players can join).
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow"
                >
                  Launch Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
