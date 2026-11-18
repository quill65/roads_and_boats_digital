/**
 * Persistent browser-local client & match player identity helpers.
 * Used to recognize the match starter across Lobby & Game screens and reconnect cleanly.
 */

const CLIENT_ID_KEY = 'rb_client_id';
const MATCH_PLAYERS_KEY = 'rb_match_players';

export function getClientId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = `client_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

function readMatchPlayerMap(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(MATCH_PLAYERS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function normalizeGameKey(gameId: string): string {
  const trimmed = gameId.trim();
  return /^[0-9A-Fa-f]{8}$/.test(trimmed) ? trimmed.toUpperCase() : trimmed;
}

export function getSavedPlayerId(gameId: string): string | undefined {
  if (!gameId) return undefined;
  const map = readMatchPlayerMap();
  const normalized = normalizeGameKey(gameId);
  return map[normalized] || map[gameId];
}

export function savePlayerId(gameId: string, playerId: string): void {
  if (typeof window === 'undefined' || !gameId || !playerId) return;
  const map = readMatchPlayerMap();
  map[normalizeGameKey(gameId)] = playerId;
  localStorage.setItem(MATCH_PLAYERS_KEY, JSON.stringify(map));
}

export function clearSavedPlayerId(gameId: string): void {
  if (typeof window === 'undefined' || !gameId) return;
  const map = readMatchPlayerMap();
  const normalized = normalizeGameKey(gameId);
  let changed = false;
  if (normalized in map) {
    delete map[normalized];
    changed = true;
  }
  if (gameId in map) {
    delete map[gameId];
    changed = true;
  }
  if (changed) {
    localStorage.setItem(MATCH_PLAYERS_KEY, JSON.stringify(map));
  }
}
