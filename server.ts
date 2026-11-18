/**
 * Roads & Boats - Full-Stack Express Server with Server-Authoritative State & SSE
 */

import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  addLog,
  advancePhase,
  canBuildFactory,
  canBuildRoad,
  canBuildWonder,
  canDeleteMatch,
  canDropGoods,
  canMoveTransporter,
  canPickupGoods,
  canRenameMatch,
  canReplenishMine,
  canResearchTech,
  createInitialGame,
  executeBuildFactory,
  executeBuildRoad,
  executeBuildWonder,
  executeDropGoods,
  executeMoveTransporter,
  executePickupGoods,
  executeReplenishMine,
  executeResearchTech,
  findExistingPlayer,
  generateGameCode,
  getBotProfile,
  DEFAULT_BOT_PROFILE_ID,
  isElevatedPrivilegedPlayer,
  isHexGameCode,
  isSolitaireMap,
  isSoloGameState,
  reconnectSoloPlayer,
  redoMove,
  resignPlayer,
  revertToHistoryIndex,
  runBotTurn,
  sanitizeUniquePlayers,
  undoMove,
} from './src/game/engine';
import { GameAction, GameState } from './src/game/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveServerPort(): number {
  const portFlagIndex = process.argv.findIndex(
    arg => arg === '--port' || arg.startsWith('--port=')
  );
  if (portFlagIndex !== -1) {
    const arg = process.argv[portFlagIndex];
    const raw = arg.includes('=') ? arg.split('=')[1] : process.argv[portFlagIndex + 1];
    const parsed = raw ? parseInt(raw, 10) : NaN;
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  if (process.env.PORT) {
    const parsed = parseInt(process.env.PORT, 10);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  return 3000;
}

const app = express();
const server = http.createServer(app);
const PORT = resolveServerPort();

app.use(express.json({ limit: '10mb' }));

// In-memory games storage + disk persistence
const games: Map<string, GameState> = new Map();
// SSE listener connections per game: gameId -> Set of Response objects
const sseClients: Map<string, Set<Response>> = new Map();

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'roads_and_boats_db.json');
const DRIVE_RULES_DIR = path.join(DATA_DIR, 'drive_imported_rules');
const DRIVE_RULES_INDEX = path.join(DRIVE_RULES_DIR, '_index.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DRIVE_RULES_DIR)) {
    fs.mkdirSync(DRIVE_RULES_DIR, { recursive: true });
  }
}

function allocateUniqueGameCode(): string {
  let code = generateGameCode();
  while (games.has(code)) {
    code = generateGameCode();
  }
  return code;
}

function findGameByCode(idOrCode: string): GameState | undefined {
  const trimmed = (idOrCode || '').trim();
  if (!trimmed) return undefined;
  return games.get(trimmed) || games.get(trimmed.toUpperCase());
}

function loadPersistedGames() {
  try {
    ensureDataDir();
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data: Record<string, GameState> = JSON.parse(raw);
      let migrated = false;
      Object.values(data).forEach(g => {
        if (!isHexGameCode(g.id)) {
          g.id = allocateUniqueGameCode();
          migrated = true;
        } else if (g.id !== g.id.toUpperCase()) {
          g.id = g.id.toUpperCase();
          migrated = true;
        }
        if (isSoloGameState(g)) {
          reconnectSoloPlayer(g);
        } else {
          sanitizeUniquePlayers(g);
        }
        games.set(g.id, g);
      });
      if (migrated) {
        persistGames();
      }
      console.log(`Loaded ${games.size} persisted games from disk.`);
    }
  } catch (err) {
    console.error('Failed to load persisted games:', err);
  }
}

function persistGames() {
  try {
    ensureDataDir();
    const data: Record<string, GameState> = {};
    games.forEach((g, id) => {
      data[id] = g;
    });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist games to disk:', err);
  }
}

