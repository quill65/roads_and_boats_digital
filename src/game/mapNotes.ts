/**
 * Private Per-Player Map Notes Logic & Access Control
 * Notes are stored separately from shared GameState so they are never leaked
 * to other players or observers and persist across undo/redo/bookmarks.
 */

import { GameState, MapNote, MapNoteColor } from './types';
import { isSoloGameState } from './engine/setup';

export type MapNotesDatabase = Record<string, Record<string, MapNote[]>>;

export const VALID_MAP_NOTE_COLORS: ReadonlyArray<MapNoteColor> = [
  'amber',
  'sky',
  'emerald',
  'rose',
];

const MAX_NOTES_PER_PLAYER_PER_GAME = 100;
const MAX_NOTE_TEXT_LENGTH = 240;

export function normalizeMapNoteColor(color?: string): MapNoteColor {
  if (color && (VALID_MAP_NOTE_COLORS as ReadonlyArray<string>).includes(color)) {
    return color as MapNoteColor;
  }
  return 'amber';
}

/**
 * Verifies the caller is an authorized human player in `game` and returns their
 * private note-owner key (their player ID). Returns null for observers, AI, or
 * mismatched client identities so notes remain strictly hidden from other players.
 */
export function resolveAuthorizedNoteOwner(
  game: GameState,
  identity: { playerId?: string; clientId?: string }
): { ownerId: string } | { error: string; status: number } {
  const { playerId, clientId } = identity;

  if (isSoloGameState(game)) {
    const soloPlayer = game.players[0];
    if (!soloPlayer || soloPlayer.isAI) {
      return { error: 'No human player found in solo game', status: 403 };
    }
    if (playerId && playerId !== soloPlayer.id) {
      return { error: 'Not authorized to access these notes', status: 403 };
    }
    return { ownerId: soloPlayer.id };
  }

  if (!playerId) {
    return { error: 'Player identity is required to access private notes', status: 403 };
  }

  const player = game.players.find(p => p.id === playerId && !p.isAI);
  if (!player) {
    return { error: 'Only seated human players can access private map notes', status: 403 };
  }

  // Enforce strict client identity isolation whenever the player seat is bound to a clientId
  if (player.clientId) {
    if (!clientId || player.clientId !== clientId) {
      return { error: 'Private notes are hidden from other players', status: 403 };
    }
  }

  return { ownerId: player.id };
}

export function listPlayerMapNotes(
  db: MapNotesDatabase,
  game: GameState,
  identity: { playerId?: string; clientId?: string }
): { success: true; notes: MapNote[] } | { success: false; error: string; status: number } {
  const auth = resolveAuthorizedNoteOwner(game, identity);
  if ('error' in auth) {
    return { success: false, error: auth.error, status: auth.status };
  }
  const notes = db[game.id]?.[auth.ownerId] || [];
  return { success: true, notes: notes.map(n => ({ ...n })) };
}

export function createPlayerMapNote(
  db: MapNotesDatabase,
  game: GameState,
  identity: { playerId?: string; clientId?: string },
  input: { x: number; y: number; text: string; color?: string }
):
  | { success: true; note: MapNote; notes: MapNote[] }
  | { success: false; error: string; status: number } {
  const auth = resolveAuthorizedNoteOwner(game, identity);
  if ('error' in auth) {
    return { success: false, error: auth.error, status: auth.status };
  }

  if (typeof input.x !== 'number' || typeof input.y !== 'number' || !Number.isFinite(input.x) || !Number.isFinite(input.y)) {
    return { success: false, error: 'Valid map coordinates are required', status: 400 };
  }

  const text = (input.text || '').trim().slice(0, MAX_NOTE_TEXT_LENGTH);
  if (!text) {
    return { success: false, error: 'Note text cannot be empty', status: 400 };
  }

  if (!db[game.id]) db[game.id] = {};
  if (!db[game.id][auth.ownerId]) db[game.id][auth.ownerId] = [];

  const list = db[game.id][auth.ownerId];
  if (list.length >= MAX_NOTES_PER_PLAYER_PER_GAME) {
    return {
      success: false,
      error: `Maximum of ${MAX_NOTES_PER_PLAYER_PER_GAME} map notes per game reached`,
      status: 400,
    };
  }

  const now = Date.now();
  const note: MapNote = {
    id: `note_${now}_${Math.random().toString(36).substring(2, 7)}`,
    x: Math.round(input.x * 10) / 10,
    y: Math.round(input.y * 10) / 10,
    text,
    color: normalizeMapNoteColor(input.color),
    createdAt: now,
    updatedAt: now,
  };

  list.push(note);
  return { success: true, note: { ...note }, notes: list.map(n => ({ ...n })) };
}

export function updatePlayerMapNote(
  db: MapNotesDatabase,
  game: GameState,
  identity: { playerId?: string; clientId?: string },
  noteId: string,
  patch: { text?: string; x?: number; y?: number; color?: string }
):
  | { success: true; note: MapNote; notes: MapNote[] }
  | { success: false; error: string; status: number } {
  const auth = resolveAuthorizedNoteOwner(game, identity);
  if ('error' in auth) {
    return { success: false, error: auth.error, status: auth.status };
  }

  const list = db[game.id]?.[auth.ownerId];
  const note = list?.find(n => n.id === noteId);
  if (!note || !list) {
    return { success: false, error: 'Map note not found', status: 404 };
  }

  if (patch.text !== undefined) {
    const trimmed = patch.text.trim().slice(0, MAX_NOTE_TEXT_LENGTH);
    if (!trimmed) {
      return { success: false, error: 'Note text cannot be empty', status: 400 };
    }
    note.text = trimmed;
  }

  if (patch.x !== undefined) {
    if (typeof patch.x !== 'number' || !Number.isFinite(patch.x)) {
      return { success: false, error: 'Invalid X coordinate', status: 400 };
    }
    note.x = Math.round(patch.x * 10) / 10;
  }

  if (patch.y !== undefined) {
    if (typeof patch.y !== 'number' || !Number.isFinite(patch.y)) {
      return { success: false, error: 'Invalid Y coordinate', status: 400 };
    }
    note.y = Math.round(patch.y * 10) / 10;
  }

  if (patch.color !== undefined) {
    note.color = normalizeMapNoteColor(patch.color);
  }

  note.updatedAt = Date.now();
  return { success: true, note: { ...note }, notes: list.map(n => ({ ...n })) };
}

export function deletePlayerMapNote(
  db: MapNotesDatabase,
  game: GameState,
  identity: { playerId?: string; clientId?: string },
  noteId: string
):
  | { success: true; notes: MapNote[] }
  | { success: false; error: string; status: number } {
  const auth = resolveAuthorizedNoteOwner(game, identity);
  if ('error' in auth) {
    return { success: false, error: auth.error, status: auth.status };
  }

  const list = db[game.id]?.[auth.ownerId];
  if (!list) {
    return { success: false, error: 'Map note not found', status: 404 };
  }

  const idx = list.findIndex(n => n.id === noteId);
  if (idx === -1) {
    return { success: false, error: 'Map note not found', status: 404 };
  }

  list.splice(idx, 1);
  return { success: true, notes: list.map(n => ({ ...n })) };
}

export function deleteAllMapNotesForGame(db: MapNotesDatabase, gameId: string): boolean {
  if (db[gameId]) {
    delete db[gameId];
    return true;
  }
  return false;
}
