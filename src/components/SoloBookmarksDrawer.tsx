/**
 * Solo Game Bookmarks Drawer
 * Allows solo players to save exact game states as named bookmarks
 * and return to any saved bookmark at any time.
 */

import React, { useState } from 'react';
import { GameBookmark, GameState, Phase } from '../game/types';
import { getDefaultBookmarkName } from '../game/engine';

interface SoloBookmarksDrawerProps {
  isOpen: boolean;
  gameState: GameState;
  isReadOnly?: boolean;
  onClose: () => void;
  onCreateBookmark: (name?: string, note?: string) => Promise<boolean> | void;
  onRestoreBookmark: (bookmarkId: string) => Promise<boolean> | void;
  onRenameBookmark: (bookmarkId: string, name: string, note?: string) => Promise<boolean> | void;
  onDeleteBookmark: (bookmarkId: string) => Promise<boolean> | void;
}

function formatPhaseLabel(phase: Phase): string {
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

function formatTimestamp(ts: number): string {
  try {
    const d = new Date(ts);
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (sameDay) {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

export const SoloBookmarksDrawer: React.FC<SoloBookmarksDrawerProps> = ({
  isOpen,
  gameState,
  isReadOnly = false,
  onClose,
  onCreateBookmark,
  onRestoreBookmark,
  onRenameBookmark,
  onDeleteBookmark,
}) => {
  const [nameInput, setNameInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [busyBookmarkId, setBusyBookmarkId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNote, setEditNote] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const bookmarks = gameState.bookmarks || [];
  const soloPlayer = gameState.players[0];
  const currentScore = soloPlayer?.score ?? 0;
  const defaultPlaceholder = getDefaultBookmarkName(gameState);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || isSaving) return;
    setIsSaving(true);
    try {
      const ok = await onCreateBookmark(nameInput.trim() || undefined, noteInput.trim() || undefined);
      if (ok !== false) {
        setNameInput('');
        setNoteInput('');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = async (bookmark: GameBookmark) => {
    if (isReadOnly || busyBookmarkId) return;
    setBusyBookmarkId(bookmark.id);
    try {
      await onRestoreBookmark(bookmark.id);
    } finally {
      setBusyBookmarkId(null);
    }
  };

  const handleStartEdit = (bookmark: GameBookmark) => {
    setConfirmDeleteId(null);
    setEditingId(bookmark.id);
    setEditName(bookmark.name);
    setEditNote(bookmark.note || '');
  };

  const handleSaveEdit = async (e: React.FormEvent, bookmarkId: string) => {
    e.preventDefault();
    if (isReadOnly || busyBookmarkId || !editName.trim()) return;
    setBusyBookmarkId(bookmarkId);
    try {
      const ok = await onRenameBookmark(bookmarkId, editName.trim(), editNote.trim());
      if (ok !== false) {
        setEditingId(null);
      }
    } finally {
      setBusyBookmarkId(null);
    }
  };

  const handleDelete = async (bookmarkId: string) => {
    if (isReadOnly || busyBookmarkId) return;
    setBusyBookmarkId(bookmarkId);
    try {
      const ok = await onDeleteBookmark(bookmarkId);
      if (ok !== false) {
        setConfirmDeleteId(null);
      }
    } finally {
      setBusyBookmarkId(null);
    }
  };

  return (
    <div className="fixed top-14 sm:top-16 right-2 sm:right-4 z-40 w-96 max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-4.5rem)] sm:max-h-[calc(100dvh-5.5rem)] bg-slate-900/95 backdrop-blur-md border border-amber-500/45 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-in">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3 bg-gradient-to-r from-slate-900 via-amber-950/60 to-slate-900 border-b border-amber-900/40 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl shrink-0">🔖</span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-amber-200 truncate">
              Solo Game Bookmarks
            </h3>
            <p className="text-[11px] text-amber-300/70">
              {bookmarks.length} saved {bookmarks.length === 1 ? 'state' : 'states'} · Return anytime
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Bookmarks"
          className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center text-xs shrink-0"
        >
          ✕
        </button>
      </div>

      {/* Save Current State Form */}
      {!isReadOnly && (
        <form
          onSubmit={handleCreateSubmit}
          className="px-4 sm:px-5 py-3 bg-slate-950/90 border-b border-slate-800 space-y-2 shrink-0"
        >
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="font-bold uppercase tracking-wider text-amber-300/90">
              Save Current State
            </span>
            <span className="font-mono text-slate-300">
              R{gameState.round}/{gameState.maxRounds} · {formatPhaseLabel(gameState.phase)} · {currentScore} VP
            </span>
          </div>

          <input
            type="text"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            maxLength={80}
            disabled={isSaving}
            placeholder={defaultPlaceholder}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none text-xs text-white placeholder:text-slate-500"
          />

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              maxLength={120}
              disabled={isSaving}
              placeholder="Optional note (e.g. before sawmill)"
              className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 focus:border-amber-500/70 focus:outline-none text-[11px] text-slate-200 placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={isSaving}
              className="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow transition-colors whitespace-nowrap disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : '🔖 Bookmark'}
            </button>
          </div>
        </form>
      )}

      {/* Bookmarks List */}
      <div className="flex-1 min-h-0 p-3.5 sm:p-4 overflow-y-auto space-y-2.5 text-xs">
        {bookmarks.length === 0 ? (
          <div className="py-10 px-3 text-center text-slate-400 flex flex-col items-center gap-2">
            <span className="text-2xl">🔖</span>
            <p className="text-xs font-semibold text-slate-200">No bookmarks saved yet</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Save a bookmark at any decision point to test alternate routes, factory orders, or research paths and return to that exact board state anytime.
            </p>
          </div>
        ) : (
          [...bookmarks].reverse().map(bm => {
            const isEditing = editingId === bm.id;
            const isConfirmingDelete = confirmDeleteId === bm.id;
            const isBusy = busyBookmarkId === bm.id;

            return (
              <div
                key={bm.id}
                className="p-3 rounded-xl bg-slate-950/85 border border-slate-800/90 hover:border-amber-500/45 transition-all flex flex-col gap-2"
              >
                {isEditing ? (
                  <form
                    onSubmit={e => handleSaveEdit(e, bm.id)}
                    className="space-y-2"
                  >
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      maxLength={80}
                      autoFocus
                      disabled={isBusy}
                      className="w-full px-2.5 py-1 rounded-md bg-slate-900 border border-amber-400 text-xs font-semibold text-white focus:outline-none"
                      placeholder="Bookmark name"
                    />
                    <input
                      type="text"
                      value={editNote}
                      onChange={e => setEditNote(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      maxLength={120}
                      disabled={isBusy}
                      className="w-full px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-[11px] text-slate-200 focus:outline-none"
                      placeholder="Optional note"
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        disabled={isBusy}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isBusy || !editName.trim()}
                        className="px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white leading-snug break-words">
                            {bm.name}
                          </span>
                        </div>
                        {bm.note && (
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug break-words">
                            {bm.note}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {formatTimestamp(bm.createdAt)}
                      </span>
                    </div>

                    {/* Snapshot State Summary */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-mono text-slate-300">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300 font-bold">
                        R{bm.round}/{bm.maxRounds}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-sky-300">
                        {bm.phase}
                      </span>
                      <span className="text-amber-400 font-bold">{bm.score} VP</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400">{bm.transporterCount} units</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400">{bm.buildingCount} bldgs</span>
                    </div>

                    {/* Actions */}
                    {!isReadOnly && (
                      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-800/70">
                        {isConfirmingDelete ? (
                          <div className="flex items-center justify-between w-full gap-2">
                            <span className="text-[11px] text-rose-300 font-semibold">
                              Delete this bookmark?
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                disabled={isBusy}
                                className="px-2 py-1 rounded-md text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(bm.id)}
                                disabled={isBusy}
                                className="px-2.5 py-1 rounded-md text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50"
                              >
                                {isBusy ? '...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(bm)}
                                disabled={isBusy}
                                className="px-2 py-1 rounded-md text-[11px] text-slate-400 hover:text-amber-300 hover:bg-slate-800/80 transition-colors"
                                title="Rename bookmark or edit note"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(bm.id)}
                                disabled={isBusy}
                                className="px-2 py-1 rounded-md text-[11px] text-slate-400 hover:text-rose-300 hover:bg-slate-800/80 transition-colors"
                                title="Delete bookmark"
                              >
                                🗑️
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRestore(bm)}
                              disabled={isBusy}
                              className="px-3 py-1 rounded-md text-[11px] font-bold text-amber-200 hover:text-slate-950 bg-amber-950/70 hover:bg-amber-400 border border-amber-600/70 transition-colors disabled:opacity-50"
                            >
                              {isBusy ? 'Restoring...' : '↩ Return Here'}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 sm:px-5 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between gap-2 shrink-0">
        <span className="truncate">Saved across reloads · Ctrl+Z undoes a restore</span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-300 hover:text-white font-semibold shrink-0"
        >
          Close
        </button>
      </div>
    </div>
  );
};
