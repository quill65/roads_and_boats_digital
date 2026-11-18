/**
 * Roads & Boats - Main Application Container & Real-Time Controller
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  BuildingType,
  GameAction,
  GameState,
  GoodType,
} from './game/types';
import {
  canDeleteMatch,
  getProductionCargoCandidates,
  TransporterProductionCandidate,
  willAdvanceFromWonderRunProduction,
} from './game/engine';
import { getEdgeKey, parseHexKey } from './game/hexMath';
import { HexBoard } from './components/HexBoard';
import { GameHUD } from './components/GameHUD';
import { TransporterCargoModal } from './components/TransporterCargoModal';
import { BuildMenuModal } from './components/BuildMenuModal';
import { WonderPyramidModal } from './components/WonderPyramidModal';
import { ProductionCargoPromptModal } from './components/ProductionCargoPromptModal';
import { AlmanacModal } from './components/AlmanacModal';
import { PlayerAidModal } from './components/PlayerAidModal';
import { TutorialDrawer } from './components/TutorialDrawer';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { RevertHistoryDrawer } from './components/RevertHistoryDrawer';
import { TestSimulationModal } from './components/TestSimulationModal';
import { SolitaireModal } from './components/SolitaireModal';
import { DriveRulesComparatorModal } from './components/DriveRulesComparatorModal';
import { SolitaireScenario } from './game/scenarios';
import { sounds } from './utils/soundEffects';
import {
  clearSavedPlayerId,
  getClientId,
  getSavedPlayerId,
  savePlayerId,
} from './utils/clientIdentity';

export default function App() {
  // Screen state: 'lobby' | 'game'
  const [screen, setScreen] = useState<'lobby' | 'game'>('lobby');
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [activePlayerId, setActivePlayerId] = useState<string>('');

  // Selection states
  const [selectedTransporterId, setSelectedTransporterId] = useState<string | null>(null);
  const [selectedHexId, setSelectedHexId] = useState<string | null>(null);
  const [buildMode, setBuildMode] = useState<'none' | 'road' | 'factory' | 'wonder'>('none');

  // Modals & Drawers
  const [showCargoModal, setShowCargoModal] = useState(false);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [showWonderModal, setShowWonderModal] = useState(false);
  const [showAlmanacModal, setShowAlmanacModal] = useState(false);
  const [showPlayerAidModal, setShowPlayerAidModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSolitaireModal, setShowSolitaireModal] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showTestSuite, setShowTestSuite] = useState(false);
  const [showDriveRulesModal, setShowDriveRulesModal] = useState(false);
  const [productionCargoPrompt, setProductionCargoPrompt] = useState<TransporterProductionCandidate[] | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [originalMatchId, setOriginalMatchId] = useState<string | null>(null);
  const [isObserving, setIsObserving] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const isObservingRef = useRef(false);
  isObservingRef.current = isObserving;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
  };

  // Connect to SSE real-time stream when activeGameId is set
  useEffect(() => {
    if (!activeGameId) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sse = new EventSource(`/api/games/${activeGameId}/stream`);
    eventSourceRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.deleted) {
          clearSavedPlayerId(payload.gameId || activeGameId);
          sse.close();
          setActiveGameId(null);
          setGameState(null);
          setActivePlayerId('');
          setIsObserving(false);
          setSelectedTransporterId(null);
          setSelectedHexId(null);
          setScreen('lobby');
          showToast(payload.reason || 'Match was removed.');
          return;
        }
        const freshState = payload as GameState;
        setGameState(freshState);
        if (!isObservingRef.current && freshState.isSolitaire && freshState.players[0]?.id) {
          setActivePlayerId(freshState.players[0].id);
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    sse.onerror = () => {
      // Stream reconnection handled automatically by browser EventSource
    };

    return () => {
      sse.close();
    };
  }, [activeGameId]);

  // Execute an action against the backend API
  const sendGameAction = async (action: GameAction) => {
    if (!activeGameId) return false;
    if (isObservingRef.current) {
      showToast('Observer mode is read-only. Join or resume a match to play.');
      return false;
    }

    try {
      const res = await fetch(`/api/games/${activeGameId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...action, playerId: activePlayerId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.reason || 'Action not permitted by game rules');
        return false;
      }

      if (data.game) {
        setGameState(data.game);
      }
      return true;
    } catch (err) {
      console.error('Failed to execute game action:', err);
      showToast('Network error processing move');
      return false;
    }
  };

  // Handlers for player actions
  const handleMoveTransporter = async (
    transporterId: string,
    targetHexId: string,
    targetSide?: number
  ) => {
    const success = await sendGameAction({
      type: 'MOVE_TRANSPORTER',
      transporterId,
      targetHexId,
      targetSide,
    });
    if (success) {
      sounds.playMove();
      setSelectedHexId(targetHexId);
    }
  };

  const handlePickupGoods = async (
    transporterId: string,
    good: GoodType,
    amount: number,
    targetSide?: number
  ) => {
    const success = await sendGameAction({
      type: 'PICKUP_GOODS',
      transporterId,
      good,
      amount,
      targetSide,
    });
    if (success) {
      sounds.playPickup();
    }
  };

  const handleDropGoods = async (
    transporterId: string,
    good: GoodType,
    amount: number,
    targetSide?: number
  ) => {
    const success = await sendGameAction({
      type: 'DROP_GOODS',
      transporterId,
      good,
      amount,
      targetSide,
    });
    if (success) {
      sounds.playDrop();
    }
  };

  const handleBuildRoadEdge = async (hexA: string, hexB: string) => {
    if (!selectedTransporterId) {
      showToast('Please select a builder transporter first');
      return;
    }

    const transporter = gameState?.transporters[selectedTransporterId];
    if (!transporter || !gameState) return;

    const coordA = parseHexKey(hexA);
    const coordB = parseHexKey(hexB);
    const edgeKey = getEdgeKey(coordA.q, coordA.r, coordB.q, coordB.r);
    const edge = gameState.edges[edgeKey];
    const isBridge = Boolean(edge?.isRiver);
    // Official rules: Bridges require strictly 2 Boards; Land Roads require strictly 1 Stone
    const material: 'boards' | 'stone' = isBridge ? 'boards' : 'stone';

    const success = await sendGameAction({
      type: 'BUILD_ROAD',
      hexA,
      hexB,
      material,
      transporterId: selectedTransporterId,
    });

    if (success) {
      sounds.playBuild();
      setBuildMode('none');
      showToast(isBridge ? 'Bridge constructed (2 Boards)!' : 'Road paved (1 Stone)!');
    }
  };

  const handleBuildFactory = async (
    hexId: string,
    buildingType: BuildingType,
    transporterId: string
  ) => {
    const success = await sendGameAction({
      type: 'BUILD_FACTORY',
      hexId,
      buildingType,
      transporterId,
    });

    if (success) {
      sounds.playBuild();
      showToast(`Factory constructed on hex (${hexId})`);
    }
  };

  const handleResearchTech = async (
    hexId: string,
    techId: string,
    transporterId: string
  ) => {
    const success = await sendGameAction({
      type: 'RESEARCH_TECH',
      hexId,
      techId,
      transporterId,
    });

    if (success) {
      if (sounds.playWonderFanfare) {
        sounds.playWonderFanfare();
      } else {
        sounds.playBuild();
      }
      showToast('Technological Breakthrough! (2 Geese + 1 Paper consumed)');
    }
  };

  const handleReplenishMine = async (hexId: string, transporterId: string) => {
    const success = await sendGameAction({
      type: 'REPLENISH_MINE',
      hexId,
      transporterId,
    });

    if (success) {
      sounds.playBuild();
      showToast(`New Mine Shaft sunk at hex (${hexId}) — ore pool restored!`);
    }
  };

  const handleContributeWonder = async (transporterId: string, amount: number) => {
    const success = await sendGameAction({
      type: 'BUILD_WONDER',
      transporterId,
      amount,
    });

    if (success) {
      sounds.playWonderFanfare();
      showToast('Brick contributed to the Wonder of the World!');
    }
  };

  const handleAdvancePhase = async () => {
    if (
      gameState &&
      activePlayerId &&
      !isObservingRef.current &&
      gameState.phase === 'WONDER' &&
      willAdvanceFromWonderRunProduction(gameState)
    ) {
      const candidates = getProductionCargoCandidates(gameState, activePlayerId);
      if (candidates.length > 0) {
        setProductionCargoPrompt(candidates);
        return;
      }
    }

    const success = await sendGameAction({
      type: 'ADVANCE_PHASE',
    });
    if (success) {
      sounds.playPhaseAdvance();
      setBuildMode('none');
    }
  };

  const handleConfirmAdvanceWithProductionCargo = async (
    allowTransporterCargo: boolean | string[]
  ) => {
    setProductionCargoPrompt(null);
    const success = await sendGameAction({
      type: 'ADVANCE_PHASE',
      allowTransporterCargo,
    });
    if (success) {
      sounds.playPhaseAdvance();
      setBuildMode('none');
    }
  };

  const handleUndoMove = async () => {
    const success = await sendGameAction({
      type: 'UNDO_MOVE',
    });
    if (success) {
      sounds.playMove();
      showToast('Reverted 1 move choice');
    }
  };

  const handleRedoMove = async () => {
    const success = await sendGameAction({
      type: 'REDO_MOVE',
    });
    if (success) {
      sounds.playMove();
      showToast('Redid reverted move');
    }
  };

  const handleRevertToHistory = async (targetIndex: number) => {
    const success = await sendGameAction({
      type: 'REVERT_TO_HISTORY',
      targetIndex,
    });
    if (success) {
      sounds.playPhaseAdvance();
      showToast(`Reverted game state back to move #${targetIndex + 1}`);
      setShowHistoryDrawer(false);
    }
  };

  // Global keyboard shortcuts: Ctrl+Z (Undo) and Ctrl+Y (Redo)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedoMove();
        } else {
          handleUndoMove();
        }
      } else if (cmdOrCtrl && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedoMove();
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [gameState, activeGameId]);

  // Lobby actions
  const handleJoinGame = async (gameId: string, playerName: string) => {
    const cleanCode = gameId.trim();
    if (!cleanCode) {
      showToast('Please enter a valid 8-digit hex game code');
      return;
    }

    try {
      const clientId = getClientId();
      const savedPlayerId = getSavedPlayerId(cleanCode);
      const res = await fetch(`/api/games/${encodeURIComponent(cleanCode)}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, clientId, playerId: savedPlayerId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Match code not found or unable to join');
        return;
      }

      const data = await res.json();
      const joinedId = data.player?.id || data.game.players[0]?.id || '';
      if (joinedId) savePlayerId(data.game.id, joinedId);
      setIsObserving(false);
      setGameState(data.game);
      setActiveGameId(data.game.id);
      setActivePlayerId(joinedId);
      setScreen('game');
      if (data.game?.isSolitaire) {
        showToast(`Resumed solo session as ${data.player?.name || data.game.players[0]?.name || 'Solo Sovereign'}`);
      } else if (data.alreadyResigned) {
        showToast(`You have resigned from this match as ${data.player?.name || playerName} (view-only).`);
      } else if (data.reconnected) {
        showToast(`Reconnected as ${data.player?.name || playerName}`);
      }
    } catch (err) {
      console.error(err);
      showToast('Connection failed');
    }
  };

  const handleObserveGame = async (gameId: string) => {
    const cleanCode = gameId.trim();
    if (!cleanCode) {
      showToast('Please enter a valid 8-digit hex game code');
      return;
    }

    try {
      const res = await fetch(`/api/games/${encodeURIComponent(cleanCode)}?observe=1`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Match code not found');
        return;
      }

      const data = await res.json();
      setIsObserving(true);
      setActivePlayerId('');
      setSelectedTransporterId(null);
      setSelectedHexId(null);
      setBuildMode('none');
      setGameState(data.game);
      setActiveGameId(data.game.id);
      setScreen('game');
      showToast(`Observing "${data.game.name}" (read-only)`);
    } catch (err) {
      console.error(err);
      showToast('Failed to observe match');
    }
  };

  const handleCreateGame = async (
    name: string,
    mapName: string,
    hostName: string,
    fillWithBots: boolean,
    botProfileId?: string
  ) => {
    try {
      const clientId = getClientId();
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          mapName,
          hostName,
          fillWithBots,
          botProfileId,
          creatorClientId: clientId,
        }),
      });

      if (!res.ok) {
        showToast('Failed to create match');
        return;
      }

      const data = await res.json();
      const starterId = data.game.players[0]?.id || '';
      if (starterId) savePlayerId(data.game.id, starterId);
      setIsObserving(false);
      setGameState(data.game);
      setActiveGameId(data.game.id);
      setActivePlayerId(starterId);
      setScreen('game');
    } catch (err) {
      console.error(err);
      showToast('Error launching match');
    }
  };

  const handleResignMatch = async () => {
    if (!activeGameId) return;
    try {
      const res = await fetch(`/api/games/${activeGameId}/resign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: activePlayerId,
          clientId: getClientId(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.reason || 'Unable to resign match');
        return;
      }

      if (data.removed) {
        clearSavedPlayerId(activeGameId);
      } else if (activePlayerId) {
        savePlayerId(activeGameId, activePlayerId);
      }
      if (eventSourceRef.current) eventSourceRef.current.close();
      setActiveGameId(null);
      setGameState(null);
      setActivePlayerId('');
      setSelectedTransporterId(null);
      setSelectedHexId(null);
      setBuildMode('none');
      setScreen('lobby');
      showToast(
        data.removed
          ? 'You resigned. No active players remain — match removed.'
          : 'You resigned from the match.'
      );
    } catch (err) {
      console.error('Failed to resign game:', err);
      showToast('Failed to resign match');
    }
  };

  const handleDeleteGame = async (targetGameId: string): Promise<boolean> => {
    try {
      const activePlayerName =
        (targetGameId === activeGameId
          ? gameState?.players.find(p => p.id === activePlayerId)?.name
          : undefined) ||
        localStorage.getItem('rb_player_name') ||
        undefined;
      const res = await fetch(`/api/games/${targetGameId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: getClientId(),
          playerId: targetGameId === activeGameId ? activePlayerId : getSavedPlayerId(targetGameId),
          playerName: activePlayerName,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        showToast(data.error || 'Only the player who started this match can delete it.');
        return false;
      }

      clearSavedPlayerId(targetGameId);
      if (targetGameId === activeGameId) {
        if (eventSourceRef.current) eventSourceRef.current.close();
        setActiveGameId(null);
        setGameState(null);
        setActivePlayerId('');
        setSelectedTransporterId(null);
        setSelectedHexId(null);
        setBuildMode('none');
        setScreen('lobby');
      }
      showToast('Match deleted permanently.');
      return true;
    } catch (err) {
      console.error('Failed to delete game:', err);
      showToast('Error deleting match');
      return false;
    }
  };

  const handleRenameGame = async (targetGameId: string, newName: string): Promise<boolean> => {
    const trimmed = newName.trim().slice(0, 40);
    if (!trimmed) {
      showToast('Game name cannot be empty.');
      return false;
    }
    try {
      const activePlayerName =
        (targetGameId === activeGameId
          ? gameState?.players.find(p => p.id === activePlayerId)?.name
          : undefined) ||
        localStorage.getItem('rb_player_name') ||
        undefined;
      const res = await fetch(`/api/games/${targetGameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
          clientId: getClientId(),
          playerId: targetGameId === activeGameId ? activePlayerId : getSavedPlayerId(targetGameId),
          playerName: activePlayerName,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        showToast(data.error || 'Unable to rename game');
        return false;
      }
      if (targetGameId === activeGameId && data.game) {
        setGameState(data.game);
      }
      showToast(`Game named "${trimmed}"`);
      return true;
    } catch (err) {
      console.error('Failed to rename game:', err);
      showToast('Error renaming game');
      return false;
    }
  };

  const handleStartTutorial = async () => {
    if (screen === 'lobby' || !gameState) {
      handleCreateGame('Interactive Tutorial Valley', 'tutorial_meadow', 'Apprentice Builder', true);
    }
    setShowTutorial(true);
  };

  const handleLoadTutorialMap = (mapId: string) => {
    if (activeGameId && !originalMatchId) {
      setOriginalMatchId(activeGameId);
    }
    handleCreateGame('Tutorial Practice', mapId, 'Apprentice Builder', true);
    showToast('Loaded Tutorial Practice Board. Use "Return to My Match" anytime to resume your match.');
  };

  const handleReturnToOriginalMatch = async () => {
    if (!originalMatchId) return;
    try {
      const res = await fetch(`/api/games/${originalMatchId}`);
      if (res.ok) {
        const data = await res.json();
        setIsObserving(false);
        setGameState(data.game);
        setActiveGameId(data.game.id);
        setActivePlayerId(getSavedPlayerId(data.game.id) || data.game.players[0]?.id || '');
        setOriginalMatchId(null);
        showToast('Returned to your active game match!');
        return;
      }
      showToast('Could not reload original game match');
    } catch (err) {
      console.error(err);
      showToast('Failed to return to game match');
    }
  };

  const handleStartSolitaireScenario = async (
    scenario: SolitaireScenario,
    customNameOrOptions?:
      | string
      | {
          customName?: string;
          isSolitaire?: boolean;
          fillWithBots?: boolean;
          botProfileId?: string;
        }
  ) => {
    try {
      const playerName = localStorage.getItem('rb_player_name') || 'Solo Sovereign';
      const clientId = getClientId();
      const opts =
        typeof customNameOrOptions === 'string'
          ? { customName: customNameOrOptions }
          : customNameOrOptions || {};
      const isStrictlySolo = Boolean(
        scenario.isSolitaireOnly || scenario.mapPresetId.startsWith('scenario_')
      );
      const isSolitaire =
        typeof opts.isSolitaire === 'boolean' ? opts.isSolitaire : isStrictlySolo;
      const fillWithBots = isSolitaire ? false : Boolean(opts.fillWithBots);
      const gameName = opts.customName?.trim() || scenario.name;
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: gameName,
          mapName: scenario.mapPresetId,
          hostName: playerName,
          isSolitaire,
          scenarioId: scenario.id,
          maxRounds: scenario.maxRounds,
          fillWithBots,
          botProfileId: fillWithBots ? opts.botProfileId : undefined,
          creatorClientId: clientId,
        }),
      });

      if (!res.ok) {
        showToast('Failed to initialize scenario match');
        return;
      }

      const data = await res.json();
      const starterId = data.game.players[0]?.id || '';
      if (starterId) savePlayerId(data.game.id, starterId);
      setIsObserving(false);
      setGameState(data.game);
      setActiveGameId(data.game.id);
      setActivePlayerId(starterId);
      setSelectedTransporterId(null);
      setSelectedHexId(data.game.players[0]?.homeHexId || null);
      setBuildMode('none');
      setShowSolitaireModal(false);
      setScreen('game');
      sounds.playPhaseAdvance();
      showToast(`Loaded ${scenario.name} (Turn 1): ${scenario.objective}`);
    } catch (err) {
      console.error(err);
      showToast('Error loading scenario');
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
  };

  const selectedTransporter =
    selectedTransporterId && gameState
      ? gameState.transporters[selectedTransporterId] || null
      : null;

  // Render Lobby screen if not in a game
  if (screen === 'lobby' || !gameState) {
    return (
      <>
        <MultiplayerLobby
          clientId={getClientId()}
          onJoinGame={handleJoinGame}
          onObserveGame={handleObserveGame}
          onCreateGame={handleCreateGame}
          onDeleteGame={handleDeleteGame}
          onRenameGame={handleRenameGame}
          onStartTutorial={handleStartTutorial}
          onOpenPlayerAid={() => setShowPlayerAidModal(true)}
          onOpenSolitaire={() => setShowSolitaireModal(true)}
          onOpenTestSuite={() => setShowTestSuite(true)}
          onOpenDriveRules={() => setShowDriveRulesModal(true)}
        />
        {toastMessage && (
          <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-1.5rem)] w-max px-4 sm:px-5 py-2.5 rounded-xl bg-slate-900/95 border border-amber-500/70 text-amber-200 text-xs font-semibold shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-2 text-center">
            <span className="shrink-0">⚠️</span>
            <span className="leading-snug">{toastMessage}</span>
          </div>
        )}
        {showPlayerAidModal && (
          <PlayerAidModal onClose={() => setShowPlayerAidModal(false)} />
        )}
        {showTestSuite && (
          <TestSimulationModal onClose={() => setShowTestSuite(false)} />
        )}
        {showDriveRulesModal && (
          <DriveRulesComparatorModal onClose={() => setShowDriveRulesModal(false)} />
        )}
        <SolitaireModal
          isOpen={showSolitaireModal}
          onClose={() => setShowSolitaireModal(false)}
          onSelectScenario={handleStartSolitaireScenario}
        />
      </>
    );
  }

  const currentPlayerName =
    gameState.players.find(p => p.id === activePlayerId)?.name ||
    localStorage.getItem('rb_player_name') ||
    undefined;
  const canDeleteActiveMatch = canDeleteMatch(gameState, {
    playerId: activePlayerId,
    clientId: getClientId(),
    playerName: currentPlayerName,
  });

  // Active Game Screen
  return (
    <div className="relative w-screen h-dvh overflow-hidden bg-slate-950 font-sans select-none">
      {/* Heads-Up Display Header & Bottom Bar */}
      <GameHUD
        gameState={gameState}
        activePlayerId={activePlayerId}
        isObserving={isObserving}
        selectedTransporter={selectedTransporter}
        selectedHexId={selectedHexId}
        buildMode={buildMode}
        onAdvancePhase={handleAdvancePhase}
        onOpenCargo={() => setShowCargoModal(true)}
        onOpenBuildMenu={() => setShowBuildModal(true)}
        onOpenWonder={() => setShowWonderModal(true)}
        onOpenAlmanac={() => setShowAlmanacModal(true)}
        onOpenTutorial={() => setShowTutorial(true)}
        onOpenPlayerAid={() => setShowPlayerAidModal(true)}
        onOpenSolitaire={() => setShowSolitaireModal(true)}
        onOpenHistory={() => setShowHistoryDrawer(true)}
        onOpenTestSuite={() => setShowTestSuite(true)}
        onUndo={handleUndoMove}
        onRedo={handleRedoMove}
        onLeaveMatch={() => {
          if (eventSourceRef.current) eventSourceRef.current.close();
          setActiveGameId(null);
          setGameState(null);
          setIsObserving(false);
          setScreen('lobby');
        }}
        onResignMatch={handleResignMatch}
        onDeleteMatch={canDeleteActiveMatch ? () => handleDeleteGame(gameState.id) : undefined}
        onRenameMatch={newName => handleRenameGame(gameState.id, newName)}
        canDeleteMatch={canDeleteActiveMatch}
        onToggleBuildRoad={() =>
          setBuildMode(prev => (prev === 'road' ? 'none' : 'road'))
        }
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        originalMatchId={originalMatchId}
        onReturnToOriginalMatch={handleReturnToOriginalMatch}
      />

      {/* Hexagonal Interactive Board */}
      <HexBoard
        gameState={gameState}
        activePlayerId={activePlayerId}
        selectedTransporterId={selectedTransporterId}
        selectedHexId={selectedHexId}
        buildMode={buildMode}
        onSelectTransporter={tId => {
          setSelectedTransporterId(tId);
          if (tId && gameState.transporters[tId]) {
            setSelectedHexId(gameState.transporters[tId].hexId);
          }
        }}
        onSelectHex={hId => {
          setSelectedHexId(hId);
          if (hId && buildMode !== 'road') {
            const cur = selectedTransporterId ? gameState.transporters[selectedTransporterId] : null;
            if (!cur || cur.ownerId !== activePlayerId || cur.hexId !== hId) {
              const ownedOnHex = Object.values(gameState.transporters).find(
                t => t.ownerId === activePlayerId && t.hexId === hId
              );
              if (ownedOnHex) {
                setSelectedTransporterId(ownedOnHex.id);
              }
            }
          }
        }}
        onMoveTransporter={handleMoveTransporter}
        onSelectEdgeForRoad={handleBuildRoadEdge}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-1.5rem)] w-max px-4 sm:px-5 py-2.5 rounded-xl bg-slate-900/95 border border-amber-500/70 text-amber-200 text-xs font-semibold shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-2 text-center">
          <span className="shrink-0">⚠️</span>
          <span className="leading-snug">{toastMessage}</span>
        </div>
      )}

      {/* Cargo Modal */}
      {showCargoModal && selectedTransporter && (
        <TransporterCargoModal
          gameState={gameState}
          transporter={selectedTransporter}
          onClose={() => setShowCargoModal(false)}
          onPickup={handlePickupGoods}
          onDrop={handleDropGoods}
        />
      )}

      {/* Construction / Build Modal */}
      {showBuildModal && selectedTransporter && (
        <BuildMenuModal
          gameState={gameState}
          activePlayerId={activePlayerId}
          selectedTransporter={selectedTransporter}
          onClose={() => setShowBuildModal(false)}
          onSelectTransporter={tId => setSelectedTransporterId(tId)}
          onBuildFactory={handleBuildFactory}
          onSelectRoadMode={() => setBuildMode('road')}
          onResearchTech={handleResearchTech}
          onReplenishMine={handleReplenishMine}
        />
      )}

      {/* Wonder Stepped Pyramid Modal */}
      {showWonderModal && (
        <WonderPyramidModal
          gameState={gameState}
          activePlayerId={activePlayerId}
          onClose={() => setShowWonderModal(false)}
          onContributeWonder={handleContributeWonder}
        />
      )}

      {/* Production Input Cargo Prompt Modal */}
      {productionCargoPrompt && (
        <ProductionCargoPromptModal
          gameState={gameState}
          candidates={productionCargoPrompt}
          onCancel={() => setProductionCargoPrompt(null)}
          onConfirm={handleConfirmAdvanceWithProductionCargo}
        />
      )}

      {/* Rules Almanac Modal */}
      {showAlmanacModal && (
        <AlmanacModal onClose={() => setShowAlmanacModal(false)} />
      )}

      {/* Player Aid Reference Matrix Modal */}
      {showPlayerAidModal && (
        <PlayerAidModal onClose={() => setShowPlayerAidModal(false)} />
      )}

      {/* Tutorial Drawer */}
      <TutorialDrawer
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onLoadTutorialMap={handleLoadTutorialMap}
        originalMatchId={originalMatchId}
        onReturnToOriginalMatch={handleReturnToOriginalMatch}
      />

      {/* Move Memory & Time Travel Revert Drawer */}
      <RevertHistoryDrawer
        isOpen={showHistoryDrawer}
        gameState={gameState}
        onClose={() => setShowHistoryDrawer(false)}
        onUndo={handleUndoMove}
        onRedo={handleRedoMove}
        onRevertToIndex={handleRevertToHistory}
      />

      {/* Automated Game Action Test Simulator */}
      {showTestSuite && (
        <TestSimulationModal onClose={() => setShowTestSuite(false)} />
      )}

      {/* Pre-Made Scenarios Selection Modal */}
      <SolitaireModal
        isOpen={showSolitaireModal}
        onClose={() => setShowSolitaireModal(false)}
        onSelectScenario={handleStartSolitaireScenario}
      />
    </div>
  );
}
