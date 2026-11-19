/**
 * Game Scoring, Logging, Snapshot & Undo/Redo Memory
 */

import { GameBookmark, GameState, GoodType, Phase } from '../types';
import { GOOD_DETAILS, ROADS_AND_BOATS_RULES } from '../constants';
import { MAP_PRESETS } from '../maps';

export function calculatePlayerScore(state: GameState, playerId: string): number {
  let score = 0;

  // 1. Wonder Points: 10 VP per row divided among non-neutral bricks in that row
  const allBricks = state.wonder.flatMap(tier => tier.bricks || []);
  const rows = ROADS_AND_BOATS_RULES.driveRuleset.wonder.rows;
  let offset = 0;
  for (const row of rows) {
    const rowBricks = allBricks.slice(offset, offset + row.capacity);
    offset += row.capacity;
    if (rowBricks.length === 0) break;
    const nonNeutralBricks = rowBricks.filter(b => b.ownerId !== 'NEUTRAL');
    if (nonNeutralBricks.length === 0) continue;
    const playerBricksInRow = nonNeutralBricks.filter(b => b.ownerId === playerId).length;
    if (playerBricksInRow > 0) {
      score += Math.floor((row.pointsPerRow * playerBricksInRow) / nonNeutralBricks.length);
    }
  }

  // 2. Wealth Goods in player's transporters (StockBond: 120 VP, Coin: 40 VP, Gold: 10 VP)
  Object.values(state.transporters).forEach(t => {
    if (t.ownerId === playerId) {
      Object.entries(t.cargo).forEach(([good, qty]) => {
        const itemInfo = GOOD_DETAILS[good as GoodType];
        if (itemInfo && qty) {
          score += itemInfo.points * qty;
        }
      });
    }
  });

  return score;
}

export function calculateScores(state: GameState): void {
  state.players.forEach(p => {
    p.score = calculatePlayerScore(state, p.id);
  });
}

export function getLeaderPlayerId(state: GameState): string {
  const nonResigned = state.players.filter(p => !p.resigned);
  const candidates = nonResigned.length > 0 ? nonResigned : state.players;
  let bestScore = -1;
  let leaderId = candidates[0]?.id || '';
  candidates.forEach(p => {
    if (p.score > bestScore) {
      bestScore = p.score;
      leaderId = p.id;
    }
  });
  return leaderId;
}

export function addLog(state: GameState, message: string, playerId?: string): void {
  const player = state.players.find(p => p.id === playerId);
  state.logs.unshift({
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    round: state.round,
    phase: state.phase,
    playerId,
    playerName: player?.name,
    message,
    timestamp: Date.now(),
  });
  if (state.logs.length > 50) {
    state.logs = state.logs.slice(0, 50);
  }
}

export function createSnapshotFromState(state: GameState): string {
  const data = {
    round: state.round,
    phase: state.phase,
    activePlayerId: state.activePlayerId,
    players: state.players,
    hexes: state.hexes,
    edges: state.edges,
    transporters: state.transporters,
    wonder: state.wonder,
    neutralBricksUsed: state.neutralBricksUsed,
    wonderBricksThisRoundByPlayer: state.wonderBricksThisRoundByPlayer,
    logs: state.logs,
    winnerId: state.winnerId,
    status: state.status,
  };
  return JSON.stringify(data);
}

export function restoreStateFromSnapshot(state: GameState, snapshotStr: string): void {
  const data = JSON.parse(snapshotStr);
  state.round = data.round;
  state.phase = data.phase;
  state.activePlayerId = data.activePlayerId;
  state.players = data.players;
  state.hexes = data.hexes;
  state.edges = data.edges;
  state.transporters = data.transporters;
  state.wonder = data.wonder;
  state.neutralBricksUsed = data.neutralBricksUsed ?? 0;
  state.wonderBricksThisRoundByPlayer = data.wonderBricksThisRoundByPlayer ?? {};
  state.logs = data.logs;
  state.winnerId = data.winnerId;
  state.status = data.status;
  state.updatedAt = Date.now();
  calculateScores(state);
}