function broadcastGameState(gameId: string) {
  const game = games.get(gameId);
  if (!game) return;
  const clients = sseClients.get(gameId);
  if (clients && clients.size > 0) {
    const payload = `data: ${JSON.stringify(game)}\n\n`;
    clients.forEach(client => {
      try {
        client.write(payload);
      } catch (e) {
        // client disconnected
      }
    });
  }
}

function removeGameAndNotify(gameId: string, reason: string): boolean {
  const existed = games.delete(gameId);
  if (!existed) return false;
  persistGames();
  const clients = sseClients.get(gameId);
  if (clients && clients.size > 0) {
    const payload = `data: ${JSON.stringify({ deleted: true, gameId, reason })}\n\n`;
    clients.forEach(client => {
      try {
        client.write(payload);
        client.end();
      } catch {
        // client already disconnected
      }
    });
    sseClients.delete(gameId);
  }
  return true;
}

// REST API Endpoints

// 1. List active games
app.get('/api/games', (_req: Request, res: Response) => {
  const list = Array.from(games.values()).map(g => {
    const isSolo = isSoloGameState(g);
    const visiblePlayers = isSolo ? g.players.slice(0, 1) : g.players;
    const starterPlayer = g.players.find(p => p.isHost) || g.players[0];
    return {
      id: g.id,
      name: g.name,
      mapName: g.mapName,
      status: g.status,
      round: g.round,
      phase: g.phase,
      playerCount: visiblePlayers.length,
      activePlayerCount: visiblePlayers.filter(p => !p.resigned).length,
      isSolitaire: isSolo,
      scenarioId: g.scenarioId,
      creatorClientId: g.creatorClientId,
      creatorPlayerId: g.creatorPlayerId || starterPlayer?.id,
      hostName: starterPlayer?.name,
      players: visiblePlayers.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        isAI: p.isAI,
        isHost: p.isHost,
        resigned: Boolean(p.resigned),
      })),
      updatedAt: g.updatedAt,
    };
  });
  res.json({ games: list });
});

// 2. Create a new game
app.post('/api/games', (req: Request, res: Response) => {
  const {
    name,
    mapName = 'river_valley',
    hostName = 'Host Sovereign',
    fillWithBots = false,
    botProfileId,
    botProfileIds,
    isSolitaire = false,
    scenarioId,
    maxRounds,
    creatorClientId,
  } = req.body;

  const isSolo = Boolean(isSolitaire || isSolitaireMap(mapName));

  // In solo mode, strictly 1 human player and ZERO bots allowed
  const playerConfigs: Array<{ name: string; isAI: boolean; aiProfileId?: string; clientId?: string }> = [
    { name: hostName, isAI: false, clientId: creatorClientId },
  ];
  if (fillWithBots && !isSolo) {
    const requestedBots: string[] =
      Array.isArray(botProfileIds) && botProfileIds.length > 0
        ? botProfileIds.slice(0, 3)
        : [botProfileId || DEFAULT_BOT_PROFILE_ID];

    requestedBots.forEach((profileId, idx) => {
      const profile = getBotProfile(profileId);
      const botName = requestedBots.length > 1 ? `${profile.shortLabel} #${idx + 1} (AI)` : profile.name;
      playerConfigs.push({
        name: botName,
        isAI: true,
        aiProfileId: profile.id,
      });
    });
  }

  const trimmedName = typeof name === 'string' ? name.trim().slice(0, 40) : '';
  const newGame = createInitialGame(
    trimmedName || (isSolo ? 'Pre-Made Scenario' : 'Valley of Wonders'),
    mapName,
    playerConfigs,
    {
      isSolitaire: isSolo,
      scenarioId,
      maxRounds: typeof maxRounds === 'number' ? maxRounds : isSolo ? 20 : undefined,
      creatorClientId,
    }
  );
  newGame.id = allocateUniqueGameCode();
  games.set(newGame.id, newGame);
  persistGames();

  res.status(201).json({ game: newGame });
});

