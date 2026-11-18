/**
 * Game Initialization & Setup Rules
 */

import { GameLogEntry, GameState, Player, Transporter, WonderTier } from '../types';
import { ROADS_AND_BOATS_RULES, SETUP_RULES } from '../rules-engine';
import { INITIAL_WONDER_TIERS, PLAYER_COLORS } from '../constants';
import { buildMapState, MAP_PRESETS } from '../maps';
import { doesSideTouchRoad, getBestAccessibleSide, syncHexTotalGoods } from '../riverSides';
import { addLog, calculateScores } from './history';

export interface CreateGameOptions {
  maxRounds?: number;
  isSolitaire?: boolean;
  scenarioId?: string;
  creatorClientId?: string;
}

export function generateGameCode(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return buf[0].toString(16).toUpperCase().padStart(8, '0');
  }
  return Math.floor(Math.random() * 0x100000000)
    .toString(16)
    .toUpperCase()
    .padStart(8, '0');
}

export function isHexGameCode(code: string): boolean {
  return /^[0-9A-Fa-f]{8}$/.test(code.trim());
}

export function isSolitaireMap(mapId: string): boolean {
  return mapId.startsWith('scenario_');
}

export function isSoloGameState(
  game: Pick<GameState, 'isSolitaire' | 'scenarioId' | 'mapName'>
): boolean {
  return Boolean(game.isSolitaire || isSolitaireMap(game.mapName));
}

export function getActiveHumanPlayers(game: Pick<GameState, 'players'>): Player[] {
  return game.players.filter(p => !p.resigned && !p.isAI);
}

export function isOnlyActivePlayerRemaining(
  game: Pick<GameState, 'isSolitaire' | 'scenarioId' | 'mapName' | 'players'>,
  playerId?: string
): boolean {
  if (isSoloGameState(game) || game.players.length <= 1) return true;
  const activeHumans = getActiveHumanPlayers(game);
  if (activeHumans.length === 0) return true;
  if (activeHumans.length === 1) {
    return !playerId || activeHumans[0].id === playerId;
  }
  return false;
}

export function isElevatedPrivilegedPlayer(playerName?: string): boolean {
  return (playerName || '').trim().toLowerCase() === 'john burt';
}

export function isPlayerMatchStarter(
  game: Pick<GameState, 'players' | 'creatorClientId' | 'creatorPlayerId'>,
  playerId?: string,
  clientId?: string
): boolean {
  if (clientId && game.creatorClientId && game.creatorClientId === clientId) {
    return true;
  }
  const starterId =
    game.creatorPlayerId ||
    game.players.find(p => p.isHost)?.id ||
    game.players[0]?.id;
  if (playerId && starterId && playerId === starterId) {
    return true;
  }
  return false;
}

export function canDeleteMatch(
  game: Pick<GameState, 'players' | 'creatorClientId' | 'creatorPlayerId'>,
  identity: { playerId?: string; clientId?: string; playerName?: string }
): boolean {
  const { playerId, clientId, playerName } = identity;
  const effectiveName =
    playerName || (playerId ? game.players.find(p => p.id === playerId)?.name : undefined);
  if (isElevatedPrivilegedPlayer(effectiveName)) {
    return true;
  }
  return isPlayerMatchStarter(game, playerId, clientId);
}

export function canRenameMatch(
  game: Pick<GameState, 'players' | 'creatorClientId' | 'creatorPlayerId'>,
  identity: { playerId?: string; clientId?: string; playerName?: string }
): boolean {
  if (canDeleteMatch(game, identity)) {
    return true;
  }
  const existing = findExistingPlayer(game, identity);
  return Boolean(existing && !existing.resigned);
}

export function findExistingPlayer(
  game: Pick<GameState, 'players'>,
  identity: { playerId?: string; clientId?: string; playerName?: string }
): Player | undefined {
  const { playerId, clientId, playerName } = identity;
  const normalizedName = playerName?.trim().toLowerCase();

  return (
    (playerId ? game.players.find(p => p.id === playerId) : undefined) ||
    (clientId ? game.players.find(p => p.clientId && p.clientId === clientId) : undefined) ||
    (normalizedName
      ? game.players.find(p => p.name.trim().toLowerCase() === normalizedName)
      : undefined)
  );
}

export function sanitizeUniquePlayers(game: GameState): void {
  const seenIds = new Set<string>();
  const seenClientIds = new Set<string>();
  const seenNames = new Set<string>();
  const uniquePlayers: Player[] = [];

  for (const player of game.players) {
    const normName = player.name.trim().toLowerCase();
    if (seenIds.has(player.id)) continue;
    if (player.clientId && seenClientIds.has(player.clientId)) continue;
    if (normName && seenNames.has(normName)) continue;

    seenIds.add(player.id);
    if (player.clientId) seenClientIds.add(player.clientId);
    if (normName) seenNames.add(normName);
    uniquePlayers.push(player);
  }

  game.players = uniquePlayers;
}