export function recordHistorySnapshot(state: GameState, label: string, playerId?: string): void {
  if (!state.history) state.history = [];
  if (!state.redoStack) state.redoStack = [];

  const snapshot = createSnapshotFromState(state);
  const player = state.players.find(p => p.id === playerId);
  state.history.push({
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    label,
    round: state.round,
    phase: state.phase,
    playerId,
    playerName: player?.name,
    timestamp: Date.now(),
    snapshot,
  });
  state.redoStack = [];
  if (state.history.length > 100) {
    state.history.shift();
  }
}

export function undoMove(state: GameState): boolean {
  if (!state.history || state.history.length === 0) return false;
  const currentSnapshot = createSnapshotFromState(state);
  const lastEntry = state.history.pop()!;
  if (!state.redoStack) state.redoStack = [];
  state.redoStack.push({
    id: `redo_${Date.now()}`,
    label: lastEntry.label,
    round: state.round,
    phase: state.phase,
    timestamp: Date.now(),
    snapshot: currentSnapshot,
  });
  restoreStateFromSnapshot(state, lastEntry.snapshot);
  addLog(state, `Reverted choice: "${lastEntry.label}"`);
  return true;
}

export function redoMove(state: GameState): boolean {
  if (!state.redoStack || state.redoStack.length === 0) return false;
  const currentSnapshot = createSnapshotFromState(state);
  const redoEntry = state.redoStack.pop()!;
  state.history.push({
    id: `hist_${Date.now()}`,
    label: redoEntry.label,
    round: state.round,
    phase: state.phase,
    timestamp: Date.now(),
    snapshot: currentSnapshot,
  });
  restoreStateFromSnapshot(state, redoEntry.snapshot);
  addLog(state, `Redid move: "${redoEntry.label}"`);
  return true;
}

export function revertToHistoryIndex(state: GameState, targetIndex: number): boolean {
  if (!state.history || targetIndex < 0 || targetIndex >= state.history.length) return false;
  const currentSnapshot = createSnapshotFromState(state);
  const targetEntry = state.history[targetIndex];
  const revertedCount = state.history.length - targetIndex;

  state.history.splice(targetIndex);

  if (!state.redoStack) state.redoStack = [];
  state.redoStack.push({
    id: `redo_${Date.now()}`,
    label: `Before reverting ${revertedCount} moves`,
    round: state.round,
    phase: state.phase,
    timestamp: Date.now(),
    snapshot: currentSnapshot,
  });

  restoreStateFromSnapshot(state, targetEntry.snapshot);
  addLog(state, `Reverted ${revertedCount} moves back to: "${targetEntry.label}"`);
  return true;
}

const MAX_SOLO_BOOKMARKS = 50;
const MAX_BOOKMARK_NAME_LENGTH = 80;

function isSoloBookmarkEligible(state: GameState): boolean {
  return Boolean(state.isSolitaire || state.mapName.startsWith('scenario_'));
}

function formatBookmarkPhase(phase: Phase): string {
  switch (phase) {
    case 'PRODUCTION':
      return 'Production';
    case 'MOVEMENT':
      return 'Movement';
    case 'BUILDING':
      return 'Building';
    case 'WONDER':
      return 'Wonder';
    case 'COMPLETED':
      return 'Completed';
  }
}

export function getDefaultBookmarkName(
  state: Pick<GameState, 'mapName' | 'round' | 'phase'>
): string {
  const mapDisplayName = MAP_PRESETS[state.mapName]?.name || state.mapName;
  return `${mapDisplayName} · R${state.round} ${formatBookmarkPhase(state.phase)}`.slice(
    0,
    MAX_BOOKMARK_NAME_LENGTH
  );
}