// 3. Fetch single game
app.get('/api/games/:id', (req: Request, res: Response) => {
  const game = findGameByCode(req.params.id);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  if (isSoloGameState(game) && req.query.observe !== '1') {
    reconnectSoloPlayer(game);
  }
  res.json({ game });
});

// 4. Join or reconnect to a game
app.post('/api/games/:id/join', (req: Request, res: Response) => {
  const game = findGameByCode(req.params.id);
  if (!game) return res.status(404).json({ error: 'Match code not found' });

  // Solo games strictly have 1 player: joining or reconnecting always attaches to that sole player
  if (isSoloGameState(game)) {
    const soloPlayer = reconnectSoloPlayer(game);
    persistGames();
    broadcastGameState(game.id);
    return res.json({ game, player: soloPlayer, reconnected: true });
  }

  const {
    playerName = `Merchant ${game.players.length + 1}`,
    isAI = false,
    clientId,
    playerId,
  } = req.body;

  // Enforce unique representation: match existing active OR resigned player
  // by playerId, clientId, or normalized player name so joining never duplicates a player.
  const existingPlayer = findExistingPlayer(game, { playerId, clientId, playerName });
  if (existingPlayer) {
    if (!existingPlayer.clientId && clientId) {
      existingPlayer.clientId = clientId;
    }
    if (!existingPlayer.resigned) {
      existingPlayer.connected = true;
    }
    game.updatedAt = Date.now();
    persistGames();
    broadcastGameState(game.id);
    return res.json({
      game,
      player: existingPlayer,
      reconnected: true,
      alreadyResigned: Boolean(existingPlayer.resigned),
    });
  }

  if (game.players.length >= 4) {
    return res.status(400).json({ error: 'Game is full (max 4 players)' });
  }

  // Re-initialize with new player (preserving existing player IDs)
  const playerConfigs: Array<{ id?: string; name: string; isAI: boolean; aiProfileId?: string; clientId?: string }> =
    game.players.map(p => ({
      id: p.id,
      name: p.name,
      isAI: p.isAI,
      aiProfileId: p.aiProfileId,
      clientId: p.clientId,
    }));
  playerConfigs.push({ name: playerName, isAI, clientId });

  const updatedGame = createInitialGame(game.name, game.mapName, playerConfigs, {
    maxRounds: game.maxRounds,
    creatorClientId: game.creatorClientId,
  });
  updatedGame.id = game.id; // Keep same game ID
  updatedGame.creatorPlayerId = game.creatorPlayerId || updatedGame.players[0]?.id;
  games.set(game.id, updatedGame);
  persistGames();
  broadcastGameState(game.id);

  const addedPlayer = updatedGame.players[updatedGame.players.length - 1];
  res.json({ game: updatedGame, player: addedPlayer });
});