/**
 * Resigns a player from a match. Returns shouldRemoveMatch=true when the resigning
 * player is the only active human player (solo game, AI-only opponents, or all other
 * human players have already resigned).
 */
export function resignPlayer(
  game: GameState,
  playerId: string
): { resigned: boolean; shouldRemoveMatch: boolean; playerName?: string; reason?: string } {
  const targetPlayer =
    (isSoloGameState(game) ? game.players[0] : game.players.find(p => p.id === playerId)) ||
    null;

  if (!targetPlayer) {
    return { resigned: false, shouldRemoveMatch: false, reason: 'Player not found in match' };
  }
  if (targetPlayer.resigned) {
    return { resigned: false, shouldRemoveMatch: false, reason: 'Player has already resigned' };
  }

  targetPlayer.resigned = true;
  targetPlayer.connected = false;

  const remainingHumans = getActiveHumanPlayers(game);
  const shouldRemoveMatch =
    isSoloGameState(game) ||
    game.players.length <= 1 ||
    remainingHumans.length === 0;

  if (!shouldRemoveMatch && game.activePlayerId === targetPlayer.id) {
    const nextActive =
      remainingHumans[0] || game.players.find(p => !p.resigned) || game.players[0];
    if (nextActive) {
      game.activePlayerId = nextActive.id;
    }
  }

  addLog(
    game,
    shouldRemoveMatch
      ? `${targetPlayer.name} resigned. No active players remain — removing match.`
      : `${targetPlayer.name} resigned from the match.`,
    targetPlayer.id
  );
  game.updatedAt = Date.now();

  return {
    resigned: true,
    shouldRemoveMatch,
    playerName: targetPlayer.name,
  };
}

/**
 * Attaches a joining or reconnecting client to the sole player in a solo game
 * without adding a new player or resetting board state.
 */
export function reconnectSoloPlayer(game: GameState): Player | null {
  if (!isSoloGameState(game)) return null;
  game.isSolitaire = true;
  if (game.players.length > 1) {
    const firstHuman = game.players.find(p => !p.isAI) || game.players[0];
    game.players = [firstHuman];
  }
  const soloPlayer = game.players[0] || null;
  if (soloPlayer) {
    soloPlayer.isAI = false;
    soloPlayer.isHost = true;
    soloPlayer.connected = true;
    soloPlayer.resigned = false;
    game.activePlayerId = soloPlayer.id;
    game.updatedAt = Date.now();
  }
  return soloPlayer;
}