export function createSoloBookmark(
  state: GameState,
  options?: { name?: string; note?: string }
): { success: boolean; bookmark?: GameBookmark; reason?: string } {
  if (!isSoloBookmarkEligible(state)) {
    return {
      success: false,
      reason: 'Bookmarks are only available in solo games.',
    };
  }

  if (!state.bookmarks) state.bookmarks = [];
  if (state.bookmarks.length >= MAX_SOLO_BOOKMARKS) {
    return {
      success: false,
      reason: `Maximum of ${MAX_SOLO_BOOKMARKS} bookmarks reached. Delete an older bookmark first.`,
    };
  }

  // Ensure score is up-to-date before capturing exact snapshot
  calculateScores(state);
  const snapshot = createSnapshotFromState(state);
  const soloPlayer = state.players[0];
  const score = soloPlayer?.score ?? 0;
  const transporterCount = Object.values(state.transporters).filter(
    t => !soloPlayer || t.ownerId === soloPlayer.id
  ).length;
  const buildingCount = Object.values(state.hexes).filter(h => Boolean(h.building)).length;

  const trimmedName = (options?.name || '').trim().slice(0, MAX_BOOKMARK_NAME_LENGTH);
  const defaultName = getDefaultBookmarkName(state);
  const trimmedNote = (options?.note || '').trim().slice(0, 120);

  const now = Date.now();
  const bookmark: GameBookmark = {
    id: `bm_${now}_${Math.random().toString(36).substring(2, 7)}`,
    name: trimmedName || defaultName,
    note: trimmedNote || undefined,
    round: state.round,
    maxRounds: state.maxRounds,
    phase: state.phase,
    score,
    transporterCount,
    buildingCount,
    createdAt: now,
    snapshot,
  };

  state.bookmarks.push(bookmark);
  state.updatedAt = now;
  addLog(state, `Saved bookmark "${bookmark.name}" (R${bookmark.round} · ${bookmark.phase})`, soloPlayer?.id);

  return { success: true, bookmark };
}

export function restoreSoloBookmark(
  state: GameState,
  bookmarkId: string
): { success: boolean; bookmark?: GameBookmark; reason?: string } {
  if (!isSoloBookmarkEligible(state)) {
    return {
      success: false,
      reason: 'Bookmarks are only available in solo games.',
    };
  }

  const bookmark = (state.bookmarks || []).find(b => b.id === bookmarkId);
  if (!bookmark) {
    return {
      success: false,
      reason: 'Bookmark not found.',
    };
  }

  const soloPlayerId = state.players[0]?.id;
  // Save current state to Undo history so accidental restores can always be undone
  recordHistorySnapshot(state, `Before restoring bookmark "${bookmark.name}"`, soloPlayerId);

  restoreStateFromSnapshot(state, bookmark.snapshot);
  addLog(state, `Returned to bookmark "${bookmark.name}" (R${bookmark.round} · ${bookmark.phase})`, state.players[0]?.id);

  return { success: true, bookmark };
}

export function renameSoloBookmark(
  state: GameState,
  bookmarkId: string,
  name: string,
  note?: string
): { success: boolean; bookmark?: GameBookmark; reason?: string } {
  if (!isSoloBookmarkEligible(state)) {
    return {
      success: false,
      reason: 'Bookmarks are only available in solo games.',
    };
  }

  const bookmark = (state.bookmarks || []).find(b => b.id === bookmarkId);
  if (!bookmark) {
    return {
      success: false,
      reason: 'Bookmark not found.',
    };
  }

  const trimmedName = (name || '').trim().slice(0, MAX_BOOKMARK_NAME_LENGTH);
  if (!trimmedName) {
    return {
      success: false,
      reason: 'Bookmark name cannot be empty.',
    };
  }

  bookmark.name = trimmedName;
  if (note !== undefined) {
    const trimmedNote = note.trim().slice(0, 120);
    bookmark.note = trimmedNote || undefined;
  }
  state.updatedAt = Date.now();

  return { success: true, bookmark };
}

export function deleteSoloBookmark(
  state: GameState,
  bookmarkId: string
): { success: boolean; reason?: string } {
  if (!isSoloBookmarkEligible(state)) {
    return {
      success: false,
      reason: 'Bookmarks are only available in solo games.',
    };
  }

  if (!state.bookmarks || state.bookmarks.length === 0) {
    return { success: false, reason: 'Bookmark not found.' };
  }

  const idx = state.bookmarks.findIndex(b => b.id === bookmarkId);
  if (idx === -1) {
    return { success: false, reason: 'Bookmark not found.' };
  }

  const [removed] = state.bookmarks.splice(idx, 1);
  state.updatedAt = Date.now();
  addLog(state, `Deleted bookmark "${removed.name}"`, state.players[0]?.id);

  return { success: true };
}