// 5. Execute Action
app.post('/api/games/:id/action', (req: Request, res: Response) => {
  const game = findGameByCode(req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const action = req.body as GameAction & { playerId?: string; clientId?: string };
  const actingPlayer = action.playerId
    ? game.players.find(p => p.id === action.playerId)
    : undefined;
  if (actingPlayer?.resigned) {
    return res.status(400).json({ success: false, reason: 'Resigned players cannot perform actions' });
  }

  let success = false;
  let reason = '';

  try {
    switch (action.type) {
      case 'RESIGN_GAME': {
        const targetId = action.playerId || game.activePlayerId;
        const result = resignPlayer(game, targetId);
        if (!result.resigned) {
          reason = result.reason || 'Unable to resign';
          break;
        }
        if (result.shouldRemoveMatch) {
          removeGameAndNotify(game.id, 'Match ended and removed after the final player resigned.');
          return res.json({ success: true, removed: true, gameId: game.id });
        }
        persistGames();
        broadcastGameState(game.id);
        return res.json({ success: true, removed: false, game });
      }
      case 'MOVE_TRANSPORTER': {
        const check = canMoveTransporter(game, action.transporterId, action.targetHexId, action.playerId, action.targetSide);
        if (!check.valid) {
          reason = check.reason || 'Invalid movement';
          break;
        }
        success = executeMoveTransporter(game, action.transporterId, action.targetHexId, action.playerId, action.targetSide);
        break;
      }
      case 'PICKUP_GOODS': {
        const check = canPickupGoods(game, action.transporterId, action.good, action.amount, action.playerId, action.targetSide);
        if (!check.valid) {
          reason = check.reason || 'Cannot pick up goods';
          break;
        }
        success = executePickupGoods(game, action.transporterId, action.good, action.amount, action.playerId, action.targetSide);
        break;
      }
      case 'DROP_GOODS': {
        const check = canDropGoods(game, action.transporterId, action.good, action.amount, action.playerId, action.targetSide);
        if (!check.valid) {
          reason = check.reason || 'Cannot drop goods';
          break;
        }
        success = executeDropGoods(game, action.transporterId, action.good, action.amount, action.playerId, action.targetSide);
        break;
      }
      case 'BUILD_ROAD': {
        const pId = action.playerId || game.activePlayerId;
        const check = canBuildRoad(game, pId, action.hexA, action.hexB, action.material, action.transporterId);
        if (!check.valid) {
          reason = check.reason || 'Cannot build road or bridge';
          break;
        }
        success = executeBuildRoad(game, pId, action.hexA, action.hexB, action.material, action.transporterId);
        break;
      }
      case 'BUILD_FACTORY': {
        const pId = action.playerId || game.activePlayerId;
        const check = canBuildFactory(game, pId, action.hexId, action.buildingType, action.transporterId);
        if (!check.valid) {
          reason = check.reason || 'Cannot construct factory';
          break;
        }
        success = executeBuildFactory(game, pId, action.hexId, action.buildingType, action.transporterId);
        break;
      }
      case 'BUILD_WONDER': {
        const pId = action.playerId || game.activePlayerId;
        const check = canBuildWonder(game, pId, action.transporterId, action.amount);
        if (!check.valid) {
          reason = check.reason || 'Cannot contribute to Wonder';
          break;
        }
        success = executeBuildWonder(game, pId, action.transporterId, action.amount);
        break;
      }
      case 'ADVANCE_PHASE': {
        advancePhase(
          game,
          action.allowTransporterCargo !== undefined
            ? { allowTransporterCargo: action.allowTransporterCargo }
            : undefined
        );
        // If there are active AI players, trigger their automated moves
        game.players.forEach(p => {
          if (p.isAI && !p.resigned) {
            runBotTurn(game, p.id);
          }
        });
        success = true;
        break;
      }
      case 'UNDO_MOVE': {
        success = undoMove(game);
        if (!success) reason = 'No previous moves in memory to revert';
        break;
      }
      case 'REDO_MOVE': {
        success = redoMove(game);
        if (!success) reason = 'No reverted moves to redo';
        break;
      }
      case 'REVERT_TO_HISTORY': {
        success = revertToHistoryIndex(game, action.targetIndex);
        if (!success) reason = 'Invalid history target index';
        break;
      }
      case 'RESEARCH_TECH': {
        const pId = action.playerId || game.activePlayerId;
        const check = canResearchTech(game, pId, action.hexId, action.techId, action.transporterId);
        if (!check.valid) {
          reason = check.reason || 'Insufficient geese or invalid technology requirements';
          break;
        }
        success = executeResearchTech(game, pId, action.hexId, action.techId, action.transporterId);
        break;
      }
      case 'REPLENISH_MINE': {
        const pId = action.playerId || game.activePlayerId;
        const check = canReplenishMine(game, pId, action.hexId);
        if (!check.valid) {
          reason = check.reason || 'Cannot sink new mine shaft here';
          break;
        }
        success = executeReplenishMine(game, pId, action.hexId);
        break;
      }
      default:
        reason = 'Unknown action type';
    }
  } catch (err: any) {
    reason = err.message || 'Error processing action';
  }

  if (success) {
    persistGames();
    broadcastGameState(game.id);
    res.json({ success: true, game });
  } else {
    res.status(400).json({ success: false, reason: reason || 'Invalid action according to game rules' });
  }
});

// 6. Resign from a game (removes match if solo or all remaining human players resigned)
app.post('/api/games/:id/resign', (req: Request, res: Response) => {
  const game = findGameByCode(req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const { playerId, clientId } = (req.body || {}) as { playerId?: string; clientId?: string };
  let targetPlayerId =
    (playerId && game.players.find(p => p.id === playerId)?.id) || undefined;

  if (!targetPlayerId && clientId) {
    const byClient = game.players.find(p => p.clientId === clientId && !p.resigned);
    targetPlayerId = byClient?.id;
  }
  if (!targetPlayerId && isSoloGameState(game)) {
    targetPlayerId = game.players[0]?.id;
  }

  if (!targetPlayerId) {
    return res.status(400).json({ success: false, reason: 'Player identity is required to resign' });
  }

  const result = resignPlayer(game, targetPlayerId);
  if (!result.resigned) {
    return res.status(400).json({ success: false, reason: result.reason || 'Unable to resign' });
  }

  if (result.shouldRemoveMatch) {
    removeGameAndNotify(game.id, 'Match ended and removed after the final player resigned.');
    return res.json({ success: true, removed: true, gameId: game.id });
  }

  persistGames();
  broadcastGameState(game.id);
  return res.json({ success: true, removed: false, game });
});

// 7. Delete a game (permitted for the match starter or elevated player "John Burt")
app.delete('/api/games/:id', (req: Request, res: Response) => {
  const game = findGameByCode(req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const body = (req.body || {}) as { clientId?: string; playerId?: string; playerName?: string };
  const clientId = body.clientId || (typeof req.query.clientId === 'string' ? req.query.clientId : undefined);
  const playerId = body.playerId || (typeof req.query.playerId === 'string' ? req.query.playerId : undefined);
  const playerName =
    body.playerName ||
    (typeof req.query.playerName === 'string' ? req.query.playerName : undefined) ||
    (typeof req.headers['x-player-name'] === 'string' ? req.headers['x-player-name'] : undefined);

  if (!canDeleteMatch(game, { playerId, clientId, playerName })) {
    return res.status(403).json({ error: 'Only the player who started this match can delete it.' });
  }

  const reason = isElevatedPrivilegedPlayer(playerName)
    ? 'Match was deleted by John Burt.'
    : 'Match was deleted by the player who started it.';
  removeGameAndNotify(game.id, reason);
  return res.json({ success: true, deleted: true, gameId: game.id });
});

// 7b. Rename a game (permitted for active match players, starter, or elevated player "John Burt")
app.patch('/api/games/:id', (req: Request, res: Response) => {
  const game = findGameByCode(req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const body = (req.body || {}) as {
    name?: string;
    clientId?: string;
    playerId?: string;
    playerName?: string;
  };
  const nextName = (body.name || '').trim().slice(0, 40);
  if (!nextName) {
    return res.status(400).json({ error: 'Game name cannot be empty.' });
  }

  if (!canRenameMatch(game, { playerId: body.playerId, clientId: body.clientId, playerName: body.playerName })) {
    return res.status(403).json({ error: 'Only active players in this match or its starter can rename it.' });
  }

  const prevName = game.name;
  game.name = nextName;
  game.updatedAt = Date.now();
  if (prevName !== nextName) {
    addLog(game, `Game renamed from "${prevName}" to "${nextName}"`, body.playerId);
  }
  persistGames();
  broadcastGameState(game.id);
  return res.json({ success: true, game });
});

// 8. Reset / Restart game
app.post('/api/games/:id/reset', (req: Request, res: Response) => {
  const game = findGameByCode(req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const isSolo = isSoloGameState(game);
  const playerConfigs = isSolo
    ? [{ id: game.players[0]?.id, name: game.players[0]?.name || 'Solo Sovereign', isAI: false, clientId: game.creatorClientId || game.players[0]?.clientId }]
    : game.players.map(p => ({ id: p.id, name: p.name, isAI: p.isAI, aiProfileId: p.aiProfileId, clientId: p.clientId }));
  const resetGame = createInitialGame(game.name, game.mapName, playerConfigs, {
    isSolitaire: isSolo,
    scenarioId: game.scenarioId,
    maxRounds: game.maxRounds,
    creatorClientId: game.creatorClientId,
  });
  resetGame.id = game.id;
  games.set(game.id, resetGame);
  persistGames();
  broadcastGameState(game.id);

  res.json({ success: true, game: resetGame });
});

// 9. Real-Time Server-Sent Events (SSE) Stream
app.get('/api/games/:id/stream', (req: Request, res: Response) => {
  const game = findGameByCode(req.params.id);

  if (!game) {
    return res.status(404).end();
  }
  const gameId = game.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseClients.has(gameId)) {
    sseClients.set(gameId, new Set());
  }
  const clientSet = sseClients.get(gameId)!;
  clientSet.add(res);

  // Send current state immediately
  res.write(`data: ${JSON.stringify(game)}\n\n`);

  // Keep connection alive with periodic comment ping
  const interval = setInterval(() => {
    res.write(': ping\n\n');
  }, 20000);

  req.on('close', () => {
    clearInterval(interval);
    clientSet.delete(res);
  });
});

// 10. Google Drive Rulebook Sync Endpoints
app.get('/api/drive-rules', (_req: Request, res: Response) => {
  try {
    ensureDataDir();
    if (fs.existsSync(DRIVE_RULES_INDEX)) {
      const raw = fs.readFileSync(DRIVE_RULES_INDEX, 'utf-8');
      return res.json(JSON.parse(raw));
    }
    return res.json({ files: [] });
  } catch (err) {
    console.error('Failed to read persisted Drive rules:', err);
    return res.json({ files: [] });
  }
});

app.post('/api/drive-rules/sync', (req: Request, res: Response) => {
  try {
    ensureDataDir();
    const {
      files = [],
      diagnostics = null,
      error = null,
    } = (req.body || {}) as {
      files?: Array<{
        id: string;
        name: string;
        mimeType: string;
        path: string;
        modifiedTime?: string;
        size?: string;
        content: string;
      }>;
      diagnostics?: any;
      error?: string | null;
    };

    for (const file of files) {
      const safeName = (file.name || 'rule_file.txt').replace(/[^a-zA-Z0-9._-]/g, '_');
      const targetPath = path.join(DRIVE_RULES_DIR, safeName);
      fs.writeFileSync(targetPath, file.content || '', 'utf-8');
    }

    fs.writeFileSync(
      DRIVE_RULES_INDEX,
      JSON.stringify({ syncedAt: Date.now(), error, diagnostics, files }, null, 2),
      'utf-8'
    );
    return res.json({ success: true, count: files.length });
  } catch (err: any) {
    console.error('Failed to sync Drive rule files:', err);
    return res.status(500).json({ error: err.message || 'Failed to sync Drive rule files' });
  }
});

// Seed an initial demo game only on first boot when no DB file exists yet
loadPersistedGames();
if (!fs.existsSync(DB_FILE) && games.size === 0) {
  const starter = createInitialGame('Grand Valley Championship', 'river_valley', [
    { name: 'Sovereign Player', isAI: false },
    { name: 'Merchant Baron (AI)', isAI: true },
  ]);
  games.set(starter.id, starter);
  persistGames();
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.on('error', err => {
    console.error('Server listen error:', err);
    process.exit(1);
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Roads & Boats Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