export function createInitialGame(
  name: string,
  mapId: string = 'river_valley',
  playerConfigs: Array<{ id?: string; name: string; isAI?: boolean; aiProfileId?: string; clientId?: string }>,
  options?: CreateGameOptions
): GameState {
  const map = MAP_PRESETS[mapId] || MAP_PRESETS.river_valley;
  const { hexes, edges } = buildMapState(mapId);

  const isSolitaire = Boolean(options?.isSolitaire || isSolitaireMap(mapId));
  const firstHuman = playerConfigs.find(c => !c.isAI) || playerConfigs[0];
  const rawConfigs = isSolitaire
    ? [{ id: firstHuman?.id, name: firstHuman?.name || 'Solo Sovereign', isAI: false, clientId: firstHuman?.clientId || options?.creatorClientId }]
    : playerConfigs;

  const seenClientIds = new Set<string>();
  const seenNames = new Set<string>();
  const effectiveConfigs = rawConfigs.filter(cfg => {
    const normName = (cfg.name || '').trim().toLowerCase();
    if (cfg.clientId && seenClientIds.has(cfg.clientId)) return false;
    if (normName && seenNames.has(normName)) return false;
    if (cfg.clientId) seenClientIds.add(cfg.clientId);
    if (normName) seenNames.add(normName);
    return true;
  });

  const players: Player[] = effectiveConfigs.map((cfg, idx) => {
    const colorInfo = PLAYER_COLORS[idx % PLAYER_COLORS.length];
    const homeCoord = map.playerHomeHexes[idx] || map.playerHomeHexes[0];
    const homeHexId = `${homeCoord.q},${homeCoord.r}`;
    const isAI = cfg.isAI || false;

    return {
      id: cfg.id || `player_${idx + 1}_${Math.random().toString(36).substring(2, 6)}`,
      name: cfg.name || `Player ${idx + 1}`,
      color: colorInfo.hex,
      isAI,
      aiProfileId: isAI ? cfg.aiProfileId || 'stock_beginner' : undefined,
      aiOwnedGoods: isAI ? { [homeHexId]: { ...SETUP_RULES.startingGoodsPerPlayer } } : undefined,
      isHost: idx === 0,
      isReady: true,
      score: 0,
      homeHexId,
      connected: true,
      resigned: false,
      clientId: cfg.clientId || (idx === 0 ? options?.creatorClientId : undefined),
    };
  });

  const transporters: Record<string, Transporter> = {};
  const sideCtx = {
    hexes,
    edges,
    hexOrientation: map.hexOrientation || 'pointy',
  };

  players.forEach((player) => {
    player.unlockedTechs = [];
    const homeHex = hexes[player.homeHexId];
    if (homeHex) {
      const homeSide = getBestAccessibleSide(sideCtx, player.homeHexId);
      if (!homeHex.goodsBySide) homeHex.goodsBySide = {};
      homeHex.goodsBySide[homeSide] = { ...SETUP_RULES.startingGoodsPerPlayer };
      syncHexTotalGoods(homeHex);
      if (player.isAI) {
        if (!player.aiOwnedGoods) player.aiOwnedGoods = {};
        player.aiOwnedGoods[player.homeHexId] = { ...SETUP_RULES.startingGoodsPerPlayer };
        if (!player.aiOwnedGoodsBySide) player.aiOwnedGoodsBySide = {};
        player.aiOwnedGoodsBySide[player.homeHexId] = {
          [homeSide]: { ...SETUP_RULES.startingGoodsPerPlayer },
        };
      }

      const homeBordersRoad = doesSideTouchRoad(sideCtx, player.homeHexId, homeSide);
      const initialDonkeyMoves = homeBordersRoad
        ? ROADS_AND_BOATS_RULES.transporters.donkey.roadSpeed
        : SETUP_RULES.startingDonkeyMoves;

      for (let d = 1; d <= SETUP_RULES.startingDonkeysPerPlayer; d++) {
        const dId = `t_${player.id}_donkey_${d}`;
        transporters[dId] = {
          id: dId,
          ownerId: player.id,
          type: 'donkey',
          hexId: player.homeHexId,
          side: homeSide,
          cargo: {},
          movesLeft: initialDonkeyMoves,
          maxMoves: initialDonkeyMoves,
          capacity: SETUP_RULES.startingDonkeyCapacity,
        };
      }
    }
  });

  const wonder: WonderTier[] = JSON.parse(JSON.stringify(INITIAL_WONDER_TIERS));

  let initialNeutralBricksUsed = 0;
  if (isSolitaire) {
    // Official Solo Rule: Pre-fill the first 4 rows (16 slots = Tier 0 Foundation) with Neutral bricks
    const soloPrebuiltCount = ROADS_AND_BOATS_RULES.driveRuleset.wonder.rows
      .slice(0, ROADS_AND_BOATS_RULES.wonderRules.soloPrebuiltRows)
      .reduce((sum, r) => sum + r.capacity, 0);

    for (let i = 0; i < soloPrebuiltCount; i++) {
      const targetTier = wonder.find(t => t.bricks.length < t.totalSlots);
      if (!targetTier) break;
      targetTier.bricks.push({
        brickIndex: targetTier.bricks.length,
        tier: targetTier.tierIndex,
        ownerId: 'NEUTRAL',
        points: 0,
        round: 0,
      });
      initialNeutralBricksUsed += 1;
    }
  }

  const initialLogs: GameLogEntry[] = [
    {
      id: `log_init_${Date.now()}`,
      round: 1,
      phase: 'PRODUCTION',
      message: isSolitaire
        ? `Solo Scenario "${name}" begun on ${map.name}. Strictly 1 player on the board with 4 pre-built Wonder rows (16 neutral bricks)—optimize logistics and score points!`
        : `Game "${name}" begun on ${map.name}. Each player begins with 3 Donkeys, 5 Boards, 1 Stone, and 2 Geese at their home camp.`,
      timestamp: Date.now(),
    },
  ];

  const now = Date.now();
  const state: GameState = {
    id: generateGameCode(),
    name,
    status: 'playing',
    mapName: mapId,
    hexOrientation: map.hexOrientation || 'pointy',
    round: 1,
    maxRounds:
      options?.maxRounds ||
      (isSolitaire ? 20 : ROADS_AND_BOATS_RULES.wonderRules.maxNeutralBricksTurnLimit),
    phase: 'PRODUCTION',
    activePlayerId: players[0]?.id || '',
    players,
    hexes,
    edges,
    transporters,
    wonder,
    neutralBricksUsed: initialNeutralBricksUsed,
    wonderBricksThisRoundByPlayer: {},
    logs: initialLogs,
    history: [],
    redoStack: [],
    isSolitaire,
    scenarioId: options?.scenarioId || (isSolitaireMap(mapId) ? mapId.replace(/^scenario_/, '') : undefined),
    creatorClientId: options?.creatorClientId || players[0]?.clientId,
    creatorPlayerId: players[0]?.id,
    winnerId: null,
    createdAt: now,
    updatedAt: now,
  };

  calculateScores(state);
  return state;
}
